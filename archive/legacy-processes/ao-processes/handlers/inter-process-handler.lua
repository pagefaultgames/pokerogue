-- Inter-Process Communication Handler
-- Main handler for secure communication between AO processes

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local MessageRouter = require("game-logic.process-coordination.message-router")
local BackwardCompatibility = require("game-logic.process-coordination.backward-compatibility")
local PerformanceMonitor = require("game-logic.process-coordination.performance-monitor")
local ErrorHandler = require("handlers.error-handler")

local InterProcessHandler = {}

-- Handler registration function called by main process
function InterProcessHandler.initialize()
    -- Initialize process coordination systems
    MessageCorrelator.initialize()
    ProcessAuthenticator.initialize()
    
    -- Register all inter-process message handlers
    registerHandler("Inter-Process-Register", 
                   Handlers.utils.hasMatchingTag("Action", "Inter-Process-Register"),
                   InterProcessHandler.handleProcessRegistration)
    
    registerHandler("Inter-Process-Auth-Token",
                   Handlers.utils.hasMatchingTag("Action", "Inter-Process-Auth-Token"), 
                   InterProcessHandler.handleAuthTokenRequest)
    
    registerHandler("Inter-Process-Message",
                   Handlers.utils.hasMatchingTag("Action", "Inter-Process-Message"),
                   InterProcessHandler.handleInterProcessMessage)
    
    registerHandler("Inter-Process-Heartbeat",
                   Handlers.utils.hasMatchingTag("Action", "Inter-Process-Heartbeat"),
                   InterProcessHandler.handleProcessHeartbeat)
    
    registerHandler("Inter-Process-Query",
                   Handlers.utils.hasMatchingTag("Action", "Inter-Process-Query"),
                   InterProcessHandler.handleProcessQuery)
    
    print("[InterProcessHandler] Inter-process communication handlers initialized")
end

-- Handle process registration requests
function InterProcessHandler.handleProcessRegistration(msg)
    local correlationId = msg.Tags["Correlation-ID"] or MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.CLIENT_REQUEST)
    
    -- Update correlation status
    MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.PROCESSING)
    
    local success, response = pcall(function()
        -- Parse registration data
        local registrationData = json.decode(msg.Data or "{}")
        
        if not registrationData.processId or not registrationData.processType or 
           not registrationData.walletAddress or not registrationData.capabilities then
            error("Missing required registration fields: processId, processType, walletAddress, capabilities")
        end
        
        -- Register the process
        local registerSuccess, errorMsg = ProcessAuthenticator.registerProcess(
            registrationData.processId,
            registrationData.processType,
            registrationData.walletAddress,
            registrationData.capabilities
        )
        
        if not registerSuccess then
            error("Process registration failed: " .. tostring(errorMsg))
        end
        
        -- Generate initial authentication token
        local token, tokenError = ProcessAuthenticator.generateAuthToken(
            registrationData.processId,
            registrationData.walletAddress
        )
        
        if not token then
            error("Token generation failed: " .. tostring(tokenError))
        end
        
        return {
            success = true,
            processId = registrationData.processId,
            authToken = token,
            message = "Process successfully registered and authenticated"
        }
    end)
    
    if success then
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.COMPLETED)
        
        msg.reply({
            Target = msg.From,
            Tags = {
                Action = "Inter-Process-Register-Response",
                Success = "true",
                ["Correlation-ID"] = correlationId
            },
            Data = json.encode(response)
        })
    else
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.FAILED, response)
        
        local errorResponse = ErrorHandler.createError(
            ErrorHandler.ERROR_TYPES.HANDLER,
            response,
            ErrorHandler.ERROR_CODES.PROCESS_REGISTRATION_FAILED,
            correlationId
        )
        
        ErrorHandler.sendErrorResponse(msg, errorResponse)
    end
end

