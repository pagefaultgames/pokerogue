import { speciesDataRegistry } from "#app/global-species-data-registry";
import { SpeciesId } from "#enums/species-id";
import type { SystemSaveData } from "#types/save-data";
import type { SystemSaveMigrator } from "#types/save-migrators";

function removeInvalidStarterData(data: SystemSaveData): void {
  if (!data.starterData) {
    console.error("Starter data is missing! Skipping starter data fixing.");
    return;
  }

  for (const s of Object.keys(data.starterData)) {
    if (!SpeciesId[s]) {
      console.warn(`Invalid species ID "${s}" found in starter data, removing entry...`);
      delete data.starterData[s];
      return;
    }

    if (!speciesDataRegistry.isStarter(Number(s))) {
      console.warn(`Species "${SpeciesId[s]}" is not a valid starter, removing entry...`);
      delete data.starterData[s];
    }
  }
}

function removeInvalidDexData(data: SystemSaveData): void {
  if (!data.dexData) {
    console.error("Dex data is missing! Skipping dex data fixing.");
    return;
  }

  for (const s of Object.keys(data.dexData)) {
    if (!SpeciesId[s]) {
      console.warn(`Invalid species ID "${s}" found in dex data, removing entry...`);
      delete data.dexData[s];
    }
  }
}

const removeInvalidStarterAndDexData = {
  name: "removeInvalidStarterAndDexData",
  version: "1.12.0.10",
  migrate: (data: SystemSaveData): void => {
    removeInvalidStarterData(data);
    removeInvalidDexData(data);
  },
} as const satisfies SystemSaveMigrator;

export const systemMigrators = [removeInvalidStarterAndDexData] as const satisfies readonly SystemSaveMigrator[];
