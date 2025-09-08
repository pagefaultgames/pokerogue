--[[
Performance Benchmarking Framework
Comprehensive performance comparison system for monolithic vs distributed architectures
--]]

local PerformanceBenchmarkingFramework = {}

-- Dependencies
local json = { encode = function(obj) return tostring(obj) end }

-- Benchmarking configuration
local benchmarkConfig = {
    architectures = {
        monolithic = { enabled = false, processId = "monolithic-main" },
        distributed = { enabled = true, processes = {} }
    },
    benchmarkTypes = {
        "RESPONSE_TIME",
        "THROUGHPUT", 
        "RESOURCE_USAGE",
        "SCALABILITY",
        "CONCURRENCY",
        "MEMORY_EFFICIENCY"
    },
    defaultThresholds = {
        responseTime = { acceptable = 500, warning = 1000, critical = 2000 }, -- milliseconds
        throughput = { minimum = 100, target = 500, excellent = 1000 }, -- requests/second
        memoryUsage = { efficient = 50, acceptable = 100, excessive = 200 }, -- MB
        cpuUsage = { efficient = 30, acceptable = 60, excessive = 90 }, -- percentage
        errorRate = { excellent = 0.1, acceptable = 1.0, critical = 5.0 } -- percentage
    },
    testDurations = {
        quick = 30,     -- 30 seconds
        standard = 120, -- 2 minutes  
        extended = 600  -- 10 minutes
    }
}

-- Benchmark execution state
local benchmarkState = {
    currentSession = "",
    startTime = 0,
    endTime = 0,
    totalBenchmarks = 0,
    completedBenchmarks = 0,
    benchmarkResults = {},
    performanceMetrics = {},
    comparisonResults = {},
    regressionAlerts = {}
}

-- Benchmark test scenarios
local benchmarkScenarios = {
    {
        name = "Single User Battle Processing",
        category = "RESPONSE_TIME",
        architecture = "BOTH",
        workloadType = "SINGLE_USER",
        testFunction = function(architecture)
            return PerformanceBenchmarkingFramework.executeBattleBenchmark(architecture, {
                concurrentUsers = 1,
                battlesPerUser = 10,
                duration = 60
            })
        end
    },
    {
        name = "Concurrent Battle Processing", 
        category = "THROUGHPUT",
        architecture = "BOTH",
        workloadType = "CONCURRENT",
        testFunction = function(architecture)
            return PerformanceBenchmarkingFramework.executeBattleBenchmark(architecture, {
                concurrentUsers = 10,
                battlesPerUser = 5,
                duration = 120
            })
        end
    },
    {
        name = "Pokemon State Management Performance",
        category = "RESPONSE_TIME",
        architecture = "BOTH", 
        workloadType = "STATE_MANAGEMENT",
        testFunction = function(architecture)
            return PerformanceBenchmarkingFramework.executePokemonStateBenchmark(architecture, {
                operations = 1000,
                pokemonCount = 100,
                duration = 60
            })
        end
    },
    {
        name = "Shop Transaction Throughput",
        category = "THROUGHPUT",
        architecture = "BOTH",
        workloadType = "TRANSACTIONS", 
        testFunction = function(architecture)
            return PerformanceBenchmarkingFramework.executeShopBenchmark(architecture, {
                transactionsPerSecond = 50,
                duration = 90,
                itemTypes = 20
            })
        end
    },
    {
        name = "Memory Usage Under Load",
        category = "RESOURCE_USAGE",
        architecture = "BOTH",
        workloadType = "MEMORY_TEST",
        testFunction = function(architecture)
            return PerformanceBenchmarkingFramework.executeMemoryBenchmark(architecture, {
                loadIncrement = 100,
                maxLoad = 1000,
                duration = 180
            })
        end
    },
    {
        name = "Scalability Testing",
        category = "SCALABILITY", 
        architecture = "DISTRIBUTED",
        workloadType = "SCALING",
        testFunction = function(architecture)
            return PerformanceBenchmarkingFramework.executeScalabilityBenchmark(architecture, {
                startUsers = 10,
                maxUsers = 500,
                incrementStep = 50,
                stepDuration = 60
            })
        end
    }
}

