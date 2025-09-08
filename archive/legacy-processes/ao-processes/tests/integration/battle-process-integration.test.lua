-- Integration Tests for Battle Process
-- Tests complete battle workflows across dedicated battle process components
-- Validates inter-process communication and concurrent battle processing
-- Epic 32.3: Battle Engine Process Extraction

local ConcurrentBattleManager = require("battle.components.concurrent-battle-manager")
local BattleStateManager = require("battle.components.battle-state-manager")
local BattleCommandHandler = require("battle.handlers.battle-command-handler")
local BattleStateHandler = require("battle.handlers.battle-state-handler")
local TurnProcessor = require("battle.components.turn-processor")
local Enums = require("data.constants.enums")

-- Test framework
local IntegrationTestSuite = {}

-- Test data
local TEST_BATTLE_PARAMS = {
    battleSeed = "integration-test-seed-123",
    battleType = "WILD",
    playerParty = {
        {
            id = "player-pokemon-1",
            species = "Pikachu",
            level = 25,
            hp = 70,
            maxHp = 70,
            stats = {
                attack = 55,
                defense = 40,
                special_attack = 50,
                special_defense = 50,
                speed = 90
            },
            types = {Enums.PokemonType.ELECTRIC},
            moves = {
                {id = "thunderbolt", name = "Thunderbolt", pp = 15, maxPp = 15},
                {id = "quick-attack", name = "Quick Attack", pp = 30, maxPp = 30}
            },
            status = 0,
            statStages = {
                attack = 0, defense = 0, special_attack = 0, 
                special_defense = 0, speed = 0, accuracy = 0, evasion = 0
            }
        }
    },
    enemyParty = {
        {
            id = "enemy-pokemon-1", 
            species = "Rattata",
            level = 22,
            hp = 55,
            maxHp = 55,
            stats = {
                attack = 46,
                defense = 35,
                special_attack = 25,
                special_defense = 35,
                speed = 72
            },
            types = {Enums.PokemonType.NORMAL},
            moves = {
                {id = "tackle", name = "Tackle", pp = 35, maxPp = 35}
            },
            status = 0,
            statStages = {
                attack = 0, defense = 0, special_attack = 0,
                special_defense = 0, speed = 0, accuracy = 0, evasion = 0
            }
        }
    }
}

-- Test: Complete battle initialization workflow
function IntegrationTestSuite.testBattleInitializationWorkflow()
    print("Testing complete battle initialization workflow...")
    
    local battleId = "integration-test-battle-1"
    local coordinatorId = "test-coordinator-process"
    
    -- Initialize components
    BattleStateManager.initialize()
    ConcurrentBattleManager.initialize(10)
    
    -- Start battle through concurrent manager
    local battleResult, error = ConcurrentBattleManager.startBattle(
        battleId,
        TEST_BATTLE_PARAMS,
        coordinatorId
    )
    
    assert(battleResult ~= nil, "Battle initialization should succeed")
    assert(battleResult.success == true, "Battle result should indicate success")
    assert(battleResult.battleId == battleId, "Battle ID should match")
    assert(battleResult.resourcePoolId ~= nil, "Should assign resource pool")
    assert(battleResult.battleState ~= nil, "Should create battle state")
    
    -- Verify battle state was created
    local battleState = BattleStateManager.getBattleState(battleId)
    assert(battleState ~= nil, "Battle state should be created")
    assert(battleState.battleId == battleId, "Battle state should have correct ID")
    assert(battleState.status == "ACTIVE", "Battle state should be active")
    
    -- Verify battle instance exists
    local battleInstance = ConcurrentBattleManager.getBattleInstance(battleId)
    assert(battleInstance ~= nil, "Battle instance should exist")
    assert(battleInstance.battleId == battleId, "Instance should have correct battle ID")
    
    print("✓ Battle initialization workflow test passed")
end

