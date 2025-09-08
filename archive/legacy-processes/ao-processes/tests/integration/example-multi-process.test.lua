-- Example aolite Multi-Process Integration Test
-- Demonstrates concurrent process testing patterns

local TestRunner = require("../framework/aolite-test-runner")

-- Multi-Process Integration Test Suite
local MultiProcessTests = {
    setup = function()
        print("🔧 Setting up multi-process integration tests...")
    end,
    
    teardown = function()
        print("🧹 Cleaning up multi-process tests...")
    end,
    
    tests = {
        testBattleCoordinatorFlow = function(_, aolite)
            -- Spawn multiple processes
            local coordinatorId = "test-coordinator-" .. os.time()
            local battleId = "test-battle-" .. os.time()
            local pokemonId = "test-pokemon-" .. os.time()
            
            aolite.spawnProcess(coordinatorId, "ao-processes/coordinator/main.lua")
            aolite.spawnProcess(battleId, "ao-processes/battle/main.lua")
            aolite.spawnProcess(pokemonId, "ao-processes/pokemon/main.lua")
            
            -- Test 1: Coordinator initiates battle
            local initResult = aolite.send({
                From = "test-player",
                Target = coordinatorId,
                Action = "Request-Battle",
                PlayerId = "test-player",
                BattleType = "WILD"
            })
            
            TestRunner.assert.isNotNil(initResult, "Battle request should return result")
            TestRunner.assert.isNotNil(initResult.battleId, "Should assign battle ID")
            
            local actualBattleId = initResult.battleId
            
            -- Test 2: Pokemon process loads party
            local partyResult = aolite.send({
                From = coordinatorId,
                Target = pokemonId,
                Action = "Load-Party",
                PlayerId = "test-player",
                BattleId = actualBattleId
            })
            
            TestRunner.assert.equals(partyResult.success, true, "Party loading should succeed")
            TestRunner.assert.isNotNil(partyResult.party, "Should return party data")
            
            -- Test 3: Battle process initializes
            local battleInitResult = aolite.send({
                From = coordinatorId,
                Target = battleId,
                Action = "Initialize-Battle",
                BattleId = actualBattleId,
                PlayerParty = partyResult.party
            })
            
            TestRunner.assert.equals(battleInitResult.success, true, "Battle initialization should succeed")
            
            -- Test 4: Execute battle command
            local commandResult = aolite.send({
                From = "test-player",
                Target = battleId,
                Action = "Battle-Command",
                BattleId = actualBattleId,
                Command = "FIGHT",
                Move = "tackle"
            })
            
            TestRunner.assert.isNotNil(commandResult, "Battle command should return result")
            TestRunner.assert.isNotNil(commandResult.turnResult, "Should include turn result")
            
            -- Test 5: Validate state consistency across processes
            local coordinatorState = aolite.send({
                From = "test-query",
                Target = coordinatorId,
                Action = "Query-State",
                StateType = "ACTIVE_BATTLES"
            })
            
            local battleState = aolite.send({
                From = "test-query", 
                Target = battleId,
                Action = "Query-State",
                StateType = "BATTLE_STATUS"
            })
            
            TestRunner.assert.isNotNil(coordinatorState.activeBattles, "Coordinator should track active battles")
            TestRunner.assert.isNotNil(battleState.battleStatus, "Battle should have status")
            
            -- Verify consistency
            local coordinatorHasBattle = false
            for _, battle in pairs(coordinatorState.activeBattles or {}) do
                if battle.battleId == actualBattleId then
                    coordinatorHasBattle = true
                    break
                end
            end
            
            TestRunner.assert.isTrue(coordinatorHasBattle, "Coordinator should track this battle")
            TestRunner.assert.equals(battleState.battleStatus.battleId, actualBattleId, "Battle IDs should match")
            
            return true
        end,
        
        testProcessCommunicationFailure = function(_, aolite)
            -- Test error handling when processes fail
            local coordinatorId = "test-coord-error-" .. os.time()
            local invalidProcessId = "nonexistent-process"
            
            aolite.spawnProcess(coordinatorId, "ao-processes/coordinator/main.lua")
            
            -- Try to send message to nonexistent process
            local result = aolite.send({
                From = coordinatorId,
                Target = invalidProcessId,
                Action = "Test-Message"
            })
            
            -- Should handle gracefully (exact behavior depends on aolite implementation)
            TestRunner.assert.isNotNil(result, "Should handle failed communication")
            
            return true
        end,
        
        testConcurrentBattles = function(_, aolite)
            -- Test multiple concurrent battles
            local coordinatorId = "test-coord-concurrent-" .. os.time()
            local battle1Id = "test-battle-1-" .. os.time()
            local battle2Id = "test-battle-2-" .. os.time()
            
            aolite.spawnProcess(coordinatorId, "ao-processes/coordinator/main.lua")
            aolite.spawnProcess(battle1Id, "ao-processes/battle/main.lua")
            aolite.spawnProcess(battle2Id, "ao-processes/battle/main.lua")
            
            -- Start two battles concurrently
            local battle1Result = aolite.send({
                From = "player1",
                Target = coordinatorId,
                Action = "Request-Battle",
                PlayerId = "player1",
                BattleType = "WILD"
            })
            
            local battle2Result = aolite.send({
                From = "player2",
                Target = coordinatorId,
                Action = "Request-Battle", 
                PlayerId = "player2",
                BattleType = "WILD"
            })
            
            TestRunner.assert.isNotNil(battle1Result.battleId, "Battle 1 should get ID")
            TestRunner.assert.isNotNil(battle2Result.battleId, "Battle 2 should get ID")
            TestRunner.assert.isTrue(battle1Result.battleId ~= battle2Result.battleId, "Battle IDs should be unique")
            
            return true
        end
    }
}

-- Register and run tests
TestRunner.registerSuite("MultiProcess", MultiProcessTests)

if _G.arg and _G.arg[0]:match("example%-multi%-process%.test%.lua$") then
    -- Run this test suite if executed directly
    local success = TestRunner.runAll()
    os.exit(success and 0 or 1)
end