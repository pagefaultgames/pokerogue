-- Maintenance Coordinator Component
-- Coordinates maintenance operations, deployments, and system-wide operational procedures

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local MessageRouter = require("game-logic.process-coordination.message-router")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")

local MaintenanceCoordinator = {
    -- Maintenance state
    maintenanceState = {
        maintenanceMode = false,
        maintenanceReason = nil,
        maintenanceStartTime = nil,
        maintenanceEndTime = nil,
        affectedProcesses = {}
    },
    
    -- Active maintenance operations
    activeOperations = {},
    
    -- Operation history
    operationHistory = {},
    
    -- Maintenance configuration
    config = {
        maxConcurrentOperations = 5,
        operationTimeoutMinutes = 60,
        gracefulShutdownTimeoutSeconds = 30,
        stateBackupEnabled = true,
        rollbackRetentionHours = 24,
        dependencyCheckEnabled = true
    },
    
    -- Operation types
    OPERATION_TYPES = {
        DEPLOYMENT = "DEPLOYMENT",
        UPDATE = "UPDATE",
        ROLLBACK = "ROLLBACK",
        SCALING = "SCALING",
        MIGRATION = "MIGRATION",
        RESTART = "RESTART",
        SHUTDOWN = "SHUTDOWN",
        BACKUP = "BACKUP",
        RESTORE = "RESTORE"
    },
    
    -- Operation statuses
    OPERATION_STATUS = {
        PENDING = "PENDING",
        RUNNING = "RUNNING",
        COMPLETED = "COMPLETED",
        FAILED = "FAILED",
        CANCELLED = "CANCELLED",
        ROLLED_BACK = "ROLLED_BACK"
    },
    
    -- Process dependencies
    processDependencies = {
        ["coordinator-process"] = {},
        ["battle-process"] = {"coordinator-process"},
        ["pokemon-process"] = {"coordinator-process"},
        ["shop-process"] = {"coordinator-process"},
        ["security-process"] = {"coordinator-process"},
        ["admin-process"] = {}
    },
    
    -- Statistics
    statistics = {
        totalOperations = 0,
        successfulOperations = 0,
        failedOperations = 0,
        rolledBackOperations = 0,
        maintenanceModeActivations = 0,
        averageOperationTime = 0
    }
}

-- Initialize maintenance coordination system
function MaintenanceCoordinator.initialize()
    MaintenanceCoordinator.activeOperations = {}
    MaintenanceCoordinator.operationHistory = {}
    MaintenanceCoordinator.maintenanceState = {
        maintenanceMode = false,
        maintenanceReason = nil,
        maintenanceStartTime = nil,
        maintenanceEndTime = nil,
        affectedProcesses = {}
    }
    MaintenanceCoordinator.statistics = {
        totalOperations = 0,
        successfulOperations = 0,
        failedOperations = 0,
        rolledBackOperations = 0,
        maintenanceModeActivations = 0,
        averageOperationTime = 0
    }
    print("[MaintenanceCoordinator] Maintenance coordination system initialized")
end

-- Set system maintenance mode
function MaintenanceCoordinator.setMaintenanceMode(enabled, reason)
    local previousMode = MaintenanceCoordinator.maintenanceState.maintenanceMode
    local currentTime = 0
    
    MaintenanceCoordinator.maintenanceState.maintenanceMode = enabled
    MaintenanceCoordinator.maintenanceState.maintenanceReason = reason or "Maintenance mode toggle"
    
    if enabled and not previousMode then
        -- Entering maintenance mode
        MaintenanceCoordinator.maintenanceState.maintenanceStartTime = currentTime
        MaintenanceCoordinator.maintenanceState.maintenanceEndTime = nil
        MaintenanceCoordinator.statistics.maintenanceModeActivations = 
            MaintenanceCoordinator.statistics.maintenanceModeActivations + 1
        
        -- Notify all processes about maintenance mode
        local result = MaintenanceCoordinator._notifyProcesses("MAINTENANCE_MODE_ENABLED", {
            reason = reason,
            startTime = currentTime
        })
        
        print("[MaintenanceCoordinator] Maintenance mode ENABLED - Reason: " .. (reason or "Unknown"))
        return { success = result.success, mode = "enabled" }
        
    elseif not enabled and previousMode then
        -- Exiting maintenance mode
        MaintenanceCoordinator.maintenanceState.maintenanceEndTime = currentTime
        local duration = currentTime - MaintenanceCoordinator.maintenanceState.maintenanceStartTime
        
        -- Notify all processes about maintenance mode end
        local result = MaintenanceCoordinator._notifyProcesses("MAINTENANCE_MODE_DISABLED", {
            reason = "Maintenance completed",
            endTime = currentTime,
            duration = duration
        })
        
        print("[MaintenanceCoordinator] Maintenance mode DISABLED - Duration: " .. duration .. "s")
        return { success = result.success, mode = "disabled", duration = duration }
    else
        -- No change in mode
        return { success = true, mode = enabled and "enabled" or "disabled" }
    end
