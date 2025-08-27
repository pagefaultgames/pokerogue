-- Performance Regression Detection System
-- Automated detection and reporting of performance degradations

local PerformanceFramework = require("parity-testing.reports.performance-framework")
local HandlerProfiler = require("parity-testing.reports.handler-profiler")
local MemoryTracker = require("parity-testing.reports.memory-tracker")

local RegressionDetector = {}

-- Regression tracking state
local baselines = {}
local regression_history = {}
local alerts = {}
local trend_data = {}

-- Configuration
local config = {
    enabled = true,
    
    -- Thresholds for different types of regressions
    performance_threshold = 0.20, -- 20% slowdown threshold
    memory_threshold = 0.25, -- 25% memory increase threshold
    success_rate_threshold = 0.05, -- 5% success rate drop threshold
    
    -- Analysis settings
    baseline_sample_size = 50, -- Number of samples to establish baseline
    regression_sample_size = 20, -- Number of recent samples for regression analysis
    confidence_level = 0.95, -- Statistical confidence level
    
    -- Alerting configuration
    alert_on_detection = true,
    max_alerts_per_operation = 10,
    alert_cooldown = 300, -- seconds between duplicate alerts
    
    -- Trending
    trend_window_size = 100, -- Number of samples for trend analysis
    trend_analysis_enabled = true
}

-- Baseline management
function RegressionDetector.establishBaseline(operation_name, measurements)
    if not config.enabled or not measurements or #measurements < config.baseline_sample_size then
        return false
    end
    
    -- Calculate baseline statistics
    local execution_times = {}
    local memory_usage = {}
    local success_rates = {}
    
    for _, measurement in ipairs(measurements) do
        if measurement.execution_time then
            table.insert(execution_times, measurement.execution_time)
        end
        if measurement.memory_delta then
            table.insert(memory_usage, measurement.memory_delta)
        end
        if measurement.success_rate ~= nil then
            table.insert(success_rates, measurement.success_rate)
        end
    end
    
    local baseline = {
        operation_name = operation_name,
        established_at = os.date("%Y-%m-%d %H:%M:%S"),
        sample_count = #measurements,
        performance = RegressionDetector.calculateStats(execution_times),
        memory = RegressionDetector.calculateStats(memory_usage),
        success_rate = RegressionDetector.calculateStats(success_rates),
        raw_measurements = measurements
    }
    
    baselines[operation_name] = baseline
    
    -- Initialize trend tracking
    if config.trend_analysis_enabled then
        trend_data[operation_name] = {
            execution_times = execution_times,
            memory_usage = memory_usage,
            timestamps = {}
        }
        
        for _, measurement in ipairs(measurements) do
            table.insert(trend_data[operation_name].timestamps, measurement.timestamp or os.clock())
        end
    end
    
    return true
end

function RegressionDetector.calculateStats(values)
    if not values or #values == 0 then
        return {}
    end
    
    table.sort(values)
    local count = #values
    local sum = 0
    
    for _, value in ipairs(values) do
        sum = sum + value
    end
    
    local mean = sum / count
    local median = count % 2 == 0 and (values[count/2] + values[count/2 + 1]) / 2 or values[math.ceil(count/2)]
    
    -- Calculate standard deviation
    local variance_sum = 0
    for _, value in ipairs(values) do
        variance_sum = variance_sum + (value - mean)^2
    end
    local std_dev = math.sqrt(variance_sum / count)
    
    return {
        mean = mean,
        median = median,
        min = values[1],
        max = values[count],
        std_dev = std_dev,
        percentile_95 = values[math.ceil(count * 0.95)],
        percentile_99 = values[math.ceil(count * 0.99)],
        count = count
    }
end

