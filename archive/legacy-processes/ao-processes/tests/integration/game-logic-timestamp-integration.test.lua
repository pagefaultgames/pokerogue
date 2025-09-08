--[[
Game Logic Timestamp Parameter Threading Integration Tests
Validates end-to-end timestamp parameter flow across updated components

Test Coverage:
- Cross-component timestamp parameter threading
- Economic system to battle participation integration
- Pokemon state management timestamp consistency
- Process coordination timestamp flow
- Battle management timestamp integration
--]]

local TestFramework = require('../framework/test-framework-enhanced')
local EconomicSystem = require('../../game-logic/items/economic-system')
local ParticipationTracker = require('../../game-logic/battle/participation-tracker')
local TurnProcessor = require('../../game-logic/battle/turn-processor')
local MoveManager = require('../../game-logic/pokemon/move-manager')
local PerformanceMonitor = require('../../game-logic/process-coordination/performance-monitor')

-- Test fixtures
local testTimestamp = 1625097600 -- Fixed test timestamp
local testPlayerId = "integration_test_player"
local testBattleId = "integration_test_battle"
local testItemId = "integration_test_item"
local testPokemonData = {
    id = "integration_pokemon_001",
    speciesId = 25,
    level = 50,
    moveset = {}
}

local function createIntegrationTimestampTests()
    local tests = {}
    
    -- Test 1: Economic System to Battle Participation Integration
    tests["test_economic_to_battle_timestamp_flow"] = function()
        local baseTimestamp = testTimestamp + 1000
        
        -- Record economic transaction with specific timestamp
        local success, message = EconomicSystem.recordItemPurchase(
            testPlayerId, testItemId, 5, 500, 10, baseTimestamp
        )
        TestFramework.assert(success, "Economic purchase should succeed: " .. (message or ""))
        
        -- Get player economics with same timestamp
        local playerEconomics = EconomicSystem.getPlayerEconomics(testPlayerId, baseTimestamp)
        TestFramework.assert(playerEconomics.lastTransactionTime == baseTimestamp,
            "Economic system should use provided timestamp")
        
        -- Initialize battle participation with timestamp
        local battleState = {
            participationData = {},
            playerParty = {testPokemonData},
            enemyParty = {{id = "enemy_001", name = "Enemy", level = 25}},
            activePlayer = {[1] = testPokemonData.id},
            activeEnemy = {[1] = "enemy_001"}
        }
        
        local initSuccess, initMessage = ParticipationTracker.init(battleState, baseTimestamp + 10)
        TestFramework.assert(initSuccess, "Participation tracker should initialize: " .. (initMessage or ""))
        
        -- Record battle start with timestamp
        local battleSuccess, battleMessage = ParticipationTracker.recordBattleStart(battleState, baseTimestamp + 20)
        TestFramework.assert(battleSuccess, "Battle start should be recorded: " .. (battleMessage or ""))
        
        -- Verify timestamp consistency across systems
        local pokemonData = battleState.participationData[testPokemonData.id]
        TestFramework.assert(pokemonData.battleStartTime == baseTimestamp + 10,
            "Battle start time should match initialization timestamp")
        TestFramework.assert(pokemonData.firstParticipation == baseTimestamp + 20,
            "First participation should match battle start timestamp")
    end
    
    -- Test 2: Battle Management Timestamp Integration
    tests["test_battle_management_timestamp_integration"] = function()
        local battleTimestamp = testTimestamp + 2000
        
        -- Create battle state with timestamp
        local battleState = {
            battleId = testBattleId,
            turn = 1,
            playerParty = {},
            enemyParty = {}
        }
        
        -- Execute battle action with timestamp
        local action = {
            type = "move",
            pokemonId = testPokemonData.id,
            pokemon = testPokemonData,
            moveId = "tackle"
        }
        
        local actionResult = TurnProcessor.executeAction(battleState, action, battleTimestamp)
        
        TestFramework.assert(actionResult.timestamp == battleTimestamp,
            "Action result should include provided timestamp")
        TestFramework.assert(type(actionResult.success) == "boolean",
            "Action result should include success status")
        
        -- Check battle end conditions with timestamp
        local battleEndResult = TurnProcessor.checkBattleEndConditions(battleState, battleTimestamp + 100)
        
        if battleEndResult then
            TestFramework.assert(battleEndResult.timestamp == battleTimestamp + 100,
                "Battle end result should include provided timestamp")
        end
    end
    
    -- Test 3: Pokemon State Management Timestamp Consistency
    tests["test_pokemon_state_timestamp_consistency"] = function()
        local pokemonTimestamp = testTimestamp + 3000
        
        -- Learn move with timestamp
        local learnResult = MoveManager.learnMove(
            testPokemonData, "thunderbolt", "LEVEL", {}, pokemonTimestamp
        )
        
        if learnResult and learnResult.success then
            -- Verify forgotten moves have correct timestamp
            if testPokemonData.forgottenMoves then
                for _, forgottenMove in ipairs(testPokemonData.forgottenMoves) do
                    TestFramework.assert(forgottenMove.forgottenAt == pokemonTimestamp,
                        "Forgotten move should have correct timestamp")
                end
            end
        end
        
        -- Test move forgetting with timestamp
        if #testPokemonData.moveset > 0 then
            local forgetResult = MoveManager.forgetMove(testPokemonData, 1, pokemonTimestamp + 50)
            
            if forgetResult and forgetResult.success and testPokemonData.forgottenMoves then
                local lastForgotten = testPokemonData.forgottenMoves[#testPokemonData.forgottenMoves]
                if lastForgotten then
                    TestFramework.assert(lastForgotten.forgottenAt == pokemonTimestamp + 50,
                        "Recently forgotten move should have correct timestamp")
                end
            end
        end
    end
    
    -- Test 4: Process Coordination Timestamp Integration
    tests["test_process_coordination_timestamp_integration"] = function()
        local coordinationTimestamp = testTimestamp + 4000
        
        -- Initialize performance monitor with timestamp
        local initSuccess = PerformanceMonitor.initialize(coordinationTimestamp)
        TestFramework.assert(initSuccess, "Performance monitor should initialize successfully")
        
        -- Start measurement with timestamp
        local measureSuccess, measureError = PerformanceMonitor.startMeasurement(
            "test_operation", "battle", "test_process", coordinationTimestamp + 10
        )
        TestFramework.assert(measureSuccess, "Measurement should start successfully: " .. (measureError or ""))
        
        -- Update throughput metrics with timestamp
        PerformanceMonitor.updateThroughputMetrics(coordinationTimestamp + 20)
        
        -- Cleanup with timestamp
        local cleanedCount = PerformanceMonitor.cleanupStaleMeasurements(coordinationTimestamp + 500)
        TestFramework.assert(type(cleanedCount) == "number", "Cleanup should return number of cleaned measurements")
    end
    
    -- Test 5: Cross-System Timestamp Propagation
    tests["test_cross_system_timestamp_propagation"] = function()
        local propagationTimestamp = testTimestamp + 5000
        
        -- Scenario: Player makes purchase, enters battle, Pokemon learns move, performance monitored
        
        -- 1. Economic transaction
        local purchaseSuccess = EconomicSystem.recordItemPurchase(
            "propagation_player", "test_item", 1, 100, 15, propagationTimestamp
        )
        TestFramework.assert(purchaseSuccess, "Purchase should succeed")
        
        -- 2. Battle participation
        local battleState = {
            participationData = {},
            playerParty = {{id = "prop_pokemon", level = 30}},
            enemyParty = {{id = "prop_enemy", level = 25}},
            activePlayer = {[1] = "prop_pokemon"},
            activeEnemy = {[1] = "prop_enemy"}
        }
        
        ParticipationTracker.init(battleState, propagationTimestamp + 10)
        ParticipationTracker.recordBattleStart(battleState, propagationTimestamp + 20)
        
        -- 3. Pokemon move learning
        local pokemon = {id = "prop_pokemon", moveset = {}, level = 30}
        MoveManager.learnMove(pokemon, "surf", "TM", {}, propagationTimestamp + 30)
        
        -- 4. Performance monitoring
        PerformanceMonitor.startMeasurement(
            "cross_system_test", "integration", "main", propagationTimestamp + 40
        )
        
        -- Verify all systems used consistent timestamp progression
        local playerEcon = EconomicSystem.getPlayerEconomics("propagation_player", propagationTimestamp + 50)
        local pokemonParticipation = battleState.participationData["prop_pokemon"]
        
        TestFramework.assert(playerEcon.lastTransactionTime == propagationTimestamp,
            "Economic system should maintain timestamp")
        TestFramework.assert(pokemonParticipation.battleStartTime == propagationTimestamp + 10,
            "Participation system should maintain timestamp")
        TestFramework.assert(pokemonParticipation.firstParticipation == propagationTimestamp + 20,
            "Battle start should maintain timestamp")
        
        -- Verify timestamp progression is logical
        TestFramework.assert(playerEcon.lastTransactionTime < pokemonParticipation.firstParticipation,
            "Timestamp progression should be logical across systems")
    end
    
    -- Test 6: Error Handling with Missing Timestamps
    tests["test_error_handling_missing_timestamps"] = function()
        -- All updated functions should handle missing timestamps gracefully
        
        -- Economic system with nil timestamp
        local success = EconomicSystem.recordItemPurchase(
            "error_test_player", "error_item", 1, 50, 1, nil
        )
        TestFramework.assert(success, "Economic system should handle nil timestamp")
        
        local economics = EconomicSystem.getPlayerEconomics("error_test_player", nil)
        TestFramework.assert(economics.lastTransactionTime == 0,
            "Missing timestamp should default to 0")
        
        -- Battle system with nil timestamp
        local battleState = {participationData = {}}
        local initSuccess = ParticipationTracker.init(battleState, nil)
        TestFramework.assert(initSuccess, "Participation tracker should handle nil timestamp")
        
        -- Pokemon system with nil timestamp
        local pokemon = {moveset = {}}
        local result = MoveManager.learnMove(pokemon, "tackle", "LEVEL", {}, nil)
        -- Should not crash, result depends on implementation
        TestFramework.assert(type(result) ~= "nil", "Move manager should handle nil timestamp")
    end
    
    return tests
end

-- Create test suite
local function runGameLogicTimestampIntegrationTests()
    local tests = createIntegrationTimestampTests()
    local results = {}
    
    print("\\n=== Running Game Logic Timestamp Parameter Integration Tests ===")
    
    for testName, testFunc in pairs(tests) do
        local success, error = pcall(testFunc)
        results[testName] = {
            passed = success,
            error = error
        }
        
        if success then
            print("✅ " .. testName)
        else
            print("❌ " .. testName .. ": " .. tostring(error))
        end
    end
    
    -- Summary
    local passed = 0
    local total = 0
    for _, result in pairs(results) do
        total = total + 1
        if result.passed then
            passed = passed + 1
        end
    end
    
    print(string.format("\\n📊 Game Logic Integration Tests: %d/%d passed", passed, total))
    
    -- Overall assessment
    if passed == total then
        print("✅ ALL INTEGRATION TESTS PASSED - Timestamp parameter threading is working correctly across systems")
    elseif passed >= total * 0.8 then
        print("⚠️  MOST INTEGRATION TESTS PASSED - Minor issues in timestamp parameter threading")
    else
        print("❌ SIGNIFICANT INTEGRATION ISSUES - Timestamp parameter threading needs attention")
    end
    
    return results
end

-- Export for test runner
return {
    createIntegrationTimestampTests = createIntegrationTimestampTests,
    runGameLogicTimestampIntegrationTests = runGameLogicTimestampIntegrationTests
}