"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";

export default function BrandSignupPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    company: "",
    vertical: "",
    budgetUsd: "5000",
    goals: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/signup/brand", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, budgetUsd: Number(form.budgetUsd) }),
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
    router.push("/dashboard");
    router.refresh();
  }

  function bind(field: keyof typeof form) {
    return {
      value: form[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [field]: e.target.value })),
    };
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Link href="/signup" className="text-sm text-brand-600 hover:underline">
        {t.signupChoose.back}
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">{t.signupBrand.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{t.signupBrand.subtitle}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">{t.signup.email}</Label>
          <Input id="email" type="email" required {...bind("email")} />
        </div>
        <div>
          <Label htmlFor="password">{t.signup.password}</Label>
          <Input id="password" type="password" minLength={8} required {...bind("password")} />
        </div>
        <div>
          <Label htmlFor="company">{t.signup.company}</Label>
          <Input id="company" required {...bind("company")} />
        </div>
        <div>
          <Label htmlFor="vertical">{t.signup.vertical}</Label>
          <Input id="vertical" required {...bind("vertical")} />
        </div>
        <div>
          <Label htmlFor="budgetUsd">{t.signup.budget}</Label>
          <Input id="budgetUsd" type="number" min={100} required {...bind("budgetUsd")} />
        </div>
        <div>
          <Label htmlFor="goals">{t.signup.goals}</Label>
          <Textarea id="goals" rows={3} required {...bind("goals")} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t.signup.submitting : t.signup.submit}
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
