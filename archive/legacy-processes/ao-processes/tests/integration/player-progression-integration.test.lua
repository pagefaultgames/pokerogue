-- Integration Tests for Player Progression System
-- Tests complete player progression workflows with save/load cycles
-- Validates integration with Pokemon state management and battle handlers
-- Tests cross-system consistency for progression tracking

-- Test framework setup
local IntegrationTestFramework = {
    tests = {},
    currentTest = nil,
    assertions = 0,
    failures = 0,
    successes = 0
}

-- Simple assertion functions
function IntegrationTestFramework.assertEqual(actual, expected, message)
    IntegrationTestFramework.assertions = IntegrationTestFramework.assertions + 1
    if actual == expected then
        IntegrationTestFramework.successes = IntegrationTestFramework.successes + 1
    else
        IntegrationTestFramework.failures = IntegrationTestFramework.failures + 1
        print("FAIL: " .. (message or "Assertion failed"))
        print("  Expected: " .. tostring(expected))
        print("  Actual: " .. tostring(actual))
    end
end

function IntegrationTestFramework.assertTrue(condition, message)
    IntegrationTestFramework.assertEqual(condition, true, message)
end

function IntegrationTestFramework.assertFalse(condition, message)
    IntegrationTestFramework.assertEqual(condition, false, message)
end

function IntegrationTestFramework.assertNotNil(value, message)
    IntegrationTestFramework.assertions = IntegrationTestFramework.assertions + 1
    if value ~= nil then
        IntegrationTestFramework.successes = IntegrationTestFramework.successes + 1
    else
        IntegrationTestFramework.failures = IntegrationTestFramework.failures + 1
        print("FAIL: " .. (message or "Expected non-nil value"))
    end
end

-- Mock dependencies for integration testing
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

-- Mock storage system for integration testing
local MockStorage = {
    playerData = {},
    
    store = function(playerId, data)
        MockStorage.playerData[playerId] = data
        return true
    end,
    
    retrieve = function(playerId)
        return MockStorage.playerData[playerId]
    end,
    
    clear = function()
        MockStorage.playerData = {}
    end
}

-- Mock time system for consistent testing
local mockTime = 1000000000
local function mockOsTime()
    return mockTime
end

-- Set up mocks
local originalRequire = require
local function mockRequire(module)
    if module == "data.constants.enums" then
        return MockEnums
    end
    return originalRequire(module)
end

_G.require = mockRequire
_G.os.time = mockOsTime

-- Load the system under test
local PlayerProgressionSystem = require("game-logic.progression.player-progression-system")

