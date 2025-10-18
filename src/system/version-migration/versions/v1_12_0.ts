import type { SessionSaveData } from "#types/save-data";
import type { SessionSaveMigrator } from "#types/session-save-migrator";

/**
 * Shift the form change item values upward to account for newly added Mega Stones.
 * @param data - {@linkcode SystemSaveData}
 */
const shiftFormChangeItems: SessionSaveMigrator = {
  version: "1.12.0",
  migrate: (data: SessionSaveData) => {
    // Shifting these up by 50 will work for now, but a more permanent solution will be desired in the future
    const shiftAmount = 50;
    for (let i = 0; i < data.modifiers.length; ) {
      if (data.modifiers[i].className === "PokemonFormChangeItemModifier") {
        if (typeof data.modifiers[i].args[1] === "number" && data.modifiers[i].args[1] >= 50) {
          data.modifiers[i].args[1] += shiftAmount;
        }
        if (typeof data.modifiers[i].typePregenArgs[0] === "number" && data.modifiers[i].typePregenArgs[0] >= 50) {
          data.modifiers[i].typePregenArgs[0] += shiftAmount;
        }
        i++;
      }
    }
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [shiftFormChangeItems] as const;