-- Test: Battle command processing workflow
function IntegrationTestSuite.testBattleCommandWorkflow()
    print("Testing battle command processing workflow...")
    
    local battleId = "integration-test-battle-2"
    local coordinatorId = "test-coordinator-process"
    local playerId = "test-player-1"
    
    -- Initialize and start battle
    BattleStateManager.initialize()
    ConcurrentBattleManager.initialize(10)
    
    local battleResult, error = ConcurrentBattleManager.startBattle(
        battleId,
        TEST_BATTLE_PARAMS,
        coordinatorId
    )
    assert(battleResult ~= nil, "Battle should start successfully")
    
    -- Create test battle command message
    local commandMessage = {
        Data = json.encode({
            battleId = battleId,
            playerId = playerId,
            command = {
                type = "move",
                pokemonId = "player-pokemon-1",
                moveId = "thunderbolt",
                target = {id = "enemy-pokemon-1"}
            },
            correlation = {
                id = "test-correlation-1"
            }
        }),
        Tags = {Action = "BATTLE_COMMAND"},
        From = playerId
    }
    
    -- Process command through handler
    local response = BattleCommandHandler.process(commandMessage)
    assert(response ~= nil, "Command handler should return response")
    
    local responseData = json.decode(response)
    assert(responseData.success == true, "Command should process successfully")
    assert(responseData.result.battleId == battleId, "Response should include battle ID")
    
    print("✓ Battle command workflow test passed")
end

-- Test: Battle turn processing workflow
function IntegrationTestSuite.testBattleTurnWorkflow()
    print("Testing battle turn processing workflow...")
    
    local battleId = "integration-test-battle-3"
    local coordinatorId = "test-coordinator-process"
    
    -- Initialize and start battle
    BattleStateManager.initialize()
    ConcurrentBattleManager.initialize(10)
    
    local battleResult, error = ConcurrentBattleManager.startBattle(
        battleId,
        TEST_BATTLE_PARAMS,
        coordinatorId
    )
    assert(battleResult ~= nil, "Battle should start successfully")
    
    -- Prepare turn commands
    local turnCommands = {
        ["player-1"] = {
            {
                type = "move",
                pokemonId = "player-pokemon-1",
                moveId = "thunderbolt",
                target = {id = "enemy-pokemon-1"}
            }
        },
        ["enemy-1"] = {
            {
                type = "move",
                pokemonId = "enemy-pokemon-1",
                moveId = "tackle",
                target = {id = "player-pokemon-1"}
            }
        }
    }
    
    -- Process battle turn
    local turnResult, turnError = ConcurrentBattleManager.processBattleTurn(
        battleId,
        turnCommands
    )
    
    assert(turnResult ~= nil, "Turn processing should succeed")
    assert(turnResult.success == true, "Turn result should indicate success")
    assert(turnResult.turnResult ~= nil, "Should include turn result data")
    
    -- Verify battle state was updated
    local battleState = BattleStateManager.getBattleState(battleId)
    assert(battleState.turn > 0, "Battle turn should be incremented")
    
    print("✓ Battle turn workflow test passed")
end

-- Test: Battle state query workflow
function IntegrationTestSuite.testBattleStateQueryWorkflow()
    print("Testing battle state query workflow...")
    
    local battleId = "integration-test-battle-4"
    local coordinatorId = "test-coordinator-process"
    
    -- Initialize and start battle
    BattleStateManager.initialize()
    ConcurrentBattleManager.initialize(10)
    
    local battleResult, error = ConcurrentBattleManager.startBattle(
        battleId,
        TEST_BATTLE_PARAMS,
        coordinatorId
    )
    assert(battleResult ~= nil, "Battle should start successfully")
    
    -- Create state query message
    local queryMessage = {
        Data = json.encode({
            query = {
                queryType = "FULL_STATE",
                battleId = battleId,
                accessLevel = "COORDINATOR"
            },
            correlation = {
                id = "test-query-correlation-1"
            }
        }),
        Tags = {Action = "BATTLE_STATE_QUERY"},
        From = coordinatorId
    }
    
    -- Process query through handler
    local response = BattleStateHandler.process(queryMessage)
    assert(response ~= nil, "State handler should return response")
    
    local responseData = json.decode(response)
    assert(responseData.success == true, "Query should process successfully")
    assert(responseData.result.battleState ~= nil, "Response should include battle state")
    assert(responseData.result.battleState.battleId == battleId, "State should have correct battle ID")
    
    print("✓ Battle state query workflow test passed")
