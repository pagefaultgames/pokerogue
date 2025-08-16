import { toCamelCase, toPascalSnakeCase } from "../helpers/strings.js";
import { fetchNames } from "./fetch-names.js";

/**
 * @packageDocumentation
 * This script will scrape Bulbapedia for the English names of a given trainer class,
 * outputting them as JSON.
 * Usage:
 */

/**
 * Scrape the requested trainer names and format the resultant output.
 * @param {...string} classes The names of the trainer classes to retrieve
 * @returns {Promise<string>} A Promise that resolves with the finished text.
 */
async function scrapeTrainerNames(...classes) {
  /**
   * A large object mapping each class to their corresponding list of trainer names. \
   * Trainer classes with only 1 gender will only contain the single array for that gender.
   * @type {Record<string, string[] | parsedNames>}
   */
  const nameTuples = Object.fromEntries(
    await Promise.all(
      classes.map(async trainerClass => {
        // Bulba URLs use Pascal_Snake_Case (Bug_Catcher)
        const classURL = toPascalSnakeCase(trainerClass);
        const names = await fetchNames(classURL);
        const namesObj = names.female.length === 0 ? names.male : names;
        return [toCamelCase(trainerClass), namesObj];
      }),
    ),
  );
  return JSON.stringify(nameTuples, null, 2);
}

console.log(await scrapeTrainerNames("doctor"));
