"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/client-api";

export function PaymentForm({ invoiceId, balance, currency = "GBP" }: { invoiceId: string; balance: number; currency?: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    const form = new FormData(event.currentTarget);

    try {
      await apiFetch(`/api/v1/invoices/${invoiceId}/payments`, {
        method: "POST",
        body: JSON.stringify({
          amount: Number(form.get("amount")),
          method: String(form.get("method") || "cash"),
          reference: String(form.get("reference") || ""),
          paid_at: form.get("paid_at") ? new Date(String(form.get("paid_at"))).toISOString() : undefined,
          notes: String(form.get("notes") || ""),
        }),
      });
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record payment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 print:hidden">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Banknote className="h-4 w-4 text-brand-600" /> Record a payment
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Outstanding:{" "}
        <strong className="text-slate-800">
          {new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(balance)}
        </strong>
      </p>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      {success && <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">Payment recorded.</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Amount</label>
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            className="input"
            defaultValue={balance > 0 ? balance.toFixed(2) : ""}
            required
          />
        </div>
        <div>
          <label className="label">Method</label>
          <select name="method" className="input" defaultValue="cash">
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="card">Card</option>
            <option value="bank">Bank transfer</option>
            <option value="izettle">iZettle</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Reference</label>
          <input name="reference" className="input" placeholder="Optional" />
        </div>
        <div>
          <label className="label">Paid at</label>
          <input name="paid_at" type="date" className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
      </div>
      <button type="submit" className="btn-primary mt-4 w-full" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />} Add payment
      </button>
    </form>
  );
}
