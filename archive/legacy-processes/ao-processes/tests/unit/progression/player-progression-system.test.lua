-- Unit Tests for Player Progression System
-- Comprehensive testing of player progression tracking functions
-- Follows AAA pattern (Arrange, Act, Assert) and mocks all external dependencies

-- Test framework setup
local TestFramework = {
    tests = {},
    currentTest = nil,
    assertions = 0,
    failures = 0,
    successes = 0
}

-- Simple assertion functions
function TestFramework.assertEqual(actual, expected, message)
    TestFramework.assertions = TestFramework.assertions + 1
    if actual == expected then
        TestFramework.successes = TestFramework.successes + 1
    else
        TestFramework.failures = TestFramework.failures + 1
        print("FAIL: " .. (message or "Assertion failed"))
        print("  Expected: " .. tostring(expected))
        print("  Actual: " .. tostring(actual))
    end
end

function TestFramework.assertTrue(condition, message)
    TestFramework.assertEqual(condition, true, message)
end

function TestFramework.assertFalse(condition, message)
    TestFramework.assertEqual(condition, false, message)
end

function TestFramework.assertNotNil(value, message)
    TestFramework.assertions = TestFramework.assertions + 1
    if value ~= nil then
        TestFramework.successes = TestFramework.successes + 1
    else
        TestFramework.failures = TestFramework.failures + 1
        print("FAIL: " .. (message or "Expected non-nil value"))
    end
end

function TestFramework.assertNil(value, message)
    TestFramework.assertions = TestFramework.assertions + 1
    if value == nil then
        TestFramework.successes = TestFramework.successes + 1
    else
        TestFramework.failures = TestFramework.failures + 1
        print("FAIL: " .. (message or "Expected nil value"))
        print("  Actual: " .. tostring(value))
    end
end

-- Mock dependencies
local MockEnums = {
    SpeciesId = {
        BULBASAUR = 1,
        CHARMANDER = 4,
        SQUIRTLE = 7,
        PIKACHU = 25,
        MEW = 151
    },
    isValidSpecies = function(id)
        for _, speciesId in pairs(MockEnums.SpeciesId) do
            if speciesId == id then
                return true
            end
        end
        return false
    end
}

-- Mock os.time for consistent testing
local mockTime = 1000000000
local function mockOsTime()
    return mockTime
end

-- Replace require for testing
local originalRequire = require
local function mockRequire(module)
    if module == "data.constants.enums" then
        return MockEnums
    end
    return originalRequire(module)
end

-- Set up mocks
_G.require = mockRequire
_G.os.time = mockOsTime

-- Load the module under test
local PlayerProgressionSystem = require("game-logic.progression.player-progression-system")

-- Test Suite: Player Progression Initialization
local function testInitializePlayerProgression()
    print("Testing: Player Progression Initialization")
    
    -- Test 1: Valid initialization
    local playerData, error = PlayerProgressionSystem.initializePlayerProgression("player123", "TestPlayer", 0)
    
    TestFramework.assertNotNil(playerData, "Player data should not be nil")
    TestFramework.assertNil(error, "Error should be nil for valid initialization")
    TestFramework.assertEqual(playerData.playerId, "player123", "Player ID should match")
    TestFramework.assertEqual(playerData.character.name, "TestPlayer", "Player name should match")
    TestFramework.assertEqual(playerData.character.gender, 0, "Gender should match")
    TestFramework.assertEqual(playerData.progression.badgeCount, 0, "Badge count should start at 0")
    TestFramework.assertEqual(playerData.pokedex.seenCount, 0, "Pokédex seen count should start at 0")
    TestFramework.assertEqual(playerData.money.current, 3000, "Starting money should be 3000")
    
    -- Test 2: Invalid player ID
    local invalidData, invalidError = PlayerProgressionSystem.initializePlayerProgression(nil, "TestPlayer", 0)
    
    TestFramework.assertNil(invalidData, "Player data should be nil for invalid ID")
    TestFramework.assertNotNil(invalidError, "Error should not be nil for invalid ID")
    
    -- Test 3: Invalid player name
    local invalidNameData, invalidNameError = PlayerProgressionSystem.initializePlayerProgression("player123", "", 0)
    
    TestFramework.assertNil(invalidNameData, "Player data should be nil for invalid name")
    TestFramework.assertNotNil(invalidNameError, "Error should not be nil for invalid name")
    
    -- Test 4: Default gender
    local defaultGenderData = PlayerProgressionSystem.initializePlayerProgression("player123", "TestPlayer")
    
    TestFramework.assertNotNil(defaultGenderData, "Player data should not be nil with default gender")
    TestFramework.assertEqual(defaultGenderData.character.gender, 0, "Default gender should be MALE (0)")
    
    print("Player Progression Initialization tests completed")
