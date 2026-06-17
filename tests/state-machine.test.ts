// tests/state-machine.test.ts
// TS Cache Refresh Trigger
import { describe, it, expect } from "vitest";
import {
  assertValidTransition,
  InvalidStateTransitionError,
  UnauthorisedTransitionError,
} from "../lib/orders/state-machine";

describe("Order State Machine (lib/orders/state-machine.ts)", () => {
  it("should allow assertValidTransition('PAID', 'PROCESSING') to pass", () => {
    expect(() => assertValidTransition("PAID", "PROCESSING")).not.toThrow();
  });

  it("should allow assertValidTransition('PROCESSING', 'READY_FOR_PICKUP') to pass", () => {
    expect(() => assertValidTransition("PROCESSING", "READY_FOR_PICKUP")).not.toThrow();
  });

  it("should throw InvalidStateTransitionError (status 422) for PROCESSING → COMPLETED", () => {
    expect(() => assertValidTransition("PROCESSING", "COMPLETED")).toThrow(InvalidStateTransitionError);
    try {
      assertValidTransition("PROCESSING", "COMPLETED");
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(InvalidStateTransitionError);
      if (e instanceof InvalidStateTransitionError) {
        expect(e.statusCode).toBe(422);
      }
    }
  });

  it("should throw InvalidStateTransitionError (status 422) for DELIVERED → PROCESSING", () => {
    expect(() => assertValidTransition("DELIVERED", "PROCESSING")).toThrow(InvalidStateTransitionError);
    try {
      assertValidTransition("DELIVERED", "PROCESSING");
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(InvalidStateTransitionError);
      if (e instanceof InvalidStateTransitionError) {
        expect(e.statusCode).toBe(422);
      }
    }
  });

  it("should pass for valid transitions in the state machine with valid roles", () => {
    // PENDING_COD -> PROCESSING (role: seller or admin)
    expect(() => assertValidTransition("PENDING_COD", "PROCESSING", "seller")).not.toThrow();
    expect(() => assertValidTransition("PENDING_COD", "PROCESSING", "admin")).not.toThrow();

    // PAID -> PROCESSING (role: seller)
    expect(() => assertValidTransition("PAID", "PROCESSING", "seller")).not.toThrow();

    // PROCESSING -> READY_FOR_PICKUP (role: seller)
    expect(() => assertValidTransition("PROCESSING", "READY_FOR_PICKUP", "seller")).not.toThrow();

    // READY_FOR_PICKUP -> IN_TRANSIT (role: admin)
    expect(() => assertValidTransition("READY_FOR_PICKUP", "IN_TRANSIT", "admin")).not.toThrow();

    // IN_TRANSIT -> DELIVERED (role: system)
    expect(() => assertValidTransition("IN_TRANSIT", "DELIVERED", "system")).not.toThrow();

    // DELIVERED -> COMPLETED (role: admin)
    expect(() => assertValidTransition("DELIVERED", "COMPLETED", "admin")).not.toThrow();
  });

  it("should throw UnauthorisedTransitionError (status 403) for invalid transition roles", () => {
    // PAID -> PROCESSING is only for seller, not buyer
    expect(() => assertValidTransition("PAID", "PROCESSING", "buyer")).toThrow(UnauthorisedTransitionError);
    try {
      assertValidTransition("PAID", "PROCESSING", "buyer");
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(UnauthorisedTransitionError);
      if (e instanceof UnauthorisedTransitionError) {
        expect(e.statusCode).toBe(403);
      }
    }

    // DELIVERED -> COMPLETED is only for admin, not seller
    expect(() => assertValidTransition("DELIVERED", "COMPLETED", "seller")).toThrow(UnauthorisedTransitionError);
  });
});
