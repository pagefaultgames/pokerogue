--[[
Automated Performance Benchmarker
Automated benchmarking system specifically focused on response times and throughput
--]]

local AutomatedPerformanceBenchmarker = {}

-- Dependencies  
local json = { encode = function(obj) return tostring(obj) end }

-- Automated benchmarking configuration
local automationConfig = {
    benchmarkSchedule = {
        continuous = { enabled = false, interval = 300 }, -- Every 5 minutes
        periodic = { enabled = true, interval = 3600 },   -- Every hour
        onDemand = { enabled = true }                     -- Manual triggering
    },
    responseTimeTargets = {
        battle = { target = 150, warning = 250, critical = 500 },      -- milliseconds
        pokemon = { target = 20, warning = 40, critical = 80 },         -- milliseconds
        shop = { target = 75, warning = 150, critical = 300 },          -- milliseconds
        security = { target = 30, warning = 60, critical = 120 }        -- milliseconds
    },
    throughputTargets = {
        battle = { minimum = 5, target = 10, excellent = 20 },          -- battles/second
        pokemon = { minimum = 50, target = 100, excellent = 200 },      -- operations/second  
        shop = { minimum = 10, target = 25, excellent = 50 },           -- transactions/second
        security = { minimum = 30, target = 60, excellent = 120 }       -- validations/second
    },
    loadTestPatterns = {
        steadyState = { duration = 120, rampUp = 30, rampDown = 30 },
        spike = { duration = 60, spikeMultiplier = 5, spikeDuration = 10 },
        gradual = { duration = 300, incrementInterval = 30, maxLoad = 10 },
        endurance = { duration = 1800, steadyLoad = 5 } -- 30 minutes
    }
}

-- Benchmark execution state
local benchmarkState = {
    isRunning = false,
    currentBenchmark = "",
    sessionHistory = {},
    realtimeMetrics = {
        responseTime = { current = 0, rolling = {} },
        throughput = { current = 0, rolling = {} },
        errorRate = { current = 0, rolling = {} }
    },
    alerts = {},
    trends = {}
}

function AutomatedPerformanceBenchmarker.initializeAutomatedBenchmarking(config)
    -- Update configuration
    if config then
        if config.responseTimeTargets then
            for operation, targets in pairs(config.responseTimeTargets) do
                automationConfig.responseTimeTargets[operation] = automationConfig.responseTimeTargets[operation] or {}
                for key, value in pairs(targets) do
                    automationConfig.responseTimeTargets[operation][key] = value
                end
            end
        end
        
        if config.throughputTargets then
            for operation, targets in pairs(config.throughputTargets) do
                automationConfig.throughputTargets[operation] = automationConfig.throughputTargets[operation] or {}
                for key, value in pairs(targets) do
                    automationConfig.throughputTargets[operation][key] = value
                end
            end
        end
        
        if config.schedule then
            for scheduleType, scheduleConfig in pairs(config.schedule) do
                if automationConfig.benchmarkSchedule[scheduleType] then
                    for key, value in pairs(scheduleConfig) do
                        automationConfig.benchmarkSchedule[scheduleType][key] = value
                    end
                end
            end
        end
    end
    
    -- Initialize state
    benchmarkState.isRunning = false
    benchmarkState.currentBenchmark = ""
    benchmarkState.sessionHistory = {}
    benchmarkState.realtimeMetrics = {
        responseTime = { current = 0, rolling = {} },
        throughput = { current = 0, rolling = {} },
        errorRate = { current = 0, rolling = {} }
    }
    benchmarkState.alerts = {}
    benchmarkState.trends = {}
    
    print("[AUTOMATED_BENCHMARK] Automated performance benchmarker initialized")
    
    return {
        success = true,
        configuration = automationConfig,
        scheduleEnabled = automationConfig.benchmarkSchedule.periodic.enabled
    }
end

