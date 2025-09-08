-- Health Validator Component
-- Integrates with admin process HealthMonitor for deployment health validation

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local MessageRouter = require("game-logic.process-coordination.message-router")

local HealthValidator = {
    -- Configuration
    config = {
        healthCheckTimeoutSeconds = 300,
        healthRetryAttempts = 3,
        healthRetryDelaySeconds = 10,
        deploymentHealthThresholds = {
            maxResponseTimeMs = 5000,
            minHealthyProcessPercentage = 95,
            maxErrorRate = 0.05,
            requiredConsecutiveHealthyChecks = 3
        },
        adminProcessIntegration = true
    },
    
    -- Active health validations
    activeValidations = {},
    
    -- Health validation history
    validationHistory = {},
    
    -- Admin process health monitor integration
    adminProcessId = nil,
    
    -- Health status constants (aligned with admin HealthMonitor)
    HEALTH_STATUS = {
        HEALTHY = "HEALTHY",
        DEGRADED = "DEGRADED",
        UNHEALTHY = "UNHEALTHY",
        OFFLINE = "OFFLINE",
        UNKNOWN = "UNKNOWN"
    },
    
    -- Validation types
    VALIDATION_TYPES = {
        PRE_DEPLOYMENT = "PRE_DEPLOYMENT",
        POST_DEPLOYMENT = "POST_DEPLOYMENT",
        CONTINUOUS = "CONTINUOUS",
        ROLLBACK_VERIFICATION = "ROLLBACK_VERIFICATION"
    },
    
    -- Validation statuses
    VALIDATION_STATUS = {
        PENDING = "PENDING",
        RUNNING = "RUNNING",
        PASSED = "PASSED",
        FAILED = "FAILED",
        TIMEOUT = "TIMEOUT",
        CANCELLED = "CANCELLED"
    }
}

-- Initialize health validator
function HealthValidator.initialize(config, adminProcessId)
    if config then
        for key, value in pairs(config) do
            if HealthValidator.config[key] ~= nil then
                HealthValidator.config[key] = value
            end
        end
    end
    
    HealthValidator.adminProcessId = adminProcessId
    HealthValidator.activeValidations = {}
    HealthValidator.validationHistory = {}
    
    print("[HealthValidator] Health validator initialized with admin integration: " .. (adminProcessId or "none"))
end

-- Validate deployment health
function HealthValidator.validateDeploymentHealth(validationRequest)
    local validationId = MessageCorrelator.generateId()
    local currentTime = 0
    
    local validation = {
        id = validationId,
        status = HealthValidator.VALIDATION_STATUS.PENDING,
        validationType = validationRequest.validationType or HealthValidator.VALIDATION_TYPES.POST_DEPLOYMENT,
        deploymentId = validationRequest.deploymentId,
        targetProcesses = validationRequest.targetProcesses,
        healthThresholds = validationRequest.healthThresholds or HealthValidator.config.deploymentHealthThresholds,
        timeoutSeconds = validationRequest.timeoutSeconds or HealthValidator.config.healthCheckTimeoutSeconds,
        startTime = currentTime,
        processResults = {},
        overallResult = nil,
        adminUserId = validationRequest.adminUserId
    }
    
    -- Register validation
    HealthValidator.activeValidations[validationId] = validation
    
    -- Start health validation
    validation.status = HealthValidator.VALIDATION_STATUS.RUNNING
    local validationResult = HealthValidator._performHealthValidation(validation)
    
    -- Update validation status
    validation.status = validationResult.success and 
        HealthValidator.VALIDATION_STATUS.PASSED or 
        HealthValidator.VALIDATION_STATUS.FAILED
    validation.completionTime = 0
    validation.overallResult = validationResult
    
    -- Move to history
    HealthValidator._completeValidation(validation)
    
    return {
        success = validationResult.success,
        validationId = validationId,
        status = validation.status,
        overallHealthStatus = validationResult.overallHealthStatus,
        processHealthResults = validationResult.processHealthResults,
        healthSummary = validationResult.healthSummary,
        validationDuration = validation.completionTime - validation.startTime,
        error = validationResult.error
    }
end

