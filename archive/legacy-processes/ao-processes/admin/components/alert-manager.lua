-- Alert Manager Component
-- Provides alert generation, management, and notification capabilities for the admin system

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local MessageRouter = require("game-logic.process-coordination.message-router")

local AlertManager = {
    -- Active alerts storage
    activeAlerts = {},
    
    -- Alert history
    alertHistory = {},
    
    -- Notification channels and subscriptions
    notificationChannels = {},
    alertSubscriptions = {},
    
    -- Alert configuration
    config = {
        maxActiveAlerts = 1000,
        alertRetentionHours = 72,
        escalationTimeoutMinutes = 30,
        notificationRetryAttempts = 3,
        alertSeverityLevels = {
            INFO = 1,
            WARNING = 2,
            ERROR = 3,
            CRITICAL = 4,
            FATAL = 5
        },
        autoAcknowledgeTimeoutMinutes = 60,
        alertCooldownMinutes = 5
    },
    
    -- Alert types and their default configurations
    ALERT_TYPES = {
        HEALTH_CHECK_FAILED = {
            name = "HEALTH_CHECK_FAILED",
            defaultSeverity = "WARNING",
            autoEscalate = true,
            escalationTime = 900 -- 15 minutes
        },
        PERFORMANCE_DEGRADATION = {
            name = "PERFORMANCE_DEGRADATION",
            defaultSeverity = "WARNING",
            autoEscalate = true,
            escalationTime = 600 -- 10 minutes
        },
        SYSTEM_ERROR = {
            name = "SYSTEM_ERROR",
            defaultSeverity = "ERROR",
            autoEscalate = true,
            escalationTime = 300 -- 5 minutes
        },
        ADMIN_COMMAND = {
            name = "ADMIN_COMMAND",
            defaultSeverity = "INFO",
            autoEscalate = false,
            escalationTime = 0
        },
        PROCESS_LIFECYCLE = {
            name = "PROCESS_LIFECYCLE",
            defaultSeverity = "WARNING",
            autoEscalate = true,
            escalationTime = 600 -- 10 minutes
        },
        MAINTENANCE_MODE = {
            name = "MAINTENANCE_MODE",
            defaultSeverity = "INFO",
            autoEscalate = false,
            escalationTime = 0
        },
        SECURITY_ALERT = {
            name = "SECURITY_ALERT",
            defaultSeverity = "CRITICAL",
            autoEscalate = true,
            escalationTime = 180 -- 3 minutes
        }
    },
    
    -- Alert statistics
    statistics = {
        totalAlertsGenerated = 0,
        alertsBySeverity = {
            INFO = 0,
            WARNING = 0,
            ERROR = 0,
            CRITICAL = 0,
            FATAL = 0
        },
        alertsByType = {},
        alertsAcknowledged = 0,
        alertsAutoResolved = 0,
        escalatedAlerts = 0,
        notificationsSent = 0,
        lastAlertTime = 0
    }
}

-- Initialize alert management system
function AlertManager.initialize()
    AlertManager.activeAlerts = {}
    AlertManager.alertHistory = {}
    AlertManager.notificationChannels = {}
    AlertManager.alertSubscriptions = {}
    AlertManager.statistics = {
        totalAlertsGenerated = 0,
        alertsBySeverity = {
            INFO = 0,
            WARNING = 0,
            ERROR = 0,
            CRITICAL = 0,
            FATAL = 0
        },
        alertsByType = {},
        alertsAcknowledged = 0,
        alertsAutoResolved = 0,
        escalatedAlerts = 0,
        notificationsSent = 0,
        lastAlertTime = 0
    }
    
    -- Initialize default notification channels
    AlertManager._initializeDefaultChannels()
    
    print("[AlertManager] Alert management system initialized")
end

