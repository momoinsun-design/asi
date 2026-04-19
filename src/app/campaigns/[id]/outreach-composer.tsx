"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Textarea, Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";

export function OutreachComposer({ campaignId }: { campaignId: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [counterUsd, setCounterUsd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const payload: Record<string, unknown> = { campaignId, body };
    if (counterUsd) payload.counterUsd = Number(counterUsd);

    const res = await fetch("/api/outreach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      setErr(t.campaignDetail.errorSend);
      return;
    }
    setBody("");
    setCounterUsd("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-4">
      <Label htmlFor="body">{t.campaignDetail.message}</Label>
      <Textarea
        id="body"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        placeholder={t.campaignDetail.messagePlaceholder}
      />
      <div className="mt-3 flex items-end gap-3">
        <div>
          <Label htmlFor="counter">{t.campaignDetail.counterLabel}</Label>
          <Input
            id="counter"
            type="number"
            min={0}
            value={counterUsd}
            onChange={(e) => setCounterUsd(e.target.value)}
            className="w-32"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? t.campaignDetail.sending : t.campaignDetail.send}
        </Button>
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </form>
  );
}