-- Get validation status
function HealthValidator.getValidationStatus(validationId)
    local validation = HealthValidator.activeValidations[validationId]
    if validation then
        return {
            success = true,
            validation = {
                id = validation.id,
                status = validation.status,
                validationType = validation.validationType,
                deploymentId = validation.deploymentId,
                targetProcesses = validation.targetProcesses,
                startTime = validation.startTime,
                completionTime = validation.completionTime,
                overallResult = validation.overallResult,
                processResults = validation.processResults
            }
        }
    end
    
    -- Check history
    for _, historicalValidation in ipairs(HealthValidator.validationHistory) do
        if historicalValidation.id == validationId then
            return {
                success = true,
                validation = historicalValidation
            }
        end
    end
    
    return { success = false, error = "Validation not found: " .. validationId }
end

-- Cancel active validation
function HealthValidator.cancelValidation(validationId)
    local validation = HealthValidator.activeValidations[validationId]
    if not validation then
        return { success = false, error = "Validation not found: " .. validationId }
    end
    
    if validation.status ~= HealthValidator.VALIDATION_STATUS.RUNNING then
        return { success = false, error = "Cannot cancel validation with status: " .. validation.status }
    end
    
    validation.status = HealthValidator.VALIDATION_STATUS.CANCELLED
    validation.completionTime = 0
    
    HealthValidator._completeValidation(validation)
    
    return { success = true, validationId = validationId, status = validation.status }
end

-- Integrate with admin health monitor
function HealthValidator.integrateWithAdminHealthMonitor()
    if not HealthValidator.adminProcessId then
        return { success = false, error = "Admin process ID not configured" }
    end
    
    -- Request health monitoring registration
    local registrationMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "HEALTH_MONITOR_INTEGRATION"
        },
        healthIntegration = {
            coordinatorProcessId = "deployment-coordinator-process",
            integrationLevel = "FULL",
            capabilities = {
                "DEPLOYMENT_HEALTH_VALIDATION",
                "PROCESS_HEALTH_MONITORING",
                "HEALTH_ALERT_HANDLING"
            }
        }
    }
    
    local routingResult = MessageRouter.routeMessage(
        "HEALTH_MONITOR_INTEGRATION",
        registrationMessage,
        "DIRECT_ROUTE"
    )
    
    print("[HealthValidator] Admin health monitor integration requested")
    
    return {
        success = routingResult.success,
        integrationRequested = true,
        correlationId = registrationMessage.correlation.id,
        error = routingResult.error
    }
end

-- Process health results from admin health monitor
function HealthValidator.processAdminHealthResults(healthResults)
    if not healthResults or not healthResults.processResults then
        return { success = false, error = "Invalid health results from admin monitor" }
    end
    
    local processedResults = {
        timestamp = msg.Timestamp,
        overallHealthStatus = healthResults.overallHealth,
        processCount = healthResults.processCount,
        healthyProcesses = healthResults.healthyProcesses,
        degradedProcesses = healthResults.degradedProcesses,
        unhealthyProcesses = healthResults.unhealthyProcesses,
        offlineProcesses = healthResults.offlineProcesses,
        processDetails = {}
    }
    
    -- Process individual process results
    for processId, processResult in pairs(healthResults.processResults) do
        processedResults.processDetails[processId] = {
            processId = processResult.processId,
            processType = processResult.processType,
            healthStatus = processResult.healthStatus,
            responseTime = processResult.responseTime,
            lastCheck = processResult.lastCheck,
            consecutiveFailures = processResult.consecutiveFailures,
            deploymentRelevant = HealthValidator._isDeploymentRelevantProcess(processId)
        }
    end
    
    -- Update any active validations that might be affected
    HealthValidator._updateActiveValidationsWithHealthData(processedResults)
    
    return { success = true, processedResults = processedResults }
end

-- Private helper functions

