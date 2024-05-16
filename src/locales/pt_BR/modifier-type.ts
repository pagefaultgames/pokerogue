import { ModifierTypeTranslationEntries } from "#app/plugins/i18n";

export const modifierType: ModifierTypeTranslationEntries = {
  ModifierType: {
    "AddPokeballModifierType": {
      name: "{{modifierCount}}x {{pokeballName}}",
      description: "Ganhe x{{modifierCount}} {{pokeballName}} (Mochila: {{pokeballAmount}}) \nChance de captura: {{catchRate}}",
    },
    "AddVoucherModifierType": {
      name: "{{modifierCount}}x {{voucherTypeName}}",
      description: "Ganhe x{{modifierCount}} {{voucherTypeName}}",
    },
    "PokemonHeldItemModifierType": {
      extra: {
        "inoperable": "{{pokemonName}} não pode\nsegurar esse item!",
        "tooMany": "{{pokemonName}} tem muitos\nmuitos deste item!",
      }
    },
    "PokemonHpRestoreModifierType": {
      description: "Restaura {{restorePoints}} PS ou {{restorePercent}}% PS de um Pokémon, o que for maior",
      extra: {
        "fully": "Restaura totalmente os PS de um Pokémon",
        "fullyWithStatus": "Restaura totalmente os PS de um Pokémon e cura qualquer mudança de estado",
      }
    },
    "PokemonReviveModifierType": {
      description: "Revive um Pokémon e restaura {{restorePercent}}% PS",
    },
    "PokemonStatusHealModifierType": {
      description: "Cura uma mudança de estado de um Pokémon",
    },
    "PokemonPpRestoreModifierType": {
      description: "Restaura {{restorePoints}} PP para um movimento de um Pokémon",
      extra: {
        "fully": "Restaura todos os PP para um movimento de um Pokémon",
      }
    },
    "PokemonAllMovePpRestoreModifierType": {
      description: "Restaura {{restorePoints}} PP para todos os movimentos de um Pokémon",
      extra: {
        "fully": "Restaura todos os PP para todos os movimentos de um Pokémon",
      }
    },
    "PokemonPpUpModifierType": {
      description: "Aumenta permanentemente os PP para o movimento de um Pokémon em {{upPoints}} para cada 5 PP máximos (máximo 3)",
    },
    "PokemonNatureChangeModifierType": {
      name: "{{natureName}} Mint",
      description: "Muda a natureza de um Pokémon para {{natureName}} e a desbloqueia permanentemente para seu inicial",
    },
    "DoubleBattleChanceBoosterModifierType": {
      description: "Dobra as chances de encontrar uma batalha em dupla por {{battleCount}} batalhas",
    },
    "TempBattleStatBoosterModifierType": {
      description: "Aumenta o atributo de {{tempBattleStatName}} para todos os membros da equipe por 5 batalhas",
    },
    "AttackTypeBoosterModifierType": {
      description: "Aumenta o poder dos ataques do tipo {{moveType}} de um Pokémon em 20%",
    },
    "PokemonLevelIncrementModifierType": {
      description: "Aumenta em 1 o nível de um Pokémon",
    },
    "AllPokemonLevelIncrementModifierType": {
      description: "Aumenta em 1 os níveis de todos os Pokémon",
    },
    "PokemonBaseStatBoosterModifierType": {
      description: "Aumenta o atributo base de {{statName}} em 10%. Quanto maior os IVs, maior o limite de aumento",
    },
    "AllPokemonFullHpRestoreModifierType": {
      description: "Restaura totalmente os PS de todos os Pokémon",
    },
    "AllPokemonFullReviveModifierType": {
      description: "Revive todos os Pokémon, restaurando totalmente seus PS",
    },
    "MoneyRewardModifierType": {
      description: "Garante uma quantidade {{moneyMultiplier}} de dinheiro (₽{{moneyAmount}})",
      extra: {
        "small": "pequena",
        "moderate": "moderada",
        "large": "grande",
      },
    },
    "ExpBoosterModifierType": {
      description: "Aumenta o ganho de pontos de experiência em {{boostPercent}}%",
    },
    "PokemonExpBoosterModifierType": {
      description: "Aumenta o ganho de pontos de experiência de quem segurar em {{boostPercent}}%",
    },
    "PokemonFriendshipBoosterModifierType": {
      description: "Aumenta o ganho de amizade por vitória em 50%",
    },
    "PokemonMoveAccuracyBoosterModifierType": {
      description: "Aumenta a precisão dos movimentos em {{accuracyAmount}} (máximo 100)",
    },
    "PokemonMultiHitModifierType": {
      description: "Ataques acertam uma vez adicional ao custo de uma redução de poder de 60/75/82.5% por item, respectivamente",
    },
    "TmModifierType": {
      name: "TM{{moveId}} - {{moveName}}",
      description: "Ensina {{moveName}} a um Pokémon",
    },
    "EvolutionItemModifierType": {
      description: "Faz certos Pokémon evoluírem",
    },
    "FormChangeItemModifierType": {
      description: "Faz certos Pokémon mudarem de forma",
    },
    "FusePokemonModifierType": {
      description: "Combina dois Pokémon (transfere Habilidade, divide os atributos base e tipos, compartilha os movimentos)",
    },
    "TerastallizeModifierType": {
      name: "{{teraType}} Fragmento Tera",
      description: "{{teraType}} Terastaliza um Pokémon por até 10 batalhas",
    },
    "ContactHeldItemTransferChanceModifierType": {
      description: "Quando atacar, tem {{chancePercent}}% de chance de roubar um item do oponente",
    },
    "TurnHeldItemTransferModifierType": {
      description: "Todo turno, o Pokémon ganha um item aleatório do oponente",
    },
    "EnemyAttackStatusEffectChanceModifierType": {
      description: "Ganha {{chancePercent}}% de chance de infligir {{statusEffect}} com ataques",
    },
    "EnemyEndureChanceModifierType": {
      description: "Ganha {{chancePercent}}% de chance de sobreviver a um ataque que o faria desmaiar",
    },

    "RARE_CANDY": { name: "Doce Raro" },
    "RARER_CANDY": { name: "Doce Raríssimo" },

    "MEGA_BRACELET": { name: "Mega Bracelet", description: "Mega Stones become available" },
    "DYNAMAX_BAND": { name: "Dynamax Band", description: "Max Mushrooms become available" },
    "TERA_ORB": { name: "Orbe Tera", description: "Fragmentos Tera ficam disponíveis" },

    "MAP": { name: "Mapa", description: "Permite escolher a próxima rota" },

    "POTION": { name: "Poção" },
    "SUPER_POTION": { name: "Super Poção" },
    "HYPER_POTION": { name: "Hiper Poção" },
    "MAX_POTION": { name: "Poção Máxima" },
    "FULL_RESTORE": { name: "Restauração Total" },
    
    "REVIVE": { name: "Reviver" },
    "MAX_REVIVE": { name: "Reviver Máximo" },
    
    "FULL_HEAL": { name: "Cura Total" },

    "SACRED_ASH": { name: "Cinzas Sagradas" },

    "REVIVER_SEED": { name: "Semente de Reviver", description: "Após desmaiar, revive com 50% de PS" },

    "ETHER": { name: "Ether" },
    "MAX_ETHER": { name: "Max Ether" },

    "ELIXIR": { name: "Elixir" },
    "MAX_ELIXIR": { name: "Max Elixir" },

    "PP_UP": { name: "PP Up" },
    "PP_MAX": { name: "PP Max" },

    "LURE": { name: "Lure" },
    "SUPER_LURE": { name: "Super Lure" },
    "MAX_LURE": { name: "Max Lure" },

    "MEMORY_MUSHROOM": { name: "Memory Mushroom", description: "Relembra um movimento esquecido" },

    "EXP_SHARE": { name: "EXP. All", description: "Distribui pontos de experiência para todos os membros da equipe" },
    "EXP_BALANCE": { name: "EXP. Balance", description: "Distribui pontos de experiência principalmente para os Pokémon mais fracos" },

    "OVAL_CHARM": { name: "Amuleto Oval", description: "Quando vários Pokémon participam de uma batalha, cada um recebe 10% extra de pontos de experiência" },

    "EXP_CHARM": { name: "Amuleto de Experiência" },
    "SUPER_EXP_CHARM": { name: "Super Amuleto de Experiência" },
    "GOLDEN_EXP_CHARM": { name: "Amuleto de Experiência Dourado" },

    "LUCKY_EGG": { name: "Lucky Egg" },
    "GOLDEN_EGG": { name: "Golden Egg" },

    "SOOTHE_BELL": { name: "Soothe Bell" },

    "SOUL_DEW": { name: "Soul Dew", description: "Aumenta a influência da natureza de um Pokémon em seus atributos em 10% (cumulativo)" },

    "NUGGET": { name: "Pepita" },
    "BIG_NUGGET": { name: "Pepita Grande" },
    "RELIC_GOLD": { name: "Relíquia de Ouro" },

    "AMULET_COIN": { name: "Amulet Coin", description: "Aumenta a recompensa de dinheiro em 50%" },
    "GOLDEN_PUNCH": { name: "Golden Punch", description: "Concede 50% do dano causado em dinheiro" },
    "COIN_CASE": { name: "Coin Case", description: "Após cada 10ª batalha, recebe 10% de seu dinheiro em juros" },
    
    "LOCK_CAPSULE": { name: "Cápsula de Travamento", description: "Permite que você trave raridades de itens ao rolar novamente" },

    "GRIP_CLAW": { name: "Grip Claw" },
    "WIDE_LENS": { name: "Wide Lens" },
    
    "MULTI_LENS": { name: "Multi Lens" },

    "HEALING_CHARM": { name: "Amuleto de Cura", description: "Aumenta a eficácia dos movimentos e itens que restauram PS em 10% (exceto Reviver)" },
    "CANDY_JAR": { name: "Candy Jar", description: "Aumenta o número de níveis adicionados pelo Doce Raro em 1" },

    "BERRY_POUCH": { name: "Berry Pouch", description: "Adiciona uma chance de 25% de que uma berry usada não seja consumida" },

    "FOCUS_BAND": { name: "Focus Band", description: "Adiciona uma chance de 10% de sobreviver com 1 PS após ser danificado o suficiente para desmaiar" },

    "QUICK_CLAW": { name: "Quick Claw", description: "Adiciona uma chance de 10% de atacar primeiro, ignorando sua velocidade (após prioridades)" },

    "KINGS_ROCK": { name: "King's Rock", description: "Adiciona uma chance de 10% de movimentos fazerem o oponente hesitar" },

    "LEFTOVERS": { name: "Leftovers", description: "Cura 1/16 dos PS máximos de um Pokémon a cada turno" },
    "SHELL_BELL": { name: "Shell Bell", description: "Cura 1/8 do dano causado por um Pokémon" },

    "BATON": { name: "Baton", description: "Permite passar mudanças de atributo ao trocar Pokémon, ignorando armadilhas" },

    "SHINY_CHARM": { name: "Amuleto Shiny", description: "Aumenta drasticamente a chance de um Pokémon selvagem ser Shiny" },
    "ABILITY_CHARM": { name: "Amuleto de Habilidade", description: "Aumenta drasticamente a chance de um Pokémon selvagem ter uma Habilidade Oculta" },

    "IV_SCANNER": { name: "Scanner de IVs", description: "Permite escanear os IVs de Pokémon selvagens. 2 IVs são revelados por item. Os melhores IVs são mostrados primeiro" },

    "DNA_SPLICERS": { name: "Splicer de DNA" },

    "MINI_BLACK_HOLE": { name: "Mini Buraco Negro" },

    "GOLDEN_POKEBALL": { name: "Poké Bola Dourada", description: "Adiciona 1 opção de item extra ao final de cada batalha" },

    "ENEMY_DAMAGE_BOOSTER": { name: "Token de Dano", description: "Aumenta o dano em 5%" },
    "ENEMY_DAMAGE_REDUCTION": { name: "Token de Proteção", description: "Reduz o dano recebido em 2,5%" },
    "ENEMY_HEAL": { name: "Token de Recuperação", description: "Cura 2% dos PS máximos a cada turno" },
    "ENEMY_ATTACK_POISON_CHANCE": { name: "Token de Veneno" },
    "ENEMY_ATTACK_PARALYZE_CHANCE": { name: "Token de Paralisia" },
    "ENEMY_ATTACK_SLEEP_CHANCE": { name: "Token de Sono" },
    "ENEMY_ATTACK_FREEZE_CHANCE": { name: "Token de Congelamento" },
    "ENEMY_ATTACK_BURN_CHANCE": { name: "Token de Queimadura" },
    "ENEMY_STATUS_EFFECT_HEAL_CHANCE": { name: "Token de Cura Total", description: "Adiciona uma chance de 10% a cada turno de curar uma condição de status" },
    "ENEMY_ENDURE_CHANCE": { name: "Token de Persistência" },
    "ENEMY_FUSED_CHANCE": { name: "Token de Fusão", description: "Adiciona uma chance de 1% de que um Pokémon selvagem seja uma fusão" },
  },
  TempBattleStatBoosterItem: {
    "x_attack": "X Attack",
    "x_defense": "X Defense",
    "x_sp_atk": "X Sp. Atk",
    "x_sp_def": "X Sp. Def",
    "x_speed": "X Speed",
    "x_accuracy": "X Accuracy",
    "dire_hit": "Dire Hit",
  },
  AttackTypeBoosterItem: {
    "silk_scarf": "Silk Scarf",
    "black_belt": "Black Belt",
    "sharp_beak": "Sharp Beak",
    "poison_barb": "Poison Barb",
    "soft_sand": "Soft Sand",
    "hard_stone": "Hard Stone",
    "silver_powder": "Silver Powder",
    "spell_tag": "Spell Tag",
    "metal_coat": "Metal Coat",
    "charcoal": "Charcoal",
    "mystic_water": "Mystic Water",
    "miracle_seed": "Miracle Seed",
    "magnet": "Magnet",
    "twisted_spoon": "Twisted Spoon",
    "never_melt_ice": "Never-Melt Ice",
    "dragon_fang": "Dragon Fang",
    "black_glasses": "Black Glasses",
    "fairy_feather": "Fairy Feather",
  },
  BaseStatBoosterItem: {
    "hp_up": "PS Up",
    "protein": "Protein",
    "iron": "Iron",
    "calcium": "Calcium",
    "zinc": "Zinc",
    "carbos": "Carbos",
  },
  EvolutionItem: {
    "NONE": "None",

    "LINKING_CORD": "Linking Cord",
    "SUN_STONE": "Sun Stone",
    "MOON_STONE": "Moon Stone",
    "LEAF_STONE": "Leaf Stone",
    "FIRE_STONE": "Fire Stone",
    "WATER_STONE": "Water Stone",
    "THUNDER_STONE": "Thunder Stone",
    "ICE_STONE": "Ice Stone",
    "DUSK_STONE": "Dusk Stone",
    "DAWN_STONE": "Dawn Stone",
    "SHINY_STONE": "Shiny Stone",
    "CRACKED_POT": "Cracked Pot",
    "SWEET_APPLE": "Sweet Apple",
    "TART_APPLE": "Tart Apple",
    "STRAWBERRY_SWEET": "Strawberry Sweet",
    "UNREMARKABLE_TEACUP": "Unremarkable Teacup",
  
    "CHIPPED_POT": "Chipped Pot",
    "BLACK_AUGURITE": "Black Augurite",
    "GALARICA_CUFF": "Galarica Cuff",
    "GALARICA_WREATH": "Galarica Wreath",
    "PEAT_BLOCK": "Peat Block",
    "AUSPICIOUS_ARMOR": "Auspicious Armor",
    "MALICIOUS_ARMOR": "Malicious Armor",
    "MASTERPIECE_TEACUP": "Masterpiece Teacup",
    "METAL_ALLOY": "Metal Alloy",
    "SCROLL_OF_DARKNESS": "Scroll Of Darkness",
    "SCROLL_OF_WATERS": "Scroll Of Waters",
    "SYRUPY_APPLE": "Syrupy Apple",
  },
  FormChangeItem: {
    "NONE": "None",

    "ABOMASITE": "Abomasite",
    "ABSOLITE": "Absolite",
    "AERODACTYLITE": "Aerodactylite",
    "AGGRONITE": "Aggronite",
    "ALAKAZITE": "Alakazite",
    "ALTARIANITE": "Altarianite",
    "AMPHAROSITE": "Ampharosite",
    "AUDINITE": "Audinite",
    "BANETTITE": "Banettite",
    "BEEDRILLITE": "Beedrillite",
    "BLASTOISINITE": "Blastoisinite",
    "BLAZIKENITE": "Blazikenite",
    "CAMERUPTITE": "Cameruptite",
    "CHARIZARDITE_X": "Charizardite X",
    "CHARIZARDITE_Y": "Charizardite Y",
    "DIANCITE": "Diancite",
    "GALLADITE": "Galladite",
    "GARCHOMPITE": "Garchompite",
    "GARDEVOIRITE": "Gardevoirite",
    "GENGARITE": "Gengarite",
    "GLALITITE": "Glalitite",
    "GYARADOSITE": "Gyaradosite",
    "HERACRONITE": "Heracronite",
    "HOUNDOOMINITE": "Houndoominite",
    "KANGASKHANITE": "Kangaskhanite",
    "LATIASITE": "Latiasite",
    "LATIOSITE": "Latiosite",
    "LOPUNNITE": "Lopunnite",
    "LUCARIONITE": "Lucarionite",
    "MANECTITE": "Manectite",
    "MAWILITE": "Mawilite",
    "MEDICHAMITE": "Medichamite",
    "METAGROSSITE": "Metagrossite",
    "MEWTWONITE_X": "Mewtwonite X",
    "MEWTWONITE_Y": "Mewtwonite Y",
    "PIDGEOTITE": "Pidgeotite",
    "PINSIRITE": "Pinsirite",
    "RAYQUAZITE": "Rayquazite",
    "SABLENITE": "Sablenite",
    "SALAMENCITE": "Salamencite",
    "SCEPTILITE": "Sceptilite",
    "SCIZORITE": "Scizorite",
    "SHARPEDONITE": "Sharpedonite",
    "SLOWBRONITE": "Slowbronite",
    "STEELIXITE": "Steelixite",
    "SWAMPERTITE": "Swampertite",
    "TYRANITARITE": "Tyranitarite",
    "VENUSAURITE": "Venusaurite",

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
  TeraType: {
    "UNKNOWN": "Unknown",
    "NORMAL": "Normal",
    "FIGHTING": "Lutador",
    "FLYING": "Voador",
    "POISON": "Veneno",
    "GROUND": "Terra",
    "ROCK": "Pedra",
    "BUG": "Inseto",
    "GHOST": "Fantasma",
    "STEEL": "Aço",
    "FIRE": "Fogo",
    "WATER": "Água",
    "GRASS": "Grama",
    "ELECTRIC": "Elétrico",
    "PSYCHIC": "Psíquico",
    "ICE": "Gelo",
    "DRAGON": "Dragão",
    "DARK": "Sombrio",
    "FAIRY": "Fada",
    "STELLAR": "Estelar",
  },
} as const;