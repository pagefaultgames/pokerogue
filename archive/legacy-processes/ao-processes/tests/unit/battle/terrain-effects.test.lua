-- Terrain Effects Unit Tests
-- Comprehensive testing for terrain mechanics with 100% coverage requirement
-- Tests electric, grassy, misty, and psychic terrain effects

-- Load dependencies
local TerrainEffects = require("game-logic.battle.terrain-effects")
local Enums = require("data.constants.enums")

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
local function createMockPokemon(types, ability, item, currentHP, maxHP)
    return {
        id = "test-pokemon-" .. math.random(1000, 9999),
        name = "Test Pokemon",
        types = types or {Enums.PokemonType.NORMAL},
        ability = ability or Enums.AbilityId.NONE,
        item = item or Enums.ItemId.NONE,
        currentHP = currentHP or 100,
        maxHP = maxHP or 100,
        stats = {100, 80, 70, 65, 65, 90} -- HP, ATK, DEF, SPATK, SPDEF, SPD
    }
end

local function createMockMoveData(moveType, moveName, priority, power)
    return {
        type = moveType or Enums.PokemonType.NORMAL,
        name = moveName or "test-move",
        priority = priority or 0,
        power = power or 80
    }
end

-- Test Suite 1: Terrain State Management
local function testTerrainStateInitialization()
    print("Testing terrain state initialization...")
    
    local terrainState = TerrainEffects.initializeTerrainState("test-battle-1")
    
    assertNotNil(terrainState, "Terrain state should not be nil")
    assertEquals("test-battle-1", terrainState.battle_id, "Battle ID should match")
    assertEquals(TerrainEffects.TerrainType.NONE, terrainState.current_terrain, "Initial terrain should be NONE")
    assertEquals(0, terrainState.duration_remaining, "Initial duration should be 0")
    assertNotNil(terrainState.timestamp, "Timestamp should be set")
    
    print("✓ Terrain state initialization tests passed")
end

local function testTerrainSetting()
    print("Testing terrain setting...")
    
    local terrainState = TerrainEffects.initializeTerrainState("test-battle-2")
    
    -- Test Electric Terrain setting
    local updatedState, success, message = TerrainEffects.setTerrain(
        terrainState, 
        TerrainEffects.TerrainType.ELECTRIC, 
        nil, 
        "Electric Terrain"
    )
    
    assertTrue(success, "Setting Electric Terrain should succeed")
    assertEquals(TerrainEffects.TerrainType.ELECTRIC, updatedState.current_terrain, "Current terrain should be ELECTRIC")
    assertEquals(5, updatedState.duration_remaining, "Duration should be default 5 turns")
    assertEquals("Electric Terrain", updatedState.source, "Source should be set correctly")
    
    -- Test custom duration
    updatedState, success, message = TerrainEffects.setTerrain(
        updatedState, 
        TerrainEffects.TerrainType.GRASSY, 
        8, 
        "Terrain Extender"
    )
    
    assertTrue(success, "Setting Grassy Terrain with custom duration should succeed")
    assertEquals(TerrainEffects.TerrainType.GRASSY, updatedState.current_terrain, "Current terrain should be GRASSY")
    assertEquals(8, updatedState.duration_remaining, "Duration should be custom 8 turns")
    
    -- Test clearing terrain
    updatedState, success, message = TerrainEffects.setTerrain(
        updatedState, 
        TerrainEffects.TerrainType.NONE, 
        nil, 
        "manual"
    )
    
    assertTrue(success, "Clearing terrain should succeed")
    assertEquals(TerrainEffects.TerrainType.NONE, updatedState.current_terrain, "Current terrain should be NONE")
    assertEquals(0, updatedState.duration_remaining, "Duration should be 0")
    
    print("✓ Terrain setting tests passed")
end

