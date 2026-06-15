import type { IntClosedRange } from "type-fest";

/**
 * The index of a Pokemon in either the player or enemy party.
 */
export type PartyMemberIndex = IntClosedRange<0, 5>;
