--[[
Item Management Handler
Processes item management operations and queries for the Economic Process

Features:
- Item addition and removal operations with validation
- Inventory operations and queries for UI and agent support
- Cross-process item usage tracking and synchronization
- Item effect processing coordination with Pokemon process
- Inventory consistency validation across process boundaries

Integration:
- Uses InventoryManager for core inventory operations
- Uses TransactionAuditSystem for operation logging
- Uses MessageCorrelator for inter-process communication tracking
- Uses EconomicSystem for integrity validation
--]]

local ItemManagementHandler = {}

-- Dependencies
local InventoryManager = require("economy.components.inventory-manager")
local TransactionAuditSystem = require("economy.components.transaction-audit-system")
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local EconomicSystem = require("economy.components.economic-system")

-- Operation type constants
local OPERATION_TYPES = {
    ADD_ITEM = "ADD_ITEM",
    REMOVE_ITEM = "REMOVE_ITEM",
    USE_ITEM = "USE_ITEM",
    QUERY_INVENTORY = "QUERY_INVENTORY",
    QUERY_ITEM_QUANTITY = "QUERY_ITEM_QUANTITY",
    TRANSFER_ITEM = "TRANSFER_ITEM",
    VALIDATE_INVENTORY = "VALIDATE_INVENTORY"
}

-- Process item management message
function ItemManagementHandler.process(msg)
    local startTime = msg.Timestamp
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return json.encode({
            success = false,
            error = "Invalid JSON data",
            timestamp = startTime
        })
    end
    
    -- Validate required fields
    if not data.correlation or not data.correlation.id then
        return json.encode({
            success = false,
            error = "Missing correlation ID",
            timestamp = startTime
        })
    end
    
    local correlationId = data.correlation.id
    local operationType = data.operationType or "UNKNOWN"
    
    -- Log operation start
    TransactionAuditSystem.logTransactionStart(correlationId, {
        type = "ITEM_MANAGEMENT",
        subtype = operationType,
        playerId = msg.From,
        timestamp = startTime
    })
    
    local response = {}
    
    -- Route to appropriate operation handler
    if operationType == OPERATION_TYPES.ADD_ITEM then
        response = ItemManagementHandler.addItem(data, msg.From, correlationId)
    elseif operationType == OPERATION_TYPES.REMOVE_ITEM then
        response = ItemManagementHandler.removeItem(data, msg.From, correlationId)
    elseif operationType == OPERATION_TYPES.USE_ITEM then
        response = ItemManagementHandler.useItem(data, msg.From, correlationId)
    elseif operationType == OPERATION_TYPES.QUERY_INVENTORY then
        response = ItemManagementHandler.queryInventory(data, msg.From, correlationId)
    elseif operationType == OPERATION_TYPES.QUERY_ITEM_QUANTITY then
        response = ItemManagementHandler.queryItemQuantity(data, msg.From, correlationId)
    elseif operationType == OPERATION_TYPES.VALIDATE_INVENTORY then
        response = ItemManagementHandler.validateInventory(data, msg.From, correlationId)
    else
        response = {
            success = false,
            error = "Unknown operation type: " .. operationType,
            correlation = { id = correlationId, responseType = "ITEM_MANAGEMENT_ERROR" }
        }
    end
    
    -- Calculate processing time
    local endTime = 0
    local latency = endTime - startTime
    
    -- Log operation completion
    TransactionAuditSystem.logTransactionComplete(correlationId, {
        success = response.success,
        latency = latency,
        timestamp = endTime
    })
    
    -- Add processing metadata
    response.processing = {
        latency = latency,
        timestamp = endTime
    }
    
    return json.encode(response)
end

-- Add item to player inventory
function ItemManagementHandler.addItem(data, playerId, correlationId)
    -- Validate item data
    if not data.itemData then
        return {
            success = false,
            error = "Missing item data",
            correlation = { id = correlationId, responseType = "ADD_ITEM_ERROR" }
        }
    end
    
    local itemData = data.itemData
    local itemId = itemData.itemId
    local quantity = itemData.quantity or 1
    local reason = itemData.reason or "Item management operation"
    
    -- Validate parameters
    if not itemId then
        return {
            success = false,
            error = "Missing item ID",
            correlation = { id = correlationId, responseType = "ADD_ITEM_ERROR" }
        }
    end
    
    local validQuantity, quantityError = EconomicSystem.validateItemQuantity(itemId, quantity)
    if not validQuantity then
        return {
            success = false,
            error = quantityError,
            correlation = { id = correlationId, responseType = "ADD_ITEM_ERROR" }
        }
    end
    
    -- Add item through InventoryManager
    local success, message, finalQuantity = InventoryManager.addItem(playerId, itemId, quantity, reason)
    
    if not success then
        return {
            success = false,
            error = message,
            correlation = { id = correlationId, responseType = "ADD_ITEM_ERROR" }
        }
    end
    
    -- Get updated inventory state
    local inventory = InventoryManager.getInventory(playerId)
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "ADD_ITEM_SUCCESS" },
        result = {
            itemId = itemId,
            quantity = finalQuantity,
            inventoryUpdates = {
                itemQuantity = finalQuantity,
                totalItems = inventory.totalItems,
                inventorySpace = inventory.capacity - inventory.totalItems
            }
        }
    }
end

