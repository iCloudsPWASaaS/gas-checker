"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export function LoginForm({ next = "/dashboard" }: { next?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") || ""),
          password: String(form.get("password") || ""),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error?.message || "Sign in failed.");
        return;
      }
      router.push(next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch {
      setError("Network error - please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          placeholder="you@company.co.uk"
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          placeholder="Your password"
          required
          autoComplete="current-password"
        />
      </div>

      <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
