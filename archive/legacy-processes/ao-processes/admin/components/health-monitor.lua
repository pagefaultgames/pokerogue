-- Health Monitor Component
-- Provides comprehensive process health tracking and monitoring capabilities

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local MessageRouter = require("game-logic.process-coordination.message-router")

local HealthMonitor = {
    -- Monitored processes registry
    monitoredProcesses = {},
    
    -- Health check configuration
    config = {
        healthCheckIntervalSeconds = 30,
        healthTimeoutMs = 5000,
        maxConsecutiveFailures = 3,
        alertThresholds = {
            responseTimeMs = 5000,
            memoryUsagePercent = 85,
            cpuUsagePercent = 90,
            errorRate = 0.1
        }
    },
    
    -- Health status tracking
    healthStatistics = {
        totalHealthChecks = 0,
        successfulChecks = 0,
        failedChecks = 0,
        averageResponseTime = 0,
        lastSystemHealthCheck = 0
    },
    
    -- Health status constants
    HEALTH_STATUS = {
        HEALTHY = "HEALTHY",
        DEGRADED = "DEGRADED", 
        UNHEALTHY = "UNHEALTHY",
        OFFLINE = "OFFLINE",
        UNKNOWN = "UNKNOWN"
    }
}

-- Initialize health monitoring system
function HealthMonitor.initialize()
    HealthMonitor.monitoredProcesses = {}
    HealthMonitor.healthStatistics = {
        totalHealthChecks = 0,
        successfulChecks = 0,
        failedChecks = 0,
        averageResponseTime = 0,
        lastSystemHealthCheck = 0
    }
    print("[HealthMonitor] Health monitoring system initialized")
end

-- Register a process for health monitoring
function HealthMonitor.registerProcess(processId, processType, healthConfig)
    if not processId or type(processId) ~= "string" or processId == "" then
        return { success = false, error = "Process ID is required" }
    end
    
    local healthRecord = {
        processId = processId,
        processType = processType or "UNKNOWN",
        healthStatus = HealthMonitor.HEALTH_STATUS.UNKNOWN,
        lastHealthCheck = 0,
        lastSuccessfulCheck = 0,
        consecutiveFailures = 0,
        healthMetrics = {
            uptime = 0,
            memoryUsage = 0,
            cpuUsage = 0,
            responseTime = 0,
            errorCount = 0,
            errorRate = 0
        },
        healthConfig = healthConfig or {},
        registeredAt = 0,
        alertsGenerated = 0,
        healthHistory = {}
    }
    
    HealthMonitor.monitoredProcesses[processId] = healthRecord
    
    print("[HealthMonitor] Process registered for monitoring: " .. processId .. " (" .. processType .. ")")
    return { success = true, processId = processId }
end

-- Unregister a process from health monitoring
function HealthMonitor.unregisterProcess(processId)
    if HealthMonitor.monitoredProcesses[processId] then
        HealthMonitor.monitoredProcesses[processId] = nil
        print("[HealthMonitor] Process unregistered from monitoring: " .. processId)
        return { success = true }
    else
        return { success = false, error = "Process not found in monitoring registry" }
    end
end

-- Perform health check on specific process
function HealthMonitor.performHealthCheck(processId)
    local processRecord = HealthMonitor.monitoredProcesses[processId]
    if not processRecord then
        return { success = false, error = "Process not registered for monitoring" }
    end
    
    local correlationId = MessageCorrelator.generateId()
    local startTime = msg.Timestamp
    
    -- Send health check message to process
    local healthCheckMessage = {
        correlation = {
            id = correlationId,
            requestType = "HEALTH_CHECK"
        },
        healthQuery = {
            queryType = "FULL_HEALTH",
            includeMetrics = true,
            timestamp = startTime
        }
    }
    
    -- Route health check message
    local routingResult = MessageRouter.routeMessage(
        "HEALTH_CHECK",
        healthCheckMessage,
        "DIRECT_ROUTE"
    )
    
    HealthMonitor.healthStatistics.totalHealthChecks = HealthMonitor.healthStatistics.totalHealthChecks + 1
    
    if routingResult.success then
        -- Health check sent successfully, record metrics when response is received
        processRecord.lastHealthCheck = startTime
        return { success = true, correlationId = correlationId, startTime = startTime }
    else
        -- Health check failed to send
        processRecord.consecutiveFailures = processRecord.consecutiveFailures + 1
        processRecord.healthStatus = HealthMonitor._determineHealthStatus(processRecord)
        HealthMonitor.healthStatistics.failedChecks = HealthMonitor.healthStatistics.failedChecks + 1
        
        return { success = false, error = routingResult.error }
    end
