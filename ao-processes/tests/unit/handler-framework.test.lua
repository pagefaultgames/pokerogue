-- Unit Tests for Handler Registration Framework

-- Mock AO environment for testing
local function setupMockAO()
    -- Track registered handlers for verification
    local mockHandlers = {}
    
    -- Mock Handlers global
    Handlers = {
        utils = {
            hasMatchingTag = function(tag, value)
                return function(msg)
                    return msg.Tags and msg.Tags[tag] == value
                end
            end
        },
        add = function(name, pattern, handler)
            mockHandlers[name] = { pattern = pattern, handler = handler }
            return true
        end,
        _mock_handlers = mockHandlers  -- For test verification
    }
    
    -- Mock json global
    json = {
        encode = function(data)
            if type(data) == "table" then
                return "{\"mocked\":\"json\"}"
            end
            return tostring(data)
        end
    }
    
    -- Mock os functions
    os.time = function() return 1234567890 end
    os.date = function() return "2025-08-27 10:00:00" end
    
    -- Mock math.random
    local randomCounter = 0
    math.random = function(min, max)
        randomCounter = randomCounter + 1
        if min and max then
            return min + (randomCounter % (max - min + 1))
        else
            return randomCounter % 1000
        end
    end
end

-- Test Framework
local tests = {}
local testResults = { passed = 0, failed = 0, errors = {} }

function runTest(testName, testFunc)
    local success, result = pcall(testFunc)
    if success and result then
        testResults.passed = testResults.passed + 1
        print("✓ " .. testName)
    else
        testResults.failed = testResults.failed + 1
        local errorMsg = result and tostring(result) or "Test failed"
        table.insert(testResults.errors, testName .. ": " .. errorMsg)
        print("✗ " .. testName .. " - " .. errorMsg)
    end
end

-- Initialize test environment
setupMockAO()

-- Load the main module for testing
dofile("ao-processes/main.lua")

-- Test Cases

function tests.testHandlerRegistration()
    local handlerName = "test-registration"
    local testPattern = function() return true end
    local testHandler = function() return "test response" end
    
    -- Clear any existing handlers
    local initialCount = 0
    for _ in pairs(REGISTERED_HANDLERS) do
        initialCount = initialCount + 1
    end
    
    -- Register new handler
    registerHandler(handlerName, testPattern, testHandler)
    
    -- Verify registration in internal registry
    assert(REGISTERED_HANDLERS[handlerName] ~= nil, "Handler should be registered in internal registry")
    assert(REGISTERED_HANDLERS[handlerName].pattern == testPattern, "Handler pattern should be stored")
    assert(REGISTERED_HANDLERS[handlerName].handler == testHandler, "Handler function should be stored")
    assert(type(REGISTERED_HANDLERS[handlerName].registered_at) == "number", "Registration time should be recorded")
    
    -- Verify registration with AO Handlers
    assert(Handlers._mock_handlers[handlerName] ~= nil, "Handler should be registered with AO Handlers")
    
    return true
end

function tests.testHandlerRegistrationValidation()
    -- Test invalid registrations should fail
    local success1 = pcall(registerHandler, nil, function() end, function() end)
    assert(not success1, "Registration with nil name should fail")
    
    local success2 = pcall(registerHandler, "test-name", nil, function() end)
    assert(not success2, "Registration with nil pattern should fail")
    
    local success3 = pcall(registerHandler, "test-name", function() end, nil)
    assert(not success3, "Registration with nil handler should fail")
    
    return true
end

function tests.testMessageRouting()
    local testMessages = {}
    
    -- Register a test handler that captures messages
    registerHandler(
        "test-router",
        Handlers.utils.hasMatchingTag("Action", "Test"),
        function(msg)
            table.insert(testMessages, msg)
        end
    )
    
    -- Simulate message routing
    local testMsg = {
        Tags = { Action = "Test" },
        From = "test-sender"
    }
    
    -- Test the pattern matching
    local pattern = Handlers.utils.hasMatchingTag("Action", "Test")
    local shouldMatch = pattern(testMsg)
    assert(shouldMatch == true, "Message should match the pattern")
    
    -- Test non-matching message
    local nonMatchingMsg = {
        Tags = { Action = "NotTest" },
        From = "test-sender"
    }
    local shouldNotMatch = pattern(nonMatchingMsg)
    assert(shouldNotMatch == false, "Message should not match the pattern")
    
    return true
