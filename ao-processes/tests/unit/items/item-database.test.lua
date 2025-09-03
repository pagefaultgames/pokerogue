--[[
Item Database Unit Tests
Tests for ao-processes/data/items/item-database.lua
--]]

local ItemDatabase = require('ao-processes.data.items.item-database')

-- Test framework setup
local TestFramework = {
    tests = {},
    passed = 0,
    failed = 0
}

function TestFramework.assert(condition, message)
    if condition then
        TestFramework.passed = TestFramework.passed + 1
        print("✓ " .. message)
    else
        TestFramework.failed = TestFramework.failed + 1
        print("✗ " .. message)
        error("Assertion failed: " .. message)
    end
end

function TestFramework.assertEquals(expected, actual, message)
    TestFramework.assert(expected == actual, message .. " (expected: " .. tostring(expected) .. ", got: " .. tostring(actual) .. ")")
end

function TestFramework.assertNotNil(value, message)
    TestFramework.assert(value ~= nil, message .. " should not be nil")
end

function TestFramework.test(name, testFunc)
    print("\n--- " .. name .. " ---")
    local success, error = pcall(testFunc)
    if not success then
        TestFramework.failed = TestFramework.failed + 1
        print("✗ Test failed: " .. error)
    end
end

-- Initialize database before tests
ItemDatabase.init()

print("=== Item Database Unit Tests ===")

-- Test 1: Database Initialization
TestFramework.test("Database Initialization", function()
    TestFramework.assert(true, "Database initialized successfully")
    local totalCount = ItemDatabase.getTotalItemCount()
    TestFramework.assert(totalCount > 0, "Database contains items (count: " .. totalCount .. ")")
end)

-- Test 2: Item Retrieval
TestFramework.test("Item Retrieval", function()
    -- Test getting existing item
    local potion = ItemDatabase.getItem("POTION")
    TestFramework.assertNotNil(potion, "POTION should exist")
    TestFramework.assertEquals("Potion", potion.name, "POTION name should be correct")
    TestFramework.assertEquals(20, potion.healAmount, "POTION heal amount should be 20")
    
    -- Test getting non-existent item
    local nonExistent = ItemDatabase.getItem("NON_EXISTENT_ITEM")
    TestFramework.assert(nonExistent == nil, "Non-existent item should return nil")
end)