end

-- Process health response from monitored process
function HealthMonitor.processHealthResponse(processId, healthResponse, requestStartTime)
    local processRecord = HealthMonitor.monitoredProcesses[processId]
    if not processRecord then
        return { success = false, error = "Process not registered for monitoring" }
    end
    
    local responseTime = (0 - requestStartTime) * 1000 -- Convert to milliseconds
    local healthData = healthResponse.healthData
    
    if healthData then
        -- Update process health metrics
        processRecord.healthMetrics = {
            uptime = healthData.healthMetrics and healthData.healthMetrics.uptime or 0,
            memoryUsage = healthData.healthMetrics and healthData.healthMetrics.memoryUsage or 0,
            cpuUsage = healthData.healthMetrics and healthData.healthMetrics.cpuUsage or 0,
            responseTime = responseTime,
            errorCount = healthData.recentErrors and healthData.recentErrors.errorCount or 0,
            errorRate = healthData.performanceMetrics and healthData.performanceMetrics.errorRate or 0
        }
        
        -- Reset consecutive failures on successful health check
        processRecord.consecutiveFailures = 0
        processRecord.lastSuccessfulCheck = 0
        
        -- Determine health status based on metrics
        processRecord.healthStatus = HealthMonitor._determineHealthStatus(processRecord)
        
        -- Record health history
        HealthMonitor._recordHealthHistory(processId, processRecord)
        
        -- Update statistics
        HealthMonitor.healthStatistics.successfulChecks = HealthMonitor.healthStatistics.successfulChecks + 1
        HealthMonitor._updateAverageResponseTime(responseTime)
        
        return { success = true, healthStatus = processRecord.healthStatus }
    else
        -- Invalid health response
        processRecord.consecutiveFailures = processRecord.consecutiveFailures + 1
        processRecord.healthStatus = HealthMonitor._determineHealthStatus(processRecord)
        HealthMonitor.healthStatistics.failedChecks = HealthMonitor.healthStatistics.failedChecks + 1
        
        return { success = false, error = "Invalid health response data" }
    end
end

-- Perform system-wide health check
function HealthMonitor.performSystemHealthCheck()
    local results = {
        timestamp = msg.Timestamp,
        overallHealth = HealthMonitor.HEALTH_STATUS.HEALTHY,
        processCount = 0,
        healthyProcesses = 0,
        degradedProcesses = 0,
        unhealthyProcesses = 0,
        offlineProcesses = 0,
        processResults = {}
    }
    
    for processId, processRecord in pairs(HealthMonitor.monitoredProcesses) do
        local healthCheckResult = HealthMonitor.performHealthCheck(processId)
        
        results.processCount = results.processCount + 1
        results.processResults[processId] = {
            processId = processId,
            processType = processRecord.processType,
            healthStatus = processRecord.healthStatus,
            responseTime = processRecord.healthMetrics.responseTime,
            lastCheck = processRecord.lastHealthCheck,
            consecutiveFailures = processRecord.consecutiveFailures
        }
        
        -- Count process health status distribution
        if processRecord.healthStatus == HealthMonitor.HEALTH_STATUS.HEALTHY then
            results.healthyProcesses = results.healthyProcesses + 1
        elseif processRecord.healthStatus == HealthMonitor.HEALTH_STATUS.DEGRADED then
            results.degradedProcesses = results.degradedProcesses + 1
        elseif processRecord.healthStatus == HealthMonitor.HEALTH_STATUS.UNHEALTHY then
            results.unhealthyProcesses = results.unhealthyProcesses + 1
        elseif processRecord.healthStatus == HealthMonitor.HEALTH_STATUS.OFFLINE then
            results.offlineProcesses = results.offlineProcesses + 1
        end
    end
    
    -- Determine overall system health
    if results.unhealthyProcesses > 0 or results.offlineProcesses > results.processCount * 0.5 then
        results.overallHealth = HealthMonitor.HEALTH_STATUS.UNHEALTHY
    elseif results.degradedProcesses > results.processCount * 0.25 then
        results.overallHealth = HealthMonitor.HEALTH_STATUS.DEGRADED
    end
    
    HealthMonitor.healthStatistics.lastSystemHealthCheck = 0
    
    print("[HealthMonitor] System health check completed - Overall: " .. results.overallHealth .. 
          " (" .. results.healthyProcesses .. "/" .. results.processCount .. " healthy)")
    
    return results
