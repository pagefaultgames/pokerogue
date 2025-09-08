--[[
Berry Database
Comprehensive berry system with activation conditions and effects

Features:
- HP-restoration berries (Oran Berry 10HP, Sitrus Berry 25% HP healing)
- Status-curing berries with immediate activation (Chesto=Sleep, Pecha=Poison, etc.)
- Stat-boosting berries triggered by stat reduction (White Herb, Mental Herb, etc.)
- Damage-reducing berries for super-effective type coverage (once per battle)
- Pinch berries with 25% HP activation thresholds (Petaya=SpAtk+1, Salac=Speed+1, etc.)
- Type-resist berries reducing super-effective damage by 50% once per battle

Behavioral Parity Requirements:
- Never use Lua's math.random() - ALWAYS use AO crypto module
- All berry activation calculations must match TypeScript implementation exactly
- Never hardcode berry data - always reference berry database tables
- All AO message responses must include success boolean
- Berry activation and effect calculations must be deterministic and reproducible
--]]

local BerryDatabase = {}

-- Berry categories enum
local BerryCategory = {
    HP_RESTORE = "hp_restore",
    STATUS_CURE = "status_cure", 
    STAT_BOOST = "stat_boost",
    DAMAGE_REDUCE = "damage_reduce",
    PINCH_BERRY = "pinch_berry",
    TYPE_RESIST = "type_resist",
    PP_RESTORE = "pp_restore",
    SPECIAL = "special"
}

-- Activation conditions enum
local ActivationCondition = {
    HP_25_PERCENT = "hp_25_percent",
    HP_50_PERCENT = "hp_50_percent",
    STATUS_INFLICTED = "status_inflicted",
    STAT_LOWERED = "stat_lowered",
    SUPER_EFFECTIVE_HIT = "super_effective_hit",
    PP_DEPLETED = "pp_depleted",
    IMMEDIATE = "immediate"
}

-- Status conditions enum
local StatusCondition = {
    PARALYSIS = "paralysis",
    SLEEP = "sleep", 
    POISON = "poison",
    BURN = "burn",
    FREEZE = "freeze",
    CONFUSION = "confusion",
    ANY = "any"
}

-- Stats enum
local StatType = {
    ATTACK = "attack",
    DEFENSE = "defense", 
    SP_ATTACK = "spAttack",
    SP_DEFENSE = "spDefense",
    SPEED = "speed",
    ACCURACY = "accuracy",
    EVASION = "evasion",
    CRITICAL_HIT = "criticalHit",
    RANDOM = "random"
}

-- Pokemon types for type-resist berries
local PokemonType = {
    FIRE = "fire",
    WATER = "water",
    ELECTRIC = "electric", 
    GRASS = "grass",
    ICE = "ice",
    FIGHTING = "fighting",
    POISON = "poison",
    GROUND = "ground",
    FLYING = "flying",
    PSYCHIC = "psychic",
    BUG = "bug",
    ROCK = "rock",
    GHOST = "ghost",
    DRAGON = "dragon",
    DARK = "dark",
    STEEL = "steel",
    FAIRY = "fairy",
    NORMAL = "normal"
}

-- HP-restoration berries
local hpRestoreBerries = {
    ORAN_BERRY = {
        id = "ORAN_BERRY",
        name = "Oran Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it restores 10 HP when HP is low.",
        category = BerryCategory.HP_RESTORE,
        activationCondition = ActivationCondition.HP_50_PERCENT,
        effect = {
            type = "heal_fixed",
            amount = 10
        },
        consumable = true,
        battleOnly = true
    },
    
    SITRUS_BERRY = {
        id = "SITRUS_BERRY", 
        name = "Sitrus Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it restores its HP by 1/4 of its maximum HP when its HP drops below 1/2.",
        category = BerryCategory.HP_RESTORE,
        activationCondition = ActivationCondition.HP_50_PERCENT,
        effect = {
            type = "heal_percent",
            amount = 0.25  -- 25% of max HP
        },
        consumable = true,
        battleOnly = true
    }
}

