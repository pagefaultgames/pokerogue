--[[
Unit Tests for Held Item Manager
Comprehensive testing for held item assignment, validation, and management

Tests cover:
- Held item assignment with proper validation
- Single item per Pokemon validation with error handling
- Held item swap functionality between Pokemon and inventory  
- Held item unequipping with inventory return
- Assignment persistence and consistency checking
- Batch operations and error handling
- Edge cases and invalid input handling

Follows AAA pattern (Arrange, Act, Assert) with 100% coverage requirement
All external dependencies mocked for isolated unit testing
--]]

-- Import test framework and modules under test
local TestFramework = require("tests.test-framework")
local HeldItemManager = require("game-logic.items.held-item-manager")

-- Mock external dependencies
local MockItemDatabase = require("tests.mocks.item-database-mock")
local MockInventoryManager = require("tests.mocks.inventory-manager-mock")
local MockPokemonStorage = require("tests.mocks.pokemon-storage-mock")

-- Test suite setup
local HeldItemManagerTests = {}

-- Test data
local testPokemon1 = {
    id = "pokemon_1",
    speciesId = 25, -- Pikachu
    nickname = "TestPikachu",
    stats = { hp = 100, attack = 55, defense = 40, spAttack = 50, spDefense = 50, speed = 90 },
    heldItem = nil
}

local testPokemon2 = {
    id = "pokemon_2", 
    speciesId = 6, -- Charizard
    nickname = "TestCharizard",
    stats = { hp = 150, attack = 84, defense = 78, spAttack = 109, spDefense = 85, speed = 100 },
    heldItem = "LEFTOVERS"
}

local testPlayer = "test_player_123"

-- Valid held items for testing
local validHeldItems = {
    "CHOICE_BAND",
    "CHOICE_SPECS", 
    "CHOICE_SCARF",
    "LEFTOVERS",
    "LIFE_ORB",
    "FOCUS_SASH"
}

-- Invalid items for testing
local invalidItems = {
    "POTION", -- healing item, not held item
    "POKEBALL", -- pokeball, not held item 
    "INVALID_ITEM" -- non-existent item
}

-- Setup function run before each test
function HeldItemManagerTests.setUp()
    -- Reset mocks
    MockItemDatabase.reset()
    MockInventoryManager.reset() 
    MockPokemonStorage.reset()
    
    -- Set up test data in mocks
    MockPokemonStorage.setPokemon("pokemon_1", testPokemon1)
    MockPokemonStorage.setPokemon("pokemon_2", testPokemon2)
    MockPokemonStorage.setPlayerPokemon(testPlayer, {
        pokemon_1 = testPokemon1,
        pokemon_2 = testPokemon2
    })
    
    -- Set up valid held items in item database
    for _, itemId in ipairs(validHeldItems) do
        MockItemDatabase.setItem(itemId, {
            id = itemId,
            category = "held_item",
            stackable = false
        })
    end
    
    -- Set up invalid items
    MockItemDatabase.setItem("POTION", {
        id = "POTION", 
        category = "healing",
        stackable = true
    })
    MockItemDatabase.setItem("POKEBALL", {
        id = "POKEBALL",
        category = "pokeball", 
        stackable = true
    })
    
    -- Set up player inventory
    for _, itemId in ipairs(validHeldItems) do
        MockInventoryManager.setPlayerItem(testPlayer, itemId, 5)
    end
end

-- Cleanup function run after each test  
function HeldItemManagerTests.tearDown()
    MockItemDatabase.reset()
    MockInventoryManager.reset()
    MockPokemonStorage.reset()
end

-- Test held item validation

function HeldItemManagerTests.testValidateHeldItem_ValidItem_ReturnsTrue()
    -- Arrange
    local itemId = "CHOICE_BAND"
    
    -- Act
    local isValid, error = HeldItemManager.validateHeldItem(itemId)
    
    -- Assert
    TestFramework.assertTrue(isValid, "Valid held item should be accepted")
    TestFramework.assertNil(error, "No error should be returned for valid item")
end

function HeldItemManagerTests.testValidateHeldItem_InvalidCategory_ReturnsFalse()
    -- Arrange
    local itemId = "POTION"
    
    -- Act
    local isValid, error = HeldItemManager.validateHeldItem(itemId)
    
    -- Assert
    TestFramework.assertFalse(isValid, "Non-held item should be rejected")
    TestFramework.assertNotNil(error, "Error message should be provided")
    TestFramework.assertStringContains(error, "not a held item", "Error should mention item category")
