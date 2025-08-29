-- Weather Effects System
-- Core weather mechanics and interactions for Pokemon battles
-- Implements Sun, Rain, Sandstorm, and Hail with proper battle effects

local WeatherEffects = {}

-- Load dependencies
local BattleConditions = require("game-logic.battle.battle-conditions")
local BattleRNG = require("game-logic.rng.battle-rng")
local Enums = require("data.constants.enums")

-- Weather type constants (re-export from BattleConditions for convenience)
WeatherEffects.WeatherType = BattleConditions.WeatherType

-- Initialize weather for a battle
-- @param battleId: Battle instance identifier  
-- @param initialWeather: Initial weather type (default NONE)
-- @param duration: Duration override (nil for default)
-- @param source: Source of weather initialization
-- @return: Success boolean and weather state
function WeatherEffects.initializeWeather(battleId, initialWeather, duration, source)
    if not battleId then
        return false, "Battle ID required"
    end
    
    local weatherType = initialWeather or BattleConditions.WeatherType.NONE
    return BattleConditions.setWeather(battleId, weatherType, duration, source or "battle_init")
end

-- Process all weather effects for end of turn
-- @param battleId: Battle instance identifier
-- @param battleState: Current battle state with Pokemon and weather data
-- @return: Weather effects results including damage, healing, and ability triggers
function WeatherEffects.processEndOfTurnWeatherEffects(battleId, battleState)
    if not battleId or not battleState or not battleState.weather then
        return {damage_results = {}, healing_results = {}, ability_triggers = {}}
    end
    
    local results = {
        damage_results = {},
        healing_results = {},
        ability_triggers = {},
        weather_updated = false
    }
    
    local currentWeather = battleState.weather.type
    local weatherData = BattleConditions.WeatherData[currentWeather]
    
    if not weatherData then
        return results
    end
    
    -- Collect all active Pokemon
    local allPokemon = {}
    if battleState.playerParty then
        for _, pokemon in ipairs(battleState.playerParty) do
            if pokemon and pokemon.currentHP > 0 then
                table.insert(allPokemon, pokemon)
            end
        end
    end
    if battleState.enemyParty then
        for _, pokemon in ipairs(battleState.enemyParty) do
            if pokemon and pokemon.currentHP > 0 then
                table.insert(allPokemon, pokemon)
            end
        end
    end
    
    -- Process weather damage (Sandstorm, Hail)
    if weatherData.damage_per_turn then
        local damageResults = WeatherEffects.processWeatherDamage(currentWeather, allPokemon)
        for _, dmgResult in ipairs(damageResults) do
            table.insert(results.damage_results, dmgResult)
        end
    end
    
    -- Process weather-based healing (Rain Dish, Ice Body)
    local healingResults = WeatherEffects.processWeatherHealing(currentWeather, allPokemon)
    for _, healResult in ipairs(healingResults) do
        table.insert(results.healing_results, healResult)
    end
    
    -- Process weather-based ability triggers (Solar Power)
    local abilityResults = WeatherEffects.processWeatherAbilityTriggers(currentWeather, allPokemon)
    for _, abilityResult in ipairs(abilityResults) do
        table.insert(results.ability_triggers, abilityResult)
    end
    
    return results
end

