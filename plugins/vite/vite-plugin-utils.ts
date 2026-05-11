/**
 * Module containing various utilities used for vite plugins.
 * Made into a separate file for better minification/tree-shaking, as Vite will not need to include the contents.
 * @module
 */

import { normalizePath } from "vite";

type Swap<Obj extends Record<PropertyKey, PropertyKey>> = {
  [Key in keyof Obj as Obj[Key]]: Key;
};

/**
 * Swap the value with the key and the key with the value
 * @param json - The object to swap key/value pairs of
 * @returns The swapped object
 */
export function objectSwap<Obj extends Record<PropertyKey, PropertyKey>>(obj: Obj): Swap<Obj> {
  const ret: Record<PropertyKey, PropertyKey> = {};
  // biome-ignore lint/suspicious/useGuardForIn: obj's keys are guaranteed to be valid property keys, rendering a guard unnecessary
  for (const key in obj) {
    ret[obj[key]] = key;
  }
  return ret as Swap<Obj>;
}

/**
 * Checks if a file is inside a directory.
 * @param file - The file to check.
 * @param dir - The directory to check against.
 * @returns Whether `file` is located inside `dir`.
 * @remarks
 * If either `file` or `dir` is not a valid path, the behaviour of this function is unspecified.
 */
export function isFileInsideDir(file: string, dir: string): boolean {
  const filePath = normalizePath(file);
  const dirPath = normalizePath(dir);
  return filePath.startsWith(dirPath);
}