function AutomatedPerformanceBenchmarker.startAutomatedBenchmarking(pattern, duration)
    if benchmarkState.isRunning then
        return {
            success = false,
            error = "Benchmarking already in progress"
        }
    end
    
    pattern = pattern or "steadyState"
    duration = duration or automationConfig.loadTestPatterns[pattern].duration
    
    benchmarkState.isRunning = true
    benchmarkState.currentBenchmark = "automated-" .. pattern .. "-" .. tostring(0)
    
    print("[AUTOMATED_BENCHMARK] Starting automated benchmarking: " .. pattern)
    
    local benchmarkConfig = automationConfig.loadTestPatterns[pattern]
    local results = AutomatedPerformanceBenchmarker.executeAutomatedPattern(pattern, benchmarkConfig, duration)
    
    benchmarkState.isRunning = false
    benchmarkState.currentBenchmark = ""
    
    -- Store results in session history
    table.insert(benchmarkState.sessionHistory, {
        sessionId = results.sessionId,
        pattern = pattern,
        timestamp = msg.Timestamp,
        duration = duration,
        results = results
    })
    
    -- Analyze results for alerts and trends
    AutomatedPerformanceBenchmarker.analyzeAutomatedResults(results)
    
    print("[AUTOMATED_BENCHMARK] Automated benchmarking completed: " .. pattern)
    
    return results
end

function AutomatedPerformanceBenchmarker.executeAutomatedPattern(pattern, config, totalDuration)
    local results = {
        sessionId = benchmarkState.currentBenchmark,
        pattern = pattern,
        startTime = 0,
        endTime = 0,
        totalDuration = totalDuration,
        phases = {},
        overallMetrics = {
            responseTime = { min = math.huge, max = 0, average = 0, samples = {} },
            throughput = { min = math.huge, max = 0, average = 0, samples = {} },
            errorRate = { average = 0, total = 0, samples = {} }
        },
        realTimeData = {},
        alerts = {}
    }
    
    if pattern == "steadyState" then
        results = AutomatedPerformanceBenchmarker.executeSteadyStatePattern(config, totalDuration)
    elseif pattern == "spike" then
        results = AutomatedPerformanceBenchmarker.executeSpikePattern(config, totalDuration)
    elseif pattern == "gradual" then
        results = AutomatedPerformanceBenchmarker.executeGradualPattern(config, totalDuration)
    elseif pattern == "endurance" then
        results = AutomatedPerformanceBenchmarker.executeEndurancePattern(config, totalDuration)
    end
    
    results.endTime = 0
    
    -- Calculate overall metrics from samples
    AutomatedPerformanceBenchmarker.calculateOverallMetrics(results)
    
    return results
end

function AutomatedPerformanceBenchmarker.executeSteadyStatePattern(config, duration)
    local results = {
        sessionId = benchmarkState.currentBenchmark,
        pattern = "steadyState",
        startTime = 0,
        phases = { "rampUp", "steadyState", "rampDown" },
        phaseResults = {},
        realTimeData = {},
        alerts = {}
    }
    
    print("[AUTOMATED_BENCHMARK] Executing steady state pattern")
    
    -- Ramp up phase
    print("[AUTOMATED_BENCHMARK] Phase: Ramp up")
    local rampUpResults = AutomatedPerformanceBenchmarker.executeLoadPhase("rampUp", {
        duration = config.rampUp,
        startLoad = 1,
        endLoad = 5,
        operations = {"battle", "pokemon", "shop"}
    })
    results.phaseResults.rampUp = rampUpResults
    
    -- Steady state phase
    print("[AUTOMATED_BENCHMARK] Phase: Steady state")
    local steadyResults = AutomatedPerformanceBenchmarker.executeLoadPhase("steadyState", {
        duration = config.duration,
        constantLoad = 5,
        operations = {"battle", "pokemon", "shop", "security"}
    })
    results.phaseResults.steadyState = steadyResults
    
    -- Ramp down phase
    print("[AUTOMATED_BENCHMARK] Phase: Ramp down")
    local rampDownResults = AutomatedPerformanceBenchmarker.executeLoadPhase("rampDown", {
        duration = config.rampDown,
        startLoad = 5,
        endLoad = 1,
        operations = {"battle", "pokemon"}
    })
    results.phaseResults.rampDown = rampDownResults
    
    -- Combine real-time data from all phases
    for _, phaseData in pairs(results.phaseResults) do
        for _, dataPoint in ipairs(phaseData.realTimeData or {}) do
            table.insert(results.realTimeData, dataPoint)
        end
    end
    
    return results
