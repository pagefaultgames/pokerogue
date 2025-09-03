--[[
Unit Tests for Berry Activation Manager
Tests berry trigger monitoring and timing within battle system

Test Coverage:
- Battle turn integration for berry activation checks
- HP monitoring system triggering berry activation at correct thresholds
- Status effect monitoring triggering status-curing berries immediately
- Stat reduction monitoring for stat-boosting berry triggers
- Berry consumption workflow removing berries after activation
- Berry recycling system through moves (Recycle) and abilities (Harvest)
- Activation priority system for multiple berry triggers

Behavioral Parity Testing:
- All berry activation calculations must match TypeScript implementation exactly
- Berry activation and timing must be deterministic and reproducible
--]]

local TestFramework = require("tests.test-framework")
local BerryActivationManager = require("game-logic.items.berry-activation-manager")
local BerryDatabase = require("data.items.berry-database")

local tests = {}

-- Test battle state initialization
function tests.testInitializeBattleState()
    local battleId = "test_battle_001"
    
    -- Test successful initialization
    local success = BerryActivationManager.initializeBattleState(battleId)
    TestFramework.assertTrue(success, "Battle state should initialize successfully")
    
    local state = BerryActivationManager.getBattleState(battleId)
    TestFramework.assertNotNil(state, "Battle state should exist after initialization")
    TestFramework.assertNotNil(state.activatedBerries, "Should have activatedBerries table")
    TestFramework.assertNotNil(state.activationQueue, "Should have activationQueue table")
    TestFramework.assertNotNil(state.recycledBerries, "Should have recycledBerries table")
    TestFramework.assertNotNil(state.turnActivations, "Should have turnActivations table")
    
    -- Test invalid battleId
    success = BerryActivationManager.initializeBattleState(nil)
    TestFramework.assertFalse(success, "Should fail with nil battleId")
    
    -- Clean up
    BerryActivationManager.clearBattleState(battleId)
end

-- Test battle state cleanup
function tests.testClearBattleState()
    local battleId = "test_battle_002"
    
    -- Initialize then clear
    BerryActivationManager.initializeBattleState(battleId)
    local success = BerryActivationManager.clearBattleState(battleId)
    TestFramework.assertTrue(success, "Battle state should clear successfully")
    
    local state = BerryActivationManager.getBattleState(battleId)
    TestFramework.assertNil(state, "Battle state should not exist after clearing")
end

-- Test HP change monitoring
function tests.testMonitorHpChange()
    local battleId = "test_battle_003"
    BerryActivationManager.initializeBattleState(battleId)
    
    local pokemon = {
        id = "pokemon_001",
        hp = 49,
        maxHp = 100,
        heldItem = "SITRUS_BERRY"
    }
    
    -- Test successful HP threshold activation (Sitrus Berry at 50% HP)
    local result = BerryActivationManager.monitorHpChange(battleId, pokemon, 60)
    TestFramework.assertTrue(result.success, "Should queue activation when crossing 50% threshold")
    
    -- Test no activation when not crossing threshold
    pokemon.hp = 60
    result = BerryActivationManager.monitorHpChange(battleId, pokemon, 65)
    TestFramework.assertFalse(result.success, "Should not activate when not crossing threshold")
    
    -- Test 25% HP threshold (Liechi Berry)
    pokemon.heldItem = "LIECHI_BERRY"
    pokemon.hp = 24
    result = BerryActivationManager.monitorHpChange(battleId, pokemon, 30)
    TestFramework.assertTrue(result.success, "Should queue activation when crossing 25% threshold")
    
    -- Test invalid parameters
    result = BerryActivationManager.monitorHpChange(nil, pokemon, 50)
    TestFramework.assertFalse(result.success, "Should fail with nil battleId")
    
    result = BerryActivationManager.monitorHpChange(battleId, nil, 50)
    TestFramework.assertFalse(result.success, "Should fail with nil pokemon")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Test status change monitoring
function tests.testMonitorStatusChange()
    local battleId = "test_battle_004"
    BerryActivationManager.initializeBattleState(battleId)
    
    local pokemon = {
        id = "pokemon_001",
        hp = 80,
        maxHp = 100,
        heldItem = "CHERI_BERRY"
    }
    
    -- Test successful status activation (Cheri Berry for paralysis)
    local result = BerryActivationManager.monitorStatusChange(battleId, pokemon, "paralysis")
    TestFramework.assertTrue(result.success, "Should queue activation for matching status condition")
    
    -- Test no activation for wrong status
    result = BerryActivationManager.monitorStatusChange(battleId, pokemon, "burn")
    TestFramework.assertFalse(result.success, "Should not activate for non-matching status")
    
    -- Test Lum Berry (cures any status)
    pokemon.heldItem = "LUM_BERRY"
    result = BerryActivationManager.monitorStatusChange(battleId, pokemon, "sleep")
    TestFramework.assertTrue(result.success, "Lum Berry should activate for any status")
    
    -- Test invalid parameters
    result = BerryActivationManager.monitorStatusChange(battleId, pokemon, nil)
    TestFramework.assertFalse(result.success, "Should fail with nil status condition")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Test stat change monitoring
