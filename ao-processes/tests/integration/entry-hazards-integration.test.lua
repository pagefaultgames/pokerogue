-- Entry Hazards Integration Tests  
-- End-to-end testing of entry hazards within complete battle workflows
-- Tests battle message processing, turn resolution, and state persistence

-- Test setup and utilities
local EntryHazards = require("game-logic.battle.entry-hazards")
local SwitchInEffects = require("game-logic.battle.switch-in-effects")
local MoveEffects = require("game-logic.battle.move-effects")

-- Mock test environment
local mockBattleState = nil

-- Test utilities
local function createCompleteBattleState()
    return {
        battleId = "integration-test",
        turn = 1,
        phase = 1,
        turnOrder = {},
        currentAction = nil,
        pendingActions = {},
        interruptQueue = {},
        battleSeed = "test-seed-123",
        playerParty = {},
        enemyParty = {},
        battleConditions = {
            entryHazards = {
                player = {},
                enemy = {}
            },
            weather = {
                type = 0,
                duration = 0
            },
            terrain = {
                type = 0, 
                duration = 0
            }
        },
        battleEvents = {},
        activePokemon = {
            player = nil,
            enemy = nil
        }
    }
end

local function createBattlePokemon(name, species, level, types, ability, moves)
    return {
        id = name:lower() .. "-" .. math.random(1000, 9999),
        name = name,
        species = {
            id = species,
            type1 = types[1],
            type2 = types[2]
        },
        level = level or 50,
        ability = ability,
        moves = moves or {},
        stats = {
            hp = 150,
            attack = 100,
            defense = 100, 
            spAttack = 100,
            spDefense = 100,
            speed = 100
        },
        maxHP = 150,
        currentHP = 150,
        battleData = {
            side = "player",
            statStages = {
                atk = 0, def = 0, spa = 0, spd = 0, spe = 0, acc = 0, eva = 0
            }
        },
        status = nil,
        statusTurns = nil,
        fainted = false
    }
end

-- Mock Enums for integration
local TestEnums = {
    PokemonType = {
        NORMAL = 0, FIGHTING = 1, FLYING = 2, POISON = 3, GROUND = 4,
        ROCK = 5, BUG = 6, GHOST = 7, STEEL = 8, FIRE = 9,
        WATER = 10, GRASS = 11, ELECTRIC = 12, PSYCHIC = 13, ICE = 14,
        DRAGON = 15, DARK = 16, FAIRY = 17
    },
    AbilityId = {
        LEVITATE = 26,
        MAGIC_GUARD = 98
    },
    MoveId = {
        STEALTH_ROCK = 277,
        SPIKES = 191,
        TOXIC_SPIKES = 390,
        RAPID_SPIN = 229,
        DEFOG = 432
    },
    MoveCategory = {
        PHYSICAL = 0,
        SPECIAL = 1,
        STATUS = 2
    },
    MoveTarget = {
        SELECTED = 0,
        USER = 8,
        ALL_OPPONENTS = 10
    }
}

-- Test runner utilities
local tests = {}
local testCount = 0
local passCount = 0

local function assert(condition, message)
    if not condition then
        error("Integration test assertion failed: " .. (message or "no message"))
    end
end

local function assertEquals(expected, actual, message)
    if expected ~= actual then
        error(string.format("Integration test assertion failed: expected %s, got %s. %s", 
              tostring(expected), tostring(actual), message or ""))
    end
end

local function runIntegrationTest(testName, testFunc)
    testCount = testCount + 1
    print("Running integration test: " .. testName)
    
    -- Set up fresh battle state for each test
    mockBattleState = createCompleteBattleState()
    
    local success, error = pcall(testFunc)
    if success then
        passCount = passCount + 1
        print("✅ " .. testName .. " PASSED")
    else
        print("❌ " .. testName .. " FAILED: " .. error)
    end
    print("")
end

-- Integration Tests

