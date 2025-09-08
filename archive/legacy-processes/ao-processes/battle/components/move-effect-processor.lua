-- Battle Process Move Effect Processor
-- Extracted from game-logic.battle.move-effects for dedicated battle process
-- Maintains identical behavior for all existing move effects and status conditions
-- Epic 32.3: Battle Engine Process Extraction

local MoveEffectProcessor = {}

-- Load dependencies
local Enums = require("data.constants.enums")
local BattleRNG = require("game-logic.rng.battle-rng")
local TypeChart = require("data.constants.type-chart")

-- Status effect definitions (matching TypeScript StatusEffect enum)
MoveEffectProcessor.StatusEffect = {
    NONE = 0,
    POISON = 1,
    SLEEP = 2,
    PARALYSIS = 3,
    BURN = 4,
    FREEZE = 5,
    FAINT = 6,
    TOXIC = 7
}

-- Move effect categories
MoveEffectProcessor.EffectCategory = {
    STATUS_CONDITION = "STATUS_CONDITION",
    STAT_MODIFICATION = "STAT_MODIFICATION",
    HEALING = "HEALING",
    DAMAGE_OVER_TIME = "DAMAGE_OVER_TIME",
    FIELD_CONDITION = "FIELD_CONDITION",
    SPECIAL_EFFECT = "SPECIAL_EFFECT"
}

-- Stat stage modifications
MoveEffectProcessor.StatStage = {
    ATTACK = "attack",
    DEFENSE = "defense",
    SPECIAL_ATTACK = "special_attack", 
    SPECIAL_DEFENSE = "special_defense",
    SPEED = "speed",
    ACCURACY = "accuracy",
    EVASION = "evasion"
}

-- Status effect data with exact behavioral parameters
local STATUS_EFFECT_DATA = {
    [MoveEffectProcessor.StatusEffect.POISON] = {
        name = "Poison",
        duration = -1, -- Permanent until cured
        damagePerTurn = 1/8, -- 1/8 of max HP per turn
        immunityTypes = {Enums.PokemonType.POISON, Enums.PokemonType.STEEL},
        immunityAbilities = {Enums.AbilityId.IMMUNITY, Enums.AbilityId.POISON_HEAL},
        cureConditions = {"natural_cure", "pecha_berry", "aromatherapy", "heal_bell"}
    },
    [MoveEffectProcessor.StatusEffect.SLEEP] = {
        name = "Sleep",
        duration = {min = 1, max = 3}, -- 1-3 turns
        preventsAction = true,
        cureOnDamage = false,
        immunityAbilities = {Enums.AbilityId.INSOMNIA, Enums.AbilityId.VITAL_SPIRIT},
        terrainPrevention = {"ELECTRIC", "MISTY"}
    },
    [MoveEffectProcessor.StatusEffect.PARALYSIS] = {
        name = "Paralysis", 
        duration = -1, -- Permanent until cured
        speedReduction = 0.25, -- Speed reduced to 25%
        actionFailureChance = 0.25, -- 25% chance to fail action
        immunityTypes = {Enums.PokemonType.ELECTRIC},
        immunityAbilities = {Enums.AbilityId.LIMBER},
        cureConditions = {"natural_cure", "cheri_berry", "aromatherapy", "heal_bell"}
    },
    [MoveEffectProcessor.StatusEffect.BURN] = {
        name = "Burn",
        duration = -1, -- Permanent until cured
        damagePerTurn = 1/16, -- 1/16 of max HP per turn
        attackReduction = 0.5, -- Physical attack reduced to 50%
        immunityTypes = {Enums.PokemonType.FIRE},
        immunityAbilities = {Enums.AbilityId.WATER_VEIL},
        cureConditions = {"natural_cure", "rawst_berry", "aromatherapy", "heal_bell"}
    },
    [MoveEffectProcessor.StatusEffect.FREEZE] = {
        name = "Freeze",
        duration = -1, -- Until thawed (variable)
        preventsAction = true,
        thawChance = 0.2, -- 20% chance to thaw each turn
        immunityTypes = {Enums.PokemonType.ICE},
        immunityAbilities = {Enums.AbilityId.MAGMA_ARMOR},
        thawOnFireMove = true
    },
    [MoveEffectProcessor.StatusEffect.TOXIC] = {
        name = "Toxic",
        duration = -1, -- Permanent until cured
        damagePerTurn = "escalating", -- 1/16, 2/16, 3/16, etc.
        immunityTypes = {Enums.PokemonType.POISON, Enums.PokemonType.STEEL},
        immunityAbilities = {Enums.AbilityId.IMMUNITY, Enums.AbilityId.POISON_HEAL},
        cureConditions = {"natural_cure", "pecha_berry", "aromatherapy", "heal_bell"}
    }
}

