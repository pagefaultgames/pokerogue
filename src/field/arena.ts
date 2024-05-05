import BattleScene from "../battle-scene";
import { BiomePoolTier, PokemonPools, BiomeTierTrainerPools, biomePokemonPools, biomeTrainerPools } from "../data/biomes";
import { Biome } from "../data/enums/biome";
import * as Utils from "../utils";
import PokemonSpecies, { getPokemonSpecies } from "../data/pokemon-species";
import { Species } from "../data/enums/species";
import { Weather, WeatherType, getTerrainClearMessage, getTerrainStartMessage, getWeatherClearMessage, getWeatherStartMessage } from "../data/weather";
import { CommonAnimPhase, WeatherEffectPhase } from "../phases";
import { CommonAnim } from "../data/battle-anims";
import { Type } from "../data/type";
import Move from "../data/move";
import { ArenaTag, ArenaTagSide, getArenaTag } from "../data/arena-tag";
import { ArenaTagType } from "../data/enums/arena-tag-type";
import { TrainerType } from "../data/enums/trainer-type";
import { BattlerIndex } from "../battle";
import { Moves } from "../data/enums/moves";
import { TimeOfDay } from "../data/enums/time-of-day";
import { Terrain, TerrainType } from "../data/terrain";
import { PostTerrainChangeAbAttr, PostWeatherChangeAbAttr, applyPostTerrainChangeAbAttrs, applyPostWeatherChangeAbAttrs } from "../data/ability";
import Pokemon from "./pokemon";
import { WEATHER_OVERRIDE } from '../overrides';

export class Arena {
  public scene: BattleScene;
  public biomeType: Biome;
  public weather: Weather;
  public terrain: Terrain;
  public tags: ArenaTag[];
  public bgm: string;
  public ignoreAbilities: boolean;

  private lastTimeOfDay: TimeOfDay;

  private pokemonPool: PokemonPools;
  private trainerPool: BiomeTierTrainerPools;

  constructor(scene: BattleScene, biome: Biome, bgm: string) {
    this.scene = scene;
    this.biomeType = biome;
    this.tags = [];
    this.bgm = bgm;
    this.trainerPool = biomeTrainerPools[biome];
    this.updatePoolsForTimeOfDay();
  }

  init() {
    const biomeKey = getBiomeKey(this.biomeType);

    this.scene.arenaPlayer.setBiome(this.biomeType);
    this.scene.arenaPlayerTransition.setBiome(this.biomeType);
    this.scene.arenaEnemy.setBiome(this.biomeType);
    this.scene.arenaNextEnemy.setBiome(this.biomeType);
    this.scene.arenaBg.setTexture(`${biomeKey}_bg`);
    this.scene.arenaBgTransition.setTexture(`${biomeKey}_bg`);
  }

  updatePoolsForTimeOfDay(): void {
    const timeOfDay = this.getTimeOfDay();
    if (timeOfDay !== this.lastTimeOfDay) {
      this.pokemonPool = {};
      for (let tier of Object.keys(biomePokemonPools[this.biomeType]))
        this.pokemonPool[tier] = Object.assign([], biomePokemonPools[this.biomeType][tier][TimeOfDay.ALL]).concat(biomePokemonPools[this.biomeType][tier][timeOfDay]);
      this.lastTimeOfDay = timeOfDay;
    }
  }

