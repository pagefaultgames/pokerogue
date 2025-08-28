local MovePrevention = {}

local MoveDatabase = require('data.moves.move-database')
local Enums = require('data.constants.enums')
local BattleRNG = require('game-logic.rng.battle-rng')

local function isStatusMove(moveData)
    return moveData and moveData.category == Enums.MoveCategory.STATUS
end

function MovePrevention.applyTaunt(pokemon, battleState, duration)
    if not pokemon or not battleState then
        return { success = false, error = "Invalid parameters" }
    end
    
    duration = duration or 3
    
    if not battleState.moveRestrictions then
        battleState.moveRestrictions = {}
    end
    
    local tauntKey = pokemon.battleId .. '_taunt'
    battleState.moveRestrictions[tauntKey] = {
        type = 'taunt',
        pokemon = pokemon.battleId,
        turnsRemaining = duration,
        active = true
    }
    
    return { 
        success = true, 
        message = pokemon.name .. " fell for the taunt!"
    }
end

function MovePrevention.applyTorment(pokemon, battleState)
    if not pokemon or not battleState then
        return { success = false, error = "Invalid parameters" }
    end
    
    if not battleState.moveRestrictions then
        battleState.moveRestrictions = {}
    end
    
    local tormentKey = pokemon.battleId .. '_torment'
    battleState.moveRestrictions[tormentKey] = {
        type = 'torment',
        pokemon = pokemon.battleId,
        active = true,
        lastUsedMove = nil
    }
    
    return { 
        success = true, 
        message = pokemon.name .. " was subjected to torment!"
    }
end

function MovePrevention.applyEncore(pokemon, lastUsedMove, battleState, duration)
    if not pokemon or not lastUsedMove or not battleState then
        return { success = false, error = "Invalid parameters" }
    end
    
    duration = duration or 3
    
    if not battleState.moveRestrictions then
        battleState.moveRestrictions = {}
    end
    
    local encoreKey = pokemon.battleId .. '_encore'
    battleState.moveRestrictions[encoreKey] = {
        type = 'encore',
        pokemon = pokemon.battleId,
        turnsRemaining = duration,
        active = true,
        encoreMove = lastUsedMove.id
    }
    
    return { 
        success = true, 
        message = pokemon.name .. " received an encore!"
    }
end

function MovePrevention.applyImprison(user, battleState)
    if not user or not battleState then
        return { success = false, error = "Invalid parameters" }
    end
    
    if not user.moves then
        return { success = false, error = "User has no moves" }
    end
    
    if not battleState.moveRestrictions then
        battleState.moveRestrictions = {}
    end
    
    local imprisonKey = user.battleId .. '_imprison'
    local imprisonedMoves = {}
    
    for _, move in ipairs(user.moves) do
        table.insert(imprisonedMoves, move.id)
    end
    
    battleState.moveRestrictions[imprisonKey] = {
        type = 'imprison',
        user = user.battleId,
        active = true,
        imprisonedMoves = imprisonedMoves
    }
    
    return { 
        success = true, 
        message = user.name .. " sealed the opponent's move(s)!"
    }
end

function MovePrevention.applyDisable(target, targetMoveId, battleState, duration)
    if not target or not targetMoveId or not battleState then
        return { success = false, error = "Invalid parameters" }
    end
    
    local targetMove = nil
    if target.moves then
        for _, move in ipairs(target.moves) do
            if move.id == targetMoveId then
                targetMove = move
                break
            end
        end
    end
    
    if not targetMove then
        return { success = false, error = "Target doesn't know the move" }
    end
    
    duration = duration or 4
    
    if not battleState.moveRestrictions then
        battleState.moveRestrictions = {}
    end
    
    local disableKey = target.battleId .. '_disable'
    battleState.moveRestrictions[disableKey] = {
        type = 'disable',
        pokemon = target.battleId,
        turnsRemaining = duration,
        active = true,
        disabledMove = targetMoveId
    }
    
    return { 
        success = true, 
        message = target.name .. "'s " .. targetMove.name .. " was disabled!"
    }
end

function MovePrevention.checkMoveRestrictions(pokemon, moveId, battleState)
    if not pokemon or not moveId or not battleState or not battleState.moveRestrictions then
        return { allowed = true }
    end
    
    local moveData = MoveDatabase.getMoveData(moveId)
    if not moveData then
        return { allowed = false, reason = "invalid_move" }
    end
    
    for key, restriction in pairs(battleState.moveRestrictions) do
        if restriction.active and restriction.pokemon == pokemon.battleId then
            if restriction.type == 'taunt' then
                if isStatusMove(moveData) then
                    return { 
                        allowed = false, 
                        reason = "taunted", 
                        message = pokemon.name .. " can't use " .. moveData.name .. " after the taunt!"
                    }
                end
            elseif restriction.type == 'torment' then
                if restriction.lastUsedMove == moveId then
                    return { 
                        allowed = false, 
                        reason = "tormented", 
                        message = pokemon.name .. " can't use the same move twice due to torment!"
                    }
                end
            elseif restriction.type == 'encore' then
                if restriction.encoreMove ~= moveId then
                    return { 
                        allowed = false, 
                        reason = "encored", 
                        message = pokemon.name .. " must use the same move due to encore!"
                    }
                end
            elseif restriction.type == 'disable' then
                if restriction.disabledMove == moveId then
                    return { 
                        allowed = false, 
                        reason = "disabled", 
                        message = pokemon.name .. " can't use the disabled move!"
                    }
                end
            end
        elseif restriction.type == 'imprison' and restriction.active then
            if restriction.imprisonedMoves then
                for _, imprisonedMoveId in ipairs(restriction.imprisonedMoves) do
                    if imprisonedMoveId == moveId then
                        return { 
                            allowed = false, 
                            reason = "imprisoned", 
                            message = pokemon.name .. " can't use the imprisoned move!"
                        }
                    end
                end
            end
        end
    end
    
    return { allowed = true }
end

function MovePrevention.updateMoveUsage(pokemon, moveId, battleState)
    if not pokemon or not moveId or not battleState or not battleState.moveRestrictions then
        return
    end
    
    for key, restriction in pairs(battleState.moveRestrictions) do
        if restriction.active and restriction.pokemon == pokemon.battleId and restriction.type == 'torment' then
            restriction.lastUsedMove = moveId
        end
    end
end

function MovePrevention.updateRestrictionStates(battleState)
    if not battleState or not battleState.moveRestrictions then return end
    
    for key, restriction in pairs(battleState.moveRestrictions) do
        if restriction.active then
            if restriction.turnsRemaining then
                restriction.turnsRemaining = restriction.turnsRemaining - 1
                if restriction.turnsRemaining <= 0 then
                    restriction.active = false
                end
            end
        end
    end
end

function MovePrevention.clearRestriction(pokemon, restrictionType, battleState)
    if not pokemon or not restrictionType or not battleState or not battleState.moveRestrictions then
        return { success = false, error = "Invalid parameters" }
    end
    
    local restrictionKey = pokemon.battleId .. '_' .. restrictionType
    if battleState.moveRestrictions[restrictionKey] then
        battleState.moveRestrictions[restrictionKey].active = false
        return { success = true, message = "Restriction cleared" }
    end
    
    return { success = false, reason = "restriction_not_found" }
end

function MovePrevention.init(battleState)
    if not battleState then
        return { success = false, error = "Battle state required" }
    end
    
    if not battleState.moveRestrictions then
        battleState.moveRestrictions = {}
    end
    
    return { success = true }
end

return MovePrevention