-- Entry Hazards System
-- Comprehensive implementation of entry hazards (Stealth Rock, Spikes, Toxic Spikes, Sticky Web)
-- Handles hazard setting, layer tracking, damage calculations, and immunity checks
-- Provides deterministic hazard processing with behavioral parity to TypeScript reference

local EntryHazards = {}

-- Load dependencies
local BattleRNG = require("game-logic.rng.battle-rng")

-- Optional dependencies
local TypeChart = nil
local Enums = nil
pcall(function() TypeChart = require("data.constants.type-chart") end)
pcall(function() Enums = require("data.constants.enums") end)

-- Entry hazard type definitions
EntryHazards.HazardType = {
    STEALTH_ROCK = "STEALTH_ROCK",
    SPIKES = "SPIKES", 
    TOXIC_SPIKES = "TOXIC_SPIKES",
    STICKY_WEB = "STICKY_WEB"
}

-- Hazard configuration with exact TypeScript parity
EntryHazards.HazardConfig = {
    [EntryHazards.HazardType.STEALTH_ROCK] = {
        maxLayers = 1,
        baseDamage = 0.125, -- 1/8 max HP
        useTypeEffectiveness = true,
        affectedByFlying = false,
        affectedByLevitate = false,
        stackable = false
    },
    [EntryHazards.HazardType.SPIKES] = {
        maxLayers = 3,
        damagePerLayer = {0.125, 0.1667, 0.25}, -- 1/8, 1/6, 1/4 max HP
        useTypeEffectiveness = false,
        affectedByFlying = true,
        affectedByLevitate = true,
        stackable = true
    },
    [EntryHazards.HazardType.TOXIC_SPIKES] = {
        maxLayers = 2,
        effects = {"poison", "badly_poison"},
        affectedByFlying = true,
        affectedByLevitate = true,
        absorbedByPoison = true,
        immuneSteel = true,
        stackable = true
    },
    [EntryHazards.HazardType.STICKY_WEB] = {
        maxLayers = 1,
        effect = "speed_drop",
        stages = -1,
        affectedByFlying = true,
        affectedByLevitate = true,
        stackable = false
    }
}

-- Initialize entry hazards system
function EntryHazards.init()
    return true, "Entry hazards system initialized"
end

-- Set entry hazard on specified side
-- @param battleState: Current battle state
-- @param hazardType: Type of hazard to set
-- @param targetSide: Side to place hazard on ("player" or "enemy")
-- @return: Hazard setting result
function EntryHazards.setHazard(battleState, hazardType, targetSide)
    if not battleState or not hazardType or not targetSide then
        return {
            success = false,
            error = "Invalid parameters for hazard setting"
        }
    end
    
    -- Initialize battle conditions if needed
    if not battleState.battleConditions then
        battleState.battleConditions = {}
    end
    
    if not battleState.battleConditions.entryHazards then
        battleState.battleConditions.entryHazards = {
            player = {},
            enemy = {}
        }
    end
    
    local hazardSide = battleState.battleConditions.entryHazards[targetSide]
    if not hazardSide then
        hazardSide = {}
        battleState.battleConditions.entryHazards[targetSide] = hazardSide
    end
    
    local config = EntryHazards.HazardConfig[hazardType]
    if not config then
        return {
            success = false,
            error = "Unknown hazard type: " .. tostring(hazardType)
        }
    end
    
    local result = {
        success = true,
        hazardType = hazardType,
        targetSide = targetSide,
        layersAdded = 0,
        messages = {}
    }
    
    if hazardType == EntryHazards.HazardType.STEALTH_ROCK then
        if not hazardSide.stealthRock then
            hazardSide.stealthRock = true
            result.layersAdded = 1
            table.insert(result.messages, "Pointed stones float in the air around " .. targetSide .. "'s team!")
        else
            table.insert(result.messages, "But it failed!")
        end
        
    elseif hazardType == EntryHazards.HazardType.SPIKES then
        local currentLayers = hazardSide.spikes or 0
        if currentLayers < config.maxLayers then
            hazardSide.spikes = currentLayers + 1
            result.layersAdded = 1
            table.insert(result.messages, "Spikes were scattered all around " .. targetSide .. "'s team!")
        else
            table.insert(result.messages, "But it failed!")
        end
        
    elseif hazardType == EntryHazards.HazardType.TOXIC_SPIKES then
        local currentLayers = hazardSide.toxicSpikes or 0
        if currentLayers < config.maxLayers then
            hazardSide.toxicSpikes = currentLayers + 1
            result.layersAdded = 1
            table.insert(result.messages, "Poison spikes were scattered all around " .. targetSide .. "'s team!")
        else
            table.insert(result.messages, "But it failed!")
        end
        
    elseif hazardType == EntryHazards.HazardType.STICKY_WEB then
        if not hazardSide.stickyWeb then
            hazardSide.stickyWeb = true
            result.layersAdded = 1
            table.insert(result.messages, "A sticky web spreads out on the ground around " .. targetSide .. "'s team!")
        else
            table.insert(result.messages, "But it failed!")
        end
    end
    
    -- Record hazard setting in battle events
    table.insert(battleState.battleEvents, {
        type = "hazard_set",
        hazardType = hazardType,
        targetSide = targetSide,
        layersAdded = result.layersAdded,
        turn = battleState.turn,
        timestamp = os.time()
    })
    
    return result
