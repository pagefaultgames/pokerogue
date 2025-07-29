import type { PokemonHeldItemModifier } from "#modifiers/modifier";
import type { PokemonHeldItemModifierType } from "#modifiers/modifier-type";

export interface HeldModifierConfig {
  modifier: PokemonHeldItemModifierType | PokemonHeldItemModifier;
  stackCount?: number;
  isTransferable?: boolean;
}
