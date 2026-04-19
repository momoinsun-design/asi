import type { CampaignState } from "@prisma/client";

// Finite state machine for Campaign lifecycle.
//
//   DRAFT ─► SENT ─► NEGOTIATING ─► ACCEPTED ─► FUNDED ─► DELIVERED ─► COMPLETED
//              │           │             │          │           │
//              └───────────┴─────────────┴──────────┴───────────┴─► CANCELLED

const TRANSITIONS: Record<CampaignState, CampaignState[]> = {
  DRAFT:       ["SENT", "CANCELLED"],
  SENT:        ["NEGOTIATING", "ACCEPTED", "CANCELLED"],
  NEGOTIATING: ["ACCEPTED", "CANCELLED"],
  ACCEPTED:    ["FUNDED", "CANCELLED"],
  FUNDED:      ["DELIVERED", "CANCELLED"],
  DELIVERED:   ["COMPLETED", "CANCELLED"],
  COMPLETED:   [],
  CANCELLED:   [],
};

export function canTransition(from: CampaignState, to: CampaignState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: CampaignState, to: CampaignState): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal campaign transition: ${from} → ${to}`);
  }
}

export function isTerminal(state: CampaignState): boolean {
  return state === "COMPLETED" || state === "CANCELLED";
}
