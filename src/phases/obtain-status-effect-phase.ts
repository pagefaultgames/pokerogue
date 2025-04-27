import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#app/battle";
import { CommonBattleAnim, CommonAnim } from "#app/data/battle-anims";
import { getStatusEffectObtainText } from "#app/data/status-effect";
import { StatusEffect } from "#app/enums/status-effect";
import type Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { PokemonPhase } from "./pokemon-phase";
import { SpeciesFormChangeStatusEffectTrigger } from "#app/data/pokemon-forms";
import { applyPostSetStatusAbAttrs, PostSetStatusAbAttr } from "#app/data/abilities/ability";
import { isNullOrUndefined } from "#app/utils/common";

export class ObtainStatusEffectPhase extends PokemonPhase {
  private statusEffect: StatusEffect;
  private sourceText?: string | null;
  private sourcePokemon?: Pokemon | null;

  constructor(
    battlerIndex: BattlerIndex,
    statusEffect: StatusEffect,
    sourceText?: string | null,
    sourcePokemon?: Pokemon | null,
  ) {
    super(battlerIndex);

    this.statusEffect = statusEffect;
    this.sourceText = sourceText;
    this.sourcePokemon = sourcePokemon;
  }

  start() {
    const pokemon = this.getPokemon();
    if (!pokemon) {
      // no pokemon to set status for
      this.end();
      return;
    }

    const wasSet = pokemon.trySetStatus(this.statusEffect, false, this.sourcePokemon);
    if (!wasSet) {
      this.end();
      return;
    }

    pokemon.updateInfo(true);
    new CommonBattleAnim(CommonAnim.POISON + (this.statusEffect! - 1), pokemon).play(false, () => {
      globalScene.queueMessage(
        getStatusEffectObtainText(this.statusEffect, getPokemonNameWithAffix(pokemon), this.sourceText ?? undefined),
      );
      if (!isNullOrUndefined(this.statusEffect) && this.statusEffect !== StatusEffect.FAINT) {
        globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeStatusEffectTrigger, true);
        // If mold breaker etc was used to set this status, it shouldn't apply to abilities activated afterwards
        globalScene.arena.setIgnoreAbilities(false);
        applyPostSetStatusAbAttrs(PostSetStatusAbAttr, pokemon, this.statusEffect, this.sourcePokemon);
      }
    });

    this.end();
    return;
  }
}
