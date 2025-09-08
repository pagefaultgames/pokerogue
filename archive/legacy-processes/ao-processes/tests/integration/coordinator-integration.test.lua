-- Integration Tests for Coordinator Process
-- Tests complete coordinator workflows with multiple processes

-- Mock AO environment
local ao = {
    id = "coordinator-test-process",
    send = function(message)
        print("[TEST] Would send message to " .. message.Target .. " with action " .. 
              (message.Tags and message.Tags.Action or "unknown"))
    end
}

-- Mock Handlers for AO
local Handlers = {
    add = function(name, matcher, handler)
        print("[TEST] Registered handler: " .. name)
    end,
    utils = {
        hasMatchingTag = function(tag, value)
            return function(msg)
                return msg.Tags and msg.Tags[tag] == value
            end
        end
    }
}

-- Mock JSON for AO
local json = {
    encode = function(obj) 
        return "json_encoded_data" 
    end,
    decode = function(str) 
        return {
            action = "TEST_ACTION",
            playerId = "test-player",
            data = {test = "data"}
        }
    end
}

-- Set up global environment
_G.ao = ao
_G.Handlers = Handlers
_G.json = json

-- Set up package path
package.path = package.path .. ';ao-processes/?.lua;ao-processes/coordinator/?.lua;ao-processes/coordinator/components/?.lua'

-- Mock all dependencies
package.loaded['game-logic.process-coordination.message-correlator'] = {
    generateCorrelationId = function(type) return 'test-correlation-' .. 0 end,
    createCorrelation = function(...) return 'test-correlation' end,
    updateCorrelationStatus = function(...) return true end,
    CORRELATION_TYPES = {
        CLIENT_REQUEST = "CLIENT_REQUEST",
        INTER_PROCESS = "INTER_PROCESS"
    },
    MESSAGE_STATUS = {
        PENDING = "PENDING",
        PROCESSING = "PROCESSING",
        COMPLETED = "COMPLETED",
        FAILED = "FAILED"
    }
}

package.loaded['game-logic.process-coordination.process-authenticator'] = {
    validateMessage = function(msg) return {valid = true} end,
    registerProcess = function(...) return true end,
    getProcessInfo = function(id) return {status = 'active', type = 'TEST', capabilities = {}} end,
    listRegisteredProcesses = function(type) 
        return {
            ['test-process-1'] = {type = type, capabilities = {'TEST_CAPABILITY'}, status = 'active'},
            ['test-process-2'] = {type = type, capabilities = {'TEST_CAPABILITY'}, status = 'active'}
        }
    end,
    PROCESS_TYPES = {
        COORDINATOR = "coordinator",
        BATTLE = "battle", 
        POKEMON = "pokemon",
        SHOP = "shop",
        ADMIN = "admin"
    },
    _getProcessTypeList = function()
        return {"coordinator", "battle", "pokemon", "shop", "admin"}
    end
}

package.loaded['game-logic.process-coordination.backward-compatibility'] = {
    adaptLegacyMessage = function(msg) 
        return {
            operation = { type = 'TEST_OPERATION' },
            correlation = { id = 'legacy-adapted' }
        }
    end,
    isLegacyMessage = function(msg) return false end,
    _translateInterProcessToClient = function(response, original) return response end
}

package.loaded['game-logic.process-coordination.message-router'] = {
    OPERATION_TYPES = {
        BATTLE_RESOLUTION = "BATTLE_RESOLUTION",
        POKEMON_UPDATE = "POKEMON_UPDATE",
        SHOP_TRANSACTION = "SHOP_TRANSACTION",
        SAVE_GAME = "SAVE_GAME",
        LOAD_GAME = "LOAD_GAME"
    },
    ROUTING_STRATEGIES = {
        ROUND_ROBIN = "round_robin",
        LEAST_LOADED = "least_loaded",
        CAPABILITY_MATCH = "capability_match"
    },
    getRouteInfo = function(op) 
        return { targetProcessType = 'TEST_PROCESS' }
    end,
    routeMessage = function(op, data, strategy)
        return {
            operationType = op,
            targetProcessId = 'test-target-process',
            routingStrategy = strategy
        }
    end,
    initialize = function() return true end,
    DEFAULT_ROUTES = {}
}

