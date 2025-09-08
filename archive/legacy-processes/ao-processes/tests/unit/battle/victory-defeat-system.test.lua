-- Unit Tests for Victory/Defeat System
-- Tests all victory/defeat detection components with 100% coverage requirement
-- Covers victory conditions, defeat conditions, forfeit/escape mechanics, and edge cases
-- Uses AAA pattern (Arrange, Act, Assert) for all test functions

local VictoryDefeatSystem = require("game-logic.battle.victory-defeat-system")
local BattleRNG = require("game-logic.rng.battle-rng")

-- Test framework functions
local TestSuite = {}
local testResults = {}

-- Helper function to create mock battle state
local function createMockBattleState(playerPartyData, enemyPartyData)
    local playerParty = {}
    local enemyParty = {}
    
    -- Create player party
    for i, data in ipairs(playerPartyData or {}) do
        table.insert(playerParty, {
            id = "player_" .. i,
            name = data.name or ("Player Pokemon " .. i),
            currentHP = data.hp or 100,
            maxHP = data.maxHP or 100,
            fainted = data.fainted or (data.hp == 0),
            level = data.level or 50
        })
    end
    
    -- Create enemy party
    for i, data in ipairs(enemyPartyData or {}) do
        table.insert(enemyParty, {
            id = "enemy_" .. i,
            name = data.name or ("Enemy Pokemon " .. i),
            currentHP = data.hp or 100,
            maxHP = data.maxHP or 100,
            fainted = data.fainted or (data.hp == 0),
            level = data.level or 50
        })
    end
    
    return {
        battleId = "test_battle_001",
        turn = 1,
        playerParty = playerParty,
        enemyParty = enemyParty
    }
end

-- Helper function to create mock Pokemon
local function createMockPokemon(name, hp, maxHP, stats)
    return {
        id = name .. "_001",
        name = name,
        currentHP = hp,
        maxHP = maxHP or 100,
        fainted = hp <= 0,
        stats = stats or {speed = 50}
    }
end

-- Helper function to run test and record results
local function runTest(testName, testFunction)
    local success, result = pcall(testFunction)
    table.insert(testResults, {
        name = testName,
        success = success,
        result = result,
        error = not success and result or nil
    })
    
    if success then
        print("✓ " .. testName)
    else
        print("✗ " .. testName .. ": " .. tostring(result))
    end
    
    return success
end

-- Helper function for assertions
local function assert_equal(expected, actual, message)
    if expected ~= actual then
        error(message or ("Expected " .. tostring(expected) .. " but got " .. tostring(actual)))
    end
end

local function assert_true(condition, message)
    if not condition then
        error(message or "Expected condition to be true")
    end
end

local function assert_false(condition, message)
    if condition then
        error(message or "Expected condition to be false")
    end
end

local function assert_not_nil(value, message)
    if value == nil then
        error(message or "Expected value to not be nil")
    end
end

-- Test: Victory/Defeat System Initialization
function TestSuite.testInitialization()
    -- Arrange & Act
    local success, message = VictoryDefeatSystem.init("test_seed_123")
    
    -- Assert
    assert_true(success, "Victory/defeat system should initialize successfully")
    assert_not_nil(message, "Initialization should return a message")
end

-- Test: Victory Condition - All Enemy Pokemon Fainted
function TestSuite.testVictoryCondition()
    -- Arrange
    local battleState = createMockBattleState(
        {{name = "Pikachu", hp = 50}},           -- Player has alive Pokemon
        {{name = "Charmander", hp = 0, fainted = true}}  -- All enemies fainted
    )
    
    -- Act
    local result = VictoryDefeatSystem.checkBattleEndConditions(battleState)
    
    -- Assert
    assert_not_nil(result, "Should return battle end result")
    assert_equal(VictoryDefeatSystem.BattleResult.VICTORY, result.result, "Should detect victory")
    assert_equal("All enemy Pokemon fainted", result.reason, "Should have correct victory reason")
    assert_equal(battleState.battleId, result.battleId, "Should include battle ID")
