--[[
Performance Regression Detection System with Configurable Thresholds
Advanced regression detection for performance metrics with intelligent alerting
--]]

local PerformanceRegressionDetector = {}

-- Dependencies
local json = { encode = function(obj) return tostring(obj) end }

-- Regression detection configuration with thresholds
local regressionConfig = {
    thresholds = {
        responseTime = {
            minor = 10,      -- 10% increase
            moderate = 20,   -- 20% increase  
            severe = 40,     -- 40% increase
            critical = 100   -- 100% increase (doubled)
        },
        throughput = {
            minor = 5,       -- 5% decrease
            moderate = 15,   -- 15% decrease
            severe = 30,     -- 30% decrease
            critical = 50    -- 50% decrease  
        },
        errorRate = {
            minor = 0.5,     -- 0.5% increase
            moderate = 1.0,  -- 1.0% increase
            severe = 2.5,    -- 2.5% increase
            critical = 5.0   -- 5.0% increase
        },
        resourceUsage = {
            cpu = { minor = 15, moderate = 30, severe = 50, critical = 80 },      -- % increase
            memory = { minor = 20, moderate = 40, severe = 70, critical = 100 }   -- % increase
        }
    },
    detectionWindows = {
        realtime = 60,      -- 1 minute window
        shortTerm = 300,    -- 5 minute window  
        mediumTerm = 1800,  -- 30 minute window
        longTerm = 3600     -- 1 hour window
    },
    baselineRequirements = {
        minimumSamples = 10,        -- Minimum samples for baseline
        stabilityThreshold = 15,    -- Max coefficient of variation for stable baseline
        confidenceLevel = 0.95      -- Statistical confidence level
    }
}

-- Regression detection state
local detectionState = {
    baselines = {},                 -- Historical performance baselines
    recentMeasurements = {},        -- Recent measurements for comparison
    regressionHistory = {},         -- History of detected regressions
    activeRegressions = {},         -- Currently active regressions
    trendAnalysis = {},            -- Performance trend analysis
    statisticalModels = {}         -- Statistical models for prediction
}

function PerformanceRegressionDetector.initializeRegressionDetection(config)
    -- Update configuration
    if config and config.thresholds then
        for metric, thresholds in pairs(config.thresholds) do
            if regressionConfig.thresholds[metric] then
                for level, value in pairs(thresholds) do
                    regressionConfig.thresholds[metric][level] = value
                end
            end
        end
    end
    
    if config and config.detectionWindows then
        for window, duration in pairs(config.detectionWindows) do
            regressionConfig.detectionWindows[window] = duration
        end
    end
    
    -- Initialize detection state
    detectionState.baselines = {}
    detectionState.recentMeasurements = {}
    detectionState.regressionHistory = {}
    detectionState.activeRegressions = {}
    detectionState.trendAnalysis = {}
    detectionState.statisticalModels = {}
    
    print("[REGRESSION_DETECTOR] Performance regression detector initialized")
    
    return {
        success = true,
        configuration = regressionConfig,
        detectionWindows = regressionConfig.detectionWindows
    }
end

function PerformanceRegressionDetector.establishBaseline(architecture, operation, measurements)
    local baselineKey = architecture .. "_" .. operation
    
    if #measurements < regressionConfig.baselineRequirements.minimumSamples then
        return {
            success = false,
            error = "Insufficient measurements for baseline establishment"
        }
    end
    
    local baseline = {
        architecture = architecture,
        operation = operation,
        establishedAt = 0,
        sampleCount = #measurements,
        statistics = PerformanceRegressionDetector.calculateStatistics(measurements),
        stability = PerformanceRegressionDetector.assessStability(measurements),
        valid = false
    }
    
    -- Check if baseline is stable enough
    baseline.valid = baseline.stability.coefficientOfVariation <= 
        regressionConfig.baselineRequirements.stabilityThreshold
    
    detectionState.baselines[baselineKey] = baseline
    
    print("[REGRESSION_DETECTOR] Baseline established for " .. baselineKey .. 
          " (valid: " .. tostring(baseline.valid) .. ")")
    
    return {
        success = true,
        baseline = baseline,
        stable = baseline.valid
    }
end

