import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OutreachSchema } from "@/lib/validators";

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
  const parsed = OutreachSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id: parsed.data.campaignId, brandId: session.user.brandId },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Any state change here must travel through the FSM. A brand message from
  // DRAFT implicitly sends the brief first; a second message from SENT moves
  // to NEGOTIATING. No other auto-transitions.
  const simulate = process.env.SIMULATE_INFLUENCER_REPLY === "1";
  const nextState =
    campaign.state === "DRAFT" ? ("SENT" as const)
    : campaign.state === "SENT" ? ("NEGOTIATING" as const)
    : null;

  const result = await prisma.$transaction(async (tx) => {
    const message = await tx.outreachMessage.create({
      data: {
        campaignId: campaign.id,
        sender: "BRAND",
        body: parsed.data.body,
        counterUsd: parsed.data.counterUsd ?? null,
      },
    });

    let simulated = null;
    if (simulate) {
      simulated = await tx.outreachMessage.create({
        data: {
          campaignId: campaign.id,
          sender: "INFLUENCER",
          body: parsed.data.counterUsd
            ? `Thanks! ${parsed.data.counterUsd} USD works for me — let's proceed.`
            : "Got it, I'm interested. Let me know the timeline.",
        },
      });
    }

    if (nextState) {
      await tx.campaign.update({
        where: { id: campaign.id },
        data: { state: nextState },
      });
    }

    return { message, simulated };
  });

  return NextResponse.json(result);
}
