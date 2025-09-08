-- Terrain Effects System
-- Core terrain mechanics and interactions for battle field effects
-- Implements Electric, Grassy, Misty, and Psychic terrain with proper grounding rules

local TerrainEffects = {}

-- Load dependencies
local Enums = require("data.constants.enums")
local BattleRNG = require("game-logic.rng.battle-rng")

-- Terrain types (matching battle-conditions.lua)
TerrainEffects.TerrainType = {
    NONE = 0,
    ELECTRIC = 1,
    GRASSY = 2,
    MISTY = 3,
    PSYCHIC = 4
}

-- Terrain configuration data
TerrainEffects.TerrainData = {
    [TerrainEffects.TerrainType.ELECTRIC] = {
        name = "Electric Terrain",
        default_duration = 5,
        type_boost = Enums.PokemonType.ELECTRIC,
        power_multiplier = 1.3, -- 30% boost
        status_prevention = {"sleep"},
        grounded_only = true,
        description = "Electric-type moves are boosted and Pokemon cannot fall asleep"
    },
    [TerrainEffects.TerrainType.GRASSY] = {
        name = "Grassy Terrain",
        default_duration = 5,
        type_boost = Enums.PokemonType.GRASS,
        power_multiplier = 1.3, -- 30% boost
        healing_per_turn = "1/16", -- 1/16 HP healing per turn
        move_power_reduction = {
            -- Moves that are weakened in Grassy Terrain
            earthquake = 0.5,
            magnitude = 0.5,
            bulldoze = 0.5
        },
        grounded_only = true,
        description = "Grass-type moves are boosted and grounded Pokemon heal each turn"
    },
    [TerrainEffects.TerrainType.MISTY] = {
        name = "Misty Terrain",
        default_duration = 5,
        power_multiplier = 1.0, -- No type boost (original implementation had Fairy boost but that's not standard)
        status_prevention = {"all"}, -- All status conditions prevented
        dragon_move_reduction = 0.5, -- Dragon moves do 50% damage
        grounded_only = true,
        description = "Status conditions are prevented and Dragon-type moves are weakened"
    },
    [TerrainEffects.TerrainType.PSYCHIC] = {
        name = "Psychic Terrain",
        default_duration = 5,
        type_boost = Enums.PokemonType.PSYCHIC,
        power_multiplier = 1.3, -- 30% boost
        priority_move_immunity = true,
        grounded_only = true,
        description = "Psychic-type moves are boosted and priority moves are blocked"
    }
}

-- Initialize terrain state for a battle
-- @param battleId: Battle instance identifier
-- @return: Initial terrain state
function TerrainEffects.initializeTerrainState(battleId)
    return {
        battle_id = battleId,
        current_terrain = TerrainEffects.TerrainType.NONE,
        duration_remaining = 0,
        source = nil,
        timestamp = os.time()
    }
end

-- Set terrain effect
-- @param terrainState: Current terrain state
-- @param terrainType: Terrain type to set
-- @param duration: Duration override (nil for default)
-- @param source: Source of terrain change (move name, ability, etc.)
-- @return: Updated terrain state and success status
function TerrainEffects.setTerrain(terrainState, terrainType, duration, source)
    if not terrainState or not terrainType then
        return terrainState, false, "Invalid parameters for terrain change"
    end
    
    local terrainData = TerrainEffects.TerrainData[terrainType]
    if not terrainData and terrainType ~= TerrainEffects.TerrainType.NONE then
        return terrainState, false, "Unknown terrain type: " .. tostring(terrainType)
    end
    
    local actualDuration = duration
    if not actualDuration and terrainData then
        actualDuration = terrainData.default_duration
    elseif terrainType == TerrainEffects.TerrainType.NONE then
        actualDuration = 0
    end
    
    -- Update terrain state
    terrainState.current_terrain = terrainType
    terrainState.duration_remaining = actualDuration or 0
    terrainState.source = source
    terrainState.timestamp = os.time()
    
    local terrainName = terrainData and terrainData.name or "None"
    return terrainState, true, "Terrain changed to " .. terrainName
end

-- Check if Pokemon is grounded (affected by terrain effects)
-- @param pokemon: Pokemon data
-- @return: Boolean indicating if Pokemon is grounded
function TerrainEffects.isPokemonGrounded(pokemon)
    if not pokemon then
        return false
    end
    
    -- Iron Ball forces Pokemon to be grounded (overrides Flying/Levitate)
    if pokemon.item == Enums.ItemId.IRON_BALL then
        return true
    end
    
    -- Air Balloon makes Pokemon not grounded (until hit by a damaging move)
    if pokemon.item == Enums.ItemId.AIR_BALLOON then
        -- TODO: Check if balloon has been popped by a damaging move
        return false
    end
    
    -- Flying type Pokemon are not grounded (unless forced by Iron Ball)
    if pokemon.types then
        for _, pokemonType in ipairs(pokemon.types) do
            if pokemonType == Enums.PokemonType.FLYING then
                return false
            end
        end
    end
    
    -- Levitate ability makes Pokemon not grounded (unless forced by Iron Ball)
    if pokemon.ability == Enums.AbilityId.LEVITATE then
        return false
    end
    
    -- TODO: Add checks for temporary effects that affect grounding:
    -- - Magnet Rise (not grounded for 5 turns)
    -- - Telekinesis (not grounded for 3 turns)
    -- - Ingrain (forces grounding)
    -- - Smack Down (forces grounding until switching out)
    
    return true
end

-- Get terrain move power modifier
-- @param moveData: Move information including type
-- @param terrainState: Current terrain state
-- @param attackerGrounded: Whether the attacking Pokemon is grounded
-- @return: Power multiplier (1.0 = no change)
function TerrainEffects.getTerrainMovePowerModifier(moveData, terrainState, attackerGrounded)
    if not terrainState or not moveData or terrainState.current_terrain == TerrainEffects.TerrainType.NONE then
        return 1.0
    end
    
    local terrainData = TerrainEffects.TerrainData[terrainState.current_terrain]
    if not terrainData then
        return 1.0
    end
    
    -- Terrain effects only apply to grounded Pokemon
    if terrainData.grounded_only and not attackerGrounded then
        return 1.0
    end
    
    -- Check for type-based power boost
    if terrainData.type_boost and moveData.type == terrainData.type_boost then
        return terrainData.power_multiplier
    end
    
    -- Check for move-specific power reductions (Grassy Terrain)
    if terrainData.move_power_reduction and moveData.name then
        local moveName = string.lower(moveData.name)
        if terrainData.move_power_reduction[moveName] then
            return terrainData.move_power_reduction[moveName]
        end
    end
    
    -- Check for Dragon-type move reduction (Misty Terrain)
    if terrainData.dragon_move_reduction and moveData.type == Enums.PokemonType.DRAGON then
        return terrainData.dragon_move_reduction
    end
    
    return 1.0
end

-- Check if terrain blocks a move
-- @param moveData: Move data including type and priority
-- @param terrainState: Current terrain state
-- @param targetGrounded: Whether the target is grounded
-- @return: Boolean indicating if move is blocked, reason string
function TerrainEffects.doesTerrainBlockMove(moveData, terrainState, targetGrounded)
    if not terrainState or not moveData or terrainState.current_terrain == TerrainEffects.TerrainType.NONE then
        return false, nil
    end
    
    local terrainData = TerrainEffects.TerrainData[terrainState.current_terrain]
    if not terrainData then
        return false, nil
    end
    
    -- Terrain effects only apply to grounded Pokemon
    if terrainData.grounded_only and not targetGrounded then
        return false, nil
    end
    
    -- Psychic Terrain blocks priority moves
    if terrainData.priority_move_immunity and moveData.priority and moveData.priority > 0 then
        return true, "Priority moves are blocked by Psychic Terrain"
    end
    
    return false, nil
end

-- Check if terrain prevents status condition
-- @param statusEffect: Status effect to check ("sleep", "poison", "paralysis", "burn", "freeze")
-- @param terrainState: Current terrain state
-- @param pokemonGrounded: Whether Pokemon is grounded
-- @return: Boolean indicating if status is prevented
function TerrainEffects.doesTerrainPreventStatus(statusEffect, terrainState, pokemonGrounded)
    if not terrainState or not statusEffect or terrainState.current_terrain == TerrainEffects.TerrainType.NONE then
        return false
    end
    
    local terrainData = TerrainEffects.TerrainData[terrainState.current_terrain]
    if not terrainData or not terrainData.status_prevention then
        return false
    end
    
    -- Terrain effects only apply to grounded Pokemon
    if terrainData.grounded_only and not pokemonGrounded then
        return false
    end
    
    -- Check if terrain prevents all status conditions
    for _, preventedStatus in ipairs(terrainData.status_prevention) do
        if preventedStatus == "all" then
            return true
        elseif preventedStatus == statusEffect then
            return true
        end
    end
    
    return false
end

-- Process terrain healing effects at end of turn
-- @param terrainState: Current terrain state
-- @param pokemonList: List of Pokemon to process
-- @return: List of healing results
function TerrainEffects.processTerrainHealing(terrainState, pokemonList)
    if not terrainState or not pokemonList or terrainState.current_terrain == TerrainEffects.TerrainType.NONE then
        return {}
    end
    
    local terrainData = TerrainEffects.TerrainData[terrainState.current_terrain]
    if not terrainData or not terrainData.healing_per_turn then
        return {}
    end
    
    local healingResults = {}
    
    for _, pokemon in ipairs(pokemonList) do
        -- Check if Pokemon is grounded (affected by terrain)
        if terrainData.grounded_only and not TerrainEffects.isPokemonGrounded(pokemon) then
            goto continue
        end
        
        -- Skip if Pokemon is fainted or at full HP
        if pokemon.currentHP <= 0 or pokemon.currentHP >= pokemon.maxHP then
            goto continue
        end
        
        local maxHP = pokemon.maxHP or pokemon.stats[Enums.Stat.HP]
        local healing = 0
        
        if terrainData.healing_per_turn == "1/16" then
            healing = math.max(1, math.floor(maxHP / 16))
        end
        
        -- Cap healing to not exceed max HP
        local actualHealing = math.min(healing, maxHP - pokemon.currentHP)
        
        if actualHealing > 0 then
            table.insert(healingResults, {
                pokemon_id = pokemon.id,
                healing = actualHealing,
                terrain = terrainData.name,
                new_hp = pokemon.currentHP + actualHealing
            })
        end
        
        ::continue::
    end
    
    return healingResults
end

-- Update terrain duration at end of turn
-- @param terrainState: Current terrain state
-- @return: Updated terrain state, boolean indicating if terrain should end
function TerrainEffects.updateTerrainDuration(terrainState)
    if not terrainState or terrainState.current_terrain == TerrainEffects.TerrainType.NONE then
        return terrainState, false
    end
    
    if terrainState.duration_remaining == -1 then
        return terrainState, false -- Permanent terrain doesn't expire
    end
    
    if terrainState.duration_remaining <= 1 then
        -- Terrain expires
        terrainState.current_terrain = TerrainEffects.TerrainType.NONE
        terrainState.duration_remaining = 0
        terrainState.source = nil
        return terrainState, true
    end
    
    terrainState.duration_remaining = terrainState.duration_remaining - 1
    return terrainState, false
end

-- Get terrain information for display/debugging
-- @param terrainState: Current terrain state
-- @return: Terrain information table
function TerrainEffects.getTerrainInfo(terrainState)
    if not terrainState or terrainState.current_terrain == TerrainEffects.TerrainType.NONE then
        return {
            name = "None",
            type = TerrainEffects.TerrainType.NONE,
            duration = 0,
            active = false
        }
    end
    
    local terrainData = TerrainEffects.TerrainData[terrainState.current_terrain]
    return {
        name = terrainData and terrainData.name or "Unknown",
        type = terrainState.current_terrain,
        duration = terrainState.duration_remaining,
        active = true,
        source = terrainState.source,
        description = terrainData and terrainData.description or ""
    }
end

return TerrainEffects