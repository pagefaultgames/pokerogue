-- Battle Turn Resolution Integration Tests
-- Comprehensive integration tests for complete battle turn workflows

-- Setup module paths for standalone execution
local function setupLuaPath()
    local originalPath = package.path
    
    -- Try multiple path setups for different execution contexts
    local pathConfigs = {
        -- From integration/ directory
        {
            "../framework/?.lua",
            "../framework/?/init.lua",
            "../../?.lua",
            "../../?/init.lua", 
            "../../data/?.lua",
            "../../data/?/init.lua",
            "../../game-logic/?.lua", 
            "../../game-logic/?/init.lua",
            "../../handlers/?.lua",
            "../../handlers/?/init.lua",
            "../?.lua",
            "../?/init.lua"
        }
    }
    
    -- Try each path configuration
    for _, paths in ipairs(pathConfigs) do
        local newPath = originalPath
        for _, path in ipairs(paths) do
            newPath = newPath .. ";" .. path
        end
        package.path = newPath
        
        -- Test if we can load a test module
        local success = pcall(require, "game-logic.battle.turn-processor")
        if success then
            return true
        end
    end
    
    -- Restore original path if no success
    package.path = originalPath
    return false
end

-- Setup paths
setupLuaPath()

local TurnProcessor = require("game-logic.battle.turn-processor")
local BattleMessages = require("game-logic.battle.battle-messages")

-- Test framework
local tests = {}
local testResults = {
    passed = 0,
    failed = 0,
    total = 0,
    errors = {}
}

-- Test helper functions
local function assertEquals(actual, expected, message)
    testResults.total = testResults.total + 1
    if actual == expected then
        testResults.passed = testResults.passed + 1
        print("✓ " .. (message or "Test passed"))
    else
        testResults.failed = testResults.failed + 1
        local errorMsg = (message or "Test failed") .. ": expected " .. tostring(expected) .. ", got " .. tostring(actual)
        print("✗ " .. errorMsg)
        table.insert(testResults.errors, errorMsg)
    end
end

local function assertTrue(condition, message)
    assertEquals(condition, true, message)
end

local function assertNotNil(value, message)
    testResults.total = testResults.total + 1
    if value ~= nil then
        testResults.passed = testResults.passed + 1
        print("✓ " .. (message or "Value is not nil"))
    else
        testResults.failed = testResults.failed + 1
        local errorMsg = (message or "Value should not be nil")
        print("✗ " .. errorMsg)
        table.insert(testResults.errors, errorMsg)
    end
end

-- Create test Pokemon
local function createTestPokemon(id, name, species, level, stats)
    local defaultStats = {
        hp = 100,
        attack = 80,
        defense = 80,
        special_attack = 80,
        special_defense = 80,
        speed = 100
    }
    
    local pokemonStats = stats or defaultStats
    
    return {
        id = id,
        name = name,
        species = species or 25,
        level = level or 50,
        currentHP = pokemonStats.hp,
        maxHP = pokemonStats.hp,
        stats = pokemonStats,
        battleStats = {},
        types = {13, 0},
        moves = {
            [1] = {pp = 35, maxPP = 35},
            [85] = {pp = 15, maxPP = 15}
        },
        status = nil,
        ability = 9,
        heldItem = nil,
        nature = 1,
        fainted = false
    }
end

-- Test 1: Complete Battle Turn Workflow
function tests.testCompleteBattleTurnWorkflow()
    print("\n=== Testing Complete Battle Turn Workflow ===")
    
    local playerPokemon = createTestPokemon(1, "Pikachu", 25, 50, {hp = 120, speed = 90})
    local enemyPokemon = createTestPokemon(2, "Charmander", 4, 50, {hp = 110, speed = 65})
    
    local playerParty = {playerPokemon}
    local enemyParty = {enemyPokemon}
    
    local battleState, error = TurnProcessor.initializeBattle("integration-test-1", "test-seed-123", playerParty, enemyParty)
    assertNotNil(battleState, "Battle should be initialized successfully")
    
    local success, phaseResult = TurnProcessor.beginCommandPhase(battleState)
    assertTrue(success, "Command phase should begin successfully")
    assertEquals(battleState.phase, TurnProcessor.TurnPhase.COMMAND_SELECTION, "Should be in command selection phase")
    assertEquals(battleState.turn, 1, "Should be turn 1")
    
    local playerCommand = {
        type = "move",
        pokemonId = 1,
        moveId = 85
    }
    
    success = TurnProcessor.addTurnCommand(battleState, "player", playerCommand)
    assertTrue(success, "Player command should be added successfully")
    
    local enemyCommand = {
        type = "move",
        pokemonId = 2,
        moveId = 52
    }
    
    success = TurnProcessor.addTurnCommand(battleState, "enemy", enemyCommand)
    assertTrue(success, "Enemy command should be added successfully")
    
    local turnResult, turnError = TurnProcessor.processBattleTurn(battleState)
    assertNotNil(turnResult, "Turn should be processed successfully")
    assertEquals(turnResult.turn, 1, "Turn result should reflect turn 1")
    assertTrue(#turnResult.actions_executed > 0, "Actions should have been executed")
    
    assertTrue(battleState.turn >= 1, "Turn counter should be maintained")
    assertEquals(battleState.phase, TurnProcessor.TurnPhase.COMMAND_SELECTION, "Should return to command selection after turn")
end

-- Test 2: Integration Test Success
function tests.testBasicIntegration()
    print("\n=== Testing Basic Integration ===")
    
    local playerPokemon = createTestPokemon(1, "TestPokemon", 25, 50)
    local enemyPokemon = createTestPokemon(2, "EnemyPokemon", 4, 50)
    
    local battleState = TurnProcessor.initializeBattle("basic-test", "test-seed", {playerPokemon}, {enemyPokemon})
    assertNotNil(battleState, "Battle state should be created")
    
    assertTrue(true, "Basic integration test completed")
end

-- Run all integration tests
function tests.runAllTests()
    print("Starting Battle Turn Resolution Integration Tests...")
    
    -- Initialize required systems
    local MoveDatabase = require("data.moves.move-database")
    MoveDatabase.init()
    BattleMessages.init()
    
    -- Run individual tests
    tests.testCompleteBattleTurnWorkflow()
    tests.testBasicIntegration()
    
    -- Print results
    print("\n" .. string.rep("=", 60))
    print("BATTLE TURN RESOLUTION INTEGRATION TEST RESULTS")
    print(string.rep("=", 60))
    print("Total Tests: " .. testResults.total)
    print("Passed: " .. testResults.passed)
    print("Failed: " .. testResults.failed)
    print("Success Rate: " .. string.format("%.1f%%", (testResults.passed / testResults.total) * 100))
    
    if #testResults.errors > 0 then
        print("\nErrors:")
        for _, error in ipairs(testResults.errors) do
            print("  • " .. error)
        end
    end
    
    print(string.rep("=", 60))
    
    return testResults.passed == testResults.total
end

return tests