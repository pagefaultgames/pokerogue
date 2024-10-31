import { applyAbAttrs, PreventBerryUseAbAttr, HealFromBerryUseAbAttr } from "#app/data/ability";
import { CommonAnim } from "#app/data/battle-anims";
import { BerryUsedEvent } from "#app/events/battle-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { BerryModifier } from "#app/modifier/modifier";
import i18next from "i18next";
import * as Utils from "#app/utils";
import { FieldPhase } from "./field-phase";
import { CommonAnimPhase } from "./common-anim-phase";
import { gScene } from "#app/battle-scene";

/** The phase after attacks where the pokemon eat berries */
export class BerryPhase extends FieldPhase {
  start() {
    super.start();

    this.executeForAll((pokemon) => {
      const hasUsableBerry = !!gScene.findModifier((m) => {
        return m instanceof BerryModifier && m.shouldApply(pokemon);
      }, pokemon.isPlayer());

      if (hasUsableBerry) {
        const cancelled = new Utils.BooleanHolder(false);
        pokemon.getOpponents().map((opp) => applyAbAttrs(PreventBerryUseAbAttr, opp, cancelled));

        if (cancelled.value) {
          gScene.queueMessage(i18next.t("abilityTriggers:preventBerryUse", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }));
        } else {
          gScene.unshiftPhase(
            new CommonAnimPhase(pokemon.getBattlerIndex(), pokemon.getBattlerIndex(), CommonAnim.USE_ITEM)
          );

          for (const berryModifier of gScene.applyModifiers(BerryModifier, pokemon.isPlayer(), pokemon)) {
            if (berryModifier.consumed) {
              if (!--berryModifier.stackCount) {
                gScene.removeModifier(berryModifier);
              } else {
                berryModifier.consumed = false;
              }
            }
            gScene.eventTarget.dispatchEvent(new BerryUsedEvent(berryModifier)); // Announce a berry was used
          }

          gScene.updateModifiers(pokemon.isPlayer());

          applyAbAttrs(HealFromBerryUseAbAttr, pokemon, new Utils.BooleanHolder(false));
        }
      }
    });

    this.end();
  }
}
