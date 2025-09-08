-- Security Process Main Entry Point
-- Centralized security validation and anti-cheat detection for distributed architecture

-- JSON handling for AO environment
local json = {}
local success, jsonModule = pcall(require, 'json')
if success then
    json = jsonModule
else
    -- Pure Lua JSON implementation for AO environment compatibility
    json = {
        encode = function(obj)
            if type(obj) == "string" then
                return '"' .. obj:gsub('"', '\\"'):gsub('\n', '\\n'):gsub('\r', '\\r'):gsub('\t', '\\t') .. '"'
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
            -- Basic decode implementation for common patterns
            if not str or str == "" then return {} end
            if str == "null" then return nil end
            if str == "true" then return true end
            if str == "false" then return false end
            if str:match("^%d+$") then return tonumber(str) end
            if str:match('^".*"$') then return str:sub(2, -2) end
            return {}
        end
    }
end

-- Load process coordination components from foundation
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local MessageRouter = require("game-logic.process-coordination.message-router")
local PerformanceMonitor = require("game-logic.process-coordination.performance-monitor")

-- Load security-specific components
local ValidationEngine = require("security.components.validation-engine")
local AntiCheatDetector = require("security.components.anti-cheat-detector")
local AuditLogger = require("security.components.audit-logger")
local PolicyEnforcer = require("security.components.policy-enforcer")
local IntegrityMonitor = require("security.components.integrity-monitor")

-- Process information for discovery
local PROCESS_INFO = {
    type = "SECURITY",
    version = "1.0.0",
    capabilities = {
        "security-validation",
        "anti-cheat-detection",
        "audit-logging",
        "policy-enforcement",
        "integrity-monitoring",
        "incident-response",
        "process-authentication",
        "*" -- Full capabilities for security process
    },
    description = "Centralized security validation and anti-cheat detection process",
    endpoints = {
        "SECURITY_VALIDATION",
        "SECURITY_EVENT_REPORT",
        "POLICY_ENFORCEMENT", 
        "AUDIT_LOG_REQUEST",
        "INTEGRITY_CHECK",
        "INCIDENT_RESPONSE"
    }
}

-- Global security process state
local securityState = {
    initialized = false,
    monitoredProcesses = {},
    activeValidations = {},
    securityPolicies = {},
    auditHistory = {},
    healthStatus = "HEALTHY",
    securityMetrics = {
        validationsProcessed = 0,
        threatsDetected = 0,
        incidentsResolved = 0,
        averageValidationTime = 0
    }
}

-- Expose globals for health checks
AntiCheatValidator = AntiCheatDetector
SecurityHandlers = {
    ValidationEngine = ValidationEngine,
    AntiCheatDetector = AntiCheatDetector,
    AuditLogger = AuditLogger,
    PolicyEnforcer = PolicyEnforcer,
    IntegrityMonitor = IntegrityMonitor
}

-- Initialize security process
local function initialize()
    print("[Security] Initializing security process...")
    
    -- Initialize process coordination foundation
    MessageCorrelator.initialize()
    ProcessAuthenticator.initialize()
    MessageRouter.initialize()
    PerformanceMonitor.initialize()
    
    -- Initialize security-specific components
    ValidationEngine.initialize()
    AntiCheatDetector.initialize()
    AuditLogger.initialize()
    PolicyEnforcer.initialize()
    IntegrityMonitor.initialize()
    
    -- Register this process with authenticator
    local walletAddress = ao.id or "security-process-wallet"
    local authResult = ProcessAuthenticator.registerProcess(
        ao.id or "security-process",
        PROCESS_INFO.type,
        walletAddress,
        PROCESS_INFO.capabilities
    )
    
    if authResult then
        print("[Security] Process registered successfully with ELEVATED auth level")
    else
        print("[Security] Warning: Process registration failed")
    end
    
    -- Load default security policies
    _loadDefaultSecurityPolicies()
    
    securityState.initialized = true
    securityState.startTime = 0
    
    print("[Security] Security process initialized")
    print("[Security] Process ID: " .. (ao.id or "unknown"))
    print("[Security] Capabilities: " .. table.concat(PROCESS_INFO.capabilities, ", "))
    print("[Security] Monitoring enabled for all registered processes")
end

-- Load default security policies
local function _loadDefaultSecurityPolicies()
    -- Input validation policy
    securityState.securityPolicies["input-validation"] = {
        policyId = "input-validation",
        policyName = "Input Validation Policy",
        enforcement = "BLOCK",
        processScope = {"*"},
        rules = {
            "validate-message-format",
            "validate-wallet-address", 
            "validate-data-types",
            "validate-required-fields"
        }
    }
    
    -- Anti-cheat policy
    securityState.securityPolicies["anti-cheat"] = {
        policyId = "anti-cheat",
        policyName = "Anti-Cheat Detection Policy",
        enforcement = "TERMINATE",
        processScope = {"battle", "pokemon", "shop"},
        rules = {
            "impossible-state-detection",
            "behavioral-analysis",
            "statistical-anomaly-detection"
        }
    }
    
    -- Process authentication policy
    securityState.securityPolicies["process-auth"] = {
        policyId = "process-auth",
        policyName = "Inter-Process Authentication Policy", 
        enforcement = "BLOCK",
        processScope = {"*"},
        rules = {
            "validate-process-token",
            "validate-process-capabilities",
            "validate-operation-authorization"
        }
    }
    
    -- Data integrity policy
    securityState.securityPolicies["data-integrity"] = {
        policyId = "data-integrity",
        policyName = "Data Integrity Monitoring Policy",
        enforcement = "WARN",
        processScope = {"*"},
        rules = {
            "cross-process-consistency",
            "integrity-checksum-validation",
            "state-corruption-detection"
        }
    }
    
    print("[Security] Loaded " .. _getTableSize(securityState.securityPolicies) .. " default security policies")