end

function tests.testHandlerDiscoverySystem()
    -- Register multiple handlers
    registerHandler("handler-1", function() return true end, function() end)
    registerHandler("handler-2", function() return true end, function() end) 
    registerHandler("handler-3", function() return true end, function() end)
    
    -- Test getting handler names
    local handlerNames = getRegisteredHandlerNames()
    assert(type(handlerNames) == "table", "Handler names should be returned as table")
    assert(#handlerNames >= 3, "Should have at least 3 registered handlers")
    
    -- Verify specific handlers are in the list
    local foundHandler1, foundHandler2, foundHandler3 = false, false, false
    for _, name in ipairs(handlerNames) do
        if name == "handler-1" then foundHandler1 = true end
        if name == "handler-2" then foundHandler2 = true end
        if name == "handler-3" then foundHandler3 = true end
    end
    
    assert(foundHandler1 and foundHandler2 and foundHandler3, "All registered handlers should be discoverable")
    
    return true
end

function tests.testHandlerRegistryPersistence()
    local testHandlerName = "persistence-test"
    local beforeTime = os.time()
    
    registerHandler(testHandlerName, function() return true end, function() return "test" end)
    
    -- Check that the handler registry persists the information
    local handlerInfo = REGISTERED_HANDLERS[testHandlerName]
    assert(handlerInfo ~= nil, "Handler info should be persisted")
    assert(handlerInfo.registered_at >= beforeTime, "Registration time should be accurate")
    assert(type(handlerInfo.pattern) == "function", "Pattern should be stored as function")
    assert(type(handlerInfo.handler) == "function", "Handler should be stored as function")
    
    return true
end

function tests.testMultipleHandlerRegistrations()
    -- Test registering multiple handlers doesn't interfere
    local handlers = {
        "multi-test-1",
        "multi-test-2", 
        "multi-test-3"
    }
    
    -- Register all handlers
    for i, name in ipairs(handlers) do
        registerHandler(
            name,
            Handlers.utils.hasMatchingTag("Action", "Multi" .. i),
            function() return "response" .. i end
        )
    end
    
    -- Verify all are registered
    for _, name in ipairs(handlers) do
        assert(REGISTERED_HANDLERS[name] ~= nil, "Handler " .. name .. " should be registered")
        assert(Handlers._mock_handlers[name] ~= nil, "Handler " .. name .. " should be in AO registry")
    end
    
    return true
end

function tests.testPatternUtilities()
    -- Test the hasMatchingTag utility
    local pattern = Handlers.utils.hasMatchingTag("TestTag", "TestValue")
    
    -- Should match when tag and value match
    local matchingMsg = { Tags = { TestTag = "TestValue" } }
    assert(pattern(matchingMsg) == true, "Should match when tag and value match")
    
    -- Should not match when tag is different
    local differentTagMsg = { Tags = { DifferentTag = "TestValue" } }
    assert(pattern(differentTagMsg) == false, "Should not match when tag is different")
    
    -- Should not match when value is different  
    local differentValueMsg = { Tags = { TestTag = "DifferentValue" } }
    assert(pattern(differentValueMsg) == false, "Should not match when value is different")
    
    -- Should not match when no tags
    local noTagsMsg = {}
    local result = pattern(noTagsMsg)
    -- The pattern function returns nil/falsy when no tags, which is expected
    assert(not result, "Should not match when no tags")
    
    return true
end

-- Run all tests
print("Running Handler Framework Unit Tests")
print("===================================")

for testName, testFunc in pairs(tests) do
    runTest(testName, testFunc)
end

print("\nTest Results:")
print("Passed: " .. testResults.passed)
print("Failed: " .. testResults.failed)

if #testResults.errors > 0 then
    print("\nErrors:")
    for _, error in ipairs(testResults.errors) do
        print("  " .. error)
    end
end

-- Return test success status
return testResults.failed == 0