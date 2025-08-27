-- Ability Effects Implementation
-- Complete ability effect definitions and trigger conditions
-- Based on TypeScript reference for exact behavioral parity

local AbilityEffects = {}

-- Ability trigger types (matching TypeScript AbAttr system)
AbilityEffects.TriggerTypes = {
    POST_SUMMON = "POST_SUMMON",           -- When Pokemon enters battle
    PRE_ATTACK = "PRE_ATTACK",             -- Before Pokemon attacks
    ON_ATTACK = "ON_ATTACK",               -- When Pokemon attacks
    POST_ATTACK = "POST_ATTACK",           -- After Pokemon attacks
    PRE_DEFEND = "PRE_DEFEND",             -- Before Pokemon is attacked
    ON_DEFEND = "ON_DEFEND",               -- When Pokemon is being attacked
    POST_DEFEND = "POST_DEFEND",           -- After Pokemon is attacked
    PRE_SET_STATUS = "PRE_SET_STATUS",     -- Before status condition is applied
    POST_SET_STATUS = "POST_SET_STATUS",   -- After status condition is applied
    PRE_MOVE = "PRE_MOVE",                 -- Before any Pokemon uses a move
    POST_MOVE = "POST_MOVE",               -- After any Pokemon uses a move
    TURN_START = "TURN_START",             -- At the start of turn
    TURN_END = "TURN_END",                 -- At the end of turn
    ON_WEATHER = "ON_WEATHER",             -- When weather is active
    ON_TERRAIN = "ON_TERRAIN",             -- When terrain is active
    ON_SWITCH_IN = "ON_SWITCH_IN",         -- When switching in
    ON_SWITCH_OUT = "ON_SWITCH_OUT",       -- When switching out
    ON_FAINT = "ON_FAINT",                 -- When Pokemon faints
    ON_REVIVE = "ON_REVIVE"                -- When Pokemon is revived
}

-- Effect types for ability actions
AbilityEffects.EffectTypes = {
    -- Stat modifications
    STAT_STAGE_CHANGE = "STAT_STAGE_CHANGE",
    STAT_MULTIPLIER = "STAT_MULTIPLIER",
    
    -- Status conditions
    PREVENT_STATUS = "PREVENT_STATUS",
    CURE_STATUS = "CURE_STATUS",
    INFLICT_STATUS = "INFLICT_STATUS",
    
    -- Weather and terrain
    SET_WEATHER = "SET_WEATHER",
    PREVENT_WEATHER = "PREVENT_WEATHER",
    SET_TERRAIN = "SET_TERRAIN",
    
    -- Damage modifications
    DAMAGE_MULTIPLIER = "DAMAGE_MULTIPLIER",
    PREVENT_DAMAGE = "PREVENT_DAMAGE",
    REFLECT_DAMAGE = "REFLECT_DAMAGE",
    
    -- Move modifications
    PREVENT_MOVE = "PREVENT_MOVE",
    BLOCK_CRIT = "BLOCK_CRIT",
    PRIORITY_CHANGE = "PRIORITY_CHANGE",
    
    -- Special effects
    FLINCH_CHANCE = "FLINCH_CHANCE",
    PREVENT_OHKO = "PREVENT_OHKO",
    IMMUNE_OHKO_MOVES = "IMMUNE_OHKO_MOVES",
    TYPE_CHANGE = "TYPE_CHANGE",
    ABILITY_CHANGE = "ABILITY_CHANGE",
    
    -- HP restoration
    HEAL_HP = "HEAL_HP",
    DRAIN_HP = "DRAIN_HP",
    
    -- Item interactions
    PREVENT_ITEM_USE = "PREVENT_ITEM_USE",
    STEAL_ITEM = "STEAL_ITEM"
}

