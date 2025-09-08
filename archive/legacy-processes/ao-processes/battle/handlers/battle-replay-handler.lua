-- Battle Replay Handler
-- Manages battle history and replay functionality for battle process
-- Enables identical battle reproduction using deterministic RNG seeds
-- Epic 32.3: Battle Engine Process Extraction

local BattleReplayHandler = {}

-- Load dependencies
local BattleStateManager = require("battle.components.battle-state-manager")
local ConcurrentBattleManager = require("battle.components.concurrent-battle-manager")
local TurnProcessor = require("battle.components.turn-processor")
local BattleRNG = require("game-logic.rng.battle-rng")

-- Replay request types
BattleReplayHandler.ReplayType = {
    FULL_REPLAY = "FULL_REPLAY",
    TURN_REPLAY = "TURN_REPLAY", 
    STATE_RECONSTRUCTION = "STATE_RECONSTRUCTION",
    REPLAY_VALIDATION = "REPLAY_VALIDATION"
}

-- Replay data format version
BattleReplayHandler.REPLAY_FORMAT_VERSION = "1.0.0"

-- Process battle replay request
-- @param msg: AO message with replay request data
-- @return: JSON response string
function BattleReplayHandler.process(msg)
    local startTime = msg.Timestamp
    
    -- Parse message data
    local success, messageData = pcall(json.decode, msg.Data or "{}")
    if not success then
        return json.encode({
            success = false,
            error = "Invalid JSON in replay request",
            timestamp = 0
        })
    end
    
    -- Extract replay information
    local replayRequest = messageData.replayRequest or {}
    local correlationId = messageData.correlation and messageData.correlation.id
    
    local replayType = replayRequest.replayType
    if not replayType then
        return BattleReplayHandler.createErrorResponse(
            correlationId,
            "Missing replayType in request",
            "INVALID_REPLAY_REQUEST"
        )
    end
    
    -- Process based on replay type
    local result
    if replayType == BattleReplayHandler.ReplayType.FULL_REPLAY then
        result = BattleReplayHandler.processFullReplay(replayRequest, msg)
    elseif replayType == BattleReplayHandler.ReplayType.TURN_REPLAY then
        result = BattleReplayHandler.processTurnReplay(replayRequest, msg)
    elseif replayType == BattleReplayHandler.ReplayType.STATE_RECONSTRUCTION then
        result = BattleReplayHandler.processStateReconstruction(replayRequest, msg)
    elseif replayType == BattleReplayHandler.ReplayType.REPLAY_VALIDATION then
        result = BattleReplayHandler.processReplayValidation(replayRequest, msg)
    else
        result = BattleReplayHandler.createErrorResponse(
            correlationId,
            "Unknown replay type: " .. replayType,
            "UNKNOWN_REPLAY_TYPE"
        )
    end
    
    -- Add processing metrics
    local processingTime = 0 - startTime
    if type(result) == "table" then
        local resultData = json.decode(result)
        resultData.processing_time = processingTime
        result = json.encode(resultData)
    end
    
    return result
end

-- Process full battle replay request
-- @param replayRequest: Replay request data
-- @param msg: Original AO message
-- @return: JSON response string
function BattleReplayHandler.processFullReplay(replayRequest, msg)
    local correlationId = replayRequest.correlation and replayRequest.correlation.id
    local battleId = replayRequest.battleId
    
    if not battleId then
        return BattleReplayHandler.createErrorResponse(
            correlationId,
            "Missing battleId in full replay request",
            "INVALID_REPLAY_REQUEST"
        )
    end
    
    -- Get complete battle history
    local history = BattleStateManager.getBattleHistory(battleId)
    if not history or #history == 0 then
        return BattleReplayHandler.createErrorResponse(
            correlationId,
            "No battle history found for battle: " .. battleId,
            "HISTORY_NOT_FOUND"
        )
    end
    
    -- Get battle state for replay data
    local battleState = BattleStateManager.getBattleState(battleId)
    if not battleState then
        return BattleReplayHandler.createErrorResponse(
            correlationId,
            "Battle state not found: " .. battleId,
            "BATTLE_NOT_FOUND"
        )
    end
    
    -- Create comprehensive replay data
    local replayData = BattleReplayHandler.createReplayData(battleState, history)
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "FULL_REPLAY_RESULT"
        },
        result = {
            success = true,
            battleId = battleId,
            replayData = replayData,
            formatVersion = BattleReplayHandler.REPLAY_FORMAT_VERSION
        },
        timestamp = 0
    })
end

