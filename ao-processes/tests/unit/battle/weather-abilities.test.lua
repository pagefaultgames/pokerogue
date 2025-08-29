-- Unit Tests for Weather-Ability Interactions
-- Tests weather-related ability activations, stat modifications, and interactions
-- Tests Solar Power, Rain Dish, Ice Body, Sand Rush, Swift Swim, Chlorophyll

-- Set up universal test environment  
require("test-env-setup")

-- Load testing framework
local TestFramework = require("framework.test-framework-enhanced")
local WeatherAbilities = require("game-logic.battle.weather-abilities")
local BattleConditions = require("game-logic.battle.battle-conditions")
local Enums = require("data.constants.enums")

-- Test suite for Weather Abilities
local WeatherAbilitiesTests = {}

-- Test Data: Mock Pokemon with different weather abilities
local solarPowerPokemon = {
    id = "solar_power_pokemon",
    name = "Charizard",
    currentHP = 100,
    maxHP = 100,
    types = {Enums.PokemonType.FIRE, Enums.PokemonType.FLYING},
    stats = {[Enums.Stat.SPATK] = 90, [Enums.Stat.HP] = 100},
    ability = Enums.AbilityId.SOLAR_POWER
}

local rainDishPokemon = {
    id = "rain_dish_pokemon",
    name = "Ludicolo",
    currentHP = 80,
    maxHP = 100,
    types = {Enums.PokemonType.WATER, Enums.PokemonType.GRASS},
    stats = {[Enums.Stat.HP] = 100},
    ability = Enums.AbilityId.RAIN_DISH
}

local iceBodyPokemon = {
    id = "ice_body_pokemon",
    name = "Glalie",
    currentHP = 70,
    maxHP = 90,
    types = {Enums.PokemonType.ICE},
    stats = {[Enums.Stat.HP] = 90},
    ability = Enums.AbilityId.ICE_BODY
}

local sandRushPokemon = {
    id = "sand_rush_pokemon",
    name = "Excadrill",
    currentHP = 110,
    maxHP = 110,
    types = {Enums.PokemonType.GROUND, Enums.PokemonType.STEEL},
    stats = {[Enums.Stat.SPEED] = 88, [Enums.Stat.HP] = 110},
    ability = Enums.AbilityId.SAND_RUSH
}

local swiftSwimPokemon = {
    id = "swift_swim_pokemon",
    name = "Kingdra",
    currentHP = 95,
    maxHP = 95,
    types = {Enums.PokemonType.WATER, Enums.PokemonType.DRAGON},
    stats = {[Enums.Stat.SPEED] = 85, [Enums.Stat.HP] = 95},
    ability = Enums.AbilityId.SWIFT_SWIM
}

local chlorophyllPokemon = {
    id = "chlorophyll_pokemon",
    name = "Venusaur",
    currentHP = 100,
    maxHP = 100,
    types = {Enums.PokemonType.GRASS, Enums.PokemonType.POISON},
    stats = {[Enums.Stat.SPEED] = 80, [Enums.Stat.HP] = 100},
    ability = Enums.AbilityId.CHLOROPHYLL
}

local droughtPokemon = {
    id = "drought_pokemon",
    name = "Ninetales",
    currentHP = 85,
    maxHP = 85,
    types = {Enums.PokemonType.FIRE},
    stats = {[Enums.Stat.HP] = 85},
    ability = Enums.AbilityId.DROUGHT
}