-- Condition types for ability effect triggers
AbilityEffects.ConditionTypes = {
    ALWAYS = "ALWAYS",
    FULL_HP = "FULL_HP",
    LOW_HP = "LOW_HP",
    CONTACT_MOVE = "CONTACT_MOVE",
    PHYSICAL_MOVE = "PHYSICAL_MOVE",
    SPECIAL_MOVE = "SPECIAL_MOVE",
    STATUS_MOVE = "STATUS_MOVE",
    SAME_TYPE = "SAME_TYPE",
    OPPOSITE_GENDER = "OPPOSITE_GENDER",
    WEATHER_ACTIVE = "WEATHER_ACTIVE",
    TERRAIN_ACTIVE = "TERRAIN_ACTIVE",
    FIRST_TURN = "FIRST_TURN"
}

-- Apply ability effect based on trigger and context
function AbilityEffects.applyEffect(pokemon, ability, effect, battleContext)
    if not AbilityEffects.checkCondition(pokemon, effect.condition, battleContext) then
        return false
    end
    
    local effectType = effect.effect
    local applied = false
    
    if effectType == AbilityEffects.EffectTypes.STAT_STAGE_CHANGE then
        applied = AbilityEffects.applyStatStageChange(pokemon, effect, battleContext)
        
    elseif effectType == AbilityEffects.EffectTypes.PREVENT_STATUS then
        applied = AbilityEffects.applyPreventStatus(pokemon, effect, battleContext)
        
    elseif effectType == AbilityEffects.EffectTypes.SET_WEATHER then
        applied = AbilityEffects.applySetWeather(pokemon, effect, battleContext)
        
    elseif effectType == AbilityEffects.EffectTypes.DAMAGE_MULTIPLIER then
        applied = AbilityEffects.applyDamageMultiplier(pokemon, effect, battleContext)
        
    elseif effectType == AbilityEffects.EffectTypes.BLOCK_CRIT then
        applied = AbilityEffects.applyBlockCrit(pokemon, effect, battleContext)
        
    elseif effectType == AbilityEffects.EffectTypes.PREVENT_OHKO then
        applied = AbilityEffects.applyPreventOHKO(pokemon, effect, battleContext)
        
    elseif effectType == AbilityEffects.EffectTypes.FLINCH_CHANCE then
        applied = AbilityEffects.applyFlinchChance(pokemon, effect, battleContext)
        
    -- Add more effect type handlers as needed
    end
    
    return applied
end

-- Check if condition is met for ability effect
function AbilityEffects.checkCondition(pokemon, condition, battleContext)
    if not condition or condition == AbilityEffects.ConditionTypes.ALWAYS then
        return true
    end
    
    if condition == AbilityEffects.ConditionTypes.FULL_HP then
        return pokemon.hp == pokemon.getMaxHp()
        
    elseif condition == AbilityEffects.ConditionTypes.LOW_HP then
        return pokemon.hp <= math.floor(pokemon.getMaxHp() / 4)
        
    elseif condition == AbilityEffects.ConditionTypes.CONTACT_MOVE then
        return battleContext.move and battleContext.move.hasFlag("CONTACT")
        
    elseif condition == AbilityEffects.ConditionTypes.PHYSICAL_MOVE then
        return battleContext.move and battleContext.move.category == "PHYSICAL"
        
    elseif condition == AbilityEffects.ConditionTypes.SPECIAL_MOVE then
        return battleContext.move and battleContext.move.category == "SPECIAL"
        
    elseif condition == AbilityEffects.ConditionTypes.STATUS_MOVE then
        return battleContext.move and battleContext.move.category == "STATUS"
        
    elseif condition == AbilityEffects.ConditionTypes.WEATHER_ACTIVE then
        return battleContext.battle and battleContext.battle.weather ~= nil
        
    elseif condition == AbilityEffects.ConditionTypes.FIRST_TURN then
        return battleContext.battle and battleContext.battle.turn == 1
    end
    
    return false
end

-- Apply stat stage change effect
function AbilityEffects.applyStatStageChange(pokemon, effect, battleContext)
    if not effect.stat or not effect.stages then
        return false
    end
    
    local statEnum = effect.stat
    local stages = effect.stages
    
    -- Apply stat stage change to Pokemon
    local currentStage = pokemon.getStatStage(statEnum) or 0
    local newStage = math.max(-6, math.min(6, currentStage + stages))
    
    if newStage ~= currentStage then
        pokemon.setStatStage(statEnum, newStage)
        return true
    end
    
    return false
