import { randomUUID } from "crypto";
import type { AdminClient } from "@/lib/supabase/admin";
import { recalcDocumentPayment } from "@/lib/documents";

type Row = Record<string, unknown>;

export type BackupPayload = {
  version: number;
  exported_at: string;
  source_user_id?: string;
  data: {
    profile?: Row | null;
    settings?: Row | null;
    contacts?: Row[];
    properties?: Row[];
    jobs?: Row[];
    documents?: Row[];
    document_items?: Row[];
    payments?: Row[];
    appointments?: Row[];
    reminders?: Row[];
    gas_reports?: Row[];
    gas_rate_calculations?: Row[];
    notifications?: Row[];
  };
};

export async function exportUserData(admin: AdminClient, userId: string): Promise<BackupPayload> {
  const [
    profile,
    settings,
    contacts,
    properties,
    jobs,
    documents,
    documentItems,
    payments,
    appointments,
    reminders,
    gasReports,
    gasRates,
    notifications,
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    admin.from("settings").select("*").eq("user_id", userId).maybeSingle(),
    admin.from("contacts").select("*").eq("user_id", userId),
    admin.from("properties").select("*").eq("user_id", userId),
    admin.from("jobs").select("*").eq("user_id", userId),
    admin.from("documents").select("*").eq("user_id", userId),
    admin.from("document_items").select("*").eq("user_id", userId),
    admin.from("payments").select("*").eq("user_id", userId),
    admin.from("appointments").select("*").eq("user_id", userId),
    admin.from("reminders").select("*").eq("user_id", userId),
    admin.from("gas_reports").select("*").eq("user_id", userId),
    admin.from("gas_rate_calculations").select("*").eq("user_id", userId),
    admin.from("notifications").select("*").eq("user_id", userId),
  ]);

  return {
    version: 1,
    exported_at: new Date().toISOString(),
    source_user_id: userId,
    data: {
      profile: profile.data || null,
      settings: settings.data || null,
      contacts: contacts.data || [],
      properties: properties.data || [],
      jobs: jobs.data || [],
      documents: documents.data || [],
      document_items: documentItems.data || [],
      payments: payments.data || [],
      appointments: appointments.data || [],
      reminders: reminders.data || [],
      gas_reports: gasReports.data || [],
      gas_rate_calculations: gasRates.data || [],
      notifications: notifications.data || [],
    },
  };
}

