--[[
Economic System
Provides economic validation and anti-cheat mechanisms for the Economic Process

Features:
- Economic state integrity validation preventing impossible game states
- Transaction hash generation for audit trails using AO crypto module  
- Anti-cheat validation detecting economic state manipulation and exploits
- Economic balance validation maintaining consistent game economy
- Rate limiting and suspicious activity detection for economic operations

Integration:
- Uses AO crypto module for deterministic transaction hashing
- Integrates with TransactionAuditSystem for comprehensive logging
- Provides validation services for all economic process handlers
- Enforces economic integrity constraints across process boundaries
--]]

local EconomicSystem = {}

-- Dependencies
local crypto = require('ao.crypto') or {
    utils = {
        digest = function(data) return "mock-hash-" .. tostring(data) end
    }
}

-- Economic validation constants
local VALIDATION_LIMITS = {
    MAX_MONEY_AMOUNT = 999999999,
    MAX_ITEM_QUANTITY = 999,
    MAX_TRANSACTION_VALUE = 1000000,
    MIN_TRANSACTION_VALUE = 0,
    MAX_SHOP_LEVEL = 10,
    SUSPICIOUS_TRANSACTION_THRESHOLD = 100000
}

-- Rate limiting tracking
local rateLimitData = {} -- playerId -> rate limit state

-- Performance caching
local performanceCache = {
    itemPrices = {}, -- itemId -> cached price data
    shopInventories = {}, -- waveIndex -> cached inventory data
    validationResults = {}, -- validation hash -> cached result
    lastCleanup = 0,
    maxCacheSize = 1000,
    cacheTimeout = 300 -- 5 minutes
}

-- Performance metrics
local performanceMetrics = {
    validationCount = 0,
    validationLatency = 0,
    cacheHits = 0,
    cacheMisses = 0,
    averageLatency = 0
}

-- Initialize economic system
function EconomicSystem.init()
    -- Initialize validation systems
    performanceMetrics.initTime = 0
end

--[[
Validate player economic state integrity
@param playerId string - Player identifier
@param waveIndex number - Current wave for context
@return boolean - Is valid, string - error message if invalid
--]]
function EconomicSystem.validatePlayerEconomicState(playerId, waveIndex)
    if not playerId then
        return false, "Invalid player ID"
    end
    
    waveIndex = waveIndex or 1
    
    -- Basic parameter validation
    if waveIndex < 1 or waveIndex > 10000 then
        return false, "Invalid wave index: " .. waveIndex
    end
    
    -- Check for suspicious patterns (placeholder for more complex validation)
    local rateLimit = rateLimitData[playerId]
    if rateLimit then
        local currentTime = 0
        local timeDiff = currentTime - rateLimit.lastTransaction
        
        -- Rate limiting: max 10 transactions per minute
        if timeDiff < 6 then -- 60/10 = 6 seconds between transactions
            rateLimit.transactionCount = (rateLimit.transactionCount or 0) + 1
            if rateLimit.transactionCount > 10 then
                return false, "Rate limit exceeded: too many transactions"
            end
        else
            -- Reset counter after minute passes
            rateLimit.transactionCount = 1
        end
        
        rateLimit.lastTransaction = currentTime
    else
        -- Initialize rate limit tracking
        rateLimitData[playerId] = {
            lastTransaction = 0,
            transactionCount = 1
        }
    end
    
    return true, "Economic state valid"
end

--[[
Generate transaction hash for audit trail
@param transactionData table - Transaction data to hash
@return string - Cryptographic hash of transaction
--]]
function EconomicSystem.generateTransactionHash(transactionData)
    if not transactionData then
        return "invalid-transaction-hash"
    end
    
    -- Create deterministic string representation of transaction
    local hashInput = string.format("%s-%s-%s-%s-%s",
        tostring(transactionData.playerId or "unknown"),
        tostring(transactionData.itemId or "unknown"),
        tostring(transactionData.quantity or 0),
        tostring(transactionData.timestamp or 0),
        tostring(transactionData.waveIndex or 0)
    )
    
    -- Generate hash using AO crypto module
    if crypto and crypto.utils and crypto.utils.digest then
        return crypto.utils.digest(hashInput)
    else
        -- Fallback hash for testing
        local hash = 0
        for i = 1, #hashInput do
            hash = (hash * 31 + string.byte(hashInput, i)) % 2147483647
        end
        return "hash-" .. tostring(hash)
    end
end

