import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Gas Checker account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <>
          New to Gas Checker?{" "}
          <Link href="/signup" className="font-semibold text-brand-700 hover:text-brand-800">
            Start your free trial
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
