-- Integration Tests for Side Effects System
-- Tests complete battle workflows with side effects
-- Validates multi-turn scenarios, screen breaking, and team-wide application

-- Load test framework and setup
package.path = package.path .. ";./tests/integration/?.lua;./tests/?.lua;./?.lua"
local TestSetup = require("tests/integration/test-setup")

-- Load systems under test
local BattleHandler = require("handlers.battle-handler")
local SideEffects = require("game-logic.battle.side-effects")
local TurnProcessor = require("game-logic.battle.turn-processor")

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
    if not condition then
        error(message or "Expected true")
    end
end

local function assertNotNil(value, message)
    if value == nil then
        error(message or "Value should not be nil")
    end
end

local function assertNil(value, message)
    if value ~= nil then
        error(message or "Value should be nil")
    end
end

local function assertContains(table_or_string, value, message)
    if type(table_or_string) == "table" then
        for _, v in ipairs(table_or_string) do
            if v == value then return end
        end
        error(message or string.format("Table does not contain %s", tostring(value)))
    elseif type(table_or_string) == "string" then
        if not string.find(table_or_string, value) then
            error(message or string.format("String '%s' does not contain '%s'", table_or_string, value))
        end
    end
end

local SideEffectsIntegrationTest = {}

-- Setup test battle state with side effects
local function createTestBattleState()
    local battleState = TestSetup.createTestBattle()
    
    -- Initialize side effects
    SideEffects.initializeSideEffects(battleState, "player")
    SideEffects.initializeSideEffects(battleState, "enemy")
    
    return battleState
end

-- Test Light Screen battle integration
function SideEffectsIntegrationTest.testLightScreenBattleIntegration()
    local battleState = createTestBattleState()
    
    -- Pokemon uses Light Screen
    local lightScreenAction = {
        type = "move",
        pokemon = battleState.playerParty[1],
        moveId = 113,  -- Light Screen
        priority = 0
    }
    
    -- Execute Light Screen move
    local result = TurnProcessor.executeMoveAction(battleState, lightScreenAction)
    assertEqual(result.success, true, "Light Screen move should execute successfully")
    assertEqual(result.side_effect_applied, true, "Side effect should be applied")
    
    -- Verify Light Screen is active
    local isActive = SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.LIGHT_SCREEN)
    assertEqual(isActive, true, "Light Screen should be active after move")
    
    -- Test damage reduction in subsequent turn
    local specialAttack = {
        type = "move",
        pokemon = battleState.enemyParty[1],
        moveId = 94,  -- Psychic (Special)
        target = battleState.playerParty[1],
        priority = 0
    }
    
    local originalHP = battleState.playerParty[1].currentHP
    local attackResult = TurnProcessor.executeMoveAction(battleState, specialAttack)
    
    assertEqual(attackResult.success, true, "Special attack should execute")
    assertTrue(attackResult.damage_dealt < 50, "Damage should be reduced by Light Screen")
end

-- Test Reflect battle integration
function SideEffectsIntegrationTest.testReflectBattleIntegration()
    local battleState = createTestBattleState()
    
    -- Pokemon uses Reflect
    local reflectAction = {
        type = "move", 
        pokemon = battleState.playerParty[1],
        moveId = 115,  -- Reflect
        priority = 0
    }
    
    -- Execute Reflect move
    local result = TurnProcessor.executeMoveAction(battleState, reflectAction)
    assertEqual(result.success, true, "Reflect move should execute successfully")
    
    -- Test physical damage reduction
    local physicalAttack = {
        type = "move",
        pokemon = battleState.enemyParty[1], 
        moveId = 1,  -- Pound (Physical)
        target = battleState.playerParty[1],
        priority = 0
    }
    
    local attackResult = TurnProcessor.executeMoveAction(battleState, physicalAttack)
    assertTrue(attackResult.damage_dealt < 30, "Physical damage should be reduced by Reflect")
end

