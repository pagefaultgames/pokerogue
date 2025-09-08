-- Rollback Manager Component
-- Implements rollback capabilities using MaintenanceCoordinator patterns

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local MessageRouter = require("game-logic.process-coordination.message-router")

local RollbackManager = {
    -- Configuration
    config = {
        rollbackTimeoutMinutes = 30,
        statePreservationEnabled = true,
        maxRollbackRetentionHours = 48,
        rollbackValidationRequired = true,
        gracefulRollbackTimeoutSeconds = 60,
        dependencyAwareRollback = true
    },
    
    -- Active rollback operations
    activeRollbacks = {},
    
    -- Rollback history
    rollbackHistory = {},
    
    -- Rollback state preservation
    rollbackStates = {},
    
    -- Process dependencies (mirrors MaintenanceCoordinator pattern)
    processDependencies = {
        ["coordinator-process"] = {},
        ["battle-process"] = {"coordinator-process"},
        ["pokemon-process"] = {"coordinator-process"},
        ["shop-process"] = {"coordinator-process"},
        ["security-process"] = {"coordinator-process"},
        ["admin-process"] = {},
        ["deployment-coordinator-process"] = {}
    },
    
    -- Rollback types
    ROLLBACK_TYPES = {
        DEPLOYMENT_ROLLBACK = "DEPLOYMENT_ROLLBACK",
        CONFIGURATION_ROLLBACK = "CONFIGURATION_ROLLBACK",
        VERSION_ROLLBACK = "VERSION_ROLLBACK",
        STATE_ROLLBACK = "STATE_ROLLBACK",
        EMERGENCY_ROLLBACK = "EMERGENCY_ROLLBACK"
    },
    
    -- Rollback statuses (aligned with MaintenanceCoordinator patterns)
    ROLLBACK_STATUS = {
        PENDING = "PENDING",
        PREPARING = "PREPARING",
        ROLLING_BACK = "ROLLING_BACK",
        VALIDATING = "VALIDATING",
        COMPLETED = "COMPLETED",
        FAILED = "FAILED",
        CANCELLED = "CANCELLED",
        PARTIAL = "PARTIAL"
    },
    
    -- Rollback strategies
    ROLLBACK_STRATEGIES = {
        SEQUENTIAL = "SEQUENTIAL",
        PARALLEL = "PARALLEL",
        DEPENDENCY_AWARE = "DEPENDENCY_AWARE",
        EMERGENCY = "EMERGENCY"
    }
}

-- Initialize rollback manager
function RollbackManager.initialize(config)
    if config then
        for key, value in pairs(config) do
            if RollbackManager.config[key] ~= nil then
                RollbackManager.config[key] = value
            end
        end
    end
    
    RollbackManager.activeRollbacks = {}
    RollbackManager.rollbackHistory = {}
    RollbackManager.rollbackStates = {}
    
    print("[RollbackManager] Rollback manager initialized with MaintenanceCoordinator patterns")
end

