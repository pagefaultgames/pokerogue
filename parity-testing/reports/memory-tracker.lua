-- Memory Usage Tracking for AO Process Performance
-- Comprehensive memory monitoring and analysis for game handlers

local MemoryTracker = {}

-- Memory tracking state
local memory_snapshots = {}
local memory_profiles = {}
local allocation_tracking = {}
local gc_events = {}

-- Configuration
local config = {
    enabled = true,
    detailed_tracking = true,
    gc_monitoring = true,
    allocation_threshold = 100, -- KB threshold for tracking large allocations
    snapshot_interval = 1000, -- milliseconds between automatic snapshots
    max_snapshots = 1000, -- Maximum number of snapshots to keep
    track_object_types = true -- Track Lua object type allocations
}

-- Memory measurement utilities
function MemoryTracker.getMemoryUsage()
    if not config.enabled then return 0 end
    return collectgarbage("count") -- Returns memory usage in KB
end

function MemoryTracker.forceGarbageCollection()
    if not config.enabled then return end
    return collectgarbage("collect")
end

function MemoryTracker.getGCInfo()
    if not config.enabled then return {} end
    
    local before_gc = collectgarbage("count")
    collectgarbage("collect")
    local after_gc = collectgarbage("count")
    
    return {
        before_gc = before_gc,
        after_gc = after_gc,
        freed_memory = before_gc - after_gc,
        gc_threshold = collectgarbage("count") * 2, -- Lua's default GC threshold multiplier
        timestamp = os.clock()
    }
end

-- Memory snapshot management
function MemoryTracker.takeSnapshot(label, context)
    if not config.enabled then return nil end
    
    local timestamp = os.clock()
    local memory_usage = MemoryTracker.getMemoryUsage()
    
    local snapshot = {
        id = #memory_snapshots + 1,
        timestamp = timestamp,
        label = label or ("snapshot_" .. tostring(timestamp)),
        context = context or {},
        memory_kb = memory_usage,
        gc_info = MemoryTracker.getGCInfo(),
        lua_stats = MemoryTracker.getLuaStats()
    }
    
    table.insert(memory_snapshots, snapshot)
    
    -- Maintain maximum snapshot limit
    if #memory_snapshots > config.max_snapshots then
        table.remove(memory_snapshots, 1)
    end
    
    return snapshot
end

function MemoryTracker.getLuaStats()
    local stats = {}
    
    -- Get Lua registry statistics if available
    local registry = debug.getregistry()
    if registry then
        local count = 0
        for k, v in pairs(registry) do
            count = count + 1
        end
        stats.registry_size = count
    end
    
    -- Estimate object counts by type
    if config.track_object_types then
        stats.object_types = {}
        local seen = {}
        
        -- Sample from global environment
        local function countType(obj, depth)
            if depth > 3 or seen[obj] then return end
            seen[obj] = true
            
            local obj_type = type(obj)
            stats.object_types[obj_type] = (stats.object_types[obj_type] or 0) + 1
            
            if obj_type == "table" then
                for k, v in pairs(obj) do
                    countType(k, depth + 1)
                    countType(v, depth + 1)
                end
            end
        end
        
        countType(_G, 0)
    end
    
    return stats
end

-- Memory profiling for specific operations
function MemoryTracker.profileMemoryUsage(func, operation_name, context)
    if not config.enabled then 
        return func()
    end
    
    operation_name = operation_name or "unknown_operation"
    
    -- Take before snapshot
    local before_snapshot = MemoryTracker.takeSnapshot(operation_name .. "_before", context)
    
    -- Execute function
    local start_time = os.clock()
    local result = func()
    local end_time = os.clock()
    
    -- Take after snapshot
    local after_snapshot = MemoryTracker.takeSnapshot(operation_name .. "_after", context)
    
    -- Calculate memory delta
    local memory_delta = after_snapshot.memory_kb - before_snapshot.memory_kb
    local execution_time = (end_time - start_time) * 1000 -- Convert to milliseconds
    
    -- Store memory profile
    local profile = {
        operation_name = operation_name,
        context = context,
        execution_time = execution_time,
        memory_before = before_snapshot.memory_kb,
        memory_after = after_snapshot.memory_kb,
        memory_delta = memory_delta,
        gc_events_during = MemoryTracker.countGCEventsBetween(start_time, end_time),
        before_snapshot_id = before_snapshot.id,
        after_snapshot_id = after_snapshot.id,
        timestamp = start_time
    }
    
    -- Store in profiles
    memory_profiles[operation_name] = memory_profiles[operation_name] or {}
    table.insert(memory_profiles[operation_name], profile)
    
    -- Track significant memory allocations
    if math.abs(memory_delta) > config.allocation_threshold then
        MemoryTracker.trackAllocation(operation_name, memory_delta, profile)
    end
    
    return result, profile
