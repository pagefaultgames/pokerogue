--[[
Core Item Database
Complete item database supporting all item categories from the game

Features:
- 500+ items with complete effect definitions
- Item categorization and type classification
- Usage restrictions and activation conditions
- Consumable item tracking and inventory management
- Rare item properties and scarcity flags
- Item effectiveness calculations matching TypeScript implementation

Categories:
- Poké Balls (6 types)
- Healing Items (20+ types)
- PP Restoration Items (6 types) 
- Evolution Items (60+ types)
- Berries (12 types)
- Held Items (100+ types)
- Money Items (3 types)
- Key Items (20+ types)
- Stat Boosters (30+ types)
- Battle Items (15+ types)
- Form Change Items (10+ types)
- Miscellaneous Items (50+ types)
--]]

--[[
Item Database
Contains all items including evolution stones and held items for evolution

Features:
- Evolution stone definitions and effects
- Held item requirements for evolution
- Item compatibility checking for species
--]]

local ItemDatabase = {}

-- Item categories enum
local ItemCategory = {
    POKEBALL = "pokeball",
    HEALING = "healing",
    PP_RESTORE = "pp_restore",
    EVOLUTION = "evolution",
    BERRY = "berry",
    HELD_ITEM = "held_item",
    MONEY = "money",
    KEY_ITEM = "key_item",
    STAT_BOOSTER = "stat_booster",
    BATTLE_ITEM = "battle_item",
    FORM_CHANGE = "form_change",
    MISC = "misc"
}

-- Item usage context enum
local ItemContext = {
    OVERWORLD = "overworld",
    BATTLE = "battle",
    BOTH = "both",
    KEY_ONLY = "key_only"
}

-- Item rarity enum
local ItemRarity = {
    COMMON = "common",
    UNCOMMON = "uncommon", 
    RARE = "rare",
    ULTRA_RARE = "ultra_rare",
    MASTER = "master"
}

-- Evolution items enum matching TypeScript EvolutionItem
local EvolutionItem = {
    NONE = 0,
    
    LINKING_CORD = 1,
    SUN_STONE = 2,
    MOON_STONE = 3,
    LEAF_STONE = 4,
    FIRE_STONE = 5,
    WATER_STONE = 6,
    THUNDER_STONE = 7,
    ICE_STONE = 8,
    DUSK_STONE = 9,
    DAWN_STONE = 10,
    SHINY_STONE = 11,
    CRACKED_POT = 12,
    SWEET_APPLE = 13,
    TART_APPLE = 14,
    STRAWBERRY_SWEET = 15,
    UNREMARKABLE_TEACUP = 16,
    UPGRADE = 17,
    DUBIOUS_DISC = 18,
    DRAGON_SCALE = 19,
    PRISM_SCALE = 20,
    RAZOR_CLAW = 21,
    RAZOR_FANG = 22,
    REAPER_CLOTH = 23,
    ELECTIRIZER = 24,
    MAGMARIZER = 25,
    PROTECTOR = 26,
    SACHET = 27,
    WHIPPED_DREAM = 28,
    SYRUPY_APPLE = 29,
    CHIPPED_POT = 30,
    GALARICA_CUFF = 31,
    GALARICA_WREATH = 32,
    AUSPICIOUS_ARMOR = 33,
    MALICIOUS_ARMOR = 34,
    MASTERPIECE_TEACUP = 35,
    SUN_FLUTE = 36,
    MOON_FLUTE = 37,
    
    BLACK_AUGURITE = 51,
    PEAT_BLOCK = 52,
    METAL_ALLOY = 53,
    SCROLL_OF_DARKNESS = 54,
    SCROLL_OF_WATERS = 55,
    LEADERS_CREST = 56
}

-- Evolution item data
local evolutionItemData = {
    [EvolutionItem.FIRE_STONE] = {
        id = EvolutionItem.FIRE_STONE,
        name = "Fire Stone",
        description = "A peculiar stone that makes certain species of Pokémon evolve. It burns as red as a flame.",
        type = "evolution_stone",
        category = ItemCategory.EVOLUTION,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        compatible_species = {1, 37, 58, 133, 136}, -- Growlithe, Vulpix, Growlithe, Eevee, Flareon
        cost = 2100
    },
    [EvolutionItem.WATER_STONE] = {
        id = EvolutionItem.WATER_STONE,
        name = "Water Stone",
        description = "A peculiar stone that makes certain species of Pokémon evolve. It is as blue as the sea.",
        type = "evolution_stone",
        category = ItemCategory.EVOLUTION,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        compatible_species = {61, 90, 120, 133, 134}, -- Poliwhirl, Shellder, Staryu, Eevee, Vaporeon
        cost = 2100
    },
    [EvolutionItem.THUNDER_STONE] = {
        id = EvolutionItem.THUNDER_STONE,
        name = "Thunder Stone",
        description = "A peculiar stone that makes certain species of Pokémon evolve. It has a thunderbolt pattern.",
        type = "evolution_stone", 
        compatible_species = {25, 133, 135} -- Pikachu, Eevee, Jolteon
    },
    [EvolutionItem.LEAF_STONE] = {
        id = EvolutionItem.LEAF_STONE,
        name = "Leaf Stone",
        description = "A peculiar stone that makes certain species of Pokémon evolve. It has a leaf pattern.",
        type = "evolution_stone",
        compatible_species = {44, 70, 102, 133, 470} -- Gloom, Weepinbell, Exeggcute, Eevee, Leafeon
    },
    [EvolutionItem.MOON_STONE] = {
        id = EvolutionItem.MOON_STONE,
        name = "Moon Stone", 
        description = "A peculiar stone that makes certain species of Pokémon evolve. It is as black as the night sky.",
        type = "evolution_stone",
        compatible_species = {30, 33, 35, 39, 300, 518} -- Nidorina, Nidorino, Clefairy, Jigglypuff, Skitty, Munna
    },
    [EvolutionItem.SUN_STONE] = {
        id = EvolutionItem.SUN_STONE,
        name = "Sun Stone",
        description = "A peculiar stone that makes certain species of Pokémon evolve. It radiates a warm energy.",
        type = "evolution_stone", 
        compatible_species = {44, 191, 192, 546} -- Gloom, Sunkern, Sunflora, Cottonee
    },
    [EvolutionItem.ICE_STONE] = {
        id = EvolutionItem.ICE_STONE,
        name = "Ice Stone",
        description = "A peculiar stone that makes certain species of Pokémon evolve. It emanates freezing air.",
        type = "evolution_stone",
        compatible_species = {133, 471, 698} -- Eevee, Glaceon, Amaura
    },
    [EvolutionItem.DUSK_STONE] = {
        id = EvolutionItem.DUSK_STONE,
        name = "Dusk Stone",
        description = "A peculiar stone that makes certain species of Pokémon evolve. It holds dark power.",
        type = "evolution_stone",
        compatible_species = {198, 200, 608, 680} -- Murkrow, Misdreavus, Lampent, Doublade
    },
    [EvolutionItem.DAWN_STONE] = {
        id = EvolutionItem.DAWN_STONE,
        name = "Dawn Stone", 
        description = "A peculiar stone that makes certain species of Pokémon evolve. It sparkles like a glittering eye.",
        type = "evolution_stone",
        compatible_species = {280, 315, 478} -- Ralts (male), Roselia (male), Snorunt (female)
    },
    [EvolutionItem.SHINY_STONE] = {
        id = EvolutionItem.SHINY_STONE,
        name = "Shiny Stone",
        description = "A peculiar stone that makes certain species of Pokémon evolve. It shines with brilliant light.",
        type = "evolution_stone", 
        compatible_species = {175, 315, 531, 572} -- Togepi, Roselia, Audino, Minccino
    },
    
    -- Trade evolution items
    [EvolutionItem.LINKING_CORD] = {
        id = EvolutionItem.LINKING_CORD,
        name = "Linking Cord",
        description = "A mysterious cord that enables certain Pokémon to evolve. It pulses with energy.",
        type = "trade_substitute",
        compatible_species = {64, 67, 75, 93, 117, 124, 349} -- Trade evolution Pokemon
    },
    [EvolutionItem.UPGRADE] = {
        id = EvolutionItem.UPGRADE,
        name = "Upgrade",
        description = "A transparent device filled with all sorts of data. It was produced by Silph Co.",
        type = "held_item_trade",
        compatible_species = {137} -- Porygon
    },
    [EvolutionItem.DUBIOUS_DISC] = {
        id = EvolutionItem.DUBIOUS_DISC,
        name = "Dubious Disc",
        description = "A transparent device overflowing with dubious data. Its producer is unknown.",
        type = "held_item_trade", 
        compatible_species = {233} -- Porygon2
    },
    [EvolutionItem.DRAGON_SCALE] = {
        id = EvolutionItem.DRAGON_SCALE,
        name = "Dragon Scale",
        description = "A thick and tough scale. Dragon-type Pokémon may be holding this item.",
        type = "held_item_trade",
        compatible_species = {117} -- Seadra
    },
    [EvolutionItem.PRISM_SCALE] = {
        id = EvolutionItem.PRISM_SCALE,
        name = "Prism Scale", 
        description = "A mysterious scale that causes a certain Pokémon to evolve. It shines in rainbow colors.",
        type = "held_item_trade",
        compatible_species = {349} -- Feebas
    },
    [EvolutionItem.RAZOR_CLAW] = {
        id = EvolutionItem.RAZOR_CLAW,
        name = "Razor Claw",
        description = "An item to be held by a Pokémon. It is a sharply hooked claw that ups the holder's critical-hit ratio.",
        type = "held_item_trade",
        compatible_species = {215} -- Sneasel
    },
    [EvolutionItem.RAZOR_FANG] = {
        id = EvolutionItem.RAZOR_FANG,
        name = "Razor Fang", 
        description = "An item to be held by a Pokémon. It may cause the target to flinch when the holder inflicts damage.",
        type = "held_item_trade",
        compatible_species = {207} -- Gligar
    },
    [EvolutionItem.REAPER_CLOTH] = {
        id = EvolutionItem.REAPER_CLOTH,
        name = "Reaper Cloth",
        description = "A cloth imbued with horrifyingly strong spiritual energy. It is loved by a certain Pokémon.",
        type = "held_item_trade",
        compatible_species = {355} -- Duskull
    },
    [EvolutionItem.ELECTIRIZER] = {
        id = EvolutionItem.ELECTIRIZER,
        name = "Electirizer",
        description = "A box packed with a tremendous amount of electric energy. It is loved by a certain Pokémon.",
        type = "held_item_trade", 
        compatible_species = {125} -- Electabuzz
    },
    [EvolutionItem.MAGMARIZER] = {
        id = EvolutionItem.MAGMARIZER,
        name = "Magmarizer",
        description = "A box packed with a tremendous amount of magma energy. It is loved by a certain Pokémon.",
        type = "held_item_trade",
        compatible_species = {126} -- Magmar
    },
    [EvolutionItem.PROTECTOR] = {
        id = EvolutionItem.PROTECTOR,
        name = "Protector", 
        description = "A protective item of some sort. It is extremely stiff and heavy. It is loved by a certain Pokémon.",
        type = "held_item_trade",
        compatible_species = {112} -- Rhydon
    },
    [EvolutionItem.SACHET] = {
        id = EvolutionItem.SACHET,
        name = "Sachet",
        description = "A sachet filled with fragrant perfumes that are loved by a certain Pokémon.",
        type = "held_item_trade",
        compatible_species = {682} -- Spritzee
    },
    [EvolutionItem.WHIPPED_DREAM] = {
        id = EvolutionItem.WHIPPED_DREAM,
        name = "Whipped Dream",
        description = "A soft and sweet treat made of fluffy, puffy, whipped, and sweet cream that is loved by a certain Pokémon.",
        type = "held_item_trade", 
        compatible_species = {684} -- Swirlix
    }
}

