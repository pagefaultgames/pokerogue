-- Integration Tests for Process Deployment and Accessibility

-- Mock AO environment for integration testing
local function setupMockAO()
    -- Mock process registry for testing deployment
    local processRegistry = {}
    
    -- Mock AO Handlers system with more complete functionality
    Handlers = {
        utils = {
            hasMatchingTag = function(tag, value)
                return function(msg)
                    return msg.Tags and msg.Tags[tag] == value
                end
            end
        },
        add = function(name, pattern, handler)
            if not processRegistry.handlers then
                processRegistry.handlers = {}
            end
            processRegistry.handlers[name] = {
                pattern = pattern,
                handler = handler,
                registered_at = os.time()
            }
            return true
        end,
        list = function()
            return processRegistry.handlers or {}
        end,
        _registry = processRegistry -- For test access
    }
    
    -- Mock json global
    json = {
        encode = function(data)
            if type(data) == "table" then
                local result = "{"
                local first = true
                for k, v in pairs(data) do
                    if not first then result = result .. "," end
                    first = false
                    result = result .. '"' .. tostring(k) .. '":"' .. tostring(v) .. '"'
                end
                return result .. "}"
            end
            return tostring(data)
        end,
        decode = function(str)
            -- Simple mock decode
            return { decoded = "mock" }
        end
    }
    
    -- Mock os functions
    os.time = function() return 1234567890 end
    os.date = function(fmt, timestamp)
        return "2025-08-27 10:00:00"
    end
    
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
    
    -- Mock print function to capture output
    local capturedOutput = {}
    print = function(...)
        local args = {...}
        local output = ""
        for i, v in ipairs(args) do
            if i > 1 then output = output .. "\t" end
            output = output .. tostring(v)
        end
        table.insert(capturedOutput, output)
    end
    
    return capturedOutput
end

-- Test Framework
local tests = {}
local testResults = { passed = 0, failed = 0, errors = {} }

function runTest(testName, testFunc)
    local success, result = pcall(testFunc)
    if success and result then
        testResults.passed = testResults.passed + 1
        io.write("✓ " .. testName .. "\n")
    else
        testResults.failed = testResults.failed + 1
        local errorMsg = result and tostring(result) or "Test failed"
        table.insert(testResults.errors, testName .. ": " .. errorMsg)
        io.write("✗ " .. testName .. " - " .. errorMsg .. "\n")
    end
end

-- Initialize test environment
local capturedOutput = setupMockAO()

-- Test Cases

function tests.testProcessDeployment()
    -- Test process can be initialized
    local success = pcall(function()
        dofile("ao-processes/main.lua")
    end)
    
    assert(success, "Process should deploy successfully")
    
    -- Verify process metadata is set
    assert(PROCESS_NAME ~= nil, "Process name should be set")
    assert(PROCESS_VERSION ~= nil, "Process version should be set")
    assert(PROCESS_CAPABILITIES ~= nil, "Process capabilities should be set")
    
    return true
end

function tests.testHandlerRegistration()
    -- Load the main process to ensure handlers are registered
    dofile("ao-processes/main.lua")
    
    -- Verify handlers are registered during initialization
    local handlers = Handlers.list()
    
    assert(type(handlers) == "table", "Handlers should be registered")
    assert(handlers["admin-info"] ~= nil, "Admin info handler should be registered")
    assert(handlers["admin-discover"] ~= nil, "Admin discover handler should be registered")
    
    -- Verify handler registry is populated
    assert(REGISTERED_HANDLERS ~= nil, "Internal handler registry should exist")
    assert(REGISTERED_HANDLERS["admin-info"] ~= nil, "Admin info should be in registry")
    assert(REGISTERED_HANDLERS["admin-discover"] ~= nil, "Admin discover should be in registry")
    
    return true
end

