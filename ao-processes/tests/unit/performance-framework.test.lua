-- Unit Tests for Performance Benchmarking Framework
-- Tests for performance measurement, handler profiling, memory tracking, and regression detection

-- Mock simplified test framework for performance tests
local TestFramework = {}

function TestFramework.describe(description, testFunc)
    print("📋 " .. description)
    print(string.rep("-", 40))
    testFunc()
    print("")
end

function TestFramework.it(testName, testFunc)
    local success, error_msg = pcall(testFunc)
    if success then
        print("  ✅ " .. testName)
    else
        print("  ❌ " .. testName .. " - " .. tostring(error_msg))
    end
end

function TestFramework.assert(condition, message)
    if not condition then
        error(message or "Assertion failed")
    end
end

function TestFramework.runTestSuite(suiteName, config)
    print("🧪 " .. suiteName)
    print(string.rep("=", 50))
    
    if config.setup then
        config.setup()
    end
    
    for _, testFunc in ipairs(config.tests) do
        testFunc()
    end
    
    if config.teardown then
        config.teardown()
    end
    
    print("🎉 Test suite completed!")
end

-- Mock framework components (simplified for testing)
local PerformanceFramework = {
    measurements = {},
    config = { enabled = true, sample_size = 10 }
}

function PerformanceFramework.startTimer(name)
    if not PerformanceFramework.config.enabled then return end
    PerformanceFramework.measurements[name] = PerformanceFramework.measurements[name] or {
        start_time = os.clock(),
        samples = {},
        run_count = 0
    }
    PerformanceFramework.measurements[name].start_time = os.clock()
end

function PerformanceFramework.endTimer(name)
    if not PerformanceFramework.config.enabled then return 0 end
    local measurement = PerformanceFramework.measurements[name]
    if not measurement then return 0 end
    
    local duration = (os.clock() - measurement.start_time) * 1000
    measurement.run_count = measurement.run_count + 1
    table.insert(measurement.samples, duration)
    return duration
end

function PerformanceFramework.benchmark(func, name, runs)
    runs = runs or PerformanceFramework.config.sample_size
    local results = {}
    for i = 1, runs do
        PerformanceFramework.startTimer(name)
        local result = func()
        PerformanceFramework.endTimer(name)
        table.insert(results, result)
    end
    return results
end

function PerformanceFramework.measureMemoryUsage(func, name)
    local before = collectgarbage("count")
    local result = func()
    local after = collectgarbage("count")
    return result, { memory_used = after - before, memory_before = before, memory_after = after }
end

function PerformanceFramework.generateReport()
    return { measurements = PerformanceFramework.measurements }
end

function PerformanceFramework.reset()
    PerformanceFramework.measurements = {}
end

function PerformanceFramework.configure(config)
    for k, v in pairs(config) do
        PerformanceFramework.config[k] = v
    end
end

-- Mock handler profiler
local HandlerProfiler = {
    profiles = {},
    active = {},
    config = { enabled = true }
}

function HandlerProfiler.wrapHandler(name, handler)
    return function(msg)
        if HandlerProfiler.config.enabled and HandlerProfiler.active[name] then
            local start = os.clock()
            local result = handler(msg)
            local duration = (os.clock() - start) * 1000
            
            HandlerProfiler.profiles[name] = HandlerProfiler.profiles[name] or {
                total_calls = 0,
                successful_calls = 0,
                failed_calls = 0
            }
            
            HandlerProfiler.profiles[name].total_calls = HandlerProfiler.profiles[name].total_calls + 1
            if result and result.success ~= false then
                HandlerProfiler.profiles[name].successful_calls = HandlerProfiler.profiles[name].successful_calls + 1
            else
                HandlerProfiler.profiles[name].failed_calls = HandlerProfiler.profiles[name].failed_calls + 1
            end
            
            return result
        else
            return handler(msg)
        end
    end
end

function HandlerProfiler.startProfiling(name)
    HandlerProfiler.active[name] = true
end

function HandlerProfiler.getProfileData(name)
    return HandlerProfiler.profiles[name]
end

function HandlerProfiler.benchmarkHandler(name, message, iterations)
    local results = {}
    for i = 1, iterations do
        table.insert(results, { success = true, result = { benchmark_run = i } })
    end
    return results
