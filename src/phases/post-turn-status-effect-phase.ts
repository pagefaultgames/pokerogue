import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { CommonBattleAnim } from "#data/battle-anims";
import { getStatusEffectActivationText } from "#data/status-effect";
import { BattleSpec } from "#enums/battle-spec";
import type { BattlerIndex } from "#enums/battler-index";
import { CommonAnim } from "#enums/move-anims-common";
import { StatusEffect } from "#enums/status-effect";
import { PokemonPhase } from "#phases/pokemon-phase";
import { BooleanHolder, NumberHolder } from "#utils/common";

export class PostTurnStatusEffectPhase extends PokemonPhase {
  public readonly phaseName = "PostTurnStatusEffectPhase";
  // biome-ignore lint/complexity/noUselessConstructor: Not unnecessary as it makes battlerIndex required
  constructor(battlerIndex: BattlerIndex) {
    super(battlerIndex);
  }

  start() {
    const pokemon = this.getPokemon();
    if (pokemon?.isActive(true) && pokemon.status && pokemon.status.isPostTurn() && !pokemon.switchOutStatus) {
      pokemon.status.incrementTurn();
      const cancelled = new BooleanHolder(false);
      applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, cancelled });
      applyAbAttrs("BlockStatusDamageAbAttr", { pokemon, cancelled });

      if (!cancelled.value) {
        globalScene.phaseManager.queueMessage(
          getStatusEffectActivationText(pokemon.status.effect, getPokemonNameWithAffix(pokemon)),
        );
        const damage = new NumberHolder(0);
        switch (pokemon.status.effect) {
          case StatusEffect.POISON:
            damage.value = Math.max(pokemon.getMaxHp() >> 3, 1);
            break;
          case StatusEffect.TOXIC:
            damage.value = Math.max(Math.floor((pokemon.getMaxHp() / 16) * pokemon.status.toxicTurnCount), 1);
            break;
          case StatusEffect.BURN:
            damage.value = Math.max(pokemon.getMaxHp() >> 4, 1);
            applyAbAttrs("ReduceBurnDamageAbAttr", { pokemon, burnDamage: damage });
            break;
        }
        if (damage.value) {
          // Set preventEndure flag to avoid pokemon surviving thanks to focus band, sturdy, endure ...
          globalScene.damageNumberHandler.add(this.getPokemon(), pokemon.damage(damage.value, false, true));
          pokemon.updateInfo();
          applyAbAttrs("PostDamageAbAttr", { pokemon, damage: damage.value });
        }
        new CommonBattleAnim(CommonAnim.POISON + (pokemon.status.effect - 1), pokemon).play(false, () => this.end());
      } else {
        this.end();
      }
    } else {
      this.end();
    }
  }

  override end() {
    if (globalScene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
      globalScene.initFinalBossPhaseTwo(this.getPokemon());
    } else {
      super.end();
    }
  }
}
