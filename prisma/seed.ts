import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { allInfluencers } from "../src/lib/adapters/mock-corpus";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding…");

  // Demo brand account — credentials: demo@asi.local / demo1234
  const email = "demo@asi.local";
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      email,
      passwordHash,
      role: "ADMIN",
      brand: {
        create: {
          company: "Northwind Skincare",
          vertical: "beauty",
          budgetUsd: 5000,
          goals: "Launch a new vitamin C serum — seeking micro-influencers for unboxing & review content across IG, TikTok, and YouTube Shorts.",
        },
      },
    },
    include: { brand: true },
  });
  console.log(`Brand user ready: ${user.email}`);

  // Influencer corpus
  for (const rec of allInfluencers()) {
    await prisma.influencer.upsert({
      where: {
        handle_platform: {
          handle: rec.handle,
          platform: rec.platform,
        },
      },
      update: {
        displayName: rec.displayName,
        followers: rec.followers,
        engagement: rec.engagement,
        verticals: rec.verticals.join(","),
        country: rec.country,
      },
      create: {
        handle: rec.handle,
        platform: rec.platform,
        displayName: rec.displayName,
        followers: rec.followers,
        engagement: rec.engagement,
        verticals: rec.verticals.join(","),
        country: rec.country,
        source: "MOCK",
      },
    });
  }
  console.log(`Influencers: ${allInfluencers().length} upserted`);

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
