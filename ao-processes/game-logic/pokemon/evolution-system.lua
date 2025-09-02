--[[
Pokemon Evolution System
Handles evolution conditions and processing for Pokemon level progression

Features:
- Level-based evolution checking and triggering
- Evolution condition validation (level, gender, stats)
- Species database integration for evolution chains
- TypeScript behavioral parity for evolution mechanics
--]]

local EvolutionSystem = {}

-- Import dependencies
local EvolutionChains = require("data.species.evolution-chains")
local SpeciesDatabase = require("data.species.species-database")

-- Evolution trigger types
local EvolutionTrigger = {
    LEVEL = "level",
    LEVEL_ATK_GT_DEF = "level_atk_gt_def", 
    LEVEL_ATK_EQ_DEF = "level_atk_eq_def",
    LEVEL_ATK_LT_DEF = "level_atk_lt_def",
    LEVEL_FEMALE = "level_female",
    LEVEL_MALE = "level_male",
    ITEM = "item",
    FRIENDSHIP = "friendship",
    FRIENDSHIP_DAY = "friendship_day",
    FRIENDSHIP_NIGHT = "friendship_night",
    TRADE = "trade",
    TRADE_ITEM = "trade_item",
    STONE = "stone",
    LEVEL_MOVE = "level_move",
    OTHER_POKEMON = "other_pokemon",
    SPECIAL = "special"
}

-- Evolution condition checking

-- Check if Pokemon meets level requirement
-- @param pokemon: Pokemon data with level
-- @param requiredLevel: Level needed for evolution
-- @return: Boolean indicating if level requirement is met
function EvolutionSystem.checkLevelRequirement(pokemon, requiredLevel)
    if not pokemon or not pokemon.level or not requiredLevel then
        return false
    end
    
    return pokemon.level >= requiredLevel
end

-- Check if Pokemon meets stat-based level requirement (Tyrogue evolutions)
-- @param pokemon: Pokemon data with stats and level
-- @param requiredLevel: Level needed for evolution
-- @param statCondition: Type of stat condition
-- @return: Boolean indicating if stat condition is met
function EvolutionSystem.checkStatBasedLevelRequirement(pokemon, requiredLevel, statCondition)
    if not pokemon or not pokemon.level or not pokemon.stats then
        return false
    end
    
    if pokemon.level < requiredLevel then
        return false
    end
    
    local attack = pokemon.stats.attack or 0
    local defense = pokemon.stats.defense or 0
    
    if statCondition == EvolutionTrigger.LEVEL_ATK_GT_DEF then
        return attack > defense
    elseif statCondition == EvolutionTrigger.LEVEL_ATK_EQ_DEF then
        return attack == defense
    elseif statCondition == EvolutionTrigger.LEVEL_ATK_LT_DEF then
        return attack < defense
    end
    
    return false
end

-- Check if Pokemon meets gender-based level requirement
-- @param pokemon: Pokemon data with gender and level
-- @param requiredLevel: Level needed for evolution
-- @param genderCondition: Required gender for evolution
-- @return: Boolean indicating if gender condition is met
function EvolutionSystem.checkGenderBasedLevelRequirement(pokemon, requiredLevel, genderCondition)
    if not pokemon or not pokemon.level or not pokemon.gender then
        return false
    end
    
    if pokemon.level < requiredLevel then
        return false
    end
    
    if genderCondition == EvolutionTrigger.LEVEL_FEMALE then
        return pokemon.gender == "FEMALE"
    elseif genderCondition == EvolutionTrigger.LEVEL_MALE then
        return pokemon.gender == "MALE"
    end
    
    return false
end

-- Get available evolutions for Pokemon
-- @param pokemon: Pokemon data with species ID
-- @return: Array of possible evolution options
function EvolutionSystem.getAvailableEvolutions(pokemon)
    if not pokemon or not pokemon.speciesId then
        return {}
    end
    
    -- Initialize evolution chains if not done
    EvolutionChains.init()
    
    -- Get evolution data for this species
    local evolutions = EvolutionChains.getEvolutionsForSpecies(pokemon.speciesId)
    if not evolutions then
        return {}
    end
    
    local availableEvolutions = {}
    
    for _, evolution in ipairs(evolutions) do
        local canEvolve = EvolutionSystem.checkEvolutionCondition(pokemon, evolution)
        if canEvolve then
            table.insert(availableEvolutions, {
                toSpeciesId = evolution.toSpeciesId,
                trigger = evolution.trigger,
                condition = evolution,
                met = true
            })
        end
    end
    
    return availableEvolutions
end

