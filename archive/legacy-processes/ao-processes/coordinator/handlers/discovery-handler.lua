-- Discovery Handler
-- Handles process registration, deregistration, and discovery services

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")

local DiscoveryHandler = {
    -- Handler state
    state = nil,
    
    -- Process types and their expected capabilities
    processTypes = {
        COORDINATOR = {
            capabilities = {"PROCESS_COORDINATION", "MESSAGE_ROUTING", "WORKFLOW_MANAGEMENT"}
        },
        BATTLE = {
            capabilities = {"BATTLE_PROCESSING", "TURN_RESOLUTION", "DAMAGE_CALCULATION"}
        },
        POKEMON = {
            capabilities = {"POKEMON_MANAGEMENT", "PARTY_MANAGEMENT", "EVOLUTION_PROCESSING"}
        },
        SHOP = {
            capabilities = {"SHOP_MANAGEMENT", "ITEM_PURCHASING", "INVENTORY_MANAGEMENT"}
        },
        SECURITY = {
            capabilities = {"ANTI_CHEAT", "VALIDATION", "SECURITY_MONITORING"}
        },
        ADMIN = {
            capabilities = {"ADMIN_OPERATIONS", "MONITORING", "MAINTENANCE"}
        },
        DEPLOYMENT_COORDINATOR = {
            capabilities = {"DEPLOYMENT_COORDINATION", "HEALTH_VALIDATION", "ROLLBACK_MANAGEMENT"}
        }
    },
    
    -- Registration validation rules
    registrationRules = {
        requiredFields = {"processId", "processType", "version", "capabilities"},
        optionalFields = {"endpoint", "healthCheckEndpoint", "configEndpoint", "metadata"}
    }
}

-- Initialize discovery handler
function DiscoveryHandler.initialize(processState)
    DiscoveryHandler.state = processState
    print("[DiscoveryHandler] Discovery handler initialized")
end