-- Execute rollback operation
function RollbackManager.executeRollback(rollbackRequest)
    local rollbackId = MessageCorrelator.generateId()
    local currentTime = 0
    
    local rollback = {
        id = rollbackId,
        status = RollbackManager.ROLLBACK_STATUS.PENDING,
        rollbackType = rollbackRequest.rollbackType or RollbackManager.ROLLBACK_TYPES.DEPLOYMENT_ROLLBACK,
        strategy = rollbackRequest.strategy or RollbackManager.ROLLBACK_STRATEGIES.DEPENDENCY_AWARE,
        targetProcesses = rollbackRequest.targetProcesses,
        rollbackPoint = rollbackRequest.rollbackPoint,
        reason = rollbackRequest.reason or "Manual rollback",
        deploymentId = rollbackRequest.deploymentId,
        preserveState = rollbackRequest.preserveState ~= false,
        validationRequired = rollbackRequest.validationRequired ~= false,
        adminUserId = rollbackRequest.adminUserId,
        startTime = currentTime,
        rollbackResults = {},
        rollbackPlan = {},
        stateBackup = {}
    }
    
    -- Validate rollback request
    local validationResult = RollbackManager._validateRollbackRequest(rollback)
    if not validationResult.success then
        return {
            success = false,
            error = validationResult.error,
            rollbackId = rollbackId
        }
    end
    
    -- Register rollback
    RollbackManager.activeRollbacks[rollbackId] = rollback
    
    rollback.status = RollbackManager.ROLLBACK_STATUS.PREPARING
    
    -- Phase 1: Prepare rollback (state preservation and planning)
    local prepareResult = RollbackManager._prepareRollback(rollback)
    if not prepareResult.success then
        rollback.status = RollbackManager.ROLLBACK_STATUS.FAILED
        rollback.error = prepareResult.error
        RollbackManager._completeRollback(rollback)
        return { success = false, error = prepareResult.error, rollbackId = rollbackId }
    end
    
    rollback.status = RollbackManager.ROLLBACK_STATUS.ROLLING_BACK
    
    -- Phase 2: Execute rollback
    local rollbackResult = RollbackManager._executeRollbackPlan(rollback)
    
    if rollbackResult.success or rollbackResult.partialSuccess then
        rollback.status = RollbackManager.ROLLBACK_STATUS.VALIDATING
        
        -- Phase 3: Validate rollback if required
        if rollback.validationRequired then
            local validationResult = RollbackManager._validateRollbackCompletion(rollback)
            if validationResult.success then
                rollback.status = RollbackManager.ROLLBACK_STATUS.COMPLETED
            else
                rollback.status = RollbackManager.ROLLBACK_STATUS.FAILED
                rollback.validationError = validationResult.error
            end
        else
            rollback.status = rollbackResult.partialSuccess and 
                RollbackManager.ROLLBACK_STATUS.PARTIAL or 
                RollbackManager.ROLLBACK_STATUS.COMPLETED
        end
    else
        rollback.status = RollbackManager.ROLLBACK_STATUS.FAILED
        rollback.error = rollbackResult.error
    end
    
    rollback.completionTime = 0
    rollback.rollbackResults = rollbackResult.results
    
    -- Complete rollback
    RollbackManager._completeRollback(rollback)
    
    print("[RollbackManager] Rollback operation completed: " .. rollbackId .. 
          " - Status: " .. rollback.status .. 
          " - Duration: " .. (rollback.completionTime - rollback.startTime) .. "s")
    
    return {
        success = rollback.status == RollbackManager.ROLLBACK_STATUS.COMPLETED,
        rollbackId = rollbackId,
        status = rollback.status,
        rollbackResults = rollback.rollbackResults,
        rollbackPlan = rollback.rollbackPlan,
        duration = rollback.completionTime - rollback.startTime,
        error = rollback.error or rollback.validationError
    }
end

