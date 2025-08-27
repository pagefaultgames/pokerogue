-- Performance Measurement Framework for AO Process Benchmarking
-- Provides execution time profiling, memory tracking, and regression detection

local PerformanceFramework = {}

-- Performance measurement state
local measurements = {}
local baselines = {}
local regressions = {}

-- Configuration
local config = {
    enabled = true,
    memory_tracking = true,
    regression_threshold = 0.20, -- 20% performance degradation threshold
    sample_size = 10, -- Number of runs for averaging
    report_format = "json" -- json, csv, or text
}

-- Timer utilities using AO's high-precision timing
function PerformanceFramework.startTimer(name)
    if not config.enabled then return end
    
    measurements[name] = measurements[name] or {
        start_time = 0,
        total_time = 0,
        run_count = 0,
        samples = {},
        memory_start = 0,
        memory_peak = 0
    }
    
    measurements[name].start_time = os.clock()
    if config.memory_tracking then
        measurements[name].memory_start = collectgarbage("count")
    end
end

function PerformanceFramework.endTimer(name)
    if not config.enabled or not measurements[name] then return end
    
    local end_time = os.clock()
    local duration = (end_time - measurements[name].start_time) * 1000 -- Convert to milliseconds
    
    measurements[name].total_time = measurements[name].total_time + duration
    measurements[name].run_count = measurements[name].run_count + 1
    table.insert(measurements[name].samples, duration)
    
    if config.memory_tracking then
        local current_memory = collectgarbage("count")
        measurements[name].memory_peak = math.max(measurements[name].memory_peak, current_memory)
    end
    
    return duration
end

-- Memory tracking utilities
function PerformanceFramework.measureMemoryUsage(func, name)
    if not config.enabled then return func() end
    
    local start_memory = collectgarbage("count")
    collectgarbage() -- Force garbage collection for accurate measurement
    local gc_memory = collectgarbage("count")
    
    PerformanceFramework.startTimer(name or "memory_test")
    local result = func()
    PerformanceFramework.endTimer(name or "memory_test")
    
    local end_memory = collectgarbage("count")
    
    local memory_data = {
        start_memory = start_memory,
        gc_memory = gc_memory,
        end_memory = end_memory,
        memory_used = end_memory - gc_memory,
        memory_overhead = start_memory - gc_memory
    }
    
    if measurements[name or "memory_test"] then
        measurements[name or "memory_test"].memory_data = memory_data
    end
    
    return result, memory_data
end

-- Benchmark execution with multiple runs
function PerformanceFramework.benchmark(func, name, runs)
    if not config.enabled then return func() end
    
    runs = runs or config.sample_size
    local results = {}
    
    for i = 1, runs do
        PerformanceFramework.startTimer(name .. "_run_" .. i)
        local result = func()
        PerformanceFramework.endTimer(name .. "_run_" .. i)
        table.insert(results, result)
    end
    
    -- Calculate aggregate statistics
    PerformanceFramework.calculateStats(name, runs)
    
    return results
end

-- Statistical analysis of performance data
function PerformanceFramework.calculateStats(name, runs)
    local total_time = 0
    local samples = {}
    
    -- Collect all samples from individual runs
    for i = 1, runs do
        local run_name = name .. "_run_" .. i
        if measurements[run_name] and #measurements[run_name].samples > 0 then
            for _, sample in ipairs(measurements[run_name].samples) do
                table.insert(samples, sample)
                total_time = total_time + sample
            end
        end
    end
    
    if #samples == 0 then return end
    
    -- Calculate statistics
    table.sort(samples)
    local count = #samples
    local mean = total_time / count
    local median = count % 2 == 0 and (samples[count/2] + samples[count/2 + 1]) / 2 or samples[math.ceil(count/2)]
    local min_time = samples[1]
    local max_time = samples[count]
    local percentile_95 = samples[math.ceil(count * 0.95)]
    
    -- Calculate standard deviation
    local variance_sum = 0
    for _, sample in ipairs(samples) do
        variance_sum = variance_sum + (sample - mean)^2
    end
    local std_dev = math.sqrt(variance_sum / count)
    
    -- Store aggregate measurements
    measurements[name] = {
        samples = samples,
        stats = {
            mean = mean,
            median = median,
            min = min_time,
            max = max_time,
            std_dev = std_dev,
            percentile_95 = percentile_95,
            sample_count = count
        }
    }
end

-- Baseline management for regression detection
function PerformanceFramework.setBaseline(name, value)
    baselines[name] = value or (measurements[name] and measurements[name].stats and measurements[name].stats.mean)
end

function PerformanceFramework.checkRegression(name, current_value)
    if not baselines[name] then return false end
    
    current_value = current_value or (measurements[name] and measurements[name].stats and measurements[name].stats.mean)
    if not current_value then return false end
    
    local regression_ratio = (current_value - baselines[name]) / baselines[name]
    local is_regression = regression_ratio > config.regression_threshold
    
    if is_regression then
        regressions[name] = {
            baseline = baselines[name],
            current = current_value,
            regression_percent = regression_ratio * 100,
            timestamp = os.date("%Y-%m-%d %H:%M:%S")
        }
    end
    
    return is_regression, regression_ratio * 100
end

-- Handler execution profiling
function PerformanceFramework.profileHandler(handler, message, profile_name)
    if not config.enabled then return handler(message) end
    
    profile_name = profile_name or "handler_execution"
    
    return PerformanceFramework.measureMemoryUsage(function()
        PerformanceFramework.startTimer(profile_name)
        local result = handler(message)
        PerformanceFramework.endTimer(profile_name)
        return result
    end, profile_name)
