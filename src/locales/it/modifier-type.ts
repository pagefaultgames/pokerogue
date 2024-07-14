import { ModifierTypeTranslationEntries } from "#app/interfaces/locales";

export const modifierType: ModifierTypeTranslationEntries = {
  ModifierType: {
    "AddPokeballModifierType": {
      name: "{{modifierCount}}x {{pokeballName}}",
      description: "Ricevi {{pokeballName}} x{{modifierCount}} (Inventario: {{pokeballAmount}}) \nTasso di cattura: {{catchRate}}.",
    },
    "AddVoucherModifierType": {
      name: "{{modifierCount}}x {{voucherTypeName}}.",
      description: "Ricevi {{voucherTypeName}} x{{modifierCount}}.",
    },
    "PokemonHeldItemModifierType": {
      extra: {
        "inoperable": "{{pokemonName}} non può prendere\nquesto oggetto!",
        "tooMany": "{{pokemonName}} possiede già\nquesto oggetto in abbondanza.",
      }
    },
    "PokemonHpRestoreModifierType": {
      description: "Restituisce {{restorePoints}} PS o {{restorePercent}}% PS ad un Pokémon, a seconda del valore più alto.",
      extra: {
        "fully": "Restituisce tutti i PS ad un Pokémon.",
        "fullyWithStatus": "Restituisce tutti i PS ad un Pokémon e lo cura da ogni problema di stato.",
      }
    },
    "PokemonReviveModifierType": {
      description: "Rianima un Pokémon esausto e gli restituisce il {{restorePercent}}% dei PS totali.",
    },
    "PokemonStatusHealModifierType": {
      description: "Cura tutti i problemi di stato di un Pokémon.",
    },
    "PokemonPpRestoreModifierType": {
      description: "Restituisce {{restorePoints}} PP per una mossa di un Pokémon.",
      extra: {
        "fully": "Restituisce tutti i PP di una mossa.",
      }
    },
    "PokemonAllMovePpRestoreModifierType": {
      description: "Restituisce {{restorePoints}} PP a tutte le mosse di un Pokémon.",
      extra: {
        "fully": "Restituisce tutti i PP a tutte le mosse di un Pokémon.",
      }
    },
    "PokemonPpUpModifierType": {
      description: "Aumenta i PP di una mossa di {{upPoints}} per ogni 5 PP (massimo 3).",
    },
    "PokemonNatureChangeModifierType": {
      name: "Menta {{natureName}}.",
      description: "Cambia la natura del Pokémon in {{natureName}} e sblocca la natura nel menu degli starter.",
    },
    "DoubleBattleChanceBoosterModifierType": {
      description: "Raddoppia la possibilità di imbattersi in doppie battaglie per {{battleCount}} battaglie.",
    },
    "TempBattleStatBoosterModifierType": {
      description: "Aumenta {{tempBattleStatName}} di un livello a tutti i Pokémon nel gruppo per 5 battaglie.",
    },
    "AttackTypeBoosterModifierType": {
      description: "Aumenta la potenza delle mosse di tipo {{moveType}} del 20% per un Pokémon.",
    },
    "PokemonLevelIncrementModifierType": {
      description: "Aumenta il livello di un Pokémon di {{levels}}.",
    },
    "AllPokemonLevelIncrementModifierType": {
      description: "Aumenta i livell di tutti i Pokémon della squadra di {{levels}}.",
    },
    "PokemonBaseStatBoosterModifierType": {
      description: "Aumenta {{statName}} di base del possessore del 10%.",
    },
    "AllPokemonFullHpRestoreModifierType": {
      description: "Restituisce il 100% dei PS a tutti i Pokémon.",
    },
    "AllPokemonFullReviveModifierType": {
      description: "Rianima tutti i Pokémon esausti restituendogli tutti i PS.",
    },
    "MoneyRewardModifierType": {
      description: "Garantisce una {{moneyMultiplier}} quantità di soldi (₽{{moneyAmount}}).",
      extra: {
        "small": "contenuta",
        "moderate": "moderata",
        "large": "grande",
      },
    },
    "ExpBoosterModifierType": {
      description: "Aumenta il guadagno di Punti Esperienza del {{boostPercent}}%.",
    },
    "PokemonExpBoosterModifierType": {
      description: "Aumenta il guadagno di Punti Esperienza del possessore del {{boostPercent}}%.",
    },
    "PokemonFriendshipBoosterModifierType": {
      description: "Aumenta del 50% il guadagno di amicizia per vittoria.",
    },
    "PokemonMoveAccuracyBoosterModifierType": {
      description: "Aumenta la precisione delle mosse di {{accuracyAmount}} (massimo 100).",
    },
    "PokemonMultiHitModifierType": {
      description: "Gli attacchi colpiscono una volta in più al costo di una riduzione di potenza del 60/75/82,5% per mossa.",
    },
    "TmModifierType": {
      name: "MT{{moveId}} - {{moveName}}.",
      description: "Insegna {{moveName}} a un Pokémon.",
    },
    "TmModifierTypeWithInfo": {
      name: "MT{{moveId}} - {{moveName}}",
      description: "Insegna {{moveName}} a un Pokémon\n(Hold C or Shift for more info).",
    },
    "EvolutionItemModifierType": {
      description: "Fa evolvere determinate specie di Pokémon.",
    },
    "FormChangeItemModifierType": {
      description: "Fa cambiare forma a determinati Pokémon.",
    },
    "FusePokemonModifierType": {
      description: "Combina due Pokémon (trasferisce i poteri, divide le statistiche e i tipi base, condivide il pool di mosse).",
    },
    "TerastallizeModifierType": {
      name: "Teralite {{teraType}}",
      description: "Teracristallizza in {{teraType}} il possessore per massimo 10 battaglie.",
    },
    "ContactHeldItemTransferChanceModifierType": {
      description: "Quando il possessore attacca, c'è una probabilità del {{chancePercent}}% che l'oggetto in possesso del nemico gli venga rubato.",
    },
    "TurnHeldItemTransferModifierType": {
      description: "Ogni turno, il possessore acquisisce un oggetto posseduto dal nemico.",
    },
    "EnemyAttackStatusEffectChanceModifierType": {
      description: "Aggiunge una probabilità del {{chancePercent}}% di infliggere {{statusEffect}} con le mosse d'attacco.",
    },
    "EnemyEndureChanceModifierType": {
      description: "Aggiunge una probabilità del {{probabilitàPercent}}% di resistere ad un colpo.",
    },

    "RARE_CANDY": { name: "Caramella rara" },
    "RARER_CANDY": { name: "Caramella molto rara" },

    "MEGA_BRACELET": { name: "Megapolsiera", description: "Le megapietre diventano disponibili." },
    "DYNAMAX_BAND": { name: "Polsino Dynamax", description: "I fungomax diventano disponibili." },
    "TERA_ORB": { name: "Terasfera", description: "I teraliti diventano disponibili." },

    "MAP": { name: "Mappa", description: "Permette di scegliere la propria strada a un bivio." },

    "POTION": { name: "Pozione" },
    "SUPER_POTION": { name: "Superpozione" },
    "HYPER_POTION": { name: "Iperpozione" },
    "MAX_POTION": { name: "Pozione max" },
    "FULL_RESTORE": { name: "Ricarica totale" },

    "REVIVE": { name: "Revitalizzante" },
    "MAX_REVIVE": { name: "Revitalizzante max" },

    "FULL_HEAL": { name: "Cura totale" },

    "SACRED_ASH": { name: "Cenere magica" },

    "REVIVER_SEED": { name: "Revitalseme", description: "Il possessore recupera 1/2 di PS in caso di KO causato da un colpo diretto." },

    "ETHER": { name: "Etere" },
    "MAX_ETHER": { name: "Etere max" },

    "ELIXIR": { name: "Elisir" },
    "MAX_ELIXIR": { name: "Elisir max" },

    "PP_UP": { name: "PP-su" },
    "PP_MAX": { name: "PP-max" },

    "LURE": { name: "Esca" },
    "SUPER_LURE": { name: "Super esca" },
    "MAX_LURE": { name: "Esca max" },

    "MEMORY_MUSHROOM": { name: "Fungo della memoria", description: "Permette di insegnare nuovamente una mossa dimenticata ad un Pokémon." },

    "EXP_SHARE": { name: "Condividi esperienza", description: "Tutti i Pokémon della squadra ricevono il 20% dei Punti Esperienza dalla lotta, anche se non vi hanno partecipato." },
    "EXP_BALANCE": { name: "Bilancia esperienza", description: "Bilancia i Punti Esperienza ricevuti verso i Pokémon della squadra di livello inferiore." },

    "OVAL_CHARM": { name: "Ovamuleto", description: "Quando più Pokémon partecipano a una battaglia, ognuno di essi riceve il 10% in più dell'esperienza totale." },

    "EXP_CHARM": { name: "Esperienzamuleto" },
    "SUPER_EXP_CHARM": { name: "Esperienzamuleto super" },
    "GOLDEN_EXP_CHARM": { name: "Esperienzamuleto dorato" },

    "LUCKY_EGG": { name: "Fortunuovo" },
    "GOLDEN_EGG": { name: "Uovo dorato" },

    "SOOTHE_BELL": { name: "Calmanella" },

    "SCOPE_LENS": { name: "Mirino", description: "Lente che aumenta la probabilità di sferrare brutti colpi." },
    "LEEK": { name: "Porro", description: "Strumento da dare a Farfetch'd. Lungo gambo di porro che aumenta la probabilità di sferrare brutti colpi." },

    "EVIOLITE": { name: "Evolcondensa", description: "Misteriosa materia evolutiva. Aumenta la Difesa e la Difesa Speciale di un Pokémon che può ancora evolversi." },

    "SOUL_DEW": { name: "Cuorugiada", description: "Aumenta del 10% l'influenza della natura di un Pokémon sulle sue statistiche (cumulativo)." },

    "NUGGET": { name: "Pepita" },
    "BIG_NUGGET": { name: "Granpepita" },
    "RELIC_GOLD": { name: "Dobloantico" },

    "AMULET_COIN": { name: "Monetamuleto", description: "Aumenta le ricompense in denaro del 20%." },
    "GOLDEN_PUNCH": { name: "Pugno dorato", description: "Fornisce il 50% dei danni inflitti sottoforma di denaro." },
    "COIN_CASE": { name: "Salvadanaio", description: "Dopo ogni 10° battaglia, fornisce il 10% del proprio denaro in interessi." },

    "LOCK_CAPSULE": { name: "Capsula scrigno", description: "Permette di bloccare le rarità degli oggetti quando si fa un reroll (i costi variano in base alle rarità)." },

    "GRIP_CLAW": { name: "Presartigli" },
    "WIDE_LENS": { name: "Grandelente" },

    "MULTI_LENS": { name: "Multilente" },

    "HEALING_CHARM": { name: "Curamuleto", description: "Aumenta del 10% l'efficacia delle mosse e degli oggetti che ripristinano i PS (escluse le rianimazioni)." },
    "CANDY_JAR": { name: "Barattolo di caramelle", description: "Aumenta di 1 il numero di livelli aggiunti dalle caramelle rare." },

    "BERRY_POUCH": { name: "Porta bacche", description: "Aggiunge il 30% di possibilità che una bacca usata non venga consumata." },

    "FOCUS_BAND": { name: "Bandana", description: "Il possessore ottiene il 10% di possibilità aggiuntivo di evitare un potenziale KO e rimanere con un solo PS." },

    "QUICK_CLAW": { name: "Rapidartigli", description: "Aggiunge una probabilità del 10% di muoversi per primi, indipendentemente dalla velocità (priorità escluse)." },

    "KINGS_ROCK": { name: "Roccia di re", description: "Aggiunge il 10% di possibilità che una mossa d'attacco faccia tentennare l'avversario." },

    "LEFTOVERS": { name: "Avanzi", description: "Ripristina 1/16 dei PS massimi di un Pokémon ogni turno." },
    "SHELL_BELL": { name: "Conchinella", description: "Cura il possessore di 1/8 del danno inflitto ad un Pokémon." },

    "TOXIC_ORB": { name: "Tossicsfera", description: "Sfera bizzarra che iperavvelena chi l’ha con sé in una lotta." },
    "FLAME_ORB": { name: "Fiammosfera", description: "Sfera bizzarra che procura una scottatura a chi l’ha con sé in una lotta." },

    "BATON": { name: "Staffetta", description: "Permette di trasmettere gli effetti quando si cambia Pokémon, aggirando anche le trappole." },

    "SHINY_CHARM": { name: "Cromamuleto", description: "Misterioso amuleto luminoso che aumenta la probabilità di incontrare Pokémon cromatici." },
    "ABILITY_CHARM": { name: "Abilitamuleto", description: "Aumenta drasticamente la possibilità che un Pokémon selvatico abbia un'abilità nascosta." },

    "IV_SCANNER": { name: "Scanner IV", description: "Permette di scansionare gli IV dei Pokémon selvatici. Vengono rivelati 2 IV per ogni scanner. I migliori IV vengono mostrati per primi." },

    "DNA_SPLICERS": { name: "Cuneo DNA" },

    "MINI_BLACK_HOLE": { name: "Piccolo buco nero" },

    "GOLDEN_POKEBALL": { name: "Poké Ball dorata", description: "Aggiunge 1 opzione di oggetto extra alla fine di ogni battaglia." },

    "ENEMY_DAMAGE_BOOSTER": { name: "Gettone del danno", description: "Aumenta i danni inflitti del 5%." },
    "ENEMY_DAMAGE_REDUCTION": { name: "Gettone della protezione", description: "Riduce i danni ricevuti del 2.5%." },
    "ENEMY_HEAL": { name: "Gettone del recupero", description: "Cura il 2% dei PS massimi ogni turno." },
    "ENEMY_ATTACK_POISON_CHANCE": { name: "Gettone del veleno" },
    "ENEMY_ATTACK_PARALYZE_CHANCE": { name: "Gettone della paralisi" },
    "ENEMY_ATTACK_BURN_CHANCE": { name: "Gettone della bruciatura" },
    "ENEMY_STATUS_EFFECT_HEAL_CHANCE": { name: "Gettone guarigione completa", description: "Aggiunge una probabilità del 2.5% a ogni turno di guarire da un problema di stato." },
    "ENEMY_ENDURE_CHANCE": { name: "Gettone di resistenza" },
    "ENEMY_FUSED_CHANCE": { name: "Gettone della fusione", description: "Aggiunge l'1% di possibilità che un Pokémon selvatico sia una fusione." },
  },
  SpeciesBoosterItem: {
    "LIGHT_BALL": { name: "Elettropalla", description: "Strumento da dare a Pikachu. Sfera insolita che aumenta l’Attacco e l’Attacco Speciale." },
    "THICK_CLUB": { name: "Osso spesso", description: "Strumento da dare a Cubone o Marowak. Osso duro che aumenta l’Attacco." },
    "METAL_POWDER": { name: "Metalpolvere", description: "Strumento da dare a Ditto. Strana polvere finissima e al tempo stesso dura che migliora la Difesa." },
    "QUICK_POWDER": { name: "Velopolvere", description: "Strumento da dare a Ditto. Questa strana polvere, fine e al contempo dura, aumenta la Velocità." }
  },
  TempBattleStatBoosterItem: {
    "x_attack": "Attacco X",
    "x_defense": "Difesa X",
    "x_sp_atk": "Att. Speciale X",
    "x_sp_def": "Dif. Speciale X",
    "x_speed": "Velocità X",
    "x_accuracy": "Precisione X",
    "dire_hit": "Supercolpo",
  },

  TempBattleStatBoosterStatName: {
    "ATK": "Attacco",
    "DEF": "Difesa",
    "SPATK": "Att. Speciale",
    "SPDEF": "Dif. Speciale",
    "SPD": "Velocità",
    "ACC": "Precisione",
    "CRIT": "Tasso di brutti colpi",
    "EVA": "Elusione",
    "DEFAULT": "???",
  },

  AttackTypeBoosterItem: {
    "silk_scarf": "Sciarpa seta",
    "black_belt": "Cinturanera",
    "sharp_beak": "Beccaffilato",
    "poison_barb": "Velenaculeo",
    "soft_sand": "Sabbia soffice",
    "hard_stone": "Pietradura",
    "silver_powder": "Argenpolvere",
    "spell_tag": "Spettrotarga",
    "metal_coat": "Metalcopertura",
    "charcoal": "Carbonella",
    "mystic_water": "Acqua magica",
    "miracle_seed": "Miracolseme",
    "magnet": "Magnete",
    "twisted_spoon": "Cucchiaio torto",
    "never_melt_ice": "Gelomai",
    "dragon_fang": "Dente di drago",
    "black_glasses": "Occhialineri",
    "fairy_feather": "Piuma fatata",
  },
  BaseStatBoosterItem: {
    "hp_up": "PS-su",
    "protein": "Proteina",
    "iron": "Ferro",
    "calcium": "Calcio",
    "zinc": "Zinco",
    "carbos": "Carburante",
  },
  EvolutionItem: {
    "NONE": "Nessuno",

    "LINKING_CORD": "Filo dell'unione",
    "SUN_STONE": "Pietrasolare",
    "MOON_STONE": "Pietralunare",
    "LEAF_STONE": "Pietrafoglia",
    "FIRE_STONE": "Pietrafocaia",
    "WATER_STONE": "Pietraidrica",
    "THUNDER_STONE": "Pietratuono",
    "ICE_STONE": "Pietragelo",
    "DUSK_STONE": "Neropietra",
    "DAWN_STONE": "Pietralbore",
    "SHINY_STONE": "Pietrabrillo",
    "CRACKED_POT": "Teiera rotta",
    "SWEET_APPLE": "Dolcepomo",
    "TART_APPLE": "Aspropomo",
    "STRAWBERRY_SWEET": "Bonbonfragola",
    "UNREMARKABLE_TEACUP": "Tazza dozzinale",

    "CHIPPED_POT": "Teiera crepata",
    "BLACK_AUGURITE": "Augite nera",
    "GALARICA_CUFF": "Fascia Galarnoce",
    "GALARICA_WREATH": "Corona Galarnoce",
    "PEAT_BLOCK": "Blocco di torba",
    "AUSPICIOUS_ARMOR": "Armatura fausta",
    "MALICIOUS_ARMOR": "Armatura infausta",
    "MASTERPIECE_TEACUP": "Tazza eccezionale",
    "METAL_ALLOY": "Metallo composito",
    "SCROLL_OF_DARKNESS": "Rotolo del Buio",
    "SCROLL_OF_WATERS": "Rotolo dell'Acqua",
    "SYRUPY_APPLE": "Sciroppomo",
  },
  FormChangeItem: {
    "NONE": "Nessuno",

    "ABOMASITE": "Abomasnowite",
    "ABSOLITE": "Absolite",
    "AERODACTYLITE": "Aerodactylite",
    "AGGRONITE": "Aggronite",
    "ALAKAZITE": "Alakazamite",
    "ALTARIANITE": "Altarite",
    "AMPHAROSITE": "Ampharosite",
    "AUDINITE": "Audinite",
    "BANETTITE": "Banettite",
    "BEEDRILLITE": "Beedrillite",
    "BLASTOISINITE": "Blastoisite",
    "BLAZIKENITE": "Blazikenite",
    "CAMERUPTITE": "Cameruptite",
    "CHARIZARDITE_X": "Charizardite X",
    "CHARIZARDITE_Y": "Charizardite Y",
    "DIANCITE": "Diancite",
    "GALLADITE": "Galladite",
    "GARCHOMPITE": "Garchompite",
    "GARDEVOIRITE": "Gardevoirite",
    "GENGARITE": "Gengarite",
    "GLALITITE": "Glalite",
    "GYARADOSITE": "Gyaradosite",
    "HERACRONITE": "Heracronite",
    "HOUNDOOMINITE": "Houndoomite",
    "KANGASKHANITE": "Kangaskhanite",
    "LATIASITE": "Latiasite",
    "LATIOSITE": "Latiosite",
    "LOPUNNITE": "Lopunnite",
    "LUCARIONITE": "Lucarite",
    "MANECTITE": "Manectricite",
    "MAWILITE": "Mawilite",
    "MEDICHAMITE": "Medichamite",
    "METAGROSSITE": "Metagrossite",
    "MEWTWONITE_X": "Mewtwoite X",
    "MEWTWONITE_Y": "Mewtwoite Y",
    "PIDGEOTITE": "Pidgeotite",
    "PINSIRITE": "Pinsirite",
    "RAYQUAZITE": "Rayquazite",
    "SABLENITE": "Sableyite",
    "SALAMENCITE": "Salamencite",
    "SCEPTILITE": "Sceptilite",
    "SCIZORITE": "Scizorite",
    "SHARPEDONITE": "Sharpedite",
    "SLOWBRONITE": "Slowbroite",
    "STEELIXITE": "Steelixite",
    "SWAMPERTITE": "Swampertite",
    "TYRANITARITE": "Tyranitarite",
    "VENUSAURITE": "Venusaurite",

    "BLUE_ORB": "Gemma Blu",
    "RED_ORB": "Gemma Rossa",
    "SHARP_METEORITE": "Meteorite Tagliente",
    "HARD_METEORITE": "Meteorite Dura",
    "SMOOTH_METEORITE": "Meteorite Liscia",
    "ADAMANT_CRYSTAL": "Adamasferoide",
    "LUSTROUS_GLOBE": "Splendisferoide",
    "GRISEOUS_CORE": "Grigiosferoide",
    "REVEAL_GLASS": "Verispecchio",
    "GRACIDEA": "Gracidea",
    "MAX_MUSHROOMS": "Fungomax",
    "DARK_STONE": "Scurolite",
    "LIGHT_STONE": "Chiarolite",
    "PRISON_BOTTLE": "Vaso del Vincolo",
    "N_LUNARIZER": "Necrolunix",
    "N_SOLARIZER": "Necrosolix",
    "RUSTED_SWORD": "Spada Rovinata",
    "RUSTED_SHIELD": "Scudo Rovinato",
    "ICY_REINS_OF_UNITY": "Briglie Legame Giaccio",
    "SHADOW_REINS_OF_UNITY": "Briglie legame Ombra",
    "WELLSPRING_MASK": "Maschera Pozzo",
    "HEARTHFLAME_MASK": "Maschera Focolare",
    "CORNERSTONE_MASK": "Maschera Fondamenta",
    "SHOCK_DRIVE": "Voltmodulo",
    "BURN_DRIVE": "Piromodulo",
    "CHILL_DRIVE": "Gelomodulo",
    "DOUSE_DRIVE": "Idromodulo",

    "FIST_PLATE": "Lastrapugno",
    "SKY_PLATE": "Lastracielo",
    "TOXIC_PLATE": "Lastrafiele",
    "EARTH_PLATE": "Lastrageo",
    "STONE_PLATE": "Lastrapietra",
    "INSECT_PLATE": "Lastrabaco",
    "SPOOKY_PLATE": "Lastratetra",
    "IRON_PLATE": "Lastraferro",
    "FLAME_PLATE": "Lastrarogo",
    "SPLASH_PLATE": "Lastraidro",
    "MEADOW_PLATE": "Lastraprato",
    "ZAP_PLATE": "Lastrasaetta",
    "MIND_PLATE": "Lastramente",
    "ICICLE_PLATE": "Lastragelo",
    "DRACO_PLATE": "Lastradrakon",
    "DREAD_PLATE": "Lastratimore",
    "PIXIE_PLATE": "Lastraspiritello",
    "BLANK_PLATE": "Lastraripristino",
    "LEGEND_PLATE": "Lastraleggenda",
    "FIGHTING_MEMORY": "ROM Lotta",
    "FLYING_MEMORY": "ROM Volante",
    "POISON_MEMORY": "ROM Veleno",
    "GROUND_MEMORY": "ROM Terra",
    "ROCK_MEMORY": "ROM Roccia",
    "BUG_MEMORY": "ROM Coleottero",
    "GHOST_MEMORY": "ROM Spettro",
    "STEEL_MEMORY": "ROM Acciaio",
    "FIRE_MEMORY": "ROM Fuoco",
    "WATER_MEMORY": "ROM Acqua",
    "GRASS_MEMORY": "ROM Erba",
    "ELECTRIC_MEMORY": "ROM Elettro",
    "PSYCHIC_MEMORY": "ROM Psico",
    "ICE_MEMORY": "ROM Ghiaccio",
    "DRAGON_MEMORY": "ROM Drago",
    "DARK_MEMORY": "ROM Buio",
    "FAIRY_MEMORY": "ROM Folletto",
    "BLANK_MEMORY": "ROM Vuota",
  },
} as const;
