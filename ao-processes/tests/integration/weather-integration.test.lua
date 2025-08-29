-- Integration Tests for Weather Effects
-- Tests complete weather workflows within battle message processing system
-- Tests weather persistence across turns and battle conclusions

-- Load testing framework
package.path = "../?.lua;../?/init.lua;../data/?.lua;../data/?/init.lua;./?.lua;./?/init.lua;;" .. package.path
local TestFramework = require("tests.test-framework")
local WeatherEffects = require("game-logic.battle.weather-effects")
local WeatherAbilities = require("game-logic.battle.weather-abilities")
local TurnProcessor = require("game-logic.battle.turn-processor")
local BattleConditions = require("game-logic.battle.battle-conditions")
local Enums = require("data.constants.enums")

-- Test suite for Weather Integration
local WeatherIntegrationTests = {}

-- Helper: Create test battle state with weather
local function createTestBattleState(weatherType, duration, pokemonParty, enemyParty)
    local battleState = TurnProcessor.initializeBattle("test_battle", "test_seed_123", pokemonParty, enemyParty)
    if weatherType then
        battleState.weather = {
            type = weatherType,
            duration = duration or 5,
            source = "test"
        }
    end
    return battleState
end

-- Helper: Create test Pokemon with specific properties
local function createTestPokemon(id, name, types, ability, currentHP, maxHP, stats)
    return {
        id = id,
        name = name,
        types = types or {Enums.PokemonType.NORMAL},
        ability = ability,
        currentHP = currentHP or 100,
        maxHP = maxHP or 100,
        stats = stats or {
            [Enums.Stat.HP] = maxHP or 100,
            [Enums.Stat.ATTACK] = 80,
            [Enums.Stat.DEFENSE] = 80,
            [Enums.Stat.SPATK] = 80,
            [Enums.Stat.SPDEF] = 80,
            [Enums.Stat.SPEED] = 80
        },
        moves = {},
        statusEffect = nil,
        fainted = false
    }
end

-- Test: Complete Sandstorm Battle Workflow
function WeatherIntegrationTests.testSandstormBattleWorkflow()
    local test = TestFramework.createTest("Complete Sandstorm Battle Workflow")
    
    -- Create Pokemon parties
    local charizard = createTestPokemon(
        "charizard", "Charizard", 
        {Enums.PokemonType.FIRE, Enums.PokemonType.FLYING}, 
        nil, 100, 100
    )
    local golem = createTestPokemon(
        "golem", "Golem",
        {Enums.PokemonType.ROCK, Enums.PokemonType.GROUND},
        Enums.AbilityId.SAND_RUSH, 120, 120
    )
    local excadrill = createTestPokemon(
        "excadrill", "Excadrill",
        {Enums.PokemonType.GROUND, Enums.PokemonType.STEEL},
        Enums.AbilityId.SAND_STREAM, 110, 110
    )
    
    local playerParty = {charizard}
    local enemyParty = {golem, excadrill}
    
    -- Initialize battle with sandstorm
    local battleState = createTestBattleState(BattleConditions.WeatherType.SANDSTORM, 4, playerParty, enemyParty)
    
    -- Test weather initialization
    TestFramework.assert(test, battleState.weather.type == BattleConditions.WeatherType.SANDSTORM, "Sandstorm should be active")
    TestFramework.assert(test, battleState.weather.duration == 4, "Sandstorm should have 4 turns duration")
    
    -- Test turn 1: End-of-turn weather effects
    local turnResult = TurnProcessor.processEndOfTurnEffects(battleState)
    
    -- Charizard should take sandstorm damage
    TestFramework.assert(test, charizard.currentHP < 100, "Charizard should take sandstorm damage")
    local expectedDamage = math.floor(100 / 16) -- 1/16 max HP
    TestFramework.assert(test, charizard.currentHP == 100 - expectedDamage, "Charizard should take correct sandstorm damage")
    
    -- Golem should be immune to sandstorm
    TestFramework.assert(test, golem.currentHP == 120, "Golem should be immune to sandstorm damage")
    
    -- Test weather duration decrement
    TestFramework.assert(test, battleState.weather.duration == 3, "Weather duration should decrement to 3")
    
    return TestFramework.completeTest(test)
