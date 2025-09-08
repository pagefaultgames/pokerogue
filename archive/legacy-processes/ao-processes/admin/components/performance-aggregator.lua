-- Performance Aggregator Component
-- Collects and analyzes system-wide performance metrics across distributed processes

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local MessageRouter = require("game-logic.process-coordination.message-router")
local PerformanceMonitor = require("game-logic.process-coordination.performance-monitor")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")

local PerformanceAggregator = {
    -- Performance metrics storage
    processMetrics = {},
    
    -- System-wide performance data
    systemMetrics = {
        overallLatency = { min = 0, max = 0, avg = 0 },
        overallThroughput = 0,
        systemLoad = 0,
        totalErrors = 0,
        errorRate = 0,
        resourceUtilization = {
            cpu = { min = 0, max = 0, avg = 0 },
            memory = { min = 0, max = 0, avg = 0 }
        }
    },
    
    -- Performance history for trend analysis
    performanceHistory = {},
    
    -- Aggregation configuration
    config = {
        aggregationIntervalSeconds = 60,
        metricRetentionHours = 24,
        bottleneckThresholds = {
            latencyMs = 1000,
            throughputRps = 100,
            errorRate = 0.05,
            cpuUsage = 80,
            memoryUsage = 85
        },
        trendAnalysisWindow = 3600 -- 1 hour
    },
    
    -- Performance statistics
    statistics = {
        totalMetricCollections = 0,
        lastCollectionTime = 0,
        metricsCollectedCount = 0,
        bottlenecksDetected = 0,
        trendsAnalyzed = 0
    },
    
    -- Performance status levels
    PERFORMANCE_STATUS = {
        OPTIMAL = "OPTIMAL",
        GOOD = "GOOD",
        DEGRADED = "DEGRADED",
        POOR = "POOR",
        CRITICAL = "CRITICAL"
    }
}

-- Initialize performance aggregation system
function PerformanceAggregator.initialize()
    PerformanceAggregator.processMetrics = {}
    PerformanceAggregator.performanceHistory = {}
    PerformanceAggregator.statistics = {
        totalMetricCollections = 0,
        lastCollectionTime = 0,
        metricsCollectedCount = 0,
        bottlenecksDetected = 0,
        trendsAnalyzed = 0
    }
    PerformanceAggregator.systemMetrics = {
        overallLatency = { min = 0, max = 0, avg = 0 },
        overallThroughput = 0,
        systemLoad = 0,
        totalErrors = 0,
        errorRate = 0,
        resourceUtilization = {
            cpu = { min = 0, max = 0, avg = 0 },
            memory = { min = 0, max = 0, avg = 0 }
        }
    }
    print("[PerformanceAggregator] Performance aggregation system initialized")
end

-- Collect performance metrics from all processes
function PerformanceAggregator.collectSystemMetrics()
    local collectionStartTime = 0
    local collectionResults = {
        timestamp = collectionStartTime,
        status = PerformanceAggregator.PERFORMANCE_STATUS.OPTIMAL,
        processMetrics = {},
        systemSummary = {},
        bottlenecks = {},
        errors = {}
    }
    
    -- Get process registry from ProcessAuthenticator to know which processes to query
    local processRegistry = ProcessAuthenticator.processRegistry or {}
    
    for processId, processInfo in pairs(processRegistry) do
        if processInfo.status == "active" then
            local metricsResult = PerformanceAggregator._collectProcessMetrics(processId)
            
            if metricsResult.success then
                PerformanceAggregator.processMetrics[processId] = metricsResult.metrics
                collectionResults.processMetrics[processId] = metricsResult.metrics
                PerformanceAggregator.statistics.metricsCollectedCount = 
                    PerformanceAggregator.statistics.metricsCollectedCount + 1
            else
                table.insert(collectionResults.errors, {
                    processId = processId,
                    error = metricsResult.error
                })
            end
        end
    end
    
    -- Aggregate system-wide metrics
    collectionResults.systemSummary = PerformanceAggregator._aggregateSystemMetrics()
    
    -- Detect performance bottlenecks
    collectionResults.bottlenecks = PerformanceAggregator.identifyBottlenecks()
    
    -- Determine overall system performance status
    collectionResults.status = PerformanceAggregator._determineSystemPerformanceStatus(collectionResults)
    
    -- Record performance history
    PerformanceAggregator._recordPerformanceHistory(collectionResults)
    
    -- Update statistics
    PerformanceAggregator.statistics.totalMetricCollections = 
        PerformanceAggregator.statistics.totalMetricCollections + 1
    PerformanceAggregator.statistics.lastCollectionTime = collectionStartTime
    
    if #collectionResults.bottlenecks > 0 then
        PerformanceAggregator.statistics.bottlenecksDetected = 
            PerformanceAggregator.statistics.bottlenecksDetected + #collectionResults.bottlenecks
    end
    
    print("[PerformanceAggregator] System metrics collection completed - Status: " .. 
          collectionResults.status .. " (" .. 
          PerformanceAggregator._getTableSize(collectionResults.processMetrics) .. " processes)")
    
    return collectionResults
