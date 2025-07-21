import { z } from "zod";

/**
 * Zod schema for Berry types as of version 1.10.
 *
 * @remarks
 * - `0`: Sitrus
 * - `1`: Lum
 * - `2`: Enigma
 * - `3`: Liechi
 * - `4`: Ganlon
 * - `5`: Petaya
 * - `6`: Apicot
 * - `7`: Salac
 * - `8`: Lansat
 * - `9`: Starf
 * - `10`: Leppa
 */
export const Z$BerryType = z.literal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
