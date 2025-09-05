// biome-ignore-start lint/correctness/noUnusedImports: TSDoc imports
import type { PositionalTag } from "#data/positional-tags/positional-tag";
// biome-ignore-end lint/correctness/noUnusedImports: TSDoc imports

import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import Overrides from "#app/overrides";
import type { BiomeTierTrainerPools, PokemonPools } from "#balance/biomes";
import { BiomePoolTier, biomePokemonPools, biomeTrainerPools } from "#balance/biomes";
import type { ArenaTag } from "#data/arena-tag";
import { EntryHazardTag, getArenaTag } from "#data/arena-tag";
import { SpeciesFormChangeRevertWeatherFormTrigger, SpeciesFormChangeWeatherTrigger } from "#data/form-change-triggers";
import type { PokemonSpecies } from "#data/pokemon-species";
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
import type { AbstractConstructor } from "#types/type-helpers";
import { type Constructor, isNullOrUndefined, NumberHolder, randSeedInt } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";

export class Arena {
  public biomeType: BiomeId;
  public weather: Weather | null;
  public terrain: Terrain | null;
  /** All currently-active {@linkcode ArenaTag}s on both sides of the field. */
  public tags: ArenaTag[] = [];
  /**
   * All currently-active {@linkcode PositionalTag}s on both sides of the field,
   * sorted by tag type.
   */
  public positionalTagManager: PositionalTagManager = new PositionalTagManager();

  public bgm: string;
  public ignoreAbilities: boolean;
  public ignoringEffectSource: BattlerIndex | null;
  public playerTerasUsed = 0;
  /**
   * Saves the number of times a party pokemon faints during a arena encounter.
   * {@linkcode globalScene.currentBattle.enemyFaints} is the corresponding faint counter for the enemy (this resets every wave).
   */
  public playerFaints: number;

  private lastTimeOfDay: TimeOfDay;

  private pokemonPool: PokemonPools;
  private trainerPool: BiomeTierTrainerPools;

  public readonly eventTarget: EventTarget = new EventTarget();

  constructor(biome: BiomeId, playerFaints = 0) {
    this.biomeType = biome;
    this.bgm = BiomeId[biome].toLowerCase();
    this.trainerPool = biomeTrainerPools[biome];
    this.updatePoolsForTimeOfDay();
    this.playerFaints = playerFaints;
  }

  init() {
    const biomeKey = getBiomeKey(this.biomeType);

    globalScene.arenaPlayer.setBiome(this.biomeType);
    globalScene.arenaPlayerTransition.setBiome(this.biomeType);
    globalScene.arenaEnemy.setBiome(this.biomeType);
    globalScene.arenaNextEnemy.setBiome(this.biomeType);
    globalScene.arenaBg.setTexture(`${biomeKey}_bg`);
    globalScene.arenaBgTransition.setTexture(`${biomeKey}_bg`);

    // Redo this on initialize because during save/load the current wave isn't always
    // set correctly during construction
    this.updatePoolsForTimeOfDay();
  }

  updatePoolsForTimeOfDay(): void {
    const timeOfDay = this.getTimeOfDay();
    if (timeOfDay !== this.lastTimeOfDay) {
      this.pokemonPool = {};
      for (const tier of Object.keys(biomePokemonPools[this.biomeType])) {
        this.pokemonPool[tier] = Object.assign([], biomePokemonPools[this.biomeType][tier][TimeOfDay.ALL]).concat(
          biomePokemonPools[this.biomeType][tier][timeOfDay],
        );
      }
      this.lastTimeOfDay = timeOfDay;
    }
  }

