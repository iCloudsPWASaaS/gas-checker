"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, Download, HardDriveDownload, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { formatDateTime } from "@/lib/utils";

type BackupHistory = {
  id: string;
  file_path: string;
  size_bytes: number | null;
  created_at: string;
};

type BackupData = {
  data: {
    contacts?: unknown[];
    documents?: unknown[];
    appointments?: unknown[];
    reminders?: unknown[];
    gas_reports?: unknown[];
  };
};

export function BackupManager() {
  const router = useRouter();
  const [history, setHistory] = useState<BackupHistory[]>([]);
  const [backup, setBackup] = useState<BackupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ backup: BackupData; history: BackupHistory[] }>("/api/v1/backup");
      setBackup(data.backup);
      setHistory(data.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load backup information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function backupToCloud() {
    setBusy("cloud");
    setError(null);
    setMessage(null);
    try {
      const result = await apiFetch<{ backup: BackupHistory }>("/api/v1/backup", { method: "POST" });
      setMessage(`Backup stored at ${formatDateTime(result.backup.created_at)}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create backup.");
    } finally {
      setBusy(null);
    }
  }

  async function restoreFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (mode === "replace" && !confirm("Replace ALL current contacts, documents, reports and appointments? This cannot be undone.")) {
      event.target.value = "";
      return;
    }

    setBusy("restore");
    setError(null);
    setMessage(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupData;
      const result = await apiFetch<{ counts: Record<string, number> }>("/api/v1/backup/restore", {
        method: "POST",
        body: JSON.stringify({ backup: parsed, mode }),
      });
      setMessage(
        `Restore complete: ${Object.entries(result.counts)
          .map(([key, value]) => `${value} ${key.replaceAll("_", " ")}`)
          .join(", ")}.`,
      );
      router.refresh();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore backup. Check the file and try again.");
    } finally {
      setBusy(null);
      event.target.value = "";
    }
  }

  const counts = {
    contacts: backup?.data.contacts?.length || 0,
    documents: backup?.data.documents?.length || 0,
    appointments: backup?.data.appointments?.length || 0,
    reminders: backup?.data.reminders?.length || 0,
    reports: backup?.data.gas_reports?.length || 0,
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <CloudUpload className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-extrabold text-slate-900">Back up</h2>
        <p className="mt-1 text-sm text-slate-500">
          Save a complete copy of your contacts, documents, reports and schedule to secure storage.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
          {Object.entries(counts).map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 px-2 py-2 text-center">
              <p className="font-extrabold text-slate-900">{value}</p>
              <p className="capitalize text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={backupToCloud} className="btn-primary" disabled={busy !== null}>
            {busy === "cloud" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />} Back up now
          </button>
          <a href="/api/v1/backup?raw=true" className="btn-secondary">
            <Download className="h-4 w-4" /> Download JSON
          </a>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Cloud backups</h3>
          {loading ? (
            <p className="mt-2 text-xs text-slate-400">Loading...</p>
          ) : history.length === 0 ? (
            <p className="mt-2 text-xs text-slate-400">No cloud backups yet.</p>
          ) : (
            <div className="mt-2 divide-y divide-slate-100">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 text-xs">
                  <span className="text-slate-600">{formatDateTime(item.created_at)}</span>
                  <span className="text-slate-400">
                    {item.size_bytes ? `${Math.round(item.size_bytes / 1024)} KB` : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <HardDriveDownload className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-extrabold text-slate-900">Restore</h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload a Gas Checker JSON backup. Merge keeps your current data; replace clears it first.
        </p>
        <div className="mt-4 flex rounded-xl bg-slate-100 p-1">
          {(["merge", "replace"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold capitalize ${
                mode === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 px-4 py-8 text-center hover:border-brand-300 hover:bg-brand-50/40">
          {busy === "restore" ? (
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          ) : (
            <RotateCcw className="h-6 w-6 text-slate-400" />
          )}
          <span className="mt-2 text-sm font-semibold text-slate-700">
            {busy === "restore" ? "Restoring..." : "Choose backup file"}
          </span>
          <span className="mt-1 text-xs text-slate-400">JSON export from Gas Checker</span>
          <input type="file" accept="application/json,.json" className="hidden" onChange={restoreFile} disabled={busy !== null} />
        </label>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          Restoring never changes your login or subscription. Documents are given new IDs and quote/invoice numbers are
          kept unique.
        </div>
      </div>

      {(error || message) && (
        <div className="lg:col-span-2">
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {message && <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">{message}</p>}
        </div>
      )}
    </div>
  );
}
