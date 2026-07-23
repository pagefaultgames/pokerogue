/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { supportedLngs } from "#app/i18n-supported-lngs";

//!  Can't make properties optional, because they are needed to generate the header line

export interface SpeciesEntry {
  dexNum: number;
  id: string;
  form: string | null;
  formDisplayName: string;
  name: string;
  starter: string;
  startercost: number | null;
  eggTier: string | null;
  prevolution: string | null;
  generation: number;
  spriteKey: string;
  formKey: string | null;
  hasVariants: boolean;
  category: string;
  type1: string;
  type2: string | null;
  ability1: string;
  ability2: string;
  hiddenAbility: string;
  passive: string;
  eggMove1: string;
  eggMove2: string;
  eggMove3: string;
  eggMove4: string;
  bst: number;
  hp: number;
  atk: number;
  def: number;
  spatk: number;
  spdef: number;
  spd: number;
  sublegend: boolean;
  legendary: boolean;
  mythical: boolean;
  weight: number;
  height: number;
  catchRate: number;
  friendship: number;
  baseExp: number;
  growthRate: string;
  /** null for genderless */
  maleRatio: number | null;
  genderDiffs: boolean;
  isStartSelectable: boolean;
  /** form only */
  isUnobtainable: boolean | null;
  /** species only */
  canChangeForm: boolean | null;
}

export interface EvolutionEntry {
  dexNum: number;
  id: string;
  evoDexNum: number | null;
  evoId: string | null;
  prevoKey: string | null;
  evoKey: string | null;
  levelNeeded: number;
  evoItems: string | null;
  evoDelay: string | null;
  timeOfDayCond: string | null;
  biomeCond: string | null;
  genderEvo: string | null;
  moveTypeCond: string | null;
  knowsMove: string | null;
  friendship: number | null;
  haveCaught: string | null;
  tyrogueStats: string | null;
  rockruffAbility: string | null;
  shedinjaBs: string | null;
  weatherCond: string | null;
  dunsparceSeed: number | null;
  nature: string | null;
  partyTypeCond: string | null;
  heldItemCond: string | null;
  evoTreasureTracker: number | null;
}

type SupportedLanguage = (typeof supportedLngs)[number];
/** A record of localized text for each supported language */
type TextLocalization = Record<SupportedLanguage, string | null>;
export interface EvolutionTextEntry extends TextLocalization {
  preDexNum: number;
  preId: string;
  preFormKey: string;
  evoDexNum: number;
  evoId: string;
  evoFormKey: string;
}

export interface FormChangeTextEntry extends TextLocalization {
  dexNum: number;
  speciesId: string;
  preFormKey: string;
  evoFormKey: string;
}

export interface TmEntry {
  dexNum: number;
  id: string;
  form: string | null;
  move: string;
}

export interface LevelMoveEntry {
  dexNum: number;
  id: string;
  form: string | null;
  level: number | "EVOLVE_MOVE" | "RELEARN_MOVE";
  move: string;
}

export interface TmTierEntry {
  move: string;
  tier: string;
}