  randomSpecies(
    waveIndex: number,
    level: number,
    attempt?: number,
    luckValue?: number,
    isBoss?: boolean,
  ): PokemonSpecies {
    const overrideSpecies = globalScene.gameMode.getOverrideSpecies(waveIndex);
    if (overrideSpecies) {
      return overrideSpecies;
    }
    const isBossSpecies =
      !!globalScene.getEncounterBossSegments(waveIndex, level)
      && this.pokemonPool[BiomePoolTier.BOSS].length > 0
      && (this.biomeType !== BiomeId.END
        || globalScene.gameMode.isClassic
        || globalScene.gameMode.isWaveFinal(waveIndex));
    const randVal = isBossSpecies ? 64 : 512;
    // luck influences encounter rarity
    let luckModifier = 0;
    if (typeof luckValue !== "undefined") {
      luckModifier = luckValue * (isBossSpecies ? 0.5 : 2);
    }
    const tierValue = randSeedInt(randVal - luckModifier);
    let tier = !isBossSpecies
      ? tierValue >= 156
        ? BiomePoolTier.COMMON
        : tierValue >= 32
          ? BiomePoolTier.UNCOMMON
          : tierValue >= 6
            ? BiomePoolTier.RARE
            : tierValue >= 1
              ? BiomePoolTier.SUPER_RARE
              : BiomePoolTier.ULTRA_RARE
      : tierValue >= 20
        ? BiomePoolTier.BOSS
        : tierValue >= 6
          ? BiomePoolTier.BOSS_RARE
          : tierValue >= 1
            ? BiomePoolTier.BOSS_SUPER_RARE
            : BiomePoolTier.BOSS_ULTRA_RARE;
    console.log(BiomePoolTier[tier]);
    while (this.pokemonPool[tier]?.length === 0) {
      console.log(`Downgraded rarity tier from ${BiomePoolTier[tier]} to ${BiomePoolTier[tier - 1]}`);
      tier--;
    }
    const tierPool = this.pokemonPool[tier];
    let ret: PokemonSpecies;
    let regen = false;
    if (tierPool.length === 0) {
      ret = globalScene.randomSpecies(waveIndex, level);
    } else {
      // TODO: should this use `randSeedItem`?
      const entry = tierPool[randSeedInt(tierPool.length)];
      let species: SpeciesId;
      if (typeof entry === "number") {
        species = entry as SpeciesId;
      } else {
        const levelThresholds = Object.keys(entry);
        for (let l = levelThresholds.length - 1; l >= 0; l--) {
          const levelThreshold = Number.parseInt(levelThresholds[l]);
          if (level >= levelThreshold) {
            const speciesIds = entry[levelThreshold];
            if (speciesIds.length > 1) {
              // TODO: should this use `randSeedItem`?
              species = speciesIds[randSeedInt(speciesIds.length)];
            } else {
              species = speciesIds[0];
            }
            break;
          }
        }
      }

      ret = getPokemonSpecies(species!);

      if (ret.subLegendary || ret.legendary || ret.mythical) {
        const waveDifficulty = globalScene.gameMode.getWaveForDifficulty(waveIndex);
        if (ret.baseTotal >= 660) {
          regen = waveDifficulty < 80; // Wave 50+ in daily (however, max Daily wave is 50 currently so not possible)
        } else {
          regen = waveDifficulty < 55; // Wave 25+ in daily
        }
      }
    }

    if (regen && (attempt || 0) < 10) {
      console.log("Incompatible level: regenerating...");
      return this.randomSpecies(waveIndex, level, (attempt || 0) + 1);
    }

    const newSpeciesId = ret.getWildSpeciesForLevel(level, true, isBoss ?? isBossSpecies, globalScene.gameMode);
    if (newSpeciesId !== ret.speciesId) {
      console.log("Replaced", SpeciesId[ret.speciesId], "with", SpeciesId[newSpeciesId]);
      ret = getPokemonSpecies(newSpeciesId);
    }
    return ret;
  }

  randomTrainerType(waveIndex: number, isBoss = false): TrainerType {
    const isTrainerBoss =
      this.trainerPool[BiomePoolTier.BOSS].length > 0
      && (globalScene.gameMode.isTrainerBoss(waveIndex, this.biomeType, globalScene.offsetGym) || isBoss);
    console.log(isBoss, this.trainerPool);
    const tierValue = randSeedInt(!isTrainerBoss ? 512 : 64);
    let tier = !isTrainerBoss
      ? tierValue >= 156
        ? BiomePoolTier.COMMON
        : tierValue >= 32
          ? BiomePoolTier.UNCOMMON
          : tierValue >= 6
            ? BiomePoolTier.RARE
            : tierValue >= 1
              ? BiomePoolTier.SUPER_RARE
              : BiomePoolTier.ULTRA_RARE
      : tierValue >= 20
        ? BiomePoolTier.BOSS
        : tierValue >= 6
          ? BiomePoolTier.BOSS_RARE
          : tierValue >= 1
            ? BiomePoolTier.BOSS_SUPER_RARE
            : BiomePoolTier.BOSS_ULTRA_RARE;
    console.log(BiomePoolTier[tier]);
    while (tier && this.trainerPool[tier].length === 0) {
      console.log(`Downgraded trainer rarity tier from ${BiomePoolTier[tier]} to ${BiomePoolTier[tier - 1]}`);
      tier--;
    }
    const tierPool = this.trainerPool[tier] || [];
    return tierPool.length === 0 ? TrainerType.BREEDER : tierPool[randSeedInt(tierPool.length)];
  }

