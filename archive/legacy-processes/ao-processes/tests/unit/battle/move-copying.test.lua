local MoveCopying = require('game-logic.battle.move-copying')
local Enums = require('data.constants.enums')

local function createTestPokemon(name, battleId, moves)
    return {
        name = name,
        battleId = battleId,
        species = "test_species",
        moves = moves or {},
        level = 50,
        hp = { current = 100, max = 100 }
    }
end

local function createTestMove(moveId, name)
    return {
        id = moveId,
        name = name or "Test Move",
        category = Enums.MoveCategory.PHYSICAL,
        type = Enums.Type.NORMAL,
        power = 80,
        accuracy = 100,
        pp = 10,
        flags = {}
    }
end

local function createTestBattleState()
    return {
        moveHistory = {},
        turnQueue = {},
        turn = 1
    }
end

local function runTest(testName, testFunc)
    print("Testing: " .. testName)
    local success, error = pcall(testFunc)
    if success then
        print("✓ PASSED")
        return true
    else
        print("✗ FAILED: " .. tostring(error))
        return false
    end
end

local function runAllTests()
    local totalTests = 0
    local passedTests = 0
    
    local tests = {
        function()
            local battleState = createTestBattleState()
            local result = MoveCopying.init(battleState)
            assert(result.success == true, "Should initialize successfully")
            assert(battleState.moveHistory ~= nil, "Should initialize move history")
            assert(battleState.turnQueue ~= nil, "Should initialize turn queue")
        end,
        
        function()
            local user = createTestPokemon("User", "user1")
            local copier = createTestPokemon("Copier", "copier1")
            local battleState = createTestBattleState()
            
            local result = MoveCopying.getMirrorMoveTarget(battleState, copier)
            assert(result.success == false, "Should fail with no move history")
            assert(result.reason == "no_valid_move_to_mirror", "Should provide appropriate reason")
        end,
        
        function()
            local user = createTestPokemon("User", "user1")
            local copier = createTestPokemon("Copier", "copier1")
            local battleState = createTestBattleState()
            local moveData = createTestMove(1, "Tackle")
            
            table.insert(battleState.moveHistory, {
                user = user,
                target = copier,
                moveData = moveData
            })
            
            local result = MoveCopying.getMirrorMoveTarget(battleState, copier)
            assert(result.success == true, "Should find valid move to mirror")
            assert(result.moveId == 1, "Should return correct move ID")
            assert(result.originalUser == user, "Should return original user")
        end,
        
        function()
            local user = createTestPokemon("User", "user1")
            local copier = createTestPokemon("Copier", "copier1")
            local battleState = createTestBattleState()
            
            local result = MoveCopying.getCopycatTarget(battleState, copier)
            assert(result.success == false, "Should fail with no moves used")
            assert(result.reason == "no_moves_used", "Should provide appropriate reason")
        end,
        
        function()
            local user = createTestPokemon("User", "user1")
            local copier = createTestPokemon("Copier", "copier1")
            local battleState = createTestBattleState()
            local moveData = createTestMove(1, "Tackle")
            
            table.insert(battleState.moveHistory, {
                user = user,
                target = copier,
                moveData = moveData
            })
            
            local result = MoveCopying.getCopycatTarget(battleState, copier)
            assert(result.success == true, "Should find last move for copycat")
            assert(result.moveId == 1, "Should return correct move ID")
        end,
        
        function()
            local user = createTestPokemon("User", "user1")
            local copier = createTestPokemon("Copier", "copier1")
            local battleState = createTestBattleState()
            
            local result = MoveCopying.getMeFirstTarget(battleState, copier, 1)
            assert(result.success == false, "Should fail with no turn queue")
            assert(result.reason == "no_turn_queue", "Should provide appropriate reason")
        end,
        
        function()
            local user = createTestPokemon("User", "user1")
            local copier = createTestPokemon("Copier", "copier1")
            local battleState = createTestBattleState()
            
            table.insert(battleState.turnQueue, {
                pokemon = user,
                action = { type = "move", moveId = 1 }
            })
            
            local originalGetMove = require('data.moves.move-database').getMove
            require('data.moves.move-database').getMove = function(id)
                if id == 1 then
                    return createTestMove(1, "Tackle")
                end
                return originalGetMove(id)
            end
            
            local result = MoveCopying.getMeFirstTarget(battleState, copier, 1)
            assert(result.success == true, "Should find valid target move for Me First")
            assert(result.powerBoost == 1.5, "Should include power boost")
            
            require('data.moves.move-database').getMove = originalGetMove
        end,
        
        function()
            local pokemon = createTestPokemon("Sketcher", "sketcher1", {{id = Enums.Move.SKETCH, name = "Sketch"}})
            local battleState = createTestBattleState()
            
            local result = MoveCopying.executeSketch(pokemon, 1, battleState)
            assert(result.success == true, "Should successfully sketch move")
            assert(pokemon.moves[1].id == 1, "Should replace Sketch with new move")
            assert(pokemon.moves[1].learnedBy == "sketch", "Should mark as learned by sketch")
        end,
        
        function()
            local pokemon = createTestPokemon("Sketcher", "sketcher1", {{id = 1, name = "Tackle"}})
            local battleState = createTestBattleState()
            
            local result = MoveCopying.executeSketch(pokemon, 1, battleState)
            assert(result.success == false, "Should fail if move already known")
            assert(result.reason == "already_known", "Should provide appropriate reason")
        end,
        
        function()
            local user = createTestPokemon("User", "user1")
            local copier = createTestPokemon("Copier", "copier1")
            local battleState = createTestBattleState()
            local moveData = createTestMove(1, "Tackle")
            
            table.insert(battleState.moveHistory, {
                user = user,
                target = copier,
                moveData = moveData
            })
            
            local originalGetMove = require('data.moves.move-database').getMove
            require('data.moves.move-database').getMove = function(id)
                if id == 1 then
                    return createTestMove(1, "Tackle")
                end
                return originalGetMove(id)
            end
            
            local result = MoveCopying.processCopyMove(Enums.Move.MIRROR_MOVE, copier, battleState, 1)
            assert(result.success == true, "Should successfully process Mirror Move")
            assert(result.copiedMove ~= nil, "Should return copied move data")
            assert(result.copiedMove.copied == true, "Should mark as copied")
            assert(result.copiedMove.originalMove == Enums.Move.MIRROR_MOVE, "Should track original move")
            
            require('data.moves.move-database').getMove = originalGetMove
        end,
        
        function()
            local copier = createTestPokemon("Copier", "copier1")
            local battleState = createTestBattleState()
            
            local result = MoveCopying.processCopyMove(999, copier, battleState, 1)
            assert(result.success == false, "Should fail for unknown copy move")
            assert(result.error == "Unknown copy move", "Should provide appropriate error")
        end,
        
        function()
            local user = createTestPokemon("User", "user1")
            local copier = createTestPokemon("Copier", "copier1")
            local battleState = createTestBattleState()
            
            local result = MoveCopying.getSketchTarget(battleState, copier)
            assert(result == nil, "Should return nil with no move history")
        end,
        
        function()
            local user = createTestPokemon("User", "user1")
            local copier = createTestPokemon("Copier", "copier1")
            local battleState = createTestBattleState()
            local moveData = createTestMove(1, "Tackle")
            
            table.insert(battleState.moveHistory, {
                user = user,
                moveData = moveData
            })
            
            local result = MoveCopying.getSketchTarget(battleState, copier)
            assert(result == 1, "Should return valid move ID for sketch")
        end
    }
    
    for i, test in ipairs(tests) do
        totalTests = totalTests + 1
        if runTest("Test " .. i, test) then
            passedTests = passedTests + 1
        end
    end
    
    print("\n=== MOVE COPYING TEST RESULTS ===")
    print("Total tests: " .. totalTests)
    print("Passed: " .. passedTests)
    print("Failed: " .. (totalTests - passedTests))
    print("Success rate: " .. math.floor((passedTests / totalTests) * 100) .. "%")
    
    return passedTests == totalTests
end

if not pcall(debug.getlocal, 4, 1) then
    runAllTests()
end

return {
    runAllTests = runAllTests
}