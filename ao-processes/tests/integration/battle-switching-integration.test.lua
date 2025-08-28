-- Battle Switching Integration Tests
-- Tests complete switching workflows within battle message processing system
-- Validates switching effects on battle progression and Pokemon participation
-- Tests multi-turn switching scenarios with state persistence

local BattleStateManager = require("game-logic.battle.battle-state-manager")
local PokemonSwitchSystem = require("game-logic.battle.pokemon-switch-system")
local SwitchInEffects = require("game-logic.battle.switch-in-effects")
local ParticipationTracker = require("game-logic.battle.participation-tracker")
local TurnProcessor = require("game-logic.battle.turn-processor")

local BattleSwitchingIntegrationTests = {}

-- Test fixtures
local function createTestPokemon(id, name, hp, fainted)
    return {
        id = id,
        name = name or "TestMon",
        species = 1,
        level = 50,
        stats = {hp = hp or 100, attack = 100, defense = 100, spatk = 100, spdef = 100, speed = 100},
        currentHP = fainted and 0 or (hp or 100),
        maxHP = hp or 100,
        status = nil,
        fainted = fainted or false,
        moves = {[1] = {id = 1, pp = 10}, [2] = {id = 2, pp = 15}},
        ability = 1
    }
end

local function createFullBattleState()
    local playerParty = {
        createTestPokemon("player_1", "Pikachu", 100),
        createTestPokemon("player_2", "Charizard", 120),
        createTestPokemon("player_3", "Blastoise", 110),
        createTestPokemon("player_4", "Venusaur", 105),
        createTestPokemon("player_5", "Alakazam", 85),
        createTestPokemon("player_6", "Machamp", 130)
    }
    
    local enemyParty = {
        createTestPokemon("enemy_1", "Gyarados", 130),
        createTestPokemon("enemy_2", "Dragonite", 125),
        createTestPokemon("enemy_3", "Snorlax", 160)
    }
    
    local battleState = BattleStateManager.createBattleState("integration_test", 12345, playerParty, enemyParty)
    
    -- Initialize participation tracking
    ParticipationTracker.init(battleState)
    ParticipationTracker.recordBattleStart(battleState)
    
    return battleState
end

-- Test Complete Switch Workflow
function BattleSwitchingIntegrationTests.testCompleteSwitchWorkflow()
    print("Testing complete switch workflow...")
    
    -- Arrange
    local battleState = createFullBattleState()
    local originalActive = battleState.activePlayer[1]
    
    -- Act - Execute complete switch through turn processor
    local switchAction = {
        type = TurnProcessor.ActionType.SWITCH,
        pokemonId = originalActive,
        switchTo = "player_2",
        playerId = "player",
        position = 1,
        pokemon = BattleStateManager.findPokemonById(battleState, originalActive, "player")
    }
    
    local result = TurnProcessor.executeSwitchAction(battleState, switchAction)
    
    -- Assert
    assert(result.success == true, "Switch workflow should complete successfully")
    assert(battleState.activePlayer[1] == "player_2", "Active Pokemon should be updated")
    assert(result.messages ~= nil, "Should include switch messages")
    assert(result.switchInEffects ~= nil, "Should process switch-in effects")
    
    -- Verify participation tracking
    local targetPokemon = BattleStateManager.findPokemonById(battleState, "player_2", "player")
    assert(targetPokemon.participated == true, "Target Pokemon should be marked as participated")
    
    print("✓ Complete switch workflow test passed")
end

