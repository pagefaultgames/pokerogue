import { gScene } from "#app/battle-scene";
import { applyPostBattleAbAttrs, PostBattleAbAttr } from "#app/data/ability";
import { LapsingPersistentModifier, LapsingPokemonHeldItemModifier } from "#app/modifier/modifier";
import { BattlePhase } from "./battle-phase";
import { GameOverPhase } from "./game-over-phase";

export class BattleEndPhase extends BattlePhase {
  /** If true, will increment battles won */
  isVictory: boolean;

  constructor(isVictory: boolean = true) {
    super();

    this.isVictory = isVictory;
  }

  start() {
    super.start();

    if (this.isVictory) {
      gScene.currentBattle.addBattleScore();

      gScene.gameData.gameStats.battles++;
      if (gScene.currentBattle.trainer) {
        gScene.gameData.gameStats.trainersDefeated++;
      }
      if (gScene.gameMode.isEndless && gScene.currentBattle.waveIndex + 1 > gScene.gameData.gameStats.highestEndlessWave) {
        gScene.gameData.gameStats.highestEndlessWave = gScene.currentBattle.waveIndex + 1;
      }
    }

    // Endless graceful end
    if (gScene.gameMode.isEndless && gScene.currentBattle.waveIndex >= 5850) {
      gScene.clearPhaseQueue();
      gScene.unshiftPhase(new GameOverPhase(true));
    }

    for (const pokemon of gScene.getField()) {
      if (pokemon && pokemon.battleSummonData) {
        pokemon.battleSummonData.waveTurnCount = 1;
      }
    }

    for (const pokemon of gScene.getParty().filter(p => p.isAllowedInBattle())) {
      applyPostBattleAbAttrs(PostBattleAbAttr, pokemon);
    }

    if (gScene.currentBattle.moneyScattered) {
      gScene.currentBattle.pickUpScatteredMoney();
    }

    gScene.clearEnemyHeldItemModifiers();

    const lapsingModifiers = gScene.findModifiers(m => m instanceof LapsingPersistentModifier || m instanceof LapsingPokemonHeldItemModifier) as (LapsingPersistentModifier | LapsingPokemonHeldItemModifier)[];
    for (const m of lapsingModifiers) {
      const args: any[] = [];
      if (m instanceof LapsingPokemonHeldItemModifier) {
        args.push(gScene.getPokemonById(m.pokemonId));
      }
      if (!m.lapse(...args)) {
        gScene.removeModifier(m);
      }
    }

    gScene.updateModifiers().then(() => this.end());
  }
}
