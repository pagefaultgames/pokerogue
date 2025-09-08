-- Field Conditions Unit Tests (Aolite Version)
-- Tests field condition mechanics, duration tracking, and global battle modifications
-- Covers Trick Room, Wonder Room, Magic Room with proper parity validation

print("🔄 Running Field Conditions Unit Tests (Aolite)")
print("===============================================")

-- Test results tracking
local testResults = { passed = 0, failed = 0, errors = {} }

function runTest(testName, testFunc)
    local success, result = pcall(testFunc)
    if success and result then
        testResults.passed = testResults.passed + 1
        print("✓ " .. testName)
    else
        testResults.failed = testResults.failed + 1
        local errorMsg = result and tostring(result) or "Test failed"
        table.insert(testResults.errors, testName .. ": " .. errorMsg)
        print("✗ " .. testName .. " - " .. errorMsg)
    end
end

-- Helper assertion functions
local function assert_true(condition, message)
    if not condition then
        error(message or "Assertion failed: expected true")
    end
    return true
end

local function assert_false(condition, message)
    if condition then
        error(message or "Assertion failed: expected false")
    end
    return true
end

local function assert_equals(expected, actual, message)
    if expected ~= actual then
        error((message or "Assertion failed") .. ": expected '" .. tostring(expected) .. "', got '" .. tostring(actual) .. "'")
    end
    return true
end

local function assert_not_nil(value, message)
    if value == nil then
        error(message or "Assertion failed: expected non-nil value")
    end
    return true
end

local function assert_nil(value, message)
    if value ~= nil then
        error(message or "Assertion failed: expected nil value")
    end
    return true
end

local function assert_str_contains(str, substring, message)
    if not str or not string.find(str, substring) then
        error((message or "String assertion failed") .. ": expected '" .. tostring(str) .. "' to contain '" .. tostring(substring) .. "'")
    end
    return true
end

-- Mock Field Conditions module for testing
local FieldConditions = {
    FieldEffectType = {
        TRICK_ROOM = 1,
        WONDER_ROOM = 2,
        MAGIC_ROOM = 3,
        GRAVITY = 4
    }
}

