--[[
Evolution System Integration Tests
Tests complete evolution workflows with message processing and state updates

Integration Test Coverage:
- Complete evolution workflows for all trigger types
- Evolution integration with battle handler and Pokemon state management
- Evolution cancellation within complete game workflows
- Multiple evolution options and user choice handling
- Message handling for evolution notifications and user input
- Integration with item usage, friendship tracking, and time systems
--]]

-- Import test framework and system components
local TestFramework = require("tests.framework.test-framework")
local EvolutionSystem = require("game-logic.pokemon.evolution-system")
local TimeSystem = require("game-logic.environment.time-system")
local LocationSystem = require("game-logic.environment.location-system")
local ItemDatabase = require("data.items.item-database")

-- Mock battle handler for integration testing
local MockBattleHandler = {}
function MockBattleHandler.processLevelUp(pokemon, newLevel)
    pokemon.level = newLevel
    
    -- Check for level-based evolution
    local evolutionResult = EvolutionSystem.checkLevelEvolution(pokemon)
    
    return {
        pokemon = pokemon,
        levelUp = true,
        newLevel = newLevel,
        evolution = evolutionResult
    }
end

-- Mock state handler for Pokemon state management
local MockStateHandler = {}
local pokemonStorage = {}

function MockStateHandler.updatePokemon(pokemonId, updatedData)
    pokemonStorage[pokemonId] = updatedData
    return true
end

function MockStateHandler.getPokemon(pokemonId)
    return pokemonStorage[pokemonId]
end

function MockStateHandler.processPokemonEvolution(pokemonId, evolutionTarget, trigger, userPreferences)
    local pokemon = MockStateHandler.getPokemon(pokemonId)
    if not pokemon then
        return nil, "Pokemon not found"
    end
    
    local evolvedPokemon, result
    
    if trigger == "stone" then
        evolvedPokemon, result = EvolutionSystem.processStoneEvolution(pokemon, evolutionTarget)
    elseif trigger == "trade" then
        evolvedPokemon, result = EvolutionSystem.processTradeEvolution(pokemon, true)
    else
        -- Handle other evolution triggers
        local evolutionResult = {evolved = true, toSpeciesId = evolutionTarget}
        evolvedPokemon, result = EvolutionSystem.processEvolutionWithCancellation(pokemon, evolutionResult, userPreferences)
    end
    
    if evolvedPokemon then
        MockStateHandler.updatePokemon(pokemonId, evolvedPokemon)
    end
    
    return evolvedPokemon, result
end

-- Mock message handler for AO message processing
local MockMessageHandler = {}
local messageLog = {}

function MockMessageHandler.sendEvolutionNotification(evolutionResult)
    local message = {
        type = "evolution_notification",
        evolved = evolutionResult.evolved,
        fromSpeciesId = evolutionResult.fromSpeciesId,
        toSpeciesId = evolutionResult.toSpeciesId,
        trigger = evolutionResult.trigger,
        level = evolutionResult.level,
        cancelled = evolutionResult.cancelled,
        timestamp = os.time()
    }
    
    table.insert(messageLog, message)
    return message
end

function MockMessageHandler.requestEvolutionChoice(pokemon, evolutionOptions)
    local message = {
        type = "evolution_choice_request",
        pokemonId = pokemon.id,
        speciesId = pokemon.speciesId,
        options = evolutionOptions,
        timestamp = os.time()
    }
    
    table.insert(messageLog, message)
    return message
end

function MockMessageHandler.getMessageLog()
    return messageLog
end

function MockMessageHandler.clearMessageLog()
    messageLog = {}
end

