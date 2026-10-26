"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/client-api";

export function ConvertQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function convert() {
    setLoading(true);
    setError(null);
    try {
      const invoice = await apiFetch<{ id: string }>(`/api/v1/quotes/${quoteId}/convert`, { method: "POST" });
      router.push(`/dashboard/invoices/${invoice.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not convert quote.");
      setLoading(false);
    }
  }

  return (
    <div className="print:hidden">
      <button onClick={convert} className="btn-primary py-2 text-xs" disabled={loading}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
        Convert to invoice
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
