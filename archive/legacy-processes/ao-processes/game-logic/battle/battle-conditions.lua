-- Battle Conditions System
-- Comprehensive weather, terrain, and field effect management
-- Handles duration tracking, ability interactions, and move modifications

local BattleConditions = {}

-- Load dependencies
local Enums = require("data.constants.enums")
local BattleRNG = require("game-logic.rng.battle-rng")
local PositionalMechanics = require("game-logic.battle.positional-mechanics")

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

-- Field condition data integration with environmental system
BattleConditions.FieldConditionData = {
    [BattleConditions.FieldEffectType.TRICK_ROOM] = {
        name = "Trick Room",
        default_duration = 5,
        priority_reversal = true,
        interacts_with_weather = false,
        interacts_with_terrain = false,
        global_effect = true
    },
    [BattleConditions.FieldEffectType.WONDER_ROOM] = {
        name = "Wonder Room",
        default_duration = 5,
        stat_swap = true,
        interacts_with_weather = false,
        interacts_with_terrain = false,
        global_effect = true
    },
    [BattleConditions.FieldEffectType.MAGIC_ROOM] = {
        name = "Magic Room",
        default_duration = 5,
        suppresses_items = true,
        interacts_with_weather = false,
        interacts_with_terrain = false,
        global_effect = true
    },
    [BattleConditions.FieldEffectType.GRAVITY] = {
        name = "Gravity",
        default_duration = 5,
        grounds_pokemon = true,
        interacts_with_weather = false,
        interacts_with_terrain = true, -- Affects terrain interaction for flying types
        global_effect = true
    }
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

-- Process combined terrain and weather effects at end of turn
-- @param battleId: Battle instance identifier
-- @param weatherType: Current weather type
-- @param terrainType: Current terrain type
-- @param pokemonList: List of Pokemon to process
-- @return: Combined effects results
function BattleConditions.processCombinedEnvironmentalEffects(battleId, weatherType, terrainType, pokemonList)
    local results = {
        weather_damage = {},
        terrain_healing = {},
        combined_effects = {}
    }
    
    -- Process weather damage first
    local weatherDamage = BattleConditions.processWeatherDamage(battleId, weatherType, pokemonList)
    results.weather_damage = weatherDamage
    
    -- Process terrain healing second
    local terrainHealing = BattleConditions.processTerrainHealing(battleId, terrainType, pokemonList)
    results.terrain_healing = terrainHealing
    
    -- Check for conflicts and precedence
    for _, pokemon in ipairs(pokemonList) do
        local pokemonId = pokemon.id
        local weatherEffect = nil
        local terrainEffect = nil
        
        -- Find weather effect for this Pokemon
        for _, effect in ipairs(weatherDamage) do
            if effect.pokemon_id == pokemonId then
                weatherEffect = effect
                break
            end
        end
        
        -- Find terrain effect for this Pokemon
        for _, effect in ipairs(terrainHealing) do
            if effect.pokemon_id == pokemonId then
                terrainEffect = effect
                break
            end
        end
        
        -- Handle combined effects (terrain healing vs weather damage)
        if weatherEffect and terrainEffect then
            local netEffect = terrainEffect.healing - weatherEffect.damage
            table.insert(results.combined_effects, {
                pokemon_id = pokemonId,
                weather_damage = weatherEffect.damage,
                terrain_healing = terrainEffect.healing,
                net_effect = netEffect,
                effect_type = netEffect > 0 and "heal" or "damage",
                final_amount = math.abs(netEffect)
            })
        end
    end
    
    return results
end

-- Check terrain-weather interaction conflicts
-- @param weatherType: Current weather type
-- @param terrainType: Current terrain type
-- @return: Interaction information
function BattleConditions.getTerrainWeatherInteractions(weatherType, terrainType)
    local interactions = {
        conflicts = {},
        synergies = {},
        precedence_rules = {}
    }
    
    -- Terrain and weather can coexist, but some effects may interact
    if weatherType ~= BattleConditions.WeatherType.NONE and terrainType ~= BattleConditions.TerrainType.NONE then
        -- Grassy Terrain healing vs weather damage
        if terrainType == BattleConditions.TerrainType.GRASSY then
            if weatherType == BattleConditions.WeatherType.SANDSTORM or weatherType == BattleConditions.WeatherType.HAIL then
                table.insert(interactions.conflicts, {
                    type = "healing_vs_damage",
                    description = "Grassy Terrain healing competes with weather damage",
                    resolution = "Both effects apply, net result calculated"
                })
            end
        end
        
        -- Electric Terrain with weather interactions (no direct conflicts)
        if terrainType == BattleConditions.TerrainType.ELECTRIC then
            table.insert(interactions.synergies, {
                type = "electric_weather_neutral",
                description = "Electric Terrain and weather effects are independent"
            })
        end
    end
    
    return interactions
end

-- Get combined environmental move power modifier
-- @param moveType: Type of the move
-- @param moveData: Move data including name and properties
-- @param weatherType: Current weather type
-- @param terrainType: Current terrain type
-- @param attackerGrounded: Whether attacker is grounded
-- @return: Combined power multiplier
function BattleConditions.getCombinedEnvironmentalMovePowerModifier(moveType, moveData, weatherType, terrainType, attackerGrounded)
    local weatherModifier = BattleConditions.getWeatherMovePowerModifier(moveType, weatherType)
    local terrainModifier = BattleConditions.getTerrainMovePowerModifier(moveType, terrainType, attackerGrounded)
    
    -- Weather and terrain modifiers multiply (they don't stack additively)
    local combinedModifier = weatherModifier * terrainModifier
    
    -- Special case: Grassy Terrain reduces power of ground-based moves
    local terrainData = BattleConditions.TerrainData[terrainType]
    if terrainData and terrainData.move_power_reduction and moveData.name then
        local moveName = string.lower(moveData.name)
        if terrainData.move_power_reduction[moveName] then
            combinedModifier = combinedModifier * terrainData.move_power_reduction[moveName]
        end
    end
    
    return combinedModifier
end

-- Check if environmental conditions block a move
-- @param moveData: Move data including type and properties
-- @param weatherType: Current weather type
-- @param terrainType: Current terrain type
-- @param targetGrounded: Whether target is grounded
-- @return: Boolean indicating if move is blocked, reason string
function BattleConditions.doEnvironmentalConditionsBlockMove(moveData, weatherType, terrainType, targetGrounded)
    -- Check weather blocks first
    if BattleConditions.doesWeatherBlockMove(moveData.type, weatherType) then
        local weatherData = BattleConditions.WeatherData[weatherType]
        return true, "Move blocked by " .. (weatherData and weatherData.name or "weather")
    end
    
    -- Check terrain blocks second
    if BattleConditions.doesTerrainBlockMove(moveData, terrainType, targetGrounded) then
        local terrainData = BattleConditions.TerrainData[terrainType]
        return true, "Move blocked by " .. (terrainData and terrainData.name or "terrain")
    end
    
    return false, nil
end

-- Get environmental condition priority for field effect removal
-- @param weatherType: Current weather type
-- @param terrainType: Current terrain type
-- @return: Priority information for moves like Defog
function BattleConditions.getEnvironmentalRemovalPriority(weatherType, terrainType)
    local priorities = {}
    
    -- Weather removal priority (some weather is harder to remove)
    if weatherType ~= BattleConditions.WeatherType.NONE then
        local weatherData = BattleConditions.WeatherData[weatherType]
        local priority = (weatherData and weatherData.default_duration == -1) and "high" or "normal"
        table.insert(priorities, {
            condition = "weather",
            type = weatherType,
            priority = priority,
            name = weatherData and weatherData.name or "Unknown Weather"
        })
    end
    
    -- Terrain removal priority
    if terrainType ~= BattleConditions.TerrainType.NONE then
        local terrainData = BattleConditions.TerrainData[terrainType]
        table.insert(priorities, {
            condition = "terrain",
            type = terrainType,
            priority = "normal",
            name = terrainData and terrainData.name or "Unknown Terrain"
        })
    end
    
    return priorities
end

-- Environmental Effect Precedence System
-- Complex interactions between weather, terrain, status effects, and abilities
-- Implements proper game-accurate precedence rules for environmental effects

-- Environmental effect processing order constants
BattleConditions.EffectPrecedence = {
    ABILITY_SUPPRESSION = 1,
    WEATHER_EFFECTS = 2,
    TERRAIN_EFFECTS = 3,
    STATUS_EFFECTS = 4,
    ENVIRONMENTAL_DAMAGE = 5,
    ENVIRONMENTAL_HEALING = 6
}

-- Environmental interaction types
BattleConditions.InteractionType = {
    SUPPRESSION = "suppression",
    STACKING = "stacking", 
    REPLACEMENT = "replacement",
    PRECEDENCE = "precedence"
}

-- Process all environmental effects with proper precedence
-- @param battleId: Battle instance identifier
-- @param pokemonList: List of all active Pokemon
-- @param weatherType: Current weather type
-- @param terrainType: Current terrain type
-- @param activeAbilities: List of active abilities that may suppress effects
-- @return: Processed environmental effects with proper precedence resolution
function BattleConditions.processEnvironmentalEffectPrecedence(battleId, pokemonList, weatherType, terrainType, activeAbilities)
    local results = {
        suppressed_effects = {},
        active_effects = {},
        interaction_log = {},
        final_effects = {}
    }
    
    -- Step 1: Check ability suppression (highest precedence)
    local weatherSuppressed, suppressingAbility = BattleConditions.checkAbilityWeatherSuppression(pokemonList, weatherType)
    
    if weatherSuppressed then
        table.insert(results.suppressed_effects, {
            effect_type = "weather",
            weather_type = weatherType,
            suppressed_by = suppressingAbility,
            precedence_level = BattleConditions.EffectPrecedence.ABILITY_SUPPRESSION
        })
        weatherType = BattleConditions.WeatherType.NONE -- Suppress weather for processing
    end
    
    -- Step 2: Process weather effects (if not suppressed)
    if weatherType ~= BattleConditions.WeatherType.NONE then
        local weatherEffects = BattleConditions.processWeatherEffectsWithPrecedence(battleId, pokemonList, weatherType)
        for _, effect in ipairs(weatherEffects) do
            effect.precedence_level = BattleConditions.EffectPrecedence.WEATHER_EFFECTS
            table.insert(results.active_effects, effect)
        end
    end
    
    -- Step 3: Process terrain effects (terrain takes precedence over weather for grounded Pokemon)
    if terrainType ~= BattleConditions.TerrainType.NONE then
        local terrainEffects = BattleConditions.processTerrainEffectsWithPrecedence(battleId, pokemonList, terrainType, weatherType)
        for _, effect in ipairs(terrainEffects) do
            effect.precedence_level = BattleConditions.EffectPrecedence.TERRAIN_EFFECTS
            table.insert(results.active_effects, effect)
        end
    end
    
    -- Step 4: Resolve conflicts and apply precedence rules
    local finalEffects = BattleConditions.resolveEnvironmentalPrecedence(results.active_effects, pokemonList)
    results.final_effects = finalEffects
    
    -- Step 5: Log interactions for debugging and notifications
    results.interaction_log = BattleConditions.generateInteractionLog(results.suppressed_effects, results.active_effects, finalEffects)
    
    return results
end

-- Check if any abilities suppress weather effects
-- @param pokemonList: List of active Pokemon
-- @param weatherType: Current weather type
-- @return: Boolean if suppressed, suppressing ability name
function BattleConditions.checkAbilityWeatherSuppression(pokemonList, weatherType)
    local WeatherAbilities = require("game-logic.battle.weather-abilities")
    return WeatherAbilities.isWeatherSuppressed(pokemonList, weatherType)
end

-- Process weather effects with precedence tracking
-- @param battleId: Battle instance identifier
-- @param pokemonList: List of Pokemon to process
-- @param weatherType: Current weather type
-- @return: Weather effects with precedence information
function BattleConditions.processWeatherEffectsWithPrecedence(battleId, pokemonList, weatherType)
    local effects = {}
    
    -- Process weather damage
    local weatherDamage = BattleConditions.processWeatherDamage(battleId, weatherType, pokemonList)
    for _, damage in ipairs(weatherDamage) do
        table.insert(effects, {
            effect_type = "weather_damage",
            pokemon_id = damage.pokemon_id,
            damage = damage.damage,
            weather = damage.weather,
            timing = "end_of_turn",
            priority = 3 -- Weather damage has medium priority
        })
    end
    
    -- Process weather-related ability effects
    local WeatherAbilities = require("game-logic.battle.weather-abilities")
    local abilityEffects = WeatherAbilities.processEndOfTurnAbilityEffects(pokemonList, weatherType)
    for _, effect in ipairs(abilityEffects) do
        table.insert(effects, {
            effect_type = "weather_ability",
            pokemon_id = effect.pokemon_id,
            ability_name = effect.ability_name,
            healing = effect.healing,
            damage = effect.damage,
            source = effect.source,
            timing = "end_of_turn",
            priority = 2 -- Ability effects have higher priority than weather damage
        })
    end
    
    return effects
end

-- Process terrain effects with precedence tracking
-- @param battleId: Battle instance identifier
-- @param pokemonList: List of Pokemon to process
-- @param terrainType: Current terrain type
-- @param weatherType: Current weather type (for interaction checks)
-- @return: Terrain effects with precedence information
function BattleConditions.processTerrainEffectsWithPrecedence(battleId, pokemonList, terrainType, weatherType)
    local effects = {}
    
    -- Process terrain healing
    local terrainHealing = BattleConditions.processTerrainHealing(battleId, terrainType, pokemonList)
    for _, healing in ipairs(terrainHealing) do
        table.insert(effects, {
            effect_type = "terrain_healing",
            pokemon_id = healing.pokemon_id,
            healing = healing.healing,
            terrain = healing.terrain,
            timing = "end_of_turn",
            priority = 1, -- Terrain healing has highest priority
            grounded_only = true
        })
    end
    
    return effects
end

-- Resolve environmental effect precedence conflicts
-- @param activeEffects: List of all active environmental effects
-- @param pokemonList: List of Pokemon for context
-- @return: Final effects after precedence resolution
function BattleConditions.resolveEnvironmentalPrecedence(activeEffects, pokemonList)
    local finalEffects = {}
    local pokemonEffectMap = {} -- Group effects by Pokemon
    
    -- Group effects by Pokemon ID
    for _, effect in ipairs(activeEffects) do
        local pokemonId = effect.pokemon_id
        if not pokemonEffectMap[pokemonId] then
            pokemonEffectMap[pokemonId] = {}
        end
        table.insert(pokemonEffectMap[pokemonId], effect)
    end
    
    -- Resolve conflicts for each Pokemon
    for pokemonId, effects in pairs(pokemonEffectMap) do
        local resolvedEffect = BattleConditions.resolvePokemonEffectConflicts(effects, pokemonId, pokemonList)
        if resolvedEffect then
            table.insert(finalEffects, resolvedEffect)
        end
    end
    
    return finalEffects
end

-- Resolve effect conflicts for a single Pokemon
-- @param effects: List of effects affecting this Pokemon
-- @param pokemonId: Pokemon ID for context
-- @param pokemonList: Full Pokemon list for lookups
-- @return: Final resolved effect or nil
function BattleConditions.resolvePokemonEffectConflicts(effects, pokemonId, pokemonList)
    if #effects == 0 then
        return nil
    end
    
    if #effects == 1 then
        return effects[1]
    end
    
    -- Sort by priority (higher priority = lower number)
    table.sort(effects, function(a, b) return (a.priority or 999) < (b.priority or 999) end)
    
    -- Check if Pokemon is grounded for terrain effects
    local pokemon = BattleConditions.findPokemonById(pokemonId, pokemonList)
    local isGrounded = pokemon and BattleConditions.isPokemonGrounded(pokemon)
    
    local totalHealing = 0
    local totalDamage = 0
    local sources = {}
    
    -- Process effects in priority order
    for _, effect in ipairs(effects) do
        -- Terrain effects only apply to grounded Pokemon
        if effect.grounded_only and not isGrounded then
            goto continue
        end
        
        if effect.healing then
            totalHealing = totalHealing + effect.healing
            table.insert(sources, effect.effect_type .. ":" .. (effect.ability_name or effect.terrain or effect.weather or "unknown"))
        end
        
        if effect.damage then
            totalDamage = totalDamage + effect.damage
            table.insert(sources, effect.effect_type .. ":" .. (effect.ability_name or effect.terrain or effect.weather or "unknown"))
        end
        
        ::continue::
    end
    
    -- Calculate net effect
    local netAmount = totalHealing - totalDamage
    
    if netAmount == 0 then
        return nil -- No net effect
    end
    
    return {
        effect_type = netAmount > 0 and "net_healing" or "net_damage",
        pokemon_id = pokemonId,
        healing = netAmount > 0 and netAmount or 0,
        damage = netAmount < 0 and math.abs(netAmount) or 0,
        net_amount = netAmount,
        sources = sources,
        timing = "end_of_turn",
        resolved_conflicts = #effects > 1
    }
end

-- Find Pokemon by ID in pokemon list
-- @param pokemonId: Pokemon ID to find
-- @param pokemonList: List of Pokemon to search
-- @return: Pokemon data or nil
function BattleConditions.findPokemonById(pokemonId, pokemonList)
    for _, pokemon in ipairs(pokemonList) do
        if pokemon.id == pokemonId then
            return pokemon
        end
    end
    return nil
end

-- Generate interaction log for debugging and notifications
-- @param suppressedEffects: List of suppressed effects
-- @param activeEffects: List of active effects
-- @param finalEffects: List of final resolved effects
-- @return: Detailed interaction log
function BattleConditions.generateInteractionLog(suppressedEffects, activeEffects, finalEffects)
    local log = {
        timestamp = os.time(),
        suppression_count = #suppressedEffects,
        active_count = #activeEffects,
        final_count = #finalEffects,
        interactions = {}
    }
    
    -- Log suppressions
    for _, suppressed in ipairs(suppressedEffects) do
        table.insert(log.interactions, {
            type = "suppression",
            description = suppressed.effect_type .. " suppressed by " .. suppressed.suppressed_by,
            precedence_level = suppressed.precedence_level
        })
    end
    
    -- Log conflicts resolved
    for _, final in ipairs(finalEffects) do
        if final.resolved_conflicts then
            table.insert(log.interactions, {
                type = "conflict_resolution",
                description = "Multiple effects resolved for Pokemon " .. final.pokemon_id,
                sources = final.sources,
                net_effect = final.net_amount
            })
        end
    end
    
    return log
end

-- Check environmental effect stacking compatibility
-- @param weatherType: Current weather type
-- @param terrainType: Current terrain type
-- @return: Stacking information and compatibility
function BattleConditions.checkEnvironmentalEffectStacking(weatherType, terrainType)
    local stacking = {
        compatible = true,
        conflicts = {},
        synergies = {},
        precedence_notes = {}
    }
    
    -- Weather and terrain generally stack, but with specific rules
    if weatherType ~= BattleConditions.WeatherType.NONE and terrainType ~= BattleConditions.TerrainType.NONE then
        stacking.compatible = true
        table.insert(stacking.precedence_notes, "Terrain effects take precedence over weather for grounded Pokemon")
        
        -- Check for specific interactions
        if terrainType == BattleConditions.TerrainType.GRASSY then
            if weatherType == BattleConditions.WeatherType.SANDSTORM or weatherType == BattleConditions.WeatherType.HAIL then
                table.insert(stacking.conflicts, {
                    description = "Grassy Terrain healing vs weather damage",
                    resolution = "Both effects apply, net healing/damage calculated"
                })
            end
        end
    end
    
    return stacking
end

-- Move-Environment Interaction System
-- Complex interactions between moves and environmental conditions
-- Implements Hurricane, Solar Beam, Thunder, and other environment-dependent moves

-- Weather-dependent move modifications
BattleConditions.WeatherMoveData = {
    ["hurricane"] = {
        weather_effects = {
            [BattleConditions.WeatherType.RAIN] = {
                accuracy_override = 100, -- Never misses in rain
                description = "Hurricane never misses in rain"
            },
            [BattleConditions.WeatherType.HARSH_SUN] = {
                accuracy_modifier = 0.5, -- 50% accuracy in harsh sun
                description = "Hurricane has reduced accuracy in harsh sun"
            }
        },
        base_accuracy = 70
    },
    ["thunder"] = {
        weather_effects = {
            [BattleConditions.WeatherType.RAIN] = {
                accuracy_override = 100, -- Never misses in rain
                description = "Thunder never misses in rain"
            },
            [BattleConditions.WeatherType.SUNNY] = {
                accuracy_modifier = 0.5, -- 50% accuracy in sun
                description = "Thunder has reduced accuracy in sun"
            },
            [BattleConditions.WeatherType.HARSH_SUN] = {
                accuracy_modifier = 0.5,
                description = "Thunder has reduced accuracy in harsh sun"
            }
        },
        base_accuracy = 70
    },
    ["solar_beam"] = {
        weather_effects = {
            [BattleConditions.WeatherType.SUNNY] = {
                charge_skip = true, -- Instant charging in sun
                description = "Solar Beam charges instantly in sun"
            },
            [BattleConditions.WeatherType.HARSH_SUN] = {
                charge_skip = true,
                power_boost = 1.0, -- No power reduction
                description = "Solar Beam charges instantly with full power in harsh sun"
            },
            [BattleConditions.WeatherType.RAIN] = {
                power_modifier = 0.5, -- Half power in rain
                description = "Solar Beam has reduced power in rain"
            },
            [BattleConditions.WeatherType.SANDSTORM] = {
                power_modifier = 0.5,
                description = "Solar Beam has reduced power in sandstorm"
            },
            [BattleConditions.WeatherType.HAIL] = {
                power_modifier = 0.5,
                description = "Solar Beam has reduced power in hail"
            }
        },
        base_power = 120,
        requires_charging = true
    },
    ["blizzard"] = {
        weather_effects = {
            [BattleConditions.WeatherType.HAIL] = {
                accuracy_override = 100, -- Never misses in hail
                description = "Blizzard never misses in hail"
            }
        },
        base_accuracy = 70
    },
    ["moonlight"] = {
        weather_effects = {
            [BattleConditions.WeatherType.SUNNY] = {
                healing_fraction = "2/3", -- 2/3 HP in sun
                description = "Moonlight restores more HP in sun"
            },
            [BattleConditions.WeatherType.RAIN] = {
                healing_fraction = "1/4", -- 1/4 HP in rain
                description = "Moonlight restores less HP in rain"
            },
            [BattleConditions.WeatherType.SANDSTORM] = {
                healing_fraction = "1/4",
                description = "Moonlight restores less HP in sandstorm"
            },
            [BattleConditions.WeatherType.HAIL] = {
                healing_fraction = "1/4",
                description = "Moonlight restores less HP in hail"
            }
        },
        base_healing = "1/2" -- Normal conditions
    },
    ["synthesis"] = {
        weather_effects = {
            [BattleConditions.WeatherType.SUNNY] = {
                healing_fraction = "2/3",
                description = "Synthesis restores more HP in sun"
            },
            [BattleConditions.WeatherType.RAIN] = {
                healing_fraction = "1/4",
                description = "Synthesis restores less HP in rain"
            },
            [BattleConditions.WeatherType.SANDSTORM] = {
                healing_fraction = "1/4",
                description = "Synthesis restores less HP in sandstorm"
            },
            [BattleConditions.WeatherType.HAIL] = {
                healing_fraction = "1/4",
                description = "Synthesis restores less HP in hail"
            }
        },
        base_healing = "1/2"
    },
    ["morning_sun"] = {
        weather_effects = {
            [BattleConditions.WeatherType.SUNNY] = {
                healing_fraction = "2/3",
                description = "Morning Sun restores more HP in sun"
            },
            [BattleConditions.WeatherType.RAIN] = {
                healing_fraction = "1/4",
                description = "Morning Sun restores less HP in rain"
            },
            [BattleConditions.WeatherType.SANDSTORM] = {
                healing_fraction = "1/4",
                description = "Morning Sun restores less HP in sandstorm"
            },
            [BattleConditions.WeatherType.HAIL] = {
                healing_fraction = "1/4",
                description = "Morning Sun restores less HP in hail"
            }
        },
        base_healing = "1/2"
    }
}

-- Get weather-dependent move accuracy modification
-- @param moveName: Name of the move (lowercase)
-- @param weatherType: Current weather type
-- @param baseAccuracy: Base accuracy of the move
-- @return: Modified accuracy, whether it's an override
function BattleConditions.getWeatherMoveAccuracyModifier(moveName, weatherType, baseAccuracy)
    local moveData = BattleConditions.WeatherMoveData[string.lower(moveName)]
    if not moveData or not moveData.weather_effects then
        return baseAccuracy, false
    end
    
    local weatherEffect = moveData.weather_effects[weatherType]
    if not weatherEffect then
        return baseAccuracy, false
    end
    
    if weatherEffect.accuracy_override then
        return weatherEffect.accuracy_override, true
    elseif weatherEffect.accuracy_modifier then
        return math.floor(baseAccuracy * weatherEffect.accuracy_modifier), false
    end
    
    return baseAccuracy, false
end

-- Get weather-dependent move power modification
-- @param moveName: Name of the move (lowercase)
-- @param weatherType: Current weather type
-- @param basePower: Base power of the move
-- @return: Modified power, description of effect
function BattleConditions.getWeatherMovePowerModifier(moveName, weatherType, basePower)
    local moveData = BattleConditions.WeatherMoveData[string.lower(moveName)]
    if not moveData or not moveData.weather_effects then
        return basePower, nil
    end
    
    local weatherEffect = moveData.weather_effects[weatherType]
    if not weatherEffect then
        return basePower, nil
    end
    
    if weatherEffect.power_modifier then
        local modifiedPower = math.floor(basePower * weatherEffect.power_modifier)
        return modifiedPower, weatherEffect.description
    elseif weatherEffect.power_boost then
        return basePower, weatherEffect.description -- No modification, just description
    end
    
    return basePower, weatherEffect.description
end

-- Check if move requires charging and can skip charge phase
-- @param moveName: Name of the move (lowercase)
-- @param weatherType: Current weather type
-- @return: Should skip charge phase, description
function BattleConditions.canSkipChargePhase(moveName, weatherType)
    local moveData = BattleConditions.WeatherMoveData[string.lower(moveName)]
    if not moveData or not moveData.requires_charging or not moveData.weather_effects then
        return false, nil
    end
    
    local weatherEffect = moveData.weather_effects[weatherType]
    if weatherEffect and weatherEffect.charge_skip then
        return true, weatherEffect.description
    end
    
    return false, nil
end

-- Get weather-dependent healing amount for moves
-- @param moveName: Name of the move (lowercase)
-- @param weatherType: Current weather type
-- @param maxHP: Pokemon's maximum HP
-- @return: Healing amount, description
function BattleConditions.getWeatherMoveHealingAmount(moveName, weatherType, maxHP)
    local moveData = BattleConditions.WeatherMoveData[string.lower(moveName)]
    if not moveData then
        return 0, nil
    end
    
    local healingFraction = moveData.base_healing
    local description = "Standard healing"
    
    -- Check for weather-specific healing
    if moveData.weather_effects and moveData.weather_effects[weatherType] then
        local weatherEffect = moveData.weather_effects[weatherType]
        if weatherEffect.healing_fraction then
            healingFraction = weatherEffect.healing_fraction
            description = weatherEffect.description
        end
    end
    
    -- Convert fraction to actual healing amount
    local healingAmount = 0
    if healingFraction == "1/2" then
        healingAmount = math.floor(maxHP / 2)
    elseif healingFraction == "2/3" then
        healingAmount = math.floor(maxHP * 2 / 3)
    elseif healingFraction == "1/4" then
        healingAmount = math.floor(maxHP / 4)
    elseif healingFraction == "3/4" then
        healingAmount = math.floor(maxHP * 3 / 4)
    end
    
    return math.max(1, healingAmount), description
end

-- Check terrain effects on move power and blocking
-- @param moveName: Name of the move (lowercase)
-- @param moveData: Complete move data including type and priority
-- @param terrainType: Current terrain type
-- @param attackerGrounded: Whether attacker is grounded
-- @param targetGrounded: Whether target is grounded
-- @return: Power modifier, blocked status, description
function BattleConditions.getTerrainMoveInteraction(moveName, moveData, terrainType, attackerGrounded, targetGrounded)
    local powerModifier = 1.0
    local blocked = false
    local description = nil
    
    local terrainData = BattleConditions.TerrainData[terrainType]
    if not terrainData then
        return powerModifier, blocked, description
    end
    
    -- Check power boost for grounded attackers
    if attackerGrounded and terrainData.power_boost and moveData.type then
        local boost = terrainData.power_boost[moveData.type]
        if boost then
            powerModifier = boost
            description = terrainData.name .. " boosts " .. moveData.type .. " move power"
        end
    end
    
    -- Check move blocking effects
    if targetGrounded then
        -- Dragon move immunity in Misty Terrain
        if terrainData.dragon_move_immunity and moveData.type == Enums.PokemonType.DRAGON then
            blocked = true
            description = terrainData.name .. " blocks Dragon-type moves"
        end
        
        -- Priority move blocking in Psychic Terrain
        if terrainData.priority_move_immunity and moveData.priority and moveData.priority > 0 then
            blocked = true
            description = terrainData.name .. " blocks priority moves"
        end
    end
    
    -- Check move power reduction (Grassy Terrain reducing ground moves)
    if terrainData.move_power_reduction and moveName then
        local reduction = terrainData.move_power_reduction[string.lower(moveName)]
        if reduction then
            powerModifier = powerModifier * reduction
            description = (description and (description .. ", ") or "") .. terrainData.name .. " reduces " .. moveName .. " power"
        end
    end
    
    return powerModifier, blocked, description
end

-- Process complete move-environment interaction
-- @param moveName: Name of the move
-- @param moveData: Complete move data
-- @param weatherType: Current weather type
-- @param terrainType: Current terrain type
-- @param attackerGrounded: Whether attacker is grounded
-- @param targetGrounded: Whether target is grounded
-- @param attackerMaxHP: Attacker's max HP (for healing moves)
-- @return: Complete interaction results
function BattleConditions.processMovePveEnvironmentInteraction(moveName, moveData, weatherType, terrainType, attackerGrounded, targetGrounded, attackerMaxHP)
    local results = {
        accuracy_modified = false,
        power_modified = false,
        blocked = false,
        healing_modified = false,
        charge_skipped = false,
        effects = {}
    }
    
    local lowerMoveName = string.lower(moveName)
    
    -- Weather-based accuracy modifications
    local modifiedAccuracy, isOverride = BattleConditions.getWeatherMoveAccuracyModifier(lowerMoveName, weatherType, moveData.accuracy or 100)
    if modifiedAccuracy ~= (moveData.accuracy or 100) then
        results.accuracy_modified = true
        results.final_accuracy = modifiedAccuracy
        results.accuracy_override = isOverride
        table.insert(results.effects, {
            type = "accuracy_change",
            source = "weather",
            value = modifiedAccuracy,
            is_override = isOverride
        })
    end
    
    -- Weather-based power modifications
    local modifiedPower, powerDescription = BattleConditions.getWeatherMovePowerModifier(lowerMoveName, weatherType, moveData.power or 0)
    if modifiedPower ~= (moveData.power or 0) then
        results.power_modified = true
        results.final_power = modifiedPower
        table.insert(results.effects, {
            type = "power_change",
            source = "weather",
            value = modifiedPower,
            description = powerDescription
        })
    end
    
    -- Terrain-based interactions
    local terrainPowerModifier, terrainBlocked, terrainDescription = BattleConditions.getTerrainMoveInteraction(lowerMoveName, moveData, terrainType, attackerGrounded, targetGrounded)
    
    if terrainBlocked then
        results.blocked = true
        table.insert(results.effects, {
            type = "move_blocked",
            source = "terrain",
            description = terrainDescription
        })
    elseif terrainPowerModifier ~= 1.0 then
        results.power_modified = true
        local currentPower = results.final_power or moveData.power or 0
        results.final_power = math.floor(currentPower * terrainPowerModifier)
        table.insert(results.effects, {
            type = "power_change",
            source = "terrain",
            modifier = terrainPowerModifier,
            description = terrainDescription
        })
    end
    
    -- Charge phase skipping
    local canSkipCharge, chargeDescription = BattleConditions.canSkipChargePhase(lowerMoveName, weatherType)
    if canSkipCharge then
        results.charge_skipped = true
        table.insert(results.effects, {
            type = "charge_skipped",
            source = "weather",
            description = chargeDescription
        })
    end
    
    -- Healing move modifications
    if attackerMaxHP and attackerMaxHP > 0 then
        local healingAmount, healingDescription = BattleConditions.getWeatherMoveHealingAmount(lowerMoveName, weatherType, attackerMaxHP)
        if healingAmount > 0 then
            results.healing_modified = true
            results.healing_amount = healingAmount
            table.insert(results.effects, {
                type = "healing_change",
                source = "weather",
                amount = healingAmount,
                description = healingDescription
            })
        end
    end
    
    return results
end

-- Environmental Healing System
-- Comprehensive environmental healing with ability interactions and precedence

-- Process all environmental healing effects with proper precedence
-- @param battleId: Battle instance identifier
-- @param pokemonList: List of Pokemon to process
-- @param weatherType: Current weather type
-- @param terrainType: Current terrain type
-- @return: Complete healing results with precedence resolution
function BattleConditions.processEnvironmentalHealing(battleId, pokemonList, weatherType, terrainType)
    local healingResults = {
        total_healers = 0,
        healing_effects = {},
        ability_healing = {},
        terrain_healing = {},
        precedence_resolved = {}
    }
    
    -- Process ability-based healing (Rain Dish, Ice Body, Dry Skin)
    local WeatherAbilities = require("game-logic.battle.weather-abilities")
    local abilityHealing = WeatherAbilities.processEndOfTurnAbilityEffects(pokemonList, weatherType)
    
    for _, healing in ipairs(abilityHealing) do
        if healing.effect_type == "healing" then
            table.insert(healingResults.ability_healing, healing)
            table.insert(healingResults.healing_effects, {
                pokemon_id = healing.pokemon_id,
                source = "ability",
                ability_name = healing.ability_name,
                healing = healing.healing,
                priority = 1 -- Ability healing has highest priority
            })
        end
    end
    
    -- Process terrain-based healing (Grassy Terrain)
    local terrainHealing = BattleConditions.processTerrainHealing(battleId, terrainType, pokemonList)
    for _, healing in ipairs(terrainHealing) do
        table.insert(healingResults.terrain_healing, healing)
        table.insert(healingResults.healing_effects, {
            pokemon_id = healing.pokemon_id,
            source = "terrain",
            terrain_name = healing.terrain,
            healing = healing.healing,
            priority = 2 -- Terrain healing has second priority
        })
    end
    
    -- Resolve healing precedence and stacking
    local finalHealing = BattleConditions.resolveHealingPrecedence(healingResults.healing_effects, pokemonList)
    healingResults.precedence_resolved = finalHealing
    healingResults.total_healers = #finalHealing
    
    return healingResults
end

-- Resolve healing precedence for Pokemon with multiple healing sources
-- @param healingEffects: List of all healing effects
-- @param pokemonList: List of Pokemon for context
-- @return: Final healing amounts after precedence resolution
function BattleConditions.resolveHealingPrecedence(healingEffects, pokemonList)
    local pokemonHealingMap = {}
    local finalHealing = {}
    
    -- Group healing effects by Pokemon
    for _, effect in ipairs(healingEffects) do
        local pokemonId = effect.pokemon_id
        if not pokemonHealingMap[pokemonId] then
            pokemonHealingMap[pokemonId] = {}
        end
        table.insert(pokemonHealingMap[pokemonId], effect)
    end
    
    -- Resolve healing for each Pokemon
    for pokemonId, effects in pairs(pokemonHealingMap) do
        local pokemon = BattleConditions.findPokemonById(pokemonId, pokemonList)
        if pokemon then
            local totalHealing = 0
            local sources = {}
            
            -- Sort by priority (lower number = higher priority)
            table.sort(effects, function(a, b) return a.priority < b.priority end)
            
            for _, effect in ipairs(effects) do
                -- Check if Pokemon is grounded for terrain effects
                if effect.source == "terrain" and not BattleConditions.isPokemonGrounded(pokemon) then
                    goto continue
                end
                
                totalHealing = totalHealing + effect.healing
                table.insert(sources, effect.source .. ":" .. (effect.ability_name or effect.terrain_name or "unknown"))
                
                ::continue::
            end
            
            if totalHealing > 0 then
                -- Cap healing at missing HP
                local maxHP = pokemon.maxHP or pokemon.stats[Enums.Stat.HP] or 100
                local currentHP = pokemon.currentHP or maxHP
                local actualHealing = math.min(totalHealing, maxHP - currentHP)
                
                if actualHealing > 0 then
                    table.insert(finalHealing, {
                        pokemon_id = pokemonId,
                        pokemon_name = pokemon.name or "Unknown Pokemon",
                        total_healing = actualHealing,
                        raw_healing = totalHealing,
                        sources = sources,
                        multiple_sources = #effects > 1
                    })
                end
            end
        end
    end
    
    return finalHealing
end

-- Environmental Damage Precedence System
-- Proper ordering and calculation of environmental damage effects

-- Process all environmental damage effects with proper precedence
-- @param battleId: Battle instance identifier
-- @param pokemonList: List of Pokemon to process
-- @param weatherType: Current weather type
-- @param terrainType: Current terrain type
-- @return: Complete damage results with precedence resolution
function BattleConditions.processEnvironmentalDamage(battleId, pokemonList, weatherType, terrainType)
    local damageResults = {
        total_damaged = 0,
        damage_effects = {},
        weather_damage = {},
        ability_damage = {},
        precedence_resolved = {}
    }
    
    -- Process weather damage (sandstorm, hail)
    local weatherDamage = BattleConditions.processWeatherDamage(battleId, weatherType, pokemonList)
    for _, damage in ipairs(weatherDamage) do
        table.insert(damageResults.weather_damage, damage)
        table.insert(damageResults.damage_effects, {
            pokemon_id = damage.pokemon_id,
            source = "weather",
            weather_name = damage.weather,
            damage = damage.damage,
            priority = 3 -- Weather damage has lower priority
        })
    end
    
    -- Process ability-based damage (Solar Power, Dry Skin in sun)
    local WeatherAbilities = require("game-logic.battle.weather-abilities")
    local abilityEffects = WeatherAbilities.processEndOfTurnAbilityEffects(pokemonList, weatherType)
    
    for _, effect in ipairs(abilityEffects) do
        if effect.effect_type == "damage" then
            table.insert(damageResults.ability_damage, effect)
            table.insert(damageResults.damage_effects, {
                pokemon_id = effect.pokemon_id,
                source = "ability",
                ability_name = effect.ability_name,
                damage = effect.damage,
                priority = 2 -- Ability damage has higher priority than weather
            })
        end
    end
    
    -- Resolve damage precedence
    local finalDamage = BattleConditions.resolveDamagePrecedence(damageResults.damage_effects, pokemonList)
    damageResults.precedence_resolved = finalDamage
    damageResults.total_damaged = #finalDamage
    
    return damageResults
end

-- Resolve damage precedence for Pokemon with multiple damage sources
-- @param damageEffects: List of all damage effects
-- @param pokemonList: List of Pokemon for context
-- @return: Final damage amounts after precedence resolution
function BattleConditions.resolveDamagePrecedence(damageEffects, pokemonList)
    local pokemonDamageMap = {}
    local finalDamage = {}
    
    -- Group damage effects by Pokemon
    for _, effect in ipairs(damageEffects) do
        local pokemonId = effect.pokemon_id
        if not pokemonDamageMap[pokemonId] then
            pokemonDamageMap[pokemonId] = {}
        end
        table.insert(pokemonDamageMap[pokemonId], effect)
    end
    
    -- Resolve damage for each Pokemon
    for pokemonId, effects in pairs(pokemonDamageMap) do
        local pokemon = BattleConditions.findPokemonById(pokemonId, pokemonList)
        if pokemon then
            local totalDamage = 0
            local sources = {}
            
            -- Sort by priority (lower number = higher priority)
            table.sort(effects, function(a, b) return a.priority < b.priority end)
            
            for _, effect in ipairs(effects) do
                totalDamage = totalDamage + effect.damage
                table.insert(sources, effect.source .. ":" .. (effect.ability_name or effect.weather_name or "unknown"))
            end
            
            if totalDamage > 0 then
                -- Cap damage at current HP - 1 (can't faint from environmental damage)
                local currentHP = pokemon.currentHP or pokemon.maxHP or 100
                local actualDamage = math.min(totalDamage, math.max(1, currentHP - 1))
                
                table.insert(finalDamage, {
                    pokemon_id = pokemonId,
                    pokemon_name = pokemon.name or "Unknown Pokemon",
                    total_damage = actualDamage,
                    raw_damage = totalDamage,
                    sources = sources,
                    multiple_sources = #effects > 1
                })
            end
        end
    end
    
    return finalDamage
end

-- Process complete environmental healing and damage with proper timing
-- @param battleId: Battle instance identifier
-- @param pokemonList: List of Pokemon to process
-- @param weatherType: Current weather type
-- @param terrainType: Current terrain type
-- @return: Complete results with proper precedence timing
function BattleConditions.processCompleteEnvironmentalEffects(battleId, pokemonList, weatherType, terrainType)
    local results = {
        timing_order = {},
        healing_results = {},
        damage_results = {},
        net_effects = {},
        summary = {
            total_healed = 0,
            total_damaged = 0,
            net_healers = 0,
            net_damaged = 0
        }
    }
    
    -- Step 1: Process healing first (higher priority)
    local healingResults = BattleConditions.processEnvironmentalHealing(battleId, pokemonList, weatherType, terrainType)
    results.healing_results = healingResults
    table.insert(results.timing_order, {phase = "healing", count = healingResults.total_healers})
    
    -- Step 2: Process damage second (lower priority)
    local damageResults = BattleConditions.processEnvironmentalDamage(battleId, pokemonList, weatherType, terrainType)
    results.damage_results = damageResults
    table.insert(results.timing_order, {phase = "damage", count = damageResults.total_damaged})
    
    -- Step 3: Calculate net effects per Pokemon
    local pokemonNetEffects = {}
    
    -- Add healing effects
    for _, healing in ipairs(healingResults.precedence_resolved) do
        local pokemonId = healing.pokemon_id
        if not pokemonNetEffects[pokemonId] then
            pokemonNetEffects[pokemonId] = {pokemon_id = pokemonId, pokemon_name = healing.pokemon_name, net_hp_change = 0, effects = {}}
        end
        pokemonNetEffects[pokemonId].net_hp_change = pokemonNetEffects[pokemonId].net_hp_change + healing.total_healing
        table.insert(pokemonNetEffects[pokemonId].effects, {type = "healing", amount = healing.total_healing, sources = healing.sources})
    end
    
    -- Subtract damage effects
    for _, damage in ipairs(damageResults.precedence_resolved) do
        local pokemonId = damage.pokemon_id
        if not pokemonNetEffects[pokemonId] then
            pokemonNetEffects[pokemonId] = {pokemon_id = pokemonId, pokemon_name = damage.pokemon_name, net_hp_change = 0, effects = {}}
        end
        pokemonNetEffects[pokemonId].net_hp_change = pokemonNetEffects[pokemonId].net_hp_change - damage.total_damage
        table.insert(pokemonNetEffects[pokemonId].effects, {type = "damage", amount = damage.total_damage, sources = damage.sources})
    end
    
    -- Convert to array and calculate summary
    for pokemonId, netEffect in pairs(pokemonNetEffects) do
        table.insert(results.net_effects, netEffect)
        
        if netEffect.net_hp_change > 0 then
            results.summary.net_healers = results.summary.net_healers + 1
            results.summary.total_healed = results.summary.total_healed + netEffect.net_hp_change
        elseif netEffect.net_hp_change < 0 then
            results.summary.net_damaged = results.summary.net_damaged + 1
            results.summary.total_damaged = results.summary.total_damaged + math.abs(netEffect.net_hp_change)
        end
    end
    
    return results
end

-- Field Effect Removal System
-- Implementation of Defog and other field effect removal moves

-- Field effect removal move data
BattleConditions.FieldRemovalMoves = {
    ["defog"] = {
        name = "Defog",
        removes = {
            weather = {"all"}, -- Removes all weather except permanent weather
            terrain = {"all"}, -- Removes all terrain
            entry_hazards = {"all"}, -- Would remove entry hazards (future implementation)
            field_conditions = {} -- Does not remove field conditions
        },
        resistance = {
            -- Permanent weather (generated by Primal abilities) has higher resistance
            weather_resistance = {"HARSH_SUN", "HEAVY_RAIN", "STRONG_WINDS"}
        },
        success_rate = 100 -- Defog always succeeds
    },
    ["psychic_terrain"] = {
        name = "Psychic Terrain",
        removes = {
            weather = {}, -- Does not remove weather
            terrain = {"all"}, -- Replaces terrain
            entry_hazards = {},
            field_conditions = {} -- Does not remove field conditions
        },
        success_rate = 100
    },
    ["trick_room"] = {
        name = "Trick Room",
        removes = {
            weather = {},
            terrain = {},
            entry_hazards = {},
            field_conditions = {"TRICK_ROOM"} -- Removes existing Trick Room or creates new one
        },
        success_rate = 100,
        toggle_effect = true -- Can remove or set depending on current state
    },
    ["wonder_room"] = {
        name = "Wonder Room",
        removes = {
            weather = {},
            terrain = {},
            entry_hazards = {},
            field_conditions = {"WONDER_ROOM"} -- Removes existing Wonder Room or creates new one
        },
        success_rate = 100,
        toggle_effect = true
    },
    ["magic_room"] = {
        name = "Magic Room",
        removes = {
            weather = {},
            terrain = {},
            entry_hazards = {},
            field_conditions = {"MAGIC_ROOM"} -- Removes existing Magic Room or creates new one
        },
        success_rate = 100,
        toggle_effect = true
    },
    ["rapid_spin"] = {
        name = "Rapid Spin",
        removes = {
            weather = {}, -- Does not remove weather
            terrain = {}, -- Does not remove terrain
            entry_hazards = {"user_side"}, -- Only removes hazards on user's side
            field_effects = {}
        },
        success_rate = 100
    },
    ["haze"] = {
        name = "Haze",
        removes = {
            weather = {}, -- Does not remove weather/terrain
            terrain = {},
            entry_hazards = {},
            field_effects = {"stat_changes"} -- Removes all stat changes
        },
        success_rate = 100
    }
}

-- Process field effect removal move
-- @param moveName: Name of the removal move
-- @param currentWeather: Current weather type and data
-- @param currentTerrain: Current terrain type and data
-- @param moveUser: Pokemon using the move
-- @param battleState: Current battle state
-- @return: Removal results and updated field conditions
function BattleConditions.processFieldEffectRemoval(moveName, currentWeather, currentTerrain, moveUser, battleState)
    local moveData = BattleConditions.FieldRemovalMoves[string.lower(moveName)]
    if not moveData then
        return {
            success = false,
            reason = "Move does not remove field effects",
            removed_effects = {}
        }
    end
    
    local results = {
        success = true,
        move_name = moveData.name,
        removed_effects = {},
        failed_removals = {},
        new_weather = currentWeather,
        new_terrain = currentTerrain,
        removal_messages = {}
    }
    
    -- Process weather removal
    if moveData.removes.weather and #moveData.removes.weather > 0 then
        local weatherRemoval = BattleConditions.processWeatherRemoval(moveData, currentWeather, moveUser)
        if weatherRemoval.removed then
            results.new_weather = {
                type = BattleConditions.WeatherType.NONE,
                duration = 0,
                source = "none"
            }
            table.insert(results.removed_effects, {
                type = "weather",
                previous = currentWeather,
                reason = "Removed by " .. moveData.name
            })
            table.insert(results.removal_messages, weatherRemoval.message)
        else
            table.insert(results.failed_removals, {
                type = "weather",
                reason = weatherRemoval.reason
            })
        end
    end
    
    -- Process terrain removal
    if moveData.removes.terrain and #moveData.removes.terrain > 0 then
        local terrainRemoval = BattleConditions.processTerrainRemoval(moveData, currentTerrain, moveUser)
        if terrainRemoval.removed then
            results.new_terrain = {
                type = BattleConditions.TerrainType.NONE,
                duration = 0,
                source = "none"
            }
            table.insert(results.removed_effects, {
                type = "terrain",
                previous = currentTerrain,
                reason = "Removed by " .. moveData.name
            })
            table.insert(results.removal_messages, terrainRemoval.message)
        else
            table.insert(results.failed_removals, {
                type = "terrain",
                reason = terrainRemoval.reason
            })
        end
    end
    
    -- Process field condition removal
    if moveData.removes.field_conditions and #moveData.removes.field_conditions > 0 then
        local fieldConditionRemoval = BattleConditions.processFieldConditionRemoval(moveData, battleState.fieldConditions, moveUser)
        if fieldConditionRemoval.removed or fieldConditionRemoval.toggled then
            results.new_field_conditions = fieldConditionRemoval.new_field_conditions
            for _, removed in ipairs(fieldConditionRemoval.removed_conditions or {}) do
                table.insert(results.removed_effects, {
                    type = "field_condition",
                    previous = removed,
                    reason = "Removed by " .. moveData.name
                })
                table.insert(results.removal_messages, fieldConditionRemoval.message or (removed.name .. " was removed!"))
            end
        else
            if fieldConditionRemoval.created then
                results.new_field_conditions = fieldConditionRemoval.new_field_conditions
                table.insert(results.removal_messages, fieldConditionRemoval.message or (moveData.name .. " was activated!"))
            end
        end
    end
    
    -- Process other field effects (future expansion)
    if moveData.removes.field_effects and #moveData.removes.field_effects > 0 then
        for _, effectType in ipairs(moveData.removes.field_effects) do
            if effectType == "stat_changes" then
                table.insert(results.removed_effects, {
                    type = "stat_changes",
                    reason = "All stat changes removed by " .. moveData.name
                })
                table.insert(results.removal_messages, "All stat changes were removed!")
            end
        end
    end
    
    return results
end

-- Process weather removal with resistance checks
-- @param moveData: Move data for the removal move
-- @param currentWeather: Current weather state
-- @param moveUser: Pokemon using the removal move
-- @return: Weather removal result
function BattleConditions.processWeatherRemoval(moveData, currentWeather, moveUser)
    if not currentWeather or currentWeather.type == BattleConditions.WeatherType.NONE then
        return {
            removed = false,
            reason = "No weather to remove",
            message = "There is no weather to clear!"
        }
    end
    
    -- Check if weather type has resistance
    if moveData.resistance and moveData.resistance.weather_resistance then
        local weatherName = BattleConditions.WeatherTypeName[currentWeather.type] or "UNKNOWN"
        for _, resistantWeather in ipairs(moveData.resistance.weather_resistance) do
            if weatherName == resistantWeather then
                return {
                    removed = false,
                    reason = "Weather is too strong to be removed",
                    message = "The " .. (BattleConditions.WeatherData[currentWeather.type] and BattleConditions.WeatherData[currentWeather.type].name or "weather") .. " is too strong to be blown away!"
                }
            end
        end
    end
    
    -- Check if it's ability-generated weather with remaining duration
    if currentWeather.source == "ability" and currentWeather.duration > 1 then
        -- Reduce duration instead of removing completely
        return {
            removed = false,
            duration_reduced = true,
            new_duration = math.max(1, currentWeather.duration - 2),
            reason = "Ability-generated weather partially resisted",
            message = "The weather weakened but persists!"
        }
    end
    
    -- Weather can be removed
    local weatherData = BattleConditions.WeatherData[currentWeather.type]
    local weatherName = weatherData and weatherData.name or "weather"
    
    return {
        removed = true,
        message = "The " .. weatherName .. " was blown away!"
    }
end

-- Process terrain removal with resistance checks
-- @param moveData: Move data for the removal move
-- @param currentTerrain: Current terrain state
-- @param moveUser: Pokemon using the removal move
-- @return: Terrain removal result
function BattleConditions.processTerrainRemoval(moveData, currentTerrain, moveUser)
    if not currentTerrain or currentTerrain.type == BattleConditions.TerrainType.NONE then
        return {
            removed = false,
            reason = "No terrain to remove",
            message = "There is no terrain to clear!"
        }
    end
    
    -- Check if it's ability-generated terrain with remaining duration
    if currentTerrain.source == "ability" and currentTerrain.duration > 1 then
        return {
            removed = false,
            duration_reduced = true,
            new_duration = math.max(1, currentTerrain.duration - 1),
            reason = "Ability-generated terrain partially resisted",
            message = "The terrain weakened but persists!"
        }
    end
    
    -- Terrain can be removed
    local terrainData = BattleConditions.TerrainData[currentTerrain.type]
    local terrainName = terrainData and terrainData.name or "terrain"
    
    return {
        removed = true,
        message = "The " .. terrainName .. " disappeared!"
    }
end

-- Process field condition removal with toggle support
-- @param moveData: Move data for the removal move
-- @param currentFieldConditions: Current field conditions
-- @param moveUser: Pokemon using the removal move
-- @return: Field condition removal result
function BattleConditions.processFieldConditionRemoval(moveData, currentFieldConditions, moveUser)
    if not moveData.removes.field_conditions or #moveData.removes.field_conditions == 0 then
        return {
            removed = false,
            toggled = false,
            created = false,
            reason = "Move does not affect field conditions",
            message = "No field conditions to affect!"
        }
    end
    
    local results = {
        removed = false,
        toggled = false,
        created = false,
        removed_conditions = {},
        new_field_conditions = currentFieldConditions or {},
        messages = {}
    }
    
    local FieldConditions = require("game-logic.battle.field-conditions")
    
    -- Handle each field condition type
    for _, conditionTypeName in ipairs(moveData.removes.field_conditions) do
        local conditionType = BattleConditions.FieldEffectType[conditionTypeName]
        if not conditionType then
            goto continue
        end
        
        -- Check if this is a toggle move (field condition moves that can remove themselves)
        if moveData.toggle_effect then
            -- Check if condition is already active
            if currentFieldConditions and currentFieldConditions[conditionType] and 
               currentFieldConditions[conditionType].duration and 
               currentFieldConditions[conditionType].duration > 0 then
                
                -- Remove existing condition
                table.insert(results.removed_conditions, currentFieldConditions[conditionType])
                results.new_field_conditions[conditionType] = nil
                results.removed = true
                results.toggled = true
                
                local conditionData = BattleConditions.FieldConditionData[conditionType]
                local conditionName = conditionData and conditionData.name or "Field Condition"
                table.insert(results.messages, conditionName .. " wore off!")
                
            else
                -- Create new condition
                local success, conditionResult = FieldConditions.setFieldEffect(
                    "battle", conditionType, nil, "move", moveUser
                )
                
                if success then
                    results.new_field_conditions[conditionType] = {
                        type = conditionType,
                        duration = conditionResult.duration,
                        source = "move",
                        source_pokemon = moveUser,
                        field_effect_name = conditionResult.field_effect_name,
                        timestamp = conditionResult.timestamp
                    }
                    
                    -- Copy effect data
                    if conditionResult.priority_reversal then
                        results.new_field_conditions[conditionType].effects = {priority_reversal = true}
                    elseif conditionResult.stat_swap then
                        results.new_field_conditions[conditionType].effects = {stat_swap = conditionResult.stat_swap}
                    elseif conditionResult.suppresses_items then
                        results.new_field_conditions[conditionType].effects = {suppresses_items = true}
                    end
                    
                    results.created = true
                    results.toggled = true
                    table.insert(results.messages, conditionResult.field_effect_name .. " was activated!")
                end
            end
        else
            -- Non-toggle removal (like Defog)
            if currentFieldConditions and currentFieldConditions[conditionType] and 
               currentFieldConditions[conditionType].duration and 
               currentFieldConditions[conditionType].duration > 0 then
                
                table.insert(results.removed_conditions, currentFieldConditions[conditionType])
                results.new_field_conditions[conditionType] = nil
                results.removed = true
                
                local conditionData = BattleConditions.FieldConditionData[conditionType]
                local conditionName = conditionData and conditionData.name or "Field Condition"
                table.insert(results.messages, conditionName .. " was blown away!")
            end
        end
        
        ::continue::
    end
    
    -- Set final message
    if #results.messages > 0 then
        results.message = table.concat(results.messages, " ")
    elseif results.removed then
        results.message = "Field conditions were cleared!"
    elseif results.created then
        results.message = "Field condition was activated!"
    else
        results.message = "No field conditions were affected!"
    end
    
    return results
end

-- Check if field effects can be removed by move
-- @param moveName: Name of the move to check
-- @param fieldConditions: Current field conditions to check
-- @return: Information about what can be removed
function BattleConditions.checkRemovalPotential(moveName, fieldConditions)
    local moveData = BattleConditions.FieldRemovalMoves[string.lower(moveName)]
    if not moveData then
        return {
            can_remove = false,
            reason = "Move does not remove field effects",
            removable_effects = {}
        }
    end
    
    local removableEffects = {}
    
    -- Check weather removal potential
    if moveData.removes.weather and #moveData.removes.weather > 0 and fieldConditions.weather then
        if fieldConditions.weather.type ~= BattleConditions.WeatherType.NONE then
            local canRemove = true
            local reason = "Can remove weather"
            
            -- Check resistance
            if moveData.resistance and moveData.resistance.weather_resistance then
                local weatherName = BattleConditions.WeatherTypeName[fieldConditions.weather.type] or "UNKNOWN"
                for _, resistantWeather in ipairs(moveData.resistance.weather_resistance) do
                    if weatherName == resistantWeather then
                        canRemove = false
                        reason = "Weather has resistance"
                        break
                    end
                end
            end
            
            table.insert(removableEffects, {
                type = "weather",
                can_remove = canRemove,
                reason = reason,
                current_weather = fieldConditions.weather
            })
        end
    end
    
    -- Check terrain removal potential
    if moveData.removes.terrain and #moveData.removes.terrain > 0 and fieldConditions.terrain then
        if fieldConditions.terrain.type ~= BattleConditions.TerrainType.NONE then
            table.insert(removableEffects, {
                type = "terrain",
                can_remove = true,
                reason = "Can remove terrain",
                current_terrain = fieldConditions.terrain
            })
        end
    end
    
    return {
        can_remove = #removableEffects > 0,
        move_name = moveData.name,
        removable_effects = removableEffects
    }
end

-- Get list of all available field removal moves
-- @return: List of field removal moves and their capabilities
function BattleConditions.getFieldRemovalMoves()
    local moves = {}
    
    for moveName, moveData in pairs(BattleConditions.FieldRemovalMoves) do
        table.insert(moves, {
            name = moveName,
            display_name = moveData.name,
            removes_weather = #(moveData.removes.weather or {}) > 0,
            removes_terrain = #(moveData.removes.terrain or {}) > 0,
            removes_hazards = #(moveData.removes.entry_hazards or {}) > 0,
            removes_field_effects = #(moveData.removes.field_effects or {}) > 0,
            success_rate = moveData.success_rate
        })
    end
    
    return moves
end

-- Environmental Effect Notification System
-- Comprehensive messaging system for environmental effects with proper timing

-- Notification types and priorities
BattleConditions.NotificationType = {
    WEATHER_CHANGE = "weather_change",
    TERRAIN_CHANGE = "terrain_change",
    ABILITY_ACTIVATION = "ability_activation",
    ENVIRONMENTAL_DAMAGE = "environmental_damage",
    ENVIRONMENTAL_HEALING = "environmental_healing",
    MOVE_INTERACTION = "move_interaction",
    EFFECT_SUPPRESSION = "effect_suppression",
    FIELD_REMOVAL = "field_removal"
}

BattleConditions.NotificationPriority = {
    IMMEDIATE = 1,
    HIGH = 2,
    MEDIUM = 3,
    LOW = 4
}

-- Generate comprehensive environmental effect notifications
-- @param environmentalResults: Results from environmental processing
-- @param battleTurn: Current battle turn
-- @param timing: When notifications should be shown ("start_turn", "end_turn", etc.)
-- @return: Formatted notifications ready for display
function BattleConditions.generateEnvironmentalNotifications(environmentalResults, battleTurn, timing)
    local notifications = {
        turn = battleTurn,
        timing = timing,
        messages = {},
        priority_groups = {
            immediate = {},
            high = {},
            medium = {},
            low = {}
        }
    }
    
    -- Process weather change notifications
    if environmentalResults.weather_changes then
        for _, change in ipairs(environmentalResults.weather_changes) do
            local notification = BattleConditions.createWeatherChangeNotification(change)
            BattleConditions.addNotificationToPriorityGroup(notifications, notification)
        end
    end
    
    -- Process terrain change notifications
    if environmentalResults.terrain_changes then
        for _, change in ipairs(environmentalResults.terrain_changes) do
            local notification = BattleConditions.createTerrainChangeNotification(change)
            BattleConditions.addNotificationToPriorityGroup(notifications, notification)
        end
    end
    
    -- Process ability activation notifications
    if environmentalResults.ability_activations then
        for _, activation in ipairs(environmentalResults.ability_activations) do
            local notification = BattleConditions.createAbilityActivationNotification(activation)
            BattleConditions.addNotificationToPriorityGroup(notifications, notification)
        end
    end
    
    -- Process environmental healing notifications
    if environmentalResults.healing_results and environmentalResults.healing_results.precedence_resolved then
        for _, healing in ipairs(environmentalResults.healing_results.precedence_resolved) do
            local notification = BattleConditions.createHealingNotification(healing)
            BattleConditions.addNotificationToPriorityGroup(notifications, notification)
        end
    end
    
    -- Process environmental damage notifications
    if environmentalResults.damage_results and environmentalResults.damage_results.precedence_resolved then
        for _, damage in ipairs(environmentalResults.damage_results.precedence_resolved) do
            local notification = BattleConditions.createDamageNotification(damage)
            BattleConditions.addNotificationToPriorityGroup(notifications, notification)
        end
    end
    
    -- Process move interaction notifications
    if environmentalResults.move_interactions then
        for _, interaction in ipairs(environmentalResults.move_interactions) do
            local notification = BattleConditions.createMoveInteractionNotification(interaction)
            BattleConditions.addNotificationToPriorityGroup(notifications, notification)
        end
    end
    
    -- Process suppression notifications
    if environmentalResults.suppression_changes then
        for _, suppression in ipairs(environmentalResults.suppression_changes) do
            local notification = BattleConditions.createSuppressionNotification(suppression)
            BattleConditions.addNotificationToPriorityGroup(notifications, notification)
        end
    end
    
    -- Process field removal notifications
    if environmentalResults.field_removals then
        for _, removal in ipairs(environmentalResults.field_removals) do
            local notification = BattleConditions.createFieldRemovalNotification(removal)
            BattleConditions.addNotificationToPriorityGroup(notifications, notification)
        end
    end
    
    -- Compile final message list in priority order
    local finalMessages = {}
    
    -- Add messages by priority
    for _, msg in ipairs(notifications.priority_groups.immediate) do
        table.insert(finalMessages, msg)
    end
    for _, msg in ipairs(notifications.priority_groups.high) do
        table.insert(finalMessages, msg)
    end
    for _, msg in ipairs(notifications.priority_groups.medium) do
        table.insert(finalMessages, msg)
    end
    for _, msg in ipairs(notifications.priority_groups.low) do
        table.insert(finalMessages, msg)
    end
    
    notifications.messages = finalMessages
    
    return notifications
end

-- Create weather change notification
-- @param weatherChange: Weather change data
-- @return: Formatted notification
function BattleConditions.createWeatherChangeNotification(weatherChange)
    local weatherData = BattleConditions.WeatherData[weatherChange.new_weather]
    local weatherName = weatherData and weatherData.name or "Unknown Weather"
    
    local message = ""
    if weatherChange.new_weather == BattleConditions.WeatherType.NONE then
        message = "The weather cleared up!"
    else
        if weatherChange.source == "ability" then
            message = weatherChange.pokemon_name .. "'s " .. (weatherChange.ability_name or "ability") .. " made it " .. string.lower(weatherName) .. "!"
        elseif weatherChange.source == "move" then
            message = weatherChange.pokemon_name .. " used " .. (weatherChange.move_name or "a move") .. "! It became " .. string.lower(weatherName) .. "!"
        else
            message = "It became " .. string.lower(weatherName) .. "!"
        end
    end
    
    return {
        type = BattleConditions.NotificationType.WEATHER_CHANGE,
        priority = BattleConditions.NotificationPriority.HIGH,
        message = message,
        weather_type = weatherChange.new_weather,
        source = weatherChange.source
    }
end

-- Create terrain change notification
-- @param terrainChange: Terrain change data
-- @return: Formatted notification
function BattleConditions.createTerrainChangeNotification(terrainChange)
    local terrainData = BattleConditions.TerrainData[terrainChange.new_terrain]
    local terrainName = terrainData and terrainData.name or "Unknown Terrain"
    
    local message = ""
    if terrainChange.new_terrain == BattleConditions.TerrainType.NONE then
        message = "The terrain returned to normal!"
    else
        if terrainChange.source == "ability" then
            message = terrainChange.pokemon_name .. "'s " .. (terrainChange.ability_name or "ability") .. " created " .. terrainName .. "!"
        elseif terrainChange.source == "move" then
            message = terrainChange.pokemon_name .. " used " .. (terrainChange.move_name or "a move") .. "! The battlefield became " .. terrainName .. "!"
        else
            message = "The battlefield became " .. terrainName .. "!"
        end
    end
    
    return {
        type = BattleConditions.NotificationType.TERRAIN_CHANGE,
        priority = BattleConditions.NotificationPriority.HIGH,
        message = message,
        terrain_type = terrainChange.new_terrain,
        source = terrainChange.source
    }
end

-- Create ability activation notification
-- @param activation: Ability activation data
-- @return: Formatted notification
function BattleConditions.createAbilityActivationNotification(activation)
    local message = activation.pokemon_name .. "'s " .. activation.ability_name .. " activated!"
    
    if activation.effect_description then
        message = message .. " " .. activation.effect_description
    end
    
    return {
        type = BattleConditions.NotificationType.ABILITY_ACTIVATION,
        priority = BattleConditions.NotificationPriority.MEDIUM,
        message = message,
        ability_name = activation.ability_name,
        pokemon_name = activation.pokemon_name
    }
end

-- Create environmental healing notification
-- @param healing: Healing effect data
-- @return: Formatted notification
function BattleConditions.createHealingNotification(healing)
    local message = healing.pokemon_name .. " restored " .. healing.total_healing .. " HP"
    
    if healing.multiple_sources then
        message = message .. " from multiple environmental effects!"
    else
        local sourceDesc = table.concat(healing.sources, ", ")
        message = message .. " from " .. sourceDesc .. "!"
    end
    
    return {
        type = BattleConditions.NotificationType.ENVIRONMENTAL_HEALING,
        priority = BattleConditions.NotificationPriority.MEDIUM,
        message = message,
        healing_amount = healing.total_healing,
        pokemon_name = healing.pokemon_name
    }
end

-- Create environmental damage notification
-- @param damage: Damage effect data
-- @return: Formatted notification
function BattleConditions.createDamageNotification(damage)
    local message = damage.pokemon_name .. " took " .. damage.total_damage .. " damage"
    
    if damage.multiple_sources then
        message = message .. " from multiple environmental effects!"
    else
        local sourceDesc = table.concat(damage.sources, ", ")
        message = message .. " from " .. sourceDesc .. "!"
    end
    
    return {
        type = BattleConditions.NotificationType.ENVIRONMENTAL_DAMAGE,
        priority = BattleConditions.NotificationPriority.MEDIUM,
        message = message,
        damage_amount = damage.total_damage,
        pokemon_name = damage.pokemon_name
    }
end

-- Create move interaction notification
-- @param interaction: Move interaction data
-- @return: Formatted notification
function BattleConditions.createMoveInteractionNotification(interaction)
    local message = ""
    
    if interaction.blocked then
        message = interaction.move_name .. " was blocked by environmental conditions!"
    elseif interaction.power_modified then
        if interaction.final_power > interaction.original_power then
            message = interaction.move_name .. "'s power was boosted by environmental conditions!"
        else
            message = interaction.move_name .. "'s power was reduced by environmental conditions!"
        end
    elseif interaction.accuracy_modified then
        if interaction.accuracy_override then
            message = interaction.move_name .. " can't miss due to environmental conditions!"
        else
            message = interaction.move_name .. "'s accuracy was affected by environmental conditions!"
        end
    end
    
    return {
        type = BattleConditions.NotificationType.MOVE_INTERACTION,
        priority = BattleConditions.NotificationPriority.HIGH,
        message = message,
        move_name = interaction.move_name,
        interaction_type = interaction.interaction_type
    }
end

-- Create suppression notification
-- @param suppression: Effect suppression data
-- @return: Formatted notification
function BattleConditions.createSuppressionNotification(suppression)
    local message = ""
    
    if suppression.suppression_started then
        message = suppression.pokemon_name .. "'s " .. suppression.ability_name .. " suppressed the effects of weather!"
    elseif suppression.suppression_ended then
        message = "The weather effects returned as " .. suppression.pokemon_name .. " left the battle!"
    end
    
    return {
        type = BattleConditions.NotificationType.EFFECT_SUPPRESSION,
        priority = BattleConditions.NotificationPriority.HIGH,
        message = message,
        ability_name = suppression.ability_name,
        pokemon_name = suppression.pokemon_name
    }
end

-- Create field removal notification
-- @param removal: Field removal data
-- @return: Formatted notification
function BattleConditions.createFieldRemovalNotification(removal)
    local messages = {}
    
    for _, effect in ipairs(removal.removed_effects) do
        if effect.type == "weather" then
            table.insert(messages, "The weather cleared up!")
        elseif effect.type == "terrain" then
            table.insert(messages, "The terrain returned to normal!")
        end
    end
    
    local combinedMessage = table.concat(messages, " ")
    if combinedMessage == "" then
        combinedMessage = removal.move_name .. " was used!"
    end
    
    return {
        type = BattleConditions.NotificationType.FIELD_REMOVAL,
        priority = BattleConditions.NotificationPriority.HIGH,
        message = combinedMessage,
        move_name = removal.move_name,
        removed_count = #removal.removed_effects
    }
end

-- Add notification to appropriate priority group
-- @param notifications: Notification collection
-- @param notification: Individual notification to add
function BattleConditions.addNotificationToPriorityGroup(notifications, notification)
    if notification.priority == BattleConditions.NotificationPriority.IMMEDIATE then
        table.insert(notifications.priority_groups.immediate, notification)
    elseif notification.priority == BattleConditions.NotificationPriority.HIGH then
        table.insert(notifications.priority_groups.high, notification)
    elseif notification.priority == BattleConditions.NotificationPriority.MEDIUM then
        table.insert(notifications.priority_groups.medium, notification)
    else
        table.insert(notifications.priority_groups.low, notification)
    end
end

-- Format notifications for battle message system
-- @param notifications: Generated notifications
-- @param messageFormat: Format type ("simple", "detailed", "json")
-- @return: Formatted message data
function BattleConditions.formatNotificationsForBattle(notifications, messageFormat)
    messageFormat = messageFormat or "simple"
    
    if messageFormat == "simple" then
        local messages = {}
        for _, notification in ipairs(notifications.messages) do
            table.insert(messages, notification.message)
        end
        return messages
    elseif messageFormat == "detailed" then
        return {
            turn = notifications.turn,
            timing = notifications.timing,
            message_count = #notifications.messages,
            messages = notifications.messages
        }
    elseif messageFormat == "json" then
        -- Would return JSON-formatted string in actual implementation
        return notifications
    end
    
    return notifications.messages
end

-- Field Condition Integration Functions
-- Integrates field conditions with existing environmental systems

-- Set field condition with environmental interaction checks
-- @param battleId: Battle instance identifier
-- @param fieldConditionType: Type of field condition to set
-- @param duration: Duration of the field condition
-- @param source: Source of the field condition
-- @return: Success status and field condition details
function BattleConditions.setFieldCondition(battleId, fieldConditionType, duration, source)
    if not battleId or not fieldConditionType then
        return false, "Invalid parameters for field condition"
    end
    
    local FieldConditions = require("game-logic.battle.field-conditions")
    return FieldConditions.setFieldEffect(battleId, fieldConditionType, duration, source)
end

-- Process combined environmental and field condition effects
-- @param battleId: Battle instance identifier
-- @param pokemonList: List of Pokemon to process
-- @param weatherType: Current weather type
-- @param terrainType: Current terrain type
-- @param fieldConditions: Current field conditions
-- @return: Complete environmental effects with field condition interactions
function BattleConditions.processCompleteEnvironmentalAndFieldEffects(battleId, pokemonList, weatherType, terrainType, fieldConditions)
    local results = {
        environmental_effects = {},
        field_condition_effects = {},
        combined_interactions = {},
        final_effects = {}
    }
    
    -- Step 1: Process standard environmental effects
    local environmentalResults = BattleConditions.processCompleteEnvironmentalEffects(
        battleId, pokemonList, weatherType, terrainType
    )
    results.environmental_effects = environmentalResults
    
    -- Step 2: Process field condition effects
    if fieldConditions then
        local FieldConditions = require("game-logic.battle.field-conditions")
        
        -- Process priority effects (Trick Room)
        local priorityEffects = {}
        for conditionType, conditionData in pairs(fieldConditions) do
            if conditionType == BattleConditions.FieldEffectType.TRICK_ROOM and 
               conditionData.duration and conditionData.duration > 0 then
                table.insert(priorityEffects, {
                    type = "priority_reversal",
                    condition = "Trick Room",
                    duration = conditionData.duration
                })
            end
        end
        
        -- Process stat modification effects (Wonder Room)
        local statModificationEffects = {}
        for conditionType, conditionData in pairs(fieldConditions) do
            if conditionType == BattleConditions.FieldEffectType.WONDER_ROOM and 
               conditionData.duration and conditionData.duration > 0 then
                for _, pokemon in ipairs(pokemonList) do
                    table.insert(statModificationEffects, {
                        type = "stat_swap",
                        condition = "Wonder Room",
                        pokemon_id = pokemon.id,
                        swap = "defense_special_defense",
                        duration = conditionData.duration
                    })
                end
            end
        end
        
        -- Process item suppression effects (Magic Room)
        local itemSuppressionEffects = {}
        for conditionType, conditionData in pairs(fieldConditions) do
            if conditionType == BattleConditions.FieldEffectType.MAGIC_ROOM and 
               conditionData.duration and conditionData.duration > 0 then
                for _, pokemon in ipairs(pokemonList) do
                    if pokemon.heldItem then
                        table.insert(itemSuppressionEffects, {
                            type = "item_suppression",
                            condition = "Magic Room",
                            pokemon_id = pokemon.id,
                            suppressed_item = pokemon.heldItem,
                            duration = conditionData.duration
                        })
                    end
                end
            end
        end
        
        results.field_condition_effects = {
            priority_effects = priorityEffects,
            stat_modification_effects = statModificationEffects,
            item_suppression_effects = itemSuppressionEffects
        }
    end
    
    -- Step 3: Check for interactions between field conditions and environmental effects
    local interactions = BattleConditions.checkFieldConditionEnvironmentalInteractions(
        weatherType, terrainType, fieldConditions
    )
    results.combined_interactions = interactions
    
    -- Step 4: Combine all effects with proper precedence
    results.final_effects = BattleConditions.combineAllBattleEffects(
        environmentalResults.final_effects or {},
        results.field_condition_effects,
        interactions
    )
    
    return results
end

-- Check interactions between field conditions and environmental effects
-- @param weatherType: Current weather type
-- @param terrainType: Current terrain type
-- @param fieldConditions: Current field conditions
-- @return: Interaction information
function BattleConditions.checkFieldConditionEnvironmentalInteractions(weatherType, terrainType, fieldConditions)
    local interactions = {
        weather_interactions = {},
        terrain_interactions = {},
        field_interactions = {},
        precedence_rules = {}
    }
    
    if not fieldConditions then
        return interactions
    end
    
    -- Check Gravity interactions with terrain
    for conditionType, conditionData in pairs(fieldConditions) do
        if conditionType == BattleConditions.FieldEffectType.GRAVITY and 
           conditionData.duration and conditionData.duration > 0 then
            
            -- Gravity makes all Pokemon grounded, affecting terrain interactions
            if terrainType ~= BattleConditions.TerrainType.NONE then
                table.insert(interactions.terrain_interactions, {
                    field_condition = "Gravity",
                    terrain_type = terrainType,
                    interaction = "grounds_all_pokemon",
                    effect = "All Pokemon are affected by terrain regardless of type/ability"
                })
            end
        end
    end
    
    -- Field conditions generally don't conflict with weather/terrain
    -- They operate on different mechanics (priority, stats, items vs damage/healing)
    table.insert(interactions.precedence_rules, {
        rule = "field_conditions_independent",
        description = "Field conditions operate independently from weather and terrain"
    })
    
    return interactions
end

-- Combine all battle effects with proper precedence
-- @param environmentalEffects: Environmental effects (weather/terrain)
-- @param fieldConditionEffects: Field condition effects
-- @param interactions: Interaction data
-- @return: Combined effects list
function BattleConditions.combineAllBattleEffects(environmentalEffects, fieldConditionEffects, interactions)
    local combinedEffects = {}
    
    -- Add environmental effects (healing, damage)
    for _, effect in ipairs(environmentalEffects) do
        table.insert(combinedEffects, {
            type = "environmental",
            category = effect.effect_type or "unknown",
            pokemon_id = effect.pokemon_id,
            amount = effect.healing or effect.damage or 0,
            source = effect.sources and table.concat(effect.sources, ", ") or "environmental",
            priority = 2 -- Environmental effects have medium priority
        })
    end
    
    -- Add field condition effects (these are applied during different phases)
    if fieldConditionEffects then
        -- Priority effects don't appear in final effects (they affect turn order calculation)
        
        -- Stat modifications are applied during damage calculation
        if fieldConditionEffects.stat_modification_effects then
            for _, effect in ipairs(fieldConditionEffects.stat_modification_effects) do
                table.insert(combinedEffects, {
                    type = "field_condition",
                    category = "stat_modification",
                    pokemon_id = effect.pokemon_id,
                    modification = effect.swap,
                    source = effect.condition,
                    priority = 1 -- Highest priority (applied first)
                })
            end
        end
        
        -- Item suppression effects
        if fieldConditionEffects.item_suppression_effects then
            for _, effect in ipairs(fieldConditionEffects.item_suppression_effects) do
                table.insert(combinedEffects, {
                    type = "field_condition",
                    category = "item_suppression",
                    pokemon_id = effect.pokemon_id,
                    suppressed_item = effect.suppressed_item,
                    source = effect.condition,
                    priority = 1 -- High priority
                })
            end
        end
    end
    
    -- Sort by priority (lower number = higher priority)
    table.sort(combinedEffects, function(a, b) 
        return (a.priority or 999) < (b.priority or 999) 
    end)
    
    return combinedEffects
end

-- Update field condition durations
-- @param fieldConditions: Current field conditions
-- @return: Updated field conditions and expired conditions
function BattleConditions.updateFieldConditionDurations(fieldConditions)
    if not fieldConditions then
        return {}, {}
    end
    
    local updatedConditions = {}
    local expiredConditions = {}
    
    local FieldConditions = require("game-logic.battle.field-conditions")
    
    for conditionType, conditionData in pairs(fieldConditions) do
        if conditionData.duration then
            local newDuration, shouldExpire = FieldConditions.updateFieldConditionDuration(
                conditionType, conditionData.duration
            )
            
            if shouldExpire then
                table.insert(expiredConditions, {
                    type = conditionType,
                    name = conditionData.field_effect_name or "Unknown Field Condition",
                    expired_duration = conditionData.duration
                })
            else
                -- Update duration
                local updatedCondition = {}
                for k, v in pairs(conditionData) do
                    updatedCondition[k] = v
                end
                updatedCondition.duration = newDuration
                updatedConditions[conditionType] = updatedCondition
            end
        else
            -- Permanent condition
            updatedConditions[conditionType] = conditionData
        end
    end
    
    return updatedConditions, expiredConditions
end

-- Check field condition coexistence rules
-- @param currentFieldConditions: Currently active field conditions
-- @param newFieldCondition: New field condition being added
-- @return: Coexistence result and any conflicts
function BattleConditions.checkFieldConditionCoexistence(currentFieldConditions, newFieldCondition)
    local result = {
        can_coexist = true,
        conflicts = {},
        replacements = {},
        allowed = true
    }
    
    if not currentFieldConditions or not newFieldCondition then
        return result
    end
    
    local newType = newFieldCondition.field_effect_type
    
    -- Check for same type replacement
    if currentFieldConditions[newType] then
        table.insert(result.replacements, {
            type = newType,
            old_condition = currentFieldConditions[newType],
            new_condition = newFieldCondition,
            reason = "Same field condition type replaces existing"
        })
    end
    
    -- Field conditions can generally coexist
    -- Trick Room, Wonder Room, and Magic Room all operate on different mechanics
    result.can_coexist = true
    result.allowed = true
    
    return result
end

-- Process side effect duration countdown (integrates with environmental system)
-- @param battleState: Current battle state
-- @return: Table of expired side effects by side
function BattleConditions.processSideEffectTurnEnd(battleState)
    local SideEffects = require("game-logic.battle.side-effects")
    return SideEffects.processTurnEnd(battleState)
end

-- Initialize side effects for battle
-- @param battleState: Current battle state
-- @return: Success boolean
function BattleConditions.initializeSideEffects(battleState)
    local SideEffects = require("game-logic.battle.side-effects")
    
    -- Initialize for both sides
    SideEffects.initializeSideEffects(battleState, "player")
    SideEffects.initializeSideEffects(battleState, "enemy")
    
    return true
end

-- Positional Tag Effects System
-- Handle position-specific effects that track duration and application per battlefield position

-- Positional tag types
BattleConditions.PositionalTagType = {
    SUBSTITUTE_POSITION = "substitute_position", -- Position-specific substitutes
    POSITION_BARRIER = "position_barrier", -- Position-specific barriers
    POSITION_CURSE = "position_curse", -- Position-specific curses
    POSITION_TRAP = "position_trap", -- Position-specific traps
    CUSTOM_POSITION_EFFECT = "custom_position_effect" -- Custom positional effects
}

-- Initialize positional tag effects for battle
-- @param battleState: Current battle state
-- @return: Success boolean
function BattleConditions.initializePositionalTags(battleState)
    if not battleState then
        return false
    end
    
    -- Initialize positional tag tracking
    if not battleState.positionalTags then
        battleState.positionalTags = {
            player = {},
            enemy = {}
        }
    end
    
    -- Initialize position-specific storage based on battle format
    local formatInfo = PositionalMechanics.getBattleFormatInfo(battleState)
    
    for side = 1, 2 do
        local sideName = side == 1 and "player" or "enemy"
        
        for position = 1, formatInfo.max_active_per_side do
            if not battleState.positionalTags[sideName][position] then
                battleState.positionalTags[sideName][position] = {}
            end
        end
    end
    
    return true
end

-- Apply positional tag effect to specific position
-- @param battleState: Current battle state
-- @param side: "player" or "enemy"
-- @param position: Position index (1 for left/single, 2 for right)
-- @param tagType: Type of positional tag
-- @param duration: Effect duration in turns
-- @param effectData: Additional effect data
-- @return: Success boolean and result message
function BattleConditions.applyPositionalTag(battleState, side, position, tagType, duration, effectData)
    if not battleState or not battleState.positionalTags then
        return false, "Positional tags not initialized"
    end
    
    if side ~= "player" and side ~= "enemy" then
        return false, "Invalid side specified"
    end
    
    -- Validate position for battle format
    local formatInfo = PositionalMechanics.getBattleFormatInfo(battleState)
    if position < 1 or position > formatInfo.max_active_per_side then
        return false, "Invalid position for current battle format"
    end
    
    -- Ensure position storage exists
    if not battleState.positionalTags[side][position] then
        battleState.positionalTags[side][position] = {}
    end
    
    -- Apply the positional tag
    local tagData = {
        tag_type = tagType,
        duration = duration or 0,
        turns_remaining = duration or 0,
        effect_data = effectData or {},
        applied_turn = battleState.turn or 0,
        is_active = true
    }
    
    battleState.positionalTags[side][position][tagType] = tagData
    
    return true, string.format("Positional tag %s applied to %s position %d", tagType, side, position)
end

-- Remove positional tag effect from position
-- @param battleState: Current battle state
-- @param side: "player" or "enemy"
-- @param position: Position index
-- @param tagType: Type of tag to remove
-- @return: Success boolean and result message
function BattleConditions.removePositionalTag(battleState, side, position, tagType)
    if not battleState or not battleState.positionalTags then
        return false, "Positional tags not initialized"
    end
    
    if not battleState.positionalTags[side] or not battleState.positionalTags[side][position] then
        return false, "Position not found"
    end
    
    local positionTags = battleState.positionalTags[side][position]
    if positionTags[tagType] then
        positionTags[tagType] = nil
        return true, string.format("Positional tag %s removed from %s position %d", tagType, side, position)
    end
    
    return false, "Tag not found at position"
end

-- Get positional tag effects for specific position
-- @param battleState: Current battle state
-- @param side: "player" or "enemy"
-- @param position: Position index
-- @return: Table of active positional tags
function BattleConditions.getPositionalTags(battleState, side, position)
    if not battleState or not battleState.positionalTags then
        return {}
    end
    
    if not battleState.positionalTags[side] or not battleState.positionalTags[side][position] then
        return {}
    end
    
    local activeTags = {}
    for tagType, tagData in pairs(battleState.positionalTags[side][position]) do
        if tagData.is_active and tagData.turns_remaining > 0 then
            activeTags[tagType] = tagData
        end
    end
    
    return activeTags
end

-- Check if specific positional tag is active at position
-- @param battleState: Current battle state
-- @param side: "player" or "enemy"
-- @param position: Position index
-- @param tagType: Type of tag to check
-- @return: Boolean indicating if tag is active
function BattleConditions.hasPositionalTag(battleState, side, position, tagType)
    local tags = BattleConditions.getPositionalTags(battleState, side, position)
    return tags[tagType] ~= nil
end

-- Update positional tag duration and remove expired tags
-- @param battleState: Current battle state
-- @return: Table of expired tags by side and position
function BattleConditions.updatePositionalTagDurations(battleState)
    if not battleState or not battleState.positionalTags then
        return {}
    end
    
    local expiredTags = {
        player = {},
        enemy = {}
    }
    
    for sideName, sideData in pairs(battleState.positionalTags) do
        expiredTags[sideName] = {}
        
        for position, positionTags in pairs(sideData) do
            expiredTags[sideName][position] = {}
            
            for tagType, tagData in pairs(positionTags) do
                if tagData.is_active then
                    -- Decrease duration
                    tagData.turns_remaining = tagData.turns_remaining - 1
                    
                    -- Check if tag expired
                    if tagData.turns_remaining <= 0 then
                        tagData.is_active = false
                        table.insert(expiredTags[sideName][position], {
                            tag_type = tagType,
                            expired_on_turn = battleState.turn or 0,
                            final_effect_data = tagData.effect_data
                        })
                    end
                end
            end
        end
    end
    
    return expiredTags
end

-- Process end-of-turn positional tag effects
-- @param battleState: Current battle state
-- @return: Results of positional tag processing
function BattleConditions.processPositionalTagTurnEnd(battleState)
    if not battleState or not battleState.positionalTags then
        return {
            tags_processed = 0,
            effects_applied = {},
            tags_expired = {}
        }
    end
    
    local results = {
        tags_processed = 0,
        effects_applied = {},
        tags_expired = {}
    }
    
    -- Update durations and collect expired tags
    local expiredTags = BattleConditions.updatePositionalTagDurations(battleState)
    results.tags_expired = expiredTags
    
    -- Process active positional tag effects
    for sideName, sideData in pairs(battleState.positionalTags) do
        for position, positionTags in pairs(sideData) do
            for tagType, tagData in pairs(positionTags) do
                if tagData.is_active then
                    results.tags_processed = results.tags_processed + 1
                    
                    -- Process tag-specific effects
                    local effectResult = BattleConditions.processPositionalTagEffect(
                        battleState, sideName, position, tagType, tagData
                    )
                    
                    if effectResult.effect_applied then
                        table.insert(results.effects_applied, {
                            side = sideName,
                            position = position,
                            tag_type = tagType,
                            effect_result = effectResult
                        })
                    end
                end
            end
        end
    end
    
    return results
end

-- Process individual positional tag effect
-- @param battleState: Current battle state
-- @param side: Side of the position
-- @param position: Position index
-- @param tagType: Type of tag
-- @param tagData: Tag data
-- @return: Effect processing result
function BattleConditions.processPositionalTagEffect(battleState, side, position, tagType, tagData)
    local result = {
        effect_applied = false,
        effect_message = "",
        damage_dealt = 0,
        healing_applied = 0,
        status_changes = {}
    }
    
    -- Get Pokemon at position
    local pokemon = PositionalMechanics.getPokemonAtPosition(battleState, side, position)
    if not pokemon or pokemon.fainted then
        return result
    end
    
    -- Process based on tag type
    if tagType == BattleConditions.PositionalTagType.SUBSTITUTE_POSITION then
        -- Process substitute at specific position
        result = BattleConditions.processPositionalSubstitute(battleState, pokemon, tagData)
        
    elseif tagType == BattleConditions.PositionalTagType.POSITION_BARRIER then
        -- Process position-specific barrier
        result = BattleConditions.processPositionalBarrier(battleState, pokemon, tagData)
        
    elseif tagType == BattleConditions.PositionalTagType.POSITION_CURSE then
        -- Process position-specific curse damage
        result = BattleConditions.processPositionalCurse(battleState, pokemon, tagData)
        
    elseif tagType == BattleConditions.PositionalTagType.POSITION_TRAP then
        -- Process position-specific trap effects
        result = BattleConditions.processPositionalTrap(battleState, pokemon, tagData)
        
    elseif tagType == BattleConditions.PositionalTagType.CUSTOM_POSITION_EFFECT then
        -- Process custom positional effects
        result = BattleConditions.processCustomPositionalEffect(battleState, pokemon, tagData)
    end
    
    return result
end

-- Process position-specific substitute effects
-- @param battleState: Battle state
-- @param pokemon: Pokemon at position
-- @param tagData: Substitute tag data
-- @return: Processing result
function BattleConditions.processPositionalSubstitute(battleState, pokemon, tagData)
    -- Substitute persists until broken or Pokemon switches
    return {
        effect_applied = true,
        effect_message = string.format("%s's substitute is active", pokemon.name or "Pokemon"),
        damage_dealt = 0,
        healing_applied = 0,
        status_changes = {}
    }
end

-- Process position-specific barrier effects
-- @param battleState: Battle state
-- @param pokemon: Pokemon at position
-- @param tagData: Barrier tag data
-- @return: Processing result
function BattleConditions.processPositionalBarrier(battleState, pokemon, tagData)
    -- Barrier reduces incoming damage for Pokemon at this position
    return {
        effect_applied = true,
        effect_message = string.format("%s is protected by a positional barrier", pokemon.name or "Pokemon"),
        damage_dealt = 0,
        healing_applied = 0,
        status_changes = {},
        damage_reduction = tagData.effect_data.damage_reduction or 0.5
    }
end

-- Process position-specific curse effects
-- @param battleState: Battle state
-- @param pokemon: Pokemon at position
-- @param tagData: Curse tag data
-- @return: Processing result
function BattleConditions.processPositionalCurse(battleState, pokemon, tagData)
    -- Curse deals damage each turn to Pokemon at this position
    local curseDamage = math.floor((pokemon.maxHP or pokemon.stats.hp or 100) / 4) -- 25% max HP
    local actualDamage = math.min(curseDamage, pokemon.currentHP)
    
    pokemon.currentHP = math.max(0, pokemon.currentHP - actualDamage)
    
    return {
        effect_applied = true,
        effect_message = string.format("%s is hurt by the positional curse!", pokemon.name or "Pokemon"),
        damage_dealt = actualDamage,
        healing_applied = 0,
        status_changes = {}
    }
end

-- Process position-specific trap effects
-- @param battleState: Battle state
-- @param pokemon: Pokemon at position
-- @param tagData: Trap tag data
-- @return: Processing result
function BattleConditions.processPositionalTrap(battleState, pokemon, tagData)
    -- Trap triggers when Pokemon tries to move or use certain moves
    return {
        effect_applied = true,
        effect_message = string.format("%s is trapped in position!", pokemon.name or "Pokemon"),
        damage_dealt = 0,
        healing_applied = 0,
        status_changes = {},
        movement_blocked = true
    }
end

-- Process custom positional effects
-- @param battleState: Battle state
-- @param pokemon: Pokemon at position
-- @param tagData: Custom effect tag data
-- @return: Processing result
function BattleConditions.processCustomPositionalEffect(battleState, pokemon, tagData)
    -- Process custom effects based on effect_data
    local effectData = tagData.effect_data or {}
    
    local result = {
        effect_applied = false,
        effect_message = "",
        damage_dealt = 0,
        healing_applied = 0,
        status_changes = {}
    }
    
    -- Apply custom damage
    if effectData.damage_per_turn then
        local damage = effectData.damage_per_turn
        local actualDamage = math.min(damage, pokemon.currentHP)
        pokemon.currentHP = math.max(0, pokemon.currentHP - actualDamage)
        result.damage_dealt = actualDamage
        result.effect_applied = true
    end
    
    -- Apply custom healing
    if effectData.healing_per_turn then
        local maxHP = pokemon.maxHP or pokemon.stats.hp or 100
        local healing = math.min(effectData.healing_per_turn, maxHP - pokemon.currentHP)
        pokemon.currentHP = pokemon.currentHP + healing
        result.healing_applied = healing
        result.effect_applied = true
    end
    
    -- Apply custom message
    if effectData.message then
        result.effect_message = string.format(effectData.message, pokemon.name or "Pokemon")
        result.effect_applied = true
    end
    
    return result
end

-- Get all active positional tags for battle summary
-- @param battleState: Current battle state
-- @return: Summary of all active positional tags
function BattleConditions.getPositionalTagsSummary(battleState)
    if not battleState or not battleState.positionalTags then
        return {
            total_active_tags = 0,
            tags_by_side = {}
        }
    end
    
    local summary = {
        total_active_tags = 0,
        tags_by_side = {}
    }
    
    for sideName, sideData in pairs(battleState.positionalTags) do
        summary.tags_by_side[sideName] = {}
        
        for position, positionTags in pairs(sideData) do
            local activeTags = BattleConditions.getPositionalTags(battleState, sideName, position)
            if next(activeTags) then -- Has active tags
                summary.tags_by_side[sideName][position] = {}
                for tagType, tagData in pairs(activeTags) do
                    summary.total_active_tags = summary.total_active_tags + 1
                    table.insert(summary.tags_by_side[sideName][position], {
                        tag_type = tagType,
                        turns_remaining = tagData.turns_remaining,
                        effect_description = BattleConditions.getPositionalTagDescription(tagType)
                    })
                end
            end
        end
    end
    
    return summary
end

-- Get description for positional tag type
-- @param tagType: Type of positional tag
-- @return: Human-readable description
function BattleConditions.getPositionalTagDescription(tagType)
    local descriptions = {
        [BattleConditions.PositionalTagType.SUBSTITUTE_POSITION] = "Position-specific substitute protecting from damage",
        [BattleConditions.PositionalTagType.POSITION_BARRIER] = "Barrier reducing damage to this position",
        [BattleConditions.PositionalTagType.POSITION_CURSE] = "Curse dealing damage each turn at this position",
        [BattleConditions.PositionalTagType.POSITION_TRAP] = "Trap preventing movement from this position",
        [BattleConditions.PositionalTagType.CUSTOM_POSITION_EFFECT] = "Custom positional effect"
    }
    
    return descriptions[tagType] or "Unknown positional effect"
end

return BattleConditions