end

-- Get performance metrics for specific process
function PerformanceAggregator.getProcessMetrics(processId, metricType, timeRange)
    local processMetrics = PerformanceAggregator.processMetrics[processId]
    if not processMetrics then
        return nil
    end
    
    local result = {
        processId = processId,
        currentMetrics = processMetrics,
        metricType = metricType or "ALL",
        timeRange = timeRange
    }
    
    -- Filter metrics by type if specified
    if metricType and metricType ~= "ALL" then
        result.filteredMetrics = PerformanceAggregator._filterMetricsByType(processMetrics, metricType)
    end
    
    -- Get historical data if time range is specified
    if timeRange then
        result.historicalMetrics = PerformanceAggregator._getHistoricalMetrics(processId, timeRange)
    end
    
    return result
end

-- Get system-wide performance metrics
function PerformanceAggregator.getSystemMetrics(metricType, timeRange)
    local systemMetrics = {
        timestamp = msg.Timestamp,
        systemMetrics = PerformanceAggregator.systemMetrics,
        metricType = metricType or "ALL",
        processCount = PerformanceAggregator._getTableSize(PerformanceAggregator.processMetrics),
        collectionStatistics = PerformanceAggregator.statistics
    }
    
    -- Include historical data if time range specified
    if timeRange then
        systemMetrics.historicalData = PerformanceAggregator._getSystemHistoricalMetrics(timeRange)
        systemMetrics.trends = PerformanceAggregator.getTrendAnalysis(timeRange)
    end
    
    return systemMetrics
end

-- Identify performance bottlenecks across the system
function PerformanceAggregator.identifyBottlenecks()
    local bottlenecks = {}
    local thresholds = PerformanceAggregator.config.bottleneckThresholds
    
    -- Check system-wide bottlenecks
    if PerformanceAggregator.systemMetrics.overallLatency.avg > thresholds.latencyMs then
        table.insert(bottlenecks, {
            type = "SYSTEM_LATENCY",
            severity = "HIGH",
            metric = "Average Latency",
            value = PerformanceAggregator.systemMetrics.overallLatency.avg,
            threshold = thresholds.latencyMs,
            impact = "System response times are above acceptable limits"
        })
    end
    
    if PerformanceAggregator.systemMetrics.overallThroughput < thresholds.throughputRps then
        table.insert(bottlenecks, {
            type = "SYSTEM_THROUGHPUT",
            severity = "MEDIUM",
            metric = "System Throughput",
            value = PerformanceAggregator.systemMetrics.overallThroughput,
            threshold = thresholds.throughputRps,
            impact = "System throughput is below expected levels"
        })
    end
    
    if PerformanceAggregator.systemMetrics.errorRate > thresholds.errorRate then
        table.insert(bottlenecks, {
            type = "SYSTEM_ERROR_RATE",
            severity = "CRITICAL",
            metric = "Error Rate",
            value = PerformanceAggregator.systemMetrics.errorRate,
            threshold = thresholds.errorRate,
            impact = "System error rate exceeds acceptable limits"
        })
    end
    
    -- Check individual process bottlenecks
    for processId, metrics in pairs(PerformanceAggregator.processMetrics) do
        if metrics.resourceUsage then
            if metrics.resourceUsage.cpuUsage > thresholds.cpuUsage then
                table.insert(bottlenecks, {
                    type = "PROCESS_CPU",
                    severity = "HIGH",
                    processId = processId,
                    metric = "CPU Usage",
                    value = metrics.resourceUsage.cpuUsage,
                    threshold = thresholds.cpuUsage,
                    impact = "Process CPU usage is critically high"
                })
            end
            
            if metrics.resourceUsage.memoryUsage > thresholds.memoryUsage then
                table.insert(bottlenecks, {
                    type = "PROCESS_MEMORY",
                    severity = "HIGH",
                    processId = processId,
                    metric = "Memory Usage",
                    value = metrics.resourceUsage.memoryUsage,
                    threshold = thresholds.memoryUsage,
                    impact = "Process memory usage is critically high"
                })
            end
        end
    end
    
    return bottlenecks