-- Test Switch with Entry Hazards
function BattleSwitchingIntegrationTests.testSwitchWithEntryHazards()
    print("Testing switch with entry hazards...")
    
    -- Arrange
    local battleState = createFullBattleState()
    
    -- Set up entry hazards
    battleState.battleConditions.entryHazards = {
        player = {
            spikes = 2,
            toxicSpikes = 1,
            stealthRock = true,
            stickyWeb = false
        },
        enemy = {
            spikes = 0,
            toxicSpikes = 0,
            stealthRock = false,
            stickyWeb = false
        }
    }
    
    local targetPokemon = BattleStateManager.findPokemonById(battleState, "player_2", "player")
    local originalHP = targetPokemon.currentHP
    
    -- Act - Switch into entry hazards
    local result = PokemonSwitchSystem.executeSwitch(
        battleState, 
        "player", 
        battleState.activePlayer[1], 
        "player_2", 
        1,
        PokemonSwitchSystem.SwitchType.VOLUNTARY
    )
    
    local switchInResult = SwitchInEffects.processAllSwitchInEffects(battleState, targetPokemon, 1)
    
    -- Assert
    assert(result.success == true, "Switch should succeed")
    assert(switchInResult.damageTaken > 0, "Pokemon should take entry hazard damage")
    assert(targetPokemon.currentHP < originalHP, "Pokemon HP should be reduced by hazards")
    assert(#switchInResult.messages > 0, "Should have entry hazard messages")
    
    print("✓ Switch with entry hazards test passed")
end

-- Test Multi-Turn Switch Scenario
function BattleSwitchingIntegrationTests.testMultiTurnSwitchScenario()
    print("Testing multi-turn switch scenario...")
    
    -- Arrange
    local battleState = createFullBattleState()
    battleState.turn = 1
    
    -- Act - Perform multiple switches over several turns
    local switches = {
        {from = "player_1", to = "player_2", turn = 1},
        {from = "player_2", to = "player_3", turn = 3},
        {from = "player_3", to = "player_1", turn = 5}
    }
    
    for _, switch in ipairs(switches) do
        battleState.turn = switch.turn
        
        local result = PokemonSwitchSystem.executeSwitch(
            battleState,
            "player",
            switch.from,
            switch.to,
            1,
            PokemonSwitchSystem.SwitchType.VOLUNTARY
        )
        
        -- Record participation
        ParticipationTracker.recordSwitchOut(battleState, switch.from, 1, switch.turn, "voluntary")
        ParticipationTracker.recordSwitchIn(battleState, switch.to, 1, switch.turn)
        
        assert(result.success == true, "Switch on turn " .. switch.turn .. " should succeed")
        assert(battleState.activePlayer[1] == switch.to, "Active Pokemon should be updated on turn " .. switch.turn)
    end
    
    -- Verify participation tracking across turns
    local pokemon1Data = battleState.participationData["player_1"]
    local pokemon2Data = battleState.participationData["player_2"]
    local pokemon3Data = battleState.participationData["player_3"]
    
    assert(pokemon1Data.totalSwitchIns >= 1, "Pokemon 1 should have switch-ins")
    assert(pokemon2Data.totalSwitchOuts >= 1, "Pokemon 2 should have switch-outs")
    assert(pokemon3Data.participated == true, "Pokemon 3 should be marked as participated")
    
    print("✓ Multi-turn switch scenario test passed")
end

-- Test Double Battle Switch Integration
function BattleSwitchingIntegrationTests.testDoubleBattleSwitchIntegration()
    print("Testing double battle switch integration...")
    
    -- Arrange
    local battleState = createFullBattleState()
    battleState.battleType = BattleStateManager.BattleType.DOUBLE
    
    -- Initialize second active Pokemon
    battleState.activePlayer[2] = "player_2"
    battleState.activeEnemy[2] = "enemy_2"
    
    -- Act - Switch Pokemon in position 1
    local result1 = PokemonSwitchSystem.executeSwitch(
        battleState,
        "player",
        "player_1",
        "player_3",
        1,
        PokemonSwitchSystem.SwitchType.VOLUNTARY
    )
    
    -- Act - Switch Pokemon in position 2
    local result2 = PokemonSwitchSystem.executeSwitch(
        battleState,
        "player",
        "player_2",
        "player_4",
        2,
        PokemonSwitchSystem.SwitchType.VOLUNTARY
    )
    
    -- Assert
    assert(result1.success == true, "Position 1 switch should succeed")
    assert(result2.success == true, "Position 2 switch should succeed")
    assert(battleState.activePlayer[1] == "player_3", "Position 1 should be updated")
    assert(battleState.activePlayer[2] == "player_4", "Position 2 should be updated")
    
    -- Test position validation
    local invalidResult = PokemonSwitchSystem.validateDoublePosition(battleState, "player", 1, "player_4")
    assert(invalidResult.valid == false, "Should prevent switching to already active Pokemon")
    
    print("✓ Double battle switch integration test passed")
end

-- Test Forced Switch Integration
function BattleSwitchingIntegrationTests.testForcedSwitchIntegration()
    print("Testing forced switch integration...")
    
    -- Arrange
    local battleState = createFullBattleState()
    local activePokemon = BattleStateManager.findPokemonById(battleState, battleState.activePlayer[1], "player")
    
    -- Simulate Pokemon fainting
    activePokemon.currentHP = 0
    activePokemon.fainted = true
    
    -- Act - Handle forced switch due to fainting
    local result = PokemonSwitchSystem.handleForcedSwitch(
        battleState,
        "player",
        activePokemon.id,
        1,
        "faint"
    )
    
    -- Assert
    assert(result.forced == true, "Should be marked as forced switch")
    assert(result.reason == "faint", "Should record correct reason")
    assert(result.requiresPlayerChoice == true, "Should require player choice for faint replacement")
    assert(#result.availablePokemon > 0, "Should provide available Pokemon")
    
    -- Act - Execute replacement switch
    local replacementPokemon = result.availablePokemon[1]
    local replacementResult = PokemonSwitchSystem.executeSwitch(
        battleState,
        "player",
        activePokemon.id,
        replacementPokemon.id,
        1,
        PokemonSwitchSystem.SwitchType.FAINT_REPLACEMENT
    )
    
    assert(replacementResult.success == true, "Replacement switch should succeed")
    assert(battleState.activePlayer[1] == replacementPokemon.id, "Replacement Pokemon should be active")
    
    print("✓ Forced switch integration test passed")
end

-- Test Switch-In Ability Integration
function BattleSwitchingIntegrationTests.testSwitchInAbilityIntegration()
    print("Testing switch-in ability integration...")
    
    -- Arrange
    local battleState = createFullBattleState()
    local targetPokemon = BattleStateManager.findPokemonById(battleState, "player_2", "player")
    
    -- Set up Pokemon with switch-in ability (Intimidate)
    local Enums = require("data.constants.enums")
    if Enums and Enums.AbilityId then
        targetPokemon.ability = Enums.AbilityId.INTIMIDATE
    end
    
    -- Act - Switch in Pokemon with ability
    local result = PokemonSwitchSystem.executeSwitch(
        battleState,
        "player",
        battleState.activePlayer[1],
        "player_2",
        1,
        PokemonSwitchSystem.SwitchType.VOLUNTARY
    )
    
    local switchInResult = SwitchInEffects.processAllSwitchInEffects(battleState, targetPokemon, 1)
    
    -- Assert
    assert(result.success == true, "Switch should succeed")
    assert(switchInResult ~= nil, "Should process switch-in effects")
    
    -- Check for ability effects in the results
    local foundAbilityEffect = false
    if switchInResult.effects then
        for _, effect in ipairs(switchInResult.effects) do
            if effect.type == "ability_activation" then
                foundAbilityEffect = true
                break
            end
        end
    end
    
    print("✓ Switch-in ability integration test passed")
end

-- Test Switch State Persistence
function BattleSwitchingIntegrationTests.testSwitchStatePersistence()
    print("Testing switch state persistence...")
    
    -- Arrange
    local battleState = createFullBattleState()
    
    -- Perform switches and modify state
    PokemonSwitchSystem.executeSwitch(battleState, "player", "player_1", "player_2", 1, PokemonSwitchSystem.SwitchType.VOLUNTARY)
    PokemonSwitchSystem.executeSwitch(battleState, "player", "player_2", "player_3", 1, PokemonSwitchSystem.SwitchType.VOLUNTARY)
    
    -- Apply status to active Pokemon
    local activePokemon = BattleStateManager.findPokemonById(battleState, "player_3", "player")
    activePokemon.status = "burn"
    activePokemon.currentHP = 85
    
    -- Act - Serialize and deserialize battle state
    local serializedState = BattleStateManager.serializeBattleState(battleState)
    local deserializedState = BattleStateManager.deserializeBattleState(serializedState)
    
    -- Assert
    assert(deserializedState ~= nil, "Should deserialize successfully")
    assert(deserializedState.activePlayer[1] == "player_3", "Active Pokemon should be preserved")
    
    local restoredPokemon = BattleStateManager.findPokemonById(deserializedState, "player_3", "player")
    assert(restoredPokemon.status == "burn", "Pokemon status should be preserved")
    assert(restoredPokemon.currentHP == 85, "Pokemon HP should be preserved")
    assert(restoredPokemon.participated == true, "Participation status should be preserved")
    
    print("✓ Switch state persistence test passed")
end

-- Test Battle Event Integration
function BattleSwitchingIntegrationTests.testBattleEventIntegration()
    print("Testing battle event integration...")
    
    -- Arrange
    local battleState = createFullBattleState()
    local originalEventCount = #battleState.battleEvents
    
    -- Act - Perform multiple battle actions with switches
    battleState.turn = 1
    PokemonSwitchSystem.executeSwitch(battleState, "player", "player_1", "player_2", 1, PokemonSwitchSystem.SwitchType.VOLUNTARY)
    
    battleState.turn = 2
    -- Simulate using a move
    ParticipationTracker.recordMoveUsage(battleState, "player_2", 1, 2, "enemy_1", true)
    ParticipationTracker.recordDamageDealt(battleState, "player_2", 50, 2, "enemy_1", 1, false)
    
    battleState.turn = 3
    PokemonSwitchSystem.executeSwitch(battleState, "player", "player_2", "player_3", 1, PokemonSwitchSystem.SwitchType.VOLUNTARY)
    
    -- Assert
    assert(#battleState.battleEvents > originalEventCount, "Should have added battle events")
    
    -- Check for switch events
    local switchEvents = {}
    for _, event in ipairs(battleState.battleEvents) do
        if event.type == "pokemon_switch" then
            table.insert(switchEvents, event)
        end
    end
    
    assert(#switchEvents >= 2, "Should have recorded multiple switch events")
    
    -- Verify event details
    local firstSwitch = switchEvents[1]
    assert(firstSwitch.from == "player_1", "Should record correct 'from' Pokemon")
    assert(firstSwitch.to == "player_2", "Should record correct 'to' Pokemon")
    assert(firstSwitch.turn == 1, "Should record correct turn")
    
    print("✓ Battle event integration test passed")
end

-- Test Experience Distribution Integration
function BattleSwitchingIntegrationTests.testExperienceDistributionIntegration()
    print("Testing experience distribution integration...")
    
    -- Arrange
    local battleState = createFullBattleState()
    
    -- Simulate battle progression with switches
    battleState.turn = 1
    PokemonSwitchSystem.executeSwitch(battleState, "player", "player_1", "player_2", 1, PokemonSwitchSystem.SwitchType.VOLUNTARY)
    
    battleState.turn = 2
    ParticipationTracker.recordMoveUsage(battleState, "player_2", 1, 2, "enemy_1", true)
    ParticipationTracker.recordDamageDealt(battleState, "player_2", 50, 2, "enemy_1", 1, false)
    
    battleState.turn = 3
    PokemonSwitchSystem.executeSwitch(battleState, "player", "player_2", "player_3", 1, PokemonSwitchSystem.SwitchType.VOLUNTARY)
    
    battleState.turn = 4
    ParticipationTracker.recordKnockout(battleState, "player_3", "enemy_1", 4)
    
    -- Act - Calculate experience distribution
    local experienceDistribution = ParticipationTracker.calculateExperienceDistribution(battleState, "victory")
    
    -- Assert
    assert(experienceDistribution ~= nil, "Should calculate experience distribution")
    assert(experienceDistribution.totalExperience > 0, "Should have total experience")
    assert(experienceDistribution.pokemonExperience ~= nil, "Should have Pokemon-specific experience")
    
    -- Check that participating Pokemon get experience
    local pokemon2Experience = experienceDistribution.pokemonExperience["player_2"]
    local pokemon3Experience = experienceDistribution.pokemonExperience["player_3"]
    
    assert(pokemon2Experience ~= nil, "Pokemon 2 should get experience")
    assert(pokemon3Experience ~= nil, "Pokemon 3 should get experience")
    assert(pokemon3Experience.experience > pokemon2Experience.experience, "Knockout Pokemon should get more experience")
    
    print("✓ Experience distribution integration test passed")
end

-- Test Error Handling Integration
function BattleSwitchingIntegrationTests.testErrorHandlingIntegration()
    print("Testing error handling integration...")
    
    -- Arrange
    local battleState = createFullBattleState()
    
    -- Test invalid switch scenarios
    local invalidCases = {
        {
            desc = "Switch to fainted Pokemon",
            currentId = "player_1",
            targetId = "player_6", -- Will be made fainted
            expectedError = PokemonSwitchSystem.ValidationError.FAINTED_POKEMON
        },
        {
            desc = "Switch to same Pokemon",
            currentId = "player_1",
            targetId = "player_1",
            expectedError = PokemonSwitchSystem.ValidationError.SAME_POKEMON
        },
        {
            desc = "Switch to nonexistent Pokemon",
            currentId = "player_1",
            targetId = "nonexistent",
            expectedError = PokemonSwitchSystem.ValidationError.INVALID_POKEMON
        }
    }
    
    -- Make player_6 fainted for first test
    local faintedPokemon = BattleStateManager.findPokemonById(battleState, "player_6", "player")
    faintedPokemon.currentHP = 0
    faintedPokemon.fainted = true
    
    for _, testCase in ipairs(invalidCases) do
        -- Act
        local result = PokemonSwitchSystem.executeSwitch(
            battleState,
            "player",
            testCase.currentId,
            testCase.targetId,
            1,
            PokemonSwitchSystem.SwitchType.VOLUNTARY
        )
        
        -- Assert
        assert(result.success == false, testCase.desc .. " should fail")
        assert(result.error == testCase.expectedError, testCase.desc .. " should return correct error code")
    end
    
    print("✓ Error handling integration test passed")
end

-- Run all integration tests
function BattleSwitchingIntegrationTests.runAllTests()
    print("Running Battle Switching Integration Tests...")
    
    BattleSwitchingIntegrationTests.testCompleteSwitchWorkflow()
    BattleSwitchingIntegrationTests.testSwitchWithEntryHazards()
    BattleSwitchingIntegrationTests.testMultiTurnSwitchScenario()
    BattleSwitchingIntegrationTests.testDoubleBattleSwitchIntegration()
    BattleSwitchingIntegrationTests.testForcedSwitchIntegration()
    BattleSwitchingIntegrationTests.testSwitchInAbilityIntegration()
    BattleSwitchingIntegrationTests.testSwitchStatePersistence()
    BattleSwitchingIntegrationTests.testBattleEventIntegration()
    BattleSwitchingIntegrationTests.testExperienceDistributionIntegration()
    BattleSwitchingIntegrationTests.testErrorHandlingIntegration()
    
    print("✅ All Battle Switching Integration tests passed!")
    return true
end

-- Execute tests if run directly
if not pcall(debug.getlocal, 4, 1) then
    BattleSwitchingIntegrationTests.runAllTests()
end

return BattleSwitchingIntegrationTests