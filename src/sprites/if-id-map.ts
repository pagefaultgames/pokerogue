// IF uses its own numbering distinct from NatDex: Gen 1+2 mostly align (1-251),
// but from IF 252 onward Gen 4 evos of older species (Ambipom, Mismagius, …,
// Rhyperior=265, Porygon-Z=275) precede Gen 3 (Treecko=276).

import rawMap from "./if-id-map.json";

const natdexToIf = rawMap as Record<string, number>;

/**
 * Translate a NatDex species id to the IF pack's id for sprite URL construction.
 * @returns the IF id, or null when the species has no IF equivalent.
 */
export function natdexToIfId(natdexId: number): number | null {
  const if_ = natdexToIf[String(natdexId)];
  return typeof if_ === "number" ? if_ : null;
}
