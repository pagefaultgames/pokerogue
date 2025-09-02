-- Unit Tests for Move Targeting System
-- Comprehensive test coverage for targeting system validation and resolution
-- AAA pattern (Arrange, Act, Assert) with 100% coverage requirement

local MoveTargeting = require("game-logic.battle.move-targeting")
local PositionalMechanics = require("game-logic.battle.positional-mechanics")
local Enums = require("data.constants.enums")

local MoveTargetingTests = {}

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
local function createMockBattleState(format)
    local battleState = {
        battleId = "test-battle-001",
        turn = 1,
        playerParty = {},
        enemyParty = {}
    }
    
    if format == "double" then
        PositionalMechanics.initializePositionalState(battleState, 2, 2)
    else
        PositionalMechanics.initializePositionalState(battleState, 1, 1)
    end
    
    return battleState
end

local function createMockPokemon(id, name, level, types)
    return {
        id = id or 1,
        name = name or "TestPokemon",
        level = level or 50,
        types = types or {Enums.PokemonType.NORMAL},
        fainted = false,
        battleData = {}
    }
end

local function createMockMove(name, category, targetType, power, options)
    local move = {
        name = name or "TestMove",
        category = category or Enums.MoveCategory.PHYSICAL,
        type = Enums.PokemonType.NORMAL,
        power = power or 80,
        target = targetType or "single_opponent"
    }
    
    if options then
        for key, value in pairs(options) do
            move[key] = value
        end
    end
    
    return move
end

-- Test 1: Move Targeting Type Detection
function MoveTargetingTests.testMoveTargetingTypeDetection()
    -- Arrange & Act & Assert
    
    -- Single opponent move (default)
    local singleMove = createMockMove("Tackle", Enums.MoveCategory.PHYSICAL, "single_opponent")
    local targetingType, info = MoveTargeting.getMoveTargetingType(singleMove)
    assertEqual(targetingType, MoveTargeting.TargetingType.SINGLE_OPPONENT, "Should detect single opponent targeting")
    assertTrue(info.requiresTarget, "Should require target selection")
    
    -- Self-targeting status move
    local selfMove = createMockMove("Swords Dance", Enums.MoveCategory.STATUS, "self")
    targetingType, info = MoveTargeting.getMoveTargetingType(selfMove)
    assertEqual(targetingType, MoveTargeting.TargetingType.SELF, "Should detect self targeting")
    assertFalse(info.requiresTarget, "Should not require target selection")
    
    -- All opponents move
    local allOpponentsMove = createMockMove("Earthquake", Enums.MoveCategory.PHYSICAL, "all_opponents")
    targetingType, info = MoveTargeting.getMoveTargetingType(allOpponentsMove)
    assertEqual(targetingType, MoveTargeting.TargetingType.ALL_OPPONENTS, "Should detect all opponents targeting")
    
    -- Ally targeting move
    local allyMove = createMockMove("Helping Hand", Enums.MoveCategory.STATUS, "ally")
    targetingType, info = MoveTargeting.getMoveTargetingType(allyMove)
    assertEqual(targetingType, MoveTargeting.TargetingType.SINGLE_ALLY, "Should detect ally targeting")
    assertTrue(info.requiresDoublesFormat, "Should require doubles format")
    
    -- Spread move
    local spreadMove = createMockMove("Rock Slide", Enums.MoveCategory.PHYSICAL, "all_opponents", 75, {isSpreadMove = true, damageReduction = 0.75})
    targetingType, info = MoveTargeting.getMoveTargetingType(spreadMove)
    assertEqual(targetingType, MoveTargeting.TargetingType.SPREAD, "Should detect spread targeting")
    assertEqual(info.damageReduction, 0.75, "Should have damage reduction")
end

