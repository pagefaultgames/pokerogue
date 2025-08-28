-- Item Interactions Unit Tests
-- Comprehensive test coverage for item-based move interactions
-- Tests Choice items, Assault Vest, Life Orb, and other held item effects

local function runItemInteractionTests()
    print("Starting Item Interaction Tests...")
    
    -- Load test dependencies
    local ItemInteractions = require("game-logic.battle.item-interactions")
    local Enums = require("data.constants.enums")
    
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
    
    -- Test 1: Choice Band Interaction Detection
    print("\n--- Test 1: Choice Band Interaction Detection ---")
    local physicalMove = {category = Enums.MoveCategory.PHYSICAL, type = Enums.PokemonType.NORMAL}
    local pokemon = {heldItem = ItemInteractions.Items.CHOICE_BAND}
    
    assertTrue(ItemInteractions.canInteract(ItemInteractions.Items.CHOICE_BAND, physicalMove, pokemon), 
               "Choice Band should interact with physical moves")
    
    local statusMove = {category = Enums.MoveCategory.STATUS, type = Enums.PokemonType.NORMAL}
    assertTrue(not ItemInteractions.canInteract(ItemInteractions.Items.CHOICE_BAND, statusMove, pokemon), 
               "Choice Band should not interact with status moves")
    
    -- Test 2: Choice Specs Interaction Detection
    print("\n--- Test 2: Choice Specs Interaction Detection ---")
    local specialMove = {category = Enums.MoveCategory.SPECIAL, type = Enums.PokemonType.FIRE}
    pokemon.heldItem = ItemInteractions.Items.CHOICE_SPECS
    
    assertTrue(ItemInteractions.canInteract(ItemInteractions.Items.CHOICE_SPECS, specialMove, pokemon), 
               "Choice Specs should interact with special moves")
    assertTrue(not ItemInteractions.canInteract(ItemInteractions.Items.CHOICE_SPECS, physicalMove, pokemon), 
               "Choice Specs should not interact with physical moves")
    
    -- Test 3: Choice Scarf Interaction Detection
    print("\n--- Test 3: Choice Scarf Interaction Detection ---")
    pokemon.heldItem = ItemInteractions.Items.CHOICE_SCARF
    
    assertTrue(ItemInteractions.canInteract(ItemInteractions.Items.CHOICE_SCARF, physicalMove, pokemon), 
               "Choice Scarf should interact with physical moves")
    assertTrue(ItemInteractions.canInteract(ItemInteractions.Items.CHOICE_SCARF, specialMove, pokemon), 
               "Choice Scarf should interact with special moves")
    assertTrue(ItemInteractions.canInteract(ItemInteractions.Items.CHOICE_SCARF, statusMove, pokemon), 
               "Choice Scarf should interact with status moves")
    
    -- Test 4: Assault Vest Status Move Restriction
    print("\n--- Test 4: Assault Vest Status Move Restriction ---")
    pokemon.heldItem = ItemInteractions.Items.ASSAULT_VEST
    
    assertTrue(ItemInteractions.canInteract(ItemInteractions.Items.ASSAULT_VEST, statusMove, pokemon), 
               "Assault Vest should interact with status moves to prevent them")
    assertTrue(not ItemInteractions.canInteract(ItemInteractions.Items.ASSAULT_VEST, physicalMove, pokemon), 
               "Assault Vest should not interact with physical moves")
    
    -- Test 5: Life Orb Enhancement Detection
    print("\n--- Test 5: Life Orb Enhancement Detection ---")
    pokemon.heldItem = ItemInteractions.Items.LIFE_ORB
    
    assertTrue(ItemInteractions.canInteract(ItemInteractions.Items.LIFE_ORB, physicalMove, pokemon), 
               "Life Orb should interact with physical moves")
    assertTrue(ItemInteractions.canInteract(ItemInteractions.Items.LIFE_ORB, specialMove, pokemon), 
               "Life Orb should interact with special moves")
    assertTrue(not ItemInteractions.canInteract(ItemInteractions.Items.LIFE_ORB, statusMove, pokemon), 
               "Life Orb should not interact with status moves")
    
    -- Test 6: Choice Band Move Locking
    print("\n--- Test 6: Choice Band Move Locking ---")
    local battleState = {choiceLocks = {}}
    pokemon = {
        id = "choiceband_pokemon",
        name = "Machamp",
        heldItem = ItemInteractions.Items.CHOICE_BAND,
        stats = {[Enums.Stat.HP] = 200},
        currentHP = 200
    }
    local firstMove = {id = 1, category = Enums.MoveCategory.PHYSICAL, type = Enums.PokemonType.FIGHTING}
    
    local result = ItemInteractions.processItemInteraction(battleState, pokemon, firstMove, 1)
    
    assertTrue(result.success, "Choice Band interaction should succeed")
    assertEquals(result.interactionType, ItemInteractions.InteractionType.RESTRICTION, "Should be restriction type")
    assertTrue(result.effects.choiceLocked, "Should set choice locked flag")
    assertNotNil(battleState.choiceLocks["choiceband_pokemon"], "Should create choice lock entry")
    assertEquals(battleState.choiceLocks["choiceband_pokemon"].moveId, 1, "Should lock to move ID 1")
    
    -- Test trying to use different move
    local secondMove = {id = 2, category = Enums.MoveCategory.PHYSICAL, type = Enums.PokemonType.NORMAL}
    result = ItemInteractions.processItemInteraction(battleState, pokemon, secondMove, 2)
    
    assertTrue(result.success, "Should succeed to return restriction")
    assertTrue(result.restrictions.blocked, "Different move should be blocked")
    assertEquals(result.restrictions.reason, "choice_locked", "Should be choice locked reason")
    
    -- Test 7: Assault Vest Status Move Blocking
    print("\n--- Test 7: Assault Vest Status Move Blocking ---")
    pokemon.heldItem = ItemInteractions.Items.ASSAULT_VEST
    battleState = {}
    
    result = ItemInteractions.processItemInteraction(battleState, pokemon, statusMove, 1)
    
    assertTrue(result.success, "Assault Vest interaction should succeed")
    assertTrue(result.restrictions.blocked, "Status move should be blocked")
    assertEquals(result.restrictions.reason, "assault_vest", "Should be assault vest reason")
    assertTrue(string.find(result.message, "Assault Vest"), "Message should mention Assault Vest")
    
    -- Test 8: Life Orb Power Boost and Recoil
    print("\n--- Test 8: Life Orb Power Boost and Recoil ---")
    pokemon.heldItem = ItemInteractions.Items.LIFE_ORB
    battleState = {}
    
    result = ItemInteractions.processItemInteraction(battleState, pokemon, physicalMove, 1)
    
    assertTrue(result.success, "Life Orb interaction should succeed")
    assertEquals(result.interactionType, ItemInteractions.InteractionType.ENHANCEMENT, "Should be enhancement type")
    assertEquals(result.effects.powerMultiplier, 1.3, "Should have 1.3x power multiplier")
    assertNotNil(result.effects.recoil, "Should have recoil effect")
    assertEquals(result.effects.recoil.amount, "1/10", "Should have 1/10 recoil damage")
    
    -- Test 9: Metronome Progressive Boost
    print("\n--- Test 9: Metronome Progressive Boost ---")
    pokemon.heldItem = ItemInteractions.Items.METRONOME
    battleState = {metronomeCounters = {}}
    local sameMove = {id = 5, category = Enums.MoveCategory.PHYSICAL, type = Enums.PokemonType.NORMAL}
    
    -- First use
    result = ItemInteractions.processItemInteraction(battleState, pokemon, sameMove, 1)
    assertEquals(result.effects.powerMultiplier, 1.0, "First use should have 1.0x multiplier")
    
    -- Second use of same move
    result = ItemInteractions.processItemInteraction(battleState, pokemon, sameMove, 1)
    assertEquals(result.effects.powerMultiplier, 1.2, "Second use should have 1.2x multiplier")
    
    -- Third use of same move
    result = ItemInteractions.processItemInteraction(battleState, pokemon, sameMove, 1)
    assertEquals(result.effects.powerMultiplier, 1.4, "Third use should have 1.4x multiplier")
    
    -- Different move should reset
    local differentMove = {id = 6, category = Enums.MoveCategory.PHYSICAL, type = Enums.PokemonType.NORMAL}
    result = ItemInteractions.processItemInteraction(battleState, pokemon, differentMove, 1)
    assertEquals(result.effects.powerMultiplier, 1.0, "Different move should reset to 1.0x multiplier")
    
    -- Test 10: King's Rock Flinch Effect
    print("\n--- Test 10: King's Rock Flinch Effect ---")
    pokemon.heldItem = ItemInteractions.Items.KINGS_ROCK
    battleState = {}
    
    result = ItemInteractions.processItemInteraction(battleState, pokemon, physicalMove, 1)
    
    assertTrue(result.success, "King's Rock interaction should succeed")
    assertEquals(result.interactionType, ItemInteractions.InteractionType.ACTIVATION, "Should be activation type")
    assertNotNil(result.effects.additionalEffect, "Should have additional effect")
    assertEquals(result.effects.additionalEffect.type, "flinch", "Should be flinch effect")
    assertEquals(result.effects.additionalEffect.chance, 0.1, "Should have 10% flinch chance")
    
    -- Test 11: Mental Herb Cleansing
    print("\n--- Test 11: Mental Herb Cleansing ---")
    pokemon.heldItem = ItemInteractions.Items.MENTAL_HERB
    pokemon.statusConditions = {taunt = true, torment = true}
    battleState = {}
    
    result = ItemInteractions.processItemInteraction(battleState, pokemon, physicalMove, 1)
    
    assertTrue(result.success, "Mental Herb interaction should succeed")
    assertEquals(result.interactionType, ItemInteractions.InteractionType.CLEANSING, "Should be cleansing type")
    assertTrue(result.effects.cleansed, "Should have cleansed flag")
    assertTrue(result.effects.consumeItem, "Should consume item")
    
    -- Test 12: White Herb Stat Restoration
    print("\n--- Test 12: White Herb Stat Restoration ---")
    pokemon.heldItem = ItemInteractions.Items.WHITE_HERB
    pokemon.statStages = {[Enums.Stat.ATK] = -2, [Enums.Stat.DEF] = -1, [Enums.Stat.SPD] = 1}
    pokemon.statusConditions = {} -- Clear previous test data
    battleState = {}
    
    result = ItemInteractions.processItemInteraction(battleState, pokemon, physicalMove, 1)
    
    assertTrue(result.success, "White Herb interaction should succeed")
    assertTrue(result.effects.statsRestored, "Should have stats restored flag")
    assertTrue(result.effects.consumeItem, "Should consume item")
    assertEquals(pokemon.statStages[Enums.Stat.ATK], 0, "Negative ATK stage should be restored to 0")
    assertEquals(pokemon.statStages[Enums.Stat.DEF], 0, "Negative DEF stage should be restored to 0")
    assertEquals(pokemon.statStages[Enums.Stat.SPD], 1, "Positive SPD stage should remain unchanged")
    
    -- Test 13: Item Stat Multipliers
    print("\n--- Test 13: Item Stat Multipliers ---")
    pokemon.heldItem = ItemInteractions.Items.CHOICE_BAND
    
    local atkMultiplier = ItemInteractions.getItemStatMultiplier(pokemon, Enums.Stat.ATK)
    assertEquals(atkMultiplier, 1.5, "Choice Band should give 1.5x ATK multiplier")
    
    local defMultiplier = ItemInteractions.getItemStatMultiplier(pokemon, Enums.Stat.DEF)
    assertEquals(defMultiplier, 1.0, "Choice Band should not affect DEF")
    
    pokemon.heldItem = ItemInteractions.Items.ASSAULT_VEST
    local spdefMultiplier = ItemInteractions.getItemStatMultiplier(pokemon, Enums.Stat.SPDEF)
    assertEquals(spdefMultiplier, 1.5, "Assault Vest should give 1.5x SpDef multiplier")
    
    -- Test 14: Move Blocking Check
    print("\n--- Test 14: Move Blocking Check ---")
    pokemon.heldItem = ItemInteractions.Items.ASSAULT_VEST
    battleState = {}
    
    local blocked, reason = ItemInteractions.isBlockedByItem(pokemon, statusMove, battleState)
    assertTrue(blocked, "Assault Vest should block status moves")
    assertEquals(reason, "assault_vest", "Reason should be assault vest")
    
    blocked, reason = ItemInteractions.isBlockedByItem(pokemon, physicalMove, battleState)
    assertTrue(not blocked, "Assault Vest should not block physical moves")
    
    -- Test 15: Apply Item Effects - Recoil Damage
    print("\n--- Test 15: Apply Item Effects - Recoil Damage ---")
    pokemon = {
        id = "lifeorb_pokemon",
        name = "Garchomp",
        heldItem = ItemInteractions.Items.LIFE_ORB,
        stats = {[Enums.Stat.HP] = 200},
        currentHP = 200,
        maxHP = 200
    }
    
    local recoilResult = {
        success = true,
        message = "Life Orb boosted the power!",
        effects = {
            recoil = {
                type = "percentage",
                amount = "1/10",
                target = "lifeorb_pokemon"
            }
        }
    }
    
    battleState = {}
    local newBattleState, messages = ItemInteractions.applyItemEffects(battleState, recoilResult, pokemon)
    
    assertEquals(pokemon.currentHP, 180, "Should take 20 HP recoil damage (200/10)")
    assertEquals(#messages, 2, "Should have 2 messages (boost + recoil)")
    assertTrue(string.find(messages[2], "recoil"), "Second message should mention recoil")
    
    -- Test 16: Apply Item Effects - Item Consumption
    print("\n--- Test 16: Apply Item Effects - Item Consumption ---")
    pokemon.heldItem = ItemInteractions.Items.MENTAL_HERB
    local consumeResult = {
        success = true,
        message = "Mental Herb cleansed!",
        effects = {
            consumeItem = true
        }
    }
    
    newBattleState, messages = ItemInteractions.applyItemEffects(battleState, consumeResult, pokemon)
    
    assertEquals(pokemon.heldItem, nil, "Item should be consumed")
    assertTrue(string.find(messages[2], "consumed"), "Should have consumption message")
    
    -- Test 17: Clear Choice Lock
    print("\n--- Test 17: Clear Choice Lock ---")
    battleState.choiceLocks = {["test_pokemon"] = {moveId = 1, itemId = 1}}
    
    newBattleState = ItemInteractions.clearChoiceLock(battleState, "test_pokemon")
    assertEquals(newBattleState.choiceLocks["test_pokemon"], nil, "Choice lock should be cleared")
    
    -- Test 18: Reset Metronome Counter
    print("\n--- Test 18: Reset Metronome Counter ---")
    battleState.metronomeCounters = {["test_pokemon"] = {lastMoveId = 5, count = 3}}
    
    newBattleState = ItemInteractions.resetMetronomeCounter(battleState, "test_pokemon")
    assertEquals(newBattleState.metronomeCounters["test_pokemon"].count, 0, "Counter should be reset to 0")
    assertEquals(newBattleState.metronomeCounters["test_pokemon"].lastMoveId, nil, "Last move ID should be nil")
    
    -- Test 19: Data Validation
    print("\n--- Test 19: Data Validation ---")
    assertTrue(ItemInteractions.validateInteractionData(), "Item interaction data should be valid")
    
    -- Test 20: System Initialization
    print("\n--- Test 20: System Initialization ---")
    local success, msg = ItemInteractions.init()
    assertTrue(success, "System should initialize successfully")
    
    -- Print test results
    print(string.format("\nItem Interaction Tests completed: %d/%d passed (%.1f%%)", 
          testsPassed, totalTests, (testsPassed / totalTests) * 100))
    
    if testsPassed == totalTests then
        print("✅ All Item Interaction tests passed!")
        return true
    else
        print("❌ Some Item Interaction tests failed!")
        return false
    end
end

-- Run tests if file executed directly
if arg and arg[0] and string.find(arg[0], "item%-interactions%.test%.lua") then
    runItemInteractionTests()
end

return {runAllTests = runItemInteractionTests}