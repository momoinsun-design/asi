import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CampaignTransitionSchema } from "@/lib/validators";
import { assertTransition } from "@/lib/campaign-state";
import type { CampaignState } from "@prisma/client";

const ACTION_TO_STATE: Record<string, CampaignState> = {
  SEND: "SENT",
  NEGOTIATE: "NEGOTIATING",
  ACCEPT: "ACCEPTED",
  FUND: "FUNDED",
  DELIVER: "DELIVERED",
  COMPLETE: "COMPLETED",
  CANCEL: "CANCELLED",
};

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.brandId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const campaign = await prisma.campaign.findFirst({
    where: { id, brandId: session.user.brandId },
    include: {
      influencer: true,
      outreach: { orderBy: { createdAt: "asc" } },
      escrow: true,
      report: true,
    },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ campaign });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const isAdmin = session.user.role === "ADMIN";

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isAdmin) {
    if (!session.user.brandId || campaign.brandId !== session.user.brandId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (campaign.state !== "CANCELLED") {
      return NextResponse.json(
        { error: "Cancel the campaign before deleting." },
        { status: 409 },
      );
    }
  }

  await prisma.campaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.brandId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = CampaignTransitionSchema.safeParse({ ...(payload as object), campaignId: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id, brandId: session.user.brandId },
    include: { influencer: true, escrow: true },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const target = ACTION_TO_STATE[parsed.data.action];
  try {
    assertTransition(campaign.state, target);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Illegal transition";
    return NextResponse.json({ error: msg }, { status: 409 });
  }

  // State transition and its side effects run in a single transaction so that
  // a failure midway cannot leave a Report row without the matching state, or
  // vice-versa (GMV double-counts on retry).
  const updated = await prisma.$transaction(async (tx) => {
    if (target === "COMPLETED") {
      const reach = Math.round(campaign.influencer.followers * (0.25 + campaign.influencer.engagement));
      const engagementCount = Math.round(reach * campaign.influencer.engagement);
      await tx.report.create({
        data: {
          campaignId: campaign.id,
          reach,
          engagementCount,
          gmvUsd: campaign.offerUsd, // AC-5: GMV telemetry on completion
        },
      });
    }
    return tx.campaign.update({
      where: { id: campaign.id },
      data: { state: target },
      include: { influencer: true, escrow: true, report: true },
    });
  });

  return NextResponse.json({ campaign: updated });
}
