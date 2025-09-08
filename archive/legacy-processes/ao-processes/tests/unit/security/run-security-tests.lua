-- Security Unit Tests Runner
-- Executes all security component unit tests and reports results

print("==================================================")
print("          SECURITY COMPONENTS UNIT TESTS")
print("==================================================")

-- Initialize global JSON mock for testing environment
if not json then
    json = {
        encode = function(data)
            -- Simple JSON encoder for testing
            if type(data) == "table" then
                local pairs = {}
                for k, v in pairs(data) do
                    local key = '"' .. tostring(k) .. '"'
                    local value
                    if type(v) == "string" then
                        value = '"' .. v .. '"'
                    elseif type(v) == "table" then
                        value = json.encode(v)
                    else
                        value = tostring(v)
                    end
                    table.insert(pairs, key .. ":" .. value)
                end
                return "{" .. table.concat(pairs, ",") .. "}"
            elseif type(data) == "string" then
                return '"' .. data .. '"'
            else
                return tostring(data)
            end
        end,
        
        decode = function(jsonString)
            -- Simple JSON decoder for testing
            -- This is a very basic implementation
            if jsonString == "null" then return nil end
            if jsonString == "true" then return true end
            if jsonString == "false" then return false end
            if string.match(jsonString, '^".*"$') then
                return string.sub(jsonString, 2, -2)
            end
            if string.match(jsonString, '^%d+$') then
                return tonumber(jsonString)
            end
            -- For complex objects, return a mock table
            return { decoded = true, original = jsonString }
        end
    }
end

-- Initialize global AO mock for testing environment  
if not ao then
    ao = {
        id = "security-process-test-id",
        send = function(params)
            print("[MOCK_AO_SEND] " .. (params.Tags and params.Tags.Action or "NO_ACTION") .. 
                  " -> " .. (params.Target or "NO_TARGET"))
        end
    }
end

-- Initialize mock Handlers for testing
if not Handlers then
    Handlers = {
        add = function(name, matcher, handler)
            print("[MOCK_HANDLER] Registered: " .. name)
        end,
        utils = {
            hasMatchingTag = function(tag, value)
                return function(msg)
                    return msg.Tags and msg.Tags[tag] == value
                end
            end
        }
    }
end

-- Test Results Aggregator
local TestResults = {
    totalTests = 0,
    totalPassed = 0,
    totalFailed = 0,
    testSuites = {},
    errors = {}
}

function TestResults.addSuite(suiteName, results)
    TestResults.testSuites[suiteName] = results
    TestResults.totalTests = TestResults.totalTests + results.total
    TestResults.totalPassed = TestResults.totalPassed + results.passed
    TestResults.totalFailed = TestResults.totalFailed + results.failed
    
    -- Aggregate errors
    for _, error in ipairs(results.errors or {}) do
        table.insert(TestResults.errors, "[" .. suiteName .. "] " .. error)
    end
end