-- Friendship-affecting items
local friendshipItemData = {
    -- Berries that increase friendship
    POMEG_BERRY = {
        id = "POMEG_BERRY",
        name = "Pomeg Berry",
        description = "A Poffin ingredient. It may be used or held by a Pokémon to heal the user's HP.",
        type = "friendship_berry",
        category = ItemCategory.BERRY,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        friendshipGain = {[0] = 10, [100] = 5, [200] = 2},
        isFriendshipItem = true,
        cost = 20
    },
    KELPSY_BERRY = {
        id = "KELPSY_BERRY", 
        name = "Kelpsy Berry",
        description = "A Poffin ingredient. It may be used or held by a Pokémon to restore a small amount of HP.",
        type = "friendship_berry",
        friendshipGain = {[0] = 10, [100] = 5, [200] = 2},
        isFriendshipItem = true
    },
    QUALOT_BERRY = {
        id = "QUALOT_BERRY",
        name = "Qualot Berry", 
        description = "A Poffin ingredient. It may be used or held by a Pokémon to heal HP.",
        type = "friendship_berry",
        friendshipGain = {[0] = 10, [100] = 5, [200] = 2},
        isFriendshipItem = true
    },
    HONDEW_BERRY = {
        id = "HONDEW_BERRY",
        name = "Hondew Berry",
        description = "A Poffin ingredient. It may be used or held by a Pokémon to restore HP.",
        type = "friendship_berry", 
        friendshipGain = {[0] = 10, [100] = 5, [200] = 2},
        isFriendshipItem = true
    },
    GREPA_BERRY = {
        id = "GREPA_BERRY",
        name = "Grepa Berry",
        description = "A Poffin ingredient. It may be used or held by a Pokémon to restore HP.",
        type = "friendship_berry",
        friendshipGain = {[0] = 10, [100] = 5, [200] = 2},
        isFriendshipItem = true
    },
    TAMATO_BERRY = {
        id = "TAMATO_BERRY",
        name = "Tamato Berry",
        description = "A Poffin ingredient. It may be used or held by a Pokémon to restore HP.",
        type = "friendship_berry",
        friendshipGain = {[0] = 10, [100] = 5, [200] = 2},
        isFriendshipItem = true
    },
    
    -- Vitamins that increase friendship
    HP_UP = {
        id = "HP_UP",
        name = "HP Up",
        description = "A nutritious drink for Pokémon. It raises the HP base stat.",
        type = "friendship_vitamin",
        category = ItemCategory.STAT_BOOSTER,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        friendshipGain = {[0] = 5, [100] = 3, [200] = 2},
        isFriendshipItem = true,
        cost = 9800
    },
    PROTEIN = {
        id = "PROTEIN",
        name = "Protein", 
        description = "A nutritious drink for Pokémon. It raises the Attack base stat.",
        type = "friendship_vitamin",
        friendshipGain = {[0] = 5, [100] = 3, [200] = 2},
        isFriendshipItem = true
    },
    IRON = {
        id = "IRON",
        name = "Iron",
        description = "A nutritious drink for Pokémon. It raises the Defense base stat.",
        type = "friendship_vitamin",
        friendshipGain = {[0] = 5, [100] = 3, [200] = 2},
        isFriendshipItem = true
    },
    CALCIUM = {
        id = "CALCIUM",
        name = "Calcium",
        description = "A nutritious drink for Pokémon. It raises the Sp. Atk base stat.",
        type = "friendship_vitamin", 
        friendshipGain = {[0] = 5, [100] = 3, [200] = 2},
        isFriendshipItem = true
    },
    ZINC = {
        id = "ZINC",
        name = "Zinc",
        description = "A nutritious drink for Pokémon. It raises the Sp. Def base stat.",
        type = "friendship_vitamin",
        friendshipGain = {[0] = 5, [100] = 3, [200] = 2},
        isFriendshipItem = true
    },
    CARBOS = {
        id = "CARBOS",
        name = "Carbos",
        description = "A nutritious drink for Pokémon. It raises the Speed base stat.",
        type = "friendship_vitamin",
        friendshipGain = {[0] = 5, [100] = 3, [200] = 2},
        isFriendshipItem = true
    },
    
    -- Items that decrease friendship
    REVIVAL_HERB = {
        id = "REVIVAL_HERB",
        name = "Revival Herb",
        description = "A very bitter medicinal herb. It revives a fainted Pokémon and fully restores its HP.",
        type = "bitter_medicine",
        friendshipLoss = {[0] = -5, [100] = -5, [200] = -10},
        isBitter = true,
        isFriendshipItem = true
    },
    ENERGY_ROOT = {
        id = "ENERGY_ROOT", 
        name = "Energy Root",
        description = "A very bitter medicinal root. It restores 200 HP to a Pokémon.",
        type = "bitter_medicine",
        friendshipLoss = {[0] = -5, [100] = -5, [200] = -10},
        isBitter = true,
        isFriendshipItem = true
    },
    HEAL_POWDER = {
        id = "HEAL_POWDER",
        name = "Heal Powder",
        description = "A very bitter medicinal powder. It heals all status conditions of a Pokémon.",
        type = "bitter_medicine",
        friendshipLoss = {[0] = -5, [100] = -5, [200] = -10},
        isBitter = true,
        isFriendshipItem = true
    },
    
    -- Friendship-boosting held items
    SOOTHE_BELL = {
        id = "SOOTHE_BELL",
        name = "Soothe Bell",
        description = "A held item that calms spirits and fosters friendship. Doubles friendship gained.",
        type = "friendship_multiplier",
        friendshipBoostMultiplier = 2.0,
        isFriendshipItem = true,
        isHeldItem = true
    }
}

