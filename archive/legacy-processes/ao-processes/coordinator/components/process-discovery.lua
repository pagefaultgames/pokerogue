-- Process Discovery and Management for Coordinator
-- Manages process instance discovery, health tracking, and routing table maintenance

local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")

local ProcessDiscovery = {
    -- Process registry with extended metadata
    processRegistry = {},
    
    -- Process capabilities cache
    capabilitiesCache = {},
    
    -- Health tracking
    healthTracking = {},
    
    -- Discovery configuration
    config = {
        healthCheckIntervalMs = 30000, -- 30 seconds
        processTimeoutMs = 120000, -- 2 minutes
        maxFailedHealthChecks = 3,
        discoveryBroadcastIntervalMs = 60000 -- 1 minute
    },
    
    -- Statistics
    stats = {
        processesDiscovered = 0,
        processesTimedOut = 0,
        healthChecksSent = 0,
        healthChecksReceived = 0,
        discoveryBroadcasts = 0
    }
}

-- Process health states
ProcessDiscovery.HEALTH_STATES = {
    HEALTHY = "HEALTHY",
    DEGRADED = "DEGRADED",
    UNHEALTHY = "UNHEALTHY",
    OFFLINE = "OFFLINE",
    UNKNOWN = "UNKNOWN"
}

-- Initialize process discovery
function ProcessDiscovery.initialize()
    ProcessDiscovery.processRegistry = {}
    ProcessDiscovery.capabilitiesCache = {}
    ProcessDiscovery.healthTracking = {}
    ProcessDiscovery.stats = {
        processesDiscovered = 0,
        processesTimedOut = 0,
        healthChecksSent = 0,
        healthChecksReceived = 0,
        discoveryBroadcasts = 0
    }
    
    print("[ProcessDiscovery] Process discovery system initialized")
    return true
end

-- Register discovered process
function ProcessDiscovery.registerProcess(processId, processInfo)
    if not processId or not processInfo then
        return false, "Process ID and info are required"
    end
    
    -- Validate process info structure
    if not processInfo.type or not processInfo.capabilities then
        return false, "Process type and capabilities are required"
    end
    
    -- Create extended process metadata
    local extendedProcessInfo = {
        processId = processId,
        processType = processInfo.type,
        version = processInfo.version or "1.0.0",
        capabilities = processInfo.capabilities,
        endpoints = processInfo.endpoints or {},
        description = processInfo.description or "",
        registeredAt = 0,
        lastSeen = 0,
        lastHealthCheck = nil,
        healthStatus = ProcessDiscovery.HEALTH_STATES.HEALTHY,
        failedHealthChecks = 0,
        responseTimeMs = 0,
        loadMetrics = {
            cpuUsage = 0,
            memoryUsage = 0,
            requestCount = 0,
            errorRate = 0
        }
    }
    
    -- Register in local registry
    ProcessDiscovery.processRegistry[processId] = extendedProcessInfo
    
    -- Update capabilities cache
    ProcessDiscovery.capabilitiesCache[processId] = processInfo.capabilities
    
    -- Initialize health tracking
    ProcessDiscovery.healthTracking[processId] = {
        lastCheck = 0,
        consecutiveFailures = 0,
        healthHistory = {}
    }
    
    ProcessDiscovery.stats.processesDiscovered = ProcessDiscovery.stats.processesDiscovered + 1
    
    print("[ProcessDiscovery] Registered process " .. processId .. " (" .. processInfo.type .. ")")
    return true
end

-- Discover available processes by type
function ProcessDiscovery.discoverProcessesByType(processType)
    local matchingProcesses = {}
    
    for processId, processInfo in pairs(ProcessDiscovery.processRegistry) do
        if processInfo.processType == processType and 
           processInfo.healthStatus ~= ProcessDiscovery.HEALTH_STATES.OFFLINE then
            matchingProcesses[processId] = processInfo
        end
    end
    
    -- Also check with ProcessAuthenticator for additional processes
    local authenticatedProcesses = ProcessAuthenticator.listRegisteredProcesses(processType)
    if authenticatedProcesses then
        for processId, authProcessInfo in pairs(authenticatedProcesses) do
            if not matchingProcesses[processId] then
                -- Register newly discovered process
                ProcessDiscovery.registerProcess(processId, authProcessInfo)
                matchingProcesses[processId] = ProcessDiscovery.processRegistry[processId]
            end
        end
    end
    
    return matchingProcesses