end

-- Perform trend analysis on performance metrics
function PerformanceAggregator.getTrendAnalysis(timeRange)
    local analysisWindow = timeRange or PerformanceAggregator.config.trendAnalysisWindow
    local currentTime = 0
    local startTime = currentTime - analysisWindow
    
    local trends = {
        timestamp = currentTime,
        analysisWindow = analysisWindow,
        latencyTrend = "STABLE",
        throughputTrend = "STABLE", 
        errorRateTrend = "STABLE",
        resourceUtilizationTrend = "STABLE",
        predictions = {},
        recommendations = {}
    }
    
    -- Analyze historical data for trends
    local relevantHistory = PerformanceAggregator._getHistoryInTimeRange(startTime, currentTime)
    
    if #relevantHistory >= 3 then
        -- Analyze latency trend
        trends.latencyTrend = PerformanceAggregator._analyzeTrend(relevantHistory, "latency")
        
        -- Analyze throughput trend
        trends.throughputTrend = PerformanceAggregator._analyzeTrend(relevantHistory, "throughput")
        
        -- Analyze error rate trend
        trends.errorRateTrend = PerformanceAggregator._analyzeTrend(relevantHistory, "errorRate")
        
        -- Generate predictions and recommendations
        trends.predictions = PerformanceAggregator._generatePredictions(relevantHistory)
        trends.recommendations = PerformanceAggregator._generateRecommendations(trends)
    end
    
    PerformanceAggregator.statistics.trendsAnalyzed = 
        PerformanceAggregator.statistics.trendsAnalyzed + 1
    
    return trends
end

-- Get optimization recommendations based on performance data
function PerformanceAggregator.getOptimizationRecommendations()
    local recommendations = {}
    local bottlenecks = PerformanceAggregator.identifyBottlenecks()
    
    for _, bottleneck in ipairs(bottlenecks) do
        if bottleneck.type == "SYSTEM_LATENCY" then
            table.insert(recommendations, {
                type = "OPTIMIZATION",
                priority = "HIGH",
                recommendation = "Consider load balancing optimization or process scaling",
                rationale = "High system latency detected",
                estimatedImpact = "20-40% latency reduction"
            })
        elseif bottleneck.type == "PROCESS_CPU" then
            table.insert(recommendations, {
                type = "RESOURCE",
                priority = "HIGH", 
                processId = bottleneck.processId,
                recommendation = "Scale process resources or optimize CPU-intensive operations",
                rationale = "High CPU usage in process: " .. bottleneck.processId,
                estimatedImpact = "Prevent process throttling and improve response times"
            })
        elseif bottleneck.type == "SYSTEM_ERROR_RATE" then
            table.insert(recommendations, {
                type = "RELIABILITY",
                priority = "CRITICAL",
                recommendation = "Investigate error sources and implement error handling improvements",
                rationale = "Elevated system error rate detected",
                estimatedImpact = "Improve system reliability and user experience"
            })
        end
    end
    
    return recommendations
