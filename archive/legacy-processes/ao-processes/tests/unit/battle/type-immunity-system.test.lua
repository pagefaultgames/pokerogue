-- Type Immunity System Unit Tests
-- Comprehensive test coverage for type-based move immunities
-- Tests Ground vs Electric, Normal/Fighting vs Ghost, and other type immunities

local function runTypeImmunityTests()
    print("Starting Type Immunity System Tests...")
    
    -- Load test dependencies
    local TypeImmunitySystem = require("game-logic.battle.type-immunity-system")
    local Enums = require("data.constants.enums")
    local TypeChart = require("data.constants.type-chart")
    
    local testsPassed = 0
    local totalTests = 0
    
    -- Test helper function
    local function assertEquals(actual, expected, testName)
        totalTests = totalTests + 1
        if actual == expected then
            testsPassed = testsPassed + 1
            print("✓ " .. testName)
        else
            print("✗ " .. testName .. " - Expected: " .. tostring(expected) .. ", Got: " .. tostring(actual))
        end
    end
    
    local function assertNotNil(value, testName)
        totalTests = totalTests + 1
        if value ~= nil then
            testsPassed = testsPassed + 1
            print("✓ " .. testName)
        else
            print("✗ " .. testName .. " - Expected non-nil value")
        end
    end
    
    local function assertTrue(condition, testName)
        totalTests = totalTests + 1
        if condition then
            testsPassed = testsPassed + 1
            print("✓ " .. testName)
        else
            print("✗ " .. testName .. " - Expected true")
        end
    end
    
    -- Test 1: Ground vs Electric Type Immunity
    print("\n--- Test 1: Ground vs Electric Type Immunity ---")
    local isImmune, message = TypeImmunitySystem.checkTypeImmunity(
        Enums.PokemonType.GROUND, 
        {Enums.PokemonType.ELECTRIC}, 
        nil
    )
    assertTrue(not isImmune, "Ground moves should not be immune to Electric types")
    
    -- Test Electric vs Ground immunity (correct direction)
    isImmune, message = TypeImmunitySystem.checkTypeImmunity(
        Enums.PokemonType.ELECTRIC, 
        {Enums.PokemonType.GROUND}, 
        nil
    )
    assertTrue(isImmune, "Electric moves should be immune to Ground types")
    assertNotNil(message, "Should have immunity message")
    
    -- Test 2: Normal vs Ghost Type Immunity
    print("\n--- Test 2: Normal vs Ghost Type Immunity ---")
    isImmune, message = TypeImmunitySystem.checkTypeImmunity(
        Enums.PokemonType.NORMAL, 
        {Enums.PokemonType.GHOST}, 
        nil
    )
    assertTrue(isImmune, "Normal moves should be immune to Ghost types")
    assertTrue(string.find(message, "Ghost"), "Message should mention Ghost type")
    
    -- Test 3: Fighting vs Ghost Type Immunity
    print("\n--- Test 3: Fighting vs Ghost Type Immunity ---")
    isImmune, message = TypeImmunitySystem.checkTypeImmunity(
        Enums.PokemonType.FIGHTING, 
        {Enums.PokemonType.GHOST}, 
        nil
    )
    assertTrue(isImmune, "Fighting moves should be immune to Ghost types")
    assertTrue(string.find(message, "Ghost"), "Message should mention Ghost type")
    
    -- Test 4: Ground vs Flying Type Immunity
    print("\n--- Test 4: Ground vs Flying Type Immunity ---")
    isImmune, message = TypeImmunitySystem.checkTypeImmunity(
        Enums.PokemonType.GROUND, 
        {Enums.PokemonType.FLYING}, 
        nil
    )
    assertTrue(isImmune, "Ground moves should be immune to Flying types")
    assertTrue(string.find(message, "Flying"), "Message should mention Flying type")
    
    -- Test 5: Psychic vs Dark Type Immunity
    print("\n--- Test 5: Psychic vs Dark Type Immunity ---")
    isImmune, message = TypeImmunitySystem.checkTypeImmunity(
        Enums.PokemonType.PSYCHIC, 
        {Enums.PokemonType.DARK}, 
        nil
    )
    assertTrue(isImmune, "Psychic moves should be immune to Dark types")
    assertTrue(string.find(message, "Dark"), "Message should mention Dark type")
    
    -- Test 6: Dragon vs Fairy Type Immunity
    print("\n--- Test 6: Dragon vs Fairy Type Immunity ---")
    isImmune, message = TypeImmunitySystem.checkTypeImmunity(
        Enums.PokemonType.DRAGON, 
        {Enums.PokemonType.FAIRY}, 
        nil
    )
    assertTrue(isImmune, "Dragon moves should be immune to Fairy types")
    assertTrue(string.find(message, "Fairy"), "Message should mention Fairy type")
    
    -- Test 7: Poison vs Steel Type Immunity
    print("\n--- Test 7: Poison vs Steel Type Immunity ---")
    isImmune, message = TypeImmunitySystem.checkTypeImmunity(
        Enums.PokemonType.POISON, 
        {Enums.PokemonType.STEEL}, 
        nil
    )
    assertTrue(isImmune, "Poison moves should be immune to Steel types")
    assertTrue(string.find(message, "Steel"), "Message should mention Steel type")
    
    -- Test 8: Levitate Ability Override
    print("\n--- Test 8: Levitate Ability Override ---")
    isImmune, message = TypeImmunitySystem.checkTypeImmunity(
        Enums.PokemonType.GROUND, 
        {Enums.PokemonType.ELECTRIC}, -- Not normally immune
        Enums.AbilityId.LEVITATE
    )
    assertTrue(isImmune, "Levitate should make Ground moves miss Electric types")
    assertTrue(string.find(message, "Levitate"), "Message should mention Levitate")
    
    -- Test 9: Dual Type Immunity Check
    print("\n--- Test 9: Dual Type Immunity Check ---")
    -- Ghost/Normal dual type - Normal moves should still be immune
    isImmune, message = TypeImmunitySystem.checkTypeImmunity(
        Enums.PokemonType.NORMAL, 
        {Enums.PokemonType.GHOST, Enums.PokemonType.NORMAL}, 
        nil
    )
    assertTrue(isImmune, "Normal moves should be immune to Ghost part of dual type")
    
    -- Test 10: Non-Immune Type Check
    print("\n--- Test 10: Non-Immune Type Check ---")
    isImmune, message = TypeImmunitySystem.checkTypeImmunity(
        Enums.PokemonType.WATER, 
        {Enums.PokemonType.FIRE}, 
        nil
    )
    assertTrue(not isImmune, "Water moves should not be immune to Fire types")
    
    -- Test 11: Process Type Immunity - Immune Case
    print("\n--- Test 11: Process Type Immunity - Immune Case ---")
    local battleState = {activePokemon = {}}
    local attacker = {id = "attacker_1", name = "Alakazam"}
    local target = {
        id = "target_1", 
        name = "Umbreon", 
        types = {Enums.PokemonType.DARK},
        ability = nil
    }
    local moveData = {type = Enums.PokemonType.PSYCHIC, category = 1}
    
    local result = TypeImmunitySystem.processTypeImmunity(battleState, attacker, target, moveData)
    
    assertTrue(result.success, "Type immunity processing should succeed")
    assertTrue(result.blocked, "Move should be blocked")
    assertTrue(result.immune, "Should register as immune")
    assertEquals(result.effectiveness, 0, "Effectiveness should be 0")
    assertNotNil(result.message, "Should have immunity message")
    
    -- Test 12: Process Type Immunity - Non-Immune Case
    print("\n--- Test 12: Process Type Immunity - Non-Immune Case ---")
    target.types = {Enums.PokemonType.FIRE}
    moveData.type = Enums.PokemonType.WATER
    
    result = TypeImmunitySystem.processTypeImmunity(battleState, attacker, target, moveData)
    
    assertTrue(not result.success, "Non-immune case should not succeed immunity")
    assertTrue(not result.blocked, "Move should not be blocked")
    assertTrue(not result.immune, "Should not register as immune")
    assertTrue(result.effectiveness > 0, "Effectiveness should be greater than 0")
    
    -- Test 13: Current Pokemon Types with Normal Types
    print("\n--- Test 13: Current Pokemon Types ---")
    local pokemon = {
        id = "pokemon_1",
        types = {Enums.PokemonType.FIRE, Enums.PokemonType.FLYING}
    }
    
    local currentTypes = TypeImmunitySystem.getCurrentPokemonTypes(battleState, pokemon)
    assertEquals(#currentTypes, 2, "Should have 2 types")
    assertEquals(currentTypes[1], Enums.PokemonType.FIRE, "First type should be Fire")
    assertEquals(currentTypes[2], Enums.PokemonType.FLYING, "Second type should be Flying")
    
    -- Test 14: Temporary Type Changes
    print("\n--- Test 14: Temporary Type Changes ---")
    battleState.temporaryTypeChanges = {
        ["pokemon_1"] = {
            removedTypes = {[Enums.PokemonType.FLYING] = true},
            addedTypes = {},
            durations = {}
        }
    }
    
    currentTypes = TypeImmunitySystem.getCurrentPokemonTypes(battleState, pokemon)
    assertEquals(#currentTypes, 1, "Should have 1 type after removal")
    assertEquals(currentTypes[1], Enums.PokemonType.FIRE, "Should only have Fire type")
    
    -- Test 15: Type Change Application (Roost)
    print("\n--- Test 15: Type Change Application ---")
    local roostMove = {id = 355} -- ROOST placeholder
    local user = {
        id = "roost_user",
        name = "Crobat",
        types = {Enums.PokemonType.POISON, Enums.PokemonType.FLYING}
    }
    
    battleState.temporaryTypeChanges = {}
    local newBattleState, messages = TypeImmunitySystem.applyTypeChange(battleState, roostMove, user)
    
    assertEquals(#messages, 1, "Should have type change message")
    assertTrue(string.find(messages[1], "Flying"), "Message should mention Flying type")
    assertNotNil(newBattleState.temporaryTypeChanges["roost_user"], "Should create type change entry")
    assertTrue(newBattleState.temporaryTypeChanges["roost_user"].removedTypes[Enums.PokemonType.FLYING], 
               "Should remove Flying type")
    
    -- Test 16: Update Temporary Type Changes
    print("\n--- Test 16: Update Temporary Type Changes ---")
    newBattleState.temporaryTypeChanges["roost_user"].durations[Enums.PokemonType.FLYING] = 1
    
    local updatedState, expiredMessages = TypeImmunitySystem.updateTemporaryTypeChanges(newBattleState)
    assertEquals(#expiredMessages, 1, "Should have expiration message")
    assertTrue(string.find(expiredMessages[1], "original typing"), "Message should mention original typing")
    
    -- Test 17: Wonder Guard Ability Override
    print("\n--- Test 17: Wonder Guard Ability Override ---")
    local wonderGuardPokemon = {
        ability = 25, -- WONDER_GUARD
        types = {Enums.PokemonType.BUG, Enums.PokemonType.GHOST}
    }
    local normalMove = {type = Enums.PokemonType.NORMAL, category = 0}
    
    local abilityImmune, abilityMessage = TypeImmunitySystem.checkAbilityImmunityOverride(wonderGuardPokemon, normalMove)
    assertTrue(abilityImmune, "Wonder Guard should block non-super-effective moves")
    assertTrue(string.find(abilityMessage, "Wonder Guard"), "Message should mention Wonder Guard")
    
    -- Test super-effective move against Wonder Guard
    local rockMove = {type = Enums.PokemonType.ROCK, category = 0}
    abilityImmune, abilityMessage = TypeImmunitySystem.checkAbilityImmunityOverride(wonderGuardPokemon, rockMove)
    assertTrue(not abilityImmune, "Wonder Guard should not block super-effective moves")
    
    -- Test 18: Complete Immunity Result
    print("\n--- Test 18: Complete Immunity Result ---")
    target = {
        id = "complete_target",
        name = "Gengar",
        types = {Enums.PokemonType.GHOST, Enums.PokemonType.POISON},
        ability = nil
    }
    moveData = {type = Enums.PokemonType.NORMAL, category = 0}
    
    local completeResult = TypeImmunitySystem.getCompleteImmunityResult(battleState, attacker, target, moveData)
    assertTrue(completeResult.success, "Complete immunity check should succeed")
    assertTrue(completeResult.immune, "Normal move should be immune to Ghost type")
    assertEquals(completeResult.effectiveness, 0, "Effectiveness should be 0")
    
    -- Test 19: Data Validation
    print("\n--- Test 19: Data Validation ---")
    assertTrue(TypeImmunitySystem.validateImmunityData(), "Immunity data should be valid")
    
    -- Test 20: System Initialization
    print("\n--- Test 20: System Initialization ---")
    local success, msg = TypeImmunitySystem.init()
    assertTrue(success, "System should initialize successfully")
    
    -- Print test results
    print(string.format("\nType Immunity System Tests completed: %d/%d passed (%.1f%%)", 
          testsPassed, totalTests, (testsPassed / totalTests) * 100))
    
    if testsPassed == totalTests then
        print("✅ All Type Immunity System tests passed!")
        return true
    else
        print("❌ Some Type Immunity System tests failed!")
        return false
    end
end

-- Run tests if file executed directly
if arg and arg[0] and string.find(arg[0], "type%-immunity%-system%.test%.lua") then
    runTypeImmunityTests()
end

return {runAllTests = runTypeImmunityTests}