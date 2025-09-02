-- Field Conditions System
-- Implements global field conditions that alter battle mechanics
-- Includes Trick Room, Wonder Room, Magic Room with proper duration tracking and interactions

local FieldConditions = {}

-- Load dependencies
local BattleRNG = require("game-logic.rng.battle-rng")
local Enums = require("data.constants.enums")

-- Field condition types (matching battle-conditions.lua)
FieldConditions.FieldEffectType = {
    NONE = 0,
    TRICK_ROOM = 1,
    WONDER_ROOM = 2,
    MAGIC_ROOM = 3,
    GRAVITY = 4
}

-- Field condition data with effects and interactions
FieldConditions.FieldEffectData = {
    [FieldConditions.FieldEffectType.TRICK_ROOM] = {
        name = "Trick Room",
        default_duration = 5,
        priority_reversal = true,
        affects_speed_order = true,
        global_effect = true,
        description = "Slower Pokemon move first"
    },
    [FieldConditions.FieldEffectType.WONDER_ROOM] = {
        name = "Wonder Room", 
        default_duration = 5,
        stat_swap = {defense = "special_defense", special_defense = "defense"},
        affects_stats = true,
        global_effect = true,
        description = "Defense and Special Defense stats are swapped"
    },
    [FieldConditions.FieldEffectType.MAGIC_ROOM] = {
        name = "Magic Room",
        default_duration = 5,
        suppresses_items = true,
        global_effect = true,
        description = "Held items have no effect"
    },
    [FieldConditions.FieldEffectType.GRAVITY] = {
        name = "Gravity",
        default_duration = 5,
        grounds_pokemon = true,
        move_restrictions = {"fly", "bounce", "sky_drop", "magnet_rise", "telekinesis"},
        global_effect = true,
        description = "All Pokemon are grounded and certain moves fail"
    }
}

-- Set field condition
-- @param battleId: Battle instance identifier
-- @param fieldEffectType: Field effect type to set
-- @param duration: Duration override (nil for default)
-- @param source: Source of field effect change (move, ability, etc.)
-- @param sourcePokemon: Pokemon that triggered the field effect
-- @return: Boolean indicating success and field effect details
function FieldConditions.setFieldEffect(battleId, fieldEffectType, duration, source, sourcePokemon)
    if not battleId or not fieldEffectType then
        return false, "Invalid parameters for field effect change"
    end
    
    local fieldData = FieldConditions.FieldEffectData[fieldEffectType]
    if not fieldData and fieldEffectType ~= FieldConditions.FieldEffectType.NONE then
        return false, "Unknown field effect type: " .. tostring(fieldEffectType)
    end
    
    local actualDuration = duration
    if not actualDuration and fieldData then
        actualDuration = fieldData.default_duration
    end
    
    local result = {
        success = true,
        field_effect_type = fieldEffectType,
        field_effect_name = fieldData and fieldData.name or "None",
        duration = actualDuration or 0,
        source = source,
        source_pokemon = sourcePokemon,
        timestamp = os.time(),
        global_effect = fieldData and fieldData.global_effect or false
    }
    
    -- Add effect-specific data
    if fieldData then
        if fieldData.priority_reversal then
            result.priority_reversal = true
        end
        if fieldData.stat_swap then
            result.stat_swap = fieldData.stat_swap
        end
        if fieldData.suppresses_items then
            result.suppresses_items = true
        end
        if fieldData.grounds_pokemon then
            result.grounds_pokemon = true
        end
        if fieldData.move_restrictions then
            result.move_restrictions = fieldData.move_restrictions
        end
    end
    
    print("Field effect changed to " .. result.field_effect_name .. " for " .. (actualDuration or "unlimited") .. " turns")
    return true, result
end

-- Process Trick Room speed reversal
-- @param battleId: Battle instance identifier
-- @param pokemonActions: List of Pokemon actions with priorities
-- @param fieldConditions: Current field conditions
-- @return: Modified actions with reversed speed priority
function FieldConditions.processTrickRoomPriority(battleId, pokemonActions, fieldConditions)
    if not fieldConditions or not fieldConditions.trick_room or fieldConditions.trick_room <= 0 then
        return pokemonActions
    end
    
    -- Apply Trick Room speed reversal to actions with same move priority
    local modifiedActions = {}
    
    for _, action in ipairs(pokemonActions) do
        local modifiedAction = {}
        for k, v in pairs(action) do
            modifiedAction[k] = v
        end
        
        -- Mark action as affected by Trick Room for priority calculator
        modifiedAction.trick_room_active = true
        modifiedAction.original_speed = action.effectiveSpeed or 0
        
        table.insert(modifiedActions, modifiedAction)
    end
    
    return modifiedActions