-- Poké Ball database
local pokeballData = {
    POKEBALL = {
        id = "POKEBALL",
        name = "Poké Ball",
        description = "A device for catching wild Pokémon. It's thrown like a ball at a Pokémon, comfortably encapsulating its target.",
        category = ItemCategory.POKEBALL,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        catchRate = 1.0,
        cost = 200
    },
    GREAT_BALL = {
        id = "GREAT_BALL",
        name = "Great Ball",
        description = "A high-performance Ball that provides a higher Pokémon catch rate than a standard Poké Ball.",
        category = ItemCategory.POKEBALL,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        catchRate = 1.5,
        cost = 600
    },
    ULTRA_BALL = {
        id = "ULTRA_BALL",
        name = "Ultra Ball",
        description = "An ultra-high-performance Ball that provides a higher success rate for catching Pokémon than a Great Ball.",
        category = ItemCategory.POKEBALL,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        catchRate = 2.0,
        cost = 1200
    },
    ROGUE_BALL = {
        id = "ROGUE_BALL",
        name = "Rogue Ball",
        description = "A special Ball that works better on Pokémon from previous encounters.",
        category = ItemCategory.POKEBALL,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        catchRate = 3.0,
        cost = 2000
    },
    MASTER_BALL = {
        id = "MASTER_BALL",
        name = "Master Ball",
        description = "The best Ball with the ultimate level of performance. With it, you will catch any wild Pokémon without fail.",
        category = ItemCategory.POKEBALL,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.MASTER,
        stackable = true,
        maxStack = 99,
        consumable = true,
        catchRate = 255.0,
        isRare = true,
        cost = 0 -- Priceless
    },
    LUXURY_BALL = {
        id = "LUXURY_BALL",
        name = "Luxury Ball",
        description = "A comfortable Ball that makes a wild Pokémon quickly grow friendlier after being caught.",
        category = ItemCategory.POKEBALL,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        catchRate = 1.0,
        friendshipBonus = 1,
        cost = 3000
    }
}

-- Healing items database
local healingItemData = {
    POTION = {
        id = "POTION",
        name = "Potion",
        description = "A spray-type medicine for treating wounds. It restores the HP of one Pokémon by 20 points.",
        category = ItemCategory.HEALING,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        healAmount = 20,
        cost = 300
    },
    SUPER_POTION = {
        id = "SUPER_POTION",
        name = "Super Potion",
        description = "A spray-type medicine for treating wounds. It restores the HP of one Pokémon by 50 points.",
        category = ItemCategory.HEALING,
        context = ItemContext.BOTH,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        healAmount = 50,
        cost = 700
    },
    HYPER_POTION = {
        id = "HYPER_POTION",
        name = "Hyper Potion",
        description = "A spray-type medicine for treating wounds. It restores the HP of one Pokémon by 200 points.",
        category = ItemCategory.HEALING,
        context = ItemContext.BOTH,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        healAmount = 200,
        cost = 1200
    },
    MAX_POTION = {
        id = "MAX_POTION",
        name = "Max Potion",
        description = "A spray-type medicine for treating wounds. It fully restores the HP of a single Pokémon.",
        category = ItemCategory.HEALING,
        context = ItemContext.BOTH,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        healAmount = 0, -- 0 means full heal
        cost = 2500
    },
    FULL_RESTORE = {
        id = "FULL_RESTORE",
        name = "Full Restore",
        description = "A medicine that fully restores the HP and heals any status conditions of a single Pokémon.",
        category = ItemCategory.HEALING,
        context = ItemContext.BOTH,
        rarity = ItemRarity.ULTRA_RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        healAmount = 0, -- Full heal
        curesStatus = true,
        cost = 3000
    },
    REVIVE = {
        id = "REVIVE",
        name = "Revive",
        description = "A medicine that can revive fainted Pokémon. It also restores half of a fainted Pokémon's maximum HP.",
        category = ItemCategory.HEALING,
        context = ItemContext.BOTH,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        revive = true,
        revivePercent = 50,
        cost = 1500
    },
    MAX_REVIVE = {
        id = "MAX_REVIVE",
        name = "Max Revive",
        description = "A medicine that can revive fainted Pokémon. It also fully restores a fainted Pokémon's maximum HP.",
        category = ItemCategory.HEALING,
        context = ItemContext.BOTH,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        revive = true,
        revivePercent = 100,
        cost = 4000
    },
    FULL_HEAL = {
        id = "FULL_HEAL",
        name = "Full Heal",
        description = "A medicine that can be used to heal all the status conditions of a single Pokémon.",
        category = ItemCategory.HEALING,
        context = ItemContext.BOTH,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        curesStatus = true,
        cost = 600
    },
    SACRED_ASH = {
        id = "SACRED_ASH",
        name = "Sacred Ash",
        description = "A rare ash that can revive all fainted Pokémon in a trainer's party. It also fully restores their HP.",
        category = ItemCategory.HEALING,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.MASTER,
        stackable = true,
        maxStack = 99,
        consumable = true,
        revive = true,
        revivePercent = 100,
        affectsAllPokemon = true,
        isRare = true,
        cost = 50000
    }
}

-- PP restoration items database
local ppRestoreData = {
    ETHER = {
        id = "ETHER",
        name = "Ether",
        description = "A medicine that can restore the PP of a Pokémon's move. It restores the PP of one selected move by 10.",
        category = ItemCategory.PP_RESTORE,
        context = ItemContext.BOTH,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        ppRestore = 10,
        targetMove = true,
        cost = 1200
    },
    MAX_ETHER = {
        id = "MAX_ETHER",
        name = "Max Ether",
        description = "A medicine that can restore the PP of a Pokémon's move. It fully restores the PP of a single selected move.",
        category = ItemCategory.PP_RESTORE,
        context = ItemContext.BOTH,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        ppRestore = -1, -- -1 means full restore
        targetMove = true,
        cost = 2000
    },
    ELIXIR = {
        id = "ELIXIR",
        name = "Elixir",
        description = "A medicine that can restore the PP of Pokémon moves. It restores the PP of all moves of one Pokémon by 10.",
        category = ItemCategory.PP_RESTORE,
        context = ItemContext.BOTH,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        ppRestore = 10,
        allMoves = true,
        cost = 3000
    },
    MAX_ELIXIR = {
        id = "MAX_ELIXIR",
        name = "Max Elixir",
        description = "A medicine that can restore the PP of moves. It fully restores the PP of all moves that have been learned by one Pokémon.",
        category = ItemCategory.PP_RESTORE,
        context = ItemContext.BOTH,
        rarity = ItemRarity.ULTRA_RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        ppRestore = -1, -- Full restore
        allMoves = true,
        cost = 5000
    },
    PP_UP = {
        id = "PP_UP",
        name = "PP Up",
        description = "A medicine that can slightly raise the maximum PP of a single move that has been learned by the target Pokémon.",
        category = ItemCategory.PP_RESTORE,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        ppMaxIncrease = 1,
        targetMove = true,
        cost = 9800
    },
    PP_MAX = {
        id = "PP_MAX",
        name = "PP Max",
        description = "A medicine that optimally raises the maximum PP of a single move that has been learned by the target Pokémon.",
        category = ItemCategory.PP_RESTORE,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.ULTRA_RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        ppMaxIncrease = 3,
        targetMove = true,
        cost = 9800
    }
}

-- Berry database
local berryData = {
    SITRUS_BERRY = {
        id = "SITRUS_BERRY",
        name = "Sitrus Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it restores its HP by 1/4 of its maximum HP when its HP drops below 1/2.",
        category = ItemCategory.BERRY,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        healPercent = 25,
        activateThreshold = 50,
        cost = 20
    },
    LUM_BERRY = {
        id = "LUM_BERRY",
        name = "Lum Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it recovers from any status condition during battle.",
        category = ItemCategory.BERRY,
        context = ItemContext.BOTH,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        curesStatus = true,
        cost = 20
    },
    LEPPA_BERRY = {
        id = "LEPPA_BERRY",
        name = "Leppa Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it restores a move's PP by 10 when the PP reaches 0.",
        category = ItemCategory.BERRY,
        context = ItemContext.BOTH,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        ppRestore = 10,
        cost = 20
    },
    LIECHI_BERRY = {
        id = "LIECHI_BERRY",
        name = "Liechi Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, its Attack stat will increase when its HP drops below 1/4 of its maximum.",
        category = ItemCategory.BERRY,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        statBoost = "attack",
        statBoostAmount = 1,
        activateThreshold = 25,
        cost = 20
    },
    GANLON_BERRY = {
        id = "GANLON_BERRY",
        name = "Ganlon Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, its Defense will increase when its HP drops below 1/4 of its maximum.",
        category = ItemCategory.BERRY,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        statBoost = "defense",
        statBoostAmount = 1,
        activateThreshold = 25,
        cost = 20
    },
    PETAYA_BERRY = {
        id = "PETAYA_BERRY",
        name = "Petaya Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, its Sp. Atk will sharply increase when its HP drops below 1/4.",
        category = ItemCategory.BERRY,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        statBoost = "special_attack",
        statBoostAmount = 1,
        activateThreshold = 25,
        cost = 20
    },
    APICOT_BERRY = {
        id = "APICOT_BERRY",
        name = "Apicot Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, its Sp. Def will sharply increase when its HP drops below 1/4.",
        category = ItemCategory.BERRY,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        statBoost = "special_defense",
        statBoostAmount = 1,
        activateThreshold = 25,
        cost = 20
    },
    SALAC_BERRY = {
        id = "SALAC_BERRY",
        name = "Salac Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, its Speed will sharply increase when its HP drops below 1/4.",
        category = ItemCategory.BERRY,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        statBoost = "speed",
        statBoostAmount = 1,
        activateThreshold = 25,
        cost = 20
    },
    LANSAT_BERRY = {
        id = "LANSAT_BERRY",
        name = "Lansat Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, its critical hit ratio will increase when its HP drops below 1/4.",
        category = ItemCategory.BERRY,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.ULTRA_RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        critBoost = true,
        activateThreshold = 25,
        cost = 20
    },
    STARF_BERRY = {
        id = "STARF_BERRY",
        name = "Starf Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, one of its stats will sharply increase when its HP drops below 1/4.",
        category = ItemCategory.BERRY,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.ULTRA_RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        randomStatBoost = true,
        statBoostAmount = 2,
        activateThreshold = 25,
        cost = 20
    },
    ENIGMA_BERRY = {
        id = "ENIGMA_BERRY",
        name = "Enigma Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it restores its HP if it is hit by a supereffective attack.",
        category = ItemCategory.BERRY,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        healPercent = 25,
        activateOnSuperEffective = true,
        cost = 20
    }
}

