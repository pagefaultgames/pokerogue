import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";

/**
 * Phase to handle actions on a new encounter that must take place after other setup
 * (i.e. queue {@linkcode PostSummonPhase}s)
 */
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