-- Handle authentication token requests
function InterProcessHandler.handleAuthTokenRequest(msg)
    local correlationId = msg.Tags["Correlation-ID"] or MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.CLIENT_REQUEST)
    
    MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.PROCESSING)
    
    local success, response = pcall(function()
        local tokenRequest = json.decode(msg.Data or "{}")
        
        if not tokenRequest.processId or not tokenRequest.walletAddress then
            error("Missing required token request fields: processId, walletAddress")
        end
        
        local token, errorMsg = ProcessAuthenticator.generateAuthToken(
            tokenRequest.processId,
            tokenRequest.walletAddress,
            tokenRequest.expirationTime
        )
        
        if not token then
            error("Token generation failed: " .. tostring(errorMsg))
        end
        
        return {
            success = true,
            authToken = token,
            message = "Authentication token generated successfully"
        }
    end)
    
    if success then
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.COMPLETED)
        
        msg.reply({
            Target = msg.From,
            Tags = {
                Action = "Inter-Process-Auth-Token-Response",
                Success = "true",
                ["Correlation-ID"] = correlationId
            },
            Data = json.encode(response)
        })
    else
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.FAILED, response)
        
        local errorResponse = ErrorHandler.createError(
            ErrorHandler.ERROR_TYPES.HANDLER,
            response,
            ErrorHandler.ERROR_CODES.TOKEN_GENERATION_FAILED,
            correlationId
        )
        
        ErrorHandler.sendErrorResponse(msg, errorResponse)
    end
end

-- Handle inter-process messages with full authentication and correlation
function InterProcessHandler.handleInterProcessMessage(msg)
    local correlationId = msg.Tags["Correlation-ID"] or MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
    
    -- Start performance measurement
    PerformanceMonitor.startMeasurement(correlationId, "INTER_PROCESS_MESSAGE", msg.From)
    
    MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.PROCESSING)
    
    local success, response = pcall(function()
        local messageData = json.decode(msg.Data or "{}")
        
        -- Check if this is a legacy message and adapt if necessary
        if BackwardCompatibility.isLegacyMessage(messageData) then
            local adaptedMessage, adaptError = BackwardCompatibility.adaptLegacyMessage(messageData, msg.From, msg.Target)
            if not adaptedMessage then
                error("Failed to adapt legacy message: " .. tostring(adaptError))
            end
            messageData = adaptedMessage
        end
        
        -- Validate message format (now guaranteed to be new format)
        if not messageData.correlation or not messageData.auth or not messageData.operation or not messageData.payload then
            error("Invalid inter-process message format. Required: correlation, auth, operation, payload")
        end
        
        -- Validate correlation metadata
        local correlationValid, correlationError = MessageCorrelator.validateCorrelationMetadata(messageData.correlation)
        if not correlationValid then
            error("Invalid correlation metadata: " .. tostring(correlationError))
        end
        
        -- Validate authentication
        local authValid, authError = ProcessAuthenticator.validateProcessAuth(
            messageData.correlation.origin,
            messageData.correlation.target,
            messageData.operation.type,
            messageData.auth
        )
        
        if not authValid then
            error("Authentication validation failed: " .. tostring(authError))
        end
        
        -- Create correlation tracking for this inter-process message
        local ipcCorrelationId = MessageCorrelator.createCorrelation(
            messageData.correlation.origin,
            messageData.correlation.target,
            messageData.operation.type,
            messageData.correlation.parent
        )
        
        -- Process the inter-process operation based on type
        local operationResult = InterProcessHandler.processOperation(messageData.operation, messageData.payload)
        
        MessageCorrelator.updateCorrelationStatus(ipcCorrelationId, MessageCorrelator.MESSAGE_STATUS.COMPLETED)
        
        return {
            success = true,
            correlationId = ipcCorrelationId,
            result = operationResult,
            message = "Inter-process message processed successfully"
        }
    end)
    
    if success then
        -- End performance measurement with success
        PerformanceMonitor.endMeasurement(correlationId, true)
        
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.COMPLETED)
        
        msg.reply({
            Target = msg.From,
            Tags = {
                Action = "Inter-Process-Message-Response",
                Success = "true",
                ["Correlation-ID"] = correlationId
            },
            Data = json.encode(response)
        })
    else
        -- End performance measurement with failure
        PerformanceMonitor.endMeasurement(correlationId, false, "INTER_PROCESS_MESSAGE_FAILED")
        
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.FAILED, response)
        
        local errorResponse = ErrorHandler.createError(
            ErrorHandler.ERROR_TYPES.HANDLER,
            response,
            ErrorHandler.ERROR_CODES.INTER_PROCESS_MESSAGE_FAILED,
            correlationId
        )
        
        ErrorHandler.sendErrorResponse(msg, errorResponse)
    end
end

