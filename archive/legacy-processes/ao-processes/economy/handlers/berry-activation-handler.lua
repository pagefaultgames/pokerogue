--[[
Berry Activation Handler
Processes berry activation requests and coordination for the Economic Process

Features:
- Berry activation processing with precise timing and effect mechanics
- Battle coordination for berry effect processing and coordination
- Pokemon data requests for berry effects using MessageRouter
- Berry consumption tracking and inventory management
- Inter-process coordination for berry effects on Pokemon state

Integration:
- Uses BerryActivationManager for activation logic and timing
- Uses BerryEffectsProcessor for effect calculations and applications
- Uses TransactionAuditSystem for activation logging
- Uses MessageRouter for Pokemon process coordination
--]]

local BerryActivationHandler = {}

-- Dependencies
local BerryActivationManager = require("economy.components.berry-activation-manager")
local BerryEffectsProcessor = require("economy.components.berry-effects-processor")
local TransactionAuditSystem = require("economy.components.transaction-audit-system")
local MessageRouter = require("game-logic.process-coordination.message-router")
local EconomicSystem = require("economy.components.economic-system")

-- Activation type constants
local ACTIVATION_TYPES = {
    CHECK_ACTIVATION = "CHECK_ACTIVATION",
    PROCESS_ACTIVATION = "PROCESS_ACTIVATION",
    RECYCLE_BERRY = "RECYCLE_BERRY",
    BATCH_CHECK = "BATCH_CHECK",
    BATTLE_INIT = "BATTLE_INIT",
    BATTLE_CLEANUP = "BATTLE_CLEANUP"
}

-- Process berry activation message
function BerryActivationHandler.process(msg)
    local startTime = msg.Timestamp
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return json.encode({
            success = false,
            error = "Invalid JSON data",
            timestamp = startTime
        })
    end
    
    -- Validate required fields
    if not data.correlation or not data.correlation.id then
        return json.encode({
            success = false,
            error = "Missing correlation ID",
            timestamp = startTime
        })
    end
    
    local correlationId = data.correlation.id
    local activationType = data.activationType or "UNKNOWN"
    
    -- Log activation start
    TransactionAuditSystem.logTransactionStart(correlationId, {
        type = "BERRY_ACTIVATION",
        subtype = activationType,
        playerId = msg.From,
        timestamp = startTime
    })
    
    local response = {}
    
    -- Route to appropriate activation handler
    if activationType == ACTIVATION_TYPES.CHECK_ACTIVATION then
        response = BerryActivationHandler.checkActivation(data, msg.From, correlationId)
    elseif activationType == ACTIVATION_TYPES.PROCESS_ACTIVATION then
        response = BerryActivationHandler.processActivation(data, msg.From, correlationId)
    elseif activationType == ACTIVATION_TYPES.RECYCLE_BERRY then
        response = BerryActivationHandler.recycleBerry(data, msg.From, correlationId)
    elseif activationType == ACTIVATION_TYPES.BATCH_CHECK then
        response = BerryActivationHandler.batchCheckActivations(data, msg.From, correlationId)
    elseif activationType == ACTIVATION_TYPES.BATTLE_INIT then
        response = BerryActivationHandler.initializeBattleState(data, msg.From, correlationId)
    elseif activationType == ACTIVATION_TYPES.BATTLE_CLEANUP then
        response = BerryActivationHandler.cleanupBattleState(data, msg.From, correlationId)
    else
        response = {
            success = false,
            error = "Unknown activation type: " .. activationType,
            correlation = { id = correlationId, responseType = "BERRY_ACTIVATION_ERROR" }
        }
    end
    
    -- Calculate processing time
    local endTime = 0
    local latency = endTime - startTime
    
    -- Log activation completion
    TransactionAuditSystem.logTransactionComplete(correlationId, {
        success = response.success,
        latency = latency,
        timestamp = endTime
    })
    
    -- Add processing metadata
    response.processing = {
        latency = latency,
        timestamp = endTime
    }
    
    return json.encode(response)
end

-- Check if berry should activate
function BerryActivationHandler.checkActivation(data, playerId, correlationId)
    -- Validate activation data
    if not data.berryData then
        return {
            success = false,
            error = "Missing berry data",
            correlation = { id = correlationId, responseType = "ACTIVATION_CHECK_ERROR" }
        }
    end
    
    local berryData = data.berryData
    local pokemonId = berryData.pokemonId
    local berryId = berryData.berryId
    local battleContext = berryData.battleContext
    
    -- Validate required parameters
    if not pokemonId or not berryId or not battleContext then
        return {
            success = false,
            error = "Missing required activation parameters",
            correlation = { id = correlationId, responseType = "ACTIVATION_CHECK_ERROR" }
        }
    end
    
    -- Check if berry should activate
    local shouldActivate, activationData = BerryActivationManager.shouldActivateBerry(
        pokemonId, berryId, battleContext
    )
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "ACTIVATION_CHECK_SUCCESS" },
        result = {
            shouldActivate = shouldActivate,
            activationData = activationData,
            pokemonId = pokemonId,
            berryId = berryId
        }
    }
end

-- Process berry activation
function BerryActivationHandler.processActivation(data, playerId, correlationId)
    -- Validate activation data
    if not data.activationData or not data.battleContext then
        return {
            success = false,
            error = "Missing activation or battle context data",
            correlation = { id = correlationId, responseType = "ACTIVATION_PROCESS_ERROR" }
        }
    end
    
    local activationData = data.activationData
    local battleContext = data.battleContext
    
    -- Process activation through BerryActivationManager
    local success, result = BerryActivationManager.activateBerry(activationData, battleContext)
    
    if not success then
        return {
            success = false,
            error = result.error or "Berry activation failed",
            correlation = { id = correlationId, responseType = "ACTIVATION_PROCESS_ERROR" }
        }
    end
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "ACTIVATION_PROCESS_SUCCESS" },
        result = result
    }
