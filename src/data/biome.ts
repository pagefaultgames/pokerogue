import type { TerrainType } from "#data/terrain";
import type { BiomeId } from "#enums/biome-id";
import type { WeatherType } from "#enums/weather-type";
import type { BiomeLinks, BiomePokemonPools, TerrainPool, TrainerPools, WeatherPool } from "#types/biomes";

export class Biome {
  /** The biome's ID */
  public readonly biomeId: BiomeId;
  /** A mapping of `BiomePoolTier` to `TimeOfDay` to `SpeciesId` representing the wild Pokemon that appear */
  public readonly pokemonPool: BiomePokemonPools;
  /** A mapping of `BiomePoolTier` to a list of `TrainerType` representing the trainers that appear */
  public readonly trainerPool: TrainerPools;
  /** The chance of a trainer where `trainerChance` is the denominator. A value of `0` means no trainer */
  public readonly trainerChance: number;
  /**
   * A mapping of {@linkcode WeatherType} to weight for what weather the biome will attempt to set upon entry.
   * @remarks
   * The chance of sun is set to `0` if it is dusk/night
   */
  public readonly weatherPool: WeatherPool;
  /** A mapping of {@linkcode TerrainType} to weight for what terrain the biome will attempt to set upon entry */
  public readonly terrainPool: TerrainPool;
  /** A string representing the bgm of the biome. Only needed if the bgm name doesn't match the biome name. */
  public readonly bgm: string;
  /** A float representing the loop point of the biome's bgm in seconds */
  public readonly bgmLoopPoint: number;
  /** The biomes that can be travelled to from this biome */
  public readonly biomeLinks: BiomeLinks;

  // biome-ignore lint/nursery/useMaxParams: ...
  constructor(
    biomeId: BiomeId,
    pokemonPool: BiomePokemonPools,
    trainerPool: TrainerPools,
    trainerChance: number,
    weatherPool: WeatherPool,
    terrainPool: TerrainPool,
    bgmLoopPoint: number,
    biomeLinks: BiomeLinks,
    bgm = "",
  ) {
    this.biomeId = biomeId;
    this.pokemonPool = pokemonPool;
    this.trainerPool = trainerPool;
    this.trainerChance = trainerChance;
    this.weatherPool = weatherPool;
    this.terrainPool = terrainPool;
    this.bgmLoopPoint = bgmLoopPoint;
    this.biomeLinks = biomeLinks;
    this.bgm = bgm;
  }
}
