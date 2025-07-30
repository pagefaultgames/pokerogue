import { Z$PositiveInt } from "#system/schemas/common";
import type { Z$IllusionData } from "#system/schemas/pokemon/illusion-data";
import { isNullOrUndefined } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import { z } from "zod";

/**
 * In version 1.9, serialized illusion data looked like this, where `basePokemon` held
 * information about the pokemon that had the illusion ability, while the pokemon's own
 * properties were modified. (though were overwritten on save).
 *
 * ```ts
 * interface IllusionData {
 *   basePokemon: {
 *     name: string;
 *     nickname: string;
 *     shiny: boolean;
 *     variant: Variant;
 *     fusionShiny: boolean;
 *     fusionVariant: Variant;
 *   }
 *   species: Species;
 *   formIndex: number;
 *   gender: Gender;
 *   pokeball: PokeballType;
 *   fusionSpecies?: PokemonSpecies;
 *   fusionFormIndex?: number;
 *   fusionGender?: Gender;
 *   level?: number
 * ```
 *
 * As this version of the data is compatible with version 1.10, we only need to specify the new properties.
 * In addition, the value type of `fusionSpecies` changed from `PokemonSpecies` to simply the species ID.
 */
export const Z$V1_9_IllusionData = z.looseObject({
  species: Z$PositiveInt,
  fusionSpecies: z
    .object({
      speciesId: Z$PositiveInt,
    })
    .optional()
    .catch(undefined),
});
type V1_9_IllusionData = z.input<typeof Z$V1_9_IllusionData>;

/**
 * Migrate illusion data from version 1.9 to 1.10
 *
 * @remarks
 * Extracts `speciesId` from `fusionSpecies`, and use defaults for all fields from the illusioned pokemon.
 *
 * In version 1.9, the illusion's name and shiny state were not serialized.
 * The name is recoverable from the species ID, but shiny state is not recoverable.
 */
export function V1_10_IllusionDataMigrator(arg: V1_9_IllusionData): Partial<z.input<typeof Z$IllusionData>> {
  return Z$V1_9_IllusionData.transform(data => {
    // Needed to fetch a default name.
    const pokemon = getPokemonSpecies(data.species);
    const result = {
      ...(data as Omit<V1_9_IllusionData, "fusionSpecies">),
      name: pokemon.name,
      shiny: false,
    } as Partial<z.input<typeof Z$IllusionData>>;

    // With no fusion species, these fields should be left undefined.
    if (!isNullOrUndefined(data.fusionSpecies)) {
      result.fusionSpecies = data.fusionSpecies.speciesId;
      result.fusionShiny = false; // default shiny state
      result.fusionVariant = 0; // default variant
    }
    return result;
  }).parse(arg);
}
