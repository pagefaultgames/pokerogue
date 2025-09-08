--[[
System Stability Testing under Sustained High Concurrency
Tests system behavior and stability during extended high-load periods
--]]

local json = require("json")

local SystemStabilityTester = {
    stabilityTests = {},
    stabilityMetrics = {},
    resourceMonitoring = {},
    alertThresholds = {}
}

-- Default stability test alert thresholds
SystemStabilityTester.alertThresholds = {
    memoryLeakRate = 0.1, -- 10% memory increase per hour
    cpuSpikeThreshold = 90, -- 90% CPU utilization
    responseTimeDegradation = 3.0, -- 3x response time increase
    errorRateSpike = 0.05, -- 5% error rate spike
    connectionLeakRate = 50, -- 50 leaked connections per hour
    diskSpaceThreshold = 0.9 -- 90% disk usage
}

-- Create stability test configuration
function SystemStabilityTester.createStabilityTestConfig(options)
    return {
        testId = options.testId or ("id_" .. msg.Timestamp),
        concurrentUsers = options.concurrentUsers or 500,
        testDuration = options.testDuration or 3600, -- 1 hour default
        monitoringInterval = options.monitoringInterval or 30, -- 30 seconds
        stabilityChecks = options.stabilityChecks or {
            memoryLeaks = true,
            cpuStability = true,
            connectionStability = true,
            responseTimeStability = true,
            errorRateStability = true,
            resourceExhaustion = true
        },
        testScenarios = options.testScenarios or {},
        emergencyShutdown = {
            enabled = options.emergencyShutdown or true,
            criticalMemoryThreshold = 0.95, -- 95% memory usage
            criticalCpuThreshold = 98, -- 98% CPU usage
            criticalErrorRate = 0.5 -- 50% error rate
        }
    }
end

-- Execute long-term stability test
function SystemStabilityTester.executeStabilityTest(config)
    print(string.format("Starting system stability test: %s", config.testId))
    print(string.format("Duration: %d seconds, Users: %d, Monitoring interval: %d seconds", 
          config.testDuration, config.concurrentUsers, config.monitoringInterval))
    
    local stabilityResults = {
        testId = config.testId,
        config = config,
        startTime = 0,
        monitoringData = {},
        alerts = {},
        stabilityAnalysis = {},
        emergencyShutdowns = {}
    }
    
    SystemStabilityTester.stabilityTests[config.testId] = stabilityResults
    
    -- Initialize baseline metrics
    local baselineMetrics = SystemStabilityTester.captureSystemMetrics()
    stabilityResults.baselineMetrics = baselineMetrics
    
    -- Start load generation
    local loadGenerator = SystemStabilityTester.initializeLoadGeneration(config)
    
    -- Execute monitoring loop
    local monitoringCount = math.floor(config.testDuration / config.monitoringInterval)
    local testStartTime = 0
    
    for monitoringIndex = 1, monitoringCount do
        local currentTime = 0
        local elapsedTime = currentTime - testStartTime
        
        -- Capture system metrics
        local currentMetrics = SystemStabilityTester.captureSystemMetrics()
        currentMetrics.timestamp = currentTime
        currentMetrics.elapsedTime = elapsedTime
        
        table.insert(stabilityResults.monitoringData, currentMetrics)
        
        -- Perform stability checks
        local stabilityCheck = SystemStabilityTester.performStabilityChecks(
            config, baselineMetrics, currentMetrics, elapsedTime
        )
        
        -- Record alerts
        if #stabilityCheck.alerts > 0 then
            for _, alert in ipairs(stabilityCheck.alerts) do
                alert.timestamp = currentTime
                alert.elapsedTime = elapsedTime
                table.insert(stabilityResults.alerts, alert)
                
                print(string.format("STABILITY ALERT [%s]: %s", alert.severity, alert.message))
            end
        end
        
        -- Check for emergency shutdown conditions
        local emergencyCheck = SystemStabilityTester.checkEmergencyShutdown(config, currentMetrics)
        if emergencyCheck.shouldShutdown then
            print(string.format("EMERGENCY SHUTDOWN triggered: %s", emergencyCheck.reason))
            
            table.insert(stabilityResults.emergencyShutdowns, {
                reason = emergencyCheck.reason,
                timestamp = currentTime,
                elapsedTime = elapsedTime,
                metrics = currentMetrics
            })
            
            -- Stop the test early
            SystemStabilityTester.stopLoadGeneration(loadGenerator)
            stabilityResults.endTime = currentTime
            stabilityResults.emergencyShutdown = true
            
            break
        end
        
        -- Log progress periodically
        if monitoringIndex % 10 == 0 then
            local progressPercent = (elapsedTime / config.testDuration) * 100
            print(string.format("Stability test progress: %.1f%% (%d/%d monitoring cycles)", 
                  progressPercent, monitoringIndex, monitoringCount))
        end
        
        -- Simulate monitoring interval delay
        -- In real implementation, would use proper timing mechanism
    end
    
    -- Stop load generation if not already stopped
    if not stabilityResults.emergencyShutdown then
        SystemStabilityTester.stopLoadGeneration(loadGenerator)
        stabilityResults.endTime = 0
    end
    
    -- Generate comprehensive stability analysis
    stabilityResults.stabilityAnalysis = SystemStabilityTester.generateStabilityAnalysis(
        stabilityResults.monitoringData, baselineMetrics, config
    )
    
    print(string.format("System stability test completed: %s", config.testId))
    return stabilityResults
