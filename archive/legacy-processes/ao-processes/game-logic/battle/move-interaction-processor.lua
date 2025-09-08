local MoveInteractionProcessor = {}

local AbilityInteractions = require('game-logic.battle.ability-interactions')
local TypeImmunitySystem = require('game-logic.battle.type-immunity-system')
local ItemInteractions = require('game-logic.battle.item-interactions')
local ProtectionSystem = require('game-logic.battle.protection-system')
local ReflectionSystem = require('game-logic.battle.reflection-system')
local MoveCopying = require('game-logic.battle.move-copying')
local MovePrevention = require('game-logic.battle.move-prevention')
local SubstituteSystem = require('game-logic.battle.substitute-system')
local MoveDatabase = require('data.moves.move-database')
local Enums = require('data.constants.enums')

local INTERACTION_PRIORITY = {
    TYPE_IMMUNITY = 1,
    ABILITY_INTERACTIONS = 2,
    MOVE_PREVENTION = 3,
    REFLECTION = 4,
    PROTECTION = 5,
    SUBSTITUTE = 6,
    ITEM_INTERACTIONS = 7
}

function MoveInteractionProcessor.processMove(user, target, moveData, battleState, context)
    if not user or not target or not moveData or not battleState then
        return { success = false, error = "Invalid parameters" }
    end
    
    context = context or {}
    local results = {
        success = true,
        moveBlocked = false,
        moveReflected = false,
        moveRedirected = false,
        damageBlocked = false,
        interactions = {},
        finalTarget = target,
        finalUser = user,
        finalMove = moveData
    }
    
    local currentMove = moveData
    local currentUser = user
    local currentTarget = target
    
    local priorityOrder = {
        INTERACTION_PRIORITY.TYPE_IMMUNITY,
        INTERACTION_PRIORITY.ABILITY_INTERACTIONS,
        INTERACTION_PRIORITY.MOVE_PREVENTION,
        INTERACTION_PRIORITY.REFLECTION,
        INTERACTION_PRIORITY.PROTECTION,
        INTERACTION_PRIORITY.SUBSTITUTE,
        INTERACTION_PRIORITY.ITEM_INTERACTIONS
    }
    
    for _, priority in ipairs(priorityOrder) do
        local interactionResult = nil
        
        if priority == INTERACTION_PRIORITY.TYPE_IMMUNITY then
            interactionResult = MoveInteractionProcessor.processTypeImmunity(currentMove, currentTarget, battleState)
            
        elseif priority == INTERACTION_PRIORITY.ABILITY_INTERACTIONS then
            interactionResult = MoveInteractionProcessor.processAbilityInteractions(currentMove, currentUser, currentTarget, battleState)
            
        elseif priority == INTERACTION_PRIORITY.MOVE_PREVENTION then
            interactionResult = MoveInteractionProcessor.processMovePrevention(currentUser, currentMove.id, battleState)
            
        elseif priority == INTERACTION_PRIORITY.REFLECTION then
            interactionResult = MoveInteractionProcessor.processReflection(currentMove, currentTarget, currentUser, battleState)
            
        elseif priority == INTERACTION_PRIORITY.PROTECTION then
            interactionResult = MoveInteractionProcessor.processProtection(currentMove, currentUser, currentTarget, battleState)
            
        elseif priority == INTERACTION_PRIORITY.SUBSTITUTE then
            interactionResult = MoveInteractionProcessor.processSubstitute(currentTarget, currentMove, battleState)
            
        elseif priority == INTERACTION_PRIORITY.ITEM_INTERACTIONS then
            interactionResult = MoveInteractionProcessor.processItemInteractions(currentMove, currentUser, currentTarget, battleState)
        end
        
        if interactionResult then
            table.insert(results.interactions, interactionResult)
            
            if interactionResult.blocked then
                results.moveBlocked = true
                results.blockReason = interactionResult.reason
                return results
            end
            
            if interactionResult.redirected and interactionResult.newTarget then
                currentTarget = interactionResult.newTarget
                results.moveRedirected = true
            end
            
            if interactionResult.reflected then
                currentUser = interactionResult.newUser or currentUser
                currentTarget = interactionResult.newTarget or currentTarget
                currentMove = interactionResult.newMove or currentMove
                results.moveReflected = true
            end
        end
    end
    
    results.finalTarget = currentTarget
    results.finalUser = currentUser
    results.finalMove = currentMove
    
    return results
end

function MoveInteractionProcessor.processTypeImmunity(moveData, target, battleState)
    local immunityResult = TypeImmunitySystem.checkTypeImmunity(moveData, target, battleState)
    
    if immunityResult.immune then
        return {
            type = "type_immunity",
            blocked = true,
            reason = immunityResult.reason,
            message = immunityResult.message
        }
    end
    
    return nil
end

function MoveInteractionProcessor.processAbilityInteractions(moveData, user, target, battleState)
    local abilityResult = AbilityInteractions.processAbilityInteraction(moveData, user, target, battleState)
    
    if abilityResult.redirected then
        return {
            type = "ability_interaction",
            redirected = true,
            newTarget = abilityResult.newTarget,
            reason = abilityResult.reason,
            message = abilityResult.message
        }
    elseif abilityResult.absorbed then
        return {
            type = "ability_interaction",
            blocked = true,
            reason = "absorbed",
            message = abilityResult.message
        }
    elseif abilityResult.immune then
        return {
            type = "ability_interaction",
            blocked = true,
            reason = "ability_immunity",
            message = abilityResult.message
        }
    end
    
    return nil
