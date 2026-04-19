import { describe, it, expect } from "vitest";
import { canTransition, assertTransition, isTerminal } from "./campaign-state";

describe("campaign FSM", () => {
  it("allows DRAFT → SENT", () => {
    expect(canTransition("DRAFT", "SENT")).toBe(true);
  });

  it("blocks DRAFT → COMPLETED (skips states)", () => {
    expect(canTransition("DRAFT", "COMPLETED")).toBe(false);
  });

  it("blocks COMPLETED → anything (terminal)", () => {
    expect(canTransition("COMPLETED", "FUNDED")).toBe(false);
    expect(canTransition("COMPLETED", "CANCELLED")).toBe(false);
  });

  it("allows CANCEL from every non-terminal state", () => {
    for (const s of ["DRAFT", "SENT", "NEGOTIATING", "ACCEPTED", "FUNDED", "DELIVERED"] as const) {
      expect(canTransition(s, "CANCELLED")).toBe(true);
    }
  });

  it("throws on illegal transition via assertTransition", () => {
    expect(() => assertTransition("DRAFT", "FUNDED")).toThrow();
  });

  it("marks terminal states correctly", () => {
    expect(isTerminal("COMPLETED")).toBe(true);
    expect(isTerminal("CANCELLED")).toBe(true);
    expect(isTerminal("DRAFT")).toBe(false);
    expect(isTerminal("FUNDED")).toBe(false);
  });
});
