-- API Gateway for Coordinator Process
-- Maintains 100% compatibility with existing client message formats
-- Provides protocol translation between client and inter-process communication

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local BackwardCompatibility = require("game-logic.process-coordination.backward-compatibility")
local MessageRouter = require("game-logic.process-coordination.message-router")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")

local APIGateway = {
    -- Client API version compatibility
    apiVersion = "1.0",
    supportedVersions = {"1.0", "0.9"},
    
    -- Statistics tracking
    stats = {
        clientRequestsProcessed = 0,
        interProcessRequestsGenerated = 0,
        responseAggregations = 0,
        versionMismatches = 0,
        protocolTranslations = 0
    }
}

-- Client message format definitions (maintains existing compatibility)
APIGateway.CLIENT_MESSAGE_TYPES = {
    -- Battle operations
    BATTLE_COMMAND = "BATTLE_COMMAND",
    MOVE_EXECUTION = "MOVE_EXECUTION",
    BATTLE_STATE_QUERY = "BATTLE_STATE_QUERY",
    
    -- Pokemon operations
    QUERY_STATE = "QUERY_STATE", 
    POKEMON_UPDATE = "POKEMON_UPDATE",
    EVOLUTION_CHECK = "EVOLUTION_CHECK",
    
    -- Shop operations
    SHOP_PURCHASE = "SHOP_PURCHASE",
    SHOP_INVENTORY = "SHOP_INVENTORY",
    ITEM_TRANSACTION = "ITEM_TRANSACTION",
    
    -- Game management
    SAVE_GAME = "SAVE_GAME",
    LOAD_GAME = "LOAD_GAME",
    GAME_STATE_SYNC = "GAME_STATE_SYNC"
}

-- API Gateway message routing table (client action -> internal operation)
APIGateway.CLIENT_ROUTING_TABLE = {
    -- Battle commands
    [APIGateway.CLIENT_MESSAGE_TYPES.BATTLE_COMMAND] = MessageRouter.OPERATION_TYPES.BATTLE_RESOLUTION,
    [APIGateway.CLIENT_MESSAGE_TYPES.MOVE_EXECUTION] = MessageRouter.OPERATION_TYPES.MOVE_EXECUTION,
    [APIGateway.CLIENT_MESSAGE_TYPES.BATTLE_STATE_QUERY] = MessageRouter.OPERATION_TYPES.BATTLE_RESOLUTION,
    
    -- Pokemon operations
    [APIGateway.CLIENT_MESSAGE_TYPES.QUERY_STATE] = MessageRouter.OPERATION_TYPES.POKEMON_UPDATE,
    [APIGateway.CLIENT_MESSAGE_TYPES.POKEMON_UPDATE] = MessageRouter.OPERATION_TYPES.POKEMON_UPDATE,
    [APIGateway.CLIENT_MESSAGE_TYPES.EVOLUTION_CHECK] = MessageRouter.OPERATION_TYPES.POKEMON_EVOLUTION,
    
    -- Shop operations
    [APIGateway.CLIENT_MESSAGE_TYPES.SHOP_PURCHASE] = MessageRouter.OPERATION_TYPES.ITEM_PURCHASE,
    [APIGateway.CLIENT_MESSAGE_TYPES.SHOP_INVENTORY] = MessageRouter.OPERATION_TYPES.SHOP_INVENTORY,
    [APIGateway.CLIENT_MESSAGE_TYPES.ITEM_TRANSACTION] = MessageRouter.OPERATION_TYPES.SHOP_TRANSACTION,
    
    -- Game management
    [APIGateway.CLIENT_MESSAGE_TYPES.SAVE_GAME] = MessageRouter.OPERATION_TYPES.SAVE_GAME,
    [APIGateway.CLIENT_MESSAGE_TYPES.LOAD_GAME] = MessageRouter.OPERATION_TYPES.LOAD_GAME,
    [APIGateway.CLIENT_MESSAGE_TYPES.GAME_STATE_SYNC] = MessageRouter.OPERATION_TYPES.SYNC_STATE
}

-- Initialize API Gateway
function APIGateway.initialize()
    APIGateway.stats = {
        clientRequestsProcessed = 0,
        interProcessRequestsGenerated = 0,
        responseAggregations = 0,
        versionMismatches = 0,
        protocolTranslations = 0
    }
    
    print("[APIGateway] API Gateway initialized with version " .. APIGateway.apiVersion)
    return true
end