end

function AutomatedPerformanceBenchmarker.executeSpikePattern(config, duration)
    local results = {
        sessionId = benchmarkState.currentBenchmark,
        pattern = "spike",
        startTime = 0,
        phases = { "baseline", "spike", "recovery" },
        phaseResults = {},
        realTimeData = {},
        alerts = {}
    }
    
    print("[AUTOMATED_BENCHMARK] Executing spike pattern")
    
    -- Baseline phase
    local baselineResults = AutomatedPerformanceBenchmarker.executeLoadPhase("baseline", {
        duration = (duration - config.spikeDuration) / 2,
        constantLoad = 2,
        operations = {"battle", "pokemon", "shop"}
    })
    results.phaseResults.baseline = baselineResults
    
    -- Spike phase
    local spikeResults = AutomatedPerformanceBenchmarker.executeLoadPhase("spike", {
        duration = config.spikeDuration,
        constantLoad = 2 * config.spikeMultiplier,
        operations = {"battle", "pokemon", "shop", "security"}
    })
    results.phaseResults.spike = spikeResults
    
    -- Recovery phase
    local recoveryResults = AutomatedPerformanceBenchmarker.executeLoadPhase("recovery", {
        duration = (duration - config.spikeDuration) / 2,
        constantLoad = 2,
        operations = {"battle", "pokemon", "shop"}
    })
    results.phaseResults.recovery = recoveryResults
    
    -- Combine data
    for _, phaseData in pairs(results.phaseResults) do
        for _, dataPoint in ipairs(phaseData.realTimeData or {}) do
            table.insert(results.realTimeData, dataPoint)
        end
    end
    
    return results
end

function AutomatedPerformanceBenchmarker.executeGradualPattern(config, duration)
    local results = {
        sessionId = benchmarkState.currentBenchmark,
        pattern = "gradual",
        startTime = 0,
        phases = {},
        phaseResults = {},
        realTimeData = {},
        alerts = {}
    }
    
    print("[AUTOMATED_BENCHMARK] Executing gradual pattern")
    
    local currentLoad = 1
    local phaseIndex = 1
    local incrementInterval = config.incrementInterval
    local totalPhases = math.floor(duration / incrementInterval)
    
    for phase = 1, totalPhases do
        local phaseName = "increment_" .. phase
        table.insert(results.phases, phaseName)
        
        local phaseResults = AutomatedPerformanceBenchmarker.executeLoadPhase(phaseName, {
            duration = incrementInterval,
            constantLoad = currentLoad,
            operations = {"battle", "pokemon", "shop"}
        })
        
        results.phaseResults[phaseName] = phaseResults
        
        -- Add to real-time data
        for _, dataPoint in ipairs(phaseResults.realTimeData or {}) do
            table.insert(results.realTimeData, dataPoint)
        end
        
        currentLoad = math.min(currentLoad + 1, config.maxLoad)
        phaseIndex = phaseIndex + 1
    end
    
    return results
end

function AutomatedPerformanceBenchmarker.executeEndurancePattern(config, duration)
    local results = {
        sessionId = benchmarkState.currentBenchmark,
        pattern = "endurance",
        startTime = 0,
        phases = { "endurance" },
        phaseResults = {},
        realTimeData = {},
        alerts = {}
    }
    
    print("[AUTOMATED_BENCHMARK] Executing endurance pattern")
    
    local enduranceResults = AutomatedPerformanceBenchmarker.executeLoadPhase("endurance", {
        duration = duration,
        constantLoad = config.steadyLoad,
        operations = {"battle", "pokemon", "shop", "security"},
        collectIntervals = 60 -- Collect metrics every minute
    })
    
    results.phaseResults.endurance = enduranceResults
    results.realTimeData = enduranceResults.realTimeData or {}
    
    return results
end

