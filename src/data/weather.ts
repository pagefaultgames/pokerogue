import { Biome } from "./enums/biome";
import { getPokemonMessage } from "../messages";
import Pokemon from "../field/pokemon";
import { Type } from "./type";
import Move, { AttackMove } from "./move";
import * as Utils from "../utils";
import BattleScene from "../battle-scene";
import { SuppressWeatherEffectAbAttr } from "./ability";
import { TerrainType } from "./terrain";

export enum WeatherType {
  NONE,
  SUNNY,
  RAIN,
  SANDSTORM,
  HAIL,
  SNOW,
  FOG,
  HEAVY_RAIN,
  HARSH_SUN,
  STRONG_WINDS
}

export class Weather {
  public weatherType: WeatherType;
  public turnsLeft: integer;

  constructor(weatherType: WeatherType, turnsLeft?: integer) {
    this.weatherType = weatherType;
    this.turnsLeft = !this.isImmutable() ? turnsLeft || 0 : 0;
  }

  lapse(): boolean {
    if (this.isImmutable())
      return true;
    if (this.turnsLeft)
      return !!--this.turnsLeft;

    return true;
  }

  isImmutable(): boolean {
    switch (this.weatherType) {
      case WeatherType.HEAVY_RAIN:
      case WeatherType.HARSH_SUN:
      case WeatherType.STRONG_WINDS:
        return true;
    }

    return false;
  }

  isDamaging(): boolean {
    switch (this.weatherType) {
      case WeatherType.SANDSTORM:
      case WeatherType.HAIL:
        return true;
    }

    return false;
  }

  isTypeDamageImmune(type: Type): boolean {
    switch (this.weatherType) {
      case WeatherType.SANDSTORM:
        return type === Type.GROUND || type === Type.ROCK || type === Type.STEEL;
      case WeatherType.HAIL:
        return type === Type.ICE;
    }

    return false;
  }

  getAttackTypeMultiplier(attackType: Type): number {
    switch (this.weatherType) {
      case WeatherType.SUNNY:
      case WeatherType.HARSH_SUN:
        if (attackType === Type.FIRE)
          return 1.5;
        if (attackType === Type.WATER)
          return 0.5;
        break;
      case WeatherType.RAIN:
      case WeatherType.HEAVY_RAIN:
        if (attackType === Type.FIRE)
          return 0.5;
        if (attackType === Type.WATER)
          return 1.5;
        break;
    }

    return 1;
  }

  isMoveWeatherCancelled(move: Move): boolean {
    switch (this.weatherType) {
      case WeatherType.HARSH_SUN:
        return move instanceof AttackMove && move.type === Type.WATER;
      case WeatherType.HEAVY_RAIN:
        return move instanceof AttackMove && move.type === Type.FIRE;
    }

    return false;
  }

  isEffectSuppressed(scene: BattleScene): boolean {
    const field = scene.getField(true);

    for (let pokemon of field) {
      let suppressWeatherEffectAbAttr = pokemon.getAbility().getAttrs(SuppressWeatherEffectAbAttr).find(() => true) as SuppressWeatherEffectAbAttr;
      if (!suppressWeatherEffectAbAttr)
        suppressWeatherEffectAbAttr = pokemon.hasPassive() ? pokemon.getPassiveAbility().getAttrs(SuppressWeatherEffectAbAttr).find(() => true) as SuppressWeatherEffectAbAttr : null;
      if (suppressWeatherEffectAbAttr && (!this.isImmutable() || suppressWeatherEffectAbAttr.affectsImmutable))
        return true;
    }

    return false;
  }
}

export function getWeatherStartMessage(weatherType: WeatherType): string {
  switch (weatherType) {
    case WeatherType.SUNNY:
      return 'The sunlight got bright!';
    case WeatherType.RAIN:
      return 'A downpour started!';
    case WeatherType.SANDSTORM:
      return 'A sandstorm brewed!';
    case WeatherType.HAIL:
      return 'It started to hail!';
    case WeatherType.SNOW:
      return 'It started to snow!';
    case WeatherType.FOG:
      return 'A thick fog emerged!'
    case WeatherType.HEAVY_RAIN:
      return 'A heavy downpour started!'
    case WeatherType.HARSH_SUN:
      return 'The sunlight got hot!'
    case WeatherType.STRONG_WINDS:
      return 'A heavy wind began!';
  }

  return null;
}

export function getWeatherLapseMessage(weatherType: WeatherType): string {
  switch (weatherType) {
    case WeatherType.SUNNY:
      return 'The sunlight is strong.';
    case WeatherType.RAIN:
      return 'The downpour continues.';
    case WeatherType.SANDSTORM:
      return 'The sandstorm rages.';
    case WeatherType.HAIL:
      return 'Hail continues to fall.';
    case WeatherType.SNOW:
      return 'The snow is falling down.';
    case WeatherType.FOG:
      return 'The fog continues.';
    case WeatherType.HEAVY_RAIN:
      return 'The heavy downpour continues.'
    case WeatherType.HARSH_SUN:
      return 'The sun is scorching hot.'
    case WeatherType.STRONG_WINDS:
      return 'The wind blows intensely.';
  }

  return null;
}

export function getWeatherDamageMessage(weatherType: WeatherType, pokemon: Pokemon): string {
  switch (weatherType) {
    case WeatherType.SANDSTORM:
      return getPokemonMessage(pokemon, ' is buffeted\nby the sandstorm!');
    case WeatherType.HAIL:
      return getPokemonMessage(pokemon, ' is pelted\nby the hail!');
  }

  return null;
}

