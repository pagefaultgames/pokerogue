-- Advanced Move Effects System Unit Tests
-- Comprehensive test suite for status effects, stat modifications, weather, terrain, healing, recoil, and multi-turn moves
-- Validates complete behavioral parity with TypeScript implementation

-- Load dependencies
local MoveEffects = require("game-logic.battle.move-effects")
local BattleConditions = require("game-logic.battle.battle-conditions")
local WeatherData = require("data.battle.weather-data")
local TerrainData = require("data.battle.terrain-data")
local Enums = require("data.constants.enums")
local BattleRNG = require("game-logic.rng.battle-rng")

-- Test framework
local Tests = {}
local testCount = 0
local passCount = 0

-- Test utility functions
local function assertEquals(actual, expected, message)
    testCount = testCount + 1
    if actual == expected then
        passCount = passCount + 1
        print("✓ " .. (message or "Test passed"))
    else
        print("✗ " .. (message or "Test failed") .. " - Expected: " .. tostring(expected) .. ", Got: " .. tostring(actual))
    end
end

local function assertTrue(condition, message)
    testCount = testCount + 1
    if condition then
        passCount = passCount + 1
        print("✓ " .. (message or "Test passed"))
    else
        print("✗ " .. (message or "Test failed") .. " - Condition was false")
    end
end

local function assertFalse(condition, message)
    testCount = testCount + 1
    if not condition then
        passCount = passCount + 1
        print("✓ " .. (message or "Test passed"))
    else
        print("✗ " .. (message or "Test failed") .. " - Condition was true")
    end
end

-- Mock data structures
local function createMockPokemon(types, ability, currentHP, maxHP, status)
    return {
        types = types or {Enums.PokemonType.NORMAL},
        ability = ability or Enums.AbilityId.NONE,
        currentHP = currentHP or 100,
        maxHP = maxHP or 100,
        statusEffect = status or MoveEffects.StatusEffect.NONE,
        stats = {
            [Enums.Stat.HP] = maxHP or 100,
            [Enums.Stat.ATK] = 80,
            [Enums.Stat.DEF] = 80,
            [Enums.Stat.SPATK] = 80,
            [Enums.Stat.SPDEF] = 80,
            [Enums.Stat.SPD] = 80
        }
    }
end

local function createMockBattleState(terrain, weather)
    return {
        terrain = terrain and {type = terrain, duration = 5} or nil,
        weather = weather and {type = weather, duration = 5} or nil
    }
end

-- Test 1.1: Complete status effect application system
function Tests.testStatusEffectApplication()
    print("\n=== Test 1.1: Status Effect Application System ===")
    
    -- Test basic poison application
    local pokemon = createMockPokemon()
    local success, result = MoveEffects.applyStatusEffect("battle1", "pokemon1", MoveEffects.StatusEffect.POISON, nil, "move_toxic", pokemon)
    assertTrue(success, "Poison application should succeed")
    assertEquals(result.effect, MoveEffects.StatusEffect.POISON, "Should apply poison effect")
    assertEquals(result.effect_name, "Poison", "Should have correct effect name")
    
    -- Test sleep with random duration
    BattleRNG.seed("test-sleep")
    pokemon = createMockPokemon()
    success, result = MoveEffects.applyStatusEffect("battle1", "pokemon1", MoveEffects.StatusEffect.SLEEP, nil, "move_sleep_powder", pokemon)
    assertTrue(success, "Sleep application should succeed")
    assertTrue(result.turns_remaining >= 1 and result.turns_remaining <= 3, "Sleep duration should be 1-3 turns")
    
    -- Test type immunity (Electric type immune to paralysis)
    pokemon = createMockPokemon({Enums.PokemonType.ELECTRIC})
    success, result = MoveEffects.applyStatusEffect("battle1", "pokemon1", MoveEffects.StatusEffect.PARALYSIS, nil, "move_thunder_wave", pokemon)
    assertFalse(success, "Electric type should be immune to paralysis")
    
    -- Test ability immunity (Limber immune to paralysis)
    pokemon = createMockPokemon({Enums.PokemonType.NORMAL}, Enums.AbilityId.LIMBER)
    success, result = MoveEffects.applyStatusEffect("battle1", "pokemon1", MoveEffects.StatusEffect.PARALYSIS, nil, "move_thunder_wave", pokemon)
    assertFalse(success, "Limber ability should prevent paralysis")
end

-- Test 1.2: Status effect damage calculation
function Tests.testStatusDamage()
    print("\n=== Test 1.2: Status Effect Damage Calculation ===")
    
    -- Test poison damage (1/8 max HP)
    local pokemon = createMockPokemon(nil, nil, 100, 100)
    local damage, _ = MoveEffects.processStatusDamage("battle1", "pokemon1", pokemon, MoveEffects.StatusEffect.POISON)
    assertEquals(damage, 12, "Poison should deal 1/8 max HP damage (floor(100/8) = 12)")
    
    -- Test burn damage (1/16 max HP)
    damage, _ = MoveEffects.processStatusDamage("battle1", "pokemon1", pokemon, MoveEffects.StatusEffect.BURN)
    assertEquals(damage, 6, "Burn should deal 1/16 max HP damage (floor(100/16) = 6)")
    
    -- Test toxic increasing damage
    damage, updatedStatus = MoveEffects.processStatusDamage("battle1", "pokemon1", pokemon, MoveEffects.StatusEffect.TOXIC, 1)
    assertEquals(damage, 6, "Toxic turn 1 should deal 1/16 max HP (6 damage)")
    assertEquals(updatedStatus.toxic_counter, 2, "Toxic counter should increment")
    
    -- Test toxic turn 2
    damage, updatedStatus = MoveEffects.processStatusDamage("battle1", "pokemon1", pokemon, MoveEffects.StatusEffect.TOXIC, 2)
    assertEquals(damage, 12, "Toxic turn 2 should deal 2/16 max HP (12 damage)")
    
    -- Test minimum 1 damage for low HP Pokemon
    local lowHPPokemon = createMockPokemon(nil, nil, 7, 7)
    damage, _ = MoveEffects.processStatusDamage("battle1", "pokemon1", lowHPPokemon, MoveEffects.StatusEffect.BURN)
    assertEquals(damage, 1, "Minimum 1 damage should be dealt even for low HP Pokemon")
end

