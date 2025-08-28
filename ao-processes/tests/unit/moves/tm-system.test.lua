-- Unit Tests for TM/TR System
-- Tests TM/TR database, compatibility checking, and usage mechanics
-- Validates inventory integration and move learning workflow

local TMDatabase = require("data.moves.tm-database")
local MoveManager = require("game-logic.pokemon.move-manager")
local SpeciesDatabase = require("data.species.species-database")

-- Test helper functions
local function assertEqual(actual, expected, message)
    if actual ~= expected then
        error(string.format("Test failed: %s. Expected %s, got %s", message, expected, actual))
    end
end

local function assertTableEqual(actual, expected, message)
    if #actual ~= #expected then
        error(string.format("Test failed: %s. Expected %d items, got %d", message, #expected, #actual))
    end
    
    for i, v in ipairs(expected) do
        if actual[i] ~= v then
            error(string.format("Test failed: %s. Expected %s at index %d, got %s", message, v, i, actual[i]))
        end
    end
end

local function assertTrue(condition, message)
    if not condition then
        error("Test failed: " .. message)
    end
end

local function assertFalse(condition, message)
    if condition then
        error("Test failed: " .. message)
    end
end

-- Test Suite
local Tests = {}

-- Test 1: TM Database Initialization
function Tests.testTMDatabaseInit()
    TMDatabase.init()
    
    -- Check that TMs exist
    local allTMs = TMDatabase.getAllTMs()
    assertTrue(type(allTMs) == "table", "TMs should be a table")
    
    local tmCount = 0
    for _ in pairs(allTMs) do
        tmCount = tmCount + 1
    end
    assertTrue(tmCount > 0, "Should have TMs in database")
    
    -- Check that TRs exist
    local allTRs = TMDatabase.getAllTRs()
    assertTrue(type(allTRs) == "table", "TRs should be a table")
    
    local trCount = 0
    for _ in pairs(allTRs) do
        trCount = trCount + 1
    end
    assertTrue(trCount > 0, "Should have TRs in database")
    
    print("✓ TM Database initialization test passed")
end

-- Test 2: TM Data Validation
function Tests.testTMDataValidation()
    TMDatabase.init()
    
    -- Test specific TM
    local tm1 = TMDatabase.getTM(1)
    assertTrue(tm1 ~= nil, "TM01 should exist")
    assertTrue(tm1.id == 1, "TM01 should have correct ID")
    assertTrue(type(tm1.moveId) == "number", "TM01 should have valid move ID")
    assertTrue(type(tm1.name) == "string", "TM01 should have name")
    assertTrue(tm1.reusable == true, "TM should be reusable")
    assertTrue(tm1.type == "tm", "TM should have correct type")
    
    -- Test database validation
    local isValid, errors = TMDatabase.validateDatabase()
    assertTrue(isValid, "Database should be valid: " .. (errors and table.concat(errors, ", ") or ""))
    
    print("✓ TM data validation test passed")
end

-- Test 3: TR Data Validation  
function Tests.testTRDataValidation()
    TMDatabase.init()
    
    -- Test specific TR
    local tr1 = TMDatabase.getTR(1)
    assertTrue(tr1 ~= nil, "TR01 should exist")
    assertTrue(tr1.id == 1, "TR01 should have correct ID")
    assertTrue(type(tr1.moveId) == "number", "TR01 should have valid move ID")
    assertTrue(type(tr1.name) == "string", "TR01 should have name")
    assertTrue(tr1.reusable == false, "TR should not be reusable")
    assertTrue(tr1.type == "tr", "TR should have correct type")
    
    print("✓ TR data validation test passed")
end

-- Test 4: Move to Machine Mapping
function Tests.testMoveToMachineMapping()
    TMDatabase.init()
    
    -- Test getting TMs for a move (using Focus Punch - should be TM01)
    local tm1 = TMDatabase.getTM(1)
    if tm1 then
        local tmsForMove = TMDatabase.getTMsForMove(tm1.moveId)
        assertTrue(#tmsForMove > 0, "Should find TMs for the move")
        
        local foundTM1 = false
        for _, tmNum in ipairs(tmsForMove) do
            if tmNum == 1 then
                foundTM1 = true
                break
            end
        end
        assertTrue(foundTM1, "Should find TM01 in the list")
    end
    
    -- Test getting TRs for a move
    local tr1 = TMDatabase.getTR(1)
    if tr1 then
        local trsForMove = TMDatabase.getTRsForMove(tr1.moveId)
        assertTrue(#trsForMove > 0, "Should find TRs for the move")
    end
    
    print("✓ Move to machine mapping test passed")
end

-- Test 5: TM Compatibility and Usage
function Tests.testTMCompatibilityAndUsage()
    TMDatabase.init()
    SpeciesDatabase.init()
    
    -- Create test Pokemon (Bulbasaur)
    local testPokemon = {
        speciesId = 1,
        name = "Bulbasaur",
        level = 10,
        moveset = {}
    }
    
    -- Create test inventory with TM01
    local testInventory = {
        tms = {[1] = 1}, -- One TM01
        trs = {}
    }
    
    -- Test compatibility checking
    local canLearn, reason = MoveManager.canLearnFromMachine(testPokemon, 1, "tm")
    assertTrue(type(canLearn) == "boolean", "Compatibility check should return boolean")
    
    -- Test TM usage if compatible
    local tm1 = TMDatabase.getTM(1)
    if tm1 and SpeciesDatabase.isTMCompatible(1, tm1.moveId) then
        local updatedPokemon, updatedInventory, result = MoveManager.learnFromTM(testPokemon, 1, testInventory)
        
        assertTrue(type(result) == "table", "Learn result should be table")
        assertTrue(type(result.success) == "boolean", "Result should have success field")
        
        if result.success then
            assertTrue(updatedInventory.tms[1] == 1, "TM should still be in inventory (reusable)")
            assertTrue(result.tmUsed == 1, "Result should indicate TM used")
        end
    end
    
    print("✓ TM compatibility and usage test passed")
end

-- Test 6: TR Compatibility and Usage
function Tests.testTRCompatibilityAndUsage()
    TMDatabase.init()
    SpeciesDatabase.init()
    
    -- Create test Pokemon (Charizard with TR moves)
    local testPokemon = {
        speciesId = 6,
        name = "Charizard", 
        level = 50,
        moveset = {}
    }
    
    -- Find a TR that Charizard can learn
    local charizardData = SpeciesDatabase.getSpecies(6)
    local testTRNumber = nil
    
    if charizardData and charizardData.trMoves and #charizardData.trMoves > 0 then
        local moveId = charizardData.trMoves[1]
        local trsForMove = TMDatabase.getTRsForMove(moveId)
        if #trsForMove > 0 then
            testTRNumber = trsForMove[1]
        end
    end
    
    if testTRNumber then
        -- Create inventory with the TR
        local testInventory = {
            tms = {},
            trs = {[testTRNumber] = 2} -- Two of the TR
        }
        
        -- Test TR usage
        local updatedPokemon, updatedInventory, result = MoveManager.learnFromTR(testPokemon, testTRNumber, testInventory)
        
        assertTrue(type(result) == "table", "Learn result should be table")
        
        if result.success then
            assertTrue(updatedInventory.trs[testTRNumber] == 1, "TR count should decrease by 1")
            assertTrue(result.trConsumed == true, "TR should be consumed")
            assertTrue(result.trUsed == testTRNumber, "Result should indicate TR used")
        end
    end
    
    print("✓ TR compatibility and usage test passed")
end

-- Test 7: Learnable Machines Query
function Tests.testLearnableMachinesQuery()
    TMDatabase.init()
    SpeciesDatabase.init()
    
    -- Create test Pokemon
    local testPokemon = {
        speciesId = 1, -- Bulbasaur
        name = "Bulbasaur",
        level = 10
    }
    
    -- Get learnable machines
    local learnableMachines = MoveManager.getLearnableMachines(testPokemon, "both")
    
    assertTrue(type(learnableMachines) == "table", "Learnable machines should be table")
    assertTrue(type(learnableMachines.tm) == "table", "TM list should be table")
    assertTrue(type(learnableMachines.tr) == "table", "TR list should be table")
    
    -- Test TM-only query
    local tmOnly = MoveManager.getLearnableMachines(testPokemon, "tm")
    assertTrue(type(tmOnly.tm) == "table", "TM-only query should return TM table")
    assertTrue(#tmOnly.tr == 0, "TM-only query should have empty TR table")
    
    -- Test TR-only query  
    local trOnly = MoveManager.getLearnableMachines(testPokemon, "tr")
    assertTrue(type(trOnly.tr) == "table", "TR-only query should return TR table")
    assertTrue(#trOnly.tm == 0, "TR-only query should have empty TM table")
    
    print("✓ Learnable machines query test passed")
end

-- Test 8: Inventory Validation
function Tests.testInventoryValidation()
    -- Test valid inventory
    local validInventory = {
        tms = {[1] = 1, [22] = 3},
        trs = {[1] = 2, [5] = 1}
    }
    
    local isValid, errors = MoveManager.validateTMTRInventory(validInventory)
    assertTrue(isValid, "Valid inventory should pass validation: " .. (errors and table.concat(errors, ", ") or ""))
    
    -- Test invalid inventory - negative count
    local invalidInventory = {
        tms = {[1] = -1},
        trs = {}
    }
    
    isValid, errors = MoveManager.validateTMTRInventory(invalidInventory)
    assertFalse(isValid, "Invalid inventory should fail validation")
    assertTrue(#errors > 0, "Should have error messages")
    
    print("✓ Inventory validation test passed")
end

-- Test 9: Error Handling
function Tests.testErrorHandling()
    TMDatabase.init()
    
    -- Test invalid TM number
    local invalidTM = TMDatabase.getTM(999)
    assertTrue(invalidTM == nil, "Invalid TM should return nil")
    
    -- Test invalid TR number
    local invalidTR = TMDatabase.getTR(999)
    assertTrue(invalidTR == nil, "Invalid TR should return nil")
    
    -- Test learning with no inventory
    local testPokemon = {speciesId = 1, name = "Bulbasaur", level = 10}
    local _, _, result = MoveManager.learnFromTM(testPokemon, 1, nil)
    
    assertFalse(result.success, "Learning without inventory should fail")
    assertEqual(result.reason, "tm_not_in_inventory", "Should have correct error reason")
    
    -- Test learning non-existent TM
    local emptyInventory = {tms = {}, trs = {}}
    _, _, result = MoveManager.learnFromTM(testPokemon, 999, emptyInventory)
    
    assertFalse(result.success, "Learning non-existent TM should fail")
    assertEqual(result.reason, "tm_not_found", "Should have correct error reason")
    
    print("✓ Error handling test passed")
end

-- Test 10: Database Statistics
function Tests.testDatabaseStatistics()
    TMDatabase.init()
    
    local stats = TMDatabase.getDatabaseStats()
    
    assertTrue(type(stats) == "table", "Stats should be table")
    assertTrue(stats.totalTMs >= 0, "Total TMs should be non-negative")
    assertTrue(stats.totalTRs >= 0, "Total TRs should be non-negative")
    assertTrue(stats.obtainableTMs >= 0, "Obtainable TMs should be non-negative")
    assertTrue(stats.obtainableTRs >= 0, "Obtainable TRs should be non-negative")
    assertTrue(stats.uniqueMovesInTMs >= 0, "Unique TM moves should be non-negative")
    assertTrue(stats.uniqueMovesInTRs >= 0, "Unique TR moves should be non-negative")
    
    print("✓ Database statistics test passed")
end

-- Test 11: Edge Cases
function Tests.testEdgeCases()
    TMDatabase.init()
    
    -- Test with nil parameters
    local result = MoveManager.canLearnFromMachine(nil, 1, "tm")
    assertFalse(result, "Nil Pokemon should return false")
    
    result = MoveManager.canLearnFromMachine({speciesId = 1}, nil, "tm")
    assertFalse(result, "Nil machine number should return false")
    
    result = MoveManager.canLearnFromMachine({speciesId = 1}, 1, nil)
    assertFalse(result, "Nil machine type should return false")
    
    -- Test empty inventory
    local emptyPokemon = {speciesId = 1, name = "Test", level = 1}
    local emptyInventory = {tms = {}, trs = {}}
    
    local machines = MoveManager.getLearnableMachines(emptyPokemon, "both")
    assertTrue(type(machines) == "table", "Should return table for empty Pokemon")
    
    -- Test invalid machine type
    result = MoveManager.canLearnFromMachine({speciesId = 1}, 1, "invalid")
    assertFalse(result, "Invalid machine type should return false")
    
    print("✓ Edge cases test passed")
end

-- Run All Tests
function Tests.runAllTests()
    print("Running TM/TR System Tests...")
    print("=============================")
    
    Tests.testTMDatabaseInit()
    Tests.testTMDataValidation()
    Tests.testTRDataValidation()
    Tests.testMoveToMachineMapping()
    Tests.testTMCompatibilityAndUsage()
    Tests.testTRCompatibilityAndUsage()
    Tests.testLearnableMachinesQuery()
    Tests.testInventoryValidation()
    Tests.testErrorHandling()
    Tests.testDatabaseStatistics()
    Tests.testEdgeCases()
    
    print("=============================")
    print("✅ All TM/TR System Tests Passed!")
    return true
end

-- Run tests if this file is executed directly
if arg and arg[0] and arg[0]:match("tm%-system%.test%.lua$") then
    Tests.runAllTests()
end

-- Export test functions
return Tests