-- Test: Solar Power Ability
function WeatherAbilitiesTests.testSolarPowerAbility()
    local test = TestFramework.createTest("Solar Power Ability")
    
    -- Test Solar Power activation in sun
    local shouldActivate, abilityData = WeatherAbilities.shouldAbilityActivate(
        solarPowerPokemon, 
        BattleConditions.WeatherType.SUNNY, 
        "stat_calculation"
    )
    TestFramework.assert(test, shouldActivate, "Solar Power should activate in sun")
    TestFramework.assert(test, abilityData.name == "Solar Power", "Should identify Solar Power ability")
    
    -- Test Solar Power stat modifications
    local statMods = WeatherAbilities.getWeatherStatModifications(solarPowerPokemon, BattleConditions.WeatherType.SUNNY)
    TestFramework.assert(test, statMods[Enums.Stat.SPATK] == 1.5, "Solar Power should boost Special Attack by 50%")
    
    -- Test Solar Power end-of-turn damage
    local abilityResults = WeatherAbilities.processEndOfTurnAbilityEffects({solarPowerPokemon}, BattleConditions.WeatherType.SUNNY)
    TestFramework.assert(test, #abilityResults == 1, "Should have one ability result")
    TestFramework.assert(test, abilityResults[1].effect_type == "damage", "Solar Power should cause damage")
    TestFramework.assert(test, abilityResults[1].damage == math.floor(100 / 8), "Should deal 1/8 max HP damage")
    
    -- Test Solar Power non-activation in other weather
    local noActivation, _ = WeatherAbilities.shouldAbilityActivate(
        solarPowerPokemon, 
        BattleConditions.WeatherType.RAIN, 
        "stat_calculation"
    )
    TestFramework.assert(test, not noActivation, "Solar Power should not activate in rain")
    
    return TestFramework.completeTest(test)
end

-- Test: Rain Dish Ability
function WeatherAbilitiesTests.testRainDishAbility()
    local test = TestFramework.createTest("Rain Dish Ability")
    
    -- Test Rain Dish activation in rain
    local shouldActivate, abilityData = WeatherAbilities.shouldAbilityActivate(
        rainDishPokemon,
        BattleConditions.WeatherType.RAIN,
        "end_of_turn"
    )
    TestFramework.assert(test, shouldActivate, "Rain Dish should activate in rain")
    TestFramework.assert(test, abilityData.name == "Rain Dish", "Should identify Rain Dish ability")
    
    -- Test Rain Dish end-of-turn healing
    local abilityResults = WeatherAbilities.processEndOfTurnAbilityEffects({rainDishPokemon}, BattleConditions.WeatherType.RAIN)
    TestFramework.assert(test, #abilityResults == 1, "Should have one ability result")
    TestFramework.assert(test, abilityResults[1].effect_type == "healing", "Rain Dish should cause healing")
    TestFramework.assert(test, abilityResults[1].healing == math.floor(100 / 16), "Should heal 1/16 max HP")
    
    -- Test Rain Dish non-activation when at full HP
    local fullHPPokemon = {
        id = "full_hp_pokemon",
        currentHP = 100,
        maxHP = 100,
        stats = {[Enums.Stat.HP] = 100},
        ability = Enums.AbilityId.RAIN_DISH
    }
    local noHealResults = WeatherAbilities.processEndOfTurnAbilityEffects({fullHPPokemon}, BattleConditions.WeatherType.RAIN)
    TestFramework.assert(test, #noHealResults == 0, "Should not heal Pokemon at full HP")
    
    return TestFramework.completeTest(test)
end

-- Test: Ice Body Ability
function WeatherAbilitiesTests.testIceBodyAbility()
    local test = TestFramework.createTest("Ice Body Ability")
    
    -- Test Ice Body activation in hail
    local shouldActivate, abilityData = WeatherAbilities.shouldAbilityActivate(
        iceBodyPokemon,
        BattleConditions.WeatherType.HAIL,
        "end_of_turn"
    )
    TestFramework.assert(test, shouldActivate, "Ice Body should activate in hail")
    TestFramework.assert(test, abilityData.name == "Ice Body", "Should identify Ice Body ability")
    
    -- Test Ice Body end-of-turn healing
    local abilityResults = WeatherAbilities.processEndOfTurnAbilityEffects({iceBodyPokemon}, BattleConditions.WeatherType.HAIL)
    TestFramework.assert(test, #abilityResults == 1, "Should have one ability result")
    TestFramework.assert(test, abilityResults[1].effect_type == "healing", "Ice Body should cause healing")
    TestFramework.assert(test, abilityResults[1].healing == math.floor(90 / 16), "Should heal 1/16 max HP")
    
    -- Test Ice Body weather immunity
    local immune, abilityName = WeatherAbilities.isImmuneToWeatherDamage(iceBodyPokemon, BattleConditions.WeatherType.HAIL)
    TestFramework.assert(test, immune, "Ice Body should provide hail immunity")
    TestFramework.assert(test, abilityName == "Ice Body", "Should identify Ice Body as immunity source")
    
    return TestFramework.completeTest(test)
end

-- Test: Speed Boost Abilities (Sand Rush, Swift Swim, Chlorophyll)
function WeatherAbilitiesTests.testSpeedBoostAbilities()
    local test = TestFramework.createTest("Speed Boost Abilities")
    
    -- Test Sand Rush in sandstorm
    local sandRushMods = WeatherAbilities.getWeatherStatModifications(sandRushPokemon, BattleConditions.WeatherType.SANDSTORM)
    TestFramework.assert(test, sandRushMods[Enums.Stat.SPEED] == 2.0, "Sand Rush should double speed")
    
    local calculatedSpeed = WeatherAbilities.calculateWeatherModifiedStat(
        sandRushPokemon, 
        Enums.Stat.SPEED, 
        88, 
        BattleConditions.WeatherType.SANDSTORM
    )
    TestFramework.assert(test, calculatedSpeed == 176, "Sand Rush should result in doubled speed stat")
    
    -- Test Swift Swim in rain
    local swiftSwimMods = WeatherAbilities.getWeatherStatModifications(swiftSwimPokemon, BattleConditions.WeatherType.RAIN)
    TestFramework.assert(test, swiftSwimMods[Enums.Stat.SPEED] == 2.0, "Swift Swim should double speed")
    
    -- Test Chlorophyll in sun
    local chlorophyllMods = WeatherAbilities.getWeatherStatModifications(chlorophyllPokemon, BattleConditions.WeatherType.SUNNY)
    TestFramework.assert(test, chlorophyllMods[Enums.Stat.SPEED] == 2.0, "Chlorophyll should double speed")
    
    -- Test speed abilities non-activation in wrong weather
    local noMods = WeatherAbilities.getWeatherStatModifications(sandRushPokemon, BattleConditions.WeatherType.RAIN)
    TestFramework.assert(test, not noMods[Enums.Stat.SPEED], "Sand Rush should not activate in rain")
    
    return TestFramework.completeTest(test)
end

-- Test: Weather-Setting Abilities
function WeatherAbilitiesTests.testWeatherSettingAbilities()
    local test = TestFramework.createTest("Weather-Setting Abilities")
    
    -- Test Drought ability activation
    local weatherChange = WeatherAbilities.activateWeatherSettingAbility(droughtPokemon, "test_battle")
    TestFramework.assert(test, weatherChange ~= nil, "Drought should activate")
    TestFramework.assert(test, weatherChange.weather_type == BattleConditions.WeatherType.SUNNY, "Drought should set sun")
    TestFramework.assert(test, weatherChange.duration == 5, "Drought should set weather for 5 turns")
    TestFramework.assert(test, weatherChange.ability_name == "Drought", "Should identify Drought ability")
    
    -- Test non-weather-setting ability
    local noWeatherChange = WeatherAbilities.activateWeatherSettingAbility(solarPowerPokemon, "test_battle")
    TestFramework.assert(test, noWeatherChange == nil, "Solar Power should not set weather")
    
    return TestFramework.completeTest(test)
end

-- Test: Weather Immunity Abilities
function WeatherAbilitiesTests.testWeatherImmunityAbilities()
    local test = TestFramework.createTest("Weather Immunity Abilities")
    
    local overcoatPokemon = {
        id = "overcoat_pokemon",
        name = "Mandibuzz",
        ability = Enums.AbilityId.OVERCOAT,
        types = {Enums.PokemonType.DARK, Enums.PokemonType.FLYING}
    }
    
    -- Test Overcoat immunity to sandstorm
    local sandstormImmune, abilityName = WeatherAbilities.isImmuneToWeatherDamage(overcoatPokemon, BattleConditions.WeatherType.SANDSTORM)
    TestFramework.assert(test, sandstormImmune, "Overcoat should provide sandstorm immunity")
    TestFramework.assert(test, abilityName == "Overcoat", "Should identify Overcoat as immunity source")
    
    -- Test Overcoat immunity to hail
    local hailImmune, _ = WeatherAbilities.isImmuneToWeatherDamage(overcoatPokemon, BattleConditions.WeatherType.HAIL)
    TestFramework.assert(test, hailImmune, "Overcoat should provide hail immunity")
    
    -- Test non-immunity to rain
    local rainNotImmune, _ = WeatherAbilities.isImmuneToWeatherDamage(overcoatPokemon, BattleConditions.WeatherType.RAIN)
    TestFramework.assert(test, not rainNotImmune, "Overcoat should not provide rain immunity")
    
    return TestFramework.completeTest(test)
end

-- Test: Weather Suppression Abilities
function WeatherAbilitiesTests.testWeatherSuppressionAbilities()
    local test = TestFramework.createTest("Weather Suppression Abilities")
    
    local cloudNinePokemon = {
        id = "cloud_nine_pokemon",
        name = "Psyduck",
        ability = Enums.AbilityId.CLOUD_NINE,
        types = {Enums.PokemonType.WATER}
    }
    
    local airLockPokemon = {
        id = "air_lock_pokemon", 
        name = "Rayquaza",
        ability = Enums.AbilityId.AIR_LOCK,
        types = {Enums.PokemonType.DRAGON, Enums.PokemonType.FLYING}
    }
    
    local pokemonList = {solarPowerPokemon, cloudNinePokemon}
    
    -- Test Cloud Nine weather suppression
    local suppressed, suppressorAbility, suppressorName = WeatherAbilities.isWeatherSuppressed(pokemonList, BattleConditions.WeatherType.RAIN)
    TestFramework.assert(test, suppressed, "Cloud Nine should suppress weather")
    TestFramework.assert(test, suppressorAbility == "Cloud Nine", "Should identify Cloud Nine as suppressor")
    
    -- Test Air Lock weather suppression
    local airLockList = {solarPowerPokemon, airLockPokemon}
    local airLockSuppressed, airLockSuppressor, _ = WeatherAbilities.isWeatherSuppressed(airLockList, BattleConditions.WeatherType.SANDSTORM)
    TestFramework.assert(test, airLockSuppressed, "Air Lock should suppress weather")
    TestFramework.assert(test, airLockSuppressor == "Air Lock", "Should identify Air Lock as suppressor")
    
    -- Test no suppression without suppression abilities
    local normalList = {solarPowerPokemon, rainDishPokemon}
    local notSuppressed, _, _ = WeatherAbilities.isWeatherSuppressed(normalList, BattleConditions.WeatherType.SUNNY)
    TestFramework.assert(test, not notSuppressed, "Normal abilities should not suppress weather")
    
    return TestFramework.completeTest(test)
end

-- Test: Accuracy/Evasion Modifications
function WeatherAbilitiesTests.testAccuracyEvasionModifications()
    local test = TestFramework.createTest("Accuracy/Evasion Modifications")
    
    local sandVeilPokemon = {
        id = "sand_veil_pokemon",
        name = "Garchomp",
        ability = Enums.AbilityId.SAND_VEIL,
        types = {Enums.PokemonType.DRAGON, Enums.PokemonType.GROUND}
    }
    
    local snowCloakPokemon = {
        id = "snow_cloak_pokemon",
        name = "Froslass",
        ability = Enums.AbilityId.SNOW_CLOAK,
        types = {Enums.PokemonType.ICE, Enums.PokemonType.GHOST}
    }
    
    -- Test Sand Veil evasion boost in sandstorm
    local attackerAccuracy, defenderEvasion = WeatherAbilities.getWeatherAccuracyModifications(
        solarPowerPokemon, 
        sandVeilPokemon, 
        BattleConditions.WeatherType.SANDSTORM
    )
    TestFramework.assert(test, defenderEvasion == 1.2, "Sand Veil should boost evasion by 20%")
    
    -- Test Snow Cloak evasion boost in hail
    local _, snowCloakEvasion = WeatherAbilities.getWeatherAccuracyModifications(
        solarPowerPokemon,
        snowCloakPokemon,
        BattleConditions.WeatherType.HAIL
    )
    TestFramework.assert(test, snowCloakEvasion == 1.2, "Snow Cloak should boost evasion by 20%")
    
    -- Test no evasion boost in wrong weather
    local _, noEvasion = WeatherAbilities.getWeatherAccuracyModifications(
        solarPowerPokemon,
        sandVeilPokemon,
        BattleConditions.WeatherType.RAIN
    )
    TestFramework.assert(test, noEvasion == 1.0, "Sand Veil should not boost evasion in rain")
    
    return TestFramework.completeTest(test)
end

-- Test: Active Weather Abilities Summary
function WeatherAbilitiesTests.testActiveWeatherAbilities()
    local test = TestFramework.createTest("Active Weather Abilities")
    
    local pokemonList = {solarPowerPokemon, rainDishPokemon, sandRushPokemon}
    
    -- Test active abilities in sun
    local activeAbilities = WeatherAbilities.getActiveWeatherAbilities(pokemonList, BattleConditions.WeatherType.SUNNY)
    TestFramework.assert(test, #activeAbilities == 1, "Should have 1 active ability in sun")
    TestFramework.assert(test, activeAbilities[1].ability_name == "Solar Power", "Solar Power should be active in sun")
    
    -- Test active abilities in sandstorm
    local sandstormActive = WeatherAbilities.getActiveWeatherAbilities(pokemonList, BattleConditions.WeatherType.SANDSTORM)
    TestFramework.assert(test, #sandstormActive == 1, "Should have 1 active ability in sandstorm")
    TestFramework.assert(test, sandstormActive[1].ability_name == "Sand Rush", "Sand Rush should be active in sandstorm")
    
    -- Test active abilities in rain
    local rainActive = WeatherAbilities.getActiveWeatherAbilities(pokemonList, BattleConditions.WeatherType.RAIN)
    TestFramework.assert(test, #rainActive == 1, "Should have 1 active ability in rain")
    TestFramework.assert(test, rainActive[1].ability_name == "Rain Dish", "Rain Dish should be active in rain")
    
    return TestFramework.completeTest(test)
end

-- Run all weather abilities unit tests
function WeatherAbilitiesTests.runAllTests()
    print("=== Weather Abilities Unit Tests ===\n")
    
    local tests = {
        WeatherAbilitiesTests.testSolarPowerAbility,
        WeatherAbilitiesTests.testRainDishAbility,
        WeatherAbilitiesTests.testIceBodyAbility,
        WeatherAbilitiesTests.testSpeedBoostAbilities,
        WeatherAbilitiesTests.testWeatherSettingAbilities,
        WeatherAbilitiesTests.testWeatherImmunityAbilities,
        WeatherAbilitiesTests.testWeatherSuppressionAbilities,
        WeatherAbilitiesTests.testAccuracyEvasionModifications,
        WeatherAbilitiesTests.testActiveWeatherAbilities
    }
    
    local results = TestFramework.runTestSuite("Weather Abilities", tests)
    TestFramework.printResults(results)
    
    return results
end

return WeatherAbilitiesTests