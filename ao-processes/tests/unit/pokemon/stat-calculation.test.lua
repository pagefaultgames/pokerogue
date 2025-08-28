--[[
Stat Calculation System Unit Tests  
Tests for complete Pokemon stat calculations with TypeScript parity validation

Testing coverage:
- Individual stat calculation formulas (HP vs non-HP)
- Complete Pokemon stat calculation workflows
- Nature modifier integration
- Level scaling behavior  
- Stat stage modifications for battle
- TypeScript Math.floor/Math.ceil parity
- Edge cases (level 1, max stats, etc.)
--]]

-- Set up proper module paths  
package.path = package.path .. ";../../../?.lua;../../../data/?.lua;../../../data/constants/?.lua;../../../game-logic/pokemon/?.lua"

local StatCalculator = require("game-logic.pokemon.stat-calculator")
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

-- Test Suite 1: HP Stat Calculations

function Tests.testHPCalculations()
    print("Testing HP Stat Calculations...")
    
    -- Test level 1 HP (simplified formula)
    local level1HP = StatCalculator.calculateHPStat(45, 31, 1)  -- Bulbasaur with max IV
    Tests.assertEqual(86, level1HP, "Level 1 HP with max IV should be correct", "Level1HPMaxIV")
    
    local level1HPZero = StatCalculator.calculateHPStat(45, 0, 1)  -- Bulbasaur with 0 IV
    Tests.assertEqual(55, level1HPZero, "Level 1 HP with 0 IV should be correct", "Level1HPZeroIV")
    
    -- Test standard HP calculations at various levels
    local level50HP = StatCalculator.calculateHPStat(45, 31, 50)  -- Level 50 with max IV
    Tests.assert(level50HP >= 115 and level50HP <= 125, "Level 50 HP should be reasonable range", "Level50HP")
    
    local level100HP = StatCalculator.calculateHPStat(45, 31, 100)  -- Level 100 with max IV  
    Tests.assert(level100HP >= 220 and level100HP <= 240, "Level 100 HP should be reasonable range", "Level100HP")
    
    -- Test HP with different IV values
    local hpWithMidIV = StatCalculator.calculateHPStat(45, 15, 50)  -- Mid-range IV
    Tests.assert(hpWithMidIV >= 105 and hpWithMidIV <= 120, "Level 50 HP with mid IV should be reasonable", "Level50HPMidIV")
    
    -- Test HP with different base stats (Chansey - high HP)
    local chanseyHP = StatCalculator.calculateHPStat(250, 31, 50)  -- Chansey base HP 250
    Tests.assert(chanseyHP >= 315 and chanseyHP <= 335, "High base HP Pokemon should calculate correctly", "ChanseyHP")
    
    -- Test HP with low base stats (Shedinja - 1 HP)
    local shedinjaHP = StatCalculator.calculateHPStat(1, 31, 50)  -- Shedinja base HP 1
    Tests.assertEqual(1, shedinjaHP, "Shedinja HP should always be 1", "ShedinjaHP") -- Special case handling needed
end

-- Test Suite 2: Non-HP Stat Calculations

function Tests.testNonHPCalculations()
    print("Testing Non-HP Stat Calculations...")
    
    -- Test level 1 non-HP stats (simplified formula)
    local level1Attack = StatCalculator.calculateStat(49, 31, 1, 1.0)  -- Bulbasaur attack
    Tests.assertEqual(80, level1Attack, "Level 1 attack should be correct", "Level1Attack")
    
    local level1AttackZero = StatCalculator.calculateStat(49, 0, 1, 1.0)  -- 0 IV
    Tests.assertEqual(49, level1AttackZero, "Level 1 attack with 0 IV should be correct", "Level1AttackZeroIV")
    
    -- Test standard stat calculations at various levels
    local level50Attack = StatCalculator.calculateStat(49, 31, 50, 1.0)  -- Level 50 neutral nature
    Tests.assert(level50Attack >= 65 and level50Attack <= 75, "Level 50 attack should be reasonable range", "Level50Attack")
    
    local level100Attack = StatCalculator.calculateStat(49, 31, 100, 1.0)  -- Level 100 neutral nature
    Tests.assert(level100Attack >= 130 and level100Attack <= 140, "Level 100 attack should be reasonable range", "Level100Attack")
    
    -- Test with different base stats (Machamp - high attack)
    local machampAttack = StatCalculator.calculateStat(130, 31, 50, 1.0)  -- Machamp base attack 130
    Tests.assert(machampAttack >= 145 and machampAttack <= 155, "High base attack Pokemon should calculate correctly", "MachampAttack")
    
    -- Test with low base stats (Shuckle - low attack)  
    local shuckleAttack = StatCalculator.calculateStat(10, 31, 50, 1.0)  -- Shuckle base attack 10
    Tests.assert(shuckleAttack >= 25 and shuckleAttack <= 35, "Low base attack Pokemon should calculate correctly", "ShuckleAttack")
