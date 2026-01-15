import { __TEST_allStarterCandyCosts } from "#balance/starters";
import { describe, expect, it } from "vitest";

describe("Starter Candy Costs", () => {
  it("should have the proper length of arrays in `allStarterCandyCosts`", () => {
    for (const starterCandyCosts of __TEST_allStarterCandyCosts) {
      expect(starterCandyCosts.eggCosts).toHaveLength(starterCandyCosts.eggCostReductionThresholds.length + 1);
    }
  });
});
