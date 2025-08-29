-- Pokemon Status Effects System
-- Implements all status conditions with proper mechanics and damage calculations
-- Integrates with battle system for deterministic status processing
-- Handles sleep, poison, paralysis, burn, and freeze effects

local StatusEffects = {}

-- Load dependencies
local BattleRNG = require("game-logic.rng.battle-rng")
local Enums = require("data.constants.enums")

-- Status effect type enumeration
StatusEffects.StatusType = {
    NONE = nil,
    SLEEP = "sleep",
    POISON = "poison",
    BADLY_POISONED = "badly_poisoned",
    PARALYSIS = "paralysis",
    BURN = "burn",
    FREEZE = "freeze"
}

-- Status effect turn durations (for sleep)
StatusEffects.SleepDuration = {
    MIN = 1,
    MAX = 3
}

-- Status effect damage calculations
StatusEffects.DamageCalculation = {
    POISON_FRACTION = 8,     -- 1/8 max HP
    BURN_FRACTION = 16,      -- 1/16 max HP
    ATTACK_REDUCTION = 0.5   -- 50% attack reduction from burn
}

-- Status effect chance calculations
StatusEffects.ChanceCalculation = {
    PARALYSIS_FAILURE = 25,  -- 25% chance of move failure
    FREEZE_THAW = 20,        -- 20% base thaw chance
    SLEEP_WAKE = 33,         -- 33% chance to wake up each turn
    SPEED_REDUCTION = 0.5    -- 50% speed reduction from paralysis
}

-- Initialize status effects system
function StatusEffects.init()
    -- Status effects system is stateless, no initialization needed
    return true
end

-- Apply status effect to Pokemon
-- @param pokemon: Pokemon to apply status to
-- @param statusType: Type of status effect
-- @param duration: Optional duration for status effects that use it
-- @param battleState: Current battle state for RNG access
-- @return: Application result with success and messages
function StatusEffects.applyStatusEffect(pokemon, statusType, duration, battleState)
    if not pokemon then
        return {success = false, error = "Invalid Pokemon"}
    end
    
    -- Check if Pokemon already has a status effect
    if pokemon.statusEffect then
        return {
            success = false, 
            error = "Pokemon already has status: " .. pokemon.statusEffect,
            blocked = true
        }
    end
    
    local result = {
        success = true,
        statusApplied = statusType,
        messages = {},
        effects = {}
    }
    
    -- Apply the status effect
    pokemon.statusEffect = statusType
    
    -- Handle status-specific initialization
    if statusType == StatusEffects.StatusType.SLEEP then
        -- Initialize sleep duration using deterministic RNG
        local sleepTurns = duration or BattleRNG.randomInt(StatusEffects.SleepDuration.MIN, StatusEffects.SleepDuration.MAX)
        pokemon.statusTurns = sleepTurns
        table.insert(result.messages, pokemon.name .. " fell asleep!")
        
    elseif statusType == StatusEffects.StatusType.POISON then
        table.insert(result.messages, pokemon.name .. " was poisoned!")
        
    elseif statusType == StatusEffects.StatusType.BADLY_POISONED then
        pokemon.statusEffect = StatusEffects.StatusType.BADLY_POISONED
        pokemon.statusTurns = 1 -- Start at turn 1 for escalating damage
        table.insert(result.messages, pokemon.name .. " was badly poisoned!")
        
    elseif statusType == StatusEffects.StatusType.PARALYSIS then
        table.insert(result.messages, pokemon.name .. " is paralyzed! It may be unable to move!")
        -- Apply speed reduction immediately
        table.insert(result.effects, {
            type = "stat_modification",
            stat = "speed",
            multiplier = StatusEffects.ChanceCalculation.SPEED_REDUCTION
        })
        
    elseif statusType == StatusEffects.StatusType.BURN then
        table.insert(result.messages, pokemon.name .. " was burned!")
        -- Apply attack reduction immediately
        table.insert(result.effects, {
            type = "stat_modification",
            stat = "attack",
            multiplier = StatusEffects.DamageCalculation.ATTACK_REDUCTION
        })
        
    elseif statusType == StatusEffects.StatusType.FREEZE then
        table.insert(result.messages, pokemon.name .. " was frozen solid!")
        
    end
    
    return result
end