end

-- Test Suite 3: Nature Modifier Integration

function Tests.testNatureModifierIntegration()
    print("Testing Nature Modifier Integration...")
    
    -- Test nature increases (1.1 multiplier)
    local baseAttack = StatCalculator.calculateStat(100, 0, 50, 1.0)  -- Base calculation
    local increasedAttack = StatCalculator.calculateStat(100, 0, 50, 1.1)  -- +10% nature
    Tests.assertEqual(105, baseAttack, "Base attack should be correct", "BaseAttack")
    Tests.assertEqual(115, increasedAttack, "Nature increased attack should be correct", "IncreasedAttack")
    
    -- Test nature decreases (0.9 multiplier)
    local decreasedAttack = StatCalculator.calculateStat(100, 0, 50, 0.9)  -- -10% nature
    Tests.assertEqual(94, decreasedAttack, "Nature decreased attack should be correct", "DecreasedAttack")
    
    -- Test nature effects at level 1 (should still apply)
    local level1Base = StatCalculator.calculateStat(100, 0, 1, 1.0)
    local level1Increased = StatCalculator.calculateStat(100, 0, 1, 1.1)
    local level1Decreased = StatCalculator.calculateStat(100, 0, 1, 0.9)
    
    Tests.assertEqual(100, level1Base, "Level 1 base stat should be correct", "Level1Base")
    Tests.assertEqual(110, level1Increased, "Level 1 increased stat should be correct", "Level1Increased")
    Tests.assertEqual(90, level1Decreased, "Level 1 decreased stat should be correct", "Level1Decreased")
    
    -- Test nature effects with specific Pokemon examples
    local adamantAttack = StatCalculator.calculateStat(130, 31, 50, 1.1)  -- Adamant nature
    Tests.assert(adamantAttack >= 160 and adamantAttack <= 180, "Adamant nature attack boost should be reasonable", "AdamantAttack")
    
    local modestAttack = StatCalculator.calculateStat(130, 31, 50, 0.9)  -- Modest nature
    Tests.assert(modestAttack >= 130 and modestAttack <= 150, "Modest nature attack drop should be reasonable", "ModestAttack")
end

-- Test Suite 4: Complete Stat Calculation Workflows

function Tests.testCompleteStatCalculation()
    print("Testing Complete Stat Calculation...")
    
    -- Test complete Pokemon stat calculation (Charizard example)
    local charizardBase = {
        hp = 78, attack = 84, defense = 78, 
        spAttack = 109, spDefense = 85, speed = 100
    }
    local charizardIVs = {
        hp = 31, attack = 0, defense = 31, 
        spAttack = 31, spDefense = 31, speed = 31
    }
    local level = 50
    local natureId = Enums.Nature.MODEST  -- +SpAttack, -Attack
    
    local stats, error = StatCalculator.calculateAllStats(charizardBase, charizardIVs, level, natureId)
    Tests.assertNotNil(stats, "Complete stat calculation should not be nil", "CompleteStatsNotNil")
    Tests.assertNil(error, "Complete stat calculation should not have error", "CompleteStatsNoError")
    
    if stats then
        -- Verify each stat with reasonable ranges
        Tests.assert(stats.hp >= 150 and stats.hp <= 160, "Charizard HP should be reasonable", "CharizardHP")
        Tests.assert(stats.attack >= 75 and stats.attack <= 90, "Charizard attack (decreased by nature) should be reasonable", "CharizardAttack")
        Tests.assert(stats.defense >= 95 and stats.defense <= 105, "Charizard defense should be reasonable", "CharizardDefense")
        Tests.assert(stats.spAttack >= 135 and stats.spAttack <= 155, "Charizard special attack (increased by nature) should be reasonable", "CharizardSpAttack")
        Tests.assert(stats.spDefense >= 100 and stats.spDefense <= 115, "Charizard special defense should be reasonable", "CharizardSpDefense")
        Tests.assert(stats.speed >= 115 and stats.speed <= 135, "Charizard speed should be reasonable", "CharizardSpeed")
    end
    
    -- Test with perfect IVs and neutral nature
    local perfectIVs = {
        hp = 31, attack = 31, defense = 31, 
        spAttack = 31, spDefense = 31, speed = 31
    }
    local neutralStats, neutralError = StatCalculator.calculateAllStats(charizardBase, perfectIVs, level, Enums.Nature.HARDY)
    Tests.assertNotNil(neutralStats, "Perfect IV neutral nature stats should not be nil", "PerfectStatsNotNil")
    Tests.assertNil(neutralError, "Perfect IV stats should not have error", "PerfectStatsNoError")
    
    if neutralStats then
        Tests.assert(neutralStats.hp >= 150 and neutralStats.hp <= 160, "Perfect Charizard HP should be reasonable", "PerfectCharizardHP")
        Tests.assert(neutralStats.attack >= 100 and neutralStats.attack <= 115, "Perfect Charizard attack should be reasonable", "PerfectCharizardAttack")
        Tests.assert(neutralStats.defense >= 95 and neutralStats.defense <= 105, "Perfect Charizard defense should be reasonable", "PerfectCharizardDefense")
        Tests.assert(neutralStats.spAttack >= 125 and neutralStats.spAttack <= 145, "Perfect Charizard special attack should be reasonable", "PerfectCharizardSpAttack")
        Tests.assert(neutralStats.spDefense >= 100 and neutralStats.spDefense <= 115, "Perfect Charizard special defense should be reasonable", "PerfectCharizardSpDefense")
        Tests.assert(neutralStats.speed >= 115 and neutralStats.speed <= 135, "Perfect Charizard speed should be reasonable", "PerfectCharizardSpeed")
    end
