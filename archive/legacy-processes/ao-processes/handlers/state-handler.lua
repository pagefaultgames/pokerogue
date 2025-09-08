-- State Handler for AO Process
-- Handles Pokemon ability state management and persistence
-- Compatible with AOConnect protocol

local StateHandler = {}

-- Import required modules
local PokemonAbilityState = require("game-logic.pokemon.pokemon-ability-state")
local AbilityDatabase = require("data.abilities.ability-database")
local AbilityIndexes = require("data.abilities.ability-indexes")

-- Import Pokemon instance management modules
local PokemonManager = require("game-logic.pokemon.pokemon-manager")
local ExperienceSystem = require("game-logic.progression.experience-system")
local PlayerProgressionSystem = require("game-logic.progression.player-progression-system")
local MoveManager = require("game-logic.pokemon.move-manager")
local CustomizationManager = require("game-logic.pokemon.customization-manager")
local PokemonStorage = require("data.pokemon-instances.pokemon-storage")
local PlayerIndex = require("data.pokemon-instances.player-index")

-- Import Item System modules
local ItemDatabase = require("data.items.item-database")
-- Load ItemEffectsProcessor conditionally (requires AO crypto module)
local ItemEffectsProcessor
local success, processor = pcall(require, "game-logic.items.item-effects-processor")
if success then
    ItemEffectsProcessor = processor
else
    -- Fallback for test environments without AO crypto module
    ItemEffectsProcessor = {
        processItemEffect = function() return false, "ItemEffectsProcessor not available in test environment" end
    }
end
local InventoryManager = require("game-logic.items.inventory-manager")
local HeldItemManager = require("game-logic.items.held-item-manager")
local HeldItemEffects = require("game-logic.items.held-item-effects")

-- State message handlers
local stateHandlers = {}

-- Item system handlers
local itemHandlers = {}

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

-- Item System Handlers

-- Use item on Pokemon
itemHandlers["use-item"] = function(msg)
    local playerId = msg.Data and msg.Data.playerId
    local pokemonId = msg.Data and msg.Data.pokemonId
    local itemId = msg.Data and msg.Data.itemId
    local quantity = msg.Data and msg.Data.quantity or 1
    local context = msg.Data and msg.Data.context or "overworld"
    
    if not playerId or not pokemonId or not itemId then
        return {
            success = false,
            error = "Missing playerId, pokemonId, or itemId"
        }
    end
    
    -- Check if player has the item
    if not InventoryManager.hasItem(playerId, itemId, quantity) then
        return {
            success = false,
            error = "Player does not have sufficient quantity of item"
        }
    end
    
    -- Get Pokemon instance
    local pokemon = PokemonStorage.getPokemon(pokemonId)
    if not pokemon then
        return {
            success = false,
            error = "Pokemon not found: " .. pokemonId
        }
    end
    
    -- Process item effect
    local effectResult, effectData, message = ItemEffectsProcessor.processItemEffect(
        pokemon, itemId, context, msg.Data.battleState, quantity
    )
    
    if effectResult == ItemEffectsProcessor.EffectResult.SUCCESS then
        -- Remove consumable items from inventory
        if ItemDatabase.isConsumable(itemId) then
            InventoryManager.useItem(playerId, itemId, quantity, "Used on " .. (pokemon.name or "Pokemon"))
        end
        
        -- Save Pokemon changes
        PokemonStorage.updatePokemon(pokemonId, pokemon)
        
        return {
            success = true,
            effectResult = effectResult,
            effectData = effectData,
            message = message,
            pokemon = pokemon
        }
    else
        return {
            success = false,
            effectResult = effectResult,
            message = message
        }
    end
end

-- Add item to player inventory
itemHandlers["add-item"] = function(msg)
    local playerId = msg.Data and msg.Data.playerId
    local itemId = msg.Data and msg.Data.itemId
    local quantity = msg.Data and msg.Data.quantity or 1
    local reason = msg.Data and msg.Data.reason
    
    if not playerId or not itemId then
        return {
            success = false,
            error = "Missing playerId or itemId"
        }
    end
    
    local success, message, finalQuantity = InventoryManager.addItem(playerId, itemId, quantity, reason)
    
    return {
        success = success,
        message = message,
        finalQuantity = finalQuantity,
        itemId = itemId
    }
