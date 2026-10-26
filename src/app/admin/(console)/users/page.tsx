import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, UserRound } from "lucide-react";
import { Badge, PageHeader } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Admin users" };

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
};

const PAGE_SIZE = 25;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await requireAdminPage();
  const { q, page } = await searchParams;
  const search = (q || "").trim();
  const safeSearch = search.replace(/[%,()]/g, "");
  const currentPage = Math.max(Math.trunc(Number(page || 1)) || 1, 1);
  const from = (currentPage - 1) * PAGE_SIZE;

  let query = session.admin
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (safeSearch) {
    query = query.or(
      `email.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%,company_name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%`,
    );
  }

  const { data: profiles, count } = await query;
  const rows = (profiles || []) as UserRow[];
  const userIds = rows.map((profile) => profile.id);

  const [{ data: subscriptions }, { data: plans }] = await Promise.all([
    userIds.length ? session.admin.from("subscriptions").select("*").in("user_id", userIds) : Promise.resolve({ data: [] }),
    session.admin.from("plans").select("id,name"),
  ]);

  const subMap = new Map((subscriptions || []).map((sub) => [sub.user_id, sub]));
  const planMap = new Map((plans || []).map((plan) => [plan.id, plan]));
  const total = count || 0;
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  function pageHref(target: number) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (target > 1) params.set("page", String(target));
    const suffix = params.toString();
    return suffix ? `/admin/users?${suffix}` : "/admin/users";
  }

  return (
    <div>
      <PageHeader
        eyebrow="Accounts"
        title="Users"
        description="Search every Gas Checker account, inspect their plan and open the full management view."
        action={
          <Link href="/admin/subscriptions" className="btn-secondary">
            <UserRound className="h-4 w-4" /> Subscriptions
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap items-center gap-2" action="/admin/users">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={search} className="input pl-9" placeholder="Search name, email, company or phone" />
        </div>
        <button type="submit" className="btn-primary">
          Search
        </button>
        {search && (
          <Link href="/admin/users" className="btn-secondary">
            Clear
          </Link>
        )}
        <span className="ml-auto text-xs font-semibold text-slate-500">{total} users</span>
      </form>

      <div className="table-wrap">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th">User</th>
              <th className="th">Company</th>
              <th className="th">Role</th>
              <th className="th">Plan</th>
              <th className="th">Status</th>
              <th className="th">Joined</th>
              <th className="th text-right">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((profile) => {
              const sub = subMap.get(profile.id);
              return (
                <tr key={profile.id} className="hover:bg-slate-50/70">
                  <td className="td">
                    <Link href={`/admin/users/${profile.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                      {profile.full_name || "Unnamed user"}
                    </Link>
                    <p className="text-xs text-slate-500">{profile.email}</p>
                    {profile.phone && <p className="text-xs text-slate-400">{profile.phone}</p>}
                  </td>
                  <td className="td text-xs text-slate-600">{profile.company_name || "—"}</td>
                  <td className="td">
                    <span className={`badge ${profile.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                      {profile.role || "owner"}
                    </span>
                  </td>
                  <td className="td text-xs text-slate-700">{sub ? planMap.get(sub.plan_id)?.name || sub.plan_id : "—"}</td>
                  <td className="td">{sub ? <Badge status={sub.status} /> : <Badge status="incomplete" label="No subscription" />}</td>
                  <td className="td text-xs text-slate-500">{formatDate(profile.created_at)}</td>
                  <td className="td text-right">
                    <Link href={`/admin/users/${profile.id}`} className="text-xs font-bold text-brand-700 hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="td py-10 text-center text-slate-500">
                  No users match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>
          Page {currentPage} of {pages}
        </span>
        <div className="flex gap-2">
          {currentPage > 1 ? (
            <Link href={pageHref(currentPage - 1)} className="btn-secondary px-3 py-1.5 text-xs">
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Link>
          ) : (
            <span className="btn-secondary pointer-events-none px-3 py-1.5 text-xs opacity-50">
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </span>
          )}
          {currentPage < pages ? (
            <Link href={pageHref(currentPage + 1)} className="btn-secondary px-3 py-1.5 text-xs">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className="btn-secondary pointer-events-none px-3 py-1.5 text-xs opacity-50">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