function PerformanceBenchmarkingFramework.initializeBenchmarking(config)
    -- Update configuration
    if config then
        if config.architectures then
            for arch, archConfig in pairs(config.architectures) do
                if benchmarkConfig.architectures[arch] then
                    for key, value in pairs(archConfig) do
                        benchmarkConfig.architectures[arch][key] = value
                    end
                end
            end
        end
        
        if config.thresholds then
            for metric, thresholds in pairs(config.thresholds) do
                if benchmarkConfig.defaultThresholds[metric] then
                    for threshold, value in pairs(thresholds) do
                        benchmarkConfig.defaultThresholds[metric][threshold] = value
                    end
                end
            end
        end
    end
    
    -- Initialize session
    benchmarkState.currentSession = "benchmark-" .. tostring(0)
    benchmarkState.startTime = 0
    benchmarkState.totalBenchmarks = 0
    benchmarkState.completedBenchmarks = 0
    benchmarkState.benchmarkResults = {}
    benchmarkState.performanceMetrics = {}
    benchmarkState.comparisonResults = {}
    benchmarkState.regressionAlerts = {}
    
    -- Count applicable benchmarks
    for _, scenario in ipairs(benchmarkScenarios) do
        if scenario.architecture == "BOTH" or 
           (scenario.architecture == "MONOLITHIC" and benchmarkConfig.architectures.monolithic.enabled) or
           (scenario.architecture == "DISTRIBUTED" and benchmarkConfig.architectures.distributed.enabled) then
            benchmarkState.totalBenchmarks = benchmarkState.totalBenchmarks + 1
        end
    end
    
    print("[PERFORMANCE_BENCHMARK] Performance benchmarking initialized")
    print("[PERFORMANCE_BENCHMARK] Session: " .. benchmarkState.currentSession)
    print("[PERFORMANCE_BENCHMARK] Total benchmarks: " .. benchmarkState.totalBenchmarks)
    
    return {
        success = true,
        sessionId = benchmarkState.currentSession,
        totalBenchmarks = benchmarkState.totalBenchmarks,
        monolithicEnabled = benchmarkConfig.architectures.monolithic.enabled,
        distributedEnabled = benchmarkConfig.architectures.distributed.enabled
    }
end

function PerformanceBenchmarkingFramework.executeBenchmarkSuite(duration)
    duration = duration or "standard"
    local testDuration = benchmarkConfig.testDurations[duration] or benchmarkConfig.testDurations.standard
    
    print("[PERFORMANCE_BENCHMARK] Starting benchmark suite execution (duration: " .. duration .. ")")
    
    for _, scenario in ipairs(benchmarkScenarios) do
        local shouldRun = false
        local architecturesToTest = {}
        
        if scenario.architecture == "BOTH" then
            if benchmarkConfig.architectures.monolithic.enabled then
                table.insert(architecturesToTest, "monolithic")
            end
            if benchmarkConfig.architectures.distributed.enabled then
                table.insert(architecturesToTest, "distributed")
            end
            shouldRun = #architecturesToTest > 0
        elseif scenario.architecture == "MONOLITHIC" and benchmarkConfig.architectures.monolithic.enabled then
            table.insert(architecturesToTest, "monolithic")
            shouldRun = true
        elseif scenario.architecture == "DISTRIBUTED" and benchmarkConfig.architectures.distributed.enabled then
            table.insert(architecturesToTest, "distributed")
            shouldRun = true
        end
        
        if shouldRun then
            local scenarioResults = PerformanceBenchmarkingFramework.executeBenchmarkScenario(
                scenario, architecturesToTest, testDuration
            )
            table.insert(benchmarkState.benchmarkResults, scenarioResults)
            benchmarkState.completedBenchmarks = benchmarkState.completedBenchmarks + 1
        end
    end
    
    benchmarkState.endTime = 0
    
    -- Analyze results and generate comparisons
    PerformanceBenchmarkingFramework.analyzePerformanceResults()
    PerformanceBenchmarkingFramework.detectPerformanceRegressions()
    
    print("[PERFORMANCE_BENCHMARK] Benchmark suite execution completed")
    print("[PERFORMANCE_BENCHMARK] Completed: " .. benchmarkState.completedBenchmarks .. "/" .. benchmarkState.totalBenchmarks)
    
    return {
        sessionId = benchmarkState.currentSession,
        totalBenchmarks = benchmarkState.totalBenchmarks,
        completedBenchmarks = benchmarkState.completedBenchmarks,
        duration = benchmarkState.endTime - benchmarkState.startTime,
        results = benchmarkState.benchmarkResults,
        comparisons = benchmarkState.comparisonResults,
        regressionAlerts = benchmarkState.regressionAlerts
    }
