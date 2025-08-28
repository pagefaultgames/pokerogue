local ReflectionSystem = require('game-logic.battle.reflection-system')
local Enums = require('data.constants.enums')

local function createTestPokemon(name, battleId, ability)
    return {
        name = name,
        battleId = battleId,
        ability = ability or nil,
        level = 50,
        hp = { current = 100, max = 100 }
    }
end

local function createTestMove(moveId, category, target, flags)
    return {
        id = moveId,
        name = "Test Move",
        category = category or Enums.MoveCategory.STATUS,
        type = Enums.Type.NORMAL,
        target = target or Enums.MoveTarget.SELECTED_POKEMON,
        flags = flags or {}
    }
end

local function createTestBattleState()
    return {
        protectionStates = {},
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
            local result = ReflectionSystem.init(battleState)
            assert(result.success == true, "Should initialize successfully")
            assert(battleState.protectionStates ~= nil, "Should initialize protection states")
        end,
        
        function()
            local user = createTestPokemon("User", "user1")
            local target = createTestPokemon("Target", "target1")
            local move = createTestMove(1, Enums.MoveCategory.PHYSICAL)
            local battleState = createTestBattleState()
            
            local result = ReflectionSystem.checkForReflection(move, target, user, battleState)
            assert(result.reflected == false, "Physical moves should not be reflected")
        end,
        
        function()
            local user = createTestPokemon("User", "user1")
            local target = createTestPokemon("Target", "target1")
            local move = createTestMove(1, Enums.MoveCategory.STATUS)
            local battleState = createTestBattleState()
            
            local result = ReflectionSystem.checkForReflection(move, target, user, battleState)
            assert(result.reflected == false, "Status moves should not reflect without Magic Coat or Magic Bounce")
        end,
        
        function()
            local user = createTestPokemon("User", "user1")
            local target = createTestPokemon("Target", "target1", Enums.Ability.MAGIC_BOUNCE)
            local move = createTestMove(1, Enums.MoveCategory.STATUS)
            local battleState = createTestBattleState()
            
            local result = ReflectionSystem.checkForReflection(move, target, user, battleState)
            assert(result.reflected == true, "Status moves should reflect with Magic Bounce")
            assert(result.newTarget == user, "Should reflect back to original user")
            assert(result.newUser == target, "Target becomes new user")
            assert(result.reflectionType == "magic_bounce", "Should indicate Magic Bounce reflection")
        end,
        
        function()
            local user = createTestPokemon("User", "user1")
            local target = createTestPokemon("Target", "target1")
            local move = createTestMove(1, Enums.MoveCategory.STATUS)
            local battleState = createTestBattleState()
            
            ReflectionSystem.activateMagicCoat(target, battleState)
            local result = ReflectionSystem.checkForReflection(move, target, user, battleState)
            
            assert(result.reflected == true, "Status moves should reflect with Magic Coat")
            assert(result.reflectionType == "magic_coat", "Should indicate Magic Coat reflection")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1")
            local battleState = createTestBattleState()
            
            local result = ReflectionSystem.activateMagicCoat(pokemon, battleState)
            assert(result.success == true, "Magic Coat activation should succeed")
            assert(battleState.protectionStates["test1_reflection"] ~= nil, "Should create reflection state")
            assert(battleState.protectionStates["test1_reflection"].active == true, "Should be active")
            assert(battleState.protectionStates["test1_reflection"].turnsRemaining == 1, "Should last 1 turn")
        end,
        
        function()
            local user = createTestPokemon("User", "user1")
            local target = createTestPokemon("Target", "target1")
            local move = createTestMove(1, Enums.MoveCategory.STATUS, Enums.MoveTarget.SELF)
            local battleState = createTestBattleState()
            
            ReflectionSystem.activateMagicCoat(target, battleState)
            local result = ReflectionSystem.checkForReflection(move, target, user, battleState)
            
            assert(result.reflected == false, "Self-targeting moves should not be reflected")
        end,
        
        function()
            local user = createTestPokemon("User", "user1")
            local target = createTestPokemon("Target", "target1")
            local move = createTestMove(1, Enums.MoveCategory.STATUS, Enums.MoveTarget.SELECTED_POKEMON, {unreflectable = true})
            local battleState = createTestBattleState()
            
            ReflectionSystem.activateMagicCoat(target, battleState)
            local result = ReflectionSystem.checkForReflection(move, target, user, battleState)
            
            assert(result.reflected == false, "Unreflectable moves should not be reflected")
        end,
        
        function()
            local user = createTestPokemon("User", "user1", Enums.Ability.MAGIC_BOUNCE)
            local target = createTestPokemon("Target", "target1", Enums.Ability.MAGIC_BOUNCE)
            local move = createTestMove(1, Enums.MoveCategory.STATUS)
            local battleState = createTestBattleState()
            
            local result = ReflectionSystem.checkForReflection(move, target, user, battleState)
            assert(result.reflected == false, "Should prevent infinite reflection loops")
            assert(result.blocked == true, "Move should be blocked")
            assert(result.reason == "infinite_reflection_prevented", "Should provide prevention reason")
        end,
        
        function()
            local moveData = { id = 1, name = "Test Move", category = Enums.MoveCategory.STATUS }
            local originalTarget = createTestPokemon("OriginalTarget", "original")
            local originalUser = createTestPokemon("OriginalUser", "user")
            local newTarget = createTestPokemon("NewTarget", "new")
            
            local reflectionResult = {
                reflected = true,
                newTarget = newTarget,
                newUser = originalTarget,
                reflectionType = "magic_bounce"
            }
            
            local processedMove, processedTarget, processedUser = ReflectionSystem.processReflection(reflectionResult, moveData, {})
            
            assert(processedMove.reflected == true, "Processed move should be marked as reflected")
            assert(processedTarget == newTarget, "Should use new target")
            assert(processedUser == originalTarget, "Should use reflected user")
        end,
        
        function()
            local battleState = createTestBattleState()
            local pokemon = createTestPokemon("Test", "test1")
            
            ReflectionSystem.activateMagicCoat(pokemon, battleState)
            assert(battleState.protectionStates["test1_reflection"].turnsRemaining == 1, "Should start with 1 turn")
            
            ReflectionSystem.updateReflectionStates(battleState)
            assert(battleState.protectionStates["test1_reflection"].turnsRemaining == 0, "Should decrease to 0")
            assert(battleState.protectionStates["test1_reflection"].active == false, "Should become inactive")
        end
    }
    
    for i, test in ipairs(tests) do
        totalTests = totalTests + 1
        if runTest("Test " .. i, test) then
            passedTests = passedTests + 1
        end
    end
    
    print("\n=== REFLECTION SYSTEM TEST RESULTS ===")
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