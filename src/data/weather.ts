import { Biome } from "#enums/biome";
import { getPokemonMessage, getPokemonNameWithAffix } from "../messages";
import Pokemon from "../field/pokemon";
import { Type } from "./type";
import Move, { AttackMove } from "./move";
import * as Utils from "../utils";
import BattleScene from "../battle-scene";
import { SuppressWeatherEffectAbAttr } from "./ability";
import { TerrainType } from "./terrain";
import i18next from "i18next";

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
    if (this.isImmutable()) {
      return true;
    }
    if (this.turnsLeft) {
      return !!--this.turnsLeft;
    }

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
      if (attackType === Type.FIRE) {
        return 1.5;
      }
      if (attackType === Type.WATER) {
        return 0.5;
      }
      break;
    case WeatherType.RAIN:
    case WeatherType.HEAVY_RAIN:
      if (attackType === Type.FIRE) {
        return 0.5;
      }
      if (attackType === Type.WATER) {
        return 1.5;
      }
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

    for (const pokemon of field) {
      let suppressWeatherEffectAbAttr = pokemon.getAbility().getAttrs(SuppressWeatherEffectAbAttr)[0];
      if (!suppressWeatherEffectAbAttr) {
        suppressWeatherEffectAbAttr = pokemon.hasPassive() ? pokemon.getPassiveAbility().getAttrs(SuppressWeatherEffectAbAttr)[0] : null;
      }
      if (suppressWeatherEffectAbAttr && (!this.isImmutable() || suppressWeatherEffectAbAttr.affectsImmutable)) {
        return true;
      }
    }

    return false;
  }
}

export function getWeatherStartMessage(weatherType: WeatherType): string {
  switch (weatherType) {
  case WeatherType.SUNNY:
    return i18next.t("weather:sunnyStartMessage");
  case WeatherType.RAIN:
    return i18next.t("weather:rainStartMessage");
  case WeatherType.SANDSTORM:
    return i18next.t("weather:sandstormStartMessage");
  case WeatherType.HAIL:
    return i18next.t("weather:hailStartMessage");
  case WeatherType.SNOW:
    return i18next.t("weather:snowStartMessage");
  case WeatherType.FOG:
    return i18next.t("weather:fogStartMessage");
  case WeatherType.HEAVY_RAIN:
    return i18next.t("weather:heavyRainStartMessage");
  case WeatherType.HARSH_SUN:
    return i18next.t("weather:harshSunStartMessage");
  case WeatherType.STRONG_WINDS:
    return i18next.t("weather:strongWindsStartMessage");
  }

  return null;
}

export function getWeatherLapseMessage(weatherType: WeatherType): string {
  switch (weatherType) {
  case WeatherType.SUNNY:
    return i18next.t("weather:sunnyLapseMessage");
  case WeatherType.RAIN:
    return i18next.t("weather:rainLapseMessage");
  case WeatherType.SANDSTORM:
    return i18next.t("weather:sandstormLapseMessage");
  case WeatherType.HAIL:
    return i18next.t("weather:hailLapseMessage");
  case WeatherType.SNOW:
    return i18next.t("weather:snowLapseMessage");
  case WeatherType.FOG:
    return i18next.t("weather:fogLapseMessage");
  case WeatherType.HEAVY_RAIN:
    return i18next.t("weather:heavyRainLapseMessage");
  case WeatherType.HARSH_SUN:
    return i18next.t("weather:harshSunLapseMessage");
  case WeatherType.STRONG_WINDS:
    return i18next.t("weather:strongWindsLapseMessage");
  }

  return null;
}

export function getWeatherDamageMessage(weatherType: WeatherType, pokemon: Pokemon): string {
  switch (weatherType) {
  case WeatherType.SANDSTORM:
    return i18next.t("weather:sandstormDamageMessage", {pokemonNameWithAffix: getPokemonNameWithAffix(pokemon)});
  case WeatherType.HAIL:
    return i18next.t("weather:hailDamageMessage", {pokemonNameWithAffix: getPokemonNameWithAffix(pokemon)});
  }

  return null;
}

