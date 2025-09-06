import { defaultStarterSpecies } from "#app/constants";
import { allSpecies } from "#data/data-lists";
import { CustomPokemonData } from "#data/pokemon-data";
import { AbilityAttr } from "#enums/ability-attr";
import { DexAttr } from "#enums/dex-attr";
import type { SessionSaveData, SystemSaveData } from "#system/game-data";
import { SettingKeys } from "#system/settings";
import type { SessionSaveMigrator } from "#types/session-save-migrator";
import type { SettingsSaveMigrator } from "#types/settings-save-migrator";
import type { SystemSaveMigrator } from "#types/system-save-migrator";
import { isNullOrUndefined } from "#utils/common";

/**
 * Migrate ability starter data if empty for caught species.
 * @param data - {@linkcode SystemSaveData}
 */
const migrateAbilityData: SystemSaveMigrator = {
  version: "1.0.4",
  migrate: (data: SystemSaveData): void => {
    if (data.starterData && data.dexData) {
      Object.keys(data.starterData).forEach(sd => {
        if (data.dexData[sd]?.caughtAttr && data.starterData[sd] && !data.starterData[sd].abilityAttr) {
          data.starterData[sd].abilityAttr = 1;
        }
      });
    }
  },
};

/**
 * Populate legendary Pokémon statistics if they are missing.
 * @param data - {@linkcode SystemSaveData}
 */
const fixLegendaryStats: SystemSaveMigrator = {
  version: "1.0.4",
  migrate: (data: SystemSaveData): void => {
    if (
      data.gameStats
      && data.gameStats.legendaryPokemonCaught !== undefined
      && data.gameStats.subLegendaryPokemonCaught === undefined
    ) {
      data.gameStats.subLegendaryPokemonSeen = 0;
      data.gameStats.subLegendaryPokemonCaught = 0;
      data.gameStats.subLegendaryPokemonHatched = 0;
      allSpecies
        .filter(s => s.subLegendary)
        .forEach(s => {
          const dexEntry = data.dexData[s.speciesId];
          data.gameStats.subLegendaryPokemonSeen += dexEntry.seenCount;
          data.gameStats.legendaryPokemonSeen = Math.max(data.gameStats.legendaryPokemonSeen - dexEntry.seenCount, 0);
          data.gameStats.subLegendaryPokemonCaught += dexEntry.caughtCount;
          data.gameStats.legendaryPokemonCaught = Math.max(
            data.gameStats.legendaryPokemonCaught - dexEntry.caughtCount,
            0,
          );
          data.gameStats.subLegendaryPokemonHatched += dexEntry.hatchedCount;
          data.gameStats.legendaryPokemonHatched = Math.max(
            data.gameStats.legendaryPokemonHatched - dexEntry.hatchedCount,
            0,
          );
        });
      data.gameStats.subLegendaryPokemonSeen = Math.max(
        data.gameStats.subLegendaryPokemonSeen,
        data.gameStats.subLegendaryPokemonCaught,
      );
      data.gameStats.legendaryPokemonSeen = Math.max(
        data.gameStats.legendaryPokemonSeen,
        data.gameStats.legendaryPokemonCaught,
      );
      data.gameStats.mythicalPokemonSeen = Math.max(
        data.gameStats.mythicalPokemonSeen,
        data.gameStats.mythicalPokemonCaught,
      );
    }
  },
};

/**
 * Unlock all starters' first ability and female gender option.
 * @param data - {@linkcode SystemSaveData}
 */
const fixStarterData: SystemSaveMigrator = {
  version: "1.0.4",
  migrate: (data: SystemSaveData): void => {
    if (!isNullOrUndefined(data.starterData)) {
      for (const starterId of defaultStarterSpecies) {
        if (data.starterData[starterId]?.abilityAttr) {
          data.starterData[starterId].abilityAttr |= AbilityAttr.ABILITY_1;
        }
        if (data.dexData[starterId]?.caughtAttr) {
          data.dexData[starterId].caughtAttr |= DexAttr.FEMALE;
        }
      }
    }
  },
};

export const systemMigrators: readonly SystemSaveMigrator[] = [
  migrateAbilityData,
  fixLegendaryStats,
  fixStarterData,
] as const;

/**
 * Migrate from `REROLL_TARGET` property to {@linkcode SettingKeys.Shop_Cursor_Target}
 * @param data - The `settings` object
 */
