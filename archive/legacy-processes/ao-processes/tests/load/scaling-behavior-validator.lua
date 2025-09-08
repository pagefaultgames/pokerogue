--[[
Scaling Behavior Validation System
Tests system performance under increasing load and validates scalability characteristics
--]]

local json = require("json")

local ScalingBehaviorValidator = {
    scalingTests = {},
    scalingMetrics = {},
    thresholds = {}
}

-- Default scaling test thresholds
ScalingBehaviorValidator.thresholds = {
    responseTimeGrowth = {
        linear = 2.0,    -- 2x growth acceptable for linear scaling
        acceptable = 5.0, -- 5x growth still acceptable
        critical = 10.0   -- 10x growth indicates serious scaling issues
    },
    throughputDecline = {
        minimal = 0.1,    -- 10% decline acceptable
        moderate = 0.3,   -- 30% decline concerning
        severe = 0.5      -- 50% decline indicates scaling failure
    },
    errorRateIncrease = {
        acceptable = 0.02, -- 2% error rate increase acceptable
        concerning = 0.05, -- 5% error rate increase concerning
        critical = 0.1     -- 10% error rate increase critical
    }
}

-- Create scaling test configuration
function ScalingBehaviorValidator.createScalingTestConfig(options)
    return {
        testId = options.testId or ("id_" .. msg.Timestamp),
        baselineUsers = options.baselineUsers or 10,
        maxUsers = options.maxUsers or 1000,
        scalingSteps = options.scalingSteps or 10,
        stepDuration = options.stepDuration or 120, -- seconds per scaling step
        rampUpTime = options.rampUpTime or 30, -- seconds to ramp between steps
        testScenarios = options.testScenarios or {},
        measurementInterval = options.measurementInterval or 10, -- seconds between measurements
        stabilizationTime = options.stabilizationTime or 30 -- seconds to stabilize after each step
    }
end

