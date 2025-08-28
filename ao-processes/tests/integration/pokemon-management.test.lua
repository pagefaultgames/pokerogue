--[[
Integration Tests for Pokemon Management System
Tests complete Pokemon lifecycle from creation to battle participation

Test Coverage:
- End-to-end Pokemon creation and management workflows
- Integration between all Pokemon management systems
- Complete battle participation and progression scenarios
- Handler and query system integration
- Storage system integrity and performance
--]]

-- Import test framework
local TestFramework = require("framework.test-framework-enhanced")

-- Import all Pokemon management modules
local PokemonManager = require("game-logic.pokemon.pokemon-manager")
local ExperienceSystem = require("game-logic.progression.experience-system")
local MoveManager = require("game-logic.pokemon.move-manager")
local CustomizationManager = require("game-logic.pokemon.customization-manager")
local BattleIntegration = require("game-logic.battle.pokemon-battle-integration")
local PokemonStorage = require("data.pokemon-instances.pokemon-storage")
local PlayerIndex = require("data.pokemon-instances.player-index")

-- Import handlers
local StateHandler = require("handlers.state-handler")
local QueryHandler = require("handlers.query-handler")

-- Import databases
local SpeciesDatabase = require("data.species.species-database")

-- Test suite
local PokemonManagementIntegrationTests = {}

-- Test fixture setup
function PokemonManagementIntegrationTests.setUp()
    -- Clear all storage systems
    PokemonManager.clearAllStorage()
    PokemonStorage.clear()
    PlayerIndex.clearAll()
    
    -- Initialize databases
    SpeciesDatabase.init()
    
    -- Test data
    PokemonManagementIntegrationTests.testPlayerId = "integration-player-001"
    PokemonManagementIntegrationTests.testSpeciesId = 1  -- Bulbasaur
    PokemonManagementIntegrationTests.testLevel = 5
end

-- Test fixture teardown
function PokemonManagementIntegrationTests.tearDown()
    PokemonManager.clearAllStorage()
    PokemonStorage.clear()
    PlayerIndex.clearAll()
end

-- Complete Pokemon Lifecycle Tests