function PerformanceRegressionDetector.detectRegressions(architecture, operation, currentMeasurements)
    local baselineKey = architecture .. "_" .. operation
    local baseline = detectionState.baselines[baselineKey]
    
    if not baseline or not baseline.valid then
        return {
            success = false,
            error = "No valid baseline available for " .. baselineKey
        }
    end
    
    local regressionResults = {
        architecture = architecture,
        operation = operation,
        detectionTimestamp = 0,
        baseline = baseline,
        current = PerformanceRegressionDetector.calculateStatistics(currentMeasurements),
        regressions = {},
        overallSeverity = "NONE",
        confidence = 0
    }
    
    -- Detect response time regression
    local responseTimeRegression = PerformanceRegressionDetector.detectMetricRegression(
        "responseTime", 
        baseline.statistics.responseTime,
        regressionResults.current.responseTime
    )
    if responseTimeRegression.detected then
        table.insert(regressionResults.regressions, responseTimeRegression)
    end
    
    -- Detect throughput regression
    local throughputRegression = PerformanceRegressionDetector.detectMetricRegression(
        "throughput",
        baseline.statistics.throughput, 
        regressionResults.current.throughput
    )
    if throughputRegression.detected then
        table.insert(regressionResults.regressions, throughputRegression)
    end
    
    -- Detect error rate regression
    local errorRateRegression = PerformanceRegressionDetector.detectMetricRegression(
        "errorRate",
        baseline.statistics.errorRate,
        regressionResults.current.errorRate
    )
    if errorRateRegression.detected then
        table.insert(regressionResults.regressions, errorRateRegression)
    end
    
    -- Determine overall severity and confidence
    regressionResults.overallSeverity = PerformanceRegressionDetector.determineOverallSeverity(
        regressionResults.regressions
    )
    regressionResults.confidence = PerformanceRegressionDetector.calculateConfidence(
        baseline, regressionResults.current
    )
    
    -- Record regression if detected
    if #regressionResults.regressions > 0 then
        PerformanceRegressionDetector.recordRegression(regressionResults)
        print("[REGRESSION_DETECTOR] Regression detected for " .. baselineKey .. 
              " (severity: " .. regressionResults.overallSeverity .. ")")
    end
    
    return regressionResults
end

function PerformanceRegressionDetector.detectMetricRegression(metric, baselineStats, currentStats)
    local regression = {
        metric = metric,
        detected = false,
        severity = "NONE",
        percentChange = 0,
        actualChange = 0,
        threshold = 0,
        statisticalSignificance = false
    }
    
    local baselineValue, currentValue
    
    if metric == "responseTime" then
        baselineValue = baselineStats.mean
        currentValue = currentStats.mean
        -- For response time, increase is bad
        regression.percentChange = ((currentValue - baselineValue) / baselineValue) * 100
        regression.actualChange = currentValue - baselineValue
        
        -- Check against thresholds
        if regression.percentChange >= regressionConfig.thresholds.responseTime.critical then
            regression.detected = true
            regression.severity = "CRITICAL"
            regression.threshold = regressionConfig.thresholds.responseTime.critical
        elseif regression.percentChange >= regressionConfig.thresholds.responseTime.severe then
            regression.detected = true
            regression.severity = "SEVERE"
            regression.threshold = regressionConfig.thresholds.responseTime.severe
        elseif regression.percentChange >= regressionConfig.thresholds.responseTime.moderate then
            regression.detected = true
            regression.severity = "MODERATE"
            regression.threshold = regressionConfig.thresholds.responseTime.moderate
        elseif regression.percentChange >= regressionConfig.thresholds.responseTime.minor then
            regression.detected = true
            regression.severity = "MINOR"
            regression.threshold = regressionConfig.thresholds.responseTime.minor
        end
        
    elseif metric == "throughput" then
        baselineValue = baselineStats.mean
        currentValue = currentStats.mean
        -- For throughput, decrease is bad
        regression.percentChange = ((baselineValue - currentValue) / baselineValue) * 100
        regression.actualChange = baselineValue - currentValue
        
        -- Check against thresholds (positive percentChange means decrease)
        if regression.percentChange >= regressionConfig.thresholds.throughput.critical then
            regression.detected = true
            regression.severity = "CRITICAL"
            regression.threshold = regressionConfig.thresholds.throughput.critical
        elseif regression.percentChange >= regressionConfig.thresholds.throughput.severe then
            regression.detected = true
            regression.severity = "SEVERE"  
            regression.threshold = regressionConfig.thresholds.throughput.severe
        elseif regression.percentChange >= regressionConfig.thresholds.throughput.moderate then
            regression.detected = true
            regression.severity = "MODERATE"
            regression.threshold = regressionConfig.thresholds.throughput.moderate
        elseif regression.percentChange >= regressionConfig.thresholds.throughput.minor then
            regression.detected = true
            regression.severity = "MINOR"
            regression.threshold = regressionConfig.thresholds.throughput.minor
        end
        
    elseif metric == "errorRate" then
        baselineValue = baselineStats.mean
        currentValue = currentStats.mean
        -- For error rate, increase is bad (absolute increase, not percentage)
        regression.actualChange = currentValue - baselineValue
        regression.percentChange = baselineValue > 0 and ((currentValue - baselineValue) / baselineValue) * 100 or 0
        
        -- Check against absolute thresholds
        if regression.actualChange >= regressionConfig.thresholds.errorRate.critical then
            regression.detected = true
            regression.severity = "CRITICAL"
            regression.threshold = regressionConfig.thresholds.errorRate.critical
        elseif regression.actualChange >= regressionConfig.thresholds.errorRate.severe then
            regression.detected = true
            regression.severity = "SEVERE"
            regression.threshold = regressionConfig.thresholds.errorRate.severe
        elseif regression.actualChange >= regressionConfig.thresholds.errorRate.moderate then
            regression.detected = true
            regression.severity = "MODERATE"
            regression.threshold = regressionConfig.thresholds.errorRate.moderate
        elseif regression.actualChange >= regressionConfig.thresholds.errorRate.minor then
            regression.detected = true
            regression.severity = "MINOR"
            regression.threshold = regressionConfig.thresholds.errorRate.minor
        end
    end
    
    -- Perform statistical significance test
    if regression.detected then
        regression.statisticalSignificance = PerformanceRegressionDetector.performTTest(
            baselineStats, currentStats
        )
    end
    
    return regression
