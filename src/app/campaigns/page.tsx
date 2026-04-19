import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { CampaignStatePill } from "@/components/campaign-state-pill";
import { getT } from "@/lib/i18n/server";

export default async function CampaignsListPage() {
  const session = await auth();
  if (!session?.user?.brandId) redirect("/login");

  const t = await getT();
  const campaigns = await prisma.campaign.findMany({
    where: { brandId: session.user.brandId },
    include: { influencer: true, escrow: true, report: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6 flex items-end justify-between">
        <h1 className="text-3xl font-bold text-slate-900">{t.campaigns.title}</h1>
        <Link
          href="/discover"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t.campaigns.startNew}
        </Link>
      </header>

      {campaigns.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-600">
              {t.campaigns.emptyPre}{" "}
              <Link href="/discover" className="text-brand-600 hover:underline">
                {t.campaigns.emptyLink}
              </Link>{" "}
              {t.campaigns.emptyPost}
            </p>
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
                      {c.influencer.displayName}
                    </Link>
                    <CampaignStatePill state={c.state} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    @{c.influencer.handle} · {c.platform.replace("_", " ")} · ${c.offerUsd}
                    {c.escrow ? ` · ${t.campaigns.escrowLabel} ${c.escrow.state}` : ""}
                    {c.report ? ` · ${t.campaigns.gmv} $${c.report.gmvUsd}` : ""}
                  </p>
                </div>
                <Link href={`/campaigns/${c.id}`} className="text-sm text-brand-600 hover:underline">
                  {t.campaigns.open}
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
