import { beforeAll, describe, expect, it } from "vitest";
import {getStatusEffectMessageKey, StatusEffect} from "#app/data/status-effect";
import { getStatusEffectObtainText, getStatusEffectActivationText, getStatusEffectOverlapText, getStatusEffectHealText, getStatusEffectDescriptor } from "#app/data/status-effect";
import { statusEffect as enStatusEffect } from "#app/locales/en/status-effect.js";

import i18next, {initI18n} from "#app/plugins/i18n";


interface StatusEffectTestUnit {
  stat: StatusEffect,
  key: string
}

const testPokemonNameWithoutBinding = "{{pokemonNameWithAffix}}";
const testSourceTextWithoutBinding = "{{sourceText}}";

function testStatusEffectObtainText(stat: StatusEffect, expectMessage: string) {
  const message = getStatusEffectObtainText(stat, testPokemonNameWithoutBinding);
  console.log(`message ${message}, expected ${expectMessage}`);
  expect(message).toBe(expectMessage);
}

function testStatusEffectObtainTextWithSource(stat: StatusEffect, expectMessage: string) {
  const message = getStatusEffectObtainText(stat, testPokemonNameWithoutBinding, testSourceTextWithoutBinding);
  console.log(`message ${message}, expected ${expectMessage}`);
  expect(message).toBe(expectMessage);
}

function testStatusEffectActivationText(stat: StatusEffect, expectMessage: string) {
  const message = getStatusEffectActivationText(stat, testPokemonNameWithoutBinding);
  console.log(`message ${message}, expected ${expectMessage}`);
  expect(message).toBe(expectMessage);
}

function testStatusEffectOverlapText(stat: StatusEffect, expectMessage: string) {
  const message = getStatusEffectOverlapText(stat, testPokemonNameWithoutBinding);
  console.log(`message ${message}, expected ${expectMessage}`);
  expect(message).toBe(expectMessage);
}

function testStatusEffectHealText(stat: StatusEffect, expectMessage: string) {
  const message = getStatusEffectHealText(stat, testPokemonNameWithoutBinding);
  console.log(`message ${message}, expected ${expectMessage}`);
  expect(message).toBe(expectMessage);
}

function testStatusEffectDescriptor(stat: StatusEffect, expectMessage: string) {
  const message = getStatusEffectDescriptor(stat);
  console.log(`message ${message}, expected ${expectMessage}`);
  expect(message).toBe(expectMessage);
}

describe("Test for StatusEffect Localization", () => {
  const statusEffectUnits: StatusEffectTestUnit[] = [];

  beforeAll(() => {
    initI18n();

    statusEffectUnits.push({ stat: StatusEffect.NONE, key: "none" });
    statusEffectUnits.push({ stat: StatusEffect.POISON, key: "poison" });
    statusEffectUnits.push({ stat: StatusEffect.TOXIC, key: "toxic" });
    statusEffectUnits.push({ stat: StatusEffect.PARALYSIS, key: "paralysis" });
    statusEffectUnits.push({ stat: StatusEffect.SLEEP, key: "sleep" });
    statusEffectUnits.push({ stat: StatusEffect.FREEZE, key: "freeze" });
    statusEffectUnits.push({ stat: StatusEffect.BURN, key: "burn" });
  });

  it("Test i18n message key", async () => {
    statusEffectUnits.forEach(unit => {
      const text = getStatusEffectMessageKey(unit.stat);
      const toBe = `statusEffect:${unit.key}`;
      console.log(`message ${text}, expected ${toBe}`);
      expect(text).toBe(toBe);
    });
  });

  it("Test getStatusEffectMessages in English", async () => {
    await i18next.changeLanguage("en");
    statusEffectUnits.forEach(unit => {
      testStatusEffectObtainText(unit.stat, enStatusEffect[unit.key].obtain);
      testStatusEffectObtainTextWithSource(unit.stat, enStatusEffect[unit.key].obtainSource);
      testStatusEffectActivationText(unit.stat, enStatusEffect[unit.key].activation);
      testStatusEffectOverlapText(unit.stat, enStatusEffect[unit.key].overlap);
      testStatusEffectHealText(unit.stat, enStatusEffect[unit.key].heal);
      testStatusEffectDescriptor(unit.stat, enStatusEffect[unit.key].description);
    });
  });
});