-- Execute scaling behavior test
function ScalingBehaviorValidator.executeScalingTest(config)
    print(string.format("Starting scaling behavior test: %s", config.testId))
    print(string.format("Scaling from %d to %d users in %d steps", 
          config.baselineUsers, config.maxUsers, config.scalingSteps))
    
    local scalingResults = {
        testId = config.testId,
        config = config,
        steps = {},
        analysis = {},
        timestamp = 0
    }
    
    -- Calculate user count for each scaling step
    local userSteps = ScalingBehaviorValidator.calculateScalingSteps(config)
    
    for stepIndex, userCount in ipairs(userSteps) do
        print(string.format("Executing scaling step %d/%d: %d users", 
              stepIndex, #userSteps, userCount))
        
        -- Execute load test for this scaling step
        local stepConfig = {
            testId = string.format("%s_step_%d", config.testId, stepIndex),
            concurrentUsers = userCount,
            testDuration = config.stepDuration,
            testScenarios = config.testScenarios,
            measurementInterval = config.measurementInterval
        }
        
        local stepResult = ScalingBehaviorValidator.executeScalingStep(stepConfig)
        stepResult.stepIndex = stepIndex
        stepResult.userCount = userCount
        
        table.insert(scalingResults.steps, stepResult)
        
        -- Analyze scaling characteristics after each step
        if stepIndex > 1 then
            local scalingAnalysis = ScalingBehaviorValidator.analyzeScalingStep(
                scalingResults.steps[stepIndex - 1], 
                stepResult
            )
            stepResult.scalingAnalysis = scalingAnalysis
        end
        
        -- Allow system to stabilize before next step
        if stepIndex < #userSteps then
            print(string.format("Stabilizing for %d seconds before next step", 
                  config.stabilizationTime))
            -- In real implementation, would wait for stabilization time
        end
    end
    
    -- Generate comprehensive scaling analysis
    scalingResults.analysis = ScalingBehaviorValidator.generateScalingAnalysis(scalingResults.steps)
    
    ScalingBehaviorValidator.scalingTests[config.testId] = scalingResults
    
    print(string.format("Scaling behavior test completed: %s", config.testId))
    return scalingResults
end

-- Calculate user counts for each scaling step
function ScalingBehaviorValidator.calculateScalingSteps(config)
    local userSteps = {}
    local userRange = config.maxUsers - config.baselineUsers
    
    for i = 0, config.scalingSteps - 1 do
        local stepRatio = i / (config.scalingSteps - 1)
        local userCount = config.baselineUsers + math.floor(userRange * stepRatio)
        table.insert(userSteps, userCount)
    end
    
    return userSteps
end

-- Execute individual scaling step
function ScalingBehaviorValidator.executeScalingStep(stepConfig)
    local startTime = msg.Timestamp
    
    -- Initialize step metrics collection
    local stepMetrics = {
        measurements = {},
        summary = {}
    }
    
    -- Simulate load test execution with continuous measurement
    local measurementCount = math.floor(stepConfig.testDuration / stepConfig.measurementInterval)
    
    for measurementIndex = 1, measurementCount do
        -- Take performance measurement
        local measurement = ScalingBehaviorValidator.takePeformanceMeasurement(
            stepConfig, measurementIndex
        )
        
        measurement.timestamp = startTime + (measurementIndex * stepConfig.measurementInterval)
        table.insert(stepMetrics.measurements, measurement)
    end
    
    -- Generate step summary from measurements
    stepMetrics.summary = ScalingBehaviorValidator.summarizeStepMetrics(stepMetrics.measurements)
    
    return {
        testId = stepConfig.testId,
        userCount = stepConfig.concurrentUsers,
        duration = stepConfig.testDuration,
        metrics = stepMetrics,
        endTime = 0
    }
end

-- Take performance measurement at specific point
function ScalingBehaviorValidator.takePeformanceMeasurement(config, measurementIndex)
    -- Simulate performance measurement with some variance
    local baseResponseTime = 100 -- base 100ms
    local userLoadFactor = config.concurrentUsers / 10 -- scaling factor
    
    -- Simulate non-linear scaling characteristics
    local scalingDegradation = math.pow(userLoadFactor, 1.2) -- slightly non-linear
    local responseTime = baseResponseTime * scalingDegradation
    
    -- Add measurement variance
    local variance = responseTime * 0.1 * (math.random() - 0.5) * 2
    responseTime = responseTime + variance
    
    -- Simulate throughput calculation
    local baseThroughput = 100 -- base 100 req/sec
    local throughputReduction = math.min(userLoadFactor * 0.05, 0.5) -- max 50% reduction
    local throughput = baseThroughput * (1 - throughputReduction)
    
    -- Simulate error rate increase under load
    local baseErrorRate = 0.001 -- 0.1% base error rate
    local loadErrorIncrease = math.min(userLoadFactor * 0.002, 0.1) -- max 10% error rate
    local errorRate = baseErrorRate + loadErrorIncrease
    
    -- Simulate CPU and memory utilization
    local cpuUtilization = math.min(20 + (userLoadFactor * 5), 95) -- 20-95% CPU
    local memoryUtilization = math.min(30 + (userLoadFactor * 3), 90) -- 30-90% memory
    
    return {
        measurementIndex = measurementIndex,
        userCount = config.concurrentUsers,
        responseTime = responseTime,
        throughput = throughput,
        errorRate = errorRate,
        resourceUtilization = {
            cpu = cpuUtilization,
            memory = memoryUtilization,
            network = math.min(userLoadFactor * 2, 80) -- network utilization
        },
        activeConnections = config.concurrentUsers * (0.8 + math.random() * 0.4) -- 80-120% of users
    }
end

-- Summarize step metrics from measurements
function ScalingBehaviorValidator.summarizeStepMetrics(measurements)
    if #measurements == 0 then
        return {}
    end
    
    local summary = {
        responseTime = {sum = 0, min = math.huge, max = 0, count = 0},
        throughput = {sum = 0, min = math.huge, max = 0, count = 0},
        errorRate = {sum = 0, min = math.huge, max = 0, count = 0},
        cpuUtilization = {sum = 0, min = math.huge, max = 0, count = 0},
        memoryUtilization = {sum = 0, min = math.huge, max = 0, count = 0}
    }
    
    -- Aggregate measurements
    for _, measurement in ipairs(measurements) do
        -- Response time
        summary.responseTime.sum = summary.responseTime.sum + measurement.responseTime
        summary.responseTime.min = math.min(summary.responseTime.min, measurement.responseTime)
        summary.responseTime.max = math.max(summary.responseTime.max, measurement.responseTime)
        summary.responseTime.count = summary.responseTime.count + 1
        
        -- Throughput
        summary.throughput.sum = summary.throughput.sum + measurement.throughput
        summary.throughput.min = math.min(summary.throughput.min, measurement.throughput)
        summary.throughput.max = math.max(summary.throughput.max, measurement.throughput)
        summary.throughput.count = summary.throughput.count + 1
        
        -- Error rate
        summary.errorRate.sum = summary.errorRate.sum + measurement.errorRate
        summary.errorRate.min = math.min(summary.errorRate.min, measurement.errorRate)
        summary.errorRate.max = math.max(summary.errorRate.max, measurement.errorRate)
        summary.errorRate.count = summary.errorRate.count + 1
        
        -- CPU utilization
        local cpu = measurement.resourceUtilization.cpu
        summary.cpuUtilization.sum = summary.cpuUtilization.sum + cpu
        summary.cpuUtilization.min = math.min(summary.cpuUtilization.min, cpu)
        summary.cpuUtilization.max = math.max(summary.cpuUtilization.max, cpu)
        summary.cpuUtilization.count = summary.cpuUtilization.count + 1
        
        -- Memory utilization
        local memory = measurement.resourceUtilization.memory
        summary.memoryUtilization.sum = summary.memoryUtilization.sum + memory
        summary.memoryUtilization.min = math.min(summary.memoryUtilization.min, memory)
        summary.memoryUtilization.max = math.max(summary.memoryUtilization.max, memory)
        summary.memoryUtilization.count = summary.memoryUtilization.count + 1
    end
    
    -- Calculate averages
    local result = {
        responseTime = {
            average = summary.responseTime.sum / summary.responseTime.count,
            min = summary.responseTime.min,
            max = summary.responseTime.max
        },
        throughput = {
            average = summary.throughput.sum / summary.throughput.count,
            min = summary.throughput.min,
            max = summary.throughput.max
        },
        errorRate = {
            average = summary.errorRate.sum / summary.errorRate.count,
            min = summary.errorRate.min,
            max = summary.errorRate.max
        },
        resourceUtilization = {
            cpu = {
                average = summary.cpuUtilization.sum / summary.cpuUtilization.count,
                min = summary.cpuUtilization.min,
                max = summary.cpuUtilization.max
            },
            memory = {
                average = summary.memoryUtilization.sum / summary.memoryUtilization.count,
                min = summary.memoryUtilization.min,
                max = summary.memoryUtilization.max
            }
        },
        measurementCount = #measurements
    }
    
    return result
end

-- Analyze scaling characteristics between steps
function ScalingBehaviorValidator.analyzeScalingStep(previousStep, currentStep)
    local prevMetrics = previousStep.metrics.summary
    local currMetrics = currentStep.metrics.summary
    
    local userGrowthRatio = currentStep.userCount / previousStep.userCount
    
    local analysis = {
        userGrowthRatio = userGrowthRatio,
        responseTimeRatio = currMetrics.responseTime.average / prevMetrics.responseTime.average,
        throughputRatio = currMetrics.throughput.average / prevMetrics.throughput.average,
        errorRateIncrease = currMetrics.errorRate.average - prevMetrics.errorRate.average,
        scalingEfficiency = {},
        recommendations = {}
    }
    
    -- Calculate scaling efficiency
    local expectedResponseTime = prevMetrics.responseTime.average * userGrowthRatio
    analysis.scalingEfficiency.responseTime = expectedResponseTime / currMetrics.responseTime.average
    
    local expectedThroughputDecline = 1 - (userGrowthRatio - 1) * 0.1 -- expect 10% decline per user growth
    analysis.scalingEfficiency.throughput = currMetrics.throughput.average / 
        (prevMetrics.throughput.average * expectedThroughputDecline)
    
    -- Classify scaling behavior
    analysis.scalingCharacteristics = ScalingBehaviorValidator.classifyScalingBehavior(analysis)
    
    -- Generate recommendations
    analysis.recommendations = ScalingBehaviorValidator.generateScalingRecommendations(analysis)
    
    return analysis
end

-- Classify scaling behavior based on metrics
function ScalingBehaviorValidator.classifyScalingBehavior(analysis)
    local characteristics = {}
    
    -- Response time scaling classification
    if analysis.responseTimeRatio <= ScalingBehaviorValidator.thresholds.responseTimeGrowth.linear then
        characteristics.responseTimeScaling = "linear"
    elseif analysis.responseTimeRatio <= ScalingBehaviorValidator.thresholds.responseTimeGrowth.acceptable then
        characteristics.responseTimeScaling = "acceptable"
    elseif analysis.responseTimeRatio <= ScalingBehaviorValidator.thresholds.responseTimeGrowth.critical then
        characteristics.responseTimeScaling = "concerning"
    else
        characteristics.responseTimeScaling = "critical"
    end
    
    -- Throughput scaling classification
    local throughputDecline = 1 - analysis.throughputRatio
    if throughputDecline <= ScalingBehaviorValidator.thresholds.throughputDecline.minimal then
        characteristics.throughputScaling = "excellent"
    elseif throughputDecline <= ScalingBehaviorValidator.thresholds.throughputDecline.moderate then
        characteristics.throughputScaling = "good"
    elseif throughputDecline <= ScalingBehaviorValidator.thresholds.throughputDecline.severe then
        characteristics.throughputScaling = "concerning"
    else
        characteristics.throughputScaling = "poor"
    end
    
    -- Error rate scaling classification
    if analysis.errorRateIncrease <= ScalingBehaviorValidator.thresholds.errorRateIncrease.acceptable then
        characteristics.errorRateScaling = "stable"
    elseif analysis.errorRateIncrease <= ScalingBehaviorValidator.thresholds.errorRateIncrease.concerning then
        characteristics.errorRateScaling = "concerning"
    else
        characteristics.errorRateScaling = "critical"
    end
    
    -- Overall scaling assessment
    local criticalIssues = 0
    local concerningIssues = 0
    
    for _, classification in pairs(characteristics) do
        if classification == "critical" or classification == "poor" then
            criticalIssues = criticalIssues + 1
        elseif classification == "concerning" then
            concerningIssues = concerningIssues + 1
        end
    end
    
    if criticalIssues > 0 then
        characteristics.overallAssessment = "critical"
    elseif concerningIssues > 1 then
        characteristics.overallAssessment = "concerning"
    elseif concerningIssues > 0 then
        characteristics.overallAssessment = "acceptable"
    else
        characteristics.overallAssessment = "excellent"
    end
    
    return characteristics
end

-- Generate scaling recommendations
function ScalingBehaviorValidator.generateScalingRecommendations(analysis)
    local recommendations = {}
    
    -- Response time recommendations
    if analysis.scalingCharacteristics.responseTimeScaling == "critical" then
        table.insert(recommendations, {
            priority = "high",
            category = "performance",
            description = "Response time scaling is critical - investigate bottlenecks",
            action = "Profile system under load to identify performance bottlenecks"
        })
    elseif analysis.scalingCharacteristics.responseTimeScaling == "concerning" then
        table.insert(recommendations, {
            priority = "medium",
            category = "performance",
            description = "Response time scaling shows non-linear growth",
            action = "Monitor resource utilization and consider optimization"
        })
    end
    
    -- Throughput recommendations
    if analysis.scalingCharacteristics.throughputScaling == "poor" then
        table.insert(recommendations, {
            priority = "high",
            category = "capacity",
            description = "Throughput severely degraded under load",
            action = "Review system architecture for scalability improvements"
        })
    elseif analysis.scalingCharacteristics.throughputScaling == "concerning" then
        table.insert(recommendations, {
            priority = "medium",
            category = "capacity",
            description = "Throughput declining more than expected",
            action = "Investigate resource constraints and load balancing"
        })
    end
    
    -- Error rate recommendations
    if analysis.scalingCharacteristics.errorRateScaling == "critical" then
        table.insert(recommendations, {
            priority = "critical",
            category = "reliability",
            description = "Error rate increasing significantly under load",
            action = "Immediate investigation of error sources and failure modes"
        })
    elseif analysis.scalingCharacteristics.errorRateScaling == "concerning" then
        table.insert(recommendations, {
            priority = "medium",
            category = "reliability",
            description = "Error rate trending upward with load",
            action = "Review error handling and timeout configurations"
        })
    end
    
    return recommendations
end

-- Generate comprehensive scaling analysis
function ScalingBehaviorValidator.generateScalingAnalysis(steps)
    local analysis = {
        totalSteps = #steps,
        scalingTrends = {},
        bottlenecks = {},
        recommendations = {},
        scalingLimits = {}
    }
    
    -- Analyze trends across all steps
    local responseTimeTrend = {}
    local throughputTrend = {}
    local errorRateTrend = {}
    
    for _, step in ipairs(steps) do
        table.insert(responseTimeTrend, {
            userCount = step.userCount,
            value = step.metrics.summary.responseTime.average
        })
        table.insert(throughputTrend, {
            userCount = step.userCount,
            value = step.metrics.summary.throughput.average
        })
        table.insert(errorRateTrend, {
            userCount = step.userCount,
            value = step.metrics.summary.errorRate.average
        })
    end
    
    analysis.scalingTrends = {
        responseTime = responseTimeTrend,
        throughput = throughputTrend,
        errorRate = errorRateTrend
    }
    
    -- Identify breaking points and bottlenecks
    analysis.bottlenecks = ScalingBehaviorValidator.identifyBottlenecks(steps)
    analysis.scalingLimits = ScalingBehaviorValidator.calculateScalingLimits(steps)
    
    -- Aggregate recommendations
    local allRecommendations = {}
    for _, step in ipairs(steps) do
        if step.scalingAnalysis and step.scalingAnalysis.recommendations then
            for _, rec in ipairs(step.scalingAnalysis.recommendations) do
                table.insert(allRecommendations, rec)
            end
        end
    end
    analysis.recommendations = allRecommendations
    
    return analysis
end

-- Identify performance bottlenecks from scaling test
function ScalingBehaviorValidator.identifyBottlenecks(steps)
    local bottlenecks = {}
    
    -- Find the step with the most significant performance degradation
    local maxResponseTimeIncrease = 0
    local maxThroughputDecrease = 0
    local maxErrorRateIncrease = 0
    
    for i = 2, #steps do
        local prevStep = steps[i-1]
        local currStep = steps[i]
        
        if prevStep.scalingAnalysis then
            local analysis = currStep.scalingAnalysis
            
            if analysis.responseTimeRatio > maxResponseTimeIncrease then
                maxResponseTimeIncrease = analysis.responseTimeRatio
                bottlenecks.responseTimeBottleneck = {
                    stepIndex = i,
                    userCount = currStep.userCount,
                    degradationRatio = analysis.responseTimeRatio
                }
            end
            
            local throughputDecrease = 1 - analysis.throughputRatio
            if throughputDecrease > maxThroughputDecrease then
                maxThroughputDecrease = throughputDecrease
                bottlenecks.throughputBottleneck = {
                    stepIndex = i,
                    userCount = currStep.userCount,
                    degradationRatio = throughputDecrease
                }
            end
            
            if analysis.errorRateIncrease > maxErrorRateIncrease then
                maxErrorRateIncrease = analysis.errorRateIncrease
                bottlenecks.errorRateBottleneck = {
                    stepIndex = i,
                    userCount = currStep.userCount,
                    errorRateIncrease = analysis.errorRateIncrease
                }
            end
        end
    end
    
    return bottlenecks
end

-- Calculate scaling limits based on test results
function ScalingBehaviorValidator.calculateScalingLimits(steps)
    local limits = {}
    
    -- Find user limit where response time becomes unacceptable
    for _, step in ipairs(steps) do
        local responseTime = step.metrics.summary.responseTime.average
        if responseTime > 5000 and not limits.responseTimeLimit then -- 5 second limit
            limits.responseTimeLimit = step.userCount
        end
        
        local errorRate = step.metrics.summary.errorRate.average
        if errorRate > 0.1 and not limits.errorRateLimit then -- 10% error rate limit
            limits.errorRateLimit = step.userCount
        end
        
        local throughput = step.metrics.summary.throughput.average
        if throughput < 10 and not limits.throughputLimit then -- 10 req/sec minimum
            limits.throughputLimit = step.userCount
        end
    end
    
    -- Calculate recommended maximum users
    local recommendations = {}
    if limits.responseTimeLimit then
        table.insert(recommendations, limits.responseTimeLimit * 0.8) -- 80% of limit
    end
    if limits.errorRateLimit then
        table.insert(recommendations, limits.errorRateLimit * 0.7) -- 70% of limit
    end
    if limits.throughputLimit then
        table.insert(recommendations, limits.throughputLimit * 0.9) -- 90% of limit
    end
    
    if #recommendations > 0 then
        local minRec = recommendations[1]
        for i = 2, #recommendations do
            if recommendations[i] < minRec then
                minRec = recommendations[i]
            end
        end
        limits.recommendedMaxUsers = minRec
    end
    
    return limits
end

-- Get scaling test results
function ScalingBehaviorValidator.getScalingTestResults(testId)
    if testId then
        return ScalingBehaviorValidator.scalingTests[testId]
    else
        return ScalingBehaviorValidator.scalingTests
    end
end

return ScalingBehaviorValidator