--[[
IV System Unit Tests
Tests for IV generation, validation, shiny determination, and stat calculations

Testing coverage:
- IV generation and validation (0-31 range)
- Shiny determination from IV values
- Hidden Power type calculation
- IV inheritance for breeding
- Edge cases and error handling
--]]

-- Set up proper module paths
package.path = package.path .. ";../../../?.lua;../../../data/?.lua;../../../data/constants/?.lua;../../../game-logic/pokemon/?.lua"

local StatCalculator = require("game-logic.pokemon.stat-calculator")

-- Test framework setup
local Tests = {}
Tests.passed = 0
Tests.failed = 0
Tests.results = {}

function Tests.assert(condition, message, testName)
    if condition then
        Tests.passed = Tests.passed + 1
        table.insert(Tests.results, "✓ " .. testName .. ": " .. message)
    else
        Tests.failed = Tests.failed + 1
        table.insert(Tests.results, "✗ " .. testName .. ": " .. message)
    end
end

function Tests.assertEqual(expected, actual, message, testName)
    local condition = (expected == actual)
    local fullMessage = message .. " (expected: " .. tostring(expected) .. ", actual: " .. tostring(actual) .. ")"
    Tests.assert(condition, fullMessage, testName)
end

function Tests.assertNil(value, message, testName)
    Tests.assert(value == nil, message .. " (got: " .. tostring(value) .. ")", testName)
end

function Tests.assertNotNil(value, message, testName)
    Tests.assert(value ~= nil, message, testName)
end

-- Test Suite 1: IV Generation and Validation

function Tests.testIVGeneration()
    print("Testing IV Generation...")
    
    -- Test random IV generation multiple times
    for i = 1, 20 do
        local ivs = StatCalculator.generateRandomIVs()
        Tests.assertNotNil(ivs, "Generated IVs should not be nil", "IVsNotNil" .. i)
        
        -- Check all required stats exist
        local requiredStats = {"hp", "attack", "defense", "spAttack", "spDefense", "speed"}
        for _, stat in ipairs(requiredStats) do
            Tests.assertNotNil(ivs[stat], "IV for " .. stat .. " should exist", "IV" .. stat .. "Exists" .. i)
            Tests.assert(type(ivs[stat]) == "number", stat .. " IV should be a number", "IV" .. stat .. "Number" .. i)
            Tests.assert(ivs[stat] >= 0 and ivs[stat] <= 31, stat .. " IV should be 0-31", "IV" .. stat .. "Range" .. i)
            Tests.assert(ivs[stat] == math.floor(ivs[stat]), stat .. " IV should be integer", "IV" .. stat .. "Integer" .. i)
        end
    end
    
    -- Test that multiple generations produce different results (randomness check)
    local iv1 = StatCalculator.generateRandomIVs()
    local iv2 = StatCalculator.generateRandomIVs()
    local iv3 = StatCalculator.generateRandomIVs()
    
    local allSame = true
    local stats = {"hp", "attack", "defense", "spAttack", "spDefense", "speed"}
    for _, stat in ipairs(stats) do
        if iv1[stat] ~= iv2[stat] or iv2[stat] ~= iv3[stat] then
            allSame = false
            break
        end
    end
    
    Tests.assert(not allSame, "Multiple IV generations should produce different results", "IVRandomness")
end

