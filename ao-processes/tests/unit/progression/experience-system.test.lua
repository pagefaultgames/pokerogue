-- Experience System Unit Tests
-- Comprehensive testing for experience calculation, level progression, and evolution mechanics
-- Tests all experience calculations, growth curves, level caps, and distribution algorithms
-- Ensures TypeScript behavioral parity for Pokemon progression systems

-- Load test framework and dependencies
local TestFramework = require("framework.test-framework-enhanced")
local ExperienceSystem = require("game-logic.progression.experience-system")
local EvolutionSystem = require("game-logic.pokemon.evolution-system")

-- Test suite for Experience System
local ExperienceSystemTests = {}

-- Mock dependencies
local mockSpeciesDatabase = {
    init = function() end,
    getSpecies = function(speciesId)
        local mockSpecies = {
            [1] = { -- Bulbasaur
                baseStats = {45, 49, 49, 65, 65, 45},
                baseExp = 64,
                growthRate = "MEDIUM_SLOW",
                name = "Bulbasaur"
            },
            [25] = { -- Pikachu
                baseStats = {35, 55, 40, 50, 50, 90},
                baseExp = 112,
                growthRate = "MEDIUM_FAST",
                name = "Pikachu"
            },
            [150] = { -- Mewtwo
                baseStats = {106, 110, 90, 154, 90, 130},
                baseExp = 340,
                growthRate = "SLOW",
                name = "Mewtwo"
            }
        }
        return mockSpecies[speciesId]
    end
}

-- Helper functions

-- Create mock Pokemon for testing
local function createMockPokemon(speciesId, level, exp, ivs)
    return {
        id = "test_pokemon_" .. (speciesId or 1),
        speciesId = speciesId or 1,
        name = "Test Pokemon",
        level = level or 1,
        exp = exp or 0,
        ivs = ivs or {hp = 15, attack = 15, defense = 15, spAttack = 15, spDefense = 15, speed = 15},
        nature = "HARDY",
        stats = {
            hp = 100,
            maxHp = 100,
            attack = 50,
            defense = 50,
            spAttack = 50,
            spDefense = 50,
            speed = 50
        },
        friendship = 70
    }
end

-- Create mock player progression for level cap testing
local function createMockProgression(badges, eliteFourDefeated, championDefeated, postgameProgress)
    return {
        badges = badges or 0,
        eliteFourDefeated = eliteFourDefeated or false,
        championDefeated = championDefeated or false,
        postgameProgress = postgameProgress or 0
    }
end

-- Create mock battle context
local function createMockBattleContext(battleId, battleType)
    return {
        battleId = battleId or "test_battle",
        battleType = battleType or "WILD"
    }
end

-- Test Categories

-- Experience Formulas and Level Calculation Tests
function ExperienceSystemTests.testExperienceFormulas()
    local tests = TestFramework.createTestSuite("Experience Formula Tests")
    
    -- Test MEDIUM_FAST experience formula
    tests:addTest("Medium Fast Level 10", function()
        local exp = ExperienceSystem.getExpForLevel(10, "MEDIUM_FAST")
        TestFramework.assertEqual(exp, 1000, "Level 10 MEDIUM_FAST should require 1000 EXP")
    end)
    
    tests:addTest("Medium Fast Level 50", function()
        local exp = ExperienceSystem.getExpForLevel(50, "MEDIUM_FAST")
        TestFramework.assertEqual(exp, 125000, "Level 50 MEDIUM_FAST should require 125000 EXP")
    end)
    
    -- Test FAST experience formula
    tests:addTest("Fast Level 10", function()
        local exp = ExperienceSystem.getExpForLevel(10, "FAST")
        TestFramework.assertEqual(exp, 800, "Level 10 FAST should require 800 EXP")
    end)
    
    -- Test SLOW experience formula
    tests:addTest("Slow Level 10", function()
        local exp = ExperienceSystem.getExpForLevel(10, "SLOW")
        TestFramework.assertEqual(exp, 1250, "Level 10 SLOW should require 1250 EXP")
    end)
    
    -- Test level from experience calculation
    tests:addTest("Level from Experience - MEDIUM_FAST", function()
        local level = ExperienceSystem.getLevelFromExp(8000, "MEDIUM_FAST")
        TestFramework.assertEqual(level, 20, "8000 EXP should be level 20 for MEDIUM_FAST")
    end)
    
    tests:addTest("Level from Experience - Edge Case", function()
        local level = ExperienceSystem.getLevelFromExp(999, "MEDIUM_FAST")
        TestFramework.assertEqual(level, 9, "999 EXP should be level 9 for MEDIUM_FAST (below level 10)")
    end)
    
    return tests
