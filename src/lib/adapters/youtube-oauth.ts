import type { InfluencerRecord, SearchQuery } from "./mock-corpus";

// YouTube Data API v3 — direct-signup (creator OAuth) pattern.
//
// YouTube has NO Creator Marketplace API equivalent, so this platform relies on
// a different supply model: creators register on our site and connect their
// channel via OAuth. Once connected, channel metadata is refreshed via the
// official YouTube Data API v3.
//
// This file exposes two entry points:
//   - `fetchChannelFromOAuth`    — pull snapshot for a freshly-linked channel
//   - `searchYouTubeCreators`    — read-only query over the Influencer table,
//                                  restricted to channels that opted in
//
// Requires:
//   - YouTube Data API v3 enabled in a Google Cloud project
//   - OAuth 2.0 client (client id + secret) for the "Sign in with Google" step
//
// Docs: https://developers.google.com/youtube/v3

import { prisma } from "@/lib/db";

export async function fetchChannelFromOAuth(_oauthAccessToken: string): Promise<InfluencerRecord> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
  if (!apiKey || !clientId || !clientSecret) {
    throw new Error(
      "YouTube credentials missing: set YOUTUBE_API_KEY, YOUTUBE_OAUTH_CLIENT_ID, " +
      "YOUTUBE_OAUTH_CLIENT_SECRET. Creators must link their channel via OAuth.",
    );
  }

  // TODO: implement once the creator-OAuth flow is built.
  //   GET https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true
  //   Headers: Authorization: Bearer {oauthAccessToken}
  // Response → project snippet + statistics into InfluencerRecord, store
  //   with source: "YOUTUBE_DATA_API".
  throw new Error("Not implemented — awaiting creator-OAuth onboarding flow.");
}

// Live search for the facade. Reads only YouTube creators that have registered
// on our platform (source = DIRECT_SIGNUP or YOUTUBE_DATA_API). There is no
// broad-catalog vendor API for YouTube; supply grows from signups.
export async function searchYouTubeCreators(query: SearchQuery): Promise<InfluencerRecord[]> {
  const rows = await prisma.influencer.findMany({
    where: {
      platform: "YOUTUBE_SHORTS",
      source: { in: ["DIRECT_SIGNUP", "YOUTUBE_DATA_API"] },
      ...(query.minFollowers ? { followers: { gte: query.minFollowers } } : {}),
      ...(query.maxFollowers ? { followers: { lte: query.maxFollowers } } : {}),
    },
    take: query.limit ?? 50,
  });

  return rows.map((i) => ({
    handle: i.handle,
    platform: i.platform,
    displayName: i.displayName,
    followers: i.followers,
    engagement: i.engagement,
    verticals: i.verticals.split(",").map((s) => s.trim()).filter(Boolean),
    country: i.country,
  }));
}