end

-- Test Suite: Player Character Management
local function testPlayerCharacterManagement()
    print("Testing: Player Character Management")
    
    -- Arrange
    local playerData = PlayerProgressionSystem.initializePlayerProgression("player123", "TestPlayer", 0)
    
    -- Test 1: Valid character update
    local characterUpdates = {
        name = "UpdatedPlayer",
        gender = 1,
        appearance = 1
    }
    
    local success, error = PlayerProgressionSystem.updatePlayerCharacter(playerData, characterUpdates)
    
    TestFramework.assertTrue(success, "Character update should succeed")
    TestFramework.assertNil(error, "Error should be nil for valid update")
    TestFramework.assertEqual(playerData.character.name, "UpdatedPlayer", "Name should be updated")
    TestFramework.assertEqual(playerData.character.gender, 1, "Gender should be updated")
    TestFramework.assertEqual(playerData.character.appearance, 1, "Appearance should be updated")
    
    -- Test 2: Invalid player data
    local invalidSuccess, invalidError = PlayerProgressionSystem.updatePlayerCharacter(nil, characterUpdates)
    
    TestFramework.assertFalse(invalidSuccess, "Update should fail with invalid data")
    TestFramework.assertNotNil(invalidError, "Error should not be nil for invalid data")
    
    -- Test 3: Invalid character updates
    local invalidUpdateSuccess, invalidUpdateError = PlayerProgressionSystem.updatePlayerCharacter(playerData, nil)
    
    TestFramework.assertFalse(invalidUpdateSuccess, "Update should fail with invalid updates")
    TestFramework.assertNotNil(invalidUpdateError, "Error should not be nil for invalid updates")
    
    -- Test 4: Invalid name update
    local invalidNameUpdate = { name = "" }
    local nameUpdateSuccess, nameUpdateError = PlayerProgressionSystem.updatePlayerCharacter(playerData, invalidNameUpdate)
    
    TestFramework.assertFalse(nameUpdateSuccess, "Update should fail with empty name")
    TestFramework.assertNotNil(nameUpdateError, "Error should not be nil for empty name")
    
    print("Player Character Management tests completed")
end

