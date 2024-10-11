import { BerryTranslationEntries } from "#app/interfaces/locales";

export const berry: BerryTranslationEntries = {
  "SITRUS": {
    name: "Baya Zidra",
    effect: "Restaura 25% PS si estos caen por debajo del 50%",
  },
  "LUM": {
    name: "Baya Ziuela",
    effect: "Cura cualquier problema de estado",
  },
  "ENIGMA": {
    name: "Baya Enigma",
    effect: "Restaura 25% PS si le alcanza un ataque supereficaz",
  },
  "LIECHI": {
    name: "Baya Lichi",
    effect: "Aumenta el ataque si los PS están por debajo de 25%",
  },
  "GANLON": {
    name: "Baya Gonlan",
    effect: "Aumenta la defensa si los PS están por debajo de 25%",
  },
  "PETAYA": {
    name: "Baya Yapati",
    effect: "Aumenta el ataque especial si los PS están por debajo de 25%",
  },
  "APICOT": {
    name: "Baya Aricoc",
    effect: "Aumenta la defensa especial si los PS están por debajo de 25%",
  },
  "SALAC": {
    name: "Baya Aslac",
    effect: "Aumenta la velocidad si los PS están por debajo de 25%",
  },
  "LANSAT": {
    name: "Baya Zonlan",
    effect: "Aumenta el índice de golpe crítico si los PS están por debajo de 25%",
  },
  "STARF": {
    name: "Baya Arabol",
    effect: "Aumenta mucho una estadística al azar si los PS están por debajo de 25%",
  },
  "LEPPA": {
    name: "Baya Zanama",
    effect: "Restaura 10 PP del primer movimiento cuyos PP bajen a 0",
  },
} as const;
