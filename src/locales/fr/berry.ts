import { BerryTranslationEntries } from "#app/interfaces/locales";

export const berry: BerryTranslationEntries = {
  "SITRUS": {
    name: "Baie Sitrus",
    effect: "Restaure 25% des PV s’ils sont inférieurs à 50%",
  },
  "LUM": {
    name: "Baie Prine",
    effect: "Soigne tout problème de statut permanant et la confusion",
  },
  "ENIGMA": {
    name: "Baie Enigma",
    effect: "Restaure 25% des PV si touché par une capacité super efficace",
  },
  "LIECHI": {
    name: "Baie Lichii",
    effect: "Augmente l’Attaque si les PV sont inférieurs à 25%",
  },
  "GANLON": {
    name: "Baie Lingan",
    effect: "Augmente la Défense si les PV sont inférieurs à 25%",
  },
  "PETAYA": {
    name: "Baie Pitaye",
    effect: "Augmente l’Atq. Spé. si les PV sont inférieurs à 25%",
  },
  "APICOT": {
    name: "Baie Abriko",
    effect: "Augmente la Déf. Spé. si les PV sont inférieurs à 25%",
  },
  "SALAC": {
    name: "Baie Sailak",
    effect: "Augmente la Vitesse si les PV sont inférieurs à 25%",
  },
  "LANSAT": {
    name: "Baie Lansat",
    effect: "Augmente le taux de coups critiques si les PV sont inférieurs à 25%",
  },
  "STARF": {
    name: "Baie Frista",
    effect: "Augmente énormément une statistique au hasard si les PV sont inférieurs à 25%",
  },
  "LEPPA": {
    name: "Baie Mepo",
    effect: "Restaure 10 PP à une capacité dès que ses PP tombent à 0",
  },
} as const;