end

-- Test: Rain Battle with Multiple Weather Abilities
function WeatherIntegrationTests.testRainBattleWithAbilities()
    local test = TestFramework.createTest("Rain Battle with Multiple Weather Abilities")
    
    -- Create Pokemon with rain-related abilities
    local ludicolo = createTestPokemon(
        "ludicolo", "Ludicolo",
        {Enums.PokemonType.WATER, Enums.PokemonType.GRASS},
        Enums.AbilityId.RAIN_DISH, 80, 100
    )
    local kingdra = createTestPokemon(
        "kingdra", "Kingdra", 
        {Enums.PokemonType.WATER, Enums.PokemonType.DRAGON},
        Enums.AbilityId.SWIFT_SWIM, 95, 95,
        {[Enums.Stat.SPEED] = 85, [Enums.Stat.HP] = 95}
    )
    local charizard = createTestPokemon(
        "charizard", "Charizard",
        {Enums.PokemonType.FIRE, Enums.PokemonType.FLYING},
        Enums.AbilityId.SOLAR_POWER, 100, 100
    )
    
    local playerParty = {ludicolo, kingdra}
    local enemyParty = {charizard}
    
    -- Initialize battle with rain
    local battleState = createTestBattleState(BattleConditions.WeatherType.RAIN, 3, playerParty, enemyParty)
    
    -- Test Swift Swim speed boost
    local speedMod = WeatherAbilities.calculateWeatherModifiedStat(
        kingdra, Enums.Stat.SPEED, 85, BattleConditions.WeatherType.RAIN
    )
    TestFramework.assert(test, speedMod == 170, "Kingdra should have doubled speed in rain")
    
    -- Test end-of-turn effects
    local turnResult = TurnProcessor.processEndOfTurnEffects(battleState)
    
    -- Rain Dish should heal Ludicolo
    TestFramework.assert(test, ludicolo.currentHP > 80, "Ludicolo should be healed by Rain Dish")
    local expectedHealing = math.floor(100 / 16) -- 1/16 max HP
    TestFramework.assert(test, ludicolo.currentHP == 80 + expectedHealing, "Ludicolo should receive correct healing")
    
    -- Solar Power should not activate in rain (no damage)
    TestFramework.assert(test, charizard.currentHP == 100, "Charizard should not take Solar Power damage in rain")
    
    return TestFramework.completeTest(test)
end

-- Test: Weather-Dependent Move Integration
function WeatherIntegrationTests.testWeatherDependentMoveIntegration()
    local test = TestFramework.createTest("Weather-Dependent Move Integration")
    
    local pikachu = createTestPokemon(
        "pikachu", "Pikachu",
        {Enums.PokemonType.ELECTRIC},
        nil, 100, 100
    )
    local venusaur = createTestPokemon(
        "venusaur", "Venusaur",
        {Enums.PokemonType.GRASS, Enums.PokemonType.POISON},
        Enums.AbilityId.CHLOROPHYLL, 100, 100
    )
    
    local playerParty = {pikachu}
    local enemyParty = {venusaur}
    
    -- Test Thunder in rain
    local rainBattleState = createTestBattleState(BattleConditions.WeatherType.RAIN, 4, playerParty, enemyParty)
    
    local thunderMove = {
        name = "Thunder",
        power = 110,
        accuracy = 70,
        type = Enums.PokemonType.ELECTRIC
    }
    
    local modifiedThunder = WeatherEffects.processWeatherMoveInteractions(thunderMove, BattleConditions.WeatherType.RAIN)
    TestFramework.assert(test, modifiedThunder.accuracy == 100, "Thunder should have 100% accuracy in rain")
    TestFramework.assert(test, modifiedThunder.weather_accuracy_modified, "Thunder should be marked as weather-modified")
    
    -- Test Solar Beam in sun vs rain
    local sunBattleState = createTestBattleState(BattleConditions.WeatherType.SUNNY, 4, playerParty, enemyParty)
    
    local solarBeamMove = {
        name = "Solar Beam",
        power = 120,
        accuracy = 100,
        type = Enums.PokemonType.GRASS,
        charging = true
    }
    
    local solarBeamSun = WeatherEffects.processWeatherMoveInteractions(solarBeamMove, BattleConditions.WeatherType.SUNNY)
    TestFramework.assert(test, not solarBeamSun.charging, "Solar Beam should not require charging in sun")
    
    local solarBeamRain = WeatherEffects.processWeatherMoveInteractions(solarBeamMove, BattleConditions.WeatherType.RAIN)
    TestFramework.assert(test, solarBeamRain.power == 60, "Solar Beam should have reduced power in rain")
    TestFramework.assert(test, solarBeamRain.charging, "Solar Beam should still require charging in rain")
    
    return TestFramework.completeTest(test)
