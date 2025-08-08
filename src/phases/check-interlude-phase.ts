import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";

export class CheckInterludePhase extends Phase {
  public override readonly phaseName = "CheckInterludePhase";

  public override start(): void {
    super.start();
    const { phaseManager } = globalScene;
    const { waveIndex } = globalScene.currentBattle;

    if (waveIndex % 10 === 0 && globalScene.getEnemyParty().every(p => p.isFainted())) {
      phaseManager.onInterlude();
    }

    this.end();
  }
}
