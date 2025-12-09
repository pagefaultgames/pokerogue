import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { CommonBattleAnim } from "#data/battle-anims";
import { SpeciesFormChangeStatusEffectTrigger } from "#data/form-change-triggers";
import { getStatusEffectObtainText } from "#data/status-effect";
import type { BattlerIndex } from "#enums/battler-index";
import { CommonAnim } from "#enums/move-anims-common";
import { StatusEffect } from "#enums/status-effect";
import type { Pokemon } from "#field/pokemon";
import { PokemonPhase } from "#phases/pokemon-phase";

export class ObtainStatusEffectPhase extends PokemonPhase {
  public readonly phaseName = "ObtainStatusEffectPhase";

  private readonly statusEffect: StatusEffect;
  private readonly sourcePokemon?: Pokemon;
  private readonly sleepTurnsRemaining?: number;
  private readonly statusMessage: string;

  /**
   * @param battlerIndex - The {@linkcode BattlerIndex} of the Pokemon obtaining the status effect.
   * @param statusEffect - The {@linkcode StatusEffect} being applied.
   * @param sourcePokemon - The {@linkcode Pokemon} applying the status effect to the target,
   * or `null` if the status is applied from a non-Pokemon source (hazards, etc.); default `null`.
   * @param sleepTurnsRemaining - The number of turns to set {@linkcode StatusEffect.SLEEP} for;
   * defaults to a random number between 2 and 4 and is unused for non-Sleep statuses.
   * @param sourceText - The text to show for the source of the status effect, if any; default `null`.
   * @param statusMessage - A string containing text to be displayed upon status setting;
   * defaults to normal key for status if empty or omitted.
   * @todo stop passing `null` to the phase
   */
  constructor(
    battlerIndex: BattlerIndex,
    statusEffect: StatusEffect,
    sourcePokemon?: Pokemon,
    sleepTurnsRemaining?: number,
    sourceText: string | null = null, // TODO: this should be `sourceText?: string`, and then remove `?? undefined` below
    statusMessage?: string,
  ) {
    super(battlerIndex);

    this.statusEffect = statusEffect;
    this.sourcePokemon = sourcePokemon;
    this.sleepTurnsRemaining = sleepTurnsRemaining;
    this.statusMessage =
      statusMessage
      || getStatusEffectObtainText(statusEffect, getPokemonNameWithAffix(this.getPokemon()), sourceText ?? undefined);
  }

  start() {
    const pokemon = this.getPokemon();

    pokemon.doSetStatus(this.statusEffect, this.sleepTurnsRemaining);
    pokemon.updateInfo(true);

    new CommonBattleAnim(CommonAnim.POISON + (this.statusEffect - 1), pokemon).play(false, () => {
      globalScene.phaseManager.queueMessage(this.statusMessage);
      if (this.statusEffect && this.statusEffect !== StatusEffect.FAINT) {
        globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeStatusEffectTrigger, true);
        // If the status was applied from a move, ensure abilities are not ignored for follow-up triggers.
        // TODO: Ensure this isn't breaking any other phases unshifted afterwards
        globalScene.arena.setIgnoreAbilities(false);
        applyAbAttrs("PostSetStatusAbAttr", {
          pokemon,
          effect: this.statusEffect,
          sourcePokemon: this.sourcePokemon,
        });
        if (this.sourcePokemon) {
          applyAbAttrs("ConfusionOnStatusEffectAbAttr", {
            pokemon: this.sourcePokemon,
            opponent: pokemon,
            effect: this.statusEffect,
          });
        }
      }
      this.end();
    });
  }
}
