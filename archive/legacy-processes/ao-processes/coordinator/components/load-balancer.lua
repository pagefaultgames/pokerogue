-- Load Balancer for Process Instance Distribution
-- Implements various load balancing strategies for efficient request routing

local ProcessDiscovery = require("coordinator.components.process-discovery")
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")

local LoadBalancer = {
    -- Load balancing state
    roundRobinCounters = {},
    
    -- Routing statistics
    routingStats = {},
    
    -- Configuration
    config = {
        defaultStrategy = "ROUND_ROBIN",
        healthAwareRouting = true,
        sessionAffinityEnabled = true,
        maxRetryAttempts = 3,
        circuitBreakerThreshold = 10,
        circuitBreakerTimeoutMs = 60000 -- 1 minute
    },
    
    -- Circuit breaker state
    circuitBreakers = {},
    
    -- Statistics
    stats = {
        totalRequests = 0,
        successfulRoutes = 0,
        failedRoutes = 0,
        retriedRequests = 0,
        circuitBreakerTrips = 0,
        strategyUsage = {}
    }
}

-- Load balancing strategies
LoadBalancer.STRATEGIES = {
    ROUND_ROBIN = "ROUND_ROBIN",
    LEAST_LOADED = "LEAST_LOADED", 
    WEIGHTED_ROUND_ROBIN = "WEIGHTED_ROUND_ROBIN",
    LEAST_CONNECTIONS = "LEAST_CONNECTIONS",
    RESPONSE_TIME = "RESPONSE_TIME",
    RANDOM = "RANDOM",
    SESSION_AFFINITY = "SESSION_AFFINITY",
    CAPABILITY_MATCH = "CAPABILITY_MATCH"
}

-- Circuit breaker states
LoadBalancer.CIRCUIT_STATES = {
    CLOSED = "CLOSED",    -- Normal operation
    OPEN = "OPEN",        -- Blocking requests
    HALF_OPEN = "HALF_OPEN" -- Testing if service recovered
}

-- Initialize load balancer
function LoadBalancer.initialize()
    LoadBalancer.roundRobinCounters = {}
    LoadBalancer.routingStats = {}
    LoadBalancer.circuitBreakers = {}
    LoadBalancer.stats = {
        totalRequests = 0,
        successfulRoutes = 0,
        failedRoutes = 0,
        retriedRequests = 0,
        circuitBreakerTrips = 0,
        strategyUsage = {}
    }
    
    print("[LoadBalancer] Load balancer initialized")
    return true
end

-- Select target process using specified strategy
function LoadBalancer.selectTargetProcess(processType, operationType, routingContext)
    LoadBalancer.stats.totalRequests = LoadBalancer.stats.totalRequests + 1
    
    -- Get available processes
    local availableProcesses = ProcessDiscovery.discoverProcessesByType(processType)
    if LoadBalancer._getTableSize(availableProcesses) == 0 then
        LoadBalancer.stats.failedRoutes = LoadBalancer.stats.failedRoutes + 1
        return nil, "No available processes of type: " .. processType
    end
    
    -- Filter out unhealthy processes if health-aware routing is enabled
    if LoadBalancer.config.healthAwareRouting then
        availableProcesses = LoadBalancer._filterHealthyProcesses(availableProcesses)
        if LoadBalancer._getTableSize(availableProcesses) == 0 then
            LoadBalancer.stats.failedRoutes = LoadBalancer.stats.failedRoutes + 1
            return nil, "No healthy processes available for type: " .. processType
        end
    end
    
    -- Filter out processes with open circuit breakers
    availableProcesses = LoadBalancer._filterCircuitBreakerProcesses(availableProcesses)
    if LoadBalancer._getTableSize(availableProcesses) == 0 then
        LoadBalancer.stats.failedRoutes = LoadBalancer.stats.failedRoutes + 1
        return nil, "All processes have open circuit breakers for type: " .. processType
    end
    
    -- Determine routing strategy
    local strategy = LoadBalancer._determineStrategy(routingContext)
    
    -- Track strategy usage
    LoadBalancer.stats.strategyUsage[strategy] = (LoadBalancer.stats.strategyUsage[strategy] or 0) + 1
    
    -- Select process based on strategy
    local selectedProcess = LoadBalancer._applyRoutingStrategy(
        strategy, 
        availableProcesses, 
        operationType, 
        routingContext
    )
    
    if selectedProcess then
        LoadBalancer.stats.successfulRoutes = LoadBalancer.stats.successfulRoutes + 1
        LoadBalancer._updateRoutingStats(selectedProcess.processId, strategy, true)
        return selectedProcess
    else
        LoadBalancer.stats.failedRoutes = LoadBalancer.stats.failedRoutes + 1
        return nil, "Failed to select process using strategy: " .. strategy
    end
