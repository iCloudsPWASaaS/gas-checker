import Link from "next/link";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_0%,#0c734a_0%,transparent_60%)]" />
        <div className="relative">
          <Logo href="/" className="[&_span:last-child]:text-white" />
        </div>
        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-brand-200">
            <Sparkles className="h-3.5 w-3.5" /> 30 days free. No card required.
          </span>
          <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight">
            Everything you need to run a gas business from your phone.
          </h2>
          <ul className="mt-7 space-y-3 text-sm text-slate-300">
            {[
              "Domestic & commercial certificates",
              "Quotes, invoices and payment tracking",
              "Schedule, contacts and reminders",
              "Gas rate calculator and cloud backup",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-brand-300">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-brand-400" />
          Your data is stored in your own Supabase project.
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 lg:hidden">
          <Logo />
          <Link href="/" className="text-xs font-semibold text-slate-500">
            Back to site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-12">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-black tracking-tight text-slate-950">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-7 text-center text-sm text-slate-500">{footer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