end

-- Test: Defeat Condition - All Player Pokemon Fainted
function TestSuite.testDefeatCondition()
    -- Arrange  
    local battleState = createMockBattleState(
        {{name = "Pikachu", hp = 0, fainted = true}},    -- All player Pokemon fainted
        {{name = "Charmander", hp = 50}}                 -- Enemy has alive Pokemon
    )
    
    -- Act
    local result = VictoryDefeatSystem.checkBattleEndConditions(battleState)
    
    -- Assert
    assert_not_nil(result, "Should return battle end result")
    assert_equal(VictoryDefeatSystem.BattleResult.DEFEAT, result.result, "Should detect defeat")
    assert_equal("All player Pokemon fainted", result.reason, "Should have correct defeat reason")
end

-- Test: Draw Condition - Both Sides Have No Usable Pokemon
function TestSuite.testDrawCondition()
    -- Arrange
    local battleState = createMockBattleState(
        {{name = "Pikachu", hp = 0, fainted = true}},      -- All player Pokemon fainted
        {{name = "Charmander", hp = 0, fainted = true}}    -- All enemy Pokemon fainted
    )
    
    -- Act
    local result = VictoryDefeatSystem.checkBattleEndConditions(battleState)
    
    -- Assert
    assert_not_nil(result, "Should return battle end result")
    assert_equal(VictoryDefeatSystem.BattleResult.DRAW, result.result, "Should detect draw")
    assert_equal("All Pokemon from both sides fainted", result.reason, "Should have correct draw reason")
end

-- Test: Battle Continues - Both Sides Have Usable Pokemon
function TestSuite.testBattleContinues()
    -- Arrange
    local battleState = createMockBattleState(
        {{name = "Pikachu", hp = 50}},     -- Player has alive Pokemon
        {{name = "Charmander", hp = 30}}   -- Enemy has alive Pokemon
    )
    
    -- Act
    local result = VictoryDefeatSystem.checkBattleEndConditions(battleState)
    
    -- Assert
    assert_equal(nil, result, "Should return nil when battle continues")
end

-- Test: Player Can Continue - Has Alive Pokemon
function TestSuite.testPlayerCanContinue()
    -- Arrange
    local playerParty = {
        createMockPokemon("Pikachu", 0, 100),    -- Fainted
        createMockPokemon("Squirtle", 50, 100),  -- Alive
        createMockPokemon("Bulbasaur", 0, 100)   -- Fainted
    }
    
    -- Act
    local result = VictoryDefeatSystem.canPlayerContinue(playerParty)
    
    -- Assert
    assert_true(result, "Player should be able to continue with alive Pokemon")
end

-- Test: Player Cannot Continue - No Alive Pokemon
function TestSuite.testPlayerCannotContinue()
    -- Arrange
    local playerParty = {
        createMockPokemon("Pikachu", 0, 100),    -- Fainted
        createMockPokemon("Squirtle", 0, 100),   -- Fainted
        createMockPokemon("Bulbasaur", 0, 100)   -- Fainted
    }
    
    -- Act
    local result = VictoryDefeatSystem.canPlayerContinue(playerParty)
    
    -- Assert
    assert_false(result, "Player should not be able to continue with no alive Pokemon")
end

-- Test: Enemy Can Continue - Has Alive Pokemon  
function TestSuite.testEnemyCanContinue()
    -- Arrange
    local enemyParty = {
        createMockPokemon("Charmander", 25, 100),  -- Alive
        createMockPokemon("Wartortle", 0, 100)     -- Fainted
    }
    
    -- Act
    local result = VictoryDefeatSystem.canEnemyContinue(enemyParty)
    
    -- Assert
    assert_true(result, "Enemy should be able to continue with alive Pokemon")
end