end

-- Update load metrics for a process
function LoadBalancer.updateProcessLoad(processId, loadMetrics)
    -- Update routing stats with load information
    if not LoadBalancer.routingStats[processId] then
        LoadBalancer.routingStats[processId] = {
            requestCount = 0,
            successCount = 0,
            failureCount = 0,
            averageResponseTime = 0,
            lastLoadUpdate = 0
        }
    end
    
    local stats = LoadBalancer.routingStats[processId]
    stats.lastLoadUpdate = 0
    
    -- Update load metrics in process discovery
    local healthInfo = {
        loadMetrics = loadMetrics,
        responseTime = loadMetrics.responseTime or 0
    }
    
    ProcessDiscovery.updateProcessHealth(processId, healthInfo)
end

-- Record routing result for circuit breaker logic
function LoadBalancer.recordRoutingResult(processId, success, responseTime)
    LoadBalancer._updateRoutingStats(processId, "RESULT", success)
    
    -- Update circuit breaker state
    local circuitBreaker = LoadBalancer.circuitBreakers[processId]
    if not circuitBreaker then
        circuitBreaker = {
            state = LoadBalancer.CIRCUIT_STATES.CLOSED,
            failureCount = 0,
            lastFailureTime = 0,
            successCount = 0
        }
        LoadBalancer.circuitBreakers[processId] = circuitBreaker
    end
    
    if success then
        circuitBreaker.successCount = circuitBreaker.successCount + 1
        
        -- Reset circuit breaker if in half-open state and successful
        if circuitBreaker.state == LoadBalancer.CIRCUIT_STATES.HALF_OPEN then
            circuitBreaker.state = LoadBalancer.CIRCUIT_STATES.CLOSED
            circuitBreaker.failureCount = 0
        end
    else
        circuitBreaker.failureCount = circuitBreaker.failureCount + 1
        circuitBreaker.lastFailureTime = 0
        
        -- Trip circuit breaker if threshold exceeded
        if circuitBreaker.failureCount >= LoadBalancer.config.circuitBreakerThreshold then
            if circuitBreaker.state ~= LoadBalancer.CIRCUIT_STATES.OPEN then
                circuitBreaker.state = LoadBalancer.CIRCUIT_STATES.OPEN
                LoadBalancer.stats.circuitBreakerTrips = LoadBalancer.stats.circuitBreakerTrips + 1
                print("[LoadBalancer] Circuit breaker OPEN for process " .. processId)
            end
        end
    end
end

-- Get load balancing statistics
function LoadBalancer.getStatistics()
    local strategyDistribution = {}
    for strategy, count in pairs(LoadBalancer.stats.strategyUsage) do
        strategyDistribution[strategy] = {
            count = count,
            percentage = LoadBalancer.stats.totalRequests > 0 and 
                        (count / LoadBalancer.stats.totalRequests * 100) or 0
        }
    end
    
    local circuitBreakerStats = {}
    for processId, breaker in pairs(LoadBalancer.circuitBreakers) do
        circuitBreakerStats[processId] = {
            state = breaker.state,
            failureCount = breaker.failureCount,
            successCount = breaker.successCount
        }
    end
    
    return {
        stats = LoadBalancer.stats,
        config = LoadBalancer.config,
        strategyDistribution = strategyDistribution,
        circuitBreakerStats = circuitBreakerStats,
        routingStatsCount = LoadBalancer._getTableSize(LoadBalancer.routingStats),
        successRate = LoadBalancer.stats.totalRequests > 0 and 
                     (LoadBalancer.stats.successfulRoutes / LoadBalancer.stats.totalRequests) or 0
    }
