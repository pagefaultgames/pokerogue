import { BattlerTagType } from "#enums/battler-tag-type";
import { Z$NonNegativeInt, Z$PositiveInt } from "#system/schemas/common";
import { Z$BattlerIndex } from "#system/schemas/pokemon/battler-index";
import { Z$Stat } from "#system/schemas/pokemon/pokemon-stats";
import type {
  BattlerTagTypeWithMoveId,
  HighestStatBoostTagType,
  SerializableBattlerTagType,
} from "#types/battler-tags";
import type { DiscriminatedUnionFake } from "#types/schema-helpers";
import { z } from "zod";

/*
Schemas for battler tags are a bit more cumbersome,
as we need to have schemas for each subclass that has a different shape.
*/

type BasicBattlerTag = Exclude<SerializableBattlerTagType, BattlerTagTypeWithMoveId | HighestStatBoostTagType>;

/**
 * Zod enum of {@linkcode BattlerTagType}s whose associated `BattlerTag` adds no
 * additional fields that are serialized.
 *
 */
const Z$BaseBattlerTags = /** @__PURE__ */ z.literal([
  BattlerTagType.RECHARGING,
  BattlerTagType.CONFUSED,
  BattlerTagType.INFATUATED,
  BattlerTagType.SEEDED,
  BattlerTagType.NIGHTMARE,
  BattlerTagType.FRENZY,
  BattlerTagType.CHARGING,
  BattlerTagType.ENCORE,
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
  BattlerTagType.STURDY,
  BattlerTagType.PERISH_SONG,
  BattlerTagType.TRUANT,
  BattlerTagType.SLOW_START,
  BattlerTagType.PROTOSYNTHESIS,
  BattlerTagType.QUARK_DRIVE,
  BattlerTagType.FLYING,
  BattlerTagType.UNDERGROUND,
  BattlerTagType.UNDERWATER,
  BattlerTagType.HIDDEN,
  BattlerTagType.FIRE_BOOST,
  BattlerTagType.CRIT_BOOST,
  BattlerTagType.ALWAYS_CRIT,
  BattlerTagType.IGNORE_ACCURACY,
  BattlerTagType.BYPASS_SLEEP,
  BattlerTagType.IGNORE_FLYING,
  BattlerTagType.SALT_CURED,
  BattlerTagType.CURSED,
  BattlerTagType.CHARGED,
  BattlerTagType.FLOATING,
  BattlerTagType.MINIMIZED,
  BattlerTagType.DESTINY_BOND,
  BattlerTagType.ICE_FACE,
  BattlerTagType.DISGUISE,
  BattlerTagType.STOCKPILING,
  BattlerTagType.RECEIVE_DOUBLE_DAMAGE,
  BattlerTagType.ALWAYS_GET_HIT,
  BattlerTagType.DISABLED,
  BattlerTagType.SUBSTITUTE,
  BattlerTagType.IGNORE_GHOST,
  BattlerTagType.IGNORE_DARK,
  BattlerTagType.GULP_MISSILE_ARROKUDA,
  BattlerTagType.GULP_MISSILE_PIKACHU,
  BattlerTagType.DRAGON_CHEER,
  BattlerTagType.NO_RETREAT,
  BattlerTagType.GORILLA_TACTICS,
  BattlerTagType.UNBURDEN,
  BattlerTagType.THROAT_CHOPPED,
  BattlerTagType.TAR_SHOT,
  BattlerTagType.BURNED_UP,
  BattlerTagType.DOUBLE_SHOCKED,
  BattlerTagType.AUTOTOMIZED,
  BattlerTagType.POWER_TRICK,
  BattlerTagType.HEAL_BLOCK,
  BattlerTagType.TORMENT,
  BattlerTagType.TAUNT,
  BattlerTagType.IMPRISON,
  BattlerTagType.SYRUP_BOMB,
  BattlerTagType.TELEKINESIS,
  BattlerTagType.COMMANDED,
  BattlerTagType.GRUDGE,
] satisfies SerializableBattlerTagType[]);

/**
 * Zod schema for {@linkcode BattlerTagLapseType} as of version 1.10
 * @remarks
 * - `0`: Faint
 * - `1`: Move
 * - `2`: Pre-Move
 * - `3`: After Move
 * - `4`: Move Effect
 * - `5`: Turn End
 * - `6`: Hit
 * - `7`: After Hit
 * - `8`: Custom
 */
const Z$BattlerTagLapseType = /** @__PURE__ */ z.literal([0, 1, 2, 3, 4, 5, 6, 7, 8]);

const Z$BaseBattlerTag = /** @__PURE__ */ z.object({
  turnCount: Z$PositiveInt,
  // Source move can be `none` for tags not applied by move, so allow `0` here.
  sourceMove: Z$NonNegativeInt.optional().catch(undefined),
  sourceId: z.int().optional().catch(undefined),
});

const Z$BaseTagWithMoveId = z.object({
  ...Z$BaseBattlerTag.shape,
  moveId: Z$PositiveInt,
});

/** Subset of battler tags that have a moveID field */
const Z$TagWithMoveId = /** @__PURE__ */ z.object({
  ...Z$BaseTagWithMoveId.shape,
  tagType: z.literal([BattlerTagType.DISABLED, BattlerTagType.GORILLA_TACTICS, BattlerTagType.ENCORE]),
  moveId: Z$PositiveInt,
}) as DiscriminatedUnionFake<
  BattlerTagType.DISABLED | BattlerTagType.GORILLA_TACTICS | BattlerTagType.ENCORE,
  typeof Z$TagWithMoveId.shape,
  "tagType"
>;

const Z$SeedTag = /** @__PURE__ */ z.object({
  ...Z$BaseBattlerTag.shape,
  tagType: z.literal(BattlerTagType.SEEDED),
  sourceIndex: Z$BattlerIndex,
});

const Z$BaseHighestStatBoostTag = /** @__PURE__ */ z.object({
  ...Z$BaseBattlerTag.shape,
  stat: Z$Stat,
  multiplier: z.number(),
});

const Z$HighestStatBoostTag = /** @__PURE__ */ z.object({
  ...Z$BaseHighestStatBoostTag.shape,
  tagType: z.literal([BattlerTagType.QUARK_DRIVE, BattlerTagType.PROTOSYNTHESIS] satisfies HighestStatBoostTagType[]),
}) as DiscriminatedUnionFake<HighestStatBoostTagType, typeof Z$HighestStatBoostTag.shape, "tagType">;

const Z$CommandedTag = /** @__PURE__ */ z.object({
  ...Z$BaseBattlerTag.shape,
  tagType: z.literal(BattlerTagType.COMMANDED),
  tatsugiriFormKey: z.string().catch("curly"),
});

const Z$StockpilingTag = /** @__PURE__ */ z.object({
  ...Z$BaseBattlerTag.shape,
  tagType: z.literal(BattlerTagType.STOCKPILING),
  stockpiledCount: Z$PositiveInt.catch(1),
  statChangeCounts: z.object({
    [2]: z.int().min(-6).max(6).catch(0), // Defense
    [4]: z.int().min(-6).max(6).catch(0), // Special Defense
  }),
});

const Z$AutotomizedTag = /** @__PURE__ */ z.object({
  ...Z$BaseBattlerTag.shape,
  tagType: z.literal(BattlerTagType.AUTOTOMIZED),
  autotomizeCount: Z$PositiveInt.catch(1),
});

const Z$SubstituteTag = /** @__PURE__ */ z.object({
  ...Z$BaseBattlerTag.shape,
  tagType: z.literal(BattlerTagType.SUBSTITUTE),
  hp: Z$PositiveInt,
});
