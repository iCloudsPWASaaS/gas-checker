import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Flame, ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getAdminSession } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_0%,#0d9159_0%,transparent_70%)] opacity-40" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-float">
            <Flame className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-xl font-black tracking-tight text-white">
              Gas<span className="text-brand-400">Checker</span>
            </p>
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              <ShieldCheck className="h-3 w-3" /> Admin console
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Restricted access</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in with the platform admin credentials. This is separate from customer sign-in.
          </p>
          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </div>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Gas Checker
        </Link>
      </div>
    </div>
  );
}
