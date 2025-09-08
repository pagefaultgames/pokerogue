-- Battle Command Handler
-- Processes battle command requests from coordinator and other processes
-- Integrates with turn processor and damage calculator for battle execution
-- Epic 32.3: Battle Engine Process Extraction

local BattleCommandHandler = {}

-- Load dependencies
local ConcurrentBattleManager = require("battle.components.concurrent-battle-manager")
local TurnProcessor = require("battle.components.turn-processor")
local DamageCalculator = require("battle.components.damage-calculator")
local MoveEffectProcessor = require("battle.components.move-effect-processor")
local BattleStateManager = require("battle.components.battle-state-manager")

-- Load inter-process communication components
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")

-- Timeout and retry configuration
local TIMEOUT_CONFIG = {
    DEFAULT_TIMEOUT = 30, -- seconds
    COORDINATOR_TIMEOUT = 15, -- seconds
    POKEMON_PROCESS_TIMEOUT = 10, -- seconds
    RNG_TIMEOUT = 5, -- seconds
    MAX_RETRIES = 3,
    RETRY_BACKOFF_BASE = 2 -- exponential backoff multiplier
}

-- Load validation
local ValidationHandler = require("handlers.validation-handler")
local ErrorHandler = require("handlers.error-handler")

-- Command types
BattleCommandHandler.CommandType = {
    INITIALIZE_BATTLE = "INITIALIZE_BATTLE",
    PROCESS_BATTLE_TURN = "PROCESS_BATTLE_TURN",
    BATTLE_COMMAND = "BATTLE_COMMAND",
    END_BATTLE = "END_BATTLE"
}

-- Battle command validation schemas
local COMMAND_SCHEMAS = {
    INITIALIZE_BATTLE = {
        required = {"battleId", "battleParams"},
        optional = {"coordinatorId", "correlation"}
    },
    PROCESS_BATTLE_TURN = {
        required = {"battleId", "turnCommands"},
        optional = {"correlation"}
    },
    BATTLE_COMMAND = {
        required = {"battleId", "playerId", "command"},
        optional = {"correlation"}
    }
}

-- Timeout wrapper for inter-process operations
-- @param operation: Function to execute with timeout
-- @param timeoutSeconds: Timeout in seconds
-- @param operationName: Name for logging
-- @return: success, result, error
function BattleCommandHandler.withTimeout(operation, timeoutSeconds, operationName)
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

-- Retry wrapper with exponential backoff
-- @param operation: Function to retry
-- @param maxRetries: Maximum retry attempts
-- @param operationName: Name for logging
-- @return: success, result, error
function BattleCommandHandler.withRetry(operation, maxRetries, operationName)
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
            -- In real AO environment, we would use proper delay mechanism
            -- For now, we log the backoff attempt
            print("Retry attempt " .. attempts .. " for " .. (operationName or "operation") .. 
                  " in " .. backoffDelay .. " seconds")
        end
    end
    
    return false, nil, "Operation '" .. (operationName or "unknown") .. 
           "' failed after " .. attempts .. " attempts"
end

-- Enhanced inter-process communication with error handling
-- @param processId: Target process ID
-- @param message: Message to send
-- @param timeout: Timeout in seconds
-- @param retries: Number of retries
-- @return: success, response, error
function BattleCommandHandler.sendInterProcessMessage(processId, message, timeout, retries)
    timeout = timeout or TIMEOUT_CONFIG.DEFAULT_TIMEOUT
    retries = retries or TIMEOUT_CONFIG.MAX_RETRIES
    
    local operation = function()
        -- Create correlation ID for tracking
        local correlationId = MessageCorrelator.generateCorrelationId()
        message.correlation = message.correlation or {}
        message.correlation.id = correlationId
        
        -- Send message with timeout
        local success, response = BattleCommandHandler.withTimeout(
            function() 
                return ao.send({
                    Target = processId,
                    Action = message.action,
                    Data = json.encode(message),
                    ["X-Correlation-Id"] = correlationId
                })
            end,
            timeout,
            "inter-process-send-" .. processId
        )
        
        if not success then
            return false, nil, response
        end
        
        return true, response, nil
    end
    
    return BattleCommandHandler.withRetry(operation, retries, "inter-process-communication")
end