end

-- Get system performance status
function PerformanceAggregator.getSystemPerformanceStatus()
    local latencyStatus = PerformanceAggregator._getLatencyStatus()
    local throughputStatus = PerformanceAggregator._getThroughputStatus()
    local errorRateStatus = PerformanceAggregator._getErrorRateStatus()
    
    -- Determine overall status (worst case)
    local statusLevels = {
        [PerformanceAggregator.PERFORMANCE_STATUS.CRITICAL] = 5,
        [PerformanceAggregator.PERFORMANCE_STATUS.POOR] = 4,
        [PerformanceAggregator.PERFORMANCE_STATUS.DEGRADED] = 3,
        [PerformanceAggregator.PERFORMANCE_STATUS.GOOD] = 2,
        [PerformanceAggregator.PERFORMANCE_STATUS.OPTIMAL] = 1
    }
    
    local worstStatus = PerformanceAggregator.PERFORMANCE_STATUS.OPTIMAL
    local worstLevel = 1
    
    for _, status in ipairs({latencyStatus, throughputStatus, errorRateStatus}) do
        if statusLevels[status] > worstLevel then
            worstStatus = status
            worstLevel = statusLevels[status]
        end
    end
    
    return worstStatus
end

-- Update performance thresholds
function PerformanceAggregator.updateThresholds(newThresholds)
    if not newThresholds or type(newThresholds) ~= "table" then
        return { success = false, error = "Invalid threshold configuration" }
    end
    
    for key, value in pairs(newThresholds) do
        if PerformanceAggregator.config.bottleneckThresholds[key] then
            PerformanceAggregator.config.bottleneckThresholds[key] = value
        end
    end
    
    print("[PerformanceAggregator] Performance thresholds updated")
    return { success = true, thresholds = PerformanceAggregator.config.bottleneckThresholds }
end

-- Get performance aggregation statistics
function PerformanceAggregator.getStatistics()
    return {
        statistics = PerformanceAggregator.statistics,
        configuration = PerformanceAggregator.config,
        systemMetrics = PerformanceAggregator.systemMetrics,
        monitoredProcessCount = PerformanceAggregator._getTableSize(PerformanceAggregator.processMetrics),
        historyLength = #PerformanceAggregator.performanceHistory
    }
end

-- Private helper functions

function PerformanceAggregator._collectProcessMetrics(processId)
    -- This would send a performance query to the specific process
    local performanceQuery = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "PERFORMANCE_QUERY"
        },
        performanceQuery = {
            queryType = "CURRENT_METRICS",
            includeResourceUsage = true,
            includeLatencyMetrics = true
        }
    }
    
    local routingResult = MessageRouter.routeMessage(
        "PERFORMANCE_QUERY",
        performanceQuery,
        "DIRECT_ROUTE"
    )
    
    if routingResult.success then
        -- In a real implementation, this would wait for and process the response
        -- For now, we'll return placeholder metrics
        return {
            success = true,
            metrics = {
                latency = { min = 10, max = 100, avg = 50 },
                throughput = 150,
                errorRate = 0.02,
                resourceUsage = {
                    cpuUsage = 45,
                    memoryUsage = 60
                },
                timestamp = 0
            }
        }
    else
        return { success = false, error = routingResult.error }
    end
end