  getSpeciesFormIndex(species: PokemonSpecies): number {
    switch (species.speciesId) {
      case SpeciesId.BURMY:
      case SpeciesId.WORMADAM:
        switch (this.biomeType) {
          case BiomeId.BEACH:
            return 1;
          case BiomeId.SLUM:
            return 2;
        }
        break;
      case SpeciesId.ROTOM:
        switch (this.biomeType) {
          case BiomeId.VOLCANO:
            return 1;
          case BiomeId.SEA:
            return 2;
          case BiomeId.ICE_CAVE:
            return 3;
          case BiomeId.MOUNTAIN:
            return 4;
          case BiomeId.TALL_GRASS:
            return 5;
        }
        break;
      case SpeciesId.LYCANROC: {
        const timeOfDay = this.getTimeOfDay();
        switch (timeOfDay) {
          case TimeOfDay.DAY:
          case TimeOfDay.DAWN:
            return 0;
          case TimeOfDay.DUSK:
            return 2;
          case TimeOfDay.NIGHT:
            return 1;
        }
        break;
      }
    }

    return 0;
  }

  getBgTerrainColorRatioForBiome(): number {
    switch (this.biomeType) {
      case BiomeId.SPACE:
        return 1;
      case BiomeId.END:
        return 0;
    }

    return 131 / 180;
  }

  /**
   * Sets weather to the override specified in overrides.ts
   * @param weather new {@linkcode WeatherType} to set
   * @returns true to force trySetWeather to return true
   */
  trySetWeatherOverride(weather: WeatherType): boolean {
    this.weather = new Weather(weather, 0);
    globalScene.phaseManager.unshiftNew("CommonAnimPhase", undefined, undefined, CommonAnim.SUNNY + (weather - 1));
    globalScene.phaseManager.queueMessage(getWeatherStartMessage(weather)!); // TODO: is this bang correct?
    return true;
  }

  /** Returns weather or not the weather can be changed to {@linkcode weather} */
  canSetWeather(weather: WeatherType): boolean {
    return !(this.weather?.weatherType === (weather || undefined));
  }

  /**
   * Attempts to set a new weather to the battle
   * @param weather {@linkcode WeatherType} new {@linkcode WeatherType} to set
   * @param user {@linkcode Pokemon} that caused the weather effect
   * @returns true if new weather set, false if no weather provided or attempting to set the same weather as currently in use
   */
  trySetWeather(weather: WeatherType, user?: Pokemon): boolean {
    if (Overrides.WEATHER_OVERRIDE) {
      return this.trySetWeatherOverride(Overrides.WEATHER_OVERRIDE);
    }

    if (!this.canSetWeather(weather)) {
      return false;
    }

    const oldWeatherType = this.weather?.weatherType || WeatherType.NONE;

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

    if (!isNullOrUndefined(user)) {
      weatherDuration.value = 5;
      globalScene.applyModifier(FieldEffectModifier, user.isPlayer(), user, weatherDuration);
    }

    this.weather = weather ? new Weather(weather, weatherDuration.value) : null;
    this.eventTarget.dispatchEvent(
      new WeatherChangedEvent(oldWeatherType, this.weather?.weatherType!, this.weather?.turnsLeft!),
    ); // TODO: is this bang correct?

    if (this.weather) {
      globalScene.phaseManager.unshiftNew("CommonAnimPhase", undefined, undefined, CommonAnim.SUNNY + (weather - 1));
      globalScene.phaseManager.queueMessage(getWeatherStartMessage(weather)!); // TODO: is this bang correct?
    } else {
      globalScene.phaseManager.queueMessage(getWeatherClearMessage(oldWeatherType)!); // TODO: is this bang correct?
    }

    globalScene
      .getField(true)
      .filter(p => p.isOnField())
      .map(pokemon => {
        pokemon.findAndRemoveTags(
          t => "weatherTypes" in t && !(t.weatherTypes as WeatherType[]).find(t => t === weather),
        );
        applyAbAttrs("PostWeatherChangeAbAttr", { pokemon, weather });
      });

    return true;
  }

