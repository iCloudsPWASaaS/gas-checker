"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { BellRing, Check, Loader2, Plus, Trash2, TriangleAlert } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { cn, formatDate } from "@/lib/utils";

type Reminder = {
  id: string;
  title: string;
  kind: "gas_report" | "invoice" | "custom";
  due_date: string | null;
  status: "pending" | "done" | "dismissed";
  notes: string | null;
};

type Summary = {
  counts: { overdue_gas_reports: number; overdue_invoices: number };
};

const kindLabels: Record<string, string> = {
  gas_report: "Gas report",
  invoice: "Invoice",
  custom: "Custom",
};

export function RemindersManager() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filter, setFilter] = useState<"pending" | "done" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [remindersData, summaryData] = await Promise.all([
        apiFetch<Reminder[]>("/api/v1/reminders"),
        apiFetch<Summary>("/api/v1/dashboard/summary"),
      ]);
      setReminders(remindersData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load reminders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = reminders.filter((reminder) => (filter === "all" ? true : reminder.status === filter));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await apiFetch("/api/v1/reminders", {
        method: "POST",
        body: JSON.stringify({
          title: String(form.get("title") || ""),
          kind: String(form.get("kind") || "custom"),
          due_date: String(form.get("due_date") || "") || null,
          notes: String(form.get("notes") || ""),
          status: "pending",
        }),
      });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save reminder.");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(reminder: Reminder, status: "pending" | "done") {
    await apiFetch(`/api/v1/reminders/${reminder.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function remove(reminder: Reminder) {
    if (!confirm("Delete this reminder?")) return;
    await apiFetch(`/api/v1/reminders/${reminder.id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            {(["pending", "done", "all"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize",
                  filter === value ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50",
                )}
              >
                {value}
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm((value) => !value)} className="btn-primary">
            <Plus className="h-4 w-4" /> Add reminder
          </button>
        </div>

        {error && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {loading ? (
          <div className="card flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading reminders...
          </div>
        ) : visible.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <BellRing className="mb-3 h-9 w-9 text-slate-300" />
            <p className="text-sm font-bold text-slate-900">Nothing here</p>
            <p className="mt-1 text-xs text-slate-500">
              {filter === "pending" ? "You are all caught up." : "No reminders in this view."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((reminder) => (
              <div key={reminder.id} className="card flex items-start gap-3 p-4">
                <button
                  onClick={() => setStatus(reminder, reminder.status === "done" ? "pending" : "done")}
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                    reminder.status === "done"
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-300 text-transparent hover:border-brand-500",
                  )}
                  title="Toggle done"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-bold",
                      reminder.status === "done" ? "text-slate-400 line-through" : "text-slate-900",
                    )}
                  >
                    {reminder.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="badge bg-slate-100 text-slate-600">{kindLabels[reminder.kind]}</span>
                    {reminder.due_date && <span>Due {formatDate(reminder.due_date)}</span>}
                  </div>
                  {reminder.notes && <p className="mt-1 text-xs text-slate-500">{reminder.notes}</p>}
                </div>
                <button
                  onClick={() => remove(reminder)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <TriangleAlert className="h-4 w-4 text-amber-500" /> Overdue items
          </h3>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-red-50 px-3 py-2.5 text-xs">
              <span className="font-semibold text-red-800">Overdue gas reports</span>
              <span className="font-bold text-red-700">{summary?.counts.overdue_gas_reports || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5 text-xs">
              <span className="font-semibold text-amber-800">Overdue invoices</span>
              <span className="font-bold text-amber-700">{summary?.counts.overdue_invoices || 0}</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Gas reports are considered overdue after 30 days in draft. Invoices become overdue once the due date has
            passed.
          </p>
        </div>

        {showForm && (
          <form onSubmit={onSubmit} className="card space-y-3 p-5">
            <h3 className="text-sm font-bold text-slate-900">New reminder</h3>
            <div>
              <label className="label">Title</label>
              <input name="title" className="input" placeholder="Follow up with landlord" required />
            </div>
            <div>
              <label className="label">Type</label>
              <select name="kind" className="input" defaultValue="custom">
                <option value="custom">Custom</option>
                <option value="gas_report">Gas report</option>
                <option value="invoice">Invoice</option>
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input name="due_date" type="date" className="input" />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea name="notes" className="input" rows={2} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save reminder
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