-- Graceful degradation for process failures
-- @param processType: Type of process (coordinator, pokemon, rng)
-- @param operation: Primary operation to attempt
-- @param fallbackOperation: Fallback operation if primary fails
-- @return: success, result, error, usedFallback
function BattleCommandHandler.withGracefulDegradation(processType, operation, fallbackOperation)
    local success, result, error = pcall(operation)
    
    if success then
        return true, result, nil, false
    end
    
    -- Log primary failure
    print("Primary operation failed for " .. processType .. ": " .. (error or "unknown error"))
    
    -- Attempt fallback if provided
    if fallbackOperation then
        local fallbackSuccess, fallbackResult, fallbackError = pcall(fallbackOperation)
        if fallbackSuccess then
            print("Fallback operation succeeded for " .. processType)
            return true, fallbackResult, nil, true
        else
            return false, nil, "Primary and fallback operations failed. Primary: " .. 
                   (error or "unknown") .. ". Fallback: " .. (fallbackError or "unknown"), true
        end
    end
    
    return false, nil, error, false
end

-- Process battle command message
-- @param msg: AO message with battle command data
-- @return: JSON response string
function BattleCommandHandler.process(msg)
    local startTime = msg.Timestamp
    
    -- Parse message data
    local success, messageData = pcall(json.decode, msg.Data or "{}")
    if not success then
        return json.encode({
            success = false,
            error = "Invalid JSON in message data",
            timestamp = 0
        })
    end
    
    -- Extract correlation information
    local correlation = messageData.correlation or {}
    local correlationId = correlation.id
    
    -- Determine command type
    local action = msg.Tags and msg.Tags.Action
    if not action then
        return BattleCommandHandler.createErrorResponse(
            correlationId, 
            "Missing Action tag", 
            "INVALID_REQUEST"
        )
    end
    
    -- Validate command structure
    local schema = COMMAND_SCHEMAS[action]
    if not schema then
        return BattleCommandHandler.createErrorResponse(
            correlationId,
            "Unknown command type: " .. action,
            "UNKNOWN_COMMAND"
        )
    end
    
    local validationResult = BattleCommandHandler.validateCommandData(messageData, schema)
    if not validationResult.valid then
        return BattleCommandHandler.createErrorResponse(
            correlationId,
            validationResult.error,
            "VALIDATION_ERROR"
        )
    end
    
    -- Process based on command type
    local result
    if action == BattleCommandHandler.CommandType.INITIALIZE_BATTLE then
        result = BattleCommandHandler.processInitializeBattle(messageData, msg)
    elseif action == BattleCommandHandler.CommandType.PROCESS_BATTLE_TURN then
        result = BattleCommandHandler.processProcessBattleTurn(messageData, msg)
    elseif action == BattleCommandHandler.CommandType.BATTLE_COMMAND then
        result = BattleCommandHandler.processBattleCommand(messageData, msg)
    elseif action == BattleCommandHandler.CommandType.END_BATTLE then
        result = BattleCommandHandler.processEndBattle(messageData, msg)
    else
        result = BattleCommandHandler.createErrorResponse(
            correlationId,
            "Unhandled command type: " .. action,
            "UNHANDLED_COMMAND"
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

-- Validate command data against schema
-- @param messageData: Parsed message data
-- @param schema: Validation schema
-- @return: Validation result
function BattleCommandHandler.validateCommandData(messageData, schema)
    -- Check required fields
    for _, field in ipairs(schema.required) do
        if not messageData[field] then
            return {
                valid = false,
                error = "Missing required field: " .. field
            }
        end
    end
    
    return {valid = true}
end

-- Process initialize battle command
-- @param messageData: Parsed message data
-- @param msg: Original AO message
-- @return: JSON response string
function BattleCommandHandler.processInitializeBattle(messageData, msg)
    local correlationId = messageData.correlation and messageData.correlation.id
    
    local battleId = messageData.battleId
    local battleParams = messageData.battleParams
    local coordinatorId = messageData.coordinatorId or msg.From
    
    -- Start concurrent battle with error handling and timeout
    local success, battleResult, error, usedFallback = BattleCommandHandler.withGracefulDegradation(
        "coordinator",
        function()
            return BattleCommandHandler.withTimeout(
                function() 
                    return ConcurrentBattleManager.startBattle(
                        battleId,
                        battleParams,
                        coordinatorId
                    )
                end,
                TIMEOUT_CONFIG.COORDINATOR_TIMEOUT,
                "initialize-battle"
            )
        end,
        function()
            -- Fallback: Initialize battle with minimal coordinator dependency
            return ConcurrentBattleManager.startBattleOffline(
                battleId,
                battleParams
            )
        end
    )
    
    if not success then
        return BattleCommandHandler.createErrorResponse(
            correlationId,
            "Failed to initialize battle: " .. (error or "Unknown error"),
            "INITIALIZATION_FAILED"
        )
    end
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "BATTLE_INITIALIZATION_RESULT"
        },
        result = {
            success = true,
            battleId = battleId,
            resourcePoolId = battleResult.resourcePoolId,
            battleState = {
                status = battleResult.battleState.status,
                turn = battleResult.battleState.turn,
                phase = battleResult.battleState.phase
            }
        },
        timestamp = 0
    })