  /**
   * Function to trigger all weather based form changes
   */
  triggerWeatherBasedFormChanges(): void {
    globalScene.getField(true).forEach(p => {
      const isCastformWithForecast = p.hasAbility(AbilityId.FORECAST) && p.species.speciesId === SpeciesId.CASTFORM;
      const isCherrimWithFlowerGift = p.hasAbility(AbilityId.FLOWER_GIFT) && p.species.speciesId === SpeciesId.CHERRIM;

      if (isCastformWithForecast || isCherrimWithFlowerGift) {
        globalScene.triggerPokemonFormChange(p, SpeciesFormChangeWeatherTrigger);
      }
    });
  }

  /**
   * Function to trigger all weather based form changes back into their normal forms
   */
  triggerWeatherBasedFormChangesToNormal(): void {
    globalScene.getField(true).forEach(p => {
      const isCastformWithForecast =
        p.hasAbility(AbilityId.FORECAST, false, true) && p.species.speciesId === SpeciesId.CASTFORM;
      const isCherrimWithFlowerGift =
        p.hasAbility(AbilityId.FLOWER_GIFT, false, true) && p.species.speciesId === SpeciesId.CHERRIM;

      if (isCastformWithForecast || isCherrimWithFlowerGift) {
        return globalScene.triggerPokemonFormChange(p, SpeciesFormChangeRevertWeatherFormTrigger);
      }
    });
  }

  /** Returns whether or not the terrain can be set to {@linkcode terrain} */
  canSetTerrain(terrain: TerrainType): boolean {
    return !(this.terrain?.terrainType === (terrain || undefined));
  }

  /**
   * Attempts to set a new terrain effect to the battle
   * @param terrain {@linkcode TerrainType} new {@linkcode TerrainType} to set
   * @param ignoreAnim boolean if the terrain animation should be ignored
   * @param user {@linkcode Pokemon} that caused the terrain effect
   * @returns true if new terrain set, false if no terrain provided or attempting to set the same terrain as currently in use
   */
  trySetTerrain(terrain: TerrainType, ignoreAnim = false, user?: Pokemon): boolean {
    if (!this.canSetTerrain(terrain)) {
      return false;
    }

    const oldTerrainType = this.terrain?.terrainType || TerrainType.NONE;

    const terrainDuration = new NumberHolder(0);

    if (!isNullOrUndefined(user)) {
      terrainDuration.value = 5;
      globalScene.applyModifier(FieldEffectModifier, user.isPlayer(), user, terrainDuration);
    }

    this.terrain = terrain ? new Terrain(terrain, terrainDuration.value) : null;

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

    globalScene
      .getField(true)
      .filter(p => p.isOnField())
      .map(pokemon => {
        pokemon.findAndRemoveTags(
          t => "terrainTypes" in t && !(t.terrainTypes as TerrainType[]).find(t => t === terrain),
        );
        applyAbAttrs("PostTerrainChangeAbAttr", { pokemon, terrain });
        applyAbAttrs("TerrainEventTypeChangeAbAttr", { pokemon });
      });

    return true;
  }

  public isMoveWeatherCancelled(user: Pokemon, move: Move): boolean {
    return !!this.weather && !this.weather.isEffectSuppressed() && this.weather.isMoveWeatherCancelled(user, move);
  }

  public isMoveTerrainCancelled(user: Pokemon, targets: BattlerIndex[], move: Move): boolean {
    return !!this.terrain && this.terrain.isMoveTerrainCancelled(user, targets, move);
  }

  public getWeatherType(): WeatherType {
    return this.weather?.weatherType ?? WeatherType.NONE;
  }

  public getTerrainType(): TerrainType {
    return this.terrain?.terrainType ?? TerrainType.NONE;
  }

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

