import BattleScene from "#app/battle-scene.js";
import { BattlerIndex } from "#app/battle.js";
import { CommonBattleAnim, CommonAnim } from "#app/data/battle-anims.js";
import { getStatusEffectObtainText, getStatusEffectOverlapText } from "#app/data/status-effect.js";
import { StatusEffect } from "#app/enums/status-effect.js";
import Pokemon from "#app/field/pokemon.js";
import { getPokemonNameWithAffix } from "#app/messages.js";
import { PokemonPhase } from "./pokemon-phase";
import { PostTurnStatusEffectPhase } from "./post-turn-status-effect-phase";

export class ObtainStatusEffectPhase extends PokemonPhase {
  private statusEffect: StatusEffect | undefined;
  private cureTurn: integer | null;
  private sourceText: string | null;
  private sourcePokemon: Pokemon | null;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, statusEffect?: StatusEffect, cureTurn?: integer | null, sourceText?: string, sourcePokemon?: Pokemon) {
    super(scene, battlerIndex);

    this.statusEffect = statusEffect;
    this.cureTurn = cureTurn!; // TODO: is this bang correct?
    this.sourceText = sourceText!; // TODO: is this bang correct?
    this.sourcePokemon = sourcePokemon!; // For tracking which Pokemon caused the status effect // TODO: is this bang correct?
  }

  start() {
    const pokemon = this.getPokemon();
    if (!pokemon?.status) {
      if (pokemon?.trySetStatus(this.statusEffect, false, this.sourcePokemon)) {
        if (this.cureTurn) {
            pokemon.status!.cureTurn = this.cureTurn; // TODO: is this bang correct?
        }
        pokemon.updateInfo(true);
        new CommonBattleAnim(CommonAnim.POISON + (this.statusEffect! - 1), pokemon).play(this.scene, () => {
          this.scene.queueMessage(getStatusEffectObtainText(this.statusEffect, getPokemonNameWithAffix(pokemon), this.sourceText ?? undefined));
          if (pokemon.status?.isPostTurn()) {
            this.scene.pushPhase(new PostTurnStatusEffectPhase(this.scene, this.battlerIndex));
          }
          this.end();
        });
        return;
      }
    } else if (pokemon.status.effect === this.statusEffect) {
      this.scene.queueMessage(getStatusEffectOverlapText(this.statusEffect, getPokemonNameWithAffix(pokemon)));
    }
    this.end();
  }
}