-- Process weather damage for Sandstorm and Hail
-- @param weatherType: Current weather type
-- @param pokemonList: List of active Pokemon
-- @return: List of damage results
function WeatherEffects.processWeatherDamage(weatherType, pokemonList)
    local weatherData = BattleConditions.WeatherData[weatherType]
    if not weatherData or not weatherData.damage_per_turn then
        return {}
    end
    
    local damageResults = {}
    
    for _, pokemon in ipairs(pokemonList) do
        local takeDamage = true
        
        -- Check type immunity
        if weatherData.immune_types then
            for _, immuneType in ipairs(weatherData.immune_types) do
                if pokemon.types and (pokemon.types[1] == immuneType or pokemon.types[2] == immuneType) then
                    takeDamage = false
                    break
                end
            end
        end
        
        -- Check ability protection
        if takeDamage and pokemon.ability then
            local protectiveAbilities = {
                [Enums.AbilityId.SAND_VEIL] = {WeatherEffects.WeatherType.SANDSTORM},
                [Enums.AbilityId.SAND_RUSH] = {WeatherEffects.WeatherType.SANDSTORM},
                [Enums.AbilityId.ICE_BODY] = {WeatherEffects.WeatherType.HAIL},
                [Enums.AbilityId.OVERCOAT] = {WeatherEffects.WeatherType.SANDSTORM, WeatherEffects.WeatherType.HAIL},
                [Enums.AbilityId.SAFETY_GOGGLES] = {WeatherEffects.WeatherType.SANDSTORM, WeatherEffects.WeatherType.HAIL}
            }
            
            if protectiveAbilities[pokemon.ability] then
                for _, protectedWeather in ipairs(protectiveAbilities[pokemon.ability]) do
                    if weatherType == protectedWeather then
                        takeDamage = false
                        break
                    end
                end
            end
        end
        
        if takeDamage then
            local maxHP = pokemon.maxHP or pokemon.stats[Enums.Stat.HP] or 100
            local damage = math.max(1, math.floor(maxHP / 16)) -- 1/16 max HP damage
            
            table.insert(damageResults, {
                pokemon_id = pokemon.id or "unknown",
                pokemon_name = pokemon.name or "Unknown Pokemon",
                damage = damage,
                weather = weatherData.name,
                damage_type = "weather"
            })
        end
    end
    
    return damageResults
end

-- Process weather-based healing (Rain Dish, Ice Body)
-- @param weatherType: Current weather type
-- @param pokemonList: List of active Pokemon
-- @return: List of healing results
function WeatherEffects.processWeatherHealing(weatherType, pokemonList)
    local healingResults = {}
    
    -- Rain Dish healing in rain
    if weatherType == WeatherEffects.WeatherType.RAIN then
        for _, pokemon in ipairs(pokemonList) do
            if pokemon.ability == Enums.AbilityId.RAIN_DISH and pokemon.currentHP < pokemon.maxHP then
                local maxHP = pokemon.maxHP or pokemon.stats[Enums.Stat.HP] or 100
                local healing = math.max(1, math.floor(maxHP / 16)) -- 1/16 max HP healing
                
                table.insert(healingResults, {
                    pokemon_id = pokemon.id or "unknown",
                    pokemon_name = pokemon.name or "Unknown Pokemon",
                    healing = healing,
                    ability = "Rain Dish",
                    weather = "Rain"
                })
            end
        end
    end
    
    -- Ice Body healing in hail
    if weatherType == WeatherEffects.WeatherType.HAIL then
        for _, pokemon in ipairs(pokemonList) do
            if pokemon.ability == Enums.AbilityId.ICE_BODY and pokemon.currentHP < pokemon.maxHP then
                local maxHP = pokemon.maxHP or pokemon.stats[Enums.Stat.HP] or 100
                local healing = math.max(1, math.floor(maxHP / 16)) -- 1/16 max HP healing
                
                table.insert(healingResults, {
                    pokemon_id = pokemon.id or "unknown",
                    pokemon_name = pokemon.name or "Unknown Pokemon",
                    healing = healing,
                    ability = "Ice Body",
                    weather = "Hail"
                })
            end
        end
    end
    
    return healingResults
end