-- Status-curing berries
local statusCureBerries = {
    CHERI_BERRY = {
        id = "CHERI_BERRY",
        name = "Cheri Berry", 
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it recovers from paralysis.",
        category = BerryCategory.STATUS_CURE,
        activationCondition = ActivationCondition.STATUS_INFLICTED,
        effect = {
            type = "cure_status",
            statusCondition = StatusCondition.PARALYSIS
        },
        consumable = true,
        battleOnly = true
    },
    
    CHESTO_BERRY = {
        id = "CHESTO_BERRY",
        name = "Chesto Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it recovers from sleep.",
        category = BerryCategory.STATUS_CURE,
        activationCondition = ActivationCondition.STATUS_INFLICTED,
        effect = {
            type = "cure_status", 
            statusCondition = StatusCondition.SLEEP
        },
        consumable = true,
        battleOnly = true
    },
    
    PECHA_BERRY = {
        id = "PECHA_BERRY",
        name = "Pecha Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it recovers from poison.",
        category = BerryCategory.STATUS_CURE,
        activationCondition = ActivationCondition.STATUS_INFLICTED,
        effect = {
            type = "cure_status",
            statusCondition = StatusCondition.POISON
        },
        consumable = true,
        battleOnly = true
    },
    
    RAWST_BERRY = {
        id = "RAWST_BERRY",
        name = "Rawst Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it recovers from a burn.",
        category = BerryCategory.STATUS_CURE,
        activationCondition = ActivationCondition.STATUS_INFLICTED,
        effect = {
            type = "cure_status",
            statusCondition = StatusCondition.BURN
        },
        consumable = true,
        battleOnly = true
    },
    
    ASPEAR_BERRY = {
        id = "ASPEAR_BERRY",
        name = "Aspear Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it recovers from being frozen.",
        category = BerryCategory.STATUS_CURE,
        activationCondition = ActivationCondition.STATUS_INFLICTED,
        effect = {
            type = "cure_status",
            statusCondition = StatusCondition.FREEZE
        },
        consumable = true,
        battleOnly = true
    },
    
    PERSIM_BERRY = {
        id = "PERSIM_BERRY",
        name = "Persim Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it recovers from confusion.",
        category = BerryCategory.STATUS_CURE,
        activationCondition = ActivationCondition.STATUS_INFLICTED,
        effect = {
            type = "cure_status",
            statusCondition = StatusCondition.CONFUSION
        },
        consumable = true,
        battleOnly = true
    },
    
    LUM_BERRY = {
        id = "LUM_BERRY", 
        name = "Lum Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it recovers from any status condition during battle.",
        category = BerryCategory.STATUS_CURE,
        activationCondition = ActivationCondition.STATUS_INFLICTED,
        effect = {
            type = "cure_status",
            statusCondition = StatusCondition.ANY
        },
        consumable = true,
        battleOnly = true
    }
}

-- Stat-boosting berries (activated when stat is lowered)
local statBoostBerries = {
    WHITE_HERB = {
        id = "WHITE_HERB",
        name = "White Herb",
        description = "An item to be held by a Pokémon. It restores any lowered stat in battle. It can be used only once.",
        category = BerryCategory.STAT_BOOST,
        activationCondition = ActivationCondition.STAT_LOWERED,
        effect = {
            type = "restore_lowered_stats",
            target = "all_lowered"
        },
        consumable = true,
        battleOnly = true
    },
    
    MENTAL_HERB = {
        id = "MENTAL_HERB",
        name = "Mental Herb",
        description = "An item to be held by a Pokémon. It snaps the holder out of move-binding effects like Wrap and prevents the use of such moves.",
        category = BerryCategory.STAT_BOOST,
        activationCondition = ActivationCondition.IMMEDIATE,
        effect = {
            type = "cure_binding",
            target = "binding_moves"
        },
        consumable = true,
        battleOnly = true
    }
}

