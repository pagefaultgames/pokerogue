-- Battle Conditions System
-- Comprehensive weather, terrain, and field effect management
-- Handles duration tracking, ability interactions, and move modifications

local BattleConditions = {}

-- Load dependencies
local Enums = require("data.constants.enums")
local BattleRNG = require("game-logic.rng.battle-rng")

-- Weather types and data (matching TypeScript implementation)
BattleConditions.WeatherType = {
    NONE = 0,
    SUNNY = 1,
    RAIN = 2,
    SANDSTORM = 3,
    HAIL = 4,
    SNOW = 5,
    FOG = 6,
    HEAVY_RAIN = 7,
    HARSH_SUN = 8,
    STRONG_WINDS = 9
}

-- Weather data with effects and interactions
BattleConditions.WeatherData = {
    [BattleConditions.WeatherType.SUNNY] = {
        name = "Sunny",
        default_duration = 5,
        fire_boost = 1.5,
        water_nerf = 0.5,
        abilities = {Enums.AbilityId.DROUGHT, Enums.AbilityId.SOLAR_POWER},
        healing_moves = {["synthesis"] = "3/4", ["morning_sun"] = "3/4", ["moonlight"] = "3/4"}
    },
    [BattleConditions.WeatherType.RAIN] = {
        name = "Rain",
        default_duration = 5,
        water_boost = 1.5,
        fire_nerf = 0.5,
        abilities = {Enums.AbilityId.DRIZZLE, Enums.AbilityId.SWIFT_SWIM, Enums.AbilityId.RAIN_DISH},
        accuracy_moves = {["thunder"] = 100, ["hurricane"] = 100}
    },
    [BattleConditions.WeatherType.SANDSTORM] = {
        name = "Sandstorm",
        default_duration = 5,
        damage_per_turn = "1/16",
        immune_types = {Enums.PokemonType.ROCK, Enums.PokemonType.GROUND, Enums.PokemonType.STEEL},
        abilities = {Enums.AbilityId.SAND_STREAM, Enums.AbilityId.SAND_VEIL},
        spdef_boost_types = {Enums.PokemonType.ROCK}
    },
    [BattleConditions.WeatherType.HAIL] = {
        name = "Hail",
        default_duration = 5,
        damage_per_turn = "1/16",
        immune_types = {Enums.PokemonType.ICE},
        abilities = {Enums.AbilityId.SNOW_WARNING},
        accuracy_moves = {["blizzard"] = 100}
    },
    [BattleConditions.WeatherType.SNOW] = {
        name = "Snow",
        default_duration = 5,
        immune_types = {Enums.PokemonType.ICE},
        abilities = {Enums.AbilityId.SNOW_WARNING},
        def_boost_types = {Enums.PokemonType.ICE}
    },
    [BattleConditions.WeatherType.FOG] = {
        name = "Fog",
        default_duration = 5,
        accuracy_reduction = 0.6
    },
    [BattleConditions.WeatherType.HEAVY_RAIN] = {
        name = "Heavy Rain",
        default_duration = -1, -- Permanent until overridden
        water_boost = 1.5,
        fire_immunity = true,
        abilities = {Enums.AbilityId.DRIZZLE}
    },
    [BattleConditions.WeatherType.HARSH_SUN] = {
        name = "Harsh Sun",
        default_duration = -1, -- Permanent until overridden
        fire_boost = 1.5,
        water_immunity = true,
        abilities = {Enums.AbilityId.DROUGHT}
    },
    [BattleConditions.WeatherType.STRONG_WINDS] = {
        name = "Strong Winds",
        default_duration = -1, -- Permanent until overridden
        flying_resistance = true,
        abilities = {}
    }
}

-- Terrain types and data
BattleConditions.TerrainType = {
    NONE = 0,
    ELECTRIC = 1,
    GRASSY = 2,
    MISTY = 3,
    PSYCHIC = 4
}

