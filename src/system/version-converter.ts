import { allSpecies } from "#app/data/pokemon-species.js";
import { AbilityAttr, defaultStarterSpecies, DexAttr, SessionSaveData, SystemSaveData } from "./game-data";
import { SettingKeys } from "./settings/settings";

const LATEST_VERSION = "1.0.5";

export function applySessionDataPatches(data: SessionSaveData) {
  const curVersion = data.gameVersion;
  if (curVersion !== LATEST_VERSION) {
    switch (curVersion) {
    case "1.0.0":
    case "1.0.1":
    case "1.0.2":
    case "1.0.3":
    case "1.0.4":
      // --- PATCHES ---

      // Fix Battle Items, Vitamins, and Lures
      data.modifiers.forEach((m) => {
        if (m.className === "PokemonBaseStatModifier") {
          m.className = "BaseStatModifier";
        } else if (m.className === "PokemonResetNegativeStatStageModifier") {
          m.className = "ResetNegativeStatStageModifier";
        } else if (m.className === "TempBattleStatBoosterModifier") {
          m.className = "TempStatStageBoosterModifier";
          m.typeId = "TEMP_STAT_STAGE_BOOSTER";

          // Migration from TempBattleStat to Stat
          const newStat = m.typePregenArgs[0] + 1;
          m.typePregenArgs[0] = newStat;

          // From [ stat, battlesLeft ] to [ stat, maxBattles, battleCount ]
          m.args = [ newStat, 5, m.args[1] ];
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
          m.args = [ maxBattles, m.args[0] ];
        }
      });

      data.enemyModifiers.forEach((m) => {
        if (m.className === "PokemonBaseStatModifier") {
          m.className = "BaseStatModifier";
        } else if (m.className === "PokemonResetNegativeStatStageModifier") {
          m.className = "ResetNegativeStatStageModifier";
        }
      });
    }

    data.gameVersion = LATEST_VERSION;
  }
}

export function applySystemDataPatches(data: SystemSaveData) {
  const curVersion = data.gameVersion;
  if (curVersion !== LATEST_VERSION) {
    switch (curVersion) {
    case "1.0.0":
    case "1.0.1":
    case "1.0.2":
    case "1.0.3":
    case "1.0.4":
      // --- LEGACY PATCHES ---
      if (data.starterData) {
        // Migrate ability starter data if empty for caught species
        Object.keys(data.starterData).forEach(sd => {
          if (data.dexData[sd].caughtAttr && !data.starterData[sd].abilityAttr) {
            data.starterData[sd].abilityAttr = 1;
          }
        });
      }

      // Fix Legendary Stats
      if (data.gameStats && (data.gameStats.legendaryPokemonCaught !== undefined && data.gameStats.subLegendaryPokemonCaught === undefined)) {
        data.gameStats.subLegendaryPokemonSeen = 0;
        data.gameStats.subLegendaryPokemonCaught = 0;
        data.gameStats.subLegendaryPokemonHatched = 0;
        allSpecies.filter(s => s.subLegendary).forEach(s => {
          const dexEntry = data.dexData[s.speciesId];
          data.gameStats.subLegendaryPokemonSeen += dexEntry.seenCount;
          data.gameStats.legendaryPokemonSeen = Math.max(data.gameStats.legendaryPokemonSeen - dexEntry.seenCount, 0);
          data.gameStats.subLegendaryPokemonCaught += dexEntry.caughtCount;
          data.gameStats.legendaryPokemonCaught = Math.max(data.gameStats.legendaryPokemonCaught - dexEntry.caughtCount, 0);
          data.gameStats.subLegendaryPokemonHatched += dexEntry.hatchedCount;
          data.gameStats.legendaryPokemonHatched = Math.max(data.gameStats.legendaryPokemonHatched - dexEntry.hatchedCount, 0);
        });
        data.gameStats.subLegendaryPokemonSeen = Math.max(data.gameStats.subLegendaryPokemonSeen, data.gameStats.subLegendaryPokemonCaught);
        data.gameStats.legendaryPokemonSeen = Math.max(data.gameStats.legendaryPokemonSeen, data.gameStats.legendaryPokemonCaught);
        data.gameStats.mythicalPokemonSeen = Math.max(data.gameStats.mythicalPokemonSeen, data.gameStats.mythicalPokemonCaught);
      }

      // --- PATCHES ---

      // Fix Starter Data
      if (data.starterData) {
        for (const starterId of defaultStarterSpecies) {
          data.starterData[starterId].abilityAttr |= AbilityAttr.ABILITY_1;
          data.dexData[starterId].caughtAttr |= DexAttr.FEMALE;
        }
      }
    }

    data.gameVersion = LATEST_VERSION;
  }
}

export function applySettingsDataPatches(settings: Object) {
  const curVersion = settings.hasOwnProperty("gameVersion") ? settings["gameVersion"] : "1.0.0";
  if (curVersion !== LATEST_VERSION) {
    switch (curVersion) {
    case "1.0.0":
    case "1.0.1":
    case "1.0.2":
    case "1.0.3":
    case "1.0.4":
      // --- PATCHES ---

      // Fix Reward Cursor Target
      if (settings.hasOwnProperty("REROLL_TARGET") && !settings.hasOwnProperty(SettingKeys.Shop_Cursor_Target)) {
        settings[SettingKeys.Shop_Cursor_Target] = settings["REROLL_TARGET"];
        delete settings["REROLL_TARGET"];
        localStorage.setItem("settings", JSON.stringify(settings));
      }
    }
    // Note that the current game version will be written at `saveSettings`
  }
}