function tests.testProcessInfoHandler()
    -- Ensure handlers are loaded
    dofile("ao-processes/main.lua")
    
    -- Create test message for process info
    local responseReceived = false
    local responseData = nil
    
    local testMsg = {
        From = "integration-test-sender",
        Tags = { Action = "Info" },
        reply = function(response)
            responseReceived = true
            responseData = response
        end
    }
    
    -- Execute the admin info handler
    local handler = Handlers.list()["admin-info"]
    assert(handler ~= nil, "Admin info handler should exist")
    
    handler.handler(testMsg)
    
    -- Verify response
    assert(responseReceived, "Response should be received")
    assert(responseData.Target == "integration-test-sender", "Response target should be correct")
    assert(responseData.Tags.Action == "Info-Response", "Response action should be correct")
    assert(responseData.Tags.Success == "true", "Response should indicate success")
    assert(responseData.Data ~= nil, "Response should contain data")
    
    return true
end

function tests.testHandlerDiscovery()
    -- Ensure handlers are loaded
    dofile("ao-processes/main.lua")
    
    -- Create test message for handler discovery
    local responseReceived = false
    local responseData = nil
    
    local testMsg = {
        From = "integration-test-sender",
        Tags = { Action = "Discover-Handlers" },
        reply = function(response)
            responseReceived = true
            responseData = response
        end
    }
    
    -- Execute the handler discovery
    local handler = Handlers.list()["admin-discover"]
    assert(handler ~= nil, "Admin discover handler should exist")
    
    handler.handler(testMsg)
    
    -- Verify response
    assert(responseReceived, "Discovery response should be received")
    assert(responseData.Target == "integration-test-sender", "Discovery response target should be correct")
    assert(responseData.Tags.Action == "Discover-Response", "Discovery response action should be correct")
    assert(responseData.Tags.Success == "true", "Discovery response should indicate success")
    assert(responseData.Data ~= nil, "Discovery response should contain data")
    
    return true
end

function tests.testErrorHandling()
    -- Test error handling by triggering a handler error
    local errorResponseReceived = false
    local errorResponseData = nil
    
    local testMsg = {
        From = "integration-test-sender",
        Tags = { Action = "Invalid-Action" }, -- This should trigger an error
        reply = function(response)
            errorResponseReceived = true
            errorResponseData = response
        end
    }
    
    -- Try to find and execute a non-existent handler
    -- This tests the error handling framework
    local foundHandler = false
    for name, handlerInfo in pairs(Handlers.list()) do
        local pattern = handlerInfo.pattern
        if pattern(testMsg) then
            foundHandler = true
            handlerInfo.handler(testMsg)
            break
        end
    end
    
    -- Since no handler matches "Invalid-Action", no response should be generated
    -- This tests that the system doesn't crash on unhandled messages
    assert(not foundHandler, "Invalid action should not match any handlers")
    
    return true
end

function tests.testMessageRouting()
    -- Ensure handlers are loaded
    dofile("ao-processes/main.lua")
    
    -- Test that messages are routed to correct handlers
    local infoHandlerCalled = false
    local discoverHandlerCalled = false
    
    -- Mock handlers to track calls
    local originalInfoHandler = Handlers.list()["admin-info"].handler
    local originalDiscoverHandler = Handlers.list()["admin-discover"].handler
    
    Handlers.list()["admin-info"].handler = function(msg)
        infoHandlerCalled = true
        return originalInfoHandler(msg)
    end
    
    Handlers.list()["admin-discover"].handler = function(msg)
        discoverHandlerCalled = true 
        return originalDiscoverHandler(msg)
    end
    
    -- Test Info message routing
    local infoMsg = {
        From = "test-sender",
        Tags = { Action = "Info" },
        reply = function() end
    }
    
    local infoPattern = Handlers.list()["admin-info"].pattern
    if infoPattern(infoMsg) then
        Handlers.list()["admin-info"].handler(infoMsg)
    end
    
    -- Test Discover message routing
    local discoverMsg = {
        From = "test-sender", 
        Tags = { Action = "Discover-Handlers" },
        reply = function() end
    }
    
    local discoverPattern = Handlers.list()["admin-discover"].pattern
    if discoverPattern(discoverMsg) then
        Handlers.list()["admin-discover"].handler(discoverMsg)
    end
    
    assert(infoHandlerCalled, "Info handler should be called for Info messages")
    assert(discoverHandlerCalled, "Discover handler should be called for Discover messages")
    
    return true
