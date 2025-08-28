local MovePrevention = require('game-logic.battle.move-prevention')
local Enums = require('data.constants.enums')

local function createTestPokemon(name, battleId, moves)
    return {
        name = name,
        battleId = battleId,
        moves = moves or {},
        level = 50,
        hp = { current = 100, max = 100 }
    }
end

local function createTestMove(moveId, name, category)
    return {
        id = moveId,
        name = name or "Test Move",
        category = category or Enums.MoveCategory.PHYSICAL
    }
end

local function createTestBattleState()
    return {
        moveRestrictions = {},
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
            local result = MovePrevention.init(battleState)
            assert(result.success == true, "Should initialize successfully")
            assert(battleState.moveRestrictions ~= nil, "Should initialize move restrictions")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1")
            local battleState = createTestBattleState()
            
            local result = MovePrevention.applyTaunt(pokemon, battleState, 3)
            assert(result.success == true, "Should apply taunt successfully")
            assert(battleState.moveRestrictions["test1_taunt"] ~= nil, "Should create taunt restriction")
            assert(battleState.moveRestrictions["test1_taunt"].turnsRemaining == 3, "Should set correct duration")
            assert(battleState.moveRestrictions["test1_taunt"].active == true, "Should be active")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1")
            local battleState = createTestBattleState()
            
            local result = MovePrevention.applyTorment(pokemon, battleState)
            assert(result.success == true, "Should apply torment successfully")
            assert(battleState.moveRestrictions["test1_torment"] ~= nil, "Should create torment restriction")
            assert(battleState.moveRestrictions["test1_torment"].active == true, "Should be active")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1")
            local lastMove = { id = 1, name = "Tackle" }
            local battleState = createTestBattleState()
            
            local result = MovePrevention.applyEncore(pokemon, lastMove, battleState, 3)
            assert(result.success == true, "Should apply encore successfully")
            assert(battleState.moveRestrictions["test1_encore"] ~= nil, "Should create encore restriction")
            assert(battleState.moveRestrictions["test1_encore"].encoreMove == 1, "Should set encore move")
            assert(battleState.moveRestrictions["test1_encore"].turnsRemaining == 3, "Should set correct duration")
        end,
        
        function()
            local user = createTestPokemon("User", "user1", {{id = 1, name = "Tackle"}, {id = 2, name = "Thunder Wave"}})
            local battleState = createTestBattleState()
            
            local result = MovePrevention.applyImprison(user, battleState)
            assert(result.success == true, "Should apply imprison successfully")
            assert(battleState.moveRestrictions["user1_imprison"] ~= nil, "Should create imprison restriction")
            assert(#battleState.moveRestrictions["user1_imprison"].imprisonedMoves == 2, "Should imprison all user moves")
        end,
        
        function()
            local target = createTestPokemon("Target", "target1", {{id = 1, name = "Tackle"}})
            local battleState = createTestBattleState()
            
            local result = MovePrevention.applyDisable(target, 1, battleState, 4)
            assert(result.success == true, "Should apply disable successfully")
            assert(battleState.moveRestrictions["target1_disable"] ~= nil, "Should create disable restriction")
            assert(battleState.moveRestrictions["target1_disable"].disabledMove == 1, "Should set disabled move")
            assert(battleState.moveRestrictions["target1_disable"].turnsRemaining == 4, "Should set correct duration")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1")
            local battleState = createTestBattleState()
            
            MovePrevention.applyTaunt(pokemon, battleState)
            
            local originalGetMove = require('data.moves.move-database').getMove
            require('data.moves.move-database').getMove = function(id)
                return createTestMove(id, "Status Move", Enums.MoveCategory.STATUS)
            end
            
            local result = MovePrevention.checkMoveRestrictions(pokemon, 1, battleState)
            assert(result.allowed == false, "Status moves should be blocked by taunt")
            assert(result.reason == "taunted", "Should provide taunt reason")
            
            require('data.moves.move-database').getMove = originalGetMove
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1")
            local battleState = createTestBattleState()
            
            MovePrevention.applyTorment(pokemon, battleState)
            MovePrevention.updateMoveUsage(pokemon, 1, battleState)
            
            local result = MovePrevention.checkMoveRestrictions(pokemon, 1, battleState)
            assert(result.allowed == false, "Same move should be blocked by torment")
            assert(result.reason == "tormented", "Should provide torment reason")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1")
            local lastMove = { id = 1, name = "Tackle" }
            local battleState = createTestBattleState()
            
            MovePrevention.applyEncore(pokemon, lastMove, battleState)
            
            local result = MovePrevention.checkMoveRestrictions(pokemon, 2, battleState)
            assert(result.allowed == false, "Different move should be blocked by encore")
            assert(result.reason == "encored", "Should provide encore reason")
            
            local result2 = MovePrevention.checkMoveRestrictions(pokemon, 1, battleState)
            assert(result2.allowed == true, "Encore move should be allowed")
        end,
        
        function()
            local target = createTestPokemon("Target", "target1", {{id = 1, name = "Tackle"}})
            local battleState = createTestBattleState()
            
            MovePrevention.applyDisable(target, 1, battleState)
            
            local result = MovePrevention.checkMoveRestrictions(target, 1, battleState)
            assert(result.allowed == false, "Disabled move should be blocked")
            assert(result.reason == "disabled", "Should provide disable reason")
        end,
        
        function()
            local user = createTestPokemon("User", "user1", {{id = 1, name = "Tackle"}})
            local target = createTestPokemon("Target", "target1")
            local battleState = createTestBattleState()
            
            MovePrevention.applyImprison(user, battleState)
            
            local result = MovePrevention.checkMoveRestrictions(target, 1, battleState)
            assert(result.allowed == false, "Imprisoned move should be blocked")
            assert(result.reason == "imprisoned", "Should provide imprison reason")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1")
            local battleState = createTestBattleState()
            
            MovePrevention.applyTaunt(pokemon, battleState, 2)
            assert(battleState.moveRestrictions["test1_taunt"].turnsRemaining == 2, "Should start with 2 turns")
            
            MovePrevention.updateRestrictionStates(battleState)
            assert(battleState.moveRestrictions["test1_taunt"].turnsRemaining == 1, "Should decrease to 1 turn")
            assert(battleState.moveRestrictions["test1_taunt"].active == true, "Should still be active")
            
            MovePrevention.updateRestrictionStates(battleState)
            assert(battleState.moveRestrictions["test1_taunt"].turnsRemaining == 0, "Should decrease to 0 turns")
            assert(battleState.moveRestrictions["test1_taunt"].active == false, "Should become inactive")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1")
            local battleState = createTestBattleState()
            
            MovePrevention.applyTaunt(pokemon, battleState)
            assert(battleState.moveRestrictions["test1_taunt"].active == true, "Should be active before clearing")
            
            local result = MovePrevention.clearRestriction(pokemon, "taunt", battleState)
            assert(result.success == true, "Should clear restriction successfully")
            assert(battleState.moveRestrictions["test1_taunt"].active == false, "Should be inactive after clearing")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1")
            local battleState = createTestBattleState()
            
            MovePrevention.applyTorment(pokemon, battleState)
            MovePrevention.updateMoveUsage(pokemon, 1, battleState)
            
            assert(battleState.moveRestrictions["test1_torment"].lastUsedMove == 1, "Should track last used move")
        end,
        
        function()
            local target = createTestPokemon("Target", "target1")
            local battleState = createTestBattleState()
            
            local result = MovePrevention.applyDisable(target, 999, battleState)
            assert(result.success == false, "Should fail if target doesn't know the move")
            assert(result.error == "Target doesn't know the move", "Should provide appropriate error")
        end
    }
    
    for i, test in ipairs(tests) do
        totalTests = totalTests + 1
        if runTest("Test " .. i, test) then
            passedTests = passedTests + 1
        end
    end
    
    print("\n=== MOVE PREVENTION TEST RESULTS ===")
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