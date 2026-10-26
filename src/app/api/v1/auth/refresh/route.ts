import { handleRoute, ok, parseBody } from "@/lib/api";
import { authTokenPayload, refreshSession } from "@/lib/auth-service";
import { refreshSchema } from "@/lib/validation";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { refresh_token } = refreshSchema.parse(await parseBody(request));
    const result = await refreshSession(refresh_token);
    return ok(authTokenPayload(result));
  });
}
