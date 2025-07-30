// biome-ignore-start lint/correctness/noUnusedImports: used in a tsdoc commentD
import type { SerializedTerrain, TerrainType } from "#data/terrain";
// biome-ignore-end lint/correctness/noUnusedImports: end
import { z } from "zod";

/**
 * Zod schema for {@linkcode TerrainType} as of version 1.10.
 *
 * @remarks
 * - `0`: NONE,
 * - `1`: MISTY,
 * - `2`: ELECTRIC,
 * - `3`: GRASSY,
 * - `4`: PSYCHIC
 */
export const Z$TerrainType = z.literal([0, 1, 2, 3, 4]);

/**
 * Zod schema for {@linkcode SerializedTerrain} as of version 1.10.
 */
export const Z$Terrain = z.object({
  terrainType: Z$TerrainType,
  turnsLeft: z.int(),
});
