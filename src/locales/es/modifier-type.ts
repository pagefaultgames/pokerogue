import { ModifierTypeTranslationEntries } from "#app/plugins/i18n";

export const modifierType: ModifierTypeTranslationEntries = {
  ModifierType: {
    "AddPokeballModifierType": {
      name: "{{modifierCount}}x {{pokeballName}}",
      description: "Recibes {{modifierCount}}x {{pokeballName}} (En inventario: {{pokeballAmount}}) \nRatio de captura: {{catchRate}}",
    },
    "AddVoucherModifierType": {
      name: "{{modifierCount}}x {{voucherTypeName}}",
      description: "Recibes {{modifierCount}}x {{voucherTypeName}}",
    },
    "PokemonHeldItemModifierType": {
      extra: {
        "inoperable": "¡{{pokemonName}} no puede\nrecibir este objeto!",
        "tooMany": "¡{{pokemonName}} tiene este objeto\ndemasiadas veces!",
      }
    },
    "PokemonHpRestoreModifierType": {
      description: "Restaura {{restorePoints}} PS o, al menos, un {{restorePercent}}% PS de un Pokémon",
      extra: {
        "fully": "Restaura todos los PS de un Pokémon",
        "fullyWithStatus": "Restaura todos los PS de un Pokémon y cura todos los problemas de estados",
      }
    },
    "PokemonReviveModifierType": {
      description: "Revive a un Pokémon y restaura {{restorePercent}}% PS",
    },
    "PokemonStatusHealModifierType": {
      description: "Cura todos los problemas de estados de un Pokémon",
    },
    "PokemonPpRestoreModifierType": {
      description: "Restaura {{restorePoints}} PP del movimiento que elijas de un Pokémon",
      extra: {
        "fully": "Restaura todos los PP del movimiento que elijas de un Pokémon",
      }
    },
    "PokemonAllMovePpRestoreModifierType": {
      description: "Restaura {{restorePoints}} PP de todos los movimientos de un Pokémon",
      extra: {
        "fully": "Restaura todos los PP de todos los movimientos de un Pokémon",
      }
    },
    "PokemonPpUpModifierType": {
      description: "Aumenta permanentemente los PP para un movimiento de un Pokémon en {{upPoints}} por cada 5 PP máximo (máximo 3)",
    },
    "PokemonNatureChangeModifierType": {
      name: "Menta {{natureName}}",
      description: "Cambia la naturaleza de un Pokémon a {{natureName}} y desbloquea permanentemente dicha naturaleza para el inicial",
    },
    "DoubleBattleChanceBoosterModifierType": {
      description: "Duplica la posibilidad de que un encuentro sea una combate doble durante {{battleCount}} combates",
    },
    "TempBattleStatBoosterModifierType": {
      description: "Aumenta la est. {{tempBattleStatName}} de todos los miembros del equipo en 1 nivel durante 5 combates",
    },
    "AttackTypeBoosterModifierType": {
      description: "Aumenta la potencia de los movimientos de tipo {{moveType}} de un Pokémon en un 20%",
    },
    "PokemonLevelIncrementModifierType": {
      description: "Aumenta el nivel de un Pokémon en 1",
    },
    "AllPokemonLevelIncrementModifierType": {
      description: "Aumenta el nivel de todos los miembros del equipo en 1",
    },
    "PokemonBaseStatBoosterModifierType": {
      description: "Aumenta la est. {{statName}} base del portador en un 10%.\nCuanto mayores sean tus IVs, mayor será el límite de acumulación",
    },
    "AllPokemonFullHpRestoreModifierType": {
      description: "Restaura el 100% de los PS de todos los Pokémon",
    },
    "AllPokemonFullReviveModifierType": {
      description: "Revive a todos los Pokémon debilitados y restaura completamente sus PS",
    },
    "MoneyRewardModifierType": {
      description: "Otorga una {{moneyMultiplier}} cantidad de dinero (₽{{moneyAmount}})",
      extra: {
        "small": "pequeña",
        "moderate": "moderada",
        "large": "gran",
      },
    },
    "ExpBoosterModifierType": {
      description: "Aumenta la ganancia de EXP en un {{boostPercent}}%",
    },
    "PokemonExpBoosterModifierType": {
      description: "Aumenta la ganancia de EXP del portador en un {{boostPercent}}%",
    },
    "PokemonFriendshipBoosterModifierType": {
      description: "Aumenta la ganancia de amistad por victoria en un 50%",
    },
    "PokemonMoveAccuracyBoosterModifierType": {
      description: "Aumenta la precisión de los movimiento en un {{accuracyAmount}} (máximo 100)",
    },
    "PokemonMultiHitModifierType": {
      description: "Los ataques golpean una vez más a costa de una reducción de poder del 60/75/82,5% por cada objeto",
    },
    "TmModifierType": {
      name: "MT{{moveId}} - {{moveName}}",
      description: "Enseña {{moveName}} a un Pokémon",
    },
    "EvolutionItemModifierType": {
      description: "Hace que ciertos Pokémon evolucionen",
    },
    "FormChangeItemModifierType": {
      description: "Hace que ciertos Pokémon cambien de forma",
    },
    "FusePokemonModifierType": {
      description: "Fusiona dos Pokémon (transfiere habilidades, divide estadísticas bases y tipos, comparte movimientos)",
    },
    "TerastallizeModifierType": {
      name: "Teralito {{teraType}}",
      description: "Teracristaliza al portador al tipo {{teraType}} durante 10 combates",
    },
    "ContactHeldItemTransferChanceModifierType": {
      description: "Al atacar, hay un {{chancePercent}}% de posibilidades de que robes el objeto que tiene el enemigo",
    },
    "TurnHeldItemTransferModifierType": {
      description: "Cada turno, el portador roba un objeto del enemigo",
    },
    "EnemyAttackStatusEffectChanceModifierType": {
      description: "Agrega un {{chancePercent}}% de probabilidad de infligir {{statusEffect}} con movimientos de ataque",
    },
    "EnemyEndureChanceModifierType": {
      description: "Agrega un {{chancePercent}}% de probabilidad de resistir un ataque que lo debilitaría",
    },

    "RARE_CANDY": { name: "Carameloraro" },
    "RARER_CANDY": { name: "Rarer Candy" },

    "MEGA_BRACELET": { name: "Mega-aro", description: "Las Megapiedras están disponibles" },
    "DYNAMAX_BAND": { name: "Maximuñequera", description: "Las Maxisetas están disponibles" },
    "TERA_ORB": { name: "Orbe Teracristal", description: "Los Teralitos están disponibles" },

    "MAP": { name: "Mapa", description: "Te permite elegir tu camino al final del bioma" },

    "POTION": { name: "Poción" },
    "SUPER_POTION": { name: "Superpoción" },
    "HYPER_POTION": { name: "Hiperpoción" },
    "MAX_POTION": { name: "Máx. Poción" },
    "FULL_RESTORE": { name: "Restau. Todo" },

    "REVIVE": { name: "Revivir" },
    "MAX_REVIVE": { name: "Máx. Revivir" },

    "FULL_HEAL": { name: "Cura Total" },

    "SACRED_ASH": { name: "Cen. Sagrada" },

    "REVIVER_SEED": { name: "Semilla Revivir", description: "Revive al portador con la mitad de sus PS al debilitarse" },

    "ETHER": { name: "Éter" },
    "MAX_ETHER": { name: "Éter Máx." },

    "ELIXIR": { name: "Elixir" },
    "MAX_ELIXIR": { name: "Elixir Máx." },

    "PP_UP": { name: "Más PP" },
    "PP_MAX": { name: "Máx PP" },

    "LURE": { name: "Lure" },
    "SUPER_LURE": { name: "Super Lure" },
    "MAX_LURE": { name: "Max Lure" },

    "MEMORY_MUSHROOM": { name: "Memory Mushroom", description: "Recall one Pokémon's forgotten move" },

    "EXP_SHARE": { name: "Repartir EXP", description: "Los que no combatan reciben el 20% de la EXP" },
    "EXP_BALANCE": { name: "EXP. Balance", description: "Da mayor parte de la EXP recibida a los miembros del equipo que tengan menos nivel" },

    "OVAL_CHARM": { name: "Amuleto Oval", description: "Cada Pokémon combatiente recibe un 10% adicional de la EXP total" },

    "EXP_CHARM": { name: "Amuleto EXP" },
    "SUPER_EXP_CHARM": { name: "Super Amuleto EXP" },
    "GOLDEN_EXP_CHARM": { name: "Amuleto EXP Dorado" },

    "LUCKY_EGG": { name: "Huevo Suerte" },
    "GOLDEN_EGG": { name: "Huevo Dorado" },

    "SOOTHE_BELL": { name: "Camp. Alivio" },

    "SOUL_DEW": { name: "Rocío bondad", description: "Aumenta la influencia de la naturaleza de un Pokémon en sus estadísticas en un 10% (aditivo)" },

    "NUGGET": { name: "Pepita" },
    "BIG_NUGGET": { name: "Maxipepita" },
    "RELIC_GOLD": { name: "Real de oro" },

    "AMULET_COIN": { name: "Moneda Amuleto", description: "Aumenta el dinero ganado en un 20%" },
    "GOLDEN_PUNCH": { name: "Puño Dorado", description: "Otorga el 50% del daño infligido como dinero" },
    "COIN_CASE": { name: "Monedero", description: "Después de cada 10 combates, recibe el 10% de tu dinero en intereses" },

    "LOCK_CAPSULE": { name: "Cápsula candado", description: "Le permite bloquear las rarezas de los objetos al cambiar de objetos" },

    "GRIP_CLAW": { name: "Garra Garfio" },
    "WIDE_LENS": { name: "Lupa" },

    "MULTI_LENS": { name: "Multi Lens" },

    "HEALING_CHARM": { name: "Amuleto curación", description: "Aumenta la efectividad de los movimientos y objetos de curacion de PS en un 10% (excepto revivir)" },
    "CANDY_JAR": { name: "Candy Jar", description: "Aumenta en 1 el número de niveles añadidos por los carameloraros" },

    "BERRY_POUCH": { name: "Saco Bayas", description: "Agrega un 30% de posibilidades de que una baya usada no se consuma" },

    "FOCUS_BAND": { name: "Cinta Focus", description: "Agrega un 10% de probabilidad de resistir un ataque que lo debilitaría" },

    "QUICK_CLAW": { name: "Garra Rápida", description: "Agrega un 10% de probabilidad de atacar primero independientemente de la velocidad (después de la prioridad)" },

    "KINGS_ROCK": { name: "Roca del Rey", description: "Agrega un 10% de probabilidad de que un ataque haga que el oponente retroceda" },

    "LEFTOVERS": { name: "Restos", description: "Cura 1/16 de los PS máximo de un Pokémon cada turno" },
    "SHELL_BELL": { name: "Camp Concha", description: "Cura 1/8 del daño infligido por un Pokémon" },

    "TOXIC_ORB": { name: "Toxiesfera", description: "Extraña esfera que envenena gravemente a quien la usa en combate" },
    "FLAME_ORB": { name: "Llamasfera", description: "Extraña esfera que causa quemaduras a quien la usa en combate" },

    "BATON": { name: "Baton", description: "Permite pasar los efectos al cambiar de Pokémon, también evita las trampas" },

    "SHINY_CHARM": { name: "Amuleto Iris", description: "Aumenta drásticamente la posibilidad de que un Pokémon salvaje sea Shiny" },
    "ABILITY_CHARM": { name: "Amuleto Habilidad", description: "Aumenta drásticamente la posibilidad de que un Pokémon salvaje tenga una habilidad oculta" },

    "IV_SCANNER": { name: "Escáner IV", description: "Permite escanear los IVs de Pokémon salvajes. Se revelan 2 IVs por cada objeto.\nLos mejores IVs se muestran primero" },

    "DNA_SPLICERS": { name: "Punta ADN" },

    "MINI_BLACK_HOLE": { name: "Mini Agujero Negro" },

    "GOLDEN_POKEBALL": { name: "Poké Ball Dorada", description: "Agrega 1 opción de objeto extra al final de cada combate" },

    "ENEMY_DAMAGE_BOOSTER": { name: "Damage Token", description: "Aumenta el daño en un 5%" },
    "ENEMY_DAMAGE_REDUCTION": { name: "Protection Token", description: "Reduce el daño recibido en un 2,5%" },
    "ENEMY_HEAL": { name: "Recovery Token", description: "Cura el 2% de los PS máximo en cada turno" },
    "ENEMY_ATTACK_POISON_CHANCE": { name: "Poison Token" },
    "ENEMY_ATTACK_PARALYZE_CHANCE": { name: "Paralyze Token" },
    "ENEMY_ATTACK_BURN_CHANCE": { name: "Burn Token" },
    "ENEMY_STATUS_EFFECT_HEAL_CHANCE": { name: "Full Heal Token", description: "Agrega un 2.5% de probabilidad cada turno de curar un problema de estado" },
    "ENEMY_ENDURE_CHANCE": { name: "Endure Token" },
    "ENEMY_FUSED_CHANCE": { name: "Fusion Token", description: "Agrega un 1% de probabilidad de que un Pokémon salvaje sea una fusión" },
  },
  TempBattleStatBoosterItem: {
    "x_attack": "Ataque X",
    "x_defense": "Defensa X",
    "x_sp_atk": "Ataq. Esp. X",
    "x_sp_def": "Def. Esp. X",
    "x_speed": "Velocidad X",
    "x_accuracy": "Precisión X",
    "dire_hit": "Crítico X",
  },
  AttackTypeBoosterItem: {
    "silk_scarf": "Pañuelo Seda",
    "black_belt": "Cinturón Negro",
    "sharp_beak": "Pico Afilado",
    "poison_barb": "Flecha Venenosa",
    "soft_sand": "Arena Fina",
    "hard_stone": "Piedra Dura",
    "silver_powder": "Polvo Plata",
    "spell_tag": "Hechizo",
    "metal_coat": "Rev. Metálico",
    "charcoal": "Carbón",
    "mystic_water": "Agua Mística",
    "miracle_seed": "Semilla Milagro",
    "magnet": "Imán",
    "twisted_spoon": "Cuchara Torcida",
    "never_melt_ice": "Antiderretir",
    "dragon_fang": "Colmillo Dragón",
    "black_glasses": "Gafas de Sol",
    "fairy_feather": "Pluma Hada",
  },
  BaseStatBoosterItem: {
    "hp_up": "Más PS",
    "protein": "Proteína",
    "iron": "Hierro",
    "calcium": "Calcio",
    "zinc": "Zinc",
    "carbos": "Carburante",
  },
  EvolutionItem: {
    "NONE": "None",

    "LINKING_CORD": "Cordón Unión",
    "SUN_STONE": "Piedra Solar",
    "MOON_STONE": "Piedra Lunar",
    "LEAF_STONE": "Piedra Hoja",
    "FIRE_STONE": "Piedra Fuego",
    "WATER_STONE": "Piedra Agua",
    "THUNDER_STONE": "Piedra Trueno",
    "ICE_STONE": "Piedra Hielo",
    "DUSK_STONE": "Piedra Noche",
    "DAWN_STONE": "Piedra Alba",
    "SHINY_STONE": "Piedra Día",
    "CRACKED_POT": "Tetera Agrietada",
    "SWEET_APPLE": "Manzana Dulce",
    "TART_APPLE": "Manzana Ácida",
    "STRAWBERRY_SWEET": "Confite Fresa",
    "UNREMARKABLE_TEACUP": "Cuenco Mediocre",

    "CHIPPED_POT": "Tetera Rota",
    "BLACK_AUGURITE": "Mineral Negro",
    "GALARICA_CUFF": "Brazal Galanuez",
    "GALARICA_WREATH": "Corona Galanuez",
    "PEAT_BLOCK": "Bloque de Turba",
    "AUSPICIOUS_ARMOR": "Armadura Auspiciosa",
    "MALICIOUS_ARMOR": "Armadura Maldita",
    "MASTERPIECE_TEACUP": "Cuenco Exquisito",
    "METAL_ALLOY": "Metal Compuesto",
    "SCROLL_OF_DARKNESS": "Manuscrito Sombras",
    "SCROLL_OF_WATERS": "Manuscrito Aguas",
    "SYRUPY_APPLE": "Manzana Melosa",
  },
  FormChangeItem: {
    "NONE": "None",

    "ABOMASITE": "Abomasnowita",
    "ABSOLITE": "Absolita",
    "AERODACTYLITE": "Aerodactylita",
    "AGGRONITE": "Aggronita",
    "ALAKAZITE": "Alakazamita",
    "ALTARIANITE": "Altarianita",
    "AMPHAROSITE": "Ampharosita",
    "AUDINITE": "Audinita",
    "BANETTITE": "Banettita",
    "BEEDRILLITE": "Beedrillita",
    "BLASTOISINITE": "Blastoisita",
    "BLAZIKENITE": "Blazikenita",
    "CAMERUPTITE": "Cameruptita",
    "CHARIZARDITE_X": "Charizardita X",
    "CHARIZARDITE_Y": "Charizardita Y",
    "DIANCITE": "Diancita",
    "GALLADITE": "Galladita",
    "GARCHOMPITE": "Garchompita",
    "GARDEVOIRITE": "Gardevoirita",
    "GENGARITE": "Gengarita",
    "GLALITITE": "Glalita",
    "GYARADOSITE": "Gyaradosita",
    "HERACRONITE": "Heracrossita",
    "HOUNDOOMINITE": "Houndoomita",
    "KANGASKHANITE": "Kangaskhanita",
    "LATIASITE": "Latiasita",
    "LATIOSITE": "Latiosita",
    "LOPUNNITE": "Lopunnita",
    "LUCARIONITE": "Lucarita",
    "MANECTITE": "Manectricita",
    "MAWILITE": "Mawilita",
    "MEDICHAMITE": "Medichamita",
    "METAGROSSITE": "Metagrossita",
    "MEWTWONITE_X": "Mewtwoita X",
    "MEWTWONITE_Y": "Mewtwoita Y",
    "PIDGEOTITE": "Pidgeotita",
    "PINSIRITE": "Pinsirita",
    "RAYQUAZITE": "Rayquazita",
    "SABLENITE": "Sableynita",
    "SALAMENCITE": "Salamencita",
    "SCEPTILITE": "Sceptilita",
    "SCIZORITE": "Scizorita",
    "SHARPEDONITE": "Sharpedonita",
    "SLOWBRONITE": "Slowbronita",
    "STEELIXITE": "Steelixita",
    "SWAMPERTITE": "Swampertita",
    "TYRANITARITE": "Tyranitarita",
    "VENUSAURITE": "Venusaurita",

    "BLUE_ORB": "Prisma Azul",
    "RED_ORB": "Prisma Rojo",
    "SHARP_METEORITE": "Meteorito Afilado",
    "HARD_METEORITE": "Meteorito Duro",
    "SMOOTH_METEORITE": "Meteorito Suave",
    "ADAMANT_CRYSTAL": "Gran Diamansfera",
    "LUSTROUS_GLOBE": "Gran Lustresfera",
    "GRISEOUS_CORE": "Gran Griseosfera",
    "REVEAL_GLASS": "Espejo Veraz",
    "GRACIDEA": "Gracídea",
    "MAX_MUSHROOMS": "MaxiSetas",
    "DARK_STONE": "Piedra Oscura",
    "LIGHT_STONE": "Piedra Luminosa",
    "PRISON_BOTTLE": "Vasija Castigo",
    "N_LUNARIZER": "Necroluna",
    "N_SOLARIZER": "Necrosol",
    "RUSTED_SWORD": "Espada Oxidada",
    "RUSTED_SHIELD": "Escudo Oxidado",
    "ICY_REINS_OF_UNITY": "Riendas Unión Heladas",
    "SHADOW_REINS_OF_UNITY": "Riendas Unión Oscuras",
    "WELLSPRING_MASK": "Máscara Fuente",
    "HEARTHFLAME_MASK": "Máscara Horno",
    "CORNERSTONE_MASK": "Máscara Cimiento",
    "SHOCK_DRIVE": "FulgoROM",
    "BURN_DRIVE": "PiroROM",
    "CHILL_DRIVE": "CrioROM",
    "DOUSE_DRIVE": "HidroROM",
  },
} as const;
