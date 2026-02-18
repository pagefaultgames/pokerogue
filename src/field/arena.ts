import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import Overrides from "#app/overrides";
import { NIGHT_TIME } from "#constants/game-constants";
import type { ArenaTag, ArenaTagTypeMap } from "#data/arena-tag";
import { EntryHazardTag, getArenaTag } from "#data/arena-tag";
import { getDailyForcedWaveBiomePoolTier } from "#data/daily-seed/daily-run";
import { allBiomes } from "#data/data-lists";
import { SpeciesFormChangeRevertWeatherFormTrigger, SpeciesFormChangeWeatherTrigger } from "#data/form-change-triggers";
import type { PokemonSpecies } from "#data/pokemon-species";
import type { PositionalTag } from "#data/positional-tags/positional-tag";
import { PositionalTagManager } from "#data/positional-tags/positional-tag-manager";
import { getTerrainClearMessage, getTerrainStartMessage, Terrain, TerrainType } from "#data/terrain";
import {
  getLegendaryWeatherContinuesMessage,
  getWeatherClearMessage,
  getWeatherStartMessage,
  Weather,
} from "#data/weather";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import type { ArenaTagType } from "#enums/arena-tag-type";
import type { BattlerIndex } from "#enums/battler-index";
import { BiomeId } from "#enums/biome-id";
import { BiomePoolTier } from "#enums/biome-pool-tier";
import { CommonAnim } from "#enums/move-anims-common";
import type { MoveId } from "#enums/move-id";
import type { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TimeOfDay } from "#enums/time-of-day";
import { TrainerType } from "#enums/trainer-type";
import { WeatherType } from "#enums/weather-type";
import { TagAddedEvent, TagRemovedEvent, TerrainChangedEvent, WeatherChangedEvent } from "#events/arena";
import type { Pokemon } from "#field/pokemon";
import { FieldEffectModifier } from "#modifiers/modifier";
import type { Move } from "#moves/move";
import type { ArenaPokemonPools, TrainerPools } from "#types/biomes";
import type { Constructor } from "#types/common";
import type { RGBArray } from "#types/sprite-types";
import type { AbstractConstructor, Mutable } from "#types/type-helpers";
import { coerceArray } from "#utils/array";
import { NumberHolder, randSeedInt, randSeedItem } from "#utils/common";
import { enumValueToKey, getEnumValues } from "#utils/enums";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import { weightedPick } from "#utils/random";
import { inSpeedOrder } from "#utils/speed-order-generator";
import type { NonEmptyTuple } from "type-fest";

export class Arena {
  public readonly biomeId: BiomeId;

  public weather: Weather | null;
  public terrain: Terrain | null;

  /** All currently-active {@linkcode ArenaTag}s on both sides of the field. */
  public tags: ArenaTag[] = [];
  /** All currently-active {@linkcode PositionalTag}s on both sides of the field, sorted by tag type. */
  public readonly positionalTagManager: PositionalTagManager = new PositionalTagManager();

  public readonly bgm: string;

  public ignoreAbilities: boolean;
  public ignoringEffectSource: BattlerIndex | null;

  public playerTerasUsed = 0;
  /**
   * Saves the number of times a party pokemon faints during a arena encounter. \
   * {@linkcode globalScene.currentBattle.enemyFaints} is the corresponding faint counter for the enemy (this resets every wave).
   */
  public playerFaints: number;

  private lastTimeOfDay: TimeOfDay;

  private pokemonPool: ArenaPokemonPools;
  private readonly trainerPool: TrainerPools;

  public readonly eventTarget: EventTarget = new EventTarget();

  constructor(biomeId: BiomeId, playerFaints = 0) {
    this.biomeId = biomeId;
    this.playerFaints = playerFaints;

    this.bgm = getBiomeKey(biomeId);
    this.trainerPool = allBiomes.get(biomeId).trainerPool;

    this.updatePoolsForTimeOfDay();
  }

  // #region Getters

  public get weatherType(): WeatherType {
    return this.weather?.weatherType ?? WeatherType.NONE;
  }

  public get terrainType(): TerrainType {
    return this.terrain?.terrainType ?? TerrainType.NONE;
  }

  /**
   * The denominator for the chance for a trainer spawn
   * (e.g. if this is `4`, then the chance for a trainer battle in that biome is `1/4`)
   */
  public get trainerChance(): number {
    return allBiomes.get(this.biomeId).trainerChance;
  }

  /** A float representing the loop point of the current biome's bgm in seconds */
  public get bgmLoopPoint(): number {
    return allBiomes.get(this.biomeId).bgmLoopPoint;
  }

  public get bgTerrainColorRatioForBiome(): number {
    switch (this.biomeId) {
      case BiomeId.SPACE:
        return 1;
      case BiomeId.END:
        return 0;
    }

    return 131 / 180;
  }

  // #endregion
  // #region Misc Public Methods