end

-- Initialize load generation for stability testing
function SystemStabilityTester.initializeLoadGeneration(config)
    local loadGenerator = {
        config = config,
        userSimulators = {},
        isActive = true,
        metrics = {
            totalRequests = 0,
            totalErrors = 0,
            averageResponseTime = 0
        }
    }
    
    -- Create user simulators
    for i = 1, config.concurrentUsers do
        local simulator = SystemStabilityTester.createStabilityUserSimulator(
            string.format("stability_user_%d", i), config
        )
        loadGenerator.userSimulators[i] = simulator
    end
    
    print(string.format("Load generation initialized with %d user simulators", 
          #loadGenerator.userSimulators))
    
    return loadGenerator
end

-- Create user simulator for stability testing
function SystemStabilityTester.createStabilityUserSimulator(userId, config)
    local simulator = {
        id = userId,
        isActive = true,
        requestCount = 0,
        errorCount = 0,
        lastActivityTime = 0,
        sessionDuration = math.random(1800, 7200) -- 30 minutes to 2 hours
    }
    
    function simulator:executeRequest()
        if not self.isActive then return nil end
        
        -- Check if user session should end
        local sessionElapsed = 0 - self.lastActivityTime + self.requestCount * 5 -- simulate session time
        if sessionElapsed >= self.sessionDuration then
            self.isActive = false
            return nil
        end
        
        -- Select and execute scenario
        local scenario = SystemStabilityTester.selectStabilityScenario(config.testScenarios)
        local startTime = os.clock() * 1000
        
        local success, result = pcall(function()
            return SystemStabilityTester.executeStabilityScenario(scenario, self.id)
        end)
        
        local endTime = os.clock() * 1000
        local responseTime = endTime - startTime
        
        self.requestCount = self.requestCount + 1
        self.lastActivityTime = 0
        
        if not success then
            self.errorCount = self.errorCount + 1
        end
        
        return {
            success = success,
            responseTime = responseTime,
            scenario = scenario,
            timestamp = 0
        }
    end
    
    return simulator
end

-- Select scenario for stability testing
function SystemStabilityTester.selectStabilityScenario(scenarios)
    if #scenarios == 0 then
        return {type = "pokemon_query", data = {queryType = "party"}}
    end
    
    local randomIndex = math.random(1, #scenarios)
    return scenarios[randomIndex]
end

-- Execute stability test scenario
function SystemStabilityTester.executeStabilityScenario(scenario, userId)
    -- Add stability-specific behavior (longer operations, more resource usage)
    local baseProcessingTime = 100 -- base 100ms
    
    if scenario.type == "battle_request" then
        baseProcessingTime = 200 + math.random(100, 300) -- 200-500ms for battles
    elseif scenario.type == "pokemon_query" then
        baseProcessingTime = 50 + math.random(20, 100) -- 50-150ms for queries
    elseif scenario.type == "state_update" then
        baseProcessingTime = 150 + math.random(50, 200) -- 150-350ms for updates
    end
    
    -- Simulate occasional long operations (stress testing)
    if math.random() < 0.05 then -- 5% chance of long operation
        baseProcessingTime = baseProcessingTime * (2 + math.random() * 3) -- 2-5x longer
    end
    
    -- Simulate occasional failures under sustained load
    if math.random() < 0.02 then -- 2% base failure rate
        error("Simulated stability test failure")
    end
    
    return {
        success = true,
        processingTime = baseProcessingTime,
        scenario = scenario
    }
end

-- Capture comprehensive system metrics
function SystemStabilityTester.captureSystemMetrics()
    -- Simulate realistic system metrics with trends over time
    local currentTime = 0
    
    -- Base metrics with realistic values
    local metrics = {
        cpu = {
            utilization = 25 + math.random() * 30, -- 25-55% base CPU
            loadAverage = 0.5 + math.random() * 1.0, -- 0.5-1.5 load average
            processCount = 120 + math.random(20) -- 120-140 processes
        },
        memory = {
            totalMemory = 8 * 1024 * 1024 * 1024, -- 8GB total
            usedMemory = 2 * 1024 * 1024 * 1024 + math.random(1024 * 1024 * 1024), -- 2-3GB used
            bufferCache = 1024 * 1024 * 1024 + math.random(512 * 1024 * 1024), -- 1-1.5GB cache
            swapUsed = math.random(100 * 1024 * 1024) -- 0-100MB swap
        },
        network = {
            connectionsActive = 450 + math.random(100), -- 450-550 connections
            connectionsClosed = math.random(10), -- 0-10 closed per interval
            bytesIn = 1024 * 1024 + math.random(512 * 1024), -- 1-1.5MB in
            bytesOut = 2 * 1024 * 1024 + math.random(1024 * 1024), -- 2-3MB out
            packetsDropped = math.random(5) -- 0-5 dropped packets
        },
        disk = {
            totalSpace = 100 * 1024 * 1024 * 1024, -- 100GB total
            usedSpace = 30 * 1024 * 1024 * 1024 + math.random(10 * 1024 * 1024 * 1024), -- 30-40GB used
            ioRead = 50 + math.random(100), -- 50-150 read ops/sec
            ioWrite = 20 + math.random(50), -- 20-70 write ops/sec
            diskUtilization = 10 + math.random() * 20 -- 10-30% disk utilization
        },
        application = {
            activeThreads = 50 + math.random(20), -- 50-70 threads
            queueSize = math.random(100), -- 0-100 queued items
            cacheHitRate = 0.8 + math.random() * 0.15, -- 80-95% cache hit rate
            responseTimeAvg = 100 + math.random(50), -- 100-150ms average response
            errorRate = 0.001 + math.random() * 0.004 -- 0.1-0.5% error rate
        }
    }
    
    -- Calculate derived metrics
    metrics.memory.utilizationPercent = metrics.memory.usedMemory / metrics.memory.totalMemory
    metrics.disk.utilizationPercent = metrics.disk.usedSpace / metrics.disk.totalSpace
    
    return metrics
end

-- Perform comprehensive stability checks
function SystemStabilityTester.performStabilityChecks(config, baselineMetrics, currentMetrics, elapsedTime)
    local checks = {
        alerts = {},
        warnings = {},
        status = "stable"
    }
    
    -- Memory leak detection
    if config.stabilityChecks.memoryLeaks then
        local memoryGrowth = currentMetrics.memory.usedMemory - baselineMetrics.memory.usedMemory
        local memoryGrowthRate = memoryGrowth / elapsedTime -- bytes per second
        local hourlyGrowthRate = memoryGrowthRate * 3600 / baselineMetrics.memory.usedMemory
        
        if hourlyGrowthRate > SystemStabilityTester.alertThresholds.memoryLeakRate then
            table.insert(checks.alerts, {
                type = "memory_leak",
                severity = "critical",
                message = string.format("Memory leak detected: %.2f%% growth per hour", 
                         hourlyGrowthRate * 100),
                metrics = {
                    growthRate = hourlyGrowthRate,
                    currentUsage = currentMetrics.memory.usedMemory,
                    baselineUsage = baselineMetrics.memory.usedMemory
                }
            })
            checks.status = "critical"
        end
    end
    
    -- CPU stability check
    if config.stabilityChecks.cpuStability then
        if currentMetrics.cpu.utilization > SystemStabilityTester.alertThresholds.cpuSpikeThreshold then
            table.insert(checks.alerts, {
                type = "cpu_spike",
                severity = "warning",
                message = string.format("High CPU utilization: %.1f%%", 
                         currentMetrics.cpu.utilization),
                metrics = {
                    currentCpu = currentMetrics.cpu.utilization,
                    threshold = SystemStabilityTester.alertThresholds.cpuSpikeThreshold
                }
            })
            if checks.status == "stable" then
                checks.status = "warning"
            end
        end
    end
    
    -- Response time stability check
    if config.stabilityChecks.responseTimeStability then
        local responseTimeDegradation = currentMetrics.application.responseTimeAvg / 
                                       baselineMetrics.application.responseTimeAvg
        
        if responseTimeDegradation > SystemStabilityTester.alertThresholds.responseTimeDegradation then
            table.insert(checks.alerts, {
                type = "response_time_degradation",
                severity = "warning",
                message = string.format("Response time degraded by %.1fx", responseTimeDegradation),
                metrics = {
                    currentResponseTime = currentMetrics.application.responseTimeAvg,
                    baselineResponseTime = baselineMetrics.application.responseTimeAvg,
                    degradationRatio = responseTimeDegradation
                }
            })
            if checks.status == "stable" then
                checks.status = "warning"
            end
        end
    end
    
    -- Error rate stability check
    if config.stabilityChecks.errorRateStability then
        local errorRateIncrease = currentMetrics.application.errorRate - 
                                 baselineMetrics.application.errorRate
        
        if errorRateIncrease > SystemStabilityTester.alertThresholds.errorRateSpike then
            table.insert(checks.alerts, {
                type = "error_rate_spike",
                severity = "critical",
                message = string.format("Error rate increased by %.2f%%", 
                         errorRateIncrease * 100),
                metrics = {
                    currentErrorRate = currentMetrics.application.errorRate,
                    baselineErrorRate = baselineMetrics.application.errorRate,
                    increase = errorRateIncrease
                }
            })
            checks.status = "critical"
        end
    end
    
    -- Connection stability check
    if config.stabilityChecks.connectionStability then
        local connectionGrowth = currentMetrics.network.connectionsActive - 
                                baselineMetrics.network.connectionsActive
        local connectionGrowthRate = connectionGrowth / elapsedTime * 3600 -- per hour
        
        if connectionGrowthRate > SystemStabilityTester.alertThresholds.connectionLeakRate then
            table.insert(checks.alerts, {
                type = "connection_leak",
                severity = "warning",
                message = string.format("Connection leak detected: %.1f new connections per hour", 
                         connectionGrowthRate),
                metrics = {
                    currentConnections = currentMetrics.network.connectionsActive,
                    baselineConnections = baselineMetrics.network.connectionsActive,
                    growthRate = connectionGrowthRate
                }
            })
            if checks.status == "stable" then
                checks.status = "warning"
            end
        end
    end
    
    -- Resource exhaustion check
    if config.stabilityChecks.resourceExhaustion then
        if currentMetrics.disk.utilizationPercent > SystemStabilityTester.alertThresholds.diskSpaceThreshold then
            table.insert(checks.alerts, {
                type = "disk_space_critical",
                severity = "critical",
                message = string.format("Disk space critical: %.1f%% used", 
                         currentMetrics.disk.utilizationPercent * 100),
                metrics = {
                    diskUtilization = currentMetrics.disk.utilizationPercent,
                    threshold = SystemStabilityTester.alertThresholds.diskSpaceThreshold
                }
            })
            checks.status = "critical"
        end
    end
    
    return checks
end

-- Check for emergency shutdown conditions
function SystemStabilityTester.checkEmergencyShutdown(config, currentMetrics)
    local emergencyCheck = {
        shouldShutdown = false,
        reason = nil
    }
    
    if not config.emergencyShutdown.enabled then
        return emergencyCheck
    end
    
    -- Critical memory threshold
    if currentMetrics.memory.utilizationPercent > config.emergencyShutdown.criticalMemoryThreshold then
        emergencyCheck.shouldShutdown = true
        emergencyCheck.reason = string.format("Critical memory usage: %.1f%%", 
               currentMetrics.memory.utilizationPercent * 100)
        return emergencyCheck
    end
    
    -- Critical CPU threshold
    if currentMetrics.cpu.utilization > config.emergencyShutdown.criticalCpuThreshold then
        emergencyCheck.shouldShutdown = true
        emergencyCheck.reason = string.format("Critical CPU usage: %.1f%%", 
               currentMetrics.cpu.utilization)
        return emergencyCheck
    end
    
    -- Critical error rate threshold
    if currentMetrics.application.errorRate > config.emergencyShutdown.criticalErrorRate then
        emergencyCheck.shouldShutdown = true
        emergencyCheck.reason = string.format("Critical error rate: %.1f%%", 
               currentMetrics.application.errorRate * 100)
        return emergencyCheck
    end
    
    return emergencyCheck
end

-- Stop load generation
function SystemStabilityTester.stopLoadGeneration(loadGenerator)
    if loadGenerator and loadGenerator.isActive then
        loadGenerator.isActive = false
        
        for _, simulator in pairs(loadGenerator.userSimulators) do
            simulator.isActive = false
        end
        
        print("Load generation stopped")
        return true
    end
    return false
end

-- Generate comprehensive stability analysis
function SystemStabilityTester.generateStabilityAnalysis(monitoringData, baselineMetrics, config)
    local analysis = {
        overallStability = "stable",
        stabilityScore = 100, -- out of 100
        trends = {},
        anomalies = {},
        recommendations = {},
        resourceUtilization = {}
    }
    
    if #monitoringData == 0 then
        return analysis
    end
    
    -- Analyze trends
    analysis.trends = SystemStabilityTester.analyzeTrends(monitoringData, baselineMetrics)
    
    -- Detect anomalies
    analysis.anomalies = SystemStabilityTester.detectAnomalies(monitoringData)
    
    -- Calculate stability score
    analysis.stabilityScore = SystemStabilityTester.calculateStabilityScore(monitoringData, baselineMetrics)
    
    -- Determine overall stability
    if analysis.stabilityScore >= 90 then
        analysis.overallStability = "excellent"
    elseif analysis.stabilityScore >= 70 then
        analysis.overallStability = "good"
    elseif analysis.stabilityScore >= 50 then
        analysis.overallStability = "concerning"
    else
        analysis.overallStability = "poor"
    end
    
    -- Generate recommendations
    analysis.recommendations = SystemStabilityTester.generateStabilityRecommendations(analysis)
    
    return analysis
end

-- Analyze stability trends over time
function SystemStabilityTester.analyzeTrends(monitoringData, baselineMetrics)
    local trends = {}
    
    -- Memory trend analysis
    local memoryTrend = SystemStabilityTester.calculateLinearTrend(monitoringData, function(data)
        return data.memory.usedMemory
    end)
    trends.memoryTrend = memoryTrend
    
    -- CPU trend analysis
    local cpuTrend = SystemStabilityTester.calculateLinearTrend(monitoringData, function(data)
        return data.cpu.utilization
    end)
    trends.cpuTrend = cpuTrend
    
    -- Response time trend analysis
    local responseTimeTrend = SystemStabilityTester.calculateLinearTrend(monitoringData, function(data)
        return data.application.responseTimeAvg
    end)
    trends.responseTimeTrend = responseTimeTrend
    
    return trends
end

-- Calculate linear trend for a metric
function SystemStabilityTester.calculateLinearTrend(data, metricExtractor)
    if #data < 2 then
        return {slope = 0, direction = "stable"}
    end
    
    -- Simple linear regression
    local n = #data
    local sumX = 0
    local sumY = 0
    local sumXY = 0
    local sumX2 = 0
    
    for i, dataPoint in ipairs(data) do
        local x = i -- time index
        local y = metricExtractor(dataPoint)
        
        sumX = sumX + x
        sumY = sumY + y
        sumXY = sumXY + (x * y)
        sumX2 = sumX2 + (x * x)
    end
    
    local slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    
    local direction = "stable"
    if slope > 0.1 then
        direction = "increasing"
    elseif slope < -0.1 then
        direction = "decreasing"
    end
    
    return {
        slope = slope,
        direction = direction,
        dataPoints = n
    }
end

-- Detect anomalies in monitoring data
function SystemStabilityTester.detectAnomalies(monitoringData)
    local anomalies = {}
    
    -- Look for spikes and unusual patterns
    for i = 2, #monitoringData do
        local current = monitoringData[i]
        local previous = monitoringData[i-1]
        
        -- CPU spike detection
        local cpuIncrease = current.cpu.utilization - previous.cpu.utilization
        if cpuIncrease > 20 then -- 20% spike
            table.insert(anomalies, {
                type = "cpu_spike",
                timestamp = current.timestamp,
                severity = "high",
                description = string.format("CPU spike of %.1f%%", cpuIncrease)
            })
        end
        
        -- Memory jump detection
        local memoryIncrease = (current.memory.usedMemory - previous.memory.usedMemory) / 
                              previous.memory.usedMemory
        if memoryIncrease > 0.1 then -- 10% memory jump
            table.insert(anomalies, {
                type = "memory_jump",
                timestamp = current.timestamp,
                severity = "medium",
                description = string.format("Memory usage jumped by %.1f%%", memoryIncrease * 100)
            })
        end
    end
    
    return anomalies
end

-- Calculate overall stability score
function SystemStabilityTester.calculateStabilityScore(monitoringData, baselineMetrics)
    local score = 100
    
    -- Penalize based on trends and anomalies
    local finalMetrics = monitoringData[#monitoringData]
    
    -- Memory stability penalty
    local memoryGrowth = (finalMetrics.memory.usedMemory - baselineMetrics.memory.usedMemory) / 
                         baselineMetrics.memory.usedMemory
    if memoryGrowth > 0.2 then -- 20% memory growth
        score = score - 20
    elseif memoryGrowth > 0.1 then -- 10% memory growth
        score = score - 10
    end
    
    -- CPU stability penalty
    local avgCpu = 0
    for _, data in ipairs(monitoringData) do
        avgCpu = avgCpu + data.cpu.utilization
    end
    avgCpu = avgCpu / #monitoringData
    
    if avgCpu > 80 then
        score = score - 15
    elseif avgCpu > 60 then
        score = score - 5
    end
    
    -- Error rate penalty
    if finalMetrics.application.errorRate > baselineMetrics.application.errorRate * 2 then
        score = score - 30
    elseif finalMetrics.application.errorRate > baselineMetrics.application.errorRate * 1.5 then
        score = score - 15
    end
    
    return math.max(0, score)
end

-- Generate stability recommendations
function SystemStabilityTester.generateStabilityRecommendations(analysis)
    local recommendations = {}
    
    if analysis.overallStability == "poor" then
        table.insert(recommendations, {
            priority = "critical",
            category = "stability",
            description = "System stability is poor - immediate investigation required",
            action = "Review all stability metrics and investigate root causes"
        })
    elseif analysis.overallStability == "concerning" then
        table.insert(recommendations, {
            priority = "high",
            category = "stability",
            description = "System stability showing concerning trends",
            action = "Monitor closely and prepare for potential issues"
        })
    end
    
    -- Memory-specific recommendations
    if analysis.trends.memoryTrend and analysis.trends.memoryTrend.direction == "increasing" then
        table.insert(recommendations, {
            priority = "medium",
            category = "memory",
            description = "Memory usage trending upward",
            action = "Investigate potential memory leaks and optimize memory usage"
        })
    end
    
    -- CPU-specific recommendations
    if analysis.trends.cpuTrend and analysis.trends.cpuTrend.direction == "increasing" then
        table.insert(recommendations, {
            priority = "medium",
            category = "performance",
            description = "CPU utilization trending upward",
            action = "Review system performance and consider optimization"
        })
    end
    
    return recommendations
end

-- Get stability test results
function SystemStabilityTester.getStabilityTestResults(testId)
    if testId then
        return SystemStabilityTester.stabilityTests[testId]
    else
        return SystemStabilityTester.stabilityTests
    end
end

return SystemStabilityTester