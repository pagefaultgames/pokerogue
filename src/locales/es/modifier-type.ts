import { ModifierTypeTranslationEntries } from "#app/plugins/i18n";

export const modifierType: ModifierTypeTranslationEntries = {
  ModifierType: {
    "AddPokeballModifierType": {
      name: "{{modifierCount}}x {{pokeballName}}",
      description: "Recibir {{pokeballName}} x{{modifierCount}} (En bolsa: {{pokeballAmount}}) \nRatio de captura: {{catchRate}}",
    },
    "AddVoucherModifierType": {
      name: "{{modifierCount}}x {{voucherTypeName}}",
      description: "Recibir {{voucherTypeName}} x{{modifierCount}}",
    },
    "PokemonHeldItemModifierType": {
      extra: {
        "inoperable": "¡{{pokemonName}} no puede llevar\neste objeto!",
        "tooMany": "¡{{pokemonName}} tiene demasiados\nobjetos como este!",
      }
    },
    "PokemonHpRestoreModifierType": {
      description: "Restaura {{restorePoints}} PS {{restorePercent}}% PS, la que sea mejor.",
      extra: {
        "fully": "Restaura todos los PS de un Pokémon",
        "fullyWithStatus": "Restaura todos los PS de un Pokémon y cura cualquier problema de estado",
      }
    },
    "PokemonReviveModifierType": {
      description: "Revive un Pokémon restaurando {{restorePercent}}% de PS",
    },
    "PokemonStatusHealModifierType": {
      description: "Cura cualquier problema de estado de un Pokémon",
    },
    "PokemonPpRestoreModifierType": {
      description: "Restaura {{restorePoints}} PP de un movimiento de un Pokémon",
      extra: {
        "fully": "Restaura todos los PP de un movimiento de un Pokémon",
      }
    },
    "PokemonAllMovePpRestoreModifierType": {
      description: "Restaura {{restorePoints}} PP de todos los movimientos de un Pokémon",
      extra: {
        "fully": "Restaura todos los PP de todos los movimientos de un Pokémon",
      }
    },
    "PokemonPpUpModifierType": {
      description: "Sube permanente {{upPoints}} PP de un Pokémon por cada 5 PP máximos (máximo 3)",
    },
    "PokemonNatureChangeModifierType": {
      name: "{{natureName}} Mint",
      description: "Cambia la naturaleza de un Pokémon a {{natureName}} y desbloquea permanentemente dicha naturaleza para el inicial.",
    },
    "DoubleBattleChanceBoosterModifierType": {
      description: "Duplica la probabilidad de una batalla de ser un combate doble por {{battleCount}} batallas",
    },
    "TempBattleStatBoosterModifierType": {
      description: "Sube 1 nivel de {{tempBattleStatName}} de todos los miembros del equipo por 5 batallas",
    },
    "AttackTypeBoosterModifierType": {
      description: "Sube la potencia de movimientos tipo {{moveType}} un 20%",
    },
    "PokemonLevelIncrementModifierType": {
      description: "Sube un nivel a un Pokémon",
    },
    "AllPokemonLevelIncrementModifierType": {
      description: "Sube un nivel a todos los Pokémon del equipo",
    },
    "PokemonBaseStatBoosterModifierType": {
      description: "Sube el {{statName}} base del Pokémon que lo lleva 10%. Cuantos más IVs tenga, mayor es el límite.",
    },
    "AllPokemonFullHpRestoreModifierType": {
      description: "Restaura el 100% de PS de todos los Pokémon",
    },
    "AllPokemonFullReviveModifierType": {
      description: "Revive todos los Pokémon debilitados restaurando todos sus PS",
    },
    "MoneyRewardModifierType": {
      description: "Concede una cantidad de dinero {{moneyMultiplier}} (₽{{moneyAmount}})",
      extra: {
        "small": "pequeña",
        "moderate": "mediana",
        "large": "grande",
      },
    },
    "ExpBoosterModifierType": {
      description: "Sube los puntos de exp. ganados en {{boostPercent}}%",
    },
    "PokemonExpBoosterModifierType": {
      description: "Sube los puntos de exp. ganados por el Pokémon que lo lleva en {{boostPercent}}%",
    },
    "PokemonFriendshipBoosterModifierType": {
      description: "Sube la amistad ganada en 50%",
    },
    "PokemonMoveAccuracyBoosterModifierType": {
      description: "Sube la precisión del movimiento en {{accuracyAmount}} (máximo 100)",
    },
    "PokemonMultiHitModifierType": {
      description: "Los ataques pueden golpear una vez más a 60/75/82.5% menos de poder por objeto respectivamente",
    },
    "TmModifierType": {
      name: "TM{{moveId}} - {{moveName}}",
      description: "Enseña {{moveName}} a un Pokémon",
    },
    "EvolutionItemModifierType": {
      description: "Hace que ciertos Pokémon evolucionen",
    },
    "FormChangeItemModifierType": {
      description: "Hace que ciertos Pokémon cambien de forma",
    },
    "FusePokemonModifierType": {
      description: "Fusiona 2 Pokémon (transfiere Habilitad, separa las estadísticas base y tipos, comparte set de movimientos)",
    },
    "TerastallizeModifierType": {
      name: "{{teraType}} Tera Shard",
      description: "{{teraType}} Teracristaliza un Pokémon durante 10 batallas",
    },
    "ContactHeldItemTransferChanceModifierType": {
      description: "Tras atacar hay una probabilildad de {{chancePercent}}% de que el objeto del rival sea robado",
    },
    "TurnHeldItemTransferModifierType": {
      description: "Cada turno el Pokémon que lo lleva roba un objeto del rival",
    },
    "EnemyAttackStatusEffectChanceModifierType": {
      description: "Añade un {{chancePercent}}% de probabilidad de inflingir {{statusEffect}} con movimientos de ataque",
    },
    "EnemyEndureChanceModifierType": {
      description: "Añade un {{chancePercent}}% de probabilidad de sobrevivir un golpe",
    },

    "RARE_CANDY": { name: "Caramelo Raro" },
    "RARER_CANDY": { name: "Caramelo Rarísimo" },

    "MEGA_BRACELET": { name: "Mega Aro", description: "Las megapiedras se hacen disponibles" },
    "DYNAMAX_BAND": { name: "Muñequera Dinamax", description: "Las maxisetas se hacen disponibles" },
    "TERA_ORB": { name: "Orbe Teracristal", description: "Los teralitos se hacen disponibles" },

    "MAP": { name: "Mapa", description: "Te permite elegir un destino en bifurcaciones" },

    "POTION": { name: "Poción" },
    "SUPER_POTION": { name: "Superpoción" },
    "HYPER_POTION": { name: "Hiperpoción" },
    "MAX_POTION": { name: "Poción Máxima" },
    "FULL_RESTORE": { name: "Restaurar Todo" },
    
    "REVIVE": { name: "Revivir" },
    "MAX_REVIVE": { name: "Revivir Máximo" },
    
    "FULL_HEAL": { name: "Cura Total" },

    "SACRED_ASH": { name: "Sacred Ash" },

    "REVIVER_SEED": { name: "Semilla Revivir", description: "Revive al usuario a 1/2 PS nada más revivir" },

    "ETHER": { name: "Éter" },
    "MAX_ETHER": { name: "Éter Máximo" },

    "ELIXIR": { name: "Elixir" },
    "MAX_ELIXIR": { name: "Elixir Máximo" },

    "PP_UP": { name: "Más PP" },
    "PP_MAX": { name: "Más PP Máximo" },

    "LURE": { name: "Incienso" },
    "SUPER_LURE": { name: "Súper Incienso" },
    "MAX_LURE": { name: "Incienso Máximo" },

    "MEMORY_MUSHROOM": { name: "Seta Recuerdo", description: "Recuerda un movimiento olvidado por un Pokémon" },

    "EXP_SHARE": { name: "Repartir Exp.", description: "Los Pokémon no participantes recibirán un 20% de experiencia de los participantes" },
    "EXP_BALANCE": { name: "Equilibrar Exp.", description: "Reparte los puntos de exp. hacia los Pokémon de nivel más bajo" },

    "OVAL_CHARM": { name: "Amuleto Oval", description: "Cada Pokémon que participe en batalla recibe 10% más de la exp. total" },

    "EXP_CHARM": { name: "Amuleto Exp." },
    "SUPER_EXP_CHARM": { name: "Súper Amuleto Exp. },
    "GOLDEN_EXP_CHARM": { name: "Amuleto Exp. Dorado" },

    "LUCKY_EGG": { name: "Huevo Suerte" },
    "GOLDEN_EGG": { name: "Huevo Dorado" },

    "SOOTHE_BELL": { name: "Campana Alivio" },

    "SOUL_DEW": { name: "Rocío Bondad", description: "Sube la influencia de estadísticas en un Pokémon a un 10% (sumatorio)" },

    "NUGGET": { name: "Pepita" },
    "BIG_NUGGET": { name: "Gran Pepita" },
    "RELIC_GOLD": { name: "Reliquia Dorada" },

    "AMULET_COIN": { name: "Amulet Coin", description: "Incrementa recompensas monetarias un 20%" },
    "GOLDEN_PUNCH": { name: "Golden Punch", description: "50% del daño recibido se vuelve dinero" },
    "COIN_CASE": { name: "Coin Case", description: "Cada 10 batallas recibe 10% de tu dinero en intereses" },
    
    "LOCK_CAPSULE": { name: "Cápsula Bloqueo", description: "Te permite asegurar rareza de objetos al volver a tirar" },

    "GRIP_CLAW": { name: "Garra Garfio" },
    "WIDE_LENS": { name: "Lupa" },
    
    "MULTI_LENS": { name: "Multilupa" },

    "HEALING_CHARM": { name: "Amuleto Curación", description: "Sube la efectividad de objetos de curación un 10% (menos Revivir)" },
    "CANDY_JAR": { name: "Tarro de Caramelos", description: "Sube 1 nivel a los objetos Caramelo Raro" },

    "BERRY_POUCH": { name: "Bolsillo de Bayas", description: "Añade una probabilidad de 25% de que una baya no sea consumida" },

    "FOCUS_BAND": { name: "Cinta Aguante", description: "Añade una probabilidad de 10% de sobrevivir con 1 PS tras recibir movimientos que te debiliten" },

    "QUICK_CLAW": { name: "Garra Rápida", description: "Añade una probabilidad de 10% de atacar primero (tras la prioridad)" },

    "KINGS_ROCK": { name: "Roca del Rey", description: "Añade una probabilidad de 10% de que un ataque cause retroceso" },

    "LEFTOVERS": { name: "Restos", description: "Cura 1/16 de los PS de un Pokémon cada turno" },
    "SHELL_BELL": { name: "Cascabel Concha", description: "Cura 1/8 del daño hecho a un Pokémon" },

    "BATON": { name: "Relevo", description: "Permite transferir estadísticas al cambiar Pokémon, evitando trampas" },

    "SHINY_CHARM": { name: "Amuleto Iris", description: "Sube radicalmente las probabilidades de encontrar un Pokémon variocolor" },
    "ABILITY_CHARM": { name: "Amuleto Habilidad", description: "Sube radicalmente las probabilidades de encontrar un Pokémon con habilidad oculta" },

    "IV_SCANNER": { name: "Escáner IVs", description: "Permite escanear las IVs de los Pokémon salvajes, mostrando las 2 mejores" },

    "DNA_SPLICERS": { name: "Punta ADN" },

    "MINI_BLACK_HOLE": { name: "Mini Agujero Negro" },

    "GOLDEN_POKEBALL": { name: "Poké Ball Dorada", description: "Añade 1 opción de objeto al final de la batalla" },

    "ENEMY_DAMAGE_BOOSTER": { name: "Ficha Daño", description: "Sube el daño por 5%" },
    "ENEMY_DAMAGE_REDUCTION": { name: "Ficha Protección", description: "Reduce el daño enemigo por 2.5%" },
    "ENEMY_HEAL": { name: "Ficha Recuperación", description: "Cura 2% de los PS máximos cada turno" },
    "ENEMY_ATTACK_POISON_CHANCE": { name: "Ficha Veneno" },
    "ENEMY_ATTACK_PARALYZE_CHANCE": { name: "Ficha Parálisis" },
    "ENEMY_ATTACK_SLEEP_CHANCE": { name: "Ficha Sueño" },
    "ENEMY_ATTACK_FREEZE_CHANCE": { name: "Ficha Congelación" },
    "ENEMY_ATTACK_BURN_CHANCE": { name: "Ficha Quemadura" },
    "ENEMY_STATUS_EFFECT_HEAL_CHANCE": { name: "Ficha Cura Total", description: "Añade una probabilidad de 10% cada turno de curar un problema de estado" },
    "ENEMY_ENDURE_CHANCE": { name: "Ficha Aguante" },
    "ENEMY_FUSED_CHANCE": { name: "Ficha Fusión", description: "Añade una probabilidad de 1% de que un Pokémon salvaje sea una fusión" },
  },
  TempBattleStatBoosterItem: {
    "x_attack": "Ataque X",
    "x_defense": "Defensa X",
    "x_sp_atk": "Atq. Esp. X",
    "x_sp_def": "Def. Esp. X",
    "x_speed": "Velocidad X",
    "x_accuracy": "Precisión X",
    "dire_hit": "Crítico X",
  },
  AttackTypeBoosterItem: {
    "silk_scarf": "Pañuelo de Seda",
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
    "dragon_fang": "Colm. Dragón",
    "black_glasses": "Gafas de Sol",
    "fairy_feather": "Pluma Feérica",
  },
  BaseStatBoosterItem: {
    "hp_up": "Más PS",
    "protein": "Proteína",
    "iron": "Hierro",
    "calcium": "Calcio",
    "zinc": "Cinc",
    "carbos": "Carburante",
  },
  EvolutionItem: {
    "NONE": "Ninguno",

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
    "PEAT_BLOCK": "Bloque Turba",
    "AUSPICIOUS_ARMOR": "Arm. Auspiciosa",
    "MALICIOUS_ARMOR": "Arm. Maldita",
    "MASTERPIECE_TEACUP": "Cuenco Exquisito",
    "METAL_ALLOY": "Aleación Metálica",
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
    "RAYQUAZITE": "Rayquazite",
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

    "BLUE_ORB": "Orbe Azul",
    "RED_ORB": "Orbe Rojo",
    "SHARP_METEORITE": "Meteorito Agudo",
    "HARD_METEORITE": "Meteorito Duro",
    "SMOOTH_METEORITE": "Meteorito Suave",
    "ADAMANT_CRYSTAL": "Gran Diamansfera",
    "LUSTROUS_ORB": "Gran Lustrosfera",
    "GRISEOUS_CORE": "Gran Griseosfera",
    "REVEAL_GLASS": "Espejo Veraz",
    "GRACIDEA": "Gracídea",
    "MAX_MUSHROOMS": "Maxisetas",
    "DARK_STONE": "Orbe Oscuro",
    "LIGHT_STONE": "Orbe Claro",
    "PRISON_BOTTLE": "Vasija Castigo",
    "N_LUNARIZER": "Necroluna",
    "N_SOLARIZER": "Necrosol",
    "RUSTED_SWORD": "Espada Oxidada",
    "RUSTED_SHIELD": "Escudo Oxidado",
    "ICY_REINS_OF_UNITY": "Rienda Unión Hielo",
    "SHADOW_REINS_OF_UNITY": "Rienda Unión Sombra",
    "WELLSPRING_MASK": "Máscara Fuente",
    "HEARTHFLAME_MASK": "Máscara Horno",
    "CORNERSTONE_MASK": "Máscara Cimiento",
    "SHOCK_DRIVE": "FulgoROM",
    "BURN_DRIVE": "PiroROM",
    "CHILL_DRIVE": "CrioROM",
    "DOUSE_DRIVE": "HidroROM",
  },
} as const;