end

-- Coordinate deployment across processes
function MaintenanceCoordinator.coordinateDeployment(deploymentRequest)
    local deploymentPlan = deploymentRequest.deploymentPlan
    local coordinationMode = deploymentRequest.coordinationMode or "SEQUENTIAL"
    local rollbackOnFailure = deploymentRequest.rollbackOnFailure ~= false
    local adminUserId = deploymentRequest.adminUserId
    
    local operationId = MessageCorrelator.generateId()
    local operation = {
        id = operationId,
        type = MaintenanceCoordinator.OPERATION_TYPES.DEPLOYMENT,
        status = MaintenanceCoordinator.OPERATION_STATUS.PENDING,
        coordinationMode = coordinationMode,
        deploymentPlan = deploymentPlan,
        rollbackOnFailure = rollbackOnFailure,
        adminUserId = adminUserId,
        startTime = 0,
        results = {},
        rollbackData = {}
    }
    
    -- Register operation
    MaintenanceCoordinator.activeOperations[operationId] = operation
    MaintenanceCoordinator.statistics.totalOperations = MaintenanceCoordinator.statistics.totalOperations + 1
    
    -- Execute deployment coordination
    local coordinationResult = {}
    if coordinationMode == "SEQUENTIAL" then
        coordinationResult = MaintenanceCoordinator._executeSequentialDeployment(operation)
    elseif coordinationMode == "PARALLEL" then
        coordinationResult = MaintenanceCoordinator._executeParallelDeployment(operation)
    elseif coordinationMode == "DEPENDENCY_AWARE" then
        coordinationResult = MaintenanceCoordinator._executeDependencyAwareDeployment(operation)
    else
        coordinationResult = { success = false, error = "Unsupported coordination mode: " .. coordinationMode }
    end
    
    -- Update operation status
    operation.status = coordinationResult.success and 
        MaintenanceCoordinator.OPERATION_STATUS.COMPLETED or 
        MaintenanceCoordinator.OPERATION_STATUS.FAILED
    operation.completionTime = 0
    operation.results = coordinationResult.results
    
    -- Handle rollback on failure
    if not coordinationResult.success and rollbackOnFailure then
        local rollbackResult = MaintenanceCoordinator._executeDeploymentRollback(operation)
        if rollbackResult.success then
            operation.status = MaintenanceCoordinator.OPERATION_STATUS.ROLLED_BACK
        end
    end
    
    -- Update statistics and move to history
    MaintenanceCoordinator._completeOperation(operation)
    
    return {
        success = coordinationResult.success,
        operationId = operationId,
        status = operation.status,
        results = coordinationResult.results,
        affectedProcesses = operation.deploymentPlan.targetProcesses,
        rollbackAvailable = rollbackOnFailure and coordinationResult.success,
        error = coordinationResult.error
    }
end

-- Execute rollback operation
function MaintenanceCoordinator.executeRollback(rollbackRequest)
    local operation = rollbackRequest.operation
    local targetProcesses = rollbackRequest.targetProcesses
    local rollbackPoint = rollbackRequest.rollbackPoint
    local reason = rollbackRequest.reason or "Manual rollback"
    local adminUserId = rollbackRequest.adminUserId
    
    local operationId = MessageCorrelator.generateId()
    local rollbackOperation = {
        id = operationId,
        type = MaintenanceCoordinator.OPERATION_TYPES.ROLLBACK,
        status = MaintenanceCoordinator.OPERATION_STATUS.RUNNING,
        targetProcesses = targetProcesses,
        rollbackPoint = rollbackPoint,
        reason = reason,
        adminUserId = adminUserId,
        startTime = 0,
        results = {}
    }
    
    -- Register operation
    MaintenanceCoordinator.activeOperations[operationId] = rollbackOperation
    MaintenanceCoordinator.statistics.totalOperations = MaintenanceCoordinator.statistics.totalOperations + 1
    
    -- Execute rollback
    local rollbackResults = {}
    local successCount = 0
    
    for _, processId in ipairs(targetProcesses) do
        local processResult = MaintenanceCoordinator._rollbackProcess(processId, rollbackPoint, reason)
        rollbackResults[processId] = processResult
        
        if processResult.success then
            successCount = successCount + 1
        end
    end
    
    -- Update operation status
    rollbackOperation.status = successCount == #targetProcesses and 
        MaintenanceCoordinator.OPERATION_STATUS.COMPLETED or 
        MaintenanceCoordinator.OPERATION_STATUS.FAILED
    rollbackOperation.completionTime = 0
    rollbackOperation.results = rollbackResults
    
    -- Update statistics and move to history
    MaintenanceCoordinator._completeOperation(rollbackOperation)
    
    return {
        success = successCount == #targetProcesses,
        operationId = operationId,
        status = rollbackOperation.status,
        results = rollbackResults,
        affectedProcesses = targetProcesses,
        stateRestoration = successCount > 0
    }
