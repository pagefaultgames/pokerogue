-- Unit tests for AuditLogger component
-- Tests audit logging, querying, and event correlation

local AuditLogger = require("security.components.audit-logger")

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

-- Test Suite: AuditLogger Unit Tests
print("=== AuditLogger Unit Tests ===")

-- Setup: Initialize AuditLogger for testing
AuditLogger.initialize()

-- Test 1: Initialization
local initialStats = AuditLogger.getStatistics()
TestFramework.assert(initialStats.totalEvents >= 1, "Should have at least initialization event")

-- Test 2: Basic Event Logging
local eventData = {
    eventType = AuditLogger.EVENT_TYPES.SECURITY_VALIDATION,
    severity = AuditLogger.SEVERITY_LEVELS.MEDIUM,
    playerId = "test-player-123",
    processId = "test-process",
    eventData = {
        validationType = "INPUT",
        result = "PASSED"
    },
    actionTaken = "ALLOW"
}

local eventId = AuditLogger.logSecurityEvent(eventData)
TestFramework.assert(eventId ~= nil, "Should return event ID when logging")
TestFramework.assert(type(eventId) == "string", "Event ID should be a string")

-- Test 3: Event Querying - By Event Type
local eventQuery = AuditLogger.queryAuditEvents({
    eventType = AuditLogger.EVENT_TYPES.SECURITY_VALIDATION
}, 10, 0)

