-- Weather-Ability Interactions
-- Handles weather-related ability activations and stat modifications
-- Implements Solar Power, Rain Dish, Ice Body, Sand Rush, Swift Swim, Chlorophyll

local WeatherAbilities = {}

-- Load dependencies
local Enums = require("data.constants.enums")
local BattleRNG = require("game-logic.rng.battle-rng")

-- Weather-related ability definitions with activation conditions and effects
WeatherAbilities.WeatherAbilityData = {
    [Enums.AbilityId.SOLAR_POWER] = {
        name = "Solar Power",
        weather_conditions = {Enums.WeatherType.SUNNY},
        effects = {
            stat_boost = {stat = Enums.Stat.SPATK, multiplier = 1.5},
            end_turn_damage = {fraction = "1/8", damage_type = "ability"}
        },
        activation_timing = {"stat_calculation", "end_of_turn"}
    },
    [Enums.AbilityId.RAIN_DISH] = {
        name = "Rain Dish",
        weather_conditions = {Enums.WeatherType.RAIN},
        effects = {
            end_turn_healing = {fraction = "1/16", healing_type = "ability"}
        },
        activation_timing = {"end_of_turn"}
    },
    [Enums.AbilityId.ICE_BODY] = {
        name = "Ice Body",
        weather_conditions = {Enums.WeatherType.HAIL},
        effects = {
            end_turn_healing = {fraction = "1/16", healing_type = "ability"},
            weather_immunity = true
        },
        activation_timing = {"end_of_turn", "weather_damage_check"}
    },
    [Enums.AbilityId.SAND_RUSH] = {
        name = "Sand Rush",
        weather_conditions = {Enums.WeatherType.SANDSTORM},
        effects = {
            stat_boost = {stat = Enums.Stat.SPEED, multiplier = 2.0},
            weather_immunity = true
        },
        activation_timing = {"stat_calculation", "weather_damage_check"}
    },
    [Enums.AbilityId.SWIFT_SWIM] = {
        name = "Swift Swim",
        weather_conditions = {Enums.WeatherType.RAIN},
        effects = {
            stat_boost = {stat = Enums.Stat.SPEED, multiplier = 2.0}
        },
        activation_timing = {"stat_calculation"}
    },
    [Enums.AbilityId.CHLOROPHYLL] = {
        name = "Chlorophyll",
        weather_conditions = {Enums.WeatherType.SUNNY},
        effects = {
            stat_boost = {stat = Enums.Stat.SPEED, multiplier = 2.0}
        },
        activation_timing = {"stat_calculation"}
    },
    [Enums.AbilityId.SAND_VEIL] = {
        name = "Sand Veil",
        weather_conditions = {Enums.WeatherType.SANDSTORM},
        effects = {
            evasion_boost = {multiplier = 1.2},
            weather_immunity = true
        },
        activation_timing = {"accuracy_calculation", "weather_damage_check"}
    },
    [Enums.AbilityId.SNOW_CLOAK] = {
        name = "Snow Cloak",
        weather_conditions = {Enums.WeatherType.HAIL},
        effects = {
            evasion_boost = {multiplier = 1.2},
            weather_immunity = true
        },
        activation_timing = {"accuracy_calculation", "weather_damage_check"}
    },
    [Enums.AbilityId.OVERCOAT] = {
        name = "Overcoat",
        weather_conditions = {Enums.WeatherType.SANDSTORM, Enums.WeatherType.HAIL},
        effects = {
            weather_immunity = true
        },
        activation_timing = {"weather_damage_check"}
    },
    [Enums.AbilityId.CLOUD_NINE] = {
        name = "Cloud Nine",
        weather_conditions = "all", -- Suppresses all weather
        effects = {
            weather_suppression = true,
            suppression_scope = "all_pokemon"
        },
        activation_timing = {"weather_check", "field_entry"}
    },
    [Enums.AbilityId.AIR_LOCK] = {
        name = "Air Lock",
        weather_conditions = "all", -- Suppresses all weather  
        effects = {
            weather_suppression = true,
            suppression_scope = "all_pokemon"
        },
        activation_timing = {"weather_check", "field_entry"}
    },
    [Enums.AbilityId.DRY_SKIN] = {
        name = "Dry Skin",
        weather_conditions = {Enums.WeatherType.RAIN, Enums.WeatherType.SUNNY},
        effects = {
            end_turn_healing = {fraction = "1/8", weather = Enums.WeatherType.RAIN},
            end_turn_damage = {fraction = "1/8", weather = Enums.WeatherType.SUNNY}
        },
        activation_timing = {"end_of_turn"}
    }
}

