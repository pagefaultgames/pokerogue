-- Terrain Effects Integration Tests  
-- Complete integration testing for terrain effects within battle message processing
-- Tests terrain interactions with battle handler, turn processor, and complete battle workflows

-- Load dependencies
local TerrainEffects = require("game-logic.battle.terrain-effects")
local TerrainAbilities = require("game-logic.battle.terrain-abilities")
local BattleConditions = require("game-logic.battle.battle-conditions")
local TurnProcessor = require("game-logic.battle.turn-processor")
local Enums = require("data.constants.enums")
local json = require("json")

-- Test framework setup
local function assertEquals(expected, actual, message)
    if expected ~= actual then
        error(string.format("Assertion failed: %s\nExpected: %s\nActual: %s", 
              message or "Values not equal", tostring(expected), tostring(actual)))
    end
end

local function assertNotNil(value, message)
    if value == nil then
        error(string.format("Assertion failed: %s\nValue should not be nil", message or ""))
    end
end

local function assertTrue(condition, message)
    if not condition then
        error(string.format("Assertion failed: %s\nCondition should be true", message or ""))
    end
end

local function assertFalse(condition, message)
    if condition then
        error(string.format("Assertion failed: %s\nCondition should be false", message or ""))
    end
end

-- Test utilities
local function createTestBattleState(battleId)
    return {
        battleId = battleId,
        turn = 1,
        phase = TurnProcessor.TurnPhase.COMMAND_SELECTION,
        playerParty = {
            {
                id = "player-pokemon-1",
                name = "Pikachu",
                speciesId = Enums.SpeciesId.PIKACHU,
                types = {Enums.PokemonType.ELECTRIC},
                ability = Enums.AbilityId.STATIC,
                item = Enums.ItemId.NONE,
                currentHP = 100,
                maxHP = 100,
                stats = {100, 80, 70, 65, 65, 90},
                level = 50,
                moves = {
                    {id = Enums.MoveId.THUNDERBOLT, name = "Thunderbolt", type = Enums.PokemonType.ELECTRIC, power = 90, pp = 15}
                }
            }
        },
        enemyParty = {
            {
                id = "enemy-pokemon-1", 
                name = "Garchomp",
                speciesId = Enums.SpeciesId.UNKNOWN, -- Would be proper Garchomp ID
                types = {Enums.PokemonType.DRAGON, Enums.PokemonType.GROUND},
                ability = Enums.AbilityId.ROUGH_SKIN,
                item = Enums.ItemId.NONE,
                currentHP = 120,
                maxHP = 120,
                stats = {120, 130, 95, 80, 85, 102},
                level = 50,
                moves = {
                    {id = Enums.MoveId.DRAGON_RAGE, name = "Dragon Pulse", type = Enums.PokemonType.DRAGON, power = 85, pp = 10}
                }
            }
        },
        terrain = TerrainEffects.initializeTerrainState(battleId),
        weather = {
            type = BattleConditions.WeatherType.NONE,
            duration = 0,
            source = "none"
        }
    }
end

-- Test Suite 1: Complete Battle Initialization with Terrain
local function testBattleInitializationWithTerrain()
    print("Testing battle initialization with terrain abilities...")
    
    -- Create battle state with terrain-setting ability
    local battleState = createTestBattleState("terrain-init-test-1")
    battleState.playerParty[1].ability = Enums.AbilityId.ELECTRIC_SURGE
    battleState.playerParty[1].name = "Tapu Koko"
    
    -- Initialize battle (this should trigger Electric Surge)
    local initializedState, error = TurnProcessor.initializeBattle(
        battleState.battleId,
        "test-seed-123",
        battleState.playerParty,
        battleState.enemyParty
    )
    
    assertNotNil(initializedState, "Battle should initialize successfully")
    assertNotNil(initializedState.terrain, "Terrain state should be initialized")
    assertEquals(TerrainEffects.TerrainType.ELECTRIC, initializedState.terrain.current_terrain, "Electric Surge should set Electric Terrain")
    assertEquals(5, initializedState.terrain.duration_remaining, "Terrain should have 5 turns duration")
    
    print("✓ Battle initialization with terrain tests passed")
