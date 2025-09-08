--[[
Shop Manager Unit Tests
Comprehensive tests for shop transaction processing with existing parity

Test Coverage:
- Shop purchase functionality with money validation and inventory limits
- Shop sale functionality with pricing verification and inventory updates
- Shop access validation with progression system integration
- Bulk purchase operations with transaction batching
- Shop state management and statistics tracking
--]]

_G.TEST_MODE = true

-- Test framework
local TestFramework = require('tests.test-framework')
local test = TestFramework.createTestSuite("ShopManager")

-- Mock dependencies for testing
local MockShopDatabase = {
    getAvailableItems = function(waveIndex)
        return {
            {id = "POTION", cost = 200, category = "healing"},
            {id = "SUPER_POTION", cost = 700, category = "healing"}
        }
    end,
    isItemAvailable = function(itemId, waveIndex)
        local availableItems = {"POTION", "SUPER_POTION", "HYPER_POTION"}
        for _, item in ipairs(availableItems) do
            if item == itemId then
                return true, "Available"
            end
        end
        return false, "Item not available"
    end,
    getItemBuyPrice = function(itemId, waveIndex)
        local prices = {
            POTION = 200,
            SUPER_POTION = 700,
            HYPER_POTION = 1200
        }
        return prices[itemId] or 0
    end,
    getItemSellPrice = function(itemId, waveIndex)
        local buyPrice = MockShopDatabase.getItemBuyPrice(itemId, waveIndex)
        return math.floor(buyPrice * 0.5)
    end,
    shouldRestock = function(waveIndex)
        return waveIndex % 10 == 1
    end
}

local MockInventoryManager = {
    inventory = {},
    getInventory = function(playerId)
        if not MockInventoryManager.inventory[playerId] then
            MockInventoryManager.inventory[playerId] = {
                items = {},
                money = 1000,
                capacity = 999,
                totalItems = 0
            }
        end
        return MockInventoryManager.inventory[playerId]
    end,
    addItem = function(playerId, itemId, quantity, reason)
        local inventory = MockInventoryManager.getInventory(playerId)
        if not inventory.items[itemId] then
            inventory.items[itemId] = {quantity = 0}
            inventory.totalItems = inventory.totalItems + 1
        end
        inventory.items[itemId].quantity = inventory.items[itemId].quantity + quantity
        return true, "Item added successfully", inventory.items[itemId].quantity
    end,
    removeItem = function(playerId, itemId, quantity, reason)
        local inventory = MockInventoryManager.getInventory(playerId)
        if not inventory.items[itemId] or inventory.items[itemId].quantity < quantity then
            return false, "Insufficient item quantity", 0
        end
        inventory.items[itemId].quantity = inventory.items[itemId].quantity - quantity
        if inventory.items[itemId].quantity == 0 then
            inventory.items[itemId] = nil
            inventory.totalItems = inventory.totalItems - 1
        end
        return true, "Item removed successfully", inventory.items[itemId] and inventory.items[itemId].quantity or 0
    end,
    hasItem = function(playerId, itemId, quantity)
        local inventory = MockInventoryManager.getInventory(playerId)
        return inventory.items[itemId] and inventory.items[itemId].quantity >= (quantity or 1)
    end,
    init = function() end
}

-- Mock PlayerProgressionSystem
local MockPlayerProgressionSystem = {
    spendMoney = function(playerData, amount, reason, description)
        if playerData.money >= amount then
            playerData.money = playerData.money - amount
            return true, playerData.money, "Money spent successfully"
        else
            return false, playerData.money, "Insufficient funds"
        end
    end,
    addMoney = function(playerData, amount, reason, description)
        playerData.money = playerData.money + amount
        return true, playerData.money
    end
}

-- Setup mocks
package.loaded['data.items.shop-database'] = MockShopDatabase
package.loaded['economy.components.inventory-manager'] = MockInventoryManager
package.loaded['game-logic.progression.player-progression-system'] = MockPlayerProgressionSystem

-- Load ShopManager after mocks are set up
local ShopManager = require('economy.components.shop-manager')

-- Test data
local testPlayerId = "test-player-1"
local testWaveIndex = 15

-- Test: Initialize ShopManager
test("should initialize shop manager", function(assert)
    ShopManager.init()
    local constants = ShopManager.getConstants()
    assert(constants.MAX_PURCHASE_QUANTITY == 99, "Max purchase quantity should be 99")
    assert(constants.MIN_PURCHASE_QUANTITY == 1, "Min purchase quantity should be 1")
end)

-- Test: Validate shop access
test("should validate shop access correctly", function(assert)
    -- Test normal wave access
    local valid, message = ShopManager.validateShopAccess(testPlayerId, 15)
    assert(valid == true, "Shop access should be valid on normal waves")
    
    -- Test boss wave access (should fail)
    local invalid, errorMessage = ShopManager.validateShopAccess(testPlayerId, 20)
    assert(invalid == false, "Shop access should be invalid on boss waves")
    assert(errorMessage:find("boss waves"), "Error message should mention boss waves")
end)

