-- progress-validator.test.lua: Unit tests for Progress and Content Validation

-- Load the validation handler and create mock progress validator
package.path = package.path .. ";../../?.lua;../../handlers/?.lua;../../game-logic/pokemon/?.lua"

-- Mock progress validator for testing (would normally be a separate module)
local ProgressValidator = {}

-- Constants
local PROGRESS_ERRORS = {
    CONTENT_SKIP = "PROG_001",
    INVALID_EXPERIENCE = "PROG_002",
    ILLEGAL_ITEM = "PROG_003",
    STATE_CORRUPTION = "PROG_004",
    INVALID_LEVEL_UP = "PROG_005"
}

local GAME_CONSTANTS = {
    MAX_POKEMON_LEVEL = 100,
    LEVEL_EXP_REQUIREMENTS = {
        [1] = 0,
        [2] = 8,
        [5] = 125,
        [10] = 1000,
        [25] = 15625,
        [50] = 125000,
        [100] = 1000000
    },
    AVAILABLE_AREAS = {"starter_town", "route_1", "forest", "city_1"},
    REQUIRED_PROGRESSION = {
        route_1 = {"starter_town"},
        forest = {"starter_town", "route_1"},
        city_1 = {"starter_town", "route_1", "forest"}
    }
}

function ProgressValidator.validateExperienceGain(pokemonData, expGained, battleContext)
    if not pokemonData or not expGained then
        error({
            code = PROGRESS_ERRORS.INVALID_EXPERIENCE,
            message = "Pokemon data and experience amount required",
            success = false
        })
    end
    
    if expGained < 0 then
        error({
            code = PROGRESS_ERRORS.INVALID_EXPERIENCE,
            message = "Experience gain cannot be negative",
            success = false
        })
    end
    
    if expGained > 10000 then  -- Reasonable max exp per battle
        error({
            code = PROGRESS_ERRORS.INVALID_EXPERIENCE,
            message = "Experience gain exceeds maximum per battle",
            success = false
        })
    end
    
    return true
end

function ProgressValidator.validateLevelUp(pokemonData, newLevel)
    if not pokemonData or not newLevel then
        error({
            code = PROGRESS_ERRORS.INVALID_LEVEL_UP,
            message = "Pokemon data and new level required",
            success = false
        })
    end
    
    local currentLevel = pokemonData.level or 1
    
    if newLevel <= currentLevel then
        error({
            code = PROGRESS_ERRORS.INVALID_LEVEL_UP,
            message = "New level must be higher than current level",
            success = false
        })
    end
    
    if newLevel > GAME_CONSTANTS.MAX_POKEMON_LEVEL then
        error({
            code = PROGRESS_ERRORS.INVALID_LEVEL_UP,
            message = "Level cannot exceed maximum",
            success = false
        })
    end
    
    -- Check if Pokemon has enough experience for level
    local requiredExp = GAME_CONSTANTS.LEVEL_EXP_REQUIREMENTS[newLevel] or (newLevel ^ 3)
    if pokemonData.experience and pokemonData.experience < requiredExp then
        error({
            code = PROGRESS_ERRORS.INVALID_LEVEL_UP,
            message = "Insufficient experience for level up",
            success = false
        })
    end
    
    return true
end

function ProgressValidator.validateContentProgression(playerData, requestedArea)
    if not playerData or not requestedArea then
        error({
            code = PROGRESS_ERRORS.CONTENT_SKIP,
            message = "Player data and requested area required",
            success = false
        })
    end
    
    local visitedAreas = playerData.visitedAreas or {}
    local requiredAreas = GAME_CONSTANTS.REQUIRED_PROGRESSION[requestedArea] or {}
    
    for _, requiredArea in ipairs(requiredAreas) do
        local hasVisited = false
        for _, visitedArea in ipairs(visitedAreas) do
            if visitedArea == requiredArea then
                hasVisited = true
                break
            end
        end
        
        if not hasVisited then
            error({
                code = PROGRESS_ERRORS.CONTENT_SKIP,
                message = string.format("Must visit %s before accessing %s", requiredArea, requestedArea),
                success = false
            })
        end
    end
    
    return true
end

function ProgressValidator.validateItemAcquisition(playerData, itemId, quantity, acquisitionMethod)
    if not playerData or not itemId or not quantity then
        error({
            code = PROGRESS_ERRORS.ILLEGAL_ITEM,
            message = "Player data, item ID and quantity required",
            success = false
        })
    end
    
    if quantity <= 0 then
        error({
            code = PROGRESS_ERRORS.ILLEGAL_ITEM,
            message = "Item quantity must be positive",
            success = false
        })
    end
    
    -- Check against item availability in current areas
    local currentArea = playerData.currentArea
    local areaItems = {
        starter_town = {"pokeball", "potion"},
        route_1 = {"pokeball", "potion", "antidote"},
        forest = {"pokeball", "potion", "antidote", "berry"},
        city_1 = {"pokeball", "potion", "antidote", "berry", "super_potion"}
    }
    
    if currentArea and areaItems[currentArea] then
        local itemAvailable = false
        for _, availableItem in ipairs(areaItems[currentArea]) do
            if availableItem == itemId then
                itemAvailable = true
                break
            end
        end
        
        if not itemAvailable and acquisitionMethod == "purchase" then
            error({
                code = PROGRESS_ERRORS.ILLEGAL_ITEM,
                message = string.format("Item %s not available in %s", itemId, currentArea),
                success = false
            })
        end
    end
    
    return true
end