end

-- Get health status for specific process
function HealthMonitor.getProcessHealth(processId)
    local processRecord = HealthMonitor.monitoredProcesses[processId]
    if not processRecord then
        return nil
    end
    
    return {
        processId = processId,
        processType = processRecord.processType,
        healthStatus = processRecord.healthStatus,
        healthMetrics = processRecord.healthMetrics,
        lastHealthCheck = processRecord.lastHealthCheck,
        lastSuccessfulCheck = processRecord.lastSuccessfulCheck,
        consecutiveFailures = processRecord.consecutiveFailures,
        registeredAt = processRecord.registeredAt,
        alertsGenerated = processRecord.alertsGenerated
    }
end

-- Get health status for all monitored processes
function HealthMonitor.getAllProcessHealth()
    local allProcessHealth = {}
    
    for processId, processRecord in pairs(HealthMonitor.monitoredProcesses) do
        allProcessHealth[processId] = HealthMonitor.getProcessHealth(processId)
    end
    
    return allProcessHealth
end

-- Get process summary for dashboard display
function HealthMonitor.getProcessSummary()
    local summary = {
        totalProcesses = 0,
        healthyProcesses = 0,
        degradedProcesses = 0,
        unhealthyProcesses = 0,
        offlineProcesses = 0,
        processTypes = {}
    }
    
    for processId, processRecord in pairs(HealthMonitor.monitoredProcesses) do
        summary.totalProcesses = summary.totalProcesses + 1
        
        -- Count by health status
        if processRecord.healthStatus == HealthMonitor.HEALTH_STATUS.HEALTHY then
            summary.healthyProcesses = summary.healthyProcesses + 1
        elseif processRecord.healthStatus == HealthMonitor.HEALTH_STATUS.DEGRADED then
            summary.degradedProcesses = summary.degradedProcesses + 1
        elseif processRecord.healthStatus == HealthMonitor.HEALTH_STATUS.UNHEALTHY then
            summary.unhealthyProcesses = summary.unhealthyProcesses + 1
        elseif processRecord.healthStatus == HealthMonitor.HEALTH_STATUS.OFFLINE then
            summary.offlineProcesses = summary.offlineProcesses + 1
        end
        
        -- Count by process type
        local processType = processRecord.processType
        if not summary.processTypes[processType] then
            summary.processTypes[processType] = 0
        end
        summary.processTypes[processType] = summary.processTypes[processType] + 1
    end
    
    return summary
end

-- Get overall system health status
function HealthMonitor.getOverallHealthStatus()
    local summary = HealthMonitor.getProcessSummary()
    
    if summary.totalProcesses == 0 then
        return HealthMonitor.HEALTH_STATUS.UNKNOWN
    end
    
    local unhealthyRatio = (summary.unhealthyProcesses + summary.offlineProcesses) / summary.totalProcesses
    local degradedRatio = summary.degradedProcesses / summary.totalProcesses
    
    if unhealthyRatio > 0.5 then
        return HealthMonitor.HEALTH_STATUS.UNHEALTHY
    elseif unhealthyRatio > 0.25 or degradedRatio > 0.5 then
        return HealthMonitor.HEALTH_STATUS.DEGRADED
    else
        return HealthMonitor.HEALTH_STATUS.HEALTHY
    end
