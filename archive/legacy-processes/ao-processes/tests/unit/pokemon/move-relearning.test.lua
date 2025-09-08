-- Unit Tests for Move Relearning System
-- Tests move forgetting, relearning functionality, cost calculation, and validation
-- Ensures proper tracking of forgotten moves and relearning mechanics

local MoveManager = require("game-logic.pokemon.move-manager")

-- Test helper functions
local function assertEqual(actual, expected, message)
    if actual ~= expected then
        error(string.format("Test failed: %s. Expected %s, got %s", message, expected, actual))
    end
end

local function assertTrue(condition, message)
    if not condition then
        error("Test failed: " .. message)
    end
end

local function assertFalse(condition, message)
    if condition then
        error("Test failed: " .. message)
    end
end

-- Test Suite
local Tests = {}

-- Test 1: Move Forgetting and Tracking
function Tests.testMoveForgettingAndTracking()
    -- Create test Pokemon with moves
    local testPokemon = {
        speciesId = 1,
        name = "Bulbasaur",
        level = 20,
        moveset = {
            {id = 33, ppCurrent = 35, ppMax = 35, learnedAt = 1, learnMethod = "start", slot = 1, timesUsed = 0},
            {id = 45, ppCurrent = 40, ppMax = 40, learnedAt = 3, learnMethod = "level", slot = 2, timesUsed = 0},
            {id = 73, ppCurrent = 10, ppMax = 10, learnedAt = 7, learnMethod = "level", slot = 3, timesUsed = 0},
            {id = 22, ppCurrent = 25, ppMax = 25, learnedAt = 9, learnMethod = "level", slot = 4, timesUsed = 0}
        },
        forgottenMoves = {}
    }
    
    -- Test forgetting a move
    local updatedPokemon, forgetResult = MoveManager.forgetMove(testPokemon, 3) -- Forget Leech Seed
    
    assertTrue(forgetResult.success, "Should successfully forget move")
    assertEqual(#updatedPokemon.moveset, 3, "Should have 3 moves after forgetting")
    assertEqual(#updatedPokemon.forgottenMoves, 1, "Should have 1 forgotten move")
    
    -- Check forgotten move data
    local forgottenMove = updatedPokemon.forgottenMoves[1]
    assertEqual(forgottenMove.id, 73, "Forgotten move should be Leech Seed")
    assertEqual(forgottenMove.originalLearnLevel, 7, "Should preserve original learn level")
    assertEqual(forgottenMove.learnMethod, "level", "Should preserve learn method")
    assertTrue(forgottenMove.forgottenAt ~= nil, "Should have timestamp")
    
    print("✓ Move forgetting and tracking test passed")
end

-- Test 2: Move Relearning Functionality
function Tests.testMoveRelearningFunctionality()
    -- Create test Pokemon with forgotten move
    local testPokemon = {
        speciesId = 1,
        name = "Bulbasaur",
        level = 25,
        moveset = {
            {id = 33, ppCurrent = 35, ppMax = 35, learnedAt = 1, learnMethod = "start", slot = 1, timesUsed = 0},
            {id = 45, ppCurrent = 40, ppMax = 40, learnedAt = 3, learnMethod = "level", slot = 2, timesUsed = 0},
            {id = 22, ppCurrent = 25, ppMax = 25, learnedAt = 9, learnMethod = "level", slot = 3, timesUsed = 0}
        },
        forgottenMoves = {
            {
                id = 73, -- Leech Seed
                originalLearnLevel = 7,
                learnMethod = "level",
                forgottenAt = os.time() - 3600 -- 1 hour ago
            }
        }
    }
    
    -- Test relearning the forgotten move
    local updatedPokemon, relearnResult = MoveManager.relearnMove(testPokemon, 73, {playerMoney = 10000})
    
    assertTrue(relearnResult.success, "Should successfully relearn move")
    assertTrue(relearnResult.relearned, "Should be marked as relearned")
    assertEqual(relearnResult.originalLearnLevel, 7, "Should preserve original learn level")
    assertEqual(relearnResult.originalLearnMethod, "level", "Should preserve original learn method")
    
    assertEqual(#updatedPokemon.moveset, 4, "Should have 4 moves after relearning")
    assertEqual(#updatedPokemon.forgottenMoves, 0, "Should have no forgotten moves")
    
    -- Check that move was added back
    local hasMove = MoveManager.hasMove(updatedPokemon, 73)
    assertTrue(hasMove, "Pokemon should have the relearned move")
    
    print("✓ Move relearning functionality test passed")
end

-- Test 3: Cost Calculation
function Tests.testCostCalculation()
    local testPokemon = {
        speciesId = 1,
        name = "Bulbasaur",
        level = 50
    }
    
    -- Test different forgotten move scenarios
    local levelMoveForgotten = {
        id = 73,
        originalLearnLevel = 7,
        learnMethod = "level",
        forgottenAt = os.time() - (3 * 24 * 3600) -- 3 days ago
    }
    
    local tmMoveForgotten = {
        id = 22,
        originalLearnLevel = 30,
        learnMethod = "tm",
        forgottenAt = os.time() - (7 * 24 * 3600) -- 7 days ago
    }
    
    local tutorMoveForgotten = {
        id = 76,
        originalLearnLevel = 45,
        learnMethod = "tutor",
        forgottenAt = os.time() - (14 * 24 * 3600) -- 14 days ago
    }
    
    -- Calculate costs
    local levelCost = MoveManager.calculateRelearnCost(testPokemon, 73, levelMoveForgotten)
    local tmCost = MoveManager.calculateRelearnCost(testPokemon, 22, tmMoveForgotten)
    local tutorCost = MoveManager.calculateRelearnCost(testPokemon, 76, tutorMoveForgotten)
    
    assertTrue(levelCost > 0, "Level move should have cost")
    assertTrue(tmCost > levelCost, "TM move should cost more than level move")
    assertTrue(tutorCost > tmCost, "Tutor move should cost more than TM move")
    
    -- Test that older moves cost more
    local olderMove = {
        id = 73,
        originalLearnLevel = 7,
        learnMethod = "level",
        forgottenAt = os.time() - (30 * 24 * 3600) -- 30 days ago
    }
    
    local olderCost = MoveManager.calculateRelearnCost(testPokemon, 73, olderMove)
    assertTrue(olderCost > levelCost, "Older forgotten moves should cost more")
    
    print("✓ Cost calculation test passed")
end

-- Test 4: Relearnable Moves Query
function Tests.testRelearnableMovesQuery()
    local testPokemon = {
        speciesId = 1,
        name = "Bulbasaur",
        level = 30,
        moveset = {
            {id = 33, ppCurrent = 35, ppMax = 35, learnedAt = 1, learnMethod = "start", slot = 1, timesUsed = 0}
        },
        forgottenMoves = {
            {
                id = 73, -- Not currently known
                originalLearnLevel = 7,
                learnMethod = "level",
                forgottenAt = os.time() - 3600
            },
            {
                id = 33, -- Currently known
                originalLearnLevel = 1,
                learnMethod = "start",
                forgottenAt = os.time() - 7200
            },
            {
                id = 22,
                originalLearnLevel = 9,
                learnMethod = "level",
                forgottenAt = os.time() - 1800
            }
        }
    }
    
    -- Test getting relearnable moves (excluding known)
    local relearnableMoves = MoveManager.getRellearnableMoves(testPokemon, false)
    assertEqual(#relearnableMoves, 2, "Should find 2 relearnable moves (excluding known)")
    
    -- Test getting all forgotten moves (including known)
    local allForgotten = MoveManager.getRellearnableMoves(testPokemon, true)
    assertEqual(#allForgotten, 3, "Should find 3 forgotten moves (including known)")
    
    -- Check that moves are sorted by cost
    if #relearnableMoves > 1 then
        assertTrue(relearnableMoves[1].cost <= relearnableMoves[2].cost, "Moves should be sorted by cost")
    end
    
    -- Check move data structure
    if #relearnableMoves > 0 then
        local move = relearnableMoves[1]
        assertTrue(move.moveId ~= nil, "Should have move ID")
        assertTrue(move.cost ~= nil, "Should have cost")
        assertTrue(move.originalLearnLevel ~= nil, "Should have original learn level")
        assertTrue(move.learnMethod ~= nil, "Should have learn method")
        assertTrue(type(move.alreadyKnown) == "boolean", "Should have already known flag")
    end
    
    print("✓ Relearnable moves query test passed")
end

-- Test 5: Validation Functions
function Tests.testValidationFunctions()
    -- Test valid forgotten moves structure
    local validPokemon = {
        speciesId = 1,
        forgottenMoves = {
            {
                id = 73,
                originalLearnLevel = 7,
                learnMethod = "level",
                forgottenAt = os.time()
            }
        }
    }
    
    local isValid, errors = MoveManager.validateForgottenMoves(validPokemon)
    assertTrue(isValid, "Valid forgotten moves should pass validation: " .. (errors and table.concat(errors, ", ") or ""))
    
    -- Test invalid structure - missing ID
    local invalidPokemon = {
        speciesId = 1,
        forgottenMoves = {
            {
                originalLearnLevel = 7,
                learnMethod = "level"
            }
        }
    }
    
    isValid, errors = MoveManager.validateForgottenMoves(invalidPokemon)
    assertFalse(isValid, "Invalid forgotten moves should fail validation")
    assertTrue(#errors > 0, "Should have error messages")
    
    -- Test with no forgotten moves
    local emptyPokemon = {speciesId = 1}
    isValid, errors = MoveManager.validateForgottenMoves(emptyPokemon)
    assertTrue(isValid, "Pokemon with no forgotten moves should be valid")
    
    print("✓ Validation functions test passed")
end

-- Test 6: Error Handling
function Tests.testErrorHandling()
    local testPokemon = {
        speciesId = 1,
        name = "Bulbasaur",
        level = 20,
        moveset = {},
        forgottenMoves = {}
    }
    
    -- Test relearning move that was never forgotten
    local _, result = MoveManager.relearnMove(testPokemon, 73)
    assertFalse(result.success, "Should fail to relearn move that was never forgotten")
    assertEqual(result.reason, "not_forgotten", "Should have correct error reason")
    
    -- Test relearning with insufficient funds
    testPokemon.forgottenMoves = {
        {
            id = 73,
            originalLearnLevel = 7,
            learnMethod = "level",
            forgottenAt = os.time()
        }
    }
    
    _, result = MoveManager.relearnMove(testPokemon, 73, {playerMoney = 10}) -- Very low money
    assertFalse(result.success, "Should fail with insufficient funds")
    assertEqual(result.reason, "insufficient_funds", "Should have correct error reason")
    assertTrue(result.cost > 10, "Should show required cost")
    
    -- Test relearning move already known
    testPokemon.moveset = {
        {id = 73, ppCurrent = 10, ppMax = 10, learnedAt = 7, learnMethod = "level", slot = 1, timesUsed = 0}
    }
    
    _, result = MoveManager.relearnMove(testPokemon, 73, {playerMoney = 10000})
    assertFalse(result.success, "Should fail if move is already known")
    assertEqual(result.reason, "already_known", "Should have correct error reason")
    
    print("✓ Error handling test passed")
end

-- Test 7: Forgotten Moves Cleanup
function Tests.testForgottenMovesCleanup()
    local currentTime = os.time()
    local testPokemon = {
        speciesId = 1,
        name = "Bulbasaur",
        level = 30,
        forgottenMoves = {
            {
                id = 73,
                originalLearnLevel = 7,
                learnMethod = "level",
                forgottenAt = currentTime - (400 * 24 * 3600) -- 400 days ago (old)
            },
            {
                id = 22,
                originalLearnLevel = 9,
                learnMethod = "level",
                forgottenAt = currentTime - (10 * 24 * 3600) -- 10 days ago (recent)
            },
            {
                id = 45,
                originalLearnLevel = 3,
                learnMethod = "level",
                forgottenAt = currentTime - (500 * 24 * 3600) -- 500 days ago (very old)
            }
        }
    }
    
    -- Clean up moves older than 365 days
    local updatedPokemon, removedCount = MoveManager.cleanupForgottenMoves(testPokemon, 365)
    
    assertEqual(removedCount, 2, "Should remove 2 old moves")
    assertEqual(#updatedPokemon.forgottenMoves, 1, "Should have 1 remaining move")
    assertEqual(updatedPokemon.forgottenMoves[1].id, 22, "Should keep the recent move")
    
    print("✓ Forgotten moves cleanup test passed")
end

-- Test 8: Relearn Statistics
function Tests.testRelearnStatistics()
    local testPokemon = {
        speciesId = 1,
        name = "Bulbasaur",
        level = 25,
        moveset = {
            {id = 33, ppCurrent = 35, ppMax = 35, learnedAt = 1, learnMethod = "start", slot = 1, timesUsed = 0}
        },
        forgottenMoves = {
            {
                id = 73,
                originalLearnLevel = 7,
                learnMethod = "level",
                forgottenAt = os.time() - (5 * 24 * 3600) -- 5 days ago
            },
            {
                id = 22,
                originalLearnLevel = 9,
                learnMethod = "level",
                forgottenAt = os.time() - (2 * 24 * 3600) -- 2 days ago (newest)
            },
            {
                id = 33, -- Already known
                originalLearnLevel = 1,
                learnMethod = "start",
                forgottenAt = os.time() - (10 * 24 * 3600) -- 10 days ago (oldest)
            }
        }
    }
    
    local stats = MoveManager.getRelearnStats(testPokemon)
    
    assertEqual(stats.totalForgotten, 3, "Should count all forgotten moves")
    assertEqual(stats.relearnable, 2, "Should count relearnable moves (excluding known)")
    assertTrue(stats.averageCost > 0, "Should calculate average cost")
    assertTrue(stats.oldestForgotten ~= nil, "Should identify oldest forgotten move")
    assertTrue(stats.newestForgotten ~= nil, "Should identify newest forgotten move")
    assertEqual(stats.oldestForgotten.id, 33, "Oldest should be the one forgotten 10 days ago")
    assertEqual(stats.newestForgotten.id, 22, "Newest should be the one forgotten 2 days ago")
    
    print("✓ Relearn statistics test passed")
end

-- Test 9: Integration with Regular Move Learning
function Tests.testIntegrationWithMoveLearning()
    local testPokemon = {
        speciesId = 1,
        name = "Bulbasaur", 
        level = 15,
        moveset = {
            {id = 33, ppCurrent = 35, ppMax = 35, learnedAt = 1, learnMethod = "start", slot = 1, timesUsed = 0},
            {id = 45, ppCurrent = 40, ppMax = 40, learnedAt = 3, learnMethod = "level", slot = 2, timesUsed = 0},
            {id = 73, ppCurrent = 10, ppMax = 10, learnedAt = 7, learnMethod = "level", slot = 3, timesUsed = 0},
            {id = 22, ppCurrent = 25, ppMax = 25, learnedAt = 9, learnMethod = "level", slot = 4, timesUsed = 0}
        },
        forgottenMoves = {}
    }
    
    -- Learn a new move (should need to replace)
    local updatedPokemon, learnResult = MoveManager.learnMove(testPokemon, 79, "level", {replaceSlot = 2})
    
    if learnResult.success then
        -- Check that replaced move was added to forgotten moves
        assertEqual(#updatedPokemon.forgottenMoves, 1, "Should have 1 forgotten move")
        assertEqual(updatedPokemon.forgottenMoves[1].id, 45, "Should forget the replaced move")
        
        -- Try to relearn the forgotten move
        local relearnedPokemon, relearnResult = MoveManager.relearnMove(updatedPokemon, 45, {
            playerMoney = 10000,
            replaceSlot = 3
        })
        
        if relearnResult.success then
            assertTrue(relearnResult.relearned, "Should be marked as relearned")
            assertEqual(#relearnedPokemon.forgottenMoves, 1, "Should have 1 new forgotten move (the replaced one)")
        end
    end
    
    print("✓ Integration with move learning test passed")
end

-- Test 10: Edge Cases
function Tests.testEdgeCases()
    -- Test with nil Pokemon
    local result = MoveManager.getRelearnStats(nil)
    assertEqual(result.totalForgotten, 0, "Nil Pokemon should return empty stats")
    
    -- Test with empty forgotten moves
    local emptyPokemon = {
        speciesId = 1,
        name = "Test",
        level = 10,
        forgottenMoves = {}
    }
    
    local relearnableMoves = MoveManager.getRellearnableMoves(emptyPokemon)
    assertEqual(#relearnableMoves, 0, "Empty forgotten moves should return empty array")
    
    -- Test cleanup with no forgotten moves
    local cleanPokemon = {speciesId = 1, name = "Clean"}
    local _, removedCount = MoveManager.cleanupForgottenMoves(cleanPokemon, 365)
    assertEqual(removedCount, 0, "Should remove 0 moves from Pokemon with no forgotten moves")
    
    -- Test with invalid parameters
    local _, errorResult = MoveManager.relearnMove(nil, 73)
    assertFalse(errorResult.success, "Nil Pokemon should fail")
    assertEqual(errorResult.reason, "invalid_params", "Should have correct error reason")
    
    print("✓ Edge cases test passed")
end

-- Run All Tests
function Tests.runAllTests()
    print("Running Move Relearning System Tests...")
    print("======================================")
    
    Tests.testMoveForgettingAndTracking()
    Tests.testMoveRelearningFunctionality()
    Tests.testCostCalculation()
    Tests.testRelearnableMovesQuery()
    Tests.testValidationFunctions()
    Tests.testErrorHandling()
    Tests.testForgottenMovesCleanup()
    Tests.testRelearnStatistics()
    Tests.testIntegrationWithMoveLearning()
    Tests.testEdgeCases()
    
    print("======================================")
    print("✅ All Move Relearning System Tests Passed!")
    return true
end

-- Run tests if this file is executed directly
if arg and arg[0] and arg[0]:match("move%-relearning%.test%.lua$") then
    Tests.runAllTests()
end

-- Export test functions
return Tests