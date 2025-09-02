-- Field Conditions Integration Tests
-- Complete battle workflow scenarios with field conditions
-- Tests Trick Room, Wonder Room, Magic Room in full battle context
-- Validates integration with battle handler, turn processor, and environmental systems

print("🔄 Running Field Conditions Integration Tests")
print("=============================================")

-- Load systems under test
local BattleHandler = require("handlers.battle-handler")
local TurnProcessor = require("game-logic.battle.turn-processor")
local FieldConditions = require("game-logic.battle.field-conditions")
local BattleConditions = require("game-logic.battle.battle-conditions")
local PriorityCalculator = require("game-logic.battle.priority-calculator")
local StatCalculator = require("game-logic.pokemon.stat-calculator")
local MoveEffects = require("game-logic.battle.move-effects")

-- Integration test class
TestFieldConditionsIntegration = {}

function TestFieldConditionsIntegration:setUp()
    -- Create comprehensive test battle setup
    self.testBattleId = "integration_test_battle"
    self.testBattleSeed = "field_conditions_test_seed_2025"
    
    -- Create test Pokemon with realistic stats
    self.fastPokemon = {
        id = "fast_pokemon_001",
        name = "Fast Pokemon",
        stats = {
            hp = 100, attack = 80, defense = 70, 
            spAttack = 90, spDefense = 75, speed = 150,
            def = 70, spdef = 75 -- Compatibility
        },
        currentHP = 100,
        maxHP = 100,
        heldItem = "choice_scarf",
        moves = {1, 433, 85, 104}, -- Pound, Trick Room, Thunderbolt, Double Team
        battleData = {
            side = "player",
            statStages = {speed = 0, defense = 0, spDefense = 0}
        }
    }
    
    self.slowPokemon = {
        id = "slow_pokemon_001", 
        name = "Slow Pokemon",
        stats = {
            hp = 120, attack = 120, defense = 90,
            spAttack = 60, spDefense = 110, speed = 40,
            def = 90, spdef = 110 -- Compatibility
        },
        currentHP = 120,
        maxHP = 120,
        heldItem = "leftovers",
        moves = {1, 472, 85, 104}, -- Pound, Wonder Room, Thunderbolt, Double Team
        battleData = {
            side = "enemy",
            statStages = {speed = 0, defense = 0, spDefense = 0}
        }
    }
    
    self.playerParty = {self.fastPokemon}
    self.enemyParty = {self.slowPokemon}
end

function TestFieldConditionsIntegration:tearDown()
    -- Clean up test data
    self.testBattleId = nil
    self.testBattleSeed = nil
    self.fastPokemon = nil
    self.slowPokemon = nil
    self.playerParty = nil
    self.enemyParty = nil
end

-- Test full battle initialization with field conditions
function TestFieldConditionsIntegration:test_battleInitializationWithFieldConditions()
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    
    luaunit.assertNotNil(battleState)
    luaunit.assertNil(error)
    luaunit.assertNotNil(battleState.fieldConditions)
    luaunit.assertEquals(type(battleState.fieldConditions), "table")
    luaunit.assertEquals(battleState.battleId, self.testBattleId)
end

-- Test Trick Room activation and priority reversal in battle
function TestFieldConditionsIntegration:test_trickRoomBattleIntegration()
    -- Initialize battle
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Set up Trick Room field condition
    local success, trickRoomResult = MoveEffects.processTrickRoomEffect(battleState, self.slowPokemon)
    luaunit.assertTrue(success)
    luaunit.assertNotNil(battleState.fieldConditions[FieldConditions.FieldEffectType.TRICK_ROOM])
    luaunit.assertEquals(battleState.trickRoom, 5) -- Compatibility with priority calculator
    
    -- Create battle actions
    local fastAction = PriorityCalculator.createTurnAction("move", self.fastPokemon, 1, self.slowPokemon)
    local slowAction = PriorityCalculator.createTurnAction("move", self.slowPokemon, 1, self.fastPokemon)
    
    -- Calculate turn order with Trick Room
    local completeConditions = battleState.battleConditions or {}
    completeConditions.fieldConditions = battleState.fieldConditions
    completeConditions.trickRoom = 5
    
    local orderedActions = PriorityCalculator.calculateTurnOrder({fastAction, slowAction}, completeConditions)
    
    -- Slow Pokemon should go first in Trick Room
    luaunit.assertEquals(orderedActions[1].pokemon.id, "slow_pokemon_001")
    luaunit.assertEquals(orderedActions[2].pokemon.id, "fast_pokemon_001")
end