  randomSpecies(waveIndex: integer, level: integer, attempt?: integer): PokemonSpecies {
    const overrideSpecies = this.scene.gameMode.getOverrideSpecies(waveIndex);
    if (overrideSpecies)
      return overrideSpecies;
    const isBoss = !!this.scene.getEncounterBossSegments(waveIndex, level) && !!this.pokemonPool[BiomePoolTier.BOSS].length
      && (this.biomeType !== Biome.END || this.scene.gameMode.isClassic || this.scene.gameMode.isWaveFinal(waveIndex));
    const tierValue = Utils.randSeedInt(!isBoss ? 512 : 64);
    let tier = !isBoss
      ? tierValue >= 156 ? BiomePoolTier.COMMON : tierValue >= 32 ? BiomePoolTier.UNCOMMON : tierValue >= 6 ? BiomePoolTier.RARE : tierValue >= 1 ? BiomePoolTier.SUPER_RARE : BiomePoolTier.ULTRA_RARE
      : tierValue >= 20 ? BiomePoolTier.BOSS : tierValue >= 6 ? BiomePoolTier.BOSS_RARE : tierValue >= 1 ? BiomePoolTier.BOSS_SUPER_RARE : BiomePoolTier.BOSS_ULTRA_RARE;
    console.log(BiomePoolTier[tier]);
    while (!this.pokemonPool[tier].length) {
      console.log(`Downgraded rarity tier from ${BiomePoolTier[tier]} to ${BiomePoolTier[tier - 1]}`);
      tier--;
    }
    const tierPool = this.pokemonPool[tier];
    let ret: PokemonSpecies;
    let regen = false;
    if (!tierPool.length)
      ret = this.scene.randomSpecies(waveIndex, level);
    else {
      const entry = tierPool[Utils.randSeedInt(tierPool.length)];
      let species: Species;
      if (typeof entry === 'number')
        species = entry as Species;
      else {
        const levelThresholds = Object.keys(entry);
        for (let l = levelThresholds.length - 1; l >= 0; l--) {
          const levelThreshold = parseInt(levelThresholds[l]);
          if (level >= levelThreshold) {
            const speciesIds = entry[levelThreshold];
            if (speciesIds.length > 1)
              species = speciesIds[Utils.randSeedInt(speciesIds.length)];
            else
              species = speciesIds[0];
            break;
          }
        }
      }
      
      ret = getPokemonSpecies(species);

      if (ret.pseudoLegendary || ret.legendary || ret.mythical) {
        switch (true) {
          case (ret.baseTotal >= 720):
            regen = level < 90;
            break;
          case (ret.baseTotal >= 670):
            regen = level < 70;
            break;
          case (ret.baseTotal >= 580):
            regen = level < 50;
            break;
          default:
            regen = level < 30;
            break;
        }
      }
    }

    if (regen && (attempt || 0) < 10) {
      console.log('Incompatible level: regenerating...');
      return this.randomSpecies(waveIndex, level, (attempt || 0) + 1);
    }

    const newSpeciesId = ret.getWildSpeciesForLevel(level, true, isBoss, this.scene.gameMode);
    if (newSpeciesId !== ret.speciesId) {
      console.log('Replaced', Species[ret.speciesId], 'with', Species[newSpeciesId]);
      ret = getPokemonSpecies(newSpeciesId);
    }
    return ret;
  }

  randomTrainerType(waveIndex: integer): TrainerType {
    const isBoss = !!this.trainerPool[BiomePoolTier.BOSS].length
      && this.scene.gameMode.isTrainerBoss(waveIndex, this.biomeType, this.scene.offsetGym);
    console.log(isBoss, this.trainerPool)
    const tierValue = Utils.randSeedInt(!isBoss ? 512 : 64);
    let tier = !isBoss
      ? tierValue >= 156 ? BiomePoolTier.COMMON : tierValue >= 32 ? BiomePoolTier.UNCOMMON : tierValue >= 6 ? BiomePoolTier.RARE : tierValue >= 1 ? BiomePoolTier.SUPER_RARE : BiomePoolTier.ULTRA_RARE
      : tierValue >= 20 ? BiomePoolTier.BOSS : tierValue >= 6 ? BiomePoolTier.BOSS_RARE : tierValue >= 1 ? BiomePoolTier.BOSS_SUPER_RARE : BiomePoolTier.BOSS_ULTRA_RARE;
    console.log(BiomePoolTier[tier]);
    while (tier && !this.trainerPool[tier].length) {
      console.log(`Downgraded trainer rarity tier from ${BiomePoolTier[tier]} to ${BiomePoolTier[tier - 1]}`);
      tier--;
    }
    const tierPool = this.trainerPool[tier] || [];
    return !tierPool.length ? TrainerType.BREEDER : tierPool[Utils.randSeedInt(tierPool.length)];
  }

