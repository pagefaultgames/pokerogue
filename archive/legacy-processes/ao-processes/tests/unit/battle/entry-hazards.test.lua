-- Entry Hazards Unit Tests
-- Comprehensive test coverage for entry hazards system mechanics
-- Tests hazard setting, damage calculations, immunity checks, and removal

-- Test setup and utilities
local EntryHazards = require("game-logic.battle.entry-hazards")

-- Mock dependencies for isolated testing
local mockBattleRNG = {
    randomInt = function(min, max) return math.random(min, max) end,
    initSeed = function(seed) math.randomseed(seed) end
}

local mockTypeChart = {
    getEffectiveness = function(attackingType, defendingType)
        -- Mock type effectiveness (Rock vs Flying = 2x)
        if attackingType == 5 and defendingType == 2 then -- Rock vs Flying
            return 2.0
        end
        return 1.0 -- Neutral by default
    end
}

local mockEnums = {
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
    ItemId = {
        AIR_BALLOON = 541
    }
}

-- Test utilities
local function createMockBattleState()
    return {
        battleId = "test-battle",
        turn = 1,
        battleConditions = {
            entryHazards = {
                player = {},
                enemy = {}
            }
        },
        battleEvents = {}
    }
end

local function createMockPokemon(name, types, ability, maxHP, side)
    return {
        id = name .. "-id",
        name = name,
        species = {
            type1 = types[1],
            type2 = types[2] 
        },
        ability = ability,
        maxHP = maxHP or 100,
        currentHP = maxHP or 100,
        battleData = {
            side = side or "player",
            statStages = {
                atk = 0, def = 0, spa = 0, spd = 0, spe = 0, acc = 0, eva = 0
            }
        },
        status = nil,
        statusTurns = nil,
        fainted = false
    }
end

-- Test runner
local tests = {}
local testCount = 0
local passCount = 0

local function assert(condition, message)
    if not condition then
        error("Assertion failed: " .. (message or "no message"))
    end
end

local function assertEquals(expected, actual, message)
    if expected ~= actual then
        error(string.format("Assertion failed: expected %s, got %s. %s", 
              tostring(expected), tostring(actual), message or ""))
    end
end

local function runTest(testName, testFunc)
    testCount = testCount + 1
    print("Running test: " .. testName)
    
    local success, error = pcall(testFunc)
    if success then
        passCount = passCount + 1
        print("✅ " .. testName .. " PASSED")
    else
        print("❌ " .. testName .. " FAILED: " .. error)
    end
    print("")
end

-- Unit Tests

-- Test 1: Hazard Setting Basic Functionality
function tests.testHazardSettingBasic()
    local battleState = createMockBattleState()
    
    -- Test Stealth Rock setting
    local result = EntryHazards.setHazard(battleState, EntryHazards.HazardType.STEALTH_ROCK, "enemy")
    assert(result.success, "Stealth Rock should set successfully")
    assertEquals(1, result.layersAdded, "Should add 1 layer of Stealth Rock")
    assert(battleState.battleConditions.entryHazards.enemy.stealthRock, "Stealth Rock should be set")
    
    -- Test duplicate Stealth Rock (should fail)
    local duplicateResult = EntryHazards.setHazard(battleState, EntryHazards.HazardType.STEALTH_ROCK, "enemy")
    assertEquals(0, duplicateResult.layersAdded, "Should not add duplicate Stealth Rock")
end

function tests.testSpikesLayering()
    local battleState = createMockBattleState()
    
    -- Test Spikes layer stacking
    for layer = 1, 3 do
        local result = EntryHazards.setHazard(battleState, EntryHazards.HazardType.SPIKES, "enemy")
        assert(result.success, "Spikes layer " .. layer .. " should set successfully")
        assertEquals(1, result.layersAdded, "Should add 1 layer of Spikes")
        assertEquals(layer, battleState.battleConditions.entryHazards.enemy.spikes, "Should have " .. layer .. " Spikes layers")
    end
    
    -- Test 4th layer (should fail)
    local extraResult = EntryHazards.setHazard(battleState, EntryHazards.HazardType.SPIKES, "enemy") 
    assertEquals(0, extraResult.layersAdded, "Should not add 4th layer of Spikes")
