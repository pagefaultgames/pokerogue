-- Handler Execution Time Profiler
-- Provides detailed profiling of AO message handlers with execution breakdown

local PerformanceFramework = require("parity-testing.reports.performance-framework")

local HandlerProfiler = {}

-- Profiling state
local handler_profiles = {}
local active_profiles = {}
local call_stack = {}

-- Configuration
local config = {
    enabled = true,
    detailed_tracing = true,
    memory_profiling = true,
    max_call_depth = 50,
    profile_all_handlers = false, -- Set to true to auto-profile all handler calls
    excluded_handlers = {} -- Handlers to skip profiling
}

-- Handler wrapper for automatic profiling
local original_handlers = {}

function HandlerProfiler.wrapHandler(handler_name, handler_func)
    if config.excluded_handlers[handler_name] then
        return handler_func
    end
    
    -- Store original handler
    original_handlers[handler_name] = handler_func
    
    -- Return wrapped version
    return function(msg)
        if config.enabled and (config.profile_all_handlers or active_profiles[handler_name]) then
            return HandlerProfiler.profileHandlerExecution(handler_name, handler_func, msg)
        else
            return handler_func(msg)
        end
    end
end

function HandlerProfiler.profileHandlerExecution(handler_name, handler_func, message)
    local profile_start = os.clock()
    local profile_id = handler_name .. "_" .. tostring(profile_start)
    
    -- Initialize profile data
    local profile_data = {
        handler_name = handler_name,
        start_time = profile_start,
        message_type = message.Action or "unknown",
        message_from = message.From or "unknown",
        call_depth = #call_stack,
        sub_profiles = {},
        memory_start = 0,
        memory_end = 0,
        memory_peak = 0,
        execution_phases = {}
    }
    
    -- Track memory if enabled
    if config.memory_profiling then
        collectgarbage("collect") -- Force GC for accurate baseline
        profile_data.memory_start = collectgarbage("count")
    end
    
    -- Add to call stack
    table.insert(call_stack, profile_data)
    
    -- Execute handler with error handling
    local success, result, error_msg
    local execution_start = os.clock()
    
    if config.detailed_tracing then
        profile_data.execution_phases.pre_execution = (execution_start - profile_start) * 1000
    end
    
    success, result = pcall(handler_func, message)
    
    local execution_end = os.clock()
    local execution_time = (execution_end - execution_start) * 1000
    
    -- Record execution results
    profile_data.success = success
    profile_data.execution_time = execution_time
    profile_data.total_time = (execution_end - profile_start) * 1000
    
    if not success then
        profile_data.error = tostring(result)
        result = nil
    end
    
    -- Memory tracking
    if config.memory_profiling then
        profile_data.memory_end = collectgarbage("count")
        profile_data.memory_used = profile_data.memory_end - profile_data.memory_start
    end
    
    -- Detailed phase tracking
    if config.detailed_tracing then
        profile_data.execution_phases.handler_execution = execution_time
        profile_data.execution_phases.post_execution = profile_data.total_time - execution_time - profile_data.execution_phases.pre_execution
    end
    
    -- Remove from call stack
    table.remove(call_stack)
    
    -- Store profile data
    HandlerProfiler.storeProfile(handler_name, profile_data)
    
    -- Return original result or propagate error
    if success then
        return result
    else
        error(profile_data.error)
    end
end

function HandlerProfiler.storeProfile(handler_name, profile_data)
    -- Initialize handler profile storage
    if not handler_profiles[handler_name] then
        handler_profiles[handler_name] = {
            total_calls = 0,
            successful_calls = 0,
            failed_calls = 0,
            total_execution_time = 0,
            profiles = {},
            execution_stats = {},
            message_type_stats = {},
            memory_stats = {
                total_used = 0,
                peak_usage = 0,
                average_usage = 0
            }
        }
    end
    
    local handler_data = handler_profiles[handler_name]
    
    -- Update counters
    handler_data.total_calls = handler_data.total_calls + 1
    handler_data.total_execution_time = handler_data.total_execution_time + profile_data.execution_time
    
    if profile_data.success then
        handler_data.successful_calls = handler_data.successful_calls + 1
    else
        handler_data.failed_calls = handler_data.failed_calls + 1
    end
    
    -- Store individual profile
    table.insert(handler_data.profiles, profile_data)
    
    -- Update message type statistics
    local msg_type = profile_data.message_type
    handler_data.message_type_stats[msg_type] = handler_data.message_type_stats[msg_type] or {
        count = 0,
        total_time = 0,
        average_time = 0
    }
    
    local msg_stats = handler_data.message_type_stats[msg_type]
    msg_stats.count = msg_stats.count + 1
    msg_stats.total_time = msg_stats.total_time + profile_data.execution_time
    msg_stats.average_time = msg_stats.total_time / msg_stats.count
    
    -- Update memory statistics
    if config.memory_profiling and profile_data.memory_used then
        handler_data.memory_stats.total_used = handler_data.memory_stats.total_used + profile_data.memory_used
        handler_data.memory_stats.peak_usage = math.max(handler_data.memory_stats.peak_usage, profile_data.memory_used)
        handler_data.memory_stats.average_usage = handler_data.memory_stats.total_used / handler_data.total_calls
    end
    
    -- Calculate execution statistics
    HandlerProfiler.updateExecutionStats(handler_name)
