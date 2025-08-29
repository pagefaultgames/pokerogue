-- [FEATURE NAME] Integration Tests  
-- [DESCRIPTION OF WHAT THIS TEST COVERS]
-- Tests [SPECIFIC FUNCTIONALITY] within complete battle workflows

-- =============================================================================
-- IMPORTANT: Use this template for all new integration tests to avoid path issues
-- =============================================================================

-- Use standardized test setup (REQUIRED)
local TestSetup = require("test-setup")
local TestFramework = TestSetup.setupLuaPath()
TestSetup.initializeTestEnvironment()

-- Load required modules
local YourModule = require("game-logic.battle.your-module")
local OtherModule = require("game-logic.other.module")

-- Mock test environment
local mockBattleState = nil

-- Use standardized test utilities
local createBattleState = TestSetup.createStandardBattleState
local createPokemon = TestSetup.createStandardPokemon
local TestEnums = TestSetup.TestEnums

-- Test runner utilities
local tests = {}
local testCount = 0
local passCount = 0

local function assert(condition, message)
    if not condition then
        error("Integration test assertion failed: " .. (message or "no message"))
    end
end

local function assertEquals(expected, actual, message)
    if expected ~= actual then
        error(string.format("Integration test assertion failed: expected %s, got %s. %s", 
              tostring(expected), tostring(actual), message or ""))
    end
end

local function runIntegrationTest(testName, testFunc)
    testCount = testCount + 1
    print("Running integration test: " .. testName)
    
    -- Set up fresh battle state for each test
    mockBattleState = createBattleState()
    
    local success, error = pcall(testFunc)
    if success then
        passCount = passCount + 1
        print("✅ " .. testName .. " PASSED")
    else
        print("❌ " .. testName .. " FAILED: " .. error)
    end
    print("")
end

-- Integration Tests

-- Test 1: [DESCRIPTIVE NAME]
function tests.testYourFeature()
    -- Mock Enums for this test
    package.loaded["data.constants.enums"] = TestEnums
    
    -- Create test Pokemon using standardized factory
    local pokemon1 = createPokemon({
        name = "TestMon1",
        species = 1,
        level = 50,
        types = {TestEnums.PokemonType.NORMAL},
        side = "player",
        hp = 150
    })
    
    local pokemon2 = createPokemon({
        name = "TestMon2", 
        species = 2,
        level = 50,
        types = {TestEnums.PokemonType.FIRE},
        side = "enemy",
        hp = 150
    })
    
    -- Test your functionality here
    -- Example:
    -- local result = YourModule.doSomething(mockBattleState, pokemon1)
    -- assert(result.success, "Your feature should work")
    -- assertEquals(expected, actual, "Should produce expected result")
end

-- Test 2: [ANOTHER TEST]
function tests.testAnotherFeature()
    package.loaded["data.constants.enums"] = TestEnums
    
    -- More tests...
end

-- Test Runner
function runAllIntegrationTests()
    print("=== [FEATURE NAME] Integration Tests ===")
    print("")
    
    -- Initialize systems if needed
    YourModule.init()
    
    -- Run all integration tests
    for testName, testFunc in pairs(tests) do
        runIntegrationTest(testName, testFunc)
    end
    
    -- Print summary
    print("=== Integration Test Summary ===")
    print("Total tests: " .. testCount)
    print("Passed: " .. passCount)
    print("Failed: " .. (testCount - passCount))
    print("Success rate: " .. string.format("%.1f", (passCount / testCount) * 100) .. "%")
    
    if passCount == testCount then
        print("🎉 All integration tests passed!")
        return true
    else
        print("💥 Some integration tests failed!")
        return false
    end
end

-- Run tests if executed directly
if not package.loaded["test-runner"] then
    runAllIntegrationTests()
end

-- Export for external test runners
return {
    runAllIntegrationTests = runAllIntegrationTests,
    tests = tests
}