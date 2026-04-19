"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CampaignState } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";

type Action = "SEND" | "NEGOTIATE" | "ACCEPT" | "FUND" | "DELIVER" | "COMPLETE" | "CANCEL";

// UI-available actions per state, mirroring the server FSM.
const AVAILABLE: Record<CampaignState, Action[]> = {
  DRAFT:       ["SEND", "CANCEL"],
  SENT:        ["NEGOTIATE", "ACCEPT", "CANCEL"],
  NEGOTIATING: ["ACCEPT", "CANCEL"],
  ACCEPTED:    ["FUND", "CANCEL"],
  FUNDED:      ["DELIVER", "CANCEL"],
  DELIVERED:   ["COMPLETE", "CANCEL"],
  COMPLETED:   [],
  CANCELLED:   [],
};

export function CampaignActions({
  campaignId,
  state,
  hasEscrow,
}: {
  campaignId: string;
  state: CampaignState;
  hasEscrow: boolean;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const actions = AVAILABLE[state];

  function dispatch(action: Action) {
    startTransition(async () => {
      setErr(null);
      if (action === "FUND") {
        const res = await fetch("/api/escrow", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ campaignId }),
        });
        if (!res.ok) {
          setErr(await extractError(res));
          return;
        }
      } else {
        const res = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!res.ok) {
          setErr(await extractError(res));
          return;
        }
      }
      router.refresh();
    });
  }

  async function releaseEscrow() {
    startTransition(async () => {
      setErr(null);
      const res = await fetch("/api/escrow", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campaignId, op: "release" }),
      });
      if (!res.ok) {
        setErr(await extractError(res));
        return;
      }
      router.refresh();
    });
  }

  function onDelete() {
    if (!window.confirm(t.actions.confirmDelete)) return;
    startTransition(async () => {
      setErr(null);
      const res = await fetch(`/api/campaigns/${campaignId}`, { method: "DELETE" });
      if (!res.ok) {
        setErr(await extractError(res));
        return;
      }
      router.push("/campaigns");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <Button
          key={a}
          onClick={() => dispatch(a)}
          disabled={pending}
          variant={a === "CANCEL" ? "danger" : a === "ACCEPT" || a === "COMPLETE" ? "primary" : "secondary"}
        >
          {t.actions[a]}
        </Button>
      ))}
      {state === "COMPLETED" && hasEscrow && (
        <Button onClick={releaseEscrow} disabled={pending} variant="primary">
          {t.actions.RELEASE_ESCROW}
        </Button>
      )}
      {state === "CANCELLED" && (
        <Button onClick={onDelete} disabled={pending} variant="danger">
          {t.actions.DELETE}
        </Button>
      )}
      {actions.length === 0 && state !== "COMPLETED" && state !== "CANCELLED" && (
        <p className="text-sm text-slate-500">{t.campaignDetail.noActionsRemaining}</p>
      )}
      {err && <p className="w-full text-sm text-red-600">{err}</p>}
    </div>
  );
}

async function extractError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string | object };
    return typeof j.error === "string" ? j.error : `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}
