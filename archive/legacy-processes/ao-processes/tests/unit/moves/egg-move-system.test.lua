-- Unit Tests for Egg Move System
-- Validates egg move inheritance, breeding validation, and species compatibility

package.path = "../../../?.lua;../../../?/init.lua;" .. package.path

local EggMoves = require("data.moves.egg-moves")
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

print("=== EGG MOVE SYSTEM TESTS ===\n")

-- Test 1: EggMoves Database Loading and Structure
runTest("EggMoves database loads correctly", function()
    assert(EggMoves ~= nil, "EggMoves module should load")
    assert(type(EggMoves.database) == "table", "database should be a table")
    assert(type(EggMoves.parentCompatibility) == "table", "parentCompatibility should be a table")
    assert(type(EggMoves.breedingRequirements) == "table", "breedingRequirements should be a table")
    return true
end)

-- Test 2: Get Egg Moves for Species
runTest("Get egg moves for valid species", function()
    local bulbasaurEggMoves = EggMoves.getEggMovesForSpecies(1) -- Bulbasaur
    assert(type(bulbasaurEggMoves) == "table", "Should return table for valid species")
    assert(#bulbasaurEggMoves > 0, "Bulbasaur should have egg moves")
    
    local charmanderEggMoves = EggMoves.getEggMovesForSpecies(4) -- Charmander
    assert(type(charmanderEggMoves) == "table", "Should return table for Charmander")
    assert(#charmanderEggMoves > 0, "Charmander should have egg moves")
    
    return true
end)

-- Test 3: Get Egg Moves for Invalid Species
runTest("Get egg moves for invalid species", function()
    local noEggMoves = EggMoves.getEggMovesForSpecies(999) -- Non-existent species
    assert(type(noEggMoves) == "table", "Should return empty table for invalid species")
    assert(#noEggMoves == 0, "Should return empty table for non-existent species")
    
    local nilResult = EggMoves.getEggMovesForSpecies(nil)
    assert(type(nilResult) == "table", "Should handle nil input")
    assert(#nilResult == 0, "Should return empty table for nil input")
    
    return true
end)

-- Test 4: Validate Egg Move Inheritance - Valid Case
runTest("Validate valid egg move inheritance", function()
    -- Bulbasaur inheriting Vine Whip from Bulbasaur parents
    local isValid, message = EggMoves.validateEggMoveInheritance(1, 1, 22) -- Mother, Father, Move ID
    assert(isValid == true, "Should validate successful inheritance: " .. (message or ""))
    assert(type(message) == "string", "Should return message")
    
    return true
end)

-- Test 5: Validate Egg Move Inheritance - Invalid Move
runTest("Validate invalid egg move inheritance", function()
    -- Try to inherit a move that's not an egg move for the species
    local isValid, message = EggMoves.validateEggMoveInheritance(1, 1, 999) -- Invalid move ID
    assert(isValid == false, "Should reject invalid move inheritance")
    assert(type(message) == "string", "Should return error message")
    assert(string.find(message, "not a valid egg move"), "Should specify it's not a valid egg move")
    
    return true
end)

-- Test 6: Validate Egg Move Inheritance - Missing Parameters
runTest("Validate inheritance with missing parameters", function()
    local isValid, message = EggMoves.validateEggMoveInheritance(nil, 1, 22)
    assert(isValid == false, "Should reject nil mother species")
    
    isValid, message = EggMoves.validateEggMoveInheritance(1, nil, 22)
    assert(isValid == false, "Should reject nil father species")
    
    isValid, message = EggMoves.validateEggMoveInheritance(1, 1, nil)
    assert(isValid == false, "Should reject nil move ID")
    
    return true
end)

-- Test 7: Get Compatible Parents
runTest("Get compatible parents for species", function()
    local bulbasaurParents = EggMoves.getCompatibleParentsForSpecies(1)
    assert(type(bulbasaurParents) == "table", "Should return table")
    
    local eeveeParents = EggMoves.getCompatibleParentsForSpecies(133)
    assert(type(eeveeParents) == "table", "Should return table for Eevee")
    
    local noParents = EggMoves.getCompatibleParentsForSpecies(999)
    assert(type(noParents) == "table", "Should return empty table for invalid species")
    assert(#noParents == 0, "Should be empty for non-existent species")
    
    return true
end)

-- Test 8: Process Egg Move Inheritance
runTest("Process egg move inheritance", function()
    -- Mock parent Pokemon with moves
    local motherPokemon = {
        speciesId = 1, -- Bulbasaur
        moves = {
            { moveId = 22 }, -- Vine Whip (egg move)
            { moveId = 73 }  -- Leech Seed (egg move)
        }
    }
    
    local fatherPokemon = {
        speciesId = 1, -- Bulbasaur
        moves = {
            { moveId = 230 } -- Sweet Scent (egg move)
        }
    }
    
    local inheritedMoves = EggMoves.processEggMoveInheritance(1, 1, motherPokemon.moves, fatherPokemon.moves)
    assert(type(inheritedMoves) == "table", "Should return table")
    
    -- Should inherit moves that parents know
    local foundVineWhip = false
    local foundLeechSeed = false
    for _, move in ipairs(inheritedMoves) do
        if move.moveId == 22 then foundVineWhip = true end
        if move.moveId == 73 then foundLeechSeed = true end
    end
    assert(foundVineWhip, "Should inherit Vine Whip from mother")
    assert(foundLeechSeed, "Should inherit Leech Seed from mother")
    
    return true
end)

-- Test 9: MoveManager Integration - Get Egg Moves
runTest("MoveManager integration - get egg moves", function()
    local eggMoves = MoveManager.getEggMovesForSpecies(4) -- Charmander
    assert(type(eggMoves) == "table", "Should return table through MoveManager")
    
    local pikachuMoves = MoveManager.getEggMovesForSpecies(25) -- Pikachu  
    assert(type(pikachuMoves) == "table", "Should return table for Pikachu")
    
    return true
end)

-- Test 10: MoveManager Integration - Validate Inheritance
runTest("MoveManager integration - validate inheritance", function()
    local isValid, message = MoveManager.validateEggMoveInheritance(4, 4, 99) -- Charmander, Rage
    assert(type(isValid) == "boolean", "Should return boolean")
    assert(type(message) == "string", "Should return message")
    
    return true
end)

-- Test 11: MoveManager Integration - Breeding Compatibility  
runTest("MoveManager integration - breeding compatibility", function()
    local compatibility = MoveManager.getEggMoveCompatibility(133) -- Eevee
    assert(type(compatibility) == "table", "Should return compatibility table")
    assert(compatibility.eggMoves ~= nil, "Should include egg moves")
    assert(compatibility.compatibleParents ~= nil, "Should include compatible parents")
    
    return true
end)

-- Test 12: Database Statistics
runTest("Database statistics", function()
    local stats = EggMoves.getStatistics()
    assert(type(stats) == "table", "Should return statistics table")
    assert(type(stats.totalSpecies) == "number", "Should include total species count")
    assert(type(stats.speciesWithEggMoves) == "number", "Should include species with egg moves count")
    assert(type(stats.totalEggMoves) == "number", "Should include total egg moves count")
    assert(stats.totalSpecies > 0, "Should have species in database")
    
    return true
end)

-- Test 13: Database Validation
runTest("Database validation", function()
    local isValid, errors = EggMoves.validateDatabase()
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
print("\n=== EGG MOVE SYSTEM TEST RESULTS ===")
print("Tests passed: " .. passCount .. "/" .. testCount)

if passCount == testCount then
    print("🎉 All egg move system tests passed!")
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