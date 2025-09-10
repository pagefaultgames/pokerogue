/** biome-ignore-start lint/correctness/noUnusedImports: TSDoc imports */
import type { Phase } from "#app/phase";
import type { GameManager } from "#test/test-utils/game-manager";
// biome-ignore-end lint/correctness/noUnusedImports: TSDoc

import { isGameManagerInstance, receivedStr } from "#test/test-utils/test-utils";
import type { PhaseString } from "#types/phase-types";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher that checks if the current {@linkcode Phase} is of the given type.
 * @param received - The object to check. Should be the current {@linkcode GameManager}
 * @param expectedPhase - The expected {@linkcode PhaseString}
 * @returns The result of the matching
 */
export function toBeAtPhase(this: MatcherState, received: unknown, expectedPhase: PhaseString): SyncExpectationResult {
  if (!isGameManagerInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a GameManager, but got ${receivedStr(received)}!`,
    };
  }

  if (!received.scene?.phaseManager) {
    return {
      pass: this.isNot,
      message: () => `Expected GameManager.${received.scene ? "scene.phaseManager" : "scene"} to be defined!`,
    };
  }

  const currPhase = received.scene.phaseManager.getCurrentPhase();
  const pass = currPhase.is(expectedPhase);

  const actual = currPhase.phaseName;

  return {
    pass,
    message: () =>
      pass
        ? `Expected the current phase to NOT be ${expectedPhase}, but it was!`
        : `Expected the current phase to be ${expectedPhase}, but got ${actual} instead!`,
    expected: expectedPhase,
    actual,
  };
}
