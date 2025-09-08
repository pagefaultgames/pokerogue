-- Deployment Orchestrator Component
-- Handles deployment sequencing, coordination, and dependency management

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local MessageRouter = require("game-logic.process-coordination.message-router")

local DeploymentOrchestrator = {
    -- Configuration
    config = {
        maxConcurrentDeployments = 5,
        deploymentTimeoutMinutes = 60,
        dependencyCheckEnabled = true,
        healthValidationRequired = true,
        rollbackOnFailure = true
    },
    
    -- Active deployment operations
    activeDeployments = {},
    
    -- Deployment history
    deploymentHistory = {},
    
    -- Process dependencies mapping
    processDependencies = {
        ["coordinator-process"] = {},
        ["battle-process"] = {"coordinator-process"},
        ["pokemon-process"] = {"coordinator-process"},
        ["shop-process"] = {"coordinator-process"},
        ["security-process"] = {"coordinator-process"},
        ["admin-process"] = {},
        ["deployment-coordinator-process"] = {}
    },
    
    -- Deployment strategies
    DEPLOYMENT_STRATEGIES = {
        SEQUENTIAL = "SEQUENTIAL",
        PARALLEL = "PARALLEL", 
        DEPENDENCY_AWARE = "DEPENDENCY_AWARE",
        BLUE_GREEN = "BLUE_GREEN",
        ROLLING = "ROLLING"
    },
    
    -- Deployment statuses
    DEPLOYMENT_STATUS = {
        PENDING = "PENDING",
        VALIDATING = "VALIDATING", 
        DEPLOYING = "DEPLOYING",
        HEALTH_CHECKING = "HEALTH_CHECKING",
        COMPLETED = "COMPLETED",
        FAILED = "FAILED",
        ROLLING_BACK = "ROLLING_BACK",
        ROLLED_BACK = "ROLLED_BACK"
    }
}

-- Initialize deployment orchestrator
function DeploymentOrchestrator.initialize(config)
    if config then
        for key, value in pairs(config) do
            if DeploymentOrchestrator.config[key] ~= nil then
                DeploymentOrchestrator.config[key] = value
            end
        end
    end
    
    DeploymentOrchestrator.activeDeployments = {}
    DeploymentOrchestrator.deploymentHistory = {}
    
    print("[DeploymentOrchestrator] Deployment orchestrator initialized")
end