end

-- Test: Concurrent battle processing
function IntegrationTestSuite.testConcurrentBattleProcessing()
    print("Testing concurrent battle processing...")
    
    -- Initialize with higher capacity
    BattleStateManager.initialize()
    ConcurrentBattleManager.initialize(50)
    
    local battleIds = {}
    local battleCount = 5
    local coordinatorId = "test-coordinator-process"
    
    -- Start multiple concurrent battles
    for i = 1, battleCount do
        local battleId = "concurrent-battle-" .. i
        table.insert(battleIds, battleId)
        
        local battleResult, error = ConcurrentBattleManager.startBattle(
            battleId,
            TEST_BATTLE_PARAMS,
            coordinatorId
        )
        assert(battleResult ~= nil, "Concurrent battle " .. i .. " should start")
        assert(battleResult.success == true, "Battle result should be successful")
    end
    
    -- Verify all battles are active
    local stats = ConcurrentBattleManager.getPerformanceStatistics()
    assert(stats.activeBattles >= battleCount, "Should have correct number of active battles")
    
    -- Process turns for all battles concurrently
    for _, battleId in ipairs(battleIds) do
        local turnCommands = {
            ["player-1"] = {{
                type = "move",
                pokemonId = "player-pokemon-1",
                moveId = "thunderbolt"
            }}
        }
        
        local turnResult, error = ConcurrentBattleManager.processBattleTurn(
            battleId,
            turnCommands
        )
        assert(turnResult ~= nil, "Concurrent turn processing should succeed")
    end
    
    print("✓ Concurrent battle processing test passed")
end

