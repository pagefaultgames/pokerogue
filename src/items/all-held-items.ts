import { HeldItems } from "#enums/held-items";
import type { PokemonType } from "#enums/pokemon-type";
import { AttackTypeBoosterHeldItem, attackTypeToHeldItem } from "./held-items/attack-type-booster";
import { HitHealHeldItem } from "./held-items/hit-heal";
import { TurnHealHeldItem } from "./held-items/turn-heal";

export const allHeldItems = {};

export function initHeldItems() {
  // SILK_SCARF, BLACK_BELT, etc...
  for (const [typeKey, heldItemType] of Object.entries(attackTypeToHeldItem)) {
    const pokemonType = Number(typeKey) as PokemonType;
    allHeldItems[heldItemType] = new AttackTypeBoosterHeldItem(heldItemType, 99, pokemonType, 0.2);
  }
  allHeldItems[HeldItems.LEFTOVERS] = new TurnHealHeldItem(HeldItems.LEFTOVERS, 4);
  allHeldItems[HeldItems.SHELL_BELL] = new HitHealHeldItem(HeldItems.LEFTOVERS, 4);
  console.log(allHeldItems);
}
