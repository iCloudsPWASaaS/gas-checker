export type ApiEnvelope<T> = {
  data: T;
  error: { code: string; message: string; details?: unknown } | null;
  meta?: Record<string, unknown> | null;
};

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { "content-type": "application/json" }),
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error(`Request failed (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(payload?.error?.message || `Request failed (${response.status})`);
  }

  return payload.data;
}