TestFramework.assert(#eventQuery > 0, "Should find events by event type")

-- Test 4: Event Querying - By Player ID
local playerEvents = AuditLogger.queryAuditEvents({
    playerId = "test-player-123"
}, 10, 0)

TestFramework.assert(#playerEvents > 0, "Should find events by player ID")

-- Test 5: Validation Result Logging
local validationResult = {
    valid = false,
    validationType = "STATE",
    violations = {
        { ruleId = "test-rule", severity = "HIGH", errorMessage = "Test violation" }
    },
    securityAction = "BLOCK",
    playerId = "validation-test-player",
    processId = "validation-process",
    validationLatency = 15,
    rulesEvaluated = 3,
    cacheHit = false
}

local validationEventId = AuditLogger.logValidationResult(validationResult, "test-correlation-123")
TestFramework.assert(validationEventId ~= nil, "Should log validation result")

-- Test 6: Cheat Detection Logging
local cheatDetection = {
    playerId = "cheat-test-player",
    processId = "battle-process",
    suspicionScore = 85,
    detectedCheats = {
        { ruleId = "impossible-stats", cheatType = "IMPOSSIBLE_STATE", reason = "Level too high" }
    },
    analysisTime = 25,
    actionTaken = "SUSPEND_PLAYER"
}

local cheatEventId = AuditLogger.logCheatDetection(cheatDetection, "cheat-correlation-456")
TestFramework.assert(cheatEventId ~= nil, "Should log cheat detection")

-- Test 7: Policy Violation Logging
local policyViolation = {
    policyId = "input-validation",
    policyName = "Input Validation Policy",
    playerId = "policy-test-player",
    processId = "coordinator",
    violatedRules = {"require-correlation-id"},
    enforcement = "BLOCK",
    context = { operation = "CLIENT_MESSAGE" }
}

local policyEventId = AuditLogger.logPolicyViolation(policyViolation, "policy-correlation-789")
TestFramework.assert(policyEventId ~= nil, "Should log policy violation")

-- Test 8: Event Correlation
local correlationId = "test-correlation-123"
local correlatedEvents = AuditLogger.getEventsByCorrelation(correlationId)

TestFramework.assert(#correlatedEvents > 0, "Should find correlated events")
TestFramework.assert(
    correlatedEvents[1].correlationId == correlationId,
    "Correlated events should have correct correlation ID"
)

-- Test 9: Player Security History
local playerSecurityEvents = AuditLogger.getPlayerSecurityEvents("test-player-123", nil, 1)
TestFramework.assert(#playerSecurityEvents > 0, "Should find player security events")

-- Filter by event types
local specificEvents = AuditLogger.getPlayerSecurityEvents(
    "cheat-test-player",
    {AuditLogger.EVENT_TYPES.CHEAT_DETECTED},
    1
)
TestFramework.assert(#specificEvents > 0, "Should find events filtered by type")

-- Test 10: Statistics Accuracy
-- Log several more events to test statistics
for i = 1, 5 do
    AuditLogger.logSecurityEvent({
        eventType = AuditLogger.EVENT_TYPES.SYSTEM_EVENT,
        severity = AuditLogger.SEVERITY_LEVELS.LOW,
        processId = "test-process-" .. i,
        eventData = { testCounter = i }
    })
end

local stats = AuditLogger.getStatistics()
TestFramework.assert(stats.totalEvents > 5, "Should track total events accurately")
TestFramework.assert(
    stats.eventsByType[AuditLogger.EVENT_TYPES.SYSTEM_EVENT] > 0,
    "Should track events by type"
)
TestFramework.assert(
    stats.eventsBySeverity[AuditLogger.SEVERITY_LEVELS.LOW] > 0,
    "Should track events by severity"
)

-- Test 11: Event Export
local currentTime = 0
local dayAgo = currentTime - (24 * 3600)

local exportedEvents = AuditLogger.exportAuditEvents(dayAgo, currentTime)
TestFramework.assert(#exportedEvents > 0, "Should export events from time range")

-- Test export with event type filter
local filteredExport = AuditLogger.exportAuditEvents(
    dayAgo,
    currentTime,
    {AuditLogger.EVENT_TYPES.SECURITY_VALIDATION}
)

-- All exported events should match the filter
local allMatchFilter = true
for _, event in ipairs(filteredExport) do
    if event.eventType ~= AuditLogger.EVENT_TYPES.SECURITY_VALIDATION then
        allMatchFilter = false
        break
    end
end
TestFramework.assert(allMatchFilter, "Exported events should match event type filter")

-- Test 12: Query with Filters
local complexQuery, totalMatched = AuditLogger.queryAuditEvents({
    eventType = AuditLogger.EVENT_TYPES.SECURITY_VALIDATION,
    severity = AuditLogger.SEVERITY_LEVELS.MEDIUM,
    startTime = currentTime - 3600, -- Last hour
    endTime = currentTime
}, 5, 0)

TestFramework.assert(totalMatched >= 0, "Should return valid total matched count")
TestFramework.assert(#complexQuery <= 5, "Should respect query limit")

-- Test 13: Pagination
local page1, total1 = AuditLogger.queryAuditEvents({}, 3, 0)
local page2, total2 = AuditLogger.queryAuditEvents({}, 3, 3)

TestFramework.assertEqual(total1, total2, "Total count should be consistent across pages")
TestFramework.assert(#page1 <= 3, "First page should respect limit")
TestFramework.assert(#page2 <= 3, "Second page should respect limit")

-- Test 14: Health Status
local health = AuditLogger.getHealth()
TestFramework.assert(
    health == "HEALTHY" or health == "DEGRADED",
    "Health status should be HEALTHY or DEGRADED"
)

-- Test 15: Error Handling - Invalid Event Data
local invalidEventId = AuditLogger.logSecurityEvent({
    -- Missing required eventType
    severity = AuditLogger.SEVERITY_LEVELS.LOW,
    eventData = {}
})

TestFramework.assertEqual(nil, invalidEventId, "Should return nil for invalid event data")

-- Test 16: Event Storage and Indexing
-- Test that events are properly indexed for efficient querying
local indexTestPlayer = "index-test-player"
local indexTestProcess = "index-test-process"

-- Log events with specific player and process
for i = 1, 3 do
    AuditLogger.logSecurityEvent({
        eventType = AuditLogger.EVENT_TYPES.SECURITY_ALERT,
        severity = AuditLogger.SEVERITY_LEVELS.MEDIUM,
        playerId = indexTestPlayer,
        processId = indexTestProcess,
        eventData = { indexTest = i }
    })
end

-- Query by player
local playerIndexEvents = AuditLogger.queryAuditEvents({
    playerId = indexTestPlayer
})

TestFramework.assert(#playerIndexEvents >= 3, "Should find events indexed by player")

-- Query by process
local processIndexEvents = AuditLogger.queryAuditEvents({
    processId = indexTestProcess
})

TestFramework.assert(#processIndexEvents >= 3, "Should find events indexed by process")

-- Test 17: Large Data Handling
local largeEventData = {
    eventType = AuditLogger.EVENT_TYPES.SYSTEM_EVENT,
    severity = AuditLogger.SEVERITY_LEVELS.LOW,
    processId = "large-data-test",
    eventData = {}
}

-- Create large event data
for i = 1, 100 do
    largeEventData.eventData["field_" .. i] = "value_" .. i
end

local largeDataEventId = AuditLogger.logSecurityEvent(largeEventData)
TestFramework.assert(largeDataEventId ~= nil, "Should handle large event data")

-- Test 18: Timestamp Accuracy
local beforeLog = 0
local timestampEventId = AuditLogger.logSecurityEvent({
    eventType = AuditLogger.EVENT_TYPES.SYSTEM_EVENT,
    severity = AuditLogger.SEVERITY_LEVELS.LOW,
    eventData = { timestampTest = true }
})
local afterLog = 0

-- Query the event to check its timestamp
local timestampEvents = AuditLogger.queryAuditEvents({
    processId = ao.id or "security-process"
}, 100, 0)

local foundTimestampEvent = false
for _, event in ipairs(timestampEvents) do
    if event.eventId == timestampEventId then
        TestFramework.assert(
            event.timestamp >= beforeLog and event.timestamp <= afterLog,
            "Event timestamp should be accurate"
        )
        foundTimestampEvent = true
        break
    end
end

TestFramework.assert(foundTimestampEvent, "Should find the timestamp test event")

print("\n=== AuditLogger Test Results ===")
TestFramework.printResults()

-- Return test results for integration with larger test suite
return {
    passed = TestFramework.passed,
    failed = TestFramework.failed,
    errors = TestFramework.errors,
    total = TestFramework.passed + TestFramework.failed
}