import { WeatherType } from "#enums/weather-type";
import { isGameManagerInstance, receivedStr } from "#test/test-utils/test-utils";
import { toTitleCase } from "#utils/strings";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher to check if the {@linkcode WeatherType} is as expected
 * @param received - The object to check. Expects an instance of {@linkcode GameManager}.
 * @param expectedWeatherType - The expected {@linkcode WeatherType}
 * @returns Whether the matcher passed
 */
export function toHaveWeatherMatcher(
  this: MatcherState,
  received: unknown,
  expectedWeatherType: WeatherType,
): SyncExpectationResult {
  if (!isGameManagerInstance(received)) {
    return {
      pass: false,
      message: () => `Expected GameManager, but got ${receivedStr(received)}!`,
    };
  }

  if (!received.scene?.arena) {
    return {
      pass: false,
      message: () => `Expected GameManager.${received.scene ? "scene" : "scene.arena"} to be defined!`,
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
        ? `Expected Arena to NOT have ${expectedStr} weather active, but it did!`
        : `Expected Arena to have ${expectedStr} weather active, but got ${actualStr} instead!`,
    actual,
    expected: expectedWeatherType,
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