end

-- Discover processes by capability
function ProcessDiscovery.discoverProcessesByCapability(capability)
    local capableProcesses = {}
    
    for processId, processInfo in pairs(ProcessDiscovery.processRegistry) do
        if processInfo.healthStatus ~= ProcessDiscovery.HEALTH_STATES.OFFLINE and
           ProcessDiscovery._processHasCapability(processInfo.capabilities, capability) then
            capableProcesses[processId] = processInfo
        end
    end
    
    return capableProcesses
end

-- Get best available process for operation
function ProcessDiscovery.getBestProcessForOperation(operationType, routingStrategy)
    local strategy = routingStrategy or "CAPABILITY_MATCH"
    
    -- Find processes with required capability
    local capableProcesses = ProcessDiscovery.discoverProcessesByCapability(operationType)
    
    if ProcessDiscovery._getTableSize(capableProcesses) == 0 then
        return nil, "No capable processes found for operation: " .. operationType
    end
    
    -- Apply selection strategy
    local selectedProcess
    if strategy == "LEAST_LOADED" then
        selectedProcess = ProcessDiscovery._selectLeastLoaded(capableProcesses)
    elseif strategy == "BEST_HEALTH" then
        selectedProcess = ProcessDiscovery._selectHealthiest(capableProcesses)
    elseif strategy == "FASTEST_RESPONSE" then
        selectedProcess = ProcessDiscovery._selectFastest(capableProcesses)
    else
        -- Default capability match
        selectedProcess = ProcessDiscovery._selectByCapability(capableProcesses, operationType)
    end
    
    return selectedProcess
end

-- Update process health status
function ProcessDiscovery.updateProcessHealth(processId, healthInfo)
    local processInfo = ProcessDiscovery.processRegistry[processId]
    if not processInfo then
        return false, "Process not found in registry"
    end
    
    local healthTracking = ProcessDiscovery.healthTracking[processId]
    if not healthTracking then
        return false, "Health tracking not initialized for process"
    end
    
    -- Update health information
    processInfo.lastHealthCheck = 0
    processInfo.lastSeen = 0
    processInfo.responseTimeMs = healthInfo.responseTime or 0
    
    -- Update load metrics if provided
    if healthInfo.loadMetrics then
        processInfo.loadMetrics = healthInfo.loadMetrics
    end
    
    -- Determine health status
    local newHealthStatus = ProcessDiscovery._calculateHealthStatus(healthInfo)
    local previousHealthStatus = processInfo.healthStatus
    processInfo.healthStatus = newHealthStatus
    
    -- Update health tracking
    healthTracking.lastCheck = 0
    if newHealthStatus == ProcessDiscovery.HEALTH_STATES.HEALTHY then
        healthTracking.consecutiveFailures = 0
    else
        healthTracking.consecutiveFailures = healthTracking.consecutiveFailures + 1
    end
    
    -- Add to health history
    table.insert(healthTracking.healthHistory, {
        timestamp = msg.Timestamp,
        status = newHealthStatus,
        responseTime = healthInfo.responseTime or 0
    })
    
    -- Limit history size
    if #healthTracking.healthHistory > 50 then
        table.remove(healthTracking.healthHistory, 1)
    end
    
    -- Log status changes
    if previousHealthStatus ~= newHealthStatus then
        print("[ProcessDiscovery] Process " .. processId .. " health changed: " .. 
              previousHealthStatus .. " -> " .. newHealthStatus)
    end
    
    ProcessDiscovery.stats.healthChecksReceived = ProcessDiscovery.stats.healthChecksReceived + 1
    return true
end

