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
local ItemDatabase = require("data.items.item-database")
local TimeSystem = require("game-logic.environment.time-system")
local LocationSystem = require("game-logic.environment.location-system")

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
        
    elseif trigger == EvolutionTrigger.FRIENDSHIP_DAY then
        -- Friendship evolution that requires day time
        local friendship = pokemon.friendship or 0
        local requiredFriendship = evolutionData.friendshipLevel or 220
        return friendship >= requiredFriendship and TimeSystem.isDayTime()
        
    elseif trigger == EvolutionTrigger.FRIENDSHIP_NIGHT then
        -- Friendship evolution that requires night time
        local friendship = pokemon.friendship or 0
        local requiredFriendship = evolutionData.friendshipLevel or 220
        return friendship >= requiredFriendship and TimeSystem.isNightTime()
        
    elseif trigger == EvolutionTrigger.STONE then
        -- Stone evolution requires specific stone item
        local requiredStone = evolutionData.stone or evolutionData.item
        if requiredStone then
            -- Check if Pokemon has access to the required stone
            -- This would be validated during stone usage, not level-up
            return ItemDatabase.canSpeciesUseEvolutionItem(pokemon.speciesId, requiredStone)
        end
        return false
        
    elseif trigger == EvolutionTrigger.TRADE then
        -- Trade evolution - check if trade condition is met
        -- In single-player, this requires Linking Cord or specific context
        return evolutionData.linkingCordUsed or false
        
    elseif trigger == EvolutionTrigger.ITEM then
        -- Item evolution - check held item requirement
        local requiredItem = evolutionData.item or evolutionData.heldItem
        if requiredItem and pokemon.heldItem then
            return pokemon.heldItem == requiredItem
        end
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
        
    elseif trigger == EvolutionTrigger.TRADE_ITEM then
        -- Trade with held item requirement
        local requiredItem = evolutionData.item or evolutionData.heldItem
        local hasItem = requiredItem and pokemon.heldItem == requiredItem
        local tradeCondition = evolutionData.linkingCordUsed or false
        return hasItem and tradeCondition
        
    elseif trigger == EvolutionTrigger.OTHER_POKEMON then
        -- Evolution requiring specific Pokemon in party
        -- This would need party data to validate
        return false -- Placeholder for future implementation
        
    elseif trigger == EvolutionTrigger.SPECIAL then
        -- Special evolution conditions (biome, weather, etc.)
        local conditionMet = true
        
        -- Check biome requirement
        if evolutionData.biomes then
            conditionMet = conditionMet and LocationSystem.checkBiomeCondition(evolutionData.biomes)
        end
        
        -- Check time requirement
        if evolutionData.timeOfDay then
            conditionMet = conditionMet and TimeSystem.checkTimeCondition(evolutionData.timeOfDay)
        end
        
        -- Check special location requirement
        if evolutionData.specialLocation then
            conditionMet = conditionMet and LocationSystem.checkSpecialLocationCondition(evolutionData.specialLocation)
        end
        
        return conditionMet
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
        timestamp = 0
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

-- Stone evolution processing functions

-- Process stone evolution for Pokemon
-- @param pokemon: Pokemon data to evolve
-- @param stoneItemId: Evolution stone item ID being used
-- @return: Updated Pokemon data and evolution result or error
function EvolutionSystem.processStoneEvolution(pokemon, stoneItemId)
    if not pokemon or not stoneItemId then
        return nil, "Missing parameters for stone evolution"
    end
    
    -- Validate stone compatibility
    if not ItemDatabase.canSpeciesUseEvolutionItem(pokemon.speciesId, stoneItemId) then
        return nil, "Stone is not compatible with this Pokemon species"
    end
    
    -- Get available evolutions and find stone-triggered ones
    local availableEvolutions = EvolutionSystem.getAvailableEvolutions(pokemon)
    
    for _, evolution in ipairs(availableEvolutions) do
        if evolution.condition.trigger == EvolutionTrigger.STONE then
            local requiredStone = evolution.condition.stone or evolution.condition.item
            
            if requiredStone == stoneItemId then
                -- Process the evolution
                local evolvedPokemon, error = EvolutionSystem.evolveSpecies(pokemon, evolution.toSpeciesId)
                if evolvedPokemon then
                    return evolvedPokemon, {
                        evolved = true,
                        fromSpeciesId = pokemon.speciesId,
                        toSpeciesId = evolution.toSpeciesId,
                        trigger = EvolutionTrigger.STONE,
                        stoneUsed = stoneItemId,
                        level = pokemon.level
                    }
                else
                    return nil, error
                end
            end
        end
    end
    
    return nil, "No stone evolution available for this Pokemon with the given stone"
