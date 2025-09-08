-- Blue-Green Manager Component
-- Handles blue-green deployment strategy with traffic routing and zero-downtime updates

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local MessageRouter = require("game-logic.process-coordination.message-router")

local BlueGreenManager = {
    -- Configuration
    config = {
        healthCheckInterval = 30,
        healthCheckTimeout = 60,
        trafficSwitchTimeout = 300,
        rollbackOnHealthFailure = true,
        maxVersionsPerProcess = 2
    },
    
    -- Active blue-green deployments
    blueGreenDeployments = {},
    
    -- Process version tracking
    processVersions = {},
    
    -- Traffic routing state
    trafficRouting = {},
    
    -- Blue-green deployment phases
    PHASES = {
        PREPARING = "PREPARING",
        DEPLOYING_GREEN = "DEPLOYING_GREEN",
        HEALTH_VALIDATION = "HEALTH_VALIDATION",
        TRAFFIC_SWITCHING = "TRAFFIC_SWITCHING",
        MONITORING = "MONITORING",
        COMPLETED = "COMPLETED",
        FAILED = "FAILED",
        ROLLING_BACK = "ROLLING_BACK",
        ROLLED_BACK = "ROLLED_BACK"
    },
    
    -- Traffic split strategies
    TRAFFIC_STRATEGIES = {
        INSTANT = "INSTANT", -- Immediate 100% switch
        GRADUAL = "GRADUAL", -- Gradual percentage-based switch
        CANARY = "CANARY",   -- Small percentage first, then full
        A_B_TEST = "A_B_TEST" -- Maintain split for testing
    }
}

-- Initialize blue-green manager
function BlueGreenManager.initialize(config)
    if config then
        for key, value in pairs(config) do
            if BlueGreenManager.config[key] ~= nil then
                BlueGreenManager.config[key] = value
            end
        end
    end
    
    BlueGreenManager.blueGreenDeployments = {}
    BlueGreenManager.processVersions = {}
    BlueGreenManager.trafficRouting = {}
    
    print("[BlueGreenManager] Blue-green deployment manager initialized")
end

