-- Integration Tests for Positional Mechanics System
-- Complete double battle workflow scenarios with position persistence
-- Multi-turn testing scenarios with targeting, spread moves, position swapping, and positional abilities

local PositionalMechanics = require("game-logic.battle.positional-mechanics")
local MoveTargeting = require("game-logic.battle.move-targeting")
local DamageCalculator = require("game-logic.battle.damage-calculator")
local BattleHandler = require("handlers.battle-handler")
local Enums = require("data.constants.enums")
local BattleRNG = require("game-logic.rng.battle-rng")

local PositionalIntegrationTests = {}

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

-- Test setup helpers
local function createTestBattle(playerCount, enemyCount)
    local battleState = {
        battleId = "integration-test-battle",
        turn = 1,
        battleSeed = "test-seed-123",
        playerParty = {},
        enemyParty = {},
        conditions = {},
        weather = nil
    }
    
    -- Initialize positional state
    PositionalMechanics.initializePositionalState(battleState, playerCount, enemyCount)
    
    return battleState
end

local function createTestPokemon(id, name, level, stats, types, moves)
    return {
        id = id,
        name = name or "TestPokemon",
        level = level or 50,
        stats = stats or {hp = 100, atk = 100, def = 100, spatk = 100, spdef = 100, spd = 100},
        currentHP = stats and stats.hp or 100,
        types = types or {Enums.PokemonType.NORMAL},
        moves = moves or {},
        fainted = false,
        abilities = {"TestAbility"},
        battleData = {
            statStages = {atk = 0, def = 0, spatk = 0, spdef = 0, spd = 0, acc = 0, eva = 0}
        }
    }
end

local function setupDoubleBattle()
    local battleState = createTestBattle(2, 2)
    
    -- Create test Pokemon
    local playerPokemon1 = createTestPokemon(1, "Pikachu", 50, {hp = 95, atk = 80, def = 65, spatk = 95, spdef = 70, spd = 90}, {Enums.PokemonType.ELECTRIC})
    local playerPokemon2 = createTestPokemon(2, "Charizard", 50, {hp = 108, atk = 104, def = 78, spatk = 129, spdef = 85, spd = 100}, {Enums.PokemonType.FIRE, Enums.PokemonType.FLYING})
    local enemyPokemon1 = createTestPokemon(3, "Blastoise", 50, {hp = 109, atk = 83, def = 100, spatk = 85, spdef = 105, spd = 78}, {Enums.PokemonType.WATER})
    local enemyPokemon2 = createTestPokemon(4, "Venusaur", 50, {hp = 110, atk = 82, def = 83, spatk = 100, spdef = 100, spd = 80}, {Enums.PokemonType.GRASS, Enums.PokemonType.POISON})
    
    battleState.playerParty = {playerPokemon1, playerPokemon2}
    battleState.enemyParty = {enemyPokemon1, enemyPokemon2}
    
    -- Initialize positions
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon1, "player", 1)
    PositionalMechanics.assignPokemonPosition(battleState, playerPokemon2, "player", 2)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon1, "enemy", 1)
    PositionalMechanics.assignPokemonPosition(battleState, enemyPokemon2, "enemy", 2)
    
    return battleState, playerPokemon1, playerPokemon2, enemyPokemon1, enemyPokemon2
end

