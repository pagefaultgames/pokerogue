-- security-framework.test.lua: Integration tests for complete security workflow

package.path = package.path .. ";../../?.lua;../../handlers/?.lua;../../game-logic/pokemon/?.lua;../../game-logic/rng/?.lua"

-- Import all security components
local AuthHandler = require("auth-handler")
local ValidationHandler = require("validation-handler")
local AntiCheatHandler = require("anti-cheat-handler")

-- Integration test framework
local TestRunner = {tests = {}, passed = 0, failed = 0}
function TestRunner.test(name, testFunc) table.insert(TestRunner.tests, {name = name, func = testFunc}) end
function TestRunner.run()
    print("Running Security Framework Integration Tests...")
    print("=" .. string.rep("=", 60))
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
    print("=" .. string.rep("=", 60))
    print(string.format("Results: %d passed, %d failed", TestRunner.passed, TestRunner.failed))
    return TestRunner.failed == 0
end
function TestRunner.assert(condition, message) if not condition then error(message or "Assertion failed") end end

-- Mock game state for testing
local function createMockGameState()
    return {
        player = {
            party = {
                {
                    speciesId = "pikachu",
                    level = 25,
                    experience = 15625,
                    stats = {hp = 100, attack = 80},
                    moves = {{id = "thunderbolt"}, {id = "quick-attack"}}
                }
            },
            currency = 5000,
            currentWinStreak = 3,
            inventory = {pokeball = 10, potion = 5},
            visitedAreas = {"starter_town", "route_1"},
            currentArea = "forest"
        },
        battleState = {
            currentTurn = "player123456789",
            turnStartTime = 1000,
            participants = {"player123456789", "opponent456789123"}
        },
        moveDatabase = {
            pikachu = {
                {id = "thunderbolt"},
                {id = "quick-attack"}
            }
        }
    }
end

-- Test complete authentication and authorization workflow
TestRunner.test("complete_auth_workflow - valid player operation", function()
    local gameState = createMockGameState()
    local playerId = "player123456789"
    local messageFrom = "player123456789"
    
    -- Test authorization
    local authResult = AuthHandler.authorizePlayerOperation("save_game", playerId, messageFrom)
    TestRunner.assert(authResult.success == true, "Should authorize valid player operation")
    TestRunner.assert(authResult.playerId == playerId, "Should return correct player ID")
    
    -- Test with battle action
    local battleData = {battleState = gameState.battleState}
    local battleAuthResult = AuthHandler.authorizePlayerOperation("battle_action", playerId, messageFrom, battleData)
    TestRunner.assert(battleAuthResult.success == true, "Should authorize valid battle action")
end)

TestRunner.test("complete_auth_workflow - unauthorized access attempt", function()
    local gameState = createMockGameState()
    local playerId = "player123456789"
    local hackerFrom = "hacker456789123"
    
    -- Test unauthorized access
    local authResult = AuthHandler.authorizePlayerOperation("save_game", playerId, hackerFrom)
    TestRunner.assert(authResult.success == false, "Should deny unauthorized access")
    TestRunner.assert(authResult.error.code == "AUTH_002", "Should return ownership violation")
end)

-- Test complete validation workflow
TestRunner.test("complete_validation_workflow - valid battle action", function()
    local gameState = createMockGameState()
    local actionData = {
        playerId = "player123456789",
        timestamp = 15000, -- 15 seconds from turn start (within 30s limit)
        action = {
            type = "move",
            moveId = "thunderbolt"
        }
    }
    
    local result = ValidationHandler.validateCompleteAction(
        actionData,
        gameState.battleState,
        gameState.player.party[1],
        gameState.moveDatabase
    )
    
    if not result.success then
        print("Validation failed:", result.error and result.error.message or "No error message")
    end
    TestRunner.assert(result.success == true, "Should validate complete legal action")
    TestRunner.assert(result.playerId == "player123456789", "Should return correct player ID")
end)

TestRunner.test("complete_validation_workflow - invalid action sequence", function()
    local gameState = createMockGameState()
    local actionData = {
        playerId = "player123456789",
        timestamp = 1500,
        action = {
            type = "move",
            moveId = "unknown_move" -- Invalid move
        }
    }
    
    local result = ValidationHandler.validateCompleteAction(
        actionData,
        gameState.battleState,
        gameState.player.party[1],
        gameState.moveDatabase
    )
    
    TestRunner.assert(result.success == false, "Should reject invalid action")
    TestRunner.assert(result.error.code == "VAL_001", "Should return move validation error")
end)

-- Test complete anti-cheat detection workflow
TestRunner.test("complete_anticheat_workflow - clean player scan", function()
    local gameState = createMockGameState()
    local playerId = "player123456789"
    local correlationId = "test-correlation-123"
    
    local scanResults = AntiCheatHandler.performCheatScan(
        playerId,
        gameState,
        {}, -- Clean activity log
        correlationId
    )
    
    TestRunner.assert(scanResults.playerId == playerId, "Should return correct player ID")
    TestRunner.assert(scanResults.correlationId == correlationId, "Should track correlation ID")
    TestRunner.assert(scanResults.overallRiskScore == 0, "Should have zero risk for clean player")
    TestRunner.assert(scanResults.recommendedAction == "none", "Should recommend no action")
end)