-- Integration Test Suite: Complete Game Progression Workflow
local function testCompleteGameProgressionWorkflow()
    print("Testing: Complete Game Progression Workflow")
    
    -- Arrange: Initialize new player
    local playerId = "integration-player-1"
    local playerName = "IntegrationTest"
    
    local playerData = PlayerProgressionSystem.initializePlayerProgression(playerId, playerName, 0)
    IntegrationTestFramework.assertNotNil(playerData, "Player should be initialized")
    
    -- Store initial data
    MockStorage.store(playerId, playerData)
    
    -- Act & Assert: Complete game progression workflow
    
    -- Phase 1: Early game progression
    print("  Phase 1: Early game progression")
    
    -- First Pokemon encounter
    PlayerProgressionSystem.updatePokedexEntry(playerData, MockEnums.SpeciesId.BULBASAUR, 1) -- SEEN
    PlayerProgressionSystem.updatePokedexEntry(playerData, MockEnums.SpeciesId.BULBASAUR, 2) -- CAUGHT
    
    -- First battle win
    PlayerProgressionSystem.recordBattleResult(playerData, "WILD", "win", { highestLevel = 5 })
    
    -- Earn money from battle
    PlayerProgressionSystem.addMoney(playerData, 50, "battle_win", "Wild Pokemon defeated")
    
    -- Buy first item
    PlayerProgressionSystem.spendMoney(playerData, 200, "item_purchase", "Potion")
    PlayerProgressionSystem.addItem(playerData, 20, 1, "items") -- Potion
    
    IntegrationTestFramework.assertEqual(playerData.pokedex.caughtCount, 1, "Should have caught 1 Pokemon")
    IntegrationTestFramework.assertEqual(playerData.gameStats.battles.wins, 1, "Should have 1 win")
    IntegrationTestFramework.assertEqual(playerData.money.current, 2850, "Money should reflect earnings and spending")
    IntegrationTestFramework.assertTrue(playerData.gameStats.achievements.firstCapture, "First capture achievement unlocked")
    
    -- Phase 2: Gym badge progression
    print("  Phase 2: Gym badge progression")
    
    -- Defeat first gym leader
    PlayerProgressionSystem.recordBattleResult(playerData, "GYM_LEADER", "win", { 
        highestLevel = 12,
        pokemonUsed = {{ speciesId = MockEnums.SpeciesId.BULBASAUR, timesUsed = 3 }}
    })
    
    PlayerProgressionSystem.awardGymBadge(playerData, "BROCK")
    PlayerProgressionSystem.addMoney(playerData, 1000, "gym_victory", "Defeated Brock")
    
    IntegrationTestFramework.assertEqual(playerData.progression.badgeCount, 1, "Should have 1 badge")
    IntegrationTestFramework.assertTrue(playerData.gameStats.achievements.firstGymBadge, "First gym badge achievement unlocked")
    
    -- Continue gym progression (accelerated for testing)
    local gymLeaders = {"MISTY", "LT_SURGE", "ERIKA", "KOGA", "SABRINA", "BLAINE", "GIOVANNI"}
    for i, leader in ipairs(gymLeaders) do
        PlayerProgressionSystem.recordBattleResult(playerData, "GYM_LEADER", "win", { 
            highestLevel = 15 + i * 3
        })
        PlayerProgressionSystem.awardGymBadge(playerData, leader)
        PlayerProgressionSystem.addMoney(playerData, 1000 + i * 200, "gym_victory", "Defeated " .. leader)
        
        -- Encounter more Pokemon
        PlayerProgressionSystem.updatePokedexEntry(playerData, i + 1, 1) -- SEEN
        if i % 2 == 0 then
            PlayerProgressionSystem.updatePokedexEntry(playerData, i + 1, 2) -- CAUGHT every other
        end
    end
    
    IntegrationTestFramework.assertEqual(playerData.progression.badgeCount, 8, "Should have all 8 badges")
    IntegrationTestFramework.assertTrue(playerData.gameStats.achievements.allBadges, "All badges achievement unlocked")
    
    -- Phase 3: Elite Four and Champion
    print("  Phase 3: Elite Four and Champion")
    
    local eliteFour = {"LORELEI", "BRUNO", "AGATHA", "LANCE"}
    for _, member in ipairs(eliteFour) do
        PlayerProgressionSystem.recordBattleResult(playerData, "ELITE_FOUR", "win", { 
            highestLevel = 50 + math.random(5)
        })
        PlayerProgressionSystem.updateEliteFourProgression(playerData, member)
    end
    
    IntegrationTestFramework.assertEqual(playerData.progression.eliteFourCount, 4, "Should have defeated all Elite Four")
    IntegrationTestFramework.assertTrue(playerData.gameStats.achievements.eliteFourDefeated, "Elite Four achievement unlocked")
    
    -- Champion battle
    PlayerProgressionSystem.recordBattleResult(playerData, "CHAMPION", "win", { 
        highestLevel = 65
    })
    PlayerProgressionSystem.updateChampionProgression(playerData, "CHAMPION_DEFEATED")
    PlayerProgressionSystem.updateChampionProgression(playerData, "HALL_OF_FAME")
    
    IntegrationTestFramework.assertTrue(playerData.gameStats.achievements.championDefeated, "Champion achievement unlocked")
    
    -- Save final state
    MockStorage.store(playerId, playerData)
    
    print("Complete Game Progression Workflow test completed")
