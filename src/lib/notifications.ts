import type { AdminClient } from "@/lib/supabase/admin";

export type NotificationInput = {
  title: string;
  body?: string | null;
  kind?: string;
  link?: string | null;
};

export async function createNotification(admin: AdminClient, userId: string, input: NotificationInput) {
  const { error } = await admin.from("notifications").insert({
    user_id: userId,
    title: input.title,
    body: input.body ?? null,
    kind: input.kind || "system",
    link: input.link ?? null,
  });

  if (error) {
    console.error("[notifications]", error.message);
  }
}