function tests.testMonitorStatChange()
    local battleId = "test_battle_005"
    BerryActivationManager.initializeBattleState(battleId)
    
    local pokemon = {
        id = "pokemon_001",
        hp = 80,
        maxHp = 100,
        heldItem = "WHITE_HERB"
    }
    
    local statChanges = {
        attack = -1,
        defense = 0,
        speed = 1
    }
    
    -- Test successful stat activation (White Herb for lowered stats)
    local result = BerryActivationManager.monitorStatChange(battleId, pokemon, statChanges)
    TestFramework.assertTrue(result.success, "Should queue activation when stats are lowered")
    
    -- Test no activation when no stats lowered
    statChanges = {
        attack = 0,
        defense = 1,
        speed = 2
    }
    
    result = BerryActivationManager.monitorStatChange(battleId, pokemon, statChanges)
    TestFramework.assertFalse(result.success, "Should not activate when no stats are lowered")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Test super-effective hit monitoring
function tests.testMonitorSuperEffectiveHit()
    local battleId = "test_battle_006"
    BerryActivationManager.initializeBattleState(battleId)
    
    local pokemon = {
        id = "pokemon_001",
        hp = 80,
        maxHp = 100,
        heldItem = "OCCA_BERRY",
        types = {"grass"}
    }
    
    -- Test successful type-resist berry activation
    local result = BerryActivationManager.monitorSuperEffectiveHit(
        battleId, pokemon, "fire", 2.0, 60
    )
    TestFramework.assertTrue(result.success, "Should queue activation for super-effective Fire move")
    
    -- Test no activation for non-matching type
    result = BerryActivationManager.monitorSuperEffectiveHit(
        battleId, pokemon, "water", 2.0, 60
    )
    TestFramework.assertFalse(result.success, "Should not activate for non-matching move type")
    
    -- Test no activation for non-super-effective move
    result = BerryActivationManager.monitorSuperEffectiveHit(
        battleId, pokemon, "fire", 1.0, 30
    )
    TestFramework.assertFalse(result.success, "Should not activate for non-super-effective moves")
    
    -- Test Enigma Berry (any super-effective hit)
    pokemon.heldItem = "ENIGMA_BERRY"
    result = BerryActivationManager.monitorSuperEffectiveHit(
        battleId, pokemon, "water", 2.0, 60
    )
    TestFramework.assertTrue(result.success, "Enigma Berry should activate for any super-effective hit")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Test PP depletion monitoring
function tests.testMonitorPpDepletion()
    local battleId = "test_battle_007"
    BerryActivationManager.initializeBattleState(battleId)
    
    local pokemon = {
        id = "pokemon_001",
        hp = 80,
        maxHp = 100,
        heldItem = "LEPPA_BERRY"
    }
    
    -- Test successful PP depletion activation
    local result = BerryActivationManager.monitorPpDepletion(battleId, pokemon, "tackle")
    TestFramework.assertTrue(result.success, "Should queue activation when move PP is depleted")
    
    -- Test no activation without Leppa Berry
    pokemon.heldItem = "ORAN_BERRY"
    result = BerryActivationManager.monitorPpDepletion(battleId, pokemon, "tackle")
    TestFramework.assertFalse(result.success, "Should not activate without Leppa Berry")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Test activation queue management
