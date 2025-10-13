import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { allHeldItems } from "#data/data-lists";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemCategoryId, isItemInCategory } from "#enums/held-item-id";
import { CommonAnim } from "#enums/move-anims-common";
import type { Pokemon } from "#field/pokemon";
import type { BerryHeldItem } from "#items/berry";
import { FieldPhase } from "#phases/field-phase";
import { BooleanHolder } from "#utils/common";
import { applyHeldItems } from "#utils/items";
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
    const hasUsableBerry = pokemon.iterHeldItems().some(m => {
      return (
        isItemInCategory(m, HeldItemCategoryId.BERRY)
        && (allHeldItems[m] as BerryHeldItem).shouldApply(HeldItemEffect.BERRY, { pokemon })
      );
    });

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

    applyHeldItems(HeldItemEffect.BERRY, { pokemon });
    globalScene.updateItems(pokemon.isPlayer());

    // AbilityId.CHEEK_POUCH only works once per round of nom noms
    applyAbAttrs("HealFromBerryUseAbAttr", { pokemon });
  }
}
