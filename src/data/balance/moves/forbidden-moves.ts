/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { LEVEL_BASED_DENYLIST_THRESHOLD } from "#balance/moves/moveset-generation";
import { MoveId } from "#enums/move-id";

/** Forbidden during movegen if the current battle is not a double battle */
export const FORBIDDEN_SINGLES_MOVES: ReadonlySet<MoveId> = new Set([
  MoveId.AFTER_YOU,
  MoveId.ALLY_SWITCH,
  MoveId.AROMATIC_MIST,
  MoveId.COACHING,
  MoveId.CRAFTY_SHIELD,
  MoveId.DECORATE,
  MoveId.DRAGON_CHEER,
  MoveId.EXPANDING_FORCE, // This needs to be adjusted to only spawn if Psychic Surge / Terrain generates with it.
  MoveId.FLORAL_HEALING,
  MoveId.FOLLOW_ME,
  MoveId.HEAL_PULSE,
  MoveId.HELPING_HAND,
  MoveId.HOLD_HANDS,
  MoveId.INSTRUCT,
  MoveId.MAGNETIC_FLUX,
  MoveId.QUASH,
  MoveId.RAGE_POWDER,
  MoveId.SPOTLIGHT,
  MoveId.PURIFY,
  // Every mon that learns these has protect already and they're not worth it over protect
  MoveId.MAT_BLOCK,
  MoveId.QUICK_GUARD,
  MoveId.WIDE_GUARD,
]);

export const FORBIDDEN_TM_MOVES: ReadonlySet<MoveId> = new Set([
  MoveId.CONFIDE,
  MoveId.DRAGON_CHEER,
  MoveId.DREAM_EATER,
  MoveId.ENDEAVOR,
  MoveId.FALSE_SWIPE,
  MoveId.FLASH,
  MoveId.FOCUS_PUNCH,
  MoveId.GRASSY_GLIDE, // This needs to be adjusted to only spawn if Grassy Surge / Terrain generates with it, generally a gimmick move regardless.
  MoveId.MISTY_EXPLOSION, // This needs to be adjusted to only spawn if Misty Surge / Terrain generates with it, generally a gimmick move regardless.
  MoveId.MEGA_PUNCH,
  MoveId.NIGHT_SHADE,
  MoveId.PAY_DAY,
  MoveId.PSYCH_UP,
  MoveId.RISING_VOLTAGE, // This needs to be adjusted to only spawn if Psychic Surge / Terrain generates with it.
  MoveId.SCARY_FACE,
  MoveId.SKILL_SWAP,
  MoveId.SLEEP_TALK,
  MoveId.SNORE,
  MoveId.STEEL_ROLLER,
  MoveId.TAKE_DOWN,
  MoveId.UPPER_HAND,
  MoveId.VENOM_DRENCH,
  MoveId.STEEL_BEAM, // Potentially revisit after further adjustments to move weighting system, as it stands now this move bloats Steel-type pools too harshly for little benefit.
]);

/**
 * Moves that are prevented from spawning if the mon is at a higher level than {@linkcode LEVEL_BASED_DENYLIST_THRESHOLD}
 */
