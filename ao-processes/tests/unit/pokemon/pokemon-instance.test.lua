--[[
Unit Tests for Pokemon Instance Management System
Tests Pokemon creation, ownership validation, and basic functionality

Test Coverage:
- Pokemon instance creation and validation
- Ownership validation and security
- ID generation and collision prevention
- Basic Pokemon management operations
- Integration with species, ability, nature systems
--]]

-- Import test framework
local TestFramework = require("tests.framework.test-framework-enhanced")
local TestUtilities = require("tests.framework.handler-test-utilities")

-- Import modules under test
local PokemonManager = require("game-logic.pokemon.pokemon-manager")
local PokemonStorage = require("data.pokemon-instances.pokemon-storage")
local PlayerIndex = require("data.pokemon-instances.player-index")
local StatCalculator = require("game-logic.pokemon.stat-calculator")
local SpeciesDatabase = require("data.species.species-database")
local Enums = require("data.constants.enums")

-- Test suite
local PokemonInstanceTests = {}

-- Test fixture setup
function PokemonInstanceTests.setUp()
    -- Clear storage before each test
    PokemonManager.clearAllStorage()
    PokemonStorage.clear()
    PlayerIndex.clearAll()
    
    -- Initialize required databases
    SpeciesDatabase.init()
    
    -- Create test data
    PokemonInstanceTests.testPlayerId = "test-player-123"
    PokemonInstanceTests.testSpeciesId = 1  -- Bulbasaur
    PokemonInstanceTests.testLevel = 5
    PokemonInstanceTests.testIVs = {
        hp = 31,
        attack = 20,
        defense = 15,
        spAttack = 25,
        spDefense = 10,
        speed = 30
    }
    PokemonInstanceTests.testNature = 1  -- Hardy nature
end

-- Test fixture teardown
function PokemonInstanceTests.tearDown()
    PokemonManager.clearAllStorage()
    PokemonStorage.clear()
    PlayerIndex.clearAll()
end

-- ID Generation Tests

function PokemonInstanceTests.testGenerateUniqueId()
    local id1 = PokemonManager.generateUniqueId()
    local id2 = PokemonManager.generateUniqueId()
    
    TestFramework.assert(id1 ~= id2, "Generated IDs should be unique")
    TestFramework.assert(string.match(id1, "^PKM%d+$"), "ID should match PKM format")
    TestFramework.assert(string.match(id2, "^PKM%d+$"), "ID should match PKM format")
    
    return true, "Unique ID generation successful"
end

function PokemonInstanceTests.testValidateIdFormat()
    -- Valid ID format
    local valid, error = PokemonManager.validateIdFormat("PKM00000001")
    TestFramework.assert(valid, "Valid ID format should pass validation: " .. (error or ""))
    
    -- Invalid formats
    local invalid1, error1 = PokemonManager.validateIdFormat("POKEMON001")
    TestFramework.assert(not invalid1, "Invalid prefix should fail validation")
    
    local invalid2, error2 = PokemonManager.validateIdFormat("PKM")
    TestFramework.assert(not invalid2, "Missing number should fail validation")
    
    local invalid3, error3 = PokemonManager.validateIdFormat(123)
    TestFramework.assert(not invalid3, "Non-string should fail validation")
    
    return true, "ID format validation working correctly"
end

-- Pokemon Creation Tests

