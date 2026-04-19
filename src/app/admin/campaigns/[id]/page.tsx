import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CampaignForm } from "../campaign-form";
import { CampaignStatePill } from "@/components/campaign-state-pill";
import { getT } from "@/lib/i18n/server";

export default async function AdminCampaignEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getT();
  const { id } = await params;
  const c = await prisma.campaign.findUnique({
    where: { id },
    include: { brand: true, influencer: true },
  });
  if (!c) redirect("/admin/campaigns");

  return (
    <div>
      <Link href="/admin/campaigns" className="text-sm text-brand-600 hover:underline">
        {t.admin.common.back}
      </Link>
      <div className="mb-4 mt-2 flex items-center gap-3">
        <h2 className="text-xl font-semibold text-slate-900">{t.admin.campaigns.formTitle}</h2>
        <CampaignStatePill state={c.state} />
      </div>
      <p className="mb-4 text-sm text-slate-500">
        {t.admin.campaigns.brand}: <strong>{c.brand.company}</strong> · {t.admin.campaigns.influencer}:{" "}
        <strong>@{c.influencer.handle}</strong> · {c.platform.replace("_", " ")}
      </p>
      <CampaignForm
        initial={{ id: c.id, brief: c.brief, offerUsd: c.offerUsd, state: c.state }}
      />
    </div>
  );
}
