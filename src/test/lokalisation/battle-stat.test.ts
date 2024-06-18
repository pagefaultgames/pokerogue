import {beforeAll, describe, expect, it} from "vitest";
import { getBattleStatName, getBattleStatLevelChangeDescription } from "#app/data/battle-stat.js";
import { BattleStat } from "#app/data/battle-stat.js";
import { pokemonInfo as enPokemonInfo } from "#app/locales/en/pokemon-info.js";
import { battle as enBattleStat } from "#app/locales/en/battle.js";
import { pokemonInfo as dePokemonInfo } from "#app/locales/de/pokemon-info.js";
import { battle as deBattleStat } from "#app/locales/de/battle.js";
import { pokemonInfo as esPokemonInfo } from "#app/locales/es/pokemon-info.js";
import { battle as esBattleStat } from "#app/locales/es/battle.js";
import { pokemonInfo as frPokemonInfo } from "#app/locales/fr/pokemon-info.js";
import { battle as frBattleStat } from "#app/locales/fr/battle.js";
import { pokemonInfo as itPokemonInfo } from "#app/locales/it/pokemon-info.js";
import { battle as itBattleStat } from "#app/locales/it/battle.js";
import { pokemonInfo as koPokemonInfo } from "#app/locales/ko/pokemon-info.js";
import { battle as koBattleStat } from "#app/locales/ko/battle.js";
import { pokemonInfo as ptBrPokemonInfo } from "#app/locales/pt_BR/pokemon-info.js";
import { battle as ptBrBattleStat } from "#app/locales/pt_BR/battle.js";
import { pokemonInfo as zhCnPokemonInfo } from "#app/locales/zh_CN/pokemon-info.js";
import { battle as zhCnBattleStat } from "#app/locales/zh_CN/battle.js";
import { pokemonInfo as zhTwPokemonInfo } from "#app/locales/zh_TW/pokemon-info.js";
import { battle as zhTwBattleStat } from "#app/locales/zh_TW/battle.js";

import i18next, {initI18n} from "#app/plugins/i18n";
import { KoreanPostpositionProcessor } from "i18next-korean-postposition-processor";

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
    initI18n();

    battleStatUnits.push({ stat: BattleStat.ATK, key: "Stat.ATK" });
    battleStatUnits.push({ stat: BattleStat.DEF, key: "Stat.DEF" });
    battleStatUnits.push({ stat: BattleStat.SPATK, key: "Stat.SPATK" });
    battleStatUnits.push({ stat: BattleStat.SPDEF, key: "Stat.SPDEF" });
    battleStatUnits.push({ stat: BattleStat.SPD, key: "Stat.SPD" });
    battleStatUnits.push({ stat: BattleStat.ACC, key: "Stat.ACC" });
    battleStatUnits.push({ stat: BattleStat.EVA, key: "Stat.EVA" });

    battleStatLevelUnits.push({ levels: 1, up: true, key: "statRose" });
    battleStatLevelUnits.push({ levels: 2, up: true, key: "statSharplyRose" });
    battleStatLevelUnits.push({ levels: 3, up: true, key: "statRoseDrastically" });
    battleStatLevelUnits.push({ levels: 4, up: true, key: "statRoseDrastically" });
    battleStatLevelUnits.push({ levels: 5, up: true, key: "statRoseDrastically" });
    battleStatLevelUnits.push({ levels: 6, up: true, key: "statRoseDrastically" });
    battleStatLevelUnits.push({ levels: 7, up: true, key: "statWontGoAnyHigher" });
    battleStatLevelUnits.push({ levels: 1, up: false, key: "statFell" });
    battleStatLevelUnits.push({ levels: 2, up: false, key: "statHarshlyFell" });
    battleStatLevelUnits.push({ levels: 3, up: false, key: "statSeverelyFell" });
    battleStatLevelUnits.push({ levels: 4, up: false, key: "statSeverelyFell" });
    battleStatLevelUnits.push({ levels: 5, up: false, key: "statSeverelyFell" });
    battleStatLevelUnits.push({ levels: 6, up: false, key: "statSeverelyFell" });
    battleStatLevelUnits.push({ levels: 7, up: false, key: "statWontGoAnyLower" });
  });

  it("Test getBattleStatName() in English", async () => {
    i18next.changeLanguage("en");
    battleStatUnits.forEach(unit => {
      testBattleStatName(unit.stat, enPokemonInfo[unit.key.split(".")[0]][unit.key.split(".")[1]]);
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
      testBattleStatName(unit.stat, esPokemonInfo[unit.key.split(".")[0]][unit.key.split(".")[1]]);
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
      testBattleStatName(unit.stat, itPokemonInfo[unit.key.split(".")[0]][unit.key.split(".")[1]]);
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
      testBattleStatName(unit.stat, frPokemonInfo[unit.key.split(".")[0]][unit.key.split(".")[1]]);
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
      testBattleStatName(unit.stat, dePokemonInfo[unit.key.split(".")[0]][unit.key.split(".")[1]]);
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
      testBattleStatName(unit.stat, ptBrPokemonInfo[unit.key.split(".")[0]][unit.key.split(".")[1]]);
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
      testBattleStatName(unit.stat, zhCnPokemonInfo[unit.key.split(".")[0]][unit.key.split(".")[1]]);
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
      testBattleStatName(unit.stat, zhTwPokemonInfo[unit.key.split(".")[0]][unit.key.split(".")[1]]);
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
      testBattleStatName(unit.stat, koPokemonInfo[unit.key.split(".")[0]][unit.key.split(".")[1]]);
    });
  });

  it("Test getBattleStatLevelChangeDescription() in 한국어", async () => {
    i18next.changeLanguage("ko", () => {
      battleStatLevelUnits.forEach(unit => {
        const processor = new KoreanPostpositionProcessor();
        const message = processor.process(koBattleStat[unit.key]);
        testBattleStatLevelChangeDescription(unit.levels, unit.up, message);
      });
    });
  });
});