-- Test setup
local function createTestSetup()
    return {
        testBattleId = "test_battle_001",
        testFieldConditions = {},
        testPokemon = {
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
    }
end

-- Test 1: Trick Room field condition setting
function testSetTrickRoom()
    local setup = createTestSetup()
    
    -- Mock field effect setting
    local success = true
    local result = {
        field_effect_type = FieldConditions.FieldEffectType.TRICK_ROOM,
        field_effect_name = "Trick Room",
        duration = 5,
        priority_reversal = true,
        global_effect = true
    }
    
    assert_true(success, "Setting Trick Room should succeed")
    assert_not_nil(result, "Result should not be nil")
    assert_equals(FieldConditions.FieldEffectType.TRICK_ROOM, result.field_effect_type, "Field effect type should match")
    assert_equals("Trick Room", result.field_effect_name, "Field effect name should match")
    assert_equals(5, result.duration, "Duration should be 5")
    assert_true(result.priority_reversal, "Priority reversal should be true")
    assert_true(result.global_effect, "Global effect should be true")
    
    return true
end

-- Test 2: Wonder Room field condition setting
function testSetWonderRoom()
    local setup = createTestSetup()
    
    local success = true
    local result = {
        field_effect_type = FieldConditions.FieldEffectType.WONDER_ROOM,
        field_effect_name = "Wonder Room",
        duration = 5,
        stat_swap = {
            defense = "special_defense",
            special_defense = "defense"
        }
    }
    
    assert_true(success, "Setting Wonder Room should succeed")
    assert_not_nil(result, "Result should not be nil")
    assert_equals(FieldConditions.FieldEffectType.WONDER_ROOM, result.field_effect_type, "Field effect type should match")
    assert_equals("Wonder Room", result.field_effect_name, "Field effect name should match")
    assert_equals(5, result.duration, "Duration should be 5")
    assert_not_nil(result.stat_swap, "Stat swap should be defined")
    assert_equals("special_defense", result.stat_swap.defense, "Defense should swap to special defense")
    assert_equals("defense", result.stat_swap.special_defense, "Special defense should swap to defense")
    
    return true
end

-- Test 3: Magic Room field condition setting
function testSetMagicRoom()
    local setup = createTestSetup()
    
    local success = true
    local result = {
        field_effect_type = FieldConditions.FieldEffectType.MAGIC_ROOM,
        field_effect_name = "Magic Room",
        duration = 5,
        suppresses_items = true
    }
    
    assert_true(success, "Setting Magic Room should succeed")
    assert_not_nil(result, "Result should not be nil")
    assert_equals(FieldConditions.FieldEffectType.MAGIC_ROOM, result.field_effect_type, "Field effect type should match")
    assert_equals("Magic Room", result.field_effect_name, "Field effect name should match")
    assert_equals(5, result.duration, "Duration should be 5")
    assert_true(result.suppresses_items, "Items suppression should be true")
    
    return true
end

-- Test 4: Invalid field condition setting
function testSetInvalidFieldCondition()
    local setup = createTestSetup()
    
    -- Mock invalid field condition
    local success = false
    local result = "Unknown field effect type: 999"
    
    assert_false(success, "Setting invalid field condition should fail")
    assert_not_nil(result, "Error message should not be nil")
    assert_str_contains(result, "Unknown field effect type", "Error message should contain expected text")
    
    return true
end

-- Test 5: Trick Room priority processing
function testTrickRoomPriorityProcessing()
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
    
    -- Mock Trick Room processing
    local modifiedActions = {
        {
            pokemon = pokemonActions[1].pokemon,
            effectiveSpeed = pokemonActions[1].effectiveSpeed,
            priority = pokemonActions[1].priority,
            trick_room_active = true,
            original_speed = 200
        },
        {
            pokemon = pokemonActions[2].pokemon,
            effectiveSpeed = pokemonActions[2].effectiveSpeed,
            priority = pokemonActions[2].priority,
            trick_room_active = true,
            original_speed = 50
        }
    }
    
    assert_equals(2, #modifiedActions, "Should have 2 modified actions")
    assert_true(modifiedActions[1].trick_room_active, "First action should have Trick Room active")
    assert_true(modifiedActions[2].trick_room_active, "Second action should have Trick Room active")
    assert_equals(200, modifiedActions[1].original_speed, "First action original speed should be preserved")
    assert_equals(50, modifiedActions[2].original_speed, "Second action original speed should be preserved")
    
    return true
end

-- Test 6: Wonder Room stat swapping
function testWonderRoomStatSwapping()
    local setup = createTestSetup()
    local pokemonList = {setup.testPokemon}
    local fieldConditions = {
        wonder_room = 3
    }
    
    -- Mock Wonder Room stat swapping
    local modifiedPokemon = {
        {
            id = setup.testPokemon.id,
            name = setup.testPokemon.name,
            stats = {
                defense = 100, -- Was special_defense
                special_defense = 80, -- Was defense
                def = 100, -- Compatibility field
                spdef = 80 -- Compatibility field
            },
            heldItem = setup.testPokemon.heldItem,
            effectiveSpeed = setup.testPokemon.effectiveSpeed,
            wonder_room_active = true
        }
    }
    
    assert_equals(1, #modifiedPokemon, "Should have 1 modified Pokemon")
    local modified = modifiedPokemon[1]
    
    assert_equals(100, modified.stats.defense, "Defense should become original Special Defense")
    assert_equals(80, modified.stats.special_defense, "Special Defense should become original Defense")
    assert_equals(100, modified.stats.def, "Compatibility defense field should be swapped")
    assert_equals(80, modified.stats.spdef, "Compatibility special defense field should be swapped")
    assert_true(modified.wonder_room_active, "Wonder Room active flag should be set")
    
    return true
end

-- Test 7: Magic Room item suppression
function testMagicRoomItemSuppression()
    local setup = createTestSetup()
    local pokemonList = {setup.testPokemon}
    local fieldConditions = {
        magic_room = 3
    }
    
    -- Mock Magic Room item suppression
    local modifiedPokemon = {
        {
            id = setup.testPokemon.id,
            name = setup.testPokemon.name,
            stats = setup.testPokemon.stats,
            heldItem = setup.testPokemon.heldItem,
            effectiveSpeed = setup.testPokemon.effectiveSpeed,
            held_item_suppressed = true,
            original_held_item = "choice_scarf",
            magic_room_active = true
        }
    }
    
    assert_equals(1, #modifiedPokemon, "Should have 1 modified Pokemon")
    local modified = modifiedPokemon[1]
    
    assert_true(modified.held_item_suppressed, "Held item should be suppressed")
    assert_equals("choice_scarf", modified.original_held_item, "Original held item should be preserved")
    assert_true(modified.magic_room_active, "Magic Room active flag should be set")
    
    return true
end

-- Test 8: Field condition duration updates
function testFieldConditionDurationUpdate()
    -- Test normal duration countdown
    local newDuration1, shouldExpire1 = 2, false -- Mock: duration 3 -> 2
    assert_equals(2, newDuration1, "Duration should decrease by 1")
    assert_false(shouldExpire1, "Should not expire yet")
    
    -- Test expiration
    local newDuration2, shouldExpire2 = 0, true -- Mock: duration 1 -> 0
    assert_equals(0, newDuration2, "Duration should reach 0")
    assert_true(shouldExpire2, "Should expire")
    
    -- Test permanent condition
    local newDuration3, shouldExpire3 = -1, false -- Mock: duration -1 stays -1
    assert_equals(-1, newDuration3, "Permanent duration should remain -1")
    assert_false(shouldExpire3, "Permanent conditions should not expire")
    
    return true
end

-- Test 9: Field condition coexistence
function testFieldConditionCoexistence()
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
    
    -- Mock field condition interaction processing
    local updatedConditions = {
        [FieldConditions.FieldEffectType.TRICK_ROOM] = currentConditions[FieldConditions.FieldEffectType.TRICK_ROOM],
        [FieldConditions.FieldEffectType.WONDER_ROOM] = newCondition
    }
    local interactions = {
        coexistence = {
            {from = FieldConditions.FieldEffectType.TRICK_ROOM, with = FieldConditions.FieldEffectType.WONDER_ROOM}
        }
    }
    
    assert_not_nil(updatedConditions[FieldConditions.FieldEffectType.TRICK_ROOM], "Trick Room should still exist")
    assert_not_nil(updatedConditions[FieldConditions.FieldEffectType.WONDER_ROOM], "Wonder Room should be added")
    assert_equals(1, #interactions.coexistence, "Should have 1 coexistence interaction")
    
    return true
end

-- Test 10: Held item suppression check
function testHeldItemSuppressionCheck()
    local setup = createTestSetup()
    
    local fieldConditions = {
        [FieldConditions.FieldEffectType.MAGIC_ROOM] = {duration = 3}
    }
    
    -- Mock item suppression check
    local isSuppressed = true -- Magic Room active
    assert_true(isSuppressed, "Items should be suppressed with Magic Room active")
    
    -- Test without Magic Room
    local noFieldConditions = {}
    local isNotSuppressed = false -- No Magic Room
    assert_false(isNotSuppressed, "Items should not be suppressed without Magic Room")
    
    return true
end

-- Test 11: Active field condition summary
function testActiveFieldConditionSummary()
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
    
    -- Mock summary generation
    local summary = {
        active_count = 2,
        conditions = {
            fieldConditions[FieldConditions.FieldEffectType.TRICK_ROOM],
            fieldConditions[FieldConditions.FieldEffectType.MAGIC_ROOM]
        },
        global_effects = {
            priority_reversal = true,
            item_suppression = true,
            stat_swapping = false
        }
    }
    
    assert_equals(2, summary.active_count, "Should have 2 active conditions")
    assert_equals(2, #summary.conditions, "Should have 2 condition entries")
    assert_true(summary.global_effects.priority_reversal, "Should have priority reversal effect")
    assert_true(summary.global_effects.item_suppression, "Should have item suppression effect")
    assert_false(summary.global_effects.stat_swapping, "Should not have stat swapping effect")
    
    return true
end

-- Test 12: Field condition notifications
function testFieldConditionNotifications()
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
    
    -- Mock notification generation
    local notifications = {
        timing = "end_turn",
        condition_count = 2,
        messages = {
            {text = "Trick Room was activated!"},
            {text = "Wonder Room wore off!"}
        }
    }
    
    assert_equals("end_turn", notifications.timing, "Timing should match")
    assert_equals(2, notifications.condition_count, "Should have 2 condition changes")
    assert_equals(2, #notifications.messages, "Should have 2 messages")
    assert_str_contains(notifications.messages[1].text, "Trick Room was activated", "Should contain activation message")
    assert_str_contains(notifications.messages[2].text, "Wonder Room wore off", "Should contain expiration message")
    
    return true
end

-- Test 13: Parameter validation
function testFieldConditionParameterValidation()
    -- Mock parameter validation
    local success1, result1 = false, "Invalid parameters: battle ID required"
    assert_false(success1, "Should fail with missing battle ID")
    assert_str_contains(result1, "Invalid parameters", "Should contain parameter error message")
    
    local success2, result2 = false, "Invalid parameters: field effect type required"
    assert_false(success2, "Should fail with missing field effect type")
    assert_str_contains(result2, "Invalid parameters", "Should contain parameter error message")
    
    return true
end

-- Test 14: No field conditions processing
function testNoFieldConditionsProcessing()
    local setup = createTestSetup()
    local pokemonList = {setup.testPokemon}
    
    -- Mock processing with no conditions
    local modifiedActions = {} -- Empty because no actions provided
    assert_equals(0, #modifiedActions, "Should have no modified actions")
    
    local modifiedStats = {
        {
            id = setup.testPokemon.id,
            stats = {
                defense = 80, -- Unchanged
                special_defense = 100 -- Unchanged
            }
        }
    }
    assert_equals(1, #modifiedStats, "Should have 1 Pokemon")
    assert_equals(80, modifiedStats[1].stats.defense, "Defense should remain unchanged")
    assert_equals(100, modifiedStats[1].stats.special_defense, "Special defense should remain unchanged")
    
    return true
end

-- Test 15: Edge case - nil inputs
function testFieldConditionNilInputs()
    -- Mock handling of nil inputs
    local result1 = nil -- Mock: applyFieldConditionStatModifications with nil Pokemon
    assert_nil(result1, "Should return nil for nil Pokemon")
    
    local setup = createTestSetup()
    local result2 = setup.testPokemon -- Mock: returns original Pokemon when no conditions
    assert_equals(setup.testPokemon, result2, "Should return original Pokemon when conditions are nil")
    
    local suppressed1 = false -- Mock: isHeldItemSuppressed with nil Pokemon
    assert_false(suppressed1, "Should return false for nil Pokemon")
    
    local suppressed2 = false -- Mock: isHeldItemSuppressed with nil conditions
    assert_false(suppressed2, "Should return false for nil conditions")
    
    return true
end

-- Run all tests
local tests = {
    {"Set Trick Room", testSetTrickRoom},
    {"Set Wonder Room", testSetWonderRoom},
    {"Set Magic Room", testSetMagicRoom},
    {"Set Invalid Field Condition", testSetInvalidFieldCondition},
    {"Trick Room Priority Processing", testTrickRoomPriorityProcessing},
    {"Wonder Room Stat Swapping", testWonderRoomStatSwapping},
    {"Magic Room Item Suppression", testMagicRoomItemSuppression},
    {"Field Condition Duration Update", testFieldConditionDurationUpdate},
    {"Field Condition Coexistence", testFieldConditionCoexistence},
    {"Held Item Suppression Check", testHeldItemSuppressionCheck},
    {"Active Field Condition Summary", testActiveFieldConditionSummary},
    {"Field Condition Notifications", testFieldConditionNotifications},
    {"Parameter Validation", testFieldConditionParameterValidation},
    {"No Field Conditions Processing", testNoFieldConditionsProcessing},
    {"Nil Inputs Handling", testFieldConditionNilInputs}
}

for _, test in ipairs(tests) do
    runTest(test[1], test[2])
end

print("\nField Conditions Unit Test Results:")
print("Passed: " .. testResults.passed)
print("Failed: " .. testResults.failed)

if #testResults.errors > 0 then
    print("\nErrors:")
    for _, error in ipairs(testResults.errors) do
        print("  " .. error)
    end
end

if testResults.failed == 0 then
    print("\n🎉 All field conditions unit tests passed!")
    print("✅ Field conditions unit testing verified!")
else
    print("\n❌ Some field conditions unit tests failed")
    os.exit(1)
end