import { DexAttr } from "#enums/dex-attr";
import { SpeciesId } from "#enums/species-id";
import { RibbonData } from "#system/ribbons/ribbon-data";
import type { DexEntry } from "#types/dex-data";
import type { SessionSaveData, SystemSaveData } from "#types/save-data";
import type { SessionSaveMigrator, SystemSaveMigrator } from "#types/save-migrators";

/** Position of battle bond form (is form index 1, so 256n) */
const BATTLE_BOND_FORM_FLAG = 256n;

/**
 * Unset all bits past the 7th (128n) in the seen and caught attrs
 * @param dexData - The dex entry to update
 */
function clearOldBattleBondFormData(dexData: DexEntry): void {
  if (dexData == null) {
    return;
  }
  if (dexData.seenAttr & BATTLE_BOND_FORM_FLAG) {
    dexData.seenAttr &= BATTLE_BOND_FORM_FLAG - 1n;
  }
  if (dexData.caughtAttr & BATTLE_BOND_FORM_FLAG) {
    dexData.caughtAttr &= BATTLE_BOND_FORM_FLAG - 1n;
  }
}

/**
 * Version 1.12 split battle bond greninja into its own species.
 * The migrator will copy over
 */
const migrateGreninjaBattleBondForm: SystemSaveMigrator = {
  version: "1.12.0",
  migrate: (data: SystemSaveData): void => {
    if (!data.starterData || !data.dexData) {
      console.warn("Missing starterData or dexData, skipping battle bond Greninja migration");
      return;
    }
    data.starterData[SpeciesId.BATTLE_BOND_GRENINJA] = {
      moveset: data.starterData[SpeciesId.FROAKIE].moveset,
      eggMoves: 0,
      candyCount: 0,
      friendship: 0,
      abilityAttr: 1,
      passiveAttr: 0,
      valueReduction: 0,
      classicWinCount: 0,
    };
    const froakieData = data.dexData[SpeciesId.FROAKIE];

    const newDexData: DexEntry = {
      seenAttr: 0n,
      caughtAttr: 0n,
      natureAttr: data.dexData[SpeciesId.FROAKIE].natureAttr,
      seenCount: 0,
      caughtCount: 0,
      hatchedCount: 0,
      ivs: [15, 15, 15, 15, 15, 15],
      ribbons: RibbonData.fromJSON("0"),
    };

    // If seen attr has battle bond flag (128n), copy over seenAttr

    const battleBondData = data.dexData[SpeciesId.BATTLE_BOND_GRENINJA];

    // If the battle bond form data already exists....
    if (froakieData.seenAttr & BATTLE_BOND_FORM_FLAG) {
      data.dexData[SpeciesId.BATTLE_BOND_GRENINJA].seenAttr = froakieData.seenAttr & (BATTLE_BOND_FORM_FLAG - 1n);
      froakieData.seenAttr &= BATTLE_BOND_FORM_FLAG - 1n;
    }

    if (froakieData.caughtAttr & BATTLE_BOND_FORM_FLAG) {
      data.dexData[SpeciesId.BATTLE_BOND_GRENINJA].caughtAttr = froakieData.caughtAttr & (BATTLE_BOND_FORM_FLAG - 1n);
      froakieData.caughtAttr &= BATTLE_BOND_FORM_FLAG - 1n;
    }

    // Must clear out the battle bond form data from the species line entries
    clearOldBattleBondFormData(data.dexData[SpeciesId.FROGADIER]);
    clearOldBattleBondFormData(data.dexData[SpeciesId.GRENINJA]);
  },
};

/**
 * Replace any froakie battle bond form with battle bond greninja in session save.
 */
const migrateGreninjaBattleBondFormSession: SessionSaveMigrator = {
  version: "1.12.0",
  migrate: (data: SessionSaveData): void => {
    for (const pokemon of [...data.party, ...data.enemyParty]) {
      if (
        [SpeciesId.FROAKIE, SpeciesId.FROGADIER, SpeciesId.GRENINJA].includes(pokemon.species)
        && pokemon.formIndex !== 0
      ) {
        pokemon.species = SpeciesId.BATTLE_BOND_GRENINJA;
        pokemon.abilityIndex = 0;
      }
      if (
        [SpeciesId.FROAKIE, SpeciesId.FROGADIER, SpeciesId.GRENINJA].includes(pokemon.species)
        && pokemon.fusionFormIndex !== 0
      ) {
        pokemon.fusionFormIndex = 0;
        pokemon.fusionAbilityIndex = 0;
        pokemon.fusionSpecies = SpeciesId.BATTLE_BOND_GRENINJA;
      }
    }
  },
};

export const systemMigrators: readonly SystemSaveMigrator[] = [migrateGreninjaBattleBondForm] as const;
export const sessionMigrators: readonly SessionSaveMigrator[] = [migrateGreninjaBattleBondFormSession] as const;