-- Process weather-based ability triggers (Solar Power, etc.)
-- @param weatherType: Current weather type
-- @param pokemonList: List of active Pokemon
-- @return: List of ability trigger results
function WeatherEffects.processWeatherAbilityTriggers(weatherType, pokemonList)
    local abilityResults = {}
    
    -- Solar Power in sun (Special Attack boost but HP loss)
    if weatherType == WeatherEffects.WeatherType.SUNNY then
        for _, pokemon in ipairs(pokemonList) do
            if pokemon.ability == Enums.AbilityId.SOLAR_POWER then
                local maxHP = pokemon.maxHP or pokemon.stats[Enums.Stat.HP] or 100
                local damage = math.max(1, math.floor(maxHP / 8)) -- 1/8 max HP damage
                
                table.insert(abilityResults, {
                    pokemon_id = pokemon.id or "unknown",
                    pokemon_name = pokemon.name or "Unknown Pokemon",
                    ability = "Solar Power",
                    weather = "Sun",
                    effect_type = "damage",
                    damage = damage,
                    stat_boost = {stat = "spatk", modifier = 1.5}
                })
            end
        end
    end
    
    return abilityResults
end

-- Calculate weather-modified move power
-- @param moveType: Type of the move
-- @param movePower: Base power of the move
-- @param weatherType: Current weather type
-- @return: Modified move power
function WeatherEffects.getWeatherModifiedPower(moveType, movePower, weatherType)
    if not moveType or not movePower or movePower <= 0 then
        return movePower
    end
    
    local modifier = BattleConditions.getWeatherMovePowerModifier(moveType, weatherType)
    return math.floor(movePower * modifier)
end

-- Check if move accuracy is modified by weather
-- @param moveName: Name of the move (lowercase)
-- @param weatherType: Current weather type
-- @return: Modified accuracy (percentage) or nil if no change
function WeatherEffects.getWeatherModifiedAccuracy(moveName, weatherType)
    local weatherData = BattleConditions.WeatherData[weatherType]
    if not weatherData or not weatherData.accuracy_moves then
        return nil
    end
    
    return weatherData.accuracy_moves[moveName]
end

-- Check if weather blocks a move completely
-- @param moveType: Type of move being used
-- @param weatherType: Current weather type
-- @return: Boolean indicating if move is blocked, reason string
function WeatherEffects.doesWeatherBlockMove(moveType, weatherType)
    local blocked = BattleConditions.doesWeatherBlockMove(moveType, weatherType)
    
    if blocked then
        local weatherData = BattleConditions.WeatherData[weatherType]
        local weatherName = weatherData and weatherData.name or "Unknown Weather"
        local reason = "Move blocked by " .. weatherName
        return true, reason
    end
    
    return false, nil
end

-- Update weather duration and check for expiration
-- @param currentWeather: Current weather state
-- @return: Updated weather state, boolean indicating if weather expired
function WeatherEffects.updateWeatherDuration(currentWeather)
    if not currentWeather or not currentWeather.duration then
        return currentWeather, false
    end
    
    local newDuration, expired = BattleConditions.updateDuration("weather", currentWeather.duration)
    
    local updatedWeather = {
        type = expired and BattleConditions.WeatherType.NONE or currentWeather.type,
        duration = expired and 0 or newDuration,
        source = expired and "expired" or currentWeather.source
    }
    
    return updatedWeather, expired
end

-- Get stat modifier for weather-affected abilities
-- @param pokemon: Pokemon data with ability
-- @param statType: Type of stat being modified
-- @param weatherType: Current weather type
-- @return: Stat modifier (1.0 = no change, 1.5 = 50% boost, etc.)
function WeatherEffects.getWeatherStatModifier(pokemon, statType, weatherType)
    if not pokemon or not pokemon.ability or not statType then
        return 1.0
    end
    
    local ability = pokemon.ability
    
    -- Speed boost abilities
    if statType == Enums.Stat.SPEED then
        if weatherType == WeatherEffects.WeatherType.RAIN and ability == Enums.AbilityId.SWIFT_SWIM then
            return 2.0 -- Double speed in rain
        elseif weatherType == WeatherEffects.WeatherType.SUNNY and ability == Enums.AbilityId.CHLOROPHYLL then
            return 2.0 -- Double speed in sun
        elseif weatherType == WeatherEffects.WeatherType.SANDSTORM and ability == Enums.AbilityId.SAND_RUSH then
            return 2.0 -- Double speed in sandstorm
        end
    end
    
    -- Special Attack boost (Solar Power handled in ability triggers)
    if statType == Enums.Stat.SPATK then
        if weatherType == WeatherEffects.WeatherType.SUNNY and ability == Enums.AbilityId.SOLAR_POWER then
            return 1.5 -- 50% special attack boost in sun
        end
    end
    
    -- Special Defense boost for Rock types in Sandstorm
    if statType == Enums.Stat.SPDEF then
        if weatherType == WeatherEffects.WeatherType.SANDSTORM and 
           pokemon.types and (pokemon.types[1] == Enums.PokemonType.ROCK or pokemon.types[2] == Enums.PokemonType.ROCK) then
            return 1.5 -- 50% special defense boost for Rock types
        end
    end
    
    return 1.0