end

function HeldItemManagerTests.testValidateHeldItem_NonExistentItem_ReturnsFalse()
    -- Arrange
    local itemId = "INVALID_ITEM"
    
    -- Act
    local isValid, error = HeldItemManager.validateHeldItem(itemId)
    
    -- Assert
    TestFramework.assertFalse(isValid, "Non-existent item should be rejected")
    TestFramework.assertStringContains(error, "not found", "Error should mention item not found")
end

function HeldItemManagerTests.testValidateHeldItem_NilInput_ReturnsFalse()
    -- Arrange
    local itemId = nil
    
    -- Act
    local isValid, error = HeldItemManager.validateHeldItem(itemId)
    
    -- Assert
    TestFramework.assertFalse(isValid, "Nil item should be rejected")
    TestFramework.assertStringContains(error, "must be", "Error should mention input validation")
end

-- Test Pokemon validation

function HeldItemManagerTests.testValidatePokemonForHeldItem_ValidPokemon_ReturnsTrue()
    -- Arrange
    local pokemonId = "pokemon_1"
    
    -- Act
    local isValid, pokemonData = HeldItemManager.validatePokemonForHeldItem(pokemonId)
    
    -- Assert
    TestFramework.assertTrue(isValid, "Valid Pokemon should be accepted")
    TestFramework.assertNotNil(pokemonData, "Pokemon data should be returned")
    TestFramework.assertEqual(pokemonData.id, pokemonId, "Correct Pokemon data should be returned")
end

function HeldItemManagerTests.testValidatePokemonForHeldItem_NonExistentPokemon_ReturnsFalse()
    -- Arrange
    local pokemonId = "invalid_pokemon"
    
    -- Act 
    local isValid, error = HeldItemManager.validatePokemonForHeldItem(pokemonId)
    
    -- Assert
    TestFramework.assertFalse(isValid, "Non-existent Pokemon should be rejected")
    TestFramework.assertStringContains(error, "not found", "Error should mention Pokemon not found")
end

-- Test held item assignment

function HeldItemManagerTests.testAssignHeldItem_ValidAssignment_Succeeds()
    -- Arrange
    local pokemonId = "pokemon_1"
    local itemId = "CHOICE_BAND"
    
    -- Act
    local success, result = HeldItemManager.assignHeldItem(pokemonId, itemId, testPlayer)
    
    -- Assert  
    TestFramework.assertTrue(success, "Valid assignment should succeed")
    TestFramework.assertNotNil(result, "Result should be returned")
    TestFramework.assertEqual(result.pokemonId, pokemonId, "Result should contain Pokemon ID")
    TestFramework.assertEqual(result.itemId, itemId, "Result should contain item ID")
    TestFramework.assertEqual(result.action, "assign", "Result should indicate assignment action")
    
    -- Verify Pokemon was updated
    local pokemon = MockPokemonStorage.getPokemon(pokemonId)
    TestFramework.assertEqual(pokemon.heldItem, itemId, "Pokemon should have held item assigned")
    
    -- Verify item was removed from inventory
    local itemCount = MockInventoryManager.getPlayerItemCount(testPlayer, itemId)
    TestFramework.assertEqual(itemCount, 4, "Item should be removed from inventory") -- Started with 5
end

function HeldItemManagerTests.testAssignHeldItem_PokemonAlreadyHasItem_Fails()
    -- Arrange
    local pokemonId = "pokemon_2" -- Already has LEFTOVERS
    local itemId = "CHOICE_BAND" 
    
    -- Act
    local success, error = HeldItemManager.assignHeldItem(pokemonId, itemId, testPlayer)
    
    -- Assert
    TestFramework.assertFalse(success, "Assignment to Pokemon with item should fail")
    TestFramework.assertStringContains(error, "already has held item", "Error should mention existing item")
end

