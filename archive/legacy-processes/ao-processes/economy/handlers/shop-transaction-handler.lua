--[[
Shop Transaction Handler
Processes shop purchase and sale operations for the Economic Process

Features:
- Shop purchase transaction processing with validation
- Shop sale transaction processing with pricing verification  
- Bulk purchase operations with transaction batching
- Economic balance validation and anti-cheat protection
- Transaction correlation for audit trail and coordinator integration

Integration:
- Uses ShopManager for transaction processing logic
- Uses TransactionAuditSystem for comprehensive logging
- Uses MessageCorrelator for inter-process communication tracking
- Uses ProcessAuthenticator for transaction security validation
--]]

local ShopTransactionHandler = {}

-- Dependencies
local ShopManager = require("economy.components.shop-manager")
local TransactionAuditSystem = require("economy.components.transaction-audit-system")
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local EconomicSystem = require("economy.components.economic-system")

-- Transaction validation constants
local TRANSACTION_LIMITS = {
    MAX_PURCHASE_QUANTITY = 99,
    MAX_BULK_ITEMS = 20,
    MIN_TRANSACTION_VALUE = 1,
    MAX_TRANSACTION_VALUE = 1000000
}

-- Process shop transaction message
function ShopTransactionHandler.process(msg)
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
    local transactionType = data.transactionType or "UNKNOWN"
    
    -- Log transaction start
    TransactionAuditSystem.logTransactionStart(correlationId, {
        type = "SHOP_TRANSACTION",
        subtype = transactionType,
        playerId = msg.From,
        timestamp = startTime
    })
    
    local response = {}
    
    -- Route to appropriate transaction handler
    if transactionType == "PURCHASE" then
        response = ShopTransactionHandler.processPurchase(data, msg.From, correlationId)
    elseif transactionType == "SALE" then
        response = ShopTransactionHandler.processSale(data, msg.From, correlationId)
    elseif transactionType == "BULK_PURCHASE" then
        response = ShopTransactionHandler.processBulkPurchase(data, msg.From, correlationId)
    else
        response = {
            success = false,
            error = "Unknown transaction type: " .. transactionType,
            correlation = { id = correlationId, responseType = "SHOP_ERROR" }
        }
    end
    
    -- Calculate processing time
    local endTime = 0
    local latency = endTime - startTime
    
    -- Log transaction completion
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

-- Process shop purchase transaction
function ShopTransactionHandler.processPurchase(data, playerId, correlationId)
    -- Validate purchase data structure
    if not data.purchaseData then
        return {
            success = false,
            error = "Missing purchase data",
            correlation = { id = correlationId, responseType = "PURCHASE_ERROR" }
        }
    end
    
    local purchaseData = data.purchaseData
    local itemId = purchaseData.itemId
    local quantity = purchaseData.quantity or 1
    local waveIndex = purchaseData.waveIndex or 1
    local maxPrice = purchaseData.maxPrice
    
    -- Validate purchase parameters
    if not itemId or quantity <= 0 or quantity > TRANSACTION_LIMITS.MAX_PURCHASE_QUANTITY then
        return {
            success = false,
            error = "Invalid purchase parameters",
            correlation = { id = correlationId, responseType = "PURCHASE_ERROR" }
        }
    end
    
    -- Validate economic state integrity
    local economicValid, economicError = EconomicSystem.validatePlayerEconomicState(playerId, waveIndex)
    if not economicValid then
        return {
            success = false,
            error = "Economic validation failed: " .. economicError,
            correlation = { id = correlationId, responseType = "PURCHASE_ERROR" }
        }
    end
    
    -- Get player data from coordinator if not provided
    local playerData = data.playerData
    
    -- Process purchase through ShopManager
    local success, message, actualQuantity
    if playerData then
        success, message, actualQuantity = ShopManager.purchaseItemWithProgression(
            playerId, itemId, quantity, waveIndex, playerData
        )
    else
        success, message, actualQuantity = ShopManager.purchaseItem(
            playerId, itemId, quantity, waveIndex
        )
    end
    
    if not success then
        return {
            success = false,
            error = message,
            correlation = { id = correlationId, responseType = "PURCHASE_ERROR" }
        }
    end
    
    -- Get updated inventory and money state
    local inventory = ShopManager.getInventory and ShopManager.getInventory(playerId) or {}
    local shopStats = ShopManager.getShopStats(playerId)
    
    -- Create transaction audit hash
    local auditData = {
        playerId = playerId,
        itemId = itemId,
        quantity = actualQuantity,
        waveIndex = waveIndex,
        timestamp = 0
    }
    local transactionHash = EconomicSystem.generateTransactionHash(auditData)
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "PURCHASE_SUCCESS" },
        result = {
            transactionId = correlationId .. "id_" .. msg.Timestamp,
            purchaseData = {
                itemId = itemId,
                quantity = actualQuantity,
                waveIndex = waveIndex
            },
            inventoryUpdates = {
                itemQuantity = inventory.items and inventory.items[itemId] and inventory.items[itemId].quantity or actualQuantity,
                remainingMoney = inventory.money or 0,
                inventorySpace = (inventory.capacity or 999) - (inventory.totalItems or 0)
            },
            shopStats = shopStats
        },
        auditData = {
            transactionHash = transactionHash,
            timestamp = 0
        }
    }
end