end

function tests.testProcessMetadataCompliance()
    -- Test AO protocol compliance
    local infoMsg = {
        From = "compliance-test",
        Tags = { Action = "Info" },
        reply = function(response)
            -- Parse the response data to check compliance
            assert(response.Data ~= nil, "Process info should provide data")
            -- In real implementation, would decode JSON and verify structure
        end
    }
    
    local handler = Handlers.list()["admin-info"]
    handler.handler(infoMsg)
    
    -- Verify process capabilities are defined
    assert(type(PROCESS_CAPABILITIES) == "table", "Process capabilities should be defined")
    assert(#PROCESS_CAPABILITIES > 0, "Process should have at least one capability")
    
    return true
end

function tests.testProcessInitializationSequence()
    -- Clear captured output and reload process to capture initialization
    for i = 1, #capturedOutput do
        capturedOutput[i] = nil
    end
    
    -- Load process to capture initialization output
    dofile("ao-processes/main.lua")
    
    -- Verify that all components were initialized in correct order
    -- Check captured output from process startup
    local foundInit = false
    local foundHandlerInit = false
    local foundReady = false
    
    for _, output in ipairs(capturedOutput) do
        if output:match("Initializing PokéRogue AO Process") then
            foundInit = true
        elseif output:match("Handler initialization complete") then
            foundHandlerInit = true
        elseif output:match("ready and listening") then
            foundReady = true
        end
    end
    
    assert(foundInit, "Process initialization message should be logged")
    assert(foundHandlerInit, "Handler initialization should be logged")
    assert(foundReady, "Process ready message should be logged")
    
    return true
end

function tests.testConcurrentMessageHandling()
    -- Ensure handlers are loaded
    dofile("ao-processes/main.lua")
    
    -- Test that multiple messages can be handled without interference
    local responses = {}
    
    local msg1 = {
        From = "sender-1",
        Tags = { Action = "Info" },
        reply = function(response)
            responses["sender-1"] = response
        end
    }
    
    local msg2 = {
        From = "sender-2", 
        Tags = { Action = "Discover-Handlers" },
        reply = function(response)
            responses["sender-2"] = response
        end
    }
    
    local msg3 = {
        From = "sender-3",
        Tags = { Action = "Info" },
        reply = function(response)
            responses["sender-3"] = response
        end
    }
    
    -- Process messages concurrently (simulate)
    local infoHandler = Handlers.list()["admin-info"].handler
    local discoverHandler = Handlers.list()["admin-discover"].handler
    
    infoHandler(msg1)
    discoverHandler(msg2)
    infoHandler(msg3)
    
    -- Verify all responses were received
    assert(responses["sender-1"] ~= nil, "First sender should receive response")
    assert(responses["sender-2"] ~= nil, "Second sender should receive response") 
    assert(responses["sender-3"] ~= nil, "Third sender should receive response")
    
    -- Verify responses went to correct senders
    assert(responses["sender-1"].Target == "sender-1", "Response should go to correct sender")
    assert(responses["sender-2"].Target == "sender-2", "Response should go to correct sender")
    assert(responses["sender-3"].Target == "sender-3", "Response should go to correct sender")
    
    return true
end

-- Run all tests
io.write("Running Process Integration Tests\n")
io.write("=================================\n")

for testName, testFunc in pairs(tests) do
    runTest(testName, testFunc)
end

io.write("\nTest Results:\n")
io.write("Passed: " .. testResults.passed .. "\n")
io.write("Failed: " .. testResults.failed .. "\n")

if #testResults.errors > 0 then
    io.write("\nErrors:\n")
    for _, error in ipairs(testResults.errors) do
        io.write("  " .. error .. "\n")
    end
end

-- Return test success status
return testResults.failed == 0