end

-- Check which stones can be used on Pokemon
-- @param pokemon: Pokemon data
-- @return: Array of stone item IDs that can evolve this Pokemon
function EvolutionSystem.getCompatibleStones(pokemon)
    if not pokemon then
        return {}
    end
    
    local compatibleStones = {}
    local availableEvolutions = EvolutionSystem.getAvailableEvolutions(pokemon)
    
    for _, evolution in ipairs(availableEvolutions) do
        if evolution.condition.trigger == EvolutionTrigger.STONE then
            local requiredStone = evolution.condition.stone or evolution.condition.item
            if requiredStone then
                table.insert(compatibleStones, {
                    stoneId = requiredStone,
                    evolvesTo = evolution.toSpeciesId,
                    available = true
                })
            end
        end
    end
    
    return compatibleStones
end

-- Validate stone usage before processing
-- @param pokemon: Pokemon data
-- @param stoneItemId: Stone item ID to validate
-- @return: Boolean indicating if stone can be used, and error message if not
function EvolutionSystem.validateStoneUsage(pokemon, stoneItemId)
    if not pokemon then
        return false, "Pokemon data required"
    end
    
    if not stoneItemId then
        return false, "Stone item ID required"
    end
    
    -- Check if stone exists
    local stoneData = ItemDatabase.getEvolutionItem(stoneItemId)
    if not stoneData then
        return false, "Stone item not found"
    end
    
    -- Check if it's actually an evolution stone
    if not ItemDatabase.isEvolutionStone(stoneItemId) then
        return false, "Item is not an evolution stone"
    end
    
    -- Check species compatibility
    if not ItemDatabase.canSpeciesUseEvolutionItem(pokemon.speciesId, stoneItemId) then
        return false, "Stone is not compatible with this Pokemon species"
    end
    
    -- Check if Pokemon has any stone evolutions available
    local compatibleStones = EvolutionSystem.getCompatibleStones(pokemon)
    for _, stone in ipairs(compatibleStones) do
        if stone.stoneId == stoneItemId then
            return true
        end
    end
    
    return false, "Pokemon cannot evolve using this stone at this time"
end

-- Trade evolution processing functions

-- Process trade evolution for Pokemon
-- @param pokemon: Pokemon data to evolve
-- @param linkingCordUsed: Boolean indicating if Linking Cord was used (for single-player)
-- @param tradePartnerSpecies: Optional species ID of Pokemon being traded for (some evolutions require specific trade)
-- @return: Updated Pokemon data and evolution result or error
function EvolutionSystem.processTradeEvolution(pokemon, linkingCordUsed, tradePartnerSpecies)
    if not pokemon then
        return nil, "Missing Pokemon data for trade evolution"
    end
    
    -- For single-player mode, require Linking Cord for trade evolutions
    if not linkingCordUsed then
        return nil, "Linking Cord required for trade evolution in single-player mode"
    end
    
    -- Get available evolutions and find trade-triggered ones
    local availableEvolutions = EvolutionSystem.getAvailableEvolutions(pokemon)
    
    for _, evolution in ipairs(availableEvolutions) do
        local trigger = evolution.condition.trigger
        
        if trigger == EvolutionTrigger.TRADE then
            -- Set linking cord flag for condition checking
            evolution.condition.linkingCordUsed = linkingCordUsed
            
            -- Check if evolution condition is now met
            if EvolutionSystem.checkEvolutionCondition(pokemon, evolution.condition) then
                -- Process the evolution
                local evolvedPokemon, error = EvolutionSystem.evolveSpecies(pokemon, evolution.toSpeciesId)
                if evolvedPokemon then
                    return evolvedPokemon, {
                        evolved = true,
                        fromSpeciesId = pokemon.speciesId,
                        toSpeciesId = evolution.toSpeciesId,
                        trigger = EvolutionTrigger.TRADE,
                        linkingCordUsed = true,
                        level = pokemon.level
                    }
                else
                    return nil, error
                end
            end
            
        elseif trigger == EvolutionTrigger.TRADE_ITEM then
            -- Trade with held item - check if Pokemon has required held item
            local requiredItem = evolution.condition.item or evolution.condition.heldItem
            if pokemon.heldItem == requiredItem then
                -- Set linking cord flag for condition checking
                evolution.condition.linkingCordUsed = linkingCordUsed
                
                if EvolutionSystem.checkEvolutionCondition(pokemon, evolution.condition) then
                    -- Process the evolution
                    local evolvedPokemon, error = EvolutionSystem.evolveSpecies(pokemon, evolution.toSpeciesId)
                    if evolvedPokemon then
                        -- Remove held item after evolution
                        evolvedPokemon.heldItem = nil
                        
                        return evolvedPokemon, {
                            evolved = true,
                            fromSpeciesId = pokemon.speciesId,
                            toSpeciesId = evolution.toSpeciesId,
                            trigger = EvolutionTrigger.TRADE_ITEM,
                            linkingCordUsed = true,
                            heldItemUsed = requiredItem,
                            level = pokemon.level
                        }
                    else
                        return nil, error
                    end
                end
            end
        end
    end
    
    return nil, "No trade evolution available for this Pokemon"
