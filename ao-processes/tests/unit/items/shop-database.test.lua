--[[
Shop Database Unit Tests
Comprehensive tests for shop pricing, availability, and progression mechanics

Tests cover:
- Price calculation matching TypeScript implementation
- Wave-based item availability and unlocking
- Buy/sell price ratios and validation
- Shop restocking mechanics
- Special condition handling
- Edge cases and error conditions
--]]

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

function TestFramework:run()
    print("Running Shop Database Unit Tests...")
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

TestFramework:addTest("Calculate Base Cost - Wave 1", function(self)
    local cost = ShopDatabase.calculateBaseCost(1)
    -- Expected: waveSetIndex=0, (0+1+(0.75+((0%10)+1)/10))*100^(1+0.005*0) = 1.85*100 = 185 -> 180
    self:assertEqual(cost, 180, "Wave 1 base cost should be 180")
end)

TestFramework:addTest("Calculate Base Cost - Wave 10", function(self)
    local cost = ShopDatabase.calculateBaseCost(10)
    -- Expected calculation based on TypeScript formula
    local waveSetIndex = math.ceil(10 / 10) - 1 -- 0
    local expectedValue = ((0 + 1 + (0.75 + (((10 - 1) % 10) + 1) / 10)) * 100) ^ (1 + 0.005 * 0)
    local expected = math.floor(expectedValue / 10) * 10
    self:assertEqual(cost, expected, "Wave 10 base cost calculation")
end)

TestFramework:addTest("Calculate Base Cost - Wave 50", function(self)
    local cost = ShopDatabase.calculateBaseCost(50)
    -- Should be significantly higher than wave 1
    self:assertTrue(cost > 100, "Wave 50 cost should be higher than wave 1")
    self:assertTrue(cost % 10 == 0, "Cost should be rounded to nearest 10")
end)

TestFramework:addTest("Calculate Base Cost - Invalid Input", function(self)
    local cost = ShopDatabase.calculateBaseCost(0)
    self:assertEqual(cost, 100, "Invalid wave should return default cost")
    
    local costNil = ShopDatabase.calculateBaseCost(nil)
    self:assertEqual(costNil, 100, "Nil wave should return default cost")
    
    local costNegative = ShopDatabase.calculateBaseCost(-5)
    self:assertEqual(costNegative, 100, "Negative wave should return default cost")
end)

TestFramework:addTest("Get Available Items - Wave 1", function(self)
    local items = ShopDatabase.getAvailableItems(1)
    
    -- Should have basic starter items
    local foundPotion = false
    local foundEther = false
    local foundRevive = false
    
    for _, item in ipairs(items) do
        if item.id == "POTION" then
            foundPotion = true
            self:assertEqual(item.cost, 36, "Potion cost should be baseCost * 0.2 = 180 * 0.2 = 36")
        elseif item.id == "ETHER" then
            foundEther = true
            self:assertEqual(item.cost, 72, "Ether cost should be baseCost * 0.4 = 180 * 0.4 = 72")
        elseif item.id == "REVIVE" then
            foundRevive = true
            self:assertEqual(item.cost, 360, "Revive cost should be baseCost * 2.0 = 180 * 2.0 = 360")
        end
    end
    
    self:assertTrue(foundPotion, "Should have Potion available at wave 1")
    self:assertTrue(foundEther, "Should have Ether available at wave 1")
    self:assertTrue(foundRevive, "Should have Revive available at wave 1")
end)

