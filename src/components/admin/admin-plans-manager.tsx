"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Layers, Loader2, Plus, Save, Trash2, TriangleAlert } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import type { PlanRecord } from "@/lib/account";
import { TRIAL_PLAN_ID } from "@/lib/plans";
import { formatMoney } from "@/lib/utils";

type FormState = {
  id: string;
  name: string;
  description: string;
  monthly_price: string;
  yearly_price: string;
  currency: string;
  features: string;
  max_users: string;
  max_reports: string;
  sort_order: string;
  is_active: boolean;
  stripe_price_monthly: string;
  stripe_price_yearly: string;
};

const blankForm: FormState = {
  id: "",
  name: "",
  description: "",
  monthly_price: "0",
  yearly_price: "0",
  currency: "GBP",
  features: "",
  max_users: "1",
  max_reports: "",
  sort_order: "10",
  is_active: true,
  stripe_price_monthly: "",
  stripe_price_yearly: "",
};

function formFromPlan(plan: PlanRecord): FormState {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description || "",
    monthly_price: String(plan.monthly_price ?? 0),
    yearly_price: String(plan.yearly_price ?? 0),
    currency: plan.currency || "GBP",
    features: (plan.features || []).join("\n"),
    max_users: String(plan.max_users ?? 1),
    max_reports: plan.max_reports === null || plan.max_reports === undefined ? "" : String(plan.max_reports),
    sort_order: String(plan.sort_order ?? 0),
    is_active: plan.is_active !== false,
    stripe_price_monthly: plan.stripe_price_monthly || "",
    stripe_price_yearly: plan.stripe_price_yearly || "",
  };
}

export function AdminPlansManager({ plans }: { plans: PlanRecord[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(plans[0]?.id || "new");
  const [form, setForm] = useState<FormState>(plans[0] ? formFromPlan(plans[0]) : blankForm);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isNew = selectedId === "new";
  const isTrialPlan = !isNew && form.id === TRIAL_PLAN_ID;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectPlan(plan: PlanRecord) {
    setSelectedId(plan.id);
    setForm(formFromPlan(plan));
    setError(null);
    setMessage(null);
  }

  function newPlan() {
    setSelectedId("new");
    setForm(blankForm);
    setError(null);
    setMessage(null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy("save");
    setError(null);
    setMessage(null);

    const payload = {
      id: form.id.trim().toLowerCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      monthly_price: Number(form.monthly_price || 0),
      yearly_price: Number(form.yearly_price || 0),
      currency: form.currency.trim().toUpperCase(),
      features: form.features
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      max_users: Number(form.max_users || 1),
      max_reports: form.max_reports === "" ? null : Number(form.max_reports),
      sort_order: Number(form.sort_order || 0),
      is_active: form.is_active,
      stripe_price_monthly: form.stripe_price_monthly.trim(),
      stripe_price_yearly: form.stripe_price_yearly.trim(),
    };

    try {
      if (isNew) {
        await apiFetch("/api/v1/admin/plans", { method: "POST", body: JSON.stringify(payload) });
        setSelectedId(payload.id);
        setMessage("Plan created.");
      } else {
        const { id, ...patch } = payload;
        await apiFetch(`/api/v1/admin/plans/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
        setMessage("Plan updated.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save plan.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (isNew) return;
    if (!confirm(`Delete the plan "${form.name || form.id}"? This cannot be undone.`)) return;
    setBusy("delete");
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/api/v1/admin/plans/${form.id}`, { method: "DELETE" });
      setMessage("Plan deleted.");
      setSelectedId("new");
      setForm(blankForm);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete plan.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="card h-fit overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Layers className="h-4 w-4 text-brand-600" /> Plans ({plans.length})
          </h2>
          <button onClick={newPlan} className="btn-primary px-3 py-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> New plan
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => selectPlan(plan)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                selectedId === plan.id ? "bg-brand-50/70" : "hover:bg-slate-50"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {plan.name}
                  {plan.id === TRIAL_PLAN_ID && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-800">
                      Trial
                    </span>
                  )}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {plan.id} · {formatMoney(plan.monthly_price, plan.currency)}/mo ·{" "}
                  {formatMoney(plan.yearly_price, plan.currency)}/yr
                </p>
              </div>
              <span
                className={`badge shrink-0 ${
                  plan.is_active ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-500"
                }`}
              >
                {plan.is_active ? "Active" : "Hidden"}
              </span>
            </button>
          ))}
          {plans.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">No plans yet.</p>}
        </div>
      </div>

      <form onSubmit={onSubmit} className="card p-5">
        <h2 className="text-sm font-bold text-slate-900">{isNew ? "Create plan" : `Edit ${form.name || form.id}`}</h2>
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

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Plan ID</label>
            <input
              value={form.id}
              onChange={(event) => update("id", event.target.value)}
              className="input"
              placeholder="team"
              required
              disabled={!isNew}
            />
            <p className="mt-1 text-[10px] text-slate-400">Lowercase letters, numbers, - and _</p>
          </div>
          <div>
            <label className="label">Name</label>
            <input value={form.name} onChange={(event) => update("name", event.target.value)} className="input" required />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <input
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              className="input"
              placeholder="Shown on the pricing page"
            />
          </div>
          <div>
            <label className="label">Monthly price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monthly_price}
              onChange={(event) => update("monthly_price", event.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Yearly price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.yearly_price}
              onChange={(event) => update("yearly_price", event.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Currency</label>
            <input
              value={form.currency}
              onChange={(event) => update("currency", event.target.value.toUpperCase())}
              maxLength={3}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Sort order</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(event) => update("sort_order", event.target.value)}
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Features (one per line)</label>
            <textarea
              value={form.features}
              onChange={(event) => update("features", event.target.value)}
              className="input"
              rows={5}
              placeholder={"Unlimited certificates\nInvoices & quotes"}
            />
          </div>
          <div>
            <label className="label">Max users</label>
            <input
              type="number"
              min="1"
              value={form.max_users}
              onChange={(event) => update("max_users", event.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Max reports</label>
            <input
              type="number"
              min="0"
              value={form.max_reports}
              onChange={(event) => update("max_reports", event.target.value)}
              className="input"
              placeholder="Unlimited"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Stripe price IDs (optional)</label>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={form.stripe_price_monthly}
                onChange={(event) => update("stripe_price_monthly", event.target.value)}
                className="input text-xs"
                placeholder="price_... monthly"
              />
              <input
                value={form.stripe_price_yearly}
                onChange={(event) => update("stripe_price_yearly", event.target.value)}
                className="input text-xs"
                placeholder="price_... yearly"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              When blank, checkout falls back to the STRIPE_PRICE_* environment variables for this plan ID.
            </p>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => update("is_active", event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
            disabled={isTrialPlan}
          />
          Active and visible to customers
        </label>
        {isTrialPlan && (
          <p className="mt-1 text-[11px] text-amber-700">
            This is the plan new accounts trial on. It must stay active and cannot be deleted.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="btn-primary flex-1" disabled={busy !== null}>
            {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isNew ? "Create plan" : "Save changes"}
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={remove}
              className="btn-secondary text-red-600 hover:bg-red-50"
              disabled={busy !== null || isTrialPlan}
            >
              {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
