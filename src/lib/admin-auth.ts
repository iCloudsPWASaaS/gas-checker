import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const ADMIN_COOKIE = "gc_admin_session";
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;

export type AdminSession = {
  email: string;
  expires_at: number;
};

type TokenPayload = {
  email: string;
  exp: number;
};

export function adminAuthConfigured() {
  return Boolean(env.adminEmails.length && env.adminPassword && env.adminSessionSecret);
}

function sign(payload: string) {
  return createHmac("sha256", env.adminSessionSecret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isAdminEmail(email: string | null | undefined) {
  return Boolean(email && env.adminEmails.includes(email.trim().toLowerCase()));
}

export function verifyAdminCredentials(email: string, password: string) {
  if (!adminAuthConfigured()) return false;
  if (!isAdminEmail(email)) return false;

  const input = createHash("sha256").update(password).digest();
  const expected = createHash("sha256").update(env.adminPassword).digest();
  return timingSafeEqual(input, expected);
}

export function createAdminSessionToken(email: string) {
  if (!adminAuthConfigured()) {
    throw new Error("Admin authentication is not configured.");
  }

  const payload: TokenPayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminSessionToken(token: string | null | undefined): AdminSession | null {
  if (!token || !adminAuthConfigured()) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  if (!safeEqual(signature, sign(encoded))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as TokenPayload;
    if (!payload || typeof payload.email !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!isAdminEmail(payload.email)) return null;

    return {
      email: payload.email.trim().toLowerCase(),
      expires_at: payload.exp * 1000,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return verifyAdminSessionToken(store.get(ADMIN_COOKIE)?.value);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.siteUrl.startsWith("https://"),
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  };
}
