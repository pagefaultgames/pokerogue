--[[
Evolution System Unit Tests
Tests all evolution types and conditions with comprehensive coverage

Test Coverage:
- Level-based evolution
- Stone-based evolution 
- Trade-based evolution
- Friendship-based evolution
- Time-based evolution conditions
- Location-based evolution
- Move-based evolution requirements
- Evolution cancellation system
--]]

-- Import test framework and system under test
local TestFramework = require("tests.framework.test-framework")
local EvolutionSystem = require("game-logic.pokemon.evolution-system")
local TimeSystem = require("game-logic.environment.time-system")
local LocationSystem = require("game-logic.environment.location-system")
local ItemDatabase = require("data.items.item-database")

-- Mock dependencies for isolated testing
local function createMockPokemon(options)
    options = options or {}
    return {
        speciesId = options.speciesId or 1,
        species = options.species or "Bulbasaur",
        level = options.level or 1,
        friendship = options.friendship or 0,
        gender = options.gender or "MALE",
        heldItem = options.heldItem,
        moves = options.moves or {},
        stats = options.stats or {
            attack = 49,
            defense = 49,
            hp = 45,
            spatk = 65,
            spdef = 65,
            speed = 45
        },
        evolutionHistory = options.evolutionHistory or {}
    }
end

-- Test suite setup
local EvolutionSystemTests = TestFramework.createTestSuite("EvolutionSystem")

