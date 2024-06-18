import { BerryTranslationEntries } from "#app/interfaces/locales";

export const berry: BerryTranslationEntries = {
  "SITRUS": {
    name: "文柚果",
    effect: "HP低于50%时，回复最大HP的25%",
  },
  "LUM": {
    name: "木子果",
    effect: "治愈任何异常状态和混乱状态",
  },
  "ENIGMA": {
    name: "谜芝果",
    effect: "受到效果绝佳的招式攻击时，回复25%最大HP",
  },
  "LIECHI": {
    name: "枝荔果",
    effect: "HP低于25%时，攻击提升一个等级",
  },
  "GANLON": {
    name: "龙睛果",
    effect: "HP低于25%时，防御提升一个等级",
  },
  "PETAYA": {
    name: "龙火果",
    effect: "HP低于25%时，特攻提升一个等级",
  },
  "APICOT": {
    name: "杏仔果",
    effect: "HP低于25%时，特防提升一个等级",
  },
  "SALAC": {
    name: "沙鳞果",
    effect: "HP低于25%时，速度提升一个等级",
  },
  "LANSAT": {
    name: "兰萨果",
    effect: "HP低于25%时，击中要害率提升两个等级",
  },
  "STARF": {
    name: "星桃果",
    effect: "HP低于25%时，提高随机一项能力两个等级",
  },
  "LEPPA": {
    name: "苹野果",
    effect: "有招式的PP降到0时，恢复该招式10PP",
  },
} as const;