  public init() {
    const biomeKey = getBiomeKey(this.biomeId);

    globalScene.arenaPlayer.setBiome(this.biomeId);
    globalScene.arenaPlayerTransition.setBiome(this.biomeId);
    globalScene.arenaEnemy.setBiome(this.biomeId);
    globalScene.arenaNextEnemy.setBiome(this.biomeId);
    globalScene.arenaBg.setTexture(`${biomeKey}_bg`);
    globalScene.arenaBgTransition.setTexture(`${biomeKey}_bg`);

    // Redo this on initialize because during save/load the current wave isn't always
    // set correctly during construction
    this.updatePoolsForTimeOfDay();
  }

  public setIgnoreAbilities(ignoreAbilities: boolean, ignoringEffectSource: BattlerIndex | null = null): void {
    this.ignoreAbilities = ignoreAbilities;
    this.ignoringEffectSource = ignoreAbilities ? ignoringEffectSource : null;
  }

  public resetPlayerFaintCount(): void {
    this.playerFaints = 0;
  }

  /** Clears weather, terrain and arena tags when entering new biome or trainer battle. */
  public resetArenaEffects(): void {
    // Don't reset weather if a Biome's permanent weather is active
    if (this.weather?.turnsLeft !== 0) {
      this.trySetWeather(WeatherType.NONE);
    }
    // Don't reset terrain if a Biome's permanent terrain is active
    if (this.terrain?.turnsLeft !== 0) {
      this.trySetTerrain(TerrainType.NONE, true);
    }
    this.resetPlayerFaintCount();
    this.removeAllTags();
  }

  // #endregion
  // #region Misc Private Methods

  /**
   * Generates a boss {@linkcode BiomePoolTier} for a given tier value.
   *
   * | Tier    | Tier Values | Chance |
   * |:-------:|:-----------:|:------:|
   * | Boss    | 20-63       | 44/64  |
   * | Boss R  | 6-19        | 14/64  |
   * | Boss SR | 1-5         | 5/64   |
   * | Boss UR | 0           | 1/64   |
   *
   * @param tierValue - Number from `0-63`
   * @returns the generated BiomePoolTier
   */
  private generateBossBiomeTier(tierValue: number): BiomePoolTier {
    if (tierValue >= 20) {
      return BiomePoolTier.BOSS;
    }
    if (tierValue >= 6) {
      return BiomePoolTier.BOSS_RARE;
    }
    if (tierValue >= 1) {
      return BiomePoolTier.BOSS_SUPER_RARE;
    }
    return BiomePoolTier.BOSS_ULTRA_RARE;
  }

  /**
   * Generates a non-boss {@linkcode BiomePoolTier} for a given tier value.
   *
   * | Tier       | Tier Values | Chance  |
   * |:----------:|:-----------:|:-------:|
   * | Common     | 156-511     | 356/512 |
   * | Uncommon   | 32-155      | 124/512 |
   * | Rare       | 6-31        | 26/512  |
   * | Super Rare | 1-5         | 5/512   |
   * | Ultra Rare | 0           | 1/512   |
   *
   * @param tierValue - Number from `0-511`
   * @returns the generated BiomePoolTier
   */
  private generateNonBossBiomeTier(tierValue: number): BiomePoolTier {
    if (tierValue >= 156) {
      return BiomePoolTier.COMMON;
    }
    if (tierValue >= 32) {
      return BiomePoolTier.UNCOMMON;
    }
    if (tierValue >= 6) {
      return BiomePoolTier.RARE;
    }
    if (tierValue >= 1) {
      return BiomePoolTier.SUPER_RARE;
    }
    return BiomePoolTier.ULTRA_RARE;
  }

  // #endregion
  // #region Weather

  /** @returns Whether or not the weather can be changed to the specified weather */
  public canSetWeather(weather: WeatherType): boolean {
    return this.weatherType !== weather;
  }

  /**
   * Sets weather to the override specified in `overrides.ts`
   */
  private overrideWeather(): void {
    const weather = Overrides.WEATHER_OVERRIDE;
    this.weather = new Weather(weather, 0);
    globalScene.phaseManager.unshiftNew("CommonAnimPhase", undefined, undefined, CommonAnim.SUNNY + (weather - 1));
    globalScene.phaseManager.queueMessage(getWeatherStartMessage(weather)!); // TODO: is this bang correct?
  }

