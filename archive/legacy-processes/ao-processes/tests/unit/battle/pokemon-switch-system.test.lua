-- Pokemon Switch System Unit Tests
-- Tests for switch validation, execution, and forced switch scenarios
-- Follows AAA pattern with comprehensive edge case coverage

local PokemonSwitchSystem = require("game-logic.battle.pokemon-switch-system")
local BattleStateManager = require("game-logic.battle.battle-state-manager")
local BattleRNG = require("game-logic.rng.battle-rng")

local PokemonSwitchSystemTests = {}

-- Test fixtures
local function createTestPokemon(id, name, hp, fainted)
    return {
        id = id,
        name = name or "TestMon",
        species = 1,
        level = 50,
        stats = {hp = hp or 100, attack = 100, defense = 100, spatk = 100, spdef = 100, speed = 100},
        currentHP = fainted and 0 or (hp or 100),
        maxHP = hp or 100,
        status = nil,
        fainted = fainted or false,
        moves = {[1] = {id = 1, pp = 10}},
        ability = 1,
        battleData = {
            side = "player",
            statStages = {atk = 0, def = 0, spa = 0, spd = 0, spe = 0, accuracy = 0, evasion = 0}
        }
    }
end

local function createTestBattleState()
    local playerParty = {
        createTestPokemon("player_1", "Pikachu", 100),
        createTestPokemon("player_2", "Charizard", 120),
        createTestPokemon("player_3", "Blastoise", 110),
        createTestPokemon("player_4", "Venusaur", 0, true) -- Fainted
    }
    
    local enemyParty = {
        createTestPokemon("enemy_1", "Gyarados", 130),
        createTestPokemon("enemy_2", "Alakazam", 90)
    }
    
    for _, pokemon in ipairs(enemyParty) do
        pokemon.battleData.side = "enemy"
    end
    
    local battleState = BattleStateManager.createBattleState("test_battle", 12345, playerParty, enemyParty)
    
    -- Initialize battle RNG for tests
    BattleRNG.initBattle("test_battle", 12345)
    
    return battleState
end

-- Test Switch System Initialization
function PokemonSwitchSystemTests.testInitialization()
    -- Arrange & Act
    local success, message = PokemonSwitchSystem.init()
    
    -- Assert
    assert(success == true, "Switch system should initialize successfully")
    assert(message ~= nil, "Should return initialization message")
    
    print("✓ Switch system initialization test passed")
end

-- Test Valid Switch Validation
function PokemonSwitchSystemTests.testValidSwitchValidation()
    -- Arrange
    local battleState = createTestBattleState()
    
    -- Act
    local validation = PokemonSwitchSystem.validateSwitch(
        battleState, 
        "player", 
        "player_1", 
        "player_2", 
        1, 
        PokemonSwitchSystem.SwitchType.VOLUNTARY
    )
    
    -- Assert
    assert(validation.valid == true, "Valid switch should pass validation")
    assert(validation.currentPokemon ~= nil, "Should return current Pokemon")
    assert(validation.targetPokemon ~= nil, "Should return target Pokemon")
    assert(validation.currentPokemon.id == "player_1", "Current Pokemon should match")
    assert(validation.targetPokemon.id == "player_2", "Target Pokemon should match")
    
    print("✓ Valid switch validation test passed")
end

-- Test Switch to Fainted Pokemon
function PokemonSwitchSystemTests.testSwitchToFaintedPokemon()
    -- Arrange
    local battleState = createTestBattleState()
    
    -- Act
    local validation = PokemonSwitchSystem.validateSwitch(
        battleState, 
        "player", 
        "player_1", 
        "player_4", -- Fainted Pokemon
        1, 
        PokemonSwitchSystem.SwitchType.VOLUNTARY
    )
    
    -- Assert
    assert(validation.valid == false, "Switch to fainted Pokemon should fail validation")
    assert(validation.error == PokemonSwitchSystem.ValidationError.FAINTED_POKEMON, "Should return correct error code")
    assert(validation.message ~= nil, "Should provide error message")
    
    print("✓ Switch to fainted Pokemon test passed")
end

-- Test Switch to Same Pokemon
function PokemonSwitchSystemTests.testSwitchToSamePokemon()
    -- Arrange
    local battleState = createTestBattleState()
    
    -- Act
    local validation = PokemonSwitchSystem.validateSwitch(
        battleState, 
        "player", 
        "player_1", 
        "player_1", -- Same Pokemon
        1, 
        PokemonSwitchSystem.SwitchType.VOLUNTARY
    )
    
    -- Assert
    assert(validation.valid == false, "Switch to same Pokemon should fail validation")
    assert(validation.error == PokemonSwitchSystem.ValidationError.SAME_POKEMON, "Should return correct error code")
    
    print("✓ Switch to same Pokemon test passed")
end

