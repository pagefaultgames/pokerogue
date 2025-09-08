-- Concurrent Battle Manager
-- Manages multiple battle instances with load balancing and resource management
-- Enables parallel battle processing for improved performance
-- Epic 32.3: Battle Engine Process Extraction

local ConcurrentBattleManager = {}

-- Load dependencies
local BattleStateManager = require("battle.components.battle-state-manager")
local DamageCalculator = require("battle.components.damage-calculator")
local TurnProcessor = require("battle.components.turn-processor")
local BattleRNG = require("game-logic.rng.battle-rng")

-- Battle instance management
local BattleInstances = {}
local ResourcePools = {}
local LoadBalancer = {}
local PerformanceMonitor = {}

-- Configuration
local CONFIG = {
    maxConcurrentBattles = 100,
    maxBattlesPerPool = 10,
    resourcePoolSize = 10,
    performanceWindowSize = 100,
    loadBalancingEnabled = true,
    resourceIsolation = true
}

-- Battle instance status
ConcurrentBattleManager.InstanceStatus = {
    IDLE = "IDLE",
    PROCESSING = "PROCESSING",
    WAITING = "WAITING",
    ERROR = "ERROR",
    COMPLETED = "COMPLETED"
}

-- Load balancing strategy
ConcurrentBattleManager.LoadBalanceStrategy = {
    ROUND_ROBIN = "ROUND_ROBIN",
    LEAST_LOADED = "LEAST_LOADED",
    PERFORMANCE_BASED = "PERFORMANCE_BASED"
}

-- Initialize concurrent battle management
-- @param maxConcurrentBattles: Maximum concurrent battles (optional)
-- @return: Initialization result
function ConcurrentBattleManager.initialize(maxConcurrentBattles)
    CONFIG.maxConcurrentBattles = maxConcurrentBattles or CONFIG.maxConcurrentBattles
    
    -- Initialize battle instances
    BattleInstances = {}
    
    -- Initialize resource pools
    ResourcePools = {
        rngSeeds = {},
        calculationCache = {},
        turnProcessors = {},
        availablePools = {}
    }
    
    -- Initialize load balancer
    LoadBalancer = {
        strategy = ConcurrentBattleManager.LoadBalanceStrategy.PERFORMANCE_BASED,
        roundRobinIndex = 1,
        poolLoad = {},
        lastAssignment = 0
    }
    
    -- Initialize performance monitor
    PerformanceMonitor = {
        battleLatency = {},
        throughputHistory = {},
        resourceUtilization = {},
        errorRates = {},
        windowStart = 0
    }
    
    -- Create resource pools
    ConcurrentBattleManager.initializeResourcePools()
    
    print("[ConcurrentBattleManager] Initialized with max " .. CONFIG.maxConcurrentBattles .. " concurrent battles")
    
    return {
        success = true,
        maxConcurrentBattles = CONFIG.maxConcurrentBattles,
        resourcePools = #ResourcePools.availablePools,
        loadBalanceStrategy = LoadBalancer.strategy
    }
end

-- Initialize resource pools for battle processing
function ConcurrentBattleManager.initializeResourcePools()
    local poolCount = math.ceil(CONFIG.maxConcurrentBattles / CONFIG.maxBattlesPerPool)
    
    for i = 1, poolCount do
        local pool = {
            poolId = "pool_" .. i,
            activeBattles = {},
            maxBattles = CONFIG.maxBattlesPerPool,
            rngSeed = BattleRNG.generateSeed(),
            calculationCache = {},
            performanceMetrics = {
                averageLatency = 0,
                battlesProcessed = 0,
                errorCount = 0,
                lastUpdate = 0
            }
        }
        
        table.insert(ResourcePools.availablePools, pool)
        LoadBalancer.poolLoad[pool.poolId] = 0
    end
    
    print("[ConcurrentBattleManager] Created " .. poolCount .. " resource pools")
end

