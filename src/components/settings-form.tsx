"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { apiFetch } from "@/lib/client-api";

export function SettingsForm({ settings }: { settings: Record<string, unknown> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(Boolean(settings.auto_sync ?? true));

  function value(key: string) {
    const item = settings[key];
    return typeof item === "string" ? item : item === null || item === undefined ? "" : String(item);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      await apiFetch("/api/v1/settings", {
        method: "PATCH",
        body: JSON.stringify({
          company_name: form.get("company_name") || "",
          company_address_line1: form.get("company_address_line1") || "",
          company_address_line2: form.get("company_address_line2") || "",
          company_address_line3: form.get("company_address_line3") || "",
          postcode: form.get("postcode") || "",
          phone: form.get("phone") || "",
          email: form.get("email") || "",
          gas_engineer_id: form.get("gas_engineer_id") || "",
          engineer_position: form.get("engineer_position") || "",
          engineer_signature_url: form.get("engineer_signature_url") || "",
          email_message: form.get("email_message") || "",
          email_cc: form.get("email_cc") || "",
          email_bcc: form.get("email_bcc") || "",
          certificate_prefix: form.get("certificate_prefix") || "",
          invoice_prefix: form.get("invoice_prefix") || "",
          quote_prefix: form.get("quote_prefix") || "",
          currency: form.get("currency") || "GBP",
          vat_rate: Number(form.get("vat_rate") || 0),
          auto_sync: autoSync,
        }),
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>}
      {saved && (
        <p className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-3 text-sm text-brand-800">
          <CheckCircle2 className="h-4 w-4" /> Settings saved.
        </p>
      )}

      <div className="card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Auto sync</h2>
            <p className="text-xs text-slate-500">Keep mobile and web data in sync when online.</p>
          </div>
          <button
            type="button"
            onClick={() => setAutoSync((value) => !value)}
            className={`relative h-7 w-12 rounded-full transition ${autoSync ? "bg-brand-600" : "bg-slate-300"}`}
            aria-pressed={autoSync}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${autoSync ? "left-6" : "left-1"}`}
            />
          </button>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Company info</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Company name</label>
            <input name="company_name" className="input" defaultValue={value("company_name")} placeholder="IClouds" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Company address line 1</label>
            <input name="company_address_line1" className="input" defaultValue={value("company_address_line1")} />
          </div>
          <div>
            <label className="label">Address line 2</label>
            <input name="company_address_line2" className="input" defaultValue={value("company_address_line2")} />
          </div>
          <div>
            <label className="label">Address line 3</label>
            <input name="company_address_line3" className="input" defaultValue={value("company_address_line3")} />
          </div>
          <div>
            <label className="label">Postcode</label>
            <input name="postcode" className="input" defaultValue={value("postcode")} />
          </div>
          <div>
            <label className="label">Phone number</label>
            <input name="phone" className="input" defaultValue={value("phone")} />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" className="input" defaultValue={value("email")} />
          </div>
          <div>
            <label className="label">Gas engineer ID</label>
            <input name="gas_engineer_id" className="input" defaultValue={value("gas_engineer_id")} placeholder="Gas Safe ID" />
          </div>
          <div>
            <label className="label">Engineer position</label>
            <input name="engineer_position" className="input" defaultValue={value("engineer_position")} placeholder="Gas Engineer" />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Email & prefixes</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Email message</label>
            <textarea
              name="email_message"
              className="input"
              rows={2}
              defaultValue={value("email_message") || "Hi, here is your gas safety certificate."}
            />
          </div>
          <div>
            <label className="label">Email CC</label>
            <input name="email_cc" className="input" defaultValue={value("email_cc")} />
          </div>
          <div>
            <label className="label">Email BCC</label>
            <input name="email_bcc" className="input" defaultValue={value("email_bcc")} />
          </div>
          <div>
            <label className="label">Certificate prefix</label>
            <input name="certificate_prefix" className="input" defaultValue={value("certificate_prefix") || "GC"} />
          </div>
          <div>
            <label className="label">Invoice prefix</label>
            <input name="invoice_prefix" className="input" defaultValue={value("invoice_prefix") || "INV"} />
          </div>
          <div>
            <label className="label">Quote prefix</label>
            <input name="quote_prefix" className="input" defaultValue={value("quote_prefix") || "QT"} />
          </div>
          <div>
            <label className="label">Currency</label>
            <select name="currency" className="input" defaultValue={value("currency") || "GBP"}>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div>
            <label className="label">VAT rate (%)</label>
            <input name="vat_rate" type="number" min="0" max="100" step="0.01" className="input" defaultValue={value("vat_rate") || "0"} />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Engineer signature</h2>
        <label className="label">Signature image URL</label>
        <input
          name="engineer_signature_url"
          className="input"
          defaultValue={value("engineer_signature_url")}
          placeholder="https://... (upload via the API)"
        />
        <p className="mt-2 text-[11px] text-slate-500">
          Upload a signature image with <code className="rounded bg-slate-100 px-1">POST /api/v1/uploads</code> using the
          folder <code className="rounded bg-slate-100 px-1">signatures</code>, then paste the signed URL here.
        </p>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save settings
        </button>
      </div>
    </form>
  );
}