  /**
   * Attempts to set a new weather to the battle
   * @param weather {@linkcode WeatherType} new {@linkcode WeatherType} to set
   * @param user {@linkcode Pokemon} that caused the weather effect
   * @returns true if new weather set, false if no weather provided or attempting to set the same weather as currently in use
   */
  public trySetWeather(weather: WeatherType, user?: Pokemon): boolean {
    if (Overrides.WEATHER_OVERRIDE) {
      this.overrideWeather();
      return true;
    }

    if (!this.canSetWeather(weather)) {
      return false;
    }

    const oldWeatherType = this.weatherType;

    if (
      this.weather?.isImmutable()
      && ![WeatherType.HARSH_SUN, WeatherType.HEAVY_RAIN, WeatherType.STRONG_WINDS, WeatherType.NONE].includes(weather)
    ) {
      globalScene.phaseManager.unshiftNew(
        "CommonAnimPhase",
        undefined,
        undefined,
        CommonAnim.SUNNY + (oldWeatherType - 1),
      );
      globalScene.phaseManager.queueMessage(getLegendaryWeatherContinuesMessage(oldWeatherType)!);
      return false;
    }

    const weatherDuration = new NumberHolder(0);

    if (user != null) {
      weatherDuration.value = 5;
      globalScene.applyModifier(FieldEffectModifier, user.isPlayer(), user, weatherDuration);
    }

    this.weather = weather ? new Weather(weather, weatherDuration.value, weatherDuration.value) : null;
    this.eventTarget.dispatchEvent(
      new WeatherChangedEvent(oldWeatherType, this.weather?.weatherType!, this.weather?.turnsLeft!),
    ); // TODO: this `x?.y!` is dumb, fix this

    if (this.weather) {
      globalScene.phaseManager.unshiftNew("CommonAnimPhase", undefined, undefined, CommonAnim.SUNNY + (weather - 1));
      globalScene.phaseManager.queueMessage(getWeatherStartMessage(weather)!); // TODO: is this bang correct?
    } else {
      globalScene.phaseManager.queueMessage(getWeatherClearMessage(oldWeatherType)!); // TODO: is this bang correct?
    }

    for (const pokemon of inSpeedOrder(ArenaTagSide.BOTH)) {
      // TODO: Specify the type of tags which are being removed here
      pokemon.findAndRemoveTags(
        tag => "weatherTypes" in tag && !(tag.weatherTypes as WeatherType[]).find(w => w === weather),
      );
      applyAbAttrs("PostWeatherChangeAbAttr", { pokemon, weather });
    }

    return true;
  }

  public isMoveWeatherCancelled(user: Pokemon, move: Move): boolean {
    return !!this.weather && !this.weather.isEffectSuppressed() && this.weather.isMoveWeatherCancelled(user, move);
  }

  /**
   * Function to trigger all weather based form changes
   * @param source - The Pokemon causing the changes by removing itself from the field
   */
  public triggerWeatherBasedFormChanges(source?: Pokemon): void {
    for (const p of inSpeedOrder(ArenaTagSide.BOTH)) {
      // TODO - This is a bandaid. Abilities leaving the field needs a better approach than
      // calling this method for every switch out that happens
      if (p === source) {
        continue;
      }
      const isCastformWithForecast = p.hasAbility(AbilityId.FORECAST) && p.species.speciesId === SpeciesId.CASTFORM;
      const isCherrimWithFlowerGift = p.hasAbility(AbilityId.FLOWER_GIFT) && p.species.speciesId === SpeciesId.CHERRIM;

      if (isCastformWithForecast || isCherrimWithFlowerGift) {
        globalScene.triggerPokemonFormChange(p, SpeciesFormChangeWeatherTrigger);
      }
    }
  }

  /** Function to trigger all weather based form changes back into their normal forms */
  public triggerWeatherBasedFormChangesToNormal(): void {
    for (const p of inSpeedOrder(ArenaTagSide.BOTH)) {
      const isCastformWithForecast =
        p.hasAbility(AbilityId.FORECAST, false, true) && p.species.speciesId === SpeciesId.CASTFORM;
      const isCherrimWithFlowerGift =
        p.hasAbility(AbilityId.FLOWER_GIFT, false, true) && p.species.speciesId === SpeciesId.CHERRIM;

      if (isCastformWithForecast || isCherrimWithFlowerGift) {
        globalScene.triggerPokemonFormChange(p, SpeciesFormChangeRevertWeatherFormTrigger);
      }
    }
  }

  /** Sets a random weather based on the time of day and the current biome */
  public setBiomeWeather(): void {
    let weatherPool = allBiomes.get(this.biomeId).weatherPool;

    if (timedEventManager.isEventActive()) {
      const eventWeather = timedEventManager.getWeather()?.[this.biomeId];
      if (eventWeather != null) {
        weatherPool = eventWeather;
      }
    }

    const weatherMap = new Map<WeatherType, number>();
    for (const id of getEnumValues(WeatherType)) {
      weatherMap.set(id, weatherPool[id] ?? 0);
    }

    // If the time is dusk or night, set the chance of sun to 0
    if (NIGHT_TIME.includes(this.getTimeOfDay())) {
      weatherMap.set(WeatherType.SUNNY, 0);
      // forest is unique
      if (this.biomeId === BiomeId.FOREST) {
        weatherMap.set(WeatherType.FOG, 1);
      }
    }

    if (weatherMap.values().every(v => v === 0)) {
      weatherMap.set(WeatherType.NONE, 1);
    }

    const randomWeather = weightedPick(weatherMap);
    this.trySetWeather(randomWeather);
  }

  // #endregion
  // #region Terrain

  /** @returns Whether or not the terrain can be set to the specified terrain */
  public canSetTerrain(terrain: TerrainType): boolean {
    return this.terrainType !== terrain;
  }

