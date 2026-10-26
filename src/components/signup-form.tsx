"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      full_name: String(form.get("full_name") || ""),
      company_name: String(form.get("company_name") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      password: String(form.get("password") || ""),
    };

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error?.message || "Could not create your account.");
        return;
      }
      router.push("/dashboard");
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
        <label className="label" htmlFor="full_name">
          Full name
        </label>
        <input id="full_name" name="full_name" className="input" placeholder="Kabbo Hasan" required autoComplete="name" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="company_name">
            Company
          </label>
          <input id="company_name" name="company_name" className="input" placeholder="IClouds Gas" autoComplete="organization" />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Phone
          </label>
          <input id="phone" name="phone" className="input" placeholder="07700 900123" autoComplete="tel" />
        </div>
      </div>

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
          placeholder="At least 8 characters"
          minLength={8}
          required
          autoComplete="new-password"
        />
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        Your 30-day Professional trial starts immediately. We will not ask for payment details until you choose a plan.
      </p>

      <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {loading ? "Creating your account..." : "Create account & start trial"}
      </button>
    </form>
  );
}
