import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";

export class InitEncounterPhase extends Phase {
  public override readonly phaseName = "InitEncounterPhase";

  public override start(): void {
    for (const pokemon of globalScene.getField(true)) {
      if (pokemon.isEnemy() || pokemon.turnData.summonedThisTurn) {
        globalScene.phaseManager.unshiftNew("PostSummonPhase", pokemon.getBattlerIndex());
      }
    }

    super.end();
  }
}
