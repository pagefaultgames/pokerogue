import {
  getStatusEffectActivationText,
  getStatusEffectDescriptor,
  getStatusEffectHealText,
  getStatusEffectObtainText,
  getStatusEffectOverlapText,
} from "#data/status-effect";
import { StatusEffect } from "#enums/status-effect";
import { mockI18next } from "#test/utils/test-utils";
import { beforeEach, describe, expect, it } from "vitest";

describe("Status Effect Messages", () => {
  beforeEach(() => {
    mockI18next();
  });

  describe.each<{ readonly statusEffect: StatusEffect; readonly effectName: string }>([
    { statusEffect: StatusEffect.NONE, effectName: "None" },
    { statusEffect: StatusEffect.POISON, effectName: "Poison" },
    { statusEffect: StatusEffect.TOXIC, effectName: "Toxic" },
    { statusEffect: StatusEffect.PARALYSIS, effectName: "Paralysis" },
    { statusEffect: StatusEffect.SLEEP, effectName: "Sleep" },
    { statusEffect: StatusEffect.FREEZE, effectName: "Freeze" },
    { statusEffect: StatusEffect.BURN, effectName: "Burn" },
  ])("$effectName", ({ statusEffect, effectName }) => {
    function getEffectKey(effect: StatusEffect, keyType: string) {
      if (effect === StatusEffect.NONE) {
        return "";
      }
      return `statusEffect:${effectName.toLowerCase()}.${keyType}`;
    }

    it("should return the obtain text", () => {
      const text = getStatusEffectObtainText(statusEffect, "pokemon_name");
      expect(text).toBe(getEffectKey(statusEffect, "obtain"));

      const emptySourceText = getStatusEffectObtainText(statusEffect, "pokemon_name", "");
      expect(emptySourceText).toBe(getEffectKey(statusEffect, "obtain"));

      const withSource = getStatusEffectObtainText(statusEffect, "pokemon_name", "source_text");
      expect(withSource).toBe(getEffectKey(statusEffect, "obtainSource"));
    });

    it("should return the activation text", () => {
      const text = getStatusEffectActivationText(statusEffect, "pokemon_name");
      expect(text).toBe(getEffectKey(statusEffect, "activation"));
    });

    it("should return the descriptor", () => {
      const text = getStatusEffectDescriptor(statusEffect);
      expect(text).toBe(getEffectKey(statusEffect, "description"));
    });

    it("should return the heal text", () => {
      const text = getStatusEffectHealText(statusEffect, "pokemon_name");
      expect(text).toBe(getEffectKey(statusEffect, "heal"));
    });

    it("should return the overlap text", () => {
      const text = getStatusEffectOverlapText(statusEffect, "pokemon_name");
      expect(text).toBe(getEffectKey(statusEffect, "overlap"));
    });
  });
});
