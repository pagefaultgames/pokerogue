-- Pokemon Status Immunities System
-- Implements type-based and ability-based status immunities
-- Validates status prevention and immunity checking
-- Integrates with species database and Pokemon creation system

local StatusImmunities = {}

-- Load dependencies
local StatusEffects = require("game-logic.pokemon.status-effects")
local Enums = require("data.constants.enums")

-- Type-based status immunities
StatusImmunities.TypeImmunities = {
    [Enums.Type.ELECTRIC] = {
        StatusEffects.StatusType.PARALYSIS
    },
    [Enums.Type.FIRE] = {
        StatusEffects.StatusType.BURN,
        StatusEffects.StatusType.FREEZE
    },
    [Enums.Type.ICE] = {
        StatusEffects.StatusType.FREEZE
    },
    [Enums.Type.POISON] = {
        StatusEffects.StatusType.POISON,
        StatusEffects.StatusType.BADLY_POISONED
    },
    [Enums.Type.STEEL] = {
        StatusEffects.StatusType.POISON,
        StatusEffects.StatusType.BADLY_POISONED
    }
}

-- Ability-based status immunities
StatusImmunities.AbilityImmunities = {
    -- Complete status immunity abilities
    [7] = { -- LIMBER
        immuneTo = {StatusEffects.StatusType.PARALYSIS},
        name = "Limber",
        message = "{pokemon}'s Limber prevents paralysis!"
    },
    [15] = { -- INSOMNIA
        immuneTo = {StatusEffects.StatusType.SLEEP},
        name = "Insomnia", 
        message = "{pokemon}'s Insomnia prevents sleep!"
    },
    [17] = { -- IMMUNITY
        immuneTo = {StatusEffects.StatusType.POISON, StatusEffects.StatusType.BADLY_POISONED},
        name = "Immunity",
        message = "{pokemon}'s Immunity prevents poison!"
    },
    [40] = { -- MAGMA_ARMOR
        immuneTo = {StatusEffects.StatusType.FREEZE},
        name = "Magma Armor",
        message = "{pokemon}'s Magma Armor prevents freezing!"
    },
    [41] = { -- WATER_VEIL
        immuneTo = {StatusEffects.StatusType.BURN},
        name = "Water Veil",
        message = "{pokemon}'s Water Veil prevents burns!"
    },
    [72] = { -- VITAL_SPIRIT
        immuneTo = {StatusEffects.StatusType.SLEEP},
        name = "Vital Spirit",
        message = "{pokemon}'s Vital Spirit prevents sleep!"
    },
    [119] = { -- LEAF_GUARD (only in harsh sunlight)
        immuneTo = "all_non_volatile", -- Special handling required
        name = "Leaf Guard",
        condition = "harsh_sunlight",
        message = "{pokemon}'s Leaf Guard prevents status conditions!"
    },
    [43] = { -- OWN_TEMPO
        immuneTo = "confusion", -- Note: confusion is not a major status, but included for completeness
        name = "Own Tempo",
        message = "{pokemon}'s Own Tempo prevents confusion!"
    },
    [93] = { -- OBLIVIOUS
        immuneTo = "infatuation", -- Note: infatuation handling would be separate
        name = "Oblivious",
        message = "{pokemon}'s Oblivious prevents infatuation!"
    }
}

-- Conditional immunity requirements
StatusImmunities.ConditionalImmunities = {
    LEAF_GUARD = {
        abilityId = 119,
        condition = function(battleState)
            return battleState.battleConditions.weather == Enums.Weather.HARSH_SUNLIGHT
        end,
        immuneTo = {
            StatusEffects.StatusType.SLEEP,
            StatusEffects.StatusType.POISON,
            StatusEffects.StatusType.BADLY_POISONED,
            StatusEffects.StatusType.PARALYSIS,
            StatusEffects.StatusType.BURN,
            StatusEffects.StatusType.FREEZE
        }
    }
}

-- Initialize status immunities system
function StatusImmunities.init()
    -- Status immunities system is stateless, no initialization needed
    return true
end