-- Terrain data with effects and interactions
BattleConditions.TerrainData = {
    [BattleConditions.TerrainType.ELECTRIC] = {
        name = "Electric Terrain",
        default_duration = 5,
        power_boost = {[Enums.PokemonType.ELECTRIC] = 1.5},
        status_prevention = {"sleep"},
        grounded_only = true
    },
    [BattleConditions.TerrainType.GRASSY] = {
        name = "Grassy Terrain",
        default_duration = 5,
        power_boost = {[Enums.PokemonType.GRASS] = 1.5},
        healing_per_turn = "1/16",
        move_power_reduction = {["earthquake"] = 0.5, ["magnitude"] = 0.5, ["bulldoze"] = 0.5},
        grounded_only = true
    },
    [BattleConditions.TerrainType.MISTY] = {
        name = "Misty Terrain",
        default_duration = 5,
        power_boost = {[Enums.PokemonType.FAIRY] = 1.5},
        status_prevention = {"all"},
        dragon_move_immunity = true,
        grounded_only = true
    },
    [BattleConditions.TerrainType.PSYCHIC] = {
        name = "Psychic Terrain",
        default_duration = 5,
        power_boost = {[Enums.PokemonType.PSYCHIC] = 1.5},
        priority_move_immunity = true,
        grounded_only = true
    }
}

-- Field effects (global battle conditions)
BattleConditions.FieldEffectType = {
    NONE = 0,
    TRICK_ROOM = 1,
    WONDER_ROOM = 2,
    MAGIC_ROOM = 3,
    GRAVITY = 4
}

-- Set weather condition
-- @param battleId: Battle instance identifier
-- @param weatherType: Weather type to set
-- @param duration: Duration override (nil for default)
-- @param source: Source of weather change (move, ability, etc.)
-- @param sourceAbility: Source ability if triggered by ability
-- @return: Boolean indicating success and weather details
function BattleConditions.setWeather(battleId, weatherType, duration, source, sourceAbility)
    if not battleId or not weatherType then
        return false, "Invalid parameters for weather change"
    end
    
    local weatherData = BattleConditions.WeatherData[weatherType]
    if not weatherData and weatherType ~= BattleConditions.WeatherType.NONE then
        return false, "Unknown weather type: " .. tostring(weatherType)
    end
    
    local actualDuration = duration
    if not actualDuration and weatherData then
        actualDuration = weatherData.default_duration
        -- Add random variation for some weather types
        if actualDuration > 0 then
            local variance = BattleRNG.randomInt(-1, 1)
            actualDuration = math.max(1, actualDuration + variance)
        end
    end
    
    local result = {
        success = true,
        weather_type = weatherType,
        weather_name = weatherData and weatherData.name or "None",
        duration = actualDuration or 0,
        source = source,
        source_ability = sourceAbility,
        timestamp = os.time()
    }
    
    print("Weather changed to " .. result.weather_name .. " for " .. (actualDuration or "unlimited") .. " turns")
    return true, result
end

-- Set terrain condition
-- @param battleId: Battle instance identifier
-- @param terrainType: Terrain type to set
-- @param duration: Duration override (nil for default)
-- @param source: Source of terrain change
-- @return: Boolean indicating success and terrain details
function BattleConditions.setTerrain(battleId, terrainType, duration, source)
    if not battleId or not terrainType then
        return false, "Invalid parameters for terrain change"
    end
    
    local terrainData = BattleConditions.TerrainData[terrainType]
    if not terrainData and terrainType ~= BattleConditions.TerrainType.NONE then
        return false, "Unknown terrain type: " .. tostring(terrainType)
    end
    
    local actualDuration = duration
    if not actualDuration and terrainData then
        actualDuration = terrainData.default_duration
    end
    
    local result = {
        success = true,
        terrain_type = terrainType,
        terrain_name = terrainData and terrainData.name or "None",
        duration = actualDuration or 0,
        source = source,
        timestamp = os.time()
    }
    
    print("Terrain changed to " .. result.terrain_name .. " for " .. (actualDuration or "unlimited") .. " turns")
    return true, result
end