-- Check if Pokemon has weather-related ability for current conditions
-- @param pokemon: Pokemon data with ability
-- @param weatherType: Current weather type
-- @param checkTiming: Specific timing to check ("stat_calculation", "end_of_turn", etc.)
-- @return: Boolean indicating if ability should activate, ability data
function WeatherAbilities.shouldAbilityActivate(pokemon, weatherType, checkTiming)
    if not pokemon or not pokemon.ability or not weatherType then
        return false, nil
    end
    
    local abilityData = WeatherAbilities.WeatherAbilityData[pokemon.ability]
    if not abilityData then
        return false, nil
    end
    
    -- Check if timing matches
    if checkTiming and abilityData.activation_timing then
        local timingMatches = false
        for _, timing in ipairs(abilityData.activation_timing) do
            if timing == checkTiming then
                timingMatches = true
                break
            end
        end
        if not timingMatches then
            return false, nil
        end
    end
    
    -- Check weather conditions
    if abilityData.weather_conditions == "all" then
        return true, abilityData
    end
    
    if type(abilityData.weather_conditions) == "table" then
        for _, condition in ipairs(abilityData.weather_conditions) do
            if weatherType == condition then
                return true, abilityData
            end
        end
    end
    
    return false, nil
end

-- Process weather-related ability stat modifications
-- @param pokemon: Pokemon data with ability and stats
-- @param weatherType: Current weather type
-- @return: Table of stat modifications {stat = multiplier}
function WeatherAbilities.getWeatherStatModifications(pokemon, weatherType)
    local shouldActivate, abilityData = WeatherAbilities.shouldAbilityActivate(pokemon, weatherType, "stat_calculation")
    
    if not shouldActivate or not abilityData or not abilityData.effects then
        return {}
    end
    
    local modifications = {}
    
    -- Stat boost modifications
    if abilityData.effects.stat_boost then
        local boost = abilityData.effects.stat_boost
        modifications[boost.stat] = boost.multiplier
    end
    
    return modifications
end

-- Process end-of-turn weather ability effects (healing, damage)
-- @param pokemonList: List of active Pokemon
-- @param weatherType: Current weather type
-- @return: List of ability activation results
function WeatherAbilities.processEndOfTurnAbilityEffects(pokemonList, weatherType)
    local results = {}
    
    for _, pokemon in ipairs(pokemonList) do
        local shouldActivate, abilityData = WeatherAbilities.shouldAbilityActivate(pokemon, weatherType, "end_of_turn")
        
        if shouldActivate and abilityData and abilityData.effects then
            local effects = abilityData.effects
            
            -- Process healing effects
            if effects.end_turn_healing then
                local maxHP = pokemon.maxHP or pokemon.stats[Enums.Stat.HP] or 100
                local healingAmount = 0
                
                -- Check if healing is conditional on specific weather
                local shouldHeal = true
                if effects.end_turn_healing.weather then
                    shouldHeal = (weatherType == effects.end_turn_healing.weather)
                end
                
                if shouldHeal then
                    if effects.end_turn_healing.fraction == "1/16" then
                        healingAmount = math.max(1, math.floor(maxHP / 16))
                    elseif effects.end_turn_healing.fraction == "1/8" then
                        healingAmount = math.max(1, math.floor(maxHP / 8))
                    end
                    
                    if healingAmount > 0 and pokemon.currentHP < maxHP then
                        table.insert(results, {
                            pokemon_id = pokemon.id or "unknown",
                            pokemon_name = pokemon.name or "Unknown Pokemon",
                            ability_name = abilityData.name,
                            effect_type = "healing",
                            healing = healingAmount,
                            source = "weather_ability",
                            weather = effects.end_turn_healing.weather
                        })
                    end
                end
            end
            
            -- Process damage effects (Solar Power, Dry Skin in sun)
            if effects.end_turn_damage then
                local maxHP = pokemon.maxHP or pokemon.stats[Enums.Stat.HP] or 100
                local damageAmount = 0
                
                -- Check if damage is conditional on specific weather
                local shouldDamage = true
                if effects.end_turn_damage.weather then
                    shouldDamage = (weatherType == effects.end_turn_damage.weather)
                end
                
                if shouldDamage then
                    if effects.end_turn_damage.fraction == "1/8" then
                        damageAmount = math.max(1, math.floor(maxHP / 8))
                    elseif effects.end_turn_damage.fraction == "1/16" then
                        damageAmount = math.max(1, math.floor(maxHP / 16))
                    end
                    
                    if damageAmount > 0 then
                        table.insert(results, {
                            pokemon_id = pokemon.id or "unknown",
                            pokemon_name = pokemon.name or "Unknown Pokemon",
                            ability_name = abilityData.name,
                            effect_type = "damage",
                            damage = damageAmount,
                            source = "weather_ability",
                            weather = effects.end_turn_damage.weather
                        })
                    end
                end
            end
        end
    end
    
    return results