-- Test 1: Complete Double Battle Setup Integration
function PositionalIntegrationTests.testDoubleBattleSetupIntegration()
    -- Arrange & Act
    local battleState, p1, p2, e1, e2 = setupDoubleBattle()
    
    -- Assert battle format detection
    local formatInfo = PositionalMechanics.getBattleFormatInfo(battleState)
    assertEqual(formatInfo.format, PositionalMechanics.BattleFormat.DOUBLE, "Should detect double battle format")
    assertTrue(formatInfo.supports_positioning, "Should support positional mechanics")
    assertEqual(formatInfo.max_active_per_side, 2, "Should allow 2 active per side")
    
    -- Assert position assignments
    assertEqual(p1.battleData.position, 1, "Player Pokemon 1 should be in position 1")
    assertEqual(p2.battleData.position, 2, "Player Pokemon 2 should be in position 2")
    assertEqual(e1.battleData.position, 1, "Enemy Pokemon 1 should be in position 1")
    assertEqual(e2.battleData.position, 2, "Enemy Pokemon 2 should be in position 2")
    
    assertEqual(p1.battleData.side, "player", "Player Pokemon should have correct side")
    assertEqual(e1.battleData.side, "enemy", "Enemy Pokemon should have correct side")
    
    -- Assert active positions
    local activePositions = PositionalMechanics.getAllActivePositions(battleState)
    assertEqual(activePositions.format, PositionalMechanics.BattleFormat.DOUBLE, "Active positions should reflect double format")
    assertTrue(activePositions.player[1] ~= nil, "Player position 1 should be active")
    assertTrue(activePositions.player[2] ~= nil, "Player position 2 should be active")
    assertTrue(activePositions.enemy[1] ~= nil, "Enemy position 1 should be active")
    assertTrue(activePositions.enemy[2] ~= nil, "Enemy position 2 should be active")
end