end

-- Process Wonder Room stat swapping
-- @param battleId: Battle instance identifier
-- @param pokemonList: List of Pokemon to apply stat swaps
-- @param fieldConditions: Current field conditions
-- @return: Pokemon list with swapped stats
function FieldConditions.processWonderRoomStats(battleId, pokemonList, fieldConditions)
    if not fieldConditions or not fieldConditions.wonder_room or fieldConditions.wonder_room <= 0 then
        return pokemonList
    end
    
    local modifiedPokemonList = {}
    
    for _, pokemon in ipairs(pokemonList) do
        local modifiedPokemon = {}
        for k, v in pairs(pokemon) do
            modifiedPokemon[k] = v
        end
        
        -- Swap Defense and Special Defense stats
        if pokemon.stats then
            local originalDef = pokemon.stats.defense or pokemon.stats.def or 0
            local originalSpDef = pokemon.stats.special_defense or pokemon.stats.spdef or 0
            
            -- Create modified stats table
            modifiedPokemon.stats = {}
            for statKey, statValue in pairs(pokemon.stats) do
                modifiedPokemon.stats[statKey] = statValue
            end
            
            -- Perform the swap
            modifiedPokemon.stats.defense = originalSpDef
            modifiedPokemon.stats.special_defense = originalDef
            modifiedPokemon.stats.def = originalSpDef
            modifiedPokemon.stats.spdef = originalDef
            
            -- Mark as Wonder Room affected
            modifiedPokemon.wonder_room_active = true
        end
        
        table.insert(modifiedPokemonList, modifiedPokemon)
    end
    
    return modifiedPokemonList
end

-- Process Magic Room item suppression
-- @param battleId: Battle instance identifier
-- @param pokemonList: List of Pokemon to suppress items
-- @param fieldConditions: Current field conditions
-- @return: Pokemon list with suppressed items
function FieldConditions.processMagicRoomItems(battleId, pokemonList, fieldConditions)
    if not fieldConditions or not fieldConditions.magic_room or fieldConditions.magic_room <= 0 then
        return pokemonList
    end
    
    local modifiedPokemonList = {}
    
    for _, pokemon in ipairs(pokemonList) do
        local modifiedPokemon = {}
        for k, v in pairs(pokemon) do
            modifiedPokemon[k] = v
        end
        
        -- Suppress held item effects
        if pokemon.heldItem then
            modifiedPokemon.held_item_suppressed = true
            modifiedPokemon.original_held_item = pokemon.heldItem
            modifiedPokemon.magic_room_active = true
            -- Item is still held but effects are suppressed
        end
        
        table.insert(modifiedPokemonList, modifiedPokemon)
    end
    
    return modifiedPokemonList
end

-- Check if field condition affects move usage
-- @param moveId: Move identifier
-- @param moveName: Move name (for restriction checking)
-- @param fieldConditions: Current field conditions
-- @param pokemon: Pokemon using the move
-- @return: Boolean indicating if move is blocked, reason string
function FieldConditions.doesFieldConditionBlockMove(moveId, moveName, fieldConditions, pokemon)
    if not fieldConditions then
        return false, nil
    end
    
    -- Check Gravity restrictions
    if fieldConditions.gravity and fieldConditions.gravity > 0 then
        local fieldData = FieldConditions.FieldEffectData[FieldConditions.FieldEffectType.GRAVITY]
        if fieldData and fieldData.move_restrictions then
            local lowerMoveName = string.lower(moveName or "")
            for _, restrictedMove in ipairs(fieldData.move_restrictions) do
                if lowerMoveName == restrictedMove then
                    return true, "Move blocked by Gravity"
                end
            end
        end
    end
    
    return false, nil
end

-- Update field condition duration
-- @param fieldConditionType: Type of field condition
-- @param currentDuration: Current duration (-1 for permanent)
-- @return: New duration, boolean indicating if condition should end
function FieldConditions.updateFieldConditionDuration(fieldConditionType, currentDuration)
    if currentDuration == -1 then
        return -1, false -- Permanent conditions don't expire
    end
    
    if currentDuration <= 1 then
        return 0, true -- Condition expires
    end
    
    return currentDuration - 1, false
