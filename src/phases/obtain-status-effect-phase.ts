import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#enums/battler-index";
import { CommonBattleAnim } from "#app/data/battle-anims";
import { CommonAnim } from "#enums/move-anims-common";
import { getStatusEffectObtainText, getStatusEffectOverlapText } from "#app/data/status-effect";
import { StatusEffect } from "#app/enums/status-effect";
import type Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { PokemonPhase } from "./pokemon-phase";
import { SpeciesFormChangeStatusEffectTrigger } from "#app/data/pokemon-forms/form-change-triggers";
import { applyAbAttrs } from "#app/data/abilities/apply-ab-attrs";
import { isNullOrUndefined } from "#app/utils/common";

export class ObtainStatusEffectPhase extends PokemonPhase {
  public readonly phaseName = "ObtainStatusEffectPhase";
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
          globalScene.phaseManager.queueMessage(
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
            applyAbAttrs("PostSetStatusAbAttr", {
              pokemon,
              effect: this.statusEffect,
              sourcePokemon: this.sourcePokemon ?? undefined,
            });
          }
          this.end();
        });
        return;
      }
    } else if (pokemon.status?.effect === this.statusEffect) {
      globalScene.phaseManager.queueMessage(
        getStatusEffectOverlapText(this.statusEffect ?? StatusEffect.NONE, getPokemonNameWithAffix(pokemon)),
      );
    }
    this.end();
  }
}