end

function PerformanceBenchmarkingFramework.executeBenchmarkScenario(scenario, architectures, duration)
    local scenarioResult = {
        scenarioName = scenario.name,
        category = scenario.category,
        workloadType = scenario.workloadType,
        startTime = 0,
        endTime = 0,
        duration = duration,
        architectureResults = {},
        performanceComparison = {},
        status = "PENDING"
    }
    
    print("[PERFORMANCE_BENCHMARK] Executing scenario: " .. scenario.name)
    
    for _, architecture in ipairs(architectures) do
        local archResult = PerformanceBenchmarkingFramework.executeBenchmarkForArchitecture(
            scenario, architecture, duration
        )
        scenarioResult.architectureResults[architecture] = archResult
        
        print("[PERFORMANCE_BENCHMARK] " .. architecture .. " architecture completed for: " .. scenario.name)
    end
    
    scenarioResult.endTime = 0
    
    -- Generate performance comparison if multiple architectures tested
    if #architectures > 1 then
        scenarioResult.performanceComparison = PerformanceBenchmarkingFramework.compareArchitecturePerformance(
            scenarioResult.architectureResults.monolithic,
            scenarioResult.architectureResults.distributed
        )
    end
    
    scenarioResult.status = "COMPLETED"
    
    return scenarioResult
end

function PerformanceBenchmarkingFramework.executeBenchmarkForArchitecture(scenario, architecture, duration)
    local archResult = {
        architecture = architecture,
        startTime = os.clock(),
        endTime = 0,
        metrics = {
            responseTime = { min = 0, max = 0, average = 0, p95 = 0, p99 = 0 },
            throughput = { average = 0, peak = 0 },
            resourceUsage = { cpu = 0, memory = 0 },
            errorRate = 0,
            concurrency = 0
        },
        rawMeasurements = {},
        status = "PENDING"
    }
    
    -- Execute the benchmark test function
    local success, result = pcall(scenario.testFunction, architecture, duration)
    
    if success and result then
        archResult.metrics = result.metrics or archResult.metrics
        archResult.rawMeasurements = result.measurements or {}
        archResult.status = "COMPLETED"
    else
        archResult.status = "FAILED"
        archResult.error = tostring(result)
    end
    
    archResult.endTime = os.clock()
    archResult.totalExecutionTime = archResult.endTime - archResult.startTime
    
    return archResult
end

-- Architecture-specific benchmark implementations

function PerformanceBenchmarkingFramework.executeBattleBenchmark(architecture, config)
    local result = {
        metrics = {
            responseTime = { min = 45, max = 250, average = 120, p95 = 200, p99 = 240 },
            throughput = { average = 8.5, peak = 12.3 },
            resourceUsage = { cpu = 35, memory = 45 },
            errorRate = 0.2,
            concurrency = config.concurrentUsers or 1
        },
        measurements = {}
    }
    
    -- Simulate battle processing measurements
    for i = 1, (config.battlesPerUser * config.concurrentUsers) do
        local responseTime = 100 + math.random(-30, 80) -- Simulated response time
        if architecture == "distributed" then
            responseTime = responseTime + 15 -- Add distributed overhead
        end
        
        table.insert(result.measurements, {
            timestamp = 0 + i,
            responseTime = responseTime,
            success = math.random() > 0.002 -- 0.2% error rate
        })
    end
    
    -- Calculate metrics from measurements
    PerformanceBenchmarkingFramework.calculateMetricsFromMeasurements(result)
    
    return result
end

function PerformanceBenchmarkingFramework.executePokemonStateBenchmark(architecture, config)
    local result = {
        metrics = {
            responseTime = { min = 8, max = 45, average = 18, p95 = 35, p99 = 42 },
            throughput = { average = 55.6, peak = 78.2 },
            resourceUsage = { cpu = 20, memory = 25 },
            errorRate = 0.05,
            concurrency = 1
        },
        measurements = {}
    }
    
    -- Simulate Pokemon state operations
    for i = 1, config.operations do
        local responseTime = 15 + math.random(-7, 20)
        if architecture == "distributed" then
            responseTime = responseTime + 3 -- Minimal distributed overhead for state ops
        end
        
        table.insert(result.measurements, {
            timestamp = 0 + (i / 10),
            responseTime = responseTime,
            success = math.random() > 0.0005
        })
    end
    
    PerformanceBenchmarkingFramework.calculateMetricsFromMeasurements(result)
    return result
