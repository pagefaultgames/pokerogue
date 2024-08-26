import { PokemonHeldItemModifierType } from "#app/modifier/modifier-type";

export default interface HeldModifierConfig {
  modifierType: PokemonHeldItemModifierType;
  stackCount?: number;
  isTransferable?: boolean;
}