end

-- Experience Calculation Tests
function ExperienceSystemTests.testExperienceCalculation()
    local tests = TestFramework.createTestSuite("Experience Calculation Tests")
    
    tests:addTest("Basic Experience Calculation", function()
        local defeatedPokemon = createMockPokemon(1, 10) -- Level 10 Bulbasaur
        local victorPokemon = createMockPokemon(25, 8)   -- Level 8 Pikachu
        
        -- Mock the species database
        ExperienceSystem.SpeciesDatabase = mockSpeciesDatabase
        
        local exp = ExperienceSystem.calculateBattleExp(defeatedPokemon, victorPokemon, "WILD", {})
        TestFramework.assertTrue(exp > 0, "Should gain experience from defeating Pokemon")
        TestFramework.assertTrue(exp < 1000, "Experience should be reasonable amount")
    end)
    
    tests:addTest("Experience with Lucky Egg", function()
        local defeatedPokemon = createMockPokemon(1, 10)
        local victorPokemon = createMockPokemon(25, 8)
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesDatabase
        
        local baseExp = ExperienceSystem.calculateBattleExp(defeatedPokemon, victorPokemon, "WILD", {})
        local luckyEggExp = ExperienceSystem.calculateBattleExp(defeatedPokemon, victorPokemon, "WILD", {hasLuckyEgg = true})
        
        TestFramework.assertTrue(luckyEggExp > baseExp, "Lucky Egg should increase experience")
        TestFramework.assertEqual(luckyEggExp, math.floor(baseExp * 1.5), "Lucky Egg should give 50% bonus")
    end)
    
    tests:addTest("Experience with Traded Pokemon", function()
        local defeatedPokemon = createMockPokemon(1, 10)
        local victorPokemon = createMockPokemon(25, 8)
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesDatabase
        
        local baseExp = ExperienceSystem.calculateBattleExp(defeatedPokemon, victorPokemon, "WILD", {})
        local tradedExp = ExperienceSystem.calculateBattleExp(defeatedPokemon, victorPokemon, "WILD", {isTraded = true})
        
        TestFramework.assertTrue(tradedExp > baseExp, "Traded Pokemon should get bonus experience")
        TestFramework.assertEqual(tradedExp, math.floor(baseExp * 1.5), "Traded Pokemon should get 50% bonus")
    end)
    
    tests:addTest("Participation Experience Penalty", function()
        local defeatedPokemon = createMockPokemon(1, 10)
        local victorPokemon = createMockPokemon(25, 8)
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesDatabase
        
        local killExp = ExperienceSystem.calculateBattleExp(defeatedPokemon, victorPokemon, "WILD", {killingBlow = true})
        local participationExp = ExperienceSystem.calculateBattleExp(defeatedPokemon, victorPokemon, "WILD", {participated = true, killingBlow = false})
        
        TestFramework.assertTrue(participationExp < killExp, "Participation should give less experience than killing blow")
        TestFramework.assertEqual(participationExp, math.floor(killExp * 0.5), "Participation should give 50% experience")
    end)
    
    return tests
end

