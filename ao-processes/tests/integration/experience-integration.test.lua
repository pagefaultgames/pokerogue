-- Experience System Integration Tests
-- Tests complete experience workflow within battle message processing
-- Validates experience award, sharing, level up, and stat recalculation sequence
-- Tests evolution trigger integration during level progression
-- Tests level cap enforcement during battle resolution

-- Load test framework and dependencies
local TestFramework = require("framework.test-framework-enhanced")
local BattleHandler = require("handlers.battle-handler")
local ExperienceSystem = require("game-logic.progression.experience-system")
local StatCalculator = require("game-logic.pokemon.stat-calculator")
local EvolutionSystem = require("game-logic.pokemon.evolution-system")

-- Test suite for Experience System Integration
local ExperienceIntegrationTests = {}

-- Mock AO message structure for integration tests
local function createMockAOMessage(action, data)
    return {
        Id = "test_message_" .. math.random(1000, 9999),
        From = "test_user",
        Action = action,
        Data = data,
        Tags = {
            {name = "Action", value = action}
        },
        Timestamp = os.time() * 1000
    }
end

-- Mock battle session with complete data
local function createMockBattleSession(playerParty, enemyParty, battleType)
    return {
        battleId = "integration_test_battle",
        battleState = {
            battleId = "integration_test_battle",
            battleType = battleType or "WILD",
            playerParty = playerParty or {},
            enemyParty = enemyParty or {},
            participationData = {},
            turn = 1,
            isActive = true
        },
        userId = "test_user",
        startTime = os.time(),
        lastActivity = os.time()
    }
end

-- Helper to create detailed Pokemon for integration testing
local function createIntegrationPokemon(speciesId, level, exp, stats)
    local pokemon = {
        id = "integration_pokemon_" .. speciesId,
        speciesId = speciesId,
        name = "Integration Test Pokemon " .. speciesId,
        level = level or 1,
        exp = exp or 0,
        nature = "HARDY",
        ivs = {hp = 20, attack = 20, defense = 20, spAttack = 20, spDefense = 20, speed = 20},
        stats = stats or {
            hp = 50,
            maxHp = 50,
            attack = 40,
            defense = 40,
            spAttack = 40,
            spDefense = 40,
            speed = 40
        },
        baseStats = {50, 40, 40, 40, 40, 40},
        moves = {},
        friendship = 70,
        battleData = {}
    }
    return pokemon
end

-- Create mock species database for integration testing
local mockSpeciesData = {
    init = function() end,
    getSpecies = function(speciesId)
        local species = {
            [1] = {
                baseStats = {45, 49, 49, 65, 65, 45},
                baseExp = 64,
                growthRate = "MEDIUM_SLOW",
                name = "Bulbasaur"
            },
            [2] = {
                baseStats = {60, 62, 63, 80, 80, 60},
                baseExp = 142,
                growthRate = "MEDIUM_SLOW",
                name = "Ivysaur"
            },
            [25] = {
                baseStats = {35, 55, 40, 50, 50, 90},
                baseExp = 112,
                growthRate = "MEDIUM_FAST",
                name = "Pikachu"
            },
            [150] = {
                baseStats = {106, 110, 90, 154, 90, 130},
                baseExp = 340,
                growthRate = "SLOW",
                name = "Mewtwo"
            }
        }
        return species[speciesId]
    end
}

-- Integration Test Categories