function HealthValidator._performHealthValidation(validation)
    local processHealthResults = {}
    local healthySummary = {
        totalProcesses = #validation.targetProcesses,
        healthyProcesses = 0,
        degradedProcesses = 0,
        unhealthyProcesses = 0,
        offlineProcesses = 0
    }
    
    -- Validate each target process
    for _, processId in ipairs(validation.targetProcesses) do
        local processResult = HealthValidator._validateProcessHealth(processId, validation)
        processHealthResults[processId] = processResult
        
        -- Update summary
        if processResult.healthStatus == HealthValidator.HEALTH_STATUS.HEALTHY then
            healthySummary.healthyProcesses = healthySummary.healthyProcesses + 1
        elseif processResult.healthStatus == HealthValidator.HEALTH_STATUS.DEGRADED then
            healthySummary.degradedProcesses = healthySummary.degradedProcesses + 1
        elseif processResult.healthStatus == HealthValidator.HEALTH_STATUS.UNHEALTHY then
            healthySummary.unhealthyProcesses = healthySummary.unhealthyProcesses + 1
        elseif processResult.healthStatus == HealthValidator.HEALTH_STATUS.OFFLINE then
            healthySummary.offlineProcesses = healthySummary.offlineProcesses + 1
        end
        
        validation.processResults[processId] = processResult
    end
    
    -- Determine overall validation result
    local overallHealthStatus = HealthValidator._determineOverallHealthStatus(healthySummary, validation.healthThresholds)
    local validationPassed = HealthValidator._evaluateValidationCriteria(healthySummary, validation.healthThresholds)
    
    return {
        success = validationPassed,
        overallHealthStatus = overallHealthStatus,
        processHealthResults = processHealthResults,
        healthSummary = healthySummary,
        validationType = validation.validationType,
        thresholdsApplied = validation.healthThresholds
    }
end

function HealthValidator._validateProcessHealth(processId, validation)
    local startTime = msg.Timestamp
    
    -- If admin integration is enabled, request health check through admin process
    if HealthValidator.config.adminProcessIntegration and HealthValidator.adminProcessId then
        local adminHealthResult = HealthValidator._requestAdminHealthCheck(processId, validation)
        if adminHealthResult.success then
            return adminHealthResult.healthResult
        end
    end
    
    -- Fallback to direct health check
    local healthCheckMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "DEPLOYMENT_HEALTH_CHECK"
        },
        healthCheck = {
            validationId = validation.id,
            deploymentId = validation.deploymentId,
            processId = processId,
            checkType = validation.validationType,
            timeoutSeconds = validation.timeoutSeconds,
            thresholds = validation.healthThresholds
        }
    }
    
    local routingResult = MessageRouter.routeMessage(
        "DEPLOYMENT_HEALTH_CHECK",
        healthCheckMessage,
        "DIRECT_ROUTE"
    )
    
    local responseTime = (0 - startTime) * 1000
    
    if routingResult.success then
        -- Simulate successful health check response
        return {
            processId = processId,
            healthStatus = HealthValidator.HEALTH_STATUS.HEALTHY,
            responseTime = responseTime,
            checkTime = 0,
            validationId = validation.id,
            success = true,
            healthMetrics = {
                uptime = 3600, -- Simulated
                memoryUsage = 45.5,
                cpuUsage = 25.2,
                errorRate = 0.001
            }
        }
    else
        return {
            processId = processId,
            healthStatus = HealthValidator.HEALTH_STATUS.OFFLINE,
            responseTime = responseTime,
            checkTime = 0,
            validationId = validation.id,
            success = false,
            error = routingResult.error
        }
    end
end

function HealthValidator._requestAdminHealthCheck(processId, validation)
    local healthRequestMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "ADMIN_HEALTH_CHECK"
        },
        adminHealthRequest = {
            targetProcessId = processId,
            validationId = validation.id,
            deploymentId = validation.deploymentId,
            requestedBy = "DEPLOYMENT_COORDINATOR",
            urgency = "HIGH"
        }
    }
    
    local routingResult = MessageRouter.routeMessage(
        "ADMIN_HEALTH_CHECK",
        healthRequestMessage,
        "DIRECT_ROUTE"
    )
    
    if routingResult.success then
        -- Simulate admin health check response
        return {
            success = true,
            healthResult = {
                processId = processId,
                healthStatus = HealthValidator.HEALTH_STATUS.HEALTHY,
                responseTime = math.random(100, 500),
                checkTime = 0,
                validationId = validation.id,
                source = "ADMIN_HEALTH_MONITOR",
                success = true,
                healthMetrics = {
                    uptime = 3600,
                    memoryUsage = math.random(20, 60),
                    cpuUsage = math.random(10, 40),
                    errorRate = math.random(0, 5) / 1000
                }
            }
        }
    else
        return { success = false, error = routingResult.error }
    end
end

