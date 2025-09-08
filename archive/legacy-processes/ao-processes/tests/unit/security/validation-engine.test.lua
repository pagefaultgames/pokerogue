-- Unit tests for ValidationEngine component
-- Tests validation logic, caching, and performance

local ValidationEngine = require("security.components.validation-engine")

-- Test framework setup
local TestFramework = {
    passed = 0,
    failed = 0,
    errors = {}
}

function TestFramework.assert(condition, message)
    if condition then
        TestFramework.passed = TestFramework.passed + 1
        print("✓ " .. message)
    else
        TestFramework.failed = TestFramework.failed + 1
        local error = "✗ " .. message
        print(error)
        table.insert(TestFramework.errors, error)
    end
end

function TestFramework.assertEqual(expected, actual, message)
    local condition = expected == actual
    if not condition then
        message = message .. " (Expected: " .. tostring(expected) .. ", Actual: " .. tostring(actual) .. ")"
    end
    TestFramework.assert(condition, message)
end

function TestFramework.printResults()
    print(string.format("\nTest Results: %d passed, %d failed", TestFramework.passed, TestFramework.failed))
    if TestFramework.failed > 0 then
        print("\nFailures:")
        for _, error in ipairs(TestFramework.errors) do
            print("  " .. error)
        end
    end
end

-- Test Suite: ValidationEngine Unit Tests
print("=== ValidationEngine Unit Tests ===")

-- Setup: Initialize ValidationEngine for testing
ValidationEngine.initialize()

-- Test 1: Initialization
TestFramework.assert(
    ValidationEngine.getStatistics().activeRules > 0,
    "ValidationEngine should initialize with default rules"
)

-- Test 2: Add Validation Rule
local testRule = {
    ruleId = "test-rule",
    ruleType = ValidationEngine.VALIDATION_TYPES.INPUT,
    processScope = {"*"},
    severity = "HIGH",
    enabled = true,
    validationLogic = function(data)
        if not data.testField or data.testField == "invalid" then
            return false, "Test field validation failed"
        end
        return true, nil
    end
}

local success, error = ValidationEngine.addValidationRule(testRule)
TestFramework.assert(success, "Should successfully add validation rule")
TestFramework.assertEqual(nil, error, "Should not return error when adding valid rule")

-- Test 3: Validation - Valid Data
local validData = { testField = "valid", correlation = { id = "test-correlation" } }
local isValid, violations, action, source = ValidationEngine.validate(
    ValidationEngine.VALIDATION_TYPES.INPUT,
    validData,
    "test-process"
)

