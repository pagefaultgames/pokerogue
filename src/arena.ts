import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import BattleScene from "./battle-scene";
import { Biome, BiomePoolTier, BiomeTierPools, biomePools } from "./data/biome";
import * as Utils from "./utils";
import PokemonSpecies, { getPokemonSpecies } from "./data/pokemon-species";
import { Species } from "./data/species";
import { Weather, WeatherType, getWeatherClearMessage, getWeatherStartMessage } from "./data/weather";
import { CommonAnimPhase, MessagePhase } from "./battle-phases";
import { CommonAnim } from "./data/battle-anims";
import { Type } from "./data/type";
import Move from "./data/move";
import { ArenaTag, ArenaTagType, getArenaTag } from "./data/arena-tag";

export class Arena {
  public scene: BattleScene;
  public biomeType: Biome;
  public weather: Weather;
  public tags: ArenaTag[];
  private bgm: string;

  private pokemonPool: BiomeTierPools;

  constructor(scene: BattleScene, biome: Biome, bgm: string) {
    this.scene = scene;
    this.biomeType = biome;
    this.tags = [];
    this.bgm = bgm;
    this.pokemonPool = biomePools[biome];
  }

  randomSpecies(waveIndex: integer, level: integer, attempt?: integer): PokemonSpecies {
    const isBoss = (waveIndex >= 100 || waveIndex % 10 === 0) && !!this.pokemonPool[BiomePoolTier.BOSS].length;
    const tierValue = Utils.randInt(!isBoss ? 512 : 64);
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
      const entry = tierPool[Utils.randInt(tierPool.length)];
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
              species = speciesIds[Utils.randInt(speciesIds.length)];
            else
              species = speciesIds[0];
            break;
          }
        }
      }
      
      ret = getPokemonSpecies(species);

      if (ret.legendary || ret.pseudoLegendary || ret.mythical) {
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

    const newSpeciesId = ret.getSpeciesForLevel(level, true);
    if (newSpeciesId !== ret.speciesId) {
      console.log('Replaced', Species[ret.speciesId], 'with', Species[newSpeciesId]);
      ret = getPokemonSpecies(newSpeciesId);
    }
    return ret;
  }

  getBiomeKey(): string {
    switch (this.biomeType) {
      case Biome.TOWN:
        return 'plains';
      case Biome.TALL_GRASS:
        return 'grass';
      case Biome.CITY:
        return 'dojo';
      case Biome.LAKE:
        return 'sea';
      case Biome.BEACH:
        return 'sea';
      case Biome.ABYSS:
        return 'wasteland';
      case Biome.MEADOW:
        return 'grass';
      case Biome.VOLCANO:
        return 'cave';
      case Biome.POWER_PLANT:
        return 'ruins';
    }
    return Biome[this.biomeType].toLowerCase();
  }

  getFormIndex(species: PokemonSpecies) {
    if (!species.canChangeForm && species.forms?.length)
      return Utils.randInt(species.forms.length); // TODO: Base on biome
    return 0;
  }

  getTypeForBiome() {
    switch (this.biomeType) {
      case Biome.TOWN:
      case Biome.PLAINS:
        return Type.NORMAL;
      case Biome.GRASS:
      case Biome.TALL_GRASS:
      case Biome.FOREST:
        return Type.GRASS;
      case Biome.CITY:
      case Biome.SWAMP:
        return Type.POISON;
      case Biome.SEA:
      case Biome.BEACH:
      case Biome.LAKE:
      case Biome.SEABED:
        return Type.WATER;
      case Biome.MOUNTAIN:
        return Type.FLYING;
      case Biome.LAND:
        return Type.GROUND;
      case Biome.CAVE:
      case Biome.DESERT:
        return Type.ROCK;
      case Biome.ICE_CAVE:
        return Type.ICE;
      case Biome.MEADOW:
        return Type.FAIRY;
      case Biome.POWER_PLANT:
        return Type.ELECTRIC;
      case Biome.VOLCANO:
        return Type.FIRE;
      case Biome.GRAVEYARD:
        return Type.GHOST;
      case Biome.DOJO:
        return Type.FIGHTING;
      case Biome.RUINS:
        return Type.PSYCHIC;
      case Biome.WASTELAND:
        return Type.DRAGON;
      case Biome.ABYSS:
        return Type.DARK;
      case Biome.SPACE:
        return Type.STEEL;
    }
  }

  trySetWeather(weather: WeatherType, viaMove: boolean): boolean {
    if (this.weather?.weatherType === (weather || undefined))
      return false;

    const oldWeatherType = this.weather?.weatherType || WeatherType.NONE;
    this.weather = weather ? new Weather(weather, viaMove ? 5 : 0) : null;

    if (this.weather) {
      this.scene.unshiftPhase(new CommonAnimPhase(this.scene, true, CommonAnim.SUNNY + (weather - 1)));
      this.scene.queueMessage(getWeatherStartMessage(weather));
    } else
      this.scene.queueMessage(getWeatherClearMessage(oldWeatherType));
    
    return true;
  }

  isMoveWeatherCancelled(move: Move) {
    return this.weather && this.weather.isMoveWeatherCancelled(move);
  }

  getAttackTypeMultiplier(attackType: Type): number {
    if (!this.weather)
      return 1;
    return this.weather.getAttackTypeMultiplier(attackType);
  }

  isDaytime(): boolean {
    switch (this.biomeType) {
      case Biome.TOWN:
      case Biome.PLAINS:
      case Biome.GRASS:
      case Biome.SEA:
      case Biome.BEACH:
      case Biome.LAKE:
      case Biome.MOUNTAIN:
      case Biome.LAND:
      case Biome.DESERT:
      case Biome.MEADOW:
      case Biome.DOJO:
        return true;
    }
  }

  applyTags(tagType: ArenaTagType | { new(...args: any[]): ArenaTag }, ...args: any[]): void {
    const tags = typeof tagType === 'number'
      ? this.tags.filter(t => t.tagType === tagType)
      : this.tags.filter(t => t instanceof tagType);
    tags.forEach(t => t.apply(args));
	}

  addTag(tagType: ArenaTagType, turnCount: integer): boolean {
    const existingTag = this.getTag(tagType);
    if (existingTag) {
      existingTag.onOverlap(this);
      return false;
    }

    const newTag = getArenaTag(tagType, turnCount || 0);
    this.tags.push(newTag);
    newTag.onAdd(this);

    return true;
  }

  getTag(tagType: ArenaTagType | { new(...args: any[]): ArenaTag }): ArenaTag {
    return typeof(tagType) === 'number'
      ? this.tags.find(t => t.tagType === tagType)
      : this.tags.find(t => t instanceof tagType);
  }

  lapseTags(): void {
    const tags = this.tags;
    tags.filter(t => !(t.lapse(this))).forEach(t => {
      t.onRemove(this);
      tags.splice(tags.indexOf(t), 1);
    });
  }

  preloadBgm(): void {
    this.scene.loadBgm(this.bgm);
  }

  playBgm(): void {
    this.scene.loadBgm(this.bgm);
    this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => this.scene.playBgm(this.bgm));
    if (!this.scene.load.isLoading())
      this.scene.load.start();
  }

  fadeOutBgm(duration: integer, destroy?: boolean): void {
    if (destroy === undefined)
      destroy = true;
    const bgm = this.scene.sound.get(this.bgm);
    SoundFade.fadeOut(this.scene, bgm, duration, destroy);
  }
}