--[[
Inventory Manager Unit Tests
Tests for ao-processes/game-logic/items/inventory-manager.lua
--]]

local InventoryManager = require('ao-processes.game-logic.items.inventory-manager')
local ItemDatabase = require('ao-processes.data.items.item-database')

-- Test framework setup
local function assert(condition, message)
    if not condition then
        error("Assertion failed: " .. message)
    else
        print("✓ " .. message)
    end
end

local function assertEquals(expected, actual, message)
    assert(expected == actual, message .. " (expected: " .. tostring(expected) .. ", got: " .. tostring(actual) .. ")")
end

local function assertNotNil(value, message)
    assert(value ~= nil, message .. " should not be nil")
end

-- Initialize systems
ItemDatabase.init()
InventoryManager.init()

print("=== Inventory Manager Unit Tests ===")

local testPlayerId = "test-player-" .. os.time()

-- Test 1: Basic Item Addition
print("\n--- Basic Item Addition ---")

local success, message, quantity = InventoryManager.addItem(testPlayerId, "POTION", 5, "Test acquisition")
assert(success, "Adding 5 potions should succeed")
assertEquals(5, quantity, "Final quantity should be 5")
assertEquals(5, InventoryManager.getItemQuantity(testPlayerId, "POTION"), "Inventory should show 5 potions")
print("✓ Basic item addition works correctly")

-- Test adding more of the same item (stacking)
success, message, quantity = InventoryManager.addItem(testPlayerId, "POTION", 3)
assert(success, "Adding 3 more potions should succeed")
assertEquals(8, quantity, "Final quantity should be 8")
print("✓ Item stacking works correctly")

-- Test 2: Stack Limits
print("\n--- Stack Limits ---")

-- Try to add more than stack limit
success, message, quantity = InventoryManager.addItem(testPlayerId, "POTION", 100)
-- Should succeed but adjust quantity to fit within stack limit
assert(success, "Adding potions should succeed (quantity adjusted to fit)")
assert(quantity == 99, "Should reach stack limit of 99")
assertEquals(99, InventoryManager.getItemQuantity(testPlayerId, "POTION"), "Quantity should be at stack limit")
print("✓ Stack limits are enforced")

-- Try to add more when already at limit
success, message, quantity = InventoryManager.addItem(testPlayerId, "POTION", 1) -- Should fail, already at 99
assert(not success, "Adding more potions should fail when at stack limit")
assert(message:match("stack full"), "Error message should mention stack full")
assertEquals(99, InventoryManager.getItemQuantity(testPlayerId, "POTION"), "Quantity should remain at 99")
print("✓ Cannot exceed stack limit")

-- Test 3: Non-stackable Items
print("\n--- Non-stackable Items ---")

success, message, quantity = InventoryManager.addItem(testPlayerId, "AMULET_COIN", 1)
assert(success, "Adding 1 Amulet Coin should succeed")
assertEquals(1, quantity, "Quantity should be 1")

-- Try to add another non-stackable item
success, message, quantity = InventoryManager.addItem(testPlayerId, "AMULET_COIN", 1)
assert(not success, "Adding second Amulet Coin should fail")
assert(message:match("not stackable"), "Error message should mention non-stackable")
print("✓ Non-stackable items are handled correctly")

-- Test 4: Item Removal
print("\n--- Item Removal ---")

success, message, remaining = InventoryManager.removeItem(testPlayerId, "POTION", 10, "Test removal")
assert(success, "Removing 10 potions should succeed")
assertEquals(89, remaining, "Should have 89 potions remaining")
assertEquals(89, InventoryManager.getItemQuantity(testPlayerId, "POTION"), "Inventory should show 89 potions")
print("✓ Item removal works correctly")

-- Test removing more than available
success, message, remaining = InventoryManager.removeItem(testPlayerId, "POTION", 100)
assert(not success, "Removing 100 potions should fail (insufficient quantity)")
assert(message:match("Insufficient quantity"), "Error message should mention insufficient quantity")
assertEquals(89, InventoryManager.getItemQuantity(testPlayerId, "POTION"), "Quantity should remain 89")
print("✓ Insufficient quantity errors are handled")