function PokemonInstanceTests.testCreateBasicPokemon()
    local pokemon, error = PokemonManager.createPokemon(
        PokemonInstanceTests.testSpeciesId,
        PokemonInstanceTests.testLevel,
        PokemonInstanceTests.testPlayerId
    )
    
    TestFramework.assert(pokemon ~= nil, "Pokemon creation should succeed: " .. (error or ""))
    TestFramework.assert(pokemon.id ~= nil, "Created Pokemon should have ID")
    TestFramework.assert(pokemon.speciesId == PokemonInstanceTests.testSpeciesId, "Species ID should match")
    TestFramework.assert(pokemon.level == PokemonInstanceTests.testLevel, "Level should match")
    TestFramework.assert(pokemon.playerId == PokemonInstanceTests.testPlayerId, "Player ID should match")
    TestFramework.assert(pokemon.originalTrainer == PokemonInstanceTests.testPlayerId, "Original trainer should match player")
    
    -- Verify stats were calculated
    TestFramework.assert(pokemon.stats.hp > 0, "HP should be calculated")
    TestFramework.assert(pokemon.stats.attack > 0, "Attack should be calculated")
    TestFramework.assert(pokemon.stats.maxHp == pokemon.stats.hp, "Max HP should equal current HP")
    
    -- Verify IVs were generated
    TestFramework.assert(pokemon.ivs.hp >= 0 and pokemon.ivs.hp <= 31, "HP IV should be in valid range")
    TestFramework.assert(pokemon.ivs.attack >= 0 and pokemon.ivs.attack <= 31, "Attack IV should be in valid range")
    
    return true, "Basic Pokemon creation successful"
end

function PokemonInstanceTests.testCreatePokemonWithCustomIVs()
    local pokemon, error = PokemonManager.createPokemon(
        PokemonInstanceTests.testSpeciesId,
        PokemonInstanceTests.testLevel,
        PokemonInstanceTests.testPlayerId,
        {
            ivs = PokemonInstanceTests.testIVs,
            nature = PokemonInstanceTests.testNature
        }
    )
    
    TestFramework.assert(pokemon ~= nil, "Pokemon creation with custom IVs should succeed: " .. (error or ""))
    
    -- Verify IVs match
    TestFramework.assert(pokemon.ivs.hp == PokemonInstanceTests.testIVs.hp, "HP IV should match custom value")
    TestFramework.assert(pokemon.ivs.attack == PokemonInstanceTests.testIVs.attack, "Attack IV should match custom value")
    TestFramework.assert(pokemon.nature == PokemonInstanceTests.testNature, "Nature should match custom value")
    
    return true, "Pokemon creation with custom IVs successful"
end

function PokemonInstanceTests.testCreatePokemonWithNickname()
    local nickname = "Bulby"
    local pokemon, error = PokemonManager.createPokemon(
        PokemonInstanceTests.testSpeciesId,
        PokemonInstanceTests.testLevel,
        PokemonInstanceTests.testPlayerId,
        { nickname = nickname }
    )
    
    TestFramework.assert(pokemon ~= nil, "Pokemon creation with nickname should succeed: " .. (error or ""))
    TestFramework.assert(pokemon.nickname == nickname, "Nickname should match")
    
    local displayName = PokemonManager.getDisplayName(pokemon)
    TestFramework.assert(displayName == nickname, "Display name should use nickname")
    
    return true, "Pokemon creation with nickname successful"
end

function PokemonInstanceTests.testCreatePokemonInvalidParameters()
    -- Invalid species ID
    local pokemon1, error1 = PokemonManager.createPokemon(nil, 5, "player")
    TestFramework.assert(pokemon1 == nil, "Should fail with nil species ID")
    
    -- Invalid level
    local pokemon2, error2 = PokemonManager.createPokemon(1, 0, "player")
    TestFramework.assert(pokemon2 == nil, "Should fail with level 0")
    
    local pokemon3, error3 = PokemonManager.createPokemon(1, 101, "player")
    TestFramework.assert(pokemon3 == nil, "Should fail with level > 100")
    
    -- Invalid player ID
    local pokemon4, error4 = PokemonManager.createPokemon(1, 5, "")
    TestFramework.assert(pokemon4 == nil, "Should fail with empty player ID")
    
    -- Invalid species (non-existent)
    local pokemon5, error5 = PokemonManager.createPokemon(999999, 5, "player")
    TestFramework.assert(pokemon5 == nil, "Should fail with non-existent species")
    
    return true, "Invalid parameter validation working correctly"
end

-- Pokemon Retrieval Tests

