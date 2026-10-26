"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, CheckCircle2, Loader2, RefreshCw, Save, TriangleAlert } from "lucide-react";
import { apiFetch } from "@/lib/client-api";

type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  billing_interval: "monthly" | "yearly";
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

type Plan = { id: string; name: string };

const statuses = ["trialing", "active", "past_due", "canceled", "expired", "incomplete"] as const;

function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (input: number) => String(input).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

function toIso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function AdminSubscriptionEditor({
  userId,
  subscription,
  plans,
}: {
  userId: string;
  subscription: Subscription | null;
  plans: Plan[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    plan_id: subscription?.plan_id || plans.find((plan) => plan.id === "pro")?.id || plans[0]?.id || "",
    status: subscription?.status || "trialing",
    billing_interval: subscription?.billing_interval || "monthly",
    trial_start: toLocalInput(subscription?.trial_start),
    trial_end: toLocalInput(subscription?.trial_end),
    current_period_start: toLocalInput(subscription?.current_period_start),
    current_period_end: toLocalInput(subscription?.current_period_end),
    cancel_at_period_end: subscription?.cancel_at_period_end || false,
    stripe_customer_id: subscription?.stripe_customer_id || "",
    stripe_subscription_id: subscription?.stripe_subscription_id || "",
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function payload() {
    return {
      plan_id: form.plan_id,
      status: form.status,
      billing_interval: form.billing_interval,
      trial_start: toIso(form.trial_start),
      trial_end: toIso(form.trial_end),
      current_period_start: toIso(form.current_period_start),
      current_period_end: toIso(form.current_period_end),
      cancel_at_period_end: form.cancel_at_period_end,
      stripe_customer_id: form.stripe_customer_id || null,
      stripe_subscription_id: form.stripe_subscription_id || null,
    };
  }

  async function save(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy("save");
    setError(null);
    setMessage(null);
    try {
      const body = payload();
      if (subscription) {
        await apiFetch(`/api/v1/admin/subscriptions/${subscription.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/v1/admin/subscriptions", {
          method: "POST",
          body: JSON.stringify({ ...body, user_id: userId }),
        });
      }
      setMessage(subscription ? "Subscription updated." : "Subscription created.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save subscription.");
    } finally {
      setBusy(null);
    }
  }

  async function quick(action: string, patch: Record<string, unknown>) {
    if (!subscription) return;
    setBusy(action);
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/api/v1/admin/subscriptions/${subscription.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setMessage(`${action === "extend" ? "Trial extended" : action === "cancel" ? "Cancellation scheduled" : "Subscription updated"}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update subscription.");
    } finally {
      setBusy(null);
    }
  }

  const active = form.status === "active";
  const trialing = form.status === "trialing";

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Subscription</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {subscription ? "Override the account's plan, status and billing dates." : "This user has no subscription yet."}
          </p>
        </div>
        {subscription && (
          <span className="badge bg-slate-100 text-slate-600">{subscription.status.replaceAll("_", " ")}</span>
        )}
      </div>

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

      {subscription && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              quick("extend", {
                status: "trialing",
                trial_end: new Date(Date.now() + 7 * 86400000).toISOString(),
                cancel_at_period_end: false,
              })
            }
            className="btn-secondary px-3 py-1.5 text-[11px]"
            disabled={busy !== null}
          >
            {busy === "extend" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarPlus className="h-3 w-3" />} Extend trial 7d
          </button>
          <button
            type="button"
            onClick={() =>
              quick("activate", {
                status: "active",
                current_period_end: new Date(
                  Date.now() + (form.billing_interval === "yearly" ? 365 : 30) * 86400000,
                ).toISOString(),
                cancel_at_period_end: false,
              })
            }
            className="btn-secondary px-3 py-1.5 text-[11px]"
            disabled={busy !== null || active}
          >
            {busy === "activate" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Activate paid
          </button>
          <button
            type="button"
            onClick={() => quick("cancel", { cancel_at_period_end: true })}
            className="btn-secondary px-3 py-1.5 text-[11px] text-amber-700"
            disabled={busy !== null || form.cancel_at_period_end}
          >
            {busy === "cancel" ? <Loader2 className="h-3 w-3 animate-spin" /> : <TriangleAlert className="h-3 w-3" />} Cancel at period end
          </button>
        </div>
      )}

      <form onSubmit={save} className="mt-4 space-y-3">
        <div>
          <label className="label">Plan</label>
          <select value={form.plan_id} onChange={(event) => update("plan_id", event.target.value)} className="input">
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} ({plan.id})
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Status</label>
            <select value={form.status} onChange={(event) => update("status", event.target.value)} className="input">
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Billing interval</label>
            <select
              value={form.billing_interval}
              onChange={(event) => update("billing_interval", event.target.value as "monthly" | "yearly")}
              className="input"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
        {trialing && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Trial start</label>
              <input
                type="datetime-local"
                value={form.trial_start}
                onChange={(event) => update("trial_start", event.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Trial end</label>
              <input
                type="datetime-local"
                value={form.trial_end}
                onChange={(event) => update("trial_end", event.target.value)}
                className="input"
              />
            </div>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Period start</label>
            <input
              type="datetime-local"
              value={form.current_period_start}
              onChange={(event) => update("current_period_start", event.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Period end</label>
            <input
              type="datetime-local"
              value={form.current_period_end}
              onChange={(event) => update("current_period_end", event.target.value)}
              className="input"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={form.cancel_at_period_end}
            onChange={(event) => update("cancel_at_period_end", event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Cancel at period end
        </label>
        <details className="rounded-xl bg-slate-50 px-3 py-2">
          <summary className="cursor-pointer text-xs font-bold text-slate-600">Stripe identifiers</summary>
          <div className="mt-2 space-y-2">
            <input
              value={form.stripe_customer_id}
              onChange={(event) => update("stripe_customer_id", event.target.value)}
              className="input text-xs"
              placeholder="cus_..."
            />
            <input
              value={form.stripe_subscription_id}
              onChange={(event) => update("stripe_subscription_id", event.target.value)}
              className="input text-xs"
              placeholder="sub_..."
            />
          </div>
        </details>
        <button type="submit" className="btn-primary w-full" disabled={busy !== null}>
          {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {subscription ? "Save subscription" : "Create subscription"}
        </button>
      </form>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Changes are applied to this database immediately. If the subscription is linked to Stripe, later webhook events
        may overwrite these values.
      </p>
    </div>
  );
}
