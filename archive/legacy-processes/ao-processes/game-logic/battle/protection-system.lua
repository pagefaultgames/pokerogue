-- Move Protection System
-- Handles protection moves like Protect, Detect, Wide Guard, and Quick Guard
-- Provides success rate calculation, consecutive use penalties, and bypass mechanics

local ProtectionSystem = {}

-- Load dependencies
local Enums = require("data.constants.enums")
local BattleRNG = require("game-logic.rng.battle-rng")

-- Protection types
ProtectionSystem.ProtectionType = {
    SINGLE_TARGET = "SINGLE_TARGET",     -- Protect, Detect
    WIDE_PROTECTION = "WIDE_PROTECTION", -- Wide Guard
    PRIORITY_PROTECTION = "PRIORITY_PROTECTION", -- Quick Guard
    CONTACT_PROTECTION = "CONTACT_PROTECTION", -- Spiky Shield, Baneful Bunker
    TEAM_PROTECTION = "TEAM_PROTECTION"  -- Mat Block, Crafty Shield
}

-- Protection move data
-- Maps move IDs to their protection effects
ProtectionSystem.protectionMoves = {
    [Enums.MoveId.PROTECT] = {
        type = ProtectionSystem.ProtectionType.SINGLE_TARGET,
        baseSuccessRate = 1.0, -- 100% base success
        protects = {
            damaging = true,
            status = true,
            multiTarget = false
        },
        priority = 4,
        message = "{user} protected itself!"
    },
    
    [Enums.MoveId.DETECT] = {
        type = ProtectionSystem.ProtectionType.SINGLE_TARGET,
        baseSuccessRate = 1.0,
        protects = {
            damaging = true,
            status = true,
            multiTarget = false
        },
        priority = 4,
        message = "{user} protected itself!"
    },
    
    -- Wide Guard protects team from multi-target moves
    [509] = { -- WIDE_GUARD placeholder
        type = ProtectionSystem.ProtectionType.WIDE_PROTECTION,
        baseSuccessRate = 1.0,
        protects = {
            damaging = true,
            status = true,
            multiTarget = true, -- Only protects from multi-target moves
            teamwide = true
        },
        priority = 3,
        message = "Wide Guard protected the team!"
    },
    
    -- Quick Guard protects team from priority moves
    [510] = { -- QUICK_GUARD placeholder
        type = ProtectionSystem.ProtectionType.PRIORITY_PROTECTION,
        baseSuccessRate = 1.0,
        protects = {
            damaging = true,
            status = false,
            priorityOnly = true, -- Only protects from priority moves
            teamwide = true
        },
        priority = 3,
        message = "Quick Guard protected the team!"
    },
    
    -- Spiky Shield damages contact moves
    [596] = { -- SPIKY_SHIELD placeholder
        type = ProtectionSystem.ProtectionType.CONTACT_PROTECTION,
        baseSuccessRate = 1.0,
        protects = {
            damaging = true,
            status = true,
            multiTarget = false
        },
        priority = 4,
        contactDamage = "1/8", -- Damage attacker for 1/8 max HP
        message = "{user} protected itself with spikes!"
    },
    
    -- Baneful Bunker poisons contact moves
    [661] = { -- BANEFUL_BUNKER placeholder
        type = ProtectionSystem.ProtectionType.CONTACT_PROTECTION,
        baseSuccessRate = 1.0,
        protects = {
            damaging = true,
            status = true,
            multiTarget = false
        },
        priority = 4,
        contactEffect = "poison",
        message = "{user} protected itself with poison!"
    }
}

-- Moves that bypass protection
ProtectionSystem.bypassMoves = {
    [185] = true, -- FEINT placeholder
    [467] = true, -- SHADOW_FORCE placeholder
    [553] = true, -- FREEZE_SHOCK placeholder (when charging)
    [291] = true, -- DIVE placeholder (when underwater)
    [340] = true, -- BOUNCE placeholder (when in air)
    [143] = true  -- SKY_ATTACK placeholder (when charging)
}

-- Check if move can be protected against
-- @param moveData: Move being used
-- @param protectionData: Protection move data
-- @return: Boolean indicating if move can be protected
function ProtectionSystem.canProtectAgainst(moveData, protectionData)
    -- Check if move is a bypass move
    if ProtectionSystem.bypassMoves[moveData.id] then
        return false
    end
    
    -- Check if protection covers this type of move
    if moveData.category == Enums.MoveCategory.STATUS and not protectionData.protects.status then
        return false
    end
    
    if (moveData.category == Enums.MoveCategory.PHYSICAL or moveData.category == Enums.MoveCategory.SPECIAL) 
       and not protectionData.protects.damaging then
        return false
    end
    
    -- Wide Guard only protects from multi-target moves
    if protectionData.protects.multiTarget and protectionData.type == ProtectionSystem.ProtectionType.WIDE_PROTECTION then
        -- Check if move targets multiple Pokemon
        local isMultiTarget = moveData.target == Enums.MoveTarget.ALL_OTHERS or
                             moveData.target == Enums.MoveTarget.ALL_NEAR_ENEMIES or
                             moveData.target == Enums.MoveTarget.ALL_ENEMIES or
                             moveData.target == Enums.MoveTarget.ALL
        if not isMultiTarget then
            return false
        end
    end
    
    -- Quick Guard only protects from priority moves
    if protectionData.protects.priorityOnly and protectionData.type == ProtectionSystem.ProtectionType.PRIORITY_PROTECTION then
        if not moveData.priority or moveData.priority <= 0 then
            return false
        end
    end
    
    return true
