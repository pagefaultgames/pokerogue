import { hslToHex } from "#utils/common";
import chalk, { type ChalkInstance, type ForegroundColorName, foregroundColorNames } from "chalk";
import colorMap from "./color-map.json";

export function inferColorFormat(data: [string, ...unknown[]]): ChalkInstance {
  // Remove all CSS format strings and find the first one containing something vaguely resembling a color
  data[0] = data[0].replaceAll("%c", "");
  const args = data.slice(1).filter(t => typeof t === "string");
  const color = findColorPrefix(args);

  // If the color is within Chalk's native roster, use it directly.
  if ((foregroundColorNames as string[]).includes(color)) {
    return chalk[color as ForegroundColorName];
  }

  // Otherwise, coerce it to hex before feeding it in.
  return getColor(color);
}

/**
 * Find the first string with a "color:" CSS directive in an argument list.
 * @param args - The arguments containing the color directive
 * @returns The found color, or `"green"` if none were found
 */
function findColorPrefix(args: string[]): string {
  for (const arg of args) {
    const match = /color:\s*(.+?)(?:;|$)/g.exec(arg);
    if (match === null) {
      continue;
    }

    return match[1];
  }
  return "green";
}

/**
 * Coerce an arbitrary CSS color string to a Chalk instance.
 * @param color - The color to coerce
 * @returns The Chalk color equivalent.
 */
function getColor(color: string): ChalkInstance {
  if (/^#([a-z0-9]{3,4}|[a-z0-9]{6}|[a-z0-9]{8})$/i.test(color)) {
    // already in hex
    return chalk.hex(color);
  }

  const rgbMatch = /^rgba?\((\d{1,3})%?,\s*(\d{1,3})%?,?\s*(\d{1,3})%?,\s*/i.exec(color);
  if (rgbMatch) {
    const [red, green, blue] = rgbMatch;
    return chalk.rgb(+red, +green, +blue);
  }

  const hslMatch = /^hslv?\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/i.exec(color);
  if (hslMatch) {
    const [hue, saturation, light] = hslMatch;
    return chalk.hex(hslToHex(+hue, +saturation / 100, +light / 100));
  }

  return chalk.hex(colorMap[color] ?? "#00ff95ff");
}
