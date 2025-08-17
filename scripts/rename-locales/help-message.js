import chalk from "chalk";

/** Show help/usage text for the `rename-locales` CLI. */
export function showHelpText() {
  console.log(`
Usage: ${chalk.cyan("pnpm rename-locales [options] glob")}
If no options are given, assumes ${chalk.blue("\`--mixed\`")}.
If more than 1 of ${chalk.blue("\`--absolute\`")}, ${chalk.blue("\`--relative\`")} and  ${chalk.blue("\`--mixed\`")} are given,
the last one will take precedence.

${chalk.hex("#8a2be2")("Arguments:")}
  ${chalk.hex("#7fff00")("files")}      A comma or space-separated list of files to search and rename the locale keys of.

${chalk.hex("#ffa500")("Options:")}
  ${chalk.blue("-h, --help")}            Show this help message.
  ${chalk.blue("-a, --absolute")}        Treat all paths as absolute.
  ${chalk.blue("-r, --relative")}        Treat all paths as relative to script location.
  ${chalk.blue("-m, --mixed")}           Treat all paths starting with a '/' or volume specifier as absolute, and the rest as relative.
`);
}
