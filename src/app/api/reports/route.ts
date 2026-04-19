import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/reports  —  north-star (GMV) aggregate for the logged-in brand.
// Returns trailing-30-day campaign count + GMV, plus per-platform split.
export async function GET() {
  const session = await auth();
  if (!session?.user?.brandId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const reports = await prisma.report.findMany({
    where: {
      createdAt: { gte: since },
      campaign: { brandId: session.user.brandId },
    },
    include: { campaign: true },
  });

  const gmvUsd = reports.reduce((sum, r) => sum + r.gmvUsd, 0);
  const completedCampaigns = reports.length;

  const byPlatform: Record<string, { count: number; gmvUsd: number }> = {};
  for (const r of reports) {
    const p = r.campaign.platform;
    byPlatform[p] ??= { count: 0, gmvUsd: 0 };
    byPlatform[p].count += 1;
    byPlatform[p].gmvUsd += r.gmvUsd;
  }

  return NextResponse.json({
    windowDays: 30,
    completedCampaigns,
    gmvUsd,
    byPlatform,
  });
}