-- Check if Pokemon is immune to status effect
-- @param pokemon: Target Pokemon
-- @param statusEffect: Status effect to check
-- @param battleState: Current battle state
-- @return: Boolean indicating immunity and reason
function MoveEffectProcessor.checkStatusImmunity(pokemon, statusEffect, battleState)
    if not pokemon or not statusEffect then
        return false, "Invalid parameters"
    end
    
    local effectData = STATUS_EFFECT_DATA[statusEffect]
    if not effectData then
        return false, "Unknown status effect"
    end
    
    -- Check type immunity
    if effectData.immunityTypes then
        for _, immuneType in ipairs(effectData.immunityTypes) do
            for _, pokemonType in ipairs(pokemon.types or {}) do
                if pokemonType == immuneType then
                    return true, effectData.name .. " immunity due to " .. Enums.PokemonType[immuneType] .. " type"
                end
            end
        end
    end
    
    -- Check ability immunity
    if effectData.immunityAbilities and pokemon.ability then
        for _, immuneAbility in ipairs(effectData.immunityAbilities) do
            if pokemon.ability == immuneAbility then
                return true, effectData.name .. " immunity due to ability"
            end
        end
    end
    
    -- Check terrain prevention
    if effectData.terrainPrevention and battleState and battleState.battleConditions and battleState.battleConditions.terrain then
        for _, preventingTerrain in ipairs(effectData.terrainPrevention) do
            if battleState.battleConditions.terrain == preventingTerrain then
                return true, effectData.name .. " prevented by " .. preventingTerrain .. " terrain"
            end
        end
    end
    
    return false, nil
end

-- Apply status effect to Pokemon
-- @param target: Target Pokemon
-- @param statusEffect: Status effect to apply
-- @param battleState: Current battle state
-- @param source: Source Pokemon (optional)
-- @return: Success status and result message
function MoveEffectProcessor.applyStatusEffect(target, statusEffect, battleState, source)
    if not target or not statusEffect then
        return false, "Invalid status effect parameters"
    end
    
    -- Check if Pokemon already has a status condition
    if target.status and target.status ~= MoveEffectProcessor.StatusEffect.NONE then
        return false, "Pokemon already has status condition: " .. (target.status or "unknown")
    end
    
    -- Check immunity
    local isImmune, immunityReason = MoveEffectProcessor.checkStatusImmunity(target, statusEffect, battleState)
    if isImmune then
        return false, immunityReason
    end
    
    -- Apply status effect
    target.status = statusEffect
    
    -- Set status-specific data
    local effectData = STATUS_EFFECT_DATA[statusEffect]
    if effectData then
        if statusEffect == MoveEffectProcessor.StatusEffect.SLEEP then
            -- Set sleep duration
            if effectData.duration.min and effectData.duration.max then
                target.sleepTurns = BattleRNG.random(effectData.duration.min, effectData.duration.max)
            end
        elseif statusEffect == MoveEffectProcessor.StatusEffect.TOXIC then
            -- Initialize toxic damage counter
            target.toxicTurns = 1
        end
    end
    
    return true, "Status effect " .. (effectData.name or "unknown") .. " applied successfully"
end

