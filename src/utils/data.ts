import { loggedInUser } from "#app/account";
import { saveKey } from "#app/constants";
import type { StarterAttributes } from "#system/game-data";
import { AES, enc } from "crypto-js";

/**
 * Perform a deep copy of an object.
 * @param values - The object to be deep copied.
 * @returns A new object that is a deep copy of the input.
 */
export function deepCopy<T extends object>(values: T): T {
  // Convert the object to a JSON string and parse it back to an object to perform a deep copy
  return JSON.parse(JSON.stringify(values));
}

/**
 * Deeply merge two JSON objects' common properties together.
 * This copies all values from `source` that match properties inside `dest`,
 * checking recursively for non-null nested objects.

 * If a property in `source` does not exist in `dest` or its `typeof` evaluates differently, it is skipped.
 * If it is a non-array object, its properties are recursed into and checked in turn.
 * All other values are copied verbatim.
 * @param dest - The object to merge values into
 * @param source - The object to source merged values from
 * @remarks Do not use for regular objects; this is specifically made for JSON copying.
 */
export function deepMergeSpriteData(dest: object, source: object) {
  for (const key of Object.keys(source)) {
    if (
      !(key in dest)
      || typeof source[key] !== typeof dest[key]
      || Array.isArray(source[key]) !== Array.isArray(dest[key])
    ) {
      continue;
    }

    // Pure objects get recursed into; everything else gets overwritten
    if (typeof source[key] !== "object" || source[key] === null || Array.isArray(source[key])) {
      dest[key] = source[key];
    } else {
      deepMergeSpriteData(dest[key], source[key]);
    }
  }
}

export function encrypt(data: string, bypassLogin: boolean): string {
  if (bypassLogin) {
    return btoa(encodeURIComponent(data));
  }
  return AES.encrypt(data, saveKey).toString();
}

export function decrypt(data: string, bypassLogin: boolean): string {
  if (bypassLogin) {
    return decodeURIComponent(atob(data));
  }
  return AES.decrypt(data, saveKey).toString(enc.Utf8);
}

/**
 * Check if an object has no properties of its own (its shape is `{}`). An empty array is considered a bare object.
 * @param obj - Object to check
 * @returns - Whether the object is bare
 */
export function isBareObject(obj: any): boolean {
  if (typeof obj !== "object") {
    return false;
  }
  for (const _ in obj) {
    return false;
  }
  return true;
}

// the latest data saved/loaded for the Starter Preferences. Required to reduce read/writes. Initialize as "{}", since this is the default value and no data needs to be stored if present.
// if they ever add private static variables, move this into StarterPrefs
const StarterPrefers_DEFAULT: string = "{}";
let StarterPrefers_private_latest: string = StarterPrefers_DEFAULT;

export interface StarterPreferences {
  [key: number]: StarterAttributes | undefined;
}
// called on starter selection show once

export function loadStarterPreferences(): StarterPreferences {
  return JSON.parse(
    (StarterPrefers_private_latest =
      localStorage.getItem(`starterPrefs_${loggedInUser?.username}`) || StarterPrefers_DEFAULT),
  );
}

export function saveStarterPreferences(prefs: StarterPreferences): void {
  // Fastest way to check if an object has any properties (does no allocation)
  if (isBareObject(prefs)) {
    console.warn("Refusing to save empty starter preferences");
    return;
  }
  // no reason to store `{}` (for starters not customized)
  const pStr: string = JSON.stringify(prefs, (_, value) => (isBareObject(value) ? undefined : value));
  if (pStr !== StarterPrefers_private_latest) {
    console.log("%cSaving starter preferences", "color: blue");
    // something changed, store the update
    localStorage.setItem(`starterPrefs_${loggedInUser?.username}`, pStr);
    // update the latest prefs
    StarterPrefers_private_latest = pStr;
  }
}