end

-- Track significant memory allocations
function MemoryTracker.trackAllocation(operation_name, memory_delta, profile)
    allocation_tracking[operation_name] = allocation_tracking[operation_name] or {
        total_allocations = 0,
        total_deallocations = 0,
        net_allocation = 0,
        large_allocations = {},
        allocation_count = 0
    }
    
    local tracking = allocation_tracking[operation_name]
    
    if memory_delta > 0 then
        tracking.total_allocations = tracking.total_allocations + memory_delta
        tracking.allocation_count = tracking.allocation_count + 1
    else
        tracking.total_deallocations = tracking.total_deallocations + math.abs(memory_delta)
    end
    
    tracking.net_allocation = tracking.total_allocations - tracking.total_deallocations
    
    -- Record large allocations
    if math.abs(memory_delta) > config.allocation_threshold then
        table.insert(tracking.large_allocations, {
            memory_delta = memory_delta,
            timestamp = profile.timestamp,
            execution_time = profile.execution_time,
            context = profile.context
        })
        
        -- Limit large allocation history
        if #tracking.large_allocations > 50 then
            table.remove(tracking.large_allocations, 1)
        end
    end
end

-- Garbage collection monitoring
function MemoryTracker.monitorGarbageCollection()
    if not config.enabled or not config.gc_monitoring then return end
    
    local gc_before = collectgarbage("count")
    local gc_start_time = os.clock()
    
    collectgarbage("collect")
    
    local gc_after = collectgarbage("count")
    local gc_end_time = os.clock()
    local gc_time = (gc_end_time - gc_start_time) * 1000 -- milliseconds
    
    local gc_event = {
        timestamp = gc_start_time,
        gc_time = gc_time,
        memory_before = gc_before,
        memory_after = gc_after,
        memory_freed = gc_before - gc_after,
        gc_efficiency = (gc_before > 0) and ((gc_before - gc_after) / gc_before * 100) or 0
    }
    
    table.insert(gc_events, gc_event)
    
    -- Maintain GC event history limit
    if #gc_events > 100 then
        table.remove(gc_events, 1)
    end
    
    return gc_event
end

function MemoryTracker.countGCEventsBetween(start_time, end_time)
    local count = 0
    for _, event in ipairs(gc_events) do
        if event.timestamp >= start_time and event.timestamp <= end_time then
            count = count + 1
        end
    end
    return count
end

