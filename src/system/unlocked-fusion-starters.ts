import type { FusionSpritePair, FusionSpriteVariant } from "#sprites/fusion-sprite-paths";

const STORAGE_KEY = "unlockedFusionStarters_v1";

interface FusionStarterUnlock {
  unlocked: true;
  /** Bitmask of unlocked shiny variants; bit i = variant i. */
  shinyVariants?: number;
  /** Legacy bool form; promoted to `shinyVariants & 1` on load. */
  shinyUnlocked?: boolean;
  preferredVariant?: FusionSpriteVariant;
  /** Per-stat max of head's and body's IVs at splice time. */
  ivs?: [number, number, number, number, number, number];
  /** Bitmask: 0b01 = male, 0b10 = female. Genderless heads set bit 0. */
  genders?: number;
  /** Legacy single-gender field; promoted to `genders` mask on load. */
  gender?: number;
  /** Round-robin counter; even = head gets the ceiling half, odd = body. */
  candyCreditTurn?: number;
  // Mirrors vanilla `starterData[id].abilityAttr`:
  //   0b001 = ability1 (head), 0b010 = ability2 (body), 0b100 = hidden (head)
  abilityAttr?: number;
  /** Same shape as vanilla `dexEntry.natureAttr`: bit (n+1) = nature n. */
  natureAttr?: number;
  /** Capped at 2 to match vanilla. */
  valueReduction?: number;
  /** Fusion egg-moves track head's slots — see `installFusionStarterMaps`. */
  eggMoves?: number;
  /** Hex-encoded `RibbonData` payload. */
  ribbons?: string;
  classicWinCount?: number;
  /** Same shape as vanilla `PassiveAttr` (`UNLOCKED | ENABLED`). */
  passiveAttr?: number;
}

let cache: Map<string, FusionStarterUnlock> | null = null;

function pairToString(pair: FusionSpritePair): string {
  return `${pair.headId}:${pair.bodyId}`;
}

function pairFromString(s: string): FusionSpritePair | null {
  const m = /^(\d+):(\d+)$/.exec(s);
  if (!m) {
    return null;
  }
  return { headId: Number(m[1]), bodyId: Number(m[2]) };
}

function loadFromStorage(): Map<string, FusionStarterUnlock> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return new Map();
    }
    const parsed: unknown = JSON.parse(raw);
    const out = new Map<string, FusionStarterUnlock>();
    // Accept legacy array-of-strings shape alongside the current object map.
    if (Array.isArray(parsed)) {
      for (const s of parsed) {
        if (typeof s === "string") {
          out.set(s, { unlocked: true });
        }
      }
    } else if (parsed && typeof parsed === "object") {
      for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
        if (val && typeof val === "object") {
          const v = val as Partial<FusionStarterUnlock>;
          const rec: FusionStarterUnlock = { unlocked: true };
          if (typeof v.shinyVariants === "number" && v.shinyVariants !== 0) {
            rec.shinyVariants = v.shinyVariants;
          } else if (v.shinyUnlocked === true) {
            // Promote legacy bool to bitmask.
            rec.shinyVariants = 0b001;
          }
          if (typeof v.preferredVariant === "string" && v.preferredVariant.length > 0) {
            rec.preferredVariant = v.preferredVariant;
          }
          if (Array.isArray(v.ivs) && v.ivs.length === 6 && v.ivs.every(n => typeof n === "number")) {
            rec.ivs = [v.ivs[0], v.ivs[1], v.ivs[2], v.ivs[3], v.ivs[4], v.ivs[5]];
          }
          if (typeof v.genders === "number" && v.genders !== 0) {
            rec.genders = v.genders;
          } else if (typeof v.gender === "number") {
            // Promote legacy single-gender field to mask.
            rec.genders = 1 << Math.max(0, v.gender);
          }
          if (typeof v.candyCreditTurn === "number") {
            rec.candyCreditTurn = v.candyCreditTurn;
          }
          if (typeof v.abilityAttr === "number" && v.abilityAttr !== 0) {
            rec.abilityAttr = v.abilityAttr;
          }
          if (typeof v.natureAttr === "number" && v.natureAttr !== 0) {
            rec.natureAttr = v.natureAttr;
          }
          if (typeof v.valueReduction === "number" && v.valueReduction !== 0) {
            rec.valueReduction = v.valueReduction;
          }
          if (typeof v.eggMoves === "number" && v.eggMoves !== 0) {
            rec.eggMoves = v.eggMoves;
          }
          if (typeof v.ribbons === "string" && v.ribbons.length > 0) {
            rec.ribbons = v.ribbons;
          }
          if (typeof v.classicWinCount === "number" && v.classicWinCount > 0) {
            rec.classicWinCount = v.classicWinCount;
          }
          if (typeof v.passiveAttr === "number" && v.passiveAttr !== 0) {
            rec.passiveAttr = v.passiveAttr;
          }
          out.set(key, rec);
        }
      }
    }
    return out;
  } catch {
    return new Map();
  }
}