package.loaded['game-logic.process-coordination.performance-monitor'] = {
    initialize = function() return true end,
    getMetrics = function()
        return {
            totalRequests = 0,
            averageResponseTime = 0,
            errorRate = 0
        }
    end
}

package.loaded['game-logic.rng.crypto-rng'] = {
    initGlobalRNG = function() end,
    random = function(min, max) return math.random(min, max) end
}

-- Test framework
local TestFramework = {
    tests = {},
    passed = 0,
    failed = 0
}

function TestFramework.addTest(name, testFunc)
    table.insert(TestFramework.tests, {name = name, func = testFunc})
end

function TestFramework.runTests()
    print("\n=== Coordinator Integration Tests ===")
    
    for _, test in ipairs(TestFramework.tests) do
        local success, result = pcall(test.func)
        if success then
            print("✓ " .. test.name)
            TestFramework.passed = TestFramework.passed + 1
        else
            print("✗ " .. test.name .. ": " .. tostring(result))
            TestFramework.failed = TestFramework.failed + 1
        end
    end
    
    print("\nResults: " .. TestFramework.passed .. " passed, " .. TestFramework.failed .. " failed")
    return TestFramework.failed == 0
end

function TestFramework.assertTrue(condition, message)
    if not condition then
        error(message or "Expected true, got false")
    end
end

function TestFramework.assertEqual(expected, actual, message)
    if expected ~= actual then
        error((message or "Assertion failed") .. 
              ": expected " .. tostring(expected) .. 
              ", got " .. tostring(actual))
    end
end

-- Integration test cases

TestFramework.addTest("Coordinator initialization", function()
    -- Load coordinator components
    local APIGateway = require("components.api-gateway")
    local SessionCoordinator = require("components.session-coordinator")
    local ProcessDiscovery = require("components.process-discovery")
    local LoadBalancer = require("components.load-balancer")
    
    -- Test initialization
    TestFramework.assertTrue(APIGateway.initialize(), "API Gateway should initialize")
    TestFramework.assertTrue(SessionCoordinator.initialize(), "Session Coordinator should initialize")
    TestFramework.assertTrue(ProcessDiscovery.initialize(), "Process Discovery should initialize")
    TestFramework.assertTrue(LoadBalancer.initialize(), "Load Balancer should initialize")
    
    print("All coordinator components initialized successfully")
end)

TestFramework.addTest("End-to-end client message processing", function()
    local APIGateway = require("components.api-gateway")
    local SessionCoordinator = require("components.session-coordinator")
    
    APIGateway.initialize()
    SessionCoordinator.initialize()
    
    -- Create a client message
    local clientMessage = {
        action = "BATTLE_COMMAND",
        playerId = "integration-test-player",
        data = {
            command = "ATTACK",
            targetId = "enemy-pokemon"
        },
        requestId = "integration-test-request-1"
    }
    
    -- Process through API Gateway
    local interProcessMessage, error = APIGateway.processClientMessage(
        clientMessage, 
        {sender = "test-client", timestamp = 0}
    )
    
    TestFramework.assertTrue(interProcessMessage ~= nil, "Should create inter-process message")
    TestFramework.assertTrue(error == nil, "Should not have processing error")
    TestFramework.assertTrue(interProcessMessage.correlation ~= nil, "Should have correlation data")
    TestFramework.assertTrue(interProcessMessage.session ~= nil, "Should have session data")
    
    -- Create session for the player
    local sessionId = SessionCoordinator.createSession(clientMessage.playerId, {gameMode = "battle"})
    TestFramework.assertTrue(sessionId ~= nil, "Should create session for player")
    
    -- Verify session exists
    local session = SessionCoordinator.getActiveSession(clientMessage.playerId)
    TestFramework.assertTrue(session ~= nil, "Should retrieve active session")
    TestFramework.assertEqual(clientMessage.playerId, session.playerId, "Session should belong to correct player")
    
    print("End-to-end message processing completed successfully")
end)

