-- Unit Tests for Positional Mechanics System
-- Comprehensive test coverage for position tracking, battle format detection, and adjacency calculations
-- AAA pattern (Arrange, Act, Assert) with 100% coverage requirement

local PositionalMechanics = require("game-logic.battle.positional-mechanics")
local Enums = require("data.constants.enums")

local PositionalMechanicsTests = {}

-- Test framework setup
local function assert(condition, message)
    if not condition then
        error(message or "Assertion failed")
    end
end

local function assertEqual(actual, expected, message)
    if actual ~= expected then
        error(string.format("%s: Expected %s, got %s", message or "Assertion failed", tostring(expected), tostring(actual)))
    end
end

local function assertTrue(condition, message)
    assert(condition, message)
end

local function assertFalse(condition, message)
    assert(not condition, message)
end

-- Mock data helpers
local function createMockBattleState(positionData)
    return {
        battleId = "test-battle-001",
        turn = 1,
        playerParty = {},
        enemyParty = {},
        positionData = positionData
    }
end

local function createMockPokemon(id, name, level, side)
    return {
        id = id or 1,
        name = name or "TestPokemon",
        level = level or 50,
        fainted = false,
        battleData = side and {side = side} or nil
    }
end

-- Test 1: Battle Format Detection
function PositionalMechanicsTests.testBattleFormatDetection()
    -- Arrange & Act & Assert
    
    -- Single battle (1v1)
    local singleFormat = PositionalMechanics.detectBattleFormat(1, 1)
    assertEqual(singleFormat, PositionalMechanics.BattleFormat.SINGLE, "1v1 should be single format")
    
    -- Double battle (2v2)
    local doubleFormat = PositionalMechanics.detectBattleFormat(2, 2)
    assertEqual(doubleFormat, PositionalMechanics.BattleFormat.DOUBLE, "2v2 should be double format")
    
    -- Double battle (2v1)
    local doubleFormat2 = PositionalMechanics.detectBattleFormat(2, 1)
    assertEqual(doubleFormat2, PositionalMechanics.BattleFormat.DOUBLE, "2v1 should be double format")
    
    -- Double battle (1v2)
    local doubleFormat3 = PositionalMechanics.detectBattleFormat(1, 2)
    assertEqual(doubleFormat3, PositionalMechanics.BattleFormat.DOUBLE, "1v2 should be double format")
    
    -- Default parameters
    local defaultFormat = PositionalMechanics.detectBattleFormat()
    assertEqual(defaultFormat, PositionalMechanics.BattleFormat.SINGLE, "Default should be single format")
end

-- Test 2: Positional State Initialization
function PositionalMechanicsTests.testPositionalStateInitialization()
    -- Arrange
    local battleState = createMockBattleState()
    
    -- Act - Single battle initialization
    local singlePositionData = PositionalMechanics.initializePositionalState(battleState, 1, 1)
    
    -- Assert
    assertTrue(singlePositionData ~= nil, "Position data should be initialized")
    assertEqual(singlePositionData.format, PositionalMechanics.BattleFormat.SINGLE, "Should detect single format")
    assertTrue(singlePositionData.playerPositions[1] == nil, "Player position should be empty initially")
    assertTrue(singlePositionData.enemyPositions[1] == nil, "Enemy position should be empty initially")
    
    -- Act - Double battle initialization
    local doublePositionData = PositionalMechanics.initializePositionalState(battleState, 2, 2)
    
    -- Assert
    assertEqual(doublePositionData.format, PositionalMechanics.BattleFormat.DOUBLE, "Should detect double format")
    assertTrue(doublePositionData.playerPositions[1] == nil, "Player left position should be empty")
    assertTrue(doublePositionData.playerPositions[2] == nil, "Player right position should be empty")
    assertTrue(doublePositionData.enemyPositions[1] == nil, "Enemy left position should be empty")
    assertTrue(doublePositionData.enemyPositions[2] == nil, "Enemy right position should be empty")
end

