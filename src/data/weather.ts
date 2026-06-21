import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { PokemonType } from "#enums/pokemon-type";
import { WeatherType } from "#enums/weather-type";
import type { Pokemon } from "#field/pokemon";
import type { Move } from "#moves/move";
import i18next from "i18next";

export interface SerializedWeather {
  weatherType: WeatherType;
  turnsLeft: number;
}

export class Weather {
  public weatherType: Exclude<WeatherType, WeatherType.NONE>;
  public turnsLeft: number;
  public maxDuration: number;

  constructor(weatherType: Exclude<WeatherType, WeatherType.NONE>, turnsLeft = 0, maxDuration: number = turnsLeft) {
    this.weatherType = weatherType;
    this.turnsLeft = this.isImmutable() ? 0 : turnsLeft;
    this.maxDuration = this.isImmutable() ? 0 : maxDuration;
  }

  /**
   * Tick down this weather's duration.
   * @returns Whether the current weather should remain active (`turnsLeft > 0`)
   */
  lapse(): boolean {
    if (this.isImmutable()) {
      return true;
    }
    // TODO: Add a flag for infinite duration weathers separate from "0 turn count"
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
}

// TODO: These functions should not be able to accept `WeatherType.NONE`
// and should have `null` removed from the signature
export function getWeatherStartMessage(weatherType: Exclude<WeatherType, WeatherType.NONE>): string {
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
}

export function getWeatherLapseMessage(weatherType: Exclude<WeatherType, WeatherType.NONE>): string {
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

export function getWeatherClearMessage(weatherType: Exclude<WeatherType, WeatherType.NONE>): string {
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

/**
 * Determine whether any effects that suppress weather are active;
 * does not check if there is actually any weather currently active.
 *
 * @remarks
 * Currently, the only source of weather suppression are the abilities Cloud Nine and Air Lock.
 *
 * @returns Whether there is any active effect suppressing weather.
 */
export function isWeatherSuppressed(): boolean {
  for (const pokemon of globalScene.getField(true)) {
    if (pokemon.hasAbilityWithAttr("SuppressWeatherEffectAbAttr")) {
      return true;
    }
  }
  return false;
}
