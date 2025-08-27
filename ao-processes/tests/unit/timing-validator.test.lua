-- timing-validator.test.lua: Unit tests for Timing and Sequence Validation

-- Mock timing validator for testing
local TimingValidator = {}

-- Constants
local TIMING_ERRORS = {
    IMPOSSIBLE_SEQUENCE = "TIME_001",
    TURN_TIMEOUT = "TIME_002",
    RATE_LIMIT_EXCEEDED = "TIME_003",
    PROGRESSION_TOO_FAST = "TIME_004",
    INVALID_ACTION_ORDER = "TIME_005"
}

local TIMING_LIMITS = {
    MAX_TURN_DURATION = 30000, -- 30 seconds in milliseconds
    MIN_ACTION_INTERVAL = 100, -- 100ms minimum between actions
    MAX_ACTIONS_PER_MINUTE = 60,
    MIN_BATTLE_DURATION = 1000, -- 1 second minimum battle
    MAX_LEVEL_UPS_PER_HOUR = 10
}

function TimingValidator.validateActionSequence(actionHistory, newAction, currentTime)
    if not actionHistory or not newAction or not currentTime then
        error({
            code = TIMING_ERRORS.IMPOSSIBLE_SEQUENCE,
            message = "Action history, new action and current time required",
            success = false
        })
    end
    
    -- Check for impossible rapid sequences
    if #actionHistory > 0 then
        local lastAction = actionHistory[#actionHistory]
        local timeDiff = currentTime - lastAction.timestamp
        
        if timeDiff < TIMING_LIMITS.MIN_ACTION_INTERVAL then
            error({
                code = TIMING_ERRORS.IMPOSSIBLE_SEQUENCE,
                message = "Actions submitted too rapidly",
                success = false
            })
        end
        
        -- Check for impossible action combinations
        if lastAction.type == "move" and newAction.type == "move" and timeDiff < 500 then
            error({
                code = TIMING_ERRORS.IMPOSSIBLE_SEQUENCE,
                message = "Consecutive moves too rapid",
                success = false
            })
        end
    end
    
    return true
end

function TimingValidator.validateTurnTiming(battleState, playerId, actionTimestamp)
    if not battleState or not playerId or not actionTimestamp then
        error({
            code = TIMING_ERRORS.TURN_TIMEOUT,
            message = "Battle state, player ID and action timestamp required",
            success = false
        })
    end
    
    -- Check if it's player's turn
    if battleState.currentTurn ~= playerId then
        error({
            code = TIMING_ERRORS.INVALID_ACTION_ORDER,
            message = "Action submitted out of turn",
            success = false
        })
    end
    
    -- Check turn timeout
    if battleState.turnStartTime then
        local turnDuration = actionTimestamp - battleState.turnStartTime
        if turnDuration > TIMING_LIMITS.MAX_TURN_DURATION then
            error({
                code = TIMING_ERRORS.TURN_TIMEOUT,
                message = "Turn timeout exceeded",
                success = false
            })
        end
        
        if turnDuration < 0 then
            error({
                code = TIMING_ERRORS.IMPOSSIBLE_SEQUENCE,
                message = "Action timestamp before turn start",
                success = false
            })
        end
    end
    
    return true
end

function TimingValidator.validateRateLimit(playerId, actionType, currentTime, actionLog)
    if not playerId or not actionType or not currentTime or not actionLog then
        error({
            code = TIMING_ERRORS.RATE_LIMIT_EXCEEDED,
            message = "Player ID, action type, current time and action log required",
            success = false
        })
    end
    
    local playerActions = actionLog[playerId] or {}
    local recentActions = {}
    local oneMinuteAgo = currentTime - 60000
    
    -- Count actions in the last minute
    for _, action in ipairs(playerActions) do
        if action.timestamp > oneMinuteAgo and action.type == actionType then
            table.insert(recentActions, action)
        end
    end
    
    if #recentActions >= TIMING_LIMITS.MAX_ACTIONS_PER_MINUTE then
        error({
            code = TIMING_ERRORS.RATE_LIMIT_EXCEEDED,
            message = string.format("Rate limit exceeded: %d actions per minute", TIMING_LIMITS.MAX_ACTIONS_PER_MINUTE),
            success = false
        })
    end
    
    return true
end

function TimingValidator.validateProgressionTiming(playerData, progressionEvent, eventTime)
    if not playerData or not progressionEvent or not eventTime then
        error({
            code = TIMING_ERRORS.PROGRESSION_TOO_FAST,
            message = "Player data, progression event and event time required",
            success = false
        })
    end
    
    if progressionEvent.type == "level_up" then
        local recentLevelUps = playerData.recentLevelUps or {}
        local oneHourAgo = eventTime - 3600000 -- 1 hour in milliseconds
        local levelUpsThisHour = 0
        
        for _, levelUp in ipairs(recentLevelUps) do
            if levelUp.timestamp > oneHourAgo then
                levelUpsThisHour = levelUpsThisHour + 1
            end
        end
        
        if levelUpsThisHour >= TIMING_LIMITS.MAX_LEVEL_UPS_PER_HOUR then
            error({
                code = TIMING_ERRORS.PROGRESSION_TOO_FAST,
                message = "Too many level ups in short time period",
                success = false
            })
        end
    end
    
    -- Check for impossible progression speed
    if playerData.accountCreated then
        local accountAge = eventTime - playerData.accountCreated
        local minAccountAge = 300000 -- 5 minutes
        
        if progressionEvent.type == "area_unlock" and progressionEvent.area == "final_area" then
            if accountAge < minAccountAge then
                error({
                    code = TIMING_ERRORS.PROGRESSION_TOO_FAST,
                    message = "Account too new for advanced progression",
                    success = false
                })
            end
        end
    end
    
    return true
end

function TimingValidator.validateCooldownPeriod(playerId, actionType, currentTime, lastActionTime)
    if not playerId or not actionType or not currentTime then
        error({
            code = TIMING_ERRORS.IMPOSSIBLE_SEQUENCE,
            message = "Player ID, action type and current time required",
            success = false
        })
    end
    
    if not lastActionTime then
        return true -- First action of this type
    end
    
    local cooldownPeriods = {
        heal = 5000,    -- 5 seconds
        trade = 10000,  -- 10 seconds
        save = 1000,    -- 1 second
        battle = 2000   -- 2 seconds
    }
    
    local requiredCooldown = cooldownPeriods[actionType] or 0
    local timeSinceLastAction = currentTime - lastActionTime
    
    if timeSinceLastAction < requiredCooldown then
        error({
            code = TIMING_ERRORS.RATE_LIMIT_EXCEEDED,
            message = string.format("Action on cooldown: %d ms remaining", requiredCooldown - timeSinceLastAction),
            success = false
        })
    end
    
    return true
end

function TimingValidator.validateBattleDuration(battleState, battleEndTime)
    if not battleState or not battleEndTime then
        error({
            code = TIMING_ERRORS.IMPOSSIBLE_SEQUENCE,
            message = "Battle state and end time required",
            success = false
        })
    end
    
    local battleStartTime = battleState.startTime
    if not battleStartTime then
        error({
            code = TIMING_ERRORS.IMPOSSIBLE_SEQUENCE,
            message = "Battle start time required",
            success = false
        })
    end
    
    local battleDuration = battleEndTime - battleStartTime
    
    if battleDuration < TIMING_LIMITS.MIN_BATTLE_DURATION then
        error({
            code = TIMING_ERRORS.IMPOSSIBLE_SEQUENCE,
            message = "Battle ended too quickly",
            success = false
        })
    end
    
    if battleDuration < 0 then
        error({
            code = TIMING_ERRORS.IMPOSSIBLE_SEQUENCE,
            message = "Battle end time before start time",
            success = false
        })
    end
    
    return true
end

-- Simple test framework (reused)
local TestRunner = {tests = {}, passed = 0, failed = 0}
function TestRunner.test(name, testFunc) table.insert(TestRunner.tests, {name = name, func = testFunc}) end
function TestRunner.run()
    print("Running TimingValidator Tests...")
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
    if type(err) == "table" and err.code then
        TestRunner.assert(err.code == expectedErrorCode, 
            string.format("Expected error code %s, got %s", expectedErrorCode, err.code))
    else
        error(string.format("Expected error object with code %s, got %s", expectedErrorCode, type(err)))
    end
end

-- Test Cases

TestRunner.test("validateActionSequence - valid sequence", function()
    local actionHistory = {{type = "move", timestamp = 1000}}
    local newAction = {type = "switch", timestamp = 2000}
    local result = TimingValidator.validateActionSequence(actionHistory, newAction, 2000)
    TestRunner.assert(result == true, "Should validate normal action sequence")
end)

TestRunner.test("validateActionSequence - too rapid", function()
    local actionHistory = {{type = "move", timestamp = 1000}}
    local newAction = {type = "move", timestamp = 1050}
    TestRunner.assertError(function()
        TimingValidator.validateActionSequence(actionHistory, newAction, 1050)
    end, "TIME_001", "Should reject rapid consecutive moves")
end)

TestRunner.test("validateTurnTiming - valid turn", function()
    local battleState = {currentTurn = "player1", turnStartTime = 1000}
    local result = TimingValidator.validateTurnTiming(battleState, "player1", 15000)
    TestRunner.assert(result == true, "Should validate turn within time limit")
end)

TestRunner.test("validateTurnTiming - timeout", function()
    local battleState = {currentTurn = "player1", turnStartTime = 1000}
    TestRunner.assertError(function()
        TimingValidator.validateTurnTiming(battleState, "player1", 35000) -- 34 seconds later
    end, "TIME_002", "Should reject turn timeout")
end)

TestRunner.test("validateRateLimit - within limit", function()
    local actionLog = {player1 = {{type = "move", timestamp = 1000}}}
    local result = TimingValidator.validateRateLimit("player1", "move", 65000, actionLog)
    TestRunner.assert(result == true, "Should allow actions within rate limit")
end)

TestRunner.test("validateProgressionTiming - valid progression", function()
    local playerData = {recentLevelUps = {{timestamp = 1000}}}
    local progressionEvent = {type = "level_up"}
    local result = TimingValidator.validateProgressionTiming(playerData, progressionEvent, 3700000)
    TestRunner.assert(result == true, "Should allow normal progression timing")
end)

TestRunner.test("validateCooldownPeriod - valid cooldown", function()
    local result = TimingValidator.validateCooldownPeriod("player1", "heal", 10000, 1000)
    TestRunner.assert(result == true, "Should allow action after cooldown")
end)

TestRunner.test("validateCooldownPeriod - on cooldown", function()
    TestRunner.assertError(function()
        TimingValidator.validateCooldownPeriod("player1", "heal", 3000, 1000) -- Only 2 seconds later
    end, "TIME_003", "Should reject action on cooldown")
end)

TestRunner.test("validateBattleDuration - valid battle", function()
    local battleState = {startTime = 1000}
    local result = TimingValidator.validateBattleDuration(battleState, 5000)
    TestRunner.assert(result == true, "Should validate reasonable battle duration")
end)

TestRunner.test("validateBattleDuration - too quick", function()
    local battleState = {startTime = 1000}
    TestRunner.assertError(function()
        TimingValidator.validateBattleDuration(battleState, 1500) -- 500ms battle
    end, "TIME_001", "Should reject unreasonably quick battle")
end)

-- Run all tests
return TestRunner.run()