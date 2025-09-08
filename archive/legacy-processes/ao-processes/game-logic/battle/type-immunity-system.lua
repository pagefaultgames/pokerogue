-- Type Immunity Interaction System
-- Handles type-based move immunities including Ground vs Electric, Normal/Fighting vs Ghost, etc.
-- Integrates with ability system for dynamic type changes and immunity overrides

local TypeImmunitySystem = {}

-- Load dependencies
local Enums = require("data.constants.enums")
local TypeChart = require("data.constants.type-chart")
local AbilityInteractions = require("game-logic.battle.ability-interactions")

-- Type immunity rules
-- Maps attacking types to defending types that are immune
TypeImmunitySystem.typeImmunities = {
    [Enums.PokemonType.NORMAL] = {
        immuneTypes = {Enums.PokemonType.GHOST},
        message = "Normal-type moves don't affect Ghost-type Pokemon!"
    },
    [Enums.PokemonType.FIGHTING] = {
        immuneTypes = {Enums.PokemonType.GHOST},
        message = "Fighting-type moves don't affect Ghost-type Pokemon!"
    },
    [Enums.PokemonType.GROUND] = {
        immuneTypes = {Enums.PokemonType.FLYING},
        message = "Ground-type moves don't affect Flying-type Pokemon!",
        abilityOverrides = {
            [Enums.AbilityId.LEVITATE] = {
                addImmunity = true,
                message = "Levitate makes Ground-type moves miss!"
            }
        }
    },
    [Enums.PokemonType.ELECTRIC] = {
        immuneTypes = {Enums.PokemonType.GROUND},
        message = "Electric-type moves don't affect Ground-type Pokemon!"
    },
    [Enums.PokemonType.PSYCHIC] = {
        immuneTypes = {Enums.PokemonType.DARK},
        message = "Psychic-type moves don't affect Dark-type Pokemon!"
    },
    [Enums.PokemonType.POISON] = {
        immuneTypes = {Enums.PokemonType.STEEL},
        message = "Poison-type moves don't affect Steel-type Pokemon!"
    },
    [Enums.PokemonType.DRAGON] = {
        immuneTypes = {Enums.PokemonType.FAIRY},
        message = "Dragon-type moves don't affect Fairy-type Pokemon!"
    }
}

-- Special type-changing moves that can affect immunities
TypeImmunitySystem.typeChangingMoves = {
    -- Burn Up removes Fire typing
    [464] = { -- BURN_UP placeholder
        removesType = Enums.PokemonType.FIRE,
        message = "The Fire type was burned away!"
    },
    -- Roost removes Flying typing temporarily
    [355] = { -- ROOST placeholder
        removesType = Enums.PokemonType.FLYING,
        temporary = true,
        duration = 1, -- Until end of turn
        message = "Lost the Flying type!"
    }
}

-- Check if move type is immune against target types
-- @param moveType: Type of the attacking move
-- @param targetTypes: Array of target Pokemon types
-- @param targetAbility: Target Pokemon ability (optional)
-- @return: Boolean indicating immunity, message string
function TypeImmunitySystem.checkTypeImmunity(moveType, targetTypes, targetAbility)
    -- Check basic type chart immunity first
    local effectiveness = TypeChart.getAttackTypeEffectiveness(moveType, targetTypes)
    if effectiveness == TypeChart.MULTIPLIERS.NO_EFFECT then
        local immunityRule = TypeImmunitySystem.typeImmunities[moveType]
        local message = immunityRule and immunityRule.message or "It doesn't affect the target!"
        return true, message
    end
    
    -- Check ability-based immunities
    if targetAbility then
        local immunityRule = TypeImmunitySystem.typeImmunities[moveType]
        if immunityRule and immunityRule.abilityOverrides then
            local abilityOverride = immunityRule.abilityOverrides[targetAbility]
            if abilityOverride and abilityOverride.addImmunity then
                return true, abilityOverride.message
            end
        end
    end
    
    return false, nil
end

