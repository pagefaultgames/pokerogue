import { existsSync, writeFileSync } from "node:fs";
import { format, inspect } from "node:util";
import chalk from "chalk";
import inquirer from "inquirer";
import { JSDOM } from "jsdom";
import { toCamelCase, toPascalSnakeCase, toTitleCase } from "../helpers/strings.js";
import { checkGenderAndType } from "./check-gender.js";
import { fetchNames, INVALID_URL } from "./fetch-names.js";
import { showHelpText } from "./help-message.js";

/**
 * @packageDocumentation
 * This script will scrape Bulbapedia for the English names of a given trainer class,
 * outputting them as JSON.
 * Usage: `pnpm scrape-trainers`
 */

/**
 * @import { parsedNames } from "./types.js"
 */

const version = "1.0.0";
const OUTFILE_ALIASES = /** @type {const} */ (["-o", "--outfile", "--outFile"]);

/**
 * A large object mapping each "base" trainer name to a list of replacements.
 * Used to allow for trainer classes with different `TrainerType`s than in mainline.
 * @type {Record<string, string[]>}
 */
const trainerNamesMap = {
  pokemonBreeder: ["breeder"],
  worker: ["worker", "snowWorker"],
  richBoy: ["richKid"],
  gentleman: ["rich"],
};

async function main() {
  console.log(chalk.hex("#FF7F50")(`🍳 Trainer Name Scraper v${version}`));

  const args = process.argv.slice(2);
  const out = getOutfile(args);
  // Break out if no args remain
  if (args.length === 0) {
    console.error(
      chalk.red.bold(
        `✗ Error: No trainer classes provided!\nArgs: ${chalk.hex("#7310fdff")(process.argv.slice(2).join(", "))}`,
      ),
    );
    showHelpText();
    process.exitCode = 1;
    return;
  }

  const output = await scrapeTrainerNames(args);
  await tryWriteFile(out, output);
}

/**
 * Get the outfile location from the args array.
 * @param {string[]} args - The command line arguments
 * @returns {string | undefined} The outfile location, or `undefined` if none is provided
 * @remarks
 * This will mutate the `args` array by removing the outfile from the list of arguments.
 */
function getOutfile(args) {
  let /** @type {string} */ outFile;
  // Extract the outfile as either the form "-o=y" or "-o y".
  const hasEquals = /^.*=(.+)$/g.exec(args[0]);
  if (hasEquals) {
    outFile = hasEquals[1];
    args.splice(0, 1);
  } else if (/** @type {readonly string[]} */ (OUTFILE_ALIASES).includes(args[0])) {
    outFile = args[1];
    args.splice(0, 2);
  } else {
    console.log(chalk.hex("#ffa500")("No outfile detected, logging to stdout..."));
    return;
  }

  console.log(chalk.hex("#ffa500")(`Using outfile: ${chalk.blue(outFile)}`));
  return outFile;
}

/**
 * Scrape the requested trainer names and format the resultant output.
 * @param {string[]} classes The names of the trainer classes to retrieve
 * @returns {Promise<string>} A Promise that resolves with the finished text.
 */
async function scrapeTrainerNames(classes) {
  classes = [...new Set(classes)];

  /**
   * A Set containing all trainer URLs that have been seen.
   * @type {Set<string>}
   */
  const seenClasses = new Set();

  /**
   * A large array of tuples matching each class to their corresponding list of trainer names. \
   * Trainer classes with only 1 gender will only contain the single array for that gender.
   * @type {[keyName: string, names: string[] | parsedNames][]}
   */
  const namesTuples = await Promise.all(
    classes.map(async trainerClass => {
      try {
        const [trainerName, names] = await doFetch(trainerClass, seenClasses);
        const namesObj = names.female.length === 0 ? names.male : names;
        return /** @type {const} */ ([trainerName, namesObj]);
      } catch (e) {
        if (!(e instanceof Error)) {
          throw new Error(chalk.red.bold("Unrecognized error detected:", inspect(e)));
        }
        // If the error contains an HTTP status, attempt to parse the code to give a more friendly
        // response than JSDOM's "Resource was not loaded"gi
        const errCode = /Status: (\d*)/g.exec(e.message)?.[1];
        if (!errCode) {
          throw e;
        }
        /** @type {string} */
        let reason;
        switch (+errCode) {
          case 404:
            reason = "Page not found";
            break;
          case 403:
            reason = "Access is forbidden";
            break;
          default:
            reason = `Server produced error code of ${+errCode}`;
        }
        throw new Error(
          chalk.red.bold(`Failed to parse URL for ${chalk.hex("#7fff00")(`"${trainerClass}"`)}!\nReason: ${reason}`),
        );
      }
    }),
  );

  // Grab all keys inside the name replacement map and change them accordingly.
  const mappedNames = namesTuples.filter(tuple => tuple[0] in trainerNamesMap);
  for (const mappedName of mappedNames) {
    const namesMapping = trainerNamesMap[mappedName[0]];
    namesTuples.splice(
      namesTuples.indexOf(mappedName),
      1,
      ...namesMapping.map(
        name => /** @type {[keyName: string, names: parsedNames | string[]]} */ ([name, mappedName[1]]),
      ),
    );
  }

  namesTuples.sort((a, b) => a[0].localeCompare(b[0]));

  /** @type {Record<string, string[] | parsedNames>} */
  const namesRecord = Object.fromEntries(namesTuples);

  // Convert all arrays into objects indexed by numbers
  return JSON.stringify(
    namesRecord,
    (_, v) => {
      if (Array.isArray(v)) {
        return v.reduce((ret, curr, i) => {
          ret[i + 1] = curr; // 1 indexed
          return ret;
        }, {});
      }
      return v;
    },
    2,
  );
}

