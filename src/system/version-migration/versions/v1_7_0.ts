import { globalScene } from "#app/global-scene";
import { DexAttr } from "#enums/dex-attr";
import type { SessionSaveData, SystemSaveData } from "#system/game-data";
import type { SessionSaveMigrator } from "#types/session-save-migrator";
import type { SystemSaveMigrator } from "#types/system-save-migrator";
import { isNullOrUndefined } from "#utils/common";
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
    for (let i = 0; i < data.modifiers.length; ) {
      if (data.modifiers[i].className === "TerastallizeModifier") {
        data.party.forEach(p => {
          if (p.id === data.modifiers[i].args[0]) {
            p.teraType = data.modifiers[i].args[1];
          }
        });
        data.modifiers.splice(i, 1);
      } else {
        i++;
      }
    }

    for (let i = 0; i < data.enemyModifiers.length; ) {
      if (data.enemyModifiers[i].className === "TerastallizeModifier") {
        data.enemyParty.forEach(p => {
          if (p.id === data.enemyModifiers[i].args[0]) {
            p.teraType = data.enemyModifiers[i].args[1];
          }
        });
        data.enemyModifiers.splice(i, 1);
      } else {
        i++;
      }
    }

    data.party.forEach(p => {
      if (isNullOrUndefined(p.teraType)) {
        p.teraType = getPokemonSpeciesForm(p.species, p.formIndex).type1;
      }
    });

    data.enemyParty.forEach(p => {
      if (isNullOrUndefined(p.teraType)) {
        p.teraType = getPokemonSpeciesForm(p.species, p.formIndex).type1;
      }
    });
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [migrateTera] as const;