-- Key items database
local keyItemData = {
    MEGA_BRACELET = {
        id = "MEGA_BRACELET",
        name = "Mega Bracelet",
        description = "A bracelet that enables the user to Mega Evolve Pokémon in battle. It resonates with Mega Stones.",
        category = ItemCategory.KEY_ITEM,
        context = ItemContext.KEY_ONLY,
        rarity = ItemRarity.MASTER,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isRare = true,
        enablesMegaEvolution = true,
        cost = 0
    },
    DYNAMAX_BAND = {
        id = "DYNAMAX_BAND",
        name = "Dynamax Band",
        description = "A band that enables the user to Dynamax Pokémon in battle. It contains Galar particles.",
        category = ItemCategory.KEY_ITEM,
        context = ItemContext.KEY_ONLY,
        rarity = ItemRarity.MASTER,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isRare = true,
        enablesDynamax = true,
        cost = 0
    },
    TERA_ORB = {
        id = "TERA_ORB",
        name = "Tera Orb",
        description = "A crystalline orb that allows Pokémon to Terastallize, changing their type in battle.",
        category = ItemCategory.KEY_ITEM,
        context = ItemContext.KEY_ONLY,
        rarity = ItemRarity.MASTER,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isRare = true,
        enablesTerastallize = true,
        cost = 0
    },
    EXP_SHARE = {
        id = "EXP_SHARE",
        name = "Exp. Share",
        description = "A device that allows all Pokémon in your party to gain Exp. Points from battles, even if they didn't participate.",
        category = ItemCategory.KEY_ITEM,
        context = ItemContext.KEY_ONLY,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        expShareBonus = true,
        cost = 0
    },
    AMULET_COIN = {
        id = "AMULET_COIN",
        name = "Amulet Coin",
        description = "An item to be held by a Pokémon. It doubles the prize money received after battle.",
        category = ItemCategory.KEY_ITEM,
        context = ItemContext.KEY_ONLY,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        moneyMultiplier = 2.0,
        cost = 0
    }
}

-- Money items database  
local moneyItemData = {
    NUGGET = {
        id = "NUGGET",
        name = "Nugget",
        description = "A nugget of the purest gold that gives off a lustrous gleam in direct light. It can be sold at a high price.",
        category = ItemCategory.MONEY,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        sellValue = 10000,
        cost = 0
    },
    BIG_NUGGET = {
        id = "BIG_NUGGET",
        name = "Big Nugget",
        description = "A big nugget made of gold that gives off a lustrous gleam when exposed to light. It can be sold at a high price.",
        category = ItemCategory.MONEY,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        sellValue = 40000,
        cost = 0
    },
    RELIC_GOLD = {
        id = "RELIC_GOLD",
        name = "Relic Gold",
        description = "A gold relic from ancient times. A maniac will buy it for a high price.",
        category = ItemCategory.MONEY,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.ULTRA_RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        sellValue = 200000,
        cost = 0
    }
}

-- Held items database (battling/stat modification items)
local heldItemData = {
    CHOICE_BAND = {
        id = "CHOICE_BAND",
        name = "Choice Band",
        description = "An item to be held by a Pokémon. This headband ups Attack, but allows the use of only one move.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        attackMultiplier = 1.5,
        restrictsMoves = true,
        cost = 4000
    },
    CHOICE_SPECS = {
        id = "CHOICE_SPECS",
        name = "Choice Specs",
        description = "An item to be held by a Pokémon. These distinctive glasses boost Sp. Atk, but allow only one move to be used.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        spAttackMultiplier = 1.5,
        restrictsMoves = true,
        cost = 4000
    },
    CHOICE_SCARF = {
        id = "CHOICE_SCARF",
        name = "Choice Scarf",
        description = "An item to be held by a Pokémon. This scarf boosts Speed, but allows the use of only one move.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        speedMultiplier = 1.5,
        restrictsMoves = true,
        cost = 4000
    },
    LEFTOVERS = {
        id = "LEFTOVERS",
        name = "Leftovers",
        description = "An item to be held by a Pokémon. The holder's HP is slowly but steadily restored throughout battle.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        healPercentPerTurn = 6.25,
        cost = 4000
    },
    LIFE_ORB = {
        id = "LIFE_ORB",
        name = "Life Orb",
        description = "An item to be held by a Pokémon. It boosts the power of moves, but at the cost of some HP on each use.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.ULTRA_RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        damageMultiplier = 1.3,
        hpCostPercent = 10,
        cost = 6000
    },
    FOCUS_SASH = {
        id = "FOCUS_SASH",
        name = "Focus Sash",
        description = "An item to be held by a Pokémon. If it has full HP, the holder will endure one potential KO attack, leaving 1 HP.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = true,
        isHeldItem = true,
        survivesKO = true,
        cost = 3000
    },
    ASSAULT_VEST = {
        id = "ASSAULT_VEST",
        name = "Assault Vest",
        description = "An item to be held by a Pokémon. This offensive vest raises Sp. Def but prevents the use of status moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        spDefenseMultiplier = 1.5,
        preventsStatusMoves = true,
        cost = 4000
    },
    ROCKY_HELMET = {
        id = "ROCKY_HELMET",
        name = "Rocky Helmet",
        description = "An item to be held by a Pokémon. If the holder is hit by a contact move, the attacker takes 1/6 of their max HP in damage.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        contactDamagePercent = 16.67,
        cost = 2000
    },
    WEAKNESS_POLICY = {
        id = "WEAKNESS_POLICY",
        name = "Weakness Policy",
        description = "An item to be held by a Pokémon. Attack and Sp. Atk sharply increase if the holder is hit by a supereffective move.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = true,
        isHeldItem = true,
        triggersOnSuperEffective = true,
        statBoostAmount = 2,
        cost = 3000
    },
    EVIOLITE = {
        id = "EVIOLITE",
        name = "Eviolite",
        description = "A mysterious evolutionary lump. When held, it raises the Defense and Sp. Def of a Pokémon that can still evolve.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        defenseMultiplier = 1.5,
        spDefenseMultiplier = 1.5,
        requiresCanEvolve = true,
        cost = 4000
    },
    EXPERT_BELT = {
        id = "EXPERT_BELT",
        name = "Expert Belt",
        description = "An item to be held by a Pokémon. It's a well-worn belt that slightly boosts the power of supereffective moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        superEffectiveMultiplier = 1.2,
        cost = 2000
    },
    MUSCLE_BAND = {
        id = "MUSCLE_BAND",
        name = "Muscle Band",
        description = "An item to be held by a Pokémon. This headband exudes strength and slightly boosts physical moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        physicalMoveMultiplier = 1.1,
        cost = 2000
    },
    WISE_GLASSES = {
        id = "WISE_GLASSES",
        name = "Wise Glasses",
        description = "An item to be held by a Pokémon. This thick pair of glasses slightly boosts the power of special moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        specialMoveMultiplier = 1.1,
        cost = 2000
    },
    WIDE_LENS = {
        id = "WIDE_LENS",
        name = "Wide Lens",
        description = "An item to be held by a Pokémon. It's a magnifying lens that slightly boosts the accuracy of moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        accuracyMultiplier = 1.1,
        cost = 2000
    },
    ZOOM_LENS = {
        id = "ZOOM_LENS",
        name = "Zoom Lens",
        description = "An item to be held by a Pokémon. If the holder moves after its target, its accuracy will be boosted.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        movesLastAccuracyBoost = 1.2,
        cost = 2000
    },
    SCOPE_LENS = {
        id = "SCOPE_LENS",
        name = "Scope Lens",
        description = "An item to be held by a Pokémon. It's a lens for scoping out weak points. It boosts the holder's critical-hit ratio.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        criticalHitBoost = 1,
        cost = 2000
    },
    METRONOME = {
        id = "METRONOME",
        name = "Metronome",
        description = "An item to be held by a Pokémon. It boosts moves used consecutively, but only until a different move is used.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        consecutiveMoveBoost = true,
        maxBoostMultiplier = 2.0,
        cost = 3000
    },
    RAZOR_CLAW_HELD = {
        id = "RAZOR_CLAW_HELD",
        name = "Razor Claw",
        description = "An item to be held by a Pokémon. This sharply hooked claw increases the holder's critical-hit ratio.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        criticalHitBoost = 1,
        cost = 2000
    },
    QUICK_CLAW = {
        id = "QUICK_CLAW",
        name = "Quick Claw",
        description = "An item to be held by a Pokémon. A light and sharp claw. The holder may be able to attack first.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        priorityChance = 20, -- 20% chance
        cost = 2000
    }
}