end

-- Process field condition coexistence and interactions
-- @param currentFieldConditions: Currently active field conditions
-- @param newFieldCondition: New field condition to add
-- @return: Updated field conditions with interaction resolution
function FieldConditions.processFieldConditionInteractions(currentFieldConditions, newFieldCondition)
    if not currentFieldConditions then
        currentFieldConditions = {}
    end
    
    local interactions = {
        conflicts = {},
        coexistence = {},
        replacement = {}
    }
    
    -- Field conditions generally coexist unless they directly conflict
    -- Trick Room, Wonder Room, and Magic Room can all be active simultaneously
    
    -- Check for direct conflicts (same field condition type)
    if newFieldCondition and newFieldCondition.field_effect_type then
        local newType = newFieldCondition.field_effect_type
        
        -- Replace existing condition of same type
        if currentFieldConditions[newType] then
            table.insert(interactions.replacement, {
                type = newType,
                previous = currentFieldConditions[newType],
                new = newFieldCondition,
                reason = "Same field condition type replaces previous"
            })
        else
            table.insert(interactions.coexistence, {
                type = newType,
                new = newFieldCondition,
                reason = "Field condition coexists with existing conditions"
            })
        end
        
        -- Update field conditions
        currentFieldConditions[newType] = newFieldCondition
    end
    
    return currentFieldConditions, interactions
end

-- Get field condition move power modifier
-- @param moveType: Type of the move
-- @param moveData: Move data including name and properties
-- @param fieldConditions: Current field conditions
-- @param pokemon: Pokemon using the move
-- @return: Power multiplier (1.0 = no change)
function FieldConditions.getFieldConditionMovePowerModifier(moveType, moveData, fieldConditions, pokemon)
    -- Field conditions don't directly modify move power
    -- They affect priority, stats, and item usage instead
    return 1.0
end

-- Check if Pokemon's held item is suppressed by field conditions
-- @param pokemon: Pokemon to check
-- @param fieldConditions: Current field conditions
-- @return: Boolean indicating if item is suppressed
function FieldConditions.isHeldItemSuppressed(pokemon, fieldConditions)
    if not pokemon or not fieldConditions then
        return false
    end
    
    -- Magic Room suppresses all held item effects
    if fieldConditions.magic_room and fieldConditions.magic_room > 0 then
        return true
    end
    
    return false
end

-- Apply field condition effects to Pokemon stats during battle calculations
-- @param pokemon: Pokemon to modify
-- @param fieldConditions: Current field conditions
-- @param statCalculationType: Type of stat calculation ("damage", "priority", etc.)
-- @return: Modified Pokemon stats
function FieldConditions.applyFieldConditionStatModifications(pokemon, fieldConditions, statCalculationType)
    if not pokemon or not fieldConditions then
        return pokemon
    end
    
    local modifiedPokemon = {}
    for k, v in pairs(pokemon) do
        modifiedPokemon[k] = v
    end
    
    -- Apply Wonder Room stat swapping for damage calculations
    if fieldConditions.wonder_room and fieldConditions.wonder_room > 0 and 
       (statCalculationType == "damage" or statCalculationType == "all") then
        
        if pokemon.stats then
            modifiedPokemon.stats = {}
            for k, v in pairs(pokemon.stats) do
                modifiedPokemon.stats[k] = v
            end
            
            -- Swap Defense and Special Defense
            local originalDef = pokemon.stats.defense or pokemon.stats.def or 0
            local originalSpDef = pokemon.stats.special_defense or pokemon.stats.spdef or 0
            
            modifiedPokemon.stats.defense = originalSpDef
            modifiedPokemon.stats.special_defense = originalDef
            modifiedPokemon.stats.def = originalSpDef
            modifiedPokemon.stats.spdef = originalDef
        end
    end
    
    return modifiedPokemon
end

