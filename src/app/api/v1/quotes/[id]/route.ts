import { handleRoute, ok } from "@/lib/api";
import { deleteDocument, getDocument, updateDocument } from "@/lib/services/documents";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const { id } = await params;
    return ok(await getDocument(request, id, "quote"));
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const { id } = await params;
    return ok(await updateDocument(request, id));
  });
}

export async function DELETE(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const { id } = await params;
    return ok(await deleteDocument(request, id));
  });
}
