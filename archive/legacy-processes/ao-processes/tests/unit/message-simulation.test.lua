-- Unit Tests for Message Simulation Components  
-- Tests message creation and validation without emulator dependency

-- Test framework setup
local function assertEquals(expected, actual, message)
    message = message or "Assertion failed"
    if expected ~= actual then
        error(message .. ": expected " .. tostring(expected) .. ", got " .. tostring(actual))
    end
end

local function assertNotNil(value, message)
    message = message or "Value should not be nil"
    if value == nil then
        error(message)
    end
end

local function assertTrue(condition, message)
    message = message or "Condition should be true"
    if not condition then
        error(message)
    end
end

-- Mock message fixtures for testing
local MessageFixtures = {}
MessageFixtures.__index = MessageFixtures

function MessageFixtures.new()
    local fixtures = setmetatable({}, MessageFixtures)
    fixtures.templates = {
        auth = {
            authRequest = {
                Action = "Auth-Request",
                Tags = {RequestType = "auth"}
            }
        },
        battle = {
            battleMove = {
                Action = "Battle-Move",
                Tags = {MoveType = "attack"}
            }
        }
    }
    return fixtures
end

function MessageFixtures:createMessage(category, template, overrides)
    overrides = overrides or {}
    
    local base = self.templates[category] and self.templates[category][template]
    if not base then
        error("Unknown message template: " .. category .. "." .. template)
    end
    
    local message = {
        Id = "msg_" .. tostring(os.time()) .. "_" .. math.random(1000, 9999),
        From = overrides.From or "test-wallet-address",
        Action = overrides.Action or base.Action,
        Data = overrides.Data or "",
        Tags = {}
    }
    
    -- Copy base tags
    for k, v in pairs(base.Tags or {}) do
        message.Tags[k] = v
    end
    
    -- Apply overrides
    if overrides.Tags then
        for k, v in pairs(overrides.Tags) do
            message.Tags[k] = v
        end
    end
    
    return message
end

function MessageFixtures:validateMessageStructure(message)
    local errors = {}
    
    if not message.Id then
        table.insert(errors, "Missing Id field")
    end
    
    if not message.From then
        table.insert(errors, "Missing From field")
    end
    
    if not message.Action then
        table.insert(errors, "Missing Action field")
    end
    
    return #errors == 0, errors
end

function MessageFixtures:createBattleSequence(player1, player2, moves)
    local sequence = {}
    
    -- Battle start message
    table.insert(sequence, self:createMessage("battle", "battleMove", {
        Action = "Battle-Start",
        Tags = {Player1 = player1, Player2 = player2}
    }))
    
    -- Move messages
    for _, move in ipairs(moves) do
        table.insert(sequence, self:createMessage("battle", "battleMove", {
            From = move.player,
            Tags = {MoveId = tostring(move.moveId), Target = tostring(move.target)}
        }))
    end
    
    -- Battle end message
    table.insert(sequence, self:createMessage("battle", "battleMove", {
        Action = "Battle-End",
        Tags = {Winner = player1}
    }))
    
    return sequence
end

function MessageFixtures:createAuthSequence(wallet)
    local sequence = {}
    
    table.insert(sequence, self:createMessage("auth", "authRequest", {From = wallet}))
    table.insert(sequence, {
        Action = "Auth-Response",
        From = "process-address",
        Tags = {Status = "success", Wallet = wallet}
    })
    table.insert(sequence, {
        Action = "Session-Start",
        From = "process-address", 
        Tags = {Wallet = wallet, SessionId = "session_" .. tostring(os.time())}
    })
    
    return sequence
end

-- Message Fixture Tests
local function testMessageFixtures()
    print("Testing message fixtures...")
    
    local fixtures = MessageFixtures.new()
    assertNotNil(fixtures, "Fixtures should be created")
    assertNotNil(fixtures.templates, "Templates should be initialized")
    
    -- Test message creation
    local authMessage = fixtures:createMessage("auth", "authRequest", {
        From = "custom-wallet"
    })
    
    assertNotNil(authMessage, "Auth message should be created")
    assertEquals("custom-wallet", authMessage.From, "Custom From should be set")
    assertEquals("Auth-Request", authMessage.Action, "Action should be set")
    assertNotNil(authMessage.Id, "Message should have ID")
    assertNotNil(authMessage.Tags, "Message should have tags")
    
    -- Test battle message creation
    local battleMessage = fixtures:createMessage("battle", "battleMove", {
        Tags = {BattleId = "test-battle-123"}
    })
    
    assertEquals("Battle-Move", battleMessage.Action, "Battle action should be set")
    assertEquals("test-battle-123", battleMessage.Tags.BattleId, "Battle ID should be set")
    
    print("✅ Message fixtures test passed")
    return true
end

