import {AchievementTranslationEntries} from "#app/plugins/i18n.js";

// Achievement translations for the when the player character is male
export const PGMachv: AchievementTranslationEntries = {
  "Achievements": {
    name: "Errungenschaften",
  },
  "Locked": {
    name: "Gesperrt",
  },


  "MoneyAchv": {
    description: "Häufe eine Gesamtsumme von {{moneyAmount}} ₽ an",
  },
  "10K_MONEY": {
    name: "Besserverdiener",
  },
  "100K_MONEY": {
    name: "Reich",
  },
  "1M_MONEY": {
    name: "Millionär",
  },
  "10M_MONEY": {
    name: "Einprozenter",
  },

  "DamageAchv": {
    description: "Füge mit einem Treffer {{damageAmount}} Schaden zu",
  },
  "250_DMG": {
    name: "Harte Treffer",
  },
  "1000_DMG": {
    name: "Härtere Treffer",
  },
  "2500_DMG": {
    name: "Das ist ne Menge Schaden!",
  },
  "10000_DMG": {
    name: "One Punch Man",
  },

  "HealAchv": {
    description: "Heile {{healAmount}} {{HP}} auf einmal. Mit einer Attacke, Fähigkeit oder einem gehaltenen Gegenstand",
  },
  "250_HEAL": {
    name: "Anfänger-Heiler",
  },
  "1000_HEAL": {
    name: "Gesundheitsprofi",
  },
  "2500_HEAL": {
    name: "Kleriker",
  },
  "10000_HEAL": {
    name: "Wiederherstellungsmeister",
  },

  "LevelAchv": {
    description: "Erhöhe das Level eines Pokémon auf {{level}}",
  },
  "LV_100": {
    name: "Warte, es gibt mehr!",
  },
  "LV_250": {
    name: "Elite",
  },
  "LV_1000": {
    name: "Geh noch höher hinaus!",
  },

  "RibbonAchv": {
    description: "Sammle insgesamt {{ribbonAmount}} Bänder",
  },
  "10_RIBBONS": {
    name: "Champion der Pokémon Liga",
  },
  "25_RIBBONS": {
    name: "Bänder-Sammler",
  },
  "50_RIBBONS": {
    name: "Bänder-Experte",
  },
  "75_RIBBONS": {
    name: "Bänder-Guru",
  },
  "100_RIBBONS": {
    name: "Bänder-Meister",
  },

  "TRANSFER_MAX_BATTLE_STAT": {
    name: "Teamwork",
    description: "Nutze Staffette, während der Anwender mindestens eines Statuswertes maximiert hat",
  },
  "MAX_FRIENDSHIP": {
    name: "Freundschaftsmaximierung",
    description: "Erreiche maximale Freundschaft bei einem Pokémon",
  },
  "MEGA_EVOLVE": {
    name: "Megaverwandlung",
    description: "Megaentwickle ein Pokémon",
  },
  "GIGANTAMAX": {
    name: "Absolute Einheit",
    description: "Gigadynamaximiere ein Pokémon",
  },
  "TERASTALLIZE": {
    name: "Typen-Bonus Enthusiast",
    description: "Terrakristallisiere ein Pokémon",
  },
  "STELLAR_TERASTALLIZE": {
    name: "Der geheime Typ",
    description: "Terrakristallisiere ein Pokémon zum Typen Stellar",
  },
  "SPLICE": {
    name: "Unendliche Fusion",
    description: "Kombiniere zwei Pokémon mit einem DNS-Keil",
  },
  "MINI_BLACK_HOLE": {
    name: "Ein Loch voller Items",
    description: "Erlange ein Mini-Schwarzes Loch",
  },
  "CATCH_MYTHICAL": {
    name: "Mysteriöses!",
    description: "Fange ein mysteriöses Pokémon",
  },
  "CATCH_SUB_LEGENDARY": {
    name: "Sub-Legendär",
    description: "Fange ein sub-legendäres Pokémon",
  },
  "CATCH_LEGENDARY": {
    name: "Legendär",
    description: "Fange ein legendäres Pokémon",
  },
  "SEE_SHINY": {
    name: "Schillerndes Licht",
    description: "Finde ein wildes schillerndes Pokémon",
  },
  "SHINY_PARTY": {
    name: "Das ist Hingabe",
    description: "Habe ein Team aus schillernden Pokémon",
  },
  "HATCH_MYTHICAL": {
    name: "Mysteriöses Ei",
    description: "Lass ein mysteriöses Pokémon aus einem Ei schlüpfen",
  },
  "HATCH_SUB_LEGENDARY": {
    name: "Sub-Legendäres Ei",
    description: "Lass ein sub-legendäres Pokémon aus einem Ei schlüpfen",
  },
  "HATCH_LEGENDARY": {
    name: "Legendäres Ei",
    description: "Lass ein legendäres Pokémon aus einem Ei schlüpfen",
  },
  "HATCH_SHINY": {
    name: "Schillerndes Ei",
    description: "Lass ein schillerndes Pokémon aus einem Ei schlüpfen",
  },
  "HIDDEN_ABILITY": {
    name: "Geheimes Talent",
    description: "Fang ein Pokémon mit versteckter Fähigkeit",
  },
  "PERFECT_IVS": {
    name: "Zertifikat der Echtheit",
    description: "Erhalte ein Pokémon mit perfekten IS-Werten",
  },
  "CLASSIC_VICTORY": {
    name: "Ungeschlagen",
    description: "Beende den klassischen Modus erfolgreich",
  },
} as const;

