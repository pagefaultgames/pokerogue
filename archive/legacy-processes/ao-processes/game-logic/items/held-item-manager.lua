--[[
Held Item Manager
Manages Pokemon held item assignment, validation, and persistence

Features:
- Single held item per Pokemon validation with proper error handling
- Held item swap functionality between Pokemon and inventory
- Held item equipping with inventory validation and transaction logging
- Held item unequipping with proper inventory return
- Held item assignment persistence for save/load integration
- Held item assignment validation and consistency checking

Behavioral Parity Requirements:
- Never use Lua's math.random() - ALWAYS use AO crypto module
- All held item stat modifications must match TypeScript implementation exactly
- Never hardcode held item data - always reference item database tables
- All AO message responses must include success boolean for proper error handling
- Held item effect activation and stat modifications must be deterministic and reproducible
--]]

local HeldItemManager = {}

-- Import required modules
local ItemDatabase = require("data.items.item-database")
local InventoryManager = require("game-logic.items.inventory-manager")
local PokemonStorage = require("data.pokemon-instances.pokemon-storage")
local Enums = require("data.constants.enums")
local CryptoRNG = require("game-logic.rng.crypto-rng")

-- Constants
local MAX_HELD_ITEMS_PER_POKEMON = 1

-- Held item assignment validation

-- Validate if an item can be held by a Pokemon
-- @param itemId: Item ID to validate
-- @return: Boolean indicating if item is valid held item, error message if not
function HeldItemManager.validateHeldItem(itemId)
    if not itemId or type(itemId) ~= "string" then
        return false, "Item ID must be a non-empty string"
    end
    
    -- Get item data from database
    local itemData = ItemDatabase.getItem(itemId)
    if not itemData then
        return false, "Item not found in database: " .. itemId
    end
    
    -- Check if item is categorized as held item
    if itemData.category ~= "held_item" then
        return false, "Item is not a held item: " .. itemId .. " (category: " .. (itemData.category or "unknown") .. ")"
    end
    
    -- Additional validation - item must not be stackable for held items
    if itemData.stackable == true then
        return false, "Held items cannot be stackable: " .. itemId
    end
    
    return true
end

-- Validate Pokemon can hold an item
-- @param pokemonId: Pokemon ID to validate
-- @return: Boolean indicating if Pokemon exists and can hold items, error message if not
function HeldItemManager.validatePokemonForHeldItem(pokemonId)
    if not pokemonId or type(pokemonId) ~= "string" then
        return false, "Pokemon ID must be a non-empty string"
    end
    
    -- Check if Pokemon exists in storage
    local pokemonData = PokemonStorage.getPokemon(pokemonId)
    if not pokemonData then
        return false, "Pokemon not found: " .. pokemonId
    end
    
    -- Validate Pokemon has required fields
    if not pokemonData.speciesId then
        return false, "Pokemon missing species data: " .. pokemonId
    end
    
    return true, pokemonData
end

-- Check if Pokemon already has a held item
-- @param pokemonId: Pokemon ID to check
-- @return: Boolean indicating if Pokemon has held item, current held item ID or nil
function HeldItemManager.getPokemonHeldItem(pokemonId)
    local valid, pokemonData = HeldItemManager.validatePokemonForHeldItem(pokemonId)
    if not valid then
        return false, nil, pokemonData -- pokemonData contains error message
    end
    
    return true, pokemonData.heldItem
end

-- Held item assignment operations

