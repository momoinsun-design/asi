import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OutreachSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
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

  const campaign = await prisma.campaign.findUnique({
    where: { id: parsed.data.campaignId },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isBrand = !!session.user.brandId && session.user.brandId === campaign.brandId;
  const isInfluencer =
    !!session.user.influencerId && session.user.influencerId === campaign.influencerId;
  if (!isBrand && !isInfluencer && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sender = isBrand ? "BRAND" : isInfluencer ? "INFLUENCER" : "SYSTEM";

  // FSM auto-transitions only apply when the brand sends. A brand message from
  // DRAFT implicitly sends the brief first; a second message from SENT moves
  // to NEGOTIATING. Influencer replies never mutate state on their own — the
  // brand still owns ACCEPT/FUND/etc. through the campaign action API.
  const simulate = process.env.SIMULATE_INFLUENCER_REPLY === "1" && isBrand;
  const nextState =
    isBrand && campaign.state === "DRAFT"
      ? ("SENT" as const)
      : isBrand && campaign.state === "SENT"
        ? ("NEGOTIATING" as const)
        : null;

  const result = await prisma.$transaction(async (tx) => {
    const message = await tx.outreachMessage.create({
      data: {
        campaignId: campaign.id,
        sender,
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
