import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { UpgradeNotice } from "@/components/ui";
import { DocumentActions } from "@/components/document-actions";
import { DocumentView, type DocumentRecord } from "@/components/document-view";
import { PaymentForm } from "@/components/payment-form";
import { ConvertQuoteButton } from "@/components/convert-quote-button";
import { requireWebSession } from "@/lib/session";

export async function DocumentPage({ id, type }: { id: string; type: "invoice" | "quote" }) {
  const session = await requireWebSession();
  if (!session.account) return null;
  if (!session.account.subscription_active) return <UpgradeNotice trialEnded />;

  const { data: document } = await session.admin
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .eq("type", type)
    .maybeSingle();

  if (!document) notFound();

  const [{ data: items }, { data: payments }] = await Promise.all([
    session.admin.from("document_items").select("*").eq("document_id", id).order("sort_order"),
    session.admin.from("payments").select("*").eq("document_id", id).order("paid_at", { ascending: false }),
  ]);

  const settings = (session.account.settings || {}) as Record<string, unknown>;
  const currency = (settings.currency as string) || "GBP";
  const record = document as unknown as DocumentRecord;

  return (
    <div>
      <Link
        href={`/dashboard/${type}s`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 print:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {type}s
      </Link>

      <DocumentView
        document={record}
        items={items || []}
        payments={payments || []}
        company={settings}
        currency={currency}
        actions={
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700">{type === "invoice" ? "Invoice" : "Quote"}</p>
              <h1 className="text-2xl font-extrabold text-slate-900">{record.number}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {type === "quote" && <ConvertQuoteButton quoteId={id} />}
              <DocumentActions id={id} type={type} status={record.status} />
            </div>
          </div>
        }
        footer={
          type === "invoice" && Number(record.balance) > 0 ? (
            <PaymentForm invoiceId={id} balance={Number(record.balance)} currency={currency} />
          ) : null
        }
      />
    </div>
  );
}