-- Process end-of-turn status effects for a Pokemon
-- @param pokemon: Pokemon to process status effects for
-- @param battleState: Current battle state for RNG access
-- @return: Status processing result with damage, healing, and messages
function StatusEffects.processEndOfTurnEffects(pokemon, battleState)
    if not pokemon or not pokemon.statusEffect then
        return {effects = {}, messages = {}}
    end
    
    local result = {
        effects = {},
        messages = {},
        statusChanged = false,
        damageDeal = 0
    }
    
    local statusType = pokemon.statusEffect
    
    -- Process status-specific end-of-turn effects
    if statusType == StatusEffects.StatusType.BURN then
        local damage = StatusEffects.calculateBurnDamage(pokemon)
        pokemon.currentHP = math.max(0, pokemon.currentHP - damage)
        result.damageDealt = damage
        
        table.insert(result.effects, {
            type = "damage",
            amount = damage,
            source = "burn"
        })
        table.insert(result.messages, pokemon.name .. " was hurt by its burn!")
        
    elseif statusType == StatusEffects.StatusType.POISON then
        local damage = StatusEffects.calculatePoisonDamage(pokemon)
        pokemon.currentHP = math.max(0, pokemon.currentHP - damage)
        result.damageDealt = damage
        
        table.insert(result.effects, {
            type = "damage",
            amount = damage,
            source = "poison"
        })
        table.insert(result.messages, pokemon.name .. " was hurt by poison!")
        
    elseif statusType == StatusEffects.StatusType.BADLY_POISONED then
        local damage = StatusEffects.calculateBadlyPoisonedDamage(pokemon)
        pokemon.currentHP = math.max(0, pokemon.currentHP - damage)
        result.damageDealt = damage
        
        -- Increment badly poisoned counter
        pokemon.statusTurns = (pokemon.statusTurns or 1) + 1
        
        table.insert(result.effects, {
            type = "damage", 
            amount = damage,
            source = "badly_poisoned"
        })
        table.insert(result.messages, pokemon.name .. " was hurt by poison!")
        
    elseif statusType == StatusEffects.StatusType.SLEEP then
        -- Process sleep duration
        if pokemon.statusTurns then
            pokemon.statusTurns = pokemon.statusTurns - 1
            if pokemon.statusTurns <= 0 then
                pokemon.statusEffect = nil
                pokemon.statusTurns = nil
                result.statusChanged = true
                table.insert(result.messages, pokemon.name .. " woke up!")
            else
                table.insert(result.messages, pokemon.name .. " is fast asleep.")
            end
        end
    end
    
    return result
end

-- Check if Pokemon can use a move (status effect prevention)
-- @param pokemon: Pokemon attempting to use move
-- @param moveData: Data about the move being used
-- @param battleState: Current battle state for RNG access
-- @return: Move prevention result with success, messages, and status updates
function StatusEffects.checkMovePreventionEffects(pokemon, moveData, battleState)
    if not pokemon or not pokemon.statusEffect then
        return {canMove = true, messages = {}}
    end
    
    local result = {
        canMove = true,
        messages = {},
        statusChanged = false
    }
    
    local statusType = pokemon.statusEffect
    
    -- Check sleep prevention
    if statusType == StatusEffects.StatusType.SLEEP then
        -- Check for early wake-up
        local wakeChance = BattleRNG.randomInt(1, 100)
        if wakeChance <= StatusEffects.ChanceCalculation.SLEEP_WAKE then
            pokemon.statusEffect = nil
            pokemon.statusTurns = nil
            result.statusChanged = true
            table.insert(result.messages, pokemon.name .. " woke up!")
            result.canMove = true
        else
            result.canMove = false
            table.insert(result.messages, pokemon.name .. " is fast asleep!")
        end
        
    elseif statusType == StatusEffects.StatusType.FREEZE then
        -- Check for thaw chance (higher for fire-type moves)
        local thawChance = StatusEffects.ChanceCalculation.FREEZE_THAW
        if moveData and moveData.type == Enums.Type.FIRE then
            thawChance = 100 -- Fire moves always thaw
        end
        
        local thawRoll = BattleRNG.randomInt(1, 100)
        if thawRoll <= thawChance then
            pokemon.statusEffect = nil
            pokemon.statusTurns = nil
            result.statusChanged = true
            table.insert(result.messages, pokemon.name .. " thawed out!")
            result.canMove = true
        else
            result.canMove = false
            table.insert(result.messages, pokemon.name .. " is frozen solid!")
        end
        
    elseif statusType == StatusEffects.StatusType.PARALYSIS then
        -- Check for paralysis move failure
        local paralysisRoll = BattleRNG.randomInt(1, 100)
        if paralysisRoll <= StatusEffects.ChanceCalculation.PARALYSIS_FAILURE then
            result.canMove = false
            table.insert(result.messages, pokemon.name .. " is paralyzed! It can't move!")
        else
            result.canMove = true
        end
    end
    
    return result