end

-- Check if Pokemon is immune to weather damage due to ability
-- @param pokemon: Pokemon data with ability
-- @param weatherType: Current weather type causing damage
-- @return: Boolean indicating immunity, ability name if immune
function WeatherAbilities.isImmuneToWeatherDamage(pokemon, weatherType)
    if not pokemon or not pokemon.ability or not weatherType then
        return false, nil
    end
    
    local shouldActivate, abilityData = WeatherAbilities.shouldAbilityActivate(pokemon, weatherType, "weather_damage_check")
    
    if shouldActivate and abilityData and abilityData.effects and abilityData.effects.weather_immunity then
        return true, abilityData.name
    end
    
    return false, nil
end

-- Check if weather effects are suppressed due to abilities (Cloud Nine, Air Lock)
-- @param pokemonList: List of active Pokemon to check for suppression abilities
-- @param weatherType: Current weather type
-- @return: Boolean indicating if weather is suppressed, suppressing ability name, suppressing Pokemon
function WeatherAbilities.isWeatherSuppressed(pokemonList, weatherType)
    for _, pokemon in ipairs(pokemonList) do
        local shouldActivate, abilityData = WeatherAbilities.shouldAbilityActivate(pokemon, weatherType, "weather_check")
        
        if shouldActivate and abilityData and abilityData.effects and abilityData.effects.weather_suppression then
            return true, abilityData.name, pokemon
        end
    end
    
    return false, nil, nil
end

-- Enhanced weather suppression system with state tracking
-- @param pokemonList: List of active Pokemon
-- @param weatherType: Current weather type
-- @param battleState: Battle state for tracking suppression
-- @return: Suppression details with state management
function WeatherAbilities.processWeatherSuppression(pokemonList, weatherType, battleState)
    local suppressed, suppressingAbility, suppressingPokemon = WeatherAbilities.isWeatherSuppressed(pokemonList, weatherType)
    
    local result = {
        suppressed = suppressed,
        suppressing_ability = suppressingAbility,
        suppressing_pokemon = suppressingPokemon and suppressingPokemon.id or nil,
        previous_suppression = battleState and battleState.weather_suppression or nil,
        suppression_changed = false
    }
    
    -- Check if suppression state changed
    if battleState then
        local previousSuppressed = battleState.weather_suppression and battleState.weather_suppression.active or false
        result.suppression_changed = (suppressed ~= previousSuppressed)
        
        -- Update battle state
        battleState.weather_suppression = {
            active = suppressed,
            ability = suppressingAbility,
            pokemon_id = suppressingPokemon and suppressingPokemon.id or nil,
            previous_weather = not suppressed and weatherType or nil
        }
    end
    
    return result
end

-- Restore weather when suppression ends (Pokemon switches out)
-- @param battleState: Battle state with suppression tracking
-- @param switchedPokemonId: ID of Pokemon that switched out
-- @return: Weather restoration information
function WeatherAbilities.checkWeatherRestorationOnSwitch(battleState, switchedPokemonId)
    if not battleState or not battleState.weather_suppression then
        return nil
    end
    
    local suppression = battleState.weather_suppression
    
    -- If the suppressing Pokemon switched out, restore weather
    if suppression.active and suppression.pokemon_id == switchedPokemonId then
        return {
            should_restore = true,
            restored_weather = suppression.previous_weather or BattleConditions.WeatherType.NONE,
            reason = "Suppressing Pokemon switched out"
        }
    end
    
    return nil
