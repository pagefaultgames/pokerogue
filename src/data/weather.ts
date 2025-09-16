import type { SuppressWeatherEffectAbAttr } from "#abilities/ability";
import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { BiomeId } from "#enums/biome-id";
import { PokemonType } from "#enums/pokemon-type";
import { WeatherType } from "#enums/weather-type";
import type { Arena } from "#field/arena";
import type { Pokemon } from "#field/pokemon";
import type { Move } from "#moves/move";
import { randSeedInt } from "#utils/common";
import i18next from "i18next";

export interface SerializedWeather {
  weatherType: WeatherType;
  turnsLeft: number;
}

export class Weather {
  public weatherType: WeatherType;
  public turnsLeft: number;

  constructor(weatherType: WeatherType, turnsLeft?: number) {
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

  isTypeDamageImmune(type: PokemonType): boolean {
    switch (this.weatherType) {
      case WeatherType.SANDSTORM:
        return type === PokemonType.GROUND || type === PokemonType.ROCK || type === PokemonType.STEEL;
      case WeatherType.HAIL:
        return type === PokemonType.ICE;
    }

    return false;
  }

  getAttackTypeMultiplier(attackType: PokemonType): number {
    switch (this.weatherType) {
      case WeatherType.SUNNY:
      case WeatherType.HARSH_SUN:
        if (attackType === PokemonType.FIRE) {
          return 1.5;
        }
        if (attackType === PokemonType.WATER) {
          return 0.5;
        }
        break;
      case WeatherType.RAIN:
      case WeatherType.HEAVY_RAIN:
        if (attackType === PokemonType.FIRE) {
          return 0.5;
        }
        if (attackType === PokemonType.WATER) {
          return 1.5;
        }
        break;
    }

    return 1;
  }

  isMoveWeatherCancelled(user: Pokemon, move: Move): boolean {
    const moveType = user.getMoveType(move);

    switch (this.weatherType) {
      case WeatherType.HARSH_SUN:
        return move.is("AttackMove") && moveType === PokemonType.WATER;
      case WeatherType.HEAVY_RAIN:
        return move.is("AttackMove") && moveType === PokemonType.FIRE;
    }

    return false;
  }

  isEffectSuppressed(): boolean {
    const field = globalScene.getField(true);

    for (const pokemon of field) {
      let suppressWeatherEffectAbAttr: SuppressWeatherEffectAbAttr | null = pokemon
        .getAbility()
        .getAttrs("SuppressWeatherEffectAbAttr")[0];
      if (!suppressWeatherEffectAbAttr) {
        suppressWeatherEffectAbAttr = pokemon.hasPassive()
          ? pokemon.getPassiveAbility().getAttrs("SuppressWeatherEffectAbAttr")[0]
          : null;
      }
      if (suppressWeatherEffectAbAttr && (!this.isImmutable() || suppressWeatherEffectAbAttr.affectsImmutable)) {
        return true;
      }
    }

    return false;
  }
}

export function getWeatherStartMessage(weatherType: WeatherType): string | null {
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

export function getWeatherLapseMessage(weatherType: WeatherType): string | null {
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

export function getWeatherDamageMessage(weatherType: WeatherType, pokemon: Pokemon): string | null {
  switch (weatherType) {
    case WeatherType.SANDSTORM:
      return i18next.t("weather:sandstormDamageMessage", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      });
    case WeatherType.HAIL:
      return i18next.t("weather:hailDamageMessage", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      });
  }

  return null;
}

export function getWeatherClearMessage(weatherType: WeatherType): string | null {
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

export function getLegendaryWeatherContinuesMessage(weatherType: WeatherType): string | null {
  switch (weatherType) {
    case WeatherType.HARSH_SUN:
      return i18next.t("weather:harshSunContinueMessage");
    case WeatherType.HEAVY_RAIN:
      return i18next.t("weather:heavyRainContinueMessage");
    case WeatherType.STRONG_WINDS:
      return i18next.t("weather:strongWindsContinueMessage");
  }
  return null;
}

export function getWeatherBlockMessage(weatherType: WeatherType): string {
  switch (weatherType) {
    case WeatherType.HARSH_SUN:
      return i18next.t("weather:harshSunEffectMessage");
    case WeatherType.HEAVY_RAIN:
      return i18next.t("weather:heavyRainEffectMessage");
  }
  return i18next.t("weather:defaultEffectMessage");
}

export interface WeatherPoolEntry {
  weatherType: WeatherType;
  weight: number;
}

export function getRandomWeatherType(arena: Arena): WeatherType {
  let weatherPool: WeatherPoolEntry[] = [];
  const hasSun = arena.getTimeOfDay() < 2;
  switch (arena.biomeType) {
    case BiomeId.GRASS:
      weatherPool = [{ weatherType: WeatherType.NONE, weight: 7 }];
      if (hasSun) {
        weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 3 });
      }
      break;
    case BiomeId.TALL_GRASS:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 8 },
        { weatherType: WeatherType.RAIN, weight: 5 },
      ];
      if (hasSun) {
        weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 8 });
      }
      break;
    case BiomeId.FOREST:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 8 },
        { weatherType: WeatherType.RAIN, weight: 5 },
      ];
      break;
    case BiomeId.SEA:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 3 },
        { weatherType: WeatherType.RAIN, weight: 12 },
      ];
      break;
    case BiomeId.SWAMP:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 3 },
        { weatherType: WeatherType.RAIN, weight: 4 },
        { weatherType: WeatherType.FOG, weight: 1 },
      ];
      break;
    case BiomeId.BEACH:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 8 },
        { weatherType: WeatherType.RAIN, weight: 3 },
      ];
      if (hasSun) {
        weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 5 });
      }
      break;
    case BiomeId.LAKE:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 10 },
        { weatherType: WeatherType.RAIN, weight: 5 },
        { weatherType: WeatherType.FOG, weight: 1 },
      ];
      break;
    case BiomeId.SEABED:
      weatherPool = [{ weatherType: WeatherType.RAIN, weight: 1 }];
      break;
    case BiomeId.BADLANDS:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 8 },
        { weatherType: WeatherType.SANDSTORM, weight: 2 },
      ];
      if (hasSun) {
        weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 5 });
      }
      break;
    case BiomeId.DESERT:
      weatherPool = [{ weatherType: WeatherType.SANDSTORM, weight: 2 }];
      if (hasSun) {
        weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 2 });
      }
      break;
    case BiomeId.ICE_CAVE:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 3 },
        { weatherType: WeatherType.SNOW, weight: 4 },
        { weatherType: WeatherType.HAIL, weight: 1 },
      ];
      break;
    case BiomeId.MEADOW:
      weatherPool = [{ weatherType: WeatherType.NONE, weight: 2 }];
      if (hasSun) {
        weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 2 });
      }
      break;
    case BiomeId.VOLCANO:
      weatherPool = [
        {
          weatherType: hasSun ? WeatherType.SUNNY : WeatherType.NONE,
          weight: 1,
        },
      ];
      break;
    case BiomeId.GRAVEYARD:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 3 },
        { weatherType: WeatherType.FOG, weight: 1 },
      ];
      break;
    case BiomeId.JUNGLE:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 8 },
        { weatherType: WeatherType.RAIN, weight: 2 },
      ];
      break;
    case BiomeId.SNOWY_FOREST:
      weatherPool = [
        { weatherType: WeatherType.SNOW, weight: 7 },
        { weatherType: WeatherType.HAIL, weight: 1 },
      ];
      break;
    case BiomeId.ISLAND:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 5 },
        { weatherType: WeatherType.RAIN, weight: 1 },
      ];
      if (hasSun) {
        weatherPool.push({ weatherType: WeatherType.SUNNY, weight: 2 });
      }
      break;
  }

  if (arena.biomeType === BiomeId.TOWN && timedEventManager.isEventActive()) {
    timedEventManager.getWeather()?.map(w => weatherPool.push(w));
  }

  if (weatherPool.length > 1) {
    let totalWeight = 0;
    for (const w of weatherPool) {
      totalWeight += w.weight;
    }

    const rand = randSeedInt(totalWeight);
    let w = 0;
    for (const weather of weatherPool) {
      w += weather.weight;
      if (rand < w) {
        return weather.weatherType;
      }
    }
  }

  return weatherPool.length > 0 ? weatherPool[0].weatherType : WeatherType.NONE;
}