--[[
Validate transaction value ranges
@param transactionValue number - Value of transaction
@param transactionType string - Type of transaction
@return boolean - Is valid, string - error message if invalid
--]]
function EconomicSystem.validateTransactionValue(transactionValue, transactionType)
    if not transactionValue or type(transactionValue) ~= "number" then
        return false, "Invalid transaction value"
    end
    
    if transactionValue < VALIDATION_LIMITS.MIN_TRANSACTION_VALUE then
        return false, "Transaction value too low"
    end
    
    if transactionValue > VALIDATION_LIMITS.MAX_TRANSACTION_VALUE then
        return false, "Transaction value too high"
    end
    
    -- Check for suspicious large transactions
    if transactionValue > VALIDATION_LIMITS.SUSPICIOUS_TRANSACTION_THRESHOLD then
        -- Log suspicious activity but allow transaction
        print("[EconomicSystem] Suspicious large transaction: " .. transactionValue .. " (" .. (transactionType or "unknown") .. ")")
    end
    
    return true, "Transaction value valid"
end

--[[
Validate item quantity ranges
@param itemId string - Item identifier
@param quantity number - Item quantity
@return boolean - Is valid, string - error message if invalid
--]]
function EconomicSystem.validateItemQuantity(itemId, quantity)
    if not quantity or type(quantity) ~= "number" then
        return false, "Invalid quantity"
    end
    
    if quantity <= 0 then
        return false, "Quantity must be positive"
    end
    
    if quantity > VALIDATION_LIMITS.MAX_ITEM_QUANTITY then
        return false, "Quantity exceeds maximum allowed"
    end
    
    -- Item-specific validation could be added here
    
    return true, "Item quantity valid"
end

--[[
Validate money amount ranges
@param amount number - Money amount
@return boolean - Is valid, string - error message if invalid
--]]
function EconomicSystem.validateMoneyAmount(amount)
    if not amount or type(amount) ~= "number" then
        return false, "Invalid money amount"
    end
    
    if amount < 0 then
        return false, "Money amount cannot be negative"
    end
    
    if amount > VALIDATION_LIMITS.MAX_MONEY_AMOUNT then
        return false, "Money amount exceeds maximum allowed"
    end
    
    return true, "Money amount valid"
end

--[[
Detect economic anomalies
@param playerId string - Player identifier
@param economicData table - Economic state data
@return boolean - Anomalies detected, array - list of anomalies
--]]
function EconomicSystem.detectEconomicAnomalies(playerId, economicData)
    if not playerId or not economicData then
        return false, {}
    end
    
    local anomalies = {}
    
    -- Check for impossible money amounts
    if economicData.money and economicData.money > VALIDATION_LIMITS.MAX_MONEY_AMOUNT then
        table.insert(anomalies, "Impossible money amount: " .. economicData.money)
    end
    
    -- Check for negative values
    if economicData.money and economicData.money < 0 then
        table.insert(anomalies, "Negative money amount")
    end
    
    -- Check for impossible progression
    if economicData.waveIndex and economicData.money then
        -- Basic check: money should be reasonable for wave progression
        local expectedMaxMoney = economicData.waveIndex * 1000
        if economicData.money > expectedMaxMoney * 10 then
            table.insert(anomalies, "Money too high for wave progression")
        end
    end
    
    -- Check inventory inconsistencies
    if economicData.inventory then
        local totalItems = 0
        for itemId, itemData in pairs(economicData.inventory.items or {}) do
            if itemData.quantity then
                totalItems = totalItems + 1
                
                -- Check item quantity limits
                if itemData.quantity > VALIDATION_LIMITS.MAX_ITEM_QUANTITY then
                    table.insert(anomalies, string.format("Item %s quantity too high: %d", itemId, itemData.quantity))
                end
                
                if itemData.quantity <= 0 then
                    table.insert(anomalies, string.format("Item %s has invalid quantity: %d", itemId, itemData.quantity))
                end
            end
        end
        
        -- Check total item count consistency
        if economicData.inventory.totalItems and economicData.inventory.totalItems ~= totalItems then
            table.insert(anomalies, "Inventory total items count mismatch")
        end
    end
    
    return #anomalies > 0, anomalies
end