-- Level Up and Stat Calculation Tests  
function ExperienceSystemTests.testLevelUpProcessing()
    local tests = TestFramework.createTestSuite("Level Up Processing Tests")
    
    tests:addTest("Basic Level Up", function()
        local pokemon = createMockPokemon(25, 9, 700) -- Pikachu near level 10
        local originalLevel = pokemon.level
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesDatabase
        
        local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, 300)
        
        TestFramework.assertEqual(updatedPokemon.level, 10, "Pokemon should level up to 10")
        TestFramework.assertNotNil(levelUpData, "Level up data should be provided")
        TestFramework.assertEqual(levelUpData.oldLevel, originalLevel, "Old level should be recorded")
        TestFramework.assertEqual(levelUpData.newLevel, 10, "New level should be recorded")
    end)
    
    tests:addTest("Multiple Level Ups", function()
        local pokemon = createMockPokemon(25, 8, 500) -- Pikachu at level 8
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesDatabase
        
        local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, 2000) -- Large experience gain
        
        TestFramework.assertTrue(updatedPokemon.level > 8, "Pokemon should gain multiple levels")
        TestFramework.assertNotNil(levelUpData, "Level up data should be provided")
        TestFramework.assertTrue(levelUpData.levelsGained > 1, "Should record multiple levels gained")
    end)
    
    tests:addTest("No Level Up", function()
        local pokemon = createMockPokemon(25, 10, 1000) -- Pikachu at level 10
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesDatabase
        
        local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, 50) -- Small experience gain
        
        TestFramework.assertEqual(updatedPokemon.level, 10, "Pokemon should remain at level 10")
        TestFramework.assertNil(levelUpData, "No level up data should be provided")
    end)
    
    tests:addTest("Friendship Update on Level Up", function()
        local pokemon = createMockPokemon(25, 9, 700)
        pokemon.friendship = 100
        local originalFriendship = pokemon.friendship
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesDatabase
        
        local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, 300)
        
        TestFramework.assertTrue(updatedPokemon.friendship > originalFriendship, "Friendship should increase on level up")
    end)
    
    return tests
end

-- Level Cap Enforcement Tests
function ExperienceSystemTests.testLevelCapEnforcement()
    local tests = TestFramework.createTestSuite("Level Cap Enforcement Tests")
    
    tests:addTest("Initial Level Cap", function()
        local progression = createMockProgression(0) -- No badges
        local cap = ExperienceSystem.getCurrentLevelCap(progression)
        TestFramework.assertEqual(cap, 10, "Initial level cap should be 10")
    end)
    
    tests:addTest("Badge-based Level Cap", function()
        local progression = createMockProgression(4) -- 4 badges
        local cap = ExperienceSystem.getCurrentLevelCap(progression)
        TestFramework.assertEqual(cap, 30, "4 badges should give level cap of 30")
    end)
    
    tests:addTest("Elite Four Level Cap", function()
        local progression = createMockProgression(8, true, false) -- 8 badges, Elite Four defeated
        local cap = ExperienceSystem.getCurrentLevelCap(progression)
        TestFramework.assertEqual(cap, 60, "Elite Four defeated should give level cap of 60")
    end)
    
    tests:addTest("Experience Capping at Level Cap", function()
        local pokemon = createMockPokemon(25, 10, 1000) -- Level 10 Pokemon
        local progression = createMockProgression(0) -- No badges (cap = 10)
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesDatabase
        
        local adjustedExp, capInfo = ExperienceSystem.enforceLevelCap(pokemon, 500, progression)
        
        TestFramework.assertEqual(adjustedExp, 0, "Should not gain experience at level cap")
        TestFramework.assertTrue(capInfo.capReached, "Cap should be flagged as reached")
        TestFramework.assertEqual(capInfo.levelCap, 10, "Level cap should be 10")
    end)
    
    tests:addTest("Experience Adjustment Near Cap", function()
        local pokemon = createMockPokemon(25, 9, 950) -- Near level 10 (1000 EXP)
        local progression = createMockProgression(0) -- No badges (cap = 10)
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesDatabase
        
        local adjustedExp, capInfo = ExperienceSystem.enforceLevelCap(pokemon, 100, progression)
        
        TestFramework.assertTrue(adjustedExp < 100, "Experience should be capped")
        TestFramework.assertEqual(adjustedExp, 50, "Should get exactly 50 EXP to reach level 10")
    end)
    
    return tests
