-- API Gateway Handler for Coordinator Process
-- Handles client message processing and protocol translation

local APIGateway = require("coordinator.components.api-gateway")
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")

-- Register client message handler
Handlers.add(
    "client-message",
    Handlers.utils.hasMatchingTag("Action", "CLIENT_MESSAGE"),
    function(msg)
        -- Authenticate message sender
        local authResult = ProcessAuthenticator.validateMessage(msg)
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "CLIENT_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Authentication failed",
                    message = authResult.error
                })
            })
            return
        end

        -- Parse client message
        local clientMessage = json.decode(msg.Data)
        if not clientMessage then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "CLIENT_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid JSON in client message"
                })
            })
            return
        end

        -- Process through API Gateway
        local clientInfo = {
            sender = msg.From,
            timestamp = msg.Timestamp,
            tags = msg.Tags
        }
        
        local interProcessMessage, processingError = APIGateway.processClientMessage(clientMessage, clientInfo)
        if not interProcessMessage then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "CLIENT_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or clientMessage.requestId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Gateway processing failed",
                    message = processingError
                })
            })
            return
        end

        -- Route to appropriate process or handle locally
        local routingContext = interProcessMessage.routing
        
        if routingContext.targetProcessType == ProcessAuthenticator.PROCESS_TYPES.COORDINATOR then
            -- Handle locally in coordinator
            local localHandler = _G["handle_" .. interProcessMessage.operation.type:lower()]
            if localHandler then
                local localResponse = localHandler(interProcessMessage.payload.data, interProcessMessage)
                
                -- Send response back to client
                ao.send({
                    Target = msg.From,
                    Tags = {
                        Action = "CLIENT_RESPONSE",
                        CorrelationId = interProcessMessage.correlation.id
                    },
                    Data = json.encode(APIGateway._translateInterProcessToClient(localResponse, clientMessage))
                })
            else
                -- No local handler available
                ao.send({
                    Target = msg.From,
                    Tags = {
                        Action = "CLIENT_RESPONSE", 
                        CorrelationId = interProcessMessage.correlation.id
                    },
                    Data = json.encode({
                        success = false,
                        error = "Operation not supported locally",
                        operation = interProcessMessage.operation.type
                    })
                })
            end
            
        else
            -- Route to specialized process
            local targetProcess = _selectTargetProcess(routingContext)
            if not targetProcess then
                ao.send({
                    Target = msg.From,
                    Tags = {
                        Action = "CLIENT_RESPONSE",
                        CorrelationId = interProcessMessage.correlation.id  
                    },
                    Data = json.encode({
                        success = false,
                        error = "No available process for operation",
                        processType = routingContext.targetProcessType
                    })
                })
                return
            end

            -- Update correlation with routing info
            MessageCorrelator.updateCorrelationStatus(
                interProcessMessage.correlation.id, 
                MessageCorrelator.MESSAGE_STATUS.PROCESSING
            )

            -- Store client info for response handling
            _storeClientContext(interProcessMessage.correlation.id, {
                clientId = msg.From,
                originalMessage = clientMessage,
                routingInfo = routingContext
            })

            -- Forward to target process
            ao.send({
                Target = targetProcess.processId,
                Tags = {
                    Action = "INTER_PROCESS_MESSAGE",
                    CorrelationId = interProcessMessage.correlation.id,
                    OperationType = interProcessMessage.operation.type,
                    Priority = interProcessMessage.operation.priority
                },
                Data = json.encode(interProcessMessage)
            })
        end
    end
)

