"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Save, TriangleAlert } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import type { PlatformSettings } from "@/lib/platform-settings";

export function AdminSettingsForm({ settings }: { settings: PlatformSettings }) {
  const router = useRouter();
  const [signupEnabled, setSignupEnabled] = useState(settings.signup_enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);

    try {
      await apiFetch("/api/v1/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          support_email: String(form.get("support_email") || ""),
          default_currency: String(form.get("default_currency") || "GBP").toUpperCase(),
          trial_days: Number(form.get("trial_days") || 30),
          signup_enabled: signupEnabled,
          announcement: String(form.get("announcement") || ""),
        }),
      });
      setMessage("Platform settings saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save platform settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        {error && (
          <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}
        {message && (
          <p className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-3 text-sm text-brand-800">
            <CheckCircle2 className="h-4 w-4" /> {message}
          </p>
        )}

        <div className="card p-5">
          <h2 className="text-sm font-bold text-slate-900">Signup & trial</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">New account signups</label>
              <button
                type="button"
                onClick={() => setSignupEnabled((value) => !value)}
                className={`relative h-10 w-full rounded-xl px-3 text-left text-xs font-bold ${
                  signupEnabled ? "bg-brand-50 text-brand-800" : "bg-slate-100 text-slate-500"
                }`}
              >
                {signupEnabled ? "Open - anyone can sign up" : "Closed - signups disabled"}
                <span
                  className={`absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full ${
                    signupEnabled ? "bg-brand-600" : "bg-slate-400"
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="label">Default trial days</label>
              <input
                name="trial_days"
                type="number"
                min="0"
                max="365"
                defaultValue={settings.trial_days}
                className="input"
                required
              />
              <p className="mt-1 text-[10px] text-slate-400">Applied to new subscriptions created by signup or admin.</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-bold text-slate-900">Contact & currency</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Support email</label>
              <input
                name="support_email"
                type="email"
                defaultValue={settings.support_email || ""}
                className="input"
                placeholder="support@example.com"
              />
            </div>
            <div>
              <label className="label">Default currency</label>
              <input
                name="default_currency"
                defaultValue={settings.default_currency}
                maxLength={3}
                className="input"
                required
              />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-bold text-slate-900">Announcement banner</h2>
          <p className="mt-1 text-xs text-slate-500">Shown at the top of every customer dashboard. Leave blank to hide.</p>
          <textarea
            name="announcement"
            defaultValue={settings.announcement || ""}
            className="input mt-3"
            rows={3}
            placeholder="Scheduled maintenance on Sunday 22:00-23:00"
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save platform settings
          </button>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card p-5 text-xs leading-relaxed text-slate-600">
          <h2 className="text-sm font-bold text-slate-900">How these settings apply</h2>
          <ul className="mt-3 space-y-2">
            <li>Signup toggle is checked by both the web and Flutter signup endpoints.</li>
            <li>Trial days are used when provisioning new accounts or creating a trial in admin.</li>
            <li>Announcement appears in the dashboard shell immediately after saving.</li>
            <li>Platform settings are stored in the server-only <code className="code">platform_settings</code> table.</li>
          </ul>
        </div>
        <div className="card p-5 text-xs text-slate-500">
          <p className="font-bold text-slate-900">Last updated</p>
          <p className="mt-1">{settings.updated_at ? new Date(settings.updated_at).toLocaleString("en-GB") : "Never"}</p>
          <p className="mt-3 font-bold text-slate-900">Admin access</p>
          <p className="mt-1">
            The console uses a separate login from <code className="code">ADMIN_EMAILS</code> and{" "}
            <code className="code">ADMIN_PASSWORD</code>. Customer Supabase accounts are not used.
          </p>
        </div>
      </aside>
    </form>
  );
}