end

-- Check which Pokemon can evolve via trade
-- @param pokemon: Pokemon data
-- @return: Array of trade evolution options
function EvolutionSystem.getTradeEvolutionOptions(pokemon)
    if not pokemon then
        return {}
    end
    
    local tradeOptions = {}
    local availableEvolutions = EvolutionSystem.getAvailableEvolutions(pokemon)
    
    for _, evolution in ipairs(availableEvolutions) do
        local trigger = evolution.condition.trigger
        
        if trigger == EvolutionTrigger.TRADE then
            table.insert(tradeOptions, {
                evolvesTo = evolution.toSpeciesId,
                trigger = EvolutionTrigger.TRADE,
                requiresItem = false,
                requiresLinkingCord = true
            })
            
        elseif trigger == EvolutionTrigger.TRADE_ITEM then
            local requiredItem = evolution.condition.item or evolution.condition.heldItem
            table.insert(tradeOptions, {
                evolvesTo = evolution.toSpeciesId,
                trigger = EvolutionTrigger.TRADE_ITEM,
                requiresItem = requiredItem,
                requiresLinkingCord = true,
                hasRequiredItem = pokemon.heldItem == requiredItem
            })
        end
    end
    
    return tradeOptions
end

-- Validate trade evolution conditions
-- @param pokemon: Pokemon data
-- @param linkingCordUsed: Whether Linking Cord is being used
-- @return: Boolean indicating if trade evolution is possible, and error message if not
function EvolutionSystem.validateTradeEvolution(pokemon, linkingCordUsed)
    if not pokemon then
        return false, "Pokemon data required"
    end
    
    if not linkingCordUsed then
        return false, "Linking Cord required for trade evolution in single-player mode"
    end
    
    -- Check if Pokemon has any trade evolutions available
    local tradeOptions = EvolutionSystem.getTradeEvolutionOptions(pokemon)
    if #tradeOptions == 0 then
        return false, "Pokemon cannot evolve via trade"
    end
    
    -- Check if any trade evolution conditions can be met
    for _, option in ipairs(tradeOptions) do
        if option.trigger == EvolutionTrigger.TRADE then
            return true -- Simple trade evolution always possible with Linking Cord
        elseif option.trigger == EvolutionTrigger.TRADE_ITEM then
            if option.hasRequiredItem then
                return true -- Trade with held item is possible
            end
        end
    end
    
    return false, "Required conditions for trade evolution not met"
end

