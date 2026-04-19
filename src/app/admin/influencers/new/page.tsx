import Link from "next/link";
import { InfluencerForm } from "../influencer-form";
import { getT } from "@/lib/i18n/server";

export default async function AdminInfluencerNewPage() {
  const t = await getT();
  return (
    <div>
      <Link href="/admin/influencers" className="text-sm text-brand-600 hover:underline">
        {t.admin.common.back}
      </Link>
      <h2 className="mb-4 mt-2 text-xl font-semibold text-slate-900">
        {t.admin.influencers.addNew}
      </h2>
      <InfluencerForm />
    </div>
  );
}
