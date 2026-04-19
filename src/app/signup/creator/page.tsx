"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Platform } from "@prisma/client";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";

const PLATFORMS: Platform[] = ["INSTAGRAM", "TIKTOK", "YOUTUBE_SHORTS"];

export default function CreatorSignupPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    handle: "",
    platform: "INSTAGRAM" as Platform,
    displayName: "",
    country: "US",
    verticals: "",
    followers: "1000",
    engagement: "0.05",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/signup/creator", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        followers: Number(form.followers),
        engagement: Number(form.engagement),
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === "string" ? j.error : t.signup.errorDefault);
      setLoading(false);
      return;
    }
    const login = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (login?.error) {
      setError(t.signup.errorAutoLogin);
      return;
    }
    router.push("/creator");
    router.refresh();
  }

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Link href="/signup" className="text-sm text-brand-600 hover:underline">
        {t.signupChoose.back}
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">{t.signupCreator.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{t.signupCreator.subtitle}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">{t.signup.email}</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">{t.signup.password}</Label>
          <Input
            id="password"
            type="password"
            minLength={8}
            required
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="displayName">{t.signupCreator.displayName}</Label>
          <Input
            id="displayName"
            required
            value={form.displayName}
            onChange={(e) => update("displayName", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="platform">{t.signupCreator.platform}</Label>
            <select
              id="platform"
              value={form.platform}
              onChange={(e) => update("platform", e.target.value as Platform)}
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="handle">{t.signupCreator.handle}</Label>
            <Input
              id="handle"
              required
              placeholder="yourhandle"
              value={form.handle}
              onChange={(e) => update("handle", e.target.value.replace(/^@/, ""))}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="country">{t.signupCreator.country}</Label>
          <Input
            id="country"
            required
            placeholder="US"
            value={form.country}
            onChange={(e) => update("country", e.target.value.toUpperCase())}
          />
        </div>
        <div>
          <Label htmlFor="verticals">{t.signupCreator.verticalsCsv}</Label>
          <Input
            id="verticals"
            required
            placeholder="fitness, wellness"
            value={form.verticals}
            onChange={(e) => update("verticals", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="followers">{t.signupCreator.followers}</Label>
            <Input
              id="followers"
              type="number"
              min={0}
              required
              value={form.followers}
              onChange={(e) => update("followers", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="engagement">{t.signupCreator.engagement}</Label>
            <Input
              id="engagement"
              type="number"
              step="0.001"
              min={0}
              max={1}
              required
              value={form.engagement}
              onChange={(e) => update("engagement", e.target.value)}
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t.signup.submitting : t.signupCreator.submit}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        {t.signup.haveAccount}{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          {t.signup.logIn}
        </Link>
      </p>
    </main>
  );
}
