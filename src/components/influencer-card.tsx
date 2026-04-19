import Link from "next/link";
import type { Platform } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { profileUrl, platformLabel } from "@/lib/sns";
import type { Dict } from "@/lib/i18n/dict";

interface Props {
  influencer: {
    id: string;
    handle: string;
    displayName: string;
    platform: Platform;
    followers: number;
    engagement: number;
    verticals: string[];
    country: string;
    countryLabel?: string;
    fitScore: number;
    expectedReach: number;
    budgetMatch: number;
    impliedRateUsd: number;
  };
  offerPreset?: number;
  labels: Dict["influencerCard"];
}

export function InfluencerCard({ influencer: i, offerPreset, labels }: Props) {
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const offer = offerPreset ?? i.impliedRateUsd;
  const pretty = new Intl.NumberFormat("en-US");
  const sns = profileUrl(i.platform, i.handle);
  const country = i.countryLabel ?? i.country;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">{i.displayName}</h3>
        <Badge className="bg-brand-100 text-brand-700">
          {labels.fit} {pct(i.fitScore)}
        </Badge>
      </div>
      <p className="text-sm text-slate-500">
        @{i.handle} · {platformLabel(i.platform)} · {country}
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <Stat label={labels.followers} value={pretty.format(i.followers)} />
        <Stat label={labels.engagement} value={pct(i.engagement)} />
        <Stat label={labels.budgetMatch} value={pct(i.budgetMatch)} />
        <Stat label={labels.expectedReach} value={pretty.format(i.expectedReach)} />
        <Stat label={labels.impliedRate} value={`$${pretty.format(i.impliedRateUsd)}`} />
        <Stat label={labels.verticals} value={i.verticals.slice(0, 2).join(", ")} />
      </dl>

      <div className="mt-5 flex items-center gap-3">
        <Link
          href={`/campaigns/new?influencerId=${encodeURIComponent(i.id)}&platform=${i.platform}&offerUsd=${offer}`}
          className="inline-block rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
        >
          {labels.startCampaign}
        </Link>
        <a
          href={sns}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          {labels.viewProfile}
        </a>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}
