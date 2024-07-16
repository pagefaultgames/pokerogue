import i18next, { type ParseKeys } from "i18next";
import { vi } from "vitest";
import GameManager from "./gameManager";

/**
 * Sets up the i18next mock.
 * Includes a i18next.t mocked implementation only returning the raw key (`(key) => key`)
 *
 * @returns A spy/mock of i18next
 */
export function mockI18next() {
  return vi.spyOn(i18next, "t").mockImplementation((key: ParseKeys) => key);
}

/**
 * Creates an array of range `start - end`
 *
 * @param start start number e.g. 1
 * @param end end number e.g. 10
 * @returns an array of numbers
 */
export function arrayOfRange(start: integer, end: integer) {
  return Array.from({ length: end - start }, (_v, k) => k + start);
}

/**
 * Woraround to reinitialize the game scene with overrides being set properly.
 * By default the scene is initialized without all overrides even having a chance to be applied.
 * @warning USE AT YOUR OWN RISK! Might be deleted in the future
 * @param game The game manager
 * @deprecated
 */
export async function workaround_reInitSceneWithOverrides(game: GameManager) {
  await game.runToTitle();
  game.gameWrapper.setScene(game.scene);
}
