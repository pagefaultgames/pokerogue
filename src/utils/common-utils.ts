import { pokerogueApi } from "#api/pokerogue-api";
import { BYPASS_LOGIN, IS_DEV } from "#constants/app-constants";
import { MoneyFormat } from "#enums/money-format";
import { formatLargeNumber, getAbbreviationsLargeNumber } from "#utils/i18n-utils";

export function padInt(value: number, length: number, padWith?: string): string {
  if (!padWith) {
    padWith = "0";
  }
  let valueStr = value.toString();
  while (valueStr.length < length) {
    valueStr = `${padWith}${valueStr}`;
  }
  return valueStr;
}

export function getFrameMs(frameCount: number): number {
  return Math.floor((1 / 60) * 1000 * frameCount);
}

export function getCurrentTime(): number {
  const date = new Date();
  return ((date.getHours() * 60 + date.getMinutes()) / 1440 + 0.675) % 1;
}

const secondsInHour = 3600;

export function getPlayTimeString(totalSeconds: number): string {
  const days = `${Math.floor(totalSeconds / (secondsInHour * 24))}`;
  const hours = `${Math.floor((totalSeconds % (secondsInHour * 24)) / secondsInHour)}`;
  const minutes = `${Math.floor((totalSeconds % secondsInHour) / 60)}`;
  const seconds = `${Math.floor(totalSeconds % 60)}`;

  return `${days.padStart(2, "0")}:${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
}

export function formatFancyLargeNumber(number: number, rounded = 3): string {
  const abbreviations = getAbbreviationsLargeNumber();
  let exponent: number;

  if (number < 1000) {
    exponent = 0;
  } else {
    const maxExp = abbreviations.length - 1;

    exponent = Math.floor(Math.log(number) / Math.log(1000));
    exponent = Math.min(exponent, maxExp);

    number /= Math.pow(1000, exponent);
  }

  return `${exponent === 0 || number % 1 === 0 ? number : number.toFixed(rounded)}${abbreviations[exponent]}`;
}

export function formatMoney(format: MoneyFormat, amount: number) {
  if (format === MoneyFormat.ABBREVIATED) {
    return formatFancyLargeNumber(amount);
  }
  return amount.toLocaleString();
}

export function formatStat(stat: number, forHp = false): string {
  return formatLargeNumber(stat, forHp ? 100_000 : 1_000_000);
}

export function executeIf<T>(condition: boolean, promiseFunc: () => Promise<T>): Promise<T | null> {
  return condition ? promiseFunc() : new Promise<T | null>(resolve => resolve(null));
}

/** Used to disable api calls when `isDev` is true and a server is not found */
export let isLocalServerConnected = !BYPASS_LOGIN;

/**
 * When locally running the game, "pings" the local server
 * with a GET request to verify if a server is running,
 * sets isLocalServerConnected based on results
 */
export async function localPing(): Promise<void> {
  if (IS_DEV) {
    const titleStats = await pokerogueApi.getGameTitleStats();
    isLocalServerConnected = !!titleStats;
    console.log("isLocalServerConnected:", isLocalServerConnected);
  }
}

/** @deprecated Use {@linkcode ValueHolder} */
export class BooleanHolder {
  public value: boolean;

  constructor(value: boolean) {
    this.value = value;
  }
}

/** @deprecated Use {@linkcode ValueHolder} */
export class NumberHolder {
  public value: number;

  constructor(value: number) {
    this.value = value;
  }

  valueOf(): number {
    return this.value;
  }
}

/** Used to pass values by reference (such as for `applyAbAttrs`/etc). */
export class ValueHolder<T> {
  public value: T;

  constructor(value: T) {
    this.value = value;
  }
}

export class FixedInt {
  public readonly value: number;

  constructor(value: number) {
    this.value = value;
  }

  [Symbol.toPrimitive](_hint: string): number {
    return this.value;
  }
}

export function fixedInt(value: number): number {
  return new FixedInt(value) as unknown as number;
}

/**
 * Prints the type and name of all game objects in a container for debugging purposes
 * @param container container with game objects inside it
 */
export function printContainerList(container: Phaser.GameObjects.Container): void {
  console.log(
    container.list.map(go => {
      return { type: go.type, name: go.name };
    }),
  );
}

/**
 * This function is used in the context of a Pokémon battle game to calculate the actual integer damage value from a float result.
 * Many damage calculation formulas involve various parameters and result in float values.
 * The actual damage applied to a Pokémon's HP must be an integer.
 * This function helps in ensuring that by flooring the float value and enforcing a minimum damage value.
 *
 * @param value - The float value to convert.
 * @param minValue - The minimum integer value to return. Defaults to 1.
 * @returns The converted value as an integer.
 */
export function toDmgValue(value: number, minValue = 1) {
  return Math.max(Math.floor(value), minValue);
}

/**
 * Check if a number is **inclusively** between two numbers.
 * @param num - the number to check
 * @param min - the minimum value (inclusive)
 * @param max - the maximum value (inclusive)
 * @returns Whether num is no less than min and no greater than max
 */
export function isBetween(num: number, min: number, max: number): boolean {
  return min <= num && num <= max;
}