-- Complete Battle Experience Flow Tests
function ExperienceIntegrationTests.testCompleteBattleExperienceFlow()
    local tests = TestFramework.createTestSuite("Complete Battle Experience Flow Tests")
    
    tests:addTest("Single Pokemon Victory Experience Flow", function()
        -- Setup: Create battle with one participating Pokemon
        local playerPokemon = createIntegrationPokemon(25, 15, 3000) -- Pikachu level 15
        local enemyPokemon = createIntegrationPokemon(1, 20, 8000)   -- Bulbasaur level 20
        
        local session = createMockBattleSession({playerPokemon}, {enemyPokemon}, "WILD")
        
        -- Add participation data
        session.battleState.participationData[playerPokemon.id] = {
            side = "player",
            participated = true,
            totalDamageDealt = 150,
            activeAtBattleEnd = true,
            totalMoveCount = 4,
            turnsActive = 6
        }
        
        -- Mock the dependencies
        ExperienceSystem.SpeciesDatabase = mockSpeciesData
        
        -- Simulate battle victory
        local battleResult = {result = "victory", winner = "player"}
        
        -- Test the complete experience distribution
        local expDistribution = ExperienceSystem.distributeBattleExperience(session.battleState, battleResult)
        
        TestFramework.assertTrue(expDistribution.success, "Experience distribution should succeed")
        TestFramework.assertEqual(expDistribution.totalDistributions, 1, "Should have exactly 1 distribution")
        TestFramework.assertTrue(expDistribution.distributions[1].expGained > 0, "Pokemon should gain experience")
        
        -- Verify Pokemon was updated
        local updatedPokemon = expDistribution.distributions[1].pokemon
        TestFramework.assertNotNil(updatedPokemon, "Updated Pokemon should be provided")
        TestFramework.assertTrue(updatedPokemon.exp > playerPokemon.exp, "Pokemon experience should increase")
    end)
    
    tests:addTest("Multiple Pokemon Experience Sharing", function()
        -- Setup: Create battle with multiple participating Pokemon
        local playerPokemon1 = createIntegrationPokemon(25, 12, 1500) -- Pikachu level 12
        local playerPokemon2 = createIntegrationPokemon(1, 14, 2500)  -- Bulbasaur level 14
        local enemyPokemon = createIntegrationPokemon(150, 25, 15000) -- Mewtwo level 25
        
        local session = createMockBattleSession({playerPokemon1, playerPokemon2}, {enemyPokemon}, "TRAINER")
        
        -- Add participation data for both Pokemon
        session.battleState.participationData[playerPokemon1.id] = {
            side = "player",
            participated = true,
            totalDamageDealt = 100,
            activeAtBattleEnd = false,
            totalMoveCount = 3,
            turnsActive = 4
        }
        
        session.battleState.participationData[playerPokemon2.id] = {
            side = "player",
            participated = true,
            totalDamageDealt = 80,
            activeAtBattleEnd = true,
            totalMoveCount = 2,
            turnsActive = 3
        }
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesData
        
        local battleResult = {result = "victory", winner = "player"}
        local expDistribution = ExperienceSystem.distributeBattleExperience(session.battleState, battleResult)
        
        TestFramework.assertTrue(expDistribution.success, "Experience distribution should succeed")
        TestFramework.assertEqual(expDistribution.totalDistributions, 2, "Should have 2 distributions")
        
        -- Verify both Pokemon gained experience
        TestFramework.assertTrue(expDistribution.distributions[1].expGained > 0, "First Pokemon should gain experience")
        TestFramework.assertTrue(expDistribution.distributions[2].expGained > 0, "Second Pokemon should gain experience")
        
        -- Verify participation factors affect experience
        local dist1 = expDistribution.distributions[1]
        local dist2 = expDistribution.distributions[2]
        
        -- Pokemon that was active at battle end should get more experience
        if dist1.pokemonId == playerPokemon2.id then
            TestFramework.assertTrue(dist1.participationFactor >= dist2.participationFactor, 
                "Active Pokemon should have higher participation factor")
        else
            TestFramework.assertTrue(dist2.participationFactor >= dist1.participationFactor,
                "Active Pokemon should have higher participation factor")
        end
    end)
    
    return tests
end

