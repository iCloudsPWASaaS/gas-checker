import { authenticate, handleRoute, ok } from "@/lib/api";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { admin, token } = await authenticate(request);
    if (token) {
      try {
        await admin.auth.admin.signOut(token, "global");
      } catch {
        // Token may already be revoked - logout still succeeds.
      }
    }
    return ok({ success: true });
  });
}
