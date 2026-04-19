import type { Platform } from "@prisma/client";

// Vendor-agnostic shape. Every adapter (real or mock) projects responses into this.
export interface InfluencerRecord {
  handle: string;
  platform: Platform;
  displayName: string;
  followers: number;
  engagement: number;
  verticals: string[];
  country: string;
}

export interface SearchQuery {
  vertical?: string;
  platform?: Platform;
  minFollowers?: number;
  maxFollowers?: number;
  limit?: number;
}

// Deterministic seed corpus — ≥30 records across IG / TikTok / YouTube Shorts,
// covering a spread of follower tiers (nano → macro) and verticals.
// Used by MOCK mode for demo and by the seed script for the dev DB.
const CORPUS: InfluencerRecord[] = [
  { handle: "nova.fit",        platform: "INSTAGRAM",      displayName: "Nova Fit",        followers: 12_400,   engagement: 0.084, verticals: ["fitness", "wellness"],        country: "US" },
  { handle: "cafe.lumen",      platform: "INSTAGRAM",      displayName: "Cafe Lumen",      followers: 48_900,   engagement: 0.061, verticals: ["food", "coffee"],             country: "KR" },
  { handle: "jae.reads",       platform: "INSTAGRAM",      displayName: "Jae Reads",       followers: 7_200,    engagement: 0.112, verticals: ["books", "lifestyle"],         country: "CA" },
  { handle: "pine.tech",       platform: "INSTAGRAM",      displayName: "Pine Tech",       followers: 210_000,  engagement: 0.032, verticals: ["tech", "gadgets"],            country: "US" },
  { handle: "sage.skin",       platform: "INSTAGRAM",      displayName: "Sage Skin",       followers: 94_000,   engagement: 0.045, verticals: ["beauty", "skincare"],         country: "GB" },
  { handle: "roam.iris",       platform: "INSTAGRAM",      displayName: "Iris Roams",      followers: 31_500,   engagement: 0.073, verticals: ["travel", "lifestyle"],        country: "JP" },
  { handle: "kit.craft",       platform: "INSTAGRAM",      displayName: "Kit Craft",       followers: 58_200,   engagement: 0.056, verticals: ["diy", "home"],                country: "DE" },
  { handle: "loop.dev",        platform: "INSTAGRAM",      displayName: "Loop Dev",        followers: 19_800,   engagement: 0.089, verticals: ["tech", "programming"],        country: "US" },
  { handle: "minty.meal",      platform: "INSTAGRAM",      displayName: "Minty Meal",      followers: 142_000,  engagement: 0.039, verticals: ["food", "vegan"],              country: "AU" },
  { handle: "hush.home",       platform: "INSTAGRAM",      displayName: "Hush Home",       followers: 76_100,   engagement: 0.051, verticals: ["home", "interior"],           country: "SE" },
  { handle: "kaia.moves",      platform: "TIKTOK",         displayName: "Kaia Moves",      followers: 320_000,  engagement: 0.118, verticals: ["fitness", "dance"],           country: "US" },
  { handle: "chef.rin",        platform: "TIKTOK",         displayName: "Chef Rin",        followers: 540_000,  engagement: 0.091, verticals: ["food", "cooking"],            country: "KR" },
  { handle: "mayu.beauty",     platform: "TIKTOK",         displayName: "Mayu Beauty",     followers: 88_000,   engagement: 0.134, verticals: ["beauty", "makeup"],           country: "JP" },
  { handle: "lex.builds",      platform: "TIKTOK",         displayName: "Lex Builds",      followers: 46_200,   engagement: 0.152, verticals: ["tech", "diy"],                country: "US" },
  { handle: "orbit.games",     platform: "TIKTOK",         displayName: "Orbit Games",     followers: 1_100_000,engagement: 0.067, verticals: ["gaming", "tech"],             country: "GB" },
  { handle: "small.steps",     platform: "TIKTOK",         displayName: "Small Steps",     followers: 28_500,   engagement: 0.176, verticals: ["wellness", "mental health"],  country: "CA" },
  { handle: "paws.dly",        platform: "TIKTOK",         displayName: "Paws Daily",      followers: 210_400,  engagement: 0.129, verticals: ["pets", "lifestyle"],          country: "AU" },
  { handle: "plate.pals",      platform: "TIKTOK",         displayName: "Plate Pals",      followers: 96_000,   engagement: 0.103, verticals: ["food", "family"],             country: "DE" },
  { handle: "tiny.trips",      platform: "TIKTOK",         displayName: "Tiny Trips",      followers: 154_000,  engagement: 0.087, verticals: ["travel", "budget"],           country: "FR" },
  { handle: "glow.journal",    platform: "TIKTOK",         displayName: "Glow Journal",    followers: 62_300,   engagement: 0.141, verticals: ["beauty", "skincare"],         country: "US" },
  { handle: "shortbite.dev",   platform: "YOUTUBE_SHORTS", displayName: "Shortbite Dev",   followers: 410_000,  engagement: 0.058, verticals: ["tech", "programming"],        country: "US" },
  { handle: "fitquick",        platform: "YOUTUBE_SHORTS", displayName: "FitQuick",        followers: 790_000,  engagement: 0.041, verticals: ["fitness", "wellness"],        country: "GB" },
  { handle: "kfood.shorts",    platform: "YOUTUBE_SHORTS", displayName: "K-Food Shorts",   followers: 1_240_000,engagement: 0.036, verticals: ["food", "korean"],             country: "KR" },
  { handle: "skate.minute",    platform: "YOUTUBE_SHORTS", displayName: "Skate Minute",    followers: 98_000,   engagement: 0.072, verticals: ["sports", "lifestyle"],        country: "CA" },
  { handle: "wanderwrap",      platform: "YOUTUBE_SHORTS", displayName: "WanderWrap",      followers: 352_000,  engagement: 0.049, verticals: ["travel", "adventure"],        country: "AU" },
  { handle: "petite.pixels",   platform: "YOUTUBE_SHORTS", displayName: "Petite Pixels",   followers: 67_500,   engagement: 0.086, verticals: ["art", "design"],              country: "FR" },
  { handle: "beauty.byte",     platform: "YOUTUBE_SHORTS", displayName: "Beauty Byte",     followers: 189_000,  engagement: 0.061, verticals: ["beauty", "reviews"],          country: "JP" },
  { handle: "home.nook",       platform: "YOUTUBE_SHORTS", displayName: "Home Nook",       followers: 42_000,   engagement: 0.094, verticals: ["home", "interior"],           country: "DE" },
  { handle: "mini.makers",     platform: "YOUTUBE_SHORTS", displayName: "Mini Makers",     followers: 128_000,  engagement: 0.078, verticals: ["diy", "kids"],                country: "US" },
  { handle: "morning.brief",   platform: "YOUTUBE_SHORTS", displayName: "Morning Brief",   followers: 85_500,   engagement: 0.055, verticals: ["news", "business"],           country: "GB" },
];

export async function searchMockInfluencers(query: SearchQuery = {}): Promise<InfluencerRecord[]> {
  const vertical = query.vertical?.toLowerCase().trim();
  const min = query.minFollowers ?? 0;
  const max = query.maxFollowers ?? Number.MAX_SAFE_INTEGER;

  let out = CORPUS.filter((rec) => {
    if (query.platform && rec.platform !== query.platform) return false;
    if (rec.followers < min || rec.followers > max) return false;
    if (vertical && !rec.verticals.some((v) => v.toLowerCase().includes(vertical))) return false;
    return true;
  });

  if (query.limit) out = out.slice(0, query.limit);
  return out;
}

export function allInfluencers(): InfluencerRecord[] {
  return [...CORPUS];
}