-- Handle blue-green deployment request
function BlueGreenManager.handleBlueGreenRequest(msg)
    -- Parse message data
    local success, requestData = pcall(function()
        return require('json').decode(msg.Data)
    end)
    
    if not success then
        return {
            success = false,
            error = "Invalid JSON in blue-green request",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    local blueGreenRequest = requestData.blueGreenRequest
    if not blueGreenRequest then
        return {
            success = false,
            error = "Missing blue-green request data",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Validate blue-green request
    local validationResult = BlueGreenManager._validateBlueGreenRequest(blueGreenRequest)
    if not validationResult.success then
        return {
            success = false,
            error = "Validation failed: " .. validationResult.error,
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Execute blue-green deployment
    local deploymentResult = BlueGreenManager._executeBlueGreenDeployment(blueGreenRequest)
    
    return {
        success = deploymentResult.success,
        deploymentId = deploymentResult.deploymentId,
        phase = deploymentResult.phase,
        processVersions = deploymentResult.processVersions,
        trafficRouting = deploymentResult.trafficRouting,
        correlationId = msg.Tags.CorrelationId,
        error = deploymentResult.error
    }
end

-- Execute blue-green deployment
function BlueGreenManager._executeBlueGreenDeployment(request)
    local deploymentId = MessageCorrelator.generateId()
    local currentTime = 0
    
    local deployment = {
        id = deploymentId,
        phase = BlueGreenManager.PHASES.PREPARING,
        targetProcesses = request.targetProcesses,
        newVersion = request.newVersion,
        trafficStrategy = request.trafficStrategy or BlueGreenManager.TRAFFIC_STRATEGIES.GRADUAL,
        healthCheckTimeout = request.healthCheckTimeout or BlueGreenManager.config.healthCheckTimeout,
        rollbackOnFailure = request.rollbackOnFailure ~= false,
        startTime = currentTime,
        processResults = {},
        trafficSwitchPlan = {},
        adminUserId = request.adminUserId
    }
    
    -- Register deployment
    BlueGreenManager.blueGreenDeployments[deploymentId] = deployment
    
    -- Phase 1: Prepare green environment
    local prepareResult = BlueGreenManager._prepareGreenEnvironment(deployment)
    if not prepareResult.success then
        deployment.phase = BlueGreenManager.PHASES.FAILED
        deployment.error = prepareResult.error
        return { success = false, error = prepareResult.error, deploymentId = deploymentId }
    end
    
    deployment.phase = BlueGreenManager.PHASES.DEPLOYING_GREEN
    
    -- Phase 2: Deploy to green environment
    local deployResult = BlueGreenManager._deployToGreenEnvironment(deployment)
    if not deployResult.success then
        deployment.phase = BlueGreenManager.PHASES.FAILED
        deployment.error = deployResult.error
        
        if deployment.rollbackOnFailure then
            BlueGreenManager._rollbackBlueGreenDeployment(deployment)
        end
        
        return { success = false, error = deployResult.error, deploymentId = deploymentId }
    end
    
    deployment.phase = BlueGreenManager.PHASES.HEALTH_VALIDATION
    
    -- Phase 3: Health validation of green environment
    local healthResult = BlueGreenManager._validateGreenEnvironmentHealth(deployment)
    if not healthResult.success then
        deployment.phase = BlueGreenManager.PHASES.FAILED
        deployment.error = healthResult.error
        
        if deployment.rollbackOnFailure then
            BlueGreenManager._rollbackBlueGreenDeployment(deployment)
        end
        
        return { success = false, error = healthResult.error, deploymentId = deploymentId }
    end
    
    deployment.phase = BlueGreenManager.PHASES.TRAFFIC_SWITCHING
    
    -- Phase 4: Switch traffic to green
    local trafficResult = BlueGreenManager._switchTrafficToGreen(deployment)
    if not trafficResult.success then
        deployment.phase = BlueGreenManager.PHASES.FAILED
        deployment.error = trafficResult.error
        
        if deployment.rollbackOnFailure then
            BlueGreenManager._rollbackBlueGreenDeployment(deployment)
        end
        
        return { success = false, error = trafficResult.error, deploymentId = deploymentId }
    end
    
    deployment.phase = BlueGreenManager.PHASES.MONITORING
    
    -- Phase 5: Monitor green environment
    local monitorResult = BlueGreenManager._monitorGreenEnvironment(deployment)
    if monitorResult.success then
        deployment.phase = BlueGreenManager.PHASES.COMPLETED
        deployment.completionTime = 0
        
        -- Cleanup blue environment after successful deployment
        BlueGreenManager._cleanupBlueEnvironment(deployment)
    else
        deployment.phase = BlueGreenManager.PHASES.FAILED
        deployment.error = monitorResult.error
        
        if deployment.rollbackOnFailure then
            BlueGreenManager._rollbackBlueGreenDeployment(deployment)
        end
    end
    
    return {
        success = deployment.phase == BlueGreenManager.PHASES.COMPLETED,
        deploymentId = deploymentId,
        phase = deployment.phase,
        processVersions = deployment.processResults,
        trafficRouting = deployment.trafficSwitchPlan,
        error = deployment.error
    }
end

-- Get blue-green deployment status
function BlueGreenManager.getBlueGreenStatus(deploymentId)
    local deployment = BlueGreenManager.blueGreenDeployments[deploymentId]
    if not deployment then
        return { success = false, error = "Blue-green deployment not found: " .. deploymentId }
    end
    
    return {
        success = true,
        deployment = {
            id = deployment.id,
            phase = deployment.phase,
            targetProcesses = deployment.targetProcesses,
            newVersion = deployment.newVersion,
            trafficStrategy = deployment.trafficStrategy,
            startTime = deployment.startTime,
            completionTime = deployment.completionTime,
            processResults = deployment.processResults,
            trafficSwitchPlan = deployment.trafficSwitchPlan,
            error = deployment.error
        }
    }
end

-- Get traffic routing status
function BlueGreenManager.getTrafficRoutingStatus(processId)
    local routing = BlueGreenManager.trafficRouting[processId]
    if not routing then
        return {
            success = true,
            processId = processId,
            routingStatus = "NO_ROUTING",
            activeVersion = "UNKNOWN"
        }
    end
    
    return {
        success = true,
        processId = processId,
        routingStatus = routing.status,
        activeVersion = routing.activeVersion,
        blueVersion = routing.blueVersion,
        greenVersion = routing.greenVersion,
        trafficSplit = routing.trafficSplit,
        lastSwitch = routing.lastSwitch
    }
end

-- Private helper functions

function BlueGreenManager._validateBlueGreenRequest(request)
    if not request.targetProcesses or #request.targetProcesses == 0 then
        return { success = false, error = "Target processes required for blue-green deployment" }
    end
    
    if not request.newVersion or request.newVersion == "" then
        return { success = false, error = "New version required for blue-green deployment" }
    end
    
    if request.trafficStrategy and not BlueGreenManager.TRAFFIC_STRATEGIES[request.trafficStrategy] then
        return { success = false, error = "Invalid traffic strategy: " .. request.trafficStrategy }
    end
    
    return { success = true }
end

function BlueGreenManager._prepareGreenEnvironment(deployment)
    -- Initialize green environment for each target process
    for _, processId in ipairs(deployment.targetProcesses) do
        -- Track current version as blue
        local currentVersion = BlueGreenManager._getCurrentProcessVersion(processId)
        
        -- Initialize version tracking
        if not BlueGreenManager.processVersions[processId] then
            BlueGreenManager.processVersions[processId] = {}
        end
        
        BlueGreenManager.processVersions[processId].blueVersion = currentVersion
        BlueGreenManager.processVersions[processId].greenVersion = deployment.newVersion
        
        -- Initialize traffic routing
        BlueGreenManager.trafficRouting[processId] = {
            status = "PREPARING",
            activeVersion = currentVersion,
            blueVersion = currentVersion,
            greenVersion = deployment.newVersion,
            trafficSplit = { blue = 100, green = 0 },
            lastSwitch = 0
        }
        
        deployment.processResults[processId] = {
            processId = processId,
            blueVersion = currentVersion,
            greenVersion = deployment.newVersion,
            preparationTime = 0,
            status = "PREPARED"
        }
    end
    
    print("[BlueGreenManager] Green environment prepared for deployment: " .. deployment.id)
    return { success = true }
end

function BlueGreenManager._deployToGreenEnvironment(deployment)
    local deploymentResults = {}
    local successCount = 0
    
    for _, processId in ipairs(deployment.targetProcesses) do
        local deployResult = BlueGreenManager._deployProcessToGreen(processId, deployment)
        deploymentResults[processId] = deployResult
        
        if deployResult.success then
            successCount = successCount + 1
            
            -- Update traffic routing status
            if BlueGreenManager.trafficRouting[processId] then
                BlueGreenManager.trafficRouting[processId].status = "GREEN_DEPLOYED"
            end
        end
        
        deployment.processResults[processId] = deployResult
    end
    
    return {
        success = successCount == #deployment.targetProcesses,
        deploymentResults = deploymentResults,
        successCount = successCount
    }
end

function BlueGreenManager._deployProcessToGreen(processId, deployment)
    -- Simulate green deployment - in real implementation would deploy new version
    local deploymentMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "BLUE_GREEN_DEPLOY"
        },
        blueGreenDeploy = {
            processId = processId,
            targetVersion = deployment.newVersion,
            environment = "GREEN",
            deploymentId = deployment.id
        }
    }
    
    -- Route deployment message
    local routingResult = MessageRouter.routeMessage(
        "BLUE_GREEN_DEPLOY",
        deploymentMessage,
        "DIRECT_ROUTE"
    )
    
    return {
        success = routingResult.success,
        processId = processId,
        targetVersion = deployment.newVersion,
        environment = "GREEN",
        deploymentTime = 0,
        correlationId = deploymentMessage.correlation.id,
        error = routingResult.error
    }
end

function BlueGreenManager._validateGreenEnvironmentHealth(deployment)
    local healthResults = {}
    local healthyCount = 0
    
    for _, processId in ipairs(deployment.targetProcesses) do
        local healthResult = BlueGreenManager._checkGreenProcessHealth(processId, deployment)
        healthResults[processId] = healthResult
        
        if healthResult.success and healthResult.healthStatus == "HEALTHY" then
            healthyCount = healthyCount + 1
        end
    end
    
    deployment.greenHealthResults = healthResults
    
    return {
        success = healthyCount == #deployment.targetProcesses,
        healthResults = healthResults,
        healthyCount = healthyCount
    }
end

function BlueGreenManager._checkGreenProcessHealth(processId, deployment)
    -- Simulate health check for green environment
    local healthCheckMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "GREEN_HEALTH_CHECK"
        },
        healthCheck = {
            processId = processId,
            environment = "GREEN",
            version = deployment.newVersion,
            timeoutSeconds = deployment.healthCheckTimeout
        }
    }
    
    -- Route health check message
    local routingResult = MessageRouter.routeMessage(
        "GREEN_HEALTH_CHECK",
        healthCheckMessage,
        "DIRECT_ROUTE"
    )
    
    -- Simulate successful health check
    return {
        success = routingResult.success,
        processId = processId,
        environment = "GREEN",
        healthStatus = routingResult.success and "HEALTHY" or "UNHEALTHY",
        responseTime = math.random(50, 200),
        healthCheckTime = 0,
        correlationId = healthCheckMessage.correlation.id,
        error = routingResult.error
    }
