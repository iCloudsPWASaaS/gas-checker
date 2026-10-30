"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Home, Loader2, MapPin, Pencil, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import { apiFetch } from "@/lib/client-api";

type Property = {
  id: string;
  name: string;
  contact_id: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_line3: string | null;
  postcode: string | null;
  access_notes: string | null;
  notes: string | null;
};

type Contact = { id: string; name: string };

export function PropertiesManager() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [propertyRows, contactRows] = await Promise.all([
        apiFetch<Property[]>("/api/v1/properties?limit=200"),
        apiFetch<Contact[]>("/api/v1/contacts?limit=200"),
      ]);
      setProperties(propertyRows);
      setContacts(contactRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load job addresses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const contactMap = useMemo(() => new Map(contacts.map((item) => [item.id, item])), [contacts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return properties;
    return properties.filter((property) => {
      const contact = property.contact_id ? contactMap.get(property.contact_id) : null;
      return [property.name, property.address_line1, property.postcode, contact?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [properties, search, contactMap]);

  function startCreate() {
    setEditing(null);
    setFormKey((key) => key + 1);
    setShowForm(true);
  }

  function startEdit(property: Property) {
    setEditing(property);
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
      contact_id: form.get("contact_id") ? String(form.get("contact_id")) : null,
      address_line1: String(form.get("address_line1") || ""),
      address_line2: String(form.get("address_line2") || ""),
      address_line3: String(form.get("address_line3") || ""),
      postcode: String(form.get("postcode") || ""),
      access_notes: String(form.get("access_notes") || ""),
      notes: String(form.get("notes") || ""),
    };

    try {
      if (editing) {
        await apiFetch(`/api/v1/properties/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/v1/properties", { method: "POST", body: JSON.stringify(payload) });
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save job address.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(property: Property) {
    if (!confirm(`Delete ${property.name}?`)) return;
    try {
      await apiFetch(`/api/v1/properties/${property.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete job address.");
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
              placeholder="Search addresses, postcodes, customers..."
            />
          </div>
          <button onClick={startCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Add address
          </button>
        </div>

        {error && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {loading ? (
          <div className="card flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading addresses...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <Home className="mb-3 h-9 w-9 text-slate-300" />
            <p className="text-sm font-bold text-slate-900">No job addresses yet</p>
            <p className="mt-1 text-xs text-slate-500">Save a property once and reuse it on jobs, certificates and invoices.</p>
            <button onClick={startCreate} className="btn-secondary mt-4">
              <Plus className="h-4 w-4" /> Add address
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((property) => {
              const contact = property.contact_id ? contactMap.get(property.contact_id) : null;
              return (
                <div key={property.id} className="card flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Home className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{property.name}</p>
                    <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                      {(property.address_line1 || property.postcode) && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" />
                          {[property.address_line1, property.address_line2, property.postcode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                      {contact && (
                        <p className="flex items-center gap-1.5">
                          <UserRound className="h-3 w-3" /> {contact.name}
                        </p>
                      )}
                      {property.access_notes && <p className="text-slate-400">Access: {property.access_notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(property)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(property)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm ? (
        <form key={formKey} onSubmit={onSubmit} className="card h-fit space-y-3 p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{editing ? "Edit job address" : "New job address"}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label className="label">Address name</label>
            <input name="name" className="input" defaultValue={editing?.name || ""} required placeholder="42 Elm Road" />
          </div>
          <div>
            <label className="label">Customer</label>
            <select name="contact_id" className="input" defaultValue={editing?.contact_id || ""}>
              <option value="">No customer</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Address line 1</label>
            <input name="address_line1" className="input" defaultValue={editing?.address_line1 || ""} />
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
            <label className="label">Access notes</label>
            <input name="access_notes" className="input" defaultValue={editing?.access_notes || ""} placeholder="Key safe, parking..." />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea name="notes" className="input" rows={2} defaultValue={editing?.notes || ""} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? "Save changes" : "Create address"}
          </button>
        </form>
      ) : (
        <div className="card h-fit p-5">
          <h3 className="text-sm font-bold text-slate-900">Job addresses</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Keep the properties you visit separate from customers. One landlord can have several addresses, and each
            address can be reused across jobs and records.
          </p>
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">{properties.length} addresses</p>
            <p>{properties.filter((property) => property.contact_id).length} linked to a customer</p>
          </div>
        </div>
      )}
    </div>
  );
}
