import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ data: { success: true }, error: null, meta: null });
  response.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions(), maxAge: 0 });
  return response;
}
