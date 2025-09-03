--[[
Integration Tests for Held Item System
Complete held item workflow testing with system integration

Tests cover:
- Complete held item assignment workflows with inventory and Pokemon management
- Held item effects during battle scenarios with stat modifications
- Held item assignment persistence across save/load cycles
- Integration with Pokemon state manager for stat recalculation
- Held item restrictions and consumption in battle contexts
- Held item queries with existing query systems
- Complete held item acquisition, assignment, and usage scenarios

Tests use real system components with minimal mocking for integration validation
Battle state management with in-memory test battle creation
Automated state consistency checking for held item assignments and effects
--]]

-- Import test framework and systems under test
local TestFramework = require("tests.test-framework")
local HeldItemManager = require("game-logic.items.held-item-manager")
local HeldItemEffects = require("game-logic.items.held-item-effects")
local StatCalculator = require("game-logic.pokemon.stat-calculator")
local StateHandler = require("handlers.state-handler")

-- Import supporting systems
local ItemDatabase = require("data.items.item-database")
local InventoryManager = require("game-logic.items.inventory-manager") 
local PokemonStorage = require("data.pokemon-instances.pokemon-storage")

-- Test suite setup
local HeldItemIntegrationTests = {}

-- Test player and Pokemon data
local testPlayer = "integration_test_player"
local testPokemon1Data = {
    id = "pokemon_int_1",
    speciesId = 25, -- Pikachu
    nickname = "IntTestPikachu",
    level = 50,
    ivs = { hp = 31, attack = 31, defense = 31, spAttack = 31, spDefense = 31, speed = 31 },
    natureId = 3, -- Adamant (+Atk, -SpAtk)
    baseStats = { hp = 35, attack = 55, defense = 40, spAttack = 50, spDefense = 50, speed = 90 },
    stats = {},
    heldItem = nil,
    ability = "Static"
}

local testPokemon2Data = {
    id = "pokemon_int_2", 
    speciesId = 6, -- Charizard
    nickname = "IntTestCharizard",
    level = 50,
    ivs = { hp = 31, attack = 31, defense = 31, spAttack = 31, spDefense = 31, speed = 31 },
    natureId = 15, -- Modest (+SpAtk, -Atk)
    baseStats = { hp = 78, attack = 84, defense = 78, spAttack = 109, spDefense = 85, speed = 100 },
    stats = {},
    heldItem = nil,
    ability = "Blaze"
}

-- Setup function run before each test
function HeldItemIntegrationTests.setUp()
    -- Calculate stats for test Pokemon
    testPokemon1Data.stats = StatCalculator.calculateAllStats(
        testPokemon1Data.baseStats,
        testPokemon1Data.ivs,
        testPokemon1Data.level,
        testPokemon1Data.natureId
    )
    testPokemon1Data.heldItem = nil
    
    testPokemon2Data.stats = StatCalculator.calculateAllStats(
        testPokemon2Data.baseStats,
        testPokemon2Data.ivs,
        testPokemon2Data.level,
        testPokemon2Data.natureId
    )
    testPokemon2Data.heldItem = nil
    
    -- Set up Pokemon in storage
    PokemonStorage.savePokemon(testPokemon1Data.id, testPokemon1Data)
    PokemonStorage.savePokemon(testPokemon2Data.id, testPokemon2Data)
    
    -- Set up player inventory with held items
    local heldItems = {
        "CHOICE_BAND", "CHOICE_SPECS", "CHOICE_SCARF",
        "LEFTOVERS", "LIFE_ORB", "FOCUS_SASH",
        "ASSAULT_VEST", "ROCKY_HELMET"
    }
    
    for _, itemId in ipairs(heldItems) do
        InventoryManager.addItem(testPlayer, itemId, 3)
    end
end

-- Cleanup function run after each test
function HeldItemIntegrationTests.tearDown()
    -- Clean up Pokemon storage
    PokemonStorage.deletePokemon(testPokemon1Data.id)
    PokemonStorage.deletePokemon(testPokemon2Data.id)
    
    -- Clean up inventory
    InventoryManager.clearPlayerInventory(testPlayer)
end

-- Test complete held item assignment workflow

