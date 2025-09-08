-- Deployment Monitor Component
-- Integrates with admin AlertManager and PerformanceAggregator for deployment monitoring

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local MessageRouter = require("game-logic.process-coordination.message-router")

local DeploymentMonitor = {
    -- Configuration
    config = {
        monitoringInterval = 60, -- seconds
        alertThresholds = {
            deploymentFailureRate = 0.1, -- 10%
            averageDeploymentTime = 600, -- 10 minutes
            concurrentDeploymentLimit = 5,
            healthCheckFailureRate = 0.05, -- 5%
            rollbackRate = 0.15 -- 15%
        },
        adminProcessIntegration = true,
        alertManagerIntegration = true,
        performanceAggregatorIntegration = true
    },
    
    -- Monitoring state
    monitoringState = {
        adminProcessId = nil,
        alertManagerConnected = false,
        performanceAggregatorConnected = false,
        lastMonitoringCycle = 0,
        consecutiveMonitoringFailures = 0
    },
    
    -- Deployment metrics
    deploymentMetrics = {
        totalDeployments = 0,
        successfulDeployments = 0,
        failedDeployments = 0,
        rolledBackDeployments = 0,
        averageDeploymentTime = 0,
        deploymentsByType = {},
        hourlyDeploymentCounts = {},
        recentDeploymentTimes = {}
    },
    
    -- Performance metrics
    performanceMetrics = {
        coordinatorCpuUsage = 0,
        coordinatorMemoryUsage = 0,
        messageProcessingTime = 0,
        activeConnections = 0,
        throughput = 0,
        errorRate = 0.0
    },
    
    -- Alert types for deployment monitoring
    ALERT_TYPES = {
        DEPLOYMENT_FAILURE_RATE_HIGH = "DEPLOYMENT_FAILURE_RATE_HIGH",
        DEPLOYMENT_TIME_EXCEEDED = "DEPLOYMENT_TIME_EXCEEDED",
        CONCURRENT_DEPLOYMENT_LIMIT_REACHED = "CONCURRENT_DEPLOYMENT_LIMIT_REACHED",
        HEALTH_CHECK_FAILURE_RATE_HIGH = "HEALTH_CHECK_FAILURE_RATE_HIGH",
        ROLLBACK_RATE_HIGH = "ROLLBACK_RATE_HIGH",
        COORDINATOR_PERFORMANCE_DEGRADED = "COORDINATOR_PERFORMANCE_DEGRADED",
        ADMIN_INTEGRATION_FAILED = "ADMIN_INTEGRATION_FAILED"
    }
}

-- Initialize deployment monitor
function DeploymentMonitor.initialize(config, adminProcessId)
    if config then
        for key, value in pairs(config) do
            if DeploymentMonitor.config[key] ~= nil then
                DeploymentMonitor.config[key] = value
            end
        end
    end
    
    DeploymentMonitor.monitoringState.adminProcessId = adminProcessId
    DeploymentMonitor.deploymentMetrics = {
        totalDeployments = 0,
        successfulDeployments = 0,
        failedDeployments = 0,
        rolledBackDeployments = 0,
        averageDeploymentTime = 0,
        deploymentsByType = {},
        hourlyDeploymentCounts = {},
        recentDeploymentTimes = {}
    }
    DeploymentMonitor.performanceMetrics = {
        coordinatorCpuUsage = 0,
        coordinatorMemoryUsage = 0,
        messageProcessingTime = 0,
        activeConnections = 0,
        throughput = 0,
        errorRate = 0.0
    }
    
    -- Initialize admin integrations
    if DeploymentMonitor.config.adminProcessIntegration and adminProcessId then
        DeploymentMonitor._initializeAdminIntegration()
    end
    
    print("[DeploymentMonitor] Deployment monitor initialized with admin integration: " .. (adminProcessId or "none"))
end

