import { handleRoute, ok } from "@/lib/api";
import { createDocument, listDocuments } from "@/lib/services/documents";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const result = await listDocuments(request, "invoice");
    return ok(result.data, { count: result.count, limit: result.limit, offset: result.offset });
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const document = await createDocument(request, "invoice");
    return ok(document, undefined, { status: 201 });
  });
}