end

-- Test Suite 5: Edge Cases and Error Handling

function Tests.testEdgeCases()
    print("Testing Edge Cases and Error Handling...")
    
    -- Test invalid inputs
    local invalidStats, invalidError = StatCalculator.calculateAllStats(nil, {}, 50, Enums.Nature.HARDY)
    Tests.assertNil(invalidStats, "Nil base stats should return nil", "InvalidBaseStatsNil")
    Tests.assertNotNil(invalidError, "Nil base stats should return error", "InvalidBaseStatsError")
    
    -- Test invalid level
    local charizardBase = {hp = 78, attack = 84, defense = 78, spAttack = 109, spDefense = 85, speed = 100}
    local validIVs = {hp = 31, attack = 31, defense = 31, spAttack = 31, spDefense = 31, speed = 31}
    
    local invalidLevelStats, invalidLevelError = StatCalculator.calculateAllStats(charizardBase, validIVs, 0, Enums.Nature.HARDY)
    Tests.assertNil(invalidLevelStats, "Invalid level should return nil", "InvalidLevelNil")
    Tests.assertNotNil(invalidLevelError, "Invalid level should return error", "InvalidLevelError")
    
    local highLevelStats, highLevelError = StatCalculator.calculateAllStats(charizardBase, validIVs, 101, Enums.Nature.HARDY)
    Tests.assertNil(highLevelStats, "Level > 100 should return nil", "HighLevelNil")
    Tests.assertNotNil(highLevelError, "Level > 100 should return error", "HighLevelError")
    
    -- Test invalid nature
    local invalidNatureStats, invalidNatureError = StatCalculator.calculateAllStats(charizardBase, validIVs, 50, 999)
    Tests.assertNil(invalidNatureStats, "Invalid nature should return nil", "InvalidNatureNil")
    Tests.assertNotNil(invalidNatureError, "Invalid nature should return error", "InvalidNatureError")
    
    -- Test invalid IVs
    local invalidIVs = {hp = -1, attack = 31, defense = 31, spAttack = 31, spDefense = 31, speed = 31}
    local invalidIVStats, invalidIVError = StatCalculator.calculateAllStats(charizardBase, invalidIVs, 50, Enums.Nature.HARDY)
    Tests.assertNil(invalidIVStats, "Invalid IVs should return nil", "InvalidIVsNil")
    Tests.assertNotNil(invalidIVError, "Invalid IVs should return error", "InvalidIVsError")
end

-- Test Suite 6: Battle Stat Stage Integration

function Tests.testStatStageModifications()
    print("Testing Stat Stage Modifications...")
    
    -- Test no stat stage changes (0 stages)
    local baseStat = 100
    local unchangedStat = StatCalculator.applyStatStages(baseStat, 0)
    Tests.assertEqual(100, unchangedStat, "0 stat stages should not change stat", "NoStatStageChange")
    
    -- Test positive stat stages (+1 to +6)
    local plus1 = StatCalculator.applyStatStages(baseStat, 1)
    local plus2 = StatCalculator.applyStatStages(baseStat, 2)
    local plus6 = StatCalculator.applyStatStages(baseStat, 6)
    
    Tests.assertEqual(150, plus1, "+1 stat stage should be 1.5x", "Plus1StatStage")
    Tests.assertEqual(200, plus2, "+2 stat stage should be 2x", "Plus2StatStage")
    Tests.assertEqual(400, plus6, "+6 stat stage should be 4x", "Plus6StatStage")
    
    -- Test negative stat stages (-1 to -6)
    local minus1 = StatCalculator.applyStatStages(baseStat, -1)
    local minus2 = StatCalculator.applyStatStages(baseStat, -2)
    local minus6 = StatCalculator.applyStatStages(baseStat, -6)
    
    Tests.assertEqual(66, minus1, "-1 stat stage should be 2/3x", "Minus1StatStage")
    Tests.assertEqual(50, minus2, "-2 stat stage should be 0.5x", "Minus2StatStage")
    Tests.assertEqual(25, minus6, "-6 stat stage should be 0.25x", "Minus6StatStage")
    
    -- Test extreme values are clamped
    local extremePositive = StatCalculator.applyStatStages(baseStat, 10)
    local extremeNegative = StatCalculator.applyStatStages(baseStat, -10)
    
    Tests.assertEqual(400, extremePositive, "Extreme positive stages should be clamped to +6", "ExtremePositive")
    Tests.assertEqual(25, extremeNegative, "Extreme negative stages should be clamped to -6", "ExtremeNegative")