-- Get trade evolution requirements text
-- @param pokemon: Pokemon data
-- @return: Human-readable text describing trade evolution requirements
function EvolutionSystem.getTradeEvolutionRequirementsText(pokemon)
    if not pokemon then
        return "Pokemon data required"
    end
    
    local tradeOptions = EvolutionSystem.getTradeEvolutionOptions(pokemon)
    if #tradeOptions == 0 then
        return "Pokemon cannot evolve via trade"
    end
    
    local requirements = {}
    
    for _, option in ipairs(tradeOptions) do
        if option.trigger == EvolutionTrigger.TRADE then
            table.insert(requirements, "Trade (or use Linking Cord)")
        elseif option.trigger == EvolutionTrigger.TRADE_ITEM then
            local itemData = ItemDatabase.getEvolutionItem(option.requiresItem)
            local itemName = itemData and itemData.name or "Unknown Item"
            local status = option.hasRequiredItem and " (held)" or " (needed)"
            table.insert(requirements, "Trade while holding " .. itemName .. status .. " (or use Linking Cord)")
        end
    end
    
    return table.concat(requirements, " OR ")
end

-- Evolution cancellation and user choice system

-- Evolution cancellation options
local EvolutionPreference = {
    ALWAYS_EVOLVE = "always_evolve",
    NEVER_EVOLVE = "never_evolve", 
    CONDITIONAL = "conditional",
    ASK_EVERY_TIME = "ask_every_time"
}

-- Check if evolution should be cancelled based on user/agent preferences
-- @param pokemon: Pokemon data
-- @param evolutionResult: Pending evolution result
-- @param userPreferences: User/agent evolution preferences
-- @return: Boolean indicating if evolution should be cancelled, and reason
function EvolutionSystem.checkEvolutionCancellation(pokemon, evolutionResult, userPreferences)
    if not pokemon or not evolutionResult then
        return false, "Invalid evolution data"
    end
    
    -- Default to always evolve if no preferences set
    if not userPreferences then
        return false, "No user preferences - proceeding with evolution"
    end
    
    local preference = userPreferences.general or EvolutionPreference.ALWAYS_EVOLVE
    
    -- Check species-specific preferences first
    if userPreferences.species and userPreferences.species[pokemon.speciesId] then
        preference = userPreferences.species[pokemon.speciesId]
    end
    
    -- Apply preference
    if preference == EvolutionPreference.NEVER_EVOLVE then
        return true, "Evolution disabled by user preference"
        
    elseif preference == EvolutionPreference.ALWAYS_EVOLVE then
        return false, "Evolution allowed by user preference"
        
    elseif preference == EvolutionPreference.CONDITIONAL then
        -- Check conditional requirements
        return EvolutionSystem.checkConditionalEvolutionRequirements(pokemon, evolutionResult, userPreferences.conditions)
        
    elseif preference == EvolutionPreference.ASK_EVERY_TIME then
        -- This would require external user input in a real scenario
        -- For autonomous agents, default to evolve
        return false, "User input required - defaulting to evolve"
    end
    
    return false, "Default behavior - proceeding with evolution"
end

-- Check conditional evolution requirements
-- @param pokemon: Pokemon data
-- @param evolutionResult: Pending evolution result
-- @param conditions: Conditional requirements
-- @return: Boolean indicating if evolution should be cancelled, and reason
function EvolutionSystem.checkConditionalEvolutionRequirements(pokemon, evolutionResult, conditions)
    if not conditions then
        return false, "No conditional requirements"
    end
    
    -- Check minimum level requirement
    if conditions.minLevel and pokemon.level < conditions.minLevel then
        return true, "Pokemon level below minimum requirement for evolution"
    end
    
    -- Check maximum level requirement (prevent evolution after certain level)
    if conditions.maxLevel and pokemon.level > conditions.maxLevel then
        return true, "Pokemon level above maximum for evolution"
    end
    
    -- Check required moves (prevent evolution if Pokemon would lose important moves)
    if conditions.requiredMoves and pokemon.moves then
        for _, requiredMove in ipairs(conditions.requiredMoves) do
            local hasMove = false
            for _, pokemonMove in ipairs(pokemon.moves) do
                if pokemonMove.id == requiredMove or pokemonMove.moveId == requiredMove then
                    hasMove = true
                    break
                end
            end
            if not hasMove then
                return true, "Pokemon missing required move for conditional evolution"
            end
        end
    end
    
    -- Check friendship requirement
    if conditions.minFriendship and (pokemon.friendship or 0) < conditions.minFriendship then
        return true, "Pokemon friendship below minimum requirement"
    end
    
    return false, "Conditional requirements met"
end