end

-- Calculate protection success rate
-- @param battleState: Current battle state
-- @param protectorId: Pokemon ID using protection
-- @param protectionData: Protection move data
-- @return: Success rate (0.0 to 1.0)
function ProtectionSystem.calculateSuccessRate(battleState, protectorId, protectionData)
    battleState.protectionHistory = battleState.protectionHistory or {}
    local history = battleState.protectionHistory[protectorId] or {consecutiveUses = 0}
    
    -- Base success rate
    local successRate = protectionData.baseSuccessRate
    
    -- Apply consecutive use penalty
    -- Success rate = 1 / (3^consecutiveUses)
    if history.consecutiveUses > 0 then
        successRate = successRate / (3 ^ history.consecutiveUses)
    end
    
    -- Minimum success rate of ~3.33%
    successRate = math.max(successRate, 1/30)
    
    return successRate
end

-- Process protection move usage
-- @param battleState: Current battle state
-- @param protector: Pokemon using protection
-- @param protectionMoveId: Move ID of protection move
-- @return: Protection result with success status and effects
function ProtectionSystem.useProtection(battleState, protector, protectionMoveId)
    local protectionData = ProtectionSystem.protectionMoves[protectionMoveId]
    if not protectionData then
        return {success = false, reason = "Unknown protection move"}
    end
    
    -- Calculate success rate
    local successRate = ProtectionSystem.calculateSuccessRate(battleState, protector.id, protectionData)
    
    -- Roll for success
    local roll = BattleRNG.randomFloat()
    local protectionSuccess = roll < successRate
    
    -- Update protection history
    battleState.protectionHistory = battleState.protectionHistory or {}
    battleState.protectionHistory[protector.id] = battleState.protectionHistory[protector.id] or {consecutiveUses = 0}
    
    if protectionSuccess then
        battleState.protectionHistory[protector.id].consecutiveUses = 
            battleState.protectionHistory[protector.id].consecutiveUses + 1
    else
        battleState.protectionHistory[protector.id].consecutiveUses = 0
    end
    
    -- Set up protection state
    local result = {
        success = protectionSuccess,
        protectorId = protector.id,
        protectionType = protectionData.type,
        protectionData = protectionData,
        message = protectionData.message:gsub("{user}", protector.name or "Pokemon"),
        failMessage = protectionSuccess and nil or (protector.name or "Pokemon") .. "'s protection failed!",
        successRate = successRate
    }
    
    if protectionSuccess then
        -- Set active protection
        battleState.activeProtections = battleState.activeProtections or {}
        battleState.activeProtections[protector.id] = {
            moveId = protectionMoveId,
            type = protectionData.type,
            data = protectionData,
            turnsRemaining = 1 -- Protection lasts for this turn
        }
        
        -- Team-wide protections
        if protectionData.protects.teamwide then
            battleState.teamProtections = battleState.teamProtections or {}
            battleState.teamProtections[protector.side or "player"] = {
                moveId = protectionMoveId,
                type = protectionData.type,
                data = protectionData,
                protectorId = protector.id
            }
        end
    end
    
    return result
end

-- Check if attack is blocked by protection
-- @param battleState: Current battle state
-- @param attacker: Pokemon using the move
-- @param target: Target Pokemon
-- @param moveData: Move being used
-- @return: Protection result with blocked status and effects
function ProtectionSystem.checkProtection(battleState, attacker, target, moveData)
    -- Check individual protection
    local activeProtections = battleState.activeProtections or {}
    local targetProtection = activeProtections[target.id]
    
    if targetProtection and ProtectionSystem.canProtectAgainst(moveData, targetProtection.data) then
        local result = {
            success = true,
            blocked = true,
            protectionType = targetProtection.type,
            message = target.name .. " protected itself!",
            protectorId = target.id
        }
        
        -- Handle contact-based protection effects
        if targetProtection.type == ProtectionSystem.ProtectionType.CONTACT_PROTECTION then
            if moveData.flags and (moveData.flags & Enums.MoveFlags.MAKES_CONTACT) ~= 0 then
                result.contactEffect = true
                
                if targetProtection.data.contactDamage then
                    result.contactDamage = {
                        target = attacker.id,
                        amount = targetProtection.data.contactDamage
                    }
                end
                
                if targetProtection.data.contactEffect then
                    result.contactStatus = {
                        target = attacker.id,
                        effect = targetProtection.data.contactEffect
                    }
                end
            end
        end
        
        return result
    end
    
    -- Check team-wide protection
    local teamProtections = battleState.teamProtections or {}
    local targetSide = target.side or "player"
    local teamProtection = teamProtections[targetSide]
    
    if teamProtection and ProtectionSystem.canProtectAgainst(moveData, teamProtection.data) then
        return {
            success = true,
            blocked = true,
            protectionType = teamProtection.type,
            message = teamProtection.data.message,
            protectorId = teamProtection.protectorId,
            teamProtection = true
        }
    end
    
    return {success = false, blocked = false}