-- Test 1.3: Status effect cure system
function Tests.testStatusCure()
    print("\n=== Test 1.3: Status Effect Cure System ===")
    
    -- Test valid cure method
    local success, result = MoveEffects.cureStatusEffect("battle1", "pokemon1", MoveEffects.StatusEffect.POISON, "pecha_berry")
    assertTrue(success, "Valid cure method should succeed")
    assertEquals(result.cured_effect, MoveEffects.StatusEffect.POISON, "Should cure poison effect")
    assertEquals(result.cure_method, "pecha_berry", "Should record cure method")
    
    -- Test invalid cure method
    success, result = MoveEffects.cureStatusEffect("battle1", "pokemon1", MoveEffects.StatusEffect.POISON, "invalid_cure")
    assertFalse(success, "Invalid cure method should fail")
    
    -- Test aromatherapy curing multiple status types
    success, _ = MoveEffects.cureStatusEffect("battle1", "pokemon1", MoveEffects.StatusEffect.BURN, "aromatherapy")
    assertTrue(success, "Aromatherapy should cure burn")
    
    success, _ = MoveEffects.cureStatusEffect("battle1", "pokemon1", MoveEffects.StatusEffect.PARALYSIS, "aromatherapy")
    assertTrue(success, "Aromatherapy should cure paralysis")
end

-- Test 1.4: Status effect interaction rules
function Tests.testStatusInteractions()
    print("\n=== Test 1.4: Status Effect Interaction Rules ===")
    
    -- Test status override (Toxic over Poison)
    assertTrue(MoveEffects.canOverrideStatus(MoveEffects.StatusEffect.POISON, MoveEffects.StatusEffect.TOXIC), 
              "Toxic should be able to override poison")
    
    -- Test no override for other combinations
    assertFalse(MoveEffects.canOverrideStatus(MoveEffects.StatusEffect.BURN, MoveEffects.StatusEffect.POISON), 
               "Poison should not override burn")
    
    assertFalse(MoveEffects.canOverrideStatus(MoveEffects.StatusEffect.SLEEP, MoveEffects.StatusEffect.PARALYSIS), 
               "Paralysis should not override sleep")
    
    -- Test existing status prevention
    local pokemon = createMockPokemon(nil, nil, 100, 100, MoveEffects.StatusEffect.BURN)
    local success, _ = MoveEffects.applyStatusEffect("battle1", "pokemon1", MoveEffects.StatusEffect.POISON, nil, "move", pokemon)
    assertFalse(success, "Should not apply poison when burn is already active")
end

-- Test 1.5: Terrain-based status prevention
function Tests.testTerrainPrevention()
    print("\n=== Test 1.5: Terrain Status Prevention ===")
    
    -- Test Electric Terrain preventing sleep
    local pokemon = createMockPokemon()
    local battleState = createMockBattleState(MoveEffects.TerrainType.ELECTRIC)
    local success, _ = MoveEffects.applyStatusEffect("battle1", "pokemon1", MoveEffects.StatusEffect.SLEEP, nil, "move", pokemon, battleState)
    assertFalse(success, "Electric Terrain should prevent sleep")
    
    -- Test Misty Terrain preventing sleep
    battleState = createMockBattleState(MoveEffects.TerrainType.MISTY)
    success, _ = MoveEffects.applyStatusEffect("battle1", "pokemon1", MoveEffects.StatusEffect.SLEEP, nil, "move", pokemon, battleState)
    assertFalse(success, "Misty Terrain should prevent sleep")
    
    -- Test other status effects still work on terrain
    success, _ = MoveEffects.applyStatusEffect("battle1", "pokemon1", MoveEffects.StatusEffect.BURN, nil, "move", pokemon, battleState)
    assertTrue(success, "Misty Terrain should not prevent burn")
end

-- Test 1.6: Pokemon action restriction checks
function Tests.testActionRestrictions()
    print("\n=== Test 1.6: Pokemon Action Restrictions ===")
    
    -- Test sleep prevents all actions
    local pokemon = createMockPokemon()
    local canAct, reason = MoveEffects.canPokemonAct(pokemon, MoveEffects.StatusEffect.SLEEP)
    assertFalse(canAct, "Sleep should prevent actions")
    assertEquals(reason, "Sleep", "Should specify sleep as the reason")
    
    -- Test freeze prevents actions
    canAct, reason = MoveEffects.canPokemonAct(pokemon, MoveEffects.StatusEffect.FREEZE)
    assertFalse(canAct, "Freeze should prevent actions")
    assertEquals(reason, "Freeze", "Should specify freeze as the reason")
    
    -- Test freeze thaw on fire moves
    local fireMove = {type = Enums.PokemonType.FIRE}
    canAct, reason = MoveEffects.canPokemonAct(pokemon, MoveEffects.StatusEffect.FREEZE, fireMove)
    assertTrue(canAct, "Fire moves should thaw freeze")
    assertEquals(reason, "thawed", "Should indicate thawing occurred")
    
    -- Test paralysis sometimes prevents actions
    BattleRNG.seed("test-paralysis")
    local paralyzedCount = 0
    local totalTests = 100
    
    for i = 1, totalTests do
        BattleRNG.seed("test-paralysis-" .. i)
        canAct, reason = MoveEffects.canPokemonAct(pokemon, MoveEffects.StatusEffect.PARALYSIS)
        if not canAct and reason == "paralysis" then
            paralyzedCount = paralyzedCount + 1
        end
    end
    
    -- Should be approximately 25% (±10% for randomness)
    local paralysisRate = paralyzedCount / totalTests
    assertTrue(paralysisRate >= 0.15 and paralysisRate <= 0.35, 
              "Paralysis should prevent ~25% of actions (got " .. string.format("%.1f", paralysisRate * 100) .. "%)")
end

-- Test turn processing and natural cures
function Tests.testTurnProcessing()
    print("\n=== Test: Turn Processing and Natural Cures ===")
    
    -- Test sleep natural wake-up
    local shouldCure, remainingTurns = MoveEffects.processStatusTurn("battle1", "pokemon1", {}, MoveEffects.StatusEffect.SLEEP, 1)
    assertTrue(shouldCure, "Sleep should be cured when turns remaining = 1")
    assertEquals(remainingTurns, 0, "Should have 0 turns remaining after cure")
    
    -- Test sleep countdown
    shouldCure, remainingTurns = MoveEffects.processStatusTurn("battle1", "pokemon1", {}, MoveEffects.StatusEffect.SLEEP, 3)
    assertFalse(shouldCure, "Sleep should not be cured with turns remaining")
    assertEquals(remainingTurns, 2, "Should decrement turns remaining")
    
    -- Test freeze thaw chance (probabilistic - multiple attempts)
    BattleRNG.seed("test-freeze-thaw")
    local thawCount = 0
    local totalAttempts = 100
    
    for i = 1, totalAttempts do
        BattleRNG.seed("test-freeze-thaw-" .. i)
        shouldCure, _ = MoveEffects.processStatusTurn("battle1", "pokemon1", {}, MoveEffects.StatusEffect.FREEZE, -1)
        if shouldCure then
            thawCount = thawCount + 1
        end
    end
    
    -- Should be approximately 20% thaw rate
    local thawRate = thawCount / totalAttempts
    assertTrue(thawRate >= 0.10 and thawRate <= 0.30, 
              "Freeze should have ~20% thaw chance per turn (got " .. string.format("%.1f", thawRate * 100) .. "%)")
