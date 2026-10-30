"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { cn, formatDateTime } from "@/lib/utils";

type JobStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
type JobPriority = "low" | "normal" | "urgent";

type Job = {
  id: string;
  title: string;
  reference: string | null;
  job_type: string;
  status: JobStatus;
  priority: JobPriority;
  scheduled_at: string | null;
  completed_at: string | null;
  engineer: string | null;
  description: string | null;
  notes: string | null;
  contact_id: string | null;
  property_id: string | null;
};

type Property = { id: string; name: string; address_line1: string | null; postcode: string | null };
type Contact = { id: string; name: string };

const jobTypes = [
  { value: "gas_safety", label: "Gas safety" },
  { value: "service", label: "Service" },
  { value: "breakdown", label: "Breakdown" },
  { value: "installation", label: "Installation" },
  { value: "quote_visit", label: "Quote visit" },
  { value: "heat_pump", label: "Heat pump" },
  { value: "oil", label: "Oil" },
  { value: "other", label: "Other" },
];

const statusLabels: Record<JobStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusTones: Record<JobStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-brand-100 text-brand-800",
  cancelled: "bg-slate-200 text-slate-600",
};

const priorityTones: Record<JobPriority, string> = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-blue-100 text-blue-700",
  urgent: "bg-red-100 text-red-700",
};

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function jobTypeLabel(value: string) {
  return jobTypes.find((item) => item.value === value)?.label || value.replaceAll("_", " ");
}