function PokemonInstanceTests.testGetPokemon()
    -- Create a Pokemon first
    local pokemon, error = PokemonManager.createPokemon(
        PokemonInstanceTests.testSpeciesId,
        PokemonInstanceTests.testLevel,
        PokemonInstanceTests.testPlayerId
    )
    TestFramework.assert(pokemon ~= nil, "Pokemon creation should succeed")
    
    -- Test retrieval
    local retrieved = PokemonManager.getPokemon(pokemon.id)
    TestFramework.assert(retrieved ~= nil, "Pokemon retrieval should succeed")
    TestFramework.assert(retrieved.id == pokemon.id, "Retrieved Pokemon ID should match")
    
    -- Test non-existent Pokemon
    local nonExistent = PokemonManager.getPokemon("PKM99999999")
    TestFramework.assert(nonExistent == nil, "Non-existent Pokemon should return nil")
    
    return true, "Pokemon retrieval working correctly"
end

function PokemonInstanceTests.testGetPokemonWithOwnership()
    -- Create a Pokemon
    local pokemon, error = PokemonManager.createPokemon(
        PokemonInstanceTests.testSpeciesId,
        PokemonInstanceTests.testLevel,
        PokemonInstanceTests.testPlayerId
    )
    TestFramework.assert(pokemon ~= nil, "Pokemon creation should succeed")
    
    -- Test valid ownership
    local retrieved, error1 = PokemonManager.getPokemonWithOwnership(pokemon.id, PokemonInstanceTests.testPlayerId)
    TestFramework.assert(retrieved ~= nil, "Owner should be able to access Pokemon: " .. (error1 or ""))
    
    -- Test invalid ownership
    local denied, error2 = PokemonManager.getPokemonWithOwnership(pokemon.id, "different-player")
    TestFramework.assert(denied == nil, "Different player should be denied access")
    TestFramework.assert(string.find(error2, "Access denied"), "Should return access denied error")
    
    return true, "Ownership validation working correctly"
end

