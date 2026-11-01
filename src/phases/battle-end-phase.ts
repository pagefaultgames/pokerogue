import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { BattlePhase } from "#phases/battle-phase";

export class BattleEndPhase extends BattlePhase {
  public readonly phaseName = "BattleEndPhase";

  /** Whether the player is considered to have won the battle. */
  public isVictory: boolean;

  constructor(isVictory: boolean) {
    super();

    this.isVictory = isVictory;
  }

  public override start(): void {
    super.start();

    const { currentBattle, gameData, gameMode, phaseManager } = globalScene;
    const { enemyFaints, successfulRun, trainer, waveIndex } = currentBattle;
    const { gameStats } = gameData;
    const { isEndless } = gameMode;

    // cull any extra `BattleEnd` phases from the queue.
    this.isVictory ||= phaseManager.hasPhaseOfType("BattleEndPhase", (phase: BattleEndPhase) => phase.isVictory);
    phaseManager.removeAllPhasesOfType("BattleEndPhase");

    gameStats.battles++;
    if (isEndless && waveIndex + 1 > gameStats.highestEndlessWave) {
      gameStats.highestEndlessWave = waveIndex + 1;
    }

    if (this.isVictory) {
      currentBattle.addBattleScore();

      if (trainer) {
        gameStats.trainersDefeated++;
      }
    }

    // Endless graceful end
    if (isEndless && waveIndex >= 5850) {
      phaseManager.clearPhaseQueue();
      phaseManager.unshiftNew("GameOverPhase", true);
    }

    /*
    Required for Pickup to function correctly due to `BattleScene#canTransferHeldItemModifier`,
    because that method returns `false` if all of the following is true:
    - the last item in a stack would be taken
    - the item has a pokemon source
    - the item no longer exists in the list of items attached to `BattleScene`

    By setting the `pokemonId` field to `-1`, the id won't resolve to a pokemon,
    making the item no longer have a pokemon source, allowing `canTransferHeldItemModifier` to return `true`.
    */
    // TODO: this probably isn't relevant post-item rework, double check after merging
    for (const item of currentBattle.postBattleLoot) {
      item.pokemonId = -1;
    }

    for (const pokemon of globalScene.getPokemonAllowedInBattle()) {
      applyAbAttrs("PostBattleAbAttr", { pokemon, victory: this.isVictory });
    }

    if (currentBattle.moneyScattered) {
      currentBattle.pickUpScatteredMoney();
    }

    for (const p of globalScene.getEnemyParty()) {
      try {
        p.destroy();
      } catch {
        console.warn("Unable to destroy stale pokemon object in BattleEndPhase:", p);
      }
    }

    globalScene.trainerItems.decreaseDurations();

    globalScene.updateItemBar();
    if (!this.isVictory && !phaseManager.hasPhaseOfType("SelectRewardPhase") && !successfulRun) {
      if (enemyFaints > 0) {
        phaseManager.unshiftNew("SelectRewardPhase");
      } else {
        phaseManager.unshiftNew("SelectRewardPhase", 0, undefined, { fillRemaining: false, rerollMultiplier: -1 });
      }
    }

    this.end();
  }
}
