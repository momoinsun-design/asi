import type { OAuthConfig } from "next-auth/providers";

// Instagram API with Instagram Login (2024+) — separate from Facebook Login.
// https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
// Authorize at instagram.com, exchange token at api.instagram.com, read profile at graph.instagram.com.
interface InstagramProfile {
  id: string;
  username?: string;
  name?: string;
  account_type?: string;
  media_count?: number;
  followers_count?: number;
  profile_picture_url?: string;
}

export function InstagramProvider(opts: {
  appId: string;
  appSecret: string;
}): OAuthConfig<InstagramProfile> {
  const fields = "id,username,name,account_type,media_count,followers_count,profile_picture_url";
  return {
    id: "instagram",
    name: "Instagram",
    type: "oauth",
    clientId: opts.appId,
    clientSecret: opts.appSecret,
    authorization: {
      url: "https://www.instagram.com/oauth/authorize",
      params: {
        client_id: opts.appId,
        scope: "instagram_business_basic",
        response_type: "code",
      },
    },
    token: {
      url: "https://api.instagram.com/oauth/access_token",
      async request(ctx: { params: Record<string, string>; provider: { callbackUrl?: string } }) {
        const body = new URLSearchParams({
          client_id: opts.appId,
          client_secret: opts.appSecret,
          code: ctx.params.code ?? "",
          grant_type: "authorization_code",
          redirect_uri: ctx.provider.callbackUrl ?? "",
        });
        const res = await fetch("https://api.instagram.com/oauth/access_token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        const tokens = (await res.json()) as Record<string, unknown>;
        return { tokens };
      },
    },
    userinfo: {
      url: `https://graph.instagram.com/v21.0/me?fields=${fields}`,
      async request(ctx: { tokens: { access_token?: string } }) {
        const res = await fetch(
          `https://graph.instagram.com/v21.0/me?fields=${fields}&access_token=${ctx.tokens.access_token ?? ""}`,
        );
        return (await res.json()) as InstagramProfile;
      },
    },
    profile(p) {
      return {
        id: p.id,
        name: p.name ?? p.username ?? p.id,
        email: `instagram-${p.id}@oauth.asi.local`,
        image: p.profile_picture_url ?? null,
      };
    },
  };
}
