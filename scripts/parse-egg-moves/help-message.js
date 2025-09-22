import chalk from "chalk";

/** Show help/usage text for the `eggMoves:parse` CLI. */
export function showHelpText() {
  console.log(`
Usage: ${chalk.cyan("pnpm eggMoves:parse [options]")}
If given no options, assumes ${chalk.blue("`--interactive`")}.
If given only a file path, assumes ${chalk.blue("`--file`")}.

${chalk.hex("#ffa500")("Options:")}
  ${chalk.blue("-h, --help")}            Show this help message.
  ${chalk.blue("-f, --file[=PATH]")}     Specify a path to a CSV file to read, or provide one from stdin.
  ${chalk.blue("-t, --text[=TEXT]")}
  ${chalk.blue("-c, --console[=TEXT]")}  Specify CSV text to read, or provide it from stdin.
  ${chalk.blue("-i, --interactive")}     Run in interactive mode (default)
`);
}
