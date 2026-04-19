"use client";

import { createContext, useContext, type ReactNode } from "react";
import { dict, DEFAULT_LOCALE, type Dict, type Locale } from "./dict";

interface LocaleContext {
  locale: Locale;
  t: Dict;
}

const Ctx = createContext<LocaleContext>({
  locale: DEFAULT_LOCALE,
  t: dict[DEFAULT_LOCALE] as Dict,
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value: LocaleContext = {
    locale,
    t: (dict[locale] ?? dict[DEFAULT_LOCALE]) as Dict,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleContext {
  return useContext(Ctx);
}
