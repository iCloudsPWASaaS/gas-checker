"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Printer, RotateCcw, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/client-api";

export function ReportActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(next: "completed" | "draft") {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/reports/${id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update report.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    setSaving(true);
    try {
      await apiFetch(`/api/v1/reports/${id}`, { method: "DELETE" });
      router.push("/dashboard/reports");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete report.");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      {status === "completed" ? (
        <button onClick={() => setStatus("draft")} className="btn-secondary py-2 text-xs" disabled={saving}>
          <RotateCcw className="h-3.5 w-3.5" /> Reopen
        </button>
      ) : (
        <button onClick={() => setStatus("completed")} className="btn-primary py-2 text-xs" disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Mark complete
        </button>
      )}
      <button onClick={() => window.print()} className="btn-secondary py-2 text-xs">
        <Printer className="h-3.5 w-3.5" /> Print
      </button>
      <button onClick={remove} className="btn-secondary py-2 text-xs text-red-600 hover:bg-red-50" disabled={saving}>
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
