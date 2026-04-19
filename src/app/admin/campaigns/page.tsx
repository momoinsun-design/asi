import Link from "next/link";
import { prisma } from "@/lib/db";
import { CampaignStatePill } from "@/components/campaign-state-pill";
import { getT } from "@/lib/i18n/server";

export default async function AdminCampaignsPage() {
  const t = await getT();
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { brand: true, influencer: true, escrow: true, report: true },
  });
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{t.admin.campaigns.title}</h2>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Influencer</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Offer</th>
              <th className="px-4 py-3">GMV</th>
              <th className="px-4 py-3 text-right">{t.admin.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{c.brand.company}</td>
                <td className="px-4 py-3 text-slate-600">
                  {c.influencer.displayName}
                  <div className="text-xs text-slate-500">
                    @{c.influencer.handle} · {c.platform.replace("_", " ")}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <CampaignStatePill state={c.state} />
                </td>
                <td className="px-4 py-3 text-slate-600">{money.format(c.offerUsd)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {c.report ? money.format(c.report.gmvUsd) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/campaigns/${c.id}`}
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    {t.admin.campaigns.edit}
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
