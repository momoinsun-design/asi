import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { AdminInfluencerUpdateSchema } from "@/lib/validators";

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

  const parsed = AdminInfluencerUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.influencer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const updated = await prisma.influencer.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ influencer: updated });
  } catch {
    return NextResponse.json({ error: "Update failed (duplicate handle?)" }, { status: 409 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.res;
  const { id } = await ctx.params;

  const inUse = await prisma.campaign.count({ where: { influencerId: id } });
  if (inUse > 0) {
    return NextResponse.json(
      { error: "Cannot delete — influencer has campaigns. Cancel campaigns first." },
      { status: 409 },
    );
  }

  try {
    await prisma.recommendation.deleteMany({ where: { influencerId: id } });
    await prisma.influencer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
