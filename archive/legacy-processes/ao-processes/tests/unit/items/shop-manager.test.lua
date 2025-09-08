--[[
Shop Manager Unit Tests
Comprehensive tests for shop operations, purchases, sales, and state management

Tests cover:
- Shop access validation and restrictions
- Item purchase functionality with money validation
- Item selling system with proper price calculations
- Bulk purchasing with quantity validation
- Shop inventory management and restocking
- Transaction logging and state tracking
- Money management integration
- Edge cases and error conditions
--]]

local ShopManager = require('../../../game-logic/items/shop-manager')
local ShopDatabase = require('../../../data/items/shop-database')
local InventoryManager = require('../../../game-logic/items/inventory-manager')

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

function TestFramework:assertContains(str, substring, message)
    if not string.find(str, substring, 1, true) then
        error(string.format("Assertion failed: %s\nExpected '%s' to contain '%s'", 
            message or "", str, substring))
    end
end

function TestFramework:run()
    print("Running Shop Manager Unit Tests...")
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

-- Helper function to create test player with money
local function createTestPlayerWithMoney(playerId, money)
    InventoryManager.init()
    
    -- Create basic inventory
    local success, msg, quantity = InventoryManager.addItem(playerId, "POTION", 1, "Test setup")
    
    -- Get inventory and set money
    local inventory = InventoryManager.getInventory(playerId)
    if inventory then
        inventory.money = money or 1000
    end
    
    return inventory ~= nil
end

-- Test Cases

TestFramework:addTest("Initialize Shop Manager", function(self)
    ShopManager.init()
    local constants = ShopManager.getConstants()
    
    self:assertEqual(constants.MAX_PURCHASE_QUANTITY, 99, "Max purchase quantity should be 99")
    self:assertEqual(constants.MIN_PURCHASE_QUANTITY, 1, "Min purchase quantity should be 1")
end)

TestFramework:addTest("Validate Shop Access - Normal Wave", function(self)
    local testPlayer = "test_player_1"
    local waveIndex = 5
    
    local success, msg = ShopManager.validateShopAccess(testPlayer, waveIndex)
    self:assertTrue(success, "Should allow shop access on normal wave")
    self:assertEqual(msg, "Shop access granted", "Should return success message")
end)

TestFramework:addTest("Validate Shop Access - Boss Wave", function(self)
    local testPlayer = "test_player_2"
    local waveIndex = 10 -- Boss wave
    
    local success, msg = ShopManager.validateShopAccess(testPlayer, waveIndex)
    self:assertFalse(success, "Should deny shop access on boss wave")
    self:assertContains(msg, "boss", "Should mention boss wave restriction")
end)

TestFramework:addTest("Validate Shop Access - Invalid Parameters", function(self)
    local success, msg = ShopManager.validateShopAccess(nil, 5)
    self:assertFalse(success, "Should deny access with nil player")
    
    local success2, msg2 = ShopManager.validateShopAccess("player", nil)
    self:assertFalse(success2, "Should deny access with nil wave")
end)

