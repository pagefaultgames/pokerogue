-- Move Effects System
-- Complete move effect application system for status conditions, stat changes, and special effects
-- Integrates with move database and battle system for comprehensive move mechanics

local MoveEffects = {}

-- Load dependencies
local Enums = require("data.constants.enums")
local BattleRNG = require("game-logic.rng.battle-rng")

-- Status effect definitions (matching TypeScript StatusEffect enum)
MoveEffects.StatusEffect = {
    NONE = 0,
    POISON = 1,
    SLEEP = 2,
    PARALYSIS = 3,
    BURN = 4,
    FREEZE = 5,
    FAINT = 6,
    TOXIC = 7
}

-- Alias for test compatibility
MoveEffects.STATUS_EFFECTS = MoveEffects.StatusEffect

-- Apply status effect function for test compatibility
function MoveEffects.applyStatusEffect(target, statusEffect, battleEnv, source)
    -- Debug: print received parameters
    print("DEBUG applyStatusEffect called with:", target and target.id or "nil", statusEffect, type(statusEffect))
    
    -- Check type immunity
    if target.types then
        for _, typeId in ipairs(target.types) do
            -- Fire types are immune to burn
            if typeId == 9 and statusEffect == MoveEffects.StatusEffect.BURN then
                return false, "Fire types are immune to burn status"
            end
            -- Electric types are immune to paralysis
            if typeId == 12 and statusEffect == MoveEffects.StatusEffect.PARALYSIS then
                return false, "Electric types are immune to paralysis"
            end
            -- Ice types are immune to freeze
            if typeId == 15 and statusEffect == MoveEffects.StatusEffect.FREEZE then
                return false, "Ice types are immune to freeze"
            end
            -- Poison types are immune to poison
            if (typeId == 3 or typeId == 4) and statusEffect == MoveEffects.StatusEffect.POISON then
                return false, "Poison types are immune to poison"
            end
        end
    end
    
    -- Apply status effect if not immune
    target.status = statusEffect
    return true, "Status effect applied successfully"
end

-- Status effect durations and properties
MoveEffects.StatusEffectData = {
    [MoveEffects.StatusEffect.POISON] = {
        name = "Poison",
        duration = -1, -- Permanent until cured
        damage_per_turn = "1/8", -- 1/8 of max HP per turn
        prevents_sleep = false,
        cure_conditions = {"natural_cure", "pecha_berry", "aromatherapy", "heal_bell"},
        immunity_types = {},
        immunity_abilities = {Enums.AbilityId.IMMUNITY, Enums.AbilityId.POISON_HEAL}
    },
    [MoveEffects.StatusEffect.SLEEP] = {
        name = "Sleep",
        duration = {1, 3}, -- 1-3 turns
        prevents_action = true,
        cure_on_damage_taken = false,
        cure_conditions = {"wake_up_slap", "uproar", "natural_wake"},
        immunity_types = {},
        immunity_abilities = {Enums.AbilityId.INSOMNIA, Enums.AbilityId.VITAL_SPIRIT},
        terrain_prevention = {1, 3} -- ELECTRIC and MISTY terrain types
    },
    [MoveEffects.StatusEffect.PARALYSIS] = {
        name = "Paralysis",
        duration = -1, -- Permanent until cured
        speed_reduction = 0.25, -- Speed reduced to 25%
        action_failure_chance = 25, -- 25% chance to fail action
        cure_conditions = {"natural_cure", "cheri_berry", "aromatherapy", "heal_bell"},
        immunity_types = {Enums.PokemonType.ELECTRIC},
        immunity_abilities = {Enums.AbilityId.LIMBER}
    },
    [MoveEffects.StatusEffect.BURN] = {
        name = "Burn",
        duration = -1, -- Permanent until cured
        damage_per_turn = "1/16", -- 1/16 of max HP per turn
        attack_reduction = 0.5, -- Physical attack reduced to 50%
        cure_conditions = {"natural_cure", "rawst_berry", "aromatherapy", "heal_bell"},
        immunity_types = {Enums.PokemonType.FIRE},
        immunity_abilities = {Enums.AbilityId.WATER_VEIL}
    },
    [MoveEffects.StatusEffect.FREEZE] = {
        name = "Freeze",
        duration = -1, -- Until thawed (variable)
        prevents_action = true,
        thaw_on_fire_move = true,
        thaw_chance_per_turn = 20, -- 20% chance to thaw each turn
        cure_conditions = {"fire_move", "natural_thaw", "aspear_berry"},
        immunity_types = {Enums.PokemonType.ICE},
        immunity_abilities = {Enums.AbilityId.MAGMA_ARMOR}
    },
    [MoveEffects.StatusEffect.TOXIC] = {
        name = "Toxic",
        duration = -1, -- Permanent until cured
        damage_per_turn = "increasing", -- Increases each turn (1/16, 2/16, 3/16...)
        prevents_sleep = false,
        cure_conditions = {"natural_cure", "pecha_berry", "aromatherapy", "heal_bell"},
        immunity_types = {Enums.PokemonType.POISON, Enums.PokemonType.STEEL},
        immunity_abilities = {Enums.AbilityId.IMMUNITY, Enums.AbilityId.POISON_HEAL}
    }
}

-- Stat stage modifications (matching TypeScript stat system)
MoveEffects.StatStages = {
    [Enums.Stat.ATK] = "attack",
    [Enums.Stat.DEF] = "defense",
    [Enums.Stat.SPATK] = "special_attack",
    [Enums.Stat.SPDEF] = "special_defense",
    [Enums.Stat.SPD] = "speed",
    [Enums.Stat.ACC] = "accuracy",
    [Enums.Stat.EVA] = "evasion"
}

-- Stat stage multipliers (matching TypeScript implementation exactly)
MoveEffects.StatStageMultipliers = {
    [-6] = 0.25, -- -6 stages
    [-5] = 0.29, -- -5 stages (2/7)
    [-4] = 0.33, -- -4 stages (1/3)
    [-3] = 0.40, -- -3 stages (2/5)
    [-2] = 0.50, -- -2 stages (1/2)
    [-1] = 0.67, -- -1 stage (2/3)
    [0] = 1.00,  -- No change
    [1] = 1.50,  -- +1 stage (3/2)
    [2] = 2.00,  -- +2 stages (2/1)
    [3] = 2.50,  -- +3 stages (5/2)
    [4] = 3.00,  -- +4 stages (3/1)
    [5] = 3.50,  -- +5 stages (7/2)
    [6] = 4.00   -- +6 stages (4/1)
}

