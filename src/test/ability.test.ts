import { beforeEach, describe, expect, it } from "vitest";
import {
  Ability,
  BattlerTagImmunityAbAttr,
  IgnoreOpponentEvasionAbAttr,
  StatusEffectImmunityAbAttr,
  SuppressWeatherEffectAbAttr
} from "../data/ability";
import { Abilities } from "../data/enums/abilities";
import { BattlerTagType } from "../data/enums/battler-tag-type";
import { StatusEffect } from "../data/status-effect";

describe("ability", () => {
  let ability: Ability;

  beforeEach(() => {
    ability = new Ability(Abilities.MAGICIAN, 0)
      .attr(SuppressWeatherEffectAbAttr, true)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY);
  });

  it("should contain 3 attributes", () => {
    ability.attrs;
  });

  describe("getAttrs", () => {
    it("should return supress-weather-effect attributes", () => {
      const attributes = ability.getAttrs(SuppressWeatherEffectAbAttr);

      expect(attributes).not.to.be.empty;
    });

    it("should return empty array", () => {
      const attributes = ability.getAttrs(IgnoreOpponentEvasionAbAttr);

      expect(attributes).to.be.empty;
    });
  });

  describe("hasAttr", () => {
    it("should return true on suppress-weather-effect attribute", () => {
      const hasAttribute = ability.hasAttr(SuppressWeatherEffectAbAttr);

      expect(hasAttribute).to.be.true;
    });

    it("should return false on ignore-opponent-evasion atrtribute", () => {
      const hasAttribute = ability.hasAttr(IgnoreOpponentEvasionAbAttr);

      expect(hasAttribute).to.be.false;
    });
  });
});
