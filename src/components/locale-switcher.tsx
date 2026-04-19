"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

export function LocaleSwitcher() {
  const { locale } = useLocale();
  const router = useRouter();

  function switchTo(next: "en" | "ko") {
    // Year-long cookie, same-site — reflects immediately on refresh().
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 text-xs text-slate-600">
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={cn(
          "rounded px-1.5 py-0.5 transition",
          locale === "en" ? "bg-slate-900 text-white" : "hover:bg-slate-100",
        )}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchTo("ko")}
        className={cn(
          "rounded px-1.5 py-0.5 transition",
          locale === "ko" ? "bg-slate-900 text-white" : "hover:bg-slate-100",
        )}
        aria-pressed={locale === "ko"}
      >
        한국어
      </button>
    </div>
  );
}