-- Pinch berries (activate at 25% HP with stat boosts)
local pinchBerries = {
    LIECHI_BERRY = {
        id = "LIECHI_BERRY",
        name = "Liechi Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, its Attack stat will increase when its HP drops below 1/4 of its maximum.",
        category = BerryCategory.PINCH_BERRY,
        activationCondition = ActivationCondition.HP_25_PERCENT,
        effect = {
            type = "boost_stat",
            stat = StatType.ATTACK,
            amount = 1  -- +1 stage
        },
        consumable = true,
        battleOnly = true
    },
    
    GANLON_BERRY = {
        id = "GANLON_BERRY", 
        name = "Ganlon Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, its Defense will increase when its HP drops below 1/4 of its maximum.",
        category = BerryCategory.PINCH_BERRY,
        activationCondition = ActivationCondition.HP_25_PERCENT,
        effect = {
            type = "boost_stat",
            stat = StatType.DEFENSE,
            amount = 1  -- +1 stage
        },
        consumable = true,
        battleOnly = true
    },
    
    PETAYA_BERRY = {
        id = "PETAYA_BERRY",
        name = "Petaya Berry", 
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, its Sp. Atk will sharply increase when its HP drops below 1/4.",
        category = BerryCategory.PINCH_BERRY,
        activationCondition = ActivationCondition.HP_25_PERCENT,
        effect = {
            type = "boost_stat",
            stat = StatType.SP_ATTACK,
            amount = 1  -- +1 stage  
        },
        consumable = true,
        battleOnly = true
    },
    
    APICOT_BERRY = {
        id = "APICOT_BERRY",
        name = "Apicot Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, its Sp. Def will sharply increase when its HP drops below 1/4.",
        category = BerryCategory.PINCH_BERRY,
        activationCondition = ActivationCondition.HP_25_PERCENT,
        effect = {
            type = "boost_stat",
            stat = StatType.SP_DEFENSE,
            amount = 1  -- +1 stage
        },
        consumable = true,
        battleOnly = true
    },
    
    SALAC_BERRY = {
        id = "SALAC_BERRY",
        name = "Salac Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, its Speed will sharply increase when its HP drops below 1/4.",
        category = BerryCategory.PINCH_BERRY,
        activationCondition = ActivationCondition.HP_25_PERCENT,
        effect = {
            type = "boost_stat",
            stat = StatType.SPEED,
            amount = 1  -- +1 stage
        },
        consumable = true,
        battleOnly = true
    },
    
    LANSAT_BERRY = {
        id = "LANSAT_BERRY",
        name = "Lansat Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, its critical hit ratio will increase when its HP drops below 1/4.",
        category = BerryCategory.PINCH_BERRY,
        activationCondition = ActivationCondition.HP_25_PERCENT,
        effect = {
            type = "boost_stat",
            stat = StatType.CRITICAL_HIT,
            amount = 1  -- +1 stage
        },
        consumable = true,
        battleOnly = true
    },
    
    STARF_BERRY = {
        id = "STARF_BERRY",
        name = "Starf Berry", 
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, one of its stats will sharply increase when its HP drops below 1/4.",
        category = BerryCategory.PINCH_BERRY,
        activationCondition = ActivationCondition.HP_25_PERCENT,
        effect = {
            type = "boost_stat",
            stat = StatType.RANDOM,
            amount = 2  -- +2 stages to random stat
        },
        consumable = true,
        battleOnly = true
    }
}

-- Damage-reducing berries (halve super-effective damage once per battle)
local damageReduceBerries = {
    ENIGMA_BERRY = {
        id = "ENIGMA_BERRY",
        name = "Enigma Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it restores its HP if it is hit by a supereffective attack.",
        category = BerryCategory.DAMAGE_REDUCE,
        activationCondition = ActivationCondition.SUPER_EFFECTIVE_HIT,
        effect = {
            type = "heal_after_super_effective",
            amount = 0.25  -- 25% of max HP
        },
        consumable = true,
        battleOnly = true,
        oncePerBattle = true
    }
}

