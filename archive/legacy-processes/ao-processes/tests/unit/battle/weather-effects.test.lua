-- Unit Tests for Weather Effects System
-- Tests all weather conditions with proper battle effects
-- Tests weather-dependent move interactions and ability activations

-- Set up universal test environment
require("test-env-setup")

-- Load testing framework
local TestFramework = require("framework.test-framework-enhanced")
local WeatherEffects = require("game-logic.battle.weather-effects")
local WeatherAbilities = require("game-logic.battle.weather-abilities")
local BattleConditions = require("game-logic.battle.battle-conditions")
local Enums = require("data.constants.enums")

-- Test suite for Weather Effects
local WeatherEffectsTests = {}

-- Test Data: Mock Pokemon for testing
local mockPokemon = {
    id = "test_pokemon_1",
    name = "Charizard",
    currentHP = 100,
    maxHP = 100,
    types = {Enums.PokemonType.FIRE, Enums.PokemonType.FLYING},
    stats = {
        [Enums.Stat.HP] = 100,
        [Enums.Stat.ATTACK] = 80,
        [Enums.Stat.DEFENSE] = 70,
        [Enums.Stat.SPATK] = 90,
        [Enums.Stat.SPDEF] = 75,
        [Enums.Stat.SPEED] = 85
    },
    ability = Enums.AbilityId.SOLAR_POWER
}

local mockRockPokemon = {
    id = "test_pokemon_2", 
    name = "Golem",
    currentHP = 120,
    maxHP = 120,
    types = {Enums.PokemonType.ROCK, Enums.PokemonType.GROUND},
    stats = {
        [Enums.Stat.HP] = 120,
        [Enums.Stat.ATTACK] = 100,
        [Enums.Stat.DEFENSE] = 120,
        [Enums.Stat.SPATK] = 50,
        [Enums.Stat.SPDEF] = 60,
        [Enums.Stat.SPEED] = 40
    },
    ability = Enums.AbilityId.SAND_RUSH
}

local mockIcePokemon = {
    id = "test_pokemon_3",
    name = "Glalie", 
    currentHP = 80,
    maxHP = 80,
    types = {Enums.PokemonType.ICE},
    stats = {
        [Enums.Stat.HP] = 80,
        [Enums.Stat.ATTACK] = 80,
        [Enums.Stat.DEFENSE] = 80,
        [Enums.Stat.SPATK] = 80,
        [Enums.Stat.SPDEF] = 80,
        [Enums.Stat.SPEED] = 80
    },
    ability = Enums.AbilityId.ICE_BODY
}

local mockBattleState = {
    battleId = "test_battle",
    weather = {type = BattleConditions.WeatherType.NONE, duration = 0, source = "none"},
    playerParty = {mockPokemon},
    enemyParty = {mockRockPokemon}
}

-- Test: Weather Initialization
function WeatherEffectsTests.testWeatherInitialization()
    local test = TestFramework.createTest("Weather Initialization")
    
    -- Test normal weather initialization
    local success, result = WeatherEffects.initializeWeather("test_battle", BattleConditions.WeatherType.SUNNY, 5, "test")
    TestFramework.assert(test, success, "Weather initialization should succeed")
    TestFramework.assert(test, result.weather_type == BattleConditions.WeatherType.SUNNY, "Weather type should be SUNNY")
    TestFramework.assert(test, result.duration == 5, "Weather duration should be 5")
    
    -- Test weather initialization with no battle ID
    local fail_success, fail_result = WeatherEffects.initializeWeather(nil, BattleConditions.WeatherType.RAIN)
    TestFramework.assert(test, not fail_success, "Weather initialization should fail without battle ID")
    TestFramework.assert(test, fail_result == "Battle ID required", "Should return appropriate error message")
    
    return TestFramework.completeTest(test)
end

-- Test: Sun Weather Effects
function WeatherEffectsTests.testSunWeatherEffects()
    local test = TestFramework.createTest("Sun Weather Effects")
    
    -- Test fire move power boost in sun
    local firePower = WeatherEffects.getWeatherModifiedPower(Enums.PokemonType.FIRE, 100, BattleConditions.WeatherType.SUNNY)
    TestFramework.assert(test, firePower == 150, "Fire moves should have 150 power in sun (50% boost)")
    
    -- Test water move power reduction in sun  
    local waterPower = WeatherEffects.getWeatherModifiedPower(Enums.PokemonType.WATER, 100, BattleConditions.WeatherType.SUNNY)
    TestFramework.assert(test, waterPower == 50, "Water moves should have 50 power in sun (50% reduction)")
    
    -- Test Solar Beam charging skip in sun
    local requiresCharging = WeatherEffects.doesMoveRequireCharging("solar_beam", BattleConditions.WeatherType.SUNNY)
    TestFramework.assert(test, not requiresCharging, "Solar Beam should not require charging in sun")
    
    -- Test synthesis healing boost in sun
    local healingAmount = WeatherEffects.getWeatherModifiedHealing("synthesis", BattleConditions.WeatherType.SUNNY, 120)
    local expectedHealing = math.floor(120 * 2 / 3) -- 2/3 of max HP
    TestFramework.assert(test, healingAmount == expectedHealing, "Synthesis should heal 2/3 HP in sun")
    
    return TestFramework.completeTest(test)
