import BattleScene from "#app/battle-scene.js";
import { BattlerIndex } from "#app/battle.js";
import { applyAbAttrs, BlockNonDirectDamageAbAttr, BlockStatusDamageAbAttr, ReduceBurnDamageAbAttr } from "#app/data/ability.js";
import { CommonBattleAnim, CommonAnim } from "#app/data/battle-anims.js";
import { getStatusEffectActivationText } from "#app/data/status-effect.js";
import { BattleSpec } from "#app/enums/battle-spec.js";
import { StatusEffect } from "#app/enums/status-effect.js";
import { getPokemonNameWithAffix } from "#app/messages.js";
import * as Utils from "#app/utils.js";
import { PokemonPhase } from "./pokemon-phase";

export class PostTurnStatusEffectPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    const pokemon = this.getPokemon();
    if (pokemon?.isActive(true) && pokemon.status && pokemon.status.isPostTurn()) {
      pokemon.status.incrementTurn();
      const cancelled = new Utils.BooleanHolder(false);
      applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);
      applyAbAttrs(BlockStatusDamageAbAttr, pokemon, cancelled);

      if (!cancelled.value) {
        this.scene.queueMessage(getStatusEffectActivationText(pokemon.status.effect, getPokemonNameWithAffix(pokemon)));
        const damage = new Utils.NumberHolder(0);
        switch (pokemon.status.effect) {
        case StatusEffect.POISON:
          damage.value = Math.max(pokemon.getMaxHp() >> 3, 1);
          break;
        case StatusEffect.TOXIC:
          damage.value = Math.max(Math.floor((pokemon.getMaxHp() / 16) * pokemon.status.turnCount), 1);
          break;
        case StatusEffect.BURN:
          damage.value = Math.max(pokemon.getMaxHp() >> 4, 1);
          applyAbAttrs(ReduceBurnDamageAbAttr, pokemon, null, false, damage);
          break;
        }
        if (damage.value) {
          // Set preventEndure flag to avoid pokemon surviving thanks to focus band, sturdy, endure ...
          this.scene.damageNumberHandler.add(this.getPokemon(), pokemon.damage(damage.value, false, true));
          pokemon.updateInfo();
        }
        new CommonBattleAnim(CommonAnim.POISON + (pokemon.status.effect - 1), pokemon).play(this.scene, () => this.end());
      } else {
        this.end();
      }
    } else {
      this.end();
    }
  }

  override end() {
    if (this.scene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
      this.scene.initFinalBossPhaseTwo(this.getPokemon());
    } else {
      super.end();
    }
  }
}