end

-- Process entry hazard effects for switching Pokemon
-- @param battleState: Current battle state
-- @param pokemon: Pokemon switching in
-- @return: Hazard processing result
function EntryHazards.processHazardEffects(battleState, pokemon)
    if not battleState or not pokemon or not pokemon.battleData then
        return {
            success = false,
            error = "Invalid parameters for hazard processing"
        }
    end
    
    local side = pokemon.battleData.side
    local hazards = battleState.battleConditions and 
                   battleState.battleConditions.entryHazards and
                   battleState.battleConditions.entryHazards[side]
    
    if not hazards then
        return {
            success = true,
            pokemon = pokemon.id,
            effects = {},
            messages = {},
            damageTaken = 0
        }
    end
    
    local result = {
        success = true,
        pokemon = pokemon.id,
        effects = {},
        messages = {},
        damageTaken = 0,
        statusChanges = {},
        statChanges = {},
        hazardsRemoved = {}
    }
    
    -- Process hazards in order: Stealth Rock, Spikes, Toxic Spikes, Sticky Web
    local hazardOrder = {
        EntryHazards.HazardType.STEALTH_ROCK,
        EntryHazards.HazardType.SPIKES,
        EntryHazards.HazardType.TOXIC_SPIKES,
        EntryHazards.HazardType.STICKY_WEB
    }
    
    for _, hazardType in ipairs(hazardOrder) do
        if EntryHazards.hasHazard(hazards, hazardType) then
            local hazardResult = EntryHazards.processIndividualHazard(battleState, pokemon, hazardType, hazards)
            
            if hazardResult then
                table.insert(result.effects, hazardResult)
                
                -- Combine messages
                if hazardResult.messages then
                    for _, message in ipairs(hazardResult.messages) do
                        table.insert(result.messages, message)
                    end
                end
                
                -- Accumulate damage
                result.damageTaken = result.damageTaken + (hazardResult.damage or 0)
                
                -- Handle status changes
                if hazardResult.statusChange then
                    table.insert(result.statusChanges, hazardResult.statusChange)
                end
                
                -- Handle stat changes
                if hazardResult.statChanges then
                    for stat, change in pairs(hazardResult.statChanges) do
                        result.statChanges[stat] = (result.statChanges[stat] or 0) + change
                    end
                end
                
                -- Handle hazard removal (Poison types absorbing Toxic Spikes)
                if hazardResult.hazardRemoved then
                    table.insert(result.hazardsRemoved, hazardResult.hazardRemoved)
                end
                
                -- Stop processing if Pokemon fainted
                if pokemon.currentHP <= 0 then
                    pokemon.fainted = true
                    table.insert(result.messages, pokemon.name .. " fainted!")
                    break
                end
            end
        end
    end
    
    -- Record hazard effects in battle events
    if #result.effects > 0 then
        table.insert(battleState.battleEvents, {
            type = "entry_hazards",
            pokemon = pokemon.id,
            side = side,
            effects = result.effects,
            damage = result.damageTaken,
            turn = battleState.turn,
            timestamp = os.time()
        })
    end
    
    return result
end

