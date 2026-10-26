import type { Metadata } from "next";
import { DocumentPage } from "@/components/document-page";

export const metadata: Metadata = { title: "Quote" };

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentPage id={id} type="quote" />;
}