--[[
Validate inter-process economic operation
@param operationData table - Operation data to validate
@param sourceProcess string - Source process identifier
@return boolean - Is valid, string - error message if invalid
--]]
function EconomicSystem.validateInterProcessOperation(operationData, sourceProcess)
    if not operationData then
        return false, "No operation data provided"
    end
    
    if not sourceProcess then
        return false, "No source process specified"
    end
    
    -- Validate operation type
    local validOperations = {
        "SHOP_PURCHASE",
        "SHOP_SALE", 
        "ITEM_MANAGEMENT",
        "BERRY_ACTIVATION",
        "ECONOMIC_QUERY"
    }
    
    local operationType = operationData.operationType
    local isValidOperation = false
    for _, validOp in ipairs(validOperations) do
        if operationType == validOp then
            isValidOperation = true
            break
        end
    end
    
    if not isValidOperation then
        return false, "Invalid operation type: " .. tostring(operationType)
    end
    
    -- Validate required fields based on operation type
    if operationType == "SHOP_PURCHASE" or operationType == "SHOP_SALE" then
        if not operationData.itemId or not operationData.quantity then
            return false, "Missing item data for shop operation"
        end
        
        local validQuantity, quantityError = EconomicSystem.validateItemQuantity(
            operationData.itemId, 
            operationData.quantity
        )
        if not validQuantity then
            return false, quantityError
        end
    end
    
    return true, "Inter-process operation valid"
end

--[[
Check for economic exploitation attempts
@param playerId string - Player identifier
@param operationData table - Operation being attempted
@return boolean - Is exploit attempt, string - exploit description
--]]
function EconomicSystem.checkForExploitAttempts(playerId, operationData)
    if not playerId or not operationData then
        return false, "No exploitation check data"
    end
    
    -- Check for rapid transaction attempts (possible automation)
    local rateLimit = rateLimitData[playerId]
    if rateLimit and rateLimit.transactionCount and rateLimit.transactionCount > 20 then
        return true, "Possible automation: excessive transaction rate"
    end
    
    -- Check for impossible value transactions
    if operationData.transactionValue and operationData.transactionValue > VALIDATION_LIMITS.SUSPICIOUS_TRANSACTION_THRESHOLD then
        return true, "Suspicious large transaction value"
    end
    
    -- Check for quantity manipulation
    if operationData.quantity and operationData.quantity > VALIDATION_LIMITS.MAX_ITEM_QUANTITY then
        return true, "Impossible item quantity"
    end
    
    return false, "No exploitation detected"
end

--[[
Get economic system statistics
@return table - Economic system statistics
--]]
function EconomicSystem.getSystemStats()
    local trackedPlayers = 0
    local totalTransactions = 0
    
    for playerId, rateData in pairs(rateLimitData) do
        trackedPlayers = trackedPlayers + 1
        totalTransactions = totalTransactions + (rateData.transactionCount or 0)
    end
    
    return {
        trackedPlayers = trackedPlayers,
        totalTransactions = totalTransactions,
        validationLimits = VALIDATION_LIMITS,
        timestamp = 0
    }
end

--[[
Reset rate limiting for a player (admin function)
@param playerId string - Player identifier
@return boolean - Success status
--]]
function EconomicSystem.resetRateLimit(playerId)
    if not playerId then
        return false
    end
    
    rateLimitData[playerId] = nil
    return true
end

--[[
Performance optimization functions
--]]

--[[
Cache validation result for performance
@param validationKey string - Key for caching
@param result table - Validation result to cache
@return boolean - Success status
--]]
function EconomicSystem.cacheValidationResult(validationKey, result)
    local currentTime = 0
    
    -- Clean cache if needed
    if currentTime - performanceCache.lastCleanup > performanceCache.cacheTimeout then
        EconomicSystem.cleanupPerformanceCache()
    end
    
    -- Check cache size limit
    local cacheSize = 0
    for _ in pairs(performanceCache.validationResults) do
        cacheSize = cacheSize + 1
    end
    
    if cacheSize >= performanceCache.maxCacheSize then
        -- Remove oldest entries
        local oldestTime = currentTime
        local oldestKey = nil
        for key, cached in pairs(performanceCache.validationResults) do
            if cached.timestamp < oldestTime then
                oldestTime = cached.timestamp
                oldestKey = key
            end
        end
        if oldestKey then
            performanceCache.validationResults[oldestKey] = nil
        end
    end
    
    performanceCache.validationResults[validationKey] = {
        result = result,
        timestamp = currentTime
    }
    
    return true
end

--[[
Get cached validation result
@param validationKey string - Key for lookup
@return table - Cached result or nil
--]]
function EconomicSystem.getCachedValidationResult(validationKey)
    local cached = performanceCache.validationResults[validationKey]
    
    if not cached then
        performanceMetrics.cacheMisses = performanceMetrics.cacheMisses + 1
        return nil
    end
    
    local currentTime = 0
    if currentTime - cached.timestamp > performanceCache.cacheTimeout then
        -- Expired
        performanceCache.validationResults[validationKey] = nil
        performanceMetrics.cacheMisses = performanceMetrics.cacheMisses + 1
        return nil
    end
    
    performanceMetrics.cacheHits = performanceMetrics.cacheHits + 1
    return cached.result
