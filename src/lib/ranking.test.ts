import { describe, it, expect } from "vitest";
import { rankInfluencers } from "./ranking";
import type { Influencer } from "@prisma/client";

function mk(overrides: Partial<Influencer> = {}): Influencer {
  const base: Influencer = {
    id: overrides.id ?? "i1",
    handle: overrides.handle ?? "h",
    platform: overrides.platform ?? "INSTAGRAM",
    displayName: overrides.displayName ?? "name",
    followers: overrides.followers ?? 50_000,
    engagement: overrides.engagement ?? 0.05,
    verticals: overrides.verticals ?? "beauty,skincare",
    country: overrides.country ?? "US",
    source: overrides.source ?? "MOCK",
    createdAt: overrides.createdAt ?? new Date(),
  };
  return base;
}

describe("rankInfluencers", () => {
  it("ranks on-vertical above off-vertical", () => {
    const a = mk({ id: "a", verticals: "beauty,skincare" });
    const b = mk({ id: "b", verticals: "gaming,tech" });
    const ranked = rankInfluencers([a, b], { vertical: "beauty", budgetUsd: 1000 });
    expect(ranked[0].influencer.id).toBe("a");
  });

  it("prefers budget-matched over mismatched", () => {
    // Both on-vertical, but "cheap" implied rate matches a small budget better.
    const cheap = mk({ id: "c", followers: 8_000, engagement: 0.08 });
    const pricey = mk({ id: "p", followers: 500_000, engagement: 0.03 });
    const ranked = rankInfluencers([cheap, pricey], { vertical: "beauty", budgetUsd: 200 });
    expect(ranked[0].influencer.id).toBe("c");
  });

  it("returns fitScore in [0, 1]", () => {
    const ranked = rankInfluencers([mk()], { vertical: "beauty", budgetUsd: 500 });
    expect(ranked[0].fitScore).toBeGreaterThanOrEqual(0);
    expect(ranked[0].fitScore).toBeLessThanOrEqual(1);
  });
});
