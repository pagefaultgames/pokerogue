import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { CommonBattleAnim } from "#data/battle-anims";
import { getStatusEffectActivationText } from "#data/status-effect";
import { BattleSpec } from "#enums/battle-spec";
import type { BattlerIndex } from "#enums/battler-index";
import { HitResult } from "#enums/hit-result";
import { CommonAnim } from "#enums/move-anims-common";
import { StatusEffect } from "#enums/status-effect";
import { PokemonPhase } from "#phases/pokemon-phase";
import { BooleanHolder, NumberHolder, toDmgValue } from "#utils/common";

export class PostTurnStatusEffectPhase extends PokemonPhase {
  public readonly phaseName = "PostTurnStatusEffectPhase";
  // biome-ignore lint/complexity/noUselessConstructor: Not unnecessary as it makes battlerIndex required
  constructor(battlerIndex: BattlerIndex) {
    super(battlerIndex);
  }

  start() {
    const pokemon = this.getPokemon();
    if (
      !pokemon?.isActive(true)
      || pokemon.status == null
      || !pokemon.status.isPostTurn()
      || !pokemon.switchOutStatus
    ) {
      this.end();
      return;
    }

    pokemon.status.incrementTurn();
    const cancelled = new BooleanHolder(false);
    applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, cancelled });
    applyAbAttrs("BlockStatusDamageAbAttr", { pokemon, cancelled });

    if (cancelled.value) {
      this.end();
      return;
    }
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
      pokemon.damageAndUpdate(toDmgValue(damage.value), { result: HitResult.INDIRECT });
    }
    // TODO: this should be handled by some sort of animation manager instead of instantiating a new `CommonBattleAnim` class
    new CommonBattleAnim(CommonAnim.POISON + (pokemon.status.effect - 1), pokemon).play(false, () => this.end());
  }

  override end() {
    if (globalScene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
      globalScene.initFinalBossPhaseTwo(this.getPokemon());
    } else {
      super.end();
    }
  }
}
