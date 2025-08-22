import chalk from "chalk";

/** Show help/usage text for the `scrape-trainers` CLI. */
export function showHelpText() {
  console.log(`
Usage: ${chalk.cyan("pnpm scrape-trainers [options] <names>")}
Note that all option names are ${chalk.bold("case insensitive")}.

${chalk.hex("#8a2be2")("Arguments:")}
  ${chalk.hex("#7fff00")("names")}                    The name of one or more trainer classes to parse.

${chalk.hex("#ffa500")("Options:")}
  ${chalk.blue("-h, --help")}               Show this help message.
  ${chalk.blue("-o, --out, --outfile")}     The path to a file to save the output. If not provided, will send directly to stdout.
`);
}