-- Test: Get shop inventory
test("should get shop inventory for wave", function(assert)
    local items, message = ShopManager.getShopInventory(testPlayerId, 15)
    assert(type(items) == "table", "Should return table of items")
    assert(#items > 0, "Should return at least one item")
    assert(message == "Shop inventory retrieved", "Should return success message")
end)

-- Test: Purchase item (legacy version)
test("should purchase item successfully", function(assert)
    -- Give player money
    local inventory = MockInventoryManager.getInventory(testPlayerId)
    inventory.money = 1000
    
    -- Purchase potion
    local success, message, quantity = ShopManager.purchaseItem(testPlayerId, "POTION", 2, 15)
    assert(success == true, "Purchase should succeed: " .. (message or "unknown error"))
    assert(quantity == 2, "Should purchase requested quantity")
    
    -- Check money was deducted
    local updatedInventory = MockInventoryManager.getInventory(testPlayerId)
    assert(updatedInventory.money == 600, "Money should be deducted (1000 - 400 = 600)")
    
    -- Check item was added
    assert(MockInventoryManager.hasItem(testPlayerId, "POTION", 2), "Player should have purchased items")
end)

-- Test: Purchase item with progression system
test("should purchase item with progression system", function(assert)
    local playerData = {
        money = 1000,
        progression = {
            unlocks = {
                shop = true
            }
        }
    }
    
    -- Purchase item
    local success, message, quantity = ShopManager.purchaseItemWithProgression(
        testPlayerId, "SUPER_POTION", 1, 15, playerData
    )
    
    assert(success == true, "Purchase with progression should succeed: " .. (message or "unknown error"))
    assert(quantity == 1, "Should purchase requested quantity")
    assert(playerData.money == 300, "Player money should be updated (1000 - 700 = 300)")
end)

-- Test: Purchase item insufficient funds
test("should fail purchase with insufficient funds", function(assert)
    -- Set low money
    local inventory = MockInventoryManager.getInventory(testPlayerId)
    inventory.money = 50
    
    -- Try to purchase expensive item
    local success, message, quantity = ShopManager.purchaseItem(testPlayerId, "SUPER_POTION", 1, 15)
    assert(success == false, "Purchase should fail with insufficient funds")
    assert(message:find("Insufficient funds"), "Should return insufficient funds message")
    assert(quantity == 0, "Should return zero quantity")
end)

-- Test: Sell item
test("should sell item successfully", function(assert)
    -- Add item to inventory
    MockInventoryManager.addItem(testPlayerId, "POTION", 3, "Test setup")
    local initialInventory = MockInventoryManager.getInventory(testPlayerId)
    local initialMoney = initialInventory.money
    
    -- Sell item
    local success, message, earnings = ShopManager.sellItem(testPlayerId, "POTION", 2, 15)
    assert(success == true, "Sale should succeed: " .. (message or "unknown error"))
    
    -- Check earnings (sell price is 50% of buy price)
    local expectedEarnings = MockShopDatabase.getItemSellPrice("POTION", 15) * 2
    assert(earnings == expectedEarnings, "Should earn correct amount: " .. expectedEarnings)
    
    -- Check money was added
    local updatedInventory = MockInventoryManager.getInventory(testPlayerId)
    assert(updatedInventory.money == initialMoney + expectedEarnings, "Money should be added")
    
    -- Check item quantity reduced
    assert(updatedInventory.items["POTION"].quantity == 1, "Item quantity should be reduced")
end)

-- Test: Bulk purchase
test("should handle bulk purchase", function(assert)
    -- Reset money
    local inventory = MockInventoryManager.getInventory(testPlayerId)
    inventory.money = 2000
    
    local purchases = {
        {itemId = "POTION", quantity = 2},
        {itemId = "SUPER_POTION", quantity = 1}
    }
    
    local success, summary, results = ShopManager.bulkPurchase(testPlayerId, purchases, 15)
    assert(success == true, "Bulk purchase should succeed")
    assert(type(results) == "table", "Should return results table")
    assert(#results == 2, "Should have results for both items")
    
    -- Check individual results
    for _, result in ipairs(results) do
        assert(result.success == true, "Each purchase should succeed")
        assert(result.actualQuantity > 0, "Each purchase should have quantity")
    end
end)

-- Test: Shop statistics
test("should track shop statistics", function(assert)
    local stats = ShopManager.getShopStats(testPlayerId)
    assert(type(stats) == "table", "Should return statistics table")
    assert(type(stats.totalPurchases) == "number", "Should track total purchases")
    assert(type(stats.lifetimeSpent) == "number", "Should track lifetime spent")
    assert(stats.totalPurchases > 0, "Should have recorded purchases from previous tests")
end)

-- Test: Shop state validation
test("should validate shop state", function(assert)
    local valid, errors = ShopManager.validateShopState(testPlayerId)
    assert(type(valid) == "boolean", "Should return boolean validity")
    assert(type(errors) == "table", "Should return errors table")
    
    if not valid then
        assert(#errors > 0, "Should have error details if invalid")
    end
end)

-- Test: Invalid parameters
test("should handle invalid parameters", function(assert)
    -- Test nil player ID
    local success, message = ShopManager.purchaseItem(nil, "POTION", 1, 15)
    assert(success == false, "Should fail with nil player ID")
    
    -- Test invalid quantity
    local success2, message2 = ShopManager.purchaseItem(testPlayerId, "POTION", 0, 15)
    assert(success2 == false, "Should fail with zero quantity")
    
    -- Test invalid item ID
    local success3, message3 = ShopManager.purchaseItem(testPlayerId, "INVALID_ITEM", 1, 15)
    assert(success3 == false, "Should fail with invalid item ID")
end)

-- Test: Shop unlock functionality
test("should handle shop unlocking", function(assert)
    local playerData = {
        progression = {}
    }
    
    -- Unlock shop
    local success, message = ShopManager.unlockShop(playerData)
    assert(success == true, "Should successfully unlock shop")
    assert(playerData.progression.unlocks.shop == true, "Shop should be marked as unlocked")
    
    -- Check unlock status
    local isUnlocked = ShopManager.isShopUnlocked(playerData)
    assert(isUnlocked == true, "Shop should report as unlocked")
end)

-- Run all tests
test.run()

return test