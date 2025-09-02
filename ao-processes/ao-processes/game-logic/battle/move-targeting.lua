-- Move Targeting System
-- Handles single-target, multi-target, and ally targeting validation for positional mechanics
-- Supports position-dependent moves and doubles-specific targeting rules

local Enums = require("data.constants.enums")
local PositionalMechanics = require("game-logic.battle.positional-mechanics")

local MoveTargeting = {}

-- Targeting types for moves
MoveTargeting.TargetingType = {
    SINGLE_OPPONENT = "single_opponent",
    ALL_OPPONENTS = "all_opponents", 
    SINGLE_ALLY = "single_ally",
    ALL_ALLIES = "all_allies",
    SELF = "self",
    ALL_POKEMON = "all_pokemon",
    SPREAD = "spread", -- Multi-target with damage reduction
    POSITION_DEPENDENT = "position_dependent", -- Doubles-specific moves
    USER_AND_ALLY = "user_and_ally",
    RANDOM_OPPONENT = "random_opponent"
}

-- Target validation results
MoveTargeting.ValidationResult = {
    VALID = "valid",
    INVALID_TARGET = "invalid_target",
    INVALID_FORMAT = "invalid_format",
    NO_VALID_TARGETS = "no_valid_targets",
    ALLY_TARGETING_BLOCKED = "ally_targeting_blocked",
    POSITION_REQUIRED = "position_required"
}

-- Determine move targeting type from move data
-- @param moveData: Move database entry
-- @return: Targeting type and additional targeting info
function MoveTargeting.getMoveTargetingType(moveData)
    if not moveData then
        return MoveTargeting.TargetingType.SINGLE_OPPONENT, {}
    end
    
    -- Check for explicit targeting type in move data
    if moveData.targetingType then
        return moveData.targetingType, moveData.targetingOptions or {}
    end
    
    -- Infer targeting type from move properties
    local targetingInfo = {
        requiresTarget = true,
        allowsAllies = false,
        allowsOpponents = true,
        requiresDoublesFormat = false
    }
    
    -- Status moves targeting self
    if moveData.category == Enums.MoveCategory.STATUS and moveData.target == "self" then
        targetingInfo.requiresTarget = false
        return MoveTargeting.TargetingType.SELF, targetingInfo
    end
    
    -- Multi-target moves
    if moveData.target == "all_opponents" or moveData.hitsAllOpponents then
        return MoveTargeting.TargetingType.ALL_OPPONENTS, targetingInfo
    end
    
    if moveData.target == "all_allies" or moveData.hitsAllAllies then
        targetingInfo.allowsAllies = true
        targetingInfo.allowsOpponents = false
        return MoveTargeting.TargetingType.ALL_ALLIES, targetingInfo
    end
    
    if moveData.target == "all_pokemon" or moveData.hitsAllPokemon then
        targetingInfo.allowsAllies = true
        return MoveTargeting.TargetingType.ALL_POKEMON, targetingInfo
    end
    
    -- Spread moves (multi-target with damage reduction)
    if moveData.isSpreadMove or moveData.damageReduction then
        targetingInfo.damageReduction = moveData.damageReduction or 0.75 -- 25% reduction typical
        return MoveTargeting.TargetingType.SPREAD, targetingInfo
    end
    
    -- Ally targeting moves
    if moveData.target == "ally" or moveData.canTargetAllies then
        targetingInfo.allowsAllies = true
        targetingInfo.allowsOpponents = false
        targetingInfo.requiresDoublesFormat = true
        return MoveTargeting.TargetingType.SINGLE_ALLY, targetingInfo
    end
    
    -- Position-dependent moves (doubles-specific)
    if moveData.doublesOnly or moveData.requiresDoublesFormat then
        targetingInfo.requiresDoublesFormat = true
        return MoveTargeting.TargetingType.POSITION_DEPENDENT, targetingInfo
    end
    
    -- Default to single opponent targeting
    return MoveTargeting.TargetingType.SINGLE_OPPONENT, targetingInfo
end

