import type { ArenaTagTypeMap } from "#data/arena-tag";
import type { ArenaTagType } from "#enums/arena-tag-type";
// biome-ignore lint/correctness/noUnusedImports: TSDocs
import type { SessionSaveData } from "#system/game-data";
import type { ObjectValues } from "#types/type-helpers";

/** Subset of {@linkcode ArenaTagType}s that apply some negative effect to pokemon that switch in ({@link https://bulbapedia.bulbagarden.net/wiki/List_of_moves_that_cause_entry_hazards#List_of_traps | entry hazards} and Imprison. */
export type EntryHazardTagType =
  | ArenaTagType.STICKY_WEB
  | ArenaTagType.SPIKES
  | ArenaTagType.TOXIC_SPIKES
  | ArenaTagType.STEALTH_ROCK
  | ArenaTagType.IMPRISON;

/** Subset of {@linkcode ArenaTagType}s that create {@link https://bulbapedia.bulbagarden.net/wiki/Category:Screen-creating_moves | screens}. */
export type ArenaScreenTagType = ArenaTagType.REFLECT | ArenaTagType.LIGHT_SCREEN | ArenaTagType.AURORA_VEIL;

/** Subset of {@linkcode ArenaTagType}s for moves that add protection */
export type TurnProtectArenaTagType =
  | ArenaTagType.QUICK_GUARD
  | ArenaTagType.WIDE_GUARD
  | ArenaTagType.MAT_BLOCK
  | ArenaTagType.CRAFTY_SHIELD;

/** Subset of {@linkcode ArenaTagType}s that create Trick Room-like effects which are removed upon overlap. */
export type RoomArenaTagType = ArenaTagType.TRICK_ROOM;

/** Subset of {@linkcode ArenaTagType}s that are **not** able to persist across turns, and should therefore not be serialized in {@linkcode SessionSaveData}. */
export type NonSerializableArenaTagType = ArenaTagType.NONE | TurnProtectArenaTagType | ArenaTagType.ION_DELUGE;

/** Subset of {@linkcode ArenaTagType}s that may persist across turns, and thus must be serialized in {@linkcode SessionSaveData}. */
export type SerializableArenaTagType = Exclude<ArenaTagType, NonSerializableArenaTagType>;

/**
 * Utility type containing all entries of {@linkcode ArenaTagTypeMap} corresponding to serializable tags.
 */
type SerializableArenaTagTypeMap = Pick<ArenaTagTypeMap, SerializableArenaTagType>;

/**
 * Type mapping all `ArenaTag`s to type-safe representations of their serialized forms.
 * @interface
 */
export type ArenaTagDataMap = {
  [k in keyof SerializableArenaTagTypeMap]: Parameters<SerializableArenaTagTypeMap[k]["loadTag"]>[0];
};

/**
 * Type-safe representation of an arbitrary, serialized `ArenaTag`.
 */
export type ArenaTagData = ObjectValues<ArenaTagDataMap>;

/**
 * Dummy, typescript-only declaration to ensure that
 * {@linkcode ArenaTagTypeMap} has a map for all ArenaTagTypes.
 *
 * If an arena tag is missing from the map, typescript will throw an error on this statement.
 *
 * ⚠️ Does not actually exist at runtime, so it must not be used!
 */
declare const EnsureAllArenaTagTypesAreMapped: ArenaTagTypeMap[ArenaTagType] & never;
