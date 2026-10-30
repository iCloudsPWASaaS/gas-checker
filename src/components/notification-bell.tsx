"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type Envelope = {
  data: unknown[];
  meta?: { count?: number } | null;
  error: { message?: string } | null;
};

export function NotificationBell() {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/notifications?unread=1&limit=1", { cache: "no-store" });
      if (!response.ok) {
        setCount(0);
        return;
      }
      const payload = (await response.json()) as Envelope;
      setCount(payload.meta?.count || 0);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 60000);
    const handler = () => void load();
    window.addEventListener("notifications:changed", handler);
    return () => {
      clearInterval(timer);
      window.removeEventListener("notifications:changed", handler);
    };
  }, [load]);

  return (
    <Link
      href="/dashboard/notifications"
      className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      title={count > 0 ? `${count} unread notifications` : "Notifications"}
    >
      <Bell className="h-[18px] w-[18px]" />
      {count > 0 && (
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