-- Preserve state for rollback
function RollbackManager.preserveState(preservationRequest)
    local preservationId = MessageCorrelator.generateId()
    local currentTime = 0
    
    local statePreservation = {
        id = preservationId,
        deploymentId = preservationRequest.deploymentId,
        targetProcesses = preservationRequest.targetProcesses,
        stateType = preservationRequest.stateType or "FULL_STATE",
        timestamp = currentTime,
        preservedStates = {},
        expirationTime = currentTime + (RollbackManager.config.maxRollbackRetentionHours * 3600)
    }
    
    -- Preserve state for each target process
    local preservationResults = {}
    local successCount = 0
    
    for _, processId in ipairs(statePreservation.targetProcesses) do
        local processResult = RollbackManager._preserveProcessState(processId, statePreservation)
        preservationResults[processId] = processResult
        
        if processResult.success then
            successCount = successCount + 1
            statePreservation.preservedStates[processId] = processResult.stateData
        end
    end
    
    -- Store state preservation
    RollbackManager.rollbackStates[preservationId] = statePreservation
    
    print("[RollbackManager] State preserved for rollback: " .. preservationId .. 
          " - Success: " .. successCount .. "/" .. #statePreservation.targetProcesses)
    
    return {
        success = successCount == #statePreservation.targetProcesses,
        preservationId = preservationId,
        preservationResults = preservationResults,
        successCount = successCount,
        totalCount = #statePreservation.targetProcesses,
        expirationTime = statePreservation.expirationTime
    }
end

-- Get rollback status
function RollbackManager.getRollbackStatus(rollbackId)
    local rollback = RollbackManager.activeRollbacks[rollbackId]
    if rollback then
        return {
            success = true,
            rollback = {
                id = rollback.id,
                status = rollback.status,
                rollbackType = rollback.rollbackType,
                strategy = rollback.strategy,
                targetProcesses = rollback.targetProcesses,
                reason = rollback.reason,
                startTime = rollback.startTime,
                completionTime = rollback.completionTime,
                rollbackResults = rollback.rollbackResults,
                error = rollback.error
            }
        }
    end
    
    -- Check history
    for _, historicalRollback in ipairs(RollbackManager.rollbackHistory) do
        if historicalRollback.id == rollbackId then
            return {
                success = true,
                rollback = historicalRollback
            }
        end
    end
    
    return { success = false, error = "Rollback not found: " .. rollbackId }
end

-- Cancel active rollback
function RollbackManager.cancelRollback(rollbackId, reason)
    local rollback = RollbackManager.activeRollbacks[rollbackId]
    if not rollback then
        return { success = false, error = "Rollback not found: " .. rollbackId }
    end
    
    if rollback.status == RollbackManager.ROLLBACK_STATUS.COMPLETED or 
       rollback.status == RollbackManager.ROLLBACK_STATUS.FAILED then
        return { success = false, error = "Cannot cancel completed rollback" }
    end
    
    rollback.status = RollbackManager.ROLLBACK_STATUS.CANCELLED
    rollback.cancellationReason = reason or "Manual cancellation"
    rollback.completionTime = 0
    
    RollbackManager._completeRollback(rollback)
    
    return { success = true, rollbackId = rollbackId, status = rollback.status }
end

-- Private helper functions

function RollbackManager._validateRollbackRequest(rollback)
    if not rollback.targetProcesses or #rollback.targetProcesses == 0 then
        return { success = false, error = "Target processes required for rollback" }
    end
    
    if not rollback.rollbackPoint then
        return { success = false, error = "Rollback point required" }
    end
    
    if not RollbackManager.ROLLBACK_TYPES[rollback.rollbackType] then
        return { success = false, error = "Invalid rollback type: " .. rollback.rollbackType }
    end
    
    if not RollbackManager.ROLLBACK_STRATEGIES[rollback.strategy] then
        return { success = false, error = "Invalid rollback strategy: " .. rollback.strategy }
    end
    
    return { success = true }
end

function RollbackManager._prepareRollback(rollback)
    -- Generate rollback execution plan based on strategy
    local planResult = RollbackManager._generateRollbackPlan(rollback)
    if not planResult.success then
        return planResult
    end
    
    rollback.rollbackPlan = planResult.rollbackPlan
    
    -- Preserve current state if required
    if rollback.preserveState then
        local stateResult = RollbackManager._preserveCurrentState(rollback)
        if not stateResult.success then
            return { success = false, error = "Failed to preserve current state: " .. stateResult.error }
        end
        rollback.stateBackup = stateResult.stateBackup
    end
    
    -- Validate rollback dependencies
    if RollbackManager.config.dependencyAwareRollback then
        local depResult = RollbackManager._validateRollbackDependencies(rollback)
        if not depResult.success then
            return { success = false, error = "Rollback dependency validation failed: " .. depResult.error }
        end
    end
    
    return { success = true }
end

function RollbackManager._generateRollbackPlan(rollback)
    local strategy = rollback.strategy
    local targetProcesses = rollback.targetProcesses
    local rollbackPlan = {
        strategy = strategy,
        executionOrder = {},
        parallelGroups = {},
        dependencyMap = {}
    }
    
    if strategy == RollbackManager.ROLLBACK_STRATEGIES.SEQUENTIAL then
        rollbackPlan.executionOrder = targetProcesses
        
    elseif strategy == RollbackManager.ROLLBACK_STRATEGIES.PARALLEL then
        rollbackPlan.parallelGroups = { targetProcesses }
        rollbackPlan.executionOrder = targetProcesses
        
    elseif strategy == RollbackManager.ROLLBACK_STRATEGIES.DEPENDENCY_AWARE then
        -- Rollback in reverse dependency order (dependents first)
        local orderResult = RollbackManager._resolveRollbackDependencyOrder(targetProcesses)
        if not orderResult.success then
            return orderResult
        end
        rollbackPlan.executionOrder = orderResult.orderedProcesses
        rollbackPlan.dependencyMap = orderResult.dependencyMap
        
    elseif strategy == RollbackManager.ROLLBACK_STRATEGIES.EMERGENCY then
        -- Emergency rollback - all processes simultaneously with minimal validation
        rollbackPlan.parallelGroups = { targetProcesses }
        rollbackPlan.executionOrder = targetProcesses
        rollbackPlan.emergencyMode = true
        
    else
        return { success = false, error = "Unsupported rollback strategy: " .. strategy }
    end
    
    return { success = true, rollbackPlan = rollbackPlan }
end

function RollbackManager._resolveRollbackDependencyOrder(processes)
    -- Reverse the normal dependency order for rollback (dependents first)
    local orderedProcesses = {}
    local processed = {}
    local dependencyMap = {}
    
    -- Build dependency map
    for _, processId in ipairs(processes) do
        dependencyMap[processId] = RollbackManager.processDependencies[processId] or {}
    end
    
    -- Add processes in reverse dependency order
    local function addProcessForRollback(processId)
        if processed[processId] then
            return
        end
        
        -- First add any dependent processes
        for _, depProcessId in ipairs(processes) do
            if not processed[depProcessId] then
                local deps = dependencyMap[depProcessId] or {}
                for _, depId in ipairs(deps) do
                    if depId == processId then
                        -- depProcessId depends on processId, so roll back depProcessId first
                        addProcessForRollback(depProcessId)
                        break
                    end
                end
            end
        end
        
        -- Then add this process
        table.insert(orderedProcesses, processId)
        processed[processId] = true
    end
    
    -- Process all target processes
    for _, processId in ipairs(processes) do
        addProcessForRollback(processId)
    end
    
    return {
        success = true,
        orderedProcesses = orderedProcesses,
        dependencyMap = dependencyMap
    }
end

function RollbackManager._executeRollbackPlan(rollback)
    local plan = rollback.rollbackPlan
    local results = {}
    local successCount = 0
    local partialSuccess = false
    
    if plan.strategy == RollbackManager.ROLLBACK_STRATEGIES.PARALLEL or plan.emergencyMode then
        -- Execute parallel rollback
        for _, processId in ipairs(plan.executionOrder) do
            local rollbackResult = RollbackManager._rollbackProcess(processId, rollback)
            results[processId] = rollbackResult
            if rollbackResult.success then
                successCount = successCount + 1
            end
        end
        partialSuccess = successCount > 0 and successCount < #plan.executionOrder
    else
        -- Execute sequential/dependency-aware rollback
        for _, processId in ipairs(plan.executionOrder) do
            local rollbackResult = RollbackManager._rollbackProcess(processId, rollback)
            results[processId] = rollbackResult
            
            if rollbackResult.success then
                successCount = successCount + 1
            else
                -- For sequential rollback, consider partial success if some succeeded
                if successCount > 0 then
                    partialSuccess = true
                end
                break -- Stop on failure for sequential strategies
            end
        end
    end
    
    return {
        success = successCount == #rollback.targetProcesses,
        partialSuccess = partialSuccess,
        results = results,
        successCount = successCount,
        totalCount = #rollback.targetProcesses
    }
end

function RollbackManager._rollbackProcess(processId, rollback)
    local rollbackMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "PROCESS_ROLLBACK"
        },
        processRollback = {
            rollbackId = rollback.id,
            processId = processId,
            rollbackType = rollback.rollbackType,
            rollbackPoint = rollback.rollbackPoint,
            deploymentId = rollback.deploymentId,
            statePreservation = rollback.preserveState,
            gracefulTimeout = RollbackManager.config.gracefulRollbackTimeoutSeconds
        }
    }
    
    -- Route rollback message
    local routingResult = MessageRouter.routeMessage(
        "PROCESS_ROLLBACK",
        rollbackMessage,
        "DIRECT_ROUTE"
    )
    
    return {
        success = routingResult.success,
        processId = processId,
        rollbackTime = 0,
        rollbackPoint = rollback.rollbackPoint,
        correlationId = rollbackMessage.correlation.id,
        error = routingResult.error
    }
