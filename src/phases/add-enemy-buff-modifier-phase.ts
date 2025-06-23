import { RewardTier } from "#enums/reward-tier";
import { regenerateModifierPoolThresholds } from "#app/modifier/modifier-type";
import { ModifierPoolType } from "#enums/modifier-pool-type";
import { Phase } from "#app/phase";
import { globalScene } from "#app/global-scene";
import { assignEnemyBuffTokenForWave } from "#app/items/trainer-item-pool";

export class AddEnemyBuffModifierPhase extends Phase {
  public readonly phaseName = "AddEnemyBuffModifierPhase";
  start() {
    super.start();

    const waveIndex = globalScene.currentBattle.waveIndex;
    const tier = !(waveIndex % 1000) ? RewardTier.ULTRA : !(waveIndex % 250) ? RewardTier.GREAT : RewardTier.COMMON;

    regenerateModifierPoolThresholds(globalScene.getEnemyParty(), ModifierPoolType.ENEMY_BUFF);

    const count = Math.ceil(waveIndex / 250);
    for (let i = 0; i < count; i++) {
      assignEnemyBuffTokenForWave(tier);
    }
    globalScene.updateItems(false);
    this.end();
  }
}
