"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Printer, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/client-api";

const statuses: Record<string, { value: string; label: string }[]> = {
  invoice: [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "overdue", label: "Overdue" },
    { value: "partially_paid", label: "Partially paid" },
    { value: "paid", label: "Paid" },
    { value: "cancelled", label: "Cancelled" },
  ],
  quote: [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "accepted", label: "Accepted" },
    { value: "declined", label: "Declined" },
    { value: "expired", label: "Expired" },
  ],
};

export function DocumentActions({
  id,
  type,
  status,
}: {
  id: string;
  type: "invoice" | "quote";
  status: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(next: string) {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/${type}s/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete this ${type}? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await apiFetch(`/api/v1/${type}s/${id}`, { method: "DELETE" });
      router.push(`/dashboard/${type}s`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <select
        className="input w-auto py-2 text-xs"
        value={status}
        onChange={(event) => updateStatus(event.target.value)}
        disabled={saving}
      >
        {statuses[type].map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button onClick={() => window.print()} className="btn-secondary py-2 text-xs">
        <Printer className="h-3.5 w-3.5" /> Print
      </button>
      <button onClick={remove} className="btn-secondary py-2 text-xs text-red-600 hover:bg-red-50" disabled={saving}>
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