-- Test Aurora Veil battle integration
function SideEffectsIntegrationTest.testAuroraVeilBattleIntegration()
    local battleState = createTestBattleState()
    battleState.weather = "HAIL"  -- Required for Aurora Veil
    
    -- Pokemon uses Aurora Veil
    local auroraVeilAction = {
        type = "move",
        pokemon = battleState.playerParty[1],
        moveId = 1390,  -- Aurora Veil
        priority = 0
    }
    
    -- Execute Aurora Veil move
    local result = TurnProcessor.executeMoveAction(battleState, auroraVeilAction)
    assertEqual(result.success, true, "Aurora Veil should execute successfully")
    
    -- Verify Aurora Veil is active
    local isActive = SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.AURORA_VEIL)
    assertEqual(isActive, true, "Aurora Veil should be active")
    
    -- Test both physical and special damage reduction
    local physicalAttack = {
        type = "move",
        pokemon = battleState.enemyParty[1],
        moveId = 1,  -- Pound
        target = battleState.playerParty[1]
    }
    
    local specialAttack = {
        type = "move", 
        pokemon = battleState.enemyParty[1],
        moveId = 94,  -- Psychic
        target = battleState.playerParty[1]
    }
    
    local physicalResult = TurnProcessor.executeMoveAction(battleState, physicalAttack)
    local specialResult = TurnProcessor.executeMoveAction(battleState, specialAttack)
    
    assertTrue(physicalResult.damage_dealt < 30, "Aurora Veil should reduce physical damage")
    assertTrue(specialResult.damage_dealt < 50, "Aurora Veil should reduce special damage")
end

-- Test Safeguard status prevention
function SideEffectsIntegrationTest.testSafeguardStatusPrevention()
    local battleState = createTestBattleState()
    
    -- Set up Safeguard
    SideEffects.setSafeguard(battleState, "player")
    
    -- Try to apply poison to protected Pokemon
    local StatusEffects = require("game-logic.pokemon.status-effects")
    local pokemon = battleState.playerParty[1]
    pokemon.side = "player"
    
    local result = StatusEffects.applyStatusEffect(pokemon, "poison", nil, battleState)
    
    assertEqual(result.success, false, "Status application should fail")
    assertEqual(result.safeguard_blocked, true, "Should be blocked by Safeguard")
    assertNil(pokemon.statusEffect, "Pokemon should have no status effect")
end

-- Test Mist stat reduction prevention  
function SideEffectsIntegrationTest.testMistStatReductionPrevention()
    local battleState = createTestBattleState()
    
    -- Set up Mist
    SideEffects.setMist(battleState, "player")
    
    -- Try to reduce stats on protected Pokemon
    local MoveEffects = require("game-logic.battle.move-effects")
    local pokemon = battleState.playerParty[1]
    pokemon.side = "player"
    
    -- Attempt stat reduction
    local success, message, mistBlocked = MoveEffects.applyStatStageChange(
        battleState.battleId, 
        pokemon.id, 
        "attack", 
        -2, 
        "enemy_move",
        pokemon,
        {}
    )
    
    assertEqual(success, false, "Stat reduction should fail")
    assertEqual(mistBlocked, true, "Should be blocked by Mist")
    assertContains(message, "Mist", "Error message should mention Mist")
end

-- Test screen breaking integration
function SideEffectsIntegrationTest.testScreenBreakingIntegration()
    local battleState = createTestBattleState()
    
    -- Set up multiple screens
    SideEffects.setLightScreen(battleState, "player")
    SideEffects.setReflect(battleState, "player")
    
    -- Use Brick Break to remove screens
    local brickBreakAction = {
        type = "move",
        pokemon = battleState.enemyParty[1],
        moveId = 562,  -- Brick Break
        target = battleState.playerParty[1],
        priority = 0
    }
    
    local result = TurnProcessor.executeMoveAction(battleState, brickBreakAction)
    assertEqual(result.success, true, "Brick Break should execute successfully")
    assertEqual(result.screens_broken, true, "Screens should be broken")
    
    -- Verify screens are removed
    local lightScreenActive = SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.LIGHT_SCREEN)
    local reflectActive = SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.REFLECT)
    
    assertEqual(lightScreenActive, false, "Light Screen should be removed")
    assertEqual(reflectActive, false, "Reflect should be removed")
end

-- Test Psychic Fangs screen breaking
function SideEffectsIntegrationTest.testPsychicFangsScreenBreaking()
    local battleState = createTestBattleState()
    battleState.weather = "HAIL"
    
    -- Set up all screens including Aurora Veil
    SideEffects.setLightScreen(battleState, "player")
    SideEffects.setReflect(battleState, "player")
    SideEffects.setAuroraVeil(battleState, "player")
    
    -- Use Psychic Fangs
    local psychicFangsAction = {
        type = "move",
        pokemon = battleState.enemyParty[1],
        moveId = 1414,  -- Psychic Fangs
        target = battleState.playerParty[1],
        priority = 0
    }
    
    local result = TurnProcessor.executeMoveAction(battleState, psychicFangsAction)
    assertEqual(result.screens_broken, true, "All screens should be broken")
    
    -- Verify all screens are removed
    local lightScreenActive = SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.LIGHT_SCREEN)
    local reflectActive = SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.REFLECT)
    local auroraVeilActive = SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.AURORA_VEIL)
    
    assertEqual(lightScreenActive, false, "Light Screen should be removed")
    assertEqual(reflectActive, false, "Reflect should be removed")
    assertEqual(auroraVeilActive, false, "Aurora Veil should be removed")
