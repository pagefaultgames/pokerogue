import { loggedInUser } from "#app/account";
import type { PokemonType } from "#enums/pokemon-type";
import type { SpeciesId } from "#enums/species-id";
import type { Variant } from "#sprites/variant";
import type { AllStarterPreferences, StarterPreferences } from "#types/save-data";
import type { SystemSaveMigrator } from "#types/save-migrators";
import { saveStarterPreferences } from "#utils/data";

// #region Frozen Types

// These types are frozen copies of the types as they exist currently.
// This is done so later changes do not interfere with the migrators,
// which should be "frozen in time".

interface OldStarterAttributes {
  nature?: number | undefined;
  ability?: number | undefined;
  variant?: number | undefined;
  form?: number | undefined;
  female?: boolean | undefined;
  shiny?: boolean | undefined;
  favorite?: boolean | undefined;
  nickname?: string | undefined;
  tera?: PokemonType | undefined;
}

type OldStarterPreferences = Partial<Record<SpeciesId, OldStarterAttributes | undefined>>;

// #endregion Frozen Enums

// #region Key migration

function mapStaterPreferences(attr: OldStarterAttributes): StarterPreferences {
  return {
    nature: attr.nature,
    abilityIndex: attr.ability,
    variant: attr.variant as Variant,
    formIndex: attr.form,
    female: attr.female,
    shiny: attr.shiny,
    favorite: attr.favorite,
    nickname: attr.nickname,
    tera: attr.tera,
  };
}

// #endregion Key migration

// #region Migrators

const migrateStarterPreferences: SystemSaveMigrator = {
  name: "migrateStarterPreferences",
  version: "1.12.2.0",
  migrate: (_data: object): void => {
    const oldStarterPreferences = JSON.parse(
      localStorage.getItem(`starterPrefs_${loggedInUser?.username}`) ?? "{}",
    ) as OldStarterPreferences;

    const newStarterPreferences: AllStarterPreferences = {};

    for (const speciesId of Object.keys(oldStarterPreferences)) {
      newStarterPreferences[speciesId] = mapStaterPreferences(oldStarterPreferences[speciesId] ?? {});
    }

    saveStarterPreferences(newStarterPreferences);
  },
};

export const systemMigrators: readonly SystemSaveMigrator[] = [migrateStarterPreferences] as const;

// #endregion Migrators
