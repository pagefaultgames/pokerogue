import { ModifierTypeTranslationEntries } from "#app/interfaces/locales";

export const modifierType: ModifierTypeTranslationEntries = {
  ModifierType: {
    "AddPokeballModifierType": {
      name: "{{pokeballName}} x{{modifierCount}}",
      description: "Recevez {{modifierCount}} {{pokeballName}}s (Inventaire : {{pokeballAmount}}) \nTaux de capture : {{catchRate}}.",
    },
    "AddVoucherModifierType": {
      name: "{{voucherTypeName}} x{{modifierCount}}",
      description: "Recevez {{modifierCount}} {{voucherTypeName}}.",
    },
    "PokemonHeldItemModifierType": {
      extra: {
        "inoperable": "{{pokemonName}} ne peut pas\nporter cet objet !",
        "tooMany": "{{pokemonName}} possède trop\nd’exemplaires de cet objet !",
      }
    },
    "PokemonHpRestoreModifierType": {
      description: "Restaure {{restorePoints}} PV ou {{restorePercent}}% des PV totaux d’un Pokémon, en fonction duquel des deux est le plus élevé",
      extra: {
        "fully": "Restaure tous les PV d’un Pokémon.",
        "fullyWithStatus": "Restaure tous les PV d’un Pokémon et soigne tous ses problèmes de statut.",
      }
    },
    "PokemonReviveModifierType": {
      description: "Réanime un Pokémon et restaure {{restorePercent}}% de ses PV.",
    },
    "PokemonStatusHealModifierType": {
      description: "Soigne tous les problèmes de statut d’un Pokémon.",
    },
    "PokemonPpRestoreModifierType": {
      description: "Restaure {{restorePoints}} PP à une capacité d’un Pokémon.",
      extra: {
        "fully": "Restaure tous les PP à une capacité d’un Pokémon.",
      }
    },
    "PokemonAllMovePpRestoreModifierType": {
      description: "Restaure {{restorePoints}} PP à toutes les capacités d’un Pokémon.",
      extra: {
        "fully": "Restaure tous les PP à toutes les capacités d’un Pokémon.",
      }
    },
    "PokemonPpUpModifierType": {
	  description: "Augmente le max de PP de {{upPoints}} à une capacité d’un Pokémon pour chaque 5 PP max (max : 3).",
    },
    "PokemonNatureChangeModifierType": {
      name: "Aromate {{natureName}}",
	  description: "Donne la nature {{natureName}} à un Pokémon et la débloque pour le starter lui étant lié.",
    },
    "DoubleBattleChanceBoosterModifierType": {
	  description: "Double les chances de tomber sur un combat double pendant {{battleCount}} combats.",
    },
    "TempBattleStatBoosterModifierType": {
	  description: "Augmente d’un cran {{tempBattleStatName}} pour toute l’équipe pendant 5 combats.",
    },
    "AttackTypeBoosterModifierType": {
      description: "Augmente de 20% la puissance des capacités de type {{moveType}} d’un Pokémon.",
    },
    "PokemonLevelIncrementModifierType": {
      description: "Fait monter un Pokémon d’un niveau.",
    },
    "AllPokemonLevelIncrementModifierType": {
      description: "Fait monter toute l’équipe d’un niveau.",
    },
    "PokemonBaseStatBoosterModifierType": {
	  description: "Augmente de 10% {{statName}} de base de son porteur. Plus les IV sont hauts, plus il peut en porter.",
    },
    "AllPokemonFullHpRestoreModifierType": {
      description: "Restaure tous les PV de toute l'équipe.",
    },
    "AllPokemonFullReviveModifierType": {
      description: "Réanime et restaure tous les PV de tous les Pokémon K.O.",
    },
    "MoneyRewardModifierType": {
      description: "Octroie une {{moneyMultiplier}} somme d’argent ({{moneyAmount}}₽).",
      extra: {
        "small": "petite",
        "moderate": "moyenne",
        "large": "grande",
      },
    },
    "ExpBoosterModifierType": {
      description: "Augmente de {{boostPercent}}% le gain de Points d’Exp.",
    },
    "PokemonExpBoosterModifierType": {
      description: "Augmente de {{boostPercent}}% le gain de Points d’Exp du porteur.",
    },
    "PokemonFriendshipBoosterModifierType": {
      description: "Augmente le gain d’amitié de 50% par victoire.",
    },
    "PokemonMoveAccuracyBoosterModifierType": {
      description: "Augmente de {{accuracyAmount}} la précision des capacités (maximum 100).",
    },
    "PokemonMultiHitModifierType": {
	  description: "Frappe une fois de plus en échange d’une baisse de puissance de respectivement 60/75/82,5% par cumul.",
    },
    "TmModifierType": {
      name: "CT{{moveId}} - {{moveName}}",
      description: "Apprend la capacité {{moveName}} à un Pokémon.",
    },
    "TmModifierTypeWithInfo": {
      name: "CT{{moveId}} - {{moveName}}",
      description: "Apprend la capacité {{moveName}} à un Pokémon\n(Hold C or Shift for more info).",
    },
    "EvolutionItemModifierType": {
      description: "Permet à certains Pokémon d’évoluer.",
    },
    "FormChangeItemModifierType": {
      description: "Permet à certains Pokémon de changer de forme.",
    },
    "FusePokemonModifierType": {
      description: "Fusionne deux Pokémon (transfère le Talent, sépare les stats de base et les types, partage le movepool).",
    },
    "TerastallizeModifierType": {
      name: "Téra-Éclat {{teraType}}",
      description: "{{teraType}} Téracristallise son porteur pendant 10 combats.",
    },
    "ContactHeldItemTransferChanceModifierType": {
      description: "{{chancePercent}}% de chances de voler un objet de l’adversaire en l’attaquant.",
    },
    "TurnHeldItemTransferModifierType": {
      description: "À chaque tour, son porteur obtient un objet de son adversaire.",
    },
    "EnemyAttackStatusEffectChanceModifierType": {
      description: "Ajoute {{chancePercent}}% de chances d’infliger le statut {{statusEffect}} avec des capacités offensives.",
    },
    "EnemyEndureChanceModifierType": {
      description: "Ajoute {{chancePercent}}% de chances d’encaisser un coup.",
    },

    "RARE_CANDY": { name: "Super Bonbon" },
    "RARER_CANDY": { name: "Hyper Bonbon" },

    "MEGA_BRACELET": { name: "Méga-Bracelet", description: "Débloque les Méga-Gemmes." },
    "DYNAMAX_BAND": { name: "Poignet Dynamax", description: "Débloque le Dynamax." },
    "TERA_ORB": { name: "Orbe Téracristal", description: "Débloque les Téra-Éclats." },

    "MAP": { name: "Carte", description: "Vous permet de choisir votre destination à un croisement." },

    "POTION": { name: "Potion" },
    "SUPER_POTION": { name: "Super Potion" },
    "HYPER_POTION": { name: "Hyper Potion" },
    "MAX_POTION": { name: "Potion Max" },
    "FULL_RESTORE": { name: "Guérison" },

    "REVIVE": { name: "Rappel" },
    "MAX_REVIVE": { name: "Rappel Max" },

    "FULL_HEAL": { name: "Total Soin" },

    "SACRED_ASH": { name: "Cendre Sacrée" },

    "REVIVER_SEED": { name: "Résugraine", description: "Réanime et restaure la moitié des PV de son porteur s’il tombe K.O." },

    "ETHER": { name: "Huile" },
    "MAX_ETHER": { name: "Huile Max" },

    "ELIXIR": { name: "Élixir" },
    "MAX_ELIXIR": { name: "Élixir Max" },

    "PP_UP": { name: "PP Plus" },
    "PP_MAX": { name: "PP Max" },

    "LURE": { name: "Parfum" },
    "SUPER_LURE": { name: "Super Parfum" },
    "MAX_LURE": { name: "Parfum Max" },

    "MEMORY_MUSHROOM": { name: "Champi Mémoriel", description: "Remémore une capacité à un Pokémon." },

    "EXP_SHARE": { name: "Multi Exp", description: "Tous les non-participants reçoivent 20% des Points d’Exp d’un participant." },
    "EXP_BALANCE": { name: "Équilibr’Exp", description: "Équilibre les Points d’Exp à l’avantage des membres de l’équipe aux plus bas niveaux." },

    "OVAL_CHARM": { name: "Charme Ovale", description: "Quand plusieurs Pokémon sont en combat, chacun gagne 10% supplémentaires du total d’Exp." },

    "EXP_CHARM": { name: "Charme Exp" },
    "SUPER_EXP_CHARM": { name: "Super Charme Exp" },
    "GOLDEN_EXP_CHARM": { name: "Charme Exp Doré" },

    "LUCKY_EGG": { name: "Œuf Chance" },
    "GOLDEN_EGG": { name: "Œuf d’Or" },

    "SOOTHE_BELL": { name: "Grelot Zen" },

    "SOUL_DEW": { name: "Rosée Âme", description: "Augmente de 10% l’influence de la nature d’un Pokémon sur ses statistiques (cumulatif)." },

    "NUGGET": { name: "Pépite" },
    "BIG_NUGGET": { name: "Maxi Pépite" },
    "RELIC_GOLD": { name: "Vieux Ducat" },

    "AMULET_COIN": { name: "Pièce Rune", description: "Augmente de 20% les gains d’argent." },
    "GOLDEN_PUNCH": { name: "Poing Doré", description: "50% des dégâts infligés sont convertis en argent." },
    "COIN_CASE": { name: "Boite Jetons", description: "Tous les 10 combats, recevez 10% de votre argent en intérêts." },

    "LOCK_CAPSULE": { name: "Poké Écrin", description: "Permet de verrouiller des objets rares si vous relancez les objets proposés." },

    "GRIP_CLAW": { name: "Accro Griffe" },
    "WIDE_LENS": { name: "Loupe" },

    "MULTI_LENS": { name: "Lentille Multi" },

    "HEALING_CHARM": { name: "Charme Soin", description: "Augmente de 10% l’efficacité des capacités et objets de soin de PV (hors Rappels)." },
    "CANDY_JAR": { name: "Bonbonnière", description: "Augmente de 1 le nombre de niveaux gagnés à l’utilisation d’un Super Bonbon." },

    "BERRY_POUCH": { name: "Sac à Baies", description: "Ajoute 30% de chances qu’une Baie utilisée ne soit pas consommée." },

    "FOCUS_BAND": { name: "Bandeau", description: "Ajoute 10% de chances de survivre avec 1 PV si les dégâts reçus pouvaient mettre K.O." },

    "QUICK_CLAW": { name: "Vive Griffe", description: "Ajoute 10% de chances d’agir en premier, indépendamment de la vitesse (après la priorité)." },

    "KINGS_ROCK": { name: "Roche Royale", description: "Ajoute 10% de chances qu’une capacité offensive apeure l’adversaire." },

    "LEFTOVERS": { name: "Restes", description: "Soigne à chaque tour 1/16 des PV max d’un Pokémon." },
    "SHELL_BELL": { name: "Grelot Coque", description: "Soigne 1/8 des dégâts infligés par un Pokémon." },

    "TOXIC_ORB": { name: "Orbe Toxique", description: "Un orbe bizarre qui empoisonne gravement son porteur durant le combat." },
    "FLAME_ORB": { name: "Orbe Flamme", description: "Un orbe bizarre qui brûle son porteur durant le combat." },

    "BATON": { name: "Bâton", description: "Permet de transmettre les effets en cas de changement de Pokémon. Ignore les pièges." },

    "SHINY_CHARM": { name: "Charme Chroma", description: "Augmente énormément les chances de rencontrer un Pokémon sauvage chromatique." },
    "ABILITY_CHARM": { name: "Charme Talent", description: "Augmente énormément les chances de rencontrer un Pokémon sauvage avec un Talent Caché." },

    "IV_SCANNER": { name: "Scanner d’IV", description: "Révèle la qualité de deux IV d’un Pokémon sauvage par scanner possédé. Les meilleurs IV sont révélés en priorité." },

    "DNA_SPLICERS": { name: "Pointeau ADN" },

    "MINI_BLACK_HOLE": { name: "Mini Trou Noir" },

    "GOLDEN_POKEBALL": { name: "Poké Ball Dorée", description: "Ajoute un choix d’objet à la fin de chaque combat" },

    "ENEMY_DAMAGE_BOOSTER": { name: "Jeton Dégâts", description: "Augmente les dégâts de 5%." },
    "ENEMY_DAMAGE_REDUCTION": { name: "Jeton Protection", description: "Diminue les dégâts reçus de 2,5%." },
    "ENEMY_HEAL": { name: "Jeton Soin", description: "Soigne 2% des PV max à chaque tour." },
    "ENEMY_ATTACK_POISON_CHANCE": { name: "Jeton Poison" },
    "ENEMY_ATTACK_PARALYZE_CHANCE": { name: "Jeton Paralysie" },
    "ENEMY_ATTACK_BURN_CHANCE": { name: "Jeton Brulure" },
    "ENEMY_STATUS_EFFECT_HEAL_CHANCE": { name: "Jeton Total Soin", description: "Ajoute 2.5% de chances à chaque tour de se soigner d’un problème de statut." },
    "ENEMY_ENDURE_CHANCE": { name: "Jeton Ténacité" },
    "ENEMY_FUSED_CHANCE": { name: "Jeton Fusion", description: "Ajoute 1% de chances qu’un Pokémon sauvage soit une fusion." },
  },
  TempBattleStatBoosterItem: {
    "x_attack": "Attaque +",
    "x_defense": "Défense +",
    "x_sp_atk": "Atq. Spé. +",
    "x_sp_def": "Déf. Spé. +",
    "x_speed": "Vitesse +",
    "x_accuracy": "Précision +",
    "dire_hit": "Muscle +",
  },

  TempBattleStatBoosterStatName: {
    "ATK": "Attaque",
    "DEF": "Défense",
    "SPATK": "Atq. Spé.",
    "SPDEF": "Déf. Spé.",
    "SPD": "Vitesse",
    "ACC": "Précision",
    "CRIT": "Taux de critique",
    "EVA": "Esquive",
    "DEFAULT": "???",
  },

  AttackTypeBoosterItem: {
    "silk_scarf": "Mouchoir Soie",
    "black_belt": "Ceinture Noire",
    "sharp_beak": "Bec Pointu",
    "poison_barb": "Pic Venin",
    "soft_sand": "Sable Doux",
    "hard_stone": "Pierre Dure",
    "silver_powder": "Poudre Argentée",
    "spell_tag": "Rune Sort",
    "metal_coat": "Peau Métal",
    "charcoal": "Charbon",
    "mystic_water": "Eau Mystique",
    "miracle_seed": "Graine Miracle",
    "magnet": "Aimant",
    "twisted_spoon": "Cuillère Tordue",
    "never_melt_ice": "Glace Éternelle",
    "dragon_fang": "Croc Dragon",
    "black_glasses": "Lunettes Noires",
    "fairy_feather": "Plume Enchantée",
  },
  BaseStatBoosterItem: {
    "hp_up": "PV Plus",
    "protein": "Protéine",
    "iron": "Fer",
    "calcium": "Calcium",
    "zinc": "Zinc",
    "carbos": "Carbone",
  },
  EvolutionItem: {
    "NONE": "Aucun",

    "LINKING_CORD": "Fil de Liaison",
    "SUN_STONE": "Pierre Soleil",
    "MOON_STONE": "Pierre Lune",
    "LEAF_STONE": "Pierre Plante",
    "FIRE_STONE": "Pierre Feu",
    "WATER_STONE": "Pierre Eau",
    "THUNDER_STONE": "Pierre Foudre",
    "ICE_STONE": "Pierre Glace",
    "DUSK_STONE": "Pierre Nuit",
    "DAWN_STONE": "Pierre Aube",
    "SHINY_STONE": "Pierre Éclat",
    "CRACKED_POT": "Théière Fêlée",
    "SWEET_APPLE": "Pomme Sucrée",
    "TART_APPLE": "Pomme Acidulée",
    "STRAWBERRY_SWEET": "Fraise en Sucre",
    "UNREMARKABLE_TEACUP": "Bol Médiocre",

    "CHIPPED_POT": "Théière Ébréchée",
    "BLACK_AUGURITE": "Obsidienne",
    "GALARICA_CUFF": "Bracelet Galanoa",
    "GALARICA_WREATH": "Couronne Galanoa",
    "PEAT_BLOCK": "Bloc de Tourbe",
    "AUSPICIOUS_ARMOR": "Armure de la Fortune",
    "MALICIOUS_ARMOR": "Armure de la Rancune",
    "MASTERPIECE_TEACUP": "Bol Exceptionnel",
    "METAL_ALLOY": "Métal Composite",
    "SCROLL_OF_DARKNESS": "Rouleau des Ténèbres",
    "SCROLL_OF_WATERS": "Rouleau de l’Eau",
    "SYRUPY_APPLE": "Pomme Nectar",
  },
  FormChangeItem: {
    "NONE": "Aucun",

    "ABOMASITE": "Blizzarite",
    "ABSOLITE": "Absolite",
    "AERODACTYLITE": "Ptéraïte",
    "AGGRONITE": "Galekingite",
    "ALAKAZITE": "Alakazamite",
    "ALTARIANITE": "Altarite",
    "AMPHAROSITE": "Pharampite",
    "AUDINITE": "Nanméouïte",
    "BANETTITE": "Branettite",
    "BEEDRILLITE": "Dardargnite",
    "BLASTOISINITE": "Tortankite",
    "BLAZIKENITE": "Braségalite",
    "CAMERUPTITE": "Caméruptite",
    "CHARIZARDITE_X": "Dracaufite X",
    "CHARIZARDITE_Y": "Dracaufite Y",
    "DIANCITE": "Diancite",
    "GALLADITE": "Gallamite",
    "GARCHOMPITE": "Carchacrokite",
    "GARDEVOIRITE": "Gardevoirite",
    "GENGARITE": "Ectoplasmite",
    "GLALITITE": "Oniglalite",
    "GYARADOSITE": "Léviatorite",
    "HERACRONITE": "Scarhinoïte",
    "HOUNDOOMINITE": "Démolossite",
    "KANGASKHANITE": "Kangourexite",
    "LATIASITE": "Latiasite",
    "LATIOSITE": "Latiosite",
    "LOPUNNITE": "Lockpinite",
    "LUCARIONITE": "Lucarite",
    "MANECTITE": "Élecsprintite",
    "MAWILITE": "Mysdibulite",
    "MEDICHAMITE": "Charminite",
    "METAGROSSITE": "Métalossite",
    "MEWTWONITE_X": "Mewtwoïte X",
    "MEWTWONITE_Y": "Mewtwoïte Y",
    "PIDGEOTITE": "Roucarnagite",
    "PINSIRITE": "Scarabruite",
    "RAYQUAZITE": "Rayquazite",
    "SABLENITE": "Ténéfixite",
    "SALAMENCITE": "Drattakite",
    "SCEPTILITE": "Jungkite",
    "SCIZORITE": "Cizayoxite",
    "SHARPEDONITE": "Sharpedite",
    "SLOWBRONITE": "Flagadossite",
    "STEELIXITE": "Steelixite",
    "SWAMPERTITE": "Laggronite",
    "TYRANITARITE": "Tyranocivite",
    "VENUSAURITE": "Florizarrite",

    "BLUE_ORB": "Gemme Bleue",
    "RED_ORB": "Gemme Rouge",
    "SHARP_METEORITE": "Méteorite Aiguisée",
    "HARD_METEORITE": "Méteorite Solide",
    "SMOOTH_METEORITE": "Méteorite Lisse",
    "ADAMANT_CRYSTAL": "Globe Adamant",
    "LUSTROUS_GLOBE": "Globe Perlé",
    "GRISEOUS_CORE": "Globe Platiné",
    "REVEAL_GLASS": "Miroir Sacré",
    "GRACIDEA": "Gracidée",
    "MAX_MUSHROOMS": "Maxi Champis",
    "DARK_STONE": "Galet Noir",
    "LIGHT_STONE": "Galet Blanc",
    "PRISON_BOTTLE": "Vase Scellé",
    "N_LUNARIZER": "Necroluna",
    "N_SOLARIZER": "Necrosol",
    "RUSTED_SWORD": "Épée Rouillée",
    "RUSTED_SHIELD": "Bouclier Rouillé",
    "ICY_REINS_OF_UNITY": "Rênes de l’Unité du Froid",
    "SHADOW_REINS_OF_UNITY": "Rênes de l’Unité d’Effroi",
    "WELLSPRING_MASK": "Masque du Puits",
    "HEARTHFLAME_MASK": "Masque du Fourneau",
    "CORNERSTONE_MASK": "Masque de la Pierre",
    "SHOCK_DRIVE": "Module Choc",
    "BURN_DRIVE": "Module Pyro",
    "CHILL_DRIVE": "Module Cryo",
    "DOUSE_DRIVE": "Module Aqua",

    "FIST_PLATE": "Plaque Poing",
    "SKY_PLATE": "Plaque Ciel",
    "TOXIC_PLATE": "Plaque Toxicité",
    "EARTH_PLATE": "Plaque Terre",
    "STONE_PLATE": "Plaque Roc",
    "INSECT_PLATE": "Plaque Insecte",
    "SPOOKY_PLATE": "Plaque Fantôme",
    "IRON_PLATE": "Plaque Fer",
    "FLAME_PLATE": "Plaque Flamme",
    "SPLASH_PLATE": "Plaque Hydro",
    "MEADOW_PLATE": "Plaque Herbe",
    "ZAP_PLATE": "Plaque Volt",
    "MIND_PLATE": "Plaque Esprit",
    "ICICLE_PLATE": "Plaque Glace",
    "DRACO_PLATE": "Plaque Draco",
    "DREAD_PLATE": "Plaque Ombre",
    "PIXIE_PLATE": "Plaque Pixie",
    "BLANK_PLATE": "Plaque Renouveau",
    "LEGEND_PLATE": "Plaque Légende",
    "FIGHTING_MEMORY": "ROM Combat",
    "FLYING_MEMORY": "ROM Vol",
    "POISON_MEMORY": "ROM Poison",
    "GROUND_MEMORY": "ROM Sol",
    "ROCK_MEMORY": "ROM Roche",
    "BUG_MEMORY": "ROM Insecte",
    "GHOST_MEMORY": "ROM Spectre",
    "STEEL_MEMORY": "ROM Acier",
    "FIRE_MEMORY": "ROM Feu",
    "WATER_MEMORY": "ROM Eau",
    "GRASS_MEMORY": "ROM Plante",
    "ELECTRIC_MEMORY": "ROM Électrik",
    "PSYCHIC_MEMORY": "ROM Psy",
    "ICE_MEMORY": "ROM Glace",
    "DRAGON_MEMORY": "ROM Dragon",
    "DARK_MEMORY": "ROM Ténèbres",
    "FAIRY_MEMORY": "ROM Fée",
    "BLANK_MEMORY": "ROM Vierge",
  },
} as const;