-- Test Suite 2: Pokemon Grounding Detection
local function testPokemonGrounding()
    print("Testing Pokemon grounding detection...")
    
    -- Test normal grounded Pokemon
    local groundedPokemon = createMockPokemon({Enums.PokemonType.NORMAL}, Enums.AbilityId.NONE, Enums.ItemId.NONE)
    assertTrue(TerrainEffects.isPokemonGrounded(groundedPokemon), "Normal Pokemon should be grounded")
    
    -- Test Flying-type Pokemon (not grounded)
    local flyingPokemon = createMockPokemon({Enums.PokemonType.FLYING}, Enums.AbilityId.NONE, Enums.ItemId.NONE)
    assertFalse(TerrainEffects.isPokemonGrounded(flyingPokemon), "Flying-type Pokemon should not be grounded")
    
    -- Test dual-type with Flying (not grounded)
    local dualFlyingPokemon = createMockPokemon({Enums.PokemonType.NORMAL, Enums.PokemonType.FLYING}, Enums.AbilityId.NONE, Enums.ItemId.NONE)
    assertFalse(TerrainEffects.isPokemonGrounded(dualFlyingPokemon), "Dual-type with Flying should not be grounded")
    
    -- Test Levitate ability (not grounded)
    local levitatePokemon = createMockPokemon({Enums.PokemonType.GROUND}, Enums.AbilityId.LEVITATE, Enums.ItemId.NONE)
    assertFalse(TerrainEffects.isPokemonGrounded(levitatePokemon), "Pokemon with Levitate should not be grounded")
    
    -- Test Iron Ball item (forces grounding)
    local ironBallFlying = createMockPokemon({Enums.PokemonType.FLYING}, Enums.AbilityId.NONE, Enums.ItemId.IRON_BALL)
    assertTrue(TerrainEffects.isPokemonGrounded(ironBallFlying), "Flying Pokemon with Iron Ball should be grounded")
    
    -- Test Iron Ball overrides Levitate
    local ironBallLevitate = createMockPokemon({Enums.PokemonType.PSYCHIC}, Enums.AbilityId.LEVITATE, Enums.ItemId.IRON_BALL)
    assertTrue(TerrainEffects.isPokemonGrounded(ironBallLevitate), "Levitate Pokemon with Iron Ball should be grounded")
    
    -- Test Air Balloon item (not grounded)
    local airBalloonPokemon = createMockPokemon({Enums.PokemonType.GROUND}, Enums.AbilityId.NONE, Enums.ItemId.AIR_BALLOON)
    assertFalse(TerrainEffects.isPokemonGrounded(airBalloonPokemon), "Pokemon with Air Balloon should not be grounded")
    
    print("✓ Pokemon grounding detection tests passed")
end

-- Test Suite 3: Terrain Move Power Modifiers
local function testTerrainMovePowerModifiers()
    print("Testing terrain move power modifiers...")
    
    -- Test Electric Terrain boosting Electric moves
    local electricTerrain = TerrainEffects.initializeTerrainState("test-battle-3")
    electricTerrain, _, _ = TerrainEffects.setTerrain(electricTerrain, TerrainEffects.TerrainType.ELECTRIC, nil, "test")
    
    local electricMove = createMockMoveData(Enums.PokemonType.ELECTRIC, "thunderbolt", 0, 90)
    local electricModifier = TerrainEffects.getTerrainMovePowerModifier(electricMove, electricTerrain, true)
    assertEquals(1.3, electricModifier, "Electric moves should get 1.3x boost in Electric Terrain")
    
    -- Test non-Electric move in Electric Terrain (no boost)
    local normalMove = createMockMoveData(Enums.PokemonType.NORMAL, "tackle", 0, 40)
    local normalModifier = TerrainEffects.getTerrainMovePowerModifier(normalMove, electricTerrain, true)
    assertEquals(1.0, normalModifier, "Non-Electric moves should not be boosted in Electric Terrain")
    
    -- Test Grassy Terrain boosting Grass moves
    local grassyTerrain = TerrainEffects.initializeTerrainState("test-battle-4")
    grassyTerrain, _, _ = TerrainEffects.setTerrain(grassyTerrain, TerrainEffects.TerrainType.GRASSY, nil, "test")
    
    local grassMove = createMockMoveData(Enums.PokemonType.GRASS, "solar_beam", 0, 120)
    local grassModifier = TerrainEffects.getTerrainMovePowerModifier(grassMove, grassyTerrain, true)
    assertEquals(1.3, grassModifier, "Grass moves should get 1.3x boost in Grassy Terrain")
    
    -- Test Earthquake in Grassy Terrain (reduced power)
    local earthquakeMove = createMockMoveData(Enums.PokemonType.GROUND, "earthquake", 0, 100)
    local earthquakeModifier = TerrainEffects.getTerrainMovePowerModifier(earthquakeMove, grassyTerrain, true)
    assertEquals(0.5, earthquakeModifier, "Earthquake should be reduced to 0.5x in Grassy Terrain")
    
    -- Test Misty Terrain reducing Dragon moves
    local mistyTerrain = TerrainEffects.initializeTerrainState("test-battle-5")
    mistyTerrain, _, _ = TerrainEffects.setTerrain(mistyTerrain, TerrainEffects.TerrainType.MISTY, nil, "test")
    
    local dragonMove = createMockMoveData(Enums.PokemonType.DRAGON, "dragon_pulse", 0, 85)
    local dragonModifier = TerrainEffects.getTerrainMovePowerModifier(dragonMove, mistyTerrain, true)
    assertEquals(0.5, dragonModifier, "Dragon moves should be reduced to 0.5x in Misty Terrain")
    
    -- Test Psychic Terrain boosting Psychic moves
    local psychicTerrain = TerrainEffects.initializeTerrainState("test-battle-6")
    psychicTerrain, _, _ = TerrainEffects.setTerrain(psychicTerrain, TerrainEffects.TerrainType.PSYCHIC, nil, "test")
    
    local psychicMove = createMockMoveData(Enums.PokemonType.PSYCHIC, "psychic", 0, 90)
    local psychicModifier = TerrainEffects.getTerrainMovePowerModifier(psychicMove, psychicTerrain, true)
    assertEquals(1.3, psychicModifier, "Psychic moves should get 1.3x boost in Psychic Terrain")
    
    -- Test ungrounded Pokemon gets no terrain boost
    local ungroupedModifier = TerrainEffects.getTerrainMovePowerModifier(electricMove, electricTerrain, false)
    assertEquals(1.0, ungroupedModifier, "Ungrounded Pokemon should not get terrain boost")
    
    print("✓ Terrain move power modifier tests passed")