-- Orchestrate deployment across multiple processes
function DeploymentOrchestrator.orchestrateDeployment(deploymentRequest)
    -- Validate deployment request
    local validationResult = DeploymentOrchestrator._validateDeploymentRequest(deploymentRequest)
    if not validationResult.success then
        return validationResult
    end
    
    local deploymentId = MessageCorrelator.generateId()
    local currentTime = 0
    
    local deployment = {
        id = deploymentId,
        status = DeploymentOrchestrator.DEPLOYMENT_STATUS.PENDING,
        strategy = deploymentRequest.deploymentStrategy or DeploymentOrchestrator.DEPLOYMENT_STRATEGIES.DEPENDENCY_AWARE,
        targetProcesses = deploymentRequest.targetProcesses,
        configuration = deploymentRequest.configuration or {},
        rollbackEnabled = deploymentRequest.rollbackEnabled ~= false,
        healthCheckTimeout = deploymentRequest.healthCheckTimeout or DeploymentOrchestrator.config.deploymentTimeoutMinutes * 60,
        startTime = currentTime,
        processResults = {},
        deploymentPlan = {},
        rollbackData = {},
        adminUserId = deploymentRequest.adminUserId,
        correlationId = deploymentRequest.correlationId
    }
    
    -- Register active deployment
    DeploymentOrchestrator.activeDeployments[deploymentId] = deployment
    
    -- Generate deployment plan based on strategy
    local planResult = DeploymentOrchestrator._generateDeploymentPlan(deployment)
    if not planResult.success then
        deployment.status = DeploymentOrchestrator.DEPLOYMENT_STATUS.FAILED
        deployment.error = planResult.error
        return { success = false, error = planResult.error, deploymentId = deploymentId }
    end
    
    deployment.deploymentPlan = planResult.deploymentPlan
    deployment.status = DeploymentOrchestrator.DEPLOYMENT_STATUS.VALIDATING
    
    -- Pre-deployment validation
    local preValidationResult = DeploymentOrchestrator._performPreDeploymentValidation(deployment)
    if not preValidationResult.success then
        deployment.status = DeploymentOrchestrator.DEPLOYMENT_STATUS.FAILED
        deployment.error = preValidationResult.error
        return { success = false, error = preValidationResult.error, deploymentId = deploymentId }
    end
    
    -- Execute deployment
    deployment.status = DeploymentOrchestrator.DEPLOYMENT_STATUS.DEPLOYING
    local executionResult = DeploymentOrchestrator._executeDeploymentPlan(deployment)
    
    if executionResult.success then
        -- Perform health validation
        deployment.status = DeploymentOrchestrator.DEPLOYMENT_STATUS.HEALTH_CHECKING
        local healthResult = DeploymentOrchestrator._performPostDeploymentHealthCheck(deployment)
        
        if healthResult.success then
            deployment.status = DeploymentOrchestrator.DEPLOYMENT_STATUS.COMPLETED
            deployment.completionTime = 0
        else
            deployment.status = DeploymentOrchestrator.DEPLOYMENT_STATUS.FAILED
            deployment.error = healthResult.error
            
            -- Perform rollback if enabled
            if deployment.rollbackEnabled then
                local rollbackResult = DeploymentOrchestrator._performDeploymentRollback(deployment)
                if rollbackResult.success then
                    deployment.status = DeploymentOrchestrator.DEPLOYMENT_STATUS.ROLLED_BACK
                end
            end
        end
    else
        deployment.status = DeploymentOrchestrator.DEPLOYMENT_STATUS.FAILED
        deployment.error = executionResult.error
        
        -- Perform rollback if enabled
        if deployment.rollbackEnabled then
            local rollbackResult = DeploymentOrchestrator._performDeploymentRollback(deployment)
            if rollbackResult.success then
                deployment.status = DeploymentOrchestrator.DEPLOYMENT_STATUS.ROLLED_BACK
            end
        end
    end
    
    -- Move to history
    DeploymentOrchestrator._completeDeployment(deployment)
    
    return {
        success = deployment.status == DeploymentOrchestrator.DEPLOYMENT_STATUS.COMPLETED,
        deploymentId = deploymentId,
        status = deployment.status,
        processResults = deployment.processResults,
        deploymentPlan = deployment.deploymentPlan,
        error = deployment.error,
        rollbackAvailable = deployment.rollbackEnabled
    }
end

-- Get deployment status
function DeploymentOrchestrator.getDeploymentStatus(deploymentId)
    local deployment = DeploymentOrchestrator.activeDeployments[deploymentId]
    if deployment then
        return {
            success = true,
            deployment = {
                id = deployment.id,
                status = deployment.status,
                strategy = deployment.strategy,
                targetProcesses = deployment.targetProcesses,
                startTime = deployment.startTime,
                completionTime = deployment.completionTime,
                processResults = deployment.processResults,
                error = deployment.error
            }
        }
    end
    
    -- Check history
    for _, historicalDeployment in ipairs(DeploymentOrchestrator.deploymentHistory) do
        if historicalDeployment.id == deploymentId then
            return {
                success = true,
                deployment = historicalDeployment
            }
        end
    end
    
    return { success = false, error = "Deployment not found: " .. deploymentId }
end

-- Get active deployments
function DeploymentOrchestrator.getActiveDeployments()
    local activeList = {}
    for deploymentId, deployment in pairs(DeploymentOrchestrator.activeDeployments) do
        table.insert(activeList, {
            id = deployment.id,
            status = deployment.status,
            strategy = deployment.strategy,
            targetProcesses = deployment.targetProcesses,
            startTime = deployment.startTime
        })
    end
    return activeList