end

function HandlerProfiler.updateExecutionStats(handler_name)
    local handler_data = handler_profiles[handler_name]
    local profiles = handler_data.profiles
    
    if #profiles == 0 then return end
    
    -- Calculate timing statistics
    local execution_times = {}
    local total_times = {}
    
    for _, profile in ipairs(profiles) do
        table.insert(execution_times, profile.execution_time)
        table.insert(total_times, profile.total_time)
    end
    
    table.sort(execution_times)
    table.sort(total_times)
    
    local count = #execution_times
    local execution_stats = {
        mean_execution = handler_data.total_execution_time / handler_data.total_calls,
        median_execution = count % 2 == 0 and 
            (execution_times[count/2] + execution_times[count/2 + 1]) / 2 or 
            execution_times[math.ceil(count/2)],
        min_execution = execution_times[1],
        max_execution = execution_times[count],
        percentile_95_execution = execution_times[math.ceil(count * 0.95)],
        percentile_99_execution = execution_times[math.ceil(count * 0.99)],
        success_rate = (handler_data.successful_calls / handler_data.total_calls) * 100
    }
    
    -- Calculate standard deviation
    local variance_sum = 0
    for _, time in ipairs(execution_times) do
        variance_sum = variance_sum + (time - execution_stats.mean_execution)^2
    end
    execution_stats.std_dev_execution = math.sqrt(variance_sum / count)
    
    handler_data.execution_stats = execution_stats
end

-- Profile management functions
function HandlerProfiler.startProfiling(handler_name)
    active_profiles[handler_name] = true
end

function HandlerProfiler.stopProfiling(handler_name)
    active_profiles[handler_name] = nil
end

function HandlerProfiler.profileAllHandlers()
    config.profile_all_handlers = true
end

function HandlerProfiler.stopProfilingAll()
    config.profile_all_handlers = false
    active_profiles = {}
end

function HandlerProfiler.excludeHandler(handler_name)
    config.excluded_handlers[handler_name] = true
end

function HandlerProfiler.includeHandler(handler_name)
    config.excluded_handlers[handler_name] = nil
end

-- Benchmark specific handler operations
function HandlerProfiler.benchmarkHandler(handler_name, message, iterations)
    iterations = iterations or 100
    local results = {}
    
    -- Ensure handler is being profiled
    local was_profiling = active_profiles[handler_name]
    HandlerProfiler.startProfiling(handler_name)
    
    -- Get handler function
    local handler_func = original_handlers[handler_name]
    if not handler_func then
        error("Handler " .. handler_name .. " not found or not wrapped")
    end
    
    -- Run benchmark
    for i = 1, iterations do
        local benchmark_msg = {
            Action = message.Action or "benchmark",
            From = message.From or "benchmark_user",
            Data = message.Data,
            benchmark_run = i
        }
        
        local success, result = pcall(HandlerProfiler.profileHandlerExecution, handler_name, handler_func, benchmark_msg)
        table.insert(results, {
            success = success,
            result = result,
            run_number = i
        })
    end
    
    -- Restore original profiling state
    if not was_profiling then
        HandlerProfiler.stopProfiling(handler_name)
    end
    
    return results
end