-- Handle process heartbeat messages
function InterProcessHandler.handleProcessHeartbeat(msg)
    local correlationId = msg.Tags["Correlation-ID"] or MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.CLIENT_REQUEST)
    
    MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.PROCESSING)
    
    local success, response = pcall(function()
        local heartbeatData = json.decode(msg.Data or "{}")
        
        if not heartbeatData.processId then
            error("Missing processId in heartbeat message")
        end
        
        local heartbeatSuccess = ProcessAuthenticator.updateProcessHeartbeat(heartbeatData.processId)
        
        if not heartbeatSuccess then
            error("Failed to update heartbeat for process: " .. heartbeatData.processId)
        end
        
        return {
            success = true,
            processId = heartbeatData.processId,
            timestamp = msg.Timestamp,
            message = "Heartbeat updated successfully"
        }
    end)
    
    if success then
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.COMPLETED)
        
        msg.reply({
            Target = msg.From,
            Tags = {
                Action = "Inter-Process-Heartbeat-Response",
                Success = "true",
                ["Correlation-ID"] = correlationId
            },
            Data = json.encode(response)
        })
    else
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.FAILED, response)
        
        local errorResponse = ErrorHandler.createError(
            ErrorHandler.ERROR_TYPES.HANDLER,
            response,
            ErrorHandler.ERROR_CODES.HEARTBEAT_UPDATE_FAILED,
            correlationId
        )
        
        ErrorHandler.sendErrorResponse(msg, errorResponse)
    end
end

-- Handle process query requests (discovery, status, statistics)
function InterProcessHandler.handleProcessQuery(msg)
    local correlationId = msg.Tags["Correlation-ID"] or MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.CLIENT_REQUEST)
    
    MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.PROCESSING)
    
    local success, response = pcall(function()
        local queryData = json.decode(msg.Data or "{}")
        
        if not queryData.queryType then
            error("Missing queryType in query message")
        end
        
        local result
        
        if queryData.queryType == "process-info" then
            if not queryData.processId then
                error("processId required for process-info query")
            end
            result = ProcessAuthenticator.getProcessInfo(queryData.processId)
            if not result then
                error("Process not found: " .. queryData.processId)
            end
            
        elseif queryData.queryType == "list-processes" then
            result = ProcessAuthenticator.listRegisteredProcesses(queryData.filterByType, queryData.filterByAuthLevel)
            
        elseif queryData.queryType == "auth-statistics" then
            result = ProcessAuthenticator.getStatistics()
            
        elseif queryData.queryType == "correlation-statistics" then
            result = MessageCorrelator.getStatistics()
            
        elseif queryData.queryType == "correlation-chain" then
            if not queryData.correlationId then
                error("correlationId required for correlation-chain query")
            end
            result = MessageCorrelator.getCorrelationChain(queryData.correlationId)
            if not result then
                error("Correlation chain not found: " .. queryData.correlationId)
            end
            
        else
            error("Unknown query type: " .. queryData.queryType)
        end
        
        return {
            success = true,
            queryType = queryData.queryType,
            result = result,
            message = "Query processed successfully"
        }
    end)
    
    if success then
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.COMPLETED)
        
        msg.reply({
            Target = msg.From,
            Tags = {
                Action = "Inter-Process-Query-Response",
                Success = "true",
                ["Correlation-ID"] = correlationId
            },
            Data = json.encode(response)
        })
    else
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.FAILED, response)
        
        local errorResponse = ErrorHandler.createError(
            ErrorHandler.ERROR_TYPES.HANDLER,
            response,
            ErrorHandler.ERROR_CODES.QUERY_PROCESSING_FAILED,
            correlationId
        )
        
        ErrorHandler.sendErrorResponse(msg, errorResponse)
    end
end

-- Process different types of inter-process operations
function InterProcessHandler.processOperation(operation, payload)
    local operationType = operation.type
    
    -- Route message using the MessageRouter
    local routingResult, routingError = MessageRouter.routeMessage(operationType, payload, operation.priority)
    
    if not routingResult then
        return {
            success = false,
            error = "ROUTING_FAILED",
            message = routingError or "Failed to route operation",
            operationType = operationType,
            timestamp = msg.Timestamp
        }
    end
    
    return {
        success = true,
        operationType = operationType,
        targetProcessId = routingResult.targetProcessId,
        targetProcessType = routingResult.targetProcessType,
        routingStrategy = routingResult.routingStrategy,
        correlationId = routingResult.correlationId,
        processed = true,
        timestamp = msg.Timestamp,
        note = "Operation successfully routed using MessageRouter"
    }
end

return InterProcessHandler