-- Process evolution with cancellation check
-- @param pokemon: Pokemon data to potentially evolve
-- @param evolutionResult: Pending evolution result from checkLevelEvolution
-- @param userPreferences: User/agent evolution preferences
-- @return: Final Pokemon data and evolution result
function EvolutionSystem.processEvolutionWithCancellation(pokemon, evolutionResult, userPreferences)
    if not pokemon then
        return pokemon, {evolved = false, reason = "Invalid Pokemon data"}
    end
    
    -- If no evolution is pending, return unchanged
    if not evolutionResult or not evolutionResult.evolved then
        return pokemon, evolutionResult or {evolved = false}
    end
    
    -- Check if evolution should be cancelled
    local shouldCancel, cancelReason = EvolutionSystem.checkEvolutionCancellation(pokemon, evolutionResult, userPreferences)
    
    if shouldCancel then
        -- Cancel evolution - keep Pokemon in current form
        return pokemon, {
            evolved = false,
            cancelled = true,
            reason = cancelReason,
            wouldHaveEvolved = evolutionResult.toSpeciesId,
            trigger = evolutionResult.trigger,
            level = pokemon.level
        }
    end
    
    -- Proceed with evolution
    local evolvedPokemon, error = EvolutionSystem.evolveSpecies(pokemon, evolutionResult.toSpeciesId)
    if evolvedPokemon then
        return evolvedPokemon, evolutionResult
    else
        return pokemon, {evolved = false, error = error}
    end
end

-- Create default evolution preferences for autonomous agents
-- @param agentType: Type of agent ("always", "never", "smart", "manual")
-- @return: Evolution preferences configuration
function EvolutionSystem.createAgentEvolutionPreferences(agentType)
    if agentType == "always" then
        return {
            general = EvolutionPreference.ALWAYS_EVOLVE,
            species = {},
            conditions = {}
        }
        
    elseif agentType == "never" then
        return {
            general = EvolutionPreference.NEVER_EVOLVE,
            species = {},
            conditions = {}
        }
        
    elseif agentType == "smart" then
        return {
            general = EvolutionPreference.CONDITIONAL,
            species = {},
            conditions = {
                minLevel = 1,
                maxLevel = 100,
                minFriendship = 0,
                requiredMoves = {} -- Could be populated with important moves
            }
        }
        
    elseif agentType == "manual" then
        return {
            general = EvolutionPreference.ASK_EVERY_TIME,
            species = {},
            conditions = {}
        }
        
    else
        -- Default to always evolve
        return {
            general = EvolutionPreference.ALWAYS_EVOLVE,
            species = {},
            conditions = {}
        }
    end
end

-- Set species-specific evolution preference
-- @param preferences: Evolution preferences object
-- @param speciesId: Species ID to set preference for
-- @param preference: Evolution preference for this species
-- @return: Updated preferences
function EvolutionSystem.setSpeciesEvolutionPreference(preferences, speciesId, preference)
    if not preferences then
        preferences = EvolutionSystem.createAgentEvolutionPreferences("always")
    end
    
    if not preferences.species then
        preferences.species = {}
    end
    
    preferences.species[speciesId] = preference
    return preferences
end

-- Get evolution choice options for user/agent decision
-- @param pokemon: Pokemon data
-- @param evolutionResult: Pending evolution result
-- @return: Array of evolution choice options
function EvolutionSystem.getEvolutionChoiceOptions(pokemon, evolutionResult)
    if not pokemon or not evolutionResult or not evolutionResult.evolved then
        return {}
    end
    
    local options = {
        {
            choice = "evolve",
            description = "Allow evolution to " .. (evolutionResult.toSpeciesName or "evolved form"),
            action = "proceed"
        },
        {
            choice = "cancel",
            description = "Cancel evolution (press B equivalent)",
            action = "cancel"
        }
    }
    
    -- Add option to set future preference
    table.insert(options, {
        choice = "always_evolve",
        description = "Allow this evolution and always evolve this species in future",
        action = "set_preference",
        preference = EvolutionPreference.ALWAYS_EVOLVE
    })
    
    table.insert(options, {
        choice = "never_evolve",
        description = "Cancel this evolution and never evolve this species",
        action = "set_preference", 
        preference = EvolutionPreference.NEVER_EVOLVE
    })
    
    return options
end

-- Export constants
EvolutionSystem.EvolutionPreference = EvolutionPreference

return EvolutionSystem