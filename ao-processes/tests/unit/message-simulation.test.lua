-- Unit Tests for Message Simulation Components
-- Tests all message simulation tools and fixtures

-- Load components
local AOMessageFixtures = require("ao-processes/tests/fixtures/ao-message-fixtures")
local GameScenarioSimulator = require("ao-processes/tests/fixtures/game-scenario-simulator")
local BattleStateManager = require("ao-processes/tests/fixtures/battle-state-manager")
local MessageSequenceTester = require("ao-processes/tests/fixtures/message-sequence-tester")
local MessageProcessor = require("development-tools/ao-local-setup/message-processor")
local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator

-- Test framework setup
local function assertEquals(expected, actual, message)
    message = message or "Assertion failed"
    if expected ~= actual then
        error(message .. ": expected " .. tostring(expected) .. ", got " .. tostring(actual))
    end
end

local function assertNotNil(value, message)
    message = message or "Value should not be nil"
    if value == nil then
        error(message)
    end
end

local function assertTrue(condition, message)
    message = message or "Condition should be true"
    if not condition then
        error(message)
    end
end

-- AO Message Fixtures Tests
local function testAOMessageFixtures()
    print("Testing AO Message Fixtures...")
    
    local fixtures = AOMessageFixtures.new()
    assertNotNil(fixtures, "Fixtures should be created")
    assertNotNil(fixtures.templates, "Templates should be initialized")
    
    -- Test message creation
    local authMessage = fixtures:createMessage("auth", "authRequest", {
        From = "custom-wallet"
    })
    
    assertNotNil(authMessage, "Auth message should be created")
    assertEquals("custom-wallet", authMessage.From, "Custom From should be set")
    assertEquals("Auth-Request", authMessage.Action, "Action should be set")
    assertNotNil(authMessage.Id, "Message should have ID")
    assertNotNil(authMessage.Tags, "Message should have tags")
    
    -- Test battle message creation
    local battleMessage = fixtures:createMessage("battle", "battleMove", {
        Tags = {BattleId = "test-battle-123"}
    })
    
    assertEquals("Battle-Move", battleMessage.Action, "Battle action should be set")
    assertEquals("test-battle-123", battleMessage.Tags.BattleId, "Battle ID should be set")
    
    print("✅ AO Message Fixtures test passed")
    return true
end

