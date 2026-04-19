import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignStatePill } from "@/components/campaign-state-pill";
import { CampaignActions } from "./actions";
import { OutreachComposer } from "./outreach-composer";
import { getT } from "@/lib/i18n/server";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.brandId) redirect("/login");

  const t = await getT();
  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, brandId: session.user.brandId },
    include: {
      influencer: true,
      outreach: { orderBy: { createdAt: "asc" } },
      escrow: true,
      report: true,
    },
  });
  if (!campaign) redirect("/campaigns");

  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/campaigns" className="text-sm text-brand-600 hover:underline">
        {t.campaignDetail.allCampaigns}
      </Link>

      <header className="mt-3 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-900">{campaign.influencer.displayName}</h1>
          <CampaignStatePill state={campaign.state} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          @{campaign.influencer.handle} · {campaign.platform.replace("_", " ")} ·{" "}
          {campaign.influencer.country}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t.campaignDetail.brief}</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{campaign.brief}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.campaignDetail.terms}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">{t.campaignDetail.offer}</span>{" "}
              <strong>{money.format(campaign.offerUsd)}</strong>
            </p>
            <p>
              <span className="text-slate-500">{t.campaignDetail.escrow}</span>{" "}
              {campaign.escrow ? `${campaign.escrow.state} · ${money.format(campaign.escrow.amountUsd)}` : t.campaignDetail.notFunded}
            </p>
            {campaign.report && (
              <p>
                <span className="text-slate-500">{t.campaignDetail.gmv}</span>{" "}
                <strong>{money.format(campaign.report.gmvUsd)}</strong>
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">{t.campaignDetail.actions}</h2>
        <CampaignActions
          campaignId={campaign.id}
          state={campaign.state}
          hasEscrow={!!campaign.escrow}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">{t.campaignDetail.negotiation}</h2>
        <div className="space-y-3">
          {campaign.outreach.length === 0 ? (
            <p className="text-sm text-slate-500">{t.campaignDetail.noMessages}</p>
          ) : (
            campaign.outreach.map((m) => (
              <div
                key={m.id}
                className={
                  m.sender === "BRAND"
                    ? "ml-auto max-w-md rounded-xl bg-brand-600 p-4 text-white"
                    : "mr-auto max-w-md rounded-xl border border-slate-200 bg-white p-4 text-slate-800"
                }
              >
                <p className="text-xs opacity-70">
                  {m.sender} · {new Date(m.createdAt).toLocaleString()}
                </p>
                <p className="mt-1 text-sm">{m.body}</p>
                {m.counterUsd ? (
                  <p className="mt-2 text-xs opacity-80">
                    {t.campaignDetail.counterOffer} {money.format(m.counterUsd)}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
        <div className="mt-5">
          <OutreachComposer campaignId={campaign.id} />
        </div>
      </section>
    </main>
  );
}