end

-- Test multi-turn side effect duration
function SideEffectsIntegrationTest.testMultiTurnSideEffectDuration()
    local battleState = createTestBattleState()
    
    -- Set up Light Screen
    SideEffects.setLightScreen(battleState, "player")
    
    -- Process 4 turns
    for turn = 1, 4 do
        battleState.turn = turn
        local expiredEffects = SideEffects.processTurnEnd(battleState)
        
        -- Should still be active
        local isActive = SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.LIGHT_SCREEN)
        assertEqual(isActive, true, string.format("Light Screen should be active after turn %d", turn))
        
        local duration = SideEffects.getSideEffectDuration(battleState, "player", SideEffects.TYPES.LIGHT_SCREEN)
        assertEqual(duration, 5 - turn, string.format("Duration should be %d after turn %d", 5 - turn, turn))
    end
    
    -- Process 5th turn - should expire
    battleState.turn = 5
    local finalExpiredEffects = SideEffects.processTurnEnd(battleState)
    
    assertEqual(#finalExpiredEffects.player, 1, "One effect should expire")
    assertContains(finalExpiredEffects.player, SideEffects.TYPES.LIGHT_SCREEN, "Light Screen should expire")
    
    -- Verify effect is no longer active
    local isActive = SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.LIGHT_SCREEN)
    assertEqual(isActive, false, "Light Screen should be inactive after expiration")
end

-- Test team-wide application
function SideEffectsIntegrationTest.testTeamWideApplication()
    local battleState = createTestBattleState()
    
    -- Add second Pokemon to player team
    local secondPokemon = TestSetup.createTestPokemon(25, "Pikachu")
    secondPokemon.side = "player"
    table.insert(battleState.playerParty, secondPokemon)
    
    -- Set up Safeguard
    SideEffects.setSafeguard(battleState, "player")
    
    -- Try to poison both Pokemon
    local StatusEffects = require("game-logic.pokemon.status-effects")
    
    local result1 = StatusEffects.applyStatusEffect(battleState.playerParty[1], "poison", nil, battleState)
    local result2 = StatusEffects.applyStatusEffect(battleState.playerParty[2], "poison", nil, battleState)
    
    assertEqual(result1.safeguard_blocked, true, "First Pokemon should be protected")
    assertEqual(result2.safeguard_blocked, true, "Second Pokemon should be protected")
    
    -- Verify no status effects applied
    assertNil(battleState.playerParty[1].statusEffect, "First Pokemon should have no status")
    assertNil(battleState.playerParty[2].statusEffect, "Second Pokemon should have no status")
end

-- Test side effect persistence across switches
function SideEffectsIntegrationTest.testSideEffectPersistenceAcrossSwitches()
    local battleState = createTestBattleState()
    
    -- Set up Light Screen 
    SideEffects.setLightScreen(battleState, "player")
    
    -- Simulate Pokemon switch
    local originalActive = battleState.playerParty[1]
    local newActive = TestSetup.createTestPokemon(30, "Charizard")
    newActive.side = "player"
    
    -- Switch active Pokemon
    battleState.playerParty[1] = newActive
    table.insert(battleState.playerParty, originalActive)
    
    -- Verify Light Screen still active
    local isActive = SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.LIGHT_SCREEN)
    assertEqual(isActive, true, "Light Screen should persist after switch")
    
    -- Test damage reduction still works
    local specialAttack = {
        type = "move",
        pokemon = battleState.enemyParty[1],
        moveId = 94,  -- Psychic
        target = newActive,
        priority = 0
    }
    
    local attackResult = TurnProcessor.executeMoveAction(battleState, specialAttack)
    assertTrue(attackResult.damage_dealt > 0, "Should deal damage")
    -- Note: Actual damage reduction validation would require more complex setup
end

