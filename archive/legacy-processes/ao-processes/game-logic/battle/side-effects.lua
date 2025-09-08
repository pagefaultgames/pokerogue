-- Side Effects System
-- Implements team-wide defensive effects like Light Screen, Reflect, Aurora Veil, Safeguard, and Mist
-- Handles duration tracking, damage reduction, and status/stat protection

local Enums = require("data.constants.enums")
local BattleRNG = require("game-logic.rng.battle-rng")

local SideEffects = {}

-- Side effect types
local SIDE_EFFECT_TYPES = {
    LIGHT_SCREEN = "LIGHT_SCREEN",
    REFLECT = "REFLECT", 
    AURORA_VEIL = "AURORA_VEIL",
    SAFEGUARD = "SAFEGUARD",
    MIST = "MIST"
}

-- Default side effect duration (turns)
local DEFAULT_DURATION = 5

-- Damage reduction percentages
local DAMAGE_REDUCTION = {
    SINGLES = 0.5,  -- 50% reduction in singles
    DOUBLES = 0.67  -- 33% reduction in doubles (1 - 0.67 = 0.33)
}

-- Initialize side effects for a battle side
-- @param battleState: Current battle state
-- @param side: Battle side ("player" or "enemy")
-- @return: Initialized side effects structure
function SideEffects.initializeSideEffects(battleState, side)
    if not battleState.sideEffects then
        battleState.sideEffects = {}
    end
    
    if not battleState.sideEffects[side] then
        battleState.sideEffects[side] = {}
    end
    
    return battleState.sideEffects[side]
end

-- Set a side effect for a battle side
-- @param battleState: Current battle state
-- @param side: Battle side ("player" or "enemy")
-- @param effectType: Type of side effect to set
-- @param duration: Duration in turns (optional, defaults to 5)
-- @return: Success boolean
function SideEffects.setSideEffect(battleState, side, effectType, duration)
    if not battleState or not side or not effectType then
        return false
    end
    
    duration = duration or DEFAULT_DURATION
    
    -- Initialize side effects if needed
    SideEffects.initializeSideEffects(battleState, side)
    
    -- Set the side effect with duration tracking
    battleState.sideEffects[side][effectType] = {
        type = effectType,
        duration = duration,
        activeTurn = battleState.turn or 1
    }
    
    return true
end

-- Remove a side effect from a battle side
-- @param battleState: Current battle state
-- @param side: Battle side ("player" or "enemy")
-- @param effectType: Type of side effect to remove
-- @return: Success boolean
function SideEffects.removeSideEffect(battleState, side, effectType)
    if not battleState or not side or not effectType then
        return false
    end
    
    if battleState.sideEffects and battleState.sideEffects[side] then
        battleState.sideEffects[side][effectType] = nil
        return true
    end
    
    return false
end

-- Check if a side effect is active
-- @param battleState: Current battle state
-- @param side: Battle side ("player" or "enemy") 
-- @param effectType: Type of side effect to check
-- @return: Boolean indicating if effect is active
function SideEffects.hasSideEffect(battleState, side, effectType)
    if not battleState or not side or not effectType then
        return false
    end
    
    if not battleState.sideEffects or not battleState.sideEffects[side] then
        return false
    end
    
    local effect = battleState.sideEffects[side][effectType]
    return effect ~= nil and effect.duration > 0
end

-- Get remaining duration for a side effect
-- @param battleState: Current battle state
-- @param side: Battle side ("player" or "enemy")
-- @param effectType: Type of side effect to check
-- @return: Remaining duration (0 if not active)
function SideEffects.getSideEffectDuration(battleState, side, effectType)
    if not SideEffects.hasSideEffect(battleState, side, effectType) then
        return 0
    end
    
    return battleState.sideEffects[side][effectType].duration
end

-- Process side effect duration countdown at end of turn
-- @param battleState: Current battle state
-- @return: Table of expired effects by side
function SideEffects.processTurnEnd(battleState)
    if not battleState or not battleState.sideEffects then
        return {player = {}, enemy = {}}
    end
    
    local expiredEffects = {
        player = {},
        enemy = {}
    }
    
    -- Process each side
    for side, sideEffects in pairs(battleState.sideEffects) do
        -- Ensure side exists in expiredEffects
        if not expiredEffects[side] then
            expiredEffects[side] = {}
        end
        
        for effectType, effect in pairs(sideEffects) do
            -- Decrease duration
            effect.duration = effect.duration - 1
            
            -- Check if expired
            if effect.duration <= 0 then
                table.insert(expiredEffects[side], effectType)
                battleState.sideEffects[side][effectType] = nil
            end
        end
    end
    
    return expiredEffects
