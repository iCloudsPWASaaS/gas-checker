"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { apiFetch } from "@/lib/client-api";

export function AdminRoleEditor({ profileId, role }: { profileId: string; role: string }) {
  const router = useRouter();
  const [value, setValue] = useState(role === "admin" ? "admin" : "owner");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/api/v1/admin/users/${profileId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: value }),
      });
      setMessage(`Role set to ${value}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update role.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <ShieldCheck className="h-4 w-4 text-brand-600" /> Account role label
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        This label is stored on the customer profile. The separate admin console login controls access to /admin.
      </p>
      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
      {message && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800">
          <CheckCircle2 className="h-3.5 w-3.5" /> {message}
        </p>
      )}
      <select
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="input mt-3"
      >
        <option value="owner">Owner (standard user)</option>
        <option value="admin">Admin</option>
      </select>
      <button onClick={save} disabled={saving || value === role} className="btn-secondary mt-3 w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Update role
      </button>
    </div>
  );
}