-- Process client message and translate to inter-process format
function APIGateway.processClientMessage(clientMessage, clientInfo)
    APIGateway.stats.clientRequestsProcessed = APIGateway.stats.clientRequestsProcessed + 1
    
    -- Validate client message format
    local isValid, validationError = APIGateway.validateClientMessage(clientMessage)
    if not isValid then
        return nil, "Invalid client message: " .. validationError
    end
    
    -- Check API version compatibility
    local isCompatible, versionMessage = APIGateway.validateAPIVersion(clientMessage.apiVersion or "1.0")
    if not isCompatible then
        APIGateway.stats.versionMismatches = APIGateway.stats.versionMismatches + 1
        return nil, "API version incompatible: " .. versionMessage
    end
    
    -- Extract client action and player information
    local clientAction = clientMessage.action or clientMessage.type
    local playerId = clientMessage.playerId or (clientInfo and clientInfo.sender) or "unknown"
    
    -- Map client action to internal operation
    local internalOperation = APIGateway.CLIENT_ROUTING_TABLE[clientAction]
    if not internalOperation then
        -- Try backward compatibility layer
        local compatibilityResult = BackwardCompatibility.adaptLegacyMessage(clientMessage)
        if compatibilityResult then
            internalOperation = compatibilityResult.operation.type
            APIGateway.stats.protocolTranslations = APIGateway.stats.protocolTranslations + 1
        else
            return nil, "Unsupported client action: " .. tostring(clientAction)
        end
    end
    
    -- Generate correlation for tracking
    local correlationId = MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.CLIENT_REQUEST)
    MessageCorrelator.createCorrelation("coordinator", "routing", internalOperation)
    
    -- Create inter-process message
    local interProcessMessage = {
        correlation = {
            id = correlationId,
            clientRequestId = clientMessage.requestId,
            sessionId = APIGateway._generateSessionId(playerId),
            origin = "coordinator",
            clientOrigin = true
        },
        routing = {
            targetProcessType = APIGateway._getTargetProcessType(internalOperation),
            routingStrategy = APIGateway._selectRoutingStrategy(internalOperation, clientMessage),
            fallbackProcesses = APIGateway._getFallbackProcesses(internalOperation),
            requiresAggregation = APIGateway._requiresResponseAggregation(internalOperation)
        },
        session = {
            sessionId = APIGateway._generateSessionId(playerId),
            playerId = playerId,
            stateVersion = clientMessage.stateVersion or 1,
            requiresStateSync = APIGateway._requiresStateSync(internalOperation)
        },
        operation = {
            type = internalOperation,
            priority = clientMessage.priority or "NORMAL",
            retryable = clientMessage.retryable ~= false,
            timeout = clientMessage.timeout or 30000
        },
        payload = {
            originalClientMessage = clientMessage,
            clientAction = clientAction,
            translatedBy = "APIGateway",
            translatedAt = 0,
            data = clientMessage.data or clientMessage.payload
        },
        _gateway = {
            processedBy = "APIGateway",
            apiVersion = APIGateway.apiVersion,
            clientVersion = clientMessage.apiVersion or "1.0"
        }
    }
    
    APIGateway.stats.interProcessRequestsGenerated = APIGateway.stats.interProcessRequestsGenerated + 1
    
    return interProcessMessage
end

-- Aggregate multiple inter-process responses into client response
function APIGateway.aggregateResponses(responses, originalClientMessage)
    APIGateway.stats.responseAggregations = APIGateway.stats.responseAggregations + 1
    
    if not responses or #responses == 0 then
        return APIGateway._createErrorResponse("No responses received", originalClientMessage)
    end
    
    -- Single response - direct translation
    if #responses == 1 then
        return APIGateway._translateInterProcessToClient(responses[1], originalClientMessage)
    end
    
    -- Multiple responses - aggregation required
    local aggregatedResponse = {
        success = true,
        correlationId = responses[1].correlationId,
        timestamp = msg.Timestamp,
        results = {},
        metadata = {
            responseCount = #responses,
            aggregatedBy = "APIGateway",
            originalAction = originalClientMessage.action or originalClientMessage.type
        }
    }
    
    -- Process each response
    for i, response in ipairs(responses) do
        local clientResponse = APIGateway._translateInterProcessToClient(response, originalClientMessage)
        
        -- Check for errors
        if not clientResponse.success then
            aggregatedResponse.success = false
            aggregatedResponse.error = clientResponse.error or "Response aggregation failed"
        end
        
        aggregatedResponse.results[i] = clientResponse
    end
    
    -- Apply response filtering and formatting
    aggregatedResponse = APIGateway._applyClientResponseFormat(aggregatedResponse, originalClientMessage)
    
    return aggregatedResponse
end

-- Validate client message format
function APIGateway.validateClientMessage(clientMessage)
    if not clientMessage or type(clientMessage) ~= "table" then
        return false, "Client message must be a table"
    end
    
    if not clientMessage.action and not clientMessage.type then
        return false, "Client message must have 'action' or 'type' field"
    end
    
    if not clientMessage.playerId and not (clientMessage.data and clientMessage.data.playerId) then
        return false, "Player ID is required in client message"
    end
    
    return true
end

-- Validate API version compatibility
function APIGateway.validateAPIVersion(clientVersion)
    if not clientVersion then
        return true, "No version specified, using default"
    end
    
    for _, supportedVersion in ipairs(APIGateway.supportedVersions) do
        if clientVersion == supportedVersion then
            return true, "Version compatible"
        end
    end
    
    return false, "Unsupported API version: " .. clientVersion
end