end

function PerformanceRegressionDetector.calculateStatistics(measurements)
    if #measurements == 0 then
        return { mean = 0, stddev = 0, min = 0, max = 0, median = 0, count = 0 }
    end
    
    -- Extract values (measurements could be objects or simple numbers)
    local values = {}
    for _, measurement in ipairs(measurements) do
        if type(measurement) == "number" then
            table.insert(values, measurement)
        elseif type(measurement) == "table" then
            -- Try common field names
            local value = measurement.responseTime or measurement.throughput or 
                         measurement.errorRate or measurement.value or measurement
            if type(value) == "number" then
                table.insert(values, value)
            end
        end
    end
    
    if #values == 0 then
        return { mean = 0, stddev = 0, min = 0, max = 0, median = 0, count = 0 }
    end
    
    -- Sort for median calculation
    table.sort(values)
    
    -- Calculate statistics
    local sum = 0
    local min = values[1]
    local max = values[#values]
    
    for _, value in ipairs(values) do
        sum = sum + value
    end
    
    local mean = sum / #values
    
    -- Calculate standard deviation
    local variance = 0
    for _, value in ipairs(values) do
        variance = variance + (value - mean) ^ 2
    end
    variance = variance / #values
    local stddev = math.sqrt(variance)
    
    -- Calculate median
    local median
    local mid = math.ceil(#values / 2)
    if #values % 2 == 0 then
        median = (values[mid] + values[mid + 1]) / 2
    else
        median = values[mid]
    end
    
    return {
        mean = mean,
        stddev = stddev,
        min = min,
        max = max,
        median = median,
        count = #values,
        values = values
    }
end

function PerformanceRegressionDetector.assessStability(measurements)
    local stats = PerformanceRegressionDetector.calculateStatistics(measurements)
    
    local stability = {
        coefficientOfVariation = 0,
        stable = false,
        trendDirection = "STABLE",
        volatility = "LOW"
    }
    
    if stats.mean > 0 then
        stability.coefficientOfVariation = (stats.stddev / stats.mean) * 100
        
        -- Assess stability based on coefficient of variation
        if stability.coefficientOfVariation <= 10 then
            stability.stable = true
            stability.volatility = "LOW"
        elseif stability.coefficientOfVariation <= 20 then
            stability.stable = true
            stability.volatility = "MODERATE"
        else
            stability.stable = false
            stability.volatility = "HIGH"
        end
        
        -- Assess trend direction using simple linear regression
        stability.trendDirection = PerformanceRegressionDetector.calculateTrend(measurements)
    end
    
    return stability
end

function PerformanceRegressionDetector.calculateTrend(measurements)
    if #measurements < 3 then
        return "INSUFFICIENT_DATA"
    end
    
    -- Simple linear regression slope calculation
    local n = #measurements
    local sumX = 0
    local sumY = 0
    local sumXY = 0
    local sumX2 = 0
    
    for i, measurement in ipairs(measurements) do
        local x = i  -- Time point
        local y = type(measurement) == "number" and measurement or 
                 (measurement.responseTime or measurement.throughput or measurement.value or 0)
        
        sumX = sumX + x
        sumY = sumY + y
        sumXY = sumXY + (x * y)
        sumX2 = sumX2 + (x * x)
    end
    
    local slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    
    if math.abs(slope) < 0.1 then
        return "STABLE"
    elseif slope > 0 then
        return "INCREASING"
    else
        return "DECREASING"
    end
end

function PerformanceRegressionDetector.performTTest(baselineStats, currentStats)
    -- Simplified t-test for statistical significance
    if baselineStats.count < 2 or currentStats.count < 2 then
        return false
    end
    
    local pooledStdDev = math.sqrt(
        ((baselineStats.count - 1) * baselineStats.stddev^2 + 
         (currentStats.count - 1) * currentStats.stddev^2) / 
        (baselineStats.count + currentStats.count - 2)
    )
    
    local standardError = pooledStdDev * math.sqrt(
        1/baselineStats.count + 1/currentStats.count
    )
    
    if standardError == 0 then
        return false
    end
    
    local tStatistic = math.abs(baselineStats.mean - currentStats.mean) / standardError
    
    -- Critical t-value for 95% confidence with approximate df
    local criticalValue = 2.0  -- Approximation for large samples
    
    return tStatistic > criticalValue
end

function PerformanceRegressionDetector.determineOverallSeverity(regressions)
    if #regressions == 0 then
        return "NONE"
    end
    
    local severityLevels = { "CRITICAL", "SEVERE", "MODERATE", "MINOR", "NONE" }
    
    for _, severityLevel in ipairs(severityLevels) do
        for _, regression in ipairs(regressions) do
            if regression.severity == severityLevel then
                return severityLevel
            end
        end
    end
    
    return "NONE"
end

function PerformanceRegressionDetector.calculateConfidence(baseline, current)
    -- Calculate confidence based on sample sizes and stability
    local baseSampleConfidence = math.min(baseline.sampleCount / 50, 1.0) -- Max at 50 samples
    local currentSampleConfidence = math.min(current.count / 20, 1.0)     -- Max at 20 samples
    local stabilityConfidence = baseline.valid and 1.0 or 0.5
    
    return (baseSampleConfidence + currentSampleConfidence + stabilityConfidence) / 3
end

function PerformanceRegressionDetector.recordRegression(regressionResults)
    -- Add to regression history
    table.insert(detectionState.regressionHistory, {
        timestamp = regressionResults.detectionTimestamp,
        architecture = regressionResults.architecture,
        operation = regressionResults.operation,
        severity = regressionResults.overallSeverity,
        regressionCount = #regressionResults.regressions,
        confidence = regressionResults.confidence
    })
    
    -- Update active regressions
    local key = regressionResults.architecture .. "_" .. regressionResults.operation
    detectionState.activeRegressions[key] = regressionResults
end

function PerformanceRegressionDetector.getActiveRegressions()
    return detectionState.activeRegressions
end

function PerformanceRegressionDetector.getRegressionHistory()
    return detectionState.regressionHistory
end

function PerformanceRegressionDetector.generateRegressionReport()
    local report = {
        reportTimestamp = 0,
        activeRegressions = detectionState.activeRegressions,
        regressionHistory = detectionState.regressionHistory,
        baselines = detectionState.baselines,
        configuration = regressionConfig,
        summary = {
            totalActiveRegressions = 0,
            severityBreakdown = { CRITICAL = 0, SEVERE = 0, MODERATE = 0, MINOR = 0 },
            averageConfidence = 0,
            baselinesEstablished = 0
        }
    }
    
    -- Calculate summary statistics
    local totalConfidence = 0
    
    for _, regression in pairs(detectionState.activeRegressions) do
        report.summary.totalActiveRegressions = report.summary.totalActiveRegressions + 1
        report.summary.severityBreakdown[regression.overallSeverity] = 
            report.summary.severityBreakdown[regression.overallSeverity] + 1
        totalConfidence = totalConfidence + regression.confidence
    end
    
    if report.summary.totalActiveRegressions > 0 then
        report.summary.averageConfidence = totalConfidence / report.summary.totalActiveRegressions
    end
    
    for _, baseline in pairs(detectionState.baselines) do
        if baseline.valid then
            report.summary.baselinesEstablished = report.summary.baselinesEstablished + 1
        end
    end
    
    return report
end

return PerformanceRegressionDetector