end

-- Test: Rain Weather Effects
function WeatherEffectsTests.testRainWeatherEffects()
    local test = TestFramework.createTest("Rain Weather Effects")
    
    -- Test water move power boost in rain
    local waterPower = WeatherEffects.getWeatherModifiedPower(Enums.PokemonType.WATER, 100, BattleConditions.WeatherType.RAIN)
    TestFramework.assert(test, waterPower == 150, "Water moves should have 150 power in rain (50% boost)")
    
    -- Test fire move power reduction in rain
    local firePower = WeatherEffects.getWeatherModifiedPower(Enums.PokemonType.FIRE, 100, BattleConditions.WeatherType.RAIN)
    TestFramework.assert(test, firePower == 50, "Fire moves should have 50 power in rain (50% reduction)")
    
    -- Test Thunder accuracy boost in rain
    local thunderAccuracy = WeatherEffects.getWeatherModifiedMoveAccuracy("thunder", BattleConditions.WeatherType.RAIN, 70)
    TestFramework.assert(test, thunderAccuracy == 100, "Thunder should have 100% accuracy in rain")
    
    -- Test Hurricane accuracy boost in rain
    local hurricaneAccuracy = WeatherEffects.getWeatherModifiedMoveAccuracy("hurricane", BattleConditions.WeatherType.RAIN, 70)
    TestFramework.assert(test, hurricaneAccuracy == 100, "Hurricane should have 100% accuracy in rain")
    
    return TestFramework.completeTest(test)
end