end

function PerformanceBenchmarkingFramework.executeShopBenchmark(architecture, config)
    local result = {
        metrics = {
            responseTime = { min = 25, max = 120, average = 55, p95 = 95, p99 = 115 },
            throughput = { average = 18.2, peak = 25.8 },
            resourceUsage = { cpu = 25, memory = 20 },
            errorRate = 0.15,
            concurrency = 1
        },
        measurements = {}
    }
    
    -- Simulate shop transactions
    local totalTransactions = config.transactionsPerSecond * config.duration
    for i = 1, totalTransactions do
        local responseTime = 50 + math.random(-15, 40)
        if architecture == "distributed" then
            responseTime = responseTime + 8 -- Transaction coordination overhead
        end
        
        table.insert(result.measurements, {
            timestamp = 0 + (i / config.transactionsPerSecond),
            responseTime = responseTime,
            success = math.random() > 0.0015
        })
    end
    
    PerformanceBenchmarkingFramework.calculateMetricsFromMeasurements(result)
    return result
end

function PerformanceBenchmarkingFramework.executeMemoryBenchmark(architecture, config)
    local result = {
        metrics = {
            responseTime = { min = 10, max = 200, average = 75, p95 = 150, p99 = 180 },
            throughput = { average = 13.3, peak = 20.1 },
            resourceUsage = { 
                cpu = architecture == "distributed" and 28 or 35,
                memory = architecture == "distributed" and 85 or 120 -- Distributed uses less memory per process
            },
            errorRate = 0.3,
            concurrency = config.maxLoad / config.loadIncrement
        },
        measurements = {}
    }
    
    -- Simulate memory load testing
    for load = config.loadIncrement, config.maxLoad, config.loadIncrement do
        local responseTime = 50 + (load / 10) -- Response time increases with load
        
        table.insert(result.measurements, {
            timestamp = 0 + load,
            responseTime = responseTime,
            memoryUsage = (load / 10) + (architecture == "distributed" and -15 or 0),
            success = math.random() > (load / config.maxLoad) * 0.005 -- Error rate increases with load
        })
    end
    
    PerformanceBenchmarkingFramework.calculateMetricsFromMeasurements(result)
    return result
end

function PerformanceBenchmarkingFramework.executeScalabilityBenchmark(architecture, config)
    local result = {
        metrics = {
            responseTime = { min = 80, max = 2500, average = 450, p95 = 1200, p99 = 2000 },
            throughput = { average = 125.6, peak = 485.2 },
            resourceUsage = { cpu = 55, memory = 180 },
            errorRate = 1.2,
            concurrency = config.maxUsers
        },
        measurements = {}
    }
    
    -- Simulate scalability testing with increasing users
    for users = config.startUsers, config.maxUsers, config.incrementStep do
        local responseTime = 100 + (users * 2) -- Response time increases with user count
        local errorRate = math.max(0, (users - 100) / config.maxUsers) * 0.02 -- Error rate increases at scale
        
        table.insert(result.measurements, {
            timestamp = 0 + (users / config.incrementStep) * config.stepDuration,
            responseTime = responseTime,
            users = users,
            success = math.random() > errorRate
        })
    end
    
    PerformanceBenchmarkingFramework.calculateMetricsFromMeasurements(result)
    return result
end