function Tests.testIVValidation()
    print("Testing IV Validation...")
    
    -- Test valid IVs
    local validIVs = {
        hp = 31, attack = 0, defense = 15, 
        spAttack = 31, spDefense = 20, speed = 10
    }
    local valid, error = StatCalculator.validateIVs(validIVs)
    Tests.assert(valid, "Valid IVs should pass validation", "ValidIVsPass")
    Tests.assertNil(error, "Valid IVs should not return error", "ValidIVsNoError")
    
    -- Test edge case IVs (min/max)
    local edgeCaseIVs = {
        hp = 0, attack = 31, defense = 0, 
        spAttack = 31, spDefense = 0, speed = 31
    }
    local edgeValid, edgeError = StatCalculator.validateIVs(edgeCaseIVs)
    Tests.assert(edgeValid, "Edge case IVs should pass validation", "EdgeCaseIVsPass")
    Tests.assertNil(edgeError, "Edge case IVs should not return error", "EdgeCaseIVsNoError")
    
    -- Test perfect IVs
    local perfectIVs = {
        hp = 31, attack = 31, defense = 31, 
        spAttack = 31, spDefense = 31, speed = 31
    }
    local perfectValid, perfectError = StatCalculator.validateIVs(perfectIVs)
    Tests.assert(perfectValid, "Perfect IVs should pass validation", "PerfectIVsPass")
    Tests.assertNil(perfectError, "Perfect IVs should not return error", "PerfectIVsNoError")
    
    -- Test zero IVs
    local zeroIVs = {
        hp = 0, attack = 0, defense = 0, 
        spAttack = 0, spDefense = 0, speed = 0
    }
    local zeroValid, zeroError = StatCalculator.validateIVs(zeroIVs)
    Tests.assert(zeroValid, "Zero IVs should pass validation", "ZeroIVsPass")
    Tests.assertNil(zeroError, "Zero IVs should not return error", "ZeroIVsNoError")
end

function Tests.testIVValidationErrors()
    print("Testing IV Validation Error Cases...")
    
    -- Test invalid types
    local invalidTypeValid, invalidTypeError = StatCalculator.validateIVs("not a table")
    Tests.assert(not invalidTypeValid, "Non-table should fail validation", "NonTableFails")
    Tests.assertNotNil(invalidTypeError, "Non-table should return error", "NonTableError")
    
    -- Test missing stat
    local missingStatIVs = {
        hp = 15, attack = 20, defense = 10, 
        spAttack = 25  -- missing spDefense and speed
    }
    local missingValid, missingError = StatCalculator.validateIVs(missingStatIVs)
    Tests.assert(not missingValid, "Missing stat should fail validation", "MissingStatFails")
    Tests.assertNotNil(missingError, "Missing stat should return error", "MissingStatError")
    
    -- Test out of range IVs
    local outOfRangeIVs = {
        hp = -1, attack = 15, defense = 10, 
        spAttack = 25, spDefense = 20, speed = 32
    }
    local rangeValid, rangeError = StatCalculator.validateIVs(outOfRangeIVs)
    Tests.assert(not rangeValid, "Out of range IVs should fail validation", "OutOfRangeFails")
    Tests.assertNotNil(rangeError, "Out of range IVs should return error", "OutOfRangeError")
    
    -- Test non-integer IVs
    local nonIntegerIVs = {
        hp = 15.5, attack = 20, defense = 10, 
        spAttack = 25, spDefense = 20, speed = 15
    }
    local integerValid, integerError = StatCalculator.validateIVs(nonIntegerIVs)
    Tests.assert(not integerValid, "Non-integer IVs should fail validation", "NonIntegerFails")
    Tests.assertNotNil(integerError, "Non-integer IVs should return error", "NonIntegerError")
    
    -- Test non-number IVs
    local nonNumberIVs = {
        hp = "fifteen", attack = 20, defense = 10, 
        spAttack = 25, spDefense = 20, speed = 15
    }
    local numberValid, numberError = StatCalculator.validateIVs(nonNumberIVs)
    Tests.assert(not numberValid, "Non-number IVs should fail validation", "NonNumberFails")
    Tests.assertNotNil(numberError, "Non-number IVs should return error", "NonNumberError")
end

-- Test Suite 2: Shiny Determination