function tests.testQueueBerryActivation()
    local battleId = "test_battle_008"
    BerryActivationManager.initializeBattleState(battleId)
    
    local pokemon = {
        id = "pokemon_001",
        hp = 80,
        maxHp = 100,
        heldItem = "SITRUS_BERRY"
    }
    
    local context = {
        trigger = "hp_threshold",
        previousHp = 60,
        currentHp = 49
    }
    
    -- Test successful queuing
    local result = BerryActivationManager.queueBerryActivation(battleId, pokemon, context)
    TestFramework.assertTrue(result.success, "Should successfully queue berry activation")
    TestFramework.assertNotNil(result.activation, "Should return activation data")
    
    -- Verify activation is in queue
    local state = BerryActivationManager.getBattleState(battleId)
    TestFramework.assertEqual(#state.activationQueue, 1, "Should have one queued activation")
    TestFramework.assertEqual(state.activationQueue[1].pokemonId, "pokemon_001", "Should queue correct Pokemon")
    TestFramework.assertEqual(state.activationQueue[1].berryId, "SITRUS_BERRY", "Should queue correct berry")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Test activation priority system
function tests.testGetActivationPriority()
    -- Test priority order: Status cure > HP restore > Stat boost > Damage reduce > PP restore
    local statusPriority = BerryActivationManager.getActivationPriority("CHERI_BERRY", {})
    local hpPriority = BerryActivationManager.getActivationPriority("SITRUS_BERRY", {})
    local statPriority = BerryActivationManager.getActivationPriority("LIECHI_BERRY", {})
    local damagePriority = BerryActivationManager.getActivationPriority("OCCA_BERRY", {})
    local ppPriority = BerryActivationManager.getActivationPriority("LEPPA_BERRY", {})
    
    TestFramework.assertTrue(statusPriority > hpPriority, "Status cure should have higher priority than HP restore")
    TestFramework.assertTrue(hpPriority > statPriority, "HP restore should have higher priority than stat boost")
    TestFramework.assertTrue(statPriority > damagePriority, "Stat boost should have higher priority than damage reduce")
    TestFramework.assertTrue(damagePriority > ppPriority, "Damage reduce should have higher priority than PP restore")
    
    -- Test unknown berry
    local unknownPriority = BerryActivationManager.getActivationPriority("INVALID_BERRY", {})
    TestFramework.assertEqual(unknownPriority, 0, "Unknown berry should have priority 0")
end

-- Test berry recycling
function tests.testRecycleBerry()
    local battleId = "test_battle_009"
    BerryActivationManager.initializeBattleState(battleId)
    
    local state = BerryActivationManager.getBattleState(battleId)
    
    -- Add consumed berry to recycled berries
    table.insert(state.recycledBerries, {
        berryId = "ORAN_BERRY",
        pokemonId = "pokemon_001",
        consumedTurn = 1
    })
    
    -- Test successful recycling
    local result = BerryActivationManager.recycleBerry(battleId, "pokemon_001", "move")
    TestFramework.assertTrue(result.success, "Should successfully recycle berry")
    TestFramework.assertEqual(result.berryId, "ORAN_BERRY", "Should return correct berry ID")
    TestFramework.assertEqual(result.recycleType, "move", "Should return correct recycle type")
    
    -- Verify berry was removed from recycled list
    TestFramework.assertEqual(#state.recycledBerries, 0, "Recycled berry should be removed from list")
    
    -- Test no berries available for recycling
    result = BerryActivationManager.recycleBerry(battleId, "pokemon_001", "ability")
    TestFramework.assertFalse(result.success, "Should fail when no berries available for recycling")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Test turn summary generation
function tests.testGetTurnSummary()
    local battleId = "test_battle_010"
    BerryActivationManager.initializeBattleState(battleId)
    
    local state = BerryActivationManager.getBattleState(battleId)
    
    -- Add sample data
    state.turnActivations = {
        {
            pokemonId = "pokemon_001",
            berryId = "SITRUS_BERRY",
            effect = "heal"
        }
    }
    
    state.activatedBerries = {
        OCCA_BERRY = true
    }
    
    state.recycledBerries = {
        {
            berryId = "ORAN_BERRY",
            pokemonId = "pokemon_002",
            consumedTurn = 1
        }
    }
    
    -- Test turn summary
    local summary = BerryActivationManager.getTurnSummary(battleId)
    TestFramework.assertTrue(summary.success, "Should successfully get turn summary")
    TestFramework.assertEqual(#summary.activations, 1, "Should report turn activations")
    TestFramework.assertNotNil(summary.activatedThisBattle, "Should report battle-wide activations")
    TestFramework.assertEqual(#summary.availableForRecycling, 1, "Should report available recycled berries")
    TestFramework.assertEqual(summary.queuedActivations, 0, "Should report queued activations count")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Test berry activation manager validation
function tests.testValidate()
    local valid, errors = BerryActivationManager.validate()
    
    if valid then
        TestFramework.assertTrue(valid, "Berry activation manager should validate successfully")
    else
        print("Validation errors found:")
        for _, error in ipairs(errors or {}) do
            print("  - " .. error)
        end
        TestFramework.assertTrue(false, "Berry activation manager validation failed")
    end
end

-- Test edge cases and error handling
function tests.testEdgeCases()
    -- Test with invalid battle IDs
    local result = BerryActivationManager.getBattleState("invalid_battle")
    TestFramework.assertNil(result, "Should return nil for invalid battle ID")
    
    result = BerryActivationManager.getTurnSummary("invalid_battle")
    TestFramework.assertFalse(result.success, "Should fail for invalid battle ID")
    
    -- Test clearing non-existent battle state
    local success = BerryActivationManager.clearBattleState("invalid_battle")
    TestFramework.assertFalse(success, "Should fail when clearing non-existent battle")
    
    -- Test recycling with no consumed berries
    local battleId = "test_edge_case"
    BerryActivationManager.initializeBattleState(battleId)
    
    result = BerryActivationManager.recycleBerry(battleId, "pokemon_001", "move")
    TestFramework.assertFalse(result.success, "Should fail when no berries consumed")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Run all tests
function tests.runAllTests()
    print("\n=== Berry Activation Manager Unit Tests ===")
    
    local testFunctions = {
        tests.testInitializeBattleState,
        tests.testClearBattleState,
        tests.testMonitorHpChange,
        tests.testMonitorStatusChange,
        tests.testMonitorStatChange,
        tests.testMonitorSuperEffectiveHit,
        tests.testMonitorPpDepletion,
        tests.testQueueBerryActivation,
        tests.testGetActivationPriority,
        tests.testRecycleBerry,
        tests.testGetTurnSummary,
        tests.testValidate,
        tests.testEdgeCases
    }
    
    TestFramework.runTests(testFunctions, "Berry Activation Manager")
end

return tests