import { globalScene } from "#app/global-scene";
import { initMoveAnim, loadMoveAnimAssets, MoveAnim } from "#app/data/battle-anims";
import { allMoves, SelfStatusMove } from "#app/data/moves/move";
import { Moves } from "#app/enums/moves";
import * as Utils from "#app/utils";
import { BattlePhase } from "./battle-phase";

export class MoveAnimTestPhase extends BattlePhase {
  private moveQueue: Moves[];

  constructor(moveQueue?: Moves[]) {
    super();

    this.moveQueue = moveQueue || Utils.getEnumValues(Moves).slice(1);
  }

  start() {
    const moveQueue = this.moveQueue.slice(0);
    this.playMoveAnim(moveQueue, true);
  }

  playMoveAnim(moveQueue: Moves[], player: boolean) {
    const moveId = player ? moveQueue[0] : moveQueue.shift();
    if (moveId === undefined) {
      this.playMoveAnim(this.moveQueue.slice(0), true);
      return;
    }
    if (player) {
      console.log(Moves[moveId]);
    }

    initMoveAnim(moveId).then(() => {
      loadMoveAnimAssets([moveId], true).then(() => {
        const user = player ? globalScene.getPlayerPokemon()! : globalScene.getEnemyPokemon()!;
        const target =
          player !== allMoves[moveId] instanceof SelfStatusMove
            ? globalScene.getEnemyPokemon()!
            : globalScene.getPlayerPokemon()!;
        new MoveAnim(moveId, user, target.getBattlerIndex()).play(allMoves[moveId].hitsSubstitute(user, target), () => {
          // TODO: are the bangs correct here?
          if (player) {
            this.playMoveAnim(moveQueue, false);
          } else {
            this.playMoveAnim(moveQueue, true);
          }
        });
      });
    });
  }
}
