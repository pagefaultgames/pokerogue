-- Test Helper Module
-- Provides common mocking and setup utilities for unit tests

local TestHelper = {}

-- Mock modules registry
local mockModules = {}

-- Original require function
local originalRequire = require

-- Setup common mocks for AO environment
function TestHelper.setupMockAO()
    -- Mock json global
    json = {
        encode = function(data)
            if type(data) == "table" then
                return "{\"encoded\":\"json\"}"
            end
            return tostring(data)
        end,
        decode = function(str)
            return { decoded = "json" }
        end
    }
    
    -- Mock os functions with deterministic values
    os.time = function() return 1234567890 end
    os.date = function(fmt, timestamp)
        if timestamp then
            return "2025-08-27 10:00:00"
        else
            return "2025-08-27 10:00:00"
        end
    end
    
    -- Mock math.random with predictable sequence
    local randomCounter = 0
    math.random = function(min, max)
        randomCounter = randomCounter + 1
        if min and max then
            return min + (randomCounter % (max - min + 1))
        elseif min then
            return 1 + (randomCounter % min)
        else
            return (randomCounter % 1000) / 1000
        end
    end
    
    -- Mock AO globals if needed
    if not ao then
        ao = {
            crypto = {
                cipher = {
                    issuer = function() return "mock_cipher_issuer" end
                },
                utils = {
                    hash = function(input)
                        -- Simple hash function for testing
                        local hashNum = 0
                        for i = 1, #input do
                            hashNum = hashNum + string.byte(input, i) * (i * 31)
                        end
                        return tostring(math.abs(hashNum))
                    end
                }
            }
        }
    end
end

-- Register a mock module
function TestHelper.registerMockModule(moduleName, mockImplementation)
    mockModules[moduleName] = mockImplementation
end

-- Setup mock require function that handles common module dependencies
function TestHelper.setupMockRequire()
    -- Default mock modules
    local defaultMocks = {
        ["game-logic.rng.crypto-rng"] = {
            random = function(min, max)
                local counter = TestHelper._getRandomCounter()
                if min and max then
                    return min + (counter % (max - min + 1))
                elseif min then
                    return 1 + (counter % min)
                else
                    return (counter % 1000) / 1000
                end
            end,
            initBattleRNG = function(seed) end,
            initGlobalRNG = function(seed) end,
            battleRandomInt = function(min, max) return TestHelper._mockRandom(min, max) end,
            globalRandomInt = function(min, max) return TestHelper._mockRandom(min, max) end,
            battleRandom = function() return TestHelper._mockRandom() / 1000 end,
            globalRandom = function() return TestHelper._mockRandom() / 1000 end,
            resetBattleRNG = function() end,
            getBattleState = function() return { seed = "test", counter = 0 } end
        },
        ["data.abilities.ability-database"] = {
            init = function() end,
            getAbility = function(id) return { id = id, name = "Test Ability" } end,
            getAbilityCount = function() return 46 end
        },
        ["data.species.species-database"] = {
            init = function() end,
            getSpecies = function(id) return { id = id, name = "Test Species" } end
        },
        ["game-logic.pokemon.pokemon-manager"] = {
            createPokemon = function() return { id = "test-pokemon" } end
        }
    }
    
    -- Merge default mocks with registered mocks
    for moduleName, mockImpl in pairs(defaultMocks) do
        if not mockModules[moduleName] then
            mockModules[moduleName] = mockImpl
        end
    end
    
    -- Replace require function
    require = function(moduleName)
        if mockModules[moduleName] then
            return mockModules[moduleName]
        else
            -- Try original require for system modules
            local success, result = pcall(originalRequire, moduleName)
            if success then
                return result
            else
                -- Return empty module to prevent errors
                print("Warning: Mocking unknown module: " .. moduleName)
                return {}
            end
        end
    end
end

-- Internal random counter for consistent behavior
TestHelper._randomCounter = 0

function TestHelper._getRandomCounter()
    TestHelper._randomCounter = TestHelper._randomCounter + 1
    return TestHelper._randomCounter
end

function TestHelper._mockRandom(min, max)
    local counter = TestHelper._getRandomCounter()
    if min and max then
        return min + (counter % (max - min + 1))
    elseif min then
        return 1 + (counter % min)
    else
        return counter % 1000
    end
end

-- Restore original require function
function TestHelper.restoreRequire()
    require = originalRequire
end

-- Setup complete test environment
function TestHelper.setupTestEnvironment()
    TestHelper.setupMockAO()
    TestHelper.setupMockRequire()
end

-- Clean up test environment
function TestHelper.cleanupTestEnvironment()
    TestHelper.restoreRequire()
    TestHelper._randomCounter = 0
end

-- Test framework utilities
function TestHelper.createTestFramework()
    local tests = {}
    local testResults = { passed = 0, failed = 0, errors = {} }
    
    local function runTest(testName, testFunc)
        local success, result = pcall(testFunc)
        if success and result then
            testResults.passed = testResults.passed + 1
            print("✓ " .. testName)
        else
            testResults.failed = testResults.failed + 1
            local errorMsg = result and tostring(result) or "Test failed"
            table.insert(testResults.errors, testName .. ": " .. errorMsg)
            print("✗ " .. testName .. " - " .. errorMsg)
        end
    end
    
    return {
        tests = tests,
        testResults = testResults,
        runTest = runTest
    }
end

return TestHelper