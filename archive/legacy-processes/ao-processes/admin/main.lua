-- Admin Process Main Entry Point
-- Administrative and monitoring process with elevated privileges for distributed system management

-- JSON handling for AO environment
local json = {}
local success, jsonModule = pcall(require, 'json')
if success then
    json = jsonModule
else
    -- Simple JSON implementation for AO environment
    json = {
        encode = function(obj)
            if type(obj) == "string" then
                return '"' .. obj:gsub('"', '\\"') .. '"'
            elseif type(obj) == "number" then
                return tostring(obj)
            elseif type(obj) == "boolean" then
                return obj and "true" or "false"
            elseif obj == nil then
                return "null"
            elseif type(obj) == "table" then
                local isArray = true
                local maxIndex = 0
                for k, v in pairs(obj) do
                    if type(k) ~= "number" then
                        isArray = false
                        break
                    end
                    maxIndex = math.max(maxIndex, k)
                end
                
                if isArray then
                    local result = "["
                    for i = 1, maxIndex do
                        if i > 1 then result = result .. "," end
                        result = result .. json.encode(obj[i])
                    end
                    return result .. "]"
                else
                    local result = "{"
                    local first = true
                    for k, v in pairs(obj) do
                        if not first then result = result .. "," end
                        result = result .. json.encode(tostring(k)) .. ":" .. json.encode(v)
                        first = false
                    end
                    return result .. "}"
                end
            else
                return "null"
            end
        end,
        decode = function(str)
            return {}
        end
    }
end

-- Load process coordination components from foundation
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local MessageRouter = require("game-logic.process-coordination.message-router")
local BackwardCompatibility = require("game-logic.process-coordination.backward-compatibility")
local PerformanceMonitor = require("game-logic.process-coordination.performance-monitor")

-- Load admin-specific components
local HealthMonitor = require("admin.components.health-monitor")
local AdminCommandProcessor = require("admin.components.admin-command-processor")
local PerformanceAggregator = require("admin.components.performance-aggregator")
local LogAggregator = require("admin.components.log-aggregator")
local AlertManager = require("admin.components.alert-manager")
local MaintenanceCoordinator = require("admin.components.maintenance-coordinator")

-- Process information for discovery
local PROCESS_INFO = {
    type = "ADMIN",
    version = "1.0.0",
    capabilities = {
        "system-monitoring",
        "health-tracking",
        "administrative-commands",
        "process-lifecycle-management",
        "performance-aggregation",
        "log-aggregation",
        "alert-management",
        "maintenance-coordination",
        "elevated-privileges"
    },
    description = "Administrative and monitoring process with elevated system privileges",
    endpoints = {
        "ADMIN_COMMAND",
        "HEALTH_MONITORING",
        "PERFORMANCE_QUERY",
        "LOG_AGGREGATION",
        "ALERT_MANAGEMENT",
        "MAINTENANCE_MODE",
        "PROCESS_LIFECYCLE"
    }
}

-- Global admin process state
local adminState = {
    initialized = false,
    privilegeLevel = "ADMIN",
    monitoredProcesses = {},
    activeCommands = {},
    maintenanceMode = false,
    healthStatus = "HEALTHY",
    alertsEnabled = true,
    aggregationInterval = 30, -- seconds
    lastHealthCheck = 0,
    systemMetrics = {
        overallHealth = "HEALTHY",
        processCount = 0,
        alertCount = 0,
        performanceStatus = "NORMAL"
    }
}

-- Expose globals for health checks
AdminHandlers = {
    HealthMonitor = HealthMonitor,
    AdminCommandProcessor = AdminCommandProcessor,
    PerformanceAggregator = PerformanceAggregator,
    LogAggregator = LogAggregator,
    AlertManager = AlertManager,
    MaintenanceCoordinator = MaintenanceCoordinator
}

-- Initialize admin process
local function initialize()
    print("[Admin] Initializing administrative process...")
    
    -- Initialize process coordination foundation
    MessageCorrelator.initialize()
    ProcessAuthenticator.initialize()
    MessageRouter.initialize()
    BackwardCompatibility.initialize()
    PerformanceMonitor.initialize()
    
    -- Initialize admin-specific components
    HealthMonitor.initialize()
    AdminCommandProcessor.initialize()
    PerformanceAggregator.initialize()
    LogAggregator.initialize()
    AlertManager.initialize()
    MaintenanceCoordinator.initialize()
    
    -- Register this process with elevated privileges
    local authResult = ProcessAuthenticator.registerProcess(
        ao.id or "admin-process",
        PROCESS_INFO.type,
        ao.id or "admin-wallet-address", -- Wallet address (using process ID as placeholder)
        PROCESS_INFO.capabilities
    )
    
    if authResult then
        print("[Admin] Process registered with ADMIN privileges")
    else
        print("[Admin] ERROR: Failed to register with ADMIN privileges")
        adminState.healthStatus = "DEGRADED"
    end
    
    adminState.initialized = true
    adminState.startTime = 0
    adminState.lastHealthCheck = 0
    
    -- Start background monitoring
    startBackgroundMonitoring()
    
    print("[Admin] Administrative process initialized")
    print("[Admin] Process ID: " .. (ao.id or "unknown"))
    print("[Admin] Privilege Level: " .. adminState.privilegeLevel)
    print("[Admin] Capabilities: " .. table.concat(PROCESS_INFO.capabilities, ", "))