end

function RollbackManager._validateRollbackCompletion(rollback)
    -- Validate rollback completion for each target process
    local validationResults = {}
    local validCount = 0
    
    for _, processId in ipairs(rollback.targetProcesses) do
        local validationResult = RollbackManager._validateProcessRollback(processId, rollback)
        validationResults[processId] = validationResult
        
        if validationResult.success then
            validCount = validCount + 1
        end
    end
    
    rollback.validationResults = validationResults
    
    return {
        success = validCount == #rollback.targetProcesses,
        validationResults = validationResults,
        validCount = validCount,
        totalCount = #rollback.targetProcesses
    }
end

function RollbackManager._validateProcessRollback(processId, rollback)
    -- Simulate rollback validation
    local validationMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "ROLLBACK_VALIDATION"
        },
        rollbackValidation = {
            processId = processId,
            rollbackId = rollback.id,
            expectedRollbackPoint = rollback.rollbackPoint,
            validationType = "POST_ROLLBACK"
        }
    }
    
    local routingResult = MessageRouter.routeMessage(
        "ROLLBACK_VALIDATION",
        validationMessage,
        "DIRECT_ROUTE"
    )
    
    return {
        success = routingResult.success,
        processId = processId,
        validationTime = 0,
        rollbackVerified = routingResult.success,
        correlationId = validationMessage.correlation.id,
        error = routingResult.error
    }
