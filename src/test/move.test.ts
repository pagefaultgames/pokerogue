import { beforeEach, describe, expect, it } from "vitest";
import { Moves } from "../data/enums/moves";
import Move, {
  FlinchAttr,
  MoveTarget,
  PlantHealAttr,
  StatusMove,
  WeatherChangeAttr,
} from "../data/move";
import { Type } from "../data/type";
import { WeatherType } from "../data/weather";

describe("move", () => {
  let move: Move;

  beforeEach(() => {
    move = new StatusMove(Moves.RAIN_DANCE, Type.WATER, -1, 5, -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.RAIN)
      .attr(PlantHealAttr)
      .target(MoveTarget.BOTH_SIDES);
  });

  it("should contain 3 attributes", () => {
    move.attrs;
  });

  describe("getAttrs", () => {
    it("should return weather-change-effect attributes", () => {
      const attributes = move.getAttrs(WeatherChangeAttr);

      expect(attributes).not.to.be.empty;
    });

    it("should return empty array", () => {
      const attributes = move.getAttrs(FlinchAttr);

      expect(attributes).to.be.empty;
    });
  });

  describe("hasAttr", () => {
    it("should return true on suppress-weather-effect attribute", () => {
      const hasAttribute = move.hasAttr(WeatherChangeAttr);

      expect(hasAttribute).to.be.true;
    });

    it("should return false on ignore-opponent-evasion atrtribute", () => {
      const hasAttribute = move.hasAttr(FlinchAttr);

      expect(hasAttribute).to.be.false;
    });
  });
});