-- Validate move targeting for a specific battle situation
-- @param battleState: Current battle state
-- @param attacker: Pokemon using the move
-- @param moveData: Move being used
-- @param targetPokemon: Intended target Pokemon (can be nil for self/all moves)
-- @param targetPosition: Intended target position (for position-dependent moves)
-- @return: Validation result and details
function MoveTargeting.validateMoveTargeting(battleState, attacker, moveData, targetPokemon, targetPosition)
    if not battleState or not attacker or not moveData then
        return MoveTargeting.ValidationResult.INVALID_TARGET, "Missing required parameters"
    end
    
    local targetingType, targetingInfo = MoveTargeting.getMoveTargetingType(moveData)
    local formatInfo = PositionalMechanics.getBattleFormatInfo(battleState)
    
    -- Check format requirements
    if targetingInfo.requiresDoublesFormat and formatInfo.format ~= PositionalMechanics.BattleFormat.DOUBLE then
        return MoveTargeting.ValidationResult.INVALID_FORMAT, "Move requires double battle format"
    end
    
    -- Validate based on targeting type
    if targetingType == MoveTargeting.TargetingType.SELF then
        -- Self-targeting moves don't need target validation
        return MoveTargeting.ValidationResult.VALID, "Self-targeting move"
    
    elseif targetingType == MoveTargeting.TargetingType.ALL_OPPONENTS or 
           targetingType == MoveTargeting.TargetingType.ALL_ALLIES or 
           targetingType == MoveTargeting.TargetingType.ALL_POKEMON then
        -- Multi-target moves don't need specific target validation
        local availableTargets = MoveTargeting.getAvailableTargets(battleState, attacker, targetingType)
        if #availableTargets == 0 then
            return MoveTargeting.ValidationResult.NO_VALID_TARGETS, "No valid targets available"
        end
        return MoveTargeting.ValidationResult.VALID, "Multi-target move with available targets"
    
    elseif targetingType == MoveTargeting.TargetingType.SINGLE_OPPONENT then
        -- Single opponent targeting
        if not targetPokemon then
            return MoveTargeting.ValidationResult.INVALID_TARGET, "Target Pokemon required"
        end
        
        local validOpponents = MoveTargeting.getAvailableTargets(battleState, attacker, targetingType)
        for _, target in ipairs(validOpponents) do
            if target.pokemon.id == targetPokemon.id then
                return MoveTargeting.ValidationResult.VALID, "Valid opponent target"
            end
        end
        
        return MoveTargeting.ValidationResult.INVALID_TARGET, "Pokemon is not a valid opponent target"
    
    elseif targetingType == MoveTargeting.TargetingType.SINGLE_ALLY then
        -- Single ally targeting (doubles only)
        if not targetPokemon then
            return MoveTargeting.ValidationResult.INVALID_TARGET, "Target ally required"
        end
        
        if formatInfo.format ~= PositionalMechanics.BattleFormat.DOUBLE then
            return MoveTargeting.ValidationResult.ALLY_TARGETING_BLOCKED, "Ally targeting only available in double battles"
        end
        
        local validAllies = MoveTargeting.getAvailableTargets(battleState, attacker, targetingType)
        for _, target in ipairs(validAllies) do
            if target.pokemon.id == targetPokemon.id then
                return MoveTargeting.ValidationResult.VALID, "Valid ally target"
            end
        end
        
        return MoveTargeting.ValidationResult.INVALID_TARGET, "Pokemon is not a valid ally target"
    
    elseif targetingType == MoveTargeting.TargetingType.POSITION_DEPENDENT then
        -- Position-dependent moves need position validation
        if formatInfo.format ~= PositionalMechanics.BattleFormat.DOUBLE then
            return MoveTargeting.ValidationResult.INVALID_FORMAT, "Position-dependent move requires double battle"
        end
        
        if not targetPosition then
            return MoveTargeting.ValidationResult.POSITION_REQUIRED, "Target position required for position-dependent move"
        end
        
        -- Validate position exists and has a Pokemon
        local opponentSide = attacker.battleData.side == "player" and "enemy" or "player"
        local targetPokemonAtPosition = PositionalMechanics.getPokemonAtPosition(battleState, opponentSide, targetPosition)
        
        if not targetPokemonAtPosition or targetPokemonAtPosition.fainted then
            return MoveTargeting.ValidationResult.NO_VALID_TARGETS, "No Pokemon at target position"
        end
        
        return MoveTargeting.ValidationResult.VALID, "Valid position-dependent target"
    
    elseif targetingType == MoveTargeting.TargetingType.SPREAD then
        -- Spread moves target multiple Pokemon with damage reduction
        local availableTargets = MoveTargeting.getAvailableTargets(battleState, attacker, targetingType)
        if #availableTargets == 0 then
            return MoveTargeting.ValidationResult.NO_VALID_TARGETS, "No valid spread targets available"
        end
        return MoveTargeting.ValidationResult.VALID, "Valid spread move targets"
    end
    
    return MoveTargeting.ValidationResult.INVALID_TARGET, "Unknown targeting type"