end

-- Test Suite 4: Terrain Move Blocking
local function testTerrainMoveBlocking()
    print("Testing terrain move blocking...")
    
    -- Test Psychic Terrain blocking priority moves
    local psychicTerrain = TerrainEffects.initializeTerrainState("test-battle-7")
    psychicTerrain, _, _ = TerrainEffects.setTerrain(psychicTerrain, TerrainEffects.TerrainType.PSYCHIC, nil, "test")
    
    local priorityMove = createMockMoveData(Enums.PokemonType.NORMAL, "quick_attack", 1, 40)
    local blocked, reason = TerrainEffects.doesTerrainBlockMove(priorityMove, psychicTerrain, true)
    assertTrue(blocked, "Priority moves should be blocked in Psychic Terrain")
    assertNotNil(reason, "Block reason should be provided")
    
    -- Test normal priority move in Psychic Terrain (not blocked)
    local normalPriorityMove = createMockMoveData(Enums.PokemonType.NORMAL, "tackle", 0, 40)
    local notBlocked, _ = TerrainEffects.doesTerrainBlockMove(normalPriorityMove, psychicTerrain, true)
    assertFalse(notBlocked, "Normal priority moves should not be blocked in Psychic Terrain")
    
    -- Test ungrounded Pokemon in Psychic Terrain (not blocked)
    local ungroundedBlocked, _ = TerrainEffects.doesTerrainBlockMove(priorityMove, psychicTerrain, false)
    assertFalse(ungroundedBlocked, "Priority moves should not be blocked for ungrounded Pokemon")
    
    -- Test other terrains don't block moves
    local electricTerrain = TerrainEffects.initializeTerrainState("test-battle-8")
    electricTerrain, _, _ = TerrainEffects.setTerrain(electricTerrain, TerrainEffects.TerrainType.ELECTRIC, nil, "test")
    
    local electricBlocked, _ = TerrainEffects.doesTerrainBlockMove(priorityMove, electricTerrain, true)
    assertFalse(electricBlocked, "Electric Terrain should not block priority moves")
    
    print("✓ Terrain move blocking tests passed")
end