-- Test Suite: Game Progression Tracking
local function testGameProgressionTracking()
    print("Testing: Game Progression Tracking")
    
    -- Arrange
    local playerData = PlayerProgressionSystem.initializePlayerProgression("player123", "TestPlayer", 0)
    
    -- Test 1: Award first gym badge
    local success, error = PlayerProgressionSystem.awardGymBadge(playerData, "BROCK")
    
    TestFramework.assertTrue(success, "First badge award should succeed")
    TestFramework.assertNil(error, "Error should be nil for valid badge award")
    TestFramework.assertEqual(playerData.progression.badgeCount, 1, "Badge count should increase to 1")
    TestFramework.assertEqual(playerData.progression.gymBadges.BROCK, 2, "Brock badge should be completed")
    TestFramework.assertTrue(playerData.gameStats.achievements.firstGymBadge, "First gym badge achievement should be unlocked")
    
    -- Test 2: Award all gym badges
    local badges = {"MISTY", "LT_SURGE", "ERIKA", "KOGA", "SABRINA", "BLAINE", "GIOVANNI"}
    for _, badge in ipairs(badges) do
        PlayerProgressionSystem.awardGymBadge(playerData, badge)
    end
    
    TestFramework.assertEqual(playerData.progression.badgeCount, 8, "Badge count should be 8")
    TestFramework.assertTrue(playerData.gameStats.achievements.allBadges, "All badges achievement should be unlocked")
    
    -- Test 3: Award duplicate badge
    local duplicateSuccess, duplicateError = PlayerProgressionSystem.awardGymBadge(playerData, "BROCK")
    
    TestFramework.assertFalse(duplicateSuccess, "Duplicate badge award should fail")
    TestFramework.assertNotNil(duplicateError, "Error should not be nil for duplicate badge")
    
    -- Test 4: Invalid badge name
    local invalidSuccess, invalidError = PlayerProgressionSystem.awardGymBadge(playerData, "INVALID_BADGE")
    
    TestFramework.assertFalse(invalidSuccess, "Invalid badge award should fail")
    TestFramework.assertNotNil(invalidError, "Error should not be nil for invalid badge")
    
    -- Test 5: Elite Four progression
    local eliteSuccess = PlayerProgressionSystem.updateEliteFourProgression(playerData, "LORELEI")
    
    TestFramework.assertTrue(eliteSuccess, "Elite Four progression should succeed")
    TestFramework.assertEqual(playerData.progression.eliteFourCount, 1, "Elite Four count should be 1")
    
    -- Complete Elite Four
    PlayerProgressionSystem.updateEliteFourProgression(playerData, "BRUNO")
    PlayerProgressionSystem.updateEliteFourProgression(playerData, "AGATHA")
    PlayerProgressionSystem.updateEliteFourProgression(playerData, "LANCE")
    
    TestFramework.assertEqual(playerData.progression.eliteFourCount, 4, "Elite Four count should be 4")
    TestFramework.assertTrue(playerData.gameStats.achievements.eliteFourDefeated, "Elite Four achievement should be unlocked")
    
    -- Test 6: Champion progression
    local championSuccess = PlayerProgressionSystem.updateChampionProgression(playerData, "CHAMPION_DEFEATED")
    
    TestFramework.assertTrue(championSuccess, "Champion progression should succeed")
    TestFramework.assertEqual(playerData.progression.championStatus, 2, "Champion status should be completed")
    TestFramework.assertTrue(playerData.gameStats.achievements.championDefeated, "Champion achievement should be unlocked")
    
    print("Game Progression Tracking tests completed")
end

-- Test Suite: Pokédex Completion Tracking
local function testPokedexTracking()
    print("Testing: Pokédex Completion Tracking")
    
    -- Arrange
    local playerData = PlayerProgressionSystem.initializePlayerProgression("player123", "TestPlayer", 0)
    
    -- Test 1: See first Pokémon
    local seenSuccess, seenError = PlayerProgressionSystem.updatePokedexEntry(playerData, 1, 1) -- BULBASAUR, SEEN
    
    TestFramework.assertTrue(seenSuccess, "Pokédex seen update should succeed")
    TestFramework.assertNil(seenError, "Error should be nil for valid update")
    TestFramework.assertEqual(playerData.pokedex.seenCount, 1, "Seen count should increase to 1")
    TestFramework.assertEqual(playerData.pokedex.species[1].status, 1, "Bulbasaur status should be SEEN")
    TestFramework.assertEqual(playerData.pokedex.species[1].timesEncountered, 1, "Times encountered should be 1")
    
    -- Test 2: Catch Pokémon
    local caughtSuccess = PlayerProgressionSystem.updatePokedexEntry(playerData, 1, 2) -- BULBASAUR, CAUGHT
    
    TestFramework.assertTrue(caughtSuccess, "Pokédex caught update should succeed")
    TestFramework.assertEqual(playerData.pokedex.caughtCount, 1, "Caught count should increase to 1")
    TestFramework.assertEqual(playerData.gameStats.pokemon.totalCaught, 1, "Total caught should be 1")
    TestFramework.assertTrue(playerData.gameStats.achievements.firstCapture, "First capture achievement should be unlocked")
    
    -- Test 3: Multiple encounters
    PlayerProgressionSystem.updatePokedexEntry(playerData, 1, 1) -- Another sighting
    
    TestFramework.assertEqual(playerData.pokedex.species[1].timesEncountered, 2, "Times encountered should increase")
    
    -- Test 4: Invalid species
    local invalidSuccess, invalidError = PlayerProgressionSystem.updatePokedexEntry(playerData, 999, 1)
    
    TestFramework.assertFalse(invalidSuccess, "Invalid species update should fail")
    TestFramework.assertNotNil(invalidError, "Error should not be nil for invalid species")
    
    -- Test 5: Invalid status
    local invalidStatusSuccess, invalidStatusError = PlayerProgressionSystem.updatePokedexEntry(playerData, 1, 5)
    
    TestFramework.assertFalse(invalidStatusSuccess, "Invalid status update should fail")
    TestFramework.assertNotNil(invalidStatusError, "Error should not be nil for invalid status")
    
    print("Pokédex Completion Tracking tests completed")
