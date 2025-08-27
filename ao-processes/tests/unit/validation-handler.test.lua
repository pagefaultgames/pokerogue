-- validation-handler.test.lua: Unit tests for Game Action Validation Framework

-- Load the validation handler module
package.path = package.path .. ";../../?.lua;../../handlers/?.lua"
local ValidationHandler = require("validation-handler")

-- Simple test framework
local TestRunner = {
    tests = {},
    passed = 0,
    failed = 0
}

function TestRunner.test(name, testFunc)
    table.insert(TestRunner.tests, {name = name, func = testFunc})
end

function TestRunner.run()
    print("Running ValidationHandler Tests...")
    print("=" .. string.rep("=", 50))
    
    for _, test in ipairs(TestRunner.tests) do
        local success, error = pcall(test.func)
        if success then
            print("✓ " .. test.name)
            TestRunner.passed = TestRunner.passed + 1
        else
            print("✗ " .. test.name .. " - " .. tostring(error))
            TestRunner.failed = TestRunner.failed + 1
        end
    end
    
    print("=" .. string.rep("=", 50))
    print(string.format("Results: %d passed, %d failed", TestRunner.passed, TestRunner.failed))
    return TestRunner.failed == 0
end

function TestRunner.assert(condition, message)
    if not condition then
        error(message or "Assertion failed")
    end
end

function TestRunner.assertError(func, expectedErrorCode, message)
    local success, err = pcall(func)
    TestRunner.assert(not success, message or "Expected function to throw error")
    if type(err) == "table" and err.code then
        TestRunner.assert(err.code == expectedErrorCode, 
            string.format("Expected error code %s, got %s", expectedErrorCode, err.code))
    else
        error(string.format("Expected error object with code %s, got %s", expectedErrorCode, type(err)))
    end
end

-- Test Cases

-- Pokemon Stats Validation Tests
TestRunner.test("validatePokemonStats - valid Pokemon", function()
    local pokemonData = {
        level = 50,
        stats = {
            hp = 150,
            attack = 100,
            defense = 80,
            spAttack = 120,
            spDefense = 90,
            speed = 110
        },
        ivs = {
            hp = 31,
            attack = 25,
            defense = 20,
            spAttack = 31,
            spDefense = 15,
            speed = 28
        }
    }
    local result = ValidationHandler.validatePokemonStats(pokemonData)
    TestRunner.assert(result == true, "Should validate correct Pokemon stats")
end)

TestRunner.test("validatePokemonStats - invalid level too high", function()
    local pokemonData = {
        level = 150,  -- Over max of 100
        stats = {hp = 150}
    }
    TestRunner.assertError(function()
        ValidationHandler.validatePokemonStats(pokemonData)
    end, "VAL_002", "Should throw error for level too high")
end)

TestRunner.test("validatePokemonStats - invalid level too low", function()
    local pokemonData = {
        level = 0,  -- Under min of 1
        stats = {hp = 150}
    }
    TestRunner.assertError(function()
        ValidationHandler.validatePokemonStats(pokemonData)
    end, "VAL_002", "Should throw error for level too low")
end)

TestRunner.test("validatePokemonStats - invalid stat too high", function()
    local pokemonData = {
        level = 50,
        stats = {
            hp = 1500  -- Over max of 999
        }
    }
    TestRunner.assertError(function()
        ValidationHandler.validatePokemonStats(pokemonData)
    end, "VAL_002", "Should throw error for stat too high")
end)

TestRunner.test("validatePokemonStats - invalid IV too high", function()
    local pokemonData = {
        level = 50,
        stats = {hp = 150},
        ivs = {
            hp = 50  -- Over max of 31
        }
    }
    TestRunner.assertError(function()
        ValidationHandler.validatePokemonStats(pokemonData)
    end, "VAL_002", "Should throw error for IV too high")
end)

TestRunner.test("validatePokemonStats - missing Pokemon data", function()
    TestRunner.assertError(function()
        ValidationHandler.validatePokemonStats(nil)
    end, "VAL_004", "Should throw error for missing Pokemon data")
end)