-- Mark process as offline
function ProcessDiscovery.markProcessOffline(processId, reason)
    local processInfo = ProcessDiscovery.processRegistry[processId]
    if not processInfo then
        return false, "Process not found"
    end
    
    processInfo.healthStatus = ProcessDiscovery.HEALTH_STATES.OFFLINE
    processInfo.offlineReason = reason or "Manual offline"
    processInfo.offlineAt = 0
    
    print("[ProcessDiscovery] Marked process " .. processId .. " as offline: " .. 
          (reason or "No reason"))
    return true
end

-- Remove process from registry
function ProcessDiscovery.removeProcess(processId)
    if ProcessDiscovery.processRegistry[processId] then
        ProcessDiscovery.processRegistry[processId] = nil
        ProcessDiscovery.capabilitiesCache[processId] = nil
        ProcessDiscovery.healthTracking[processId] = nil
        return true
    end
    return false
end

-- Perform health check on all registered processes
function ProcessDiscovery.performHealthChecks()
    local currentTime = 0
    local healthCheckCount = 0
    
    for processId, processInfo in pairs(ProcessDiscovery.processRegistry) do
        local healthTracking = ProcessDiscovery.healthTracking[processId]
        
        -- Skip if recently checked
        local timeSinceCheck = (currentTime - (healthTracking.lastCheck or 0)) * 1000
        if timeSinceCheck < ProcessDiscovery.config.healthCheckIntervalMs then
            goto continue
        end
        
        -- Send health check request
        ProcessDiscovery._sendHealthCheckRequest(processId)
        healthCheckCount = healthCheckCount + 1
        ProcessDiscovery.stats.healthChecksSent = ProcessDiscovery.stats.healthChecksSent + 1
        
        ::continue::
    end
    
    return healthCheckCount
end

-- Cleanup expired processes
function ProcessDiscovery.cleanupExpiredProcesses()
    local currentTime = 0
    local cleanupCount = 0
    local expiredProcesses = {}
    
    for processId, processInfo in pairs(ProcessDiscovery.processRegistry) do
        local timeSinceLastSeen = (currentTime - processInfo.lastSeen) * 1000
        if timeSinceLastSeen > ProcessDiscovery.config.processTimeoutMs then
            table.insert(expiredProcesses, processId)
        end
    end
    
    -- Remove expired processes
    for _, processId in ipairs(expiredProcesses) do
        ProcessDiscovery.markProcessOffline(processId, "Process timeout")
        cleanupCount = cleanupCount + 1
        ProcessDiscovery.stats.processesTimedOut = ProcessDiscovery.stats.processesTimedOut + 1
    end
    
    return cleanupCount
end

-- Get process discovery statistics
function ProcessDiscovery.getStatistics()
    local healthStatusCounts = {}
    local processTypeCounts = {}
    local capabilityCounts = {}
    
    for processId, processInfo in pairs(ProcessDiscovery.processRegistry) do
        -- Count health statuses
        local status = processInfo.healthStatus
        healthStatusCounts[status] = (healthStatusCounts[status] or 0) + 1
        
        -- Count process types
        local processType = processInfo.processType
        processTypeCounts[processType] = (processTypeCounts[processType] or 0) + 1
        
        -- Count capabilities
        for _, capability in ipairs(processInfo.capabilities) do
            capabilityCounts[capability] = (capabilityCounts[capability] or 0) + 1
        end
    end
    
    return {
        stats = ProcessDiscovery.stats,
        config = ProcessDiscovery.config,
        totalRegisteredProcesses = ProcessDiscovery._getTableSize(ProcessDiscovery.processRegistry),
        healthStatusDistribution = healthStatusCounts,
        processTypeDistribution = processTypeCounts,
        capabilityDistribution = capabilityCounts,
        averageResponseTime = ProcessDiscovery._calculateAverageResponseTime()
    }
end

-- Private helper functions

function ProcessDiscovery._processHasCapability(capabilities, targetCapability)
    if not capabilities or type(capabilities) ~= "table" then
        return false
    end
    
    for _, capability in ipairs(capabilities) do
        if capability == "*" or capability == targetCapability then
            return true
        end
        
        -- Check for wildcard capabilities
        if capability:find("%-") and targetCapability:find(capability:gsub("%-.*", "")) then
            return true
        end
    end
    
    return false
