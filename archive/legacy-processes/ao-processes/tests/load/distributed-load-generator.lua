--[[
Distributed Load Generation System
Implements realistic user patterns and concurrent load simulation
--]]

local json = require("json")

local DistributedLoadGenerator = {
    generators = {},
    loadPatterns = {},
    systemMetrics = {}
}

-- Load pattern definitions for realistic user behavior
DistributedLoadGenerator.loadPatterns = {
    casual_player = {
        name = "Casual Player",
        scenarios = {
            {type = "pokemon_query", weight = 0.4, data = {queryType = "party"}},
            {type = "battle_request", weight = 0.3, data = {opponentType = "wild"}},
            {type = "state_update", weight = 0.3, data = {updateType = "pokemon_exp"}}
        },
        requestInterval = {min = 2000, max = 10000}, -- 2-10 seconds between requests
        sessionDuration = {min = 300, max = 1800} -- 5-30 minutes
    },
    
    competitive_player = {
        name = "Competitive Player",
        scenarios = {
            {type = "battle_request", weight = 0.5, data = {opponentType = "trainer", battleType = "competitive"}},
            {type = "pokemon_query", weight = 0.2, data = {queryType = "detailed"}},
            {type = "state_update", weight = 0.3, data = {updateType = "team_management"}}
        },
        requestInterval = {min = 500, max = 3000}, -- 0.5-3 seconds between requests
        sessionDuration = {min = 600, max = 3600} -- 10-60 minutes
    },
    
    power_user = {
        name = "Power User",
        scenarios = {
            {type = "battle_request", weight = 0.3, data = {opponentType = "multiple"}},
            {type = "pokemon_query", weight = 0.4, data = {queryType = "bulk"}},
            {type = "state_update", weight = 0.3, data = {updateType = "mass_operations"}}
        },
        requestInterval = {min = 100, max = 1000}, -- 0.1-1 second between requests
        sessionDuration = {min = 1200, max = 7200} -- 20-120 minutes
    }
}

