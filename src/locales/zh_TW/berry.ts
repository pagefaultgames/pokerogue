import { BerryTranslationEntries } from "#app/interfaces/locales";

export const berry: BerryTranslationEntries = {
  "SITRUS": {
    name: "文柚果",
    effect: "HP低於50%時，恢復最大HP的25%",
  },
  "LUM": {
    name: "木子果",
    effect: "治癒任何異常狀態和混亂狀態",
  },
  "ENIGMA": {
    name: "謎芝果",
    effect: "受到效果絕佳的招式攻擊時，恢復25%最大HP",
  },
  "LIECHI": {
    name: "枝荔果",
    effect: "HP低於25%時，攻擊提升一個等級",
  },
  "GANLON": {
    name: "龍睛果",
    effect: "HP低於25%時，防禦提升一個等級",
  },
  "PETAYA": {
    name: "龍火果",
    effect: "HP低於25%時，特攻提升一個等級",
  },
  "APICOT": {
    name: "杏仔果",
    effect: "HP低於25%時，特防提升一個等級",
  },
  "SALAC": {
    name: "沙鱗果",
    effect: "HP低於25%時，速度提升一個等級",
  },
  "LANSAT": {
    name: "蘭薩果",
    effect: "HP低於25%時，擊中要害率提升兩個等級",
  },
  "STARF": {
    name: "星桃果",
    effect: "HP低於25%時，提高隨機一項能力兩個等級",
  },
  "LEPPA": {
    name: "蘋野果",
    effect: "有招式的PP降到0時，恢復該招式10PP",
  },
} as const;
