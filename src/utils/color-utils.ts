export function rgbToHsv(red: number, green: number, blue: number): [number, number, number] {
  const v = Math.max(red, green, blue);
  const c = v - Math.min(red, green, blue);
  const h = c && (v === red ? (green - blue) / c : v === green ? 2 + (blue - red) / c : 4 + (red - green) / c);
  return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

/**
 * Compare color difference in RGB
 * @param rgb1 - First RGB color in array
 * @param rgb2 - Second RGB color in array
 */
export function deltaRgb(rgb1: readonly number[], rgb2: readonly number[]): number {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;
  const drp2 = Math.pow(r1 - r2, 2);
  const dgp2 = Math.pow(g1 - g2, 2);
  const dbp2 = Math.pow(b1 - b2, 2);
  const t = (r1 + r2) / 2;

  return Math.ceil(Math.sqrt(2 * drp2 + 4 * dgp2 + 3 * dbp2 + (t * (drp2 - dbp2)) / 256));
}

// Extract out the rgb values from a hex string
const hexRegex = /^([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i;

export function rgbHexToRgba(hex: string): { r: number; g: number; b: number; a: 255 } {
  const color = hex.match(hexRegex) ?? ["000000", "00", "00", "00"];
  return {
    r: Number.parseInt(color[1], 16),
    g: Number.parseInt(color[2], 16),
    b: Number.parseInt(color[3], 16),
    a: 255,
  };
}

export function rgbaToInt(rgba: readonly number[]): number {
  return (rgba[0] << 24) + (rgba[1] << 16) + (rgba[2] << 8) + rgba[3];
}

/**
 * Provided valid HSV values, calculates and stitches together
 * a string of that HSV color's corresponding hex code.
 *
 * @see {@link https://stackoverflow.com/a/44134328 | Code sourced from StackOverflow}
 * @param hue - Hue in degrees, must be in a range of `[0, 360]`
 * @param saturation - Saturation percentage, must be in a range of `[0, 1]`
 * @param lightness - Ligthness percentage, must be in a range of `[0, 1]`
 * @returns a string of the corresponding color hex code with a "#" prefix
 */
export function hslToHex(hue: number, saturation: number, lightness: number): string {
  const a = saturation * Math.min(lightness, 1 - lightness);
  const transformFn = (n: number) => {
    const k = (n + hue / 30) % 12;
    const rgb = lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(rgb * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${transformFn(0)}${transformFn(8)}${transformFn(4)}`;
}