TestFramework:addTest("Get Shop Inventory - Available Items", function(self)
    local testPlayer = "test_player_3"
    local waveIndex = 1
    
    local items, msg = ShopManager.getShopInventory(testPlayer, waveIndex)
    self:assertTrue(#items > 0, "Should return available items")
    
    -- Check for basic starter items
    local foundPotion = false
    for _, item in ipairs(items) do
        if item.id == "POTION" then
            foundPotion = true
            self:assertEqual(item.cost, 36, "Potion should cost 36 at wave 1")
        end
    end
    self:assertTrue(foundPotion, "Should have Potion available at wave 1")
end)

TestFramework:addTest("Get Shop Inventory - Boss Wave", function(self)
    local testPlayer = "test_player_4"
    local waveIndex = 20 -- Boss wave
    
    local items, msg = ShopManager.getShopInventory(testPlayer, waveIndex)
    self:assertEqual(#items, 0, "Should return no items on boss wave")
    self:assertContains(msg, "boss", "Should explain boss wave restriction")
end)

TestFramework:addTest("Purchase Item - Successful Purchase", function(self)
    local testPlayer = "test_player_5"
    local waveIndex = 1
    
    -- Setup player with money
    createTestPlayerWithMoney(testPlayer, 1000)
    
    local success, msg, quantity = ShopManager.purchaseItem(testPlayer, "POTION", 2, waveIndex)
    self:assertTrue(success, "Should successfully purchase item")
    self:assertEqual(quantity, 2, "Should purchase requested quantity")
    self:assertEqual(msg, "Item purchased successfully", "Should return success message")
    
    -- Verify item was added to inventory
    local playerInventory = InventoryManager.getInventory(testPlayer)
    local potionQuantity = InventoryManager.getItemQuantity(testPlayer, "POTION")
    self:assertTrue(potionQuantity >= 2, "Should have at least 2 potions (may have had some from setup)")
end)

TestFramework:addTest("Purchase Item - Insufficient Funds", function(self)
    local testPlayer = "test_player_6"
    local waveIndex = 1
    
    -- Setup player with insufficient money
    createTestPlayerWithMoney(testPlayer, 10) -- Not enough for potion (36)
    
    local success, msg, quantity = ShopManager.purchaseItem(testPlayer, "POTION", 1, waveIndex)
    self:assertFalse(success, "Should fail purchase with insufficient funds")
    self:assertContains(msg, "Insufficient funds", "Should mention insufficient funds")
    self:assertEqual(quantity, 0, "Should return 0 quantity on failed purchase")
end)

TestFramework:addTest("Purchase Item - Invalid Quantity", function(self)
    local testPlayer = "test_player_7"
    local waveIndex = 1
    
    createTestPlayerWithMoney(testPlayer, 10000)
    
    -- Test with quantity 0
    local success1, msg1, quantity1 = ShopManager.purchaseItem(testPlayer, "POTION", 0, waveIndex)
    self:assertFalse(success1, "Should fail purchase with 0 quantity")
    self:assertContains(msg1, "Invalid purchase quantity", "Should mention invalid quantity")
    
    -- Test with quantity too high
    local success2, msg2, quantity2 = ShopManager.purchaseItem(testPlayer, "POTION", 1000, waveIndex)
    self:assertFalse(success2, "Should fail purchase with excessive quantity")
    self:assertContains(msg2, "Invalid purchase quantity", "Should mention invalid quantity")
end)

TestFramework:addTest("Purchase Item - Unavailable Item", function(self)
    local testPlayer = "test_player_8" 
    local waveIndex = 1
    
    createTestPlayerWithMoney(testPlayer, 10000)
    
    -- Try to purchase item not available at wave 1
    local success, msg, quantity = ShopManager.purchaseItem(testPlayer, "SACRED_ASH", 1, waveIndex)
    self:assertFalse(success, "Should fail to purchase unavailable item")
    self:assertContains(msg, "not available", "Should mention item not available")
end)

TestFramework:addTest("Purchase Item - Boss Wave Restriction", function(self)
    local testPlayer = "test_player_9"
    local waveIndex = 10 -- Boss wave
    
    createTestPlayerWithMoney(testPlayer, 1000)
    
    local success, msg, quantity = ShopManager.purchaseItem(testPlayer, "POTION", 1, waveIndex)
    self:assertFalse(success, "Should fail purchase on boss wave")
    self:assertContains(msg, "boss", "Should mention boss wave restriction")
end)

TestFramework:addTest("Bulk Purchase - Multiple Items Success", function(self)
    local testPlayer = "test_player_10"
    local waveIndex = 1
    
    createTestPlayerWithMoney(testPlayer, 10000)
    
    local purchases = {
        {itemId = "POTION", quantity = 3},
        {itemId = "ETHER", quantity = 2}
    }
    
    local success, msg, results = ShopManager.bulkPurchase(testPlayer, purchases, waveIndex)
    self:assertTrue(success, "Should successfully complete bulk purchase")
    self:assertEqual(#results, 2, "Should return results for both items")
    
    -- Check individual results
    for _, result in ipairs(results) do
        self:assertTrue(result.success, "Each purchase should succeed: " .. result.itemId)
        self:assertTrue(result.actualQuantity > 0, "Should have positive quantity")
    end
end)

TestFramework:addTest("Bulk Purchase - Mixed Success and Failure", function(self)
    local testPlayer = "test_player_11"  
    local waveIndex = 1
    
    createTestPlayerWithMoney(testPlayer, 100) -- Limited money
    
    local purchases = {
        {itemId = "POTION", quantity = 1}, -- Should succeed
        {itemId = "REVIVE", quantity = 1}, -- May fail due to cost (360)
        {itemId = "INVALID_ITEM", quantity = 1} -- Should fail
    }
    
    local success, msg, results = ShopManager.bulkPurchase(testPlayer, purchases, waveIndex)
    -- Overall success depends on whether all purchases succeeded
    self:assertEqual(#results, 3, "Should return results for all purchase attempts")
    
    local successCount = 0
    for _, result in ipairs(results) do
        if result.success then
            successCount = successCount + 1
        end
    end
    
    self:assertTrue(successCount >= 1, "At least one purchase should succeed")
    self:assertContains(msg, "Bulk purchase", "Should mention bulk purchase in message")
end)

TestFramework:addTest("Sell Item - Successful Sale", function(self)
    local testPlayer = "test_player_12"
    local waveIndex = 1
    
    createTestPlayerWithMoney(testPlayer, 1000)
    
    -- First purchase an item to sell
    ShopManager.purchaseItem(testPlayer, "POTION", 3, waveIndex)
    
    local initialMoney = InventoryManager.getInventory(testPlayer).money
    
    -- Sell 2 potions
    local success, msg, earnings = ShopManager.sellItem(testPlayer, "POTION", 2, waveIndex)
    self:assertTrue(success, "Should successfully sell item")
    self:assertEqual(msg, "Item sold successfully", "Should return success message")
    self:assertTrue(earnings > 0, "Should earn money from sale")
    
    -- Check money increased
    local finalMoney = InventoryManager.getInventory(testPlayer).money
    self:assertEqual(finalMoney - initialMoney, earnings, "Money should increase by earnings amount")
end)

TestFramework:addTest("Sell Item - Insufficient Quantity", function(self)
    local testPlayer = "test_player_13"
    local waveIndex = 1
    
    createTestPlayerWithMoney(testPlayer, 1000)
    
    -- Try to sell more potions than player has
    local success, msg, earnings = ShopManager.sellItem(testPlayer, "POTION", 100, waveIndex)
    self:assertFalse(success, "Should fail to sell insufficient quantity")
    self:assertContains(msg, "Insufficient", "Should mention insufficient quantity")
    self:assertEqual(earnings, 0, "Should return 0 earnings on failed sale")
end)

TestFramework:addTest("Get Shop Stats - Initial State", function(self)
    local testPlayer = "test_player_14"
    
    local stats = ShopManager.getShopStats(testPlayer)
    self:assertEqual(stats.totalPurchases, 0, "Initial purchases should be 0")
    self:assertEqual(stats.totalSales, 0, "Initial sales should be 0")
    self:assertEqual(stats.lifetimeSpent, 0, "Initial spending should be 0")
    self:assertEqual(stats.lifetimeEarned, 0, "Initial earnings should be 0")
    self:assertEqual(stats.shopLevel, 1, "Initial shop level should be 1")
end)

TestFramework:addTest("Get Shop Stats - After Transactions", function(self)
    local testPlayer = "test_player_15"
    local waveIndex = 1
    
    createTestPlayerWithMoney(testPlayer, 10000)
    
    -- Make some purchases
    ShopManager.purchaseItem(testPlayer, "POTION", 5, waveIndex)
    ShopManager.purchaseItem(testPlayer, "ETHER", 2, waveIndex)
    
    -- Make a sale
    ShopManager.sellItem(testPlayer, "POTION", 1, waveIndex)
    
    local stats = ShopManager.getShopStats(testPlayer)
    self:assertTrue(stats.totalPurchases > 0, "Should have recorded purchases")
    self:assertTrue(stats.totalSales > 0, "Should have recorded sales")
    self:assertTrue(stats.lifetimeSpent > 0, "Should have recorded spending")
    self:assertTrue(stats.lifetimeEarned > 0, "Should have recorded earnings")
end)

TestFramework:addTest("Shop Restock Logic", function(self)
    -- Test restock timing
    self:assertTrue(ShopManager.shouldRestock(1), "Should restock at wave 1")
    self:assertTrue(ShopManager.shouldRestock(11), "Should restock at wave 11")
    self:assertFalse(ShopManager.shouldRestock(5), "Should not restock at wave 5")
    self:assertFalse(ShopManager.shouldRestock(15), "Should not restock at wave 15")
end)

TestFramework:addTest("Validate Shop State - Valid State", function(self)
    local testPlayer = "test_player_16"
    
    -- Create some shop activity
    createTestPlayerWithMoney(testPlayer, 1000)
    ShopManager.purchaseItem(testPlayer, "POTION", 1, 1)
    
    local isValid, errors = ShopManager.validateShopState(testPlayer)
    self:assertTrue(isValid, "Valid shop state should pass validation")
    self:assertEqual(#errors, 0, "Should have no validation errors")
end)

TestFramework:addTest("Access Log Tracking", function(self)
    local testPlayer = "test_player_17"
    local waveIndex = 1
    
    createTestPlayerWithMoney(testPlayer, 1000)
    
    -- Perform some shop activities
    ShopManager.getShopInventory(testPlayer, waveIndex)
    ShopManager.purchaseItem(testPlayer, "POTION", 1, waveIndex)
    
    local log = ShopManager.getAccessLog(testPlayer)
    self:assertTrue(#log > 0, "Should have access log entries")
    
    local hasViewAction = false
    local hasPurchaseAction = false
    
    for _, entry in ipairs(log) do
        if entry.action == "view_inventory" then
            hasViewAction = true
        elseif entry.action == "purchase" then
            hasPurchaseAction = true
        end
    end
    
    self:assertTrue(hasViewAction, "Should log inventory viewing")
    self:assertTrue(hasPurchaseAction, "Should log purchase action")
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