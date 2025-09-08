-- Performance Monitoring and Benchmarking System
-- Provides baseline performance metrics and inter-process communication monitoring

local PerformanceMonitor = {
    -- Performance metrics storage
    metrics = {
        totalOperations = 0,
        totalLatency = 0,
        minLatency = nil,
        maxLatency = nil,
        averageLatency = 0,
        
        -- Operation-specific metrics
        operationMetrics = {},
        
        -- Process-specific metrics  
        processMetrics = {},
        
        -- Throughput tracking
        operationsPerSecond = 0,
        lastThroughputUpdate = 0,
        currentSecondOperations = 0,
        
        -- Memory and resource usage
        memoryUsage = {},
        
        -- Error rate tracking
        totalErrors = 0,
        errorRate = 0
    },
    
    -- Benchmark baselines for comparison
    baselines = {
        monolithicLatency = 0, -- To be measured
        maxAcceptableLatency = 100, -- milliseconds
        targetThroughput = 100, -- operations per second
        maxMemoryUsage = 1024 * 1024 * 50 -- 50MB in bytes
    },
    
    -- Active performance measurements
    activeMeasurements = {}
}

-- Initialize performance monitoring system
function PerformanceMonitor.initialize(timestamp)
    PerformanceMonitor.metrics.totalOperations = 0
    PerformanceMonitor.metrics.totalLatency = 0
    PerformanceMonitor.metrics.averageLatency = 0
    PerformanceMonitor.metrics.lastThroughputUpdate = timestamp or 0
    
    return true
end

-- Start measuring operation performance
function PerformanceMonitor.startMeasurement(operationId, operationType, processId, timestamp)
    if not operationId then
        return false, "Operation ID is required for performance measurement"
    end
    
    local startTime = os.clock() * 1000 -- Convert to milliseconds
    local startMemory = collectgarbage("count") * 1024 -- Convert KB to bytes
    
    PerformanceMonitor.activeMeasurements[operationId] = {
        operationType = operationType,
        processId = processId,
        startTime = startTime,
        startMemory = startMemory,
        timestamp = timestamp or 0
    }
    
    return true
end