-- Memory analysis and reporting
function MemoryTracker.analyzeMemoryTrends(operation_name, window_size)
    if not memory_profiles[operation_name] then
        return nil
    end
    
    local profiles = memory_profiles[operation_name]
    window_size = window_size or math.min(50, #profiles) -- Analyze last 50 operations or all if less
    
    if #profiles == 0 then return nil end
    
    local start_index = math.max(1, #profiles - window_size + 1)
    local memory_deltas = {}
    local execution_times = {}
    
    for i = start_index, #profiles do
        table.insert(memory_deltas, profiles[i].memory_delta)
        table.insert(execution_times, profiles[i].execution_time)
    end
    
    -- Calculate statistics
    local function calculateStats(values)
        if #values == 0 then return {} end
        
        table.sort(values)
        local sum = 0
        for _, v in ipairs(values) do
            sum = sum + v
        end
        
        local count = #values
        local mean = sum / count
        local median = count % 2 == 0 and (values[count/2] + values[count/2 + 1]) / 2 or values[math.ceil(count/2)]
        
        -- Standard deviation
        local variance_sum = 0
        for _, v in ipairs(values) do
            variance_sum = variance_sum + (v - mean)^2
        end
        local std_dev = math.sqrt(variance_sum / count)
        
        return {
            mean = mean,
            median = median,
            min = values[1],
            max = values[count],
            std_dev = std_dev,
            count = count
        }
    end
    
    return {
        operation_name = operation_name,
        analysis_window = window_size,
        memory_stats = calculateStats(memory_deltas),
        execution_stats = calculateStats(execution_times),
        total_operations = #profiles,
        allocation_summary = allocation_tracking[operation_name]
    }
end

function MemoryTracker.generateMemoryReport(operation_name, format)
    format = format or "text"
    
    local report = {
        timestamp = os.date("%Y-%m-%d %H:%M:%S"),
        current_memory = MemoryTracker.getMemoryUsage(),
        gc_info = MemoryTracker.getGCInfo(),
        total_snapshots = #memory_snapshots,
        config = config
    }
    
    if operation_name then
        report.operation_analysis = MemoryTracker.analyzeMemoryTrends(operation_name)
        report.allocation_tracking = allocation_tracking[operation_name]
    else
        -- Generate comprehensive report
        report.all_operations = {}
        for op_name, _ in pairs(memory_profiles) do
            report.all_operations[op_name] = MemoryTracker.analyzeMemoryTrends(op_name)
        end
        report.allocation_tracking = allocation_tracking
    end
    
    -- Recent GC events
    report.recent_gc_events = {}
    local recent_count = math.min(10, #gc_events)
    for i = #gc_events - recent_count + 1, #gc_events do
        if gc_events[i] then
            table.insert(report.recent_gc_events, gc_events[i])
        end
    end
    
    if format == "json" then
        return MemoryTracker.formatJSON(report)
    else
        return MemoryTracker.formatMemoryReportText(report)
    end
end

function MemoryTracker.formatMemoryReportText(report)
    local lines = {
        "=== Memory Usage Report ===",
        "Generated: " .. report.timestamp,
        "Current Memory Usage: " .. string.format("%.2f KB", report.current_memory),
        "Total Snapshots: " .. report.total_snapshots,
        ""
    }
    
    -- GC Information
    if report.gc_info.freed_memory then
        table.insert(lines, "Garbage Collection Status:")
        table.insert(lines, "  Last GC Freed: " .. string.format("%.2f KB", report.gc_info.freed_memory))
        table.insert(lines, "  Memory After GC: " .. string.format("%.2f KB", report.gc_info.after_gc))
        table.insert(lines, "")
    end
    
    -- Recent GC Events
    if #report.recent_gc_events > 0 then
        table.insert(lines, "Recent Garbage Collection Events:")
        for _, event in ipairs(report.recent_gc_events) do
            table.insert(lines, string.format("  %.3fms: Freed %.2f KB (%.1f%% efficiency)", 
                event.gc_time, event.memory_freed, event.gc_efficiency))
        end
        table.insert(lines, "")
    end
    
    -- Operation-specific analysis
    if report.operation_analysis then
        local analysis = report.operation_analysis
        table.insert(lines, "Operation Analysis: " .. analysis.operation_name)
        table.insert(lines, "  Total Operations: " .. analysis.total_operations)
        table.insert(lines, "  Analysis Window: " .. analysis.analysis_window)
        
        if analysis.memory_stats then
            table.insert(lines, "  Memory Statistics:")
            table.insert(lines, "    Mean Delta: " .. string.format("%.3f KB", analysis.memory_stats.mean))
            table.insert(lines, "    Median Delta: " .. string.format("%.3f KB", analysis.memory_stats.median))
            table.insert(lines, "    Range: " .. string.format("%.3f KB to %.3f KB", 
                analysis.memory_stats.min, analysis.memory_stats.max))
            table.insert(lines, "    Std Dev: " .. string.format("%.3f KB", analysis.memory_stats.std_dev))
        end
        
        table.insert(lines, "")
    end
    
    -- All operations summary
    if report.all_operations then
        table.insert(lines, "All Operations Summary:")
        for op_name, analysis in pairs(report.all_operations) do
            if analysis and analysis.memory_stats then
                table.insert(lines, string.format("  %s: %.3f KB avg, %d operations", 
                    op_name, analysis.memory_stats.mean, analysis.total_operations))
            end
        end
        table.insert(lines, "")
    end
    
    -- Allocation tracking
    if report.allocation_tracking then
        table.insert(lines, "Allocation Tracking:")
        for op_name, tracking in pairs(report.allocation_tracking) do
            table.insert(lines, string.format("  %s:", op_name))
            table.insert(lines, string.format("    Net Allocation: %.2f KB", tracking.net_allocation))
            table.insert(lines, string.format("    Total Allocated: %.2f KB", tracking.total_allocations))
            table.insert(lines, string.format("    Total Freed: %.2f KB", tracking.total_deallocations))
            table.insert(lines, string.format("    Large Allocations: %d", #tracking.large_allocations))
        end
    end
    
    return table.concat(lines, "\n")
end

function MemoryTracker.formatJSON(obj)
    -- Simple JSON serialization (matching performance framework)
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
    
    return serialize(obj)
end

-- Utility functions
function MemoryTracker.reset(operation_name)
    if operation_name then
        memory_profiles[operation_name] = nil
        allocation_tracking[operation_name] = nil
    else
        memory_snapshots = {}
        memory_profiles = {}
        allocation_tracking = {}
        gc_events = {}
    end
end

function MemoryTracker.configure(new_config)
    for k, v in pairs(new_config) do
        config[k] = v
    end
end

function MemoryTracker.getSnapshot(snapshot_id)
    return memory_snapshots[snapshot_id]
end

function MemoryTracker.getRecentSnapshots(count)
    count = count or 10
    local start_index = math.max(1, #memory_snapshots - count + 1)
    local recent = {}
    
    for i = start_index, #memory_snapshots do
        table.insert(recent, memory_snapshots[i])
    end
    
    return recent
end

function MemoryTracker.isEnabled()
    return config.enabled
end

return MemoryTracker