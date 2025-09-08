import { pokerogueApi } from "#api/pokerogue-api";
import { MoneyFormat } from "#enums/money-format";
import type { Variant } from "#sprites/variant";
import i18next from "i18next";

export type nil = null | undefined;

export const MissingTextureKey = "__MISSING";

// TODO: Draft tests for these utility functions
// TODO: Break up this file

export function randomString(length: number, seeded = false) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = seeded ? randSeedInt(characters.length) : Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

export function shiftCharCodes(str: string, shiftCount: number) {
  if (!shiftCount) {
    shiftCount = 0;
  }

  let newStr = "";

  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const newCharCode = charCode + shiftCount;
    newStr += String.fromCharCode(newCharCode);
  }

  return newStr;
}

export function randGauss(stdev: number, mean = 0): number {
  if (!stdev) {
    return 0;
  }
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

export function randSeedGauss(stdev: number, mean = 0): number {
  if (!stdev) {
    return 0;
  }
  const u = 1 - randSeedFloat();
  const v = randSeedFloat();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

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

/**
 * Returns a **completely unseeded** random integer between `min` and `min + range`.
 * @param range - The amount of possible numbers to pick
 * @param min - The minimum number to pick; default `0`
 * @returns A psuedo-random, unseeded integer within the interval [min, min+range].
 * @remarks
 * This should not be used for battles or other outwards-facing randomness;
 * battles are intended to be seeded and deterministic.
 */
export function randInt(range: number, min = 0): number {
  if (range <= 1) {
    return min;
  }
  return Math.floor(Math.random() * range) + min;
}

/**
 * Generate a random integer using the global seed, or the current battle's seed if called via `Battle.randSeedInt`
 * @param range - How large of a range of random numbers to choose from. If {@linkcode range} <= 1, returns {@linkcode min}
 * @param min - The minimum integer to pick, default `0`
 * @returns A random integer between {@linkcode min} and ({@linkcode min} + {@linkcode range} - 1)
 */
export function randSeedInt(range: number, min = 0): number {
  if (range <= 1) {
    return min;
  }
  return Phaser.Math.RND.integerInRange(min, range - 1 + min);
}

/**
 * Generates a random number using the global seed
 * @param min The minimum integer to generate
 * @param max The maximum integer to generate
 * @returns a random integer between {@linkcode min} and {@linkcode max} inclusive
 */
export function randSeedIntRange(min: number, max: number): number {
  return randSeedInt(max - min + 1, min);
}

/**
 * Returns a random integer between min and max (non-inclusive)
 * @param min The lowest number
 * @param max The highest number
 */
export function randIntRange(min: number, max: number): number {
  return randInt(max - min, min);
}

/**
 * Generate and return a random real number between `0` and `1` using the global seed.
 * @returns A random floating-point number between `0` and `1`
 */
export function randSeedFloat(): number {
  return Phaser.Math.RND.frac();
}

export function randItem<T>(items: T[]): T {
  return items.length === 1 ? items[0] : items[randInt(items.length)];
}

export function randSeedItem<T>(items: T[]): T {
  return items.length === 1 ? items[0] : Phaser.Math.RND.pick(items);
}

/**
 * Shuffle a list using the seeded rng. Utilises the Fisher-Yates algorithm.
 * @param {Array} items An array of items.
 * @returns {Array} A new shuffled array of items.
 */
export function randSeedShuffle<T>(items: T[]): T[] {
  if (items.length <= 1) {
    return items;
  }
  const newArray = items.slice(0);
  for (let i = items.length - 1; i > 0; i--) {
    const j = Phaser.Math.RND.integerInRange(0, i);
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
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

/**
 * Generates IVs from a given {@linkcode id} by extracting 5 bits at a time
 * starting from the least significant bit up to the 30th most significant bit.
 * @param id 32-bit number
 * @returns An array of six numbers corresponding to 5-bit chunks from {@linkcode id}
 */
export function getIvsFromId(id: number): number[] {
  return [
    (id & 0x3e000000) >>> 25,
    (id & 0x01f00000) >>> 20,
    (id & 0x000f8000) >>> 15,
    (id & 0x00007c00) >>> 10,
    (id & 0x000003e0) >>> 5,
    id & 0x0000001f,
  ];
}

export function formatLargeNumber(count: number, threshold: number): string {
  if (count < threshold) {
    return count.toString();
  }
  const ret = count.toString();
  let suffix = "";
  switch (Math.ceil(ret.length / 3) - 1) {
    case 1:
      suffix = i18next.t("common:abrThousand");
      break;
    case 2:
      suffix = i18next.t("common:abrMillion");
      break;
    case 3:
      suffix = i18next.t("common:abrBillion");
      break;
    case 4:
      suffix = i18next.t("common:abrTrillion");
      break;
    case 5:
      suffix = i18next.t("common:abrQuadrillion");
      break;
    default:
      return "?";
  }
  const digits = ((ret.length + 2) % 3) + 1;
  let decimalNumber = ret.slice(digits, digits + 2);
  while (decimalNumber.endsWith("0")) {
    decimalNumber = decimalNumber.slice(0, -1);
  }
  return `${ret.slice(0, digits)}${decimalNumber ? `.${decimalNumber}` : ""}${suffix}`;
}

// Abbreviations from 10^0 to 10^33
function getAbbreviationsLargeNumber(): string[] {
  return [
    "",
    i18next.t("common:abrThousand"),
    i18next.t("common:abrMillion"),
    i18next.t("common:abrBillion"),
    i18next.t("common:abrTrillion"),
    i18next.t("common:abrQuadrillion"),
    i18next.t("common:abrQuintillion"),
    i18next.t("common:abrSextillion"),
    i18next.t("common:abrSeptillion"),
    i18next.t("common:abrOctillion"),
    i18next.t("common:abrNonillion"),
    i18next.t("common:abrDecillion"),
  ];
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

export const sessionIdKey = "pokerogue_sessionId";

/** `true` when run via `pnpm start:dev` (which runs `vite --mode development`) */
export const isLocal = import.meta.env.MODE === "development";

/** Used to disable api calls when isLocal is true and a server is not found */
export let isLocalServerConnected = true;

/**
 * When locally running the game, "pings" the local server
 * with a GET request to verify if a server is running,
 * sets isLocalServerConnected based on results
 */
export async function localPing(): Promise<void> {
  if (isLocal) {
    const titleStats = await pokerogueApi.getGameTitleStats();
    isLocalServerConnected = !!titleStats;
    console.log("isLocalServerConnected:", isLocalServerConnected);
  }
}

/** Alias for the constructor of a class */
export type Constructor<T> = new (...args: unknown[]) => T;

export class BooleanHolder {
  public value: boolean;

  constructor(value: boolean) {
    this.value = value;
  }
}

export class NumberHolder {
  public value: number;

  constructor(value: number) {
    this.value = value;
  }

  valueOf(): number {
    return this.value;
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

export function rgbToHsv(r: number, g: number, b: number) {
  const v = Math.max(r, g, b);
  const c = v - Math.min(r, g, b);
  const h = c && (v === r ? (g - b) / c : v === g ? 2 + (b - r) / c : 4 + (r - g) / c);
  return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

/**
 * Compare color difference in RGB
 * @param {Array} rgb1 First RGB color in array
 * @param {Array} rgb2 Second RGB color in array
 */
export function deltaRgb(rgb1: number[], rgb2: number[]): number {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;
  const drp2 = Math.pow(r1 - r2, 2);
  const dgp2 = Math.pow(g1 - g2, 2);
  const dbp2 = Math.pow(b1 - b2, 2);
  const t = (r1 + r2) / 2;

  return Math.ceil(Math.sqrt(2 * drp2 + 4 * dgp2 + 3 * dbp2 + (t * (drp2 - dbp2)) / 256));
}

// Extract out the rgb values from a hex string
const hexRegex = /^([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i;

export function rgbHexToRgba(hex: string) {
  const color = hex.match(hexRegex) ?? ["000000", "00", "00", "00"];
  return {
    r: Number.parseInt(color[1], 16),
    g: Number.parseInt(color[2], 16),
    b: Number.parseInt(color[3], 16),
    a: 255,
  };
}

export function rgbaToInt(rgba: number[]): number {
  return (rgba[0] << 24) + (rgba[1] << 16) + (rgba[2] << 8) + rgba[3];
}

/**
 * Provided valid HSV values, calculates and stitches together a string of that
 * HSV color's corresponding hex code.
 *
 * Sourced from {@link https://stackoverflow.com/a/44134328}.
 * @param h Hue in degrees, must be in a range of [0, 360]
 * @param s Saturation percentage, must be in a range of [0, 1]
 * @param l Ligthness percentage, must be in a range of [0, 1]
 * @returns a string of the corresponding color hex code with a "#" prefix
 */
export function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const rgb = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(rgb * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * This function returns `true` if all localized images used by the game have been added for the given language.
 *
 * If the lang is not in the function, it usually means that lang is going to use the default english version
 *
 * English itself counts as not available
 */
export function hasAllLocalizedSprites(lang?: string): boolean {
  // IMPORTANT - ONLY ADD YOUR LANG HERE IF YOU'VE ALREADY ADDED ALL THE NECESSARY IMAGES
  if (!lang) {
    lang = i18next.resolvedLanguage;
  }

  switch (lang) {
    case "es-ES":
    case "es-MX":
    case "fr":
    case "da":
    case "de":
    case "it":
    case "zh-CN":
    case "zh-TW":
    case "pt-BR":
    case "ro":
    case "tr":
    case "ko":
    case "ja":
    case "ca":
    case "ru":
    case "tl":
      return true;
    default:
      return false;
  }
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
 * Truncate a string to a specified maximum length and add an ellipsis if it exceeds that length.
 *
 * @param str - The string to be truncated.
 * @param maxLength - The maximum length of the truncated string, defaults to 10.
 * @returns The truncated string with an ellipsis if it was longer than maxLength.
 */
export function truncateString(str: string, maxLength = 10) {
  // Check if the string length exceeds the maximum length
  if (str.length > maxLength) {
    // Truncate the string and add an ellipsis
    return str.slice(0, maxLength - 3) + "..."; // Subtract 3 to accommodate the ellipsis
  }
  // Return the original string if it does not exceed the maximum length
  return str;
}

/**
 * Report whether a given value is nullish (`null`/`undefined`).
 * @param val - The value whose nullishness is being checked
 * @returns `true` if `val` is either `null` or `undefined`
 */
export function isNullOrUndefined(val: any): val is null | undefined {
  return val === null || val === undefined;
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
 * Helper method to localize a sprite key (e.g. for types)
 * @param baseKey the base key of the sprite (e.g. `type`)
 * @returns the localized sprite key
 */
export function getLocalizedSpriteKey(baseKey: string) {
  return `${baseKey}${hasAllLocalizedSprites(i18next.resolvedLanguage) ? `_${i18next.resolvedLanguage}` : ""}`;
}

/**
 * Check if a number is **inclusively** between two numbers
 * @param num - the number to check
 * @param min - the minimum value (inclusive)
 * @param max - the maximum value (inclusive)
 * @returns Whether num is no less than min and no greater than max
 */
export function isBetween(num: number, min: number, max: number): boolean {
  return min <= num && num <= max;
}

/** Get the localized shiny descriptor for the provided variant
 * @param variant - The variant to get the shiny descriptor for
 * @returns The localized shiny descriptor
 */
export function getShinyDescriptor(variant: Variant): string {
  switch (variant) {
    case 2:
      return i18next.t("common:epicShiny");
    case 1:
      return i18next.t("common:rareShiny");
    case 0:
      return i18next.t("common:commonShiny");
  }
}

/**
 * If the input isn't already an array, turns it into one.
 * @returns An array with the same type as the type of the input
 */
export function coerceArray<T>(input: T): T extends any[] ? T : [T];
export function coerceArray<T>(input: T): T | [T] {
  return Array.isArray(input) ? input : [input];
}