-- Test: Sandstorm Weather Effects
function WeatherEffectsTests.testSandstormWeatherEffects()
    local test = TestFramework.createTest("Sandstorm Weather Effects")
    
    -- Test sandstorm damage for non-immune types
    local damageResults = WeatherEffects.processWeatherDamage(BattleConditions.WeatherType.SANDSTORM, {mockPokemon})
    TestFramework.assert(test, #damageResults == 1, "Should damage non-immune Pokemon")
    TestFramework.assert(test, damageResults[1].damage == math.floor(100 / 16), "Should deal 1/16 max HP damage")
    
    -- Test sandstorm immunity for Rock/Ground/Steel types
    local immuneResults = WeatherEffects.processWeatherDamage(BattleConditions.WeatherType.SANDSTORM, {mockRockPokemon})
    TestFramework.assert(test, #immuneResults == 0, "Rock/Ground types should be immune to sandstorm")
    
    -- Test Hurricane accuracy reduction in sandstorm
    local hurricaneAccuracy = WeatherEffects.getWeatherModifiedMoveAccuracy("hurricane", BattleConditions.WeatherType.SANDSTORM, 70)
    TestFramework.assert(test, hurricaneAccuracy == 50, "Hurricane should have reduced accuracy in sandstorm")
    
    return TestFramework.completeTest(test)
end

-- Test: Hail Weather Effects
function WeatherEffectsTests.testHailWeatherEffects()
    local test = TestFramework.createTest("Hail Weather Effects")
    
    -- Test hail damage for non-ice types
    local damageResults = WeatherEffects.processWeatherDamage(BattleConditions.WeatherType.HAIL, {mockPokemon})
    TestFramework.assert(test, #damageResults == 1, "Should damage non-Ice Pokemon")
    TestFramework.assert(test, damageResults[1].damage == math.floor(100 / 16), "Should deal 1/16 max HP damage")
    
    -- Test hail immunity for Ice types
    local immuneResults = WeatherEffects.processWeatherDamage(BattleConditions.WeatherType.HAIL, {mockIcePokemon})
    TestFramework.assert(test, #immuneResults == 0, "Ice types should be immune to hail")
    
    -- Test Blizzard accuracy boost in hail
    local blizzardAccuracy = WeatherEffects.getWeatherModifiedMoveAccuracy("blizzard", BattleConditions.WeatherType.HAIL, 70)
    TestFramework.assert(test, blizzardAccuracy == 100, "Blizzard should have 100% accuracy in hail")
    
    return TestFramework.completeTest(test)
end

-- Test: Weather Ball Move Interactions
function WeatherEffectsTests.testWeatherBallInteractions()
    local test = TestFramework.createTest("Weather Ball Interactions")
    
    -- Test Weather Ball in sun
    local sunPower, sunType = WeatherEffects.getWeatherModifiedMovePower("weather_ball", BattleConditions.WeatherType.SUNNY, 50, Enums.PokemonType.NORMAL)
    TestFramework.assert(test, sunPower == 100, "Weather Ball should have 100 power in sun")
    TestFramework.assert(test, sunType == Enums.PokemonType.FIRE, "Weather Ball should become Fire type in sun")
    
    -- Test Weather Ball in rain
    local rainPower, rainType = WeatherEffects.getWeatherModifiedMovePower("weather_ball", BattleConditions.WeatherType.RAIN, 50, Enums.PokemonType.NORMAL)
    TestFramework.assert(test, rainPower == 100, "Weather Ball should have 100 power in rain")
    TestFramework.assert(test, rainType == Enums.PokemonType.WATER, "Weather Ball should become Water type in rain")
    
    -- Test Weather Ball in sandstorm
    local sandPower, sandType = WeatherEffects.getWeatherModifiedMovePower("weather_ball", BattleConditions.WeatherType.SANDSTORM, 50, Enums.PokemonType.NORMAL)
    TestFramework.assert(test, sandPower == 100, "Weather Ball should have 100 power in sandstorm")
    TestFramework.assert(test, sandType == Enums.PokemonType.ROCK, "Weather Ball should become Rock type in sandstorm")
    
    -- Test Weather Ball in hail
    local hailPower, hailType = WeatherEffects.getWeatherModifiedMovePower("weather_ball", BattleConditions.WeatherType.HAIL, 50, Enums.PokemonType.NORMAL)
    TestFramework.assert(test, hailPower == 100, "Weather Ball should have 100 power in hail")
    TestFramework.assert(test, hailType == Enums.PokemonType.ICE, "Weather Ball should become Ice type in hail")
    
    return TestFramework.completeTest(test)
end

-- Test: Weather Duration Tracking
function WeatherEffectsTests.testWeatherDurationTracking()
    local test = TestFramework.createTest("Weather Duration Tracking")
    
    -- Test weather duration decrement
    local initialWeather = {type = BattleConditions.WeatherType.RAIN, duration = 3, source = "test"}
    local updatedWeather, expired = WeatherEffects.updateWeatherDuration(initialWeather)
    TestFramework.assert(test, not expired, "Weather should not expire with 3 turns remaining")
    TestFramework.assert(test, updatedWeather.duration == 2, "Weather duration should decrement to 2")
    
    -- Test weather expiration
    local expiringWeather = {type = BattleConditions.WeatherType.RAIN, duration = 1, source = "test"}
    local expiredWeather, shouldExpire = WeatherEffects.updateWeatherDuration(expiringWeather)
    TestFramework.assert(test, shouldExpire, "Weather should expire with 1 turn remaining")
    TestFramework.assert(test, expiredWeather.type == BattleConditions.WeatherType.NONE, "Weather should be cleared when expired")
    
    -- Test permanent weather (duration = -1)
    local permanentWeather = {type = BattleConditions.WeatherType.HARSH_SUN, duration = -1, source = "test"}
    local unchangedWeather, permanentExpired = WeatherEffects.updateWeatherDuration(permanentWeather)
    TestFramework.assert(test, not permanentExpired, "Permanent weather should not expire")
    TestFramework.assert(test, unchangedWeather.duration == -1, "Permanent weather duration should remain -1")
    
    return TestFramework.completeTest(test)
end

-- Test: Weather Effect Removal
function WeatherEffectsTests.testWeatherEffectRemoval()
    local test = TestFramework.createTest("Weather Effect Removal")
    
    local currentWeather = {type = BattleConditions.WeatherType.SANDSTORM, duration = 3, source = "test"}
    
    -- Test weather removal by Defog
    local clearedWeather, cleared = WeatherEffects.removeWeatherEffects("test_battle", currentWeather, "defog")
    TestFramework.assert(test, cleared, "Defog should clear weather")
    TestFramework.assert(test, clearedWeather.type == BattleConditions.WeatherType.NONE, "Weather should be cleared")
    
    -- Test weather removal by non-weather-clearing move
    local unchangedWeather, notCleared = WeatherEffects.removeWeatherEffects("test_battle", currentWeather, "tackle")
    TestFramework.assert(test, not notCleared, "Normal moves should not clear weather")
    TestFramework.assert(test, unchangedWeather.type == currentWeather.type, "Weather should remain unchanged")
    
    return TestFramework.completeTest(test)
end

-- Test: Complex Weather Move Processing
function WeatherEffectsTests.testComplexWeatherMoveProcessing()
    local test = TestFramework.createTest("Complex Weather Move Processing")
    
    local testMove = {
        name = "Thunder",
        power = 110,
        accuracy = 70,
        type = Enums.PokemonType.ELECTRIC,
        charging = false
    }
    
    -- Test Thunder in rain
    local modifiedMove = WeatherEffects.processWeatherMoveInteractions(testMove, BattleConditions.WeatherType.RAIN)
    TestFramework.assert(test, modifiedMove.accuracy == 100, "Thunder should have 100% accuracy in rain")
    TestFramework.assert(test, modifiedMove.weather_accuracy_modified, "Should mark weather accuracy modification")
    
    -- Test Solar Beam in various weather
    local solarBeamMove = {
        name = "Solar Beam",
        power = 120,
        accuracy = 100,
        type = Enums.PokemonType.GRASS,
        charging = true
    }
    
    local solarBeamSun = WeatherEffects.processWeatherMoveInteractions(solarBeamMove, BattleConditions.WeatherType.SUNNY)
    TestFramework.assert(test, not solarBeamSun.charging, "Solar Beam should not require charging in sun")
    TestFramework.assert(test, solarBeamSun.weather_charging_modified, "Should mark weather charging modification")
    
    local solarBeamRain = WeatherEffects.processWeatherMoveInteractions(solarBeamMove, BattleConditions.WeatherType.RAIN)
    TestFramework.assert(test, solarBeamRain.power == 60, "Solar Beam should have reduced power in rain")
    TestFramework.assert(test, solarBeamRain.weather_power_modified, "Should mark weather power modification")
    
    return TestFramework.completeTest(test)
end

-- Test: Weather Suppression
function WeatherEffectsTests.testWeatherSuppression()
    local test = TestFramework.createTest("Weather Suppression")
    
    local cloudNinePokemon = {
        id = "test_pokemon_4",
        name = "Psyduck", 
        ability = Enums.AbilityId.CLOUD_NINE,
        types = {Enums.PokemonType.WATER},
        currentHP = 90,
        maxHP = 90
    }
    
    local pokemonList = {mockPokemon, cloudNinePokemon}
    
    -- Test weather suppression detection
    local suppressed, suppressorAbility, suppressorName = WeatherEffects.isWeatherEffectsSuppressed(pokemonList)
    TestFramework.assert(test, suppressed, "Weather should be suppressed with Cloud Nine")
    TestFramework.assert(test, suppressorAbility == "Cloud Nine", "Should identify Cloud Nine as suppressor")
    TestFramework.assert(test, suppressorName == "Psyduck", "Should identify Psyduck as suppressor Pokemon")
    
    -- Test effective weather calculation
    local effectiveWeather, suppressionStatus = WeatherEffects.getEffectiveWeather(BattleConditions.WeatherType.RAIN, pokemonList)
    TestFramework.assert(test, effectiveWeather == BattleConditions.WeatherType.NONE, "Effective weather should be NONE when suppressed")
    TestFramework.assert(test, suppressionStatus.suppressed, "Suppression status should indicate suppression")
    
    return TestFramework.completeTest(test)
end

-- Run all weather effects unit tests
function WeatherEffectsTests.runAllTests()
    print("=== Weather Effects Unit Tests ===\n")
    
    local tests = {
        WeatherEffectsTests.testWeatherInitialization,
        WeatherEffectsTests.testSunWeatherEffects,
        WeatherEffectsTests.testRainWeatherEffects,
        WeatherEffectsTests.testSandstormWeatherEffects,
        WeatherEffectsTests.testHailWeatherEffects,
        WeatherEffectsTests.testWeatherBallInteractions,
        WeatherEffectsTests.testWeatherDurationTracking,
        WeatherEffectsTests.testWeatherEffectRemoval,
        WeatherEffectsTests.testComplexWeatherMoveProcessing,
        WeatherEffectsTests.testWeatherSuppression
    }
    
    local results = TestFramework.runTestSuite("Weather Effects", tests)
    TestFramework.printResults(results)
    
    return results
end

return WeatherEffectsTests