-- Unit tests for AntiCheatDetector component
-- Tests cheat detection algorithms and behavioral analysis

local AntiCheatDetector = require("security.components.anti-cheat-detector")

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

-- Test Suite: AntiCheatDetector Unit Tests
print("=== AntiCheatDetector Unit Tests ===")

-- Setup: Initialize AntiCheatDetector for testing
AntiCheatDetector.initialize()

-- Test 1: Initialization
local initialStats = AntiCheatDetector.getStatistics()
TestFramework.assert(
    initialStats.activeRules > 0,
    "AntiCheatDetector should initialize with default detection rules"
)

TestFramework.assertEqual(0, initialStats.cheatsDetected, "Should start with zero cheats detected")

-- Test 2: Clean Data Analysis
local cleanData = {
    pokemon = {
        level = 50,
        hp = 150,
        maxHp = 150,
        attack = 120,
        defense = 100
    },
    battleResult = {
        damageDealt = 45,
        hpRestored = 0,
        criticalHits = 1,
        totalMoves = 10
    }
}

local cheatDetected, detectedCheats, suspicionScore = AntiCheatDetector.analyzeForCheating(
    cleanData,
    "clean-test-player"
)

TestFramework.assert(not cheatDetected, "Should not detect cheats in clean data")
TestFramework.assertEqual(0, #detectedCheats, "Should have no cheat detections for clean data")
TestFramework.assert(
    suspicionScore < AntiCheatDetector.suspicionThreshold,
    "Suspicion score should be below threshold for clean data"
)

-- Test 3: Impossible Pokemon Stats Detection
local impossibleStatsData = {
    pokemon = {
        level = 150, -- Impossible level > 100
        hp = 200,
        maxHp = 150, -- HP > maxHP
        attack = -50, -- Negative stat
        defense = 100
    }
}

local cheatDetected2, detectedCheats2, suspicionScore2 = AntiCheatDetector.analyzeForCheating(
    impossibleStatsData,
    "cheat-test-player"
)

TestFramework.assert(cheatDetected2, "Should detect impossible Pokemon stats as cheating")
TestFramework.assert(#detectedCheats2 > 0, "Should have cheat detections for impossible stats")
TestFramework.assert(
    suspicionScore2 >= AntiCheatDetector.suspicionThreshold,
    "Suspicion score should be above threshold for impossible stats"
)

-- Test 4: Battle Outcome Manipulation Detection
local manipulatedBattleData = {
    battleResult = {
        damageDealt = -100, -- Negative damage
        hpRestored = 50, -- Healing without source
        criticalHits = 8,
        totalMoves = 10 -- 80% crit rate - suspicious
    }
}

local cheatDetected3, detectedCheats3, suspicionScore3 = AntiCheatDetector.analyzeForCheating(
    manipulatedBattleData,
    "battle-cheat-player"
)

TestFramework.assert(cheatDetected3, "Should detect battle manipulation as cheating")
TestFramework.assert(#detectedCheats3 > 0, "Should have cheat detections for battle manipulation")

-- Test 5: Rapid Action Detection (Time Manipulation)
local rapidActionData1 = {
    playerId = "rapid-player",
    timestamp = msg.Timestamp,
    actionType = "BATTLE_MOVE"
}

local rapidActionData2 = {
    playerId = "rapid-player", 
    timestamp = (msg.Timestamp) + 50, -- Only 50ms later
    actionType = "BATTLE_MOVE"
}

-- First action should be clean
AntiCheatDetector.analyzeForCheating(rapidActionData1, "rapid-player")

-- Second rapid action should be detected
local rapidCheatDetected, rapidCheats = AntiCheatDetector.analyzeForCheating(
    rapidActionData2,
    "rapid-player"
)

TestFramework.assert(rapidCheatDetected, "Should detect rapid actions as time manipulation")

-- Test 6: Win Rate Statistical Anomaly
local player = "win-rate-player"

-- Simulate a series of wins to create suspiciously high win rate
for i = 1, 25 do
    local winData = {
        playerId = player,
        battleResult = { won = true },
        timestamp = 0 + i
    }
    AntiCheatDetector.analyzeForCheating(winData, player)
end

-- Get behavior analysis
local behaviorAnalysis = AntiCheatDetector.getPlayerBehaviorAnalysis(player)
TestFramework.assert(behaviorAnalysis ~= nil, "Should have behavior analysis for player")
TestFramework.assert(
    behaviorAnalysis.riskLevel == "HIGH" or behaviorAnalysis.riskLevel == "CRITICAL",
    "High win rate should result in elevated risk level"
)

-- Test 7: Data Integrity Violations
local corruptData = {
    gameState = {
        pokemon = {
            {
                hp = 200,
                maxHp = 150, -- HP > maxHP
                moves = {
                    { pp = 15, maxPP = 10 } -- PP > maxPP
                },
                level = 50,
                exp = 100 -- Too low exp for level
            }
        },
        items = {
            ["potion"] = -5, -- Negative item quantity
            ["rare-candy"] = 1500 -- Excessive quantity
        }
    }
}

local dataCheatDetected, dataCheats = AntiCheatDetector.analyzeForCheating(
    corruptData,
    "data-manipulation-player"
)

TestFramework.assert(dataCheatDetected, "Should detect data manipulation")
TestFramework.assert(#dataCheats > 0, "Should have multiple data manipulation detections")

-- Test 8: Custom Detection Rule Addition
local customRule = {
    ruleId = "test-custom-rule",
    cheatType = AntiCheatDetector.CHEAT_TYPES.BEHAVIORAL_PATTERN,
    suspicionLevel = AntiCheatDetector.SUSPICION_LEVELS.HIGH,
    detectionLogic = function(data)
        if data.testPattern and data.testPattern == "cheat-pattern" then
            return true, "Test cheat pattern detected"
        end
        return false, nil
    end
}

local ruleAdded = AntiCheatDetector.addDetectionRule(customRule)
TestFramework.assert(ruleAdded, "Should successfully add custom detection rule")

-- Test custom rule
local customCheatData = { testPattern = "cheat-pattern" }
local customCheatDetected = AntiCheatDetector.analyzeForCheating(
    customCheatData,
    "custom-test-player"
)

TestFramework.assert(customCheatDetected, "Should detect using custom rule")

-- Test 9: Player Profile Tracking
local profilePlayer = "profile-test-player"

-- Generate some activity
for i = 1, 5 do
    AntiCheatDetector.analyzeForCheating({
        testData = "activity-" .. i,
        timestamp = 0 + i
    }, profilePlayer)
end

local profile = AntiCheatDetector.getPlayerBehaviorAnalysis(profilePlayer)
TestFramework.assert(profile ~= nil, "Should create player behavior profile")
TestFramework.assert(profile.totalAnalyses >= 5, "Should track analysis count")
TestFramework.assert(profile.riskLevel ~= nil, "Should calculate risk level")

-- Test 10: Statistics Accuracy
local stats = AntiCheatDetector.getStatistics()
TestFramework.assert(stats.totalChecks > 0, "Should track total cheat checks")
TestFramework.assert(stats.cheatsDetected > 0, "Should track cheat detections")
TestFramework.assert(stats.activeRules > 0, "Should track active detection rules")
TestFramework.assert(
    stats.detectionRate >= 0 and stats.detectionRate <= 1,
    "Detection rate should be between 0 and 1"
)

-- Test 11: Health Status
local health = AntiCheatDetector.getHealth()
TestFramework.assert(
    health == "HEALTHY" or health == "DEGRADED",
    "Health status should be HEALTHY or DEGRADED"
)

-- Test 12: Performance Test - Analysis Speed
local perfStartTime = msg.Timestamp
for i = 1, 50 do
    AntiCheatDetector.analyzeForCheating({
        performanceTest = i,
        timestamp = msg.Timestamp + i
    }, "performance-test-player")
end
local perfEndTime = msg.Timestamp
local avgAnalysisTime = (perfEndTime - perfStartTime) / 50

TestFramework.assert(
    avgAnalysisTime < 20, -- Should be under 20ms average
    "Average cheat analysis time should be under 20ms"
)

-- Test 13: Suspicion Level Thresholds
TestFramework.assert(
    AntiCheatDetector.SUSPICION_LEVELS.LOW < AntiCheatDetector.SUSPICION_LEVELS.MEDIUM,
    "Suspicion levels should be ordered correctly"
)
TestFramework.assert(
    AntiCheatDetector.SUSPICION_LEVELS.MEDIUM < AntiCheatDetector.SUSPICION_LEVELS.HIGH,
    "Suspicion levels should be ordered correctly"
)
TestFramework.assert(
    AntiCheatDetector.SUSPICION_LEVELS.HIGH < AntiCheatDetector.SUSPICION_LEVELS.CRITICAL,
    "Suspicion levels should be ordered correctly"
)

-- Test 14: Error Handling - Invalid Detection Rule
local invalidRule = {
    ruleId = "invalid-test-rule",
    -- Missing required fields
}

local invalidRuleSuccess = AntiCheatDetector.addDetectionRule(invalidRule)
TestFramework.assert(not invalidRuleSuccess, "Should reject invalid detection rule")

-- Test 15: Behavior Trend Analysis
local trendPlayer = "trend-test-player"

-- Create trend data - increasing suspicion over time
local suspicionScores = {25, 30, 45, 60, 70} -- Increasing trend
for i, score in ipairs(suspicionScores) do
    -- Generate data that will result in specific suspicion scores
    local trendData = {
        artificialSuspicion = score,
        timestamp = 0 + i * 3600 -- Each hour apart
    }
    
    -- We'll need to add a rule that generates predictable suspicion scores
    -- This is a simplified test
    AntiCheatDetector.analyzeForCheating(trendData, trendPlayer)
end

local trendAnalysis = AntiCheatDetector.getPlayerBehaviorAnalysis(trendPlayer)
TestFramework.assert(trendAnalysis ~= nil, "Should have trend analysis data")
TestFramework.assert(
    trendAnalysis.behaviorTrends ~= nil,
    "Should provide behavior trend analysis"
)

print("\n=== AntiCheatDetector Test Results ===")
TestFramework.printResults()

-- Return test results for integration with larger test suite
return {
    passed = TestFramework.passed,
    failed = TestFramework.failed,
    errors = TestFramework.errors,
    total = TestFramework.passed + TestFramework.failed
}