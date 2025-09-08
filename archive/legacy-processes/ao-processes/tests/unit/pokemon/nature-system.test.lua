--[[
Nature System Unit Tests
Tests for nature modifiers, validation, and integration with stat calculations

Testing coverage:
- Nature data integrity and validation
- Multiplier precision and TypeScript parity  
- O(1) lookup performance
- Nature-based stat modifications
- Edge cases and error handling
--]]

-- Set up proper module paths
package.path = package.path .. ";../../../?.lua;../../../data/?.lua;../../../data/constants/?.lua"

local NatureModifiers = require("data.constants.nature-modifiers")
local Enums = require("data.constants.enums")

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

-- Test Suite 1: Nature Data Validation

function Tests.testNatureDataIntegrity()
    print("Testing Nature Data Integrity...")
    
    -- Test all 25 natures exist
    Tests.assertEqual(25, NatureModifiers.getNatureCount(), "Should have exactly 25 natures", "NatureCount")
    
    -- Test nature validation for all natures
    local allValid, errors = NatureModifiers.validateAllNatures()
    Tests.assert(allValid, "All natures should be valid: " .. table.concat(errors or {}, ", "), "AllNaturesValid")
    
    -- Test multiplier precision
    local precisionValid, precisionError = NatureModifiers.validateMultiplierPrecision()
    Tests.assert(precisionValid, precisionError or "Multiplier precision should be exact", "MultiplierPrecision")
    
    -- Test specific nature examples
    local hardy = NatureModifiers.getNature(0)  -- Hardy (neutral)
    Tests.assertNotNil(hardy, "Hardy nature should exist", "HardyExists")
    Tests.assertEqual("Hardy", hardy.name, "Hardy nature name should be correct", "HardyName")
    Tests.assertNil(hardy.increase, "Hardy should have no increased stat", "HardyIncrease")
    Tests.assertNil(hardy.decrease, "Hardy should have no decreased stat", "HardyDecrease")
    
    local adamant = NatureModifiers.getNature(3)  -- Adamant (+Attack, -SpAttack)
    Tests.assertNotNil(adamant, "Adamant nature should exist", "AdamantExists")
    Tests.assertEqual("Adamant", adamant.name, "Adamant nature name should be correct", "AdamantName")
    Tests.assertEqual("attack", adamant.increase, "Adamant should increase attack", "AdamantIncrease")
    Tests.assertEqual("spAttack", adamant.decrease, "Adamant should decrease spAttack", "AdamantDecrease")
    
    local modest = NatureModifiers.getNature(15)  -- Modest (+SpAttack, -Attack)
    Tests.assertNotNil(modest, "Modest nature should exist", "ModestExists")
    Tests.assertEqual("Modest", modest.name, "Modest nature name should be correct", "ModestName")
    Tests.assertEqual("spAttack", modest.increase, "Modest should increase spAttack", "ModestIncrease")
    Tests.assertEqual("attack", modest.decrease, "Modest should decrease attack", "ModestDecrease")
end

function Tests.testNatureMultipliers()
    print("Testing Nature Multipliers...")
    
    -- Test Hardy (neutral nature) - all 1.0
    local hardyModifiers = NatureModifiers.getAllModifiers(0)
    for i = 1, 6 do
        Tests.assertEqual(1.0, hardyModifiers[i], "Hardy modifier " .. i .. " should be 1.0", "HardyModifier" .. i)
    end
    
    -- Test Adamant (+Attack, -SpAttack)
    local adamantModifiers = NatureModifiers.getAllModifiers(3)
    Tests.assertEqual(1.0, adamantModifiers[1], "Adamant HP modifier should be 1.0", "AdamantHP")
    Tests.assertEqual(1.1, adamantModifiers[2], "Adamant Attack modifier should be 1.1", "AdamantAttack")
    Tests.assertEqual(1.0, adamantModifiers[3], "Adamant Defense modifier should be 1.0", "AdamantDefense")
    Tests.assertEqual(0.9, adamantModifiers[4], "Adamant SpAttack modifier should be 0.9", "AdamantSpAttack")
    Tests.assertEqual(1.0, adamantModifiers[5], "Adamant SpDefense modifier should be 1.0", "AdamantSpDefense")
    Tests.assertEqual(1.0, adamantModifiers[6], "Adamant Speed modifier should be 1.0", "AdamantSpeed")
    
    -- Test Modest (+SpAttack, -Attack) 
    local modestModifiers = NatureModifiers.getAllModifiers(15)
    Tests.assertEqual(1.0, modestModifiers[1], "Modest HP modifier should be 1.0", "ModestHP")
    Tests.assertEqual(0.9, modestModifiers[2], "Modest Attack modifier should be 0.9", "ModestAttack")
    Tests.assertEqual(1.0, modestModifiers[3], "Modest Defense modifier should be 1.0", "ModestDefense")
    Tests.assertEqual(1.1, modestModifiers[4], "Modest SpAttack modifier should be 1.1", "ModestSpAttack")
    Tests.assertEqual(1.0, modestModifiers[5], "Modest SpDefense modifier should be 1.0", "ModestSpDefense")
    Tests.assertEqual(1.0, modestModifiers[6], "Modest Speed modifier should be 1.0", "ModestSpeed")
    
    -- Test Jolly (+Speed, -SpAttack)
    local jollyModifiers = NatureModifiers.getAllModifiers(13)
    Tests.assertEqual(1.0, jollyModifiers[1], "Jolly HP modifier should be 1.0", "JollyHP")
    Tests.assertEqual(1.0, jollyModifiers[2], "Jolly Attack modifier should be 1.0", "JollyAttack")
    Tests.assertEqual(1.0, jollyModifiers[3], "Jolly Defense modifier should be 1.0", "JollyDefense")
    Tests.assertEqual(0.9, jollyModifiers[4], "Jolly SpAttack modifier should be 0.9", "JollySpAttack")
    Tests.assertEqual(1.0, jollyModifiers[5], "Jolly SpDefense modifier should be 1.0", "JollySpDefense")
    Tests.assertEqual(1.1, jollyModifiers[6], "Jolly Speed modifier should be 1.1", "JollySpeed")
