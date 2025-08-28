-- Critical Hit Calculator
-- Implements exact TypeScript critical hit calculation system
-- Provides precise critical hit rate calculation and damage multipliers
-- Integrates with move database and Pokemon stats for complete critical hit mechanics

local CriticalHitCalculator = {}

-- Load dependencies
local MoveDatabase = require("data.moves.move-database")

-- Critical hit stage multipliers (matching TypeScript implementation exactly)
local CRITICAL_HIT_STAGES = {
    [0] = 1/24,   -- Stage 0: ~4.17% (1/24)
    [1] = 1/8,    -- Stage 1: 12.5% (1/8)  
    [2] = 1/2,    -- Stage 2: 50% (1/2)
    [3] = 1       -- Stage 3: 100% (1/1)
}

-- Critical hit damage multiplier (matching TypeScript exactly)
local CRITICAL_HIT_DAMAGE_MULTIPLIER = 1.5

-- Moves with increased critical hit rates (high crit ratio moves)
local HIGH_CRIT_MOVES = {
    -- These moves have +1 critical hit stage
    [2] = true,   -- Karate Chop
    [40] = true,  -- Razor Leaf  
    [98] = true,  -- Crabhammer
    [163] = true, -- Slash
    [190] = true, -- Cross Chop
    [314] = true, -- Leaf Blade
    [348] = true, -- Psycho Cut
    [400] = true, -- Night Slash
    [427] = true, -- Shadow Claw
    [480] = true, -- Stone Edge
    [534] = true  -- Attack Order
}

