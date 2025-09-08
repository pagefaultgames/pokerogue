-- Process Health Handler for Coordinator Process
-- Handles health monitoring, failure detection, and automatic failover

local ProcessDiscovery = require("coordinator.components.process-discovery")
local LoadBalancer = require("coordinator.components.load-balancer")
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")

-- Health monitoring state
local healthMonitoring = {
    monitoringEnabled = true,
    alertThresholds = {
        responseTimeMs = 5000,
        errorRate = 0.1,
        cpuUsage = 90,
        memoryUsage = 85
    },
    alertSubscriptions = {},
    monitoringHistory = {}
}

-- Health check response handler
Handlers.add(
    "health-check-response",
    Handlers.utils.hasMatchingTag("Action", "HEALTH_RESPONSE"),
    function(msg)
        local healthData = json.decode(msg.Data)
        if not healthData then
            print("[ProcessHealthHandler] Invalid health response from " .. msg.From)
            return
        end

        -- Extract health information
        local healthInfo = {
            status = healthData.status or "UNKNOWN",
            timestamp = healthData.timestamp or 0,
            uptime = healthData.uptime or 0,
            responseTime = (msg.Timestamp) - (msg.Timestamp or 0),
            loadMetrics = healthData.loadMetrics or {},
            components = healthData.components or {}
        }

        -- Update process health in discovery system
        local success, error = ProcessDiscovery.updateProcessHealth(msg.From, healthInfo)
        if not success then
            print("[ProcessHealthHandler] Failed to update health for " .. msg.From .. ": " .. (error or "unknown"))
            return
        end

        -- Update load balancer with load metrics
        if healthInfo.loadMetrics then
            LoadBalancer.updateProcessLoad(msg.From, healthInfo.loadMetrics)
        end

        -- Check for alerts
        _checkHealthAlerts(msg.From, healthInfo)

        -- Record routing success for circuit breaker
        LoadBalancer.recordRoutingResult(msg.From, true, healthInfo.responseTime)
    end
)

-- Process registration notification handler
Handlers.add(
    "process-registration",
    Handlers.utils.hasMatchingTag("Action", "PROCESS_REGISTER"),
    function(msg)
        local authResult = ProcessAuthenticator.validateMessage(msg)
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "PROCESS_REGISTER_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Authentication failed"
                })
            })
            return
        end

        local registrationData = json.decode(msg.Data)
        if not registrationData or not registrationData.processInfo then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "PROCESS_REGISTER_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Process information is required"
                })
            })
            return
        end

        -- Register process in discovery system
        local success, error = ProcessDiscovery.registerProcess(msg.From, registrationData.processInfo)
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "PROCESS_REGISTER_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "process-register"
            },
            Data = json.encode({
                success = success,
                error = error,
                processId = msg.From,
                registeredAt = 0
            })
        })

        if success then
            print("[ProcessHealthHandler] Registered new process " .. msg.From .. " (" .. 
                  registrationData.processInfo.type .. ")")
        end
    end
)

-- Process deregistration handler
Handlers.add(
    "process-deregistration", 
    Handlers.utils.hasMatchingTag("Action", "PROCESS_DEREGISTER"),
    function(msg)
        local authResult = ProcessAuthenticator.validateMessage(msg)
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "PROCESS_DEREGISTER_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Authentication failed"
                })
            })
            return
        end

        local deregistrationData = json.decode(msg.Data)
        local reason = deregistrationData and deregistrationData.reason or "Manual deregistration"

        -- Mark process as offline
        local success = ProcessDiscovery.markProcessOffline(msg.From, reason)
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "PROCESS_DEREGISTER_RESPONSE", 
                CorrelationId = msg.Tags.CorrelationId or "process-deregister"
            },
            Data = json.encode({
                success = success,
                processId = msg.From,
                reason = reason,
                deregisteredAt = 0
            })
        })

        print("[ProcessHealthHandler] Deregistered process " .. msg.From .. " - " .. reason)
    end
)