function PerformanceAggregator._aggregateSystemMetrics()
    local aggregatedMetrics = {
        timestamp = msg.Timestamp,
        processCount = PerformanceAggregator._getTableSize(PerformanceAggregator.processMetrics),
        totalLatencies = {},
        totalThroughput = 0,
        totalErrors = 0,
        resourceUsageSummary = {
            cpuUsages = {},
            memoryUsages = {}
        }
    }
    
    -- Aggregate metrics from all processes
    for processId, metrics in pairs(PerformanceAggregator.processMetrics) do
        if metrics.latency then
            table.insert(aggregatedMetrics.totalLatencies, metrics.latency.avg)
        end
        
        if metrics.throughput then
            aggregatedMetrics.totalThroughput = aggregatedMetrics.totalThroughput + metrics.throughput
        end
        
        if metrics.errorRate then
            aggregatedMetrics.totalErrors = aggregatedMetrics.totalErrors + metrics.errorRate
        end
        
        if metrics.resourceUsage then
            table.insert(aggregatedMetrics.resourceUsageSummary.cpuUsages, metrics.resourceUsage.cpuUsage)
            table.insert(aggregatedMetrics.resourceUsageSummary.memoryUsages, metrics.resourceUsage.memoryUsage)
        end
    end
    
    -- Calculate system-wide averages
    if #aggregatedMetrics.totalLatencies > 0 then
        PerformanceAggregator.systemMetrics.overallLatency = 
            PerformanceAggregator._calculateMinMaxAvg(aggregatedMetrics.totalLatencies)
    end
    
    PerformanceAggregator.systemMetrics.overallThroughput = aggregatedMetrics.totalThroughput
    PerformanceAggregator.systemMetrics.errorRate = 
        aggregatedMetrics.processCount > 0 and (aggregatedMetrics.totalErrors / aggregatedMetrics.processCount) or 0
    
    if #aggregatedMetrics.resourceUsageSummary.cpuUsages > 0 then
        PerformanceAggregator.systemMetrics.resourceUtilization.cpu = 
            PerformanceAggregator._calculateMinMaxAvg(aggregatedMetrics.resourceUsageSummary.cpuUsages)
    end
    
    if #aggregatedMetrics.resourceUsageSummary.memoryUsages > 0 then
        PerformanceAggregator.systemMetrics.resourceUtilization.memory = 
            PerformanceAggregator._calculateMinMaxAvg(aggregatedMetrics.resourceUsageSummary.memoryUsages)
    end
    
    return PerformanceAggregator.systemMetrics
end

function PerformanceAggregator._determineSystemPerformanceStatus(collectionResults)
    local bottleneckCount = #collectionResults.bottlenecks
    local errorCount = #collectionResults.errors
    local processCount = PerformanceAggregator._getTableSize(collectionResults.processMetrics)
    
    if errorCount > processCount * 0.5 or bottleneckCount >= 3 then
        return PerformanceAggregator.PERFORMANCE_STATUS.CRITICAL
    elseif errorCount > processCount * 0.25 or bottleneckCount >= 2 then
        return PerformanceAggregator.PERFORMANCE_STATUS.POOR
    elseif bottleneckCount >= 1 then
        return PerformanceAggregator.PERFORMANCE_STATUS.DEGRADED
    elseif errorCount == 0 and bottleneckCount == 0 then
        return PerformanceAggregator.PERFORMANCE_STATUS.OPTIMAL
    else
        return PerformanceAggregator.PERFORMANCE_STATUS.GOOD
    end
end

function PerformanceAggregator._recordPerformanceHistory(collectionResults)
    table.insert(PerformanceAggregator.performanceHistory, {
        timestamp = collectionResults.timestamp,
        status = collectionResults.status,
        systemMetrics = PerformanceAggregator.systemMetrics,
        bottleneckCount = #collectionResults.bottlenecks,
        processCount = PerformanceAggregator._getTableSize(collectionResults.processMetrics)
    })
    
    -- Maintain history size (keep last 24 hours worth)
    local maxHistoryEntries = PerformanceAggregator.config.metricRetentionHours
    if #PerformanceAggregator.performanceHistory > maxHistoryEntries then
        table.remove(PerformanceAggregator.performanceHistory, 1)
    end
end

function PerformanceAggregator._calculateMinMaxAvg(values)
    if #values == 0 then
        return { min = 0, max = 0, avg = 0 }
    end
    
    local min = values[1]
    local max = values[1] 
    local sum = 0
    
    for _, value in ipairs(values) do
        if value < min then min = value end
        if value > max then max = value end
        sum = sum + value
    end
    
    return {
        min = min,
        max = max,
        avg = sum / #values
    }