end

-- Weather-dependent move data and interactions
WeatherEffects.WeatherMoveData = {
    -- Thunder - 100% accuracy in rain, normal accuracy otherwise
    thunder = {
        normal_accuracy = 70,
        weather_modifications = {
            [WeatherEffects.WeatherType.RAIN] = {accuracy = 100},
            [WeatherEffects.WeatherType.SUNNY] = {accuracy = 50} -- Reduced in harsh sun in some games
        }
    },
    -- Hurricane - 100% accuracy in rain, reduced in sandstorm
    hurricane = {
        normal_accuracy = 70,
        weather_modifications = {
            [WeatherEffects.WeatherType.RAIN] = {accuracy = 100},
            [WeatherEffects.WeatherType.SANDSTORM] = {accuracy = 50}
        }
    },
    -- Blizzard - 100% accuracy in hail
    blizzard = {
        normal_accuracy = 70,
        weather_modifications = {
            [WeatherEffects.WeatherType.HAIL] = {accuracy = 100}
        }
    },
    -- Solar Beam - skips charging turn in sun, half power in other weather
    solar_beam = {
        normal_power = 120,
        normal_charging = true,
        weather_modifications = {
            [WeatherEffects.WeatherType.SUNNY] = {charging = false, power = 120},
            [WeatherEffects.WeatherType.RAIN] = {charging = true, power = 60},
            [WeatherEffects.WeatherType.SANDSTORM] = {charging = true, power = 60},
            [WeatherEffects.WeatherType.HAIL] = {charging = true, power = 60}
        }
    },
    -- Weather Ball - changes type and doubles power based on weather
    weather_ball = {
        normal_power = 50,
        normal_type = Enums.PokemonType.NORMAL,
        weather_modifications = {
            [WeatherEffects.WeatherType.SUNNY] = {power = 100, type = Enums.PokemonType.FIRE},
            [WeatherEffects.WeatherType.RAIN] = {power = 100, type = Enums.PokemonType.WATER},
            [WeatherEffects.WeatherType.SANDSTORM] = {power = 100, type = Enums.PokemonType.ROCK},
            [WeatherEffects.WeatherType.HAIL] = {power = 100, type = Enums.PokemonType.ICE}
        }
    },
    -- Synthesis, Morning Sun, Moonlight - heal more in sun, less in other weather
    synthesis = {
        normal_healing = "1/2",
        weather_modifications = {
            [WeatherEffects.WeatherType.SUNNY] = {healing = "2/3"},
            [WeatherEffects.WeatherType.RAIN] = {healing = "1/4"},
            [WeatherEffects.WeatherType.SANDSTORM] = {healing = "1/4"},
            [WeatherEffects.WeatherType.HAIL] = {healing = "1/4"}
        }
    },
    morning_sun = {
        normal_healing = "1/2",
        weather_modifications = {
            [WeatherEffects.WeatherType.SUNNY] = {healing = "2/3"},
            [WeatherEffects.WeatherType.RAIN] = {healing = "1/4"},
            [WeatherEffects.WeatherType.SANDSTORM] = {healing = "1/4"},
            [WeatherEffects.WeatherType.HAIL] = {healing = "1/4"}
        }
    },
    moonlight = {
        normal_healing = "1/2",
        weather_modifications = {
            [WeatherEffects.WeatherType.SUNNY] = {healing = "2/3"},
            [WeatherEffects.WeatherType.RAIN] = {healing = "1/4"},
            [WeatherEffects.WeatherType.SANDSTORM] = {healing = "1/4"},
            [WeatherEffects.WeatherType.HAIL] = {healing = "1/4"}
        }
    }
}