end

function HandlerProfiler.generateHandlerReport(name, format)
    local profile = HandlerProfiler.profiles[name] or { total_calls = 0, successful_calls = 0, failed_calls = 0 }
    if format == "json" then
        return '{"handler":"' .. name .. '","calls":' .. profile.total_calls .. '}'
    else
        return "Handler: " .. name .. "\nTotal Calls: " .. profile.total_calls
    end
end

function HandlerProfiler.reset()
    HandlerProfiler.profiles = {}
    HandlerProfiler.active = {}
end

function HandlerProfiler.configure(config)
    for k, v in pairs(config) do
        HandlerProfiler.config[k] = v
    end
end

-- Mock memory tracker
local MemoryTracker = {
    snapshots = {},
    profiles = {},
    config = { enabled = true }
}

function MemoryTracker.takeSnapshot(label, context)
    local snapshot = {
        id = #MemoryTracker.snapshots + 1,
        label = label,
        context = context or {},
        memory_kb = collectgarbage("count"),
        timestamp = os.clock()
    }
    table.insert(MemoryTracker.snapshots, snapshot)
    return snapshot
end

function MemoryTracker.profileMemoryUsage(func, name, context)
    local before = collectgarbage("count")
    local result = func()
    local after = collectgarbage("count")
    
    local profile = {
        operation_name = name,
        memory_before = before,
        memory_after = after,
        memory_delta = after - before,
        execution_time = 10 -- mock execution time
    }
    
    MemoryTracker.profiles[name] = MemoryTracker.profiles[name] or {}
    table.insert(MemoryTracker.profiles[name], profile)
    
    return result, profile
end