-- Check if a Pokemon is immune to a specific status effect
-- @param pokemon: Pokemon to check immunity for
-- @param statusType: Status effect type to check
-- @param battleState: Current battle state (for conditional immunities)
-- @return: Immunity check result with reason and messages
function StatusImmunities.checkStatusImmunity(pokemon, statusType, battleState)
    if not pokemon or not statusType then
        return {immune = false, error = "Invalid immunity check parameters"}
    end
    
    local result = {
        immune = false,
        immunityType = nil,
        immunitySource = nil,
        message = nil,
        bypassable = false
    }
    
    -- Check type-based immunities
    local typeImmunity = StatusImmunities.checkTypeImmunity(pokemon, statusType)
    if typeImmunity.immune then
        result.immune = true
        result.immunityType = "type"
        result.immunitySource = typeImmunity.pokemonType
        result.message = StatusImmunities.generateTypeImmunityMessage(pokemon, statusType, typeImmunity.pokemonType)
        return result
    end
    
    -- Check ability-based immunities
    local abilityImmunity = StatusImmunities.checkAbilityImmunity(pokemon, statusType, battleState)
    if abilityImmunity.immune then
        result.immune = true
        result.immunityType = "ability"
        result.immunitySource = abilityImmunity.ability
        result.message = abilityImmunity.message
        result.bypassable = abilityImmunity.bypassable or false
        return result
    end
    
    -- Check conditional immunities
    local conditionalImmunity = StatusImmunities.checkConditionalImmunity(pokemon, statusType, battleState)
    if conditionalImmunity.immune then
        result.immune = true
        result.immunityType = "conditional"
        result.immunitySource = conditionalImmunity.source
        result.message = conditionalImmunity.message
        result.condition = conditionalImmunity.condition
        return result
    end
    
    return result
end

-- Check type-based status immunity
-- @param pokemon: Pokemon to check
-- @param statusType: Status effect type
-- @return: Type immunity result
function StatusImmunities.checkTypeImmunity(pokemon, statusType)
    if not pokemon.types or #pokemon.types == 0 then
        return {immune = false}
    end
    
    -- Check each of the Pokemon's types
    for _, pokemonType in ipairs(pokemon.types) do
        local typeImmunities = StatusImmunities.TypeImmunities[pokemonType]
        if typeImmunities then
            for _, immuneStatus in ipairs(typeImmunities) do
                if immuneStatus == statusType then
                    return {
                        immune = true,
                        pokemonType = pokemonType,
                        immuneStatus = statusType
                    }
                end
            end
        end
    end
    
    return {immune = false}
end

-- Check ability-based status immunity
-- @param pokemon: Pokemon to check
-- @param statusType: Status effect type
-- @param battleState: Current battle state
-- @return: Ability immunity result
function StatusImmunities.checkAbilityImmunity(pokemon, statusType, battleState)
    if not pokemon.ability then
        return {immune = false}
    end
    
    local abilityImmunity = StatusImmunities.AbilityImmunities[pokemon.ability]
    if not abilityImmunity then
        return {immune = false}
    end
    
    -- Handle special case for abilities that prevent all non-volatile status
    if abilityImmunity.immuneTo == "all_non_volatile" then
        -- Check if condition is met (e.g., Leaf Guard in sunlight)
        if abilityImmunity.condition and battleState then
            if abilityImmunity.condition == "harsh_sunlight" then
                if battleState.battleConditions.weather == Enums.Weather.HARSH_SUNLIGHT then
                    local message = abilityImmunity.message
                    message = string.gsub(message, "{pokemon}", pokemon.name)
                    return {
                        immune = true,
                        ability = pokemon.ability,
                        message = message
                    }
                end
            end
        end
        return {immune = false}
    end
    
    -- Check specific status immunities
    if abilityImmunity.immuneTo then
        for _, immuneStatus in ipairs(abilityImmunity.immuneTo) do
            if immuneStatus == statusType then
                local message = abilityImmunity.message
                message = string.gsub(message, "{pokemon}", pokemon.name)
                return {
                    immune = true,
                    ability = pokemon.ability,
                    abilityName = abilityImmunity.name,
                    message = message
                }
            end
        end
    end
    
    return {immune = false}