end

-- Experience Distribution Tests
function ExperienceSystemTests.testExperienceDistribution()
    local tests = TestFramework.createTestSuite("Experience Distribution Tests")
    
    tests:addTest("Single Pokemon Distribution", function()
        local battleState = {
            battleId = "test_battle",
            battleType = "WILD",
            playerParty = {createMockPokemon(25, 10)},
            enemyParty = {createMockPokemon(1, 15, nil, nil)},
            participationData = {
                ["test_pokemon_25"] = {
                    side = "player",
                    participated = true,
                    totalDamageDealt = 100,
                    activeAtBattleEnd = true,
                    totalMoveCount = 3,
                    turnsActive = 5
                }
            }
        }
        
        local battleResult = {result = "victory"}
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesDatabase
        
        local distribution = ExperienceSystem.distributeBattleExperience(battleState, battleResult)
        
        TestFramework.assertTrue(distribution.success, "Distribution should succeed")
        TestFramework.assertEqual(distribution.totalDistributions, 1, "Should have 1 distribution")
        TestFramework.assertTrue(#distribution.distributions > 0, "Should have distribution results")
    end)
    
    tests:addTest("Multiple Pokemon Distribution", function()
        local battleState = {
            battleId = "test_battle",
            battleType = "WILD",
            playerParty = {
                createMockPokemon(25, 10),
                createMockPokemon(1, 8)
            },
            enemyParty = {createMockPokemon(150, 20, nil, nil)},
            participationData = {
                ["test_pokemon_25"] = {
                    side = "player",
                    participated = true,
                    totalDamageDealt = 80,
                    activeAtBattleEnd = true,
                    totalMoveCount = 4,
                    turnsActive = 6
                },
                ["test_pokemon_1"] = {
                    side = "player",
                    participated = true,
                    totalDamageDealt = 20,
                    activeAtBattleEnd = false,
                    totalMoveCount = 1,
                    turnsActive = 2
                }
            }
        }
        
        local battleResult = {result = "victory"}
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesDatabase
        
        local distribution = ExperienceSystem.distributeBattleExperience(battleState, battleResult)
        
        TestFramework.assertTrue(distribution.success, "Distribution should succeed")
        TestFramework.assertEqual(distribution.totalDistributions, 2, "Should have 2 distributions")
    end)
    
    tests:addTest("No Distribution on Defeat", function()
        local battleState = {
            battleId = "test_battle",
            playerParty = {createMockPokemon(25, 10)},
            participationData = {
                ["test_pokemon_25"] = {side = "player", participated = true}
            }
        }
        
        local battleResult = {result = "defeat"}
        
        local distribution = ExperienceSystem.distributeBattleExperience(battleState, battleResult)
        
        TestFramework.assertTrue(distribution.success, "Should handle defeat gracefully")
        TestFramework.assertEqual(distribution.totalDistributions, 0, "Should have no distributions on defeat")
    end)
    
    return tests
end

-- Participation Multiplier Tests
function ExperienceSystemTests.testParticipationMultipliers()
    local tests = TestFramework.createTestSuite("Participation Multiplier Tests")
    
    tests:addTest("Full Participation", function()
        local participation = {
            participated = true,
            activeAtBattleEnd = true,
            totalDamageDealt = 100,
            totalMoveCount = 5,
            turnsActive = 10
        }
        
        local multiplier = ExperienceSystem.calculateParticipationMultiplier(participation)
        TestFramework.assertEqual(multiplier, 1.0, "Full participation should give 100% experience")
    end)
    
    tests:addTest("Minimal Participation", function()
        local participation = {
            participated = true,
            activeAtBattleEnd = false,
            totalDamageDealt = 0,
            totalMoveCount = 0,
            turnsActive = 1
        }
        
        local multiplier = ExperienceSystem.calculateParticipationMultiplier(participation)
        TestFramework.assertTrue(multiplier < 1.0, "Minimal participation should give reduced experience")
        TestFramework.assertTrue(multiplier >= 0.35, "Should still get some experience for participation")
    end)
    
    tests:addTest("No Participation", function()
        local participation = {participated = false}
        
        local multiplier = ExperienceSystem.calculateParticipationMultiplier(participation)
        TestFramework.assertEqual(multiplier, 0.0, "No participation should give no experience")
    end)
    
    return tests
end

-- Notification System Tests
function ExperienceSystemTests.testNotificationSystem()
    local tests = TestFramework.createTestSuite("Notification System Tests")
    
    tests:addTest("Experience Gain Notification", function()
        local pokemon = createMockPokemon(25, 10)
        local notification = ExperienceSystem.createExperienceNotification(pokemon, 150, nil)
        
        TestFramework.assertTrue(notification.success, "Notification should be successful")
        TestFramework.assertEqual(notification.type, "EXPERIENCE_GAINED", "Should be experience gained notification")
        TestFramework.assertEqual(notification.experience.gained, 150, "Should record correct experience amount")
    end)
    
    tests:addTest("Level Up Notification", function()
        local pokemon = createMockPokemon(25, 11)
        local levelUpData = {
            oldLevel = 10,
            newLevel = 11,
            levelsGained = 1,
            statsIncreased = true
        }
        
        local notification = ExperienceSystem.createExperienceNotification(pokemon, 200, levelUpData)
        
        TestFramework.assertTrue(notification.success, "Notification should be successful")
        TestFramework.assertEqual(notification.type, "LEVEL_UP", "Should be level up notification")
        TestFramework.assertNotNil(notification.levelUp, "Should have level up data")
        TestFramework.assertEqual(notification.levelUp.newLevel, 11, "Should record new level")
    end)
    
    tests:addTest("Distribution Summary", function()
        local distributions = {
            {pokemonId = "test1", pokemonName = "Pikachu", expGained = 100, participationFactor = 1.0},
            {pokemonId = "test2", pokemonName = "Bulbasaur", expGained = 75, participationFactor = 0.75}
        }
        
        local summary = ExperienceSystem.createExperienceDistributionSummary(distributions)
        
        TestFramework.assertTrue(summary.success, "Summary should be successful")
        TestFramework.assertEqual(summary.distributionCount, 2, "Should have 2 distributions")
        TestFramework.assertEqual(summary.totalExpGained, 175, "Should sum total experience")
    end)
    
    return tests
end

-- Friendship System Tests
function ExperienceSystemTests.testFriendshipSystem()
    local tests = TestFramework.createTestSuite("Friendship System Tests")
    
    tests:addTest("Friendship Increase", function()
        local pokemon = createMockPokemon(25, 10)
        pokemon.friendship = 100
        
        local updatedPokemon = ExperienceSystem.updateFriendship(pokemon, 10, "test")
        
        TestFramework.assertEqual(updatedPokemon.friendship, 110, "Friendship should increase by 10")
    end)
    
    tests:addTest("Friendship Cap", function()
        local pokemon = createMockPokemon(25, 10)
        pokemon.friendship = 250
        
        local updatedPokemon = ExperienceSystem.updateFriendship(pokemon, 20, "test")
        
        TestFramework.assertEqual(updatedPokemon.friendship, 255, "Friendship should cap at 255")
    end)
    
    tests:addTest("Friendship Floor", function()
        local pokemon = createMockPokemon(25, 10)
        pokemon.friendship = 10
        
        local updatedPokemon = ExperienceSystem.updateFriendship(pokemon, -20, "test")
        
        TestFramework.assertEqual(updatedPokemon.friendship, 0, "Friendship should floor at 0")
    end)
    
    tests:addTest("Battle Friendship Gain", function()
        local pokemon = createMockPokemon(25, 10)
        pokemon.friendship = 100
        
        local updatedPokemon = ExperienceSystem.applyBattleFriendship(pokemon, "WIN", "WILD")
        
        TestFramework.assertTrue(updatedPokemon.friendship > 100, "Friendship should increase after winning battle")
    end)
    
    return tests
end

-- Edge Cases and Error Handling Tests
function ExperienceSystemTests.testEdgeCasesAndErrors()
    local tests = TestFramework.createTestSuite("Edge Cases and Error Handling Tests")
    
    tests:addTest("Invalid Parameters", function()
        local result = ExperienceSystem.calculateBattleExp(nil, nil, "WILD", {})
        TestFramework.assertEqual(result, 0, "Should return 0 for invalid parameters")
    end)
    
    tests:addTest("Zero Experience Gain", function()
        local pokemon = createMockPokemon(25, 10)
        local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, 0)
        
        TestFramework.assertEqual(updatedPokemon.level, pokemon.level, "Level should not change with 0 experience")
        TestFramework.assertNil(levelUpData, "No level up data should be provided")
    end)
    
    tests:addTest("Maximum Level Pokemon", function()
        local pokemon = createMockPokemon(25, 100, 1000000)
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesDatabase
        
        local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, 1000)
        
        TestFramework.assertEqual(updatedPokemon.level, 100, "Level should remain at 100")
        TestFramework.assertNil(levelUpData, "No level up should occur at max level")
    end)
    
    tests:addTest("Negative Experience Input", function()
        local pokemon = createMockPokemon(25, 10)
        local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, -100)
        
        TestFramework.assertEqual(updatedPokemon.exp, pokemon.exp, "Experience should not decrease")
    end)
    
    tests:addTest("Invalid Growth Rate", function()
        local success, result = pcall(ExperienceSystem.getExpForLevel, 10, "INVALID_RATE")
        TestFramework.assertFalse(success, "Invalid growth rate should throw error")
    end)
    
    return tests