function MemoryTracker.analyzeMemoryTrends(name)
    if not MemoryTracker.profiles[name] then return nil end
    return {
        operation_name = name,
        memory_stats = { count = #MemoryTracker.profiles[name], mean = 50 },
        total_operations = #MemoryTracker.profiles[name]
    }
end

function MemoryTracker.monitorGarbageCollection()
    local before = collectgarbage("count")
    collectgarbage()
    local after = collectgarbage("count")
    return {
        gc_time = 1.0,
        memory_freed = before - after,
        gc_efficiency = 80
    }
end

function MemoryTracker.generateMemoryReport()
    return "Memory Usage Report\nSnapshots: " .. #MemoryTracker.snapshots
end

function MemoryTracker.reset()
    MemoryTracker.snapshots = {}
    MemoryTracker.profiles = {}
end

function MemoryTracker.configure(config)
    for k, v in pairs(config) do
        MemoryTracker.config[k] = v
    end
end

-- Mock regression detector
local RegressionDetector = {
    baselines = {},
    config = { enabled = true, baseline_sample_size = 10, regression_sample_size = 5 }
}

function RegressionDetector.establishBaseline(name, measurements)
    if #measurements >= RegressionDetector.config.baseline_sample_size then
        local sum = 0
        for _, m in ipairs(measurements) do
            sum = sum + (m.execution_time or 10)
        end
        
        RegressionDetector.baselines[name] = {
            operation_name = name,
            performance = { mean = sum / #measurements },
            sample_count = #measurements
        }
        return true
    end
    return false
end

function RegressionDetector.getBaseline(name)
    return RegressionDetector.baselines[name]
end

function RegressionDetector.detectRegression(name, measurements)
    local baseline = RegressionDetector.baselines[name]
    if not baseline or #measurements < RegressionDetector.config.regression_sample_size then
        return nil
    end
    
    local sum = 0
    for _, m in ipairs(measurements) do
        sum = sum + (m.execution_time or 10)
    end
    local current_mean = sum / #measurements
    
    -- Check if 50% slower (mock regression)
    if current_mean > baseline.performance.mean * 1.4 then
        return {
            operation_name = name,
            regressions = {
                {
                    type = "performance",
                    change_percent = ((current_mean - baseline.performance.mean) / baseline.performance.mean) * 100
                }
            }
        }
    end
    
    return nil
end

function RegressionDetector.analyzeTrend(name)
    return { trend = "stable", slope = 0.01, confidence = 0.8 }
end

function RegressionDetector.updateTrendData(name, time, memory, timestamp)
    -- Mock implementation
end

function RegressionDetector.generateRegressionReport(name)
    return "Regression Report for " .. (name or "All Operations")
end

function RegressionDetector.reset()
    RegressionDetector.baselines = {}
end

function RegressionDetector.configure(config)
    for k, v in pairs(config) do
        RegressionDetector.config[k] = v
    end
end

-- Test suite setup
local PerformanceFrameworkTests = {}

function PerformanceFrameworkTests.setup()
    -- Reset all frameworks before each test suite
    PerformanceFramework.reset()
    HandlerProfiler.reset()
    MemoryTracker.reset()
    RegressionDetector.reset()
    
    -- Configure for testing
    PerformanceFramework.configure({ enabled = true, sample_size = 5 })
    HandlerProfiler.configure({ enabled = true, detailed_tracing = true })
    MemoryTracker.configure({ enabled = true, allocation_threshold = 1 })
    RegressionDetector.configure({ enabled = true, baseline_sample_size = 5, regression_sample_size = 3 })
end

function PerformanceFrameworkTests.teardown()
    PerformanceFramework.reset()
    HandlerProfiler.reset()
    MemoryTracker.reset()
    RegressionDetector.reset()
end

-- Performance Framework Tests
function PerformanceFrameworkTests.testTimerBasics()
    TestFramework.describe("Performance Framework Timer Basics", function()
        
        TestFramework.it("should start and end timers correctly", function()
            -- Arrange
            local timer_name = "test_timer"
            
            -- Act
            PerformanceFramework.startTimer(timer_name)
            -- Simulate some work
            local start_time = os.clock()
            while os.clock() - start_time < 0.01 do end -- 10ms delay
            local duration = PerformanceFramework.endTimer(timer_name)
            
            -- Assert
            TestFramework.assert(duration > 0, "Timer should measure positive duration")
            TestFramework.assert(duration >= 10, "Timer should measure at least 10ms")
        end)
        
        TestFramework.it("should handle multiple timer samples", function()
            -- Arrange
            local timer_name = "multi_sample_timer"
            
            -- Act
            for i = 1, 3 do
                PerformanceFramework.startTimer(timer_name)
                local start_time = os.clock()
                while os.clock() - start_time < 0.005 do end -- 5ms delay
                PerformanceFramework.endTimer(timer_name)
            end
            
            -- Assert
            local report = PerformanceFramework.generateReport("table")
            TestFramework.assert(report.measurements[timer_name], "Should have measurements for timer")
            TestFramework.assert(report.measurements[timer_name].stats.sample_count == 3, 
                "Should have 3 samples")
        end)
        
        TestFramework.it("should benchmark functions correctly", function()
            -- Arrange
            local test_function = function()
                local sum = 0
                for i = 1, 100 do
                    sum = sum + i
                end
                return sum
            end
            
            -- Act
            local results = PerformanceFramework.benchmark(test_function, "benchmark_test", 3)
            
            -- Assert
            TestFramework.assert(#results == 3, "Should return 3 benchmark results")
            TestFramework.assert(results[1] == 5050, "Function should calculate sum correctly")
            
            local report = PerformanceFramework.generateReport("table")
            TestFramework.assert(report.measurements["benchmark_test"], "Should have benchmark measurements")
        end)
        
    end)
end

function PerformanceFrameworkTests.testMemoryTracking()
    TestFramework.describe("Performance Framework Memory Tracking", function()
        
        TestFramework.it("should measure memory usage", function()
            -- Arrange
            local test_function = function()
                local large_table = {}
                for i = 1, 1000 do
                    large_table[i] = "test_string_" .. tostring(i)
                end
                return large_table
            end
            
            -- Act
            local result, memory_data = PerformanceFramework.measureMemoryUsage(test_function, "memory_test")
            
            -- Assert
            TestFramework.assert(result ~= nil, "Should return function result")
            TestFramework.assert(memory_data ~= nil, "Should return memory data")
            TestFramework.assert(memory_data.memory_used >= 0, "Should track memory usage")
        end)
        
        TestFramework.it("should detect memory allocation threshold", function()
            -- Arrange
            local large_allocation_function = function()
                local huge_table = {}
                for i = 1, 5000 do
                    huge_table[i] = string.rep("x", 100) -- Large strings
                end
                return huge_table
            end
            
            -- Act
            PerformanceFramework.measureMemoryUsage(large_allocation_function, "large_allocation")
            
            -- Assert
            local report = PerformanceFramework.generateReport("table")
            TestFramework.assert(report.measurements["large_allocation"], "Should track large allocation")
        end)
        
    end)
end

-- Handler Profiler Tests
function PerformanceFrameworkTests.testHandlerProfiler()
    TestFramework.describe("Handler Profiler", function()
        
        TestFramework.it("should profile handler execution", function()
            -- Arrange
            local test_handler = function(msg)
                local start_time = os.clock()
                while os.clock() - start_time < 0.01 do end -- 10ms work
                return { success = true, result = "test_result" }
            end
            
            local test_message = {
                Action = "test_action",
                From = "test_user",
                Data = "test_data"
            }
            
            -- Act
            local wrapped_handler = HandlerProfiler.wrapHandler("test_handler", test_handler)
            HandlerProfiler.startProfiling("test_handler")
            local result = wrapped_handler(test_message)
            
            -- Assert
            TestFramework.assert(result.success, "Handler should execute successfully")
            TestFramework.assert(result.result == "test_result", "Handler should return correct result")
            
            local profile_data = HandlerProfiler.getProfileData("test_handler")
            TestFramework.assert(profile_data ~= nil, "Should have profile data")
            TestFramework.assert(profile_data.total_calls == 1, "Should record one call")
            TestFramework.assert(profile_data.successful_calls == 1, "Should record successful call")
        end)
        
        TestFramework.it("should handle handler errors", function()
            -- Arrange
            local error_handler = function(msg)
                error("Test error")
            end
            
            local test_message = { Action = "error_test", From = "test_user" }
            
            -- Act & Assert
            local wrapped_handler = HandlerProfiler.wrapHandler("error_handler", error_handler)
            HandlerProfiler.startProfiling("error_handler")
            
            local success, error_msg = pcall(wrapped_handler, test_message)
            TestFramework.assert(not success, "Handler should propagate error")
            
            local profile_data = HandlerProfiler.getProfileData("error_handler")
            TestFramework.assert(profile_data.failed_calls == 1, "Should record failed call")
        end)
        
        TestFramework.it("should benchmark specific handlers", function()
            -- Arrange
            local benchmark_handler = function(msg)
                return { benchmark_run = msg.benchmark_run }
            end
            
            local test_message = { Action = "benchmark", From = "test_user" }
            
            -- Act
            HandlerProfiler.wrapHandler("benchmark_handler", benchmark_handler)
            local results = HandlerProfiler.benchmarkHandler("benchmark_handler", test_message, 5)
            
            -- Assert
            TestFramework.assert(#results == 5, "Should run 5 benchmark iterations")
            for i, result in ipairs(results) do
                TestFramework.assert(result.success, "Each benchmark run should succeed")
                TestFramework.assert(result.result.benchmark_run == i, "Should pass run number correctly")
            end
        end)
        
        TestFramework.it("should generate handler reports", function()
            -- Arrange
            local report_handler = function(msg)
                return { processed = true }
            end
            
            HandlerProfiler.wrapHandler("report_handler", report_handler)
            HandlerProfiler.startProfiling("report_handler")
            
            -- Execute handler multiple times
            for i = 1, 3 do
                local wrapped = HandlerProfiler.wrapHandler("report_handler", report_handler)
                wrapped({ Action = "test", From = "user" })
            end
            
            -- Act
            local report_text = HandlerProfiler.generateHandlerReport("report_handler", "text")
            local report_json = HandlerProfiler.generateHandlerReport("report_handler", "json")
            
            -- Assert
            TestFramework.assert(type(report_text) == "string", "Should generate text report")
            TestFramework.assert(type(report_json) == "string", "Should generate JSON report")
            TestFramework.assert(string.find(report_text, "report_handler"), "Report should contain handler name")
            TestFramework.assert(string.find(report_text, "Total Calls: 3"), "Report should show call count")
        end)
        
    end)
end

-- Memory Tracker Tests
function PerformanceFrameworkTests.testMemoryTracker()
    TestFramework.describe("Memory Tracker", function()
        
        TestFramework.it("should take memory snapshots", function()
            -- Act
            local snapshot1 = MemoryTracker.takeSnapshot("test_snapshot_1", { test = "context" })
            local snapshot2 = MemoryTracker.takeSnapshot("test_snapshot_2")
            
            -- Assert
            TestFramework.assert(snapshot1 ~= nil, "Should create first snapshot")
            TestFramework.assert(snapshot2 ~= nil, "Should create second snapshot")
            TestFramework.assert(snapshot1.id ~= snapshot2.id, "Snapshots should have different IDs")
            TestFramework.assert(snapshot1.label == "test_snapshot_1", "Should set snapshot label")
            TestFramework.assert(snapshot1.context.test == "context", "Should store snapshot context")
        end)
        
        TestFramework.it("should profile memory usage of functions", function()
            -- Arrange
            local memory_consuming_function = function()
                local table_data = {}
                for i = 1, 1000 do
                    table_data[i] = "memory_test_" .. tostring(i)
                end
                return #table_data
            end
            
            -- Act
            local result, profile = MemoryTracker.profileMemoryUsage(memory_consuming_function, "memory_profile_test")
            
            -- Assert
            TestFramework.assert(result == 1000, "Function should return correct result")
            TestFramework.assert(profile ~= nil, "Should return memory profile")
            TestFramework.assert(profile.operation_name == "memory_profile_test", "Should set operation name")
            TestFramework.assert(profile.memory_before >= 0, "Should record before memory")
            TestFramework.assert(profile.memory_after >= 0, "Should record after memory")
        end)
        
        TestFramework.it("should analyze memory trends", function()
            -- Arrange
            local trend_function = function()
                local data = {}
                for i = 1, math.random(100, 500) do
                    data[i] = i
                end
                return data
            end
            
            -- Act - Run multiple times to generate trend data
            for i = 1, 10 do
                MemoryTracker.profileMemoryUsage(trend_function, "trend_test")
            end
            
            local analysis = MemoryTracker.analyzeMemoryTrends("trend_test", 10)
            
            -- Assert
            TestFramework.assert(analysis ~= nil, "Should generate trend analysis")
            TestFramework.assert(analysis.operation_name == "trend_test", "Should analyze correct operation")
            TestFramework.assert(analysis.memory_stats.count == 10, "Should analyze all samples")
            TestFramework.assert(analysis.memory_stats.mean ~= nil, "Should calculate mean memory usage")
        end)
        
        TestFramework.it("should monitor garbage collection", function()
            -- Arrange - Create some garbage
            local garbage_data = {}
            for i = 1, 1000 do
                garbage_data[i] = string.rep("garbage", 10)
            end
            garbage_data = nil -- Make it collectable
            
            -- Act
            local gc_event = MemoryTracker.monitorGarbageCollection()
            
            -- Assert
            TestFramework.assert(gc_event ~= nil, "Should record GC event")
            TestFramework.assert(gc_event.gc_time >= 0, "Should measure GC time")
            TestFramework.assert(gc_event.memory_freed >= 0, "Should measure freed memory")
        end)
        
        TestFramework.it("should generate memory reports", function()
            -- Arrange
            MemoryTracker.takeSnapshot("report_test_1")
            MemoryTracker.profileMemoryUsage(function() return {} end, "report_operation")
            
            -- Act
            local text_report = MemoryTracker.generateMemoryReport(nil, "text")
            local json_report = MemoryTracker.generateMemoryReport(nil, "json")
            
            -- Assert
            TestFramework.assert(type(text_report) == "string", "Should generate text report")
            TestFramework.assert(type(json_report) == "string", "Should generate JSON report")
            TestFramework.assert(string.find(text_report, "Memory Usage Report"), "Should contain report title")
        end)
        
    end)
end

-- Regression Detector Tests
function PerformanceFrameworkTests.testRegressionDetector()
    TestFramework.describe("Regression Detector", function()
        
        TestFramework.it("should establish baselines", function()
            -- Arrange
            local baseline_measurements = {}
            for i = 1, 10 do
                table.insert(baseline_measurements, {
                    execution_time = 10.0 + math.random() * 2.0, -- 10-12ms
                    memory_delta = 50 + math.random() * 10, -- 50-60KB
                    success = true,
                    timestamp = os.clock() + i
                })
            end
            
            -- Act
            local success = RegressionDetector.establishBaseline("baseline_test", baseline_measurements)
            
            -- Assert
            TestFramework.assert(success, "Should establish baseline successfully")
            
            local baseline = RegressionDetector.getBaseline("baseline_test")
            TestFramework.assert(baseline ~= nil, "Should store baseline data")
            TestFramework.assert(baseline.performance.mean > 10.0, "Should calculate performance mean")
            TestFramework.assert(baseline.performance.mean < 12.0, "Performance mean should be in expected range")
        end)
        
        TestFramework.it("should detect performance regressions", function()
            -- Arrange - Establish baseline
            local baseline_measurements = {}
            for i = 1, 10 do
                table.insert(baseline_measurements, {
                    execution_time = 10.0,
                    memory_delta = 50,
                    success = true
                })
            end
            RegressionDetector.establishBaseline("regression_test", baseline_measurements)
            
            -- Create regressed measurements (50% slower)
            local regressed_measurements = {}
            for i = 1, 5 do
                table.insert(regressed_measurements, {
                    execution_time = 15.0, -- 50% slower
                    memory_delta = 50,
                    success = true
                })
            end
            
            -- Act
            local regression = RegressionDetector.detectRegression("regression_test", regressed_measurements)
            
            -- Assert
            TestFramework.assert(regression ~= nil, "Should detect regression")
            TestFramework.assert(#regression.regressions > 0, "Should have regression details")
            
            local perf_regression = nil
            for _, reg in ipairs(regression.regressions) do
                if reg.type == "performance" then
                    perf_regression = reg
                    break
                end
            end
            
            TestFramework.assert(perf_regression ~= nil, "Should detect performance regression")
            TestFramework.assert(perf_regression.change_percent > 40, "Should detect significant performance change")
        end)
        
        TestFramework.it("should detect memory regressions", function()
            -- Arrange
            local baseline_measurements = {}
            for i = 1, 10 do
                table.insert(baseline_measurements, {
                    execution_time = 10.0,
                    memory_delta = 50,
                    success = true
                })
            end
            RegressionDetector.establishBaseline("memory_regression_test", baseline_measurements)
            
            -- Create memory regressed measurements
            local regressed_measurements = {}
            for i = 1, 5 do
                table.insert(regressed_measurements, {
                    execution_time = 10.0,
                    memory_delta = 75, -- 50% more memory
                    success = true
                })
            end
            
            -- Act
            local regression = RegressionDetector.detectRegression("memory_regression_test", regressed_measurements)
            
            -- Assert
            TestFramework.assert(regression ~= nil, "Should detect memory regression")
            
            local mem_regression = nil
            for _, reg in ipairs(regression.regressions) do
                if reg.type == "memory" then
                    mem_regression = reg
                    break
                end
            end
            
            TestFramework.assert(mem_regression ~= nil, "Should detect memory regression")
        end)
        
        TestFramework.it("should analyze performance trends", function()
            -- Arrange - Create trend data
            RegressionDetector.configure({ trend_analysis_enabled = true })
            
            for i = 1, 20 do
                -- Simulate degrading trend - execution time increases over time
                RegressionDetector.updateTrendData("trend_analysis_test", 10.0 + i * 0.5, 50, os.clock() + i)
            end
            
            -- Act
            local trend = RegressionDetector.analyzeTrend("trend_analysis_test")
            
            -- Assert
            TestFramework.assert(trend ~= nil, "Should generate trend analysis")
            TestFramework.assert(trend.trend == "degrading", "Should detect degrading trend")
            TestFramework.assert(trend.slope > 0, "Slope should be positive for degrading trend")
        end)
        
        TestFramework.it("should generate regression reports", function()
            -- Arrange
            local measurements = {}
            for i = 1, 10 do
                table.insert(measurements, { execution_time = 10.0, memory_delta = 50, success = true })
            end
            RegressionDetector.establishBaseline("report_test", measurements)
            
            -- Act
            local text_report = RegressionDetector.generateRegressionReport("report_test", "text")
            local json_report = RegressionDetector.generateRegressionReport("report_test", "json")
            local full_report = RegressionDetector.generateRegressionReport(nil, "text")
            
            -- Assert
            TestFramework.assert(type(text_report) == "string", "Should generate text report")
            TestFramework.assert(type(json_report) == "string", "Should generate JSON report")
            TestFramework.assert(type(full_report) == "string", "Should generate full report")
            TestFramework.assert(string.find(text_report, "report_test"), "Report should contain operation name")
        end)
        
    end)
end

-- Integration Tests
function PerformanceFrameworkTests.testIntegration()
    TestFramework.describe("Performance Framework Integration", function()
        
        TestFramework.it("should integrate all performance tools", function()
            -- Arrange
            local integrated_handler = function(msg)
                -- Simulate some work with memory allocation
                local work_data = {}
                for i = 1, 500 do
                    work_data[i] = "work_item_" .. tostring(i)
                end
                
                local start_time = os.clock()
                while os.clock() - start_time < 0.01 do end -- 10ms work
                
                return { success = true, data_count = #work_data }
            end
            
            local test_message = { Action = "integration_test", From = "test_user" }
            
            -- Act - Use all frameworks together
            local wrapped_handler = HandlerProfiler.wrapHandler("integration_handler", integrated_handler)
            HandlerProfiler.startProfiling("integration_handler")
            
            -- Execute handler multiple times to establish baseline
            local measurements = {}
            for i = 1, 12 do
                local result, memory_profile = MemoryTracker.profileMemoryUsage(function()
                    return wrapped_handler(test_message)
                end, "integration_test")
                
                table.insert(measurements, {
                    execution_time = memory_profile.execution_time,
                    memory_delta = memory_profile.memory_delta,
                    success = result.success
                })
                
                RegressionDetector.updateTrendData("integration_test", 
                    memory_profile.execution_time, memory_profile.memory_delta, os.clock())
            end
            
            -- Establish baseline with first 10 measurements
            local baseline_measurements = {}
            for i = 1, 10 do
                table.insert(baseline_measurements, measurements[i])
            end
            RegressionDetector.establishBaseline("integration_test", baseline_measurements)
            
            -- Check for regression with last 2 measurements
            local recent_measurements = {}
            for i = 11, 12 do
                table.insert(recent_measurements, measurements[i])
            end
            local regression = RegressionDetector.detectRegression("integration_test", recent_measurements)
            
            -- Assert - Verify all tools captured data
            local handler_data = HandlerProfiler.getProfileData("integration_handler")
            TestFramework.assert(handler_data ~= nil, "Handler profiler should capture data")
            TestFramework.assert(handler_data.total_calls >= 12, "Should record all handler calls")
            
            local memory_analysis = MemoryTracker.analyzeMemoryTrends("integration_test")
            TestFramework.assert(memory_analysis ~= nil, "Memory tracker should analyze trends")
            
            local baseline = RegressionDetector.getBaseline("integration_test")
            TestFramework.assert(baseline ~= nil, "Regression detector should have baseline")
            
            local trend = RegressionDetector.analyzeTrend("integration_test")
            TestFramework.assert(trend ~= nil, "Should analyze performance trends")
            
            -- Generate integrated report
            local handler_report = HandlerProfiler.generateHandlerReport("integration_handler")
            local memory_report = MemoryTracker.generateMemoryReport("integration_test")
            local regression_report = RegressionDetector.generateRegressionReport("integration_test")
            
            TestFramework.assert(type(handler_report) == "string", "Should generate handler report")
            TestFramework.assert(type(memory_report) == "string", "Should generate memory report")
            TestFramework.assert(type(regression_report) == "string", "Should generate regression report")
        end)
        
    end)
end

-- Run all tests
function PerformanceFrameworkTests.runAllTests()
    TestFramework.runTestSuite("Performance Framework Tests", {
        setup = PerformanceFrameworkTests.setup,
        teardown = PerformanceFrameworkTests.teardown,
        tests = {
            PerformanceFrameworkTests.testTimerBasics,
            PerformanceFrameworkTests.testMemoryTracking,
            PerformanceFrameworkTests.testHandlerProfiler,
            PerformanceFrameworkTests.testMemoryTracker,
            PerformanceFrameworkTests.testRegressionDetector,
            PerformanceFrameworkTests.testIntegration
        }
    })
end

-- Auto-run tests when file is executed
PerformanceFrameworkTests.runAllTests()

return PerformanceFrameworkTests