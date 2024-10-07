import { applyPostBattleAbAttrs, PostBattleAbAttr } from "#app/data/ability";
import { LapsingPersistentModifier, LapsingPokemonHeldItemModifier } from "#app/modifier/modifier";
import { BattlePhase } from "./battle-phase";
import { GameOverPhase } from "./game-over-phase";
import BattleScene from "#app/battle-scene";

export class BattleEndPhase extends BattlePhase {
  /** If true, will increment battles won */
  isVictory: boolean;

  constructor(scene: BattleScene, isVictory: boolean = true) {
    super(scene);

    this.isVictory = isVictory;
  }

  start() {
    super.start();

    if (this.isVictory) {
      this.scene.currentBattle.addBattleScore(this.scene);

      this.scene.gameData.gameStats.battles++;
      if (this.scene.currentBattle.trainer) {
        this.scene.gameData.gameStats.trainersDefeated++;
      }
      if (this.scene.gameMode.isEndless && this.scene.currentBattle.waveIndex + 1 > this.scene.gameData.gameStats.highestEndlessWave) {
        this.scene.gameData.gameStats.highestEndlessWave = this.scene.currentBattle.waveIndex + 1;
      }
    }

    // Endless graceful end
    if (this.scene.gameMode.isEndless && this.scene.currentBattle.waveIndex >= 5850) {
      this.scene.clearPhaseQueue();
      this.scene.unshiftPhase(new GameOverPhase(this.scene, true));
    }

    for (const pokemon of this.scene.getField()) {
      if (pokemon && pokemon.battleSummonData) {
        pokemon.battleSummonData.waveTurnCount = 1;
      }
    }

    for (const pokemon of this.scene.getParty().filter(p => p.isAllowedInBattle())) {
      applyPostBattleAbAttrs(PostBattleAbAttr, pokemon);
    }

    if (this.scene.currentBattle.moneyScattered) {
      this.scene.currentBattle.pickUpScatteredMoney(this.scene);
    }

    this.scene.clearEnemyHeldItemModifiers();

    const lapsingModifiers = this.scene.findModifiers(m => m instanceof LapsingPersistentModifier || m instanceof LapsingPokemonHeldItemModifier) as (LapsingPersistentModifier | LapsingPokemonHeldItemModifier)[];
    for (const m of lapsingModifiers) {
      const args: any[] = [];
      if (m instanceof LapsingPokemonHeldItemModifier) {
        args.push(this.scene.getPokemonById(m.pokemonId));
      }
      if (!m.lapse(...args)) {
        this.scene.removeModifier(m);
      }
    }

    this.scene.updateModifiers().then(() => this.end());
  }
}