end

function tests.testToxicSpikesLayering()
    local battleState = createMockBattleState()
    
    -- Test Toxic Spikes layer stacking (max 2)
    for layer = 1, 2 do
        local result = EntryHazards.setHazard(battleState, EntryHazards.HazardType.TOXIC_SPIKES, "enemy")
        assert(result.success, "Toxic Spikes layer " .. layer .. " should set successfully")
        assertEquals(1, result.layersAdded, "Should add 1 layer of Toxic Spikes")
        assertEquals(layer, battleState.battleConditions.entryHazards.enemy.toxicSpikes, "Should have " .. layer .. " Toxic Spikes layers")
    end
    
    -- Test 3rd layer (should fail)
    local extraResult = EntryHazards.setHazard(battleState, EntryHazards.HazardType.TOXIC_SPIKES, "enemy")
    assertEquals(0, extraResult.layersAdded, "Should not add 3rd layer of Toxic Spikes")
end

-- Test 2: Stealth Rock Damage Calculation
function tests.testStealthRockDamage()
    -- Mock external dependencies
    package.loaded["data.constants.type-chart"] = mockTypeChart
    package.loaded["data.constants.enums"] = mockEnums
    
    local battleState = createMockBattleState()
    battleState.battleConditions.entryHazards.player.stealthRock = true
    
    -- Test neutral effectiveness (1x damage)
    local normalPokemon = createMockPokemon("Normal", {mockEnums.PokemonType.NORMAL}, nil, 200, "player")
    local normalResult = EntryHazards.processHazardEffects(battleState, normalPokemon)
    assertEquals(25, normalResult.damageTaken, "Should take 1/8 max HP (25) from Stealth Rock")
    assertEquals(175, normalPokemon.currentHP, "Should have 175 HP remaining")
    
    -- Test super effective (2x damage vs Flying type)
    local flyingPokemon = createMockPokemon("Flying", {mockEnums.PokemonType.FLYING}, nil, 200, "player")
    local flyingResult = EntryHazards.processHazardEffects(battleState, flyingPokemon)
    assertEquals(50, flyingResult.damageTaken, "Should take double damage (50) from Stealth Rock")
    assertEquals(150, flyingPokemon.currentHP, "Should have 150 HP remaining")
end

-- Test 3: Spikes Damage Scaling
function tests.testSpikesDamageScaling() 
    local battleState = createMockBattleState()
    
    -- Test 1 layer (1/8 damage)
    battleState.battleConditions.entryHazards.player.spikes = 1
    local pokemon1 = createMockPokemon("Test1", {mockEnums.PokemonType.NORMAL}, nil, 240, "player")
    local result1 = EntryHazards.processHazardEffects(battleState, pokemon1)
    assertEquals(30, result1.damageTaken, "1 layer should deal 30 damage (1/8 of 240)")
    
    -- Test 2 layers (1/6 damage)
    battleState.battleConditions.entryHazards.player.spikes = 2
    local pokemon2 = createMockPokemon("Test2", {mockEnums.PokemonType.NORMAL}, nil, 240, "player")
    local result2 = EntryHazards.processHazardEffects(battleState, pokemon2)
    assertEquals(40, result2.damageTaken, "2 layers should deal 40 damage (1/6 of 240)")
    
    -- Test 3 layers (1/4 damage)
    battleState.battleConditions.entryHazards.player.spikes = 3
    local pokemon3 = createMockPokemon("Test3", {mockEnums.PokemonType.NORMAL}, nil, 240, "player")
    local result3 = EntryHazards.processHazardEffects(battleState, pokemon3)
    assertEquals(60, result3.damageTaken, "3 layers should deal 60 damage (1/4 of 240)")
