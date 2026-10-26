import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatMoney(value: number | string | null | undefined, currency = "GBP") {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function toDateInput(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function daysBetween(from: Date, to: Date) {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-brand-100 text-brand-800",
  partially_paid: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-700",
  accepted: "bg-brand-100 text-brand-800",
  declined: "bg-red-100 text-red-700",
  expired: "bg-slate-200 text-slate-600",
  cancelled: "bg-slate-200 text-slate-600",
  trialing: "bg-brand-100 text-brand-800",
  active: "bg-brand-100 text-brand-800",
  past_due: "bg-amber-100 text-amber-800",
  canceled: "bg-slate-200 text-slate-600",
  pending: "bg-amber-100 text-amber-800",
  done: "bg-brand-100 text-brand-800",
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-brand-100 text-brand-800",
  in_progress: "bg-blue-100 text-blue-700",
};

export function humanStatus(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