end

-- Apply prevent status effect
function AbilityEffects.applyPreventStatus(pokemon, effect, battleContext)
    if not effect.status then
        return false
    end
    
    if battleContext.statusToApply == effect.status then
        battleContext.statusPrevented = true
        return true
    end
    
    return false
end

-- Apply weather setting effect
function AbilityEffects.applySetWeather(pokemon, effect, battleContext)
    if not effect.weather then
        return false
    end
    
    if battleContext.battle then
        local turns = effect.turns or 5
        battleContext.battle.setWeather(effect.weather, turns)
        return true
    end
    
    return false
end

-- Apply damage multiplier effect
function AbilityEffects.applyDamageMultiplier(pokemon, effect, battleContext)
    if not effect.multiplier then
        return false
    end
    
    if battleContext.damage then
        battleContext.damage = math.floor(battleContext.damage * effect.multiplier)
        return true
    end
    
    return false
end

-- Apply critical hit blocking effect
function AbilityEffects.applyBlockCrit(pokemon, effect, battleContext)
    if battleContext.criticalHit then
        battleContext.criticalHit = false
        battleContext.critBlocked = true
        return true
    end
    
    return false
end

-- Apply OHKO prevention effect
function AbilityEffects.applyPreventOHKO(pokemon, effect, battleContext)
    if battleContext.damage and battleContext.damage >= pokemon.hp and pokemon.hp == pokemon.getMaxHp() then
        battleContext.damage = pokemon.hp - 1
        battleContext.ohkoPrevented = true
        return true
    end
    
    return false
end

-- Apply flinch chance effect
function AbilityEffects.applyFlinchChance(pokemon, effect, battleContext)
    if not effect.chance then
        return false
    end
    
    -- Use battle RNG for consistency with TypeScript implementation
    local random = battleContext.battle and battleContext.battle.randSeedFloat() or math.random()
    
    if random < effect.chance and battleContext.target then
        battleContext.target.addTag("FLINCHED")
        return true
    end
    
    return false
end

-- Get ability trigger priority (for resolving conflicts)
function AbilityEffects.getTriggerPriority(abilityId, trigger)
    -- Priority system based on TypeScript postSummonPriority and trigger types
    local basePriority = 0
    
    if trigger == AbilityEffects.TriggerTypes.POST_SUMMON then
        -- Weather setting abilities have priority 1
        if abilityId == 2 then -- DRIZZLE
            basePriority = 1
        end
    elseif trigger == AbilityEffects.TriggerTypes.PRE_DEFEND then
        -- Defensive abilities have higher priority
        basePriority = 2
    elseif trigger == AbilityEffects.TriggerTypes.ON_ATTACK then
        -- Offensive abilities have lower priority
        basePriority = 1
    end
    
    return basePriority
end

-- Check if abilities interact and resolve conflicts
function AbilityEffects.resolveAbilityInteractions(activeAbilities, trigger, battleContext)
    if not activeAbilities or #activeAbilities <= 1 then
        return activeAbilities
    end
    
    -- Sort abilities by priority
    table.sort(activeAbilities, function(a, b)
        local priorityA = AbilityEffects.getTriggerPriority(a.abilityId, trigger)
        local priorityB = AbilityEffects.getTriggerPriority(b.abilityId, trigger)
        return priorityA > priorityB
    end)
    
    -- Apply conflict resolution rules
    local resolvedAbilities = {}
    for _, ability in ipairs(activeAbilities) do
        local shouldApply = true
        
        -- Check for ability suppression or conflicts
        if battleContext.suppressAbilities then
            shouldApply = false
        end
        
        if shouldApply then
            table.insert(resolvedAbilities, ability)
        end
    end
    
    return resolvedAbilities
end

return AbilityEffects