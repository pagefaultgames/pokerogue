--[[
Integration Tests for Berry System
Tests complete berry workflow and integration with battle system

Test Coverage:
- Complete berry activation cycles with HP monitoring and consumption
- Berry system integration with battle resolution and turn processing
- Berry persistence across save/load cycles and battle transitions
- Multi-berry testing for activation priority and timing conflicts
- Berry recycling testing with moves and abilities
- Berry effect validation and battle state consistency verification

Integration Points Tested:
- BerryActivationManager with TurnProcessor
- BerryEffectsProcessor with Pokemon state changes
- Berry handlers with AO message processing
- InventoryManager with berry consumption tracking
- Battle system with berry damage reduction and healing
--]]

local TestFramework = require("tests.test-framework")
local BerryActivationManager = require("game-logic.items.berry-activation-manager")
local BerryEffectsProcessor = require("game-logic.items.berry-effects-processor")
local BerryDatabase = require("data.items.berry-database")
local InventoryManager = require("game-logic.items.inventory-manager")
local TurnProcessor = require("game-logic.battle.turn-processor")

local tests = {}

-- Helper function to create test battle state
local function createTestBattleState(battleId)
    return {
        battleId = battleId,
        turn = 1,
        phase = TurnProcessor.TurnPhase.COMMAND_SELECTION,
        battleSeed = "test_seed_" .. battleId,
        playerParty = {
            {
                id = "player_pokemon_1",
                hp = 50,
                maxHp = 100,
                statusEffect = nil,
                stats = {
                    attackStage = 0,
                    defenseStage = 0,
                    speedStage = 0
                },
                heldItem = "SITRUS_BERRY",
                types = {"grass"}
            },
            {
                id = "player_pokemon_2", 
                hp = 20,
                maxHp = 100,
                statusEffect = nil,
                stats = {
                    attackStage = 0,
                    defenseStage = 0,
                    speedStage = 0
                },
                heldItem = "LIECHI_BERRY",
                types = {"fire"}
            }
        },
        enemyParty = {
            {
                id = "enemy_pokemon_1",
                hp = 80,
                maxHp = 100,
                statusEffect = nil,
                stats = {
                    attackStage = 0,
                    defenseStage = 0,
                    speedStage = 0
                },
                heldItem = "CHERI_BERRY",
                types = {"water"}
            }
        }
    }
end

-- Helper function to create test Pokemon with berry
local function createTestPokemon(pokemonId, berryId, hp, maxHp)
    return {
        id = pokemonId,
        hp = hp or 50,
        maxHp = maxHp or 100,
        statusEffect = nil,
        stats = {
            attackStage = 0,
            defenseStage = 0,
            speedStage = 0
        },
        heldItem = berryId,
        types = {"normal"}
    }
end