  /**
   * Attempt to set the current terrain to the specified type.
   * @param terrain - The {@linkcode TerrainType} to try and set.
   * @param ignoreAnim - (Default `false`) Whether to prevent showing an the animation
   * @param user - (Optional) The {@linkcode Pokemon} creating the terrain
   * @returns Whether the terrain was successfully set.
   */
  public trySetTerrain(terrain: TerrainType, ignoreAnim = false, user?: Pokemon): boolean {
    if (!this.canSetTerrain(terrain)) {
      return false;
    }

    const oldTerrainType = this.terrainType;

    const terrainDuration = new NumberHolder(0);

    if (user != null) {
      terrainDuration.value = 5;
      globalScene.applyModifier(FieldEffectModifier, user.isPlayer(), user, terrainDuration);
    }

    this.terrain = terrain ? new Terrain(terrain, terrainDuration.value, terrainDuration.value) : null;

    this.eventTarget.dispatchEvent(
      new TerrainChangedEvent(oldTerrainType, this.terrain?.terrainType!, this.terrain?.turnsLeft!),
    ); // TODO: are those bangs correct?

    if (this.terrain) {
      if (!ignoreAnim) {
        globalScene.phaseManager.unshiftNew(
          "CommonAnimPhase",
          undefined,
          undefined,
          CommonAnim.MISTY_TERRAIN + (terrain - 1),
        );
      }
      globalScene.phaseManager.queueMessage(getTerrainStartMessage(terrain));
    } else {
      globalScene.phaseManager.queueMessage(getTerrainClearMessage(oldTerrainType));
    }

    for (const pokemon of inSpeedOrder(ArenaTagSide.BOTH)) {
      pokemon.findAndRemoveTags(
        tag => "terrainTypes" in tag && !(tag.terrainTypes as TerrainType[]).find(t => t === terrain),
      );
      applyAbAttrs("PostTerrainChangeAbAttr", { pokemon, terrain });
      applyAbAttrs("TerrainEventTypeChangeAbAttr", { pokemon });
    }

    return true;
  }

  /** Override the terrain to the value set inside {@linkcode Overrides.STARTING_TERRAIN_OVERRIDE}. */
  private overrideTerrain(): void {
    const terrain = Overrides.STARTING_TERRAIN_OVERRIDE;
    // TODO: Add a flag for permanent terrains
    this.terrain = new Terrain(terrain, 0);
    this.eventTarget.dispatchEvent(
      new TerrainChangedEvent(TerrainType.NONE, this.terrain.terrainType, this.terrain.turnsLeft),
    );
    globalScene.phaseManager.unshiftNew(
      "CommonAnimPhase",
      undefined,
      undefined,
      CommonAnim.MISTY_TERRAIN + (terrain - 1),
    );
    globalScene.phaseManager.queueMessage(getTerrainStartMessage(terrain) ?? ""); // TODO: Remove `?? ""` when terrain-fail-msg branch removes `null` from these signatures
  }

  /** Sets a random terrain based on the biome */
  public setBiomeTerrain(): void {
    if (Overrides.STARTING_TERRAIN_OVERRIDE) {
      this.overrideTerrain();
      return;
    }

    const terrainPool = allBiomes.get(this.biomeId).terrainPool;
    const terrainMap = new Map<TerrainType, number>();
    for (const id of getEnumValues(TerrainType)) {
      terrainMap.set(id, terrainPool[id] ?? 0);
    }

    const randomTerrain = weightedPick(terrainMap);
    this.trySetTerrain(randomTerrain);
  }

  public isMoveTerrainCancelled(user: Pokemon, targets: BattlerIndex[], move: Move): boolean {
    return !!this.terrain && this.terrain.isMoveTerrainCancelled(user, targets, move);
  }

  // #endregion
  // #region Trainers

  public randomTrainerType(waveIndex: number, isBoss = false): TrainerType {
    const isTrainerBoss =
      this.trainerPool[BiomePoolTier.BOSS].length > 0
      && (globalScene.gameMode.isTrainerBoss(waveIndex, this.biomeId, globalScene.offsetGym) || isBoss);

    const tierValue = randSeedInt(isTrainerBoss ? 64 : 512);
    let tier = (isTrainerBoss ? this.generateBossBiomeTier : this.generateNonBossBiomeTier)(tierValue);

    console.log("Starting trainer pool tier:", BiomePoolTier[tier]);
    while (this.trainerPool[tier].length === 0 && tier > BiomePoolTier.COMMON) {
      console.log(`Downgraded trainer rarity tier from ${BiomePoolTier[tier]} to ${BiomePoolTier[tier - 1]}`);
      tier--;
    }

    const tierPool = this.trainerPool[tier];
    return tierPool.length > 0 ? randSeedItem(tierPool) : TrainerType.BREEDER;
  }

  // #endregion
  // #region Pokemon

  public updatePoolsForTimeOfDay(): void {
    const timeOfDay = this.getTimeOfDay();
    if (timeOfDay === this.lastTimeOfDay) {
      return;
    }
    this.pokemonPool = Object.entries(allBiomes.get(this.biomeId).pokemonPool).reduce(
      (acc, [tier, pool]) => {
        // TODO: Remove type assertion after https://github.com/pagefaultgames/pokerogue/pull/7078 is merged
        acc[tier as `${BiomePoolTier}`] = [...pool[TimeOfDay.ALL], ...pool[timeOfDay]];
        return acc;
      },
      {} as Mutable<ArenaPokemonPools>,
    );
    this.lastTimeOfDay = timeOfDay;
  }

