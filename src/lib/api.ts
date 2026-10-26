import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { User } from "@supabase/supabase-js";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccount, type Account } from "@/lib/account";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function ok<T>(data: T, meta?: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json({ data, error: null, meta: meta || null }, init);
}

export function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ data: null, error: { code, message, details: details || null } }, { status });
}

export function isDbNotReady(error: unknown) {
  const candidate = error as { code?: string; message?: string; details?: string } | null;
  if (!candidate) return false;
  const text = `${candidate.code || ""} ${candidate.message || ""} ${candidate.details || ""}`.toLowerCase();
  return (
    candidate.code === "PGRST106" ||
    candidate.code === "PGRST205" ||
    text.includes("schema cache") ||
    text.includes("could not find the table") ||
    text.includes("invalid schema") ||
    text.includes("schema must be one of")
  );
}

export function handleRoute<T>(handler: () => Promise<T | Response>): Promise<Response> {
  return handler()
    .then((result) => (result instanceof Response ? result : NextResponse.json(result)))
    .catch((error) => {
      if (error instanceof ApiError) {
        return fail(error.status, error.code, error.message, error.details);
      }
      if (error instanceof ZodError) {
        return fail(422, "VALIDATION_ERROR", "Please check the supplied fields.", error.flatten());
      }
      if (isDbNotReady(error)) {
        return fail(
          503,
          "DATABASE_NOT_READY",
          "The gas-checker database schema is not ready. Run supabase/migrations/0001_init.sql and expose the gas-checker schema in Supabase API settings.",
        );
      }
      if (error instanceof Error && /missing environment variable/i.test(error.message)) {
        return fail(500, "CONFIGURATION_ERROR", error.message);
      }
      console.error("[api]", error);
      const message = error instanceof Error ? error.message : "Unexpected server error";
      return fail(500, "INTERNAL_ERROR", message);
    });
}

export type AuthContext = {
  user: User;
  admin: AdminClient;
  token: string | null;
};

export async function authenticate(request: Request): Promise<AuthContext> {
  const admin = createAdminClient();
  const authorization = request.headers.get("authorization");

  if (authorization) {
    if (!authorization.toLowerCase().startsWith("bearer ")) {
      throw new ApiError(401, "UNAUTHORIZED", "Authorization header must use a Bearer token.");
    }
    const token = authorization.slice(7).trim();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) {
      throw new ApiError(401, "INVALID_TOKEN", "Access token is invalid or expired.");
    }
    return { user: data.user, admin, token };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new ApiError(401, "UNAUTHORIZED", "Sign in to continue.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return { user: data.user, admin, token: session?.access_token || null };
}

export async function requireAccount(request: Request): Promise<{ ctx: AuthContext; account: Account }> {
  const ctx = await authenticate(request);
  const account = await getAccount(ctx.user, ctx.admin);
  return { ctx, account };
}

export function requireActiveSubscription(account: Account) {
  if (!account.subscription_active) {
    throw new ApiError(
      402,
      "SUBSCRIPTION_REQUIRED",
      "Your free trial has ended. Choose a plan to keep using Gas Checker.",
      {
        subscription: account.subscription,
        trial_end: account.subscription?.trial_end || null,
      },
    );
  }
}

export async function parseBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}
