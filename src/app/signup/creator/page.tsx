import Link from "next/link";
import { signIn, tiktokEnabled, instagramEnabled } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";
import { CreatorSignupForm } from "./creator-signup-form";

async function signInTikTok() {
  "use server";
  await signIn("tiktok", { redirectTo: "/creator" });
}

async function signInInstagram() {
  "use server";
  await signIn("instagram", { redirectTo: "/creator" });
}

export default async function CreatorSignupPage() {
  const t = await getT();
  const anyOAuth = tiktokEnabled || instagramEnabled;

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Link href="/signup" className="text-sm text-brand-600 hover:underline">
        {t.signupChoose.back}
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">{t.signupCreator.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{t.signupCreator.subtitle}</p>

      {anyOAuth && (
        <div className="mt-8 space-y-3">
          {tiktokEnabled && (
            <form action={signInTikTok}>
              <Button type="submit" variant="secondary" className="w-full">
                {t.signupCreator.linkTikTok}
              </Button>
            </form>
          )}
          {instagramEnabled && (
            <form action={signInInstagram}>
              <Button type="submit" variant="secondary" className="w-full">
                {t.signupCreator.linkInstagram}
              </Button>
            </form>
          )}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="bg-slate-50 px-2 text-slate-400">{t.signupCreator.or}</span>
            </div>
          </div>
        </div>
      )}

      <div className={anyOAuth ? "mt-2" : "mt-8"}>
        <CreatorSignupForm />
      </div>

      <p className="mt-6 text-sm text-slate-600">
        {t.signup.haveAccount}{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          {t.signup.logIn}
        </Link>
      </p>
    </main>
  );
}
