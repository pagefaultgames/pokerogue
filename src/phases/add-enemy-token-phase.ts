import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { RarityTier } from "#enums/reward-tier";
import { assignEnemyBuffTokenForWave } from "#items/trainer-item-pool";

export class AddEnemyTokenPhase extends Phase {
  public readonly phaseName = "AddEnemyTokenPhase";

  public override start(): void {
    super.start();

    const waveIndex = globalScene.currentBattle.waveIndex;
    let tier = RarityTier.ULTRA;
    if (waveIndex % 1000) {
      tier = waveIndex % 250 ? RarityTier.COMMON : RarityTier.GREAT;
    }

    const count = Math.ceil(waveIndex / 250);
    for (let i = 0; i < count; i++) {
      assignEnemyBuffTokenForWave(tier);
    }

    globalScene.updateItems(false);

    this.end();
  }
}
