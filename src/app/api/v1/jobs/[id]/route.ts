import {
  ApiError,
  handleRoute,
  ok,
  parseBody,
  requireActiveSubscription,
  requireAccount,
} from "@/lib/api";
import { createNotification } from "@/lib/notifications";
import { jobUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const { id } = await params;

    const { data, error } = await ctx.admin
      .from("jobs")
      .select("*")
      .eq("id", id)
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, "NOT_FOUND", "Job not found.");

    return ok(data);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const { id } = await params;
    const input = jobUpdateSchema.parse(await parseBody(request));

    if (input.status === "completed" && !input.completed_at) {
      input.completed_at = new Date().toISOString();
    }

    const { data, error } = await ctx.admin
      .from("jobs")
      .update(input)
      .eq("id", id)
      .eq("user_id", ctx.user.id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, "NOT_FOUND", "Job not found.");

    if (input.status) {
      await createNotification(ctx.admin, ctx.user.id, {
        title: input.status === "completed" ? "Job completed" : "Job updated",
        body: data.title,
        kind: "job",
        link: "/dashboard/jobs",
      });
    }

    return ok(data);
  });
}

export async function DELETE(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const { id } = await params;

    const { error } = await ctx.admin.from("jobs").delete().eq("id", id).eq("user_id", ctx.user.id);
    if (error) throw error;
    return ok({ deleted: true, id });
  });
}
