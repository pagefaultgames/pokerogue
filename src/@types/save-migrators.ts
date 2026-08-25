import type { PokemonData } from "#system/pokemon-data";
import type { SessionSaveData, SystemSaveData } from "#types/save-data";
import type { CoercePropertiesToUnknown, NonFunctionProperties } from "#types/type-helpers";
import type { GreaterThan } from "type-fest";

// #region Versioning

/** A version string that predates 1.12.0. */
type LegacyVersionString = `1.${number}.${number}`;
/** A version string that succeeds 1.12.0. */
type ModernVersionString = `1.${number}.${number}.${number}`;

/** Type representing any arbitrary version string, either legacy or modern.*/
export type VersionString = LegacyVersionString | ModernVersionString;

/**
 * Split a version string into its major, minor, and patch components.
 * @typeParam T - The version string to split
 * @returns A tuple of the form `[major, minor, patch]`.
 */
type SplitVersionString<T extends VersionString> =
  T extends `1.${infer Major extends number}.${infer MinorAndMaybePatch extends number | `${number}.${number}`}`
    ? MinorAndMaybePatch extends `${infer Minor extends number}.${infer Patch extends number}`
      ? [Major, Minor, Patch] // modern
      : [Major, MinorAndMaybePatch, 0] // legacy (MinorAndMaybePatch is `number`)
    : never;

/**
 * Type to compare 2 version numbers.
 * @returns `1` if `V1` is greater than `V2`, `-1` if `V1` is less than `V2`, or `0` if they are equal.
 * Returns `-1 | 0 | 1` if either one is not a specific version string.
 */
export type CompareVersions<V1 extends VersionString, V2 extends VersionString> = [VersionString] extends [V1 | V2]
  ? -1 | 0 | 1
  : SplitVersionString<V1> extends [
        infer Major1 extends number,
        infer Minor1 extends number,
        infer Patch1 extends number,
      ]
    ? SplitVersionString<V2> extends [
        infer Major2 extends number,
        infer Minor2 extends number,
        infer Patch2 extends number,
      ]
      ? PairwiseCmp<[[Major1, Major2], [Minor1, Minor2], [Patch1, Patch2]]>
      : never
    : never;

/**
 * Tail-recursively compare a set of tuples, prioritizing earlier ones first.
 */
type PairwiseCmp<P extends readonly [number, number][]> = P extends []
  ? 0
  : P extends [[infer A extends number, infer B extends number], ...infer Rest extends readonly [number, number][]]
    ? number extends A | B
      ? -1 | 0 | 1
      : A extends B
        ? PairwiseCmp<Rest>
        : GreaterThan<A, B> extends true
          ? 1
          : -1
    : never;

/**
 * @returns Whether the given array of versions is sorted in non-decreasing order.
 */
export type AreVersionsSorted<V extends readonly VersionString[]> = V extends [] | readonly [VersionString]
  ? true
  : V extends readonly [
        infer First extends VersionString,
        infer Second extends VersionString,
        ...infer Rest extends readonly VersionString[],
      ]
    ? [CompareVersions<First, Second>] extends [infer C extends -1 | 0 | 1]
      ? C extends -1 | 0 // First <= Second
        ? AreVersionsSorted<[Second, ...Rest]>
        : false
      : boolean
    : never;

// #endregion Versioning

/**
 * Interface for the type of the elements of `party` and `enemyParty` properties
 * of {@linkcode SessionSaveMigratorIn}.
 */
interface SessionSavePokemonDataIn extends CoercePropertiesToUnknown<NonFunctionProperties<PokemonData>> {
  [key: string]: unknown;
}

/**
 * Interface for the input data of session migrators.
 * @see {@linkcode SessionSaveMigrator}
 */
export interface SessionSaveMigratorIn
  extends CoercePropertiesToUnknown<Omit<SessionSaveData, "party" | "enemyParty" | "gameVersion">>,
    Pick<SessionSaveData, "gameVersion"> {
  /**
   * @privateRemarks
   * Due to the field's ubiquitous use in migrators,
   * party being an array of objects is validated prior to running any migrators.
   */
  party: SessionSavePokemonDataIn[];
  /**
   * @privateRemarks
   * Due to the field's ubiquitous use in migrators,
   * enemyParty being an array of objects is validated prior to running any migrators.
   */
  enemyParty: SessionSavePokemonDataIn[];
  [key: string]: unknown;
}

/**
 * Interface representing an arbitrary save migrator.
 * @typeParam Data - The type of data to be migrated
 */
export interface SaveMigrator<Data extends object = any> {
  /**
   * The name of the migrator.
   * Should match the migrator's purpose.
   */
  readonly name: string;
  /**
   * The {@linkcode VersionString} that this migrator is intended to migrate from.
   * Should be the version immediately preceding the version that this migrator migrates to.
   * @remarks
   * For example, if a migrator is intended to migrate saves from before v1.5.0 to v1.5.1+,
   * its `version` property should be `"1.5.0"`.
   */
  readonly version: VersionString;
  /**
   * Migrate the given data to the next version.
   * @param data - The data to migrate
   */
  readonly migrate: (data: Data) => void;
}

export type SessionSaveMigrator = SaveMigrator<SessionSaveMigratorIn>;

export type SettingsSaveMigrator = SaveMigrator<object>;

export type SystemSaveMigrator = SaveMigrator<SystemSaveData>;
