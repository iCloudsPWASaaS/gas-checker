import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Braces, KeyRound, Smartphone, TriangleAlert } from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Flutter API documentation",
  description: "REST API reference for building the Gas Checker Flutter app using bearer tokens and the /api/v1 endpoints.",
};

type Endpoint = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  body?: string;
  query?: string;
  auth?: boolean;
};

const sections: { id: string; title: string; intro: string; endpoints: Endpoint[] }[] = [
  {
    id: "auth",
    title: "Authentication",
    intro:
      "Signup and login return a Supabase access token and refresh token. Send the access token as a Bearer header on every protected request. Refresh when a request returns 401.",
    endpoints: [
      {
        method: "POST",
        path: "/auth/signup",
        description: "Create an account and start the 30-day Professional trial.",
        body: `{
  "email": "engineer@example.com",
  "password": "min8chars",
  "full_name": "Kabbo Hasan",
  "company_name": "Hasan Heating",
  "phone": "07700 900000"
}`,
      },
      {
        method: "POST",
        path: "/auth/login",
        description: "Sign in and receive tokens plus the account, plan and trial state.",
        body: `{ "email": "engineer@example.com", "password": "min8chars" }`,
      },
      {
        method: "POST",
        path: "/auth/refresh",
        description: "Exchange a refresh token for a new session.",
        body: `{ "refresh_token": "<refresh_token>" }`,
      },
      { method: "GET", path: "/auth/me", description: "Current user, settings, subscription and trial days.", auth: true },
      { method: "POST", path: "/auth/logout", description: "Revoke the current token globally.", auth: true },
    ],
  },
  {
    id: "subscription",
    title: "Plans & subscription",
    intro:
      "Read subscription state anywhere in the app. Creating business data requires an active plan; after the trial ends protected writes return 402 SUBSCRIPTION_REQUIRED.",
    endpoints: [
      { method: "GET", path: "/plans", description: "Public plan catalogue with monthly and yearly prices." },
      { method: "GET", path: "/subscription", description: "Current subscription, plan and trial days left.", auth: true },
      {
        method: "POST",
        path: "/subscription/checkout",
        description: "Start Stripe Checkout, or activate directly when Stripe is not configured.",
        body: `{ "plan_id": "pro", "billing_interval": "monthly" }`,
        auth: true,
      },
      { method: "POST", path: "/subscription/cancel", description: "Cancel at the end of the current period.", auth: true },
      { method: "POST", path: "/subscription/resume", description: "Undo a pending cancellation.", auth: true },
    ],
  },
  {
    id: "contacts",
    title: "Contacts",
    intro: "Clients, installations and suppliers. Search across name, email, phone and postcode.",
    endpoints: [
      {
        method: "GET",
        path: "/contacts",
        description: "List contacts.",
        query: "?search=patel&type=client&limit=50&offset=0",
        auth: true,
      },
      {
        method: "POST",
        path: "/contacts",
        description: "Create a contact.",
        body: `{ "name": "Mrs Patel", "phone": "07700 900000", "postcode": "M1 1AE", "type": "client" }`,
        auth: true,
      },
      { method: "GET", path: "/contacts/:id", description: "Fetch one contact.", auth: true },
      { method: "PATCH", path: "/contacts/:id", description: "Update supplied fields.", auth: true },
      { method: "DELETE", path: "/contacts/:id", description: "Delete a contact.", auth: true },
    ],
  },
  {
    id: "documents",
    title: "Invoices & quotes",
    intro:
      "Invoices and quotes share the same document model and line items. Totals are calculated server-side from quantity × unit price plus tax.",
    endpoints: [
      {
        method: "GET",
        path: "/invoices",
        description: "List invoices with items and payments.",
        query: "?status=overdue&search=INV&limit=50&offset=0",
        auth: true,
      },
      {
        method: "POST",
        path: "/invoices",
        description: "Create an invoice. Set type to quote on /quotes.",
        body: `{
  "client_name": "Mrs Patel",
  "issue_date": "2026-10-25",
  "due_date": "2026-11-08",
  "tax_rate": 20,
  "items": [
    { "description": "Boiler service", "quantity": 1, "unit_price": 85 }
  ]
}`,
        auth: true,
      },
      { method: "GET", path: "/invoices/:id", description: "Fetch an invoice with items and payments.", auth: true },
      { method: "PATCH", path: "/invoices/:id", description: "Update header fields or status.", auth: true },
      { method: "DELETE", path: "/invoices/:id", description: "Delete an invoice and its items.", auth: true },
      { method: "GET", path: "/invoices/:id/payments", description: "List payments for an invoice.", auth: true },
      {
        method: "POST",
        path: "/invoices/:id/payments",
        description: "Record a payment. Invoice status and balance are recalculated automatically.",
        body: `{ "amount": 85, "method": "bank", "reference": "BACS-123" }`,
        auth: true,
      },
      { method: "GET", path: "/quotes", description: "List quotes.", query: "?status=accepted&search=QT", auth: true },
      { method: "POST", path: "/quotes", description: "Create a quote using the same body as an invoice.", auth: true },
      { method: "GET", path: "/quotes/:id", description: "Fetch a quote with items.", auth: true },
      { method: "PATCH", path: "/quotes/:id", description: "Update a quote.", auth: true },
      { method: "DELETE", path: "/quotes/:id", description: "Delete a quote.", auth: true },
      { method: "POST", path: "/quotes/:id/convert", description: "Convert a quote into a new draft invoice and mark the quote accepted.", auth: true },
    ],
  },
  {
    id: "schedule",
    title: "Schedule & reminders",
    intro: "Calendar appointments and the follow-up reminders shown on the home screen.",
    endpoints: [
      {
        method: "GET",
        path: "/appointments",
        description: "List appointments, optionally by date range and status.",
        query: "?from=2026-10-01T00:00:00Z&to=2026-11-01T00:00:00Z&status=scheduled",
        auth: true,
      },
      {
        method: "POST",
        path: "/appointments",
        description: "Create an appointment.",
        body: `{
  "title": "Landlord CP12",
  "location": "42 Elm Road",
  "starts_at": "2026-10-25T14:00:00Z",
  "alert_minutes": 60,
  "contact_id": null
}`,
        auth: true,
      },
      { method: "PATCH", path: "/appointments/:id", description: "Update or mark an appointment complete.", auth: true },
      { method: "DELETE", path: "/appointments/:id", description: "Delete an appointment.", auth: true },
      { method: "GET", path: "/reminders", description: "List reminders.", query: "?status=pending&kind=invoice", auth: true },
      {
        method: "POST",
        path: "/reminders",
        description: "Create a reminder for a gas report, invoice or custom task.",
        body: `{ "title": "Chase invoice", "kind": "invoice", "due_date": "2026-11-01" }`,
        auth: true,
      },
      { method: "PATCH", path: "/reminders/:id", description: "Mark done, dismissed or edit.", auth: true },
      { method: "DELETE", path: "/reminders/:id", description: "Delete a reminder.", auth: true },
    ],
  },
  {
    id: "reports",
    title: "Gas reports",
    intro:
      "Gas safety certificates, warning notices and service records. Appliances, defects and readings are stored as JSON so the Flutter form can evolve without schema changes.",
    endpoints: [
      { method: "GET", path: "/report-types", description: "Static list of supported certificate types and icons.", auth: true },
      { method: "GET", path: "/reports", description: "List reports.", query: "?status=completed&type=domestic-landlord-gas-safety&search=CP12", auth: true },
      {
        method: "POST",
        path: "/reports",
        description: "Create a report.",
        body: `{
  "type": "domestic-landlord-gas-safety",
  "reference": "CP12-0042",
  "status": "draft",
  "property_postcode": "M1 1AE",
  "appliances": [{ "name": "Worcester 8000", "kw": 24 }],
  "readings": {}
}`,
        auth: true,
      },
      { method: "GET", path: "/reports/:id", description: "Fetch one report.", auth: true },
      { method: "PATCH", path: "/reports/:id", description: "Update a report. Completed reports stamp completed_at.", auth: true },
      { method: "DELETE", path: "/reports/:id", description: "Delete a report.", auth: true },
    ],
  },
  {
    id: "tools",
    title: "Gas rate & dashboard",
    intro: "The calculator can return an unsaved preview or save the calculation to history.",
    endpoints: [
      {
        method: "POST",
        path: "/gas-rate",
        description: "Calculate gross and net kW. Send save: false for a preview.",
        body: `{ "meter_type": "metric", "reading1": 0, "reading2": 0.02, "seconds": 42, "save": true }`,
        auth: true,
      },
      { method: "GET", path: "/gas-rate", description: "Calculation history, newest first.", query: "?limit=20&offset=0", auth: true },
      { method: "GET", path: "/dashboard/summary", description: "Counts, outstanding balance, upcoming jobs and reminders.", auth: true },
    ],
  },
  {
    id: "account",
    title: "Account, uploads & backup",
    intro: "Settings drive every generated document. Files are stored in the private Supabase bucket and returned as signed URLs.",
    endpoints: [
      { method: "GET", path: "/settings", description: "Business settings and document prefixes.", auth: true },
      { method: "PATCH", path: "/settings", description: "Update any supplied settings field.", auth: true },
      { method: "PATCH", path: "/profile", description: "Update name, company, phone, Gas Safe ID or avatar.", auth: true },
      {
        method: "POST",
        path: "/uploads",
        description: "Multipart upload with fields file and folder (max 15 MB; JPEG, PNG, WebP, HEIC, PDF).",
        auth: true,
      },
      { method: "GET", path: "/uploads/sign", description: "Create a temporary signed URL.", query: "?path=<storage_path>&expires=3600", auth: true },
      {
        method: "POST",
        path: "/device-tokens",
        description: "Register an FCM token for push notifications.",
        body: `{ "token": "<fcm_token>", "platform": "android" }`,
        auth: true,
      },
      { method: "GET", path: "/backup", description: "Export all data. Add raw=true to download a JSON file.", auth: true },
      { method: "POST", path: "/backup", description: "Store a copy in Supabase Storage and record it in history.", auth: true },
      {
        method: "POST",
        path: "/backup/restore",
        description: "Restore a previous export. Merge keeps current data; replace deletes it first.",
        body: `{ "backup": { "version": 1, "data": { "...": "..." } }, "mode": "merge" }`,
        auth: true,
      },
    ],
  },
];

