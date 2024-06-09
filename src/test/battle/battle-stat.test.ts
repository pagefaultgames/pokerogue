import {beforeAll, describe, expect, it} from "vitest";
import { getBattleStatName, getBattleStatLevelChangeDescription } from "#app/data/battle-stat.js";
import { BattleStat } from "#app/data/battle-stat.js";
import { battleStat as enBattleStat } from "#app/locales/en/battle-stat.js";
import { battleStat as deBattleStat } from "#app/locales/de/battle-stat.js";
import { battleStat as esBattleStat } from "#app/locales/es/battle-stat.js";
import { battleStat as frBattleStat } from "#app/locales/fr/battle-stat.js";
import { battleStat as itBattleStat } from "#app/locales/it/battle-stat.js";
import { battleStat as koBattleStat } from "#app/locales/ko/battle-stat.js";
import { battleStat as ptBrBattleStat } from "#app/locales/pt_BR/battle-stat.js";
import { battleStat as zhCnBattleStat } from "#app/locales/zh_CN/battle-stat.js";
import { battleStat as zhTwBattleStat } from "#app/locales/zh_TW/battle-stat.js";
import i18next, {initI18n} from "#app/plugins/i18n";

interface BattleStatTestUnit {
  stat: BattleStat,
  key: string
}

interface BattleStatLevelTestUnit {
  levels: integer,
  up: boolean,
  key: string
}

function testBattleStatName(stat: BattleStat, expectMessage: string) {
  const message = getBattleStatName(stat);
  console.log(`message ${message}, expected ${expectMessage}`);
  expect(message).toBe(expectMessage);
}

function testBattleStatLevelChangeDescription(levels: integer, up: boolean, expectMessage: string) {
  const message = getBattleStatLevelChangeDescription(levels, up);
  console.log(`message ${message}, expected ${expectMessage}`);
  expect(message).toBe(expectMessage);
}