end

function BlueGreenManager._switchTrafficToGreen(deployment)
    local trafficSwitchResults = {}
    local successCount = 0
    
    for _, processId in ipairs(deployment.targetProcesses) do
        local switchResult = BlueGreenManager._switchProcessTrafficToGreen(processId, deployment)
        trafficSwitchResults[processId] = switchResult
        
        if switchResult.success then
            successCount = successCount + 1
        end
    end
    
    deployment.trafficSwitchResults = trafficSwitchResults
    
    return {
        success = successCount == #deployment.targetProcesses,
        trafficSwitchResults = trafficSwitchResults,
        successCount = successCount
    }
end

function BlueGreenManager._switchProcessTrafficToGreen(processId, deployment)
    local trafficRouting = BlueGreenManager.trafficRouting[processId]
    if not trafficRouting then
        return { success = false, error = "No traffic routing configuration for process: " .. processId }
    end
    
    -- Apply traffic switching strategy
    local strategy = deployment.trafficStrategy
    local switchPlan = {}
    
    if strategy == BlueGreenManager.TRAFFIC_STRATEGIES.INSTANT then
        switchPlan = { blue = 0, green = 100 }
    elseif strategy == BlueGreenManager.TRAFFIC_STRATEGIES.GRADUAL then
        -- Implement gradual switch (simplified)
        switchPlan = { blue = 0, green = 100 }
    elseif strategy == BlueGreenManager.TRAFFIC_STRATEGIES.CANARY then
        -- Start with canary percentage
        switchPlan = { blue = 90, green = 10 }
    elseif strategy == BlueGreenManager.TRAFFIC_STRATEGIES.A_B_TEST then
        switchPlan = { blue = 50, green = 50 }
    else
        switchPlan = { blue = 0, green = 100 } -- Default to instant
    end
    
    -- Update traffic routing
    trafficRouting.trafficSplit = switchPlan
    trafficRouting.activeVersion = trafficRouting.greenVersion
    trafficRouting.status = "GREEN_ACTIVE"
    trafficRouting.lastSwitch = 0
    
    deployment.trafficSwitchPlan[processId] = switchPlan
    
    print("[BlueGreenManager] Traffic switched to green for process: " .. processId .. 
          " (Blue: " .. switchPlan.blue .. "%, Green: " .. switchPlan.green .. "%)")
    
    return {
        success = true,
        processId = processId,
        trafficSplit = switchPlan,
        switchTime = 0
    }