-- Type-resist berries (reduce super-effective damage by 50% once per battle)
local typeResistBerries = {
    OCCA_BERRY = {
        id = "OCCA_BERRY",
        name = "Occa Berry", 
        description = "A Berry to be held by a Pokémon. It weakens a supereffective Fire-type attack against the holder.",
        category = BerryCategory.TYPE_RESIST,
        activationCondition = ActivationCondition.SUPER_EFFECTIVE_HIT,
        effect = {
            type = "resist_type_damage", 
            resistType = PokemonType.FIRE,
            damageReduction = 0.5  -- 50% damage reduction
        },
        consumable = true,
        battleOnly = true,
        oncePerBattle = true
    },
    
    PASSHO_BERRY = {
        id = "PASSHO_BERRY",
        name = "Passho Berry",
        description = "A Berry to be held by a Pokémon. It weakens a supereffective Water-type attack against the holder.",
        category = BerryCategory.TYPE_RESIST,
        activationCondition = ActivationCondition.SUPER_EFFECTIVE_HIT,
        effect = {
            type = "resist_type_damage",
            resistType = PokemonType.WATER,
            damageReduction = 0.5
        },
        consumable = true,
        battleOnly = true,
        oncePerBattle = true
    },
    
    WACAN_BERRY = {
        id = "WACAN_BERRY",
        name = "Wacan Berry",
        description = "A Berry to be held by a Pokémon. It weakens a supereffective Electric-type attack against the holder.",
        category = BerryCategory.TYPE_RESIST,
        activationCondition = ActivationCondition.SUPER_EFFECTIVE_HIT,
        effect = {
            type = "resist_type_damage",
            resistType = PokemonType.ELECTRIC,
            damageReduction = 0.5
        },
        consumable = true,
        battleOnly = true,
        oncePerBattle = true
    },
    
    RINDO_BERRY = {
        id = "RINDO_BERRY", 
        name = "Rindo Berry",
        description = "A Berry to be held by a Pokémon. It weakens a supereffective Grass-type attack against the holder.",
        category = BerryCategory.TYPE_RESIST,
        activationCondition = ActivationCondition.SUPER_EFFECTIVE_HIT,
        effect = {
            type = "resist_type_damage",
            resistType = PokemonType.GRASS,
            damageReduction = 0.5
        },
        consumable = true,
        battleOnly = true,
        oncePerBattle = true
    },
    
    YACHE_BERRY = {
        id = "YACHE_BERRY",
        name = "Yache Berry",
        description = "A Berry to be held by a Pokémon. It weakens a supereffective Ice-type attack against the holder.",
        category = BerryCategory.TYPE_RESIST,
        activationCondition = ActivationCondition.SUPER_EFFECTIVE_HIT,
        effect = {
            type = "resist_type_damage",
            resistType = PokemonType.ICE,
            damageReduction = 0.5
        },
        consumable = true,
        battleOnly = true,
        oncePerBattle = true
    },
    
    CHOPLE_BERRY = {
        id = "CHOPLE_BERRY",
        name = "Chople Berry",
        description = "A Berry to be held by a Pokémon. It weakens a supereffective Fighting-type attack against the holder.",
        category = BerryCategory.TYPE_RESIST,
        activationCondition = ActivationCondition.SUPER_EFFECTIVE_HIT,
        effect = {
            type = "resist_type_damage",
            resistType = PokemonType.FIGHTING,
            damageReduction = 0.5
        },
        consumable = true,
        battleOnly = true,
        oncePerBattle = true
    },
    
    KEBIA_BERRY = {
        id = "KEBIA_BERRY",
        name = "Kebia Berry",
        description = "A Berry to be held by a Pokémon. It weakens a supereffective Poison-type attack against the holder.",
        category = BerryCategory.TYPE_RESIST,
        activationCondition = ActivationCondition.SUPER_EFFECTIVE_HIT,
        effect = {
            type = "resist_type_damage",
            resistType = PokemonType.POISON,
            damageReduction = 0.5
        },
        consumable = true,
        battleOnly = true,
        oncePerBattle = true
    },
    
    SHUCA_BERRY = {
        id = "SHUCA_BERRY",
        name = "Shuca Berry",
        description = "A Berry to be held by a Pokémon. It weakens a supereffective Ground-type attack against the holder.",
        category = BerryCategory.TYPE_RESIST,
        activationCondition = ActivationCondition.SUPER_EFFECTIVE_HIT,
        effect = {
            type = "resist_type_damage",
            resistType = PokemonType.GROUND,
            damageReduction = 0.5
        },
        consumable = true,
        battleOnly = true,
        oncePerBattle = true
    }
}