-- Record deployment metrics
function DeploymentMonitor.recordDeploymentMetrics(deploymentResult)
    local metrics = DeploymentMonitor.deploymentMetrics
    
    -- Update basic counters
    metrics.totalDeployments = metrics.totalDeployments + 1
    
    if deploymentResult.success then
        metrics.successfulDeployments = metrics.successfulDeployments + 1
    else
        metrics.failedDeployments = metrics.failedDeployments + 1
    end
    
    if deploymentResult.wasRolledBack then
        metrics.rolledBackDeployments = metrics.rolledBackDeployments + 1
    end
    
    -- Update deployment time metrics
    if deploymentResult.duration then
        table.insert(metrics.recentDeploymentTimes, deploymentResult.duration)
        
        -- Keep only last 50 deployment times for rolling average
        if #metrics.recentDeploymentTimes > 50 then
            table.remove(metrics.recentDeploymentTimes, 1)
        end
        
        -- Calculate new average deployment time
        local totalTime = 0
        for _, time in ipairs(metrics.recentDeploymentTimes) do
            totalTime = totalTime + time
        end
        metrics.averageDeploymentTime = totalTime / #metrics.recentDeploymentTimes
    end
    
    -- Update deployment type counters
    local deploymentType = deploymentResult.deploymentType or "UNKNOWN"
    metrics.deploymentsByType[deploymentType] = (metrics.deploymentsByType[deploymentType] or 0) + 1
    
    -- Update hourly counters
    local currentHour = os.date("%Y-%m-%d-%H")
    metrics.hourlyDeploymentCounts[currentHour] = (metrics.hourlyDeploymentCounts[currentHour] or 0) + 1
    
    -- Check for alert conditions
    DeploymentMonitor._checkAlertConditions()
    
    -- Send metrics to admin performance aggregator if connected
    if DeploymentMonitor.config.performanceAggregatorIntegration then
        DeploymentMonitor._sendMetricsToPerformanceAggregator(deploymentResult)
    end
end

-- Update performance metrics
function DeploymentMonitor.updatePerformanceMetrics(performanceData)
    local metrics = DeploymentMonitor.performanceMetrics
    
    if performanceData.cpuUsage then
        metrics.coordinatorCpuUsage = performanceData.cpuUsage
    end
    
    if performanceData.memoryUsage then
        metrics.coordinatorMemoryUsage = performanceData.memoryUsage
    end
    
    if performanceData.messageProcessingTime then
        metrics.messageProcessingTime = performanceData.messageProcessingTime
    end
    
    if performanceData.activeConnections then
        metrics.activeConnections = performanceData.activeConnections
    end
    
    if performanceData.throughput then
        metrics.throughput = performanceData.throughput
    end
    
    if performanceData.errorRate then
        metrics.errorRate = performanceData.errorRate
    end
    
    -- Check for performance alert conditions
    DeploymentMonitor._checkPerformanceAlerts()
end

-- Perform monitoring cycle
function DeploymentMonitor.performMonitoringCycle()
    local currentTime = 0
    local lastCycle = DeploymentMonitor.monitoringState.lastMonitoringCycle
    
    -- Skip if not enough time has passed
    if currentTime - lastCycle < DeploymentMonitor.config.monitoringInterval then
        return { success = true, skipped = true, reason = "Too soon since last cycle" }
    end
    
    DeploymentMonitor.monitoringState.lastMonitoringCycle = currentTime
    
    local monitoringResult = {
        success = true,
        timestamp = currentTime,
        metricsCollected = false,
        alertsGenerated = 0,
        integrationStatus = {}
    }
    
    -- Collect current performance metrics
    local metricsResult = DeploymentMonitor._collectCurrentMetrics()
    if metricsResult.success then
        DeploymentMonitor.updatePerformanceMetrics(metricsResult.metrics)
        monitoringResult.metricsCollected = true
    else
        print("[DeploymentMonitor] Failed to collect metrics: " .. (metricsResult.error or "Unknown error"))
    end
    
    -- Check integration status
    if DeploymentMonitor.config.adminProcessIntegration then
        local integrationStatus = DeploymentMonitor._checkAdminIntegrationStatus()
        monitoringResult.integrationStatus.adminIntegration = integrationStatus
        
        if not integrationStatus.connected then
            DeploymentMonitor._generateAlert({
                type = DeploymentMonitor.ALERT_TYPES.ADMIN_INTEGRATION_FAILED,
                severity = "WARNING",
                message = "Admin process integration failed",
                details = { lastError = integrationStatus.error }
            })
            monitoringResult.alertsGenerated = monitoringResult.alertsGenerated + 1
        end
    end
    
    -- Send monitoring report to admin if connected
    if DeploymentMonitor.monitoringState.alertManagerConnected then
        DeploymentMonitor._sendMonitoringReport(monitoringResult)
    end
    
    -- Reset consecutive failure counter on successful cycle
    if monitoringResult.success then
        DeploymentMonitor.monitoringState.consecutiveMonitoringFailures = 0
    else
        DeploymentMonitor.monitoringState.consecutiveMonitoringFailures = 
            DeploymentMonitor.monitoringState.consecutiveMonitoringFailures + 1
    end
    
    return monitoringResult
end

