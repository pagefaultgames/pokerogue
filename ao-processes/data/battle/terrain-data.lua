-- Terrain System Data
-- Complete terrain type interactions with moves and status effects
-- Provides exact power modifiers and interaction rules matching TypeScript implementation

local TerrainData = {}

-- Load dependencies
local Enums = require("data.constants.enums")

-- Terrain type power modifiers
-- Maps terrain types to move type multipliers for grounded Pokemon
TerrainData.TypeModifiers = {
    [1] = { -- ELECTRIC TERRAIN
        [Enums.PokemonType.ELECTRIC] = 1.5
    },
    [2] = { -- GRASSY TERRAIN
        [Enums.PokemonType.GRASS] = 1.5
    },
    [3] = { -- MISTY TERRAIN
        [Enums.PokemonType.FAIRY] = 1.5
    },
    [4] = { -- PSYCHIC TERRAIN
        [Enums.PokemonType.PSYCHIC] = 1.5
    }
}

-- Terrain status effect prevention
-- Maps terrain types to status effects they prevent for grounded Pokemon
TerrainData.StatusPrevention = {
    [1] = { -- ELECTRIC TERRAIN
        ["sleep"] = true
    },
    [3] = { -- MISTY TERRAIN
        ["all_status"] = true -- Prevents all major status conditions
    }
}

-- Terrain healing effects
-- Maps terrain types to healing provided per turn
TerrainData.HealingEffects = {
    [2] = { -- GRASSY TERRAIN
        healing = "1/16", -- Heals grounded Pokemon 1/16 HP per turn
        condition = "grounded_only"
    }
}

-- Terrain move power modifications
-- Maps terrain types to specific moves that are affected
TerrainData.MovePowerModifiers = {
    [2] = { -- GRASSY TERRAIN
        -- Reduces power of moves that affect the ground
        ["earthquake"] = 0.5,
        ["magnitude"] = 0.5,
        ["bulldoze"] = 0.5,
        ["earth_power"] = 0.5,
        ["stomping_tantrum"] = 0.5,
        ["precipice_blades"] = 0.5
    }
}

-- Terrain move blocking rules
-- Maps terrain types to moves or move properties they block
TerrainData.MoveBlocking = {
    [3] = { -- MISTY TERRAIN
        -- Blocks Dragon-type moves against grounded targets
        blocked_types = {Enums.PokemonType.DRAGON}
    },
    [4] = { -- PSYCHIC TERRAIN
        -- Blocks priority moves against grounded targets
        blocked_priority = true
    }
}

-- Terrain duration data
TerrainData.DurationData = {
    default = 5,     -- Standard terrain duration
    abilities = {
        ["electric_surge"] = {duration = 5, terrain = 1},  -- Electric Terrain
        ["grassy_surge"] = {duration = 5, terrain = 2},    -- Grassy Terrain
        ["misty_surge"] = {duration = 5, terrain = 3},     -- Misty Terrain
        ["psychic_surge"] = {duration = 5, terrain = 4}    -- Psychic Terrain
    },
    items = {
        ["terrain_extender"] = 3 -- Extends terrain duration by 3 turns (8 total)
    }
}

-- Terrain interaction with abilities
TerrainData.AbilityInteractions = {
    [1] = { -- ELECTRIC TERRAIN
        boost = {
            ["surge_surfer"] = {stat = "speed", multiplier = 2.0}
        }
    },
    [2] = { -- GRASSY TERRAIN
        boost = {
            ["grass_pelt"] = {stat = "defense", multiplier = 1.5}
        }
    }
}

-- Check if Pokemon is grounded (affected by terrain)
-- @param pokemonData: Pokemon data including types and ability
-- @return: Boolean indicating if Pokemon is grounded
function TerrainData.isPokemonGrounded(pokemonData)
    if not pokemonData then
        return true -- Default to grounded
    end
    
    -- Flying-type Pokemon are not grounded
    if pokemonData.types then
        for _, type in ipairs(pokemonData.types) do
            if type == Enums.PokemonType.FLYING then
                return false
            end
        end
    end
    
    -- Levitate ability makes Pokemon not grounded
    if pokemonData.ability == Enums.AbilityId.LEVITATE then
        return false
    end
    
    -- TODO: Add checks for:
    -- - Air Balloon item
    -- - Magnet Rise effect
    -- - Telekinesis effect
    -- - Fly/Bounce semi-invulnerable state
    
    return true
end

-- Get terrain type power modifier for moves
-- @param terrainType: Current terrain type (1-4)
-- @param moveType: Move type ID
-- @param pokemonGrounded: Whether the attacking Pokemon is grounded
-- @return: Power multiplier (1.0 = no change)
function TerrainData.getTypePowerModifier(terrainType, moveType, pokemonGrounded)
    if not pokemonGrounded then
        return 1.0 -- Terrain doesn't affect non-grounded Pokemon
    end
    
    local modifiers = TerrainData.TypeModifiers[terrainType]
    if not modifiers then
        return 1.0
    end
    
    return modifiers[moveType] or 1.0
end

