"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react";
import { apiFetch } from "@/lib/client-api";

export function AdminLoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      await apiFetch("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: String(form.get("email") || ""),
          password: String(form.get("password") || ""),
        }),
      });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-700">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      <div>
        <label className="label" htmlFor="admin-email">
          Admin email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          className="input"
          placeholder="admin@gaschecker.app"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="admin-password">
          Password
        </label>
        <div className="relative">
          <input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="input pr-11"
            placeholder="Enter your admin password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />} Sign in to admin
      </button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5" /> Separate admin credentials. Customer accounts are not used here.
      </p>
    </form>
  );
}
