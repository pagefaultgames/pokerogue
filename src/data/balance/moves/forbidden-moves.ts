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
  MoveId.MEGA_PUNCH,
  MoveId.NIGHT_SHADE,
  MoveId.PAY_DAY,
  MoveId.PSYCH_UP,
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
  MoveId.ASSURANCE, // Primarily a doubles move but functions as early game Dark STAB
  MoveId.ASTONISH,
  MoveId.BABY_DOLL_EYES,
  MoveId.BARRAGE,
  MoveId.BELCH, // Too situational, high BP also makes it likely to spawn on anything random that gets it
  MoveId.BELLY_DRUM, // Revist after AI changes, currently the AI uses it just to swap immediately out of fear
  MoveId.BIDE,
  MoveId.BIND,
  MoveId.BLOCK, // Potentially revisit after improved learnsets, only value is on stall-eqsue builds
  MoveId.BRANCH_POKE,
  MoveId.BONE_CLUB, // Cubone gets better options
  MoveId.BUBBLE,
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
  MoveId.FLAIL,
  MoveId.FOCUS_PUNCH, // Messy with move weighting, AI will also always try to go for it
  MoveId.FORESIGHT,
  MoveId.FURY_ATTACK,
  MoveId.FURY_SWIPES,
  MoveId.GEAR_UP,
  MoveId.GROWL,
  MoveId.GUARD_SWAP, // Too situational, ends up benefitting the player more often than not
  MoveId.GUST,
  MoveId.HARDEN,
  MoveId.HORN_ATTACK,
  MoveId.IMPRISON, // Too situational
  MoveId.KINESIS,
  MoveId.LAST_RESORT, // Potentially revisit after further move generation changes, too high BP causes it to spawn as random coverage and ends up being situational / unused
  MoveId.LEAFAGE,
  MoveId.LEER,
  MoveId.LICK,
  MoveId.LUCKY_CHANT,
  MoveId.MEAN_LOOK, // Same as Block
  MoveId.MEGA_DRAIN,
  MoveId.METAL_CLAW,
  MoveId.MIRACLE_EYE, // Same as Odor Sleuth
  MoveId.MIST,
  MoveId.MUD_SPORT,
  MoveId.NIGHTMARE,
  MoveId.ODOR_SLEUTH, // The slot this spawns in could've just been used to spawn coverage instead
  MoveId.PECK,
  MoveId.PLAY_NICE,
  MoveId.POISON_STING,
  MoveId.POUND,
  MoveId.POUNCE,
  MoveId.POWDER_SNOW,
  MoveId.POWER_SWAP, // Same as Guard Swap
  MoveId.PSYWAVE,
  MoveId.QUICK_ATTACK,
  MoveId.RAGE,
  MoveId.RAZOR_LEAF,
  MoveId.RAZOR_WIND, // Really Bad
  MoveId.ROLLING_KICK,
  MoveId.ROTOTILLER,
  MoveId.ROUND, // Gets superceded very easily, common TM but is fine as early game coverage
  MoveId.SCRATCH,
  MoveId.SKY_ATTACK, // Only useful with Power Herb, as of now it fluffs up a chunk of Flying type's movesets due to being high BP and high weight in generation
  MoveId.SLAM,
  MoveId.SMOG,
  MoveId.SONIC_BOOM,
  MoveId.SPARK,
  MoveId.SPIT_UP,
  MoveId.SPIKE_CANNON, // No one who has it really cares for it
  MoveId.SPLASH,
  MoveId.STOMP,
  MoveId.SUBMISSION,
  MoveId.SUPERSONIC,
  MoveId.SWALLOW,
  MoveId.SWEET_SCENT,
  MoveId.SYNCHRONOISE, // Too situational
  MoveId.TACKLE,
  MoveId.TAIL_WHIP,
  MoveId.TAKE_DOWN,
  MoveId.TEARFUL_LOOK,
  MoveId.TELEPORT,
  MoveId.THUNDER_SHOCK,
  MoveId.TWISTER,
  MoveId.VINE_WHIP,
  MoveId.VISE_GRIP,
  MoveId.WATER_GUN,
  MoveId.WATER_SPORT,
  MoveId.WITHDRAW,
  MoveId.WRAP,
]);
