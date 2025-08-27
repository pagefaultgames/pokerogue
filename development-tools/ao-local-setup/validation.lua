-- Environment Validation for AO Emulation
-- Ensures proper AO emulation functionality and compatibility

local Validation = {}

function Validation.runAllTests()
    print("🔍 AO Emulation Environment Validation")
    print("=====================================")
    
    local testResults = {
        total = 0,
        passed = 0,
        failed = 0,
        details = {}
    }
    
    -- Test suite
    local tests = {
        {name = "AO Emulator Loading", func = Validation.testEmulatorLoading},
        {name = "Message Processing", func = Validation.testMessageProcessing},
        {name = "Handler Registration", func = Validation.testHandlerRegistration},
        {name = "State Management", func = Validation.testStateManagement},
        {name = "Message Validation", func = Validation.testMessageValidation},
        {name = "Scenario Execution", func = Validation.testScenarioExecution},
        {name = "Process Loading", func = Validation.testProcessLoading},
        {name = "Error Handling", func = Validation.testErrorHandling}
    }
    
    for _, test in ipairs(tests) do
        testResults.total = testResults.total + 1
        print("")
        print("Running: " .. test.name)
        print(string.rep("-", 40))
        
        local success, result = pcall(test.func)
        
        if success and result then
            testResults.passed = testResults.passed + 1
            print("✅ " .. test.name .. " - PASSED")
            testResults.details[test.name] = {status = "PASSED", message = "Test completed successfully"}
        else
            testResults.failed = testResults.failed + 1
            local error_msg = result or "Unknown error"
            print("❌ " .. test.name .. " - FAILED: " .. tostring(error_msg))
            testResults.details[test.name] = {status = "FAILED", message = tostring(error_msg)}
        end
    end
    
    -- Summary
    print("")
    print("📊 Validation Summary")
    print("====================")
    print("Total Tests: " .. testResults.total)
    print("Passed: " .. testResults.passed)
    print("Failed: " .. testResults.failed)
    
    if testResults.failed == 0 then
        print("")
        print("🎉 All validation tests passed! AO emulation environment is ready.")
        return true, testResults
    else
        print("")
        print("❌ Some validation tests failed. Please review the issues above.")
        return false, testResults
    end
end

function Validation.testEmulatorLoading()
    -- Test loading AO emulator module
    local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
    
    if not AOEmulator then
        error("Failed to load AOEmulator")
    end
    
    -- Test creating emulator instance
    local emulator = AOEmulator.new({
        processId = "validation-test",
        owner = "validation-owner"
    })
    
    if not emulator then
        error("Failed to create AOEmulator instance")
    end
    
    if emulator.processId ~= "validation-test" then
        error("Process ID not set correctly")
    end
    
    print("   ✓ AOEmulator loaded and instantiated successfully")
    return true
end

function Validation.testMessageProcessing()
    local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
    local MessageProcessor = require("development-tools/ao-local-setup/message-processor")
    
    local emulator = AOEmulator.new({processId = "msg-test", owner = "msg-owner"})
    local processor = MessageProcessor.new(emulator)
    
    -- Create test message
    local testMessage = {
        From = "test-wallet",
        Action = "Test-Action",
        Data = "test data"
    }
    
    -- Process message
    local result = processor:processMessage(testMessage)
    
    if not result then
        error("Message processing returned no result")
    end
    
    if not result.message then
        error("Processed result missing message")
    end
    
    if result.message.Action ~= "Test-Action" then
        error("Message action not preserved")
    end
    
    print("   ✓ Message processing working correctly")
    return true
end