-- Process individual hazard effect
-- @param battleState: Current battle state
-- @param pokemon: Pokemon being affected
-- @param hazardType: Type of hazard
-- @param hazards: Hazard data for Pokemon's side
-- @return: Individual hazard processing result
function EntryHazards.processIndividualHazard(battleState, pokemon, hazardType, hazards)
    local config = EntryHazards.HazardConfig[hazardType]
    if not config then
        return nil
    end
    
    local result = {
        hazardType = hazardType,
        pokemon = pokemon.id,
        messages = {},
        damage = 0
    }
    
    -- Check immunity
    local immunity = EntryHazards.checkHazardImmunity(pokemon, hazardType, config)
    if immunity.immune then
        if immunity.messages then
            result.messages = immunity.messages
        end
        return result
    end
    
    if hazardType == EntryHazards.HazardType.STEALTH_ROCK then
        return EntryHazards.processStealthRock(battleState, pokemon, result)
        
    elseif hazardType == EntryHazards.HazardType.SPIKES then
        local layers = hazards.spikes or 0
        return EntryHazards.processSpikes(battleState, pokemon, result, layers)
        
    elseif hazardType == EntryHazards.HazardType.TOXIC_SPIKES then
        local layers = hazards.toxicSpikes or 0
        return EntryHazards.processToxicSpikes(battleState, pokemon, result, layers, hazards)
        
    elseif hazardType == EntryHazards.HazardType.STICKY_WEB then
        return EntryHazards.processStickyWeb(battleState, pokemon, result)
    end
    
    return nil
end

-- Process Stealth Rock damage
-- @param battleState: Current battle state
-- @param pokemon: Pokemon being damaged
-- @param result: Result object to update
-- @return: Updated result
function EntryHazards.processStealthRock(battleState, pokemon, result)
    local baseDamage = pokemon.maxHP * 0.125 -- 1/8 max HP
    local typeEffectiveness = EntryHazards.calculateStealthRockEffectiveness(pokemon)
    
    local finalDamage = math.max(1, math.floor(baseDamage * typeEffectiveness))
    
    pokemon.currentHP = math.max(0, pokemon.currentHP - finalDamage)
    result.damage = finalDamage
    
    table.insert(result.messages, "Pointed stones dug into " .. pokemon.name .. "!")
    
    return result
end

-- Process Spikes damage
-- @param battleState: Current battle state
-- @param pokemon: Pokemon being damaged
-- @param result: Result object to update
-- @param layers: Number of Spikes layers
-- @return: Updated result
function EntryHazards.processSpikes(battleState, pokemon, result, layers)
    local config = EntryHazards.HazardConfig[EntryHazards.HazardType.SPIKES]
    local damagePercent = config.damagePerLayer[layers] or config.damagePerLayer[3]
    
    local damage = math.max(1, math.floor(pokemon.maxHP * damagePercent))
    
    pokemon.currentHP = math.max(0, pokemon.currentHP - damage)
    result.damage = damage
    
    table.insert(result.messages, pokemon.name .. " was hurt by the spikes!")
    
    return result
end

-- Process Toxic Spikes status effect
-- @param battleState: Current battle state
-- @param pokemon: Pokemon being affected
-- @param result: Result object to update
-- @param layers: Number of Toxic Spikes layers
-- @param hazards: Hazard data for removal
-- @return: Updated result
function EntryHazards.processToxicSpikes(battleState, pokemon, result, layers, hazards)
    -- Check if Poison type absorbs Toxic Spikes
    if EntryHazards.isPoisonType(pokemon) then
        -- Remove one layer of Toxic Spikes
        hazards.toxicSpikes = math.max(0, hazards.toxicSpikes - 1)
        result.hazardRemoved = {type = EntryHazards.HazardType.TOXIC_SPIKES, layers = 1}
        table.insert(result.messages, pokemon.name .. " absorbed the Toxic Spikes!")
        return result
    end
    
    -- Apply poison status if not already statused
    if not pokemon.status then
        local poisonType = layers >= 2 and "badly_poison" or "poison"
        pokemon.status = poisonType
        
        -- Set badly poison counter for escalating damage
        if poisonType == "badly_poison" then
            pokemon.statusTurns = 1
        end
        
        result.statusChange = {
            status = poisonType,
            applied = true
        }
        
        local poisonMessage = poisonType == "badly_poison" and "badly poisoned" or "poisoned"
        table.insert(result.messages, pokemon.name .. " was " .. poisonMessage .. "!")
    end
    
    return result