end

-- Cancel active deployment
function DeploymentOrchestrator.cancelDeployment(deploymentId, reason)
    local deployment = DeploymentOrchestrator.activeDeployments[deploymentId]
    if not deployment then
        return { success = false, error = "Deployment not found: " .. deploymentId }
    end
    
    if deployment.status == DeploymentOrchestrator.DEPLOYMENT_STATUS.COMPLETED then
        return { success = false, error = "Cannot cancel completed deployment" }
    end
    
    -- Perform cancellation and rollback
    local rollbackResult = DeploymentOrchestrator._performDeploymentRollback(deployment)
    
    deployment.status = "CANCELLED"
    deployment.cancellationReason = reason or "Manual cancellation"
    deployment.completionTime = 0
    
    DeploymentOrchestrator._completeDeployment(deployment)
    
    return {
        success = true,
        deploymentId = deploymentId,
        rollbackResult = rollbackResult
    }
end

-- Private helper functions

function DeploymentOrchestrator._validateDeploymentRequest(request)
    if not request then
        return { success = false, error = "Deployment request is required" }
    end
    
    if not request.targetProcesses or #request.targetProcesses == 0 then
        return { success = false, error = "Target processes are required" }
    end
    
    if request.deploymentStrategy and not DeploymentOrchestrator.DEPLOYMENT_STRATEGIES[request.deploymentStrategy] then
        return { success = false, error = "Invalid deployment strategy: " .. request.deploymentStrategy }
    end
    
    -- Validate process limit
    if #request.targetProcesses > DeploymentOrchestrator.config.maxConcurrentDeployments then
        return { success = false, error = "Too many target processes. Maximum: " .. DeploymentOrchestrator.config.maxConcurrentDeployments }
    end
    
    return { success = true }
end

function DeploymentOrchestrator._generateDeploymentPlan(deployment)
    local strategy = deployment.strategy
    local targetProcesses = deployment.targetProcesses
    local deploymentPlan = {
        strategy = strategy,
        executionOrder = {},
        parallelGroups = {},
        dependencyMap = {}
    }
    
    if strategy == DeploymentOrchestrator.DEPLOYMENT_STRATEGIES.SEQUENTIAL then
        deploymentPlan.executionOrder = targetProcesses
        
    elseif strategy == DeploymentOrchestrator.DEPLOYMENT_STRATEGIES.PARALLEL then
        deploymentPlan.parallelGroups = { targetProcesses }
        deploymentPlan.executionOrder = targetProcesses
        
    elseif strategy == DeploymentOrchestrator.DEPLOYMENT_STRATEGIES.DEPENDENCY_AWARE then
        local orderResult = DeploymentOrchestrator._resolveDependencyOrder(targetProcesses)
        if not orderResult.success then
            return orderResult
        end
        deploymentPlan.executionOrder = orderResult.orderedProcesses
        deploymentPlan.dependencyMap = orderResult.dependencyMap
        
    elseif strategy == DeploymentOrchestrator.DEPLOYMENT_STRATEGIES.ROLLING then
        -- For rolling deployment, we'll deploy one at a time with health validation
        deploymentPlan.executionOrder = targetProcesses
        deploymentPlan.healthValidationBetweenSteps = true
        
    else
        return { success = false, error = "Unsupported deployment strategy: " .. strategy }
    end
    
    return { success = true, deploymentPlan = deploymentPlan }
end

function DeploymentOrchestrator._resolveDependencyOrder(processes)
    local orderedProcesses = {}
    local processed = {}
    local dependencyMap = {}
    
    local function addProcessWithDependencies(processId)
        if processed[processId] then
            return
        end
        
        local dependencies = DeploymentOrchestrator.processDependencies[processId] or {}
        dependencyMap[processId] = dependencies
        
        -- Add dependencies first
        for _, depId in ipairs(dependencies) do
            if DeploymentOrchestrator._containsProcess(processes, depId) and not processed[depId] then
                addProcessWithDependencies(depId)
            end
        end
        
        -- Add the process itself
        table.insert(orderedProcesses, processId)
        processed[processId] = true
    end
    
    -- Process all target processes
    for _, processId in ipairs(processes) do
        addProcessWithDependencies(processId)
    end
    
    return {
        success = true,
        orderedProcesses = orderedProcesses,
        dependencyMap = dependencyMap
    }