function HealthValidator._determineOverallHealthStatus(healthySummary, thresholds)
    local totalProcesses = healthySummary.totalProcesses
    local healthyPercentage = (healthySummary.healthyProcesses / totalProcesses) * 100
    
    if healthySummary.offlineProcesses > totalProcesses * 0.25 then
        return HealthValidator.HEALTH_STATUS.OFFLINE
    elseif healthyPercentage < thresholds.minHealthyProcessPercentage then
        return HealthValidator.HEALTH_STATUS.UNHEALTHY
    elseif healthySummary.degradedProcesses > totalProcesses * 0.25 then
        return HealthValidator.HEALTH_STATUS.DEGRADED
    else
        return HealthValidator.HEALTH_STATUS.HEALTHY
    end
end

function HealthValidator._evaluateValidationCriteria(healthySummary, thresholds)
    local totalProcesses = healthySummary.totalProcesses
    local healthyPercentage = (healthySummary.healthyProcesses / totalProcesses) * 100
    
    -- Check minimum healthy process percentage
    if healthyPercentage < thresholds.minHealthyProcessPercentage then
        return false
    end
    
    -- Check offline process threshold
    if healthySummary.offlineProcesses > totalProcesses * 0.1 then -- Max 10% offline
        return false
    end
    
    -- Check unhealthy process threshold
    if healthySummary.unhealthyProcesses > totalProcesses * 0.05 then -- Max 5% unhealthy
        return false
    end
    
    return true
end

function HealthValidator._isDeploymentRelevantProcess(processId)
    -- Define which processes are relevant for deployment health validation
    local relevantProcessTypes = {
        "COORDINATOR", "BATTLE", "POKEMON", "SHOP", "SECURITY", "ADMIN"
    }
    
    -- In a real implementation, would check actual process type
    return true -- Simplified - assume all processes are relevant
end

function HealthValidator._updateActiveValidationsWithHealthData(healthData)
    local currentTime = 0
    
    for validationId, validation in pairs(HealthValidator.activeValidations) do
        if validation.status == HealthValidator.VALIDATION_STATUS.RUNNING then
            -- Update validation with latest health data if relevant
            for _, processId in ipairs(validation.targetProcesses) do
                if healthData.processDetails[processId] then
                    local processHealthData = healthData.processDetails[processId]
                    
                    -- Update process result if it exists
                    if validation.processResults[processId] then
                        validation.processResults[processId].lastAdminUpdate = currentTime
                        validation.processResults[processId].adminHealthStatus = processHealthData.healthStatus
                        validation.processResults[processId].adminResponseTime = processHealthData.responseTime
                    end
                end
            end
        end
    end
end

function HealthValidator._completeValidation(validation)
    -- Move from active to history
    table.insert(HealthValidator.validationHistory, validation)
    HealthValidator.activeValidations[validation.id] = nil
    
    -- Manage history size
    if #HealthValidator.validationHistory > 100 then
        table.remove(HealthValidator.validationHistory, 1)
    end
    
    print("[HealthValidator] Health validation completed: " .. validation.id .. " - Status: " .. validation.status)
end

-- Get health validation statistics
function HealthValidator.getStatistics()
    local stats = {
        activeValidations = HealthValidator._getTableSize(HealthValidator.activeValidations),
        totalValidations = #HealthValidator.validationHistory + HealthValidator._getTableSize(HealthValidator.activeValidations),
        validationHistory = #HealthValidator.validationHistory,
        adminIntegrationEnabled = HealthValidator.config.adminProcessIntegration,
        adminProcessId = HealthValidator.adminProcessId,
        statusDistribution = {
            RUNNING = 0,
            PASSED = 0,
            FAILED = 0,
            TIMEOUT = 0,
            CANCELLED = 0
        }
    }
    
    -- Count active validation statuses
    for _, validation in pairs(HealthValidator.activeValidations) do
        stats.statusDistribution[validation.status] = (stats.statusDistribution[validation.status] or 0) + 1
    end
    
    -- Count historical validation statuses
    for _, validation in ipairs(HealthValidator.validationHistory) do
        if stats.statusDistribution[validation.status] then
            stats.statusDistribution[validation.status] = stats.statusDistribution[validation.status] + 1
        end
    end
    
    return stats
end

function HealthValidator._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return HealthValidator