// Usage: node decrypt-save.js <encrypted-file> [save-file]

import fs from "node:fs";
import crypto_js from "crypto-js";

const { AES, enc } = crypto_js;

const SAVE_KEY = "x0i2O7WRiANTqPmZ";

/**
 * A map of condensed keynames to their associated full names
 * NOTE: Update this if `src/system/game-data#systemShortKeys` ever changes!
 */
const systemShortKeys = {
  seenAttr: "$sa",
  caughtAttr: "$ca",
  natureAttr: "$na",
  seenCount: "$s",
  caughtCount: "$c",
  hatchedCount: "$hc",
  ivs: "$i",
  moveset: "$m",
  eggMoves: "$em",
  candyCount: "$x",
  friendship: "$f",
  abilityAttr: "$a",
  passiveAttr: "$pa",
  valueReduction: "$vr",
  classicWinCount: "$wc",
};

/**
 * Replace the shortened key names with their full names
 * @param {string} dataStr - The string to convert
 * @returns {string} The string with shortened keynames replaced with full names
 */
function convertSystemDataStr(dataStr) {
  const fromKeys = Object.values(systemShortKeys);
  const toKeys = Object.keys(systemShortKeys);
  for (const k in fromKeys) {
    dataStr = dataStr.replace(new RegExp(`${fromKeys[k].replace("$", "\\$")}`, "g"), toKeys[k]);
  }

  return dataStr;
}

/**
 * Decrypt a save
 * @param {string} path - The path to the encrypted save file
 * @returns {string} The decrypted save data
 */
function decryptSave(path) {
  // Check if the file exists
  if (!fs.existsSync(path)) {
    console.error(`File not found: ${path}`);
    process.exit(1);
  }
  let fileData;
  try {
    fileData = fs.readFileSync(path, "utf8");
  } catch (e) {
    if (!(e instanceof Error)) {
      console.error(`Unrecognized error: ${e}`);
      process.exit(1);
    }
    // @ts-expect-error - e is usually a SystemError (all of which have codes)
    switch (e.code) {
      case "ENOENT":
        console.error(`File not found: ${path}`);
        break;
      case "EACCES":
        console.error(`Could not open ${path}: Permission denied`);
        break;
      case "EISDIR":
        console.error(`Unable to read ${path} as it is a directory`);
        break;
      default:
        console.error(`Error reading file: ${e.message}`);
    }
    process.exit(1);
  }
  return convertSystemDataStr(AES.decrypt(fileData, SAVE_KEY).toString(enc.Utf8));
}

/* Print the usage message and exits */
function printUsage() {
  console.log(`
Usage: node decrypt-save.js <encrypted-file> [save-file]

Arguments:
  file-path   Path to the encrypted save file to decrypt.
  save-file   Path to where the decrypted data should be written. If not provided, the decrypted data will be printed to the console.

Options:
  -h, --help  Show this help message and exit.

Description:
  This script decrypts an encrypted pokerogue save file
`);
}

/**
 * Write `data` to `filePath`, gracefully communicating errors that arise
 * @param {string} filePath
 * @param {string} data
 */
function writeToFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, data);
  } catch (e) {
    if (!(e instanceof Error)) {
      console.error("Unknown error detected: ", e);
      process.exitCode = 1;
      return;
    }

    // @ts-expect-error - e is usually a SystemError (all of which have codes)
    switch (e.code) {
      case "EACCES":
        console.error(`Could not open ${filePath}: Permission denied`);
        break;
      case "EISDIR":
        console.error(`Unable to write to ${filePath} as it is a directory`);
        break;
      default:
        console.error(`Error writing file: ${e.message}`);
    }
    process.exitCode = 1;
    return;
  }
}

function main() {
  let args = process.argv.slice(2);
  // Get options
  const options = args.filter(arg => arg.startsWith("-"));
  // get args
  args = args.filter(arg => !arg.startsWith("-"));

  if (args.length === 0 || options.includes("-h") || options.includes("--help") || args.length > 2) {
    printUsage();
    process.exit(0);
  }
  // If the user provided a second argument, check if the file exists already and refuse to write to it.
  if (args.length === 2) {
    const destPath = args[1];
    if (fs.existsSync(destPath)) {
      console.error(`Refusing to overwrite ${destPath}`);
      process.exit(1);
    }
  }

  // Otherwise, commence decryption.
  const decrypt = decryptSave(args[0]);

  if (args.length === 1) {
    process.stdout.write(decrypt);
    process.exit(0);
  }

  writeToFile(args[1], decrypt);
}

main();
