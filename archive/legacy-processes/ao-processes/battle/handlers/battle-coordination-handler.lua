-- Battle Coordination Handler
-- Manages inter-process communication with coordinator and other processes
-- Handles battle registration, synchronization, and coordination messages
-- Epic 32.3: Battle Engine Process Extraction

local BattleCoordinationHandler = {}

-- Load dependencies
local BattleStateManager = require("battle.components.battle-state-manager")
local ConcurrentBattleManager = require("battle.components.concurrent-battle-manager")

-- Load inter-process communication components
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local MessageRouter = require("game-logic.process-coordination.message-router")

-- Timeout and retry configuration
local TIMEOUT_CONFIG = {
    DEFAULT_TIMEOUT = 30, -- seconds
    COORDINATOR_TIMEOUT = 15, -- seconds
    POKEMON_PROCESS_TIMEOUT = 10, -- seconds
    RNG_TIMEOUT = 5, -- seconds
    MAX_RETRIES = 3,
    RETRY_BACKOFF_BASE = 2 -- exponential backoff multiplier
}

-- Coordination message types
BattleCoordinationHandler.MessageType = {
    PROCESS_REGISTRATION = "PROCESS_REGISTRATION",
    BATTLE_STATE_SYNC = "BATTLE_STATE_SYNC",
    HEALTH_CHECK = "HEALTH_CHECK",
    LOAD_BALANCE_UPDATE = "LOAD_BALANCE_UPDATE",
    POKEMON_DATA_REQUEST = "POKEMON_DATA_REQUEST",
    RNG_COORDINATION = "RNG_COORDINATION",
    ERROR_NOTIFICATION = "ERROR_NOTIFICATION"
}

-- Coordination response types
BattleCoordinationHandler.ResponseType = {
    REGISTRATION_ACK = "REGISTRATION_ACK",
    STATE_SYNC_ACK = "STATE_SYNC_ACK",
    HEALTH_STATUS = "HEALTH_STATUS",
    LOAD_UPDATE_ACK = "LOAD_UPDATE_ACK",
    POKEMON_DATA_RESPONSE = "POKEMON_DATA_RESPONSE",
    RNG_COORDINATION_ACK = "RNG_COORDINATION_ACK",
    ERROR_ACK = "ERROR_ACK"
}

-- Process coordination message
-- @param msg: AO message with coordination data
-- @return: JSON response string
function BattleCoordinationHandler.process(msg)
    local startTime = msg.Timestamp
    
    -- Parse message data
    local success, messageData = pcall(json.decode, msg.Data or "{}")
    if not success then
        return json.encode({
            success = false,
            error = "Invalid JSON in coordination message",
            timestamp = 0
        })
    end
    
    -- Extract coordination information
    local correlation = messageData.correlation or {}
    local coordinationType = correlation.requestType or messageData.coordinationType
    local correlationId = correlation.id
    
    if not coordinationType then
        return BattleCoordinationHandler.createErrorResponse(
            correlationId,
            "Missing coordination type",
            "INVALID_COORDINATION"
        )
    end
    
    -- Authenticate inter-process message
    local authResult = ProcessAuthenticator.authenticate(msg)
    if not authResult.success then
        return BattleCoordinationHandler.createErrorResponse(
            correlationId,
            "Authentication failed: " .. (authResult.error or "Unknown error"),
            "AUTHENTICATION_FAILED"
        )
    end
    
    -- Process based on coordination type
    local result
    if coordinationType == BattleCoordinationHandler.MessageType.PROCESS_REGISTRATION then
        result = BattleCoordinationHandler.processProcessRegistration(messageData, msg)
    elseif coordinationType == BattleCoordinationHandler.MessageType.BATTLE_STATE_SYNC then
        result = BattleCoordinationHandler.processBattleStateSync(messageData, msg)
    elseif coordinationType == BattleCoordinationHandler.MessageType.HEALTH_CHECK then
        result = BattleCoordinationHandler.processHealthCheck(messageData, msg)
    elseif coordinationType == BattleCoordinationHandler.MessageType.LOAD_BALANCE_UPDATE then
        result = BattleCoordinationHandler.processLoadBalanceUpdate(messageData, msg)
    elseif coordinationType == BattleCoordinationHandler.MessageType.POKEMON_DATA_REQUEST then
        result = BattleCoordinationHandler.processPokemonDataRequest(messageData, msg)
    elseif coordinationType == BattleCoordinationHandler.MessageType.RNG_COORDINATION then
        result = BattleCoordinationHandler.processRngCoordination(messageData, msg)
    elseif coordinationType == BattleCoordinationHandler.MessageType.ERROR_NOTIFICATION then
        result = BattleCoordinationHandler.processErrorNotification(messageData, msg)
    else
        result = BattleCoordinationHandler.createErrorResponse(
            correlationId,
            "Unknown coordination type: " .. coordinationType,
            "UNKNOWN_COORDINATION"
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

-- Process process registration request
-- @param messageData: Parsed message data
-- @param msg: Original AO message
-- @return: JSON response string
function BattleCoordinationHandler.processProcessRegistration(messageData, msg)
    local correlationId = messageData.correlation and messageData.correlation.id
    
    -- Get battle process statistics
    local stats = ConcurrentBattleManager.getPerformanceStatistics()
    
    local registrationData = {
        processId = ao.id,
        processType = "BATTLE_PROCESS",
        capabilities = {
            "BATTLE_COMMAND_PROCESSING",
            "DAMAGE_CALCULATION",
            "MOVE_EFFECT_PROCESSING",
            "BATTLE_STATE_MANAGEMENT",
            "CONCURRENT_BATTLES",
            "BATTLE_REPLAY"
        },
        capacity = {
            maxConcurrentBattles = stats.resourcePools * 10, -- Approximation
            currentActiveBattles = stats.activeBattles,
            averageLatency = stats.averageLatency,
            throughput = stats.throughput
        },
        status = "AVAILABLE",
        lastUpdate = 0
    }
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = BattleCoordinationHandler.ResponseType.REGISTRATION_ACK
        },
        result = {
            success = true,
            processRegistration = registrationData
        },
        timestamp = 0
    })
