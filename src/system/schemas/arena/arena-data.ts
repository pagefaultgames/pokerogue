// biome-ignore-start lint/correctness/noUnusedImports: used in a tsdoc comment
import type { SerializedArenaData } from "#system/arena-data";
import { Z$Terrain } from "#system/schemas/arena/terrain";
import { Z$Weather } from "#system/schemas/arena/weather";
// biome-ignore-end lint/correctness/noUnusedImports: end
import { Z$BiomeID } from "#system/schemas/biome-id";
import { Z$NonNegativeInt } from "#system/schemas/common";
import { z } from "zod";

/**
 * Zod schema for {@linkcode SerializedArenaData} as of version 1.10
 */
export const Z$ArenaData = z.object({
  biome: Z$BiomeID,
  weather: Z$Weather.optional().catch(undefined),
  terrain: Z$Terrain.optional().catch(undefined),
  tags: z
    .array(0 as unknown as any)
    .optional()
    .catch(undefined),
  playerTerasUsed: Z$NonNegativeInt.optional().catch(undefined),
});
