-- Terrain Abilities Unit Tests
-- Comprehensive testing for terrain-related ability interactions
-- Tests terrain-setting abilities, terrain-activated abilities, and stat modifications

-- Load dependencies
local TerrainAbilities = require("game-logic.battle.terrain-abilities")
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

local function assertNil(value, message)
    if value ~= nil then
        error(string.format("Assertion failed: %s\nValue should be nil", message or ""))
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
local function createMockPokemon(ability, item, types, name)
    return {
        id = "test-pokemon-" .. math.random(1000, 9999),
        name = name or "Test Pokemon",
        ability = ability or Enums.AbilityId.NONE,
        item = item or Enums.ItemId.NONE,
        types = types or {Enums.PokemonType.NORMAL},
        stats = {100, 80, 70, 65, 65, 90} -- HP, ATK, DEF, SPATK, SPDEF, SPD
    }
end

-- Test Suite 1: Terrain-Setting Abilities
local function testTerrainSurgeAbilities()
    print("Testing terrain-setting abilities...")
    
    -- Test Electric Surge
    local electricSurgePokemon = createMockPokemon(Enums.AbilityId.ELECTRIC_SURGE, Enums.ItemId.NONE, {Enums.PokemonType.ELECTRIC}, "Tapu Koko")
    local terrainType = TerrainAbilities.getTerrainFromAbility(electricSurgePokemon)
    assertEquals(TerrainEffects.TerrainType.ELECTRIC, terrainType, "Electric Surge should set Electric Terrain")
    
    -- Test Grassy Surge  
    local grassySurgePokemon = createMockPokemon(Enums.AbilityId.GRASSY_SURGE, Enums.ItemId.NONE, {Enums.PokemonType.GRASS}, "Tapu Bulu")
    terrainType = TerrainAbilities.getTerrainFromAbility(grassySurgePokemon)
    assertEquals(TerrainEffects.TerrainType.GRASSY, terrainType, "Grassy Surge should set Grassy Terrain")
    
    -- Test Misty Surge
    local mistySurgePokemon = createMockPokemon(Enums.AbilityId.MISTY_SURGE, Enums.ItemId.NONE, {Enums.PokemonType.FAIRY}, "Tapu Fini")
    terrainType = TerrainAbilities.getTerrainFromAbility(mistySurgePokemon)
    assertEquals(TerrainEffects.TerrainType.MISTY, terrainType, "Misty Surge should set Misty Terrain")
    
    -- Test Psychic Surge
    local psychicSurgePokemon = createMockPokemon(Enums.AbilityId.PSYCHIC_SURGE, Enums.ItemId.NONE, {Enums.PokemonType.PSYCHIC}, "Tapu Lele")
    terrainType = TerrainAbilities.getTerrainFromAbility(psychicSurgePokemon)
    assertEquals(TerrainEffects.TerrainType.PSYCHIC, terrainType, "Psychic Surge should set Psychic Terrain")
    
    -- Test non-terrain ability
    local normalPokemon = createMockPokemon(Enums.AbilityId.INTIMIDATE, Enums.ItemId.NONE, {Enums.PokemonType.NORMAL})
    terrainType = TerrainAbilities.getTerrainFromAbility(normalPokemon)
    assertNil(terrainType, "Non-terrain abilities should return nil")
    
    print("✓ Terrain-setting abilities tests passed")
end

