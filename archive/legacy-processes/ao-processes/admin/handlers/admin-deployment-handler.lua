-- Admin Deployment Handler
-- Handles process lifecycle management, deployment coordination, and rollback operations

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local MessageRouter = require("game-logic.process-coordination.message-router")
local MaintenanceCoordinator = require("admin.components.maintenance-coordinator")
local LogAggregator = require("admin.components.log-aggregator")
local AlertManager = require("admin.components.alert-manager")

-- Private helper functions (forward declared)

local function handleProcessDeployment(targetProcesses, params, adminUserId)
    return MaintenanceCoordinator.deployProcesses({
        targetProcesses = targetProcesses,
        deploymentConfig = params.deploymentConfig,
        validationSteps = params.validationSteps,
        rollbackOnFailure = params.rollbackOnFailure,
        adminUserId = adminUserId
    })
end

local function handleProcessUpdate(targetProcesses, params, adminUserId)
    return MaintenanceCoordinator.updateProcesses({
        targetProcesses = targetProcesses,
        updateConfig = params.updateConfig,
        updateStrategy = params.updateStrategy or "ROLLING",
        validationRequired = params.validationRequired,
        adminUserId = adminUserId
    })
end

local function handleProcessRollback(targetProcesses, params, adminUserId)
    return MaintenanceCoordinator.rollbackProcesses({
        targetProcesses = targetProcesses,
        rollbackPoint = params.rollbackPoint,
        rollbackStrategy = params.rollbackStrategy or "IMMEDIATE",
        stateRestoration = params.stateRestoration,
        adminUserId = adminUserId
    })
end

local function handleProcessScaling(targetProcesses, params, adminUserId)
    return MaintenanceCoordinator.scaleProcesses({
        targetProcesses = targetProcesses,
        scalingAction = params.scalingAction, -- SCALE_UP, SCALE_DOWN, AUTO_SCALE
        targetCapacity = params.targetCapacity,
        scalingPolicy = params.scalingPolicy,
        adminUserId = adminUserId
    })
end

local function handleProcessMigration(targetProcesses, params, adminUserId)
    return MaintenanceCoordinator.migrateProcesses({
        targetProcesses = targetProcesses,
        migrationPlan = params.migrationPlan,
        migrationStrategy = params.migrationStrategy or "BLUE_GREEN",
        dataTransferRequired = params.dataTransferRequired,
        adminUserId = adminUserId
    })
end

-- Process lifecycle management handler
Handlers.add(
    "process-lifecycle",
    Handlers.utils.hasMatchingTag("Action", "PROCESS_LIFECYCLE"),
    function(msg)
        -- Authenticate lifecycle management request
        local authResult = ProcessAuthenticator.validateMessage(msg, "ADMIN")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "process-lifecycle"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for process lifecycle management",
                    requiredLevel = "ADMIN"
                })
            })
            return
        end
        
        local lifecycleData = json.decode(msg.Data)
        if not lifecycleData or not lifecycleData.operation then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "process-lifecycle"
                },
                Data = json.encode({
                    success = false,
                    error = "Lifecycle operation is required"
                })
            })
            return
        end
        
        local operation = lifecycleData.operation
        local targetProcesses = lifecycleData.targetProcesses or {}
        local operationParams = lifecycleData.operationParams or {}
        local correlationId = MessageCorrelator.generateId()
        
        -- Log lifecycle operation
        LogAggregator.logEvent({
            level = "INFO",
            component = "ProcessLifecycle",
            message = "Process lifecycle operation initiated: " .. operation,
            adminUserId = authResult.userId,
            correlationId = correlationId,
            targetProcesses = targetProcesses,
            operation = operation
        })
        
        local result = {}
        
        if operation == "DEPLOY" then
            result = handleProcessDeployment(targetProcesses, operationParams, authResult.userId)
        elseif operation == "UPDATE" then
            result = handleProcessUpdate(targetProcesses, operationParams, authResult.userId)
        elseif operation == "ROLLBACK" then
            result = handleProcessRollback(targetProcesses, operationParams, authResult.userId)
        elseif operation == "SCALE" then
            result = handleProcessScaling(targetProcesses, operationParams, authResult.userId)
        elseif operation == "MIGRATE" then
            result = handleProcessMigration(targetProcesses, operationParams, authResult.userId)
        else
            result = { success = false, error = "Unsupported lifecycle operation: " .. operation }
        end
        
        -- Generate alert for critical operations
        local criticalOperations = {"DEPLOY", "ROLLBACK", "MIGRATE"}
        local isCritical = false
        for _, criticalOp in ipairs(criticalOperations) do
            if operation == criticalOp then
                isCritical = true
                break
            end
        end
        
        if isCritical then
            AlertManager.generateAlert({
                type = "PROCESS_LIFECYCLE",
                severity = result.success and "INFO" or "ERROR",
                message = "Process lifecycle operation " .. (result.success and "completed" or "failed") .. ": " .. operation,
                details = {
                    operation = operation,
                    targetProcesses = targetProcesses,
                    adminUserId = authResult.userId,
                    result = result.success and "SUCCESS" or "FAILED"
                }
            })
        end
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "PROCESS_LIFECYCLE_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "process-lifecycle"
            },
            Data = json.encode({
                success = result.success,
                operation = operation,
                correlationId = correlationId,
                operationResult = result,
                timestamp = 0
            })
        })
        
        print("[AdminDeploymentHandler] Lifecycle operation '" .. operation .. "' " .. 
              (result.success and "completed" or "failed"))
    end
)