function ensureCache(): Map<string, FusionStarterUnlock> {
  if (cache === null) {
    cache = loadFromStorage();
  }
  return cache;
}

function persist(): void {
  if (cache === null) {
    return;
  }
  try {
    const out: Record<string, FusionStarterUnlock> = {};
    for (const [k, v] of cache) {
      out[k] = v;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  } catch {
    // Quota / disabled storage — swallow.
  }
}

export interface UnlockFusionStarterOptions {
  shinyVariants?: number;
  ivs?: [number, number, number, number, number, number];
  /** Pokemon `Gender` enum value of the head (0 = male, 1 = female, -1 = genderless). */
  gender?: number;
  abilityAttr?: number;
  natureAttr?: number;
  eggMoves?: number;
}

export function getFusionStarterIvs(pair: FusionSpritePair): [number, number, number, number, number, number] | null {
  const entry = ensureCache().get(pairToString(pair));
  return entry?.ivs ? ([...entry.ivs] as [number, number, number, number, number, number]) : null;
}

/**
 * Returns the unlocked-gender bitmask (0b01 = male, 0b10 = female), or 0 if
 * no entry. Promotes the legacy `gender` field when only that is set.
 */
export function getFusionStarterGenders(pair: FusionSpritePair): number {
  const entry = ensureCache().get(pairToString(pair));
  if (!entry) {
    return 0;
  }
  let mask = entry.genders ?? 0;
  if (typeof entry.gender === "number") {
    // Genderless (-1) maps to bit 0.
    mask |= 1 << Math.max(0, entry.gender);
  }
  return mask;
}

/**
 * Advances the credit-turn counter for a pair and returns whether head gets
 * the ceiling half this call. Defaults to head-first when no entry exists.
 */
export function advanceFusionCandyCreditTurn(pair: FusionSpritePair): boolean {
  const set = ensureCache();
  const key = pairToString(pair);
  const entry = set.get(key);
  if (!entry) {
    return true;
  }
  const turn = entry.candyCreditTurn ?? 0;
  const headFirst = turn % 2 === 0;
  entry.candyCreditTurn = turn + 1;
  persist();
  return headFirst;
}

export function isFusionStarterUnlocked(pair: FusionSpritePair): boolean {
  return ensureCache().has(pairToString(pair));
}

export function isFusionStarterShinyUnlocked(pair: FusionSpritePair): boolean {
  return getFusionStarterShinyVariants(pair) !== 0;
}

/** Honors the legacy `shinyUnlocked` bool as "variant 0 unlocked". */
export function getFusionStarterShinyVariants(pair: FusionSpritePair): number {
  const entry = ensureCache().get(pairToString(pair));
  if (!entry) {
    return 0;
  }
  let mask = entry.shinyVariants ?? 0;
  if (entry.shinyUnlocked === true) {
    mask |= 0b001;
  }
  return mask;
}

/**
 * Marks a fusion pair as unlocked. Returns true if anything changed (fresh
 * unlock or merged-in new bits).
 */
export function unlockFusionStarter(pair: FusionSpritePair, opts: UnlockFusionStarterOptions = {}): boolean {
  const set = ensureCache();
  const key = pairToString(pair);
  const existing = set.get(key);
  const newVariants = opts.shinyVariants ?? 0;
  const newIvs = opts.ivs;
  const newAbility = opts.abilityAttr ?? 0;
  const newNature = opts.natureAttr ?? 0;
  const newEggMoves = opts.eggMoves ?? 0;

  if (existing) {
    let changed = false;
    if (typeof opts.gender === "number") {
      const newBit = 1 << Math.max(0, opts.gender);
      const legacy = typeof existing.gender === "number" ? 1 << Math.max(0, existing.gender) : 0;
      const current = (existing.genders ?? 0) | legacy;
      const merged = current | newBit;
      if (merged !== current) {
        existing.genders = merged;
        // Drop legacy field once promoted to mask.
        Reflect.deleteProperty(existing, "gender");
        changed = true;
      }
    }
    if (newVariants !== 0) {
      const cur = (existing.shinyVariants ?? 0) | (existing.shinyUnlocked === true ? 0b001 : 0);
      const merged = cur | newVariants;
      if (merged !== cur) {
        existing.shinyVariants = merged;
        // Drop legacy bool to keep storage canonical.
        Reflect.deleteProperty(existing, "shinyUnlocked");
        changed = true;
      }
    }
    // Per-stat max — recorded IVs only ever improve on re-splice.
    if (newIvs) {
      const cur = existing.ivs ?? [0, 0, 0, 0, 0, 0];
      const merged: [number, number, number, number, number, number] = [
        Math.max(cur[0], newIvs[0]),
        Math.max(cur[1], newIvs[1]),
        Math.max(cur[2], newIvs[2]),
        Math.max(cur[3], newIvs[3]),
        Math.max(cur[4], newIvs[4]),
        Math.max(cur[5], newIvs[5]),
      ];
      if (!existing.ivs || merged.some((v, i) => v !== existing.ivs![i])) {
        existing.ivs = merged;
        changed = true;
      }
    }
    if (newAbility !== 0) {
      const cur = existing.abilityAttr ?? 0;
      const merged = cur | newAbility;
      if (merged !== cur) {
        existing.abilityAttr = merged;
        changed = true;
      }
    }
    if (newNature !== 0) {
      const cur = existing.natureAttr ?? 0;
      const merged = cur | newNature;
      if (merged !== cur) {
        existing.natureAttr = merged;
        changed = true;
      }
    }
    if (newEggMoves !== 0) {
      const cur = existing.eggMoves ?? 0;
      const merged = cur | newEggMoves;
      if (merged !== cur) {
        existing.eggMoves = merged;
        changed = true;
      }
    }
    if (changed) {
      persist();
    }
    return changed;
  }

  const record: FusionStarterUnlock = { unlocked: true };
  if (newVariants !== 0) {
    record.shinyVariants = newVariants;
  }
  if (newIvs) {
    record.ivs = [...newIvs];
  }
  if (typeof opts.gender === "number") {
    record.genders = 1 << Math.max(0, opts.gender);
  }
  if (newAbility !== 0) {
    record.abilityAttr = newAbility;
  }
  if (newNature !== 0) {
    record.natureAttr = newNature;
  }
  if (newEggMoves !== 0) {
    record.eggMoves = newEggMoves;
  }
  set.set(key, record);
  persist();
  return true;
}

export function getFusionStarterAbilityAttr(pair: FusionSpritePair): number {
  return ensureCache().get(pairToString(pair))?.abilityAttr ?? 0;
}

export function getFusionStarterNatureAttr(pair: FusionSpritePair): number {
  return ensureCache().get(pairToString(pair))?.natureAttr ?? 0;
}

export function getFusionStarterValueReduction(pair: FusionSpritePair): number {
  return ensureCache().get(pairToString(pair))?.valueReduction ?? 0;
}

/**
 * Bumps `valueReduction`. Caller caps (vanilla cap is 2) and charges candy
 * via split-spend. Returns the new value, or null if the pair isn't unlocked.
 */
export function bumpFusionStarterValueReduction(pair: FusionSpritePair): number | null {
  const set = ensureCache();
  const key = pairToString(pair);
  const existing = set.get(key);
  if (!existing) {
    return null;
  }
  existing.valueReduction = (existing.valueReduction ?? 0) + 1;
  persist();
  return existing.valueReduction;
}

export function getFusionStarterEggMoves(pair: FusionSpritePair): number {
  return ensureCache().get(pairToString(pair))?.eggMoves ?? 0;
}

/** Matches vanilla's `dexEntry.ribbons.toJSON()` shape. Empty when unset. */
export function getFusionStarterRibbonsHex(pair: FusionSpritePair): string {
  return ensureCache().get(pairToString(pair))?.ribbons ?? "";
}

/**
 * OR-merges a ribbon flag and increments `classicWinCount` when CLASSIC is
 * among the flags (mirrors vanilla `incrementRibbonCount`). Returns true on change.
 */
export function awardFusionStarterRibbons(pair: FusionSpritePair, flags: bigint): boolean {
  const set = ensureCache();
  const key = pairToString(pair);
  const existing = set.get(key);
  if (!existing) {
    return false;
  }
  const current = existing.ribbons ? BigInt(`0x${existing.ribbons}`) : 0n;
  const merged = current | flags;
  let changed = false;
  if (merged !== current) {
    existing.ribbons = merged.toString(16);
    changed = true;
  }
  const CLASSIC = 0x0008000000n;
  if (flags & CLASSIC) {
    existing.classicWinCount = (existing.classicWinCount ?? 0) + 1;
    changed = true;
  }
  if (changed) {
    persist();
  }
  return changed;
}

export function getFusionStarterClassicWinCount(pair: FusionSpritePair): number {
  return ensureCache().get(pairToString(pair))?.classicWinCount ?? 0;
}

export function getFusionStarterPassiveAttr(pair: FusionSpritePair): number {
  return ensureCache().get(pairToString(pair))?.passiveAttr ?? 0;
}

/** No-op if the pair isn't unlocked yet. */
export function setFusionStarterPassiveAttr(pair: FusionSpritePair, attr: number): boolean {
  const set = ensureCache();
  const key = pairToString(pair);
  const existing = set.get(key);
  if (!existing) {
    return false;
  }
  if ((existing.passiveAttr ?? 0) === attr) {
    return false;
  }
  if (attr === 0) {
    Reflect.deleteProperty(existing, "passiveAttr");
  } else {
    existing.passiveAttr = attr;
  }
  persist();
  return true;
}

export function getPreferredFusionVariant(pair: FusionSpritePair): FusionSpriteVariant {
  return ensureCache().get(pairToString(pair))?.preferredVariant ?? "";
}

/** Pass empty string / null to clear. No-op if the pair isn't unlocked. */
export function setPreferredFusionVariant(pair: FusionSpritePair, variant: FusionSpriteVariant | null): void {
  const set = ensureCache();
  const key = pairToString(pair);
  const existing = set.get(key);
  if (!existing) {
    return;
  }
  if (variant && variant.length > 0) {
    existing.preferredVariant = variant;
  } else {
    Reflect.deleteProperty(existing, "preferredVariant");
  }
  persist();
}

export function listUnlockedFusionStarters(): FusionSpritePair[] {
  const out: FusionSpritePair[] = [];
  for (const s of ensureCache().keys()) {
    const p = pairFromString(s);
    if (p) {
      out.push(p);
    }
  }
  return out;
}

export function countUnlockedFusionStarters(): number {
  return ensureCache().size;
}

export function resetUnlockedFusionStarters(): void {
  cache = new Map();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Serializes the unlock map for embedding in `SystemSaveData.fusionStarters`.
 * Round-trip symmetric — `loadFromStorage` accepts this shape verbatim.
 */
export function serializeFusionUnlocks(): Record<string, unknown> {
  const set = ensureCache();
  const out: Record<string, unknown> = {};
  for (const [key, value] of set) {
    const { unlocked: _unlocked, ...rest } = value;
    out[key] = { unlocked: true, ...rest };
  }
  return out;
}

/**
 * Replaces in-memory and persisted fusion-unlocks with the supplied payload.
 * Empty/undefined payloads are no-ops unless `wipeOnEmpty` is set, so absent
 * fusion data in a save doesn't wipe local unlocks.
 */
export function restoreFusionUnlocksFromSave(
  payload: Record<string, unknown> | undefined,
  opts: { wipeOnEmpty?: boolean } = {},
): void {
  if (!payload) {
    return;
  }
  if (Object.keys(payload).length === 0 && !opts.wipeOnEmpty) {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota / disabled storage — fall through to in-memory load.
  }
  // Drop the cache so next access re-parses via `loadFromStorage` (handles legacy promotion).
  cache = null;
  ensureCache();
}
