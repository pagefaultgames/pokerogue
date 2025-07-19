import type { ArenaTagTypeMap } from "#data/arena-tag";
import type { ArenaTagType } from "#enums/arena-tag-type";
import type { NonFunctionProperties } from "./type-helpers";

/** Subset of {@linkcode ArenaTagType}s that are considered traps */
export type ArenaTrapTagType =
  | ArenaTagType.STICKY_WEB
  | ArenaTagType.SPIKES
  | ArenaTagType.TOXIC_SPIKES
  | ArenaTagType.STEALTH_ROCK
  | ArenaTagType.IMPRISON;

/** Subset of {@linkcode ArenaTagType}s that are considered delayed attacks */
export type ArenaDelayedAttackTagType = ArenaTagType.FUTURE_SIGHT | ArenaTagType.DOOM_DESIRE;

/** Subset of {@linkcode ArenaTagType}s that work like screens */
export type ArenaScreenTagType = ArenaTagType.REFLECT | ArenaTagType.LIGHT_SCREEN | ArenaTagType.AURORA_VEIL;

/** Subset of {@linkcode ArenaTagType}s for moves that add protection */
export type TurnProtectArenaTagType =
  | ArenaTagType.QUICK_GUARD
  | ArenaTagType.WIDE_GUARD
  | ArenaTagType.MAT_BLOCK
  | ArenaTagType.CRAFTY_SHIELD;

/** Subset of {@linkcode ArenaTagType}s that cannot persist across turns, and thus should not be serialized in `SessionSaveData`. */
export type NonSerializableArenaTagType = ArenaTagType.NONE | TurnProtectArenaTagType | ArenaTagType.ION_DELUGE;

/** Subset of {@linkcode ArenaTagType}s that may persist across turns, and thus may be serialized in `SessionSaveData` */
export type SerializableArenaTagType = Exclude<ArenaTagType, NonSerializableArenaTagType>;

/**
 * Type-safe representation of the serializable data of an ArenaTag
 */
export type ArenaTagTypeData = NonFunctionProperties<
  ArenaTagTypeMap[keyof {
    [K in keyof ArenaTagTypeMap as K extends SerializableArenaTagType ? K : never]: ArenaTagTypeMap[K];
  }]
>;

/** Dummy, typescript-only declaration to ensure that
 * {@linkcode ArenaTagTypeMap} has a map for all ArenaTagTypes.
 *
 * If an arena tag is missing from the map, typescript will throw an error on this statement.
 *
 * ⚠️ Does not actually exist at runtime, so it must not be used!
 */
declare const EnsureAllArenaTagTypesAreMapped: ArenaTagTypeMap[ArenaTagType] & never;
