import { globalScene } from "#app/global-scene";
import { applyPostBattleAbAttrs, PostBattleAbAttr } from "#app/data/abilities/ability";
import { LapsingPersistentModifier, LapsingPokemonHeldItemModifier } from "#app/modifier/modifier";
import { BattlePhase } from "./battle-phase";
import { GameOverPhase } from "./game-over-phase";

export class BattleEndPhase extends BattlePhase {
  /** If true, will increment battles won */
  isVictory: boolean;

  constructor(isVictory: boolean) {
    super();

    this.isVictory = isVictory;
  }

  start() {
    super.start();

    // cull any extra `BattleEnd` phases from the queue.
    globalScene.phaseQueue = globalScene.phaseQueue.filter(phase => {
      if (phase instanceof BattleEndPhase) {
        this.isVictory ||= phase.isVictory;
        return false;
      }
      return true;
    });
    // `phaseQueuePrepend` is private, so we have to use this inefficient loop.
    while (
      globalScene.tryRemoveUnshiftedPhase(phase => {
        if (phase instanceof BattleEndPhase) {
          this.isVictory ||= phase.isVictory;
          return true;
        }
        return false;
      })
    ) {}

    globalScene.gameData.gameStats.battles++;
    if (
      globalScene.gameMode.isEndless &&
      globalScene.currentBattle.waveIndex + 1 > globalScene.gameData.gameStats.highestEndlessWave
    ) {
      globalScene.gameData.gameStats.highestEndlessWave = globalScene.currentBattle.waveIndex + 1;
    }

    if (this.isVictory) {
      globalScene.currentBattle.addBattleScore();

      if (globalScene.currentBattle.trainer) {
        globalScene.gameData.gameStats.trainersDefeated++;
      }
    }

    // Endless graceful end
    if (globalScene.gameMode.isEndless && globalScene.currentBattle.waveIndex >= 5850) {
      globalScene.clearPhaseQueue();
      globalScene.unshiftPhase(new GameOverPhase(true));
    }

    for (const pokemon of globalScene.getField()) {
      if (pokemon?.battleSummonData) {
        pokemon.battleSummonData.waveTurnCount = 1;
      }
    }

    for (const pokemon of globalScene.getPokemonAllowedInBattle()) {
      applyPostBattleAbAttrs(PostBattleAbAttr, pokemon, false, this.isVictory);
    }

    if (globalScene.currentBattle.moneyScattered) {
      globalScene.currentBattle.pickUpScatteredMoney();
    }

    globalScene.clearEnemyHeldItemModifiers();
    for (const p of globalScene.getEnemyParty()) {
      try {
        p.destroy();
      } catch {
        console.warn("Unable to destroy stale pokemon object in BattleEndPhase:", p);
      }
    }

    const lapsingModifiers = globalScene.findModifiers(
      m => m instanceof LapsingPersistentModifier || m instanceof LapsingPokemonHeldItemModifier,
    ) as (LapsingPersistentModifier | LapsingPokemonHeldItemModifier)[];
    for (const m of lapsingModifiers) {
      const args: any[] = [];
      if (m instanceof LapsingPokemonHeldItemModifier) {
        args.push(globalScene.getPokemonById(m.pokemonId));
      }
      if (!m.lapse(...args)) {
        globalScene.removeModifier(m);
      }
    }

    globalScene.updateModifiers();
    this.end();
  }
}
