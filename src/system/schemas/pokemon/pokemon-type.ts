import { z } from "zod";

/**
 * Schema for a Pokémon's type, as of version 1.10
 * - `-1`: Unknown (aka typeless),
 * - `0`: Normal,
 * - `1`: Fighting,
 * - `2`: Flying,
 * - `3`: Poison,
 * - `4`: Ground,
 * - `5`: Rock,
 * - `6`: Bug,
 * - `7`: Ghost,
 * - `8`: Steel,
 * - `9`: Fire,
 * - `10`: Water,
 * - `11`: Grass,
 * - `12`: Electric,
 * - `13`: Psychic,
 * - `14`: Ice,
 * - `15`: Dragon,
 * - `16`: Dark,
 * - `17`: Fairy
 * - `18`: Stellar
 */
export const Z$PokemonType = z.literal([-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
