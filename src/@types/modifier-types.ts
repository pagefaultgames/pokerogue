// Intentionally re-exports `ModifierConstructorMap` from `modifier.ts`

import type { Pokemon } from "#field/pokemon";
import type { ModifierConstructorMap } from "#modifiers/modifier";
import type { ModifierType, WeightedModifierType } from "#modifiers/modifier-type";
import type { ObjectValues } from "#types/type-helpers";

export type ModifierTypeFunc = () => ModifierType;
export type WeightedModifierTypeWeightFunc = (party: Pokemon[], rerollCount?: number) => number;

export type { ModifierConstructorMap } from "#modifiers/modifier";

/**
 * Map of modifier names to their respective instance types
 */
export type ModifierInstanceMap = {
  [K in keyof ModifierConstructorMap]: InstanceType<ModifierConstructorMap[K]>;
};

/**
 * Union type of all modifier constructors.
 */
export type ModifierClass = ObjectValues<ModifierConstructorMap>;

/**
 * Union type of all modifier names as strings.
 */
export type ModifierString = keyof ModifierConstructorMap;

export type ModifierPool = {
  [tier: string]: WeightedModifierType[];
};
