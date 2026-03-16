/*
 * SPDX-FileCopyrightText: 2025-2026 Pagefault Games
 * SPDX-FileContributor: Bertie690
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { HelpConfiguration } from "@commander-js/extra-typings";
import chalk from "chalk";

/**
 * Obtain the value of a property value CLI argument (one of the form
 * `-x=y` or `-x y`).
 * @param args - The command line arguments array to parse
 * @param flags - An array containing all valid flags to check.
 * @returns The provided arguments, or `undefined` if none is provided
 * @remarks
 * This will mutate the `args` array by removing the first specified match.
 */
// TODO: Remove and migrate existing scripts to `commander` (which does this for us)
export function getPropertyValue(args: string[], flags: readonly string[]): string | undefined {
  let arg: string | undefined;
  // Extract the prop as either the form "-o=y" or "-o y".
  const hasEquals = /^.*=(.+)$/g.exec(args[0]);
  if (hasEquals) {
    arg = hasEquals[1];
    args.splice(0, 1);
  } else if (flags.includes(args[0])) {
    arg = args[1];
    args.splice(0, 2);
  }

  return arg;
}

/** Color for argument names in help text (`#7fff00`).*/
export const ARGUMENT_COLOR = chalk.hex("#7fff00");
/** Color for option flags in help text (`#8a2be2`). */
export const OPTION_COLOR = chalk.hex("#8a2be2");
/** Color for usage text in help text (`chalk.blue`). */
export const USAGE_COLOR = chalk.blue;

/**
 * Standardized arguments for Commander's help text formatter.
 * @remarks
 * Extending this config is discouraged; its explicit purpose is to standardize a potential source of bikeshedding.
 */
export const defaultCommanderHelpArgs: HelpConfiguration = {
  styleUsage: str => USAGE_COLOR(str),
  optionTerm: option => OPTION_COLOR(option.flags),
  argumentTerm: argument => ARGUMENT_COLOR(argument.name()),
  styleTitle: title => getTitleColor(title)(title),
  optionDescription: option => {
    // Inspired by the default reporter from `commander`'s source code, but making all headers Title Case to match existing conventions
    const extraInfo: string[] = [];

    if (option.argChoices) {
      extraInfo.push(`Choices: ${option.argChoices.map(choice => JSON.stringify(choice)).join(", ")}`);
    }
    if (option.defaultValue !== undefined) {
      const showDefault =
        option.required || option.optional || (option.isBoolean() && typeof option.defaultValue === "boolean");
      if (showDefault) {
        extraInfo.push(`Default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
      }
    }

    if (option.presetArg !== undefined && option.optional) {
      extraInfo.push(`Preset: ${JSON.stringify(option.presetArg)}`);
    }
    if (option.envVar !== undefined) {
      extraInfo.push(`Env: ${option.envVar}`);
    }

    if (extraInfo.length === 0) {
      return option.description;
    }

    const extraDescription = `(${extraInfo.join(", ")})`;
    if (option.description) {
      return `${option.description} ${extraDescription}`;
    }
    return extraDescription;
  },
};

/**
 * Color section header titles with the color corresponding to their contents.
 * @param title - The title header being colored
 * @returns A function to color the resulting output.
 */
function getTitleColor(title: string): (str: string) => string {
  const titleLower = title.toLowerCase();
  if (titleLower.includes("option")) {
    return OPTION_COLOR.bold;
  }
  if (titleLower.includes("argument")) {
    return ARGUMENT_COLOR.bold;
  }
  if (titleLower.includes("usage")) {
    return USAGE_COLOR.bold;
  }
  return chalk.bold;
}
