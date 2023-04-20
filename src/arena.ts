import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import BattleScene from "./battle-scene";
import { Biome, BiomePoolTier, BiomeTierPools, biomePools } from "./biome";
import * as Utils from "./utils";
import PokemonSpecies, { getPokemonSpecies } from "./pokemon-species";
import { Species } from "./species";
import { Weather, WeatherType, getWeatherClearMessage, getWeatherStartMessage } from "./weather";
import { CommonAnimPhase, MessagePhase } from "./battle-phases";
import { CommonAnim } from "./battle-anims";
import { Type } from "./type";
import Move from "./move";

export class Arena {
  private scene: BattleScene;
  public biomeType: Biome;
  public weather: Weather;
  private bgm: string;

  private pokemonPool: BiomeTierPools;

  constructor(scene: BattleScene, biome: Biome, bgm: string) {
    this.scene = scene;
    this.biomeType = biome;
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

    const newSpeciesId = ret.getSpeciesForLevel(level);
    if (newSpeciesId !== ret.speciesId) {
      console.log('Replaced', Species[ret.speciesId], 'with', Species[newSpeciesId]);
      ret = getPokemonSpecies(newSpeciesId);
    }
    return ret;
  }

  getBiomeKey(): string {
    switch (this.biomeType) {
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

  trySetWeather(weather: WeatherType, viaMove: boolean): boolean {
    if (this.weather?.weatherType === (weather || undefined))
      return false;

    const oldWeatherType = this.weather?.weatherType || WeatherType.NONE;
    this.weather = weather ? new Weather(weather, viaMove ? 5 : 0) : null;

    if (this.weather) {
      this.scene.unshiftPhase(new CommonAnimPhase(this.scene, true, CommonAnim.SUNNY + (weather - 1)));
      this.scene.unshiftPhase(new MessagePhase(this.scene, getWeatherStartMessage(weather)));
    } else
      this.scene.unshiftPhase(new MessagePhase(this.scene, getWeatherClearMessage(oldWeatherType)));
    
    return true;
  }

  getAttackTypeMultiplier(attackType: Type): number {
    if (!this.weather)
      return 1;
    return this.weather.getAttackTypeMultiplier(attackType);
  }

  isMoveWeatherCancelled(move: Move) {
    return this.weather && this.weather.isMoveWeatherCancelled(move);
  }

  isDaytime(): boolean {
    switch (this.biomeType) {
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