  /**
   * Generate a random Pokemon species for the current biome
   * @param waveIndex - The current wave number
   * @param level - The level of the Pokemon to generate
   * @param attempt - Internal counter used to track legendary mon rerolls; **should always be 0** when called initially
   * @param luckValue - (Default `0`) The player's luck value, used to decrease the RNG ceiling of higher rarities
   *   (and thus make them more likely)
   * @param isBoss - (Optional) Whether the Pokemon is a boss
   * @returns A Pokemon species.
   */
  // TODO: Remove the `attempt` parameter
  // TODO: The only place that doesn't pass an explicit `luckValue` parameter is Illusion's enemy overrides;
  // remove parameter & replace with `globalScene.getLuckValue` in a future refactor
  public randomSpecies(waveIndex: number, level: number, attempt = 0, luckValue = 0, isBoss?: boolean): PokemonSpecies {
    const overrideSpecies = globalScene.gameMode.getOverrideSpecies(waveIndex);
    if (overrideSpecies) {
      return overrideSpecies;
    }

    // Boss pool is 0-63, non Boss pool is 0-512
    const isBossSpecies =
      globalScene.getEncounterBossSegments(waveIndex, level) > 0
      && this.pokemonPool[BiomePoolTier.BOSS].length > 0
      && (this.biomeId !== BiomeId.END
        || globalScene.gameMode.isClassic
        || globalScene.gameMode.isWaveFinal(waveIndex));

    let tier: BiomePoolTier;
    const forcedTier = getDailyForcedWaveBiomePoolTier(waveIndex);
    if (forcedTier !== null) {
      tier = forcedTier;
    } else {
      const rollMax = isBossSpecies ? 64 : 512;

      // Luck reduces the RNG ceiling by 0.5x for bosses or 2x otherwise
      const luckModifier = luckValue * (isBossSpecies ? 0.5 : 2);

      const rngRoll = randSeedInt(rollMax - luckModifier);
      tier = (isBossSpecies ? this.generateBossBiomeTier : this.generateNonBossBiomeTier)(rngRoll);
    }

    console.log("Starting species pool tier:", BiomePoolTier[tier]);

    // If the BiomePoolTier is empty, downgrade the rarity
    while (this.pokemonPool[tier].length === 0 && tier > BiomePoolTier.COMMON) {
      console.log(`Downgraded rarity tier from ${BiomePoolTier[tier]} to ${BiomePoolTier[tier - 1]}`);
      tier--;
    }

    const tierPool = this.pokemonPool[tier];
    let species: PokemonSpecies;
    if (tierPool.length === 0) {
      species = globalScene.randomSpecies(waveIndex, level);
    } else {
      species = getPokemonSpecies(randSeedItem(tierPool));
    }
    const regen = this.determineRerollIfHighBST(
      species.baseTotal,
      globalScene.gameMode.getWaveForDifficulty(waveIndex, true),
    );

    // Attempt to retry 10 times if generated a LegendLike with an incompatible level
    if (regen && attempt < 10) {
      console.log("Incompatible level: regenerating...");
      return this.randomSpecies(waveIndex, level, ++attempt, luckValue, isBoss);
    }

    // TODO: Clarify what the `isBoss` parameter does
    const newSpeciesId = species.getWildSpeciesForLevel(level, true, isBoss ?? isBossSpecies, globalScene.gameMode);
    if (newSpeciesId !== species.speciesId) {
      console.log("Replaced", SpeciesId[species.speciesId], "with", SpeciesId[newSpeciesId]);
      species = getPokemonSpecies(newSpeciesId);
    }

    return species;
  }

  /**
   * Helper method to determine whether or not to reroll a species generation attempt
   * based on the estimated BST and wave.
   * @param bst - The base stat total of the generated species
   * @param adjustedWave - The adjusted wave index, accounting for Daily Mode
   * @returns Whether rerolling is required
   */
  // TODO: Refactor so there is no rerolling required, instead modifying the pools directly
  private determineRerollIfHighBST(bst: number, adjustedWave: number): boolean {
    return bst >= 660
      ? adjustedWave < 80 // Wave 50+ in daily (however, max Daily wave is 50 currently so not possible)
      : adjustedWave < 55; // Wave 25+ in daily
  }

  // #endregion
  // #region Arena Tags

