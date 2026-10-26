import { ApiError, handleRoute, ok, parseBody } from "@/lib/api";
import { logAdminAction, requireAdminApi } from "@/lib/admin";
import { adminUserRoleSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireAdminApi();
    const { id } = await params;
    const input = adminUserRoleSchema.parse(await parseBody(request));

    const { data: profile } = await ctx.admin.from("profiles").select("id,email").eq("id", id).maybeSingle();
    if (!profile) throw new ApiError(404, "NOT_FOUND", "User profile not found.");

    const { data, error } = await ctx.admin
      .from("profiles")
      .update({ role: input.role })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;

    await logAdminAction(ctx.admin, ctx.email, "user.role_update", "user", id, {
      email: profile.email,
      role: input.role,
    });

    return ok(data);
  });
}
