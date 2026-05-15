/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 * SPDX-FileContributor: Bertie690
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * @packageDocumentation
 * This script will scrape Bulbapedia for the English names of a given trainer class,
 * outputting them as JSON.
 * Usage: `pnpm scrape-trainers`
 */

import { checkGenderAndType } from "#scrape-trainer-names/check-gender";
import { fetchNames, INVALID_URL } from "#scrape-trainer-names/fetch-names";
import { showHelpText } from "#scrape-trainer-names/help-message";
import type { ParsedNames } from "#scrape-trainer-names/types";
import { getPropertyValue } from "#script-utils/arguments";
import { writeFileSafe } from "#script-utils/file";
import { normalizeDiacritics } from "#script-utils/unicode";
import { toCamelCase, toPascalSnakeCase, toTitleCase } from "#utils/strings";
import { format, inspect } from "node:util";
import chalk from "chalk";
import { JSDOM } from "jsdom";

const version = "1.0.0";

/**
 * A large object mapping each "base" trainer name to a list of replacements.
 * Used to allow for trainer classes with different `TrainerType`s than in mainline.
 */
const trainerNamesMap: Record<string, string[]> = {
  pokemonBreeder: ["breeder"],
  worker: ["worker", "snowWorker"],
  richBoy: ["richKid"],
  gentleman: ["rich"],
};

const OUTFILE_ALIASES = ["-o", "--outfile", "--outFile"] as const;

async function main() {
  console.log(chalk.hex("#FF7F50")(`🍳 Trainer Name Scraper v${version}`));

  const args = process.argv.slice(2);
  const outFile = getPropertyValue(args, OUTFILE_ALIASES);
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
  await tryWriteFile(outFile, output);
}

/**
 * Scrape the requested trainer names and format the resultant output.
 * @param classes - The names of the trainer classes to retrieve
 * @returns A Promise that resolves with the finished text.
 */
async function scrapeTrainerNames(classes: string[]): Promise<string> {
  classes = [...new Set(classes)];

  /**
   * A Set containing all trainer URLs that have been seen.
   */
  const seenClasses = new Set<string>();

  /**
   * A large array of tuples matching each class to their corresponding list of trainer names. \
   * Trainer classes with only 1 gender will only contain the single array for that gender.
   */
  const namesTuples: [keyName: string, names: string[] | ParsedNames][] = await Promise.all(
    classes.map(async trainerClass => {
      try {
        const [trainerName, names] = await doFetch(trainerClass, seenClasses);
        const namesObj = names.female.length === 0 ? names.male : names;
        return [trainerName, namesObj] as const;
      } catch (e) {
        if (!(e instanceof Error)) {
          throw new Error(chalk.red.bold("Unrecognized error detected:", inspect(e)));
        }
        // If the error contains an HTTP status, attempt to parse the code to give a more friendly
        // response than JSDOM's "Resource was not loaded"
        const errCode = /Status: (\d*)/g.exec(e.message)?.[1];
        if (!errCode) {
          throw e;
        }
        let reason: string;
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
      ...namesMapping.map(name => [name, mappedName[1]] as [string, string[] | ParsedNames]),
    );
  }

  namesTuples.sort((a, b) => a[0].localeCompare(b[0]));

  const namesRecord: Record<string, string[] | ParsedNames> = Object.fromEntries(namesTuples);

  // Convert all arrays into objects indexed by numbers
  return JSON.stringify(
    namesRecord,
    (_, v) => {
      if (Array.isArray(v)) {
        return v.reduce<Record<number, unknown>>((ret, curr, i) => {
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
 * @param trainerClass - The URL to parse
 * @param seenClasses - A Set containing all seen class URLs, used for record keeping.
 * @returns A Promise that resolves with:
 * 1. The name to use for the key.
 * 2. All fetched names for this trainer class and its gender variants.
 */
async function doFetch(trainerClass: string, seenClasses: Set<string>): Promise<[string, ParsedNames]> {
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
 * Write the output to a file, or stdout if no outfile is provided.
 * @param outFile - The path to write the output to
 * @param output - The scraped output to produce
 */
async function tryWriteFile(outFile: string | undefined, output: string): Promise<void> {
  if (!outFile) {
    console.log(chalk.hex("#ffa500")("No outfile detected, logging to stdout..."));
    console.log(output);
    return;
  }

  console.log(chalk.hex("#ffa500")(`Using outfile: ${chalk.blue(outFile)}`));

  try {
    writeFileSafe(outFile, output);
    console.log(chalk.green.bold(`✔ Output written to ${chalk.blue(outFile)} successfully!`));
  } catch (e) {
    let errStr: string;
    if (e instanceof Error) {
      switch ((e as NodeJS.ErrnoException).code) {
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
    } else {
      errStr = format("Unknown error occurred: ", e);
    }
    console.error(chalk.red.bold(errStr));
    process.exitCode = 1;
    return;
  }
}

await main();
