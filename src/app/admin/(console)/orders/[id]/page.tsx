import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui";
import { DocumentView, type DocumentRecord } from "@/components/document-view";
import { requireAdminPage } from "@/lib/admin";

export const metadata = { title: "Admin order" };

type Params = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Params) {
  const session = await requireAdminPage();
  const { id } = await params;
  const admin = session.admin;

  const { data: document } = await admin
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("type", "invoice")
    .maybeSingle();
  if (!document) notFound();

  const [{ data: items }, { data: payments }, { data: profile }, { data: settings }] = await Promise.all([
    admin.from("document_items").select("*").eq("document_id", id).order("sort_order"),
    admin.from("payments").select("*").eq("document_id", id).order("paid_at", { ascending: false }),
    admin.from("profiles").select("id,email,full_name,company_name").eq("id", document.user_id).maybeSingle(),
    admin.from("settings").select("*").eq("user_id", document.user_id).maybeSingle(),
  ]);

  const currency = (settings?.currency as string) || "GBP";

  return (
    <div>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
      </Link>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Admin read-only view. Invoices are edited by the customer in their dashboard.</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge status={document.status} />
          <Link href={`/admin/users/${document.user_id}`} className="btn-secondary px-3 py-1.5 text-[11px]">
            <UserRound className="h-3 w-3" /> {profile?.company_name || profile?.full_name || profile?.email || "Owner"}
          </Link>
        </div>
      </div>

      <DocumentView
        document={document as unknown as DocumentRecord}
        items={items || []}
        payments={payments || []}
        company={(settings || {}) as Record<string, unknown>}
        currency={currency}
        actions={
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Invoice</p>
              <h1 className="text-2xl font-extrabold text-slate-900">{document.number}</h1>
              <p className="text-xs text-slate-500">
                {profile?.full_name || "Customer"} · {profile?.email}
              </p>
            </div>
            <Link href={`/admin/users/${document.user_id}`} className="btn-secondary">
              Open account
            </Link>
          </div>
        }
      />
    </div>
  );
}