end

-- Integration Test Suite: Save/Load Persistence
local function testSaveLoadPersistence()
    print("Testing: Save/Load Persistence")
    
    -- Arrange: Create player with some progress
    local playerId = "persistence-player"
    local playerData = PlayerProgressionSystem.initializePlayerProgression(playerId, "PersistenceTest", 1)
    
    -- Add some progression data
    PlayerProgressionSystem.awardGymBadge(playerData, "BROCK")
    PlayerProgressionSystem.updatePokedexEntry(playerData, MockEnums.SpeciesId.PIKACHU, 2)
    PlayerProgressionSystem.addMoney(playerData, 500, "test", "Test money")
    PlayerProgressionSystem.addItem(playerData, 1, 5, "items")
    PlayerProgressionSystem.recordBattleResult(playerData, "TRAINER", "win")
    
    -- Prepare data for saving
    local saveData = PlayerProgressionSystem.prepareSaveData(playerData)
    IntegrationTestFramework.assertNotNil(saveData.dataIntegrity.checksum, "Save data should have checksum")
    
    -- Simulate save operation
    local serializedData = PlayerProgressionSystem.serializePlayerData(saveData)
    IntegrationTestFramework.assertNotNil(serializedData, "Data should serialize successfully")
    
    -- Store in mock storage
    MockStorage.store(playerId, saveData)
    
    -- Simulate load operation
    local loadedData = MockStorage.retrieve(playerId)
    IntegrationTestFramework.assertNotNil(loadedData, "Data should load successfully")
    
    -- Validate loaded data integrity
    local integrityValid, integrityErrors = PlayerProgressionSystem.validateDataIntegrity(loadedData)
    IntegrationTestFramework.assertTrue(integrityValid, "Loaded data integrity should be valid")
    
    -- Verify all data persisted correctly
    IntegrationTestFramework.assertEqual(loadedData.playerId, playerId, "Player ID should persist")
    IntegrationTestFramework.assertEqual(loadedData.character.name, "PersistenceTest", "Player name should persist")
    IntegrationTestFramework.assertEqual(loadedData.progression.badgeCount, 1, "Badge count should persist")
    IntegrationTestFramework.assertEqual(loadedData.pokedex.caughtCount, 1, "Pokédex progress should persist")
    IntegrationTestFramework.assertEqual(loadedData.money.current, 3500, "Money should persist")
    IntegrationTestFramework.assertEqual(loadedData.gameStats.battles.wins, 1, "Battle stats should persist")
    IntegrationTestFramework.assertNotNil(loadedData.inventory.items[1], "Inventory should persist")
    
    print("Save/Load Persistence test completed")
end