-- Test: Battle state synchronization
function IntegrationTestSuite.testBattleStateSynchronization()
    print("Testing battle state synchronization...")
    
    local battleId = "sync-test-battle"
    local coordinatorId = "test-coordinator-process"
    
    -- Initialize and start battle
    BattleStateManager.initialize()
    ConcurrentBattleManager.initialize(10)
    
    local battleResult, error = ConcurrentBattleManager.startBattle(
        battleId,
        TEST_BATTLE_PARAMS,
        coordinatorId
    )
    assert(battleResult ~= nil, "Battle should start successfully")
    
    -- Get initial state
    local initialState = BattleStateManager.getBattleState(battleId)
    local initialVersion = initialState.syncVersion
    
    -- Make a state update
    local updateSuccess = BattleStateManager.updateBattleState(
        battleId,
        {turn = 1, phase = "ACTION_EXECUTION"},
        "TEST_UPDATE"
    )
    assert(updateSuccess == true, "State update should succeed")
    
    -- Verify synchronization version changed
    local updatedState = BattleStateManager.getBattleState(battleId)
    assert(updatedState.syncVersion > initialVersion, "Sync version should increment")
    assert(updatedState.turn == 1, "Turn should be updated")
    assert(updatedState.phase == "ACTION_EXECUTION", "Phase should be updated")
    
    -- Test state history
    local history = BattleStateManager.getBattleHistory(battleId, 10)
    assert(#history >= 2, "Should have history entries for initialization and update")
    
    print("✓ Battle state synchronization test passed")
end

-- Test: Error handling and recovery
function IntegrationTestSuite.testErrorHandlingAndRecovery()
    print("Testing error handling and recovery...")
    
    -- Initialize components
    BattleStateManager.initialize()
    ConcurrentBattleManager.initialize(10)
    
    -- Test invalid battle initialization
    local invalidResult, error = ConcurrentBattleManager.startBattle(
        nil, -- Invalid battle ID
        TEST_BATTLE_PARAMS,
        "test-coordinator"
    )
    assert(invalidResult == nil, "Invalid battle should fail to start")
    assert(error ~= nil, "Should return error message")
    
    -- Test processing turn for non-existent battle
    local invalidTurnResult, turnError = ConcurrentBattleManager.processBattleTurn(
        "non-existent-battle",
        {}
    )
    assert(invalidTurnResult == nil, "Processing non-existent battle should fail")
    assert(turnError ~= nil, "Should return error for non-existent battle")
    
    -- Test state query for non-existent battle
    local invalidState = BattleStateManager.getBattleState("non-existent-battle")
    assert(invalidState == nil, "Should return nil for non-existent battle")
    
    print("✓ Error handling and recovery test passed")
end

-- Test: Performance and resource management
function IntegrationTestSuite.testPerformanceAndResourceManagement()
    print("Testing performance and resource management...")
    
    -- Initialize with limited capacity
    BattleStateManager.initialize()
    ConcurrentBattleManager.initialize(3) -- Limited capacity for testing
    
    local coordinatorId = "test-coordinator-process"
    
    -- Start battles up to capacity
    for i = 1, 3 do
        local battleId = "capacity-test-battle-" .. i
        local result, error = ConcurrentBattleManager.startBattle(
            battleId,
            TEST_BATTLE_PARAMS,
            coordinatorId
        )
        assert(result ~= nil, "Battle " .. i .. " should start within capacity")
    end
    
    -- Try to exceed capacity
    local overCapacityResult, error = ConcurrentBattleManager.startBattle(
        "over-capacity-battle",
        TEST_BATTLE_PARAMS,
        coordinatorId
    )
    assert(overCapacityResult == nil, "Should reject battle over capacity")
    assert(error ~= nil, "Should return capacity error")
    
    -- Test performance statistics
    local stats = ConcurrentBattleManager.getPerformanceStatistics()
    assert(stats.activeBattles == 3, "Should show correct active battle count")
    assert(stats.resourcePools > 0, "Should have resource pools")
    
    -- Test state manager statistics
    local stateStats = BattleStateManager.getStatistics()
    assert(stateStats.activeBattles == 3, "State manager should track correct active battles")
    
    print("✓ Performance and resource management test passed")
end

-- Run all integration tests
function IntegrationTestSuite.runAll()
    print("=== Running Battle Process Integration Tests ===")
    
    local tests = {
        IntegrationTestSuite.testBattleInitializationWorkflow,
        IntegrationTestSuite.testBattleCommandWorkflow,
        IntegrationTestSuite.testBattleTurnWorkflow,
        IntegrationTestSuite.testBattleStateQueryWorkflow,
        IntegrationTestSuite.testConcurrentBattleProcessing,
        IntegrationTestSuite.testBattleStateSynchronization,
        IntegrationTestSuite.testErrorHandlingAndRecovery,
        IntegrationTestSuite.testPerformanceAndResourceManagement
    }
    
    local passed = 0
    local failed = 0
    
    for i, test in ipairs(tests) do
        print("\n--- Running Test " .. i .. " ---")
        local success, error = pcall(test)
        if success then
            passed = passed + 1
        else
            failed = failed + 1
            print("✗ Integration test failed: " .. tostring(error))
        end
    end
    
    print("\n=== Integration Test Results ===")
    print("Passed: " .. passed)
    print("Failed: " .. failed)
    print("Total:  " .. (passed + failed))
    
    if failed == 0 then
        print("🎉 All integration tests passed!")
        print("✅ Battle process ready for deployment!")
    else
        print("❌ Some integration tests failed - please review")
    end
    
    return failed == 0
end

-- Export test suite
return IntegrationTestSuite