function Validation.testHandlerRegistration()
    local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
    local Handlers = require("development-tools/ao-local-setup/ao-emulator").Handlers
    
    local emulator = AOEmulator.new({processId = "handler-test", owner = "handler-owner"})
    
    -- Clear handlers and test registration
    Handlers.list = {}
    
    local handlerCalled = false
    Handlers:add("TestHandler", "TestAction", function(message)
        handlerCalled = true
        return {success = true}
    end)
    
    if #Handlers.list ~= 1 then
        error("Handler not registered correctly, expected 1 handler, got " .. #Handlers.list)
    end
    
    -- Test handler execution
    local testMessage = {Action = "TestAction", From = "test"}
    local results = Handlers:handle(testMessage)
    
    if not handlerCalled then
        error("Handler was not called")
    end
    
    if #results ~= 1 then
        error("Expected 1 handler result, got " .. #results)
    end
    
    print("   ✓ Handler registration and execution working correctly")
    return true
end

function Validation.testStateManagement()
    local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
    
    local emulator = AOEmulator.new({processId = "state-test", owner = "state-owner"})
    
    -- Test state setting and getting
    emulator.state.testValue = "test123"
    emulator.state.nested = {key = "value"}
    
    local retrievedState = emulator:getState()
    
    if retrievedState.testValue ~= "test123" then
        error("State value not retrieved correctly")
    end
    
    if not retrievedState.nested or retrievedState.nested.key ~= "value" then
        error("Nested state not retrieved correctly")
    end
    
    -- Test state isolation (deep copy)
    retrievedState.testValue = "modified"
    local secondRetrieval = emulator:getState()
    
    if secondRetrieval.testValue ~= "test123" then
        error("State not properly isolated - modifications affected original")
    end
    
    print("   ✓ State management working correctly")
    return true
end

function Validation.testMessageValidation()
    local MessageProcessor = require("development-tools/ao-local-setup/message-processor")
    local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
    
    local emulator = AOEmulator.new({processId = "validation-test", owner = "validation-owner"})
    local processor = MessageProcessor.new(emulator)
    
    -- Test valid message
    local validMessage = {
        From = "valid-wallet",
        Action = "Valid-Action",
        Data = "test"
    }
    
    local isValid, errors = processor:validateMessage(validMessage)
    if not isValid then
        error("Valid message failed validation: " .. table.concat(errors, ", "))
    end
    
    -- Test invalid message (missing From)
    local invalidMessage = {
        Action = "Valid-Action"
    }
    
    isValid, errors = processor:validateMessage(invalidMessage)
    if isValid then
        error("Invalid message passed validation")
    end
    
    if #errors == 0 then
        error("Validation errors not returned for invalid message")
    end
    
    print("   ✓ Message validation working correctly")
    return true
end

function Validation.testScenarioExecution()
    local MessageProcessor = require("development-tools/ao-local-setup/message-processor")
    local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
    
    local emulator = AOEmulator.new({processId = "scenario-test", owner = "scenario-owner"})
    local processor = MessageProcessor.new(emulator)
    
    -- Create test scenario
    local scenario = processor:createGameScenario(
        {"player1", "player2"},
        {
            {{type = "Move", data = "attack"}, {type = "Move", data = "defend"}},
            {{type = "Move", data = "heal"}, {type = "Move", data = "attack"}}
        }
    )
    
    if not scenario then
        error("Failed to create game scenario")
    end
    
    if #scenario.players ~= 2 then
        error("Scenario should have 2 players, got " .. #scenario.players)
    end
    
    if #scenario.messages ~= 4 then
        error("Scenario should have 4 messages, got " .. #scenario.messages)
    end
    
    -- Execute scenario (without loaded process, handlers will be empty)
    local results = processor:executeScenario(scenario)
    
    if not results then
        error("Scenario execution returned no results")
    end
    
    print("   ✓ Scenario execution working correctly")
    return true
end

function Validation.testProcessLoading()
    local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
    
    local emulator = AOEmulator.new({processId = "process-test", owner = "process-owner"})
    
    -- Create temporary test process file
    local testProcessContent = [[
-- Test process for validation
local testValue = "loaded"

Handlers.add("TestLoad", "TestLoad", function(message)
    return {success = true, loaded = testValue}
end)

return true
]]
    
    -- Write temporary file
    local tempFile = "/tmp/test-process.lua"
    local file = io.open(tempFile, "w")
    if file then
        file:write(testProcessContent)
        file:close()
    else
        error("Could not create temporary test file")
    end
    
    -- Test loading
    local success, err = pcall(function()
        return emulator:loadProcess(tempFile)
    end)
    
    if not success then
        error("Process loading failed: " .. tostring(err))
    end
    
    -- Clean up
    os.remove(tempFile)
    
    print("   ✓ Process loading working correctly")
    return true
end

function Validation.testErrorHandling()
    local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
    
    local emulator = AOEmulator.new({processId = "error-test", owner = "error-owner"})
    
    -- Test loading non-existent file
    local success, err = pcall(function()
        return emulator:loadProcess("nonexistent-file.lua")
    end)
    
    if success then
        error("Loading non-existent file should fail")
    end
    
    -- Test invalid process file
    local invalidContent = "invalid lua syntax {"
    local tempFile = "/tmp/invalid-process.lua"
    local file = io.open(tempFile, "w")
    if file then
        file:write(invalidContent)
        file:close()
    end
    
    success, err = pcall(function()
        return emulator:loadProcess(tempFile)
    end)
    
    if success then
        error("Loading invalid process should fail")
    end
    
    -- Clean up
    os.remove(tempFile)
    
    print("   ✓ Error handling working correctly")
    return true
end

-- Quick validation function for development
function Validation.quickValidation()
    print("🔥 Quick AO Emulation Validation")
    print("================================")
    
    local passed = 0
    local total = 3
    
    -- Test 1: Module loading
    print("1. Testing module loading...")
    local success = pcall(function()
        require("development-tools/ao-local-setup/ao-emulator")
        require("development-tools/ao-local-setup/message-processor")
    end)
    
    if success then
        print("   ✅ Modules load successfully")
        passed = passed + 1
    else
        print("   ❌ Module loading failed")
    end
    
    -- Test 2: Basic instantiation
    print("2. Testing basic instantiation...")
    success = pcall(function()
        local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
        local emulator = AOEmulator.new({processId = "quick-test"})
        return emulator
    end)
    
    if success then
        print("   ✅ Emulator instantiation works")
        passed = passed + 1
    else
        print("   ❌ Emulator instantiation failed")
    end
    
    -- Test 3: Message flow
    print("3. Testing message flow...")
    success = pcall(function()
        local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
        local MessageProcessor = require("development-tools/ao-local-setup/message-processor")
        
        local emulator = AOEmulator.new({processId = "flow-test"})
        local processor = MessageProcessor.new(emulator)
        
        processor:processMessage({From = "test", Action = "Test"})
        return true
    end)
    
    if success then
        print("   ✅ Message flow works")
        passed = passed + 1
    else
        print("   ❌ Message flow failed")
    end
    
    print("")
    if passed == total then
        print("🎉 Quick validation passed! (" .. passed .. "/" .. total .. ")")
        return true
    else
        print("❌ Quick validation issues found (" .. passed .. "/" .. total .. ")")
        return false
    end
end

return Validation