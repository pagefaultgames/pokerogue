import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import type { PokemonData } from "#system/pokemon-data";
import { RibbonData } from "#system/ribbons/ribbon-data";
import type { DexEntry } from "#types/dex-data";
import type { SessionSaveData, SystemSaveData } from "#types/save-data";
import type { SessionSaveMigrator, SystemSaveMigrator } from "#types/save-migrators";

const FORM_0_FLAG = 256n;

/** Position of battle bond form (is form index 1, so 256n) */
const BATTLE_BOND_FORM_FLAG = FORM_0_FLAG;

/** Position of white stripe form (is form index 2, so 512n) */
const WHITE_STRIPE_FORM_FLAG = FORM_0_FLAG << 1n;

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

function migrateSystemGreninjaBattleBondForm(data: SystemSaveData): void {
  data.starterData[SpeciesId.BATTLE_BOND_GRENINJA] = {
    moveset: null,
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
    ivs: data.dexData[SpeciesId.FROAKIE].ivs ?? [15, 15, 15, 15, 15, 15],
    ribbons: RibbonData.fromJSON("0"),
  };

  // If the battle bond form data already exists....
  if (froakieData.seenAttr & BATTLE_BOND_FORM_FLAG) {
    console.log("Migrating battle bond form seen data for froakie");
    newDexData.seenAttr = froakieData.seenAttr & (BATTLE_BOND_FORM_FLAG - 1n);
    froakieData.seenAttr &= BATTLE_BOND_FORM_FLAG - 1n;
  }

  if (froakieData.caughtAttr & BATTLE_BOND_FORM_FLAG) {
    console.log("Migrating battle bond form caught data for froakie");
    newDexData.caughtAttr = froakieData.caughtAttr & (BATTLE_BOND_FORM_FLAG - 1n);
    froakieData.caughtAttr &= BATTLE_BOND_FORM_FLAG - 1n;
  }

  data.dexData[SpeciesId.BATTLE_BOND_GRENINJA] = newDexData;
  // Must clear out the battle bond form data from the species line entries
  clearOldBattleBondFormData(data.dexData[SpeciesId.FROGADIER]);
  clearOldBattleBondFormData(data.dexData[SpeciesId.GRENINJA]);
}

function migrateSystemHisuiBasculin(data: SystemSaveData): void {
  const basculinStarterData = data.starterData[SpeciesId.BASCULIN];
  const basculinData = data.dexData[SpeciesId.BASCULIN];
  data.starterData[SpeciesId.HISUI_BASCULIN] = {
    moveset: null,
    eggMoves: basculinStarterData.eggMoves ?? 0,
    candyCount: basculinStarterData.candyCount ?? 0,
    friendship: 0,
    abilityAttr: basculinStarterData.abilityAttr ?? 1,
    passiveAttr: basculinStarterData.passiveAttr ?? 0,
    valueReduction: basculinStarterData.valueReduction ?? 0,
    classicWinCount: 0,
  };

  const newDexData: DexEntry = {
    seenAttr: 0n,
    caughtAttr: 0n,
    natureAttr: data.dexData[SpeciesId.BASCULIN].natureAttr,
    seenCount: 0,
    caughtCount: 0,
    hatchedCount: 0,
    ivs: data.dexData[SpeciesId.BASCULIN].ivs ?? [15, 15, 15, 15, 15, 15],
    ribbons: RibbonData.fromJSON("0"),
  };

  // If the white stripe form data already exists....
  if (basculinData.seenAttr & WHITE_STRIPE_FORM_FLAG) {
    // 255 is bitflag for all bits below 8th
    newDexData.seenAttr = basculinData.seenAttr & 255n;
    // Unset white stripe seen flag
    basculinData.seenAttr &= WHITE_STRIPE_FORM_FLAG - 1n;
  }

  if (basculinData.caughtAttr & WHITE_STRIPE_FORM_FLAG) {
    newDexData.caughtAttr = basculinData.caughtAttr & 255n;
    basculinData.caughtAttr &= WHITE_STRIPE_FORM_FLAG - 1n;
  }

  data.dexData[SpeciesId.HISUI_BASCULIN] = newDexData;
}

/**
 * Version 1.12 split battle bond greninja into its own species.
 * The migrator will copy over some of the data.
 */
const migrateSpeciesSplitSystem: SystemSaveMigrator = {
  version: "1.12.0.0",
  migrate: (data: SystemSaveData): void => {
    if (!data.starterData || !data.dexData) {
      console.warn("Missing starterData or dexData, skipping battle bond Greninja migration");
      return;
    }
    migrateSystemGreninjaBattleBondForm(data);
    migrateSystemHisuiBasculin(data);
  },
};

