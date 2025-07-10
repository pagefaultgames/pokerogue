import { applyAbAttrs } from "#app/data/abilities/apply-ab-attrs";
import { CommonAnim } from "#enums/move-anims-common";
import { getPokemonNameWithAffix } from "#app/messages";
import i18next from "i18next";
import { BooleanHolder } from "#app/utils/common";
import { FieldPhase } from "./field-phase";
import { globalScene } from "#app/global-scene";
import type Pokemon from "#app/field/pokemon";
import { allHeldItems, applyHeldItems } from "#app/items/all-held-items";
import { HELD_ITEM_EFFECT } from "#app/items/held-item";
import { HeldItemCategoryId, isItemInCategory } from "#enums/held-item-id";

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
    const hasUsableBerry = pokemon.getHeldItems().some(m => {
      return isItemInCategory(m, HeldItemCategoryId.BERRY) && allHeldItems[m].shouldApply(pokemon);
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

    applyHeldItems(HELD_ITEM_EFFECT.BERRY, { pokemon: pokemon });
    globalScene.updateItems(pokemon.isPlayer());

    // AbilityId.CHEEK_POUCH only works once per round of nom noms
    applyAbAttrs("HealFromBerryUseAbAttr", { pokemon });
  }
}
