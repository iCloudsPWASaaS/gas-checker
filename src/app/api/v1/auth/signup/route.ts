import { handleRoute, ok, parseBody } from "@/lib/api";
import { authTokenPayload, createAccount, signInWithPassword } from "@/lib/auth-service";
import { signupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const input = signupSchema.parse(await parseBody(request));
    await createAccount(input);
    const result = await signInWithPassword(input.email, input.password);
    return ok(authTokenPayload(result), undefined, { status: 201 });
  });
}
