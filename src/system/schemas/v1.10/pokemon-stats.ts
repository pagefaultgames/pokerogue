import { Z$PositiveInt } from "#schemas/common";
import { z } from "zod";

/**
 * Schema for a Pokémon's Individual Values (IVs), as of version 1.10
 *
 * @remarks
 * - Each IV is an integer between 0 and 31, inclusive.
 * - Malformed values parse to 15 by default.
 */
export const Z$IV = z.int().min(0).max(31).catch(15);

/**
 * Schema for a set of 6 Pokémon IVs, as of version 1.10
 *
 * @remarks
 * Malformed IV sets default to [15, 15, 15, 15, 15, 15].
 */
export const Z$IVSet = z.tuple([Z$IV, Z$IV, Z$IV, Z$IV, Z$IV, Z$IV]).catch([15, 15, 15, 15, 15, 15]);

/**
 * Schema for a Pokémon's stats, as of version 1.10
 * - [0]: HP,
 * - [1]: Attack,
 * - [2]: Defense,
 * - [3]: Special Attack,
 * - [4]: Special Defense,
 * - [5]: Speed
 */
export const Z$StatSet = z.tuple([
  Z$PositiveInt, // HP
  Z$PositiveInt, // Attack
  Z$PositiveInt, // Defense
  Z$PositiveInt, // Special Attack
  Z$PositiveInt, // Special Defense
  Z$PositiveInt, // Speed
]);