-- Test Wonder Room stat swapping in damage calculation context
function TestFieldConditionsIntegration:test_wonderRoomBattleIntegration()
    -- Initialize battle
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Set up Wonder Room field condition
    local success, wonderRoomResult = MoveEffects.processWonderRoomEffect(battleState, self.fastPokemon)
    luaunit.assertTrue(success)
    luaunit.assertNotNil(battleState.fieldConditions[FieldConditions.FieldEffectType.WONDER_ROOM])
    luaunit.assertEquals(battleState.wonderRoom, 5)
    
    -- Test stat modifications
    local modifiedPokemon = StatCalculator.applyFieldConditionStatModifications(
        self.slowPokemon,
        battleState.fieldConditions
    )
    
    -- Defense and Special Defense should be swapped
    luaunit.assertEquals(modifiedPokemon.stats.defense, 110) -- Was spDefense
    luaunit.assertEquals(modifiedPokemon.stats.spDefense, 90) -- Was defense
    luaunit.assertTrue(modifiedPokemon.wonder_room_active)
end

-- Test Magic Room item suppression in battle
function TestFieldConditionsIntegration:test_magicRoomBattleIntegration()
    -- Initialize battle
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Set up Magic Room field condition
    local success, magicRoomResult = MoveEffects.processMagicRoomEffect(battleState, self.fastPokemon)
    luaunit.assertTrue(success)
    luaunit.assertNotNil(battleState.fieldConditions[FieldConditions.FieldEffectType.MAGIC_ROOM])
    luaunit.assertEquals(battleState.magicRoom, 5)
    
    -- Test item suppression
    local isItemSuppressed = FieldConditions.isHeldItemSuppressed(
        self.fastPokemon,
        battleState.fieldConditions
    )
    luaunit.assertTrue(isItemSuppressed)
end

-- Test field condition duration tracking through multiple turns
function TestFieldConditionsIntegration:test_fieldConditionDurationTracking()
    -- Initialize battle
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Set up multiple field conditions
    MoveEffects.processTrickRoomEffect(battleState, self.slowPokemon)
    MoveEffects.processWonderRoomEffect(battleState, self.fastPokemon)
    MoveEffects.processMagicRoomEffect(battleState, self.slowPokemon)
    
    -- Process end of turn effects multiple times
    for turn = 1, 3 do
        local endTurnResult = TurnProcessor.processEndOfTurnEffects(battleState)
        
        luaunit.assertNotNil(endTurnResult.field_condition_updates)
        luaunit.assertNotNil(endTurnResult.field_condition_updates.active_conditions)
        
        -- Check duration countdown
        for _, condition in ipairs(endTurnResult.field_condition_updates.active_conditions) do
            luaunit.assertEquals(condition.duration, 5 - turn) -- Should countdown each turn
        end
    end
    
    -- After 5 turns, conditions should expire
    for turn = 4, 6 do
        TurnProcessor.processEndOfTurnEffects(battleState)
    end
    
    local finalSummary = FieldConditions.getActiveFieldConditionSummary(battleState.fieldConditions)
    luaunit.assertEquals(finalSummary.active_count, 0) -- All conditions should be expired
end

-- Test field condition coexistence in battle
function TestFieldConditionsIntegration:test_fieldConditionCoexistenceInBattle()
    -- Initialize battle
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Activate all three field conditions
    local trickRoomSuccess = MoveEffects.processTrickRoomEffect(battleState, self.slowPokemon)
    local wonderRoomSuccess = MoveEffects.processWonderRoomEffect(battleState, self.fastPokemon)
    local magicRoomSuccess = MoveEffects.processMagicRoomEffect(battleState, self.slowPokemon)
    
    luaunit.assertTrue(trickRoomSuccess)
    luaunit.assertTrue(wonderRoomSuccess)
    luaunit.assertTrue(magicRoomSuccess)
    
    -- All should coexist
    local summary = FieldConditions.getActiveFieldConditionSummary(battleState.fieldConditions)
    luaunit.assertEquals(summary.active_count, 3)
    luaunit.assertTrue(summary.global_effects.priority_reversal) -- Trick Room
    luaunit.assertTrue(summary.global_effects.stat_swapping) -- Wonder Room
    luaunit.assertTrue(summary.global_effects.item_suppression) -- Magic Room
end

