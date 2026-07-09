import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { modifierTypes } from "#data/data-lists";
import { BattleType } from "#enums/battle-type";
import type { BattlerIndex } from "#enums/battler-index";
import { ClassicFixedBossWaves } from "#enums/fixed-boss-waves";
import { ModifierTier } from "#enums/modifier-tier";
import { handleMysteryEncounterVictory } from "#mystery-encounters/encounter-phase-utils";
import { PokemonPhase } from "#phases/pokemon-phase";

export class VictoryPhase extends PokemonPhase {
  public readonly phaseName = "VictoryPhase";

  /** If true, indicates that the phase is intended for EXP purposes only, and not to continue a battle to next phase */
  private readonly isExpOnly: boolean;

  constructor(battlerIndex: BattlerIndex | number, isExpOnly = false) {
    super(battlerIndex);

    this.isExpOnly = isExpOnly;
  }

  public override start(): void {
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
      this.end();
      return;
    }

    // TODO: clean this up a bit - this shouldn't use `.find`; invert conditional and use early return
    if (
      !globalScene
        .getEnemyParty()
        .find(p => (globalScene.currentBattle.battleType === BattleType.WILD ? p.isOnField() : !p?.isFainted()))
      && !globalScene.phaseManager.hasPhaseOfType("TrainerVictoryPhase") // temporary hotfix
    ) {
      globalScene.phaseManager.pushNew("BattleEndPhase", true);
      if (globalScene.currentBattle.battleType === BattleType.TRAINER) {
        globalScene.phaseManager.pushNew("TrainerVictoryPhase");
      }

      const gameMode = globalScene.gameMode;
      const currentWaveIndex = globalScene.currentBattle.waveIndex;

      if (gameMode.isEndless || !gameMode.isWaveFinal(currentWaveIndex)) {
        globalScene.phaseManager.pushNew("EggLapsePhase");
        if (gameMode.isClassic) {
          switch (currentWaveIndex) {
            case ClassicFixedBossWaves.RIVAL_1:
            case ClassicFixedBossWaves.RIVAL_2:
            case ClassicFixedBossWaves.RIVAL_3:
            case ClassicFixedBossWaves.RIVAL_4:
            case ClassicFixedBossWaves.RIVAL_5:
            case ClassicFixedBossWaves.RIVAL_6: {
              // Get event modifiers for this wave
              const fixedRewards = timedEventManager.getFixedBattleEventRewards(currentWaveIndex);

              for (const fixedReward of fixedRewards) {
                let reward = fixedReward;
                const existingItem = globalScene.modifiers.find(m => m.type.id === reward);
                if (existingItem && existingItem.getStackCount() + 1 > existingItem.getMaxStackCount()) {
                  const tier = existingItem.type.getOrInferTier();
                  if (!tier) {
                    console.warn(`Modifier ${reward} is at max stacks but has no tier.`);
                    break;
                  }
                  reward = `${ModifierTier[tier]}_BALL` as keyof typeof modifierTypes;
                }
                globalScene.phaseManager.pushNew("ModifierRewardPhase", modifierTypes[reward]);
              }
              break;
            }
            case ClassicFixedBossWaves.EVIL_BOSS_2:
              // Should get Lock Capsule on 165 before shop phase so it can be used in the rewards shop
              globalScene.phaseManager.pushNew("ModifierRewardPhase", modifierTypes.LOCK_CAPSULE);
              break;
          }
        }
        if (currentWaveIndex % 10) {
          globalScene.phaseManager.pushNew(
            "SelectModifierPhase",
            undefined,
            undefined,
            gameMode.getFixedBattle(currentWaveIndex)?.customModifierRewardSettings,
          );
        } else if (gameMode.isDaily) {
          globalScene.phaseManager.pushNew("ModifierRewardPhase", modifierTypes.EXP_CHARM);
          if (currentWaveIndex > 10 && !gameMode.isWaveFinal(currentWaveIndex)) {
            globalScene.phaseManager.pushNew("ModifierRewardPhase", modifierTypes.GOLDEN_POKEBALL);
          }
        } else {
          const superExpWave = gameMode.isEndless ? 10 : globalScene.offsetGym ? 0 : 20;
          if (gameMode.isEndless && currentWaveIndex === 10) {
            globalScene.phaseManager.pushNew("ModifierRewardPhase", modifierTypes.EXP_SHARE);
          }
          if (gameMode.isClassic && currentWaveIndex === 10) {
            globalScene.phaseManager.pushNew("ModifierRewardPhase", modifierTypes.EXP_CHARM);
          }
          if (currentWaveIndex <= 750 && (currentWaveIndex <= 500 || currentWaveIndex % 30 === superExpWave)) {
            globalScene.phaseManager.pushNew(
              "ModifierRewardPhase",
              currentWaveIndex % 30 !== superExpWave || currentWaveIndex > 250
                ? modifierTypes.EXP_CHARM
                : modifierTypes.SUPER_EXP_CHARM,
            );
          }
          if (currentWaveIndex <= 150 && !(currentWaveIndex % 50)) {
            globalScene.phaseManager.pushNew("ModifierRewardPhase", modifierTypes.GOLDEN_POKEBALL);
          }
          if (gameMode.isEndless && !(currentWaveIndex % 50)) {
            globalScene.phaseManager.pushNew(
              "ModifierRewardPhase",
              currentWaveIndex % 250 ? modifierTypes.VOUCHER_PLUS : modifierTypes.VOUCHER_PREMIUM,
            );
            globalScene.phaseManager.pushNew("AddEnemyBuffModifierPhase");
          }
        }

        if (gameMode.hasRandomBiomes || globalScene.isNewBiome()) {
          globalScene.phaseManager.pushNew("SelectBiomePhase");
        }

        globalScene.phaseManager.pushNew("NewBattlePhase");
      } else {
        globalScene.currentBattle.battleType = BattleType.CLEAR;
        globalScene.score += gameMode.getClearScoreBonus();
        globalScene.updateScoreText();
        globalScene.phaseManager.pushNew("GameOverPhase", true);
      }
    }

    this.end();
  }
}