end

-- Test Suite 2: O(1) Lookup Functions

function Tests.testLookupFunctions()
    print("Testing O(1) Lookup Functions...")
    
    -- Test nature existence checks
    Tests.assert(NatureModifiers.natureExists(0), "Hardy should exist", "HardyExists")
    Tests.assert(NatureModifiers.natureExists(24), "Quirky should exist", "QuirkyExists")
    Tests.assert(not NatureModifiers.natureExists(25), "Nature 25 should not exist", "Nature25NotExists")
    Tests.assert(not NatureModifiers.natureExists(-1), "Nature -1 should not exist", "NatureNegativeNotExists")
    
    -- Test nature name lookups
    Tests.assertEqual("Hardy", NatureModifiers.getNatureName(0), "Hardy name lookup", "HardyNameLookup")
    Tests.assertEqual("Adamant", NatureModifiers.getNatureName(3), "Adamant name lookup", "AdamantNameLookup")
    Tests.assertEqual("Modest", NatureModifiers.getNatureName(15), "Modest name lookup", "ModestNameLookup")
    Tests.assertEqual("Jolly", NatureModifiers.getNatureName(13), "Jolly name lookup", "JollyNameLookup")
    Tests.assertNil(NatureModifiers.getNatureName(99), "Invalid nature should return nil", "InvalidNatureName")
    
    -- Test stat increase/decrease lookups
    Tests.assertNil(NatureModifiers.getIncreasedStat(0), "Hardy should have no increased stat", "HardyNoIncrease")
    Tests.assertNil(NatureModifiers.getDecreasedStat(0), "Hardy should have no decreased stat", "HardyNoDecrease")
    Tests.assertEqual("attack", NatureModifiers.getIncreasedStat(3), "Adamant should increase attack", "AdamantIncreaseLookup")
    Tests.assertEqual("spAttack", NatureModifiers.getDecreasedStat(3), "Adamant should decrease spAttack", "AdamantDecreaseLookup")
    
    -- Test neutral nature checks
    Tests.assert(NatureModifiers.isNeutralNature(0), "Hardy should be neutral", "HardyNeutral")
    Tests.assert(NatureModifiers.isNeutralNature(6), "Docile should be neutral", "DocileNeutral")
    Tests.assert(NatureModifiers.isNeutralNature(12), "Serious should be neutral", "SeriousNeutral")
    Tests.assert(NatureModifiers.isNeutralNature(18), "Bashful should be neutral", "BashfulNeutral")
    Tests.assert(NatureModifiers.isNeutralNature(24), "Quirky should be neutral", "QuirkyNeutral")
    Tests.assert(not NatureModifiers.isNeutralNature(3), "Adamant should not be neutral", "AdamantNotNeutral")
    Tests.assert(not NatureModifiers.isNeutralNature(15), "Modest should not be neutral", "ModestNotNeutral")
end

-- Test Suite 3: Edge Cases and Error Handling