-- Move Validation Tests
TestRunner.test("validatePokemonMove - valid move", function()
    local learnedMoves = {
        {id = "tackle", name = "Tackle"},
        {id = "thunderbolt", name = "Thunderbolt"}
    }
    local result = ValidationHandler.validatePokemonMove("pikachu", "tackle", 25, learnedMoves)
    TestRunner.assert(result == true, "Should validate legal move")
end)

TestRunner.test("validatePokemonMove - illegal move", function()
    local learnedMoves = {
        {id = "tackle", name = "Tackle"}
    }
    TestRunner.assertError(function()
        ValidationHandler.validatePokemonMove("pikachu", "thunderbolt", 25, learnedMoves)
    end, "VAL_005", "Should throw error for illegal move")
end)

TestRunner.test("validatePokemonMove - missing data", function()
    TestRunner.assertError(function()
        ValidationHandler.validatePokemonMove(nil, "tackle", 25, {})
    end, "VAL_001", "Should throw error for missing species ID")
end)

-- Moveset Validation Tests
TestRunner.test("validatePokemonMoveset - valid moveset", function()
    local pokemonData = {
        speciesId = "pikachu",
        level = 25,
        moves = {
            {id = "tackle"},
            {id = "thunderbolt"},
            {id = "quick-attack"}
        }
    }
    local moveDatabase = {
        pikachu = {
            {id = "tackle"},
            {id = "thunderbolt"},
            {id = "quick-attack"}
        }
    }
    local result = ValidationHandler.validatePokemonMoveset(pokemonData, moveDatabase)
    TestRunner.assert(result == true, "Should validate legal moveset")
end)

TestRunner.test("validatePokemonMoveset - too many moves", function()
    local pokemonData = {
        speciesId = "pikachu",
        moves = {
            {id = "move1"},
            {id = "move2"},
            {id = "move3"},
            {id = "move4"},
            {id = "move5"}  -- 5 moves, max is 4
        }
    }
    TestRunner.assertError(function()
        ValidationHandler.validatePokemonMoveset(pokemonData, {})
    end, "VAL_001", "Should throw error for too many moves")
end)

-- Battle Action Validation Tests
TestRunner.test("validateBattleAction - valid move action", function()
    local action = {
        type = "move",
        moveId = "tackle"
    }
    local pokemonData = {
        moves = {
            {id = "tackle"},
            {id = "thunderbolt"}
        }
    }
    local result = ValidationHandler.validateBattleAction(action, {}, pokemonData)
    TestRunner.assert(result == true, "Should validate legal move action")
end)

TestRunner.test("validateBattleAction - invalid action type", function()
    local action = {
        type = "invalid_action"
    }
    TestRunner.assertError(function()
        ValidationHandler.validateBattleAction(action, {}, {})
    end, "VAL_007", "Should throw error for invalid action type")
end)

TestRunner.test("validateBattleAction - move without moveId", function()
    local action = {
        type = "move"
        -- Missing moveId
    }
    TestRunner.assertError(function()
        ValidationHandler.validateBattleAction(action, {}, {})
    end, "VAL_001", "Should throw error for move action without moveId")
end)

TestRunner.test("validateBattleAction - unknown move", function()
    local action = {
        type = "move",
        moveId = "unknown_move"
    }
    local pokemonData = {
        moves = {
            {id = "tackle"}
        }
    }
    TestRunner.assertError(function()
        ValidationHandler.validateBattleAction(action, {}, pokemonData)
    end, "VAL_001", "Should throw error for unknown move")
end)

TestRunner.test("validateBattleAction - valid switch action", function()
    local action = {
        type = "switch",
        pokemonIndex = 2
    }
    local result = ValidationHandler.validateBattleAction(action, {}, {})
    TestRunner.assert(result == true, "Should validate legal switch action")
end)

