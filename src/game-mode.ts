import i18next from "i18next";
import { classicFixedBattles, FixedBattleConfig, FixedBattleConfigs } from "./battle";
import BattleScene from "./battle-scene";
import { allChallenges, applyChallenges, Challenge, ChallengeType, copyChallenge } from "./data/challenge";
import { Biome } from "./data/enums/biome";
import { Species } from "./data/enums/species";
import PokemonSpecies, { allSpecies } from "./data/pokemon-species";
import { Arena } from "./field/arena";
import * as Overrides from "./overrides";
import * as Utils from "./utils";

export enum GameModes {
  CLASSIC,
  ENDLESS,
  SPLICED_ENDLESS,
  DAILY,
  CHALLENGE
}

interface GameModeConfig {
  isClassic?: boolean;
  isEndless?: boolean;
  isDaily?: boolean;
  hasTrainers?: boolean;
  hasNoShop?: boolean;
  hasShortBiomes?: boolean;
  hasRandomBiomes?: boolean;
  hasRandomBosses?: boolean;
  isSplicedOnly?: boolean;
  isChallenge?: boolean;
}

export class GameMode implements GameModeConfig {
  public modeId: GameModes;
  public isClassic: boolean;
  public isEndless: boolean;
  public isDaily: boolean;
  public hasTrainers: boolean;
  public hasNoShop: boolean;
  public hasShortBiomes: boolean;
  public hasRandomBiomes: boolean;
  public hasRandomBosses: boolean;
  public isSplicedOnly: boolean;
  public isChallenge: boolean;
  public challenges: Challenge[];
  public battleConfig: FixedBattleConfigs;

  constructor(modeId: GameModes, config: GameModeConfig, battleConfig?: FixedBattleConfigs) {
    this.modeId = modeId;
    this.challenges = [];
    Object.assign(this, config);
    if (this.isChallenge) {
      this.challenges = allChallenges.map(c => copyChallenge(c));
    }
    this.battleConfig = battleConfig || {};
  }

  /**
   * @returns either:
   * - override from overrides.ts
   * - 20 for Daily Runs
   * - 5 for all other modes
   */
  getStartingLevel(): integer {
    if (Overrides.STARTING_LEVEL_OVERRIDE) {
      return Overrides.STARTING_LEVEL_OVERRIDE;
    }
    switch (this.modeId) {
    case GameModes.DAILY:
      return 20;
    default:
      return 5;
    }
  }

  /**
   * @returns either:
   * - override from overrides.ts
   * - 1000
   */
  getStartingMoney(): integer {
    return Overrides.STARTING_MONEY_OVERRIDE || 1000;
  }

  /**
   * @param scene current BattleScene
   * @returns either:
   * - random biome for Daily mode
   * - override from overrides.ts
   * - Town
   */
  getStartingBiome(scene: BattleScene): Biome {
    switch (this.modeId) {
    case GameModes.DAILY:
      return scene.generateRandomBiome(this.getWaveForDifficulty(1));
    default:
      return Overrides.STARTING_BIOME_OVERRIDE || Biome.TOWN;
    }
  }

  getWaveForDifficulty(waveIndex: integer, ignoreCurveChanges: boolean = false): integer {
    switch (this.modeId) {
    case GameModes.DAILY:
      return waveIndex + 30 + (!ignoreCurveChanges ? Math.floor(waveIndex / 5) : 0);
    default:
      return waveIndex;
    }
  }

  isWaveTrainer(waveIndex: integer, arena: Arena): boolean {
    if (this.isDaily) {
      return waveIndex % 10 === 5 || (!(waveIndex % 10) && waveIndex > 10 && !this.isWaveFinal(waveIndex));
    }
    if ((waveIndex % 30) === (arena.scene.offsetGym ? 0 : 20) && !this.isWaveFinal(waveIndex)) {
      return true;
    } else if (waveIndex % 10 !== 1 && waveIndex % 10) {
      const trainerChance = arena.getTrainerChance();
      let allowTrainerBattle = true;
      if (trainerChance) {
        const waveBase = Math.floor(waveIndex / 10) * 10;
        for (let w = Math.max(waveIndex - 3, waveBase + 2); w <= Math.min(waveIndex + 3, waveBase + 9); w++) {
          if (w === waveIndex) {
            continue;
          }
          if ((w % 30) === (arena.scene.offsetGym ? 0 : 20) || this.isFixedBattle(waveIndex)) {
            allowTrainerBattle = false;
            break;
          } else if (w < waveIndex) {
            arena.scene.executeWithSeedOffset(() => {
              const waveTrainerChance = arena.getTrainerChance();
              if (!Utils.randSeedInt(waveTrainerChance)) {
                allowTrainerBattle = false;
              }
            }, w);
            if (!allowTrainerBattle) {
              break;
            }
          }
        }
      }
      return allowTrainerBattle && trainerChance && !Utils.randSeedInt(trainerChance);
    }
    return false;
  }

  isTrainerBoss(waveIndex: integer, biomeType: Biome, offsetGym: boolean): boolean {
    switch (this.modeId) {
    case GameModes.DAILY:
      return waveIndex > 10 && waveIndex < 50 && !(waveIndex % 10);
    default:
      return (waveIndex % 30) === (offsetGym ? 0 : 20) && (biomeType !== Biome.END || this.isClassic || this.isWaveFinal(waveIndex));
    }
  }

  getOverrideSpecies(waveIndex: integer): PokemonSpecies {
    if (this.isDaily && this.isWaveFinal(waveIndex)) {
      const allFinalBossSpecies = allSpecies.filter(s => (s.subLegendary || s.legendary || s.mythical)
        && s.baseTotal >= 600 && s.speciesId !== Species.ETERNATUS && s.speciesId !== Species.ARCEUS);
      return Utils.randSeedItem(allFinalBossSpecies);
    }

    return null;
  }

