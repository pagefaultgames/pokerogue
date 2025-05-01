import { MoneyFormat } from "#enums/money-format";
import { Moves } from "#enums/moves";
import i18next from "i18next";
import { pokerogueApi } from "#app/plugins/api/pokerogue-api";

export type nil = null | undefined;

export const MissingTextureKey = "__MISSING";

export function toReadableString(str: string): string {
  return str
    .replace(/\_/g, " ")
    .split(" ")
    .map(s => `${s.slice(0, 1)}${s.slice(1).toLowerCase()}`)
    .join(" ");
}

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
  const u = 1 - Phaser.Math.RND.realInRange(0, 1);
  const v = Phaser.Math.RND.realInRange(0, 1);
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
 * Returns a random integer between min and min + range
 * @param range The amount of possible numbers
 * @param min The starting number
 */
export function randInt(range: number, min = 0): number {
  if (range === 1) {
    return min;
  }
  return Math.floor(Math.random() * range) + min;
}

/**
 * Generates a random number using the global seed, or the current battle's seed if called via `Battle.randSeedInt`
 * @param range How large of a range of random numbers to choose from. If {@linkcode range} <= 1, returns {@linkcode min}
 * @param min The minimum integer to pick, default `0`
 * @returns A random integer between {@linkcode min} and ({@linkcode min} + {@linkcode range} - 1)
 */
export function randSeedInt(range: number, min = 0): number {
  if (range <= 1) {
    return min;
  }
  return Phaser.Math.RND.integerInRange(min, range - 1 + min);
}

/**
 * Returns a random integer between min and max (non-inclusive)
 * @param min The lowest number
 * @param max The highest number
 */
export function randIntRange(min: number, max: number): number {
  return randInt(max - min, min);
}

export function randItem<T>(items: T[]): T {
  return items.length === 1 ? items[0] : items[randInt(items.length)];
}

export function randSeedItem<T>(items: T[]): T {
  return items.length === 1 ? items[0] : Phaser.Math.RND.pick(items);
}