end

-- Test Suite 2: Multi-Turn Terrain Duration and Effects
local function testMultiTurnTerrainEffects()
    print("Testing multi-turn terrain effects...")
    
    local battleState = createTestBattleState("terrain-multi-turn-test")
    
    -- Set up Grassy Terrain for healing tests
    battleState.terrain, _, _ = TerrainEffects.setTerrain(
        battleState.terrain, 
        TerrainEffects.TerrainType.GRASSY, 
        3, 
        "test"
    )
    
    -- Damage Pokemon to test healing
    battleState.playerParty[1].currentHP = 50
    battleState.enemyParty[1].currentHP = 60
    
    -- Process end-of-turn effects for 3 turns
    for turn = 1, 3 do
        local endOfTurnResults = TurnProcessor.processEndOfTurnEffects(battleState)
        
        assertNotNil(endOfTurnResults.terrain_effects, "Should have terrain effects")
        
        if turn < 3 then
            assertEquals(TerrainEffects.TerrainType.GRASSY, battleState.terrain.current_terrain, "Terrain should still be active on turn " .. turn)
            assertTrue(battleState.playerParty[1].currentHP > 50, "Pokemon should be healed by Grassy Terrain")
        else
            -- On turn 3, terrain should expire
            assertEquals(TerrainEffects.TerrainType.NONE, battleState.terrain.current_terrain, "Terrain should expire after 3 turns")
        end
    end
    
    print("✓ Multi-turn terrain effects tests passed")
end