-- Test side effects in turn processor integration
function SideEffectsIntegrationTest.testTurnProcessorIntegration()
    local battleState = createTestBattleState()
    
    -- Set up multiple side effects
    SideEffects.setLightScreen(battleState, "player")
    SideEffects.setReflect(battleState, "enemy")
    SideEffects.setSafeguard(battleState, "player")
    
    -- Process a complete battle turn
    local turnResult = TurnProcessor.processBattleTurn(battleState)
    
    assertEqual(turnResult.success, true, "Turn should process successfully")
    TestFramework.assertNotNil(turnResult.side_effect_updates, "Should include side effect updates")
    
    -- Check side effect updates structure
    local sideEffectUpdates = turnResult.side_effect_updates
    assertEqual(type(sideEffectUpdates.active_effects), "table", "Should have active effects list")
    assertEqual(type(sideEffectUpdates.expired_effects), "table", "Should have expired effects list")
    
    -- Verify active effects are reported
    assertTrue(#sideEffectUpdates.active_effects >= 3, "Should report active side effects")
end

-- Test complete battle scenario with side effects
function SideEffectsIntegrationTest.testCompleteBattleScenario()
    local battleState = createTestBattleState()
    
    -- Turn 1: Player uses Light Screen
    local lightScreenAction = {
        type = "move",
        pokemon = battleState.playerParty[1],
        moveId = 113,
        priority = 0
    }
    
    local turnActions = {lightScreenAction}
    local turn1Result = TurnProcessor.processBattleTurn(battleState)
    
    -- Turn 2: Enemy attacks with special move
    local specialAttack = {
        type = "move",
        pokemon = battleState.enemyParty[1],
        moveId = 94,
        target = battleState.playerParty[1],
        priority = 0
    }
    
    local attackResult = TurnProcessor.executeMoveAction(battleState, specialAttack)
    assertTrue(attackResult.damage_dealt > 0, "Should deal reduced damage")
    
    -- Turn 3: Enemy uses Brick Break
    local brickBreakAction = {
        type = "move",
        pokemon = battleState.enemyParty[1],
        moveId = 562,
        target = battleState.playerParty[1],
        priority = 0
    }
    
    local brickBreakResult = TurnProcessor.executeMoveAction(battleState, brickBreakAction)
    assertEqual(brickBreakResult.screens_broken, true, "Screens should be broken")
    
    -- Verify Light Screen is removed
    local lightScreenActive = SideEffects.hasSideEffect(battleState, "player", SideEffects.TYPES.LIGHT_SCREEN)
    assertEqual(lightScreenActive, false, "Light Screen should be removed by Brick Break")
end

-- Test doubles format damage reduction
function SideEffectsIntegrationTest.testDoublesFormatDamageReduction()
    local battleState = createTestBattleState()
    battleState.battleFormat = "doubles"
    
    -- Set up Light Screen
    SideEffects.setLightScreen(battleState, "player")
    
    -- Test damage reduction calculation
    local Enums = require("data.constants.enums") 
    local reducedDamage = SideEffects.applyDamageReduction(100, Enums.MoveCategory.SPECIAL, "enemy", "player", battleState, true)
    
    assertEqual(reducedDamage, 67, "Doubles format should reduce damage to 67%")
end

-- Test Aurora Veil weather dependency
function SideEffectsIntegrationTest.testAuroraVeilWeatherDependency()
    local battleState = createTestBattleState()
    
    -- Test Aurora Veil failure without proper weather
    battleState.weather = "NONE"
    local success = SideEffects.setAuroraVeil(battleState, "player")
    assertEqual(success, false, "Aurora Veil should fail without hail/snow")
    
    -- Test Aurora Veil success with hail
    battleState.weather = "HAIL"
    success = SideEffects.setAuroraVeil(battleState, "player")
    assertEqual(success, true, "Aurora Veil should succeed with hail")
    
    -- Test Aurora Veil success with snow
    battleState.weather = "SNOW"
    local battleState2 = createTestBattleState()
    battleState2.weather = "SNOW"
    success = SideEffects.setAuroraVeil(battleState2, "player")
    assertEqual(success, true, "Aurora Veil should succeed with snow")
end

-- Run all tests
function SideEffectsIntegrationTest.runAllTests()
    local tests = {
        "testLightScreenBattleIntegration",
        "testReflectBattleIntegration", 
        "testAuroraVeilBattleIntegration",
        "testSafeguardStatusPrevention",
        "testMistStatReductionPrevention",
        "testScreenBreakingIntegration",
        "testPsychicFangsScreenBreaking",
        "testMultiTurnSideEffectDuration",
        "testTeamWideApplication",
        "testSideEffectPersistenceAcrossSwitches",
        "testTurnProcessorIntegration",
        "testCompleteBattleScenario",
        "testDoublesFormatDamageReduction",
        "testAuroraVeilWeatherDependency"
    }
    
    local passed = 0
    local failed = 0
    
    print("Running Side Effects Integration Tests...")
    print("=" .. string.rep("=", 50))
    
    for _, testName in ipairs(tests) do
        local success, error = pcall(SideEffectsIntegrationTest[testName])
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
        error(string.format("Integration tests failed: %d/%d tests failed", failed, passed + failed))
    end
    
    return {passed = passed, failed = failed}
end

-- Auto-run if called directly
if ... == nil then
    SideEffectsIntegrationTest.runAllTests()
end

return SideEffectsIntegrationTest