  getSpeciesFormIndex(species: PokemonSpecies): integer {
    switch (species.speciesId) {
      case Species.BURMY:
      case Species.WORMADAM:
        switch (this.biomeType) {
          case Biome.BEACH:
            return 1;
          case Biome.SLUM:
            return 2;
        }
        break;
      case Species.ROTOM:
        switch (this.biomeType) {
          case Biome.VOLCANO:
            return 1;
          case Biome.SEA:
            return 2;
          case Biome.ICE_CAVE:
            return 3;
          case Biome.MOUNTAIN:
            return 4;
          case Biome.TALL_GRASS:
            return 5;
        }
        break;
      case Species.SCATTERBUG:
      case Species.SPEWPA:
      case Species.VIVILLON:
        return 0;
      case Species.LYCANROC:
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
      case Species.CALYREX:
        switch (this.biomeType) {
          case Biome.SNOWY_FOREST:
            return 1;
          case Biome.GRAVEYARD:
            return 2;
        }
        break;
    }

    return 0;
  }

  getTypeForBiome() {
    switch (this.biomeType) {
      case Biome.TOWN:
      case Biome.PLAINS:
      case Biome.METROPOLIS:
        return Type.NORMAL;
      case Biome.GRASS:
      case Biome.TALL_GRASS:
        return Type.GRASS;
      case Biome.FOREST:
        return Type.BUG;
      case Biome.SLUM:
      case Biome.SWAMP:
        return Type.POISON;
      case Biome.SEA:
      case Biome.BEACH:
      case Biome.LAKE:
      case Biome.SEABED:
        return Type.WATER;
      case Biome.MOUNTAIN:
        return Type.FLYING;
      case Biome.BADLANDS:
        return Type.GROUND;
      case Biome.CAVE:
      case Biome.DESERT:
        return Type.ROCK;
      case Biome.ICE_CAVE:
      case Biome.SNOWY_FOREST:
        return Type.ICE;
      case Biome.MEADOW:
      case Biome.FAIRY_CAVE:
      case Biome.ISLAND:
        return Type.FAIRY;
      case Biome.POWER_PLANT:
        return Type.ELECTRIC;
      case Biome.VOLCANO:
        return Type.FIRE;
      case Biome.GRAVEYARD:
      case Biome.TEMPLE:
        return Type.GHOST;
      case Biome.DOJO:
        return Type.FIGHTING;
      case Biome.FACTORY:
        return Type.STEEL;
      case Biome.RUINS:
      case Biome.SPACE:
        return Type.PSYCHIC;
      case Biome.WASTELAND:
      case Biome.END:
        return Type.DRAGON;
      case Biome.ABYSS:
        return Type.DARK;
    }
  }

  getBgTerrainColorRatioForBiome(): number {
    switch (this.biomeType) {
      case Biome.SPACE:
        return 1;
      case Biome.END:
        return 0;
    }

    return 131 / 180;
  }

  trySetWeatherOverride(weather: WeatherType): boolean {
    this.weather = new Weather(weather, 0);
    this.scene.unshiftPhase(new CommonAnimPhase(this.scene, undefined, undefined, CommonAnim.SUNNY + (weather - 1)));
    this.scene.queueMessage(getWeatherStartMessage(weather));
    return true
  }

