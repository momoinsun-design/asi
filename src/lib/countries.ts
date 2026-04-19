import type { Locale } from "@/lib/i18n/dict";

export function countryName(code: string, locale: Locale = "en"): string {
  if (!code || code === "GLOBAL") {
    return locale === "ko" ? "전세계" : "Global";
  }
  try {
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    return dn.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