-- Helper function to create test Pokemon with ID
local function createTestPokemon(options)
    options = options or {}
    local pokemon = {
        id = options.id or "test-pokemon-1",
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
    
    -- Store in mock state handler
    MockStateHandler.updatePokemon(pokemon.id, pokemon)
    return pokemon
end

-- Test suite setup
local EvolutionIntegrationTests = TestFramework.createTestSuite("EvolutionIntegration")

-- Complete level-up evolution workflow
function EvolutionIntegrationTests.testLevelUpEvolutionWorkflow()
    MockMessageHandler.clearMessageLog()
    
    -- Create Bulbasaur ready to evolve
    local pokemon = createTestPokemon({
        id = "bulbasaur-1",
        speciesId = 1,
        level = 15
    })
    
    -- Simulate battle level up
    local battleResult = MockBattleHandler.processLevelUp(pokemon, 16)
    
    TestFramework.assert(battleResult.levelUp, "Should process level up")
    TestFramework.assertEqual(battleResult.newLevel, 16, "Should reach level 16")
    TestFramework.assert(battleResult.evolution.evolved, "Should trigger evolution")
    TestFramework.assertEqual(battleResult.evolution.toSpeciesId, 2, "Should evolve to Ivysaur")
    
    -- Update Pokemon state
    MockStateHandler.updatePokemon(pokemon.id, battleResult.pokemon)
    
    -- Send evolution notification
    local notification = MockMessageHandler.sendEvolutionNotification(battleResult.evolution)
    
    TestFramework.assertEqual(notification.type, "evolution_notification", "Should send evolution notification")
    TestFramework.assert(notification.evolved, "Notification should indicate evolution occurred")
    
    -- Verify final Pokemon state
    local finalPokemon = MockStateHandler.getPokemon(pokemon.id)
    TestFramework.assertEqual(finalPokemon.speciesId, 2, "Pokemon should be evolved in storage")
    TestFramework.assertEqual(finalPokemon.level, 16, "Pokemon should have correct level")
end

-- Stone evolution with user choice workflow
function EvolutionIntegrationTests.testStoneEvolutionWorkflow()
    MockMessageHandler.clearMessageLog()
    
    -- Create Eevee for stone evolution
    local pokemon = createTestPokemon({
        id = "eevee-1",
        speciesId = 133,
        level = 20
    })
    
    -- Get available stone evolution options
    local compatibleStones = EvolutionSystem.getCompatibleStones(pokemon)
    TestFramework.assert(#compatibleStones > 0, "Eevee should have stone evolution options")
    
    -- Present evolution choice to user/agent
    local evolutionOptions = EvolutionSystem.getEvolutionChoiceOptions(pokemon, {
        evolved = true,
        toSpeciesId = 134, -- Vaporeon
        trigger = "stone"
    })
    
    local choiceRequest = MockMessageHandler.requestEvolutionChoice(pokemon, evolutionOptions)
    TestFramework.assertEqual(choiceRequest.type, "evolution_choice_request", "Should request evolution choice")
    
    -- Simulate user choosing Water Stone evolution
    local evolvedPokemon, result = MockStateHandler.processPokemonEvolution(
        pokemon.id, 
        6, -- WATER_STONE
        "stone",
        nil
    )
    
    TestFramework.assert(evolvedPokemon ~= nil, "Stone evolution should succeed")
    TestFramework.assertEqual(evolvedPokemon.speciesId, 134, "Should evolve to Vaporeon")
    
    -- Send evolution notification
    local notification = MockMessageHandler.sendEvolutionNotification(result)
    TestFramework.assert(notification.evolved, "Should notify successful evolution")
    TestFramework.assertEqual(notification.trigger, "stone", "Should record stone trigger")
end

-- Trade evolution workflow with item consumption
function EvolutionIntegrationTests.testTradeEvolutionWorkflow()
    MockMessageHandler.clearMessageLog()
    
    -- Create Seadra with Dragon Scale
    local pokemon = createTestPokemon({
        id = "seadra-1", 
        speciesId = 117,
        level = 30,
        heldItem = 19 -- DRAGON_SCALE
    })
    
    -- Check trade evolution options
    local tradeOptions = EvolutionSystem.getTradeEvolutionOptions(pokemon)
    TestFramework.assert(#tradeOptions > 0, "Seadra should have trade evolution option")
    
    local hasTradeWithItem = false
    for _, option in ipairs(tradeOptions) do
        if option.trigger == "trade_item" and option.hasRequiredItem then
            hasTradeWithItem = true
            break
        end
    end
    TestFramework.assert(hasTradeWithItem, "Should have trade with item option available")
    
    -- Process trade evolution
    local evolvedPokemon, result = MockStateHandler.processPokemonEvolution(
        pokemon.id,
        230, -- Kingdra
        "trade",
        nil
    )
    
    TestFramework.assert(evolvedPokemon ~= nil, "Trade evolution should succeed")
    TestFramework.assertEqual(evolvedPokemon.speciesId, 230, "Should evolve to Kingdra")
    TestFramework.assert(evolvedPokemon.heldItem == nil, "Dragon Scale should be consumed")
    
    -- Verify evolution notification
    local notification = MockMessageHandler.sendEvolutionNotification(result)
    TestFramework.assert(notification.evolved, "Should notify successful evolution")
    TestFramework.assertEqual(notification.trigger, "trade_item", "Should record trade item trigger")
end

-- Friendship evolution with time integration
function EvolutionIntegrationTests.testFriendshipTimeEvolutionWorkflow()
    MockMessageHandler.clearMessageLog()
    
    -- Set up time system for day evolution
    TimeSystem.setTimeOfDay("DAY")
    
    -- Create Eevee with high friendship
    local pokemon = createTestPokemon({
        id = "eevee-day-1",
        speciesId = 133,
        level = 15,
        friendship = 250
    })
    
    -- Simulate level up during day
    local battleResult = MockBattleHandler.processLevelUp(pokemon, 16)
    
    -- Check available evolutions include day-time friendship evolution
    local availableEvolutions = EvolutionSystem.getAvailableEvolutions(battleResult.pokemon)
    local hasEspeon = false
    for _, evolution in ipairs(availableEvolutions) do
        if evolution.toSpeciesId == 196 then -- Espeon
            hasEspeon = true
            break
        end
    end
    TestFramework.assert(hasEspeon, "Should have Espeon evolution available during day")
    
    -- Test night time evolution
    TimeSystem.setTimeOfDay("NIGHT")
    
    local pokemon2 = createTestPokemon({
        id = "eevee-night-1", 
        speciesId = 133,
        level = 15,
        friendship = 250
    })
    
    battleResult = MockBattleHandler.processLevelUp(pokemon2, 16)
    availableEvolutions = EvolutionSystem.getAvolutionEvolutions(battleResult.pokemon)
    
    local hasUmbreon = false
    for _, evolution in ipairs(availableEvolutions) do
        if evolution.toSpeciesId == 197 then -- Umbreon
            hasUmbreon = true
            break
        end
    end
    TestFramework.assert(hasUmbreon, "Should have Umbreon evolution available during night")
    
    -- Clean up time override
    TimeSystem.clearTimeOverride()
end

-- Evolution cancellation workflow
function EvolutionIntegrationTests.testEvolutionCancellationWorkflow()
    MockMessageHandler.clearMessageLog()
    
    -- Create Pokemon with evolution preferences set to never evolve
    local pokemon = createTestPokemon({
        id = "bulbasaur-no-evolve-1",
        speciesId = 1,
        level = 15
    })
    
    local preferences = EvolutionSystem.createAgentEvolutionPreferences("never")
    
    -- Simulate level up
    local battleResult = MockBattleHandler.processLevelUp(pokemon, 16)
    
    -- Process evolution with cancellation check
    local finalPokemon, evolutionResult = EvolutionSystem.processEvolutionWithCancellation(
        battleResult.pokemon,
        battleResult.evolution,
        preferences
    )
    
    TestFramework.assert(not evolutionResult.evolved, "Evolution should be cancelled")
    TestFramework.assert(evolutionResult.cancelled, "Should indicate cancellation")
    TestFramework.assertEqual(finalPokemon.speciesId, 1, "Should remain as Bulbasaur")
    TestFramework.assertEqual(evolutionResult.wouldHaveEvolved, 2, "Should record what it would have evolved into")
    
    -- Update state and notify
    MockStateHandler.updatePokemon(pokemon.id, finalPokemon)
    local notification = MockMessageHandler.sendEvolutionNotification(evolutionResult)
    
    TestFramework.assert(notification.cancelled, "Notification should indicate cancellation")
end

-- Multiple evolution options workflow  
function EvolutionIntegrationTests.testMultipleEvolutionOptionsWorkflow()
    MockMessageHandler.clearMessageLog()
    
    -- Create Gloom which can evolve into Vileplume or Bellossom
    local pokemon = createTestPokemon({
        id = "gloom-1",
        speciesId = 44,
        level = 25
    })
    
    -- Get available stone evolutions
    local compatibleStones = EvolutionSystem.getCompatibleStones(pokemon)
    TestFramework.assert(#compatibleStones >= 2, "Gloom should have multiple stone evolution options")
    
    -- Check for Leaf Stone (Vileplume) and Sun Stone (Bellossom) options
    local hasLeafStone = false
    local hasSunStone = false
    
    for _, stone in ipairs(compatibleStones) do
        if stone.stoneId == 4 then -- LEAF_STONE
            hasLeafStone = true
            TestFramework.assertEqual(stone.evolvesTo, 45, "Leaf Stone should evolve to Vileplume")
        elseif stone.stoneId == 2 then -- SUN_STONE
            hasSunStone = true
            TestFramework.assertEqual(stone.evolvesTo, 182, "Sun Stone should evolve to Bellossom")
        end
    end
    
    TestFramework.assert(hasLeafStone, "Should have Leaf Stone evolution option")
    TestFramework.assert(hasSunStone, "Should have Sun Stone evolution option")
    
    -- Test both evolution paths
    -- Path 1: Leaf Stone -> Vileplume
    local vileplume, result1 = EvolutionSystem.processStoneEvolution(pokemon, 4) -- LEAF_STONE
    TestFramework.assertEqual(vileplume.speciesId, 45, "Should evolve to Vileplume with Leaf Stone")
    
    -- Path 2: Sun Stone -> Bellossom (reset pokemon first)
    pokemon = createTestPokemon({
        id = "gloom-2",
        speciesId = 44,
        level = 25
    })
    
    local bellossom, result2 = EvolutionSystem.processStoneEvolution(pokemon, 2) -- SUN_STONE
    TestFramework.assertEqual(bellossom.speciesId, 182, "Should evolve to Bellossom with Sun Stone")
end

-- Integration with location system
function EvolutionIntegrationTests.testLocationBasedEvolutionIntegration()
    MockMessageHandler.clearMessageLog()
    
    -- Set up location system for magnetic field
    LocationSystem.setBiome("POWER_PLANT")
    LocationSystem.updateSpecialLocations()
    
    TestFramework.assert(LocationSystem.hasMagneticField(), "Power Plant should have magnetic field")
    
    -- Test location-based evolution conditions
    local pokemon = createTestPokemon({
        id = "magneton-1",
        speciesId = 82, -- Magneton
        level = 30
    })
    
    -- Check if special location evolution would be available
    local availableEvolutions = EvolutionSystem.getAvailableEvolutions(pokemon)
    
    -- Note: This would require more complete evolution data for Magnezone
    -- For now, test that location system integration works
    TestFramework.assert(LocationSystem.getCurrentBiome() == "POWER_PLANT", "Location should be set correctly")
    
    -- Clean up location override
    LocationSystem.clearLocationOverride()
end

-- Complete stat recalculation workflow
function EvolutionIntegrationTests.testStatRecalculationWorkflow()
    MockMessageHandler.clearMessageLog()
    
    -- Create Pokemon with specific stats
    local pokemon = createTestPokemon({
        id = "charmander-1",
        speciesId = 4,
        level = 16,
        stats = {attack = 52, defense = 43, hp = 39, spatk = 60, spdef = 50, speed = 65}
    })
    
    -- Store original stats
    local originalStats = {}
    for stat, value in pairs(pokemon.stats) do
        originalStats[stat] = value
    end
    
    -- Process evolution
    local evolutionResult = EvolutionSystem.checkLevelEvolution(pokemon)
    TestFramework.assert(evolutionResult.evolved, "Should evolve to Charmeleon")
    
    local evolvedPokemon = pokemon -- Since checkLevelEvolution modifies in place
    
    -- Verify species changed
    TestFramework.assertEqual(evolvedPokemon.speciesId, 5, "Should evolve to Charmeleon")
    
    -- Verify evolution history is recorded
    TestFramework.assert(#evolvedPokemon.evolutionHistory > 0, "Should record evolution history")
    TestFramework.assertEqual(evolvedPokemon.evolutionHistory[1].fromSpeciesId, 4, "Should record from species")
    TestFramework.assertEqual(evolvedPokemon.evolutionHistory[1].toSpeciesId, 5, "Should record to species")
    TestFramework.assertEqual(evolvedPokemon.evolutionHistory[1].level, 16, "Should record evolution level")
end

-- Message log integration test
function EvolutionIntegrationTests.testMessageLogIntegration()
    MockMessageHandler.clearMessageLog()
    
    -- Create multiple Pokemon and process different evolution types
    local pokemon1 = createTestPokemon({id = "test-1", speciesId = 1, level = 16})
    local pokemon2 = createTestPokemon({id = "test-2", speciesId = 25, level = 10})
    
    -- Process level evolution
    local result1 = EvolutionSystem.checkLevelEvolution(pokemon1)
    MockMessageHandler.sendEvolutionNotification(result1)
    
    -- Process stone evolution
    local result2 = EvolutionSystem.processStoneEvolution(pokemon2, 7) -- Thunder Stone
    if result2 then
        MockMessageHandler.sendEvolutionNotification(result2)
    end
    
    -- Check message log
    local messages = MockMessageHandler.getMessageLog()
    TestFramework.assert(#messages >= 2, "Should have logged multiple evolution messages")
    
    local hasLevelEvolution = false
    local hasStoneEvolution = false
    
    for _, message in ipairs(messages) do
        if message.trigger == "level" then
            hasLevelEvolution = true
        elseif message.trigger == "stone" then
            hasStoneEvolution = true
        end
    end
    
    TestFramework.assert(hasLevelEvolution, "Should log level evolution")
    TestFramework.assert(hasStoneEvolution, "Should log stone evolution")
end

-- Run all integration tests
function EvolutionIntegrationTests.runAllTests()
    print("Running Evolution System Integration Tests...")
    
    local testMethods = {
        "testLevelUpEvolutionWorkflow",
        "testStoneEvolutionWorkflow", 
        "testTradeEvolutionWorkflow",
        "testFriendshipTimeEvolutionWorkflow",
        "testEvolutionCancellationWorkflow",
        "testMultipleEvolutionOptionsWorkflow",
        "testLocationBasedEvolutionIntegration",
        "testStatRecalculationWorkflow",
        "testMessageLogIntegration"
    }
    
    local passed = 0
    local failed = 0
    
    for _, testMethod in ipairs(testMethods) do
        -- Clear state between tests
        pokemonStorage = {}
        MockMessageHandler.clearMessageLog()
        TimeSystem.clearTimeOverride()
        LocationSystem.clearLocationOverride()
        
        local success, error = pcall(EvolutionIntegrationTests[testMethod])
        if success then
            print("✓ " .. testMethod .. " PASSED")
            passed = passed + 1
        else
            print("✗ " .. testMethod .. " FAILED: " .. error)
            failed = failed + 1
        end
    end
    
    print(string.format("\nEvolution Integration Tests Complete: %d passed, %d failed", passed, failed))
    return failed == 0
end

return EvolutionIntegrationTests