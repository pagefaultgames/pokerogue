import { getFileFromIfFolder } from "#system/if-folder-handle";

interface IfDexRecord {
  sprite: string;
  entry: string;
  author?: string;
}

/** `POKENAME` has already been substituted in `text`. */
export interface IfFusionDexEntry {
  text: string;
  author: string;
}

let cache: Map<string, IfDexRecord[]> | null = null;
let loadPromise: Promise<void> | null = null;

function pairKey(ifHead: number, ifBody: number): string {
  return `${ifHead}.${ifBody}`;
}

function parseSpriteKey(sprite: string): string | null {
  // Strip extension and artist-variant suffix so all variants of a pair share one key.
  const m = /^(\d+)\.(\d+)[a-z]*\.png$/i.exec(sprite);
  return m ? `${m[1]}.${m[2]}` : null;
}

/** Idempotent; safe to call from UI render paths. */
export async function ensureIfDexLoaded(): Promise<void> {
  if (cache !== null) {
    return;
  }
  if (loadPromise) {
    return loadPromise;
  }
  loadPromise = (async () => {
    const file = await getFileFromIfFolder("Data/dex.json");
    if (!file) {
      cache = new Map();
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      cache = new Map();
      if (Array.isArray(parsed)) {
        for (const raw of parsed) {
          if (
            raw
            && typeof raw === "object"
            && typeof (raw as IfDexRecord).sprite === "string"
            && typeof (raw as IfDexRecord).entry === "string"
          ) {
            const rec = raw as IfDexRecord;
            const key = parseSpriteKey(rec.sprite);
            if (!key) {
              continue;
            }
            const existing = cache.get(key);
            if (existing) {
              existing.push(rec);
            } else {
              cache.set(key, [rec]);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Failed to parse IF Data/dex.json:", err);
      cache = new Map();
    }
  })();
  await loadPromise;
  loadPromise = null;
}

/**
 * Looks up a pokedex entry for the IF id pair. Returns null when no entry
 * is registered, the dex isn't loaded, or no IF folder is configured.
 * `pickIndex` selects among multi-author records (default 0 for stability).
 */
export function getIfFusionDexEntry(
  ifHead: number,
  ifBody: number,
  pokemonName: string,
  pickIndex = 0,
): IfFusionDexEntry | null {
  if (!cache) {
    return null;
  }
  const records = cache.get(pairKey(ifHead, ifBody));
  if (!records || records.length === 0) {
    return null;
  }
  const rec = records[pickIndex % records.length];
  return {
    text: rec.entry.replace(/POKENAME/g, pokemonName),
    author: rec.author ?? "",
  };
}

export function countIfFusionDexEntries(ifHead: number, ifBody: number): number {
  if (!cache) {
    return 0;
  }
  return cache.get(pairKey(ifHead, ifBody))?.length ?? 0;
}

export function clearIfDexCache(): void {
  cache = null;
  loadPromise = null;
}
