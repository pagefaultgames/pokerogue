import { BattlePhase } from "./battle-phase";
import Pokemon from "#app/field/pokemon";
import { BattlerIndex } from "#app/battle.js";
import * as Utils from "../utils";
import { Stat } from "#app/enums/stat.js";
import { TrickRoomTag } from "#app/data/arena-tag.js";

type PokemonFunc = (pokemon: Pokemon) => void;

export abstract class FieldPhase extends BattlePhase {
  getOrder(): BattlerIndex[] {
    const playerField = this.scene.getPlayerField().filter(p => p.isActive()) as Pokemon[];
    const enemyField = this.scene.getEnemyField().filter(p => p.isActive()) as Pokemon[];

    // We shuffle the list before sorting so speed ties produce random results
    let orderedTargets: Pokemon[] = playerField.concat(enemyField);
    // We seed it with the current turn to prevent an inconsistency where it
    // was varying based on how long since you last reloaded
    this.scene.executeWithSeedOffset(() => {
      orderedTargets = Utils.randSeedShuffle(orderedTargets);
    }, this.scene.currentBattle.turn, this.scene.waveSeed);

    orderedTargets.sort((a: Pokemon, b: Pokemon) => {
      const aSpeed = a?.getBattleStat(Stat.SPD) || 0;
      const bSpeed = b?.getBattleStat(Stat.SPD) || 0;

      return bSpeed - aSpeed;
    });

    const speedReversed = new Utils.BooleanHolder(false);
    this.scene.arena.applyTags(TrickRoomTag, speedReversed);

    if (speedReversed.value) {
      orderedTargets = orderedTargets.reverse();
    }

    return orderedTargets.map(t => t.getFieldIndex() + (!t.isPlayer() ? BattlerIndex.ENEMY : 0));
  }

  executeForAll(func: PokemonFunc): void {
    const field = this.scene.getField(true).filter(p => p.summonData);
    field.forEach(pokemon => func(pokemon));
  }
}
