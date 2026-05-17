import { type FusionSpritePair, type FusionSpriteVariant, fusionSpriteAtlasPath } from "#sprites/fusion-sprite-paths";
import { getFusionSpriteBaseUrls } from "#sprites/fusion-sprite-resolver";
import { getFileFromIfFolder, getIfFolderHandle } from "#system/if-folder-handle";
import { getPreferredFusionVariant, setPreferredFusionVariant } from "#system/unlocked-fusion-starters";

const variantCache = new Map<string, FusionSpriteVariant[]>();
const inflightProbes = new Map<string, Promise<FusionSpriteVariant[]>>();

// a-z; IF rarely exceeds a handful.
const MAX_VARIANTS_TO_PROBE = 26;

function pairKey(pair: FusionSpritePair): string {
  return `${pair.headId}:${pair.bodyId}`;
}

function letterAt(index: number): string {
  return String.fromCharCode("a".charCodeAt(0) + index);
}

/**
 * Return the list of available sprite variants for a pair, always with `""`
 * (default) first. Cached after the first call. Only the artist source is
 * probed since autogen has no lettered alternates.
 */
export async function probeFusionVariants(pair: FusionSpritePair): Promise<FusionSpriteVariant[]> {
  const cacheKey = pairKey(pair);
  const cached = variantCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const existing = inflightProbes.get(cacheKey);
  if (existing) {
    return existing;
  }

  const probe = (async () => {
    const found: FusionSpriteVariant[] = [""];
    const useHandle = getIfFolderHandle() !== null;
    const baseUrls = getFusionSpriteBaseUrls();
    if (!useHandle && baseUrls.length === 0) {
      variantCache.set(cacheKey, found);
      return found;
    }
    for (let i = 0; i < MAX_VARIANTS_TO_PROBE; i++) {
      const variant = letterAt(i);
      const atlasPath = fusionSpriteAtlasPath(pair, false, variant);
      let exists = false;
      if (useHandle) {
        const file = await getFileFromIfFolder(`Graphics/CustomBattlers/indexed/${atlasPath}.png`);
        exists = file !== null;
      } else {
        const url = `${baseUrls[0]}${atlasPath}.png`;
        try {
          const res = await fetch(url, { method: "HEAD" });
          exists = res.ok;
        } catch {
          exists = false;
        }
      }
      if (exists) {
        found.push(variant);
      } else {
        break;
      }
    }
    variantCache.set(cacheKey, found);
    return found;
  })();

  inflightProbes.set(cacheKey, probe);
  probe.finally(() => inflightProbes.delete(cacheKey));
  return probe;
}

/**
 * Advance the preferred variant for this pair one step.
 * @returns the new preferred variant, or null when no alternates exist.
 */
export async function cycleFusionVariant(pair: FusionSpritePair): Promise<FusionSpriteVariant | null> {
  const variants = await probeFusionVariants(pair);
  if (variants.length <= 1) {
    return null;
  }
  const current = getPreferredFusionVariant(pair);
  const idx = variants.indexOf(current);
  const nextIdx = idx === -1 ? 0 : (idx + 1) % variants.length;
  const next = variants[nextIdx];
  setPreferredFusionVariant(pair, next || null);
  return next;
}

export function clearFusionVariantCache(): void {
  variantCache.clear();
}
