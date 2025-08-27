-- anti-cheat-handler.test.lua: Unit tests for Anti-Cheat Detection System

package.path = package.path .. ";../../?.lua;../../handlers/?.lua"
local AntiCheatHandler = require("anti-cheat-handler")

-- Simple test framework
local TestRunner = {tests = {}, passed = 0, failed = 0}
function TestRunner.test(name, testFunc) table.insert(TestRunner.tests, {name = name, func = testFunc}) end
function TestRunner.run()
    print("Running AntiCheatHandler Tests...")
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

-- Test Cases
TestRunner.test("detectSuspiciousBehavior - normal behavior", function()
    local playerData = {currentWinStreak = 5, recentLevelUps = {}}
    local anomalies = AntiCheatHandler.detectSuspiciousBehavior("player1", playerData, {})
    TestRunner.assert(#anomalies == 0, "Should not detect anomalies in normal behavior")
end)

TestRunner.test("detectSuspiciousBehavior - excessive win streak", function()
    local playerData = {currentWinStreak = 100}
    local anomalies = AntiCheatHandler.detectSuspiciousBehavior("player1", playerData, {})
    TestRunner.assert(#anomalies > 0, "Should detect excessive win streak")
    TestRunner.assert(anomalies[1].type == "excessive_win_streak", "Should identify win streak anomaly")
end)

TestRunner.test("detectDataCorruption - valid data", function()
    local gameState = {
        player = {
            party = {{level = 25, experience = 15625, stats = {hp = 100}}},
            currency = 5000
        }
    }
    local corruptions = AntiCheatHandler.detectDataCorruption(gameState)
    TestRunner.assert(#corruptions == 0, "Should not detect corruption in valid data")
end)

TestRunner.test("detectDataCorruption - experience mismatch", function()
    local gameState = {
        player = {
            party = {{level = 25, experience = 100}} -- Too low for level 25
        }
    }
    local corruptions = AntiCheatHandler.detectDataCorruption(gameState)
    TestRunner.assert(#corruptions > 0, "Should detect experience/level mismatch")
    TestRunner.assert(corruptions[1].type == "experience_level_mismatch", "Should identify experience corruption")
end)

TestRunner.test("performCheatScan - clean player", function()
    local gameState = {
        player = {
            party = {{level = 10, experience = 1000}},
            currency = 1000,
            currentWinStreak = 3
        }
    }
    local scanResults = AntiCheatHandler.performCheatScan("player1", gameState, {}, "test-123")
    TestRunner.assert(scanResults.overallRiskScore == 0, "Should have zero risk score for clean player")
    TestRunner.assert(scanResults.recommendedAction == "none", "Should recommend no action")
end)

TestRunner.test("performCheatScan - high risk player", function()
    local gameState = {
        player = {
            party = {{level = 25, experience = 50}}, -- Corrupted data
            currency = 2000000, -- Over limit
            currentWinStreak = 100 -- Excessive
        }
    }
    local scanResults = AntiCheatHandler.performCheatScan("player1", gameState, {}, "test-456")
    TestRunner.assert(scanResults.overallRiskScore > 10, "Should have high risk score")
    TestRunner.assert(scanResults.recommendedAction ~= "none", "Should recommend action")
end)

TestRunner.test("logSecurityEvent - creates log entry", function()
    local logEntry = AntiCheatHandler.logSecurityEvent("TEST_EVENT", "player1", {test = true}, "corr-123")
    TestRunner.assert(logEntry.eventType == "TEST_EVENT", "Should record event type")
    TestRunner.assert(logEntry.playerId == "player1", "Should record player ID")
    TestRunner.assert(logEntry.correlationId == "corr-123", "Should record correlation ID")
end)

return TestRunner.run()