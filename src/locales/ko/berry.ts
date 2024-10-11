import { BerryTranslationEntries } from "#app/interfaces/locales";

export const berry: BerryTranslationEntries = {
  "SITRUS": {
    name: "자뭉열매",
    effect: "지니게 하면 HP가 50% 미만일 때 HP를 25% 회복",
  },
  "LUM": {
    name: "리샘열매",
    effect: "지니게 하면 모든 상태 이상과 혼란을 회복",
  },
  "ENIGMA": {
    name: "의문열매",
    effect: "지니게 하면 효과가 뛰어난 기술에 당했을 때 HP를 25% 회복",
  },
  "LIECHI": {
    name: "치리열매",
    effect: "지니게 하면 HP가 25% 미만일 때 자신의 공격이 상승",
  },
  "GANLON": {
    name: "용아열매",
    effect: "지니게 하면 HP가 25% 미만일 때 자신의 방어가 상승",
  },
  "PETAYA": {
    name: "야타비열매",
    effect: "지니게 하면 HP가 25% 미만일 때 자신의 특수공격이 상승",
  },
  "APICOT": {
    name: "규살열매",
    effect: "지니게 하면 HP가 25% 미만일 때 자신의 특수방어가 상승",
  },
  "SALAC": {
    name: "캄라열매",
    effect: "지니게 하면 HP가 25% 미만일 때 자신의 스피드가 상승",
  },
  "LANSAT": {
    name: "랑사열매",
    effect: "지니게 하면 HP가 25% 미만일 때 공격이 급소를 맞히기 쉬워짐",
  },
  "STARF": {
    name: "스타열매",
    effect: "지니게 하면 HP가 25% 미만일 때 능력 중의 하나가 크게 상승",
  },
  "LEPPA": {
    name: "과사열매",
    effect: "지니게 하면 기술의 PP가 0이 되었을 때 PP를 10만큼 회복",
  },
} as const;
