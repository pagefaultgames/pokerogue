import { hslToHex } from "#utils/common";
import chalk, { type ChalkInstance, type ForegroundColorName, foregroundColorNames } from "chalk";
import colorMap from "./color-map.json";

const FALLBACK_COLOR = "green" satisfies ForegroundColorName;

/**
 * Determine the color to use for a log message based on its arguments, and remove any CSS formatting directives found within.
 * @param args - The original arguments passed to the logging function
 * @returns
 * The `ChalkInstance` to use to color the output.
 * @remarks
 * Used to support CSS color directives in Node.JS environments which lack native support.
 */
export function inferColorFormat(args: [format: string, ...unknown[]]): ChalkInstance {
  // Remove all CSS format strings and find the first one containing something vaguely resembling a color
  args[0] = args[0].replaceAll("%c", "");
  const [color, index] = findColorPrefix(args);
  if (index !== -1) {
    args.splice(index, 1);
  }

  // use color directly if supported, or coerce it to a hex code otherwise
  if ((foregroundColorNames as string[]).includes(color)) {
    return chalk[color as ForegroundColorName];
  }

  return parseCSSColor(color);
}

/**
 * Extract the contents of the first argument containing a CSS `"color:"` directive.
 * @param args - The arguments to search through
 * @returns The found color and its position inside the array.
 * Returns `[FALLBACK_COLOR, -1]` if none were found
 */
function findColorPrefix(args: unknown[]): [color: string, index: number] {
  for (const [index, arg] of args.entries()) {
    if (typeof arg !== "string") {
      continue;
    }
    const match = /color:\s*(.+?)$|;/gm.exec(arg);
    if (match === null || !match[1]?.trim()) {
      continue;
    }

    return [match[1], index];
  }

  return [FALLBACK_COLOR, -1];
}

/**
 * Coerce an arbitrary CSS color string to a Chalk instance.
 * @param color - The color to coerce
 * @returns The Chalk color equivalent.
 */
function parseCSSColor(color: string): ChalkInstance {
  if (/^#?([a-z\d]{3,4}|[a-z\d]{6}|[a-z\d]{8})$/i.test(color)) {
    // already in hex
    return chalk.hex(color);
  }

  const rgbMatch = /^rgba?\(([\d.]+),?\s+([\d.]+),?\s+([\d.]+)(?:\)|,|\s)/i.exec(color);
  if (rgbMatch) {
    const [, red, green, blue] = rgbMatch;
    return chalk.rgb(+red, +green, +blue);
  }

  const hslMatch = /^hslv?\((\d{1,3}),?\s+(\d{1,3})%,?\s+(\d{1,3})%(?:\)|,|\s)/i.exec(color);
  if (hslMatch) {
    const [, hue, saturation, light] = hslMatch;
    return chalk.hex(hslToHex(+hue, +saturation / 100, +light / 100));
  }

  // CSS color names are case insensitive
  for (const [name, hex] of Object.entries(colorMap)) {
    if (name.toLowerCase() === color.toLowerCase()) {
      return chalk.hex(hex);
    }
  }

  return chalk[FALLBACK_COLOR];
}