  trySetWeather(weather: WeatherType, hasPokemonSource: boolean): boolean {
    // override hook for debugging
    if (WEATHER_OVERRIDE)
      return this.trySetWeatherOverride(WEATHER_OVERRIDE);
    
    if (this.weather?.weatherType === (weather || undefined))
      return false;

    const oldWeatherType = this.weather?.weatherType || WeatherType.NONE;

    this.weather = weather ? new Weather(weather, hasPokemonSource ? 5 : 0) : null;
    
    if (this.weather) {
      this.scene.tryReplacePhase(phase => phase instanceof WeatherEffectPhase && phase.weather.weatherType === oldWeatherType, new WeatherEffectPhase(this.scene, this.weather));
      this.scene.unshiftPhase(new CommonAnimPhase(this.scene, undefined, undefined, CommonAnim.SUNNY + (weather - 1)));
      this.scene.queueMessage(getWeatherStartMessage(weather));
    } else {
      this.scene.tryRemovePhase(phase => phase instanceof WeatherEffectPhase && phase.weather.weatherType === oldWeatherType);
      this.scene.queueMessage(getWeatherClearMessage(oldWeatherType));
    }

    this.scene.getField(true).filter(p => p.isOnField()).map(pokemon => {
      pokemon.findAndRemoveTags(t => 'weatherTypes' in t && !(t.weatherTypes as WeatherType[]).find(t => t === weather));
      applyPostWeatherChangeAbAttrs(PostWeatherChangeAbAttr, pokemon, weather);
    });
    
    return true;
  }

  trySetTerrain(terrain: TerrainType, hasPokemonSource: boolean, ignoreAnim: boolean = false): boolean {
    if (this.terrain?.terrainType === (terrain || undefined))
      return false;

    const oldTerrainType = this.terrain?.terrainType || TerrainType.NONE;

    this.terrain = terrain ? new Terrain(terrain, hasPokemonSource ? 5 : 0) : null;
    
    if (this.terrain) {
      if (!ignoreAnim)
        this.scene.unshiftPhase(new CommonAnimPhase(this.scene, undefined, undefined, CommonAnim.MISTY_TERRAIN + (terrain - 1)));
      this.scene.queueMessage(getTerrainStartMessage(terrain));
    } else
      this.scene.queueMessage(getTerrainClearMessage(oldTerrainType));

    this.scene.getField(true).filter(p => p.isOnField()).map(pokemon => {
      pokemon.findAndRemoveTags(t => 'terrainTypes' in t && !(t.terrainTypes as TerrainType[]).find(t => t === terrain));
      applyPostTerrainChangeAbAttrs(PostTerrainChangeAbAttr, pokemon, terrain);
    });
    
    return true;
  }

  isMoveWeatherCancelled(move: Move) {
    return this.weather && !this.weather.isEffectSuppressed(this.scene) && this.weather.isMoveWeatherCancelled(move);
  }

  isMoveTerrainCancelled(user: Pokemon, move: Move) {
    return this.terrain && this.terrain.isMoveTerrainCancelled(user, move);
  }

  getTerrainType() : TerrainType {
    return this.terrain?.terrainType || TerrainType.NONE;
  }

  getAttackTypeMultiplier(attackType: Type, grounded: boolean): number {
    let weatherMultiplier = 1;
    if (this.weather && !this.weather.isEffectSuppressed(this.scene))
      weatherMultiplier = this.weather.getAttackTypeMultiplier(attackType);

    let terrainMultiplier = 1;
    if (this.terrain && grounded)
      terrainMultiplier = this.terrain.getAttackTypeMultiplier(attackType);

    return weatherMultiplier * terrainMultiplier;
  }

  getTrainerChance(): integer {
    switch (this.biomeType) {
      case Biome.METROPOLIS:
        return 2;
      case Biome.SLUM:
      case Biome.BEACH:
      case Biome.DOJO:
      case Biome.CONSTRUCTION_SITE:
        return 4;
      case Biome.PLAINS:
      case Biome.GRASS:
      case Biome.LAKE:
      case Biome.CAVE:
        return 6;
      case Biome.TALL_GRASS:
      case Biome.FOREST:
      case Biome.SEA:
      case Biome.SWAMP:
      case Biome.MOUNTAIN:
      case Biome.BADLANDS:
      case Biome.DESERT:
      case Biome.MEADOW:
      case Biome.POWER_PLANT:
      case Biome.GRAVEYARD:
      case Biome.FACTORY:
      case Biome.SNOWY_FOREST:
        return 8;
      case Biome.ICE_CAVE:
      case Biome.VOLCANO:
      case Biome.RUINS:
      case Biome.WASTELAND:
      case Biome.JUNGLE:
      case Biome.FAIRY_CAVE:
        return 12;
      case Biome.SEABED:
      case Biome.ABYSS:
      case Biome.SPACE:
      case Biome.TEMPLE:
        return 16;
      default:
        return 0;
    }
  }