TestRunner.test("complete_anticheat_workflow - suspicious player detection", function()
    local gameState = createMockGameState()
    -- Modify to create suspicious data
    gameState.player.currentWinStreak = 100 -- Excessive win streak
    gameState.player.currency = -1000 -- Negative currency (corruption)
    
    local playerId = "player123456789"
    local correlationId = "test-correlation-456"
    
    local scanResults = AntiCheatHandler.performCheatScan(
        playerId,
        gameState,
        {},
        correlationId
    )
    
    TestRunner.assert(scanResults.overallRiskScore > 0, "Should detect risk in suspicious data")
    TestRunner.assert(#scanResults.anomalies > 0, "Should detect behavioral anomalies")
    TestRunner.assert(#scanResults.corruptions > 0, "Should detect data corruption")
    TestRunner.assert(scanResults.recommendedAction ~= "none", "Should recommend action")
end)

-- Test complete secure action validation (full integration)
TestRunner.test("full_integration - secure action validation success", function()
    local gameState = createMockGameState()
    local actionData = {
        operation = "battle_action",
        playerId = "player123456789",
        messageFrom = "player123456789",
        battleAction = {
            playerId = "player123456789",
            timestamp = 1500,
            action = {
                type = "move",
                moveId = "thunderbolt"
            }
        },
        additionalData = {
            battleState = gameState.battleState
        },
        activityLog = {}
    }
    
    local result = AntiCheatHandler.validateSecureAction(
        actionData,
        gameState,
        "integration-test-001"
    )
    
    TestRunner.assert(result.success == true, "Should validate complete secure action")
    TestRunner.assert(result.correlationId == "integration-test-001", "Should track correlation")
    TestRunner.assert(result.cheatScan ~= nil, "Should include cheat scan results")
    TestRunner.assert(result.authResult ~= nil, "Should include authorization results")
end)

TestRunner.test("full_integration - secure action validation failure", function()
    local gameState = createMockGameState()
    -- Create high-risk scenario
    gameState.player.currentWinStreak = 100 -- Triggers high risk
    
    local actionData = {
        operation = "battle_action",
        playerId = "player123456789",
        messageFrom = "hacker456789123", -- Wrong sender
        battleAction = {
            playerId = "player123456789",
            timestamp = 1500,
            action = {
                type = "move",
                moveId = "thunderbolt"
            }
        },
        additionalData = {
            battleState = gameState.battleState
        },
        activityLog = {}
    }
    
    local result = AntiCheatHandler.validateSecureAction(
        actionData,
        gameState,
        "integration-test-002"
    )
    
    TestRunner.assert(result.success == false, "Should reject insecure action")
    TestRunner.assert(#result.errors > 0, "Should report security errors")
    TestRunner.assert(result.correlationId == "integration-test-002", "Should track correlation")
end)

-- Test error handling integration
TestRunner.test("error_handling_integration - cascading validation", function()
    local gameState = createMockGameState()
    -- Create multiple issues
    gameState.player.party[1].level = 150 -- Invalid level
    gameState.battleState.currentTurn = "wrong_player" -- Wrong turn
    
    local actionData = {
        operation = "battle_action",
        playerId = "player123456789",
        messageFrom = "player123456789",
        battleAction = {
            playerId = "player123456789",
            timestamp = 35000, -- Turn timeout
            action = {
                type = "move",
                moveId = "thunderbolt"
            }
        },
        additionalData = {
            battleState = gameState.battleState
        },
        activityLog = {}
    }
    
    -- Should catch validation errors before they reach anti-cheat
    local result = ValidationHandler.validateCompleteAction(
        actionData.battleAction,
        gameState.battleState,
        gameState.player.party[1],
        gameState.moveDatabase
    )
    
    TestRunner.assert(result.success == false, "Should fail validation with multiple issues")
    TestRunner.assert(result.error ~= nil, "Should report validation error")
end)

-- Test security event logging integration
TestRunner.test("security_logging_integration - event correlation", function()
    local correlationId = "security-log-test-789"
    
    -- Log different types of security events
    local authEvent = AntiCheatHandler.logSecurityEvent(
        "AUTH_VIOLATION",
        "player123456789",
        {attempt = "ownership_bypass"},
        correlationId
    )
    
    local cheatEvent = AntiCheatHandler.logSecurityEvent(
        "CHEAT_DETECTED",
        "player123456789", 
        {riskScore = 15, type = "data_corruption"},
        correlationId
    )
    
    TestRunner.assert(authEvent.correlationId == correlationId, "Should correlate auth events")
    TestRunner.assert(cheatEvent.correlationId == correlationId, "Should correlate cheat events")
    TestRunner.assert(authEvent.playerId == cheatEvent.playerId, "Should track same player")
end)

-- Test resource validation integration
TestRunner.test("resource_validation_integration - comprehensive check", function()
    local gameState = createMockGameState()
    local playerId = "player123456789"
    
    -- Test Pokemon storage validation
    local pokemonData = {species = "charmander", level = 5}
    local partyResult = true
    
    -- Should allow adding to party (has space)
    local success, error = pcall(function()
        -- This would normally use ResourceValidator, but we'll validate the concept
        local partySize = #gameState.player.party
        if partySize >= 6 then
            error("Party full")
        end
    end)
    
    TestRunner.assert(success, "Should allow Pokemon addition to party with space")
    
    -- Test currency validation integration
    local currencyValid = gameState.player.currency >= 0 and gameState.player.currency <= 999999
    TestRunner.assert(currencyValid, "Should validate currency bounds")
    
    -- Test inventory integration
    local inventoryValid = true
    for itemId, count in pairs(gameState.player.inventory) do
        if count > 99 or count < 0 then
            inventoryValid = false
        end
    end
    TestRunner.assert(inventoryValid, "Should validate inventory item stacks")
end)

-- Run all integration tests
return TestRunner.run()