-- Test 3: Pokemon Position Assignment
function PositionalMechanicsTests.testPokemonPositionAssignment()
    -- Arrange
    local battleState = createMockBattleState()
    PositionalMechanics.initializePositionalState(battleState, 2, 2)
    local pokemon = createMockPokemon(1, "Pikachu", 50)
    
    -- Act
    local success, message = PositionalMechanics.assignPokemonPosition(battleState, pokemon, "player", 1)
    
    -- Assert
    assertTrue(success, "Position assignment should succeed")
    assertEqual(battleState.positionData.playerPositions[1], pokemon.id, "Pokemon ID should be stored in position")
    assertEqual(pokemon.battleData.position, 1, "Pokemon should know its position")
    assertEqual(pokemon.battleData.side, "player", "Pokemon should know its side")
end

-- Test 4: Position Assignment Validation
function PositionalMechanicsTests.testPositionAssignmentValidation()
    -- Arrange
    local battleState = createMockBattleState()
    PositionalMechanics.initializePositionalState(battleState, 1, 1) -- Single battle
    local pokemon = createMockPokemon(1, "Pikachu", 50)
    
    -- Test invalid position in single battle
    local success, message = PositionalMechanics.assignPokemonPosition(battleState, pokemon, "player", 2)
    assertFalse(success, "Should fail to assign position 2 in single battle")
    assertTrue(message:find("Single battle only supports position 1"), "Should explain single battle constraint")
    
    -- Test invalid side
    success, message = PositionalMechanics.assignPokemonPosition(battleState, pokemon, "invalid", 1)
    assertFalse(success, "Should fail with invalid side")
    assertTrue(message:find("Invalid side specified"), "Should explain invalid side")
    
    -- Test missing pokemon
    success, message = PositionalMechanics.assignPokemonPosition(battleState, nil, "player", 1)
    assertFalse(success, "Should fail with missing pokemon")
    assertTrue(message:find("Pokemon required"), "Should explain missing pokemon")
end

-- Test 5: Get Pokemon at Position
function PositionalMechanicsTests.testGetPokemonAtPosition()
    -- Arrange
    local battleState = createMockBattleState()
    PositionalMechanics.initializePositionalState(battleState, 2, 2)
    local pokemon = createMockPokemon(1, "Pikachu", 50)
    battleState.playerParty = {pokemon}
    PositionalMechanics.assignPokemonPosition(battleState, pokemon, "player", 1)
    
    -- Act
    local foundPokemon = PositionalMechanics.getPokemonAtPosition(battleState, "player", 1)
    local emptyPosition = PositionalMechanics.getPokemonAtPosition(battleState, "player", 2)
    
    -- Assert
    assertEqual(foundPokemon.id, pokemon.id, "Should find correct pokemon at position")
    assertEqual(foundPokemon.name, "Pikachu", "Should return correct pokemon data")
    assertEqual(emptyPosition, nil, "Should return nil for empty position")
end

-- Test 6: Get All Active Positions
function PositionalMechanicsTests.testGetAllActivePositions()
    -- Arrange
    local battleState = createMockBattleState()
    PositionalMechanics.initializePositionalState(battleState, 2, 2)
    
    local playerPokemon1 = createMockPokemon(1, "Pikachu", 50)
    local playerPokemon2 = createMockPokemon(2, "Charizard", 50)
    local enemyPokemon1 = createMockPokemon(3, "Blastoise", 50)
    
    battleState.playerParty = {playerPokemon1, playerPokemon2}
    battleState.enemyParty = {enemyPokemon1}
    
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon1, "player", 1)
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon2, "player", 2)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon1, "enemy", 1)
    
    -- Act
    local activePositions = PositionalMechanics.getAllActivePositions(battleState)
    
    -- Assert
    assertEqual(activePositions.format, PositionalMechanics.BattleFormat.DOUBLE, "Should report correct format")
    assertTrue(activePositions.player[1] ~= nil, "Should have player pokemon in position 1")
    assertTrue(activePositions.player[2] ~= nil, "Should have player pokemon in position 2")
    assertTrue(activePositions.enemy[1] ~= nil, "Should have enemy pokemon in position 1")
    assertTrue(activePositions.enemy[2] == nil, "Should not have enemy pokemon in position 2")
    
    assertEqual(activePositions.player[1].pokemon_id, 1, "Should have correct pokemon ID")
    assertEqual(activePositions.player[1].name, "Pikachu", "Should have correct pokemon name")
end