TestRunner.test("validateBattleAction - switch without index", function()
    local action = {
        type = "switch"
        -- Missing pokemonIndex
    }
    TestRunner.assertError(function()
        ValidationHandler.validateBattleAction(action, {}, {})
    end, "VAL_003", "Should throw error for switch without pokemonIndex")
end)

-- Battle Timing Validation Tests
TestRunner.test("validateBattleTiming - valid turn", function()
    local battleState = {
        currentTurn = "player123456789",
        turnStartTime = 1000
    }
    local result = ValidationHandler.validateBattleTiming(battleState, "player123456789", 1020)
    TestRunner.assert(result == true, "Should validate correct turn timing")
end)

TestRunner.test("validateBattleTiming - wrong turn", function()
    local battleState = {
        currentTurn = "player456789123"
    }
    TestRunner.assertError(function()
        ValidationHandler.validateBattleTiming(battleState, "player123456789", 1000)
    end, "VAL_006", "Should throw error for wrong turn")
end)

TestRunner.test("validateBattleTiming - turn timeout", function()
    local battleState = {
        currentTurn = "player123456789",
        turnStartTime = 1000
    }
    TestRunner.assertError(function()
        ValidationHandler.validateBattleTiming(battleState, "player123456789", 1040)  -- 40 seconds later
    end, "VAL_006", "Should throw error for turn timeout")
end)

TestRunner.test("validateBattleTiming - missing battle state", function()
    TestRunner.assertError(function()
        ValidationHandler.validateBattleTiming(nil, "player123456789", 1000)
    end, "VAL_006", "Should throw error for missing battle state")
end)

-- Comprehensive Action Validation Tests
TestRunner.test("validateCompleteAction - valid complete action", function()
    local actionData = {
        playerId = "player123456789",
        timestamp = 1020,
        action = {
            type = "move",
            moveId = "tackle"
        }
    }
    local battleState = {
        currentTurn = "player123456789",
        turnStartTime = 1000
    }
    local playerPokemon = {
        level = 25,
        speciesId = "pikachu",
        stats = {hp = 100},
        moves = {
            {id = "tackle"}
        }
    }
    
    local moveDatabase = {
        pikachu = {
            {id = "tackle"},
            {id = "thunderbolt"}
        }
    }
    local result = ValidationHandler.validateCompleteAction(actionData, battleState, playerPokemon, moveDatabase)
    TestRunner.assert(type(result) == "table", "Should return a table")
    if result.success ~= true then
        print("Error details:", result.error and result.error.message or "No error message")
        if result.error then
            print("Error code:", result.error.code)
        end
    end
    TestRunner.assert(result.success == true, "Should validate complete valid action")
    TestRunner.assert(result.playerId == "player123456789", "Should return correct player ID")
end)

TestRunner.test("validateCompleteAction - invalid complete action", function()
    local actionData = {
        playerId = "player123456789",
        timestamp = 1020,
        action = {
            type = "invalid_type"
        }
    }
    local result = ValidationHandler.validateCompleteAction(actionData, {}, {}, {})
    TestRunner.assert(result.success == false, "Should reject invalid action")
    TestRunner.assert(result.error.code == "VAL_007", "Should return invalid action type error")
end)

-- Error Info Tests
TestRunner.test("getErrorInfo - known error code", function()
    local errorInfo = ValidationHandler.getErrorInfo("VAL_001")
    TestRunner.assert(errorInfo.code == "VAL_001", "Should return correct error code")
    TestRunner.assert(errorInfo.category == "VALIDATION", "Should return validation category")
    TestRunner.assert(type(errorInfo.message) == "string", "Should return error message")
end)

TestRunner.test("getErrorInfo - unknown error code", function()
    local errorInfo = ValidationHandler.getErrorInfo("UNKNOWN")
    TestRunner.assert(errorInfo.code == "UNKNOWN", "Should return provided error code")
    TestRunner.assert(errorInfo.message == "Unknown validation error", "Should return default message")
end)

-- Run all tests
return TestRunner.run()