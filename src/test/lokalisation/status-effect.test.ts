import { beforeAll, describe, expect, it, vi } from "vitest";
import {getStatusEffectMessageKey, StatusEffect} from "#app/data/status-effect";
import { getStatusEffectObtainText, getStatusEffectActivationText, getStatusEffectOverlapText, getStatusEffectHealText, getStatusEffectDescriptor } from "#app/data/status-effect";

import i18next, {initI18n} from "#app/plugins/i18n";
import { ParseKeys } from "i18next";

interface StatusEffectTestUnit {
  stat: StatusEffect,
  key: string
}

const testPokemonNameWithoutBinding = "{{pokemonNameWithAffix}}";
const testSourceTextWithoutBinding = "{{sourceText}}";

function testStatusEffectObtainText(stat: StatusEffect, expectKey: ParseKeys) {
  const i18nextSpy = vi.spyOn(i18next, "t");
  const message = getStatusEffectObtainText(stat, testPokemonNameWithoutBinding);
  console.log(`expectKey ${expectKey}, message ${message}`);
  expect(i18nextSpy).toHaveBeenCalledWith(expectKey, { pokemonNameWithAffix: testPokemonNameWithoutBinding });
}

function testStatusEffectObtainTextWithSource(stat: StatusEffect, expectKey: ParseKeys) {
  const i18nextSpy = vi.spyOn(i18next, "t");
  const message = getStatusEffectObtainText(stat, testPokemonNameWithoutBinding, testSourceTextWithoutBinding);
  console.log(`expectKey ${expectKey}, message ${message}`);
  expect(i18nextSpy).toHaveBeenCalledWith(expectKey, { pokemonNameWithAffix: testPokemonNameWithoutBinding, sourceText: testSourceTextWithoutBinding });
}

function testStatusEffectActivationText(stat: StatusEffect, expectKey: ParseKeys) {
  const i18nextSpy = vi.spyOn(i18next, "t");
  const message = getStatusEffectActivationText(stat, testPokemonNameWithoutBinding);
  console.log(`expectKey ${expectKey}, message ${message}`);
  expect(i18nextSpy).toHaveBeenCalledWith(expectKey, { pokemonNameWithAffix: testPokemonNameWithoutBinding });
}

function testStatusEffectOverlapText(stat: StatusEffect, expectKey: ParseKeys) {
  const i18nextSpy = vi.spyOn(i18next, "t");
  const message = getStatusEffectOverlapText(stat, testPokemonNameWithoutBinding);
  console.log(`expectKey ${expectKey}, message ${message}`);
  expect(i18nextSpy).toHaveBeenCalledWith(expectKey, { pokemonNameWithAffix: testPokemonNameWithoutBinding });
}

function testStatusEffectHealText(stat: StatusEffect, expectKey: ParseKeys) {
  const i18nextSpy = vi.spyOn(i18next, "t");
  const message = getStatusEffectHealText(stat, testPokemonNameWithoutBinding);
  console.log(`expectKey ${expectKey}, message ${message}`);
  expect(i18nextSpy).toHaveBeenCalledWith(expectKey, { pokemonNameWithAffix: testPokemonNameWithoutBinding });
}

function testStatusEffectDescriptor(stat: StatusEffect, expectKey: ParseKeys) {
  const i18nextSpy = vi.spyOn(i18next, "t");
  const message = getStatusEffectDescriptor(stat);
  console.log(`expectKey ${expectKey}, message ${message}`);
  expect(i18nextSpy).toHaveBeenCalledWith(expectKey);
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

  it("Test getStatusEffectMessages", async () => {
    statusEffectUnits.forEach(unit => {
      testStatusEffectObtainText(unit.stat, `statusEffect:${unit.key}.obtain` as ParseKeys);
      testStatusEffectObtainTextWithSource(unit.stat, `statusEffect:${unit.key}.obtainSource` as ParseKeys);
      testStatusEffectActivationText(unit.stat, `statusEffect:${unit.key}.activation` as ParseKeys);
      testStatusEffectOverlapText(unit.stat, `statusEffect:${unit.key}.overlap` as ParseKeys);
      testStatusEffectHealText(unit.stat, `statusEffect:${unit.key}.heal` as ParseKeys);
      testStatusEffectDescriptor(unit.stat, `statusEffect:${unit.key}.description` as ParseKeys);
    });
  });
});
