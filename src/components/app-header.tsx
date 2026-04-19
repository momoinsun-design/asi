import Link from "next/link";
import { auth } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { LocaleSwitcher } from "./locale-switcher";

export async function AppHeader() {
  const session = await auth();
  const t = await getT();
  const isAuthed = !!session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";
  const isBrand = !!session?.user?.brandId;
  const isCreator = !!session?.user?.influencerId;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-5">
          <Link href="/" className="text-sm font-semibold text-brand-700">
            ASI
          </Link>
          {isAuthed && (
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              {isBrand && (
                <>
                  <Link href="/dashboard" className="hover:text-brand-700">
                    {t.nav.dashboard}
                  </Link>
                  <Link href="/discover" className="hover:text-brand-700">
                    {t.nav.discover}
                  </Link>
                  <Link href="/campaigns" className="hover:text-brand-700">
                    {t.nav.campaigns}
                  </Link>
                </>
              )}
              {isCreator && (
                <Link href="/creator" className="hover:text-brand-700">
                  {t.nav.creator}
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200"
                >
                  {t.nav.admin}
                </Link>
              )}
            </nav>
          )}
        </div>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
