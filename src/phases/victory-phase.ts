import { BattlerIndex, BattleType, ClassicFixedBossWaves } from "#app/battle";
import BattleScene from "#app/battle-scene";
import { applyChallenges, ChallengeType } from "#app/data/challenge";
import { handleMysteryEncounterVictory } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { CustomModifierSettings, modifierTypes } from "#app/modifier/modifier-type";
import { AddEnemyBuffModifierPhase } from "#app/phases/add-enemy-buff-modifier-phase";
import { BattleEndPhase } from "#app/phases/battle-end-phase";
import { EggLapsePhase } from "#app/phases/egg-lapse-phase";
import { GameOverPhase } from "#app/phases/game-over-phase";
import { ModifierRewardPhase } from "#app/phases/modifier-reward-phase";
import { NewBattlePhase } from "#app/phases/new-battle-phase";
import { PokemonPhase } from "#app/phases/pokemon-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { TrainerVictoryPhase } from "#app/phases/trainer-victory-phase";
import { BooleanHolder } from "#app/utils";

export class VictoryPhase extends PokemonPhase {
  /** If true, indicates that the phase is intended for EXP purposes only, and not to continue a battle to next phase */
  isExpOnly: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex | integer, isExpOnly: boolean = false) {
    super(scene, battlerIndex);

    this.isExpOnly = isExpOnly;
  }

  start() {
    super.start();

    const isMysteryEncounter = this.scene.currentBattle.isBattleMysteryEncounter();

    // update Pokemon defeated count except for MEs that disable it
    if (!isMysteryEncounter || !this.scene.currentBattle.mysteryEncounter?.preventGameStatsUpdates) {
      this.scene.gameData.gameStats.pokemonDefeated++;
    }

    const expValue = this.getPokemon().getExpValue();
    this.scene.applyPartyExp(expValue, true);

    if (isMysteryEncounter) {
      handleMysteryEncounterVictory(this.scene, false, this.isExpOnly);
      return this.end();
    }

    const isHealPhaseActive = new BooleanHolder(true);
    applyChallenges(this.scene.gameMode, ChallengeType.NO_HEAL_PHASE, isHealPhaseActive);

    if (!this.scene.getEnemyParty().find(p => this.scene.currentBattle.battleType === BattleType.WILD ? p.isOnField() : !p?.isFainted(true))) {
      this.scene.pushPhase(new BattleEndPhase(this.scene));
      if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
        this.scene.pushPhase(new TrainerVictoryPhase(this.scene));
      }
      if (this.scene.gameMode.isEndless || !this.scene.gameMode.isWaveFinal(this.scene.currentBattle.waveIndex)) {
        this.scene.pushPhase(new EggLapsePhase(this.scene));
        if (this.scene.gameMode.isClassic && this.scene.currentBattle.waveIndex === ClassicFixedBossWaves.EVIL_BOSS_2) {
          // Should get Lock Capsule on 165 before shop phase so it can be used in the rewards shop
          this.scene.pushPhase(new ModifierRewardPhase(this.scene, modifierTypes.LOCK_CAPSULE));
        }
        if (this.scene.currentBattle.waveIndex % 10 || (this.scene.currentBattle.waveIndex === 0 && !isHealPhaseActive.value)) {
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
   * will pass those settings to the upcoming {@linkcode SelectModifierPhase}`.
   */
  getFixedBattleCustomModifiers(): CustomModifierSettings | undefined {
    const gameMode = this.scene.gameMode;
    const waveIndex = this.scene.currentBattle.waveIndex;
    if (gameMode.isFixedBattle(waveIndex)) {
      return gameMode.getFixedBattle(waveIndex).customModifierRewardSettings;
    }

    return undefined;
  }
}