end

function PerformanceAggregator._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

function PerformanceAggregator._getLatencyStatus()
    local avgLatency = PerformanceAggregator.systemMetrics.overallLatency.avg
    local threshold = PerformanceAggregator.config.bottleneckThresholds.latencyMs
    
    if avgLatency > threshold * 2 then
        return PerformanceAggregator.PERFORMANCE_STATUS.CRITICAL
    elseif avgLatency > threshold then
        return PerformanceAggregator.PERFORMANCE_STATUS.POOR
    elseif avgLatency > threshold * 0.7 then
        return PerformanceAggregator.PERFORMANCE_STATUS.DEGRADED
    else
        return PerformanceAggregator.PERFORMANCE_STATUS.OPTIMAL
    end
end

function PerformanceAggregator._getThroughputStatus()
    local throughput = PerformanceAggregator.systemMetrics.overallThroughput
    local threshold = PerformanceAggregator.config.bottleneckThresholds.throughputRps
    
    if throughput < threshold * 0.5 then
        return PerformanceAggregator.PERFORMANCE_STATUS.CRITICAL
    elseif throughput < threshold then
        return PerformanceAggregator.PERFORMANCE_STATUS.DEGRADED
    else
        return PerformanceAggregator.PERFORMANCE_STATUS.OPTIMAL
    end
end

function PerformanceAggregator._getErrorRateStatus()
    local errorRate = PerformanceAggregator.systemMetrics.errorRate
    local threshold = PerformanceAggregator.config.bottleneckThresholds.errorRate
    
    if errorRate > threshold * 2 then
        return PerformanceAggregator.PERFORMANCE_STATUS.CRITICAL
    elseif errorRate > threshold then
        return PerformanceAggregator.PERFORMANCE_STATUS.POOR
    elseif errorRate > threshold * 0.5 then
        return PerformanceAggregator.PERFORMANCE_STATUS.DEGRADED
    else
        return PerformanceAggregator.PERFORMANCE_STATUS.OPTIMAL
    end
end

function PerformanceAggregator._filterMetricsByType(metrics, metricType)
    -- Placeholder implementation for metric filtering
    return metrics
end

function PerformanceAggregator._getHistoricalMetrics(processId, timeRange)
    -- Placeholder implementation for historical metrics
    return {}
end

function PerformanceAggregator._getSystemHistoricalMetrics(timeRange)
    -- Placeholder implementation for system historical metrics
    return {}
end

function PerformanceAggregator._getHistoryInTimeRange(startTime, endTime)
    local relevantHistory = {}
    
    for _, entry in ipairs(PerformanceAggregator.performanceHistory) do
        if entry.timestamp >= startTime and entry.timestamp <= endTime then
            table.insert(relevantHistory, entry)
        end
    end
    
    return relevantHistory
end

function PerformanceAggregator._analyzeTrend(history, metricType)
    -- Simple trend analysis implementation
    if #history < 3 then
        return "INSUFFICIENT_DATA"
    end
    
    -- For simplicity, compare first and last values
    local firstValue = history[1].systemMetrics.overallLatency.avg
    local lastValue = history[#history].systemMetrics.overallLatency.avg
    
    local percentageChange = ((lastValue - firstValue) / firstValue) * 100
    
    if percentageChange > 10 then
        return "INCREASING"
    elseif percentageChange < -10 then
        return "DECREASING" 
    else
        return "STABLE"
    end
end

function PerformanceAggregator._generatePredictions(history)
    -- Placeholder for prediction algorithms
    return {
        "Performance levels expected to remain stable",
        "No significant trends detected in current window"
    }
end

function PerformanceAggregator._generateRecommendations(trends)
    local recommendations = {}
    
    if trends.latencyTrend == "INCREASING" then
        table.insert(recommendations, "Consider load balancing optimization")
    end
    
    if trends.errorRateTrend == "INCREASING" then
        table.insert(recommendations, "Investigate error sources and improve error handling")
    end
    
    return recommendations
end

return PerformanceAggregator