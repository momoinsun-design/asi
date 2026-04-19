import type { InfluencerRecord, SearchQuery } from "./mock-corpus";

// TikTok Creator Marketplace API (TCM).
//
// Requires:
//   - TikTok for Business account
//   - TikTok Creator Marketplace partnership approval
//   - Advertiser ID provisioned under an approved business
//
// Docs: https://business-api.tiktok.com/portal/docs?id=1739584572082689
//
// Populates the Influencer table via a periodic sync job (out of scope here);
// `searchTikTokTcm` is the live-lookup path used by that job.
export async function searchTikTokTcm(_query: SearchQuery): Promise<InfluencerRecord[]> {
  const token = process.env.TIKTOK_BUSINESS_ACCESS_TOKEN;
  const advertiserId = process.env.TIKTOK_ADVERTISER_ID;
  if (!token || !advertiserId) {
    throw new Error(
      "TikTok credentials missing: set TIKTOK_BUSINESS_ACCESS_TOKEN and TIKTOK_ADVERTISER_ID. " +
      "TikTok Creator Marketplace access requires partnership approval — see README.",
    );
  }

  // TODO: implement against the live endpoint once partnership is approved.
  // Expected shape (subject to TikTok API changes):
  //   GET https://business-api.tiktok.com/open_api/v1.3/creator/search/
  //       ?advertiser_id={advertiserId}&industry={query.vertical}
  //   Headers: Access-Token: {token}
  // Response → map each creator into an `InfluencerRecord` with
  //   platform: "TIKTOK" and source: "TIKTOK_TCM".
  throw new Error("Not implemented — awaiting TikTok Creator Marketplace approval.");
}