function PokemonManagementIntegrationTests.testCompletePokemonLifecycle()
    local playerId = PokemonManagementIntegrationTests.testPlayerId
    local speciesId = PokemonManagementIntegrationTests.testSpeciesId
    local level = PokemonManagementIntegrationTests.testLevel
    
    -- Step 1: Create Pokemon
    local pokemon, error = PokemonManager.createPokemon(speciesId, level, playerId, {
        nickname = "TestMon",
        nature = 5
    })
    
    TestFramework.assert(pokemon ~= nil, "Pokemon creation should succeed: " .. (error or ""))
    TestFramework.assert(pokemon.nickname == "TestMon", "Nickname should be set")
    
    -- Step 2: Initialize moveset
    pokemon = MoveManager.initializeMoveset(pokemon)
    TestFramework.assert(pokemon.moveset ~= nil, "Moveset should be initialized")
    TestFramework.assert(#pokemon.moveset > 0, "Pokemon should have at least one move")
    
    -- Step 3: Store in storage system
    local stored, storeError = PokemonStorage.store(pokemon)
    TestFramework.assert(stored, "Pokemon should be stored successfully: " .. (storeError or ""))
    
    -- Step 4: Add to player collection
    PlayerIndex.initializePlayer(playerId)
    local addedToParty, partyError = PlayerIndex.addToParty(playerId, pokemon.id)
    TestFramework.assert(addedToParty, "Pokemon should be added to party: " .. (partyError or ""))
    
    -- Step 5: Level up Pokemon
    local levelUpPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, 200, {
        battleId = "test-battle-001"
    })
    
    TestFramework.assert(levelUpPokemon.level > level, "Pokemon should level up")
    TestFramework.assert(levelUpData ~= nil, "Level up data should be provided")
    
    -- Step 6: Learn new moves from leveling
    local moveUpdatedPokemon, movesLearned = MoveManager.processLevelUpMoves(levelUpPokemon, levelUpPokemon.level)
    TestFramework.assert(type(movesLearned) == "table", "Should process level up moves")
    
    -- Step 7: Apply customizations
    local customizedPokemon, customResult = CustomizationManager.setNickname(moveUpdatedPokemon, "AdvancedMon", playerId)
    TestFramework.assert(customResult.success, "Customization should succeed")
    TestFramework.assert(customizedPokemon.nickname == "AdvancedMon", "New nickname should be set")
    
    -- Step 8: Simulate battle participation
    local battlePokemon, battleResult = BattleIntegration.addPokemonToBattle("test-battle-002", customizedPokemon.id, playerId)
    TestFramework.assert(battleResult.success, "Should be able to add Pokemon to battle")
    TestFramework.assert(battlePokemon.battleData ~= nil, "Battle data should be set")
    
    -- Step 9: Use moves in battle
    local moveUsedPokemon, moveResult = BattleIntegration.useMoveInBattle(battlePokemon.id, 1, playerId, {target = "opponent"})
    TestFramework.assert(moveResult.success, "Should be able to use move in battle")
    
    -- Step 10: Process battle result
    local finalPokemon, resultData = BattleIntegration.processBattleResult(moveUsedPokemon.id, {
        outcome = "WIN",
        expGained = 150,
        battleType = "TRAINER"
    }, playerId)
    
    TestFramework.assert(resultData.success, "Battle result should be processed successfully")
    TestFramework.assert(finalPokemon.battleData == nil, "Battle data should be cleared")
    TestFramework.assert(#finalPokemon.battleHistory > 0, "Battle history should be recorded")
    
    -- Step 11: Validate final state
    local isValid, errors = MoveManager.validateMoveset(finalPokemon)
    TestFramework.assert(isValid, "Final moveset should be valid: " .. table.concat(errors or {}, ", "))
    
    local customValid, customErrors = CustomizationManager.validateCustomizations(finalPokemon)
    TestFramework.assert(customValid, "Final customizations should be valid: " .. table.concat(customErrors or {}, ", "))
    
    return true, "Complete Pokemon lifecycle test successful"
end

-- Handler Integration Tests

function PokemonManagementIntegrationTests.testStateHandlerIntegration()
    local playerId = PokemonManagementIntegrationTests.testPlayerId
    
    -- Test Pokemon creation through handler
    local createMsg = {
        Action = "create-pokemon",
        From = playerId,
        Data = {
            speciesId = 1,
            level = 10,
            options = {
                nickname = "HandlerMon"
            }
        }
    }
    
    local createResult = StateHandler.handle(createMsg)
    TestFramework.assert(createResult.success, "State handler should create Pokemon successfully")
    TestFramework.assert(createResult.pokemon ~= nil, "Should return Pokemon data")
    
    local pokemonId = createResult.pokemon.id
    
    -- Test experience gain through handler
    local expMsg = {
        Action = "gain-experience",
        From = playerId,
        Data = {
            pokemonId = pokemonId,
            expGained = 100,
            battleContext = {
                battleId = "handler-test-battle"
            }
        }
    }
    
    local expResult = StateHandler.handle(expMsg)
    TestFramework.assert(expResult.success, "Should gain experience through handler")
    
    -- Test nickname change through handler
    local nicknameMsg = {
        Action = "set-nickname",
        From = playerId,
        Data = {
            pokemonId = pokemonId,
            nickname = "RenamedMon"
        }
    }
    
    local nicknameResult = StateHandler.handle(nicknameMsg)
    TestFramework.assert(nicknameResult.success, "Should change nickname through handler")
    TestFramework.assert(nicknameResult.pokemon.nickname == "RenamedMon", "Nickname should be updated")
    
    return true, "State handler integration successful"
end

function PokemonManagementIntegrationTests.testQueryHandlerIntegration()
    local playerId = PokemonManagementIntegrationTests.testPlayerId
    
    -- Create test Pokemon
    local pokemon, error = PokemonManager.createPokemon(1, 15, playerId, {nickname = "QueryMon"})
    TestFramework.assert(pokemon ~= nil, "Should create Pokemon for query test")
    
    PokemonStorage.store(pokemon)
    PlayerIndex.initializePlayer(playerId)
    PlayerIndex.addToParty(playerId, pokemon.id)
    
    -- Test individual Pokemon query
    local instanceMsg = {
        Action = "query-pokemon-instance",
        From = playerId,
        Data = {
            pokemonId = pokemon.id,
            includeDetails = true
        }
    }
    
    local instanceResult = QueryHandler.handleQuery(instanceMsg)
    TestFramework.assert(instanceResult.success, "Should query Pokemon instance successfully")
    TestFramework.assert(instanceResult.pokemon.id == pokemon.id, "Should return correct Pokemon")
    TestFramework.assert(instanceResult.displayInfo ~= nil, "Should include display info when requested")
    
    -- Test party query
    local partyMsg = {
        Action = "query-party-pokemon",
        From = playerId
    }
    
    local partyResult = QueryHandler.handleQuery(partyMsg)
    TestFramework.assert(partyResult.success, "Should query party successfully")
    TestFramework.assert(#partyResult.party > 0, "Should return party Pokemon")
    TestFramework.assert(partyResult.party[1].id == pokemon.id, "Should include created Pokemon in party")
    
    -- Test player collection stats
    local statsMsg = {
        Action = "query-player-collection-stats",
        From = playerId
    }
    
    local statsResult = QueryHandler.handleQuery(statsMsg)
    TestFramework.assert(statsResult.success, "Should query collection stats successfully")
    TestFramework.assert(statsResult.playerStats.totalPokemon > 0, "Should show Pokemon in collection")
    
    return true, "Query handler integration successful"
end

-- Storage System Integration Tests

function PokemonManagementIntegrationTests.testStorageSystemIntegration()
    local playerId = PokemonManagementIntegrationTests.testPlayerId
    
    -- Create multiple Pokemon to test storage
    local pokemon1, error1 = PokemonManager.createPokemon(1, 5, playerId, {nickname = "StoreMon1"})
    local pokemon2, error2 = PokemonManager.createPokemon(2, 10, playerId, {nickname = "StoreMon2"})
    local pokemon3, error3 = PokemonManager.createPokemon(3, 15, playerId, {nickname = "StoreMon3"})
    
    TestFramework.assert(pokemon1 and pokemon2 and pokemon3, "Should create multiple Pokemon")
    
    -- Store all Pokemon
    TestFramework.assert(PokemonStorage.store(pokemon1), "Should store first Pokemon")
    TestFramework.assert(PokemonStorage.store(pokemon2), "Should store second Pokemon")
    TestFramework.assert(PokemonStorage.store(pokemon3), "Should store third Pokemon")
    
    -- Test player index integration
    PlayerIndex.initializePlayer(playerId)
    TestFramework.assert(PlayerIndex.addToParty(playerId, pokemon1.id), "Should add to party")
    TestFramework.assert(PlayerIndex.addToBox(playerId, pokemon2.id, 1), "Should add to box")
    TestFramework.assert(PlayerIndex.addToDaycare(playerId, pokemon3.id), "Should add to daycare")
    
    -- Test retrieval and organization
    local partyPokemon = PlayerIndex.getParty(playerId)
    local boxPokemon = PlayerIndex.getBox(playerId, 1)
    
    TestFramework.assert(#partyPokemon == 1, "Should have one Pokemon in party")
    TestFramework.assert(#boxPokemon == 1, "Should have one Pokemon in box")
    TestFramework.assert(partyPokemon[1].id == pokemon1.id, "Correct Pokemon should be in party")
    TestFramework.assert(boxPokemon[1].id == pokemon2.id, "Correct Pokemon should be in box")
    
    -- Test storage search functionality
    local searchResults = PokemonStorage.search({
        playerId = playerId,
        hasNickname = true
    })
    
    TestFramework.assert(#searchResults == 3, "Should find all Pokemon with nicknames")
    
    -- Test storage statistics
    local stats = PokemonStorage.getStats()
    TestFramework.assert(stats.totalPokemon >= 3, "Should count stored Pokemon")
    
    -- Test storage validation
    local valid, errors = PokemonStorage.validate()
    TestFramework.assert(valid, "Storage should be consistent: " .. table.concat(errors or {}, ", "))
    
    return true, "Storage system integration successful"
end

-- Multi-Pokemon Battle Scenario

function PokemonManagementIntegrationTests.testMultiPokemonBattleScenario()
    local playerId = PokemonManagementIntegrationTests.testPlayerId
    local battleId = "multi-pokemon-battle-001"
    
    -- Create team of Pokemon
    local team = {}
    for i = 1, 3 do
        local pokemon, error = PokemonManager.createPokemon(i, 20, playerId, {nickname = "TeamMon" .. i})
        TestFramework.assert(pokemon ~= nil, "Should create team Pokemon " .. i)
        
        pokemon = MoveManager.initializeMoveset(pokemon)
        PokemonStorage.store(pokemon)
        table.insert(team, pokemon)
    end
    
    -- Initialize player and add to party
    PlayerIndex.initializePlayer(playerId)
    for _, pokemon in ipairs(team) do
        PlayerIndex.addToParty(playerId, pokemon.id)
    end
    
    -- Add all Pokemon to battle
    for _, pokemon in ipairs(team) do
        local battlePokemon, result = BattleIntegration.addPokemonToBattle(battleId, pokemon.id, playerId)
        TestFramework.assert(result.success, "Should add Pokemon to battle")
    end
    
    -- Simulate battle actions for each Pokemon
    for i, pokemon in ipairs(team) do
        -- Use moves
        local moveResult
        pokemon, moveResult = BattleIntegration.useMoveInBattle(pokemon.id, 1, playerId)
        TestFramework.assert(moveResult.success, "Should use move for Pokemon " .. i)
        
        -- Apply battle effects
        local effectResult
        pokemon, effectResult = BattleIntegration.applyBattleEffects(pokemon.id, {
            hpChange = -10,
            statStages = {attack = 1}
        }, playerId)
        TestFramework.assert(effectResult.success, "Should apply battle effects to Pokemon " .. i)
    end
    
    -- Process battle results with different outcomes
    local outcomes = {"WIN", "WIN", "LOSS"}
    for i, pokemon in ipairs(team) do
        local resultPokemon, resultData = BattleIntegration.processBattleResult(pokemon.id, {
            outcome = outcomes[i],
            expGained = 100 + (i * 20),
            battleType = "TRAINER"
        }, playerId)
        
        TestFramework.assert(resultData.success, "Should process battle result for Pokemon " .. i)
        TestFramework.assert(resultPokemon.battleData == nil, "Battle data should be cleared")
    end
    
    -- Verify team state after battle
    local finalParty = PlayerIndex.getParty(playerId)
    TestFramework.assert(#finalParty == 3, "All team members should remain in party")
    
    for _, pokemon in ipairs(finalParty) do
        TestFramework.assert(#pokemon.battleHistory > 0, "Each Pokemon should have battle history")
    end
    
    return true, "Multi-Pokemon battle scenario successful"
end

-- Performance and Stress Tests

function PokemonManagementIntegrationTests.testSystemPerformance()
    local startTime = os.clock()
    
    local playerId = "performance-test-player"
    PlayerIndex.initializePlayer(playerId)
    
    -- Create many Pokemon rapidly
    local pokemonCount = 50
    local createdPokemon = {}
    
    for i = 1, pokemonCount do
        local pokemon, error = PokemonManager.createPokemon(
            ((i - 1) % 3) + 1,  -- Rotate between species 1, 2, 3
            math.random(1, 50), 
            playerId,
            {nickname = "PerfMon" .. i}
        )
        
        TestFramework.assert(pokemon ~= nil, "Should create Pokemon " .. i .. ": " .. (error or ""))
        
        pokemon = MoveManager.initializeMoveset(pokemon)
        PokemonStorage.store(pokemon)
        
        if i <= 6 then
            PlayerIndex.addToParty(playerId, pokemon.id)
        else
            PlayerIndex.addToBox(playerId, pokemon.id, ((i - 7) % 20) + 1)
        end
        
        table.insert(createdPokemon, pokemon)
    end
    
    local creationTime = os.clock() - startTime
    TestFramework.assert(creationTime < 5.0, "Should create " .. pokemonCount .. " Pokemon in under 5 seconds, took " .. creationTime .. "s")
    
    -- Test query performance
    local queryStartTime = os.clock()
    
    for i = 1, 20 do
        local randomPokemon = createdPokemon[math.random(1, #createdPokemon)]
        local retrieved = PokemonManager.getPokemon(randomPokemon.id)
        TestFramework.assert(retrieved ~= nil, "Should retrieve Pokemon efficiently")
    end
    
    local queryTime = os.clock() - queryStartTime
    TestFramework.assert(queryTime < 1.0, "Should complete 20 queries in under 1 second, took " .. queryTime .. "s")
    
    -- Test collection queries
    local collectionStartTime = os.clock()
    
    local playerStats = PlayerIndex.getPlayerStats(playerId)
    TestFramework.assert(playerStats.totalPokemon == pokemonCount, "Should count all Pokemon")
    
    local partyPokemon = PlayerIndex.getParty(playerId)
    TestFramework.assert(#partyPokemon == 6, "Should have full party")
    
    local collectionTime = os.clock() - collectionStartTime
    TestFramework.assert(collectionTime < 0.5, "Collection queries should complete in under 0.5 seconds, took " .. collectionTime .. "s")
    
    -- Clean up
    PlayerIndex.clearPlayer(playerId)
    
    local totalTime = os.clock() - startTime
    
    return true, "Performance test completed in " .. totalTime .. "s"
end

-- Data Integrity and Edge Cases

function PokemonManagementIntegrationTests.testDataIntegrityAndEdgeCases()
    local playerId = PokemonManagementIntegrationTests.testPlayerId
    
    -- Test edge case: Level 1 Pokemon
    local level1Pokemon, error = PokemonManager.createPokemon(1, 1, playerId)
    TestFramework.assert(level1Pokemon ~= nil, "Should create level 1 Pokemon: " .. (error or ""))
    TestFramework.assert(level1Pokemon.level == 1, "Level should be 1")
    TestFramework.assert(level1Pokemon.exp == 0, "Level 1 Pokemon should have 0 experience")
    
    -- Test edge case: Max level Pokemon
    local maxLevelPokemon, maxError = PokemonManager.createPokemon(1, 100, playerId)
    TestFramework.assert(maxLevelPokemon ~= nil, "Should create level 100 Pokemon: " .. (maxError or ""))
    TestFramework.assert(maxLevelPokemon.level == 100, "Level should be 100")
    
    -- Test data consistency after multiple operations
    PokemonStorage.store(level1Pokemon)
    
    -- Level up to maximum
    local leveledPokemon, levelUpData = ExperienceSystem.gainExperience(level1Pokemon, 1000000)
    TestFramework.assert(leveledPokemon.level > 1, "Pokemon should level up")
    
    -- Validate experience/level consistency
    local valid, validationError = ExperienceSystem.validateProgression(leveledPokemon)
    TestFramework.assert(valid, "Progression should be valid: " .. (validationError or ""))
    
    -- Test edge case: Empty moveset handling
    local noMovesPokemon = {
        id = "TEST-NO-MOVES",
        speciesId = 1,
        playerId = playerId,
        level = 5,
        moveset = {}
    }
    
    local movesetValid, movesetErrors = MoveManager.validateMoveset(noMovesPokemon)
    TestFramework.assert(not movesetValid, "Empty moveset should be invalid")
    TestFramework.assert(#movesetErrors > 0, "Should report moveset errors")
    
    -- Test ownership edge cases
    local otherPlayerId = "different-player"
    local accessDenied, accessError = PokemonManager.getPokemonWithOwnership(level1Pokemon.id, otherPlayerId)
    TestFramework.assert(accessDenied == nil, "Should deny access to other player's Pokemon")
    TestFramework.assert(string.find(accessError, "Access denied") or string.find(accessError, "access denied"), "Should indicate access denied")
    
    return true, "Data integrity and edge cases handled correctly"
end

-- System Recovery and Error Handling

function PokemonManagementIntegrationTests.testSystemRecoveryAndErrorHandling()
    local playerId = PokemonManagementIntegrationTests.testPlayerId
    
    -- Test recovery from invalid operations
    local invalidResult, invalidError = PokemonManager.createPokemon(999999, 5, playerId)
    TestFramework.assert(invalidResult == nil, "Should reject invalid species")
    TestFramework.assert(invalidError ~= nil, "Should provide error message")
    
    -- Test storage validation and recovery
    local validPokemon, error = PokemonManager.createPokemon(1, 5, playerId)
    TestFramework.assert(validPokemon ~= nil, "Should create valid Pokemon")
    
    PokemonStorage.store(validPokemon)
    
    -- Intentionally corrupt data (in real scenario, this could be data corruption)
    local corruptPokemon = {
        id = "CORRUPT-TEST",
        speciesId = "invalid",  -- Wrong type
        playerId = playerId,
        level = -1,  -- Invalid level
        stats = "not a table"  -- Wrong type
    }
    
    -- System should handle corrupted data gracefully
    local storeCorrupt, storeError = PokemonStorage.store(corruptPokemon)
    TestFramework.assert(not storeCorrupt, "Should reject corrupted Pokemon data")
    
    -- Test validation functions catch issues
    local customValid, customErrors = CustomizationManager.validateCustomizations(corruptPokemon)
    TestFramework.assert(not customValid, "Should detect invalid customization data")
    TestFramework.assert(#customErrors > 0, "Should report validation errors")
    
    -- Test that valid operations still work after handling invalid ones
    local recoverPokemon, recoverError = PokemonManager.createPokemon(2, 10, playerId)
    TestFramework.assert(recoverPokemon ~= nil, "System should recover and handle valid operations")
    
    return true, "System recovery and error handling working correctly"
end

-- Test runner
function PokemonManagementIntegrationTests.runAllTests()
    local testSuite = TestFramework.TestSuite:new("Pokemon Management Integration Tests")
    
    -- Complete lifecycle tests
    testSuite:addTest("Complete Pokemon Lifecycle", PokemonManagementIntegrationTests.testCompletePokemonLifecycle)
    
    -- Handler integration tests
    testSuite:addTest("State Handler Integration", PokemonManagementIntegrationTests.testStateHandlerIntegration)
    testSuite:addTest("Query Handler Integration", PokemonManagementIntegrationTests.testQueryHandlerIntegration)
    
    -- Storage system tests
    testSuite:addTest("Storage System Integration", PokemonManagementIntegrationTests.testStorageSystemIntegration)
    
    -- Battle scenario tests
    testSuite:addTest("Multi-Pokemon Battle Scenario", PokemonManagementIntegrationTests.testMultiPokemonBattleScenario)
    
    -- Performance tests
    testSuite:addTest("System Performance", PokemonManagementIntegrationTests.testSystemPerformance)
    
    -- Data integrity tests
    testSuite:addTest("Data Integrity and Edge Cases", PokemonManagementIntegrationTests.testDataIntegrityAndEdgeCases)
    testSuite:addTest("System Recovery and Error Handling", PokemonManagementIntegrationTests.testSystemRecoveryAndErrorHandling)
    
    -- Run tests with setup/teardown
    testSuite:setSetUp(PokemonManagementIntegrationTests.setUp)
    testSuite:setTearDown(PokemonManagementIntegrationTests.tearDown)
    
    local results = testSuite:run()
    return results
end

-- Run tests if this file is executed directly
if not pcall(debug.getlocal, 4, 1) then
    local results = PokemonManagementIntegrationTests.runAllTests()
    if results and results.totalPassed and results.totalTests then
        print(string.format("Integration Tests: %d/%d passed", results.totalPassed, results.totalTests))
        if results.totalPassed == results.totalTests then
            os.exit(0)
        else
            os.exit(1)
        end
    end
end

return PokemonManagementIntegrationTests