function PerformanceBenchmarkingFramework.calculateMetricsFromMeasurements(result)
    if not result.measurements or #result.measurements == 0 then
        return
    end
    
    local responseTimes = {}
    local successCount = 0
    
    for _, measurement in ipairs(result.measurements) do
        table.insert(responseTimes, measurement.responseTime)
        if measurement.success then
            successCount = successCount + 1
        end
    end
    
    -- Sort response times for percentile calculation
    table.sort(responseTimes)
    
    local count = #responseTimes
    result.metrics.responseTime.min = responseTimes[1]
    result.metrics.responseTime.max = responseTimes[count]
    
    -- Calculate average
    local sum = 0
    for _, rt in ipairs(responseTimes) do
        sum = sum + rt
    end
    result.metrics.responseTime.average = sum / count
    
    -- Calculate percentiles
    local p95Index = math.ceil(count * 0.95)
    local p99Index = math.ceil(count * 0.99)
    result.metrics.responseTime.p95 = responseTimes[p95Index]
    result.metrics.responseTime.p99 = responseTimes[p99Index]
    
    -- Calculate error rate
    result.metrics.errorRate = ((count - successCount) / count) * 100
    
    -- Calculate throughput (requests per second)
    if result.measurements[count] and result.measurements[1] then
        local duration = result.measurements[count].timestamp - result.measurements[1].timestamp
        if duration > 0 then
            result.metrics.throughput.average = count / duration
        end
    end
end

function PerformanceBenchmarkingFramework.compareArchitecturePerformance(monolithicResult, distributedResult)
    local comparison = {
        responseTimeComparison = { delta = 0, percentChange = 0, significance = "NONE" },
        throughputComparison = { delta = 0, percentChange = 0, significance = "NONE" },
        resourceUsageComparison = { 
            cpu = { delta = 0, percentChange = 0 },
            memory = { delta = 0, percentChange = 0 }
        },
        errorRateComparison = { delta = 0, percentChange = 0, significance = "NONE" },
        overallAssessment = "EQUIVALENT"
    }
    
    if not monolithicResult or not distributedResult then
        return comparison
    end
    
    local monoMetrics = monolithicResult.metrics
    local distMetrics = distributedResult.metrics
    
    -- Response time comparison
    if monoMetrics.responseTime and distMetrics.responseTime then
        local delta = distMetrics.responseTime.average - monoMetrics.responseTime.average
        local percentChange = (delta / monoMetrics.responseTime.average) * 100
        
        comparison.responseTimeComparison = {
            delta = delta,
            percentChange = percentChange,
            significance = math.abs(percentChange) > 20 and "SIGNIFICANT" or 
                          math.abs(percentChange) > 10 and "MODERATE" or "MINOR"
        }
    end
    
    -- Throughput comparison
    if monoMetrics.throughput and distMetrics.throughput then
        local delta = distMetrics.throughput.average - monoMetrics.throughput.average
        local percentChange = (delta / monoMetrics.throughput.average) * 100
        
        comparison.throughputComparison = {
            delta = delta,
            percentChange = percentChange,
            significance = math.abs(percentChange) > 15 and "SIGNIFICANT" or
                          math.abs(percentChange) > 8 and "MODERATE" or "MINOR"
        }
    end
    
    -- Resource usage comparison
    if monoMetrics.resourceUsage and distMetrics.resourceUsage then
        local cpuDelta = distMetrics.resourceUsage.cpu - monoMetrics.resourceUsage.cpu
        local memoryDelta = distMetrics.resourceUsage.memory - monoMetrics.resourceUsage.memory
        
        comparison.resourceUsageComparison = {
            cpu = {
                delta = cpuDelta,
                percentChange = (cpuDelta / monoMetrics.resourceUsage.cpu) * 100
            },
            memory = {
                delta = memoryDelta,
                percentChange = (memoryDelta / monoMetrics.resourceUsage.memory) * 100
            }
        }
    end
    
    -- Overall assessment
    local rtSignificance = comparison.responseTimeComparison.significance
    local tpSignificance = comparison.throughputComparison.significance
    
    if rtSignificance == "SIGNIFICANT" or tpSignificance == "SIGNIFICANT" then
        comparison.overallAssessment = "SIGNIFICANT_DIFFERENCE"
    elseif rtSignificance == "MODERATE" or tpSignificance == "MODERATE" then
        comparison.overallAssessment = "MODERATE_DIFFERENCE"
    else
        comparison.overallAssessment = "EQUIVALENT"
    end
    
    return comparison
end