-- Create distributed load generator instance
function DistributedLoadGenerator.createGenerator(generatorId, config)
    local generator = {
        id = generatorId,
        config = config,
        users = {},
        isActive = false,
        startTime = 0,
        totalRequests = 0,
        totalErrors = 0,
        metrics = {
            responseTimeSum = 0,
            responseTimeCount = 0,
            errorsByType = {},
            throughputHistory = {}
        }
    }
    
    function generator:start()
        self.isActive = true
        self.startTime = 0
        
        -- Create users based on load pattern distribution
        self:createUserPool()
        
        print(string.format("Load generator %s started with %d users", 
              self.id, #self.users))
    end
    
    function generator:stop()
        self.isActive = false
        self.endTime = 0
        
        -- Stop all user sessions
        for _, user in pairs(self.users) do
            user.active = false
        end
        
        print(string.format("Load generator %s stopped", self.id))
    end
    
    function generator:createUserPool()
        local totalUsers = self.config.concurrentUsers or 50
        local patterns = self.config.userPatterns or {
            {pattern = "casual_player", percentage = 0.6},
            {pattern = "competitive_player", percentage = 0.3},
            {pattern = "power_user", percentage = 0.1}
        }
        
        for i = 1, totalUsers do
            local patternType = self:selectUserPattern(patterns, i, totalUsers)
            local user = self:createUser(string.format("%s_user_%d", self.id, i), patternType)
            table.insert(self.users, user)
        end
    end
    
    function generator:selectUserPattern(patterns, userIndex, totalUsers)
        local position = userIndex / totalUsers
        local cumulative = 0
        
        for _, patternConfig in ipairs(patterns) do
            cumulative = cumulative + patternConfig.percentage
            if position <= cumulative then
                return patternConfig.pattern
            end
        end
        
        return patterns[1].pattern -- fallback
    end
    
    function generator:createUser(userId, patternType)
        local pattern = DistributedLoadGenerator.loadPatterns[patternType]
        if not pattern then
            pattern = DistributedLoadGenerator.loadPatterns.casual_player
        end
        
        local user = {
            id = userId,
            pattern = pattern,
            active = true,
            requestCount = 0,
            errorCount = 0,
            sessionStart = 0,
            lastRequest = 0,
            sessionDuration = self:randomInRange(pattern.sessionDuration)
        }
        
        function user:shouldMakeRequest()
            if not self.active then return false end
            
            local currentTime = 0
            local sessionElapsed = currentTime - self.sessionStart
            
            -- Check if session should end
            if sessionElapsed >= self.sessionDuration then
                self.active = false
                return false
            end
            
            -- Check if enough time has passed since last request
            local timeSinceLastRequest = (currentTime - self.lastRequest) * 1000 -- convert to ms
            local minInterval = self.pattern.requestInterval.min
            
            return timeSinceLastRequest >= minInterval
        end
        
        function user:selectScenario()
            local random = math.random()
            local cumulative = 0
            
            for _, scenario in ipairs(self.pattern.scenarios) do
                cumulative = cumulative + scenario.weight
                if random <= cumulative then
                    return scenario
                end
            end
            
            return self.pattern.scenarios[1] -- fallback
        end
        
        return user
    end
    
    function generator:randomInRange(range)
        return math.random(range.min, range.max)
    end
    
    function generator:executeLoadCycle()
        if not self.isActive then return end
        
        local activeUsers = 0
        local requestsThisCycle = 0
        
        for _, user in pairs(self.users) do
            if user:shouldMakeRequest() then
                activeUsers = activeUsers + 1
                local scenario = user:selectScenario()
                
                -- Execute request
                local requestResult = self:executeUserRequest(user, scenario)
                user.requestCount = user.requestCount + 1
                user.lastRequest = 0
                
                if requestResult.success then
                    requestsThisCycle = requestsThisCycle + 1
                    self:recordRequestMetrics(requestResult)
                else
                    user.errorCount = user.errorCount + 1
                    self:recordErrorMetrics(requestResult)
                end
            end
        end
        
        self.totalRequests = self.totalRequests + requestsThisCycle
        
        -- Record throughput for this cycle
        table.insert(self.metrics.throughputHistory, {
            timestamp = msg.Timestamp,
            requestCount = requestsThisCycle,
            activeUsers = activeUsers
        })
        
        return {
            activeUsers = activeUsers,
            requestsThisCycle = requestsThisCycle
        }
    end
    
    function generator:executeUserRequest(user, scenario)
        local startTime = os.clock() * 1000 -- milliseconds
        local success, result = pcall(function()
            return DistributedLoadGenerator.executeScenario(scenario, user.id, self.id)
        end)
        local endTime = os.clock() * 1000
        
        return {
            success = success,
            responseTime = endTime - startTime,
            result = result,
            scenario = scenario,
            userId = user.id,
            timestamp = 0
        }
    end
    
    function generator:recordRequestMetrics(requestResult)
        self.metrics.responseTimeSum = self.metrics.responseTimeSum + requestResult.responseTime
        self.metrics.responseTimeCount = self.metrics.responseTimeCount + 1
    end
    
    function generator:recordErrorMetrics(requestResult)
        self.totalErrors = self.totalErrors + 1
        local errorType = requestResult.scenario.type
        
        if not self.metrics.errorsByType[errorType] then
            self.metrics.errorsByType[errorType] = 0
        end
        self.metrics.errorsByType[errorType] = self.metrics.errorsByType[errorType] + 1
    end
    
    function generator:getMetrics()
        local averageResponseTime = 0
        if self.metrics.responseTimeCount > 0 then
            averageResponseTime = self.metrics.responseTimeSum / self.metrics.responseTimeCount
        end
        
        local errorRate = 0
        if self.totalRequests > 0 then
            errorRate = self.totalErrors / self.totalRequests
        end
        
        local activeUsers = 0
        for _, user in pairs(self.users) do
            if user.active then
                activeUsers = activeUsers + 1
            end
        end
        
        -- Calculate current throughput (requests per second)
        local currentThroughput = 0
        local recentThroughput = {}
        local currentTime = 0
        
        for _, throughputData in ipairs(self.metrics.throughputHistory) do
            if currentTime - throughputData.timestamp <= 60 then -- last minute
                table.insert(recentThroughput, throughputData.requestCount)
            end
        end
        
        if #recentThroughput > 0 then
            local sum = 0
            for _, count in ipairs(recentThroughput) do
                sum = sum + count
            end
            currentThroughput = sum / #recentThroughput
        end
        
        return {
            generatorId = self.id,
            totalRequests = self.totalRequests,
            totalErrors = self.totalErrors,
            errorRate = errorRate,
            averageResponseTime = averageResponseTime,
            activeUsers = activeUsers,
            totalUsers = #self.users,
            currentThroughput = currentThroughput,
            uptime = self.isActive and (0 - self.startTime) or 0
        }
    end
    
    return generator
end

-- Execute scenario with realistic simulation
function DistributedLoadGenerator.executeScenario(scenario, userId, generatorId)
    local scenarioType = scenario.type
    local scenarioData = scenario.data or {}
    
    -- Add distributed context
    local context = {
        userId = userId,
        generatorId = generatorId,
        timestamp = msg.Timestamp,
        correlationId = string.format("%s_%s_%d", generatorId, userId, 0)
    }
    
    if scenarioType == "battle_request" then
        return DistributedLoadGenerator.simulateDistributedBattle(scenarioData, context)
    elseif scenarioType == "pokemon_query" then
        return DistributedLoadGenerator.simulateDistributedQuery(scenarioData, context)
    elseif scenarioType == "state_update" then
        return DistributedLoadGenerator.simulateDistributedUpdate(scenarioData, context)
    else
        error("Unknown scenario type: " .. tostring(scenarioType))
    end
end

-- Simulate distributed battle request with process coordination
function DistributedLoadGenerator.simulateDistributedBattle(data, context)
    -- Simulate multi-process coordination
    local coordinatorDelay = math.random(10, 30) -- coordinator processing
    local battleProcessDelay = math.random(50, 200) -- battle engine processing
    local pokemonProcessDelay = math.random(20, 80) -- pokemon data retrieval
    
    local totalProcessingTime = coordinatorDelay + battleProcessDelay + pokemonProcessDelay
    
    -- Simulate occasional coordination failures
    local failureChance = 0.02 -- 2% failure rate
    if math.random() < failureChance then
        return {
            success = false,
            error = "Process coordination timeout",
            errorType = "COORDINATION_TIMEOUT",
            processingTime = totalProcessingTime
        }
    end
    
    return {
        success = true,
        data = {
            battleId = context.correlationId,
            opponentType = data.opponentType,
            battleType = data.battleType,
            processCoordination = {
                coordinatorTime = coordinatorDelay,
                battleProcessTime = battleProcessDelay,
                pokemonProcessTime = pokemonProcessDelay
            }
        },
        processingTime = totalProcessingTime
    }
end

-- Simulate distributed query with caching
function DistributedLoadGenerator.simulateDistributedQuery(data, context)
    -- Simulate cache hit/miss scenarios
    local cacheHitChance = 0.7 -- 70% cache hit rate
    local baseProcessingTime
    
    if math.random() < cacheHitChance then
        baseProcessingTime = math.random(5, 20) -- cache hit
    else
        baseProcessingTime = math.random(50, 150) -- cache miss, full query
    end
    
    -- Add network latency for distributed query
    local networkLatency = math.random(5, 25)
    local totalTime = baseProcessingTime + networkLatency
    
    return {
        success = true,
        data = {
            queryId = context.correlationId,
            queryType = data.queryType,
            cacheHit = math.random() < cacheHitChance,
            resultCount = math.random(1, 10)
        },
        processingTime = totalTime
    }
end

-- Simulate distributed state update with consistency
function DistributedLoadGenerator.simulateDistributedUpdate(data, context)
    -- Simulate distributed state consistency operations
    local validationTime = math.random(10, 40)
    local updateTime = math.random(30, 100)
    local replicationTime = math.random(20, 60) -- cross-process state sync
    
    local totalTime = validationTime + updateTime + replicationTime
    
    -- Simulate occasional consistency conflicts
    local conflictChance = 0.01 -- 1% conflict rate
    if math.random() < conflictChance then
        return {
            success = false,
            error = "State consistency conflict detected",
            errorType = "CONSISTENCY_CONFLICT",
            processingTime = totalTime
        }
    end
    
    return {
        success = true,
        data = {
            updateId = context.correlationId,
            updateType = data.updateType,
            affectedProcesses = math.random(2, 5),
            consistencyLevel = "eventual"
        },
        processingTime = totalTime
    }
end

-- Orchestrate distributed load test
function DistributedLoadGenerator.executeDistributedLoadTest(config)
    print(string.format("Starting distributed load test: %s", config.testId))
    
    local generators = {}
    local generatorCount = config.generatorCount or 3
    
    -- Create multiple load generators
    for i = 1, generatorCount do
        local generatorConfig = {
            concurrentUsers = math.floor(config.totalUsers / generatorCount),
            userPatterns = config.userPatterns,
            duration = config.duration
        }
        
        local generator = DistributedLoadGenerator.createGenerator(
            string.format("gen_%d", i), generatorConfig
        )
        generators[i] = generator
        DistributedLoadGenerator.generators[generator.id] = generator
    end
    
    -- Start all generators
    for _, generator in pairs(generators) do
        generator:start()
    end
    
    -- Run load test for specified duration
    local testEndTime = 0 + config.duration
    local cycleCount = 0
    
    while 0 < testEndTime do
        cycleCount = cycleCount + 1
        
        -- Execute load cycle on all generators
        local cycleMetrics = {
            totalActiveUsers = 0,
            totalRequestsThisCycle = 0
        }
        
        for _, generator in pairs(generators) do
            local generatorCycle = generator:executeLoadCycle()
            cycleMetrics.totalActiveUsers = cycleMetrics.totalActiveUsers + generatorCycle.activeUsers
            cycleMetrics.totalRequestsThisCycle = cycleMetrics.totalRequestsThisCycle + generatorCycle.requestsThisCycle
        end
        
        -- Log progress every 10 cycles
        if cycleCount % 10 == 0 then
            print(string.format("Cycle %d: %d active users, %d requests", 
                  cycleCount, cycleMetrics.totalActiveUsers, cycleMetrics.totalRequestsThisCycle))
        end
        
        -- Simulate cycle interval (in real implementation would be proper timing)
    end
    
    -- Stop all generators and collect results
    local aggregatedResults = DistributedLoadGenerator.aggregateResults(generators, config)
    
    for _, generator in pairs(generators) do
        generator:stop()
    end
    
    print(string.format("Distributed load test completed: %s", config.testId))
    return aggregatedResults
end

-- Aggregate results from multiple generators
function DistributedLoadGenerator.aggregateResults(generators, config)
    local aggregated = {
        testId = config.testId,
        totalGenerators = #generators,
        summary = {
            totalRequests = 0,
            totalErrors = 0,
            totalUsers = 0,
            averageResponseTime = 0,
            maxThroughput = 0,
            testDuration = config.duration
        },
        generatorMetrics = {},
        systemWideMetrics = {}
    }
    
    local responseTimeSum = 0
    local responseTimeCount = 0
    local maxThroughput = 0
    
    for _, generator in pairs(generators) do
        local metrics = generator:getMetrics()
        aggregated.generatorMetrics[generator.id] = metrics
        
        aggregated.summary.totalRequests = aggregated.summary.totalRequests + metrics.totalRequests
        aggregated.summary.totalErrors = aggregated.summary.totalErrors + metrics.totalErrors
        aggregated.summary.totalUsers = aggregated.summary.totalUsers + metrics.totalUsers
        
        responseTimeSum = responseTimeSum + (metrics.averageResponseTime * metrics.totalRequests)
        responseTimeCount = responseTimeCount + metrics.totalRequests
        
        if metrics.currentThroughput > maxThroughput then
            maxThroughput = metrics.currentThroughput
        end
    end
    
    if responseTimeCount > 0 then
        aggregated.summary.averageResponseTime = responseTimeSum / responseTimeCount
    end
    
    aggregated.summary.errorRate = 0
    if aggregated.summary.totalRequests > 0 then
        aggregated.summary.errorRate = aggregated.summary.totalErrors / aggregated.summary.totalRequests
    end
    
    aggregated.summary.overallThroughput = aggregated.summary.totalRequests / config.duration
    aggregated.summary.maxThroughput = maxThroughput
    
    return aggregated
end

-- Get active generators
function DistributedLoadGenerator.getActiveGenerators()
    return DistributedLoadGenerator.generators
end

-- Stop all generators
function DistributedLoadGenerator.stopAllGenerators()
    for _, generator in pairs(DistributedLoadGenerator.generators) do
        generator:stop()
    end
    DistributedLoadGenerator.generators = {}
end

return DistributedLoadGenerator