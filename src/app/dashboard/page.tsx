import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GmvTile } from "@/components/gmv-tile";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignStatePill } from "@/components/campaign-state-pill";
import { getT } from "@/lib/i18n/server";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.brandId) redirect("/login");

  const t = await getT();
  const brandId = session.user.brandId;
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [brand, reports, recent] = await Promise.all([
    prisma.brand.findUnique({ where: { id: brandId } }),
    prisma.report.findMany({
      where: { createdAt: { gte: since }, campaign: { brandId } },
      include: { campaign: true },
    }),
    prisma.campaign.findMany({
      where: { brandId },
      include: { influencer: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  const gmvUsd = reports.reduce((s, r) => s + r.gmvUsd, 0);
  const byPlatform = reports.reduce<Record<string, { count: number; gmvUsd: number }>>((acc, r) => {
    const p = r.campaign.platform;
    acc[p] ??= { count: 0, gmvUsd: 0 };
    acc[p].count += 1;
    acc[p].gmvUsd += r.gmvUsd;
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t.dashboard.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {brand ? t.dashboard.welcome(brand.company, brand.vertical, brand.budgetUsd) : ""}
          </p>
        </div>
        <nav className="flex gap-3 text-sm">
          <Link href="/discover" className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700">
            {t.dashboard.discoverCta}
          </Link>
          <Link href="/campaigns" className="rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">
            {t.dashboard.allCampaigns}
          </Link>
        </nav>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <GmvTile gmvUsd={gmvUsd} campaignCount={reports.length} windowDays={30} />
        {(["INSTAGRAM", "TIKTOK", "YOUTUBE_SHORTS"] as const).map((p) => (
          <Card key={p}>
            <CardHeader>
              <CardTitle>{p.replace("_", " ")}</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-2xl font-semibold text-slate-900">
                {byPlatform[p]?.count ?? 0}
              </p>
              <p className="text-xs uppercase tracking-wide text-slate-400">{t.dashboard.completedCampaigns}</p>
              <p className="mt-2 text-sm text-slate-600">
                {t.dashboard.gmv}: ${new Intl.NumberFormat("en-US").format(byPlatform[p]?.gmvUsd ?? 0)}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">{t.dashboard.recent}</h2>
        {recent.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-slate-600">
                {t.dashboard.emptyPre}{" "}
                <Link href="/discover" className="text-brand-600 hover:underline">
                  {t.dashboard.emptyLink}
                </Link>
                .
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {recent.map((c) => (
              <Card key={c.id}>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/campaigns/${c.id}`} className="font-medium text-slate-900 hover:underline">
                        {c.influencer.displayName}
                      </Link>
                      <CampaignStatePill state={c.state} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      @{c.influencer.handle} · {c.platform.replace("_", " ")} · ${c.offerUsd}
                    </p>
                  </div>
                  <Link href={`/campaigns/${c.id}`} className="text-sm text-brand-600 hover:underline">
                    {t.dashboard.open}
                  </Link>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
