-- Field Conditions Unit Tests
-- Tests field condition mechanics, duration tracking, and global battle modifications
-- Covers Trick Room, Wonder Room, Magic Room with proper parity validation

local luaunit = require("luaunit")

-- Load the system under test
local FieldConditions = require("game-logic.battle.field-conditions")
local BattleConditions = require("game-logic.battle.battle-conditions")

-- Mock dependencies for isolated testing
local MockBattleRNG = {
    randomInt = function(min, max) return math.floor((min + max) / 2) end
}

-- Test class for Field Conditions
TestFieldConditions = {}

function TestFieldConditions:setUp()
    -- Initialize fresh test state for each test
    self.testBattleId = "test_battle_001"
    self.testFieldConditions = {}
    self.testPokemon = {
        id = "pokemon_001",
        name = "Test Pokemon",
        stats = {
            defense = 80,
            special_defense = 100,
            def = 80,
            spdef = 100
        },
        heldItem = "choice_scarf",
        effectiveSpeed = 150
    }
end

function TestFieldConditions:tearDown()
    -- Clean up after each test
    self.testBattleId = nil
    self.testFieldConditions = nil
    self.testPokemon = nil
end

-- Test Trick Room field condition setting
function TestFieldConditions:test_setTrickRoom()
    local success, result = FieldConditions.setFieldEffect(
        self.testBattleId,
        FieldConditions.FieldEffectType.TRICK_ROOM,
        5,
        "move",
        "test_pokemon"
    )
    
    luaunit.assertTrue(success)
    luaunit.assertNotNil(result)
    luaunit.assertEquals(result.field_effect_type, FieldConditions.FieldEffectType.TRICK_ROOM)
    luaunit.assertEquals(result.field_effect_name, "Trick Room")
    luaunit.assertEquals(result.duration, 5)
    luaunit.assertTrue(result.priority_reversal)
    luaunit.assertTrue(result.global_effect)
end

-- Test Wonder Room field condition setting
function TestFieldConditions:test_setWonderRoom()
    local success, result = FieldConditions.setFieldEffect(
        self.testBattleId,
        FieldConditions.FieldEffectType.WONDER_ROOM,
        5,
        "move",
        "test_pokemon"
    )
    
    luaunit.assertTrue(success)
    luaunit.assertNotNil(result)
    luaunit.assertEquals(result.field_effect_type, FieldConditions.FieldEffectType.WONDER_ROOM)
    luaunit.assertEquals(result.field_effect_name, "Wonder Room")
    luaunit.assertEquals(result.duration, 5)
    luaunit.assertNotNil(result.stat_swap)
    luaunit.assertEquals(result.stat_swap.defense, "special_defense")
    luaunit.assertEquals(result.stat_swap.special_defense, "defense")
end

-- Test Magic Room field condition setting
function TestFieldConditions:test_setMagicRoom()
    local success, result = FieldConditions.setFieldEffect(
        self.testBattleId,
        FieldConditions.FieldEffectType.MAGIC_ROOM,
        5,
        "move",
        "test_pokemon"
    )
    
    luaunit.assertTrue(success)
    luaunit.assertNotNil(result)
    luaunit.assertEquals(result.field_effect_type, FieldConditions.FieldEffectType.MAGIC_ROOM)
    luaunit.assertEquals(result.field_effect_name, "Magic Room")
    luaunit.assertEquals(result.duration, 5)
    luaunit.assertTrue(result.suppresses_items)
end

-- Test invalid field condition setting
function TestFieldConditions:test_setInvalidFieldCondition()
    local success, result = FieldConditions.setFieldEffect(
        self.testBattleId,
        999, -- Invalid field condition type
        5,
        "move",
        "test_pokemon"
    )
    
    luaunit.assertFalse(success)
    luaunit.assertNotNil(result)
    luaunit.assertStrContains(result, "Unknown field effect type")
end

