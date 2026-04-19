import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewCampaignForm } from "./new-campaign-form";
import { getT } from "@/lib/i18n/server";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ influencerId?: string; platform?: string; offerUsd?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.brandId) redirect("/login");

  const t = await getT();
  const params = await searchParams;
  if (!params.influencerId) redirect("/discover");

  const influencer = await prisma.influencer.findUnique({
    where: { id: params.influencerId },
  });
  if (!influencer) redirect("/discover");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-bold text-slate-900">{t.newCampaign.title}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {t.newCampaign.with} <strong>{influencer.displayName}</strong> @{influencer.handle} ·{" "}
        {influencer.platform.replace("_", " ")} · {influencer.country}
      </p>

      <NewCampaignForm
        influencerId={influencer.id}
        platform={influencer.platform}
        defaultOfferUsd={Number(params.offerUsd ?? 500)}
      />
    </main>
  );
}
