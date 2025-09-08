-- Species Indexes Unit Tests
-- Tests for fast lookup indexes and performance validation

-- Adjust package path to find modules from project root
package.path = package.path .. ";../../../?.lua;../../../../?.lua"

local SpeciesIndexes = require("ao-processes.data.species.species-indexes")
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

-- Performance test helper
local function measureLookupTime(lookupFunction, iterations)
    iterations = iterations or 1000
    local startTime = os.clock()
    
    for i = 1, iterations do
        lookupFunction()
    end
    
    local endTime = os.clock()
    return (endTime - startTime) / iterations -- Average time per lookup
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

print("🧪 Species Indexes Unit Tests")
print("==============================")

-- Test basic index functionality
if runTest("should get species by ID from index", function()
    local bulbasaur = SpeciesIndexes.getSpeciesById(1)
    assertNotNil(bulbasaur)
    assertEquals(bulbasaur.id, 1)
    assertEquals(bulbasaur.name, "Bulbasaur")
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should get species ID by name from index", function()
    local bulbasaurId = SpeciesIndexes.getSpeciesIdByName("Bulbasaur")
    assertEquals(bulbasaurId, 1)
    
    -- Test case insensitive
    local bulbasaurIdLower = SpeciesIndexes.getSpeciesIdByName("bulbasaur")
    assertEquals(bulbasaurIdLower, 1)
    
    -- Test with whitespace
    local bulbasaurIdSpaces = SpeciesIndexes.getSpeciesIdByName(" Bulbasaur ")
    assertEquals(bulbasaurIdSpaces, 1)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test type-based indexes
if runTest("should get species by type from index", function()
    local grassTypes = SpeciesIndexes.getSpeciesByType("GRASS")
    assertNotNil(grassTypes)
    assertTrue(#grassTypes > 0)
    assertTableContains(grassTypes, 1) -- Bulbasaur
    assertTableContains(grassTypes, 2) -- Ivysaur  
    assertTableContains(grassTypes, 3) -- Venusaur
    
    local fireTypes = SpeciesIndexes.getSpeciesByType("FIRE")
    assertNotNil(fireTypes)
    assertTrue(#fireTypes > 0)
    assertTableContains(fireTypes, 4) -- Charmander
    assertTableContains(fireTypes, 5) -- Charmeleon
    assertTableContains(fireTypes, 6) -- Charizard
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test egg group indexes
if runTest("should get species by egg group from index", function()
    local monsterGroup = SpeciesIndexes.getSpeciesByEggGroup("MONSTER")
    assertNotNil(monsterGroup)
    assertTrue(#monsterGroup > 0)
    assertTableContains(monsterGroup, 1) -- Bulbasaur
    assertTableContains(monsterGroup, 4) -- Charmander
    assertTableContains(monsterGroup, 7) -- Squirtle
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test biome indexes
if runTest("should get species by biome from index", function()
    local grassBiome = SpeciesIndexes.getSpeciesByBiome("GRASS")
    assertNotNil(grassBiome)
    assertTrue(#grassBiome > 0)
    assertTableContains(grassBiome, 1) -- Bulbasaur
    assertTableContains(grassBiome, 2) -- Ivysaur
    assertTableContains(grassBiome, 3) -- Venusaur
    
    local volcanicBiome = SpeciesIndexes.getSpeciesByBiome("VOLCANIC")
    assertNotNil(volcanicBiome)
    assertTrue(#volcanicBiome > 0)
    assertTableContains(volcanicBiome, 4) -- Charmander
    assertTableContains(volcanicBiome, 5) -- Charmeleon
    assertTableContains(volcanicBiome, 6) -- Charizard
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test rarity indexes
if runTest("should get species by rarity from index", function()
    local commonSpecies = SpeciesIndexes.getSpeciesByRarity("COMMON")
    assertNotNil(commonSpecies)
    assertTrue(#commonSpecies > 0)
    assertTableContains(commonSpecies, 1) -- Bulbasaur
    assertTableContains(commonSpecies, 4) -- Charmander
    assertTableContains(commonSpecies, 7) -- Squirtle
    
    local rareSpecies = SpeciesIndexes.getSpeciesByRarity("RARE")
    assertNotNil(rareSpecies)
    assertTrue(#rareSpecies > 0)
    assertTableContains(rareSpecies, 3) -- Venusaur
    assertTableContains(rareSpecies, 6) -- Charizard
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test generation indexes
if runTest("should get species by generation from index", function()
    local gen1Species = SpeciesIndexes.getSpeciesByGeneration(1)
    assertNotNil(gen1Species)
    assertTrue(#gen1Species > 0)
    assertTableContains(gen1Species, 1) -- Bulbasaur
    assertTableContains(gen1Species, 4) -- Charmander
    assertTableContains(gen1Species, 7) -- Squirtle
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test BST range indexes
if runTest("should get species by BST range from index", function()
    -- Bulbasaur has BST 318, should be in 300-399 range
    local lowBSTSpecies = SpeciesIndexes.getSpeciesByBSTRange(300, 399)
    assertNotNil(lowBSTSpecies)
    assertTrue(#lowBSTSpecies > 0)
    assertTableContains(lowBSTSpecies, 1) -- Bulbasaur (318)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test index statistics
if runTest("should provide index statistics", function()
    local stats = SpeciesIndexes.getIndexStats()
    assertNotNil(stats)
    assertTrue(stats.totalLookups > 0) -- Some lookups should have occurred
    assertTrue(stats.speciesCount > 0) -- Should have indexed species
    assertNotNil(stats.lastUpdated)
    assertNotNil(stats.indexTypes)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test index validation
if runTest("should validate index integrity", function()
    local isValid, errors = SpeciesIndexes.validateIndexes()
    assertTrue(isValid)
    assertEquals(#errors, 0)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test available indexes
if runTest("should list available index types", function()
    local indexTypes = SpeciesIndexes.getAvailableIndexes()
    assertNotNil(indexTypes)
    assertTrue(#indexTypes > 0)
    assertTableContains(indexTypes, "byId")
    assertTableContains(indexTypes, "byName")
    assertTableContains(indexTypes, "byType")
    assertTableContains(indexTypes, "byEggGroup")
    assertTableContains(indexTypes, "byBiome")
    assertTableContains(indexTypes, "byRarity")
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test edge cases
if runTest("should handle invalid lookups gracefully", function()
    local invalidSpecies = SpeciesIndexes.getSpeciesById(999999)
    assertNil(invalidSpecies)
    
    local invalidName = SpeciesIndexes.getSpeciesIdByName("NonexistentPokemon")
    assertNil(invalidName)
    
    local invalidType = SpeciesIndexes.getSpeciesByType("NONEXISTENT")
    assertEquals(#invalidType, 0)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Performance tests
if runTest("should provide fast ID lookup performance", function()
    local lookupTime = measureLookupTime(function()
        SpeciesIndexes.getSpeciesById(1) -- Bulbasaur lookup
    end, 1000)
    
    -- Lookup should be very fast (less than 0.001 seconds average)
    assertTrue(lookupTime < 0.001, "ID lookup too slow: " .. tostring(lookupTime))
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should provide fast name lookup performance", function()
    local lookupTime = measureLookupTime(function()
        SpeciesIndexes.getSpeciesIdByName("Bulbasaur")
    end, 1000)
    
    -- Name lookup should be fast (less than 0.001 seconds average)
    assertTrue(lookupTime < 0.001, "Name lookup too slow: " .. tostring(lookupTime))
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test index rebuild functionality
if runTest("should rebuild indexes when needed", function()
    local success, message = SpeciesIndexes.rebuildIfNeeded()
    assertTrue(success)
    assertNotNil(message)
    
    -- Validate indexes after rebuild
    local isValid, errors = SpeciesIndexes.validateIndexes()
    assertTrue(isValid)
    assertEquals(#errors, 0)
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

-- Print performance summary
local stats = SpeciesIndexes.getIndexStats()
print("")
print("🚀 Performance Summary")
print("======================")
print("Total lookups performed: " .. stats.totalLookups)
print("Average lookup time: " .. string.format("%.6f", stats.averageLookupTime) .. "s")
print("Species indexed: " .. stats.speciesCount)

if testsPassed == testsRun then
    print("")
    print("🎉 All species index tests passed!")
else
    print("")
    print("❌ Some tests failed.")
    os.exit(1)
end