-- Integration Test Suite: Session Management
local function testSessionManagement()
    print("Testing: Session Management")
    
    -- Arrange: Create player
    local playerId = "session-player"
    local playerData = PlayerProgressionSystem.initializePlayerProgression(playerId, "SessionTest", 0)
    
    -- Test multiple session workflow
    
    -- Session 1
    PlayerProgressionSystem.startSession(playerData)
    
    -- Simulate 10 minutes of gameplay
    mockTime = mockTime + 600
    
    -- Player catches a Pokemon
    PlayerProgressionSystem.updatePokedexEntry(playerData, MockEnums.SpeciesId.CHARMANDER, 2)
    
    -- Player wins a battle
    PlayerProgressionSystem.recordBattleResult(playerData, "WILD", "win")
    
    -- End session
    local sessionEndSuccess, session1Duration = PlayerProgressionSystem.endSession(playerData)
    IntegrationTestFramework.assertTrue(sessionEndSuccess, "Session 1 should end successfully")
    IntegrationTestFramework.assertEqual(session1Duration, 600, "Session 1 duration should be 600 seconds")
    
    -- Save state after session 1
    MockStorage.store(playerId, playerData)
    
    -- Session 2 (simulate different play session)
    mockTime = mockTime + 3600 -- 1 hour later
    
    -- Load player data (simulate game restart)
    local loadedData = MockStorage.retrieve(playerId)
    IntegrationTestFramework.assertNotNil(loadedData, "Player data should load for session 2")
    
    -- Start new session
    PlayerProgressionSystem.startSession(loadedData)
    
    -- Simulate 15 minutes of gameplay
    mockTime = mockTime + 900
    
    -- More gameplay progress
    PlayerProgressionSystem.updatePokedexEntry(loadedData, MockEnums.SpeciesId.SQUIRTLE, 1) -- SEEN
    PlayerProgressionSystem.addMoney(loadedData, 100, "item_sale", "Sold item")
    
    -- End session 2
    local session2Success, session2Duration = PlayerProgressionSystem.endSession(loadedData)
    IntegrationTestFramework.assertTrue(session2Success, "Session 2 should end successfully")
    IntegrationTestFramework.assertEqual(session2Duration, 900, "Session 2 duration should be 900 seconds")
    
    -- Verify accumulated play time
    IntegrationTestFramework.assertEqual(loadedData.playTime.totalSeconds, 1500, "Total play time should be 1500 seconds")
    IntegrationTestFramework.assertEqual(loadedData.playTime.sessionCount, 3, "Should have 3 sessions total") -- Initial + 2 started
    IntegrationTestFramework.assertEqual(loadedData.playTime.longestSession, 900, "Longest session should be 900 seconds")
    
    -- Verify cross-session data persistence
    IntegrationTestFramework.assertEqual(loadedData.pokedex.caughtCount, 1, "Pokédex progress should persist across sessions")
    IntegrationTestFramework.assertEqual(loadedData.pokedex.seenCount, 2, "Should have seen 2 species total")
    IntegrationTestFramework.assertEqual(loadedData.gameStats.battles.wins, 1, "Battle stats should persist across sessions")
    
    print("Session Management test completed")
end

-- Integration Test Suite: Data Migration
local function testDataMigration()
    print("Testing: Data Migration")
    
    -- Arrange: Create player with version 1.0.0
    local playerId = "migration-player"
    local playerData = PlayerProgressionSystem.initializePlayerProgression(playerId, "MigrationTest", 0)
    
    -- Add some progress
    PlayerProgressionSystem.awardGymBadge(playerData, "BROCK")
    PlayerProgressionSystem.updatePokedexEntry(playerData, MockEnums.SpeciesId.BULBASAUR, 2)
    
    -- Set old version
    playerData.gameVersion = "0.9.0"
    
    -- Prepare and validate original data
    local originalData = PlayerProgressionSystem.prepareSaveData(playerData)
    local originalValid = PlayerProgressionSystem.validatePlayerData(originalData)
    IntegrationTestFramework.assertTrue(originalValid, "Original data should be valid")
    
    -- Perform migration to current version
    local migratedData, migrationSuccess, migrationError = PlayerProgressionSystem.migratePlayerData(originalData, "1.0.0")
    
    IntegrationTestFramework.assertTrue(migrationSuccess, "Migration should succeed")
    IntegrationTestFramework.assertNotNil(migratedData, "Migrated data should not be nil")
    IntegrationTestFramework.assertEqual(migratedData.gameVersion, "1.0.0", "Version should be updated")
    
    -- Verify data integrity after migration
    local migratedValid = PlayerProgressionSystem.validatePlayerData(migratedData)
    IntegrationTestFramework.assertTrue(migratedValid, "Migrated data should be valid")
    
    -- Verify data preservation
    IntegrationTestFramework.assertEqual(migratedData.playerId, playerId, "Player ID should be preserved")
    IntegrationTestFramework.assertEqual(migratedData.progression.badgeCount, 1, "Badge count should be preserved")
    IntegrationTestFramework.assertEqual(migratedData.pokedex.caughtCount, 1, "Pokédex progress should be preserved")
    
    print("Data Migration test completed")
end

