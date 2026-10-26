import { Badge } from "@/components/ui";
import { formatDate, formatMoney, humanStatus } from "@/lib/utils";
import { Flame } from "lucide-react";

type Item = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
};

type Payment = {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  paid_at: string;
};

export type DocumentRecord = {
  id: string;
  type: "invoice" | "quote";
  number: string;
  status: string;
  client_name: string;
  client_address_line1: string | null;
  client_address_line2: string | null;
  client_address_line3: string | null;
  client_postcode: string | null;
  client_phone: string | null;
  client_email: string | null;
  installation_name: string | null;
  installation_address_line1: string | null;
  installation_address_line2: string | null;
  installation_address_line3: string | null;
  installation_postcode: string | null;
  installation_phone: string | null;
  installation_email: string | null;
  issue_date: string;
  due_date: string | null;
  valid_until: string | null;
  subtotal: number;
  tax_rate: number;
  tax: number;
  total: number;
  amount_paid: number;
  balance: number;
  notes: string | null;
  terms: string | null;
};

export function DocumentView({
  document,
  items,
  payments,
  company,
  currency,
  actions,
  footer,
}: {
  document: DocumentRecord;
  items: Item[];
  payments: Payment[];
  company: Record<string, unknown>;
  currency: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const companyName = (company.company_name as string) || "Your Company";
  const addressLines = [
    company.company_address_line1,
    company.company_address_line2,
    company.company_address_line3,
    company.postcode,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      {actions}

      <div className="card overflow-hidden">
        <div className="bg-slate-950 px-6 py-6 text-white sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
                  <Flame className="h-4 w-4" />
                </span>
                <span className="text-lg font-extrabold">{companyName}</span>
              </div>
              {addressLines.length > 0 && (
                <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">{addressLines.join(", ")}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {[company.phone, company.email].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-300">
                {document.type === "invoice" ? "Invoice" : "Quotation"}
              </p>
              <p className="mt-1 text-2xl font-black tracking-tight">{document.number}</p>
              <div className="mt-2 flex justify-end">
                <Badge status={document.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 sm:grid-cols-2 sm:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Billed to</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{document.client_name}</p>
            <div className="mt-1 text-xs leading-relaxed text-slate-500">
              {[document.client_address_line1, document.client_address_line2, document.client_address_line3]
                .filter(Boolean)
                .join(", ")}
              {document.client_postcode && <div>{document.client_postcode}</div>}
              {document.client_phone && <div>{document.client_phone}</div>}
              {document.client_email && <div>{document.client_email}</div>}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Installation</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{document.installation_name || "—"}</p>
            <div className="mt-1 text-xs leading-relaxed text-slate-500">
              {[
                document.installation_address_line1,
                document.installation_address_line2,
                document.installation_address_line3,
                document.installation_postcode,
              ]
                .filter(Boolean)
                .join(", ") || "—"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 border-y border-slate-100 bg-slate-50/70 px-6 py-3 text-xs sm:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Issue date</p>
            <p className="mt-0.5 font-semibold text-slate-700">{formatDate(document.issue_date)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {document.type === "invoice" ? "Due date" : "Valid until"}
            </p>
            <p className="mt-0.5 font-semibold text-slate-700">
              {formatDate(document.type === "invoice" ? document.due_date : document.valid_until)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Status</p>
            <p className="mt-0.5 font-semibold text-slate-700">{humanStatus(document.status)}</p>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-bold">Description</th>
                <th className="pb-2 text-right font-bold">Qty</th>
                <th className="pb-2 text-right font-bold">Unit</th>
                <th className="pb-2 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 pr-3 text-slate-700">{item.description}</td>
                  <td className="py-3 text-right text-slate-500">{item.quantity}</td>
                  <td className="py-3 text-right text-slate-500">{formatMoney(item.unit_price, currency)}</td>
                  <td className="py-3 text-right font-semibold text-slate-800">{formatMoney(item.amount, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-5 flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatMoney(document.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>VAT ({document.tax_rate}%)</span>
                <span>{formatMoney(document.tax, currency)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-slate-900">
                <span>Total</span>
                <span>{formatMoney(document.total, currency)}</span>
              </div>
              {document.type === "invoice" && (
                <>
                  <div className="flex justify-between text-brand-700">
                    <span>Paid</span>
                    <span>{formatMoney(document.amount_paid, currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Outstanding</span>
                    <span>{formatMoney(document.balance, currency)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {(document.notes || document.terms) && (
            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-xs sm:grid-cols-2">
              {document.notes && (
                <div>
                  <p className="font-bold uppercase tracking-wide text-slate-400">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-600">{document.notes}</p>
                </div>
              )}
              {document.terms && (
                <div>
                  <p className="font-bold uppercase tracking-wide text-slate-400">Terms</p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-600">{document.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {document.type === "invoice" && payments.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Payment history</h2>
          <div className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{formatMoney(payment.amount, currency)}</p>
                  <p className="text-xs text-slate-500">
                    {humanStatus(payment.method)} · {formatDate(payment.paid_at)}
                    {payment.reference ? ` · ${payment.reference}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {footer}
    </div>
  );
}