end

-- Process Sticky Web speed reduction
-- @param battleState: Current battle state
-- @param pokemon: Pokemon being affected
-- @param result: Result object to update
-- @return: Updated result
function EntryHazards.processStickyWeb(battleState, pokemon, result)
    if not pokemon.battleData.statStages then
        pokemon.battleData.statStages = {
            atk = 0, def = 0, spa = 0, spd = 0, spe = 0, acc = 0, eva = 0
        }
    end
    
    -- Lower speed by 1 stage (minimum -6)
    local currentSpeed = pokemon.battleData.statStages.spe or 0
    local newSpeed = math.max(-6, currentSpeed - 1)
    pokemon.battleData.statStages.spe = newSpeed
    
    result.statChanges = {spe = -1}
    table.insert(result.messages, pokemon.name .. " was caught in a Sticky Web!")
    
    return result
end

-- Calculate Stealth Rock type effectiveness
-- @param pokemon: Pokemon to calculate effectiveness for
-- @return: Type effectiveness multiplier (0.25x to 4x)
function EntryHazards.calculateStealthRockEffectiveness(pokemon)
    local effectiveness = 1.0
    
    if not TypeChart or not Enums or not pokemon.species then
        return effectiveness
    end
    
    -- Get Pokemon's types
    local primaryType = pokemon.species.type1
    local secondaryType = pokemon.species.type2
    
    -- Calculate effectiveness against Rock-type moves
    if primaryType and TypeChart.getTypeDamageMultiplier then
        local primaryEff = TypeChart.getTypeDamageMultiplier(Enums.PokemonType.ROCK, primaryType)
        effectiveness = effectiveness * primaryEff
    end
    
    if secondaryType and TypeChart.getTypeDamageMultiplier then
        local secondaryEff = TypeChart.getTypeDamageMultiplier(Enums.PokemonType.ROCK, secondaryType)
        effectiveness = effectiveness * secondaryEff
    end
    
    return effectiveness
end

-- Check entry hazard immunity for a Pokemon
-- @param pokemon: Pokemon to check
-- @param hazardType: Type of hazard
-- @param config: Hazard configuration
-- @return: Immunity check result
function EntryHazards.checkHazardImmunity(pokemon, hazardType, config)
    local result = {immune = false, messages = {}}
    
    if not Enums then
        return result
    end
    
    -- Magic Guard ability prevents all entry hazard damage
    if pokemon.ability == Enums.AbilityId.MAGIC_GUARD then
        result.immune = true
        if hazardType ~= EntryHazards.HazardType.STICKY_WEB then
            table.insert(result.messages, pokemon.name .. "'s Magic Guard prevents damage!")
        end
        return result
    end
    
    -- Ground-based hazard immunity (only for hazards affected by Flying/Levitate)
    if config.affectedByFlying and EntryHazards.hasType(pokemon, Enums.PokemonType.FLYING) then
        result.immune = true
        return result
    end
    
    if config.affectedByLevitate and pokemon.ability == Enums.AbilityId.LEVITATE then
        result.immune = true
        return result
    end
    
    -- Air Balloon item immunity (affects same hazards as Levitate)
    if config.affectedByLevitate and pokemon.item == Enums.ItemId.AIR_BALLOON then
        result.immune = true
        table.insert(result.messages, pokemon.name .. " floats in the air with its Air Balloon!")
        return result
    end
    
    -- Toxic Spikes specific immunities
    if hazardType == EntryHazards.HazardType.TOXIC_SPIKES then
        -- Steel type immunity
        if EntryHazards.hasType(pokemon, Enums.PokemonType.STEEL) then
            result.immune = true
            return result
        end
    end
    
    return result
end

