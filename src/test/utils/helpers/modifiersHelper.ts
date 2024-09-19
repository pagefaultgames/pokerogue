import { expect } from "vitest";
import { GameManagerHelper } from "./gameManagerHelper";
import { itemPoolChecks, ModifierTypeKeys } from "#app/modifier/modifier-type";

export class ModifierHelper extends GameManagerHelper {
  /**
   * Adds a Modifier to the list of modifiers to check for.
   *
   * Note that all modifiers are updated during the start of `SelectModifierPhase`.
   * @param modifier The Modifier to add.
   */
  addCheck(modifier: ModifierTypeKeys) {
    itemPoolChecks.set(modifier, undefined);
  }

  checkHasRun(modifier: ModifierTypeKeys): boolean {
    if (itemPoolChecks.get(modifier) === undefined) {
      return false;
    }
    return true;
  }

  /**
   * `get`s a value from the `itemPoolChecks` map.
   *
   * If the item is in the Modifier Pool, and the player can get it, will return `true`.
   *
   * If the item is *not* in the Modifier Pool, will return `false`.
   *
   * If a `SelectModifierPhase` has not occurred, and we do not know if the item is in the Modifier Pool or not, will return `undefined`.
   * @param modifier
   * @returns
   */
  getCheck(modifier: ModifierTypeKeys): boolean | undefined {
    return itemPoolChecks.get(modifier);
  }

  /**
   * `expect`s a Modifier `toBeTruthy` (in the Modifier Pool) or `Falsy` (unobtainable on this floor). Use during a test.
   *
   * Note that if a `SelectModifierPhase` has not been run yet, these values will be `undefined`, and the check will fail.
   * @param modifier The modifier to check.
   * @param expectToBePreset Whether the Modifier should be in the Modifier Pool. Set to `false` to expect it to be absent instead.
   * @returns `this`
   */
  testCheck(modifier: ModifierTypeKeys, expectToBePreset: boolean): this {
    if (expectToBePreset) {
      expect(itemPoolChecks.get(modifier)).toBeTruthy();
    }
    expect(itemPoolChecks.get(modifier)).toBeFalsy();
    return this;
  }

  /** Removes all modifier checks. */
  clearChecks() {
    itemPoolChecks.clear();
  }

  private log(...params: any[]) {
    console.log("Modifiers:", ...params);
  }
}
