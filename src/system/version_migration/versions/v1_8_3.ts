import type { SystemSaveMigrator } from "#app/@types/SystemSaveMigrator";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { DexAttr, type SystemSaveData } from "#app/system/game-data";
import { Species } from "#enums/species";

/**
 * If a starter is caught, but the only forms registered as caught are not starterSelectable,
 * unlock the default form.
 * @param data - {@linkcode SystemSaveData}
 */
const migratePichuForms: SystemSaveMigrator = {
  version: "1.8.3",
  migrate: (data: SystemSaveData): void => {
    if (data.starterData && data.dexData) {
      // This is Pichu's Pokédex number
      const sd = 172;
      const caughtAttr = data.dexData[sd]?.caughtAttr;
      const species = getPokemonSpecies(sd);
      // An extra check because you never know
      if (species.speciesId === Species.PICHU && caughtAttr) {
        // Ensuring that only existing forms are unlocked
        data.dexData[sd].caughtAttr &= species.getFullUnlocksData();
        // If no forms are unlocked now, since Pichu is caught, we unlock form 0
        data.dexData[sd].caughtAttr |= DexAttr.DEFAULT_FORM;
      }
    }
  },
};

export const systemMigrators: Readonly<SystemSaveMigrator[]> = [migratePichuForms] as const;