-- Deployment coordination handler
Handlers.add(
    "deployment-coordination",
    Handlers.utils.hasMatchingTag("Action", "DEPLOYMENT_COORDINATION"),
    function(msg)
        -- Authenticate deployment coordination
        local authResult = ProcessAuthenticator.validateMessage(msg, "ADMIN")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "deployment-coordination"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for deployment coordination",
                    requiredLevel = "ADMIN"
                })
            })
            return
        end
        
        local deploymentData = json.decode(msg.Data)
        if not deploymentData then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "deployment-coordination"
                },
                Data = json.encode({
                    success = false,
                    error = "Deployment data is required"
                })
            })
            return
        end
        
        local deploymentPlan = deploymentData.deploymentPlan
        local coordinationMode = deploymentData.coordinationMode or "SEQUENTIAL"
        local rollbackOnFailure = deploymentData.rollbackOnFailure ~= false
        
        -- Coordinate deployment across processes
        local coordinationResult = MaintenanceCoordinator.coordinateDeployment({
            deploymentPlan = deploymentPlan,
            coordinationMode = coordinationMode,
            rollbackOnFailure = rollbackOnFailure,
            adminUserId = authResult.userId
        })
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "DEPLOYMENT_COORDINATION_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "deployment-coordination"
            },
            Data = json.encode({
                success = coordinationResult.success,
                deploymentStatus = coordinationResult.status,
                deploymentResults = coordinationResult.results,
                affectedProcesses = coordinationResult.affectedProcesses,
                rollbackAvailable = coordinationResult.rollbackAvailable,
                timestamp = msg.Timestamp,
                error = coordinationResult.error
            })
        })
        
        print("[AdminDeploymentHandler] Deployment coordination " .. 
              (coordinationResult.success and "completed" or "failed"))
    end
)

-- Rollback management handler
Handlers.add(
    "rollback-management",
    Handlers.utils.hasMatchingTag("Action", "ROLLBACK_MANAGEMENT"),
    function(msg)
        -- Authenticate rollback management
        local authResult = ProcessAuthenticator.validateMessage(msg, "ADMIN")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "rollback-management"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for rollback management",
                    requiredLevel = "ADMIN"
                })
            })
            return
        end
        
        local rollbackData = json.decode(msg.Data)
        if not rollbackData or not rollbackData.rollbackOperation then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "rollback-management"
                },
                Data = json.encode({
                    success = false,
                    error = "Rollback operation is required"
                })
            })
            return
        end
        
        local rollbackOperation = rollbackData.rollbackOperation
        local targetProcesses = rollbackData.targetProcesses
        local rollbackPoint = rollbackData.rollbackPoint
        local rollbackReason = rollbackData.reason or "Administrative rollback"
        
        -- Execute rollback operation
        local rollbackResult = MaintenanceCoordinator.executeRollback({
            operation = rollbackOperation,
            targetProcesses = targetProcesses,
            rollbackPoint = rollbackPoint,
            reason = rollbackReason,
            adminUserId = authResult.userId
        })
        
        -- Generate critical alert for rollback
        AlertManager.generateAlert({
            type = "SYSTEM_ROLLBACK",
            severity = "CRITICAL",
            message = "System rollback " .. (rollbackResult.success and "completed" or "failed"),
            details = {
                operation = rollbackOperation,
                targetProcesses = targetProcesses,
                rollbackPoint = rollbackPoint,
                reason = rollbackReason,
                adminUserId = authResult.userId
            }
        })
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "ROLLBACK_MANAGEMENT_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "rollback-management"
            },
            Data = json.encode({
                success = rollbackResult.success,
                rollbackStatus = rollbackResult.status,
                rollbackResults = rollbackResult.results,
                affectedProcesses = rollbackResult.affectedProcesses,
                stateRestoration = rollbackResult.stateRestoration,
                timestamp = msg.Timestamp,
                error = rollbackResult.error
            })
        })
        
        print("[AdminDeploymentHandler] Rollback management " .. 
              (rollbackResult.success and "completed" or "failed"))
    end
)

