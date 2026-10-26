import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { cn, humanStatus, statusStyles } from "@/lib/utils";

export function Badge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn("badge", statusStyles[status] || "bg-slate-100 text-slate-600")}>
      {label || humanStatus(status)}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "brand" | "blue" | "amber" | "red" | "slate";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function UpgradeNotice({ trialEnded = false }: { trialEnded?: boolean }) {
  return (
    <div className="card mx-auto max-w-xl p-8 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <LockKeyhole className="h-6 w-6" />
      </span>
      <h2 className="text-xl font-extrabold text-slate-900">
        {trialEnded ? "Your free trial has ended" : "Subscription required"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        Choose a plan to keep creating certificates, sending invoices and managing your schedule. Your data is safe
        and waiting for you.
      </p>
      <Link href="/dashboard/billing" className="btn-primary mt-6">
        <Sparkles className="h-4 w-4" /> View plans
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{children}</h2>
      {action}
    </div>
  );
}