end

-- Coordinate graceful shutdown
function MaintenanceCoordinator.coordinateGracefulShutdown(shutdownRequest)
    local targetProcesses = shutdownRequest.targetProcesses
    local shutdownOrder = shutdownRequest.shutdownOrder or "DEPENDENCY_AWARE"
    local gracePeriodSeconds = shutdownRequest.gracePeriodSeconds or MaintenanceCoordinator.config.gracefulShutdownTimeoutSeconds
    local statePreservation = shutdownRequest.statePreservation ~= false
    local adminUserId = shutdownRequest.adminUserId
    
    local operationId = MessageCorrelator.generateId()
    local shutdownOperation = {
        id = operationId,
        type = MaintenanceCoordinator.OPERATION_TYPES.SHUTDOWN,
        status = MaintenanceCoordinator.OPERATION_STATUS.RUNNING,
        targetProcesses = targetProcesses,
        shutdownOrder = shutdownOrder,
        gracePeriodSeconds = gracePeriodSeconds,
        statePreservation = statePreservation,
        adminUserId = adminUserId,
        startTime = 0,
        results = {}
    }
    
    -- Register operation
    MaintenanceCoordinator.activeOperations[operationId] = shutdownOperation
    MaintenanceCoordinator.statistics.totalOperations = MaintenanceCoordinator.statistics.totalOperations + 1
    
    -- Determine shutdown order
    local orderedProcesses = MaintenanceCoordinator._determineShutdownOrder(targetProcesses, shutdownOrder)
    
    -- Execute graceful shutdown
    local shutdownResults = {}
    local successCount = 0
    
    for _, processId in ipairs(orderedProcesses) do
        local processResult = MaintenanceCoordinator._shutdownProcess(processId, gracePeriodSeconds, statePreservation)
        shutdownResults[processId] = processResult
        
        if processResult.success then
            successCount = successCount + 1
        else
            -- If shutdown fails, we might need to force shutdown
            print("[MaintenanceCoordinator] Graceful shutdown failed for " .. processId .. ", considering force shutdown")
        end
    end
    
    -- Update operation status
    shutdownOperation.status = successCount == #orderedProcesses and 
        MaintenanceCoordinator.OPERATION_STATUS.COMPLETED or 
        MaintenanceCoordinator.OPERATION_STATUS.FAILED
    shutdownOperation.completionTime = 0
    shutdownOperation.results = shutdownResults
    shutdownOperation.executionOrder = orderedProcesses
    
    -- Update statistics and move to history
    MaintenanceCoordinator._completeOperation(shutdownOperation)
    
    return {
        success = successCount == #orderedProcesses,
        operationId = operationId,
        status = shutdownOperation.status,
        results = shutdownResults,
        executionOrder = orderedProcesses,
        statePreserved = statePreservation
    }
end

-- Deploy processes
function MaintenanceCoordinator.deployProcesses(deploymentRequest)
    -- Implementation for process deployment
    return { success = true, deployedProcesses = deploymentRequest.targetProcesses }
end

-- Update processes
function MaintenanceCoordinator.updateProcesses(updateRequest)
    -- Implementation for process updates
    return { success = true, updatedProcesses = updateRequest.targetProcesses }
end

-- Rollback processes
function MaintenanceCoordinator.rollbackProcesses(rollbackRequest)
    -- Implementation for process rollback
    return { success = true, rolledBackProcesses = rollbackRequest.targetProcesses }
end

-- Scale processes
function MaintenanceCoordinator.scaleProcesses(scalingRequest)
    -- Implementation for process scaling
    return { success = true, scaledProcesses = scalingRequest.targetProcesses }
end

-- Migrate processes
function MaintenanceCoordinator.migrateProcesses(migrationRequest)
    -- Implementation for process migration
    return { success = true, migratedProcesses = migrationRequest.targetProcesses }
end