-- Report generation
function HandlerProfiler.generateHandlerReport(handler_name, format)
    format = format or "text"
    
    local handler_data = handler_profiles[handler_name]
    if not handler_data then
        return "No profiling data available for handler: " .. handler_name
    end
    
    local report = {
        handler_name = handler_name,
        timestamp = os.date("%Y-%m-%d %H:%M:%S"),
        summary = {
            total_calls = handler_data.total_calls,
            successful_calls = handler_data.successful_calls,
            failed_calls = handler_data.failed_calls,
            success_rate = handler_data.execution_stats.success_rate,
            total_execution_time = handler_data.total_execution_time
        },
        performance = handler_data.execution_stats,
        memory = handler_data.memory_stats,
        message_types = handler_data.message_type_stats,
        recent_profiles = {}
    }
    
    -- Include recent profiles (last 10)
    local recent_count = math.min(10, #handler_data.profiles)
    for i = #handler_data.profiles - recent_count + 1, #handler_data.profiles do
        table.insert(report.recent_profiles, {
            message_type = handler_data.profiles[i].message_type,
            execution_time = handler_data.profiles[i].execution_time,
            memory_used = handler_data.profiles[i].memory_used,
            success = handler_data.profiles[i].success,
            timestamp = handler_data.profiles[i].start_time
        })
    end
    
    if format == "json" then
        return PerformanceFramework.formatJSON(report)
    else
        return HandlerProfiler.formatHandlerReportText(report)
    end
end

function HandlerProfiler.formatHandlerReportText(report)
    local lines = {
        "=== Handler Performance Profile: " .. report.handler_name .. " ===",
        "Generated: " .. report.timestamp,
        "",
        "Summary:",
        "  Total Calls: " .. report.summary.total_calls,
        "  Successful: " .. report.summary.successful_calls .. " (" .. string.format("%.1f%%", report.summary.success_rate) .. ")",
        "  Failed: " .. report.summary.failed_calls,
        "  Total Execution Time: " .. string.format("%.3fms", report.summary.total_execution_time),
        "",
        "Performance Statistics:",
        "  Mean Execution Time: " .. string.format("%.3fms", report.performance.mean_execution),
        "  Median Execution Time: " .. string.format("%.3fms", report.performance.median_execution),
        "  95th Percentile: " .. string.format("%.3fms", report.performance.percentile_95_execution),
        "  99th Percentile: " .. string.format("%.3fms", report.performance.percentile_99_execution),
        "  Min/Max: " .. string.format("%.3fms / %.3fms", report.performance.min_execution, report.performance.max_execution),
        "  Standard Deviation: " .. string.format("%.3fms", report.performance.std_dev_execution),
        ""
    }
    
    if report.memory and report.memory.total_used > 0 then
        table.insert(lines, "Memory Usage:")
        table.insert(lines, "  Average per Call: " .. string.format("%.2f KB", report.memory.average_usage))
        table.insert(lines, "  Peak Usage: " .. string.format("%.2f KB", report.memory.peak_usage))
        table.insert(lines, "  Total Used: " .. string.format("%.2f KB", report.memory.total_used))
        table.insert(lines, "")
    end
    
    if report.message_types then
        table.insert(lines, "Message Type Breakdown:")
        for msg_type, stats in pairs(report.message_types) do
            table.insert(lines, string.format("  %s: %d calls, avg %.3fms", 
                msg_type, stats.count, stats.average_time))
        end
        table.insert(lines, "")
    end
    
    return table.concat(lines, "\n")
end

function HandlerProfiler.generateFullReport(format)
    format = format or "text"
    
    local report = {
        timestamp = os.date("%Y-%m-%d %H:%M:%S"),
        config = config,
        handlers = {}
    }
    
    for handler_name, _ in pairs(handler_profiles) do
        report.handlers[handler_name] = HandlerProfiler.generateHandlerReport(handler_name, "table")
    end
    
    if format == "json" then
        return PerformanceFramework.formatJSON(report)
    else
        return HandlerProfiler.formatFullReportText(report)
    end
end

function HandlerProfiler.formatFullReportText(report)
    local lines = {
        "=== Complete Handler Profiling Report ===",
        "Generated: " .. report.timestamp,
        ""
    }
    
    for handler_name, handler_report in pairs(report.handlers) do
        table.insert(lines, HandlerProfiler.formatHandlerReportText(handler_report))
        table.insert(lines, "")
    end
    
    return table.concat(lines, "\n")
end

-- Utility functions
function HandlerProfiler.reset(handler_name)
    if handler_name then
        handler_profiles[handler_name] = nil
        active_profiles[handler_name] = nil
    else
        handler_profiles = {}
        active_profiles = {}
        call_stack = {}
    end
end

function HandlerProfiler.configure(new_config)
    for k, v in pairs(new_config) do
        config[k] = v
    end
end

function HandlerProfiler.getProfileData(handler_name)
    return handler_profiles[handler_name]
end

function HandlerProfiler.isEnabled()
    return config.enabled
end

function HandlerProfiler.getActiveProfiles()
    local active = {}
    for handler_name, _ in pairs(active_profiles) do
        table.insert(active, handler_name)
    end
    return active
end

return HandlerProfiler