end

function DeploymentOrchestrator._performPreDeploymentValidation(deployment)
    -- Validate configuration
    if DeploymentOrchestrator.config.dependencyCheckEnabled then
        local depCheckResult = DeploymentOrchestrator._validateProcessDependencies(deployment.targetProcesses)
        if not depCheckResult.success then
            return depCheckResult
        end
    end
    
    -- Validate process availability
    for _, processId in ipairs(deployment.targetProcesses) do
        -- In a real implementation, we would check if processes are accessible
        -- For now, we'll assume they are available
        deployment.rollbackData[processId] = {
            preDeploymentState = "AVAILABLE",
            timestamp = 0
        }
    end
    
    return { success = true }
end

function DeploymentOrchestrator._validateProcessDependencies(targetProcesses)
    for _, processId in ipairs(targetProcesses) do
        local dependencies = DeploymentOrchestrator.processDependencies[processId] or {}
        for _, depId in ipairs(dependencies) do
            if not DeploymentOrchestrator._containsProcess(targetProcesses, depId) then
                -- In a real implementation, we would check if the dependency is already deployed
                -- For now, we'll log a warning but allow the deployment
                print("[DeploymentOrchestrator] Warning: Process " .. processId .. " depends on " .. depId .. " which is not in deployment scope")
            end
        end
    end
    return { success = true }
end

function DeploymentOrchestrator._executeDeploymentPlan(deployment)
    local plan = deployment.deploymentPlan
    local results = {}
    local successCount = 0
    
    if plan.strategy == DeploymentOrchestrator.DEPLOYMENT_STRATEGIES.PARALLEL then
        -- Execute parallel deployment
        for _, processId in ipairs(plan.executionOrder) do
            local deployResult = DeploymentOrchestrator._deployToProcess(processId, deployment)
            results[processId] = deployResult
            if deployResult.success then
                successCount = successCount + 1
            end
        end
    else
        -- Execute sequential/dependency-aware deployment
        for _, processId in ipairs(plan.executionOrder) do
            local deployResult = DeploymentOrchestrator._deployToProcess(processId, deployment)
            results[processId] = deployResult
            
            if deployResult.success then
                successCount = successCount + 1
                
                -- For rolling deployment, perform health check between steps
                if plan.healthValidationBetweenSteps then
                    local healthResult = DeploymentOrchestrator._validateProcessHealth(processId, deployment)
                    if not healthResult.success then
                        results[processId].healthCheckFailed = true
                        results[processId].healthError = healthResult.error
                        break -- Stop rolling deployment on health failure
                    end
                end
            else
                -- Stop on failure for sequential/dependency-aware strategies
                if plan.strategy ~= DeploymentOrchestrator.DEPLOYMENT_STRATEGIES.PARALLEL then
                    break
                end
            end
        end
    end
    
    deployment.processResults = results
    
    return {
        success = successCount == #deployment.targetProcesses,
        results = results,
        successCount = successCount,
        totalCount = #deployment.targetProcesses
    }
end

function DeploymentOrchestrator._deployToProcess(processId, deployment)
    local deploymentMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "PROCESS_DEPLOYMENT"
        },
        deployment = {
            deploymentId = deployment.id,
            processId = processId,
            configuration = deployment.configuration[processId] or {},
            deploymentStrategy = deployment.strategy,
            rollbackEnabled = deployment.rollbackEnabled
        }
    }
    
    -- Route deployment message to target process
    local routingResult = MessageRouter.routeMessage(
        "PROCESS_DEPLOYMENT",
        deploymentMessage,
        "DIRECT_ROUTE"
    )
    
    return {
        success = routingResult.success,
        processId = processId,
        deploymentTime = 0,
        correlationId = deploymentMessage.correlation.id,
        error = routingResult.error
    }