-- Test Switch to Nonexistent Pokemon
function PokemonSwitchSystemTests.testSwitchToNonexistentPokemon()
    -- Arrange
    local battleState = createTestBattleState()
    
    -- Act
    local validation = PokemonSwitchSystem.validateSwitch(
        battleState, 
        "player", 
        "player_1", 
        "nonexistent", 
        1, 
        PokemonSwitchSystem.SwitchType.VOLUNTARY
    )
    
    -- Assert
    assert(validation.valid == false, "Switch to nonexistent Pokemon should fail validation")
    assert(validation.error == PokemonSwitchSystem.ValidationError.INVALID_POKEMON, "Should return correct error code")
    
    print("✓ Switch to nonexistent Pokemon test passed")
end

-- Test Successful Switch Execution
function PokemonSwitchSystemTests.testSuccessfulSwitchExecution()
    -- Arrange
    local battleState = createTestBattleState()
    
    -- Act
    local result = PokemonSwitchSystem.executeSwitch(
        battleState, 
        "player", 
        "player_1", 
        "player_2", 
        1, 
        PokemonSwitchSystem.SwitchType.VOLUNTARY
    )
    
    -- Assert
    assert(result.success == true, "Switch execution should succeed")
    assert(result.switchType == PokemonSwitchSystem.SwitchType.VOLUNTARY, "Should record correct switch type")
    assert(result.currentPokemon ~= nil, "Should include current Pokemon data")
    assert(result.targetPokemon ~= nil, "Should include target Pokemon data")
    assert(result.messages ~= nil, "Should include switch messages")
    assert(#result.messages > 0, "Should have at least one message")
    assert(battleState.activePlayer[1] == "player_2", "Active Pokemon should be updated")
    
    print("✓ Successful switch execution test passed")
end

-- Test Get Available Switch Targets
function PokemonSwitchSystemTests.testGetAvailableSwitchTargets()
    -- Arrange
    local battleState = createTestBattleState()
    
    -- Act
    local available = PokemonSwitchSystem.getAvailableSwitchTargets(battleState, "player")
    
    -- Assert
    assert(available ~= nil, "Should return available Pokemon list")
    assert(#available == 2, "Should have 2 available Pokemon (excluding active and fainted)")
    
    -- Check that available Pokemon are not the active one and not fainted
    local foundActive = false
    local foundFainted = false
    for _, pokemon in ipairs(available) do
        if pokemon.id == battleState.activePlayer[1] then
            foundActive = true
        end
        if pokemon.fainted or pokemon.currentHP <= 0 then
            foundFainted = true
        end
    end
    
    assert(foundActive == false, "Available list should not include active Pokemon")
    assert(foundFainted == false, "Available list should not include fainted Pokemon")
    
    print("✓ Get available switch targets test passed")
end

-- Test Forced Switch Handling
function PokemonSwitchSystemTests.testForcedSwitchHandling()
    -- Arrange
    local battleState = createTestBattleState()
    
    -- Act
    local result = PokemonSwitchSystem.handleForcedSwitch(
        battleState, 
        "player", 
        "player_1", 
        1, 
        "move_effect"
    )
    
    -- Assert
    assert(result.forced == true, "Should be marked as forced switch")
    assert(result.reason == "move_effect", "Should record correct reason")
    assert(result.success == true, "Forced switch should succeed with available Pokemon")
    assert(result.targetPokemon ~= nil, "Should have selected a target Pokemon")
    assert(result.messages ~= nil, "Should include forced switch messages")
    
    print("✓ Forced switch handling test passed")
end

-- Test Forced Switch with No Available Pokemon
function PokemonSwitchSystemTests.testForcedSwitchNoAvailable()
    -- Arrange
    local battleState = createTestBattleState()
    -- Faint all non-active Pokemon
    for _, pokemon in ipairs(battleState.playerParty) do
        if pokemon.id ~= "player_1" then
            pokemon.currentHP = 0
            pokemon.fainted = true
        end
    end
    
    -- Act
    local result = PokemonSwitchSystem.handleForcedSwitch(
        battleState, 
        "player", 
        "player_1", 
        1, 
        "move_effect"
    )
    
    -- Assert
    assert(result.success == false, "Forced switch should fail with no available Pokemon")
    assert(result.error == PokemonSwitchSystem.ValidationError.NO_AVAILABLE_POKEMON, "Should return correct error")
    
    print("✓ Forced switch with no available Pokemon test passed")
end

-- Test Emergency Switch Handling
function PokemonSwitchSystemTests.testEmergencySwitchHandling()
    -- Arrange
    local battleState = createTestBattleState()
    
    -- Act
    local result = PokemonSwitchSystem.handleEmergencySwitch(battleState, "player")
    
    -- Assert
    assert(result.emergency == true, "Should be marked as emergency switch")
    assert(result.success == true, "Emergency switch should succeed")
    assert(#result.switches > 0, "Should have performed at least one switch")
    assert(result.messages ~= nil, "Should include emergency switch messages")
    
    print("✓ Emergency switch handling test passed")
end

-- Test Double Battle Position Validation
function PokemonSwitchSystemTests.testDoubleBattlePositionValidation()
    -- Arrange
    local battleState = createTestBattleState()
    battleState.battleType = BattleStateManager.BattleType.DOUBLE
    battleState.activePlayer[2] = "player_2" -- Second active Pokemon
    
    -- Act - Try to switch to Pokemon already active in position 2
    local validation = PokemonSwitchSystem.validateDoublePosition(battleState, "player", 1, "player_2")
    
    -- Assert
    assert(validation.valid == false, "Should fail validation for Pokemon already active")
    assert(validation.error == PokemonSwitchSystem.ValidationError.POSITION_OCCUPIED, "Should return position occupied error")
    
    -- Test valid position
    local validValidation = PokemonSwitchSystem.validateDoublePosition(battleState, "player", 1, "player_3")
    assert(validValidation.valid == true, "Should pass validation for available Pokemon")
    
    print("✓ Double battle position validation test passed")
end

-- Test Switch Message Generation
function PokemonSwitchSystemTests.testSwitchMessageGeneration()
    -- Arrange
    local currentPokemon = createTestPokemon("current", "Pikachu")
    local targetPokemon = createTestPokemon("target", "Charizard")
    
    -- Act - Voluntary switch
    local voluntaryMessages = PokemonSwitchSystem.generateSwitchMessages(
        currentPokemon, 
        targetPokemon, 
        PokemonSwitchSystem.SwitchType.VOLUNTARY
    )
    
    -- Assert
    assert(voluntaryMessages ~= nil, "Should generate voluntary switch messages")
    assert(#voluntaryMessages >= 2, "Should have at least 2 messages for voluntary switch")
    
    -- Act - Forced switch
    local forcedMessages = PokemonSwitchSystem.generateSwitchMessages(
        currentPokemon, 
        targetPokemon, 
        PokemonSwitchSystem.SwitchType.FORCED
    )
    
    -- Assert
    assert(forcedMessages ~= nil, "Should generate forced switch messages")
    assert(#forcedMessages >= 1, "Should have at least 1 message for forced switch")
    
    print("✓ Switch message generation test passed")
end

-- Test Trapping Effects Check
function PokemonSwitchSystemTests.testTrappingEffectsCheck()
    -- Arrange
    local pokemon = createTestPokemon("trapped", "Pikachu")
    
    -- Act - No trapping effects
    local result = PokemonSwitchSystem.checkTrappingEffects({}, pokemon)
    
    -- Assert
    assert(result.trapped == false, "Pokemon should not be trapped by default")
    assert(#result.effects == 0, "Should have no trapping effects")
    
    -- Arrange - Add trapping effect
    pokemon.battleData.trapped = true
    pokemon.battleData.trapSource = "Arena Trap"
    
    -- Act - With trapping effects
    local trappedResult = PokemonSwitchSystem.checkTrappingEffects({}, pokemon)
    
    -- Assert
    assert(trappedResult.trapped == true, "Pokemon should be trapped")
    assert(#trappedResult.effects > 0, "Should have trapping effects")
    assert(trappedResult.message ~= nil, "Should have trapping message")
    
    print("✓ Trapping effects check test passed")
end

-- Run all tests
function PokemonSwitchSystemTests.runAllTests()
    print("Running Pokemon Switch System Unit Tests...")
    
    PokemonSwitchSystemTests.testInitialization()
    PokemonSwitchSystemTests.testValidSwitchValidation()
    PokemonSwitchSystemTests.testSwitchToFaintedPokemon()
    PokemonSwitchSystemTests.testSwitchToSamePokemon()
    PokemonSwitchSystemTests.testSwitchToNonexistentPokemon()
    PokemonSwitchSystemTests.testSuccessfulSwitchExecution()
    PokemonSwitchSystemTests.testGetAvailableSwitchTargets()
    PokemonSwitchSystemTests.testForcedSwitchHandling()
    PokemonSwitchSystemTests.testForcedSwitchNoAvailable()
    PokemonSwitchSystemTests.testEmergencySwitchHandling()
    PokemonSwitchSystemTests.testDoubleBattlePositionValidation()
    PokemonSwitchSystemTests.testSwitchMessageGeneration()
    PokemonSwitchSystemTests.testTrappingEffectsCheck()
    
    print("✅ All Pokemon Switch System tests passed!")
    return true
end

-- Execute tests if run directly
if not pcall(debug.getlocal, 4, 1) then
    PokemonSwitchSystemTests.runAllTests()
end

return PokemonSwitchSystemTests