-- Get deployment statistics
function DeploymentMonitor.getDeploymentStatistics()
    local metrics = DeploymentMonitor.deploymentMetrics
    local successRate = metrics.totalDeployments > 0 and 
        (metrics.successfulDeployments / metrics.totalDeployments) * 100 or 0
    local rollbackRate = metrics.totalDeployments > 0 and 
        (metrics.rolledBackDeployments / metrics.totalDeployments) * 100 or 0
    
    return {
        totalDeployments = metrics.totalDeployments,
        successfulDeployments = metrics.successfulDeployments,
        failedDeployments = metrics.failedDeployments,
        rolledBackDeployments = metrics.rolledBackDeployments,
        successRate = successRate,
        rollbackRate = rollbackRate,
        averageDeploymentTime = metrics.averageDeploymentTime,
        deploymentsByType = metrics.deploymentsByType,
        hourlyDeploymentCounts = metrics.hourlyDeploymentCounts,
        performanceMetrics = DeploymentMonitor.performanceMetrics,
        integrationStatus = DeploymentMonitor.monitoringState
    }
end

-- Private helper functions

function DeploymentMonitor._initializeAdminIntegration()
    local integrationMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "DEPLOYMENT_MONITOR_INTEGRATION"
        },
        deploymentIntegration = {
            coordinatorProcessId = "deployment-coordinator-process",
            integrationType = "FULL_MONITORING",
            capabilities = {
                "DEPLOYMENT_METRICS",
                "PERFORMANCE_MONITORING",
                "ALERT_GENERATION",
                "STATUS_REPORTING"
            },
            monitoringInterval = DeploymentMonitor.config.monitoringInterval
        }
    }
    
    local routingResult = MessageRouter.routeMessage(
        "DEPLOYMENT_MONITOR_INTEGRATION",
        integrationMessage,
        "DIRECT_ROUTE"
    )
    
    if routingResult.success then
        DeploymentMonitor.monitoringState.alertManagerConnected = true
        DeploymentMonitor.monitoringState.performanceAggregatorConnected = true
    end
    
    print("[DeploymentMonitor] Admin integration initialized: " .. tostring(routingResult.success))
end

function DeploymentMonitor._checkAlertConditions()
    local metrics = DeploymentMonitor.deploymentMetrics
    local thresholds = DeploymentMonitor.config.alertThresholds
    
    -- Check deployment failure rate
    if metrics.totalDeployments > 10 then -- Only check after sufficient deployments
        local failureRate = metrics.failedDeployments / metrics.totalDeployments
        if failureRate > thresholds.deploymentFailureRate then
            DeploymentMonitor._generateAlert({
                type = DeploymentMonitor.ALERT_TYPES.DEPLOYMENT_FAILURE_RATE_HIGH,
                severity = "ERROR",
                message = "Deployment failure rate exceeded threshold",
                details = {
                    currentRate = failureRate,
                    threshold = thresholds.deploymentFailureRate,
                    totalDeployments = metrics.totalDeployments,
                    failedDeployments = metrics.failedDeployments
                }
            })
        end
    end
    
    -- Check average deployment time
    if metrics.averageDeploymentTime > thresholds.averageDeploymentTime then
        DeploymentMonitor._generateAlert({
            type = DeploymentMonitor.ALERT_TYPES.DEPLOYMENT_TIME_EXCEEDED,
            severity = "WARNING",
            message = "Average deployment time exceeded threshold",
            details = {
                currentTime = metrics.averageDeploymentTime,
                threshold = thresholds.averageDeploymentTime
            }
        })
    end
    
    -- Check rollback rate
    if metrics.totalDeployments > 10 then
        local rollbackRate = metrics.rolledBackDeployments / metrics.totalDeployments
        if rollbackRate > thresholds.rollbackRate then
            DeploymentMonitor._generateAlert({
                type = DeploymentMonitor.ALERT_TYPES.ROLLBACK_RATE_HIGH,
                severity = "WARNING",
                message = "Deployment rollback rate exceeded threshold",
                details = {
                    currentRate = rollbackRate,
                    threshold = thresholds.rollbackRate,
                    rolledBackDeployments = metrics.rolledBackDeployments
                }
            })
        end
    end
end

function DeploymentMonitor._checkPerformanceAlerts()
    local metrics = DeploymentMonitor.performanceMetrics
    
    -- Check for performance degradation
    if metrics.coordinatorCpuUsage > 80 or metrics.coordinatorMemoryUsage > 85 or metrics.errorRate > 0.1 then
        DeploymentMonitor._generateAlert({
            type = DeploymentMonitor.ALERT_TYPES.COORDINATOR_PERFORMANCE_DEGRADED,
            severity = "WARNING",
            message = "Deployment coordinator performance degraded",
            details = {
                cpuUsage = metrics.coordinatorCpuUsage,
                memoryUsage = metrics.coordinatorMemoryUsage,
                errorRate = metrics.errorRate,
                messageProcessingTime = metrics.messageProcessingTime
            }
        })
    end