-- Start new concurrent battle
-- @param battleId: Unique battle identifier
-- @param battleParams: Battle initialization parameters
-- @param coordinatorId: Coordinator process ID
-- @return: Battle instance result or error
function ConcurrentBattleManager.startBattle(battleId, battleParams, coordinatorId)
    if not battleId or not battleParams then
        return nil, "Invalid battle parameters"
    end
    
    -- Check if battle already exists
    if BattleInstances[battleId] then
        return nil, "Battle instance already exists"
    end
    
    -- Check concurrent battle limit
    local activeBattleCount = ConcurrentBattleManager.getActiveBattleCount()
    if activeBattleCount >= CONFIG.maxConcurrentBattles then
        return nil, "Maximum concurrent battles reached (" .. CONFIG.maxConcurrentBattles .. ")"
    end
    
    -- Select resource pool using load balancing
    local resourcePool = ConcurrentBattleManager.selectResourcePool()
    if not resourcePool then
        return nil, "No available resource pool"
    end
    
    -- Create battle state
    local battleState, stateError = BattleStateManager.createBattleState(battleId, battleParams, coordinatorId)
    if not battleState then
        return nil, "Failed to create battle state: " .. (stateError or "Unknown error")
    end
    
    -- Create battle instance
    local battleInstance = {
        battleId = battleId,
        status = ConcurrentBattleManager.InstanceStatus.IDLE,
        resourcePoolId = resourcePool.poolId,
        battleState = battleState,
        coordinatorId = coordinatorId,
        createdAt = 0,
        lastProcessed = 0,
        performanceMetrics = {
            turnLatency = {},
            totalTurns = 0,
            errors = 0,
            startTime = 0
        }
    }
    
    -- Add to instance storage and resource pool
    BattleInstances[battleId] = battleInstance
    table.insert(resourcePool.activeBattles, battleInstance)
    LoadBalancer.poolLoad[resourcePool.poolId] = LoadBalancer.poolLoad[resourcePool.poolId] + 1
    
    -- Initialize battle with turn processor
    local turnResult, turnError = TurnProcessor.initializeBattle(
        battleId,
        battleParams.battleSeed,
        battleParams.playerParty,
        battleParams.enemyParty
    )
    
    if turnError then
        ConcurrentBattleManager.removeBattleFromPool(battleId, resourcePool)
        return nil, "Failed to initialize battle: " .. turnError
    end
    
    print("[ConcurrentBattleManager] Started battle: " .. battleId .. " in pool: " .. resourcePool.poolId)
    
    return {
        success = true,
        battleId = battleId,
        resourcePoolId = resourcePool.poolId,
        battleState = battleState
    }, nil
end