end

-- Test: Multi-Turn Weather Duration and Expiration
function WeatherIntegrationTests.testMultiTurnWeatherDuration()
    local test = TestFramework.createTest("Multi-Turn Weather Duration")
    
    local pokemon = createTestPokemon("test", "Test", {Enums.PokemonType.NORMAL}, nil, 100, 100)
    local playerParty = {pokemon}
    local enemyParty = {createTestPokemon("enemy", "Enemy", {Enums.PokemonType.NORMAL}, nil, 100, 100)}
    
    -- Initialize battle with hail (2 turn duration for quick testing)
    local battleState = createTestBattleState(BattleConditions.WeatherType.HAIL, 2, playerParty, enemyParty)
    
    -- Turn 1: Weather should be active
    TestFramework.assert(test, battleState.weather.type == BattleConditions.WeatherType.HAIL, "Hail should be active on turn 1")
    TestFramework.assert(test, battleState.weather.duration == 2, "Hail should have 2 turns remaining")
    
    -- Process turn 1 end effects
    local turn1Result = TurnProcessor.processEndOfTurnEffects(battleState)
    TestFramework.assert(test, battleState.weather.duration == 1, "Hail should have 1 turn remaining after turn 1")
    TestFramework.assert(test, pokemon.currentHP < 100, "Pokemon should take hail damage on turn 1")
    
    local turn1HP = pokemon.currentHP
    
    -- Process turn 2 end effects
    local turn2Result = TurnProcessor.processEndOfTurnEffects(battleState)
    TestFramework.assert(test, battleState.weather.type == BattleConditions.WeatherType.NONE, "Hail should expire after turn 2")
    TestFramework.assert(test, battleState.weather.duration == 0, "Weather duration should be 0 after expiration")
    TestFramework.assert(test, pokemon.currentHP < turn1HP, "Pokemon should take hail damage on turn 2 before expiration")
    
    local turn2HP = pokemon.currentHP
    
    -- Process turn 3 end effects (no weather)
    local turn3Result = TurnProcessor.processEndOfTurnEffects(battleState)
    TestFramework.assert(test, pokemon.currentHP == turn2HP, "Pokemon should not take weather damage after expiration")
    
    return TestFramework.completeTest(test)
end