-- Level Up and Evolution Integration Tests
function ExperienceIntegrationTests.testLevelUpEvolutionIntegration()
    local tests = TestFramework.createTestSuite("Level Up and Evolution Integration Tests")
    
    tests:addTest("Level Up with Stat Recalculation", function()
        -- Setup: Pokemon very close to leveling up
        local pokemon = createIntegrationPokemon(25, 19, 6900) -- Pikachu near level 20
        local enemyPokemon = createIntegrationPokemon(1, 22, 10000)
        
        local originalLevel = pokemon.level
        local originalAttack = pokemon.stats.attack
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesData
        
        -- Gain enough experience to level up
        local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, 500)
        
        TestFramework.assertTrue(updatedPokemon.level > originalLevel, "Pokemon should level up")
        TestFramework.assertNotNil(levelUpData, "Level up data should be provided")
        TestFramework.assertTrue(levelUpData.statsIncreased, "Stats should be marked as increased")
        
        -- Verify stat recalculation occurred
        TestFramework.assertTrue(updatedPokemon.stats.attack >= originalAttack, "Attack should not decrease")
        TestFramework.assertNotNil(updatedPokemon.stats.maxHp, "Max HP should be set")
    end)
    
    tests:addTest("Evolution Trigger Integration", function()
        -- Setup: Bulbasaur at level 15, close to evolution level (16)
        local pokemon = createIntegrationPokemon(1, 15, 3375) -- Just before level 16
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesData
        
        -- Mock evolution chains to allow Bulbasaur -> Ivysaur evolution
        local mockEvolutionChains = {
            init = function() end,
            getEvolutionsForSpecies = function(speciesId)
                if speciesId == 1 then -- Bulbasaur
                    return {{toSpeciesId = 2, trigger = "level", level = 16}}
                end
                return {}
            end
        }
        
        EvolutionSystem.EvolutionChains = mockEvolutionChains
        
        -- Gain experience to trigger evolution
        local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, 500)
        
        TestFramework.assertEqual(updatedPokemon.level, 16, "Pokemon should reach level 16")
        TestFramework.assertNotNil(levelUpData, "Level up data should be provided")
        TestFramework.assertNotNil(levelUpData.evolution, "Evolution data should be provided")
        
        if levelUpData.evolution then
            TestFramework.assertTrue(levelUpData.evolution.evolved, "Pokemon should have evolved")
            TestFramework.assertEqual(levelUpData.evolution.toSpeciesId, 2, "Should evolve into Ivysaur")
        end
    end)
    
    tests:addTest("Multiple Level Ups with Evolution", function()
        -- Setup: Very low level Pokemon with large experience gain
        local pokemon = createIntegrationPokemon(1, 10, 1000)
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesData
        
        -- Mock evolution chains
        local mockEvolutionChains = {
            init = function() end,
            getEvolutionsForSpecies = function(speciesId)
                if speciesId == 1 then return {{toSpeciesId = 2, trigger = "level", level = 16}} end
                return {}
            end
        }
        
        EvolutionSystem.EvolutionChains = mockEvolutionChains
        
        -- Large experience gain to trigger multiple level ups and evolution
        local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, 5000)
        
        TestFramework.assertTrue(updatedPokemon.level >= 16, "Pokemon should reach evolution level")
        TestFramework.assertNotNil(levelUpData, "Level up data should be provided")
        
        if levelUpData.evolution then
            TestFramework.assertTrue(levelUpData.evolution.evolved, "Pokemon should have evolved with multiple level ups")
        end
    end)
    
    return tests
end

-- Level Cap Integration Tests  
function ExperienceIntegrationTests.testLevelCapIntegration()
    local tests = TestFramework.createTestSuite("Level Cap Integration Tests")
    
    tests:addTest("Level Cap Enforcement in Battle", function()
        -- Setup: Pokemon at level cap
        local pokemon = createIntegrationPokemon(25, 10, 1000) -- Level 10 (initial cap)
        local enemyPokemon = createIntegrationPokemon(1, 15, 3000)
        
        -- Create progression with no badges (level cap = 10)
        local playerProgression = {
            badges = 0,
            eliteFourDefeated = false,
            championDefeated = false,
            postgameProgress = 0
        }
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesData
        
        -- Try to gain experience at cap
        local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, 500, {}, playerProgression)
        
        TestFramework.assertEqual(updatedPokemon.level, 10, "Pokemon should remain at level cap")
        TestFramework.assertTrue(levelUpData.levelCapReached, "Level cap should be flagged as reached")
        TestFramework.assertEqual(levelUpData.expGained, 0, "No experience should be gained at cap")
    end)
    
    tests:addTest("Level Cap Progression Integration", function()
        -- Setup: Pokemon near cap with badge progression
        local pokemon = createIntegrationPokemon(25, 14, 2500)
        
        -- Create progression with 1 badge (level cap = 15) 
        local playerProgression = {badges = 1}
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesData
        
        -- Gain experience to hit new cap  
        local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, 1000, {}, playerProgression)
        
        TestFramework.assertTrue(updatedPokemon.level <= 15, "Pokemon should not exceed level cap of 15")
        
        if levelUpData and levelUpData.levelCapInfo then
            TestFramework.assertEqual(levelUpData.levelCapInfo.levelCap, 15, "Level cap should be 15 with 1 badge")
        end
    end)
    
    return tests
end

