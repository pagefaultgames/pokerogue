-- State Handler for AO Process
-- Handles Pokemon ability state management and persistence
-- Compatible with AOConnect protocol

local StateHandler = {}

-- Import required modules
local PokemonAbilityState = require("game-logic.pokemon.pokemon-ability-state")
local AbilityDatabase = require("data.abilities.ability-database")
local AbilityIndexes = require("data.abilities.ability-indexes")

-- State message handlers
local stateHandlers = {}

-- Initialize Pokemon with abilities
stateHandlers["initialize-pokemon-ability"] = function(msg)
    local pokemonData = msg.Data and msg.Data.pokemon
    local speciesId = msg.Data and msg.Data.speciesId
    local abilitySlot = msg.Data and msg.Data.abilitySlot
    
    if not pokemonData or not speciesId then
        return {
            success = false,
            error = "Missing pokemon data or speciesId"
        }
    end
    
    -- Initialize Pokemon ability state
    local success, errorMsg = PokemonAbilityState.initPokemonAbility(pokemonData, speciesId, abilitySlot)
    
    if not success then
        return {
            success = false,
            error = errorMsg or "Failed to initialize Pokemon ability"
        }
    end
    
    local currentAbility = PokemonAbilityState.getCurrentAbility(pokemonData)
    
    return {
        success = true,
        pokemon = pokemonData,
        currentAbility = currentAbility,
        availableAbilities = PokemonAbilityState.getAvailableAbilities(pokemonData, true)
    }
end

-- Get Pokemon current ability
stateHandlers["get-pokemon-ability"] = function(msg)
    local pokemonData = msg.Data and msg.Data.pokemon
    
    if not pokemonData then
        return {
            success = false,
            error = "Missing pokemon data"
        }
    end
    
    local currentAbility = PokemonAbilityState.getCurrentAbility(pokemonData)
    
    if not currentAbility then
        return {
            success = false,
            error = "Pokemon has no ability set"
        }
    end
    
    local abilityData = AbilityDatabase.getAbility(currentAbility.id)
    
    return {
        success = true,
        ability = {
            id = currentAbility.id,
            name = abilityData and abilityData.name or "Unknown",
            description = abilityData and abilityData.description or "",
            slot = currentAbility.slot,
            isTemporary = currentAbility.isTemporary
        },
        isSuppressed = PokemonAbilityState.isAbilitySuppressed(pokemonData)
    }
end

-- Change Pokemon ability
stateHandlers["change-pokemon-ability"] = function(msg)
    local pokemonData = msg.Data and msg.Data.pokemon
    local newAbilityId = msg.Data and msg.Data.abilityId
    local source = msg.Data and msg.Data.source or "unknown"
    local isTemporary = msg.Data and msg.Data.isTemporary or false
    
    if not pokemonData or not newAbilityId then
        return {
            success = false,
            error = "Missing pokemon data or abilityId"
        }
    end
    
    -- Validate new ability exists
    local abilityData = AbilityDatabase.getAbility(newAbilityId)
    if not abilityData then
        return {
            success = false,
            error = "Invalid ability ID: " .. tostring(newAbilityId)
        }
    end
    
    -- Change ability
    local success, errorMsg = PokemonAbilityState.changeAbility(pokemonData, newAbilityId, source, isTemporary)
    
    if not success then
        return {
            success = false,
            error = errorMsg or "Failed to change ability"
        }
    end
    
    local currentAbility = PokemonAbilityState.getCurrentAbility(pokemonData)
    
    return {
        success = true,
        pokemon = pokemonData,
        previousAbility = msg.Data.previousAbility,
        newAbility = {
            id = currentAbility.id,
            name = abilityData.name,
            description = abilityData.description,
            slot = currentAbility.slot,
            isTemporary = currentAbility.isTemporary
        },
        source = source
    }
end

