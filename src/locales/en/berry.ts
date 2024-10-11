import { BerryTranslationEntries } from "#app/interfaces/locales";

export const berry: BerryTranslationEntries = {
  "SITRUS": {
    name: "Sitrus Berry",
    effect: "Restores 25% HP if HP is below 50%",
  },
  "LUM": {
    name: "Lum Berry",
    effect: "Cures any non-volatile status condition and confusion",
  },
  "ENIGMA": {
    name: "Enigma Berry",
    effect: "Restores 25% HP if hit by a super effective move",
  },
  "LIECHI": {
    name: "Liechi Berry",
    effect: "Raises Attack if HP is below 25%",
  },
  "GANLON": {
    name: "Ganlon Berry",
    effect: "Raises Defense if HP is below 25%",
  },
  "PETAYA": {
    name: "Petaya Berry",
    effect: "Raises Sp. Atk if HP is below 25%",
  },
  "APICOT": {
    name: "Apicot Berry",
    effect: "Raises Sp. Def if HP is below 25%",
  },
  "SALAC": {
    name: "Salac Berry",
    effect: "Raises Speed if HP is below 25%",
  },
  "LANSAT": {
    name: "Lansat Berry",
    effect: "Raises critical hit ratio if HP is below 25%",
  },
  "STARF": {
    name: "Starf Berry",
    effect: "Sharply raises a random stat if HP is below 25%",
  },
  "LEPPA": {
    name: "Leppa Berry",
    effect: "Restores 10 PP to a move if its PP reaches 0",
  },
} as const;