end

-- Remove item from player inventory
itemHandlers["remove-item"] = function(msg)
    local playerId = msg.Data and msg.Data.playerId
    local itemId = msg.Data and msg.Data.itemId
    local quantity = msg.Data and msg.Data.quantity or 1
    local reason = msg.Data and msg.Data.reason
    
    if not playerId or not itemId then
        return {
            success = false,
            error = "Missing playerId or itemId"
        }
    end
    
    local success, message, remaining = InventoryManager.removeItem(playerId, itemId, quantity, reason)
    
    return {
        success = success,
        message = message,
        remainingQuantity = remaining,
        itemId = itemId
    }
end

-- Get player inventory
itemHandlers["get-inventory"] = function(msg)
    local playerId = msg.Data and msg.Data.playerId
    local category = msg.Data and msg.Data.category
    
    if not playerId then
        return {
            success = false,
            error = "Missing playerId"
        }
    end
    
    if category then
        local items = InventoryManager.getItemsByCategory(playerId, category)
        return {
            success = true,
            items = items,
            category = category
        }
    else
        local inventory = InventoryManager.getInventory(playerId)
        return {
            success = true,
            inventory = inventory
        }
    end
end

-- Get item information
itemHandlers["get-item-info"] = function(msg)
    local itemId = msg.Data and msg.Data.itemId
    
    if not itemId then
        return {
            success = false,
            error = "Missing itemId"
        }
    end
    
    local itemData = ItemDatabase.getItem(itemId)
    if not itemData then
        return {
            success = false,
            error = "Item not found: " .. itemId
        }
    end
    
    return {
        success = true,
        itemData = itemData
    }
end

-- Validate item usage
itemHandlers["validate-item-usage"] = function(msg)
    local playerId = msg.Data and msg.Data.playerId
    local pokemonId = msg.Data and msg.Data.pokemonId
    local itemId = msg.Data and msg.Data.itemId
    local context = msg.Data and msg.Data.context or "overworld"
    
    if not playerId or not pokemonId or not itemId then
        return {
            success = false,
            error = "Missing playerId, pokemonId, or itemId"
        }
    end
    
    -- Check inventory
    if not InventoryManager.hasItem(playerId, itemId, 1) then
        return {
            success = true,
            canUse = false,
            reason = "Item not in inventory"
        }
    end
    
    -- Get Pokemon instance
    local pokemon = PokemonStorage.getPokemon(pokemonId)
    if not pokemon then
        return {
            success = false,
            error = "Pokemon not found: " .. pokemonId
        }
    end
    
    -- Validate usage
    local canUse, reason = ItemEffectsProcessor.validateItemUsage(pokemon, itemId, context)
    
    return {
        success = true,
        canUse = canUse,
        reason = reason
    }
end

-- Get inventory statistics
itemHandlers["get-inventory-stats"] = function(msg)
    local playerId = msg.Data and msg.Data.playerId
    
    if not playerId then
        return {
            success = false,
            error = "Missing playerId"
        }
    end
    
    local stats = InventoryManager.getInventoryStats(playerId)
    
    return {
        success = true,
        stats = stats
    }
end

-- Pokemon Instance Management Handlers

-- Create new Pokemon instance
stateHandlers["create-pokemon"] = function(msg)
    local speciesId = msg.Data and msg.Data.speciesId
    local level = msg.Data and msg.Data.level
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    local options = msg.Data and msg.Data.options or {}
    
    if not speciesId or not level or not playerId then
        return {
            success = false,
            error = "Missing required parameters: speciesId, level, and playerId"
        }
    end
    
    local pokemon, error = PokemonManager.createPokemon(speciesId, level, playerId, options)
    
    if not pokemon then
        return {
            success = false,
            error = error or "Failed to create Pokemon"
        }
    end
    
    -- Initialize moveset
    pokemon = MoveManager.initializeMoveset(pokemon)
    
    -- Store in storage system
    local stored, storeError = PokemonStorage.store(pokemon)
    if not stored then
        return {
            success = false,
            error = "Failed to store Pokemon: " .. (storeError or "unknown error")
        }
    end
    
    -- Add to player's collection
    PlayerIndex.initializePlayer(playerId)
    PlayerIndex.addToParty(playerId, pokemon.id)
    
    return {
        success = true,
        pokemon = pokemon,
        message = "Pokemon created successfully"
    }