-- Generate new alert
function AlertManager.generateAlert(alertData)
    if not alertData or not alertData.type then
        return { success = false, error = "Alert type is required" }
    end
    
    local alertType = alertData.type
    local alertConfig = AlertManager.ALERT_TYPES[alertType]
    if not alertConfig then
        return { success = false, error = "Unknown alert type: " .. alertType }
    end
    
    local timestamp = 0
    local alertId = MessageCorrelator.generateId()
    
    -- Check for alert cooldown (avoid spam)
    if AlertManager._isInCooldown(alertType, alertData.source) then
        return { success = false, error = "Alert is in cooldown period" }
    end
    
    local alert = {
        id = alertId,
        type = alertType,
        severity = alertData.severity or alertConfig.defaultSeverity,
        message = alertData.message,
        details = alertData.details or {},
        source = alertData.source or "SYSTEM",
        processId = alertData.processId,
        timestamp = timestamp,
        status = "ACTIVE",
        acknowledgedBy = nil,
        acknowledgedAt = nil,
        resolvedAt = nil,
        escalatedAt = nil,
        escalationLevel = 0,
        notificationsSent = 0,
        correlationId = alertData.correlationId
    }
    
    -- Add to active alerts
    AlertManager.activeAlerts[alertId] = alert
    
    -- Update statistics
    AlertManager.statistics.totalAlertsGenerated = AlertManager.statistics.totalAlertsGenerated + 1
    AlertManager.statistics.alertsBySeverity[alert.severity] = 
        (AlertManager.statistics.alertsBySeverity[alert.severity] or 0) + 1
    AlertManager.statistics.alertsByType[alertType] = 
        (AlertManager.statistics.alertsByType[alertType] or 0) + 1
    AlertManager.statistics.lastAlertTime = timestamp
    
    -- Send notifications
    AlertManager._sendAlertNotifications(alert)
    
    -- Schedule escalation if applicable
    if alertConfig.autoEscalate and alertConfig.escalationTime > 0 then
        AlertManager._scheduleEscalation(alertId, alertConfig.escalationTime)
    end
    
    -- Schedule auto-acknowledge if configured
    if AlertManager.config.autoAcknowledgeTimeoutMinutes > 0 then
        AlertManager._scheduleAutoAcknowledge(alertId, AlertManager.config.autoAcknowledgeTimeoutMinutes * 60)
    end
    
    print("[AlertManager] Alert generated: " .. alertType .. " (" .. alert.severity .. ") - " .. alertId)
    
    return { success = true, alertId = alertId, alert = alert }
end

-- Acknowledge alert
function AlertManager.acknowledgeAlert(alertId, acknowledgingUser)
    local alert = AlertManager.activeAlerts[alertId]
    if not alert then
        return { success = false, error = "Alert not found: " .. alertId }
    end
    
    if alert.status == "ACKNOWLEDGED" then
        return { success = false, error = "Alert already acknowledged" }
    end
    
    alert.status = "ACKNOWLEDGED"
    alert.acknowledgedBy = acknowledgingUser
    alert.acknowledgedAt = 0
    
    AlertManager.statistics.alertsAcknowledged = AlertManager.statistics.alertsAcknowledged + 1
    
    -- Send acknowledgment notification
    AlertManager._sendAcknowledgmentNotification(alert, acknowledgingUser)
    
    print("[AlertManager] Alert acknowledged: " .. alertId .. " by " .. (acknowledgingUser or "system"))
    
    return { success = true, alertId = alertId }
end

-- Clear/resolve alert
function AlertManager.clearAlert(alertId, resolvingUser)
    local alert = AlertManager.activeAlerts[alertId]
    if not alert then
        return { success = false, error = "Alert not found: " .. alertId }
    end
    
    alert.status = "RESOLVED"
    alert.resolvedAt = 0
    alert.resolvedBy = resolvingUser
    
    -- Move to history
    table.insert(AlertManager.alertHistory, alert)
    AlertManager.activeAlerts[alertId] = nil
    
    -- Send resolution notification
    AlertManager._sendResolutionNotification(alert, resolvingUser)
    
    -- Manage history size
    AlertManager._manageAlertHistory()
    
    print("[AlertManager] Alert resolved: " .. alertId .. " by " .. (resolvingUser or "system"))
    
    return { success = true, alertId = alertId }
end

-- Get recent alerts with optional filtering
function AlertManager.getRecentAlerts(limit, severity)
    local recentAlerts = {}
    local count = 0
    local maxLimit = limit or 50
    
    -- First, get active alerts
    for alertId, alert in pairs(AlertManager.activeAlerts) do
        if count >= maxLimit then break end
        
        if not severity or alert.severity == severity then
            table.insert(recentAlerts, alert)
            count = count + 1
        end
    end
    
    -- Then, get from history (most recent first)
    for i = #AlertManager.alertHistory, 1, -1 do
        if count >= maxLimit then break end
        
        local alert = AlertManager.alertHistory[i]
        if not severity or alert.severity == severity then
            table.insert(recentAlerts, alert)
            count = count + 1
        end
    end
    
    -- Sort by timestamp (most recent first)
    table.sort(recentAlerts, function(a, b) return a.timestamp > b.timestamp end)
    
    return recentAlerts