-- Process turn-specific replay request
-- @param replayRequest: Replay request data
-- @param msg: Original AO message
-- @return: JSON response string
function BattleReplayHandler.processTurnReplay(replayRequest, msg)
    local correlationId = replayRequest.correlation and replayRequest.correlation.id
    local battleId = replayRequest.battleId
    local turnNumber = replayRequest.turnNumber
    
    if not battleId or not turnNumber then
        return BattleReplayHandler.createErrorResponse(
            correlationId,
            "Missing battleId or turnNumber in turn replay request",
            "INVALID_REPLAY_REQUEST"
        )
    end
    
    -- Get battle history for specific turn
    local history = BattleStateManager.getBattleHistory(battleId)
    if not history then
        return BattleReplayHandler.createErrorResponse(
            correlationId,
            "No battle history found for battle: " .. battleId,
            "HISTORY_NOT_FOUND"
        )
    end
    
    -- Find the specified turn in history
    local turnHistory = nil
    for _, entry in ipairs(history) do
        if entry.turn == turnNumber then
            turnHistory = entry
            break
        end
    end
    
    if not turnHistory then
        return BattleReplayHandler.createErrorResponse(
            correlationId,
            "Turn " .. turnNumber .. " not found in battle history",
            "TURN_NOT_FOUND"
        )
    end
    
    -- Create turn-specific replay data
    local turnReplayData = {
        turn = turnNumber,
        timestamp = turnHistory.timestamp,
        action = turnHistory.action,
        stateSnapshot = turnHistory.stateSnapshot,
        turnData = turnHistory.turnData or {}
    }
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "TURN_REPLAY_RESULT"
        },
        result = {
            success = true,
            battleId = battleId,
            turnReplayData = turnReplayData
        },
        timestamp = 0
    })
end

-- Process state reconstruction request
-- @param replayRequest: Replay request data
-- @param msg: Original AO message
-- @return: JSON response string
function BattleReplayHandler.processStateReconstruction(replayRequest, msg)
    local correlationId = replayRequest.correlation and replayRequest.correlation.id
    local battleId = replayRequest.battleId
    local targetTurn = replayRequest.targetTurn or 0
    
    if not battleId then
        return BattleReplayHandler.createErrorResponse(
            correlationId,
            "Missing battleId in state reconstruction request",
            "INVALID_REPLAY_REQUEST"
        )
    end
    
    -- Get battle state and history
    local battleState = BattleStateManager.getBattleState(battleId)
    if not battleState then
        return BattleReplayHandler.createErrorResponse(
            correlationId,
            "Battle state not found: " .. battleId,
            "BATTLE_NOT_FOUND"
        )
    end
    
    local history = BattleStateManager.getBattleHistory(battleId)
    if not history then
        return BattleReplayHandler.createErrorResponse(
            correlationId,
            "Battle history not found: " .. battleId,
            "HISTORY_NOT_FOUND"
        )
    end
    
    -- Reconstruct battle state at target turn
    local reconstructedState = BattleReplayHandler.reconstructBattleState(
        battleState,
        history,
        targetTurn
    )
    
    if not reconstructedState then
        return BattleReplayHandler.createErrorResponse(
            correlationId,
            "Failed to reconstruct state at turn " .. targetTurn,
            "RECONSTRUCTION_FAILED"
        )
    end
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "STATE_RECONSTRUCTION_RESULT"
        },
        result = {
            success = true,
            battleId = battleId,
            targetTurn = targetTurn,
            reconstructedState = reconstructedState
        },
        timestamp = 0
    })
end

-- Process replay validation request
-- @param replayRequest: Replay request data
-- @param msg: Original AO message
-- @return: JSON response string
function BattleReplayHandler.processReplayValidation(replayRequest, msg)
    local correlationId = replayRequest.correlation and replayRequest.correlation.id
    local replayData = replayRequest.replayData
    
    if not replayData then
        return BattleReplayHandler.createErrorResponse(
            correlationId,
            "Missing replayData in validation request",
            "INVALID_REPLAY_REQUEST"
        )
    end
    
    -- Validate replay data integrity
    local validationResult = BattleReplayHandler.validateReplayData(replayData)
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "REPLAY_VALIDATION_RESULT"
        },
        result = validationResult,
        timestamp = 0
    })
end

-- Create comprehensive replay data from battle state and history
-- @param battleState: Current battle state
-- @param history: Complete battle history
-- @return: Replay data structure
function BattleReplayHandler.createReplayData(battleState, history)
    local replayData = {
        formatVersion = BattleReplayHandler.REPLAY_FORMAT_VERSION,
        battleId = battleState.battleId,
        battleSeed = battleState.battleSeed,
        createdAt = battleState.createdAt,
        lastUpdated = battleState.lastUpdated,
        
        -- Initial battle setup
        initialState = {
            playerParty = battleState.playerParty,
            enemyParty = battleState.enemyParty,
            battleType = battleState.battleType,
            battleConditions = battleState.battleConditions
        },
        
        -- Complete turn history
        turnHistory = history,
        
        -- Final battle result
        finalResult = battleState.battleResult,
        
        -- Metadata for validation
        metadata = {
            totalTurns = battleState.turn,
            historyEntries = #history,
            syncVersion = battleState.syncVersion,
            replayGenerated = 0
        }
    }
    
    return replayData
end