-- Test removing entire stack
success, message, remaining = InventoryManager.removeItem(testPlayerId, "POTION", 89)
assert(success, "Removing all 89 potions should succeed")
assertEquals(0, remaining, "Should have 0 potions remaining")
assertEquals(0, InventoryManager.getItemQuantity(testPlayerId, "POTION"), "Inventory should show 0 potions")
print("✓ Complete item removal works correctly")

-- Test 5: Consumable Item Usage
print("\n--- Consumable Item Usage ---")

-- Add some consumable items
InventoryManager.addItem(testPlayerId, "SUPER_POTION", 5)
success, message, remaining = InventoryManager.useItem(testPlayerId, "SUPER_POTION", 2, "Healing Pokemon")
assert(success, "Using 2 Super Potions should succeed")
assertEquals(3, remaining, "Should have 3 Super Potions remaining")
print("✓ Consumable item usage works correctly")

-- Test using non-consumable item
success, message, remaining = InventoryManager.useItem(testPlayerId, "AMULET_COIN", 1)
assert(not success, "Using non-consumable item should fail")
assert(message:match("not consumable"), "Error message should mention non-consumable")
print("✓ Non-consumable items cannot be used")

-- Test 6: Inventory Queries
print("\n--- Inventory Queries ---")

-- Add items from different categories
InventoryManager.addItem(testPlayerId, "POKEBALL", 10)
InventoryManager.addItem(testPlayerId, "SITRUS_BERRY", 3)
InventoryManager.addItem(testPlayerId, "NUGGET", 1)

local inventory = InventoryManager.getInventory(testPlayerId)
assertNotNil(inventory, "Inventory should exist")
assert(inventory.totalItems > 0, "Inventory should have items")
print("✓ Full inventory retrieval works")