-- Process weather effects at end of turn
-- @param battleId: Battle instance identifier
-- @param weatherType: Current weather type
-- @param pokemonList: List of Pokemon to process
-- @return: Weather damage results and updated weather data
function BattleConditions.processWeatherDamage(battleId, weatherType, pokemonList)
    local weatherData = BattleConditions.WeatherData[weatherType]
    if not weatherData or not weatherData.damage_per_turn then
        return {}, nil
    end
    
    local damageResults = {}
    
    for _, pokemon in ipairs(pokemonList) do
        local takeDamage = true
        
        -- Check type immunity
        if weatherData.immune_types then
            for _, immuneType in ipairs(weatherData.immune_types) do
                if pokemon.types[1] == immuneType or pokemon.types[2] == immuneType then
                    takeDamage = false
                    break
                end
            end
        end
        
        -- Check ability protection
        if pokemon.ability then
            for _, protectiveAbility in ipairs(weatherData.abilities or {}) do
                if pokemon.ability == protectiveAbility then
                    takeDamage = false
                    break
                end
            end
        end
        
        if takeDamage then
            local maxHP = pokemon.maxHP or pokemon.stats[Enums.Stat.HP]
            local damage = 0
            
            if weatherData.damage_per_turn == "1/16" then
                damage = math.max(1, math.floor(maxHP / 16))
            elseif weatherData.damage_per_turn == "1/8" then
                damage = math.max(1, math.floor(maxHP / 8))
            end
            
            table.insert(damageResults, {
                pokemon_id = pokemon.id,
                damage = damage,
                weather = weatherData.name
            })
        end
    end
    
    return damageResults, nil
end

-- Process terrain healing effects
-- @param battleId: Battle instance identifier
-- @param terrainType: Current terrain type
-- @param pokemonList: List of Pokemon to process
-- @return: Terrain healing results
function BattleConditions.processTerrainHealing(battleId, terrainType, pokemonList)
    local terrainData = BattleConditions.TerrainData[terrainType]
    if not terrainData or not terrainData.healing_per_turn then
        return {}
    end
    
    local healingResults = {}
    
    for _, pokemon in ipairs(pokemonList) do
        -- Check if Pokemon is grounded (affected by terrain)
        if terrainData.grounded_only and not BattleConditions.isPokemonGrounded(pokemon) then
            goto continue
        end
        
        local maxHP = pokemon.maxHP or pokemon.stats[Enums.Stat.HP]
        local healing = 0
        
        if terrainData.healing_per_turn == "1/16" then
            healing = math.max(1, math.floor(maxHP / 16))
        end
        
        -- Only heal if not at full HP
        if pokemon.currentHP < maxHP then
            table.insert(healingResults, {
                pokemon_id = pokemon.id,
                healing = healing,
                terrain = terrainData.name
            })
        end
        
        ::continue::
    end
    
    return healingResults
end

-- Check if Pokemon is grounded (affected by terrain)
-- @param pokemon: Pokemon data
-- @return: Boolean indicating if Pokemon is grounded
function BattleConditions.isPokemonGrounded(pokemon)
    -- Flying type Pokemon are not grounded
    if pokemon.types[1] == Enums.PokemonType.FLYING or pokemon.types[2] == Enums.PokemonType.FLYING then
        return false
    end
    
    -- Levitate ability makes Pokemon not grounded
    if pokemon.ability == Enums.AbilityId.LEVITATE then
        return false
    end
    
    -- TODO: Add checks for Air Balloon, Magnet Rise, Telekinesis, etc.
    
    return true
end

-- Get weather move power modifier
-- @param moveType: Type of the move
-- @param weatherType: Current weather type
-- @return: Power multiplier (1.0 = no change)
function BattleConditions.getWeatherMovePowerModifier(moveType, weatherType)
    local weatherData = BattleConditions.WeatherData[weatherType]
    if not weatherData then
        return 1.0
    end
    
    if moveType == Enums.PokemonType.FIRE and weatherData.fire_boost then
        return weatherData.fire_boost
    elseif moveType == Enums.PokemonType.FIRE and weatherData.fire_nerf then
        return weatherData.fire_nerf
    elseif moveType == Enums.PokemonType.WATER and weatherData.water_boost then
        return weatherData.water_boost
    elseif moveType == Enums.PokemonType.WATER and weatherData.water_nerf then
        return weatherData.water_nerf
    end
    
    return 1.0
