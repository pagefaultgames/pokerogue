-- Evolution Chains Unit Tests
-- Tests for evolution chain functionality and validation

-- Adjust package path to find modules from project root
package.path = package.path .. ";../../../?.lua;../../../../?.lua"

local EvolutionChains = require("ao-processes.data.species.evolution-chains").EvolutionChains
local EvolutionTrigger = require("ao-processes.data.species.evolution-chains").EvolutionTrigger

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

print("🧪 Evolution Chains Unit Tests")
print("===============================")

-- Test basic evolution data retrieval  
if runTest("should get evolution data for valid species", function()
    -- Bulbasaur should evolve to Ivysaur at level 16
    local evolutions = EvolutionChains.getEvolutionData(1)
    assertNotNil(evolutions)
    assertEquals(#evolutions, 1)
    assertEquals(evolutions[1].toSpeciesId, 2)
    assertEquals(evolutions[1].trigger, EvolutionTrigger.LEVEL)
    assertEquals(evolutions[1].level, 16)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should return empty table for species with no evolutions", function()
    -- Venusaur (ID 3) should not evolve further
    local evolutions = EvolutionChains.getEvolutionData(3)
    assertNotNil(evolutions)
    assertEquals(#evolutions, 0)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should handle nil species ID gracefully", function()
    local evolutions, error = EvolutionChains.getEvolutionData(nil)
    assertNil(evolutions)
    assertNotNil(error)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test evolution chain retrieval
if runTest("should get complete evolution chain for Bulbasaur line", function()
    local chain = EvolutionChains.getEvolutionChain(1) -- Bulbasaur
    assertNotNil(chain)
    assertEquals(#chain, 3)
    assertEquals(chain[1], 1) -- Bulbasaur
    assertEquals(chain[2], 2) -- Ivysaur
    assertEquals(chain[3], 3) -- Venusaur
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should get evolution chain starting from middle evolution", function()
    local chain = EvolutionChains.getEvolutionChain(2) -- Ivysaur
    assertNotNil(chain)
    assertEquals(#chain, 3)
    assertEquals(chain[1], 1) -- Should start from Bulbasaur
    assertEquals(chain[2], 2) -- Ivysaur
    assertEquals(chain[3], 3) -- Venusaur
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test evolution possibility checking
if runTest("should correctly identify species that can evolve", function()
    assertTrue(EvolutionChains.canEvolve(1)) -- Bulbasaur can evolve
    assertTrue(EvolutionChains.canEvolve(2)) -- Ivysaur can evolve
    assertFalse(EvolutionChains.canEvolve(3)) -- Venusaur cannot evolve
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test possible evolutions
if runTest("should get possible evolutions for Bulbasaur", function()
    local evolutions = EvolutionChains.getPossibleEvolutions(1)
    assertNotNil(evolutions)
    assertEquals(#evolutions, 1)
    assertEquals(evolutions[1].speciesId, 2)
    assertEquals(evolutions[1].trigger, EvolutionTrigger.LEVEL)
    assertEquals(evolutions[1].level, 16)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test pre-evolution lookup
if runTest("should find pre-evolution for evolved species", function()
    assertEquals(EvolutionChains.getPreEvolution(2), 1) -- Ivysaur -> Bulbasaur
    assertEquals(EvolutionChains.getPreEvolution(3), 2) -- Venusaur -> Ivysaur
    assertNil(EvolutionChains.getPreEvolution(1)) -- Bulbasaur has no pre-evolution
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test evolution line checking
if runTest("should identify same evolution line species", function()
    assertTrue(EvolutionChains.isSameEvolutionLine(1, 2)) -- Bulbasaur & Ivysaur
    assertTrue(EvolutionChains.isSameEvolutionLine(1, 3)) -- Bulbasaur & Venusaur
    assertTrue(EvolutionChains.isSameEvolutionLine(2, 3)) -- Ivysaur & Venusaur
    assertFalse(EvolutionChains.isSameEvolutionLine(1, 4)) -- Bulbasaur & Charmander
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test evolution condition validation
if runTest("should validate level-based evolution conditions", function()
    local pokemonData = {
        level = 16,
        stats = { attack = 50, defense = 50 }
    }
    
    local conditions = {
        trigger = EvolutionTrigger.LEVEL,
        level = 16
    }
    
    local canEvolve = EvolutionChains.validateEvolutionConditions(1, pokemonData, conditions)
    assertTrue(canEvolve)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should reject evolution if level too low", function()
    local pokemonData = {
        level = 15,
        stats = { attack = 50, defense = 50 }
    }
    
    local conditions = {
        trigger = EvolutionTrigger.LEVEL,
        level = 16
    }
    
    local canEvolve = EvolutionChains.validateEvolutionConditions(1, pokemonData, conditions)
    assertFalse(canEvolve)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

if runTest("should validate friendship-based evolution conditions", function()
    local pokemonData = {
        level = 10,
        friendship = 220
    }
    
    local conditions = {
        trigger = EvolutionTrigger.FRIENDSHIP,
        friendship = 220
    }
    
    local canEvolve = EvolutionChains.validateEvolutionConditions(1, pokemonData, conditions)
    assertTrue(canEvolve)
end) then
    testsPassed = testsPassed + 1
end
testsRun = testsRun + 1

-- Test evolution data validation
if runTest("should validate evolution data integrity", function()
    local isValid, errors = EvolutionChains.validateEvolutionData()
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

if testsPassed == testsRun then
    print("")
    print("🎉 All evolution chain tests passed!")
else
    print("")
    print("❌ Some tests failed.")
    os.exit(1)
end