import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import type { TurnEndPhase } from "#phases/turn-end-phase";

export class CheckBiomeEndPhase extends Phase {
  public override readonly phaseName = "CheckBiomeEndPhase";

  public override start(): void {
    super.start();
    const { phaseManager } = globalScene;
    const { waveIndex } = globalScene.currentBattle;

    if (waveIndex % 10 === 0 && globalScene.getEnemyParty().every(p => p.isFainted())) {
      const phasesToRemove = ["WeatherEffectPhase", "BerryPhase", "CheckStatusEffectPhase"];
      while (phaseManager.tryRemovePhase(p => phasesToRemove.includes(p.phaseName))) {
        // do nothing, this loop just exists to remove all the relevant phases from the queue
      }

      const turnEndPhase = phaseManager.findPhase<TurnEndPhase>(p => p.phaseName === "TurnEndPhase");
      if (turnEndPhase) {
        turnEndPhase.endOfBiome = true;
      }
    }

    this.end();
  }
}