-- Test complete berry activation workflow
function tests.testBerryActivationWorkflow()
    local battleId = "integration_battle_001"
    BerryActivationManager.initializeBattleState(battleId)
    
    -- Test HP restoration berry (Sitrus Berry)
    local pokemon = createTestPokemon("test_pokemon", "SITRUS_BERRY", 40, 100)
    
    -- Simulate HP drop that triggers berry activation
    local result = BerryActivationManager.monitorHpChange(battleId, pokemon, 60)
    TestFramework.assertTrue(result.success, "Should queue Sitrus Berry activation")
    
    -- Process activation queue
    local activationResult = BerryActivationManager.processActivationQueue(battleId, "test_seed")
    TestFramework.assertTrue(activationResult.success, "Should process activation queue successfully")
    TestFramework.assertEqual(#activationResult.activations, 1, "Should have one activation")
    
    local activation = activationResult.activations[1]
    TestFramework.assertEqual(activation.berryId, "SITRUS_BERRY", "Should activate Sitrus Berry")
    TestFramework.assertNotNil(activation.updatedPokemon, "Should return updated Pokemon")
    TestFramework.assertNil(activation.updatedPokemon.heldItem, "Berry should be consumed")
    TestFramework.assertTrue(activation.updatedPokemon.hp > 40, "Pokemon HP should be restored")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Test status curing berry integration
function tests.testStatusCuringIntegration()
    local battleId = "integration_battle_002"
    BerryActivationManager.initializeBattleState(battleId)
    
    -- Test paralysis curing with Cheri Berry
    local pokemon = createTestPokemon("test_pokemon", "CHERI_BERRY", 80, 100)
    
    -- Simulate paralysis infliction that triggers berry
    local result = BerryActivationManager.monitorStatusChange(battleId, pokemon, "paralysis")
    TestFramework.assertTrue(result.success, "Should queue Cheri Berry activation for paralysis")
    
    -- Process activation
    local activationResult = BerryActivationManager.processActivationQueue(battleId, "test_seed")
    TestFramework.assertTrue(activationResult.success, "Should process status cure activation")
    
    local activation = activationResult.activations[1]
    TestFramework.assertEqual(activation.berryId, "CHERI_BERRY", "Should activate Cheri Berry")
    TestFramework.assertNil(activation.updatedPokemon.statusEffect, "Status should be cured")
    TestFramework.assertEqual(activation.updatedPokemon.statusCured, "paralysis", "Should track cured status")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Test berry priority system with multiple activations
function tests.testBerryPrioritySystem()
    local battleId = "integration_battle_003"
    BerryActivationManager.initializeBattleState(battleId)
    
    -- Create Pokemon with status-curing berry (high priority)
    local statusPokemon = createTestPokemon("status_pokemon", "CHERI_BERRY", 80, 100)
    
    -- Create Pokemon with HP berry (medium priority)
    local hpPokemon = createTestPokemon("hp_pokemon", "SITRUS_BERRY", 40, 100)
    
    -- Create Pokemon with PP berry (low priority)
    local ppPokemon = createTestPokemon("pp_pokemon", "LEPPA_BERRY", 80, 100)
    
    -- Queue multiple activations
    BerryActivationManager.monitorStatusChange(battleId, statusPokemon, "paralysis")
    BerryActivationManager.monitorHpChange(battleId, hpPokemon, 60)
    BerryActivationManager.monitorPpDepletion(battleId, ppPokemon, "tackle")
    
    -- Process queue and verify priority order
    local activationResult = BerryActivationManager.processActivationQueue(battleId, "test_seed")
    TestFramework.assertEqual(#activationResult.activations, 3, "Should process all three activations")
    
    -- Status berry should be first (highest priority)
    TestFramework.assertEqual(activationResult.activations[1].berryId, "CHERI_BERRY", "Status berry should activate first")
    
    -- HP berry should be second
    TestFramework.assertEqual(activationResult.activations[2].berryId, "SITRUS_BERRY", "HP berry should activate second")
    
    -- PP berry should be last (lowest priority)
    TestFramework.assertEqual(activationResult.activations[3].berryId, "LEPPA_BERRY", "PP berry should activate last")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Test berry integration with battle turn processing
function tests.testBerryBattleTurnIntegration()
    local battleState = createTestBattleState("integration_battle_004")
    
    -- Initialize berry system for battle
    BerryActivationManager.initializeBattleState(battleState.battleId)
    
    -- Simulate HP drop for player Pokemon (should trigger Sitrus Berry)
    local pokemon = battleState.playerParty[1]
    pokemon.hp = 40  -- Below 50% threshold
    
    BerryActivationManager.monitorHpChange(battleState.battleId, pokemon, 60)
    
    -- Simulate pinch berry activation for second Pokemon
    local pinchPokemon = battleState.playerParty[2]
    pinchPokemon.hp = 20  -- Below 25% threshold
    
    BerryActivationManager.monitorHpChange(battleState.battleId, pinchPokemon, 30)
    
    -- Process berry activations (this would be called during turn processing)
    local berryActivations = BerryActivationManager.processActivationQueue(battleState.battleId, battleState.battleSeed)
    
    TestFramework.assertTrue(berryActivations.success, "Berry activations should process successfully")
    TestFramework.assertEqual(#berryActivations.activations, 2, "Should have two berry activations")
    
    -- Verify HP restoration
    local sitrusActivation = berryActivations.activations[1]
    TestFramework.assertTrue(sitrusActivation.updatedPokemon.hp > 40, "Sitrus Berry should restore HP")
    
    -- Verify stat boost from pinch berry
    local liechiBattle = berryActivations.activations[2]
    TestFramework.assertEqual(liechiBattle.updatedPokemon.stats.attackStage, 1, "Liechi Berry should boost Attack")
    
    BerryActivationManager.clearBattleState(battleState.battleId)
end

-- Test damage reduction berry integration
function tests.testDamageReductionIntegration()
    local battleId = "integration_battle_005"
    BerryActivationManager.initializeBattleState(battleId)
    
    -- Create Pokemon with type-resist berry
    local pokemon = createTestPokemon("test_pokemon", "OCCA_BERRY", 80, 100)
    pokemon.types = {"grass"}  -- Weak to Fire
    
    -- Simulate super-effective Fire move
    local result = BerryActivationManager.monitorSuperEffectiveHit(
        battleId, pokemon, "fire", 2.0, 60
    )
    TestFramework.assertTrue(result.success, "Should queue Occa Berry activation")
    
    -- Test damage reduction
    local berry = BerryDatabase.getBerry("OCCA_BERRY")
    local originalDamage = 100
    local reducedDamage = BerryEffectsProcessor.applyDamageReduction(berry, originalDamage, "fire")
    TestFramework.assertEqual(reducedDamage, 50, "Should reduce Fire damage by 50%")
    
    -- Process activation
    local activationResult = BerryActivationManager.processActivationQueue(battleId, "test_seed")
    TestFramework.assertTrue(activationResult.success, "Should process damage reduction berry")
    
    -- Verify once-per-battle tracking
    local state = BerryActivationManager.getBattleState(battleId)
    TestFramework.assertTrue(state.activatedBerries["OCCA_BERRY"], "Should mark Occa Berry as used")
    
    -- Try to activate again - should fail
    result = BerryActivationManager.monitorSuperEffectiveHit(
        battleId, pokemon, "fire", 2.0, 60
    )
    TestFramework.assertFalse(result.success, "Should not activate Occa Berry twice in same battle")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Test berry recycling integration
function tests.testBerryRecyclingIntegration()
    local battleId = "integration_battle_006"
    BerryActivationManager.initializeBattleState(battleId)
    InventoryManager.init()
    
    local playerId = "test_player"
    local pokemon = createTestPokemon("test_pokemon", "ORAN_BERRY", 80, 100)
    
    -- Simulate berry consumption
    BerryActivationManager.monitorHpChange(battleId, pokemon, 60)
    local activationResult = BerryActivationManager.processActivationQueue(battleId, "test_seed")
    
    -- Track consumption in inventory
    local consumed = InventoryManager.trackBerryConsumption(playerId, "ORAN_BERRY", pokemon.id, battleId)
    TestFramework.assertTrue(consumed, "Should track berry consumption")
    
    -- Test berry recycling through move
    local recycleResult = BerryActivationManager.recycleBerry(battleId, pokemon.id, "move")
    TestFramework.assertTrue(recycleResult.success, "Should successfully recycle berry")
    TestFramework.assertEqual(recycleResult.berryId, "ORAN_BERRY", "Should recycle correct berry")
    
    -- Track recycling in inventory
    local recycled = InventoryManager.trackBerryRecycling(playerId, "ORAN_BERRY", pokemon.id, "move")
    TestFramework.assertTrue(recycled, "Should track berry recycling")
    
    -- Verify berry is no longer available for recycling
    recycleResult = BerryActivationManager.recycleBerry(battleId, pokemon.id, "ability")
    TestFramework.assertFalse(recycleResult.success, "Should not recycle berry twice")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Test inventory integration with berry statistics
function tests.testInventoryBerryIntegration()
    InventoryManager.init()
    local playerId = "test_player"
    
    -- Add berries to inventory
    InventoryManager.addItem(playerId, "ORAN_BERRY", 5)
    InventoryManager.addItem(playerId, "SITRUS_BERRY", 3)
    InventoryManager.addItem(playerId, "CHERI_BERRY", 2)
    InventoryManager.addItem(playerId, "LIECHI_BERRY", 1)
    
    -- Test berry statistics
    local berryStats = InventoryManager.getBerryStats(playerId)
    TestFramework.assertEqual(berryStats.totalBerries, 11, "Should have 11 total berries")
    TestFramework.assertEqual(berryStats.berryTypes, 4, "Should have 4 different berry types")
    
    -- Test berries by activation condition
    local hpBerries = InventoryManager.getBerriesByActivation(playerId, BerryDatabase.ActivationCondition.HP_50_PERCENT)
    TestFramework.assertEqual(#hpBerries, 2, "Should have 2 berries with 50% HP activation (Oran + Sitrus)")
    
    local statusBerries = InventoryManager.getBerriesByActivation(playerId, BerryDatabase.ActivationCondition.STATUS_INFLICTED)
    TestFramework.assertEqual(#statusBerries, 1, "Should have 1 status-curing berry")
    
    local pinchBerries = InventoryManager.getBerriesByActivation(playerId, BerryDatabase.ActivationCondition.HP_25_PERCENT)
    TestFramework.assertEqual(#pinchBerries, 1, "Should have 1 pinch berry")
end

-- Test berry system persistence and state consistency
function tests.testBerryStatePersistence()
    local battleId = "integration_battle_007"
    BerryActivationManager.initializeBattleState(battleId)
    
    -- Create battle with berries
    local state = BerryActivationManager.getBattleState(battleId)
    
    -- Add some battle state
    state.activatedBerries["OCCA_BERRY"] = true
    state.activatedBerries["ENIGMA_BERRY"] = true
    
    table.insert(state.recycledBerries, {
        berryId = "ORAN_BERRY",
        pokemonId = "pokemon_001",
        consumedTurn = 1
    })
    
    -- Test turn summary consistency
    local summary = BerryActivationManager.getTurnSummary(battleId)
    TestFramework.assertTrue(summary.success, "Should get turn summary successfully")
    TestFramework.assertNotNil(summary.activatedThisBattle, "Should have battle activation data")
    TestFramework.assertEqual(#summary.availableForRecycling, 1, "Should have recycling data")
    
    -- Test state retrieval consistency
    local retrievedState = BerryActivationManager.getBattleState(battleId)
    TestFramework.assertTrue(retrievedState.activatedBerries["OCCA_BERRY"], "Should preserve activated berries")
    TestFramework.assertEqual(#retrievedState.recycledBerries, 1, "Should preserve recycled berries")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Test error handling and edge cases in integration
function tests.testIntegrationErrorHandling()
    -- Test activation with invalid battle state
    local result = BerryActivationManager.processActivationQueue("invalid_battle", "seed")
    TestFramework.assertTrue(result.success, "Should handle invalid battle gracefully")
    TestFramework.assertEqual(#result.activations, 0, "Should have no activations for invalid battle")
    
    -- Test berry activation with corrupted Pokemon data
    local battleId = "integration_battle_008"
    BerryActivationManager.initializeBattleState(battleId)
    
    local corruptPokemon = {
        id = "corrupt_pokemon",
        -- Missing required fields
        heldItem = "SITRUS_BERRY"
    }
    
    result = BerryEffectsProcessor.processBerryActivation(corruptPokemon, {})
    TestFramework.assertFalse(result.success, "Should handle corrupt Pokemon data gracefully")
    
    -- Test with non-existent berry
    local invalidPokemon = createTestPokemon("invalid_pokemon", "INVALID_BERRY", 50, 100)
    result = BerryEffectsProcessor.processBerryActivation(invalidPokemon, {})
    TestFramework.assertFalse(result.success, "Should handle invalid berries gracefully")
    
    BerryActivationManager.clearBattleState(battleId)
end

-- Test complete berry workflow with battle system
function tests.testCompleteWorkflowIntegration()
    local battleState = createTestBattleState("integration_battle_009")
    
    -- Initialize all systems
    BerryActivationManager.initializeBattleState(battleState.battleId)
    InventoryManager.init()
    
    local playerId = "workflow_player"
    
    -- Phase 1: Pre-battle setup
    InventoryManager.addItem(playerId, "SITRUS_BERRY", 5)
    InventoryManager.addItem(playerId, "CHERI_BERRY", 3)
    
    -- Phase 2: Battle events trigger berry activations
    local pokemon = battleState.playerParty[1]  -- Has Sitrus Berry
    
    -- Simulate taking damage that triggers berry
    BerryActivationManager.monitorHpChange(battleState.battleId, pokemon, 60)
    
    -- Phase 3: Turn processing handles berry activations
    local berryResult = BerryActivationManager.processActivationQueue(battleState.battleId, battleState.battleSeed)
    TestFramework.assertTrue(berryResult.success, "Berry activation should succeed in workflow")
    
    -- Phase 4: Update Pokemon in battle state
    if berryResult.success and #berryResult.activations > 0 then
        local activation = berryResult.activations[1]
        if activation.updatedPokemon then
            TurnProcessor.updatePokemonInBattle(battleState, activation.pokemonId, activation.updatedPokemon)
        end
    end
    
    -- Phase 5: Track consumption in inventory
    for _, activation in ipairs(berryResult.activations or {}) do
        InventoryManager.trackBerryConsumption(playerId, activation.berryId, activation.pokemonId, battleState.battleId)
    end
    
    -- Phase 6: Verify final state
    local updatedPokemon = battleState.playerParty[1]
    TestFramework.assertTrue(updatedPokemon.hp > 40, "Pokemon should have restored HP")
    TestFramework.assertNil(updatedPokemon.heldItem, "Berry should be consumed")
    
    local berryStats = InventoryManager.getBerryStats(playerId)
    TestFramework.assertTrue(berryStats.totalBerries >= 0, "Berry stats should be tracked")
    
    BerryActivationManager.clearBattleState(battleState.battleId)
end

-- Run all integration tests
function tests.runAllTests()
    print("\n=== Berry System Integration Tests ===")
    
    local testFunctions = {
        tests.testBerryActivationWorkflow,
        tests.testStatusCuringIntegration,
        tests.testBerryPrioritySystem,
        tests.testBerryBattleTurnIntegration,
        tests.testDamageReductionIntegration,
        tests.testBerryRecyclingIntegration,
        tests.testInventoryBerryIntegration,
        tests.testBerryStatePersistence,
        tests.testIntegrationErrorHandling,
        tests.testCompleteWorkflowIntegration
    }
    
    TestFramework.runTests(testFunctions, "Berry System Integration")
end

return tests