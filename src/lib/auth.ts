import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { LoginSchema } from "@/lib/validators";

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
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
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id as string;
        token.brandId = (user as { brandId?: string | null }).brandId ?? null;
        token.influencerId = (user as { influencerId?: string | null }).influencerId ?? null;
        token.role = (user as { role?: Role }).role ?? "USER";
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
