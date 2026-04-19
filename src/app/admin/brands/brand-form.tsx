"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";

interface Initial {
  id: string;
  company: string;
  vertical: string;
  budgetUsd: number;
  goals: string;
}

export function BrandForm({ initial }: { initial: Initial }) {
  const { t } = useLocale();
  const router = useRouter();
  const [form, setForm] = useState<Omit<Initial, "id">>({
    company: initial.company,
    vertical: initial.vertical,
    budgetUsd: initial.budgetUsd,
    goals: initial.goals,
  });
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/brands/${initial.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, budgetUsd: Number(form.budgetUsd) }),
      });
      if (!res.ok) {
        setErr(t.admin.brands.errorSave);
        return;
      }
      router.push("/admin/brands");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="company">{t.admin.brands.company}</Label>
          <Input
            id="company"
            value={form.company}
            onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="vertical">{t.admin.brands.vertical}</Label>
          <Input
            id="vertical"
            value={form.vertical}
            onChange={(e) => setForm((p) => ({ ...p, vertical: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="budget">{t.admin.brands.budget}</Label>
          <Input
            id="budget"
            type="number"
            min={100}
            value={form.budgetUsd}
            onChange={(e) => setForm((p) => ({ ...p, budgetUsd: Number(e.target.value) }))}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="goals">{t.admin.brands.goals}</Label>
        <Textarea
          id="goals"
          rows={4}
          value={form.goals}
          onChange={(e) => setForm((p) => ({ ...p, goals: e.target.value }))}
          required
        />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t.admin.brands.saving : t.admin.brands.save}
        </Button>
      </div>
    </form>
  );
}
