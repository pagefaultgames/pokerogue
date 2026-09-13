import { convertModifierSaveData } from "#items/modifier-to-item-migrator-utils";
import type { PokemonItemMap } from "#types/held-item-data-types";
import type { SessionSaveMigrator, SessionSaveMigratorIn } from "#types/save-migrators";
import { validateIsArrayOfObjects } from "#utils/migrator-utils";

/**
 * Distribute converted held items onto their owning party members.
 * @param party - The (player or enemy) party from the save data
 * @param heldItems - The converted {@linkcode PokemonItemMap}s to distribute
 */
function assignHeldItemsToParty(party: SessionSaveMigratorIn["party"], heldItems: PokemonItemMap[]): void {
  for (const pokemon of party) {
    const itemSaveData: Record<string, unknown>[] = validateIsArrayOfObjects(pokemon.heldItems)
      ? pokemon.heldItems
      : [];

    for (const { item, pokemonId } of heldItems) {
      if (pokemonId !== pokemon.id) {
        continue;
      }
      const existing = itemSaveData.find(specs => specs.id === item.id);
      if (existing) {
        // don't think this should be possible to hit
        existing.stack = (typeof existing.stack === "number" ? existing.stack : 0) + item.stack;
      } else {
        itemSaveData.push({ ...item });
      }
    }

    pokemon.heldItems = itemSaveData;
  }
}

const migrateModifiersToItems: SessionSaveMigrator = {
  name: "migrateModifiersToItems",
  version: "1.13.0.0",
  migrate: data => {
    // Player side
    if (validateIsArrayOfObjects(data.modifiers)) {
      const { heldItems, trainerItems } = convertModifierSaveData(data.modifiers);

      data.trainerItems = Array.isArray(data.trainerItems) ? [...data.trainerItems, ...trainerItems] : trainerItems;
      assignHeldItemsToParty(data.party, heldItems);
    } else if (data.modifiers != null) {
      console.warn("Malformed player modifiers in save data, skipping modifier -> item conversion");
    }
    Reflect.deleteProperty(data, "modifiers");

    // Enemy side (enemyParty is guaranteed to be an array of objects by this point)
    if (validateIsArrayOfObjects(data.enemyModifiers)) {
      const { heldItems, trainerItems } = convertModifierSaveData(data.enemyModifiers);

      data.enemyTrainerItems = Array.isArray(data.enemyTrainerItems)
        ? [...data.enemyTrainerItems, ...trainerItems]
        : trainerItems;
      assignHeldItemsToParty(data.enemyParty, heldItems);
    } else if (data.enemyModifiers != null) {
      console.warn("Malformed enemy modifiers in save data, skipping modifier -> item conversion for enemy party");
    }
    Reflect.deleteProperty(data, "enemyModifiers");

    // Ensure the new fields always exist and are arrays, even on saves that somehow had no/malformed modifier arrays
    if (!Array.isArray(data.trainerItems)) {
      data.trainerItems = [];
    }
    if (!Array.isArray(data.enemyTrainerItems)) {
      data.enemyTrainerItems = [];
    }
    for (const pokemon of [...data.party, ...data.enemyParty]) {
      if (!Array.isArray(pokemon.heldItems)) {
        pokemon.heldItems = [];
      }
    }
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [migrateModifiersToItems] as const;