end

-- Get all available targets for a move
-- @param battleState: Current battle state  
-- @param attacker: Pokemon using the move
-- @param targetingType: Type of targeting
-- @return: Array of available target objects
function MoveTargeting.getAvailableTargets(battleState, attacker, targetingType)
    if not battleState or not attacker then
        return {}
    end
    
    local availableTargets = {}
    local formatInfo = PositionalMechanics.getBattleFormatInfo(battleState)
    local attackerSide = attacker.battleData and attacker.battleData.side or "player"
    local opponentSide = attackerSide == "player" and "enemy" or "player"
    
    if targetingType == MoveTargeting.TargetingType.SELF then
        table.insert(availableTargets, {
            pokemon = attacker,
            position = attacker.battleData and attacker.battleData.position or 1,
            side = attackerSide,
            relationship = "self"
        })
    
    elseif targetingType == MoveTargeting.TargetingType.SINGLE_OPPONENT or 
           targetingType == MoveTargeting.TargetingType.ALL_OPPONENTS or
           targetingType == MoveTargeting.TargetingType.SPREAD then
        -- Get opponent targets
        for position = 1, formatInfo.max_active_per_side do
            local opponent = PositionalMechanics.getPokemonAtPosition(battleState, opponentSide, position)
            if opponent and not opponent.fainted then
                table.insert(availableTargets, {
                    pokemon = opponent,
                    position = position,
                    side = opponentSide,
                    relationship = "opponent"
                })
            end
        end
    
    elseif targetingType == MoveTargeting.TargetingType.SINGLE_ALLY or 
           targetingType == MoveTargeting.TargetingType.ALL_ALLIES then
        -- Get ally targets (excluding self)
        for position = 1, formatInfo.max_active_per_side do
            local ally = PositionalMechanics.getPokemonAtPosition(battleState, attackerSide, position)
            if ally and ally.id ~= attacker.id and not ally.fainted then
                table.insert(availableTargets, {
                    pokemon = ally,
                    position = position,
                    side = attackerSide,
                    relationship = "ally"
                })
            end
        end
    
    elseif targetingType == MoveTargeting.TargetingType.ALL_POKEMON then
        -- Get all Pokemon (allies and opponents)
        -- Add opponents
        for position = 1, formatInfo.max_active_per_side do
            local opponent = PositionalMechanics.getPokemonAtPosition(battleState, opponentSide, position)
            if opponent and not opponent.fainted then
                table.insert(availableTargets, {
                    pokemon = opponent,
                    position = position,
                    side = opponentSide,
                    relationship = "opponent"
                })
            end
        end
        
        -- Add allies (including self)
        for position = 1, formatInfo.max_active_per_side do
            local ally = PositionalMechanics.getPokemonAtPosition(battleState, attackerSide, position)
            if ally and not ally.fainted then
                table.insert(availableTargets, {
                    pokemon = ally,
                    position = position,
                    side = attackerSide,
                    relationship = ally.id == attacker.id and "self" or "ally"
                })
            end
        end
    
    elseif targetingType == MoveTargeting.TargetingType.POSITION_DEPENDENT then
        -- Position-dependent moves target specific positions
        for position = 1, formatInfo.max_active_per_side do
            local opponent = PositionalMechanics.getPokemonAtPosition(battleState, opponentSide, position)
            if opponent and not opponent.fainted then
                table.insert(availableTargets, {
                    pokemon = opponent,
                    position = position,
                    side = opponentSide,
                    relationship = "opponent",
                    position_specific = true
                })
            end
        end
    end
    
    return availableTargets