end

-- Get accuracy/evasion modifications from weather abilities
-- @param attacker: Attacking Pokemon data
-- @param defender: Defending Pokemon data
-- @param weatherType: Current weather type
-- @return: Accuracy multiplier for attacker, evasion multiplier for defender
function WeatherAbilities.getWeatherAccuracyModifications(attacker, defender, weatherType)
    local attackerAccuracy = 1.0
    local defenderEvasion = 1.0
    
    -- Check attacker weather abilities (none currently affect accuracy directly)
    
    -- Check defender weather abilities for evasion boosts
    if defender then
        local shouldActivate, abilityData = WeatherAbilities.shouldAbilityActivate(defender, weatherType, "accuracy_calculation")
        
        if shouldActivate and abilityData and abilityData.effects and abilityData.effects.evasion_boost then
            defenderEvasion = abilityData.effects.evasion_boost.multiplier
        end
    end
    
    return attackerAccuracy, defenderEvasion
end

-- Activate weather-setting abilities at battle start or switch-in
-- @param pokemon: Pokemon data with potential weather ability
-- @param battleId: Battle instance identifier
-- @return: Weather change result or nil if no weather ability
function WeatherAbilities.activateWeatherSettingAbility(pokemon, battleId)
    if not pokemon or not pokemon.ability or not battleId then
        return nil
    end
    
    local weatherSettingAbilities = {
        [Enums.AbilityId.DROUGHT] = {
            weather = Enums.WeatherType.SUNNY,
            duration = 5,
            name = "Drought"
        },
        [Enums.AbilityId.DRIZZLE] = {
            weather = Enums.WeatherType.RAIN,
            duration = 5,
            name = "Drizzle"
        },
        [Enums.AbilityId.SAND_STREAM] = {
            weather = Enums.WeatherType.SANDSTORM,
            duration = 5,
            name = "Sand Stream"
        },
        [Enums.AbilityId.SNOW_WARNING] = {
            weather = Enums.WeatherType.HAIL,
            duration = 5,
            name = "Snow Warning"
        }
    }
    
    local abilityData = weatherSettingAbilities[pokemon.ability]
    if abilityData then
        return {
            weather_type = abilityData.weather,
            duration = abilityData.duration,
            source = "ability",
            source_ability = pokemon.ability,
            ability_name = abilityData.name,
            pokemon_name = pokemon.name or "Unknown Pokemon"
        }
    end
    
    return nil
end

-- Calculate final stat value with weather ability modifications
-- @param pokemon: Pokemon data with base stats and ability
-- @param statType: Type of stat being calculated
-- @param baseValue: Base stat value before modifications
-- @param weatherType: Current weather type
-- @return: Modified stat value
function WeatherAbilities.calculateWeatherModifiedStat(pokemon, statType, baseValue, weatherType)
    if not pokemon or not statType or not baseValue then
        return baseValue
    end
    
    local modifications = WeatherAbilities.getWeatherStatModifications(pokemon, weatherType)
    local modifier = modifications[statType] or 1.0
    
    return math.floor(baseValue * modifier)
end

-- Get all active weather abilities for Pokemon list
-- @param pokemonList: List of Pokemon to check
-- @param weatherType: Current weather type
-- @return: List of active ability descriptions
function WeatherAbilities.getActiveWeatherAbilities(pokemonList, weatherType)
    local activeAbilities = {}
    
    for _, pokemon in ipairs(pokemonList) do
        if pokemon.ability then
            local shouldActivate, abilityData = WeatherAbilities.shouldAbilityActivate(pokemon, weatherType, nil)
            
            if shouldActivate and abilityData then
                table.insert(activeAbilities, {
                    pokemon_id = pokemon.id or "unknown",
                    pokemon_name = pokemon.name or "Unknown Pokemon",
                    ability_id = pokemon.ability,
                    ability_name = abilityData.name,
                    effects = abilityData.effects
                })
            end
        end
    end
    
    return activeAbilities
end

return WeatherAbilities