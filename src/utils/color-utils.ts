import { alphaFromArgb, blueFromArgb, greenFromArgb, redFromArgb } from "@material/material-color-utilities";

// #region @material functions

// These functions were removed from versions after `0.3.0`,
// and are re-created to maintain compatibility with existing code

/*
 * SPDX-SnippetBegin
 *
 * SPDX-SnippetCopyrightText: 2021 Google LLC
 * SPDX-SnippetCopyrightText: 2026 Pagefault Games
 * SPDX-License-Identifier: Apache-2.0
 */

/** @remarks Values should be in the range `0-255` inclusive */
interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Return RGBA from a given int32 color
 *
 * @param argb - ARGB representation of a int32 color.
 * @return RGBA representation of a int32 color.
 */
export function rgbaFromArgb(argb: number): Rgba {
  const r = redFromArgb(argb);
  const g = greenFromArgb(argb);
  const b = blueFromArgb(argb);
  const a = alphaFromArgb(argb);
  return { r, g, b, a };
}

/**
 * Return int32 color from a given RGBA component
 *
 * @param rgba - RGBA representation of a int32 color.
 * @returns ARGB representation of a int32 color.
 */
export function argbFromRgba({ r, g, b, a }: Rgba): number {
  const rValue = Phaser.Math.Clamp(r, 0, 255);
  const gValue = Phaser.Math.Clamp(g, 0, 255);
  const bValue = Phaser.Math.Clamp(b, 0, 255);
  const aValue = Phaser.Math.Clamp(a, 0, 255);
  return (aValue << 24) | (rValue << 16) | (gValue << 8) | bValue;
}

// SPDX-SnippetEnd

// #endregion @material functions

export function rgbToHsv(r: number, g: number, b: number) {
  const v = Math.max(r, g, b);
  const c = v - Math.min(r, g, b);
  const h = c && (v === r ? (g - b) / c : v === g ? 2 + (b - r) / c : 4 + (r - g) / c);
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

export function rgbHexToRgba(hex: string) {
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
 * Provided valid HSV values, calculates and stitches together a string of that
 * HSV color's corresponding hex code.
 *
 * Sourced from {@link https://stackoverflow.com/a/44134328}.
 * @param h - Hue in degrees, must be in a range of [0, 360]
 * @param s - Saturation percentage, must be in a range of [0, 1]
 * @param l - Ligthness percentage, must be in a range of [0, 1]
 * @returns a string of the corresponding color hex code with a "#" prefix
 */
export function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const rgb = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(rgb * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
