import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { LoginSchema } from "@/lib/validators";
import { TikTokProvider } from "@/lib/providers/tiktok";
import { InstagramProvider } from "@/lib/providers/instagram";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      brandId: string | null;
      influencerId: string | null;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    brandId?: string | null;
    influencerId?: string | null;
    role?: Role;
  }
}

export const tiktokEnabled =
  !!process.env.TIKTOK_CLIENT_KEY && !!process.env.TIKTOK_CLIENT_SECRET;
export const instagramEnabled =
  !!process.env.INSTAGRAM_APP_ID && !!process.env.INSTAGRAM_APP_SECRET;

const providers = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw) {
      const parsed = LoginSchema.safeParse(raw);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;
      const user = await prisma.user.findUnique({
        where: { email },
        include: { brand: true, influencer: true },
      });
      // Constant-time-ish: still run bcrypt.compare even on miss so timing
      // does not leak whether the email exists.
      const hash = user?.passwordHash ?? "$2b$12$invalid.salt.placeholderHashForTimingAAAAA";
      const ok = await bcrypt.compare(password, hash);
      if (!user || !ok) return null;

      return {
        id: user.id,
        email: user.email,
        brandId: user.brand?.id ?? null,
        influencerId: user.influencer?.id ?? null,
        role: user.role,
      };
    },
  }),
];

if (tiktokEnabled) {
  providers.push(
    TikTokProvider({
      clientKey: process.env.TIKTOK_CLIENT_KEY!,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
    }) as never,
  );
}
if (instagramEnabled) {
  providers.push(
    InstagramProvider({
      appId: process.env.INSTAGRAM_APP_ID!,
      appSecret: process.env.INSTAGRAM_APP_SECRET!,
    }) as never,
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "tiktok" || account?.provider === "instagram") {
        if (!user.email) return false;
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
          include: { influencer: true },
        });
        if (existing) {
          // Keep Influencer row fresh with any new profile data.
          if (existing.influencer && profile) {
            await prisma.influencer.update({
              where: { id: existing.influencer.id },
              data: sanitizeOAuthProfile(account.provider, profile, existing.influencer),
            });
          }
          return true;
        }
        const payload = oauthSignupPayload(account.provider, profile ?? {});
        // Password is random + unguessable; OAuth users re-auth via provider.
        const passwordHash = await bcrypt.hash(crypto.randomUUID() + crypto.randomUUID(), 12);
        await prisma.user.create({
          data: {
            email: user.email,
            passwordHash,
            influencer: { create: payload },
          },
        });
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // On every first-time sign-in NextAuth passes `user`. After that only
      // `token` is present; we keep it fresh from DB on fresh logins.
      if (user) {
        if (account?.provider === "tiktok" || account?.provider === "instagram") {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email ?? "" },
            include: { brand: true, influencer: true },
          });
          if (dbUser) {
            token.userId = dbUser.id;
            token.brandId = dbUser.brand?.id ?? null;
            token.influencerId = dbUser.influencer?.id ?? null;
            token.role = dbUser.role;
          }
        } else {
          token.userId = user.id as string;
          token.brandId = (user as { brandId?: string | null }).brandId ?? null;
          token.influencerId = (user as { influencerId?: string | null }).influencerId ?? null;
          token.role = (user as { role?: Role }).role ?? "USER";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId;
      session.user.brandId = token.brandId ?? null;
      session.user.influencerId = token.influencerId ?? null;
      session.user.role = token.role ?? "USER";
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

// OWASP ASVS 4.0 V2.4.4 — bcrypt cost ≥ 12 for interactive logins.
const BCRYPT_COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

type OAuthProfileLike = Record<string, unknown>;

function oauthSignupPayload(provider: "tiktok" | "instagram", profile: OAuthProfileLike) {
  if (provider === "tiktok") {
    const p = profile as {
      open_id?: string;
      username?: string;
      display_name?: string;
      follower_count?: number;
    };
    return {
      handle: p.username ?? p.open_id ?? "tiktok-creator",
      platform: "TIKTOK" as const,
      displayName: p.display_name ?? p.username ?? "TikTok creator",
      followers: p.follower_count ?? 0,
      engagement: 0.05,
      verticals: "",
      country: "GLOBAL",
      source: "TIKTOK_TCM" as const,
    };
  }
  const p = profile as {
    id?: string;
    username?: string;
    name?: string;
    followers_count?: number;
  };
  return {
    handle: p.username ?? p.id ?? "ig-creator",
    platform: "INSTAGRAM" as const,
    displayName: p.name ?? p.username ?? "Instagram creator",
    followers: p.followers_count ?? 0,
    engagement: 0.05,
    verticals: "",
    country: "GLOBAL",
    source: "IG_CREATOR_MARKETPLACE" as const,
  };
}

function sanitizeOAuthProfile(
  provider: "tiktok" | "instagram",
  profile: OAuthProfileLike,
  existing: { followers: number; displayName: string },
) {
  const payload = oauthSignupPayload(provider, profile);
  // Don't downgrade follower counts to zero if the provider didn't return one.
  return {
    displayName: payload.displayName || existing.displayName,
    followers: payload.followers > 0 ? payload.followers : existing.followers,
  };
}
