import type { Influencer } from "@prisma/client";

export interface RankingInput {
  vertical: string;
  budgetUsd: number;
  // Rough heuristic: CPM ≈ engagement × followers × $0.02 as implied rate.
}

export interface RankedInfluencer {
  influencer: Influencer;
  fitScore: number;
  expectedReach: number;
  budgetMatch: number;
  impliedRateUsd: number;
}

function impliedRate(i: Influencer): number {
  // Simple proxy for what an influencer might charge per campaign post.
  // Not meant to be accurate — swapped later for real rate-card data.
  return Math.round(i.followers * 0.008 + i.followers * i.engagement * 0.5);
}

function verticalOverlap(verticals: string[], target: string): number {
  if (!target) return 0.4;
  const q = target.toLowerCase().trim();
  const hits = verticals.filter((v) => v.toLowerCase().includes(q) || q.includes(v.toLowerCase()));
  return hits.length > 0 ? Math.min(1, 0.5 + hits.length * 0.25) : 0.2;
}

export function rankInfluencers(items: Influencer[], input: RankingInput): RankedInfluencer[] {
  const target = input.vertical.toLowerCase();

  return items
    .map((i): RankedInfluencer => {
      const tags = i.verticals.split(",").map((s) => s.trim()).filter(Boolean);
      const vOverlap = verticalOverlap(tags, target);
      const rate = impliedRate(i);
      const budgetMatch = input.budgetUsd > 0
        ? Math.max(0, Math.min(1, 1 - Math.abs(rate - input.budgetUsd) / Math.max(rate, input.budgetUsd)))
        : 0.5;
      // engagement rewarded, oversize followers slightly penalized for small brands
      const engagementBonus = Math.min(1, i.engagement * 6);
      const scaleFactor = i.followers < 5_000 ? 0.6
        : i.followers < 100_000 ? 1.0
        : i.followers < 500_000 ? 0.85
        : 0.6;

      const fitScore = Number((
        0.45 * vOverlap +
        0.30 * budgetMatch +
        0.20 * engagementBonus +
        0.05 * scaleFactor
      ).toFixed(4));

      const expectedReach = Math.round(i.followers * (0.25 + i.engagement));

      return {
        influencer: i,
        fitScore,
        expectedReach,
        budgetMatch: Number(budgetMatch.toFixed(4)),
        impliedRateUsd: rate,
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore);
}