-- Get available abilities for Pokemon
stateHandlers["get-available-abilities"] = function(msg)
    local pokemonData = msg.Data and msg.Data.pokemon
    local includeHidden = msg.Data and msg.Data.includeHidden or false
    
    if not pokemonData then
        return {
            success = false,
            error = "Missing pokemon data"
        }
    end
    
    local availableAbilities = PokemonAbilityState.getAvailableAbilities(pokemonData, includeHidden)
    
    return {
        success = true,
        availableAbilities = availableAbilities,
        currentAbility = PokemonAbilityState.getCurrentAbility(pokemonData)
    }
end

-- Suppress Pokemon ability
stateHandlers["suppress-ability"] = function(msg)
    local pokemonData = msg.Data and msg.Data.pokemon
    local source = msg.Data and msg.Data.source or "unknown"
    local turns = msg.Data and msg.Data.turns
    
    if not pokemonData then
        return {
            success = false,
            error = "Missing pokemon data"
        }
    end
    
    local success, errorMsg = PokemonAbilityState.suppressAbility(pokemonData, source, turns)
    
    if not success then
        return {
            success = false,
            error = errorMsg or "Failed to suppress ability"
        }
    end
    
    return {
        success = true,
        pokemon = pokemonData,
        suppressionSource = source,
        suppressionTurns = turns,
        message = "Ability suppressed"
    }
end

-- Remove ability suppression
stateHandlers["remove-ability-suppression"] = function(msg)
    local pokemonData = msg.Data and msg.Data.pokemon
    
    if not pokemonData then
        return {
            success = false,
            error = "Missing pokemon data"
        }
    end
    
    local success = PokemonAbilityState.removeAbilitySuppression(pokemonData)
    
    return {
        success = success,
        pokemon = pokemonData,
        message = success and "Ability suppression removed" or "No suppression to remove"
    }
end

-- Handle breeding inheritance
stateHandlers["setup-breeding-inheritance"] = function(msg)
    local offspring = msg.Data and msg.Data.offspring
    local parent1 = msg.Data and msg.Data.parent1
    local parent2 = msg.Data and msg.Data.parent2
    
    if not offspring or not parent1 or not parent2 then
        return {
            success = false,
            error = "Missing offspring or parent data"
        }
    end
    
    local success = PokemonAbilityState.setupBreedingInheritance(offspring, parent1, parent2)
    
    if not success then
        return {
            success = false,
            error = "Failed to set up breeding inheritance"
        }
    end
    
    local inheritedAbility = PokemonAbilityState.getCurrentAbility(offspring)
    local abilityData = inheritedAbility and AbilityDatabase.getAbility(inheritedAbility.id)
    
    return {
        success = true,
        offspring = offspring,
        inheritedAbility = {
            id = inheritedAbility.id,
            name = abilityData and abilityData.name or "Unknown",
            slot = inheritedAbility.slot,
            source = "inheritance"
        },
        parentAbilities = offspring.abilityState.inheritanceData.parentAbilities
    }
end

-- Validate breeding compatibility
stateHandlers["validate-breeding-compatibility"] = function(msg)
    local species1Id = msg.Data and msg.Data.species1Id
    local ability1Id = msg.Data and msg.Data.ability1Id
    local species2Id = msg.Data and msg.Data.species2Id
    local ability2Id = msg.Data and msg.Data.ability2Id
    
    if not species1Id or not ability1Id or not species2Id or not ability2Id then
        return {
            success = false,
            error = "Missing species or ability data for validation"
        }
    end
    
    local isCompatible = PokemonAbilityState.validateBreedingCompatibility(
        species1Id, ability1Id, species2Id, ability2Id
    )
    
    return {
        success = true,
        compatible = isCompatible,
        species1Id = species1Id,
        ability1Id = ability1Id,
        species2Id = species2Id,
        ability2Id = ability2Id
    }
end