export function getWeatherClearMessage(weatherType: WeatherType): string {
  switch (weatherType) {
    case WeatherType.SUNNY:
      return 'The sunlight faded.';
    case WeatherType.RAIN:
      return 'The rain stopped.';
    case WeatherType.SANDSTORM:
      return 'The sandstorm subsided.';
    case WeatherType.HAIL:
      return 'The hail stopped.';
    case WeatherType.SNOW:
      return 'The snow stopped.';
    case WeatherType.FOG:
      return 'The fog disappeared.'
    case WeatherType.HEAVY_RAIN:
      return 'The heavy rain stopped.'
    case WeatherType.HARSH_SUN:
      return 'The harsh sunlight faded.'
    case WeatherType.STRONG_WINDS:
      return 'The heavy wind stopped.';
  }

  return null;
}

export function getTerrainStartMessage(terrainType: TerrainType): string {
  switch (terrainType) {
    case TerrainType.MISTY:
      return 'Mist swirled around the battlefield!';
    case TerrainType.ELECTRIC:
      return 'An electric current ran across the battlefield!';
    case TerrainType.GRASSY:
      return 'Grass grew to cover the battlefield!';
    case TerrainType.PSYCHIC:
      return 'The battlefield got weird!';
  }
}

export function getTerrainClearMessage(terrainType: TerrainType): string {
  switch (terrainType) {
    case TerrainType.MISTY:
      return 'The mist disappeared from the battlefield.';
    case TerrainType.ELECTRIC:
      return 'The electricity disappeared from the battlefield.';
    case TerrainType.GRASSY:
      return 'The grass disappeared from the battlefield.';
    case TerrainType.PSYCHIC:
      return 'The weirdness disappeared from the battlefield!';
  }
}

export function getTerrainBlockMessage(pokemon: Pokemon, terrainType: TerrainType): string {
  if (terrainType === TerrainType.MISTY)
    return getPokemonMessage(pokemon, ` surrounds itself with a protective mist!`);
  return getPokemonMessage(pokemon, ` is protected by the ${Utils.toReadableString(TerrainType[terrainType])} Terrain!`);
}

interface WeatherPoolEntry {
  weatherType: WeatherType;
  weight: integer;
}

export function getRandomWeatherType(arena: any /* Importing from arena causes a circular dependency */): WeatherType {
  let weatherPool: WeatherPoolEntry[] = [];
  const hasSun = arena.getTimeOfDay() < 2;
  switch (arena.biomeType) {
    case Biome.GRASS:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 7 }
      ];
      if (hasSun)
        weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 3 });
      break;
    case Biome.TALL_GRASS:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 8 },
        { weatherType: WeatherType.RAIN, weight: 5 },
      ];
      if (hasSun)
        weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 8 });
      break;
    case Biome.FOREST:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 8 },
        { weatherType: WeatherType.RAIN, weight: 5 }
      ];
      break;
    case Biome.SEA:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 3 },
        { weatherType: WeatherType.RAIN, weight: 12 }
      ];
      break;
    case Biome.SWAMP:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 3 },
        { weatherType: WeatherType.RAIN, weight: 4 },
        { weatherType: WeatherType.FOG, weight: 1 }
      ];
      break;
    case Biome.BEACH:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 8 },
        { weatherType: WeatherType.RAIN, weight: 3 }
      ];
      if (hasSun)
        weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 5 });
      break;
    case Biome.LAKE:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 10 },
        { weatherType: WeatherType.RAIN, weight: 5 },
        { weatherType: WeatherType.FOG, weight: 1 }
      ];
      break;
    case Biome.SEABED:
      weatherPool = [
        { weatherType: WeatherType.RAIN, weight: 1 }
      ];
      break;
    case Biome.MOUNTAIN:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 1 }
      ];
      break;
    case Biome.BADLANDS:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 8 },
        { weatherType: WeatherType.SANDSTORM, weight: 2 }
      ];
      if (hasSun)
        weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 5 });
      break;
    case Biome.DESERT:
      weatherPool = [
        { weatherType: WeatherType.SANDSTORM, weight: 2 }
      ];
      if (hasSun)
        weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 2 });
      break;
    case Biome.ICE_CAVE:
      weatherPool = [
        { weatherType: WeatherType.HAIL, weight: 1 }
      ];
      break;
    case Biome.MEADOW:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 2 }
      ];
      if (hasSun)
        weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 2 });
    case Biome.VOLCANO:
      weatherPool = [
        { weatherType: hasSun ? WeatherType.SUNNY : WeatherType.NONE, weight: 1 }
      ];
      break;
    case Biome.GRAVEYARD:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 3 },
        { weatherType: WeatherType.FOG, weight: 1 }
      ];
      break;
    case Biome.RUINS:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 4 }
      ];
      break;
    case Biome.WASTELAND:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 4 }
      ];
      break;
    case Biome.ABYSS:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 4 }
      ];
      break;
  }

  if (weatherPool.length > 1) {
    let totalWeight = 0;
    weatherPool.forEach(w => totalWeight += w.weight);

    const rand = Utils.randSeedInt(totalWeight);
    let w = 0;
    for (let weather of weatherPool) {
      w += weather.weight;
      if (rand < w)
        return weather.weatherType;
    }
  }

  return weatherPool.length
    ? weatherPool[0].weatherType
    : WeatherType.NONE;
}