import chalk from "chalk";

/**
 * A single line of the inputted CSV.
 * @typedef {[speciesName: string, move1: string, move2: string, move3: string, move4: string]}
 * CSVLine
 */

/**
 * Regex to determine if a string follows the required CSV format.
 */
const csvRegex = /^((?:[^,]+?,){4}(?:\w|\s)+?,?\n?)+$/g;

/**
 * Given a CSV string, parse it and return a structured table ready to be inputted into code.
 * @param {string} csv - The formatted CSV string.
 * @returns {string} The fully formatted table.
 */
export function parseEggMoves(csv) {
  console.log(chalk.grey("⚙️ Parsing egg moves..."));
  if (!csvRegex.test(csv)) {
    console.error(chalk.redBright("! Input was not proper CSV!"));
    process.exitCode = 1;
    return "";
  }

  let output = "{\n";

  const lines = csv.split(/\n/g);

  for (const line of lines) {
    /**
     * The individual CSV column for this species.
     */
    const cols =
      /** @type {CSVLine} */
      (line.split(",").slice(0, 5));
    const speciesName = toUpperSnakeCase(cols[0]);

    const eggMoves =
      /** @type {string[]} */
      ([]);

    for (let m = 1; m < 5; m++) {
      const moveName = cols[m].trim();
      if (!moveName || moveName === "N/A") {
        console.warn(`Species ${speciesName} missing ${m}th egg move!`);
        eggMoves.push("MoveId.NONE");
        continue;
      }

      // Remove (N) and (P) from the ends of move names before UPPER_SNAKE_CASE-ing them
      const moveNameTitle = toUpperSnakeCase(moveName.replace(/ \([A-Z]\)$/, ""));
      eggMoves.push("MoveId." + moveNameTitle);
    }

    if (eggMoves.every(move => move === "MoveId.NONE")) {
      console.warn(`Species ${speciesName} could not be parsed, excluding from output...`);
      output += `  // [SpeciesId.${speciesName}]: [ MoveId.NONE, MoveId.NONE, MoveId.NONE, MoveId.NONE ],\n`;
    } else {
      output += `  [SpeciesId.${speciesName}]: [ ${eggMoves.join(", ")} ],\n`;
    }
  }

  // NB: We omit the semicolon as it is contained in the template string itself
  return output + "} satisfies Partial<Record<SpeciesId, [MoveId, MoveId, MoveId, MoveId]>>";
}

/**
 * Helper method to convert a string into `UPPER_SNAKE_CASE`.
 * @param {string} str - The string being converted
 * @returns {string} The result of converting `str` into upper snake case.
 */
function toUpperSnakeCase(str) {
  return str
    .split(/[_ -]+/g)
    .map(word => word.toUpperCase())
    .join("_");
}
