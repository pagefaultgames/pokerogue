import { Moves } from "#app/enums/moves.js";
import i18next, { type ParseKeys } from "i18next";
import { vi } from "vitest";
import GameManager from "./gameManager";
import { BattlerIndex } from "#app/battle.js";
import { TurnStartPhase } from "#app/phases";

/** Ready to use array of Moves.SPLASH x4 */
export const SPLASH_ONLY = [Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH];

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
 * Removes all held items from enemy pokemon
 * @param game The {@link GameManager} instance
 */
export function removeEnemyHeldItems(game: GameManager): void {
  game.scene.clearEnemyHeldItemModifiers();
  game.scene.clearEnemyModifiers();
  console.log("Enemy held items removed");
}

/**
 * Used to modify the turn order. Will advance the turn to {@link TurnStartPhase}
 * @param game The {@link GameManager} instance
 * @param order The turn order to set
 * @example
 * ```ts
 * await changeTurnOrder(game, [BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2]);
 * ```
 */
export async function changeTurnOrder(game: GameManager, order: BattlerIndex[]): Promise<void> {
  await game.phaseInterceptor.to(TurnStartPhase, false);

  vi.spyOn(game.scene.getCurrentPhase() as TurnStartPhase, "getOrder").mockReturnValue(order);
}