end

-- Calculate burn damage
-- @param pokemon: Pokemon taking burn damage
-- @return: Damage amount
function StatusEffects.calculateBurnDamage(pokemon)
    local maxHP = pokemon.maxHP or (pokemon.stats and pokemon.stats.hp) or 100
    return math.max(1, math.floor(maxHP / StatusEffects.DamageCalculation.BURN_FRACTION))
end

-- Calculate poison damage
-- @param pokemon: Pokemon taking poison damage
-- @return: Damage amount
function StatusEffects.calculatePoisonDamage(pokemon)
    local maxHP = pokemon.maxHP or (pokemon.stats and pokemon.stats.hp) or 100
    return math.max(1, math.floor(maxHP / StatusEffects.DamageCalculation.POISON_FRACTION))
end

-- Calculate badly poisoned damage (escalating each turn)
-- @param pokemon: Pokemon taking badly poisoned damage
-- @return: Damage amount
function StatusEffects.calculateBadlyPoisonedDamage(pokemon)
    local maxHP = pokemon.maxHP or (pokemon.stats and pokemon.stats.hp) or 100
    local poisonCounter = pokemon.statusTurns or 1
    local baseDamage = math.floor(maxHP / StatusEffects.DamageCalculation.POISON_FRACTION)
    return math.max(1, baseDamage * poisonCounter)
end

-- Get stat modification from status effects
-- @param pokemon: Pokemon to check for stat modifications
-- @param statName: Name of stat to check
-- @return: Stat multiplier (1.0 = no change)
function StatusEffects.getStatModification(pokemon, statName)
    if not pokemon or not pokemon.statusEffect then
        return 1.0
    end
    
    local statusType = pokemon.statusEffect
    
    -- Apply burn attack reduction
    if statusType == StatusEffects.StatusType.BURN and statName == "attack" then
        return StatusEffects.DamageCalculation.ATTACK_REDUCTION
    end
    
    -- Apply paralysis speed reduction
    if statusType == StatusEffects.StatusType.PARALYSIS and statName == "speed" then
        return StatusEffects.ChanceCalculation.SPEED_REDUCTION
    end
    
    return 1.0
end

-- Clear status effect from Pokemon
-- @param pokemon: Pokemon to clear status from
-- @param message: Optional custom clear message
-- @return: Clear result with messages
function StatusEffects.clearStatusEffect(pokemon, message)
    if not pokemon or not pokemon.statusEffect then
        return {success = false, messages = {}}
    end
    
    local previousStatus = pokemon.statusEffect
    pokemon.statusEffect = nil
    pokemon.statusTurns = nil
    
    local result = {
        success = true,
        previousStatus = previousStatus,
        messages = {}
    }
    
    if message then
        table.insert(result.messages, message)
    else
        table.insert(result.messages, pokemon.name .. "'s status condition was cured!")
    end
    
    return result
end

-- Check if Pokemon has a specific status effect
-- @param pokemon: Pokemon to check
-- @param statusType: Status type to check for
-- @return: Boolean indicating if Pokemon has the status
function StatusEffects.hasStatusEffect(pokemon, statusType)
    if not pokemon then
        return false
    end
    
    return pokemon.statusEffect == statusType
end

-- Get comprehensive status effect information
-- @param pokemon: Pokemon to get status info for
-- @return: Status information object
function StatusEffects.getStatusEffectInfo(pokemon)
    if not pokemon or not pokemon.statusEffect then
        return {hasStatus = false}
    end
    
    local info = {
        hasStatus = true,
        statusType = pokemon.statusEffect,
        turnsRemaining = pokemon.statusTurns,
        statModifications = {}
    }
    
    -- Add stat modifications
    local statMods = {
        attack = StatusEffects.getStatModification(pokemon, "attack"),
        speed = StatusEffects.getStatModification(pokemon, "speed")
    }
    
    for stat, multiplier in pairs(statMods) do
        if multiplier ~= 1.0 then
            info.statModifications[stat] = multiplier
        end
    end
    
    return info
end

return StatusEffects