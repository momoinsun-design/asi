"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Platform } from "@prisma/client";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";

export function NewCampaignForm({
  influencerId,
  platform,
  defaultOfferUsd,
}: {
  influencerId: string;
  platform: Platform;
  defaultOfferUsd: number;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [brief, setBrief] = useState(t.newCampaign.briefDefault);
  const [offerUsd, setOfferUsd] = useState(String(defaultOfferUsd));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        influencerId,
        platform,
        brief,
        offerUsd: Number(offerUsd),
      }),
    });
    if (!res.ok) {
      setError(t.newCampaign.errorCreate);
      setLoading(false);
      return;
    }
    const j = (await res.json()) as { campaign: { id: string } };
    router.push(`/campaigns/${j.campaign.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <Label htmlFor="brief">{t.newCampaign.brief}</Label>
        <Textarea id="brief" rows={5} value={brief} onChange={(e) => setBrief(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="offerUsd">{t.newCampaign.offer}</Label>
        <Input id="offerUsd" type="number" min={1} value={offerUsd} onChange={(e) => setOfferUsd(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? t.newCampaign.submitting : t.newCampaign.submit}
      </Button>
    </form>
  );
}