-- Get weather-modified move accuracy
-- @param moveName: Name of the move (lowercase)
-- @param weatherType: Current weather type
-- @param baseAccuracy: Base accuracy of the move
-- @return: Modified accuracy or nil if no change
function WeatherEffects.getWeatherModifiedMoveAccuracy(moveName, weatherType, baseAccuracy)
    local moveData = WeatherEffects.WeatherMoveData[moveName:lower()]
    if not moveData or not moveData.weather_modifications then
        return baseAccuracy
    end
    
    local modification = moveData.weather_modifications[weatherType]
    if modification and modification.accuracy then
        return modification.accuracy
    end
    
    return baseAccuracy
end

-- Get weather-modified move power
-- @param moveName: Name of the move (lowercase)
-- @param weatherType: Current weather type
-- @param basePower: Base power of the move
-- @return: Modified power and type (if changed)
function WeatherEffects.getWeatherModifiedMovePower(moveName, weatherType, basePower, baseType)
    local moveData = WeatherEffects.WeatherMoveData[moveName:lower()]
    if not moveData or not moveData.weather_modifications then
        return basePower, baseType
    end
    
    local modification = moveData.weather_modifications[weatherType]
    if modification then
        local newPower = modification.power or basePower
        local newType = modification.type or baseType
        return newPower, newType
    end
    
    return basePower, baseType
end

-- Check if move requires charging turn and if weather modifies this
-- @param moveName: Name of the move (lowercase)
-- @param weatherType: Current weather type
-- @return: Boolean indicating if charging turn required
function WeatherEffects.doesMoveRequireCharging(moveName, weatherType)
    local moveData = WeatherEffects.WeatherMoveData[moveName:lower()]
    if not moveData then
        return false
    end
    
    -- Check weather modification first
    if moveData.weather_modifications and moveData.weather_modifications[weatherType] then
        local modification = moveData.weather_modifications[weatherType]
        if modification.charging ~= nil then
            return modification.charging
        end
    end
    
    -- Return normal charging behavior
    return moveData.normal_charging or false
end

-- Get weather-modified healing amount for healing moves
-- @param moveName: Name of the healing move (lowercase)
-- @param weatherType: Current weather type
-- @param maxHP: Maximum HP of the Pokemon
-- @return: Healing amount in HP
function WeatherEffects.getWeatherModifiedHealing(moveName, weatherType, maxHP)
    local moveData = WeatherEffects.WeatherMoveData[moveName:lower()]
    if not moveData then
        return 0
    end
    
    local healingFraction = moveData.normal_healing
    
    -- Check for weather modification
    if moveData.weather_modifications and moveData.weather_modifications[weatherType] then
        local modification = moveData.weather_modifications[weatherType]
        if modification.healing then
            healingFraction = modification.healing
        end
    end
    
    -- Convert healing fraction to actual HP amount
    if healingFraction == "1/2" then
        return math.floor(maxHP / 2)
    elseif healingFraction == "2/3" then
        return math.floor(maxHP * 2 / 3)
    elseif healingFraction == "1/4" then
        return math.floor(maxHP / 4)
    elseif healingFraction == "1/8" then
        return math.floor(maxHP / 8)
    elseif healingFraction == "1/16" then
        return math.floor(maxHP / 16)
    end
    
    return 0
end

