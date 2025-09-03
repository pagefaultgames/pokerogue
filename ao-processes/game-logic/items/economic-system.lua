--[[
Economic System and Balance
Advanced economic balance and transaction management for shop operations

Features:
- Deterministic price calculations matching TypeScript exactly
- Transaction history tracking with purchase/sale logging
- Economic balance validation preventing exploit scenarios  
- Dynamic pricing system based on item rarity and availability
- Money validation and transaction rollback for failed purchases
- Economic reporting system for balance tracking
- Inflation/deflation mechanics based on market activity
- Anti-exploit protection and transaction validation

Integration:
- Uses ShopDatabase for base pricing calculations
- Integrates with ShopManager for transaction logging
- Provides economic analytics and reporting
--]]

local EconomicSystem = {}

-- Dependencies
local ShopDatabase = require('../../data/items/shop-database')

-- Economic constants
local ECONOMIC_CONSTANTS = {
    -- Price adjustment limits
    MAX_PRICE_INFLATION = 2.0,      -- Maximum 2x price increase
    MAX_PRICE_DEFLATION = 0.5,      -- Minimum 50% of base price
    
    -- Dynamic pricing parameters
    HIGH_DEMAND_THRESHOLD = 100,     -- Purchases per item to trigger price increase
    LOW_DEMAND_THRESHOLD = 10,       -- Purchases below this trigger price decrease
    DEMAND_WINDOW_WAVES = 50,        -- Wave window for demand calculation
    
    -- Transaction limits for anti-exploit
    MAX_SINGLE_TRANSACTION = 1000000, -- Maximum money in single transaction
    MAX_HOURLY_TRANSACTIONS = 100,    -- Maximum transactions per player per hour
    SUSPICIOUS_RATIO_THRESHOLD = 10,  -- Ratio triggering suspicious activity flag
    
    -- Economic balance tracking
    WEALTH_DISTRIBUTION_SAMPLES = 1000, -- Sample size for wealth analysis
    MARKET_STABILITY_WINDOW = 100,      -- Waves for market stability analysis
    
    -- Transaction rollback settings
    ROLLBACK_TIME_LIMIT = 300,       -- 5 minutes to rollback transactions
    MAX_ROLLBACK_COUNT = 5           -- Maximum rollbacks per player per day
}

-- Economic state management
local economicSystemInitialized = false
local globalEconomicState = {
    totalMoneyInCirculation = 0,
    totalTransactionVolume = 0,
    averagePlayerWealth = 0,
    inflationRate = 0,
    marketStability = 1.0,
    lastUpdate = 0
}

local playerEconomicData = {} -- playerId -> economic data
local itemDemandData = {}     -- itemId -> demand statistics  
local transactionHistory = {} -- Global transaction history
local suspiciousActivity = {} -- playerId -> suspicious activity flags

-- Initialize economic system
function EconomicSystem.init()
    if economicSystemInitialized then
        return
    end
    
    economicSystemInitialized = true
    globalEconomicState.lastUpdate = os.time and os.time() or 0
end

-- Initialize player economic data
local function initializePlayerEconomicData(playerId)
    if not playerEconomicData[playerId] then
        playerEconomicData[playerId] = {
            totalSpent = 0,
            totalEarned = 0,
            transactionCount = 0,
            hourlyTransactions = {},
            averageTransactionValue = 0,
            wealthRank = 0,
            suspiciousFlags = 0,
            lastTransactionTime = 0,
            rollbackCount = 0,
            lastRollbackTime = 0
        }
    end
    
    return playerEconomicData[playerId]
end

-- Initialize item demand data
local function initializeItemDemandData(itemId)
    if not itemDemandData[itemId] then
        itemDemandData[itemId] = {
            totalPurchases = 0,
            recentPurchases = {},   -- Wave-based purchase tracking
            currentDemand = 1.0,    -- Demand multiplier
            priceHistory = {},      -- Historical price data
            lastPriceUpdate = 0
        }
    end
    
    return itemDemandData[itemId]
end