-- Get deployment status
function MaintenanceCoordinator.getDeploymentStatus(deploymentId)
    local operation = MaintenanceCoordinator.activeOperations[deploymentId]
    if operation then
        return {
            operationId = operation.id,
            type = operation.type,
            status = operation.status,
            startTime = operation.startTime,
            results = operation.results
        }
    end
    
    -- Check history
    for _, historicalOp in ipairs(MaintenanceCoordinator.operationHistory) do
        if historicalOp.id == deploymentId then
            return historicalOp
        end
    end
    
    return nil
end

-- Get active deployments
function MaintenanceCoordinator.getActiveDeployments()
    local activeDeployments = {}
    for operationId, operation in pairs(MaintenanceCoordinator.activeOperations) do
        table.insert(activeDeployments, {
            operationId = operationId,
            type = operation.type,
            status = operation.status,
            startTime = operation.startTime
        })
    end
    return activeDeployments
end

-- Get recent deployments
function MaintenanceCoordinator.getRecentDeployments(limit)
    local recentDeployments = {}
    local count = 0
    local maxLimit = limit or 10
    
    for i = #MaintenanceCoordinator.operationHistory, 1, -1 do
        if count >= maxLimit then break end
        table.insert(recentDeployments, MaintenanceCoordinator.operationHistory[i])
        count = count + 1
    end
    
    return recentDeployments
end

-- Get system deployment health
function MaintenanceCoordinator.getSystemDeploymentHealth()
    return {
        maintenanceMode = MaintenanceCoordinator.maintenanceState.maintenanceMode,
        activeOperations = MaintenanceCoordinator._getTableSize(MaintenanceCoordinator.activeOperations),
        statistics = MaintenanceCoordinator.statistics
    }
end

-- Private helper functions

function MaintenanceCoordinator._notifyProcesses(notificationType, data)
    local notificationMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = notificationType
        },
        maintenanceNotification = {
            type = notificationType,
            data = data,
            timestamp = 0
        }
    }
    
    local routingResult = MessageRouter.routeMessage(
        notificationType,
        notificationMessage,
        "BROADCAST"
    )
    
    return routingResult
end

function MaintenanceCoordinator._executeSequentialDeployment(operation)
    local results = {}
    local successCount = 0
    
    for _, processId in ipairs(operation.deploymentPlan.targetProcesses) do
        local deployResult = MaintenanceCoordinator._deployToProcess(processId, operation.deploymentPlan)
        results[processId] = deployResult
        
        if deployResult.success then
            successCount = successCount + 1
        else
            -- Stop on first failure in sequential mode
            break
        end
    end
    
    return {
        success = successCount == #operation.deploymentPlan.targetProcesses,
        results = results,
        successCount = successCount
    }
end

function MaintenanceCoordinator._executeParallelDeployment(operation)
    local results = {}
    local successCount = 0
    
    -- In parallel mode, we would deploy to all processes simultaneously
    -- For this implementation, we'll simulate parallel execution
    for _, processId in ipairs(operation.deploymentPlan.targetProcesses) do
        local deployResult = MaintenanceCoordinator._deployToProcess(processId, operation.deploymentPlan)
        results[processId] = deployResult
        
        if deployResult.success then
            successCount = successCount + 1
        end
    end
    
    return {
        success = successCount == #operation.deploymentPlan.targetProcesses,
        results = results,
        successCount = successCount
    }
end

function MaintenanceCoordinator._executeDependencyAwareDeployment(operation)
    local targetProcesses = operation.deploymentPlan.targetProcesses
    local orderedProcesses = MaintenanceCoordinator._resolveDependencyOrder(targetProcesses)
    
    local results = {}
    local successCount = 0
    
    for _, processId in ipairs(orderedProcesses) do
        local deployResult = MaintenanceCoordinator._deployToProcess(processId, operation.deploymentPlan)
        results[processId] = deployResult
        
        if deployResult.success then
            successCount = successCount + 1
        else
            -- Stop on failure in dependency-aware mode
            print("[MaintenanceCoordinator] Deployment failed for " .. processId .. 
                  ", stopping dependency-aware deployment")
            break
        end
    end
    
    return {
        success = successCount == #orderedProcesses,
        results = results,
        successCount = successCount,
        executionOrder = orderedProcesses
    }
end

function MaintenanceCoordinator._deployToProcess(processId, deploymentPlan)
    -- Simulate deployment to process
    local deployMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "DEPLOYMENT"
        },
        deployment = {
            processId = processId,
            deploymentConfig = deploymentPlan.config,
            validationRequired = deploymentPlan.validation
        }
    }
    
    local routingResult = MessageRouter.routeMessage(
        "DEPLOYMENT",
        deployMessage,
        "DIRECT_ROUTE"
    )
    
    return {
        success = routingResult.success,
        processId = processId,
        deploymentTime = 0,
        error = routingResult.error
    }