-- Remove item from player inventory
function ItemManagementHandler.removeItem(data, playerId, correlationId)
    -- Validate item data
    if not data.itemData then
        return {
            success = false,
            error = "Missing item data",
            correlation = { id = correlationId, responseType = "REMOVE_ITEM_ERROR" }
        }
    end
    
    local itemData = data.itemData
    local itemId = itemData.itemId
    local quantity = itemData.quantity or 1
    local reason = itemData.reason or "Item management operation"
    
    -- Validate parameters
    if not itemId then
        return {
            success = false,
            error = "Missing item ID",
            correlation = { id = correlationId, responseType = "REMOVE_ITEM_ERROR" }
        }
    end
    
    if quantity <= 0 then
        return {
            success = false,
            error = "Invalid quantity",
            correlation = { id = correlationId, responseType = "REMOVE_ITEM_ERROR" }
        }
    end
    
    -- Remove item through InventoryManager
    local success, message, remainingQuantity = InventoryManager.removeItem(playerId, itemId, quantity, reason)
    
    if not success then
        return {
            success = false,
            error = message,
            correlation = { id = correlationId, responseType = "REMOVE_ITEM_ERROR" }
        }
    end
    
    -- Get updated inventory state
    local inventory = InventoryManager.getInventory(playerId)
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "REMOVE_ITEM_SUCCESS" },
        result = {
            itemId = itemId,
            removedQuantity = quantity,
            remainingQuantity = remainingQuantity,
            inventoryUpdates = {
                itemQuantity = remainingQuantity,
                totalItems = inventory.totalItems,
                inventorySpace = inventory.capacity - inventory.totalItems
            }
        }
    }
end

-- Use consumable item
function ItemManagementHandler.useItem(data, playerId, correlationId)
    -- Validate item data
    if not data.itemData then
        return {
            success = false,
            error = "Missing item data",
            correlation = { id = correlationId, responseType = "USE_ITEM_ERROR" }
        }
    end
    
    local itemData = data.itemData
    local itemId = itemData.itemId
    local quantity = itemData.quantity or 1
    local reason = itemData.reason or "Item used"
    
    -- Validate parameters
    if not itemId then
        return {
            success = false,
            error = "Missing item ID",
            correlation = { id = correlationId, responseType = "USE_ITEM_ERROR" }
        }
    end
    
    -- Use item through InventoryManager
    local success, message, remainingQuantity = InventoryManager.useItem(playerId, itemId, quantity, reason)
    
    if not success then
        return {
            success = false,
            error = message,
            correlation = { id = correlationId, responseType = "USE_ITEM_ERROR" }
        }
    end
    
    -- Get updated inventory state
    local inventory = InventoryManager.getInventory(playerId)
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "USE_ITEM_SUCCESS" },
        result = {
            itemId = itemId,
            usedQuantity = quantity,
            remainingQuantity = remainingQuantity,
            inventoryUpdates = {
                itemQuantity = remainingQuantity,
                totalItems = inventory.totalItems,
                inventorySpace = inventory.capacity - inventory.totalItems
            }
        }
    }
end

-- Query player inventory
function ItemManagementHandler.queryInventory(data, playerId, correlationId)
    local category = data.category -- Optional category filter
    local includeStats = data.includeStats or false
    
    -- Get inventory data
    local inventory = InventoryManager.getInventory(playerId)
    
    local result = {
        inventory = {
            items = inventory.items,
            capacity = inventory.capacity,
            totalItems = inventory.totalItems,
            money = inventory.money,
            lastModified = inventory.lastModified
        }
    }
    
    -- Add categorized items if requested
    if category then
        result.categorizedItems = InventoryManager.getItemsByCategory(playerId, category)
    end
    
    -- Add statistics if requested
    if includeStats then
        result.stats = InventoryManager.getInventoryStats(playerId)
    end
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "INVENTORY_QUERY_SUCCESS" },
        result = result
    }
end

-- Query specific item quantity
function ItemManagementHandler.queryItemQuantity(data, playerId, correlationId)
    -- Validate item query
    if not data.itemId then
        return {
            success = false,
            error = "Missing item ID",
            correlation = { id = correlationId, responseType = "ITEM_QUERY_ERROR" }
        }
    end
    
    local itemId = data.itemId
    local quantity = InventoryManager.getItemQuantity(playerId, itemId)
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "ITEM_QUERY_SUCCESS" },
        result = {
            itemId = itemId,
            quantity = quantity,
            hasItem = quantity > 0
        }
    }
end

-- Validate inventory integrity
function ItemManagementHandler.validateInventory(data, playerId, correlationId)
    local valid, errors = InventoryManager.validateInventory(playerId)
    
    return {
        success = valid,
        correlation = { id = correlationId, responseType = "INVENTORY_VALIDATION_RESULT" },
        result = {
            valid = valid,
            errors = errors,
            playerID = playerId
        }
    }
end

-- Get transaction history for player
function ItemManagementHandler.getTransactionHistory(data, playerId, correlationId)
    local limit = data.limit or 50
    local transactions = InventoryManager.getTransactionHistory(playerId, limit)
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "TRANSACTION_HISTORY_SUCCESS" },
        result = {
            transactions = transactions,
            count = #transactions
        }
    }
end

-- Berry-specific operations
function ItemManagementHandler.getBerryStats(data, playerId, correlationId)
    local berryStats = InventoryManager.getBerryStats(playerId)
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "BERRY_STATS_SUCCESS" },
        result = berryStats
    }
end

function ItemManagementHandler.getBerriesByActivation(data, playerId, correlationId)
    local activationCondition = data.activationCondition
    if not activationCondition then
        return {
            success = false,
            error = "Missing activation condition",
            correlation = { id = correlationId, responseType = "BERRY_QUERY_ERROR" }
        }
    end
    
    local berries = InventoryManager.getBerriesByActivation(playerId, activationCondition)
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "BERRY_QUERY_SUCCESS" },
        result = {
            berries = berries,
            activationCondition = activationCondition,
            count = #berries
        }
    }
end

return ItemManagementHandler