-- Priority Calculator Unit Tests
-- Comprehensive testing for move priority and turn order calculation
-- Tests move priority, speed calculations, and turn order determination
-- Ensures TypeScript parity for battle mechanics

-- Load test framework and dependencies
local TestFramework = require("framework.test-framework-enhanced")
local PriorityCalculator = require("game-logic.battle.priority-calculator")
local MoveDatabase = require("data.moves.move-database")

-- Test suite for Priority Calculator
local PriorityCalculatorTests = {}

-- Helper function to create mock Pokemon
local function createMockPokemon(id, speed, status, battleStats)
    return {
        id = id or "test_pokemon",
        stats = {
            speed = speed or 100
        },
        status = status or 0, -- No status
        battleStats = battleStats or {
            speed = 0 -- No speed stage modifications
        },
        side = 0 -- Player side
    }
end

-- Helper function to create mock battle conditions
local function createMockBattleConditions(trickRoom, tailwind)
    return {
        trickRoom = trickRoom or 0,
        tailwind = tailwind or {},
        rng = {
            random = function() return 42 end -- Fixed seed for testing
        }
    }
end

function PriorityCalculatorTests.runAllTests()
    local testSuite = TestFramework.createTestSuite("PriorityCalculator")
    
    -- Test initialization
    testSuite:addTest("Priority Calculator Initialization", function()
        local success = PriorityCalculator.init()
        TestFramework.assert(success == true, "Priority calculator should initialize successfully")
    end)
    
    -- Test move priority retrieval
    testSuite:addTest("Move Priority Retrieval", function()
        PriorityCalculator.init()
        MoveDatabase.init()
        
        -- Test normal priority move (Pound)
        local priority = PriorityCalculator.getMovePriority(1) -- POUND
        TestFramework.assert(priority == 0, "POUND should have normal priority (0)")
        
        -- Test invalid move
        local priority2 = PriorityCalculator.getMovePriority(99999)
        TestFramework.assert(priority2 == 0, "Invalid moves should return default priority (0)")
        
        -- Test no move
        local priority3 = PriorityCalculator.getMovePriority(0)
        TestFramework.assert(priority3 == 0, "No move should return default priority (0)")
    end)
    
    -- Test effective speed calculation
    testSuite:addTest("Effective Speed Calculation", function()
        local battleConditions = createMockBattleConditions()
        
        -- Test base speed calculation
        local pokemon = createMockPokemon("speed_test", 100, 0)
        local effectiveSpeed = PriorityCalculator.calculateEffectiveSpeed(pokemon, battleConditions)
        TestFramework.assert(effectiveSpeed == 100, "Base speed should be 100")
        
        -- Test speed with positive stat stage
        local pokemon2 = createMockPokemon("boosted_speed", 100, 0, {speed = 2})
        local effectiveSpeed2 = PriorityCalculator.calculateEffectiveSpeed(pokemon2, battleConditions)
        TestFramework.assert(effectiveSpeed2 == 200, "Speed with +2 stage should be 200 (2x multiplier)")
        
        -- Test speed with negative stat stage
        local pokemon3 = createMockPokemon("lowered_speed", 100, 0, {speed = -2})
        local effectiveSpeed3 = PriorityCalculator.calculateEffectiveSpeed(pokemon3, battleConditions)
        TestFramework.assert(effectiveSpeed3 == 50, "Speed with -2 stage should be 50 (0.5x multiplier)")
        
        -- Test paralysis effect
        local MoveEffects = require("game-logic.battle.move-effects")
        local pokemon4 = createMockPokemon("paralyzed", 100, MoveEffects.STATUS_EFFECTS.PARALYSIS)
        local effectiveSpeed4 = PriorityCalculator.calculateEffectiveSpeed(pokemon4, battleConditions)
        TestFramework.assert(effectiveSpeed4 == 25, "Paralyzed Pokemon should have 25% speed (25)")
    end)
    
    -- Test tailwind effect
    testSuite:addTest("Tailwind Effect on Speed", function()
        local battleConditions = createMockBattleConditions(0, {[0] = 3}) -- Tailwind for side 0
        
        local pokemon = createMockPokemon("tailwind_test", 100, 0)
        pokemon.side = 0
        local effectiveSpeed = PriorityCalculator.calculateEffectiveSpeed(pokemon, battleConditions)
        TestFramework.assert(effectiveSpeed == 200, "Tailwind should double speed to 200")
        
        -- Test Pokemon on opposite side (no tailwind)
        local pokemon2 = createMockPokemon("no_tailwind", 100, 0)
        pokemon2.side = 1
        local effectiveSpeed2 = PriorityCalculator.calculateEffectiveSpeed(pokemon2, battleConditions)
        TestFramework.assert(effectiveSpeed2 == 100, "Pokemon without tailwind should have base speed")
    end)
    
    -- Test turn action creation
    testSuite:addTest("Turn Action Creation", function()
        local pokemon = createMockPokemon("action_test")
        
        -- Test move action
        local moveAction = PriorityCalculator.createTurnAction("move", pokemon, 1, nil)
        TestFramework.assert(moveAction ~= nil, "Move action should be created")
        TestFramework.assert(moveAction.type == "move", "Action type should be 'move'")
        TestFramework.assert(moveAction.moveId == 1, "Move ID should be 1")
        TestFramework.assert(moveAction.priority ~= nil, "Action should have priority")
        
        -- Test switch action
        local switchAction = PriorityCalculator.createTurnAction("switch", pokemon, nil, nil)
        TestFramework.assert(switchAction ~= nil, "Switch action should be created")
        TestFramework.assert(switchAction.type == "switch", "Action type should be 'switch'")
        TestFramework.assert(switchAction.priority == 6, "Switch should have highest priority (6)")
        
        -- Test invalid action
        local invalidAction = PriorityCalculator.createTurnAction(nil, pokemon)
        TestFramework.assert(invalidAction == nil, "Invalid action should return nil")
    end)
    
    -- Test action comparison
    testSuite:addTest("Action Priority Comparison", function()
        local pokemon1 = createMockPokemon("fast", 120)
        local pokemon2 = createMockPokemon("slow", 80)
        local battleConditions = createMockBattleConditions()
        
        -- Create actions with same priority but different speeds
        local fastAction = PriorityCalculator.createTurnAction("move", pokemon1, 1, nil)
        local slowAction = PriorityCalculator.createTurnAction("move", pokemon2, 1, nil)
        
        -- Add effective speeds
        fastAction.effectiveSpeed = PriorityCalculator.calculateEffectiveSpeed(pokemon1, battleConditions)
        slowAction.effectiveSpeed = PriorityCalculator.calculateEffectiveSpeed(pokemon2, battleConditions)
        
        -- Test comparison
        local fastFirst = PriorityCalculator.compareActions(fastAction, slowAction, battleConditions)
        TestFramework.assert(fastFirst == true, "Faster Pokemon should go first")
        
        local slowFirst = PriorityCalculator.compareActions(slowAction, fastAction, battleConditions)
        TestFramework.assert(slowFirst == false, "Slower Pokemon should go second")
    end)
    
    -- Test priority over speed
    testSuite:addTest("Priority Over Speed", function()
        local fastPokemon = createMockPokemon("fast", 150)
        local slowPokemon = createMockPokemon("slow", 50)
        local battleConditions = createMockBattleConditions()
        
        -- Fast Pokemon uses normal move, slow Pokemon uses priority move
        local normalAction = PriorityCalculator.createTurnAction("move", fastPokemon, 1, nil) -- Normal priority
        local priorityAction = PriorityCalculator.createTurnAction("move", slowPokemon, 98, nil) -- High priority move
        
        -- Set priorities manually for test (in real scenario, these come from move database)
        normalAction.priority = 0
        priorityAction.priority = 1
        
        normalAction.effectiveSpeed = PriorityCalculator.calculateEffectiveSpeed(fastPokemon, battleConditions)
        priorityAction.effectiveSpeed = PriorityCalculator.calculateEffectiveSpeed(slowPokemon, battleConditions)
        
        local priorityFirst = PriorityCalculator.compareActions(priorityAction, normalAction, battleConditions)
        TestFramework.assert(priorityFirst == true, "Priority move should go first despite lower speed")
    end)
    
    -- Test Trick Room reversal
    testSuite:addTest("Trick Room Speed Reversal", function()
        local fastPokemon = createMockPokemon("fast", 120)
        local slowPokemon = createMockPokemon("slow", 80)
        local trickRoomConditions = createMockBattleConditions(3) -- 3 turns of Trick Room
        
        local fastAction = PriorityCalculator.createTurnAction("move", fastPokemon, 1, nil)
        local slowAction = PriorityCalculator.createTurnAction("move", slowPokemon, 1, nil)
        
        fastAction.effectiveSpeed = PriorityCalculator.calculateEffectiveSpeed(fastPokemon, trickRoomConditions)
        slowAction.effectiveSpeed = PriorityCalculator.calculateEffectiveSpeed(slowPokemon, trickRoomConditions)
        
        -- In Trick Room, slower Pokemon should go first
        local slowFirst = PriorityCalculator.compareActions(slowAction, fastAction, trickRoomConditions)
        TestFramework.assert(slowFirst == true, "In Trick Room, slower Pokemon should go first")
    end)
    
    -- Test turn order calculation
    testSuite:addTest("Turn Order Calculation", function()
        local pokemon1 = createMockPokemon("p1", 100)
        local pokemon2 = createMockPokemon("p2", 120)
        local pokemon3 = createMockPokemon("p3", 80)
        local pokemon4 = createMockPokemon("p4", 90)
        
        local battleConditions = createMockBattleConditions()
        
        local actions = {
            PriorityCalculator.createTurnAction("move", pokemon1, 1, nil),
            PriorityCalculator.createTurnAction("move", pokemon2, 1, nil),
            PriorityCalculator.createTurnAction("move", pokemon3, 1, nil),
            PriorityCalculator.createTurnAction("switch", pokemon4, nil, nil)
        }
        
        local orderedActions = PriorityCalculator.calculateTurnOrder(actions, battleConditions)
        
        TestFramework.assert(#orderedActions == 4, "Should return all 4 actions")
        TestFramework.assert(orderedActions[1].type == "switch", "Switch should be first (highest priority)")
        TestFramework.assert(orderedActions[2].pokemon.id == "p2", "Fastest Pokemon should be second")
        TestFramework.assert(orderedActions[4].pokemon.id == "p3", "Slowest Pokemon should be last")
    end)
    
    -- Test battle turn processing
    testSuite:addTest("Battle Turn Processing", function()
        local pokemon1 = createMockPokemon("player1", 100)
        local pokemon2 = createMockPokemon("player2", 80)
        
        local playerCommands = {
            player1 = {
                {type = "move", pokemon = pokemon1, moveId = 1, target = pokemon2}
            },
            player2 = {
                {type = "move", pokemon = pokemon2, moveId = 1, target = pokemon1}
            }
        }
        
        local battleState = createMockBattleConditions()
        
        local orderedActions, success, msg = PriorityCalculator.processBattleTurn(
            "test_battle", playerCommands, battleState
        )
        
        TestFramework.assert(success == true, "Battle turn processing should succeed")
        TestFramework.assert(#orderedActions == 2, "Should process both player commands")
        TestFramework.assert(orderedActions[1].pokemon.id == "player1", "Faster Pokemon should go first")
    end)
    
    -- Test turn order validation
    testSuite:addTest("Turn Order Validation", function()
        local pokemon1 = createMockPokemon("valid1", 100)
        local pokemon2 = createMockPokemon("valid2", 80)
        
        -- Valid actions
        local validActions = {
            {type = "move", pokemon = pokemon1, priority = 0, effectiveSpeed = 100},
            {type = "move", pokemon = pokemon2, priority = 0, effectiveSpeed = 80}
        }
        
        local isValid, msg = PriorityCalculator.validateTurnOrder(validActions)
        TestFramework.assert(isValid == true, "Valid turn order should pass validation")
        
        -- Invalid actions (wrong order)
        local invalidActions = {
            {type = "move", pokemon = pokemon2, priority = 0, effectiveSpeed = 80},
            {type = "move", pokemon = pokemon1, priority = 1, effectiveSpeed = 100} -- Higher priority should be first
        }
        
        local isValid2, msg2 = PriorityCalculator.validateTurnOrder(invalidActions)
        TestFramework.assert(isValid2 == false, "Invalid priority order should fail validation")
    end)
    
    -- Test priority breakdown analysis
    testSuite:addTest("Priority Breakdown Analysis", function()
        local pokemon = createMockPokemon("analysis_test", 100, 0, {speed = 1})
        local battleConditions = createMockBattleConditions()
        
        local action = PriorityCalculator.createTurnAction("move", pokemon, 1, nil)
        action.effectiveSpeed = PriorityCalculator.calculateEffectiveSpeed(pokemon, battleConditions)
        
        local breakdown = PriorityCalculator.getPriorityBreakdown(action, battleConditions)
        
        TestFramework.assert(breakdown.action_type == "move", "Should record action type")
        TestFramework.assert(breakdown.base_priority ~= nil, "Should record base priority")
        TestFramework.assert(breakdown.effective_speed == 150, "Should record effective speed (100 * 1.5)")
        TestFramework.assert(breakdown.pokemon_id == "analysis_test", "Should record Pokemon ID")
        TestFramework.assert(breakdown.base_speed == 100, "Should record base speed")
        TestFramework.assert(breakdown.speed_stage == 1, "Should record speed stage")
    end)
    
    -- Performance test
    testSuite:addTest("Priority Calculation Performance", function()
        local battleConditions = createMockBattleConditions()
        
        -- Create many Pokemon for performance test
        local testPokemon = {}
        for i = 1, 100 do
            testPokemon[i] = createMockPokemon("perf_test_" .. i, 50 + i)
        end
        
        -- Create actions
        local actions = {}
        for i = 1, 100 do
            actions[i] = PriorityCalculator.createTurnAction("move", testPokemon[i], 1, nil)
        end
        
        -- Time the turn order calculation
        local startTime = os.clock()
        local orderedActions = PriorityCalculator.calculateTurnOrder(actions, battleConditions)
        local processingTime = os.clock() - startTime
        
        print("Turn order calculation: " .. string.format("%.4f", processingTime) .. 
              " seconds (100 actions)")
        
        TestFramework.assert(processingTime < 0.5, "Turn order calculation should complete in under 0.5 seconds")
        TestFramework.assert(#orderedActions == 100, "Should return all 100 actions")
        
        -- Verify order is correct (fastest to slowest for same priority)
        for i = 1, 99 do
            TestFramework.assert(orderedActions[i].effectiveSpeed >= orderedActions[i+1].effectiveSpeed,
                               "Actions should be in speed descending order")
        end
    end)
    
    -- Integration test with move database
    testSuite:addTest("Move Database Priority Integration", function()
        MoveDatabase.init()
        PriorityCalculator.init()
        
        -- Test various moves with different priorities
        local moves = {
            {id = 1, name = "Pound", expectedPriority = 0},
            -- Add more moves with known priorities when available in database
        }
        
        for _, moveData in ipairs(moves) do
            local priority = PriorityCalculator.getMovePriority(moveData.id)
            TestFramework.assert(priority == moveData.expectedPriority,
                               moveData.name .. " should have priority " .. moveData.expectedPriority)
        end
    end)
    
    return testSuite:run()
end

return PriorityCalculatorTests