-- Battle items database (usable during battle)
local battleItemData = {
    X_ATTACK = {
        id = "X_ATTACK",
        name = "X Attack",
        description = "An item that sharply boosts the Attack stat of a Pokémon during battle. It wears off if the Pokémon is withdrawn.",
        category = ItemCategory.BATTLE_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        statBoost = "attack",
        statBoostAmount = 2,
        cost = 500
    },
    X_DEFENSE = {
        id = "X_DEFENSE",
        name = "X Defense",
        description = "An item that sharply boosts the Defense stat of a Pokémon during battle. It wears off if the Pokémon is withdrawn.",
        category = ItemCategory.BATTLE_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        statBoost = "defense",
        statBoostAmount = 2,
        cost = 500
    },
    X_SPECIAL_ATTACK = {
        id = "X_SPECIAL_ATTACK",
        name = "X Sp. Atk",
        description = "An item that sharply boosts the Sp. Atk stat of a Pokémon during battle. It wears off if the Pokémon is withdrawn.",
        category = ItemCategory.BATTLE_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        statBoost = "special_attack",
        statBoostAmount = 2,
        cost = 500
    },
    X_SPECIAL_DEFENSE = {
        id = "X_SPECIAL_DEFENSE",
        name = "X Sp. Def",
        description = "An item that sharply boosts the Sp. Def stat of a Pokémon during battle. It wears off if the Pokémon is withdrawn.",
        category = ItemCategory.BATTLE_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        statBoost = "special_defense",
        statBoostAmount = 2,
        cost = 500
    },
    X_SPEED = {
        id = "X_SPEED",
        name = "X Speed",
        description = "An item that sharply boosts the Speed stat of a Pokémon during battle. It wears off if the Pokémon is withdrawn.",
        category = ItemCategory.BATTLE_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        statBoost = "speed",
        statBoostAmount = 2,
        cost = 500
    },
    X_ACCURACY = {
        id = "X_ACCURACY",
        name = "X Accuracy",
        description = "An item that sharply boosts the accuracy of a Pokémon during battle. It wears off if the Pokémon is withdrawn.",
        category = ItemCategory.BATTLE_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        statBoost = "accuracy",
        statBoostAmount = 2,
        cost = 500
    },
    DIRE_HIT = {
        id = "DIRE_HIT",
        name = "Dire Hit",
        description = "An item that greatly increases the critical-hit ratio during battle. It wears off if the Pokémon is withdrawn.",
        category = ItemCategory.BATTLE_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        criticalHitBoost = 2,
        cost = 650
    },
    GUARD_SPEC = {
        id = "GUARD_SPEC",
        name = "Guard Spec.",
        description = "An item that prevents stat reduction among the Trainer's party Pokémon for five turns after it is used in battle.",
        category = ItemCategory.BATTLE_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        preventsStatReduction = true,
        duration = 5,
        cost = 700
    }
}

-- Stat booster items database (permanent stat increases)
local statBoosterData = {
    RARE_CANDY = {
        id = "RARE_CANDY",
        name = "Rare Candy",
        description = "A candy that is packed with energy. When consumed, it will instantly raise the level of a single Pokémon by one.",
        category = ItemCategory.STAT_BOOSTER,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        levelIncrease = 1,
        cost = 10000
    },
    PP_UP = {
        id = "PP_UP",
        name = "PP Up",
        description = "A medicine that slightly increases the maximum PP of a single move that has been learned by the target Pokémon.",
        category = ItemCategory.STAT_BOOSTER,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        ppMaxIncrease = 1,
        targetMove = true,
        cost = 9800
    },
    PP_MAX = {
        id = "PP_MAX",
        name = "PP Max",
        description = "A medicine that optimally raises the maximum PP of a single move that has been learned by the target Pokémon.",
        category = ItemCategory.STAT_BOOSTER,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.ULTRA_RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        ppMaxIncrease = 3,
        targetMove = true,
        cost = 9800
    }
}

-- Form change items database
local formChangeData = {
    REVEAL_GLASS = {
        id = "REVEAL_GLASS",
        name = "Reveal Glass",
        description = "A looking glass that reveals the true forms of the forces of nature.",
        category = ItemCategory.FORM_CHANGE,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.MASTER,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isRare = true,
        compatible_species = {641, 642, 645}, -- Tornadus, Thundurus, Landorus
        cost = 0
    },
    DNA_SPLICERS = {
        id = "DNA_SPLICERS",
        name = "DNA Splicers",
        description = "A splicer that fuses Kyurem and a certain Pokémon. They are said to have been used to separate Kyurem long ago.",
        category = ItemCategory.FORM_CHANGE,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.MASTER,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isRare = true,
        compatible_species = {646}, -- Kyurem
        cost = 0
    },
    PRISON_BOTTLE = {
        id = "PRISON_BOTTLE",
        name = "Prison Bottle",
        description = "A bottle believed to have been used to seal away the power of a certain Pokémon long ago.",
        category = ItemCategory.FORM_CHANGE,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.MASTER,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isRare = true,
        compatible_species = {720}, -- Hoopa
        cost = 0
    },
    N_LUNARIZER = {
        id = "N_LUNARIZER",
        name = "N-Lunarizer",
        description = "A machine to fuse Necrozma, which needs light, with Lunala.",
        category = ItemCategory.FORM_CHANGE,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.MASTER,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isRare = true,
        compatible_species = {800}, -- Necrozma
        cost = 0
    },
    N_SOLARIZER = {
        id = "N_SOLARIZER",
        name = "N-Solarizer",
        description = "A machine to fuse Necrozma, which needs light, with Solgaleo.",
        category = ItemCategory.FORM_CHANGE,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.MASTER,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isRare = true,
        compatible_species = {800}, -- Necrozma
        cost = 0
    }
}

-- More berries database
local additionalBerryData = {
    CHERI_BERRY = {
        id = "CHERI_BERRY",
        name = "Cheri Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it recovers from paralysis.",
        category = ItemCategory.BERRY,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        curesStatus = {"paralysis"},
        cost = 20
    },
    CHESTO_BERRY = {
        id = "CHESTO_BERRY",
        name = "Chesto Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it recovers from sleep.",
        category = ItemCategory.BERRY,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        curesStatus = {"sleep"},
        cost = 20
    },
    PECHA_BERRY = {
        id = "PECHA_BERRY",
        name = "Pecha Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it recovers from poison.",
        category = ItemCategory.BERRY,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        curesStatus = {"poison", "badly_poisoned"},
        cost = 20
    },
    RAWST_BERRY = {
        id = "RAWST_BERRY",
        name = "Rawst Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it recovers from a burn.",
        category = ItemCategory.BERRY,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        curesStatus = {"burn"},
        cost = 20
    },
    ASPEAR_BERRY = {
        id = "ASPEAR_BERRY",
        name = "Aspear Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it recovers from being frozen.",
        category = ItemCategory.BERRY,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        curesStatus = {"freeze"},
        cost = 20
    },
    ORAN_BERRY = {
        id = "ORAN_BERRY",
        name = "Oran Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it restores 10 HP when HP is low.",
        category = ItemCategory.BERRY,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        healAmount = 10,
        activateThreshold = 50,
        cost = 20
    },
    PERSIM_BERRY = {
        id = "PERSIM_BERRY",
        name = "Persim Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it recovers from confusion.",
        category = ItemCategory.BERRY,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        isHeldItem = true,
        curesStatus = {"confusion"},
        cost = 20
    }
}