-- Test 2: Single Opponent Targeting Validation
function MoveTargetingTests.testSingleOpponentTargeting()
    -- Arrange
    local battleState = createMockBattleState("double")
    
    local playerPokemon = createMockPokemon(1, "Pikachu", 50)
    local enemyPokemon = createMockPokemon(2, "Charizard", 50)
    
    battleState.playerParty = {playerPokemon}
    battleState.enemyParty = {enemyPokemon}
    
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon, "player", 1)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon, "enemy", 1)
    
    local move = createMockMove("Tackle", Enums.MoveCategory.PHYSICAL, "single_opponent")
    
    -- Act & Assert - Valid opponent target
    local validation, message = MoveTargeting.validateMoveTargeting(battleState, playerPokemon, move, enemyPokemon)
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Should validate opponent target")
    
    -- Invalid ally target for opponent move
    validation, message = MoveTargeting.validateMoveTargeting(battleState, playerPokemon, move, playerPokemon)
    assertEqual(validation, MoveTargeting.ValidationResult.INVALID_TARGET, "Should reject self as opponent target")
    
    -- Missing target
    validation, message = MoveTargeting.validateMoveTargeting(battleState, playerPokemon, move, nil)
    assertEqual(validation, MoveTargeting.ValidationResult.INVALID_TARGET, "Should require target Pokemon")
end

-- Test 3: Ally Targeting Validation
function MoveTargetingTests.testAllyTargeting()
    -- Arrange
    local doubleBattleState = createMockBattleState("double")
    local singleBattleState = createMockBattleState("single")
    
    local playerPokemon1 = createMockPokemon(1, "Pikachu", 50)
    local playerPokemon2 = createMockPokemon(2, "Raichu", 50)
    local enemyPokemon = createMockPokemon(3, "Charizard", 50)
    
    doubleBattleState.playerParty = {playerPokemon1, playerPokemon2}
    doubleBattleState.enemyParty = {enemyPokemon}
    singleBattleState.playerParty = {playerPokemon1}
    
    PositionalMechanics.assignPokemonPosition(doubleBattleState, playerPokemon1, "player", 1)
    PositionalMechanics.assignPokemonPosition(doubleBattleState, playerPokemon2, "player", 2)
    PositionalMechanics.assignPokemonPosition(doubleBattleState, enemyPokemon, "enemy", 1)
    PositionalMechanics.assignPokemonPosition(singleBattleState, playerPokemon1, "player", 1)
    
    local allyMove = createMockMove("Helping Hand", Enums.MoveCategory.STATUS, "ally")
    
    -- Act & Assert - Valid ally target in doubles
    local validation, message = MoveTargeting.validateMoveTargeting(doubleBattleState, playerPokemon1, allyMove, playerPokemon2)
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Should validate ally target in doubles")
    
    -- Invalid in single battle
    validation, message = MoveTargeting.validateMoveTargeting(singleBattleState, playerPokemon1, allyMove, playerPokemon1)
    assertEqual(validation, MoveTargeting.ValidationResult.ALLY_TARGETING_BLOCKED, "Should block ally targeting in singles")
    
    -- Invalid enemy target for ally move
    validation, message = MoveTargeting.validateMoveTargeting(doubleBattleState, playerPokemon1, allyMove, enemyPokemon)
    assertEqual(validation, MoveTargeting.ValidationResult.INVALID_TARGET, "Should reject enemy as ally target")
end

-- Test 4: Self Targeting Validation
function MoveTargetingTests.testSelfTargeting()
    -- Arrange
    local battleState = createMockBattleState("single")
    local pokemon = createMockPokemon(1, "Pikachu", 50)
    
    battleState.playerParty = {pokemon}
    PositionalMechanics.assignPokemonPosition(battleState, pokemon, "player", 1)
    
    local selfMove = createMockMove("Swords Dance", Enums.MoveCategory.STATUS, "self")
    
    -- Act & Assert
    local validation, message = MoveTargeting.validateMoveTargeting(battleState, pokemon, selfMove, nil)
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Self-targeting moves should not need target validation")
end