end

-- Test 4: Toxic Spikes Status Application
function tests.testToxicSpikesStatus()
    package.loaded["data.constants.enums"] = mockEnums
    
    local battleState = createMockBattleState()
    
    -- Test 1 layer (regular poison)
    battleState.battleConditions.entryHazards.player.toxicSpikes = 1
    local pokemon1 = createMockPokemon("Test1", {mockEnums.PokemonType.NORMAL}, nil, 100, "player")
    local result1 = EntryHazards.processHazardEffects(battleState, pokemon1)
    assertEquals("poison", pokemon1.status, "1 layer should inflict regular poison")
    assertEquals(1, #result1.statusChanges, "Should have 1 status change")
    
    -- Test 2 layers (badly poisoned)
    battleState.battleConditions.entryHazards.player.toxicSpikes = 2
    local pokemon2 = createMockPokemon("Test2", {mockEnums.PokemonType.NORMAL}, nil, 100, "player")
    local result2 = EntryHazards.processHazardEffects(battleState, pokemon2)
    assertEquals("badly_poison", pokemon2.status, "2 layers should inflict badly poisoned")
    assertEquals(1, pokemon2.statusTurns, "Badly poison should start at turn 1")
end

-- Test 5: Poison-type Toxic Spikes Absorption
function tests.testPoisonTypeAbsorption()
    package.loaded["data.constants.enums"] = mockEnums
    
    local battleState = createMockBattleState()
    battleState.battleConditions.entryHazards.player.toxicSpikes = 2
    
    -- Test Poison-type absorption
    local poisonPokemon = createMockPokemon("Poison", {mockEnums.PokemonType.POISON}, nil, 100, "player")
    local result = EntryHazards.processHazardEffects(battleState, poisonPokemon)
    
    assertEquals(1, battleState.battleConditions.entryHazards.player.toxicSpikes, "Should remove 1 layer")
    assertEquals(nil, poisonPokemon.status, "Should not be poisoned")
    assert(result.hazardsRemoved and #result.hazardsRemoved > 0, "Should record hazard removal")
end

-- Test 6: Flying-type and Levitate Immunity
function tests.testGroundHazardImmunity()
    package.loaded["data.constants.enums"] = mockEnums
    
    local battleState = createMockBattleState()
    battleState.battleConditions.entryHazards.player.spikes = 3
    battleState.battleConditions.entryHazards.player.toxicSpikes = 2
    battleState.battleConditions.entryHazards.player.stickyWeb = true
    
    -- Test Flying-type immunity
    local flyingPokemon = createMockPokemon("Flying", {mockEnums.PokemonType.FLYING}, nil, 100, "player")
    local flyingResult = EntryHazards.processHazardEffects(battleState, flyingPokemon)
    assertEquals(0, flyingResult.damageTaken, "Flying-type should take no ground hazard damage")
    assertEquals(nil, flyingPokemon.status, "Flying-type should not be affected by Toxic Spikes")
    
    -- Test Levitate ability immunity
    local levitatePokemon = createMockPokemon("Levitate", {mockEnums.PokemonType.NORMAL}, mockEnums.AbilityId.LEVITATE, 100, "player")
    local levitateResult = EntryHazards.processHazardEffects(battleState, levitatePokemon)
    assertEquals(0, levitateResult.damageTaken, "Levitate should prevent ground hazard damage")
    assertEquals(nil, levitatePokemon.status, "Levitate should prevent Toxic Spikes")
end

-- Test 7: Magic Guard Immunity  
function tests.testMagicGuardImmunity()
    package.loaded["data.constants.enums"] = mockEnums
    
    local battleState = createMockBattleState()
    battleState.battleConditions.entryHazards.player.stealthRock = true
    battleState.battleConditions.entryHazards.player.spikes = 3
    
    local magicGuardPokemon = createMockPokemon("MagicGuard", {mockEnums.PokemonType.NORMAL}, mockEnums.AbilityId.MAGIC_GUARD, 100, "player")
    local result = EntryHazards.processHazardEffects(battleState, magicGuardPokemon)
    
    assertEquals(0, result.damageTaken, "Magic Guard should prevent all entry hazard damage")
    assertEquals(100, magicGuardPokemon.currentHP, "Should take no damage")
end

-- Test 8: Sticky Web Speed Reduction
function tests.testStickyWebEffect()
    local battleState = createMockBattleState()
    battleState.battleConditions.entryHazards.player.stickyWeb = true
    
    local pokemon = createMockPokemon("Test", {mockEnums.PokemonType.NORMAL}, nil, 100, "player")
    local result = EntryHazards.processHazardEffects(battleState, pokemon)
    
    assertEquals(-1, pokemon.battleData.statStages.spe, "Should lower speed by 1 stage")
    assert(result.statChanges.spe == -1, "Should record speed stat change")
end

-- Test 9: Hazard Removal
function tests.testHazardRemoval()
    local battleState = createMockBattleState()
    
    -- Set up multiple hazards
    battleState.battleConditions.entryHazards.player.stealthRock = true
    battleState.battleConditions.entryHazards.player.spikes = 2
    battleState.battleConditions.entryHazards.player.toxicSpikes = 1
    battleState.battleConditions.entryHazards.player.stickyWeb = true
    
    -- Test hazard removal
    local result = EntryHazards.removeHazards(battleState, "player")
    
    assert(result.success, "Hazard removal should succeed")
    assertEquals(4, #result.removed, "Should remove all 4 hazard types")
    
    -- Verify all hazards are cleared
    assertEquals(false, battleState.battleConditions.entryHazards.player.stealthRock or false)
    assertEquals(0, battleState.battleConditions.entryHazards.player.spikes or 0)
    assertEquals(0, battleState.battleConditions.entryHazards.player.toxicSpikes or 0)
    assertEquals(false, battleState.battleConditions.entryHazards.player.stickyWeb or false)
end

-- Test 10: Side-specific Hazard Placement
function tests.testSideSpecificHazards()
    local battleState = createMockBattleState()
    
    -- Set hazards on both sides
    EntryHazards.setHazard(battleState, EntryHazards.HazardType.STEALTH_ROCK, "player")
    EntryHazards.setHazard(battleState, EntryHazards.HazardType.SPIKES, "enemy")
    
    -- Test player side hazard affects player Pokemon
    local playerPokemon = createMockPokemon("Player", {mockEnums.PokemonType.NORMAL}, nil, 100, "player")
    local playerResult = EntryHazards.processHazardEffects(battleState, playerPokemon)
    assert(playerResult.damageTaken > 0, "Player Pokemon should be affected by player-side hazards")
    
    -- Test enemy Pokemon not affected by player-side hazards
    local enemyPokemon = createMockPokemon("Enemy", {mockEnums.PokemonType.NORMAL}, nil, 100, "enemy")  
    local enemyResult = EntryHazards.processHazardEffects(battleState, enemyPokemon)
    assert(enemyResult.damageTaken > 0, "Enemy Pokemon should be affected by enemy-side hazards")
end

-- Test Runner
function runAllTests()
    print("=== Entry Hazards Unit Tests ===")
    print("")
    
    -- Run all tests
    for testName, testFunc in pairs(tests) do
        runTest(testName, testFunc)
    end
    
    -- Print summary
    print("=== Test Summary ===")
    print("Total tests: " .. testCount)
    print("Passed: " .. passCount)
    print("Failed: " .. (testCount - passCount))
    print("Success rate: " .. string.format("%.1f", (passCount / testCount) * 100) .. "%")
    
    if passCount == testCount then
        print("🎉 All tests passed!")
        return true
    else
        print("💥 Some tests failed!")
        return false
    end
end

-- Export for external test runners
return {
    runAllTests = runAllTests,
    tests = tests
}