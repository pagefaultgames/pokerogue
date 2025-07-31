// biome-ignore-start lint/correctness/noUnusedImports: used in tsdoc comment
import { type ArenaTrapTag, loadArenaTag, type SerializableArenaTag } from "#data/arena-tag";
import type { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
// biome-ignore-end lint/correctness/noUnusedImports: end

import { Z$NonNegativeInt, Z$PositiveInt } from "#system/schemas/common";
import type { ArenaTrapTagType, SerializableArenaTagType } from "#types/arena-tags";
import type { DiscriminatedUnionFake } from "#types/schema-helpers";
import { z } from "zod";

/**
 * Zod schema for {@linkcode ArenaTagSide} as of version 1.10
 *
 * @remarks
 * - `0`: BOTH
 * - `1`: PLAYER
 * - `2`: ENEMY
 */
export const Z$ArenaTagSide = z.literal([0, 1, 2]);

/**
 * The base shape of an arena tag, consisting of all of the fields other than
 * Zod schema for {@linkcode SerializableArenaTag} as of version 1.10
 */
const Z$BaseArenaTag = z.object({
  turnCount: z.int(),
  sourceMove: Z$NonNegativeInt.optional().catch(undefined),
  sourceId: z.int().or(z.undefined()).catch(undefined),
  side: Z$ArenaTagSide,
});

// #region typescript-hackery to extract out the proper zod schema type

/**
 * Arena tag type that has no extra additional fields.
 */
type BasicArenaTag =
  | Exclude<SerializableArenaTagType, ArenaTagType.NEUTRALIZING_GAS | ArenaTrapTagType>
  | ArenaTagType.NONE;

//#endregion: typescript-hackery

/**
 * Zod enum for arena tags with no additional properties.
 * If a new ArenaTagType that has no additional properties is added,
 * this MUST be updated to include it.
 */
const Z$BaseArenaTagEnum = z.literal([
  ArenaTagType.NONE,
  ArenaTagType.MUD_SPORT,
  ArenaTagType.WATER_SPORT,
  ArenaTagType.MIST,
  ArenaTagType.TRICK_ROOM,
  ArenaTagType.GRAVITY,
  ArenaTagType.REFLECT,
  ArenaTagType.LIGHT_SCREEN,
  ArenaTagType.AURORA_VEIL,
  ArenaTagType.TAILWIND,
  ArenaTagType.HAPPY_HOUR,
  ArenaTagType.SAFEGUARD,
  ArenaTagType.NO_CRIT,
  ArenaTagType.FIRE_GRASS_PLEDGE,
  ArenaTagType.WATER_FIRE_PLEDGE,
  ArenaTagType.GRASS_WATER_PLEDGE,
  ArenaTagType.FAIRY_LOCK,
]) satisfies z.ZodLiteral<BasicArenaTag | ArenaTagType.NONE>;

/**
 * Zod schema for the subset of {@linkcode ArenaTagType}s
 * that add no additional serializable fields.
 */
const Z$PlainArenaTag = z.object({
  ...Z$BaseArenaTag.shape,
  tagType: Z$BaseArenaTagEnum,
}) as DiscriminatedUnionFake<BasicArenaTag, typeof Z$BaseArenaTag.shape, "tagType">;

const Z$BaseTrapTag = /** __@PURE__ */ z.object({
  ...Z$BaseArenaTag.shape,
  layers: z.int().min(1).max(3).catch(1),
  maxLayers: z.int().min(1).max(3),
});

/**
 * Zod schema for {@linkcode ArenaTrapTag} as of version 1.10
 */
const Z$ArenaTrapTag = /** __@PURE__ */ z.object({
  ...Z$BaseTrapTag.shape,
  tagType: z.literal([
    ArenaTagType.STICKY_WEB,
    ArenaTagType.SPIKES,
    ArenaTagType.TOXIC_SPIKES,
    ArenaTagType.STEALTH_ROCK,
    ArenaTagType.IMPRISON,
  ] satisfies ArenaTrapTagType[]),
}) as DiscriminatedUnionFake<ArenaTrapTagType, typeof Z$BaseTrapTag.shape, "tagType">;

/**
 * Zod schema for {@linkcode ArenaTagType.NEUTRALIZING_GAS} as of version 1.10
 */
const Z$SuppressAbilitiesTag = /** __@PURE__ */ z.object({
  ...Z$BaseArenaTag.shape,
  tagType: z.literal(ArenaTagType.NEUTRALIZING_GAS),
  sourceCount: Z$PositiveInt,
});

/**
 * Zod schema for {@linkcode SerializableArenaTag}s as of version 1.10,
 * also permitting "NoneTag".
 */
export const Z$ArenaTag = z.discriminatedUnion("tagType", [Z$ArenaTrapTag, Z$SuppressAbilitiesTag, Z$PlainArenaTag]);
