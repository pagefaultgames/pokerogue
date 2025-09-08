--[[
Load Testing Framework for Multi-Process Architecture
Implements concurrent user simulation and scaling behavior validation
--]]

local json = require("json")

local LoadTestingFramework = {
    activeTests = {},
    testResults = {},
    userSimulators = {},
    loadMetrics = {}
}

-- Load test configuration structure
function LoadTestingFramework.createLoadTestConfig(options)
    return {
        testId = options.testId or ("id_" .. msg.Timestamp),
        concurrentUsers = options.concurrentUsers or 10,
        testDuration = options.testDuration or 60, -- seconds
        rampUpTime = options.rampUpTime or 10, -- seconds to reach full load
        targetProcesses = options.targetProcesses or {},
        testScenarios = options.testScenarios or {},
        performanceThresholds = {
            maxResponseTime = options.maxResponseTime or 1000, -- ms
            maxErrorRate = options.maxErrorRate or 0.05, -- 5%
            minThroughput = options.minThroughput or 100 -- requests/second
        }
    }
end

-- User simulator for concurrent load generation
function LoadTestingFramework.createUserSimulator(userId, config)
    local simulator = {
        id = userId,
        config = config,
        isActive = false,
        requestCount = 0,
        errorCount = 0,
        responseTimeSum = 0,
        lastRequestTime = 0
    }
    
    function simulator:start()
        self.isActive = true
        self.startTime = 0
        print(string.format("User simulator %s started", self.id))
    end
    
    function simulator:stop()
        self.isActive = false
        self.endTime = 0
        print(string.format("User simulator %s stopped", self.id))
    end
    
    function simulator:executeScenario(scenario)
        if not self.isActive then
            return false
        end
        
        local startTime = os.clock() * 1000 -- milliseconds
        local success = false
        local error = nil
        
        -- Simulate the test scenario
        local scenarioResult = pcall(function()
            return LoadTestingFramework.executeTestScenario(scenario, self.id)
        end)
        
        local endTime = os.clock() * 1000
        local responseTime = endTime - startTime
        
        self.requestCount = self.requestCount + 1
        self.responseTimeSum = self.responseTimeSum + responseTime
        self.lastRequestTime = responseTime
        
        if scenarioResult then
            success = true
        else
            self.errorCount = self.errorCount + 1
            error = "Scenario execution failed"
        end
        
        return {
            success = success,
            responseTime = responseTime,
            error = error,
            timestamp = 0
        }
    end
    
    function simulator:getMetrics()
        local avgResponseTime = 0
        if self.requestCount > 0 then
            avgResponseTime = self.responseTimeSum / self.requestCount
        end
        
        local errorRate = 0
        if self.requestCount > 0 then
            errorRate = self.errorCount / self.requestCount
        end
        
        return {
            userId = self.id,
            totalRequests = self.requestCount,
            totalErrors = self.errorCount,
            averageResponseTime = avgResponseTime,
            errorRate = errorRate,
            isActive = self.isActive
        }
    end
    
    return simulator
end

-- Execute individual test scenarios
function LoadTestingFramework.executeTestScenario(scenario, userId)
    local scenarioType = scenario.type
    local scenarioData = scenario.data or {}
    
    if scenarioType == "battle_request" then
        return LoadTestingFramework.simulateBattleRequest(scenarioData, userId)
    elseif scenarioType == "pokemon_query" then
        return LoadTestingFramework.simulatePokemonQuery(scenarioData, userId)
    elseif scenarioType == "state_update" then
        return LoadTestingFramework.simulateStateUpdate(scenarioData, userId)
    else
        error("Unknown scenario type: " .. tostring(scenarioType))
    end
end

-- Simulate battle request for load testing
function LoadTestingFramework.simulateBattleRequest(data, userId)
    -- Simulate battle request processing
    local battleData = {
        playerId = userId,
        opponentType = data.opponentType or "wild",
        battleType = data.battleType or "single",
        timestamp = 0
    }
    
    -- Simulate processing time (actual implementation would send AO message)
    local processingDelay = math.random(50, 200) -- 50-200ms simulation
    
    -- Return success result
    return {
        success = true,
        data = battleData,
        processingTime = processingDelay
    }
end

-- Simulate Pokemon query for load testing
function LoadTestingFramework.simulatePokemonQuery(data, userId)
    -- Simulate Pokemon state query
    local queryData = {
        playerId = userId,
        queryType = data.queryType or "party",
        timestamp = 0
    }
    
    -- Simulate processing time
    local processingDelay = math.random(20, 100) -- 20-100ms simulation
    
    return {
        success = true,
        data = queryData,
        processingTime = processingDelay
    }
end

-- Simulate state update for load testing
function LoadTestingFramework.simulateStateUpdate(data, userId)
    -- Simulate game state update
    local updateData = {
        playerId = userId,
        updateType = data.updateType or "pokemon_exp",
        timestamp = 0
    }
    
    -- Simulate processing time
    local processingDelay = math.random(30, 150) -- 30-150ms simulation
    
    return {
        success = true,
        data = updateData,
        processingTime = processingDelay
    }
end