function HeldItemManagerTests.testAssignHeldItem_InsufficientInventory_Fails()
    -- Arrange
    local pokemonId = "pokemon_1"
    local itemId = "CHOICE_BAND"
    MockInventoryManager.setPlayerItem(testPlayer, itemId, 0) -- No items in inventory
    
    -- Act
    local success, error = HeldItemManager.assignHeldItem(pokemonId, itemId, testPlayer)
    
    -- Assert
    TestFramework.assertFalse(success, "Assignment without inventory should fail")
    TestFramework.assertStringContains(error, "does not have item", "Error should mention inventory")
end

function HeldItemManagerTests.testAssignHeldItem_InvalidQuantity_Fails()
    -- Arrange
    local pokemonId = "pokemon_1"
    local itemId = "CHOICE_BAND"
    local quantity = 2
    
    -- Act
    local success, error = HeldItemManager.assignHeldItem(pokemonId, itemId, testPlayer, quantity)
    
    -- Assert
    TestFramework.assertFalse(success, "Assignment with invalid quantity should fail")
    TestFramework.assertStringContains(error, "quantity of 1", "Error should mention quantity requirement")
end

-- Test held item unequipping

function HeldItemManagerTests.testUnequipHeldItem_PokemonWithItem_Succeeds()
    -- Arrange
    local pokemonId = "pokemon_2" -- Has LEFTOVERS
    local expectedItem = "LEFTOVERS"
    
    -- Act
    local success, result = HeldItemManager.unequipHeldItem(pokemonId, testPlayer)
    
    -- Assert
    TestFramework.assertTrue(success, "Unequipping held item should succeed")
    TestFramework.assertEqual(result.itemId, expectedItem, "Result should contain unequipped item")
    TestFramework.assertEqual(result.action, "unequip", "Result should indicate unequip action")
    
    -- Verify Pokemon no longer has item
    local pokemon = MockPokemonStorage.getPokemon(pokemonId)
    TestFramework.assertNil(pokemon.heldItem, "Pokemon should no longer have held item")
    
    -- Verify item was returned to inventory
    local itemCount = MockInventoryManager.getPlayerItemCount(testPlayer, expectedItem)
    TestFramework.assertEqual(itemCount, 6, "Item should be returned to inventory") -- Started with 5, should be 6
end

function HeldItemManagerTests.testUnequipHeldItem_PokemonWithoutItem_Fails()
    -- Arrange
    local pokemonId = "pokemon_1" -- No held item
    
    -- Act
    local success, error = HeldItemManager.unequipHeldItem(pokemonId, testPlayer)
    
    -- Assert
    TestFramework.assertFalse(success, "Unequipping from Pokemon without item should fail")
    TestFramework.assertStringContains(error, "does not have a held item", "Error should mention no item")
end

-- Test held item swapping between Pokemon

function HeldItemManagerTests.testSwapHeldItems_BothHaveItems_Succeeds()
    -- Arrange
    local pokemonId1 = "pokemon_2" -- Has LEFTOVERS
    local pokemonId2 = "pokemon_1"
    -- First assign an item to pokemon_1
    HeldItemManager.assignHeldItem(pokemonId2, "CHOICE_BAND", testPlayer)
    
    -- Act
    local success, result = HeldItemManager.swapHeldItems(pokemonId1, pokemonId2, testPlayer)
    
    -- Assert
    TestFramework.assertTrue(success, "Swapping between Pokemon with items should succeed")
    TestFramework.assertEqual(result.action, "swap", "Result should indicate swap action")
    
    -- Verify swap occurred
    local pokemon1 = MockPokemonStorage.getPokemon(pokemonId1)
    local pokemon2 = MockPokemonStorage.getPokemon(pokemonId2)
    TestFramework.assertEqual(pokemon1.heldItem, "CHOICE_BAND", "Pokemon 1 should have Pokemon 2's original item")
    TestFramework.assertEqual(pokemon2.heldItem, "LEFTOVERS", "Pokemon 2 should have Pokemon 1's original item")
end

function HeldItemManagerTests.testSwapHeldItems_OneHasItem_Succeeds()
    -- Arrange
    local pokemonId1 = "pokemon_2" -- Has LEFTOVERS
    local pokemonId2 = "pokemon_1" -- No item
    
    -- Act
    local success, result = HeldItemManager.swapHeldItems(pokemonId1, pokemonId2, testPlayer)
    
    -- Assert
    TestFramework.assertTrue(success, "Swapping with one empty slot should succeed")
    
    -- Verify swap occurred
    local pokemon1 = MockPokemonStorage.getPokemon(pokemonId1)
    local pokemon2 = MockPokemonStorage.getPokemon(pokemonId2) 
    TestFramework.assertNil(pokemon1.heldItem, "Pokemon 1 should no longer have item")
    TestFramework.assertEqual(pokemon2.heldItem, "LEFTOVERS", "Pokemon 2 should have Pokemon 1's item")