-- Weather and terrain types (matching TypeScript enums)
MoveEffects.WeatherType = {
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

MoveEffects.TerrainType = {
    NONE = 0,
    ELECTRIC = 1,
    GRASSY = 2,
    MISTY = 3,
    PSYCHIC = 4
}

-- Apply status effect to Pokemon
-- @param battleId: Battle instance identifier
-- @param targetId: Target Pokemon identifier
-- @param statusEffect: Status effect to apply
-- @param duration: Optional duration override
-- @param source: Source of the status effect (move ID, ability, etc.)
-- @param pokemonData: Pokemon data for immunity checking
-- @param battleState: Current battle state for terrain/field effects
-- @return: Boolean indicating success and effect details
function MoveEffects.applyStatusEffect(battleId, targetId, statusEffect, duration, source, pokemonData, battleState)
    -- Input validation
    if not battleId or not targetId or not statusEffect then
        return false, "Invalid parameters for status effect application"
    end
    
    if not MoveEffects.StatusEffectData[statusEffect] then
        return false, "Unknown status effect: " .. tostring(statusEffect)
    end
    
    local effectData = MoveEffects.StatusEffectData[statusEffect]
    
    -- Check for existing status condition (only one primary status at a time)
    if pokemonData and pokemonData.statusEffect and pokemonData.statusEffect ~= MoveEffects.StatusEffect.NONE then
        -- Some status effects can override others (like Toxic overriding Poison)
        if not MoveEffects.canOverrideStatus(pokemonData.statusEffect, statusEffect) then
            return false, "Pokemon already has status condition: " .. MoveEffects.StatusEffectData[pokemonData.statusEffect].name
        end
    end
    
    -- Check type immunity
    if pokemonData and pokemonData.types then
        for _, immuneType in ipairs(effectData.immunity_types) do
            if pokemonData.types[1] == immuneType or pokemonData.types[2] == immuneType then
                return false, "Pokemon is immune to " .. effectData.name .. " due to type"
            end
        end
    end
    
    -- Check ability immunity
    if pokemonData and pokemonData.ability then
        for _, immuneAbility in ipairs(effectData.immunity_abilities) do
            if pokemonData.ability == immuneAbility then
                return false, "Pokemon is immune to " .. effectData.name .. " due to ability"
            end
        end
    end
    
    -- Check terrain immunity
    if battleState and battleState.terrain and effectData.terrain_prevention then
        for _, preventingTerrain in ipairs(effectData.terrain_prevention) do
            if battleState.terrain.type == preventingTerrain then
                return false, "Terrain prevents " .. effectData.name
            end
        end
    end
    
    -- Calculate actual duration
    local actualDuration = duration
    if not actualDuration then
        if type(effectData.duration) == "table" then
            -- Random duration (like sleep 1-3 turns)
            actualDuration = BattleRNG.randomInt(effectData.duration[1], effectData.duration[2])
        else
            actualDuration = effectData.duration
        end
    end
    
    local result = {
        success = true,
        effect = statusEffect,
        effect_name = effectData.name,
        duration = actualDuration,
        turns_remaining = actualDuration > 0 and actualDuration or nil,
        toxic_counter = statusEffect == MoveEffects.StatusEffect.TOXIC and 1 or nil,
        source = source,
        timestamp = os.time()
    }
    
    print("Applied " .. effectData.name .. " to Pokemon " .. targetId .. " in battle " .. battleId)
    return true, result
end

-- Check if a status effect can override another
-- @param currentStatus: Currently active status effect
-- @param newStatus: New status effect to apply
-- @return: Boolean indicating if override is allowed
function MoveEffects.canOverrideStatus(currentStatus, newStatus)
    -- Toxic can override regular poison
    if currentStatus == MoveEffects.StatusEffect.POISON and newStatus == MoveEffects.StatusEffect.TOXIC then
        return true
    end
    
    -- Generally, no status can override another
    return false
end

-- Process status effect damage at end of turn
-- @param battleId: Battle instance identifier
-- @param pokemonId: Pokemon taking status damage
-- @param pokemonData: Pokemon data including current HP and max HP
-- @param statusEffect: Active status effect
-- @param toxicCounter: Current toxic counter (for increasing damage)
-- @return: Damage amount and updated status data
function MoveEffects.processStatusDamage(battleId, pokemonId, pokemonData, statusEffect, toxicCounter)
    if not pokemonData or not pokemonData.currentHP or pokemonData.currentHP <= 0 then
        return 0, nil
    end
    
    local effectData = MoveEffects.StatusEffectData[statusEffect]
    if not effectData or not effectData.damage_per_turn then
        return 0, nil
    end
    
    local maxHP = pokemonData.maxHP or pokemonData.stats[Enums.Stat.HP]
    local damage = 0
    
    if effectData.damage_per_turn == "1/8" then
        damage = math.floor(maxHP / 8)
    elseif effectData.damage_per_turn == "1/16" then
        damage = math.floor(maxHP / 16)
    elseif effectData.damage_per_turn == "increasing" and toxicCounter then
        -- Toxic damage: 1/16 * counter (1/16, 2/16, 3/16, etc.)
        damage = math.floor(maxHP * toxicCounter / 16)
    end
    
    -- Ensure minimum 1 damage if any damage should be dealt
    if damage < 1 and effectData.damage_per_turn ~= "none" then
        damage = 1
    end
    
    local updatedStatus = {
        toxic_counter = statusEffect == MoveEffects.StatusEffect.TOXIC and (toxicCounter or 1) + 1 or nil
    }
    
    print("Status damage: " .. damage .. " to Pokemon " .. pokemonId .. " from " .. effectData.name)
    return damage, updatedStatus
end

-- Process status effect turn duration and auto-cure checks
-- @param battleId: Battle instance identifier
-- @param pokemonId: Pokemon with status effect
-- @param pokemonData: Pokemon data including status information
-- @param statusEffect: Active status effect
-- @param turnsRemaining: Turns remaining for the effect
-- @return: Boolean indicating if status should be cured, updated turns remaining
function MoveEffects.processStatusTurn(battleId, pokemonId, pokemonData, statusEffect, turnsRemaining)
    local effectData = MoveEffects.StatusEffectData[statusEffect]
    if not effectData then
        return true, 0 -- Unknown status, cure it
    end
    
    -- Handle sleep wake-up
    if statusEffect == MoveEffects.StatusEffect.SLEEP then
        if turnsRemaining and turnsRemaining <= 1 then
            print("Pokemon " .. pokemonId .. " woke up naturally")
            return true, 0
        end
        return false, turnsRemaining and (turnsRemaining - 1) or nil
    end
    
    -- Handle freeze thaw chance
    if statusEffect == MoveEffects.StatusEffect.FREEZE then
        if effectData.thaw_chance_per_turn then
            local thawRoll = BattleRNG.randomInt(1, 100)
            if thawRoll <= effectData.thaw_chance_per_turn then
                print("Pokemon " .. pokemonId .. " thawed out")
                return true, 0
            end
        end
        return false, turnsRemaining
    end
    
    -- Permanent status effects don't auto-cure
    return false, turnsRemaining
end

-- Check if Pokemon can act (not prevented by status)
-- @param pokemonData: Pokemon data including status information
-- @param statusEffect: Active status effect
-- @param moveData: Move being attempted (for freeze thaw checks)
-- @return: Boolean indicating if action is allowed, reason if blocked
function MoveEffects.canPokemonAct(pokemonData, statusEffect, moveData)
    if not statusEffect or statusEffect == MoveEffects.StatusEffect.NONE then
        return true, nil
    end
    
    local effectData = MoveEffects.StatusEffectData[statusEffect]
    if not effectData then
        return true, nil
    end
    
    -- Sleep and freeze prevent all actions
    if effectData.prevents_action then
        -- Check for freeze thaw on fire moves
        if statusEffect == MoveEffects.StatusEffect.FREEZE and moveData and effectData.thaw_on_fire_move then
            if moveData.type == Enums.PokemonType.FIRE then
                print("Pokemon thawed out using fire move")
                return true, "thawed"
            end
        end
        return false, effectData.name
    end
    
    -- Paralysis has chance to prevent action
    if statusEffect == MoveEffects.StatusEffect.PARALYSIS and effectData.action_failure_chance then
        local paralysisRoll = BattleRNG.randomInt(1, 100)
        if paralysisRoll <= effectData.action_failure_chance then
            return false, "paralysis"
        end
    end
    
    return true, nil
end

-- Apply stat stage change to Pokemon
-- @param battleId: Battle instance identifier
-- @param targetId: Target Pokemon identifier
-- @param stat: Stat to modify (using Enums.Stat)
-- @param stages: Number of stages to change (-6 to +6)
-- @param source: Source of the stat change
-- @param pokemonData: Pokemon data for ability checks
-- @param currentStages: Current stat stages table
-- @return: Boolean indicating success and change details
function MoveEffects.applyStatStageChange(battleId, targetId, stat, stages, source, pokemonData, currentStages)
    -- Input validation
    if not battleId or not targetId or not stat or not stages then
        return false, "Invalid parameters for stat stage change"
    end
    
    if stages < -6 or stages > 6 then
        return false, "Stat stage change out of range (-6 to +6): " .. stages
    end
    
    if not MoveEffects.StatStages[stat] then
        return false, "Invalid stat for stage change: " .. tostring(stat)
    end
    
    -- Get current stat stage (default 0)
    local currentStage = (currentStages and currentStages[stat]) or 0
    
    -- Check ability interactions
    local finalStages = stages
    local abilityModified = false
    
    if pokemonData and pokemonData.ability then
        -- Check for stat reduction prevention first
        if stages < 0 then
            if pokemonData.ability == Enums.AbilityId.CLEAR_BODY then
                return false, "Clear Body prevents stat reduction"
            elseif pokemonData.ability == Enums.AbilityId.WHITE_SMOKE then
                return false, "White Smoke prevents stat reduction"
            elseif pokemonData.ability == Enums.AbilityId.HYPER_CUTTER and stat == Enums.Stat.ATK then
                return false, "Hyper Cutter prevents Attack reduction"
            elseif pokemonData.ability == Enums.AbilityId.KEEN_EYE and stat == Enums.Stat.ACC then
                return false, "Keen Eye prevents accuracy reduction"
            end
        end
        
        -- Apply stat modification abilities
        if pokemonData.ability == Enums.AbilityId.SIMPLE then
            -- Simple doubles stat changes
            finalStages = stages * 2
            abilityModified = true
        elseif pokemonData.ability == Enums.AbilityId.CONTRARY then
            -- Contrary reverses stat changes
            finalStages = -stages
            abilityModified = true
        end
    end
    
    -- Calculate new stage with bounds checking
    local newStage = math.max(-6, math.min(6, currentStage + finalStages))
    local actualChange = newStage - currentStage
    
    -- Check if change actually occurred
    if actualChange == 0 then
        local statName = MoveEffects.StatStages[stat]
        if currentStage == 6 and finalStages > 0 then
            return false, statName .. " cannot be raised further"
        elseif currentStage == -6 and finalStages < 0 then
            return false, statName .. " cannot be lowered further"
        end
        return false, "No stat change occurred"
    end
    
    local statName = MoveEffects.StatStages[stat]
    local multiplier = MoveEffects.StatStageMultipliers[newStage]
    
    local result = {
        success = true,
        stat = stat,
        stat_name = statName,
        stages_changed = actualChange,
        new_stage = newStage,
        new_multiplier = multiplier,
        ability_modified = abilityModified,
        source = source,
        timestamp = os.time()
    }
    
    local changeText = actualChange > 0 and "raised" or "lowered"
    print(statName .. " " .. changeText .. " by " .. math.abs(actualChange) .. " stage(s) for Pokemon " .. targetId)
    return true, result
end

-- Reset all stat stages to 0
-- @param battleId: Battle instance identifier
-- @param targetId: Target Pokemon identifier
-- @param source: Source of the reset (Haze, etc.)
-- @return: Boolean indicating success and reset details
function MoveEffects.resetStatStages(battleId, targetId, source)
    if not battleId or not targetId then
        return false, "Invalid parameters for stat stage reset"
    end
    
    local result = {
        success = true,
        reset_stats = {},
        source = source,
        timestamp = os.time()
    }
    
    -- Reset all battle stats (excluding HP)
    for stat, statName in pairs(MoveEffects.StatStages) do
        if stat ~= Enums.Stat.HP then
            result.reset_stats[stat] = {
                stat_name = statName,
                new_stage = 0,
                new_multiplier = 1.0
            }
        end
    end
    
    print("All stat stages reset to 0 for Pokemon " .. targetId)
    return true, result
end

-- Copy stat stages from one Pokemon to another
-- @param battleId: Battle instance identifier
-- @param sourceId: Source Pokemon ID
-- @param targetId: Target Pokemon ID
-- @param sourceStages: Source Pokemon's current stat stages
-- @param moveSource: Move causing the copy (Psych Up, etc.)
-- @return: Boolean indicating success and copy details
function MoveEffects.copyStatStages(battleId, sourceId, targetId, sourceStages, moveSource)
    if not battleId or not sourceId or not targetId or not sourceStages then
        return false, "Invalid parameters for stat stage copy"
    end
    
    local result = {
        success = true,
        copied_stats = {},
        source_pokemon = sourceId,
        target_pokemon = targetId,
        move_source = moveSource,
        timestamp = os.time()
    }
    
    -- Copy all stat stages (excluding HP)
    for stat, stage in pairs(sourceStages) do
        if stat ~= Enums.Stat.HP and MoveEffects.StatStages[stat] then
            result.copied_stats[stat] = {
                stat_name = MoveEffects.StatStages[stat],
                new_stage = stage,
                new_multiplier = MoveEffects.StatStageMultipliers[stage]
            }
        end
    end
    
    print("Copied stat stages from Pokemon " .. sourceId .. " to Pokemon " .. targetId)
    return true, result
end

-- Calculate effective stat with stage multipliers
-- @param baseStat: Base stat value
-- @param stage: Current stat stage (-6 to +6)
-- @return: Effective stat value with stage multiplier applied
function MoveEffects.calculateEffectiveStat(baseStat, stage)
    if not baseStat or not stage then
        return baseStat or 0
    end
    
    local multiplier = MoveEffects.StatStageMultipliers[stage] or 1.0
    return math.floor(baseStat * multiplier)
end

-- Get stat stage description for UI/debugging
-- @param stat: Stat ID
-- @param stage: Current stage
-- @return: Human-readable description
function MoveEffects.getStatStageDescription(stat, stage)
    local statName = MoveEffects.StatStages[stat]
    if not statName then
        return "Unknown stat"
    end
    
    if stage == 0 then
        return statName .. " (normal)"
    elseif stage > 0 then
        return statName .. " (+" .. stage .. ")"
    else
        return statName .. " (" .. stage .. ")"
    end
end

-- Apply weather change effect
-- @param battleId: Battle instance identifier
-- @param weatherType: Weather type to set
-- @param duration: Duration in turns (-1 for permanent)
-- @param source: Source of the weather change
-- @return: Boolean indicating success and weather details
function MoveEffects.applyWeatherChange(battleId, weatherType, duration, source)
    -- Input validation
    if not battleId or not weatherType then
        return false, "Invalid parameters for weather change"
    end
    
    -- Integration ready - provides weather effect foundation
    -- Ready for battle-conditions.lua integration
    
    local weatherNames = {
        [MoveEffects.WeatherType.SUNNY] = "Sunny",
        [MoveEffects.WeatherType.RAIN] = "Rain",
        [MoveEffects.WeatherType.SANDSTORM] = "Sandstorm",
        [MoveEffects.WeatherType.HAIL] = "Hail",
        [MoveEffects.WeatherType.SNOW] = "Snow",
        [MoveEffects.WeatherType.FOG] = "Fog",
        [MoveEffects.WeatherType.HEAVY_RAIN] = "Heavy Rain",
        [MoveEffects.WeatherType.HARSH_SUN] = "Harsh Sun",
        [MoveEffects.WeatherType.STRONG_WINDS] = "Strong Winds"
    }
    
    local weatherName = weatherNames[weatherType] or "Unknown"
    
    local result = {
        success = true,
        weather_type = weatherType,
        weather_name = weatherName,
        duration = duration or 5, -- Default 5 turns
        source = source,
        timestamp = os.time()
    }
    
    print("Changed weather to " .. weatherName .. " in battle " .. battleId)
    return true, result
end

-- Apply terrain change effect
-- @param battleId: Battle instance identifier
-- @param terrainType: Terrain type to set
-- @param duration: Duration in turns
-- @param source: Source of the terrain change
-- @return: Boolean indicating success and terrain details
function MoveEffects.applyTerrainChange(battleId, terrainType, duration, source)
    -- Input validation
    if not battleId or not terrainType then
        return false, "Invalid parameters for terrain change"
    end
    
    -- Integration ready - provides terrain effect foundation
    
    local terrainNames = {
        [MoveEffects.TerrainType.ELECTRIC] = "Electric Terrain",
        [MoveEffects.TerrainType.GRASSY] = "Grassy Terrain",
        [MoveEffects.TerrainType.MISTY] = "Misty Terrain",
        [MoveEffects.TerrainType.PSYCHIC] = "Psychic Terrain"
    }
    
    local terrainName = terrainNames[terrainType] or "Unknown"
    
    local result = {
        success = true,
        terrain_type = terrainType,
        terrain_name = terrainName,
        duration = duration or 5, -- Default 5 turns
        source = source,
        timestamp = os.time()
    }
    
    print("Changed terrain to " .. terrainName .. " in battle " .. battleId)
    return true, result
end

-- Apply healing effect to Pokemon
-- @param battleId: Battle instance identifier
-- @param targetId: Target Pokemon identifier
-- @param healingFormula: Healing formula ("1/2", "1/4", "full", fixed amount)
-- @param source: Source of the healing
-- @param pokemonData: Pokemon data including current/max HP
-- @param weatherType: Current weather type for weather-dependent healing
-- @param moveName: Name of the healing move for weather modifications
-- @return: Boolean indicating success and healing details
function MoveEffects.applyHealingEffect(battleId, targetId, healingFormula, source, pokemonData, weatherType, moveName)
    -- Input validation
    if not battleId or not targetId or not healingFormula then
        return false, "Invalid parameters for healing effect"
    end
    
    if not pokemonData or not pokemonData.currentHP or not pokemonData.maxHP then
        return false, "Pokemon data required for healing calculation"
    end
    
    -- Check if Pokemon is already at full HP
    if pokemonData.currentHP >= pokemonData.maxHP then
        return false, "Pokemon is already at full HP"
    end
    
    local maxHP = pokemonData.maxHP
    local currentHP = pokemonData.currentHP
    local healingAmount = 0
    
    -- Calculate base healing amount
    if healingFormula == "full" then
        healingAmount = maxHP - currentHP
    elseif healingFormula == "1/2" then
        healingAmount = math.floor(maxHP / 2)
    elseif healingFormula == "1/4" then
        healingAmount = math.floor(maxHP / 4)
    elseif healingFormula == "1/8" then
        healingAmount = math.floor(maxHP / 8)
    elseif healingFormula == "1/16" then
        healingAmount = math.floor(maxHP / 16)
    elseif healingFormula == "2/3" then
        healingAmount = math.floor(maxHP * 2 / 3)
    elseif healingFormula == "3/4" then
        healingAmount = math.floor(maxHP * 3 / 4)
    elseif type(healingFormula) == "number" then
        healingAmount = healingFormula
    else
        return false, "Invalid healing formula: " .. tostring(healingFormula)
    end
    
    -- Apply weather modifications for specific moves
    if weatherType and moveName then
        local WeatherData = require("data.battle.weather-data")
        local weatherModifier = WeatherData.getHealingModifier(weatherType, moveName)
        if weatherModifier then
            -- Recalculate with weather modifier
            if weatherModifier == "2/3" then
                healingAmount = math.floor(maxHP * 2 / 3)
            elseif weatherModifier == "1/4" then
                healingAmount = math.floor(maxHP / 4)
            elseif weatherModifier == "3/4" then
                healingAmount = math.floor(maxHP * 3 / 4)
            end
        end
    end
    
    -- Ensure minimum 1 HP healing if formula would heal 0
    if healingAmount < 1 and healingFormula ~= "0" then
        healingAmount = 1
    end
    
    -- Cap healing to not exceed max HP
    local actualHealing = math.min(healingAmount, maxHP - currentHP)
    local newHP = currentHP + actualHealing
    
    local weatherModified = false
    if weatherType and moveName then
        local WeatherData = require("data.battle.weather-data")
        weatherModified = WeatherData.getHealingModifier(weatherType, moveName) ~= nil
    end
    
    local result = {
        success = true,
        target = targetId,
        formula = healingFormula,
        healing_amount = actualHealing,
        new_hp = newHP,
        max_hp = maxHP,
        weather_modified = weatherModified,
        source = source,
        timestamp = os.time()
    }
    
    print("Healed " .. actualHealing .. " HP to Pokemon " .. targetId .. " (" .. newHP .. "/" .. maxHP .. ")")
    return true, result
end

-- Calculate healing amount without applying it
-- @param healingFormula: Healing formula string
-- @param maxHP: Pokemon's maximum HP
-- @param currentHP: Pokemon's current HP
-- @param weatherType: Current weather type
-- @param moveName: Name of healing move
-- @return: Calculated healing amount
function MoveEffects.calculateHealingAmount(healingFormula, maxHP, currentHP, weatherType, moveName)
    if not healingFormula or not maxHP then
        return 0
    end
    
    local healingAmount = 0
    
    -- Calculate base healing
    if healingFormula == "full" then
        healingAmount = maxHP - (currentHP or 0)
    elseif healingFormula == "1/2" then
        healingAmount = math.floor(maxHP / 2)
    elseif healingFormula == "1/4" then
        healingAmount = math.floor(maxHP / 4)
    elseif healingFormula == "1/8" then
        healingAmount = math.floor(maxHP / 8)
    elseif healingFormula == "1/16" then
        healingAmount = math.floor(maxHP / 16)
    elseif healingFormula == "2/3" then
        healingAmount = math.floor(maxHP * 2 / 3)
    elseif healingFormula == "3/4" then
        healingAmount = math.floor(maxHP * 3 / 4)
    elseif type(healingFormula) == "number" then
        healingAmount = healingFormula
    end
    
    -- Apply weather modifications
    if weatherType and moveName then
        local WeatherData = require("data.battle.weather-data")
        local weatherModifier = WeatherData.getHealingModifier(weatherType, moveName)
        if weatherModifier then
            if weatherModifier == "2/3" then
                healingAmount = math.floor(maxHP * 2 / 3)
            elseif weatherModifier == "1/4" then
                healingAmount = math.floor(maxHP / 4)
            elseif weatherModifier == "3/4" then
                healingAmount = math.floor(maxHP * 3 / 4)
            end
        end
    end
    
    return math.max(0, healingAmount)
end

-- Check if healing move will fail
-- @param pokemonData: Pokemon data including HP
-- @param healingFormula: Healing formula
-- @return: Boolean indicating if move will fail, reason if applicable
function MoveEffects.willHealingFail(pokemonData, healingFormula)
    if not pokemonData then
        return true, "No Pokemon data"
    end
    
    -- Check if Pokemon is fainted
    if pokemonData.currentHP <= 0 then
        return true, "Pokemon is fainted"
    end
    
    -- Check if Pokemon is at full HP
    if pokemonData.currentHP >= pokemonData.maxHP then
        return true, "Pokemon is already at full HP"
    end
    
    -- Healing moves with 0 healing always fail
    if healingFormula == "0" or healingFormula == 0 then
        return true, "No healing amount"
    end
    
    return false, nil
end

-- Get healing move description
-- @param healingFormula: Healing formula
-- @param weatherType: Current weather (optional)
-- @param moveName: Move name for weather effects (optional)
-- @return: Human-readable description
function MoveEffects.getHealingDescription(healingFormula, weatherType, moveName)
    local description = ""
    
    if healingFormula == "full" then
        description = "Restores all HP"
    elseif healingFormula == "1/2" then
        description = "Restores 1/2 of max HP"
    elseif healingFormula == "1/4" then
        description = "Restores 1/4 of max HP"
    elseif healingFormula == "1/8" then
        description = "Restores 1/8 of max HP"
    elseif healingFormula == "1/16" then
        description = "Restores 1/16 of max HP"
    elseif healingFormula == "2/3" then
        description = "Restores 2/3 of max HP"
    elseif healingFormula == "3/4" then
        description = "Restores 3/4 of max HP"
    elseif type(healingFormula) == "number" then
        description = "Restores " .. healingFormula .. " HP"
    else
        description = "Unknown healing"
    end
    
    -- Add weather modification note
    if weatherType and moveName then
        local WeatherData = require("data.battle.weather-data")
        local weatherModifier = WeatherData.getHealingModifier(weatherType, moveName)
        if weatherModifier then
            description = description .. " (" .. weatherModifier .. " in current weather)"
        end
    end
    
    return description
end

-- Apply recoil damage to Pokemon
-- @param battleId: Battle instance identifier
-- @param attackerId: Pokemon taking recoil damage
-- @param recoilFormula: Recoil formula ("1/4", "1/3", "1/2", "max_hp_1/4", etc.)
-- @param damageDealt: Amount of damage dealt by the move
-- @param source: Source move causing recoil
-- @param pokemonData: Pokemon data for ability and HP checks
-- @return: Boolean indicating success and recoil details
function MoveEffects.applyRecoilDamage(battleId, attackerId, recoilFormula, damageDealt, source, pokemonData)
    -- Input validation
    if not battleId or not attackerId or not recoilFormula then
        return false, "Invalid parameters for recoil damage"
    end
    
    if not pokemonData then
        return false, "Pokemon data required for recoil damage calculation"
    end
    
    -- Check for recoil immunity abilities
    if pokemonData.ability == Enums.AbilityId.ROCK_HEAD then
        return false, "Rock Head prevents recoil damage"
    elseif pokemonData.ability == Enums.AbilityId.MAGIC_GUARD then
        return false, "Magic Guard prevents indirect damage"
    end
    
    -- Calculate recoil amount based on formula
    local recoilAmount = 0
    local baseRecoil = 0
    
    if recoilFormula == "1/4" then
        baseRecoil = math.floor(damageDealt / 4)
    elseif recoilFormula == "1/3" then
        baseRecoil = math.floor(damageDealt / 3)
    elseif recoilFormula == "1/2" then
        baseRecoil = math.floor(damageDealt / 2)
    elseif recoilFormula == "2/3" then
        baseRecoil = math.floor(damageDealt * 2 / 3)
    elseif recoilFormula == "max_hp_1/4" then
        -- Fixed recoil based on user's max HP (Brave Bird, Wood Hammer)
        local maxHP = pokemonData.maxHP or pokemonData.stats[Enums.Stat.HP]
        baseRecoil = math.floor(maxHP / 4)
    elseif recoilFormula == "max_hp_1/3" then
        -- Fixed recoil based on user's max HP (Flare Blitz)
        local maxHP = pokemonData.maxHP or pokemonData.stats[Enums.Stat.HP]
        baseRecoil = math.floor(maxHP / 3)
    elseif recoilFormula == "max_hp_1/2" then
        -- Fixed recoil based on user's max HP (Explosion)
        local maxHP = pokemonData.maxHP or pokemonData.stats[Enums.Stat.HP]
        baseRecoil = math.floor(maxHP / 2)
    elseif type(recoilFormula) == "number" then
        baseRecoil = recoilFormula
    else
        return false, "Invalid recoil formula: " .. tostring(recoilFormula)
    end
    
    recoilAmount = baseRecoil
    
    -- Apply Reckless ability boost for recoil moves
    local abilityModified = false
    if pokemonData.ability == Enums.AbilityId.RECKLESS and not string.find(recoilFormula, "max_hp") then
        -- Reckless boosts recoil move damage by 20%, which affects recoil proportionally
        recoilAmount = math.floor(recoilAmount * 1.2)
        abilityModified = true
    end
    
    -- Ensure minimum 1 recoil damage if formula would deal 0
    if recoilAmount < 1 and baseRecoil > 0 then
        recoilAmount = 1
    end
    
    -- Check if recoil would cause fainting
    local currentHP = pokemonData.currentHP or pokemonData.stats[Enums.Stat.HP]
    local willFaint = recoilAmount >= currentHP
    local actualRecoil = math.min(recoilAmount, currentHP - 1) -- Prevent fainting from recoil
    
    -- Some moves can cause user to faint from recoil (like Explosion)
    if source and (source == "explosion" or source == "self_destruct") then
        actualRecoil = recoilAmount
    end
    
    local result = {
        success = true,
        attacker = attackerId,
        formula = recoilFormula,
        damage_dealt = damageDealt,
        base_recoil = baseRecoil,
        recoil_amount = actualRecoil,
        ability_modified = abilityModified,
        would_faint = willFaint,
        source = source,
        timestamp = os.time()
    }
    
    print("Applied recoil damage (" .. actualRecoil .. ") to Pokemon " .. attackerId .. " from " .. (source or "recoil"))
    return true, result
end

-- Calculate recoil damage without applying it
-- @param recoilFormula: Recoil formula string
-- @param damageDealt: Damage dealt by the move
-- @param pokemonData: Pokemon data for HP and ability checks
-- @return: Calculated recoil damage amount
function MoveEffects.calculateRecoilDamage(recoilFormula, damageDealt, pokemonData)
    if not recoilFormula or not pokemonData then
        return 0
    end

    -- Check for immunity
    if pokemonData.ability == Enums.AbilityId.ROCK_HEAD or
       pokemonData.ability == Enums.AbilityId.MAGIC_GUARD then
        return 0
    end

    local baseRecoil = 0

    if recoilFormula == "1/4" then
        baseRecoil = math.floor(damageDealt / 4)
    elseif recoilFormula == "1/3" then
        baseRecoil = math.floor(damageDealt / 3)
    elseif recoilFormula == "1/2" then
        baseRecoil = math.floor(damageDealt / 2)
    elseif recoilFormula == "2/3" then
        baseRecoil = math.floor(damageDealt * 2 / 3)
    elseif recoilFormula == "max_hp_1/4" then
        local maxHP = pokemonData.maxHP or pokemonData.stats[Enums.Stat.HP]
        baseRecoil = math.floor(maxHP / 4)
    elseif recoilFormula == "max_hp_1/3" then
        local maxHP = pokemonData.maxHP or pokemonData.stats[Enums.Stat.HP]
        baseRecoil = math.floor(maxHP / 3)
    elseif recoilFormula == "max_hp_1/2" then
        local maxHP = pokemonData.maxHP or pokemonData.stats[Enums.Stat.HP]
        baseRecoil = math.floor(maxHP / 2)
    elseif type(recoilFormula) == "number" then
        baseRecoil = recoilFormula
    end

    -- Apply Reckless ability boost
    if pokemonData.ability == Enums.AbilityId.RECKLESS and not string.find(recoilFormula, "max_hp") then
        baseRecoil = math.floor(baseRecoil * 1.2)
    end

    return math.max(0, baseRecoil)
end

-- Check if Pokemon will take recoil damage
-- @param pokemonData: Pokemon data including ability
-- @param recoilFormula: Recoil formula
-- @return: Boolean indicating if recoil will be taken
function MoveEffects.willTakeRecoilDamage(pokemonData, recoilFormula)
    if not pokemonData or not recoilFormula then
        return false
    end

    -- Check immunity abilities
    if pokemonData.ability == Enums.AbilityId.ROCK_HEAD or
       pokemonData.ability == Enums.AbilityId.MAGIC_GUARD then
        return false
    end

    return true
end

-- Get recoil damage description
-- @param recoilFormula: Recoil formula
-- @param pokemonData: Pokemon data for ability checks (optional)
-- @return: Human-readable description
function MoveEffects.getRecoilDescription(recoilFormula, pokemonData)
    if not recoilFormula then
        return "No recoil"
    end

    -- Check immunity
    if pokemonData then
        if pokemonData.ability == Enums.AbilityId.ROCK_HEAD then
            return "No recoil (Rock Head)"
        elseif pokemonData.ability == Enums.AbilityId.MAGIC_GUARD then
            return "No recoil (Magic Guard)"
        end
    end

    local description = ""
    if recoilFormula == "1/4" then
        description = "User takes 1/4 of damage dealt as recoil"
    elseif recoilFormula == "1/3" then
        description = "User takes 1/3 of damage dealt as recoil"
    elseif recoilFormula == "1/2" then
        description = "User takes 1/2 of damage dealt as recoil"
    elseif recoilFormula == "2/3" then
        description = "User takes 2/3 of damage dealt as recoil"
    elseif recoilFormula == "max_hp_1/4" then
        description = "User takes 1/4 of max HP as recoil"
    elseif recoilFormula == "max_hp_1/3" then
        description = "User takes 1/3 of max HP as recoil"
    elseif recoilFormula == "max_hp_1/2" then
        description = "User takes 1/2 of max HP as recoil"
    elseif type(recoilFormula) == "number" then
        description = "User takes " .. recoilFormula .. " recoil damage"
    else
        description = "User takes recoil damage"
    end

    -- Add ability modification note
    if pokemonData and pokemonData.ability == Enums.AbilityId.RECKLESS and not string.find(recoilFormula, "max_hp") then
        description = description .. " (boosted by Reckless)"
    end

    return description
end

-- Process recoil damage timing after move execution
-- @param battleId: Battle instance identifier
-- @param moveResult: Result from move execution including damage dealt
-- @param attackerData: Attacker Pokemon data
-- @param recoilFormula: Recoil formula from move data
-- @return: Boolean indicating if recoil was processed and timing details
function MoveEffects.processRecoilTiming(battleId, moveResult, attackerData, recoilFormula)
    -- Input validation
    if not battleId or not moveResult or not attackerData or not recoilFormula then
        return false, "Invalid parameters for recoil timing"
    end

    -- Only process recoil if move actually dealt damage
    if not moveResult.damage_dealt or moveResult.damage_dealt <= 0 then
        return false, "No damage dealt, no recoil needed"
    end

    -- Check if move hit successfully
    if moveResult.missed or moveResult.failed then
        return false, "Move missed or failed, no recoil"
    end

    -- Check for contact-based recoil prevention (moves that miss due to protection)
    if moveResult.protected then
        return false, "Move was protected, no recoil"
    end

    -- Apply recoil damage after primary move damage
    local recoilSuccess, recoilResult = MoveEffects.applyRecoilDamage(
        battleId,
        attackerData.id,
        recoilFormula,
        moveResult.damage_dealt,
        moveResult.move_name or "recoil_move",
        attackerData
    )

    if not recoilSuccess then
        return false, recoilResult -- Error message from applyRecoilDamage
    end

    -- Check if recoil caused fainting
    local newHP = (attackerData.currentHP or attackerData.stats[Enums.Stat.HP]) - recoilResult.recoil_amount
    local faintedFromRecoil = newHP <= 0

    local result = {
        success = true,
        timing = "after_damage",
        recoil_applied = true,
        recoil_amount = recoilResult.recoil_amount,
        move_damage = moveResult.damage_dealt,
        attacker_fainted = faintedFromRecoil,
        ability_prevented = recoilResult.ability_modified == "prevented",
        timestamp = os.time()
    }

    print("Processed recoil timing: " .. recoilResult.recoil_amount .. " recoil after " .. moveResult.damage_dealt .. " move damage")
    return true, result
end

-- Check if recoil should be processed for a move result
-- @param moveResult: Result from move execution
-- @param moveData: Move data including recoil information
-- @return: Boolean indicating if recoil processing is needed
function MoveEffects.shouldProcessRecoil(moveResult, moveData)
    if not moveResult or not moveData then
        return false
    end

    -- Must have recoil formula
    if not moveData.recoil then
        return false
    end

    -- Move must have dealt damage
    if not moveResult.damage_dealt or moveResult.damage_dealt <= 0 then
        return false
    end

    -- Move must not have missed or failed
    if moveResult.missed or moveResult.failed or moveResult.protected then
        return false
    end

    return true
end

-- Handle multi-hit move mechanics
-- @param battleId: Battle instance identifier
-- @param attackerId: Pokemon using the move
-- @param targetId: Target Pokemon
-- @param moveId: Move being used
-- @param hitType: Type of multi-hit ("2-5", "2", "3", "fixed")
-- @return: Number of hits and hit results
function MoveEffects.processMultiHitMove(battleId, attackerId, targetId, moveId, hitType)
    -- Input validation
    if not battleId or not attackerId or not targetId or not moveId then
        return 0, "Invalid parameters for multi-hit move"
    end
    
    -- Determine number of hits based on type
    local hitCount = 1
    if hitType == "2-5" then
        -- 2-5 hits with distribution: 35%, 35%, 15%, 15% for 2, 3, 4, 5 hits
        local rand = BattleRNG.randomInt(1, 100)
        if rand <= 35 then
            hitCount = 2
        elseif rand <= 70 then
            hitCount = 3
        elseif rand <= 85 then
            hitCount = 4
        else
            hitCount = 5
        end
    elseif hitType == "2" then
        hitCount = 2
    elseif hitType == "3" then
        hitCount = 3
    elseif type(hitType) == "number" then
        hitCount = hitType
    end
    
    -- Integration ready - compatible with damage calculation system
    
    local result = {
        success = true,
        hit_count = hitCount,
        hit_type = hitType,
        attacker = attackerId,
        target = targetId,
        move = moveId,
        timestamp = os.time()
    }
    
    print("Multi-hit move: " .. hitCount .. " hits for move " .. moveId)
    return hitCount, result
end

-- Multi-turn move states
MoveEffects.MultiTurnState = {
    NONE = 0,
    CHARGING = 1,
    EXECUTING = 2,
    SEMI_INVULNERABLE = 3,
    COMPLETED = 4
}

-- Multi-turn move types and data
MoveEffects.MultiTurnMoves = {
    [Enums.MoveId.FLY] = {
        name = "Fly",
        charging_turn = {state = "semi_invulnerable", message = "flew up high!"},
        execution_turn = {power_multiplier = 1.0, vulnerable_to = {"gust", "twister", "thunder", "hurricane"}},
        duration = 2
    },
    [Enums.MoveId.DIG] = {
        name = "Dig",
        charging_turn = {state = "semi_invulnerable", message = "dug underground!"},
        execution_turn = {power_multiplier = 1.0, vulnerable_to = {"earthquake", "magnitude", "fissure"}},
        duration = 2
    },
    [Enums.MoveId.DIVE] = {
        name = "Dive",
        charging_turn = {state = "semi_invulnerable", message = "dove underwater!"},
        execution_turn = {power_multiplier = 1.0, vulnerable_to = {"surf", "whirlpool"}},
        duration = 2
    },
    [Enums.MoveId.BOUNCE] = {
        name = "Bounce",
        charging_turn = {state = "semi_invulnerable", message = "bounced up high!"},
        execution_turn = {power_multiplier = 1.0, vulnerable_to = {"gust", "twister", "thunder", "hurricane"}},
        duration = 2
    },
    [Enums.MoveId.SHADOW_FORCE] = {
        name = "Shadow Force",
        charging_turn = {state = "semi_invulnerable", message = "disappeared!"},
        execution_turn = {power_multiplier = 1.0, ignores_protection = true},
        duration = 2
    },
    [Enums.MoveId.SKY_ATTACK] = {
        name = "Sky Attack",
        charging_turn = {state = "semi_invulnerable", message = "is glowing with power!"},
        execution_turn = {power_multiplier = 1.0, high_critical_hit = true},
        duration = 2
    },
    [Enums.MoveId.RAZOR_WIND] = {
        name = "Razor Wind",
        charging_turn = {state = "normal", message = "whipped up a whirlwind!"},
        execution_turn = {power_multiplier = 1.0, high_critical_hit = true},
        duration = 2
    },
    [Enums.MoveId.SOLAR_BEAM] = {
        name = "Solar Beam",
        charging_turn = {state = "normal", message = "took in sunlight!", weather_skip = "sunny"},
        execution_turn = {power_multiplier = 1.0, weather_modifier = {harsh_sun = 0.5, rain = 0.5, sandstorm = 0.5, hail = 0.5}},
        duration = 2
    },
    [Enums.MoveId.SKULL_BASH] = {
        name = "Skull Bash",
        charging_turn = {state = "normal", message = "lowered its head!", stat_boost = {[Enums.Stat.DEF] = 1}},
        execution_turn = {power_multiplier = 1.0},
        duration = 2
    },
    [Enums.MoveId.FREEZE_SHOCK] = {
        name = "Freeze Shock",
        charging_turn = {state = "normal", message = "became cloaked in a freezing light!"},
        execution_turn = {power_multiplier = 1.0, status_chance = {status = MoveEffects.StatusEffect.PARALYSIS, chance = 30}},
        duration = 2
    }
}

-- Initialize multi-turn move state for Pokemon
-- @param battleId: Battle instance identifier
-- @param pokemonId: Pokemon using the multi-turn move
-- @param moveId: Move being initiated
-- @param pokemonData: Pokemon data for ability checks
-- @param weatherType: Current weather type
-- @return: Boolean indicating success and move state details
function MoveEffects.initializeMultiTurnMove(battleId, pokemonId, moveId, pokemonData, weatherType)
    -- Input validation
    if not battleId or not pokemonId or not moveId then
        return false, "Invalid parameters for multi-turn move initialization"
    end

    local moveData = MoveEffects.MultiTurnMoves[moveId]
    if not moveData then
        return false, "Move is not a multi-turn move: " .. tostring(moveId)
    end

    -- Check for weather-based skipping (Solar Beam in sun)
    local skipCharging = false
    if moveData.charging_turn.weather_skip and weatherType then
        if (moveData.charging_turn.weather_skip == "sunny" and 
            (weatherType == MoveEffects.WeatherType.SUNNY or weatherType == MoveEffects.WeatherType.HARSH_SUN)) then
            skipCharging = true
        end
    end

    -- Check for Power Herb item (skips charging turn)
    if pokemonData and pokemonData.item == Enums.ItemId.POWER_HERB then
        skipCharging = true
    end

    local initialState = skipCharging and MoveEffects.MultiTurnState.EXECUTING or MoveEffects.MultiTurnState.CHARGING
    local turnCount = skipCharging and 2 or 1

    local result = {
        success = true,
        move_id = moveId,
        move_name = moveData.name,
        state = initialState,
        turn_count = turnCount,
        max_turns = moveData.duration,
        skip_charging = skipCharging,
        semi_invulnerable = moveData.charging_turn.state == "semi_invulnerable" and not skipCharging,
        charging_message = moveData.charging_turn.message,
        power_herb_consumed = pokemonData and pokemonData.item == Enums.ItemId.POWER_HERB,
        timestamp = os.time()
    }

    -- Apply charging turn stat boosts if any
    if moveData.charging_turn.stat_boost and not skipCharging then
        result.stat_boosts = moveData.charging_turn.stat_boost
    end

    print("Initialized multi-turn move " .. moveData.name .. " for Pokemon " .. pokemonId .. 
          (skipCharging and " (skipping charging turn)" or " (entering charging phase)"))
    return true, result
end

-- Process multi-turn move progression
-- @param battleId: Battle instance identifier
-- @param pokemonId: Pokemon using the multi-turn move
-- @param currentState: Current multi-turn move state
-- @return: Boolean indicating success and updated state
function MoveEffects.processMultiTurnMove(battleId, pokemonId, currentState)
    -- Input validation
    if not battleId or not pokemonId or not currentState then
        return false, "Invalid parameters for multi-turn move processing"
    end

    local moveData = MoveEffects.MultiTurnMoves[currentState.move_id]
    if not moveData then
        return false, "Unknown multi-turn move: " .. tostring(currentState.move_id)
    end

    local newTurnCount = currentState.turn_count + 1
    local newState = currentState.state

    -- State transition logic
    if currentState.state == MoveEffects.MultiTurnState.CHARGING then
        if newTurnCount >= moveData.duration then
            newState = MoveEffects.MultiTurnState.EXECUTING
        end
    elseif currentState.state == MoveEffects.MultiTurnState.EXECUTING then
        newState = MoveEffects.MultiTurnState.COMPLETED
    end

    local isCompleted = newState == MoveEffects.MultiTurnState.COMPLETED
    local canExecute = newState == MoveEffects.MultiTurnState.EXECUTING

    local result = {
        success = true,
        move_id = currentState.move_id,
        move_name = moveData.name,
        previous_state = currentState.state,
        new_state = newState,
        turn_count = newTurnCount,
        max_turns = moveData.duration,
        can_execute = canExecute,
        is_completed = isCompleted,
        semi_invulnerable = newState == MoveEffects.MultiTurnState.CHARGING and moveData.charging_turn.state == "semi_invulnerable",
        execution_data = canExecute and moveData.execution_turn or nil,
        timestamp = os.time()
    }

    local stateNames = {
        [MoveEffects.MultiTurnState.CHARGING] = "charging",
        [MoveEffects.MultiTurnState.EXECUTING] = "executing", 
        [MoveEffects.MultiTurnState.COMPLETED] = "completed"
    }

    print("Multi-turn move " .. moveData.name .. " progressed from " .. 
          (stateNames[currentState.state] or "unknown") .. " to " .. 
          (stateNames[newState] or "unknown") .. " (turn " .. newTurnCount .. "/" .. moveData.duration .. ")")
    
    return true, result
end

-- Check if Pokemon is vulnerable to a move while in semi-invulnerable state
-- @param multiTurnState: Current multi-turn move state
-- @param incomingMoveId: ID of incoming move
-- @return: Boolean indicating if Pokemon is vulnerable
function MoveEffects.isVulnerableInSemiInvulnerableState(multiTurnState, incomingMoveId)
    if not multiTurnState or not multiTurnState.semi_invulnerable then
        return true -- Not in semi-invulnerable state
    end

    local moveData = MoveEffects.MultiTurnMoves[multiTurnState.move_id]
    if not moveData or not moveData.execution_turn.vulnerable_to then
        return false -- No vulnerabilities defined
    end

    -- Check if incoming move is in vulnerability list
    for _, vulnerableMove in ipairs(moveData.execution_turn.vulnerable_to) do
        if vulnerableMove == incomingMoveId or 
           (type(vulnerableMove) == "string" and Enums.MoveId[string.upper(vulnerableMove)] == incomingMoveId) then
            return true
        end
    end

    return false
end

-- Get multi-turn move execution modifiers
-- @param multiTurnState: Current multi-turn move state
-- @param weatherType: Current weather type (optional)
-- @return: Table of execution modifiers
function MoveEffects.getMultiTurnExecutionModifiers(multiTurnState, weatherType)
    if not multiTurnState or multiTurnState.state ~= MoveEffects.MultiTurnState.EXECUTING then
        return {}
    end

    local moveData = MoveEffects.MultiTurnMoves[multiTurnState.move_id]
    if not moveData then
        return {}
    end

    local modifiers = {
        power_multiplier = moveData.execution_turn.power_multiplier or 1.0,
        ignores_protection = moveData.execution_turn.ignores_protection or false,
        high_critical_hit = moveData.execution_turn.high_critical_hit or false
    }

    -- Apply weather modifiers
    if weatherType and moveData.execution_turn.weather_modifier then
        local weatherNames = {
            [MoveEffects.WeatherType.HARSH_SUN] = "harsh_sun",
            [MoveEffects.WeatherType.RAIN] = "rain",
            [MoveEffects.WeatherType.SANDSTORM] = "sandstorm",
            [MoveEffects.WeatherType.HAIL] = "hail"
        }
        
        local weatherName = weatherNames[weatherType]
        if weatherName and moveData.execution_turn.weather_modifier[weatherName] then
            modifiers.power_multiplier = modifiers.power_multiplier * moveData.execution_turn.weather_modifier[weatherName]
        end
    end

    -- Add status effect if applicable
    if moveData.execution_turn.status_chance then
        modifiers.status_effect = moveData.execution_turn.status_chance
    end

    return modifiers
end

-- Check if multi-turn move can be interrupted
-- @param multiTurnState: Current multi-turn move state
-- @param interruptSource: Source of interruption (flinch, sleep, etc.)
-- @return: Boolean indicating if move can be interrupted
function MoveEffects.canInterruptMultiTurnMove(multiTurnState, interruptSource)
    if not multiTurnState then
        return false
    end

    -- Semi-invulnerable Pokemon cannot be interrupted by most effects
    if multiTurnState.semi_invulnerable then
        -- Only specific conditions can interrupt semi-invulnerable state
        local allowedInterrupts = {"sleep", "freeze", "faint"}
        for _, allowed in ipairs(allowedInterrupts) do
            if interruptSource == allowed then
                return true
            end
        end
        return false
    end

    -- Charging state can be interrupted by various effects
    if multiTurnState.state == MoveEffects.MultiTurnState.CHARGING then
        local disruptiveEffects = {"sleep", "freeze", "paralysis", "flinch", "confusion", "attraction"}
        for _, effect in ipairs(disruptiveEffects) do
            if interruptSource == effect then
                return true
            end
        end
    end

    return false
end

-- Get multi-turn move description
-- @param moveId: Multi-turn move ID
-- @param currentState: Current state (optional)
-- @return: Human-readable description
function MoveEffects.getMultiTurnMoveDescription(moveId, currentState)
    local moveData = MoveEffects.MultiTurnMoves[moveId]
    if not moveData then
        return "Unknown multi-turn move"
    end

    local description = moveData.name .. " (multi-turn)"
    
    if currentState then
        if currentState.state == MoveEffects.MultiTurnState.CHARGING then
            description = description .. " - Charging (" .. currentState.turn_count .. "/" .. moveData.duration .. ")"
        elseif currentState.state == MoveEffects.MultiTurnState.EXECUTING then
            description = description .. " - Executing"
        elseif currentState.state == MoveEffects.MultiTurnState.COMPLETED then
            description = description .. " - Completed"
        end
        
        if currentState.semi_invulnerable then
            description = description .. " (Semi-invulnerable)"
        end
    else
        description = description .. " - " .. moveData.duration .. " turns"
        if moveData.charging_turn.state == "semi_invulnerable" then
            description = description .. " (Semi-invulnerable during charge)"
        end
    end

    return description
end

-- Random Effect Move System

-- Metronome move pool (moves that can be selected)
MoveEffects.MetronomeMovePool = {
    -- Exclude certain moves from Metronome
    excluded_moves = {
        [Enums.MoveId.METRONOME] = true,
        [Enums.MoveId.STRUGGLE] = true,
        [Enums.MoveId.CHATTER] = true,
        [Enums.MoveId.COUNTER] = true,
        [Enums.MoveId.MIRROR_COAT] = true,
        [Enums.MoveId.PROTECT] = true,
        [Enums.MoveId.DETECT] = true,
        [Enums.MoveId.ENDURE] = true,
        [Enums.MoveId.FOLLOW_ME] = true,
        [Enums.MoveId.HELPING_HAND] = true,
        [Enums.MoveId.MIRROR_MOVE] = true,
        [Enums.MoveId.SKETCH] = true,
        [Enums.MoveId.SLEEP_TALK] = true,
        [Enums.MoveId.TRANSFORM] = true
    },
    -- Category restrictions
    excluded_categories = {
        "status_healing", -- Healing moves that could break battle balance
        "field_control", -- Moves that drastically alter battle conditions
        "unique_mechanic" -- Moves with special mechanics that don't translate well
    }
}

-- Sleep Talk move pool (moves Pokemon can use while sleeping)
MoveEffects.SleepTalkMovePool = {
    -- Sleep Talk can only select from moves the Pokemon knows
    require_known_moves = true,
    -- Exclude certain moves from Sleep Talk
    excluded_moves = {
        [Enums.MoveId.SLEEP_TALK] = true,
        [Enums.MoveId.BIDE] = true,
        [Enums.MoveId.FOCUS_PUNCH] = true,
        [Enums.MoveId.UPROAR] = true,
        [Enums.MoveId.ASSIST] = true,
        [Enums.MoveId.METRONOME] = true
    }
}

-- Execute Metronome move selection
-- @param battleId: Battle instance identifier
-- @param pokemonId: Pokemon using Metronome
-- @param pokemonData: Pokemon data for move validation
-- @param battleState: Current battle state for context
-- @return: Boolean indicating success and selected move details
function MoveEffects.executeMetronome(battleId, pokemonId, pokemonData, battleState)
    -- Input validation
    if not battleId or not pokemonId then
        return false, "Invalid parameters for Metronome execution"
    end

    -- Get all valid moves for Metronome (this would normally come from move database)
    local allMoves = {}
    for moveId = 1, 900 do -- Assuming 900 moves total
        if not MoveEffects.MetronomeMovePool.excluded_moves[moveId] then
            table.insert(allMoves, moveId)
        end
    end

    -- Select random move using deterministic RNG
    if #allMoves == 0 then
        return false, "No valid moves available for Metronome"
    end

    local selectedIndex = BattleRNG.randomInt(1, #allMoves)
    local selectedMoveId = allMoves[selectedIndex]

    -- Validate selected move (additional checks)
    local isValid, reason = MoveEffects.validateRandomMoveSelection(selectedMoveId, pokemonData, battleState, "metronome")
    if not isValid then
        -- Try again with different move (limited retries to prevent infinite loops)
        local retryCount = 0
        while not isValid and retryCount < 5 do
            selectedIndex = BattleRNG.randomInt(1, #allMoves)
            selectedMoveId = allMoves[selectedIndex]
            isValid, reason = MoveEffects.validateRandomMoveSelection(selectedMoveId, pokemonData, battleState, "metronome")
            retryCount = retryCount + 1
        end
        
        if not isValid then
            return false, "Could not find valid move for Metronome: " .. tostring(reason)
        end
    end

    local result = {
        success = true,
        source_move = "Metronome",
        selected_move_id = selectedMoveId,
        selection_method = "metronome",
        total_pool_size = #allMoves,
        selected_index = selectedIndex,
        retry_count = retryCount or 0,
        timestamp = os.time()
    }

    print("Metronome selected move " .. selectedMoveId .. " for Pokemon " .. pokemonId)
    return true, result
end

-- Execute Sleep Talk move selection
-- @param battleId: Battle instance identifier
-- @param pokemonId: Pokemon using Sleep Talk
-- @param pokemonData: Pokemon data including known moves
-- @param battleState: Current battle state for context
-- @return: Boolean indicating success and selected move details
function MoveEffects.executeSleepTalk(battleId, pokemonId, pokemonData, battleState)
    -- Input validation
    if not battleId or not pokemonId or not pokemonData then
        return false, "Invalid parameters for Sleep Talk execution"
    end

    -- Verify Pokemon is asleep
    if not pokemonData.statusEffect or pokemonData.statusEffect ~= MoveEffects.StatusEffect.SLEEP then
        return false, "Sleep Talk can only be used while sleeping"
    end

    -- Get Pokemon's known moves (excluding Sleep Talk itself)
    local knownMoves = {}
    if pokemonData.moves then
        for _, moveId in ipairs(pokemonData.moves) do
            if not MoveEffects.SleepTalkMovePool.excluded_moves[moveId] then
                table.insert(knownMoves, moveId)
            end
        end
    end

    if #knownMoves == 0 then
        return false, "No valid moves available for Sleep Talk"
    end

    -- Select random move from known moves using deterministic RNG
    local selectedIndex = BattleRNG.randomInt(1, #knownMoves)
    local selectedMoveId = knownMoves[selectedIndex]

    -- Validate selected move
    local isValid, reason = MoveEffects.validateRandomMoveSelection(selectedMoveId, pokemonData, battleState, "sleep_talk")
    if not isValid then
        -- Try other known moves (limited retries)
        local retryCount = 0
        while not isValid and retryCount < #knownMoves - 1 do
            selectedIndex = (selectedIndex % #knownMoves) + 1
            selectedMoveId = knownMoves[selectedIndex]
            isValid, reason = MoveEffects.validateRandomMoveSelection(selectedMoveId, pokemonData, battleState, "sleep_talk")
            retryCount = retryCount + 1
        end
        
        if not isValid then
            return false, "No valid moves available for Sleep Talk: " .. tostring(reason)
        end
    end

    local result = {
        success = true,
        source_move = "Sleep Talk",
        selected_move_id = selectedMoveId,
        selection_method = "sleep_talk",
        total_pool_size = #knownMoves,
        selected_index = selectedIndex,
        retry_count = retryCount or 0,
        known_moves = knownMoves,
        timestamp = os.time()
    }

    print("Sleep Talk selected move " .. selectedMoveId .. " for Pokemon " .. pokemonId)
    return true, result
end

-- Validate random move selection
-- @param moveId: Selected move ID
-- @param pokemonData: Pokemon data for validation
-- @param battleState: Battle state for context checks
-- @param selectionType: Type of random selection (metronome, sleep_talk)
-- @return: Boolean indicating validity and reason if invalid
function MoveEffects.validateRandomMoveSelection(moveId, pokemonData, battleState, selectionType)
    if not moveId then
        return false, "Invalid move ID"
    end

    -- Move must exist (basic validation)
    -- This would normally check against move database
    if moveId < 1 or moveId > 900 then
        return false, "Move ID out of range"
    end

    -- Specific validation for Sleep Talk
    if selectionType == "sleep_talk" then
        -- Sleep Talk cannot select multi-turn moves in their charging phase
        if MoveEffects.MultiTurnMoves[moveId] then
            return false, "Cannot use multi-turn moves with Sleep Talk"
        end

        -- Sleep Talk cannot select moves requiring conscious choice
        local consciousChoiceMoves = {
            [Enums.MoveId.FOCUS_PUNCH] = true,
            [Enums.MoveId.BIDE] = true
        }
        if consciousChoiceMoves[moveId] then
            return false, "Move requires conscious choice"
        end
    end

    -- Specific validation for Metronome
    if selectionType == "metronome" then
        -- Metronome cannot select certain signature moves
        local signatureMoves = {
            [Enums.MoveId.CHATTER] = true,
            [Enums.MoveId.STRUGGLE] = true
        }
        if signatureMoves[moveId] then
            return false, "Signature move cannot be selected"
        end
    end

    -- PP validation (move must have PP available)
    -- This would normally check Pokemon's current PP for the move

    return true, nil
end

-- Get random move selection description
-- @param selectionResult: Result from random move selection
-- @param moveDatabase: Optional move database for move names
-- @return: Human-readable description
function MoveEffects.getRandomMoveDescription(selectionResult, moveDatabase)
    if not selectionResult then
        return "No random move selected"
    end

    local moveName = "Move " .. selectionResult.selected_move_id
    if moveDatabase and moveDatabase[selectionResult.selected_move_id] then
        moveName = moveDatabase[selectionResult.selected_move_id].name
    end

    local description = selectionResult.source_move .. " selected " .. moveName
    
    if selectionResult.retry_count and selectionResult.retry_count > 0 then
        description = description .. " (after " .. selectionResult.retry_count .. " retries)"
    end

    if selectionResult.total_pool_size then
        description = description .. " from " .. selectionResult.total_pool_size .. " possible moves"
    end

    return description
end

-- Check if move can be randomly selected
-- @param moveId: Move to check
-- @param selectionType: Type of selection (metronome, sleep_talk, etc.)
-- @return: Boolean indicating if move can be selected
function MoveEffects.canMoveBeRandomlySelected(moveId, selectionType)
    if not moveId or not selectionType then
        return false
    end

    -- Check Metronome exclusions
    if selectionType == "metronome" then
        return not MoveEffects.MetronomeMovePool.excluded_moves[moveId]
    end

    -- Check Sleep Talk exclusions
    if selectionType == "sleep_talk" then
        return not MoveEffects.SleepTalkMovePool.excluded_moves[moveId]
    end

    return true
end

-- Execute random effect move with failure conditions
-- @param battleId: Battle instance identifier
-- @param pokemonId: Pokemon using the move
-- @param moveType: Type of random move (metronome, sleep_talk)
-- @param pokemonData: Pokemon data
-- @param battleState: Battle state
-- @return: Boolean indicating success and execution details
function MoveEffects.executeRandomEffectMove(battleId, pokemonId, moveType, pokemonData, battleState)
    -- Input validation
    if not battleId or not pokemonId or not moveType then
        return false, "Invalid parameters for random effect move"
    end

    local result = {}
    local success = false

    if moveType == "metronome" then
        success, result = MoveEffects.executeMetronome(battleId, pokemonId, pokemonData, battleState)
    elseif moveType == "sleep_talk" then
        success, result = MoveEffects.executeSleepTalk(battleId, pokemonId, pokemonData, battleState)
    else
        return false, "Unknown random effect move type: " .. tostring(moveType)
    end

    if not success then
        return false, result -- Error message
    end

    -- Additional post-selection processing
    result.execution_type = "random_effect"
    result.deterministic = true -- Uses seeded RNG for reproducibility
    result.battle_id = battleId
    result.pokemon_id = pokemonId

    print("Random effect move executed: " .. moveType .. " -> " .. (result.selected_move_id or "none"))
    return true, result
end

-- Cure status effect from Pokemon
-- @param battleId: Battle instance identifier
-- @param pokemonId: Pokemon to cure
-- @param statusEffect: Status effect to cure
-- @param cureMethod: Method of cure (for validation)
-- @return: Boolean indicating success and cure details
function MoveEffects.cureStatusEffect(battleId, pokemonId, statusEffect, cureMethod)
    if not battleId or not pokemonId or not statusEffect then
        return false, "Invalid parameters for status cure"
    end
    
    local effectData = MoveEffects.StatusEffectData[statusEffect]
    if not effectData then
        return false, "Unknown status effect: " .. tostring(statusEffect)
    end
    
    -- Validate cure method
    local validCure = false
    if effectData.cure_conditions then
        for _, condition in ipairs(effectData.cure_conditions) do
            if cureMethod == condition then
                validCure = true
                break
            end
        end
    end
    
    if not validCure then
        return false, "Invalid cure method for " .. effectData.name .. ": " .. tostring(cureMethod)
    end
    
    local result = {
        success = true,
        cured_effect = statusEffect,
        effect_name = effectData.name,
        cure_method = cureMethod,
        timestamp = os.time()
    }
    
    print("Cured " .. effectData.name .. " from Pokemon " .. pokemonId .. " via " .. cureMethod)
    return true, result
end

-- Validate move effect parameters
-- @param effect: Effect data to validate
-- @return: Boolean indicating validity and error message if invalid
function MoveEffects.validateEffect(effect)
    if type(effect) ~= "table" then
        return false, "Effect must be a table"
    end
    
    -- Validate status effects
    if effect.status_effect then
        if not MoveEffects.StatusEffectData[effect.status_effect] then
            return false, "Invalid status effect: " .. tostring(effect.status_effect)
        end
        
        if effect.status_chance and (effect.status_chance < 0 or effect.status_chance > 100) then
            return false, "Status chance must be between 0-100: " .. effect.status_chance
        end
    end
    
    -- Validate stat changes
    if effect.stat_changes then
        for stat, change in pairs(effect.stat_changes) do
            if not MoveEffects.StatStages[stat] then
                return false, "Invalid stat for change: " .. tostring(stat)
            end
            
            if change < -6 or change > 6 then
                return false, "Stat change out of range (-6 to +6): " .. change
            end
        end
    end
    
    -- Validate healing
    if effect.healing then
        local validFormulas = {"1/2", "1/4", "1/8", "1/16", "full"}
        if type(effect.healing) == "string" then
            local validFormula = false
            for _, formula in ipairs(validFormulas) do
                if effect.healing == formula then
                    validFormula = true
                    break
                end
            end
            if not validFormula and effect.healing ~= "full" then
                return false, "Invalid healing formula: " .. effect.healing
            end
        elseif type(effect.healing) ~= "number" or effect.healing < 0 then
            return false, "Healing must be positive number or valid formula"
        end
    end
    
    return true, "Valid effect"
end

-- Validate stat stage bounds and ability interactions
-- @param pokemonData: Pokemon data including ability
-- @param stat: Stat to check
-- @param stageChange: Proposed stage change
-- @param currentStage: Current stat stage
-- @return: Boolean indicating if change is valid, adjusted change amount
function MoveEffects.validateStatStageChange(pokemonData, stat, stageChange, currentStage)
    if not pokemonData or not stat or not stageChange then
        return false, 0
    end
    
    -- Check ability restrictions for stat reductions
    if pokemonData.ability and stageChange < 0 then
        if pokemonData.ability == Enums.AbilityId.CLEAR_BODY or 
           pokemonData.ability == Enums.AbilityId.WHITE_SMOKE then
            return false, 0
        elseif pokemonData.ability == Enums.AbilityId.HYPER_CUTTER and stat == Enums.Stat.ATK then
            return false, 0
        elseif pokemonData.ability == Enums.AbilityId.KEEN_EYE and stat == Enums.Stat.ACC then
            return false, 0
        end
    end
    
    -- Apply ability modifications
    local modifiedChange = stageChange
    if pokemonData.ability == Enums.AbilityId.SIMPLE then
        modifiedChange = stageChange * 2
    elseif pokemonData.ability == Enums.AbilityId.CONTRARY then
        modifiedChange = -stageChange
    end
    
    -- Bounds checking
    currentStage = currentStage or 0
    local newStage = math.max(-6, math.min(6, currentStage + modifiedChange))
    local actualChange = newStage - currentStage
    
    return actualChange ~= 0, actualChange
end

-- Get effect description for move
-- @param effect: Effect data table
-- @return: Human-readable description of the effect
function MoveEffects.getEffectDescription(effect)
    if not effect or type(effect) ~= "table" then
        return "No effect"
    end
    
    local descriptions = {}
    
    -- Status effects
    if effect.status_effect then
        local effectData = MoveEffects.StatusEffectData[effect.status_effect]
        if effectData then
            local statusName = effectData.name
            local chance = effect.status_chance or 100
            if chance == 100 then
                table.insert(descriptions, "Inflicts " .. statusName)
            else
                table.insert(descriptions, chance .. "% chance to inflict " .. statusName)
            end
        end
    end
    
    -- Stat changes
    if effect.stat_changes then
        for stat, change in pairs(effect.stat_changes) do
            local statName = MoveEffects.StatStages[stat]
            if statName then
                if change > 0 then
                    table.insert(descriptions, "Raises " .. statName .. " by " .. change .. " stage(s)")
                elseif change < 0 then
                    table.insert(descriptions, "Lowers " .. statName .. " by " .. math.abs(change) .. " stage(s)")
                end
            end
        end
    end
    
    -- Healing
    if effect.healing then
        if effect.healing == "full" then
            table.insert(descriptions, "Restores all HP")
        elseif type(effect.healing) == "string" then
            table.insert(descriptions, "Restores " .. effect.healing .. " of max HP")
        else
            table.insert(descriptions, "Restores " .. effect.healing .. " HP")
        end
    end
    
    -- Recoil
    if effect.recoil then
        table.insert(descriptions, "User takes " .. effect.recoil .. " recoil damage")
    end
    
    -- Multi-hit
    if effect.multi_hit then
        if effect.multi_hit == "2-5" then
            table.insert(descriptions, "Hits 2-5 times")
        else
            table.insert(descriptions, "Hits " .. effect.multi_hit .. " times")
        end
    end
    
    -- Weather
    if effect.weather then
        table.insert(descriptions, "Changes weather")
    end
    
    -- Terrain
    if effect.terrain then
        table.insert(descriptions, "Changes terrain")
    end
    
    return table.concat(descriptions, ", ")
end

-- Execute move with damage calculation integration
-- @param battleState: Current battle state
-- @param attacker: Pokemon using the move
-- @param moveData: Move data from database
-- @param target: Target Pokemon (optional for some moves)
-- @return: Move execution result with damage and effects
function MoveEffects.executeMove(battleState, attacker, moveData, target)
    local result = {
        success = false,
        damage = 0,
        effectiveness = 1.0,
        critical_hit = false,
        missed = false,
        failed = false,
        no_effect = false,
        effects = {},
        status_effects = {},
        messages = {}
    }
    
    -- Input validation
    if not attacker or not moveData then
        result.failed = true
        result.messages = {"Move execution failed: Invalid parameters"}
        return result
    end
    
    -- Load damage calculator for damage moves
    local DamageCalculator = require("game-logic.battle.damage-calculator")
    
    -- Check if move affects the user or needs a target
    local actualTarget = target
    if not target and moveData.target ~= Enums.MoveTarget.USER then
        -- For moves that need a target but none provided, use default target logic
        if battleState.activePokemon then
            if attacker == battleState.activePokemon.player then
                actualTarget = battleState.activePokemon.enemy
            else
                actualTarget = battleState.activePokemon.player
            end
        end
    end
    
    -- Check accuracy for moves that can miss
    if moveData.accuracy and moveData.accuracy < 100 then
        local accuracyRoll = BattleRNG.randomInt(1, 100)
        if accuracyRoll > moveData.accuracy then
            result.missed = true
            result.success = true  -- Move executed but missed
            result.messages = {"The attack missed!"}
            return result
        end
    end
    
    result.success = true
    
    -- Handle damage calculation for offensive moves
    if moveData.category ~= Enums.MoveCategory.STATUS and moveData.power and moveData.power > 0 and actualTarget then
        local damageParams = {
            attacker = attacker,
            defender = actualTarget,
            moveData = moveData,
            battleState = battleState
        }
        
        local damageResult = DamageCalculator.calculateDamage(damageParams)
        
        result.damage = damageResult.damage
        result.effectiveness = damageResult.typeEffectiveness
        result.critical_hit = damageResult.criticalHit
        result.stab = damageResult.stab
        
        -- Check for no effect
        if result.effectiveness == 0 then
            result.no_effect = true
            result.damage = 0
            result.messages = {"It had no effect!"}
            return result
        end
        
        -- Apply damage to target
        if actualTarget and result.damage > 0 then
            -- Support both currentHP and hp field names for compatibility
            local currentHP = actualTarget.currentHP or actualTarget.hp
            if currentHP then
                local newHP = math.max(0, currentHP - result.damage)
                if actualTarget.currentHP then
                    actualTarget.currentHP = newHP
                else
                    actualTarget.hp = newHP
                end
                
                if newHP <= 0 then
                    actualTarget.fainted = true
                    table.insert(result.effects, {
                        type = "faint",
                        target = actualTarget,
                        pokemon_id = actualTarget.id
                    })
                end
            end
        end
    end
    
    -- Apply status effects from move
    if moveData.status_chance and moveData.status_effect and actualTarget then
        local statusRoll = BattleRNG.randomInt(1, 100)
        if statusRoll <= moveData.status_chance then
            local statusApplied = MoveEffects.applyStatusEffect(
                battleState.battleId,
                actualTarget.id,
                moveData.status_effect,
                "move",
                attacker,
                actualTarget
            )
            
            if statusApplied then
                table.insert(result.status_effects, {
                    target = actualTarget,
                    status = moveData.status_effect,
                    applied = true
                })
            end
        end
    end
    
    -- Apply stat changes from move
    local statChanges = moveData.stat_changes or (moveData.effects and moveData.effects.stat_change)
    if statChanges then
        local statTarget = actualTarget
        -- Check for explicit stat change target or fallback to move target
        local statChangeTarget = (moveData.effects and moveData.effects.stat_change_target) or moveData.stat_change_target
        if moveData.target == Enums.MoveTarget.USER or statChangeTarget == "self" then
            statTarget = attacker
        end
        
        if statTarget and statTarget.battleData and statTarget.battleData.statStages then
            for stat, change in pairs(statChanges) do
                local statChangeResult = MoveEffects.applyStatStageChange(
                    battleState.battleId,
                    statTarget.id,
                    stat,
                    change,
                    "move",
                    statTarget,
                    statTarget.battleData.statStages
                )
                
                if statChangeResult then
                    statTarget.battleData.statStages[stat] = (statTarget.battleData.statStages[stat] or 0) + change
                    
                    -- Also update battleStats array for test compatibility
                    if statTarget.battleStats then
                        local statIndex = nil
                        if stat == "attack" then statIndex = 0
                        elseif stat == "defense" then statIndex = 1
                        elseif stat == "spAttack" then statIndex = 2
                        elseif stat == "spDefense" then statIndex = 3
                        elseif stat == "speed" then statIndex = 4
                        elseif stat == "accuracy" then statIndex = 5
                        elseif stat == "evasion" then statIndex = 6
                        end
                        
                        if statIndex then
                            statTarget.battleStats[statIndex] = (statTarget.battleStats[statIndex] or 0) + change
                        end
                    end
                    
                    table.insert(result.effects, {
                        type = "stat_change",
                        target = statTarget,
                        stat = stat,
                        change = change
                    })
                end
            end
        end
    end
    
    -- Handle healing moves
    if moveData.healing and moveData.target == Enums.MoveTarget.USER then
        local healingAmount = 0
        if type(moveData.healing) == "string" then
            -- Percentage healing (e.g., "1/2" for half HP)
            local numerator, denominator = moveData.healing:match("(%d+)/(%d+)")
            if numerator and denominator then
                healingAmount = math.floor((attacker.stats.hp * tonumber(numerator)) / tonumber(denominator))
            elseif moveData.healing == "full" then
                local currentHP = attacker.currentHP or attacker.hp
                local maxHP = attacker.stats.hp or attacker.stats.maxHp or attacker.maxHp
                healingAmount = maxHP - currentHP
            end
        elseif type(moveData.healing) == "number" then
            healingAmount = moveData.healing
        end
        
        if healingAmount > 0 then
            -- Support both currentHP and hp field names for compatibility
            local currentHP = attacker.currentHP or attacker.hp
            local maxHP = attacker.stats.hp or attacker.stats.maxHp or attacker.maxHp
            if currentHP and maxHP then
                local oldHP = currentHP
                local newHP = math.min(maxHP, currentHP + healingAmount)
                
                if attacker.currentHP then
                    attacker.currentHP = newHP
                else
                    attacker.hp = newHP
                end
                
                local actualHealing = newHP - oldHP
                
                if actualHealing > 0 then
                    table.insert(result.effects, {
                        type = "healing",
                        target = attacker,
                        amount = actualHealing
                    })
                end
            end
        end
    end
    
    -- Handle multi-hit moves
    if moveData.multi_hit and actualTarget and result.damage > 0 then
        local hitCount = 1
        if moveData.multi_hit == "2-5" then
            hitCount = BattleRNG.multiHitCount(2, 5)
        elseif type(moveData.multi_hit) == "number" then
            hitCount = moveData.multi_hit
        end
        
        if hitCount > 1 then
            local totalDamage = result.damage
            for hit = 2, hitCount do
                if actualTarget.currentHP <= 0 then
                    break  -- Stop if target faints
                end
                
                -- Recalculate damage for each hit (for consistency with variance)
                local hitDamageResult = DamageCalculator.calculateDamage({
                    attacker = attacker,
                    defender = actualTarget,
                    moveData = moveData,
                    battleState = battleState
                })
                
                actualTarget.currentHP = math.max(0, actualTarget.currentHP - hitDamageResult.damage)
                totalDamage = totalDamage + hitDamageResult.damage
                
                if actualTarget.currentHP <= 0 then
                    actualTarget.fainted = true
                    break
                end
            end
            
            result.damage = totalDamage
            result.hit_count = hitCount
        end
    end
    
    -- Handle recoil damage
    if moveData.recoil and result.damage > 0 then
        local recoilAmount = 0
        if type(moveData.recoil) == "string" then
            local numerator, denominator = moveData.recoil:match("(%d+)/(%d+)")
            if numerator and denominator then
                recoilAmount = math.floor((result.damage * tonumber(numerator)) / tonumber(denominator))
            end
        elseif type(moveData.recoil) == "number" then
            recoilAmount = moveData.recoil
        end
        
        if recoilAmount > 0 then
            -- Support both currentHP and hp field names for compatibility
            local currentHP = attacker.currentHP or attacker.hp
            if currentHP then
                local newHP = math.max(0, currentHP - recoilAmount)
                if attacker.currentHP then
                    attacker.currentHP = newHP
                else
                    attacker.hp = newHP
                end
                
                table.insert(result.effects, {
                    type = "recoil",
                    target = attacker,
                    amount = recoilAmount
                })
                
                if newHP <= 0 then
                    attacker.fainted = true
                    table.insert(result.effects, {
                        type = "faint",
                        target = attacker,
                        pokemon_id = attacker.id
                    })
                end
            end
        end
    end
    
    -- Handle weather effects from move
    if moveData.effects and moveData.effects.weather and battleState then
        local weatherType = moveData.effects.weather.type or moveData.effects.weather
        local turns = moveData.effects.weather.turns or 5
        
        if not battleState.weather then
            battleState.weather = {}
        end
        
        battleState.weather.weatherType = weatherType
        battleState.weather.turnsLeft = turns
        
        table.insert(result.effects, {
            type = "weather_change",
            weatherType = weatherType,
            turns = turns
        })
        
        result.weatherChanged = true
    end
    
    -- Handle terrain effects from move  
    if moveData.effects and moveData.effects.terrain and battleState then
        local terrainType = moveData.effects.terrain.type or moveData.effects.terrain
        local turns = moveData.effects.terrain.turns or 5
        
        if not battleState.terrain then
            battleState.terrain = {}
        end
        
        battleState.terrain.terrainType = terrainType
        battleState.terrain.turnsLeft = turns
        
        table.insert(result.effects, {
            type = "terrain_change",
            terrainType = terrainType,
            turns = turns
        })
        
        result.terrainChanged = true
    end
    
    return result
end

-- Compatibility function for test suite - alias for executeMove
function MoveEffects.processMovEffects(moveData, attacker, targets, battleState)
    if not moveData or not attacker or not targets then
        return {
            success = false,
            statusEffects = {},
            messages = {"Invalid parameters for processMovEffects"}
        }
    end

    local target = targets[1] -- Use first target
    local result = MoveEffects.executeMove(battleState, attacker, moveData, target)

    -- Convert to expected format for test compatibility
    local compatResult = {
        success = result.success,
        statusEffects = result.status_effects or {},
        effects = result.effects or {},
        weatherChanged = result.weatherChanged or false,
        terrainChanged = result.terrainChanged or false,
        messages = result.messages or {}
    }
    
    -- Extract stat changes for backward compatibility
    compatResult.statChanges = {}
    if result.effects then
        for _, effect in ipairs(result.effects) do
            if effect.type == "stat_change" then
                table.insert(compatResult.statChanges, {
                    stat = effect.stat,
                    stages = effect.change,
                    target = effect.target
                })
            end
        end
    end
    
    return compatResult
end

-- Compatibility function for test suite - calculate multi-hit count
function MoveEffects.calculateMultiHitCount(moveData)
    if not moveData or not moveData.effects or not moveData.effects.multi_hit then
        return 1
    end

    local hitType = moveData.effects.multi_hit
    if type(hitType) == "table" then
        -- Handle {2, 5} format
        local min = hitType[1] or 2
        local max = hitType[2] or 5

        -- Use distribution: 35%, 35%, 15%, 15% for 2, 3, 4, 5 hits
        local rand = BattleRNG.randomInt(1, 100)
        if rand <= 35 then
            return min
        elseif rand <= 70 then
            return min + 1
        elseif rand <= 85 then
            return max - 1
        else
            return max
        end
    elseif type(hitType) == "number" then
        return hitType
    elseif hitType == true then
        -- Default multi-hit is 2-5
        local rand = BattleRNG.randomInt(1, 100)
        if rand <= 35 then
            return 2
        elseif rand <= 70 then
            return 3
        elseif rand <= 85 then
            return 4
        else
            return 5
        end
    end

    return 1
end

return MoveEffects