local function testMessageSequenceGeneration()
    print("Testing message sequence generation...")
    
    local fixtures = MessageFixtures.new()
    
    -- Test battle sequence
    local battleSeq = fixtures:createBattleSequence("player1", "player2", {
        {player = "player1", moveId = 85, target = 0},
        {player = "player2", moveId = 52, target = 0}
    })
    
    assertTrue(#battleSeq >= 3, "Battle sequence should have at least 3 messages")
    assertEquals("Battle-Start", battleSeq[1].Action, "First message should be battle start")
    assertEquals("Battle-Move", battleSeq[2].Action, "Second message should be battle move")
    
    -- Test auth sequence
    local authSeq = fixtures:createAuthSequence("test-wallet")
    
    assertTrue(#authSeq >= 3, "Auth sequence should have at least 3 messages")
    assertEquals("Auth-Request", authSeq[1].Action, "First message should be auth request")
    
    print("✅ Message sequence generation test passed")
    return true
end

local function testMessageValidation()
    print("Testing message validation...")
    
    local fixtures = MessageFixtures.new()
    
    -- Test valid message
    local validMessage = fixtures:createMessage("auth", "authRequest")
    local isValid, errors = fixtures:validateMessageStructure(validMessage)
    
    assertTrue(isValid, "Valid message should pass validation")
    assertEquals(0, #errors, "Valid message should have no errors")
    
    -- Test invalid message
    local invalidMessage = {
        Action = "Test"
        -- Missing required fields
    }
    
    isValid, errors = fixtures:validateMessageStructure(invalidMessage)
    assertTrue(not isValid, "Invalid message should fail validation")
    assertTrue(#errors > 0, "Invalid message should have errors")
    
    print("✅ Message validation test passed")
    return true
end

local function testBattleStateTracking()
    print("Testing battle state tracking...")
    
    -- Mock battle state manager
    local BattleStateManager = {}
    BattleStateManager.__index = BattleStateManager
    
    function BattleStateManager.new()
        return setmetatable({
            battles = {},
            snapshots = {}
        }, BattleStateManager)
    end
    
    function BattleStateManager:createBattle(config)
        local battle = {
            id = config.battleId or "battle_" .. tostring(os.time()),
            players = config.players or {},
            phase = "start",
            turn = 1,
            playerStates = {}
        }
        
        for _, player in ipairs(battle.players) do
            battle.playerStates[player] = {
                status = "active",
                team = {{species = "Pikachu", hp = 100, maxHp = 100}}
            }
        end
        
        self.battles[battle.id] = battle
        return battle
    end
    
    function BattleStateManager:createStateSnapshot(battleId, label)
        local battle = self.battles[battleId]
        if not battle then return nil end
        
        local snapshot = {
            battleId = battleId,
            label = label,
            turn = battle.turn,
            phase = battle.phase,
            timestamp = os.time()
        }
        
        table.insert(self.snapshots, snapshot)
        return snapshot
    end
    
    local manager = BattleStateManager.new()
    assertNotNil(manager, "Manager should be created")
    
    -- Create battle
    local battle = manager:createBattle({
        players = {"player1", "player2"},
        gameMode = "singles"
    })
    
    assertNotNil(battle, "Battle should be created")
    assertEquals(2, #battle.players, "Battle should have 2 players")
    assertEquals("start", battle.phase, "Battle should start in 'start' phase")
    
    print("✅ Battle state tracking test passed")
    return true
end

local function testMessageGenerationPerformance()
    print("Testing message generation performance...")
    
    local fixtures = MessageFixtures.new()
    local startTime = os.clock()
    
    -- Generate many messages
    local messages = {}
    for i = 1, 100 do
        local message = fixtures:createMessage("battle", "battleMove", {
            From = "player" .. i,
            Tags = {BattleId = "perf-test-" .. i}
        })
        table.insert(messages, message)
    end
    
    local endTime = os.clock()
    local duration = endTime - startTime
    
    assertEquals(100, #messages, "Should generate 100 messages")
    assertTrue(duration < 1.0, "Should generate messages quickly (< 1 second)")
    
    print(string.format("  Generated 100 messages in %.3f seconds", duration))
    
    print("✅ Message generation performance test passed")
    return true
end

-- Run all tests
local function runTests()
    print("🧪 Running Message Simulation Component Tests")
    print("=============================================")
    
    local tests = {
        testMessageFixtures,
        testMessageSequenceGeneration,
        testMessageValidation,
        testBattleStateTracking,
        testMessageGenerationPerformance
    }
    
    local passed = 0
    local failed = 0
    
    for i, test in ipairs(tests) do
        print("")
        local success, err = pcall(test)
        
        if success then
            passed = passed + 1
        else
            failed = failed + 1
            print("❌ Test " .. i .. " failed: " .. tostring(err))
        end
    end
    
    print("")
    print("📊 Test Results:")
    print("================")
    print("Passed: " .. passed)
    print("Failed: " .. failed)
    print("Total: " .. (passed + failed))
    
    if failed == 0 then
        print("")
        print("🎉 All Message Simulation tests passed!")
        return true
    else
        print("")
        print("❌ Some tests failed. Please review the output above.")
        return false
    end
end

-- Execute tests
return runTests()