end

function DeploymentOrchestrator._performPostDeploymentHealthCheck(deployment)
    local healthResults = {}
    local healthyCount = 0
    
    for _, processId in ipairs(deployment.targetProcesses) do
        local healthResult = DeploymentOrchestrator._validateProcessHealth(processId, deployment)
        healthResults[processId] = healthResult
        
        if healthResult.success then
            healthyCount = healthyCount + 1
        end
    end
    
    deployment.healthResults = healthResults
    
    return {
        success = healthyCount == #deployment.targetProcesses,
        healthResults = healthResults,
        healthyCount = healthyCount,
        totalCount = #deployment.targetProcesses
    }
end

function DeploymentOrchestrator._validateProcessHealth(processId, deployment)
    local healthCheckMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "DEPLOYMENT_HEALTH_CHECK"
        },
        healthCheck = {
            deploymentId = deployment.id,
            processId = processId,
            checkType = "POST_DEPLOYMENT",
            timeoutSeconds = deployment.healthCheckTimeout
        }
    }
    
    -- Route health check message
    local routingResult = MessageRouter.routeMessage(
        "DEPLOYMENT_HEALTH_CHECK",
        healthCheckMessage,
        "DIRECT_ROUTE"
    )
    
    return {
        success = routingResult.success,
        processId = processId,
        healthCheckTime = 0,
        correlationId = healthCheckMessage.correlation.id,
        error = routingResult.error
    }
end

function DeploymentOrchestrator._performDeploymentRollback(deployment)
    local rollbackResults = {}
    local rollbackCount = 0
    
    -- Rollback in reverse order of deployment
    local rollbackOrder = {}
    for i = #deployment.deploymentPlan.executionOrder, 1, -1 do
        table.insert(rollbackOrder, deployment.deploymentPlan.executionOrder[i])
    end
    
    for _, processId in ipairs(rollbackOrder) do
        -- Only rollback processes that were successfully deployed
        if deployment.processResults[processId] and deployment.processResults[processId].success then
            local rollbackResult = DeploymentOrchestrator._rollbackProcess(processId, deployment)
            rollbackResults[processId] = rollbackResult
            
            if rollbackResult.success then
                rollbackCount = rollbackCount + 1
            end
        end
    end
    
    deployment.rollbackResults = rollbackResults
    
    return {
        success = rollbackCount > 0,
        rollbackResults = rollbackResults,
        rollbackCount = rollbackCount
    }
end

function DeploymentOrchestrator._rollbackProcess(processId, deployment)
    local rollbackMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "DEPLOYMENT_ROLLBACK"
        },
        rollback = {
            deploymentId = deployment.id,
            processId = processId,
            rollbackData = deployment.rollbackData[processId] or {}
        }
    }
    
    -- Route rollback message
    local routingResult = MessageRouter.routeMessage(
        "DEPLOYMENT_ROLLBACK",
        rollbackMessage,
        "DIRECT_ROUTE"
    )
    
    return {
        success = routingResult.success,
        processId = processId,
        rollbackTime = 0,
        correlationId = rollbackMessage.correlation.id,
        error = routingResult.error
    }
end

function DeploymentOrchestrator._completeDeployment(deployment)
    -- Move from active to history
    table.insert(DeploymentOrchestrator.deploymentHistory, deployment)
    DeploymentOrchestrator.activeDeployments[deployment.id] = nil
    
    -- Manage history size
    if #DeploymentOrchestrator.deploymentHistory > 100 then
        table.remove(DeploymentOrchestrator.deploymentHistory, 1)
    end
    
    print("[DeploymentOrchestrator] Deployment completed: " .. deployment.id .. " - Status: " .. deployment.status)
end

function DeploymentOrchestrator._containsProcess(processes, processId)
    for _, id in ipairs(processes) do
        if id == processId then
            return true
        end
    end
    return false
end

return DeploymentOrchestrator