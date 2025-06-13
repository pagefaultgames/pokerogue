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
import { applyPostSetStatusAbAttrs } from "#app/data/abilities/apply-ab-attrs";
import { isNullOrUndefined } from "#app/utils/common";

/** The phase where pokemon obtain status effects. */
export class ObtainStatusEffectPhase extends PokemonPhase {
  public readonly phaseName = "ObtainStatusEffectPhase";
  private statusEffect: StatusEffect;
  private sleepTurnsRemaining?: number;
  private sourceText?: string | null;
  private sourcePokemon?: Pokemon | null;

  /**
   * Create a new ObtainStatusEffectPhase.
   * @param battlerIndex - The {@linkcode BattlerIndex} of the Pokemon obtaining the status effect.
   * @param statusEffect - The {@linkcode StatusEffect} being applied.
   * @param sleepTurnsRemaining - The number of turns to set {@linkcode StatusEffect.SLEEP} for;
   * defaults to a random number between 2 and 4 and is unused for non-Sleep statuses.
   * @param sourceText
   * @param sourcePokemon
   */
  constructor(
    battlerIndex: BattlerIndex,
    statusEffect: StatusEffect,
    sleepTurnsRemaining?: number,
    sourceText?: string | null,
    sourcePokemon?: Pokemon | null,
  ) {
    super(battlerIndex);

    this.statusEffect = statusEffect;
    this.sleepTurnsRemaining = sleepTurnsRemaining;
    this.sourceText = sourceText;
    this.sourcePokemon = sourcePokemon;
  }

  start() {
    const pokemon = this.getPokemon();

    pokemon.doSetStatus(this.statusEffect, this.sleepTurnsRemaining);
    pokemon.updateInfo(true);

    new CommonBattleAnim(CommonAnim.POISON + (this.statusEffect! - 1), pokemon).play(false, () => {
      globalScene.phaseManager.queueMessage(
        getStatusEffectObtainText(this.statusEffect, getPokemonNameWithAffix(pokemon), this.sourceText ?? undefined),
      );
      if (this.statusEffect && this.statusEffect !== StatusEffect.FAINT) {
        globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeStatusEffectTrigger, true);
        // If the status was applied from a move, ensure abilities are not ignored for follow-up triggers.
        // TODO: Ensure this isn't breaking any other phases unshifted afterwards
        globalScene.arena.setIgnoreAbilities(false);
        applyPostSetStatusAbAttrs("PostSetStatusAbAttr", pokemon, this.statusEffect, this.sourcePokemon);
      }
      this.end();
    });
  }
}