const errorRows = [
  ["400", "INVALID_JSON", "The request body is not valid JSON."],
  ["401", "UNAUTHORIZED / INVALID_TOKEN", "Missing, expired or invalid access token."],
  ["402", "SUBSCRIPTION_REQUIRED", "Trial ended and no active plan. Send the user to billing."],
  ["403", "FORBIDDEN", "The record belongs to another user."],
  ["404", "NOT_FOUND", "Record does not exist for this user."],
  ["413", "FILE_TOO_LARGE", "Upload exceeds 15 MB."],
  ["415", "UNSUPPORTED_FILE", "Only images or PDF files are allowed."],
  ["422", "VALIDATION_ERROR", "Field validation failed; details contains the field errors."],
  ["503", "DATABASE_NOT_READY", "Supabase migration or exposed schema has not been applied."],
];

const methodStyles: Record<Endpoint["method"], string> = {
  GET: "bg-blue-100 text-blue-700",
  POST: "bg-brand-100 text-brand-800",
  PATCH: "bg-amber-100 text-amber-800",
  DELETE: "bg-red-100 text-red-700",
};

export default function DocsPage() {
  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-ghost">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
            <Link href="/signup" className="btn-primary">
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">On this page</p>
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {section.title}
              </a>
            ))}
            <a href="#errors" className="block rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              Errors
            </a>
            <a href="#flutter" className="block rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              Flutter client
            </a>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Developer reference</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Gas Checker REST API</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
              Versioned JSON API for the Flutter app. Base URL: <code className="code">https://your-domain.com/api/v1</code>.
              All requests and responses use JSON except file uploads.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-4">
              <Braces className="h-4 w-4 text-brand-600" />
              <p className="mt-2 text-sm font-bold text-slate-900">Envelope</p>
              <p className="mt-1 text-xs text-slate-500">
                Every response is <code className="code">{`{ data, error, meta }`}</code>.
              </p>
            </div>
            <div className="card p-4">
              <KeyRound className="h-4 w-4 text-brand-600" />
              <p className="mt-2 text-sm font-bold text-slate-900">Bearer auth</p>
              <p className="mt-1 text-xs text-slate-500">
                <code className="code">Authorization: Bearer &lt;access_token&gt;</code>
              </p>
            </div>
            <div className="card p-4">
              <Smartphone className="h-4 w-4 text-brand-600" />
              <p className="mt-2 text-sm font-bold text-slate-900">Trial aware</p>
              <p className="mt-1 text-xs text-slate-500">402 responses include subscription state.</p>
            </div>
          </div>

          <section className="mt-10">
            <h2 className="text-lg font-extrabold text-slate-900">Response format</h2>
            <pre className="codeblock">{`// Success
{ "data": { "id": "..." }, "error": null, "meta": null }

// List with pagination
{ "data": [ ... ], "error": null, "meta": { "count": 42, "limit": 50, "offset": 0 } }

// Failure
{ "data": null, "error": { "code": "SUBSCRIPTION_REQUIRED", "message": "...", "details": null } }`}</pre>
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              A 402 means the 30-day trial has ended. Show the paywall and call{" "}
              <code className="code">/subscription/checkout</code>; do not treat it as a network failure.
            </div>
          </section>

          {sections.map((section) => (
            <section key={section.id} id={section.id} className="mt-12 scroll-mt-24">
              <h2 className="text-lg font-extrabold text-slate-900">{section.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{section.intro}</p>
              <div className="mt-4 space-y-2">
                {section.endpoints.map((endpoint) => (
                  <details key={`${endpoint.method}-${endpoint.path}`} className="group rounded-2xl border border-slate-200 bg-white">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-4 py-3">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-black ${methodStyles[endpoint.method]}`}>
                        {endpoint.method}
                      </span>
                      <code className="text-xs font-bold text-slate-900">/api/v1{endpoint.path}</code>
                      <span className="ml-auto text-xs text-slate-400 group-open:hidden">{endpoint.description}</span>
                    </summary>
                    <div className="border-t border-slate-100 px-4 py-3">
                      <p className="text-xs leading-relaxed text-slate-600">{endpoint.description}</p>
                      {endpoint.query && <p className="mt-2 text-xs text-slate-500">Query: <code className="code">{endpoint.query}</code></p>}
                      {endpoint.body && (
                        <pre className="codeblock mt-2 text-[11px]">{endpoint.body}</pre>
                      )}
                      {endpoint.auth && <p className="mt-2 text-[11px] font-semibold text-amber-700">Requires Bearer token</p>}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <section id="errors" className="mt-12 scroll-mt-24">
            <h2 className="text-lg font-extrabold text-slate-900">Errors</h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Status</th>
                    <th className="px-4 py-2 font-semibold">Code</th>
                    <th className="px-4 py-2 font-semibold">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {errorRows.map(([status, code, meaning]) => (
                    <tr key={status + code}>
                      <td className="px-4 py-2 font-mono font-bold text-slate-700">{status}</td>
                      <td className="px-4 py-2 font-mono text-slate-600">{code}</td>
                      <td className="px-4 py-2 text-slate-500">{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="flutter" className="mt-12 scroll-mt-24">
            <h2 className="text-lg font-extrabold text-slate-900">Flutter client</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Store both tokens securely, attach the access token to each call, and refresh once on a 401 before
              signing the user out.
            </p>
            <pre className="codeblock">{`import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  ApiClient({required this.baseUrl, required this.getToken, required this.onRefresh});

  final String baseUrl;              // https://your-domain.com/api/v1
  final Future<String?> Function() getToken;
  final Future<bool> Function() onRefresh;

  Future<Map<String, dynamic>> request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool retried = false,
  }) async {
    final token = await getToken();
    final response = await http.Request(method, Uri.parse('$baseUrl$path'))
      ..headers.addAll({
        'content-type': 'application/json',
        if (token != null) 'authorization': 'Bearer $token',
      })
      ..body = body == null ? '' : jsonEncode(body);

    final streamed = await response.send();
    final decoded = jsonDecode(await streamed.stream.bytesToString());

    if (streamed.statusCode == 401 && !retried && await onRefresh()) {
      return request(method, path, body: body, retried: true);
    }
    if (streamed.statusCode >= 400) {
      throw ApiException(
        code: decoded['error']?['code'] ?? 'UNKNOWN',
        message: decoded['error']?['message'] ?? 'Request failed',
        status: streamed.statusCode,
      );
    }
    return decoded['data'] as Map<String, dynamic>;
  }
}`}</pre>
            <p className="mt-3 text-xs text-slate-500">
              For multipart uploads use <code className="code">MultipartRequest</code> to{" "}
              <code className="code">/api/v1/uploads</code> with fields <code className="code">file</code> and{" "}
              <code className="code">folder</code>.
            </p>
          </section>

          <div className="mt-12 flex flex-col items-start justify-between gap-3 rounded-3xl bg-slate-950 px-6 py-6 text-white sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold">Ready to power your Flutter app?</p>
              <p className="text-xs text-slate-400">Create an account to receive a trial token pair.</p>
            </div>
            <Link href="/signup" className="btn-primary bg-white text-brand-800 hover:bg-brand-50">
              Get an API account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
