--[[
Economic System Unit Tests
Comprehensive tests for economic balance, pricing dynamics, and transaction management

Tests cover:
- Dynamic pricing based on demand and supply
- Transaction history tracking and logging
- Anti-exploit protection and validation
- Economic balance calculations and reporting
- Market statistics and trend analysis
- Transaction rollback functionality
- Player economic data management
- Global economic state tracking
--]]

local EconomicSystem = require('../../../game-logic/items/economic-system')
local ShopDatabase = require('../../../data/items/shop-database')

-- Test framework setup
local TestFramework = {
    tests = {},
    testCount = 0,
    passCount = 0,
    failCount = 0
}

function TestFramework:addTest(name, testFunc)
    table.insert(self.tests, {name = name, func = testFunc})
end

function TestFramework:assertEqual(actual, expected, message)
    if actual ~= expected then
        error(string.format("Assertion failed: %s\nExpected: %s\nActual: %s", 
            message or "", tostring(expected), tostring(actual)))
    end
end

function TestFramework:assertTrue(condition, message)
    if not condition then
        error("Assertion failed: " .. (message or "Expected true"))
    end
end

function TestFramework:assertFalse(condition, message)
    if condition then
        error("Assertion failed: " .. (message or "Expected false"))
    end
end

function TestFramework:assertWithinRange(actual, expected, tolerance, message)
    local diff = math.abs(actual - expected)
    if diff > tolerance then
        error(string.format("Assertion failed: %s\nExpected: %s (±%s)\nActual: %s\nDifference: %s", 
            message or "", tostring(expected), tostring(tolerance), tostring(actual), tostring(diff)))
    end
end

function TestFramework:assertContains(str, substring, message)
    if not string.find(str, substring, 1, true) then
        error(string.format("Assertion failed: %s\nExpected '%s' to contain '%s'", 
            message or "", str, substring))
    end
end

function TestFramework:run()
    print("Running Economic System Unit Tests...")
    print("=" .. string.rep("=", 50))
    
    for _, test in ipairs(self.tests) do
        self.testCount = self.testCount + 1
        local success, error_msg = pcall(test.func, self)
        
        if success then
            print(string.format("✓ %s", test.name))
            self.passCount = self.passCount + 1
        else
            print(string.format("✗ %s", test.name))
            print(string.format("  Error: %s", error_msg))
            self.failCount = self.failCount + 1
        end
    end
    
    print("=" .. string.rep("=", 50))
    print(string.format("Tests: %d | Passed: %d | Failed: %d", 
        self.testCount, self.passCount, self.failCount))
    
    if self.failCount == 0 then
        print("All tests passed! ✓")
        return true
    else
        print(string.format("Tests failed: %d", self.failCount))
        return false
    end
end

-- Test Cases

TestFramework:addTest("Initialize Economic System", function(self)
    EconomicSystem.init()
    local constants = EconomicSystem.getConstants()
    
    self:assertEqual(constants.MAX_PRICE_INFLATION, 2.0, "Max price inflation should be 2.0")
    self:assertEqual(constants.MAX_PRICE_DEFLATION, 0.5, "Max price deflation should be 0.5")
    self:assertTrue(constants.HIGH_DEMAND_THRESHOLD > 0, "High demand threshold should be positive")
end)

TestFramework:addTest("Calculate Dynamic Price - Base Case", function(self)
    local basePrice = 100
    local waveIndex = 10
    
    -- With no purchase history, should return base price
    local dynamicPrice = EconomicSystem.calculateDynamicPrice("TEST_ITEM_1", basePrice, waveIndex)
    self:assertEqual(dynamicPrice, basePrice, "Dynamic price should equal base price with no demand data")
end)

TestFramework:addTest("Calculate Dynamic Price - High Demand", function(self)
    local basePrice = 100
    local waveIndex = 50
    local itemId = "HIGH_DEMAND_ITEM"
    
    -- Simulate high demand by recording many purchases
    for i = 1, 150 do -- Above high demand threshold of 100
        EconomicSystem.recordItemPurchase("test_player", itemId, 1, basePrice, waveIndex - 10 + (i % 10))
    end
    
    local dynamicPrice = EconomicSystem.calculateDynamicPrice(itemId, basePrice, waveIndex)
    self:assertTrue(dynamicPrice > basePrice, "High demand should increase price")
    self:assertTrue(dynamicPrice <= basePrice * 2, "Price should not exceed max inflation limit")
end)