end

function ProcessDiscovery._calculateHealthStatus(healthInfo)
    if not healthInfo then
        return ProcessDiscovery.HEALTH_STATES.UNKNOWN
    end
    
    -- Consider response time
    local responseTime = healthInfo.responseTime or 0
    if responseTime > 5000 then -- 5 seconds
        return ProcessDiscovery.HEALTH_STATES.UNHEALTHY
    elseif responseTime > 2000 then -- 2 seconds
        return ProcessDiscovery.HEALTH_STATES.DEGRADED
    end
    
    -- Consider error rate
    local errorRate = (healthInfo.loadMetrics and healthInfo.loadMetrics.errorRate) or 0
    if errorRate > 0.1 then -- 10% error rate
        return ProcessDiscovery.HEALTH_STATES.UNHEALTHY
    elseif errorRate > 0.05 then -- 5% error rate
        return ProcessDiscovery.HEALTH_STATES.DEGRADED
    end
    
    -- Consider CPU usage
    local cpuUsage = (healthInfo.loadMetrics and healthInfo.loadMetrics.cpuUsage) or 0
    if cpuUsage > 90 then
        return ProcessDiscovery.HEALTH_STATES.DEGRADED
    end
    
    return ProcessDiscovery.HEALTH_STATES.HEALTHY
end

function ProcessDiscovery._selectLeastLoaded(processes)
    local leastLoaded = nil
    local minLoad = math.huge
    
    for processId, processInfo in pairs(processes) do
        local load = (processInfo.loadMetrics.cpuUsage or 0) + 
                    (processInfo.loadMetrics.memoryUsage or 0)
        if load < minLoad then
            minLoad = load
            leastLoaded = processInfo
        end
    end
    
    return leastLoaded
end

function ProcessDiscovery._selectHealthiest(processes)
    -- Priority order: HEALTHY > DEGRADED > UNHEALTHY
    local healthPriority = {
        [ProcessDiscovery.HEALTH_STATES.HEALTHY] = 3,
        [ProcessDiscovery.HEALTH_STATES.DEGRADED] = 2,
        [ProcessDiscovery.HEALTH_STATES.UNHEALTHY] = 1,
        [ProcessDiscovery.HEALTH_STATES.OFFLINE] = 0,
        [ProcessDiscovery.HEALTH_STATES.UNKNOWN] = 0
    }
    
    local healthiest = nil
    local bestHealth = -1
    
    for processId, processInfo in pairs(processes) do
        local health = healthPriority[processInfo.healthStatus] or 0
        if health > bestHealth then
            bestHealth = health
            healthiest = processInfo
        end
    end
    
    return healthiest
end

function ProcessDiscovery._selectFastest(processes)
    local fastest = nil
    local minResponseTime = math.huge
    
    for processId, processInfo in pairs(processes) do
        local responseTime = processInfo.responseTimeMs or math.huge
        if responseTime < minResponseTime then
            minResponseTime = responseTime
            fastest = processInfo
        end
    end
    
    return fastest
end

function ProcessDiscovery._selectByCapability(processes, operationType)
    -- Select the first process with the exact capability
    for processId, processInfo in pairs(processes) do
        if ProcessDiscovery._processHasCapability(processInfo.capabilities, operationType) then
            return processInfo
        end
    end
    
    return nil
end

function ProcessDiscovery._sendHealthCheckRequest(processId)
    -- In a real AO environment, this would send a health check message
    print("[ProcessDiscovery] Would send health check to process: " .. processId)
end

function ProcessDiscovery._calculateAverageResponseTime()
    local totalResponseTime = 0
    local processCount = 0
    
    for processId, processInfo in pairs(ProcessDiscovery.processRegistry) do
        if processInfo.responseTimeMs and processInfo.responseTimeMs > 0 then
            totalResponseTime = totalResponseTime + processInfo.responseTimeMs
            processCount = processCount + 1
        end
    end
    
    return processCount > 0 and (totalResponseTime / processCount) or 0
end

function ProcessDiscovery._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return ProcessDiscovery