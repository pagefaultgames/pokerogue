-- Unit Tests for AO Local Setup Components
-- Tests the local development environment and emulation functionality

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

-- Test suite
local function testAOEmulatorCreation()
    print("Testing AO Emulator creation...")
    
    local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
    
    local emulator = AOEmulator.new({
        processId = "test-process",
        owner = "test-owner"
    })
    
    assertNotNil(emulator, "Emulator should be created")
    assertEquals("test-process", emulator.processId, "Process ID should be set")
    assertEquals("test-owner", emulator.owner, "Owner should be set")
    assertNotNil(emulator.state, "State should be initialized")
    assertNotNil(emulator.messages, "Messages should be initialized")
    
    print("✅ AO Emulator creation test passed")
    return true
end

local function testMessageSending()
    print("Testing message sending...")
    
    local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
    local emulator = AOEmulator.new({processId = "msg-test"})
    
    local testMessage = {
        From = "test-sender",
        Action = "Test-Action",
        Data = "test data"
    }
    
    local result = emulator:sendMessage(testMessage)
    
    assertNotNil(result, "Result should not be nil")
    assertNotNil(result.message, "Result should contain message")
    assertEquals("Test-Action", result.message.Action, "Message action preserved")
    assertEquals("test-sender", result.message.From, "Message sender preserved")
    
    -- Check message storage
    local messages = emulator:getMessages()
    assertEquals(1, #messages, "One message should be stored")
    assertEquals("Test-Action", messages[1].Action, "Stored message action correct")
    
    print("✅ Message sending test passed")
    return true
end

local function testHandlerRegistration()
    print("Testing handler registration...")
    
    local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
    local Handlers = require("development-tools/ao-local-setup/ao-emulator").Handlers
    
    -- Clear existing handlers
    Handlers.list = {}
    
    local handlerExecuted = false
    local receivedMessage = nil
    
    Handlers:add("TestHandler", "TestAction", function(message)
        handlerExecuted = true
        receivedMessage = message
        return {success = true, message = "Handler executed"}
    end)
    
    assertEquals(1, #Handlers.list, "One handler should be registered")
    
    -- Test handler execution
    local testMessage = {Action = "TestAction", From = "test"}
    local results = Handlers:handle(testMessage)
    
    assertTrue(handlerExecuted, "Handler should have been executed")
    assertNotNil(receivedMessage, "Handler should have received message")
    assertEquals("TestAction", receivedMessage.Action, "Handler received correct action")
    assertEquals(1, #results, "One handler result expected")
    assertTrue(results[1].success, "Handler execution should be successful")
    
    print("✅ Handler registration test passed")
    return true
end

local function testStateManagement()
    print("Testing state management...")
    
    local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
    local emulator = AOEmulator.new({processId = "state-test"})
    
    -- Set state values
    emulator.state.testValue = "test123"
    emulator.state.numbers = {1, 2, 3}
    emulator.state.nested = {key = "value", inner = {data = "nested"}}
    
    -- Get state
    local retrievedState = emulator:getState()
    
    assertEquals("test123", retrievedState.testValue, "Simple value should be retrieved")
    assertEquals(3, #retrievedState.numbers, "Array should be retrieved")
    assertEquals("value", retrievedState.nested.key, "Nested value should be retrieved")
    assertEquals("nested", retrievedState.nested.inner.data, "Deep nested value should be retrieved")
    
    -- Test state isolation
    retrievedState.testValue = "modified"
    local secondRetrieval = emulator:getState()
    assertEquals("test123", secondRetrieval.testValue, "Original state should not be modified")
    
    print("✅ State management test passed")
    return true
end

local function testMessageProcessor()
    print("Testing message processor...")
    
    local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
    local MessageProcessor = require("development-tools/ao-local-setup/message-processor")
    
    local emulator = AOEmulator.new({processId = "processor-test"})
    local processor = MessageProcessor.new(emulator)
    
    assertNotNil(processor, "Message processor should be created")
    assertNotNil(processor.emulator, "Processor should reference emulator")
    
    -- Test message creation templates
    local authMsg = processor:createAuthMessage("test-wallet", "Auth-Test")
    assertEquals("test-wallet", authMsg.From, "Auth message From should be set")
    assertEquals("Auth-Test", authMsg.Action, "Auth message Action should be set")
    
    local battleMsg = processor:createBattleMessage("battle-wallet", "battle-data")
    assertEquals("battle-wallet", battleMsg.From, "Battle message From should be set")
    assertEquals("Battle-Action", battleMsg.Action, "Battle message Action should be set")
    
    print("✅ Message processor test passed")
    return true
end

local function testMessageValidation()
    print("Testing message validation...")
    
    local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator
    local MessageProcessor = require("development-tools/ao-local-setup/message-processor")
    
    local emulator = AOEmulator.new({processId = "validation-test"})
    local processor = MessageProcessor.new(emulator)
    
    -- Test valid message
    local validMessage = {
        From = "valid-wallet",
        Action = "Valid-Action",
        Data = "test data"
    }
    
    local isValid, errors = processor:validateMessage(validMessage)
    assertTrue(isValid, "Valid message should pass validation")
    assertEquals(0, #errors, "Valid message should have no errors")
    
    -- Test invalid message (missing From)
    local invalidMessage1 = {
        Action = "Valid-Action"
    }
    
    isValid, errors = processor:validateMessage(invalidMessage1)
    assertTrue(not isValid, "Message missing From should fail validation")
    assertTrue(#errors > 0, "Invalid message should have errors")
    
    -- Test invalid message (missing Action)
    local invalidMessage2 = {
        From = "valid-wallet"
    }
    
    isValid, errors = processor:validateMessage(invalidMessage2)
    assertTrue(not isValid, "Message missing Action should fail validation")
    assertTrue(#errors > 0, "Invalid message should have errors")
    
    print("✅ Message validation test passed")
    return true
end

local function testSetupModule()
    print("Testing setup module...")
    
    local Setup = require("development-tools/ao-local-setup/setup")
    
    -- Test file utilities
    local testContent = "test content"
    local testPath = "/tmp/setup-test.txt"
    
    assertTrue(Setup.writeFile(testPath, testContent), "File writing should succeed")
    assertTrue(Setup.fileExists(testPath), "Written file should exist")
    
    local readContent = Setup.readFile(testPath)
    assertEquals(testContent, readContent, "File content should match")
    
    -- Clean up
    os.remove(testPath)
    
    print("✅ Setup module test passed")
    return true
end

local function testValidationModule()
    print("Testing validation module...")
    
    local Validation = require("development-tools/ao-local-setup/validation")
    
    -- Test quick validation
    local result = Validation.quickValidation()
    assertTrue(result, "Quick validation should pass")
    
    print("✅ Validation module test passed")
    return true
end

-- Run all tests
local function runTests()
    print("🧪 Running AO Local Setup Unit Tests")
    print("====================================")
    
    local tests = {
        testAOEmulatorCreation,
        testMessageSending,
        testHandlerRegistration,
        testStateManagement,
        testMessageProcessor,
        testMessageValidation,
        testSetupModule,
        testValidationModule
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
        print("🎉 All AO Local Setup tests passed!")
        return true
    else
        print("")
        print("❌ Some tests failed. Please review the output above.")
        return false
    end
end

-- Execute tests
return runTests()