-- Check if specific evolution condition is met
-- @param pokemon: Pokemon data
-- @param evolutionData: Evolution condition data
-- @return: Boolean indicating if condition is met
function EvolutionSystem.checkEvolutionCondition(pokemon, evolutionData)
    if not pokemon or not evolutionData then
        return false
    end
    
    local trigger = evolutionData.trigger
    
    if trigger == EvolutionTrigger.LEVEL then
        return EvolutionSystem.checkLevelRequirement(pokemon, evolutionData.level)
        
    elseif trigger == EvolutionTrigger.LEVEL_ATK_GT_DEF or 
           trigger == EvolutionTrigger.LEVEL_ATK_EQ_DEF or
           trigger == EvolutionTrigger.LEVEL_ATK_LT_DEF then
        return EvolutionSystem.checkStatBasedLevelRequirement(pokemon, evolutionData.level, trigger)
        
    elseif trigger == EvolutionTrigger.LEVEL_FEMALE or
           trigger == EvolutionTrigger.LEVEL_MALE then
        return EvolutionSystem.checkGenderBasedLevelRequirement(pokemon, evolutionData.level, trigger)
        
    elseif trigger == EvolutionTrigger.FRIENDSHIP then
        -- Check friendship level (usually 220+)
        local friendship = pokemon.friendship or 0
        local requiredFriendship = evolutionData.friendshipLevel or 220
        return friendship >= requiredFriendship
        
    elseif trigger == EvolutionTrigger.STONE then
        -- Stone evolution - would require item usage (not level-based)
        return false
        
    elseif trigger == EvolutionTrigger.TRADE then
        -- Trade evolution - not applicable for level-up
        return false
        
    elseif trigger == EvolutionTrigger.ITEM then
        -- Item evolution - would require specific held item
        return false
        
    elseif trigger == EvolutionTrigger.LEVEL_MOVE then
        -- Level + move known requirement
        if not EvolutionSystem.checkLevelRequirement(pokemon, evolutionData.level) then
            return false
        end
        -- Check if Pokemon knows required move
        local requiredMove = evolutionData.moveId
        if pokemon.moves then
            for _, move in ipairs(pokemon.moves) do
                if move.id == requiredMove or move.moveId == requiredMove then
                    return true
                end
            end
        end
        return false
    end
    
    return false
end

-- Process evolution for Pokemon
-- @param pokemon: Pokemon data to evolve
-- @param evolutionTarget: Target species ID to evolve into
-- @return: Updated Pokemon data or nil if evolution failed
function EvolutionSystem.evolveSpecies(pokemon, evolutionTarget)
    if not pokemon or not evolutionTarget then
        return nil, "Missing evolution parameters"
    end
    
    -- Validate that evolution is available
    local availableEvolutions = EvolutionSystem.getAvailableEvolutions(pokemon)
    local validEvolution = false
    
    for _, evolution in ipairs(availableEvolutions) do
        if evolution.toSpeciesId == evolutionTarget then
            validEvolution = true
            break
        end
    end
    
    if not validEvolution then
        return nil, "Evolution not available for this Pokemon"
    end
    
    -- Get new species data
    SpeciesDatabase.init()
    local newSpeciesData = SpeciesDatabase.getSpecies(evolutionTarget)
    if not newSpeciesData then
        return nil, "Target species data not found"
    end
    
    -- Update Pokemon data with new species
    local oldSpeciesId = pokemon.speciesId
    local oldSpeciesName = pokemon.species or "Unknown"
    
    pokemon.speciesId = evolutionTarget
    pokemon.species = newSpeciesData.name
    
    -- Update base stats for stat recalculation
    pokemon.baseStats = newSpeciesData.baseStats or {
        newSpeciesData.baseHp or 50,
        newSpeciesData.baseAtk or 50,
        newSpeciesData.baseDef or 50,
        newSpeciesData.baseSpatk or 50,
        newSpeciesData.baseSpdef or 50,
        newSpeciesData.baseSpd or 50
    }
    
    -- Store evolution history
    if not pokemon.evolutionHistory then
        pokemon.evolutionHistory = {}
    end
    
    table.insert(pokemon.evolutionHistory, {
        fromSpeciesId = oldSpeciesId,
        fromSpeciesName = oldSpeciesName,
        toSpeciesId = evolutionTarget,
        toSpeciesName = newSpeciesData.name,
        level = pokemon.level,
        timestamp = os.time()
    })
    
    return pokemon, "Evolution successful"
end

-- Check for and trigger level-based evolution
-- @param pokemon: Pokemon data after level up
-- @return: Updated Pokemon data, evolution result
function EvolutionSystem.checkLevelEvolution(pokemon)
    if not pokemon then
        return pokemon, nil
    end
    
    local availableEvolutions = EvolutionSystem.getAvailableEvolutions(pokemon)
    
    -- Look for level-based evolutions that can be triggered
    for _, evolution in ipairs(availableEvolutions) do
        local trigger = evolution.condition.trigger
        
        -- Check if this is a level-based evolution that should auto-trigger
        if trigger == EvolutionTrigger.LEVEL or
           trigger == EvolutionTrigger.LEVEL_ATK_GT_DEF or
           trigger == EvolutionTrigger.LEVEL_ATK_EQ_DEF or
           trigger == EvolutionTrigger.LEVEL_ATK_LT_DEF or
           trigger == EvolutionTrigger.LEVEL_FEMALE or
           trigger == EvolutionTrigger.LEVEL_MALE then
            
            -- Automatically evolve for level-based triggers
            local evolvedPokemon, error = EvolutionSystem.evolveSpecies(pokemon, evolution.toSpeciesId)
            if evolvedPokemon then
                return evolvedPokemon, {
                    evolved = true,
                    fromSpeciesId = pokemon.speciesId,
                    toSpeciesId = evolution.toSpeciesId,
                    trigger = trigger,
                    level = pokemon.level
                }
            end
        end
    end
    
    return pokemon, {evolved = false}
