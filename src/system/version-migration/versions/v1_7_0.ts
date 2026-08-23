import { globalScene } from "#app/global-scene";
import { DexAttr } from "#enums/dex-attr";
import type { LegacySessionSaveData } from "#system/version-migration/legacy-data";
import type { SessionSaveData, SystemSaveData } from "#types/save-data";
import type { SessionSaveMigrator, SystemSaveMigrator } from "#types/save-migrators";
import { getPokemonSpecies, getPokemonSpeciesForm } from "#utils/pokemon-utils";

/**
 * If a starter is caught, but the only forms registered as caught are not starterSelectable,
 * unlock the default form.
 * @param data - {@linkcode SystemSaveData}
 */
const migrateUnselectableForms: SystemSaveMigrator = {
  version: "1.7.0",
  migrate: (data: SystemSaveData): void => {
    if (data.starterData && data.dexData) {
      Object.keys(data.starterData).forEach(sd => {
        const caughtAttr = data.dexData[sd]?.caughtAttr;
        const speciesNumber = Number(sd);
        if (!speciesNumber) {
          // An unknown bug at some point in time caused some accounts to have starter data for pokedex number 0 which crashes
          return;
        }
        const species = getPokemonSpecies(speciesNumber);
        if (caughtAttr && species.forms?.length > 1) {
          const selectableForms = species.forms.filter(
            (form, formIndex) => form.isStarterSelectable && caughtAttr & globalScene.gameData.getFormAttr(formIndex),
          );
          if (selectableForms.length === 0) {
            data.dexData[sd].caughtAttr += DexAttr.DEFAULT_FORM;
          }
        }
      });
    }
  },
};

export const systemMigrators: readonly SystemSaveMigrator[] = [migrateUnselectableForms] as const;

const migrateTera: SessionSaveMigrator = {
  version: "1.7.0",
  migrate: (data: SessionSaveData): void => {
    const legacyData = data as LegacySessionSaveData;

    for (let i = 0; i < legacyData.modifiers.length; ) {
      if (legacyData.modifiers[i].className === "TerastallizeModifier") {
        legacyData.party.forEach(p => {
          if (p.id === legacyData.modifiers[i].args[0]) {
            p.teraType = legacyData.modifiers[i].args[1];
          }
        });
        legacyData.modifiers.splice(i, 1);
      } else {
        i++;
      }
    }

    for (let i = 0; i < legacyData.enemyModifiers.length; ) {
      if (legacyData.enemyModifiers[i].className === "TerastallizeModifier") {
        legacyData.enemyParty.forEach(p => {
          if (p.id === legacyData.enemyModifiers[i].args[0]) {
            p.teraType = legacyData.enemyModifiers[i].args[1];
          }
        });
        legacyData.enemyModifiers.splice(i, 1);
      } else {
        i++;
      }
    }

    data.party.forEach(p => {
      if (p.teraType == null) {
        p.teraType = getPokemonSpeciesForm(p.species, p.formIndex).type1;
      }
    });

    data.enemyParty.forEach(p => {
      if (p.teraType == null) {
        p.teraType = getPokemonSpeciesForm(p.species, p.formIndex).type1;
      }
    });
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [migrateTera] as const;