local function testTerrainSurgeActivation()
    print("Testing terrain surge activation...")
    
    local electricSurgePokemon = createMockPokemon(Enums.AbilityId.ELECTRIC_SURGE, Enums.ItemId.NONE, {Enums.PokemonType.ELECTRIC}, "Tapu Koko")
    local terrainState = TerrainEffects.initializeTerrainState("test-battle-1")
    
    -- Test initial activation
    local updatedTerrain, activationMessage = TerrainAbilities.processTerrainSurgeAbility(electricSurgePokemon, terrainState)
    
    assertNotNil(activationMessage, "Should have activation message")
    assertEquals(TerrainEffects.TerrainType.ELECTRIC, updatedTerrain.current_terrain, "Terrain should be set to Electric")
    assertEquals(5, updatedTerrain.duration_remaining, "Duration should be default 5 turns")
    assertTrue(string.find(activationMessage, "activated") ~= nil, "Message should mention activation")
    
    -- Test no activation when terrain already active
    local noActivationTerrain, noMessage = TerrainAbilities.processTerrainSurgeAbility(electricSurgePokemon, updatedTerrain)
    assertNil(noMessage, "Should not activate when terrain already set")
    
    -- Test different terrain overrides
    local grassySurgePokemon = createMockPokemon(Enums.AbilityId.GRASSY_SURGE, Enums.ItemId.NONE, {Enums.PokemonType.GRASS}, "Tapu Bulu")
    local grassyTerrain, grassyMessage = TerrainAbilities.processTerrainSurgeAbility(grassySurgePokemon, updatedTerrain)
    
    assertNotNil(grassyMessage, "Should activate when different terrain")
    assertEquals(TerrainEffects.TerrainType.GRASSY, grassyTerrain.current_terrain, "Should override with Grassy Terrain")
    
    print("✓ Terrain surge activation tests passed")
end

-- Test Suite 2: Terrain-Activated Abilities
local function testTerrainActivatedAbilities()
    print("Testing terrain-activated abilities...")
    
    -- Test Surge Surfer in Electric Terrain
    local surgeSurferPokemon = createMockPokemon(Enums.AbilityId.SURGE_SURFER, Enums.ItemId.NONE, {Enums.PokemonType.ELECTRIC}, "Raichu")
    
    local electricTerrain = TerrainEffects.initializeTerrainState("test-battle-2")
    electricTerrain, _, _ = TerrainEffects.setTerrain(electricTerrain, TerrainEffects.TerrainType.ELECTRIC, nil, "test")
    
    local hasActivatedAbility = TerrainAbilities.hasTerrainActivatedAbility(surgeSurferPokemon, electricTerrain)
    assertTrue(hasActivatedAbility, "Surge Surfer should be active in Electric Terrain")
    
    -- Test Surge Surfer in wrong terrain
    local grassyTerrain = TerrainEffects.initializeTerrainState("test-battle-3")
    grassyTerrain, _, _ = TerrainEffects.setTerrain(grassyTerrain, TerrainEffects.TerrainType.GRASSY, nil, "test")
    
    local hasNoActivatedAbility = TerrainAbilities.hasTerrainActivatedAbility(surgeSurferPokemon, grassyTerrain)
    assertFalse(hasNoActivatedAbility, "Surge Surfer should not be active in Grassy Terrain")
    
    -- Test Grass Pelt in Grassy Terrain
    local grassPeltPokemon = createMockPokemon(Enums.AbilityId.GRASS_PELT, Enums.ItemId.NONE, {Enums.PokemonType.GRASS}, "Skiddo")
    
    local grassPeltActive = TerrainAbilities.hasTerrainActivatedAbility(grassPeltPokemon, grassyTerrain)
    assertTrue(grassPeltActive, "Grass Pelt should be active in Grassy Terrain")
    
    -- Test non-terrain activated ability
    local normalPokemon = createMockPokemon(Enums.AbilityId.INTIMIDATE, Enums.ItemId.NONE, {Enums.PokemonType.NORMAL})
    local normalAbilityActive = TerrainAbilities.hasTerrainActivatedAbility(normalPokemon, electricTerrain)
    assertFalse(normalAbilityActive, "Non-terrain abilities should not be activated by terrain")
    
    print("✓ Terrain-activated abilities tests passed")
end