end

function BlueGreenManager._monitorGreenEnvironment(deployment)
    -- Monitor green environment for stability
    local monitoringResults = {}
    local stableCount = 0
    
    for _, processId in ipairs(deployment.targetProcesses) do
        local monitorResult = BlueGreenManager._monitorGreenProcess(processId, deployment)
        monitoringResults[processId] = monitorResult
        
        if monitorResult.success and monitorResult.stability == "STABLE" then
            stableCount = stableCount + 1
        end
    end
    
    deployment.monitoringResults = monitoringResults
    
    return {
        success = stableCount == #deployment.targetProcesses,
        monitoringResults = monitoringResults,
        stableCount = stableCount
    }
end

function BlueGreenManager._monitorGreenProcess(processId, deployment)
    -- Simulate monitoring of green process
    return {
        success = true,
        processId = processId,
        stability = "STABLE", -- Simplified - would track actual metrics
        errorRate = 0.0,
        responseTime = math.random(50, 150),
        throughput = math.random(90, 110),
        monitoringDuration = 60, -- seconds
        monitoringTime = 0
    }
end

function BlueGreenManager._rollbackBlueGreenDeployment(deployment)
    deployment.phase = BlueGreenManager.PHASES.ROLLING_BACK
    
    for _, processId in ipairs(deployment.targetProcesses) do
        local rollbackResult = BlueGreenManager._rollbackProcessToBlue(processId, deployment)
        
        if rollbackResult.success then
            -- Update traffic routing back to blue
            local trafficRouting = BlueGreenManager.trafficRouting[processId]
            if trafficRouting then
                trafficRouting.trafficSplit = { blue = 100, green = 0 }
                trafficRouting.activeVersion = trafficRouting.blueVersion
                trafficRouting.status = "BLUE_ACTIVE"
                trafficRouting.lastSwitch = 0
            end
        end
    end
    
    deployment.phase = BlueGreenManager.PHASES.ROLLED_BACK
    deployment.rollbackTime = 0
    
    print("[BlueGreenManager] Blue-green deployment rolled back: " .. deployment.id)