-- Notification Integration Tests
function ExperienceIntegrationTests.testNotificationIntegration()
    local tests = TestFramework.createTestSuite("Notification Integration Tests")
    
    tests:addTest("Experience Notification Generation", function()
        -- Setup complete battle scenario
        local pokemon = createIntegrationPokemon(25, 18, 5500)
        local enemyPokemon = createIntegrationPokemon(150, 30, 25000)
        
        local session = createMockBattleSession({pokemon}, {enemyPokemon}, "ELITE")
        session.battleState.participationData[pokemon.id] = {
            side = "player",
            participated = true,
            totalDamageDealt = 200,
            activeAtBattleEnd = true,
            totalMoveCount = 5,
            turnsActive = 8
        }
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesData
        
        local battleResult = {result = "victory"}
        local expDistribution = ExperienceSystem.distributeBattleExperience(session.battleState, battleResult)
        
        -- Test notification creation
        if expDistribution.success and #expDistribution.distributions > 0 then
            local distribution = expDistribution.distributions[1]
            
            local notification = ExperienceSystem.createExperienceNotification(
                distribution.pokemon,
                distribution.expGained,
                distribution.levelUpData
            )
            
            TestFramework.assertTrue(notification.success, "Notification should be created successfully")
            TestFramework.assertNotNil(notification.pokemon, "Notification should include Pokemon data")
            TestFramework.assertNotNil(notification.experience, "Notification should include experience data")
            TestFramework.assertEqual(notification.experience.gained, distribution.expGained, "Experience gained should match")
        end
    end)
    
    tests:addTest("Distribution Summary Generation", function()
        -- Setup: Multiple Pokemon battle
        local pokemon1 = createIntegrationPokemon(25, 16, 4000)
        local pokemon2 = createIntegrationPokemon(1, 18, 5500)
        local enemyPokemon = createIntegrationPokemon(150, 35, 40000)
        
        local session = createMockBattleSession({pokemon1, pokemon2}, {enemyPokemon}, "CHAMPION")
        
        -- Add participation for both
        session.battleState.participationData[pokemon1.id] = {
            side = "player", participated = true, totalDamageDealt = 120,
            activeAtBattleEnd = true, totalMoveCount = 4, turnsActive = 6
        }
        session.battleState.participationData[pokemon2.id] = {
            side = "player", participated = true, totalDamageDealt = 80,
            activeAtBattleEnd = false, totalMoveCount = 2, turnsActive = 3
        }
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesData
        
        local battleResult = {result = "victory"}
        local expDistribution = ExperienceSystem.distributeBattleExperience(session.battleState, battleResult)
        
        -- Test distribution summary
        local summary = ExperienceSystem.createExperienceDistributionSummary(expDistribution.distributions)
        
        TestFramework.assertTrue(summary.success, "Summary should be created successfully")
        TestFramework.assertEqual(summary.distributionCount, 2, "Should summarize 2 distributions")
        TestFramework.assertTrue(summary.totalExpGained > 0, "Should track total experience gained")
    end)
    
    return tests
end

-- Error Handling and Edge Case Integration Tests
function ExperienceIntegrationTests.testErrorHandlingIntegration()
    local tests = TestFramework.createTestSuite("Error Handling Integration Tests")
    
    tests:addTest("Invalid Battle State Handling", function()
        local invalidBattleState = {}
        local battleResult = {result = "victory"}
        
        local distribution = ExperienceSystem.distributeBattleExperience(invalidBattleState, battleResult)
        
        TestFramework.assertFalse(distribution.success, "Should handle invalid battle state gracefully")
        TestFramework.assertNotNil(distribution.error, "Should provide error information")
    end)
    
    tests:addTest("Missing Participation Data", function()
        local pokemon = createIntegrationPokemon(25, 15, 3000)
        local enemyPokemon = createIntegrationPokemon(1, 20, 8000)
        
        local session = createMockBattleSession({pokemon}, {enemyPokemon}, "WILD")
        -- Deliberately omit participation data
        
        local battleResult = {result = "victory"}
        local distribution = ExperienceSystem.distributeBattleExperience(session.battleState, battleResult)
        
        TestFramework.assertTrue(distribution.success, "Should handle missing participation gracefully")
        TestFramework.assertEqual(distribution.totalDistributions, 0, "Should have no distributions without participation")
    end)
    
    tests:addTest("Species Data Missing Integration", function()
        local pokemon = createIntegrationPokemon(999, 15, 3000) -- Non-existent species
        
        -- Use mock that returns nil for unknown species
        local mockSpeciesDb = {
            init = function() end,
            getSpecies = function(speciesId)
                return nil -- Simulate missing species data
            end
        }
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesDb
        
        local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, 500)
        
        -- Should handle gracefully - either return error or use defaults
        TestFramework.assertNotNil(updatedPokemon, "Should return Pokemon even with missing species data")
    end)
    
    return tests
end

