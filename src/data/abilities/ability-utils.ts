import { AbilityId } from "#enums/ability-id";
import { WeatherType } from "#enums/weather-type";
import type { Pokemon } from "#field/pokemon";

/**
 *  Checks if condition is checking for sunny weather and mega sol is present
 *
 * @param pokemon - The Pokemon whose abilities should be checked.
 * @param weatherTypes - Weather types to check for
 * @returns Whether Mega Sol is present and condition expects sunny weather
 */
export function isMegaSolSunny(pokemon: Pokemon, weatherTypes: readonly WeatherType[]): boolean {
  const abilities = [pokemon.getAbility().id];
  if (pokemon.hasPassive()) {
    abilities.push(pokemon.getPassiveAbility().id);
  }
  return (
    (weatherTypes.includes(WeatherType.SUNNY) || weatherTypes.includes(WeatherType.HARSH_SUN))
    && abilities.includes(AbilityId.MEGA_SOL)
  );
}