  /**
   * Applies each `ArenaTag` in this Arena, based on which side (self, enemy, or both) is passed in as a parameter
   * @param tagType - A constructor of an ArenaTag to filter tags by
   * @param side - The {@linkcode ArenaTagSide} dictating which side's arena tags to apply
   * @param args - Parameters for the tag
   * @privateRemarks
   * If you get errors mentioning incompatibility with overload signatures, review the arguments being passed
   * to ensure they are correct for the tag being used.
   */
  public applyTagsForSide<T extends ArenaTag>(
    tagType: Constructor<T> | AbstractConstructor<T>,
    side: ArenaTagSide,
    ...args: Parameters<T["apply"]>
  ): void;
  /**
   * Applies each `ArenaTag` in this Arena, based on which side (self, enemy, or both) is passed in as a parameter
   * @param tagType - The {@linkcode ArenaTagType} of the desired tag
   * @param side - The {@linkcode ArenaTagSide} dictating which side's arena tags to apply
   * @param args - Parameters for the tag
   */
  public applyTagsForSide<T extends ArenaTagType>(
    tagType: T,
    side: ArenaTagSide,
    ...args: Parameters<ArenaTagTypeMap[T]["apply"]>
  ): void;
  public applyTagsForSide<T extends ArenaTag>(
    tagType: T["tagType"] | Constructor<T> | AbstractConstructor<T>,
    side: ArenaTagSide,
    ...args: Parameters<T["apply"]>
  ): void {
    /** A lambda function to filter out incompatible tag types. */
    const sameTagType: (tag: ArenaTag) => tag is T =
      typeof tagType === "string" // formatting
        ? (t): t is T => t.tagType === tagType
        : (t): t is T => t instanceof tagType;

    for (const tag of this.tags) {
      if (!sameTagType(tag)) {
        continue;
      }

      if (side !== ArenaTagSide.BOTH && tag.side !== ArenaTagSide.BOTH && side !== tag.side) {
        continue;
      }

      tag.apply(...args);
    }
  }

  /**
   * Applies the specified tag to both sides (ie: both user and trainer's tag that match the Tag specified)
   * by calling {@linkcode applyTagsForSide()}
   * @param tagType - The {@linkcode ArenaTagType} of the desired tag
   * @param args - Parameters for the tag
   */
  public applyTags<T extends ArenaTagType>(tagType: T, ...args: Parameters<ArenaTagTypeMap[T]["apply"]>): void;
  /**
   * Applies the specified tag to both sides (ie: both user and trainer's tag that match the Tag specified)
   * by calling {@linkcode applyTagsForSide()}
   * @param tagType - A constructor of an ArenaTag to filter tags by
   * @param args - Parameters for the tag
   * @deprecated Use an `ArenaTagType` for `tagType` instead of an `ArenaTag` constructor
   */
  public applyTags<T extends ArenaTag>(
    tagType: Constructor<T> | AbstractConstructor<T>,
    ...args: Parameters<T["apply"]>
  ): void;
  public applyTags<T extends ArenaTag>(
    tagType: T["tagType"] | Constructor<T> | AbstractConstructor<T>,
    ...args: Parameters<T["apply"]>
  ) {
    // @ts-expect-error - Overload resolution
    this.applyTagsForSide(tagType, ArenaTagSide.BOTH, ...args);
  }

  /**
   * Add a new {@linkcode ArenaTag} to the arena, triggering overlap effects on existing tags as applicable.
   * @param tagType - The {@linkcode ArenaTagType} of the tag to add.
   * @param turnCount - The number of turns the newly-added tag should last.
   * @param sourceId - The {@linkcode Pokemon.id | PID} of the Pokemon creating the tag.
   * @param sourceMove - The {@linkcode MoveId} of the move creating the tag, or `undefined` if not from a move.
   * @param side - The {@linkcode ArenaTagSide}(s) to which the tag should apply; default `ArenaTagSide.BOTH`.
   * @param quiet - Whether to suppress messages produced by tag addition; default `false`.
   * @returns `true` if the tag was successfully added without overlapping.
   */
  // TODO: Do we need the return value here? literally nothing uses it
  public addTag(
    tagType: ArenaTagType,
    turnCount: number,
    sourceMove: MoveId | undefined,
    sourceId: number,
    side: ArenaTagSide = ArenaTagSide.BOTH,
    quiet = false,
  ): boolean {
    const existingTag = this.getTagOnSide(tagType, side);
    if (existingTag) {
      existingTag.onOverlap(globalScene.getPokemonById(sourceId));

      if (existingTag instanceof EntryHazardTag) {
        const { tagType, side, turnCount, maxDuration, layers, maxLayers } = existingTag as EntryHazardTag;
        this.eventTarget.dispatchEvent(new TagAddedEvent(tagType, side, turnCount, maxDuration, layers, maxLayers));
      }

      return false;
    }

    // creates a new tag object
    const newTag = getArenaTag(tagType, turnCount, sourceMove, sourceId, side);
    if (newTag) {
      newTag.onAdd(quiet);
      this.tags.push(newTag);

      const { layers = 0, maxLayers = 0 } = newTag instanceof EntryHazardTag ? newTag : {};

      this.eventTarget.dispatchEvent(
        new TagAddedEvent(newTag.tagType, newTag.side, newTag.turnCount, newTag.maxDuration, layers, maxLayers),
      );
    }

    return true;
  }