end

-- Set Light Screen effect
-- @param battleState: Current battle state
-- @param side: Battle side to apply effect
-- @return: Success boolean
function SideEffects.setLightScreen(battleState, side)
    return SideEffects.setSideEffect(battleState, side, SIDE_EFFECT_TYPES.LIGHT_SCREEN, DEFAULT_DURATION)
end

-- Set Reflect effect
-- @param battleState: Current battle state
-- @param side: Battle side to apply effect
-- @return: Success boolean
function SideEffects.setReflect(battleState, side)
    return SideEffects.setSideEffect(battleState, side, SIDE_EFFECT_TYPES.REFLECT, DEFAULT_DURATION)
end

-- Set Aurora Veil effect (both Light Screen and Reflect during hail/snow)
-- @param battleState: Current battle state
-- @param side: Battle side to apply effect
-- @return: Success boolean
function SideEffects.setAuroraVeil(battleState, side)
    -- Check for hail or snow weather condition
    local weather = battleState.weather
    if weather ~= "HAIL" and weather ~= "SNOW" then
        return false, "Aurora Veil requires hail or snow weather"
    end
    
    return SideEffects.setSideEffect(battleState, side, SIDE_EFFECT_TYPES.AURORA_VEIL, DEFAULT_DURATION)
end

-- Set Safeguard effect
-- @param battleState: Current battle state
-- @param side: Battle side to apply effect
-- @return: Success boolean
function SideEffects.setSafeguard(battleState, side)
    return SideEffects.setSideEffect(battleState, side, SIDE_EFFECT_TYPES.SAFEGUARD, DEFAULT_DURATION)
end

-- Set Mist effect
-- @param battleState: Current battle state
-- @param side: Battle side to apply effect
-- @return: Success boolean
function SideEffects.setMist(battleState, side)
    return SideEffects.setSideEffect(battleState, side, SIDE_EFFECT_TYPES.MIST, DEFAULT_DURATION)
end

-- Calculate damage reduction from defensive screens
-- @param damage: Original damage amount
-- @param moveCategory: Physical or Special move category
-- @param attackingSide: Side performing the attack
-- @param defendingSide: Side receiving the attack
-- @param battleState: Current battle state
-- @param isDoublesFormat: Boolean indicating doubles battle format
-- @return: Reduced damage amount
function SideEffects.applyDamageReduction(damage, moveCategory, attackingSide, defendingSide, battleState, isDoublesFormat)
    if not damage or damage <= 0 then
        return damage
    end
    
    if not battleState or not defendingSide then
        return damage
    end
    
    local reductionFactor = 1.0
    
    -- Check for Light Screen (Special damage reduction)
    if moveCategory == Enums.MoveCategory.SPECIAL then
        if SideEffects.hasSideEffect(battleState, defendingSide, SIDE_EFFECT_TYPES.LIGHT_SCREEN) or
           SideEffects.hasSideEffect(battleState, defendingSide, SIDE_EFFECT_TYPES.AURORA_VEIL) then
            reductionFactor = isDoublesFormat and DAMAGE_REDUCTION.DOUBLES or DAMAGE_REDUCTION.SINGLES
        end
    end
    
    -- Check for Reflect (Physical damage reduction)
    if moveCategory == Enums.MoveCategory.PHYSICAL then
        if SideEffects.hasSideEffect(battleState, defendingSide, SIDE_EFFECT_TYPES.REFLECT) or
           SideEffects.hasSideEffect(battleState, defendingSide, SIDE_EFFECT_TYPES.AURORA_VEIL) then
            reductionFactor = isDoublesFormat and DAMAGE_REDUCTION.DOUBLES or DAMAGE_REDUCTION.SINGLES
        end
    end
    
    return math.floor(damage * reductionFactor)
end

-- Check if status condition application should be prevented by Safeguard
-- @param battleState: Current battle state
-- @param targetSide: Side of Pokemon receiving status
-- @param statusType: Status condition type being applied
-- @return: Boolean indicating if status should be prevented
function SideEffects.preventStatusCondition(battleState, targetSide, statusType)
    if not battleState or not targetSide or not statusType then
        return false
    end
    
    -- Safeguard prevents all status conditions
    return SideEffects.hasSideEffect(battleState, targetSide, SIDE_EFFECT_TYPES.SAFEGUARD)
end