-- PP restoration berries
local ppRestoreBerries = {
    LEPPA_BERRY = {
        id = "LEPPA_BERRY",
        name = "Leppa Berry",
        description = "A Berry to be consumed by Pokémon. If a Pokémon holds one, it restores a move's PP by 10 when the PP reaches 0.",
        category = BerryCategory.PP_RESTORE,
        activationCondition = ActivationCondition.PP_DEPLETED,
        effect = {
            type = "restore_pp",
            amount = 10
        },
        consumable = true,
        battleOnly = true
    }
}

-- Merge all berry collections into main database
local function mergeBerryData()
    local allBerries = {}
    
    -- Merge all berry categories
    for berryId, berryData in pairs(hpRestoreBerries) do
        allBerries[berryId] = berryData
    end
    
    for berryId, berryData in pairs(statusCureBerries) do
        allBerries[berryId] = berryData
    end
    
    for berryId, berryData in pairs(statBoostBerries) do
        allBerries[berryId] = berryData
    end
    
    for berryId, berryData in pairs(pinchBerries) do
        allBerries[berryId] = berryData
    end
    
    for berryId, berryData in pairs(damageReduceBerries) do
        allBerries[berryId] = berryData
    end
    
    for berryId, berryData in pairs(typeResistBerries) do
        allBerries[berryId] = berryData
    end
    
    for berryId, berryData in pairs(ppRestoreBerries) do
        allBerries[berryId] = berryData
    end
    
    return allBerries
end

-- Main berry database
BerryDatabase.berries = mergeBerryData()

-- Berry database access functions
function BerryDatabase.getBerry(berryId)
    return BerryDatabase.berries[berryId]
end

function BerryDatabase.getAllBerries()
    return BerryDatabase.berries
end

function BerryDatabase.getBerriesByCategory(category)
    local categoryBerries = {}
    for berryId, berryData in pairs(BerryDatabase.berries) do
        if berryData.category == category then
            categoryBerries[berryId] = berryData
        end
    end
    return categoryBerries
end

function BerryDatabase.getBerriesByActivationCondition(condition)
    local conditionBerries = {}
    for berryId, berryData in pairs(BerryDatabase.berries) do
        if berryData.activationCondition == condition then
            conditionBerries[berryId] = berryData
        end
    end
    return conditionBerries
end

function BerryDatabase.isBerry(itemId)
    return BerryDatabase.berries[itemId] ~= nil
end

function BerryDatabase.isConsumable(berryId)
    local berry = BerryDatabase.getBerry(berryId)
    return berry and berry.consumable == true
end

function BerryDatabase.isOncePerBattle(berryId)
    local berry = BerryDatabase.getBerry(berryId)
    return berry and berry.oncePerBattle == true
end

-- Validation functions
function BerryDatabase.validateBerryData()
    local errors = {}
    
    for berryId, berryData in pairs(BerryDatabase.berries) do
        -- Check required fields
        if not berryData.id then
            table.insert(errors, "Berry " .. berryId .. " missing id field")
        end
        
        if not berryData.name then
            table.insert(errors, "Berry " .. berryId .. " missing name field")
        end
        
        if not berryData.category then
            table.insert(errors, "Berry " .. berryId .. " missing category field")
        end
        
        if not berryData.activationCondition then
            table.insert(errors, "Berry " .. berryId .. " missing activationCondition field")
        end
        
        if not berryData.effect then
            table.insert(errors, "Berry " .. berryId .. " missing effect field")
        end
    end
    
    return #errors == 0, errors
end

-- Export enums for external use
BerryDatabase.BerryCategory = BerryCategory
BerryDatabase.ActivationCondition = ActivationCondition
BerryDatabase.StatusCondition = StatusCondition
BerryDatabase.StatType = StatType
BerryDatabase.PokemonType = PokemonType

return BerryDatabase