  /**
   * Attempt to get a tag from the Arena via {@linkcode getTagOnSide} that applies to both sides
   * @param tagType - The {@linkcode ArenaTagType} to retrieve
   * @returns The existing {@linkcode ArenaTag}, or `undefined` if not present.
   */
  public getTag(tagType: ArenaTagType): ArenaTag | undefined;
  /**
   * Attempt to get a tag from the Arena via {@linkcode getTagOnSide} that applies to both sides
   * @param tagType - The constructor of the {@linkcode ArenaTag} to retrieve
   * @returns The existing {@linkcode ArenaTag}, or `undefined` if not present.
   */
  public getTag<T extends ArenaTag>(tagType: Constructor<T> | AbstractConstructor<T>): T | undefined;
  public getTag(tagType: ArenaTagType | Constructor<ArenaTag> | AbstractConstructor<ArenaTag>): ArenaTag | undefined {
    return this.getTagOnSide(tagType, ArenaTagSide.BOTH);
  }

  /**
   * Check whether the Arena has any of the given tags.
   * @param tagTypes - One or more tag types to check
   * @returns Whether a tag exists on either side of the field with any of the given type(s).
   */
  public hasTag(tagTypes: ArenaTagType | NonEmptyTuple<ArenaTagType>): boolean {
    tagTypes = coerceArray(tagTypes);
    return this.tags.some(tag => tagTypes.includes(tag.tagType));
  }

  /**
   * Attempts to get a tag from the Arena from a specific side (the tag passed in has to either apply to both sides, or the specific side only)
   *
   * eg: `MIST` only applies to the user's side, while `MUD_SPORT` applies to both user and enemy side
   * @param tagType The {@linkcode ArenaTagType} or {@linkcode ArenaTag} to get
   * @param side The {@linkcode ArenaTagSide} to look at
   * @returns either the {@linkcode ArenaTag}, or `undefined` if it isn't there
   */
  public getTagOnSide(
    tagType: ArenaTagType | Constructor<ArenaTag> | AbstractConstructor<ArenaTag>,
    side: ArenaTagSide,
  ): ArenaTag | undefined {
    return typeof tagType === "string"
      ? this.tags.find(
          t => t.tagType === tagType && (side === ArenaTagSide.BOTH || t.side === ArenaTagSide.BOTH || t.side === side),
        )
      : this.tags.find(
          t => t instanceof tagType && (side === ArenaTagSide.BOTH || t.side === ArenaTagSide.BOTH || t.side === side),
        );
  }

  // TODO: Add an overload similar to `Array.prototype.find` if the predicate func is of the form
  // `(x): x is T`

  /**
   * Uses {@linkcode findTagsOnSide} to filter (using the parameter function) for specific tags that apply to both sides
   * @param tagPredicate a function mapping {@linkcode ArenaTag}s to `boolean`s
   * @returns array of {@linkcode ArenaTag}s from which the Arena's tags return true and apply to both sides
   */
  public findTags(tagPredicate: (t: ArenaTag) => boolean): ArenaTag[] {
    return this.findTagsOnSide(tagPredicate, ArenaTagSide.BOTH);
  }

  /**
   * Returns specific tags from the arena that pass the `tagPredicate` function passed in as a parameter, and apply to the given side
   * @param tagPredicate a function mapping {@linkcode ArenaTag}s to `boolean`s
   * @param side The {@linkcode ArenaTagSide} to look at
   * @returns array of {@linkcode ArenaTag}s from which the Arena's tags return `true` and apply to the given side
   */
  public findTagsOnSide(tagPredicate: (t: ArenaTag) => boolean, side: ArenaTagSide): ArenaTag[] {
    return this.tags.filter(
      t => tagPredicate(t) && (side === ArenaTagSide.BOTH || t.side === ArenaTagSide.BOTH || t.side === side),
    );
  }

  public lapseTags(): void {
    this.tags
      .filter(t => !t.lapse())
      .forEach(t => {
        t.onRemove();
        this.tags.splice(this.tags.indexOf(t), 1);

        this.eventTarget.dispatchEvent(new TagRemovedEvent(t.tagType, t.side, t.turnCount));
      });
  }

  public removeTag(tagType: ArenaTagType): boolean {
    const tags = this.tags;
    const tag = tags.find(t => t.tagType === tagType);
    if (tag) {
      tag.onRemove();
      tags.splice(tags.indexOf(tag), 1);

      this.eventTarget.dispatchEvent(new TagRemovedEvent(tag.tagType, tag.side, tag.turnCount));
    }
    return !!tag;
  }

  public removeTagOnSide(tagType: ArenaTagType, side: ArenaTagSide, quiet = false): boolean {
    const tag = this.getTagOnSide(tagType, side);
    if (tag) {
      tag.onRemove(quiet);
      this.tags.splice(this.tags.indexOf(tag), 1);

      this.eventTarget.dispatchEvent(new TagRemovedEvent(tag.tagType, tag.side, tag.turnCount));
    }
    return !!tag;
  }