export function getWeatherClearMessage(weatherType: WeatherType): string {
  switch (weatherType) {
  case WeatherType.SUNNY:
    return i18next.t("weather:sunnyClearMessage");
  case WeatherType.RAIN:
    return i18next.t("weather:rainClearMessage");
  case WeatherType.SANDSTORM:
    return i18next.t("weather:sandstormClearMessage");
  case WeatherType.HAIL:
    return i18next.t("weather:hailClearMessage");
  case WeatherType.SNOW:
    return i18next.t("weather:snowClearMessage");
  case WeatherType.FOG:
    return i18next.t("weather:fogClearMessage");
  case WeatherType.HEAVY_RAIN:
    return i18next.t("weather:heavyRainClearMessage");
  case WeatherType.HARSH_SUN:
    return i18next.t("weather:harshSunClearMessage");
  case WeatherType.STRONG_WINDS:
    return i18next.t("weather:strongWindsClearMessage");
  }

  return null;
}

export function getTerrainStartMessage(terrainType: TerrainType): string {
  switch (terrainType) {
  case TerrainType.MISTY:
    return "Mist swirled around the battlefield!";
  case TerrainType.ELECTRIC:
    return "An electric current ran across the battlefield!";
  case TerrainType.GRASSY:
    return "Grass grew to cover the battlefield!";
  case TerrainType.PSYCHIC:
    return "The battlefield got weird!";
  }
}

export function getTerrainClearMessage(terrainType: TerrainType): string {
  switch (terrainType) {
  case TerrainType.MISTY:
    return "The mist disappeared from the battlefield.";
  case TerrainType.ELECTRIC:
    return "The electricity disappeared from the battlefield.";
  case TerrainType.GRASSY:
    return "The grass disappeared from the battlefield.";
  case TerrainType.PSYCHIC:
    return "The weirdness disappeared from the battlefield!";
  }
}

export function getTerrainBlockMessage(pokemon: Pokemon, terrainType: TerrainType): string {
  if (terrainType === TerrainType.MISTY) {
    return getPokemonMessage(pokemon, " surrounds itself with a protective mist!");
  }
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
    if (hasSun) {
      weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 3 });
    }
    break;
  case Biome.TALL_GRASS:
    weatherPool = [
      { weatherType: WeatherType.NONE, weight: 8 },
      { weatherType: WeatherType.RAIN, weight: 5 },
    ];
    if (hasSun) {
      weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 8 });
    }
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
    if (hasSun) {
      weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 5 });
    }
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
  case Biome.BADLANDS:
    weatherPool = [
      { weatherType: WeatherType.NONE, weight: 8 },
      { weatherType: WeatherType.SANDSTORM, weight: 2 }
    ];
    if (hasSun) {
      weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 5 });
    }
    break;
  case Biome.DESERT:
    weatherPool = [
      { weatherType: WeatherType.SANDSTORM, weight: 2 }
    ];
    if (hasSun) {
      weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 2 });
    }
    break;
  case Biome.ICE_CAVE:
    weatherPool = [
      { weatherType: WeatherType.NONE, weight: 3 },
      { weatherType: WeatherType.SNOW, weight: 4 },
      { weatherType: WeatherType.HAIL, weight: 1 }
    ];
    break;
  case Biome.MEADOW:
    weatherPool = [
      { weatherType: WeatherType.NONE, weight: 2 }
    ];
    if (hasSun) {
      weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 2 });
    }
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
  case Biome.JUNGLE:
    weatherPool = [
      { weatherType: WeatherType.NONE, weight: 8 },
      { weatherType: WeatherType.RAIN, weight: 2 }
    ];
    break;
  case Biome.SNOWY_FOREST:
    weatherPool = [
      { weatherType: WeatherType.SNOW, weight: 7 },
      { weatherType: WeatherType.HAIL, weight: 1 }
    ];
    break;
  case Biome.ISLAND:
    weatherPool = [
      { weatherType: WeatherType.NONE, weight: 5 },
      { weatherType: WeatherType.RAIN, weight: 1 },
    ];
    if (hasSun) {
      weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 2 });
    }
    break;
  }

  if (weatherPool.length > 1) {
    let totalWeight = 0;
    weatherPool.forEach(w => totalWeight += w.weight);

    const rand = Utils.randSeedInt(totalWeight);
    let w = 0;
    for (const weather of weatherPool) {
      w += weather.weight;
      if (rand < w) {
        return weather.weatherType;
      }
    }
  }

  return weatherPool.length
    ? weatherPool[0].weatherType
    : WeatherType.NONE;
}