end

function MaintenanceCoordinator._executeDeploymentRollback(operation)
    -- Implementation for deployment rollback
    return { success = true, rolledBackProcesses = operation.deploymentPlan.targetProcesses }
end

function MaintenanceCoordinator._rollbackProcess(processId, rollbackPoint, reason)
    -- Simulate process rollback
    return {
        success = true,
        processId = processId,
        rollbackPoint = rollbackPoint,
        rollbackTime = 0
    }
end

function MaintenanceCoordinator._determineShutdownOrder(targetProcesses, shutdownOrder)
    if shutdownOrder == "DEPENDENCY_AWARE" then
        return MaintenanceCoordinator._resolveDependencyOrder(targetProcesses, true) -- reverse for shutdown
    else
        return targetProcesses
    end
end

function MaintenanceCoordinator._resolveDependencyOrder(processes, reverse)
    -- Simple dependency resolution
    local orderedProcesses = {}
    local processed = {}
    
    local function addProcessWithDependencies(processId)
        if processed[processId] then
            return
        end
        
        local dependencies = MaintenanceCoordinator.processDependencies[processId] or {}
        for _, depId in ipairs(dependencies) do
            if not processed[depId] and MaintenanceCoordinator._containsProcess(processes, depId) then
                addProcessWithDependencies(depId)
            end
        end
        
        table.insert(orderedProcesses, processId)
        processed[processId] = true
    end
    
    for _, processId in ipairs(processes) do
        addProcessWithDependencies(processId)
    end
    
    if reverse then
        -- Reverse order for shutdown (dependents before dependencies)
        local reversedOrder = {}
        for i = #orderedProcesses, 1, -1 do
            table.insert(reversedOrder, orderedProcesses[i])
        end
        return reversedOrder
    end
    
    return orderedProcesses
end

function MaintenanceCoordinator._shutdownProcess(processId, gracePeriod, statePreservation)
    -- Simulate graceful process shutdown
    local shutdownMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "GRACEFUL_SHUTDOWN"
        },
        shutdown = {
            processId = processId,
            gracePeriodSeconds = gracePeriod,
            statePreservation = statePreservation
        }
    }
    
    local routingResult = MessageRouter.routeMessage(
        "GRACEFUL_SHUTDOWN",
        shutdownMessage,
        "DIRECT_ROUTE"
    )
    
    return {
        success = routingResult.success,
        processId = processId,
        shutdownTime = 0,
        statePreserved = statePreservation,
        error = routingResult.error
    }
end

function MaintenanceCoordinator._completeOperation(operation)
    local duration = operation.completionTime - operation.startTime
    
    -- Update statistics
    if operation.status == MaintenanceCoordinator.OPERATION_STATUS.COMPLETED then
        MaintenanceCoordinator.statistics.successfulOperations = MaintenanceCoordinator.statistics.successfulOperations + 1
    elseif operation.status == MaintenanceCoordinator.OPERATION_STATUS.FAILED then
        MaintenanceCoordinator.statistics.failedOperations = MaintenanceCoordinator.statistics.failedOperations + 1
    elseif operation.status == MaintenanceCoordinator.OPERATION_STATUS.ROLLED_BACK then
        MaintenanceCoordinator.statistics.rolledBackOperations = MaintenanceCoordinator.statistics.rolledBackOperations + 1
    end
    
    -- Update average operation time
    local currentAvg = MaintenanceCoordinator.statistics.averageOperationTime
    local totalOps = MaintenanceCoordinator.statistics.totalOperations
    if totalOps <= 1 then
        MaintenanceCoordinator.statistics.averageOperationTime = duration
    else
        MaintenanceCoordinator.statistics.averageOperationTime = 
            ((currentAvg * (totalOps - 1)) + duration) / totalOps
    end
    
    -- Move to history
    table.insert(MaintenanceCoordinator.operationHistory, operation)
    MaintenanceCoordinator.activeOperations[operation.id] = nil
    
    -- Manage history size
    if #MaintenanceCoordinator.operationHistory > 100 then
        table.remove(MaintenanceCoordinator.operationHistory, 1)
    end
end

function MaintenanceCoordinator._containsProcess(processes, processId)
    for _, id in ipairs(processes) do
        if id == processId then
            return true
        end
    end
    return false
end

function MaintenanceCoordinator._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return MaintenanceCoordinator