-- Integration Test Suite: Cross-System Consistency
local function testCrossSystemConsistency()
    print("Testing: Cross-System Consistency")
    
    -- Arrange: Create player
    local playerId = "consistency-player"
    local playerData = PlayerProgressionSystem.initializePlayerProgression(playerId, "ConsistencyTest", 0)
    
    -- Test 1: Pokédex and Battle Stats Consistency
    print("  Testing Pokédex and Battle Stats Consistency")
    
    -- Catch 5 Pokemon through battles
    for i = 1, 5 do
        -- Record wild battle
        PlayerProgressionSystem.recordBattleResult(playerData, "WILD", "win")
        
        -- Update Pokédex (simulate catching Pokemon during battle)
        PlayerProgressionSystem.updatePokedexEntry(playerData, i, 2) -- CAUGHT
    end
    
    IntegrationTestFramework.assertEqual(playerData.gameStats.battles.wins, 5, "Should have 5 battle wins")
    IntegrationTestFramework.assertEqual(playerData.pokedex.caughtCount, 5, "Should have caught 5 Pokemon")
    IntegrationTestFramework.assertEqual(playerData.gameStats.pokemon.totalCaught, 5, "Total caught should match Pokédex")
    
    -- Test 2: Money and Transaction History Consistency
    print("  Testing Money and Transaction History Consistency")
    
    local initialMoney = playerData.money.current
    
    -- Earn money from battles
    PlayerProgressionSystem.addMoney(playerData, 250, "battle_win", "Battle reward")
    PlayerProgressionSystem.addMoney(playerData, 150, "battle_win", "Battle reward")
    
    -- Spend money on items
    PlayerProgressionSystem.spendMoney(playerData, 100, "item_purchase", "Poké Ball")
    PlayerProgressionSystem.spendMoney(playerData, 200, "item_purchase", "Potion")
    
    local expectedBalance = initialMoney + 250 + 150 - 100 - 200
    IntegrationTestFramework.assertEqual(playerData.money.current, expectedBalance, "Money balance should be consistent")
    IntegrationTestFramework.assertEqual(playerData.money.spent, 300, "Total spent should be consistent")
    IntegrationTestFramework.assertEqual(#playerData.money.transactions, 4, "Should have 4 transactions")
    
    -- Test 3: Achievement Consistency
    print("  Testing Achievement Consistency")
    
    -- Complete all gym badges
    local badges = {"BROCK", "MISTY", "LT_SURGE", "ERIKA", "KOGA", "SABRINA", "BLAINE", "GIOVANNI"}
    for _, badge in ipairs(badges) do
        PlayerProgressionSystem.awardGymBadge(playerData, badge)
    end
    
    IntegrationTestFramework.assertTrue(playerData.gameStats.achievements.firstGymBadge, "First gym badge achievement should be consistent")
    IntegrationTestFramework.assertTrue(playerData.gameStats.achievements.allBadges, "All badges achievement should be consistent")
    IntegrationTestFramework.assertEqual(playerData.progression.badgeCount, 8, "Badge count should match achievement status")
    
    -- Test 4: Data Validation Consistency
    print("  Testing Data Validation Consistency")
    
    local validationResult, validationErrors = PlayerProgressionSystem.validatePlayerData(playerData)
    IntegrationTestFramework.assertTrue(validationResult, "All data should be internally consistent")
    IntegrationTestFramework.assertEqual(#validationErrors, 0, "Should have no validation errors")
    
    -- Verify statistics summary consistency
    local stats = PlayerProgressionSystem.getPlayerStatistics(playerData)
    IntegrationTestFramework.assertNotNil(stats, "Statistics should be generated")
    IntegrationTestFramework.assertEqual(stats.progression.badgeCount, playerData.progression.badgeCount, "Badge count should be consistent in stats")
    IntegrationTestFramework.assertEqual(stats.battles.totalBattles, playerData.gameStats.battles.totalBattles, "Battle count should be consistent in stats")
    IntegrationTestFramework.assertEqual(stats.money.current, playerData.money.current, "Money should be consistent in stats")
    
    print("Cross-System Consistency test completed")
end

-- Integration Test Suite: Error Recovery and Data Corruption
local function testErrorRecoveryAndDataCorruption()
    print("Testing: Error Recovery and Data Corruption")
    
    -- Arrange: Create valid player data
    local playerId = "recovery-player"
    local playerData = PlayerProgressionSystem.initializePlayerProgression(playerId, "RecoveryTest", 0)
    
    -- Add some progress
    PlayerProgressionSystem.awardGymBadge(playerData, "BROCK")
    PlayerProgressionSystem.updatePokedexEntry(playerData, MockEnums.SpeciesId.PIKACHU, 2)
    
    -- Create backup before corruption
    local backup = PlayerProgressionSystem.createBackup(playerData)
    IntegrationTestFramework.assertNotNil(backup, "Backup should be created")
    
    -- Prepare valid save data
    local validSaveData = PlayerProgressionSystem.prepareSaveData(playerData)
    local validIntegrity = PlayerProgressionSystem.validateDataIntegrity(validSaveData)
    IntegrationTestFramework.assertTrue(validIntegrity, "Valid data should pass integrity check")
    
    -- Simulate data corruption
    local corruptedData = PlayerProgressionSystem.createBackup(validSaveData)
    corruptedData.progression.badgeCount = 999 -- Inconsistent with actual badges
    corruptedData.pokedex.seenCount = -1 -- Invalid negative count
    corruptedData.money.current = -100 -- Invalid negative money
    
    -- Test corruption detection
    local corruptedValid, corruptedErrors = PlayerProgressionSystem.validatePlayerData(corruptedData)
    IntegrationTestFramework.assertFalse(corruptedValid, "Corrupted data should fail validation")
    IntegrationTestFramework.assertTrue(#corruptedErrors > 0, "Should detect corruption errors")
    
    -- Test recovery from backup
    local recoveredData, recoverySuccess = PlayerProgressionSystem.restoreFromBackup(backup)
    IntegrationTestFramework.assertTrue(recoverySuccess, "Recovery should succeed")
    IntegrationTestFramework.assertNotNil(recoveredData, "Recovered data should not be nil")
    
    -- Verify recovered data integrity
    local recoveredValid = PlayerProgressionSystem.validatePlayerData(recoveredData)
    IntegrationTestFramework.assertTrue(recoveredValid, "Recovered data should be valid")
    
    -- Verify recovered data matches original
    IntegrationTestFramework.assertEqual(recoveredData.playerId, playerId, "Player ID should be recovered")
    IntegrationTestFramework.assertEqual(recoveredData.progression.badgeCount, 1, "Badge count should be recovered")
    IntegrationTestFramework.assertEqual(recoveredData.pokedex.caughtCount, 1, "Pokédex should be recovered")
    
    print("Error Recovery and Data Corruption test completed")
end

-- Run all integration tests
local function runAllIntegrationTests()
    print("Starting Player Progression System Integration Tests")
    print("===================================================")
    
    -- Clear mock storage before testing
    MockStorage.clear()
    
    testCompleteGameProgressionWorkflow()
    testSaveLoadPersistence()
    testSessionManagement()
    testDataMigration()
    testCrossSystemConsistency()
    testErrorRecoveryAndDataCorruption()
    
    print("===================================================")
    print("Integration Test Results:")
    print("Total Assertions: " .. IntegrationTestFramework.assertions)
    print("Successes: " .. IntegrationTestFramework.successes)
    print("Failures: " .. IntegrationTestFramework.failures)
    
    if IntegrationTestFramework.failures == 0 then
        print("ALL INTEGRATION TESTS PASSED! ✅")
        return true
    else
        print("SOME INTEGRATION TESTS FAILED! ❌")
        return false
    end
end

-- Export test runner
return {
    runAllIntegrationTests = runAllIntegrationTests,
    IntegrationTestFramework = IntegrationTestFramework,
    MockStorage = MockStorage
}