end

-- Get Pokemon instance by ID
stateHandlers["get-pokemon"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not pokemonId then
        return {
            success = false,
            error = "Missing pokemonId"
        }
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    
    if not pokemon then
        return {
            success = false,
            error = error or "Pokemon not found or access denied"
        }
    end
    
    return {
        success = true,
        pokemon = pokemon
    }
end

-- Update Pokemon stats (level, experience, etc.)
stateHandlers["update-pokemon-stats"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local modifications = msg.Data and msg.Data.modifications
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not pokemonId or not modifications or not playerId then
        return {
            success = false,
            error = "Missing required parameters: pokemonId, modifications, and playerId"
        }
    end
    
    local pokemon, error = PokemonManager.updatePokemonStats(pokemonId, modifications, playerId)
    
    if not pokemon then
        return {
            success = false,
            error = error or "Failed to update Pokemon stats"
        }
    end
    
    -- Update storage
    PokemonStorage.update(pokemonId, pokemon)
    
    return {
        success = true,
        pokemon = pokemon,
        message = "Pokemon stats updated successfully"
    }
end

-- Gain experience and handle level ups
stateHandlers["gain-experience"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local expGained = msg.Data and msg.Data.expGained
    local battleContext = msg.Data and msg.Data.battleContext
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not pokemonId or not expGained or not playerId then
        return {
            success = false,
            error = "Missing required parameters: pokemonId, expGained, and playerId"
        }
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return {
            success = false,
            error = error or "Pokemon not found or access denied"
        }
    end
    
    local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, expGained, battleContext)
    
    if not updatedPokemon then
        return {
            success = false,
            error = "Failed to apply experience gain"
        }
    end
    
    -- Process level up moves if leveled up
    local movesLearned = {}
    if levelUpData and levelUpData.levelsGained > 0 then
        updatedPokemon, movesLearned = MoveManager.processLevelUpMoves(updatedPokemon, updatedPokemon.level)
    end
    
    -- Update storage
    PokemonStorage.update(pokemonId, updatedPokemon)
    
    return {
        success = true,
        pokemon = updatedPokemon,
        levelUpData = levelUpData,
        movesLearned = movesLearned,
        message = levelUpData and "Pokemon leveled up!" or "Experience gained"
    }
end

-- Set Pokemon nickname
stateHandlers["set-nickname"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local nickname = msg.Data and msg.Data.nickname
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not pokemonId or not playerId then
        return {
            success = false,
            error = "Missing required parameters: pokemonId and playerId"
        }
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return {
            success = false,
            error = error or "Pokemon not found or access denied"
        }
    end
    
    local updatedPokemon, result = CustomizationManager.setNickname(pokemon, nickname, playerId)
    
    if not result.success then
        return {
            success = false,
            error = result.message
        }
    end
    
    -- Update storage
    PokemonStorage.update(pokemonId, updatedPokemon)
    
    return {
        success = true,
        pokemon = updatedPokemon,
        oldNickname = result.oldNickname,
        newNickname = result.newNickname,
        message = result.message
    }
end

-- Learn new move
stateHandlers["learn-move"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local moveId = msg.Data and msg.Data.moveId
    local learnMethod = msg.Data and msg.Data.learnMethod or "level"
    local options = msg.Data and msg.Data.options or {}
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not pokemonId or not moveId or not playerId then
        return {
            success = false,
            error = "Missing required parameters: pokemonId, moveId, and playerId"
        }
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return {
            success = false,
            error = error or "Pokemon not found or access denied"
        }
    end
    
    local updatedPokemon, result = MoveManager.learnMove(pokemon, moveId, learnMethod, options)
    
    if not updatedPokemon then
        return {
            success = false,
            error = "Failed to learn move"
        }
    end
    
    -- Update storage
    PokemonStorage.update(pokemonId, updatedPokemon)
    
    return {
        success = result.success,
        pokemon = updatedPokemon,
        result = result,
        message = result.message
    }
end

-- Forget move
stateHandlers["forget-move"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local moveSlot = msg.Data and msg.Data.moveSlot
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not pokemonId or not moveSlot or not playerId then
        return {
            success = false,
            error = "Missing required parameters: pokemonId, moveSlot, and playerId"
        }
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return {
            success = false,
            error = error or "Pokemon not found or access denied"
        }
    end
    
    local updatedPokemon, result = MoveManager.forgetMove(pokemon, moveSlot)
    
    if not result.success then
        return {
            success = false,
            error = result.message
        }
    end
    
    -- Update storage
    PokemonStorage.update(pokemonId, updatedPokemon)
    
    return {
        success = true,
        pokemon = updatedPokemon,
        forgottenMove = result.forgottenMove,
        message = result.message
    }
end

-- Use move in battle
stateHandlers["use-move"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local moveSlot = msg.Data and msg.Data.moveSlot
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not pokemonId or not moveSlot or not playerId then
        return {
            success = false,
            error = "Missing required parameters: pokemonId, moveSlot, and playerId"
        }
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return {
            success = false,
            error = error or "Pokemon not found or access denied"
        }
    end
    
    local updatedPokemon, result = MoveManager.useMove(pokemon, moveSlot)
    
    if not result.success then
        return {
            success = false,
            error = result.message
        }
    end
    
    -- Update storage
    PokemonStorage.update(pokemonId, updatedPokemon)
    
    return {
        success = true,
        pokemon = updatedPokemon,
        move = result.move,
        ppRemaining = result.ppRemaining,
        message = result.message
    }
end

-- Restore Pokemon PP
stateHandlers["restore-pp"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local moveSlot = msg.Data and msg.Data.moveSlot  -- Optional, nil for all moves
    local amount = msg.Data and msg.Data.amount      -- Optional, nil for full restore
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not pokemonId or not playerId then
        return {
            success = false,
            error = "Missing required parameters: pokemonId and playerId"
        }
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return {
            success = false,
            error = error or "Pokemon not found or access denied"
        }
    end
    
    local updatedPokemon = MoveManager.restorePP(pokemon, moveSlot, amount)
    
    -- Update storage
    PokemonStorage.update(pokemonId, updatedPokemon)
    
    return {
        success = true,
        pokemon = updatedPokemon,
        message = "PP restored successfully"
    }
end

-- Transfer Pokemon ownership
stateHandlers["transfer-pokemon"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local toPlayerId = msg.Data and msg.Data.toPlayerId
    local fromPlayerId = msg.From or (msg.Data and msg.Data.fromPlayerId)
    
    if not pokemonId or not toPlayerId or not fromPlayerId then
        return {
            success = false,
            error = "Missing required parameters: pokemonId, toPlayerId, and fromPlayerId"
        }
    end
    
    local success, error = PokemonManager.transferOwnership(pokemonId, fromPlayerId, toPlayerId)
    
    if not success then
        return {
            success = false,
            error = error or "Failed to transfer Pokemon ownership"
        }
    end
    
    -- Update player indexes
    local pokemon = PokemonStorage.get(pokemonId)
    if pokemon then
        -- Remove from old player's collections
        PlayerIndex.removeFromParty(fromPlayerId, pokemonId)
        PlayerIndex.removeFromBox(fromPlayerId, pokemonId)
        PlayerIndex.removeFromDaycare(fromPlayerId, pokemonId)
        
        -- Initialize new player and add to their collection
        PlayerIndex.initializePlayer(toPlayerId)
        PlayerIndex.addToParty(toPlayerId, pokemonId)
    end
    
    return {
        success = true,
        pokemonId = pokemonId,
        fromPlayer = fromPlayerId,
        toPlayer = toPlayerId,
        message = "Pokemon transferred successfully"
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
    
    local handler = stateHandlers[action] or itemHandlers[action]
    if not handler then
        return {
            success = false,
            error = "Unknown action: " .. action
        }
    end
    
    -- Initialize dependencies
    AbilityDatabase.init()
    AbilityIndexes.init()
    ItemDatabase.init()
    ItemEffectsProcessor.init()
    InventoryManager.init()
    
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
    for action in pairs(itemHandlers) do
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

-- Held item management handlers

-- Assign held item to Pokemon
stateHandlers["assign-held-item"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local itemId = msg.Data and msg.Data.itemId
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not pokemonId or not itemId or not playerId then
        return {
            success = false,
            error = "Missing required parameters: pokemonId, itemId, and playerId"
        }
    end
    
    local success, result = HeldItemManager.assignHeldItem(pokemonId, itemId, playerId)
    
    if not success then
        return {
            success = false,
            error = result
        }
    end
    
    return {
        success = true,
        result = result
    }
end

-- Unequip held item from Pokemon
stateHandlers["unequip-held-item"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not pokemonId or not playerId then
        return {
            success = false,
            error = "Missing required parameters: pokemonId and playerId"
        }
    end
    
    local success, result = HeldItemManager.unequipHeldItem(pokemonId, playerId)
    
    if not success then
        return {
            success = false,
            error = result
        }
    end
    
    return {
        success = true,
        result = result
    }
end

-- Swap held items between Pokemon
stateHandlers["swap-held-items"] = function(msg)
    local pokemonId1 = msg.Data and msg.Data.pokemonId1
    local pokemonId2 = msg.Data and msg.Data.pokemonId2
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not pokemonId1 or not pokemonId2 or not playerId then
        return {
            success = false,
            error = "Missing required parameters: pokemonId1, pokemonId2, and playerId"
        }
    end
    
    local success, result = HeldItemManager.swapHeldItems(pokemonId1, pokemonId2, playerId)
    
    if not success then
        return {
            success = false,
            error = result
        }
    end
    
    return {
        success = true,
        result = result
    }
end

-- Swap held item between Pokemon and inventory
stateHandlers["swap-pokemon-inventory-held-item"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local itemId = msg.Data and msg.Data.itemId -- Can be nil to just unequip
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not pokemonId or not playerId then
        return {
            success = false,
            error = "Missing required parameters: pokemonId and playerId"
        }
    end
    
    local success, result = HeldItemManager.swapPokemonInventoryHeldItem(pokemonId, itemId, playerId)
    
    if not success then
        return {
            success = false,
            error = result
        }
    end
    
    return {
        success = true,
        result = result
    }
end

-- Get Pokemon held item information
stateHandlers["get-pokemon-held-item"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    
    if not pokemonId then
        return {
            success = false,
            error = "Missing required parameter: pokemonId"
        }
    end
    
    local success, result = HeldItemManager.getHeldItemInfo(pokemonId)
    
    if not success then
        return {
            success = false,
            error = result
        }
    end
    
    return {
        success = true,
        heldItemInfo = result
    }
end

-- Get all Pokemon with held items for player
stateHandlers["get-player-pokemon-held-items"] = function(msg)
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not playerId then
        return {
            success = false,
            error = "Missing required parameter: playerId"
        }
    end
    
    local success, result = HeldItemManager.getPokemonWithHeldItems(playerId)
    
    if not success then
        return {
            success = false,
            error = result
        }
    end
    
    return {
        success = true,
        pokemonWithHeldItems = result
    }
end

-- Validate held item consistency for player
stateHandlers["validate-held-item-consistency"] = function(msg)
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not playerId then
        return {
            success = false,
            error = "Missing required parameter: playerId"
        }
    end
    
    local success, result = HeldItemManager.validatePlayerHeldItemConsistency(playerId)
    
    if not success then
        return {
            success = false,
            error = result
        }
    end
    
    return {
        success = true,
        validation = result
    }
end

-- Get held item statistics
stateHandlers["get-held-item-statistics"] = function(msg)
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not playerId then
        return {
            success = false,
            error = "Missing required parameter: playerId"
        }
    end
    
    local success, result = HeldItemManager.getHeldItemStatistics(playerId)
    
    if not success then
        return {
            success = false,
            error = result
        }
    end
    
    return {
        success = true,
        statistics = result
    }
end

return StateHandler