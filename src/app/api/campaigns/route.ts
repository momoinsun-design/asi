import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateCampaignSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.brandId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaigns = await prisma.campaign.findMany({
    where: { brandId: session.user.brandId },
    include: { influencer: true, escrow: true, report: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.brandId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateCampaignSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const influencer = await prisma.influencer.findUnique({
    where: { id: parsed.data.influencerId },
  });
  if (!influencer) {
    return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
  }
  if (influencer.platform !== parsed.data.platform) {
    return NextResponse.json({ error: "Platform mismatch" }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      brandId: session.user.brandId,
      influencerId: influencer.id,
      platform: parsed.data.platform,
      brief: parsed.data.brief,
      offerUsd: parsed.data.offerUsd,
    },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
