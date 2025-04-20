import { applyAbAttrs, PreventBerryUseAbAttr, HealFromBerryUseAbAttr } from "#app/data/abilities/ability";
import { CommonAnim } from "#app/data/battle-anims";
import { BerryUsedEvent } from "#app/events/battle-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { BerryModifier } from "#app/modifier/modifier";
import i18next from "i18next";
import { BooleanHolder } from "#app/utils/common";
import { FieldPhase } from "./field-phase";
import { CommonAnimPhase } from "./common-anim-phase";
import { globalScene } from "#app/global-scene";

/** The phase after attacks where the pokemon eat berries */
export class BerryPhase extends FieldPhase {
  start() {
    super.start();

    this.executeForAll(pokemon => {
      const hasUsableBerry = !!globalScene.findModifier(m => {
        return m instanceof BerryModifier && m.shouldApply(pokemon);
      }, pokemon.isPlayer());

      if (hasUsableBerry) {
        const cancelled = new BooleanHolder(false);
        pokemon.getOpponents().map(opp => applyAbAttrs(PreventBerryUseAbAttr, opp, cancelled));

        if (cancelled.value) {
          globalScene.queueMessage(
            i18next.t("abilityTriggers:preventBerryUse", {
              pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
            }),
          );
        } else {
          globalScene.unshiftPhase(
            new CommonAnimPhase(pokemon.getBattlerIndex(), pokemon.getBattlerIndex(), CommonAnim.USE_ITEM),
          );

          for (const berryModifier of globalScene.applyModifiers(BerryModifier, pokemon.isPlayer(), pokemon)) {
            if (berryModifier.consumed) {
              berryModifier.consumed = false;
              pokemon.loseHeldItem(berryModifier);
            }
            globalScene.eventTarget.dispatchEvent(new BerryUsedEvent(berryModifier)); // Announce a berry was used
          }

          globalScene.updateModifiers(pokemon.isPlayer());

          applyAbAttrs(HealFromBerryUseAbAttr, pokemon, new BooleanHolder(false));
        }
      }
    });

    this.end();
  }
}
