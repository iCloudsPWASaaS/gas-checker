"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { formatMoney } from "@/lib/utils";

type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_line3: string | null;
  postcode: string | null;
  type: string;
};

type LineItem = { description: string; quantity: number; unit_price: number };

type DocumentResponse = { id: string };

const emptyClient = {
  name: "",
  address_line1: "",
  address_line2: "",
  address_line3: "",
  postcode: "",
  phone: "",
  email: "",
};

export function DocumentForm({
  type,
  defaultTaxRate = 0,
  currency = "GBP",
}: {
  type: "invoice" | "quote";
  defaultTaxRate?: number;
  currency?: string;
}) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [client, setClient] = useState(emptyClient);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unit_price: 0 }]);
  const [taxRate, setTaxRate] = useState(defaultTaxRate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    apiFetch<Contact[]>("/api/v1/contacts")
      .then(setContacts)
      .catch(() => setContacts([]));
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);
    const tax = subtotal * (Number(taxRate || 0) / 100);
    return { subtotal, tax, total: subtotal + tax };
  }, [items, taxRate]);

  function selectContact(id: string) {
    const contact = contacts.find((item) => item.id === id);
    if (!contact) return;
    setSelectedContactId(contact.id);
    setClient({
      name: contact.name,
      address_line1: contact.address_line1 || "",
      address_line2: contact.address_line2 || "",
      address_line3: contact.address_line3 || "",
      postcode: contact.postcode || "",
      phone: contact.phone || "",
      email: contact.email || "",
    });
  }

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      const document = await apiFetch<DocumentResponse>(`/api/v1/${type}s`, {
        method: "POST",
        body: JSON.stringify({
          client_contact_id: form.get("client_contact_id") || null,
          client_name: client.name,
          client_address_line1: client.address_line1,
          client_address_line2: client.address_line2,
          client_address_line3: client.address_line3,
          client_postcode: client.postcode,
          client_phone: client.phone,
          client_email: client.email,
          installation_name: form.get("installation_name") || "",
          installation_address_line1: form.get("installation_address_line1") || "",
          installation_address_line2: form.get("installation_address_line2") || "",
          installation_address_line3: form.get("installation_address_line3") || "",
          installation_postcode: form.get("installation_postcode") || "",
          installation_phone: form.get("installation_phone") || "",
          installation_email: form.get("installation_email") || "",
          issue_date: form.get("issue_date") || today,
          due_date: type === "invoice" ? form.get("due_date") || null : null,
          valid_until: type === "quote" ? form.get("valid_until") || null : null,
          tax_rate: Number(taxRate),
          notes: form.get("notes") || "",
          terms: form.get("terms") || "",
          status: "draft",
          items,
        }),
      });
      router.push(`/dashboard/${type}s/${document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save document.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="card p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Client details</h2>
          <select className="input sm:w-64" onChange={(event) => selectContact(event.target.value)} defaultValue="">
            <option value="">Use a saved contact...</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
        </div>
        <input type="hidden" name="client_contact_id" value={selectedContactId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Name</label>
            <input className="input" value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} required placeholder="Mrs Patel" />
          </div>
          <div>
            <label className="label">Address line 1</label>
            <input className="input" value={client.address_line1} onChange={(e) => setClient({ ...client, address_line1: e.target.value })} />
          </div>
          <div>
            <label className="label">Address line 2</label>
            <input className="input" value={client.address_line2} onChange={(e) => setClient({ ...client, address_line2: e.target.value })} />
          </div>
          <div>
            <label className="label">Address line 3</label>
            <input className="input" value={client.address_line3} onChange={(e) => setClient({ ...client, address_line3: e.target.value })} />
          </div>
          <div>
            <label className="label">Postcode</label>
            <input className="input" value={client.postcode} onChange={(e) => setClient({ ...client, postcode: e.target.value })} />
          </div>
          <div>
            <label className="label">Telephone</label>
            <input className="input" value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Installation details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Name</label>
            <input name="installation_name" className="input" placeholder="42 Elm Road" />
          </div>
          <div>
            <label className="label">Address line 1</label>
            <input name="installation_address_line1" className="input" />
          </div>
          <div>
            <label className="label">Address line 2</label>
            <input name="installation_address_line2" className="input" />
          </div>
          <div>
            <label className="label">Address line 3</label>
            <input name="installation_address_line3" className="input" />
          </div>
          <div>
            <label className="label">Postcode</label>
            <input name="installation_postcode" className="input" />
          </div>
          <div>
            <label className="label">Telephone</label>
            <input name="installation_phone" className="input" />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="installation_email" type="email" className="input" />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Line items</h2>
          <button
            type="button"
            onClick={() => setItems((current) => [...current, { description: "", quantity: 1, unit_price: 0 }])}
            className="btn-secondary py-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Add item
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_90px_120px_110px_36px] sm:items-end">
              <div>
                <label className="label">Description</label>
                <input
                  className="input"
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  placeholder="Landlord gas safety certificate"
                  required
                />
              </div>
              <div>
                <label className="label">Qty</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">Unit price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, { unit_price: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">Amount</label>
                <p className="input bg-slate-50 text-right font-semibold">
                  {formatMoney(Number(item.quantity) * Number(item.unit_price), currency)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setItems((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : current))}
                className="mb-1 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatMoney(totals.subtotal, currency)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>VAT %</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm"
              />
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax</span>
              <span>{formatMoney(totals.tax, currency)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-slate-900">
              <span>Total</span>
              <span>{formatMoney(totals.total, currency)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Issue date</label>
            <input name="issue_date" type="date" className="input" defaultValue={today} />
          </div>
          {type === "invoice" ? (
            <div>
              <label className="label">Due date</label>
              <input name="due_date" type="date" className="input" />
            </div>
          ) : (
            <div>
              <label className="label">Valid until</label>
              <input name="valid_until" type="date" className="input" />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea name="notes" className="input" rows={2} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Terms & conditions</label>
            <textarea name="terms" className="input" rows={3} placeholder="Payment due within 14 days..." />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save {type}
        </button>
      </div>
    </form>
  );
}
