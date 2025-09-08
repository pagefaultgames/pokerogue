-- Ability Interactions Unit Tests
-- Comprehensive test coverage for ability-based move interactions
-- Tests Lightning Rod, Water Absorb, Flash Fire, and other ability interactions

local function runAbilityInteractionTests()
    print("Starting Ability Interaction Tests...")
    
    -- Load test dependencies
    local AbilityInteractions = require("game-logic.battle.ability-interactions")
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
    
    -- Test 1: Lightning Rod Interaction Detection
    print("\n--- Test 1: Lightning Rod Interaction Detection ---")
    assertTrue(AbilityInteractions.canInteract(Enums.AbilityId.LIGHTNING_ROD, Enums.PokemonType.ELECTRIC, 1), 
               "Lightning Rod should interact with Electric moves")
    assertTrue(not AbilityInteractions.canInteract(Enums.AbilityId.LIGHTNING_ROD, Enums.PokemonType.WATER, 1), 
               "Lightning Rod should not interact with Water moves")
    
    -- Test 2: Water Absorb Interaction Detection
    print("\n--- Test 2: Water Absorb Interaction Detection ---")
    assertTrue(AbilityInteractions.canInteract(Enums.AbilityId.WATER_ABSORB, Enums.PokemonType.WATER, 1), 
               "Water Absorb should interact with Water moves")
    assertTrue(not AbilityInteractions.canInteract(Enums.AbilityId.WATER_ABSORB, Enums.PokemonType.FIRE, 1), 
               "Water Absorb should not interact with Fire moves")
    
    -- Test 3: Flash Fire Interaction Detection
    print("\n--- Test 3: Flash Fire Interaction Detection ---")
    assertTrue(AbilityInteractions.canInteract(Enums.AbilityId.FLASH_FIRE, Enums.PokemonType.FIRE, 1), 
               "Flash Fire should interact with Fire moves")
    assertTrue(not AbilityInteractions.canInteract(Enums.AbilityId.FLASH_FIRE, Enums.PokemonType.GRASS, 1), 
               "Flash Fire should not interact with Grass moves")
    
    -- Test 4: Levitate Immunity
    print("\n--- Test 4: Levitate Immunity ---")
    assertTrue(AbilityInteractions.canInteract(Enums.AbilityId.LEVITATE, Enums.PokemonType.GROUND, 0), 
               "Levitate should interact with Ground moves")
    assertTrue(not AbilityInteractions.canInteract(Enums.AbilityId.LEVITATE, Enums.PokemonType.ROCK, 0), 
               "Levitate should not interact with Rock moves")
    
    -- Test 5: Lightning Rod Redirection Processing
    print("\n--- Test 5: Lightning Rod Redirection Processing ---")
    local battleState = {
        activePokemon = {},
        abilityStates = {}
    }
    
    local lightningRodPokemon = {
        id = "pokemon_1",
        name = "Raichu",
        ability = Enums.AbilityId.LIGHTNING_ROD,
        stats = {[Enums.Stat.HP] = 200},
        currentHP = 200,
        maxHP = 200,
        statStages = {}
    }
    
    local moveData = {
        type = Enums.PokemonType.ELECTRIC,
        category = 1, -- Special
        power = 90
    }
    
    local result = AbilityInteractions.processInteraction(battleState, lightningRodPokemon, nil, moveData, {"target_1"})
    
    assertTrue(result.success, "Lightning Rod interaction should succeed")
    assertEquals(result.interactionType, AbilityInteractions.InteractionType.REDIRECTION, "Should be redirection type")
    assertTrue(result.effects.redirected, "Should set redirected flag")
    assertTrue(result.effects.blocked, "Should set blocked flag")
    assertEquals(#result.newTargets, 1, "Should have one new target")
    assertEquals(result.newTargets[1], "pokemon_1", "Should redirect to Lightning Rod Pokemon")
    
    -- Test 6: Water Absorb Healing Processing
    print("\n--- Test 6: Water Absorb Healing Processing ---")
    local waterAbsorbPokemon = {
        id = "pokemon_2",
        name = "Vaporeon",
        ability = Enums.AbilityId.WATER_ABSORB,
        stats = {[Enums.Stat.HP] = 260},
        currentHP = 200,
        maxHP = 260
    }
    
    local waterMove = {
        type = Enums.PokemonType.WATER,
        category = 1, -- Special
        power = 80
    }
    
    result = AbilityInteractions.processInteraction(battleState, waterAbsorbPokemon, nil, waterMove, {"target_2"})
    
    assertTrue(result.success, "Water Absorb interaction should succeed")
    assertEquals(result.interactionType, AbilityInteractions.InteractionType.ABSORPTION, "Should be absorption type")
    assertTrue(result.effects.absorbed, "Should set absorbed flag")
    assertEquals(#result.newTargets, 0, "Should have no targets (absorbed)")
    assertNotNil(result.effects.healing, "Should have healing effect")
    assertEquals(result.effects.healing.target, "pokemon_2", "Should heal Water Absorb Pokemon")
    assertEquals(result.effects.healing.amount, 65, "Should heal 1/4 max HP (260/4 = 65)")
    
    -- Test 7: Flash Fire Activation Processing
    print("\n--- Test 7: Flash Fire Activation Processing ---")
    local flashFirePokemon = {
        id = "pokemon_3",
        name = "Arcanine",
        ability = Enums.AbilityId.FLASH_FIRE,
        stats = {[Enums.Stat.HP] = 180},
        currentHP = 180
    }
    
    local fireMove = {
        type = Enums.PokemonType.FIRE,
        category = 1, -- Special
        power = 85
    }
    
    result = AbilityInteractions.processInteraction(battleState, flashFirePokemon, nil, fireMove, {"target_3"})
    
    assertTrue(result.success, "Flash Fire interaction should succeed")
    assertEquals(result.interactionType, AbilityInteractions.InteractionType.ACTIVATION, "Should be activation type")
    assertTrue(result.effects.activated, "Should set activated flag")
    assertTrue(battleState.abilityStates["pokemon_3"].flashFireActive, "Should activate Flash Fire in battle state")
    assertEquals(battleState.abilityStates["pokemon_3"].firePowerMultiplier, 1.5, "Should set 1.5x fire power multiplier")
    
    -- Test 8: Sap Sipper Stat Boost Processing
    print("\n--- Test 8: Sap Sipper Stat Boost Processing ---")
    local sapSipperPokemon = {
        id = "pokemon_4",
        name = "Bouffalant",
        ability = 118, -- SAP_SIPPER placeholder
        stats = {[Enums.Stat.HP] = 190},
        currentHP = 190,
        statStages = {}
    }
    
    local grassMove = {
        type = Enums.PokemonType.GRASS,
        category = 1, -- Special
        power = 75
    }
    
    result = AbilityInteractions.processInteraction(battleState, sapSipperPokemon, nil, grassMove, {"target_4"})
    
    assertTrue(result.success, "Sap Sipper interaction should succeed")
    assertEquals(result.interactionType, AbilityInteractions.InteractionType.BOOST, "Should be boost type")
    assertTrue(result.effects.absorbed, "Should set absorbed flag")
    assertEquals(#result.newTargets, 0, "Should have no targets (absorbed)")
    assertNotNil(result.effects.statBoost, "Should have stat boost effect")
    assertEquals(result.effects.statBoost.stat, Enums.Stat.ATK, "Should boost Attack stat")
    assertEquals(result.effects.statBoost.stages, 1, "Should boost by 1 stage")
    
    -- Test 9: Multi-target Redirection Priority
    print("\n--- Test 9: Multi-target Redirection Priority ---")
    battleState.activePokemon = {
        lightningRodPokemon,
        {
            id = "pokemon_5",
            name = "Lanturn",
            ability = Enums.AbilityId.VOLT_ABSORB, -- Lower priority than Lightning Rod
            fainted = false
        }
    }
    
    local redirectors = AbilityInteractions.getRedirectingAbilities(battleState, moveData, {"original_target"})
    
    assertEquals(#redirectors, 1, "Should find one redirecting ability")
    assertEquals(redirectors[1].pokemon.id, "pokemon_1", "Lightning Rod should be the redirector")
    assertEquals(redirectors[1].priority, 10, "Lightning Rod should have priority 10")
    
    -- Test 10: Effect Application
    print("\n--- Test 10: Effect Application ---")
    battleState.activePokemon = {waterAbsorbPokemon}
    waterAbsorbPokemon.currentHP = 150 -- Damaged
    
    local healingResult = {
        success = true,
        effects = {
            healing = {
                target = "pokemon_2",
                amount = 65
            }
        },
        message = "Water Absorb restored HP!"
    }
    
    local newBattleState, messages = AbilityInteractions.applyInteractionEffects(battleState, healingResult)
    
    assertEquals(waterAbsorbPokemon.currentHP, 215, "Should heal Pokemon to 215 HP (150 + 65)")
    assertEquals(#messages, 2, "Should have 2 messages (ability + healing)")
    assertTrue(messages[1] == "Water Absorb restored HP!", "Should have ability message")
    assertTrue(string.find(messages[2], "restored"), "Should have healing message")
    
    -- Test 11: Fire Power Multiplier Check
    print("\n--- Test 11: Fire Power Multiplier Check ---")
    local multiplier = AbilityInteractions.getFirePowerMultiplier(battleState, "pokemon_3")
    assertEquals(multiplier, 1.5, "Flash Fire active should return 1.5x multiplier")
    
    multiplier = AbilityInteractions.getFirePowerMultiplier(battleState, "pokemon_1")
    assertEquals(multiplier, 1.0, "No Flash Fire should return 1.0x multiplier")
    
    -- Test 12: Invalid Interaction Handling
    print("\n--- Test 12: Invalid Interaction Handling ---")
    result = AbilityInteractions.processInteraction(battleState, {ability = 999}, nil, moveData, {"target"})
    assertTrue(not result.success, "Invalid ability should return unsuccessful result")
    
    -- Test 13: Data Validation
    print("\n--- Test 13: Data Validation ---")
    assertTrue(AbilityInteractions.validateInteractionData(), "Interaction data should be valid")
    
    -- Test 14: System Initialization
    print("\n--- Test 14: System Initialization ---")
    local success, msg = AbilityInteractions.init()
    assertTrue(success, "System should initialize successfully")
    
    -- Print test results
    print(string.format("\nAbility Interaction Tests completed: %d/%d passed (%.1f%%)", 
          testsPassed, totalTests, (testsPassed / totalTests) * 100))
    
    if testsPassed == totalTests then
        print("✅ All Ability Interaction tests passed!")
        return true
    else
        print("❌ Some Ability Interaction tests failed!")
        return false
    end
end

-- Run tests if file executed directly
if arg and arg[0] and string.find(arg[0], "ability%-interactions%.test%.lua") then
    runAbilityInteractionTests()
end

return {runAllTests = runAbilityInteractionTests}