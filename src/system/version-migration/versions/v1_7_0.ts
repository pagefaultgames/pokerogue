import { globalScene } from "#app/global-scene";
import { DexAttr } from "#enums/dex-attr";
import type { SpeciesId } from "#enums/species-id";
import type { SystemSaveData } from "#types/save-data";
import type { SessionSaveMigrator, SystemSaveMigrator } from "#types/save-migrators";
import { validateIsArrayOfObjects } from "#utils/migrator-utils";
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

function isArrayOfAtLeastTwo(arr: unknown): arr is unknown[] {
  return Array.isArray(arr) && arr.length >= 2;
}

const migrateTera: SessionSaveMigrator = {
  version: "1.7.0",
  migrate: data => {
    // biome-ignore lint/style/noNegationElse: Improves readability
    if (!validateIsArrayOfObjects(data.modifiers)) {
      console.warn("Malformed player modifiers in save data, skipping tera type migrator");
    } else {
      for (let i = 0; i < data.modifiers.length; ) {
        if (data.modifiers[i].className === "TerastallizeModifier") {
          // Assert the modifier has the expected args structure
          const modifierArgs = data.modifiers[i].args;
          // Skip malformed modifiers (it is not the migrator's responsibility to fix/remove)
          if (!isArrayOfAtLeastTwo(modifierArgs)) {
            continue;
          }
          data.party.forEach(p => {
            if (p.id === modifierArgs[0]) {
              p.teraType = modifierArgs[1];
            }
          });
          data.modifiers.splice(i, 1);
        } else {
          i++;
        }
      }

      data.party.forEach(p => {
        if (p.teraType == null) {
          p.teraType = getPokemonSpeciesForm(p.species as SpeciesId, p.formIndex as number).type1;
        }
      });
    }

    if (!validateIsArrayOfObjects(data.enemyModifiers)) {
      if (data.enemyModifiers != null) {
        console.warn("Malformed enemy modifiers/party in save data, skipping tera type migrator for enemy party");
      }
      return;
    }

    for (let i = 0; i < data.enemyModifiers.length; ) {
      if (data.enemyModifiers[i].className === "TerastallizeModifier") {
        // Assert the modifier has the expected args structure
        const modifierArgs = data.enemyModifiers[i].args;

        if (!isArrayOfAtLeastTwo(modifierArgs)) {
          data.enemyModifiers.splice(i, 1);
          continue;
        }

        data.enemyParty.forEach(p => {
          if (p.id === modifierArgs[0]) {
            p.teraType = modifierArgs[1];
          }
        });

        data.enemyModifiers.splice(i, 1);
      } else {
        i++;
      }
    }

    data.enemyParty.forEach(p => {
      if (p.teraType == null) {
        p.teraType = getPokemonSpeciesForm(p.species as SpeciesId, p.formIndex as number).type1;
      }
    });
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [migrateTera] as const;
