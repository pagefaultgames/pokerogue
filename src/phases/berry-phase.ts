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

/** The phase after attacks where the pokemon eat berries */
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
   * @param pokemon The {@linkcode Pokemon} to check
   */
  eatBerries(pokemon: Pokemon): void {
    // check if we even have anything to eat
    const hasUsableBerry = !!globalScene.findModifier(m => {
      return m instanceof BerryModifier && m.shouldApply(pokemon);
    }, pokemon.isPlayer());
    if (!hasUsableBerry) {
      return;
    }

    // Check if any opponents have unnerve to block us from eating berries
    const cancelled = new BooleanHolder(false);
    pokemon.getOpponents().map(opp => applyAbAttrs(PreventBerryUseAbAttr, opp, cancelled));
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

    // try to apply all berry modifiers for this pokemon
    for (const berryModifier of globalScene.applyModifiers(BerryModifier, pokemon.isPlayer(), pokemon)) {
      if (berryModifier.consumed) {
        berryModifier.consumed = false;
        pokemon.loseHeldItem(berryModifier);
      }
      // No need to track berries being eaten; already done inside applyModifiers
      globalScene.eventTarget.dispatchEvent(new BerryUsedEvent(berryModifier));
    }

    // update held modifiers and such
    globalScene.updateModifiers(pokemon.isPlayer());

    // Abilities.CHEEK_POUCH only works once per round of nom noms
    applyAbAttrs(HealFromBerryUseAbAttr, pokemon, new BooleanHolder(false));
  }
}
