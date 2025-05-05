import {
  applyAbAttrs,
  PreventBerryUseAbAttr,
  HealFromBerryUseAbAttr,
  RepeatBerryNextTurnAbAttr,
} from "#app/data/abilities/ability";
import { CommonAnim } from "#app/data/battle-anims";
import { BerryUsedEvent } from "#app/events/battle-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { BerryModifier } from "#app/modifier/modifier";
import i18next from "i18next";
import { BooleanHolder } from "#app/utils/common";
import { FieldPhase } from "./field-phase";
import { CommonAnimPhase } from "./common-anim-phase";
import { globalScene } from "#app/global-scene";
import type Pokemon from "#app/field/pokemon";

/**
 * The phase after attacks where the pokemon eat berries.
 * Also triggers Cud Chew's "repeat berry use" effects
 */
export class BerryPhase extends FieldPhase {
  start() {
    super.start();

    this.executeForAll(pokemon => {
      this.eatBerries(pokemon);
      applyAbAttrs(RepeatBerryNextTurnAbAttr, pokemon, null);
    });

    this.end();
  }

  /**
   * Attempt to eat all of a given {@linkcode Pokemon}'s berries once.
   * @param pokemon - The {@linkcode Pokemon} to check
   */
  eatBerries(pokemon: Pokemon): void {
    const hasUsableBerry = !!globalScene.findModifier(
      m => m instanceof BerryModifier && m.shouldApply(pokemon),
      pokemon.isPlayer(),
    );

    if (!hasUsableBerry) {
      return;
    }

    // TODO: If both opponents on field have unnerve, which one displays its message?
    const cancelled = new BooleanHolder(false);
    pokemon.getOpponents().forEach(opp => applyAbAttrs(PreventBerryUseAbAttr, opp, cancelled));
    if (cancelled.value) {
      globalScene.queueMessage(
        i18next.t("abilityTriggers:preventBerryUse", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      );
      return;
    }

    globalScene.unshiftPhase(
      new CommonAnimPhase(pokemon.getBattlerIndex(), pokemon.getBattlerIndex(), CommonAnim.USE_ITEM),
    );

    for (const berryModifier of globalScene.applyModifiers(BerryModifier, pokemon.isPlayer(), pokemon)) {
      // No need to track berries being eaten; already done inside applyModifiers
      if (berryModifier.consumed) {
        berryModifier.consumed = false;
        pokemon.loseHeldItem(berryModifier);
      }
      globalScene.eventTarget.dispatchEvent(new BerryUsedEvent(berryModifier));
    }
    globalScene.updateModifiers(pokemon.isPlayer());

    // Abilities.CHEEK_POUCH only works once per round of nom noms
    applyAbAttrs(HealFromBerryUseAbAttr, pokemon, new BooleanHolder(false));
  }
}