-- Test 1: Complete Stealth Rock Battle Workflow
function tests.testStealthRockBattleWorkflow()
    -- Mock Enums for this test
    package.loaded["data.constants.enums"] = TestEnums
    
    -- Create test Pokemon
    local forretress = createBattlePokemon("Forretress", 205, 50, {TestEnums.PokemonType.BUG, TestEnums.PokemonType.STEEL}, nil)
    local charizard = createBattlePokemon("Charizard", 6, 50, {TestEnums.PokemonType.FIRE, TestEnums.PokemonType.FLYING}, nil)
    charizard.battleData.side = "enemy"
    
    -- Step 1: Forretress uses Stealth Rock
    local stealthRockMove = {
        id = TestEnums.MoveId.STEALTH_ROCK,
        name = "Stealth Rock",
        type = TestEnums.PokemonType.ROCK,
        category = TestEnums.MoveCategory.STATUS,
        power = 0,
        accuracy = -1,
        pp = 20,
        target = TestEnums.MoveTarget.ALL_OPPONENTS,
        priority = 0,
        effects = {stealth_rock = true}
    }
    
    local moveResult = MoveEffects.executeMove(mockBattleState, forretress, stealthRockMove)
    assert(moveResult.success, "Stealth Rock move should execute successfully")
    assert(mockBattleState.battleConditions.entryHazards.enemy.stealthRock, "Stealth Rock should be set on enemy side")
    
    -- Step 2: Charizard switches in and takes Stealth Rock damage
    local switchResult = SwitchInEffects.processAllSwitchInEffects(mockBattleState, charizard, "enemy")
    assert(switchResult.success, "Switch-in effects should process successfully")
    assert(switchResult.damageTaken > 0, "Charizard should take Stealth Rock damage")
    
    -- Verify damage calculation (should be 4x effective against Fire/Flying)
    local expectedDamage = math.floor(charizard.maxHP * 0.125 * 2.0) -- 1/8 * 2x effectiveness
    local actualDamage = charizard.maxHP - charizard.currentHP
    assert(actualDamage > 0, "Charizard should have taken damage")
    
    -- Verify battle events were recorded
    assert(#mockBattleState.battleEvents > 0, "Battle events should be recorded")
    
    -- Find hazard setting and switch-in events
    local hazardEvent = nil
    local switchEvent = nil
    for _, event in ipairs(mockBattleState.battleEvents) do
        if event.type == "hazard_set" then
            hazardEvent = event
        elseif event.type == "switch_in_effects" then
            switchEvent = event
        end
    end
    
    assert(hazardEvent, "Hazard setting event should be recorded")
    assert(switchEvent, "Switch-in effects event should be recorded")
    assertEquals("STEALTH_ROCK", hazardEvent.hazardType, "Should record correct hazard type")
end

-- Test 2: Multi-Layer Spikes Integration
function tests.testMultiLayerSpikesIntegration()
    package.loaded["data.constants.enums"] = TestEnums
    
    -- Create test Pokemon
    local skarmory = createBattlePokemon("Skarmory", 227, 50, {TestEnums.PokemonType.STEEL, TestEnums.PokemonType.FLYING}, nil)
    local groundPokemon = createBattlePokemon("Earthquake", 95, 50, {TestEnums.PokemonType.GROUND}, nil)
    groundPokemon.battleData.side = "enemy"
    
    local spikesMove = {
        id = TestEnums.MoveId.SPIKES,
        name = "Spikes", 
        type = TestEnums.PokemonType.GROUND,
        category = TestEnums.MoveCategory.STATUS,
        power = 0,
        accuracy = -1,
        target = TestEnums.MoveTarget.ALL_OPPONENTS,
        effects = {spikes = true}
    }
    
    -- Set up 3 layers of Spikes
    for layer = 1, 3 do
        local result = MoveEffects.executeMove(mockBattleState, skarmory, spikesMove)
        assert(result.success, "Spikes layer " .. layer .. " should set successfully")
        assertEquals(layer, mockBattleState.battleConditions.entryHazards.enemy.spikes, "Should have " .. layer .. " layers")
    end
    
    -- Test Ground Pokemon switching in (should take 1/4 damage from 3 layers)
    local initialHP = groundPokemon.currentHP
    local switchResult = SwitchInEffects.processAllSwitchInEffects(mockBattleState, groundPokemon, "enemy")
    
    assert(switchResult.success, "Switch-in should succeed")
    assert(switchResult.damageTaken > 0, "Should take Spikes damage")
    
    -- Verify 3-layer damage (1/4 max HP)
    local expectedDamage = math.floor(groundPokemon.maxHP * 0.25)
    local actualDamage = initialHP - groundPokemon.currentHP
    assertEquals(expectedDamage, actualDamage, "Should take correct 3-layer Spikes damage")
    
    -- Test Flying-type immunity
    local flyingPokemon = createBattlePokemon("Flying", 142, 50, {TestEnums.PokemonType.FLYING}, nil)
    flyingPokemon.battleData.side = "enemy"
    flyingPokemon.currentHP = flyingPokemon.maxHP
    
    local flyingSwitchResult = SwitchInEffects.processAllSwitchInEffects(mockBattleState, flyingPokemon, "enemy")
    assertEquals(0, flyingSwitchResult.damageTaken, "Flying-type should be immune to Spikes")
end

-- Test 3: Toxic Spikes with Poison-type Absorption
function tests.testToxicSpikesAbsorptionIntegration()
    package.loaded["data.constants.enums"] = TestEnums
    
    -- Set up 2 layers of Toxic Spikes
    mockBattleState.battleConditions.entryHazards.player.toxicSpikes = 2
    
    -- Test normal Pokemon gets badly poisoned
    local normalPokemon = createBattlePokemon("Normal", 39, 50, {TestEnums.PokemonType.NORMAL}, nil, {})
    normalPokemon.battleData.side = "player"
    
    local normalResult = SwitchInEffects.processAllSwitchInEffects(mockBattleState, normalPokemon, "player")
    assert(normalResult.success, "Normal Pokemon switch should succeed")
    assertEquals("badly_poison", normalPokemon.status, "Should be badly poisoned by 2 layers")
    assertEquals(1, normalPokemon.statusTurns, "Badly poison should start at turn 1")
    
    -- Test Poison-type absorption
    local poisonPokemon = createBattlePokemon("Poison", 89, 50, {TestEnums.PokemonType.POISON}, nil, {})
    poisonPokemon.battleData.side = "player"
    
    local poisonResult = SwitchInEffects.processAllSwitchInEffects(mockBattleState, poisonPokemon, "player")
    assert(poisonResult.success, "Poison Pokemon switch should succeed")
    assertEquals(nil, poisonPokemon.status, "Poison-type should not be poisoned")
    
    -- Verify one layer was removed
    assertEquals(1, mockBattleState.battleConditions.entryHazards.player.toxicSpikes, "One layer should be removed")
    
    -- Test Steel-type immunity to remaining layer
    local steelPokemon = createBattlePokemon("Steel", 81, 50, {TestEnums.PokemonType.STEEL}, nil, {})
    steelPokemon.battleData.side = "player"
    
    local steelResult = SwitchInEffects.processAllSwitchInEffects(mockBattleState, steelPokemon, "player")
    assertEquals(nil, steelPokemon.status, "Steel-type should be immune to Toxic Spikes")
    assertEquals(1, mockBattleState.battleConditions.entryHazards.player.toxicSpikes, "Layer should remain after Steel-type")
end

-- Test 4: Rapid Spin Hazard Removal Integration
function tests.testRapidSpinRemovalIntegration()
    package.loaded["data.constants.enums"] = TestEnums
    
    -- Set up multiple hazards on player side
    mockBattleState.battleConditions.entryHazards.player.stealthRock = true
    mockBattleState.battleConditions.entryHazards.player.spikes = 2
    mockBattleState.battleConditions.entryHazards.player.toxicSpikes = 1
    
    -- Create Rapid Spin user
    local rapidSpinner = createBattlePokemon("Spinner", 120, 50, {TestEnums.PokemonType.NORMAL}, nil, {})
    rapidSpinner.battleData.side = "player"
    
    local rapidSpinMove = {
        id = TestEnums.MoveId.RAPID_SPIN,
        name = "Rapid Spin",
        type = TestEnums.PokemonType.NORMAL,
        category = TestEnums.MoveCategory.PHYSICAL,
        power = 50,
        accuracy = 100,
        target = TestEnums.MoveTarget.SELECTED,
        effects = {
            rapid_spin = true,
            stat_change = {speed = 1, user = true}
        }
    }
    
    -- Use Rapid Spin
    local spinResult = MoveEffects.executeMove(mockBattleState, rapidSpinner, rapidSpinMove)
    assert(spinResult.success, "Rapid Spin should execute successfully")
    
    -- Verify all hazards removed from player side
    assertEquals(false, mockBattleState.battleConditions.entryHazards.player.stealthRock or false, "Stealth Rock should be removed")
    assertEquals(0, mockBattleState.battleConditions.entryHazards.player.spikes or 0, "Spikes should be removed")
    assertEquals(0, mockBattleState.battleConditions.entryHazards.player.toxicSpikes or 0, "Toxic Spikes should be removed")
    
    -- Verify hazard removal was recorded in effects
    local hazardRemovalEffect = nil
    for _, effect in ipairs(spinResult.effects) do
        if effect.type == "hazard_removal" then
            hazardRemovalEffect = effect
            break
        end
    end
    
    assert(hazardRemovalEffect, "Hazard removal should be recorded in effects")
    assertEquals("rapid_spin", hazardRemovalEffect.removalType, "Should record Rapid Spin as removal type")
end

-- Test 5: Defog Clearing Both Sides Integration
function tests.testDefogBothSidesIntegration()
    package.loaded["data.constants.enums"] = TestEnums
    
    -- Set up hazards on both sides
    mockBattleState.battleConditions.entryHazards.player.stealthRock = true
    mockBattleState.battleConditions.entryHazards.player.spikes = 1
    mockBattleState.battleConditions.entryHazards.enemy.stealthRock = true
    mockBattleState.battleConditions.entryHazards.enemy.toxicSpikes = 2
    
    -- Create Defog user
    local defogger = createBattlePokemon("Defogger", 178, 50, {TestEnums.PokemonType.FLYING}, nil, {})
    defogger.battleData.side = "player"
    
    local defogMove = {
        id = TestEnums.MoveId.DEFOG,
        name = "Defog",
        type = TestEnums.PokemonType.FLYING,
        category = TestEnums.MoveCategory.STATUS,
        power = 0,
        accuracy = -1,
        target = TestEnums.MoveTarget.SELECTED,
        effects = {
            defog = true,
            stat_change = {evasion = -1}
        }
    }
    
    -- Use Defog
    local defogResult = MoveEffects.executeMove(mockBattleState, defogger, defogMove)
    assert(defogResult.success, "Defog should execute successfully")
    
    -- Verify hazards cleared from both sides
    assertEquals(false, mockBattleState.battleConditions.entryHazards.player.stealthRock or false, "Player Stealth Rock should be removed")
    assertEquals(0, mockBattleState.battleConditions.entryHazards.player.spikes or 0, "Player Spikes should be removed")
    assertEquals(false, mockBattleState.battleConditions.entryHazards.enemy.stealthRock or false, "Enemy Stealth Rock should be removed")
    assertEquals(0, mockBattleState.battleConditions.entryHazards.enemy.toxicSpikes or 0, "Enemy Toxic Spikes should be removed")
    
    -- Verify Defog effect was recorded
    local defogEffect = nil
    for _, effect in ipairs(defogResult.effects) do
        if effect.type == "hazard_removal" and effect.removalType == "defog" then
            defogEffect = effect
            break
        end
    end
    
    assert(defogEffect, "Defog removal should be recorded")
    assert(#defogEffect.hazardsRemoved > 0, "Should record removed hazards")
end

-- Test 6: Complex Multi-Turn Hazard Battle Scenario
function tests.testComplexHazardBattleScenario()
    package.loaded["data.constants.enums"] = TestEnums
    
    -- Simulate a complex battle scenario with multiple switches and hazards
    
    -- Turn 1: Forretress sets Stealth Rock
    local forretress = createBattlePokemon("Forretress", 205, 50, {TestEnums.PokemonType.BUG, TestEnums.PokemonType.STEEL}, nil)
    local stealthRockMove = {
        id = TestEnums.MoveId.STEALTH_ROCK,
        name = "Stealth Rock",
        effects = {stealth_rock = true}
    }
    
    MoveEffects.executeMove(mockBattleState, forretress, stealthRockMove)
    mockBattleState.turn = mockBattleState.turn + 1
    
    -- Turn 2: Skarmory sets Spikes x3
    local skarmory = createBattlePokemon("Skarmory", 227, 50, {TestEnums.PokemonType.STEEL, TestEnums.PokemonType.FLYING}, nil)
    local spikesMove = {
        id = TestEnums.MoveId.SPIKES,
        name = "Spikes",
        effects = {spikes = true}
    }
    
    for i = 1, 3 do
        MoveEffects.executeMove(mockBattleState, skarmory, spikesMove)
        mockBattleState.turn = mockBattleState.turn + 1
    end
    
    -- Turn 3: Enemy Pokemon switches in and takes full hazard damage
    local groundPokemon = createBattlePokemon("Ground", 95, 50, {TestEnums.PokemonType.GROUND}, nil)
    groundPokemon.battleData.side = "enemy"
    groundPokemon.maxHP = 300
    groundPokemon.currentHP = 300
    
    local switchResult = SwitchInEffects.processAllSwitchInEffects(mockBattleState, groundPokemon, "enemy")
    
    -- Should take both Stealth Rock (1/8) and 3-layer Spikes (1/4) damage
    local expectedStealthRockDamage = math.floor(300 * 0.125) -- 37 damage
    local expectedSpikesDamage = math.floor(300 * 0.25)      -- 75 damage
    local totalExpectedDamage = expectedStealthRockDamage + expectedSpikesDamage -- 112 damage
    
    assert(switchResult.damageTaken >= totalExpectedDamage, "Should take combined hazard damage")
    assertEquals(300 - switchResult.damageTaken, groundPokemon.currentHP, "HP should reflect damage taken")
    
    -- Turn 4: Use Defog to clear all hazards
    local defogMove = {
        id = TestEnums.MoveId.DEFOG,
        name = "Defog",
        effects = {defog = true}
    }
    
    local defogResult = MoveEffects.executeMove(mockBattleState, skarmory, defogMove)
    assert(defogResult.success, "Defog should clear all hazards")
    
    -- Turn 5: New switch should take no hazard damage
    local newPokemon = createBattlePokemon("Clean", 1, 50, {TestEnums.PokemonType.NORMAL}, nil)
    newPokemon.battleData.side = "enemy"
    
    local cleanSwitchResult = SwitchInEffects.processAllSwitchInEffects(mockBattleState, newPokemon, "enemy")
    assertEquals(0, cleanSwitchResult.damageTaken, "Should take no damage after Defog")
    
    -- Verify battle events tell the complete story
    assert(#mockBattleState.battleEvents >= 5, "Should have recorded multiple battle events")
    
    local hazardSets = 0
    local hazardRemovals = 0
    local switchIns = 0
    
    for _, event in ipairs(mockBattleState.battleEvents) do
        if event.type == "hazard_set" then
            hazardSets = hazardSets + 1
        elseif event.type == "hazards_removed" then
            hazardRemovals = hazardRemovals + 1
        elseif event.type == "switch_in_effects" then
            switchIns = switchIns + 1
        end
    end
    
    assert(hazardSets >= 4, "Should record hazard setting events")
    assert(hazardRemovals >= 1, "Should record hazard removal event")
    assert(switchIns >= 2, "Should record switch-in events")
end

-- Test Runner
function runAllIntegrationTests()
    print("=== Entry Hazards Integration Tests ===")
    print("")
    
    -- Initialize test environment
    EntryHazards.init()
    SwitchInEffects.init()
    
    -- Run all integration tests
    for testName, testFunc in pairs(tests) do
        runIntegrationTest(testName, testFunc)
    end
    
    -- Print summary
    print("=== Integration Test Summary ===")
    print("Total tests: " .. testCount)
    print("Passed: " .. passCount)
    print("Failed: " .. (testCount - passCount))
    print("Success rate: " .. string.format("%.1f", (passCount / testCount) * 100) .. "%")
    
    if passCount == testCount then
        print("🎉 All integration tests passed!")
        return true
    else
        print("💥 Some integration tests failed!")
        return false
    end
end

-- Export for external test runners
return {
    runAllIntegrationTests = runAllIntegrationTests,
    tests = tests
}