-- Test Suite 5: Terrain Status Prevention
local function testTerrainStatusPrevention()
    print("Testing terrain status prevention...")
    
    -- Test Electric Terrain preventing sleep
    local electricTerrain = TerrainEffects.initializeTerrainState("test-battle-9")
    electricTerrain, _, _ = TerrainEffects.setTerrain(electricTerrain, TerrainEffects.TerrainType.ELECTRIC, nil, "test")
    
    local sleepPrevented = TerrainEffects.doesTerrainPreventStatus("sleep", electricTerrain, true)
    assertTrue(sleepPrevented, "Electric Terrain should prevent sleep")
    
    local poisonNotPrevented = TerrainEffects.doesTerrainPreventStatus("poison", electricTerrain, true)
    assertFalse(poisonNotPrevented, "Electric Terrain should not prevent poison")
    
    -- Test Misty Terrain preventing all status conditions
    local mistyTerrain = TerrainEffects.initializeTerrainState("test-battle-10")
    mistyTerrain, _, _ = TerrainEffects.setTerrain(mistyTerrain, TerrainEffects.TerrainType.MISTY, nil, "test")
    
    local statusConditions = {"sleep", "poison", "paralysis", "burn", "freeze"}
    for _, status in ipairs(statusConditions) do
        local prevented = TerrainEffects.doesTerrainPreventStatus(status, mistyTerrain, true)
        assertTrue(prevented, "Misty Terrain should prevent " .. status)
    end
    
    -- Test ungrounded Pokemon don't get status prevention
    local ungroundedPrevention = TerrainEffects.doesTerrainPreventStatus("sleep", electricTerrain, false)
    assertFalse(ungroundedPrevention, "Ungrounded Pokemon should not get terrain status prevention")
    
    print("✓ Terrain status prevention tests passed")
end

