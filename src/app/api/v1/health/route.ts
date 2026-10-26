import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  let database = "ok";
  let adminSchema = "ok";
  let schema = env.schema;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("plans").select("id").limit(1);
    if (error) {
      database = "unavailable";
      schema = `${env.schema} (not exposed or missing)`;
    }

    const { error: adminError } = await admin.from("platform_settings").select("id").limit(1);
    if (adminError) {
      adminSchema = "missing (run 0002_admin.sql)";
    }
  } catch {
    database = "unavailable";
    adminSchema = "unavailable";
  }

  return NextResponse.json({
    status: database === "ok" && adminSchema === "ok" ? "ok" : "degraded",
    service: "gas-checker",
    version: "1.0.0",
    schema,
    admin_schema: adminSchema,
    storage_bucket: env.storageBucket,
    database,
    time: new Date().toISOString(),
  });
}