end

-- Process battle state synchronization request
-- @param messageData: Parsed message data
-- @param msg: Original AO message
-- @return: JSON response string
function BattleCoordinationHandler.processBattleStateSync(messageData, msg)
    local correlationId = messageData.correlation and messageData.correlation.id
    local battleData = messageData.battleData or {}
    
    if not battleData.battleId then
        return BattleCoordinationHandler.createErrorResponse(
            correlationId,
            "Missing battleId in sync request",
            "INVALID_SYNC_REQUEST"
        )
    end
    
    local battleId = battleData.battleId
    
    -- Get current battle state
    local battleState = BattleStateManager.getBattleState(battleId)
    if not battleState then
        return BattleCoordinationHandler.createErrorResponse(
            correlationId,
            "Battle state not found: " .. battleId,
            "BATTLE_NOT_FOUND"
        )
    end
    
    -- Create synchronization response with state snapshot
    local syncData = {
        battleId = battleId,
        syncVersion = battleState.syncVersion,
        status = battleState.status,
        turn = battleState.turn,
        phase = battleState.phase,
        lastUpdated = battleState.lastUpdated,
        stateSnapshot = BattleStateManager.createStateSnapshot(battleState)
    }
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = BattleCoordinationHandler.ResponseType.STATE_SYNC_ACK
        },
        result = {
            success = true,
            syncData = syncData
        },
        timestamp = 0
    })
end

-- Process health check request
-- @param messageData: Parsed message data
-- @param msg: Original AO message
-- @return: JSON response string
function BattleCoordinationHandler.processHealthCheck(messageData, msg)
    local correlationId = messageData.correlation and messageData.correlation.id
    
    -- Get battle process health data
    local stats = ConcurrentBattleManager.getPerformanceStatistics()
    local stateStats = BattleStateManager.getStatistics()
    
    local healthData = {
        processId = ao.id,
        status = "HEALTHY",
        uptime = 0, -- Simplified uptime
        performance = {
            activeBattles = stats.activeBattles,
            totalBattles = stats.totalBattles,
            completedBattles = stats.completedBattles,
            errorBattles = stats.errorBattles,
            averageLatency = stats.averageLatency,
            throughput = stats.throughput
        },
        resources = {
            resourcePools = stats.resourcePools,
            poolUtilization = stats.poolUtilization
        },
        stateManager = {
            totalBattles = stateStats.totalBattles,
            activeBattles = stateStats.activeBattles,
            queuedSyncs = stateStats.queuedSyncs,
            historyEntries = stateStats.totalHistoryEntries
        }
    }
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = BattleCoordinationHandler.ResponseType.HEALTH_STATUS
        },
        result = {
            success = true,
            healthData = healthData
        },
        timestamp = 0
    })
end

