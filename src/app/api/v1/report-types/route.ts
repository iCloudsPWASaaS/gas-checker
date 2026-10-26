import { handleRoute, ok } from "@/lib/api";
import { REPORT_TYPES } from "@/lib/report-types";

export async function GET() {
  return handleRoute(async () => ok(REPORT_TYPES));
}
