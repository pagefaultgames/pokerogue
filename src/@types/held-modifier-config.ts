import type { PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import type { PokemonHeldItemModifier } from "#app/modifier/modifier";

export default interface HeldModifierConfig {
  modifier: PokemonHeldItemModifierType | PokemonHeldItemModifier;
  stackCount?: number;
  isTransferable?: boolean;
}