-- Process move-specific weather interactions during move execution
-- @param moveData: Move data including name, power, accuracy, type
-- @param weatherType: Current weather type
-- @return: Modified move data with weather adjustments
function WeatherEffects.processWeatherMoveInteractions(moveData, weatherType)
    if not moveData or not weatherType then
        return moveData
    end
    
    local modifiedMove = {}
    for k, v in pairs(moveData) do
        modifiedMove[k] = v
    end
    
    local moveName = moveData.name and moveData.name:lower() or ""
    
    -- Apply accuracy modifications
    if moveData.accuracy and moveData.accuracy > 0 then
        local newAccuracy = WeatherEffects.getWeatherModifiedMoveAccuracy(moveName, weatherType, moveData.accuracy)
        if newAccuracy ~= moveData.accuracy then
            modifiedMove.accuracy = newAccuracy
            modifiedMove.weather_accuracy_modified = true
        end
    end
    
    -- Apply power and type modifications
    if moveData.power and moveData.power > 0 then
        local newPower, newType = WeatherEffects.getWeatherModifiedMovePower(moveName, weatherType, moveData.power, moveData.type)
        if newPower ~= moveData.power then
            modifiedMove.power = newPower
            modifiedMove.weather_power_modified = true
        end
        if newType ~= moveData.type then
            modifiedMove.type = newType
            modifiedMove.weather_type_modified = true
        end
    end
    
    -- Apply charging modifications
    local requiresCharging = WeatherEffects.doesMoveRequireCharging(moveName, weatherType)
    if moveData.charging ~= requiresCharging then
        modifiedMove.charging = requiresCharging
        modifiedMove.weather_charging_modified = true
    end
    
    return modifiedMove
end

-- Complex Weather-Field Effect Interaction System

-- Weather suppression abilities that neutralize all weather effects
WeatherEffects.WeatherSuppressionAbilities = {
    [Enums.AbilityId.CLOUD_NINE] = "Cloud Nine",
    [Enums.AbilityId.AIR_LOCK] = "Air Lock"
}

-- Weather overriding move data
WeatherEffects.WeatherMovesToSuppress = {
    defog = true,     -- Clears weather and field effects
    haze = false      -- Does not affect weather directly
}

-- Check if weather effects are currently suppressed
-- @param pokemonList: List of all active Pokemon in battle
-- @return: Boolean indicating suppression, suppressing ability name, Pokemon name
function WeatherEffects.isWeatherEffectsSuppressed(pokemonList)
    for _, pokemon in ipairs(pokemonList) do
        if pokemon and pokemon.ability and WeatherEffects.WeatherSuppressionAbilities[pokemon.ability] then
            local abilityName = WeatherEffects.WeatherSuppressionAbilities[pokemon.ability]
            return true, abilityName, pokemon.name or "Unknown Pokemon"
        end
    end
    return false, nil, nil
end

-- Process weather-terrain interaction conflicts
-- @param weatherType: Current weather type
-- @param terrainType: Current terrain type
-- @return: Adjusted weather and terrain, conflict resolution details
function WeatherEffects.resolveWeatherTerrainConflicts(weatherType, terrainType)
    -- Most weather-terrain combinations coexist, but some have special interactions
    local conflicts = {}
    
    -- Grassy Terrain interaction with weather damage
    if terrainType == BattleConditions.TerrainType.GRASSY and 
       (weatherType == WeatherEffects.WeatherType.SANDSTORM or weatherType == WeatherEffects.WeatherType.HAIL) then
        table.insert(conflicts, {
            type = "terrain_healing_vs_weather_damage",
            description = "Grassy Terrain healing counteracts weather damage for grounded Pokemon"
        })
    end
    
    -- Electric Terrain prevents sleep, which may interact with weather-related moves
    if terrainType == BattleConditions.TerrainType.ELECTRIC then
        table.insert(conflicts, {
            type = "electric_terrain_sleep_prevention",
            description = "Electric Terrain prevents sleep status that may be caused by weather-related moves"
        })
    end
    
    -- Misty Terrain prevents status conditions, protecting from weather-related status
    if terrainType == BattleConditions.TerrainType.MISTY then
        table.insert(conflicts, {
            type = "misty_terrain_status_protection",
            description = "Misty Terrain prevents status conditions that may be caused by weather effects"
        })
    end
    
    return weatherType, terrainType, conflicts
