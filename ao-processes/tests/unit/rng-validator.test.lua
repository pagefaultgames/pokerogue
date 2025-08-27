-- rng-validator.test.lua: Unit tests for RNG Validation System

package.path = package.path .. ";../../?.lua;../../game-logic/rng/?.lua"
local RngValidator = require("rng-validator")

-- Simple test framework (condensed)
local TestRunner = {tests = {}, passed = 0, failed = 0}
function TestRunner.test(name, testFunc) table.insert(TestRunner.tests, {name = name, func = testFunc}) end
function TestRunner.run()
    print("Running RngValidator Tests...")
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
function TestRunner.assert(condition, message) if not condition then error(message or "Assertion failed") end end
function TestRunner.assertError(func, expectedErrorCode, message)
    local success, err = pcall(func)
    TestRunner.assert(not success, message or "Expected function to throw error")
    TestRunner.assert(err.code == expectedErrorCode, 
        string.format("Expected error code %s, got %s", expectedErrorCode, err.code or "nil"))
end

-- Test Cases
TestRunner.test("validateBattleSeed - valid seed", function()
    local validSeed = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    local result = RngValidator.validateBattleSeed(validSeed)
    TestRunner.assert(result == true, "Should validate correct seed format")
end)

TestRunner.test("validateBattleSeed - invalid format", function()
    TestRunner.assertError(function()
        RngValidator.validateBattleSeed("invalid_seed")
    end, "RNG_001", "Should reject invalid seed format")
end)

TestRunner.test("validateRngState - valid state", function()
    local rngState = {counter = 10, seed = "abc123"}
    local result = RngValidator.validateRngState(rngState, 10)
    TestRunner.assert(result == true, "Should validate correct RNG state")
end)

TestRunner.test("validateRngState - counter mismatch", function()
    local rngState = {counter = 5, seed = "abc123"}
    TestRunner.assertError(function()
        RngValidator.validateRngState(rngState, 10)
    end, "RNG_003", "Should reject counter mismatch")
end)

TestRunner.test("validateProbabilityDistribution - valid distribution", function()
    local outcomes = {
        {success = true}, {success = false}, {success = true}, {success = false}, {success = true}
    }
    local result = RngValidator.validateProbabilityDistribution(outcomes, 0.5, 5)
    TestRunner.assert(result == true, "Should validate reasonable probability distribution")
end)

TestRunner.test("validateBattleReplay - matching replay", function()
    local original = {winner = "player1", turnCount = 5, criticalHits = {{turn = 2}}}
    local replay = {winner = "player1", turnCount = 5, criticalHits = {{turn = 2}}}
    local seed = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    local result = RngValidator.validateBattleReplay(original, replay, seed)
    TestRunner.assert(result == true, "Should validate matching battle replay")
end)

TestRunner.test("validateBattleReplay - winner mismatch", function()
    local original = {winner = "player1", turnCount = 5, criticalHits = {}}
    local replay = {winner = "player2", turnCount = 5, criticalHits = {}}
    local seed = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    TestRunner.assertError(function()
        RngValidator.validateBattleReplay(original, replay, seed)
    end, "RNG_003", "Should reject winner mismatch")
end)

TestRunner.test("validateOutcomePossibility - valid outcome", function()
    local outcome = {type = "critical_hit"}
    local context = {critRate = 0.1}
    local result = RngValidator.validateOutcomePossibility(outcome, context)
    TestRunner.assert(result == true, "Should validate possible outcome")
end)

TestRunner.test("validateOutcomePossibility - impossible crit", function()
    local outcome = {type = "critical_hit"}
    local context = {critRate = 0}
    TestRunner.assertError(function()
        RngValidator.validateOutcomePossibility(outcome, context)
    end, "RNG_005", "Should reject impossible critical hit")
end)

return TestRunner.run()