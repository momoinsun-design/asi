import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { AppHeader } from "@/components/app-header";
import { LocaleProvider } from "@/lib/i18n/provider";
import { getLocale } from "@/lib/i18n/server";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "ASI — Global Influencer Marketplace",
  description:
    "Discover IG, TikTok, and YouTube Shorts creators with AI matching. Negotiate and fund campaigns with escrow payments.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className="min-h-screen bg-slate-50">
        <Providers>
          <LocaleProvider locale={locale}>
            <AppHeader />
            {children}
          </LocaleProvider>
        </Providers>
      </body>
    </html>
  );
}
