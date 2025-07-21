import { Z$BoolCatchToFalse, Z$NonNegativeInt, Z$PositiveInt } from "#schemas/common";
import { Z$PokeballType } from "#schemas/pokeball-type";
import { Z$PokemonMove } from "#schemas/pokemon-move";
import { Z$Gender } from "#system/schemas/v1.10/pokemon-gender";
import z from "zod";
import { NatureSchema } from "./pokemon-nature";
import { IVSetSchema, statSetSchema } from "./pokemon-stats";
import { Z$PokemonType } from "./pokemon-type";
import { StatusSchema } from "./status-effect";

/**
 *  Not meant to actually be used itself.
 * Instead, use either {@linkcode Z$PlayerPokemonData} or {@linkcode Z$EnemyPokemonData}.
 * `looseObject` used here to allow properties specific to player or enemy Pokémon
 * to be handled by their respective schemas.
 */
const Z$PokemonData = z.looseObject({
  // malformed pokemon ids are _not_ supported.
  id: z.uint32(),
  species: z.uint32(),
  nickname: z.string().optional(),
  formIndex: Z$NonNegativeInt.catch(0),
  // Between 0 and 2, with malformed inputs defaulting to 0
  abilityIndex: z.int().min(0).max(2).catch(0),
  passive: Z$BoolCatchToFalse,
  shiny: Z$BoolCatchToFalse,
  variant: z.literal([0, 1, 2]).catch(0),
  pokeball: Z$PokeballType.catch(0),

  // No fallbacks for level
  level: Z$NonNegativeInt,
  // TODO: Fallback to minimum experience for level if parsing error?
  exp: Z$NonNegativeInt,
  // Fallback to 0, patch in transformer
  levelExp: Z$NonNegativeInt.catch(0),
  // Fallback to -1, patch to a default gender in the transformer.
  gender: Z$Gender.catch(-1),
  // hp can be 0 if fainted
  hp: Z$NonNegativeInt,
  stats: statSetSchema,
  ivs: IVSetSchema,
  nature: NatureSchema,
  moveset: z.array(Z$PokemonMove).catch([]),
  status: z.union([z.null(), StatusSchema]).catch(null),
  friendship: z.int().min(0).max(255).catch(0),

  //#region "met" information
  metLevel: z.int().positive().catch(1),
  metBiome: z.union([z.int().nonnegative(), z.literal(-1)]).catch(-1), // -1 for starters
  metSpecies: z.uint32(),
  metWave: z.int().min(-1).default(0),
  //#endregion "met" information

  luck: Z$NonNegativeInt.catch(0),
  teraType: Z$PokemonType,
  isTerastallized: Z$BoolCatchToFalse,
  stellarTypesBoosted: z.array(Z$PokemonType).catch([]),

  //#region "fusion" information
  fusionSpecies: z.uint32().optional(),
  fusionFormIndex: Z$NonNegativeInt.optional(),
  fusionAbilityIndex: z.int().min(0).max(2).optional().catch(0),
  fusionShiny: Z$BoolCatchToFalse,
  fusionLuck: Z$NonNegativeInt.catch(0),
  //#endregion "fusion" information

  pokerus: z.boolean().catch(false),
});

export const Z$PlayerPokemonData = z.object({
  ...Z$PokemonData.shape,
  player: z.transform((): true => true),
  pauseEvolutions: Z$BoolCatchToFalse,
  // Assume player pokemon can never be bosses
  boss: z.transform((): false => false),
  bossSegments: z.transform((): 0 => 0),
  // 0 is unknown, -1 is starter
  metWave: z.int().min(-1).default(0),
  usedTms: z.array(Z$PositiveInt).catch([]),
  // Fallback for empty pokemon movesets handled by transformer
  moveset: z.array(Z$PokemonMove).catch([]),
});

export const Z$EnemyPokemonData = z.object({
  ...Z$PokemonData.shape,
  player: z.transform((): false => false),
  boss: z.boolean().catch(false),
  bossSegments: z.int().nonnegative().default(0),
});



// TODO: Replace output assertion type with the type of pokemon data that has CustomPokemonData.
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

export type PreParsedPokemonData = z.input<typeof Z$PokemonData>;
export type ParsedPokemonData = z.output<typeof Z$PokemonData>;

export type PreParsedPlayerPokemonData = z.input<typeof Z$PlayerPokemonData>;
export type ParsedPlayerPokemon = z.output<typeof Z$PlayerPokemonData>;

export type PreParsedEnemyPokemonData = z.input<typeof Z$EnemyPokemonData>;
export type ParsedEnemyPokemon = z.output<typeof Z$EnemyPokemonData>;