  /**
   * Gets the denominator for the chance for a trainer spawn
   * @returns n where 1/n is the chance of a trainer battle
   */
  getTrainerChance(): number {
    switch (this.biomeType) {
      case BiomeId.METROPOLIS:
      case BiomeId.DOJO:
        return 4;
      case BiomeId.PLAINS:
      case BiomeId.GRASS:
      case BiomeId.BEACH:
      case BiomeId.LAKE:
      case BiomeId.CAVE:
      case BiomeId.DESERT:
      case BiomeId.CONSTRUCTION_SITE:
      case BiomeId.SLUM:
        return 6;
      case BiomeId.TALL_GRASS:
      case BiomeId.FOREST:
      case BiomeId.SWAMP:
      case BiomeId.MOUNTAIN:
      case BiomeId.BADLANDS:
      case BiomeId.MEADOW:
      case BiomeId.POWER_PLANT:
      case BiomeId.FACTORY:
      case BiomeId.SNOWY_FOREST:
        return 8;
      case BiomeId.SEA:
      case BiomeId.ICE_CAVE:
      case BiomeId.VOLCANO:
      case BiomeId.GRAVEYARD:
      case BiomeId.RUINS:
      case BiomeId.WASTELAND:
      case BiomeId.JUNGLE:
      case BiomeId.FAIRY_CAVE:
      case BiomeId.ISLAND:
        return 12;
      case BiomeId.ABYSS:
      case BiomeId.SPACE:
      case BiomeId.TEMPLE:
      case BiomeId.LABORATORY:
        return 16;
      default:
        return 0;
    }
  }

