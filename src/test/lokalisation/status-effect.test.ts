import { beforeAll, describe, expect, it } from "vitest";
import { StatusEffect } from "#app/data/status-effect";
import { getStatusEffectObtainText, getStatusEffectActivationText, getStatusEffectOverlapText, getStatusEffectHealText, getStatusEffectDescriptor } from "#app/data/status-effect";
import { statusEffect as enStatusEffect } from "#app/locales/en/status-effect.js";
import { statusEffect as deStatusEffect } from "#app/locales/de/status-effect.js";
import { statusEffect as esStatusEffect } from "#app/locales/es/status-effect.js";
import { statusEffect as frStatusEffect } from "#app/locales/fr/status-effect.js";
import { statusEffect as itStatusEffect } from "#app/locales/it/status-effect.js";
import { statusEffect as koStatusEffect } from "#app/locales/ko/status-effect.js";
import { statusEffect as ptBrStatusEffect } from "#app/locales/pt_BR/status-effect.js";
import { statusEffect as zhCnStatusEffect } from "#app/locales/zh_CN/status-effect.js";
import { statusEffect as zhTwStatusEffect } from "#app/locales/zh_TW/status-effect.js";

import i18next, {initI18n} from "#app/plugins/i18n";
import { KoreanPostpositionProcessor } from "i18next-korean-postposition-processor";


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

  it("Test getStatusEffectMessages in English", async () => {
    i18next.changeLanguage("en");
    statusEffectUnits.forEach(unit => {
      testStatusEffectObtainText(unit.stat, enStatusEffect[unit.key].obtain);
      testStatusEffectObtainTextWithSource(unit.stat, enStatusEffect[unit.key].obtainSource);
      testStatusEffectActivationText(unit.stat, enStatusEffect[unit.key].activation);
      testStatusEffectOverlapText(unit.stat, enStatusEffect[unit.key].overlap);
      testStatusEffectHealText(unit.stat, enStatusEffect[unit.key].heal);
      testStatusEffectDescriptor(unit.stat, enStatusEffect[unit.key].description);
    });
  });

  it("Test getStatusEffectMessages in Español", async () => {
    i18next.changeLanguage("es");
    statusEffectUnits.forEach(unit => {
      testStatusEffectObtainText(unit.stat, esStatusEffect[unit.key].obtain);
      testStatusEffectObtainTextWithSource(unit.stat, esStatusEffect[unit.key].obtainSource);
      testStatusEffectActivationText(unit.stat, esStatusEffect[unit.key].activation);
      testStatusEffectOverlapText(unit.stat, esStatusEffect[unit.key].overlap);
      testStatusEffectHealText(unit.stat, esStatusEffect[unit.key].heal);
      testStatusEffectDescriptor(unit.stat, esStatusEffect[unit.key].description);
    });
  });

  it("Test getStatusEffectMessages in Italiano", async () => {
    i18next.changeLanguage("it");
    statusEffectUnits.forEach(unit => {
      testStatusEffectObtainText(unit.stat, itStatusEffect[unit.key].obtain);
      testStatusEffectObtainTextWithSource(unit.stat, itStatusEffect[unit.key].obtainSource);
      testStatusEffectActivationText(unit.stat, itStatusEffect[unit.key].activation);
      testStatusEffectOverlapText(unit.stat, itStatusEffect[unit.key].overlap);
      testStatusEffectHealText(unit.stat, itStatusEffect[unit.key].heal);
      testStatusEffectDescriptor(unit.stat, itStatusEffect[unit.key].description);
    });
  });

  it("Test getStatusEffectMessages in Français", async () => {
    i18next.changeLanguage("fr");
    statusEffectUnits.forEach(unit => {
      testStatusEffectObtainText(unit.stat, frStatusEffect[unit.key].obtain);
      testStatusEffectObtainTextWithSource(unit.stat, frStatusEffect[unit.key].obtainSource);
      testStatusEffectActivationText(unit.stat, frStatusEffect[unit.key].activation);
      testStatusEffectOverlapText(unit.stat, frStatusEffect[unit.key].overlap);
      testStatusEffectHealText(unit.stat, frStatusEffect[unit.key].heal);
      testStatusEffectDescriptor(unit.stat, frStatusEffect[unit.key].description);
    });
  });

  it("Test getStatusEffectMessages in Deutsch", async () => {
    i18next.changeLanguage("de");
    statusEffectUnits.forEach(unit => {
      testStatusEffectObtainText(unit.stat, deStatusEffect[unit.key].obtain);
      testStatusEffectObtainTextWithSource(unit.stat, deStatusEffect[unit.key].obtainSource);
      testStatusEffectActivationText(unit.stat, deStatusEffect[unit.key].activation);
      testStatusEffectOverlapText(unit.stat, deStatusEffect[unit.key].overlap);
      testStatusEffectHealText(unit.stat, deStatusEffect[unit.key].heal);
      testStatusEffectDescriptor(unit.stat, deStatusEffect[unit.key].description);
    });
  });

  it("Test getStatusEffectMessages in Português (BR)", async () => {
    i18next.changeLanguage("pt-BR");
    statusEffectUnits.forEach(unit => {
      testStatusEffectObtainText(unit.stat, ptBrStatusEffect[unit.key].obtain);
      testStatusEffectObtainTextWithSource(unit.stat, ptBrStatusEffect[unit.key].obtainSource);
      testStatusEffectActivationText(unit.stat, ptBrStatusEffect[unit.key].activation);
      testStatusEffectOverlapText(unit.stat, ptBrStatusEffect[unit.key].overlap);
      testStatusEffectHealText(unit.stat, ptBrStatusEffect[unit.key].heal);
      testStatusEffectDescriptor(unit.stat, ptBrStatusEffect[unit.key].description);
    });
  });

  it("Test getStatusEffectMessages in 简体中文", async () => {
    i18next.changeLanguage("zh-CN");
    statusEffectUnits.forEach(unit => {
      testStatusEffectObtainText(unit.stat, zhCnStatusEffect[unit.key].obtain);
      testStatusEffectObtainTextWithSource(unit.stat, zhCnStatusEffect[unit.key].obtainSource);
      testStatusEffectActivationText(unit.stat, zhCnStatusEffect[unit.key].activation);
      testStatusEffectOverlapText(unit.stat, zhCnStatusEffect[unit.key].overlap);
      testStatusEffectHealText(unit.stat, zhCnStatusEffect[unit.key].heal);
      testStatusEffectDescriptor(unit.stat, zhCnStatusEffect[unit.key].description);
    });
  });

  it("Test getStatusEffectMessages in 繁體中文", async () => {
    i18next.changeLanguage("zh-TW");
    statusEffectUnits.forEach(unit => {
      testStatusEffectObtainText(unit.stat, zhTwStatusEffect[unit.key].obtain);
      testStatusEffectObtainTextWithSource(unit.stat, zhTwStatusEffect[unit.key].obtainSource);
      testStatusEffectActivationText(unit.stat, zhTwStatusEffect[unit.key].activation);
      testStatusEffectOverlapText(unit.stat, zhTwStatusEffect[unit.key].overlap);
      testStatusEffectHealText(unit.stat, zhTwStatusEffect[unit.key].heal);
      testStatusEffectDescriptor(unit.stat, zhTwStatusEffect[unit.key].description);
    });
  });

  it("Test getStatusEffectMessages in 한국어", async () => {
    await i18next.changeLanguage("ko");
    statusEffectUnits.forEach(unit => {
      const processor = new KoreanPostpositionProcessor();
      testStatusEffectObtainText(unit.stat, processor.process(koStatusEffect[unit.key].obtain));
      testStatusEffectObtainTextWithSource(unit.stat, processor.process(koStatusEffect[unit.key].obtainSource));
      testStatusEffectActivationText(unit.stat, processor.process(koStatusEffect[unit.key].activation));
      testStatusEffectOverlapText(unit.stat, processor.process(koStatusEffect[unit.key].overlap));
      testStatusEffectHealText(unit.stat, processor.process(koStatusEffect[unit.key].heal));
      testStatusEffectDescriptor(unit.stat, processor.process(koStatusEffect[unit.key].description));
    });
  });
});
