/** biome-ignore-start lint/correctness/noUnusedImports: TSDoc imports */
import type { GameManager } from "#test/test-utils/game-manager";
/** biome-ignore-end lint/correctness/noUnusedImports: TSDoc imports */

import { WeatherType } from "#enums/weather-type";
import { isGameManagerInstance, receivedStr } from "#test/test-utils/test-utils";
import { toTitleCase } from "#utils/strings";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher that checks if the {@linkcode WeatherType} is as expected
 * @param received - The object to check. Expects an instance of {@linkcode GameManager}.
 * @param expectedWeatherType - The expected {@linkcode WeatherType}
 * @returns Whether the matcher passed
 */
export function toHaveWeather(
  this: MatcherState,
  received: unknown,
  expectedWeatherType: WeatherType,
): SyncExpectationResult {
  if (!isGameManagerInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a GameManager, but got ${receivedStr(received)}!`,
    };
  }

  if (!received.scene?.arena) {
    return {
      pass: this.isNot,
      message: () => `Expected GameManager.${received.scene ? "scene.arena" : "scene"} to be defined!`,
    };
  }

  const actual = received.scene.arena.getWeatherType();
  const pass = actual === expectedWeatherType;
  const actualStr = toWeatherStr(actual);
  const expectedStr = toWeatherStr(expectedWeatherType);

  return {
    pass,
    message: () =>
      pass
        ? `Expected the Arena to NOT have ${expectedStr} weather active, but it did!`
        : `Expected the Arena to have ${expectedStr} weather active, but got ${actualStr} instead!`,
    expected: expectedWeatherType,
    actual,
  };
}

/**
 * Get a human readable representation of the current {@linkcode WeatherType}.
 * @param weatherType - The {@linkcode WeatherType} to transform
 * @returns A human readable string
 */
function toWeatherStr(weatherType: WeatherType) {
  if (weatherType === WeatherType.NONE) {
    return "no weather";
  }

  return toTitleCase(WeatherType[weatherType]);
}