-- Test Suite 3: Terrain Ability Stat Modifiers
local function testTerrainAbilityStatModifiers()
    print("Testing terrain ability stat modifiers...")
    
    -- Test Surge Surfer speed boost
    local surgeSurferPokemon = createMockPokemon(Enums.AbilityId.SURGE_SURFER, Enums.ItemId.NONE, {Enums.PokemonType.ELECTRIC}, "Raichu")
    
    local electricTerrain = TerrainEffects.initializeTerrainState("test-battle-4")
    electricTerrain, _, _ = TerrainEffects.setTerrain(electricTerrain, TerrainEffects.TerrainType.ELECTRIC, nil, "test")
    
    local speedModifier = TerrainAbilities.getTerrainAbilityStatModifier(surgeSurferPokemon, electricTerrain, Enums.Stat.SPD)
    assertEquals(2.0, speedModifier, "Surge Surfer should double speed in Electric Terrain")
    
    -- Test other stats not affected by Surge Surfer
    local attackModifier = TerrainAbilities.getTerrainAbilityStatModifier(surgeSurferPokemon, electricTerrain, Enums.Stat.ATK)
    assertEquals(1.0, attackModifier, "Surge Surfer should not affect attack stat")
    
    -- Test Grass Pelt defense boost
    local grassPeltPokemon = createMockPokemon(Enums.AbilityId.GRASS_PELT, Enums.ItemId.NONE, {Enums.PokemonType.GRASS}, "Skiddo")
    
    local grassyTerrain = TerrainEffects.initializeTerrainState("test-battle-5")
    grassyTerrain, _, _ = TerrainEffects.setTerrain(grassyTerrain, TerrainEffects.TerrainType.GRASSY, nil, "test")
    
    local defenseModifier = TerrainAbilities.getTerrainAbilityStatModifier(grassPeltPokemon, grassyTerrain, Enums.Stat.DEF)
    assertEquals(1.5, defenseModifier, "Grass Pelt should boost defense by 1.5x in Grassy Terrain")
    
    -- Test other stats not affected by Grass Pelt
    local speedModifierGrass = TerrainAbilities.getTerrainAbilityStatModifier(grassPeltPokemon, grassyTerrain, Enums.Stat.SPD)
    assertEquals(1.0, speedModifierGrass, "Grass Pelt should not affect speed stat")
    
    -- Test ability in wrong terrain
    local wrongTerrainModifier = TerrainAbilities.getTerrainAbilityStatModifier(surgeSurferPokemon, grassyTerrain, Enums.Stat.SPD)
    assertEquals(1.0, wrongTerrainModifier, "Surge Surfer should not activate in wrong terrain")
    
    print("✓ Terrain ability stat modifier tests passed")
end

-- Test Suite 4: Terrain Ability Messages
local function testTerrainAbilityMessages()
    print("Testing terrain ability messages...")
    
    local surgeSurferPokemon = createMockPokemon(Enums.AbilityId.SURGE_SURFER, Enums.ItemId.NONE, {Enums.PokemonType.ELECTRIC}, "Alolan Raichu")
    
    local electricTerrain = TerrainEffects.initializeTerrainState("test-battle-6")
    electricTerrain, _, _ = TerrainEffects.setTerrain(electricTerrain, TerrainEffects.TerrainType.ELECTRIC, nil, "test")
    
    local activationMessage = TerrainAbilities.getTerrainAbilityActivationMessage(surgeSurferPokemon, electricTerrain)
    assertNotNil(activationMessage, "Should have activation message for Surge Surfer")
    assertTrue(string.find(activationMessage, "Alolan Raichu") ~= nil, "Message should contain Pokemon name")
    assertTrue(string.find(activationMessage, "activated") ~= nil, "Message should mention activation")
    
    -- Test no message when ability not activated
    local noMessage = TerrainAbilities.getTerrainAbilityActivationMessage(surgeSurferPokemon, TerrainEffects.initializeTerrainState("test-battle-7"))
    assertNil(noMessage, "Should have no message when ability not activated")
    
    -- Test different ability message
    local grassPeltPokemon = createMockPokemon(Enums.AbilityId.GRASS_PELT, Enums.ItemId.NONE, {Enums.PokemonType.GRASS}, "Gogoat")
    
    local grassyTerrain = TerrainEffects.initializeTerrainState("test-battle-8")
    grassyTerrain, _, _ = TerrainEffects.setTerrain(grassyTerrain, TerrainEffects.TerrainType.GRASSY, nil, "test")
    
    local grassPeltMessage = TerrainAbilities.getTerrainAbilityActivationMessage(grassPeltPokemon, grassyTerrain)
    assertNotNil(grassPeltMessage, "Should have activation message for Grass Pelt")
    assertTrue(string.find(grassPeltMessage, "Gogoat") ~= nil, "Message should contain Pokemon name")
    
    print("✓ Terrain ability message tests passed")