end

function DeploymentMonitor._generateAlert(alertData)
    if not DeploymentMonitor.config.alertManagerIntegration or 
       not DeploymentMonitor.monitoringState.alertManagerConnected then
        -- Log alert locally if no AlertManager integration
        print("[DeploymentMonitor] ALERT: " .. alertData.message .. " (" .. alertData.severity .. ")")
        return
    end
    
    local alertMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "DEPLOYMENT_ALERT"
        },
        deploymentAlert = {
            alertType = alertData.type,
            severity = alertData.severity,
            message = alertData.message,
            details = alertData.details,
            timestamp = msg.Timestamp,
            source = "DEPLOYMENT_COORDINATOR",
            processId = "deployment-coordinator-process"
        }
    }
    
    local routingResult = MessageRouter.routeMessage(
        "DEPLOYMENT_ALERT",
        alertMessage,
        "DIRECT_ROUTE"
    )
    
    if routingResult.success then
        print("[DeploymentMonitor] Alert sent to AlertManager: " .. alertData.type)
    else
        print("[DeploymentMonitor] Failed to send alert: " .. (routingResult.error or "Unknown error"))
    end
end

function DeploymentMonitor._sendMetricsToPerformanceAggregator(deploymentResult)
    local metricsMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "DEPLOYMENT_PERFORMANCE_METRICS"
        },
        performanceMetrics = {
            deploymentId = deploymentResult.deploymentId,
            deploymentSuccess = deploymentResult.success,
            deploymentDuration = deploymentResult.duration,
            processCount = deploymentResult.processCount,
            timestamp = msg.Timestamp,
            source = "DEPLOYMENT_COORDINATOR",
            additionalMetrics = DeploymentMonitor.performanceMetrics
        }
    }
    
    local routingResult = MessageRouter.routeMessage(
        "DEPLOYMENT_PERFORMANCE_METRICS",
        metricsMessage,
        "DIRECT_ROUTE"
    )
    
    if not routingResult.success then
        print("[DeploymentMonitor] Failed to send metrics to PerformanceAggregator: " .. 
              (routingResult.error or "Unknown error"))
    end
end

function DeploymentMonitor._collectCurrentMetrics()
    -- Simulate current performance metrics collection
    return {
        success = true,
        metrics = {
            cpuUsage = math.random(10, 60),
            memoryUsage = math.random(20, 70),
            messageProcessingTime = math.random(10, 100),
            activeConnections = math.random(5, 50),
            throughput = math.random(80, 120),
            errorRate = math.random(0, 5) / 1000
        }
    }
end

function DeploymentMonitor._checkAdminIntegrationStatus()
    if not DeploymentMonitor.monitoringState.adminProcessId then
        return {
            connected = false,
            error = "Admin process ID not configured"
        }
    end
    
    -- Simulate integration status check
    local statusMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "INTEGRATION_STATUS_CHECK"
        },
        statusCheck = {
            integrationType = "DEPLOYMENT_MONITORING",
            requestingProcess = "deployment-coordinator-process"
        }
    }
    
    local routingResult = MessageRouter.routeMessage(
        "INTEGRATION_STATUS_CHECK",
        statusMessage,
        "DIRECT_ROUTE"
    )
    
    return {
        connected = routingResult.success,
        lastCheck = 0,
        error = routingResult.error
    }
end

function DeploymentMonitor._sendMonitoringReport(monitoringResult)
    local reportMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "DEPLOYMENT_MONITORING_REPORT"
        },
        monitoringReport = {
            timestamp = monitoringResult.timestamp,
            deploymentStatistics = DeploymentMonitor.deploymentMetrics,
            performanceMetrics = DeploymentMonitor.performanceMetrics,
            integrationStatus = monitoringResult.integrationStatus,
            alertsGenerated = monitoringResult.alertsGenerated,
            source = "DEPLOYMENT_COORDINATOR"
        }
    }
    
    local routingResult = MessageRouter.routeMessage(
        "DEPLOYMENT_MONITORING_REPORT",
        reportMessage,
        "DIRECT_ROUTE"
    )
    
    if not routingResult.success then
        print("[DeploymentMonitor] Failed to send monitoring report: " .. 
              (routingResult.error or "Unknown error"))
    end
end

return DeploymentMonitor