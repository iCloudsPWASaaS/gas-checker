export function parsePagination(url: URL) {
  const rawLimit = Number(url.searchParams.get("limit") || 50);
  const rawOffset = Number(url.searchParams.get("offset") || 0);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 200) : 50;
  const offset = Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0;
  return { limit, offset };
}

export function searchParam(url: URL, key: string) {
  const value = url.searchParams.get(key);
  return value ? value.trim() : null;
}

export function boolParam(url: URL, key: string) {
  const value = url.searchParams.get(key);
  if (value === null) return null;
  return value === "true" || value === "1";
}