end

-- Get terrain move power modifier
-- @param moveType: Type of the move
-- @param terrainType: Current terrain type
-- @param pokemonGrounded: Whether the attacking Pokemon is grounded
-- @return: Power multiplier (1.0 = no change)
function BattleConditions.getTerrainMovePowerModifier(moveType, terrainType, pokemonGrounded)
    local terrainData = BattleConditions.TerrainData[terrainType]
    if not terrainData or not pokemonGrounded then
        return 1.0
    end
    
    if terrainData.power_boost and terrainData.power_boost[moveType] then
        return terrainData.power_boost[moveType]
    end
    
    return 1.0
end

-- Check if weather blocks a move type
-- @param moveType: Type of move being used
-- @param weatherType: Current weather type
-- @return: Boolean indicating if move is blocked
function BattleConditions.doesWeatherBlockMove(moveType, weatherType)
    local weatherData = BattleConditions.WeatherData[weatherType]
    if not weatherData then
        return false
    end
    
    if moveType == Enums.PokemonType.FIRE and weatherData.fire_immunity then
        return true
    elseif moveType == Enums.PokemonType.WATER and weatherData.water_immunity then
        return true
    end
    
    return false
end

-- Check if terrain blocks a move
-- @param moveData: Move data including type and priority
-- @param terrainType: Current terrain type
-- @param targetGrounded: Whether the target is grounded
-- @return: Boolean indicating if move is blocked
function BattleConditions.doesTerrainBlockMove(moveData, terrainType, targetGrounded)
    local terrainData = BattleConditions.TerrainData[terrainType]
    if not terrainData or not targetGrounded then
        return false
    end
    
    -- Misty Terrain blocks Dragon-type moves
    if terrainData.dragon_move_immunity and moveData.type == Enums.PokemonType.DRAGON then
        return true
    end
    
    -- Psychic Terrain blocks priority moves
    if terrainData.priority_move_immunity and moveData.priority and moveData.priority > 0 then
        return true
    end
    
    return false
end

-- Update weather/terrain duration
-- @param conditionType: "weather" or "terrain"
-- @param currentDuration: Current duration (-1 for permanent)
-- @return: New duration, boolean indicating if condition should end
function BattleConditions.updateDuration(conditionType, currentDuration)
    if currentDuration == -1 then
        return -1, false -- Permanent conditions don't expire
    end
    
    if currentDuration <= 1 then
        return 0, true -- Condition expires
    end
    
    return currentDuration - 1, false
end

-- Get weather healing modifier
-- @param healingMove: Name of the healing move
-- @param weatherType: Current weather type
-- @return: Healing fraction string or nil
function BattleConditions.getWeatherHealingModifier(healingMove, weatherType)
    local weatherData = BattleConditions.WeatherData[weatherType]
    if not weatherData or not weatherData.healing_moves then
        return nil
    end
    
    return weatherData.healing_moves[healingMove]
end

-- Check if terrain prevents status condition
-- @param statusEffect: Status effect to check
-- @param terrainType: Current terrain type
-- @param pokemonGrounded: Whether Pokemon is grounded
-- @return: Boolean indicating if status is prevented
function BattleConditions.doesTerrainPreventStatus(statusEffect, terrainType, pokemonGrounded)
    local terrainData = BattleConditions.TerrainData[terrainType]
    if not terrainData or not pokemonGrounded or not terrainData.status_prevention then
        return false
    end
    
    -- Check if terrain prevents all status conditions
    for _, preventedStatus in ipairs(terrainData.status_prevention) do
        if preventedStatus == "all" then
            return true
        elseif preventedStatus == "sleep" and statusEffect == "sleep" then
            return true
        end
    end
    
    return false
end

return BattleConditions