TestFramework:addTest("Calculate Dynamic Price - Low Demand", function(self)
    local basePrice = 100
    local waveIndex = 50
    local itemId = "LOW_DEMAND_ITEM"
    
    -- Simulate low demand by recording few purchases
    for i = 1, 5 do -- Below low demand threshold of 10
        EconomicSystem.recordItemPurchase("test_player", itemId, 1, basePrice, waveIndex - 10 + i)
    end
    
    local dynamicPrice = EconomicSystem.calculateDynamicPrice(itemId, basePrice, waveIndex)
    self:assertTrue(dynamicPrice < basePrice, "Low demand should decrease price")
    self:assertTrue(dynamicPrice >= basePrice * 0.5, "Price should not go below max deflation limit")
end)

TestFramework:addTest("Calculate Dynamic Price - Price Limits", function(self)
    local basePrice = 100
    local waveIndex = 100
    
    -- Test extreme inflation scenario
    local itemId = "EXTREME_ITEM"
    for i = 1, 1000 do -- Extreme demand
        EconomicSystem.recordItemPurchase("test_player", itemId, 1, basePrice, waveIndex - 5 + (i % 5))
    end
    
    local extremePrice = EconomicSystem.calculateDynamicPrice(itemId, basePrice, waveIndex)
    self:assertTrue(extremePrice <= basePrice * 2.0, "Price should be capped at max inflation")
end)

TestFramework:addTest("Record Item Purchase - Valid Transaction", function(self)
    local playerId = "purchase_test_player"
    local itemId = "PURCHASE_TEST_ITEM"
    local quantity = 3
    local totalCost = 150
    local waveIndex = 25
    
    local success, msg = EconomicSystem.recordItemPurchase(playerId, itemId, quantity, totalCost, waveIndex)
    self:assertTrue(success, "Should successfully record valid purchase")
    self:assertEqual(msg, "Purchase recorded successfully", "Should return success message")
    
    -- Verify player economic data was updated
    local playerStats = EconomicSystem.getPlayerEconomics(playerId)
    self:assertEqual(playerStats.totalSpent, totalCost, "Player total spent should be updated")
    self:assertEqual(playerStats.transactionCount, 1, "Transaction count should be incremented")
end)

TestFramework:addTest("Record Item Purchase - Invalid Parameters", function(self)
    local success, msg = EconomicSystem.recordItemPurchase(nil, "ITEM", 1, 100, 10)
    self:assertFalse(success, "Should fail with nil player ID")
    self:assertContains(msg, "Invalid parameters", "Should mention invalid parameters")
    
    local success2, msg2 = EconomicSystem.recordItemPurchase("player", nil, 1, 100, 10)
    self:assertFalse(success2, "Should fail with nil item ID")
end)

TestFramework:addTest("Record Item Sale - Valid Transaction", function(self)
    local playerId = "sale_test_player"
    local itemId = "SALE_TEST_ITEM"
    local quantity = 2
    local totalEarnings = 75
    local waveIndex = 30
    
    local success, msg = EconomicSystem.recordItemSale(playerId, itemId, quantity, totalEarnings, waveIndex)
    self:assertTrue(success, "Should successfully record valid sale")
    self:assertEqual(msg, "Sale recorded successfully", "Should return success message")
    
    -- Verify player economic data was updated
    local playerStats = EconomicSystem.getPlayerEconomics(playerId)
    self:assertEqual(playerStats.totalEarned, totalEarnings, "Player total earned should be updated")
    self:assertEqual(playerStats.transactionCount, 1, "Transaction count should be incremented")
end)

TestFramework:addTest("Validate Transaction - Normal Transaction", function(self)
    local playerId = "validation_test_player"
    local transactionValue = 500
    
    local success, msg = EconomicSystem.validateTransaction(playerId, transactionValue, "purchase")
    self:assertTrue(success, "Should validate normal transaction")
    self:assertEqual(msg, "Transaction validated", "Should return validation success message")
end)

