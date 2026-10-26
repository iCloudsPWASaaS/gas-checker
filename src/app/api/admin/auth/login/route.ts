import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handleRoute, parseBody } from "@/lib/api";
import {
  ADMIN_COOKIE,
  adminAuthConfigured,
  adminCookieOptions,
  createAdminSessionToken,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimitKey(request: Request, email: string) {
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  return `${ip}:${email.toLowerCase()}`;
}

function checkLimit(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return true;
  }
  return entry.count < MAX_ATTEMPTS;
}

function recordFailure(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    if (!adminAuthConfigured()) {
      throw new ApiError(
        503,
        "ADMIN_NOT_CONFIGURED",
        "Admin login is not configured. Set ADMIN_EMAILS, ADMIN_PASSWORD and ADMIN_SESSION_SECRET.",
      );
    }

    const input = loginSchema.parse(await parseBody(request));
    const key = rateLimitKey(request, input.email.trim());

    if (!checkLimit(key)) {
      throw new ApiError(429, "TOO_MANY_ATTEMPTS", "Too many attempts. Try again in 15 minutes.");
    }

    if (!verifyAdminCredentials(input.email, input.password)) {
      recordFailure(key);
      throw new ApiError(401, "INVALID_ADMIN_CREDENTIALS", "Invalid admin email or password.");
    }

    attempts.delete(key);
    const email = input.email.trim().toLowerCase();
    const token = createAdminSessionToken(email);

    const response = NextResponse.json({
      data: { email, expires_in: adminCookieOptions().maxAge },
      error: null,
      meta: null,
    });
    response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());

    void logAdminAction(createAdminClient(), email, "admin.login", "admin_session", null, {});

    return response;
  });
}