  /**
   * Checks if wave provided is the final for current or specified game mode
   * @param waveIndex
   * @param modeId game mode
   * @returns if the current wave is final for classic or daily OR a minor boss in endless
   */
  isWaveFinal(waveIndex: integer, modeId: GameModes = this.modeId): boolean {
    switch (modeId) {
    case GameModes.CLASSIC:
    case GameModes.CHALLENGE:
      return waveIndex === 200;
    case GameModes.ENDLESS:
    case GameModes.SPLICED_ENDLESS:
      return !(waveIndex % 250);
    case GameModes.DAILY:
      return waveIndex === 50;
    }
  }

  /**
     * Every 10 waves is a boss battle
     * @returns true if waveIndex is a multiple of 10
     */
  isBoss(waveIndex: integer): boolean {
    return waveIndex % 10 === 0;
  }

  /**
     * Every 50 waves of an Endless mode is a boss
     * At this time it is paradox pokemon
     * @returns true if waveIndex is a multiple of 50 in Endless
     */
  isEndlessBoss(waveIndex: integer): boolean {
    return waveIndex % 50 &&
        (this.modeId === GameModes.ENDLESS || this.modeId === GameModes.SPLICED_ENDLESS);
  }

  /**
     * Every 250 waves of an Endless mode is a minor boss
     * At this time it is Eternatus
     * @returns true if waveIndex is a multiple of 250 in Endless
     */
  isEndlessMinorBoss(waveIndex: integer): boolean {
    return waveIndex % 250 === 0 &&
        (this.modeId === GameModes.ENDLESS || this.modeId === GameModes.SPLICED_ENDLESS);
  }

  /**
     * Every 1000 waves of an Endless mode is a major boss
     * At this time it is Eternamax Eternatus
     * @returns true if waveIndex is a multiple of 1000 in Endless
     */
  isEndlessMajorBoss(waveIndex: integer): boolean {
    return waveIndex % 1000 === 0 &&
        (this.modeId === GameModes.ENDLESS || this.modeId === GameModes.SPLICED_ENDLESS);
  }

  /**
   * Checks whether there is a fixed battle on this gamemode on a given wave.
   * @param {integer} waveIndex The wave to check.
   * @returns {boolean} If this game mode has a fixed battle on this wave
   */
  isFixedBattle(waveIndex: integer): boolean {
    const dummyConfig = new FixedBattleConfig();
    return this.battleConfig.hasOwnProperty(waveIndex) || applyChallenges(this, ChallengeType.FIXED_BATTLES, waveIndex, dummyConfig);

  }

  /**
   * Returns the config for the fixed battle for a particular wave.
   * @param {integer} waveIndex The wave to check.
   * @returns {boolean} The fixed battle for this wave.
   */
  getFixedBattle(waveIndex: integer): FixedBattleConfig {
    const challengeConfig = new FixedBattleConfig();
    if (applyChallenges(this, ChallengeType.FIXED_BATTLES, waveIndex, challengeConfig)) {
      return challengeConfig;
    } else {
      return this.battleConfig[waveIndex];
    }
  }


  getClearScoreBonus(): integer {
    switch (this.modeId) {
    case GameModes.CLASSIC:
    case GameModes.CHALLENGE:
      return 5000;
    case GameModes.DAILY:
      return 2500;
    }
  }

  getEnemyModifierChance(isBoss: boolean): integer {
    switch (this.modeId) {
    case GameModes.CLASSIC:
    case GameModes.CHALLENGE:
    case GameModes.DAILY:
      return !isBoss ? 18 : 6;
    case GameModes.ENDLESS:
    case GameModes.SPLICED_ENDLESS:
      return !isBoss ? 12 : 4;
    }
  }

  getName(): string {
    switch (this.modeId) {
    case GameModes.CLASSIC:
      return i18next.t("gameMode:classic");
    case GameModes.ENDLESS:
      return i18next.t("gameMode:endless");
    case GameModes.SPLICED_ENDLESS:
      return i18next.t("gameMode:endlessSpliced");
    case GameModes.DAILY:
      return i18next.t("gameMode:dailyRun");
    case GameModes.CHALLENGE:
      return i18next.t("gameMode:challenge");
    }
  }

  static getModeName(modeId: GameModes): string {
    switch (modeId) {
    case GameModes.CLASSIC:
      return i18next.t("gameMode:classic");
    case GameModes.ENDLESS:
      return i18next.t("gameMode:endless");
    case GameModes.SPLICED_ENDLESS:
      return i18next.t("gameMode:endlessSpliced");
    case GameModes.DAILY:
      return i18next.t("gameMode:dailyRun");
    case GameModes.CHALLENGE:
      return i18next.t("gameMode:challenge");
    }
  }
}

export function getGameMode(gameMode: GameModes): GameMode {
  switch (gameMode) {
  case GameModes.CLASSIC:
    return new GameMode(GameModes.CLASSIC, { isClassic: true, hasTrainers: true }, classicFixedBattles);
  case GameModes.ENDLESS:
    return new GameMode(GameModes.ENDLESS, { isEndless: true, hasShortBiomes: true, hasRandomBosses: true });
  case GameModes.SPLICED_ENDLESS:
    return new GameMode(GameModes.SPLICED_ENDLESS, { isEndless: true, hasShortBiomes: true, hasRandomBosses: true, isSplicedOnly: true });
  case GameModes.DAILY:
    return new GameMode(GameModes.DAILY, { isDaily: true, hasTrainers: true, hasNoShop: true });
  case GameModes.CHALLENGE:
    return new GameMode(GameModes.CHALLENGE, { isClassic: true, hasTrainers: true, isChallenge: true }, classicFixedBattles);
  }
}