TestFramework:addTest("Validate Transaction - Excessive Value", function(self)
    local playerId = "validation_test_player_2"
    local transactionValue = 10000000 -- Exceeds maximum
    
    local success, msg = EconomicSystem.validateTransaction(playerId, transactionValue, "purchase")
    self:assertFalse(success, "Should reject transaction with excessive value")
    self:assertContains(msg, "exceeds maximum", "Should mention value limit exceeded")
end)

TestFramework:addTest("Validate Transaction - Rate Limiting", function(self)
    local playerId = "rate_limit_test_player"
    
    -- Simulate many transactions in current hour
    for i = 1, 150 do -- Above hourly limit of 100
        EconomicSystem.recordItemPurchase(playerId, "TEST_ITEM", 1, 10, 10)
    end
    
    local success, msg = EconomicSystem.validateTransaction(playerId, 100, "purchase")
    self:assertFalse(success, "Should reject transaction due to rate limiting")
    self:assertContains(msg, "Hourly transaction limit", "Should mention hourly limit")
end)

TestFramework:addTest("Get Player Economics - New Player", function(self)
    local playerId = "new_economics_player"
    
    local stats = EconomicSystem.getPlayerEconomics(playerId)
    self:assertEqual(stats.totalSpent, 0, "New player should have 0 total spent")
    self:assertEqual(stats.totalEarned, 0, "New player should have 0 total earned")
    self:assertEqual(stats.netSpending, 0, "New player should have 0 net spending")
    self:assertEqual(stats.transactionCount, 0, "New player should have 0 transactions")
end)

TestFramework:addTest("Get Player Economics - After Transactions", function(self)
    local playerId = "active_economics_player"
    
    -- Record some transactions
    EconomicSystem.recordItemPurchase(playerId, "ITEM_1", 2, 200, 15)
    EconomicSystem.recordItemSale(playerId, "ITEM_2", 1, 50, 16)
    
    local stats = EconomicSystem.getPlayerEconomics(playerId)
    self:assertEqual(stats.totalSpent, 200, "Should track total spending")
    self:assertEqual(stats.totalEarned, 50, "Should track total earnings")
    self:assertEqual(stats.netSpending, 150, "Should calculate net spending correctly")
    self:assertEqual(stats.transactionCount, 2, "Should count all transactions")
    self:assertTrue(stats.averageTransactionValue > 0, "Should calculate average transaction value")
end)

TestFramework:addTest("Get Item Market Stats - No Data", function(self)
    local itemId = "UNKNOWN_MARKET_ITEM"
    
    local stats = EconomicSystem.getItemMarketStats(itemId)
    self:assertEqual(stats.totalPurchases, 0, "Unknown item should have 0 purchases")
    self:assertEqual(stats.currentDemand, 1.0, "Unknown item should have neutral demand")
    self:assertEqual(stats.marketTrend, "stable", "Unknown item should have stable trend")
end)

