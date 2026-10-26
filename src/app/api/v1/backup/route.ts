import { ApiError, handleRoute, ok, requireActiveSubscription, requireAccount } from "@/lib/api";
import { exportUserData } from "@/lib/backup";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const backup = await exportUserData(ctx.admin, ctx.user.id);
    const url = new URL(request.url);

    if (url.searchParams.get("raw") === "true") {
      return new Response(JSON.stringify(backup, null, 2), {
        headers: {
          "content-type": "application/json",
          "content-disposition": `attachment; filename="gas-checker-backup-${new Date()
            .toISOString()
            .slice(0, 10)}.json"`,
        },
      });
    }

    const { data: history } = await ctx.admin
      .from("backups")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return ok({ backup, history: history || [] });
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const backup = await exportUserData(ctx.admin, ctx.user.id);
    const payload = Buffer.from(JSON.stringify(backup), "utf8");
    const path = `${ctx.user.id}/backups/backup-${Date.now()}.json`;

    const { error: uploadError } = await ctx.admin.storage
      .from(env.storageBucket)
      .upload(path, payload, { contentType: "application/json", upsert: true });

    if (uploadError) {
      if (/bucket/i.test(uploadError.message)) {
        throw new ApiError(
          503,
          "STORAGE_NOT_READY",
          `Storage bucket "${env.storageBucket}" was not found. Run the Supabase migration to create it.`,
        );
      }
      throw uploadError;
    }

    const { data: record, error } = await ctx.admin
      .from("backups")
      .insert({ user_id: ctx.user.id, file_path: path, size_bytes: payload.byteLength })
      .select("*")
      .single();
    if (error) throw error;

    const { data: signed } = await ctx.admin.storage
      .from(env.storageBucket)
      .createSignedUrl(path, 7 * 24 * 60 * 60);

    return ok(
      {
        backup: record,
        signed_url: signed?.signedUrl || null,
        counts: {
          contacts: backup.data.contacts?.length || 0,
          documents: backup.data.documents?.length || 0,
          appointments: backup.data.appointments?.length || 0,
          reminders: backup.data.reminders?.length || 0,
          gas_reports: backup.data.gas_reports?.length || 0,
        },
      },
      undefined,
      { status: 201 },
    );
  });
}