end

-- Report generation
function PerformanceFramework.generateReport(format)
    format = format or config.report_format
    
    local report = {
        timestamp = os.date("%Y-%m-%d %H:%M:%S"),
        config = config,
        measurements = {},
        regressions = regressions,
        summary = {}
    }
    
    -- Process measurements for report
    local total_tests = 0
    local regression_count = 0
    
    for name, data in pairs(measurements) do
        if data.stats then
            report.measurements[name] = {
                stats = data.stats,
                memory_data = data.memory_data,
                is_baseline = baselines[name] ~= nil,
                baseline_value = baselines[name],
                has_regression = regressions[name] ~= nil
            }
            
            total_tests = total_tests + 1
            if regressions[name] then
                regression_count = regression_count + 1
            end
        end
    end
    
    report.summary = {
        total_tests = total_tests,
        regression_count = regression_count,
        regression_percentage = total_tests > 0 and (regression_count / total_tests * 100) or 0
    }
    
    if format == "json" then
        return PerformanceFramework.formatJSON(report)
    elseif format == "csv" then
        return PerformanceFramework.formatCSV(report)
    else
        return PerformanceFramework.formatText(report)
    end
end

-- Format report as JSON
function PerformanceFramework.formatJSON(report)
    -- Simple JSON serialization (AO processes don't have full JSON library)
    local function serialize(obj, indent)
        indent = indent or ""
        local t = type(obj)
        
        if t == "nil" then
            return "null"
        elseif t == "boolean" then
            return obj and "true" or "false"
        elseif t == "number" then
            return tostring(obj)
        elseif t == "string" then
            return '"' .. obj:gsub('"', '\\"') .. '"'
        elseif t == "table" then
            local items = {}
            local is_array = true
            local max_index = 0
            
            -- Check if table is array-like
            for k, v in pairs(obj) do
                if type(k) ~= "number" then
                    is_array = false
                    break
                else
                    max_index = math.max(max_index, k)
                end
            end
            
            if is_array then
                for i = 1, max_index do
                    table.insert(items, serialize(obj[i], indent .. "  "))
                end
                return "[\n" .. indent .. "  " .. table.concat(items, ",\n" .. indent .. "  ") .. "\n" .. indent .. "]"
            else
                for k, v in pairs(obj) do
                    table.insert(items, '"' .. tostring(k) .. '": ' .. serialize(v, indent .. "  "))
                end
                return "{\n" .. indent .. "  " .. table.concat(items, ",\n" .. indent .. "  ") .. "\n" .. indent .. "}"
            end
        else
            return '"' .. tostring(obj) .. '"'
        end
    end
    
    return serialize(report)
end

-- Format report as CSV
function PerformanceFramework.formatCSV(report)
    local csv_lines = {
        "test_name,mean_ms,median_ms,min_ms,max_ms,std_dev,percentile_95,sample_count,has_regression,regression_percent"
    }
    
    for name, data in pairs(report.measurements) do
        if data.stats then
            local regression_percent = ""
            if data.has_regression and regressions[name] then
                regression_percent = tostring(regressions[name].regression_percent)
            end
            
            table.insert(csv_lines, string.format(
                "%s,%.3f,%.3f,%.3f,%.3f,%.3f,%.3f,%d,%s,%s",
                name,
                data.stats.mean,
                data.stats.median,
                data.stats.min,
                data.stats.max,
                data.stats.std_dev,
                data.stats.percentile_95,
                data.stats.sample_count,
                data.has_regression and "true" or "false",
                regression_percent
            ))
        end
    end
    
    return table.concat(csv_lines, "\n")
end

-- Format report as human-readable text
function PerformanceFramework.formatText(report)
    local lines = {
        "=== AO Process Performance Report ===",
        "Generated: " .. report.timestamp,
        "",
        "Summary:",
        "  Total Tests: " .. report.summary.total_tests,
        "  Regressions: " .. report.summary.regression_count .. " (" .. string.format("%.1f%%", report.summary.regression_percentage) .. ")",
        ""
    }
    
    if report.summary.regression_count > 0 then
        table.insert(lines, "⚠️  Performance Regressions Detected:")
        for name, regression in pairs(regressions) do
            table.insert(lines, string.format("  • %s: %.1f%% slower (%.3fms → %.3fms)", 
                name, regression.regression_percent, regression.baseline, regression.current))
        end
        table.insert(lines, "")
    end
    
    table.insert(lines, "Performance Measurements:")
    for name, data in pairs(report.measurements) do
        if data.stats then
            table.insert(lines, string.format("  %s:", name))
            table.insert(lines, string.format("    Mean: %.3fms", data.stats.mean))
            table.insert(lines, string.format("    Median: %.3fms", data.stats.median))
            table.insert(lines, string.format("    Range: %.3fms - %.3fms", data.stats.min, data.stats.max))
            table.insert(lines, string.format("    95th percentile: %.3fms", data.stats.percentile_95))
            table.insert(lines, string.format("    Std Dev: %.3fms", data.stats.std_dev))
            table.insert(lines, string.format("    Samples: %d", data.stats.sample_count))
            table.insert(lines, "")
        end
    end
    
    return table.concat(lines, "\n")
end

-- Utility functions
function PerformanceFramework.reset()
    measurements = {}
    regressions = {}
end

function PerformanceFramework.configure(new_config)
    for k, v in pairs(new_config) do
        config[k] = v
    end
end

function PerformanceFramework.isEnabled()
    return config.enabled
end

-- Export framework
return PerformanceFramework