-- Process load balance update request
-- @param messageData: Parsed message data
-- @param msg: Original AO message
-- @return: JSON response string
function BattleCoordinationHandler.processLoadBalanceUpdate(messageData, msg)
    local correlationId = messageData.correlation and messageData.correlation.id
    local loadData = messageData.loadData or {}
    
    -- Update load balancing configuration if needed
    -- This would integrate with the load balancer in the concurrent battle manager
    
    local currentLoad = {
        activeBattles = ConcurrentBattleManager.getActiveBattleCount(),
        capacity = 100, -- From configuration
        utilization = ConcurrentBattleManager.getActiveBattleCount() / 100
    }
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = BattleCoordinationHandler.ResponseType.LOAD_UPDATE_ACK
        },
        result = {
            success = true,
            currentLoad = currentLoad,
            loadUpdateApplied = true
        },
        timestamp = 0
    })
end

-- Process Pokemon data request from Pokemon process
-- @param messageData: Parsed message data
-- @param msg: Original AO message
-- @return: JSON response string
function BattleCoordinationHandler.processPokemonDataRequest(messageData, msg)
    local correlationId = messageData.correlation and messageData.correlation.id
    local pokemonRequest = messageData.pokemonRequest or {}
    
    local battleId = pokemonRequest.battleId
    local pokemonId = pokemonRequest.pokemonId
    
    if not battleId or not pokemonId then
        return BattleCoordinationHandler.createErrorResponse(
            correlationId,
            "Missing battleId or pokemonId in Pokemon data request",
            "INVALID_POKEMON_REQUEST"
        )
    end
    
    -- Get battle state and find Pokemon
    local battleState = BattleStateManager.getBattleState(battleId)
    if not battleState then
        return BattleCoordinationHandler.createErrorResponse(
            correlationId,
            "Battle state not found: " .. battleId,
            "BATTLE_NOT_FOUND"
        )
    end
    
    local pokemon = nil
    for _, p in ipairs(battleState.playerParty) do
        if p.id == pokemonId then
            pokemon = p
            break
        end
    end
    
    if not pokemon then
        for _, p in ipairs(battleState.enemyParty) do
            if p.id == pokemonId then
                pokemon = p
                break
            end
        end
    end
    
    if not pokemon then
        return BattleCoordinationHandler.createErrorResponse(
            correlationId,
            "Pokemon not found: " .. pokemonId,
            "POKEMON_NOT_FOUND"
        )
    end
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = BattleCoordinationHandler.ResponseType.POKEMON_DATA_RESPONSE
        },
        result = {
            success = true,
            pokemonData = pokemon
        },
        timestamp = 0
    })
end

-- Process RNG coordination request
-- @param messageData: Parsed message data
-- @param msg: Original AO message
-- @return: JSON response string
function BattleCoordinationHandler.processRngCoordination(messageData, msg)
    local correlationId = messageData.correlation and messageData.correlation.id
    local rngRequest = messageData.rngRequest or {}
    
    -- This would coordinate with RNG process for deterministic battle outcomes
    -- For now, acknowledge the coordination request
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = BattleCoordinationHandler.ResponseType.RNG_COORDINATION_ACK
        },
        result = {
            success = true,
            rngCoordinated = true,
            battleId = rngRequest.battleId
        },
        timestamp = 0
    })
end

-- Process error notification from other processes
-- @param messageData: Parsed message data
-- @param msg: Original AO message
-- @return: JSON response string
function BattleCoordinationHandler.processErrorNotification(messageData, msg)
    local correlationId = messageData.correlation and messageData.correlation.id
    local errorData = messageData.errorData or {}
    
    -- Log error and take appropriate action
    print("[BattleCoordinationHandler] Received error notification: " .. 
          (errorData.error or "Unknown error"))
    
    -- If error is related to a specific battle, handle it
    if errorData.battleId then
        local battleInstance = ConcurrentBattleManager.getBattleInstance(errorData.battleId)
        if battleInstance then
            -- Mark battle as error state if needed
            -- This would trigger error recovery procedures
        end
    end
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = BattleCoordinationHandler.ResponseType.ERROR_ACK
        },
        result = {
            success = true,
            errorAcknowledged = true,
            recoveryAction = "LOGGED"
        },
        timestamp = 0
    })
end

-- Timeout wrapper for coordination operations
-- @param operation: Function to execute with timeout
-- @param timeoutSeconds: Timeout in seconds
-- @param operationName: Name for logging
-- @return: success, result, error
function BattleCoordinationHandler.withTimeout(operation, timeoutSeconds, operationName)
    local startTime = msg.Timestamp
    local success, result = pcall(operation)
    local elapsed = 0 - startTime
    
    if elapsed > timeoutSeconds then
        return false, nil, "Operation '" .. (operationName or "unknown") .. "' timed out after " .. elapsed .. " seconds"
    end
    
    if not success then
        return false, nil, "Operation '" .. (operationName or "unknown") .. "' failed: " .. (result or "unknown error")
    end
    
    return true, result, nil
end