end

-- Process battle turn processing command
-- @param messageData: Parsed message data
-- @param msg: Original AO message
-- @return: JSON response string
function BattleCommandHandler.processProcessBattleTurn(messageData, msg)
    local correlationId = messageData.correlation and messageData.correlation.id
    
    local battleId = messageData.battleId
    local turnCommands = messageData.turnCommands or {}
    
    -- Process battle turn with error handling and retry
    local success, turnResult, error = BattleCommandHandler.withRetry(
        function()
            return BattleCommandHandler.withTimeout(
                function()
                    return ConcurrentBattleManager.processBattleTurn(
                        battleId,
                        turnCommands
                    )
                end,
                TIMEOUT_CONFIG.DEFAULT_TIMEOUT,
                "process-battle-turn"
            )
        end,
        TIMEOUT_CONFIG.MAX_RETRIES,
        "battle-turn-processing"
    )
    
    if not success then
        return BattleCommandHandler.createErrorResponse(
            correlationId,
            "Failed to process battle turn: " .. (error or "Unknown error"),
            "TURN_PROCESSING_FAILED"
        )
    end
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "BATTLE_TURN_RESULT"
        },
        result = turnResult,
        timestamp = 0
    })
end

-- Process individual battle command
-- @param messageData: Parsed message data
-- @param msg: Original AO message
-- @return: JSON response string
function BattleCommandHandler.processBattleCommand(messageData, msg)
    local correlationId = messageData.correlation and messageData.correlation.id
    
    local battleId = messageData.battleId
    local playerId = messageData.playerId
    local command = messageData.command
    
    -- Get battle instance
    local battleInstance = ConcurrentBattleManager.getBattleInstance(battleId)
    if not battleInstance then
        return BattleCommandHandler.createErrorResponse(
            correlationId,
            "Battle instance not found: " .. battleId,
            "BATTLE_NOT_FOUND"
        )
    end
    
    -- Add command to battle turn
    local success, commandResult = TurnProcessor.addTurnCommand(
        battleInstance.battleState,
        playerId,
        command
    )
    
    if not success then
        return BattleCommandHandler.createErrorResponse(
            correlationId,
            "Failed to add battle command: " .. (commandResult or "Unknown error"),
            "COMMAND_FAILED"
        )
    end
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "BATTLE_COMMAND_RESULT"
        },
        result = {
            success = true,
            battleId = battleId,
            playerId = playerId,
            commandResult = commandResult
        },
        timestamp = 0
    })
end

-- Process end battle command
-- @param messageData: Parsed message data
-- @param msg: Original AO message
-- @return: JSON response string
function BattleCommandHandler.processEndBattle(messageData, msg)
    local correlationId = messageData.correlation and messageData.correlation.id
    
    local battleId = messageData.battleId
    local battleResult = messageData.battleResult or {result = "MANUAL_END"}
    
    -- Get battle instance
    local battleInstance = ConcurrentBattleManager.getBattleInstance(battleId)
    if not battleInstance then
        return BattleCommandHandler.createErrorResponse(
            correlationId,
            "Battle instance not found: " .. battleId,
            "BATTLE_NOT_FOUND"
        )
    end
    
    -- Complete battle
    local success = BattleStateManager.completeBattle(battleId, battleResult)
    if not success then
        return BattleCommandHandler.createErrorResponse(
            correlationId,
            "Failed to complete battle",
            "COMPLETION_FAILED"
        )
    end
    
    -- Cleanup battle instance
    ConcurrentBattleManager.cleanupBattle(battleId)
    
    return json.encode({
        correlation = {
            id = correlationId,
            responseType = "BATTLE_END_RESULT"
        },
        result = {
            success = true,
            battleId = battleId,
            battleResult = battleResult
        },
        timestamp = 0
    })
end

-- Create standardized error response
-- @param correlationId: Correlation ID for response tracking
-- @param errorMessage: Human-readable error message
-- @param errorCode: Machine-readable error code
-- @return: JSON error response string
function BattleCommandHandler.createErrorResponse(correlationId, errorMessage, errorCode)
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

-- Get handler statistics for monitoring
-- @return: Handler processing statistics
function BattleCommandHandler.getStatistics()
    return {
        commandsProcessed = 0, -- This would be tracked in production
        averageProcessingTime = 0,
        errorRate = 0,
        supportedCommands = {
            BattleCommandHandler.CommandType.INITIALIZE_BATTLE,
            BattleCommandHandler.CommandType.PROCESS_BATTLE_TURN,
            BattleCommandHandler.CommandType.BATTLE_COMMAND,
            BattleCommandHandler.CommandType.END_BATTLE
        }
    }
end

return BattleCommandHandler