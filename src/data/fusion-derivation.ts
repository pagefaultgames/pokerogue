import { starterPassiveAbilities } from "#balance/passives";
import { pokemonSpeciesLevelMoves } from "#balance/pokemon-level-moves";
import { speciesStarterCosts } from "#balance/starters";
import type { PokemonSpecies } from "#data/pokemon-species";
import { AbilityId } from "#enums/ability-id";
import type { PokemonType } from "#enums/pokemon-type";
import type { SpeciesId } from "#enums/species-id";
import { FusionSettingKeys, getFusionSettingValue } from "#system/settings/fusion-settings";
import type { LevelMoves } from "#types/pokemon-level-moves";

export interface FusionDerived {
  headId: SpeciesId;
  bodyId: SpeciesId;
  type1: PokemonType;
  type2: PokemonType | null;
  ability1: AbilityId;
  ability2: AbilityId;
  abilityHidden: AbilityId;
  passive: AbilityId;
  baseStats: [number, number, number, number, number, number];
  baseTotal: number;
  levelMoves: LevelMoves;
  starterCost: number;
  // Exposed as a splitter so callers can apply it to any candy expenditure
  // (passive unlock, cost reduction, shiny, etc.) rather than a flat number.
  splitCandyCost: (totalCost: number) => { fromHead: number; fromBody: number };
}

export function deriveFusionTypes(
  head: PokemonSpecies,
  body: PokemonSpecies,
): { type1: PokemonType; type2: PokemonType | null } {
  const type1 = head.type1;
  const bodyContribution = body.type2 ?? body.type1;
  const type2 = bodyContribution === type1 ? null : bodyContribution;
  return { type1, type2 };
}

export function deriveFusionAbilities(
  head: PokemonSpecies,
  body: PokemonSpecies,
): { ability1: AbilityId; ability2: AbilityId; abilityHidden: AbilityId } {
  return {
    ability1: head.ability1,
    ability2: body.ability2,
    abilityHidden: head.abilityHidden,
  };
}

/** Returns the head's passive, or {@linkcode AbilityId.NONE} if absent. */
export function deriveFusionPassive(head: PokemonSpecies): AbilityId {
  const entry = starterPassiveAbilities[head.speciesId as SpeciesId];
  if (!entry) {
    return AbilityId.NONE;
  }
  return entry[0] ?? AbilityId.NONE;
}

export function deriveFusionBaseStats(
  head: PokemonSpecies,
  body: PokemonSpecies,
): [number, number, number, number, number, number] {
  return deriveFusionBaseStatsFromArrays(head.baseStats, body.baseStats);
}

// Takes raw arrays so vanilla's calculateBaseStats can pass post-challenge
// (e.g. FLIP_STAT) values through the same formula used for starter previews.
export function deriveFusionBaseStatsFromArrays(
  headBase: readonly number[],
  bodyBase: readonly number[],
): [number, number, number, number, number, number] {
  const formula = getFusionSettingValue(FusionSettingKeys.Stat_Formula);
  if (formula === "MAXIMUM") {
    const m = (i: number): number => Math.max(headBase[i], bodyBase[i]);
    return [m(0), m(1), m(2), m(3), m(4), m(5)];
  }
  if (formula === "POKEROGUE") {
    const avg = (i: number): number => Math.round((headBase[i] + bodyBase[i]) / 2);
    return [avg(0), avg(1), avg(2), avg(3), avg(4), avg(5)];
  }
  // Default IF formula: HP/Atk/Def lean head, SpA/SpD/Spe lean body.
  const blend = (i: number): number =>
    i < 3 ? Math.round((2 * headBase[i] + bodyBase[i]) / 3) : Math.round((headBase[i] + 2 * bodyBase[i]) / 3);
  return [blend(0), blend(1), blend(2), blend(3), blend(4), blend(5)];
}

/** Merge both parents' level-up moves, keeping the earliest level per move. */
export function deriveFusionLearnset(head: PokemonSpecies, body: PokemonSpecies): LevelMoves {
  const merged = new Map<number, number>();
  const ingest = (lm: LevelMoves | undefined): void => {
    if (!lm) {
      return;
    }
    for (const [level, moveId] of lm) {
      const cur = merged.get(moveId);
      if (cur === undefined || level < cur) {
        merged.set(moveId, level);
      }
    }
  };
  ingest(pokemonSpeciesLevelMoves[head.speciesId as SpeciesId]);
  ingest(pokemonSpeciesLevelMoves[body.speciesId as SpeciesId]);

  const out: LevelMoves = [];
  for (const [moveId, level] of merged) {
    out.push([level, moveId]);
  }
  out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return out;
}

// Default 3 when a parent isn't a starter. MAXIMUM formula adds +1 as the
// balancing penalty for picking max(head, body) per stat.
export function deriveFusionStarterCost(headId: SpeciesId, bodyId: SpeciesId): number {
  const costs = speciesStarterCosts as Record<number, number>;
  const headCost = costs[headId] ?? 3;
  const bodyCost = costs[bodyId] ?? 3;
  const base = Math.round((headCost + bodyCost) / 2);
  const isMaximum = getFusionSettingValue(FusionSettingKeys.Stat_Formula) === "MAXIMUM";
  return isMaximum ? base + 1 : base;
}

// Head gets the extra on odd totals so a 1-candy charge deducts something
// rather than rounding to zero on both sides. Display-only; actual spend
// goes through {@linkcode resolveFusionCandySpend}.
export function splitCandyCost(totalCost: number): { fromHead: number; fromBody: number } {
  if (totalCost <= 0) {
    return { fromHead: 0, fromBody: 0 };
  }
  const fromHead = Math.ceil(totalCost / 2);
  const fromBody = totalCost - fromHead;
  return { fromHead, fromBody };
}

// Prefers the equal split; falls back to draining the short side and topping
// up from the other. Returns null when combined banks can't cover the cost.
export function resolveFusionCandySpend(
  totalCost: number,
  headBank: number,
  bodyBank: number,
): { fromHead: number; fromBody: number } | null {
  if (totalCost <= 0) {
    return { fromHead: 0, fromBody: 0 };
  }
  if (headBank + bodyBank < totalCost) {
    return null;
  }
  const ideal = splitCandyCost(totalCost);
  if (headBank >= ideal.fromHead && bodyBank >= ideal.fromBody) {
    return ideal;
  }
  if (headBank < ideal.fromHead) {
    return { fromHead: headBank, fromBody: totalCost - headBank };
  }
  return { fromHead: totalCost - bodyBank, fromBody: bodyBank };
}

export function deriveFusionSpecies(head: PokemonSpecies, body: PokemonSpecies): FusionDerived {
  const { type1, type2 } = deriveFusionTypes(head, body);
  const { ability1, ability2, abilityHidden } = deriveFusionAbilities(head, body);
  const baseStats = deriveFusionBaseStats(head, body);
  const baseTotal = baseStats.reduce((a, b) => a + b, 0);

  return {
    headId: head.speciesId as SpeciesId,
    bodyId: body.speciesId as SpeciesId,
    type1,
    type2,
    ability1,
    ability2,
    abilityHidden,
    passive: deriveFusionPassive(head),
    baseStats,
    baseTotal,
    levelMoves: deriveFusionLearnset(head, body),
    starterCost: deriveFusionStarterCost(head.speciesId as SpeciesId, body.speciesId as SpeciesId),
    splitCandyCost,
  };
}