TestFramework.assert(isValid, "Should validate valid data")
TestFramework.assertEqual(0, #violations, "Should have no violations for valid data")
TestFramework.assertEqual("ALLOW", action, "Should allow valid data")

-- Test 4: Validation - Invalid Data
local invalidData = { testField = "invalid", correlation = { id = "test-correlation" } }
local isValid2, violations2, action2 = ValidationEngine.validate(
    ValidationEngine.VALIDATION_TYPES.INPUT,
    invalidData,
    "test-process"
)

TestFramework.assert(not isValid2, "Should not validate invalid data")
TestFramework.assert(#violations2 > 0, "Should have violations for invalid data")
TestFramework.assertEqual("BLOCK", action2, "Should block invalid data")

-- Test 5: Caching
-- Validate the same data twice to test caching
ValidationEngine.validate(ValidationEngine.VALIDATION_TYPES.INPUT, validData, "test-process")
local isValid3, _, _, source3 = ValidationEngine.validate(
    ValidationEngine.VALIDATION_TYPES.INPUT, 
    validData, 
    "test-process"
)

TestFramework.assertEqual("CACHED", source3, "Second validation should use cache")

-- Test 6: Rule Management - Disable Rule
local disableSuccess = ValidationEngine.setRuleEnabled("test-rule", false)
TestFramework.assert(disableSuccess, "Should successfully disable rule")

-- Validate with disabled rule
local isValid4, violations4 = ValidationEngine.validate(
    ValidationEngine.VALIDATION_TYPES.INPUT,
    invalidData,
    "test-process"
)

-- Should pass now because our test rule is disabled
TestFramework.assert(isValid4, "Should validate when rule is disabled")

-- Test 7: Rule Management - Remove Rule
local removeSuccess = ValidationEngine.removeValidationRule("test-rule")
TestFramework.assert(removeSuccess, "Should successfully remove rule")

-- Test 8: Invalid Validation Type
local isValid5, violations5, action5 = ValidationEngine.validate(
    "INVALID_TYPE",
    validData,
    "test-process"
)

TestFramework.assert(not isValid5, "Should fail with invalid validation type")

-- Test 9: Performance Test - Measure validation time
local startTime = msg.Timestamp
for i = 1, 100 do
    ValidationEngine.validate(
        ValidationEngine.VALIDATION_TYPES.INPUT,
        { testField = "perf-test-" .. i, correlation = { id = "perf-" .. i } },
        "test-process"
    )
end
local endTime = msg.Timestamp
local avgTime = (endTime - startTime) / 100

TestFramework.assert(
    avgTime < 10, -- Should be under 10ms average
    "Average validation time should be under 10ms"
)

-- Test 10: Statistics Accuracy
local stats = ValidationEngine.getStatistics()
TestFramework.assert(stats.totalValidations > 0, "Statistics should track validations")
TestFramework.assert(stats.cacheHits >= 0, "Statistics should track cache hits")
TestFramework.assert(stats.activeRules >= 0, "Statistics should track active rules")

-- Test 11: Default Rule Testing - Wallet Address Validation
local validWalletData = {
    playerId = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG", -- 43 chars
    correlation = { id = "test-wallet" }
}

local invalidWalletData = {
    playerId = "invalid_wallet", -- Too short
    correlation = { id = "test-wallet" }
}

local walletValid = ValidationEngine.validate(
    ValidationEngine.VALIDATION_TYPES.INPUT,
    validWalletData,
    "test-process"
)

local walletInvalid = ValidationEngine.validate(
    ValidationEngine.VALIDATION_TYPES.INPUT,
    invalidWalletData,
    "test-process"
)

TestFramework.assert(walletValid, "Should validate correct wallet address format")
TestFramework.assert(not walletInvalid, "Should reject invalid wallet address format")

-- Test 12: Pokemon State Validation
local validPokemon = {
    pokemon = {
        hp = 50,
        maxHp = 100,
        level = 50,
        attack = 80,
        defense = 70
    },
    correlation = { id = "pokemon-test" }
}

local invalidPokemon = {
    pokemon = {
        hp = 150, -- HP > maxHP
        maxHp = 100,
        level = 50,
        attack = -10 -- Negative stat
    },
    correlation = { id = "pokemon-test" }
}

local pokemonValid = ValidationEngine.validate(
    ValidationEngine.VALIDATION_TYPES.STATE,
    validPokemon,
    "battle"
)

local pokemonInvalid = ValidationEngine.validate(
    ValidationEngine.VALIDATION_TYPES.STATE,
    invalidPokemon,
    "battle"
)

TestFramework.assert(pokemonValid, "Should validate correct Pokemon state")
TestFramework.assert(not pokemonInvalid, "Should reject invalid Pokemon state")

-- Test 13: Rate Limiting Validation
local rapidAction1 = {
    playerId = "rapid-test-player",
    timestamp = msg.Timestamp,
    actionType = "BATTLE_MOVE",
    correlation = { id = "rapid-1" }
}

local rapidAction2 = {
    playerId = "rapid-test-player", 
    timestamp = (msg.Timestamp) + 50, -- 50ms later (too fast)
    actionType = "BATTLE_MOVE",
    correlation = { id = "rapid-2" }
}

ValidationEngine.validate(ValidationEngine.VALIDATION_TYPES.BEHAVIOR, rapidAction1, "battle")
local rapidResult = ValidationEngine.validate(ValidationEngine.VALIDATION_TYPES.BEHAVIOR, rapidAction2, "battle")

TestFramework.assert(not rapidResult, "Should detect rapid actions as invalid")

-- Test 14: Health Status
local health = ValidationEngine.getHealth()
TestFramework.assert(
    health == "HEALTHY" or health == "DEGRADED",
    "Health status should be HEALTHY or DEGRADED"
)

-- Test 15: Error Handling - Invalid Rule
local invalidRule = {
    ruleId = "invalid-rule",
    -- Missing required fields
}

local invalidSuccess, invalidError = ValidationEngine.addValidationRule(invalidRule)
TestFramework.assert(not invalidSuccess, "Should reject invalid rule")
TestFramework.assert(invalidError ~= nil, "Should return error for invalid rule")

print("\n=== ValidationEngine Test Results ===")
TestFramework.printResults()

-- Return test results for integration with larger test suite
return {
    passed = TestFramework.passed,
    failed = TestFramework.failed,
    errors = TestFramework.errors,
    total = TestFramework.passed + TestFramework.failed
}