function AutomatedPerformanceBenchmarker.executeLoadPhase(phaseName, config)
    local phaseResult = {
        phaseName = phaseName,
        startTime = 0,
        endTime = 0,
        duration = config.duration,
        load = config.constantLoad or config.startLoad or 1,
        operationResults = {},
        realTimeData = {},
        metrics = {
            responseTime = { average = 0, min = math.huge, max = 0 },
            throughput = { average = 0, total = 0 },
            errorRate = { average = 0, total = 0 }
        }
    }
    
    local samplingInterval = 5 -- Sample every 5 seconds
    local samples = math.floor(config.duration / samplingInterval)
    
    for sample = 1, samples do
        local sampleStartTime = os.clock()
        
        -- Execute operations for this sample
        for _, operation in ipairs(config.operations) do
            local opResult = AutomatedPerformanceBenchmarker.simulateOperation(operation, phaseResult.load)
            
            if not phaseResult.operationResults[operation] then
                phaseResult.operationResults[operation] = {
                    count = 0,
                    totalResponseTime = 0,
                    totalThroughput = 0,
                    errors = 0
                }
            end
            
            local opData = phaseResult.operationResults[operation]
            opData.count = opData.count + 1
            opData.totalResponseTime = opData.totalResponseTime + opResult.responseTime
            opData.totalThroughput = opData.totalThroughput + opResult.throughput
            if not opResult.success then
                opData.errors = opData.errors + 1
            end
        end
        
        -- Collect real-time data point
        local sampleDuration = os.clock() - sampleStartTime
        local timestamp = 0 + (sample * samplingInterval)
        
        table.insert(phaseResult.realTimeData, {
            timestamp = timestamp,
            sample = sample,
            phase = phaseName,
            load = phaseResult.load,
            responseTime = AutomatedPerformanceBenchmarker.calculateCurrentResponseTime(phaseResult.operationResults),
            throughput = AutomatedPerformanceBenchmarker.calculateCurrentThroughput(phaseResult.operationResults),
            errorRate = AutomatedPerformanceBenchmarker.calculateCurrentErrorRate(phaseResult.operationResults),
            sampleDuration = sampleDuration
        })
        
        -- Update real-time metrics
        AutomatedPerformanceBenchmarker.updateRealtimeMetrics(phaseResult.realTimeData[#phaseResult.realTimeData])
        
        -- Increment load if gradual pattern
        if config.startLoad and config.endLoad then
            local loadIncrement = (config.endLoad - config.startLoad) / samples
            phaseResult.load = config.startLoad + (sample * loadIncrement)
        end
    end
    
    phaseResult.endTime = 0
    
    -- Calculate phase metrics
    AutomatedPerformanceBenchmarker.calculatePhaseMetrics(phaseResult)
    
    return phaseResult
end

function AutomatedPerformanceBenchmarker.simulateOperation(operation, load)
    local baseResponse = automationConfig.responseTimeTargets[operation].target
    local baseThroughput = automationConfig.throughputTargets[operation].target
    
    -- Simulate load impact
    local loadMultiplier = 1 + (load - 1) * 0.1 -- 10% increase per load unit
    local responseTime = baseResponse * loadMultiplier + math.random(-10, 20)
    local throughput = baseThroughput / loadMultiplier + math.random(-2, 3)
    
    -- Simulate occasional errors (0.5% base rate, increases with load)
    local errorRate = 0.005 + (load - 1) * 0.001
    local success = math.random() > errorRate
    
    return {
        operation = operation,
        responseTime = math.max(1, responseTime),
        throughput = math.max(0.1, throughput),
        success = success,
        load = load
    }
end

function AutomatedPerformanceBenchmarker.calculateCurrentResponseTime(operationResults)
    local totalTime = 0
    local totalCount = 0
    
    for _, opData in pairs(operationResults) do
        totalTime = totalTime + opData.totalResponseTime
        totalCount = totalCount + opData.count
    end
    
    return totalCount > 0 and (totalTime / totalCount) or 0
end

function AutomatedPerformanceBenchmarker.calculateCurrentThroughput(operationResults)
    local totalThroughput = 0
    
    for _, opData in pairs(operationResults) do
        totalThroughput = totalThroughput + opData.totalThroughput
    end
    
    return totalThroughput
end

function AutomatedPerformanceBenchmarker.calculateCurrentErrorRate(operationResults)
    local totalErrors = 0
    local totalOperations = 0
    
    for _, opData in pairs(operationResults) do
        totalErrors = totalErrors + opData.errors
        totalOperations = totalOperations + opData.count
    end
    
    return totalOperations > 0 and ((totalErrors / totalOperations) * 100) or 0
end

function AutomatedPerformanceBenchmarker.updateRealtimeMetrics(dataPoint)
    -- Update rolling metrics (keep last 60 samples)
    local rollingSize = 60
    
    table.insert(benchmarkState.realtimeMetrics.responseTime.rolling, dataPoint.responseTime)
    table.insert(benchmarkState.realtimeMetrics.throughput.rolling, dataPoint.throughput)
    table.insert(benchmarkState.realtimeMetrics.errorRate.rolling, dataPoint.errorRate)
    
    -- Trim to rolling window size
    while #benchmarkState.realtimeMetrics.responseTime.rolling > rollingSize do
        table.remove(benchmarkState.realtimeMetrics.responseTime.rolling, 1)
    end
    while #benchmarkState.realtimeMetrics.throughput.rolling > rollingSize do
        table.remove(benchmarkState.realtimeMetrics.throughput.rolling, 1)
    end
    while #benchmarkState.realtimeMetrics.errorRate.rolling > rollingSize do
        table.remove(benchmarkState.realtimeMetrics.errorRate.rolling, 1)
    end
    
    -- Update current values
    benchmarkState.realtimeMetrics.responseTime.current = dataPoint.responseTime
    benchmarkState.realtimeMetrics.throughput.current = dataPoint.throughput
    benchmarkState.realtimeMetrics.errorRate.current = dataPoint.errorRate
end

function AutomatedPerformanceBenchmarker.calculatePhaseMetrics(phaseResult)
    -- Calculate aggregated metrics from real-time data
    local totalResponseTime = 0
    local totalThroughput = 0
    local totalErrorRate = 0
    local count = #phaseResult.realTimeData
    
    if count == 0 then
        return
    end
    
    local minResponseTime = math.huge
    local maxResponseTime = 0
    
    for _, dataPoint in ipairs(phaseResult.realTimeData) do
        totalResponseTime = totalResponseTime + dataPoint.responseTime
        totalThroughput = totalThroughput + dataPoint.throughput
        totalErrorRate = totalErrorRate + dataPoint.errorRate
        
        minResponseTime = math.min(minResponseTime, dataPoint.responseTime)
        maxResponseTime = math.max(maxResponseTime, dataPoint.responseTime)
    end
    
    phaseResult.metrics = {
        responseTime = {
            average = totalResponseTime / count,
            min = minResponseTime,
            max = maxResponseTime
        },
        throughput = {
            average = totalThroughput / count,
            total = totalThroughput
        },
        errorRate = {
            average = totalErrorRate / count,
            total = totalErrorRate
        }
    }
end

function AutomatedPerformanceBenchmarker.calculateOverallMetrics(results)
    if not results.realTimeData or #results.realTimeData == 0 then
        return
    end
    
    local responseTimeSamples = {}
    local throughputSamples = {}
    local errorRateSamples = {}
    
    for _, dataPoint in ipairs(results.realTimeData) do
        table.insert(responseTimeSamples, dataPoint.responseTime)
        table.insert(throughputSamples, dataPoint.throughput)
        table.insert(errorRateSamples, dataPoint.errorRate)
    end
    
    -- Calculate response time metrics
    table.sort(responseTimeSamples)
    results.overallMetrics.responseTime = {
        min = responseTimeSamples[1],
        max = responseTimeSamples[#responseTimeSamples],
        average = AutomatedPerformanceBenchmarker.calculateAverage(responseTimeSamples),
        p95 = responseTimeSamples[math.ceil(#responseTimeSamples * 0.95)],
        p99 = responseTimeSamples[math.ceil(#responseTimeSamples * 0.99)],
        samples = responseTimeSamples
    }
    
    -- Calculate throughput metrics
    table.sort(throughputSamples)
    results.overallMetrics.throughput = {
        min = throughputSamples[1],
        max = throughputSamples[#throughputSamples],
        average = AutomatedPerformanceBenchmarker.calculateAverage(throughputSamples),
        total = AutomatedPerformanceBenchmarker.calculateSum(throughputSamples),
        samples = throughputSamples
    }
    
    -- Calculate error rate metrics
    results.overallMetrics.errorRate = {
        average = AutomatedPerformanceBenchmarker.calculateAverage(errorRateSamples),
        max = math.max(table.unpack(errorRateSamples)),
        total = AutomatedPerformanceBenchmarker.calculateSum(errorRateSamples),
        samples = errorRateSamples
    }
end

function AutomatedPerformanceBenchmarker.calculateAverage(samples)
    if #samples == 0 then return 0 end
    local sum = 0
    for _, sample in ipairs(samples) do
        sum = sum + sample
    end
    return sum / #samples
end

function AutomatedPerformanceBenchmarker.calculateSum(samples)
    local sum = 0
    for _, sample in ipairs(samples) do
        sum = sum + sample
    end
    return sum
end

function AutomatedPerformanceBenchmarker.analyzeAutomatedResults(results)
    -- Check against performance targets
    for operation, targets in pairs(automationConfig.responseTimeTargets) do
        if results.overallMetrics.responseTime.average > targets.critical then
            table.insert(benchmarkState.alerts, {
                type = "RESPONSE_TIME_CRITICAL",
                operation = operation,
                actual = results.overallMetrics.responseTime.average,
                threshold = targets.critical,
                severity = "CRITICAL"
            })
        elseif results.overallMetrics.responseTime.average > targets.warning then
            table.insert(benchmarkState.alerts, {
                type = "RESPONSE_TIME_WARNING",
                operation = operation,
                actual = results.overallMetrics.responseTime.average,
                threshold = targets.warning,
                severity = "WARNING"
            })
        end
    end
    
    -- Check throughput targets
    for operation, targets in pairs(automationConfig.throughputTargets) do
        if results.overallMetrics.throughput.average < targets.minimum then
            table.insert(benchmarkState.alerts, {
                type = "THROUGHPUT_BELOW_MINIMUM",
                operation = operation,
                actual = results.overallMetrics.throughput.average,
                threshold = targets.minimum,
                severity = "CRITICAL"
            })
        end
    end
    
    -- Analyze trends if we have historical data
    if #benchmarkState.sessionHistory > 1 then
        AutomatedPerformanceBenchmarker.analyzeTrends()
    end
end

function AutomatedPerformanceBenchmarker.analyzeTrends()
    if #benchmarkState.sessionHistory < 2 then
        return
    end
    
    local current = benchmarkState.sessionHistory[#benchmarkState.sessionHistory]
    local previous = benchmarkState.sessionHistory[#benchmarkState.sessionHistory - 1]
    
    local currentRT = current.results.overallMetrics.responseTime.average
    local previousRT = previous.results.overallMetrics.responseTime.average
    
    if currentRT > 0 and previousRT > 0 then
        local rtChange = ((currentRT - previousRT) / previousRT) * 100
        
        if math.abs(rtChange) > 20 then
            table.insert(benchmarkState.trends, {
                type = "RESPONSE_TIME_TREND",
                direction = rtChange > 0 and "INCREASING" or "DECREASING",
                percentChange = rtChange,
                significance = math.abs(rtChange) > 50 and "SIGNIFICANT" or "MODERATE"
            })
        end
    end
end

function AutomatedPerformanceBenchmarker.getRealtimeMetrics()
    return benchmarkState.realtimeMetrics
end

function AutomatedPerformanceBenchmarker.getBenchmarkStatus()
    return {
        isRunning = benchmarkState.isRunning,
        currentBenchmark = benchmarkState.currentBenchmark,
        activeAlerts = #benchmarkState.alerts,
        sessionCount = #benchmarkState.sessionHistory,
        realtimeMetrics = benchmarkState.realtimeMetrics
    }
end

function AutomatedPerformanceBenchmarker.generateAutomatedReport()
    return {
        reportTimestamp = 0,
        systemStatus = AutomatedPerformanceBenchmarker.getBenchmarkStatus(),
        recentSessions = benchmarkState.sessionHistory,
        activeAlerts = benchmarkState.alerts,
        trends = benchmarkState.trends,
        configuration = automationConfig
    }
end

return AutomatedPerformanceBenchmarker