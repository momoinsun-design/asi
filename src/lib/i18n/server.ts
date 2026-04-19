import { cookies } from "next/headers";
import { DEFAULT_LOCALE, getDict, type Dict, type Locale } from "./dict";

export const LOCALE_COOKIE = "locale";

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  return c === "ko" || c === "en" ? c : DEFAULT_LOCALE;
}

export async function getT(): Promise<Dict> {
  return getDict(await getLocale());
}