end

-- Private helper functions

function LoadBalancer._determineStrategy(routingContext)
    if not routingContext then
        return LoadBalancer.config.defaultStrategy
    end
    
    -- Check for explicit strategy request
    if routingContext.routingStrategy then
        return routingContext.routingStrategy
    end
    
    -- Check for session affinity requirement
    if LoadBalancer.config.sessionAffinityEnabled and routingContext.sessionId then
        return LoadBalancer.STRATEGIES.SESSION_AFFINITY
    end
    
    -- Default strategy
    return LoadBalancer.config.defaultStrategy
end

function LoadBalancer._applyRoutingStrategy(strategy, availableProcesses, operationType, routingContext)
    if strategy == LoadBalancer.STRATEGIES.ROUND_ROBIN then
        return LoadBalancer._roundRobinSelection(availableProcesses, operationType)
        
    elseif strategy == LoadBalancer.STRATEGIES.LEAST_LOADED then
        return LoadBalancer._leastLoadedSelection(availableProcesses)
        
    elseif strategy == LoadBalancer.STRATEGIES.RESPONSE_TIME then
        return LoadBalancer._fastestResponseSelection(availableProcesses)
        
    elseif strategy == LoadBalancer.STRATEGIES.LEAST_CONNECTIONS then
        return LoadBalancer._leastConnectionsSelection(availableProcesses)
        
    elseif strategy == LoadBalancer.STRATEGIES.RANDOM then
        return LoadBalancer._randomSelection(availableProcesses)
        
    elseif strategy == LoadBalancer.STRATEGIES.SESSION_AFFINITY then
        return LoadBalancer._sessionAffinitySelection(availableProcesses, routingContext)
        
    elseif strategy == LoadBalancer.STRATEGIES.CAPABILITY_MATCH then
        return LoadBalancer._capabilityMatchSelection(availableProcesses, operationType)
        
    else
        -- Fallback to round robin
        return LoadBalancer._roundRobinSelection(availableProcesses, operationType)
    end
end