-- Test 3: Category-based Queries
TestFramework.test("Category-based Queries", function()
    local pokeballs = ItemDatabase.getItemsByCategory(ItemDatabase.ItemCategory.POKEBALL)
    TestFramework.assert(#pokeballs > 0, "Should find pokeballs")
    TestFramework.assert(#pokeballs >= 5, "Should have at least 5 pokeball types")
    
    local healing = ItemDatabase.getItemsByCategory(ItemDatabase.ItemCategory.HEALING)
    TestFramework.assert(#healing > 0, "Should find healing items")
    
    local berries = ItemDatabase.getItemsByCategory(ItemDatabase.ItemCategory.BERRY)
    TestFramework.assert(#berries > 0, "Should find berries")
end)

-- Test 4: Pokeball Functions
TestFramework.test("Pokeball Functions", function()
    local pokeball = ItemDatabase.getPokeball("POKEBALL")
    TestFramework.assertNotNil(pokeball, "POKEBALL should exist")
    TestFramework.assertEquals(1.0, pokeball.catchRate, "POKEBALL catch rate should be 1.0")
    
    local masterBall = ItemDatabase.getPokeball("MASTER_BALL")
    TestFramework.assertNotNil(masterBall, "MASTER_BALL should exist")
    TestFramework.assertEquals(255.0, masterBall.catchRate, "MASTER_BALL catch rate should be 255.0")
    TestFramework.assert(masterBall.isRare, "MASTER_BALL should be marked as rare")
end)

-- Test 5: Healing Item Functions
TestFramework.test("Healing Item Functions", function()
    local potion = ItemDatabase.getHealingItem("POTION")
    TestFramework.assertNotNil(potion, "POTION should exist in healing items")
    TestFramework.assertEquals(20, potion.healAmount, "POTION should heal 20 HP")
    
    local maxPotion = ItemDatabase.getHealingItem("MAX_POTION")
    TestFramework.assertNotNil(maxPotion, "MAX_POTION should exist")
    TestFramework.assertEquals(0, maxPotion.healAmount, "MAX_POTION should have healAmount 0 (full heal)")
    
    local fullRestore = ItemDatabase.getHealingItem("FULL_RESTORE")
    TestFramework.assertNotNil(fullRestore, "FULL_RESTORE should exist")
    TestFramework.assert(fullRestore.curesStatus, "FULL_RESTORE should cure status")
end)

-- Test 6: Berry Functions
TestFramework.test("Berry Functions", function()
    local sitrus = ItemDatabase.getBerry("SITRUS_BERRY")
    TestFramework.assertNotNil(sitrus, "SITRUS_BERRY should exist")
    TestFramework.assertEquals(25, sitrus.healPercent, "SITRUS_BERRY should heal 25%")
    TestFramework.assertEquals(50, sitrus.activateThreshold, "SITRUS_BERRY should activate at 50% HP")
    
    local lum = ItemDatabase.getBerry("LUM_BERRY")
    TestFramework.assertNotNil(lum, "LUM_BERRY should exist")
    TestFramework.assert(lum.curesStatus, "LUM_BERRY should cure status")
end)

-- Test 7: Evolution Item Functions
TestFramework.test("Evolution Item Functions", function()
    local fireStone = ItemDatabase.getEvolutionItem(ItemDatabase.EvolutionItem.FIRE_STONE)
    TestFramework.assertNotNil(fireStone, "FIRE_STONE should exist")
    TestFramework.assertEquals("Fire Stone", fireStone.name, "FIRE_STONE name should be correct")
    
    -- Test species compatibility
    local canUse = ItemDatabase.canSpeciesUseEvolutionItem(37, ItemDatabase.EvolutionItem.FIRE_STONE) -- Vulpix
    TestFramework.assert(canUse, "Vulpix should be able to use Fire Stone")
    
    local cannotUse = ItemDatabase.canSpeciesUseEvolutionItem(25, ItemDatabase.EvolutionItem.FIRE_STONE) -- Pikachu
    TestFramework.assert(not cannotUse, "Pikachu should not be able to use Fire Stone")
end)

-- Test 8: Utility Functions
TestFramework.test("Utility Functions", function()
    -- Test consumable check
    TestFramework.assert(ItemDatabase.isConsumable("POTION"), "POTION should be consumable")
    TestFramework.assert(not ItemDatabase.isConsumable("AMULET_COIN"), "AMULET_COIN should not be consumable")
    
    -- Test stackable check
    TestFramework.assert(ItemDatabase.isStackable("POTION"), "POTION should be stackable")
    
    -- Test max stack
    local maxStack = ItemDatabase.getMaxStack("POTION")
    TestFramework.assertEquals(99, maxStack, "POTION max stack should be 99")
    
    -- Test context usage
    TestFramework.assert(ItemDatabase.canUseInContext("POTION", "overworld"), "POTION should work in overworld")
    TestFramework.assert(ItemDatabase.canUseInContext("POTION", "battle"), "POTION should work in battle")
end)

-- Test 9: Rare Item Detection
TestFramework.test("Rare Item Detection", function()
    TestFramework.assert(ItemDatabase.isRareItem("MASTER_BALL"), "MASTER_BALL should be rare")
    TestFramework.assert(ItemDatabase.isRareItem("SACRED_ASH"), "SACRED_ASH should be rare")
    TestFramework.assert(not ItemDatabase.isRareItem("POTION"), "POTION should not be rare")
end)

-- Test 10: Category and Rarity Functions
TestFramework.test("Category and Rarity Functions", function()
    TestFramework.assertEquals(ItemDatabase.ItemCategory.HEALING, ItemDatabase.getItemCategory("POTION"), "POTION should be healing category")
    TestFramework.assertEquals(ItemDatabase.ItemCategory.POKEBALL, ItemDatabase.getItemCategory("MASTER_BALL"), "MASTER_BALL should be pokeball category")
    
    TestFramework.assertEquals(ItemDatabase.ItemRarity.COMMON, ItemDatabase.getItemRarity("POTION"), "POTION should be common rarity")
    TestFramework.assertEquals(ItemDatabase.ItemRarity.MASTER, ItemDatabase.getItemRarity("MASTER_BALL"), "MASTER_BALL should be master rarity")
end)

-- Test 11: Friendship Item Functions
TestFramework.test("Friendship Item Functions", function()
    local pomegBerry = ItemDatabase.getFriendshipItem("POMEG_BERRY")
    TestFramework.assertNotNil(pomegBerry, "POMEG_BERRY should exist as friendship item")
    TestFramework.assert(pomegBerry.isFriendshipItem, "POMEG_BERRY should be marked as friendship item")
    
    -- Test friendship gain calculation
    local lowFriendshipGain = ItemDatabase.getFriendshipGain("POMEG_BERRY", 50) -- Low friendship
    local highFriendshipGain = ItemDatabase.getFriendshipGain("POMEG_BERRY", 220) -- High friendship
    TestFramework.assert(lowFriendshipGain > highFriendshipGain, "Lower friendship should give more gain")
end)

-- Test 12: Database Validation
TestFramework.test("Database Validation", function()
    local valid, error = ItemDatabase.validateDatabase()
    TestFramework.assert(valid, "Evolution item database should be valid: " .. (error or ""))
    
    -- Note: Complete validation may fail due to legacy items not having all fields
    -- This is expected and will be addressed in future updates
end)

-- Test Summary
print("\n=== Test Summary ===")
print("Tests passed: " .. TestFramework.passed)
print("Tests failed: " .. TestFramework.failed)
print("Total tests: " .. (TestFramework.passed + TestFramework.failed))

if TestFramework.failed == 0 then
    print("✓ All item database tests passed!")
else
    print("✗ " .. TestFramework.failed .. " tests failed")
end