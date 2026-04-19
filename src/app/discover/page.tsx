import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rankInfluencers } from "@/lib/ranking";
import { InfluencerCard } from "@/components/influencer-card";
import { getLocale, getT } from "@/lib/i18n/server";
import { countryName } from "@/lib/countries";
import type { Platform } from "@prisma/client";

const PLATFORMS: Platform[] = ["INSTAGRAM", "TIKTOK", "YOUTUBE_SHORTS"];

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    vertical?: string;
    platform?: string;
    budgetUsd?: string;
    country?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.brandId) redirect("/login");

  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const params = await searchParams;
  const brand = await prisma.brand.findUnique({ where: { id: session.user.brandId } });
  if (!brand) redirect("/signup");

  const vertical = (params.vertical ?? brand.vertical).toLowerCase();
  const budgetUsd = Number(params.budgetUsd ?? brand.budgetUsd);
  const platformFilter: Platform | undefined =
    params.platform && PLATFORMS.includes(params.platform as Platform)
      ? (params.platform as Platform)
      : undefined;
  const countryFilter = params.country && params.country !== "" ? params.country : undefined;

  const [pool, countryRows, verticalRows] = await Promise.all([
    prisma.influencer.findMany({
      where: {
        ...(platformFilter ? { platform: platformFilter } : {}),
        ...(countryFilter ? { country: countryFilter } : {}),
      },
    }),
    prisma.influencer.findMany({ distinct: ["country"], select: { country: true } }),
    prisma.influencer.findMany({ select: { verticals: true } }),
  ]);

  const countries = Array.from(new Set(countryRows.map((r) => r.country)))
    .map((code) => ({ code, label: countryName(code, locale) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const verticalSet = new Set<string>();
  for (const row of verticalRows) {
    for (const v of row.verticals.split(",")) {
      const trimmed = v.trim().toLowerCase();
      if (trimmed) verticalSet.add(trimmed);
    }
  }
  const verticals = Array.from(verticalSet).sort();

  const ranked = rankInfluencers(pool, { vertical, budgetUsd }).slice(0, 24);
  const countrySubtitle = countryFilter ? countryName(countryFilter, locale) : t.discover.allCountries;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t.discover.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t.discover.subtitle(
            vertical,
            new Intl.NumberFormat("en-US").format(budgetUsd),
            platformFilter ?? t.discover.allPlatforms,
          )}
          {` · ${countrySubtitle}`}
        </p>
      </header>

      <form className="mb-6 flex flex-wrap gap-2" method="get">
        <select
          name="vertical"
          defaultValue={vertical}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value={vertical}>{vertical}</option>
          {verticals
            .filter((v) => v !== vertical)
            .map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
        </select>
        <input
          name="budgetUsd"
          type="number"
          defaultValue={budgetUsd}
          min={1}
          className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="platform"
          defaultValue={platformFilter ?? ""}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">{t.discover.allPlatforms}</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          name="country"
          defaultValue={countryFilter ?? ""}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">{t.discover.allCountries}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          {t.discover.refresh}
        </button>
      </form>

      {ranked.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {t.discover.empty}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ranked.map((r) => (
            <InfluencerCard
              key={r.influencer.id}
              influencer={{
                id: r.influencer.id,
                handle: r.influencer.handle,
                displayName: r.influencer.displayName,
                platform: r.influencer.platform,
                followers: r.influencer.followers,
                engagement: r.influencer.engagement,
                verticals: r.influencer.verticals.split(",").map((s) => s.trim()),
                country: r.influencer.country,
                countryLabel: countryName(r.influencer.country, locale),
                fitScore: r.fitScore,
                expectedReach: r.expectedReach,
                budgetMatch: r.budgetMatch,
                impliedRateUsd: r.impliedRateUsd,
              }}
              labels={t.influencerCard}
            />
          ))}
        </div>
      )}
    </main>
  );
}