-- Remove entry hazards from specified side
-- @param battleState: Current battle state
-- @param side: Side to remove hazards from
-- @param hazardTypes: Array of hazard types to remove (optional, removes all if nil)
-- @return: Removal result
function EntryHazards.removeHazards(battleState, side, hazardTypes)
    if not battleState or not side then
        return {
            success = false,
            error = "Invalid parameters for hazard removal"
        }
    end
    
    local hazards = battleState.battleConditions and 
                   battleState.battleConditions.entryHazards and
                   battleState.battleConditions.entryHazards[side]
    
    if not hazards then
        return {
            success = true,
            removed = {},
            messages = {}
        }
    end
    
    local result = {
        success = true,
        removed = {},
        messages = {}
    }
    
    -- If no specific hazards specified, remove all
    if not hazardTypes then
        hazardTypes = {
            EntryHazards.HazardType.STEALTH_ROCK,
            EntryHazards.HazardType.SPIKES,
            EntryHazards.HazardType.TOXIC_SPIKES,
            EntryHazards.HazardType.STICKY_WEB
        }
    end
    
    for _, hazardType in ipairs(hazardTypes) do
        local removed = false
        
        if hazardType == EntryHazards.HazardType.STEALTH_ROCK and hazards.stealthRock then
            hazards.stealthRock = false
            removed = true
            
        elseif hazardType == EntryHazards.HazardType.SPIKES and (hazards.spikes or 0) > 0 then
            hazards.spikes = 0
            removed = true
            
        elseif hazardType == EntryHazards.HazardType.TOXIC_SPIKES and (hazards.toxicSpikes or 0) > 0 then
            hazards.toxicSpikes = 0
            removed = true
            
        elseif hazardType == EntryHazards.HazardType.STICKY_WEB and hazards.stickyWeb then
            hazards.stickyWeb = false
            removed = true
        end
        
        if removed then
            table.insert(result.removed, hazardType)
        end
    end
    
    -- Generate messages for removed hazards
    if #result.removed > 0 then
        table.insert(result.messages, "Entry hazards were removed from " .. side .. "'s side of the field!")
    end
    
    -- Record hazard removal in battle events
    if #result.removed > 0 then
        table.insert(battleState.battleEvents, {
            type = "hazards_removed",
            side = side,
            removed = result.removed,
            turn = battleState.turn,
            timestamp = os.time()
        })
    end
    
    return result
end

-- Check if a side has a specific hazard
-- @param hazards: Hazard data for a side
-- @param hazardType: Hazard type to check
-- @return: True if hazard exists
function EntryHazards.hasHazard(hazards, hazardType)
    if not hazards then
        return false
    end
    
    if hazardType == EntryHazards.HazardType.STEALTH_ROCK then
        return hazards.stealthRock == true
        
    elseif hazardType == EntryHazards.HazardType.SPIKES then
        return (hazards.spikes or 0) > 0
        
    elseif hazardType == EntryHazards.HazardType.TOXIC_SPIKES then
        return (hazards.toxicSpikes or 0) > 0
        
    elseif hazardType == EntryHazards.HazardType.STICKY_WEB then
        return hazards.stickyWeb == true
    end
    
    return false
end

-- Get hazard layer count
-- @param hazards: Hazard data for a side
-- @param hazardType: Hazard type to check
-- @return: Number of layers (0 if none)
function EntryHazards.getHazardLayers(hazards, hazardType)
    if not hazards then
        return 0
    end
    
    if hazardType == EntryHazards.HazardType.STEALTH_ROCK then
        return hazards.stealthRock and 1 or 0
        
    elseif hazardType == EntryHazards.HazardType.SPIKES then
        return hazards.spikes or 0
        
    elseif hazardType == EntryHazards.HazardType.TOXIC_SPIKES then
        return hazards.toxicSpikes or 0
        
    elseif hazardType == EntryHazards.HazardType.STICKY_WEB then
        return hazards.stickyWeb and 1 or 0
    end
    
    return 0
end

-- Helper functions for type and ability checks

-- Check if Pokemon has specific type
-- @param pokemon: Pokemon to check
-- @param typeId: Type ID to check for
-- @return: True if Pokemon has the type
function EntryHazards.hasType(pokemon, typeId)
    if not pokemon or not pokemon.species or not typeId then
        return false
    end
    
    return pokemon.species.type1 == typeId or pokemon.species.type2 == typeId
end

-- Check if Pokemon is Poison type
-- @param pokemon: Pokemon to check
-- @return: True if Pokemon is Poison type
function EntryHazards.isPoisonType(pokemon)
    if not Enums or not Enums.PokemonType then
        return false
    end
    return EntryHazards.hasType(pokemon, Enums.PokemonType.POISON)
end

return EntryHazards