-- Assign a held item to a Pokemon
-- @param pokemonId: Pokemon ID to assign item to
-- @param itemId: Item ID to assign
-- @param playerId: Player ID for inventory validation and transaction logging
-- @param quantity: Quantity to assign (defaults to 1, must be 1 for held items)
-- @return: Success boolean, result data or error message
function HeldItemManager.assignHeldItem(pokemonId, itemId, playerId, quantity)
    quantity = quantity or 1
    
    -- Validate inputs
    if quantity ~= 1 then
        return false, "Held items can only be assigned in quantity of 1, received: " .. tostring(quantity)
    end
    
    local validPokemon, pokemonDataOrError = HeldItemManager.validatePokemonForHeldItem(pokemonId)
    if not validPokemon then
        return false, pokemonDataOrError
    end
    
    local validItem, itemError = HeldItemManager.validateHeldItem(itemId)
    if not validItem then
        return false, itemError
    end
    
    if not playerId or type(playerId) ~= "string" then
        return false, "Player ID must be a non-empty string"
    end
    
    local pokemonData = pokemonDataOrError
    
    -- Check if Pokemon already has a held item
    if pokemonData.heldItem then
        return false, "Pokemon " .. pokemonId .. " already has held item: " .. pokemonData.heldItem .. ". Use swapHeldItem or unequipHeldItem first."
    end
    
    -- Validate player has item in inventory
    local hasItem, itemCount = InventoryManager.hasItem(playerId, itemId)
    if not hasItem or itemCount < 1 then
        return false, "Player " .. playerId .. " does not have item " .. itemId .. " in inventory"
    end
    
    -- Remove item from inventory
    local removeSuccess, removeError = InventoryManager.removeItem(playerId, itemId, 1)
    if not removeSuccess then
        return false, "Failed to remove item from inventory: " .. (removeError or "unknown error")
    end
    
    -- Assign held item to Pokemon
    pokemonData.heldItem = itemId
    
    -- Save updated Pokemon data
    local saveSuccess, saveError = PokemonStorage.savePokemon(pokemonId, pokemonData)
    if not saveSuccess then
        -- Rollback inventory change
        InventoryManager.addItem(playerId, itemId, 1)
        return false, "Failed to save Pokemon data: " .. (saveError or "unknown error")
    end
    
    return true, {
        pokemonId = pokemonId,
        itemId = itemId,
        playerId = playerId,
        previousHeldItem = nil,
        action = "assign"
    }
end

-- Unequip held item from Pokemon and return to inventory
-- @param pokemonId: Pokemon ID to unequip item from
-- @param playerId: Player ID for inventory return
-- @return: Success boolean, result data or error message
function HeldItemManager.unequipHeldItem(pokemonId, playerId)
    -- Validate inputs
    local validPokemon, pokemonDataOrError = HeldItemManager.validatePokemonForHeldItem(pokemonId)
    if not validPokemon then
        return false, pokemonDataOrError
    end
    
    if not playerId or type(playerId) ~= "string" then
        return false, "Player ID must be a non-empty string"
    end
    
    local pokemonData = pokemonDataOrError
    
    -- Check if Pokemon has a held item
    if not pokemonData.heldItem then
        return false, "Pokemon " .. pokemonId .. " does not have a held item to unequip"
    end
    
    local currentHeldItem = pokemonData.heldItem
    
    -- Add item back to inventory
    local addSuccess, addError = InventoryManager.addItem(playerId, currentHeldItem, 1)
    if not addSuccess then
        return false, "Failed to add item to inventory: " .. (addError or "unknown error")
    end
    
    -- Remove held item from Pokemon
    pokemonData.heldItem = nil
    
    -- Save updated Pokemon data
    local saveSuccess, saveError = PokemonStorage.savePokemon(pokemonId, pokemonData)
    if not saveSuccess then
        -- Rollback inventory change
        InventoryManager.removeItem(playerId, currentHeldItem, 1)
        return false, "Failed to save Pokemon data: " .. (saveError or "unknown error")
    end
    
    return true, {
        pokemonId = pokemonId,
        itemId = currentHeldItem,
        playerId = playerId,
        previousHeldItem = currentHeldItem,
        action = "unequip"
    }
end

-- Swap held items between two Pokemon
-- @param pokemonId1: First Pokemon ID
-- @param pokemonId2: Second Pokemon ID  
-- @param playerId: Player ID for transaction logging
-- @return: Success boolean, result data or error message
function HeldItemManager.swapHeldItems(pokemonId1, pokemonId2, playerId)
    -- Validate inputs
    local validPokemon1, pokemon1DataOrError = HeldItemManager.validatePokemonForHeldItem(pokemonId1)
    if not validPokemon1 then
        return false, "Pokemon 1 validation failed: " .. pokemon1DataOrError
    end
    
    local validPokemon2, pokemon2DataOrError = HeldItemManager.validatePokemonForHeldItem(pokemonId2)
    if not validPokemon2 then
        return false, "Pokemon 2 validation failed: " .. pokemon2DataOrError
    end
    
    if not playerId or type(playerId) ~= "string" then
        return false, "Player ID must be a non-empty string"
    end
    
    local pokemon1Data = pokemon1DataOrError
    local pokemon2Data = pokemon2DataOrError
    
    -- Get current held items
    local item1 = pokemon1Data.heldItem
    local item2 = pokemon2Data.heldItem
    
    -- At least one Pokemon must have a held item for swap to be meaningful
    if not item1 and not item2 then
        return false, "Both Pokemon have no held items - nothing to swap"
    end
    
    -- Perform the swap
    pokemon1Data.heldItem = item2
    pokemon2Data.heldItem = item1
    
    -- Save both Pokemon data atomically
    local save1Success, save1Error = PokemonStorage.savePokemon(pokemonId1, pokemon1Data)
    if not save1Success then
        return false, "Failed to save Pokemon 1 data: " .. (save1Error or "unknown error")
    end
    
    local save2Success, save2Error = PokemonStorage.savePokemon(pokemonId2, pokemon2Data)
    if not save2Success then
        -- Rollback Pokemon 1 change
        pokemon1Data.heldItem = item1
        PokemonStorage.savePokemon(pokemonId1, pokemon1Data)
        return false, "Failed to save Pokemon 2 data: " .. (save2Error or "unknown error")
    end
    
    return true, {
        pokemon1Id = pokemonId1,
        pokemon2Id = pokemonId2,
        pokemon1PreviousItem = item1,
        pokemon2PreviousItem = item2,
        pokemon1NewItem = item2,
        pokemon2NewItem = item1,
        playerId = playerId,
        action = "swap"
    }
