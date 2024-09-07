import { allSpecies } from "#app/data/pokemon-species.js";
import { AbilityAttr, defaultStarterSpecies, DexAttr, SessionSaveData, SystemSaveData } from "./game-data";
import { SettingKeys } from "./settings/settings";

const LATEST_VERSION = process.env.npm_package_version!;

export function sessionVersionConverter(data: SessionSaveData) {
  const curVersion = data.gameVersion;
  if (curVersion !== LATEST_VERSION) {
    switch (data.gameVersion) {
    case "1.0.4":
      // Session data fixing would go here
    }
  }
}

export function systemVersionConverter(data: SystemSaveData) {
  const curVersion = data.gameVersion;
  if (curVersion !== LATEST_VERSION) {
    switch (data.gameVersion) {
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
      if (data.gameVersion) {
        for (const starterId of defaultStarterSpecies) {
          data.starterData[starterId].abilityAttr |= AbilityAttr.ABILITY_1;
          data.dexData[starterId].caughtAttr |= DexAttr.FEMALE;
        }
      }
    }
  }
  data.gameVersion = LATEST_VERSION;
}

export function settingVersionConverter(settings: Object) {
  // Settings don't have versioning (?), so we can't reference a previous
  // version.
  if (settings.hasOwnProperty("REROLL_TARGET") && !settings.hasOwnProperty(SettingKeys.Shop_Cursor_Target)) {
    settings[SettingKeys.Shop_Cursor_Target] = settings["REROLL_TARGET"];
    delete settings["REROLL_TARGET"];
    localStorage.setItem("settings", JSON.stringify(settings));
  }
}