-- Select resource pool using load balancing strategy
-- @return: Selected resource pool or nil if none available
function ConcurrentBattleManager.selectResourcePool()
    local availablePools = {}
    
    -- Find pools with available capacity
    for _, pool in ipairs(ResourcePools.availablePools) do
        if #pool.activeBattles < pool.maxBattles then
            table.insert(availablePools, pool)
        end
    end
    
    if #availablePools == 0 then
        return nil
    end
    
    -- Apply load balancing strategy
    if LoadBalancer.strategy == ConcurrentBattleManager.LoadBalanceStrategy.ROUND_ROBIN then
        local selectedIndex = ((LoadBalancer.roundRobinIndex - 1) % #availablePools) + 1
        LoadBalancer.roundRobinIndex = LoadBalancer.roundRobinIndex + 1
        return availablePools[selectedIndex]
        
    elseif LoadBalancer.strategy == ConcurrentBattleManager.LoadBalanceStrategy.LEAST_LOADED then
        local leastLoaded = availablePools[1]
        for _, pool in ipairs(availablePools) do
            if #pool.activeBattles < #leastLoaded.activeBattles then
                leastLoaded = pool
            end
        end
        return leastLoaded
        
    elseif LoadBalancer.strategy == ConcurrentBattleManager.LoadBalanceStrategy.PERFORMANCE_BASED then
        local bestPerformance = availablePools[1]
        local bestScore = ConcurrentBattleManager.calculatePoolPerformanceScore(bestPerformance)
        
        for _, pool in ipairs(availablePools) do
            local score = ConcurrentBattleManager.calculatePoolPerformanceScore(pool)
            if score > bestScore then
                bestPerformance = pool
                bestScore = score
            end
        end
        
        return bestPerformance
    end
    
    return availablePools[1]
end

-- Calculate performance score for resource pool selection
-- @param pool: Resource pool to evaluate
-- @return: Performance score (higher is better)
function ConcurrentBattleManager.calculatePoolPerformanceScore(pool)
    if not pool.performanceMetrics then
        return 0
    end
    
    local metrics = pool.performanceMetrics
    local currentLoad = #pool.activeBattles / pool.maxBattles
    
    -- Calculate weighted score
    local latencyScore = metrics.averageLatency > 0 and (1000 / metrics.averageLatency) or 1
    local loadScore = 1 - currentLoad
    local reliabilityScore = metrics.battlesProcessed > 0 and (1 - metrics.errorCount / metrics.battlesProcessed) or 1
    
    return (latencyScore * 0.4) + (loadScore * 0.4) + (reliabilityScore * 0.2)
end

-- Process battle turn in concurrent environment
-- @param battleId: Battle identifier
-- @param turnCommands: Turn commands from players
-- @return: Turn processing result
function ConcurrentBattleManager.processBattleTurn(battleId, turnCommands)
    local battleInstance = BattleInstances[battleId]
    if not battleInstance then
        return nil, "Battle instance not found"
    end
    
    -- Mark as processing
    battleInstance.status = ConcurrentBattleManager.InstanceStatus.PROCESSING
    local startTime = msg.Timestamp
    
    -- Get resource pool
    local resourcePool = ConcurrentBattleManager.getResourcePool(battleInstance.resourcePoolId)
    if not resourcePool then
        return nil, "Resource pool not found"
    end
    
    -- Add turn commands to battle state
    for playerId, commands in pairs(turnCommands or {}) do
        for _, command in ipairs(commands) do
            local success, error = TurnProcessor.addTurnCommand(battleInstance.battleState, playerId, command)
            if not success then
                battleInstance.performanceMetrics.errors = battleInstance.performanceMetrics.errors + 1
                return nil, "Failed to add turn command: " .. (error or "Unknown error")
            end
        end
    end
    
    -- Process the turn
    local turnResult, turnError = TurnProcessor.processBattleTurn(battleInstance.battleState)
    
    local endTime = 0
    local turnLatency = endTime - startTime
    
    -- Update performance metrics
    table.insert(battleInstance.performanceMetrics.turnLatency, turnLatency)
    battleInstance.performanceMetrics.totalTurns = battleInstance.performanceMetrics.totalTurns + 1
    battleInstance.lastProcessed = endTime
    
    -- Limit latency history size
    while #battleInstance.performanceMetrics.turnLatency > CONFIG.performanceWindowSize do
        table.remove(battleInstance.performanceMetrics.turnLatency, 1)
    end
    
    -- Update pool performance metrics
    ConcurrentBattleManager.updatePoolPerformanceMetrics(resourcePool, turnLatency, turnError ~= nil)
    
    -- Handle turn processing result
    if turnError then
        battleInstance.status = ConcurrentBattleManager.InstanceStatus.ERROR
        battleInstance.performanceMetrics.errors = battleInstance.performanceMetrics.errors + 1
        return nil, "Turn processing failed: " .. turnError
    end
    
    -- Check if battle is completed
    if turnResult.battle_end then
        battleInstance.status = ConcurrentBattleManager.InstanceStatus.COMPLETED
        BattleStateManager.completeBattle(battleId, turnResult.battle_end)
        
        -- Schedule for cleanup
        ConcurrentBattleManager.scheduleBattleCleanup(battleId, 300) -- 5 minutes
    else
        battleInstance.status = ConcurrentBattleManager.InstanceStatus.IDLE
    end
    
    return {
        success = true,
        battleId = battleId,
        turnResult = turnResult,
        performanceMetrics = {
            turnLatency = turnLatency,
            totalTurns = battleInstance.performanceMetrics.totalTurns
        }
    }, nil
end

-- Update resource pool performance metrics
-- @param pool: Resource pool
-- @param turnLatency: Latest turn latency
-- @param hadError: Whether turn processing had an error
function ConcurrentBattleManager.updatePoolPerformanceMetrics(pool, turnLatency, hadError)
    local metrics = pool.performanceMetrics
    
    metrics.battlesProcessed = metrics.battlesProcessed + 1
    if hadError then
        metrics.errorCount = metrics.errorCount + 1
    end
    
    -- Update average latency (exponential moving average)
    if metrics.averageLatency == 0 then
        metrics.averageLatency = turnLatency
    else
        metrics.averageLatency = (metrics.averageLatency * 0.9) + (turnLatency * 0.1)
    end
    
    metrics.lastUpdate = 0
end

-- Get resource pool by ID
-- @param poolId: Resource pool identifier
-- @return: Resource pool or nil
function ConcurrentBattleManager.getResourcePool(poolId)
    for _, pool in ipairs(ResourcePools.availablePools) do
        if pool.poolId == poolId then
            return pool
        end
    end
    return nil
end

-- Remove battle from resource pool
-- @param battleId: Battle identifier
-- @param pool: Resource pool
function ConcurrentBattleManager.removeBattleFromPool(battleId, pool)
    for i, battle in ipairs(pool.activeBattles) do
        if battle.battleId == battleId then
            table.remove(pool.activeBattles, i)
            LoadBalancer.poolLoad[pool.poolId] = LoadBalancer.poolLoad[pool.poolId] - 1
            break
        end
    end
    
    BattleInstances[battleId] = nil
end

-- Schedule battle cleanup after delay
-- @param battleId: Battle identifier
-- @param delaySeconds: Delay before cleanup
function ConcurrentBattleManager.scheduleBattleCleanup(battleId, delaySeconds)
    -- This would be implemented with a cleanup scheduler in production
    -- For now, we'll just mark for immediate cleanup
    ConcurrentBattleManager.cleanupBattle(battleId)
end

-- Cleanup completed battle
-- @param battleId: Battle identifier
-- @return: Cleanup success status
function ConcurrentBattleManager.cleanupBattle(battleId)
    local battleInstance = BattleInstances[battleId]
    if not battleInstance then
        return false
    end
    
    -- Get resource pool and remove battle
    local resourcePool = ConcurrentBattleManager.getResourcePool(battleInstance.resourcePoolId)
    if resourcePool then
        ConcurrentBattleManager.removeBattleFromPool(battleId, resourcePool)
    end
    
    print("[ConcurrentBattleManager] Cleaned up battle: " .. battleId)
    return true
end

-- Get count of active battles
-- @return: Number of active battles
function ConcurrentBattleManager.getActiveBattleCount()
    local count = 0
    for _, instance in pairs(BattleInstances) do
        if instance.status ~= ConcurrentBattleManager.InstanceStatus.COMPLETED then
            count = count + 1
        end
    end
    return count
end

-- Get battle instance by ID
-- @param battleId: Battle identifier
-- @return: Battle instance or nil
function ConcurrentBattleManager.getBattleInstance(battleId)
    return BattleInstances[battleId]
end

-- Get performance statistics
-- @return: Performance statistics for concurrent battle processing
function ConcurrentBattleManager.getPerformanceStatistics()
    local stats = {
        totalBattles = 0,
        activeBattles = 0,
        completedBattles = 0,
        errorBattles = 0,
        poolUtilization = {},
        averageLatency = 0,
        throughput = 0,
        resourcePools = #ResourcePools.availablePools
    }
    
    local totalLatency = 0
    local latencyCount = 0
    local totalTurns = 0
    
    -- Calculate battle statistics
    for _, instance in pairs(BattleInstances) do
        stats.totalBattles = stats.totalBattles + 1
        
        if instance.status == ConcurrentBattleManager.InstanceStatus.IDLE or 
           instance.status == ConcurrentBattleManager.InstanceStatus.PROCESSING then
            stats.activeBattles = stats.activeBattles + 1
        elseif instance.status == ConcurrentBattleManager.InstanceStatus.COMPLETED then
            stats.completedBattles = stats.completedBattles + 1
        elseif instance.status == ConcurrentBattleManager.InstanceStatus.ERROR then
            stats.errorBattles = stats.errorBattles + 1
        end
        
        -- Aggregate latency data
        for _, latency in ipairs(instance.performanceMetrics.turnLatency) do
            totalLatency = totalLatency + latency
            latencyCount = latencyCount + 1
        end
        
        totalTurns = totalTurns + instance.performanceMetrics.totalTurns
    end
    
    -- Calculate pool utilization
    for _, pool in ipairs(ResourcePools.availablePools) do
        stats.poolUtilization[pool.poolId] = {
            activeBattles = #pool.activeBattles,
            maxBattles = pool.maxBattles,
            utilization = #pool.activeBattles / pool.maxBattles,
            averageLatency = pool.performanceMetrics.averageLatency,
            battlesProcessed = pool.performanceMetrics.battlesProcessed,
            errorCount = pool.performanceMetrics.errorCount
        }
    end
    
    -- Calculate overall metrics
    if latencyCount > 0 then
        stats.averageLatency = totalLatency / latencyCount
    end
    
    stats.throughput = totalTurns
    
    return stats
end

return ConcurrentBattleManager