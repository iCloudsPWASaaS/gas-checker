"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, Mail, MapPin, Pencil, Phone, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_line3: string | null;
  postcode: string | null;
  type: "client" | "installation" | "supplier";
  notes: string | null;
};

const typeLabels: Record<string, string> = {
  client: "Client",
  installation: "Installation",
  supplier: "Supplier",
};

export function ContactsManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);
    try {
      const suffix = term ? `?search=${encodeURIComponent(term)}` : "";
      setContacts(await apiFetch<Contact[]>(`/api/v1/contacts${suffix}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load contacts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(search), 250);
    return () => clearTimeout(timer);
  }, [search, load]);

  function startCreate() {
    setEditing(null);
    setFormKey((key) => key + 1);
    setShowForm(true);
  }

  function startEdit(contact: Contact) {
    setEditing(contact);
    setFormKey((key) => key + 1);
    setShowForm(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      type: String(form.get("type") || "client"),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      address_line1: String(form.get("address_line1") || ""),
      address_line2: String(form.get("address_line2") || ""),
      address_line3: String(form.get("address_line3") || ""),
      postcode: String(form.get("postcode") || ""),
      notes: String(form.get("notes") || ""),
    };

    try {
      if (editing) {
        await apiFetch(`/api/v1/contacts/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/v1/contacts", { method: "POST", body: JSON.stringify(payload) });
      }
      setShowForm(false);
      setEditing(null);
      await load(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save contact.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(contact: Contact) {
    if (!confirm(`Delete ${contact.name}?`)) return;
    try {
      await apiFetch(`/api/v1/contacts/${contact.id}`, { method: "DELETE" });
      await load(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete contact.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input pl-9"
              placeholder="Search contacts, phone, postcode..."
            />
          </div>
          <button onClick={startCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Add contact
          </button>
        </div>

        {error && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {loading ? (
          <div className="card flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading contacts...
          </div>
        ) : contacts.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <UserRound className="mb-3 h-9 w-9 text-slate-300" />
            <p className="text-sm font-bold text-slate-900">No contacts yet</p>
            <p className="mt-1 text-xs text-slate-500">Add your first landlord, agent or installation.</p>
            <button onClick={startCreate} className="btn-secondary mt-4">
              <Plus className="h-4 w-4" /> Add contact
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="card flex items-start gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold uppercase text-brand-700">
                  {contact.name.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{contact.name}</p>
                    <span className="badge bg-slate-100 text-slate-600">{typeLabels[contact.type]}</span>
                  </div>
                  <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                    {contact.email && (
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> {contact.email}
                      </p>
                    )}
                    {contact.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {contact.phone}
                      </p>
                    )}
                    {(contact.address_line1 || contact.postcode) && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> {[contact.address_line1, contact.postcode].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(contact)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(contact)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm ? (
        <form key={formKey} onSubmit={onSubmit} className={cn("card h-fit space-y-3 p-5 lg:sticky lg:top-24")}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{editing ? "Edit contact" : "New contact"}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label className="label">Name</label>
            <input name="name" className="input" defaultValue={editing?.name || ""} required placeholder="Mrs Patel" />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type" className="input" defaultValue={editing?.type || "client"}>
              <option value="client">Client / landlord</option>
              <option value="installation">Installation</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input" defaultValue={editing?.email || ""} placeholder="name@email.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="phone" className="input" defaultValue={editing?.phone || ""} placeholder="07700 900123" />
            </div>
          </div>
          <div>
            <label className="label">Address line 1</label>
            <input name="address_line1" className="input" defaultValue={editing?.address_line1 || ""} placeholder="42 Elm Road" />
          </div>
          <div>
            <label className="label">Address line 2</label>
            <input name="address_line2" className="input" defaultValue={editing?.address_line2 || ""} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Address line 3</label>
              <input name="address_line3" className="input" defaultValue={editing?.address_line3 || ""} />
            </div>
            <div>
              <label className="label">Postcode</label>
              <input name="postcode" className="input" defaultValue={editing?.postcode || ""} placeholder="LE1 1AA" />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea name="notes" className="input" rows={2} defaultValue={editing?.notes || ""} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? "Save changes" : "Create contact"}
          </button>
        </form>
      ) : (
        <div className="card h-fit p-5">
          <h3 className="text-sm font-bold text-slate-900">Contacts</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Keep landlords, agents and installations in one place. Contacts link straight into quotes, invoices and
            certificates.
          </p>
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">{contacts.length} contacts</p>
            <p>{contacts.filter((c) => c.type === "installation").length} installations</p>
          </div>
        </div>
      )}
    </div>
  );
}
