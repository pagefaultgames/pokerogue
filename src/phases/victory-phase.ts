import type { BattlerIndex } from "#app/battle";
import { ClassicFixedBossWaves } from "#enums/fixed-boss-waves";
import { BattleType } from "#enums/battle-type";
import type { CustomModifierSettings } from "#app/modifier/modifier-type";
import { modifierTypes } from "#app/modifier/modifier-type";
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
import { globalScene } from "#app/global-scene";
import { timedEventManager } from "#app/global-event-manager";
import { SelectBiomePhase } from "./select-biome-phase";

export class VictoryPhase extends PokemonPhase {
  /** If true, indicates that the phase is intended for EXP purposes only, and not to continue a battle to next phase */
  isExpOnly: boolean;

  constructor(battlerIndex: BattlerIndex | number, isExpOnly = false) {
    super(battlerIndex);

    this.isExpOnly = isExpOnly;
  }

  start() {
    super.start();

    const isMysteryEncounter = globalScene.currentBattle.isBattleMysteryEncounter();

    // update Pokemon defeated count except for MEs that disable it
    if (!isMysteryEncounter || !globalScene.currentBattle.mysteryEncounter?.preventGameStatsUpdates) {
      globalScene.gameData.gameStats.pokemonDefeated++;
    }

    const expValue = this.getPokemon().getExpValue();
    globalScene.applyPartyExp(expValue, true);

    if (isMysteryEncounter) {
      handleMysteryEncounterVictory(false, this.isExpOnly);
      return this.end();
    }

    if (
      !globalScene
        .getEnemyParty()
        .find(p => (globalScene.currentBattle.battleType === BattleType.WILD ? p.isOnField() : !p?.isFainted(true)))
    ) {
      globalScene.pushPhase(new BattleEndPhase(true));
      if (globalScene.currentBattle.battleType === BattleType.TRAINER) {
        globalScene.pushPhase(new TrainerVictoryPhase());
      }
      if (globalScene.gameMode.isEndless || !globalScene.gameMode.isWaveFinal(globalScene.currentBattle.waveIndex)) {
        globalScene.pushPhase(new EggLapsePhase());
        if (globalScene.gameMode.isClassic) {
          switch (globalScene.currentBattle.waveIndex) {
            case ClassicFixedBossWaves.RIVAL_1:
            case ClassicFixedBossWaves.RIVAL_2:
              // Get event modifiers for this wave
              timedEventManager
                .getFixedBattleEventRewards(globalScene.currentBattle.waveIndex)
                .map(r => globalScene.pushPhase(new ModifierRewardPhase(modifierTypes[r])));
              break;
            case ClassicFixedBossWaves.EVIL_BOSS_2:
              // Should get Lock Capsule on 165 before shop phase so it can be used in the rewards shop
              globalScene.pushPhase(new ModifierRewardPhase(modifierTypes.LOCK_CAPSULE));
              break;
          }
        }
        if (globalScene.currentBattle.waveIndex % 10) {
          globalScene.pushPhase(new SelectModifierPhase(undefined, undefined, this.getFixedBattleCustomModifiers()));
        } else if (globalScene.gameMode.isDaily) {
          globalScene.pushPhase(new ModifierRewardPhase(modifierTypes.EXP_CHARM));
          if (
            globalScene.currentBattle.waveIndex > 10 &&
            !globalScene.gameMode.isWaveFinal(globalScene.currentBattle.waveIndex)
          ) {
            globalScene.pushPhase(new ModifierRewardPhase(modifierTypes.GOLDEN_POKEBALL));
          }
        } else {
          const superExpWave = !globalScene.gameMode.isEndless ? (globalScene.offsetGym ? 0 : 20) : 10;
          if (globalScene.gameMode.isEndless && globalScene.currentBattle.waveIndex === 10) {
            globalScene.pushPhase(new ModifierRewardPhase(modifierTypes.EXP_SHARE));
          }
          if (
            globalScene.currentBattle.waveIndex <= 750 &&
            (globalScene.currentBattle.waveIndex <= 500 || globalScene.currentBattle.waveIndex % 30 === superExpWave)
          ) {
            globalScene.pushPhase(
              new ModifierRewardPhase(
                globalScene.currentBattle.waveIndex % 30 !== superExpWave || globalScene.currentBattle.waveIndex > 250
                  ? modifierTypes.EXP_CHARM
                  : modifierTypes.SUPER_EXP_CHARM,
              ),
            );
          }
          if (globalScene.currentBattle.waveIndex <= 150 && !(globalScene.currentBattle.waveIndex % 50)) {
            globalScene.pushPhase(new ModifierRewardPhase(modifierTypes.GOLDEN_POKEBALL));
          }
          if (globalScene.gameMode.isEndless && !(globalScene.currentBattle.waveIndex % 50)) {
            globalScene.pushPhase(
              new ModifierRewardPhase(
                !(globalScene.currentBattle.waveIndex % 250)
                  ? modifierTypes.VOUCHER_PREMIUM
                  : modifierTypes.VOUCHER_PLUS,
              ),
            );
            globalScene.pushPhase(new AddEnemyBuffModifierPhase());
          }
        }

        if (globalScene.gameMode.hasRandomBiomes || globalScene.isNewBiome()) {
          globalScene.pushPhase(new SelectBiomePhase());
        }

        globalScene.pushPhase(new NewBattlePhase());
      } else {
        globalScene.currentBattle.battleType = BattleType.CLEAR;
        globalScene.score += globalScene.gameMode.getClearScoreBonus();
        globalScene.updateScoreText();
        globalScene.pushPhase(new GameOverPhase(true));
      }
    }

    this.end();
  }

  /**
   * If this wave is a fixed battle with special custom modifier rewards,
   * will pass those settings to the upcoming {@linkcode SelectModifierPhase}`.
   */
  getFixedBattleCustomModifiers(): CustomModifierSettings | undefined {
    const gameMode = globalScene.gameMode;
    const waveIndex = globalScene.currentBattle.waveIndex;
    if (gameMode.isFixedBattle(waveIndex)) {
      return gameMode.getFixedBattle(waveIndex).customModifierRewardSettings;
    }

    return undefined;
  }
}
