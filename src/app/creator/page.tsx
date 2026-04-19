import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { CampaignStatePill } from "@/components/campaign-state-pill";
import { platformLabel } from "@/lib/sns";
import { getT } from "@/lib/i18n/server";

export default async function CreatorHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.influencerId) redirect("/dashboard");

  const t = await getT();
  const [influencer, campaigns] = await Promise.all([
    prisma.influencer.findUnique({ where: { id: session.user.influencerId } }),
    prisma.campaign.findMany({
      where: { influencerId: session.user.influencerId },
      include: { brand: true, escrow: true, report: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  if (!influencer) redirect("/login");

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t.creator.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t.creator.subtitle(influencer.displayName, influencer.handle)} ·{" "}
          {platformLabel(influencer.platform)}
        </p>
      </header>

      {campaigns.length === 0 ? (
        <Card>
          <CardBody>
            <p className="font-medium text-slate-900">{t.creator.emptyTitle}</p>
            <p className="mt-1 text-sm text-slate-600">{t.creator.emptyBody}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardBody className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {c.brand.company}
                    </Link>
                    <CampaignStatePill state={c.state} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {t.creator.briefFrom}: {c.brand.company} · {money.format(c.offerUsd)}
                    {c.escrow ? ` · escrow ${c.escrow.state}` : ""}
                    {c.report ? ` · GMV ${money.format(c.report.gmvUsd)}` : ""}
                  </p>
                </div>
                <Link href={`/campaigns/${c.id}`} className="text-sm text-brand-600 hover:underline">
                  {t.creator.viewCampaign}
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