end

-- Get evolution chain for species
-- @param speciesId: Species ID to get chain for
-- @return: Evolution chain data
function EvolutionSystem.getEvolutionChain(speciesId)
    if not speciesId then
        return nil
    end
    
    EvolutionChains.init()
    return EvolutionChains.getFullEvolutionChain(speciesId)
end

-- Check if species can evolve
-- @param speciesId: Species ID to check
-- @return: Boolean indicating if species has available evolutions
function EvolutionSystem.canSpeciesEvolve(speciesId)
    if not speciesId then
        return false
    end
    
    EvolutionChains.init()
    local evolutions = EvolutionChains.getEvolutionsForSpecies(speciesId)
    return evolutions and #evolutions > 0
end

-- Get all Pokemon that can evolve into target species
-- @param targetSpeciesId: Target species ID
-- @return: Array of species IDs that can evolve into target
function EvolutionSystem.getPreEvolutions(targetSpeciesId)
    if not targetSpeciesId then
        return {}
    end
    
    EvolutionChains.init()
    return EvolutionChains.getPreEvolutionsForSpecies(targetSpeciesId)
end

-- Utility functions for evolution validation

-- Validate evolution data integrity
-- @param pokemon: Pokemon data
-- @return: Boolean and error message if invalid
function EvolutionSystem.validateEvolutionData(pokemon)
    if not pokemon then
        return false, "Pokemon data required"
    end
    
    if not pokemon.speciesId or type(pokemon.speciesId) ~= "number" then
        return false, "Valid species ID required"
    end
    
    if not pokemon.level or type(pokemon.level) ~= "number" or pokemon.level < 1 or pokemon.level > 100 then
        return false, "Valid level required (1-100)"
    end
    
    return true
end

-- Get evolution requirements text for display
-- @param evolutionData: Evolution condition data
-- @return: Human-readable evolution requirement text
function EvolutionSystem.getEvolutionRequirementText(evolutionData)
    if not evolutionData then
        return "Unknown requirement"
    end
    
    local trigger = evolutionData.trigger
    
    if trigger == EvolutionTrigger.LEVEL then
        return "Level " .. (evolutionData.level or 0)
        
    elseif trigger == EvolutionTrigger.LEVEL_ATK_GT_DEF then
        return "Level " .. (evolutionData.level or 0) .. " with Attack > Defense"
        
    elseif trigger == EvolutionTrigger.LEVEL_ATK_EQ_DEF then
        return "Level " .. (evolutionData.level or 0) .. " with Attack = Defense"
        
    elseif trigger == EvolutionTrigger.LEVEL_ATK_LT_DEF then
        return "Level " .. (evolutionData.level or 0) .. " with Attack < Defense"
        
    elseif trigger == EvolutionTrigger.LEVEL_FEMALE then
        return "Level " .. (evolutionData.level or 0) .. " (Female only)"
        
    elseif trigger == EvolutionTrigger.LEVEL_MALE then
        return "Level " .. (evolutionData.level or 0) .. " (Male only)"
        
    elseif trigger == EvolutionTrigger.FRIENDSHIP then
        return "High friendship (" .. (evolutionData.friendshipLevel or 220) .. "+)"
        
    elseif trigger == EvolutionTrigger.STONE then
        return "Use " .. (evolutionData.stone or "Evolution Stone")
        
    elseif trigger == EvolutionTrigger.TRADE then
        return "Trade required"
        
    elseif trigger == EvolutionTrigger.LEVEL_MOVE then
        return "Level " .. (evolutionData.level or 0) .. " knowing specific move"
        
    else
        return "Special condition required"
    end
end

-- Evolution statistics and debugging

-- Get evolution statistics for Pokemon
-- @param pokemon: Pokemon data
-- @return: Statistics about evolution status
function EvolutionSystem.getEvolutionStatistics(pokemon)
    if not pokemon then
        return {
            canEvolve = false,
            availableEvolutions = 0,
            evolutionHistory = 0,
            currentStage = 1,
            finalStage = false
        }
    end
    
    local availableEvolutions = EvolutionSystem.getAvailableEvolutions(pokemon)
    local evolutionHistory = pokemon.evolutionHistory or {}
    
    -- Calculate current evolution stage
    local currentStage = #evolutionHistory + 1
    
    -- Check if this is a final evolution
    local canEvolve = EvolutionSystem.canSpeciesEvolve(pokemon.speciesId)
    
    return {
        canEvolve = canEvolve,
        availableEvolutions = #availableEvolutions,
        evolutionHistory = #evolutionHistory,
        currentStage = currentStage,
        finalStage = not canEvolve,
        speciesId = pokemon.speciesId
    }
end

return EvolutionSystem