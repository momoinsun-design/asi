import type { Platform } from "@prisma/client";

export function profileUrl(platform: Platform, handle: string): string {
  const h = handle.replace(/^@/, "");
  switch (platform) {
    case "INSTAGRAM":
      return `https://www.instagram.com/${encodeURIComponent(h)}/`;
    case "TIKTOK":
      return `https://www.tiktok.com/@${encodeURIComponent(h)}`;
    case "YOUTUBE_SHORTS":
      return `https://www.youtube.com/@${encodeURIComponent(h)}`;
  }
}

export function platformLabel(platform: Platform): string {
  switch (platform) {
    case "INSTAGRAM":
      return "Instagram";
    case "TIKTOK":
      return "TikTok";
    case "YOUTUBE_SHORTS":
      return "YouTube Shorts";
  }
}