-- Test: Weather Suppression Integration
function WeatherIntegrationTests.testWeatherSuppressionIntegration()
    local test = TestFramework.createTest("Weather Suppression Integration")
    
    local charizard = createTestPokemon(
        "charizard", "Charizard",
        {Enums.PokemonType.FIRE, Enums.PokemonType.FLYING},
        nil, 100, 100
    )
    local psyduck = createTestPokemon(
        "psyduck", "Psyduck",
        {Enums.PokemonType.WATER},
        Enums.AbilityId.CLOUD_NINE, 90, 90
    )
    
    local playerParty = {charizard}
    local enemyParty = {psyduck}
    
    -- Initialize battle with sandstorm
    local battleState = createTestBattleState(BattleConditions.WeatherType.SANDSTORM, 4, playerParty, enemyParty)
    
    -- Test weather suppression detection
    local allPokemon = {charizard, psyduck}
    local effectiveWeather, suppressionStatus = WeatherEffects.getEffectiveWeather(
        BattleConditions.WeatherType.SANDSTORM, 
        allPokemon
    )
    TestFramework.assert(test, effectiveWeather == BattleConditions.WeatherType.NONE, "Weather should be suppressed")
    TestFramework.assert(test, suppressionStatus.suppressed, "Suppression status should indicate suppression")
    TestFramework.assert(test, suppressionStatus.suppressor_ability == "Cloud Nine", "Should identify Cloud Nine")
    
    -- Test that weather damage doesn't occur due to suppression
    local initialHP = charizard.currentHP
    local turnResult = TurnProcessor.processEndOfTurnEffects(battleState)
    
    -- Since Cloud Nine is present, Charizard should not take sandstorm damage
    TestFramework.assert(test, charizard.currentHP == initialHP, "Charizard should not take sandstorm damage with Cloud Nine present")
    
    return TestFramework.completeTest(test)
end

-- Test: Weather Ability Activation on Battle Start
function WeatherIntegrationTests.testWeatherAbilityBattleStart()
    local test = TestFramework.createTest("Weather Ability Activation on Battle Start")
    
    local ninetales = createTestPokemon(
        "ninetales", "Ninetales",
        {Enums.PokemonType.FIRE},
        Enums.AbilityId.DROUGHT, 100, 100,
        {[Enums.Stat.SPEED] = 100, [Enums.Stat.HP] = 100}
    )
    local tyranitar = createTestPokemon(
        "tyranitar", "Tyranitar",
        {Enums.PokemonType.ROCK, Enums.PokemonType.DARK},
        Enums.AbilityId.SAND_STREAM, 120, 120,
        {[Enums.Stat.SPEED] = 61, [Enums.Stat.HP] = 120}
    )
    
    local playerParty = {ninetales}
    local enemyParty = {tyranitar}
    
    -- Initialize battle (weather abilities should activate based on speed)
    local battleState = TurnProcessor.initializeBattle("test_battle", "test_seed", playerParty, enemyParty)
    
    -- Ninetales is faster, so Drought should activate (sun weather)
    TestFramework.assert(test, battleState.weather.type == BattleConditions.WeatherType.SUNNY, "Drought should activate and set sun")
    TestFramework.assert(test, battleState.weather.duration == 5, "Drought should set 5-turn weather")
    TestFramework.assert(test, battleState.weather.source == "ability", "Weather source should be ability")
    
    return TestFramework.completeTest(test)
end

