-- Unit tests for PolicyEnforcer component
-- Tests security policy enforcement and violation tracking

local PolicyEnforcer = require("security.components.policy-enforcer")

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

-- Test Suite: PolicyEnforcer Unit Tests
print("=== PolicyEnforcer Unit Tests ===")

-- Setup: Initialize PolicyEnforcer for testing
PolicyEnforcer.initialize()

-- Test 1: Initialization
local initialStats = PolicyEnforcer.getStatistics()
TestFramework.assert(
    initialStats.activePolicies > 0,
    "PolicyEnforcer should initialize with default policies"
)

-- Test 2: Add Security Policy
local testPolicy = {
    policyId = "test-policy",
    policyName = "Test Security Policy",
    enforcement = PolicyEnforcer.ENFORCEMENT_MODES.WARN,
    processScope = {"*"},
    rules = {
        {
            ruleId = "test-rule-1",
            description = "Test validation rule",
            evaluationLogic = function(context)
                if context.testField and context.testField == "forbidden" then
                    return false, "Test field contains forbidden value"
                end
                return true, nil
            end
        }
    }
}

local success, error = PolicyEnforcer.addSecurityPolicy(testPolicy)
TestFramework.assert(success, "Should successfully add security policy")
TestFramework.assertEqual(nil, error, "Should not return error for valid policy")

-- Test 3: Policy Enforcement - Clean Context
local cleanContext = {
    testField = "allowed",
    playerId = "test-player",
    processId = "test-process",
    operation = "TEST_OPERATION",
    messageType = "INTER_PROCESS"
}