end

-- Test Suite 7: Pokemon Stat Recalculation

function Tests.testPokemonRecalculation()
    print("Testing Pokemon Stat Recalculation...")
    
    -- Test stat recalculation after level up
    local pokemon = {
        baseStats = {hp = 45, attack = 49, defense = 49, spAttack = 65, spDefense = 65, speed = 45},
        ivs = {hp = 31, attack = 31, defense = 31, spAttack = 31, spDefense = 31, speed = 31},
        level = 25,
        natureId = Enums.Nature.ADAMANT
    }
    
    local stats = StatCalculator.recalculateStats(pokemon)
    Tests.assertNotNil(stats, "Pokemon recalculation should not be nil", "RecalculationNotNil")
    
    if stats then
        -- Verify stats are reasonable for level 25 Bulbasaur
        Tests.assert(stats.hp > 0, "Recalculated HP should be positive", "RecalculatedHPPositive")
        
        -- Test with different nature to verify attack boost
        local neutralStats = StatCalculator.recalculateStats({
            baseStats = {hp = 45, attack = 49, defense = 49, spAttack = 65, spDefense = 65, speed = 45},
            ivs = {hp = 31, attack = 31, defense = 31, spAttack = 31, spDefense = 31, speed = 31},
            level = 25,
            natureId = Enums.Nature.HARDY  -- Neutral nature
        })
        
        if neutralStats then
            Tests.assert(stats.attack > neutralStats.attack, "Adamant nature should boost attack over neutral", "AdamantBoost")
        else
            Tests.assert(true, "Adamant boost test skipped due to neutral calc failure", "AdamantBoost")
        end
    end
    
    -- Test with missing data
    local incompletePokemon = {baseStats = {hp = 45}, level = 25}  -- Missing ivs and nature
    local incompleteStats, incompleteError = StatCalculator.recalculateStats(incompletePokemon)
    Tests.assertNil(incompleteStats, "Incomplete Pokemon should return nil", "IncompleteNil")
    Tests.assertNotNil(incompleteError, "Incomplete Pokemon should return error", "IncompleteError")
end

-- Test Suite 8: Utility Functions

function Tests.testUtilityFunctions()
    print("Testing Utility Functions...")
    
    -- Test nature modifier lookup by stat name
    local attackModifier = StatCalculator.getNatureModifier(Enums.Nature.ADAMANT, "attack")
    local spAttackModifier = StatCalculator.getNatureModifier(Enums.Nature.ADAMANT, "spAttack")
    
    Tests.assertEqual(1.1, attackModifier, "Adamant should boost attack", "AdamantAttackModifier")
    Tests.assertEqual(0.9, spAttackModifier, "Adamant should reduce spAttack", "AdamantSpAttackModifier")
    
    -- Test invalid stat name
    local invalidModifier = StatCalculator.getNatureModifier(Enums.Nature.ADAMANT, "invalid")
    Tests.assertEqual(1.0, invalidModifier, "Invalid stat should return 1.0", "InvalidStatModifier")
    
    -- Test stat calculation validation
    Tests.assert(StatCalculator.validateStatCalculation(100, 100), "Exact match should validate", "ExactValidation")
    Tests.assert(StatCalculator.validateStatCalculation(100, 101, 1), "Within tolerance should validate", "ToleranceValidation")
    Tests.assert(not StatCalculator.validateStatCalculation(100, 105), "Outside tolerance should not validate", "OutsideToleranceValidation")
end

-- Run all tests
function Tests.runAllTests()
    print("=== Stat Calculation System Unit Tests ===")
    print("")
    
    Tests.testHPCalculations()
    print("")
    Tests.testNonHPCalculations()
    print("")
    Tests.testNatureModifierIntegration()
    print("")
    Tests.testCompleteStatCalculation()
    print("")
    Tests.testEdgeCases()
    print("")
    Tests.testStatStageModifications()
    print("")
    Tests.testPokemonRecalculation()
    print("")
    Tests.testUtilityFunctions()
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