import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BellRing,
  CalendarDays,
  Check,
  ChevronRight,
  Cloud,
  FileBadge2,
  Flame,
  Gauge,
  Smartphone,
  Sparkles,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { loadPlans } from "@/lib/auth-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/utils";

const features = [
  {
    icon: FileBadge2,
    title: "Gas safety certificates",
    description:
      "Domestic, commercial, warning notices, servicing records and continuation pages - ready to complete on site.",
  },
  {
    icon: CalendarDays,
    title: "Schedule & reminders",
    description: "A shared calendar for jobs, landlord visits and follow-ups with overdue reminders that shout louder.",
  },
  {
    icon: Banknote,
    title: "Quotes, invoices & payments",
    description: "Build a quote, convert it to an invoice, record cash, card, bank or iZettle payments in seconds.",
  },
  {
    icon: Gauge,
    title: "Gas rate calculator",
    description: "Metric and imperial gas rate calculations with gross and net kW - saved to your history.",
  },
  {
    icon: Users,
    title: "Contacts that stay useful",
    description: "Keep landlords, agents and installations together with full address and contact history.",
  },
  {
    icon: Cloud,
    title: "Cloud backup",
    description: "Download a full JSON backup or store it securely in your own Supabase project anytime.",
  },
];

const steps = [
  "Create your account and get 30 days of Professional free.",
  "Add your company details, gas engineer ID and certificate prefixes.",
  "Complete certificates, raise invoices and schedule the next visit.",
];

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const plans = await loadPlans(createAdminClient());

  return (
    <div className="overflow-hidden">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#pricing" className="hover:text-slate-900">
              Pricing
            </a>
            <Link href="/docs" className="hover:text-slate-900">
              Flutter API
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost hidden sm:inline-flex">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary">
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,#d6f9e6_0%,#f7f9fb_60%)]" />
        <div className="mx-auto grid max-w-6xl gap-14 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-brand-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              30-day free trial · no card required
            </div>
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              The gas engineer&apos;s
              <span className="text-brand-600"> pocket office.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Certificates, invoices, payments, contacts, reminders and gas rate calculations in one beautifully simple
              app. Built for gas engineers who would rather be finished than filling in forms.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn-primary px-6 py-3 text-base">
                Start 30-day free trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/login" className="btn-secondary px-6 py-3 text-base">
                Sign in
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-brand-600" /> Built for Gas Safe work
              </span>
              <span className="inline-flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-brand-600" /> Web + Flutter API
              </span>
              <span className="inline-flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" /> Cancel anytime
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-200/60 via-white to-blue-200/40 blur-2xl" />
            <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-float">
              <div className="rounded-3xl bg-slate-950 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
                      <Flame className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs text-slate-400">Good afternoon</p>
                      <p className="text-sm font-bold">Kabbo Hasan</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-brand-200">
                    TRIAL · 30 DAYS
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Outstanding</p>
                    <p className="mt-1 text-xl font-extrabold">£1,284.00</p>
                    <p className="text-[10px] text-brand-300">4 invoices</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">This month</p>
                    <p className="mt-1 text-xl font-extrabold">18</p>
                    <p className="text-[10px] text-brand-300">certificates</p>
                  </div>
                </div>
                <div className="mt-3 rounded-2xl bg-white/5 p-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Next job</span>
                    <span>Today · 14:00</span>
                  </div>
                  <p className="mt-2 text-sm font-bold">Landlord CP12 · 42 Elm Road</p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                    <Wrench className="h-3 w-3" /> 2 appliances · boiler service
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {["Schedule", "Reports", "Invoices", "Gas rate"].map((item) => (
                    <div key={item} className="rounded-xl bg-white/5 px-1 py-2 text-center text-[9px] text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-float sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <Check className="h-4 w-4" />
              </span>
              <div className="text-xs">
                <p className="font-bold text-slate-900">Certificate complete</p>
                <p className="text-slate-500">PDF ready to share</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Everything in one place</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Stop juggling paper, WhatsApp and spreadsheets.
          </h2>
          <p className="mt-3 text-slate-600">
            Gas Checker follows the way you actually work - from the first phone call to the final payment.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-float">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="text-base font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Up and running in minutes</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Your trial includes every Professional feature.
            </h2>
            <ul className="mt-6 space-y-4">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-sm text-slate-600">{step}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup" className="btn-primary mt-7">
              Create my free account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="card overflow-hidden p-0">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500">
              What&apos;s coming up
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { title: "Landlord CP12", meta: "42 Elm Road · Today 14:00", icon: FileBadge2 },
                { title: "Boiler service invoice", meta: "Mrs Patel · Due in 3 days", icon: Banknote },
                { title: "Gas rate check", meta: "22.4 kW gross · saved yesterday", icon: Gauge },
                { title: "Reminder: overdue invoice", meta: "INV-0032 · £240.00", icon: BellRing },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3 px-5 py-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.meta}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Simple pricing</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Start free. Upgrade when you&apos;re ready.
          </h2>
          <p className="mt-3 text-slate-600">
            Every new account gets 30 days of Professional free. No card required, cancel anytime.
          </p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const featured = plan.id === "pro";
            const yearlySaving = Math.round(
              ((plan.monthly_price * 12 - plan.yearly_price) / (plan.monthly_price * 12)) * 100,
            );
            return (
              <div
                key={plan.id}
                className={
                  featured
                    ? "relative rounded-3xl border-2 border-brand-600 bg-white p-7 shadow-float"
                    : "relative rounded-3xl border border-slate-200 bg-white p-7 shadow-card"
                }
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Most popular · trial plan
                  </span>
                )}
                <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight text-slate-950">
                    {formatMoney(plan.monthly_price, plan.currency)}
                  </span>
                  <span className="text-sm text-slate-500">/month</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  or {formatMoney(plan.yearly_price, plan.currency)}/year · save {yearlySaving}%
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={featured ? "btn-primary mt-7 w-full" : "btn-secondary mt-7 w-full"}>
                  Start 30-day trial
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">For teams building Flutter apps</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">A complete REST API, ready for your mobile app.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Every screen in Gas Checker is powered by a versioned JSON API with bearer-token auth, refresh tokens and
              subscription gating. Point your Flutter client at <code className="rounded bg-white/10 px-1.5 py-0.5">/api/v1</code>{" "}
              and ship.
            </p>
          </div>
          <Link href="/docs" className="btn-primary bg-white text-brand-800 hover:bg-brand-50">
            Read the API docs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <Logo />
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Gas Checker. Built for gas engineers. Not affiliated with Gas Safe Register.
        </p>
        <div className="flex gap-4 text-xs font-semibold text-slate-500">
          <Link href="/login" className="hover:text-slate-900">
            Sign in
          </Link>
          <Link href="/signup" className="hover:text-slate-900">
            Create account
          </Link>
          <Link href="/docs" className="hover:text-slate-900">
            API
          </Link>
        </div>
      </footer>
    </div>
  );
}
