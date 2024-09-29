import BattleScene from "#app/battle-scene";
import { initMoveAnim, loadMoveAnimAssets, MoveAnim } from "#app/data/battle-anims";
import { allMoves, SelfStatusMove } from "#app/data/move";
import { Moves } from "#app/enums/moves";
import * as Utils from "#app/utils";
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
          const user = player ? this.scene.getPlayerPokemon()! : this.scene.getEnemyPokemon()!;
          const target = (player !== (allMoves[moveId] instanceof SelfStatusMove)) ? this.scene.getEnemyPokemon()! : this.scene.getPlayerPokemon()!;
          new MoveAnim(moveId, user, target.getBattlerIndex()).play(this.scene, allMoves[moveId].hitsSubstitute(user, target), () => { // TODO: are the bangs correct here?
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
