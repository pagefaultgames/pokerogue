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
        "inoperable": "¡{{pokemonName}} no puede\ntener este objeto!",
        "tooMany": "¡{{pokemonName}} tiene este objeto\ndemasiada veces!",
      }
    },
    "PokemonHpRestoreModifierType": {
      description: "Restaura {{restorePoints}} PS o {{restorePercent}}% PS de un Pokémon, cualquiera de los dos sea el mas alto",
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
      description: "Cambia la naturaleza de un Pokémon a {{natureName}} y desbloquea permanentemente la naturaleza para el inicial",
    },
    "DoubleBattleChanceBoosterModifierType": {
      description: "Duplica la posibilidad de que un encuentro sea una combate doble por {{battleCount}} combates",
    },
    "TempBattleStatBoosterModifierType": {
      description: "Aumenta el {{tempBattleStatName}} de todos los miembros del equipo en 1 nivel para 5 combates",
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
      description: "Aumenta {{statName}} base del portador en un 10%. Cuanto mayores sean tus IV, mayor será el límite de acumulación",
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
        "small": "pequaña",
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
      description: "Teracristaliza al portador al tipo {{teraType}} por 10 combates",
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

    "MEGA_BRACELET": { name: "Mega-aro", description: "Las Megapiedras están disponible" },
    "DYNAMAX_BAND": { name: "Maximuñequera", description: "Las Maxisetas están disponible" },
    "TERA_ORB": { name: "Orbe Teracristal", description: "Los Teralitos están disponible" },

    "MAP": { name: "Mapa", description: "Te permite elegir tu destino" },

    "POTION": { name: "Poción" },
    "SUPER_POTION": { name: "Superpoción" },
    "HYPER_POTION": { name: "Hiperpoción" },
    "MAX_POTION": { name: "Máx. Poción" },
    "FULL_RESTORE": { name: "Restau. Todo" },

    "REVIVE": { name: "Revivir" },
    "MAX_REVIVE": { name: "Máx. Revivir" },

    "FULL_HEAL": { name: "Cura Total" },

    "SACRED_ASH": { name: "Cen Sagrada" },

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
    "EXP_BALANCE": { name: "EXP. Balance", description: "Reparte la EXP recibida a los miembros del equipo que tengan menos nivel" },

    "OVAL_CHARM": { name: "Amuleto Oval", description: "When multiple Pokémon participate in a battle, each gets an extra 10% of the total EXP" },

    "EXP_CHARM": { name: "Amuleto EXP" },
    "SUPER_EXP_CHARM": { name: "Super Amuleto EXP" },
    "GOLDEN_EXP_CHARM": { name: "Amuleto EXP Dorado" },

    "LUCKY_EGG": { name: "Huevo Suerte" },
    "GOLDEN_EGG": { name: "Huevo Dorado" },

    "SOOTHE_BELL": { name: "Camp Alivio" },

    "SOUL_DEW": { name: "Rocío bondad", description: "Aumenta la influencia de la naturaleza de un Pokémon en sus estadísticas en un 10% (aditivo)" },

    "NUGGET": { name: "Pepita" },
    "BIG_NUGGET": { name: "Maxipepita" },
    "RELIC_GOLD": { name: "Real de oro" },

    "AMULET_COIN": { name: "Moneda amuleto", description: "Aumenta el dinero ganado en un 20%" },
    "GOLDEN_PUNCH": { name: "Puño Dorado", description: "Otorga el 50% del daño infligido como dinero" },
    "COIN_CASE": { name: "Monedero", description: "Después de cada 10 combates, recibe el 10% de tu dinero en intereses" },

    "LOCK_CAPSULE": { name: "Cápsula candado", description: "Le permite bloquear las rarezas de los objetos al cambiar de objetos" },

    "GRIP_CLAW": { name: "Garra garfio" },
    "WIDE_LENS": { name: "Lupa" },

    "MULTI_LENS": { name: "Multi Lens" },

    "HEALING_CHARM": { name: "Amuleto curación", description: "Aumenta la efectividad de los movimientos y objetos de curacion de PS en un 10% (excepto revivir)" },
    "CANDY_JAR": { name: "Candy Jar", description: "Aumenta en 1 el número de niveles añadidos por los carameloraros" },

    "BERRY_POUCH": { name: "Saco Bayas", description: "Agrega un 33% de posibilidades de que una baya usada no se consuma" },

    "FOCUS_BAND": { name: "Cinta Focus", description: "Agrega un 10% de probabilidad de resistir un ataque que lo debilitaría" },

    "QUICK_CLAW": { name: "Garra Rápida", description: "Agrega un 10% de probabilidad de atacar primero independientemente de la velocidad (después de la prioridad)" },

    "KINGS_ROCK": { name: "Roca del Rey", description: "Agrega un 10% de probabilidad de que un ataque haga que el oponente retroceda" },

    "LEFTOVERS": { name: "Restos", description: "Cura 1/16 de los PS máximo de un Pokémon cada turno" },
    "SHELL_BELL": { name: "Camp Concha", description: "Cura 1/8 del daño infligido por un Pokémon" },

    "BATON": { name: "Baton", description: "Permite pasar los efectos al cambiar de Pokémon, también evita las trampas" },

    "SHINY_CHARM": { name: "Amuleto Iris", description: "Aumenta drásticamente la posibilidad de que un Pokémon salvaje sea Shiny" },
    "ABILITY_CHARM": { name: "Amuleto Habilidad", description: "Aumenta drásticamente la posibilidad de que un Pokémon salvaje tenga una habilidad oculta" },

    "IV_SCANNER": { name: "Escáner IV", description: "Permite escanear los IV de Pokémon salvajes. Se revelan 2 IV por cada objeto Los mejores IV se muestran primero" },

    "DNA_SPLICERS": { name: "Punta ADN" },

    "MINI_BLACK_HOLE": { name: "Mini Agujero Negro" },

    "GOLDEN_POKEBALL": { name: "Poké Ball Dorada", description: "Agrega 1 opción de objeto extra al final de cada combate" },

    "ENEMY_DAMAGE_BOOSTER": { name: "Damage Token", description: "Aumenta el daño en un 5%" },
    "ENEMY_DAMAGE_REDUCTION": { name: "Protection Token", description: "Reduce el daño recibido en un 2,5%" },
    "ENEMY_HEAL": { name: "Recovery Token", description: "Cura el 2% de los PS máximo en cada turno" },
    "ENEMY_ATTACK_POISON_CHANCE": { name: "Poison Token" },
    "ENEMY_ATTACK_PARALYZE_CHANCE": { name: "Paralyze Token" },
    "ENEMY_ATTACK_SLEEP_CHANCE": { name: "Sleep Token" },
    "ENEMY_ATTACK_FREEZE_CHANCE": { name: "Freeze Token" },
    "ENEMY_ATTACK_BURN_CHANCE": { name: "Burn Token" },
    "ENEMY_STATUS_EFFECT_HEAL_CHANCE": { name: "Full Heal Token", description: "Agrega un 10% de probabilidad cada turno de curar un problema de estado" },
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
    "dire_hit": "Directo",
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

    "LINKING_CORD": "Cordón unión",
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
    "CRACKED_POT": "Tetera agrietada",
    "SWEET_APPLE": "Manzana dulce",
    "TART_APPLE": "Manzana ácida",
    "STRAWBERRY_SWEET": "Confite fresa",
    "UNREMARKABLE_TEACUP": "Cuenco mediocre",

    "CHIPPED_POT": "Tetera rota",
    "BLACK_AUGURITE": "Mineral negro",
    "GALARICA_CUFF": "Brazal galanuez",
    "GALARICA_WREATH": "Corona galanuez",
    "PEAT_BLOCK": "Bloque de turba",
    "AUSPICIOUS_ARMOR": "Armadura auspiciosa",
    "MALICIOUS_ARMOR": "Armadura maldita",
    "MASTERPIECE_TEACUP": "Cuenco exquisito",
    "METAL_ALLOY": "Metal compuesto",
    "SCROLL_OF_DARKNESS": "Manuscrito sombras",
    "SCROLL_OF_WATERS": "Manuscrito aguas",
    "SYRUPY_APPLE": "Manzana melosa",
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

    "BLUE_ORB": "Blue Orb",
    "RED_ORB": "Red Orb",
    "SHARP_METEORITE": "Sharp Meteorite",
    "HARD_METEORITE": "Hard Meteorite",
    "SMOOTH_METEORITE": "Smooth Meteorite",
    "ADAMANT_CRYSTAL": "Adamant Crystal",
    "LUSTROUS_ORB": "Lustrous Orb",
    "GRISEOUS_CORE": "Griseous Core",
    "REVEAL_GLASS": "Reveal Glass",
    "GRACIDEA": "Gracidea",
    "MAX_MUSHROOMS": "Max Mushrooms",
    "DARK_STONE": "Dark Stone",
    "LIGHT_STONE": "Light Stone",
    "PRISON_BOTTLE": "Prison Bottle",
    "N_LUNARIZER": "N Lunarizer",
    "N_SOLARIZER": "N Solarizer",
    "RUSTED_SWORD": "Rusted Sword",
    "RUSTED_SHIELD": "Rusted Shield",
    "ICY_REINS_OF_UNITY": "Icy Reins Of Unity",
    "SHADOW_REINS_OF_UNITY": "Shadow Reins Of Unity",
    "WELLSPRING_MASK": "Wellspring Mask",
    "HEARTHFLAME_MASK": "Hearthflame Mask",
    "CORNERSTONE_MASK": "Cornerstone Mask",
    "SHOCK_DRIVE": "Shock Drive",
    "BURN_DRIVE": "Burn Drive",
    "CHILL_DRIVE": "Chill Drive",
    "DOUSE_DRIVE": "Douse Drive",
  },
} as const;