-- Performance and Stress Integration Tests
function ExperienceIntegrationTests.testPerformanceIntegration()
    local tests = TestFramework.createTestSuite("Performance Integration Tests")
    
    tests:addTest("Large Party Experience Distribution", function()
        -- Setup: Large party with many Pokemon
        local playerParty = {}
        local participationData = {}
        
        for i = 1, 6 do -- Full party of 6 Pokemon
            local pokemon = createIntegrationPokemon(i, 10 + i, 1000 * i)
            table.insert(playerParty, pokemon)
            
            participationData[pokemon.id] = {
                side = "player",
                participated = true,
                totalDamageDealt = 50 + (i * 10),
                activeAtBattleEnd = (i == 6), -- Last Pokemon active
                totalMoveCount = i,
                turnsActive = i + 2
            }
        end
        
        local enemyPokemon = createIntegrationPokemon(150, 40, 50000)
        local session = createMockBattleSession(playerParty, {enemyPokemon}, "ELITE")
        session.battleState.participationData = participationData
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesData
        
        local startTime = os.clock()
        local battleResult = {result = "victory"}
        local distribution = ExperienceSystem.distributeBattleExperience(session.battleState, battleResult)
        local endTime = os.clock()
        
        local processingTime = (endTime - startTime) * 1000 -- Convert to milliseconds
        
        TestFramework.assertTrue(distribution.success, "Large party distribution should succeed")
        TestFramework.assertEqual(distribution.totalDistributions, 6, "Should process all 6 Pokemon")
        TestFramework.assertTrue(processingTime < 1000, "Should complete within 1 second")
    end)
    
    tests:addTest("Multiple Battle Sessions", function()
        -- Test handling multiple concurrent battle sessions
        local sessions = {}
        
        for i = 1, 3 do -- 3 concurrent battles
            local pokemon = createIntegrationPokemon(25, 15 + i, 3000 * i)
            local enemy = createIntegrationPokemon(1, 20 + i, 8000 * i)
            
            local session = createMockBattleSession({pokemon}, {enemy}, "WILD")
            session.battleState.participationData[pokemon.id] = {
                side = "player", participated = true, totalDamageDealt = 100,
                activeAtBattleEnd = true, totalMoveCount = 3, turnsActive = 5
            }
            
            table.insert(sessions, session)
        end
        
        ExperienceSystem.SpeciesDatabase = mockSpeciesData
        
        -- Process all sessions
        local results = {}
        for i, session in ipairs(sessions) do
            local battleResult = {result = "victory"}
            local distribution = ExperienceSystem.distributeBattleExperience(session.battleState, battleResult)
            table.insert(results, distribution)
        end
        
        -- Verify all succeeded
        for i, result in ipairs(results) do
            TestFramework.assertTrue(result.success, "Battle " .. i .. " should succeed")
            TestFramework.assertTrue(result.totalDistributions > 0, "Battle " .. i .. " should have distributions")
        end
    end)
    
    return tests
end

-- Main integration test runner
function ExperienceIntegrationTests.runAllTests()
    local allTests = {
        ExperienceIntegrationTests.testCompleteBattleExperienceFlow(),
        ExperienceIntegrationTests.testLevelUpEvolutionIntegration(),
        ExperienceIntegrationTests.testLevelCapIntegration(),
        ExperienceIntegrationTests.testNotificationIntegration(),
        ExperienceIntegrationTests.testErrorHandlingIntegration(),
        ExperienceIntegrationTests.testPerformanceIntegration()
    }
    
    local results = {
        totalSuites = #allTests,
        totalTests = 0,
        passed = 0,
        failed = 0,
        suiteResults = {}
    }
    
    print("=== Experience System Integration Tests ===")
    print("Testing complete experience workflow within battle message processing")
    print("")
    
    for _, testSuite in ipairs(allTests) do
        local suiteResult = TestFramework.runTestSuite(testSuite)
        table.insert(results.suiteResults, suiteResult)
        
        results.totalTests = results.totalTests + suiteResult.totalTests
        results.passed = results.passed + suiteResult.passed
        results.failed = results.failed + suiteResult.failed
    end
    
    -- Print summary
    print("\n=== Integration Test Summary ===")
    print(string.format("Suites: %d", results.totalSuites))
    print(string.format("Tests: %d", results.totalTests))
    print(string.format("Passed: %d", results.passed))
    print(string.format("Failed: %d", results.failed))
    print(string.format("Success Rate: %.1f%%", (results.passed / results.totalTests) * 100))
    
    return results
end

return ExperienceIntegrationTests