end

function HeldItemManagerTests.testSwapHeldItems_BothEmpty_Fails()
    -- Arrange  
    local pokemonId1 = "pokemon_1" -- No item
    local pokemonId2 = "pokemon_1" -- No item (using same Pokemon for simplicity)
    
    -- Act
    local success, error = HeldItemManager.swapHeldItems(pokemonId1, pokemonId2, testPlayer)
    
    -- Assert
    TestFramework.assertFalse(success, "Swapping between empty Pokemon should fail")
    TestFramework.assertStringContains(error, "nothing to swap", "Error should mention nothing to swap")
end

-- Test inventory-Pokemon swapping

function HeldItemManagerTests.testSwapPokemonInventoryHeldItem_AssignFromInventory_Succeeds()
    -- Arrange
    local pokemonId = "pokemon_1" -- No held item
    local itemId = "CHOICE_SPECS"
    
    -- Act
    local success, result = HeldItemManager.swapPokemonInventoryHeldItem(pokemonId, itemId, testPlayer)
    
    -- Assert
    TestFramework.assertTrue(success, "Assigning from inventory should succeed")
    TestFramework.assertEqual(result.newHeldItem, itemId, "Result should show new item")
    TestFramework.assertNil(result.previousHeldItem, "Result should show no previous item")
    
    -- Verify changes
    local pokemon = MockPokemonStorage.getPokemon(pokemonId)
    TestFramework.assertEqual(pokemon.heldItem, itemId, "Pokemon should have new item")
    
    local itemCount = MockInventoryManager.getPlayerItemCount(testPlayer, itemId)
    TestFramework.assertEqual(itemCount, 4, "Item should be removed from inventory")
end

function HeldItemManagerTests.testSwapPokemonInventoryHeldItem_UnequipToInventory_Succeeds()
    -- Arrange
    local pokemonId = "pokemon_2" -- Has LEFTOVERS
    local expectedPreviousItem = "LEFTOVERS"
    
    -- Act
    local success, result = HeldItemManager.swapPokemonInventoryHeldItem(pokemonId, nil, testPlayer)
    
    -- Assert
    TestFramework.assertTrue(success, "Unequipping to inventory should succeed")
    TestFramework.assertNil(result.newHeldItem, "Result should show no new item")
    TestFramework.assertEqual(result.previousHeldItem, expectedPreviousItem, "Result should show previous item")
    
    -- Verify changes
    local pokemon = MockPokemonStorage.getPokemon(pokemonId)
    TestFramework.assertNil(pokemon.heldItem, "Pokemon should no longer have item")
    
    local itemCount = MockInventoryManager.getPlayerItemCount(testPlayer, expectedPreviousItem)
    TestFramework.assertEqual(itemCount, 6, "Item should be added to inventory")
end

-- Test query functions