/**
 * Migrate a pokemon entry that may have had battle bond froakie
 * @param pokemon - The pokemon object to migrate; will be updated in place
 * @param replaceSpecies - Whether to replace a matching species with battle bond greninja (or keep original species and set to default form)
 */
function migrateSessionGreninjaBattleBondForm(pokemon: PokemonData, replaceSpecies: boolean): void {
  console.log("Migrating pokemon with species %d and form index %d", pokemon.species, pokemon.formIndex);
  if (
    [SpeciesId.FROAKIE, SpeciesId.FROGADIER, SpeciesId.GRENINJA].includes(pokemon.species)
    && pokemon.formIndex !== 0
  ) {
    if (replaceSpecies) {
      pokemon.species = SpeciesId.BATTLE_BOND_GRENINJA;
      pokemon.abilityIndex = 0;
    }
    pokemon.formIndex = 0;
  }

  if (
    [SpeciesId.FROAKIE, SpeciesId.FROGADIER, SpeciesId.GRENINJA].includes(pokemon.fusionSpecies)
    && pokemon.fusionFormIndex !== 0
  ) {
    pokemon.fusionFormIndex = 0;

    if (replaceSpecies) {
      pokemon.fusionAbilityIndex = 0;
      pokemon.fusionSpecies = SpeciesId.BATTLE_BOND_GRENINJA;
    } else {
      pokemon.fusionAbilityIndex = 0;
    }
  }
}

/**
 * Migrate a pokemon entry that may have had hisui basculin form
 * @param pokemon - The pokemon object to migrate; will be updated in place
 */
function migrateSessionHisuiBasculin(pokemon: PokemonData, replaceSpecies: boolean): void {
  if (pokemon.species === SpeciesId.BASCULIN && pokemon.formIndex === 2) {
    if (replaceSpecies) {
      pokemon.species = SpeciesId.HISUI_BASCULIN;
    }
    pokemon.formIndex = 0;
  }

  if (pokemon.fusionSpecies === SpeciesId.BASCULIN && pokemon.fusionFormIndex === 2) {
    pokemon.fusionFormIndex = 0;
    if (replaceSpecies) {
      pokemon.fusionSpecies = SpeciesId.HISUI_BASCULIN;
    }
  }
}

/**
 * Migrator for battle bond froakie line and hisui basculin form, both of which
 * split into their own species in 1.12.0.0
 */
const migrateSpeciesSplitSession: SessionSaveMigrator = {
  version: "1.12.0.0",
  migrate: (data: SessionSaveData): void => {
    // Grab the mono-gen challenge number, used to avoid replacing species
    // which could potentially brick existing monogen runs.
    const monoGenChallenge = data.challenges?.find(c => c.id === 0)?.value;

    for (const pokemon of [...data.party, ...data.enemyParty]) {
      // NB: Due to fusions, the two migrators are not mutually exclusive
      migrateSessionHisuiBasculin(pokemon, monoGenChallenge !== 5);
      migrateSessionGreninjaBattleBondForm(pokemon, monoGenChallenge !== 6);
    }
  },
};

const migrateRageFistHitCount: SessionSaveMigrator = {
  version: "1.12.0.0",
  migrate: (data: SessionSaveData): void => {
    for (const p of data.party.concat(data.enemyParty)) {
      p.summonData.hitCount = p.battleData.hitCount;
    }
  },
};

const convertCustomPokemonDataTypes: SessionSaveMigrator = {
  version: "1.12.0.0",
  migrate: (data: SessionSaveData): void => {
    for (const p of data.party) {
      if (p.customPokemonData?.types?.length > 0) {
        p.customPokemonData.types = p.customPokemonData.types.map(t =>
          (t as PokemonType) === PokemonType.UNKNOWN ? null : t,
        );
      }
      if (p.fusionCustomPokemonData?.types?.length > 0) {
        p.fusionCustomPokemonData.types = p.fusionCustomPokemonData.types.map(t =>
          (t as PokemonType) === PokemonType.UNKNOWN ? null : t,
        );
      }
    }
  },
};

/** Shift the form change item values upward to account for newly added Mega Stones. */
const shiftFormChangeItems: SessionSaveMigrator = {
  version: "1.12.0.0",
  migrate: (data: SessionSaveData) => {
    // Shifting these up by 50 will work for now, but a more permanent solution will be desired in the future
    const shiftAmount = 50;
    for (const modifier of data.modifiers ?? []) {
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

export const sessionMigrators: readonly SessionSaveMigrator[] = [
  migrateRageFistHitCount,
  convertCustomPokemonDataTypes,
  shiftFormChangeItems,
  migrateSpeciesSplitSession,
] as const;

export const systemMigrators: readonly SystemSaveMigrator[] = [migrateSpeciesSplitSystem] as const;
