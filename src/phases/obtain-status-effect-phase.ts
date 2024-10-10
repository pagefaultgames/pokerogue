import BattleScene from "#app/battle-scene";
import { BattlerIndex } from "#app/battle";
import { CommonBattleAnim, CommonAnim } from "#app/data/battle-anims";
import { getStatusEffectObtainText, getStatusEffectOverlapText } from "#app/data/status-effect";
import { StatusEffect } from "#app/enums/status-effect";
import Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { PokemonPhase } from "./pokemon-phase";
import { PostTurnStatusEffectPhase } from "./post-turn-status-effect-phase";

export class ObtainStatusEffectPhase extends PokemonPhase {

  constructor(
    scene: BattleScene,
    battlerIndex: BattlerIndex,
    private statusEffect?: StatusEffect,
    private turnsRemaining?: number,
    private sourceText?: string | null,
    private sourcePokemon?: Pokemon | null
  ) {
    super(scene, battlerIndex);
  }

  start() {
    const pokemon = this.getPokemon();
    if (pokemon && !pokemon.status) {
      if (pokemon.trySetStatus(this.statusEffect, false, this.sourcePokemon)) {
        if (this.turnsRemaining) {
          pokemon.status!.turnsRemaining = this.turnsRemaining;
        }
        pokemon.updateInfo(true);
        new CommonBattleAnim(CommonAnim.POISON + (this.statusEffect! - 1), pokemon).play(this.scene, false, () => {
          this.scene.queueMessage(getStatusEffectObtainText(this.statusEffect, getPokemonNameWithAffix(pokemon), this.sourceText ?? undefined));
          if (pokemon.status?.isPostTurn()) {
            this.scene.pushPhase(new PostTurnStatusEffectPhase(this.scene, this.battlerIndex));
          }
          this.end();
        });
        return;
      }
    } else if (pokemon.status?.effect === this.statusEffect) {
      this.scene.queueMessage(getStatusEffectOverlapText(this.statusEffect ?? StatusEffect.NONE, getPokemonNameWithAffix(pokemon)));
    }
    this.end();
  }
}