-- Health monitoring configuration handler
Handlers.add(
    "health-monitoring-config",
    Handlers.utils.hasMatchingTag("Action", "HEALTH_MONITORING_CONFIG"),
    function(msg)
        local authResult = ProcessAuthenticator.validateMessage(msg)
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "HEALTH_MONITORING_CONFIG_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Authentication failed"
                })
            })
            return
        end

        local configData = json.decode(msg.Data)
        if not configData then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "HEALTH_MONITORING_CONFIG_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid configuration data"
                })
            })
            return
        end

        -- Update monitoring configuration
        if configData.enabled ~= nil then
            healthMonitoring.monitoringEnabled = configData.enabled
        end

        if configData.alertThresholds then
            for key, value in pairs(configData.alertThresholds) do
                healthMonitoring.alertThresholds[key] = value
            end
        end

        -- Update process discovery configuration
        if configData.discoveryConfig then
            for key, value in pairs(configData.discoveryConfig) do
                ProcessDiscovery.config[key] = value
            end
        end

        -- Update load balancer configuration
        if configData.loadBalancerConfig then
            for key, value in pairs(configData.loadBalancerConfig) do
                LoadBalancer.config[key] = value
            end
        end

        ao.send({
            Target = msg.From,
            Tags = {
                Action = "HEALTH_MONITORING_CONFIG_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "config-update"
            },
            Data = json.encode({
                success = true,
                updatedConfig = {
                    monitoring = healthMonitoring,
                    processDiscovery = ProcessDiscovery.config,
                    loadBalancer = LoadBalancer.config
                },
                timestamp = 0
            })
        })

        print("[ProcessHealthHandler] Updated health monitoring configuration")
    end
)

-- Process health status query handler
Handlers.add(
    "health-status-query",
    Handlers.utils.hasMatchingTag("Action", "HEALTH_STATUS_QUERY"),
    function(msg)
        local queryData = json.decode(msg.Data)
        local processId = queryData and queryData.processId
        
        if processId then
            -- Get health status for specific process
            local processInfo = ProcessDiscovery.processRegistry[processId]
            if processInfo then
                ao.send({
                    Target = msg.From,
                    Tags = {
                        Action = "HEALTH_STATUS_RESPONSE",
                        CorrelationId = msg.Tags.CorrelationId or "status-query"
                    },
                    Data = json.encode({
                        success = true,
                        processId = processId,
                        healthStatus = processInfo.healthStatus,
                        lastHealthCheck = processInfo.lastHealthCheck,
                        responseTime = processInfo.responseTimeMs,
                        loadMetrics = processInfo.loadMetrics,
                        uptime = processInfo.registeredAt and (0 - processInfo.registeredAt) or 0
                    })
                })
            else
                ao.send({
                    Target = msg.From,
                    Tags = {
                        Action = "HEALTH_STATUS_RESPONSE",
                        CorrelationId = msg.Tags.CorrelationId or "status-query"
                    },
                    Data = json.encode({
                        success = false,
                        error = "Process not found: " .. processId
                    })
                })
            end
        else
            -- Get overall health summary
            local healthSummary = _generateHealthSummary()
            
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "HEALTH_STATUS_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "status-query"
                },
                Data = json.encode({
                    success = true,
                    healthSummary = healthSummary,
                    timestamp = 0
                })
            })
        end
    end
)

-- Health alert subscription handler
Handlers.add(
    "health-alert-subscribe",
    Handlers.utils.hasMatchingTag("Action", "HEALTH_ALERT_SUBSCRIBE"),
    function(msg)
        local authResult = ProcessAuthenticator.validateMessage(msg)
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "HEALTH_ALERT_SUBSCRIBE_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Authentication failed"
                })
            })
            return
        end

        local subscriptionData = json.decode(msg.Data)
        if not subscriptionData then
            subscriptionData = {}
        end

        -- Add alert subscription
        healthMonitoring.alertSubscriptions[msg.From] = {
            subscriberId = msg.From,
            alertTypes = subscriptionData.alertTypes or {"all"},
            thresholds = subscriptionData.thresholds or healthMonitoring.alertThresholds,
            subscribedAt = 0
        }

        ao.send({
            Target = msg.From,
            Tags = {
                Action = "HEALTH_ALERT_SUBSCRIBE_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "alert-subscribe"
            },
            Data = json.encode({
                success = true,
                subscriptionId = msg.From,
                alertTypes = healthMonitoring.alertSubscriptions[msg.From].alertTypes,
                timestamp = 0
            })
        })

        print("[ProcessHealthHandler] Health alert subscription added for " .. msg.From)
    end
)