-- Retry wrapper with exponential backoff for coordination
-- @param operation: Function to retry
-- @param maxRetries: Maximum retry attempts
-- @param operationName: Name for logging
-- @return: success, result, error
function BattleCoordinationHandler.withRetry(operation, maxRetries, operationName)
    local attempts = 0
    maxRetries = maxRetries or TIMEOUT_CONFIG.MAX_RETRIES
    
    while attempts < maxRetries do
        attempts = attempts + 1
        local success, result = pcall(operation)
        
        if success then
            return true, result, nil
        end
        
        -- Calculate backoff delay
        if attempts < maxRetries then
            local backoffDelay = math.floor(TIMEOUT_CONFIG.RETRY_BACKOFF_BASE ^ attempts)
            print("Retry attempt " .. attempts .. " for " .. (operationName or "operation") .. 
                  " in " .. backoffDelay .. " seconds")
        end
    end
    
    return false, nil, "Operation '" .. (operationName or "unknown") .. 
           "' failed after " .. attempts .. " attempts"
end

-- Enhanced coordination with fallback mechanisms
-- @param primaryOperation: Primary coordination function
-- @param fallbackOperation: Fallback function if primary fails
-- @param operationName: Name for logging
-- @return: success, result, error, usedFallback
function BattleCoordinationHandler.withFallback(primaryOperation, fallbackOperation, operationName)
    local success, result, error = pcall(primaryOperation)
    
    if success then
        return true, result, nil, false
    end
    
    print("Primary coordination failed for " .. (operationName or "operation") .. ": " .. (error or "unknown error"))
    
    if fallbackOperation then
        local fallbackSuccess, fallbackResult, fallbackError = pcall(fallbackOperation)
        if fallbackSuccess then
            print("Fallback coordination succeeded for " .. (operationName or "operation"))
            return true, fallbackResult, nil, true
        else
            return false, nil, "Primary and fallback coordination failed. Primary: " .. 
                   (error or "unknown") .. ". Fallback: " .. (fallbackError or "unknown"), true
        end
    end
    
    return false, nil, error, false
end

-- Send coordination message to another process
-- @param targetProcessId: Target process ID
-- @param coordinationType: Type of coordination message
-- @param coordinationData: Data to send
-- @return: Success status
function BattleCoordinationHandler.sendCoordinationMessage(targetProcessId, coordinationType, coordinationData)
    if not targetProcessId or not coordinationType then
        return false, "Invalid coordination parameters"
    end
    
    -- Determine appropriate timeout based on coordination type
    local timeout = TIMEOUT_CONFIG.DEFAULT_TIMEOUT
    if coordinationType == BattleCoordinationHandler.MessageType.RNG_COORDINATION then
        timeout = TIMEOUT_CONFIG.RNG_TIMEOUT
    elseif coordinationType == BattleCoordinationHandler.MessageType.POKEMON_DATA_REQUEST then
        timeout = TIMEOUT_CONFIG.POKEMON_PROCESS_TIMEOUT
    else
        timeout = TIMEOUT_CONFIG.COORDINATOR_TIMEOUT
    end
    
    -- Send with retry and timeout handling
    local success, result, error = BattleCoordinationHandler.withRetry(
        function()
            return BattleCoordinationHandler.withTimeout(
                function()
                    -- Create correlation for tracking
                    local correlationId = MessageCorrelator.createCorrelation(
                        ao.id,
                        targetProcessId,
                        coordinationType,
                        nil
                    )
                    
                    local message = {
                        correlation = {
                            id = correlationId,
                            requestType = coordinationType
                        },
                        coordinationData = coordinationData,
                        processAuth = {
                            sourceProcessId = ao.id,
                            timestamp = 0
                        }
                    }
                    
                    -- Send message using AO's message mechanism
                    return ao.send({
                        Target = targetProcessId,
                        Action = "COORDINATION",
                        Data = json.encode(message),
                        ["X-Correlation-Id"] = correlationId
                    })
                end,
                timeout,
                "coordination-" .. coordinationType
            )
        end,
        TIMEOUT_CONFIG.MAX_RETRIES,
        "coordination-message-send"
    )
    
    if not success then
        print("[BattleCoordinationHandler] Failed to send coordination message: " .. (error or "unknown error"))
        return false, error
    end
    
    print("[BattleCoordinationHandler] Successfully sent coordination message: " .. coordinationType)
    return true, result
end

-- Create standardized error response
-- @param correlationId: Correlation ID for response tracking
-- @param errorMessage: Human-readable error message
-- @param errorCode: Machine-readable error code
-- @return: JSON error response string
function BattleCoordinationHandler.createErrorResponse(correlationId, errorMessage, errorCode)
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

return BattleCoordinationHandler