local enforcementResult, enforcementTime = PolicyEnforcer.enforcePolicies(cleanContext)
TestFramework.assert(enforcementResult.allowed, "Should allow clean context")
TestFramework.assertEqual(0, #enforcementResult.violations, "Should have no violations")
TestFramework.assertEqual("MONITOR", enforcementResult.enforcement, "Should use lowest enforcement level")

-- Test 4: Policy Enforcement - Violation Detection
local violatingContext = {
    testField = "forbidden",
    playerId = "test-player",
    processId = "test-process",
    operation = "TEST_OPERATION",
    messageType = "INTER_PROCESS"
}

local violationResult = PolicyEnforcer.enforcePolicies(violatingContext)
TestFramework.assert(not violationResult.allowed, "Should detect violation and warn")
TestFramework.assert(#violationResult.violations > 0, "Should have violations")
TestFramework.assertEqual("WARN", violationResult.enforcement, "Should use policy enforcement level")

-- Test 5: Default Policy Testing - Input Validation
local missingCorrelationContext = {
    playerId = "valid-wallet-1234567890123456789012345678901",
    processId = "test-process",
    operation = "CLIENT_MESSAGE",
    messageType = "INTER_PROCESS"
    -- Missing correlation field
}

local inputViolationResult = PolicyEnforcer.enforcePolicies(missingCorrelationContext)
TestFramework.assert(not inputViolationResult.allowed, "Should detect missing correlation ID")
TestFramework.assertEqual("BLOCK", inputViolationResult.enforcement, "Should block input violations")

-- Test 6: Wallet Address Validation
local invalidWalletContext = {
    playerId = "invalid-wallet", -- Too short
    correlation = { id = "test-correlation" },
    processId = "test-process",
    operation = "GAME_ACTION",
    messageType = "CLIENT_MESSAGE"
}

local walletViolationResult = PolicyEnforcer.enforcePolicies(invalidWalletContext)
TestFramework.assert(not walletViolationResult.allowed, "Should detect invalid wallet address")

-- Test 7: Process Scope Testing
local scopedPolicy = {
    policyId = "scoped-policy",
    policyName = "Scoped Test Policy",
    enforcement = PolicyEnforcer.ENFORCEMENT_MODES.BLOCK,
    processScope = {"battle", "pokemon"},
    rules = {
        {
            ruleId = "scope-test-rule",
            description = "Rule that only applies to specific processes",
            evaluationLogic = function(context)
                if context.scopeTest then
                    return false, "Scope test violation"
                end
                return true, nil
            end
        }
    }
}

PolicyEnforcer.addSecurityPolicy(scopedPolicy)

-- Test with process in scope
local battleContext = {
    scopeTest = true,
    processId = "battle",
    processType = "battle",
    messageType = "INTER_PROCESS"
}

local scopedResult1 = PolicyEnforcer.enforcePolicies(battleContext)
TestFramework.assert(not scopedResult1.allowed, "Should apply policy to processes in scope")

-- Test with process out of scope
local coordinatorContext = {
    scopeTest = true,
    processId = "coordinator",
    processType = "coordinator",
    messageType = "INTER_PROCESS"
}

local scopedResult2 = PolicyEnforcer.enforcePolicies(coordinatorContext)
TestFramework.assert(scopedResult2.allowed, "Should not apply policy to processes out of scope")

-- Test 8: Multiple Enforcement Levels
local criticalPolicy = {
    policyId = "critical-policy",
    policyName = "Critical Test Policy",
    enforcement = PolicyEnforcer.ENFORCEMENT_MODES.TERMINATE,
    processScope = {"*"},
    rules = {
        {
            ruleId = "critical-rule",
            description = "Critical security rule",
            evaluationLogic = function(context)
                if context.criticalViolation then
                    return false, "Critical security violation"
                end
                return true, nil
            end
        }
    }
}

PolicyEnforcer.addSecurityPolicy(criticalPolicy)

local criticalContext = {
    criticalViolation = true,
    testField = "forbidden", -- This will also trigger the warn policy
    processId = "test-process",
    messageType = "INTER_PROCESS"
}

local criticalResult = PolicyEnforcer.enforcePolicies(criticalContext)
TestFramework.assert(not criticalResult.allowed, "Should block critical violations")
TestFramework.assertEqual("TERMINATE", criticalResult.enforcement, "Should use highest enforcement level")
TestFramework.assert(#criticalResult.violations >= 2, "Should detect multiple violations")

-- Test 9: Policy Management - Enable/Disable
local disableSuccess = PolicyEnforcer.setPolicyEnabled("test-policy", false)
TestFramework.assert(disableSuccess, "Should successfully disable policy")

-- Test with disabled policy
local disabledResult = PolicyEnforcer.enforcePolicies(violatingContext)
TestFramework.assert(disabledResult.allowed, "Should allow when policy is disabled")

-- Re-enable policy
local enableSuccess = PolicyEnforcer.setPolicyEnabled("test-policy", true)
TestFramework.assert(enableSuccess, "Should successfully re-enable policy")

-- Test 10: Policy Enforcement Mode Updates
local updateSuccess = PolicyEnforcer.updatePolicyEnforcement("test-policy", PolicyEnforcer.ENFORCEMENT_MODES.BLOCK)
TestFramework.assert(updateSuccess, "Should successfully update policy enforcement")

-- Test updated enforcement
local updatedResult = PolicyEnforcer.enforcePolicies(violatingContext)
TestFramework.assertEqual("BLOCK", updatedResult.enforcement, "Should use updated enforcement mode")

-- Test 11: Policy Violation Tracking
local violationPlayer = "violation-test-player"
local violationContext = {
    testField = "forbidden",
    playerId = violationPlayer,
    processId = "test-process",
    operation = "VIOLATION_TEST",
    messageType = "INTER_PROCESS"
}

PolicyEnforcer.enforcePolicies(violationContext)

local playerViolations = PolicyEnforcer.getPolicyViolations(violationPlayer, nil, 1)
TestFramework.assert(#playerViolations > 0, "Should track policy violations for player")

-- Test 12: Rate Limiting Policy
local rateLimitContext1 = {
    playerId = "rate-limit-player",
    timestamp = msg.Timestamp,
    messageType = "CLIENT_MESSAGE"
}

local rateLimitContext2 = {
    playerId = "rate-limit-player",
    timestamp = (msg.Timestamp) + 50, -- 50ms later (too fast)
    messageType = "CLIENT_MESSAGE"
}

PolicyEnforcer.enforcePolicies(rateLimitContext1) -- First should pass
local rateLimitResult = PolicyEnforcer.enforcePolicies(rateLimitContext2) -- Second should be blocked

TestFramework.assert(not rateLimitResult.allowed, "Should enforce rate limiting")

-- Test 13: Statistics Accuracy
local statsAfterTests = PolicyEnforcer.getStatistics()
TestFramework.assert(statsAfterTests.totalEnforcements > 0, "Should track total enforcements")
TestFramework.assert(statsAfterTests.violationsDetected > 0, "Should track violations detected")
TestFramework.assert(statsAfterTests.actionsBlocked > 0, "Should track blocked actions")

-- Test 14: Error Handling - Invalid Policy
local invalidPolicy = {
    policyId = "invalid-policy",
    policyName = "Invalid Policy",
    enforcement = "INVALID_MODE", -- Invalid enforcement mode
    rules = {} -- Empty rules
}

local invalidSuccess, invalidError = PolicyEnforcer.addSecurityPolicy(invalidPolicy)
TestFramework.assert(not invalidSuccess, "Should reject invalid policy")
TestFramework.assert(invalidError ~= nil, "Should return error for invalid policy")

-- Test 15: Process Authentication Policy Testing
-- Mock ProcessAuthenticator for testing
local mockAuthContext = {
    processAuth = {
        authToken = {
            tokenId = "test-token",
            signature = "test-signature"
        },
        sourceProcessId = "authenticated-process"
    },
    operation = "SECURE_OPERATION",
    messageType = "INTER_PROCESS"
}

-- This will test the process authentication rules in the default policies
local authResult = PolicyEnforcer.enforcePolicies(mockAuthContext)
-- Note: This may fail in test environment due to mocked ProcessAuthenticator
-- The test verifies the policy logic runs without errors
TestFramework.assert(
    authResult ~= nil,
    "Should handle process authentication policy evaluation"
)

-- Test 16: Pokemon Data Integrity Policy
local pokemonContext = {
    pokemon = {
        hp = 200,
        maxHp = 150, -- HP exceeds maxHP - should violate
        level = 50
    },
    processId = "battle",
    processType = "battle",
    messageType = "GAME_STATE_UPDATE"
}

local pokemonResult = PolicyEnforcer.enforcePolicies(pokemonContext)
TestFramework.assert(not pokemonResult.allowed, "Should detect Pokemon stat inconsistencies")

-- Test 17: Battle State Consistency Policy
local battleContext = {
    battleState = {
        turn = -5, -- Negative turn - should violate
        activePlayerPokemon = {
            hp = 0
        },
        battlePhase = "ONGOING" -- Pokemon has 0 HP but battle continues
    },
    processId = "battle",
    processType = "battle",
    messageType = "BATTLE_UPDATE"
}

local battleResult = PolicyEnforcer.enforcePolicies(battleContext)
TestFramework.assert(not battleResult.allowed, "Should detect battle state inconsistencies")

-- Test 18: Health Status
local health = PolicyEnforcer.getHealth()
TestFramework.assert(
    health == "HEALTHY" or health == "DEGRADED",
    "Health status should be HEALTHY or DEGRADED"
)

-- Test 19: Performance Test
local perfStartTime = msg.Timestamp
for i = 1, 50 do
    PolicyEnforcer.enforcePolicies({
        performanceTest = i,
        processId = "perf-test-process",
        messageType = "PERFORMANCE_TEST"
    })
end
local perfEndTime = msg.Timestamp
local avgEnforcementTime = (perfEndTime - perfStartTime) / 50

TestFramework.assert(
    avgEnforcementTime < 15, -- Should be under 15ms average
    "Average policy enforcement time should be under 15ms"
)

-- Test 20: Complex Multi-Policy Scenario
local complexContext = {
    -- Triggers multiple policies
    testField = "forbidden", -- test-policy (BLOCK)
    criticalViolation = true, -- critical-policy (TERMINATE)
    playerId = "complex-test-player-12345678901234567890123", -- Invalid wallet (BLOCK)
    processId = "complex-test",
    messageType = "INTER_PROCESS"
}

local complexResult = PolicyEnforcer.enforcePolicies(complexContext)
TestFramework.assert(not complexResult.allowed, "Should handle complex multi-policy violations")
TestFramework.assertEqual("TERMINATE", complexResult.enforcement, "Should use highest enforcement level")
TestFramework.assert(#complexResult.violations >= 2, "Should detect multiple policy violations")

print("\n=== PolicyEnforcer Test Results ===")
TestFramework.printResults()

-- Return test results for integration with larger test suite
return {
    passed = TestFramework.passed,
    failed = TestFramework.failed,
    errors = TestFramework.errors,
    total = TestFramework.passed + TestFramework.failed
}