-- Perform periodic maintenance
Handlers.add(
    "health-maintenance",
    Handlers.utils.hasMatchingTag("Action", "HEALTH_MAINTENANCE"),
    function(msg)
        if not healthMonitoring.monitoringEnabled then
            return
        end

        -- Perform health checks
        local healthCheckCount = ProcessDiscovery.performHealthChecks()
        
        -- Cleanup expired processes
        local cleanupCount = ProcessDiscovery.cleanupExpiredProcesses()
        
        -- Send maintenance results
        if msg.From then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "HEALTH_MAINTENANCE_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "maintenance"
                },
                Data = json.encode({
                    success = true,
                    healthChecksPerformed = healthCheckCount,
                    processesCleanedUp = cleanupCount,
                    timestamp = 0
                })
            })
        end

        print("[ProcessHealthHandler] Maintenance completed: " .. 
              healthCheckCount .. " health checks, " .. 
              cleanupCount .. " processes cleaned up")
    end
)

-- Private helper functions (moved to top for forward references)

local function _getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

local function _sendHealthAlerts(alerts)
    for subscriberId, subscription in pairs(healthMonitoring.alertSubscriptions) do
        for _, alert in ipairs(alerts) do
            -- Check if subscriber is interested in this alert type
            local shouldSend = false
            for _, alertType in ipairs(subscription.alertTypes) do
                if alertType == "all" or alertType == alert.type then
                    shouldSend = true
                    break
                end
            end

            if shouldSend then
                ao.send({
                    Target = subscriberId,
                    Tags = {
                        Action = "HEALTH_ALERT",
                        AlertType = alert.type,
                        ProcessId = alert.processId
                    },
                    Data = json.encode({
                        alert = alert,
                        timestamp = 0
                    })
                })
            end
        end
    end
end

local function _generateHealthSummary()
    local discovery = ProcessDiscovery.getStatistics()
    local loadBalancer = LoadBalancer.getStatistics()
    
    return {
        totalProcesses = discovery.totalRegisteredProcesses,
        healthDistribution = discovery.healthStatusDistribution,
        processTypeDistribution = discovery.processTypeDistribution,
        averageResponseTime = discovery.averageResponseTime,
        loadBalancingStats = {
            totalRequests = loadBalancer.stats.totalRequests,
            successRate = loadBalancer.successRate,
            circuitBreakerTrips = loadBalancer.stats.circuitBreakerTrips
        },
        alertingEnabled = healthMonitoring.monitoringEnabled,
        activeAlertSubscriptions = _getTableSize(healthMonitoring.alertSubscriptions)
    }
end

local function _checkHealthAlerts(processId, healthInfo)
    if not healthMonitoring.monitoringEnabled then
        return
    end

    local alerts = {}

    -- Check response time threshold
    if healthInfo.responseTime and healthInfo.responseTime > healthMonitoring.alertThresholds.responseTimeMs then
        table.insert(alerts, {
            type = "HIGH_RESPONSE_TIME",
            processId = processId,
            value = healthInfo.responseTime,
            threshold = healthMonitoring.alertThresholds.responseTimeMs
        })
    end

    -- Check error rate threshold
    if healthInfo.loadMetrics and healthInfo.loadMetrics.errorRate and 
       healthInfo.loadMetrics.errorRate > healthMonitoring.alertThresholds.errorRate then
        table.insert(alerts, {
            type = "HIGH_ERROR_RATE",
            processId = processId,
            value = healthInfo.loadMetrics.errorRate,
            threshold = healthMonitoring.alertThresholds.errorRate
        })
    end

    -- Check CPU usage threshold
    if healthInfo.loadMetrics and healthInfo.loadMetrics.cpuUsage and
       healthInfo.loadMetrics.cpuUsage > healthMonitoring.alertThresholds.cpuUsage then
        table.insert(alerts, {
            type = "HIGH_CPU_USAGE",
            processId = processId,
            value = healthInfo.loadMetrics.cpuUsage,
            threshold = healthMonitoring.alertThresholds.cpuUsage
        })
    end

    -- Check memory usage threshold
    if healthInfo.loadMetrics and healthInfo.loadMetrics.memoryUsage and
       healthInfo.loadMetrics.memoryUsage > healthMonitoring.alertThresholds.memoryUsage then
        table.insert(alerts, {
            type = "HIGH_MEMORY_USAGE",
            processId = processId,
            value = healthInfo.loadMetrics.memoryUsage,
            threshold = healthMonitoring.alertThresholds.memoryUsage
        })
    end

    -- Send alerts to subscribers
    if #alerts > 0 then
        _sendHealthAlerts(alerts)
    end
end

print("[ProcessHealthHandler] Process health monitoring handlers registered")