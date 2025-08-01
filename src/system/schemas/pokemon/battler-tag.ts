import { loadBattlerTag } from "#data/battler-tags";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Z$NonNegativeInt, Z$PositiveInt } from "#system/schemas/common";
import { Z$BattlerIndex } from "#system/schemas/pokemon/battler-index";
import { Z$Stat } from "#system/schemas/pokemon/pokemon-stats";
import type { BasicBattlerTag, BattlerTagTypeWithMoveId, HighestStatBoostTagType } from "#types/battler-tags";
import type { DiscriminatedUnionFake } from "#types/schema-helpers";
import { z } from "zod";

/*
Schemas for battler tags are a bit more cumbersome,
as we need to have schemas for each subclass that has a different shape.
*/

/**
 * Zod enum of {@linkcode BattlerTagType}s whose associated `BattlerTag` adds no
 * additional fields that are serialized.
 */
const BasicBattlerTag = z.literal([
  BattlerTagType.RECHARGING,
  BattlerTagType.CONFUSED,
  BattlerTagType.INFATUATED,
  BattlerTagType.NIGHTMARE,
  BattlerTagType.FRENZY,
  BattlerTagType.CHARGING,
  BattlerTagType.INGRAIN,
  BattlerTagType.OCTOLOCK,
  BattlerTagType.AQUA_RING,
  BattlerTagType.DROWSY,
  BattlerTagType.TRAPPED,
  BattlerTagType.BIND,
  BattlerTagType.WRAP,
  BattlerTagType.FIRE_SPIN,
  BattlerTagType.WHIRLPOOL,
  BattlerTagType.CLAMP,
  BattlerTagType.SAND_TOMB,
  BattlerTagType.MAGMA_STORM,
  BattlerTagType.SNAP_TRAP,
  BattlerTagType.THUNDER_CAGE,
  BattlerTagType.INFESTATION,
  BattlerTagType.PERISH_SONG,
  BattlerTagType.TRUANT,
  BattlerTagType.SLOW_START,
  BattlerTagType.FLYING,
  BattlerTagType.UNDERGROUND,
  BattlerTagType.UNDERWATER,
  BattlerTagType.HIDDEN,
  BattlerTagType.FIRE_BOOST,
  BattlerTagType.CRIT_BOOST,
  BattlerTagType.ALWAYS_CRIT,
  BattlerTagType.IGNORE_ACCURACY,
  BattlerTagType.IGNORE_FLYING,
  BattlerTagType.SALT_CURED,
  BattlerTagType.CURSED,
  BattlerTagType.CHARGED,
  BattlerTagType.FLOATING,
  BattlerTagType.MINIMIZED,
  BattlerTagType.DESTINY_BOND,
  BattlerTagType.ICE_FACE,
  BattlerTagType.DISGUISE,
  BattlerTagType.RECEIVE_DOUBLE_DAMAGE,
  BattlerTagType.ALWAYS_GET_HIT,
  BattlerTagType.IGNORE_GHOST,
  BattlerTagType.IGNORE_DARK,
  BattlerTagType.GULP_MISSILE_ARROKUDA,
  BattlerTagType.GULP_MISSILE_PIKACHU,
  BattlerTagType.DRAGON_CHEER,
  BattlerTagType.NO_RETREAT,
  BattlerTagType.UNBURDEN,
  BattlerTagType.THROAT_CHOPPED,
  BattlerTagType.TAR_SHOT,
  BattlerTagType.BURNED_UP,
  BattlerTagType.DOUBLE_SHOCKED,
  BattlerTagType.POWER_TRICK,
  BattlerTagType.HEAL_BLOCK,
  BattlerTagType.TORMENT,
  BattlerTagType.TAUNT,
  BattlerTagType.IMPRISON,
  BattlerTagType.SYRUP_BOMB,
  BattlerTagType.TELEKINESIS,
  BattlerTagType.GRUDGE,
] satisfies BasicBattlerTag[]);

const Z$BaseBattlerTag = z.object({
  turnCount: Z$PositiveInt,
  // Source move can be `none` for tags not applied by move, so allow `0` here.
  sourceMove: Z$NonNegativeInt.optional().catch(undefined),
  sourceId: z.int().optional().catch(undefined),
});

const Z$BaseTagWithMoveId = z.object({
  ...Z$BaseBattlerTag.shape,
  moveId: Z$PositiveInt,
});

/**
 * Zod schema for a basic {@linkcode BattlerTag} (i.e., one that does not have
 * additional fields beyond the base `BattlerTag`).
 */
const Z$PlainBattlerTag = z.object({
  ...Z$BaseBattlerTag.shape,
  tagType: BasicBattlerTag,
}) as DiscriminatedUnionFake<BasicBattlerTag, typeof Z$PlainBattlerTag.shape, "tagType">;

/** Subset of battler tags that have a moveID field */
const Z$TagWithMoveId = z.object({
  ...Z$BaseTagWithMoveId.shape,
  tagType: z.literal([
    BattlerTagType.DISABLED,
    BattlerTagType.GORILLA_TACTICS,
    BattlerTagType.ENCORE,
  ] satisfies BattlerTagTypeWithMoveId[]),
  moveId: Z$PositiveInt,
}) as DiscriminatedUnionFake<BattlerTagTypeWithMoveId, typeof Z$TagWithMoveId.shape, "tagType">;

/**
 * Zod schema for {@linkcode SeedTag} as of version 1.10.
 */
const Z$SeedTag = z.object({
  ...Z$BaseBattlerTag.shape,
  tagType: z.literal(BattlerTagType.SEEDED),
  sourceIndex: Z$BattlerIndex,
});

/**
 * Zod schema for {@linkcode HighestStatBoostTag} as of version 1.10.
 */
const Z$BaseHighestStatBoostTag = z.object({
  ...Z$BaseBattlerTag.shape,
  stat: Z$Stat,
  multiplier: z.number(),
});

const Z$HighestStatBoostTag = z.object({
  ...Z$BaseHighestStatBoostTag.shape,
  tagType: z.literal([BattlerTagType.QUARK_DRIVE, BattlerTagType.PROTOSYNTHESIS] satisfies HighestStatBoostTagType[]),
}) as DiscriminatedUnionFake<HighestStatBoostTagType, typeof Z$HighestStatBoostTag.shape, "tagType">;

const Z$CommandedTag = z.object({
  ...Z$BaseBattlerTag.shape,
  tagType: z.literal(BattlerTagType.COMMANDED),
  tatsugiriFormKey: z.string().catch("curly"),
});

const Z$StockpilingTag = z.object({
  ...Z$BaseBattlerTag.shape,
  tagType: z.literal(BattlerTagType.STOCKPILING),
  stockpiledCount: Z$PositiveInt.catch(1),
  statChangeCounts: z.object({
    [2]: z.int().min(-6).max(6).catch(0), // Defense
    [4]: z.int().min(-6).max(6).catch(0), // Special Defense
  }),
});

const Z$AutotomizedTag = z.object({
  ...Z$BaseBattlerTag.shape,
  tagType: z.literal(BattlerTagType.AUTOTOMIZED),
  autotomizeCount: Z$PositiveInt.catch(1),
});

const Z$SubstituteTag = z.object({
  ...Z$BaseBattlerTag.shape,
  tagType: z.literal(BattlerTagType.SUBSTITUTE),
  // hp: Z$PositiveInt,
});

export const Z$BattlerTag = z.discriminatedUnion("tagType", [Z$SubstituteTag]);

declare const t: any;

const o = Z$BattlerTag.parse(t);

const r = loadBattlerTag(Z$SubstituteTag.parse(t));
