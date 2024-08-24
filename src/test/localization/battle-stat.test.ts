import { BattleStat, getBattleStatLevelChangeDescription, getBattleStatName } from "#app/data/battle-stat";
import deBattleStat from "#app/locales/de/battle.json";
import dePokemonInfo  from "#app/locales/de/pokemon-info.json";
import enBattleStat from "#app/locales/en/battle.json";
import enPokemonInfo from "#app/locales/en/pokemon-info.json";
import esBattleStat from "#app/locales/es/battle.json";
import esPokemonInfo from "#app/locales/es/pokemon-info.json";
import frBattleStat from "#app/locales/fr/battle.json";
import frPokemonInfo from "#app/locales/fr/pokemon-info.json";
import itBattleStat from "#app/locales/it/battle.json";
import itPokemonInfo from "#app/locales/it/pokemon-info.json";
import koBattleStat from "#app/locales/ko/battle.json";
import koPokemonInfo from "#app/locales/ko/pokemon-info.json";
import ptBrBattleStat from "#app/locales/pt_BR/battle.json";
import ptBrPokemonInfo from "#app/locales/pt_BR/pokemon-info.json";
import zhCnBattleStat from "#app/locales/zh_CN/battle.json";
import zhCnPokemonInfo from "#app/locales/zh_CN/pokemon-info.json";
import zhTwBattleStat from "#app/locales/zh_TW/battle.json";
import zhTwPokemonInfo from "#app/locales/zh_TW/pokemon-info.json";
import i18next, { initI18n } from "#app/plugins/i18n";
import { KoreanPostpositionProcessor } from "i18next-korean-postposition-processor";
import { beforeAll, describe, expect, it } from "vitest";

interface BattleStatTestUnit {
    stat: BattleStat,
    key: string
}

interface BattleStatLevelTestUnit {
    levels: integer,
    up: boolean,
    key: string
    changedStats: integer
}

function testBattleStatName(stat: BattleStat, expectMessage: string) {
  if (!expectMessage) {
    return;
  } // not translated yet!
  const message = getBattleStatName(stat);
  console.log(`message ${message}, expected ${expectMessage}`);
  expect(message).toBe(expectMessage);
}

function testBattleStatLevelChangeDescription(levels: integer, up: boolean, expectMessage: string, changedStats: integer) {
  if (!expectMessage) {
    return;
  } // not translated yet!
  const message = getBattleStatLevelChangeDescription("{{pokemonNameWithAffix}}", "{{stats}}", levels, up, changedStats);
  console.log(`message ${message}, expected ${expectMessage}`);
  expect(message).toBe(expectMessage);
}

describe("Test for BattleStat Localization", () => {
  const battleStatUnits: BattleStatTestUnit[] = [];
  const battleStatLevelUnits: BattleStatLevelTestUnit[] = [];

  beforeAll(() => {
    initI18n();

    battleStatUnits.push({stat: BattleStat.ATK, key: "Stat.ATK"});
    battleStatUnits.push({stat: BattleStat.DEF, key: "Stat.DEF"});
    battleStatUnits.push({stat: BattleStat.SPATK, key: "Stat.SPATK"});
    battleStatUnits.push({stat: BattleStat.SPDEF, key: "Stat.SPDEF"});
    battleStatUnits.push({stat: BattleStat.SPD, key: "Stat.SPD"});
    battleStatUnits.push({stat: BattleStat.ACC, key: "Stat.ACC"});
    battleStatUnits.push({stat: BattleStat.EVA, key: "Stat.EVA"});

    battleStatLevelUnits.push({levels: 1, up: true, key: "statRose_one", changedStats: 1});
    battleStatLevelUnits.push({levels: 2, up: true, key: "statSharplyRose_one", changedStats: 1});
    battleStatLevelUnits.push({levels: 3, up: true, key: "statRoseDrastically_one", changedStats: 1});
    battleStatLevelUnits.push({levels: 4, up: true, key: "statRoseDrastically_one", changedStats: 1});
    battleStatLevelUnits.push({levels: 5, up: true, key: "statRoseDrastically_one", changedStats: 1});
    battleStatLevelUnits.push({levels: 6, up: true, key: "statRoseDrastically_one", changedStats: 1});
    battleStatLevelUnits.push({levels: 7, up: true, key: "statWontGoAnyHigher_one", changedStats: 1});
    battleStatLevelUnits.push({levels: 1, up: false, key: "statFell_one", changedStats: 1});
    battleStatLevelUnits.push({levels: 2, up: false, key: "statHarshlyFell_one", changedStats: 1});
    battleStatLevelUnits.push({levels: 3, up: false, key: "statSeverelyFell_one", changedStats: 1});
    battleStatLevelUnits.push({levels: 4, up: false, key: "statSeverelyFell_one", changedStats: 1});
    battleStatLevelUnits.push({levels: 5, up: false, key: "statSeverelyFell_one", changedStats: 1});
    battleStatLevelUnits.push({levels: 6, up: false, key: "statSeverelyFell_one", changedStats: 1});
    battleStatLevelUnits.push({levels: 7, up: false, key: "statWontGoAnyLower_one", changedStats: 1});
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
      testBattleStatLevelChangeDescription(unit.levels, unit.up, enBattleStat[unit.key], unit.changedStats);
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
      testBattleStatLevelChangeDescription(unit.levels, unit.up, esBattleStat[unit.key], unit.changedStats);
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
      testBattleStatLevelChangeDescription(unit.levels, unit.up, itBattleStat[unit.key], unit.changedStats);
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
      testBattleStatLevelChangeDescription(unit.levels, unit.up, frBattleStat[unit.key], unit.changedStats);
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
      testBattleStatLevelChangeDescription(unit.levels, unit.up, deBattleStat[unit.key], unit.changedStats);
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
      testBattleStatLevelChangeDescription(unit.levels, unit.up, ptBrBattleStat[unit.key], unit.changedStats);
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
      // In i18next, the pluralization rules are language-specific, and Chinese only supports the _other suffix.
      unit.key = unit.key.replace("one", "other");
      testBattleStatLevelChangeDescription(unit.levels, unit.up, zhCnBattleStat[unit.key], unit.changedStats);
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
      // In i18next, the pluralization rules are language-specific, and Chinese only supports the _other suffix.
      unit.key = unit.key.replace("one", "other");
      testBattleStatLevelChangeDescription(unit.levels, unit.up, zhTwBattleStat[unit.key], unit.changedStats);
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
        testBattleStatLevelChangeDescription(unit.levels, unit.up, message, unit.changedStats);
      });
    });
  });
});