-- Handle process registration
function DiscoveryHandler.handleProcessRegistration(msg)
    -- Parse message data
    local success, requestData = pcall(function()
        return require('json').decode(msg.Data)
    end)
    
    if not success then
        return {
            success = false,
            error = "Invalid JSON in registration request",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    local registrationRequest = requestData.processRegistration
    if not registrationRequest then
        return {
            success = false,
            error = "Missing process registration data",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Validate registration request
    local validationResult = DiscoveryHandler._validateRegistrationRequest(registrationRequest)
    if not validationResult.success then
        return {
            success = false,
            error = "Validation failed: " .. validationResult.error,
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Register process
    local registrationResult = DiscoveryHandler._registerProcess(registrationRequest, msg.From)
    
    if registrationResult.success then
        print("[DiscoveryHandler] Process registered: " .. registrationRequest.processId .. 
              " (" .. registrationRequest.processType .. ")")
        
        -- Notify other processes about new registration if enabled
        if DiscoveryHandler.state.config.processDiscoveryEnabled then
            DiscoveryHandler._notifyProcessRegistration(registrationRequest)
        end
    end
    
    return {
        success = registrationResult.success,
        processId = registrationRequest.processId,
        registrationTime = registrationResult.registrationTime,
        registeredProcessCount = DiscoveryHandler._getTableSize(DiscoveryHandler.state.processRegistry),
        correlationId = msg.Tags.CorrelationId,
        error = registrationResult.error
    }
end

-- Handle process deregistration
function DiscoveryHandler.handleProcessDeregistration(msg)
    -- Parse message data
    local success, requestData = pcall(function()
        return require('json').decode(msg.Data)
    end)
    
    if not success then
        return {
            success = false,
            error = "Invalid JSON in deregistration request",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    local deregistrationRequest = requestData.processDeregistration
    if not deregistrationRequest then
        return {
            success = false,
            error = "Missing process deregistration data",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    local processId = deregistrationRequest.processId
    if not processId then
        return {
            success = false,
            error = "Process ID required for deregistration",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Verify process exists
    local processInfo = DiscoveryHandler.state.processRegistry[processId]
    if not processInfo then
        return {
            success = false,
            error = "Process not found in registry: " .. processId,
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Verify source matches registered process (basic security)
    if processInfo.sourceAddress ~= msg.From then
        return {
            success = false,
            error = "Deregistration source mismatch",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Deregister process
    DiscoveryHandler.state.processRegistry[processId] = nil
    
    print("[DiscoveryHandler] Process deregistered: " .. processId)
    
    -- Notify other processes about deregistration
    if DiscoveryHandler.state.config.processDiscoveryEnabled then
        DiscoveryHandler._notifyProcessDeregistration(processId, processInfo.processType)
    end
    
    return {
        success = true,
        processId = processId,
        deregistrationTime = 0,
        remainingProcessCount = DiscoveryHandler._getTableSize(DiscoveryHandler.state.processRegistry),
        correlationId = msg.Tags.CorrelationId
    }
end

-- Handle process discovery query
function DiscoveryHandler.handleProcessDiscovery(processType, requesterInfo)
    local discoveredProcesses = {}
    
    if processType then
        -- Filter by process type
        for processId, processInfo in pairs(DiscoveryHandler.state.processRegistry) do
            if processInfo.processType == processType then
                discoveredProcesses[processId] = DiscoveryHandler._sanitizeProcessInfo(processInfo)
            end
        end
    else
        -- Return all processes
        for processId, processInfo in pairs(DiscoveryHandler.state.processRegistry) do
            discoveredProcesses[processId] = DiscoveryHandler._sanitizeProcessInfo(processInfo)
        end
    end
    
    return {
        success = true,
        processes = discoveredProcesses,
        processCount = DiscoveryHandler._getTableSize(discoveredProcesses),
        discoveryTime = 0,
        filterApplied = processType and true or false
    }
end

-- Handle process health query for discovery
function DiscoveryHandler.handleProcessHealthQuery(processId)
    local processInfo = DiscoveryHandler.state.processRegistry[processId]
    if not processInfo then
        return {
            success = false,
            error = "Process not found in registry: " .. processId
        }
    end
    
    return {
        success = true,
        processId = processId,
        processType = processInfo.processType,
        version = processInfo.version,
        registrationTime = processInfo.registrationTime,
        lastHealthCheck = processInfo.lastHealthCheck,
        healthStatus = processInfo.healthStatus or "UNKNOWN",
        capabilities = processInfo.capabilities
    }
end

-- Update process health status
function DiscoveryHandler.updateProcessHealth(processId, healthStatus, healthMetrics)
    local processInfo = DiscoveryHandler.state.processRegistry[processId]
    if not processInfo then
        return { success = false, error = "Process not found in registry: " .. processId }
    end
    
    processInfo.healthStatus = healthStatus
    processInfo.lastHealthCheck = 0
    processInfo.healthMetrics = healthMetrics or {}
    
    return { success = true }
end

-- Get process registry statistics
function DiscoveryHandler.getRegistryStatistics()
    local stats = {
        totalProcesses = DiscoveryHandler._getTableSize(DiscoveryHandler.state.processRegistry),
        processByType = {},
        healthStatusDistribution = {
            HEALTHY = 0,
            DEGRADED = 0,
            UNHEALTHY = 0,
            UNKNOWN = 0
        },
        averageRegistrationAge = 0,
        oldestRegistration = nil,
        newestRegistration = nil
    }
    
    local currentTime = 0
    local totalAge = 0
    
    for processId, processInfo in pairs(DiscoveryHandler.state.processRegistry) do
        -- Count by type
        local processType = processInfo.processType
        if not stats.processByType[processType] then
            stats.processByType[processType] = 0
        end
        stats.processByType[processType] = stats.processByType[processType] + 1
        
        -- Count by health status
        local healthStatus = processInfo.healthStatus or "UNKNOWN"
        if stats.healthStatusDistribution[healthStatus] then
            stats.healthStatusDistribution[healthStatus] = stats.healthStatusDistribution[healthStatus] + 1
        else
            stats.healthStatusDistribution["UNKNOWN"] = stats.healthStatusDistribution["UNKNOWN"] + 1
        end
        
        -- Calculate registration ages
        local registrationAge = currentTime - processInfo.registrationTime
        totalAge = totalAge + registrationAge
        
        if not stats.oldestRegistration or registrationAge > stats.oldestRegistration.age then
            stats.oldestRegistration = {
                processId = processId,
                age = registrationAge,
                registrationTime = processInfo.registrationTime
            }
        end
        
        if not stats.newestRegistration or registrationAge < stats.newestRegistration.age then
            stats.newestRegistration = {
                processId = processId,
                age = registrationAge,
                registrationTime = processInfo.registrationTime
            }
        end
    end
    
    -- Calculate average age
    if stats.totalProcesses > 0 then
        stats.averageRegistrationAge = totalAge / stats.totalProcesses
    end
    
    return stats
end

-- Private helper functions

function DiscoveryHandler._validateRegistrationRequest(request)
    -- Check required fields
    for _, field in ipairs(DiscoveryHandler.registrationRules.requiredFields) do
        if not request[field] then
            return { success = false, error = "Required field missing: " .. field }
        end
    end
    
    -- Validate process ID format
    if type(request.processId) ~= "string" or request.processId == "" then
        return { success = false, error = "processId must be a non-empty string" }
    end
    
    -- Validate process type
    if not DiscoveryHandler.processTypes[request.processType] then
        return { success = false, error = "Invalid process type: " .. request.processType }
    end
    
    -- Validate version format
    if type(request.version) ~= "string" or request.version == "" then
        return { success = false, error = "version must be a non-empty string" }
    end
    
    -- Validate capabilities
    if type(request.capabilities) ~= "table" or #request.capabilities == 0 then
        return { success = false, error = "capabilities must be a non-empty array" }
    end
    
    -- Check capabilities match process type expectations
    local expectedCapabilities = DiscoveryHandler.processTypes[request.processType].capabilities
    local hasExpectedCapability = false
    for _, capability in ipairs(request.capabilities) do
        for _, expected in ipairs(expectedCapabilities) do
            if capability == expected then
                hasExpectedCapability = true
                break
            end
        end
        if hasExpectedCapability then break end
    end
    
    if not hasExpectedCapability then
        print("[DiscoveryHandler] Warning: Process " .. request.processId .. 
              " does not have expected capabilities for type " .. request.processType)
    end
    
    return { success = true }
end

function DiscoveryHandler._registerProcess(request, sourceAddress)
    local processId = request.processId
    
    -- Check if process already registered
    if DiscoveryHandler.state.processRegistry[processId] then
        -- Update existing registration
        print("[DiscoveryHandler] Updating existing process registration: " .. processId)
    end
    
    local currentTime = 0
    
    local processInfo = {
        processId = processId,
        processType = request.processType,
        version = request.version,
        capabilities = request.capabilities,
        endpoint = request.endpoint,
        healthCheckEndpoint = request.healthCheckEndpoint,
        configEndpoint = request.configEndpoint,
        metadata = request.metadata or {},
        registrationTime = currentTime,
        lastHealthCheck = nil,
        healthStatus = "UNKNOWN",
        healthMetrics = {},
        sourceAddress = sourceAddress
    }
    
    DiscoveryHandler.state.processRegistry[processId] = processInfo
    
    return {
        success = true,
        registrationTime = currentTime
    }
end

function DiscoveryHandler._notifyProcessRegistration(processInfo)
    -- In a real implementation, this would broadcast registration notifications
    print("[DiscoveryHandler] Broadcasting process registration: " .. processInfo.processId)
end

function DiscoveryHandler._notifyProcessDeregistration(processId, processType)
    -- In a real implementation, this would broadcast deregistration notifications
    print("[DiscoveryHandler] Broadcasting process deregistration: " .. processId)
end

function DiscoveryHandler._sanitizeProcessInfo(processInfo)
    -- Remove sensitive information before sharing
    return {
        processId = processInfo.processId,
        processType = processInfo.processType,
        version = processInfo.version,
        capabilities = processInfo.capabilities,
        endpoint = processInfo.endpoint,
        healthCheckEndpoint = processInfo.healthCheckEndpoint,
        registrationTime = processInfo.registrationTime,
        lastHealthCheck = processInfo.lastHealthCheck,
        healthStatus = processInfo.healthStatus,
        metadata = processInfo.metadata
        -- Note: sourceAddress is excluded for security
    }
end

function DiscoveryHandler._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return DiscoveryHandler