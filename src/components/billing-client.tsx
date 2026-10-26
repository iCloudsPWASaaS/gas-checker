"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, Check, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import type { PlanRecord, SubscriptionRecord } from "@/lib/account";
import { formatDate, formatMoney, humanStatus } from "@/lib/utils";

export function BillingClient({
  plans,
  subscription,
  activePlanId,
  active,
  isTrialing,
  trialDaysLeft,
  checkout,
}: {
  plans: PlanRecord[];
  subscription: SubscriptionRecord | null;
  activePlanId: string | null;
  active: boolean;
  isTrialing: boolean;
  trialDaysLeft: number;
  checkout?: string;
}) {
  const router = useRouter();
  const [interval, setInterval] = useState<"monthly" | "yearly">(
    subscription?.billing_interval === "yearly" ? "yearly" : "monthly",
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    checkout === "success"
      ? "Checkout complete - your subscription is active."
      : checkout === "cancelled"
        ? "Checkout cancelled. Your current plan is unchanged."
        : null,
  );

  async function subscribe(planId: string) {
    setBusy(planId);
    setError(null);
    setMessage(null);
    try {
      const result = await apiFetch<{ mode: string; checkout_url: string | null; message?: string }>(
        "/api/v1/subscription/checkout",
        {
          method: "POST",
          body: JSON.stringify({ plan_id: planId, billing_interval: interval }),
        },
      );
      if (result.mode === "stripe" && result.checkout_url) {
        window.location.href = result.checkout_url;
        return;
      }
      setMessage(result.message || "Subscription activated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
    } finally {
      setBusy(null);
    }
  }

  async function manage(action: "cancel" | "resume") {
    setBusy(action);
    setError(null);
    setMessage(null);
    try {
      const result = await apiFetch<{ message: string }>(`/api/v1/subscription/${action}`, { method: "POST" });
      setMessage(result.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update subscription.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {(error || message) && (
        <div>
          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {message && (
            <p className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
              <Check className="h-4 w-4" /> {message}
            </p>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="grid gap-5 p-6 sm:grid-cols-[1.4fr_0.6fr] sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge bg-slate-100 text-slate-700">
                {subscription ? humanStatus(subscription.status) : "No subscription"}
              </span>
              {subscription?.cancel_at_period_end && <span className="badge bg-amber-100 text-amber-800">Cancels at period end</span>}
            </div>
            <h2 className="mt-2 text-xl font-extrabold text-slate-900">
              {isTrialing
                ? `Free trial · ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`
                : active
                  ? "Subscription active"
                  : "Choose a plan to continue"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isTrialing && subscription?.trial_end
                ? `Your Professional trial ends on ${formatDate(subscription.trial_end)}. No payment has been taken.`
                : subscription?.current_period_end
                  ? `Current period ends ${formatDate(subscription.current_period_end)}.`
                  : "All new accounts get 30 days free, then a plan is required."}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <CalendarClock className="h-3.5 w-3.5" /> Current plan
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">
              {plans.find((plan) => plan.id === activePlanId)?.name || "Trial"}
            </p>
            {subscription && (
              <div className="mt-2 flex flex-wrap gap-2">
                {!subscription.cancel_at_period_end && (
                  <button onClick={() => manage("cancel")} className="text-xs font-semibold text-red-600 hover:underline" disabled={busy !== null}>
                    {busy === "cancel" ? "Cancelling..." : "Cancel plan"}
                  </button>
                )}
                {subscription.cancel_at_period_end && (
                  <button onClick={() => manage("resume")} className="text-xs font-semibold text-brand-700 hover:underline" disabled={busy !== null}>
                    {busy === "resume" ? "Resuming..." : "Resume plan"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          {(["monthly", "yearly"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setInterval(value)}
              className={`rounded-lg px-4 py-2 text-xs font-bold capitalize ${
                interval === value ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {value} {value === "yearly" && <span className="ml-1 font-semibold text-[10px] opacity-80">save ~17%</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === activePlanId && active && !isTrialing;
          const isTrialPlan = isTrialing && plan.id === activePlanId;
          const featured = plan.id === "pro";
          const price = interval === "monthly" ? plan.monthly_price : plan.yearly_price;
          const yearlyEquivalent = plan.monthly_price * 12;
          const saving = Math.round(((yearlyEquivalent - plan.yearly_price) / yearlyEquivalent) * 100);
          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl border bg-white p-6 ${
                featured ? "border-2 border-brand-600 shadow-float" : "border-slate-200 shadow-card"
              }`}
            >
              {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Most popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
                {isCurrent && <span className="badge bg-brand-100 text-brand-800">Current</span>}
                {isTrialPlan && <span className="badge bg-amber-100 text-amber-800">Trial plan</span>}
              </div>
              <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black tracking-tight text-slate-950">{formatMoney(price, plan.currency)}</span>
                <span className="text-xs text-slate-500">/{interval === "monthly" ? "month" : "year"}</span>
              </div>
              {interval === "yearly" && (
                <p className="mt-1 text-[11px] text-brand-700">Save {saving}% compared with monthly</p>
              )}
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" /> {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => subscribe(plan.id)}
                className={`${featured ? "btn-primary" : "btn-secondary"} mt-6 w-full`}
                disabled={busy !== null || isCurrent}
              >
                {busy === plan.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isCurrent
                  ? "Your current plan"
                  : isTrialPlan
                    ? "Subscribe now"
                    : isTrialing
                      ? "Switch to this plan"
                      : "Choose plan"}
                {!isCurrent && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        Payments are taken securely through Stripe when configured. If Stripe is not configured, selecting a plan
        activates it directly on this server for development.
      </div>
    </div>
  );
}
