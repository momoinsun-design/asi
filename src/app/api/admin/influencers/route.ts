import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { AdminInfluencerCreateSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.res;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = AdminInfluencerCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const created = await prisma.influencer.create({
      data: { ...parsed.data, source: "DIRECT_SIGNUP" },
    });
    return NextResponse.json({ influencer: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Handle already exists for platform" }, { status: 409 });
  }
}