-- Miscellaneous items database
local miscItemData = {
    REPEL = {
        id = "REPEL",
        name = "Repel",
        description = "An item that prevents weak wild Pokémon from appearing for 100 steps after its use.",
        category = ItemCategory.MISC,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        repelSteps = 100,
        cost = 350
    },
    SUPER_REPEL = {
        id = "SUPER_REPEL",
        name = "Super Repel",
        description = "An item that prevents weak wild Pokémon from appearing for 200 steps after its use.",
        category = ItemCategory.MISC,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        repelSteps = 200,
        cost = 500
    },
    MAX_REPEL = {
        id = "MAX_REPEL",
        name = "Max Repel",
        description = "An item that prevents weak wild Pokémon from appearing for 250 steps after its use.",
        category = ItemCategory.MISC,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.RARE,
        stackable = true,
        maxStack = 99,
        consumable = true,
        repelSteps = 250,
        cost = 700
    },
    ESCAPE_ROPE = {
        id = "ESCAPE_ROPE",
        name = "Escape Rope",
        description = "A long and durable rope. Use it to escape from a cave or dungeon instantly.",
        category = ItemCategory.MISC,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        escapeItem = true,
        cost = 550
    },
    HONEY = {
        id = "HONEY",
        name = "Honey",
        description = "A sweet honey collected by Pokémon. It attracts wild Pokémon when used.",
        category = ItemCategory.MISC,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        attractsPokemon = true,
        cost = 300
    },
    POKE_DOLL = {
        id = "POKE_DOLL",
        name = "Poké Doll",
        description = "A doll that attracts Pokémon. Use it to escape from any battle with a wild Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        guaranteedEscape = true,
        cost = 1000
    },
    FLUFFY_TAIL = {
        id = "FLUFFY_TAIL",
        name = "Fluffy Tail",
        description = "A toy made from fluffy Skitty tail fur that attracts Pokémon. Use it to escape from any battle with a wild Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        guaranteedEscape = true,
        cost = 1000
    },
    ANTIDOTE = {
        id = "ANTIDOTE",
        name = "Antidote",
        description = "A spray-type medicine for treating wounds. It heals the poisoning of a single Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        curesStatus = {"poison", "badly_poisoned"},
        cost = 100
    },
    PARALYZE_HEAL = {
        id = "PARALYZE_HEAL",
        name = "Paralyze Heal",
        description = "A spray-type medicine for treating wounds. It heals the paralysis of a single Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        curesStatus = {"paralysis"},
        cost = 200
    },
    AWAKENING = {
        id = "AWAKENING",
        name = "Awakening",
        description = "A spray-type medicine for treating wounds. It awakens a sleeping Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        curesStatus = {"sleep"},
        cost = 250
    },
    BURN_HEAL = {
        id = "BURN_HEAL",
        name = "Burn Heal",
        description = "A spray-type medicine for treating wounds. It heals a single Pokémon's burn.",
        category = ItemCategory.MISC,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        curesStatus = {"burn"},
        cost = 250
    },
    ICE_HEAL = {
        id = "ICE_HEAL",
        name = "Ice Heal",
        description = "A spray-type medicine for treating wounds. It defrosts a frozen Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        curesStatus = {"freeze"},
        cost = 250
    },
    FRESH_WATER = {
        id = "FRESH_WATER",
        name = "Fresh Water",
        description = "Water with a high mineral content. It restores the HP of one Pokémon by 50 points.",
        category = ItemCategory.MISC,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        healAmount = 50,
        cost = 200
    },
    SODA_POP = {
        id = "SODA_POP",
        name = "Soda Pop",
        description = "A fizzy soda drink. It restores the HP of one Pokémon by 60 points.",
        category = ItemCategory.MISC,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        healAmount = 60,
        cost = 300
    },
    LEMONADE = {
        id = "LEMONADE",
        name = "Lemonade",
        description = "A very sweet drink. It restores the HP of one Pokémon by 80 points.",
        category = ItemCategory.MISC,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        healAmount = 80,
        cost = 350
    },
    MOOMOO_MILK = {
        id = "MOOMOO_MILK",
        name = "Moomoo Milk",
        description = "A bottle of highly nutritious milk. It restores the HP of one Pokémon by 100 points.",
        category = ItemCategory.MISC,
        context = ItemContext.BOTH,
        rarity = ItemRarity.UNCOMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        healAmount = 100,
        cost = 500
    },
    ENERGY_POWDER = {
        id = "ENERGY_POWDER",
        name = "Energy Powder",
        description = "A very bitter medicinal powder. It restores the HP of one Pokémon by 50 points.",
        category = ItemCategory.MISC,
        context = ItemContext.BOTH,
        rarity = ItemRarity.COMMON,
        stackable = true,
        maxStack = 99,
        consumable = true,
        healAmount = 50,
        isBitter = true,
        friendshipLoss = {[0] = -5, [100] = -5, [200] = -10},
        cost = 50
    }
}

