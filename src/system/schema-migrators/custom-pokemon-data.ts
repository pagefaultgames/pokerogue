import type { Z$PokemonData } from "#system/schemas/pokemon/pokemon-data";
import { NatureSchema } from "#system/schemas/pokemon/pokemon-nature";
import type z from "zod";

/**
 * Very early saves did not have `customPokemonData` and instead
 * stored things like nature overrides and abilities from MEs directly.
 * This migrator moves the properties into the `customPokemonData` field.
 */
export function PreCustomPokemonDataMigrator(
  data: z.output<typeof Z$PokemonData>,
): asserts data is z.output<typeof Z$PokemonData> {
  // Value of `-1` indicated no override, so we can ignore it.
  const nature = NatureSchema.safeParse(data.natureOverride);
  if (nature.success) {
    const customPokemonData = data.customPokemonData;
    // If natureOverride is valid, use it
    if (
      customPokemonData &&
      typeof customPokemonData === "object" &&
      ((customPokemonData as { nature?: number }).nature ?? -1) === -1
    ) {
      customPokemonData;
    } else {
      data.customPokemonData = {
        nature: nature.data,
      };
    }
  }
}