end

-- Swap held item between Pokemon and inventory
-- @param pokemonId: Pokemon ID 
-- @param itemId: Item ID from inventory to assign (nil to just unequip)
-- @param playerId: Player ID for inventory transactions
-- @return: Success boolean, result data or error message
function HeldItemManager.swapPokemonInventoryHeldItem(pokemonId, itemId, playerId)
    -- Validate inputs
    local validPokemon, pokemonDataOrError = HeldItemManager.validatePokemonForHeldItem(pokemonId)
    if not validPokemon then
        return false, pokemonDataOrError
    end
    
    if not playerId or type(playerId) ~= "string" then
        return false, "Player ID must be a non-empty string"
    end
    
    -- If itemId is provided, validate it
    if itemId then
        local validItem, itemError = HeldItemManager.validateHeldItem(itemId)
        if not validItem then
            return false, itemError
        end
        
        -- Validate player has item in inventory
        local hasItem, itemCount = InventoryManager.hasItem(playerId, itemId)
        if not hasItem or itemCount < 1 then
            return false, "Player " .. playerId .. " does not have item " .. itemId .. " in inventory"
        end
    end
    
    local pokemonData = pokemonDataOrError
    local currentHeldItem = pokemonData.heldItem
    
    -- If Pokemon has held item, return it to inventory
    if currentHeldItem then
        local addSuccess, addError = InventoryManager.addItem(playerId, currentHeldItem, 1)
        if not addSuccess then
            return false, "Failed to add current held item to inventory: " .. (addError or "unknown error")
        end
    end
    
    -- If new item provided, remove from inventory and assign to Pokemon
    if itemId then
        local removeSuccess, removeError = InventoryManager.removeItem(playerId, itemId, 1)
        if not removeSuccess then
            -- Rollback - remove previously added item
            if currentHeldItem then
                InventoryManager.removeItem(playerId, currentHeldItem, 1)
            end
            return false, "Failed to remove new item from inventory: " .. (removeError or "unknown error")
        end
        
        pokemonData.heldItem = itemId
    else
        pokemonData.heldItem = nil
    end
    
    -- Save updated Pokemon data
    local saveSuccess, saveError = PokemonStorage.savePokemon(pokemonId, pokemonData)
    if not saveSuccess then
        -- Rollback inventory changes
        if currentHeldItem then
            InventoryManager.removeItem(playerId, currentHeldItem, 1)
        end
        if itemId then
            InventoryManager.addItem(playerId, itemId, 1)
        end
        return false, "Failed to save Pokemon data: " .. (saveError or "unknown error")
    end
    
    return true, {
        pokemonId = pokemonId,
        previousHeldItem = currentHeldItem,
        newHeldItem = itemId,
        playerId = playerId,
        action = "inventory_swap"
    }
end

-- Held item query and validation functions

-- Get all Pokemon with held items for a player
-- @param playerId: Player ID to query
-- @return: Success boolean, array of Pokemon with held items or error message
function HeldItemManager.getPokemonWithHeldItems(playerId)
    if not playerId or type(playerId) ~= "string" then
        return false, "Player ID must be a non-empty string"
    end
    
    -- Get all Pokemon for player (implementation depends on storage system)
    local playerPokemon = PokemonStorage.getPlayerPokemon(playerId)
    if not playerPokemon then
        return true, {} -- Empty result is valid
    end
    
    local pokemonWithHeldItems = {}
    
    for pokemonId, pokemonData in pairs(playerPokemon) do
        if pokemonData.heldItem then
            table.insert(pokemonWithHeldItems, {
                pokemonId = pokemonId,
                heldItem = pokemonData.heldItem,
                speciesId = pokemonData.speciesId,
                nickname = pokemonData.nickname or pokemonData.name
            })
        end
    end
    
    return true, pokemonWithHeldItems