-- Test category-based queries
local pokeballs = InventoryManager.getItemsByCategory(testPlayerId, ItemDatabase.ItemCategory.POKEBALL)
assert(#pokeballs > 0, "Should find pokeballs in inventory")
assertEquals("POKEBALL", pokeballs[1].itemId, "First pokeball should be POKEBALL")
assertEquals(10, pokeballs[1].quantity, "Should have 10 pokeballs")
print("✓ Category-based inventory queries work")

local berries = InventoryManager.getItemsByCategory(testPlayerId, ItemDatabase.ItemCategory.BERRY)
assert(#berries > 0, "Should find berries in inventory")
print("✓ Berry category query works")

-- Test 7: Transaction History
print("\n--- Transaction History ---")

local transactions = InventoryManager.getTransactionHistory(testPlayerId)
assert(#transactions > 0, "Should have transaction history")

-- Check that transactions are recorded correctly
local lastTransaction = transactions[#transactions]
assertNotNil(lastTransaction.timestamp, "Transaction should have timestamp")
assertNotNil(lastTransaction.type, "Transaction should have type")
assertNotNil(lastTransaction.itemId, "Transaction should have itemId")
print("✓ Transaction history is recorded correctly")

-- Test limited transaction history
local limitedTransactions = InventoryManager.getTransactionHistory(testPlayerId, 3)
assert(#limitedTransactions <= 3, "Limited history should respect limit")
print("✓ Transaction history limiting works")

-- Test 8: Inventory Validation
print("\n--- Inventory Validation ---")

local valid, errors = InventoryManager.validateInventory(testPlayerId)
assert(valid or #errors == 0, "Inventory should be valid or have specific errors")
if not valid then
    print("Validation errors found (may be expected for test data):")
    for _, error in ipairs(errors) do
        print("  " .. error)
    end
end
print("✓ Inventory validation runs without crashing")

-- Test 9: Inventory Statistics
print("\n--- Inventory Statistics ---")

local stats = InventoryManager.getInventoryStats(testPlayerId)
assertNotNil(stats, "Statistics should be available")
assert(stats.totalItems >= 0, "Total items should be non-negative")
assert(stats.capacity > 0, "Capacity should be positive")
assert(stats.capacityUsed >= 0 and stats.capacityUsed <= 100, "Capacity used should be percentage")
assertNotNil(stats.categoryCounts, "Category counts should be available")
print("✓ Inventory statistics work correctly")
print("  Total items: " .. stats.totalItems)
print("  Capacity used: " .. stats.capacityUsed .. "%")
print("  Total value: " .. stats.totalValue)

-- Test 10: Capacity Management
print("\n--- Capacity Management ---")

local success, message = InventoryManager.setCapacity(testPlayerId, 50)
assert(success, "Setting capacity to 50 should succeed")
assertEquals(50, InventoryManager.getInventory(testPlayerId).capacity, "Capacity should be updated")
print("✓ Capacity setting works")

-- Try to set capacity below current item count
local currentItems = InventoryManager.getInventory(testPlayerId).totalItems
success, message = InventoryManager.setCapacity(testPlayerId, currentItems - 1)
assert(not success, "Setting capacity below item count should fail")
print("✓ Capacity validation prevents invalid reductions")

-- Test 11: Item Existence Checks
print("\n--- Item Existence Checks ---")

assert(InventoryManager.hasItem(testPlayerId, "SUPER_POTION", 1), "Should have at least 1 Super Potion")
assert(InventoryManager.hasItem(testPlayerId, "SUPER_POTION", 3), "Should have exactly 3 Super Potions")
assert(not InventoryManager.hasItem(testPlayerId, "SUPER_POTION", 5), "Should not have 5 Super Potions")
assert(not InventoryManager.hasItem(testPlayerId, "NONEXISTENT_ITEM", 1), "Should not have non-existent item")
print("✓ Item existence checks work correctly")

-- Test 12: Serialization and Deserialization
print("\n--- Serialization ---")

local serializedData = InventoryManager.serializeInventory(testPlayerId)
assertNotNil(serializedData, "Serialized data should not be nil")
assertNotNil(serializedData.items, "Serialized data should have items")
assertNotNil(serializedData.capacity, "Serialized data should have capacity")
print("✓ Inventory serialization works")

-- Test deserialization with new player
local newPlayerId = "test-player-deserialization"
success, message = InventoryManager.deserializeInventory(newPlayerId, serializedData)
assert(success, "Deserialization should succeed: " .. (message or ""))

local originalInventory = InventoryManager.getInventory(testPlayerId)
local deserializedInventory = InventoryManager.getInventory(newPlayerId)
assertEquals(originalInventory.totalItems, deserializedInventory.totalItems, "Deserialized inventory should match original")
print("✓ Inventory deserialization works")

-- Test 13: Error Handling
print("\n--- Error Handling ---")

-- Test invalid quantities
success, message = InventoryManager.addItem(testPlayerId, "POTION", 0)
assert(not success, "Adding 0 items should fail")

success, message = InventoryManager.addItem(testPlayerId, "POTION", -5)
assert(not success, "Adding negative items should fail")

-- Test invalid item IDs
success, message = InventoryManager.addItem(testPlayerId, "INVALID_ITEM_ID", 1)
assert(not success, "Adding invalid item should fail")

-- Test nil parameters
success, message = InventoryManager.addItem(nil, "POTION", 1)
assert(not success, "Nil player ID should fail")

print("✓ Error handling works correctly")

-- Test 14: Inventory Clearing (Admin function)
print("\n--- Inventory Clearing ---")

local itemCountBefore = InventoryManager.getInventory(testPlayerId).totalItems
success, itemsCleared = InventoryManager.clearInventory(testPlayerId, "Unit test cleanup")
assert(success, "Clearing inventory should succeed")
assertEquals(0, InventoryManager.getInventory(testPlayerId).totalItems, "Inventory should be empty after clearing")
assertEquals(itemCountBefore, itemsCleared, "Should report correct number of cleared items")
print("✓ Inventory clearing works correctly")

print("\n=== All Inventory Manager Tests Passed! ===")