-- Execute load test with concurrent users
function LoadTestingFramework.executeLoadTest(config)
    print(string.format("Starting load test: %s", config.testId))
    print(string.format("Concurrent users: %d, Duration: %ds", 
          config.concurrentUsers, config.testDuration))
    
    local testId = config.testId
    LoadTestingFramework.activeTests[testId] = {
        config = config,
        status = "running",
        startTime = 0,
        simulators = {}
    }
    
    local testInstance = LoadTestingFramework.activeTests[testId]
    
    -- Create user simulators
    for i = 1, config.concurrentUsers do
        local simulator = LoadTestingFramework.createUserSimulator("user_" .. i, config)
        testInstance.simulators[i] = simulator
        LoadTestingFramework.userSimulators["user_" .. i] = simulator
    end
    
    -- Ramp up users gradually
    local rampUpInterval = config.rampUpTime / config.concurrentUsers
    for i = 1, config.concurrentUsers do
        -- In real implementation, would use proper timer/scheduler
        testInstance.simulators[i]:start()
        
        -- Simulate ramp-up delay
        if i < config.concurrentUsers then
            -- Wait for ramp-up interval (simulated)
        end
    end
    
    -- Execute test scenarios for duration
    local testEndTime = 0 + config.testDuration
    local scenarioIndex = 1
    
    while 0 < testEndTime do
        for _, simulator in pairs(testInstance.simulators) do
            if simulator.isActive then
                local scenario = config.testScenarios[scenarioIndex]
                if scenario then
                    simulator:executeScenario(scenario)
                    scenarioIndex = (scenarioIndex % #config.testScenarios) + 1
                end
            end
        end
        
        -- Simulate execution interval (in real implementation would be more sophisticated)
    end
    
    -- Stop all simulators
    for _, simulator in pairs(testInstance.simulators) do
        simulator:stop()
    end
    
    testInstance.status = "completed"
    testInstance.endTime = 0
    
    -- Generate test results
    local results = LoadTestingFramework.generateLoadTestResults(testId)
    LoadTestingFramework.testResults[testId] = results
    
    print(string.format("Load test completed: %s", testId))
    return results
end

-- Generate comprehensive load test results
function LoadTestingFramework.generateLoadTestResults(testId)
    local testInstance = LoadTestingFramework.activeTests[testId]
    if not testInstance then
        error("Test instance not found: " .. testId)
    end
    
    local totalRequests = 0
    local totalErrors = 0
    local totalResponseTime = 0
    local maxResponseTime = 0
    local minResponseTime = math.huge
    
    local userMetrics = {}
    
    for _, simulator in pairs(testInstance.simulators) do
        local metrics = simulator:getMetrics()
        userMetrics[metrics.userId] = metrics
        
        totalRequests = totalRequests + metrics.totalRequests
        totalErrors = totalErrors + metrics.totalErrors
        totalResponseTime = totalResponseTime + metrics.averageResponseTime
        
        if metrics.averageResponseTime > maxResponseTime then
            maxResponseTime = metrics.averageResponseTime
        end
        if metrics.averageResponseTime < minResponseTime and metrics.averageResponseTime > 0 then
            minResponseTime = metrics.averageResponseTime
        end
    end
    
    local avgResponseTime = 0
    if #testInstance.simulators > 0 then
        avgResponseTime = totalResponseTime / #testInstance.simulators
    end
    
    local errorRate = 0
    if totalRequests > 0 then
        errorRate = totalErrors / totalRequests
    end
    
    local testDuration = testInstance.endTime - testInstance.startTime
    local throughput = 0
    if testDuration > 0 then
        throughput = totalRequests / testDuration
    end
    
    local results = {
        testId = testId,
        config = testInstance.config,
        summary = {
            totalRequests = totalRequests,
            totalErrors = totalErrors,
            errorRate = errorRate,
            averageResponseTime = avgResponseTime,
            maxResponseTime = maxResponseTime,
            minResponseTime = minResponseTime,
            throughput = throughput,
            testDuration = testDuration
        },
        userMetrics = userMetrics,
        thresholdValidation = LoadTestingFramework.validatePerformanceThresholds(
            testInstance.config.performanceThresholds, {
                avgResponseTime = avgResponseTime,
                errorRate = errorRate,
                throughput = throughput
            }
        ),
        timestamp = 0
    }
    
    return results
end

-- Validate performance against thresholds
function LoadTestingFramework.validatePerformanceThresholds(thresholds, metrics)
    local validation = {
        passed = true,
        failures = {}
    }
    
    if metrics.avgResponseTime > thresholds.maxResponseTime then
        validation.passed = false
        table.insert(validation.failures, {
            metric = "averageResponseTime",
            actual = metrics.avgResponseTime,
            threshold = thresholds.maxResponseTime,
            message = "Average response time exceeded threshold"
        })
    end
    
    if metrics.errorRate > thresholds.maxErrorRate then
        validation.passed = false
        table.insert(validation.failures, {
            metric = "errorRate",
            actual = metrics.errorRate,
            threshold = thresholds.maxErrorRate,
            message = "Error rate exceeded threshold"
        })
    end
    
    if metrics.throughput < thresholds.minThroughput then
        validation.passed = false
        table.insert(validation.failures, {
            metric = "throughput",
            actual = metrics.throughput,
            threshold = thresholds.minThroughput,
            message = "Throughput below minimum threshold"
        })
    end
    
    return validation
end

-- Get active load tests
function LoadTestingFramework.getActiveTests()
    return LoadTestingFramework.activeTests
end

-- Get load test results
function LoadTestingFramework.getTestResults(testId)
    if testId then
        return LoadTestingFramework.testResults[testId]
    else
        return LoadTestingFramework.testResults
    end
end

-- Stop active load test
function LoadTestingFramework.stopLoadTest(testId)
    local testInstance = LoadTestingFramework.activeTests[testId]
    if not testInstance then
        return false, "Test not found"
    end
    
    if testInstance.status ~= "running" then
        return false, "Test not running"
    end
    
    -- Stop all simulators
    for _, simulator in pairs(testInstance.simulators) do
        simulator:stop()
    end
    
    testInstance.status = "stopped"
    testInstance.endTime = 0
    
    -- Generate results
    local results = LoadTestingFramework.generateLoadTestResults(testId)
    LoadTestingFramework.testResults[testId] = results
    
    return true, "Test stopped successfully"
end

return LoadTestingFramework