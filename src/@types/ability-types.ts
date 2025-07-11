import type Move from "#app/data/moves/move";
import type Pokemon from "#app/field/pokemon";
import type { BattleStat } from "#enums/stat";
import type { AbAttrConstructorMap } from "#app/data/abilities/ability";

// intentionally re-export all types from abilities to have this be the centralized place to import ability types
export type * from "#app/data/abilities/ability";

// biome-ignore lint/correctness/noUnusedImports: Used in a tsdoc comment
import type { applyAbAttrs } from "#app/data/abilities/apply-ab-attrs";

export type AbAttrCondition = (pokemon: Pokemon) => boolean;
export type PokemonAttackCondition = (user: Pokemon | null, target: Pokemon | null, move: Move) => boolean;
export type PokemonDefendCondition = (target: Pokemon, user: Pokemon, move: Move) => boolean;
export type PokemonStatStageChangeCondition = (target: Pokemon, statsChanged: BattleStat[], stages: number) => boolean;

/**
 * Union type of all ability attribute class names as strings
 */
export type AbAttrString = keyof AbAttrConstructorMap;

/**
 * Map of ability attribute class names to an instance of the class.
 */
export type AbAttrMap = {
  [K in keyof AbAttrConstructorMap]: InstanceType<AbAttrConstructorMap[K]>;
};

/**
 * Subset of ability attribute classes that may be passed to {@linkcode applyAbAttrs} method
 *
 * @remarks
 * Our AbAttr classes violate Liskov Substitution Principle.
 *
 * AbAttrs that are not in this have subclasses with apply methods requiring different parameters than
 * the base apply method.
 *
 * Such attributes may not be passed to the {@linkcode applyAbAttrs} method
 */
export type CallableAbAttrString =
  | Exclude<AbAttrString, "PreDefendAbAttr" | "PreAttackAbAttr">
  | "PreApplyBattlerTagAbAttr";

export type AbAttrParamMap = {
  [K in keyof AbAttrMap]: Parameters<AbAttrMap[K]["apply"]>[0];
};