end

-- Get count of active alerts
function AlertManager.getActiveAlertCount()
    local count = 0
    for _ in pairs(AlertManager.activeAlerts) do
        count = count + 1
    end
    return count
end

-- Update alert thresholds
function AlertManager.updateAlertThresholds(thresholds)
    if not thresholds or type(thresholds) ~= "table" then
        return { success = false, error = "Invalid threshold configuration" }
    end
    
    for alertType, config in pairs(thresholds) do
        if AlertManager.ALERT_TYPES[alertType] then
            for key, value in pairs(config) do
                AlertManager.ALERT_TYPES[alertType][key] = value
            end
        end
    end
    
    print("[AlertManager] Alert thresholds updated")
    return { success = true, thresholds = AlertManager.ALERT_TYPES }
end

-- Configure notification channels
function AlertManager.configureNotifications(notificationConfig)
    if not notificationConfig or type(notificationConfig) ~= "table" then
        return { success = false, error = "Invalid notification configuration" }
    end
    
    for channelName, channelConfig in pairs(notificationConfig) do
        AlertManager.notificationChannels[channelName] = {
            name = channelName,
            type = channelConfig.type or "LOG",
            enabled = channelConfig.enabled ~= false,
            severityFilter = channelConfig.severityFilter,
            typeFilter = channelConfig.typeFilter,
            endpoint = channelConfig.endpoint,
            configuration = channelConfig.configuration or {}
        }
    end
    
    print("[AlertManager] Notification channels configured")
    return { success = true, channels = AlertManager.notificationChannels }
end

-- Process health results for alert generation
function AlertManager.processHealthResults(healthResults)
    if not healthResults or not healthResults.processResults then
        return
    end
    
    for processId, result in pairs(healthResults.processResults) do
        if result.healthStatus == "UNHEALTHY" or result.healthStatus == "OFFLINE" then
            AlertManager.generateAlert({
                type = "HEALTH_CHECK_FAILED",
                severity = result.healthStatus == "OFFLINE" and "CRITICAL" or "WARNING",
                message = "Process health check failed: " .. processId,
                processId = processId,
                details = {
                    healthStatus = result.healthStatus,
                    consecutiveFailures = result.consecutiveFailures,
                    lastCheck = result.lastCheck,
                    processType = result.processType
                },
                source = "HEALTH_MONITOR"
            })
        end
    end
end

-- Process performance metrics for alert generation  
function AlertManager.processPerformanceMetrics(performanceMetrics)
    if not performanceMetrics or not performanceMetrics.status then
        return
    end
    
    if performanceMetrics.status == "CRITICAL" or performanceMetrics.status == "POOR" then
        AlertManager.generateAlert({
            type = "PERFORMANCE_DEGRADATION", 
            severity = performanceMetrics.status == "CRITICAL" and "CRITICAL" or "WARNING",
            message = "System performance degradation detected",
            details = {
                performanceStatus = performanceMetrics.status,
                bottlenecks = performanceMetrics.bottlenecks or {},
                systemMetrics = performanceMetrics.systemMetrics
            },
            source = "PERFORMANCE_MONITOR"
        })
    end
end

-- Get alert management statistics
function AlertManager.getStatistics()
    return {
        statistics = AlertManager.statistics,
        activeAlertCount = AlertManager.getActiveAlertCount(),
        historyCount = #AlertManager.alertHistory,
        notificationChannelCount = AlertManager._getTableSize(AlertManager.notificationChannels),
        subscriberCount = AlertManager._getTableSize(AlertManager.alertSubscriptions),
        configuration = AlertManager.config
    }
end

-- Private helper functions

function AlertManager._initializeDefaultChannels()
    -- Initialize system log channel
    AlertManager.notificationChannels["system-log"] = {
        name = "system-log",
        type = "LOG",
        enabled = true,
        severityFilter = nil, -- All severities
        typeFilter = nil, -- All types
        endpoint = nil,
        configuration = {}
    }
    
    -- Initialize admin console channel
    AlertManager.notificationChannels["admin-console"] = {
        name = "admin-console",
        type = "CONSOLE",
        enabled = true,
        severityFilter = "WARNING,ERROR,CRITICAL,FATAL",
        typeFilter = nil,
        endpoint = nil,
        configuration = {}
    }
