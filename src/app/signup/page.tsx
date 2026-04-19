import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function SignupChooserPage() {
  const t = await getT();
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900">{t.signupChoose.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{t.signupChoose.subtitle}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <RoleCard
          href="/signup/brand"
          title={t.signupChoose.brandTitle}
          body={t.signupChoose.brandBody}
          cta={t.signupChoose.brandCta}
        />
        <RoleCard
          href="/signup/creator"
          title={t.signupChoose.creatorTitle}
          body={t.signupChoose.creatorBody}
          cta={t.signupChoose.creatorCta}
        />
      </div>

      <p className="mt-8 text-sm text-slate-600">
        {t.signup.haveAccount}{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          {t.signup.logIn}
        </Link>
      </p>
    </main>
  );
}

function RoleCard({
  href,
  title,
  body,
  cta,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-brand-400 hover:shadow-md"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{body}</p>
      </div>
      <span className="mt-6 inline-block text-sm font-medium text-brand-600">{cta} →</span>
    </Link>
  );
}