/**
 * Recursively scrape names from a given Trainer class and its gender counterparts.
 * @param {string} trainerClass - The URL to parse
 * @param {Set<string>} seenClasses - A Set containing all seen class URLs, used for record keeping.
 * @returns {Promise<[string, parsedNames]>}
 * A Promise that resolves with:
 * 1. The name to use for the key.
 * 2. All fetched names for this trainer class and its gender variants.
 */
async function doFetch(trainerClass, seenClasses) {
  let keyName = toCamelCase(trainerClass);
  // Bulba URLs are in Pascal_Snake_Case (Pokemon_Breeder)
  const classURL = toPascalSnakeCase(trainerClass);
  seenClasses.add(classURL);

  // Bulbapedia has redirects mapping basically all variant spellings of each trainer name to the corresponding main page.
  // We thus rely on it
  const { document } = (await JSDOM.fromURL(`https://bulbapedia.bulbagarden.net/wiki/${classURL}`)).window;
  const trainerListHeader = document.querySelector("#Trainer_list")?.parentElement;
  const [female, counterpartURLs] = checkGenderAndType(document);
  const names = fetchNames(trainerListHeader, female);
  if (names === INVALID_URL) {
    return Promise.reject(new Error(chalk.red.bold(`URL "${classURL}" did not correspond to a valid trainer class!`)));
  }

  // Recurse into all unseen gender counterparts' URLs, using the first male name we find
  const counterpartNames = await Promise.all(
    counterpartURLs
      .filter(url => !seenClasses.has(url))
      .map(counterpartURL => {
        console.log(chalk.green(`Accessing gender counterpart URL: ${toTitleCase(counterpartURL)}`));
        return doFetch(counterpartURL, seenClasses);
      }),
  );
  let overrodeName = false;
  for (const [cKeyName, cNameObj] of counterpartNames) {
    if (!overrodeName && female) {
      overrodeName = true;
      console.log(chalk.green(`Using "${cKeyName}" as the name of the JSON key object...`));
      keyName = cKeyName;
    }
    names.male = [...new Set(names.male.concat(cNameObj.male))];
    names.female = [...new Set(names.female.concat(cNameObj.female))];
  }
  return [normalizeDiacritics(keyName), names];
}

/**
 * Convert all diacritical marks within a string into their normalized variants.
 * @param {string} str - The string to parse
 * @returns {string} The string with normalized diacritics
 */
function normalizeDiacritics(str) {
  // Normalizing to NFKD splits all diacritics into the base letter + grapheme (à -> a + `),
  // which are conveniently all in their own little Unicode block for easy removal
  return str.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Try to write the output to a file (or log it to stdout, as the case may be).
 * @param {string | undefined} outFile - The outfile
 * @param {string} output - The scraped output to produce
 */
async function tryWriteFile(outFile, output) {
  if (!outFile) {
    console.log(output);
    return;
  }

  if (existsSync(outFile) && !(await promptExisting(outFile))) {
    process.exitCode = 1;
    return;
  }

  try {
    writeFileSync(outFile, output);
    console.log(chalk.green.bold(`✔ Output written to ${chalk.blue(outFile)} successfully!`));
  } catch (e) {
    let /** @type {string} */ errStr;
    if (!(e instanceof Error)) {
      errStr = format("Unknown error occurred: ", e);
    } else {
      // @ts-expect-error - Node.JS file errors always have codes
      switch (e.code) {
        case "ENOENT":
          errStr = `File not found: ${outFile}`;
          break;
        case "EACCES":
          errStr = `Could not write ${outFile}: Permission denied`;
          break;
        case "EISDIR":
          errStr = `Unable to write to ${outFile} as it is a directory`;
          break;
        default:
          errStr = `Error writing file: ${e.message}`;
      }
    }
    console.error(chalk.red.bold(errStr));
    process.exitCode = 1;
    return;
  }
}

/**
 * Confirm overwriting an already-existing file.
 * @param {string} outFile - The outfile
 * @returns {Promise<boolean>} Whether "Yes" or "No" was selected.
 */
async function promptExisting(outFile) {
  return (
    await inquirer.prompt([
      {
        type: "confirm",
        name: "continue",
        message: `File ${chalk.blue(outFile)} already exists!\nDo you want to replace it?`,
        default: false,
      },
    ])
  ).continue;
}

main();