end

-- Validate held item assignment consistency for a player
-- @param playerId: Player ID to validate
-- @return: Success boolean, validation report or error message
function HeldItemManager.validatePlayerHeldItemConsistency(playerId)
    if not playerId or type(playerId) ~= "string" then
        return false, "Player ID must be a non-empty string"
    end
    
    local playerPokemon = PokemonStorage.getPlayerPokemon(playerId)
    if not playerPokemon then
        return true, {
            valid = true,
            pokemonCount = 0,
            heldItemCount = 0,
            issues = {}
        }
    end
    
    local issues = {}
    local heldItemCount = 0
    local pokemonCount = 0
    
    for pokemonId, pokemonData in pairs(playerPokemon) do
        pokemonCount = pokemonCount + 1
        
        if pokemonData.heldItem then
            heldItemCount = heldItemCount + 1
            
            -- Validate held item exists in database
            local validItem, itemError = HeldItemManager.validateHeldItem(pokemonData.heldItem)
            if not validItem then
                table.insert(issues, {
                    type = "invalid_held_item",
                    pokemonId = pokemonId,
                    heldItem = pokemonData.heldItem,
                    error = itemError
                })
            end
        end
    end
    
    return true, {
        valid = #issues == 0,
        pokemonCount = pokemonCount,
        heldItemCount = heldItemCount,
        issues = issues
    }
end

-- Batch operations for held item management

-- Assign held items to multiple Pokemon from inventory
-- @param assignments: Array of {pokemonId, itemId} assignment pairs
-- @param playerId: Player ID for inventory transactions
-- @return: Success boolean, batch results or error message
function HeldItemManager.batchAssignHeldItems(assignments, playerId)
    if not assignments or type(assignments) ~= "table" then
        return false, "Assignments must be a table/array"
    end
    
    if not playerId or type(playerId) ~= "string" then
        return false, "Player ID must be a non-empty string"
    end
    
    local results = {}
    local completedAssignments = {}
    
    -- Validate all assignments first
    for i, assignment in ipairs(assignments) do
        if type(assignment) ~= "table" then
            return false, "Assignment " .. i .. " must be a table"
        end
        
        local pokemonId = assignment.pokemonId
        local itemId = assignment.itemId
        
        if not pokemonId or not itemId then
            return false, "Assignment " .. i .. " missing pokemonId or itemId"
        end
        
        -- Pre-validate assignment
        local validPokemon, pokemonError = HeldItemManager.validatePokemonForHeldItem(pokemonId)
        if not validPokemon then
            return false, "Assignment " .. i .. " Pokemon validation failed: " .. pokemonError
        end
        
        local validItem, itemError = HeldItemManager.validateHeldItem(itemId)
        if not validItem then
            return false, "Assignment " .. i .. " Item validation failed: " .. itemError
        end
    end
    
    -- Execute assignments
    for i, assignment in ipairs(assignments) do
        local success, result = HeldItemManager.assignHeldItem(assignment.pokemonId, assignment.itemId, playerId)
        
        results[i] = {
            pokemonId = assignment.pokemonId,
            itemId = assignment.itemId,
            success = success,
            result = result
        }
        
        if success then
            table.insert(completedAssignments, i)
        else
            -- Rollback all completed assignments
            for j = #completedAssignments, 1, -1 do
                local rollbackIndex = completedAssignments[j]
                local rollbackAssignment = assignments[rollbackIndex]
                HeldItemManager.unequipHeldItem(rollbackAssignment.pokemonId, playerId)
            end
            
            return false, {
                error = "Batch assignment failed at assignment " .. i .. ": " .. result,
                results = results,
                completedCount = #completedAssignments
            }
        end
    end
    
    return true, {
        results = results,
        successCount = #assignments,
        totalCount = #assignments
    }
end

-- Persistence and save/load integration

-- Serialize held item assignments for save data
-- @param playerId: Player ID to serialize
-- @return: Success boolean, serialized held item data or error message
function HeldItemManager.serializeHeldItemAssignments(playerId)
    if not playerId or type(playerId) ~= "string" then
        return false, "Player ID must be a non-empty string"
    end
    
    local success, pokemonWithHeldItems = HeldItemManager.getPokemonWithHeldItems(playerId)
    if not success then
        return false, pokemonWithHeldItems
    end
    
    local serializedData = {
        version = "1.0",
        playerId = playerId,
        assignments = {}
    }
    
    for _, pokemon in ipairs(pokemonWithHeldItems) do
        table.insert(serializedData.assignments, {
            pokemonId = pokemon.pokemonId,
            heldItem = pokemon.heldItem,
            speciesId = pokemon.speciesId
        })
    end
    
    return true, serializedData
