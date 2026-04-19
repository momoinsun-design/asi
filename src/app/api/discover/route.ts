import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DiscoverQuerySchema } from "@/lib/validators";
import { rankInfluencers } from "@/lib/ranking";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.brandId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = DiscoverQuerySchema.safeParse({
    vertical: url.searchParams.get("vertical") ?? undefined,
    platform: url.searchParams.get("platform") ?? undefined,
    budgetUsd: url.searchParams.get("budgetUsd") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const brand = await prisma.brand.findUnique({ where: { id: session.user.brandId } });
  if (!brand) {
    return NextResponse.json({ error: "Brand profile missing" }, { status: 404 });
  }

  const vertical = parsed.data.vertical ?? brand.vertical;
  const budgetUsd = parsed.data.budgetUsd ?? brand.budgetUsd;
  const limit = parsed.data.limit ?? 30;

  const influencers = await prisma.influencer.findMany({
    where: parsed.data.platform ? { platform: parsed.data.platform } : undefined,
  });

  const ranked = rankInfluencers(influencers, { vertical, budgetUsd }).slice(0, limit);

  // Persist snapshot of top-N recommendations for audit / later learning loop.
  await prisma.recommendation.createMany({
    data: ranked.slice(0, 20).map((r) => ({
      brandId: brand.id,
      influencerId: r.influencer.id,
      fitScore: r.fitScore,
      expectedReach: r.expectedReach,
      budgetMatch: r.budgetMatch,
    })),
  });

  return NextResponse.json({
    query: { vertical, budgetUsd, platform: parsed.data.platform ?? null, limit },
    results: ranked.map((r) => ({
      id: r.influencer.id,
      handle: r.influencer.handle,
      displayName: r.influencer.displayName,
      platform: r.influencer.platform,
      followers: r.influencer.followers,
      engagement: r.influencer.engagement,
      verticals: r.influencer.verticals.split(",").map((s) => s.trim()),
      country: r.influencer.country,
      fitScore: r.fitScore,
      expectedReach: r.expectedReach,
      budgetMatch: r.budgetMatch,
      impliedRateUsd: r.impliedRateUsd,
    })),
  });
}