const fixRerollTarget: SettingsSaveMigrator = {
  version: "1.0.4",
  // biome-ignore lint/complexity/noBannedTypes: TODO - refactor settings
  migrate: (data: Object): void => {
    if (data.hasOwnProperty("REROLL_TARGET") && !data.hasOwnProperty(SettingKeys.Shop_Cursor_Target)) {
      data[SettingKeys.Shop_Cursor_Target] = data["REROLL_TARGET"];
      // biome-ignore lint/performance/noDelete: intentional
      delete data["REROLL_TARGET"];
      localStorage.setItem("settings", JSON.stringify(data));
    }
  },
};

export const settingsMigrators: readonly SettingsSaveMigrator[] = [fixRerollTarget] as const;

/**
 *  Converts old lapsing modifiers (battle items, lures, and Dire Hit) and
 *  other miscellaneous modifiers (vitamins, White Herb) to any new class
 *  names and/or change in reload arguments.
 *  @param data - {@linkcode SessionSaveData}
 */
const migrateModifiers: SessionSaveMigrator = {
  version: "1.0.4",
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: necessary?
  migrate: (data: SessionSaveData): void => {
    for (const m of data.modifiers) {
      if (m.className === "PokemonBaseStatModifier") {
        m.className = "BaseStatModifier";
      } else if (m.className === "PokemonResetNegativeStatStageModifier") {
        m.className = "ResetNegativeStatStageModifier";
      } else if (m.className === "TempBattleStatBoosterModifier") {
        const maxBattles = 5;
        // Dire Hit no longer a part of the TempBattleStatBoosterModifierTypeGenerator
        if (m.typeId !== "DIRE_HIT") {
          m.className = "TempStatStageBoosterModifier";
          m.typeId = "TEMP_STAT_STAGE_BOOSTER";

          // Migration from TempBattleStat to Stat
          const newStat = m.typePregenArgs[0] + 1;
          m.typePregenArgs[0] = newStat;

          // From [ stat, battlesLeft ] to [ stat, maxBattles, battleCount ]
          m.args = [newStat, maxBattles, Math.min(m.args[1], maxBattles)];
        } else {
          m.className = "TempCritBoosterModifier";
          m.typePregenArgs = [];

          // From [ stat, battlesLeft ] to [ maxBattles, battleCount ]
          m.args = [maxBattles, Math.min(m.args[1], maxBattles)];
        }
      } else if (m.className === "DoubleBattleChanceBoosterModifier" && m.args.length === 1) {
        let maxBattles: number;
        switch (m.typeId) {
          case "MAX_LURE":
            maxBattles = 30;
            break;
          case "SUPER_LURE":
            maxBattles = 15;
            break;
          default:
            maxBattles = 10;
            break;
        }

        // From [ battlesLeft ] to [ maxBattles, battleCount ]
        m.args = [maxBattles, Math.min(m.args[0], maxBattles)];
      }
    }

    for (const m of data.enemyModifiers) {
      if (m.className === "PokemonBaseStatModifier") {
        m.className = "BaseStatModifier";
      } else if (m.className === "PokemonResetNegativeStatStageModifier") {
        m.className = "ResetNegativeStatStageModifier";
      }
    }
  },
};

const migrateCustomPokemonData: SessionSaveMigrator = {
  version: "1.0.4",
  migrate: (data: SessionSaveData): void => {
    // Fix Pokemon nature overrides and custom data migration
    for (const pokemon of data.party) {
      if (pokemon["mysteryEncounterPokemonData"]) {
        pokemon.customPokemonData = new CustomPokemonData(pokemon["mysteryEncounterPokemonData"]);
        pokemon["mysteryEncounterPokemonData"] = null;
      }
      if (pokemon["fusionMysteryEncounterPokemonData"]) {
        pokemon.fusionCustomPokemonData = new CustomPokemonData(pokemon["fusionMysteryEncounterPokemonData"]);
        pokemon["fusionMysteryEncounterPokemonData"] = null;
      }
      pokemon.customPokemonData = pokemon.customPokemonData ?? new CustomPokemonData();
      if (!isNullOrUndefined(pokemon["natureOverride"]) && pokemon["natureOverride"] >= 0) {
        pokemon.customPokemonData.nature = pokemon["natureOverride"];
        pokemon["natureOverride"] = -1;
      }
    }
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [migrateModifiers, migrateCustomPokemonData] as const;
