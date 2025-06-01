import { HeldItems } from "#enums/held-items";
import type { PokemonType } from "#enums/pokemon-type";
import { ITEM_EFFECT } from "./held-item";
import {
  type ATTACK_TYPE_BOOST_PARAMS,
  AttackTypeBoosterHeldItem,
  attackTypeToHeldItem,
} from "./held-items/attack-type-booster";
import { type EXP_BOOST_PARAMS, ExpBoosterHeldItem } from "./held-items/exp-booster";
import { type HIT_HEAL_PARAMS, HitHealHeldItem } from "./held-items/hit-heal";
import type { RESET_NEGATIVE_STAT_STAGE_PARAMS } from "./held-items/reset-negative-stat-stage";
import type { TURN_END_HEAL_PARAMS } from "./held-items/turn-end-heal";
import { TurnEndHealHeldItem } from "./held-items/turn-end-heal";

export const allHeldItems = {};

export function initHeldItems() {
  // SILK_SCARF, BLACK_BELT, etc...
  for (const [typeKey, heldItemType] of Object.entries(attackTypeToHeldItem)) {
    const pokemonType = Number(typeKey) as PokemonType;
    allHeldItems[heldItemType] = new AttackTypeBoosterHeldItem(heldItemType, 99, pokemonType, 0.2);
  }
  allHeldItems[HeldItems.LEFTOVERS] = new TurnEndHealHeldItem(HeldItems.LEFTOVERS, 4);
  allHeldItems[HeldItems.SHELL_BELL] = new HitHealHeldItem(HeldItems.SHELL_BELL, 4);

  allHeldItems[HeldItems.LUCKY_EGG] = new ExpBoosterHeldItem(HeldItems.LUCKY_EGG, 99, 40);
  allHeldItems[HeldItems.GOLDEN_EGG] = new ExpBoosterHeldItem(HeldItems.GOLDEN_EGG, 99, 100);

  console.log(allHeldItems);
}

type APPLY_HELD_ITEMS_PARAMS = {
  [ITEM_EFFECT.ATTACK_TYPE_BOOST]: ATTACK_TYPE_BOOST_PARAMS;
  [ITEM_EFFECT.TURN_END_HEAL]: TURN_END_HEAL_PARAMS;
  [ITEM_EFFECT.HIT_HEAL]: HIT_HEAL_PARAMS;
  [ITEM_EFFECT.RESET_NEGATIVE_STAT_STAGE]: RESET_NEGATIVE_STAT_STAGE_PARAMS;
  [ITEM_EFFECT.EXP_BOOSTER]: EXP_BOOST_PARAMS;
};

export function applyHeldItems<T extends ITEM_EFFECT>(effect: T, params: APPLY_HELD_ITEMS_PARAMS[T]) {
  const pokemon = params.pokemon;
  if (pokemon) {
    for (const item of Object.keys(pokemon.heldItemManager.heldItems)) {
      if (allHeldItems[item].effects.includes(effect)) {
        allHeldItems[item].apply(params);
      }
    }
  }
}
