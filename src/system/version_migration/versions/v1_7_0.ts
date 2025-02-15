import { getPokemonSpeciesForm } from "#app/data/pokemon-species";
import type { SessionSaveData } from "#app/system/game-data";
import * as Utils from "#app/utils";

export const systemMigrators = [] as const;

export const settingsMigrators = [] as const;

export const sessionMigrators = [
  function migrateTera(data: SessionSaveData) {
    for (let i = 0; i < data.modifiers.length;) {
      if (data.modifiers[i].className === "TerastallizeModifier") {
        data.party.forEach((p) => {
          if (p.id === data.modifiers[i].args[0]) {
            p.teraType = data.modifiers[i].args[1];
          }
        });
        data.modifiers.splice(i, 1);
      } else {
        i++;
      }
    }

    for (let i = 0; i < data.enemyModifiers.length;) {
      if (data.enemyModifiers[i].className === "TerastallizeModifier") {
        data.enemyParty.forEach((p) => {
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
      if (Utils.isNullOrUndefined(p.teraType)) {
        p.teraType = getPokemonSpeciesForm(p.species, p.formIndex).type1;
      }
    });

    data.enemyParty.forEach(p => {
      if (Utils.isNullOrUndefined(p.teraType)) {
        p.teraType = getPokemonSpeciesForm(p.species, p.formIndex).type1;
      }
    });
  }
] as const;
