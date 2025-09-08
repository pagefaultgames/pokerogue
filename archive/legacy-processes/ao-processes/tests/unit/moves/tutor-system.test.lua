-- Unit Tests for Move Tutor System
-- Validates tutor availability, cost management, and species compatibility

package.path = "../../../?.lua;../../../?/init.lua;" .. package.path

local TutorMoves = require("data.moves.tutor-moves")
local MoveManager = require("game-logic.pokemon.move-manager")

-- Test results tracking
local tests = {}
local testCount = 0
local passCount = 0

-- Helper function to run a test
local function runTest(testName, testFunc)
    testCount = testCount + 1
    local success, result = pcall(testFunc)
    
    if success and result then
        passCount = passCount + 1
        print("✅ " .. testName)
        tests[testName] = "PASS"
    else
        print("❌ " .. testName .. " - " .. (result or "Failed"))
        tests[testName] = "FAIL: " .. (result or "Unknown error")
    end
end

print("=== MOVE TUTOR SYSTEM TESTS ===\n")

-- Test 1: TutorMoves Database Loading and Structure
runTest("TutorMoves database loads correctly", function()
    assert(TutorMoves ~= nil, "TutorMoves module should load")
    assert(type(TutorMoves.tutors) == "table", "tutors should be a table")
    assert(type(TutorMoves.compatibility) == "table", "compatibility should be a table")
    assert(type(TutorMoves.requirements) == "table", "requirements should be a table")
    return true
end)

-- Test 2: Get Available Tutor Moves for Species
runTest("Get available tutor moves for valid species", function()
    local charmanderMoves = TutorMoves.getAvailableMovesForSpecies(4) -- Charmander
    assert(type(charmanderMoves) == "table", "Should return table for valid species")
    
    local battleFrontierMoves = TutorMoves.getAvailableMovesForSpecies(4, "BATTLE_FRONTIER")
    assert(type(battleFrontierMoves) == "table", "Should return table for specific tutor")
    
    return true
end)

