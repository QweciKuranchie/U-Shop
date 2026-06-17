// lib/orders/state-machine.ts
// Compliance: U-Shop SRD v1.1 §6.2
// TS Trigger comment: forcing compiler type refresh

import { OrderStatus } from "../../generated/prisma";

// Immutable transition map — source of truth for all state changes
const VALID_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  PENDING_COD: ["PROCESSING", "CANCELLED"] as const,
  PAID: ["PROCESSING", "DISPUTED"] as const,
  PROCESSING: ["READY_FOR_PICKUP", "DISPUTED"] as const,
  READY_FOR_PICKUP: ["IN_TRANSIT", "DISPUTED"] as const,
  IN_TRANSIT: ["DELIVERED", "DISPUTED"] as const,
  DELIVERED: ["COMPLETED", "DISPUTED"] as const,
  COMPLETED: [] as const,
  DISPUTED: ["COMPLETED", "CANCELLED"] as const,
  CANCELLED: [] as const,
};

// Roles permitted to trigger each transition
const TRANSITION_ACTORS: Readonly<Record<string, readonly string[]>> = {
  [`PENDING_COD->PROCESSING`]: ["seller", "admin"],
  [`PAID->PROCESSING`]: ["seller"],
  [`PROCESSING->READY_FOR_PICKUP`]: ["seller"],
  [`READY_FOR_PICKUP->IN_TRANSIT`]: ["admin"], // Admin triggers by assigning rider
  [`IN_TRANSIT->DELIVERED`]: ["system"], // System triggers on OTP match
  [`DELIVERED->COMPLETED`]: ["admin"],
  [`PAID->DISPUTED`]: ["buyer", "admin"],
  [`PROCESSING->DISPUTED`]: ["buyer", "admin"],
  [`READY_FOR_PICKUP->DISPUTED`]: ["buyer", "admin"],
  [`IN_TRANSIT->DISPUTED`]: ["buyer", "admin"],
  [`DELIVERED->DISPUTED`]: ["buyer", "admin"],
  [`DISPUTED->COMPLETED`]: ["admin"],
  [`DISPUTED->CANCELLED`]: ["admin"],
  [`PENDING_COD->CANCELLED`]: ["admin"],
};

export class InvalidStateTransitionError extends Error {
  public readonly statusCode = 422;
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Illegal state transition: ${from} → ${to}`);
    this.name = "InvalidStateTransitionError";
  }
}

export class UnauthorisedTransitionError extends Error {
  public readonly statusCode = 403;
  constructor(role: string, from: OrderStatus, to: OrderStatus) {
    super(`Role "${role}" cannot transition order from ${from} → ${to}`);
    this.name = "UnauthorisedTransitionError";
  }
}

/**
 * Validates a proposed state transition and the actor's authorisation.
 * Throws InvalidStateTransitionError (→ 422) or UnauthorisedTransitionError (→ 403).
 */
export function assertValidTransition(
  from: OrderStatus,
  to: OrderStatus,
  actorRole?: string
): void {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new InvalidStateTransitionError(from, to);
  }

  if (actorRole !== undefined) {
    const permittedActors = TRANSITION_ACTORS[`${from}->${to}`] ?? [];
    if (!permittedActors.includes(actorRole)) {
      throw new UnauthorisedTransitionError(actorRole, from, to);
    }
  }
}

/** Returns timestamp field name for a given target state */
export function getTimestampField(to: OrderStatus): string | null {
  const map: Partial<Record<OrderStatus, string>> = {
    PAID: "paidAt",
    PROCESSING: "processedAt",
    READY_FOR_PICKUP: "readyAt",
    IN_TRANSIT: "inTransitAt",
    DELIVERED: "deliveredAt",
    COMPLETED: "completedAt",
    DISPUTED: "disputedAt",
  };
  return map[to] ?? null;
}