-- Test Suite 3: Terrain-Weather-Status Integration
local function testTerrainWeatherStatusIntegration()
    print("Testing terrain-weather-status interaction integration...")
    
    local battleState = createTestBattleState("terrain-weather-status-test")
    
    -- Set up Grassy Terrain and Sandstorm (healing vs damage)
    battleState.terrain, _, _ = TerrainEffects.setTerrain(
        battleState.terrain,
        TerrainEffects.TerrainType.GRASSY,
        nil,
        "test"
    )
    
    battleState.weather = {
        type = BattleConditions.WeatherType.SANDSTORM,
        duration = 5,
        source = "test"
    }
    
    -- Damage Pokemon to test combined effects
    battleState.playerParty[1].currentHP = 70
    battleState.enemyParty[1].currentHP = 80
    
    -- Process combined environmental effects
    local allPokemon = {}
    for _, pokemon in ipairs(battleState.playerParty) do
        table.insert(allPokemon, pokemon)
    end
    for _, pokemon in ipairs(battleState.enemyParty) do
        table.insert(allPokemon, pokemon)
    end
    
    local combinedResults = BattleConditions.processCombinedEnvironmentalEffects(
        battleState.battleId,
        battleState.weather.type,
        battleState.terrain.current_terrain,
        allPokemon
    )
    
    assertNotNil(combinedResults, "Should have combined results")
    assertNotNil(combinedResults.weather_damage, "Should have weather damage results")
    assertNotNil(combinedResults.terrain_healing, "Should have terrain healing results")
    assertNotNil(combinedResults.combined_effects, "Should have combined effects calculation")
    
    -- Electric type should be immune to sandstorm but get terrain healing
    assertTrue(#combinedResults.terrain_healing > 0, "Should have terrain healing results")
    
    print("✓ Terrain-weather-status integration tests passed")
end

-- Test Suite 4: Complete Move Interaction with Terrain
local function testCompleteMoveTerrainInteraction()
    print("Testing complete move interaction with terrain...")
    
    local battleState = createTestBattleState("terrain-move-test")
    
    -- Set up Electric Terrain
    battleState.terrain, _, _ = TerrainEffects.setTerrain(
        battleState.terrain,
        TerrainEffects.TerrainType.ELECTRIC,
        nil,
        "test"
    )
    
    -- Test Electric move power boost
    local moveAction = {
        type = TurnProcessor.ActionType.MOVE,
        pokemon = battleState.playerParty[1],
        target = battleState.enemyParty[1],
        moveId = Enums.MoveId.THUNDERBOLT,
        move = {
            id = Enums.MoveId.THUNDERBOLT,
            name = "Thunderbolt",
            type = Enums.PokemonType.ELECTRIC,
            power = 90,
            priority = 0
        }
    }
    
    local moveResult = TurnProcessor.executeMove(battleState, moveAction)
    
    assertTrue(moveResult.success, "Electric move should execute successfully")
    assertNotNil(moveResult.terrain_boost, "Should indicate terrain boost")
    assertTrue(moveResult.move.power > 90, "Move power should be boosted by terrain")
    assertEquals(1.3, moveResult.move.terrain_modifier, "Should have 1.3x terrain modifier")
    
    print("✓ Complete move terrain interaction tests passed")
end

-- Test Suite 5: Priority Move Blocking in Psychic Terrain
local function testPriorityMoveBlocking()
    print("Testing priority move blocking in Psychic Terrain...")
    
    local battleState = createTestBattleState("terrain-priority-test")
    
    -- Set up Psychic Terrain
    battleState.terrain, _, _ = TerrainEffects.setTerrain(
        battleState.terrain,
        TerrainEffects.TerrainType.PSYCHIC,
        nil,
        "test"
    )
    
    -- Test priority move being blocked
    local priorityMoveAction = {
        type = TurnProcessor.ActionType.MOVE,
        pokemon = battleState.enemyParty[1],
        target = battleState.playerParty[1],
        moveId = Enums.MoveId.QUICK_ATTACK,
        move = {
            id = Enums.MoveId.QUICK_ATTACK,
            name = "Quick Attack",
            type = Enums.PokemonType.NORMAL,
            power = 40,
            priority = 1
        }
    }
    
    local blockedResult = TurnProcessor.executeMove(battleState, priorityMoveAction)
    
    assertFalse(blockedResult.success, "Priority move should be blocked")
    assertNotNil(blockedResult.error, "Should have error message about blocking")
    assertTrue(string.find(blockedResult.error, "terrain") ~= nil, "Error should mention terrain")
    
    -- Test normal priority move not being blocked
    local normalMoveAction = {
        type = TurnProcessor.ActionType.MOVE,
        pokemon = battleState.enemyParty[1],
        target = battleState.playerParty[1],
        moveId = Enums.MoveId.DRAGON_RAGE,
        move = {
            id = Enums.MoveId.DRAGON_RAGE,
            name = "Dragon Pulse",
            type = Enums.PokemonType.DRAGON,
            power = 85,
            priority = 0
        }
    }
    
    local normalResult = TurnProcessor.executeMove(battleState, normalMoveAction)
    assertTrue(normalResult.success, "Normal priority move should not be blocked")
    
    print("✓ Priority move blocking tests passed")
end

-- Test Suite 6: Terrain Abilities in Battle Flow
local function testTerrainAbilitiesInBattleFlow()
    print("Testing terrain abilities within battle flow...")
    
    local battleState = createTestBattleState("terrain-abilities-test")
    
    -- Set up Pokemon with Surge Surfer ability
    battleState.playerParty[1].ability = Enums.AbilityId.SURGE_SURFER
    battleState.playerParty[1].name = "Alolan Raichu"
    
    -- Set up Electric Terrain
    battleState.terrain, _, _ = TerrainEffects.setTerrain(
        battleState.terrain,
        TerrainEffects.TerrainType.ELECTRIC,
        nil,
        "test"
    )
    
    -- Test ability activation
    local hasActivatedAbility = TerrainAbilities.hasTerrainActivatedAbility(
        battleState.playerParty[1],
        battleState.terrain
    )
    assertTrue(hasActivatedAbility, "Surge Surfer should be activated in Electric Terrain")
    
    -- Test stat modification
    local speedModifier = TerrainAbilities.getTerrainAbilityStatModifier(
        battleState.playerParty[1],
        battleState.terrain,
        Enums.Stat.SPD
    )
    assertEquals(2.0, speedModifier, "Surge Surfer should double speed")
    
    -- Test activation message
    local activationMessage = TerrainAbilities.getTerrainAbilityActivationMessage(
        battleState.playerParty[1],
        battleState.terrain
    )
    assertNotNil(activationMessage, "Should have activation message")
    assertTrue(string.find(activationMessage, "Alolan Raichu") ~= nil, "Message should contain Pokemon name")
    
    print("✓ Terrain abilities in battle flow tests passed")
end

-- Test Suite 7: Status Prevention Integration
local function testStatusPreventionIntegration()
    print("Testing status prevention integration...")
    
    local battleState = createTestBattleState("terrain-status-test")
    
    -- Set up Misty Terrain (prevents all status)
    battleState.terrain, _, _ = TerrainEffects.setTerrain(
        battleState.terrain,
        TerrainEffects.TerrainType.MISTY,
        nil,
        "test"
    )
    
    -- Test status prevention for grounded Pokemon
    local statusConditions = {"sleep", "poison", "paralysis", "burn", "freeze"}
    for _, status in ipairs(statusConditions) do
        local prevented = TerrainEffects.doesTerrainPreventStatus(
            status,
            battleState.terrain,
            true -- grounded
        )
        assertTrue(prevented, "Misty Terrain should prevent " .. status .. " for grounded Pokemon")
    end
    
    -- Test no prevention for ungrounded Pokemon (Flying type)
    battleState.playerParty[1].types = {Enums.PokemonType.FLYING}
    local notPrevented = TerrainEffects.doesTerrainPreventStatus(
        "sleep",
        battleState.terrain,
        false -- not grounded
    )
    assertFalse(notPrevented, "Misty Terrain should not prevent status for ungrounded Pokemon")
    
    print("✓ Status prevention integration tests passed")
end

-- Test Suite 8: Complete Battle Scenario
local function testCompleteBattleScenario()
    print("Testing complete battle scenario with terrain...")
    
    local battleState = createTestBattleState("complete-terrain-scenario")
    
    -- Set up terrain-setting Pokemon
    battleState.playerParty[1].ability = Enums.AbilityId.GRASSY_SURGE
    battleState.playerParty[1].name = "Tapu Bulu"
    battleState.playerParty[1].currentHP = 50 -- Damaged for healing test
    
    -- Initialize battle (should set Grassy Terrain)
    battleState.terrain = TerrainEffects.initializeTerrainState(battleState.battleId)
    local updatedTerrain, activationMessage = TerrainAbilities.processTerrainSurgeAbility(
        battleState.playerParty[1],
        battleState.terrain
    )
    battleState.terrain = updatedTerrain
    
    -- Verify terrain is set
    assertEquals(TerrainEffects.TerrainType.GRASSY, battleState.terrain.current_terrain, "Should have Grassy Terrain")
    assertNotNil(activationMessage, "Should have activation message")
    
    -- Test Grass-type move power boost
    local grassMove = {
        id = Enums.MoveId.ABSORB,
        name = "Solar Beam",
        type = Enums.PokemonType.GRASS,
        power = 120,
        priority = 0
    }
    
    local groundedPokemon = battleState.playerParty[1]
    local isGrounded = TerrainEffects.isPokemonGrounded(groundedPokemon)
    assertTrue(isGrounded, "Pokemon should be grounded")
    
    local powerModifier = TerrainEffects.getTerrainMovePowerModifier(
        grassMove,
        battleState.terrain,
        isGrounded
    )
    assertEquals(1.3, powerModifier, "Grass move should get terrain boost")
    
    -- Test end-of-turn healing
    local healingResults = TerrainEffects.processTerrainHealing(
        battleState.terrain,
        {battleState.playerParty[1]}
    )
    
    assertEquals(1, #healingResults, "Should have one healing result")
    assertEquals(battleState.playerParty[1].id, healingResults[1].pokemon_id, "Should heal the player's Pokemon")
    assertTrue(healingResults[1].healing > 0, "Should provide healing")
    
    -- Test terrain duration
    local originalDuration = battleState.terrain.duration_remaining
    local durationTerrain, expired = TerrainEffects.updateTerrainDuration(battleState.terrain)
    assertEquals(originalDuration - 1, durationTerrain.duration_remaining, "Duration should decrease")
    assertFalse(expired, "Terrain should not expire immediately")
    
    print("✓ Complete battle scenario tests passed")
end

-- Test Suite 9: Error Handling and Edge Cases
local function testErrorHandlingAndEdgeCases()
    print("Testing error handling and edge cases...")
    
    -- Test invalid terrain state
    local invalidResult = TerrainEffects.processTerrainHealing(nil, {})
    assertEquals(0, #invalidResult, "Should handle nil terrain state gracefully")
    
    -- Test empty Pokemon list
    local terrainState = TerrainEffects.initializeTerrainState("edge-case-test")
    terrainState, _, _ = TerrainEffects.setTerrain(terrainState, TerrainEffects.TerrainType.GRASSY, nil, "test")
    
    local emptyResult = TerrainEffects.processTerrainHealing(terrainState, {})
    assertEquals(0, #emptyResult, "Should handle empty Pokemon list")
    
    -- Test terrain switching (new terrain replaces old)
    local switchingState = TerrainEffects.initializeTerrainState("terrain-switch-test")
    switchingState, _, _ = TerrainEffects.setTerrain(switchingState, TerrainEffects.TerrainType.ELECTRIC, nil, "first")
    assertEquals(TerrainEffects.TerrainType.ELECTRIC, switchingState.current_terrain, "Should set Electric Terrain")
    
    switchingState, _, _ = TerrainEffects.setTerrain(switchingState, TerrainEffects.TerrainType.GRASSY, nil, "second")
    assertEquals(TerrainEffects.TerrainType.GRASSY, switchingState.current_terrain, "Should switch to Grassy Terrain")
    
    print("✓ Error handling and edge cases tests passed")
end

-- Main test runner
local function runAllTerrainIntegrationTests()
    print("=== Running Terrain Effects Integration Tests ===")
    
    local tests = {
        testBattleInitializationWithTerrain,
        testMultiTurnTerrainEffects,
        testTerrainWeatherStatusIntegration,
        testCompleteMoveTerrainInteraction,
        testPriorityMoveBlocking,
        testTerrainAbilitiesInBattleFlow,
        testStatusPreventionIntegration,
        testCompleteBattleScenario,
        testErrorHandlingAndEdgeCases
    }
    
    local passed = 0
    local failed = 0
    
    for _, test in ipairs(tests) do
        local success, errorMsg = pcall(test)
        if success then
            passed = passed + 1
        else
            failed = failed + 1
            print("❌ Test failed: " .. errorMsg)
        end
    end
    
    print(string.format("\n=== Integration Test Results: %d passed, %d failed ===", passed, failed))
    
    if failed == 0 then
        print("🎉 All terrain integration tests passed!")
    else
        error("Some terrain integration tests failed")
    end
end

-- Export test functions
return {
    runAllTests = runAllTerrainIntegrationTests,
    testBattleInitializationWithTerrain = testBattleInitializationWithTerrain,
    testMultiTurnTerrainEffects = testMultiTurnTerrainEffects,
    testTerrainWeatherStatusIntegration = testTerrainWeatherStatusIntegration,
    testCompleteMoveTerrainInteraction = testCompleteMoveTerrainInteraction,
    testPriorityMoveBlocking = testPriorityMoveBlocking,
    testTerrainAbilitiesInBattleFlow = testTerrainAbilitiesInBattleFlow,
    testStatusPreventionIntegration = testStatusPreventionIntegration,
    testCompleteBattleScenario = testCompleteBattleScenario,
    testErrorHandlingAndEdgeCases = testErrorHandlingAndEdgeCases
}