end

-- Process information handler for discovery
Handlers.add(
    "security-process-info",
    Handlers.utils.hasMatchingTag("Action", "Info"),
    function(msg)
        local processInfo = {
            process = PROCESS_INFO,
            state = {
                initialized = securityState.initialized,
                healthStatus = securityState.healthStatus,
                uptime = securityState.startTime and (0 - securityState.startTime) or 0,
                monitoredProcesses = _getTableSize(securityState.monitoredProcesses),
                activeValidations = _getTableSize(securityState.activeValidations),
                securityPolicies = _getTableSize(securityState.securityPolicies)
            },
            metrics = securityState.securityMetrics,
            statistics = {
                messageCorrelator = MessageCorrelator.getStatistics(),
                processAuthenticator = ProcessAuthenticator.getStatistics(),
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
    "security-health-check",
    Handlers.utils.hasMatchingTag("Action", "HEALTH_CHECK"),
    function(msg)
        local healthInfo = {
            status = securityState.healthStatus,
            timestamp = msg.Timestamp,
            uptime = securityState.startTime and (0 - securityState.startTime) or 0,
            processId = ao.id or "unknown",
            version = PROCESS_INFO.version,
            components = {
                validationEngine = ValidationEngine.getHealth(),
                antiCheatDetector = AntiCheatDetector.getHealth(),
                auditLogger = AuditLogger.getHealth(),
                policyEnforcer = PolicyEnforcer.getHealth(),
                integrityMonitor = IntegrityMonitor.getHealth()
            },
            metrics = securityState.securityMetrics
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

-- Process registration monitoring handler
Handlers.add(
    "monitor-process-registration",
    Handlers.utils.hasMatchingTag("Action", "PROCESS_REGISTERED"),
    function(msg)
        local registrationData = json.decode(msg.Data)
        if registrationData and registrationData.processId then
            securityState.monitoredProcesses[registrationData.processId] = {
                processId = registrationData.processId,
                processType = registrationData.processType,
                registeredAt = 0,
                lastHealthCheck = 0,
                securityStatus = "MONITORED"
            }
            
            print("[Security] Now monitoring process: " .. registrationData.processId)
            
            -- Create audit log entry for new process monitoring
            AuditLogger.logSecurityEvent({
                eventType = "PROCESS_MONITORING_STARTED",
                severity = "LOW",
                processId = registrationData.processId,
                eventData = registrationData
            })
        end
    end
)

-- Security metrics update handler (internal timer)
Handlers.add(
    "update-security-metrics",
    Handlers.utils.hasMatchingTag("Action", "UPDATE_SECURITY_METRICS"),
    function(msg)
        -- Update performance metrics
        securityState.securityMetrics.averageValidationTime = ValidationEngine.getAverageValidationTime()
        
        -- Update health status based on component health
        local componentsHealthy = 
            ValidationEngine.getHealth() == "HEALTHY" and
            AntiCheatDetector.getHealth() == "HEALTHY" and
            AuditLogger.getHealth() == "HEALTHY" and
            PolicyEnforcer.getHealth() == "HEALTHY" and
            IntegrityMonitor.getHealth() == "HEALTHY"
        
        securityState.healthStatus = componentsHealthy and "HEALTHY" or "DEGRADED"
        
        print("[Security] Metrics updated - Status: " .. securityState.healthStatus)
    end
)

-- Error handler for unhandled security messages
Handlers.add(
    "security-error-handler",
    function(msg)
        -- Catch-all error handler for unhandled messages
        return not (msg.Tags.Action and (
            msg.Tags.Action == "SECURITY_VALIDATION" or
            msg.Tags.Action == "SECURITY_EVENT_REPORT" or
            msg.Tags.Action == "POLICY_ENFORCEMENT" or
            msg.Tags.Action == "AUDIT_LOG_REQUEST" or
            msg.Tags.Action == "INTEGRITY_CHECK" or
            msg.Tags.Action == "INCIDENT_RESPONSE" or
            msg.Tags.Action == "Info" or
            msg.Tags.Action == "HEALTH_CHECK" or
            msg.Tags.Action == "PROCESS_REGISTERED" or
            msg.Tags.Action == "UPDATE_SECURITY_METRICS"
        ))
    end,
    function(msg)
        print("[Security] Unhandled message: Action=" .. (msg.Tags.Action or "nil"))
        
        -- Log security event for unhandled message
        AuditLogger.logSecurityEvent({
            eventType = "UNHANDLED_MESSAGE",
            severity = "LOW",
            processId = msg.From or "unknown",
            eventData = {
                action = msg.Tags.Action,
                from = msg.From,
                correlationId = msg.Tags.CorrelationId
            }
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
                    error = "Unsupported security action",
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

-- Load security-specific handlers
require("security.handlers.security-validation-handler")
require("security.handlers.security-audit-handler") 
require("security.handlers.security-enforcement-handler")
require("security.handlers.security-response-handler")

-- Initialize process on load
initialize()

print("[Security] Security process main module loaded")