end

-- Resolve move targets for execution
-- @param battleState: Current battle state
-- @param attacker: Pokemon using the move
-- @param moveData: Move being used
-- @param targetPokemon: Primary target (optional)
-- @param targetPosition: Target position (optional)
-- @return: Array of resolved targets for move execution
function MoveTargeting.resolveTargets(battleState, attacker, moveData, targetPokemon, targetPosition)
    if not battleState or not attacker or not moveData then
        return {}
    end
    
    local targetingType, targetingInfo = MoveTargeting.getMoveTargetingType(moveData)
    local resolvedTargets = {}
    
    -- Validate targeting first
    local validation, message = MoveTargeting.validateMoveTargeting(battleState, attacker, moveData, targetPokemon, targetPosition)
    if validation ~= MoveTargeting.ValidationResult.VALID then
        return {} -- Invalid targeting returns no targets
    end
    
    if targetingType == MoveTargeting.TargetingType.SELF then
        table.insert(resolvedTargets, {
            pokemon = attacker,
            damageMultiplier = 1.0,
            targetType = "self"
        })
    
    elseif targetingType == MoveTargeting.TargetingType.SINGLE_OPPONENT then
        if targetPokemon then
            table.insert(resolvedTargets, {
                pokemon = targetPokemon,
                damageMultiplier = 1.0,
                targetType = "opponent"
            })
        end
    
    elseif targetingType == MoveTargeting.TargetingType.SINGLE_ALLY then
        if targetPokemon then
            table.insert(resolvedTargets, {
                pokemon = targetPokemon,
                damageMultiplier = 1.0,
                targetType = "ally"
            })
        end
    
    elseif targetingType == MoveTargeting.TargetingType.ALL_OPPONENTS or 
           targetingType == MoveTargeting.TargetingType.ALL_ALLIES or 
           targetingType == MoveTargeting.TargetingType.ALL_POKEMON then
        -- Multi-target moves
        local availableTargets = MoveTargeting.getAvailableTargets(battleState, attacker, targetingType)
        for _, target in ipairs(availableTargets) do
            table.insert(resolvedTargets, {
                pokemon = target.pokemon,
                damageMultiplier = 1.0,
                targetType = target.relationship
            })
        end
    
    elseif targetingType == MoveTargeting.TargetingType.SPREAD then
        -- Spread moves with damage reduction
        local availableTargets = MoveTargeting.getAvailableTargets(battleState, attacker, targetingType)
        local damageReduction = targetingInfo.damageReduction or 0.75
        
        for _, target in ipairs(availableTargets) do
            table.insert(resolvedTargets, {
                pokemon = target.pokemon,
                damageMultiplier = damageReduction, -- Reduced damage for spread moves
                targetType = target.relationship,
                isSpreadTarget = true
            })
        end
    
    elseif targetingType == MoveTargeting.TargetingType.POSITION_DEPENDENT then
        -- Position-dependent targeting
        if targetPosition then
            local opponentSide = attacker.battleData.side == "player" and "enemy" or "player"
            local targetPokemonAtPosition = PositionalMechanics.getPokemonAtPosition(battleState, opponentSide, targetPosition)
            
            if targetPokemonAtPosition then
                table.insert(resolvedTargets, {
                    pokemon = targetPokemonAtPosition,
                    damageMultiplier = 1.0,
                    targetType = "opponent",
                    targetPosition = targetPosition
                })
            end
        end
    end
    
    return resolvedTargets
end

