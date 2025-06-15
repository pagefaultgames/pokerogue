/**
 * Re-exports of all the types defined in the modifier module.
 */

import type Pokemon from "#app/field/pokemon";
import type { ModifierConstructorMap } from "#app/modifier/modifier";
import type { ModifierType, WeightedModifierType } from "#app/modifier/modifier-type";
export type ModifierTypeFunc = () => ModifierType;
export type WeightedModifierTypeWeightFunc = (party: Pokemon[], rerollCount?: number) => number;

export type { ModifierConstructorMap } from "#app/modifier/modifier";

/**
 * Map of modifier names to their respective instance types
 */
export type ModifierInstanceMap = {
  [K in keyof ModifierConstructorMap]: InstanceType<ModifierConstructorMap[K]>;
};

/**
 * Union type of all modifier constructors.
 */
export type ModifierClass = ModifierConstructorMap[keyof ModifierConstructorMap];

/**
 * Union type of all modifier names as strings.
 */
export type ModifierString = keyof ModifierConstructorMap;

export type ModifierPool = {
  [tier: string]: WeightedModifierType[];
};