TestFramework:addTest("Get Available Items - Boss Wave (Wave 10)", function(self)
    local items = ShopDatabase.getAvailableItems(10)
    self:assertEqual(#items, 0, "Boss waves should have no shop items")
end)

TestFramework:addTest("Get Available Items - Wave 51 Progression", function(self)
    local items = ShopDatabase.getAvailableItems(51)
    
    -- Should have more items unlocked
    local itemIds = {}
    for _, item in ipairs(items) do
        itemIds[item.id] = true
    end
    
    self:assertTrue(itemIds["SUPER_POTION"], "Should have Super Potion at wave 51")
    self:assertTrue(itemIds["FULL_HEAL"], "Should have Full Heal at wave 51")
    self:assertTrue(itemIds["MAX_ETHER"], "Should have Max Ether at wave 51")
end)

TestFramework:addTest("Get Available Items - High Wave (Wave 151)", function(self)
    local items = ShopDatabase.getAvailableItems(151)
    
    local itemIds = {}
    for _, item in ipairs(items) do
        itemIds[item.id] = true
    end
    
    self:assertTrue(itemIds["MAX_POTION"], "Should have Max Potion at wave 151")
    self:assertTrue(itemIds["MAX_ELIXIR"], "Should have Max Elixir at wave 151")
    self:assertTrue(itemIds["FULL_RESTORE"], "Should have Full Restore at wave 151")
    
    -- Sacred Ash should NOT be available without special conditions
    self:assertFalse(itemIds["SACRED_ASH"], "Sacred Ash requires special conditions")
end)

TestFramework:addTest("Get Item Buy Price - Specific Items", function(self)
    local wave = 10
    local baseCost = ShopDatabase.calculateBaseCost(wave)
    
    -- Test Potion (0.2 multiplier)
    local potionPrice = ShopDatabase.getItemBuyPrice("POTION", wave)
    self:assertEqual(potionPrice, math.floor(baseCost * 0.2), "Potion price calculation")
    
    -- Test Sacred Ash (10.0 multiplier)
    local sacredAshPrice = ShopDatabase.getItemBuyPrice("SACRED_ASH", wave)
    self:assertEqual(sacredAshPrice, math.floor(baseCost * 10.0), "Sacred Ash price calculation")
    
    -- Test non-existent item
    local invalidPrice = ShopDatabase.getItemBuyPrice("INVALID_ITEM", wave)
    self:assertEqual(invalidPrice, 0, "Invalid item should return 0 price")
end)

TestFramework:addTest("Get Item Sell Price - 50% Ratio", function(self)
    local wave = 20
    local potionBuyPrice = ShopDatabase.getItemBuyPrice("POTION", wave)
    local potionSellPrice = ShopDatabase.getItemSellPrice("POTION", wave)
    
    self:assertEqual(potionSellPrice, math.floor(potionBuyPrice * 0.5), 
        "Sell price should be 50% of buy price")
    
    -- Test with non-existent item
    local invalidSellPrice = ShopDatabase.getItemSellPrice("INVALID_ITEM", wave)
    self:assertEqual(invalidSellPrice, 0, "Invalid item sell price should be 0")
end)

TestFramework:addTest("Should Restock - Wave Intervals", function(self)
    -- Should restock every 10 waves starting from wave 1
    self:assertTrue(ShopDatabase.shouldRestock(1), "Should restock at wave 1")
    self:assertTrue(ShopDatabase.shouldRestock(11), "Should restock at wave 11")
    self:assertTrue(ShopDatabase.shouldRestock(21), "Should restock at wave 21")
    
    -- Should not restock on other waves
    self:assertFalse(ShopDatabase.shouldRestock(5), "Should not restock at wave 5")
    self:assertFalse(ShopDatabase.shouldRestock(15), "Should not restock at wave 15")
    self:assertFalse(ShopDatabase.shouldRestock(29), "Should not restock at wave 29")
end)

TestFramework:addTest("Is Item Available - Wave Requirements", function(self)
    -- Test starter item (available from wave 1)
    local available1, msg1 = ShopDatabase.isItemAvailable("POTION", 1)
    self:assertTrue(available1, "Potion should be available at wave 1")
    self:assertEqual(msg1, "Available", "Should return 'Available' message")
    
    -- Test early game item not yet available
    local available2, msg2 = ShopDatabase.isItemAvailable("SUPER_POTION", 15)
    self:assertFalse(available2, "Super Potion should not be available at wave 15")
    self:assertEqual(msg2, "Item not available at current wave", "Should return wave requirement message")
    
    -- Test early game item now available
    local available3, msg3 = ShopDatabase.isItemAvailable("SUPER_POTION", 35)
    self:assertTrue(available3, "Super Potion should be available at wave 35")
end)

TestFramework:addTest("Is Item Available - Special Conditions", function(self)
    -- Sacred Ash requires special condition
    local available1, msg1 = ShopDatabase.isItemAvailable("SACRED_ASH", 200)
    self:assertFalse(available1, "Sacred Ash should require special condition")
    self:assertTrue(string.find(msg1, "Special condition not met"), "Should mention special condition")
    
    -- With special condition met
    local specialConditions = {defeat_legendary_boss = true}
    local available2, msg2 = ShopDatabase.isItemAvailable("SACRED_ASH", 200, specialConditions)
    self:assertTrue(available2, "Sacred Ash should be available with special condition")
end)

TestFramework:addTest("Is Item Available - Invalid Item", function(self)
    local available, msg = ShopDatabase.isItemAvailable("NONEXISTENT_ITEM", 50)
    self:assertFalse(available, "Invalid item should not be available")
    self:assertEqual(msg, "Item not found", "Should return 'Item not found' message")
end)

TestFramework:addTest("Get Categories - Structure", function(self)
    local categories = ShopDatabase.getCategories()
    
    self:assertEqual(categories.HEALING, "healing", "Should have healing category")
    self:assertEqual(categories.PP_RESTORE, "pp_restore", "Should have pp_restore category")
    self:assertEqual(categories.REVIVAL, "revival", "Should have revival category")
    self:assertEqual(categories.RARE_ITEMS, "rare_items", "Should have rare_items category")
end)

TestFramework:addTest("Get Constants - Configuration", function(self)
    local constants = ShopDatabase.getConstants()
    
    self:assertEqual(constants.SELL_RATIO, 0.5, "Sell ratio should be 0.5")
    self:assertEqual(constants.RESTOCK_WAVE_INTERVAL, 10, "Restock interval should be 10")
    self:assertEqual(constants.MAX_SHOP_ITEMS, 6, "Max shop items should be 6")
    self:assertTrue(constants.BASE_COST_CALCULATION, "Base cost calculation should be enabled")
end)

TestFramework:addTest("Price Consistency - Buy vs Sell", function(self)
    local testWaves = {1, 25, 50, 100, 200}
    local testItems = {"POTION", "SUPER_POTION", "MAX_POTION", "REVIVE"}
    
    for _, wave in ipairs(testWaves) do
        for _, itemId in ipairs(testItems) do
            local buyPrice = ShopDatabase.getItemBuyPrice(itemId, wave)
            local sellPrice = ShopDatabase.getItemSellPrice(itemId, wave)
            
            if buyPrice > 0 then -- Skip items that don't exist
                self:assertEqual(sellPrice, math.floor(buyPrice * 0.5), 
                    string.format("Sell price consistency for %s at wave %d", itemId, wave))
            end
        end
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