function ProgressValidator.validateStateConsistency(gameState)
    if not gameState then
        error({
            code = PROGRESS_ERRORS.STATE_CORRUPTION,
            message = "Game state required for validation",
            success = false
        })
    end
    
    local playerData = gameState.player
    if not playerData then
        error({
            code = PROGRESS_ERRORS.STATE_CORRUPTION,
            message = "Player data missing from game state",
            success = false
        })
    end
    
    -- Validate Pokemon party consistency
    if playerData.party then
        for i, pokemon in ipairs(playerData.party) do
            if pokemon.level and pokemon.experience then
                local minExpForLevel = GAME_CONSTANTS.LEVEL_EXP_REQUIREMENTS[pokemon.level] or (pokemon.level ^ 3)
                if pokemon.experience < minExpForLevel then
                    error({
                        code = PROGRESS_ERRORS.STATE_CORRUPTION,
                        message = string.format("Pokemon %d has insufficient experience for level %d", i, pokemon.level),
                        success = false
                    })
                end
            end
        end
    end
    
    return true
end

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
    print("Running ProgressValidator Tests...")
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

-- Experience Validation Tests
TestRunner.test("validateExperienceGain - valid experience", function()
    local pokemonData = {level = 25, experience = 15625}
    local result = ProgressValidator.validateExperienceGain(pokemonData, 500, {})
    TestRunner.assert(result == true, "Should validate reasonable experience gain")
end)

TestRunner.test("validateExperienceGain - negative experience", function()
    local pokemonData = {level = 25}
    TestRunner.assertError(function()
        ProgressValidator.validateExperienceGain(pokemonData, -100, {})
    end, "PROG_002", "Should reject negative experience")
end)

TestRunner.test("validateExperienceGain - excessive experience", function()
    local pokemonData = {level = 25}
    TestRunner.assertError(function()
        ProgressValidator.validateExperienceGain(pokemonData, 20000, {})
    end, "PROG_002", "Should reject excessive experience gain")
end)

-- Level Up Validation Tests  
TestRunner.test("validateLevelUp - valid level up", function()
    local pokemonData = {level = 24, experience = 15625}
    local result = ProgressValidator.validateLevelUp(pokemonData, 25)
    TestRunner.assert(result == true, "Should validate legitimate level up")
end)

TestRunner.test("validateLevelUp - level decrease", function()
    local pokemonData = {level = 25}
    TestRunner.assertError(function()
        ProgressValidator.validateLevelUp(pokemonData, 20)
    end, "PROG_005", "Should reject level decrease")
end)

TestRunner.test("validateLevelUp - exceed max level", function()
    local pokemonData = {level = 99}
    TestRunner.assertError(function()
        ProgressValidator.validateLevelUp(pokemonData, 101)
    end, "PROG_005", "Should reject level above maximum")
end)

TestRunner.test("validateLevelUp - insufficient experience", function()
    local pokemonData = {level = 1, experience = 5}  -- Not enough for level 25
    TestRunner.assertError(function()
        ProgressValidator.validateLevelUp(pokemonData, 25)
    end, "PROG_005", "Should reject level up with insufficient experience")
end)

-- Content Progression Tests
TestRunner.test("validateContentProgression - valid progression", function()
    local playerData = {
        visitedAreas = {"starter_town", "route_1"}
    }
    local result = ProgressValidator.validateContentProgression(playerData, "forest")
    TestRunner.assert(result == true, "Should allow access to forest after prerequisites")
end)

TestRunner.test("validateContentProgression - skip content", function()
    local playerData = {
        visitedAreas = {"starter_town"}  -- Missing route_1
    }
    TestRunner.assertError(function()
        ProgressValidator.validateContentProgression(playerData, "forest")
    end, "PROG_001", "Should prevent skipping required content")
end)

TestRunner.test("validateContentProgression - no prerequisites", function()
    local playerData = {visitedAreas = {}}
    local result = ProgressValidator.validateContentProgression(playerData, "starter_town")
    TestRunner.assert(result == true, "Should allow access to starting area")
end)

-- Item Acquisition Tests
TestRunner.test("validateItemAcquisition - valid purchase", function()
    local playerData = {currentArea = "city_1"}
    local result = ProgressValidator.validateItemAcquisition(playerData, "super_potion", 1, "purchase")
    TestRunner.assert(result == true, "Should allow purchasing available items")
end)

TestRunner.test("validateItemAcquisition - unavailable item", function()
    local playerData = {currentArea = "starter_town"}
    TestRunner.assertError(function()
        ProgressValidator.validateItemAcquisition(playerData, "super_potion", 1, "purchase")
    end, "PROG_003", "Should prevent purchasing unavailable items")
end)

TestRunner.test("validateItemAcquisition - negative quantity", function()
    local playerData = {currentArea = "city_1"}
    TestRunner.assertError(function()
        ProgressValidator.validateItemAcquisition(playerData, "potion", -5, "purchase")
    end, "PROG_003", "Should reject negative quantities")
end)

-- State Consistency Tests
TestRunner.test("validateStateConsistency - valid state", function()
    local gameState = {
        player = {
            party = {
                {level = 25, experience = 15625},
                {level = 10, experience = 1000}
            }
        }
    }
    local result = ProgressValidator.validateStateConsistency(gameState)
    TestRunner.assert(result == true, "Should validate consistent game state")
end)

TestRunner.test("validateStateConsistency - corrupted experience", function()
    local gameState = {
        player = {
            party = {
                {level = 25, experience = 100}  -- Too low for level 25
            }
        }
    }
    TestRunner.assertError(function()
        ProgressValidator.validateStateConsistency(gameState)
    end, "PROG_004", "Should detect experience/level inconsistency")
end)

TestRunner.test("validateStateConsistency - missing player data", function()
    local gameState = {}
    TestRunner.assertError(function()
        ProgressValidator.validateStateConsistency(gameState)
    end, "PROG_004", "Should reject state without player data")
end)

-- Run all tests
return TestRunner.run()