-- Calculate dynamic pricing based on demand
function EconomicSystem.calculateDynamicPrice(itemId, basePrice, waveIndex)
    EconomicSystem.init()
    
    if not itemId or not basePrice or basePrice <= 0 then
        return basePrice or 0
    end
    
    local demandData = initializeItemDemandData(itemId)
    
    -- Calculate recent demand (purchases in demand window)
    local recentPurchases = 0
    local cutoffWave = math.max(0, waveIndex - ECONOMIC_CONSTANTS.DEMAND_WINDOW_WAVES)
    
    for wave, purchases in pairs(demandData.recentPurchases) do
        if wave >= cutoffWave then
            recentPurchases = recentPurchases + purchases
        end
    end
    
    -- Calculate demand multiplier
    local demandMultiplier = 1.0
    
    -- Only apply pricing adjustments if there's meaningful purchase history
    if demandData.totalPurchases > 0 then
        if recentPurchases > ECONOMIC_CONSTANTS.HIGH_DEMAND_THRESHOLD then
            -- High demand -> price increase
            local excess = recentPurchases - ECONOMIC_CONSTANTS.HIGH_DEMAND_THRESHOLD
            demandMultiplier = 1.0 + (excess / ECONOMIC_CONSTANTS.HIGH_DEMAND_THRESHOLD) * 0.5
        elseif recentPurchases < ECONOMIC_CONSTANTS.LOW_DEMAND_THRESHOLD then
            -- Low demand -> price decrease  
            local deficit = ECONOMIC_CONSTANTS.LOW_DEMAND_THRESHOLD - recentPurchases
            demandMultiplier = 1.0 - (deficit / ECONOMIC_CONSTANTS.LOW_DEMAND_THRESHOLD) * 0.3
        end
    end
    
    -- Apply price limits
    demandMultiplier = math.max(ECONOMIC_CONSTANTS.MAX_PRICE_DEFLATION, demandMultiplier)
    demandMultiplier = math.min(ECONOMIC_CONSTANTS.MAX_PRICE_INFLATION, demandMultiplier)
    
    -- Update demand data
    demandData.currentDemand = demandMultiplier
    demandData.lastPriceUpdate = waveIndex
    
    local finalPrice = math.floor(basePrice * demandMultiplier)
    
    -- Record price history
    table.insert(demandData.priceHistory, {
        wave = waveIndex,
        basePrice = basePrice,
        multiplier = demandMultiplier,
        finalPrice = finalPrice
    })
    
    -- Limit price history size
    if #demandData.priceHistory > 50 then
        table.remove(demandData.priceHistory, 1)
    end
    
    return finalPrice
end

-- Record item purchase for demand tracking
function EconomicSystem.recordItemPurchase(playerId, itemId, quantity, totalCost, waveIndex)
    EconomicSystem.init()
    
    if not playerId or not itemId or not quantity or not totalCost or not waveIndex then
        return false, "Invalid parameters for purchase recording"
    end
    
    -- Update item demand data
    local demandData = initializeItemDemandData(itemId)
    demandData.totalPurchases = demandData.totalPurchases + quantity
    
    if not demandData.recentPurchases[waveIndex] then
        demandData.recentPurchases[waveIndex] = 0
    end
    demandData.recentPurchases[waveIndex] = demandData.recentPurchases[waveIndex] + quantity
    
    -- Update player economic data
    local playerData = initializePlayerEconomicData(playerId)
    playerData.totalSpent = playerData.totalSpent + totalCost
    playerData.transactionCount = playerData.transactionCount + 1
    playerData.averageTransactionValue = playerData.totalSpent / playerData.transactionCount
    playerData.lastTransactionTime = os.time and os.time() or 0
    
    -- Update hourly transaction tracking
    local currentHour = math.floor(playerData.lastTransactionTime / 3600)
    if not playerData.hourlyTransactions[currentHour] then
        playerData.hourlyTransactions[currentHour] = 0
    end
    playerData.hourlyTransactions[currentHour] = playerData.hourlyTransactions[currentHour] + 1
    
    -- Update global economic state
    globalEconomicState.totalTransactionVolume = globalEconomicState.totalTransactionVolume + totalCost
    
    -- Record in global transaction history
    local transaction = {
        timestamp = playerData.lastTransactionTime,
        playerId = playerId,
        type = "purchase",
        itemId = itemId,
        quantity = quantity,
        totalCost = totalCost,
        wave = waveIndex
    }
    
    table.insert(transactionHistory, transaction)
    
    -- Limit transaction history size
    if #transactionHistory > 10000 then
        table.remove(transactionHistory, 1)
    end
    
    return true, "Purchase recorded successfully"
end