-- Remove field condition effects
-- @param fieldConditions: Current field conditions
-- @param conditionTypeToRemove: Specific condition type to remove (nil for all)
-- @param removalSource: Source of removal (move, ability, etc.)
-- @return: Updated field conditions and removal results
function FieldConditions.removeFieldConditions(fieldConditions, conditionTypeToRemove, removalSource)
    if not fieldConditions then
        return {}, {removed = {}, failed = {}}
    end
    
    local results = {
        removed = {},
        failed = {},
        remaining = {}
    }
    
    local updatedConditions = {}
    
    -- Remove specific condition type or all conditions
    for conditionType, conditionData in pairs(fieldConditions) do
        local shouldRemove = false
        
        if conditionTypeToRemove then
            -- Remove specific condition type
            if conditionType == conditionTypeToRemove then
                shouldRemove = true
            end
        else
            -- Remove all removable conditions
            shouldRemove = true
        end
        
        if shouldRemove then
            table.insert(results.removed, {
                type = conditionType,
                name = conditionData.field_effect_name or "Unknown",
                duration_remaining = conditionData.duration or 0,
                removal_source = removalSource
            })
        else
            updatedConditions[conditionType] = conditionData
            table.insert(results.remaining, {
                type = conditionType,
                name = conditionData.field_effect_name or "Unknown"
            })
        end
    end
    
    return updatedConditions, results
end

-- Get active field condition summary
-- @param fieldConditions: Current field conditions
-- @return: Summary of active field conditions
function FieldConditions.getActiveFieldConditionSummary(fieldConditions)
    if not fieldConditions then
        return {
            active_count = 0,
            conditions = {},
            global_effects = {}
        }
    end
    
    local summary = {
        active_count = 0,
        conditions = {},
        global_effects = {
            priority_reversal = false,
            stat_swapping = false,
            item_suppression = false,
            grounding_effect = false
        }
    }
    
    for conditionType, conditionData in pairs(fieldConditions) do
        if conditionData.duration and conditionData.duration > 0 then
            summary.active_count = summary.active_count + 1
            
            table.insert(summary.conditions, {
                type = conditionType,
                name = conditionData.field_effect_name,
                duration = conditionData.duration,
                source = conditionData.source
            })
            
            -- Track global effects
            if conditionData.priority_reversal then
                summary.global_effects.priority_reversal = true
            end
            if conditionData.stat_swap then
                summary.global_effects.stat_swapping = true
            end
            if conditionData.suppresses_items then
                summary.global_effects.item_suppression = true
            end
            if conditionData.grounds_pokemon then
                summary.global_effects.grounding_effect = true
            end
        end
    end
    
    return summary
end

-- Process field condition notifications for battle messages
-- @param fieldConditionChanges: List of field condition changes
-- @param timing: When notifications should be shown
-- @return: Formatted notifications
function FieldConditions.generateFieldConditionNotifications(fieldConditionChanges, timing)
    local notifications = {
        timing = timing or "immediate",
        messages = {},
        condition_count = 0
    }
    
    if not fieldConditionChanges or #fieldConditionChanges == 0 then
        return notifications
    end
    
    for _, change in ipairs(fieldConditionChanges) do
        local message = ""
        
        if change.type == "activation" then
            local effectData = FieldConditions.FieldEffectData[change.field_effect_type]
            if effectData then
                message = effectData.name .. " was activated! " .. effectData.description
            else
                message = "A field condition was activated!"
            end
        elseif change.type == "expiration" then
            message = (change.field_effect_name or "Field condition") .. " wore off!"
        elseif change.type == "removal" then
            message = (change.field_effect_name or "Field condition") .. " was removed!"
        elseif change.type == "replacement" then
            message = (change.field_effect_name or "Field condition") .. " replaced the previous condition!"
        end
        
        if message ~= "" then
            table.insert(notifications.messages, {
                text = message,
                type = change.type,
                field_effect_type = change.field_effect_type,
                priority = "high"
            })
            notifications.condition_count = notifications.condition_count + 1
        end
    end
    
    return notifications
end

-- Check field condition ability interactions
-- @param pokemon: Pokemon with ability
-- @param fieldConditions: Current field conditions
-- @param abilityId: Ability identifier
-- @return: Interaction results
function FieldConditions.checkAbilityFieldConditionInteractions(pokemon, fieldConditions, abilityId)
    local interactions = {
        blocked_conditions = {},
        enhanced_conditions = {},
        ability_effects = {}
    }
    
    if not pokemon or not abilityId or not fieldConditions then
        return interactions
    end
    
    -- Some abilities may interact with field conditions
    -- For now, most field conditions are not blocked by abilities
    -- Future expansion could include abilities that interact with specific field conditions
    
    return interactions
end

return FieldConditions