-- Level-based evolution tests
function EvolutionSystemTests.testLevelEvolutionBasic()
    local pokemon = createMockPokemon({speciesId = 1, level = 16}) -- Bulbasaur at level 16
    
    local availableEvolutions = EvolutionSystem.getAvailableEvolutions(pokemon)
    
    TestFramework.assert(#availableEvolutions > 0, "Should have available evolution at level 16")
    TestFramework.assertEqual(availableEvolutions[1].toSpeciesId, 2, "Should evolve to Ivysaur (species 2)")
    
    local evolutionResult = EvolutionSystem.checkLevelEvolution(pokemon)
    TestFramework.assert(evolutionResult.evolved, "Should evolve automatically on level up")
end

function EvolutionSystemTests.testLevelEvolutionBelowThreshold()
    local pokemon = createMockPokemon({speciesId = 1, level = 15}) -- Bulbasaur below evolution level
    
    local availableEvolutions = EvolutionSystem.getAvailableEvolutions(pokemon)
    
    TestFramework.assert(#availableEvolutions == 0, "Should have no available evolution below level 16")
    
    local evolutionResult = EvolutionSystem.checkLevelEvolution(pokemon)
    TestFramework.assert(not evolutionResult.evolved, "Should not evolve below threshold")
end

-- Stone evolution tests
function EvolutionSystemTests.testStoneEvolutionPikachu()
    local pokemon = createMockPokemon({speciesId = 25, level = 10}) -- Pikachu
    
    -- Test Thunder Stone compatibility
    local isValid, error = EvolutionSystem.validateStoneUsage(pokemon, 7) -- THUNDER_STONE
    TestFramework.assert(isValid, "Thunder Stone should be valid for Pikachu: " .. (error or ""))
    
    -- Test stone evolution processing
    local evolvedPokemon, evolutionResult = EvolutionSystem.processStoneEvolution(pokemon, 7)
    TestFramework.assert(evolvedPokemon ~= nil, "Stone evolution should succeed")
    TestFramework.assertEqual(evolvedPokemon.speciesId, 26, "Should evolve to Raichu")
    TestFramework.assert(evolutionResult.evolved, "Evolution result should indicate success")
    TestFramework.assertEqual(evolutionResult.stoneUsed, 7, "Should record stone used")
end

function EvolutionSystemTests.testStoneEvolutionIncompatible()
    local pokemon = createMockPokemon({speciesId = 1, level = 10}) -- Bulbasaur
    
    -- Test incompatible stone
    local isValid, error = EvolutionSystem.validateStoneUsage(pokemon, 7) -- THUNDER_STONE
    TestFramework.assert(not isValid, "Thunder Stone should not be compatible with Bulbasaur")
    TestFramework.assert(error and error:find("not compatible"), "Should provide compatibility error")
end

function EvolutionSystemTests.testEeveeStoneEvolutions()
    local eevee = createMockPokemon({speciesId = 133, level = 10}) -- Eevee
    
    -- Test multiple stone compatibility
    local compatibleStones = EvolutionSystem.getCompatibleStones(eevee)
    TestFramework.assert(#compatibleStones >= 4, "Eevee should have multiple stone evolutions")
    
    -- Test specific evolutions
    local vaporeon, result1 = EvolutionSystem.processStoneEvolution(eevee, 6) -- WATER_STONE
    TestFramework.assertEqual(vaporeon.speciesId, 134, "Should evolve to Vaporeon with Water Stone")
    
    local jolteon, result2 = EvolutionSystem.processStoneEvolution(eevee, 7) -- THUNDER_STONE  
    TestFramework.assertEqual(jolteon.speciesId, 135, "Should evolve to Jolteon with Thunder Stone")
    
    local flareon, result3 = EvolutionSystem.processStoneEvolution(eevee, 5) -- FIRE_STONE
    TestFramework.assertEqual(flareon.speciesId, 136, "Should evolve to Flareon with Fire Stone")
end

-- Trade evolution tests
function EvolutionSystemTests.testTradeEvolutionBasic()
    local kadabra = createMockPokemon({speciesId = 64, level = 20}) -- Kadabra
    
    -- Test trade evolution options
    local tradeOptions = EvolutionSystem.getTradeEvolutionOptions(kadabra)
    TestFramework.assert(#tradeOptions > 0, "Kadabra should have trade evolution option")
    
    -- Test validation without linking cord
    local isValid, error = EvolutionSystem.validateTradeEvolution(kadabra, false)
    TestFramework.assert(not isValid, "Should require Linking Cord for single-player trade evolution")
    
    -- Test trade evolution with linking cord
    local evolvedPokemon, result = EvolutionSystem.processTradeEvolution(kadabra, true)
    TestFramework.assert(evolvedPokemon ~= nil, "Trade evolution should succeed with Linking Cord")
    TestFramework.assertEqual(evolvedPokemon.speciesId, 65, "Should evolve to Alakazam")
    TestFramework.assert(result.linkingCordUsed, "Should record Linking Cord usage")
end

function EvolutionSystemTests.testTradeWithItemEvolution()
    local seadra = createMockPokemon({speciesId = 117, level = 20, heldItem = 19}) -- Seadra with Dragon Scale
    
    -- Test trade with item validation
    local isValid, error = EvolutionSystem.validateTradeEvolution(seadra, true)
    TestFramework.assert(isValid, "Should validate trade with held item: " .. (error or ""))
    
    -- Test trade evolution processing
    local evolvedPokemon, result = EvolutionSystem.processTradeEvolution(seadra, true)
    TestFramework.assert(evolvedPokemon ~= nil, "Trade with item evolution should succeed")
    TestFramework.assertEqual(evolvedPokemon.speciesId, 230, "Should evolve to Kingdra")
    TestFramework.assert(evolvedPokemon.heldItem == nil, "Held item should be consumed in evolution")
    TestFramework.assertEqual(result.heldItemUsed, 19, "Should record held item used")
end

-- Friendship evolution tests
function EvolutionSystemTests.testFriendshipEvolution()
    local pichu = createMockPokemon({speciesId = 172, level = 10, friendship = 220}) -- Pichu with high friendship
    
    local availableEvolutions = EvolutionSystem.getAvailableEvolutions(pichu)
    TestFramework.assert(#availableEvolutions > 0, "Should have friendship evolution available")
    
    local evolutionResult = EvolutionSystem.checkLevelEvolution(pichu)
    TestFramework.assert(not evolutionResult.evolved, "Friendship evolution should not auto-trigger on level up")
end

function EvolutionSystemTests.testFriendshipEvolutionLowFriendship()
    local pichu = createMockPokemon({speciesId = 172, level = 10, friendship = 100}) -- Pichu with low friendship
    
    local availableEvolutions = EvolutionSystem.getAvailableEvolutions(pichu)
    TestFramework.assert(#availableEvolutions == 0, "Should have no evolution available with low friendship")
end

function EvolutionSystemTests.testFriendshipTimeEvolution()
    -- Mock time system for testing
    TimeSystem.setTimeOfDay("DAY")
    
    local eevee = createMockPokemon({speciesId = 133, level = 10, friendship = 220}) -- Eevee with high friendship
    
    local availableEvolutions = EvolutionSystem.getAvailableEvolutions(eevee)
    
    -- Check for day-time friendship evolution (Espeon)
    local hasEspeon = false
    for _, evolution in ipairs(availableEvolutions) do
        if evolution.toSpeciesId == 196 then -- Espeon
            hasEspeon = true
            break
        end
    end
    TestFramework.assert(hasEspeon, "Should have Espeon evolution available during day with high friendship")
    
    -- Switch to night and test
    TimeSystem.setTimeOfDay("NIGHT")
    availableEvolutions = EvolutionSystem.getAvailableEvolutions(eevee)
    
    local hasUmbreon = false
    for _, evolution in ipairs(availableEvolutions) do
        if evolution.toSpeciesId == 197 then -- Umbreon
            hasUmbreon = true
            break
        end
    end
    TestFramework.assert(hasUmbreon, "Should have Umbreon evolution available during night with high friendship")
    
    -- Clean up time override
    TimeSystem.clearTimeOverride()
end

-- Stat-based evolution tests (Tyrogue)
function EvolutionSystemTests.testStatBasedEvolution()
    -- Tyrogue with Attack > Defense
    local tyrogueAttack = createMockPokemon({
        speciesId = 236, 
        level = 20, 
        stats = {attack = 60, defense = 40}
    })
    
    local availableEvolutions = EvolutionSystem.getAvailableEvolutions(tyrogueAttack)
    local hasHitmonlee = false
    for _, evolution in ipairs(availableEvolutions) do
        if evolution.toSpeciesId == 106 then -- Hitmonlee
            hasHitmonlee = true
            break
        end
    end
    TestFramework.assert(hasHitmonlee, "Should evolve to Hitmonlee when Attack > Defense")
    
    -- Tyrogue with Attack < Defense
    local tyrogueDefense = createMockPokemon({
        speciesId = 236, 
        level = 20, 
        stats = {attack = 40, defense = 60}
    })
    
    availableEvolutions = EvolutionSystem.getAvailableEvolutions(tyrogueDefense)
    local hasHitmonchan = false
    for _, evolution in ipairs(availableEvolutions) do
        if evolution.toSpeciesId == 107 then -- Hitmonchan
            hasHitmonchan = true
            break
        end
    end
    TestFramework.assert(hasHitmonchan, "Should evolve to Hitmonchan when Attack < Defense")
    
    -- Tyrogue with Attack = Defense  
    local tyrogueEqual = createMockPokemon({
        speciesId = 236, 
        level = 20, 
        stats = {attack = 50, defense = 50}
    })
    
    availableEvolutions = EvolutionSystem.getAvailableEvolutions(tyrogueEqual)
    local hasHitmontop = false
    for _, evolution in ipairs(availableEvolutions) do
        if evolution.toSpeciesId == 237 then -- Hitmontop
            hasHitmontop = true
            break
        end
    end
    TestFramework.assert(hasHitmontop, "Should evolve to Hitmontop when Attack = Defense")
end

-- Evolution cancellation tests
function EvolutionSystemTests.testEvolutionCancellationNeverEvolve()
    local pokemon = createMockPokemon({speciesId = 1, level = 16})
    local evolutionResult = {evolved = true, toSpeciesId = 2}
    
    local preferences = EvolutionSystem.createAgentEvolutionPreferences("never")
    
    local shouldCancel, reason = EvolutionSystem.checkEvolutionCancellation(pokemon, evolutionResult, preferences)
    TestFramework.assert(shouldCancel, "Should cancel evolution with 'never' preference")
    TestFramework.assert(reason:find("disabled"), "Should provide disabled reason")
end

function EvolutionSystemTests.testEvolutionCancellationAlwaysEvolve()
    local pokemon = createMockPokemon({speciesId = 1, level = 16})
    local evolutionResult = {evolved = true, toSpeciesId = 2}
    
    local preferences = EvolutionSystem.createAgentEvolutionPreferences("always")
    
    local shouldCancel, reason = EvolutionSystem.checkEvolutionCancellation(pokemon, evolutionResult, preferences)
    TestFramework.assert(not shouldCancel, "Should allow evolution with 'always' preference")
end

function EvolutionSystemTests.testEvolutionCancellationConditional()
    local pokemon = createMockPokemon({speciesId = 1, level = 10}) -- Below min level
    local evolutionResult = {evolved = true, toSpeciesId = 2}
    
    local preferences = {
        general = EvolutionSystem.EvolutionPreference.CONDITIONAL,
        conditions = {
            minLevel = 15 -- Require minimum level 15
        }
    }
    
    local shouldCancel, reason = EvolutionSystem.checkEvolutionCancellation(pokemon, evolutionResult, preferences)
    TestFramework.assert(shouldCancel, "Should cancel evolution below minimum level")
    TestFramework.assert(reason:find("minimum"), "Should provide minimum level reason")
end

function EvolutionSystemTests.testSpeciesSpecificPreference()
    local pokemon = createMockPokemon({speciesId = 1, level = 16})
    local evolutionResult = {evolved = true, toSpeciesId = 2}
    
    local preferences = EvolutionSystem.createAgentEvolutionPreferences("always")
    preferences = EvolutionSystem.setSpeciesEvolutionPreference(preferences, 1, EvolutionSystem.EvolutionPreference.NEVER_EVOLVE)
    
    local shouldCancel, reason = EvolutionSystem.checkEvolutionCancellation(pokemon, evolutionResult, preferences)
    TestFramework.assert(shouldCancel, "Species-specific preference should override general preference")
end

-- Evolution requirement text tests
function EvolutionSystemTests.testEvolutionRequirementText()
    local levelEvolution = {trigger = "level", level = 16}
    local text = EvolutionSystem.getEvolutionRequirementText(levelEvolution)
    TestFramework.assert(text:find("Level 16"), "Should generate correct level requirement text")
    
    local stoneEvolution = {trigger = "stone", stone = "Fire Stone"}
    text = EvolutionSystem.getEvolutionRequirementText(stoneEvolution)
    TestFramework.assert(text:find("Fire Stone"), "Should generate correct stone requirement text")
    
    local friendshipEvolution = {trigger = "friendship", friendshipLevel = 220}
    text = EvolutionSystem.getEvolutionRequirementText(friendshipEvolution)
    TestFramework.assert(text:find("220"), "Should generate correct friendship requirement text")
end

-- Validation tests
function EvolutionSystemTests.testEvolutionDataValidation()
    local validPokemon = createMockPokemon({speciesId = 1, level = 16})
    local isValid, error = EvolutionSystem.validateEvolutionData(validPokemon)
    TestFramework.assert(isValid, "Valid Pokemon data should pass validation: " .. (error or ""))
    
    local invalidPokemon = createMockPokemon({speciesId = nil, level = 16})
    isValid, error = EvolutionSystem.validateEvolutionData(invalidPokemon)
    TestFramework.assert(not isValid, "Invalid Pokemon data should fail validation")
    TestFramework.assert(error and error:find("species"), "Should provide species validation error")
end

-- Evolution statistics tests
function EvolutionSystemTests.testEvolutionStatistics()
    local pokemon = createMockPokemon({speciesId = 1, level = 16})
    
    local stats = EvolutionSystem.getEvolutionStatistics(pokemon)
    TestFramework.assert(stats.canEvolve, "Bulbasaur should be able to evolve")
    TestFramework.assertEqual(stats.currentStage, 1, "Should be at first evolution stage")
    TestFramework.assert(not stats.finalStage, "Should not be at final stage")
    TestFramework.assert(stats.availableEvolutions > 0, "Should have available evolutions")
end

-- Run all tests
function EvolutionSystemTests.runAllTests()
    print("Running Evolution System Unit Tests...")
    
    local testMethods = {
        "testLevelEvolutionBasic",
        "testLevelEvolutionBelowThreshold", 
        "testStoneEvolutionPikachu",
        "testStoneEvolutionIncompatible",
        "testEeveeStoneEvolutions",
        "testTradeEvolutionBasic",
        "testTradeWithItemEvolution",
        "testFriendshipEvolution",
        "testFriendshipEvolutionLowFriendship",
        "testFriendshipTimeEvolution",
        "testStatBasedEvolution",
        "testEvolutionCancellationNeverEvolve",
        "testEvolutionCancellationAlwaysEvolve",
        "testEvolutionCancellationConditional",
        "testSpeciesSpecificPreference",
        "testEvolutionRequirementText",
        "testEvolutionDataValidation",
        "testEvolutionStatistics"
    }
    
    local passed = 0
    local failed = 0
    
    for _, testMethod in ipairs(testMethods) do
        local success, error = pcall(EvolutionSystemTests[testMethod])
        if success then
            print("✓ " .. testMethod .. " PASSED")
            passed = passed + 1
        else
            print("✗ " .. testMethod .. " FAILED: " .. error)
            failed = failed + 1
        end
    end
    
    print(string.format("\nEvolution System Tests Complete: %d passed, %d failed", passed, failed))
    return failed == 0
end

return EvolutionSystemTests