end

function AlertManager._sendAlertNotifications(alert)
    for channelName, channel in pairs(AlertManager.notificationChannels) do
        if channel.enabled and AlertManager._shouldNotifyChannel(alert, channel) then
            local notificationResult = AlertManager._sendNotification(alert, channel)
            
            if notificationResult.success then
                alert.notificationsSent = alert.notificationsSent + 1
                AlertManager.statistics.notificationsSent = AlertManager.statistics.notificationsSent + 1
            end
        end
    end
end

function AlertManager._shouldNotifyChannel(alert, channel)
    -- Check severity filter
    if channel.severityFilter then
        local severityMatch = false
        for severity in string.gmatch(channel.severityFilter, "([^,]+)") do
            if alert.severity == severity then
                severityMatch = true
                break
            end
        end
        if not severityMatch then
            return false
        end
    end
    
    -- Check type filter
    if channel.typeFilter then
        local typeMatch = false
        for alertType in string.gmatch(channel.typeFilter, "([^,]+)") do
            if alert.type == alertType then
                typeMatch = true
                break
            end
        end
        if not typeMatch then
            return false
        end
    end
    
    return true
end

function AlertManager._sendNotification(alert, channel)
    if channel.type == "LOG" then
        print("[ALERT:" .. alert.severity .. "] " .. alert.message .. " (" .. alert.id .. ")")
        return { success = true }
    elseif channel.type == "CONSOLE" then
        -- Would send to admin console interface
        return { success = true }
    elseif channel.type == "MESSAGE" then
        -- Would send via message routing
        local notificationMessage = {
            correlation = {
                id = MessageCorrelator.generateId(),
                requestType = "ALERT_NOTIFICATION"
            },
            alert = alert,
            channel = channel.name
        }
        
        local routingResult = MessageRouter.routeMessage(
            "ALERT_NOTIFICATION",
            notificationMessage,
            "BROADCAST"
        )
        
        return routingResult
    else
        return { success = false, error = "Unknown notification type: " .. channel.type }
    end
end

function AlertManager._sendAcknowledgmentNotification(alert, user)
    print("[ALERT:ACK] Alert acknowledged: " .. alert.id .. " by " .. (user or "system"))
end

function AlertManager._sendResolutionNotification(alert, user)
    print("[ALERT:RESOLVED] Alert resolved: " .. alert.id .. " by " .. (user or "system"))
end

function AlertManager._scheduleEscalation(alertId, escalationTimeSeconds)
    -- Placeholder for escalation scheduling
    -- In a real implementation, this would integrate with a scheduler
    print("[AlertManager] Escalation scheduled for alert " .. alertId .. " in " .. escalationTimeSeconds .. " seconds")
end

function AlertManager._scheduleAutoAcknowledge(alertId, timeoutSeconds)
    -- Placeholder for auto-acknowledge scheduling
    -- In a real implementation, this would integrate with a scheduler
    print("[AlertManager] Auto-acknowledge scheduled for alert " .. alertId .. " in " .. timeoutSeconds .. " seconds")
end

function AlertManager._isInCooldown(alertType, source)
    local cooldownTime = AlertManager.config.alertCooldownMinutes * 60
    local currentTime = 0
    
    -- Simple cooldown check - in production this would be more sophisticated
    for alertId, alert in pairs(AlertManager.activeAlerts) do
        if alert.type == alertType and alert.source == source and 
           (currentTime - alert.timestamp) < cooldownTime then
            return true
        end
    end
    
    return false
end

function AlertManager._manageAlertHistory()
    -- Remove old alerts from history
    local maxHistoryEntries = AlertManager.config.alertRetentionHours
    if #AlertManager.alertHistory > maxHistoryEntries then
        table.remove(AlertManager.alertHistory, 1)
    end
    
    -- Remove alerts older than retention period
    local currentTime = 0
    local retentionThreshold = currentTime - (AlertManager.config.alertRetentionHours * 3600)
    
    local i = 1
    while i <= #AlertManager.alertHistory do
        if AlertManager.alertHistory[i].timestamp < retentionThreshold then
            table.remove(AlertManager.alertHistory, i)
        else
            break -- History is ordered by timestamp
        end
    end
end

function AlertManager._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return AlertManager