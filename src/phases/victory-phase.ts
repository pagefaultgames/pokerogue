import BattleScene from "#app/battle-scene";
import { BattlerIndex, BattleType } from "#app/battle";
import { CustomModifierSettings, modifierTypes } from "#app/modifier/modifier-type";
import { BattleEndPhase } from "./battle-end-phase";
import { NewBattlePhase } from "./new-battle-phase";
import { PokemonPhase } from "./pokemon-phase";
import { AddEnemyBuffModifierPhase } from "./add-enemy-buff-modifier-phase";
import { EggLapsePhase } from "./egg-lapse-phase";
import { GameOverPhase } from "./game-over-phase";
import { ModifierRewardPhase } from "./modifier-reward-phase";
import { SelectModifierPhase } from "./select-modifier-phase";
import { TrainerVictoryPhase } from "./trainer-victory-phase";
import { handleMysteryEncounterVictory } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { LockModifierTiersModifier } from "#app/modifier/modifier";

export class VictoryPhase extends PokemonPhase {
  /** If true, indicates that the phase is intended for EXP purposes only, and not to continue a battle to next phase */
  isExpOnly: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex | integer, isExpOnly: boolean = false) {
    super(scene, battlerIndex);

    this.isExpOnly = isExpOnly;
  }

  start() {
    super.start();

    this.scene.gameData.gameStats.pokemonDefeated++;

    const expValue = this.getPokemon().getExpValue();
    this.scene.applyPartyExp(expValue, true);

    if (this.scene.currentBattle.battleType === BattleType.MYSTERY_ENCOUNTER) {
      handleMysteryEncounterVictory(this.scene, false, this.isExpOnly);
      return this.end();
    }

    if (!this.scene.getEnemyParty().find(p => this.scene.currentBattle.battleType === BattleType.WILD ? p.isOnField() : !p?.isFainted(true))) {
      this.scene.pushPhase(new BattleEndPhase(this.scene));
      if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
        this.scene.pushPhase(new TrainerVictoryPhase(this.scene));
      }
      if (this.scene.gameMode.isEndless || !this.scene.gameMode.isWaveFinal(this.scene.currentBattle.waveIndex)) {
        this.scene.pushPhase(new EggLapsePhase(this.scene));
        // If player doesn't have a lock capsule in Classic, they get in rewards on 165
        if (this.scene.gameMode.isClassic && this.scene.currentBattle.waveIndex === 165 && !(this.scene.findModifier(m => m instanceof LockModifierTiersModifier))) {
          // Should happen before shop phase so they can use the lock capsule
          this.scene.pushPhase(new ModifierRewardPhase(this.scene, modifierTypes.LOCK_CAPSULE));
        }
        if (this.scene.currentBattle.waveIndex % 10) {
          this.scene.pushPhase(new SelectModifierPhase(this.scene, undefined, undefined, this.getFixedBattleCustomModifiers()));
        } else if (this.scene.gameMode.isDaily) {
          this.scene.pushPhase(new ModifierRewardPhase(this.scene, modifierTypes.EXP_CHARM));
          if (this.scene.currentBattle.waveIndex > 10 && !this.scene.gameMode.isWaveFinal(this.scene.currentBattle.waveIndex)) {
            this.scene.pushPhase(new ModifierRewardPhase(this.scene, modifierTypes.GOLDEN_POKEBALL));
          }
        } else {
          const superExpWave = !this.scene.gameMode.isEndless ? (this.scene.offsetGym ? 0 : 20) : 10;
          if (this.scene.gameMode.isEndless && this.scene.currentBattle.waveIndex === 10) {
            this.scene.pushPhase(new ModifierRewardPhase(this.scene, modifierTypes.EXP_SHARE));
          }
          if (this.scene.currentBattle.waveIndex <= 750 && (this.scene.currentBattle.waveIndex <= 500 || (this.scene.currentBattle.waveIndex % 30) === superExpWave)) {
            this.scene.pushPhase(new ModifierRewardPhase(this.scene, (this.scene.currentBattle.waveIndex % 30) !== superExpWave || this.scene.currentBattle.waveIndex > 250 ? modifierTypes.EXP_CHARM : modifierTypes.SUPER_EXP_CHARM));
          }
          if (this.scene.currentBattle.waveIndex <= 150 && !(this.scene.currentBattle.waveIndex % 50)) {
            this.scene.pushPhase(new ModifierRewardPhase(this.scene, modifierTypes.GOLDEN_POKEBALL));
          }
          if (this.scene.gameMode.isEndless && !(this.scene.currentBattle.waveIndex % 50)) {
            this.scene.pushPhase(new ModifierRewardPhase(this.scene, !(this.scene.currentBattle.waveIndex % 250) ? modifierTypes.VOUCHER_PREMIUM : modifierTypes.VOUCHER_PLUS));
            this.scene.pushPhase(new AddEnemyBuffModifierPhase(this.scene));
          }
        }
        this.scene.pushPhase(new NewBattlePhase(this.scene));
      } else {
        this.scene.currentBattle.battleType = BattleType.CLEAR;
        this.scene.score += this.scene.gameMode.getClearScoreBonus();
        this.scene.updateScoreText();
        this.scene.pushPhase(new GameOverPhase(this.scene, true));
      }
    }

    this.end();
  }

  /**
   * If this wave is a fixed battle with special custom modifier rewards,
   * will pass those settings to the upcoming `SelectModifierPhase`.
   */
  getFixedBattleCustomModifiers(): CustomModifierSettings | undefined {
    const gameMode = this.scene.gameMode;
    const waveIndex = this.scene.currentBattle.waveIndex;
    if (gameMode.isFixedBattle(waveIndex)) {
      const fixedBattleConfig = gameMode.getFixedBattle(waveIndex);
      return fixedBattleConfig.customModifierRewardSettings;
    }

    return undefined;
  }
}