-- Graceful shutdown coordination handler
Handlers.add(
    "graceful-shutdown",
    Handlers.utils.hasMatchingTag("Action", "GRACEFUL_SHUTDOWN"),
    function(msg)
        -- Authenticate shutdown coordination
        local authResult = ProcessAuthenticator.validateMessage(msg, "ADMIN")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "graceful-shutdown"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for graceful shutdown",
                    requiredLevel = "ADMIN"
                })
            })
            return
        end
        
        local shutdownData = json.decode(msg.Data)
        local targetProcesses = shutdownData and shutdownData.targetProcesses or {}
        local shutdownOrder = shutdownData and shutdownData.shutdownOrder or "DEPENDENCY_AWARE"
        local gracePeriod = shutdownData and shutdownData.gracePeriodSeconds or 30
        local statePreservation = shutdownData and shutdownData.statePreservation ~= false
        
        -- Coordinate graceful shutdown
        local shutdownResult = MaintenanceCoordinator.coordinateGracefulShutdown({
            targetProcesses = targetProcesses,
            shutdownOrder = shutdownOrder,
            gracePeriodSeconds = gracePeriod,
            statePreservation = statePreservation,
            adminUserId = authResult.userId
        })
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "GRACEFUL_SHUTDOWN_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "graceful-shutdown"
            },
            Data = json.encode({
                success = shutdownResult.success,
                shutdownStatus = shutdownResult.status,
                shutdownResults = shutdownResult.results,
                shutdownOrder = shutdownResult.executionOrder,
                statePreserved = shutdownResult.statePreserved,
                timestamp = msg.Timestamp,
                error = shutdownResult.error
            })
        })
        
        print("[AdminDeploymentHandler] Graceful shutdown coordination " .. 
              (shutdownResult.success and "completed" or "failed"))
    end
)

-- Deployment status query handler
Handlers.add(
    "deployment-status",
    Handlers.utils.hasMatchingTag("Action", "DEPLOYMENT_STATUS"),
    function(msg)
        -- Authenticate status query
        local authResult = ProcessAuthenticator.validateMessage(msg, "ELEVATED")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "deployment-status"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for deployment status",
                    requiredLevel = "ELEVATED"
                })
            })
            return
        end
        
        local statusData = json.decode(msg.Data)
        local deploymentId = statusData and statusData.deploymentId
        
        local deploymentStatus = {}
        
        if deploymentId then
            -- Get specific deployment status
            deploymentStatus = MaintenanceCoordinator.getDeploymentStatus(deploymentId)
        else
            -- Get all deployment statuses
            deploymentStatus = {
                activeDeployments = MaintenanceCoordinator.getActiveDeployments(),
                recentDeployments = MaintenanceCoordinator.getRecentDeployments(10),
                systemDeploymentHealth = MaintenanceCoordinator.getSystemDeploymentHealth()
            }
        end
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "DEPLOYMENT_STATUS_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "deployment-status"
            },
            Data = json.encode({
                success = true,
                deploymentStatus = deploymentStatus,
                timestamp = 0
            })
        })
        
        print("[AdminDeploymentHandler] Deployment status query processed")
    end
)

print("[AdminDeploymentHandler] Admin deployment handlers registered")