function LoadBalancer._roundRobinSelection(availableProcesses, operationType)
    local processIds = LoadBalancer._getProcessIds(availableProcesses)
    
    if not LoadBalancer.roundRobinCounters[operationType] then
        LoadBalancer.roundRobinCounters[operationType] = 0
    end
    
    local index = (LoadBalancer.roundRobinCounters[operationType] % #processIds) + 1
    LoadBalancer.roundRobinCounters[operationType] = LoadBalancer.roundRobinCounters[operationType] + 1
    
    local selectedId = processIds[index]
    return availableProcesses[selectedId]
end

function LoadBalancer._leastLoadedSelection(availableProcesses)
    local leastLoaded = nil
    local minLoad = math.huge
    
    for processId, processInfo in pairs(availableProcesses) do
        local load = (processInfo.loadMetrics.cpuUsage or 0) + 
                    (processInfo.loadMetrics.memoryUsage or 0) +
                    (processInfo.loadMetrics.requestCount or 0) * 0.1
        
        if load < minLoad then
            minLoad = load
            leastLoaded = processInfo
        end
    end
    
    return leastLoaded
end

function LoadBalancer._fastestResponseSelection(availableProcesses)
    local fastest = nil
    local minResponseTime = math.huge
    
    for processId, processInfo in pairs(availableProcesses) do
        local responseTime = processInfo.responseTimeMs or math.huge
        if responseTime < minResponseTime then
            minResponseTime = responseTime
            fastest = processInfo
        end
    end
    
    return fastest
end

function LoadBalancer._leastConnectionsSelection(availableProcesses)
    local leastConnections = nil
    local minConnections = math.huge
    
    for processId, processInfo in pairs(availableProcesses) do
        local connections = (LoadBalancer.routingStats[processId] and 
                           LoadBalancer.routingStats[processId].requestCount) or 0
        
        if connections < minConnections then
            minConnections = connections
            leastConnections = processInfo
        end
    end
    
    return leastConnections
end

function LoadBalancer._randomSelection(availableProcesses)
    local processIds = LoadBalancer._getProcessIds(availableProcesses)
    local randomIndex = math.random(1, #processIds)
    local selectedId = processIds[randomIndex]
    return availableProcesses[selectedId]
end

function LoadBalancer._sessionAffinitySelection(availableProcesses, routingContext)
    if not routingContext or not routingContext.sessionId then
        return LoadBalancer._roundRobinSelection(availableProcesses, "session-affinity")
    end
    
    -- Use session ID hash to consistently select the same process
    local sessionHash = LoadBalancer._hashString(routingContext.sessionId)
    local processIds = LoadBalancer._getProcessIds(availableProcesses)
    local index = (sessionHash % #processIds) + 1
    local selectedId = processIds[index]
    
    return availableProcesses[selectedId]
end

function LoadBalancer._capabilityMatchSelection(availableProcesses, operationType)
    -- Find process with best capability match for the operation
    local bestMatch = nil
    
    for processId, processInfo in pairs(availableProcesses) do
        -- Use ProcessDiscovery capability matching logic
        if ProcessDiscovery._processHasCapability(processInfo.capabilities, operationType) then
            bestMatch = processInfo
            break
        end
    end
    
    return bestMatch or LoadBalancer._roundRobinSelection(availableProcesses, operationType)
end

function LoadBalancer._filterHealthyProcesses(processes)
    local healthyProcesses = {}
    
    for processId, processInfo in pairs(processes) do
        if processInfo.healthStatus == ProcessDiscovery.HEALTH_STATES.HEALTHY or
           processInfo.healthStatus == ProcessDiscovery.HEALTH_STATES.DEGRADED then
            healthyProcesses[processId] = processInfo
        end
    end
    
    return healthyProcesses
end

function LoadBalancer._filterCircuitBreakerProcesses(processes)
    local availableProcesses = {}
    local currentTime = 0
    
    for processId, processInfo in pairs(processes) do
        local circuitBreaker = LoadBalancer.circuitBreakers[processId]
        
        if not circuitBreaker or circuitBreaker.state == LoadBalancer.CIRCUIT_STATES.CLOSED then
            availableProcesses[processId] = processInfo
        elseif circuitBreaker.state == LoadBalancer.CIRCUIT_STATES.OPEN then
            -- Check if circuit breaker should transition to half-open
            local timeSinceFailure = (currentTime - circuitBreaker.lastFailureTime) * 1000
            if timeSinceFailure >= LoadBalancer.config.circuitBreakerTimeoutMs then
                circuitBreaker.state = LoadBalancer.CIRCUIT_STATES.HALF_OPEN
                availableProcesses[processId] = processInfo
                print("[LoadBalancer] Circuit breaker HALF_OPEN for process " .. processId)
            end
        elseif circuitBreaker.state == LoadBalancer.CIRCUIT_STATES.HALF_OPEN then
            availableProcesses[processId] = processInfo
        end
    end
    
    return availableProcesses
end

function LoadBalancer._updateRoutingStats(processId, strategy, success)
    if not LoadBalancer.routingStats[processId] then
        LoadBalancer.routingStats[processId] = {
            requestCount = 0,
            successCount = 0,
            failureCount = 0,
            averageResponseTime = 0,
            lastRequestTime = 0
        }
    end
    
    local stats = LoadBalancer.routingStats[processId]
    stats.requestCount = stats.requestCount + 1
    stats.lastRequestTime = 0
    
    if success then
        stats.successCount = stats.successCount + 1
    else
        stats.failureCount = stats.failureCount + 1
    end
end

function LoadBalancer._hashString(str)
    local hash = 0
    for i = 1, #str do
        hash = (hash * 31 + string.byte(str, i)) % 2147483647
    end
    return hash
end

function LoadBalancer._getProcessIds(processes)
    local ids = {}
    for processId, _ in pairs(processes) do
        table.insert(ids, processId)
    end
    return ids
end

function LoadBalancer._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return LoadBalancer