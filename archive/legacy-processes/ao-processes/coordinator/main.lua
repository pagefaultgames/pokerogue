-- Coordinator Process Main Entry Point
-- Primary coordinator process with session management and API gateway functionality

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
            -- Basic decode - for now just return empty table
            -- Would need more robust implementation for full JSON parsing
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

-- Load coordinator-specific components
local APIGateway = require("coordinator.components.api-gateway")

-- Process information for discovery
local PROCESS_INFO = {
    type = "COORDINATOR",
    version = "1.0.0",
    capabilities = {
        "client-gateway",
        "session-management", 
        "process-coordination",
        "load-balancing",
        "health-monitoring",
        "hybrid-deployment"
    },
    description = "Primary coordinator process for multi-process architecture",
    endpoints = {
        "CLIENT_MESSAGE",
        "INTER_PROCESS_MESSAGE", 
        "SESSION_MANAGEMENT",
        "PROCESS_HEALTH",
        "GATEWAY_STATUS"
    }
}

-- Global process state (local for internal use)
local coordinatorState = {
    initialized = false,
    mode = "HYBRID", -- MONOLITHIC, HYBRID, or DISTRIBUTED
    activeSessions = {},
    processRegistry = {},
    healthStatus = "HEALTHY"
}

-- Expose globals for health checks
CoordinatorState = coordinatorState
ProcessRegistry = coordinatorState.processRegistry

-- Initialize coordinator process
local function initialize()
    print("[Coordinator] Initializing coordinator process...")
    
    -- Initialize process coordination foundation
    MessageCorrelator.initialize()
    ProcessAuthenticator.initialize()
    MessageRouter.initialize()
    BackwardCompatibility.initialize()
    PerformanceMonitor.initialize()
    
    -- Initialize coordinator-specific components
    APIGateway.initialize()
    
    -- Register this process with authenticator
    local authResult = ProcessAuthenticator.registerProcess(
        ao.id or "coordinator-process",
        PROCESS_INFO.type,
        PROCESS_INFO.capabilities
    )
    
    if authResult then
        print("[Coordinator] Process registered successfully")
    else
        print("[Coordinator] Warning: Process registration failed")
    end
    
    coordinatorState.initialized = true
    coordinatorState.startTime = 0
    
    print("[Coordinator] Coordinator process initialized in " .. coordinatorState.mode .. " mode")
    print("[Coordinator] Process ID: " .. (ao.id or "unknown"))
    print("[Coordinator] Capabilities: " .. table.concat(PROCESS_INFO.capabilities, ", "))
end

-- Process information handler for discovery
Handlers.add(
    "process-info",
    Handlers.utils.hasMatchingTag("Action", "Info"),
    function(msg)
        local processInfo = {
            process = PROCESS_INFO,
            state = {
                initialized = coordinatorState.initialized,
                mode = coordinatorState.mode,
                healthStatus = coordinatorState.healthStatus,
                uptime = coordinatorState.startTime and (0 - coordinatorState.startTime) or 0,
                activeSessions = _getTableSize(coordinatorState.activeSessions),
                registeredProcesses = _getTableSize(coordinatorState.processRegistry)
            },
            statistics = {
                messageCorrelator = MessageCorrelator.getStatistics(),
                messageRouter = MessageRouter.getRoutingStatistics(),
                apiGateway = APIGateway.getStatistics(),
                performanceMonitor = PerformanceMonitor.getMetrics()
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = { Action = "Info-Response" },
            Data = json.encode(processInfo)
        })
    end
)

-- Health check handler
Handlers.add(
    "health-check",
    Handlers.utils.hasMatchingTag("Action", "HEALTH_CHECK"),
    function(msg)
        local healthInfo = {
            status = coordinatorState.healthStatus,
            timestamp = msg.Timestamp,
            uptime = coordinatorState.startTime and (0 - coordinatorState.startTime) or 0,
            processId = ao.id or "unknown",
            version = PROCESS_INFO.version,
            mode = coordinatorState.mode,
            components = {
                messageCorrelator = "HEALTHY",
                processAuthenticator = "HEALTHY", 
                messageRouter = "HEALTHY",
                apiGateway = "HEALTHY"
            }
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

-- Deployment mode switching handler
Handlers.add(
    "set-deployment-mode",
    Handlers.utils.hasMatchingTag("Action", "SET_DEPLOYMENT_MODE"),
    function(msg)
        local requestData = json.decode(msg.Data)
        if not requestData or not requestData.mode then
            ao.send({
                Target = msg.From,
                Tags = { Action = "MODE_CHANGE_RESPONSE" },
                Data = json.encode({
                    success = false,
                    error = "Mode parameter required"
                })
            })
            return
        end
        
        local validModes = {"MONOLITHIC", "HYBRID", "DISTRIBUTED"}
        local isValidMode = false
        for _, validMode in ipairs(validModes) do
            if requestData.mode == validMode then
                isValidMode = true
                break
            end
        end
        
        if not isValidMode then
            ao.send({
                Target = msg.From,
                Tags = { Action = "MODE_CHANGE_RESPONSE" },
                Data = json.encode({
                    success = false,
                    error = "Invalid mode. Valid modes: " .. table.concat(validModes, ", ")
                })
            })
            return
        end
        
        local previousMode = coordinatorState.mode
        coordinatorState.mode = requestData.mode
        
        print("[Coordinator] Deployment mode changed from " .. previousMode .. " to " .. requestData.mode)
        
        ao.send({
            Target = msg.From,
            Tags = { Action = "MODE_CHANGE_RESPONSE" },
            Data = json.encode({
                success = true,
                previousMode = previousMode,
                newMode = coordinatorState.mode,
                timestamp = 0
            })
        })
    end
)

-- Error handler
Handlers.add(
    "error-handler",
    function(msg)
        -- Catch-all error handler for unhandled messages
        return not (msg.Tags.Action and (
            msg.Tags.Action == "CLIENT_MESSAGE" or
            msg.Tags.Action == "INTER_PROCESS_MESSAGE" or
            msg.Tags.Action == "SESSION_MANAGEMENT" or
            msg.Tags.Action == "PROCESS_HEALTH" or
            msg.Tags.Action == "GATEWAY_STATUS" or
            msg.Tags.Action == "Info" or
            msg.Tags.Action == "HEALTH_CHECK" or
            msg.Tags.Action == "SET_DEPLOYMENT_MODE"
        ))
    end,
    function(msg)
        print("[Coordinator] Unhandled message: Action=" .. (msg.Tags.Action or "nil"))
        
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

-- Load coordinator-specific handlers
require("coordinator.handlers.api-gateway-handler")
require("coordinator.handlers.session-management-handler")
require("coordinator.handlers.process-health-handler")

-- Initialize process on load
initialize()

print("[Coordinator] Coordinator process main module loaded")