-- Reconstruct battle state at specific turn
-- @param currentBattleState: Current battle state
-- @param history: Battle history
-- @param targetTurn: Turn to reconstruct to
-- @return: Reconstructed battle state or nil
function BattleReplayHandler.reconstructBattleState(currentBattleState, history, targetTurn)
    if not currentBattleState or not history then
        return nil
    end
    
    -- Find the closest state snapshot at or before target turn
    local baseSnapshot = nil
    local baseSnapshotTurn = -1
    
    for _, entry in ipairs(history) do
        if entry.turn <= targetTurn and entry.turn > baseSnapshotTurn then
            baseSnapshot = entry.stateSnapshot
            baseSnapshotTurn = entry.turn
        end
    end
    
    if not baseSnapshot then
        return nil
    end
    
    -- If exact turn match, return the snapshot
    if baseSnapshotTurn == targetTurn then
        return baseSnapshot
    end
    
    -- Reconstruct state by replaying turns from base snapshot to target turn
    local reconstructedState = BattleReplayHandler.deepCopy(baseSnapshot)
    
    -- Apply turn-by-turn changes from base to target
    for _, entry in ipairs(history) do
        if entry.turn > baseSnapshotTurn and entry.turn <= targetTurn then
            -- Apply state changes from this turn
            if entry.stateChanges then
                BattleReplayHandler.applyStateChanges(reconstructedState, entry.stateChanges)
            end
        end
    end
    
    return reconstructedState
end

-- Apply state changes to reconstructed state
-- @param state: State to modify
-- @param changes: Changes to apply
function BattleReplayHandler.applyStateChanges(state, changes)
    -- This would implement the logic to apply incremental state changes
    -- For now, this is a placeholder that would be expanded based on
    -- the specific state change format used in the system
    
    if changes.turn then
        state.turn = changes.turn
    end
    
    if changes.phase then
        state.phase = changes.phase
    end
    
    if changes.pokemonUpdates then
        -- Apply Pokemon HP/status updates
        for _, update in ipairs(changes.pokemonUpdates) do
            -- Find and update Pokemon in state
            -- This would be implemented based on Pokemon storage structure
        end
    end
end

-- Validate replay data integrity
-- @param replayData: Replay data to validate
-- @return: Validation result
function BattleReplayHandler.validateReplayData(replayData)
    local validation = {
        success = true,
        errors = {},
        warnings = {},
        checks = {
            formatVersion = false,
            battleSeed = false,
            historyIntegrity = false,
            stateConsistency = false
        }
    }
    
    -- Check format version
    if replayData.formatVersion == BattleReplayHandler.REPLAY_FORMAT_VERSION then
        validation.checks.formatVersion = true
    else
        table.insert(validation.errors, "Unsupported replay format version: " .. 
                    (replayData.formatVersion or "unknown"))
        validation.success = false
    end
    
    -- Check battle seed presence
    if replayData.battleSeed and type(replayData.battleSeed) == "string" then
        validation.checks.battleSeed = true
    else
        table.insert(validation.errors, "Missing or invalid battle seed")
        validation.success = false
    end
    
    -- Check history integrity
    if replayData.turnHistory and type(replayData.turnHistory) == "table" then
        local historyValid = true
        local lastTurn = -1
        
        for i, entry in ipairs(replayData.turnHistory) do
            if not entry.turn or entry.turn <= lastTurn then
                historyValid = false
                table.insert(validation.errors, "Invalid turn order at history entry " .. i)
                break
            end
            lastTurn = entry.turn
        end
        
        validation.checks.historyIntegrity = historyValid
        if not historyValid then
            validation.success = false
        end
    else
        table.insert(validation.errors, "Missing or invalid turn history")
        validation.success = false
    end
    
    -- Check state consistency (basic check)
    if replayData.initialState and replayData.metadata then
        if replayData.metadata.totalTurns and replayData.metadata.historyEntries then
            validation.checks.stateConsistency = true
        else
            table.insert(validation.warnings, "Incomplete metadata for state consistency check")
        end
    else
        table.insert(validation.errors, "Missing initial state or metadata")
        validation.success = false
    end
    
    return validation
end

-- Deep copy utility for state reconstruction
-- @param original: Original table to copy
-- @return: Deep copy of the table
function BattleReplayHandler.deepCopy(original)
    if type(original) ~= "table" then
        return original
    end
    
    local copy = {}
    for key, value in pairs(original) do
        copy[key] = BattleReplayHandler.deepCopy(value)
    end
    
    return copy
end

-- Create standardized error response
-- @param correlationId: Correlation ID for response tracking
-- @param errorMessage: Human-readable error message
-- @param errorCode: Machine-readable error code
-- @return: JSON error response string
function BattleReplayHandler.createErrorResponse(correlationId, errorMessage, errorCode)
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "ERROR"
        },
        success = false,
        error = errorMessage,
        errorCode = errorCode,
        timestamp = 0
    })
end

return BattleReplayHandler