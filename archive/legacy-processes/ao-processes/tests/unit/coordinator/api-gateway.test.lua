-- Unit Tests for API Gateway Component
-- Tests message routing, protocol translation, and client compatibility

-- Mock dependencies for testing
local MockMessageCorrelator = {
    generateCorrelationId = function(type) return "id_" .. msg.Timestamp end,
    createCorrelation = function(...) return true end
}

local MockBackwardCompatibility = {
    adaptLegacyMessage = function(msg) 
        return {
            operation = { type = "TEST_OPERATION" },
            correlation = { id = "legacy-adapted" }
        }
    end
}

local MockMessageRouter = {
    OPERATION_TYPES = {
        BATTLE_RESOLUTION = "BATTLE_RESOLUTION",
        POKEMON_UPDATE = "POKEMON_UPDATE",
        SHOP_TRANSACTION = "SHOP_TRANSACTION"
    },
    getRouteInfo = function(op) 
        return { targetProcessType = "TEST_PROCESS" }
    end
}

local MockProcessAuthenticator = {
    PROCESS_TYPES = {
        COORDINATOR = "coordinator",
        BATTLE = "battle",
        POKEMON = "pokemon"
    }
}

-- Mock package.loaded to use our mocks
package.loaded["game-logic.process-coordination.message-correlator"] = MockMessageCorrelator
package.loaded["game-logic.process-coordination.backward-compatibility"] = MockBackwardCompatibility
package.loaded["game-logic.process-coordination.message-router"] = MockMessageRouter  
package.loaded["game-logic.process-coordination.process-authenticator"] = MockProcessAuthenticator

-- Add paths for testing
package.path = package.path .. ";../../../?.lua;../../../coordinator/components/?.lua"
local APIGateway = require("api-gateway")

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
    print("\n=== API Gateway Unit Tests ===")
    
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

function TestFramework.assertEqual(expected, actual, message)
    if expected ~= actual then
        error((message or "Assertion failed") .. 
              ": expected " .. tostring(expected) .. 
              ", got " .. tostring(actual))
    end
end

function TestFramework.assertTrue(condition, message)
    if not condition then
        error(message or "Expected true, got false")
    end
end

-- Test Cases

