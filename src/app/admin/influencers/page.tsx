import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { getLocale, getT } from "@/lib/i18n/server";
import { countryName } from "@/lib/countries";
import { platformLabel } from "@/lib/sns";

export default async function AdminInfluencersPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const influencers = await prisma.influencer.findMany({
    orderBy: [{ platform: "asc" }, { handle: "asc" }],
  });
  const number = new Intl.NumberFormat("en-US");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{t.admin.influencers.title}</h2>
        <Link href="/admin/influencers/new">
          <Button variant="primary">{t.admin.influencers.addNew}</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Handle</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Followers</th>
              <th className="px-4 py-3">Engagement</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Verticals</th>
              <th className="px-4 py-3 text-right">{t.admin.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {influencers.map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  @{i.handle}
                  <div className="text-xs text-slate-500">{i.displayName}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{platformLabel(i.platform)}</td>
                <td className="px-4 py-3 text-slate-600">{number.format(i.followers)}</td>
                <td className="px-4 py-3 text-slate-600">{(i.engagement * 100).toFixed(1)}%</td>
                <td className="px-4 py-3 text-slate-600">{countryName(i.country, locale)}</td>
                <td className="px-4 py-3 text-slate-500">{i.verticals}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/influencers/${i.id}`}
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    {t.admin.influencers.edit}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