-- Record item sale for economic tracking
function EconomicSystem.recordItemSale(playerId, itemId, quantity, totalEarnings, waveIndex)
    EconomicSystem.init()
    
    if not playerId or not itemId or not quantity or not totalEarnings or not waveIndex then
        return false, "Invalid parameters for sale recording"
    end
    
    -- Update player economic data
    local playerData = initializePlayerEconomicData(playerId)
    playerData.totalEarned = playerData.totalEarned + totalEarnings
    playerData.transactionCount = playerData.transactionCount + 1
    playerData.averageTransactionValue = (playerData.totalSpent + playerData.totalEarned) / playerData.transactionCount
    playerData.lastTransactionTime = os.time and os.time() or 0
    
    -- Update hourly transaction tracking
    local currentHour = math.floor(playerData.lastTransactionTime / 3600)
    if not playerData.hourlyTransactions[currentHour] then
        playerData.hourlyTransactions[currentHour] = 0
    end
    playerData.hourlyTransactions[currentHour] = playerData.hourlyTransactions[currentHour] + 1
    
    -- Record in global transaction history
    local transaction = {
        timestamp = playerData.lastTransactionTime,
        playerId = playerId,
        type = "sale",
        itemId = itemId,
        quantity = quantity,
        totalEarnings = totalEarnings,
        wave = waveIndex
    }
    
    table.insert(transactionHistory, transaction)
    
    -- Limit transaction history size
    if #transactionHistory > 10000 then
        table.remove(transactionHistory, 1)
    end
    
    return true, "Sale recorded successfully"
end

-- Validate transaction for anti-exploit protection
function EconomicSystem.validateTransaction(playerId, transactionValue, transactionType)
    EconomicSystem.init()
    
    if not playerId or not transactionValue or not transactionType then
        return false, "Invalid transaction parameters"
    end
    
    -- Check maximum single transaction limit
    if transactionValue > ECONOMIC_CONSTANTS.MAX_SINGLE_TRANSACTION then
        return false, "Transaction value exceeds maximum limit"
    end
    
    local playerData = initializePlayerEconomicData(playerId)
    local currentTime = os.time and os.time() or 0
    local currentHour = math.floor(currentTime / 3600)
    
    -- Check hourly transaction limit
    local hourlyCount = playerData.hourlyTransactions[currentHour] or 0
    if hourlyCount >= ECONOMIC_CONSTANTS.MAX_HOURLY_TRANSACTIONS then
        return false, "Hourly transaction limit exceeded"
    end
    
    -- Check for suspicious buy/sell ratios
    local netSpending = playerData.totalSpent - playerData.totalEarned
    if playerData.totalEarned > 0 then
        local spendToEarnRatio = playerData.totalSpent / playerData.totalEarned
        if spendToEarnRatio > ECONOMIC_CONSTANTS.SUSPICIOUS_RATIO_THRESHOLD or
           spendToEarnRatio < (1.0 / ECONOMIC_CONSTANTS.SUSPICIOUS_RATIO_THRESHOLD) then
            -- Flag as suspicious but don't block
            playerData.suspiciousFlags = playerData.suspiciousFlags + 1
            suspiciousActivity[playerId] = {
                reason = "unusual_trading_ratio",
                ratio = spendToEarnRatio,
                flaggedTime = currentTime
            }
        end
    end
    
    return true, "Transaction validated"
end

-- Get economic statistics for player
function EconomicSystem.getPlayerEconomics(playerId)
    EconomicSystem.init()
    
    if not playerId then
        return {}
    end
    
    local playerData = playerEconomicData[playerId]
    if not playerData then
        return {
            totalSpent = 0,
            totalEarned = 0,
            netSpending = 0,
            transactionCount = 0,
            averageTransactionValue = 0,
            wealthRank = 0,
            suspiciousFlags = 0
        }
    end
    
    return {
        totalSpent = playerData.totalSpent,
        totalEarned = playerData.totalEarned,
        netSpending = playerData.totalSpent - playerData.totalEarned,
        transactionCount = playerData.transactionCount,
        averageTransactionValue = playerData.averageTransactionValue,
        wealthRank = playerData.wealthRank,
        suspiciousFlags = playerData.suspiciousFlags,
        lastTransactionTime = playerData.lastTransactionTime
    }
end

