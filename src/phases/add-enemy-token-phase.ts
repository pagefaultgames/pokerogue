import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { RarityTier } from "#enums/reward-tier";
import { assignEnemyBuffTokenForWave } from "#items/trainer-item-pool";

export class AddEnemyTokenPhase extends Phase {
  public readonly phaseName = "AddEnemyTokenPhase";
  start() {
    super.start();

    const waveIndex = globalScene.currentBattle.waveIndex;
    const tier = !(waveIndex % 1000) ? RarityTier.ULTRA : !(waveIndex % 250) ? RarityTier.GREAT : RarityTier.COMMON;

    const count = Math.ceil(waveIndex / 250);
    for (let i = 0; i < count; i++) {
      assignEnemyBuffTokenForWave(tier);
    }
    globalScene.updateItems(false);
    this.end();
  }
}
