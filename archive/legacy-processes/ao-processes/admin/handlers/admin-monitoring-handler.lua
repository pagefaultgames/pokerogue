-- Admin Monitoring Handler
-- Handles health and performance monitoring operations for the administrative process

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local HealthMonitor = require("admin.components.health-monitor")
local PerformanceAggregator = require("admin.components.performance-aggregator")
local AlertManager = require("admin.components.alert-manager")

-- Health monitoring query handler
Handlers.add(
    "health-monitoring-query",
    Handlers.utils.hasMatchingTag("Action", "HEALTH_MONITORING"),
    function(msg)
        -- Authenticate monitoring request
        local authResult = ProcessAuthenticator.validateMessage(msg, "ELEVATED")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "health-monitoring"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for health monitoring",
                    requiredLevel = "ELEVATED"
                })
            })
            return
        end
        
        local queryData = json.decode(msg.Data)
        local correlationId = MessageCorrelator.generateId()
        
        local queryType = queryData and queryData.queryType or "FULL_HEALTH"
        local targetProcessId = queryData and queryData.processId
        local includePerformance = queryData and queryData.includePerformance or true
        local includeLogs = queryData and queryData.includeLogs or false
        
        local healthResults = {}
        
        if targetProcessId then
            -- Query specific process health
            local processHealth = HealthMonitor.getProcessHealth(targetProcessId)
            if processHealth then
                healthResults[targetProcessId] = processHealth
                
                if includePerformance then
                    healthResults[targetProcessId].performanceMetrics = 
                        PerformanceAggregator.getProcessMetrics(targetProcessId)
                end
            else
                ao.send({
                    Target = msg.From,
                    Tags = {
                        Action = "HEALTH_MONITORING_RESPONSE",
                        CorrelationId = msg.Tags.CorrelationId or "health-monitoring"
                    },
                    Data = json.encode({
                        success = false,
                        error = "Process not found or not monitored: " .. targetProcessId
                    })
                })
                return
            end
        else
            -- Query all monitored processes
            if queryType == "FULL_HEALTH" or queryType == "STATUS_ONLY" then
                healthResults = HealthMonitor.getAllProcessHealth()
                
                if includePerformance and queryType == "FULL_HEALTH" then
                    for processId in pairs(healthResults) do
                        healthResults[processId].performanceMetrics = 
                            PerformanceAggregator.getProcessMetrics(processId)
                    end
                end
            elseif queryType == "METRICS_ONLY" then
                healthResults = PerformanceAggregator.getAllProcessMetrics()
            end
        end
        
        local responseData = {
            success = true,
            correlationId = correlationId,
            timestamp = msg.Timestamp,
            queryType = queryType,
            healthResults = healthResults,
            systemSummary = {
                totalMonitoredProcesses = HealthMonitor.getMonitoredProcessCount(),
                overallHealthStatus = HealthMonitor.getOverallHealthStatus(),
                activeAlerts = AlertManager.getActiveAlertCount(),
                performanceStatus = PerformanceAggregator.getSystemPerformanceStatus()
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "HEALTH_MONITORING_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "health-monitoring"
            },
            Data = json.encode(responseData)
        })
        
        print("[AdminMonitoringHandler] Health monitoring query processed for " .. msg.From)
    end
)

-- Performance monitoring query handler
Handlers.add(
    "performance-query",
    Handlers.utils.hasMatchingTag("Action", "PERFORMANCE_QUERY"),
    function(msg)
        -- Authenticate performance query
        local authResult = ProcessAuthenticator.validateMessage(msg, "ELEVATED")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "performance-query"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for performance monitoring",
                    requiredLevel = "ELEVATED"
                })
            })
            return
        end
        
        local queryData = json.decode(msg.Data)
        local metricType = queryData and queryData.metricType or "ALL"
        local timeRange = queryData and queryData.timeRange
        local targetProcessId = queryData and queryData.processId
        
        local performanceData = {}
        
        if targetProcessId then
            -- Get metrics for specific process
            performanceData[targetProcessId] = PerformanceAggregator.getProcessMetrics(
                targetProcessId, metricType, timeRange
            )
        else
            -- Get system-wide metrics
            performanceData = PerformanceAggregator.getSystemMetrics(metricType, timeRange)
        end
        
        local responseData = {
            success = true,
            timestamp = msg.Timestamp,
            metricType = metricType,
            timeRange = timeRange,
            performanceData = performanceData,
            systemAnalysis = {
                bottlenecks = PerformanceAggregator.identifyBottlenecks(),
                trends = PerformanceAggregator.getTrendAnalysis(timeRange),
                recommendations = PerformanceAggregator.getOptimizationRecommendations()
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "PERFORMANCE_QUERY_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "performance-query"
            },
            Data = json.encode(responseData)
        })
        
        print("[AdminMonitoringHandler] Performance query processed for " .. msg.From)
    end
)

