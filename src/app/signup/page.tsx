import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start your 30-day free Gas Checker trial. No card required.",
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Start your 30-day free trial"
      subtitle="Create your account and get instant access to every Professional feature."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