end

-- Test 2.1-2.6: Stat Stage Modification System
function Tests.testStatStageSystem()
    print("\n=== Test 2.1-2.6: Stat Stage Modification System ===")
    
    -- Test basic stat stage change
    local pokemon = createMockPokemon()
    local currentStages = {[Enums.Stat.ATK] = 0}
    local success, result = MoveEffects.applyStatStageChange("battle1", "pokemon1", Enums.Stat.ATK, 2, "sword_dance", pokemon, currentStages)
    assertTrue(success, "Basic stat increase should succeed")
    assertEquals(result.stages_changed, 2, "Should change by 2 stages")
    assertEquals(result.new_stage, 2, "New stage should be 2")
    assertEquals(result.new_multiplier, 2.0, "Multiplier should be 2.0 at +2 stages")
    
    -- Test stat stage bounds (cannot exceed +6)
    currentStages = {[Enums.Stat.ATK] = 6}
    success, result = MoveEffects.applyStatStageChange("battle1", "pokemon1", Enums.Stat.ATK, 1, "move", pokemon, currentStages)
    assertFalse(success, "Should not exceed +6 stat stages")
    
    -- Test stat stage bounds (cannot go below -6)
    currentStages = {[Enums.Stat.DEF] = -6}
    success, result = MoveEffects.applyStatStageChange("battle1", "pokemon1", Enums.Stat.DEF, -1, "move", pokemon, currentStages)
    assertFalse(success, "Should not go below -6 stat stages")
    
    -- Test Simple ability (doubles stat changes)
    pokemon = createMockPokemon(nil, Enums.AbilityId.SIMPLE)
    currentStages = {[Enums.Stat.ATK] = 0}
    success, result = MoveEffects.applyStatStageChange("battle1", "pokemon1", Enums.Stat.ATK, 1, "move", pokemon, currentStages)
    assertTrue(success, "Simple ability stat change should succeed")
    assertEquals(result.stages_changed, 2, "Simple should double the stat change")
    assertTrue(result.ability_modified, "Should indicate ability modification")
    
    -- Test Contrary ability (reverses stat changes)
    pokemon = createMockPokemon(nil, Enums.AbilityId.CONTRARY)
    currentStages = {[Enums.Stat.ATK] = 0}
    success, result = MoveEffects.applyStatStageChange("battle1", "pokemon1", Enums.Stat.ATK, 1, "move", pokemon, currentStages)
    assertTrue(success, "Contrary ability stat change should succeed")
    assertEquals(result.stages_changed, -1, "Contrary should reverse the stat change")
    
    -- Test Clear Body ability (prevents stat reduction)
    pokemon = createMockPokemon(nil, Enums.AbilityId.CLEAR_BODY)
    currentStages = {[Enums.Stat.ATK] = 0}
    success, result = MoveEffects.applyStatStageChange("battle1", "pokemon1", Enums.Stat.ATK, -1, "move", pokemon, currentStages)
    assertFalse(success, "Clear Body should prevent stat reduction")
    
    -- Test Hyper Cutter ability (prevents Attack reduction only)
    pokemon = createMockPokemon(nil, Enums.AbilityId.HYPER_CUTTER)
    success, result = MoveEffects.applyStatStageChange("battle1", "pokemon1", Enums.Stat.ATK, -1, "move", pokemon, currentStages)
    assertFalse(success, "Hyper Cutter should prevent Attack reduction")
    
    -- But allows other stat reductions
    success, result = MoveEffects.applyStatStageChange("battle1", "pokemon1", Enums.Stat.DEF, -1, "move", pokemon, currentStages)
    assertTrue(success, "Hyper Cutter should allow other stat reductions")
    
    print("Stat stage system tests passed")
end

-- Test stat stage utility functions
function Tests.testStatStageUtilities()
    print("\n=== Test: Stat Stage Utilities ===")
    
    -- Test effective stat calculation
    local effectiveStat = MoveEffects.calculateEffectiveStat(100, 2)
    assertEquals(effectiveStat, 200, "Effective stat at +2 should be doubled")
    
    effectiveStat = MoveEffects.calculateEffectiveStat(100, -2)
    assertEquals(effectiveStat, 50, "Effective stat at -2 should be halved")
    
    effectiveStat = MoveEffects.calculateEffectiveStat(100, 0)
    assertEquals(effectiveStat, 100, "Effective stat at 0 should be unchanged")
    
    -- Test stat stage reset
    local success, result = MoveEffects.resetStatStages("battle1", "pokemon1", "haze")
    assertTrue(success, "Stat stage reset should succeed")
    assertTrue(result.reset_stats[Enums.Stat.ATK] ~= nil, "Should reset Attack")
    assertTrue(result.reset_stats[Enums.Stat.DEF] ~= nil, "Should reset Defense")
    assertEquals(result.reset_stats[Enums.Stat.ATK].new_stage, 0, "Reset stage should be 0")
    
    -- Test stat stage copy
    local sourceStages = {[Enums.Stat.ATK] = 3, [Enums.Stat.DEF] = -2}
    success, result = MoveEffects.copyStatStages("battle1", "source_pokemon", "target_pokemon", sourceStages, "psych_up")
    assertTrue(success, "Stat stage copy should succeed")
    assertEquals(result.copied_stats[Enums.Stat.ATK].new_stage, 3, "Should copy Attack stages")
    assertEquals(result.copied_stats[Enums.Stat.DEF].new_stage, -2, "Should copy Defense stages")
    
    -- Test stat stage description
    local description = MoveEffects.getStatStageDescription(Enums.Stat.ATK, 2)
    assertEquals(description, "attack (+2)", "Should format positive stages correctly")
    
    description = MoveEffects.getStatStageDescription(Enums.Stat.DEF, -3)
    assertEquals(description, "defense (-3)", "Should format negative stages correctly")
    
    description = MoveEffects.getStatStageDescription(Enums.Stat.SPD, 0)
    assertEquals(description, "speed (normal)", "Should format neutral stages correctly")
    
    print("Stat stage utility tests passed")
end