end

-- Get count of monitored processes
function HealthMonitor.getMonitoredProcessCount()
    local count = 0
    for _ in pairs(HealthMonitor.monitoredProcesses) do
        count = count + 1
    end
    return count
end

-- Update health monitoring thresholds
function HealthMonitor.updateThresholds(newThresholds)
    if not newThresholds or type(newThresholds) ~= "table" then
        return { success = false, error = "Invalid threshold configuration" }
    end
    
    for key, value in pairs(newThresholds) do
        if HealthMonitor.config.alertThresholds[key] then
            HealthMonitor.config.alertThresholds[key] = value
        end
    end
    
    print("[HealthMonitor] Health thresholds updated")
    return { success = true, thresholds = HealthMonitor.config.alertThresholds }
end

-- Get health monitoring statistics
function HealthMonitor.getStatistics()
    return {
        healthStatistics = HealthMonitor.healthStatistics,
        monitoredProcessCount = HealthMonitor.getMonitoredProcessCount(),
        overallHealthStatus = HealthMonitor.getOverallHealthStatus(),
        configuration = HealthMonitor.config,
        processSummary = HealthMonitor.getProcessSummary()
    }
end

-- Private helper functions

function HealthMonitor._determineHealthStatus(processRecord)
    local metrics = processRecord.healthMetrics
    local config = HealthMonitor.config.alertThresholds
    
    -- Check if process is offline (too many consecutive failures)
    if processRecord.consecutiveFailures >= HealthMonitor.config.maxConsecutiveFailures then
        return HealthMonitor.HEALTH_STATUS.OFFLINE
    end
    
    -- Check for unhealthy conditions
    if (metrics.responseTime > config.responseTimeMs) or
       (metrics.memoryUsage > config.memoryUsagePercent) or
       (metrics.cpuUsage > config.cpuUsagePercent) or
       (metrics.errorRate > config.errorRate) then
        return HealthMonitor.HEALTH_STATUS.UNHEALTHY
    end
    
    -- Check for degraded conditions (warning levels)
    if (metrics.responseTime > config.responseTimeMs * 0.7) or
       (metrics.memoryUsage > config.memoryUsagePercent * 0.8) or
       (metrics.cpuUsage > config.cpuUsagePercent * 0.8) or
       (metrics.errorRate > config.errorRate * 0.5) then
        return HealthMonitor.HEALTH_STATUS.DEGRADED
    end
    
    return HealthMonitor.HEALTH_STATUS.HEALTHY
end

function HealthMonitor._recordHealthHistory(processId, processRecord)
    if not processRecord.healthHistory then
        processRecord.healthHistory = {}
    end
    
    -- Keep only last 24 health history entries (configurable)
    local maxHistoryEntries = 24
    if #processRecord.healthHistory >= maxHistoryEntries then
        table.remove(processRecord.healthHistory, 1)
    end
    
    table.insert(processRecord.healthHistory, {
        timestamp = msg.Timestamp,
        healthStatus = processRecord.healthStatus,
        responseTime = processRecord.healthMetrics.responseTime,
        memoryUsage = processRecord.healthMetrics.memoryUsage,
        cpuUsage = processRecord.healthMetrics.cpuUsage,
        errorRate = processRecord.healthMetrics.errorRate
    })
end

function HealthMonitor._updateAverageResponseTime(newResponseTime)
    local currentAvg = HealthMonitor.healthStatistics.averageResponseTime
    local totalChecks = HealthMonitor.healthStatistics.totalHealthChecks
    
    if totalChecks <= 1 then
        HealthMonitor.healthStatistics.averageResponseTime = newResponseTime
    else
        HealthMonitor.healthStatistics.averageResponseTime = 
            ((currentAvg * (totalChecks - 1)) + newResponseTime) / totalChecks
    end
end

return HealthMonitor