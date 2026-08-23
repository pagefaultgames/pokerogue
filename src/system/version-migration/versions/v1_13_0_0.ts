import { convertModifierSaveData } from "#items/modifier-to-item-migrator-utils";
import type { PokemonData } from "#system/pokemon-data";
import type { LegacySessionSaveData } from "#system/version-migration/legacy-data";
import type { HeldItemSaveData, PokemonItemMap } from "#types/held-item-data-types";
import type { SessionSaveData } from "#types/save-data";
import type { SessionSaveMigrator } from "#types/save-migrators";

/**
 * Distribute converted held items onto their owning party members.
 * @param party - The (player or enemy) party from the save data
 * @param heldItems - The converted {@linkcode PokemonItemMap}s to distribute
 */
function assignHeldItemsToParty(party: PokemonData[], heldItems: PokemonItemMap[]): void {
  for (const pokemon of party) {
    const itemSaveData: HeldItemSaveData = pokemon.heldItems ?? [];

    for (const { item, pokemonId } of heldItems) {
      if (pokemonId !== pokemon.id) {
        continue;
      }
      const existing = itemSaveData.find(specs => specs.id === item.id);
      if (existing) {
        // don't think this should be possible to hit
        existing.stack += item.stack;
      } else {
        itemSaveData.push(item);
      }
    }

    pokemon.heldItems = itemSaveData;
  }
}

const migrateModifiersToItems: SessionSaveMigrator = {
  version: "1.13.0.0",
  migrate: (data: SessionSaveData): void => {
    const legacyData = data as LegacySessionSaveData;

    // Player side
    if (Array.isArray(legacyData.modifiers)) {
      const { heldItems, trainerItems } = convertModifierSaveData(legacyData.modifiers);

      data.trainerItems = [...(data.trainerItems ?? []), ...trainerItems];
      assignHeldItemsToParty(data.party, heldItems);

      Reflect.deleteProperty(legacyData, "modifiers");
    }

    // Enemy side
    if (Array.isArray(legacyData.enemyModifiers)) {
      const { heldItems, trainerItems } = convertModifierSaveData(legacyData.enemyModifiers);

      data.enemyTrainerItems = [...(data.enemyTrainerItems ?? []), ...trainerItems];
      assignHeldItemsToParty(data.enemyParty, heldItems);

      Reflect.deleteProperty(legacyData, "enemyModifiers");
    }

    // Ensure the new fields always exist, even on saves that somehow had no modifier arrays
    data.trainerItems ??= [];
    data.enemyTrainerItems ??= [];
    for (const pokemon of [...data.party, ...data.enemyParty]) {
      pokemon.heldItems ??= [];
    }
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [migrateModifiersToItems] as const;