function HeldItemManagerTests.testGetPokemonWithHeldItems_ReturnsCorrectData()
    -- Arrange - pokemon_2 has LEFTOVERS, pokemon_1 has nothing
    
    -- Act
    local success, result = HeldItemManager.getPokemonWithHeldItems(testPlayer)
    
    -- Assert
    TestFramework.assertTrue(success, "Getting Pokemon with held items should succeed")
    TestFramework.assertEqual(#result, 1, "Should return one Pokemon with held item")
    TestFramework.assertEqual(result[1].pokemonId, "pokemon_2", "Should return correct Pokemon")
    TestFramework.assertEqual(result[1].heldItem, "LEFTOVERS", "Should return correct held item")
end

function HeldItemManagerTests.testGetHeldItemInfo_PokemonWithItem_ReturnsInfo()
    -- Arrange
    local pokemonId = "pokemon_2" -- Has LEFTOVERS
    
    -- Act
    local success, result = HeldItemManager.getHeldItemInfo(pokemonId)
    
    -- Assert
    TestFramework.assertTrue(success, "Getting held item info should succeed")
    TestFramework.assertTrue(result.hasHeldItem, "Should indicate Pokemon has held item")
    TestFramework.assertEqual(result.heldItemId, "LEFTOVERS", "Should return correct item ID")
    TestFramework.assertTrue(result.canUnequip, "Should indicate item can be unequipped")
end

function HeldItemManagerTests.testGetHeldItemInfo_PokemonWithoutItem_ReturnsEmptyInfo()
    -- Arrange
    local pokemonId = "pokemon_1" -- No held item
    
    -- Act
    local success, result = HeldItemManager.getHeldItemInfo(pokemonId)
    
    -- Assert
    TestFramework.assertTrue(success, "Getting held item info should succeed")
    TestFramework.assertFalse(result.hasHeldItem, "Should indicate Pokemon has no held item")
    TestFramework.assertNil(result.heldItemId, "Should return no item ID")
end

-- Test validation and consistency

function HeldItemManagerTests.testValidatePlayerHeldItemConsistency_ValidState_ReturnsValid()
    -- Arrange - default state is valid
    
    -- Act
    local success, result = HeldItemManager.validatePlayerHeldItemConsistency(testPlayer)
    
    -- Assert
    TestFramework.assertTrue(success, "Consistency validation should succeed")
    TestFramework.assertTrue(result.valid, "Player state should be valid")
    TestFramework.assertEqual(result.pokemonCount, 2, "Should count all Pokemon")
    TestFramework.assertEqual(result.heldItemCount, 1, "Should count held items")
    TestFramework.assertEqual(#result.issues, 0, "Should have no issues")
end

function HeldItemManagerTests.testValidatePlayerHeldItemConsistency_InvalidItem_ReturnsInvalid()
    -- Arrange - give Pokemon an invalid held item
    local pokemon = MockPokemonStorage.getPokemon("pokemon_1")
    pokemon.heldItem = "INVALID_HELD_ITEM"
    MockPokemonStorage.setPokemon("pokemon_1", pokemon)
    
    -- Act
    local success, result = HeldItemManager.validatePlayerHeldItemConsistency(testPlayer)
    
    -- Assert
    TestFramework.assertTrue(success, "Consistency validation should succeed")
    TestFramework.assertFalse(result.valid, "Player state should be invalid")
    TestFramework.assertEqual(#result.issues, 1, "Should have one issue")
    TestFramework.assertEqual(result.issues[1].type, "invalid_held_item", "Issue should be invalid held item")
end

-- Test statistics

function HeldItemManagerTests.testGetHeldItemStatistics_ReturnsAccurateStats()
    -- Arrange - pokemon_2 has LEFTOVERS
    
    -- Act
    local success, result = HeldItemManager.getHeldItemStatistics(testPlayer)
    
    -- Assert
    TestFramework.assertTrue(success, "Getting statistics should succeed")
    TestFramework.assertEqual(result.totalPokemonWithHeldItems, 1, "Should count Pokemon with items")
    TestFramework.assertEqual(result.itemUsageCounts["LEFTOVERS"], 1, "Should count item usage")
    TestFramework.assertEqual(result.categoryUsageCounts["held_item"], 1, "Should count category usage")
end

-- Test batch operations

function HeldItemManagerTests.testBatchAssignHeldItems_ValidAssignments_Succeeds()
    -- Arrange
    local assignments = {
        {pokemonId = "pokemon_1", itemId = "CHOICE_BAND"},
    }
    
    -- Act
    local success, result = HeldItemManager.batchAssignHeldItems(assignments, testPlayer)
    
    -- Assert
    TestFramework.assertTrue(success, "Batch assignment should succeed")
    TestFramework.assertEqual(result.successCount, 1, "Should complete one assignment")
    TestFramework.assertTrue(result.results[1].success, "Assignment should succeed")
end

function HeldItemManagerTests.testBatchAssignHeldItems_PartialFailure_RollsBack()
    -- Arrange
    local assignments = {
        {pokemonId = "pokemon_1", itemId = "CHOICE_BAND"}, -- Valid
        {pokemonId = "pokemon_2", itemId = "CHOICE_SPECS"}, -- Invalid - pokemon_2 has item
    }
    
    -- Act
    local success, result = HeldItemManager.batchAssignHeldItems(assignments, testPlayer)
    
    -- Assert
    TestFramework.assertFalse(success, "Batch assignment should fail")
    TestFramework.assertNotNil(result.error, "Should provide error details")
    
    -- Verify rollback occurred
    local pokemon1 = MockPokemonStorage.getPokemon("pokemon_1")
    TestFramework.assertNil(pokemon1.heldItem, "Pokemon 1 should not have item after rollback")
end

-- Test serialization and persistence

function HeldItemManagerTests.testSerializeHeldItemAssignments_CreatesValidData()
    -- Arrange - pokemon_2 has LEFTOVERS
    
    -- Act
    local success, result = HeldItemManager.serializeHeldItemAssignments(testPlayer)
    
    -- Assert
    TestFramework.assertTrue(success, "Serialization should succeed")
    TestFramework.assertEqual(result.version, "1.0", "Should include version")
    TestFramework.assertEqual(result.playerId, testPlayer, "Should include player ID")
    TestFramework.assertEqual(#result.assignments, 1, "Should serialize one assignment")
    TestFramework.assertEqual(result.assignments[1].heldItem, "LEFTOVERS", "Should serialize correct item")
end

function HeldItemManagerTests.testLoadHeldItemAssignments_RestoresValidData()
    -- Arrange
    local serializedData = {
        version = "1.0",
        playerId = testPlayer,
        assignments = {
            {pokemonId = "pokemon_1", heldItem = "CHOICE_BAND", speciesId = 25}
        }
    }
    
    -- Act
    local success, result = HeldItemManager.loadHeldItemAssignments(serializedData, testPlayer)
    
    -- Assert
    TestFramework.assertTrue(success, "Loading should succeed")
    TestFramework.assertEqual(result.loadedCount, 1, "Should load one assignment")
    TestFramework.assertEqual(result.errorCount, 0, "Should have no errors")
    
    -- Verify data was loaded
    local pokemon = MockPokemonStorage.getPokemon("pokemon_1")
    TestFramework.assertEqual(pokemon.heldItem, "CHOICE_BAND", "Pokemon should have loaded item")
end

-- Run all tests
function HeldItemManagerTests.runAllTests()
    local testMethods = {
        "testValidateHeldItem_ValidItem_ReturnsTrue",
        "testValidateHeldItem_InvalidCategory_ReturnsFalse", 
        "testValidateHeldItem_NonExistentItem_ReturnsFalse",
        "testValidateHeldItem_NilInput_ReturnsFalse",
        "testValidatePokemonForHeldItem_ValidPokemon_ReturnsTrue",
        "testValidatePokemonForHeldItem_NonExistentPokemon_ReturnsFalse",
        "testAssignHeldItem_ValidAssignment_Succeeds",
        "testAssignHeldItem_PokemonAlreadyHasItem_Fails",
        "testAssignHeldItem_InsufficientInventory_Fails",
        "testAssignHeldItem_InvalidQuantity_Fails",
        "testUnequipHeldItem_PokemonWithItem_Succeeds",
        "testUnequipHeldItem_PokemonWithoutItem_Fails",
        "testSwapHeldItems_BothHaveItems_Succeeds",
        "testSwapHeldItems_OneHasItem_Succeeds",
        "testSwapHeldItems_BothEmpty_Fails", 
        "testSwapPokemonInventoryHeldItem_AssignFromInventory_Succeeds",
        "testSwapPokemonInventoryHeldItem_UnequipToInventory_Succeeds",
        "testGetPokemonWithHeldItems_ReturnsCorrectData",
        "testGetHeldItemInfo_PokemonWithItem_ReturnsInfo",
        "testGetHeldItemInfo_PokemonWithoutItem_ReturnsEmptyInfo",
        "testValidatePlayerHeldItemConsistency_ValidState_ReturnsValid",
        "testValidatePlayerHeldItemConsistency_InvalidItem_ReturnsInvalid",
        "testGetHeldItemStatistics_ReturnsAccurateStats",
        "testBatchAssignHeldItems_ValidAssignments_Succeeds",
        "testBatchAssignHeldItems_PartialFailure_RollsBack",
        "testSerializeHeldItemAssignments_CreatesValidData",
        "testLoadHeldItemAssignments_RestoresValidData"
    }
    
    return TestFramework.runTestSuite("HeldItemManager", HeldItemManagerTests, testMethods)
end

return HeldItemManagerTests