function Tests.testShinyDetermination()
    print("Testing Shiny Determination...")
    
    -- Test known non-shiny IVs
    local normalIVs = {
        hp = 15, attack = 20, defense = 10, 
        spAttack = 25, spDefense = 20, speed = 15
    }
    local isShiny = StatCalculator.calculateShinyFromIVs(normalIVs)
    Tests.assert(type(isShiny) == "boolean", "Shiny calculation should return boolean", "ShinyBoolean")
    
    -- Test multiple different IV combinations for shiny determination
    local shinyCount = 0
    local totalTests = 1000
    
    for i = 1, totalTests do
        local testIVs = StatCalculator.generateRandomIVs()
        local testShiny = StatCalculator.calculateShinyFromIVs(testIVs)
        if testShiny then
            shinyCount = shinyCount + 1
        end
    end
    
    -- Shiny rate should be approximately 1/4096 (0.024%)
    -- With 1000 tests, expect 0-2 shinies typically
    Tests.assert(shinyCount <= 5, "Shiny rate should be rare (≤5 in 1000 tests)", "ShinyRateRare")
    
    -- Test with invalid IVs
    local invalidShiny = StatCalculator.calculateShinyFromIVs(nil)
    Tests.assertEqual(false, invalidShiny, "Invalid IVs should return false for shiny", "InvalidIVsShinyFalse")
    
    local outOfRangeShiny = StatCalculator.calculateShinyFromIVs({
        hp = -1, attack = 20, defense = 10, 
        spAttack = 25, spDefense = 20, speed = 15
    })
    Tests.assertEqual(false, outOfRangeShiny, "Out of range IVs should return false for shiny", "OutOfRangeShinyFalse")
end

-- Test Suite 3: Hidden Power Type Calculation

function Tests.testHiddenPowerCalculation()
    print("Testing Hidden Power Type Calculation...")
    
    -- Test with known IV combinations
    local testIVs1 = {
        hp = 31, attack = 0, defense = 31, 
        spAttack = 30, spDefense = 31, speed = 31
    }
    local hpType1 = StatCalculator.calculateHiddenPowerType(testIVs1)
    Tests.assertNotNil(hpType1, "Hidden Power type should not be nil for valid IVs", "HPType1NotNil")
    Tests.assert(type(hpType1) == "number", "Hidden Power type should be a number", "HPType1Number")
    
    -- Test with different IV combinations
    local testIVs2 = {
        hp = 0, attack = 0, defense = 0, 
        spAttack = 0, spDefense = 0, speed = 0
    }
    local hpType2 = StatCalculator.calculateHiddenPowerType(testIVs2)
    Tests.assertNotNil(hpType2, "Hidden Power type should not be nil for zero IVs", "HPType2NotNil")
    
    -- Test that different IVs produce different types (most of the time)
    local typesFound = {}
    for i = 1, 50 do
        local randomIVs = StatCalculator.generateRandomIVs()
        local hpType = StatCalculator.calculateHiddenPowerType(randomIVs)
        if hpType then
            typesFound[hpType] = true
        end
    end
    
    local typeCount = 0
    for _ in pairs(typesFound) do
        typeCount = typeCount + 1
    end
    
    Tests.assert(typeCount > 1, "Different IV combinations should produce different HP types", "HPTypeVariety")
    
    -- Test with invalid IVs
    local invalidHPType, invalidError = StatCalculator.calculateHiddenPowerType({hp = -1, attack = 20})
    Tests.assertNil(invalidHPType, "Invalid IVs should return nil for HP type", "InvalidIVsHPNil")
    Tests.assertNotNil(invalidError, "Invalid IVs should return error for HP type", "InvalidIVsHPError")
end

-- Test Suite 4: Breeding IV Inheritance

