"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, MapPin, Plus, Trash2, X } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type Appointment = {
  id: string;
  title: string;
  location: string | null;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  status: "scheduled" | "completed" | "cancelled";
  contact_id: string | null;
};

type Contact = { id: string; name: string; address_line1: string | null; postcode: string | null };

export function ScheduleManager() {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startValue, setStartValue] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appointmentsData, contactsData] = await Promise.all([
        apiFetch<Appointment[]>("/api/v1/appointments"),
        apiFetch<Contact[]>("/api/v1/contacts"),
      ]);
      setAppointments(appointmentsData);
      setContacts(contactsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load schedule.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const selectedAppointments = appointments
    .filter((appointment) => isSameDay(new Date(appointment.starts_at), selected))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  function openForm() {
    setStartValue(`${format(selected, "yyyy-MM-dd")}T09:00`);
    setShowForm(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      await apiFetch<Appointment>("/api/v1/appointments", {
        method: "POST",
        body: JSON.stringify({
          title: String(form.get("title") || ""),
          location: String(form.get("location") || ""),
          description: String(form.get("description") || ""),
          starts_at: new Date(String(form.get("starts_at"))).toISOString(),
          ends_at: form.get("ends_at") ? new Date(String(form.get("ends_at"))).toISOString() : null,
          all_day: false,
          contact_id: form.get("contact_id") ? String(form.get("contact_id")) : null,
          status: "scheduled",
        }),
      });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save appointment.");
    } finally {
      setSaving(false);
    }
  }

  async function complete(id: string, status: "completed" | "scheduled") {
    await apiFetch(`/api/v1/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this appointment?")) return;
    await apiFetch(`/api/v1/appointments/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Calendar</p>
            <h2 className="text-lg font-extrabold text-slate-900">{format(month, "MMMM yyyy")}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button className="rounded-lg p-2 hover:bg-slate-100" onClick={() => setMonth(subMonths(month, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100" onClick={() => setMonth(new Date())}>
              Today
            </button>
            <button className="rounded-lg p-2 hover:bg-slate-100" onClick={() => setMonth(addMonths(month, 1))}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayItems = appointments.filter((appointment) => isSameDay(new Date(appointment.starts_at), day));
            return (
              <button
                key={day.toISOString()}
                onClick={() => {
                  setSelected(day);
                  setShowForm(false);
                }}
                className={cn(
                  "relative flex min-h-[84px] flex-col items-start gap-1 border-b border-r border-slate-100 p-1.5 text-left transition hover:bg-slate-50",
                  !isSameMonth(day, month) && "bg-slate-50/50 text-slate-300",
                  isSameDay(day, selected) && "ring-2 ring-inset ring-brand-500",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    isToday(day) ? "bg-brand-600 text-white" : "text-slate-600",
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="w-full space-y-0.5">
                  {dayItems.slice(0, 2).map((appointment) => (
                    <span
                      key={appointment.id}
                      className="block truncate rounded bg-brand-100 px-1 py-0.5 text-[9px] font-semibold text-brand-800"
                    >
                      {format(new Date(appointment.starts_at), "HH:mm")} {appointment.title}
                    </span>
                  ))}
                  {dayItems.length > 2 && (
                    <span className="block text-[9px] font-semibold text-slate-400">+{dayItems.length - 2} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Selected day</p>
              <h2 className="text-lg font-extrabold text-slate-900">{format(selected, "EEEE d MMMM")}</h2>
            </div>
            <button onClick={openForm} className="btn-primary px-3 py-2 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading schedule...
            </div>
          ) : selectedAppointments.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              <CalendarDays className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              No jobs on this day.
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {selectedAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{appointment.title}</p>
                      <p className="text-xs text-slate-500">
                        {appointment.all_day ? "All day" : format(new Date(appointment.starts_at), "HH:mm")}
                        {appointment.ends_at ? ` - ${format(new Date(appointment.ends_at), "HH:mm")}` : ""}
                      </p>
                      {appointment.location && (
                        <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                          <MapPin className="h-3 w-3" /> {appointment.location}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => complete(appointment.id, appointment.status === "completed" ? "scheduled" : "completed")}
                        className={cn(
                          "rounded-lg px-2 py-1 text-[10px] font-bold",
                          appointment.status === "completed"
                            ? "bg-brand-100 text-brand-800"
                            : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {appointment.status === "completed" ? "Done" : "Mark done"}
                      </button>
                      <button
                        onClick={() => remove(appointment.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showForm && (
          <form onSubmit={onSubmit} className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">New appointment</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <div>
              <label className="label">Title</label>
              <input name="title" className="input" placeholder="Landlord CP12" required />
            </div>
            <div>
              <label className="label">Starts</label>
              <input
                name="starts_at"
                type="datetime-local"
                className="input"
                value={startValue}
                onChange={(event) => setStartValue(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Ends (optional)</label>
              <input name="ends_at" type="datetime-local" className="input" />
            </div>
            <div>
              <label className="label">Location</label>
              <input name="location" className="input" placeholder="42 Elm Road" />
            </div>
            <div>
              <label className="label">Contact</label>
              <select name="contact_id" className="input">
                <option value="">No contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea name="description" className="input" rows={2} placeholder="Access details, boiler info..." />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save appointment
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