function PerformanceBenchmarkingFramework.analyzePerformanceResults()
    benchmarkState.performanceMetrics = {
        overallPerformance = { monolithic = 0, distributed = 0 },
        categoryBreakdown = {},
        trendAnalysis = {},
        performanceProfile = {}
    }
    
    local monoTotal, distTotal = 0, 0
    local monoCount, distCount = 0, 0
    
    for _, result in ipairs(benchmarkState.benchmarkResults) do
        -- Analyze category performance
        if not benchmarkState.performanceMetrics.categoryBreakdown[result.category] then
            benchmarkState.performanceMetrics.categoryBreakdown[result.category] = {
                monolithic = { avgResponseTime = 0, avgThroughput = 0, count = 0 },
                distributed = { avgResponseTime = 0, avgThroughput = 0, count = 0 }
            }
        end
        
        local categoryData = benchmarkState.performanceMetrics.categoryBreakdown[result.category]
        
        for arch, archResult in pairs(result.architectureResults) do
            if archResult.status == "COMPLETED" and archResult.metrics then
                local responseTime = archResult.metrics.responseTime.average
                local throughput = archResult.metrics.throughput.average
                
                categoryData[arch].avgResponseTime = 
                    (categoryData[arch].avgResponseTime * categoryData[arch].count + responseTime) / 
                    (categoryData[arch].count + 1)
                
                categoryData[arch].avgThroughput = 
                    (categoryData[arch].avgThroughput * categoryData[arch].count + throughput) / 
                    (categoryData[arch].count + 1)
                
                categoryData[arch].count = categoryData[arch].count + 1
                
                -- Overall performance scoring (lower response time = better)
                local performanceScore = 1000 / responseTime + throughput
                
                if arch == "monolithic" then
                    monoTotal = monoTotal + performanceScore
                    monoCount = monoCount + 1
                elseif arch == "distributed" then
                    distTotal = distTotal + performanceScore
                    distCount = distCount + 1
                end
            end
        end
    end
    
    -- Calculate overall performance scores
    if monoCount > 0 then
        benchmarkState.performanceMetrics.overallPerformance.monolithic = monoTotal / monoCount
    end
    if distCount > 0 then
        benchmarkState.performanceMetrics.overallPerformance.distributed = distTotal / distCount
    end
    
    print("[PERFORMANCE_BENCHMARK] Performance analysis completed")
end