-- Test Trick Room priority processing
function TestFieldConditions:test_trickRoomPriorityProcessing()
    local pokemonActions = {
        {
            pokemon = {id = "fast_pokemon", stats = {speed = 200}},
            effectiveSpeed = 200,
            priority = 0
        },
        {
            pokemon = {id = "slow_pokemon", stats = {speed = 50}},
            effectiveSpeed = 50,
            priority = 0
        }
    }
    
    local fieldConditions = {
        trick_room = 3
    }
    
    local modifiedActions = FieldConditions.processTrickRoomPriority(
        self.testBattleId,
        pokemonActions,
        fieldConditions
    )
    
    luaunit.assertEquals(#modifiedActions, 2)
    luaunit.assertTrue(modifiedActions[1].trick_room_active)
    luaunit.assertTrue(modifiedActions[2].trick_room_active)
    luaunit.assertEquals(modifiedActions[1].original_speed, 200)
    luaunit.assertEquals(modifiedActions[2].original_speed, 50)
end

-- Test Wonder Room stat swapping
function TestFieldConditions:test_wonderRoomStatSwapping()
    local pokemonList = {self.testPokemon}
    local fieldConditions = {
        wonder_room = 3
    }
    
    local modifiedPokemon = FieldConditions.processWonderRoomStats(
        self.testBattleId,
        pokemonList,
        fieldConditions
    )
    
    luaunit.assertEquals(#modifiedPokemon, 1)
    local modified = modifiedPokemon[1]
    
    -- Defense and Special Defense should be swapped
    luaunit.assertEquals(modified.stats.defense, 100) -- Was special_defense
    luaunit.assertEquals(modified.stats.special_defense, 80) -- Was defense
    luaunit.assertEquals(modified.stats.def, 100) -- Compatibility field
    luaunit.assertEquals(modified.stats.spdef, 80) -- Compatibility field
    luaunit.assertTrue(modified.wonder_room_active)
end

-- Test Magic Room item suppression
function TestFieldConditions:test_magicRoomItemSuppression()
    local pokemonList = {self.testPokemon}
    local fieldConditions = {
        magic_room = 3
    }
    
    local modifiedPokemon = FieldConditions.processMagicRoomItems(
        self.testBattleId,
        pokemonList,
        fieldConditions
    )
    
    luaunit.assertEquals(#modifiedPokemon, 1)
    local modified = modifiedPokemon[1]
    
    luaunit.assertTrue(modified.held_item_suppressed)
    luaunit.assertEquals(modified.original_held_item, "choice_scarf")
    luaunit.assertTrue(modified.magic_room_active)
end

-- Test field condition duration updates
function TestFieldConditions:test_fieldConditionDurationUpdate()
    -- Test normal duration countdown
    local newDuration, shouldExpire = FieldConditions.updateFieldConditionDuration(
        FieldConditions.FieldEffectType.TRICK_ROOM,
        3
    )
    luaunit.assertEquals(newDuration, 2)
    luaunit.assertFalse(shouldExpire)
    
    -- Test expiration
    local newDuration2, shouldExpire2 = FieldConditions.updateFieldConditionDuration(
        FieldConditions.FieldEffectType.TRICK_ROOM,
        1
    )
    luaunit.assertEquals(newDuration2, 0)
    luaunit.assertTrue(shouldExpire2)
    
    -- Test permanent condition
    local newDuration3, shouldExpire3 = FieldConditions.updateFieldConditionDuration(
        FieldConditions.FieldEffectType.TRICK_ROOM,
        -1
    )
    luaunit.assertEquals(newDuration3, -1)
    luaunit.assertFalse(shouldExpire3)
end

-- Test field condition coexistence
function TestFieldConditions:test_fieldConditionCoexistence()
    local currentConditions = {
        [FieldConditions.FieldEffectType.TRICK_ROOM] = {
            field_effect_type = FieldConditions.FieldEffectType.TRICK_ROOM,
            duration = 3,
            source = "move"
        }
    }
    
    local newCondition = {
        field_effect_type = FieldConditions.FieldEffectType.WONDER_ROOM,
        duration = 5,
        source = "move"
    }
    
    local updatedConditions, interactions = FieldConditions.processFieldConditionInteractions(
        currentConditions,
        newCondition
    )
    
    -- Trick Room and Wonder Room should coexist
    luaunit.assertNotNil(updatedConditions[FieldConditions.FieldEffectType.TRICK_ROOM])
    luaunit.assertNotNil(updatedConditions[FieldConditions.FieldEffectType.WONDER_ROOM])
    luaunit.assertEquals(#interactions.coexistence, 1)
end

-- Test field condition replacement (same type)
function TestFieldConditions:test_fieldConditionReplacement()
    local currentConditions = {
        [FieldConditions.FieldEffectType.TRICK_ROOM] = {
            field_effect_type = FieldConditions.FieldEffectType.TRICK_ROOM,
            duration = 2,
            source = "move"
        }
    }
    
    local newCondition = {
        field_effect_type = FieldConditions.FieldEffectType.TRICK_ROOM,
        duration = 5,
        source = "move"
    }
    
    local updatedConditions, interactions = FieldConditions.processFieldConditionInteractions(
        currentConditions,
        newCondition
    )
    
    -- New Trick Room should replace old one
    luaunit.assertNotNil(updatedConditions[FieldConditions.FieldEffectType.TRICK_ROOM])
    luaunit.assertEquals(updatedConditions[FieldConditions.FieldEffectType.TRICK_ROOM].duration, 5)
    luaunit.assertEquals(#interactions.replacement, 1)
end

-- Test held item suppression check
function TestFieldConditions:test_heldItemSuppressionCheck()
    local fieldConditions = {
        [FieldConditions.FieldEffectType.MAGIC_ROOM] = {duration = 3}
    }
    
    local isSuppressed = FieldConditions.isHeldItemSuppressed(self.testPokemon, fieldConditions)
    luaunit.assertTrue(isSuppressed)
    
    -- Test without Magic Room
    local noFieldConditions = {}
    local isNotSuppressed = FieldConditions.isHeldItemSuppressed(self.testPokemon, noFieldConditions)
    luaunit.assertFalse(isNotSuppressed)
end

-- Test field condition stat modifications
function TestFieldConditions:test_fieldConditionStatModifications()
    local fieldConditions = {
        [FieldConditions.FieldEffectType.WONDER_ROOM] = {duration = 3}
    }
    
    local modifiedPokemon = FieldConditions.applyFieldConditionStatModifications(
        self.testPokemon,
        fieldConditions,
        "damage"
    )
    
    -- Stats should be swapped
    luaunit.assertEquals(modifiedPokemon.stats.defense, 100) -- Was special_defense
    luaunit.assertEquals(modifiedPokemon.stats.special_defense, 80) -- Was defense
end

-- Test field condition removal
function TestFieldConditions:test_fieldConditionRemoval()
    local fieldConditions = {
        [FieldConditions.FieldEffectType.TRICK_ROOM] = {duration = 3},
        [FieldConditions.FieldEffectType.WONDER_ROOM] = {duration = 2}
    }
    
    -- Remove specific condition
    local updatedConditions, results = FieldConditions.removeFieldConditions(
        fieldConditions,
        FieldConditions.FieldEffectType.TRICK_ROOM,
        "move"
    )
    
    luaunit.assertNil(updatedConditions[FieldConditions.FieldEffectType.TRICK_ROOM])
    luaunit.assertNotNil(updatedConditions[FieldConditions.FieldEffectType.WONDER_ROOM])
    luaunit.assertEquals(#results.removed, 1)
    luaunit.assertEquals(results.removed[1].type, FieldConditions.FieldEffectType.TRICK_ROOM)
end

-- Test active field condition summary
function TestFieldConditions:test_activeFieldConditionSummary()
    local fieldConditions = {
        [FieldConditions.FieldEffectType.TRICK_ROOM] = {
            duration = 3,
            field_effect_name = "Trick Room",
            source = "move",
            priority_reversal = true
        },
        [FieldConditions.FieldEffectType.MAGIC_ROOM] = {
            duration = 1,
            field_effect_name = "Magic Room",
            source = "move",
            suppresses_items = true
        }
    }
    
    local summary = FieldConditions.getActiveFieldConditionSummary(fieldConditions)
    
    luaunit.assertEquals(summary.active_count, 2)
    luaunit.assertEquals(#summary.conditions, 2)
    luaunit.assertTrue(summary.global_effects.priority_reversal)
    luaunit.assertTrue(summary.global_effects.item_suppression)
    luaunit.assertFalse(summary.global_effects.stat_swapping)
end

-- Test field condition notifications
function TestFieldConditions:test_fieldConditionNotifications()
    local fieldConditionChanges = {
        {
            type = "activation",
            field_effect_type = FieldConditions.FieldEffectType.TRICK_ROOM,
            field_effect_name = "Trick Room"
        },
        {
            type = "expiration",
            field_effect_type = FieldConditions.FieldEffectType.WONDER_ROOM,
            field_effect_name = "Wonder Room"
        }
    }
    
    local notifications = FieldConditions.generateFieldConditionNotifications(
        fieldConditionChanges,
        "end_turn"
    )
    
    luaunit.assertEquals(notifications.timing, "end_turn")
    luaunit.assertEquals(notifications.condition_count, 2)
    luaunit.assertEquals(#notifications.messages, 2)
    luaunit.assertStrContains(notifications.messages[1].text, "Trick Room was activated")
    luaunit.assertStrContains(notifications.messages[2].text, "Wonder Room wore off")
end

-- Test field condition move blocking
function TestFieldConditions:test_fieldConditionMoveBlocking()
    local fieldConditions = {
        gravity = 3
    }
    
    -- Gravity should block Fly
    local blocked, reason = FieldConditions.doesFieldConditionBlockMove(
        19, -- Fly move ID
        "fly",
        fieldConditions,
        self.testPokemon
    )
    
    luaunit.assertTrue(blocked)
    luaunit.assertStrContains(reason, "Gravity")
    
    -- Normal moves should not be blocked
    local notBlocked, noReason = FieldConditions.doesFieldConditionBlockMove(
        85, -- Thunderbolt move ID
        "thunderbolt",
        fieldConditions,
        self.testPokemon
    )
    
    luaunit.assertFalse(notBlocked)
    luaunit.assertNil(noReason)
end

-- Test field condition ability interactions
function TestFieldConditions:test_fieldConditionAbilityInteractions()
    local pokemon = {
        id = "test_pokemon",
        ability = "levitate"
    }
    
    local fieldConditions = {
        [FieldConditions.FieldEffectType.GRAVITY] = {duration = 3}
    }
    
    local interactions = FieldConditions.checkAbilityFieldConditionInteractions(
        pokemon,
        fieldConditions,
        "levitate"
    )
    
    -- Should return interaction structure (even if empty for now)
    luaunit.assertNotNil(interactions)
    luaunit.assertNotNil(interactions.blocked_conditions)
    luaunit.assertNotNil(interactions.enhanced_conditions)
    luaunit.assertNotNil(interactions.ability_effects)
end

-- Test comprehensive field condition coexistence scenarios
function TestFieldConditions:test_comprehensiveFieldConditionCoexistence()
    local currentConditions = {}
    
    -- Add multiple field conditions
    local trickRoomCondition = {
        field_effect_type = FieldConditions.FieldEffectType.TRICK_ROOM,
        duration = 4
    }
    
    local wonderRoomCondition = {
        field_effect_type = FieldConditions.FieldEffectType.WONDER_ROOM,
        duration = 3
    }
    
    local magicRoomCondition = {
        field_effect_type = FieldConditions.FieldEffectType.MAGIC_ROOM,
        duration = 2
    }
    
    -- Test adding each condition
    local conditions1, interactions1 = FieldConditions.processFieldConditionInteractions(
        currentConditions, trickRoomCondition
    )
    
    local conditions2, interactions2 = FieldConditions.processFieldConditionInteractions(
        conditions1, wonderRoomCondition
    )
    
    local conditions3, interactions3 = FieldConditions.processFieldConditionInteractions(
        conditions2, magicRoomCondition
    )
    
    -- All three should coexist
    luaunit.assertNotNil(conditions3[FieldConditions.FieldEffectType.TRICK_ROOM])
    luaunit.assertNotNil(conditions3[FieldConditions.FieldEffectType.WONDER_ROOM])
    luaunit.assertNotNil(conditions3[FieldConditions.FieldEffectType.MAGIC_ROOM])
end

-- Test field condition parameter validation
function TestFieldConditions:test_fieldConditionParameterValidation()
    -- Test missing parameters
    local success1, result1 = FieldConditions.setFieldEffect(nil, FieldConditions.FieldEffectType.TRICK_ROOM)
    luaunit.assertFalse(success1)
    luaunit.assertStrContains(result1, "Invalid parameters")
    
    local success2, result2 = FieldConditions.setFieldEffect(self.testBattleId, nil)
    luaunit.assertFalse(success2)
    luaunit.assertStrContains(result2, "Invalid parameters")
end

-- Test field condition effect processing with no conditions
function TestFieldConditions:test_noFieldConditionsProcessing()
    local pokemonList = {self.testPokemon}
    
    -- Test with no field conditions
    local modifiedActions = FieldConditions.processTrickRoomPriority(
        self.testBattleId,
        {},
        nil
    )
    luaunit.assertEquals(#modifiedActions, 0)
    
    local modifiedStats = FieldConditions.processWonderRoomStats(
        self.testBattleId,
        pokemonList,
        nil
    )
    luaunit.assertEquals(#modifiedStats, 1)
    -- Stats should remain unchanged
    luaunit.assertEquals(modifiedStats[1].stats.defense, 80)
    luaunit.assertEquals(modifiedStats[1].stats.special_defense, 100)
end

-- Test field condition notifications generation
function TestFieldConditions:test_fieldConditionNotificationGeneration()
    -- Test empty notifications
    local emptyNotifications = FieldConditions.generateFieldConditionNotifications({}, "start_turn")
    luaunit.assertEquals(emptyNotifications.condition_count, 0)
    luaunit.assertEquals(#emptyNotifications.messages, 0)
    
    -- Test nil input
    local nilNotifications = FieldConditions.generateFieldConditionNotifications(nil, "start_turn")
    luaunit.assertEquals(nilNotifications.condition_count, 0)
    luaunit.assertEquals(#nilNotifications.messages, 0)
end

-- Test edge case: field condition on Pokemon without stats
function TestFieldConditions:test_fieldConditionNoStats()
    local pokemonWithoutStats = {
        id = "no_stats_pokemon",
        name = "No Stats Pokemon"
        -- No stats field
    }
    
    local fieldConditions = {
        [FieldConditions.FieldEffectType.WONDER_ROOM] = {duration = 3}
    }
    
    local modifiedPokemon = FieldConditions.applyFieldConditionStatModifications(
        pokemonWithoutStats,
        fieldConditions,
        "damage"
    )
    
    -- Should handle gracefully without errors
    luaunit.assertNotNil(modifiedPokemon)
    luaunit.assertEquals(modifiedPokemon.id, "no_stats_pokemon")
end

-- Test field condition effects with empty/nil inputs
function TestFieldConditions:test_fieldConditionNilInputs()
    -- Test nil Pokemon
    local result1 = FieldConditions.applyFieldConditionStatModifications(nil, {}, "damage")
    luaunit.assertNil(result1)
    
    -- Test nil field conditions
    local result2 = FieldConditions.applyFieldConditionStatModifications(self.testPokemon, nil, "damage")
    luaunit.assertEquals(result2, self.testPokemon)
    
    -- Test item suppression with nil inputs
    local suppressed1 = FieldConditions.isHeldItemSuppressed(nil, {})
    luaunit.assertFalse(suppressed1)
    
    local suppressed2 = FieldConditions.isHeldItemSuppressed(self.testPokemon, nil)
    luaunit.assertFalse(suppressed2)
end

-- Test multiple field condition interactions
function TestFieldConditions:test_multipleFieldConditionInteractions()
    local multiConditions = {
        [FieldConditions.FieldEffectType.TRICK_ROOM] = {duration = 3, priority_reversal = true},
        [FieldConditions.FieldEffectType.WONDER_ROOM] = {duration = 2, stat_swap = true},
        [FieldConditions.FieldEffectType.MAGIC_ROOM] = {duration = 4, suppresses_items = true}
    }
    
    local summary = FieldConditions.getActiveFieldConditionSummary(multiConditions)
    
    luaunit.assertEquals(summary.active_count, 3)
    luaunit.assertTrue(summary.global_effects.priority_reversal)
    luaunit.assertTrue(summary.global_effects.stat_swapping)
    luaunit.assertTrue(summary.global_effects.item_suppression)
end

-- Run the test suite
function TestFieldConditions:run()
    print("Running Field Conditions Unit Tests...")
    luaunit.LuaUnit.run()
end

return TestFieldConditions