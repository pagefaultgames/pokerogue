import { fixedBattles } from "./battle";
import BattleScene from "./battle-scene";
import { Biome } from "./data/enums/biome";
import { Species } from "./data/enums/species";
import PokemonSpecies, { allSpecies } from "./data/pokemon-species";
import { Arena } from "./field/arena";
import * as Utils from "./utils";
import * as Overrides from './overrides';

export enum GameModes {
  CLASSIC,
  ENDLESS,
  SPLICED_ENDLESS,
  DAILY
}

interface GameModeConfig {
  isClassic?: boolean;
  isEndless?: boolean;
  isDaily?: boolean;
  hasTrainers?: boolean;
  hasFixedBattles?: boolean;
  hasNoShop?: boolean;
  hasShortBiomes?: boolean;
  hasRandomBiomes?: boolean;
  hasRandomBosses?: boolean;
  isSplicedOnly?: boolean;
}

export class GameMode implements GameModeConfig {
  public modeId: GameModes;
  public isClassic: boolean;
  public isEndless: boolean;
  public isDaily: boolean;
  public hasTrainers: boolean;
  public hasFixedBattles: boolean;
  public hasNoShop: boolean;
  public hasShortBiomes: boolean;
  public hasRandomBiomes: boolean;
  public hasRandomBosses: boolean;
  public isSplicedOnly: boolean;

  constructor(modeId: GameModes, config: GameModeConfig) {
    this.modeId = modeId;
    Object.assign(this, config);
  }

  /**
   * @returns either: 
   * - override from overrides.ts
   * - 20 for Daily Runs
   * - 5 for all other modes
   */
  getStartingLevel(): integer {
    if (Overrides.STARTING_LEVEL_OVERRIDE)
      return Overrides.STARTING_LEVEL_OVERRIDE;
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
    if (this.isDaily)
      return waveIndex % 10 === 5 || (!(waveIndex % 10) && waveIndex > 10 && !this.isWaveFinal(waveIndex));
    if ((waveIndex % 30) === (arena.scene.offsetGym ? 0 : 20) && !this.isWaveFinal(waveIndex))
      return true;
    else if (waveIndex % 10 !== 1 && waveIndex % 10) {
      const trainerChance = arena.getTrainerChance();
      let allowTrainerBattle = true;
      if (trainerChance) {
        const waveBase = Math.floor(waveIndex / 10) * 10;
        for (let w = Math.max(waveIndex - 3, waveBase + 2); w <= Math.min(waveIndex + 3, waveBase + 9); w++) {
          if (w === waveIndex)
            continue;
          if ((w % 30) === (arena.scene.offsetGym ? 0 : 20) || fixedBattles.hasOwnProperty(w)) {
            allowTrainerBattle = false;
            break;
          } else if (w < waveIndex) {
            arena.scene.executeWithSeedOffset(() => {
              const waveTrainerChance = arena.getTrainerChance();
              if (!Utils.randSeedInt(waveTrainerChance))
                allowTrainerBattle = false;
            }, w);
            if (!allowTrainerBattle)
              break;
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

  isWaveFinal(waveIndex: integer): boolean {
    switch (this.modeId) {
      case GameModes.CLASSIC:
        return waveIndex === 200;
      case GameModes.ENDLESS:
      case GameModes.SPLICED_ENDLESS:
        return !(waveIndex % 250);
      case GameModes.DAILY:
        return waveIndex === 50;
    }
  }

  getClearScoreBonus(): integer {
    switch (this.modeId) {
      case GameModes.CLASSIC:
        return 5000;
      case GameModes.DAILY:
        return 2500;
    }
  }

  getEnemyModifierChance(isBoss: boolean): integer {
    switch (this.modeId) {
      case GameModes.CLASSIC:
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
        return 'Classic';
      case GameModes.ENDLESS:
        return 'Endless';
      case GameModes.SPLICED_ENDLESS:
        return 'Endless (Spliced)';
      case GameModes.DAILY:
        return 'Daily Run';
    }
  }
}

export const gameModes = Object.freeze({
  [GameModes.CLASSIC]: new GameMode(GameModes.CLASSIC, { isClassic: true, hasTrainers: true, hasFixedBattles: true }),
  [GameModes.ENDLESS]: new GameMode(GameModes.ENDLESS, { isEndless: true, hasShortBiomes: true, hasRandomBosses: true }),
  [GameModes.SPLICED_ENDLESS]: new GameMode(GameModes.SPLICED_ENDLESS, { isEndless: true, hasShortBiomes: true, hasRandomBosses: true, isSplicedOnly: true }),
  [GameModes.DAILY]: new GameMode(GameModes.DAILY, { isDaily: true, hasTrainers: true, hasNoShop: true })
});