-- Test 5: Multi-target Validation
function MoveTargetingTests.testMultiTargetValidation()
    -- Arrange
    local battleState = createMockBattleState("double")
    
    local playerPokemon = createMockPokemon(1, "Pikachu", 50)
    local enemyPokemon1 = createMockPokemon(2, "Charizard", 50)
    local enemyPokemon2 = createMockPokemon(3, "Blastoise", 50)
    
    battleState.playerParty = {playerPokemon}
    battleState.enemyParty = {enemyPokemon1, enemyPokemon2}
    
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon, "player", 1)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon1, "enemy", 1)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon2, "enemy", 2)
    
    local multiMove = createMockMove("Earthquake", Enums.MoveCategory.PHYSICAL, "all_opponents")
    
    -- Act & Assert
    local validation, message = MoveTargeting.validateMoveTargeting(battleState, playerPokemon, multiMove, nil)
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Multi-target moves should validate with available targets")
    
    -- Test with no available targets
    enemyPokemon1.fainted = true
    enemyPokemon2.fainted = true
    validation, message = MoveTargeting.validateMoveTargeting(battleState, playerPokemon, multiMove, nil)
    assertEqual(validation, MoveTargeting.ValidationResult.NO_VALID_TARGETS, "Should fail with no valid targets")
end

-- Test 6: Position-Dependent Targeting
function MoveTargetingTests.testPositionDependentTargeting()
    -- Arrange
    local doubleBattleState = createMockBattleState("double")
    local singleBattleState = createMockBattleState("single")
    
    local playerPokemon = createMockPokemon(1, "Pikachu", 50)
    local enemyPokemon = createMockPokemon(2, "Charizard", 50)
    
    doubleBattleState.playerParty = {playerPokemon}
    doubleBattleState.enemyParty = {enemyPokemon}
    singleBattleState.playerParty = {playerPokemon}
    
    PositionalMechanics.assignPokemonPosition(doubleBattleState, playerPokemon, "player", 1)
    PositionalMechanics.assignPokemonPosition(doubleBattleState, enemyPokemon, "enemy", 1)
    PositionalMechanics.assignPokemonPosition(singleBattleState, playerPokemon, "player", 1)
    
    local positionMove = createMockMove("PositionMove", Enums.MoveCategory.PHYSICAL, "single_opponent", 80, {doublesOnly = true})
    
    -- Act & Assert - Valid in doubles with position
    local validation, message = MoveTargeting.validateMoveTargeting(doubleBattleState, playerPokemon, positionMove, nil, 1)
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Should validate position-dependent move in doubles")
    
    -- Invalid in singles
    validation, message = MoveTargeting.validateMoveTargeting(singleBattleState, playerPokemon, positionMove, nil, 1)
    assertEqual(validation, MoveTargeting.ValidationResult.INVALID_FORMAT, "Should reject position-dependent move in singles")
    
    -- Missing position
    validation, message = MoveTargeting.validateMoveTargeting(doubleBattleState, playerPokemon, positionMove, nil, nil)
    assertEqual(validation, MoveTargeting.ValidationResult.POSITION_REQUIRED, "Should require target position")
    
    -- No Pokemon at position
    validation, message = MoveTargeting.validateMoveTargeting(doubleBattleState, playerPokemon, positionMove, nil, 2)
    assertEqual(validation, MoveTargeting.ValidationResult.NO_VALID_TARGETS, "Should fail with no Pokemon at position")
end

-- Test 7: Spread Move Validation
function MoveTargetingTests.testSpreadMoveValidation()
    -- Arrange
    local battleState = createMockBattleState("double")
    
    local playerPokemon = createMockPokemon(1, "Pikachu", 50)
    local enemyPokemon1 = createMockPokemon(2, "Charizard", 50)
    local enemyPokemon2 = createMockPokemon(3, "Blastoise", 50)
    
    battleState.playerParty = {playerPokemon}
    battleState.enemyParty = {enemyPokemon1, enemyPokemon2}
    
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon, "player", 1)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon1, "enemy", 1)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon2, "enemy", 2)
    
    local spreadMove = createMockMove("Rock Slide", Enums.MoveCategory.PHYSICAL, "all_opponents", 75, {isSpreadMove = true})
    
    -- Act & Assert
    local validation, message = MoveTargeting.validateMoveTargeting(battleState, playerPokemon, spreadMove, nil)
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Spread moves should validate with available targets")
end

