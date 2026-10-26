import { ApiError, handleRoute, ok, requireAccount } from "@/lib/api";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { ctx } = await requireAccount(request);
    const url = new URL(request.url);
    const path = url.searchParams.get("path");
    const rawExpires = Number(url.searchParams.get("expires") || 3600);
    const expires = Number.isFinite(rawExpires) ? Math.min(Math.max(Math.trunc(rawExpires), 60), 604800) : 3600;

    if (!path) {
      throw new ApiError(422, "PATH_REQUIRED", "Provide a storage path.");
    }
    if (!path.startsWith(`${ctx.user.id}/`)) {
      throw new ApiError(403, "FORBIDDEN", "You can only sign your own files.");
    }

    const { data, error } = await ctx.admin.storage.from(env.storageBucket).createSignedUrl(path, expires);
    if (error) throw error;
    return ok({ signed_url: data.signedUrl, path, expires_in: expires });
  });
}
