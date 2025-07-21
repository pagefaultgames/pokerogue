import { z } from "zod";

/**
 * Schema for biome IDs, as of version 1.10
 *
 * @remarks
 * - `0`: Town,
 * - `1`: Plains,
 * - `2`: Grass,
 * - `3`: Tall Grass,
 * - `4`: Metropolis,
 * - `5`: Forest,
 * - `6`: Sea,
 * - `7`: Swamp,
 * - `8`: Beach,
 * - `9`: Lake,
 * - `10`: Seabed,
 * - `11`: Mountain,
 * - `12`: Badlands,
 * - `13`: Cave,
 * - `14`: Desert,
 * - `15`: Ice Cave,
 * - `16`: Meadow,
 * - `17`: Power Plant,
 * - `18`: Volcano,
 * - `19`: Graveyard,
 * - `20`: Dojo,
 * - `21`: Factory,
 * - `22`: Ruins,
 * - `23`: Wasteland,
 * - `24`: Abyss,
 * - `25`: Space,
 * - `26`: Construction Site,
 * - `27`: Jungle,
 * - `28`: Fairy Cave,
 * - `29`: Temple,
 * - `30`: Slum,
 * - `31`: Snowy Forest,
 * - `40`: Island,
 * - `41`: Laboratory,
 * - `50`: End
 */
export const Z$BiomeID = z.literal([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  40, 41, 50,
]);

/**
 * Schema for a pokemon's met biome, as of version 1.10
 * Same as {@linkcode Z$BiomeID}, additionally allowing `-1` for starters.
 */
export const Z$MetBiome = z.union([
  z.literal(-1), // For starters
  Z$BiomeID, // All other biomes
]);