-- Get terrain power modifier for specific moves
-- @param terrainType: Current terrain type
-- @param moveName: Name of the move (lowercase)
-- @param pokemonGrounded: Whether the attacking Pokemon is grounded
-- @return: Power multiplier (1.0 = no change)
function TerrainData.getMovePowerModifier(terrainType, moveName, pokemonGrounded)
    if not pokemonGrounded then
        return 1.0
    end
    
    local modifiers = TerrainData.MovePowerModifiers[terrainType]
    if not modifiers then
        return 1.0
    end
    
    return modifiers[moveName] or 1.0
end

-- Check if terrain prevents status condition
-- @param terrainType: Current terrain type
-- @param statusEffect: Status effect name
-- @param pokemonGrounded: Whether the target Pokemon is grounded
-- @return: Boolean indicating if status is prevented
function TerrainData.preventsStatus(terrainType, statusEffect, pokemonGrounded)
    if not pokemonGrounded then
        return false -- Terrain doesn't affect non-grounded Pokemon
    end
    
    local prevention = TerrainData.StatusPrevention[terrainType]
    if not prevention then
        return false
    end
    
    -- Check for specific status prevention
    if prevention[statusEffect] then
        return true
    end
    
    -- Check for all status prevention (Misty Terrain)
    if prevention["all_status"] and statusEffect ~= "none" then
        return true
    end
    
    return false
end

-- Check if terrain blocks a move
-- @param terrainType: Current terrain type
-- @param moveData: Move data including type and priority
-- @param targetGrounded: Whether the target Pokemon is grounded
-- @return: Boolean indicating if move is blocked
function TerrainData.blocksMove(terrainType, moveData, targetGrounded)
    if not targetGrounded then
        return false -- Terrain doesn't affect non-grounded Pokemon
    end
    
    local blocking = TerrainData.MoveBlocking[terrainType]
    if not blocking then
        return false
    end
    
    -- Check for type-based blocking (Misty Terrain vs Dragon moves)
    if blocking.blocked_types then
        for _, blockedType in ipairs(blocking.blocked_types) do
            if moveData.type == blockedType then
                return true
            end
        end
    end
    
    -- Check for priority move blocking (Psychic Terrain)
    if blocking.blocked_priority and moveData.priority and moveData.priority > 0 then
        return true
    end
    
    return false
end

-- Get terrain healing amount
-- @param terrainType: Current terrain type
-- @param pokemonData: Pokemon data
-- @return: Healing fraction string or nil
function TerrainData.getHealing(terrainType, pokemonData)
    local healingData = TerrainData.HealingEffects[terrainType]
    if not healingData then
        return nil
    end
    
    -- Check if Pokemon is grounded (required for terrain healing)
    if healingData.condition == "grounded_only" and not TerrainData.isPokemonGrounded(pokemonData) then
        return nil
    end
    
    return healingData.healing
end

-- Get ability boost from terrain
-- @param terrainType: Current terrain type
-- @param abilityName: Ability name (lowercase)
-- @param pokemonGrounded: Whether the Pokemon is grounded
-- @return: Boost data table or nil
function TerrainData.getAbilityBoost(terrainType, abilityName, pokemonGrounded)
    if not pokemonGrounded then
        return nil
    end
    
    local abilityData = TerrainData.AbilityInteractions[terrainType]
    if not abilityData or not abilityData.boost then
        return nil
    end
    
    return abilityData.boost[abilityName]
end

-- Get terrain duration with item/ability modifications
-- @param baseDuration: Base terrain duration
-- @param itemHeld: Item held by the Pokemon setting terrain
-- @param abilityUsed: Ability used to set terrain
-- @return: Modified duration
function TerrainData.getModifiedDuration(baseDuration, itemHeld, abilityUsed)
    local duration = baseDuration or TerrainData.DurationData.default
    
    -- Check for duration extending items
    if itemHeld == "terrain_extender" then
        local extension = TerrainData.DurationData.items["terrain_extender"]
        duration = duration + extension
    end
    
    -- Some abilities might modify duration in future implementations
    -- Currently all surge abilities use standard duration
    
    return duration
end

-- Check if terrain affects a specific Pokemon
-- @param terrainType: Current terrain type
-- @param pokemonData: Pokemon data
-- @return: Boolean indicating if Pokemon is affected by terrain
function TerrainData.affectsPokemon(terrainType, pokemonData)
    -- All terrain effects require Pokemon to be grounded
    return TerrainData.isPokemonGrounded(pokemonData)
end

-- Get terrain name from terrain type
-- @param terrainType: Terrain type ID
-- @return: Human-readable terrain name
function TerrainData.getTerrainName(terrainType)
    local names = {
        [0] = "None",
        [1] = "Electric Terrain",
        [2] = "Grassy Terrain", 
        [3] = "Misty Terrain",
        [4] = "Psychic Terrain"
    }
    
    return names[terrainType] or "Unknown Terrain"
end

-- Get all status effects prevented by terrain
-- @param terrainType: Current terrain type
-- @return: Array of prevented status effect names
function TerrainData.getPreventedStatuses(terrainType)
    local prevention = TerrainData.StatusPrevention[terrainType]
    if not prevention then
        return {}
    end
    
    local prevented = {}
    for status, _ in pairs(prevention) do
        if status ~= "all_status" then
            table.insert(prevented, status)
        elseif status == "all_status" then
            -- Return all major status conditions
            prevented = {"sleep", "paralysis", "burn", "poison", "freeze", "toxic"}
            break
        end
    end
    
    return prevented
end

return TerrainData