export const LEVEL_BASED_DENYLIST: ReadonlySet<MoveId> = new Set([
  MoveId.ABSORB,
  MoveId.ACID,
  MoveId.AIR_CUTTER,
  MoveId.ARM_THRUST,
  MoveId.ASSURANCE, // Primarily a doubles move but functions as early game Dark STAB.
  MoveId.ASTONISH,
  MoveId.BABY_DOLL_EYES,
  MoveId.BARRAGE,
  MoveId.BESTOW,
  MoveId.BIDE,
  MoveId.BIND,
  MoveId.BRANCH_POKE,
  MoveId.BONE_CLUB, // Cubone gets better options.
  MoveId.BUBBLE,
  MoveId.CHIP_AWAY,
  MoveId.COMET_PUNCH,
  MoveId.CONFUSION,
  MoveId.CONSTRICT,
  MoveId.CUT,
  MoveId.DEFENSE_CURL,
  MoveId.DISARMING_VOICE,
  MoveId.DOUBLE_SLAP,
  MoveId.DRAGON_BREATH,
  MoveId.DREAM_EATER,
  MoveId.EMBER,
  MoveId.FAIRY_WIND,
  MoveId.FALSE_SWIPE,
  MoveId.FEINT,
  MoveId.FEINT_ATTACK,
  MoveId.FLAIL,
  MoveId.FLAME_BURST,
  MoveId.FLAME_WHEEL,
  MoveId.FORCE_PALM,
  MoveId.FORESIGHT,
  MoveId.FURY_ATTACK,
  MoveId.FURY_SWIPES,
  MoveId.GEAR_UP,
  MoveId.GROWL,
  MoveId.GUST,
  MoveId.HARDEN,
  MoveId.HORN_ATTACK,
  MoveId.KARATE_CHOP,
  MoveId.KINESIS,
  MoveId.LEAFAGE,
  MoveId.LEER,
  MoveId.LICK,
  MoveId.LUCKY_CHANT,
  MoveId.MAGICAL_LEAF,
  MoveId.MAGNET_BOMB,
  MoveId.MEGA_DRAIN,
  MoveId.METAL_CLAW,
  MoveId.MIST,
  MoveId.MUD_SHOT,
  MoveId.MUD_SPORT,
  MoveId.NEEDLE_ARM,
  MoveId.NIGHTMARE,
  MoveId.PECK,
  MoveId.PLAY_NICE,
  MoveId.POISON_STING,
  MoveId.POISON_TAIL,
  MoveId.POUND,
  MoveId.POUNCE,
  MoveId.PUNISHMENT,
  MoveId.POWDER_SNOW,
  MoveId.PSYWAVE,
  MoveId.QUICK_ATTACK,
  MoveId.RAGE,
  MoveId.RAZOR_LEAF,
  MoveId.RAZOR_WIND, // Really bad charge move.
  MoveId.ROLLING_KICK,
  MoveId.ROTOTILLER,
  MoveId.ROCK_THROW,
  MoveId.ROUND, // Gets superceded very easily, common TM but is fine as early game coverage.
  MoveId.SCRATCH,
  MoveId.SHOCK_WAVE,
  MoveId.SKY_ATTACK, // Only useful with Power Herb. As of now, it fluffs up a chunk of Flying type's movesets due to being high BP and high weight in generation.
  MoveId.SLAM,
  MoveId.SLUDGE,
  MoveId.SMELLING_SALTS,
  MoveId.SMOG,
  MoveId.SONIC_BOOM,
  MoveId.SPARK,
  MoveId.SPIDER_WEB,
  MoveId.SPIT_UP,
  MoveId.SPIKE_CANNON, // No one who has it really cares for it outside of early levels.
  MoveId.SPLASH,
  MoveId.STOMP,
  MoveId.STRUGGLE_BUG,
  MoveId.SUBMISSION,
  MoveId.SUPERSONIC,
  MoveId.SWALLOW,
  MoveId.SWIFT,
  MoveId.SWEET_SCENT,
  MoveId.TACKLE,
  MoveId.TAIL_WHIP,
  MoveId.TAKE_DOWN,
  MoveId.TEARFUL_LOOK,
  MoveId.TELEPORT,
  MoveId.THUNDER_SHOCK,
  MoveId.TWISTER,
  MoveId.VINE_WHIP,
  MoveId.VISE_GRIP,
  MoveId.VITAL_THROW,
  MoveId.WAKE_UP_SLAP,
  MoveId.WATER_GUN,
  MoveId.WATER_SPORT,
  MoveId.WITHDRAW,
  MoveId.WRAP,

  // Situational Moves, potentially revisit some of these after dedicated sets / smarter moveset generation.

  MoveId.BELCH, // High BP also makes it likely to spawn on anything that gets it as random coverage.
  MoveId.IMPRISON, // Too situational.
  MoveId.SMACK_DOWN, // Hold off until smarter move generation, ideally the Pokemon with the move already has a Ground move or it generates on a Ground specialist.
  MoveId.SYNCHRONOISE, // Too situational, mostly given to Psychic types which resist the move anyway.

  // Blocking Moves
  MoveId.BLOCK, // Potentially revisit after improved learnsets and weighting, only value is on stall-esque builds.
  MoveId.MEAN_LOOK, // Same as Block

  // Stat Swaps
  MoveId.GUARD_SWAP, // Too situational, ends up benefitting the player and hurting the AI more often than not.
  MoveId.POWER_SWAP, // Same as Guard Swap.
  MoveId.SPEED_SWAP, // Same as the other Swaps

  // Immunity ignoring moves
  MoveId.ODOR_SLEUTH, // The slot this spawns in could've just been used to spawn coverage instead, requires a turn to use.
  MoveId.MIRACLE_EYE, // Same as Odor Sleuth

  // Works as early game coverage but needs smarter generation to be worth
  MoveId.INCINERATE,

  // Recommended to blacklist until AI changes are made.
  MoveId.BELLY_DRUM, // Currently the AI uses it without considering the battle state, leading to the AI swapping out after due to the lowered HP.
  MoveId.FOCUS_PUNCH, // Messy with move weighting, AI will probably never be smart enough to use it correctly.
  MoveId.LAST_RESORT, // Potentially revisit after further move generation changes, high BP causes it to spawn as random coverage often and it ends up being situational / an unused slot.
  MoveId.SOLAR_BEAM, // Temporary deny until move gen can account for weather properly.

  // Recharge Moves, recommended by NightKev until improved AI / Move Generation.
  MoveId.HYPER_BEAM, // Recharge moves have complications with move weighting, AI choice weighting, and AI usage in general. Some signature moves were omitted.
  MoveId.GIGA_IMPACT,
  MoveId.BLAST_BURN,
  MoveId.FRENZY_PLANT,
  MoveId.HYDRO_CANNON,
  MoveId.PRISMATIC_LASER,
]);
