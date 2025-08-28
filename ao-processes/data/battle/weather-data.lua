-- Weather System Data
-- Complete weather type interactions with abilities and move effects
-- Provides exact damage modifiers and ability interactions matching TypeScript implementation

local WeatherData = {}

-- Load dependencies
local Enums = require("data.constants.enums")

-- Weather type effectiveness chart
-- Maps weather types to move type multipliers
WeatherData.TypeModifiers = {
    [1] = { -- SUNNY
        [Enums.PokemonType.FIRE] = 1.5,      -- Fire moves boosted
        [Enums.PokemonType.WATER] = 0.5      -- Water moves weakened
    },
    [2] = { -- RAIN
        [Enums.PokemonType.WATER] = 1.5,     -- Water moves boosted
        [Enums.PokemonType.FIRE] = 0.5       -- Fire moves weakened
    },
    [3] = { -- SANDSTORM
        -- No direct type modifiers, but provides Rock-type SpDef boost
    },
    [4] = { -- HAIL
        -- No direct type modifiers
    },
    [5] = { -- SNOW
        -- No direct type modifiers, but provides Ice-type Defense boost
    }
}

-- Weather ability interactions
-- Maps weather types to abilities that are boosted or triggered
WeatherData.AbilityInteractions = {
    [1] = { -- SUNNY
        boost = {
            [Enums.AbilityId.CHLOROPHYLL] = {stat = "speed", multiplier = 2.0},
            [Enums.AbilityId.SOLAR_POWER] = {stat = "special_attack", multiplier = 1.5}
        },
        trigger = {
            [Enums.AbilityId.DROUGHT] = true
        }
    },
    [2] = { -- RAIN
        boost = {
            [Enums.AbilityId.SWIFT_SWIM] = {stat = "speed", multiplier = 2.0},
            [Enums.AbilityId.RAIN_DISH] = {healing = "1/16"}
        },
        trigger = {
            [Enums.AbilityId.DRIZZLE] = true
        }
    },
    [3] = { -- SANDSTORM
        boost = {
            [Enums.AbilityId.SAND_VEIL] = {evasion = 1.25}
        },
        immunity = {
            [Enums.AbilityId.SAND_VEIL] = true
        },
        trigger = {
            [Enums.AbilityId.SAND_STREAM] = true
        }
    },
    [4] = { -- HAIL
        immunity = {},
        boost = {},
        trigger = {}
    }
}

-- Weather-specific move accuracy modifiers
WeatherData.AccuracyModifiers = {
    [2] = { -- RAIN
        ["thunder"] = 100,    -- Thunder always hits in rain
        ["hurricane"] = 100   -- Hurricane always hits in rain
    },
    [1] = { -- SUNNY
        ["thunder"] = 50,     -- Thunder accuracy reduced in sun
        ["hurricane"] = 50    -- Hurricane accuracy reduced in sun
    },
    [4] = { -- HAIL
        ["blizzard"] = 100    -- Blizzard always hits in hail
    },
    [6] = { -- FOG
        -- All moves have 60% accuracy in fog (applied globally)
    }
}

-- Weather damage per turn
WeatherData.EndTurnDamage = {
    [3] = { -- SANDSTORM
        damage = "1/16",
        immune_types = {Enums.PokemonType.ROCK, Enums.PokemonType.GROUND, Enums.PokemonType.STEEL}
    },
    [4] = { -- HAIL
        damage = "1/16",
        immune_types = {Enums.PokemonType.ICE}
    }
}

-- Weather healing modifiers for specific moves
WeatherData.HealingModifiers = {
    [1] = { -- SUNNY
        ["synthesis"] = "2/3",      -- Synthesis heals 2/3 HP in sun (up from 1/2)
        ["morning_sun"] = "2/3",    -- Morning Sun heals 2/3 HP in sun
        ["moonlight"] = "2/3"       -- Moonlight heals 2/3 HP in sun
    },
    [2] = { -- RAIN
        ["synthesis"] = "1/4",      -- Synthesis heals 1/4 HP in rain (down from 1/2)
        ["morning_sun"] = "1/4",    -- Morning Sun heals 1/4 HP in rain
        ["moonlight"] = "1/4"       -- Moonlight heals 1/4 HP in rain
    },
    [3] = { -- SANDSTORM
        ["synthesis"] = "1/4",      -- Synthesis heals 1/4 HP in sandstorm
        ["morning_sun"] = "1/4",    -- Morning Sun heals 1/4 HP in sandstorm
        ["moonlight"] = "1/4"       -- Moonlight heals 1/4 HP in sandstorm
    },
    [4] = { -- HAIL
        ["synthesis"] = "1/4",      -- Synthesis heals 1/4 HP in hail
        ["morning_sun"] = "1/4",    -- Morning Sun heals 1/4 HP in hail
        ["moonlight"] = "1/4"       -- Moonlight heals 1/4 HP in hail
    }
}