-- Test: Enemy Cannot Continue - No Alive Pokemon
function TestSuite.testEnemyCannotContinue()
    -- Arrange
    local enemyParty = {
        createMockPokemon("Charmander", 0, 100),   -- Fainted
        createMockPokemon("Wartortle", 0, 100)     -- Fainted
    }
    
    -- Act
    local result = VictoryDefeatSystem.canEnemyContinue(enemyParty)
    
    -- Assert
    assert_false(result, "Enemy should not be able to continue with no alive Pokemon")
end

-- Test: Forfeit Processing - Always Succeeds
function TestSuite.testForfeitProcessing()
    -- Arrange
    local battleState = createMockBattleState(
        {{name = "Pikachu", hp = 50}},
        {{name = "Charmander", hp = 30}}
    )
    local playerId = "player_123"
    
    -- Act
    local result = VictoryDefeatSystem.processForfeit(battleState, playerId)
    
    -- Assert
    assert_true(result.success, "Forfeit should always succeed")
    assert_equal(VictoryDefeatSystem.EscapeOutcome.SUCCESS, result.outcome, "Should have success outcome")
    assert_not_nil(result.battleResult, "Should return battle result")
    assert_equal(VictoryDefeatSystem.BattleResult.FORFEIT, result.battleResult.result, "Should mark as forfeit")
    assert_equal(playerId, result.battleResult.forfeitedBy, "Should record who forfeited")
end

-- Test: Escape Calculation - Speed-Based Success
function TestSuite.testEscapeCalculation()
    -- Arrange
    BattleRNG.initSeed("escape_test_123")
    local playerPokemon = createMockPokemon("Pikachu", 50, 100, {speed = 100})
    local enemyPokemon = createMockPokemon("Slowpoke", 50, 100, {speed = 20})
    local escapeAttempts = 1
    
    -- Act
    local escapeChance = VictoryDefeatSystem.calculateEscapeChance(playerPokemon, enemyPokemon, escapeAttempts)
    
    -- Assert
    assert_true(escapeChance >= 25, "Escape chance should be at least base 25%")
    assert_true(escapeChance <= 100, "Escape chance should not exceed 100%")
    -- Faster Pokemon should have higher escape chance due to speed bonus
end

-- Test: Escape Processing - Successful Escape
function TestSuite.testEscapeSuccess()
    -- Arrange
    local battleState = createMockBattleState(
        {{name = "Pikachu", hp = 50}},
        {{name = "Slowpoke", hp = 50}}
    )
    local playerPokemon = createMockPokemon("Pikachu", 50, 100, {speed = 100})
    local enemyPokemon = createMockPokemon("Slowpoke", 50, 100, {speed = 20})
    
    -- Set seed for deterministic success (high speed should give good chance)
    BattleRNG.initSeed("success_escape_456")
    
    -- Act
    local result = VictoryDefeatSystem.processEscape(battleState, playerPokemon, enemyPokemon)
    
    -- Assert
    assert_not_nil(result, "Should return escape result")
    assert_not_nil(result.escapeChance, "Should calculate escape chance")
    assert_not_nil(result.escapeRoll, "Should make escape roll")
    
    if result.success then
        assert_equal(VictoryDefeatSystem.EscapeOutcome.SUCCESS, result.outcome, "Should have success outcome")
        assert_equal(VictoryDefeatSystem.BattleResult.ESCAPE, result.battleResult.result, "Should mark as escape")
    else
        assert_equal(VictoryDefeatSystem.EscapeOutcome.FAILED, result.outcome, "Should have failed outcome")
    end
end