end

function BlueGreenManager._rollbackProcessToBlue(processId, deployment)
    -- Simulate rollback to blue environment
    return {
        success = true,
        processId = processId,
        rolledBackTo = BlueGreenManager.processVersions[processId] and 
                       BlueGreenManager.processVersions[processId].blueVersion or "UNKNOWN",
        rollbackTime = 0
    }
end

function BlueGreenManager._cleanupBlueEnvironment(deployment)
    -- Cleanup blue environment after successful green deployment
    for _, processId in ipairs(deployment.targetProcesses) do
        if BlueGreenManager.processVersions[processId] then
            -- Keep green as the new active version
            BlueGreenManager.processVersions[processId].blueVersion = 
                BlueGreenManager.processVersions[processId].greenVersion
            BlueGreenManager.processVersions[processId].greenVersion = nil
        end
        
        local trafficRouting = BlueGreenManager.trafficRouting[processId]
        if trafficRouting then
            trafficRouting.blueVersion = trafficRouting.greenVersion
            trafficRouting.greenVersion = nil
            trafficRouting.status = "BLUE_ACTIVE" -- Green becomes the new blue
            trafficRouting.trafficSplit = { blue = 100, green = 0 }
        end
    end
    
    print("[BlueGreenManager] Blue environment cleanup completed for deployment: " .. deployment.id)
end

function BlueGreenManager._getCurrentProcessVersion(processId)
    -- In a real implementation, this would query the actual process version
    return "1.0.0" -- Simplified
end

return BlueGreenManager