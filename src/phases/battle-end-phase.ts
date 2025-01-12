import BattleScene from "#app/battle-scene";
import { applyPostBattleAbAttrs, PostBattleAbAttr } from "#app/data/ability";
import { LapsingPersistentModifier, LapsingPokemonHeldItemModifier, PokemonHeldItemModifier } from "#app/modifier/modifier";
import { BattlePhase } from "./battle-phase";
import { GameOverPhase } from "./game-over-phase";

export class BattleEndPhase extends BattlePhase {
  /** If true, will increment battles won */
  isVictory: boolean;

  constructor(scene: BattleScene, isVictory: boolean) {
    super(scene);

    this.isVictory = isVictory;
  }

  start() {
    super.start();

    this.scene.gameData.gameStats.battles++;
    if (this.scene.gameMode.isEndless && this.scene.currentBattle.waveIndex + 1 > this.scene.gameData.gameStats.highestEndlessWave) {
      this.scene.gameData.gameStats.highestEndlessWave = this.scene.currentBattle.waveIndex + 1;
    }

    if (this.isVictory) {
      this.scene.currentBattle.addBattleScore(this.scene);

      if (this.scene.currentBattle.trainer) {
        this.scene.gameData.gameStats.trainersDefeated++;
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

    for (const pokemon of this.scene.getPokemonAllowedInBattle()) {
      applyPostBattleAbAttrs(PostBattleAbAttr, pokemon, false, this.isVictory);
    }

    if (this.scene.currentBattle.moneyScattered) {
      this.scene.currentBattle.pickUpScatteredMoney(this.scene);
    }

    this.scene.clearEnemyHeldItemModifiers();

    const lapsingModifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier && m.isNullified || m instanceof LapsingPersistentModifier || m instanceof LapsingPokemonHeldItemModifier) as (PokemonHeldItemModifier | LapsingPersistentModifier | LapsingPokemonHeldItemModifier)[];
    for (const m of lapsingModifiers) {
      const args: any[] = [];
      if (m instanceof LapsingPokemonHeldItemModifier) {
        args.push(this.scene.getPokemonById(m.pokemonId));
      }
      if (!m.lapse(...args)) {
        if (!(m instanceof PokemonHeldItemModifier)) {
          this.scene.removeModifier(m);
        }
      }
    }

    this.scene.updateModifiers().then(() => this.end());
  }
}