-- End measuring operation performance and record metrics
function PerformanceMonitor.endMeasurement(operationId, success, errorCode)
    local measurement = PerformanceMonitor.activeMeasurements[operationId]
    if not measurement then
        return false, "No active measurement found for operation: " .. tostring(operationId)
    end
    
    local endTime = os.clock() * 1000 -- Convert to milliseconds
    local endMemory = collectgarbage("count") * 1024 -- Convert KB to bytes
    
    local latency = endTime - measurement.startTime
    local memoryDelta = endMemory - measurement.startMemory
    
    -- Update global metrics
    PerformanceMonitor.metrics.totalOperations = PerformanceMonitor.metrics.totalOperations + 1
    PerformanceMonitor.metrics.totalLatency = PerformanceMonitor.metrics.totalLatency + latency
    PerformanceMonitor.metrics.averageLatency = PerformanceMonitor.metrics.totalLatency / PerformanceMonitor.metrics.totalOperations
    
    -- Update min/max latency
    if not PerformanceMonitor.metrics.minLatency or latency < PerformanceMonitor.metrics.minLatency then
        PerformanceMonitor.metrics.minLatency = latency
    end
    if not PerformanceMonitor.metrics.maxLatency or latency > PerformanceMonitor.metrics.maxLatency then
        PerformanceMonitor.metrics.maxLatency = latency
    end
    
    -- Update operation-specific metrics
    local opType = measurement.operationType or "unknown"
    if not PerformanceMonitor.metrics.operationMetrics[opType] then
        PerformanceMonitor.metrics.operationMetrics[opType] = {
            count = 0,
            totalLatency = 0,
            averageLatency = 0,
            minLatency = nil,
            maxLatency = nil,
            successCount = 0,
            errorCount = 0,
            memoryUsage = { total = 0, average = 0, min = nil, max = nil }
        }
    end
    
    local opMetrics = PerformanceMonitor.metrics.operationMetrics[opType]
    opMetrics.count = opMetrics.count + 1
    opMetrics.totalLatency = opMetrics.totalLatency + latency
    opMetrics.averageLatency = opMetrics.totalLatency / opMetrics.count
    
    if not opMetrics.minLatency or latency < opMetrics.minLatency then
        opMetrics.minLatency = latency
    end
    if not opMetrics.maxLatency or latency > opMetrics.maxLatency then
        opMetrics.maxLatency = latency
    end
    
    if success then
        opMetrics.successCount = opMetrics.successCount + 1
    else
        opMetrics.errorCount = opMetrics.errorCount + 1
        PerformanceMonitor.metrics.totalErrors = PerformanceMonitor.metrics.totalErrors + 1
    end
    
    -- Track memory usage
    opMetrics.memoryUsage.total = opMetrics.memoryUsage.total + memoryDelta
    opMetrics.memoryUsage.average = opMetrics.memoryUsage.total / opMetrics.count
    if not opMetrics.memoryUsage.min or memoryDelta < opMetrics.memoryUsage.min then
        opMetrics.memoryUsage.min = memoryDelta
    end
    if not opMetrics.memoryUsage.max or memoryDelta > opMetrics.memoryUsage.max then
        opMetrics.memoryUsage.max = memoryDelta
    end
    
    -- Update process-specific metrics
    local processId = measurement.processId or "unknown"
    if not PerformanceMonitor.metrics.processMetrics[processId] then
        PerformanceMonitor.metrics.processMetrics[processId] = {
            operationCount = 0,
            totalLatency = 0,
            averageLatency = 0,
            errorCount = 0
        }
    end
    
    local procMetrics = PerformanceMonitor.metrics.processMetrics[processId]
    procMetrics.operationCount = procMetrics.operationCount + 1
    procMetrics.totalLatency = procMetrics.totalLatency + latency
    procMetrics.averageLatency = procMetrics.totalLatency / procMetrics.operationCount
    
    if not success then
        procMetrics.errorCount = procMetrics.errorCount + 1
    end
    
    -- Update throughput metrics
    PerformanceMonitor.updateThroughputMetrics()
    
    -- Update error rate
    PerformanceMonitor.metrics.errorRate = PerformanceMonitor.metrics.totalErrors / PerformanceMonitor.metrics.totalOperations
    
    -- Clean up active measurement
    PerformanceMonitor.activeMeasurements[operationId] = nil
    
    return {
        operationId = operationId,
        operationType = opType,
        processId = processId,
        latency = latency,
        memoryDelta = memoryDelta,
        success = success,
        errorCode = errorCode,
        timestamp = timestamp or 0
    }
end

-- Update throughput metrics (operations per second)
function PerformanceMonitor.updateThroughputMetrics(timestamp)
    local currentTime = timestamp or 0
    local timeDiff = currentTime - PerformanceMonitor.metrics.lastThroughputUpdate
    
    if timeDiff >= 1 then -- Update every second
        PerformanceMonitor.metrics.operationsPerSecond = PerformanceMonitor.metrics.currentSecondOperations / timeDiff
        PerformanceMonitor.metrics.currentSecondOperations = 0
        PerformanceMonitor.metrics.lastThroughputUpdate = currentTime
    end
    
    PerformanceMonitor.metrics.currentSecondOperations = PerformanceMonitor.metrics.currentSecondOperations + 1
end

-- Get current performance metrics
function PerformanceMonitor.getMetrics()
    return PerformanceMonitor.metrics
end

-- Get performance metrics for specific operation type
function PerformanceMonitor.getOperationMetrics(operationType)
    return PerformanceMonitor.metrics.operationMetrics[operationType]
end

-- Get performance metrics for specific process
function PerformanceMonitor.getProcessMetrics(processId)
    return PerformanceMonitor.metrics.processMetrics[processId]
end

-- Set performance baseline for comparison
function PerformanceMonitor.setBaseline(baselineType, value)
    if not baselineType or not value then
        return false, "Baseline type and value are required"
    end
    
    PerformanceMonitor.baselines[baselineType] = value
    return true
end

-- Get performance baselines
function PerformanceMonitor.getBaselines()
    return PerformanceMonitor.baselines
end

