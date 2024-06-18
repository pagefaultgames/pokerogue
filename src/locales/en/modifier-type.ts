import { ModifierTypeTranslationEntries } from "#app/interfaces/locales";

export const modifierType: ModifierTypeTranslationEntries = {
  ModifierType: {
    "AddPokeballModifierType": {
      name: "{{modifierCount}}x {{pokeballName}}",
      description: "Receive {{pokeballName}} x{{modifierCount}} (Inventory: {{pokeballAmount}}) \nCatch Rate: {{catchRate}}",
    },
    "AddVoucherModifierType": {
      name: "{{modifierCount}}x {{voucherTypeName}}",
      description: "Receive {{voucherTypeName}} x{{modifierCount}}.",
    },
    "PokemonHeldItemModifierType": {
      extra: {
        "inoperable": "{{pokemonName}} can't take\nthis item!",
        "tooMany": "{{pokemonName}} has too many\nof this item!",
      }
    },
    "PokemonHpRestoreModifierType": {
      description: "Restores {{restorePoints}} HP or {{restorePercent}}% HP for one Pokémon, whichever is higher.",
      extra: {
        "fully": "Fully restores HP for one Pokémon.",
        "fullyWithStatus": "Fully restores HP for one Pokémon and heals any status ailment.",
      }
    },
    "PokemonReviveModifierType": {
      description: "Revives one Pokémon and restores {{restorePercent}}% HP.",
    },
    "PokemonStatusHealModifierType": {
      description: "Heals any status ailment for one Pokémon.",
    },
    "PokemonPpRestoreModifierType": {
      description: "Restores {{restorePoints}} PP for one Pokémon move.",
      extra: {
        "fully": "Restores all PP for one Pokémon move.",
      }
    },
    "PokemonAllMovePpRestoreModifierType": {
      description: "Restores {{restorePoints}} PP for all of one Pokémon's moves.",
      extra: {
        "fully": "Restores all PP for all of one Pokémon's moves.",
      }
    },
    "PokemonPpUpModifierType": {
      description: "Permanently increases PP for one Pokémon move by {{upPoints}} for every 5 maximum PP (maximum 3).",
    },
    "PokemonNatureChangeModifierType": {
      name: "{{natureName}} Mint",
      description: "Changes a Pokémon's nature to {{natureName}} and permanently unlocks the nature for the starter.",
    },
    "DoubleBattleChanceBoosterModifierType": {
      description: "Doubles the chance of an encounter being a double battle for {{battleCount}} battles.",
    },
    "TempBattleStatBoosterModifierType": {
      description: "Increases the {{tempBattleStatName}} of all party members by 1 stage for 5 battles.",
    },
    "AttackTypeBoosterModifierType": {
      description: "Increases the power of a Pokémon's {{moveType}}-type moves by 20%.",
    },
    "PokemonLevelIncrementModifierType": {
      description: "Increases a Pokémon's level by 1.",
    },
    "AllPokemonLevelIncrementModifierType": {
      description: "Increases all party members' level by 1.",
    },
    "PokemonBaseStatBoosterModifierType": {
      description: "Increases the holder's base {{statName}} by 10%. The higher your IVs, the higher the stack limit.",
    },
    "AllPokemonFullHpRestoreModifierType": {
      description: "Restores 100% HP for all Pokémon.",
    },
    "AllPokemonFullReviveModifierType": {
      description: "Revives all fainted Pokémon, fully restoring HP.",
    },
    "MoneyRewardModifierType": {
      description: "Grants a {{moneyMultiplier}} amount of money (₽{{moneyAmount}}).",
      extra: {
        "small": "small",
        "moderate": "moderate",
        "large": "large",
      },
    },
    "ExpBoosterModifierType": {
      description: "Increases gain of EXP. Points by {{boostPercent}}%.",
    },
    "PokemonExpBoosterModifierType": {
      description: "Increases the holder's gain of EXP. Points by {{boostPercent}}%.",
    },
    "PokemonFriendshipBoosterModifierType": {
      description: "Increases friendship gain per victory by 50%.",
    },
    "PokemonMoveAccuracyBoosterModifierType": {
      description: "Increases move accuracy by {{accuracyAmount}} (maximum 100).",
    },
    "PokemonMultiHitModifierType": {
      description: "Attacks hit one additional time at the cost of a 60/75/82.5% power reduction per stack respectively.",
    },
    "TmModifierType": {
      name: "TM{{moveId}} - {{moveName}}",
      description: "Teach {{moveName}} to a Pokémon.",
    },
    "TmModifierTypeWithInfo": {
      name: "TM{{moveId}} - {{moveName}}",
      description: "Teach {{moveName}} to a Pokémon\n(Hold C or Shift for more info).",
    },
    "EvolutionItemModifierType": {
      description: "Causes certain Pokémon to evolve.",
    },
    "FormChangeItemModifierType": {
      description: "Causes certain Pokémon to change form.",
    },
    "FusePokemonModifierType": {
      description: "Combines two Pokémon (transfers Ability, splits base stats and types, shares move pool).",
    },
    "TerastallizeModifierType": {
      name: "{{teraType}} Tera Shard",
      description: "{{teraType}} Terastallizes the holder for up to 10 battles.",
    },
    "ContactHeldItemTransferChanceModifierType": {
      description: "Upon attacking, there is a {{chancePercent}}% chance the foe's held item will be stolen.",
    },
    "TurnHeldItemTransferModifierType": {
      description: "Every turn, the holder acquires one held item from the foe.",
    },
    "EnemyAttackStatusEffectChanceModifierType": {
      description: "Adds a {{chancePercent}}% chance to inflict {{statusEffect}} with attack moves.",
    },
    "EnemyEndureChanceModifierType": {
      description: "Adds a {{chancePercent}}% chance of enduring a hit.",
    },

    "RARE_CANDY": { name: "Rare Candy" },
    "RARER_CANDY": { name: "Rarer Candy" },

    "MEGA_BRACELET": { name: "Mega Bracelet", description: "Mega Stones become available." },
    "DYNAMAX_BAND": { name: "Dynamax Band", description: "Max Mushrooms become available." },
    "TERA_ORB": { name: "Tera Orb", description: "Tera Shards become available." },

    "MAP": { name: "Map", description: "Allows you to choose your destination at a crossroads." },

    "POTION": { name: "Potion" },
    "SUPER_POTION": { name: "Super Potion" },
    "HYPER_POTION": { name: "Hyper Potion" },
    "MAX_POTION": { name: "Max Potion" },
    "FULL_RESTORE": { name: "Full Restore" },

    "REVIVE": { name: "Revive" },
    "MAX_REVIVE": { name: "Max Revive" },

    "FULL_HEAL": { name: "Full Heal" },

    "SACRED_ASH": { name: "Sacred Ash" },

    "REVIVER_SEED": { name: "Reviver Seed", description: "Revives the holder for 1/2 HP upon fainting." },

    "ETHER": { name: "Ether" },
    "MAX_ETHER": { name: "Max Ether" },

    "ELIXIR": { name: "Elixir" },
    "MAX_ELIXIR": { name: "Max Elixir" },

    "PP_UP": { name: "PP Up" },
    "PP_MAX": { name: "PP Max" },

    "LURE": { name: "Lure" },
    "SUPER_LURE": { name: "Super Lure" },
    "MAX_LURE": { name: "Max Lure" },

    "MEMORY_MUSHROOM": { name: "Memory Mushroom", description: "Recall one Pokémon's forgotten move." },

    "EXP_SHARE": { name: "EXP. All", description: "Non-participants receive 20% of a single participant's EXP. Points." },
    "EXP_BALANCE": { name: "EXP. Balance", description: "Weighs EXP. Points received from battles towards lower-leveled party members." },

    "OVAL_CHARM": { name: "Oval Charm", description: "When multiple Pokémon participate in a battle, each gets an extra 10% of the total EXP." },

    "EXP_CHARM": { name: "EXP. Charm" },
    "SUPER_EXP_CHARM": { name: "Super EXP. Charm" },
    "GOLDEN_EXP_CHARM": { name: "Golden EXP. Charm" },

    "LUCKY_EGG": { name: "Lucky Egg" },
    "GOLDEN_EGG": { name: "Golden Egg" },

    "SOOTHE_BELL": { name: "Soothe Bell" },

    "SOUL_DEW": { name: "Soul Dew", description: "Increases the influence of a Pokémon's nature on its stats by 10% (additive)." },

    "NUGGET": { name: "Nugget" },
    "BIG_NUGGET": { name: "Big Nugget" },
    "RELIC_GOLD": { name: "Relic Gold" },

    "AMULET_COIN": { name: "Amulet Coin", description: "Increases money rewards by 20%." },
    "GOLDEN_PUNCH": { name: "Golden Punch", description: "Grants 50% of direct damage inflicted as money." },
    "COIN_CASE": { name: "Coin Case", description: "After every 10th battle, receive 10% of your money in interest." },

    "LOCK_CAPSULE": { name: "Lock Capsule", description: "Allows you to lock item rarities when rerolling items." },

    "GRIP_CLAW": { name: "Grip Claw" },
    "WIDE_LENS": { name: "Wide Lens" },

    "MULTI_LENS": { name: "Multi Lens" },

    "HEALING_CHARM": { name: "Healing Charm", description: "Increases the effectiveness of HP restoring moves and items by 10% (excludes Revives)." },
    "CANDY_JAR": { name: "Candy Jar", description: "Increases the number of levels added by Rare Candy items by 1." },

    "BERRY_POUCH": { name: "Berry Pouch", description: "Adds a 30% chance that a used berry will not be consumed." },

    "FOCUS_BAND": { name: "Focus Band", description: "Adds a 10% chance to survive with 1 HP after being damaged enough to faint." },

    "QUICK_CLAW": { name: "Quick Claw", description: "Adds a 10% chance to move first regardless of speed (after priority)." },

    "KINGS_ROCK": { name: "King's Rock", description: "Adds a 10% chance an attack move will cause the opponent to flinch." },

    "LEFTOVERS": { name: "Leftovers", description: "Heals 1/16 of a Pokémon's maximum HP every turn." },
    "SHELL_BELL": { name: "Shell Bell", description: "Heals 1/8 of a Pokémon's dealt damage." },

    "TOXIC_ORB": { name: "Toxic Orb", description: "It's a bizarre orb that exudes toxins when touched and will badly poison the holder during battle." },
    "FLAME_ORB": { name: "Flame Orb", description: "It's a bizarre orb that gives off heat when touched and will affect the holder with a burn during battle." },

    "BATON": { name: "Baton", description: "Allows passing along effects when switching Pokémon, which also bypasses traps." },

    "SHINY_CHARM": { name: "Shiny Charm", description: "Dramatically increases the chance of a wild Pokémon being Shiny." },
    "ABILITY_CHARM": { name: "Ability Charm", description: "Dramatically increases the chance of a wild Pokémon having a Hidden Ability." },

    "IV_SCANNER": { name: "IV Scanner", description: "Allows scanning the IVs of wild Pokémon. 2 IVs are revealed per stack. The best IVs are shown first." },

    "DNA_SPLICERS": { name: "DNA Splicers" },

    "MINI_BLACK_HOLE": { name: "Mini Black Hole" },

    "GOLDEN_POKEBALL": { name: "Golden Poké Ball", description: "Adds 1 extra item option at the end of every battle." },

    "ENEMY_DAMAGE_BOOSTER": { name: "Damage Token", description: "Increases damage by 5%." },
    "ENEMY_DAMAGE_REDUCTION": { name: "Protection Token", description: "Reduces incoming damage by 2.5%." },
    "ENEMY_HEAL": { name: "Recovery Token", description: "Heals 2% of max HP every turn." },
    "ENEMY_ATTACK_POISON_CHANCE": { name: "Poison Token" },
    "ENEMY_ATTACK_PARALYZE_CHANCE": { name: "Paralyze Token" },
    "ENEMY_ATTACK_BURN_CHANCE": { name: "Burn Token" },
    "ENEMY_STATUS_EFFECT_HEAL_CHANCE": { name: "Full Heal Token", description: "Adds a 2.5% chance every turn to heal a status condition." },
    "ENEMY_ENDURE_CHANCE": { name: "Endure Token" },
    "ENEMY_FUSED_CHANCE": { name: "Fusion Token", description: "Adds a 1% chance that a wild Pokémon will be a fusion." },
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

  TempBattleStatBoosterStatName: {
    "ATK": "Attack",
    "DEF": "Defense",
    "SPATK": "Sp. Atk",
    "SPDEF": "Sp. Def",
    "SPD": "Speed",
    "ACC": "Accuracy",
    "CRIT": "Critical Hit Ratio",
    "EVA": "Evasiveness",
    "DEFAULT": "???",
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
    "hp_up": "HP Up",
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
    "LUSTROUS_GLOBE": "Lustrous Globe",
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

    "FIST_PLATE": "Fist Plate",
    "SKY_PLATE": "Sky Plate",
    "TOXIC_PLATE": "Toxic Plate",
    "EARTH_PLATE": "Earth Plate",
    "STONE_PLATE": "Stone Plate",
    "INSECT_PLATE": "Insect Plate",
    "SPOOKY_PLATE": "Spooky Plate",
    "IRON_PLATE": "Iron Plate",
    "FLAME_PLATE": "Flame Plate",
    "SPLASH_PLATE": "Splash Plate",
    "MEADOW_PLATE": "Meadow Plate",
    "ZAP_PLATE": "Zap Plate",
    "MIND_PLATE": "Mind Plate",
    "ICICLE_PLATE": "Icicle Plate",
    "DRACO_PLATE": "Draco Plate",
    "DREAD_PLATE": "Dread Plate",
    "PIXIE_PLATE": "Pixie Plate",
    "BLANK_PLATE": "Blank Plate",
    "LEGEND_PLATE": "Legend Plate",
    "FIGHTING_MEMORY": "Fighting Memory",
    "FLYING_MEMORY": "Flying Memory",
    "POISON_MEMORY": "Poison Memory",
    "GROUND_MEMORY": "Ground Memory",
    "ROCK_MEMORY": "Rock Memory",
    "BUG_MEMORY": "Bug Memory",
    "GHOST_MEMORY": "Ghost Memory",
    "STEEL_MEMORY": "Steel Memory",
    "FIRE_MEMORY": "Fire Memory",
    "WATER_MEMORY": "Water Memory",
    "GRASS_MEMORY": "Grass Memory",
    "ELECTRIC_MEMORY": "Electric Memory",
    "PSYCHIC_MEMORY": "Psychic Memory",
    "ICE_MEMORY": "Ice Memory",
    "DRAGON_MEMORY": "Dragon Memory",
    "DARK_MEMORY": "Dark Memory",
    "FAIRY_MEMORY": "Fairy Memory",
    "BLANK_MEMORY": "Blank Memory",
  },
} as const;
