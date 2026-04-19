import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdminPage } from "@/lib/admin";
import { getT } from "@/lib/i18n/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  const t = await getT();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{t.admin.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.admin.subtitle}</p>
      </header>
      <nav className="mb-8 flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-sm">
        <AdminNavLink href="/admin">{t.admin.navDashboard}</AdminNavLink>
        <AdminNavLink href="/admin/influencers">{t.admin.navInfluencers}</AdminNavLink>
        <AdminNavLink href="/admin/brands">{t.admin.navBrands}</AdminNavLink>
        <AdminNavLink href="/admin/campaigns">{t.admin.navCampaigns}</AdminNavLink>
      </nav>
      {children}
    </div>
  );
}

function AdminNavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand-700"
    >
      {children}
    </Link>
  );
}