-- Test 7: Adjacency Map Building
function PositionalMechanicsTests.testAdjacencyMapBuilding()
    -- Arrange & Act
    local doubleAdjacency = PositionalMechanics.buildAdjacencyMap(PositionalMechanics.BattleFormat.DOUBLE)
    local singleAdjacency = PositionalMechanics.buildAdjacencyMap(PositionalMechanics.BattleFormat.SINGLE)
    
    -- Assert
    assertTrue(doubleAdjacency.player ~= nil, "Should have player adjacency mapping")
    assertTrue(doubleAdjacency.enemy ~= nil, "Should have enemy adjacency mapping")
    
    -- Test double battle adjacency
    assertEqual(doubleAdjacency.player[1][1], 2, "Left position should be adjacent to right")
    assertEqual(doubleAdjacency.player[2][1], 1, "Right position should be adjacent to left")
    assertEqual(doubleAdjacency.enemy[1][1], 2, "Enemy left should be adjacent to enemy right")
    assertEqual(doubleAdjacency.enemy[2][1], 1, "Enemy right should be adjacent to enemy left")
    
    -- Test single battle has no adjacency
    assertTrue(next(singleAdjacency) == nil, "Single battle should have empty adjacency map")
end

-- Test 8: Get Adjacent Allies
function PositionalMechanicsTests.testGetAdjacentAllies()
    -- Arrange
    local battleState = createMockBattleState()
    PositionalMechanics.initializePositionalState(battleState, 2, 2)
    
    local pokemon1 = createMockPokemon(1, "Pikachu", 50)
    local pokemon2 = createMockPokemon(2, "Charizard", 50)
    
    battleState.playerParty = {pokemon1, pokemon2}
    
    PositionalMechanics.assignPokemonPosition(battleState, pokemon1, "player", 1)
    PositionalMechanics.assignPokemonPosition(battleState, pokemon2, "player", 2)
    
    -- Act
    local adjacentToPokemon1 = PositionalMechanics.getAdjacentAllies(battleState, pokemon1)
    local adjacentToPokemon2 = PositionalMechanics.getAdjacentAllies(battleState, pokemon2)
    
    -- Assert
    assertEqual(#adjacentToPokemon1, 1, "Pokemon 1 should have 1 adjacent ally")
    assertEqual(adjacentToPokemon1[1].id, pokemon2.id, "Pokemon 1's adjacent ally should be Pokemon 2")
    
    assertEqual(#adjacentToPokemon2, 1, "Pokemon 2 should have 1 adjacent ally")
    assertEqual(adjacentToPokemon2[1].id, pokemon1.id, "Pokemon 2's adjacent ally should be Pokemon 1")
end

-- Test 9: Position Swapping
function PositionalMechanicsTests.testPositionSwapping()
    -- Arrange
    local battleState = createMockBattleState()
    PositionalMechanics.initializePositionalState(battleState, 2, 2)
    
    local pokemon1 = createMockPokemon(1, "Pikachu", 50)
    local pokemon2 = createMockPokemon(2, "Charizard", 50)
    
    battleState.playerParty = {pokemon1, pokemon2}
    
    PositionalMechanics.assignPokemonPosition(battleState, pokemon1, "player", 1)
    PositionalMechanics.assignPokemonPosition(battleState, pokemon2, "player", 2)
    
    -- Act
    local success, message = PositionalMechanics.swapPokemonPositions(battleState, pokemon1, pokemon2)
    
    -- Assert
    assertTrue(success, "Position swap should succeed")
    assertEqual(pokemon1.battleData.position, 2, "Pokemon 1 should now be in position 2")
    assertEqual(pokemon2.battleData.position, 1, "Pokemon 2 should now be in position 1")
    assertEqual(battleState.positionData.playerPositions[1], pokemon2.id, "Position 1 should have Pokemon 2")
    assertEqual(battleState.positionData.playerPositions[2], pokemon1.id, "Position 2 should have Pokemon 1")
end

-- Test 10: Position Swap Validation
function PositionalMechanicsTests.testPositionSwapValidation()
    -- Arrange
    local battleState = createMockBattleState()
    PositionalMechanics.initializePositionalState(battleState, 2, 2)
    
    local playerPokemon = createMockPokemon(1, "Pikachu", 50)
    local enemyPokemon = createMockPokemon(2, "Charizard", 50)
    
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon, "player", 1)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon, "enemy", 1)
    
    -- Test swapping between different sides
    local success, message = PositionalMechanics.swapPokemonPositions(battleState, playerPokemon, enemyPokemon)
    assertFalse(success, "Should fail to swap between different sides")
    assertTrue(message:find("Can only swap positions between allies"), "Should explain ally-only constraint")
    
    -- Test swapping with missing battle data
    local pokemonNoBattleData = createMockPokemon(3, "Blastoise", 50)
    success, message = PositionalMechanics.swapPokemonPositions(battleState, playerPokemon, pokemonNoBattleData)
    assertFalse(success, "Should fail with missing battle data")
    assertTrue(message:find("missing battle data"), "Should explain missing battle data")