function Tests.testEdgeCases()
    print("Testing Edge Cases and Error Handling...")
    
    -- Test invalid nature IDs
    Tests.assertNil(NatureModifiers.getNature(-1), "Negative nature ID should return nil", "NegativeNatureId")
    Tests.assertNil(NatureModifiers.getNature(25), "Out of range nature ID should return nil", "OutOfRangeNatureId")
    Tests.assertNil(NatureModifiers.getNature(100), "Large invalid nature ID should return nil", "LargeInvalidNatureId")
    
    -- Test stat modifier edge cases
    local neutralModifiers = NatureModifiers.getAllModifiers(999)  -- Invalid ID
    for i = 1, 6 do
        Tests.assertEqual(1.0, neutralModifiers[i], "Invalid nature should return neutral modifiers", "InvalidNatureModifier" .. i)
    end
    
    -- Test individual stat modifier lookups
    Tests.assertEqual(1.0, NatureModifiers.getStatModifier(0, 1), "Hardy HP modifier should be 1.0", "HardyHPModifier")
    Tests.assertEqual(1.1, NatureModifiers.getStatModifier(3, 2), "Adamant attack modifier should be 1.1", "AdamantAttackModifier")
    Tests.assertEqual(0.9, NatureModifiers.getStatModifier(3, 4), "Adamant spAttack modifier should be 0.9", "AdamantSpAttackModifier")
    Tests.assertEqual(1.0, NatureModifiers.getStatModifier(999, 1), "Invalid nature should return 1.0", "InvalidNatureStatModifier")
    
    -- Test nature validation edge cases
    local invalidValid, invalidError = NatureModifiers.validateNature(999)
    Tests.assert(not invalidValid, "Invalid nature ID should fail validation", "InvalidNatureValidation")
    Tests.assertNotNil(invalidError, "Invalid nature should return error message", "InvalidNatureError")
end

-- Test Suite 4: Integration with Enums

function Tests.testEnumIntegration()
    print("Testing Enum Integration...")
    
    -- Test that nature IDs align with Enums.Nature
    Tests.assertEqual(0, Enums.Nature.HARDY, "Hardy enum should be 0", "HardyEnum")
    Tests.assertEqual(1, Enums.Nature.LONELY, "Lonely enum should be 1", "LonelyEnum")
    Tests.assertEqual(3, Enums.Nature.ADAMANT, "Adamant enum should be 3", "AdamantEnum")
    Tests.assertEqual(15, Enums.Nature.MODEST, "Modest enum should be 15", "ModestEnum")
    Tests.assertEqual(13, Enums.Nature.JOLLY, "Jolly enum should be 13", "JollyEnum")
    Tests.assertEqual(24, Enums.Nature.QUIRKY, "Quirky enum should be 24", "QuirkyEnum")
    
    -- Test that all enum natures exist in nature modifiers
    for natureName, natureId in pairs(Enums.Nature) do
        Tests.assert(NatureModifiers.natureExists(natureId), 
            "Nature " .. natureName .. " (ID: " .. natureId .. ") should exist in modifiers", 
            "EnumNature" .. natureName)
    end
    
    -- Test nature count matches enum count
    local enumCount = 0
    for _ in pairs(Enums.Nature) do
        enumCount = enumCount + 1
    end
    Tests.assertEqual(enumCount, NatureModifiers.getNatureCount(), "Enum count should match nature count", "EnumNatureCount")
end

-- Test Suite 5: Performance and Lookup Efficiency

function Tests.testPerformance()
    print("Testing Performance and Lookup Efficiency...")
    
    -- Test O(1) lookup performance by timing multiple lookups
    local startTime = os.clock()
    for i = 1, 1000 do
        NatureModifiers.getNature(i % 25)  -- Cycle through all natures
        NatureModifiers.getAllModifiers(i % 25)
        NatureModifiers.getNatureName(i % 25)
    end
    local endTime = os.clock()
    local duration = endTime - startTime
    
    Tests.assert(duration < 1.0, "1000 nature lookups should complete in under 1 second", "LookupPerformance")
    
    -- Test that all nature IDs can be retrieved efficiently
    local allIds = NatureModifiers.getAllNatureIds()
    Tests.assertEqual(25, #allIds, "Should retrieve all 25 nature IDs", "AllNatureIds")
    
    -- Verify IDs are properly sorted
    for i = 2, #allIds do
        Tests.assert(allIds[i] > allIds[i-1], "Nature IDs should be sorted", "NatureIdsSorted")
    end
end

-- Test Suite 6: Random Nature Generation

function Tests.testRandomGeneration()
    print("Testing Random Nature Generation...")
    
    -- Test random nature generation multiple times
    local randomNatures = {}
    for i = 1, 100 do
        local randomNatureId = NatureModifiers.getRandomNatureId()
        Tests.assert(NatureModifiers.natureExists(randomNatureId), 
            "Random nature should be valid", "RandomNatureValid" .. i)
        randomNatures[randomNatureId] = true
    end
    
    -- Should have generated multiple different natures
    local uniqueCount = 0
    for _ in pairs(randomNatures) do
        uniqueCount = uniqueCount + 1
    end
    
    Tests.assert(uniqueCount > 1, "Random generation should produce multiple different natures", "RandomNatureVariety")
end

-- Run all tests
function Tests.runAllTests()
    print("=== Nature System Unit Tests ===")
    print("")
    
    Tests.testNatureDataIntegrity()
    print("")
    Tests.testNatureMultipliers()
    print("")
    Tests.testLookupFunctions()
    print("")
    Tests.testEdgeCases()
    print("")
    Tests.testEnumIntegration()
    print("")
    Tests.testPerformance()
    print("")
    Tests.testRandomGeneration()
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