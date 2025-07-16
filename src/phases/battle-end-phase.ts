import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { applyChallenges } from "#data/apply-challenges";
import { ChallengeType } from "#enums/challenge-type";
import { LapsingPersistentModifier, LapsingPokemonHeldItemModifier } from "#modifiers/modifier";
import { BattlePhase } from "#phases/battle-phase";
import { BooleanHolder } from "#utils/common";

export class BattleEndPhase extends BattlePhase {
  public readonly phaseName = "BattleEndPhase";
  /** If true, will increment battles won */
  isVictory: boolean;

  constructor(isVictory: boolean) {
    super();

    this.isVictory = isVictory;
  }

  start() {
    super.start();

    // cull any extra `BattleEnd` phases from the queue.
    globalScene.phaseManager.phaseQueue = globalScene.phaseManager.phaseQueue.filter(phase => {
      if (phase.is("BattleEndPhase")) {
        this.isVictory ||= phase.isVictory;
        return false;
      }
      return true;
    });
    // `phaseQueuePrepend` is private, so we have to use this inefficient loop.
    while (
      globalScene.phaseManager.tryRemoveUnshiftedPhase(phase => {
        if (phase.is("BattleEndPhase")) {
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
      globalScene.phaseManager.clearPhaseQueue();
      globalScene.phaseManager.unshiftNew("GameOverPhase", true);
    }

    for (const pokemon of globalScene.getField()) {
      if (pokemon) {
        pokemon.tempSummonData.waveTurnCount = 1;
      }
    }

    for (const pokemon of globalScene.getPokemonAllowedInBattle()) {
      applyAbAttrs("PostBattleAbAttr", { pokemon, victory: this.isVictory });
    }
    const canStay = new BooleanHolder(true);
    applyChallenges(ChallengeType.DELETE_POKEMON, canStay);
    if (!canStay.value) {
      const party = globalScene.getPlayerParty().slice();
      for (const pokemon of party) {
        if (pokemon.isFainted()) {
          globalScene.removePokemonFromPlayerParty(pokemon);
        }
      }
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