end

-- Test Suite: Battle Statistics Tracking
local function testBattleStatistics()
    print("Testing: Battle Statistics Tracking")
    
    -- Arrange
    local playerData = PlayerProgressionSystem.initializePlayerProgression("player123", "TestPlayer", 0)
    
    -- Test 1: Record battle win
    local battleSuccess = PlayerProgressionSystem.recordBattleResult(playerData, "WILD", "win", { highestLevel = 15 })
    
    TestFramework.assertTrue(battleSuccess, "Battle result recording should succeed")
    TestFramework.assertEqual(playerData.gameStats.battles.totalBattles, 1, "Total battles should be 1")
    TestFramework.assertEqual(playerData.gameStats.battles.wins, 1, "Wins should be 1")
    TestFramework.assertEqual(playerData.gameStats.battles.wildBattles, 1, "Wild battles should be 1")
    TestFramework.assertEqual(playerData.gameStats.pokemon.highestLevel, 15, "Highest level should be updated")
    
    -- Test 2: Record battle loss
    PlayerProgressionSystem.recordBattleResult(playerData, "TRAINER", "loss")
    
    TestFramework.assertEqual(playerData.gameStats.battles.totalBattles, 2, "Total battles should be 2")
    TestFramework.assertEqual(playerData.gameStats.battles.losses, 1, "Losses should be 1")
    TestFramework.assertEqual(playerData.gameStats.battles.trainerBattles, 1, "Trainer battles should be 1")
    
    -- Test 3: Record battle draw
    PlayerProgressionSystem.recordBattleResult(playerData, "GYM_LEADER", "draw")
    
    TestFramework.assertEqual(playerData.gameStats.battles.draws, 1, "Draws should be 1")
    TestFramework.assertEqual(playerData.gameStats.battles.gymBattles, 1, "Gym battles should be 1")
    
    -- Test 4: Invalid battle type
    local invalidSuccess, invalidError = PlayerProgressionSystem.recordBattleResult(playerData, "INVALID", "win")
    
    TestFramework.assertFalse(invalidSuccess, "Invalid battle type should fail")
    TestFramework.assertNotNil(invalidError, "Error should not be nil for invalid type")
    
    -- Test 5: Invalid result
    local invalidResultSuccess, invalidResultError = PlayerProgressionSystem.recordBattleResult(playerData, "WILD", "invalid")
    
    TestFramework.assertFalse(invalidResultSuccess, "Invalid result should fail")
    TestFramework.assertNotNil(invalidResultError, "Error should not be nil for invalid result")
    
    print("Battle Statistics Tracking tests completed")
end