-- Check if stat reduction should be prevented by Mist
-- @param battleState: Current battle state
-- @param targetSide: Side of Pokemon receiving stat change
-- @param statChanges: Table of stat changes being applied
-- @return: Boolean indicating if stat reductions should be prevented
function SideEffects.preventStatReduction(battleState, targetSide, statChanges)
    if not battleState or not targetSide or not statChanges then
        return false
    end
    
    -- Check if Mist is active on target side
    if not SideEffects.hasSideEffect(battleState, targetSide, SIDE_EFFECT_TYPES.MIST) then
        return false
    end
    
    -- Check if any stat changes are reductions (negative values)
    for stat, change in pairs(statChanges) do
        if change < 0 then
            return true  -- Prevent any negative stat changes
        end
    end
    
    return false
end

-- Remove screen effects (for Brick Break and Psychic Fangs)
-- @param battleState: Current battle state
-- @param targetSide: Side to remove screens from
-- @param removeAuroraVeil: Whether to also remove Aurora Veil (Psychic Fangs only)
-- @return: Table of removed effects
function SideEffects.removeScreens(battleState, targetSide, removeAuroraVeil)
    if not battleState or not targetSide then
        return {}
    end
    
    local removedEffects = {}
    
    -- Remove Light Screen
    if SideEffects.hasSideEffect(battleState, targetSide, SIDE_EFFECT_TYPES.LIGHT_SCREEN) then
        SideEffects.removeSideEffect(battleState, targetSide, SIDE_EFFECT_TYPES.LIGHT_SCREEN)
        table.insert(removedEffects, SIDE_EFFECT_TYPES.LIGHT_SCREEN)
    end
    
    -- Remove Reflect
    if SideEffects.hasSideEffect(battleState, targetSide, SIDE_EFFECT_TYPES.REFLECT) then
        SideEffects.removeSideEffect(battleState, targetSide, SIDE_EFFECT_TYPES.REFLECT)
        table.insert(removedEffects, SIDE_EFFECT_TYPES.REFLECT)
    end
    
    -- Remove Aurora Veil if specified (Psychic Fangs)
    if removeAuroraVeil and SideEffects.hasSideEffect(battleState, targetSide, SIDE_EFFECT_TYPES.AURORA_VEIL) then
        SideEffects.removeSideEffect(battleState, targetSide, SIDE_EFFECT_TYPES.AURORA_VEIL)
        table.insert(removedEffects, SIDE_EFFECT_TYPES.AURORA_VEIL)
    end
    
    return removedEffects
end

-- Get all active side effects for a battle side
-- @param battleState: Current battle state
-- @param side: Battle side to check
-- @return: Table of active side effects with their data
function SideEffects.getActiveSideEffects(battleState, side)
    if not battleState or not side then
        return {}
    end
    
    if not battleState.sideEffects or not battleState.sideEffects[side] then
        return {}
    end
    
    local activeEffects = {}
    for effectType, effectData in pairs(battleState.sideEffects[side]) do
        if effectData.duration > 0 then
            activeEffects[effectType] = effectData
        end
    end
    
    return activeEffects
end

-- Check if any defensive screens are active (Light Screen, Reflect, or Aurora Veil)
-- @param battleState: Current battle state
-- @param side: Battle side to check
-- @return: Boolean indicating if any screens are active
function SideEffects.hasAnyScreens(battleState, side)
    return SideEffects.hasSideEffect(battleState, side, SIDE_EFFECT_TYPES.LIGHT_SCREEN) or
           SideEffects.hasSideEffect(battleState, side, SIDE_EFFECT_TYPES.REFLECT) or
           SideEffects.hasSideEffect(battleState, side, SIDE_EFFECT_TYPES.AURORA_VEIL)
end

-- Get side effect names for display
-- @param effectType: Side effect type
-- @return: Human-readable name
function SideEffects.getEffectName(effectType)
    local names = {
        [SIDE_EFFECT_TYPES.LIGHT_SCREEN] = "Light Screen",
        [SIDE_EFFECT_TYPES.REFLECT] = "Reflect",
        [SIDE_EFFECT_TYPES.AURORA_VEIL] = "Aurora Veil",
        [SIDE_EFFECT_TYPES.SAFEGUARD] = "Safeguard", 
        [SIDE_EFFECT_TYPES.MIST] = "Mist"
    }
    
    return names[effectType] or effectType
end

-- Export side effect types for external use
SideEffects.TYPES = SIDE_EFFECT_TYPES

return SideEffects