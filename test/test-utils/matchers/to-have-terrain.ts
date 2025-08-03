/** biome-ignore-start lint/correctness/noUnusedImports: TSDoc imports */
import type { GameManager } from "#test/test-utils/game-manager";
/** biome-ignore-end lint/correctness/noUnusedImports: TSDoc imports */

import { TerrainType } from "#app/data/terrain";
import { getEnumStr } from "#test/test-utils/string-utils";
import { isGameManagerInstance, receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher that checks if the {@linkcode TerrainType} is as expected
 * @param received - The object to check. Should be an instance of {@linkcode GameManager}.
 * @param expectedTerrainType - The expected {@linkcode TerrainType}, or {@linkcode TerrainType.NONE} if no terrain should be active
 * @returns Whether the matcher passed
 */
export function toHaveTerrain(
  this: MatcherState,
  received: unknown,
  expectedTerrainType: TerrainType,
): SyncExpectationResult {
  if (!isGameManagerInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a GameManager, but got ${receivedStr(received)}!`,
    };
  }

  if (!received.scene?.arena) {
    return {
      pass: this.isNot,
      message: () => `Expected GameManager.${received.scene ? "scene.arena" : "scene"} to be defined!`,
    };
  }

  const actual = received.scene.arena.getTerrainType();
  const pass = actual === expectedTerrainType;
  const actualStr = toTerrainStr(actual);
  const expectedStr = toTerrainStr(expectedTerrainType);

  return {
    pass,
    message: () =>
      pass
        ? `Expected the Arena to NOT have ${expectedStr} active, but it did!`
        : `Expected the Arena to have ${expectedStr} active, but got ${actualStr} instead!`,
    expected: expectedTerrainType,
    actual,
  };
}

/**
 * Get a human readable string of the current {@linkcode TerrainType}.
 * @param terrainType - The {@linkcode TerrainType} to transform
 * @returns A human readable string
 */
function toTerrainStr(terrainType: TerrainType) {
  if (terrainType === TerrainType.NONE) {
    return "no terrain";
  }
  // "Electric Terrain (=2)"
  return getEnumStr(TerrainType, terrainType, { casing: "Title", suffix: " Terrain" });
}
