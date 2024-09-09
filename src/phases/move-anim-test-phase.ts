import BattleScene from "#app/battle-scene.js";
import { initMoveAnim, loadMoveAnimAssets, MoveAnim } from "#app/data/battle-anims.js";
import { allMoves, SelfStatusMove } from "#app/data/move.js";
import { Moves } from "#app/enums/moves.js";
import * as Utils from "#app/utils.js";
import { BattlePhase } from "./battle-phase";

export class MoveAnimTestPhase extends BattlePhase {
  private moveQueue: Moves[];

  constructor(scene: BattleScene, moveQueue?: Moves[]) {
    super(scene);

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
    } else if (player) {
      console.log(Moves[moveId]);
    }

    initMoveAnim(this.scene, moveId).then(() => {
      loadMoveAnimAssets(this.scene, [moveId], true)
        .then(() => {
          new MoveAnim(moveId, player ? this.scene.getPlayerPokemon()! : this.scene.getEnemyPokemon()!, (player !== (allMoves[moveId] instanceof SelfStatusMove) ? this.scene.getEnemyPokemon()! : this.scene.getPlayerPokemon()!).getBattlerIndex()).play(this.scene, () => { // TODO: are the bangs correct here?
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