end

-- Main test runner function
function ExperienceSystemTests.runAllTests()
    local allTests = {
        ExperienceSystemTests.testExperienceFormulas(),
        ExperienceSystemTests.testExperienceCalculation(),
        ExperienceSystemTests.testLevelUpProcessing(),
        ExperienceSystemTests.testLevelCapEnforcement(),
        ExperienceSystemTests.testExperienceDistribution(),
        ExperienceSystemTests.testParticipationMultipliers(),
        ExperienceSystemTests.testNotificationSystem(),
        ExperienceSystemTests.testFriendshipSystem(),
        ExperienceSystemTests.testEdgeCasesAndErrors()
    }
    
    local results = {
        totalSuites = #allTests,
        totalTests = 0,
        passed = 0,
        failed = 0,
        suiteResults = {}
    }
    
    print("=== Experience System Unit Tests ===")
    print("Testing experience calculation, level progression, and evolution mechanics")
    print("")
    
    for _, testSuite in ipairs(allTests) do
        local suiteResult = TestFramework.runTestSuite(testSuite)
        table.insert(results.suiteResults, suiteResult)
        
        results.totalTests = results.totalTests + suiteResult.totalTests
        results.passed = results.passed + suiteResult.passed
        results.failed = results.failed + suiteResult.failed
    end
    
    -- Print summary
    print("\n=== Test Summary ===")
    print(string.format("Suites: %d", results.totalSuites))
    print(string.format("Tests: %d", results.totalTests))
    print(string.format("Passed: %d", results.passed))
    print(string.format("Failed: %d", results.failed))
    print(string.format("Success Rate: %.1f%%", (results.passed / results.totalTests) * 100))
    
    return results
end

return ExperienceSystemTests