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
