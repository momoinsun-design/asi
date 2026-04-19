import type { InfluencerRecord, SearchQuery } from "./mock-corpus";

// Meta Creator Marketplace API — Instagram.
//
// Requires:
//   - Meta Business account
//   - Meta Creator Marketplace partnership approval
//   - App Review for the `instagram_business_manage` / marketplace permissions
//
// Docs: https://developers.facebook.com/docs/instagram-platform/creators-marketplace
//
// Populates the Influencer table via a periodic sync job (out of scope here);
// `searchIgMarketplace` is the live-lookup path used by that job.
export async function searchIgMarketplace(_query: SearchQuery): Promise<InfluencerRecord[]> {
  const token = process.env.META_ACCESS_TOKEN;
  const businessId = process.env.META_BUSINESS_ID;
  if (!token || !businessId) {
    throw new Error(
      "Meta credentials missing: set META_ACCESS_TOKEN and META_BUSINESS_ID. " +
      "Meta Creator Marketplace access requires partnership approval — see README.",
    );
  }

  // TODO: implement against the live endpoint once partnership is approved.
  // Expected shape (subject to Meta API changes):
  //   GET https://graph.facebook.com/v21.0/{business-id}/creators/search
  //       ?vertical={query.vertical}&min_followers={query.minFollowers}
  //   Headers: Authorization: Bearer {token}
  // Response → map each creator into an `InfluencerRecord` with
  //   platform: "INSTAGRAM" and source: "IG_CREATOR_MARKETPLACE".
  throw new Error("Not implemented — awaiting Meta Creator Marketplace partnership approval.");
}
