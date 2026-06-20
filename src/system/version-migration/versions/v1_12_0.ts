import type { SessionSaveData } from "#types/save-data";
import type { SessionSaveMigrator } from "#types/save-migrators";

/**
 * Shift the form change item values upward to account for newly added Mega Stones.
 * @param data - {@linkcode SystemSaveData}
 */
const shiftFormChangeItems: SessionSaveMigrator = {
  version: "1.12.0",
  migrate: (data: SessionSaveData) => {
    // Shifting these up by 50 will work for now, but a more permanent solution will be desired in the future
    const shiftAmount = 50;
    for (const modifier of data.modifiers) {
      if (modifier.className === "PokemonFormChangeItemModifier") {
        if (typeof modifier.args[1] === "number" && modifier.args[1] >= 50) {
          modifier.args[1] += shiftAmount;
        }
        if (typeof modifier.typePregenArgs[0] === "number" && modifier.typePregenArgs[0] >= 50) {
          modifier.typePregenArgs[0] += shiftAmount;
        }
      }
    }
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [shiftFormChangeItems] as const;
