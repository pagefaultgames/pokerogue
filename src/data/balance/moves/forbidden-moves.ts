/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MoveId } from "#enums/move-id";

/**
 * Forbidden during movegen if the current battle is not a double battle
 */
export const FORBIDDEN_SINGLES_MOVES: ReadonlySet<MoveId> = new Set([
  MoveId.AFTER_YOU,
  MoveId.ALLY_SWITCH,
  MoveId.AROMATIC_MIST,
  MoveId.COACHING,
  MoveId.CRAFTY_SHIELD,
  MoveId.DECORATE,
  MoveId.DRAGON_CHEER,
  MoveId.FOLLOW_ME,
  MoveId.HELPING_HAND,
  MoveId.HOLD_HANDS,
  MoveId.INSTRUCT,
  MoveId.MAGNETIC_FLUX,
  MoveId.QUASH,
  MoveId.RAGE_POWDER,
  MoveId.SPOTLIGHT,
  MoveId.PURIFY,
  // Because every mon that learns these has protect already and they're not worth it over protect
  MoveId.MAT_BLOCK,
  MoveId.QUICK_GUARD,
  MoveId.WIDE_GUARD,
]);

export const FORBIDDEN_TM_MOVES: ReadonlySet<MoveId> = new Set([
  MoveId.NIGHT_SHADE,
  MoveId.PSYCH_UP,
  MoveId.FLASH,
  MoveId.SNORE,
  MoveId.SLEEP_TALK,
  MoveId.FALSE_SWIPE,
  MoveId.ENDEAVOR,
  MoveId.SKILL_SWAP,
  MoveId.DRAGON_CHEER,
  MoveId.CONFIDE,
  MoveId.VENOM_DRENCH,
  MoveId.STEEL_ROLLER,
  MoveId.DREAM_EATER,
  MoveId.PAY_DAY,
  MoveId.FOCUS_PUNCH,
  MoveId.UPPER_HAND,
  MoveId.SCARY_FACE,
]);


/**
 * Moves that are prevented from spawning if the mon is at a higher level than {@linkcode LEVEL_BASED_DENYLIST_THRESHOLD}
 */
export const LEVEL_BASED_DENYLIST: ReadonlySet<MoveId> = new Set([
  MoveId.LEER,
  MoveId.GROWL,
  MoveId.FURY_ATTACK,
  MoveId.MIST,
  MoveId.LUCKY_CHANT,
  MoveId.KINESIS,
  MoveId.ROTOTILLER,
  MoveId.TAIL_WHIP,
  MoveId.WITHDRAW,
  MoveId.FURY_SWIPES,
  MoveId.FORESIGHT,
  MoveId.HARDEN,
  MoveId.FLAIL,
  MoveId.SUPERSONIC,
  MoveId.BIND,
  MoveId.WRAP,
  MoveId.SPLASH,
  MoveId.BIDE,
  MoveId.PLAY_NICE,
  MoveId.SMOG,
  MoveId.LICK,
  MoveId.ASTONISH,
  MoveId.DEFENSE_CURL,
  MoveId.MIRACLE_EYE,
  MoveId.TACKLE,
  MoveId.SPIT_UP,
  MoveId.SWALLOW,
  MoveId.POUND,
  MoveId.GUST,
  MoveId.CONSTRICT,
  MoveId.DOUBLE_SLAP,
  MoveId.BARRAGE,
  MoveId.SPIKE_CANNON,
  MoveId.COMET_PUNCH,
  MoveId.RAGE,
  MoveId.ABSORB,
  MoveId.FEINT,
  MoveId.PECK,
  MoveId.WATER_GUN,
  MoveId.TWISTER,
  MoveId.SCRATCH,
  MoveId.POWDER_SNOW,
  MoveId.MEGA_DRAIN,
  MoveId.LEAFAGE,
  MoveId.FAIRY_WIND,
  MoveId.DISARMING_VOICE,
  MoveId.EMBER,
  MoveId.BUBBLE,
  MoveId.ACID,
  MoveId.VINE_WHIP,
  MoveId.CONFUSION,
  MoveId.VISE_GRIP,
  MoveId.FALSE_SWIPE,
  MoveId.INFESTATION,
  MoveId.SWEET_SCENT,
  MoveId.MUD_SPORT,
  MoveId.WATER_SPORT,
]);

