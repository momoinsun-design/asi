import Stripe from "stripe";

// Two operating modes:
//   mock : deterministic local state, no network, no key required (default for dev/demo)
//   test : real Stripe test-mode (uses STRIPE_SECRET_KEY)
// Production usage (real KYC, Stripe Connect onboarding, transfers) is
// out of scope for this MVP scaffold — see README TODO.

type Mode = "mock" | "test";

function mode(): Mode {
  const explicit = process.env.STRIPE_MODE;
  if (explicit === "mock" || explicit === "test") return explicit;
  return process.env.STRIPE_SECRET_KEY ? "test" : "mock";
}

let client: Stripe | null = null;
function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is required when STRIPE_MODE=test");
    }
    // SDK default apiVersion is used to keep TypeScript aligned with the types in `stripe@^22`.
    client = new Stripe(key);
  }
  return client;
}

export interface EscrowIntent {
  ref: string;           // local reference
  stripeId: string | null; // real Stripe PaymentIntent id, or null in mock mode
  amountUsd: number;
  clientSecret: string | null;
}

export async function createEscrowHold(params: {
  campaignId: string;
  amountUsd: number;
}): Promise<EscrowIntent> {
  if (mode() === "mock") {
    return {
      ref: `mock_hold_${params.campaignId}`,
      stripeId: null,
      amountUsd: params.amountUsd,
      clientSecret: null,
    };
  }

  const pi = await stripe().paymentIntents.create({
    amount: params.amountUsd * 100,
    currency: "usd",
    capture_method: "manual", // funds authorized; capture on deliverable verified
    metadata: { campaignId: params.campaignId },
    description: `Campaign escrow ${params.campaignId}`,
  });

  return {
    ref: pi.id,
    stripeId: pi.id,
    amountUsd: params.amountUsd,
    clientSecret: pi.client_secret,
  };
}

export async function releaseEscrow(stripeRef: string | null): Promise<void> {
  if (mode() === "mock" || !stripeRef) return;
  // Production: transfer funds to Influencer's Connect account, then capture.
  // TODO: Stripe Connect payout wiring.
  await stripe().paymentIntents.capture(stripeRef);
}

export async function refundEscrow(stripeRef: string | null): Promise<void> {
  if (mode() === "mock" || !stripeRef) return;
  await stripe().paymentIntents.cancel(stripeRef);
}

export function currentMode(): Mode {
  return mode();
}
