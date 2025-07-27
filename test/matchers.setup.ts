import { toEqualArrayUnsorted } from "#test/test-utils/matchers/to-equal-array-unsorted";
import { toHaveAbilityAppliedMatcher } from "#test/test-utils/matchers/to-have-ability-applied";
import { toHaveBattlerTag } from "#test/test-utils/matchers/to-have-battler-tag";
import { toHaveEffectiveStatMatcher } from "#test/test-utils/matchers/to-have-effective-stat";
import { toHaveFaintedMatcher } from "#test/test-utils/matchers/to-have-fainted";
import { toHaveFullHpMatcher } from "#test/test-utils/matchers/to-have-full-hp";
import { toHaveHpMatcher } from "#test/test-utils/matchers/to-have-hp";
import { toHaveStatStageMatcher } from "#test/test-utils/matchers/to-have-stat-stage-matcher";
import { toHaveStatusEffectMatcher } from "#test/test-utils/matchers/to-have-status-effect-matcher";
import { toHaveTakenDamageMatcher } from "#test/test-utils/matchers/to-have-taken-damage-matcher";
import { toHaveTerrainMatcher } from "#test/test-utils/matchers/to-have-terrain-matcher";
import { toHaveTypes } from "#test/test-utils/matchers/to-have-types";
import { toHaveUsedMoveMatcher } from "#test/test-utils/matchers/to-have-used-move-matcher";
import { toHaveWeatherMatcher } from "#test/test-utils/matchers/to-have-weather-matcher";
import { expect } from "vitest";

/*
 * Setup file for custom matchers.
 * Make sure to define the call signatures in `test/@types/vitest.d.ts` too!
 */

expect.extend({
  toEqualArrayUnsorted,
  toHaveTypes,
  toHaveUsedMove: toHaveUsedMoveMatcher,
  toHaveEffectiveStat: toHaveEffectiveStatMatcher,
  toHaveTakenDamage: toHaveTakenDamageMatcher,
  toHaveWeather: toHaveWeatherMatcher,
  toHaveTerrain: toHaveTerrainMatcher,
  toHaveFullHp: toHaveFullHpMatcher,
  toHaveStatusEffect: toHaveStatusEffectMatcher,
  toHaveStatStage: toHaveStatStageMatcher,
  toHaveBattlerTag: toHaveBattlerTag,
  toHaveAbilityApplied: toHaveAbilityAppliedMatcher,
  toHaveHp: toHaveHpMatcher,
  toHaveFainted: toHaveFaintedMatcher,
});
