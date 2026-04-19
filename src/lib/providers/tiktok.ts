import type { OAuthConfig } from "next-auth/providers";

// TikTok Login Kit v2 — https://developers.tiktok.com/doc/login-kit-web
// Uses `client_key` (not client_id) and its own /v2/oauth/token/ endpoint.
interface TikTokProfile {
  open_id: string;
  union_id?: string;
  avatar_url?: string;
  display_name?: string;
  username?: string;
  follower_count?: number;
  likes_count?: number;
  video_count?: number;
}

export function TikTokProvider(opts: {
  clientKey: string;
  clientSecret: string;
}): OAuthConfig<TikTokProfile> {
  const fields =
    "open_id,union_id,avatar_url,display_name,username,follower_count,likes_count,video_count";
  return {
    id: "tiktok",
    name: "TikTok",
    type: "oauth",
    clientId: opts.clientKey,
    clientSecret: opts.clientSecret,
    authorization: {
      url: "https://www.tiktok.com/v2/auth/authorize/",
      params: {
        client_key: opts.clientKey,
        scope: "user.info.basic,user.info.profile,user.info.stats",
        response_type: "code",
      },
    },
    token: {
      url: "https://open.tiktokapis.com/v2/oauth/token/",
      async request(ctx: { params: Record<string, string>; provider: { callbackUrl?: string } }) {
        const body = new URLSearchParams({
          client_key: opts.clientKey,
          client_secret: opts.clientSecret,
          code: ctx.params.code ?? "",
          grant_type: "authorization_code",
          redirect_uri: ctx.provider.callbackUrl ?? "",
        });
        const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        const tokens = (await res.json()) as Record<string, unknown>;
        return { tokens };
      },
    },
    userinfo: {
      url: `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`,
      async request(ctx: { tokens: { access_token?: string } }) {
        const res = await fetch(
          `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`,
          { headers: { Authorization: `Bearer ${ctx.tokens.access_token ?? ""}` } },
        );
        const json = (await res.json()) as { data?: { user?: TikTokProfile } };
        return (json.data?.user ?? {}) as TikTokProfile;
      },
    },
    profile(p) {
      return {
        id: p.open_id,
        name: p.display_name ?? p.username ?? p.open_id,
        email: `tiktok-${p.open_id}@oauth.asi.local`,
        image: p.avatar_url ?? null,
      };
    },
  };
}