end

-- Test Suite 5: Terrain Duration Modifications
local function testTerrainDurationModifications()
    print("Testing terrain duration modifications...")
    
    -- Test Terrain Extender item
    local terrainExtenderPokemon = createMockPokemon(Enums.AbilityId.ELECTRIC_SURGE, Enums.ItemId.TERRAIN_EXTENDER, {Enums.PokemonType.ELECTRIC}, "Tapu Koko")
    local terrainState = TerrainEffects.initializeTerrainState("test-battle-9")
    
    local modifiedDuration = TerrainAbilities.getModifiedTerrainDuration(terrainExtenderPokemon, terrainState, 5)
    assertEquals(8, modifiedDuration, "Terrain Extender should extend duration from 5 to 8 turns")
    
    -- Test no modification for non-standard duration
    local noModification = TerrainAbilities.getModifiedTerrainDuration(terrainExtenderPokemon, terrainState, 3)
    assertEquals(3, noModification, "Should not modify non-standard durations")
    
    -- Test no item
    local normalPokemon = createMockPokemon(Enums.AbilityId.ELECTRIC_SURGE, Enums.ItemId.NONE, {Enums.PokemonType.ELECTRIC}, "Tapu Koko")
    local normalDuration = TerrainAbilities.getModifiedTerrainDuration(normalPokemon, terrainState, 5)
    assertEquals(5, normalDuration, "Should not modify duration without Terrain Extender")
    
    print("✓ Terrain duration modification tests passed")
end

