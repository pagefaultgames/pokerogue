import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getFrenchNounCode } from "../languages/fr";

const localeDir = resolve(import.meta.dirname, "../../../locales/fr");

/** Recursively collect the localized item names from a locale file. */
function collectNames(value: unknown, key = "", names: string[] = []): string[] {
  if (typeof value === "string") {
    // Skip descriptions and templated strings (e.g. "{{pokeballName}} ×{{modifierCount}}")
    if (!key.startsWith("description") && key !== "effect" && !value.includes("{{")) {
      names.push(value);
    }
  } else if (typeof value === "object" && value !== null) {
    for (const [childKey, child] of Object.entries(value)) {
      if (childKey !== "extra") {
        collectNames(child, childKey, names);
      }
    }
  }
  return names;
}

const files = ["pokeball.json", "berry.json", "modifier-type.json"];
let totalMissing = 0;

for (const file of files) {
  const data: unknown = JSON.parse(readFileSync(resolve(localeDir, file), "utf8"));
  const missing = collectNames(data).filter(name => getFrenchNounCode(name) === undefined);
  totalMissing += missing.length;
  console.log(`${file}: ${missing.length} name(s) without gender data`);
  for (const name of missing) {
    console.log(`  ${name}`);
  }
}

process.exitCode = totalMissing > 0 ? 1 : 0;