local function testMessageSequenceGeneration()
    print("Testing message sequence generation...")
    
    local fixtures = AOMessageFixtures.new()
    
    -- Test battle sequence
    local battleSeq = fixtures:createBattleSequence("player1", "player2", {
        {player = "player1", moveId = 85, target = 0},
        {player = "player2", moveId = 52, target = 0}
    })
    
    assertTrue(#battleSeq >= 3, "Battle sequence should have at least 3 messages") -- start + moves + end
    assertEquals("Battle-Start", battleSeq[1].Action, "First message should be battle start")
    assertEquals("Battle-Move", battleSeq[2].Action, "Second message should be battle move")
    
    -- Test auth sequence
    local authSeq = fixtures:createAuthSequence("test-wallet")
    
    assertTrue(#authSeq >= 3, "Auth sequence should have at least 3 messages")
    assertEquals("Auth-Request", authSeq[1].Action, "First message should be auth request")
    
    print("✅ Message sequence generation test passed")
    return true
end

local function testMessageValidation()
    print("Testing message validation...")
    
    local fixtures = AOMessageFixtures.new()
    
    -- Test valid message
    local validMessage = fixtures:createMessage("auth", "authRequest")
    local isValid, errors = fixtures:validateMessageStructure(validMessage)
    
    assertTrue(isValid, "Valid message should pass validation")
    assertEquals(0, #errors, "Valid message should have no errors")
    
    -- Test invalid message
    local invalidMessage = {
        Action = "Test"
        -- Missing required fields
    }
    
    isValid, errors = fixtures:validateMessageStructure(invalidMessage)
    assertTrue(not isValid, "Invalid message should fail validation")
    assertTrue(#errors > 0, "Invalid message should have errors")
    
    print("✅ Message validation test passed")
    return true
end

-- Battle State Manager Tests
local function testBattleStateManager()
    print("Testing Battle State Manager...")
    
    local manager = BattleStateManager.new()
    assertNotNil(manager, "Battle state manager should be created")
    
    -- Create battle
    local battle = manager:createBattle({
        players = {"player1", "player2"},
        gameMode = "singles"
    })
    
    assertNotNil(battle, "Battle should be created")
    assertEquals(2, #battle.players, "Battle should have 2 players")
    assertEquals("start", battle.phase, "Battle should start in 'start' phase")
    assertEquals(1, battle.turn, "Battle should start at turn 1")
    
    -- Check player states
    assertNotNil(battle.playerStates["player1"], "Player 1 state should exist")
    assertNotNil(battle.playerStates["player2"], "Player 2 state should exist")
    
    local p1State = battle.playerStates["player1"]
    assertTrue(#p1State.team > 0, "Player should have Pokemon team")
    assertEquals("active", p1State.status, "Player should be active")
    
    print("✅ Battle State Manager test passed")
    return true
end

local function testBattleStateSnapshots()
    print("Testing battle state snapshots...")
    
    local manager = BattleStateManager.new()
    local battle = manager:createBattle({
        battleId = "snapshot-test",
        players = {"player1", "player2"}
    })
    
    -- Create initial snapshot
    local snapshot1 = manager:createStateSnapshot("snapshot-test", "initial")
    assertNotNil(snapshot1, "Initial snapshot should be created")
    assertEquals("initial", snapshot1.label, "Snapshot label should be set")
    assertEquals(1, snapshot1.turn, "Snapshot should capture current turn")
    
    -- Modify battle state
    manager:updateBattleState("snapshot-test", {
        turn = 2,
        phase = "execution"
    })
    
    -- Create second snapshot
    local snapshot2 = manager:createStateSnapshot("snapshot-test", "after-update")
    assertEquals(2, snapshot2.turn, "Second snapshot should show updated turn")
    
    -- Compare snapshots
    local diff = manager:compareSnapshots(snapshot1, snapshot2)
    assertTrue(diff.turn, "Snapshots should show turn difference")
    assertTrue(diff.phase, "Snapshots should show phase difference")
    
    print("✅ Battle state snapshots test passed")
    return true
end

-- Game Scenario Simulator Tests
local function testGameScenarioSimulator()
    print("Testing Game Scenario Simulator...")
    
    local emulator = AOEmulator.new({processId = "scenario-test"})
    local processor = MessageProcessor.new(emulator)
    local fixtures = AOMessageFixtures.new()
    local simulator = GameScenarioSimulator.new(processor, fixtures)
    
    assertNotNil(simulator, "Simulator should be created")
    assertNotNil(simulator.scenarios, "Scenarios should be initialized")
    
    -- Define simple test scenario
    local scenario = simulator:defineScenario("testScenario", {
        description = "Simple test scenario",
        participants = {"player1"},
        steps = {
            {
                name = "test-step",
                description = "Test step",
                actions = function(sim, participants)
                    return {
                        sim.fixtures:createMessage("auth", "authRequest", {
                            From = participants[1]
                        })
                    }
                end
            }
        }
    })
    
    assertNotNil(scenario, "Scenario should be defined")
    assertEquals("testScenario", scenario.name, "Scenario name should be set")
    
    print("✅ Game Scenario Simulator test passed")
    return true
end

local function testScenarioExecution()
    print("Testing scenario execution...")
    
    local emulator = AOEmulator.new({processId = "exec-test"})
    local processor = MessageProcessor.new(emulator)
    local fixtures = AOMessageFixtures.new()
    local simulator = GameScenarioSimulator.new(processor, fixtures)
    
    -- Define and execute simple scenario
    simulator:defineScenario("simpleAuth", {
        description = "Simple auth scenario",
        participants = {"testPlayer"},
        steps = {
            {
                name = "auth-request",
                actions = function(sim, participants)
                    return {
                        sim.fixtures:createMessage("auth", "authRequest", {
                            From = participants[1]
                        })
                    }
                end
            }
        },
        expectedOutcomes = {
            totalMessages = 1
        }
    })
    
    local execution = simulator:executeScenario("simpleAuth")
    
    assertNotNil(execution, "Execution should return result")
    assertTrue(execution.success, "Simple scenario should succeed")
    assertTrue(#execution.messages >= 1, "Should have at least 1 message")
    assertTrue(#execution.steps >= 1, "Should have at least 1 step")
    
    print("✅ Scenario execution test passed")
    return true
end

-- Message Sequence Tester Tests
local function testMessageSequenceTester()
    print("Testing Message Sequence Tester...")
    
    local emulator = AOEmulator.new({processId = "sequence-test"})
    local fixtures = AOMessageFixtures.new()
    local tester = MessageSequenceTester.new(emulator, fixtures)
    
    assertNotNil(tester, "Sequence tester should be created")
    assertNotNil(tester.sequences, "Sequences should be initialized")
    
    -- Initialize built-in sequences
    tester:initializeBuiltInSequences()
    
    assertTrue(next(tester.sequences) ~= nil, "Built-in sequences should be loaded")
    assertNotNil(tester.sequences["completeAuthFlow"], "Auth flow sequence should exist")
    assertNotNil(tester.sequences["completeBattleWorkflow"], "Battle workflow should exist")
    
    print("✅ Message Sequence Tester test passed")
    return true
end

local function testSequenceDefinition()
    print("Testing sequence definition...")
    
    local emulator = AOEmulator.new({processId = "seq-def-test"})
    local tester = MessageSequenceTester.new(emulator)
    
    -- Define custom sequence
    local sequence = tester:defineSequence("testSequence", {
        description = "Test sequence",
        steps = {
            {
                name = "test-step",
                description = "Test step",
                type = "single",
                message = function(tester, context)
                    return {
                        From = "test",
                        Action = "Test",
                        Data = "",
                        Tags = {}
                    }
                end
            }
        },
        timeout = 5000
    })
    
    assertEquals("testSequence", sequence.name, "Sequence name should be set")
    assertEquals("Test sequence", sequence.description, "Description should be set")
    assertEquals(1, #sequence.steps, "Should have 1 step")
    assertEquals(5000, sequence.timeout, "Timeout should be set")
    
    print("✅ Sequence definition test passed")
    return true
end

-- Integration Tests
local function testComponentIntegration()
    print("Testing component integration...")
    
    -- Create all components
    local emulator = AOEmulator.new({processId = "integration-test"})
    local processor = MessageProcessor.new(emulator)
    local fixtures = AOMessageFixtures.new()
    local battleManager = BattleStateManager.new()
    local simulator = GameScenarioSimulator.new(processor, fixtures)
    local sequenceTester = MessageSequenceTester.new(emulator, fixtures)
    
    -- Test fixtures with processor
    local message = fixtures:createMessage("auth", "authRequest", {
        From = "integration-test-user"
    })
    
    local result = processor:processMessage(message)
    assertNotNil(result, "Message should be processed")
    assertNotNil(result.message, "Result should contain message")
    
    -- Test battle manager with fixtures
    local battle = battleManager:createBattle({
        battleId = "integration-battle",
        players = {"player1", "player2"}
    })
    
    assertNotNil(battle, "Battle should be created")
    assertEquals("integration-battle", battle.id, "Battle ID should be set")
    
    -- Test sequence tester with simulator scenarios
    sequenceTester:defineSequence("integrationTest", {
        description = "Integration test sequence",
        steps = {
            {
                name = "create-message",
                type = "single",
                message = function(tester, context)
                    return tester.fixtures:createMessage("query", "stateQuery", {
                        From = "integration-user"
                    })
                end
            }
        }
    })
    
    local execution = sequenceTester:executeSequence("integrationTest")
    assertTrue(execution.success, "Integration sequence should succeed")
    
    print("✅ Component integration test passed")
    return true
end

-- Performance Tests
local function testMessageGenerationPerformance()
    print("Testing message generation performance...")
    
    local fixtures = AOMessageFixtures.new()
    local startTime = os.clock()
    
    -- Generate many messages
    local messages = {}
    for i = 1, 100 do
        local message = fixtures:createMessage("battle", "battleMove", {
            From = "player" .. i,
            Tags = {BattleId = "perf-test-" .. i}
        })
        table.insert(messages, message)
    end
    
    local endTime = os.clock()
    local duration = endTime - startTime
    
    assertEquals(100, #messages, "Should generate 100 messages")
    assertTrue(duration < 1.0, "Should generate messages quickly (< 1 second)")
    
    print(string.format("  Generated 100 messages in %.3f seconds", duration))
    
    print("✅ Message generation performance test passed")
    return true
end

-- Run all tests
local function runTests()
    print("🧪 Running Message Simulation Component Tests")
    print("=============================================")
    
    local tests = {
        testAOMessageFixtures,
        testMessageSequenceGeneration,
        testMessageValidation,
        testBattleStateManager,
        testBattleStateSnapshots,
        testGameScenarioSimulator,
        testScenarioExecution,
        testMessageSequenceTester,
        testSequenceDefinition,
        testComponentIntegration,
        testMessageGenerationPerformance
    }
    
    local passed = 0
    local failed = 0
    
    for i, test in ipairs(tests) do
        print("")
        local success, err = pcall(test)
        
        if success then
            passed = passed + 1
        else
            failed = failed + 1
            print("❌ Test " .. i .. " failed: " .. tostring(err))
        end
    end
    
    print("")
    print("📊 Test Results:")
    print("================")
    print("Passed: " .. passed)
    print("Failed: " .. failed)
    print("Total: " .. (passed + failed))
    
    if failed == 0 then
        print("")
        print("🎉 All Message Simulation tests passed!")
        return true
    else
        print("")
        print("❌ Some tests failed. Please review the output above.")
        return false
    end
end

-- Execute tests
return runTests()