TestFramework:addTest("Get Item Market Stats - With Purchase History", function(self)
    local itemId = "MARKET_STATS_ITEM"
    local basePrice = 50
    
    -- Record purchases and update pricing
    EconomicSystem.recordItemPurchase("player1", itemId, 1, basePrice, 20)
    EconomicSystem.recordItemPurchase("player2", itemId, 2, basePrice * 2, 21)
    EconomicSystem.calculateDynamicPrice(itemId, basePrice, 22)
    
    local stats = EconomicSystem.getItemMarketStats(itemId)
    self:assertEqual(stats.totalPurchases, 3, "Should track total purchases correctly")
    self:assertTrue(#stats.priceHistory > 0, "Should have price history")
    self:assertTrue(stats.currentDemand >= 0, "Should have valid demand multiplier")
end)

TestFramework:addTest("Get Global Economics - Initial State", function(self)
    local globalStats = EconomicSystem.getGlobalEconomics()
    
    self:assertTrue(globalStats.totalTransactionVolume >= 0, "Transaction volume should be non-negative")
    self:assertTrue(globalStats.playerCount >= 0, "Player count should be non-negative")
    self:assertTrue(globalStats.marketStability >= 0 and globalStats.marketStability <= 1, 
        "Market stability should be between 0 and 1")
    self:assertTrue(globalStats.transactionCount >= 0, "Transaction count should be non-negative")
end)

TestFramework:addTest("Rollback Transaction - Invalid Parameters", function(self)
    local success, msg = EconomicSystem.rollbackTransaction(nil, "tx123", "test")
    self:assertFalse(success, "Should fail rollback with nil player ID")
    self:assertContains(msg, "Invalid rollback parameters", "Should mention invalid parameters")
    
    local success2, msg2 = EconomicSystem.rollbackTransaction("player", nil, "test")
    self:assertFalse(success2, "Should fail rollback with nil transaction ID")
end)

TestFramework:addTest("Rollback Transaction - Transaction Not Found", function(self)
    local playerId = "rollback_test_player"
    
    local success, msg = EconomicSystem.rollbackTransaction(playerId, "nonexistent_tx", "test")
    self:assertFalse(success, "Should fail to find non-existent transaction")
    self:assertContains(msg, "not found", "Should mention transaction not found")
end)

TestFramework:addTest("Market Trend Analysis", function(self)
    local itemId = "TREND_TEST_ITEM"
    local basePrice = 100
    
    -- Create rising trend by increasing demand
    for i = 1, 50 do
        EconomicSystem.recordItemPurchase("trend_player", itemId, 1, basePrice, 10 + i)
    end
    
    -- Update price multiple times to create history
    EconomicSystem.calculateDynamicPrice(itemId, basePrice, 50)
    
    for i = 1, 100 do -- High demand period
        EconomicSystem.recordItemPurchase("trend_player", itemId, 1, basePrice, 50 + i)
    end
    
    EconomicSystem.calculateDynamicPrice(itemId, basePrice, 160)
    
    local stats = EconomicSystem.getItemMarketStats(itemId)
    self:assertTrue(stats.marketTrend == "rising" or stats.marketTrend == "stable", 
        "Should detect market trend correctly")
end)

TestFramework:addTest("Anti-Exploit Detection", function(self)
    local playerId = "exploit_test_player"
    
    -- Create suspicious trading pattern (high earnings, low spending)
    EconomicSystem.recordItemSale(playerId, "ITEM_A", 10, 10000, 100) -- High earnings
    EconomicSystem.recordItemPurchase(playerId, "ITEM_B", 1, 10, 101)   -- Low spending
    
    local playerStats = EconomicSystem.getPlayerEconomics(playerId)
    
    -- The system should still allow transactions but may flag suspicious activity
    local validSuccess, validMsg = EconomicSystem.validateTransaction(playerId, 100, "purchase")
    self:assertTrue(validSuccess, "Should still validate transaction but may flag as suspicious")
end)

TestFramework:addTest("Price History Tracking", function(self)
    local itemId = "PRICE_HISTORY_ITEM"
    local basePrice = 200
    
    -- Create price history through multiple demand changes
    for wave = 1, 10 do
        -- Vary purchase patterns to create price volatility
        local purchases = (wave % 3 == 0) and 50 or 5
        for i = 1, purchases do
            EconomicSystem.recordItemPurchase("history_player", itemId, 1, basePrice, wave * 10)
        end
        EconomicSystem.calculateDynamicPrice(itemId, basePrice, wave * 10 + 5)
    end
    
    local stats = EconomicSystem.getItemMarketStats(itemId)
    self:assertTrue(#stats.priceHistory > 5, "Should maintain comprehensive price history")
    
    -- Verify price history structure
    for _, pricePoint in ipairs(stats.priceHistory) do
        self:assertTrue(pricePoint.wave and pricePoint.basePrice and pricePoint.multiplier and pricePoint.finalPrice,
            "Price history should have complete data structure")
    end
end)

-- Run all tests
local success = TestFramework:run()

-- Export for external test runners
return {
    success = success,
    testCount = TestFramework.testCount,
    passCount = TestFramework.passCount,
    failCount = TestFramework.failCount
}