-- Test 8: Get Available Targets
function MoveTargetingTests.testGetAvailableTargets()
    -- Arrange
    local battleState = createMockBattleState("double")
    
    local playerPokemon1 = createMockPokemon(1, "Pikachu", 50)
    local playerPokemon2 = createMockPokemon(2, "Raichu", 50)
    local enemyPokemon1 = createMockPokemon(3, "Charizard", 50)
    local enemyPokemon2 = createMockPokemon(4, "Blastoise", 50)
    
    battleState.playerParty = {playerPokemon1, playerPokemon2}
    battleState.enemyParty = {enemyPokemon1, enemyPokemon2}
    
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon1, "player", 1)
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon2, "player", 2)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon1, "enemy", 1)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon2, "enemy", 2)
    
    -- Act & Assert - Single opponent targets
    local opponentTargets = MoveTargeting.getAvailableTargets(battleState, playerPokemon1, MoveTargeting.TargetingType.SINGLE_OPPONENT)
    assertEqual(#opponentTargets, 2, "Should have 2 opponent targets")
    assertEqual(opponentTargets[1].relationship, "opponent", "Should be opponent relationship")
    
    -- Ally targets
    local allyTargets = MoveTargeting.getAvailableTargets(battleState, playerPokemon1, MoveTargeting.TargetingType.SINGLE_ALLY)
    assertEqual(#allyTargets, 1, "Should have 1 ally target (excluding self)")
    assertEqual(allyTargets[1].pokemon.id, playerPokemon2.id, "Should target the other player Pokemon")
    assertEqual(allyTargets[1].relationship, "ally", "Should be ally relationship")
    
    -- Self targets
    local selfTargets = MoveTargeting.getAvailableTargets(battleState, playerPokemon1, MoveTargeting.TargetingType.SELF)
    assertEqual(#selfTargets, 1, "Should have 1 self target")
    assertEqual(selfTargets[1].pokemon.id, playerPokemon1.id, "Should target self")
    assertEqual(selfTargets[1].relationship, "self", "Should be self relationship")
    
    -- All Pokemon targets
    local allTargets = MoveTargeting.getAvailableTargets(battleState, playerPokemon1, MoveTargeting.TargetingType.ALL_POKEMON)
    assertEqual(#allTargets, 4, "Should have 4 total targets")
end

-- Test 9: Resolve Move Targets
function MoveTargetingTests.testResolveTargets()
    -- Arrange
    local battleState = createMockBattleState("double")
    
    local playerPokemon = createMockPokemon(1, "Pikachu", 50)
    local enemyPokemon1 = createMockPokemon(2, "Charizard", 50)
    local enemyPokemon2 = createMockPokemon(3, "Blastoise", 50)
    
    battleState.playerParty = {playerPokemon}
    battleState.enemyParty = {enemyPokemon1, enemyPokemon2}
    
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon, "player", 1)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon1, "enemy", 1)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon2, "enemy", 2)
    
    -- Test single target resolution
    local singleMove = createMockMove("Tackle", Enums.MoveCategory.PHYSICAL, "single_opponent")
    local resolvedTargets = MoveTargeting.resolveTargets(battleState, playerPokemon, singleMove, enemyPokemon1)
    
    assertEqual(#resolvedTargets, 1, "Should resolve to 1 target")
    assertEqual(resolvedTargets[1].pokemon.id, enemyPokemon1.id, "Should target correct Pokemon")
    assertEqual(resolvedTargets[1].damageMultiplier, 1.0, "Should have full damage multiplier")
    assertEqual(resolvedTargets[1].targetType, "opponent", "Should have correct target type")
    
    -- Test spread move resolution
    local spreadMove = createMockMove("Rock Slide", Enums.MoveCategory.PHYSICAL, "all_opponents", 75, {isSpreadMove = true, damageReduction = 0.75})
    resolvedTargets = MoveTargeting.resolveTargets(battleState, playerPokemon, spreadMove)
    
    assertEqual(#resolvedTargets, 2, "Should resolve to 2 targets")
    assertEqual(resolvedTargets[1].damageMultiplier, 0.75, "Should have reduced damage multiplier")
    assertTrue(resolvedTargets[1].isSpreadTarget, "Should be marked as spread target")
    
    -- Test self-targeting resolution
    local selfMove = createMockMove("Swords Dance", Enums.MoveCategory.STATUS, "self")
    resolvedTargets = MoveTargeting.resolveTargets(battleState, playerPokemon, selfMove)
    
    assertEqual(#resolvedTargets, 1, "Should resolve to 1 target")
    assertEqual(resolvedTargets[1].pokemon.id, playerPokemon.id, "Should target self")
    assertEqual(resolvedTargets[1].targetType, "self", "Should have self target type")
end

-- Test 10: Targeting Summary
function MoveTargetingTests.testTargetingSummary()
    -- Arrange
    local battleState = createMockBattleState("double")
    
    local playerPokemon = createMockPokemon(1, "Pikachu", 50)
    local enemyPokemon = createMockPokemon(2, "Charizard", 50)
    
    battleState.playerParty = {playerPokemon}
    battleState.enemyParty = {enemyPokemon}
    
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon, "player", 1)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon, "enemy", 1)
    
    local singleMove = createMockMove("Tackle", Enums.MoveCategory.PHYSICAL, "single_opponent")
    local selfMove = createMockMove("Swords Dance", Enums.MoveCategory.STATUS, "self")
    
    -- Act & Assert - Single target move
    local summary = MoveTargeting.getTargetingSummary(battleState, playerPokemon, singleMove)
    assertEqual(summary.targeting_type, MoveTargeting.TargetingType.SINGLE_OPPONENT, "Should report correct targeting type")
    assertTrue(summary.requires_selection, "Should require target selection")
    assertTrue(summary.can_target_opponents, "Should allow opponent targeting")
    assertFalse(summary.can_target_allies, "Should not allow ally targeting")
    
    -- Self-targeting move
    summary = MoveTargeting.getTargetingSummary(battleState, playerPokemon, selfMove)
    assertEqual(summary.targeting_type, MoveTargeting.TargetingType.SELF, "Should report self targeting")
    assertFalse(summary.requires_selection, "Should not require target selection")
end

-- Test 11: Can Target Pokemon Check
function MoveTargetingTests.testCanTargetPokemon()
    -- Arrange
    local battleState = createMockBattleState("double")
    
    local playerPokemon = createMockPokemon(1, "Pikachu", 50)
    local enemyPokemon = createMockPokemon(2, "Charizard", 50)
    
    battleState.playerParty = {playerPokemon}
    battleState.enemyParty = {enemyPokemon}
    
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon, "player", 1)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon, "enemy", 1)
    
    local singleMove = createMockMove("Tackle", Enums.MoveCategory.PHYSICAL, "single_opponent")
    
    -- Act & Assert
    assertTrue(MoveTargeting.canTargetPokemon(battleState, playerPokemon, singleMove, enemyPokemon), "Should be able to target enemy")
    assertFalse(MoveTargeting.canTargetPokemon(battleState, playerPokemon, singleMove, playerPokemon), "Should not be able to target self with opponent move")