function PokemonInstanceTests.testGetPlayerPokemon()
    -- Create multiple Pokemon for the same player
    local pokemon1, error1 = PokemonManager.createPokemon(1, 5, PokemonInstanceTests.testPlayerId)
    local pokemon2, error2 = PokemonManager.createPokemon(2, 10, PokemonInstanceTests.testPlayerId)
    local pokemon3, error3 = PokemonManager.createPokemon(3, 15, "other-player")
    
    TestFramework.assert(pokemon1 ~= nil and pokemon2 ~= nil and pokemon3 ~= nil, "All Pokemon should be created")
    
    -- Get Pokemon for test player
    local playerPokemon = PokemonManager.getPlayerPokemon(PokemonInstanceTests.testPlayerId)
    TestFramework.assert(#playerPokemon == 2, "Should return 2 Pokemon for test player")
    
    -- Verify correct Pokemon returned
    local foundIds = {}
    for _, pkmn in ipairs(playerPokemon) do
        foundIds[pkmn.id] = true
    end
    
    TestFramework.assert(foundIds[pokemon1.id], "Should include first Pokemon")
    TestFramework.assert(foundIds[pokemon2.id], "Should include second Pokemon")
    TestFramework.assert(not foundIds[pokemon3.id], "Should not include other player's Pokemon")
    
    return true, "Player Pokemon retrieval working correctly"
end

-- Pokemon Modification Tests

function PokemonInstanceTests.testAssignNickname()
    -- Create a Pokemon
    local pokemon, error = PokemonManager.createPokemon(
        PokemonInstanceTests.testSpeciesId,
        PokemonInstanceTests.testLevel,
        PokemonInstanceTests.testPlayerId
    )
    TestFramework.assert(pokemon ~= nil, "Pokemon creation should succeed")
    
    -- Assign nickname
    local nickname = "TestName"
    local updated, error1 = PokemonManager.assignNickname(pokemon.id, nickname, PokemonInstanceTests.testPlayerId)
    TestFramework.assert(updated ~= nil, "Nickname assignment should succeed: " .. (error1 or ""))
    TestFramework.assert(updated.nickname == nickname, "Nickname should be assigned")
    
    -- Clear nickname
    local cleared, error2 = PokemonManager.assignNickname(pokemon.id, nil, PokemonInstanceTests.testPlayerId)
    TestFramework.assert(cleared ~= nil, "Nickname clearing should succeed: " .. (error2 or ""))
    TestFramework.assert(cleared.nickname == nil, "Nickname should be cleared")
    
    -- Test ownership validation
    local denied, error3 = PokemonManager.assignNickname(pokemon.id, "Hacked", "other-player")
    TestFramework.assert(denied == nil, "Different player should not be able to change nickname")
    
    return true, "Nickname assignment working correctly"
end

function PokemonInstanceTests.testUpdatePokemonStats()
    -- Create a Pokemon
    local pokemon, error = PokemonManager.createPokemon(
        PokemonInstanceTests.testSpeciesId,
        5,  -- Level 5
        PokemonInstanceTests.testPlayerId
    )
    TestFramework.assert(pokemon ~= nil, "Pokemon creation should succeed")
    
    local originalMaxHp = pokemon.stats.maxHp
    
    -- Level up Pokemon
    local updated, error1 = PokemonManager.updatePokemonStats(
        pokemon.id, 
        { level = 10 }, 
        PokemonInstanceTests.testPlayerId
    )
    TestFramework.assert(updated ~= nil, "Level update should succeed: " .. (error1 or ""))
    TestFramework.assert(updated.level == 10, "Level should be updated")
    TestFramework.assert(updated.stats.maxHp > originalMaxHp, "Max HP should increase with level")
    
    -- Test ownership validation
    local denied, error2 = PokemonManager.updatePokemonStats(pokemon.id, { level = 20 }, "other-player")
    TestFramework.assert(denied == nil, "Different player should not be able to update stats")
    
    return true, "Pokemon stat updates working correctly"
end

-- Ownership and Security Tests

function PokemonInstanceTests.testValidateOwnership()
    -- Create a Pokemon
    local pokemon, error = PokemonManager.createPokemon(
        PokemonInstanceTests.testSpeciesId,
        PokemonInstanceTests.testLevel,
        PokemonInstanceTests.testPlayerId
    )
    TestFramework.assert(pokemon ~= nil, "Pokemon creation should succeed")
    
    -- Test valid ownership
    local valid, error1 = PokemonManager.validateOwnership(pokemon.id, PokemonInstanceTests.testPlayerId)
    TestFramework.assert(valid, "Owner should validate successfully: " .. (error1 or ""))
    
    -- Test invalid ownership
    local invalid, error2 = PokemonManager.validateOwnership(pokemon.id, "other-player")
    TestFramework.assert(not invalid, "Non-owner should not validate")
    TestFramework.assert(string.find(error2, "Access denied"), "Should return access denied error")
    
    -- Test non-existent Pokemon
    local nonExistent, error3 = PokemonManager.validateOwnership("PKM99999999", PokemonInstanceTests.testPlayerId)
    TestFramework.assert(not nonExistent, "Non-existent Pokemon should not validate")
    
    return true, "Ownership validation working correctly"
end

function PokemonInstanceTests.testTransferOwnership()
    -- Create a Pokemon
    local pokemon, error = PokemonManager.createPokemon(
        PokemonInstanceTests.testSpeciesId,
        PokemonInstanceTests.testLevel,
        PokemonInstanceTests.testPlayerId
    )
    TestFramework.assert(pokemon ~= nil, "Pokemon creation should succeed")
    
    local newPlayerId = "new-owner-456"
    
    -- Test valid transfer
    local success, error1 = PokemonManager.transferOwnership(pokemon.id, PokemonInstanceTests.testPlayerId, newPlayerId)
    TestFramework.assert(success, "Ownership transfer should succeed: " .. (error1 or ""))
    
    -- Verify ownership changed
    local transferred = PokemonManager.getPokemon(pokemon.id)
    TestFramework.assert(transferred.playerId == newPlayerId, "Pokemon should belong to new owner")
    
    -- Verify old owner can no longer access
    local denied, error2 = PokemonManager.getPokemonWithOwnership(pokemon.id, PokemonInstanceTests.testPlayerId)
    TestFramework.assert(denied == nil, "Old owner should be denied access")
    
    -- Verify new owner can access
    local accessed, error3 = PokemonManager.getPokemonWithOwnership(pokemon.id, newPlayerId)
    TestFramework.assert(accessed ~= nil, "New owner should be able to access: " .. (error3 or ""))
    
    return true, "Ownership transfer working correctly"
end

-- Experience and Level Tests

function PokemonInstanceTests.testExperienceCalculation()
    local level1Exp = PokemonManager.getExpForLevel(1, "medium-fast")
    local level5Exp = PokemonManager.getExpForLevel(5, "medium-fast")
    local level50Exp = PokemonManager.getExpForLevel(50, "medium-fast")
    
    TestFramework.assert(level1Exp == 0, "Level 1 should require 0 experience")
    TestFramework.assert(level5Exp > level1Exp, "Level 5 should require more experience than level 1")
    TestFramework.assert(level50Exp > level5Exp, "Level 50 should require more experience than level 5")
    
    return true, "Experience calculation working correctly"
end

function PokemonInstanceTests.testLevelFromExperience()
    local level1 = PokemonManager.getLevelFromExp(0, "medium-fast")
    local level5 = PokemonManager.getLevelFromExp(125, "medium-fast")  -- 5^3 = 125
    
    TestFramework.assert(level1 == 1, "0 experience should be level 1")
    TestFramework.assert(level5 >= 5, "125 experience should be level 5 or higher")
    
    return true, "Level from experience working correctly"
end

-- Storage Statistics Tests

function PokemonInstanceTests.testStorageStatistics()
    local initialStats = PokemonManager.getStorageStats()
    
    -- Create some Pokemon
    PokemonManager.createPokemon(1, 5, "player1")
    PokemonManager.createPokemon(2, 10, "player1")
    PokemonManager.createPokemon(3, 15, "player2")
    
    local finalStats = PokemonManager.getStorageStats()
    
    TestFramework.assert(finalStats.totalPokemon == initialStats.totalPokemon + 3, "Total Pokemon count should increase")
    TestFramework.assert(finalStats.playersWithPokemon >= 2, "Should have at least 2 players with Pokemon")
    
    return true, "Storage statistics working correctly"
end

-- Integration Tests

function PokemonInstanceTests.testIntegrationWithStatCalculator()
    -- Create Pokemon with known IVs and nature
    local pokemon, error = PokemonManager.createPokemon(
        PokemonInstanceTests.testSpeciesId,
        PokemonInstanceTests.testLevel,
        PokemonInstanceTests.testPlayerId,
        {
            ivs = PokemonInstanceTests.testIVs,
            nature = PokemonInstanceTests.testNature
        }
    )
    
    TestFramework.assert(pokemon ~= nil, "Pokemon creation should succeed: " .. (error or ""))
    
    -- Get species data for manual calculation
    local speciesData = SpeciesDatabase.getSpecies(PokemonInstanceTests.testSpeciesId)
    TestFramework.assert(speciesData ~= nil, "Species data should be available")
    
    -- Manually calculate stats and compare
    local expectedStats, calcError = StatCalculator.calculateAllStats(
        speciesData.baseStats,
        PokemonInstanceTests.testIVs,
        PokemonInstanceTests.testLevel,
        PokemonInstanceTests.testNature
    )
    
    TestFramework.assert(expectedStats ~= nil, "Manual stat calculation should succeed: " .. (calcError or ""))
    TestFramework.assert(pokemon.stats.hp == expectedStats.hp, "HP should match calculated value")
    TestFramework.assert(pokemon.stats.attack == expectedStats.attack, "Attack should match calculated value")
    
    return true, "Integration with StatCalculator working correctly"
end

function PokemonInstanceTests.testIntegrationWithSpeciesDatabase()
    -- Create Pokemon with valid species
    local pokemon, error = PokemonManager.createPokemon(
        PokemonInstanceTests.testSpeciesId,
        PokemonInstanceTests.testLevel,
        PokemonInstanceTests.testPlayerId
    )
    
    TestFramework.assert(pokemon ~= nil, "Pokemon creation should succeed: " .. (error or ""))
    
    -- Verify species integration
    local speciesData = SpeciesDatabase.getSpecies(pokemon.speciesId)
    TestFramework.assert(speciesData ~= nil, "Species data should be accessible")
    
    local displayName = PokemonManager.getDisplayName(pokemon)
    TestFramework.assert(displayName == speciesData.name, "Display name should match species name when no nickname")
    
    return true, "Integration with SpeciesDatabase working correctly"
end

-- Performance Tests

function PokemonInstanceTests.testCreationPerformance()
    local startTime = os.clock()
    local createdCount = 0
    
    -- Create multiple Pokemon rapidly
    for i = 1, 100 do
        local pokemon, error = PokemonManager.createPokemon(
            1,  -- Bulbasaur
            math.random(1, 50),
            "perf-test-player-" .. i
        )
        if pokemon then
            createdCount = createdCount + 1
        end
    end
    
    local endTime = os.clock()
    local elapsed = endTime - startTime
    
    TestFramework.assert(createdCount == 100, "Should create all 100 Pokemon")
    TestFramework.assert(elapsed < 1.0, "Should create 100 Pokemon in under 1 second, took " .. elapsed .. "s")
    
    return true, "Pokemon creation performance acceptable"
end

-- Test runner
function PokemonInstanceTests.runAllTests()
    local testSuite = TestFramework.TestSuite:new("Pokemon Instance Management Tests")
    
    -- ID Generation Tests
    testSuite:addTest("Generate Unique ID", PokemonInstanceTests.testGenerateUniqueId)
    testSuite:addTest("Validate ID Format", PokemonInstanceTests.testValidateIdFormat)
    
    -- Pokemon Creation Tests
    testSuite:addTest("Create Basic Pokemon", PokemonInstanceTests.testCreateBasicPokemon)
    testSuite:addTest("Create Pokemon with Custom IVs", PokemonInstanceTests.testCreatePokemonWithCustomIVs)
    testSuite:addTest("Create Pokemon with Nickname", PokemonInstanceTests.testCreatePokemonWithNickname)
    testSuite:addTest("Create Pokemon Invalid Parameters", PokemonInstanceTests.testCreatePokemonInvalidParameters)
    
    -- Pokemon Retrieval Tests
    testSuite:addTest("Get Pokemon", PokemonInstanceTests.testGetPokemon)
    testSuite:addTest("Get Pokemon with Ownership", PokemonInstanceTests.testGetPokemonWithOwnership)
    testSuite:addTest("Get Player Pokemon", PokemonInstanceTests.testGetPlayerPokemon)
    
    -- Pokemon Modification Tests
    testSuite:addTest("Assign Nickname", PokemonInstanceTests.testAssignNickname)
    testSuite:addTest("Update Pokemon Stats", PokemonInstanceTests.testUpdatePokemonStats)
    
    -- Ownership and Security Tests
    testSuite:addTest("Validate Ownership", PokemonInstanceTests.testValidateOwnership)
    testSuite:addTest("Transfer Ownership", PokemonInstanceTests.testTransferOwnership)
    
    -- Experience and Level Tests
    testSuite:addTest("Experience Calculation", PokemonInstanceTests.testExperienceCalculation)
    testSuite:addTest("Level from Experience", PokemonInstanceTests.testLevelFromExperience)
    
    -- Storage Statistics Tests
    testSuite:addTest("Storage Statistics", PokemonInstanceTests.testStorageStatistics)
    
    -- Integration Tests
    testSuite:addTest("Integration with StatCalculator", PokemonInstanceTests.testIntegrationWithStatCalculator)
    testSuite:addTest("Integration with SpeciesDatabase", PokemonInstanceTests.testIntegrationWithSpeciesDatabase)
    
    -- Performance Tests
    testSuite:addTest("Creation Performance", PokemonInstanceTests.testCreationPerformance)
    
    -- Run tests with setup/teardown
    testSuite:setSetUp(PokemonInstanceTests.setUp)
    testSuite:setTearDown(PokemonInstanceTests.tearDown)
    
    local results = testSuite:run()
    return results
end

return PokemonInstanceTests