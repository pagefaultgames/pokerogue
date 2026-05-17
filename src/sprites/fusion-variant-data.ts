// Vanilla populates `variantColorCache` lazily via `loadAssets()`, so UI-only
// fusion previews (starter-select) have nothing to map. We keep our own cache
// keyed by raw speciesId to sidestep vanilla's sprite-key derivation.

type VariantJson = Record<string, Record<string, string>>;

const cache = new Map<number, VariantJson | null>();
const inflight = new Map<number, Promise<VariantJson | null>>();

/** Returns the cached variant JSON for a species, or null if unavailable. */
export function getVariantData(speciesId: number): VariantJson | null {
  return cache.get(speciesId) ?? null;
}

/** Fetch and cache the variant JSON for a species. Idempotent. */
export async function ensureVariantDataLoaded(speciesId: number): Promise<void> {
  if (cache.has(speciesId)) {
    return;
  }
  const existing = inflight.get(speciesId);
  if (existing) {
    await existing;
    return;
  }
  const p = (async (): Promise<VariantJson | null> => {
    try {
      const res = await fetch(`/images/pokemon/variant/${speciesId}.json`);
      if (!res.ok) {
        cache.set(speciesId, null);
        return null;
      }
      const json = (await res.json()) as VariantJson;
      cache.set(speciesId, json);
      return json;
    } catch {
      cache.set(speciesId, null);
      return null;
    }
  })();
  inflight.set(speciesId, p);
  p.finally(() => inflight.delete(speciesId));
  await p;
}