-- Test Suite: Money Management
local function testMoneyManagement()
    print("Testing: Money Management")
    
    -- Arrange
    local playerData = PlayerProgressionSystem.initializePlayerProgression("player123", "TestPlayer", 0)
    
    -- Test 1: Add money
    local addSuccess, newBalance = PlayerProgressionSystem.addMoney(playerData, 1000, "battle_win", "Won battle")
    
    TestFramework.assertTrue(addSuccess, "Adding money should succeed")
    TestFramework.assertEqual(newBalance, 4000, "New balance should be 4000")
    TestFramework.assertEqual(playerData.money.current, 4000, "Current money should be 4000")
    TestFramework.assertEqual(playerData.money.total, 4000, "Total money should be 4000")
    TestFramework.assertEqual(#playerData.money.transactions, 1, "Should have 1 transaction")
    
    -- Test 2: Spend money
    local spendSuccess, spendBalance = PlayerProgressionSystem.spendMoney(playerData, 500, "item_purchase", "Bought potion")
    
    TestFramework.assertTrue(spendSuccess, "Spending money should succeed")
    TestFramework.assertEqual(spendBalance, 3500, "New balance should be 3500")
    TestFramework.assertEqual(playerData.money.spent, 500, "Total spent should be 500")
    TestFramework.assertEqual(#playerData.money.transactions, 2, "Should have 2 transactions")
    
    -- Test 3: Insufficient funds
    local insufficientSuccess, insufficientBalance, insufficientError = PlayerProgressionSystem.spendMoney(playerData, 5000, "expensive_item")
    
    TestFramework.assertFalse(insufficientSuccess, "Spending more than available should fail")
    TestFramework.assertNotNil(insufficientError, "Error should not be nil for insufficient funds")
    TestFramework.assertEqual(insufficientBalance, 3500, "Balance should remain unchanged")
    
    -- Test 4: Invalid amount
    local invalidSuccess, invalidBalance, invalidError = PlayerProgressionSystem.addMoney(playerData, -100, "invalid")
    
    TestFramework.assertFalse(invalidSuccess, "Negative amount should fail")
    TestFramework.assertNotNil(invalidError, "Error should not be nil for negative amount")
    
    -- Test 5: Transaction history
    local transactions = PlayerProgressionSystem.getTransactionHistory(playerData, 1)
    
    TestFramework.assertEqual(#transactions, 1, "Should return 1 recent transaction")
    TestFramework.assertEqual(transactions[1].type, "spend", "Most recent should be spend transaction")
    
    print("Money Management tests completed")
end

-- Test Suite: Play Time Management
local function testPlayTimeManagement()
    print("Testing: Play Time Management")
    
    -- Arrange
    local playerData = PlayerProgressionSystem.initializePlayerProgression("player123", "TestPlayer", 0)
    
    -- Test 1: Start session
    local startSuccess = PlayerProgressionSystem.startSession(playerData)
    
    TestFramework.assertTrue(startSuccess, "Starting session should succeed")
    TestFramework.assertEqual(playerData.playTime.sessionCount, 2, "Session count should be 2") -- Initial + started
    TestFramework.assertNotNil(playerData.playTime.currentSessionStart, "Current session start should be set")
    
    -- Test 2: Get current session duration
    mockTime = mockTime + 300 -- Add 5 minutes
    local currentDuration = PlayerProgressionSystem.getCurrentSessionDuration(playerData)
    
    TestFramework.assertEqual(currentDuration, 300, "Current session duration should be 300 seconds")
    
    -- Test 3: End session
    local endSuccess, sessionDuration = PlayerProgressionSystem.endSession(playerData)
    
    TestFramework.assertTrue(endSuccess, "Ending session should succeed")
    TestFramework.assertEqual(sessionDuration, 300, "Session duration should be 300 seconds")
    TestFramework.assertEqual(playerData.playTime.totalSeconds, 300, "Total play time should be 300 seconds")
    TestFramework.assertEqual(playerData.playTime.longestSession, 300, "Longest session should be 300 seconds")
    TestFramework.assertNil(playerData.playTime.currentSessionStart, "Current session start should be cleared")
    
    -- Test 4: Format play time
    local formattedTime = PlayerProgressionSystem.formatPlayTime(3661) -- 1h 1m 1s
    
    TestFramework.assertEqual(formattedTime, "1h 1m 1s", "Time should be formatted correctly")
    
    local formattedMinutes = PlayerProgressionSystem.formatPlayTime(125) -- 2m 5s
    
    TestFramework.assertEqual(formattedMinutes, "2m 5s", "Minutes should be formatted correctly")
    
    local formattedSeconds = PlayerProgressionSystem.formatPlayTime(45) -- 45s
    
    TestFramework.assertEqual(formattedSeconds, "45s", "Seconds should be formatted correctly")
    
    print("Play Time Management tests completed")
end

-- Test Suite: Inventory Management
local function testInventoryManagement()
    print("Testing: Inventory Management")
    
    -- Arrange
    local playerData = PlayerProgressionSystem.initializePlayerProgression("player123", "TestPlayer", 0)
    
    -- Test 1: Add item
    local addSuccess = PlayerProgressionSystem.addItem(playerData, 1, 5, "items")
    
    TestFramework.assertTrue(addSuccess, "Adding item should succeed")
    TestFramework.assertEqual(playerData.inventory.items[1].quantity, 5, "Item quantity should be 5")
    
    -- Test 2: Add more of same item
    PlayerProgressionSystem.addItem(playerData, 1, 3, "items")
    
    TestFramework.assertEqual(playerData.inventory.items[1].quantity, 8, "Item quantity should be 8")
    
    -- Test 3: Remove item
    local removeSuccess, removedQuantity = PlayerProgressionSystem.removeItem(playerData, 1, 3, "items")
    
    TestFramework.assertTrue(removeSuccess, "Removing item should succeed")
    TestFramework.assertEqual(removedQuantity, 3, "Should remove 3 items")
    TestFramework.assertEqual(playerData.inventory.items[1].quantity, 5, "Remaining quantity should be 5")
    
    -- Test 4: Remove all of item
    PlayerProgressionSystem.removeItem(playerData, 1, 10, "items") -- Try to remove more than available
    
    TestFramework.assertNil(playerData.inventory.items[1], "Item should be removed when quantity reaches 0")
    
    -- Test 5: Check has item
    PlayerProgressionSystem.addItem(playerData, 2, 3, "items")
    local hasItem = PlayerProgressionSystem.hasItem(playerData, 2, 2, "items")
    local hasEnough = PlayerProgressionSystem.hasItem(playerData, 2, 5, "items")
    
    TestFramework.assertTrue(hasItem, "Should have enough of item")
    TestFramework.assertFalse(hasEnough, "Should not have enough of item")
    
    -- Test 6: Inventory summary
    local summary = PlayerProgressionSystem.getInventorySummary(playerData)
    
    TestFramework.assertNotNil(summary, "Inventory summary should not be nil")
    TestFramework.assertEqual(summary.totalItems, 23, "Total items should include starting Poké Balls + added items")
    
    print("Inventory Management tests completed")
end

-- Test Suite: Data Validation
local function testDataValidation()
    print("Testing: Data Validation")
    
    -- Arrange
    local playerData = PlayerProgressionSystem.initializePlayerProgression("player123", "TestPlayer", 0)
    
    -- Test 1: Valid data validation
    local validResult, validErrors = PlayerProgressionSystem.validatePlayerData(playerData)
    
    TestFramework.assertTrue(validResult, "Valid player data should pass validation")
    TestFramework.assertEqual(#validErrors, 0, "Valid data should have no errors")
    
    -- Test 2: Invalid data validation
    local invalidResult, invalidErrors = PlayerProgressionSystem.validatePlayerData(nil)
    
    TestFramework.assertFalse(invalidResult, "Nil data should fail validation")
    TestFramework.assertTrue(#invalidErrors > 0, "Invalid data should have errors")
    
    -- Test 3: Data integrity
    local checksum = PlayerProgressionSystem.calculateChecksum(playerData)
    
    TestFramework.assertNotNil(checksum, "Checksum should not be nil")
    
    local preparedData = PlayerProgressionSystem.prepareSaveData(playerData)
    
    TestFramework.assertNotNil(preparedData.dataIntegrity.checksum, "Prepared data should have checksum")
    
    local integrityResult = PlayerProgressionSystem.validateDataIntegrity(preparedData)
    
    TestFramework.assertTrue(integrityResult, "Data integrity should be valid")
    
    -- Test 4: Backup and restore
    local backup = PlayerProgressionSystem.createBackup(playerData)
    
    TestFramework.assertNotNil(backup, "Backup should not be nil")
    TestFramework.assertEqual(backup.playerId, playerData.playerId, "Backup should preserve player ID")
    
    local restored, restoreSuccess = PlayerProgressionSystem.restoreFromBackup(backup)
    
    TestFramework.assertTrue(restoreSuccess, "Restore should succeed")
    TestFramework.assertNotNil(restored, "Restored data should not be nil")
    
    print("Data Validation tests completed")
end

-- Run all tests
local function runAllTests()
    print("Starting Player Progression System Unit Tests")
    print("==============================================")
    
    testInitializePlayerProgression()
    testPlayerCharacterManagement()
    testGameProgressionTracking()
    testPokedexTracking()
    testBattleStatistics()
    testMoneyManagement()
    testPlayTimeManagement()
    testInventoryManagement()
    testDataValidation()
    
    print("==============================================")
    print("Test Results:")
    print("Total Assertions: " .. TestFramework.assertions)
    print("Successes: " .. TestFramework.successes)
    print("Failures: " .. TestFramework.failures)
    
    if TestFramework.failures == 0 then
        print("ALL TESTS PASSED! ✅")
        return true
    else
        print("SOME TESTS FAILED! ❌")
        return false
    end
end

-- Export test runner
return {
    runAllTests = runAllTests,
    TestFramework = TestFramework
}