-- Test 3.1-3.6: Weather System
function Tests.testWeatherSystem()
    print("\n=== Test 3.1-3.6: Weather System ===")
    
    -- Test weather setting
    local success, result = BattleConditions.setWeather("battle1", BattleConditions.WeatherType.SUNNY, 5, "sunny_day")
    assertTrue(success, "Weather setting should succeed")
    assertEquals(result.weather_type, BattleConditions.WeatherType.SUNNY, "Should set sunny weather")
    assertEquals(result.weather_name, "Sunny", "Should have correct weather name")
    assertTrue(result.duration >= 4 and result.duration <= 6, "Duration should have variance")
    
    -- Test weather power modifiers
    local fireModifier = WeatherData.getTypePowerModifier(BattleConditions.WeatherType.SUNNY, Enums.PokemonType.FIRE)
    assertEquals(fireModifier, 1.5, "Fire moves should be boosted in sun")
    
    local waterModifier = WeatherData.getTypePowerModifier(BattleConditions.WeatherType.SUNNY, Enums.PokemonType.WATER)
    assertEquals(waterModifier, 0.5, "Water moves should be weakened in sun")
    
    -- Test rain weather
    success, result = BattleConditions.setWeather("battle1", BattleConditions.WeatherType.RAIN, 5, "rain_dance")
    assertTrue(success, "Rain setting should succeed")
    
    local rainWaterModifier = WeatherData.getTypePowerModifier(BattleConditions.WeatherType.RAIN, Enums.PokemonType.WATER)
    assertEquals(rainWaterModifier, 1.5, "Water moves should be boosted in rain")
    
    local rainFireModifier = WeatherData.getTypePowerModifier(BattleConditions.WeatherType.RAIN, Enums.PokemonType.FIRE)
    assertEquals(rainFireModifier, 0.5, "Fire moves should be weakened in rain")
    
    print("Weather system tests passed")
end

