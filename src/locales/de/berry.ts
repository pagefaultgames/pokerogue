import { BerryTranslationEntries } from "#app/interfaces/locales";

export const berry: BerryTranslationEntries = {
  "SITRUS": {
    name: "Tsitrubeere",
    effect: "Stellt 25% der KP wieder her, wenn die KP unter 50% sind."
  },
  "LUM": {
    name: "Prunusbeere",
    effect: "Heilt jede nichtflüchtige Statusveränderung und Verwirrung."
  },
  "ENIGMA": {
    name: "Enigmabeere",
    effect: "Stellt 25% der KP wieder her, wenn der Träger von einer sehr effektiven Attacke getroffen wird.",
  },
  "LIECHI": {
    name: "Lydzibeere",
    effect: "Steigert den Angriff, wenn die KP unter 25% sind."
  },
  "GANLON": {
    name: "Linganbeere",
    effect: "Steigert die Verteidigung, wenn die KP unter 25% sind."
  },
  "PETAYA": {
    name: "Tahaybeere",
    effect: "Steigert den Spezial-Angriff, wenn die KP unter 25% sind."
  },
  "APICOT": {
    name: "Apikobeere",
    effect: "Steigert die Spezial-Verteidigung, wenn die KP unter 25% sind."
  },
  "SALAC": {
    name: "Salkabeere",
    effect: "Steigert die Initiative, wenn die KP unter 25% sind."
  },
  "LANSAT": {
    name: "Lansatbeere",
    effect: "Erhöht die Volltrefferchance, wenn die KP unter 25% sind."
  },
  "STARF": {
    name: "Krambobeere",
    effect: "Erhöht einen zufälligen Statuswert stark, wenn die KP unter 25% sind."
  },
  "LEPPA": {
    name: "Jonagobeere",
    effect: "Stellt 10 AP für eine Attacke wieder her, wenn deren AP auf 0 fallen."
  },
} as const;