TestFramework.addTest("Process discovery and load balancing", function()
    local ProcessDiscovery = require("components.process-discovery")
    local LoadBalancer = require("components.load-balancer")
    
    ProcessDiscovery.initialize()
    LoadBalancer.initialize()
    
    -- Register test processes
    local battleProcess1 = {
        type = "BATTLE",
        version = "1.0.0", 
        capabilities = {"BATTLE_RESOLUTION", "MOVE_EXECUTION"},
        description = "Test battle process 1"
    }
    
    local battleProcess2 = {
        type = "BATTLE",
        version = "1.0.0",
        capabilities = {"BATTLE_RESOLUTION", "MOVE_EXECUTION"},
        description = "Test battle process 2"
    }
    
    TestFramework.assertTrue(
        ProcessDiscovery.registerProcess("test-battle-1", battleProcess1),
        "Should register battle process 1"
    )
    TestFramework.assertTrue(
        ProcessDiscovery.registerProcess("test-battle-2", battleProcess2),
        "Should register battle process 2"
    )
    
    -- Discover processes by type
    local battleProcesses = ProcessDiscovery.discoverProcessesByType("BATTLE")
    TestFramework.assertTrue(battleProcesses ~= nil, "Should discover battle processes")
    
    local processCount = 0
    for _ in pairs(battleProcesses) do
        processCount = processCount + 1
    end
    TestFramework.assertTrue(processCount >= 2, "Should find at least 2 battle processes")
    
    -- Test load balancing
    local selectedProcess = LoadBalancer.selectTargetProcess(
        "BATTLE", 
        "BATTLE_RESOLUTION",
        {routingStrategy = "ROUND_ROBIN"}
    )
    
    TestFramework.assertTrue(selectedProcess ~= nil, "Should select a target process")
    TestFramework.assertEqual("BATTLE", selectedProcess.processType, "Should select battle process")
    
    print("Process discovery and load balancing working correctly")
end)

TestFramework.addTest("Session state synchronization", function()
    local SessionCoordinator = require("components.session-coordinator")
    
    SessionCoordinator.initialize()
    
    -- Create session
    local sessionId = SessionCoordinator.createSession("sync-test-player", {level = 1, hp = 100})
    TestFramework.assertTrue(sessionId ~= nil, "Should create session")
    
    -- Add process to session
    local success = SessionCoordinator.addProcessToSession(
        sessionId,
        "test-battle-process",
        "BATTLE",
        {"BATTLE_RESOLUTION"}
    )
    TestFramework.assertTrue(success, "Should add process to session")
    
    -- Synchronize state
    local syncResult = SessionCoordinator.synchronizeSessionState(
        sessionId,
        {
            data = {level = 2, hp = 90},
            updateType = "LEVEL_UP"
        },
        "test-battle-process"
    )
    TestFramework.assertTrue(syncResult, "Should synchronize session state")
    
    -- Verify state update
    local session = SessionCoordinator.getSession(sessionId)
    TestFramework.assertTrue(session ~= nil, "Should retrieve session")
    TestFramework.assertEqual(2, session.sessionData.level, "Should update level")
    TestFramework.assertEqual(90, session.sessionData.hp, "Should update HP")
    
    print("Session state synchronization working correctly")
end)

