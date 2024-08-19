import { applyAbAttrs, PreventBerryUseAbAttr, HealFromBerryUseAbAttr } from "#app/data/ability.js";
import { CommonAnim } from "#app/data/battle-anims.js";
import { BerryUsedEvent } from "#app/events/battle-scene.js";
import { getPokemonNameWithAffix } from "#app/messages.js";
import { BerryModifier } from "#app/modifier/modifier.js";
import i18next from "i18next";
import * as Utils from "#app/utils.js";
import { FieldPhase } from "./field-phase";
import { CommonAnimPhase } from "./common-anim-phase";

/** The phase after attacks where the pokemon eat berries */
export class BerryPhase extends FieldPhase {
  start() {
    super.start();

    this.executeForAll((pokemon) => {
      const hasUsableBerry = !!this.scene.findModifier((m) => {
        return m instanceof BerryModifier && m.shouldApply([pokemon]);
      }, pokemon.isPlayer());

      if (hasUsableBerry) {
        const cancelled = new Utils.BooleanHolder(false);
        pokemon.getOpponents().map((opp) => applyAbAttrs(PreventBerryUseAbAttr, opp, cancelled));

        if (cancelled.value) {
          pokemon.scene.queueMessage(i18next.t("abilityTriggers:preventBerryUse", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }));
        } else {
          this.scene.unshiftPhase(
            new CommonAnimPhase(this.scene, pokemon.getBattlerIndex(), pokemon.getBattlerIndex(), CommonAnim.USE_ITEM)
          );

          for (const berryModifier of this.scene.applyModifiers(BerryModifier, pokemon.isPlayer(), pokemon) as BerryModifier[]) {
            if (berryModifier.consumed) {
              if (!--berryModifier.stackCount) {
                this.scene.removeModifier(berryModifier);
              } else {
                berryModifier.consumed = false;
              }
            }
            this.scene.eventTarget.dispatchEvent(new BerryUsedEvent(berryModifier)); // Announce a berry was used
          }

          this.scene.updateModifiers(pokemon.isPlayer());

          applyAbAttrs(HealFromBerryUseAbAttr, pokemon, new Utils.BooleanHolder(false));
        }
      }
    });

    this.end();
  }
}
