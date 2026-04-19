import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";

export default async function AdminOverviewPage() {
  const t = await getT();
  const [influencers, brands, campaigns, completed, gmv] = await Promise.all([
    prisma.influencer.count(),
    prisma.brand.count(),
    prisma.campaign.count(),
    prisma.campaign.count({ where: { state: "COMPLETED" } }),
    prisma.report.aggregate({ _sum: { gmvUsd: true } }),
  ]);

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const number = new Intl.NumberFormat("en-US");

  const tiles: { label: string; value: string }[] = [
    { label: t.admin.stats.totalInfluencers, value: number.format(influencers) },
    { label: t.admin.stats.totalBrands, value: number.format(brands) },
    { label: t.admin.stats.totalCampaigns, value: number.format(campaigns) },
    { label: t.admin.stats.completedCampaigns, value: number.format(completed) },
    { label: t.admin.stats.gmv, value: money.format(gmv._sum.gmvUsd ?? 0) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <CardHeader>
            <CardTitle>{tile.label}</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{tile.value}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
