import path from "path"; // vite externalize in production, see https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility

/**
 * ### maps namespaces that deviate from the file-name
 * @description expects file-name as value and custom-namespace as key
 * */
export const namespaceMap = {
  titles: "trainer-titles",
  moveTriggers: "move-trigger",
  abilityTriggers: "ability-trigger",
  battlePokemonForm: "pokemon-form-battle",
  miscDialogue: "dialogue-misc",
  battleSpecDialogue: "dialogue-final-boss",
  doubleBattleDialogue: "dialogue-double-battle",
  splashMessages: "splash-texts",
  mysteryEncounterMessages: "mystery-encounter-texts",
};

/**
 * Transforms a kebab-case string into a camelCase string
 * @param str The kebabCase string
 * @returns A camelCase string
 *
 * @source {@link https://stackoverflow.com/a/23013726}
 */
export function kebabCaseToCamelCase(str: string): string {
  return str.replace(/-./g, (x)=> x[1].toUpperCase());
}

/**
 * Swap the value with the key and the key with the value
 * @param json type {[key: string]: string}
 * @returns [value]: key
 *
 * @source {@link https://stackoverflow.com/a/23013726}
 */
export function objectSwap(json: {[key: string]: string}): {[value: string]: string} {
  const ret = {};
  for (const key in json) {
    ret[json[key]] = key;
  }
  return ret;
}

export function isFileInsideDir(file, dir) {
  const filePath = path.normalize(file);
  const dirPath = path.normalize(dir);
  return filePath.startsWith(dirPath);
}