-- Test 2: Single Target Move Execution Integration
function PositionalIntegrationTests.testSingleTargetMoveExecution()
    -- Arrange
    local battleState, p1, p2, e1, e2 = setupDoubleBattle()
    BattleRNG.seed("single-target-test")
    
    local tackleMove = {
        name = "Tackle",
        type = Enums.PokemonType.NORMAL,
        category = Enums.MoveCategory.PHYSICAL,
        power = 40,
        target = "single_opponent"
    }
    
    -- Act - Validate targeting
    local validation, message = MoveTargeting.validateMoveTargeting(battleState, p1, tackleMove, e1)
    
    -- Assert targeting validation
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Should validate single target move")
    
    -- Act - Resolve targets
    local resolvedTargets = MoveTargeting.resolveTargets(battleState, p1, tackleMove, e1)
    
    -- Assert target resolution
    assertEqual(#resolvedTargets, 1, "Should resolve to exactly 1 target")
    assertEqual(resolvedTargets[1].pokemon.id, e1.id, "Should target correct enemy Pokemon")
    assertEqual(resolvedTargets[1].damageMultiplier, 1.0, "Should have full damage multiplier")
    assertEqual(resolvedTargets[1].targetType, "opponent", "Should be opponent target")
    
    -- Act - Calculate damage
    local originalHP = e1.currentHP
    local damageResult = DamageCalculator.calculateDamage({
        attacker = p1,
        defender = e1,
        moveData = tackleMove,
        options = {criticalHitForced = false}
    })
    
    -- Assert damage calculation
    assertTrue(damageResult.damage > 0, "Should deal damage")
    assertTrue(damageResult.damage < originalHP, "Should not KO with weak move")
    assertEqual(damageResult.typeEffectiveness, 1.0, "Normal vs Water should be neutral")
end

-- Test 3: Spread Move Integration with Damage Reduction
function PositionalIntegrationTests.testSpreadMoveIntegration()
    -- Arrange
    local battleState, p1, p2, e1, e2 = setupDoubleBattle()
    BattleRNG.seed("spread-move-test")
    
    local rockSlideMove = {
        name = "Rock Slide",
        type = Enums.PokemonType.ROCK,
        category = Enums.MoveCategory.PHYSICAL,
        power = 75,
        target = "all_opponents",
        isSpreadMove = true,
        damageReduction = 0.75
    }
    
    -- Act - Validate targeting
    local validation, message = MoveTargeting.validateMoveTargeting(battleState, p1, rockSlideMove)
    
    -- Assert targeting validation
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Should validate spread move")
    
    -- Act - Resolve targets
    local resolvedTargets = MoveTargeting.resolveTargets(battleState, p1, rockSlideMove)
    
    -- Assert target resolution
    assertEqual(#resolvedTargets, 2, "Should target both enemy Pokemon")
    
    for i, target in ipairs(resolvedTargets) do
        assertEqual(target.damageMultiplier, 0.75, "Should have spread damage reduction")
        assertTrue(target.isSpreadTarget, "Should be marked as spread target")
        assertEqual(target.targetType, "opponent", "Should be opponent targets")
    end
    
    -- Act - Calculate damage for both targets
    local e1OriginalHP = e1.currentHP
    local e2OriginalHP = e2.currentHP
    
    local e1DamageResult = DamageCalculator.calculateDamage({
        attacker = p1,
        defender = e1,
        moveData = rockSlideMove,
        options = {damageMultiplier = 0.75, criticalHitForced = false}
    })
    
    local e2DamageResult = DamageCalculator.calculateDamage({
        attacker = p1,
        defender = e2,
        moveData = rockSlideMove,
        options = {damageMultiplier = 0.75, criticalHitForced = false}
    })
    
    -- Assert damage calculations
    assertTrue(e1DamageResult.damage > 0, "Should deal damage to enemy 1")
    assertTrue(e2DamageResult.damage > 0, "Should deal damage to enemy 2")
    
    -- Rock vs Water should be 2x effective
    assertEqual(e1DamageResult.typeEffectiveness, 2.0, "Rock vs Water should be super effective")
    -- Rock vs Grass/Poison should be 2x effective (Rock vs Grass)
    assertEqual(e2DamageResult.typeEffectiveness, 2.0, "Rock vs Grass should be super effective")
end

-- Test 4: Ally Targeting Integration
function PositionalIntegrationTests.testAllyTargetingIntegration()
    -- Arrange
    local battleState, p1, p2, e1, e2 = setupDoubleBattle()
    
    local helpingHandMove = {
        name = "Helping Hand",
        type = Enums.PokemonType.NORMAL,
        category = Enums.MoveCategory.STATUS,
        power = 0,
        target = "ally",
        canTargetAllies = true,
        doublesOnly = true
    }
    
    -- Act - Validate ally targeting
    local validation, message = MoveTargeting.validateMoveTargeting(battleState, p1, helpingHandMove, p2)
    
    -- Assert targeting validation
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Should validate ally targeting in doubles")
    
    -- Act - Get available ally targets
    local availableTargets = MoveTargeting.getAvailableTargets(battleState, p1, MoveTargeting.TargetingType.SINGLE_ALLY)
    
    -- Assert available targets
    assertEqual(#availableTargets, 1, "Should have 1 available ally (excluding self)")
    assertEqual(availableTargets[1].pokemon.id, p2.id, "Available ally should be player Pokemon 2")
    assertEqual(availableTargets[1].relationship, "ally", "Should be ally relationship")
    
    -- Act - Resolve targets
    local resolvedTargets = MoveTargeting.resolveTargets(battleState, p1, helpingHandMove, p2)
    
    -- Assert target resolution
    assertEqual(#resolvedTargets, 1, "Should resolve to 1 ally target")
    assertEqual(resolvedTargets[1].pokemon.id, p2.id, "Should target ally Pokemon")
    assertEqual(resolvedTargets[1].targetType, "ally", "Should be ally target type")
end

-- Test 5: Position Swapping Integration (Ally Switch)
function PositionalIntegrationTests.testPositionSwappingIntegration()
    -- Arrange
    local battleState, p1, p2, e1, e2 = setupDoubleBattle()
    
    -- Record original positions
    local originalP1Position = p1.battleData.position
    local originalP2Position = p2.battleData.position
    
    assertEqual(originalP1Position, 1, "Player 1 should start in position 1")
    assertEqual(originalP2Position, 2, "Player 2 should start in position 2")
    
    -- Act - Perform position swap (Ally Switch effect)
    local swapSuccess, swapMessage = PositionalMechanics.swapPokemonPositions(battleState, p1, p2)
    
    -- Assert swap success
    assertTrue(swapSuccess, "Position swap should succeed: " .. (swapMessage or ""))
    
    -- Assert positions after swap
    assertEqual(p1.battleData.position, 2, "Player 1 should now be in position 2")
    assertEqual(p2.battleData.position, 1, "Player 2 should now be in position 1")
    
    -- Assert position tracking updated
    assertEqual(battleState.positionData.playerPositions[1], p2.id, "Position 1 should now have Player 2")
    assertEqual(battleState.positionData.playerPositions[2], p1.id, "Position 2 should now have Player 1")
    
    -- Act - Verify targeting still works after swap
    local tackleMove = {
        name = "Tackle",
        type = Enums.PokemonType.NORMAL,
        category = Enums.MoveCategory.PHYSICAL,
        power = 40,
        target = "single_opponent"
    }
    
    local validation, message = MoveTargeting.validateMoveTargeting(battleState, p1, tackleMove, e1)
    
    -- Assert targeting still works
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Targeting should still work after position swap")
    
    -- Verify Pokemon can still be found at new positions
    local pokemonAtPos1 = PositionalMechanics.getPokemonAtPosition(battleState, "player", 1)
    local pokemonAtPos2 = PositionalMechanics.getPokemonAtPosition(battleState, "player", 2)
    
    assertEqual(pokemonAtPos1.id, p2.id, "Position 1 should contain Player 2 after swap")
    assertEqual(pokemonAtPos2.id, p1.id, "Position 2 should contain Player 1 after swap")
end

-- Test 6: Positional Abilities Integration (Plus/Minus)
function PositionalIntegrationTests.testPositionalAbilitiesIntegration()
    -- Arrange
    local battleState, p1, p2, e1, e2 = setupDoubleBattle()
    
    -- Set up Pokemon with positional abilities
    p1.abilities = {"Plus"}
    p2.abilities = {"Minus"}
    
    -- Act - Get adjacent allies for positional ability activation
    local p1AdjacentAllies = PositionalMechanics.getAdjacentAllies(battleState, p1)
    local p2AdjacentAllies = PositionalMechanics.getAdjacentAllies(battleState, p2)
    
    -- Assert adjacency detection
    assertEqual(#p1AdjacentAllies, 1, "Player 1 should have 1 adjacent ally")
    assertEqual(p1AdjacentAllies[1].id, p2.id, "Player 1's adjacent ally should be Player 2")
    
    assertEqual(#p2AdjacentAllies, 1, "Player 2 should have 1 adjacent ally")
    assertEqual(p2AdjacentAllies[1].id, p1.id, "Player 2's adjacent ally should be Player 1")
    
    -- Check if adjacent ally has compatible ability (simulation)
    local p1HasCompatibleAlly = false
    local p2HasCompatibleAlly = false
    
    for _, ally in ipairs(p1AdjacentAllies) do
        if ally.abilities and (ally.abilities[1] == "Plus" or ally.abilities[1] == "Minus") then
            p1HasCompatibleAlly = true
        end
    end
    
    for _, ally in ipairs(p2AdjacentAllies) do
        if ally.abilities and (ally.abilities[1] == "Plus" or ally.abilities[1] == "Minus") then
            p2HasCompatibleAlly = true
        end
    end
    
    -- Assert positional ability conditions
    assertTrue(p1HasCompatibleAlly, "Player 1 should have compatible ally for Plus ability")
    assertTrue(p2HasCompatibleAlly, "Player 2 should have compatible ally for Minus ability")
    
    -- Test that adjacency breaks when one Pokemon faints
    p2.fainted = true
    PositionalMechanics.handlePokemonFaint(battleState, p2)
    
    local p1AdjacentAfterFaint = PositionalMechanics.getAdjacentAllies(battleState, p1)
    assertEqual(#p1AdjacentAfterFaint, 0, "Player 1 should have no adjacent allies after ally faints")
end

-- Test 7: Position-Dependent Move Integration
function PositionalIntegrationTests.testPositionDependentMoveIntegration()
    -- Arrange
    local battleState, p1, p2, e1, e2 = setupDoubleBattle()
    
    local positionMove = {
        name = "Position-Dependent Move",
        type = Enums.PokemonType.NORMAL,
        category = Enums.MoveCategory.PHYSICAL,
        power = 80,
        target = "single_opponent",
        doublesOnly = true,
        targetingType = "position_dependent"
    }
    
    -- Act - Validate position-dependent targeting with position
    local validation, message = MoveTargeting.validateMoveTargeting(battleState, p1, positionMove, nil, 1)
    
    -- Assert validation with position
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Should validate position-dependent move with position")
    
    -- Act - Validate position-dependent targeting without position
    validation, message = MoveTargeting.validateMoveTargeting(battleState, p1, positionMove, nil, nil)
    
    -- Assert validation without position
    assertEqual(validation, MoveTargeting.ValidationResult.POSITION_REQUIRED, "Should require position for position-dependent move")
    
    -- Act - Resolve position-dependent targets
    local resolvedTargets = MoveTargeting.resolveTargets(battleState, p1, positionMove, nil, 1)
    
    -- Assert target resolution
    assertEqual(#resolvedTargets, 1, "Should resolve to 1 target")
    assertEqual(resolvedTargets[1].pokemon.id, e1.id, "Should target Pokemon at specified position")
    assertEqual(resolvedTargets[1].targetPosition, 1, "Should record target position")
    
    -- Test targeting empty position
    e2.fainted = true
    PositionalMechanics.handlePokemonFaint(battleState, e2)
    
    validation, message = MoveTargeting.validateMoveTargeting(battleState, p1, positionMove, nil, 2)
    assertEqual(validation, MoveTargeting.ValidationResult.NO_VALID_TARGETS, "Should fail when targeting empty position")
end

-- Test 8: Multi-Turn Position Persistence
function PositionalIntegrationTests.testMultiTurnPositionPersistence()
    -- Arrange
    local battleState, p1, p2, e1, e2 = setupDoubleBattle()
    
    -- Record initial state
    local initialPositions = PositionalMechanics.getAllActivePositions(battleState)
    
    -- Act - Simulate multiple turns with various actions
    for turn = 1, 5 do
        battleState.turn = turn
        
        -- Verify positions persist across turns
        local currentPositions = PositionalMechanics.getAllActivePositions(battleState)
        
        assertEqual(currentPositions.format, initialPositions.format, "Format should persist across turns")
        
        -- Verify specific Pokemon positions
        assertEqual(p1.battleData.position, 1, "Player 1 position should persist (turn " .. turn .. ")")
        assertEqual(p2.battleData.position, 2, "Player 2 position should persist (turn " .. turn .. ")")
        assertEqual(e1.battleData.position, 1, "Enemy 1 position should persist (turn " .. turn .. ")")
        assertEqual(e2.battleData.position, 2, "Enemy 2 position should persist (turn " .. turn .. ")")
        
        -- Verify targeting still works each turn
        local tackleMove = {
            name = "Tackle",
            type = Enums.PokemonType.NORMAL,
            category = Enums.MoveCategory.PHYSICAL,
            power = 40,
            target = "single_opponent"
        }
        
        local validation = MoveTargeting.validateMoveTargeting(battleState, p1, tackleMove, e1)
        assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Targeting should work on turn " .. turn)
    end
end

-- Test 9: Pokemon Switching and Position Management
function PositionalIntegrationTests.testPokemonSwitchingAndPositions()
    -- Arrange
    local battleState, p1, p2, e1, e2 = setupDoubleBattle()
    
    -- Create a replacement Pokemon
    local replacementPokemon = createTestPokemon(5, "Alakazam", 50, {hp = 85, atk = 50, def = 45, spatk = 135, spdef = 95, spd = 120}, {Enums.PokemonType.PSYCHIC})
    
    -- Record original state
    assertEqual(p1.battleData.position, 1, "Player 1 should start in position 1")
    assertEqual(battleState.positionData.playerPositions[1], p1.id, "Position 1 should contain Player 1")
    
    -- Act - Simulate Pokemon fainting and replacement
    p1.fainted = true
    PositionalMechanics.handlePokemonFaint(battleState, p1)
    
    -- Assert position cleared
    assertEqual(battleState.positionData.playerPositions[1], nil, "Position 1 should be cleared after faint")
    assertEqual(p1.battleData.position, nil, "Fainted Pokemon should have no position")
    
    -- Act - Assign replacement Pokemon to same position
    local success, message = PositionalMechanics.assignPokemonPosition(battleState, replacementPokemon, "player", 1)
    
    -- Assert replacement assignment
    assertTrue(success, "Should successfully assign replacement Pokemon")
    assertEqual(replacementPokemon.battleData.position, 1, "Replacement should be in position 1")
    assertEqual(battleState.positionData.playerPositions[1], replacementPokemon.id, "Position 1 should contain replacement")
    
    -- Act - Verify targeting works with replacement
    local tackleMove = {
        name = "Tackle",
        type = Enums.PokemonType.NORMAL,
        category = Enums.MoveCategory.PHYSICAL,
        power = 40,
        target = "single_opponent"
    }
    
    local validation = MoveTargeting.validateMoveTargeting(battleState, replacementPokemon, tackleMove, e1)
    
    -- Assert targeting with replacement
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Targeting should work with replacement Pokemon")
    
    -- Verify adjacency with replacement
    local adjacentAllies = PositionalMechanics.getAdjacentAllies(battleState, replacementPokemon)
    assertEqual(#adjacentAllies, 1, "Replacement should have adjacent ally")
    assertEqual(adjacentAllies[1].id, p2.id, "Adjacent ally should be Player 2")
end

-- Test 10: Complete Double Battle Integration Workflow
function PositionalIntegrationTests.testCompleteDoubleBattleWorkflow()
    -- Arrange
    local battleState, p1, p2, e1, e2 = setupDoubleBattle()
    BattleRNG.seed("complete-workflow-test")
    
    -- Act & Assert - Phase 1: Initial Setup
    assertTrue(PositionalMechanics.supportsPositionalMechanics(battleState), "Battle should support positional mechanics")
    
    local formatInfo = PositionalMechanics.getBattleFormatInfo(battleState)
    assertEqual(formatInfo.max_active_per_side, 2, "Should support 2 Pokemon per side")
    
    -- Act & Assert - Phase 2: Single Target Attack
    local thunderboltMove = {
        name = "Thunderbolt",
        type = Enums.PokemonType.ELECTRIC,
        category = Enums.MoveCategory.SPECIAL,
        power = 90,
        target = "single_opponent"
    }
    
    local validation = MoveTargeting.validateMoveTargeting(battleState, p1, thunderboltMove, e1)
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Single target should validate")
    
    -- Act & Assert - Phase 3: Spread Move Attack
    local earthquakeMove = {
        name = "Earthquake",
        type = Enums.PokemonType.GROUND,
        category = Enums.MoveCategory.PHYSICAL,
        power = 100,
        target = "all_opponents",
        isSpreadMove = true,
        damageReduction = 0.75
    }
    
    validation = MoveTargeting.validateMoveTargeting(battleState, p2, earthquakeMove)
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Spread move should validate")
    
    local spreadTargets = MoveTargeting.resolveTargets(battleState, p2, earthquakeMove)
    assertEqual(#spreadTargets, 2, "Should target both opponents")
    
    -- Act & Assert - Phase 4: Position Swap
    local swapSuccess = PositionalMechanics.swapPokemonPositions(battleState, p1, p2)
    assertTrue(swapSuccess, "Position swap should succeed")
    
    assertEqual(p1.battleData.position, 2, "Player 1 should be in position 2 after swap")
    assertEqual(p2.battleData.position, 1, "Player 2 should be in position 1 after swap")
    
    -- Act & Assert - Phase 5: Ally Targeting After Swap
    local healPulseMove = {
        name = "Heal Pulse",
        type = Enums.PokemonType.PSYCHIC,
        category = Enums.MoveCategory.STATUS,
        power = 0,
        target = "ally",
        canTargetAllies = true
    }
    
    validation = MoveTargeting.validateMoveTargeting(battleState, p1, healPulseMove, p2)
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Ally targeting should work after swap")
    
    -- Act & Assert - Phase 6: Position-Dependent Targeting After Swap
    local positionMove = {
        name = "Position Move",
        type = Enums.PokemonType.NORMAL,
        category = Enums.MoveCategory.PHYSICAL,
        power = 80,
        doublesOnly = true
    }
    
    validation = MoveTargeting.validateMoveTargeting(battleState, p1, positionMove, nil, 2)
    assertEqual(validation, MoveTargeting.ValidationResult.VALID, "Position targeting should work after swap")
    
    -- Act & Assert - Phase 7: Adjacency After Swap
    local p1Adjacent = PositionalMechanics.getAdjacentAllies(battleState, p1)
    local p2Adjacent = PositionalMechanics.getAdjacentAllies(battleState, p2)
    
    assertEqual(#p1Adjacent, 1, "Player 1 should still have adjacent ally after swap")
    assertEqual(#p2Adjacent, 1, "Player 2 should still have adjacent ally after swap")
    assertEqual(p1Adjacent[1].id, p2.id, "Player 1's adjacent ally should be Player 2")
    assertEqual(p2Adjacent[1].id, p1.id, "Player 2's adjacent ally should be Player 1")
    
    -- Final verification: All systems working together
    local allActivePositions = PositionalMechanics.getAllActivePositions(battleState)
    assertEqual(allActivePositions.player[1].pokemon_id, p2.id, "Position 1 should have Player 2 after swap")
    assertEqual(allActivePositions.player[2].pokemon_id, p1.id, "Position 2 should have Player 1 after swap")
    
    assertTrue(true, "Complete double battle workflow completed successfully")
end

-- Test Runner
function PositionalIntegrationTests.runAllTests()
    local tests = {
        "testDoubleBattleSetupIntegration",
        "testSingleTargetMoveExecution",
        "testSpreadMoveIntegration",
        "testAllyTargetingIntegration",
        "testPositionSwappingIntegration",
        "testPositionalAbilitiesIntegration",
        "testPositionDependentMoveIntegration",
        "testMultiTurnPositionPersistence",
        "testPokemonSwitchingAndPositions",
        "testCompleteDoubleBattleWorkflow"
    }
    
    local passed = 0
    local failed = 0
    
    print("Running Positional Mechanics Integration Tests...")
    print("=" .. string.rep("=", 50))
    
    for _, testName in ipairs(tests) do
        local success, error = pcall(PositionalIntegrationTests[testName])
        if success then
            print("✓ " .. testName)
            passed = passed + 1
        else
            print("✗ " .. testName .. ": " .. tostring(error))
            failed = failed + 1
        end
    end
    
    print("=" .. string.rep("=", 50))
    print(string.format("Integration tests completed: %d passed, %d failed", passed, failed))
    
    if failed > 0 then
        error(string.format("Integration tests failed: %d/%d tests failed", failed, passed + failed))
    end
    
    return {passed = passed, failed = failed}
end

-- Run tests if this file is executed directly
if arg and arg[0] and arg[0]:find("positional%-integration%.test%.lua$") then
    PositionalIntegrationTests.runAllTests()
end

return PositionalIntegrationTests