function PerformanceBenchmarkingFramework.detectPerformanceRegressions()
    benchmarkState.regressionAlerts = {}
    
    for _, result in ipairs(benchmarkState.benchmarkResults) do
        if result.performanceComparison then
            local comparison = result.performanceComparison
            
            -- Check for response time regressions
            if comparison.responseTimeComparison and comparison.responseTimeComparison.percentChange > 20 then
                table.insert(benchmarkState.regressionAlerts, {
                    scenario = result.scenarioName,
                    type = "RESPONSE_TIME_REGRESSION",
                    severity = "WARNING",
                    details = string.format("Response time increased by %.1f%%", 
                        comparison.responseTimeComparison.percentChange),
                    threshold = 20
                })
            end
            
            -- Check for throughput regressions
            if comparison.throughputComparison and comparison.throughputComparison.percentChange < -15 then
                table.insert(benchmarkState.regressionAlerts, {
                    scenario = result.scenarioName,
                    type = "THROUGHPUT_REGRESSION",
                    severity = "WARNING", 
                    details = string.format("Throughput decreased by %.1f%%", 
                        math.abs(comparison.throughputComparison.percentChange)),
                    threshold = 15
                })
            end
            
            -- Check for significant differences
            if comparison.overallAssessment == "SIGNIFICANT_DIFFERENCE" then
                table.insert(benchmarkState.regressionAlerts, {
                    scenario = result.scenarioName,
                    type = "SIGNIFICANT_PERFORMANCE_DIFFERENCE",
                    severity = "INFO",
                    details = "Significant performance difference detected between architectures",
                    assessment = comparison.overallAssessment
                })
            end
        end
    end
    
    if #benchmarkState.regressionAlerts > 0 then
        print("[PERFORMANCE_BENCHMARK] Performance regression alerts: " .. #benchmarkState.regressionAlerts)
    else
        print("[PERFORMANCE_BENCHMARK] No performance regressions detected")
    end
end

function PerformanceBenchmarkingFramework.generateBenchmarkReport()
    local report = {
        sessionId = benchmarkState.currentSession,
        reportTimestamp = 0,
        executionSummary = {
            startTime = benchmarkState.startTime,
            endTime = benchmarkState.endTime,
            totalDuration = benchmarkState.endTime - benchmarkState.startTime,
            totalBenchmarks = benchmarkState.totalBenchmarks,
            completedBenchmarks = benchmarkState.completedBenchmarks,
            successRate = (benchmarkState.completedBenchmarks / benchmarkState.totalBenchmarks) * 100
        },
        performanceMetrics = benchmarkState.performanceMetrics,
        benchmarkResults = benchmarkState.benchmarkResults,
        comparisonResults = benchmarkState.comparisonResults,
        regressionAlerts = benchmarkState.regressionAlerts,
        recommendations = PerformanceBenchmarkingFramework.generatePerformanceRecommendations()
    }
    
    return report
end

function PerformanceBenchmarkingFramework.generatePerformanceRecommendations()
    local recommendations = {}
    
    -- Analyze overall performance
    local overallPerf = benchmarkState.performanceMetrics.overallPerformance
    if overallPerf.monolithic > 0 and overallPerf.distributed > 0 then
        local perfDiff = ((overallPerf.distributed - overallPerf.monolithic) / overallPerf.monolithic) * 100
        
        if perfDiff < -10 then
            table.insert(recommendations, {
                priority = "HIGH",
                category = "PERFORMANCE_OPTIMIZATION",
                action = "Distributed architecture shows performance degradation. Investigate inter-process communication overhead."
            })
        elseif perfDiff > 10 then
            table.insert(recommendations, {
                priority = "INFO",
                category = "PERFORMANCE_GAIN",
                action = "Distributed architecture shows performance improvement. Consider migration benefits."
            })
        end
    end
    
    -- Check regression alerts
    if #benchmarkState.regressionAlerts > 0 then
        table.insert(recommendations, {
            priority = "MEDIUM",
            category = "REGRESSION_ANALYSIS",
            action = string.format("Address %d performance regression alerts before migration.", 
                #benchmarkState.regressionAlerts)
        })
    end
    
    -- Resource utilization recommendations
    for category, data in pairs(benchmarkState.performanceMetrics.categoryBreakdown) do
        if data.distributed.count > 0 and data.monolithic.count > 0 then
            if data.distributed.avgResponseTime > data.monolithic.avgResponseTime * 1.5 then
                table.insert(recommendations, {
                    priority = "MEDIUM",
                    category = "RESPONSE_TIME_OPTIMIZATION",
                    action = string.format("Optimize %s response times in distributed architecture.", category)
                })
            end
        end
    end
    
    return recommendations
end

function PerformanceBenchmarkingFramework.exportBenchmarkReport(report, format)
    format = format or "SUMMARY"
    
    if format == "JSON" then
        return json.encode(report)
    elseif format == "SUMMARY" then
        local summary = string.format([[
=== PERFORMANCE BENCHMARKING REPORT ===
Session ID: %s
Report Generated: %s

Execution Summary:
- Duration: %d seconds
- Benchmarks: %d/%d (%.1f%% success rate)
- Regression Alerts: %d

Performance Overview:
- Monolithic Performance Score: %.1f
- Distributed Performance Score: %.1f
- Performance Delta: %.1f%%

Status: %s
]], 
            report.sessionId,
            os.date("%Y-%m-%d %H:%M:%S", report.reportTimestamp),
            report.executionSummary.totalDuration,
            report.executionSummary.completedBenchmarks,
            report.executionSummary.totalBenchmarks,
            report.executionSummary.successRate,
            #report.regressionAlerts,
            report.performanceMetrics.overallPerformance.monolithic,
            report.performanceMetrics.overallPerformance.distributed,
            report.performanceMetrics.overallPerformance.distributed > 0 and 
                ((report.performanceMetrics.overallPerformance.distributed - 
                  report.performanceMetrics.overallPerformance.monolithic) / 
                 report.performanceMetrics.overallPerformance.monolithic) * 100 or 0,
            #report.regressionAlerts == 0 and "PASSED" or "PERFORMANCE_ISSUES_DETECTED"
        )
        
        if #report.recommendations > 0 then
            summary = summary .. "\nRecommendations:\n"
            for _, rec in ipairs(report.recommendations) do
                summary = summary .. string.format("- [%s] %s\n", rec.priority, rec.action)
            end
        end
        
        return summary
    end
    
    return tostring(report)
end

return PerformanceBenchmarkingFramework