end

-- Test 11: Pokemon Faint Handling
function PositionalMechanicsTests.testPokemonFaintHandling()
    -- Arrange
    local battleState = createMockBattleState()
    PositionalMechanics.initializePositionalState(battleState, 2, 2)
    
    local pokemon = createMockPokemon(1, "Pikachu", 50)
    battleState.playerParty = {pokemon}
    
    PositionalMechanics.assignPokemonPosition(battleState, pokemon, "player", 1)
    
    -- Verify position is assigned
    assertEqual(battleState.positionData.playerPositions[1], pokemon.id, "Position should be occupied")
    
    -- Act
    PositionalMechanics.handlePokemonFaint(battleState, pokemon)
    
    -- Assert
    assertEqual(battleState.positionData.playerPositions[1], nil, "Position should be cleared")
    assertEqual(pokemon.battleData.position, nil, "Pokemon position should be cleared")
end

-- Test 12: Battle Format Info
function PositionalMechanicsTests.testBattleFormatInfo()
    -- Arrange
    local battleState = createMockBattleState()
    
    -- Test without position data
    local formatInfoNoData = PositionalMechanics.getBattleFormatInfo({})
    assertEqual(formatInfoNoData.format, PositionalMechanics.BattleFormat.SINGLE, "Should default to single")
    assertFalse(formatInfoNoData.supports_positioning, "Should not support positioning")
    assertEqual(formatInfoNoData.max_active_per_side, 1, "Should have max 1 active per side")
    
    -- Test single battle
    PositionalMechanics.initializePositionalState(battleState, 1, 1)
    local singleFormatInfo = PositionalMechanics.getBattleFormatInfo(battleState)
    assertEqual(singleFormatInfo.format, PositionalMechanics.BattleFormat.SINGLE, "Should be single format")
    assertFalse(singleFormatInfo.supports_positioning, "Should not support positioning")
    assertEqual(singleFormatInfo.max_active_per_side, 1, "Should have max 1 active per side")
    
    -- Test double battle
    PositionalMechanics.initializePositionalState(battleState, 2, 2)
    local doubleFormatInfo = PositionalMechanics.getBattleFormatInfo(battleState)
    assertEqual(doubleFormatInfo.format, PositionalMechanics.BattleFormat.DOUBLE, "Should be double format")
    assertTrue(doubleFormatInfo.supports_positioning, "Should support positioning")
    assertEqual(doubleFormatInfo.max_active_per_side, 2, "Should have max 2 active per side")
end

-- Test 13: Battle Position Initialization
function PositionalMechanicsTests.testInitializeBattlePositions()
    -- Arrange
    local battleState = createMockBattleState()
    
    local playerPokemon1 = createMockPokemon(1, "Pikachu", 50)
    local playerPokemon2 = createMockPokemon(2, "Charizard", 50)
    local enemyPokemon1 = createMockPokemon(3, "Blastoise", 50)
    
    local activePlayerPokemon = {playerPokemon1, playerPokemon2}
    local activeEnemyPokemon = {enemyPokemon1}
    
    -- Act
    local success, message = PositionalMechanics.initializeBattlePositions(battleState, activePlayerPokemon, activeEnemyPokemon)
    
    -- Assert
    assertTrue(success, "Battle position initialization should succeed")
    assertEqual(battleState.positionData.format, PositionalMechanics.BattleFormat.DOUBLE, "Should detect double format")
    
    assertEqual(playerPokemon1.battleData.position, 1, "Player pokemon 1 should be in position 1")
    assertEqual(playerPokemon2.battleData.position, 2, "Player pokemon 2 should be in position 2")
    assertEqual(enemyPokemon1.battleData.position, 1, "Enemy pokemon should be in position 1")
    
    assertEqual(playerPokemon1.battleData.side, "player", "Player pokemon should have correct side")
    assertEqual(enemyPokemon1.battleData.side, "enemy", "Enemy pokemon should have correct side")