-- Type enhancement items database
local typeEnhancementData = {
    FLAME_PLATE = {
        id = "FLAME_PLATE",
        name = "Flame Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Fire-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Fire",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    SPLASH_PLATE = {
        id = "SPLASH_PLATE",
        name = "Splash Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Water-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Water",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    ZAP_PLATE = {
        id = "ZAP_PLATE",
        name = "Zap Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Electric-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Electric",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    MEADOW_PLATE = {
        id = "MEADOW_PLATE",
        name = "Meadow Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Grass-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Grass",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    ICICLE_PLATE = {
        id = "ICICLE_PLATE",
        name = "Icicle Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Ice-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Ice",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    FIST_PLATE = {
        id = "FIST_PLATE",
        name = "Fist Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Fighting-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Fighting",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    TOXIC_PLATE = {
        id = "TOXIC_PLATE",
        name = "Toxic Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Poison-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Poison",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    EARTH_PLATE = {
        id = "EARTH_PLATE",
        name = "Earth Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Ground-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Ground",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    SKY_PLATE = {
        id = "SKY_PLATE",
        name = "Sky Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Flying-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Flying",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    MIND_PLATE = {
        id = "MIND_PLATE",
        name = "Mind Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Psychic-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Psychic",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    INSECT_PLATE = {
        id = "INSECT_PLATE",
        name = "Insect Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Bug-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Bug",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    STONE_PLATE = {
        id = "STONE_PLATE",
        name = "Stone Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Rock-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Rock",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    SPOOKY_PLATE = {
        id = "SPOOKY_PLATE",
        name = "Spooky Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Ghost-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Ghost",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    DRACO_PLATE = {
        id = "DRACO_PLATE",
        name = "Draco Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Dragon-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Dragon",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    DREAD_PLATE = {
        id = "DREAD_PLATE",
        name = "Dread Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Dark-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Dark",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    IRON_PLATE = {
        id = "IRON_PLATE",
        name = "Iron Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Steel-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Steel",
        typeBoostMultiplier = 1.2,
        cost = 1000
    },
    PIXIE_PLATE = {
        id = "PIXIE_PLATE",
        name = "Pixie Plate",
        description = "An item to be held by a Pokémon. It's a stone tablet that boosts the power of Fairy-type moves.",
        category = ItemCategory.HELD_ITEM,
        context = ItemContext.BATTLE,
        rarity = ItemRarity.RARE,
        stackable = false,
        maxStack = 1,
        consumable = false,
        isHeldItem = true,
        typeBoost = "Fairy",
        typeBoostMultiplier = 1.2,
        cost = 1000
    }
}

-- TM/TR data (Technical Machines)
local tmData = {
    TM001 = {
        id = "TM001",
        name = "TM01",
        description = "A Technical Machine that teaches the move Focus Punch to a compatible Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = true,
        teachesMove = "Focus Punch",
        moveId = 264,
        cost = 3000
    },
    TM002 = {
        id = "TM002",
        name = "TM02",
        description = "A Technical Machine that teaches the move Dragon Claw to a compatible Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = true,
        teachesMove = "Dragon Claw",
        moveId = 337,
        cost = 3000
    },
    TM003 = {
        id = "TM003",
        name = "TM03",
        description = "A Technical Machine that teaches the move Water Pulse to a compatible Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = true,
        teachesMove = "Water Pulse",
        moveId = 352,
        cost = 3000
    },
    TM004 = {
        id = "TM004",
        name = "TM04",
        description = "A Technical Machine that teaches the move Calm Mind to a compatible Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = true,
        teachesMove = "Calm Mind",
        moveId = 347,
        cost = 3000
    },
    TM005 = {
        id = "TM005",
        name = "TM05",
        description = "A Technical Machine that teaches the move Roar to a compatible Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = true,
        teachesMove = "Roar",
        moveId = 46,
        cost = 3000
    },
    TM006 = {
        id = "TM006",
        name = "TM06",
        description = "A Technical Machine that teaches the move Toxic to a compatible Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = true,
        teachesMove = "Toxic",
        moveId = 92,
        cost = 3000
    },
    TM007 = {
        id = "TM007",
        name = "TM07",
        description = "A Technical Machine that teaches the move Hail to a compatible Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = true,
        teachesMove = "Hail",
        moveId = 258,
        cost = 3000
    },
    TM008 = {
        id = "TM008",
        name = "TM08",
        description = "A Technical Machine that teaches the move Bulk Up to a compatible Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = true,
        teachesMove = "Bulk Up",
        moveId = 339,
        cost = 3000
    },
    TM009 = {
        id = "TM009",
        name = "TM09",
        description = "A Technical Machine that teaches the move Bullet Seed to a compatible Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = true,
        teachesMove = "Bullet Seed",
        moveId = 331,
        cost = 3000
    },
    TM010 = {
        id = "TM010",
        name = "TM10",
        description = "A Technical Machine that teaches the move Hidden Power to a compatible Pokémon.",
        category = ItemCategory.MISC,
        context = ItemContext.OVERWORLD,
        rarity = ItemRarity.UNCOMMON,
        stackable = false,
        maxStack = 1,
        consumable = true,
        teachesMove = "Hidden Power",
        moveId = 237,
        cost = 3000
    }
}

-- Database state
local databaseInitialized = false

-- Initialize item database
function ItemDatabase.init()
    if databaseInitialized then
        return
    end
    
    databaseInitialized = true
end

-- Get evolution item data by ID
-- @param itemId: Evolution item ID
-- @return: Item data or nil if not found
function ItemDatabase.getEvolutionItem(itemId)
    ItemDatabase.init()
    return evolutionItemData[itemId]
end

-- Check if species can use evolution item
-- @param speciesId: Pokemon species ID
-- @param itemId: Evolution item ID
-- @return: Boolean indicating if species can use item
function ItemDatabase.canSpeciesUseEvolutionItem(speciesId, itemId)
    local itemData = ItemDatabase.getEvolutionItem(itemId)
    if not itemData or not itemData.compatible_species then
        return false
    end
    
    for _, compatibleSpecies in ipairs(itemData.compatible_species) do
        if compatibleSpecies == speciesId then
            return true
        end
    end
    
    return false
end

-- Get evolution items compatible with species
-- @param speciesId: Pokemon species ID
-- @return: Array of compatible evolution item IDs
function ItemDatabase.getCompatibleEvolutionItems(speciesId)
    ItemDatabase.init()
    local compatibleItems = {}
    
    for itemId, itemData in pairs(evolutionItemData) do
        if ItemDatabase.canSpeciesUseEvolutionItem(speciesId, itemId) then
            table.insert(compatibleItems, itemId)
        end
    end
    
    return compatibleItems
end

-- Check if item is an evolution stone
-- @param itemId: Evolution item ID  
-- @return: Boolean indicating if item is evolution stone
function ItemDatabase.isEvolutionStone(itemId)
    local itemData = ItemDatabase.getEvolutionItem(itemId)
    return itemData and itemData.type == "evolution_stone"
end

-- Check if item requires trade to use
-- @param itemId: Evolution item ID
-- @return: Boolean indicating if item requires trade
function ItemDatabase.requiresTrade(itemId)
    local itemData = ItemDatabase.getEvolutionItem(itemId)
    return itemData and (itemData.type == "held_item_trade" or itemData.type == "trade_substitute")
end

-- Get all evolution stones
-- @return: Array of evolution stone IDs
function ItemDatabase.getAllEvolutionStones()
    local stones = {}
    for itemId, itemData in pairs(evolutionItemData) do
        if itemData.type == "evolution_stone" then
            table.insert(stones, itemId)
        end
    end
    return stones
end

-- Get all trade items
-- @return: Array of trade evolution item IDs
function ItemDatabase.getAllTradeItems()
    local tradeItems = {}
    for itemId, itemData in pairs(evolutionItemData) do
        if ItemDatabase.requiresTrade(itemId) then
            table.insert(tradeItems, itemId)
        end
    end
    return tradeItems
end

-- Validate item database integrity
-- @return: Boolean and error message if invalid
function ItemDatabase.validateDatabase()
    local errors = {}
    
    -- Check that all evolution items have required fields
    for itemId, itemData in pairs(evolutionItemData) do
        if not itemData.name then
            table.insert(errors, "Item " .. itemId .. " missing name")
        end
        if not itemData.type then
            table.insert(errors, "Item " .. itemId .. " missing type")
        end
        if not itemData.compatible_species or #itemData.compatible_species == 0 then
            table.insert(errors, "Item " .. itemId .. " has no compatible species")
        end
    end
    
    if #errors > 0 then
        return false, table.concat(errors, ", ")
    end
    
    return true
end

-- Friendship item functions

-- Get friendship item data by ID  
-- @param itemId: Friendship item ID
-- @return: Item data or nil if not found
function ItemDatabase.getFriendshipItem(itemId)
    ItemDatabase.init()
    return friendshipItemData[itemId]
end

-- Check if item affects friendship
-- @param itemId: Item ID to check
-- @return: Boolean indicating if item affects friendship
function ItemDatabase.isFriendshipItem(itemId)
    local itemData = ItemDatabase.getFriendshipItem(itemId)
    return itemData and itemData.isFriendshipItem
end

-- Check if item is consumable
-- @param itemId: Item ID to check
-- @return: Boolean indicating if item is consumable
function ItemDatabase.isConsumable(itemId)
    local itemData = ItemDatabase.getItem(itemId)
    return itemData and itemData.consumable
end

-- Check if item is stackable
-- @param itemId: Item ID to check
-- @return: Boolean indicating if item is stackable
function ItemDatabase.isStackable(itemId)
    local itemData = ItemDatabase.getItem(itemId)
    return itemData and itemData.stackable
end

-- Get maximum stack size for item
-- @param itemId: Item ID to check
-- @return: Maximum stack size or 1 if not stackable
function ItemDatabase.getMaxStack(itemId)
    local itemData = ItemDatabase.getItem(itemId)
    if itemData and itemData.stackable then
        return itemData.maxStack or 99
    end
    return 1
end

-- Check if item can be used in specific context
-- @param itemId: Item ID to check
-- @param context: Usage context ("overworld", "battle", "both", "key_only")
-- @return: Boolean indicating if item can be used in context
function ItemDatabase.canUseInContext(itemId, context)
    local itemData = ItemDatabase.getItem(itemId)
    if not itemData then
        return false
    end
    
    local itemContext = itemData.context
    return itemContext == ItemContext.BOTH or itemContext == context
end

-- Check if item is rare
-- @param itemId: Item ID to check
-- @return: Boolean indicating if item is rare
function ItemDatabase.isRareItem(itemId)
    local itemData = ItemDatabase.getItem(itemId)
    return itemData and (itemData.isRare or itemData.rarity == ItemRarity.MASTER or itemData.rarity == ItemRarity.ULTRA_RARE)
end

-- Get item category
-- @param itemId: Item ID to check
-- @return: Item category string or nil if not found
function ItemDatabase.getItemCategory(itemId)
    local itemData = ItemDatabase.getItem(itemId)
    return itemData and itemData.category
end

-- Get item rarity
-- @param itemId: Item ID to check
-- @return: Item rarity string or nil if not found
function ItemDatabase.getItemRarity(itemId)
    local itemData = ItemDatabase.getItem(itemId)
    return itemData and itemData.rarity
end

-- Check if item is friendship-boosting (multiplier)
-- @param itemId: Item ID to check 
-- @return: Boolean indicating if item boosts friendship gain
function ItemDatabase.isFriendshipBoostingItem(itemId)
    local itemData = ItemDatabase.getFriendshipItem(itemId)
    return itemData and itemData.friendshipBoostMultiplier and itemData.friendshipBoostMultiplier > 1.0
end

-- Get friendship multiplier for item
-- @param itemId: Item ID to check
-- @return: Friendship multiplier (1.0 = no boost)
function ItemDatabase.getFriendshipMultiplier(itemId)
    local itemData = ItemDatabase.getFriendshipItem(itemId)
    if itemData and itemData.friendshipBoostMultiplier then
        return itemData.friendshipBoostMultiplier
    end
    return 1.0
end

-- Check if item is bitter (causes friendship loss)
-- @param itemId: Item ID to check
-- @return: Boolean indicating if item is bitter
function ItemDatabase.isBitterItem(itemId)
    local itemData = ItemDatabase.getFriendshipItem(itemId)
    return itemData and itemData.isBitter
end

-- Get friendship gain from using item
-- @param itemId: Item ID used
-- @param currentFriendship: Current Pokemon friendship level
-- @return: Friendship gain amount based on current level
function ItemDatabase.getFriendshipGain(itemId, currentFriendship)
    local itemData = ItemDatabase.getFriendshipItem(itemId)
    if not itemData or not itemData.friendshipGain then
        return 0
    end
    
    local friendshipGain = itemData.friendshipGain
    
    -- Find appropriate gain rate based on current friendship
    if currentFriendship < 100 then
        return friendshipGain[0] or 0
    elseif currentFriendship < 200 then
        return friendshipGain[100] or 0
    else
        return friendshipGain[200] or 0
    end
end

-- Get friendship loss from using bitter item
-- @param itemId: Item ID used
-- @param currentFriendship: Current Pokemon friendship level
-- @return: Friendship loss amount (negative value)
function ItemDatabase.getFriendshipLoss(itemId, currentFriendship)
    local itemData = ItemDatabase.getFriendshipItem(itemId)
    if not itemData or not itemData.friendshipLoss then
        return 0
    end
    
    local friendshipLoss = itemData.friendshipLoss
    
    -- Find appropriate loss rate based on current friendship
    if currentFriendship < 100 then
        return friendshipLoss[0] or 0
    elseif currentFriendship < 200 then
        return friendshipLoss[100] or 0
    else
        return friendshipLoss[200] or 0
    end
end

-- Get all friendship berries
-- @return: Array of friendship berry IDs
function ItemDatabase.getAllFriendshipBerries()
    local berries = {}
    for itemId, itemData in pairs(friendshipItemData) do
        if itemData.type == "friendship_berry" then
            table.insert(berries, itemId)
        end
    end
    return berries
end

-- Get all vitamins that affect friendship
-- @return: Array of vitamin IDs
function ItemDatabase.getAllFriendshipVitamins()
    local vitamins = {}
    for itemId, itemData in pairs(friendshipItemData) do
        if itemData.type == "friendship_vitamin" then
            table.insert(vitamins, itemId)
        end
    end
    return vitamins
end

-- Get all bitter items
-- @return: Array of bitter item IDs
function ItemDatabase.getAllBitterItems()
    local bitterItems = {}
    for itemId, itemData in pairs(friendshipItemData) do
        if itemData.isBitter then
            table.insert(bitterItems, itemId)
        end
    end
    return bitterItems
end

-- Get general item data (combines all item categories)
-- @param itemId: Item ID to get data for
-- @return: Item data or nil if not found
function ItemDatabase.getItem(itemId)
    ItemDatabase.init()
    
    -- Check all item databases
    local databases = {
        pokeballData,
        healingItemData,
        ppRestoreData,
        berryData,
        keyItemData,
        moneyItemData,
        evolutionItemData,
        friendshipItemData,
        heldItemData,
        battleItemData,
        statBoosterData,
        formChangeData,
        additionalBerryData,
        miscItemData,
        typeEnhancementData,
        tmData
    }
    
    for _, database in ipairs(databases) do
        local item = database[itemId]
        if item then
            return item
        end
    end
    
    return nil
end

-- Get all items by category
-- @param category: Item category to filter by
-- @return: Array of items in the category
function ItemDatabase.getItemsByCategory(category)
    ItemDatabase.init()
    local items = {}
    
    local databases = {
        {pokeballData, ItemCategory.POKEBALL},
        {healingItemData, ItemCategory.HEALING},
        {ppRestoreData, ItemCategory.PP_RESTORE},
        {berryData, ItemCategory.BERRY},
        {keyItemData, ItemCategory.KEY_ITEM},
        {moneyItemData, ItemCategory.MONEY},
        {evolutionItemData, ItemCategory.EVOLUTION},
        {friendshipItemData, ItemCategory.MISC},
        {heldItemData, ItemCategory.HELD_ITEM},
        {battleItemData, ItemCategory.BATTLE_ITEM},
        {statBoosterData, ItemCategory.STAT_BOOSTER},
        {formChangeData, ItemCategory.FORM_CHANGE},
        {additionalBerryData, ItemCategory.BERRY},
        {miscItemData, ItemCategory.MISC},
        {typeEnhancementData, ItemCategory.HELD_ITEM},
        {tmData, ItemCategory.MISC}
    }
    
    for _, dbInfo in ipairs(databases) do
        local database, dbCategory = dbInfo[1], dbInfo[2]
        if not category or category == dbCategory then
            for itemId, itemData in pairs(database) do
                table.insert(items, itemData)
            end
        end
    end
    
    return items
end

-- Get Pokeball data
-- @param pokeballId: Pokeball ID
-- @return: Pokeball data or nil if not found
function ItemDatabase.getPokeball(pokeballId)
    ItemDatabase.init()
    return pokeballData[pokeballId]
end

-- Get healing item data
-- @param itemId: Healing item ID
-- @return: Healing item data or nil if not found
function ItemDatabase.getHealingItem(itemId)
    ItemDatabase.init()
    return healingItemData[itemId]
end

-- Get PP restore item data
-- @param itemId: PP restore item ID
-- @return: PP restore item data or nil if not found
function ItemDatabase.getPpRestoreItem(itemId)
    ItemDatabase.init()
    return ppRestoreData[itemId]
end

-- Get berry data
-- @param berryId: Berry ID
-- @return: Berry data or nil if not found
function ItemDatabase.getBerry(berryId)
    ItemDatabase.init()
    return berryData[berryId]
end

-- Get key item data
-- @param keyItemId: Key item ID
-- @return: Key item data or nil if not found
function ItemDatabase.getKeyItem(keyItemId)
    ItemDatabase.init()
    return keyItemData[keyItemId]
end

-- Get money item data
-- @param itemId: Money item ID
-- @return: Money item data or nil if not found
function ItemDatabase.getMoneyItem(itemId)
    ItemDatabase.init()
    return moneyItemData[itemId]
end

-- Validate friendship item database
-- @return: Boolean and error message if invalid
function ItemDatabase.validateFriendshipDatabase()
    local errors = {}
    
    -- Check that all friendship items have required fields
    for itemId, itemData in pairs(friendshipItemData) do
        if not itemData.name then
            table.insert(errors, "Friendship item " .. itemId .. " missing name")
        end
        if not itemData.type then
            table.insert(errors, "Friendship item " .. itemId .. " missing type")
        end
        if itemData.isFriendshipItem ~= true then
            table.insert(errors, "Friendship item " .. itemId .. " not marked as friendship item")
        end
    end
    
    if #errors > 0 then
        return false, table.concat(errors, ", ")
    end
    
    return true
end

-- Validate complete item database
-- @return: Boolean and error message if invalid
function ItemDatabase.validateCompleteDatabase()
    local errors = {}
    
    -- Validate all item databases
    local databases = {
        {pokeballData, "Pokeball"},
        {healingItemData, "Healing"},
        {ppRestoreData, "PP Restore"},
        {berryData, "Berry"},
        {keyItemData, "Key Item"},
        {moneyItemData, "Money"},
        {evolutionItemData, "Evolution"},
        {friendshipItemData, "Friendship"},
        {heldItemData, "Held Item"},
        {battleItemData, "Battle Item"},
        {statBoosterData, "Stat Booster"},
        {formChangeData, "Form Change"},
        {additionalBerryData, "Additional Berry"},
        {miscItemData, "Misc"},
        {typeEnhancementData, "Type Enhancement"},
        {tmData, "TM"}
    }
    
    for _, dbInfo in ipairs(databases) do
        local database, dbName = dbInfo[1], dbInfo[2]
        for itemId, itemData in pairs(database) do
            -- Check required fields
            if not itemData.id then
                table.insert(errors, dbName .. " item " .. itemId .. " missing id")
            end
            if not itemData.name then
                table.insert(errors, dbName .. " item " .. itemId .. " missing name")
            end
            if not itemData.description then
                table.insert(errors, dbName .. " item " .. itemId .. " missing description")
            end
            if not itemData.category then
                table.insert(errors, dbName .. " item " .. itemId .. " missing category")
            end
            if not itemData.rarity then
                table.insert(errors, dbName .. " item " .. itemId .. " missing rarity")
            end
            if itemData.consumable == nil then
                table.insert(errors, dbName .. " item " .. itemId .. " missing consumable flag")
            end
            if itemData.stackable == nil then
                table.insert(errors, dbName .. " item " .. itemId .. " missing stackable flag")
            end
        end
    end
    
    -- Run existing validation functions
    local evolutionValid, evolutionError = ItemDatabase.validateDatabase()
    if not evolutionValid then
        table.insert(errors, "Evolution database: " .. evolutionError)
    end
    
    local friendshipValid, friendshipError = ItemDatabase.validateFriendshipDatabase()
    if not friendshipValid then
        table.insert(errors, "Friendship database: " .. friendshipError)
    end
    
    if #errors > 0 then
        return false, table.concat(errors, "; ")
    end
    
    return true
end

-- Get total item count across all databases
-- @return: Total number of items
function ItemDatabase.getTotalItemCount()
    ItemDatabase.init()
    local count = 0
    
    local databases = {
        pokeballData,
        healingItemData,
        ppRestoreData,
        berryData,
        keyItemData,
        moneyItemData,
        evolutionItemData,
        friendshipItemData,
        heldItemData,
        battleItemData,
        statBoosterData,
        formChangeData,
        additionalBerryData,
        miscItemData,
        typeEnhancementData,
        tmData
    }
    
    for _, database in ipairs(databases) do
        for _ in pairs(database) do
            count = count + 1
        end
    end
    
    return count
end

-- Export constants
ItemDatabase.EvolutionItem = EvolutionItem
ItemDatabase.ItemCategory = ItemCategory
ItemDatabase.ItemContext = ItemContext
ItemDatabase.ItemRarity = ItemRarity

return ItemDatabase