-- Compare current performance against baselines
function PerformanceMonitor.compareToBaselines()
    local comparison = {
        latencyComparison = {},
        throughputComparison = {},
        memoryComparison = {},
        performanceRegression = false,
        recommendations = {}
    }
    
    -- Latency comparison
    local avgLatency = PerformanceMonitor.metrics.averageLatency
    local baselineLatency = PerformanceMonitor.baselines.monolithicLatency
    
    if baselineLatency > 0 then
        local latencyRatio = avgLatency / baselineLatency
        comparison.latencyComparison = {
            current = avgLatency,
            baseline = baselineLatency,
            ratio = latencyRatio,
            degradation = latencyRatio > 1.1, -- 10% tolerance
            improvement = latencyRatio < 0.9
        }
        
        if latencyRatio > 1.2 then -- 20% degradation threshold
            comparison.performanceRegression = true
            table.insert(comparison.recommendations, "Latency degradation detected: " .. math.floor((latencyRatio - 1) * 100) .. "% slower than baseline")
        end
    end
    
    -- Throughput comparison
    local currentThroughput = PerformanceMonitor.metrics.operationsPerSecond
    local targetThroughput = PerformanceMonitor.baselines.targetThroughput
    
    comparison.throughputComparison = {
        current = currentThroughput,
        target = targetThroughput,
        meetingTarget = currentThroughput >= targetThroughput * 0.9 -- 10% tolerance
    }
    
    if not comparison.throughputComparison.meetingTarget then
        table.insert(comparison.recommendations, "Throughput below target: " .. currentThroughput .. " vs " .. targetThroughput .. " ops/sec")
    end
    
    -- Memory comparison
    local currentMemory = collectgarbage("count") * 1024
    local maxMemory = PerformanceMonitor.baselines.maxMemoryUsage
    
    comparison.memoryComparison = {
        current = currentMemory,
        maximum = maxMemory,
        withinLimits = currentMemory <= maxMemory
    }
    
    if not comparison.memoryComparison.withinLimits then
        comparison.performanceRegression = true
        table.insert(comparison.recommendations, "Memory usage exceeds limits: " .. math.floor(currentMemory/1024/1024) .. "MB vs " .. math.floor(maxMemory/1024/1024) .. "MB limit")
    end
    
    return comparison
end

-- Generate performance report
function PerformanceMonitor.generatePerformanceReport()
    local metrics = PerformanceMonitor.getMetrics()
    local baselines = PerformanceMonitor.getBaselines()
    local comparison = PerformanceMonitor.compareToBaselines()
    
    return {
        summary = {
            totalOperations = metrics.totalOperations,
            averageLatency = metrics.averageLatency,
            minLatency = metrics.minLatency,
            maxLatency = metrics.maxLatency,
            throughput = metrics.operationsPerSecond,
            errorRate = metrics.errorRate,
            memoryUsage = collectgarbage("count") * 1024
        },
        baselines = baselines,
        comparison = comparison,
        operationBreakdown = metrics.operationMetrics,
        processBreakdown = metrics.processMetrics,
        recommendations = comparison.recommendations,
        generatedAt = timestamp or 0
    }
end

-- Reset performance metrics (useful for testing)
function PerformanceMonitor.resetMetrics(timestamp)
    PerformanceMonitor.metrics = {
        totalOperations = 0,
        totalLatency = 0,
        minLatency = nil,
        maxLatency = nil,
        averageLatency = 0,
        operationMetrics = {},
        processMetrics = {},
        operationsPerSecond = 0,
        lastThroughputUpdate = timestamp or 0,
        currentSecondOperations = 0,
        memoryUsage = {},
        totalErrors = 0,
        errorRate = 0
    }
    PerformanceMonitor.activeMeasurements = {}
    return true
end

-- Clean up stale measurements (measurements older than 5 minutes)
function PerformanceMonitor.cleanupStaleMeasurements(timestamp)
    local currentTime = timestamp or 0
    local cleanedCount = 0
    
    for operationId, measurement in pairs(PerformanceMonitor.activeMeasurements) do
        if (currentTime - measurement.timestamp) > 300 then -- 5 minutes
            PerformanceMonitor.activeMeasurements[operationId] = nil
            cleanedCount = cleanedCount + 1
        end
    end
    
    return cleanedCount
end

-- Initialize on module load
PerformanceMonitor.initialize()

return PerformanceMonitor