end

-- Background monitoring function
local function startBackgroundMonitoring()
    -- This would normally be handled by a scheduler, but we'll implement
    -- periodic health checks through message handlers
    print("[Admin] Background monitoring system started")
    print("[Admin] Health check interval: " .. adminState.aggregationInterval .. " seconds")
end

-- Process information handler for discovery
Handlers.add(
    "admin-process-info",
    Handlers.utils.hasMatchingTag("Action", "Info"),
    function(msg)
        local processInfo = {
            process = PROCESS_INFO,
            state = {
                initialized = adminState.initialized,
                privilegeLevel = adminState.privilegeLevel,
                healthStatus = adminState.healthStatus,
                maintenanceMode = adminState.maintenanceMode,
                alertsEnabled = adminState.alertsEnabled,
                uptime = adminState.startTime and (0 - adminState.startTime) or 0,
                monitoredProcesses = _getTableSize(adminState.monitoredProcesses),
                activeCommands = _getTableSize(adminState.activeCommands)
            },
            systemMetrics = adminState.systemMetrics,
            statistics = {
                messageCorrelator = MessageCorrelator.getStatistics(),
                messageRouter = MessageRouter.getRoutingStatistics(),
                performanceMonitor = PerformanceMonitor.getMetrics(),
                healthMonitor = HealthMonitor.getStatistics(),
                alertManager = AlertManager.getStatistics()
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = { Action = "Info-Response" },
            Data = json.encode(processInfo)
        })
    end
)

-- Health check handler with comprehensive system status
Handlers.add(
    "admin-health-check",
    Handlers.utils.hasMatchingTag("Action", "HEALTH_CHECK"),
    function(msg)
        local healthInfo = {
            status = adminState.healthStatus,
            timestamp = msg.Timestamp,
            uptime = adminState.startTime and (0 - adminState.startTime) or 0,
            processId = ao.id or "unknown",
            version = PROCESS_INFO.version,
            privilegeLevel = adminState.privilegeLevel,
            systemMetrics = adminState.systemMetrics,
            components = {
                messageCorrelator = "HEALTHY",
                processAuthenticator = "HEALTHY",
                messageRouter = "HEALTHY",
                healthMonitor = "HEALTHY",
                adminCommandProcessor = "HEALTHY",
                performanceAggregator = "HEALTHY",
                logAggregator = "HEALTHY",
                alertManager = adminState.alertsEnabled and "HEALTHY" or "DISABLED",
                maintenanceCoordinator = "HEALTHY"
            },
            maintenanceMode = adminState.maintenanceMode,
            alertsEnabled = adminState.alertsEnabled
        }
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "HEALTH_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "health-check"
            },
            Data = json.encode(healthInfo)
        })
    end
)

-- System status query handler
Handlers.add(
    "system-status",
    Handlers.utils.hasMatchingTag("Action", "SYSTEM_STATUS"),
    function(msg)
        -- Authenticate admin request
        local authResult = ProcessAuthenticator.validateMessage(msg, "ADMIN")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "system-status"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for system status query",
                    requiredLevel = "ADMIN"
                })
            })
            return
        end
        
        local systemStatus = {
            timestamp = msg.Timestamp,
            overallHealth = adminState.systemMetrics.overallHealth,
            processCount = adminState.systemMetrics.processCount,
            alertCount = adminState.systemMetrics.alertCount,
            performanceStatus = adminState.systemMetrics.performanceStatus,
            maintenanceMode = adminState.maintenanceMode,
            monitoredProcesses = HealthMonitor.getProcessSummary(),
            recentAlerts = AlertManager.getRecentAlerts(10),
            performanceMetrics = PerformanceAggregator.getSystemMetrics(),
            logSummary = LogAggregator.getLogSummary()
        }
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "SYSTEM_STATUS_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "system-status"
            },
            Data = json.encode({
                success = true,
                systemStatus = systemStatus
            })
        })
    end
)

