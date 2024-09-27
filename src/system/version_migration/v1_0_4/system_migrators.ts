import { AbilityAttr, defaultStarterSpecies, DexAttr, SystemSaveData } from "../../game-data";
import { allSpecies } from "../../../data/pokemon-species";

/**
 * Migrate ability starter data if empty for caught species
 * @param data {@linkcode SystemSaveData}
 */
export function migrateAbilityData(data: SystemSaveData) {
  if (data.starterData && data.dexData) {
    // Migrate ability starter data if empty for caught species
    Object.keys(data.starterData).forEach(sd => {
      if (data.dexData[sd]?.caughtAttr && (data.starterData[sd] && !data.starterData[sd].abilityAttr)) {
        data.starterData[sd].abilityAttr = 1;
      }
    });
  }
}

/**
 * Populate legendary Pokémon statistics if they are missing
 * @param data {@linkcode SystemSaveData}
 */
export function fixLegendaryStats(data: SystemSaveData) {
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
}

/**
 * Unlock all starters' first ability and female gender option
 * @param data {@linkcode SystemSaveData}
 */
export function fixStarterData(data: SystemSaveData) {
  for (const starterId of defaultStarterSpecies) {
    if (data.starterData[starterId]?.abilityAttr) {
      data.starterData[starterId].abilityAttr |= AbilityAttr.ABILITY_1;
    }
    if (data.dexData[starterId]?.caughtAttr) {
      data.dexData[starterId].caughtAttr |= DexAttr.FEMALE;
    }
  }
}