  getTimeOfDay(): TimeOfDay {
    switch (this.biomeType) {
      case Biome.ABYSS:
        return TimeOfDay.NIGHT;
    }

    const waveCycle = ((this.scene.currentBattle?.waveIndex || 0) + this.scene.waveCycleOffset) % 40;

    if (waveCycle < 15)
      return TimeOfDay.DAY;

    if (waveCycle < 20)
      return TimeOfDay.DUSK;

    if (waveCycle < 35)
      return TimeOfDay.NIGHT;

    return TimeOfDay.DAWN;
  }

  isOutside(): boolean {
    switch (this.biomeType) {
      case Biome.SEABED:
      case Biome.CAVE:
      case Biome.ICE_CAVE:
      case Biome.POWER_PLANT:
      case Biome.DOJO:
      case Biome.FACTORY:
      case Biome.ABYSS:
      case Biome.FAIRY_CAVE:
      case Biome.TEMPLE:
      case Biome.LABORATORY:
        return false;
      default:
        return true;
    }
  }

  getDayTint(): [integer, integer, integer] {
    switch (this.biomeType) {
      case Biome.ABYSS:
        return [ 64, 64, 64 ];
      default:
        return [ 128, 128, 128 ];
    }
  }

  getDuskTint(): [integer, integer, integer] {
    if (!this.isOutside())
      return [ 0, 0, 0 ];

    switch (this.biomeType) {
      default:
        return [ 98, 48, 73 ].map(c => Math.round((c + 128) / 2)) as [integer, integer, integer];
    }
  }

  getNightTint(): [integer, integer, integer] {
    switch (this.biomeType) {
      case Biome.ABYSS:
      case Biome.SPACE:
      case Biome.END:
        return this.getDayTint();
    }

    if (!this.isOutside())
      return [ 64, 64, 64 ];

    switch (this.biomeType) {
      default:
        return [ 48, 48, 98 ];
    }
  }

  setIgnoreAbilities(ignoreAbilities: boolean = true): void {
    this.ignoreAbilities = ignoreAbilities;
  }

  applyTagsForSide(tagType: ArenaTagType | { new(...args: any[]): ArenaTag }, side: ArenaTagSide, ...args: any[]): void {
    let tags = typeof tagType === 'string'
      ? this.tags.filter(t => t.tagType === tagType)
      : this.tags.filter(t => t instanceof tagType);
    if (side !== ArenaTagSide.BOTH)
      tags = tags.filter(t => t.side === side);
    tags.forEach(t => t.apply(this, args));
	}
  
  applyTags(tagType: ArenaTagType | { new(...args: any[]): ArenaTag }, ...args: any[]): void {
    this.applyTagsForSide(tagType, ArenaTagSide.BOTH, ...args);
	}

  addTag(tagType: ArenaTagType, turnCount: integer, sourceMove: Moves, sourceId: integer, side: ArenaTagSide = ArenaTagSide.BOTH, targetIndex?: BattlerIndex): boolean {
    const existingTag = this.getTag(tagType);
    if (existingTag) {
      existingTag.onOverlap(this);
      return false;
    }

    const newTag = getArenaTag(tagType, turnCount || 0, sourceMove, sourceId, targetIndex, side);
    this.tags.push(newTag);
    newTag.onAdd(this);

    return true;
  }

  getTag(tagType: ArenaTagType | { new(...args: any[]): ArenaTag }): ArenaTag {
    return this.getTagOnSide(tagType, ArenaTagSide.BOTH);
  }