function Tests.testBreedingInheritance()
    print("Testing Breeding IV Inheritance...")
    
    -- Test with two valid parent IV sets
    local parent1IVs = {
        hp = 31, attack = 20, defense = 15, 
        spAttack = 10, spDefense = 25, speed = 30
    }
    local parent2IVs = {
        hp = 0, attack = 31, defense = 25, 
        spAttack = 31, spDefense = 5, speed = 15
    }
    
    local childIVs = StatCalculator.generateChildIVs(parent1IVs, parent2IVs)
    Tests.assertNotNil(childIVs, "Child IVs should not be nil", "ChildIVsNotNil")
    
    -- Validate child IVs
    local childValid, childError = StatCalculator.validateIVs(childIVs)
    Tests.assert(childValid, "Child IVs should be valid", "ChildIVsValid")
    Tests.assertNil(childError, "Child IVs should not have error", "ChildIVsNoError")
    
    -- Test multiple breeding attempts
    for i = 1, 10 do
        local testChildIVs = StatCalculator.generateChildIVs(parent1IVs, parent2IVs)
        local testChildValid = StatCalculator.validateIVs(testChildIVs)
        Tests.assert(testChildValid, "Breeding attempt " .. i .. " should produce valid IVs", "BreedingAttempt" .. i)
    end
    
    -- Test with invalid parent IVs
    local invalidParent1 = {hp = -1, attack = 20}  -- Invalid/incomplete
    local invalidChildIVs, invalidError = StatCalculator.generateChildIVs(invalidParent1, parent2IVs)
    Tests.assertNil(invalidChildIVs, "Invalid parent IVs should return nil", "InvalidParentNil")
    Tests.assertNotNil(invalidError, "Invalid parent IVs should return error", "InvalidParentError")
end

-- Test Suite 5: Stat Calculation Integration

function Tests.testStatCalculationIntegration()
    print("Testing Stat Calculation Integration...")
    
    -- Test HP calculation
    local hpStat = StatCalculator.calculateHPStat(45, 31, 50)  -- Base HP, IV, Level
    Tests.assertNotNil(hpStat, "HP stat should not be nil", "HPStatNotNil")
    Tests.assert(type(hpStat) == "number", "HP stat should be a number", "HPStatNumber")
    Tests.assert(hpStat > 0, "HP stat should be positive", "HPStatPositive")
    
    -- Test level 1 HP calculation
    local level1HP = StatCalculator.calculateHPStat(45, 15, 1)
    Tests.assertEqual(70, level1HP, "Level 1 HP should use simplified formula", "Level1HP")
    
    -- Test non-HP stat calculation
    local attackStat = StatCalculator.calculateStat(49, 31, 50, 1.1)  -- Base, IV, Level, Nature
    Tests.assertNotNil(attackStat, "Attack stat should not be nil", "AttackStatNotNil")
    Tests.assert(type(attackStat) == "number", "Attack stat should be a number", "AttackStatNumber")
    Tests.assert(attackStat > 0, "Attack stat should be positive", "AttackStatPositive")
    
    -- Test level 1 non-HP stat calculation  
    local level1Attack = StatCalculator.calculateStat(49, 15, 1, 1.0)
    Tests.assertEqual(64, level1Attack, "Level 1 attack should use simplified formula", "Level1Attack")
    
    -- Test nature modifier effect
    local normalAttack = StatCalculator.calculateStat(100, 0, 50, 1.0)
    local increasedAttack = StatCalculator.calculateStat(100, 0, 50, 1.1)
    local decreasedAttack = StatCalculator.calculateStat(100, 0, 50, 0.9)
    
    Tests.assert(increasedAttack > normalAttack, "1.1 nature should increase stat", "NatureIncrease")
    Tests.assert(decreasedAttack < normalAttack, "0.9 nature should decrease stat", "NatureDecrease")
end

-- Run all tests
function Tests.runAllTests()
    print("=== IV System Unit Tests ===")
    print("")
    
    Tests.testIVGeneration()
    print("")
    Tests.testIVValidation()
    print("")
    Tests.testIVValidationErrors()
    print("")
    Tests.testShinyDetermination()
    print("")
    Tests.testHiddenPowerCalculation()
    print("")
    Tests.testBreedingInheritance()
    print("")
    Tests.testStatCalculationIntegration()
    print("")
    
    print("=== Test Results ===")
    for _, result in ipairs(Tests.results) do
        print(result)
    end
    
    print("")
    print("Tests passed: " .. Tests.passed)
    print("Tests failed: " .. Tests.failed)
    print("Total tests: " .. (Tests.passed + Tests.failed))
    print("Success rate: " .. string.format("%.1f%%", (Tests.passed / (Tests.passed + Tests.failed)) * 100))
    
    return Tests.failed == 0
end

-- Execute tests if run directly
if arg and arg[0] then
    Tests.runAllTests()
end

return Tests