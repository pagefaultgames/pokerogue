-- Deployment Handler
-- Handles deployment request processing, validation, and coordination

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local DeploymentOrchestrator = require("coordinator.components.deployment-orchestrator")

local DeploymentHandler = {
    -- Handler state
    state = nil,
    
    -- Request validation rules
    validationRules = {
        deploymentRequest = {
            requiredFields = {"targetProcesses"},
            optionalFields = {"deploymentStrategy", "configuration", "rollbackEnabled", "healthCheckTimeout", "adminUserId"}
        },
        healthCheck = {
            requiredFields = {"deploymentId"},
            optionalFields = {"checkType", "timeoutSeconds"}
        },
        rollbackRequest = {
            requiredFields = {"deploymentId"},
            optionalFields = {"reason", "adminUserId"}
        }
    }
}

-- Initialize deployment handler
function DeploymentHandler.initialize(processState)
    DeploymentHandler.state = processState
    print("[DeploymentHandler] Deployment handler initialized")
end

-- Handle deployment request
function DeploymentHandler.handleDeploymentRequest(msg)
    -- Parse message data
    local success, requestData = pcall(function()
        return require('json').decode(msg.Data)
    end)
    
    if not success then
        return {
            success = false,
            error = "Invalid JSON in deployment request",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Extract deployment request
    local deploymentRequest = requestData.deployRequest
    if not deploymentRequest then
        return {
            success = false,
            error = "Missing deployment request data",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Authenticate request
    local authResult = DeploymentHandler._authenticateRequest(msg, requestData.processAuth)
    if not authResult.success then
        return {
            success = false,
            error = "Authentication failed: " .. authResult.error,
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Validate deployment request
    local validationResult = DeploymentHandler._validateRequest(deploymentRequest, "deploymentRequest")
    if not validationResult.success then
        return {
            success = false,
            error = "Validation failed: " .. validationResult.error,
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Add authentication info to request
    deploymentRequest.adminUserId = authResult.userId
    deploymentRequest.correlationId = msg.Tags.CorrelationId or MessageCorrelator.generateId()
    
    -- Check deployment limits
    if DeploymentHandler._getActiveDeploymentCount() >= DeploymentHandler.state.config.maxConcurrentDeployments then
        return {
            success = false,
            error = "Maximum concurrent deployments reached: " .. DeploymentHandler.state.config.maxConcurrentDeployments,
            correlationId = deploymentRequest.correlationId
        }
    end
    
    -- Execute deployment through orchestrator
    local deploymentResult = DeploymentOrchestrator.orchestrateDeployment(deploymentRequest)
    
    -- Update process statistics
    DeploymentHandler._updateDeploymentStatistics(deploymentResult)
    
    -- Log deployment initiation
    print("[DeploymentHandler] Deployment initiated: " .. deploymentResult.deploymentId .. 
          " - Strategy: " .. (deploymentRequest.deploymentStrategy or "DEPENDENCY_AWARE") ..
          " - Processes: " .. #deploymentRequest.targetProcesses)
    
    return {
        success = deploymentResult.success,
        deploymentId = deploymentResult.deploymentId,
        status = deploymentResult.status,
        deploymentPlan = deploymentResult.deploymentPlan,
        processResults = deploymentResult.processResults,
        rollbackAvailable = deploymentResult.rollbackAvailable,
        correlationId = deploymentRequest.correlationId,
        error = deploymentResult.error
    }
end

-- Handle health validation request
function DeploymentHandler.handleHealthValidation(msg)
    -- Parse message data
    local success, requestData = pcall(function()
        return require('json').decode(msg.Data)
    end)
    
    if not success then
        return {
            success = false,
            error = "Invalid JSON in health validation request",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    local healthCheck = requestData.healthCheck
    if not healthCheck then
        return {
            success = false,
            error = "Missing health check data",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Validate health check request
    local validationResult = DeploymentHandler._validateRequest(healthCheck, "healthCheck")
    if not validationResult.success then
        return {
            success = false,
            error = "Validation failed: " .. validationResult.error,
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Get deployment status
    local deploymentStatus = DeploymentOrchestrator.getDeploymentStatus(healthCheck.deploymentId)
    if not deploymentStatus.success then
        return {
            success = false,
            error = deploymentStatus.error,
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Perform health validation
    local healthResult = DeploymentHandler._performHealthValidation(healthCheck, deploymentStatus.deployment)
    
    return {
        success = healthResult.success,
        deploymentId = healthCheck.deploymentId,
        healthStatus = healthResult.healthStatus,
        processHealthResults = healthResult.processHealthResults,
        validationTime = 0,
        correlationId = msg.Tags.CorrelationId,
        error = healthResult.error
    }
end

-- Handle rollback request
function DeploymentHandler.handleRollbackRequest(msg)
    -- Parse message data
    local success, requestData = pcall(function()
        return require('json').decode(msg.Data)
    end)
    
    if not success then
        return {
            success = false,
            error = "Invalid JSON in rollback request",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    local rollbackRequest = requestData.rollbackRequest
    if not rollbackRequest then
        return {
            success = false,
            error = "Missing rollback request data",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Authenticate request
    local authResult = DeploymentHandler._authenticateRequest(msg, requestData.processAuth)
    if not authResult.success then
        return {
            success = false,
            error = "Authentication failed: " .. authResult.error,
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Validate rollback request
    local validationResult = DeploymentHandler._validateRequest(rollbackRequest, "rollbackRequest")
    if not validationResult.success then
        return {
            success = false,
            error = "Validation failed: " .. validationResult.error,
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Add authentication info to request
    rollbackRequest.adminUserId = authResult.userId
    
    -- Check if deployment exists and can be rolled back
    local deploymentStatus = DeploymentOrchestrator.getDeploymentStatus(rollbackRequest.deploymentId)
    if not deploymentStatus.success then
        return {
            success = false,
            error = deploymentStatus.error,
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    local deployment = deploymentStatus.deployment
    if not deployment.rollbackEnabled then
        return {
            success = false,
            error = "Rollback not enabled for deployment: " .. rollbackRequest.deploymentId,
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Execute rollback
    local rollbackResult = DeploymentOrchestrator.cancelDeployment(rollbackRequest.deploymentId, rollbackRequest.reason)
    
    -- Update statistics
    if rollbackResult.success then
        DeploymentHandler.state.statistics.rolledBackDeployments = 
            DeploymentHandler.state.statistics.rolledBackDeployments + 1
    end
    
    print("[DeploymentHandler] Rollback executed: " .. rollbackRequest.deploymentId .. 
          " - Reason: " .. (rollbackRequest.reason or "Manual rollback"))
    
    return {
        success = rollbackResult.success,
        deploymentId = rollbackRequest.deploymentId,
        rollbackResult = rollbackResult.rollbackResult,
        correlationId = msg.Tags.CorrelationId,
        error = rollbackResult.error
    }
end

-- Private helper functions

function DeploymentHandler._authenticateRequest(msg, processAuth)
    if not processAuth then
        return { success = false, error = "Authentication data required" }
    end
    
    -- Authenticate using ProcessAuthenticator
    local authResult = ProcessAuthenticator.authenticateRequest({
        sourceProcessId = processAuth.sourceProcessId,
        authToken = processAuth.authToken,
        timestamp = processAuth.timestamp,
        requiredLevel = "ADMIN"
    })
    
    if not authResult.success then
        return authResult
    end
    
    return {
        success = true,
        userId = authResult.userId or processAuth.sourceProcessId,
        authLevel = authResult.authLevel
    }
end

function DeploymentHandler._validateRequest(requestData, requestType)
    local rules = DeploymentHandler.validationRules[requestType]
    if not rules then
        return { success = false, error = "Unknown request type: " .. requestType }
    end
    
    -- Check required fields
    for _, field in ipairs(rules.requiredFields) do
        if not requestData[field] then
            return { success = false, error = "Required field missing: " .. field }
        end
    end
    
    -- Validate specific field types and values
    if requestType == "deploymentRequest" then
        -- Validate target processes
        if type(requestData.targetProcesses) ~= "table" or #requestData.targetProcesses == 0 then
            return { success = false, error = "targetProcesses must be a non-empty array" }
        end
        
        -- Validate deployment strategy if provided
        if requestData.deploymentStrategy then
            local validStrategies = {
                "SEQUENTIAL", "PARALLEL", "DEPENDENCY_AWARE", "BLUE_GREEN", "ROLLING"
            }
            local validStrategy = false
            for _, strategy in ipairs(validStrategies) do
                if requestData.deploymentStrategy == strategy then
                    validStrategy = true
                    break
                end
            end
            if not validStrategy then
                return { success = false, error = "Invalid deployment strategy: " .. requestData.deploymentStrategy }
            end
        end
        
        -- Validate configuration if provided
        if requestData.configuration and type(requestData.configuration) ~= "table" then
            return { success = false, error = "configuration must be a table" }
        end
        
    elseif requestType == "healthCheck" then
        -- Validate deployment ID format
        if type(requestData.deploymentId) ~= "string" or requestData.deploymentId == "" then
            return { success = false, error = "deploymentId must be a non-empty string" }
        end
        
        -- Validate timeout if provided
        if requestData.timeoutSeconds and (type(requestData.timeoutSeconds) ~= "number" or requestData.timeoutSeconds <= 0) then
            return { success = false, error = "timeoutSeconds must be a positive number" }
        end
        
    elseif requestType == "rollbackRequest" then
        -- Validate deployment ID format
        if type(requestData.deploymentId) ~= "string" or requestData.deploymentId == "" then
            return { success = false, error = "deploymentId must be a non-empty string" }
        end
    end
    
    return { success = true }
end

function DeploymentHandler._performHealthValidation(healthCheck, deployment)
    -- Determine processes to check
    local processesToCheck = deployment.targetProcesses
    local processHealthResults = {}
    local overallHealthy = true
    
    for _, processId in ipairs(processesToCheck) do
        -- Simulate health check - in real implementation would send actual health check messages
        local processHealthResult = {
            processId = processId,
            healthStatus = "HEALTHY", -- Simulated - would be determined by actual health check
            responseTime = math.random(50, 200), -- Simulated response time
            healthCheckTime = 0,
            success = true
        }
        
        processHealthResults[processId] = processHealthResult
        
        if processHealthResult.healthStatus ~= "HEALTHY" then
            overallHealthy = false
        end
    end
    
    return {
        success = overallHealthy,
        healthStatus = overallHealthy and "HEALTHY" or "DEGRADED",
        processHealthResults = processHealthResults,
        totalProcesses = #processesToCheck,
        healthyProcesses = overallHealthy and #processesToCheck or 0
    }
end

function DeploymentHandler._updateDeploymentStatistics(deploymentResult)
    DeploymentHandler.state.statistics.totalDeployments = 
        DeploymentHandler.state.statistics.totalDeployments + 1
    
    if deploymentResult.success then
        DeploymentHandler.state.statistics.successfulDeployments = 
            DeploymentHandler.state.statistics.successfulDeployments + 1
    else
        DeploymentHandler.state.statistics.failedDeployments = 
            DeploymentHandler.state.statistics.failedDeployments + 1
    end
    
    -- Update average deployment time (simplified calculation)
    local currentTime = 0
    local estimatedDuration = 60 -- Simplified - would track actual duration
    local currentAvg = DeploymentHandler.state.statistics.averageDeploymentTime
    local totalDeployments = DeploymentHandler.state.statistics.totalDeployments
    
    if totalDeployments <= 1 then
        DeploymentHandler.state.statistics.averageDeploymentTime = estimatedDuration
    else
        DeploymentHandler.state.statistics.averageDeploymentTime = 
            ((currentAvg * (totalDeployments - 1)) + estimatedDuration) / totalDeployments
    end
end

function DeploymentHandler._getActiveDeploymentCount()
    local count = 0
    for _ in pairs(DeploymentHandler.state.activeDeployments) do
        count = count + 1
    end
    return count
end

return DeploymentHandler