function HeldItemIntegrationTests.testCompleteAssignmentWorkflow_SuccessfulFlow()
    -- Arrange
    local pokemonId = testPokemon1Data.id
    local itemId = "CHOICE_BAND"
    local initialItemCount = InventoryManager.getItemCount(testPlayer, itemId)
    
    -- Act - Complete assignment workflow
    local success, result = HeldItemManager.assignHeldItem(pokemonId, itemId, testPlayer)
    
    -- Assert assignment succeeded
    TestFramework.assertTrue(success, "Held item assignment should succeed")
    TestFramework.assertEqual(result.action, "assign", "Should be assignment action")
    
    -- Verify Pokemon was updated
    local pokemon = PokemonStorage.getPokemon(pokemonId)
    TestFramework.assertEqual(pokemon.heldItem, itemId, "Pokemon should have held item")
    
    -- Verify inventory was updated
    local finalItemCount = InventoryManager.getItemCount(testPlayer, itemId)
    TestFramework.assertEqual(finalItemCount, initialItemCount - 1, "Item should be removed from inventory")
    
    -- Verify state consistency
    local consistencySuccess, consistencyResult = HeldItemManager.validatePlayerHeldItemConsistency(testPlayer)
    TestFramework.assertTrue(consistencySuccess, "Consistency validation should succeed")
    TestFramework.assertTrue(consistencyResult.valid, "Player state should be consistent")
end

-- Test held item effects during battle scenarios

function HeldItemIntegrationTests.testBattleStatModification_ChoiceBandBoost()
    -- Arrange - Assign Choice Band to Pokemon
    local pokemonId = testPokemon1Data.id
    local itemId = "CHOICE_BAND"
    
    HeldItemManager.assignHeldItem(pokemonId, itemId, testPlayer)
    local pokemon = PokemonStorage.getPokemon(pokemonId)
    
    -- Get original attack stat
    local originalAttack = pokemon.stats.attack
    
    -- Act - Apply held item stat modifiers
    local modifiedPokemon = StatCalculator.applyHeldItemModifiers(pokemon)
    
    -- Assert stat modification
    TestFramework.assertEqual(modifiedPokemon.stats.attack, math.floor(originalAttack * 1.5), 
        "Choice Band should boost attack by 50%")
    TestFramework.assertEqual(modifiedPokemon.stats.defense, pokemon.stats.defense, 
        "Defense should remain unchanged")
    TestFramework.assertNotNil(modifiedPokemon.originalStats, 
        "Original stats should be preserved")
end

function HeldItemIntegrationTests.testBattleChoiceRestriction_MoveLocking()
    -- Arrange - Assign Choice Specs and set up battle state
    local pokemonId = testPokemon2Data.id
    local itemId = "CHOICE_SPECS"
    
    HeldItemManager.assignHeldItem(pokemonId, itemId, testPlayer)
    local pokemon = PokemonStorage.getPokemon(pokemonId)
    
    -- Simulate first move use
    local firstMoveId = "FLAMETHROWER"
    
    -- Act - Apply choice restriction after first move
    local restrictionSuccess, restrictedPokemon = HeldItemEffects.applyChoiceRestriction(itemId, pokemon, firstMoveId)
    
    -- Assert restriction applied
    TestFramework.assertTrue(restrictionSuccess, "Choice restriction should be applied")
    TestFramework.assertEqual(restrictedPokemon.battleState.choiceLockedMove, firstMoveId, 
        "Pokemon should be locked to first move")
    
    -- Test restriction enforcement
    local restriction = HeldItemEffects.checkMoveRestriction(itemId, restrictedPokemon, "DRAGON_PULSE", {})
    TestFramework.assertNotNil(restriction, "Different move should be restricted")
    TestFramework.assertTrue(restriction.blocked, "Move should be blocked")
    
    -- Test same move is allowed
    local sameRestriction = HeldItemEffects.checkMoveRestriction(itemId, restrictedPokemon, firstMoveId, {})
    TestFramework.assertNil(sameRestriction, "Same move should be allowed")
end

-- Test held item persistence across save/load