-- Get targeting summary for UI display
-- @param battleState: Current battle state
-- @param attacker: Pokemon using the move
-- @param moveData: Move being used
-- @return: Targeting summary information
function MoveTargeting.getTargetingSummary(battleState, attacker, moveData)
    if not battleState or not attacker or not moveData then
        return {
            targeting_type = "unknown",
            available_targets = 0,
            requires_selection = false
        }
    end
    
    local targetingType, targetingInfo = MoveTargeting.getMoveTargetingType(moveData)
    local availableTargets = MoveTargeting.getAvailableTargets(battleState, attacker, targetingType)
    
    local summary = {
        targeting_type = targetingType,
        available_targets = #availableTargets,
        requires_selection = targetingInfo.requiresTarget and 
                            (targetingType == MoveTargeting.TargetingType.SINGLE_OPPONENT or
                             targetingType == MoveTargeting.TargetingType.SINGLE_ALLY or
                             targetingType == MoveTargeting.TargetingType.POSITION_DEPENDENT),
        format_requirements = targetingInfo.requiresDoublesFormat and "doubles" or "any",
        can_target_allies = targetingInfo.allowsAllies,
        can_target_opponents = targetingInfo.allowsOpponents,
        targets = availableTargets
    }
    
    return summary
end

-- Check if move can target specific Pokemon
-- @param battleState: Current battle state
-- @param attacker: Pokemon using the move
-- @param moveData: Move being used
-- @param targetPokemon: Pokemon to check as target
-- @return: Boolean indicating if targeting is allowed
function MoveTargeting.canTargetPokemon(battleState, attacker, moveData, targetPokemon)
    if not battleState or not attacker or not moveData or not targetPokemon then
        return false
    end
    
    local validation, _ = MoveTargeting.validateMoveTargeting(battleState, attacker, moveData, targetPokemon)
    return validation == MoveTargeting.ValidationResult.VALID
end

-- Get position-specific targeting information for doubles
-- @param battleState: Current battle state
-- @param attacker: Pokemon using the move
-- @return: Position targeting details
function MoveTargeting.getPositionTargetingInfo(battleState, attacker)
    if not battleState or not attacker then
        return {}
    end
    
    local formatInfo = PositionalMechanics.getBattleFormatInfo(battleState)
    
    if formatInfo.format ~= PositionalMechanics.BattleFormat.DOUBLE then
        return {
            supports_position_targeting = false,
            available_positions = {}
        }
    end
    
    local attackerSide = attacker.battleData and attacker.battleData.side or "player"
    local opponentSide = attackerSide == "player" and "enemy" or "player"
    
    local positionInfo = {
        supports_position_targeting = true,
        available_positions = {},
        ally_positions = {},
        opponent_positions = {}
    }
    
    -- Get opponent position info
    for position = 1, formatInfo.max_active_per_side do
        local opponent = PositionalMechanics.getPokemonAtPosition(battleState, opponentSide, position)
        local positionData = {
            position = position,
            occupied = opponent ~= nil,
            pokemon = opponent,
            fainted = opponent and opponent.fainted or false
        }
        
        table.insert(positionInfo.opponent_positions, positionData)
        if opponent and not opponent.fainted then
            table.insert(positionInfo.available_positions, {
                position = position,
                side = opponentSide,
                pokemon = opponent,
                relationship = "opponent"
            })
        end
    end
    
    -- Get ally position info
    for position = 1, formatInfo.max_active_per_side do
        local ally = PositionalMechanics.getPokemonAtPosition(battleState, attackerSide, position)
        local positionData = {
            position = position,
            occupied = ally ~= nil,
            pokemon = ally,
            fainted = ally and ally.fainted or false,
            is_self = ally and ally.id == attacker.id or false
        }
        
        table.insert(positionInfo.ally_positions, positionData)
        if ally and ally.id ~= attacker.id and not ally.fainted then
            table.insert(positionInfo.available_positions, {
                position = position,
                side = attackerSide,
                pokemon = ally,
                relationship = "ally"
            })
        end
    end
    
    return positionInfo
end

return MoveTargeting