-- Process shop sale transaction
function ShopTransactionHandler.processSale(data, playerId, correlationId)
    -- Validate sale data structure
    if not data.saleData then
        return {
            success = false,
            error = "Missing sale data",
            correlation = { id = correlationId, responseType = "SALE_ERROR" }
        }
    end
    
    local saleData = data.saleData
    local itemId = saleData.itemId
    local quantity = saleData.quantity or 1
    local waveIndex = saleData.waveIndex or 1
    
    -- Validate sale parameters
    if not itemId or quantity <= 0 then
        return {
            success = false,
            error = "Invalid sale parameters",
            correlation = { id = correlationId, responseType = "SALE_ERROR" }
        }
    end
    
    -- Validate economic state integrity
    local economicValid, economicError = EconomicSystem.validatePlayerEconomicState(playerId, waveIndex)
    if not economicValid then
        return {
            success = false,
            error = "Economic validation failed: " .. economicError,
            correlation = { id = correlationId, responseType = "SALE_ERROR" }
        }
    end
    
    -- Get player data from coordinator if not provided
    local playerData = data.playerData
    
    -- Process sale through ShopManager
    local success, message, totalValue
    if playerData then
        success, message, totalValue = ShopManager.sellItemWithProgression(
            playerId, itemId, quantity, waveIndex, playerData
        )
    else
        success, message, totalValue = ShopManager.sellItem(
            playerId, itemId, quantity, waveIndex
        )
    end
    
    if not success then
        return {
            success = false,
            error = message,
            correlation = { id = correlationId, responseType = "SALE_ERROR" }
        }
    end
    
    -- Get updated inventory and money state
    local inventory = ShopManager.getInventory and ShopManager.getInventory(playerId) or {}
    local shopStats = ShopManager.getShopStats(playerId)
    
    -- Create transaction audit hash
    local auditData = {
        playerId = playerId,
        itemId = itemId,
        quantity = quantity,
        totalValue = totalValue,
        waveIndex = waveIndex,
        timestamp = 0
    }
    local transactionHash = EconomicSystem.generateTransactionHash(auditData)
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "SALE_SUCCESS" },
        result = {
            transactionId = correlationId .. "id_" .. msg.Timestamp,
            saleData = {
                itemId = itemId,
                quantity = quantity,
                totalValue = totalValue,
                waveIndex = waveIndex
            },
            inventoryUpdates = {
                itemQuantity = inventory.items and inventory.items[itemId] and inventory.items[itemId].quantity or 0,
                newMoney = inventory.money or totalValue,
                inventorySpace = (inventory.capacity or 999) - (inventory.totalItems or 0)
            },
            shopStats = shopStats
        },
        auditData = {
            transactionHash = transactionHash,
            timestamp = 0
        }
    }
end

-- Process bulk purchase transaction
function ShopTransactionHandler.processBulkPurchase(data, playerId, correlationId)
    -- Validate bulk purchase data
    if not data.bulkPurchaseData or not data.bulkPurchaseData.purchases then
        return {
            success = false,
            error = "Missing bulk purchase data",
            correlation = { id = correlationId, responseType = "BULK_PURCHASE_ERROR" }
        }
    end
    
    local purchases = data.bulkPurchaseData.purchases
    local waveIndex = data.bulkPurchaseData.waveIndex or 1
    
    -- Validate bulk purchase limits
    if #purchases > TRANSACTION_LIMITS.MAX_BULK_ITEMS then
        return {
            success = false,
            error = "Too many items in bulk purchase (max: " .. TRANSACTION_LIMITS.MAX_BULK_ITEMS .. ")",
            correlation = { id = correlationId, responseType = "BULK_PURCHASE_ERROR" }
        }
    end
    
    -- Validate economic state integrity
    local economicValid, economicError = EconomicSystem.validatePlayerEconomicState(playerId, waveIndex)
    if not economicValid then
        return {
            success = false,
            error = "Economic validation failed: " .. economicError,
            correlation = { id = correlationId, responseType = "BULK_PURCHASE_ERROR" }
        }
    end
    
    -- Process bulk purchase through ShopManager
    local success, summary, results = ShopManager.bulkPurchase(playerId, purchases, waveIndex)
    
    -- Get updated inventory and shop stats
    local inventory = ShopManager.getInventory and ShopManager.getInventory(playerId) or {}
    local shopStats = ShopManager.getShopStats(playerId)
    
    -- Create transaction audit hash for bulk operation
    local auditData = {
        playerId = playerId,
        bulkPurchase = true,
        itemCount = #purchases,
        waveIndex = waveIndex,
        timestamp = 0
    }
    local transactionHash = EconomicSystem.generateTransactionHash(auditData)
    
    return {
        success = success,
        correlation = { id = correlationId, responseType = "BULK_PURCHASE_RESULT" },
        result = {
            transactionId = correlationId .. "id_" .. msg.Timestamp,
            summary = summary,
            purchases = results,
            inventoryUpdates = {
                remainingMoney = inventory.money or 0,
                inventorySpace = (inventory.capacity or 999) - (inventory.totalItems or 0)
            },
            shopStats = shopStats
        },
        auditData = {
            transactionHash = transactionHash,
            timestamp = 0
        }
    }
end

-- Get shop inventory for player
function ShopTransactionHandler.getShopInventory(data, playerId, correlationId)
    local waveIndex = data.waveIndex or 1
    
    -- Get shop inventory through ShopManager
    local items, message = ShopManager.getShopInventory(playerId, waveIndex)
    
    if not items then
        return {
            success = false,
            error = message,
            correlation = { id = correlationId, responseType = "INVENTORY_ERROR" }
        }
    end
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "INVENTORY_SUCCESS" },
        result = {
            shopInventory = items,
            waveIndex = waveIndex,
            message = message
        }
    }
end

-- Validate shop transaction integrity
function ShopTransactionHandler.validateTransaction(transactionData)
    -- Implement transaction validation logic
    if not transactionData or not transactionData.playerId then
        return false, "Invalid transaction data"
    end
    
    -- Additional validation checks can be added here
    return true, "Transaction valid"
end

return ShopTransactionHandler