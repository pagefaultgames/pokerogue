import { ModifierTypeTranslationEntries } from "#app/interfaces/locales";

export const modifierType: ModifierTypeTranslationEntries = {
  ModifierType: {
    "AddPokeballModifierType": {
      name: "{{modifierCount}}x {{pokeballName}}",
      description: "Erhalte {{pokeballName}} x{{modifierCount}}. (Inventar: {{pokeballAmount}}) \nFangrate: {{catchRate}}",
    },
    "AddVoucherModifierType": {
      name: "{{modifierCount}}x {{voucherTypeName}}",
      description: "Erhalte {{voucherTypeName}} x{{modifierCount}}.",
    },
    "PokemonHeldItemModifierType": {
      extra: {
        "inoperable": "{{pokemonName}} kann dieses\nItem nicht nehmen!",
        "tooMany": "{{pokemonName}} hat zu viele\nvon diesem Item!",
      }
    },
    "PokemonHpRestoreModifierType": {
      description: "Füllt {{restorePoints}} KP oder {{restorePercent}}% der KP für ein Pokémon auf. Je nachdem, welcher Wert höher ist.",
      extra: {
        "fully": "Füllt die KP eines Pokémon wieder vollständig auf.",
        "fullyWithStatus": "Füllt die KP eines Pokémon wieder vollständig auf und behebt alle Statusprobleme.",
      }
    },
    "PokemonReviveModifierType": {
      description: "Belebt ein kampunfähiges Pokémon wieder und stellt {{restorePercent}}% KP wieder her.",
    },
    "PokemonStatusHealModifierType": {
      description: "Behebt alle Statusprobleme eines Pokémon.",
    },
    "PokemonPpRestoreModifierType": {
      description: "Füllt {{restorePoints}} AP der ausgewählten Attacke eines Pokémon auf.",
      extra: {
        "fully": "Füllt alle AP der ausgewählten Attacke eines Pokémon auf.",
      }
    },
    "PokemonAllMovePpRestoreModifierType": {
      description: "Stellt {{restorePoints}} AP für alle Attacken eines Pokémon auf.",
      extra: {
        "fully": "Füllt alle AP für alle Attacken eines Pokémon auf.",
      }
    },
    "PokemonPpUpModifierType": {
      description: "Erhöht die maximale Anzahl der AP der ausgewählten Attacke um {{upPoints}} für jede 5 maximale AP (maximal 3).",
    },
    "PokemonNatureChangeModifierType": {
      name: "{{natureName}} Minze",
      description: "Ändert das Wesen zu {{natureName}}. Schaltet dieses Wesen permanent für diesen Starter frei.",
    },
    "DoubleBattleChanceBoosterModifierType": {
      description: "Verdoppelt die Wahrscheinlichkeit, dass die nächsten {{battleCount}} Begegnungen mit wilden Pokémon ein Doppelkampf sind.",
    },
    "TempBattleStatBoosterModifierType": {
      description: "Erhöht die {{tempBattleStatName}} aller Teammitglieder für 5 Kämpfe um eine Stufe.",
    },
    "AttackTypeBoosterModifierType": {
      description: "Erhöht die Stärke aller {{moveType}}-Attacken eines Pokémon um 20%.",
    },
    "PokemonLevelIncrementModifierType": {
      description: "Erhöht das Level eines Pokémon um 1.",
    },
    "AllPokemonLevelIncrementModifierType": {
      description: "Erhöht das Level aller Teammitglieder um 1.",
    },
    "PokemonBaseStatBoosterModifierType": {
      description: "Erhöht den {{statName}} Basiswert des Trägers um 10%. Das Stapellimit erhöht sich, je höher dein IS-Wert ist.",
    },
    "AllPokemonFullHpRestoreModifierType": {
      description: "Stellt 100% der KP aller Pokémon her.",
    },
    "AllPokemonFullReviveModifierType": {
      description: "Belebt alle kampunfähigen Pokémon wieder und stellt ihre KP vollständig wieder her.",
    },
    "MoneyRewardModifierType": {
      description:"Gewährt einen {{moneyMultiplier}} Geldbetrag von (₽{{moneyAmount}}).",
      extra: {
        "small": "kleinen",
        "moderate": "moderaten",
        "large": "großen",
      },
    },
    "ExpBoosterModifierType": {
      description: "Erhöht die erhaltenen Erfahrungspunkte um {{boostPercent}}%.",
    },
    "PokemonExpBoosterModifierType": {
      description: "Erhöht die Menge der erhaltenen Erfahrungspunkte für den Träger um {{boostPercent}}%.",
    },
    "PokemonFriendshipBoosterModifierType": {
      description: "Erhöht den Freundschaftszuwachs pro Sieg um 50%.",
    },
    "PokemonMoveAccuracyBoosterModifierType": {
      description: "Erhöht die Genauigkeit der Angriffe um {{accuracyAmount}} (maximal 100).",
    },
    "PokemonMultiHitModifierType": {
      description: "Attacken treffen ein weiteres mal mit einer Reduktion von 60/75/82,5% der Stärke.",
    },
    "TmModifierType": {
      name: "TM{{moveId}} - {{moveName}}",
      description: "Bringt einem Pokémon {{moveName}} bei.",
    },
    "TmModifierTypeWithInfo": {
      name: "TM{{moveId}} - {{moveName}}",
      description: "Bringt einem Pokémon {{moveName}} bei\n(Halte C oder Shift für mehr Infos).",
    },
    "EvolutionItemModifierType": {
      description: "Erlaubt es bestimmten Pokémon sich zu entwickeln.",
    },
    "FormChangeItemModifierType": {
      description: "Erlaubt es bestimmten Pokémon ihre Form zu ändern.",
    },
    "FusePokemonModifierType": {
      description: "Fusioniert zwei Pokémon (überträgt die Fähigkeit, teilt Basiswerte und Typ auf, gemeinsamer Attackenpool).",
    },
    "TerastallizeModifierType": {
      name: "{{teraType}} Terra-Stück",
      description: "{{teraType}} Terakristallisiert den Träger für bis zu 10 Kämpfe.",
    },
    "ContactHeldItemTransferChanceModifierType": {
      description:"Beim Angriff besteht eine {{chancePercent}}%ige Chance, dass das getragene Item des Gegners gestohlen wird."
    },
    "TurnHeldItemTransferModifierType": {
      description: "Jede Runde erhält der Träger ein getragenes Item des Gegners.",
    },
    "EnemyAttackStatusEffectChanceModifierType": {
      description:  "Fügt Angriffen eine {{chancePercent}}%ige Chance hinzu, {{statusEffect}} zu verursachen.",
    },
    "EnemyEndureChanceModifierType": {
      description: "Gibt den Träger eine {{chancePercent}}%ige Chance, einen Angriff zu überleben.",
    },

    "RARE_CANDY": { name: "Sonderbonbon" },
    "RARER_CANDY": { name: "Supersondererbonbon" },

    "MEGA_BRACELET": { name: "Mega-Armband", description: "Mega-Steine werden verfügbar." },
    "DYNAMAX_BAND": { name: "Dynamax-Band", description: "Dyna-Pilze werden verfügbar."},
    "TERA_ORB": { name: "Terakristall-Orb", description: "Tera-Stücke werden verfügbar." },

    "MAP": { name: "Karte", description: "Ermöglicht es dir, an einer Kreuzung dein Ziel zu wählen." },

    "POTION": { name: "Trank" },
    "SUPER_POTION": { name: "Supertrank" },
    "HYPER_POTION": { name: "Hypertrank" },
    "MAX_POTION": { name: "Top-Trank" },
    "FULL_RESTORE": { name: "Top-Genesung" },

    "REVIVE": { name: "Beleber" },
    "MAX_REVIVE": { name: "Top-Beleber" },

    "FULL_HEAL": { name: "Hyperheiler" },

    "SACRED_ASH": { name: "Zauberasche" },

    "REVIVER_SEED": { name: "Belebersamen", description: "Belebt den Träger mit der Hälfte seiner KP wieder sollte er kampfunfähig werden." },

    "ETHER": { name: "Äther" },
    "MAX_ETHER": { name: "Top-Äther" },

    "ELIXIR": { name: "Elixir" },
    "MAX_ELIXIR": { name: "Top-Elixir" },

    "PP_UP": { name: "AP-Plus" },
    "PP_MAX": { name: "AP-Top" },

    "LURE": { name: "Lockparfüm" },
    "SUPER_LURE": { name: "Super-Lockparfüm" },
    "MAX_LURE": { name: "Top-Lockparfüm" },

    "MEMORY_MUSHROOM": { name: "Erinnerungspilz", description: "Lässt ein Pokémon eine vergessene Attacke wiedererlernen." },

    "EXP_SHARE": { name: "EP-Teiler", description: "Pokémon, die nicht am Kampf teilgenommen haben, bekommen 20% der Erfahrungspunkte eines Kampfteilnehmers." },
    "EXP_BALANCE": { name: "EP-Ausgleicher", description: "Gewichtet die in Kämpfen erhaltenen Erfahrungspunkte auf niedrigstufigere Gruppenmitglieder." },

    "OVAL_CHARM": { name: "Ovalpin", description: "Wenn mehrere Pokémon am Kampf teilnehmen, erhählt jeder von ihnen 10% extra Erfahrungspunkte." },

    "EXP_CHARM": { name: "EP-Pin" },
    "SUPER_EXP_CHARM": { name: "Super-EP-Pin" },
    "GOLDEN_EXP_CHARM": { name: "Goldener EP-Pin" },

    "LUCKY_EGG": { name: "Glücks-Ei" },
    "GOLDEN_EGG": { name: "Goldenes Ei" },

    "SOOTHE_BELL": { name: "Sanftglocke" },

    "SOUL_DEW": { name: "Seelentau", description: "Erhöht den Einfluss des Wesens eines Pokemon auf seine Werte um 10% (additiv)." },

    "NUGGET": { name: "Nugget" },
    "BIG_NUGGET": { name: "Riesennugget" },
    "RELIC_GOLD": { name: "Alter Dukat" },

    "AMULET_COIN": { name: "Münzamulett", description: "Erhöht das Preisgeld um 20%." },
    "GOLDEN_PUNCH": { name: "Goldschlag", description: "Gewährt Geld in Höhe von 50% des zugefügten Schadens." },
    "COIN_CASE": { name: "Münzkorb", description: "Erhalte nach jedem 10ten Kampf 10% Zinsen auf dein Geld." },

    "LOCK_CAPSULE": { name: "Tresorkapsel", description: "Erlaubt es die Seltenheitsstufe der Items festzusetzen wenn diese neu gerollt werden." },

    "GRIP_CLAW": { name: "Griffklaue" },
    "WIDE_LENS": { name: "Großlinse" },

    "MULTI_LENS": { name: "Mehrfachlinse" },

    "HEALING_CHARM": { name: "Heilungspin", description: "Erhöht die Effektivität von Heilungsattacken sowie Heilitems um 10% (Beleber ausgenommen)." },
    "CANDY_JAR": { name: "Bonbonglas", description: "Erhöht die Anzahl der Level die ein Sonderbonbon erhöht um 1." },

    "BERRY_POUCH": { name: "Beerentüte", description: "Fügt eine 30% Chance hinzu, dass Beeren nicht verbraucht werden." },

    "FOCUS_BAND": { name: "Fokusband", description: "Fügt eine 10% Chance hinzu, dass Angriffe die zur Kampfunfähigkeit führen mit 1 KP überlebt werden." },

    "QUICK_CLAW": { name: "Quick Claw", description: "Fügt eine 10% Change hinzu als erster anzugreifen. (Nach Prioritätsangriffen)." },

    "KINGS_ROCK": { name: "King-Stein", description: "Fügt eine 10% Chance hinzu, dass der Gegner nach einem Angriff zurückschreckt." },

    "LEFTOVERS": { name: "Überreste", description: "Heilt 1/16 der maximalen KP eines Pokémon pro Runde." },
    "SHELL_BELL": { name: "Muschelglocke", description: "Heilt den Anwender um 1/8 des von ihm zugefügten Schadens." },

    "TOXIC_ORB": { name: "Toxik-Orb", description: "Dieser bizarre Orb vergiftet seinen Träger im Kampf schwer." },
    "FLAME_ORB": { name: "Heiß-Orb", description: "Dieser bizarre Orb fügt seinem Träger im Kampf Verbrennungen zu." },

    "BATON": { name: "Stab", description: "Ermöglicht das Weitergeben von Effekten beim Wechseln von Pokémon, wodurch auch Fallen umgangen werden." },

    "SHINY_CHARM": { name: "Schillerpin", description: "Erhöht die Chance deutlich, dass ein wildes Pokémon ein schillernd ist." },
    "ABILITY_CHARM": { name: "Ability Charm", description: "Erhöht die Chance deutlich, dass ein wildes Pokémon eine versteckte Fähigkeit hat." },

    "IV_SCANNER": { name: "IS-Scanner", description: "Erlaubt es die IS-Werte von wilden Pokémon zu scannen.\n(2 IS-Werte pro Staplung. Die besten IS-Werte zuerst)." },

    "DNA_SPLICERS": { name: "DNS-Keil" },

    "MINI_BLACK_HOLE": { name: "Mini schwarzes Loch" },

    "GOLDEN_POKEBALL": { name: "Goldener Pokéball", description: "Fügt eine zusätzliche Item-Auswahlmöglichkeit nach jedem Kampf hinzu." },

    "ENEMY_DAMAGE_BOOSTER": { name: "Schadensmarke", description: "Erhöht den Schaden um 5%." },
    "ENEMY_DAMAGE_REDUCTION": { name: "Schutzmarke", description: "Verringert den erhaltenen Schaden um 2,5%." },
    "ENEMY_HEAL": { name: "Wiederherstellungsmarke", description: "Heilt 2% der maximalen KP pro Runde." },
    "ENEMY_ATTACK_POISON_CHANCE": { name: "Giftmarke" },
    "ENEMY_ATTACK_PARALYZE_CHANCE": { "name": "Lähmungsmarke" },
    "ENEMY_ATTACK_BURN_CHANCE": { "name": "Brandmarke" },
    "ENEMY_STATUS_EFFECT_HEAL_CHANCE": { "name": "Vollheilungsmarke", "description": "Fügt eine 2,5%ige Chance hinzu, jede Runde einen Statuszustand zu heilen." },
    "ENEMY_ENDURE_CHANCE": { "name": "Ausdauer-Marke" },
    "ENEMY_FUSED_CHANCE": { "name": "Fusionsmarke", "description": "Fügt eine 1%ige Chance hinzu, dass ein wildes Pokémon eine Fusion ist." },

  },
  TempBattleStatBoosterItem: {
    "x_attack": "X-Angriff",
    "x_defense": "X-Verteidigung",
    "x_sp_atk": "X-Sp.-Ang.",
    "x_sp_def": "X-Sp.-Vert.",
    "x_speed": "X-Tempo",
    "x_accuracy": "X-Treffer",
    "dire_hit": "X-Volltreffer",
  },

  TempBattleStatBoosterStatName: {
    "ATK": "Angriff",
    "DEF": "Verteidigung",
    "SPATK": "Sp. Ang",
    "SPDEF": "Sp. Vert",
    "SPD": "Initiative",
    "ACC": "Genauigkeit",
    "CRIT": "Volltrefferquote",
    "EVA": "Fluchtwert",
    "DEFAULT": "???",
  },


  AttackTypeBoosterItem: {
    "silk_scarf": "Seidenschal",
    "black_belt": "Schwarzgurt",
    "sharp_beak": "Spitzer Schnabel",
    "poison_barb": "Giftstich",
    "soft_sand": "Pudersand",
    "hard_stone": "Granitstein",
    "silver_powder": "Silberstaub",
    "spell_tag": "Bannsticker",
    "metal_coat": "Metallmantel",
    "charcoal": "Holzkohle",
    "mystic_water": "Zauberwasser",
    "miracle_seed": "Wundersaat",
    "magnet": "Magnet",
    "twisted_spoon": "Krümmlöffel",
    "never_melt_ice": "Ewiges Eis",
    "dragon_fang": "Drachenzahn",
    "black_glasses": "Schattenbrille",
    "fairy_feather": "Feendaune",
  },
  BaseStatBoosterItem: {
    "hp_up": "KP-Plus",
    "protein": "Protein",
    "iron": "Eisen",
    "calcium": "Kalzium",
    "zinc": "Zink",
    "carbos": "Carbon",
  },
  EvolutionItem: {
    "NONE": "Keins",

    "LINKING_CORD": "Linkkabel",
    "SUN_STONE": "Sonnenstein",
    "MOON_STONE": "Mondstein",
    "LEAF_STONE": "Blattstein",
    "FIRE_STONE": "Feuerstein",
    "WATER_STONE": "Wasserstein",
    "THUNDER_STONE": "Donnerstein",
    "ICE_STONE": "Eisstein",
    "DUSK_STONE": "Finsterstein",
    "DAWN_STONE": "Funkelstein",
    "SHINY_STONE": "Leuchtstein",
    "CRACKED_POT": "Rissige Kanne",
    "SWEET_APPLE": "Süßer Apfel",
    "TART_APPLE": "Saurer Apfel",
    "STRAWBERRY_SWEET": "Zucker-Erdbeere",
    "UNREMARKABLE_TEACUP": "Simple Teeschale",

    "CHIPPED_POT": "Löchrige Kanne",
    "BLACK_AUGURITE": "Schwarzaugit",
    "GALARICA_CUFF": "Galarnuss-Reif",
    "GALARICA_WREATH": "Galarnuss-Kranz",
    "PEAT_BLOCK": "Torfblock",
    "AUSPICIOUS_ARMOR": "Glorienrüstung",
    "MALICIOUS_ARMOR": "Fluchrüstung",
    "MASTERPIECE_TEACUP": "Edle Teeschale",
    "METAL_ALLOY": "Legierungsmetall",
    "SCROLL_OF_DARKNESS": "Unlicht-Schriftrolle",
    "SCROLL_OF_WATERS": "Wasser-Schriftrolle",
    "SYRUPY_APPLE": "Saftiger Apfel",
  },
  FormChangeItem: {
    "NONE": "Keins",

    "ABOMASITE": "Rexblisarnit",
    "ABSOLITE": "Absolnit",
    "AERODACTYLITE": "Aerodactylonit",
    "AGGRONITE": "Stollossnit",
    "ALAKAZITE": "Simsalanit",
    "ALTARIANITE": "Altarianit",
    "AMPHAROSITE": "Ampharosnit",
    "AUDINITE": "Ohrdochnit",
    "BANETTITE": "Banetteonit",
    "BEEDRILLITE": "Bibornit",
    "BLASTOISINITE": "Turtoknit",
    "BLAZIKENITE": "Lohgocknit",
    "CAMERUPTITE": "Cameruptnit",
    "CHARIZARDITE_X": "Gluraknit X",
    "CHARIZARDITE_Y": "Gluraknit Y",
    "DIANCITE": "Diancienit",
    "GALLADITE": "Galagladinit",
    "GARCHOMPITE": "Knakracknit",
    "GARDEVOIRITE": "Guardevoirnit",
    "GENGARITE": "Gengarnit ",
    "GLALITITE": "Firnontornit",
    "GYARADOSITE": "Garadosnit",
    "HERACRONITE": "Skarabornit",
    "HOUNDOOMINITE": "Hundemonit ",
    "KANGASKHANITE": "Kangamanit",
    "LATIASITE": "Latiasnit",
    "LATIOSITE": "Latiosnit",
    "LOPUNNITE": "Schlapornit",
    "LUCARIONITE": "Lucarionit",
    "MANECTITE": "Voltensonit",
    "MAWILITE": "Flunkifernit",
    "MEDICHAMITE": "Meditalisnit",
    "METAGROSSITE": "Metagrossnit",
    "MEWTWONITE_X": "Mewtunit X",
    "MEWTWONITE_Y": "Mewtunit Y",
    "PIDGEOTITE": "Taubossnit",
    "PINSIRITE": "Pinsirnit",
    "RAYQUAZITE": "Rayquazanit",
    "SABLENITE": "Zobirisnit",
    "SALAMENCITE": "Brutalandanit",
    "SCEPTILITE": "Gewaldronit",
    "SCIZORITE": "Scheroxnit",
    "SHARPEDONITE": "Tohaidonit",
    "SLOWBRONITE": "Lahmusnit",
    "STEELIXITE": "Stahlosnit",
    "SWAMPERTITE": "Sumpexnit",
    "TYRANITARITE": "Despotarnit",
    "VENUSAURITE": "Bisaflornit",

    "BLUE_ORB": "Blauer Edelstein",
    "RED_ORB": "Roter Edelstein",
    "SHARP_METEORITE": "Scharfer Meteorit",
    "HARD_METEORITE": "Harter Meteorit",
    "SMOOTH_METEORITE": "Glatter Meteorit",
    "ADAMANT_CRYSTAL": "Adamantkristall",
    "LUSTROUS_GLOBE": "Weißkristall",
    "GRISEOUS_CORE": "Platinumkristall",
    "REVEAL_GLASS": "Wahrspiegel",
    "GRACIDEA": "Gracidea",
    "MAX_MUSHROOMS": "Dyna-Pilz",
    "DARK_STONE": "Dunkelstein",
    "LIGHT_STONE": "Lichtstein",
    "PRISON_BOTTLE": "Banngefäß",
    "N_LUNARIZER": "Necrolun",
    "N_SOLARIZER": "Necrosol",
    "RUSTED_SWORD": "Rostiges Schwert",
    "RUSTED_SHIELD": "Rostiges Schild",
    "ICY_REINS_OF_UNITY": "Eisige Zügel des Bundes",
    "SHADOW_REINS_OF_UNITY": "Schattige Zügel des Bundes",
    "WELLSPRING_MASK": "Brunnenmaske",
    "HEARTHFLAME_MASK": "Ofenmaske",
    "CORNERSTONE_MASK": "Fundamentmaske",
    "SHOCK_DRIVE": "Blitzmodul",
    "BURN_DRIVE": "Flammenmodul",
    "CHILL_DRIVE": "Gefriermodul",
    "DOUSE_DRIVE": "Aquamodul",

    "FIST_PLATE": "Fausttafel",
    "SKY_PLATE": "Wolkentafel",
    "TOXIC_PLATE": "Gifttafel",
    "EARTH_PLATE": "Erdtafel",
    "STONE_PLATE": "Steintafel",
    "INSECT_PLATE": "Käfertafel",
    "SPOOKY_PLATE": "Spuktafel",
    "IRON_PLATE": "Eisentafel",
    "FLAME_PLATE": "Feuertafel",
    "SPLASH_PLATE": "Wassertafel",
    "MEADOW_PLATE": "Wiesentafel",
    "ZAP_PLATE": "Blitztafel",
    "MIND_PLATE": "Hirntafel",
    "ICICLE_PLATE": "Frosttafel",
    "DRACO_PLATE": "Dracotafel",
    "DREAD_PLATE": "Furchttafel",
    "PIXIE_PLATE": "Feentafel",
    "BLANK_PLATE": "Neutraltafel",
    "LEGEND_PLATE": "Legendentafel",
    "FIGHTING_MEMORY": "Kampf-Disc",
    "FLYING_MEMORY": "Flug-Disc",
    "POISON_MEMORY": "Gift-Disc",
    "GROUND_MEMORY": "Boden-Disc",
    "ROCK_MEMORY": "Gesteins-Disc",
    "BUG_MEMORY": "Käfer-Disc",
    "GHOST_MEMORY": "Geister-Disc",
    "STEEL_MEMORY": "Stahl-Disc",
    "FIRE_MEMORY": "Feuer-Disc",
    "WATER_MEMORY": "Wasser-Disc",
    "GRASS_MEMORY": "Pflanzen-Disc",
    "ELECTRIC_MEMORY": "Elektro-Disc",
    "PSYCHIC_MEMORY": "Psycho-Disc",
    "ICE_MEMORY": "Eis-Disc",
    "DRAGON_MEMORY": "Drachen-Disc",
    "DARK_MEMORY": "Unlicht-Disc",
    "FAIRY_MEMORY": "Feen-Disc",
    "BLANK_MEMORY": "Leere-Disc",
  },
} as const;