export function randSeedWeightedItem<T>(items: T[]): T {
  return items.length === 1 ? items[0] : Phaser.Math.RND.weightedPick(items);
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
      suffix = "K";
      break;
    case 2:
      suffix = "M";
      break;
    case 3:
      suffix = "B";
      break;
    case 4:
      suffix = "T";
      break;
    case 5:
      suffix = "q";
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
const AbbreviationsLargeNumber: string[] = ["", "K", "M", "B", "t", "q", "Q", "s", "S", "o", "n", "d"];

export function formatFancyLargeNumber(number: number, rounded = 3): string {
  let exponent: number;

  if (number < 1000) {
    exponent = 0;
  } else {
    const maxExp = AbbreviationsLargeNumber.length - 1;

    exponent = Math.floor(Math.log(number) / Math.log(1000));
    exponent = Math.min(exponent, maxExp);

    number /= Math.pow(1000, exponent);
  }

  return `${(exponent === 0) || number % 1 === 0 ? number : number.toFixed(rounded)}${AbbreviationsLargeNumber[exponent]}`;
}

export function formatMoney(format: MoneyFormat, amount: number) {
  if (format === MoneyFormat.ABBREVIATED) {
    return formatFancyLargeNumber(amount);
  }
  return amount.toLocaleString();
}

export function formatStat(stat: number, forHp = false): string {
  return formatLargeNumber(stat, forHp ? 100000 : 1000000);
}

export function getEnumKeys(enumType: any): string[] {
  return Object.values(enumType)
    .filter(v => Number.isNaN(Number.parseInt(v!.toString())))
    .map(v => v!.toString());
}

export function getEnumValues(enumType: any): number[] {
  return Object.values(enumType)
    .filter(v => !Number.isNaN(Number.parseInt(v!.toString())))
    .map(v => Number.parseInt(v!.toString()));
}

export function executeIf<T>(condition: boolean, promiseFunc: () => Promise<T>): Promise<T | null> {
  return condition ? promiseFunc() : new Promise<T | null>(resolve => resolve(null));
}

export const sessionIdKey = "pokerogue_sessionId";
// Check if the current hostname is 'localhost' or an IP address, and ensure a port is specified
export const isLocal =
  ((window.location.hostname === "localhost" || /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(window.location.hostname)) &&
    window.location.port !== "") ||
  window.location.hostname === "";

/**
 * @deprecated Refer to [pokerogue-api.ts](./plugins/api/pokerogue-api.ts) instead
 */
export const localServerUrl =
  import.meta.env.VITE_SERVER_URL ?? `http://${window.location.hostname}:${window.location.port + 1}`;

/**
 * Set the server URL based on whether it's local or not
 *
 * @deprecated Refer to [pokerogue-api.ts](./plugins/api/pokerogue-api.ts) instead
 */
export const apiUrl = localServerUrl ?? "https://api.pokerogue.net";
// used to disable api calls when isLocal is true and a server is not found
export let isLocalServerConnected = true;

/**
 * When locally running the game, "pings" the local server
 * with a GET request to verify if a server is running,
 * sets isLocalServerConnected based on results
 */
export async function localPing() {
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
}

export class FixedInt {
  public readonly value: number;

  constructor(value: number) {
    this.value = value;
  }
}

export function fixedInt(value: number): number {
  return new FixedInt(value) as unknown as number;
}

/**
 * Formats a string to title case
 * @param unformattedText Text to be formatted
 * @returns the formatted string
 */
export function formatText(unformattedText: string): string {
  const text = unformattedText.split("_");
  for (let i = 0; i < text.length; i++) {
    text[i] = text[i].charAt(0).toUpperCase() + text[i].substring(1).toLowerCase();
  }

  return text.join(" ");
}

export function toCamelCaseString(unformattedText: string): string {
  if (!unformattedText) {
    return "";
  }
  return unformattedText
    .split(/[_ ]/)
    .filter(f => f)
    .map((f, i) => (i ? `${f[0].toUpperCase()}${f.slice(1).toLowerCase()}` : f.toLowerCase()))
    .join("");
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
    case "de":
    case "it":
    case "zh-CN":
    case "zh-TW":
    case "pt-BR":
    case "ko":
    case "ja":
    case "ca-ES":
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
 * Perform a deep copy of an object.
 *
 * @param values - The object to be deep copied.
 * @returns A new object that is a deep copy of the input.
 */
export function deepCopy(values: object): object {
  // Convert the object to a JSON string and parse it back to an object to perform a deep copy
  return JSON.parse(JSON.stringify(values));
}

/**
 * Convert a space-separated string into a capitalized and underscored string.
 *
 * @param input - The string to be converted.
 * @returns The converted string with words capitalized and separated by underscores.
 */
export function reverseValueToKeySetting(input) {
  // Split the input string into an array of words
  const words = input.split(" ");
  // Capitalize the first letter of each word and convert the rest to lowercase
  const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  // Join the capitalized words with underscores and return the result
  return capitalizedWords.join("_");
}

/**
 * Capitalize a string.
 *
 * @param str - The string to be capitalized.
 * @param sep - The separator between the words of the string.
 * @param lowerFirstChar - Whether the first character of the string should be lowercase or not.
 * @param returnWithSpaces - Whether the returned string should have spaces between the words or not.
 * @returns The capitalized string.
 */
export function capitalizeString(str: string, sep: string, lowerFirstChar = true, returnWithSpaces = false) {
  if (str) {
    const splitedStr = str.toLowerCase().split(sep);

    for (let i = +lowerFirstChar; i < splitedStr?.length; i++) {
      splitedStr[i] = splitedStr[i].charAt(0).toUpperCase() + splitedStr[i].substring(1);
    }

    return returnWithSpaces ? splitedStr.join(" ") : splitedStr.join("");
  }
  return null;
}

export function isNullOrUndefined(object: any): object is undefined | null {
  return null === object || undefined === object;
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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
 * Check if a number is **inclusive** between two numbers
 * @param num the number to check
 * @param min the minimum value (included)
 * @param max the maximum value (included)
 * @returns `true` if number is **inclusive** between min and max
 */
export function isBetween(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}

/**
 * Helper method to return the animation filename for a given move
 *
 * @param move the move for which the animation filename is needed
 */
export function animationFileName(move: Moves): string {
  return Moves[move].toLowerCase().replace(/\_/g, "-");
}

/**
 * Transforms a camelCase string into a kebab-case string
 * @param str The camelCase string
 * @returns A kebab-case string
 *
 * @source {@link https://stackoverflow.com/a/67243723/}
 */
export function camelCaseToKebabCase(str: string): string {
  return str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, (s, o) => (o ? "-" : "") + s.toLowerCase());
}

/**
 * Merges the two objects, such that for each property in `b` that matches a property in `a`,
 * the value in `a` is replaced by the value in `b`. This is done recursively if the property is a non-array object
 *
 * If the property does not exist in `a` or its `typeof` evaluates differently, the property is skipped.
 * If the value of the property is an array, the array is replaced. If it is any other object, the object is merged recursively.
 */
// biome-ignore lint/complexity/noBannedTypes: This function is designed to merge json objects
export function deepMergeObjects(a: Object, b: Object) {
  for (const key in b) {
    // !(key in a) is redundant here, yet makes it clear that we're explicitly interested in properties that exist in `a`
    if (!(key in a) || typeof a[key] !== typeof b[key]) {
      continue;
    }
    if (typeof b[key] === "object" && !Array.isArray(b[key])) {
      deepMergeObjects(a[key], b[key]);
    } else {
      a[key] = b[key];
    }
  }
}