end

-- Check conditional status immunity (weather, terrain, etc.)
-- @param pokemon: Pokemon to check
-- @param statusType: Status effect type
-- @param battleState: Current battle state
-- @return: Conditional immunity result
function StatusImmunities.checkConditionalImmunity(pokemon, statusType, battleState)
    if not battleState then
        return {immune = false}
    end
    
    -- Check Leaf Guard specifically (most common conditional immunity)
    for conditionName, condition in pairs(StatusImmunities.ConditionalImmunities) do
        if pokemon.ability == condition.abilityId then
            if condition.condition(battleState) then
                -- Check if this status is covered by the conditional immunity
                for _, immuneStatus in ipairs(condition.immuneTo) do
                    if immuneStatus == statusType then
                        return {
                            immune = true,
                            source = conditionName,
                            condition = "weather_condition",
                            message = pokemon.name .. "'s " .. conditionName .. " prevents status conditions!"
                        }
                    end
                end
            end
        end
    end
    
    -- Check terrain-based immunities
    if battleState.battleConditions.terrain then
        local terrainImmunity = StatusImmunities.checkTerrainImmunity(pokemon, statusType, battleState.battleConditions.terrain)
        if terrainImmunity.immune then
            return terrainImmunity
        end
    end
    
    return {immune = false}
end

-- Check terrain-based status immunity
-- @param pokemon: Pokemon to check
-- @param statusType: Status effect type
-- @param terrain: Current terrain type
-- @return: Terrain immunity result
function StatusImmunities.checkTerrainImmunity(pokemon, statusType, terrain)
    -- Electric Terrain prevents sleep for grounded Pokemon
    if terrain == Enums.Terrain.ELECTRIC_TERRAIN and statusType == StatusEffects.StatusType.SLEEP then
        -- Check if Pokemon is grounded (not Flying type, no Levitate, etc.)
        local isGrounded = StatusImmunities.isPokemonGrounded(pokemon)
        if isGrounded then
            return {
                immune = true,
                source = "Electric Terrain",
                condition = "terrain",
                message = "Electric Terrain prevents " .. pokemon.name .. " from falling asleep!"
            }
        end
    end
    
    -- Misty Terrain prevents all major status conditions for grounded Pokemon
    if terrain == Enums.Terrain.MISTY_TERRAIN then
        local isGrounded = StatusImmunities.isPokemonGrounded(pokemon)
        if isGrounded then
            return {
                immune = true,
                source = "Misty Terrain",
                condition = "terrain",
                message = "Misty Terrain prevents " .. pokemon.name .. " from getting a status condition!"
            }
        end
    end
    
    return {immune = false}
end

-- Check if Pokemon is grounded (affected by terrain)
-- @param pokemon: Pokemon to check
-- @return: Boolean indicating if Pokemon is grounded
function StatusImmunities.isPokemonGrounded(pokemon)
    if not pokemon or not pokemon.types then
        return true -- Default assumption
    end
    
    -- Flying-type Pokemon are not grounded
    for _, pokemonType in ipairs(pokemon.types) do
        if pokemonType == Enums.Type.FLYING then
            return false
        end
    end
    
    -- Pokemon with Levitate ability are not grounded
    if pokemon.ability == 26 then -- LEVITATE
        return false
    end
    
    -- Pokemon with Air Balloon are not grounded (item check would go here)
    if pokemon.heldItem == 541 then -- AIR_BALLOON
        return false
    end
    
    return true
end