end

--[[
Clean up expired cache entries
@return number - Number of entries cleaned
--]]
function EconomicSystem.cleanupPerformanceCache()
    local currentTime = 0
    local cleanedCount = 0
    
    -- Clean validation results cache
    for key, cached in pairs(performanceCache.validationResults) do
        if currentTime - cached.timestamp > performanceCache.cacheTimeout then
            performanceCache.validationResults[key] = nil
            cleanedCount = cleanedCount + 1
        end
    end
    
    -- Clean item prices cache
    for key, cached in pairs(performanceCache.itemPrices) do
        if currentTime - cached.timestamp > performanceCache.cacheTimeout then
            performanceCache.itemPrices[key] = nil
            cleanedCount = cleanedCount + 1
        end
    end
    
    -- Clean shop inventories cache
    for key, cached in pairs(performanceCache.shopInventories) do
        if currentTime - cached.timestamp > performanceCache.cacheTimeout then
            performanceCache.shopInventories[key] = nil
            cleanedCount = cleanedCount + 1
        end
    end
    
    performanceCache.lastCleanup = currentTime
    return cleanedCount
end

--[[
Record performance metrics for validation operation
@param latency number - Operation latency in milliseconds
@return boolean - Success status
--]]
function EconomicSystem.recordValidationMetrics(latency)
    performanceMetrics.validationCount = performanceMetrics.validationCount + 1
    performanceMetrics.validationLatency = performanceMetrics.validationLatency + latency
    
    -- Calculate running average
    performanceMetrics.averageLatency = performanceMetrics.validationLatency / performanceMetrics.validationCount
    
    return true
end

--[[
Get performance statistics
@return table - Performance statistics
--]]
function EconomicSystem.getPerformanceStats()
    local cacheSize = 0
    for _ in pairs(performanceCache.validationResults) do
        cacheSize = cacheSize + 1
    end
    
    local hitRate = 0
    local totalCacheAccess = performanceMetrics.cacheHits + performanceMetrics.cacheMisses
    if totalCacheAccess > 0 then
        hitRate = (performanceMetrics.cacheHits / totalCacheAccess) * 100
    end
    
    return {
        metrics = performanceMetrics,
        cache = {
            size = cacheSize,
            maxSize = performanceCache.maxCacheSize,
            hitRate = hitRate,
            hits = performanceMetrics.cacheHits,
            misses = performanceMetrics.cacheMisses
        },
        uptime = 0 - (performanceMetrics.initTime or 0),
        timestamp = 0
    }
end

--[[
Optimize economic calculation performance with caching
@param calculationType string - Type of calculation
@param parameters table - Calculation parameters
@param calculationFunction function - Function to perform calculation
@return table - Calculation result
--]]
function EconomicSystem.optimizedCalculation(calculationType, parameters, calculationFunction)
    local startTime = msg.Timestamp
    
    -- Generate cache key
    local cacheKey = calculationType .. "_" .. 
        tostring(parameters.playerId or "unknown") .. "_" ..
        tostring(parameters.itemId or "unknown") .. "_" ..
        tostring(parameters.waveIndex or 0)
    
    -- Check cache first
    local cachedResult = EconomicSystem.getCachedValidationResult(cacheKey)
    if cachedResult then
        return cachedResult
    end
    
    -- Perform calculation
    local result = calculationFunction(parameters)
    
    -- Cache result
    EconomicSystem.cacheValidationResult(cacheKey, result)
    
    -- Record metrics
    local latency = 0 - startTime
    EconomicSystem.recordValidationMetrics(latency)
    
    return result
end

--[[
Batch validate multiple economic operations for performance
@param operations array - Array of operations to validate
@return table - Batch validation results
--]]
function EconomicSystem.batchValidateOperations(operations)
    local startTime = msg.Timestamp
    local results = {}
    
    for i, operation in ipairs(operations) do
        local valid, error = EconomicSystem.validateInterProcessOperation(
            operation.data,
            operation.sourceProcess
        )
        
        results[i] = {
            operationId = operation.id or i,
            valid = valid,
            error = error,
            operation = operation.type
        }
    end
    
    -- Record batch metrics
    local latency = 0 - startTime
    performanceMetrics.batchValidations = (performanceMetrics.batchValidations or 0) + 1
    performanceMetrics.batchLatency = (performanceMetrics.batchLatency or 0) + latency
    
    return {
        results = results,
        batchSize = #operations,
        totalLatency = latency,
        averageLatency = latency / math.max(1, #operations)
    }
end

return EconomicSystem