"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Inbox,
  Loader2,
  Trash2,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { cn, formatDateTime } from "@/lib/utils";

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

function notifyChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("notifications:changed"));
}

export function NotificationsManager() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await apiFetch<NotificationRow[]>("/api/v1/notifications?limit=100"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unreadCount = useMemo(() => rows.filter((row) => !row.read_at).length, [rows]);
  const visible = filter === "unread" ? rows.filter((row) => !row.read_at) : rows;

  async function markRead(row: NotificationRow) {
    try {
      await apiFetch(`/api/v1/notifications/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ read: true }),
      });
      await load();
      notifyChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update notification.");
    }
  }

  async function markAll() {
    try {
      await apiFetch("/api/v1/notifications", {
        method: "PATCH",
        body: JSON.stringify({ all: true }),
      });
      await load();
      notifyChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update notifications.");
    }
  }

  async function remove(row: NotificationRow) {
    if (!confirm("Delete this notification?")) return;
    try {
      await apiFetch(`/api/v1/notifications/${row.id}`, { method: "DELETE" });
      await load();
      notifyChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete notification.");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-bold transition",
              filter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-bold transition",
              filter === "unread" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
            )}
          >
            Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
          </button>
        </div>
        <button type="button" onClick={markAll} className="btn-secondary" disabled={unreadCount === 0}>
          <CheckCheck className="h-4 w-4" /> Mark all read
        </button>
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="card flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading notifications...
        </div>
      ) : visible.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <Inbox className="mb-3 h-9 w-9 text-slate-300" />
          <p className="text-sm font-bold text-slate-900">
            {filter === "unread" ? "You are all caught up" : "No notifications yet"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Job updates and system messages will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((row) => (
            <div
              key={row.id}
              className={cn(
                "card flex items-start gap-3 p-4",
                !row.read_at && "border-brand-200 bg-brand-50/40",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  row.read_at ? "bg-slate-100 text-slate-500" : "bg-brand-100 text-brand-700",
                )}
              >
                <Bell className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{row.title}</p>
                  <span className="badge bg-slate-100 text-slate-600">{row.kind}</span>
                  {!row.read_at && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                </div>
                {row.body && <p className="mt-1 text-xs text-slate-600">{row.body}</p>}
                <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(row.created_at)}</p>
                {row.link && (
                  <Link
                    href={row.link}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-800"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!row.read_at && (
                  <button
                    type="button"
                    onClick={() => markRead(row)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-700"
                    title="Mark read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(row)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Delete notification"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