-- Items that affect critical hit rates
local CRITICAL_HIT_ITEMS = {
    -- Scope Lens: +1 critical hit stage
    scope_lens = 1,
    -- Lucky Punch (Chansey only): +2 critical hit stages
    lucky_punch = 2,
    -- Stick (Farfetch'd only): +2 critical hit stages  
    stick = 2,
    -- Razor Claw: +1 critical hit stage
    razor_claw = 1
}

-- Abilities that affect critical hit rates
local CRITICAL_HIT_ABILITIES = {
    -- Super Luck: +1 critical hit stage
    super_luck = 1,
    -- Sniper: Increases critical hit damage (doesn't affect rate)
    sniper = 0
}

-- Initialize critical hit calculator
function CriticalHitCalculator.init()
    -- Ensure move database is loaded
    if not MoveDatabase.moves or #MoveDatabase.moves == 0 then
        MoveDatabase.init()
    end
    
    return true
end

-- Calculate critical hit stage for a Pokemon using a specific move
-- @param pokemon: Pokemon object with stats and equipment
-- @param moveId: Move being used
-- @param target: Target Pokemon (for certain ability interactions)
-- @param battleConditions: Current battle conditions
-- @return: Critical hit stage (0-3)
function CriticalHitCalculator.calculateCriticalHitStage(pokemon, moveId, target, battleConditions)
    if not pokemon or not moveId then
        return 0
    end
    
    local critStage = 0
    
    -- Base critical hit stage from move
    if HIGH_CRIT_MOVES[moveId] then
        critStage = critStage + 1
    end
    
    -- Check for moves with inherent high crit in move database
    local move = MoveDatabase.moves[moveId]
    if move and move.effects and move.effects.high_crit then
        critStage = critStage + 1
    end
    
    -- Ability modifications
    if pokemon.ability then
        local abilityBonus = CRITICAL_HIT_ABILITIES[pokemon.ability]
        if abilityBonus then
            critStage = critStage + abilityBonus
        end
        
        -- Focus Energy effect (from ability or move)
        if pokemon.focusEnergy then
            critStage = critStage + 2
        end
    end
    
    -- Item modifications
    if pokemon.heldItem then
        local itemBonus = CRITICAL_HIT_ITEMS[pokemon.heldItem]
        if itemBonus then
            -- Check species-specific item restrictions
            if pokemon.heldItem == "lucky_punch" and pokemon.species ~= "chansey" then
                -- Lucky Punch only works for Chansey
                itemBonus = 0
            elseif pokemon.heldItem == "stick" and pokemon.species ~= "farfetchd" then
                -- Stick only works for Farfetch'd
                itemBonus = 0
            end
            
            critStage = critStage + itemBonus
        end
    end
    
    -- Battle condition modifications
    if battleConditions then
        -- Dire Hit effect (temporary battle condition)
        if battleConditions.direHit and battleConditions.direHit[pokemon.id] then
            critStage = critStage + 1
        end
        
        -- Critical hit-preventing abilities on target
        if target and target.ability then
            if target.ability == "battle_armor" or target.ability == "shell_armor" then
                return -1 -- Prevents critical hits entirely
            end
        end
    end
    
    -- Cap critical hit stage at maximum
    if critStage > 3 then
        critStage = 3
    end
    
    return critStage
end

-- Calculate critical hit rate percentage from stage
-- @param critStage: Critical hit stage (0-3 or -1 for immunity)
-- @return: Critical hit percentage (0-100)
function CriticalHitCalculator.getCriticalHitRate(critStage)
    if critStage < 0 then
        return 0 -- Critical hit immunity
    end
    
    local rate = CRITICAL_HIT_STAGES[critStage] or 0
    return rate * 100 -- Convert to percentage
end

-- Determine if an attack results in critical hit
-- @param pokemon: Attacking Pokemon
-- @param moveId: Move being used
-- @param target: Target Pokemon
-- @param battleConditions: Battle state including RNG
-- @return: Boolean indicating critical hit and rate info
function CriticalHitCalculator.rollCriticalHit(pokemon, moveId, target, battleConditions)
    if not pokemon or not moveId or not battleConditions then
        return false, 0
    end
    
    -- Calculate critical hit stage
    local critStage = CriticalHitCalculator.calculateCriticalHitStage(pokemon, moveId, target, battleConditions)
    
    -- Check for critical hit immunity
    if critStage < 0 then
        return false, 0
    end
    
    -- Get critical hit rate
    local critRate = CRITICAL_HIT_STAGES[critStage] or 0
    
    -- Use battle RNG for deterministic results
    local rng = battleConditions.rng
    if not rng then
        return false, critRate * 100
    end
    
    -- Generate random number and compare to critical hit rate
    -- Using precise fractional comparison to match TypeScript behavior
    local randomValue = math.abs(rng:random()) / 2147483647.0 -- Normalize to 0-1
    
    local isCritical = randomValue < critRate
    
    return isCritical, critRate * 100
end

-- Calculate critical hit damage multiplier
-- @param pokemon: Attacking Pokemon
-- @param target: Target Pokemon  
-- @param moveId: Move being used
-- @param isCritical: Whether the hit is critical
-- @return: Damage multiplier for critical hits
function CriticalHitCalculator.getCriticalHitDamageMultiplier(pokemon, target, moveId, isCritical)
    if not isCritical then
        return 1.0 -- No multiplier for non-critical hits
    end
    
    local multiplier = CRITICAL_HIT_DAMAGE_MULTIPLIER
    
    -- Sniper ability increases critical hit damage
    if pokemon and pokemon.ability == "sniper" then
        multiplier = 2.25 -- Sniper makes crits do 2.25x instead of 1.5x
    end
    
    -- Tinted Lens interaction (affects super effective calculation, not crit multiplier)
    -- Other critical hit damage modifiers can be added here
    
    return multiplier
end

-- Apply critical hit effects to damage calculation
-- @param baseDamage: Base damage before critical hit
-- @param pokemon: Attacking Pokemon
-- @param target: Target Pokemon
-- @param moveId: Move being used
-- @param battleConditions: Battle state
-- @return: Final damage after critical hit and detailed result
function CriticalHitCalculator.applyCriticalHit(baseDamage, pokemon, target, moveId, battleConditions)
    if not baseDamage or baseDamage <= 0 then
        return baseDamage, {
            is_critical = false,
            rate = 0,
            multiplier = 1.0,
            final_damage = baseDamage
        }
    end
    
    -- Determine if critical hit occurs
    local isCritical, critRate = CriticalHitCalculator.rollCriticalHit(pokemon, moveId, target, battleConditions)
    
    -- Calculate damage multiplier
    local multiplier = CriticalHitCalculator.getCriticalHitDamageMultiplier(pokemon, target, moveId, isCritical)
    
    -- Apply critical hit damage
    local finalDamage = baseDamage
    if isCritical then
        finalDamage = math.floor(baseDamage * multiplier)
    end
    
    local result = {
        is_critical = isCritical,
        rate = critRate,
        multiplier = multiplier,
        stage = CriticalHitCalculator.calculateCriticalHitStage(pokemon, moveId, target, battleConditions),
        base_damage = baseDamage,
        final_damage = finalDamage
    }
    
    return finalDamage, result
end

-- Check if a move can critical hit
-- @param moveId: Move identifier
-- @param target: Target Pokemon (for ability checks)
-- @return: Boolean indicating if move can crit
function CriticalHitCalculator.canMoveCriticalHit(moveId, target)
    if not moveId then
        return false
    end
    
    -- Check target abilities that prevent critical hits
    if target and target.ability then
        if target.ability == "battle_armor" or target.ability == "shell_armor" then
            return false
        end
    end
    
    -- Get move data
    local move = MoveDatabase.moves[moveId]
    if not move then
        return false
    end
    
    -- Status moves generally cannot critical hit
    if move.category == 2 then -- Status category
        return false
    end
    
    -- Multi-hit moves can critical hit each individual hit
    return true
end

-- Get critical hit stage breakdown for debugging
-- @param pokemon: Pokemon to analyze
-- @param moveId: Move being used
-- @param target: Target Pokemon
-- @param battleConditions: Battle conditions
-- @return: Detailed breakdown of critical hit stage calculation
function CriticalHitCalculator.getCriticalHitBreakdown(pokemon, moveId, target, battleConditions)
    local breakdown = {
        base_stage = 0,
        move_bonus = 0,
        ability_bonus = 0,
        item_bonus = 0,
        condition_bonus = 0,
        final_stage = 0,
        final_rate = 0,
        can_crit = true
    }
    
    if not pokemon or not moveId then
        breakdown.can_crit = false
        return breakdown
    end
    
    -- Check if move can critical hit
    breakdown.can_crit = CriticalHitCalculator.canMoveCriticalHit(moveId, target)
    if not breakdown.can_crit then
        return breakdown
    end
    
    -- Move bonus
    if HIGH_CRIT_MOVES[moveId] then
        breakdown.move_bonus = breakdown.move_bonus + 1
    end
    
    local move = MoveDatabase.moves[moveId]
    if move and move.effects and move.effects.high_crit then
        breakdown.move_bonus = breakdown.move_bonus + 1
    end
    
    -- Ability bonus
    if pokemon.ability then
        breakdown.ability_bonus = CRITICAL_HIT_ABILITIES[pokemon.ability] or 0
        
        if pokemon.focusEnergy then
            breakdown.condition_bonus = breakdown.condition_bonus + 2
        end
    end
    
    -- Item bonus
    if pokemon.heldItem then
        breakdown.item_bonus = CRITICAL_HIT_ITEMS[pokemon.heldItem] or 0
        
        -- Apply species restrictions
        if pokemon.heldItem == "lucky_punch" and pokemon.species ~= "chansey" then
            breakdown.item_bonus = 0
        elseif pokemon.heldItem == "stick" and pokemon.species ~= "farfetchd" then
            breakdown.item_bonus = 0
        end
    end
    
    -- Battle condition bonus
    if battleConditions and battleConditions.direHit and battleConditions.direHit[pokemon.id] then
        breakdown.condition_bonus = breakdown.condition_bonus + 1
    end
    
    -- Calculate final stage and rate
    breakdown.final_stage = breakdown.base_stage + breakdown.move_bonus + 
                           breakdown.ability_bonus + breakdown.item_bonus + 
                           breakdown.condition_bonus
    
    if breakdown.final_stage > 3 then
        breakdown.final_stage = 3
    end
    
    breakdown.final_rate = CriticalHitCalculator.getCriticalHitRate(breakdown.final_stage)
    
    return breakdown
end

-- Validate critical hit calculation
-- @param result: Critical hit result to validate
-- @return: Boolean indicating validity and error message
function CriticalHitCalculator.validateCriticalHit(result)
    if not result or type(result) ~= "table" then
        return false, "Invalid critical hit result"
    end
    
    -- Check required fields
    local requiredFields = {"is_critical", "rate", "multiplier", "final_damage"}
    for _, field in ipairs(requiredFields) do
        if result[field] == nil then
            return false, "Missing required field: " .. field
        end
    end
    
    -- Validate rate range
    if result.rate < 0 or result.rate > 100 then
        return false, "Critical hit rate out of range: " .. result.rate
    end
    
    -- Validate multiplier
    if result.multiplier < 1.0 then
        return false, "Critical hit multiplier cannot be less than 1.0: " .. result.multiplier
    end
    
    -- Validate damage values
    if result.final_damage < 0 then
        return false, "Final damage cannot be negative: " .. result.final_damage
    end
    
    if result.base_damage and result.is_critical then
        local expectedDamage = math.floor(result.base_damage * result.multiplier)
        if result.final_damage ~= expectedDamage then
            return false, "Critical hit damage calculation mismatch"
        end
    end
    
    return true, "Critical hit validation passed"
end

return CriticalHitCalculator