-- Apply stat stage modifications
-- @param target: Target Pokemon
-- @param statModifications: Table of stat modifications {stat = stage_change}
-- @param battleState: Current battle state
-- @param source: Source Pokemon (optional)
-- @return: Success status and applied modifications
function MoveEffectProcessor.applyStatModifications(target, statModifications, battleState, source)
    if not target or not statModifications then
        return false, "Invalid stat modification parameters"
    end
    
    if not target.statStages then
        target.statStages = {
            attack = 0,
            defense = 0,
            special_attack = 0,
            special_defense = 0,
            speed = 0,
            accuracy = 0,
            evasion = 0
        }
    end
    
    local appliedModifications = {}
    local totalChanges = 0
    
    for stat, stageChange in pairs(statModifications) do
        if target.statStages[stat] then
            local currentStage = target.statStages[stat]
            local newStage = math.max(-6, math.min(6, currentStage + stageChange))
            local actualChange = newStage - currentStage
            
            if actualChange ~= 0 then
                target.statStages[stat] = newStage
                appliedModifications[stat] = actualChange
                totalChanges = totalChanges + math.abs(actualChange)
            end
        end
    end
    
    if totalChanges > 0 then
        return true, appliedModifications
    else
        return false, "No stat changes applied"
    end
end

-- Process healing effects
-- @param target: Target Pokemon
-- @param healingAmount: Amount to heal (can be percentage or absolute)
-- @param healingType: Type of healing ("PERCENTAGE", "ABSOLUTE", "FULL")
-- @param battleState: Current battle state
-- @return: Success status and amount healed
function MoveEffectProcessor.processHealing(target, healingAmount, healingType, battleState)
    if not target or not target.hp or not target.maxHp then
        return false, "Invalid healing target"
    end
    
    if target.hp >= target.maxHp then
        return false, "Pokemon already at full HP"
    end
    
    local amountToHeal = 0
    
    if healingType == "PERCENTAGE" then
        amountToHeal = math.floor(target.maxHp * healingAmount)
    elseif healingType == "ABSOLUTE" then
        amountToHeal = healingAmount
    elseif healingType == "FULL" then
        amountToHeal = target.maxHp - target.hp
    else
        return false, "Unknown healing type: " .. tostring(healingType)
    end
    
    -- Ensure healing doesn't exceed max HP
    local previousHp = target.hp
    target.hp = math.min(target.maxHp, target.hp + amountToHeal)
    local actualHealing = target.hp - previousHp
    
    return true, actualHealing
end

-- Process damage over time effects
-- @param pokemon: Pokemon receiving damage
-- @param battleState: Current battle state
-- @return: Damage dealt and effect description
function MoveEffectProcessor.processDamageOverTime(pokemon, battleState)
    if not pokemon or not pokemon.status then
        return 0, nil
    end
    
    local statusEffect = pokemon.status
    local effectData = STATUS_EFFECT_DATA[statusEffect]
    
    if not effectData or not effectData.damagePerTurn then
        return 0, nil
    end
    
    local damage = 0
    local description = ""
    
    if statusEffect == MoveEffectProcessor.StatusEffect.POISON then
        damage = math.max(1, math.floor(pokemon.maxHp * effectData.damagePerTurn))
        description = pokemon.species .. " is hurt by poison!"
        
    elseif statusEffect == MoveEffectProcessor.StatusEffect.BURN then
        damage = math.max(1, math.floor(pokemon.maxHp * effectData.damagePerTurn))
        description = pokemon.species .. " is hurt by burn!"
        
    elseif statusEffect == MoveEffectProcessor.StatusEffect.TOXIC then
        local toxicTurns = pokemon.toxicTurns or 1
        damage = math.max(1, math.floor(pokemon.maxHp * (toxicTurns / 16)))
        pokemon.toxicTurns = toxicTurns + 1
        description = pokemon.species .. " is badly poisoned!"
    end
    
    -- Apply damage
    if damage > 0 then
        pokemon.hp = math.max(0, pokemon.hp - damage)
    end
    
    return damage, description
end

