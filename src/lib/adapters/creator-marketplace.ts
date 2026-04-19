import type { InfluencerRecord, SearchQuery } from "./mock-corpus";
import { searchMockInfluencers } from "./mock-corpus";
import { searchIgMarketplace } from "./ig-marketplace";
import { searchTikTokTcm } from "./tiktok-tcm";
import { searchYouTubeCreators } from "./youtube-oauth";

export type { InfluencerRecord, SearchQuery } from "./mock-corpus";

type Mode = "MOCK" | "REAL";

function mode(): Mode {
  return process.env.CREATOR_MARKETPLACE_MODE === "REAL" ? "REAL" : "MOCK";
}

/**
 * Unified facade for all three platform data sources.
 *
 *   MOCK (default): returns the seeded corpus — no network, no credentials.
 *   REAL: dispatches per-platform:
 *     INSTAGRAM      → Meta Creator Marketplace API
 *     TIKTOK         → TikTok Creator Marketplace API (TCM)
 *     YOUTUBE_SHORTS → YouTube Data API v3 (creators that linked via OAuth)
 *
 * Called from sync jobs (populate `Influencer` table) and — in tests — from
 * `api/discover` ad-hoc. Production discover should always hit the local
 * Influencer table for latency; the vendor APIs are for background sync.
 */
export async function searchInfluencers(query: SearchQuery = {}): Promise<InfluencerRecord[]> {
  if (mode() === "MOCK") return searchMockInfluencers(query);

  if (query.platform) {
    switch (query.platform) {
      case "INSTAGRAM": return searchIgMarketplace(query);
      case "TIKTOK": return searchTikTokTcm(query);
      case "YOUTUBE_SHORTS": return searchYouTubeCreators(query);
    }
  }

  // No platform filter — federate all three. Per-platform failures bubble up
  // so the sync job can retry one source without falsely claiming coverage.
  const [ig, tt, yt] = await Promise.all([
    searchIgMarketplace(query),
    searchTikTokTcm(query),
    searchYouTubeCreators(query),
  ]);
  return [...ig, ...tt, ...yt];
}

export function currentMode(): Mode {
  return mode();
}
