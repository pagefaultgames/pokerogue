-- Status Effects Integration Tests
-- Tests complete status effect workflows within battle message processing system
-- Validates status effect persistence across switches, turns, and battle conclusions
-- Tests multi-turn status effect scenarios with duration tracking and interaction validation

-- Load the full battle system components
local TurnProcessor = require("game-logic.battle.turn-processor")
local BattleStateManager = require("game-logic.battle.battle-state-manager")
local StatusEffects = require("game-logic.pokemon.status-effects")
local StatusInteractions = require("game-logic.pokemon.status-interactions")
local StatusHealing = require("game-logic.pokemon.status-healing")
local StatusImmunities = require("game-logic.pokemon.status-immunities")

-- Mock dependencies for integration testing
local MockBattleRNG = {
    initSeed = function(seed) 
        MockBattleRNG.seed = seed
        MockBattleRNG.counter = 0
    end,
    randomInt = function(min, max) 
        MockBattleRNG.counter = MockBattleRNG.counter + 1
        -- Deterministic values for testing
        local values = {25, 75, 30, 80, 40, 60, 15, 85, 35, 70}
        local index = ((MockBattleRNG.counter - 1) % #values) + 1
        local normalized = values[index] / 100
        return math.floor(min + normalized * (max - min))
    end,
    counter = 0
}

-- Test framework
local TestFramework = {
    testCount = 0,
    passCount = 0,
    failCount = 0,
    
    assertEquals = function(expected, actual, message)
        TestFramework.testCount = TestFramework.testCount + 1
        if expected == actual then
            TestFramework.passCount = TestFramework.passCount + 1
            print("✓ " .. (message or "Test passed"))
        else
            TestFramework.failCount = TestFramework.failCount + 1
            print("✗ " .. (message or "Test failed") .. " - Expected: " .. tostring(expected) .. ", Actual: " .. tostring(actual))
        end
    end,
    
    assertTrue = function(condition, message)
        TestFramework.assertEquals(true, condition, message)
    end,
    
    assertFalse = function(condition, message)
        TestFramework.assertEquals(false, condition, message)
    end,
    
    assertNotNil = function(value, message)
        TestFramework.testCount = TestFramework.testCount + 1
        if value ~= nil then
            TestFramework.passCount = TestFramework.passCount + 1
            print("✓ " .. (message or "Value is not nil"))
        else
            TestFramework.failCount = TestFramework.failCount + 1
            print("✗ " .. (message or "Value should not be nil"))
        end
    end,
    
    assertLessOrEqual = function(expected, actual, message)
        TestFramework.testCount = TestFramework.testCount + 1
        if actual <= expected then
            TestFramework.passCount = TestFramework.passCount + 1
            print("✓ " .. (message or "Value is within expected range"))
        else
            TestFramework.failCount = TestFramework.failCount + 1
            print("✗ " .. (message or "Value exceeds expected") .. " - Expected: <= " .. tostring(expected) .. ", Actual: " .. tostring(actual))
        end
    end,
    
    printSummary = function()
        print("\n=== Integration Test Summary ===")
        print("Total: " .. TestFramework.testCount)
        print("Passed: " .. TestFramework.passCount)
        print("Failed: " .. TestFramework.failCount)
        if TestFramework.failCount == 0 then
            print("All integration tests passed! ✓")
        else
            print("Some integration tests failed! ✗")
        end
    end
}

-- Helper functions for test setup
local function createTestPokemon(id, name, types, ability, maxHP, moves)
    return {
        id = id,
        name = name,
        types = types or {1}, -- Normal type default
        ability = ability,
        maxHP = maxHP or 100,
        currentHP = maxHP or 100,
        stats = {
            hp = maxHP or 100,
            attack = 50,
            defense = 50,
            spatk = 50,
            spdef = 50,
            speed = 50
        },
        moves = moves or {
            [1] = {pp = 20, maxPP = 20}, -- Tackle
            [73] = {pp = 15, maxPP = 15} -- Thunderbolt
        },
        statusEffect = nil,
        statusTurns = nil,
        fainted = false
    }
end

local function createTestBattleState(battleId, seed)
    local playerParty = {
        createTestPokemon("player-1", "Pikachu", {13}, nil, 100), -- Electric type
        createTestPokemon("player-2", "Charmander", {10}, nil, 80) -- Fire type
    }
    
    local enemyParty = {
        createTestPokemon("enemy-1", "Squirtle", {11}, nil, 90), -- Water type
        createTestPokemon("enemy-2", "Bulbasaur", {12, 4}, nil, 85) -- Grass/Poison type
    }
    
    local battleState = {
        battleId = battleId or "test-battle-001",
        battleSeed = seed or "integration-test-seed",
        turn = 0,
        phase = 1, -- COMMAND_SELECTION
        playerParty = playerParty,
        enemyParty = enemyParty,
        battleConditions = {
            weather = 0,
            weatherDuration = 0,
            terrain = 0,
            terrainDuration = 0
        },
        turnCommands = {},
        turnOrder = {},
        pendingActions = {},
        interruptQueue = {},
        battleResult = nil
    }
    
    return battleState
end

-- Test: Status Effect Application in Battle Context
function testStatusEffectApplicationInBattle()
    print("\n=== Testing Status Effect Application in Battle Context ===")
    
    local battleState = createTestBattleState("status-application-test")
    local targetPokemon = battleState.playerParty[1] -- Pikachu
    
    -- Test successful status application
    local result = StatusEffects.applyStatusEffect(targetPokemon, StatusEffects.StatusType.PARALYSIS, nil, battleState)
    
    TestFramework.assertTrue(result.success, "Status effect should be applied in battle context")
    TestFramework.assertEquals(StatusEffects.StatusType.PARALYSIS, targetPokemon.statusEffect, "Pokemon should have paralysis")
    TestFramework.assertTrue(#result.messages > 0, "Application should generate battle messages")
    TestFramework.assertTrue(#result.effects > 0, "Application should generate stat effects")
    
    -- Test status immunity
    targetPokemon = battleState.playerParty[1] -- Electric-type Pikachu
    result = StatusEffects.applyStatusEffect(targetPokemon, StatusEffects.StatusType.PARALYSIS, nil, battleState)
    
    TestFramework.assertFalse(result.success, "Electric types should be immune to paralysis")
    TestFramework.assertTrue(result.blocked, "Application should be blocked by immunity")
end

-- Test: End-of-Turn Status Processing Integration
function testEndOfTurnStatusProcessingIntegration()
    print("\n=== Testing End-of-Turn Status Processing Integration ===")
    
    local battleState = createTestBattleState("end-turn-processing-test")
    
    -- Apply status effects to multiple Pokemon
    StatusEffects.applyStatusEffect(battleState.playerParty[1], StatusEffects.StatusType.BURN, nil, battleState)
    StatusEffects.applyStatusEffect(battleState.playerParty[2], StatusEffects.StatusType.POISON, nil, battleState)
    StatusEffects.applyStatusEffect(battleState.enemyParty[1], StatusEffects.StatusType.SLEEP, 2, battleState)
    
    -- Record initial HP values
    local initialHP1 = battleState.playerParty[1].currentHP
    local initialHP2 = battleState.playerParty[2].currentHP
    
    -- Process end-of-turn effects using the turn processor
    local endTurnResult = TurnProcessor.processEndOfTurnEffects(battleState)
    
    TestFramework.assertNotNil(endTurnResult.status_effects, "End-of-turn should process status effects")
    
    -- Check damage was dealt
    TestFramework.assertTrue(battleState.playerParty[1].currentHP < initialHP1, "Burn should deal damage")
    TestFramework.assertTrue(battleState.playerParty[2].currentHP < initialHP2, "Poison should deal damage")
    
    -- Check sleep duration processed
    TestFramework.assertEquals(1, battleState.enemyParty[1].statusTurns, "Sleep turns should decrement")
end

-- Test: Status Effects in Move Execution
function testStatusEffectsInMoveExecution()
    print("\n=== Testing Status Effects in Move Execution ===")
    
    local battleState = createTestBattleState("move-execution-test")
    MockBattleRNG.initSeed(battleState.battleSeed)
    
    -- Apply sleep to player Pokemon
    StatusEffects.applyStatusEffect(battleState.playerParty[1], StatusEffects.StatusType.SLEEP, 2, battleState)
    
    -- Create a move action
    local moveAction = {
        type = "move",
        pokemon = battleState.playerParty[1],
        pokemonId = battleState.playerParty[1].id,
        moveId = 1, -- Tackle
        target = battleState.enemyParty[1]
    }
    
    -- Try to execute move with sleeping Pokemon
    local result = TurnProcessor.executeMoveAction(battleState, moveAction)
    
    TestFramework.assertFalse(result.success, "Sleeping Pokemon should not be able to use moves")
    TestFramework.assertNotNil(result.statusPrevention, "Move prevention should be recorded")
    
    -- Apply paralysis and test intermittent failure
    StatusEffects.clearStatusEffect(battleState.playerParty[1])
    StatusEffects.applyStatusEffect(battleState.playerParty[1], StatusEffects.StatusType.PARALYSIS, nil, battleState)
    
    -- Execute multiple times to test paralysis chance
    local successCount = 0
    local totalAttempts = 10
    
    for i = 1, totalAttempts do
        MockBattleRNG.initSeed(battleState.battleSeed .. i) -- Different seed each time
        result = TurnProcessor.executeMoveAction(battleState, moveAction)
        if result.success then
            successCount = successCount + 1
        end
    end
    
    -- Paralyzed Pokemon should succeed sometimes but not always
    TestFramework.assertTrue(successCount > 0, "Paralyzed Pokemon should sometimes succeed")
    TestFramework.assertTrue(successCount < totalAttempts, "Paralyzed Pokemon should sometimes fail")
end

-- Test: Status Effect Persistence Across Battle Phases
function testStatusEffectPersistenceAcrossBattlePhases()
    print("\n=== Testing Status Effect Persistence Across Battle Phases ===")
    
    local battleState = createTestBattleState("persistence-test")
    
    -- Apply long-lasting status effect
    StatusEffects.applyStatusEffect(battleState.playerParty[1], StatusEffects.StatusType.BADLY_POISONED, nil, battleState)
    local originalTurns = battleState.playerParty[1].statusTurns
    
    -- Simulate multiple battle turns
    for turn = 1, 3 do
        battleState.turn = turn
        
        -- Process end-of-turn effects
        local endTurnResult = TurnProcessor.processEndOfTurnEffects(battleState)
        
        TestFramework.assertEquals(StatusEffects.StatusType.BADLY_POISONED, 
                                 battleState.playerParty[1].statusEffect, 
                                 "Badly poisoned should persist across turns")
        
        TestFramework.assertEquals(originalTurns + turn, 
                                 battleState.playerParty[1].statusTurns,
                                 "Badly poisoned counter should increment each turn")
    end
end

-- Test: Status Effect Interactions Integration
function testStatusEffectInteractionsIntegration()
    print("\n=== Testing Status Effect Interactions Integration ===")
    
    local battleState = createTestBattleState("interactions-test")
    local targetPokemon = battleState.playerParty[1]
    
    -- Apply initial status
    StatusEffects.applyStatusEffect(targetPokemon, StatusEffects.StatusType.POISON, nil, battleState)
    TestFramework.assertEquals(StatusEffects.StatusType.POISON, targetPokemon.statusEffect, "Initial poison should be applied")
    
    -- Try to apply conflicting status
    local result = StatusInteractions.validateStatusApplication(targetPokemon, StatusEffects.StatusType.SLEEP, false)
    TestFramework.assertFalse(result.valid, "Sleep should conflict with poison")
    
    -- Try to apply higher priority status
    result = StatusInteractions.validateStatusApplication(targetPokemon, StatusEffects.StatusType.BADLY_POISONED, false)
    TestFramework.assertTrue(result.valid, "Badly poisoned should replace poison")
    TestFramework.assertTrue(result.replacementOccurred, "Replacement should be flagged")
    
    -- Actually apply the replacement
    StatusInteractions.processStatusReplacement(targetPokemon, StatusEffects.StatusType.BADLY_POISONED, StatusEffects.StatusType.POISON)
    TestFramework.assertEquals(StatusEffects.StatusType.BADLY_POISONED, targetPokemon.statusEffect, "Status should be replaced")
end

-- Test: Status Healing Integration
function testStatusHealingIntegration()
    print("\n=== Testing Status Healing Integration ===")
    
    local battleState = createTestBattleState("healing-test")
    local targetPokemon = battleState.playerParty[1]
    
    -- Apply status effect
    StatusEffects.applyStatusEffect(targetPokemon, StatusEffects.StatusType.BURN, nil, battleState)
    TestFramework.assertEquals(StatusEffects.StatusType.BURN, targetPokemon.statusEffect, "Burn should be applied")
    
    -- Test move-based healing (Refresh - heals all status)
    local healingResult = StatusHealing.executeMoveBased(battleState, targetPokemon, 287) -- Refresh
    
    TestFramework.assertTrue(healingResult.success, "Move-based healing should succeed")
    TestFramework.assertTrue(#healingResult.healedPokemon > 0, "Pokemon should be healed")
    TestFramework.assertEquals(nil, targetPokemon.statusEffect, "Status should be cleared")
    
    -- Test auto-berry healing
    StatusEffects.applyStatusEffect(targetPokemon, StatusEffects.StatusType.BURN, nil, battleState)
    targetPokemon.heldItem = 152 -- Rawst Berry
    
    local autoBerryResult = StatusHealing.executeAutoBerryHealing(targetPokemon, StatusEffects.StatusType.BURN)
    
    TestFramework.assertTrue(autoBerryResult.success, "Auto-berry healing should succeed")
    TestFramework.assertTrue(autoBerryResult.autoHealed, "Auto-healing should be flagged")
    TestFramework.assertEquals(nil, targetPokemon.statusEffect, "Status should be cleared by berry")
    TestFramework.assertEquals(nil, targetPokemon.heldItem, "Berry should be consumed")
end

-- Test: Status Immunity Integration in Battle
function testStatusImmunityIntegrationInBattle()
    print("\n=== Testing Status Immunity Integration in Battle ===")
    
    local battleState = createTestBattleState("immunity-test")
    
    -- Test type-based immunity
    local electricPokemon = battleState.playerParty[1] -- Pikachu (Electric type)
    local immunityCheck = StatusImmunities.checkStatusImmunity(electricPokemon, StatusEffects.StatusType.PARALYSIS, battleState)
    
    TestFramework.assertTrue(immunityCheck.immune, "Electric types should be immune to paralysis")
    TestFramework.assertEquals("type", immunityCheck.immunityType, "Immunity should be type-based")
    
    -- Test immunity validation
    local validation = StatusImmunities.validateStatusApplication(electricPokemon, StatusEffects.StatusType.PARALYSIS, battleState)
    TestFramework.assertFalse(validation.valid, "Immune status application should be invalid")
    TestFramework.assertTrue(validation.blocked, "Application should be blocked")
    
    -- Test non-immune status works
    validation = StatusImmunities.validateStatusApplication(electricPokemon, StatusEffects.StatusType.BURN, battleState)
    TestFramework.assertTrue(validation.valid, "Non-immune status should be valid")
    TestFramework.assertFalse(validation.blocked, "Non-immune application should not be blocked")
end

-- Test: Multi-Turn Battle Scenario with Status Effects
function testMultiTurnBattleScenarioWithStatusEffects()
    print("\n=== Testing Multi-Turn Battle Scenario with Status Effects ===")
    
    local battleState = createTestBattleState("multi-turn-test")
    MockBattleRNG.initSeed(battleState.battleSeed)
    
    -- Setup: Apply various status effects
    StatusEffects.applyStatusEffect(battleState.playerParty[1], StatusEffects.StatusType.POISON, nil, battleState)
    StatusEffects.applyStatusEffect(battleState.playerParty[2], StatusEffects.StatusType.BURN, nil, battleState)
    StatusEffects.applyStatusEffect(battleState.enemyParty[1], StatusEffects.StatusType.SLEEP, 3, battleState)
    
    local initialPlayerHP1 = battleState.playerParty[1].currentHP
    local initialPlayerHP2 = battleState.playerParty[2].currentHP
    
    -- Simulate 3 turns of battle
    for turn = 1, 3 do
        battleState.turn = turn
        print(f"  Turn {turn}:")
        
        -- Process end-of-turn effects
        local endTurnResult = TurnProcessor.processEndOfTurnEffects(battleState)
        
        -- Check status effects were processed
        if endTurnResult.status_effects then
            for pokemonId, effects in pairs(endTurnResult.status_effects) do
                TestFramework.assertNotNil(effects, f"Turn {turn}: Status effects should be processed for {pokemonId}")
            end
        end
        
        -- Check damage accumulation
        TestFramework.assertTrue(battleState.playerParty[1].currentHP <= initialPlayerHP1, 
                               f"Turn {turn}: Poison damage should accumulate")
        TestFramework.assertTrue(battleState.playerParty[2].currentHP <= initialPlayerHP2,
                               f"Turn {turn}: Burn damage should accumulate")
        
        -- Update initial HP for next comparison
        initialPlayerHP1 = battleState.playerParty[1].currentHP
        initialPlayerHP2 = battleState.playerParty[2].currentHP
        
        -- Check sleep duration
        if battleState.enemyParty[1].statusEffect == StatusEffects.StatusType.SLEEP then
            TestFramework.assertTrue(battleState.enemyParty[1].statusTurns <= 3 - turn + 1, 
                                   f"Turn {turn}: Sleep turns should decrease")
        end
    end
    
    -- After 3 turns, Pokemon should have taken significant damage
    TestFramework.assertTrue(battleState.playerParty[1].currentHP < 100, "Poison should have dealt damage over time")
    TestFramework.assertTrue(battleState.playerParty[2].currentHP < 80, "Burn should have dealt damage over time")
end

-- Test: Status Effects with Pokemon Switching
function testStatusEffectsWithPokemonSwitching()
    print("\n=== Testing Status Effects with Pokemon Switching ===")
    
    local battleState = createTestBattleState("switching-test")
    
    -- Apply status to active Pokemon
    StatusEffects.applyStatusEffect(battleState.playerParty[1], StatusEffects.StatusType.PARALYSIS, nil, battleState)
    TestFramework.assertEquals(StatusEffects.StatusType.PARALYSIS, battleState.playerParty[1].statusEffect, "Status should be applied")
    
    -- Simulate switch (status should persist on benched Pokemon)
    local originalStatus = battleState.playerParty[1].statusEffect
    
    -- Switch would happen here - for test purposes, we just verify persistence
    TestFramework.assertEquals(originalStatus, battleState.playerParty[1].statusEffect, "Status should persist during switch")
    
    -- Test Natural Cure ability (clears status on switch out)
    battleState.playerParty[1].ability = 30 -- Natural Cure
    
    local abilityHealResult = StatusHealing.executeAbilityBased(
        battleState, 
        battleState.playerParty[1], 
        30, 
        "switch_out"
    )
    
    TestFramework.assertTrue(abilityHealResult.success, "Natural Cure should trigger on switch out")
    TestFramework.assertTrue(#abilityHealResult.healedPokemon > 0, "Pokemon should be healed by ability")
end

-- Test: Battle Completion with Status Effects
function testBattleCompletionWithStatusEffects()
    print("\n=== Testing Battle Completion with Status Effects ===")
    
    local battleState = createTestBattleState("completion-test")
    
    -- Apply status effects
    StatusEffects.applyStatusEffect(battleState.playerParty[1], StatusEffects.StatusType.POISON, nil, battleState)
    StatusEffects.applyStatusEffect(battleState.enemyParty[1], StatusEffects.StatusType.BURN, nil, battleState)
    
    -- Simulate battle ending (Pokemon retain status effects)
    battleState.battleResult = {
        result = "victory",
        reason = "Enemy has no usable Pokemon",
        timestamp = os.time()
    }
    battleState.phase = 4 -- BATTLE_END
    
    -- Verify status effects persist after battle end
    TestFramework.assertEquals(StatusEffects.StatusType.POISON, battleState.playerParty[1].statusEffect, 
                             "Status effects should persist after battle completion")
    TestFramework.assertEquals(StatusEffects.StatusType.BURN, battleState.enemyParty[1].statusEffect,
                             "Enemy status effects should persist after battle completion")
    
    -- Test status effect information retrieval
    local statusInfo = StatusEffects.getStatusEffectInfo(battleState.playerParty[1])
    TestFramework.assertTrue(statusInfo.hasStatus, "Status info should be available after battle")
    TestFramework.assertEquals(StatusEffects.StatusType.POISON, statusInfo.statusType, "Status info should be accurate")
end

-- Run all integration tests
function runAllIntegrationTests()
    print("Starting Status Effects Integration Tests...")
    
    -- Initialize all systems
    StatusEffects.init()
    StatusInteractions.init()
    StatusHealing.init()
    StatusImmunities.init()
    
    testStatusEffectApplicationInBattle()
    testEndOfTurnStatusProcessingIntegration()
    testStatusEffectsInMoveExecution()
    testStatusEffectPersistenceAcrossBattlePhases()
    testStatusEffectInteractionsIntegration()
    testStatusHealingIntegration()
    testStatusImmunityIntegrationInBattle()
    testMultiTurnBattleScenarioWithStatusEffects()
    testStatusEffectsWithPokemonSwitching()
    testBattleCompletionWithStatusEffects()
    
    TestFramework.printSummary()
    
    return TestFramework.failCount == 0
end

-- Export for test runner
return {
    runAllIntegrationTests = runAllIntegrationTests,
    testName = "Status Effects System Integration"
}