describe("Test for BattleStat Localization", () => {
  const battleStatUnits: BattleStatTestUnit[] = [];
  const battleStatLevelUnits: BattleStatLevelTestUnit[] = [];

  beforeAll(() => {
    const fontFaceSetMock = {
      add: jest.fn(),
      load: jest.fn().mockResolvedValue([]),
      check: jest.fn().mockReturnValue(true),
      ready: Promise.resolve(),
    };

    const proxyHandler = {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        } else {
          return document.fonts[prop];
        }
      }
    };

    const fontsProxy = new Proxy(fontFaceSetMock, proxyHandler);

    Object.defineProperty(document, "fonts", {
      value: fontsProxy,
      configurable: true,
    });

    initI18n();

    battleStatUnits.push({ stat: BattleStat.ATK, key: "attack" });
    battleStatUnits.push({ stat: BattleStat.DEF, key: "defense" });
    battleStatUnits.push({ stat: BattleStat.SPATK, key: "specialAttack" });
    battleStatUnits.push({ stat: BattleStat.SPDEF, key: "specialDefense" });
    battleStatUnits.push({ stat: BattleStat.SPD, key: "speed" });
    battleStatUnits.push({ stat: BattleStat.ACC, key: "accuracy" });
    battleStatUnits.push({ stat: BattleStat.EVA, key: "evasiveness" });

    battleStatLevelUnits.push({ levels: 1, up: true, key: "rose" });
    battleStatLevelUnits.push({ levels: 2, up: true, key: "sharplyRose" });
    battleStatLevelUnits.push({ levels: 3, up: true, key: "roseDrastically" });
    battleStatLevelUnits.push({ levels: 4, up: true, key: "roseDrastically" });
    battleStatLevelUnits.push({ levels: 5, up: true, key: "roseDrastically" });
    battleStatLevelUnits.push({ levels: 6, up: true, key: "roseDrastically" });
    battleStatLevelUnits.push({ levels: 7, up: true, key: "anyHigher" });
    battleStatLevelUnits.push({ levels: 1, up: false, key: "fell" });
    battleStatLevelUnits.push({ levels: 2, up: false, key: "harshlyFell" });
    battleStatLevelUnits.push({ levels: 3, up: false, key: "severelyFell" });
    battleStatLevelUnits.push({ levels: 4, up: false, key: "severelyFell" });
    battleStatLevelUnits.push({ levels: 5, up: false, key: "severelyFell" });
    battleStatLevelUnits.push({ levels: 6, up: false, key: "severelyFell" });
    battleStatLevelUnits.push({ levels: 7, up: false, key: "anyLower" });
  });

  it("Test getBattleStatName() in English", async () => {
    i18next.changeLanguage("en");
    battleStatUnits.forEach(unit => {
      testBattleStatName(unit.stat, enBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatLevelChangeDescription() in English", async () => {
    i18next.changeLanguage("en");
    battleStatLevelUnits.forEach(unit => {
      testBattleStatLevelChangeDescription(unit.levels, unit.up, enBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatName() in Español", async () => {
    i18next.changeLanguage("es");
    battleStatUnits.forEach(unit => {
      testBattleStatName(unit.stat, esBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatLevelChangeDescription() in Español", async () => {
    i18next.changeLanguage("es");
    battleStatLevelUnits.forEach(unit => {
      testBattleStatLevelChangeDescription(unit.levels, unit.up, esBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatName() in Italiano", async () => {
    i18next.changeLanguage("it");
    battleStatUnits.forEach(unit => {
      testBattleStatName(unit.stat, itBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatLevelChangeDescription() in Italiano", async () => {
    i18next.changeLanguage("it");
    battleStatLevelUnits.forEach(unit => {
      testBattleStatLevelChangeDescription(unit.levels, unit.up, itBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatName() in Français", async () => {
    i18next.changeLanguage("fr");
    battleStatUnits.forEach(unit => {
      testBattleStatName(unit.stat, frBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatLevelChangeDescription() in Français", async () => {
    i18next.changeLanguage("fr");
    battleStatLevelUnits.forEach(unit => {
      testBattleStatLevelChangeDescription(unit.levels, unit.up, frBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatName() in Deutsch", async () => {
    i18next.changeLanguage("de");
    battleStatUnits.forEach(unit => {
      testBattleStatName(unit.stat, deBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatLevelChangeDescription() in Deutsch", async () => {
    i18next.changeLanguage("de");
    battleStatLevelUnits.forEach(unit => {
      testBattleStatLevelChangeDescription(unit.levels, unit.up, deBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatName() in Português (BR)", async () => {
    i18next.changeLanguage("pt-BR");
    battleStatUnits.forEach(unit => {
      testBattleStatName(unit.stat, ptBrBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatLevelChangeDescription() in Português (BR)", async () => {
    i18next.changeLanguage("pt-BR");
    battleStatLevelUnits.forEach(unit => {
      testBattleStatLevelChangeDescription(unit.levels, unit.up, ptBrBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatName() in 简体中文", async () => {
    i18next.changeLanguage("zh-CN");
    battleStatUnits.forEach(unit => {
      testBattleStatName(unit.stat, zhCnBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatLevelChangeDescription() in 简体中文", async () => {
    i18next.changeLanguage("zh-CN");
    battleStatLevelUnits.forEach(unit => {
      testBattleStatLevelChangeDescription(unit.levels, unit.up, zhCnBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatName() in 繁體中文", async () => {
    i18next.changeLanguage("zh-TW");
    battleStatUnits.forEach(unit => {
      testBattleStatName(unit.stat, zhTwBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatLevelChangeDescription() in 繁體中文", async () => {
    i18next.changeLanguage("zh-TW");
    battleStatLevelUnits.forEach(unit => {
      testBattleStatLevelChangeDescription(unit.levels, unit.up, zhTwBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatName() in 한국어", async () => {
    await i18next.changeLanguage("ko");
    battleStatUnits.forEach(unit => {
      testBattleStatName(unit.stat, koBattleStat[unit.key]);
    });
  });

  it("Test getBattleStatLevelChangeDescription() in 한국어", async () => {
    i18next.changeLanguage("ko", () => {
      battleStatLevelUnits.forEach(unit => {
        testBattleStatLevelChangeDescription(unit.levels, unit.up, koBattleStat[unit.key]);
      });
    });
  });
});