end

function RollbackManager._preserveProcessState(processId, statePreservation)
    -- Simulate state preservation
    local stateMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "STATE_PRESERVATION"
        },
        statePreservation = {
            processId = processId,
            preservationId = statePreservation.id,
            stateType = statePreservation.stateType,
            timestamp = statePreservation.timestamp
        }
    }
    
    local routingResult = MessageRouter.routeMessage(
        "STATE_PRESERVATION",
        stateMessage,
        "DIRECT_ROUTE"
    )
    
    return {
        success = routingResult.success,
        processId = processId,
        stateData = routingResult.success and {
            processId = processId,
            stateSnapshot = "preserved_state_data_" .. processId,
            timestamp = statePreservation.timestamp
        } or nil,
        preservationTime = 0,
        correlationId = stateMessage.correlation.id,
        error = routingResult.error
    }
end

function RollbackManager._preserveCurrentState(rollback)
    local stateBackup = {
        rollbackId = rollback.id,
        timestamp = msg.Timestamp,
        processStates = {}
    }
    
    for _, processId in ipairs(rollback.targetProcesses) do
        local statePreservation = {
            id = MessageCorrelator.generateId(),
            deploymentId = rollback.deploymentId,
            targetProcesses = { processId },
            stateType = "ROLLBACK_STATE"
        }
        
        local preservationResult = RollbackManager._preserveProcessState(processId, statePreservation)
        if preservationResult.success then
            stateBackup.processStates[processId] = preservationResult.stateData
        end
    end
    
    return { success = true, stateBackup = stateBackup }
end

function RollbackManager._validateRollbackDependencies(rollback)
    -- Validate that dependencies allow for safe rollback
    for _, processId in ipairs(rollback.targetProcesses) do
        local dependencies = RollbackManager.processDependencies[processId] or {}
        for _, depId in ipairs(dependencies) do
            -- Check if dependency is also being rolled back
            local depInRollback = false
            for _, rollbackProcessId in ipairs(rollback.targetProcesses) do
                if rollbackProcessId == depId then
                    depInRollback = true
                    break
                end
            end
            
            if not depInRollback then
                -- Dependency not in rollback scope - log warning but allow
                print("[RollbackManager] Warning: Process " .. processId .. 
                      " depends on " .. depId .. " which is not in rollback scope")
            end
        end
    end
    
    return { success = true }
end

function RollbackManager._completeRollback(rollback)
    -- Move from active to history
    table.insert(RollbackManager.rollbackHistory, rollback)
    RollbackManager.activeRollbacks[rollback.id] = nil
    
    -- Manage history size
    if #RollbackManager.rollbackHistory > 100 then
        table.remove(RollbackManager.rollbackHistory, 1)
    end
    
    print("[RollbackManager] Rollback operation moved to history: " .. rollback.id)
end

-- Get rollback statistics
function RollbackManager.getStatistics()
    local stats = {
        activeRollbacks = RollbackManager._getTableSize(RollbackManager.activeRollbacks),
        totalRollbacks = #RollbackManager.rollbackHistory + RollbackManager._getTableSize(RollbackManager.activeRollbacks),
        rollbackHistory = #RollbackManager.rollbackHistory,
        preservedStates = RollbackManager._getTableSize(RollbackManager.rollbackStates),
        statusDistribution = {
            PENDING = 0,
            ROLLING_BACK = 0,
            COMPLETED = 0,
            FAILED = 0,
            CANCELLED = 0,
            PARTIAL = 0
        },
        typeDistribution = {}
    }
    
    -- Count active rollback statuses
    for _, rollback in pairs(RollbackManager.activeRollbacks) do
        stats.statusDistribution[rollback.status] = (stats.statusDistribution[rollback.status] or 0) + 1
    end
    
    -- Count historical rollback statuses and types
    for _, rollback in ipairs(RollbackManager.rollbackHistory) do
        if stats.statusDistribution[rollback.status] then
            stats.statusDistribution[rollback.status] = stats.statusDistribution[rollback.status] + 1
        end
        
        local rollbackType = rollback.rollbackType
        stats.typeDistribution[rollbackType] = (stats.typeDistribution[rollbackType] or 0) + 1
    end
    
    return stats
end

function RollbackManager._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return RollbackManager