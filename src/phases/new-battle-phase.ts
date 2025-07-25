import { globalScene } from "#app/global-scene";
import { BattlePhase } from "#phases/battle-phase";

export class NewBattlePhase extends BattlePhase {
  public readonly phaseName = "NewBattlePhase";
  start() {
    super.start();

    // cull any extra `NewBattle` phases from the queue.
    globalScene.phaseManager.phaseQueue = globalScene.phaseManager.phaseQueue.filter(
      phase => !phase.is("NewBattlePhase"),
    );
    // `phaseQueuePrepend` is private, so we have to use this inefficient loop.
    while (globalScene.phaseManager.tryRemoveUnshiftedPhase(phase => phase.is("NewBattlePhase"))) {}

    globalScene.newBattle();

    this.end();
  }
}