-- Test Suite 6: Terrain Ability Info
local function testTerrainAbilityInfo()
    print("Testing terrain ability info...")
    
    -- Test terrain-setting ability info
    local electricSurgePokemon = createMockPokemon(Enums.AbilityId.ELECTRIC_SURGE, Enums.ItemId.NONE, {Enums.PokemonType.ELECTRIC}, "Tapu Koko")
    local surgeInfo = TerrainAbilities.getTerrainAbilityInfo(electricSurgePokemon)
    
    assertEquals(1, #surgeInfo, "Should have one terrain ability info")
    assertEquals("terrain_surge", surgeInfo[1].type, "Should be terrain surge type")
    assertTrue(string.find(surgeInfo[1].description, "switch-in") ~= nil, "Should mention switch-in activation")
    
    -- Test terrain-activated ability info
    local surgeSurferPokemon = createMockPokemon(Enums.AbilityId.SURGE_SURFER, Enums.ItemId.NONE, {Enums.PokemonType.ELECTRIC}, "Raichu")
    local surferInfo = TerrainAbilities.getTerrainAbilityInfo(surgeSurferPokemon)
    
    assertEquals(1, #surferInfo, "Should have one terrain ability info")
    assertEquals("terrain_activated", surferInfo[1].type, "Should be terrain activated type")
    assertEquals("speed_double", surferInfo[1].effect, "Should have speed doubling effect")
    
    -- Test Pokemon with no terrain abilities
    local normalPokemon = createMockPokemon(Enums.AbilityId.INTIMIDATE, Enums.ItemId.NONE, {Enums.PokemonType.NORMAL})
    local noInfo = TerrainAbilities.getTerrainAbilityInfo(normalPokemon)
    
    assertEquals(0, #noInfo, "Should have no terrain ability info for normal abilities")
    
    print("✓ Terrain ability info tests passed")
end

-- Test Suite 7: End-of-Turn Terrain Ability Effects
local function testEndOfTurnTerrainAbilities()
    print("Testing end-of-turn terrain ability effects...")
    
    local surgeSurferPokemon = createMockPokemon(Enums.AbilityId.SURGE_SURFER, Enums.ItemId.NONE, {Enums.PokemonType.ELECTRIC}, "Raichu")
    
    local electricTerrain = TerrainEffects.initializeTerrainState("test-battle-10")
    electricTerrain, _, _ = TerrainEffects.setTerrain(electricTerrain, TerrainEffects.TerrainType.ELECTRIC, nil, "test")
    
    local endOfTurnEffects = TerrainAbilities.processEndOfTurnTerrainAbilities(surgeSurferPokemon, electricTerrain)
    
    -- Current abilities (Surge Surfer, Grass Pelt) don't have end-of-turn effects
    -- This test validates the structure and that no effects are returned when none should be
    assertTrue(type(endOfTurnEffects) == "table", "Should return a table of effects")
    assertEquals(0, #endOfTurnEffects, "Current terrain abilities don't have end-of-turn effects")
    
    -- Test with no terrain
    local noTerrainEffects = TerrainAbilities.processEndOfTurnTerrainAbilities(surgeSurferPokemon, TerrainEffects.initializeTerrainState("test-battle-11"))
    assertEquals(0, #noTerrainEffects, "Should have no effects with no terrain")
    
    print("✓ End-of-turn terrain ability tests passed")
end

-- Test Suite 8: Edge Cases and Error Handling
local function testEdgeCases()
    print("Testing edge cases and error handling...")
    
    -- Test nil Pokemon
    local terrainType = TerrainAbilities.getTerrainFromAbility(nil)
    assertNil(terrainType, "Should handle nil Pokemon gracefully")
    
    -- Test Pokemon without ability
    local noAbilityPokemon = createMockPokemon(nil, Enums.ItemId.NONE, {Enums.PokemonType.NORMAL})
    terrainType = TerrainAbilities.getTerrainFromAbility(noAbilityPokemon)
    assertNil(terrainType, "Should handle Pokemon without ability")
    
    -- Test terrain surge with nil terrain state
    local electricSurgePokemon = createMockPokemon(Enums.AbilityId.ELECTRIC_SURGE, Enums.ItemId.NONE, {Enums.PokemonType.ELECTRIC})
    local updatedTerrain, message = TerrainAbilities.processTerrainSurgeAbility(electricSurgePokemon, nil)
    assertNil(updatedTerrain, "Should handle nil terrain state")
    assertNil(message, "Should return nil message for nil terrain state")
    
    -- Test stat modifier with invalid parameters
    local modifier = TerrainAbilities.getTerrainAbilityStatModifier(nil, nil, Enums.Stat.SPD)
    assertEquals(1.0, modifier, "Should return 1.0 for invalid parameters")
    
    -- Test duration modification with nil Pokemon
    local duration = TerrainAbilities.getModifiedTerrainDuration(nil, TerrainEffects.initializeTerrainState("test"), 5)
    assertEquals(5, duration, "Should return original duration for nil Pokemon")
    
    print("✓ Edge cases and error handling tests passed")
end

-- Main test runner
local function runAllTerrainAbilitiesTests()
    print("=== Running Terrain Abilities Unit Tests ===")
    
    local tests = {
        testTerrainSurgeAbilities,
        testTerrainSurgeActivation,
        testTerrainActivatedAbilities,
        testTerrainAbilityStatModifiers,
        testTerrainAbilityMessages,
        testTerrainDurationModifications,
        testTerrainAbilityInfo,
        testEndOfTurnTerrainAbilities,
        testEdgeCases
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
        print("🎉 All terrain abilities tests passed!")
    else
        error("Some terrain abilities tests failed")
    end
end

-- Export test functions
return {
    runAllTests = runAllTerrainAbilitiesTests,
    testTerrainSurgeAbilities = testTerrainSurgeAbilities,
    testTerrainSurgeActivation = testTerrainSurgeActivation,
    testTerrainActivatedAbilities = testTerrainActivatedAbilities,
    testTerrainAbilityStatModifiers = testTerrainAbilityStatModifiers,
    testTerrainAbilityMessages = testTerrainAbilityMessages,
    testTerrainDurationModifications = testTerrainDurationModifications,
    testTerrainAbilityInfo = testTerrainAbilityInfo,
    testEndOfTurnTerrainAbilities = testEndOfTurnTerrainAbilities,
    testEdgeCases = testEdgeCases
}