-- Process type immunity interaction
-- @param battleState: Current battle state
-- @param attacker: Pokemon using the move
-- @param target: Target Pokemon
-- @param moveData: Move being used
-- @return: Immunity result with blocked status and message
function TypeImmunitySystem.processTypeImmunity(battleState, attacker, target, moveData)
    -- Get current target types (may be modified by battle conditions)
    local targetTypes = TypeImmunitySystem.getCurrentPokemonTypes(battleState, target)
    
    -- Check for type immunity
    local isImmune, message = TypeImmunitySystem.checkTypeImmunity(moveData.type, targetTypes, target.ability)
    
    if isImmune then
        return {
            success = true,
            blocked = true,
            immune = true,
            message = message or ("It doesn't affect " .. (target.name or "the target") .. "!"),
            effectiveness = 0
        }
    end
    
    return {
        success = false,
        blocked = false,
        immune = false,
        effectiveness = TypeChart.getAttackTypeEffectiveness(moveData.type, targetTypes)
    }
end

-- Get current Pokemon types accounting for temporary type changes
-- @param battleState: Current battle state
-- @param pokemon: Pokemon to get types for
-- @return: Array of current types
function TypeImmunitySystem.getCurrentPokemonTypes(battleState, pokemon)
    local currentTypes = {pokemon.types[1]}
    if pokemon.types[2] then
        table.insert(currentTypes, pokemon.types[2])
    end
    
    -- Check for temporary type changes
    if battleState.temporaryTypeChanges and battleState.temporaryTypeChanges[pokemon.id] then
        local typeChanges = battleState.temporaryTypeChanges[pokemon.id]
        
        -- Remove temporarily removed types
        for i = #currentTypes, 1, -1 do
            if typeChanges.removedTypes and typeChanges.removedTypes[currentTypes[i]] then
                table.remove(currentTypes, i)
            end
        end
        
        -- Add temporarily added types
        if typeChanges.addedTypes then
            for _, addedType in ipairs(typeChanges.addedTypes) do
                table.insert(currentTypes, addedType)
            end
        end
    end
    
    -- Ensure at least one type (default to Normal if all removed)
    if #currentTypes == 0 then
        currentTypes = {Enums.PokemonType.NORMAL}
    end
    
    return currentTypes
end

-- Apply type-changing move effects
-- @param battleState: Battle state to modify
-- @param move: Move that changes types
-- @param user: Pokemon using the move
-- @return: Updated battle state and effect messages
function TypeImmunitySystem.applyTypeChange(battleState, move, user)
    local messages = {}
    local typeChangeData = TypeImmunitySystem.typeChangingMoves[move.id]
    
    if not typeChangeData then
        return battleState, messages
    end
    
    -- Initialize temporary type changes if needed
    battleState.temporaryTypeChanges = battleState.temporaryTypeChanges or {}
    battleState.temporaryTypeChanges[user.id] = battleState.temporaryTypeChanges[user.id] or {
        removedTypes = {},
        addedTypes = {},
        durations = {}
    }
    
    local userTypeChanges = battleState.temporaryTypeChanges[user.id]
    
    -- Remove specified type
    if typeChangeData.removesType then
        userTypeChanges.removedTypes[typeChangeData.removesType] = true
        
        if typeChangeData.temporary then
            userTypeChanges.durations[typeChangeData.removesType] = typeChangeData.duration or 1
        end
        
        table.insert(messages, typeChangeData.message)
    end
    
    return battleState, messages
end

-- Update temporary type changes at end of turn
-- @param battleState: Battle state to update
-- @return: Updated battle state and expired effect messages
function TypeImmunitySystem.updateTemporaryTypeChanges(battleState)
    local messages = {}
    
    if not battleState.temporaryTypeChanges then
        return battleState, messages
    end
    
    for pokemonId, typeChanges in pairs(battleState.temporaryTypeChanges) do
        -- Decrement durations
        for typeId, duration in pairs(typeChanges.durations) do
            typeChanges.durations[typeId] = duration - 1
            
            if typeChanges.durations[typeId] <= 0 then
                -- Remove expired type change
                typeChanges.removedTypes[typeId] = nil
                typeChanges.durations[typeId] = nil
                
                -- Find Pokemon name for message
                local pokemonName = "Pokemon"
                for _, pokemon in pairs(battleState.activePokemon or {}) do
                    if pokemon and pokemon.id == pokemonId then
                        pokemonName = pokemon.name
                        break
                    end
                end
                
                table.insert(messages, pokemonName .. " regained its original typing!")
            end
        end
    end
    
    return battleState, messages