-- Test: Weather-Status Effect Interactions
function WeatherIntegrationTests.testWeatherStatusInteractions()
    local test = TestFramework.createTest("Weather-Status Effect Interactions")
    
    local articuno = createTestPokemon(
        "articuno", "Articuno",
        {Enums.PokemonType.ICE, Enums.PokemonType.FLYING},
        nil, 100, 100
    )
    local playerParty = {articuno}
    local enemyParty = {createTestPokemon("enemy", "Enemy", {Enums.PokemonType.NORMAL}, nil, 100, 100)}
    
    local battleState = createTestBattleState(BattleConditions.WeatherType.HAIL, 4, playerParty, enemyParty)
    
    -- Test weather-status interaction
    local modifiedStatus, interactions = WeatherEffects.processWeatherStatusInteractions(
        BattleConditions.WeatherType.HAIL,
        "freeze",
        articuno
    )
    TestFramework.assert(test, modifiedStatus == nil, "Ice-type Pokemon should not be frozen")
    TestFramework.assert(test, #interactions > 0, "Should have weather-status interaction")
    TestFramework.assert(test, interactions[1].type == "ice_type_freeze_immunity", "Should identify Ice-type freeze immunity")
    
    return TestFramework.completeTest(test)
end

-- Test: Complex Weather Transitions
function WeatherIntegrationTests.testComplexWeatherTransitions()
    local test = TestFramework.createTest("Complex Weather Transitions")
    
    local pokemon = createTestPokemon("test", "Test", {Enums.PokemonType.NORMAL}, nil, 100, 100)
    local playerParty = {pokemon}
    local enemyParty = {createTestPokemon("enemy", "Enemy", {Enums.PokemonType.NORMAL}, nil, 100, 100)}
    
    local battleState = createTestBattleState(BattleConditions.WeatherType.RAIN, 2, playerParty, enemyParty)
    
    -- Test weather replacement
    local currentWeather = battleState.weather
    local newWeather = {type = BattleConditions.WeatherType.SANDSTORM, duration = 3, source = "move"}
    local finalWeather, replacement = WeatherEffects.processWeatherReplacement(currentWeather, newWeather, "sunny_day")
    
    TestFramework.assert(test, replacement.replaced, "Weather should be replaced")
    TestFramework.assert(test, replacement.previous_weather == BattleConditions.WeatherType.RAIN, "Should track previous weather")
    TestFramework.assert(test, replacement.new_weather == BattleConditions.WeatherType.SANDSTORM, "Should track new weather")
    TestFramework.assert(test, finalWeather.type == BattleConditions.WeatherType.SANDSTORM, "Final weather should be sandstorm")
    
    return TestFramework.completeTest(test)
end

-- Test: Weather Clearing Integration
function WeatherIntegrationTests.testWeatherClearingIntegration()
    local test = TestFramework.createTest("Weather Clearing Integration")
    
    local pokemon = createTestPokemon("test", "Test", {Enums.PokemonType.NORMAL}, nil, 100, 100)
    local playerParty = {pokemon}
    local enemyParty = {createTestPokemon("enemy", "Enemy", {Enums.PokemonType.NORMAL}, nil, 100, 100)}
    
    local battleState = createTestBattleState(BattleConditions.WeatherType.HAIL, 5, playerParty, enemyParty)
    
    -- Test weather clearing by Defog
    local currentWeather = battleState.weather
    local clearedWeather, cleared = WeatherEffects.removeWeatherEffects(
        "test_battle",
        currentWeather,
        "defog"
    )
    
    TestFramework.assert(test, cleared, "Defog should clear weather")
    TestFramework.assert(test, clearedWeather.type == BattleConditions.WeatherType.NONE, "Weather should be cleared")
    TestFramework.assert(test, clearedWeather.cleared_by == "defog", "Should track clearing source")
    
    -- Apply cleared weather to battle state
    battleState.weather = clearedWeather
    
    -- Test that no weather effects occur after clearing
    local initialHP = pokemon.currentHP
    local turnResult = TurnProcessor.processEndOfTurnEffects(battleState)
    TestFramework.assert(test, pokemon.currentHP == initialHP, "No weather damage should occur after clearing")
    
    return TestFramework.completeTest(test)
end

-- Run all weather integration tests
function WeatherIntegrationTests.runAllTests()
    print("=== Weather Integration Tests ===\n")
    
    local tests = {
        WeatherIntegrationTests.testSandstormBattleWorkflow,
        WeatherIntegrationTests.testRainBattleWithAbilities,
        WeatherIntegrationTests.testWeatherDependentMoveIntegration,
        WeatherIntegrationTests.testMultiTurnWeatherDuration,
        WeatherIntegrationTests.testWeatherSuppressionIntegration,
        WeatherIntegrationTests.testWeatherAbilityBattleStart,
        WeatherIntegrationTests.testWeatherStatusInteractions,
        WeatherIntegrationTests.testComplexWeatherTransitions,
        WeatherIntegrationTests.testWeatherClearingIntegration
    }
    
    local results = TestFramework.runTestSuite("Weather Integration", tests)
    TestFramework.printResults(results)
    
    return results
end

return WeatherIntegrationTests