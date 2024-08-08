import { Moves } from "#app/enums/moves";
import i18next, { type ParseKeys } from "i18next";
import { vi } from "vitest";
import GameManager from "./gameManager";
import { BattlerIndex } from "#app/battle";
import { MoveEffectPhase, TurnStartPhase } from "#app/phases";

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
 * Intercepts `TurnStartPhase` and mocks the getOrder's return value {@linkcode TurnStartPhase.getOrder}
 * Used to modify the turn order.
 * @param {GameManager} game The GameManager instance
 * @param {BattlerIndex[]} order The turn order to set
 * @example
 * ```ts
 * await mockTurnOrder(game, [BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2]);
 * ```
 */
export async function mockTurnOrder(game: GameManager, order: BattlerIndex[]): Promise<void> {
  await game.phaseInterceptor.to(TurnStartPhase, false);

  vi.spyOn(game.scene.getCurrentPhase() as TurnStartPhase, "getOrder").mockReturnValue(order);
}

/**
 * Intercepts `MoveEffectPhase` and mocks the hitCheck's return value {@linkcode MoveEffectPhase.hitCheck}.
 * Used to force a move to either hit or miss.
 * Note that this uses `mockReturnValue()`, meaning it will also apply to a
 * succeeding `MoveEffectPhase` immediately following the first one
 * (in the case of a multi-target move)
 *
 * @param {GameManager} game The GameManager instance
 * @param shouldHit Whether the move should hit
 */
export async function mockHitCheck(game: GameManager, shouldHit: boolean): Promise<void> {
  await game.phaseInterceptor.to(MoveEffectPhase, false);

  vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(shouldHit);
}