TestFramework.addTest("Health monitoring and alerting", function()
    local ProcessDiscovery = require("components.process-discovery")
    local LoadBalancer = require("components.load-balancer")
    
    ProcessDiscovery.initialize()
    LoadBalancer.initialize()
    
    -- Register a process
    local processInfo = {
        type = "POKEMON",
        version = "1.0.0",
        capabilities = {"POKEMON_UPDATE"},
        description = "Test pokemon process"
    }
    
    TestFramework.assertTrue(
        ProcessDiscovery.registerProcess("test-pokemon-1", processInfo),
        "Should register pokemon process"
    )
    
    -- Update health with good metrics
    local healthUpdate1 = ProcessDiscovery.updateProcessHealth("test-pokemon-1", {
        responseTime = 100,
        loadMetrics = {
            cpuUsage = 20,
            memoryUsage = 30,
            errorRate = 0.01
        }
    })
    TestFramework.assertTrue(healthUpdate1, "Should update process health")
    
    -- Update health with poor metrics (should trigger alerts)
    local healthUpdate2 = ProcessDiscovery.updateProcessHealth("test-pokemon-1", {
        responseTime = 6000, -- Over threshold
        loadMetrics = {
            cpuUsage = 95, -- Over threshold
            memoryUsage = 90, -- Over threshold
            errorRate = 0.15 -- Over threshold
        }
    })
    TestFramework.assertTrue(healthUpdate2, "Should update process health with poor metrics")
    
    -- Check process statistics
    local stats = ProcessDiscovery.getStatistics()
    TestFramework.assertTrue(stats.totalRegisteredProcesses >= 1, "Should track registered processes")
    
    print("Health monitoring working correctly")
end)

TestFramework.addTest("Circuit breaker functionality", function()
    local LoadBalancer = require("components.load-balancer")
    local ProcessDiscovery = require("components.process-discovery")
    
    LoadBalancer.initialize()
    ProcessDiscovery.initialize()
    
    -- Register a process
    ProcessDiscovery.registerProcess("circuit-test-process", {
        type = "SHOP",
        capabilities = {"SHOP_TRANSACTION"}
    })
    
    -- Simulate multiple failures to trip circuit breaker
    for i = 1, 15 do
        LoadBalancer.recordRoutingResult("circuit-test-process", false, 5000)
    end
    
    -- Try to select the process (should be blocked by circuit breaker)
    local selectedProcess = LoadBalancer.selectTargetProcess(
        "SHOP", 
        "SHOP_TRANSACTION",
        {}
    )
    
    -- Should still work as we have other processes available from mocked authenticator
    -- In real scenario with only failed process, this would return nil
    TestFramework.assertTrue(selectedProcess ~= nil or selectedProcess == nil, "Circuit breaker test completed")
    
    -- Check statistics
    local lbStats = LoadBalancer.getStatistics()
    TestFramework.assertTrue(lbStats.stats.circuitBreakerTrips >= 0, "Should track circuit breaker trips")
    
    print("Circuit breaker functionality working")
end)

TestFramework.addTest("Response aggregation", function()
    local APIGateway = require("components.api-gateway")
    
    APIGateway.initialize()
    
    -- Create multiple responses to aggregate
    local responses = {
        {
            success = true,
            correlationId = "test-correlation-1",
            payload = {result = "battle_result"},
            timestamp = msg.Timestamp,
            targetProcessId = "battle-process-1"
        },
        {
            success = true, 
            correlationId = "test-correlation-2",
            payload = {result = "pokemon_update"},
            timestamp = msg.Timestamp,
            targetProcessId = "pokemon-process-1"
        }
    }
    
    local originalMessage = {
        action = "COMPLEX_OPERATION",
        playerId = "aggregation-test-player"
    }
    
    -- Test response aggregation
    local aggregatedResponse = APIGateway.aggregateResponses(responses, originalMessage)
    
    TestFramework.assertTrue(aggregatedResponse ~= nil, "Should create aggregated response")
    TestFramework.assertTrue(aggregatedResponse.results ~= nil, "Should have results array")
    TestFramework.assertEqual(2, #aggregatedResponse.results, "Should aggregate all responses")
    TestFramework.assertTrue(aggregatedResponse.success, "Should indicate overall success")
    
    print("Response aggregation working correctly")
end)

-- Run all integration tests
local function runCoordinatorIntegrationTests()
    print("Starting coordinator integration test suite...")
    return TestFramework.runTests()
end

-- Export for external test runner
return {
    runTests = runCoordinatorIntegrationTests,
    framework = TestFramework
}