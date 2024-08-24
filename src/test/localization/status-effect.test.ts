import { StatusEffect, getStatusEffectActivationText, getStatusEffectDescriptor, getStatusEffectHealText, getStatusEffectObtainText, getStatusEffectOverlapText } from "#app/data/status-effect";
import { mockI18next } from "#test/utils/testUtils";
import i18next from "i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const pokemonName = "PKM";
const sourceText = "SOURCE";

describe("status-effect", () => {
  beforeAll(() => {
    i18next.init();
  });

  describe("NONE", () => {
    const statusEffect = StatusEffect.NONE;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:none.obtain");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).toBe("statusEffect:none.obtain");
    });

    it("should return the source-obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName, sourceText);
      expect(text).toBe("statusEffect:none.obtainSource");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).not.toBe("statusEffect:none.obtainSource");
    });

    it("should return the activation text", () => {
      mockI18next();
      const text = getStatusEffectActivationText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:none.activation");
    });

    it("should return the overlap text", () => {
      mockI18next();
      const text = getStatusEffectOverlapText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:none.overlap");
    });

    it("should return the heal text", () => {
      mockI18next();
      const text = getStatusEffectHealText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:none.heal");
    });

    it("should return the descriptor", () => {
      mockI18next();
      const text = getStatusEffectDescriptor(statusEffect);
      expect(text).toBe("statusEffect:none.description");
    });
  });

  describe("POISON", () => {
    const statusEffect = StatusEffect.POISON;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:poison.obtain");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).toBe("statusEffect:poison.obtain");
    });

    it("should return the activation text", () => {
      mockI18next();
      const text = getStatusEffectActivationText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:poison.activation");
    });

    it("should return the descriptor", () => {
      mockI18next();
      const text = getStatusEffectDescriptor(statusEffect);
      expect(text).toBe("statusEffect:poison.description");
    });

    it("should return the heal text", () => {
      mockI18next();
      const text = getStatusEffectHealText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:poison.heal");
    });

    it("should return the overlap text", () => {
      mockI18next();
      const text = getStatusEffectOverlapText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:poison.overlap");
    });
  });

  describe("TOXIC", () => {
    const statusEffect = StatusEffect.TOXIC;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:toxic.obtain");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).toBe("statusEffect:toxic.obtain");
    });

    it("should return the activation text", () => {
      mockI18next();
      const text = getStatusEffectActivationText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:toxic.activation");
    });

    it("should return the descriptor", () => {
      mockI18next();
      const text = getStatusEffectDescriptor(statusEffect);
      expect(text).toBe("statusEffect:toxic.description");
    });

    it("should return the heal text", () => {
      mockI18next();
      const text = getStatusEffectHealText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:toxic.heal");
    });

    it("should return the overlap text", () => {
      mockI18next();
      const text = getStatusEffectOverlapText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:toxic.overlap");
    });
  });

  describe("PARALYSIS", () => {
    const statusEffect = StatusEffect.PARALYSIS;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:paralysis.obtain");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).toBe("statusEffect:paralysis.obtain");
    });

    it("should return the activation text", () => {
      mockI18next();
      const text = getStatusEffectActivationText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:paralysis.activation");
    });

    it("should return the descriptor", () => {
      mockI18next();
      const text = getStatusEffectDescriptor(statusEffect);
      expect(text).toBe("statusEffect:paralysis.description");
    });

    it("should return the heal text", () => {
      mockI18next();
      const text = getStatusEffectHealText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:paralysis.heal");
    });

    it("should return the overlap text", () => {
      mockI18next();
      const text = getStatusEffectOverlapText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:paralysis.overlap");
    });
  });

  describe("SLEEP", () => {
    const statusEffect = StatusEffect.SLEEP;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:sleep.obtain");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).toBe("statusEffect:sleep.obtain");
    });

    it("should return the activation text", () => {
      mockI18next();
      const text = getStatusEffectActivationText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:sleep.activation");
    });

    it("should return the descriptor", () => {
      mockI18next();
      const text = getStatusEffectDescriptor(statusEffect);
      expect(text).toBe("statusEffect:sleep.description");
    });

    it("should return the heal text", () => {
      mockI18next();
      const text = getStatusEffectHealText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:sleep.heal");
    });

    it("should return the overlap text", () => {
      mockI18next();
      const text = getStatusEffectOverlapText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:sleep.overlap");
    });
  });

  describe("FREEZE", () => {
    const statusEffect = StatusEffect.FREEZE;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:freeze.obtain");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).toBe("statusEffect:freeze.obtain");
    });

    it("should return the activation text", () => {
      mockI18next();
      const text = getStatusEffectActivationText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:freeze.activation");
    });

    it("should return the descriptor", () => {
      mockI18next();
      const text = getStatusEffectDescriptor(statusEffect);
      expect(text).toBe("statusEffect:freeze.description");
    });

    it("should return the heal text", () => {
      mockI18next();
      const text = getStatusEffectHealText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:freeze.heal");
    });

    it("should return the overlap text", () => {
      mockI18next();
      const text = getStatusEffectOverlapText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:freeze.overlap");
    });
  });

  describe("BURN", () => {
    const statusEffect = StatusEffect.BURN;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:burn.obtain");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).toBe("statusEffect:burn.obtain");
    });

    it("should return the activation text", () => {
      mockI18next();
      const text = getStatusEffectActivationText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:burn.activation");
    });

    it("should return the descriptor", () => {
      mockI18next();
      const text = getStatusEffectDescriptor(statusEffect);
      expect(text).toBe("statusEffect:burn.description");
    });

    it("should return the heal text", () => {
      mockI18next();
      const text = getStatusEffectHealText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:burn.heal");
    });

    it("should return the overlap text", () => {
      mockI18next();
      const text = getStatusEffectOverlapText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:burn.overlap");
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });
});