// Achievement translations for the when the player character is female
export const PGFachv: AchievementTranslationEntries = {
  "Achievements": {
    name: PGMachv.Achievements.name,
  },
  "Locked": {
    name: PGMachv.Locked.name,
  },


  "MoneyAchv": PGMachv.MoneyAchv,
  "10K_MONEY": {
    name: "Besserverdienerin",
  },
  "100K_MONEY": PGMachv["100K_MONEY"],
  "1M_MONEY": {
    name: "Millionärin",
  },
  "10M_MONEY": PGMachv["10M_MONEY"],

  "DamageAchv": PGMachv.DamageAchv,
  "250_DMG": PGMachv["250_DMG"],
  "1000_DMG": PGMachv["1000_DMG"],
  "2500_DMG": PGMachv["2500_DMG"],
  "10000_DMG": {
    name: "One Punch Woman",
  },

  "HealAchv": PGMachv.HealAchv,
  "250_HEAL": {
    name: "Anfänger-Heilerin",
  },
  "1000_HEAL": PGMachv["1000_HEAL"],
  "2500_HEAL": {
    name: "Klerikerin",
  },
  "10000_HEAL": {
    name: "Wiederherstellungsmeisterin",
  },

  "LevelAchv": PGMachv.LevelAchv,
  "LV_100":  PGMachv["LV_100"],
  "LV_250":  PGMachv["LV_250"],
  "LV_1000":  PGMachv["LV_1000"],

  "RibbonAchv":  PGMachv.RibbonAchv,
  "10_RIBBONS":  PGMachv["10_RIBBONS"],
  "25_RIBBONS": {
    name: "Bänder-Sammlerin",
  },
  "50_RIBBONS": {
    name: "Bänder-Expertin",
  },
  "75_RIBBONS":  PGMachv["75_RIBBONS"],
  "100_RIBBONS": {
    name: "Bänder-Meisterin",
  },

  "TRANSFER_MAX_BATTLE_STAT": PGMachv.TRANSFER_MAX_BATTLE_STAT,
  "MAX_FRIENDSHIP": PGMachv.MAX_FRIENDSHIP,
  "MEGA_EVOLVE": PGMachv.MEGA_EVOLVE,
  "GIGANTAMAX": PGMachv.GIGANTAMAX,
  "TERASTALLIZE": PGMachv.TERASTALLIZE,
  "STELLAR_TERASTALLIZE": PGMachv.STELLAR_TERASTALLIZE,
  "SPLICE": PGMachv.SPLICE,
  "MINI_BLACK_HOLE": PGMachv.MINI_BLACK_HOLE,
  "CATCH_MYTHICAL": PGMachv.CATCH_MYTHICAL,
  "CATCH_SUB_LEGENDARY": PGMachv.CATCH_SUB_LEGENDARY,
  "CATCH_LEGENDARY": PGMachv.CATCH_LEGENDARY,
  "SEE_SHINY": PGMachv.SEE_SHINY,
  "SHINY_PARTY": PGMachv.SHINY_PARTY,
  "HATCH_MYTHICAL": PGMachv.HATCH_MYTHICAL,
  "HATCH_SUB_LEGENDARY": PGMachv.HATCH_SUB_LEGENDARY,
  "HATCH_LEGENDARY": PGMachv.HATCH_LEGENDARY,
  "HATCH_SHINY": PGMachv.HATCH_SHINY,
  "HIDDEN_ABILITY": PGMachv.HIDDEN_ABILITY,
  "PERFECT_IVS": PGMachv.PERFECT_IVS,
  "CLASSIC_VICTORY": PGMachv.CLASSIC_VICTORY,
} as const;

