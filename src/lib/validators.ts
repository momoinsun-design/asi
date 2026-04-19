import { z } from "zod";

export const PlatformSchema = z.enum(["INSTAGRAM", "TIKTOK", "YOUTUBE_SHORTS"]);

export const BrandSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  company: z.string().min(1).max(120),
  vertical: z.string().min(1).max(60),
  budgetUsd: z.coerce.number().int().min(100).max(10_000_000),
  goals: z.string().min(1).max(2000),
});

// Backwards-compatible alias used by legacy /api/signup route.
export const SignupSchema = BrandSignupSchema;

export const CreatorSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  handle: z.string().min(1).max(80),
  platform: PlatformSchema,
  displayName: z.string().min(1).max(120),
  country: z.string().min(2).max(32),
  verticals: z.string().min(1).max(240),
  followers: z.coerce.number().int().min(0).max(1_000_000_000),
  engagement: z.coerce.number().min(0).max(1),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export const DiscoverQuerySchema = z.object({
  vertical: z.string().min(1).max(60).optional(),
  platform: PlatformSchema.optional(),
  country: z.string().min(2).max(32).optional(),
  budgetUsd: z.coerce.number().int().min(1).max(10_000_000).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const AdminInfluencerCreateSchema = z.object({
  handle: z.string().min(1).max(80),
  platform: PlatformSchema,
  displayName: z.string().min(1).max(120),
  followers: z.coerce.number().int().min(0).max(1_000_000_000),
  engagement: z.coerce.number().min(0).max(1),
  verticals: z.string().min(1).max(240),
  country: z.string().min(2).max(32),
});

export const AdminInfluencerUpdateSchema = AdminInfluencerCreateSchema.partial();

export const AdminBrandUpdateSchema = z.object({
  company: z.string().min(1).max(120).optional(),
  vertical: z.string().min(1).max(60).optional(),
  budgetUsd: z.coerce.number().int().min(100).max(10_000_000).optional(),
  goals: z.string().min(1).max(2000).optional(),
});

export const AdminCampaignUpdateSchema = z.object({
  brief: z.string().min(1).max(4000).optional(),
  offerUsd: z.coerce.number().int().min(1).max(10_000_000).optional(),
  state: z
    .enum(["DRAFT", "SENT", "NEGOTIATING", "ACCEPTED", "FUNDED", "DELIVERED", "COMPLETED", "CANCELLED"])
    .optional(),
});

export const CreateCampaignSchema = z.object({
  influencerId: z.string().min(1),
  platform: PlatformSchema,
  brief: z.string().min(1).max(4000),
  offerUsd: z.coerce.number().int().min(1).max(10_000_000),
});

export const OutreachSchema = z.object({
  campaignId: z.string().min(1),
  body: z.string().min(1).max(4000),
  counterUsd: z.coerce.number().int().min(1).max(10_000_000).optional(),
});

export const CampaignTransitionSchema = z.object({
  campaignId: z.string().min(1),
  action: z.enum([
    "SEND", "NEGOTIATE", "ACCEPT", "FUND", "DELIVER", "COMPLETE", "CANCEL",
  ]),
});

export const EscrowReleaseSchema = z.object({
  campaignId: z.string().min(1),
});

export const EscrowOpSchema = z.object({
  campaignId: z.string().min(1),
  op: z.enum(["release", "refund"]),
});
