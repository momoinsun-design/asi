"use client";

import type { CampaignState } from "@prisma/client";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/i18n/provider";

const COLOR: Record<CampaignState, string> = {
  DRAFT:       "bg-slate-100 text-slate-700",
  SENT:        "bg-blue-100 text-blue-700",
  NEGOTIATING: "bg-amber-100 text-amber-700",
  ACCEPTED:    "bg-teal-100 text-teal-700",
  FUNDED:      "bg-indigo-100 text-indigo-700",
  DELIVERED:   "bg-violet-100 text-violet-700",
  COMPLETED:   "bg-emerald-100 text-emerald-700",
  CANCELLED:   "bg-rose-100 text-rose-700",
};

export function CampaignStatePill({ state }: { state: CampaignState }) {
  const { t } = useLocale();
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", COLOR[state])}>
      {t.campaignState[state]}
    </span>
  );
}