end

-- Process weather removal/replacement mechanics
-- @param currentWeather: Current weather state
-- @param newWeather: New weather being applied
-- @param source: Source of weather change
-- @return: Final weather state, replacement details
function WeatherEffects.processWeatherReplacement(currentWeather, newWeather, source)
    local replacement = {
        previous_weather = currentWeather.type,
        new_weather = newWeather.type,
        source = source,
        replaced = false
    }
    
    -- Check if new weather actually replaces current weather
    if currentWeather.type ~= BattleConditions.WeatherType.NONE and newWeather.type ~= currentWeather.type then
        replacement.replaced = true
        replacement.message = string.format("The %s was replaced by %s!", 
            BattleConditions.WeatherData[currentWeather.type].name,
            BattleConditions.WeatherData[newWeather.type].name)
    elseif newWeather.type == BattleConditions.WeatherType.NONE then
        replacement.replaced = true
        replacement.message = "The weather cleared up!"
    end
    
    return newWeather, replacement
end

-- Process weather effect removal through moves or items
-- @param battleId: Battle instance identifier
-- @param currentWeather: Current weather state
-- @param removalSource: Source of removal (move name, item name, etc.)
-- @return: Updated weather state, removal success
function WeatherEffects.removeWeatherEffects(battleId, currentWeather, removalSource)
    if not currentWeather or currentWeather.type == BattleConditions.WeatherType.NONE then
        return currentWeather, false
    end
    
    -- Moves that can clear weather
    local weatherClearingMoves = {
        defog = true,
        -- Add other weather-clearing moves as needed
    }
    
    if weatherClearingMoves[removalSource:lower()] then
        local clearedWeather = {
            type = BattleConditions.WeatherType.NONE,
            duration = 0,
            source = removalSource,
            cleared_by = removalSource
        }
        
        return clearedWeather, true
    end
    
    return currentWeather, false
end

-- Calculate effective weather for battle calculations (accounting for suppression)
-- @param weatherType: Actual weather type in battle state
-- @param pokemonList: All active Pokemon (to check for suppression abilities)
-- @return: Effective weather type for calculations, suppression status
function WeatherEffects.getEffectiveWeather(weatherType, pokemonList)
    local suppressed, suppressorAbility, suppressorPokemon = WeatherEffects.isWeatherEffectsSuppressed(pokemonList)
    
    if suppressed then
        return BattleConditions.WeatherType.NONE, {
            suppressed = true,
            suppressor_ability = suppressorAbility,
            suppressor_pokemon = suppressorPokemon,
            actual_weather = weatherType
        }
    end
    
    return weatherType, {suppressed = false}
end

-- Process complex weather-status effect interactions
-- @param weatherType: Current weather type
-- @param statusEffect: Status effect being applied or maintained
-- @param pokemon: Pokemon data with types and ability
-- @return: Modified status effect, interaction details
function WeatherEffects.processWeatherStatusInteractions(weatherType, statusEffect, pokemon)
    local interactions = {}
    
    -- Ice-type Pokemon can't be frozen (status), but hail affects all except Ice types
    if statusEffect == "freeze" and weatherType == WeatherEffects.WeatherType.HAIL then
        if pokemon.types and (pokemon.types[1] == Enums.PokemonType.ICE or pokemon.types[2] == Enums.PokemonType.ICE) then
            table.insert(interactions, {
                type = "ice_type_freeze_immunity",
                description = "Ice-type Pokemon cannot be frozen"
            })
            statusEffect = nil
        end
    end
    
    -- Sunny weather may interact with burn status (in some game mechanics)
    if statusEffect == "burn" and weatherType == WeatherEffects.WeatherType.SUNNY then
        table.insert(interactions, {
            type = "sunny_weather_burn_interaction",
            description = "Burn damage may be affected by sunny weather in some mechanics"
        })
    end
    
    return statusEffect, interactions
end

