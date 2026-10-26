"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, FileBadge2, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { reportTypeName } from "@/lib/report-types";

type Contact = { id: string; name: string; address_line1: string | null; postcode: string | null };

export function ReportForm({ type }: { type: string }) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    apiFetch<Contact[]>("/api/v1/contacts")
      .then(setContacts)
      .catch(() => setContacts([]));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      const report = await apiFetch<{ id: string }>("/api/v1/reports", {
        method: "POST",
        body: JSON.stringify({
          type,
          reference: form.get("reference") || "",
          certificate_number: form.get("certificate_number") || "",
          job_id: form.get("job_id") || "",
          status: form.get("status") || "draft",
          contact_id: form.get("contact_id") || null,
          property_name: form.get("property_name") || "",
          property_address_line1: form.get("property_address_line1") || "",
          property_address_line2: form.get("property_address_line2") || "",
          property_address_line3: form.get("property_address_line3") || "",
          property_postcode: form.get("property_postcode") || "",
          notes: form.get("notes") || "",
          completed_at: form.get("status") === "completed" ? new Date().toISOString() : null,
        }),
      });
      router.push(`/dashboard/reports/${report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create report.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <FileBadge2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Report type</p>
            <h2 className="text-sm font-bold text-slate-900">{reportTypeName(type)}</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Certificate reference</label>
            <input name="reference" className="input" placeholder="e.g. 2026-ELM-001" />
          </div>
          <div>
            <label className="label">Certificate number</label>
            <input name="certificate_number" className="input" placeholder="Serial / certificate number" />
          </div>
          <div>
            <label className="label">Job ID</label>
            <input name="job_id" className="input" placeholder="Optional job reference" />
          </div>
          <div>
            <label className="label">Status</label>
            <select name="status" className="input" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Saved contact</label>
            <select name="contact_id" className="input" defaultValue="">
              <option value="">No saved contact</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Property</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Property name / number</label>
            <input name="property_name" className="input" placeholder="42 Elm Road" />
          </div>
          <div>
            <label className="label">Address line 1</label>
            <input name="property_address_line1" className="input" />
          </div>
          <div>
            <label className="label">Address line 2</label>
            <input name="property_address_line2" className="input" />
          </div>
          <div>
            <label className="label">Address line 3</label>
            <input name="property_address_line3" className="input" />
          </div>
          <div>
            <label className="label">Postcode</label>
            <input name="property_postcode" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Site notes</label>
            <textarea name="notes" className="input" rows={4} placeholder="Appliances inspected, defects, warning notices..." />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Inspection date</label>
            <input type="date" className="input" defaultValue={today} readOnly />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBadge2 className="h-4 w-4" />}
          Create report
        </button>
      </div>
    </form>
  );
}
