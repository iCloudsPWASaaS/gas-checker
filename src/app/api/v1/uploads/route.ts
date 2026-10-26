import { ApiError, handleRoute, ok, requireActiveSubscription, requireAccount } from "@/lib/api";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);

    const form = await request.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "uploads").replace(/[^a-zA-Z0-9_-]/g, "");

    if (!(file instanceof File)) {
      throw new ApiError(422, "FILE_REQUIRED", "Attach a file using the 'file' field.");
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      throw new ApiError(413, "FILE_TOO_LARGE", "Files must be between 1 byte and 15 MB.");
    }
    if (file.type && !ALLOWED.includes(file.type)) {
      throw new ApiError(415, "UNSUPPORTED_FILE", "Only JPEG, PNG, WebP, HEIC or PDF files are allowed.");
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${ctx.user.id}/${folder || "uploads"}/${Date.now()}-${safeName}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error } = await ctx.admin.storage
      .from(env.storageBucket)
      .upload(path, bytes, { contentType: file.type || "application/octet-stream", upsert: false });

    if (error) {
      if (/bucket/i.test(error.message)) {
        throw new ApiError(
          503,
          "STORAGE_NOT_READY",
          `Storage bucket "${env.storageBucket}" was not found. Run the Supabase migration to create it.`,
        );
      }
      throw error;
    }

    const { data: signed } = await ctx.admin.storage
      .from(env.storageBucket)
      .createSignedUrl(path, 7 * 24 * 60 * 60);

    return ok(
      {
        bucket: env.storageBucket,
        path,
        signed_url: signed?.signedUrl || null,
        size_bytes: file.size,
        content_type: file.type || null,
      },
      undefined,
      { status: 201 },
    );
  });
}
