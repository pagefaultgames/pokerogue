import { globalScene } from "#app/global-scene";
import { BattlePhase } from "./battle-phase";

export class NewBattlePhase extends BattlePhase {
  start() {
    super.start();

    // cull any extra `NewBattle` phases from the queue.
    globalScene.phaseQueue = globalScene.phaseQueue.filter(phase => !(phase instanceof NewBattlePhase));
    // `phaseQueuePrepend` is private, so we have to use this inefficient loop.
    while (globalScene.tryRemoveUnshiftedPhase(phase => phase instanceof NewBattlePhase)) {}

    globalScene.newBattle();

    this.end();
  }
}
