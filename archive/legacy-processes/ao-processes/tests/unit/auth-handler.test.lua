-- auth-handler.test.lua: Unit tests for Player Authorization System

-- Load the auth handler module
package.path = package.path .. ";../../?.lua;../../handlers/?.lua"
local AuthHandler = require("auth-handler")

-- Simple test framework
local TestRunner = {
    tests = {},
    passed = 0,
    failed = 0
}

function TestRunner.test(name, testFunc)
    table.insert(TestRunner.tests, {name = name, func = testFunc})
end

function TestRunner.run()
    print("Running AuthHandler Tests...")
    print("=" .. string.rep("=", 50))
    
    for _, test in ipairs(TestRunner.tests) do
        local success, error = pcall(test.func)
        if success then
            print("✓ " .. test.name)
            TestRunner.passed = TestRunner.passed + 1
        else
            print("✗ " .. test.name .. " - " .. tostring(error))
            TestRunner.failed = TestRunner.failed + 1
        end
    end
    
    print("=" .. string.rep("=", 50))
    print(string.format("Results: %d passed, %d failed", TestRunner.passed, TestRunner.failed))
    return TestRunner.failed == 0
end

function TestRunner.assert(condition, message)
    if not condition then
        error(message or "Assertion failed")
    end
end

function TestRunner.assertError(func, expectedErrorCode, message)
    local success, err = pcall(func)
    TestRunner.assert(not success, message or "Expected function to throw error")
    if type(err) == "table" and err.code then
        TestRunner.assert(err.code == expectedErrorCode, 
            string.format("Expected error code %s, got %s", expectedErrorCode, err.code))
    else
        error(string.format("Expected error object with code %s, got %s", expectedErrorCode, type(err)))
    end
end

-- Test Cases

TestRunner.test("validateSender - valid address", function()
    local result = AuthHandler.validateSender("1234567890abcdef")
    TestRunner.assert(result == true, "Should return true for valid sender")
end)

TestRunner.test("validateSender - nil sender", function()
    TestRunner.assertError(function()
        AuthHandler.validateSender(nil)
    end, "AUTH_001", "Should throw error for nil sender")
end)

TestRunner.test("validateSender - empty string", function()
    TestRunner.assertError(function()
        AuthHandler.validateSender("")
    end, "AUTH_001", "Should throw error for empty string")
end)

TestRunner.test("validateSender - too short", function()
    TestRunner.assertError(function()
        AuthHandler.validateSender("123")
    end, "AUTH_001", "Should throw error for too short address")
end)

TestRunner.test("validatePlayerOwnership - valid ownership", function()
    local playerId = "player123456789" -- Valid length
    local messageFrom = "player123456789" -- Same as playerId
    local result = AuthHandler.validatePlayerOwnership(playerId, messageFrom)
    TestRunner.assert(result == true, "Should return true for valid ownership")
end)

TestRunner.test("validatePlayerOwnership - ownership violation", function()
    TestRunner.assertError(function()
        AuthHandler.validatePlayerOwnership("player123456789", "hacker456789123")
    end, "AUTH_002", "Should throw error for ownership violation")
end)

TestRunner.test("validatePlayerOwnership - missing player ID", function()
    TestRunner.assertError(function()
        AuthHandler.validatePlayerOwnership(nil, "player123456789")
    end, "AUTH_004", "Should throw error for missing player ID")
end)

TestRunner.test("validateBattleParticipation - valid participant", function()
    local battleState = {
        participants = {"player123456789", "player456789123"}
    }
    local result = AuthHandler.validateBattleParticipation("player123456789", battleState, "player123456789")
    TestRunner.assert(result == true, "Should return true for valid battle participant")
end)

TestRunner.test("validateBattleParticipation - non-participant", function()
    local battleState = {
        participants = {"player456789123", "player789123456"}
    }
    TestRunner.assertError(function()
        AuthHandler.validateBattleParticipation("player123456789", battleState, "player123456789")
    end, "AUTH_003", "Should throw error for non-participant")
end)

TestRunner.test("validateBattleParticipation - invalid battle state", function()
    TestRunner.assertError(function()
        AuthHandler.validateBattleParticipation("player123456789", nil, "player123456789")
    end, "AUTH_003", "Should throw error for invalid battle state")
end)

TestRunner.test("authorizePlayerOperation - valid operation", function()
    local result = AuthHandler.authorizePlayerOperation("save_game", "player123456789", "player123456789")
    TestRunner.assert(result.success == true, "Should authorize valid operation")
    TestRunner.assert(result.playerId == "player123456789", "Should return correct player ID")
    TestRunner.assert(result.operation == "save_game", "Should return correct operation")
end)

TestRunner.test("authorizePlayerOperation - battle action with valid participant", function()
    local battleState = {
        participants = {"player123456789", "player456789123"}
    }
    local additionalData = {battleState = battleState}
    local result = AuthHandler.authorizePlayerOperation("battle_action", "player123456789", "player123456789", additionalData)
    TestRunner.assert(result.success == true, "Should authorize valid battle action")
end)

TestRunner.test("authorizePlayerOperation - unauthorized operation", function()
    local result = AuthHandler.authorizePlayerOperation("save_game", "player123456789", "hacker456789123")
    TestRunner.assert(result.success == false, "Should deny unauthorized operation")
    TestRunner.assert(result.error.code == "AUTH_002", "Should return ownership violation error")
end)

TestRunner.test("validateMessageFormat - valid message", function()
    local msg = {
        From = "player123",
        Data = {action = "save"},
        Tags = {type = "game"}
    }
    local result = AuthHandler.validateMessageFormat(msg)
    TestRunner.assert(result.sender == "player123", "Should extract sender correctly")
    TestRunner.assert(result.data.action == "save", "Should extract data correctly")
    TestRunner.assert(result.tags.type == "game", "Should extract tags correctly")
end)

TestRunner.test("validateMessageFormat - missing From field", function()
    TestRunner.assertError(function()
        AuthHandler.validateMessageFormat({Data = {}})
    end, "AUTH_005", "Should throw error for missing From field")
end)

TestRunner.test("validateMessageFormat - nil message", function()
    TestRunner.assertError(function()
        AuthHandler.validateMessageFormat(nil)
    end, "AUTH_005", "Should throw error for nil message")
end)

TestRunner.test("getErrorInfo - known error code", function()
    local errorInfo = AuthHandler.getErrorInfo("AUTH_001")
    TestRunner.assert(errorInfo.code == "AUTH_001", "Should return correct error code")
    TestRunner.assert(errorInfo.category == "AUTHORIZATION", "Should return authorization category")
    TestRunner.assert(type(errorInfo.message) == "string", "Should return error message")
end)

TestRunner.test("getErrorInfo - unknown error code", function()
    local errorInfo = AuthHandler.getErrorInfo("UNKNOWN")
    TestRunner.assert(errorInfo.code == "UNKNOWN", "Should return provided error code")
    TestRunner.assert(errorInfo.message == "Unknown authorization error", "Should return default message")
end)

-- Run all tests
return TestRunner.run()