-- Regression detection
function RegressionDetector.detectRegression(operation_name, recent_measurements)
    if not config.enabled or not baselines[operation_name] or not recent_measurements then
        return nil
    end
    
    if #recent_measurements < config.regression_sample_size then
        return nil -- Not enough recent data
    end
    
    local baseline = baselines[operation_name]
    
    -- Extract recent performance data
    local recent_execution_times = {}
    local recent_memory_usage = {}
    local recent_success_count = 0
    local recent_total_count = #recent_measurements
    
    for _, measurement in ipairs(recent_measurements) do
        if measurement.execution_time then
            table.insert(recent_execution_times, measurement.execution_time)
        end
        if measurement.memory_delta then
            table.insert(recent_memory_usage, measurement.memory_delta)
        end
        if measurement.success ~= false then
            recent_success_count = recent_success_count + 1
        end
    end
    
    -- Calculate recent statistics
    local recent_stats = {
        performance = RegressionDetector.calculateStats(recent_execution_times),
        memory = RegressionDetector.calculateStats(recent_memory_usage),
        success_rate = recent_total_count > 0 and (recent_success_count / recent_total_count) or 1.0
    }
    
    -- Detect regressions
    local regressions = {}
    
    -- Performance regression
    if baseline.performance.mean and recent_stats.performance.mean then
        local perf_change = (recent_stats.performance.mean - baseline.performance.mean) / baseline.performance.mean
        if perf_change > config.performance_threshold then
            table.insert(regressions, {
                type = "performance",
                severity = RegressionDetector.calculateSeverity(perf_change, config.performance_threshold),
                baseline_value = baseline.performance.mean,
                current_value = recent_stats.performance.mean,
                change_percent = perf_change * 100,
                confidence = RegressionDetector.calculateConfidence(baseline.performance, recent_stats.performance)
            })
        end
    end
    
    -- Memory regression
    if baseline.memory.mean and recent_stats.memory.mean then
        local mem_change = (recent_stats.memory.mean - baseline.memory.mean) / math.abs(baseline.memory.mean)
        if mem_change > config.memory_threshold then
            table.insert(regressions, {
                type = "memory",
                severity = RegressionDetector.calculateSeverity(mem_change, config.memory_threshold),
                baseline_value = baseline.memory.mean,
                current_value = recent_stats.memory.mean,
                change_percent = mem_change * 100,
                confidence = RegressionDetector.calculateConfidence(baseline.memory, recent_stats.memory)
            })
        end
    end
    
    -- Success rate regression
    if baseline.success_rate.mean and recent_stats.success_rate then
        local success_change = baseline.success_rate.mean - recent_stats.success_rate
        if success_change > config.success_rate_threshold then
            table.insert(regressions, {
                type = "success_rate",
                severity = RegressionDetector.calculateSeverity(success_change, config.success_rate_threshold),
                baseline_value = baseline.success_rate.mean,
                current_value = recent_stats.success_rate,
                change_percent = -success_change * 100,
                confidence = 0.9 -- Success rate confidence is simpler to calculate
            })
        end
    end
    
    -- Record regression if detected
    if #regressions > 0 then
        local regression_record = {
            operation_name = operation_name,
            detected_at = os.date("%Y-%m-%d %H:%M:%S"),
            timestamp = os.clock(),
            regressions = regressions,
            baseline_info = {
                established_at = baseline.established_at,
                sample_count = baseline.sample_count
            },
            recent_sample_count = #recent_measurements,
            trend_analysis = RegressionDetector.analyzeTrend(operation_name)
        }
        
        -- Store in history
        regression_history[operation_name] = regression_history[operation_name] or {}
        table.insert(regression_history[operation_name], regression_record)
        
        -- Generate alert if configured
        if config.alert_on_detection then
            RegressionDetector.generateAlert(regression_record)
        end
        
        return regression_record
    end
    
    return nil
end

function RegressionDetector.calculateSeverity(change_ratio, threshold)
    local severity_ratio = change_ratio / threshold
    
    if severity_ratio >= 3.0 then
        return "critical"
    elseif severity_ratio >= 2.0 then
        return "high"
    elseif severity_ratio >= 1.5 then
        return "medium"
    else
        return "low"
    end
end

