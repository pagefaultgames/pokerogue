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
]);

/**
 * Moves that are prevented from spawning if the mon is at a higher level than {@linkcode LEVEL_BASED_DENYLIST_THRESHOLD}
 */
export const LEVEL_BASED_DENYLIST: ReadonlySet<MoveId> = new Set([
  MoveId.ABSORB,
  MoveId.ACID,
  MoveId.ASTONISH,
  MoveId.BARRAGE,
  MoveId.BIDE,
  MoveId.BIND,
  MoveId.BUBBLE,
  MoveId.COMET_PUNCH,
  MoveId.CONFUSION,
  MoveId.CONSTRICT,
  MoveId.DEFENSE_CURL,
  MoveId.DISARMING_VOICE,
  MoveId.DOUBLE_SLAP,
  MoveId.DREAM_EATER,
  MoveId.EMBER,
  MoveId.FAIRY_WIND,
  MoveId.FALSE_SWIPE,
  MoveId.FEINT,
  MoveId.FLAIL,
  MoveId.FORESIGHT,
  MoveId.FURY_ATTACK,
  MoveId.FURY_SWIPES,
  MoveId.GEAR_UP,
  MoveId.GROWL,
  MoveId.GUST,
  MoveId.HARDEN,
  MoveId.IMPRISON,
  MoveId.INFESTATION,
  MoveId.KINESIS,
  MoveId.LEAFAGE,
  MoveId.LEER,
  MoveId.LICK,
  MoveId.LUCKY_CHANT,
  MoveId.MEGA_DRAIN,
  // Long discussion with balance team about this one
  MoveId.METAL_CLAW,
  MoveId.MIRACLE_EYE,
  MoveId.MIST,
  MoveId.MUD_SPORT,
  MoveId.NIGHTMARE,
  MoveId.PECK,
  MoveId.PLAY_NICE,
  MoveId.POUND,
  MoveId.POWDER_SNOW,
  MoveId.RAGE,
  MoveId.ROTOTILLER,
  MoveId.SCRATCH,
  MoveId.SMOG,
  MoveId.SPARK,
  MoveId.SPIKE_CANNON,
  MoveId.SPIT_UP,
  MoveId.SPLASH,
  MoveId.SUPERSONIC,
  MoveId.SWALLOW,
  MoveId.SWEET_SCENT,
  MoveId.TACKLE,
  MoveId.TAIL_WHIP,
  // Blitzy recommended
  MoveId.TELEPORT,
  MoveId.TWISTER,
  MoveId.VINE_WHIP,
  MoveId.VISE_GRIP,
  MoveId.WATER_GUN,
  MoveId.WATER_SPORT,
  MoveId.WITHDRAW,
  MoveId.WRAP,
]);