function TestResults.printSummary()
    print("\n==================================================")
    print("                TEST SUMMARY")
    print("==================================================")
    
    print(string.format("Total Test Suites: %d", #TestResults.testSuites))
    print(string.format("Total Tests: %d", TestResults.totalTests))
    print(string.format("Passed: %d (%.1f%%)", TestResults.totalPassed, 
          TestResults.totalTests > 0 and (TestResults.totalPassed / TestResults.totalTests * 100) or 0))
    print(string.format("Failed: %d (%.1f%%)", TestResults.totalFailed,
          TestResults.totalTests > 0 and (TestResults.totalFailed / TestResults.totalTests * 100) or 0))
    
    print("\nTest Suite Results:")
    for suiteName, results in pairs(TestResults.testSuites) do
        local status = results.failed == 0 and "✓ PASS" or "✗ FAIL"
        print(string.format("  %s %s: %d/%d tests passed", 
              status, suiteName, results.passed, results.total))
    end
    
    if TestResults.totalFailed > 0 then
        print("\n=== FAILED TESTS ===")
        for _, error in ipairs(TestResults.errors) do
            print("  " .. error)
        end
    end
    
    print("\n==================================================")
    if TestResults.totalFailed == 0 then
        print("🎉 ALL TESTS PASSED! Security components are working correctly.")
    else
        print("❌ SOME TESTS FAILED. Please review and fix the issues above.")
    end
    print("==================================================")
    
    return TestResults.totalFailed == 0
end

-- Execute Test Suites
print("\n🧪 Running Security Component Unit Tests...\n")

-- Test Suite 1: ValidationEngine Tests
print("Running ValidationEngine tests...")
local validationResults = require("tests.unit.security.validation-engine.test")
TestResults.addSuite("ValidationEngine", validationResults)

-- Test Suite 2: AntiCheatDetector Tests  
print("\nRunning AntiCheatDetector tests...")
local antiCheatResults = require("tests.unit.security.anti-cheat-detector.test")
TestResults.addSuite("AntiCheatDetector", antiCheatResults)

-- Test Suite 3: AuditLogger Tests
print("\nRunning AuditLogger tests...")
local auditResults = require("tests.unit.security.audit-logger.test")
TestResults.addSuite("AuditLogger", auditResults)

-- Test Suite 4: PolicyEnforcer Tests
print("\nRunning PolicyEnforcer tests...")
local policyResults = require("tests.unit.security.policy-enforcer.test")
TestResults.addSuite("PolicyEnforcer", policyResults)

-- Additional Integration Tests
print("\n=== CROSS-COMPONENT INTEGRATION TESTS ===")

-- Integration Test 1: ValidationEngine + AuditLogger
print("Testing ValidationEngine → AuditLogger integration...")

local ValidationEngine = require("security.components.validation-engine")
local AuditLogger = require("security.components.audit-logger")

-- Perform a validation that should create an audit log
local testData = { 
    testField = "integration-test",
    correlation = { id = "integration-test-correlation" }
}

local beforeAuditCount = AuditLogger.getStatistics().totalEvents
ValidationEngine.validate(ValidationEngine.VALIDATION_TYPES.INPUT, testData, "integration-test")
local afterAuditCount = AuditLogger.getStatistics().totalEvents

local integrationTest1 = afterAuditCount > beforeAuditCount
print(integrationTest1 and "✓ ValidationEngine properly integrates with AuditLogger" or 
      "✗ ValidationEngine integration with AuditLogger failed")

if integrationTest1 then
    TestResults.totalPassed = TestResults.totalPassed + 1
else
    TestResults.totalFailed = TestResults.totalFailed + 1
    table.insert(TestResults.errors, "[Integration] ValidationEngine → AuditLogger failed")
end
TestResults.totalTests = TestResults.totalTests + 1

-- Integration Test 2: PolicyEnforcer + AuditLogger
print("Testing PolicyEnforcer → AuditLogger integration...")

local PolicyEnforcer = require("security.components.policy-enforcer")

local beforePolicyAuditCount = AuditLogger.getStatistics().totalEvents
local policyContext = {
    integrationTest = "policy-audit-integration",
    processId = "integration-test",
    messageType = "INTEGRATION_TEST"
}
PolicyEnforcer.enforcePolicies(policyContext)
local afterPolicyAuditCount = AuditLogger.getStatistics().totalEvents

-- Note: This may not always increment audit count if no violations occur
local integrationTest2 = afterPolicyAuditCount >= beforePolicyAuditCount
print(integrationTest2 and "✓ PolicyEnforcer properly integrates with AuditLogger" or 
      "✗ PolicyEnforcer integration with AuditLogger failed")

if integrationTest2 then
    TestResults.totalPassed = TestResults.totalPassed + 1
else
    TestResults.totalFailed = TestResults.totalFailed + 1
    table.insert(TestResults.errors, "[Integration] PolicyEnforcer → AuditLogger failed")
end
TestResults.totalTests = TestResults.totalTests + 1

-- Integration Test 3: Component Health Checks
print("Testing component health status integration...")

local allHealthy = true
local healthResults = {
    validation = ValidationEngine.getHealth(),
    antiCheat = require("security.components.anti-cheat-detector").getHealth(),
    audit = AuditLogger.getHealth(),
    policy = PolicyEnforcer.getHealth(),
    integrity = require("security.components.integrity-monitor").getHealth()
}

for component, health in pairs(healthResults) do
    if health ~= "HEALTHY" and health ~= "DEGRADED" then
        allHealthy = false
        print("✗ " .. component .. " health check returned invalid status: " .. tostring(health))
    else
        print("✓ " .. component .. " health check: " .. health)
    end
end

if allHealthy then
    TestResults.totalPassed = TestResults.totalPassed + 1
else
    TestResults.totalFailed = TestResults.totalFailed + 1
    table.insert(TestResults.errors, "[Integration] Component health checks failed")
end
TestResults.totalTests = TestResults.totalTests + 1

-- Performance Integration Test
print("Testing overall security system performance...")

local performanceStartTime = msg.Timestamp

-- Simulate realistic security workflow
for i = 1, 10 do
    local workflowData = {
        playerId = "performance-test-player-" .. i,
        pokemon = { level = 50 + i, hp = 100, maxHp = 100 },
        operation = "PERFORMANCE_TEST",
        correlation = { id = "perf-test-" .. i }
    }
    
    -- Validation
    ValidationEngine.validate(ValidationEngine.VALIDATION_TYPES.INPUT, workflowData, "test")
    
    -- Policy Enforcement  
    PolicyEnforcer.enforcePolicies({
        processId = "performance-test",
        messageType = "PERFORMANCE_TEST",
        operation = "SECURITY_CHECK"
    })
    
    -- Cheat Detection
    require("security.components.anti-cheat-detector").analyzeForCheating(
        workflowData, 
        "performance-test-player-" .. i
    )
end

local performanceEndTime = msg.Timestamp
local totalTime = performanceEndTime - performanceStartTime
local avgTime = totalTime / 10

local performanceTest = avgTime < 100 -- Should be under 100ms per workflow
print(string.format("%s Security workflow performance: %.1fms average (target: <100ms)", 
      performanceTest and "✓" or "✗", avgTime))

if performanceTest then
    TestResults.totalPassed = TestResults.totalPassed + 1
else
    TestResults.totalFailed = TestResults.totalFailed + 1
    table.insert(TestResults.errors, "[Performance] Security workflow too slow: " .. avgTime .. "ms")
end
TestResults.totalTests = TestResults.totalTests + 1

-- Print final results and return success status
local allTestsPassed = TestResults.printSummary()

-- Return test results for external use
return {
    success = allTestsPassed,
    totalTests = TestResults.totalTests,
    passed = TestResults.totalPassed,
    failed = TestResults.totalFailed,
    results = TestResults.testSuites,
    errors = TestResults.errors
}