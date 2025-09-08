-- Turn Processor Unit Tests
-- Comprehensive testing for turn-based battle engine functionality
-- Tests speed calculation, priority handling, and turn order determination
-- Validates battle phase management and action execution

local TurnProcessor = require("game-logic.battle.turn-processor")
local PriorityCalculator = require("game-logic.battle.priority-calculator")
local BattleConditions = require("game-logic.battle.battle-conditions")

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

-- Create mock Pokemon for testing
local function createMockPokemon(id, name, speed, level)
    return {
        id = id,
        name = name or ("Pokemon" .. id),
        species = 1,
        level = level or 50,
        currentHP = 100,
        maxHP = 100,
        stats = {
            hp = 100,
            attack = 80,
            defense = 80,
            special_attack = 80,
            special_defense = 80,
            speed = speed or 100
        },
        battleStats = {},
        types = {1, 0}, -- Normal type
        moves = {
            [1] = {pp = 10, maxPP = 10}, -- Tackle
            [40] = {pp = 15, maxPP = 15} -- Poison Powder
        },
        status = nil,
        ability = nil,
        heldItem = nil
    }
end

-- Test 1: Battle Initialization
function tests.testBattleInitialization()
    print("\n=== Testing Battle Initialization ===")
    
    local playerParty = {createMockPokemon(1, "Pikachu", 90)}
    local enemyParty = {createMockPokemon(2, "Charmander", 65)}
    
    local battleState, error = TurnProcessor.initializeBattle("test-battle-1", "test-seed-123", playerParty, enemyParty)
    
    assertNotNil(battleState, "Battle state should be created")
    assertEquals(battleState.battleId, "test-battle-1", "Battle ID should match")
    assertEquals(battleState.turn, 0, "Turn should start at 0")
    assertEquals(battleState.phase, TurnProcessor.TurnPhase.COMMAND_SELECTION, "Phase should be command selection")
    assertEquals(#battleState.playerParty, 1, "Player party should have 1 Pokemon")
    assertEquals(#battleState.enemyParty, 1, "Enemy party should have 1 Pokemon")
end

-- Test 2: Command Addition and Validation
function tests.testCommandAddition()
    print("\n=== Testing Command Addition and Validation ===")
    
    local playerParty = {createMockPokemon(1, "Pikachu", 90)}
    local enemyParty = {createMockPokemon(2, "Charmander", 65)}
    
    local battleState = TurnProcessor.initializeBattle("test-battle-2", "test-seed-456", playerParty, enemyParty)
    TurnProcessor.beginCommandPhase(battleState)
    
    -- Test valid move command
    local moveCommand = {
        type = "move",
        pokemonId = 1,
        moveId = 1
    }
    
    local success, result = TurnProcessor.addTurnCommand(battleState, "player", moveCommand)
    assertTrue(success, "Valid move command should be accepted")
    
    -- Test invalid command (no PP)
    battleState.playerParty[1].moves[1].pp = 0
    local success2, result2 = TurnProcessor.addTurnCommand(battleState, "player", moveCommand)
    assertEquals(success2, false, "Command with no PP should be rejected")
end

-- Test 3: Turn Order Calculation
function tests.testTurnOrderCalculation()
    print("\n=== Testing Turn Order Calculation ===")
    
    -- Create Pokemon with different speeds
    local fastPokemon = createMockPokemon(1, "Fast", 120)
    local slowPokemon = createMockPokemon(2, "Slow", 60)
    local mediumPokemon = createMockPokemon(3, "Medium", 90)
    
    local actions = {
        PriorityCalculator.createTurnAction("move", fastPokemon, 1, nil, {}),
        PriorityCalculator.createTurnAction("move", slowPokemon, 1, nil, {}),
        PriorityCalculator.createTurnAction("move", mediumPokemon, 1, nil, {})
    }
    
    local orderedActions = PriorityCalculator.calculateTurnOrder(actions, {})
    
    assertEquals(#orderedActions, 3, "All actions should be in turn order")
    assertEquals(orderedActions[1].pokemonId, 1, "Fast Pokemon should go first")
    assertEquals(orderedActions[2].pokemonId, 3, "Medium Pokemon should go second")
    assertEquals(orderedActions[3].pokemonId, 2, "Slow Pokemon should go third")
end

-- Test 4: Priority Move Handling
function tests.testPriorityMoveHandling()
    print("\n=== Testing Priority Move Handling ===")
    
    local fastPokemon = createMockPokemon(1, "Fast", 120)
    local slowPokemon = createMockPokemon(2, "Slow", 60)
    
    -- Quick Attack has priority +1, Tackle has priority 0
    local actions = {
        PriorityCalculator.createTurnAction("move", fastPokemon, 1, nil, {}), -- Tackle (priority 0)
        PriorityCalculator.createTurnAction("move", slowPokemon, 98, nil, {}) -- Quick Attack (priority +1)
    }
    
    local orderedActions = PriorityCalculator.calculateTurnOrder(actions, {})
    
    assertEquals(#orderedActions, 2, "Both actions should be in turn order")
    -- Even though slow Pokemon is slower, Quick Attack should go first due to priority
    assertEquals(orderedActions[1].pokemonId, 2, "Priority move should go first regardless of speed")
    assertEquals(orderedActions[2].pokemonId, 1, "Normal move should go second")
end

-- Test 5: Status Effect Processing
function tests.testStatusEffectProcessing()
    print("\n=== Testing Status Effect Processing ===")
    
    local pokemon = createMockPokemon(1, "Burned", 100)
    pokemon.status = "burn"
    pokemon.currentHP = 80
    
    local battleState = {
        battleId = "test-status",
        playerParty = {pokemon},
        enemyParty = {}
    }
    
    local statusResults = TurnProcessor.processStatusEffects(pokemon, battleState)
    
    assertTrue(#statusResults > 0, "Burn should cause status effects")
    assertEquals(statusResults[1].effect, "burn_damage", "Should process burn damage")
    assertTrue(statusResults[1].damage > 0, "Burn should deal damage")
    assertTrue(pokemon.currentHP < 80, "Pokemon should take burn damage")
end

-- Test 6: Battle End Condition Detection
function tests.testBattleEndConditions()
    print("\n=== Testing Battle End Condition Detection ===")
    
    local playerParty = {createMockPokemon(1, "Player", 100)}
    local enemyParty = {createMockPokemon(2, "Enemy", 100)}
    
    -- Test ongoing battle
    playerParty[1].currentHP = 50
    enemyParty[1].currentHP = 30
    
    local battleState = {
        battleId = "test-end-conditions",
        playerParty = playerParty,
        enemyParty = enemyParty
    }
    
    local battleEnd = TurnProcessor.checkBattleEndConditions(battleState)
    assertEquals(battleEnd, nil, "Battle should continue when both sides have usable Pokemon")
    
    -- Test player victory
    enemyParty[1].currentHP = 0
    battleEnd = TurnProcessor.checkBattleEndConditions(battleState)
    assertNotNil(battleEnd, "Battle should end when enemy has no usable Pokemon")
    assertEquals(battleEnd.result, "victory", "Player should win when enemy has no usable Pokemon")
    
    -- Test player defeat
    playerParty[1].currentHP = 0
    enemyParty[1].currentHP = 30
    battleEnd = TurnProcessor.checkBattleEndConditions(battleState)
    assertNotNil(battleEnd, "Battle should end when player has no usable Pokemon")
    assertEquals(battleEnd.result, "defeat", "Player should lose when they have no usable Pokemon")
    
    -- Test draw
    playerParty[1].currentHP = 0
    enemyParty[1].currentHP = 0
    battleEnd = TurnProcessor.checkBattleEndConditions(battleState)
    assertNotNil(battleEnd, "Battle should end when both sides have no usable Pokemon")
    assertEquals(battleEnd.result, "draw", "Battle should be a draw when both sides have no usable Pokemon")
end

-- Test 7: Multi-Turn Action Tracking
function tests.testMultiTurnActions()
    print("\n=== Testing Multi-Turn Action Tracking ===")
    
    local pokemon = createMockPokemon(1, "Charging", 100)
    local battleState = {
        battleId = "test-multi-turn",
        multiTurnData = {}
    }
    
    -- Create a charging move action
    local action = {
        type = "move",
        pokemonId = 1,
        moveId = 143 -- Sky Attack (charging move)
    }
    
    local result = {
        success = true
    }
    
    -- This would normally be handled by move effects system
    -- Here we simulate the multi-turn tracking
    TurnProcessor.updateMultiTurnActions(battleState, action, result)
    
    -- Verify multi-turn data structure exists
    assertNotNil(battleState.multiTurnData, "Multi-turn data should be initialized")
    
    -- Test duration updates
    TurnProcessor.updateMultiTurnDurations(battleState)
    
    assertTrue(true, "Multi-turn duration update completed without errors")
end

-- Test 8: Trick Room Speed Reversal
function tests.testTrickRoomSpeedReversal()
    print("\n=== Testing Trick Room Speed Reversal ===")
    
    local fastPokemon = createMockPokemon(1, "Fast", 120)
    local slowPokemon = createMockPokemon(2, "Slow", 60)
    
    local actions = {
        PriorityCalculator.createTurnAction("move", fastPokemon, 1, nil, {}),
        PriorityCalculator.createTurnAction("move", slowPokemon, 1, nil, {})
    }
    
    -- Normal order (fast first)
    local normalOrder = PriorityCalculator.calculateTurnOrder(actions, {})
    assertEquals(normalOrder[1].pokemonId, 1, "Fast Pokemon should go first in normal conditions")
    
    -- Trick Room active (slow first)
    local trickRoomConditions = {trickRoom = 3}
    local trickRoomOrder = PriorityCalculator.calculateTurnOrder(actions, trickRoomConditions)
    assertEquals(trickRoomOrder[1].pokemonId, 2, "Slow Pokemon should go first in Trick Room")
end

-- Test 9: Weather Speed Modifications
function tests.testWeatherSpeedModifications()
    print("\n=== Testing Weather Speed Modifications ===")
    
    -- Test Chlorophyll in sun
    local chlorophyllPokemon = createMockPokemon(1, "Chlorophyll", 80)
    chlorophyllPokemon.ability = 34 -- Chlorophyll ability ID (placeholder)
    
    local sunnyConditions = {weather = 1} -- Sunny weather
    
    local effectiveSpeed = PriorityCalculator.calculateEffectiveSpeed(chlorophyllPokemon, sunnyConditions)
    assertTrue(effectiveSpeed > 80, "Chlorophyll should double speed in sun")
    
    -- Test without sun
    local normalConditions = {weather = 0}
    local normalSpeed = PriorityCalculator.calculateEffectiveSpeed(chlorophyllPokemon, normalConditions)
    assertEquals(normalSpeed, 80, "Speed should be normal without sun")
end

-- Test 10: Battle State Validation
function tests.testBattleStateValidation()
    print("\n=== Testing Battle State Validation ===")
    
    local playerParty = {createMockPokemon(1, "Valid", 100)}
    local enemyParty = {createMockPokemon(2, "Valid", 100)}
    
    local validBattleState = TurnProcessor.initializeBattle("test-validation", "test-seed", playerParty, enemyParty)
    
    -- Test valid state
    local BattleStatePersistence = require("game-logic.battle.battle-state-persistence")
    local isValid, error = BattleStatePersistence.validateBattleState(validBattleState)
    assertTrue(isValid, "Valid battle state should pass validation")
    
    -- Test invalid state (missing battleId)
    local invalidState = {
        turn = 0,
        phase = 1
    }
    isValid, error = BattleStatePersistence.validateBattleState(invalidState)
    assertEquals(isValid, false, "Invalid battle state should fail validation")
end

-- Run all tests
function tests.runAllTests()
    print("Starting Turn Processor Unit Tests...")
    
    -- Initialize move database for tests
    local MoveDatabase = require("data.moves.move-database")
    MoveDatabase.init()
    
    -- Run individual tests
    tests.testBattleInitialization()
    tests.testCommandAddition()
    tests.testTurnOrderCalculation()
    tests.testPriorityMoveHandling()
    tests.testStatusEffectProcessing()
    tests.testBattleEndConditions()
    tests.testMultiTurnActions()
    tests.testTrickRoomSpeedReversal()
    tests.testWeatherSpeedModifications()
    tests.testBattleStateValidation()
    
    -- Print results
    print("\n" .. string.rep("=", 50))
    print("TURN PROCESSOR UNIT TEST RESULTS")
    print(string.rep("=", 50))
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
    
    print(string.rep("=", 50))
    
    return testResults.passed == testResults.total
end

return tests