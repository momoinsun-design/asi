import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function LandingPage() {
  const t = await getT();
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-12">
        <p className="mb-3 inline-block rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">
          {t.landing.badge}
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          {t.landing.headline}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600">{t.landing.body}</p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-brand-600 px-5 py-3 font-medium text-white shadow-sm hover:bg-brand-700"
          >
            {t.landing.ctaSignup}
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
          >
            {t.landing.ctaLogin}
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <FeatureCard title={t.landing.feat1Title} body={t.landing.feat1Body} />
        <FeatureCard title={t.landing.feat2Title} body={t.landing.feat2Body} />
        <FeatureCard title={t.landing.feat3Title} body={t.landing.feat3Body} />
      </section>

      <footer className="mt-16 border-t border-slate-200 pt-8 text-sm text-slate-500">
        {t.landing.footer}
      </footer>
    </main>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}
