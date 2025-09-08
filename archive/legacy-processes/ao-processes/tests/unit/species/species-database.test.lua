-- Unit tests for Species Database
-- Validates species data structure, validation functions, and data integrity
-- Following AAA pattern with proper test organization

-- Adjust package path to find modules from project root
package.path = package.path .. ";../../../?.lua;../../../../?.lua"

local SpeciesDatabase = require("ao-processes.data.species.species-database")

-- Test helper functions
local function assertEquals(actual, expected, message)
    if actual ~= expected then
        error(string.format("Assertion failed: %s. Expected: %s, Actual: %s", 
              message or "Values not equal", tostring(expected), tostring(actual)))
    end
end

local function assertNotNil(value, message)
    if value == nil then
        error(message or "Value should not be nil")
    end
end

local function assertNil(value, message)
    if value ~= nil then
        error(message or "Value should be nil")
    end
end

local function assertTableEqual(actual, expected, message)
    if type(actual) ~= "table" or type(expected) ~= "table" then
        error(message or "Both values must be tables")
    end
    
    if #actual ~= #expected then
        error(string.format("%s - Array lengths differ: expected %d, got %d", 
              message or "Tables not equal", #expected, #actual))
    end
    
    for i = 1, #expected do
        if actual[i] ~= expected[i] then
            error(string.format("%s - Element %d differs: expected %s, got %s", 
                  message or "Tables not equal", i, tostring(expected[i]), tostring(actual[i])))
        end
    end
end

local function assertTrue(condition, message)
    if not condition then
        error(message or "Condition should be true")
    end
end

local function assertFalse(condition, message)
    if condition then
        error(message or "Condition should be false")
    end
end

-- Test Suite
local TestSuite = {}

-- Test species database initialization
function TestSuite.testDatabaseInitialization()
    -- Act
    local speciesCount = SpeciesDatabase.getSpeciesCount()
    local allIds = SpeciesDatabase.getAllSpeciesIds()
    
    -- Assert
    assertTrue(speciesCount > 0, "Species database should contain species data")
    assertEquals(#allIds, speciesCount, "getAllSpeciesIds should return count matching getSpeciesCount")
    
    -- Verify expected starter Pokemon exist
    assertTrue(SpeciesDatabase.speciesExists(1), "Bulbasaur should exist (ID: 1)")
    assertTrue(SpeciesDatabase.speciesExists(4), "Charmander should exist (ID: 4)")
    assertTrue(SpeciesDatabase.speciesExists(7), "Squirtle should exist if implemented (ID: 7) or skip")
end

-- Test species retrieval by ID
function TestSuite.testGetSpeciesById()
    -- Arrange
    local bulbasaurId = 1
    
    -- Act
    local bulbasaur = SpeciesDatabase.getSpecies(bulbasaurId)
    local nonExistent = SpeciesDatabase.getSpecies(9999)
    
    -- Assert
    assertNotNil(bulbasaur, "Should retrieve Bulbasaur data")
    assertEquals(bulbasaur.id, bulbasaurId, "Species ID should match")
    assertEquals(bulbasaur.name, "Bulbasaur", "Species name should be correct")
    assertNil(nonExistent, "Non-existent species should return nil")
end

-- Test species retrieval by name
function TestSuite.testGetSpeciesByName()
    -- Arrange & Act
    local bulbasaurByName = SpeciesDatabase.getSpeciesByName("Bulbasaur")
    local bulbasaurLowerCase = SpeciesDatabase.getSpeciesByName("bulbasaur")
    local bulbasaurMixedCase = SpeciesDatabase.getSpeciesByName("BuLbAsAuR")
    local nonExistent = SpeciesDatabase.getSpeciesByName("NonExistentPokemon")
    
    -- Assert
    assertNotNil(bulbasaurByName, "Should find Bulbasaur by exact name")
    assertEquals(bulbasaurByName.id, 1, "Should return correct species data")
    
    assertNotNil(bulbasaurLowerCase, "Should find Bulbasaur by lowercase name")
    assertEquals(bulbasaurLowerCase.id, 1, "Lowercase search should work")
    
    assertNotNil(bulbasaurMixedCase, "Should find Bulbasaur by mixed case name")
    assertEquals(bulbasaurMixedCase.id, 1, "Mixed case search should work")
    
    assertNil(nonExistent, "Non-existent species name should return nil")
end

-- Test species retrieval by type
function TestSuite.testGetSpeciesByType()
    -- Act
    local grassTypes = SpeciesDatabase.getSpeciesByType("GRASS")
    local fireTypes = SpeciesDatabase.getSpeciesByType("FIRE")
    local nonExistentTypes = SpeciesDatabase.getSpeciesByType("NONEXISTENT")
    
    -- Assert
    assertTrue(#grassTypes > 0, "Should find grass-type Pokemon")
    assertTrue(#fireTypes > 0, "Should find fire-type Pokemon")
    assertEquals(#nonExistentTypes, 0, "Non-existent type should return empty array")
    
    -- Verify grass types contain expected Pokemon
    local foundBulbasaur = false
    for _, id in ipairs(grassTypes) do
        if id == 1 then
            foundBulbasaur = true
            break
        end
    end
    assertTrue(foundBulbasaur, "Grass types should include Bulbasaur")
end

-- Test base stats retrieval and format
function TestSuite.testGetBaseStats()
    -- Arrange
    local bulbasaurId = 1
    local expectedStats = {45, 49, 49, 65, 65, 45} -- HP, ATK, DEF, SPATK, SPDEF, SPD
    
    -- Act
    local baseStats = SpeciesDatabase.getBaseStats(bulbasaurId)
    local nonExistentStats = SpeciesDatabase.getBaseStats(9999)
    
    -- Assert
    assertNotNil(baseStats, "Should return base stats for valid species")
    assertTableEqual(baseStats, expectedStats, "Base stats should match expected Bulbasaur stats")
    assertNil(nonExistentStats, "Non-existent species should return nil for base stats")
    
    -- Verify base stats array structure
    assertEquals(#baseStats, 6, "Base stats array should contain exactly 6 elements")
    for i, stat in ipairs(baseStats) do
        assertTrue(type(stat) == "number", string.format("Base stat %d should be a number", i))
        assertTrue(stat >= 0, string.format("Base stat %d should be non-negative", i))
    end
end

-- Test species data validation function
function TestSuite.testValidateSpeciesData()
    -- Act & Assert valid species
    assertTrue(SpeciesDatabase.validateSpeciesData(1), "Bulbasaur should pass validation")
    assertTrue(SpeciesDatabase.validateSpeciesData(4), "Charmander should pass validation")
    
    -- Assert invalid species
    assertFalse(SpeciesDatabase.validateSpeciesData(9999), "Non-existent species should fail validation")
    assertFalse(SpeciesDatabase.validateSpeciesData(nil), "Nil species ID should fail validation")
end

-- Test species data structure completeness
function TestSuite.testSpeciesDataStructure()
    -- Arrange
    local bulbasaur = SpeciesDatabase.getSpecies(1)
    
    -- Assert required fields exist
    local requiredFields = {
        "id", "generation", "subLegendary", "legendary", "mythical", 
        "category", "type1", "height", "weight", "ability1", 
        "baseTotal", "baseStats", "catchRate", "baseFriendship", 
        "baseExp", "growthRate", "malePercent", "genderDiffs", "name"
    }
    
    for _, field in ipairs(requiredFields) do
        assertTrue(bulbasaur[field] ~= nil, string.format("Field '%s' should be present", field))
    end
    
    -- Assert data types
    assertEquals(type(bulbasaur.id), "number", "ID should be number")
    assertEquals(type(bulbasaur.generation), "number", "Generation should be number")
    assertEquals(type(bulbasaur.subLegendary), "boolean", "subLegendary should be boolean")
    assertEquals(type(bulbasaur.legendary), "boolean", "legendary should be boolean")
    assertEquals(type(bulbasaur.mythical), "boolean", "mythical should be boolean")
    assertEquals(type(bulbasaur.category), "string", "Category should be string")
    assertEquals(type(bulbasaur.type1), "string", "Type1 should be string")
    assertEquals(type(bulbasaur.height), "number", "Height should be number")
    assertEquals(type(bulbasaur.weight), "number", "Weight should be number")
    assertEquals(type(bulbasaur.baseStats), "table", "baseStats should be table")
    assertEquals(type(bulbasaur.name), "string", "Name should be string")
end

-- Test dual-type Pokemon structure
function TestSuite.testDualTypePokemon()
    -- Arrange - Bulbasaur is GRASS/POISON
    local bulbasaur = SpeciesDatabase.getSpecies(1)
    
    -- Assert
    assertEquals(bulbasaur.type1, "GRASS", "Bulbasaur primary type should be GRASS")
    assertEquals(bulbasaur.type2, "POISON", "Bulbasaur secondary type should be POISON")
    
    -- Test single-type Pokemon - Charmander is FIRE only
    local charmander = SpeciesDatabase.getSpecies(4)
    assertEquals(charmander.type1, "FIRE", "Charmander primary type should be FIRE")
    assertNil(charmander.type2, "Charmander should not have secondary type")
end

-- Test species existence checking
function TestSuite.testSpeciesExists()
    -- Assert
    assertTrue(SpeciesDatabase.speciesExists(1), "Bulbasaur should exist")
    assertTrue(SpeciesDatabase.speciesExists(4), "Charmander should exist")
    assertFalse(SpeciesDatabase.speciesExists(9999), "Species 9999 should not exist")
    assertFalse(SpeciesDatabase.speciesExists(nil), "Nil species should not exist")
    assertFalse(SpeciesDatabase.speciesExists("invalid"), "Invalid species ID should not exist")
end

-- Test edge cases and error handling
function TestSuite.testEdgeCases()
    -- Test empty string name search
    local emptyResult = SpeciesDatabase.getSpeciesByName("")
    assertNil(emptyResult, "Empty string name should return nil")
    
    -- Test nil inputs
    local nilSpecies = SpeciesDatabase.getSpecies(nil)
    local nilStats = SpeciesDatabase.getBaseStats(nil)
    local nilValidation = SpeciesDatabase.validateSpeciesData(nil)
    
    assertNil(nilSpecies, "getSpecies with nil should return nil")
    assertNil(nilStats, "getBaseStats with nil should return nil")
    assertFalse(nilValidation, "validateSpeciesData with nil should return false")
    
    -- Test negative species ID
    local negativeSpecies = SpeciesDatabase.getSpecies(-1)
    assertNil(negativeSpecies, "Negative species ID should return nil")
end

-- Run all tests
function TestSuite.runAllTests()
    local tests = {
        "testDatabaseInitialization",
        "testGetSpeciesById", 
        "testGetSpeciesByName",
        "testGetSpeciesByType",
        "testGetBaseStats",
        "testValidateSpeciesData",
        "testSpeciesDataStructure",
        "testDualTypePokemon",
        "testSpeciesExists",
        "testEdgeCases"
    }
    
    local passed = 0
    local failed = 0
    
    for _, testName in ipairs(tests) do
        local success, err = pcall(TestSuite[testName])
        if success then
            print(string.format("✓ %s", testName))
            passed = passed + 1
        else
            print(string.format("✗ %s: %s", testName, err))
            failed = failed + 1
        end
    end
    
    print(string.format("\nSpecies Database Tests: %d passed, %d failed", passed, failed))
    return failed == 0
end

-- Export test suite
return TestSuite