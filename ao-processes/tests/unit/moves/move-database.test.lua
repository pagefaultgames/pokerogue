-- Move Database Unit Tests
-- Comprehensive testing for move database functionality with TypeScript comparison
-- Tests move data validation, lookup performance, and integration compatibility

-- Load test framework and dependencies
local TestFramework = require("tests.framework.test-framework-enhanced")
local MoveDatabase = require("data.moves.move-database")
local MoveIndexes = require("data.moves.move-indexes")
local Enums = require("data.constants.enums")

-- Test suite for Move Database
local MoveDbTests = {}

function MoveDbTests.runAllTests()
    local testSuite = TestFramework.createTestSuite("MoveDatabase")
    
    -- Test database initialization
    testSuite:addTest("Move Database Initialization", function()
        local success, err = pcall(function()
            MoveDatabase.init()
        end)
        TestFramework.assert(success, "MoveDatabase.init() should succeed: " .. tostring(err))
        
        local moveCount = MoveDatabase.getMoveCount()
        TestFramework.assert(moveCount > 0, "Move database should contain moves")
        print("Initialized " .. moveCount .. " moves")
    end)
    
    -- Test basic move data retrieval
    testSuite:addTest("Move Data Retrieval", function()
        MoveDatabase.init()
        
        -- Test POUND move (id=1)
        local pound = MoveDatabase.getMoveData(1)
        TestFramework.assert(pound ~= nil, "POUND move should exist")
        TestFramework.assert(pound.name == "Pound", "POUND name should be 'Pound'")
        TestFramework.assert(pound.type == 0, "POUND should be Normal type")
        TestFramework.assert(pound.category == 0, "POUND should be Physical")
        TestFramework.assert(pound.power == 40, "POUND power should be 40")
        TestFramework.assert(pound.accuracy == 100, "POUND accuracy should be 100")
        TestFramework.assert(pound.pp == 35, "POUND PP should be 35")
        
        -- Test FIRE_PUNCH move (id=7)
        local firePunch = MoveDatabase.getMoveData(7)
        TestFramework.assert(firePunch ~= nil, "FIRE_PUNCH move should exist")
        TestFramework.assert(firePunch.name == "Fire Punch", "FIRE_PUNCH name should be 'Fire Punch'")
        TestFramework.assert(firePunch.type == 9, "FIRE_PUNCH should be Fire type")
        TestFramework.assert(firePunch.category == 0, "FIRE_PUNCH should be Physical")
        TestFramework.assert(firePunch.power == 75, "FIRE_PUNCH power should be 75")
        TestFramework.assert(firePunch.effects.burn_chance == 10, "FIRE_PUNCH should have 10% burn chance")
        
        -- Test invalid move ID
        local invalidMove = MoveDatabase.getMoveData(9999)
        TestFramework.assert(invalidMove == nil, "Invalid move ID should return nil")
    end)
    
    -- Test move name lookups
    testSuite:addTest("Move Name Functions", function()
        MoveDatabase.init()
        
        local poundName = MoveDatabase.getMoveName(1)
        TestFramework.assert(poundName == "Pound", "getMoveName(1) should return 'Pound'")
        
        local unknownName = MoveDatabase.getMoveName(9999)
        TestFramework.assert(unknownName == "Unknown Move", "Invalid move ID should return 'Unknown Move'")
    end)
    
    -- Test move type filtering
    testSuite:addTest("Move Type Filtering", function()
        MoveDatabase.init()
        
        -- Test Normal type moves
        local normalMoves = MoveDatabase.getMovesByType(0)
        TestFramework.assert(#normalMoves > 0, "Should have Normal type moves")
        
        -- Verify all returned moves are actually Normal type
        for _, moveId in ipairs(normalMoves) do
            local move = MoveDatabase.getMoveData(moveId)
            TestFramework.assert(move.type == 0, "Move " .. moveId .. " should be Normal type")
        end
        
        -- Test Fire type moves
        local fireMoves = MoveDatabase.getMovesByType(9)
        TestFramework.assert(#fireMoves > 0, "Should have Fire type moves")
        for _, moveId in ipairs(fireMoves) do
            local move = MoveDatabase.getMoveData(moveId)
            TestFramework.assert(move.type == 9, "Move " .. moveId .. " should be Fire type")
        end
    end)
    
    -- Test move category filtering
    testSuite:addTest("Move Category Filtering", function()
        MoveDatabase.init()
        
        -- Test Physical moves
        local physicalMoves = MoveDatabase.getMovesByCategory(0)
        TestFramework.assert(#physicalMoves > 0, "Should have Physical moves")
        for _, moveId in ipairs(physicalMoves) do
            local move = MoveDatabase.getMoveData(moveId)
            TestFramework.assert(move.category == 0, "Move " .. moveId .. " should be Physical")
        end
        
        -- Test Special moves
        local specialMoves = MoveDatabase.getMovesByCategory(1)
        TestFramework.assert(#specialMoves > 0, "Should have Special moves")
        for _, moveId in ipairs(specialMoves) do
            local move = MoveDatabase.getMoveData(moveId)
            TestFramework.assert(move.category == 1, "Move " .. moveId .. " should be Special")
        end
        
        -- Test Status moves
        local statusMoves = MoveDatabase.getMovesByCategory(2)
        TestFramework.assert(#statusMoves > 0, "Should have Status moves")
        for _, moveId in ipairs(statusMoves) do
            local move = MoveDatabase.getMoveData(moveId)
            TestFramework.assert(move.category == 2, "Move " .. moveId .. " should be Status")
        end
    end)
    
    -- Test power range filtering
    testSuite:addTest("Move Power Range Filtering", function()
        MoveDatabase.init()
        
        -- Test moves in 70-80 power range
        local moderateMoves = MoveDatabase.getMovesByPowerRange(70, 80)
        TestFramework.assert(#moderateMoves > 0, "Should have moves in 70-80 power range")
        for _, moveId in ipairs(moderateMoves) do
            local move = MoveDatabase.getMoveData(moveId)
            TestFramework.assert(move.power >= 70 and move.power <= 80, 
                "Move " .. moveId .. " power should be between 70-80")
        end
        
        -- Test high power moves (100+)
        local highPowerMoves = MoveDatabase.getMovesByPowerRange(100, 999)
        for _, moveId in ipairs(highPowerMoves) do
            local move = MoveDatabase.getMoveData(moveId)
            TestFramework.assert(move.power >= 100, "Move " .. moveId .. " power should be 100+")
        end
    end)
    
    -- Test move target filtering
    testSuite:addTest("Move Target Filtering", function()
        MoveDatabase.init()
        
        -- Test single target moves (NEAR_OTHER)
        local singleTargetMoves = MoveDatabase.getMovesByTarget(3)
        TestFramework.assert(#singleTargetMoves > 0, "Should have single target moves")
        for _, moveId in ipairs(singleTargetMoves) do
            local move = MoveDatabase.getMoveData(moveId)
            TestFramework.assert(move.target == 3, "Move " .. moveId .. " should target NEAR_OTHER")
        end
        
        -- Test self-target moves (USER)
        local selfTargetMoves = MoveDatabase.getMovesByTarget(0)
        for _, moveId in ipairs(selfTargetMoves) do
            local move = MoveDatabase.getMoveData(moveId)
            TestFramework.assert(move.target == 0, "Move " .. moveId .. " should target USER")
        end
    end)
    
    -- Test move flag filtering
    testSuite:addTest("Move Flag Filtering", function()
        MoveDatabase.init()
        
        -- Test contact moves (flag 0)
        local contactMoves = MoveDatabase.getMovesByFlag(0)
        TestFramework.assert(#contactMoves > 0, "Should have contact moves")
        for _, moveId in ipairs(contactMoves) do
            local move = MoveDatabase.getMoveData(moveId)
            local hasContact = false
            for _, flag in ipairs(move.flags) do
                if flag == 0 then
                    hasContact = true
                    break
                end
            end
            TestFramework.assert(hasContact, "Move " .. moveId .. " should have contact flag")
        end
        
        -- Test punching moves (flag 7)
        local punchingMoves = MoveDatabase.getMovesByFlag(7)
        for _, moveId in ipairs(punchingMoves) do
            local move = MoveDatabase.getMoveData(moveId)
            local hasPunching = false
            for _, flag in ipairs(move.flags) do
                if flag == 7 then
                    hasPunching = true
                    break
                end
            end
            TestFramework.assert(hasPunching, "Move " .. moveId .. " should have punching flag")
        end
    end)
    
    -- Test move validation
    testSuite:addTest("Move Validation", function()
        MoveDatabase.init()
        
        TestFramework.assert(MoveDatabase.isValidMove(1), "Move ID 1 (POUND) should be valid")
        TestFramework.assert(MoveDatabase.isValidMove(7), "Move ID 7 (FIRE_PUNCH) should be valid")
        TestFramework.assert(not MoveDatabase.isValidMove(9999), "Move ID 9999 should be invalid")
        TestFramework.assert(not MoveDatabase.isValidMove(-1), "Move ID -1 should be invalid")
    end)
    
    -- Test move database completeness
    testSuite:addTest("Move Database Completeness", function()
        MoveDatabase.init()
        
        local allMoveIds = MoveDatabase.getAllMoveIds()
        TestFramework.assert(#allMoveIds > 0, "Should have move IDs")
        
        -- Verify all move IDs are unique
        local idSet = {}
        for _, moveId in ipairs(allMoveIds) do
            TestFramework.assert(idSet[moveId] == nil, "Move ID " .. moveId .. " should be unique")
            idSet[moveId] = true
        end
        
        -- Test that moves have required fields
        for _, moveId in ipairs(allMoveIds) do
            local move = MoveDatabase.getMoveData(moveId)
            TestFramework.assert(move.id ~= nil, "Move " .. moveId .. " should have id")
            TestFramework.assert(move.name ~= nil, "Move " .. moveId .. " should have name")
            TestFramework.assert(move.type ~= nil, "Move " .. moveId .. " should have type")
            TestFramework.assert(move.category ~= nil, "Move " .. moveId .. " should have category")
            TestFramework.assert(move.power ~= nil, "Move " .. moveId .. " should have power")
            TestFramework.assert(move.accuracy ~= nil, "Move " .. moveId .. " should have accuracy")
            TestFramework.assert(move.pp ~= nil, "Move " .. moveId .. " should have pp")
            TestFramework.assert(move.target ~= nil, "Move " .. moveId .. " should have target")
            TestFramework.assert(move.priority ~= nil, "Move " .. moveId .. " should have priority")
            TestFramework.assert(move.flags ~= nil, "Move " .. moveId .. " should have flags table")
            TestFramework.assert(move.effects ~= nil, "Move " .. moveId .. " should have effects table")
        end
    end)
    
    -- Test move database performance
    testSuite:addTest("Move Database Performance", function()
        MoveDatabase.init()
        
        local startTime = os.clock()
        
        -- Test 10000 random lookups
        for i = 1, 10000 do
            local moveId = (i % 20) + 1 -- Cycle through first 20 moves
            MoveDatabase.getMoveData(moveId)
        end
        
        local lookupTime = os.clock() - startTime
        TestFramework.assert(lookupTime < 1.0, "10000 lookups should complete in under 1 second")
        
        print("Performance: 10000 lookups in " .. string.format("%.4f", lookupTime) .. " seconds")
        print("Lookups per second: " .. string.format("%.0f", 10000 / lookupTime))
    end)
    
    -- Test integration with move indexes
    testSuite:addTest("Move Indexes Integration", function()
        MoveDatabase.init()
        MoveIndexes.buildIndexes(MoveDatabase)
        
        local stats = MoveIndexes.getIndexStats()
        TestFramework.assert(stats.total_moves > 0, "Indexes should have moves")
        TestFramework.assert(stats.physical_moves > 0, "Should have physical moves indexed")
        TestFramework.assert(stats.special_moves > 0, "Should have special moves indexed")
        TestFramework.assert(stats.status_moves > 0, "Should have status moves indexed")
        
        print("Index stats: " .. TestFramework.tableToString(stats))
    end)
    
    -- Test TypeScript parity for key moves
    testSuite:addTest("TypeScript Parity Validation", function()
        MoveDatabase.init()
        
        -- Test POUND (should match TypeScript exactly)
        local pound = MoveDatabase.getMoveData(1)
        TestFramework.assert(pound.power == 40, "POUND power should match TypeScript (40)")
        TestFramework.assert(pound.accuracy == 100, "POUND accuracy should match TypeScript (100)")
        TestFramework.assert(pound.pp == 35, "POUND PP should match TypeScript (35)")
        TestFramework.assert(pound.type == 0, "POUND type should match TypeScript (Normal)")
        TestFramework.assert(pound.category == 0, "POUND category should match TypeScript (Physical)")
        
        -- Test FIRE_PUNCH (should match TypeScript exactly)
        local firePunch = MoveDatabase.getMoveData(7)
        TestFramework.assert(firePunch.power == 75, "FIRE_PUNCH power should match TypeScript (75)")
        TestFramework.assert(firePunch.accuracy == 100, "FIRE_PUNCH accuracy should match TypeScript (100)")
        TestFramework.assert(firePunch.pp == 15, "FIRE_PUNCH PP should match TypeScript (15)")
        TestFramework.assert(firePunch.type == 9, "FIRE_PUNCH type should match TypeScript (Fire)")
        
        -- Test SWORDS_DANCE (should match TypeScript exactly)
        local swordsDance = MoveDatabase.getMoveData(14)
        TestFramework.assert(swordsDance.category == 2, "SWORDS_DANCE should be Status category")
        TestFramework.assert(swordsDance.power == 0, "SWORDS_DANCE should have 0 power")
        TestFramework.assert(swordsDance.pp == 20, "SWORDS_DANCE should have 20 PP")
        TestFramework.assert(swordsDance.effects.stat_change ~= nil, "SWORDS_DANCE should have stat change effect")
    end)
    
    return testSuite
end

-- Run the test suite
function MoveDbTests.runTests()
    print("=== Move Database Tests ===")
    local testSuite = MoveDbTests.runAllTests()
    local results = testSuite:run()
    
    print("\n=== Test Results ===")
    print("Total tests: " .. results.total)
    print("Passed: " .. results.passed)
    print("Failed: " .. results.failed)
    
    if results.failed > 0 then
        print("\nFailed tests:")
        for _, failure in ipairs(results.failures) do
            print("- " .. failure.testName .. ": " .. failure.error)
        end
    end
    
    return results.failed == 0
end

return MoveDbTests