  /**
   * Find and remove all {@linkcode ArenaTag}s with the given tag types on the given side of the field.
   * @param tagTypes - The {@linkcode ArenaTagType}s to remove
   * @param side - The {@linkcode ArenaTagSide} to remove the tags from (for side-based tags), or {@linkcode ArenaTagSide.BOTH}
   * to clear all tags on either side of the field
   * @param quiet - Whether to suppress removal messages from currently-present tags; default `false`
   * @todo Review the other tag manipulation functions to see if they can be migrated towards using this (more efficient + foolproof)
   */
  public removeTagsOnSide(tagTypes: ArenaTagType[] | readonly ArenaTagType[], side: ArenaTagSide, quiet = false): void {
    const leftoverTags: ArenaTag[] = [];
    for (const tag of this.tags) {
      // Skip tags of different types or on the wrong side of the field
      if (
        !tagTypes.includes(tag.tagType)
        || !(side === ArenaTagSide.BOTH || tag.side === ArenaTagSide.BOTH || tag.side === side)
      ) {
        leftoverTags.push(tag);
        continue;
      }

      tag.onRemove(quiet);
      this.eventTarget.dispatchEvent(new TagRemovedEvent(tag.tagType, tag.side, tag.turnCount));
    }

    this.tags = leftoverTags;
  }

  public removeAllTags(): void {
    while (this.tags.length > 0) {
      this.tags[0].onRemove();
      this.eventTarget.dispatchEvent(
        new TagRemovedEvent(this.tags[0].tagType, this.tags[0].side, this.tags[0].turnCount),
      );

      this.tags.splice(0, 1);
    }
  }

  // #endregion
  // #region Time of Day

  public getTimeOfDay(): TimeOfDay {
    switch (this.biomeId) {
      case BiomeId.ABYSS:
        return TimeOfDay.NIGHT;
    }

    if (Overrides.TIME_OF_DAY_OVERRIDE !== null) {
      return Overrides.TIME_OF_DAY_OVERRIDE;
    }

    const waveCycle = ((globalScene.currentBattle?.waveIndex ?? 0) + globalScene.waveCycleOffset) % 40;

    if (waveCycle < 15) {
      return TimeOfDay.DAY;
    }
    if (waveCycle < 20) {
      return TimeOfDay.DUSK;
    }
    if (waveCycle < 35) {
      return TimeOfDay.NIGHT;
    }

    return TimeOfDay.DAWN;
  }

  /**
   * @returns Whether the current biome takes place "outdoors"
   * (for the purposes of time of day tints)
   */
  public isOutside(): boolean {
    switch (this.biomeId) {
      case BiomeId.SEABED:
      case BiomeId.CAVE:
      case BiomeId.ICE_CAVE:
      case BiomeId.POWER_PLANT:
      case BiomeId.DOJO:
      case BiomeId.FACTORY:
      case BiomeId.ABYSS:
      case BiomeId.FAIRY_CAVE:
      case BiomeId.TEMPLE:
      case BiomeId.LABORATORY:
        return false;
      default:
        return true;
    }
  }

  public getDayTint(): RGBArray {
    switch (this.biomeId) {
      case BiomeId.ABYSS:
        return [64, 64, 64];
      default:
        return [128, 128, 128];
    }
  }

  public getDuskTint(): RGBArray {
    if (!this.isOutside()) {
      return [0, 0, 0];
    }

    return [113, 88, 101];
  }

  public getNightTint(): RGBArray {
    switch (this.biomeId) {
      case BiomeId.ABYSS:
      case BiomeId.SPACE:
      case BiomeId.END:
        return this.getDayTint();
    }

    if (!this.isOutside()) {
      return [64, 64, 64];
    }

    return [48, 48, 98];
  }

  // #endregion

  // TODO: replace this
  getAttackTypeMultiplier(attackType: PokemonType, grounded: boolean): number {
    let weatherMultiplier = 1;
    if (this.weather && !this.weather.isEffectSuppressed()) {
      weatherMultiplier = this.weather.getAttackTypeMultiplier(attackType);
    }

    let terrainMultiplier = 1;
    if (this.terrain && grounded) {
      terrainMultiplier = this.terrain.getAttackTypeMultiplier(attackType);
    }

    return weatherMultiplier * terrainMultiplier;
  }
}

// #region Helper Functions

export function getBiomeKey(biomeId: BiomeId): string {
  return enumValueToKey(BiomeId, biomeId).toLowerCase();
}

export function getBiomeHasProps(biomeId: BiomeId): boolean {
  switch (biomeId) {
    case BiomeId.PLAINS:
    case BiomeId.METROPOLIS:
    case BiomeId.BEACH:
    case BiomeId.LAKE:
    case BiomeId.SEABED:
    case BiomeId.MOUNTAIN:
    case BiomeId.BADLANDS:
    case BiomeId.CAVE:
    case BiomeId.DESERT:
    case BiomeId.ICE_CAVE:
    case BiomeId.MEADOW:
    case BiomeId.POWER_PLANT:
    case BiomeId.VOLCANO:
    case BiomeId.GRAVEYARD:
    case BiomeId.FACTORY:
    case BiomeId.RUINS:
    case BiomeId.WASTELAND:
    case BiomeId.ABYSS:
    case BiomeId.CONSTRUCTION_SITE:
    case BiomeId.JUNGLE:
    case BiomeId.FAIRY_CAVE:
    case BiomeId.TEMPLE:
    case BiomeId.SNOWY_FOREST:
    case BiomeId.ISLAND:
    case BiomeId.LABORATORY:
    case BiomeId.END:
      return true;
  }

  return false;
}

// #endregion