end

function MoveInteractionProcessor.processMovePrevention(user, moveId, battleState)
    local preventionResult = MovePrevention.checkMoveRestrictions(user, moveId, battleState)
    
    if not preventionResult.allowed then
        return {
            type = "move_prevention",
            blocked = true,
            reason = preventionResult.reason,
            message = preventionResult.message
        }
    end
    
    return nil
end

function MoveInteractionProcessor.processReflection(moveData, target, user, battleState)
    local reflectionResult = ReflectionSystem.checkForReflection(moveData, target, user, battleState)
    
    if reflectionResult.blocked then
        return {
            type = "reflection",
            blocked = true,
            reason = reflectionResult.reason,
            message = "The move was blocked by reflection prevention!"
        }
    elseif reflectionResult.reflected then
        local newMove, newTarget, newUser = ReflectionSystem.processReflection(reflectionResult, moveData, battleState)
        return {
            type = "reflection",
            reflected = true,
            newMove = newMove,
            newTarget = newTarget,
            newUser = newUser,
            reflectionType = reflectionResult.reflectionType,
            message = "The move was reflected!"
        }
    end
    
    return nil
end

function MoveInteractionProcessor.processProtection(moveData, user, target, battleState)
    local protectionResult = ProtectionSystem.checkProtection(moveData, user, target, battleState)
    
    if protectionResult.protected then
        return {
            type = "protection",
            blocked = true,
            reason = "protected",
            protectionType = protectionResult.protectionType,
            message = protectionResult.message
        }
    end
    
    return nil
end

function MoveInteractionProcessor.processSubstitute(target, moveData, battleState)
    local substituteResult = SubstituteSystem.checkSubstituteInteraction(target, moveData, battleState)
    
    if substituteResult.hasSubstitute and substituteResult.blocks then
        if substituteResult.reason == "status_blocked" then
            return {
                type = "substitute",
                blocked = true,
                reason = "status_blocked_by_substitute",
                message = substituteResult.message
            }
        end
    end
    
    return nil
end

function MoveInteractionProcessor.processItemInteractions(moveData, user, target, battleState)
    local itemResult = ItemInteractions.processItemInteraction(moveData, user, target, battleState)
    
    if itemResult.blocked then
        return {
            type = "item_interaction",
            blocked = true,
            reason = itemResult.reason,
            message = itemResult.message
        }
    elseif itemResult.modified then
        return {
            type = "item_interaction",
            modified = true,
            modifiedMove = itemResult.modifiedMove,
            message = itemResult.message
        }
    end
    
    return nil
end

function MoveInteractionProcessor.processCopyMove(copyMoveId, user, battleState, currentTurn)
    local copyResult = MoveCopying.processCopyMove(copyMoveId, user, battleState, currentTurn)
    
    if copyResult.success and copyResult.copiedMove then
        local copyInteractionResult = MoveInteractionProcessor.processMove(
            user, 
            user,
            copyResult.copiedMove, 
            battleState, 
            { isCopiedMove = true }
        )
        
        copyInteractionResult.copiedMove = copyResult.copiedMove
        copyInteractionResult.copyMessage = copyResult.message
        
        return copyInteractionResult
    end
    
    return { 
        success = false, 
        reason = copyResult.reason or "copy_failed",
        message = "The move copying failed!"
    }
end

function MoveInteractionProcessor.updatePostMoveState(user, moveId, battleState)
    if not user or not moveId or not battleState then return end
    
    MovePrevention.updateMoveUsage(user, moveId, battleState)
    
    if not battleState.moveHistory then
        battleState.moveHistory = {}
    end
    
    local moveData = MoveDatabase.getMoveData(moveId)
    table.insert(battleState.moveHistory, {
        user = user,
        moveData = moveData,
        turn = battleState.turn or 1
    })
end

function MoveInteractionProcessor.updateTurnEndStates(battleState)
    if not battleState then return end
    
    MovePrevention.updateRestrictionStates(battleState)
    ProtectionSystem.updateProtectionStates(battleState)
    ReflectionSystem.updateReflectionStates(battleState)
end

function MoveInteractionProcessor.init(battleState)
    if not battleState then
        return { success = false, error = "Battle state required" }
    end
    
    local initResults = {}
    
    local components = {
        { name = "AbilityInteractions", component = AbilityInteractions },
        { name = "TypeImmunitySystem", component = TypeImmunitySystem },
        { name = "ItemInteractions", component = ItemInteractions },
        { name = "ProtectionSystem", component = ProtectionSystem },
        { name = "ReflectionSystem", component = ReflectionSystem },
        { name = "MoveCopying", component = MoveCopying },
        { name = "MovePrevention", component = MovePrevention },
        { name = "SubstituteSystem", component = SubstituteSystem }
    }
    
    for _, comp in ipairs(components) do
        if comp.component.init then
            local result = comp.component.init(battleState)
            initResults[comp.name] = result
            if not result.success then
                return { success = false, error = "Failed to initialize " .. comp.name }
            end
        end
    end
    
    return { success = true, componentResults = initResults }
end

return MoveInteractionProcessor