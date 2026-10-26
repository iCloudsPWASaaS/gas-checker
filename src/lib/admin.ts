import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin";

export type AdminPageSession = {
  admin: AdminClient;
  email: string;
  expires_at: number;
};

export type AdminApiContext = {
  admin: AdminClient;
  email: string;
};

export async function requireAdminPage(): Promise<AdminPageSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return {
    admin: createAdminClient(),
    email: session.email,
    expires_at: session.expires_at,
  };
}

export async function requireAdminApi(): Promise<AdminApiContext> {
  const session = await getAdminSession();
  if (!session) {
    throw new ApiError(401, "ADMIN_UNAUTHORIZED", "Sign in to the admin console to continue.");
  }

  return {
    admin: createAdminClient(),
    email: session.email,
  };
}

export async function logAdminAction(
  admin: AdminClient,
  actorEmail: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
) {
  const { error } = await admin.from("admin_audit_log").insert({
    admin_user_id: null,
    admin_email: actorEmail,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
  if (error) {
    console.error("[admin-audit]", error.message);
  }
}
