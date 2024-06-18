import { ModifierTypeTranslationEntries } from "#app/interfaces/locales";

export const modifierType: ModifierTypeTranslationEntries = {
  ModifierType: {
    "AddPokeballModifierType": {
      name: "{{modifierCount}}x {{pokeballName}}",
      description: "Ganhe x{{modifierCount}} {{pokeballName}} (Mochila: {{pokeballAmount}}) \nChance de captura: {{catchRate}}.",
    },
    "AddVoucherModifierType": {
      name: "{{modifierCount}}x {{voucherTypeName}}",
      description: "Ganhe x{{modifierCount}} {{voucherTypeName}}.",
    },
    "PokemonHeldItemModifierType": {
      extra: {
        "inoperable": "{{pokemonName}} não pode\nsegurar esse item!",
        "tooMany": "{{pokemonName}} tem muitos\nmuitos deste item!",
      }
    },
    "PokemonHpRestoreModifierType": {
      description: "Restaura {{restorePoints}} PS ou {{restorePercent}}% PS de um Pokémon, o que for maior.",
      extra: {
        "fully": "Restaura totalmente os PS de um Pokémon.",
        "fullyWithStatus": "Restaura totalmente os PS de um Pokémon e cura qualquer mudança de estado.",
      }
    },
    "PokemonReviveModifierType": {
      description: "Reanima um Pokémon e restaura {{restorePercent}}% PS.",
    },
    "PokemonStatusHealModifierType": {
      description: "Cura uma mudança de estado de um Pokémon.",
    },
    "PokemonPpRestoreModifierType": {
      description: "Restaura {{restorePoints}} PP para um movimento de um Pokémon.",
      extra: {
        "fully": "Restaura todos os PP para um movimento de um Pokémon.",
      }
    },
    "PokemonAllMovePpRestoreModifierType": {
      description: "Restaura {{restorePoints}} PP para todos os movimentos de um Pokémon.",
      extra: {
        "fully": "Restaura todos os PP para todos os movimentos de um Pokémon.",
      }
    },
    "PokemonPpUpModifierType": {
      description: "Aumenta permanentemente os PP para o movimento de um Pokémon em {{upPoints}} para cada 5 PP máximos (máximo 3).",
    },
    "PokemonNatureChangeModifierType": {
      name: "Hortelã {{natureName}}",
      description: "Muda a natureza do Pokémon para {{natureName}} e a desbloqueia permanentemente.",
    },
    "DoubleBattleChanceBoosterModifierType": {
      description: "Dobra as chances de encontrar uma batalha em dupla por {{battleCount}} batalhas.",
    },
    "TempBattleStatBoosterModifierType": {
      description: "Aumenta o atributo de {{tempBattleStatName}} para todos os membros da equipe por 5 batalhas.",
    },
    "AttackTypeBoosterModifierType": {
      description: "Aumenta o poder dos ataques do tipo {{moveType}} de um Pokémon em 20%.",
    },
    "PokemonLevelIncrementModifierType": {
      description: "Aumenta em 1 o nível de um Pokémon.",
    },
    "AllPokemonLevelIncrementModifierType": {
      description: "Aumenta em 1 os níveis de todos os Pokémon.",
    },
    "PokemonBaseStatBoosterModifierType": {
      description: "Aumenta o atributo base de {{statName}} em 10%. Quanto maior os IVs, maior o limite de aumento.",
    },
    "AllPokemonFullHpRestoreModifierType": {
      description: "Restaura totalmente os PS de todos os Pokémon.",
    },
    "AllPokemonFullReviveModifierType": {
      description: "Reanima todos os Pokémon, restaurando totalmente seus PS.",
    },
    "MoneyRewardModifierType": {
      description: "Garante uma quantidade {{moneyMultiplier}} de dinheiro (₽{{moneyAmount}}).",
      extra: {
        "small": "pequena",
        "moderate": "moderada",
        "large": "grande",
      },
    },
    "ExpBoosterModifierType": {
      description: "Aumenta o ganho de pontos de experiência em {{boostPercent}}%.",
    },
    "PokemonExpBoosterModifierType": {
      description: "Aumenta o ganho de pontos de experiência de quem segura em {{boostPercent}}%.",
    },
    "PokemonFriendshipBoosterModifierType": {
      description: "Aumenta o ganho de amizade por vitória em 50%.",
    },
    "PokemonMoveAccuracyBoosterModifierType": {
      description: "Aumenta a precisão dos movimentos em {{accuracyAmount}} (máximo 100).",
    },
    "PokemonMultiHitModifierType": {
      description: "Ataques acertam uma vez adicional ao custo de uma redução de poder de 60/75/82.5% por item, respectivamente.",
    },
    "TmModifierType": {
      name: "TM{{moveId}} - {{moveName}}",
      description: "Ensina {{moveName}} a um Pokémon.",
    },
    "TmModifierTypeWithInfo": {
      name: "TM{{moveId}} - {{moveName}}",
      description: "Ensina {{moveName}} a um Pokémon\n(Segure C ou Shift para mais informações).",
    },
    "EvolutionItemModifierType": {
      description: "Faz certos Pokémon evoluírem.",
    },
    "FormChangeItemModifierType": {
      description: "Faz certos Pokémon mudarem de forma.",
    },
    "FusePokemonModifierType": {
      description: "Combina dois Pokémon (transfere Habilidade, divide os atributos base e tipos, compartilha os movimentos).",
    },
    "TerastallizeModifierType": {
      name: "Fragmento Tera {{teraType}}",
      description: "Terastalize um Pokémon para o tipo {{teraType}} por 10 ondas.",
    },
    "ContactHeldItemTransferChanceModifierType": {
      description: "Quando atacar, tem {{chancePercent}}% de chance de roubar um item do oponente.",
    },
    "TurnHeldItemTransferModifierType": {
      description: "Todo turno, o Pokémon ganha um item aleatório do oponente.",
    },
    "EnemyAttackStatusEffectChanceModifierType": {
      description: "Ganha {{chancePercent}}% de chance de infligir {{statusEffect}} com ataques.",
    },
    "EnemyEndureChanceModifierType": {
      description: "Ganha {{chancePercent}}% de chance de sobreviver a um ataque que o faria desmaiar.",
    },

    "RARE_CANDY": { name: "Doce Raro" },
    "RARER_CANDY": { name: "Doce Raríssimo" },

    "MEGA_BRACELET": { name: "Mega Bracelete", description: "Mega Pedras ficam disponíveis." },
    "DYNAMAX_BAND": { name: "Bracelete Dynamax", description: "Cogumáximos ficam disponíveis." },
    "TERA_ORB": { name: "Orbe Tera", description: "Fragmentos Tera ficam disponíveis." },

    "MAP": { name: "Mapa", description: "Permite escolher a próxima rota." },

    "POTION": { name: "Poção" },
    "SUPER_POTION": { name: "Super Poção" },
    "HYPER_POTION": { name: "Hiper Poção" },
    "MAX_POTION": { name: "Poção Máxima" },
    "FULL_RESTORE": { name: "Restaurador" },

    "REVIVE": { name: "Reanimador" },
    "MAX_REVIVE": { name: "Reanimador Máximo" },

    "FULL_HEAL": { name: "Cura Total" },

    "SACRED_ASH": { name: "Cinza Sagrada" },

    "REVIVER_SEED": { name: "Semente Reanimadora", description: "Após desmaiar, reanima com 50% de PS." },

    "ETHER": { name: "Éter" },
    "MAX_ETHER": { name: "Éter Máximo" },

    "ELIXIR": { name: "Elixir" },
    "MAX_ELIXIR": { name: "Elixir Máximo" },

    "PP_UP": { name: "Mais PP" },
    "PP_MAX": { name: "PP Máximo" },

    "LURE": { name: "Incenso" },
    "SUPER_LURE": { name: "Super Incenso" },
    "MAX_LURE": { name: "Incenso Máximo" },

    "MEMORY_MUSHROOM": { name: "Cogumemória", description: "Relembra um movimento esquecido." },

    "EXP_SHARE": { name: "Compart. de Exp.", description: "Distribui pontos de experiência para todos os membros da equipe." },
    "EXP_BALANCE": { name: "Balanceador de Exp.", description: "Distribui pontos de experiência principalmente para os Pokémon mais fracos." },

    "OVAL_CHARM": { name: "Amuleto Oval", description: "Quando vários Pokémon participam de uma batalha, cada um recebe 10% extra de pontos de experiência." },

    "EXP_CHARM": { name: "Amuleto de Exp." },
    "SUPER_EXP_CHARM": { name: "Super Amuleto de Exp." },
    "GOLDEN_EXP_CHARM": { name: "Amuleto de Exp. Dourado" },

    "LUCKY_EGG": { name: "Ovo da Sorte" },
    "GOLDEN_EGG": { name: "Ovo Dourado" },

    "SOOTHE_BELL": { name: "Guizo" },

    "SOUL_DEW": { name: "Joia da Alma", description: "Aumenta a influência da natureza de um Pokémon em seus atributos em 10% (cumulativo)." },

    "NUGGET": { name: "Pepita" },
    "BIG_NUGGET": { name: "Pepita Grande" },
    "RELIC_GOLD": { name: "Relíquia de Ouro" },

    "AMULET_COIN": { name: "Moeda Amuleto", description: "Aumenta a recompensa de dinheiro em 50%." },
    "GOLDEN_PUNCH": { name: "Soco Dourado", description: "Concede 50% do dano causado em dinheiro." },
    "COIN_CASE": { name: "Moedeira", description: "Após cada 10ª batalha, recebe 10% de seu dinheiro em juros." },

    "LOCK_CAPSULE": { name: "Cápsula de Travamento", description: "Permite que você trave raridades de itens ao rolar novamente." },

    "GRIP_CLAW": { name: "Garra-Aperto" },
    "WIDE_LENS": { name: "Lente Ampla" },

    "MULTI_LENS": { name: "Multi Lentes" },

    "HEALING_CHARM": { name: "Amuleto de Cura", description: "Aumenta a eficácia dos movimentos e itens que restauram PS em 10% (exceto Reanimador)." },
    "CANDY_JAR": { name: "Pote de Doces", description: "Aumenta o número de níveis adicionados pelo Doce Raro em 1." },

    "BERRY_POUCH": { name: "Bolsa de Berries", description: "Adiciona uma chance de 30% de que uma berry usada não seja consumida." },

    "FOCUS_BAND": { name: "Bandana", description: "Adiciona uma chance de 10% de sobreviver com 1 PS após ser danificado o suficiente para desmaiar." },

    "QUICK_CLAW": { name: "Garra Rápida", description: "Adiciona uma chance de 10% de atacar primeiro, ignorando sua velocidade (após prioridades)." },

    "KINGS_ROCK": { name: "Pedra do Rei", description: "Adiciona uma chance de 10% de movimentos fazerem o oponente hesitar." },

    "LEFTOVERS": { name: "Sobras", description: "Cura 1/16 dos PS máximos de um Pokémon a cada turno." },
    "SHELL_BELL": { name: "Concha-Sino", description: "Cura 1/8 do dano causado por um Pokémon." },

    "TOXIC_ORB": { name: "Esfera Tóxica", description: "Uma esfera estranha que exala toxinas quando tocada e envenena seriamente quem a segurar." },
    "FLAME_ORB": { name: "Esfera da Chama", description: "Uma esfera estranha que aquece quando tocada e queima quem a segurar." },

    "BATON": { name: "Bastão", description: "Permite passar mudanças de atributo ao trocar Pokémon, ignorando armadilhas." },

    "SHINY_CHARM": { name: "Amuleto Brilhante", description: "Aumenta drasticamente a chance de um Pokémon selvagem ser Shiny." },
    "ABILITY_CHARM": { name: "Amuleto de Habilidade", description: "Aumenta drasticamente a chance de um Pokémon selvagem ter uma Habilidade Oculta." },

    "IV_SCANNER": { name: "Scanner de IVs", description: "Permite escanear os IVs de Pokémon selvagens. 2 IVs são revelados por item. Os melhores IVs são mostrados primeiro." },

    "DNA_SPLICERS": { name: "Splicer de DNA" },

    "MINI_BLACK_HOLE": { name: "Mini Buraco Negro" },

    "GOLDEN_POKEBALL": { name: "Poké Bola Dourada", description: "Adiciona 1 opção de item extra ao final de cada batalha." },

    "ENEMY_DAMAGE_BOOSTER": { name: "Token de Dano", description: "Aumenta o dano em 5%." },
    "ENEMY_DAMAGE_REDUCTION": { name: "Token de Proteção", description: "Reduz o dano recebido em 2,5%." },
    "ENEMY_HEAL": { name: "Token de Recuperação", description: "Cura 2% dos PS máximos a cada turno." },
    "ENEMY_ATTACK_POISON_CHANCE": { name: "Token de Veneno" },
    "ENEMY_ATTACK_PARALYZE_CHANCE": { name: "Token de Paralisia" },
    "ENEMY_ATTACK_BURN_CHANCE": { name: "Token de Queimadura" },
    "ENEMY_STATUS_EFFECT_HEAL_CHANCE": { name: "Token de Cura Total", description: "Adiciona uma chance de 2.5% a cada turno de curar uma condição de status." },
    "ENEMY_ENDURE_CHANCE": { name: "Token de Persistência" },
    "ENEMY_FUSED_CHANCE": { name: "Token de Fusão", description: "Adiciona uma chance de 1% de que um Pokémon selvagem seja uma fusão." },
  },
  TempBattleStatBoosterItem: {
    "x_attack": "Ataque X",
    "x_defense": "Defesa X",
    "x_sp_atk": "Ataque Esp. X",
    "x_sp_def": "Defesa Esp. X",
    "x_speed": "Velocidade X",
    "x_accuracy": "Precisão X",
    "dire_hit": "Direto",
  },

  TempBattleStatBoosterStatName: {
    "ATK": "Ataque",
    "DEF": "Defesa",
    "SPATK": "Ataque Esp.",
    "SPDEF": "Defesa Esp.",
    "SPD": "Velocidade",
    "ACC": "Precisão",
    "CRIT": "Chance de Acerto Crítico",
    "EVA": "Evasão",
    "DEFAULT": "???",
  },

  AttackTypeBoosterItem: {
    "silk_scarf": "Lenço de Seda",
    "black_belt": "Faixa Preta",
    "sharp_beak": "Bico Afiado",
    "poison_barb": "Farpa Venenosa",
    "soft_sand": "Areia Macia",
    "hard_stone": "Pedra Dura",
    "silver_powder": "Pó de Prata",
    "spell_tag": "Talismã de Feitiço",
    "metal_coat": "Revestimento Metálico",
    "charcoal": "Carvão",
    "mystic_water": "Água Mística",
    "miracle_seed": "Semente Milagrosa",
    "magnet": "Ímã",
    "twisted_spoon": "Colher Torcida",
    "never_melt_ice": "Gelo Eterno",
    "dragon_fang": "Presa de Dragão",
    "black_glasses": "Óculos Escuros",
    "fairy_feather": "Pena de Fada",
  },
  BaseStatBoosterItem: {
    "hp_up": "Mais PS",
    "protein": "Proteína",
    "iron": "Ferro",
    "calcium": "Cálcio",
    "zinc": "Zinco",
    "carbos": "Carboidrato",
  },
  EvolutionItem: {
    "NONE": "None",

    "LINKING_CORD": "Cabo de Conexão",
    "SUN_STONE": "Pedra do Sol",
    "MOON_STONE": "Pedra da Lua",
    "LEAF_STONE": "Pedra da Folha",
    "FIRE_STONE": "Pedra do Fogo",
    "WATER_STONE": "Pedra da Água",
    "THUNDER_STONE": "Pedra do Trovão",
    "ICE_STONE": "Pedra do Gelo",
    "DUSK_STONE": "Pedra do Crepúsculo",
    "DAWN_STONE": "Pedra da Alvorada",
    "SHINY_STONE": "Pedra Brilhante",
    "CRACKED_POT": "Vaso Quebrado",
    "SWEET_APPLE": "Maçã Doce",
    "TART_APPLE": "Maçã Azeda",
    "STRAWBERRY_SWEET": "Doce de Morango",
    "UNREMARKABLE_TEACUP": "Xícara Comum",

    "CHIPPED_POT": "Pote Lascado",
    "BLACK_AUGURITE": "Mineral Negro",
    "GALARICA_CUFF": "Bracelete de Galar",
    "GALARICA_WREATH": "Coroa de Galar",
    "PEAT_BLOCK": "Bloco de Turfa",
    "AUSPICIOUS_ARMOR": "Armadura Prometida",
    "MALICIOUS_ARMOR": "Armadura Maldita",
    "MASTERPIECE_TEACUP": "Xícara Excepcional",
    "METAL_ALLOY": "Liga de Metal",
    "SCROLL_OF_DARKNESS": "Pergaminho da Escuridão",
    "SCROLL_OF_WATERS": "Pergaminho da Água",
    "SYRUPY_APPLE": "Xarope de Maçã",
  },
  FormChangeItem: {
    "NONE": "None",

    "ABOMASITE": "Abomasita",
    "ABSOLITE": "Absolita",
    "AERODACTYLITE": "Aerodactylita",
    "AGGRONITE": "Aggronita",
    "ALAKAZITE": "Alakazita",
    "ALTARIANITE": "Altarianita",
    "AMPHAROSITE": "Ampharosita",
    "AUDINITE": "Audinita",
    "BANETTITE": "Banettita",
    "BEEDRILLITE": "Beedrillita",
    "BLASTOISINITE": "Blastoisinita",
    "BLAZIKENITE": "Blazikenita",
    "CAMERUPTITE": "Cameruptita",
    "CHARIZARDITE X": "Charizardita X",
    "CHARIZARDITE Y": "Charizardita Y",
    "DIANCITE": "Diancita",
    "GALLADITE": "Galladita",
    "GARCHOMPITE": "Garchompita",
    "GARDEVOIRITE": "Gardevoirita",
    "GENGARITE": "Gengarita",
    "GLALITITE": "Glalitita",
    "GYARADOSITE": "Gyaradosita",
    "HERACRONITE": "Heracronita",
    "HOUNDOOMINITE": "Houndoominita",
    "KANGASKHANITE": "Kangaskhanita",
    "LATIASITE": "Latiasita",
    "LATIOSITE": "Latiosita",
    "LOPUNNITE": "Lopunnita",
    "LUCARIONITE": "Lucarionita",
    "MANECTITE": "Manectita",
    "MAWILITE": "Mawilita",
    "MEDICHAMITE": "Medichamita",
    "METAGROSSITE": "Metagrossita",
    "MEWTWONITE X": "Mewtwonita X",
    "MEWTWONITE Y": "Mewtwonita Y",
    "PIDGEOTITE": "Pidgeotita",
    "PINSIRITE": "Pinsirita",
    "SABLENITE": "Sablenita",
    "RAYQUAZITE": "Rayquazita",
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
    "RED_ORB": "Orbe Vermelha",
    "SHARP_METEORITE": "Meteorito Afiado",
    "HARD_METEORITE": "Meteorito Duro",
    "SMOOTH_METEORITE": " Meteorito Liso",
    "ADAMANT_CRYSTAL": "Cristal Adamante",
    "LUSTROUS_GLOBE": "Globo Brilhante",
    "GRISEOUS_CORE": "Núcleo Platinado",
    "REVEAL_GLASS": "Espelho da Verdade",
    "GRACIDEA": "Gracídea",
    "MAX_MUSHROOMS": "Cogumáximo",
    "DARK_STONE": "Pedra das Trevas",
    "LIGHT_STONE": "Pedra da Luz",
    "PRISON_BOTTLE": "Garrafa Prisão",
    "N_LUNARIZER": "Lunarizador N",
    "N_SOLARIZER": "Solarizador N",
    "RUSTED_SWORD": "Espada Enferrujada",
    "RUSTED_SHIELD": "Escudo Enferrujado",
    "ICY_REINS_OF_UNITY": "Rédeas de Gelo da União",
    "SHADOW_REINS_OF_UNITY": "Rédeas Sombrias da União",
    "WELLSPRING_MASK": "Máscara Nascente",
    "HEARTHFLAME_MASK": "Máscara Fornalha",
    "CORNERSTONE_MASK": "Máscara Alicerce",
    "SHOCK_DRIVE": "MagneDisco",
    "BURN_DRIVE": "IgneDisco",
    "CHILL_DRIVE": "CrioDisco",
    "DOUSE_DRIVE": "HidroDisco",

    "FIST_PLATE": "Placa de Punho",
    "SKY_PLATE": "Placa do Céu",
    "TOXIC_PLATE": "Placa Tóxica",
    "EARTH_PLATE": "Placa Terrestre",
    "STONE_PLATE": "Placa de Pedra",
    "INSECT_PLATE": "Placa de Insetos",
    "SPOOKY_PLATE": "Placa Assustadora",
    "IRON_PLATE": "Placa de Ferro",
    "FLAME_PLATE": "Placa da Chama",
    "SPLASH_PLATE": "Placa de Respingo",
    "MEADOW_PLATE": "Placa de Prado",
    "ZAP_PLATE": "Placa Elétrica",
    "MIND_PLATE": "Placa Mental",
    "ICICLE_PLATE": "Placa de Gelo",
    "DRACO_PLATE": "Placa de Draco",
    "DREAD_PLATE": "Placa do Pavor",
    "PIXIE_PLATE": "Placa Duende",
    "BLANK_PLATE": "Placa em Branco",
    "LEGEND_PLATE": "Placa de Legenda",
    "FIGHTING_MEMORY": "Memória de Lutador",
    "FLYING_MEMORY": "Memória Voadora",
    "POISON_MEMORY": "Memória Venenosa",
    "GROUND_MEMORY": "Memória Terrestre",
    "ROCK_MEMORY": "Memória da Rocha",
    "BUG_MEMORY": "Memória de Insetos",
    "GHOST_MEMORY": "Memória Fantasma",
    "STEEL_MEMORY": "Memória de Aço",
    "FIRE_MEMORY": "Memória de Fogo",
    "WATER_MEMORY": "Memória da Água",
    "GRASS_MEMORY": "Memória de Planta",
    "ELECTRIC_MEMORY": "Memória Elétrica",
    "PSYCHIC_MEMORY": "Memória Psíquica",
    "ICE_MEMORY": "Memória de Gelo",
    "DRAGON_MEMORY": "Memória do Dragão",
    "DARK_MEMORY": "Memória Negra",
    "FAIRY_MEMORY": "Memória de Fada",
    "BLANK_MEMORY": "Memória Vazia",
  },
} as const;
