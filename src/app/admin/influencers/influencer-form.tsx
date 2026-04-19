"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Platform } from "@prisma/client";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";

const PLATFORMS: Platform[] = ["INSTAGRAM", "TIKTOK", "YOUTUBE_SHORTS"];

interface Initial {
  id?: string;
  handle: string;
  platform: Platform;
  displayName: string;
  followers: number;
  engagement: number;
  verticals: string;
  country: string;
}

export function InfluencerForm({ initial }: { initial?: Initial }) {
  const { t } = useLocale();
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<Initial>(
    initial ?? {
      handle: "",
      platform: "INSTAGRAM",
      displayName: "",
      followers: 0,
      engagement: 0.05,
      verticals: "",
      country: "GLOBAL",
    },
  );
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const url = isEdit ? `/api/admin/influencers/${initial!.id}` : "/api/admin/influencers";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          handle: form.handle,
          platform: form.platform,
          displayName: form.displayName,
          followers: Number(form.followers),
          engagement: Number(form.engagement),
          verticals: form.verticals,
          country: form.country,
        }),
      });
      if (!res.ok) {
        setErr(t.admin.influencers.errorSave);
        return;
      }
      router.push("/admin/influencers");
      router.refresh();
    });
  }

  async function onDelete() {
    if (!initial?.id) return;
    if (!window.confirm(t.admin.influencers.confirmDelete)) return;
    setErr(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/influencers/${initial.id}`, { method: "DELETE" });
      if (!res.ok) {
        setErr(t.admin.influencers.errorDelete);
        return;
      }
      router.push("/admin/influencers");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="handle">{t.admin.influencers.handle}</Label>
          <Input
            id="handle"
            value={form.handle}
            onChange={(e) => update("handle", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="platform">{t.admin.influencers.platform}</Label>
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
          <Label htmlFor="displayName">{t.admin.influencers.displayName}</Label>
          <Input
            id="displayName"
            value={form.displayName}
            onChange={(e) => update("displayName", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="country">{t.admin.influencers.country}</Label>
          <Input
            id="country"
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="followers">{t.admin.influencers.followers}</Label>
          <Input
            id="followers"
            type="number"
            min={0}
            value={form.followers}
            onChange={(e) => update("followers", Number(e.target.value))}
            required
          />
        </div>
        <div>
          <Label htmlFor="engagement">{t.admin.influencers.engagement}</Label>
          <Input
            id="engagement"
            type="number"
            step="0.001"
            min={0}
            max={1}
            value={form.engagement}
            onChange={(e) => update("engagement", Number(e.target.value))}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="verticals">{t.admin.influencers.verticalsCsv}</Label>
        <Input
          id="verticals"
          value={form.verticals}
          onChange={(e) => update("verticals", e.target.value)}
          required
          placeholder="beauty, skincare"
        />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? t.admin.influencers.saving : t.admin.influencers.save}
        </Button>
        {isEdit && (
          <Button type="button" variant="danger" onClick={onDelete} disabled={pending}>
            {t.admin.influencers.delete}
          </Button>
        )}
      </div>
    </form>
  );
}
