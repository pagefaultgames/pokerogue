import type { Modifier } from "../modifier/modifier";

export type ModifierPredicate = (modifier: Modifier) => boolean;
export type ModifierIdentityPredicate<T extends Modifier> = (modifier: Modifier) => modifier is T;