export function JobsManager() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | JobStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobRows, propertyRows, contactRows] = await Promise.all([
        apiFetch<Job[]>("/api/v1/jobs?limit=200"),
        apiFetch<Property[]>("/api/v1/properties?limit=200"),
        apiFetch<Contact[]>("/api/v1/contacts?limit=200"),
      ]);
      setJobs(jobRows);
      setProperties(propertyRows);
      setContacts(contactRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const propertyMap = useMemo(() => new Map(properties.map((item) => [item.id, item])), [properties]);
  const contactMap = useMemo(() => new Map(contacts.map((item) => [item.id, item])), [contacts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (statusFilter !== "all" && job.status !== statusFilter) return false;
      if (!term) return true;
      const property = job.property_id ? propertyMap.get(job.property_id) : null;
      const contact = job.contact_id ? contactMap.get(job.contact_id) : null;
      return [job.title, job.reference, job.description, property?.name, property?.postcode, contact?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [jobs, search, statusFilter, propertyMap, contactMap]);

  const counts = useMemo(
    () => ({
      scheduled: jobs.filter((job) => job.status === "scheduled").length,
      in_progress: jobs.filter((job) => job.status === "in_progress").length,
      completed: jobs.filter((job) => job.status === "completed").length,
      urgent: jobs.filter((job) => job.priority === "urgent" && !["completed", "cancelled"].includes(job.status)).length,
    }),
    [jobs],
  );

  function startCreate() {
    setEditing(null);
    setFormKey((key) => key + 1);
    setShowForm(true);
  }

  function startEdit(job: Job) {
    setEditing(job);
    setFormKey((key) => key + 1);
    setShowForm(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const status = String(form.get("status") || "scheduled") as JobStatus;
    const scheduled = String(form.get("scheduled_at") || "");

    const payload = {
      title: String(form.get("title") || ""),
      reference: String(form.get("reference") || ""),
      job_type: String(form.get("job_type") || "gas_safety"),
      status,
      priority: String(form.get("priority") || "normal"),
      scheduled_at: scheduled ? new Date(scheduled).toISOString() : null,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      contact_id: form.get("contact_id") ? String(form.get("contact_id")) : null,
      property_id: form.get("property_id") ? String(form.get("property_id")) : null,
      engineer: String(form.get("engineer") || ""),
      description: String(form.get("description") || ""),
      notes: String(form.get("notes") || ""),
    };

    try {
      if (editing) {
        await apiFetch(`/api/v1/jobs/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/v1/jobs", { method: "POST", body: JSON.stringify(payload) });
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save job.");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(job: Job, status: JobStatus) {
    try {
      await apiFetch(`/api/v1/jobs/${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update job.");
    }
  }

  async function remove(job: Job) {
    if (!confirm(`Delete "${job.title}"?`)) return;
    try {
      await apiFetch(`/api/v1/jobs/${job.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete job.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input pl-9"
              placeholder="Search jobs, references, addresses..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | JobStatus)}
            className="input sm:w-44"
          >
            <option value="all">All statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button onClick={startCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Add job
          </button>
        </div>

        {error && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {loading ? (
          <div className="card flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading jobs...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <Briefcase className="mb-3 h-9 w-9 text-slate-300" />
            <p className="text-sm font-bold text-slate-900">No jobs found</p>
            <p className="mt-1 text-xs text-slate-500">Schedule your first job and keep the address, customer and status together.</p>
            <button onClick={startCreate} className="btn-secondary mt-4">
              <Plus className="h-4 w-4" /> Add job
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((job) => {
              const property = job.property_id ? propertyMap.get(job.property_id) : null;
              const contact = job.contact_id ? contactMap.get(job.contact_id) : null;
              return (
                <div key={job.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{job.title}</p>
                        <span className={cn("badge", statusTones[job.status])}>{statusLabels[job.status]}</span>
                        <span className={cn("badge", priorityTones[job.priority])}>{job.priority}</span>
                      </div>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {jobTypeLabel(job.job_type)}
                        {job.reference ? ` · ${job.reference}` : ""}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-slate-500">
                        {job.scheduled_at && (
                          <p className="flex items-center gap-1.5">
                            <CalendarDays className="h-3 w-3" /> {formatDateTime(job.scheduled_at)}
                          </p>
                        )}
                        {property && (
                          <p className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" /> {property.name}
                            {property.postcode ? `, ${property.postcode}` : ""}
                          </p>
                        )}
                        {contact && (
                          <p className="flex items-center gap-1.5">
                            <UserRound className="h-3 w-3" /> {contact.name}
                          </p>
                        )}
                        {job.engineer && <p className="text-slate-400">Engineer: {job.engineer}</p>}
                      </div>
                      {job.description && <p className="mt-2 line-clamp-2 text-xs text-slate-500">{job.description}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {job.status === "completed" ? (
                        <button
                          onClick={() => setStatus(job, "scheduled")}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="Reopen job"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setStatus(job, "completed")}
                          className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-700"
                          title="Mark complete"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(job)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="Edit job"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(job)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete job"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm ? (
        <form key={formKey} onSubmit={onSubmit} className="card h-fit space-y-3 p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{editing ? "Edit job" : "New job"}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label className="label">Job title</label>
            <input name="title" className="input" defaultValue={editing?.title || ""} required placeholder="Landlord CP12" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Type</label>
              <select name="job_type" className="input" defaultValue={editing?.job_type || "gas_safety"}>
                {jobTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Reference</label>
              <input name="reference" className="input" defaultValue={editing?.reference || ""} placeholder="Optional" />
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" className="input" defaultValue={editing?.status || "scheduled"}>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select name="priority" className="input" defaultValue={editing?.priority || "normal"}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Scheduled</label>
              <input
                name="scheduled_at"
                type="datetime-local"
                className="input"
                defaultValue={toLocalInput(editing?.scheduled_at)}
              />
            </div>
            <div>
              <label className="label">Job address</label>
              <select name="property_id" className="input" defaultValue={editing?.property_id || ""}>
                <option value="">No address</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Customer</label>
              <select name="contact_id" className="input" defaultValue={editing?.contact_id || ""}>
                <option value="">No customer</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Engineer</label>
              <input name="engineer" className="input" defaultValue={editing?.engineer || ""} placeholder="Optional" />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" className="input" rows={2} defaultValue={editing?.description || ""} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea name="notes" className="input" rows={2} defaultValue={editing?.notes || ""} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? "Save changes" : "Create job"}
          </button>
        </form>
      ) : (
        <div className="card h-fit space-y-4 p-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Job board</h3>
            <p className="mt-1 text-xs text-slate-500">Keep the customer, address and work status together.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-blue-50 p-3">
              <p className="text-lg font-extrabold text-blue-800">{counts.scheduled}</p>
              <p className="text-[11px] font-semibold text-blue-700">Scheduled</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-lg font-extrabold text-amber-800">{counts.in_progress}</p>
              <p className="text-[11px] font-semibold text-amber-700">In progress</p>
            </div>
            <div className="rounded-xl bg-brand-50 p-3">
              <p className="text-lg font-extrabold text-brand-800">{counts.completed}</p>
              <p className="text-[11px] font-semibold text-brand-700">Completed</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3">
              <p className="text-lg font-extrabold text-red-800">{counts.urgent}</p>
              <p className="text-[11px] font-semibold text-red-700">Urgent open</p>
            </div>
          </div>
          {counts.urgent > 0 && (
            <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-[11px] text-red-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> You have urgent jobs that are not completed.
            </p>
          )}
          <button onClick={startCreate} className="btn-secondary w-full">
            <Plus className="h-4 w-4" /> Add job
          </button>
        </div>
      )}
    </div>
  );
}
