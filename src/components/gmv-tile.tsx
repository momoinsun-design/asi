"use client";

import { useLocale } from "@/lib/i18n/provider";

export function GmvTile({
  gmvUsd,
  campaignCount,
  windowDays,
}: {
  gmvUsd: number;
  campaignCount: number;
  windowDays: number;
}) {
  const { t } = useLocale();
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const unit = campaignCount === 1 ? t.gmvTile.campaign : t.gmvTile.campaigns;
  return (
    <div className="rounded-xl border border-brand-500 bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-sm">
      <p className="text-xs uppercase tracking-wide text-brand-100">{t.gmvTile.label(windowDays)}</p>
      <p className="mt-2 text-4xl font-bold">{fmt.format(gmvUsd)}</p>
      <p className="mt-2 text-sm text-brand-100">
        {campaignCount} {unit}
      </p>
    </div>
  );
}
