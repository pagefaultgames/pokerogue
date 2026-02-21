/**
 * Setup file for custom matchers.
 * Make sure to define the call signatures in `#test/@types/vitest.d.ts` too!
 * @module
 */

import { toBeAtPhase } from "#test/utils/matchers/to-be-at-phase";
import { toEqualUnsorted } from "#test/utils/matchers/to-equal-unsorted";
import { toHaveAbilityApplied } from "#test/utils/matchers/to-have-ability-applied";
import { toHaveArenaTag } from "#test/utils/matchers/to-have-arena-tag";
import { toHaveBattlerTag } from "#test/utils/matchers/to-have-battler-tag";
import { toHaveEffectiveStat } from "#test/utils/matchers/to-have-effective-stat";
import { toHaveFainted } from "#test/utils/matchers/to-have-fainted";
import { toHaveFullHp } from "#test/utils/matchers/to-have-full-hp";
import { toHaveHp } from "#test/utils/matchers/to-have-hp";
import { toHaveKey } from "#test/utils/matchers/to-have-key";
import { toHavePositionalTag } from "#test/utils/matchers/to-have-positional-tag";
import { toHaveShownMessage } from "#test/utils/matchers/to-have-shown-message";
import { toHaveStatStage } from "#test/utils/matchers/to-have-stat-stage";
import { toHaveStatusEffect } from "#test/utils/matchers/to-have-status-effect";
import { toHaveTakenDamage } from "#test/utils/matchers/to-have-taken-damage";
import { toHaveTerrain } from "#test/utils/matchers/to-have-terrain";
import { toHaveTypes } from "#test/utils/matchers/to-have-types";
import { toHaveUsedMove } from "#test/utils/matchers/to-have-used-move";
import { toHaveUsedPP } from "#test/utils/matchers/to-have-used-pp";
import { toHaveWeather } from "#test/utils/matchers/to-have-weather";
import { expect } from "vitest";

expect.extend({
  toEqualUnsorted,
  toHaveKey,
  toHaveShownMessage,
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