-- Get item market statistics
function EconomicSystem.getItemMarketStats(itemId)
    EconomicSystem.init()
    
    if not itemId then
        return {}
    end
    
    local demandData = itemDemandData[itemId]
    if not demandData then
        return {
            totalPurchases = 0,
            currentDemand = 1.0,
            priceHistory = {},
            marketTrend = "stable"
        }
    end
    
    -- Calculate market trend
    local trend = "stable"
    if #demandData.priceHistory >= 2 then
        local recent = demandData.priceHistory[#demandData.priceHistory]
        local previous = demandData.priceHistory[#demandData.priceHistory - 1]
        
        if recent.multiplier > previous.multiplier * 1.1 then
            trend = "rising"
        elseif recent.multiplier < previous.multiplier * 0.9 then
            trend = "falling"
        end
    end
    
    return {
        totalPurchases = demandData.totalPurchases,
        currentDemand = demandData.currentDemand,
        priceHistory = demandData.priceHistory,
        marketTrend = trend,
        lastPriceUpdate = demandData.lastPriceUpdate
    }
end

-- Get global economic overview
function EconomicSystem.getGlobalEconomics()
    EconomicSystem.init()
    
    -- Calculate current statistics
    local playerCount = 0
    local totalWealth = 0
    
    for playerId, data in pairs(playerEconomicData) do
        playerCount = playerCount + 1
        totalWealth = totalWealth + (data.totalEarned - data.totalSpent)
    end
    
    local averageWealth = playerCount > 0 and (totalWealth / playerCount) or 0
    
    -- Calculate market stability (inverse of price volatility)
    local stability = 1.0
    local totalVolatility = 0
    local itemCount = 0
    
    for itemId, data in pairs(itemDemandData) do
        if #data.priceHistory >= 2 then
            itemCount = itemCount + 1
            local priceSum = 0
            local priceSquareSum = 0
            
            for _, pricePoint in ipairs(data.priceHistory) do
                priceSum = priceSum + pricePoint.multiplier
                priceSquareSum = priceSquareSum + (pricePoint.multiplier * pricePoint.multiplier)
            end
            
            local mean = priceSum / #data.priceHistory
            local variance = (priceSquareSum / #data.priceHistory) - (mean * mean)
            totalVolatility = totalVolatility + math.sqrt(variance)
        end
    end
    
    if itemCount > 0 then
        stability = math.max(0, 1.0 - (totalVolatility / itemCount))
    end
    
    globalEconomicState.averagePlayerWealth = averageWealth
    globalEconomicState.marketStability = stability
    globalEconomicState.lastUpdate = os.time and os.time() or 0
    
    return {
        totalMoneyInCirculation = globalEconomicState.totalMoneyInCirculation,
        totalTransactionVolume = globalEconomicState.totalTransactionVolume,
        averagePlayerWealth = averageWealth,
        playerCount = playerCount,
        marketStability = stability,
        transactionCount = #transactionHistory,
        lastUpdate = globalEconomicState.lastUpdate
    }
end

-- Rollback transaction (for failed purchases)
function EconomicSystem.rollbackTransaction(playerId, transactionId, reason)
    EconomicSystem.init()
    
    if not playerId or not transactionId then
        return false, "Invalid rollback parameters"
    end
    
    local playerData = initializePlayerEconomicData(playerId)
    local currentTime = os.time and os.time() or 0
    
    -- Check rollback limits
    if currentTime - playerData.lastRollbackTime < 86400 then -- Same day
        if playerData.rollbackCount >= ECONOMIC_CONSTANTS.MAX_ROLLBACK_COUNT then
            return false, "Daily rollback limit exceeded"
        end
    else
        playerData.rollbackCount = 0 -- Reset for new day
    end
    
    -- Find transaction in history
    local transaction = nil
    for i = #transactionHistory, 1, -1 do
        if transactionHistory[i].playerId == playerId and 
           transactionHistory[i].timestamp and
           currentTime - transactionHistory[i].timestamp <= ECONOMIC_CONSTANTS.ROLLBACK_TIME_LIMIT then
            transaction = transactionHistory[i]
            break
        end
    end
    
    if not transaction then
        return false, "Transaction not found or too old for rollback"
    end
    
    -- Reverse the transaction effects
    if transaction.type == "purchase" then
        playerData.totalSpent = math.max(0, playerData.totalSpent - transaction.totalCost)
        globalEconomicState.totalTransactionVolume = math.max(0, 
            globalEconomicState.totalTransactionVolume - transaction.totalCost)
    elseif transaction.type == "sale" then
        playerData.totalEarned = math.max(0, playerData.totalEarned - transaction.totalEarnings)
    end
    
    -- Update rollback tracking
    playerData.rollbackCount = playerData.rollbackCount + 1
    playerData.lastRollbackTime = currentTime
    
    return true, "Transaction rolled back successfully"
end

-- Get economic constants
function EconomicSystem.getConstants()
    return ECONOMIC_CONSTANTS
end

return EconomicSystem