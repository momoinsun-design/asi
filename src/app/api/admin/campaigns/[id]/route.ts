import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { AdminCampaignUpdateSchema } from "@/lib/validators";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.res;
  const { id } = await ctx.params;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = AdminCampaignUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const campaign = await prisma.campaign.findUnique({ where: { id }, include: { report: true } });
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Admin override: allow arbitrary state transitions, but keep Report row
  // consistent on COMPLETED (create if missing; GMV stays authoritative).
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.campaign.update({
      where: { id },
      data: parsed.data,
      include: { influencer: true, report: true },
    });
    if (parsed.data.state === "COMPLETED" && !next.report) {
      const reach = Math.round(next.influencer.followers * (0.25 + next.influencer.engagement));
      const engagementCount = Math.round(reach * next.influencer.engagement);
      await tx.report.create({
        data: {
          campaignId: next.id,
          reach,
          engagementCount,
          gmvUsd: next.offerUsd,
        },
      });
    }
    return next;
  });

  return NextResponse.json({ campaign: updated });
}