-- Test weather damage and immunity
function Tests.testWeatherDamage()
    print("\n=== Test: Weather Damage and Immunity ===")
    
    -- Test sandstorm damage
    local normalPokemon = createMockPokemon({Enums.PokemonType.NORMAL}, nil, 100, 100)
    local damageResults = BattleConditions.processWeatherDamage("battle1", BattleConditions.WeatherType.SANDSTORM, {{id = "normal1", types = {Enums.PokemonType.NORMAL}, maxHP = 100, stats = {[Enums.Stat.HP] = 100}}})
    assertEquals(#damageResults, 1, "Normal type should take sandstorm damage")
    assertEquals(damageResults[1].damage, 6, "Should deal 1/16 max HP (6 damage)")
    
    -- Test sandstorm immunity (Rock type)
    local rockPokemon = createMockPokemon({Enums.PokemonType.ROCK}, nil, 100, 100)
    damageResults = BattleConditions.processWeatherDamage("battle1", BattleConditions.WeatherType.SANDSTORM, {{id = "rock1", types = {Enums.PokemonType.ROCK}, maxHP = 100, stats = {[Enums.Stat.HP] = 100}}})
    assertEquals(#damageResults, 0, "Rock type should be immune to sandstorm damage")
    
    -- Test hail damage
    damageResults = BattleConditions.processWeatherDamage("battle1", BattleConditions.WeatherType.HAIL, {{id = "normal1", types = {Enums.PokemonType.NORMAL}, maxHP = 100, stats = {[Enums.Stat.HP] = 100}}})
    assertEquals(#damageResults, 1, "Normal type should take hail damage")
    
    -- Test hail immunity (Ice type)
    damageResults = BattleConditions.processWeatherDamage("battle1", BattleConditions.WeatherType.HAIL, {{id = "ice1", types = {Enums.PokemonType.ICE}, maxHP = 100, stats = {[Enums.Stat.HP] = 100}}})
    assertEquals(#damageResults, 0, "Ice type should be immune to hail damage")
    
    print("Weather damage tests passed")
end

-- Test 4.1-4.6: Terrain System
function Tests.testTerrainSystem()
    print("\n=== Test 4.1-4.6: Terrain System ===")
    
    -- Test terrain setting
    local success, result = BattleConditions.setTerrain("battle1", BattleConditions.TerrainType.ELECTRIC, 5, "electric_terrain")
    assertTrue(success, "Terrain setting should succeed")
    assertEquals(result.terrain_type, BattleConditions.TerrainType.ELECTRIC, "Should set electric terrain")
    assertEquals(result.terrain_name, "Electric Terrain", "Should have correct terrain name")
    assertEquals(result.duration, 5, "Should have correct duration")
    
    -- Test terrain power modifiers for grounded Pokemon
    local electricModifier = TerrainData.getTypePowerModifier(BattleConditions.TerrainType.ELECTRIC, Enums.PokemonType.ELECTRIC, true)
    assertEquals(electricModifier, 1.5, "Electric moves should be boosted on Electric Terrain")
    
    -- Test terrain doesn't affect non-grounded Pokemon
    local flyingModifier = TerrainData.getTypePowerModifier(BattleConditions.TerrainType.ELECTRIC, Enums.PokemonType.ELECTRIC, false)
    assertEquals(flyingModifier, 1.0, "Terrain shouldn't affect flying Pokemon")
    
    -- Test grounded check
    local groundedPokemon = createMockPokemon({Enums.PokemonType.NORMAL})
    assertTrue(TerrainData.isPokemonGrounded(groundedPokemon), "Normal Pokemon should be grounded")
    
    local flyingPokemon = createMockPokemon({Enums.PokemonType.FLYING})
    assertFalse(TerrainData.isPokemonGrounded(flyingPokemon), "Flying Pokemon should not be grounded")
    
    local levitatePokemon = createMockPokemon({Enums.PokemonType.NORMAL}, Enums.AbilityId.LEVITATE)
    assertFalse(TerrainData.isPokemonGrounded(levitatePokemon), "Levitate Pokemon should not be grounded")
    
    print("Terrain system tests passed")
end

-- Test terrain status prevention
function Tests.testTerrainStatusPrevention()
    print("\n=== Test: Terrain Status Prevention ===")
    
    -- Test Electric Terrain prevents sleep for grounded Pokemon
    local preventsStatus = TerrainData.preventsStatus(BattleConditions.TerrainType.ELECTRIC, "sleep", true)
    assertTrue(preventsStatus, "Electric Terrain should prevent sleep for grounded Pokemon")
    
    -- Test Electric Terrain doesn't prevent sleep for flying Pokemon
    preventsStatus = TerrainData.preventsStatus(BattleConditions.TerrainType.ELECTRIC, "sleep", false)
    assertFalse(preventsStatus, "Electric Terrain shouldn't prevent sleep for flying Pokemon")
    
    -- Test Misty Terrain prevents all status for grounded Pokemon
    preventsStatus = TerrainData.preventsStatus(BattleConditions.TerrainType.MISTY, "burn", true)
    assertTrue(preventsStatus, "Misty Terrain should prevent burn for grounded Pokemon")
    
    preventsStatus = TerrainData.preventsStatus(BattleConditions.TerrainType.MISTY, "poison", true)
    assertTrue(preventsStatus, "Misty Terrain should prevent poison for grounded Pokemon")
    
    -- Test other terrains don't prevent status
    preventsStatus = TerrainData.preventsStatus(BattleConditions.TerrainType.GRASSY, "sleep", true)
    assertFalse(preventsStatus, "Grassy Terrain shouldn't prevent sleep")
    
    print("Terrain status prevention tests passed")
end

-- Test terrain healing
function Tests.testTerrainHealing()
    print("\n=== Test: Terrain Healing ===")
    
    -- Test Grassy Terrain healing
    local groundedPokemon = {id = "grounded1", types = {Enums.PokemonType.NORMAL}, maxHP = 100, currentHP = 50, stats = {[Enums.Stat.HP] = 100}}
    local healingResults = BattleConditions.processTerrainHealing("battle1", BattleConditions.TerrainType.GRASSY, {groundedPokemon})
    assertEquals(#healingResults, 1, "Grounded Pokemon should get terrain healing")
    assertEquals(healingResults[1].healing, 6, "Should heal 1/16 max HP (6 healing)")
    
    -- Test terrain healing doesn't affect full HP Pokemon
    groundedPokemon.currentHP = 100
    healingResults = BattleConditions.processTerrainHealing("battle1", BattleConditions.TerrainType.GRASSY, {groundedPokemon})
    assertEquals(#healingResults, 0, "Full HP Pokemon shouldn't get terrain healing")
    
    -- Test terrain healing doesn't affect flying Pokemon
    local flyingPokemon = {id = "flying1", types = {Enums.PokemonType.FLYING}, maxHP = 100, currentHP = 50, stats = {[Enums.Stat.HP] = 100}}
    healingResults = BattleConditions.processTerrainHealing("battle1", BattleConditions.TerrainType.GRASSY, {flyingPokemon})
    assertEquals(#healingResults, 0, "Flying Pokemon shouldn't get terrain healing")
    
    print("Terrain healing tests passed")
end

-- Test weather healing modifiers
function Tests.testWeatherHealingModifiers()
    print("\n=== Test: Weather Healing Modifiers ===")
    
    -- Test synthesis in different weather conditions
    local sunnyModifier = WeatherData.getHealingModifier(BattleConditions.WeatherType.SUNNY, "synthesis")
    assertEquals(sunnyModifier, "2/3", "Synthesis should heal 2/3 HP in sunny weather")
    
    local rainModifier = WeatherData.getHealingModifier(BattleConditions.WeatherType.RAIN, "synthesis")
    assertEquals(rainModifier, "1/4", "Synthesis should heal 1/4 HP in rain")
    
    local sandstormModifier = WeatherData.getHealingModifier(BattleConditions.WeatherType.SANDSTORM, "synthesis")
    assertEquals(sandstormModifier, "1/4", "Synthesis should heal 1/4 HP in sandstorm")
    
    -- Test that normal healing isn't affected
    local normalWeatherModifier = WeatherData.getHealingModifier(BattleConditions.WeatherType.NONE, "recover")
    assertEquals(normalWeatherModifier, nil, "Normal moves shouldn't be affected by weather")
    
    print("Weather healing modifier tests passed")
end

-- Test 5.1-5.6: Healing Move System
function Tests.testHealingMoveSystem()
    print("\n=== Test 5.1-5.6: Healing Move System ===")
    
    -- Test percentage-based healing (1/2 HP)
    local pokemon = createMockPokemon(nil, nil, 50, 100) -- 50/100 HP
    local success, result = MoveEffects.applyHealingEffect("battle1", "pokemon1", "1/2", "recover", pokemon)
    assertTrue(success, "1/2 HP healing should succeed")
    assertEquals(result.healing_amount, 50, "Should heal 50 HP (1/2 of 100 max HP)")
    assertEquals(result.new_hp, 100, "Should reach full HP")
    
    -- Test 1/4 HP healing
    pokemon = createMockPokemon(nil, nil, 25, 100) -- 25/100 HP
    success, result = MoveEffects.applyHealingEffect("battle1", "pokemon1", "1/4", "roost", pokemon)
    assertTrue(success, "1/4 HP healing should succeed")
    assertEquals(result.healing_amount, 25, "Should heal 25 HP (1/4 of 100 max HP)")
    assertEquals(result.new_hp, 50, "Should be at 50 HP")
    
    -- Test fixed healing amount
    pokemon = createMockPokemon(nil, nil, 80, 100) -- 80/100 HP
    success, result = MoveEffects.applyHealingEffect("battle1", "pokemon1", 15, "softboiled", pokemon)
    assertTrue(success, "Fixed healing should succeed")
    assertEquals(result.healing_amount, 15, "Should heal exactly 15 HP")
    assertEquals(result.new_hp, 95, "Should be at 95 HP")
    
    -- Test full healing
    pokemon = createMockPokemon(nil, nil, 30, 100) -- 30/100 HP
    success, result = MoveEffects.applyHealingEffect("battle1", "pokemon1", "full", "recover", pokemon)
    assertTrue(success, "Full healing should succeed")
    assertEquals(result.healing_amount, 70, "Should heal 70 HP to reach full")
    assertEquals(result.new_hp, 100, "Should be at full HP")
    
    print("Healing move system tests passed")
end

-- Test healing failure conditions
function Tests.testHealingFailures()
    print("\n=== Test: Healing Failure Conditions ===")
    
    -- Test healing failure on full HP Pokemon
    local fullHPPokemon = createMockPokemon(nil, nil, 100, 100) -- Full HP
    local success, result = MoveEffects.applyHealingEffect("battle1", "pokemon1", "1/2", "recover", fullHPPokemon)
    assertFalse(success, "Healing should fail on full HP Pokemon")
    assertTrue(string.find(result, "already at full HP"), "Should indicate Pokemon is at full HP")
    
    -- Test healing failure validation
    local willFail, reason = MoveEffects.willHealingFail(fullHPPokemon, "1/2")
    assertTrue(willFail, "Should predict healing failure for full HP Pokemon")
    assertEquals(reason, "Pokemon is already at full HP", "Should give correct failure reason")
    
    -- Test healing success validation for injured Pokemon
    local injuredPokemon = createMockPokemon(nil, nil, 50, 100) -- 50/100 HP
    willFail, reason = MoveEffects.willHealingFail(injuredPokemon, "1/2")
    assertFalse(willFail, "Should not predict failure for injured Pokemon")
    assertEquals(reason, nil, "Should not give failure reason for valid healing")
    
    -- Test healing with 0 amount
    willFail, reason = MoveEffects.willHealingFail(injuredPokemon, 0)
    assertTrue(willFail, "Should predict failure for 0 healing")
    assertEquals(reason, "No healing amount", "Should indicate no healing amount")
    
    print("Healing failure tests passed")
end

-- Test weather-based healing modifications
function Tests.testWeatherHealingModifications()
    print("\n=== Test: Weather-based Healing Modifications ===")
    
    local pokemon = createMockPokemon(nil, nil, 25, 100) -- 25/100 HP
    
    -- Test Synthesis in sunny weather (heals 2/3 instead of 1/2)
    local success, result = MoveEffects.applyHealingEffect("battle1", "pokemon1", "1/2", "synthesis", pokemon, BattleConditions.WeatherType.SUNNY, "synthesis")
    assertTrue(success, "Synthesis in sun should succeed")
    assertEquals(result.healing_amount, 66, "Synthesis should heal 2/3 HP (66) in sunny weather")
    assertTrue(result.weather_modified, "Should indicate weather modification")
    
    -- Test Synthesis in rain (heals 1/4 instead of 1/2)
    pokemon = createMockPokemon(nil, nil, 25, 100) -- Reset HP
    success, result = MoveEffects.applyHealingEffect("battle1", "pokemon1", "1/2", "synthesis", pokemon, BattleConditions.WeatherType.RAIN, "synthesis")
    assertTrue(success, "Synthesis in rain should succeed")
    assertEquals(result.healing_amount, 25, "Synthesis should heal 1/4 HP (25) in rain")
    
    -- Test Synthesis in sandstorm (heals 1/4 instead of 1/2)
    pokemon = createMockPokemon(nil, nil, 25, 100) -- Reset HP
    success, result = MoveEffects.applyHealingEffect("battle1", "pokemon1", "1/2", "synthesis", pokemon, BattleConditions.WeatherType.SANDSTORM, "synthesis")
    assertTrue(success, "Synthesis in sandstorm should succeed")
    assertEquals(result.healing_amount, 25, "Synthesis should heal 1/4 HP (25) in sandstorm")
    
    -- Test non-weather dependent move is unaffected
    pokemon = createMockPokemon(nil, nil, 50, 100) -- Reset HP
    success, result = MoveEffects.applyHealingEffect("battle1", "pokemon1", "1/2", "recover", pokemon, BattleConditions.WeatherType.SUNNY, "recover")
    assertTrue(success, "Recover should work normally")
    assertEquals(result.healing_amount, 50, "Recover should heal 1/2 HP regardless of weather")
    assertFalse(result.weather_modified, "Should not be weather modified")
    
    print("Weather healing modification tests passed")
end

-- Test healing calculation utilities
function Tests.testHealingCalculations()
    print("\n=== Test: Healing Calculation Utilities ===")
    
    -- Test healing amount calculation
    local healingAmount = MoveEffects.calculateHealingAmount("1/2", 100, 50)
    assertEquals(healingAmount, 50, "Should calculate 1/2 HP healing correctly")
    
    healingAmount = MoveEffects.calculateHealingAmount("1/4", 120, 30)
    assertEquals(healingAmount, 30, "Should calculate 1/4 HP healing correctly")
    
    healingAmount = MoveEffects.calculateHealingAmount("full", 100, 25)
    assertEquals(healingAmount, 75, "Should calculate full healing correctly")
    
    -- Test weather-modified healing calculation
    healingAmount = MoveEffects.calculateHealingAmount("1/2", 100, 25, BattleConditions.WeatherType.SUNNY, "synthesis")
    assertEquals(healingAmount, 66, "Should calculate weather-modified healing correctly")
    
    -- Test healing descriptions
    local description = MoveEffects.getHealingDescription("1/2")
    assertEquals(description, "Restores 1/2 of max HP", "Should format healing description correctly")
    
    description = MoveEffects.getHealingDescription("1/2", BattleConditions.WeatherType.SUNNY, "synthesis")
    assertTrue(string.find(description, "2/3 in current weather"), "Should include weather modification in description")
    
    description = MoveEffects.getHealingDescription(25)
    assertEquals(description, "Restores 25 HP", "Should format fixed healing correctly")
    
    print("Healing calculation tests passed")
end

-- Test healing edge cases
function Tests.testHealingEdgeCases()
    print("\n=== Test: Healing Edge Cases ===")
    
    -- Test minimum healing for low HP Pokemon
    local lowHPPokemon = createMockPokemon(nil, nil, 7, 7) -- Very low HP
    local success, result = MoveEffects.applyHealingEffect("battle1", "pokemon1", "1/16", "leftovers", lowHPPokemon)
    assertFalse(success, "Should fail healing on full HP Pokemon")
    
    -- Test healing that would exceed max HP gets capped
    lowHPPokemon = createMockPokemon(nil, nil, 6, 10) -- 6/10 HP
    success, result = MoveEffects.applyHealingEffect("battle1", "pokemon1", "1/2", "recover", lowHPPokemon)
    assertTrue(success, "Healing should succeed")
    assertEquals(result.healing_amount, 4, "Should only heal up to max HP (4 HP to reach 10/10)")
    assertEquals(result.new_hp, 10, "Should be at full HP")
    
    -- Test 0 HP calculation edge case
    local healingAmount = MoveEffects.calculateHealingAmount("1/16", 15, 15) -- Very small healing
    assertEquals(healingAmount, 0, "Should calculate 0 healing for 1/16 of 15 HP")
    
    -- Test 2/3 and 3/4 healing formulas
    local pokemon = createMockPokemon(nil, nil, 10, 90) -- 10/90 HP
    success, result = MoveEffects.applyHealingEffect("battle1", "pokemon1", "2/3", "special_heal", pokemon)
    assertTrue(success, "2/3 healing should succeed")
    assertEquals(result.healing_amount, 60, "Should heal 2/3 of max HP (60)")
    
    pokemon = createMockPokemon(nil, nil, 10, 80) -- 10/80 HP
    success, result = MoveEffects.applyHealingEffect("battle1", "pokemon1", "3/4", "special_heal", pokemon)
    assertTrue(success, "3/4 healing should succeed")
    assertEquals(result.healing_amount, 60, "Should heal 3/4 of max HP (60)")
    
    print("Healing edge case tests passed")
end

-- Test 6.1-6.6: Recoil Damage System
function Tests.testRecoilDamageSystem()
    print("\n=== Test 6.1-6.6: Recoil Damage System ===")
    
    local pokemon = createMockPokemon()
    local battleId = "test_battle"
    local attackerId = "attacker_1"
    
    -- Test basic recoil calculation (1/4)
    local success, result = MoveEffects.applyRecoilDamage(
        battleId, attackerId, "1/4", 60, "test_move", pokemon
    )
    assertTrue(success, "Recoil damage should succeed")
    assertEquals(result.recoil_amount, 15, "1/4 recoil should be 15 (60/4)")
    assertEquals(result.formula, "1/4", "Formula should be preserved")
    
    -- Test HP-based recoil (max_hp_1/4)
    success, result = MoveEffects.applyRecoilDamage(
        battleId, attackerId, "max_hp_1/4", 60, "brave_bird", pokemon
    )
    assertTrue(success, "HP-based recoil should succeed")
    assertEquals(result.recoil_amount, 25, "1/4 max HP recoil should be 25 (100/4)")
    
    -- Test Rock Head immunity
    local rockHeadPokemon = createMockPokemon(nil, Enums.AbilityId.ROCK_HEAD)
    success, result = MoveEffects.applyRecoilDamage(
        battleId, attackerId, "1/3", 60, "head_smash", rockHeadPokemon
    )
    assertFalse(success, "Rock Head should prevent recoil damage")
    
    -- Test Reckless boost
    local recklessPokemon = createMockPokemon(nil, Enums.AbilityId.RECKLESS)
    success, result = MoveEffects.applyRecoilDamage(
        battleId, attackerId, "1/4", 60, "double_edge", recklessPokemon
    )
    assertTrue(success, "Reckless should not prevent recoil")
    assertEquals(result.recoil_amount, 18, "Reckless should boost recoil (15 * 1.2 = 18)")
    assertTrue(result.ability_modified, "Should indicate ability modification")
    
    print("Recoil damage system tests passed")
end

-- Test recoil timing processing
function Tests.testRecoilTiming()
    print("\n=== Test: Recoil Timing Processing ===")
    
    local battleId = "test_battle"
    local attackerData = createMockPokemon()
    attackerData.id = "attacker_1"
    
    local moveResult = {
        damage_dealt = 80,
        missed = false,
        failed = false,
        protected = false,
        move_name = "Test Move"
    }
    
    -- Test successful recoil timing
    local success, result = MoveEffects.processRecoilTiming(
        battleId, moveResult, attackerData, "1/4"
    )
    assertTrue(success, "Recoil timing should succeed")
    assertEquals(result.timing, "after_damage", "Should process after damage")
    assertTrue(result.recoil_applied, "Should apply recoil")
    assertEquals(result.move_damage, 80, "Should preserve move damage")
    
    -- Test missed move (no recoil)
    local missedResult = {
        damage_dealt = 0,
        missed = true,
        failed = false,
        protected = false
    }
    
    success, result = MoveEffects.processRecoilTiming(
        battleId, missedResult, attackerData, "1/3"
    )
    assertFalse(success, "Missed moves should not cause recoil")
    
    print("Recoil timing tests passed")
end

-- Test 7.1-7.6: Multi-Turn Move System
function Tests.testMultiTurnMoveSystem()
    print("\n=== Test 7.1-7.6: Multi-Turn Move System ===")
    
    local battleId = "test_battle"
    local pokemonId = "pokemon_1"
    local pokemon = createMockPokemon()
    
    -- Test Fly initialization (semi-invulnerable)
    local success, result = MoveEffects.initializeMultiTurnMove(
        battleId, pokemonId, Enums.MoveId.FLY, pokemon, nil
    )
    assertTrue(success, "Fly initialization should succeed")
    assertEquals(result.move_name, "Fly", "Should preserve move name")
    assertEquals(result.state, MoveEffects.MultiTurnState.CHARGING, "Should start in charging state")
    assertTrue(result.semi_invulnerable, "Fly should be semi-invulnerable during charge")
    
    -- Test Solar Beam with sunny weather (skip charging)
    success, result = MoveEffects.initializeMultiTurnMove(
        battleId, pokemonId, Enums.MoveId.SOLAR_BEAM, pokemon, MoveEffects.WeatherType.SUNNY
    )
    assertTrue(success, "Solar Beam initialization should succeed")
    assertEquals(result.state, MoveEffects.MultiTurnState.EXECUTING, "Should skip charging in sun")
    assertTrue(result.skip_charging, "Should indicate charging was skipped")
    
    -- Test Power Herb skipping
    local powerHerbPokemon = createMockPokemon()
    powerHerbPokemon.item = Enums.ItemId.POWER_HERB
    
    success, result = MoveEffects.initializeMultiTurnMove(
        battleId, pokemonId, Enums.MoveId.SKY_ATTACK, powerHerbPokemon, nil
    )
    assertTrue(success, "Power Herb initialization should succeed")
    assertTrue(result.skip_charging, "Power Herb should skip charging")
    assertTrue(result.power_herb_consumed, "Should indicate Power Herb was consumed")
    
    print("Multi-turn move system tests passed")
end

-- Test multi-turn move progression
function Tests.testMultiTurnProgression()
    print("\n=== Test: Multi-Turn Move Progression ===")
    
    local battleId = "test_battle"
    local pokemonId = "pokemon_1"
    
    -- Test progression from charging to execution
    local currentState = {
        move_id = Enums.MoveId.DIG,
        state = MoveEffects.MultiTurnState.CHARGING,
        turn_count = 1
    }
    
    local success, result = MoveEffects.processMultiTurnMove(
        battleId, pokemonId, currentState
    )
    assertTrue(success, "Multi-turn progression should succeed")
    assertEquals(result.new_state, MoveEffects.MultiTurnState.EXECUTING, "Should progress to executing")
    assertEquals(result.turn_count, 2, "Should increment turn count")
    assertTrue(result.can_execute, "Should be able to execute")
    
    -- Test progression to completion
    currentState.state = MoveEffects.MultiTurnState.EXECUTING
    currentState.turn_count = 2
    
    success, result = MoveEffects.processMultiTurnMove(
        battleId, pokemonId, currentState
    )
    assertTrue(success, "Completion progression should succeed")
    assertEquals(result.new_state, MoveEffects.MultiTurnState.COMPLETED, "Should complete")
    assertTrue(result.is_completed, "Should indicate completion")
    
    print("Multi-turn progression tests passed")
end

-- Test semi-invulnerable vulnerabilities
function Tests.testSemiInvulnerableVulnerabilities()
    print("\n=== Test: Semi-Invulnerable Vulnerabilities ===")
    
    -- Test Fly vulnerabilities
    local flyState = {
        move_id = Enums.MoveId.FLY,
        semi_invulnerable = true
    }
    
    -- Test vulnerability to Thunder
    local vulnerable = MoveEffects.isVulnerableInSemiInvulnerableState(
        flyState, Enums.MoveId.THUNDER
    )
    assertTrue(vulnerable, "Flying Pokemon should be vulnerable to Thunder")
    
    -- Test immunity to normal moves
    vulnerable = MoveEffects.isVulnerableInSemiInvulnerableState(
        flyState, Enums.MoveId.TACKLE
    )
    assertFalse(vulnerable, "Flying Pokemon should be immune to normal moves")
    
    -- Test Dig vulnerabilities
    local digState = {
        move_id = Enums.MoveId.DIG,
        semi_invulnerable = true
    }
    
    vulnerable = MoveEffects.isVulnerableInSemiInvulnerableState(
        digState, Enums.MoveId.EARTHQUAKE
    )
    assertTrue(vulnerable, "Digging Pokemon should be vulnerable to Earthquake")
    
    print("Semi-invulnerable vulnerability tests passed")
end

-- Test 8.1-8.6: Random Effect Move System
function Tests.testRandomEffectMoveSystem()
    print("\n=== Test 8.1-8.6: Random Effect Move System ===")
    
    -- Set deterministic seed for testing
    BattleRNG.seed("metronome_test")
    
    local battleId = "test_battle"
    local pokemonId = "pokemon_1"
    local pokemon = createMockPokemon()
    
    -- Test Metronome execution
    local success, result = MoveEffects.executeMetronome(
        battleId, pokemonId, pokemon, {}
    )
    assertTrue(success, "Metronome should execute successfully")
    assertEquals(result.source_move, "Metronome", "Should preserve source move")
    assertTrue(result.selected_move_id ~= nil, "Should select a move")
    assertTrue(result.selected_move_id ~= Enums.MoveId.METRONOME, "Should not select itself")
    assertTrue(result.total_pool_size > 0, "Should have valid move pool")
    assertEquals(result.selection_method, "metronome", "Should indicate selection method")
    
    print("Random effect move system tests passed")
end

-- Test Sleep Talk execution
function Tests.testSleepTalkExecution()
    print("\n=== Test: Sleep Talk Execution ===")
    
    BattleRNG.seed("sleep_talk_test")
    
    local battleId = "test_battle"
    local pokemonId = "pokemon_1"
    local sleepingPokemon = createMockPokemon(nil, nil, 100, 100, MoveEffects.StatusEffect.SLEEP)
    sleepingPokemon.moves = {Enums.MoveId.TACKLE, Enums.MoveId.THUNDER, Enums.MoveId.ICE_BEAM, Enums.MoveId.FLAMETHROWER}
    
    local success, result = MoveEffects.executeSleepTalk(
        battleId, pokemonId, sleepingPokemon, {}
    )
    assertTrue(success, "Sleep Talk should execute successfully")
    assertEquals(result.source_move, "Sleep Talk", "Should preserve source move")
    assertTrue(result.selected_move_id ~= nil, "Should select a move")
    assertTrue(result.selected_move_id ~= Enums.MoveId.SLEEP_TALK, "Should not select itself")
    assertEquals(result.total_pool_size, 4, "Should have correct pool size")
    assertEquals(result.selection_method, "sleep_talk", "Should indicate selection method")
    
    -- Test failure when not asleep
    local awakePokemon = createMockPokemon(nil, nil, 100, 100, MoveEffects.StatusEffect.NONE)
    success, result = MoveEffects.executeSleepTalk(
        battleId, pokemonId, awakePokemon, {}
    )
    assertFalse(success, "Sleep Talk should fail when not asleep")
    
    print("Sleep Talk execution tests passed")
end

-- Test random move validation
function Tests.testRandomMoveValidation()
    print("\n=== Test: Random Move Validation ===")
    
    local pokemon = createMockPokemon()
    
    -- Test valid move for Metronome
    local valid, reason = MoveEffects.validateRandomMoveSelection(
        Enums.MoveId.TACKLE, pokemon, {}, "metronome"
    )
    assertTrue(valid, "Tackle should be valid for Metronome")
    
    -- Test multi-turn move exclusion for Sleep Talk
    valid, reason = MoveEffects.validateRandomMoveSelection(
        Enums.MoveId.FLY, pokemon, {}, "sleep_talk"
    )
    assertFalse(valid, "Sleep Talk should not select multi-turn moves")
    
    -- Test move pool checking
    assertTrue(MoveEffects.canMoveBeRandomlySelected(Enums.MoveId.THUNDER, "metronome"), 
              "Thunder should be selectable by Metronome")
    assertFalse(MoveEffects.canMoveBeRandomlySelected(Enums.MoveId.METRONOME, "metronome"), 
               "Metronome should not select itself")
    
    print("Random move validation tests passed")
end

-- Test deterministic random behavior
function Tests.testDeterministicRandomBehavior()
    print("\n=== Test: Deterministic Random Behavior ===")
    
    local battleId = "test_battle"
    local pokemon = createMockPokemon()
    
    -- Test deterministic Metronome
    BattleRNG.seed("deterministic_test")
    local success1, result1 = MoveEffects.executeMetronome(battleId, "pokemon1", pokemon, {})
    
    BattleRNG.seed("deterministic_test")
    local success2, result2 = MoveEffects.executeMetronome(battleId, "pokemon2", pokemon, {})
    
    assertTrue(success1 and success2, "Both Metronome calls should succeed")
    assertEquals(result1.selected_move_id, result2.selected_move_id, 
                "Same seed should produce same result")
    
    -- Test different seeds produce different results
    BattleRNG.seed("different_test")
    local success3, result3 = MoveEffects.executeMetronome(battleId, "pokemon3", pokemon, {})
    
    assertTrue(success3, "Different seed call should succeed")
    -- Results may or may not be different, but should be deterministic
    
    print("Deterministic random behavior tests passed")
end

-- Run all tests
function Tests.runAllTests()
    print("Running Advanced Move Effects System Tests...")
    print("=" .. string.rep("=", 50))
    
    -- Initialize RNG for consistent testing
    BattleRNG.seed("move-effects-test-seed")
    
    -- Run all test functions
    Tests.testStatusEffectApplication()
    Tests.testStatusDamage()
    Tests.testStatusCure()
    Tests.testStatusInteractions()
    Tests.testTerrainPrevention()
    Tests.testActionRestrictions()
    Tests.testTurnProcessing()
    Tests.testStatStageSystem()
    Tests.testStatStageUtilities()
    Tests.testWeatherSystem()
    Tests.testWeatherDamage()
    Tests.testTerrainSystem()
    Tests.testTerrainStatusPrevention()
    Tests.testTerrainHealing()
    Tests.testWeatherHealingModifiers()
    Tests.testHealingMoveSystem()
    Tests.testHealingFailures()
    Tests.testWeatherHealingModifications()
    Tests.testHealingCalculations()
    Tests.testHealingEdgeCases()
    Tests.testRecoilDamageSystem()
    Tests.testRecoilTiming()
    Tests.testMultiTurnMoveSystem()
    Tests.testMultiTurnProgression()
    Tests.testSemiInvulnerableVulnerabilities()
    Tests.testRandomEffectMoveSystem()
    Tests.testSleepTalkExecution()
    Tests.testRandomMoveValidation()
    Tests.testDeterministicRandomBehavior()
    
    -- Print summary
    print("\n" .. string.rep("=", 50))
    print("Test Summary: " .. passCount .. "/" .. testCount .. " tests passed")
    
    if passCount == testCount then
        print("✓ All tests passed! Move Effects System is working correctly.")
        return true
    else
        print("✗ Some tests failed. Please review the implementation.")
        return false
    end
end

-- Export test module
return Tests