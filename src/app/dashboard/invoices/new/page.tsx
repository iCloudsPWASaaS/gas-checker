import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader, UpgradeNotice } from "@/components/ui";
import { DocumentForm } from "@/components/document-form";
import { requireWebSession } from "@/lib/session";

export const metadata: Metadata = { title: "New invoice" };

export default async function NewInvoicePage() {
  const session = await requireWebSession();
  if (!session.account) return null;
  if (!session.account.subscription_active) return <UpgradeNotice trialEnded />;

  const settings = session.account.settings || {};
  const taxRate = Number(settings.vat_rate || 0);
  const currency = (settings.currency as string) || "GBP";

  return (
    <div>
      <Link href="/dashboard/invoices" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to invoices
      </Link>
      <PageHeader
        eyebrow="New document"
        title="Create invoice"
        description="Add client and installation details, then build the invoice line by line."
      />
      <DocumentForm type="invoice" defaultTaxRate={taxRate} currency={currency} />
    </div>
  );
}