-- Weather stat modifiers (applied continuously while weather is active)
WeatherData.StatModifiers = {
    [3] = { -- SANDSTORM
        -- Rock-type Pokemon get 50% SpDef boost
        type_modifiers = {
            [Enums.PokemonType.ROCK] = {
                [Enums.Stat.SPDEF] = 1.5
            }
        }
    },
    [5] = { -- SNOW
        -- Ice-type Pokemon get 50% Defense boost
        type_modifiers = {
            [Enums.PokemonType.ICE] = {
                [Enums.Stat.DEF] = 1.5
            }
        }
    }
}

-- Weather duration data
WeatherData.DurationData = {
    default = 5,     -- Standard weather duration
    permanent = -1,  -- Permanent weather (Primoridal weather conditions)
    abilities = {
        [Enums.AbilityId.DROUGHT] = {duration = 5, weather = 1},      -- Sunny
        [Enums.AbilityId.DRIZZLE] = {duration = 5, weather = 2},      -- Rain  
        [Enums.AbilityId.SAND_STREAM] = {duration = 5, weather = 3}   -- Sandstorm
    }
}

-- Get weather type modifier for move power
-- @param weatherType: Current weather type (1-9)
-- @param moveType: Move type ID
-- @return: Power multiplier (1.0 = no change)
function WeatherData.getTypePowerModifier(weatherType, moveType)
    local modifiers = WeatherData.TypeModifiers[weatherType]
    if not modifiers then
        return 1.0
    end
    
    return modifiers[moveType] or 1.0
end

-- Get weather accuracy modifier for specific moves
-- @param weatherType: Current weather type
-- @param moveName: Name of the move (lowercase)
-- @return: Accuracy value or nil for no change
function WeatherData.getAccuracyModifier(weatherType, moveName)
    local modifiers = WeatherData.AccuracyModifiers[weatherType]
    if not modifiers then
        return nil
    end
    
    return modifiers[moveName]
end

-- Get end-turn damage for weather
-- @param weatherType: Current weather type
-- @param pokemonTypes: Array of Pokemon types
-- @param pokemonAbility: Pokemon ability ID
-- @return: Damage amount string or nil
function WeatherData.getEndTurnDamage(weatherType, pokemonTypes, pokemonAbility)
    local damageData = WeatherData.EndTurnDamage[weatherType]
    if not damageData then
        return nil
    end
    
    -- Check type immunity
    if damageData.immune_types then
        for _, immuneType in ipairs(damageData.immune_types) do
            for _, pokemonType in ipairs(pokemonTypes) do
                if pokemonType == immuneType then
                    return nil -- Immune to weather damage
                end
            end
        end
    end
    
    -- Check ability immunity
    local abilityData = WeatherData.AbilityInteractions[weatherType]
    if abilityData and abilityData.immunity and abilityData.immunity[pokemonAbility] then
        return nil -- Ability grants immunity
    end
    
    return damageData.damage
end

-- Get healing modifier for weather-dependent moves
-- @param weatherType: Current weather type
-- @param moveName: Name of the healing move
-- @return: Healing fraction string or nil
function WeatherData.getHealingModifier(weatherType, moveName)
    local modifiers = WeatherData.HealingModifiers[weatherType]
    if not modifiers then
        return nil
    end
    
    return modifiers[moveName]
end

-- Get stat modifier from weather
-- @param weatherType: Current weather type
-- @param pokemonTypes: Array of Pokemon types
-- @param stat: Stat to check
-- @return: Stat multiplier or 1.0 for no change
function WeatherData.getStatModifier(weatherType, pokemonTypes, stat)
    local modifierData = WeatherData.StatModifiers[weatherType]
    if not modifierData or not modifierData.type_modifiers then
        return 1.0
    end
    
    for _, pokemonType in ipairs(pokemonTypes) do
        local typeModifiers = modifierData.type_modifiers[pokemonType]
        if typeModifiers and typeModifiers[stat] then
            return typeModifiers[stat]
        end
    end
    
    return 1.0
end

-- Check if ability is boosted by weather
-- @param weatherType: Current weather type
-- @param abilityId: Ability to check
-- @return: Boost data table or nil
function WeatherData.getAbilityBoost(weatherType, abilityId)
    local abilityData = WeatherData.AbilityInteractions[weatherType]
    if not abilityData or not abilityData.boost then
        return nil
    end
    
    return abilityData.boost[abilityId]
end

-- Check if ability triggers weather
-- @param abilityId: Ability to check
-- @return: Weather type or nil
function WeatherData.getAbilityWeather(abilityId)
    local durationData = WeatherData.DurationData.abilities[abilityId]
    return durationData and durationData.weather or nil
end

return WeatherData