-- Test 3: Get Available Moves for Invalid Species
runTest("Get available moves for invalid species", function()
    local noMoves = TutorMoves.getAvailableMovesForSpecies(999) -- Non-existent species
    assert(type(noMoves) == "table", "Should return empty table for invalid species")
    assert(#noMoves == 0, "Should return empty table for non-existent species")
    
    local nilResult = TutorMoves.getAvailableMovesForSpecies(nil)
    assert(type(nilResult) == "table", "Should handle nil input")
    assert(#nilResult == 0, "Should return empty table for nil input")
    
    return true
end)

-- Test 4: Validate Species Can Learn from Tutor - Valid Case
runTest("Validate species can learn from tutor - valid case", function()
    -- Charmander learning Fire Punch from Battle Frontier tutor
    local canLearn, message = TutorMoves.canLearnFromTutor(4, "BATTLE_FRONTIER", 7)
    assert(canLearn == true, "Should allow valid tutor learning: " .. (message or ""))
    assert(type(message) == "string", "Should return message")
    
    return true
end)

-- Test 5: Validate Species Can Learn from Tutor - Invalid Cases
runTest("Validate species can learn from tutor - invalid cases", function()
    -- Non-existent tutor
    local canLearn, message = TutorMoves.canLearnFromTutor(4, "INVALID_TUTOR", 7)
    assert(canLearn == false, "Should reject invalid tutor")
    assert(string.find(message, "does not exist"), "Should specify tutor doesn't exist")
    
    -- Species that can't learn from tutor
    local canLearn2, message2 = TutorMoves.canLearnFromTutor(999, "BATTLE_FRONTIER", 7)
    assert(canLearn2 == false, "Should reject invalid species")
    
    -- Move not available from tutor for species
    local canLearn3, message3 = TutorMoves.canLearnFromTutor(4, "BATTLE_FRONTIER", 999)
    assert(canLearn3 == false, "Should reject unavailable move")
    
    return true
end)

-- Test 6: Get Move Cost from Tutor
runTest("Get move cost from tutor", function()
    -- Fire Punch from Battle Frontier should cost 16 BP
    local cost = TutorMoves.getMoveCost("BATTLE_FRONTIER", 7)
    assert(cost == 16, "Fire Punch should cost 16 BP, got " .. cost)
    
    -- Swift from Game Corner should cost 4000 coins
    local cost2 = TutorMoves.getMoveCost("GAME_CORNER", 129)
    assert(cost2 == 4000, "Swift should cost 4000 coins, got " .. cost2)
    
    -- Invalid combinations should return 0
    local cost3 = TutorMoves.getMoveCost("INVALID_TUTOR", 7)
    assert(cost3 == 0, "Invalid tutor should return 0 cost")
    
    local cost4 = TutorMoves.getMoveCost("BATTLE_FRONTIER", 999)
    assert(cost4 == 0, "Invalid move should return 0 cost")
    
    return true
end)

-- Test 7: Validate Player Resources - Sufficient Resources
runTest("Validate player resources - sufficient", function()
    local playerResources = {
        battle_points = 100,
        coins = 5000,
        champion_tokens = 10
    }
    
    -- Should have enough BP for Fire Punch (costs 16)
    local canAfford, message = TutorMoves.validatePlayerResources("BATTLE_FRONTIER", 7, playerResources)
    assert(canAfford == true, "Should afford Fire Punch: " .. (message or ""))
    
    -- Should have enough coins for Swift (costs 4000)
    local canAfford2, message2 = TutorMoves.validatePlayerResources("GAME_CORNER", 129, playerResources)
    assert(canAfford2 == true, "Should afford Swift: " .. (message2 or ""))
    
    return true
end)

-- Test 8: Validate Player Resources - Insufficient Resources
runTest("Validate player resources - insufficient", function()
    local playerResources = {
        battle_points = 10,  -- Not enough for Fire Punch (16)
        coins = 1000,        -- Not enough for Swift (4000)
        champion_tokens = 1  -- Not enough for Explosion (5)
    }
    
    -- Should not have enough BP for Fire Punch
    local canAfford, message = TutorMoves.validatePlayerResources("BATTLE_FRONTIER", 7, playerResources)
    assert(canAfford == false, "Should not afford Fire Punch")
    assert(string.find(message, "Insufficient"), "Should mention insufficient resources")
    
    -- Should not have enough coins for Swift
    local canAfford2, message2 = TutorMoves.validatePlayerResources("GAME_CORNER", 129, playerResources)
    assert(canAfford2 == false, "Should not afford Swift")
    
    return true
end)

-- Test 9: Process Tutor Learning Transaction
runTest("Process tutor learning transaction", function()
    local playerResources = {
        battle_points = 100,
        coins = 5000
    }
    
    -- Learn Fire Punch (costs 16 BP)
    local success, updatedResources, message = TutorMoves.processTutorLearning("BATTLE_FRONTIER", 7, playerResources)
    assert(success == true, "Transaction should succeed: " .. (message or ""))
    assert(updatedResources.battle_points == 84, "Should deduct 16 BP, got " .. updatedResources.battle_points)
    assert(updatedResources.coins == 5000, "Coins should remain unchanged")
    
    return true
end)

-- Test 10: Get All Tutors
runTest("Get all tutors", function()
    local tutors = TutorMoves.getAllTutors()
    assert(type(tutors) == "table", "Should return table of tutors")
    assert(#tutors >= 3, "Should have at least 3 tutors")
    
    -- Check structure of first tutor
    local firstTutor = tutors[1]
    assert(type(firstTutor.id) == "string", "Tutor should have ID")
    assert(type(firstTutor.name) == "string", "Tutor should have name")
    assert(type(firstTutor.location) == "string", "Tutor should have location")
    assert(type(firstTutor.currency) == "string", "Tutor should have currency")
    
    return true
end)

-- Test 11: MoveManager Integration - Get Available Tutor Moves
runTest("MoveManager integration - get available tutor moves", function()
    local tutorMoves = MoveManager.getAvailableTutorMoves(4) -- Charmander
    assert(type(tutorMoves) == "table", "Should return table through MoveManager")
    
    local battleFrontierMoves = MoveManager.getAvailableTutorMoves(4, "BATTLE_FRONTIER")
    assert(type(battleFrontierMoves) == "table", "Should return table for specific tutor")
    
    return true
end)

-- Test 12: MoveManager Integration - Validate Tutor Learning
runTest("MoveManager integration - validate tutor learning", function()
    -- Mock Pokemon
    local mockPokemon = {
        speciesId = 4, -- Charmander
        level = 30,
        moves = {
            { moveId = 1, slot = 1 },
            { moveId = 2, slot = 2 }
        }
    }
    
    local playerResources = {
        battle_points = 100
    }
    
    local canLearn, message = MoveManager.validateTutorLearning(mockPokemon, "BATTLE_FRONTIER", 7, playerResources)
    assert(type(canLearn) == "boolean", "Should return boolean")
    assert(type(message) == "string", "Should return message")
    
    return true
end)

-- Test 13: MoveManager Integration - Get All Tutors
runTest("MoveManager integration - get all tutors", function()
    local tutors = MoveManager.getAllTutors()
    assert(type(tutors) == "table", "Should return tutors table")
    assert(#tutors >= 3, "Should have multiple tutors")
    
    return true
end)

-- Test 14: MoveManager Integration - Get Tutor Move Cost
runTest("MoveManager integration - get tutor move cost", function()
    local cost = MoveManager.getTutorMoveCost("BATTLE_FRONTIER", 7) -- Fire Punch
    assert(cost == 16, "Should return correct cost through MoveManager")
    
    local invalidCost = MoveManager.getTutorMoveCost("INVALID", 999)
    assert(invalidCost == 0, "Should return 0 for invalid combinations")
    
    return true
end)

-- Test 15: Database Statistics
runTest("Database statistics", function()
    local stats = TutorMoves.getStatistics()
    assert(type(stats) == "table", "Should return statistics table")
    assert(type(stats.totalTutors) == "number", "Should include total tutors count")
    assert(type(stats.totalTutorMoves) == "number", "Should include total moves count")
    assert(type(stats.totalCompatibleSpecies) == "number", "Should include compatible species count")
    assert(stats.totalTutors > 0, "Should have tutors in database")
    
    return true
end)

-- Test 16: Database Validation
runTest("Database validation", function()
    local isValid, errors = TutorMoves.validateDatabase()
    if not isValid then
        print("Database validation errors:")
        for _, error in ipairs(errors) do
            print("  - " .. error)
        end
    end
    assert(isValid == true, "Database should validate successfully")
    assert(type(errors) == "table", "Should return errors table")
    
    return true
end)

-- Print test results
print("\n=== MOVE TUTOR SYSTEM TEST RESULTS ===")
print("Tests passed: " .. passCount .. "/" .. testCount)

if passCount == testCount then
    print("🎉 All move tutor system tests passed!")
else
    print("⚠️  Some tests failed:")
    for testName, result in pairs(tests) do
        if string.find(result, "FAIL") then
            print("  - " .. testName .. ": " .. result)
        end
    end
end

-- Return results for external test runners
return {
    passed = passCount,
    total = testCount,
    success = passCount == testCount,
    results = tests
}