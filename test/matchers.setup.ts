import { toEqualArrayUnsorted } from "#test/test-utils/matchers/to-equal-array-unsorted";
import { toHaveAbilityApplied } from "#test/test-utils/matchers/to-have-ability-applied";
import { toHaveBattlerTag } from "#test/test-utils/matchers/to-have-battler-tag";
import { toHaveEffectiveStat } from "#test/test-utils/matchers/to-have-effective-stat";
import { toHaveFainted } from "#test/test-utils/matchers/to-have-fainted";
import { toHaveFullHp } from "#test/test-utils/matchers/to-have-full-hp";
import { toHaveHp } from "#test/test-utils/matchers/to-have-hp";
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
  toHaveTypes,
  toHaveUsedMove,
  toHaveEffectiveStat,
  toHaveTakenDamage,
  toHaveWeather,
  toHaveTerrain,
  toHaveFullHp,
  toHaveStatusEffect,
  toHaveStatStage,
  toHaveBattlerTag,
  toHaveAbilityApplied,
  toHaveHp,
  toHaveFainted,
  toHaveUsedPP,
});