-- Test field condition removal through moves
function TestFieldConditionsIntegration:test_fieldConditionRemovalInBattle()
    -- Initialize battle with field conditions
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Set up Trick Room
    MoveEffects.processTrickRoomEffect(battleState, self.slowPokemon)
    luaunit.assertNotNil(battleState.fieldConditions[FieldConditions.FieldEffectType.TRICK_ROOM])
    
    -- Use Trick Room again to remove it (toggle effect)
    local trickRoomMoveData = {
        name = "Trick Room",
        effects = {field_condition = FieldConditions.FieldEffectType.TRICK_ROOM}
    }
    
    local removalSuccess, removalResult = MoveEffects.processFieldConditionMove(
        battleState,
        trickRoomMoveData,
        self.fastPokemon
    )
    
    -- Should fail because Trick Room is already active
    luaunit.assertFalse(removalSuccess)
    luaunit.assertStrContains(removalResult, "already active")
end

-- Test field condition integration with environmental systems
function TestFieldConditionsIntegration:test_fieldConditionEnvironmentalIntegration()
    -- Initialize battle
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Set up weather and terrain
    BattleConditions.setWeather("test_battle", BattleConditions.WeatherType.RAIN, 5, "move")
    BattleConditions.setTerrain("test_battle", BattleConditions.TerrainType.ELECTRIC, 5, "move")
    
    -- Set up field conditions
    MoveEffects.processTrickRoomEffect(battleState, self.slowPokemon)
    MoveEffects.processWonderRoomEffect(battleState, self.fastPokemon)
    
    -- Process combined environmental and field effects
    local combinedResults = BattleConditions.processCompleteEnvironmentalAndFieldEffects(
        self.testBattleId,
        {self.fastPokemon, self.slowPokemon},
        BattleConditions.WeatherType.RAIN,
        BattleConditions.TerrainType.ELECTRIC,
        battleState.fieldConditions
    )
    
    luaunit.assertNotNil(combinedResults)
    luaunit.assertNotNil(combinedResults.environmental_effects)
    luaunit.assertNotNil(combinedResults.field_condition_effects)
    luaunit.assertNotNil(combinedResults.combined_interactions)
    
    -- Field conditions should not conflict with weather/terrain
    luaunit.assertEquals(#combinedResults.combined_interactions.precedence_rules, 1)
    luaunit.assertEquals(combinedResults.combined_interactions.precedence_rules[1].rule, "field_conditions_independent")
end

-- Test complete battle turn with field conditions
function TestFieldConditionsIntegration:test_completeBattleTurnWithFieldConditions()
    -- Initialize battle
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Set up turn commands to use Trick Room
    battleState.turnCommands = {
        [self.fastPokemon.id] = {
            type = "move",
            moveId = 433, -- Trick Room
            target = nil -- Self-targeting
        },
        [self.slowPokemon.id] = {
            type = "move", 
            moveId = 1, -- Pound
            target = self.fastPokemon.id
        }
    }
    
    -- Process complete battle turn
    local turnResult, turnError = TurnProcessor.processBattleTurn(battleState)
    
    luaunit.assertNotNil(turnResult)
    luaunit.assertNil(turnError)
    luaunit.assertTrue(turnResult.turn >= 1)
    luaunit.assertNotNil(turnResult.actions_executed)
    
    -- Trick Room should be active after the turn
    luaunit.assertNotNil(battleState.fieldConditions[FieldConditions.FieldEffectType.TRICK_ROOM])
    luaunit.assertEquals(battleState.trickRoom, 5)
end

-- Test field condition persistence across battle state queries
function TestFieldConditionsIntegration:test_fieldConditionPersistence()
    -- Initialize battle
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Set up field conditions
    MoveEffects.processTrickRoomEffect(battleState, self.slowPokemon)
    MoveEffects.processWonderRoomEffect(battleState, self.fastPokemon)
    
    -- Simulate battle state query (like getBattleState handler)
    local stateSummary = {
        battle_id = battleState.battleId,
        turn = battleState.turn,
        phase = battleState.phase,
        battle_conditions = battleState.battleConditions,
        field_conditions = battleState.fieldConditions or {}
    }
    
    luaunit.assertNotNil(stateSummary.field_conditions)
    luaunit.assertNotNil(stateSummary.field_conditions[FieldConditions.FieldEffectType.TRICK_ROOM])
    luaunit.assertNotNil(stateSummary.field_conditions[FieldConditions.FieldEffectType.WONDER_ROOM])
    luaunit.assertEquals(stateSummary.field_conditions[FieldConditions.FieldEffectType.TRICK_ROOM].duration, 5)
end

-- Test field condition move failure when already active
function TestFieldConditionsIntegration:test_fieldConditionMoveFailure()
    -- Initialize battle
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Activate Trick Room
    local success1, result1 = MoveEffects.processTrickRoomEffect(battleState, self.slowPokemon)
    luaunit.assertTrue(success1)
    
    -- Try to activate Trick Room again (should fail)
    local success2, result2 = MoveEffects.processTrickRoomEffect(battleState, self.fastPokemon)
    luaunit.assertFalse(success2)
    luaunit.assertStrContains(result2, "already active")
end

-- Test multi-turn field condition scenario
function TestFieldConditionsIntegration:test_multiTurnFieldConditionScenario()
    -- Initialize battle
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Activate Wonder Room
    MoveEffects.processWonderRoomEffect(battleState, self.fastPokemon)
    
    -- Process 6 turns to test duration and expiration
    for turn = 1, 6 do
        battleState.turn = turn
        
        local endTurnResult = TurnProcessor.processEndOfTurnEffects(battleState)
        luaunit.assertNotNil(endTurnResult)
        
        if turn <= 5 then
            -- Wonder Room should still be active
            luaunit.assertNotNil(battleState.fieldConditions[FieldConditions.FieldEffectType.WONDER_ROOM])
            luaunit.assertEquals(battleState.fieldConditions[FieldConditions.FieldEffectType.WONDER_ROOM].duration, 5 - turn + 1)
        else
            -- Wonder Room should have expired
            local summary = FieldConditions.getActiveFieldConditionSummary(battleState.fieldConditions)
            luaunit.assertEquals(summary.active_count, 0)
        end
    end
end

-- Test field condition interaction with priority calculation
function TestFieldConditionsIntegration:test_fieldConditionPriorityIntegration()
    -- Initialize battle
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Test normal priority
    local fastAction = PriorityCalculator.createTurnAction("move", self.fastPokemon, 1, nil)
    local slowAction = PriorityCalculator.createTurnAction("move", self.slowPokemon, 1, nil)
    
    local normalOrder = PriorityCalculator.calculateTurnOrder({fastAction, slowAction}, battleState.battleConditions)
    luaunit.assertEquals(normalOrder[1].pokemon.id, "fast_pokemon_001") -- Fast first normally
    
    -- Activate Trick Room
    MoveEffects.processTrickRoomEffect(battleState, self.slowPokemon)
    
    -- Test priority with Trick Room
    local completeConditions = battleState.battleConditions or {}
    completeConditions.fieldConditions = battleState.fieldConditions
    completeConditions.trickRoom = 5
    
    local trickRoomOrder = PriorityCalculator.calculateTurnOrder({fastAction, slowAction}, completeConditions)
    luaunit.assertEquals(trickRoomOrder[1].pokemon.id, "slow_pokemon_001") -- Slow first in Trick Room
end

-- Test field condition notifications in battle context
function TestFieldConditionsIntegration:test_fieldConditionNotificationsInBattle()
    -- Initialize battle
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Track field condition changes
    local conditionChanges = {
        {
            type = "activation",
            field_effect_type = FieldConditions.FieldEffectType.TRICK_ROOM
        }
    }
    
    local notifications = FieldConditions.generateFieldConditionNotifications(
        conditionChanges,
        "immediate"
    )
    
    luaunit.assertEquals(notifications.timing, "immediate")
    luaunit.assertEquals(notifications.condition_count, 1)
    luaunit.assertTrue(#notifications.messages > 0)
end

-- Test comprehensive field condition battle scenario
function TestFieldConditionsIntegration:test_comprehensiveFieldConditionBattle()
    -- Initialize battle
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Turn 1: Fast Pokemon uses Trick Room
    local trickRoomSuccess = MoveEffects.processTrickRoomEffect(battleState, self.fastPokemon)
    luaunit.assertTrue(trickRoomSuccess)
    
    -- Turn 2: Slow Pokemon uses Wonder Room  
    local wonderRoomSuccess = MoveEffects.processWonderRoomEffect(battleState, self.slowPokemon)
    luaunit.assertTrue(wonderRoomSuccess)
    
    -- Turn 3: Process combined effects
    local combinedResults = BattleConditions.processCompleteEnvironmentalAndFieldEffects(
        self.testBattleId,
        {self.fastPokemon, self.slowPokemon},
        BattleConditions.WeatherType.NONE,
        BattleConditions.TerrainType.NONE,
        battleState.fieldConditions
    )
    
    luaunit.assertNotNil(combinedResults.field_condition_effects)
    luaunit.assertEquals(#combinedResults.field_condition_effects.priority_effects, 1) -- Trick Room
    luaunit.assertEquals(#combinedResults.field_condition_effects.stat_modification_effects, 2) -- Wonder Room on both Pokemon
    
    -- Test priority calculation with both conditions
    local fastAction = PriorityCalculator.createTurnAction("move", self.fastPokemon, 1, nil)
    local slowAction = PriorityCalculator.createTurnAction("move", self.slowPokemon, 1, nil)
    
    local completeConditions = battleState.battleConditions or {}
    completeConditions.fieldConditions = battleState.fieldConditions
    completeConditions.trickRoom = 5
    
    local orderedActions = PriorityCalculator.calculateTurnOrder({fastAction, slowAction}, completeConditions)
    luaunit.assertEquals(orderedActions[1].pokemon.id, "slow_pokemon_001") -- Trick Room effect
    
    -- Test stat modifications
    local modifiedFast = StatCalculator.applyFieldConditionStatModifications(
        self.fastPokemon,
        battleState.fieldConditions
    )
    luaunit.assertEquals(modifiedFast.stats.defense, 75) -- Was spDefense (Wonder Room)
    luaunit.assertEquals(modifiedFast.stats.spDefense, 70) -- Was defense (Wonder Room)
end

-- Test field condition error handling and edge cases
function TestFieldConditionsIntegration:test_fieldConditionErrorHandling()
    -- Initialize battle
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Test invalid field condition
    local invalidSuccess, invalidResult = FieldConditions.setFieldEffect(
        self.testBattleId,
        999, -- Invalid type
        5,
        "move",
        self.fastPokemon
    )
    luaunit.assertFalse(invalidSuccess)
    luaunit.assertStrContains(invalidResult, "Unknown field effect type")
    
    -- Test processing with corrupted battle state
    local corruptedState = {}
    local endTurnResult = TurnProcessor.processEndOfTurnEffects(corruptedState)
    luaunit.assertNotNil(endTurnResult) -- Should handle gracefully
end

-- Test field condition move effects in move execution
function TestFieldConditionsIntegration:test_fieldConditionMoveEffectsIntegration()
    -- Create mock move data for field condition moves
    local trickRoomMoveData = {
        id = 433,
        name = "Trick Room",
        type = 13, -- Psychic
        category = 2, -- Status
        power = 0,
        accuracy = -1, -- Never misses
        priority = -7,
        target = 7, -- All
        effects = {field_condition = 1} -- TRICK_ROOM
    }
    
    -- Initialize battle
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    luaunit.assertNotNil(battleState)
    
    -- Execute Trick Room move through move effects system
    local moveResult = MoveEffects.executeMove(battleState, self.slowPokemon, trickRoomMoveData, nil)
    
    luaunit.assertTrue(moveResult.success)
    luaunit.assertTrue(moveResult.fieldConditionChanged)
    luaunit.assertNotNil(battleState.fieldConditions[FieldConditions.FieldEffectType.TRICK_ROOM])
    luaunit.assertTrue(#moveResult.messages > 0)
end

-- Test field condition parity with TypeScript behavior
function TestFieldConditionsIntegration:test_fieldConditionTypeScriptParity()
    -- This test validates that field condition mechanics match TypeScript implementation
    
    -- Test Trick Room duration (exactly 5 turns)
    local battleState, error = TurnProcessor.initializeBattle(
        self.testBattleId,
        self.testBattleSeed,
        self.playerParty,
        self.enemyParty
    )
    
    local success, result = MoveEffects.processTrickRoomEffect(battleState, self.slowPokemon)
    luaunit.assertTrue(success)
    luaunit.assertEquals(result.duration, 5) -- Must be exactly 5 turns
    
    -- Test Wonder Room stat swapping (exact swap, no modifiers)
    local wonderSuccess, wonderResult = MoveEffects.processWonderRoomEffect(battleState, self.fastPokemon)
    luaunit.assertTrue(wonderSuccess)
    
    local modifiedStats = StatCalculator.applyFieldConditionStatModifications(
        self.slowPokemon,
        battleState.fieldConditions
    )
    
    -- Exact stat values after swap
    luaunit.assertEquals(modifiedStats.stats.defense, 110) -- Was spDefense
    luaunit.assertEquals(modifiedStats.stats.spDefense, 90) -- Was defense
    
    -- Test Magic Room item suppression (complete suppression)
    local magicSuccess, magicResult = MoveEffects.processMagicRoomEffect(battleState, self.slowPokemon)
    luaunit.assertTrue(magicSuccess)
    
    local itemSuppressed = FieldConditions.isHeldItemSuppressed(self.fastPokemon, battleState.fieldConditions)
    luaunit.assertTrue(itemSuppressed) -- Items completely suppressed
end

-- Run all integration tests
function TestFieldConditionsIntegration:run()
    print("Running Field Conditions Integration Tests...")
    luaunit.LuaUnit.run()
end

return TestFieldConditionsIntegration