end

-- Test 14: Positional Mechanics Support Check
function PositionalMechanicsTests.testPositionalMechanicsSupport()
    -- Arrange
    local singleBattleState = createMockBattleState()
    local doubleBattleState = createMockBattleState()
    
    PositionalMechanics.initializePositionalState(singleBattleState, 1, 1)
    PositionalMechanics.initializePositionalState(doubleBattleState, 2, 2)
    
    -- Act & Assert
    assertFalse(PositionalMechanics.supportsPositionalMechanics(singleBattleState), "Single battle should not support positional mechanics")
    assertTrue(PositionalMechanics.supportsPositionalMechanics(doubleBattleState), "Double battle should support positional mechanics")
    assertFalse(PositionalMechanics.supportsPositionalMechanics({}), "Empty state should not support positional mechanics")
end

-- Test 15: Position Targeting Options
function PositionalMechanicsTests.testPositionTargetingOptions()
    -- Arrange
    local battleState = createMockBattleState()
    PositionalMechanics.initializePositionalState(battleState, 2, 2)
    
    local playerPokemon1 = createMockPokemon(1, "Pikachu", 50)
    local playerPokemon2 = createMockPokemon(2, "Charizard", 50)
    local enemyPokemon1 = createMockPokemon(3, "Blastoise", 50)
    local enemyPokemon2 = createMockPokemon(4, "Venusaur", 50)
    
    battleState.playerParty = {playerPokemon1, playerPokemon2}
    battleState.enemyParty = {enemyPokemon1, enemyPokemon2}
    
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon1, "player", 1)
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon2, "player", 2)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon1, "enemy", 1)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon2, "enemy", 2)
    
    -- Act
    local targetingOptions = PositionalMechanics.getPositionTargetingOptions(battleState, playerPokemon1)
    
    -- Assert
    assertEqual(#targetingOptions.allies, 1, "Should have 1 ally option (excluding self)")
    assertEqual(targetingOptions.allies[1].pokemon.id, playerPokemon2.id, "Ally should be player pokemon 2")
    
    assertEqual(#targetingOptions.opponents, 2, "Should have 2 opponent options")
    assertEqual(targetingOptions.opponents[1].pokemon.id, enemyPokemon1.id, "First opponent should be enemy pokemon 1")
    assertEqual(targetingOptions.opponents[2].pokemon.id, enemyPokemon2.id, "Second opponent should be enemy pokemon 2")
    
    assertEqual(#targetingOptions.all, 3, "Should have 3 total targeting options (1 ally + 2 opponents)")
end

-- Test Runner
function PositionalMechanicsTests.runAllTests()
    local tests = {
        "testBattleFormatDetection",
        "testPositionalStateInitialization",
        "testPokemonPositionAssignment",
        "testPositionAssignmentValidation",
        "testGetPokemonAtPosition",
        "testGetAllActivePositions",
        "testAdjacencyMapBuilding",
        "testGetAdjacentAllies",
        "testPositionSwapping",
        "testPositionSwapValidation",
        "testPokemonFaintHandling",
        "testBattleFormatInfo",
        "testInitializeBattlePositions",
        "testPositionalMechanicsSupport",
        "testPositionTargetingOptions"
    }
    
    local passed = 0
    local failed = 0
    
    print("Running Positional Mechanics Unit Tests...")
    print("=" .. string.rep("=", 50))
    
    for _, testName in ipairs(tests) do
        local success, error = pcall(PositionalMechanicsTests[testName])
        if success then
            print("✓ " .. testName)
            passed = passed + 1
        else
            print("✗ " .. testName .. ": " .. tostring(error))
            failed = failed + 1
        end
    end
    
    print("=" .. string.rep("=", 50))
    print(string.format("Tests completed: %d passed, %d failed", passed, failed))
    
    if failed > 0 then
        error(string.format("Unit tests failed: %d/%d tests failed", failed, passed + failed))
    end
    
    return {passed = passed, failed = failed}
end

-- Run tests if this file is executed directly
if arg and arg[0] and arg[0]:find("positional%-mechanics%.test%.lua$") then
    PositionalMechanicsTests.runAllTests()
end

return PositionalMechanicsTests