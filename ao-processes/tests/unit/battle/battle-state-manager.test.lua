-- Battle State Manager Unit Tests
-- Tests for battle state creation, management, and persistence
-- Follows AAA pattern with comprehensive edge case coverage

local BattleStateManager = require("game-logic.battle.battle-state-manager")

local BattleStateManagerTests = {}

-- Test fixtures
local function createTestPokemon(id, name, hp)
    return {
        id = id,
        name = name or "TestMon",
        species = 1,
        level = 50,
        stats = {hp = hp or 100, attack = 100, defense = 100, spatk = 100, spdef = 100, speed = 100},
        currentHP = hp or 100,
        maxHP = hp or 100,
        status = nil,
        fainted = false,
        moves = {[1] = {id = 1, pp = 10}},
        ability = 1
    }
end

local function createTestParty()
    return {
        createTestPokemon("player_1", "Pikachu", 100),
        createTestPokemon("player_2", "Charizard", 120),
        createTestPokemon("player_3", "Blastoise", 110)
    }
end

-- Test Battle State Creation
function BattleStateManagerTests.testCreateBattleState()
    -- Arrange
    local battleId = "test_battle_001"
    local battleSeed = 12345
    local playerParty = createTestParty()
    local enemyParty = createTestParty()
    
    -- Act
    local battleState, error = BattleStateManager.createBattleState(battleId, battleSeed, playerParty, enemyParty)
    
    -- Assert
    assert(battleState ~= nil, "Battle state should be created successfully")
    assert(error == nil, "Should not return error on valid creation")
    assert(battleState.battleId == battleId, "Battle ID should match")
    assert(battleState.battleSeed == battleSeed, "Battle seed should match")
    assert(battleState.turn == 0, "Initial turn should be 0")
    assert(battleState.phase == BattleStateManager.BattlePhase.COMMAND_SELECTION, "Initial phase should be COMMAND_SELECTION")
    assert(#battleState.playerParty == 3, "Player party should have 3 Pokemon")
    assert(#battleState.enemyParty == 3, "Enemy party should have 3 Pokemon")
    
    print("✓ Battle state creation test passed")
end

-- Test Active Pokemon Initialization
function BattleStateManagerTests.testInitializeActivePokemon()
    -- Arrange
    local battleId = "test_battle_002"
    local battleSeed = 12345
    local playerParty = createTestParty()
    local enemyParty = createTestParty()
    
    -- Act
    local battleState = BattleStateManager.createBattleState(battleId, battleSeed, playerParty, enemyParty)
    
    -- Assert
    assert(battleState.activePlayer[1] ~= nil, "Player should have active Pokemon in position 1")
    assert(battleState.activeEnemy[1] ~= nil, "Enemy should have active Pokemon in position 1")
    assert(battleState.activePlayer[1] == "player_1", "First player Pokemon should be active")
    assert(battleState.activeEnemy[1] == "player_1", "First enemy Pokemon should be active")
    
    print("✓ Active Pokemon initialization test passed")
end

-- Test Pokemon Finding
function BattleStateManagerTests.testFindPokemonById()
    -- Arrange
    local battleId = "test_battle_003"
    local battleSeed = 12345
    local playerParty = createTestParty()
    local enemyParty = createTestParty()
    local battleState = BattleStateManager.createBattleState(battleId, battleSeed, playerParty, enemyParty)
    
    -- Act & Assert
    local foundPokemon = BattleStateManager.findPokemonById(battleState, "player_1", "player")
    assert(foundPokemon ~= nil, "Should find player Pokemon by ID")
    assert(foundPokemon.name == "Pikachu", "Should return correct Pokemon")
    
    local notFound = BattleStateManager.findPokemonById(battleState, "nonexistent", "player")
    assert(notFound == nil, "Should return nil for nonexistent Pokemon")
    
    print("✓ Find Pokemon by ID test passed")
end

-- Test Get Active Pokemon
function BattleStateManagerTests.testGetActivePokemon()
    -- Arrange
    local battleId = "test_battle_004"
    local battleSeed = 12345
    local playerParty = createTestParty()
    local enemyParty = createTestParty()
    local battleState = BattleStateManager.createBattleState(battleId, battleSeed, playerParty, enemyParty)
    
    -- Act
    local activePokemon = BattleStateManager.getActivePokemon(battleState, "player", 1)
    
    -- Assert
    assert(activePokemon ~= nil, "Should return active Pokemon")
    assert(activePokemon.id == "player_1", "Should return correct active Pokemon")
    assert(activePokemon.name == "Pikachu", "Should return correct Pokemon name")
    
    print("✓ Get active Pokemon test passed")
end

-- Test Battle Phase Updates
function BattleStateManagerTests.testUpdateBattlePhase()
    -- Arrange
    local battleId = "test_battle_005"
    local battleSeed = 12345
    local playerParty = createTestParty()
    local enemyParty = createTestParty()
    local battleState = BattleStateManager.createBattleState(battleId, battleSeed, playerParty, enemyParty)
    
    -- Act & Assert
    local success, message = BattleStateManager.updateBattlePhase(battleState, BattleStateManager.BattlePhase.EXECUTING_TURN)
    assert(success == true, "Phase update should succeed")
    assert(battleState.phase == BattleStateManager.BattlePhase.EXECUTING_TURN, "Phase should be updated")
    
    -- Test invalid phase
    local failureSuccess, failureMessage = BattleStateManager.updateBattlePhase(battleState, 999)
    assert(failureSuccess == false, "Invalid phase update should fail")
    
    print("✓ Battle phase update test passed")
end

-- Test Pokemon Status Persistence
function BattleStateManagerTests.testPersistPokemonStatus()
    -- Arrange
    local battleId = "test_battle_006"
    local battleSeed = 12345
    local playerParty = createTestParty()
    local enemyParty = createTestParty()
    local battleState = BattleStateManager.createBattleState(battleId, battleSeed, playerParty, enemyParty)
    
    local statusUpdate = {
        status = "burn",
        currentHP = 75,
        statStages = {atk = -1, def = 1}
    }
    
    -- Act
    local success, message = BattleStateManager.persistPokemonStatus(battleState, "player_1", statusUpdate)
    
    -- Assert
    assert(success == true, "Status persistence should succeed")
    local pokemon = BattleStateManager.findPokemonById(battleState, "player_1", "player")
    assert(pokemon.status == "burn", "Status should be persisted")
    assert(pokemon.currentHP == 75, "HP should be persisted")
    assert(pokemon.battleData.statStages.atk == -1, "Stat stages should be persisted")
    assert(pokemon.battleData.statStages.def == 1, "Stat stages should be persisted")
    
    print("✓ Pokemon status persistence test passed")
end

-- Test Battle State Serialization
function BattleStateManagerTests.testSerializeBattleState()
    -- Arrange
    local battleId = "test_battle_007"
    local battleSeed = 12345
    local playerParty = createTestParty()
    local enemyParty = createTestParty()
    local battleState = BattleStateManager.createBattleState(battleId, battleSeed, playerParty, enemyParty)
    
    -- Act
    local serializedState, error = BattleStateManager.serializeBattleState(battleState)
    
    -- Assert
    assert(serializedState ~= nil, "Should serialize battle state")
    assert(error == nil, "Should not return error on valid serialization")
    assert(serializedState.battleId == battleId, "Serialized battle ID should match")
    assert(serializedState.battleSeed == battleSeed, "Serialized battle seed should match")
    assert(#serializedState.playerParty == 3, "Serialized player party should have 3 Pokemon")
    assert(serializedState.version ~= nil, "Should include version information")
    
    print("✓ Battle state serialization test passed")
end

-- Test Battle State Deserialization
function BattleStateManagerTests.testDeserializeBattleState()
    -- Arrange
    local battleId = "test_battle_008"
    local battleSeed = 12345
    local playerParty = createTestParty()
    local enemyParty = createTestParty()
    local originalState = BattleStateManager.createBattleState(battleId, battleSeed, playerParty, enemyParty)
    local serializedState = BattleStateManager.serializeBattleState(originalState)
    
    -- Act
    local deserializedState, error = BattleStateManager.deserializeBattleState(serializedState)
    
    -- Assert
    assert(deserializedState ~= nil, "Should deserialize battle state")
    assert(error == nil, "Should not return error on valid deserialization")
    assert(deserializedState.battleId == battleId, "Deserialized battle ID should match")
    assert(deserializedState.battleSeed == battleSeed, "Deserialized battle seed should match")
    assert(#deserializedState.playerParty == 3, "Deserialized player party should have 3 Pokemon")
    
    print("✓ Battle state deserialization test passed")
end

-- Test Battle State Validation
function BattleStateManagerTests.testValidateBattleState()
    -- Arrange - Valid battle state
    local battleId = "test_battle_009"
    local battleSeed = 12345
    local playerParty = createTestParty()
    local enemyParty = createTestParty()
    local validState = BattleStateManager.createBattleState(battleId, battleSeed, playerParty, enemyParty)
    
    -- Act & Assert - Valid state
    local isValid, message = BattleStateManager.validateBattleState(validState)
    assert(isValid == true, "Valid battle state should pass validation")
    
    -- Test invalid state (missing battle ID)
    local invalidState = {playerParty = {}, enemyParty = {}}
    local isInvalid, errorMessage = BattleStateManager.validateBattleState(invalidState)
    assert(isInvalid == false, "Invalid battle state should fail validation")
    assert(errorMessage ~= nil, "Should provide error message for invalid state")
    
    print("✓ Battle state validation test passed")
end

-- Test Double Battle Initialization
function BattleStateManagerTests.testDoubleBattleInitialization()
    -- Arrange
    local battleId = "test_double_battle_001"
    local battleSeed = 12345
    local playerParty = createTestParty()
    local enemyParty = createTestParty()
    
    -- Act
    local battleState = BattleStateManager.createBattleState(battleId, battleSeed, playerParty, enemyParty, BattleStateManager.BattleType.DOUBLE)
    
    -- Assert
    assert(battleState.battleType == BattleStateManager.BattleType.DOUBLE, "Battle type should be DOUBLE")
    -- In double battles, two Pokemon should be active if available
    assert(battleState.activePlayer[1] ~= nil, "Player should have first active Pokemon")
    assert(battleState.activePlayer[2] ~= nil, "Player should have second active Pokemon")
    assert(battleState.activeEnemy[1] ~= nil, "Enemy should have first active Pokemon")
    assert(battleState.activeEnemy[2] ~= nil, "Enemy should have second active Pokemon")
    
    print("✓ Double battle initialization test passed")
end

-- Test Party Initialization with Battle Data
function BattleStateManagerTests.testPartyInitializationWithBattleData()
    -- Arrange
    local battleId = "test_battle_010"
    local battleSeed = 12345
    local playerParty = createTestParty()
    local enemyParty = createTestParty()
    
    -- Act
    local battleState = BattleStateManager.createBattleState(battleId, battleSeed, playerParty, enemyParty)
    
    -- Assert
    local firstPokemon = battleState.playerParty[1]
    assert(firstPokemon.battleData ~= nil, "Pokemon should have battle data")
    assert(firstPokemon.battleData.side == "player", "Pokemon should have correct side")
    assert(firstPokemon.battleData.partyIndex == 1, "Pokemon should have correct party index")
    assert(firstPokemon.battleData.statStages ~= nil, "Pokemon should have stat stages")
    assert(firstPokemon.participated == true, "Active Pokemon should be marked as participated initially")
    
    print("✓ Party initialization with battle data test passed")
end

-- Run all tests
function BattleStateManagerTests.runAllTests()
    print("Running Battle State Manager Unit Tests...")
    
    BattleStateManagerTests.testCreateBattleState()
    BattleStateManagerTests.testInitializeActivePokemon()
    BattleStateManagerTests.testFindPokemonById()
    BattleStateManagerTests.testGetActivePokemon()
    BattleStateManagerTests.testUpdateBattlePhase()
    BattleStateManagerTests.testPersistPokemonStatus()
    BattleStateManagerTests.testSerializeBattleState()
    BattleStateManagerTests.testDeserializeBattleState()
    BattleStateManagerTests.testValidateBattleState()
    BattleStateManagerTests.testDoubleBattleInitialization()
    BattleStateManagerTests.testPartyInitializationWithBattleData()
    
    print("✅ All Battle State Manager tests passed!")
    return true
end

-- Execute tests if run directly
if not pcall(debug.getlocal, 4, 1) then
    BattleStateManagerTests.runAllTests()
end

return BattleStateManagerTests