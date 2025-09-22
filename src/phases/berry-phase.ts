import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { CommonAnim } from "#enums/move-anims-common";
import { BerryUsedEvent } from "#events/battle-scene";
import type { Pokemon } from "#field/pokemon";
import { BerryModifier } from "#modifiers/modifier";
import { FieldPhase } from "#phases/field-phase";
import { BooleanHolder } from "#utils/common";
import i18next from "i18next";

/**
 * The phase after attacks where the pokemon eat berries.
 * Also triggers Cud Chew's "repeat berry use" effects
 */
export class BerryPhase extends FieldPhase {
  public readonly phaseName = "BerryPhase";
  start() {
    super.start();

    this.executeForAll(pokemon => {
      this.eatBerries(pokemon);
      applyAbAttrs("CudChewConsumeBerryAbAttr", { pokemon });
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
    pokemon.getOpponents().forEach(opp => applyAbAttrs("PreventBerryUseAbAttr", { pokemon: opp, cancelled }));
    if (cancelled.value) {
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:preventBerryUse", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      );
      return;
    }

    globalScene.phaseManager.unshiftNew(
      "CommonAnimPhase",
      pokemon.getBattlerIndex(),
      pokemon.getBattlerIndex(),
      CommonAnim.USE_ITEM,
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

    // AbilityId.CHEEK_POUCH only works once per round of nom noms
    applyAbAttrs("HealFromBerryUseAbAttr", { pokemon });
  }
}