-- Generate type immunity message
-- @param pokemon: Pokemon with immunity
-- @param statusType: Status being prevented
-- @param pokemonType: Type providing immunity
-- @return: Immunity message
function StatusImmunities.generateTypeImmunityMessage(pokemon, statusType, pokemonType)
    local typeNames = {
        [Enums.Type.ELECTRIC] = "Electric",
        [Enums.Type.FIRE] = "Fire",
        [Enums.Type.ICE] = "Ice",
        [Enums.Type.POISON] = "Poison", 
        [Enums.Type.STEEL] = "Steel"
    }
    
    local statusNames = {
        [StatusEffects.StatusType.PARALYSIS] = "paralysis",
        [StatusEffects.StatusType.BURN] = "burns",
        [StatusEffects.StatusType.FREEZE] = "freezing",
        [StatusEffects.StatusType.POISON] = "poison",
        [StatusEffects.StatusType.BADLY_POISONED] = "poison",
        [StatusEffects.StatusType.SLEEP] = "sleep"
    }
    
    local typeName = typeNames[pokemonType] or "Unknown"
    local statusName = statusNames[statusType] or "status condition"
    
    return pokemon.name .. "'s " .. typeName .. " type prevents " .. statusName .. "!"
end

-- Validate status immunity bypass (for certain moves/abilities)
-- @param pokemon: Pokemon with immunity
-- @param statusType: Status being applied
-- @param bypassMethod: Method attempting to bypass immunity
-- @param battleState: Current battle state
-- @return: Bypass validation result
function StatusImmunities.checkImmunityBypass(pokemon, statusType, bypassMethod, battleState)
    if not pokemon or not statusType or not bypassMethod then
        return {canBypass = false}
    end
    
    local result = {
        canBypass = false,
        bypassType = bypassMethod.type,
        bypassSource = bypassMethod.source,
        message = nil
    }
    
    -- Check for Mold Breaker ability (bypasses target's abilities)
    if bypassMethod.type == "ability" and bypassMethod.source == 104 then -- MOLD_BREAKER
        -- Can bypass ability-based immunities but not type-based
        local immunityCheck = StatusImmunities.checkStatusImmunity(pokemon, statusType, battleState)
        if immunityCheck.immune and immunityCheck.immunityType == "ability" then
            result.canBypass = true
            result.message = "Mold Breaker bypasses " .. pokemon.name .. "'s ability!"
        end
    end
    
    -- Check for moves that bypass certain immunities
    if bypassMethod.type == "move" then
        -- Corrosive moves can poison Steel types
        if bypassMethod.corrosive and (statusType == StatusEffects.StatusType.POISON or statusType == StatusEffects.StatusType.BADLY_POISONED) then
            local typeImmunity = StatusImmunities.checkTypeImmunity(pokemon, statusType)
            if typeImmunity.immune and typeImmunity.pokemonType == Enums.Type.STEEL then
                result.canBypass = true
                result.message = "The corrosive effect bypassed " .. pokemon.name .. "'s Steel typing!"
            end
        end
        
        -- Moves that ignore type immunities (like Soak changing type)
        if bypassMethod.ignoreType then
            local immunityCheck = StatusImmunities.checkStatusImmunity(pokemon, statusType, battleState)
            if immunityCheck.immune and immunityCheck.immunityType == "type" then
                result.canBypass = true
                result.message = "The move bypassed type immunity!"
            end
        end
    end
    
    return result
end

-- Get comprehensive immunity information for a Pokemon
-- @param pokemon: Pokemon to check
-- @param battleState: Current battle state
-- @return: Complete immunity information
function StatusImmunities.getPokemonImmunityInfo(pokemon, battleState)
    if not pokemon then
        return {hasImmunities = false}
    end
    
    local info = {
        hasImmunities = false,
        typeImmunities = {},
        abilityImmunities = {},
        conditionalImmunities = {},
        activeImmunities = {}
    }
    
    -- Check type-based immunities
    if pokemon.types then
        for _, pokemonType in ipairs(pokemon.types) do
            local typeImmunities = StatusImmunities.TypeImmunities[pokemonType]
            if typeImmunities then
                info.hasImmunities = true
                for _, immuneStatus in ipairs(typeImmunities) do
                    table.insert(info.typeImmunities, {
                        type = pokemonType,
                        immuneTo = immuneStatus
                    })
                    table.insert(info.activeImmunities, immuneStatus)
                end
            end
        end
    end
    
    -- Check ability-based immunities
    if pokemon.ability then
        local abilityImmunity = StatusImmunities.AbilityImmunities[pokemon.ability]
        if abilityImmunity then
            info.hasImmunities = true
            table.insert(info.abilityImmunities, {
                ability = pokemon.ability,
                name = abilityImmunity.name,
                immuneTo = abilityImmunity.immuneTo
            })
            
            if type(abilityImmunity.immuneTo) == "table" then
                for _, immuneStatus in ipairs(abilityImmunity.immuneTo) do
                    table.insert(info.activeImmunities, immuneStatus)
                end
            end
        end
    end
    
    -- Check conditional immunities
    if battleState then
        for conditionName, condition in pairs(StatusImmunities.ConditionalImmunities) do
            if pokemon.ability == condition.abilityId and condition.condition(battleState) then
                info.hasImmunities = true
                table.insert(info.conditionalImmunities, {
                    condition = conditionName,
                    ability = pokemon.ability,
                    immuneTo = condition.immuneTo
                })
                
                for _, immuneStatus in ipairs(condition.immuneTo) do
                    table.insert(info.activeImmunities, immuneStatus)
                end
            end
        end
        
        -- Check terrain immunities
        if battleState.battleConditions.terrain then
            local terrain = battleState.battleConditions.terrain
            local isGrounded = StatusImmunities.isPokemonGrounded(pokemon)
            
            if isGrounded then
                if terrain == Enums.Terrain.ELECTRIC_TERRAIN then
                    info.hasImmunities = true
                    table.insert(info.activeImmunities, StatusEffects.StatusType.SLEEP)
                elseif terrain == Enums.Terrain.MISTY_TERRAIN then
                    info.hasImmunities = true
                    table.insert(info.activeImmunities, StatusEffects.StatusType.SLEEP)
                    table.insert(info.activeImmunities, StatusEffects.StatusType.POISON)
                    table.insert(info.activeImmunities, StatusEffects.StatusType.BADLY_POISONED)
                    table.insert(info.activeImmunities, StatusEffects.StatusType.PARALYSIS)
                    table.insert(info.activeImmunities, StatusEffects.StatusType.BURN)
                    table.insert(info.activeImmunities, StatusEffects.StatusType.FREEZE)
                end
            end
        end
    end
    
    -- Remove duplicates from activeImmunities
    local seen = {}
    local uniqueImmunities = {}
    for _, immunity in ipairs(info.activeImmunities) do
        if not seen[immunity] then
            seen[immunity] = true
            table.insert(uniqueImmunities, immunity)
        end
    end
    info.activeImmunities = uniqueImmunities
    
    return info
end

-- Validate status application considering all immunities
-- @param pokemon: Pokemon to apply status to
-- @param statusType: Status effect type
-- @param battleState: Current battle state
-- @param bypassMethod: Optional bypass method
-- @return: Complete validation result
function StatusImmunities.validateStatusApplication(pokemon, statusType, battleState, bypassMethod)
    if not pokemon or not statusType then
        return {valid = false, error = "Invalid parameters"}
    end
    
    local result = {
        valid = true,
        blocked = false,
        immunityType = nil,
        immunitySource = nil,
        bypassUsed = false,
        message = nil
    }
    
    -- Check for immunity
    local immunityCheck = StatusImmunities.checkStatusImmunity(pokemon, statusType, battleState)
    if immunityCheck.immune then
        result.blocked = true
        result.immunityType = immunityCheck.immunityType
        result.immunitySource = immunityCheck.immunitySource
        result.message = immunityCheck.message
        
        -- Check for bypass if available
        if bypassMethod and immunityCheck.bypassable ~= false then
            local bypassCheck = StatusImmunities.checkImmunityBypass(pokemon, statusType, bypassMethod, battleState)
            if bypassCheck.canBypass then
                result.blocked = false
                result.bypassUsed = true
                result.message = bypassCheck.message
            else
                result.valid = false
            end
        else
            result.valid = false
        end
    end
    
    return result
end

return StatusImmunities