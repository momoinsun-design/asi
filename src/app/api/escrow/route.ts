import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EscrowReleaseSchema, EscrowOpSchema } from "@/lib/validators";
import { createEscrowHold, releaseEscrow, refundEscrow, currentMode } from "@/lib/adapters/stripe";

// POST /api/escrow  — fund escrow for an ACCEPTED campaign.
//                     Request body: { campaignId }
//                     Transitions: ACCEPTED → FUNDED.
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
  const parsed = EscrowReleaseSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id: parsed.data.campaignId, brandId: session.user.brandId },
    include: { escrow: true },
  });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (campaign.state !== "ACCEPTED") {
    return NextResponse.json({ error: "Campaign must be ACCEPTED to fund" }, { status: 409 });
  }
  if (campaign.escrow) {
    return NextResponse.json({ error: "Already funded" }, { status: 409 });
  }

  // Price is read from the server-side campaign record; client body cannot
  // tamper with the amount (only supplies campaignId).
  const intent = await createEscrowHold({
    campaignId: campaign.id,
    amountUsd: campaign.offerUsd,
  });

  // DB writes happen in one transaction. Stripe hold stays orphaned only if
  // the DB transaction fails after the network call — the real production
  // path must add a reconciliation sweep (Stripe → DB) on top.
  const escrow = await prisma.$transaction(async (tx) => {
    const row = await tx.escrow.create({
      data: {
        campaignId: campaign.id,
        amountUsd: intent.amountUsd,
        currency: "USD",
        state: "HELD",
        stripeRef: intent.stripeId,
      },
    });
    await tx.campaign.update({
      where: { id: campaign.id },
      data: { state: "FUNDED" },
    });
    return row;
  });

  return NextResponse.json({
    escrow,
    mode: currentMode(),
    clientSecret: intent.clientSecret,
  });
}

// PATCH /api/escrow — release or refund. Body: { campaignId, op: "release" | "refund" }
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.brandId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsedOp = EscrowOpSchema.safeParse(body);
  if (!parsedOp.success) {
    return NextResponse.json({ error: parsedOp.error.flatten() }, { status: 422 });
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id: parsedOp.data.campaignId, brandId: session.user.brandId },
    include: { escrow: true },
  });
  if (!campaign || !campaign.escrow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (campaign.escrow.state !== "HELD") {
    return NextResponse.json({ error: "Escrow not in HELD state" }, { status: 409 });
  }

  if (parsedOp.data.op === "release") {
    await releaseEscrow(campaign.escrow.stripeRef);
    await prisma.escrow.update({
      where: { id: campaign.escrow.id },
      data: { state: "RELEASED" },
    });
  } else {
    await refundEscrow(campaign.escrow.stripeRef);
    await prisma.escrow.update({
      where: { id: campaign.escrow.id },
      data: { state: "REFUNDED" },
    });
  }

  return NextResponse.json({ ok: true });
}
