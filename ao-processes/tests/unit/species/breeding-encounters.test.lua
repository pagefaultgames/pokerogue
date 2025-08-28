-- Breeding and Encounter Data Unit Tests
-- Tests for breeding compatibility and encounter data systems

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

local function assertTrue(value, message)
    if value ~= true then
        error(message or "Expected true")
    end
end

local function assertFalse(value, message)
    if value ~= false then
        error(message or "Expected false")
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

local function assertTableContains(table, value, message)
    for _, item in ipairs(table or {}) do
        if item == value then
            return
        end
    end
    error(message or ("Table should contain value " .. tostring(value)))
end

-- Test execution function
local function runTest(testName, testFunction)
    local success, err = pcall(testFunction)
    if success then
        print("✅ " .. testName)
        return true
    else
        print("❌ " .. testName .. ": " .. tostring(err))
        return false
    end
end

-- Test execution starts here
local testsRun = 0
local testsPassed = 0

print("🧪 Breeding and Encounter Data Unit Tests")
print("==========================================")

-- Test breeding compatibility functions
if runTest("should get egg groups for species", function()
    local bulbasaurEggGroups = SpeciesDatabase.getEggGroups(1) -- Bulbasaur
    assertNotNil(bulbasaurEggGroups)
    assertEquals(#bulbasaurEggGroups, 2)
    assertTableContains(bulbasaurEggGroups, "MONSTER")
    assertTableContains(bulbasaurEggGroups, "GRASS")
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should identify breeding compatibility for same egg group", function()
    -- Bulbasaur and Charmander both have MONSTER egg group
    local canBreed = SpeciesDatabase.canBreedTogether(1, 4) -- Bulbasaur & Charmander
    assertTrue(canBreed)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should identify same species can breed", function()
    -- Same species should be able to breed (if not genderless)
    local canBreed = SpeciesDatabase.canBreedTogether(1, 1) -- Bulbasaur & Bulbasaur
    assertTrue(canBreed)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should get species by egg group", function()
    local monsterGroup = SpeciesDatabase.getSpeciesByEggGroup("MONSTER")
    assertNotNil(monsterGroup)
    assertTrue(#monsterGroup > 0)
    assertTableContains(monsterGroup, 1) -- Bulbasaur should be in MONSTER group
    assertTableContains(monsterGroup, 4) -- Charmander should be in MONSTER group
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should validate breeding data", function()
    local isValid, error = SpeciesDatabase.validateBreedingData(1) -- Bulbasaur
    assertTrue(isValid)
    assertNil(error)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test encounter data functions
if runTest("should get species rarity", function()
    local bulbasaurRarity = SpeciesDatabase.getRarity(1) -- Bulbasaur
    assertEquals(bulbasaurRarity, "COMMON")
    
    local venusaurRarity = SpeciesDatabase.getRarity(3) -- Venusaur
    assertEquals(venusaurRarity, "RARE")
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should get species encounter rate", function()
    local bulbasaurRate = SpeciesDatabase.getEncounterRate(1) -- Bulbasaur
    assertEquals(bulbasaurRate, 45)
    
    local venusaurRate = SpeciesDatabase.getEncounterRate(3) -- Venusaur
    assertEquals(venusaurRate, 5)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should get species biomes", function()
    local bulbasaurBiomes = SpeciesDatabase.getBiomes(1) -- Bulbasaur
    assertNotNil(bulbasaurBiomes)
    assertEquals(#bulbasaurBiomes, 2)
    assertTableContains(bulbasaurBiomes, "GRASS")
    assertTableContains(bulbasaurBiomes, "FOREST")
    
    local charmanderBiomes = SpeciesDatabase.getBiomes(4) -- Charmander
    assertNotNil(charmanderBiomes)
    assertTableContains(charmanderBiomes, "VOLCANIC")
    assertTableContains(charmanderBiomes, "MOUNTAIN")
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should get species by biome", function()
    local grassSpecies = SpeciesDatabase.getSpeciesByBiome("GRASS")
    assertNotNil(grassSpecies)
    assertTrue(#grassSpecies > 0)
    assertTableContains(grassSpecies, 1) -- Bulbasaur in GRASS
    assertTableContains(grassSpecies, 2) -- Ivysaur in GRASS
    assertTableContains(grassSpecies, 3) -- Venusaur in GRASS
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should get species by rarity", function()
    local commonSpecies = SpeciesDatabase.getSpeciesByRarity("COMMON")
    assertNotNil(commonSpecies)
    assertTrue(#commonSpecies > 0)
    assertTableContains(commonSpecies, 1) -- Bulbasaur is COMMON
    assertTableContains(commonSpecies, 4) -- Charmander is COMMON
    assertTableContains(commonSpecies, 7) -- Squirtle is COMMON
    
    local rareSpecies = SpeciesDatabase.getSpeciesByRarity("RARE")
    assertNotNil(rareSpecies)
    assertTrue(#rareSpecies > 0)
    assertTableContains(rareSpecies, 3) -- Venusaur is RARE
    assertTableContains(rareSpecies, 6) -- Charizard is RARE
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should validate encounter data", function()
    local isValid, error = SpeciesDatabase.validateEncounterData(1) -- Bulbasaur
    assertTrue(isValid)
    assertNil(error)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test edge cases
if runTest("should handle invalid species for breeding", function()
    local canBreed = SpeciesDatabase.canBreedTogether(999, 1000)
    assertFalse(canBreed) -- Invalid species should not breed
    
    local eggGroups = SpeciesDatabase.getEggGroups(999)
    assertEquals(#eggGroups, 0) -- Invalid species should have no egg groups
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should handle invalid species for encounter data", function()
    local rarity = SpeciesDatabase.getRarity(999)
    assertNil(rarity) -- Invalid species should have no rarity
    
    local encounterRate = SpeciesDatabase.getEncounterRate(999)
    assertNil(encounterRate) -- Invalid species should have no encounter rate
    
    local biomes = SpeciesDatabase.getBiomes(999)
    assertEquals(#biomes, 0) -- Invalid species should have no biomes
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should handle empty egg group queries", function()
    local species = SpeciesDatabase.getSpeciesByEggGroup("NONEXISTENT")
    assertNotNil(species)
    assertEquals(#species, 0) -- Non-existent egg group should return empty array
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should handle empty biome queries", function()
    local species = SpeciesDatabase.getSpeciesByBiome("NONEXISTENT")
    assertNotNil(species)
    assertEquals(#species, 0) -- Non-existent biome should return empty array
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should handle empty rarity queries", function()
    local species = SpeciesDatabase.getSpeciesByRarity("NONEXISTENT")
    assertNotNil(species)
    assertEquals(#species, 0) -- Non-existent rarity should return empty array
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Print test summary
print("")
print("📊 Test Results")
print("===============")
print("Total tests: " .. testsRun)
print("Passed: " .. testsPassed)
print("Failed: " .. (testsRun - testsPassed))

if testsPassed == testsRun then
    print("")
    print("🎉 All breeding and encounter tests passed!")
else
    print("")
    print("❌ Some tests failed.")
    os.exit(1)
end