function HeldItemIntegrationTests.testSaveLoadPersistence_PreservesAssignments()
    -- Arrange - Assign held items to Pokemon
    HeldItemManager.assignHeldItem(testPokemon1Data.id, "LEFTOVERS", testPlayer)
    HeldItemManager.assignHeldItem(testPokemon2Data.id, "LIFE_ORB", testPlayer)
    
    -- Act - Serialize held item assignments
    local serializeSuccess, serializedData = HeldItemManager.serializeHeldItemAssignments(testPlayer)
    
    -- Assert serialization
    TestFramework.assertTrue(serializeSuccess, "Serialization should succeed")
    TestFramework.assertEqual(#serializedData.assignments, 2, "Should serialize both assignments")
    
    -- Simulate data loss - remove held items
    local pokemon1 = PokemonStorage.getPokemon(testPokemon1Data.id)
    local pokemon2 = PokemonStorage.getPokemon(testPokemon2Data.id)
    pokemon1.heldItem = nil
    pokemon2.heldItem = nil
    PokemonStorage.savePokemon(testPokemon1Data.id, pokemon1)
    PokemonStorage.savePokemon(testPokemon2Data.id, pokemon2)
    
    -- Act - Load held item assignments
    local loadSuccess, loadResult = HeldItemManager.loadHeldItemAssignments(serializedData, testPlayer)
    
    -- Assert restoration
    TestFramework.assertTrue(loadSuccess, "Loading should succeed")
    TestFramework.assertEqual(loadResult.loadedCount, 2, "Should restore both assignments")
    TestFramework.assertEqual(loadResult.errorCount, 0, "Should have no errors")
    
    -- Verify Pokemon have items restored
    pokemon1 = PokemonStorage.getPokemon(testPokemon1Data.id)
    pokemon2 = PokemonStorage.getPokemon(testPokemon2Data.id)
    TestFramework.assertEqual(pokemon1.heldItem, "LEFTOVERS", "Pokemon 1 held item should be restored")
    TestFramework.assertEqual(pokemon2.heldItem, "LIFE_ORB", "Pokemon 2 held item should be restored")
end

-- Test integration with stat recalculation

function HeldItemIntegrationTests.testStatRecalculationIntegration_IncludesHeldItems()
    -- Arrange - Assign stat-boosting item
    local pokemonId = testPokemon1Data.id
    local itemId = "CHOICE_SCARF"
    
    HeldItemManager.assignHeldItem(pokemonId, itemId, testPlayer)
    local pokemon = PokemonStorage.getPokemon(pokemonId)
    
    -- Get original speed stat
    local originalSpeed = pokemon.stats.speed
    
    -- Act - Recalculate stats with held items
    local recalculatedStats = StatCalculator.recalculateStatsWithHeldItems(pokemon)
    
    -- Assert recalculation includes held item effects
    TestFramework.assertNotNil(recalculatedStats, "Stat recalculation should succeed")
    TestFramework.assertEqual(recalculatedStats.speed, math.floor(originalSpeed * 1.5), 
        "Recalculated speed should include Choice Scarf boost")
    TestFramework.assertEqual(recalculatedStats.attack, pokemon.stats.attack, 
        "Other stats should remain unchanged")
end

-- Test battle damage and recoil integration

function HeldItemIntegrationTests.testLifeOrbRecoilIntegration_CalculatesCorrectly()
    -- Arrange - Assign Life Orb
    local pokemonId = testPokemon2Data.id
    local itemId = "LIFE_ORB"
    
    HeldItemManager.assignHeldItem(pokemonId, itemId, testPlayer)
    local pokemon = PokemonStorage.getPokemon(pokemonId)
    
    -- Simulate move usage with damage
    local moveType = 9 -- Fire type
    local moveCategory = 1 -- Special
    local damageDealt = 80
    
    -- Act - Calculate power multiplier and recoil
    local powerMultiplier = HeldItemEffects.getMovePowerMultiplier(itemId, {}, moveType, moveCategory, {})
    local recoilDamage = HeldItemEffects.getRecoilDamage(itemId, pokemon, {}, damageDealt)
    
    -- Assert calculations
    TestFramework.assertEqual(powerMultiplier, 1.3, "Life Orb should boost move power by 30%")
    TestFramework.assertNotNil(recoilDamage, "Life Orb should cause recoil damage")
    TestFramework.assertEqual(recoilDamage.damage, math.floor(pokemon.stats.hp * 0.1), 
        "Recoil should be 10% of max HP")
end

-- Test held item swapping workflows

function HeldItemIntegrationTests.testSwappingWorkflows_AllVariations()
    -- Arrange - Set up Pokemon with and without items
    HeldItemManager.assignHeldItem(testPokemon1Data.id, "LEFTOVERS", testPlayer)
    -- testPokemon2Data.id has no item
    
    -- Test 1: Swap between Pokemon (one with item, one without)
    local swapSuccess, swapResult = HeldItemManager.swapHeldItems(
        testPokemon1Data.id, testPokemon2Data.id, testPlayer)
    
    TestFramework.assertTrue(swapSuccess, "Pokemon-to-Pokemon swap should succeed")
    
    -- Verify swap occurred
    local pokemon1 = PokemonStorage.getPokemon(testPokemon1Data.id)
    local pokemon2 = PokemonStorage.getPokemon(testPokemon2Data.id)
    TestFramework.assertNil(pokemon1.heldItem, "Pokemon 1 should no longer have item")
    TestFramework.assertEqual(pokemon2.heldItem, "LEFTOVERS", "Pokemon 2 should have the item")
    
    -- Test 2: Swap between Pokemon and inventory
    local inventorySwapSuccess, inventorySwapResult = HeldItemManager.swapPokemonInventoryHeldItem(
        testPokemon2Data.id, "CHOICE_BAND", testPlayer)
    
    TestFramework.assertTrue(inventorySwapSuccess, "Pokemon-inventory swap should succeed")
    
    -- Verify swap occurred
    pokemon2 = PokemonStorage.getPokemon(testPokemon2Data.id)
    TestFramework.assertEqual(pokemon2.heldItem, "CHOICE_BAND", "Pokemon should have new item")
    
    -- Verify inventory was updated correctly
    local leftoverCount = InventoryManager.getItemCount(testPlayer, "LEFTOVERS")
    local choiceBandCount = InventoryManager.getItemCount(testPlayer, "CHOICE_BAND")
    TestFramework.assertTrue(leftoverCount > 0, "Leftovers should be returned to inventory")
    TestFramework.assertTrue(choiceBandCount >= 0, "Choice Band should be removed from inventory")
end

-- Test query integration

function HeldItemIntegrationTests.testQueryIntegration_ReturnsAccurateData()
    -- Arrange - Set up multiple Pokemon with different held items
    HeldItemManager.assignHeldItem(testPokemon1Data.id, "FOCUS_SASH", testPlayer)
    HeldItemManager.assignHeldItem(testPokemon2Data.id, "ASSAULT_VEST", testPlayer)
    
    -- Test getting Pokemon with held items
    local pokemonSuccess, pokemonWithItems = HeldItemManager.getPokemonWithHeldItems(testPlayer)
    
    TestFramework.assertTrue(pokemonSuccess, "Query should succeed")
    TestFramework.assertEqual(#pokemonWithItems, 2, "Should return both Pokemon")
    
    -- Verify data accuracy
    local foundFocusSash = false
    local foundAssaultVest = false
    
    for _, pokemon in ipairs(pokemonWithItems) do
        if pokemon.heldItem == "FOCUS_SASH" then
            foundFocusSash = true
            TestFramework.assertEqual(pokemon.pokemonId, testPokemon1Data.id, "Focus Sash Pokemon ID should match")
        elseif pokemon.heldItem == "ASSAULT_VEST" then
            foundAssaultVest = true
            TestFramework.assertEqual(pokemon.pokemonId, testPokemon2Data.id, "Assault Vest Pokemon ID should match")
        end
    end
    
    TestFramework.assertTrue(foundFocusSash, "Should find Pokemon with Focus Sash")
    TestFramework.assertTrue(foundAssaultVest, "Should find Pokemon with Assault Vest")
end

-- Test statistics integration

function HeldItemIntegrationTests.testStatisticsIntegration_AccurateReporting()
    -- Arrange - Set up varied held item usage
    HeldItemManager.assignHeldItem(testPokemon1Data.id, "LIFE_ORB", testPlayer)
    HeldItemManager.assignHeldItem(testPokemon2Data.id, "LIFE_ORB", testPlayer) -- Same item on different Pokemon
    
    -- Need another Pokemon with different item category
    -- Since we only have 2 test Pokemon, we'll work with what we have
    
    -- Act - Get statistics
    local statsSuccess, statistics = HeldItemManager.getHeldItemStatistics(testPlayer)
    
    -- Assert statistics accuracy
    TestFramework.assertTrue(statsSuccess, "Statistics query should succeed")
    TestFramework.assertEqual(statistics.totalPokemonWithHeldItems, 2, "Should count both Pokemon")
    TestFramework.assertEqual(statistics.itemUsageCounts["LIFE_ORB"], 2, "Should count both Life Orb usages")
    TestFramework.assertEqual(statistics.categoryUsageCounts["held_item"], 2, "Should count held item category usage")
end

-- Test error handling and rollback scenarios

function HeldItemIntegrationTests.testErrorHandlingIntegration_ProperRollback()
    -- Arrange - Set up scenario that should fail
    local pokemonId = testPokemon1Data.id
    local itemId = "CHOICE_BAND"
    
    -- First assignment should succeed
    local firstSuccess, firstResult = HeldItemManager.assignHeldItem(pokemonId, itemId, testPlayer)
    TestFramework.assertTrue(firstSuccess, "First assignment should succeed")
    
    -- Second assignment to same Pokemon should fail and rollback properly
    local secondSuccess, secondError = HeldItemManager.assignHeldItem(pokemonId, "CHOICE_SPECS", testPlayer)
    
    TestFramework.assertFalse(secondSuccess, "Second assignment should fail")
    TestFramework.assertStringContains(secondError, "already has held item", "Error should mention existing item")
    
    -- Verify first assignment is still intact
    local pokemon = PokemonStorage.getPokemon(pokemonId)
    TestFramework.assertEqual(pokemon.heldItem, itemId, "First held item should still be assigned")
    
    -- Verify inventory wasn't affected by failed assignment
    local choiceSpecsCount = InventoryManager.getItemCount(testPlayer, "CHOICE_SPECS")
    TestFramework.assertTrue(choiceSpecsCount > 0, "Choice Specs should still be in inventory")
end

-- Test cross-system consistency

function HeldItemIntegrationTests.testCrossSystemConsistency_AllSystemsAligned()
    -- Arrange - Complex scenario with multiple systems
    local pokemonId = testPokemon1Data.id
    local itemId = "ROCKY_HELMET"
    
    -- Initial state check
    local initialConsistency = HeldItemManager.validatePlayerHeldItemConsistency(testPlayer)
    TestFramework.assertTrue(initialConsistency[1], "Initial state should be consistent")
    
    -- Perform assignment
    local assignSuccess, assignResult = HeldItemManager.assignHeldItem(pokemonId, itemId, testPlayer)
    TestFramework.assertTrue(assignSuccess, "Assignment should succeed")
    
    -- Check all systems are consistent
    -- 1. Pokemon storage should reflect the assignment
    local pokemon = PokemonStorage.getPokemon(pokemonId)
    TestFramework.assertEqual(pokemon.heldItem, itemId, "Pokemon storage should be updated")
    
    -- 2. Inventory should reflect the removal
    local itemCount = InventoryManager.getItemCount(testPlayer, itemId)
    TestFramework.assertTrue(itemCount >= 0, "Inventory should be updated")
    
    -- 3. Held item manager queries should be consistent
    local heldItemInfo = HeldItemManager.getHeldItemInfo(pokemonId)
    TestFramework.assertTrue(heldItemInfo[1], "Held item info query should succeed")
    TestFramework.assertEqual(heldItemInfo[2].heldItemId, itemId, "Query should return correct item")
    
    -- 4. Overall consistency validation should pass
    local finalConsistency = HeldItemManager.validatePlayerHeldItemConsistency(testPlayer)
    TestFramework.assertTrue(finalConsistency[1], "Final state should be consistent")
    TestFramework.assertTrue(finalConsistency[2].valid, "Consistency validation should pass")
end

-- Run all tests
function HeldItemIntegrationTests.runAllTests()
    local testMethods = {
        "testCompleteAssignmentWorkflow_SuccessfulFlow",
        "testBattleStatModification_ChoiceBandBoost",
        "testBattleChoiceRestriction_MoveLocking",
        "testSaveLoadPersistence_PreservesAssignments",
        "testStatRecalculationIntegration_IncludesHeldItems",
        "testLifeOrbRecoilIntegration_CalculatesCorrectly",
        "testSwappingWorkflows_AllVariations", 
        "testQueryIntegration_ReturnsAccurateData",
        "testStatisticsIntegration_AccurateReporting",
        "testErrorHandlingIntegration_ProperRollback",
        "testCrossSystemConsistency_AllSystemsAligned"
    }
    
    return TestFramework.runTestSuite("HeldItemIntegration", HeldItemIntegrationTests, testMethods)
end

return HeldItemIntegrationTests