end

-- Load held item assignments from save data
-- @param serializedData: Previously serialized held item data
-- @param playerId: Player ID for validation
-- @return: Success boolean, load results or error message
function HeldItemManager.loadHeldItemAssignments(serializedData, playerId)
    if not serializedData or type(serializedData) ~= "table" then
        return false, "Serialized data must be a table"
    end
    
    if not playerId or type(playerId) ~= "string" then
        return false, "Player ID must be a non-empty string"
    end
    
    if serializedData.playerId ~= playerId then
        return false, "Serialized data player ID mismatch: expected " .. playerId .. ", got " .. (serializedData.playerId or "nil")
    end
    
    if not serializedData.assignments then
        return true, { loadedCount = 0, skippedCount = 0, errorCount = 0 } -- No assignments to load
    end
    
    local loadResults = {
        loadedCount = 0,
        skippedCount = 0,
        errorCount = 0,
        errors = {}
    }
    
    for i, assignment in ipairs(serializedData.assignments) do
        local pokemonId = assignment.pokemonId
        local heldItem = assignment.heldItem
        
        -- Validate Pokemon still exists
        local validPokemon, pokemonData = HeldItemManager.validatePokemonForHeldItem(pokemonId)
        if not validPokemon then
            loadResults.errorCount = loadResults.errorCount + 1
            table.insert(loadResults.errors, {
                pokemonId = pokemonId,
                error = "Pokemon not found: " .. pokemonData
            })
        else
            -- Restore held item assignment directly (bypass inventory since this is load)
            pokemonData.heldItem = heldItem
            local saveSuccess, saveError = PokemonStorage.savePokemon(pokemonId, pokemonData)
            
            if saveSuccess then
                loadResults.loadedCount = loadResults.loadedCount + 1
            else
                loadResults.errorCount = loadResults.errorCount + 1
                table.insert(loadResults.errors, {
                    pokemonId = pokemonId,
                    error = "Failed to restore held item: " .. (saveError or "unknown error")
                })
            end
        end
    end
    
    return true, loadResults
end

-- Utility functions

-- Get held item information for display/debugging
-- @param pokemonId: Pokemon ID to get held item info for
-- @return: Success boolean, held item info or error message
function HeldItemManager.getHeldItemInfo(pokemonId)
    local validPokemon, pokemonDataOrError = HeldItemManager.validatePokemonForHeldItem(pokemonId)
    if not validPokemon then
        return false, pokemonDataOrError
    end
    
    local pokemonData = pokemonDataOrError
    
    if not pokemonData.heldItem then
        return true, {
            hasHeldItem = false,
            heldItemId = nil,
            heldItemData = nil,
            pokemonId = pokemonId
        }
    end
    
    local itemData = ItemDatabase.getItem(pokemonData.heldItem)
    
    return true, {
        hasHeldItem = true,
        heldItemId = pokemonData.heldItem,
        heldItemData = itemData,
        pokemonId = pokemonId,
        canUnequip = true
    }
end

-- Get statistics about held item usage
-- @param playerId: Player ID to get statistics for
-- @return: Success boolean, statistics or error message  
function HeldItemManager.getHeldItemStatistics(playerId)
    if not playerId or type(playerId) ~= "string" then
        return false, "Player ID must be a non-empty string"
    end
    
    local success, pokemonWithHeldItems = HeldItemManager.getPokemonWithHeldItems(playerId)
    if not success then
        return false, pokemonWithHeldItems
    end
    
    local stats = {
        totalPokemonWithHeldItems = #pokemonWithHeldItems,
        itemUsageCounts = {},
        categoryUsageCounts = {}
    }
    
    for _, pokemon in ipairs(pokemonWithHeldItems) do
        local itemId = pokemon.heldItem
        
        -- Count item usage
        stats.itemUsageCounts[itemId] = (stats.itemUsageCounts[itemId] or 0) + 1
        
        -- Count category usage
        local itemData = ItemDatabase.getItem(itemId)
        if itemData then
            local category = itemData.category or "unknown"
            stats.categoryUsageCounts[category] = (stats.categoryUsageCounts[category] or 0) + 1
        end
    end
    
    return true, stats
end

return HeldItemManager