-- Handle inter-process responses for client requests  
Handlers.add(
    "inter-process-response",
    Handlers.utils.hasMatchingTag("Action", "INTER_PROCESS_RESPONSE"),
    function(msg)
        local correlationId = msg.Tags.CorrelationId
        if not correlationId then
            print("[APIGatewayHandler] Received inter-process response without correlation ID")
            return
        end

        -- Retrieve stored client context
        local clientContext = _getClientContext(correlationId)
        if not clientContext then
            print("[APIGatewayHandler] No client context found for correlation: " .. correlationId)
            return
        end

        -- Parse inter-process response
        local interProcessResponse = json.decode(msg.Data)
        if not interProcessResponse then
            print("[APIGatewayHandler] Invalid JSON in inter-process response")
            return
        end

        -- Update correlation status
        local responseStatus = interProcessResponse.success and 
                              MessageCorrelator.MESSAGE_STATUS.COMPLETED or 
                              MessageCorrelator.MESSAGE_STATUS.FAILED
        MessageCorrelator.updateCorrelationStatus(correlationId, responseStatus)

        -- Check if aggregation is required
        if clientContext.routingInfo.requiresAggregation then
            -- Store response and check if all responses received
            _storeProcessResponse(correlationId, interProcessResponse)
            
            if _allResponsesReceived(correlationId, clientContext) then
                local allResponses = _getAllResponses(correlationId)
                local aggregatedResponse = APIGateway.aggregateResponses(allResponses, clientContext.originalMessage)
                
                -- Send aggregated response to client
                ao.send({
                    Target = clientContext.clientId,
                    Tags = {
                        Action = "CLIENT_RESPONSE",
                        CorrelationId = correlationId
                    },
                    Data = json.encode(aggregatedResponse)
                })
                
                -- Cleanup context
                _cleanupClientContext(correlationId)
            end
        else
            -- Single response - direct translation and forwarding
            local clientResponse = APIGateway._translateInterProcessToClient(interProcessResponse, clientContext.originalMessage)
            
            ao.send({
                Target = clientContext.clientId,
                Tags = {
                    Action = "CLIENT_RESPONSE",
                    CorrelationId = correlationId
                },
                Data = json.encode(clientResponse)
            })
            
            -- Cleanup context
            _cleanupClientContext(correlationId)
        end
    end
)

-- API Gateway status and statistics handler
Handlers.add(
    "gateway-status",
    Handlers.utils.hasMatchingTag("Action", "GATEWAY_STATUS"),
    function(msg)
        local stats = APIGateway.getStatistics()
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "GATEWAY_STATUS_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "status-query"
            },
            Data = json.encode({
                success = true,
                data = stats,
                timestamp = 0
            })
        })
    end
)

-- Private helper functions and storage

-- Client context storage for tracking active requests
local clientContexts = {}
local processResponses = {}

local function _selectTargetProcess(routingContext)
    -- Get available processes for target type
    local availableProcesses = ProcessAuthenticator.listRegisteredProcesses(routingContext.targetProcessType)
    if not availableProcesses or _getTableSize(availableProcesses) == 0 then
        return nil
    end

    -- Apply routing strategy
    local processIds = {}
    for processId, _ in pairs(availableProcesses) do
        table.insert(processIds, processId)
    end

    local selectedProcessId
    if routingContext.routingStrategy == "ROUND_ROBIN" then
        selectedProcessId = processIds[1] -- Simplified selection
    elseif routingContext.routingStrategy == "LEAST_LOADED" then
        selectedProcessId = processIds[1] -- TODO: Implement load tracking
    else
        selectedProcessId = processIds[1] -- Default to first available
    end

    return {
        processId = selectedProcessId,
        processType = routingContext.targetProcessType,
        capabilities = availableProcesses[selectedProcessId].capabilities
    }
end

local function _storeClientContext(correlationId, context)
    clientContexts[correlationId] = {
        clientId = context.clientId,
        originalMessage = context.originalMessage,
        routingInfo = context.routingInfo,
        createdAt = 0,
        responsesReceived = 0,
        expectedResponses = 1
    }
    
    -- Increase expected responses if aggregation required
    if context.routingInfo.requiresAggregation then
        clientContexts[correlationId].expectedResponses = _calculateExpectedResponses(context.routingInfo)
    end
end

local function _getClientContext(correlationId)
    return clientContexts[correlationId]
end

local function _cleanupClientContext(correlationId)
    clientContexts[correlationId] = nil
    processResponses[correlationId] = nil
end

local function _storeProcessResponse(correlationId, response)
    if not processResponses[correlationId] then
        processResponses[correlationId] = {}
    end
    table.insert(processResponses[correlationId], response)
    
    -- Update context
    if clientContexts[correlationId] then
        clientContexts[correlationId].responsesReceived = clientContexts[correlationId].responsesReceived + 1
    end
end

local function _getAllResponses(correlationId)
    return processResponses[correlationId] or {}
end

local function _allResponsesReceived(correlationId, clientContext)
    return clientContext.responsesReceived >= clientContext.expectedResponses
end

local function _calculateExpectedResponses(routingInfo)
    -- For now, assume single response even for aggregated operations
    -- This can be enhanced to support true multi-process aggregation
    return 1
end

local function _getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

print("[APIGatewayHandler] API Gateway handlers registered")