export async function restoreUserData(
  admin: AdminClient,
  userId: string,
  backup: BackupPayload,
  mode: "merge" | "replace" = "merge",
) {
  if (!backup?.data || typeof backup.data !== "object") {
    throw new Error("Invalid backup file");
  }

  const data = backup.data;
  const counts = {
    contacts: 0,
    properties: 0,
    jobs: 0,
    documents: 0,
    document_items: 0,
    payments: 0,
    appointments: 0,
    reminders: 0,
    gas_reports: 0,
    gas_rate_calculations: 0,
    notifications: 0,
  };

  if (mode === "replace") {
    await Promise.all([
      admin.from("notifications").delete().eq("user_id", userId),
      admin.from("jobs").delete().eq("user_id", userId),
      admin.from("properties").delete().eq("user_id", userId),
      admin.from("payments").delete().eq("user_id", userId),
      admin.from("document_items").delete().eq("user_id", userId),
      admin.from("documents").delete().eq("user_id", userId),
      admin.from("gas_reports").delete().eq("user_id", userId),
      admin.from("reminders").delete().eq("user_id", userId),
      admin.from("appointments").delete().eq("user_id", userId),
      admin.from("gas_rate_calculations").delete().eq("user_id", userId),
      admin.from("contacts").delete().eq("user_id", userId),
    ]);
  }

  if (backup.data.settings) {
    const source = backup.data.settings;
    const settingsPatch = {
      company_name: source.company_name ?? null,
      company_address_line1: source.company_address_line1 ?? null,
      company_address_line2: source.company_address_line2 ?? null,
      company_address_line3: source.company_address_line3 ?? null,
      postcode: source.postcode ?? null,
      phone: source.phone ?? null,
      email: source.email ?? null,
      gas_engineer_id: source.gas_engineer_id ?? null,
      oil_registration: source.oil_registration ?? null,
      mcs_registration: source.mcs_registration ?? null,
      engineer_position: source.engineer_position ?? null,
      email_message: source.email_message ?? null,
      email_cc: source.email_cc ?? null,
      email_bcc: source.email_bcc ?? null,
      certificate_prefix: source.certificate_prefix ?? null,
      invoice_prefix: source.invoice_prefix ?? null,
      quote_prefix: source.quote_prefix ?? null,
      currency: source.currency ?? "GBP",
      vat_rate: source.vat_rate ?? 0,
      auto_sync: source.auto_sync ?? true,
    };
    const { data: existing } = await admin.from("settings").select("user_id").eq("user_id", userId).maybeSingle();
    if (existing) {
      await admin.from("settings").update(settingsPatch).eq("user_id", userId);
    } else {
      await admin.from("settings").insert({ ...settingsPatch, user_id: userId });
    }
  }

  const contactMap = new Map<string, string>();
  for (const contact of data.contacts || []) {
    const newId = randomUUID();
    if (contact.id) contactMap.set(String(contact.id), newId);
    const { error } = await admin.from("contacts").insert({
      id: newId,
      user_id: userId,
      name: contact.name || "Unnamed contact",
      email: contact.email ?? null,
      phone: contact.phone ?? null,
      address_line1: contact.address_line1 ?? null,
      address_line2: contact.address_line2 ?? null,
      address_line3: contact.address_line3 ?? null,
      postcode: contact.postcode ?? null,
      type: contact.type || "client",
      notes: contact.notes ?? null,
    });
    if (error) throw error;
    counts.contacts += 1;
  }

  const propertyMap = new Map<string, string>();
  for (const property of data.properties || []) {
    const newId = randomUUID();
    if (property.id) propertyMap.set(String(property.id), newId);
    const { error } = await admin.from("properties").insert({
      id: newId,
      user_id: userId,
      contact_id: contactMap.get(String(property.contact_id)) || null,
      name: property.name || "Job address",
      address_line1: property.address_line1 ?? null,
      address_line2: property.address_line2 ?? null,
      address_line3: property.address_line3 ?? null,
      postcode: property.postcode ?? null,
      access_notes: property.access_notes ?? null,
      notes: property.notes ?? null,
    });
    if (error) throw error;
    counts.properties += 1;
  }

  for (const job of data.jobs || []) {
    const { error } = await admin.from("jobs").insert({
      user_id: userId,
      property_id: propertyMap.get(String(job.property_id)) || null,
      contact_id: contactMap.get(String(job.contact_id)) || null,
      reference: job.reference ?? null,
      title: job.title || "Job",
      job_type: job.job_type || "gas_safety",
      status: job.status || "scheduled",
      priority: job.priority || "normal",
      scheduled_at: job.scheduled_at ?? null,
      completed_at: job.completed_at ?? null,
      engineer: job.engineer ?? null,
      description: job.description ?? null,
      notes: job.notes ?? null,
    });
    if (error) throw error;
    counts.jobs += 1;
  }

  const { data: existingDocs } = await admin.from("documents").select("number").eq("user_id", userId);
  const usedNumbers = new Set((existingDocs || []).map((doc) => String(doc.number)));
  const documentMap = new Map<string, string>();

  for (const document of data.documents || []) {
    const newId = randomUUID();
    if (document.id) documentMap.set(String(document.id), newId);

    let number = String(document.number || `RESTORED-${randomUUID().slice(0, 8)}`);
    let counter = 1;
    while (usedNumbers.has(number)) {
      number = `${document.number}-R${counter}`;
      counter += 1;
    }
    usedNumbers.add(number);

    const { error } = await admin.from("documents").insert({
      id: newId,
      user_id: userId,
      type: document.type === "quote" ? "quote" : "invoice",
      number,
      status: document.status || "draft",
      client_contact_id: contactMap.get(String(document.client_contact_id)) || null,
      client_name: document.client_name || "Unnamed client",
      client_address_line1: document.client_address_line1 ?? null,
      client_address_line2: document.client_address_line2 ?? null,
      client_address_line3: document.client_address_line3 ?? null,
      client_postcode: document.client_postcode ?? null,
      client_phone: document.client_phone ?? null,
      client_email: document.client_email ?? null,
      installation_name: document.installation_name ?? null,
      installation_address_line1: document.installation_address_line1 ?? null,
      installation_address_line2: document.installation_address_line2 ?? null,
      installation_address_line3: document.installation_address_line3 ?? null,
      installation_postcode: document.installation_postcode ?? null,
      installation_phone: document.installation_phone ?? null,
      installation_email: document.installation_email ?? null,
      issue_date: document.issue_date || new Date().toISOString().slice(0, 10),
      due_date: document.due_date ?? null,
      valid_until: document.valid_until ?? null,
      subtotal: Number(document.subtotal || 0),
      tax_rate: Number(document.tax_rate || 0),
      tax: Number(document.tax || 0),
      total: Number(document.total || 0),
      amount_paid: 0,
      balance: Number(document.total || 0),
      notes: document.notes ?? null,
      terms: document.terms ?? null,
      meta: document.meta || {},
      created_at: document.created_at || new Date().toISOString(),
    });
    if (error) throw error;
    counts.documents += 1;
  }

  for (const item of data.document_items || []) {
    const documentId = documentMap.get(String(item.document_id));
    if (!documentId) continue;
    const { error } = await admin.from("document_items").insert({
      user_id: userId,
      document_id: documentId,
      description: item.description || "Item",
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.unit_price || 0),
      amount: Number(item.amount || 0),
      sort_order: Number(item.sort_order || 0),
    });
    if (error) throw error;
    counts.document_items += 1;
  }

  for (const payment of data.payments || []) {
    const documentId = documentMap.get(String(payment.document_id));
    if (!documentId) continue;
    const { error } = await admin.from("payments").insert({
      user_id: userId,
      document_id: documentId,
      amount: Number(payment.amount || 0),
      method: payment.method || "other",
      reference: payment.reference ?? null,
      paid_at: payment.paid_at || new Date().toISOString(),
      notes: payment.notes ?? null,
    });
    if (error) throw error;
    counts.payments += 1;
  }

  for (const documentId of documentMap.values()) {
    await recalcDocumentPayment(admin, userId, documentId);
  }

  for (const appointment of data.appointments || []) {
    const { error } = await admin.from("appointments").insert({
      user_id: userId,
      title: appointment.title || "Appointment",
      location: appointment.location ?? null,
      description: appointment.description ?? null,
      starts_at: appointment.starts_at || new Date().toISOString(),
      ends_at: appointment.ends_at ?? null,
      all_day: Boolean(appointment.all_day),
      repeat_rule: appointment.repeat_rule || "never",
      alert_minutes: appointment.alert_minutes ?? null,
      url: appointment.url ?? null,
      contact_id: contactMap.get(String(appointment.contact_id)) || null,
      status: appointment.status || "scheduled",
    });
    if (error) throw error;
    counts.appointments += 1;
  }

  for (const reminder of data.reminders || []) {
    const entityType = String(reminder.entity_type || "");
    let entityId: string | null = null;
    if (entityType === "document" || entityType === "invoice" || entityType === "quote") {
      entityId = documentMap.get(String(reminder.entity_id)) || null;
    } else if (entityType === "contact") {
      entityId = contactMap.get(String(reminder.entity_id)) || null;
    }

    const { error } = await admin.from("reminders").insert({
      user_id: userId,
      title: reminder.title || "Reminder",
      kind: reminder.kind || "custom",
      due_date: reminder.due_date ?? null,
      status: reminder.status || "pending",
      entity_type: reminder.entity_type ?? null,
      entity_id: entityId,
      notes: reminder.notes ?? null,
    });
    if (error) throw error;
    counts.reminders += 1;
  }

  for (const report of data.gas_reports || []) {
    const { error } = await admin.from("gas_reports").insert({
      user_id: userId,
      type: report.type || "domestic-landlord-gas-safety",
      reference: report.reference ?? null,
      certificate_number: report.certificate_number ?? null,
      job_id: report.job_id ?? null,
      status: report.status || "draft",
      contact_id: contactMap.get(String(report.contact_id)) || null,
      property_name: report.property_name ?? null,
      property_address_line1: report.property_address_line1 ?? null,
      property_address_line2: report.property_address_line2 ?? null,
      property_address_line3: report.property_address_line3 ?? null,
      property_postcode: report.property_postcode ?? null,
      appliances: report.appliances || [],
      defects: report.defects || [],
      readings: report.readings || {},
      notes: report.notes ?? null,
      pdf_url: report.pdf_url ?? null,
      completed_at: report.completed_at ?? null,
    });
    if (error) throw error;
    counts.gas_reports += 1;
  }

  for (const rate of data.gas_rate_calculations || []) {
    const { error } = await admin.from("gas_rate_calculations").insert({
      user_id: userId,
      meter_type: rate.meter_type === "imperial" ? "imperial" : "metric",
      reading1: rate.reading1 ?? null,
      reading2: rate.reading2 ?? null,
      seconds: rate.seconds ?? null,
      gas_rate_m3_hr: rate.gas_rate_m3_hr ?? null,
      gross_kw: rate.gross_kw ?? null,
      net_kw: rate.net_kw ?? null,
    });
    if (error) throw error;
    counts.gas_rate_calculations += 1;
  }

  for (const notification of data.notifications || []) {
    const { error } = await admin.from("notifications").insert({
      user_id: userId,
      title: notification.title || "Notification",
      body: notification.body ?? null,
      kind: notification.kind || "system",
      link: notification.link ?? null,
      read_at: notification.read_at ?? null,
      created_at: notification.created_at || new Date().toISOString(),
    });
    if (error) throw error;
    counts.notifications += 1;
  }

  return counts;
}
