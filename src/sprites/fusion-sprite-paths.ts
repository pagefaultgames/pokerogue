import { natdexToIfId } from "#sprites/if-id-map";

export const FUSION_KEY_PART = "fusion";

export interface FusionSpritePair {
  headId: number;
  bodyId: number;
}

// Empty string = default sprite. Lettered values (`a`, `b`, ...) append to the
// bodyId on disk and become `__v<suffix>` in atlas keys (Phaser keys can't
// contain dots).
export type FusionSpriteVariant = string;

/** Canonical sprite id (no `pkmn__` prefix) for a fusion pair. */
export function fusionSpriteId(pair: FusionSpritePair, back = false, variant: FusionSpriteVariant = ""): string {
  const tail = variant ? `__v${variant}` : "";
  const core = `${FUSION_KEY_PART}__${pair.headId}__${pair.bodyId}${tail}`;
  return back ? `back__${core}` : core;
}

/** Phaser atlas key matching vanilla's `pkmn__` namespace. */
export function fusionSpriteKey(pair: FusionSpritePair, back = false, variant: FusionSpriteVariant = ""): string {
  return `pkmn__${fusionSpriteId(pair, back, variant)}`;
}

/**
 * On-disk filename (under the configured base URL) for a fusion sprite.
 * Layout: `<headId>/<headId>.<bodyId>[<variant>].png`, prefixed with `back/`
 * for back sprites.
 * @returns null when either parent has no IF equivalent; passing the raw NatDex
 *   id through would load the wrong species (e.g. NatDex 265 is Wurmple but
 *   IF's 265 is Rhyperior).
 */
export function fusionSpriteAtlasPath(
  pair: FusionSpritePair,
  back = false,
  variant: FusionSpriteVariant = "",
): string | null {
  const ifHead = natdexToIfId(pair.headId);
  const ifBody = natdexToIfId(pair.bodyId);
  if (ifHead === null || ifBody === null) {
    return null;
  }
  const variantTail = variant ? variant : "";
  const prefix = back ? "back/" : "";
  return `${prefix}${ifHead}/${ifHead}.${ifBody}${variantTail}`;
}

export function isFusionSpriteKey(key: string): boolean {
  return key.includes(`__${FUSION_KEY_PART}__`);
}

/** Parse a fusion sprite key back into its components, or null if not a fusion key. */
export function parseFusionSpriteKey(key: string): (FusionSpritePair & { variant: FusionSpriteVariant }) | null {
  const stripped = key.replace(/^pkmn__/, "").replace(/^back__/, "");
  const match = /^fusion__(\d+)__(\d+)(?:__v([A-Za-z0-9]+))?$/.exec(stripped);
  if (!match) {
    return null;
  }
  return {
    headId: Number(match[1]),
    bodyId: Number(match[2]),
    variant: match[3] ?? "",
  };
}