end

-- Test 12: Position Targeting Info
function MoveTargetingTests.testPositionTargetingInfo()
    -- Arrange
    local doubleBattleState = createMockBattleState("double")
    local singleBattleState = createMockBattleState("single")
    
    local playerPokemon = createMockPokemon(1, "Pikachu", 50)
    local enemyPokemon1 = createMockPokemon(2, "Charizard", 50)
    local enemyPokemon2 = createMockPokemon(3, "Blastoise", 50)
    
    doubleBattleState.playerParty = {playerPokemon}
    doubleBattleState.enemyParty = {enemyPokemon1, enemyPokemon2}
    singleBattleState.playerParty = {playerPokemon}
    
    PositionalMechanics.assignPokemonPosition(doubleBattleState, playerPokemon, "player", 1)
    PositionalMechanics.assignPokemonPosition(doubleBattleState, enemyPokemon1, "enemy", 1)
    PositionalMechanics.assignPokemonPosition(doubleBattleState, enemyPokemon2, "enemy", 2)
    PositionalMechanics.assignPokemonPosition(singleBattleState, playerPokemon, "player", 1)
    
    -- Act & Assert - Double battle
    local positionInfo = MoveTargeting.getPositionTargetingInfo(doubleBattleState, playerPokemon)
    assertTrue(positionInfo.supports_position_targeting, "Should support position targeting in doubles")
    assertEqual(#positionInfo.opponent_positions, 2, "Should have 2 opponent positions")
    assertEqual(#positionInfo.ally_positions, 2, "Should have 2 ally positions")
    
    assertTrue(positionInfo.opponent_positions[1].occupied, "Enemy position 1 should be occupied")
    assertTrue(positionInfo.opponent_positions[2].occupied, "Enemy position 2 should be occupied")
    assertTrue(positionInfo.ally_positions[1].occupied, "Player position 1 should be occupied")
    assertFalse(positionInfo.ally_positions[2].occupied, "Player position 2 should be empty")
    assertTrue(positionInfo.ally_positions[1].is_self, "Player position 1 should be self")
    
    -- Single battle
    positionInfo = MoveTargeting.getPositionTargetingInfo(singleBattleState, playerPokemon)
    assertFalse(positionInfo.supports_position_targeting, "Should not support position targeting in singles")
    assertEqual(#positionInfo.available_positions, 0, "Should have no available positions")
end

-- Test 13: Edge Cases and Error Conditions
function MoveTargetingTests.testEdgeCasesAndErrors()
    -- Test with nil/invalid parameters
    local result, message = MoveTargeting.validateMoveTargeting(nil, nil, nil, nil)
    assertEqual(result, MoveTargeting.ValidationResult.INVALID_TARGET, "Should handle nil parameters")
    
    -- Test with empty move data
    local targetingType, info = MoveTargeting.getMoveTargetingType(nil)
    assertEqual(targetingType, MoveTargeting.TargetingType.SINGLE_OPPONENT, "Should default to single opponent")
    
    -- Test targeting summary with invalid data
    local summary = MoveTargeting.getTargetingSummary(nil, nil, nil)
    assertEqual(summary.targeting_type, "unknown", "Should return unknown for invalid data")
    assertEqual(summary.available_targets, 0, "Should have 0 available targets")
    assertFalse(summary.requires_selection, "Should not require selection")
    
    -- Test resolve targets with invalid validation
    local battleState = createMockBattleState("single")
    local playerPokemon = createMockPokemon(1, "Pikachu", 50)
    local invalidMove = createMockMove("Invalid", Enums.MoveCategory.PHYSICAL, "ally") -- Ally move in singles
    
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon, "player", 1)
    
    local resolvedTargets = MoveTargeting.resolveTargets(battleState, playerPokemon, invalidMove)
    assertEqual(#resolvedTargets, 0, "Should return empty targets for invalid moves")
end

-- Test Runner
function MoveTargetingTests.runAllTests()
    local tests = {
        "testMoveTargetingTypeDetection",
        "testSingleOpponentTargeting",
        "testAllyTargeting",
        "testSelfTargeting",
        "testMultiTargetValidation",
        "testPositionDependentTargeting",
        "testSpreadMoveValidation",
        "testGetAvailableTargets",
        "testResolveTargets",
        "testTargetingSummary",
        "testCanTargetPokemon",
        "testPositionTargetingInfo",
        "testEdgeCasesAndErrors"
    }
    
    local passed = 0
    local failed = 0
    
    print("Running Move Targeting Unit Tests...")
    print("=" .. string.rep("=", 50))
    
    for _, testName in ipairs(tests) do
        local success, error = pcall(MoveTargetingTests[testName])
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
if arg and arg[0] and arg[0]:find("move%-targeting%.test%.lua$") then
    MoveTargetingTests.runAllTests()
end

return MoveTargetingTests