end

-- Check for ability immunity overrides (like Wonder Guard)
-- @param pokemon: Pokemon to check
-- @param moveData: Move being used
-- @return: Boolean indicating if ability provides immunity
function TypeImmunitySystem.checkAbilityImmunityOverride(pokemon, moveData)
    -- Wonder Guard implementation (only super effective moves hit)
    if pokemon.ability == 25 then -- WONDER_GUARD
        local effectiveness = TypeChart.getAttackTypeEffectiveness(moveData.type, {pokemon.types[1], pokemon.types[2]})
        if effectiveness <= TypeChart.MULTIPLIERS.NORMAL_EFFECTIVE then
            return true, "Wonder Guard protected against the attack!"
        end
    end
    
    -- Other ability-based immunities can be added here
    
    return false, nil
end

-- Get comprehensive immunity check
-- @param battleState: Current battle state
-- @param attacker: Pokemon using move
-- @param target: Target Pokemon
-- @param moveData: Move data
-- @return: Complete immunity result
function TypeImmunitySystem.getCompleteImmunityResult(battleState, attacker, target, moveData)
    -- Check type immunity
    local typeResult = TypeImmunitySystem.processTypeImmunity(battleState, attacker, target, moveData)
    if typeResult.immune then
        return typeResult
    end
    
    -- Check ability immunity override
    local abilityImmune, abilityMessage = TypeImmunitySystem.checkAbilityImmunityOverride(target, moveData)
    if abilityImmune then
        return {
            success = true,
            blocked = true,
            immune = true,
            message = abilityMessage,
            effectiveness = 0,
            reason = "ability"
        }
    end
    
    -- Check for ability interactions that provide immunity
    if AbilityInteractions.canInteract(target.ability, moveData.type, moveData.category) then
        local interaction = AbilityInteractions.processInteraction(battleState, target, attacker, moveData, {target.id})
        if interaction.success and (interaction.effects.immune or interaction.effects.absorbed) then
            return {
                success = true,
                blocked = true,
                immune = true,
                message = interaction.message,
                effectiveness = 0,
                reason = "ability_interaction"
            }
        end
    end
    
    return typeResult
end

-- Validate type immunity data
-- @return: Boolean indicating if all immunity data is valid
function TypeImmunitySystem.validateImmunityData()
    for attackType, immunityData in pairs(TypeImmunitySystem.typeImmunities) do
        -- Validate attacking type
        if not Enums.PokemonTypeName[attackType] then
            print("Warning: Invalid attack type in immunity data: " .. tostring(attackType))
            return false
        end
        
        -- Validate immune types
        if immunityData.immuneTypes then
            for _, immuneType in ipairs(immunityData.immuneTypes) do
                if not Enums.PokemonTypeName[immuneType] then
                    print("Warning: Invalid immune type: " .. tostring(immuneType))
                    return false
                end
            end
        end
        
        -- Validate ability overrides
        if immunityData.abilityOverrides then
            for abilityId, override in pairs(immunityData.abilityOverrides) do
                -- Basic validation - ability ID should be reasonable
                if type(abilityId) ~= "number" or abilityId < 0 then
                    print("Warning: Invalid ability ID in immunity override: " .. tostring(abilityId))
                    return false
                end
            end
        end
    end
    
    return true
end

-- Initialize type immunity system
function TypeImmunitySystem.init()
    if not TypeImmunitySystem.validateImmunityData() then
        return false, "Invalid type immunity data"
    end
    
    print("Type Immunity System initialized with " .. 
          #TypeImmunitySystem.typeImmunities .. " immunity rules")
    return true
end

return TypeImmunitySystem