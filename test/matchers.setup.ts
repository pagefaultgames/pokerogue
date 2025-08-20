import { toBeAtPhase } from "#test/test-utils/matchers/to-be-at-phase";
import { toEqualArrayUnsorted } from "#test/test-utils/matchers/to-equal-array-unsorted";
import { toHaveAbilityApplied } from "#test/test-utils/matchers/to-have-ability-applied";
import { toHaveArenaTag } from "#test/test-utils/matchers/to-have-arena-tag";
import { toHaveBattlerTag } from "#test/test-utils/matchers/to-have-battler-tag";
import { toHaveEffectiveStat } from "#test/test-utils/matchers/to-have-effective-stat";
import { toHaveFainted } from "#test/test-utils/matchers/to-have-fainted";
import { toHaveFullHp } from "#test/test-utils/matchers/to-have-full-hp";
import { toHaveHp } from "#test/test-utils/matchers/to-have-hp";
import { toHavePositionalTag } from "#test/test-utils/matchers/to-have-positional-tag";
import { toHaveStatStage } from "#test/test-utils/matchers/to-have-stat-stage";
import { toHaveStatusEffect } from "#test/test-utils/matchers/to-have-status-effect";
import { toHaveTakenDamage } from "#test/test-utils/matchers/to-have-taken-damage";
import { toHaveTerrain } from "#test/test-utils/matchers/to-have-terrain";
import { toHaveTypes } from "#test/test-utils/matchers/to-have-types";
import { toHaveUsedMove } from "#test/test-utils/matchers/to-have-used-move";
import { toHaveUsedPP } from "#test/test-utils/matchers/to-have-used-pp";
import { toHaveWeather } from "#test/test-utils/matchers/to-have-weather";
import { expect } from "vitest";

/*
 * Setup file for custom matchers.
 * Make sure to define the call signatures in `test/@types/vitest.d.ts` too!
 */

expect.extend({
  toEqualArrayUnsorted,
  toBeAtPhase,
  toHaveWeather,
  toHaveTerrain,
  toHaveArenaTag,
  toHavePositionalTag,
  toHaveTypes,
  toHaveUsedMove,
  toHaveEffectiveStat,
  toHaveStatusEffect,
  toHaveStatStage,
  toHaveBattlerTag,
  toHaveAbilityApplied,
  toHaveHp,
  toHaveTakenDamage,
  toHaveFullHp,
  toHaveFainted,
  toHaveUsedPP,
});
