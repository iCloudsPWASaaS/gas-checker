import type { Metadata } from "next";
import { DocumentPage } from "@/components/document-page";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentPage id={id} type="invoice" />;
}
