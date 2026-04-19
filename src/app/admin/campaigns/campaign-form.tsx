"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CampaignState } from "@prisma/client";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";

const STATES: CampaignState[] = [
  "DRAFT",
  "SENT",
  "NEGOTIATING",
  "ACCEPTED",
  "FUNDED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
];

interface Initial {
  id: string;
  brief: string;
  offerUsd: number;
  state: CampaignState;
}

export function CampaignForm({ initial }: { initial: Initial }) {
  const { t } = useLocale();
  const router = useRouter();
  const [form, setForm] = useState<Omit<Initial, "id">>({
    brief: initial.brief,
    offerUsd: initial.offerUsd,
    state: initial.state,
  });
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/campaigns/${initial.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, offerUsd: Number(form.offerUsd) }),
      });
      if (!res.ok) {
        setErr(t.admin.campaigns.errorSave);
        return;
      }
      router.push("/admin/campaigns");
      router.refresh();
    });
  }

  function onDelete() {
    if (!window.confirm(t.actions.confirmDelete)) return;
    setErr(null);
    startTransition(async () => {
      const res = await fetch(`/api/campaigns/${initial.id}`, { method: "DELETE" });
      if (!res.ok) {
        setErr(t.actions.errorDelete);
        return;
      }
      router.push("/admin/campaigns");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="state">{t.admin.campaigns.state}</Label>
          <select
            id="state"
            value={form.state}
            onChange={(e) => setForm((p) => ({ ...p, state: e.target.value as CampaignState }))}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {STATES.map((s) => (
              <option key={s} value={s}>
                {t.campaignState[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="offer">{t.admin.campaigns.offer}</Label>
          <Input
            id="offer"
            type="number"
            min={1}
            value={form.offerUsd}
            onChange={(e) => setForm((p) => ({ ...p, offerUsd: Number(e.target.value) }))}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="brief">{t.admin.campaigns.brief}</Label>
        <Textarea
          id="brief"
          rows={6}
          value={form.brief}
          onChange={(e) => setForm((p) => ({ ...p, brief: e.target.value }))}
          required
        />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? t.admin.campaigns.saving : t.admin.campaigns.save}
        </Button>
        <Button type="button" variant="danger" onClick={onDelete} disabled={pending}>
          {t.actions.DELETE}
        </Button>
      </div>
    </form>
  );
}
