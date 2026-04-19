import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { InfluencerForm } from "../influencer-form";
import { getT } from "@/lib/i18n/server";

export default async function AdminInfluencerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getT();
  const { id } = await params;
  const i = await prisma.influencer.findUnique({ where: { id } });
  if (!i) redirect("/admin/influencers");

  return (
    <div>
      <Link href="/admin/influencers" className="text-sm text-brand-600 hover:underline">
        {t.admin.common.back}
      </Link>
      <h2 className="mb-4 mt-2 text-xl font-semibold text-slate-900">
        {t.admin.influencers.formTitle}
      </h2>
      <InfluencerForm
        initial={{
          id: i.id,
          handle: i.handle,
          platform: i.platform,
          displayName: i.displayName,
          followers: i.followers,
          engagement: i.engagement,
          verticals: i.verticals,
          country: i.country,
        }}
      />
    </div>
  );
}
