#!/usr/bin/env lua5.3
--[[
Simple integration test runner for Pokemon Management System
This file works around module loading issues by providing a minimal test environment
--]]

-- Set up basic environment
local function setup_environment()
    -- Add ao-processes directory to Lua path
    local base_path = "../.."
    package.path = base_path .. "/?.lua;" .. 
                  base_path .. "/?/init.lua;" .. 
                  base_path .. "/data/?.lua;" .. 
                  base_path .. "/data/?/init.lua;" .. 
                  base_path .. "/game-logic/?.lua;" .. 
                  base_path .. "/game-logic/?/init.lua;" .. 
                  base_path .. "/handlers/?.lua;" .. 
                  base_path .. "/handlers/?/init.lua;" .. 
                  "./?.lua;" .. 
                  "./?/init.lua;" .. 
                  package.path
    
    print("🧪 Pokemon Management Integration Test Runner")
    print("============================================")
    print("Lua Path: " .. package.path)
    print("")
end

-- Mock minimal test framework if full framework not available
local TestFramework = {
    assert = function(condition, message)
        if not condition then
            error("Assertion failed: " .. (message or "no message"))
        end
    end,
    
    TestSuite = {
        new = function(self, name)
            return {
                name = name,
                tests = {},
                addTest = function(self, testName, testFunction)
                    table.insert(self.tests, {name = testName, func = testFunction})
                end,
                setSetUp = function(self, setupFunction)
                    self.setUp = setupFunction
                end,
                setTearDown = function(self, tearDownFunction)
                    self.tearDown = tearDownFunction
                end,
                run = function(self)
                    local results = {total = 0, passed = 0, failed = 0}
                    
                    print("Running test suite: " .. self.name)
                    print("=" .. string.rep("=", #self.name + 20))
                    
                    for _, test in ipairs(self.tests) do
                        results.total = results.total + 1
                        
                        if self.setUp then
                            pcall(self.setUp)
                        end
                        
                        print("🧪 " .. test.name .. "...")
                        local success, result = pcall(test.func)
                        
                        if success then
                            print("✅ " .. test.name .. " - PASSED")
                            results.passed = results.passed + 1
                        else
                            print("❌ " .. test.name .. " - FAILED: " .. tostring(result))
                            results.failed = results.failed + 1
                        end
                        
                        if self.tearDown then
                            pcall(self.tearDown)
                        end
                    end
                    
                    print("\nResults: " .. results.passed .. "/" .. results.total .. " passed")
                    return results
                end
            }
        end
    }
}

-- Test basic module loading
local function test_module_loading()
    print("🔍 Testing module loading...")
    
    local modules_to_test = {
        "data.abilities.ability-database",
        "data.species.species-database",
        "game-logic.pokemon.pokemon-manager",
        "handlers.state-handler",
        "handlers.query-handler"
    }
    
    for _, module_name in ipairs(modules_to_test) do
        local success, module = pcall(require, module_name)
        if success then
            print("✅ " .. module_name .. " loaded successfully")
        else
            print("❌ " .. module_name .. " failed to load: " .. tostring(module))
            return false
        end
    end
    
    print("✅ All essential modules loaded")
    return true
end

-- Basic Pokemon creation test
local function test_pokemon_creation()
    print("🐾 Testing Pokemon creation...")
    
    -- Try to load pokemon manager
    local success, PokemonManager = pcall(require, "game-logic.pokemon.pokemon-manager")
    if not success then
        print("❌ Could not load PokemonManager: " .. tostring(PokemonManager))
        return false
    end
    
    print("✅ PokemonManager module loaded")
    
    -- Try basic function check
    if type(PokemonManager.createPokemon) == "function" then
        print("✅ createPokemon function exists")
    else
        print("❌ createPokemon function not found")
        return false
    end
    
    return true
end

-- Test execution
local function run_basic_tests()
    setup_environment()
    
    local tests = {
        {"Module Loading", test_module_loading},
        {"Pokemon Creation Interface", test_pokemon_creation}
    }
    
    local total = #tests
    local passed = 0
    
    for _, test in ipairs(tests) do
        local name, func = test[1], test[2]
        print("\n" .. string.rep("-", 40))
        local success, result = pcall(func)
        if success and result then
            passed = passed + 1
        else
            print("Test failed: " .. tostring(result))
        end
    end
    
    print("\n" .. string.rep("=", 40))
    print("FINAL RESULTS: " .. passed .. "/" .. total .. " tests passed")
    
    if passed == total then
        print("🎉 All basic tests passed - integration test structure is valid")
        return true
    else
        print("⚠️ Some tests failed - integration test execution needs attention")
        return false
    end
end

-- Execute tests
return run_basic_tests()