function RegressionDetector.calculateConfidence(baseline_stats, recent_stats)
    -- Simple confidence calculation based on overlap of distributions
    if not baseline_stats.std_dev or not recent_stats.std_dev then
        return 0.5
    end
    
    -- Calculate Cohen's d (effect size)
    local pooled_std = math.sqrt((baseline_stats.std_dev^2 + recent_stats.std_dev^2) / 2)
    if pooled_std == 0 then return 1.0 end
    
    local cohens_d = math.abs(recent_stats.mean - baseline_stats.mean) / pooled_std
    
    -- Convert Cohen's d to approximate confidence
    if cohens_d >= 0.8 then
        return 0.95
    elseif cohens_d >= 0.5 then
        return 0.80
    elseif cohens_d >= 0.2 then
        return 0.65
    else
        return 0.50
    end
end

-- Trend analysis
function RegressionDetector.analyzeTrend(operation_name)
    if not config.trend_analysis_enabled or not trend_data[operation_name] then
        return nil
    end
    
    local data = trend_data[operation_name]
    local execution_times = data.execution_times
    local timestamps = data.timestamps
    
    if #execution_times < 10 then
        return nil -- Not enough data for trend analysis
    end
    
    -- Simple linear regression to detect trends
    local n = math.min(config.trend_window_size, #execution_times)
    local start_index = math.max(1, #execution_times - n + 1)
    
    local sum_x = 0
    local sum_y = 0
    local sum_xy = 0
    local sum_xx = 0
    
    for i = 0, n - 1 do
        local x = i -- Time index
        local y = execution_times[start_index + i]
        
        sum_x = sum_x + x
        sum_y = sum_y + y
        sum_xy = sum_xy + x * y
        sum_xx = sum_xx + x * x
    end
    
    -- Calculate slope (trend direction)
    local denominator = n * sum_xx - sum_x * sum_x
    if denominator == 0 then
        return { trend = "flat", slope = 0, confidence = 0 }
    end
    
    local slope = (n * sum_xy - sum_x * sum_y) / denominator
    local intercept = (sum_y - slope * sum_x) / n
    
    -- Determine trend direction and significance
    local trend_direction
    if slope > 0.01 then
        trend_direction = "degrading"
    elseif slope < -0.01 then
        trend_direction = "improving"
    else
        trend_direction = "stable"
    end
    
    -- Calculate correlation coefficient for trend strength
    local sum_yy = 0
    for i = start_index, start_index + n - 1 do
        sum_yy = sum_yy + execution_times[i] * execution_times[i]
    end
    
    local correlation = 0
    local denom_corr = math.sqrt((n * sum_xx - sum_x^2) * (n * sum_yy - sum_y^2))
    if denom_corr > 0 then
        correlation = (n * sum_xy - sum_x * sum_y) / denom_corr
    end
    
    return {
        trend = trend_direction,
        slope = slope,
        correlation = correlation,
        confidence = math.abs(correlation),
        sample_size = n,
        time_span = timestamps[#timestamps] - timestamps[start_index]
    }
end

-- Alert management
function RegressionDetector.generateAlert(regression_record)
    local operation_name = regression_record.operation_name
    
    -- Check alert cooldown
    local last_alert_time = 0
    if alerts[operation_name] and #alerts[operation_name] > 0 then
        last_alert_time = alerts[operation_name][#alerts[operation_name]].timestamp
    end
    
    if os.clock() - last_alert_time < config.alert_cooldown then
        return -- Still in cooldown period
    end
    
    -- Create alert
    local alert = {
        operation_name = operation_name,
        timestamp = os.clock(),
        alert_time = os.date("%Y-%m-%d %H:%M:%S"),
        severity = RegressionDetector.getHighestSeverity(regression_record.regressions),
        regression_count = #regression_record.regressions,
        regression_types = {},
        message = RegressionDetector.formatAlertMessage(regression_record)
    }
    
    -- Extract regression types
    for _, regression in ipairs(regression_record.regressions) do
        table.insert(alert.regression_types, regression.type)
    end
    
    -- Store alert
    alerts[operation_name] = alerts[operation_name] or {}
    table.insert(alerts[operation_name], alert)
    
    -- Maintain alert history limit
    if #alerts[operation_name] > config.max_alerts_per_operation then
        table.remove(alerts[operation_name], 1)
    end
    
    return alert
end

function RegressionDetector.getHighestSeverity(regressions)
    local severity_order = { critical = 4, high = 3, medium = 2, low = 1 }
    local highest = 0
    local highest_name = "low"
    
    for _, regression in ipairs(regressions) do
        local level = severity_order[regression.severity] or 1
        if level > highest then
            highest = level
            highest_name = regression.severity
        end
    end
    
    return highest_name
end

function RegressionDetector.formatAlertMessage(regression_record)
    local messages = {
        "⚠️ Performance Regression Detected: " .. regression_record.operation_name
    }
    
    for _, regression in ipairs(regression_record.regressions) do
        local change_desc = regression.change_percent > 0 and "increased" or "decreased"
        table.insert(messages, string.format("  • %s %s by %.1f%% (%s severity)", 
            regression.type:gsub("_", " "), change_desc, math.abs(regression.change_percent), regression.severity))
    end
    
    if regression_record.trend_analysis and regression_record.trend_analysis.trend ~= "stable" then
        table.insert(messages, "  • Trend: " .. regression_record.trend_analysis.trend)
    end
    
    return table.concat(messages, "\n")
end

-- Reporting and analysis
function RegressionDetector.generateRegressionReport(operation_name, format)
    format = format or "text"
    
    local report = {
        timestamp = os.date("%Y-%m-%d %H:%M:%S"),
        config = config,
        summary = {
            total_operations_tracked = 0,
            operations_with_baselines = 0,
            operations_with_regressions = 0,
            total_alerts = 0
        }
    }
    
    -- Calculate summary statistics
    for op_name, _ in pairs(baselines) do
        report.summary.total_operations_tracked = report.summary.total_operations_tracked + 1
        report.summary.operations_with_baselines = report.summary.operations_with_baselines + 1
        
        if regression_history[op_name] and #regression_history[op_name] > 0 then
            report.summary.operations_with_regressions = report.summary.operations_with_regressions + 1
        end
        
        if alerts[op_name] then
            report.summary.total_alerts = report.summary.total_alerts + #alerts[op_name]
        end
    end
    
    if operation_name then
        -- Single operation report
        report.operation_name = operation_name
        report.baseline = baselines[operation_name]
        report.regression_history = regression_history[operation_name] or {}
        report.alerts = alerts[operation_name] or {}
        report.trend_analysis = RegressionDetector.analyzeTrend(operation_name)
    else
        -- Full report
        report.all_operations = {}
        for op_name, baseline in pairs(baselines) do
            report.all_operations[op_name] = {
                baseline = baseline,
                regression_count = regression_history[op_name] and #regression_history[op_name] or 0,
                alert_count = alerts[op_name] and #alerts[op_name] or 0,
                trend = RegressionDetector.analyzeTrend(op_name)
            }
        end
        report.recent_alerts = RegressionDetector.getRecentAlerts(10)
    end
    
    if format == "json" then
        return MemoryTracker.formatJSON(report)
    else
        return RegressionDetector.formatRegressionReportText(report)
    end
end

function RegressionDetector.formatRegressionReportText(report)
    local lines = {
        "=== Performance Regression Analysis Report ===",
        "Generated: " .. report.timestamp,
        "",
        "Summary:",
        "  Operations Tracked: " .. report.summary.total_operations_tracked,
        "  Operations with Baselines: " .. report.summary.operations_with_baselines,
        "  Operations with Regressions: " .. report.summary.operations_with_regressions,
        "  Total Alerts Generated: " .. report.summary.total_alerts,
        ""
    }
    
    if report.operation_name then
        -- Single operation details
        table.insert(lines, "Operation: " .. report.operation_name)
        
        if report.baseline then
            table.insert(lines, "Baseline:")
            table.insert(lines, "  Established: " .. report.baseline.established_at)
            table.insert(lines, "  Sample Count: " .. report.baseline.sample_count)
            if report.baseline.performance.mean then
                table.insert(lines, string.format("  Avg Execution: %.3fms", report.baseline.performance.mean))
            end
        end
        
        table.insert(lines, "Regression History: " .. #report.regression_history .. " detected")
        table.insert(lines, "Active Alerts: " .. #report.alerts)
        
        if report.trend_analysis then
            table.insert(lines, "Trend: " .. report.trend_analysis.trend .. 
                " (confidence: " .. string.format("%.2f", report.trend_analysis.confidence) .. ")")
        end
    else
        -- All operations overview
        table.insert(lines, "Operations Overview:")
        for op_name, op_data in pairs(report.all_operations) do
            local status_indicators = {}
            if op_data.regression_count > 0 then
                table.insert(status_indicators, "📈 " .. op_data.regression_count .. " regressions")
            end
            if op_data.alert_count > 0 then
                table.insert(status_indicators, "⚠️ " .. op_data.alert_count .. " alerts")
            end
            if op_data.trend and op_data.trend.trend == "degrading" then
                table.insert(status_indicators, "📉 degrading trend")
            end
            
            local status = #status_indicators > 0 and (" - " .. table.concat(status_indicators, ", ")) or " - ✅ healthy"
            table.insert(lines, "  " .. op_name .. status)
        end
        
        -- Recent alerts
        if report.recent_alerts and #report.recent_alerts > 0 then
            table.insert(lines, "")
            table.insert(lines, "Recent Alerts:")
            for _, alert in ipairs(report.recent_alerts) do
                table.insert(lines, "  " .. alert.alert_time .. " - " .. alert.operation_name .. 
                    " (" .. alert.severity .. ")")
            end
        end
    end
    
    return table.concat(lines, "\n")
end

function RegressionDetector.getRecentAlerts(count)
    local all_alerts = {}
    
    for op_name, op_alerts in pairs(alerts) do
        for _, alert in ipairs(op_alerts) do
            table.insert(all_alerts, alert)
        end
    end
    
    -- Sort by timestamp
    table.sort(all_alerts, function(a, b) return a.timestamp > b.timestamp end)
    
    -- Return most recent
    local recent = {}
    for i = 1, math.min(count, #all_alerts) do
        table.insert(recent, all_alerts[i])
    end
    
    return recent
end

-- Utility functions
function RegressionDetector.updateTrendData(operation_name, execution_time, memory_delta, timestamp)
    if not config.trend_analysis_enabled then return end
    
    trend_data[operation_name] = trend_data[operation_name] or {
        execution_times = {},
        memory_usage = {},
        timestamps = {}
    }
    
    local data = trend_data[operation_name]
    
    table.insert(data.execution_times, execution_time)
    table.insert(data.memory_usage, memory_delta or 0)
    table.insert(data.timestamps, timestamp or os.clock())
    
    -- Maintain window size
    if #data.execution_times > config.trend_window_size then
        table.remove(data.execution_times, 1)
        table.remove(data.memory_usage, 1)
        table.remove(data.timestamps, 1)
    end
end

function RegressionDetector.reset(operation_name)
    if operation_name then
        baselines[operation_name] = nil
        regression_history[operation_name] = nil
        alerts[operation_name] = nil
        trend_data[operation_name] = nil
    else
        baselines = {}
        regression_history = {}
        alerts = {}
        trend_data = {}
    end
end

function RegressionDetector.configure(new_config)
    for k, v in pairs(new_config) do
        config[k] = v
    end
end

function RegressionDetector.getBaseline(operation_name)
    return baselines[operation_name]
end

function RegressionDetector.getRegressionHistory(operation_name)
    return regression_history[operation_name] or {}
end

function RegressionDetector.getAlerts(operation_name)
    return alerts[operation_name] or {}
end

function RegressionDetector.isEnabled()
    return config.enabled
end

return RegressionDetector