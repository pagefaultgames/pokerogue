import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#app/battle";
import { CommonBattleAnim, CommonAnim } from "#app/data/battle-anims";
import { getStatusEffectObtainText, getStatusEffectOverlapText } from "#app/data/status-effect";
import { StatusEffect } from "#app/enums/status-effect";
import type Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { PokemonPhase } from "./pokemon-phase";
import { SpeciesFormChangeStatusEffectTrigger } from "#app/data/pokemon-forms";
import { applyPostSetStatusAbAttrs, PostSetStatusAbAttr } from "#app/data/abilities/ability";
import { isNullOrUndefined } from "#app/utils/common";

export class ObtainStatusEffectPhase extends PokemonPhase {
  private statusEffect?: StatusEffect;
  private turnsRemaining?: number;
  private sourceText?: string | null;
  private sourcePokemon?: Pokemon | null;

  constructor(
    battlerIndex: BattlerIndex,
    statusEffect?: StatusEffect,
    turnsRemaining?: number,
    sourceText?: string | null,
    sourcePokemon?: Pokemon | null,
  ) {
    super(battlerIndex);

    this.statusEffect = statusEffect;
    this.turnsRemaining = turnsRemaining;
    this.sourceText = sourceText;
    this.sourcePokemon = sourcePokemon;
  }

  start() {
    const pokemon = this.getPokemon();
    if (pokemon && !pokemon.status) {
      if (pokemon.trySetStatus(this.statusEffect, false, this.sourcePokemon)) {
        if (this.turnsRemaining) {
          pokemon.status!.sleepTurnsRemaining = this.turnsRemaining;
        }
        pokemon.updateInfo(true);
        new CommonBattleAnim(CommonAnim.POISON + (this.statusEffect! - 1), pokemon).play(false, () => {
          globalScene.queueMessage(
            getStatusEffectObtainText(
              this.statusEffect,
              getPokemonNameWithAffix(pokemon),
              this.sourceText ?? undefined,
            ),
          );
          if (!isNullOrUndefined(this.statusEffect) && this.statusEffect !== StatusEffect.FAINT) {
            globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeStatusEffectTrigger, true);
            // If mold breaker etc was used to set this status, it shouldn't apply to abilities activated afterwards
            globalScene.arena.setIgnoreAbilities(false);
            applyPostSetStatusAbAttrs(PostSetStatusAbAttr, pokemon, this.statusEffect, this.sourcePokemon);
          }
          this.end();
        });
        return;
      }
    } else if (pokemon.status?.effect === this.statusEffect) {
      globalScene.queueMessage(
        getStatusEffectOverlapText(this.statusEffect ?? StatusEffect.NONE, getPokemonNameWithAffix(pokemon)),
      );
    }
    this.end();
  }
}