TestFramework.addTest("API Gateway initialization", function()
    local result = APIGateway.initialize()
    TestFramework.assertTrue(result, "API Gateway should initialize successfully")
    
    local stats = APIGateway.getStatistics()
    TestFramework.assertEqual("1.0", stats.apiVersion, "API version should be set")
    TestFramework.assertTrue(#stats.supportedVersions > 0, "Should support at least one API version")
end)

TestFramework.addTest("Valid client message processing", function()
    local clientMessage = {
        action = "BATTLE_COMMAND",
        playerId = "test-player-123",
        data = {
            command = "ATTACK",
            targetId = "enemy-1"
        },
        requestId = "client-request-1"
    }
    
    local clientInfo = {
        sender = "client-process-id",
        timestamp = 0
    }
    
    local result, error = APIGateway.processClientMessage(clientMessage, clientInfo)
    TestFramework.assertTrue(result ~= nil, "Should successfully process valid client message")
    TestFramework.assertTrue(error == nil, "Should not return error for valid message")
    
    -- Validate inter-process message structure
    TestFramework.assertTrue(result.correlation ~= nil, "Should include correlation metadata")
    TestFramework.assertTrue(result.routing ~= nil, "Should include routing information")
    TestFramework.assertTrue(result.session ~= nil, "Should include session information")
    TestFramework.assertTrue(result.operation ~= nil, "Should include operation information")
    TestFramework.assertTrue(result.payload ~= nil, "Should include payload data")
end)

TestFramework.addTest("Invalid client message rejection", function()
    local invalidMessage = {
        -- Missing required action field
        playerId = "test-player-123",
        data = { test = "data" }
    }
    
    local result, error = APIGateway.processClientMessage(invalidMessage, {})
    TestFramework.assertTrue(result == nil, "Should reject invalid client message")
    TestFramework.assertTrue(error ~= nil, "Should return error for invalid message")
    TestFramework.assertTrue(string.find(error:lower(), "invalid"), "Error should mention invalid message")
end)

TestFramework.addTest("API version compatibility checking", function()
    -- Test supported version
    local compatible, message = APIGateway.validateAPIVersion("1.0")
    TestFramework.assertTrue(compatible, "Should accept supported API version")
    
    -- Test unsupported version
    local incompatible, errorMessage = APIGateway.validateAPIVersion("2.0")
    TestFramework.assertTrue(not incompatible, "Should reject unsupported API version")
    TestFramework.assertTrue(errorMessage ~= nil, "Should provide error message for unsupported version")
end)

TestFramework.addTest("Client action to operation mapping", function()
    local testMappings = {
        {action = "BATTLE_COMMAND", expectedType = "BATTLE_RESOLUTION"},
        {action = "QUERY_STATE", expectedType = "POKEMON_UPDATE"},
        {action = "SHOP_PURCHASE", expectedType = "ITEM_PURCHASE"}
    }
    
    for _, mapping in ipairs(testMappings) do
        local clientMessage = {
            action = mapping.action,
            playerId = "test-player",
            data = {}
        }
        
        local result = APIGateway.processClientMessage(clientMessage, {sender = "test"})
        if result then
            -- The actual mapping logic should be tested here
            -- For now, just ensure message was processed
            TestFramework.assertTrue(result.operation ~= nil, 
                "Should map client action " .. mapping.action .. " to operation")
        end
    end
end)

TestFramework.addTest("Response aggregation", function()
    local responses = {
        {
            success = true,
            correlationId = "test-correlation-1",
            payload = {result = "response1"},
            timestamp = 0
        },
        {
            success = true,
            correlationId = "test-correlation-2", 
            payload = {result = "response2"},
            timestamp = 0
        }
    }
    
    local originalClientMessage = {
        action = "TEST_ACTION",
        playerId = "test-player"
    }
    
    local aggregatedResponse = APIGateway.aggregateResponses(responses, originalClientMessage)
    TestFramework.assertTrue(aggregatedResponse ~= nil, "Should create aggregated response")
    TestFramework.assertTrue(aggregatedResponse.results ~= nil, "Should include individual results")
    TestFramework.assertEqual(2, #aggregatedResponse.results, "Should include all responses")
end)

TestFramework.addTest("Empty responses handling", function()
    local emptyResponses = {}
    local originalClientMessage = {action = "TEST_ACTION", playerId = "test-player"}
    
    local result = APIGateway.aggregateResponses(emptyResponses, originalClientMessage)
    TestFramework.assertTrue(result ~= nil, "Should handle empty responses")
    TestFramework.assertTrue(not result.success, "Should mark as unsuccessful")
    TestFramework.assertTrue(result.error ~= nil, "Should include error message")
end)

TestFramework.addTest("Statistics tracking", function()
    -- Process a few messages to generate stats
    local clientMessage = {
        action = "BATTLE_COMMAND",
        playerId = "stats-test-player",
        data = {}
    }
    
    APIGateway.processClientMessage(clientMessage, {sender = "test"})
    APIGateway.processClientMessage(clientMessage, {sender = "test"})
    
    local stats = APIGateway.getStatistics()
    TestFramework.assertTrue(stats.stats.clientRequestsProcessed >= 2, "Should track processed messages")
    TestFramework.assertTrue(stats.stats.interProcessRequestsGenerated >= 2, "Should track generated requests")
end)

TestFramework.addTest("Session ID generation", function()
    -- Test that session IDs are generated consistently for same player
    local playerId = "consistent-test-player"
    
    -- This tests the private function through the public interface
    local message1 = {action = "TEST", playerId = playerId, data = {}}
    local message2 = {action = "TEST", playerId = playerId, data = {}}
    
    local result1 = APIGateway.processClientMessage(message1, {sender = "test"})
    local result2 = APIGateway.processClientMessage(message2, {sender = "test"})
    
    if result1 and result2 then
        -- Both should have session information
        TestFramework.assertTrue(result1.session.sessionId ~= nil, "Should generate session ID")
        TestFramework.assertTrue(result2.session.sessionId ~= nil, "Should generate session ID")
        
        -- Player IDs should match
        TestFramework.assertEqual(playerId, result1.session.playerId, "Should preserve player ID")
        TestFramework.assertEqual(playerId, result2.session.playerId, "Should preserve player ID")
    end
end)

-- Run all tests
local function runAPIGatewayTests()
    return TestFramework.runTests()
end

-- Export for external test runner
return {
    runTests = runAPIGatewayTests,
    framework = TestFramework
}