-- Test Suite 6: Terrain Healing Effects
local function testTerrainHealing()
    print("Testing terrain healing effects...")
    
    -- Test Grassy Terrain healing
    local grassyTerrain = TerrainEffects.initializeTerrainState("test-battle-11")
    grassyTerrain, _, _ = TerrainEffects.setTerrain(grassyTerrain, TerrainEffects.TerrainType.GRASSY, nil, "test")
    
    local damagedPokemon = createMockPokemon({Enums.PokemonType.NORMAL}, Enums.AbilityId.NONE, Enums.ItemId.NONE, 50, 100)
    local fullHPPokemon = createMockPokemon({Enums.PokemonType.NORMAL}, Enums.AbilityId.NONE, Enums.ItemId.NONE, 100, 100)
    local faintedPokemon = createMockPokemon({Enums.PokemonType.NORMAL}, Enums.AbilityId.NONE, Enums.ItemId.NONE, 0, 100)
    local flyingPokemon = createMockPokemon({Enums.PokemonType.FLYING}, Enums.AbilityId.NONE, Enums.ItemId.NONE, 50, 100)
    
    local pokemonList = {damagedPokemon, fullHPPokemon, faintedPokemon, flyingPokemon}
    local healingResults = TerrainEffects.processTerrainHealing(grassyTerrain, pokemonList)
    
    assertEquals(1, #healingResults, "Should have 1 healing result (only damaged grounded Pokemon)")
    assertEquals(damagedPokemon.id, healingResults[1].pokemon_id, "Healing should be for damaged Pokemon")
    assertEquals(6, healingResults[1].healing, "Should heal 1/16 of max HP (100/16 = 6.25, floor = 6)")
    assertEquals(56, healingResults[1].new_hp, "New HP should be current + healing")
    
    -- Test other terrains don't heal
    local electricTerrain = TerrainEffects.initializeTerrainState("test-battle-12")
    electricTerrain, _, _ = TerrainEffects.setTerrain(electricTerrain, TerrainEffects.TerrainType.ELECTRIC, nil, "test")
    
    local noHealingResults = TerrainEffects.processTerrainHealing(electricTerrain, pokemonList)
    assertEquals(0, #noHealingResults, "Electric Terrain should not provide healing")
    
    print("✓ Terrain healing tests passed")
end

-- Test Suite 7: Terrain Duration Management
local function testTerrainDuration()
    print("Testing terrain duration management...")
    
    local terrainState = TerrainEffects.initializeTerrainState("test-battle-13")
    terrainState, _, _ = TerrainEffects.setTerrain(terrainState, TerrainEffects.TerrainType.ELECTRIC, 3, "test")
    
    -- Test duration countdown
    assertEquals(3, terrainState.duration_remaining, "Initial duration should be 3")
    
    local updatedState, expired = TerrainEffects.updateTerrainDuration(terrainState)
    assertEquals(2, updatedState.duration_remaining, "Duration should decrease to 2")
    assertFalse(expired, "Terrain should not expire yet")
    
    updatedState, expired = TerrainEffects.updateTerrainDuration(updatedState)
    assertEquals(1, updatedState.duration_remaining, "Duration should decrease to 1")
    assertFalse(expired, "Terrain should not expire yet")
    
    updatedState, expired = TerrainEffects.updateTerrainDuration(updatedState)
    assertEquals(0, updatedState.duration_remaining, "Duration should reach 0")
    assertEquals(TerrainEffects.TerrainType.NONE, updatedState.current_terrain, "Terrain should be cleared")
    assertTrue(expired, "Terrain should expire")
    
    -- Test permanent terrain (-1 duration)
    local permanentState = TerrainEffects.initializeTerrainState("test-battle-14")
    permanentState, _, _ = TerrainEffects.setTerrain(permanentState, TerrainEffects.TerrainType.GRASSY, -1, "test")
    
    local stillPermanent, permanentExpired = TerrainEffects.updateTerrainDuration(permanentState)
    assertEquals(-1, stillPermanent.duration_remaining, "Permanent terrain should stay -1")
    assertFalse(permanentExpired, "Permanent terrain should not expire")
    
    print("✓ Terrain duration management tests passed")
end

-- Test Suite 8: Terrain Info and Display
local function testTerrainInfo()
    print("Testing terrain info and display...")
    
    -- Test no terrain
    local noTerrainState = TerrainEffects.initializeTerrainState("test-battle-15")
    local noTerrainInfo = TerrainEffects.getTerrainInfo(noTerrainState)
    
    assertEquals("None", noTerrainInfo.name, "No terrain should show 'None'")
    assertEquals(TerrainEffects.TerrainType.NONE, noTerrainInfo.type, "Type should be NONE")
    assertEquals(0, noTerrainInfo.duration, "Duration should be 0")
    assertFalse(noTerrainInfo.active, "Should not be active")
    
    -- Test active terrain
    local activeState = TerrainEffects.initializeTerrainState("test-battle-16")
    activeState, _, _ = TerrainEffects.setTerrain(activeState, TerrainEffects.TerrainType.ELECTRIC, 5, "Electric Surge")
    local activeInfo = TerrainEffects.getTerrainInfo(activeState)
    
    assertEquals("Electric Terrain", activeInfo.name, "Should show terrain name")
    assertEquals(TerrainEffects.TerrainType.ELECTRIC, activeInfo.type, "Type should be ELECTRIC")
    assertEquals(5, activeInfo.duration, "Duration should be 5")
    assertTrue(activeInfo.active, "Should be active")
    assertEquals("Electric Surge", activeInfo.source, "Source should be set")
    assertNotNil(activeInfo.description, "Description should be provided")
    
    print("✓ Terrain info and display tests passed")
end

-- Main test runner
local function runAllTerrainEffectsTests()
    print("=== Running Terrain Effects Unit Tests ===")
    
    local tests = {
        testTerrainStateInitialization,
        testTerrainSetting,
        testPokemonGrounding,
        testTerrainMovePowerModifiers,
        testTerrainMoveBlocking,
        testTerrainStatusPrevention,
        testTerrainHealing,
        testTerrainDuration,
        testTerrainInfo
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
    
    print(string.format("\n=== Test Results: %d passed, %d failed ===", passed, failed))
    
    if failed == 0 then
        print("🎉 All terrain effects tests passed!")
    else
        error("Some terrain effects tests failed")
    end
end

-- Export test functions
return {
    runAllTests = runAllTerrainEffectsTests,
    testTerrainStateInitialization = testTerrainStateInitialization,
    testTerrainSetting = testTerrainSetting,
    testPokemonGrounding = testPokemonGrounding,
    testTerrainMovePowerModifiers = testTerrainMovePowerModifiers,
    testTerrainMoveBlocking = testTerrainMoveBlocking,
    testTerrainStatusPrevention = testTerrainStatusPrevention,
    testTerrainHealing = testTerrainHealing,
    testTerrainDuration = testTerrainDuration,
    testTerrainInfo = testTerrainInfo
}