-- Alert management handler
Handlers.add(
    "alert-management",
    Handlers.utils.hasMatchingTag("Action", "ALERT_MANAGEMENT"),
    function(msg)
        -- Authenticate alert management request
        local authResult = ProcessAuthenticator.validateMessage(msg, "ADMIN")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "alert-management"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for alert management",
                    requiredLevel = "ADMIN"
                })
            })
            return
        end
        
        local alertData = json.decode(msg.Data)
        if not alertData or not alertData.operation then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "alert-management"
                },
                Data = json.encode({
                    success = false,
                    error = "Operation parameter is required"
                })
            })
            return
        end
        
        local operation = alertData.operation
        local result = {}
        
        if operation == "GET_ALERTS" then
            local alertCount = alertData.count or 50
            local severity = alertData.severity
            result = {
                alerts = AlertManager.getRecentAlerts(alertCount, severity),
                totalActiveAlerts = AlertManager.getActiveAlertCount()
            }
        elseif operation == "UPDATE_THRESHOLDS" then
            local thresholds = alertData.thresholds
            if thresholds then
                result = AlertManager.updateAlertThresholds(thresholds)
            else
                result = { success = false, error = "Thresholds parameter is required" }
            end
        elseif operation == "ACKNOWLEDGE_ALERT" then
            local alertId = alertData.alertId
            if alertId then
                result = AlertManager.acknowledgeAlert(alertId, authResult.userId)
            else
                result = { success = false, error = "Alert ID is required" }
            end
        elseif operation == "CLEAR_ALERT" then
            local alertId = alertData.alertId
            if alertId then
                result = AlertManager.clearAlert(alertId, authResult.userId)
            else
                result = { success = false, error = "Alert ID is required" }
            end
        elseif operation == "CONFIGURE_NOTIFICATIONS" then
            local notificationConfig = alertData.notificationConfig
            if notificationConfig then
                result = AlertManager.configureNotifications(notificationConfig)
            else
                result = { success = false, error = "Notification configuration is required" }
            end
        else
            result = { success = false, error = "Unsupported operation: " .. operation }
        end
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "ALERT_MANAGEMENT_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "alert-management"
            },
            Data = json.encode({
                success = result.success ~= false,
                operation = operation,
                result = result,
                timestamp = 0
            })
        })
        
        print("[AdminMonitoringHandler] Alert management operation '" .. operation .. "' processed")
    end
)

-- Health threshold configuration handler
Handlers.add(
    "health-threshold-config",
    Handlers.utils.hasMatchingTag("Action", "HEALTH_THRESHOLD_CONFIG"),
    function(msg)
        -- Authenticate threshold configuration
        local authResult = ProcessAuthenticator.validateMessage(msg, "ADMIN")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "health-threshold-config"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for threshold configuration",
                    requiredLevel = "ADMIN"
                })
            })
            return
        end
        
        local configData = json.decode(msg.Data)
        if not configData then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "health-threshold-config"
                },
                Data = json.encode({
                    success = false,
                    error = "Configuration data is required"
                })
            })
            return
        end
        
        local result = {}
        
        if configData.healthThresholds then
            result.healthUpdate = HealthMonitor.updateThresholds(configData.healthThresholds)
        end
        
        if configData.performanceThresholds then
            result.performanceUpdate = PerformanceAggregator.updateThresholds(configData.performanceThresholds)
        end
        
        if configData.alertThresholds then
            result.alertUpdate = AlertManager.updateAlertThresholds(configData.alertThresholds)
        end
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "HEALTH_THRESHOLD_CONFIG_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "health-threshold-config"
            },
            Data = json.encode({
                success = true,
                configurationResults = result,
                timestamp = 0
            })
        })
        
        print("[AdminMonitoringHandler] Health threshold configuration updated by " .. 
              (authResult.userId or "unknown"))
    end
)

-- Monitoring statistics handler
Handlers.add(
    "monitoring-statistics",
    Handlers.utils.hasMatchingTag("Action", "MONITORING_STATISTICS"),
    function(msg)
        -- Authenticate statistics request
        local authResult = ProcessAuthenticator.validateMessage(msg, "ELEVATED")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "monitoring-statistics"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for monitoring statistics",
                    requiredLevel = "ELEVATED"
                })
            })
            return
        end
        
        local statistics = {
            healthMonitoring = HealthMonitor.getStatistics(),
            performanceAggregation = PerformanceAggregator.getStatistics(),
            alertManagement = AlertManager.getStatistics(),
            systemOverview = {
                monitoredProcessCount = HealthMonitor.getMonitoredProcessCount(),
                overallHealthStatus = HealthMonitor.getOverallHealthStatus(),
                activeAlertCount = AlertManager.getActiveAlertCount(),
                performanceStatus = PerformanceAggregator.getSystemPerformanceStatus(),
                uptimeSeconds = 0 - (0 - 3600) -- Placeholder uptime calculation
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "MONITORING_STATISTICS_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "monitoring-statistics"
            },
            Data = json.encode({
                success = true,
                statistics = statistics,
                timestamp = 0
            })
        })
        
        print("[AdminMonitoringHandler] Monitoring statistics provided to " .. msg.From)
    end
)

print("[AdminMonitoringHandler] Admin monitoring handlers registered")