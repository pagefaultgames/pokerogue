import path from "path"; // vite externalize in production, see https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility

/**
 * Maps namespaces that deviate from the file-name
 *
 * @remarks expects file-name as value and custom-namespace as key
 */
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
  biome: "biomes",
};

/**
 * Swap the value with the key and the key with the value
 * @param json type {[key: string]: string}
 * @returns [value]: key
 *
 * @source {@link https://stackoverflow.com/a/23013726}
 */
export function objectSwap(json: { [key: string]: string }): { [value: string]: string } {
  const ret = {};
  for (const key in json) {
    ret[json[key]] = key;
  }
  return ret;
}

export function isFileInsideDir(file: string, dir: string): boolean {
  const filePath = path.normalize(file);
  const dirPath = path.normalize(dir);
  return filePath.startsWith(dirPath);
}