-- Get comprehensive weather effect summary for battle state
-- @param weatherType: Current weather type
-- @param pokemonList: All active Pokemon
-- @return: Complete weather effects summary
function WeatherEffects.getWeatherEffectsSummary(weatherType, pokemonList)
    local effectiveWeather, suppressionStatus = WeatherEffects.getEffectiveWeather(weatherType, pokemonList)
    local weatherData = BattleConditions.WeatherData[effectiveWeather]
    
    local summary = {
        actual_weather = weatherType,
        effective_weather = effectiveWeather,
        weather_name = weatherData and weatherData.name or "None",
        suppression = suppressionStatus,
        active_effects = {},
        affected_pokemon = {},
        move_modifications = {}
    }
    
    if not suppressionStatus.suppressed and weatherData then
        -- List active effects
        if weatherData.fire_boost then
            table.insert(summary.active_effects, "Fire-type moves boosted by 50%")
        end
        if weatherData.water_boost then
            table.insert(summary.active_effects, "Water-type moves boosted by 50%")
        end
        if weatherData.damage_per_turn then
            table.insert(summary.active_effects, "Weather damage: " .. weatherData.damage_per_turn .. " max HP per turn")
        end
        
        -- Identify affected Pokemon
        for _, pokemon in ipairs(pokemonList) do
            local effects = {}
            
            -- Check weather ability interactions
            local weatherAbilities = require("game-logic.battle.weather-abilities")
            local shouldActivate, abilityData = weatherAbilities.shouldAbilityActivate(pokemon, effectiveWeather)
            if shouldActivate then
                table.insert(effects, "Ability: " .. abilityData.name)
            end
            
            -- Check weather damage immunity/vulnerability
            if weatherData.damage_per_turn then
                local immune = false
                if weatherData.immune_types then
                    for _, immuneType in ipairs(weatherData.immune_types) do
                        if pokemon.types and (pokemon.types[1] == immuneType or pokemon.types[2] == immuneType) then
                            immune = true
                            break
                        end
                    end
                end
                
                if immune then
                    table.insert(effects, "Immune to weather damage")
                else
                    table.insert(effects, "Takes weather damage")
                end
            end
            
            if #effects > 0 then
                summary.affected_pokemon[pokemon.id or "unknown"] = {
                    name = pokemon.name or "Unknown Pokemon",
                    effects = effects
                }
            end
        end
    end
    
    return summary
end

-- Get list of all weather-dependent moves
-- @return: Table of move names that have weather interactions
function WeatherEffects.getWeatherDependentMoves()
    local moves = {}
    for moveName, _ in pairs(WeatherEffects.WeatherMoveData) do
        table.insert(moves, moveName)
    end
    return moves
end

-- Set weather with proper validation and duration handling
-- @param battleId: Battle instance identifier
-- @param weatherType: Weather type to set
-- @param duration: Duration override (nil for default)
-- @param source: Source of weather change (move name, ability name, etc.)
-- @param sourceAbility: Source ability ID if triggered by ability
-- @return: Success boolean and weather result data
function WeatherEffects.setWeather(battleId, weatherType, duration, source, sourceAbility)
    local success, result = BattleConditions.setWeather(battleId, weatherType, duration, source, sourceAbility)
    
    if success and result then
        -- Add weather-specific initialization
        if weatherType == WeatherEffects.WeatherType.SUNNY then
            result.effects = {"fire_boost", "water_nerf", "healing_boost", "solar_beam_instant"}
        elseif weatherType == WeatherEffects.WeatherType.RAIN then
            result.effects = {"water_boost", "fire_nerf", "thunder_accuracy", "hurricane_accuracy"}
        elseif weatherType == WeatherEffects.WeatherType.SANDSTORM then
            result.effects = {"rock_spdef_boost", "damage_non_rock_ground_steel", "hurricane_accuracy_reduced"}
        elseif weatherType == WeatherEffects.WeatherType.HAIL then
            result.effects = {"blizzard_accuracy", "damage_non_ice"}
        end
    end
    
    return success, result
end

return WeatherEffects