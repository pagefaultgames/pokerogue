// Engine-agnostic — no Phaser dependency. Answers "given (head, body), is
// there a custom fusion sprite, and if so where?". The loader populates the
// present/missing caches via markPresent / markMissing.

import {
  type FusionSpritePair,
  type FusionSpriteVariant,
  fusionSpriteAtlasPath,
  fusionSpriteKey,
} from "#sprites/fusion-sprite-paths";
import { FusionSettingKeys, getFusionSettingValue } from "#system/settings/fusion-settings";

export interface ResolvedFusionSprite {
  key: string;
  url: string;
  pair: FusionSpritePair;
  back: boolean;
  /** Empty string = default sprite; otherwise the artist-alternate suffix. */
  variant: FusionSpriteVariant;
}

const config = {
  // Default order: artist-curated (CustomBattlers, with lettered alternates)
  // then autogen (Battlers, default only).
  baseUrls: ["/images/CustomBattlers/", "/images/Battlers/"],
  manifest: null as Set<string> | null,
};

const presentCache = new Set<string>();
const missingCache = new Set<string>();

function pairKey(pair: FusionSpritePair, back: boolean, variant: FusionSpriteVariant = ""): string {
  return `${back ? "b" : "f"}:${pair.headId}:${pair.bodyId}:${variant}`;
}

/** Pass a single string or a priority-ordered array. */
export function setFusionSpriteBaseUrl(url: string | string[]): void {
  const urls = Array.isArray(url) ? url : [url];
  config.baseUrls = urls.map(u => (u.endsWith("/") ? u : `${u}/`));
}

export function getFusionSpriteBaseUrls(): string[] {
  return [...config.baseUrls];
}

/** Pass null to disable manifest gating (any pair attempted optimistically). */
export function setFusionSpriteManifest(pairs: Iterable<readonly [number, number]> | null): void {
  if (pairs === null) {
    config.manifest = null;
    return;
  }
  const set = new Set<string>();
  for (const [head, body] of pairs) {
    set.add(`${head}:${body}`);
  }
  config.manifest = set;
}

export function hasBeenChecked(pair: FusionSpritePair, back = false, variant: FusionSpriteVariant = ""): boolean {
  const k = pairKey(pair, back, variant);
  return presentCache.has(k) || missingCache.has(k);
}

// Also clears any prior missing mark — present/missing are mutually exclusive.
// The back-sprite mirror path depends on this: HTTP marks missing first, then
// the mirror registers the texture and calls markPresent.
export function markPresent(pair: FusionSpritePair, back = false, variant: FusionSpriteVariant = ""): void {
  const k = pairKey(pair, back, variant);
  presentCache.add(k);
  missingCache.delete(k);
}

export function markMissing(pair: FusionSpritePair, back = false, variant: FusionSpriteVariant = ""): void {
  const k = pairKey(pair, back, variant);
  // Don't downgrade an already-present mark to missing.
  if (presentCache.has(k)) {
    return;
  }
  missingCache.add(k);
}

export function clearFusionSpriteCaches(): void {
  presentCache.clear();
  missingCache.clear();
}

/**
 * Build a descriptor for the first-priority candidate, without consulting
 * caches or manifests. For the full fallback chain use
 * {@linkcode describeFusionSpriteCandidates}.
 */
export function describeFusionSprite(
  pair: FusionSpritePair,
  back = false,
  variant: FusionSpriteVariant = "",
): ResolvedFusionSprite | null {
  return describeFusionSpriteCandidates(pair, back, variant)[0] ?? null;
}

/**
 * Ordered candidate descriptors. All share the same Phaser key, so whichever
 * loads first wins and consumers don't need to know which source it came from.
 */
export function describeFusionSpriteCandidates(
  pair: FusionSpritePair,
  back = false,
  variant: FusionSpriteVariant = "",
): ResolvedFusionSprite[] {
  const atlasPath = fusionSpriteAtlasPath(pair, back, variant);
  // No IF path for this pair — skip HTTP entirely; falling through with a
  // raw NatDex id would load the wrong species due to IF's different ordering.
  if (atlasPath === null) {
    return [];
  }
  const key = fusionSpriteKey(pair, back, variant);
  const sourcePref = getFusionSettingValue(FusionSettingKeys.Sprite_Source);
  let sources: string[];
  if (sourcePref === "AUTOGEN_FIRST") {
    sources = [...config.baseUrls].reverse();
  } else if (sourcePref === "CUSTOM_ONLY") {
    sources = config.baseUrls.slice(0, 1);
  } else {
    sources = [...config.baseUrls];
  }
  // Autogen never ships lettered alternates.
  if (variant) {
    sources = sources.slice(0, 1);
  }
  return sources.map(base => ({
    key,
    url: `${base}${atlasPath}.png`,
    pair: { headId: pair.headId, bodyId: pair.bodyId },
    back,
    variant,
  }));
}

/**
 * Returns the descriptor when this pair is known (manifest or loader-confirmed)
 * or when no manifest gates it. Callers wanting to attempt-then-cache should
 * use {@linkcode describeFusionSprite} directly.
 */
export function resolveFusionSprite(
  pair: FusionSpritePair,
  back = false,
  variant: FusionSpriteVariant = "",
): ResolvedFusionSprite | null {
  const k = pairKey(pair, back, variant);
  if (missingCache.has(k)) {
    return null;
  }
  if (presentCache.has(k)) {
    return describeFusionSprite(pair, back, variant);
  }
  // Manifest gates on the pair, not the variant.
  if (config.manifest && !config.manifest.has(`${pair.headId}:${pair.bodyId}`)) {
    return null;
  }
  return describeFusionSprite(pair, back, variant);
}
