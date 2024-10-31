import { BattlerIndex, BattleType, ClassicFixedBossWaves } from "#app/battle";
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
import { gScene } from "#app/battle-scene";

export class VictoryPhase extends PokemonPhase {
  /** If true, indicates that the phase is intended for EXP purposes only, and not to continue a battle to next phase */
  isExpOnly: boolean;

  constructor(battlerIndex: BattlerIndex | integer, isExpOnly: boolean = false) {
    super(battlerIndex);

    this.isExpOnly = isExpOnly;
  }

  start() {
    super.start();

    const isMysteryEncounter = gScene.currentBattle.isBattleMysteryEncounter();

    // update Pokemon defeated count except for MEs that disable it
    if (!isMysteryEncounter || !gScene.currentBattle.mysteryEncounter?.preventGameStatsUpdates) {
      gScene.gameData.gameStats.pokemonDefeated++;
    }

    const expValue = this.getPokemon().getExpValue();
    gScene.applyPartyExp(expValue, true);

    if (isMysteryEncounter) {
      handleMysteryEncounterVictory(false, this.isExpOnly);
      return this.end();
    }

    if (!gScene.getEnemyParty().find(p => gScene.currentBattle.battleType === BattleType.WILD ? p.isOnField() : !p?.isFainted(true))) {
      gScene.pushPhase(new BattleEndPhase());
      if (gScene.currentBattle.battleType === BattleType.TRAINER) {
        gScene.pushPhase(new TrainerVictoryPhase());
      }
      if (gScene.gameMode.isEndless || !gScene.gameMode.isWaveFinal(gScene.currentBattle.waveIndex)) {
        gScene.pushPhase(new EggLapsePhase());
        if (gScene.gameMode.isClassic && gScene.currentBattle.waveIndex === ClassicFixedBossWaves.EVIL_BOSS_2) {
          // Should get Lock Capsule on 165 before shop phase so it can be used in the rewards shop
          gScene.pushPhase(new ModifierRewardPhase(modifierTypes.LOCK_CAPSULE));
        }
        if (gScene.currentBattle.waveIndex % 10) {
          gScene.pushPhase(new SelectModifierPhase(undefined, undefined, this.getFixedBattleCustomModifiers()));
        } else if (gScene.gameMode.isDaily) {
          gScene.pushPhase(new ModifierRewardPhase(modifierTypes.EXP_CHARM));
          if (gScene.currentBattle.waveIndex > 10 && !gScene.gameMode.isWaveFinal(gScene.currentBattle.waveIndex)) {
            gScene.pushPhase(new ModifierRewardPhase(modifierTypes.GOLDEN_POKEBALL));
          }
        } else {
          const superExpWave = !gScene.gameMode.isEndless ? (gScene.offsetGym ? 0 : 20) : 10;
          if (gScene.gameMode.isEndless && gScene.currentBattle.waveIndex === 10) {
            gScene.pushPhase(new ModifierRewardPhase(modifierTypes.EXP_SHARE));
          }
          if (gScene.currentBattle.waveIndex <= 750 && (gScene.currentBattle.waveIndex <= 500 || (gScene.currentBattle.waveIndex % 30) === superExpWave)) {
            gScene.pushPhase(new ModifierRewardPhase((gScene.currentBattle.waveIndex % 30) !== superExpWave || gScene.currentBattle.waveIndex > 250 ? modifierTypes.EXP_CHARM : modifierTypes.SUPER_EXP_CHARM));
          }
          if (gScene.currentBattle.waveIndex <= 150 && !(gScene.currentBattle.waveIndex % 50)) {
            gScene.pushPhase(new ModifierRewardPhase(modifierTypes.GOLDEN_POKEBALL));
          }
          if (gScene.gameMode.isEndless && !(gScene.currentBattle.waveIndex % 50)) {
            gScene.pushPhase(new ModifierRewardPhase(!(gScene.currentBattle.waveIndex % 250) ? modifierTypes.VOUCHER_PREMIUM : modifierTypes.VOUCHER_PLUS));
            gScene.pushPhase(new AddEnemyBuffModifierPhase());
          }
        }
        gScene.pushPhase(new NewBattlePhase());
      } else {
        gScene.currentBattle.battleType = BattleType.CLEAR;
        gScene.score += gScene.gameMode.getClearScoreBonus();
        gScene.updateScoreText();
        gScene.pushPhase(new GameOverPhase(true));
      }
    }

    this.end();
  }

  /**
   * If this wave is a fixed battle with special custom modifier rewards,
   * will pass those settings to the upcoming {@linkcode SelectModifierPhase}`.
   */
  getFixedBattleCustomModifiers(): CustomModifierSettings | undefined {
    const gameMode = gScene.gameMode;
    const waveIndex = gScene.currentBattle.waveIndex;
    if (gameMode.isFixedBattle(waveIndex)) {
      return gameMode.getFixedBattle(waveIndex).customModifierRewardSettings;
    }

    return undefined;
  }
}