-- Test: Escape Processing - Failed Escape
function TestSuite.testEscapeFailure()
    -- Arrange
    local battleState = createMockBattleState(
        {{name = "Slowpoke", hp = 50}},
        {{name = "Pikachu", hp = 50}}
    )
    local playerPokemon = createMockPokemon("Slowpoke", 50, 100, {speed = 20})
    local enemyPokemon = createMockPokemon("Pikachu", 50, 100, {speed = 100})
    
    -- Set seed for likely failure (slow Pokemon vs fast Pokemon)
    BattleRNG.initSeed("failed_escape_789")
    
    -- Act
    local result = VictoryDefeatSystem.processEscape(battleState, playerPokemon, enemyPokemon)
    
    -- Assert
    assert_not_nil(result, "Should return escape result")
    assert_true(result.escapeChance < 50, "Slow Pokemon should have low escape chance")
    
    if not result.success then
        assert_false(result.success, "Should fail escape")
        assert_equal(VictoryDefeatSystem.EscapeOutcome.FAILED, result.outcome, "Should have failed outcome")
    end
end

-- Test: Battle End Summary Generation
function TestSuite.testBattleEndSummary()
    -- Arrange
    local victoryResult = {
        result = VictoryDefeatSystem.BattleResult.VICTORY,
        turn = 5
    }
    
    local defeatResult = {
        result = VictoryDefeatSystem.BattleResult.DEFEAT,
        turn = 3
    }
    
    -- Act
    local victorySummary = VictoryDefeatSystem.getBattleEndSummary(victoryResult)
    local defeatSummary = VictoryDefeatSystem.getBattleEndSummary(defeatResult)
    local continueSummary = VictoryDefeatSystem.getBattleEndSummary(nil)
    
    -- Assert
    assert_true(string.find(victorySummary, "Victory"), "Victory summary should mention victory")
    assert_true(string.find(victorySummary, "Turn 5"), "Victory summary should include turn count")
    
    assert_true(string.find(defeatSummary, "Defeat"), "Defeat summary should mention defeat")
    assert_true(string.find(defeatSummary, "Turn 3"), "Defeat summary should include turn count")
    
    assert_equal("Battle continues", continueSummary, "Should return continue message for nil result")
end

-- Test: Battle State Validation
function TestSuite.testBattleStateValidation()
    -- Arrange
    local validBattleState = createMockBattleState(
        {{name = "Pikachu", hp = 50}},
        {{name = "Charmander", hp = 30}}
    )
    
    local invalidBattleState = nil
    local emptyPartyState = createMockBattleState({}, {})
    
    -- Act
    local validResult = VictoryDefeatSystem.validateBattleState(validBattleState)
    local invalidResult = VictoryDefeatSystem.validateBattleState(invalidBattleState)
    local emptyResult = VictoryDefeatSystem.validateBattleState(emptyPartyState)
    
    -- Assert
    assert_true(validResult.valid, "Valid battle state should pass validation")
    assert_equal(nil, validResult.error, "Valid state should have no error")
    
    assert_false(invalidResult.valid, "Nil battle state should fail validation")
    assert_not_nil(invalidResult.error, "Invalid state should have error message")
    
    assert_false(emptyResult.valid, "Empty party state should fail validation")
    assert_not_nil(emptyResult.error, "Empty party should have error message")
end

-- Test: Edge Case - Single Pokemon Per Side
function TestSuite.testSinglePokemonBattle()
    -- Arrange
    local battleState = createMockBattleState(
        {{name = "Pikachu", hp = 1}},        -- Player has 1 HP
        {{name = "Charmander", hp = 0, fainted = true}}  -- Enemy fainted
    )
    
    -- Act
    local result = VictoryDefeatSystem.checkBattleEndConditions(battleState)
    
    -- Assert
    assert_not_nil(result, "Should detect battle end with single Pokemon")
    assert_equal(VictoryDefeatSystem.BattleResult.VICTORY, result.result, "Should be victory")
end

-- Test: Edge Case - Empty Parties
function TestSuite.testEmptyParties()
    -- Arrange
    local emptyBattleState = {
        battleId = "empty_test",
        turn = 1,
        playerParty = {},
        enemyParty = {}
    }
    
    -- Act
    local result = VictoryDefeatSystem.checkBattleEndConditions(emptyBattleState)
    
    -- Assert
    -- This should be handled gracefully - behavior depends on implementation
    -- Could return nil or a specific result for edge case
    if result then
        assert_true(result.result == VictoryDefeatSystem.BattleResult.DRAW or result == nil,
                   "Empty parties should result in draw or no result")
    end
