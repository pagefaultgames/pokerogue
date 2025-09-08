local MoveCopying = {}

local MoveDatabase = require('data.moves.move-database')
local Enums = require('data.constants.enums')
local BattleRNG = require('game-logic.rng.battle-rng')

local function isValidCopyTarget(moveData, copyingPokemon)
    if not moveData then return false end
    if moveData.flags and moveData.flags.uncopyable then return false end
    if moveData.id == Enums.Move.STRUGGLE then return false end
    if moveData.id == Enums.Move.MIRROR_MOVE then return false end
    if moveData.id == Enums.Move.COPYCAT then return false end
    if moveData.id == Enums.Move.ME_FIRST then return false end
    if moveData.id == Enums.Move.SKETCH then return false end
    
    return true
end

local function canLearnMove(pokemon, moveId)
    if not pokemon or not pokemon.species or not moveId then return false end
    if pokemon.moves then
        for _, move in ipairs(pokemon.moves) do
            if move.id == moveId then return false end
        end
    end
    return true
end

function MoveCopying.getMirrorMoveTarget(battleState, copyingPokemon)
    if not battleState or not battleState.moveHistory or not copyingPokemon then
        return nil
    end
    
    local lastMove = nil
    for i = #battleState.moveHistory, 1, -1 do
        local historyEntry = battleState.moveHistory[i]
        if historyEntry.user and historyEntry.user.battleId ~= copyingPokemon.battleId then
            if historyEntry.target and historyEntry.target.battleId == copyingPokemon.battleId then
                lastMove = historyEntry
                break
            end
        end
    end
    
    if lastMove and isValidCopyTarget(lastMove.moveData, copyingPokemon) then
        return {
            moveId = lastMove.moveData.id,
            originalUser = lastMove.user,
            success = true
        }
    end
    
    return { success = false, reason = "no_valid_move_to_mirror" }
end

function MoveCopying.getCopycatTarget(battleState, copyingPokemon)
    if not battleState or not battleState.moveHistory then
        return { success = false, reason = "no_move_history" }
    end
    
    if #battleState.moveHistory == 0 then
        return { success = false, reason = "no_moves_used" }
    end
    
    local lastEntry = battleState.moveHistory[#battleState.moveHistory]
    if lastEntry and lastEntry.moveData and isValidCopyTarget(lastEntry.moveData, copyingPokemon) then
        return {
            moveId = lastEntry.moveData.id,
            originalUser = lastEntry.user,
            success = true
        }
    end
    
    return { success = false, reason = "last_move_not_copyable" }
end

function MoveCopying.getMeFirstTarget(battleState, copyingPokemon, currentTurn)
    if not battleState or not currentTurn or not copyingPokemon then
        return { success = false, reason = "invalid_parameters" }
    end
    
    if not battleState.turnQueue or #battleState.turnQueue == 0 then
        return { success = false, reason = "no_turn_queue" }
    end
    
    for _, queueEntry in ipairs(battleState.turnQueue) do
        if queueEntry.pokemon and queueEntry.pokemon.battleId ~= copyingPokemon.battleId then
            if queueEntry.action and queueEntry.action.type == "move" then
                local targetMove = MoveDatabase.getMoveData(queueEntry.action.moveId)
                if targetMove and isValidCopyTarget(targetMove, copyingPokemon) then
                    return {
                        moveId = targetMove.id,
                        originalUser = queueEntry.pokemon,
                        powerBoost = 1.5,
                        success = true
                    }
                end
            end
        end
    end
    
    return { success = false, reason = "no_valid_target_move" }
end

function MoveCopying.executeSketch(pokemon, targetMoveId, battleState)
    if not pokemon or not targetMoveId or not battleState then
        return { success = false, error = "Invalid parameters" }
    end
    
    if not canLearnMove(pokemon, targetMoveId) then
        return { success = false, reason = "already_known" }
    end
    
    local targetMove = MoveDatabase.getMoveData(targetMoveId)
    if not targetMove or not isValidCopyTarget(targetMove, pokemon) then
        return { success = false, reason = "invalid_move" }
    end
    
    if not pokemon.moves then
        pokemon.moves = {}
    end
    
    local sketchIndex = nil
    for i, move in ipairs(pokemon.moves) do
        if move.id == Enums.Move.SKETCH then
            sketchIndex = i
            break
        end
    end
    
    if sketchIndex then
        pokemon.moves[sketchIndex] = {
            id = targetMoveId,
            name = targetMove.name,
            pp = { current = targetMove.pp, max = targetMove.pp },
            learnedBy = "sketch"
        }
        
        return { 
            success = true, 
            message = pokemon.name .. " sketched " .. targetMove.name .. "!"
        }
    end
    
    return { success = false, reason = "sketch_not_available" }
end

function MoveCopying.processCopyMove(copyMoveId, copyingPokemon, battleState, currentTurn)
    if not copyMoveId or not copyingPokemon or not battleState then
        return { success = false, error = "Invalid parameters" }
    end
    
    local result = nil
    
    if copyMoveId == Enums.Move.MIRROR_MOVE then
        result = MoveCopying.getMirrorMoveTarget(battleState, copyingPokemon)
    elseif copyMoveId == Enums.Move.COPYCAT then
        result = MoveCopying.getCopycatTarget(battleState, copyingPokemon)
    elseif copyMoveId == Enums.Move.ME_FIRST then
        result = MoveCopying.getMeFirstTarget(battleState, copyingPokemon, currentTurn)
    elseif copyMoveId == Enums.Move.SKETCH then
        local targetMoveId = MoveCopying.getSketchTarget(battleState, copyingPokemon)
        if targetMoveId then
            return MoveCopying.executeSketch(copyingPokemon, targetMoveId, battleState)
        else
            return { success = false, reason = "no_move_to_sketch" }
        end
    else
        return { success = false, error = "Unknown copy move" }
    end
    
    if result and result.success then
        local copiedMove = MoveDatabase.getMoveData(result.moveId)
        if copiedMove then
            local modifiedMove = {
                id = copiedMove.id,
                name = copiedMove.name,
                category = copiedMove.category,
                type = copiedMove.type,
                power = copiedMove.power,
                accuracy = copiedMove.accuracy,
                effects = copiedMove.effects,
                flags = copiedMove.flags,
                target = copiedMove.target,
                priority = copiedMove.priority,
                copied = true,
                originalMove = copyMoveId,
                originalUser = result.originalUser
            }
            
            if result.powerBoost then
                modifiedMove.powerMultiplier = result.powerBoost
            end
            
            return {
                success = true,
                copiedMove = modifiedMove,
                message = copyingPokemon.name .. " copied " .. copiedMove.name .. "!"
            }
        end
    end
    
    return result or { success = false, reason = "unknown_error" }
end

function MoveCopying.getSketchTarget(battleState, copyingPokemon)
    if not battleState or not battleState.moveHistory then return nil end
    
    for i = #battleState.moveHistory, 1, -1 do
        local historyEntry = battleState.moveHistory[i]
        if historyEntry.user and historyEntry.user.battleId ~= copyingPokemon.battleId then
            if historyEntry.moveData and isValidCopyTarget(historyEntry.moveData, copyingPokemon) then
                return historyEntry.moveData.id
            end
        end
    end
    
    return nil
end

function MoveCopying.init(battleState)
    if not battleState then
        return { success = false, error = "Battle state required" }
    end
    
    if not battleState.moveHistory then
        battleState.moveHistory = {}
    end
    
    if not battleState.turnQueue then
        battleState.turnQueue = {}
    end
    
    return { success = true }
end

return MoveCopying