-- Maintenance mode toggle handler
Handlers.add(
    "maintenance-mode",
    Handlers.utils.hasMatchingTag("Action", "MAINTENANCE_MODE"),
    function(msg)
        -- Authenticate admin request
        local authResult = ProcessAuthenticator.validateMessage(msg, "ADMIN")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "maintenance-mode"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for maintenance mode control",
                    requiredLevel = "ADMIN"
                })
            })
            return
        end
        
        local requestData = json.decode(msg.Data)
        if not requestData then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "maintenance-mode"
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid request data"
                })
            })
            return
        end
        
        local previousMode = adminState.maintenanceMode
        local newMode = requestData.enabled or false
        
        -- Coordinate maintenance mode with maintenance coordinator
        local coordinationResult = MaintenanceCoordinator.setMaintenanceMode(newMode, requestData.reason)
        
        if coordinationResult.success then
            adminState.maintenanceMode = newMode
            
            -- Log maintenance mode change
            LogAggregator.logEvent({
                level = "INFO",
                component = "MaintenanceMode",
                message = "Maintenance mode " .. (newMode and "enabled" or "disabled"),
                adminUserId = authResult.userId,
                reason = requestData.reason
            })
            
            -- Send alert about maintenance mode change
            if adminState.alertsEnabled then
                AlertManager.generateAlert({
                    type = "MAINTENANCE_MODE",
                    severity = "INFO",
                    message = "System maintenance mode " .. (newMode and "enabled" or "disabled"),
                    details = {
                        previousMode = previousMode,
                        newMode = newMode,
                        reason = requestData.reason,
                        adminUserId = authResult.userId
                    }
                })
            end
            
            print("[Admin] Maintenance mode " .. (newMode and "enabled" or "disabled") .. 
                  " by " .. (authResult.userId or "unknown"))
        end
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "MAINTENANCE_MODE_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "maintenance-mode"
            },
            Data = json.encode({
                success = coordinationResult.success,
                previousMode = previousMode,
                newMode = adminState.maintenanceMode,
                timestamp = msg.Timestamp,
                error = coordinationResult.error
            })
        })
    end
)

-- Periodic health check trigger handler
Handlers.add(
    "periodic-health-check",
    Handlers.utils.hasMatchingTag("Action", "PERIODIC_HEALTH_CHECK"),
    function(msg)
        local currentTime = 0
        
        -- Check if enough time has passed since last health check
        if currentTime - adminState.lastHealthCheck >= adminState.aggregationInterval then
            adminState.lastHealthCheck = currentTime
            
            -- Trigger comprehensive system health check
            local healthResults = HealthMonitor.performSystemHealthCheck()
            local performanceMetrics = PerformanceAggregator.collectSystemMetrics()
            
            -- Update system metrics
            adminState.systemMetrics.overallHealth = healthResults.overallHealth
            adminState.systemMetrics.processCount = healthResults.processCount
            adminState.systemMetrics.performanceStatus = performanceMetrics.status
            
            -- Generate alerts if needed
            if adminState.alertsEnabled then
                AlertManager.processHealthResults(healthResults)
                AlertManager.processPerformanceMetrics(performanceMetrics)
            end
            
            print("[Admin] Periodic health check completed: " .. healthResults.overallHealth)
        end
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "HEALTH_CHECK_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "periodic-health-check"
            },
            Data = json.encode({
                success = true,
                lastCheckTime = adminState.lastHealthCheck,
                nextCheckDue = adminState.lastHealthCheck + adminState.aggregationInterval
            })
        })
    end
)

-- Error handler
Handlers.add(
    "admin-error-handler",
    function(msg)
        -- Catch-all error handler for unhandled messages
        return not (msg.Tags.Action and (
            msg.Tags.Action == "ADMIN_COMMAND" or
            msg.Tags.Action == "HEALTH_MONITORING" or
            msg.Tags.Action == "PERFORMANCE_QUERY" or
            msg.Tags.Action == "LOG_AGGREGATION" or
            msg.Tags.Action == "ALERT_MANAGEMENT" or
            msg.Tags.Action == "MAINTENANCE_MODE" or
            msg.Tags.Action == "PROCESS_LIFECYCLE" or
            msg.Tags.Action == "Info" or
            msg.Tags.Action == "HEALTH_CHECK" or
            msg.Tags.Action == "SYSTEM_STATUS" or
            msg.Tags.Action == "PERIODIC_HEALTH_CHECK"
        ))
    end,
    function(msg)
        print("[Admin] Unhandled message: Action=" .. (msg.Tags.Action or "nil"))
        
        -- Log unhandled message
        LogAggregator.logEvent({
            level = "WARN",
            component = "MessageHandler",
            message = "Unhandled message received",
            action = msg.Tags.Action,
            from = msg.From
        })
        
        if msg.From and msg.Tags.Action then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Unsupported action",
                    action = msg.Tags.Action
                })
            })
        end
    end
)

-- Private helper functions

local function _getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

-- Load admin-specific handlers
require("admin.handlers.admin-monitoring-handler")
require("admin.handlers.admin-command-handler")
require("admin.handlers.admin-deployment-handler")
require("admin.handlers.admin-logging-handler")

-- Initialize process on load
initialize()

print("[Admin] Administrative process main module loaded")