  getTimeOfDay(): TimeOfDay {
    switch (this.biomeType) {
      case BiomeId.ABYSS:
        return TimeOfDay.NIGHT;
    }

    const waveCycle = ((globalScene.currentBattle?.waveIndex || 0) + globalScene.waveCycleOffset) % 40;

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

  isOutside(): boolean {
    switch (this.biomeType) {
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

  overrideTint(): [number, number, number] {
    switch (Overrides.ARENA_TINT_OVERRIDE) {
      case TimeOfDay.DUSK:
        return [98, 48, 73].map(c => Math.round((c + 128) / 2)) as [number, number, number];
      case TimeOfDay.NIGHT:
        return [64, 64, 64];
      case TimeOfDay.DAWN:
      case TimeOfDay.DAY:
      default:
        return [128, 128, 128];
    }
  }

  getDayTint(): [number, number, number] {
    if (Overrides.ARENA_TINT_OVERRIDE !== null) {
      return this.overrideTint();
    }
    switch (this.biomeType) {
      case BiomeId.ABYSS:
        return [64, 64, 64];
      default:
        return [128, 128, 128];
    }
  }

  getDuskTint(): [number, number, number] {
    if (Overrides.ARENA_TINT_OVERRIDE) {
      return this.overrideTint();
    }
    if (!this.isOutside()) {
      return [0, 0, 0];
    }

    switch (this.biomeType) {
      default:
        return [98, 48, 73].map(c => Math.round((c + 128) / 2)) as [number, number, number];
    }
  }

  getNightTint(): [number, number, number] {
    if (Overrides.ARENA_TINT_OVERRIDE) {
      return this.overrideTint();
    }
    switch (this.biomeType) {
      case BiomeId.ABYSS:
      case BiomeId.SPACE:
      case BiomeId.END:
        return this.getDayTint();
    }

    if (!this.isOutside()) {
      return [64, 64, 64];
    }

    switch (this.biomeType) {
      default:
        return [48, 48, 98];
    }
  }

  setIgnoreAbilities(ignoreAbilities: boolean, ignoringEffectSource: BattlerIndex | null = null): void {
    this.ignoreAbilities = ignoreAbilities;
    this.ignoringEffectSource = ignoreAbilities ? ignoringEffectSource : null;
  }

  /**
   * Applies each `ArenaTag` in this Arena, based on which side (self, enemy, or both) is passed in as a parameter
   * @param tagType Either an {@linkcode ArenaTagType} string, or an actual {@linkcode ArenaTag} class to filter which ones to apply
   * @param side {@linkcode ArenaTagSide} which side's arena tags to apply
   * @param simulated if `true`, this applies arena tags without changing game state
   * @param args array of parameters that the called upon tags may need
   */
  applyTagsForSide(
    tagType: ArenaTagType | Constructor<ArenaTag> | AbstractConstructor<ArenaTag>,
    side: ArenaTagSide,
    simulated: boolean,
    ...args: unknown[]
  ): void {
    let tags =
      typeof tagType === "string"
        ? this.tags.filter(t => t.tagType === tagType)
        : this.tags.filter(t => t instanceof tagType);
    if (side !== ArenaTagSide.BOTH) {
      tags = tags.filter(t => t.side === side);
    }
    tags.forEach(t => t.apply(this, simulated, ...args));
  }

  /**
   * Applies the specified tag to both sides (ie: both user and trainer's tag that match the Tag specified)
   * by calling {@linkcode applyTagsForSide()}
   * @param tagType Either an {@linkcode ArenaTagType} string, or an actual {@linkcode ArenaTag} class to filter which ones to apply
   * @param simulated if `true`, this applies arena tags without changing game state
   * @param args array of parameters that the called upon tags may need
   */
  applyTags(
    tagType: ArenaTagType | Constructor<ArenaTag> | AbstractConstructor<ArenaTag>,
    simulated: boolean,
    ...args: unknown[]
  ): void {
    this.applyTagsForSide(tagType, ArenaTagSide.BOTH, simulated, ...args);
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
  // TODO: Do we need the return value here? literally nothing uses it
   */
  addTag(
    tagType: ArenaTagType,
    turnCount: number,
    sourceMove: MoveId | undefined,
    sourceId: number,
    side: ArenaTagSide = ArenaTagSide.BOTH,
    quiet = false,
  ): boolean {
    const existingTag = this.getTagOnSide(tagType, side);
    if (existingTag) {
      existingTag.onOverlap(this, globalScene.getPokemonById(sourceId));

      if (existingTag instanceof EntryHazardTag) {
        const { tagType, side, turnCount, layers, maxLayers } = existingTag as EntryHazardTag;
        this.eventTarget.dispatchEvent(new TagAddedEvent(tagType, side, turnCount, layers, maxLayers));
      }

      return false;
    }

    // creates a new tag object
    const newTag = getArenaTag(tagType, turnCount || 0, sourceMove, sourceId, side);
    if (newTag) {
      newTag.onAdd(this, quiet);
      this.tags.push(newTag);

      const { layers = 0, maxLayers = 0 } = newTag instanceof EntryHazardTag ? newTag : {};

      this.eventTarget.dispatchEvent(
        new TagAddedEvent(newTag.tagType, newTag.side, newTag.turnCount, layers, maxLayers),
      );
    }

    return true;
  }

  /**
   * Attempt to get a tag from the Arena via {@linkcode getTagOnSide} that applies to both sides
   * @param tagType - The {@linkcode ArenaTagType} to retrieve
   * @returns The existing {@linkcode ArenaTag}, or `undefined` if not present.
   * @overload
   */
  getTag(tagType: ArenaTagType): ArenaTag | undefined;
  /**
   * Attempt to get a tag from the Arena via {@linkcode getTagOnSide} that applies to both sides
   * @param tagType - The constructor of the {@linkcode ArenaTag} to retrieve
   * @returns The existing {@linkcode ArenaTag}, or `undefined` if not present.
   * @overload
   */
  getTag<T extends ArenaTag>(tagType: Constructor<T> | AbstractConstructor<T>): T | undefined;
  getTag(tagType: ArenaTagType | Constructor<ArenaTag> | AbstractConstructor<ArenaTag>): ArenaTag | undefined {
    return this.getTagOnSide(tagType, ArenaTagSide.BOTH);
  }

  hasTag(tagType: ArenaTagType): boolean {
    return !!this.getTag(tagType);
  }

  /**
   * Attempts to get a tag from the Arena from a specific side (the tag passed in has to either apply to both sides, or the specific side only)
   *
   * eg: `MIST` only applies to the user's side, while `MUD_SPORT` applies to both user and enemy side
   * @param tagType The {@linkcode ArenaTagType} or {@linkcode ArenaTag} to get
   * @param side The {@linkcode ArenaTagSide} to look at
   * @returns either the {@linkcode ArenaTag}, or `undefined` if it isn't there
   */
  getTagOnSide(
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
  findTags(tagPredicate: (t: ArenaTag) => boolean): ArenaTag[] {
    return this.findTagsOnSide(tagPredicate, ArenaTagSide.BOTH);
  }

  /**
   * Returns specific tags from the arena that pass the `tagPredicate` function passed in as a parameter, and apply to the given side
   * @param tagPredicate a function mapping {@linkcode ArenaTag}s to `boolean`s
   * @param side The {@linkcode ArenaTagSide} to look at
   * @returns array of {@linkcode ArenaTag}s from which the Arena's tags return `true` and apply to the given side
   */
  findTagsOnSide(tagPredicate: (t: ArenaTag) => boolean, side: ArenaTagSide): ArenaTag[] {
    return this.tags.filter(
      t => tagPredicate(t) && (side === ArenaTagSide.BOTH || t.side === ArenaTagSide.BOTH || t.side === side),
    );
  }

  lapseTags(): void {
    this.tags
      .filter(t => !t.lapse(this))
      .forEach(t => {
        t.onRemove(this);
        this.tags.splice(this.tags.indexOf(t), 1);

        this.eventTarget.dispatchEvent(new TagRemovedEvent(t.tagType, t.side, t.turnCount));
      });
  }

  removeTag(tagType: ArenaTagType): boolean {
    const tags = this.tags;
    const tag = tags.find(t => t.tagType === tagType);
    if (tag) {
      tag.onRemove(this);
      tags.splice(tags.indexOf(tag), 1);

      this.eventTarget.dispatchEvent(new TagRemovedEvent(tag.tagType, tag.side, tag.turnCount));
    }
    return !!tag;
  }

  removeTagOnSide(tagType: ArenaTagType, side: ArenaTagSide, quiet = false): boolean {
    const tag = this.getTagOnSide(tagType, side);
    if (tag) {
      tag.onRemove(this, quiet);
      this.tags.splice(this.tags.indexOf(tag), 1);

      this.eventTarget.dispatchEvent(new TagRemovedEvent(tag.tagType, tag.side, tag.turnCount));
    }
    return !!tag;
  }

  removeAllTags(): void {
    while (this.tags.length > 0) {
      this.tags[0].onRemove(this);
      this.eventTarget.dispatchEvent(
        new TagRemovedEvent(this.tags[0].tagType, this.tags[0].side, this.tags[0].turnCount),
      );

      this.tags.splice(0, 1);
    }
  }

  /**
   * Clears weather, terrain and arena tags when entering new biome or trainer battle.
   */
  resetArenaEffects(): void {
    // Don't reset weather if a Biome's permanent weather is active
    if (this.weather?.turnsLeft !== 0) {
      this.trySetWeather(WeatherType.NONE);
    }
    this.trySetTerrain(TerrainType.NONE, true);
    this.resetPlayerFaintCount();
    this.removeAllTags();
  }

  preloadBgm(): void {
    globalScene.loadBgm(this.bgm);
  }

  /** The loop point of any given biome track, read as seconds and milliseconds. */
  getBgmLoopPoint(): number {
    switch (this.biomeType) {
      case BiomeId.TOWN:
        return 7.288;
      case BiomeId.PLAINS:
        return 17.485;
      case BiomeId.GRASS:
        return 1.995;
      case BiomeId.TALL_GRASS:
        return 9.608;
      case BiomeId.METROPOLIS:
        return 141.47;
      case BiomeId.FOREST:
        return 0.341;
      case BiomeId.SEA:
        return 0.024;
      case BiomeId.SWAMP:
        return 4.461;
      case BiomeId.BEACH:
        return 3.462;
      case BiomeId.LAKE:
        return 7.215;
      case BiomeId.SEABED:
        return 2.6;
      case BiomeId.MOUNTAIN:
        return 4.018;
      case BiomeId.BADLANDS:
        return 17.79;
      case BiomeId.CAVE:
        return 14.24;
      case BiomeId.DESERT:
        return 9.02;
      case BiomeId.ICE_CAVE:
        return 0.0;
      case BiomeId.MEADOW:
        return 3.891;
      case BiomeId.POWER_PLANT:
        return 9.447;
      case BiomeId.VOLCANO:
        return 17.637;
      case BiomeId.GRAVEYARD:
        return 13.711;
      case BiomeId.DOJO:
        return 6.205;
      case BiomeId.FACTORY:
        return 4.985;
      case BiomeId.RUINS:
        return 0.0;
      case BiomeId.WASTELAND:
        return 6.024;
      case BiomeId.ABYSS:
        return 20.113;
      case BiomeId.SPACE:
        return 20.036;
      case BiomeId.CONSTRUCTION_SITE:
        return 1.222;
      case BiomeId.JUNGLE:
        return 0.0;
      case BiomeId.FAIRY_CAVE:
        return 0.0;
      case BiomeId.TEMPLE:
        return 2.547;
      case BiomeId.ISLAND:
        return 2.751;
      case BiomeId.LABORATORY:
        return 114.862;
      case BiomeId.SLUM:
        return 0.0;
      case BiomeId.SNOWY_FOREST:
        return 3.047;
      case BiomeId.END:
        return 17.153;
      default:
        console.warn(`missing bgm loop-point for biome "${BiomeId[this.biomeType]}" (=${this.biomeType})`);
        return 0;
    }
  }

  resetPlayerFaintCount(): void {
    this.playerFaints = 0;
  }
}

export function getBiomeKey(biome: BiomeId): string {
  return BiomeId[biome].toLowerCase();
}

export function getBiomeHasProps(biomeType: BiomeId): boolean {
  switch (biomeType) {
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

export class ArenaBase extends Phaser.GameObjects.Container {
  public player: boolean;
  public biome: BiomeId;
  public propValue: number;
  public base: Phaser.GameObjects.Sprite;
  public props: Phaser.GameObjects.Sprite[];

  constructor(player: boolean) {
    super(globalScene, 0, 0);

    this.player = player;

    this.base = globalScene.addFieldSprite(0, 0, "plains_a", undefined, 1);
    this.base.setOrigin(0, 0);

    this.props = [];
    if (!player) {
      for (let i = 0; i < 3; i++) {
        const ret = globalScene.addFieldSprite(0, 0, "plains_b", undefined, 1);
        ret.setOrigin(0, 0);
        ret.setVisible(false);
        this.props.push(ret);
      }
    }
  }

  setBiome(biome: BiomeId, propValue?: number): void {
    const hasProps = getBiomeHasProps(biome);
    const biomeKey = getBiomeKey(biome);
    const baseKey = `${biomeKey}_${this.player ? "a" : "b"}`;

    if (biome !== this.biome) {
      this.base.setTexture(baseKey);

      if (this.base.texture.frameTotal > 1) {
        const baseFrameNames = globalScene.anims.generateFrameNames(baseKey, {
          zeroPad: 4,
          suffix: ".png",
          start: 1,
          end: this.base.texture.frameTotal - 1,
        });
        if (!globalScene.anims.exists(baseKey)) {
          globalScene.anims.create({
            key: baseKey,
            frames: baseFrameNames,
            frameRate: 12,
            repeat: -1,
          });
        }
        this.base.play(baseKey);
      } else {
        this.base.stop();
      }

      this.add(this.base);
    }

    if (!this.player) {
      globalScene.executeWithSeedOffset(
        () => {
          this.propValue = propValue === undefined ? (hasProps ? randSeedInt(8) : 0) : propValue;
          this.props.forEach((prop, p) => {
            const propKey = `${biomeKey}_b${hasProps ? `_${p + 1}` : ""}`;
            prop.setTexture(propKey);

            if (hasProps && prop.texture.frameTotal > 1) {
              const propFrameNames = globalScene.anims.generateFrameNames(propKey, {
                zeroPad: 4,
                suffix: ".png",
                start: 1,
                end: prop.texture.frameTotal - 1,
              });
              if (!globalScene.anims.exists(propKey)) {
                globalScene.anims.create({
                  key: propKey,
                  frames: propFrameNames,
                  frameRate: 12,
                  repeat: -1,
                });
              }
              prop.play(propKey);
            } else {
              prop.stop();
            }

            prop.setVisible(hasProps && !!(this.propValue & (1 << p)));
            this.add(prop);
          });
        },
        globalScene.currentBattle?.waveIndex || 0,
        globalScene.waveSeed,
      );
    }
  }
}
