--[[
Economic System Timestamp Parameter Integration Tests
Validates timestamp parameter threading and elimination of 0 dependencies

Test Coverage:
- All function signatures accept timestamp parameters
- Timestamp parameters are correctly threaded through calculations
- All timing calculations produce identical results
- No 0 dependencies remain in the system
--]]

local TestFramework = require('../../framework/test-framework-enhanced')
local EconomicSystem = require('../../../game-logic/items/economic-system')

-- Mock dependencies
local mockShopDatabase = {
    getItemPrice = function(itemId) return 100 end
}

-- Test fixtures
local testTimestamp = 1625097600 -- Fixed test timestamp
local testPlayerId = "test_player_1"
local testItemId = "item_001"

local function createEconomicSystemTimestampTests()
    local tests = {}
    
    -- Test 1: Initialize system with timestamp parameter
    tests["test_economic_system_init_with_timestamp"] = function()
        -- Reset system state
        package.loaded['../../../game-logic/items/economic-system'] = nil
        local EconomicSystem = require('../../../game-logic/items/economic-system')
        
        local success, error = pcall(function()
            EconomicSystem.init(testTimestamp)
        end)
        
        TestFramework.assert(success, "Economic system should initialize with timestamp parameter")
        
        local globalStats = EconomicSystem.getGlobalEconomics(testTimestamp)
        TestFramework.assert(globalStats.lastUpdate == testTimestamp, 
            "System should use provided timestamp for initialization")
    end
    
    -- Test 2: Dynamic price calculation with timestamp threading
    tests["test_calculate_dynamic_price_timestamp_threading"] = function()
        local basePrice = 100
        local waveIndex = 10
        
        local price1 = EconomicSystem.calculateDynamicPrice(testItemId, basePrice, waveIndex, testTimestamp)
        local price2 = EconomicSystem.calculateDynamicPrice(testItemId, basePrice, waveIndex, testTimestamp)
        
        TestFramework.assert(price1 == price2, "Dynamic price calculation should be deterministic with same timestamp")
        TestFramework.assert(type(price1) == "number" and price1 > 0, "Price should be valid positive number")
    end
    
    -- Test 3: Record purchase with timestamp parameter
    tests["test_record_item_purchase_timestamp_integration"] = function()
        local quantity = 5
        local totalCost = 500
        local waveIndex = 15
        
        local success, message = EconomicSystem.recordItemPurchase(
            testPlayerId, testItemId, quantity, totalCost, waveIndex, testTimestamp)
        
        TestFramework.assert(success, "Purchase recording should succeed: " .. (message or ""))
        
        local playerEconomics = EconomicSystem.getPlayerEconomics(testPlayerId, testTimestamp)
        TestFramework.assert(playerEconomics.totalSpent == totalCost, 
            "Player total spent should reflect purchase amount")
        TestFramework.assert(playerEconomics.lastTransactionTime == testTimestamp,
            "Last transaction time should match provided timestamp")
    end
    
    -- Test 4: Record sale with timestamp parameter
    tests["test_record_item_sale_timestamp_integration"] = function()
        local quantity = 3
        local totalEarnings = 150
        local waveIndex = 20
        
        local success, message = EconomicSystem.recordItemSale(
            testPlayerId, testItemId, quantity, totalEarnings, waveIndex, testTimestamp + 100)
        
        TestFramework.assert(success, "Sale recording should succeed: " .. (message or ""))
        
        local playerEconomics = EconomicSystem.getPlayerEconomics(testPlayerId, testTimestamp + 100)
        TestFramework.assert(playerEconomics.totalEarned == totalEarnings,
            "Player total earned should reflect sale amount")
        TestFramework.assert(playerEconomics.lastTransactionTime == testTimestamp + 100,
            "Last transaction time should match sale timestamp")
    end
    
    -- Test 5: Transaction validation with timestamp parameter
    tests["test_validate_transaction_timestamp_integration"] = function()
        local transactionValue = 1000
        local transactionType = "purchase"
        
        local valid, reason = EconomicSystem.validateTransaction(
            testPlayerId, transactionValue, transactionType, testTimestamp + 200)
        
        TestFramework.assert(valid, "Valid transaction should pass validation: " .. (reason or ""))
    end
    
    -- Test 6: Player economics retrieval with timestamp
    tests["test_get_player_economics_timestamp_parameter"] = function()
        local playerEconomics = EconomicSystem.getPlayerEconomics(testPlayerId, testTimestamp + 300)
        
        TestFramework.assert(type(playerEconomics) == "table", "Player economics should return table")
        TestFramework.assert(type(playerEconomics.totalSpent) == "number", "Total spent should be number")
        TestFramework.assert(type(playerEconomics.totalEarned) == "number", "Total earned should be number")
        TestFramework.assert(type(playerEconomics.transactionCount) == "number", "Transaction count should be number")
    end
    
    -- Test 7: Item market stats with timestamp
    tests["test_get_item_market_stats_timestamp_parameter"] = function()
        local marketStats = EconomicSystem.getItemMarketStats(testItemId, testTimestamp + 400)
        
        TestFramework.assert(type(marketStats) == "table", "Market stats should return table")
        TestFramework.assert(type(marketStats.totalPurchases) == "number", "Total purchases should be number")
        TestFramework.assert(type(marketStats.currentDemand) == "number", "Current demand should be number")
    end
    
    -- Test 8: Global economics with timestamp
    tests["test_get_global_economics_timestamp_parameter"] = function()
        local globalStats = EconomicSystem.getGlobalEconomics(testTimestamp + 500)
        
        TestFramework.assert(type(globalStats) == "table", "Global stats should return table")
        TestFramework.assert(globalStats.lastUpdate == testTimestamp + 500,
            "Global stats should reflect provided timestamp")
        TestFramework.assert(type(globalStats.totalTransactionVolume) == "number", 
            "Transaction volume should be number")
    end
    
    -- Test 9: Transaction rollback with timestamp
    tests["test_rollback_transaction_timestamp_integration"] = function()
        local transactionId = "test_transaction"
        local reason = "test_rollback"
        
        local success, message = EconomicSystem.rollbackTransaction(
            testPlayerId, transactionId, reason, testTimestamp + 600)
        
        -- Rollback may fail if transaction not found, but should accept timestamp parameter
        TestFramework.assert(type(success) == "boolean", "Rollback should return boolean result")
        TestFramework.assert(type(message) == "string", "Rollback should return message")
    end
    
    -- Test 10: Timestamp parameter consistency across operations
    tests["test_timestamp_parameter_consistency"] = function()
        local baseTimestamp = testTimestamp + 1000
        local quantity = 2
        local cost = 200
        local waveIndex = 25
        
        -- Record purchase with specific timestamp
        local success1, _ = EconomicSystem.recordItemPurchase(
            "consistency_test_player", testItemId, quantity, cost, waveIndex, baseTimestamp)
        
        -- Get player economics with same timestamp
        local economics1 = EconomicSystem.getPlayerEconomics("consistency_test_player", baseTimestamp)
        
        -- Get player economics with different timestamp (should be same data)
        local economics2 = EconomicSystem.getPlayerEconomics("consistency_test_player", baseTimestamp + 100)
        
        TestFramework.assert(success1, "Purchase should succeed with timestamp parameter")
        TestFramework.assert(economics1.lastTransactionTime == baseTimestamp,
            "Economics should reflect exact timestamp used in purchase")
        TestFramework.assert(economics1.totalSpent == economics2.totalSpent,
            "Total spent should be consistent regardless of query timestamp")
    end
    
    return tests
end

-- Create test suite
local function runEconomicSystemTimestampTests()
    local tests = createEconomicSystemTimestampTests()
    local results = {}
    
    print("\\n=== Running Economic System Timestamp Parameter Integration Tests ===")
    
    for testName, testFunc in pairs(tests) do
        local success, error = pcall(testFunc)
        results[testName] = {
            passed = success,
            error = error
        }
        
        if success then
            print("✅ " .. testName)
        else
            print("❌ " .. testName .. ": " .. tostring(error))
        end
    end
    
    -- Summary
    local passed = 0
    local total = 0
    for _, result in pairs(results) do
        total = total + 1
        if result.passed then
            passed = passed + 1
        end
    end
    
    print(string.format("\\n📊 Economic System Timestamp Tests: %d/%d passed", passed, total))
    
    return results
end

-- Export for test runner
return {
    createEconomicSystemTimestampTests = createEconomicSystemTimestampTests,
    runEconomicSystemTimestampTests = runEconomicSystemTimestampTests
}