-- Check if Pokemon can perform action (status condition check)
-- @param pokemon: Pokemon to check
-- @param actionType: Type of action ("MOVE", "SWITCH", "ITEM")
-- @return: Boolean indicating if action is allowed and reason if blocked
function MoveEffectProcessor.checkActionAllowed(pokemon, actionType)
    if not pokemon or not pokemon.status then
        return true, nil
    end
    
    local statusEffect = pokemon.status
    local effectData = STATUS_EFFECT_DATA[statusEffect]
    
    if not effectData then
        return true, nil
    end
    
    -- Check if status prevents action
    if effectData.preventsAction then
        if statusEffect == MoveEffectProcessor.StatusEffect.SLEEP then
            -- Check if Pokemon wakes up
            if pokemon.sleepTurns and pokemon.sleepTurns > 0 then
                pokemon.sleepTurns = pokemon.sleepTurns - 1
                if pokemon.sleepTurns <= 0 then
                    pokemon.status = MoveEffectProcessor.StatusEffect.NONE
                    return true, pokemon.species .. " woke up!"
                else
                    return false, pokemon.species .. " is fast asleep!"
                end
            end
        elseif statusEffect == MoveEffectProcessor.StatusEffect.FREEZE then
            -- Check if Pokemon thaws
            if BattleRNG.randomFloat() < effectData.thawChance then
                pokemon.status = MoveEffectProcessor.StatusEffect.NONE
                return true, pokemon.species .. " thawed out!"
            else
                return false, pokemon.species .. " is frozen solid!"
            end
        end
    end
    
    -- Check paralysis action failure
    if statusEffect == MoveEffectProcessor.StatusEffect.PARALYSIS and actionType == "MOVE" then
        if BattleRNG.randomFloat() < effectData.actionFailureChance then
            return false, pokemon.species .. " is paralyzed! It can't move!"
        end
    end
    
    return true, nil
end

-- Process move effect based on move data
-- @param moveData: Move data with effect information
-- @param attacker: Pokemon using the move
-- @param target: Pokemon receiving the effect
-- @param battleState: Current battle state
-- @return: Effect processing result
function MoveEffectProcessor.processMoveEffect(moveData, attacker, target, battleState)
    if not moveData or not moveData.effect then
        return {success = false, message = "No move effect to process"}
    end
    
    local result = {
        success = true,
        effects_applied = {},
        messages = {}
    }
    
    local effect = moveData.effect
    
    -- Process status effect application
    if effect.statusEffect and effect.statusEffect ~= MoveEffectProcessor.StatusEffect.NONE then
        -- Check effect chance
        local effectChance = effect.chance or 100
        if BattleRNG.randomFloat() * 100 < effectChance then
            local success, message = MoveEffectProcessor.applyStatusEffect(target, effect.statusEffect, battleState, attacker)
            table.insert(result.effects_applied, {
                type = "STATUS_EFFECT",
                target = target.id,
                effect = effect.statusEffect,
                success = success
            })
            table.insert(result.messages, message)
        end
    end
    
    -- Process stat modifications
    if effect.statChanges then
        local success, modifications = MoveEffectProcessor.applyStatModifications(target, effect.statChanges, battleState, attacker)
        table.insert(result.effects_applied, {
            type = "STAT_MODIFICATIONS",
            target = target.id,
            modifications = modifications,
            success = success
        })
        if success then
            for stat, change in pairs(modifications) do
                local direction = change > 0 and "rose" or "fell"
                local magnitude = math.abs(change) > 1 and " sharply" or ""
                table.insert(result.messages, target.species .. "'s " .. stat .. magnitude .. " " .. direction .. "!")
            end
        end
    end
    
    -- Process healing effects
    if effect.healing then
        local healingType = effect.healing.type or "PERCENTAGE"
        local healingAmount = effect.healing.amount or 0.5
        local success, amountHealed = MoveEffectProcessor.processHealing(target, healingAmount, healingType, battleState)
        table.insert(result.effects_applied, {
            type = "HEALING",
            target = target.id,
            amount_healed = amountHealed,
            success = success
        })
        if success then
            table.insert(result.messages, target.species .. " recovered " .. amountHealed .. " HP!")
        end
    end
    
    return result
end

-- Cure status condition
-- @param pokemon: Pokemon to cure
-- @param cureType: Type of cure ("ALL", specific status effect, or ability)
-- @return: Success status and cure description
function MoveEffectProcessor.cureStatusCondition(pokemon, cureType)
    if not pokemon or not pokemon.status or pokemon.status == MoveEffectProcessor.StatusEffect.NONE then
        return false, "No status condition to cure"
    end
    
    local curedStatus = pokemon.status
    local statusName = STATUS_EFFECT_DATA[curedStatus] and STATUS_EFFECT_DATA[curedStatus].name or "unknown"
    
    -- Clear status and related data
    pokemon.status = MoveEffectProcessor.StatusEffect.NONE
    pokemon.sleepTurns = nil
    pokemon.toxicTurns = nil
    
    return true, pokemon.species .. " was cured of " .. statusName .. "!"
end

return MoveEffectProcessor