import type { RewardKeys } from "#items/reward";
import { itemPoolChecks } from "#items/reward";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";
import { expect } from "vitest";

export class ModifierHelper extends GameManagerHelper {
  /**
   * Adds a Modifier to the list of modifiers to check for.
   *
   * Note that all modifiers are updated during the start of `SelectRewardPhase`.
   * @param modifier The Modifier to add.
   * @returns `this`
   */
  addCheck(modifier: RewardKeys): this {
    itemPoolChecks.set(modifier, undefined);
    return this;
  }

  /**
   * `get`s a value from the `itemPoolChecks` map.
   *
   * If the item is in the Modifier Pool, and the player can get it, will return `true`.
   *
   * If the item is *not* in the Modifier Pool, will return `false`.
   *
   * If a `SelectRewardPhase` has not occurred, and we do not know if the item is in the Modifier Pool or not, will return `undefined`.
   * @param modifier
   * @returns
   */
  getCheck(modifier: RewardKeys): boolean | undefined {
    return itemPoolChecks.get(modifier);
  }

  /**
   * `expect`s a Modifier `toBeTruthy` (in the Modifier Pool) or `Falsy` (unobtainable on this floor). Use during a test.
   *
   * Note that if a `SelectRewardPhase` has not been run yet, these values will be `undefined`, and the check will fail.
   * @param modifier The modifier to check.
   * @param expectToBePreset Whether the Modifier should be in the Modifier Pool. Set to `false` to expect it to be absent instead.
   * @returns `this`
   */
  testCheck(modifier: RewardKeys, expectToBePreset: boolean): this {
    (expectToBePreset ? expect(itemPoolChecks) : expect(itemPoolChecks).not).toHaveKey(modifier);
    return this;
  }

  /** Removes all modifier checks. @returns `this` */
  clearChecks() {
    itemPoolChecks.clear();
    return this;
  }

  private log(...params: any[]) {
    console.log("Modifiers:", ...params);
  }
}
