import { Z$NonNegativeInt, Z$PositiveInt } from "#system/schemas/common";
import { Z$BattlerIndex } from "#system/schemas/v1.10/battler-index";
import { z } from "zod";

/*
Schemas for battler tags are a bit more cumbersome,
as we need to have schemas for each subclass that has a different shape.
*/

/**
 * Zod schema for the {@linkcode BattlerTagType} enum as of version 1.10
 */
const Z$BattlerTagType = z.literal([
  "NONE",
  "RECHARGING",
  "FLINCHED",
  "INTERRUPTED",
  "CONFUSED",
  "INFATUATED",
  "SEEDED",
  "NIGHTMARE",
  "FRENZY",
  "CHARGING",
  "ENCORE",
  "HELPING_HAND",
  "INGRAIN",
  "OCTOLOCK",
  "AQUA_RING",
  "DROWSY",
  "TRAPPED",
  "BIND",
  "WRAP",
  "FIRE_SPIN",
  "WHIRLPOOL",
  "CLAMP",
  "SAND_TOMB",
  "MAGMA_STORM",
  "SNAP_TRAP",
  "THUNDER_CAGE",
  "INFESTATION",
  "PROTECTED",
  "SPIKY_SHIELD",
  "KINGS_SHIELD",
  "OBSTRUCT",
  "SILK_TRAP",
  "BANEFUL_BUNKER",
  "BURNING_BULWARK",
  "ENDURING",
  "STURDY",
  "PERISH_SONG",
  "TRUANT",
  "SLOW_START",
  "PROTOSYNTHESIS",
  "QUARK_DRIVE",
  "FLYING",
  "UNDERGROUND",
  "UNDERWATER",
  "HIDDEN",
  "FIRE_BOOST",
  "CRIT_BOOST",
  "ALWAYS_CRIT",
  "IGNORE_ACCURACY",
  "BYPASS_SLEEP",
  "IGNORE_FLYING",
  "SALT_CURED",
  "CURSED",
  "CHARGED",
  "ROOSTED",
  "FLOATING",
  "MINIMIZED",
  "DESTINY_BOND",
  "CENTER_OF_ATTENTION",
  "ICE_FACE",
  "DISGUISE",
  "STOCKPILING",
  "RECEIVE_DOUBLE_DAMAGE",
  "ALWAYS_GET_HIT",
  "DISABLED",
  "SUBSTITUTE",
  "IGNORE_GHOST",
  "IGNORE_DARK",
  "GULP_MISSILE_ARROKUDA",
  "GULP_MISSILE_PIKACHU",
  "BEAK_BLAST_CHARGING",
  "SHELL_TRAP",
  "DRAGON_CHEER",
  "NO_RETREAT",
  "GORILLA_TACTICS",
  "UNBURDEN",
  "THROAT_CHOPPED",
  "TAR_SHOT",
  "BURNED_UP",
  "DOUBLE_SHOCKED",
  "AUTOTOMIZED",
  "MYSTERY_ENCOUNTER_POST_SUMMON",
  "POWER_TRICK",
  "HEAL_BLOCK",
  "TORMENT",
  "TAUNT",
  "IMPRISON",
  "SYRUP_BOMB",
  "ELECTRIFIED",
  "TELEKINESIS",
  "COMMANDED",
  "GRUDGE",
  "PSYCHO_SHIFT",
  "ENDURE_TOKEN",
  "POWDER",
  "MAGIC_COAT",
]);

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
const Z$BattlerTagLapseType = z.literal([0, 1, 2, 3, 4, 5, 6, 7, 8]);

// DamagingTrapTag may have a `commonAnim` field, though it's always instantiated.
const Z$BattlerTag = z.object({
    tagType: Z$BattlerTagType,
    lapseTypes: z.array(Z$BattlerTagLapseType),
    turnCount: Z$PositiveInt,
    // Source move can be `none` for tags not applied by move, so allow `0` here.
    sourceMove: Z$NonNegativeInt,
    sourceId: z.int().optional().catch(undefined),
    isBatonPassable: z.boolean(),
});

export const Z$SeedTag = z.object({
    ...Z$BattlerTag.shape,
    seedType: z.literal("SEEDED"),
    sourceIndex: Z$BattlerIndex,
})