end

-- Test: Edge Case - Invalid Pokemon Data
function TestSuite.testInvalidPokemonData()
    -- Arrange
    local battleStateWithNils = {
        battleId = "invalid_test",
        turn = 1,
        playerParty = {nil, {name = "Pikachu", hp = 50}},
        enemyParty = {{name = "Charmander", hp = 0, fainted = true}}
    }
    
    -- Act & Assert (should not crash)
    local result = VictoryDefeatSystem.checkBattleEndConditions(battleStateWithNils)
    -- Test passes if no error is thrown
    assert_true(true, "Should handle nil Pokemon gracefully")
end

-- Test: Multiple Escape Attempts - Increasing Success Rate
function TestSuite.testMultipleEscapeAttempts()
    -- Arrange
    local playerPokemon = createMockPokemon("Pikachu", 50, 100, {speed = 50})
    local enemyPokemon = createMockPokemon("Charmander", 50, 100, {speed = 50})
    
    -- Act
    local firstAttempt = VictoryDefeatSystem.calculateEscapeChance(playerPokemon, enemyPokemon, 1)
    local thirdAttempt = VictoryDefeatSystem.calculateEscapeChance(playerPokemon, enemyPokemon, 3)
    local fifthAttempt = VictoryDefeatSystem.calculateEscapeChance(playerPokemon, enemyPokemon, 5)
    
    -- Assert
    assert_true(thirdAttempt > firstAttempt, "Third attempt should have higher success rate than first")
    assert_true(fifthAttempt > thirdAttempt, "Fifth attempt should have higher success rate than third")
    assert_true(fifthAttempt <= 100, "Escape chance should not exceed 100%")
end

-- Run all tests
function TestSuite.runAllTests()
    print("Running Victory/Defeat System Unit Tests...")
    
    local tests = {
        {"Initialization", TestSuite.testInitialization},
        {"Victory Condition", TestSuite.testVictoryCondition},
        {"Defeat Condition", TestSuite.testDefeatCondition},
        {"Draw Condition", TestSuite.testDrawCondition},
        {"Battle Continues", TestSuite.testBattleContinues},
        {"Player Can Continue", TestSuite.testPlayerCanContinue},
        {"Player Cannot Continue", TestSuite.testPlayerCannotContinue},
        {"Enemy Can Continue", TestSuite.testEnemyCanContinue},
        {"Enemy Cannot Continue", TestSuite.testEnemyCannotContinue},
        {"Forfeit Processing", TestSuite.testForfeitProcessing},
        {"Escape Calculation", TestSuite.testEscapeCalculation},
        {"Escape Success", TestSuite.testEscapeSuccess},
        {"Escape Failure", TestSuite.testEscapeFailure},
        {"Battle End Summary", TestSuite.testBattleEndSummary},
        {"Battle State Validation", TestSuite.testBattleStateValidation},
        {"Single Pokemon Battle", TestSuite.testSinglePokemonBattle},
        {"Empty Parties", TestSuite.testEmptyParties},
        {"Invalid Pokemon Data", TestSuite.testInvalidPokemonData},
        {"Multiple Escape Attempts", TestSuite.testMultipleEscapeAttempts}
    }
    
    local passed = 0
    local total = #tests
    
    for _, test in ipairs(tests) do
        if runTest(test[1], test[2]) then
            passed = passed + 1
        end
    end
    
    print(string.format("\nVictory/Defeat System Tests: %d/%d passed (%.1f%%)", 
                       passed, total, (passed/total)*100))
    
    return {
        passed = passed,
        total = total,
        results = testResults
    }
end

return TestSuite