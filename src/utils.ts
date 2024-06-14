import i18next from "i18next";
import { MoneyFormat } from "#enums/money-format";

export const MissingTextureKey = "__MISSING";

export function toReadableString(str: string): string {
  return str.replace(/\_/g, " ").split(" ").map(s => `${s.slice(0, 1)}${s.slice(1).toLowerCase()}`).join(" ");
}

export function randomString(length: integer, seeded: boolean = false) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = seeded ? randSeedInt(characters.length) : Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

export function shiftCharCodes(str: string, shiftCount: integer) {
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

export function clampInt(value: integer, min: integer, max: integer): integer {
  return Math.min(Math.max(value, min), max);
}

export function randGauss(stdev: number, mean: number = 0): number {
  if (!stdev) {
    return 0;
  }
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

export function randSeedGauss(stdev: number, mean: number = 0): number {
  if (!stdev) {
    return 0;
  }
  const u = 1 - Phaser.Math.RND.realInRange(0, 1);
  const v = Phaser.Math.RND.realInRange(0, 1);
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

export function padInt(value: integer, length: integer, padWith?: string): string {
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
export function randInt(range: integer, min: integer = 0): integer {
  if (range === 1) {
    return min;
  }
  return Math.floor(Math.random() * range) + min;
}

export function randSeedInt(range: integer, min: integer = 0): integer {
  if (range <= 1) {
    return min;
  }
  return Phaser.Math.RND.integerInRange(min, (range - 1) + min);
}

/**
* Returns a random integer between min and max (non-inclusive)
* @param min The lowest number
* @param max The highest number
*/
export function randIntRange(min: integer, max: integer): integer {
  return randInt(max - min, min);
}

export function randItem<T>(items: T[]): T {
  return items.length === 1
    ? items[0]
    : items[randInt(items.length)];
}

export function randSeedItem<T>(items: T[]): T {
  return items.length === 1
    ? items[0]
    : Phaser.Math.RND.pick(items);
}

export function randSeedWeightedItem<T>(items: T[]): T {
  return items.length === 1
    ? items[0]
    : Phaser.Math.RND.weightedPick(items);
}

export function randSeedEasedWeightedItem<T>(items: T[], easingFunction: string = "Sine.easeIn"): T {
  if (!items.length) {
    return null;
  }
  if (items.length === 1) {
    return items[0];
  }
  const value = Phaser.Math.RND.realInRange(0, 1);
  const easedValue = Phaser.Tweens.Builders.GetEaseFunction(easingFunction)(value);
  return items[Math.floor(easedValue * items.length)];
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

export function getFrameMs(frameCount: integer): integer {
  return Math.floor((1 / 60) * 1000 * frameCount);
}

export function getCurrentTime(): number {
  const date = new Date();
  return (((date.getHours() * 60 + date.getMinutes()) / 1440) + 0.675) % 1;
}

const secondsInHour = 3600;

export function getPlayTimeString(totalSeconds: integer): string {
  const days = `${Math.floor(totalSeconds / (secondsInHour * 24))}`;
  const hours = `${Math.floor(totalSeconds % (secondsInHour * 24) / secondsInHour)}`;
  const minutes = `${Math.floor(totalSeconds % secondsInHour / 60)}`;
  const seconds = `${Math.floor(totalSeconds % 60)}`;

  return `${days.padStart(2, "0")}:${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
}

export function binToDec(input: string): integer {
  const place: integer[] = [];
  const binary: string[] = [];

  let decimalNum = 0;

  for (let i = 0; i < input.length; i++) {
    binary.push(input[i]);
    place.push(Math.pow(2, i));
    decimalNum += place[i] * parseInt(binary[i]);
  }

  return decimalNum;
}

export function decToBin(input: integer): string {
  let bin = "";
  let intNum = input;
  while (intNum > 0) {
    bin = intNum % 2 ? `1${bin}` : `0${bin}`;
    intNum = Math.floor(intNum * 0.5);
  }

  return bin;
}

export function getIvsFromId(id: integer): integer[] {
  return [
    binToDec(decToBin(id).substring(0, 5)),
    binToDec(decToBin(id).substring(5, 10)),
    binToDec(decToBin(id).substring(10, 15)),
    binToDec(decToBin(id).substring(15, 20)),
    binToDec(decToBin(id).substring(20, 25)),
    binToDec(decToBin(id).substring(25, 30))
  ];
}

export function formatLargeNumber(count: integer, threshold: integer): string {
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

export function formatFancyLargeNumber(number: number, rounded: number = 3): string {
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

export function formatStat(stat: integer, forHp: boolean = false): string {
  return formatLargeNumber(stat, forHp ? 100000 : 1000000);
}

export function getEnumKeys(enumType): string[] {
  return Object.values(enumType).filter(v => isNaN(parseInt(v.toString()))).map(v => v.toString());
}

export function getEnumValues(enumType): integer[] {
  return Object.values(enumType).filter(v => !isNaN(parseInt(v.toString()))).map(v => parseInt(v.toString()));
}

export function executeIf<T>(condition: boolean, promiseFunc: () => Promise<T>): Promise<T> {
  return condition ? promiseFunc() : new Promise<T>(resolve => resolve(null));
}

export const sessionIdKey = "pokerogue_sessionId";
// Check if the current hostname is 'localhost' or an IP address, and ensure a port is specified
export const isLocal = (
  (window.location.hostname === "localhost" ||
   /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(window.location.hostname)) &&
  window.location.port !== "") || window.location.hostname === "";

export const localServerUrl = import.meta.env.VITE_SERVER_URL ?? `http://${window.location.hostname}:${window.location.port+1}`;

// Set the server URL based on whether it's local or not
export const serverUrl = isLocal ? localServerUrl : "";
export const apiUrl = isLocal ? serverUrl : "https://api.pokerogue.net";
// used to disable api calls when isLocal is true and a server is not found
export let isLocalServerConnected = true;

export function setCookie(cName: string, cValue: string): void {
  const expiration = new Date();
  expiration.setTime(new Date().getTime() + 3600000 * 24 * 30 * 3/*7*/);
  document.cookie = `${cName}=${cValue};Secure;SameSite=Strict;Path=/;Expires=${expiration.toUTCString()}`;
}

export function getCookie(cName: string): string {
  const name = `${cName}=`;
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

/**
 * When locally running the game, "pings" the local server
 * with a GET request to verify if a server is running,
 * sets isLocalServerConnected based on results
 */
export function localPing() {
  if (isLocal) {
    apiFetch("game/titlestats")
      .then(resolved => isLocalServerConnected = true,
        rejected => isLocalServerConnected = false
      );
  }
}

export function apiFetch(path: string, authed: boolean = false): Promise<Response> {
  return (isLocal && isLocalServerConnected) || !isLocal ? new Promise((resolve, reject) => {
    const request = {};
    if (authed) {
      const sId = getCookie(sessionIdKey);
      if (sId) {
        request["headers"] = { "Authorization": sId };
      }
    }
    fetch(`${apiUrl}/${path}`, request)
      .then(response => resolve(response))
      .catch(err => reject(err));
  }) : new Promise(() => {});
}

export function apiPost(path: string, data?: any, contentType: string = "application/json", authed: boolean = false): Promise<Response> {
  return (isLocal && isLocalServerConnected) || !isLocal ? new Promise((resolve, reject) => {
    const headers = {
      "Accept": contentType,
      "Content-Type": contentType,
    };
    if (authed) {
      const sId = getCookie(sessionIdKey);
      if (sId) {
        headers["Authorization"] = sId;
      }
    }
    fetch(`${apiUrl}/${path}`, { method: "POST", headers: headers, body: data })
      .then(response => resolve(response))
      .catch(err => reject(err));
  }) : new Promise(() => {});
}

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

export class IntegerHolder extends NumberHolder {
  constructor(value: integer) {
    super(value);
  }
}

export class FixedInt extends IntegerHolder {
  constructor(value: integer) {
    super(value);
  }
}

export function fixedInt(value: integer): integer {
  return new FixedInt(value) as unknown as integer;
}

export function rgbToHsv(r: integer, g: integer, b: integer) {
  const v = Math.max(r, g, b);
  const c = v - Math.min(r, g, b);
  const h = c && ((v === r) ? (g - b) / c : ((v === g) ? 2 + (b - r) / c : 4 + (r - g) / c));
  return [ 60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

/**
 * Compare color difference in RGB
 * @param {Array} rgb1 First RGB color in array
 * @param {Array} rgb2 Second RGB color in array
 */
export function deltaRgb(rgb1: integer[], rgb2: integer[]): integer {
  const [ r1, g1, b1 ] = rgb1;
  const [ r2, g2, b2 ] = rgb2;
  const drp2 = Math.pow(r1 - r2, 2);
  const dgp2 = Math.pow(g1 - g2, 2);
  const dbp2 = Math.pow(b1 - b2, 2);
  const t = (r1 + r2) / 2;

  return Math.ceil(Math.sqrt(2 * drp2 + 4 * dgp2 + 3 * dbp2 + t * (drp2 - dbp2) / 256));
}

export function rgbHexToRgba(hex: string) {
  const color = hex.match(/^([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  return {
    r: parseInt(color[1], 16),
    g: parseInt(color[2], 16),
    b: parseInt(color[3], 16),
    a: 255
  };
}

export function rgbaToInt(rgba: integer[]): integer {
  return (rgba[0] << 24) + (rgba[1] << 16) + (rgba[2] << 8) + rgba[3];
}

/*This function returns true if the current lang is available for some functions
If the lang is not in the function, it usually means that lang is going to use the default english version
This function is used in:
- summary-ui-handler.ts: If the lang is not available, it'll use types.json (english)
English itself counts as not available
*/
export function verifyLang(lang?: string): boolean {
  //IMPORTANT - ONLY ADD YOUR LANG HERE IF YOU'VE ALREADY ADDED ALL THE NECESSARY IMAGES
  if (!lang) {
    lang = i18next.resolvedLanguage;
  }

  switch (lang) {
  case "es":
  case "fr":
  case "de":
  case "it":
  case "zh_CN":
  case "zh_TW":
  case "pt_BR":
  case "ko":
    return true;
  default:
    return false;
  }
}

/**
 * Prints the type and name of all game objects in a container for debuggin purposes
 * @param container container with game objects inside it
 */
export function printContainerList(container: Phaser.GameObjects.Container): void {
  console.log(container.list.map(go => {
    return {type: go.type, name: go.name};
  }));
}


/**
 * Truncate a string to a specified maximum length and add an ellipsis if it exceeds that length.
 *
 * @param str - The string to be truncated.
 * @param maxLength - The maximum length of the truncated string, defaults to 10.
 * @returns The truncated string with an ellipsis if it was longer than maxLength.
 */
export function truncateString(str: String, maxLength: number = 10) {
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