-- Update ability suppression turns (called each turn)
stateHandlers["update-suppression-turns"] = function(msg)
    local pokemonData = msg.Data and msg.Data.pokemon
    
    if not pokemonData then
        return {
            success = false,
            error = "Missing pokemon data"
        }
    end
    
    local suppressionEnded = PokemonAbilityState.updateSuppressionTurns(pokemonData)
    
    return {
        success = true,
        pokemon = pokemonData,
        suppressionEnded = suppressionEnded,
        currentSuppressionTurns = pokemonData.abilityState and pokemonData.abilityState.suppressionTurns or 0
    }
end

-- Save Pokemon ability state
stateHandlers["save-ability-state"] = function(msg)
    local pokemonData = msg.Data and msg.Data.pokemon
    local pokemonId = msg.Data and msg.Data.pokemonId
    
    if not pokemonData or not pokemonId then
        return {
            success = false,
            error = "Missing pokemon data or pokemonId"
        }
    end
    
    local stateData = PokemonAbilityState.getAbilityStateData(pokemonData)
    
    if not stateData then
        return {
            success = false,
            error = "No ability state data to save"
        }
    end
    
    -- In a real implementation, this would persist to storage
    -- For now, we'll return the state data
    return {
        success = true,
        pokemonId = pokemonId,
        abilityStateData = stateData,
        message = "Ability state data ready for persistence"
    }
end

-- Restore Pokemon ability state
stateHandlers["restore-ability-state"] = function(msg)
    local pokemonData = msg.Data and msg.Data.pokemon
    local stateData = msg.Data and msg.Data.stateData
    local speciesId = msg.Data and msg.Data.speciesId
    
    if not pokemonData or not stateData or not speciesId then
        return {
            success = false,
            error = "Missing pokemon data, state data, or speciesId"
        }
    end
    
    local success = PokemonAbilityState.restoreAbilityStateData(pokemonData, stateData, speciesId)
    
    if not success then
        return {
            success = false,
            error = "Failed to restore ability state"
        }
    end
    
    local currentAbility = PokemonAbilityState.getCurrentAbility(pokemonData)
    
    return {
        success = true,
        pokemon = pokemonData,
        restoredAbility = currentAbility,
        message = "Ability state restored successfully"
    }
end

-- Check if Pokemon can have specific ability
stateHandlers["can-have-ability"] = function(msg)
    local pokemonData = msg.Data and msg.Data.pokemon
    local abilityId = msg.Data and msg.Data.abilityId
    local speciesId = msg.Data and msg.Data.speciesId
    
    if not pokemonData or not abilityId then
        return {
            success = false,
            error = "Missing pokemon data or abilityId"
        }
    end
    
    local canHave, slotOrReason = PokemonAbilityState.canHaveAbility(pokemonData, abilityId, speciesId)
    
    local abilityData = AbilityDatabase.getAbility(abilityId)
    
    return {
        success = true,
        canHave = canHave,
        abilityId = abilityId,
        abilityName = abilityData and abilityData.name or "Unknown",
        slot = canHave and slotOrReason or nil,
        reason = not canHave and slotOrReason or nil
    }
end

-- Main handler function
function StateHandler.handle(msg)
    local action = msg.Action
    
    if not action then
        return {
            success = false,
            error = "Missing Action parameter"
        }
    end
    
    local handler = stateHandlers[action]
    if not handler then
        return {
            success = false,
            error = "Unknown action: " .. action
        }
    end
    
    -- Initialize dependencies
    AbilityDatabase.init()
    AbilityIndexes.init()
    
    -- Execute handler
    local success, result = pcall(handler, msg)
    
    if not success then
        return {
            success = false,
            error = "Handler error: " .. tostring(result)
        }
    end
    
    return result
end

-- Get available actions
function StateHandler.getAvailableActions()
    local actions = {}
    for action in pairs(stateHandlers) do
        table.insert(actions, action)
    end
    table.sort(actions)
    return actions
end

-- Validate message structure
function StateHandler.validateMessage(msg)
    if not msg then
        return false, "Message is required"
    end
    
    if not msg.Action then
        return false, "Action is required"
    end
    
    if not msg.Data then
        return false, "Data is required"
    end
    
    return true
end

return StateHandler