end

-- Process berry recycling
function BerryActivationHandler.recycleBerry(data, playerId, correlationId)
    -- Validate recycling data
    if not data.recycleData then
        return {
            success = false,
            error = "Missing recycle data",
            correlation = { id = correlationId, responseType = "BERRY_RECYCLE_ERROR" }
        }
    end
    
    local recycleData = data.recycleData
    local pokemonId = recycleData.pokemonId
    local berryId = recycleData.berryId
    local recycleMethod = recycleData.recycleMethod or "UNKNOWN"
    local battleContext = recycleData.battleContext
    
    -- Validate required parameters
    if not pokemonId or not berryId or not battleContext then
        return {
            success = false,
            error = "Missing required recycle parameters",
            correlation = { id = correlationId, responseType = "BERRY_RECYCLE_ERROR" }
        }
    end
    
    -- Process recycling through BerryActivationManager
    local success, result = BerryActivationManager.recycleBerry(
        pokemonId, berryId, recycleMethod, battleContext
    )
    
    if not success then
        return {
            success = false,
            error = result.error or "Berry recycling failed",
            correlation = { id = correlationId, responseType = "BERRY_RECYCLE_ERROR" }
        }
    end
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "BERRY_RECYCLE_SUCCESS" },
        result = result
    }
end

-- Batch check activations for multiple Pokemon
function BerryActivationHandler.batchCheckActivations(data, playerId, correlationId)
    -- Validate batch data
    if not data.batchData or not data.batchData.battleContext then
        return {
            success = false,
            error = "Missing batch data or battle context",
            correlation = { id = correlationId, responseType = "BATCH_CHECK_ERROR" }
        }
    end
    
    local battleContext = data.batchData.battleContext
    local checkType = data.batchData.checkType or "TURN_START"
    
    local activations = {}
    
    -- Route to appropriate batch check
    if checkType == "TURN_START" then
        activations = BerryActivationManager.checkTurnStartActivations(battleContext)
    elseif checkType == "POST_DAMAGE" and data.batchData.pokemonId then
        activations = BerryActivationManager.checkPostDamageActivations(
            data.batchData.pokemonId, battleContext
        )
    end
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "BATCH_CHECK_SUCCESS" },
        result = {
            activations = activations,
            activationCount = #activations,
            checkType = checkType,
            battleId = battleContext.battleId
        }
    }
end

-- Initialize battle state for berry tracking
function BerryActivationHandler.initializeBattleState(data, playerId, correlationId)
    -- Validate battle data
    if not data.battleData or not data.battleData.battleId then
        return {
            success = false,
            error = "Missing battle ID",
            correlation = { id = correlationId, responseType = "BATTLE_INIT_ERROR" }
        }
    end
    
    local battleId = data.battleData.battleId
    
    -- Initialize battle state
    local success = BerryActivationManager.initializeBattleState(battleId)
    
    if not success then
        return {
            success = false,
            error = "Failed to initialize battle state",
            correlation = { id = correlationId, responseType = "BATTLE_INIT_ERROR" }
        }
    end
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "BATTLE_INIT_SUCCESS" },
        result = {
            battleId = battleId,
            initialized = true
        }
    }
end

-- Cleanup battle state
function BerryActivationHandler.cleanupBattleState(data, playerId, correlationId)
    -- Validate battle data
    if not data.battleData or not data.battleData.battleId then
        return {
            success = false,
            error = "Missing battle ID",
            correlation = { id = correlationId, responseType = "BATTLE_CLEANUP_ERROR" }
        }
    end
    
    local battleId = data.battleData.battleId
    
    -- Get activation history before cleanup
    local history = BerryActivationManager.getBattleActivationHistory(battleId)
    
    -- Cleanup battle state
    local success = BerryActivationManager.clearBattleState(battleId)
    
    if not success then
        return {
            success = false,
            error = "Failed to cleanup battle state",
            correlation = { id = correlationId, responseType = "BATTLE_CLEANUP_ERROR" }
        }
    end
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "BATTLE_CLEANUP_SUCCESS" },
        result = {
            battleId = battleId,
            cleaned = true,
            activationHistory = history
        }
    }
end

-- Get battle activation history
function BerryActivationHandler.getBattleHistory(data, playerId, correlationId)
    -- Validate battle data
    if not data.battleData or not data.battleData.battleId then
        return {
            success = false,
            error = "Missing battle ID",
            correlation = { id = correlationId, responseType = "BATTLE_HISTORY_ERROR" }
        }
    end
    
    local battleId = data.battleData.battleId
    local history = BerryActivationManager.getBattleActivationHistory(battleId)
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "BATTLE_HISTORY_SUCCESS" },
        result = {
            battleId = battleId,
            history = history
        }
    }
end

-- Validate berry activation
function BerryActivationHandler.validateActivation(data, playerId, correlationId)
    -- Validate activation data
    if not data.activationData then
        return {
            success = false,
            error = "Missing activation data",
            correlation = { id = correlationId, responseType = "ACTIVATION_VALIDATION_ERROR" }
        }
    end
    
    local valid, result = BerryActivationManager.validateActivation(data.activationData)
    
    return {
        success = true,
        correlation = { id = correlationId, responseType = "ACTIVATION_VALIDATION_SUCCESS" },
        result = {
            valid = valid,
            validation = result
        }
    }
end

return BerryActivationHandler