  getTagOnSide(tagType: ArenaTagType | { new(...args: any[]): ArenaTag }, side: ArenaTagSide): ArenaTag {
    return typeof(tagType) === 'string'
      ? this.tags.find(t => t.tagType === tagType && (side === ArenaTagSide.BOTH || t.side === ArenaTagSide.BOTH || t.side === side))
      : this.tags.find(t => t instanceof tagType && (side === ArenaTagSide.BOTH || t.side === ArenaTagSide.BOTH || t.side === side));
  }

  findTags(tagPredicate: (t: ArenaTag) => boolean): ArenaTag[] {
    return this.findTagsOnSide(tagPredicate, ArenaTagSide.BOTH);
  }

  findTagsOnSide(tagPredicate: (t: ArenaTag) => boolean, side: ArenaTagSide): ArenaTag[] {
    return this.tags.filter(t => tagPredicate(t) && (side === ArenaTagSide.BOTH || t.side === ArenaTagSide.BOTH || t.side === side));
  }

  lapseTags(): void {
    this.tags.filter(t => !(t.lapse(this))).forEach(t => {
      t.onRemove(this);
      this.tags.splice(this.tags.indexOf(t), 1);
    });
  }

  removeTag(tagType: ArenaTagType): boolean {
    const tags = this.tags;
    const tag = tags.find(t => t.tagType === tagType);
    if (tag) {
      tag.onRemove(this);
      tags.splice(tags.indexOf(tag), 1);
    }
    return !!tag;
  }

  removeTagOnSide(tagType: ArenaTagType, side: ArenaTagSide): boolean {
    const tag = this.getTagOnSide(tagType, side);
    if (tag) {
      tag.onRemove(this);
      this.tags.splice(this.tags.indexOf(tag), 1);
    }
    return !!tag;
  }
  
  
  removeAllTags(): void {
    while (this.tags.length) {
      this.tags[0].onRemove(this);
      this.tags.splice(0, 1);
    }
  }

  preloadBgm(): void {
    this.scene.loadBgm(this.bgm);
  }

  getBgmLoopPoint(): number {
    switch (this.biomeType) {
      case Biome.TOWN:
        return 7.288;
      case Biome.PLAINS:
        return 7.693;
      case Biome.GRASS:
        return 1.995;
      case Biome.TALL_GRASS:
        return 9.608;
      case Biome.METROPOLIS:
        return 4.867;
      case Biome.FOREST:
        return 4.294;
      case Biome.SEA:
        return 1.672;
      case Biome.SWAMP:
        return 4.461;
      case Biome.BEACH:
        return 3.462;
      case Biome.LAKE:
        return 5.350;
      case Biome.SEABED:
        return 2.629;
      case Biome.MOUNTAIN:
        return 4.018;
      case Biome.BADLANDS:
        return 17.790;
      case Biome.CAVE:
        return 14.240;
      case Biome.DESERT:
        return 1.143;
      case Biome.ICE_CAVE:
        return 15.010;
      case Biome.MEADOW:
        return 3.891;
      case Biome.POWER_PLANT:
        return 2.810;
      case Biome.VOLCANO:
        return 5.116;
      case Biome.GRAVEYARD:
        return 3.232;
      case Biome.DOJO:
        return 6.205;
      case Biome.FACTORY:
        return 4.985;
      case Biome.RUINS:
        return 2.270;
      case Biome.WASTELAND:
        return 6.336;
      case Biome.ABYSS:
        return 5.130;
      case Biome.SPACE:
        return 21.347;
      case Biome.CONSTRUCTION_SITE:
        return 1.222;
      case Biome.JUNGLE:
        return 2.477;
      case Biome.FAIRY_CAVE:
        return 4.542;
      case Biome.TEMPLE:
        return 2.547;
      case Biome.ISLAND:
        return 2.751;
      case Biome.LABORATORY:
        return 0.797;
      case Biome.SLUM:
        return 1.221;
      case Biome.SNOWY_FOREST:
        return 3.047;
    }
  }
}

