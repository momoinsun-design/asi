import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { CreatorSignupSchema } from "@/lib/validators";

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreatorSignupSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const { email, password, handle, platform, displayName, country, verticals, followers, engagement } =
    parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        influencer: {
          create: {
            handle,
            platform,
            displayName,
            country,
            verticals,
            followers,
            engagement,
            source: "DIRECT_SIGNUP",
          },
        },
      },
      include: { influencer: true },
    });
    return NextResponse.json({ id: user.id, influencerId: user.influencer?.id ?? null });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "This handle already exists on that platform." },
        { status: 409 },
      );
    }
    throw e;
  }
}
