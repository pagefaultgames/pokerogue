/**
 * Dex entry for a single Pokemon Species
 */
export interface DexEntry {
  seenAttr: bigint;
  caughtAttr: bigint;
  natureAttr: number;
  seenCount: number;
  caughtCount: number;
  hatchedCount: number;
  ivs: number[];
}

export interface DexData {
  [key: number]: DexEntry;
}