end

-- Apply protection contact effects
-- @param battleState: Battle state to modify
-- @param protectionResult: Result from checkProtection with contact effects
-- @return: Updated battle state and effect messages
function ProtectionSystem.applyContactEffects(battleState, protectionResult)
    local messages = {}
    
    if not protectionResult.contactEffect then
        return battleState, messages
    end
    
    -- Apply contact damage
    if protectionResult.contactDamage then
        local targetId = protectionResult.contactDamage.target
        local damageAmount = protectionResult.contactDamage.amount
        
        for _, pokemon in pairs(battleState.activePokemon or {}) do
            if pokemon and pokemon.id == targetId then
                local maxHP = pokemon.maxHP or pokemon.stats[Enums.Stat.HP]
                local damage = 0
                
                if damageAmount == "1/8" then
                    damage = math.max(1, math.floor(maxHP / 8))
                elseif damageAmount == "1/16" then
                    damage = math.max(1, math.floor(maxHP / 16))
                end
                
                pokemon.currentHP = math.max(0, pokemon.currentHP - damage)
                table.insert(messages, pokemon.name .. " was hurt by the spikes!")
                break
            end
        end
    end
    
    -- Apply contact status effect
    if protectionResult.contactStatus then
        local targetId = protectionResult.contactStatus.target
        local statusEffect = protectionResult.contactStatus.effect
        
        for _, pokemon in pairs(battleState.activePokemon or {}) do
            if pokemon and pokemon.id == targetId then
                pokemon.statusConditions = pokemon.statusConditions or {}
                pokemon.statusConditions[statusEffect] = true
                
                if statusEffect == "poison" then
                    table.insert(messages, pokemon.name .. " was poisoned!")
                elseif statusEffect == "burn" then
                    table.insert(messages, pokemon.name .. " was burned!")
                end
                break
            end
        end
    end
    
    return battleState, messages
end

-- Clear protection history when Pokemon uses non-protection move
-- @param battleState: Battle state to modify
-- @param pokemonId: Pokemon ID that used a move
-- @param moveId: Move ID that was used
-- @return: Updated battle state
function ProtectionSystem.updateProtectionHistory(battleState, pokemonId, moveId)
    if not ProtectionSystem.protectionMoves[moveId] then
        -- Not a protection move, reset consecutive uses
        if battleState.protectionHistory and battleState.protectionHistory[pokemonId] then
            battleState.protectionHistory[pokemonId].consecutiveUses = 0
        end
    end
    
    return battleState
end

-- Clear active protections at end of turn
-- @param battleState: Battle state to modify
-- @return: Updated battle state
function ProtectionSystem.clearProtections(battleState)
    battleState.activeProtections = {}
    battleState.teamProtections = {}
    return battleState
end

-- Get protection status for Pokemon
-- @param battleState: Current battle state
-- @param pokemonId: Pokemon ID to check
-- @return: Protection status data or nil
function ProtectionSystem.getProtectionStatus(battleState, pokemonId)
    local activeProtections = battleState.activeProtections or {}
    return activeProtections[pokemonId]
end

-- Validate protection move data integrity
-- @return: Boolean indicating if all protection data is valid
function ProtectionSystem.validateProtectionData()
    for moveId, protection in pairs(ProtectionSystem.protectionMoves) do
        -- Check required fields
        if not protection.type or not protection.baseSuccessRate or not protection.protects then
            print("Warning: Invalid protection data for move " .. tostring(moveId))
            return false
        end
        
        -- Validate protection type
        local validType = false
        for _, validTypeValue in pairs(ProtectionSystem.ProtectionType) do
            if protection.type == validTypeValue then
                validType = true
                break
            end
        end
        
        if not validType then
            print("Warning: Invalid protection type for move " .. tostring(moveId) .. ": " .. tostring(protection.type))
            return false
        end
        
        -- Validate success rate
        if protection.baseSuccessRate < 0 or protection.baseSuccessRate > 1 then
            print("Warning: Invalid success rate for move " .. tostring(moveId) .. ": " .. tostring(protection.baseSuccessRate))
            return false
        end
    end
    
    return true
end

-- Initialize protection system
function ProtectionSystem.init()
    if not ProtectionSystem.validateProtectionData() then
        return false, "Invalid protection data"
    end
    
    print("Protection System initialized with " .. 
          #ProtectionSystem.protectionMoves .. " protection moves")
    return true
end

return ProtectionSystem