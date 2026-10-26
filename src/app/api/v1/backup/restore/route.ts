import { ApiError, handleRoute, ok, parseBody, requireActiveSubscription, requireAccount } from "@/lib/api";
import { restoreUserData, type BackupPayload } from "@/lib/backup";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);

    const body = await parseBody<{
      backup?: BackupPayload | string;
      mode?: "merge" | "replace";
    }>(request);

    let backup = body.backup;
    if (typeof backup === "string") {
      try {
        backup = JSON.parse(backup) as BackupPayload;
      } catch {
        throw new ApiError(422, "INVALID_BACKUP", "Backup file is not valid JSON.");
      }
    }

    if (!backup || !backup.data) {
      throw new ApiError(422, "INVALID_BACKUP", "Provide a Gas Checker backup object.");
    }

    const counts = await restoreUserData(
      ctx.admin,
      ctx.user.id,
      backup,
      body.mode === "replace" ? "replace" : "merge",
    );

    return ok({ restored: true, mode: body.mode || "merge", counts });
  });
}
