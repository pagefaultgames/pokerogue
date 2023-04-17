import { Biome } from "./biome";
import * as Utils from "./utils";

export enum WeatherType {
  NONE,
  SUNNY,
  RAIN,
  SANDSTORM,
  HAIL,
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
    this.turnsLeft = turnsLeft || 0;
  }

  lapse(): boolean {
    if (this.turnsLeft)
      return !!--this.turnsLeft;

    return true;
  }
}

interface WeatherPoolEntry {
  weatherType: WeatherType;
  weight: integer;
}

export function getRandomWeather(biome: Biome): Weather {
  let weatherPool: WeatherPoolEntry[] = [];
  switch (biome) {
    case Biome.GRASS:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 7 },
        { weatherType: WeatherType.SUNNY, weight: 3 }
      ];
      break;
    case Biome.TALL_GRASS:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 2 },
        { weatherType: WeatherType.SUNNY, weight: 6 },
        { weatherType: WeatherType.RAIN, weight: 4 },
        { weatherType: WeatherType.FOG, weight: 2 },
        { weatherType: WeatherType.HAIL, weight: 1 }
      ];
      break;
    case Biome.FOREST:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 8 },
        { weatherType: WeatherType.RAIN, weight: 5 },
        { weatherType: WeatherType.HEAVY_RAIN, weight: 2 }
      ];
      break;
    case Biome.SEA:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 3 },
        { weatherType: WeatherType.RAIN, weight: 7 },
        { weatherType: WeatherType.HEAVY_RAIN, weight: 5 }
      ];
      break;
    case Biome.SWAMP:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 2 },
        { weatherType: WeatherType.RAIN, weight: 5 },
        { weatherType: WeatherType.FOG, weight: 8 }
      ];
      break;
    case Biome.BEACH:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 5 },
        { weatherType: WeatherType.SUNNY, weight: 8 },
        { weatherType: WeatherType.RAIN, weight: 2 }
      ];
      break;
    case Biome.LAKE:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 10 },
        { weatherType: WeatherType.RAIN, weight: 5 },
        { weatherType: WeatherType.FOG, weight: 3 },
        { weatherType: WeatherType.HEAVY_RAIN, weight: 2 }
      ];
      break;
    case Biome.SEABED:
      weatherPool = [
        { weatherType: WeatherType.HEAVY_RAIN, weight: 1 }
      ];
      break;
    case Biome.MOUNTAIN:
      weatherPool = [
        { weatherType: WeatherType.STRONG_WINDS, weight: 1 }
      ];
      break;
    case Biome.LAND:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 8 },
        { weatherType: WeatherType.SUNNY, weight: 3 },
        { weatherType: WeatherType.SANDSTORM, weight: 2 },
        { weatherType: WeatherType.HARSH_SUN, weight: 5 }
      ];
      break;
    case Biome.DESERT:
      weatherPool = [
        { weatherType: WeatherType.SANDSTORM, weight: 1 },
        { weatherType: WeatherType.HARSH_SUN, weight: 1 }
      ];
      break;
    case Biome.ICE_CAVE:
      weatherPool = [
        { weatherType: WeatherType.HAIL, weight: 1 }
      ];
      break;
    case Biome.MEADOW:
      weatherPool = [
        { weatherType: WeatherType.SUNNY, weight: 1 }
      ];
    case Biome.VOLCANO:
      weatherPool = [
        { weatherType: WeatherType.HARSH_SUN, weight: 1 }
      ];
      break;
    case Biome.GRAVEYARD:
      weatherPool = [
        { weatherType: WeatherType.FOG, weight: 1 }
      ];
      break;
    case Biome.RUINS:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 4 },
        { weatherType: WeatherType.FOG, weight: 1 }
      ];
      break;
    case Biome.WASTELAND:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 4 },
        { weatherType: WeatherType.FOG, weight: 1 }
      ];
      break;
    case Biome.ABYSS:
      weatherPool = [
        { weatherType: WeatherType.NONE, weight: 4 },
        { weatherType: WeatherType.FOG, weight: 1 }
      ];
      break;
  }

  if (weatherPool.length > 1) {
    let totalWeight = 0;
    weatherPool.forEach(w => totalWeight += w.weight);

    const rand = Utils.randInt(totalWeight);
    let w = 0;
    for (let weather of weatherPool) {
      w += weather.weight;
      if (rand < w)
        return new Weather(weather.weatherType);
    }
  }

  return weatherPool.length
    ? new Weather(weatherPool[0].weatherType)
    : null;
}