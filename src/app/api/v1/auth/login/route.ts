import { handleRoute, ok, parseBody } from "@/lib/api";
import { authTokenPayload, signInWithPassword } from "@/lib/auth-service";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const input = loginSchema.parse(await parseBody(request));
    const result = await signInWithPassword(input.email, input.password);
    return ok(authTokenPayload(result));
  });
}
