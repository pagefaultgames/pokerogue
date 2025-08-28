local SubstituteSystem = require('game-logic.battle.substitute-system')
local Enums = require('data.constants.enums')

local function createTestPokemon(name, battleId, currentHP, maxHP)
    return {
        name = name,
        battleId = battleId,
        hp = { current = currentHP or 100, max = maxHP or 100 },
        level = 50
    }
end

local function createTestMove(moveId, name, category, flags)
    return {
        id = moveId,
        name = name or "Test Move",
        category = category or Enums.MoveCategory.PHYSICAL,
        type = Enums.Type.NORMAL,
        flags = flags or {}
    }
end

local function createTestBattleState()
    return {
        substitutes = {},
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
            local result = SubstituteSystem.init(battleState)
            assert(result.success == true, "Should initialize successfully")
            assert(battleState.substitutes ~= nil, "Should initialize substitutes")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 100, 100)
            local battleState = createTestBattleState()
            
            local result = SubstituteSystem.createSubstitute(pokemon, battleState)
            assert(result.success == true, "Should create substitute successfully")
            assert(pokemon.hp.current == 75, "Should reduce Pokemon HP by 25%")
            assert(battleState.substitutes["test1"] ~= nil, "Should create substitute entry")
            assert(battleState.substitutes["test1"].hp.current == 25, "Substitute should have 25 HP")
            assert(battleState.substitutes["test1"].active == true, "Substitute should be active")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 20, 100)
            local battleState = createTestBattleState()
            
            local result = SubstituteSystem.createSubstitute(pokemon, battleState)
            assert(result.success == false, "Should fail with insufficient HP")
            assert(result.reason == "insufficient_hp", "Should provide insufficient HP reason")
            assert(pokemon.hp.current == 20, "Should not reduce HP on failure")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 100, 100)
            local battleState = createTestBattleState()
            
            SubstituteSystem.createSubstitute(pokemon, battleState)
            local result = SubstituteSystem.createSubstitute(pokemon, battleState)
            
            assert(result.success == false, "Should fail with existing substitute")
            assert(result.reason == "already_has_substitute", "Should provide appropriate reason")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 100, 100)
            local battleState = createTestBattleState()
            
            SubstituteSystem.createSubstitute(pokemon, battleState)
            local result = SubstituteSystem.damageSubstitute(pokemon, 10, battleState)
            
            assert(result.success == true, "Should damage substitute successfully")
            assert(result.damage == 10, "Should deal correct damage")
            assert(result.destroyed == false, "Substitute should not be destroyed")
            assert(battleState.substitutes["test1"].hp.current == 15, "Substitute should have 15 HP remaining")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 100, 100)
            local battleState = createTestBattleState()
            
            SubstituteSystem.createSubstitute(pokemon, battleState)
            local result = SubstituteSystem.damageSubstitute(pokemon, 30, battleState)
            
            assert(result.success == true, "Should damage substitute successfully")
            assert(result.damage == 25, "Should cap damage at substitute HP")
            assert(result.destroyed == true, "Substitute should be destroyed")
            assert(battleState.substitutes["test1"] == nil, "Substitute should be removed")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 100, 100)
            local move = createTestMove(1, "Tackle", Enums.MoveCategory.PHYSICAL)
            local battleState = createTestBattleState()
            
            local result = SubstituteSystem.checkSubstituteInteraction(pokemon, move, battleState)
            assert(result.hasSubstitute == false, "Should detect no substitute")
            assert(result.blocks == false, "Should not block")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 100, 100)
            local move = createTestMove(1, "Tackle", Enums.MoveCategory.PHYSICAL)
            local battleState = createTestBattleState()
            
            SubstituteSystem.createSubstitute(pokemon, battleState)
            local result = SubstituteSystem.checkSubstituteInteraction(pokemon, move, battleState)
            
            assert(result.hasSubstitute == true, "Should detect substitute")
            assert(result.blocks == true, "Should block physical move")
            assert(result.targetSubstitute == true, "Should target substitute")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 100, 100)
            local move = createTestMove(1, "Thunder Wave", Enums.MoveCategory.STATUS)
            local battleState = createTestBattleState()
            
            SubstituteSystem.createSubstitute(pokemon, battleState)
            local result = SubstituteSystem.checkSubstituteInteraction(pokemon, move, battleState)
            
            assert(result.hasSubstitute == true, "Should detect substitute")
            assert(result.blocks == true, "Should block status move")
            assert(result.reason == "status_blocked", "Should provide status block reason")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 100, 100)
            local move = createTestMove(1, "Hyper Voice", Enums.MoveCategory.SPECIAL, {sound = true})
            local battleState = createTestBattleState()
            
            SubstituteSystem.createSubstitute(pokemon, battleState)
            local result = SubstituteSystem.checkSubstituteInteraction(pokemon, move, battleState)
            
            assert(result.hasSubstitute == true, "Should detect substitute")
            assert(result.blocks == false, "Should not block sound move")
            assert(result.bypass == true, "Should bypass substitute")
            assert(result.reason == "substitute_bypass", "Should provide bypass reason")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 100, 100)
            local move = createTestMove(1, "Tackle", Enums.MoveCategory.PHYSICAL)
            local battleState = createTestBattleState()
            
            SubstituteSystem.createSubstitute(pokemon, battleState)
            local result = SubstituteSystem.processDamageWithSubstitute(pokemon, 20, move, battleState)
            
            assert(result.success == true, "Should process damage successfully")
            assert(result.targetHit == false, "Target should not be hit")
            assert(result.substituteHit == true, "Substitute should be hit")
            assert(result.damage == 20, "Should deal full damage to substitute")
            assert(pokemon.hp.current == 75, "Pokemon HP should be unchanged")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 100, 100)
            local move = createTestMove(1, "Thunder Wave", Enums.MoveCategory.STATUS)
            local battleState = createTestBattleState()
            
            SubstituteSystem.createSubstitute(pokemon, battleState)
            local result = SubstituteSystem.processDamageWithSubstitute(pokemon, 0, move, battleState)
            
            assert(result.success == true, "Should process successfully")
            assert(result.targetHit == false, "Target should not be hit")
            assert(result.blocked == true, "Status move should be blocked")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 100, 100)
            local move = createTestMove(1, "Bullet Seed", Enums.MoveCategory.PHYSICAL)
            local battleState = createTestBattleState()
            
            SubstituteSystem.createSubstitute(pokemon, battleState)
            local hitDamages = {10, 10, 10}
            local result = SubstituteSystem.processMultiHitWithSubstitute(pokemon, hitDamages, move, battleState)
            
            assert(result.success == true, "Should process multi-hit successfully")
            assert(#result.hits == 3, "Should process all 3 hits")
            assert(result.totalDamage == 25, "Should cap total damage at substitute HP")
            assert(result.substituteDestroyed == true, "Substitute should be destroyed")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 100, 100)
            local battleState = createTestBattleState()
            
            assert(SubstituteSystem.hasActiveSubstitute(pokemon, battleState) == false, "Should not have substitute initially")
            
            SubstituteSystem.createSubstitute(pokemon, battleState)
            assert(SubstituteSystem.hasActiveSubstitute(pokemon, battleState) == true, "Should have substitute after creation")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 100, 100)
            local battleState = createTestBattleState()
            
            assert(SubstituteSystem.getSubstituteHP(pokemon, battleState) == nil, "Should return nil with no substitute")
            
            SubstituteSystem.createSubstitute(pokemon, battleState)
            local hp = SubstituteSystem.getSubstituteHP(pokemon, battleState)
            assert(hp ~= nil, "Should return HP data with substitute")
            assert(hp.current == 25, "Should return correct current HP")
            assert(hp.max == 25, "Should return correct max HP")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 100, 100)
            local battleState = createTestBattleState()
            
            SubstituteSystem.createSubstitute(pokemon, battleState)
            local result = SubstituteSystem.removeSubstitute(pokemon, battleState)
            
            assert(result.success == true, "Should remove substitute successfully")
            assert(battleState.substitutes["test1"] == nil, "Substitute should be removed")
            assert(SubstituteSystem.hasActiveSubstitute(pokemon, battleState) == false, "Should no longer have substitute")
        end,
        
        function()
            local pokemon = createTestPokemon("Test", "test1", 100, 100)
            local battleState = createTestBattleState()
            
            local result = SubstituteSystem.removeSubstitute(pokemon, battleState)
            assert(result.success == false, "Should fail to remove non-existent substitute")
            assert(result.reason == "no_substitute", "Should provide appropriate reason")
        end
    }
    
    for i, test in ipairs(tests) do
        totalTests = totalTests + 1
        if runTest("Test " .. i, test) then
            passedTests = passedTests + 1
        end
    end
    
    print("\n=== SUBSTITUTE SYSTEM TEST RESULTS ===")
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