export function getBiomeKey(biome: Biome): string {
  switch (biome) {
    case Biome.METROPOLIS:
      return 'slum';
    case Biome.JUNGLE:
      return 'tall_grass';
    case Biome.ISLAND:
      return 'beach';
  }
  return Biome[biome].toLowerCase();
}

export function getBiomeHasProps(biomeType: Biome): boolean {
  switch (biomeType) {
    case Biome.BEACH:
    case Biome.LAKE:
    case Biome.SEABED:
    case Biome.MOUNTAIN:
    case Biome.BADLANDS:
    case Biome.CAVE:
    case Biome.DESERT:
    case Biome.ICE_CAVE:
    case Biome.MEADOW:
    case Biome.POWER_PLANT:
    case Biome.VOLCANO:
    case Biome.GRAVEYARD:
    case Biome.FACTORY:
    case Biome.RUINS:
    case Biome.WASTELAND:
    case Biome.ABYSS:
    case Biome.CONSTRUCTION_SITE:
    case Biome.FAIRY_CAVE:
    case Biome.TEMPLE:
    case Biome.LABORATORY:
    case Biome.END:
      return true;
  }

  return false;
}

export class ArenaBase extends Phaser.GameObjects.Container {
  public player: boolean;
  public biome: Biome;
  public propValue: integer;
  public base: Phaser.GameObjects.Sprite;
  public props: Phaser.GameObjects.Sprite[];

  constructor(scene: BattleScene, player: boolean) {
    super(scene, 0, 0);

    this.player = player;

    this.base = scene.addFieldSprite(0, 0, 'plains_a', null, 1);
    this.base.setOrigin(0, 0);

    this.props = !player ?
      new Array(3).fill(null).map(() => {
        const ret = scene.addFieldSprite(0, 0, 'plains_b', null, 1);
        ret.setOrigin(0, 0);
        ret.setVisible(false);
        return ret;
      }) : [];
  }

  setBiome(biome: Biome, propValue?: integer): void {
    const hasProps = getBiomeHasProps(biome);
    const biomeKey = getBiomeKey(biome);
    const baseKey = `${biomeKey}_${this.player ? 'a' : 'b'}`;
    
    if (biome !== this.biome) {
      this.base.setTexture(baseKey);

      if (this.base.texture.frameTotal > 1) {
        const baseFrameNames = this.scene.anims.generateFrameNames(baseKey, { zeroPad: 4, suffix: ".png", start: 1, end: this.base.texture.frameTotal - 1 });
        this.scene.anims.create({
          key: baseKey,
          frames: baseFrameNames,
          frameRate: 12,
          repeat: -1
        });
        this.base.play(baseKey);
      } else
        this.base.stop();

      this.add(this.base);
    }

    if (!this.player) {
      (this.scene as BattleScene).executeWithSeedOffset(() => {
        this.propValue = propValue === undefined
          ? hasProps ? Utils.randSeedInt(8) : 0
          : propValue;
        this.props.forEach((prop, p) => {
          const propKey = `${biomeKey}_b${hasProps ? `_${p + 1}` : ''}`;
          prop.setTexture(propKey);

          if (hasProps && prop.texture.frameTotal > 1) {
            const propFrameNames = this.scene.anims.generateFrameNames(propKey, { zeroPad: 4, suffix: ".png", start: 1, end: prop.texture.frameTotal - 1 });
            this.scene.anims.create({
              key: propKey,
              frames: propFrameNames,
              frameRate: 12,
              repeat: -1
            });
            prop.play(propKey);
          } else
            prop.stop();

          prop.setVisible(hasProps && !!(this.propValue & (1 << p)));
          this.add(prop);
        });
      }, (this.scene as BattleScene).currentBattle?.waveIndex || 0, (this.scene as BattleScene).waveSeed);
    }
  }
}