-- Add support for new API version
function APIGateway.addSupportedVersion(version)
    if not version then
        return false
    end
    
    for _, supportedVersion in ipairs(APIGateway.supportedVersions) do
        if supportedVersion == version then
            return true -- Already supported
        end
    end
    
    table.insert(APIGateway.supportedVersions, version)
    return true
end

-- Get API gateway statistics
function APIGateway.getStatistics()
    return {
        apiVersion = APIGateway.apiVersion,
        supportedVersions = APIGateway.supportedVersions,
        stats = APIGateway.stats,
        routingTableSize = APIGateway._getTableSize(APIGateway.CLIENT_ROUTING_TABLE)
    }
end

-- Private helper functions

function APIGateway._generateSessionId(playerId)
    return "session_" .. playerId .. "id_" .. msg.Timestamp
end

function APIGateway._getTargetProcessType(operationType)
    -- Use MessageRouter's routing logic to determine target process type
    local routeInfo = MessageRouter.getRouteInfo(operationType)
    return routeInfo and routeInfo.targetProcessType or ProcessAuthenticator.PROCESS_TYPES.COORDINATOR
end

function APIGateway._selectRoutingStrategy(operationType, clientMessage)
    -- Battle operations benefit from capability matching
    if string.find(operationType, "BATTLE") then
        return MessageRouter.ROUTING_STRATEGIES.CAPABILITY_MATCH
    end
    
    -- State operations benefit from session affinity (least loaded)
    if string.find(operationType, "STATE") or string.find(operationType, "SAVE") or string.find(operationType, "LOAD") then
        return MessageRouter.ROUTING_STRATEGIES.LEAST_LOADED
    end
    
    -- Default to round robin for fair distribution
    return MessageRouter.ROUTING_STRATEGIES.ROUND_ROBIN
end

function APIGateway._getFallbackProcesses(operationType)
    -- For critical operations, provide coordinator as fallback
    local criticalOperations = {
        MessageRouter.OPERATION_TYPES.SAVE_GAME,
        MessageRouter.OPERATION_TYPES.LOAD_GAME,
        MessageRouter.OPERATION_TYPES.SYNC_STATE
    }
    
    for _, criticalOp in ipairs(criticalOperations) do
        if operationType == criticalOp then
            return {ProcessAuthenticator.PROCESS_TYPES.COORDINATOR}
        end
    end
    
    return {}
end

function APIGateway._requiresResponseAggregation(operationType)
    -- Complex queries that might need multiple process responses
    local aggregationOperations = {
        MessageRouter.OPERATION_TYPES.SYNC_STATE,
        MessageRouter.OPERATION_TYPES.POKEMON_UPDATE
    }
    
    for _, aggOp in ipairs(aggregationOperations) do
        if operationType == aggOp then
            return true
        end
    end
    
    return false
end

function APIGateway._requiresStateSync(operationType)
    -- Operations that modify state require synchronization
    local statefulOperations = {
        MessageRouter.OPERATION_TYPES.BATTLE_RESOLUTION,
        MessageRouter.OPERATION_TYPES.POKEMON_UPDATE,
        MessageRouter.OPERATION_TYPES.POKEMON_EVOLUTION,
        MessageRouter.OPERATION_TYPES.SHOP_TRANSACTION,
        MessageRouter.OPERATION_TYPES.SAVE_GAME
    }
    
    for _, stateOp in ipairs(statefulOperations) do
        if operationType == stateOp then
            return true
        end
    end
    
    return false
end

function APIGateway._translateInterProcessToClient(interProcessResponse, originalClientMessage)
    local clientResponse = {
        success = interProcessResponse.success or true,
        correlationId = interProcessResponse.correlationId,
        timestamp = interProcessResponse.timestamp or 0,
        data = interProcessResponse.payload or interProcessResponse.result,
        metadata = {
            processedBy = interProcessResponse.targetProcessId or "unknown",
            processingTime = interProcessResponse.processingTime or 0,
            translatedBy = "APIGateway"
        }
    }
    
    -- Include error information if present
    if interProcessResponse.error then
        clientResponse.success = false
        clientResponse.error = interProcessResponse.error
        clientResponse.message = interProcessResponse.message
    end
    
    return clientResponse
end

function APIGateway._applyClientResponseFormat(response, originalClientMessage)
    -- Apply any client-specific response formatting
    -- This maintains compatibility with existing client expectations
    
    if originalClientMessage.responseFormat then
        -- Apply custom formatting if requested
        if originalClientMessage.responseFormat == "compact" then
            return {
                success = response.success,
                data = response.data or response.results,
                correlationId = response.correlationId
            }
        elseif originalClientMessage.responseFormat == "detailed" then
            response.debug = APIGateway.getStatistics()
        end
    end
    
    return response
end

function APIGateway._createErrorResponse(errorMessage, originalClientMessage)
    return {
        success = false,
        error = errorMessage,
        correlationId = MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.CLIENT_REQUEST),
        timestamp = msg.Timestamp,
        originalAction = originalClientMessage and (originalClientMessage.action or originalClientMessage.type) or "unknown"
    }
end

function APIGateway._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return APIGateway