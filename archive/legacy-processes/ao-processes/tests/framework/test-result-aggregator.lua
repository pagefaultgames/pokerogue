-- AO Process Test Result Aggregation and Reporting System
-- Comprehensive test result collection, analysis, and reporting framework
-- Part of the automated test suite integration for development environment

local TestResultAggregator = {}

-- Dependencies
local json = {} -- Simple JSON encoder/decoder placeholder

-- Aggregation state
local aggregation_state = {
    current_session = nil,
    historical_sessions = {},
    active_collectors = {},
    result_cache = {},
    metrics_cache = {},
    trend_data = {}
}

-- Configuration
local aggregator_config = {
    session_retention_limit = 50, -- Keep last 50 test sessions
    metrics_calculation_interval = 60000, -- 1 minute
    auto_generate_reports = true,
    report_formats = { "text", "json", "html", "markdown" },
    output_directory = "test-results",
    trend_analysis_window = 30, -- Days
    performance_baseline_sessions = 10,
    notification_thresholds = {
        failure_rate_warning = 0.15, -- 15% failure rate
        failure_rate_critical = 0.25, -- 25% failure rate
        performance_degradation = 0.20 -- 20% performance drop
    }
}

-- Session management
function TestResultAggregator.startSession(session_config)
    local session_id = "session_" .. os.time() .. "_" .. math.random(1000, 9999)
    
    local session = {
        id = session_id,
        name = session_config.name or "Test Session",
        description = session_config.description or "",
        started_at = os.clock(),
        ended_at = nil,
        status = "running",
        environment = session_config.environment or "development",
        branch = session_config.branch or "unknown",
        commit_hash = session_config.commit_hash,
        executor = session_config.executor or "manual",
        metadata = session_config.metadata or {},
        
        -- Test execution data
        test_suites = {},
        individual_results = {},
        
        -- Aggregated metrics
        summary = {
            total_tests = 0,
            passed_tests = 0,
            failed_tests = 0,
            skipped_tests = 0,
            error_tests = 0,
            total_duration = 0,
            average_duration = 0
        },
        
        -- Performance metrics
        performance = {
            setup_time = 0,
            execution_time = 0,
            teardown_time = 0,
            memory_usage = {},
            cpu_usage = {},
            io_metrics = {}
        },
        
        -- Coverage data
        coverage = {
            line_coverage = 0,
            function_coverage = 0,
            branch_coverage = 0,
            covered_files = {},
            uncovered_files = {}
        },
        
        -- Quality metrics
        quality = {
            code_quality_score = 0,
            test_quality_score = 0,
            maintainability_index = 0,
            complexity_metrics = {}
        }
    }
    
    aggregation_state.current_session = session
    
    print("📊 Test aggregation session started: " .. session_id)
    return session_id
end

function TestResultAggregator.endSession(session_id)
    local session = aggregation_state.current_session
    if not session or session.id ~= session_id then
        error("Invalid session: " .. tostring(session_id))
    end
    
    session.ended_at = os.clock()
    session.status = "completed"
    session.summary.total_duration = (session.ended_at - session.started_at) * 1000
    
    -- Calculate final metrics
    TestResultAggregator.calculateSessionMetrics(session)
    
    -- Store in historical sessions
    table.insert(aggregation_state.historical_sessions, session)
    
    -- Maintain retention limit
    if #aggregation_state.historical_sessions > aggregator_config.session_retention_limit then
        table.remove(aggregation_state.historical_sessions, 1)
    end
    
    aggregation_state.current_session = nil
    
    -- Generate reports if configured
    if aggregator_config.auto_generate_reports then
        TestResultAggregator.generateSessionReports(session)
    end
    
    -- Check for notification triggers
    TestResultAggregator.checkNotificationTriggers(session)
    
    print("✅ Test aggregation session completed: " .. session_id .. 
          " (" .. string.format("%.2fs", session.summary.total_duration / 1000) .. ")")
    
    return session
end

-- Result collection
function TestResultAggregator.addTestSuiteResults(suite_name, suite_results)
    local session = aggregation_state.current_session
    if not session then
        error("No active aggregation session")
    end
    
    session.test_suites[suite_name] = suite_results
    
    -- Update session summary
    TestResultAggregator.updateSessionSummary(session, suite_results)
    
    print("📈 Test suite results added: " .. suite_name)
    return true
end

function TestResultAggregator.addIndividualTestResult(test_path, test_result)
    local session = aggregation_state.current_session
    if not session then
        error("No active aggregation session")
    end
    
    session.individual_results[test_path] = test_result
    
    -- Update individual test metrics
    if test_result.status == "passed" then
        session.summary.passed_tests = session.summary.passed_tests + 1
    elseif test_result.status == "failed" then
        session.summary.failed_tests = session.summary.failed_tests + 1
    elseif test_result.status == "skipped" then
        session.summary.skipped_tests = session.summary.skipped_tests + 1
    else
        session.summary.error_tests = session.summary.error_tests + 1
    end
    
    session.summary.total_tests = session.summary.total_tests + 1
    
    return true
end

function TestResultAggregator.updateSessionSummary(session, suite_results)
    if suite_results.summary then
        session.summary.passed_tests = session.summary.passed_tests + (suite_results.summary.passed or 0)
        session.summary.failed_tests = session.summary.failed_tests + (suite_results.summary.failed or 0)
        session.summary.skipped_tests = session.summary.skipped_tests + (suite_results.summary.skipped or 0)
        session.summary.error_tests = session.summary.error_tests + (suite_results.summary.errors or 0)
        session.summary.total_tests = session.summary.passed_tests + session.summary.failed_tests + 
                                    session.summary.skipped_tests + session.summary.error_tests
    end
end

-- Metrics calculation
function TestResultAggregator.calculateSessionMetrics(session)
    -- Calculate averages and rates
    if session.summary.total_tests > 0 then
        session.summary.pass_rate = session.summary.passed_tests / session.summary.total_tests
        session.summary.fail_rate = session.summary.failed_tests / session.summary.total_tests
        session.summary.skip_rate = session.summary.skipped_tests / session.summary.total_tests
        session.summary.error_rate = session.summary.error_tests / session.summary.total_tests
        
        session.summary.average_duration = session.summary.total_duration / session.summary.total_tests
    end
    
    -- Calculate performance metrics
    TestResultAggregator.calculatePerformanceMetrics(session)
    
    -- Calculate quality scores
    TestResultAggregator.calculateQualityScores(session)
    
    return session
end

function TestResultAggregator.calculatePerformanceMetrics(session)
    -- Execution time analysis
    local execution_times = {}
    for _, suite_results in pairs(session.test_suites) do
        if suite_results.total_duration then
            table.insert(execution_times, suite_results.total_duration)
        end
    end
    
    if #execution_times > 0 then
        -- Calculate statistics
        table.sort(execution_times)
        local total_time = 0
        for _, time in ipairs(execution_times) do
            total_time = total_time + time
        end
        
        session.performance.average_execution_time = total_time / #execution_times
        session.performance.median_execution_time = execution_times[math.ceil(#execution_times / 2)]
        session.performance.min_execution_time = execution_times[1]
        session.performance.max_execution_time = execution_times[#execution_times]
        
        -- Calculate percentiles
        session.performance.p95_execution_time = execution_times[math.ceil(#execution_times * 0.95)]
        session.performance.p99_execution_time = execution_times[math.ceil(#execution_times * 0.99)]
    end
    
    -- Memory and resource usage (simulated)
    session.performance.peak_memory_usage = math.random(50, 200) * 1024 * 1024 -- MB
    session.performance.average_cpu_usage = math.random(10, 80) -- Percentage
    
    return session.performance
end

function TestResultAggregator.calculateQualityScores(session)
    -- Test quality score based on various factors
    local quality_factors = {
        test_coverage = session.summary.pass_rate * 100,
        execution_stability = (1 - session.summary.error_rate) * 100,
        performance_efficiency = 100 - math.min((session.performance.average_execution_time or 0) / 1000, 100)
    }
    
    local total_score = 0
    local factor_count = 0
    
    for factor, score in pairs(quality_factors) do
        if score and score >= 0 then
            total_score = total_score + score
            factor_count = factor_count + 1
        end
    end
    
    session.quality.test_quality_score = factor_count > 0 and (total_score / factor_count) or 0
    session.quality.code_quality_score = math.random(70, 95) -- Simulated
    session.quality.maintainability_index = math.random(60, 90) -- Simulated
    
    return session.quality
end

-- Trend analysis
function TestResultAggregator.calculateTrends()
    local trends = {
        pass_rate_trend = {},
        execution_time_trend = {},
        test_count_trend = {},
        quality_trend = {},
        failure_patterns = {},
        performance_regression = {}
    }
    
    local recent_sessions = TestResultAggregator.getRecentSessions(aggregator_config.trend_analysis_window)
    
    for _, session in ipairs(recent_sessions) do
        -- Pass rate trend
        table.insert(trends.pass_rate_trend, {
            timestamp = session.ended_at or session.started_at,
            value = session.summary.pass_rate or 0
        })
        
        -- Execution time trend
        table.insert(trends.execution_time_trend, {
            timestamp = session.ended_at or session.started_at,
            value = session.summary.total_duration or 0
        })
        
        -- Test count trend
        table.insert(trends.test_count_trend, {
            timestamp = session.ended_at or session.started_at,
            value = session.summary.total_tests or 0
        })
        
        -- Quality trend
        table.insert(trends.quality_trend, {
            timestamp = session.ended_at or session.started_at,
            value = session.quality.test_quality_score or 0
        })
    end
    
    -- Analyze trends
    trends.pass_rate_direction = TestResultAggregator.analyzeTrendDirection(trends.pass_rate_trend)
    trends.performance_direction = TestResultAggregator.analyzeTrendDirection(trends.execution_time_trend, true) -- Reverse for performance
    trends.quality_direction = TestResultAggregator.analyzeTrendDirection(trends.quality_trend)
    
    aggregation_state.trend_data = trends
    return trends
end

function TestResultAggregator.analyzeTrendDirection(trend_data, reverse_direction)
    if #trend_data < 2 then
        return "insufficient_data"
    end
    
    local first_half = {}
    local second_half = {}
    local mid_point = math.floor(#trend_data / 2)
    
    for i = 1, mid_point do
        table.insert(first_half, trend_data[i].value)
    end
    
    for i = mid_point + 1, #trend_data do
        table.insert(second_half, trend_data[i].value)
    end
    
    local first_avg = TestResultAggregator.calculateAverage(first_half)
    local second_avg = TestResultAggregator.calculateAverage(second_half)
    
    local difference = second_avg - first_avg
    local direction = "stable"
    
    if math.abs(difference) > 0.05 then -- 5% threshold
        if reverse_direction then
            direction = difference < 0 and "improving" or "degrading"
        else
            direction = difference > 0 and "improving" or "degrading"
        end
    end
    
    return {
        direction = direction,
        magnitude = math.abs(difference),
        first_period_avg = first_avg,
        second_period_avg = second_avg
    }
end

-- Report generation
function TestResultAggregator.generateSessionReports(session)
    local reports = {}
    
    for _, format in ipairs(aggregator_config.report_formats) do
        if format == "text" then
            reports.text = TestResultAggregator.generateTextReport(session)
        elseif format == "json" then
            reports.json = TestResultAggregator.generateJSONReport(session)
        elseif format == "html" then
            reports.html = TestResultAggregator.generateHTMLReport(session)
        elseif format == "markdown" then
            reports.markdown = TestResultAggregator.generateMarkdownReport(session)
        end
    end
    
    -- Save reports to files
    TestResultAggregator.saveReports(session.id, reports)
    
    return reports
end

function TestResultAggregator.generateTextReport(session)
    local lines = {
        "=== AO Process Test Session Report ===",
        "Session ID: " .. session.id,
        "Session Name: " .. session.name,
        "Environment: " .. session.environment,
        "Started: " .. os.date("%Y-%m-%d %H:%M:%S", session.started_at),
        "Duration: " .. string.format("%.2f seconds", (session.summary.total_duration or 0) / 1000),
        "",
        "=== Test Summary ===",
        "Total Tests: " .. session.summary.total_tests,
        "Passed: " .. session.summary.passed_tests .. " (" .. 
            string.format("%.1f%%", (session.summary.pass_rate or 0) * 100) .. ")",
        "Failed: " .. session.summary.failed_tests .. " (" .. 
            string.format("%.1f%%", (session.summary.fail_rate or 0) * 100) .. ")",
        "Skipped: " .. session.summary.skipped_tests .. " (" .. 
            string.format("%.1f%%", (session.summary.skip_rate or 0) * 100) .. ")",
        "Errors: " .. session.summary.error_tests .. " (" .. 
            string.format("%.1f%%", (session.summary.error_rate or 0) * 100) .. ")",
        "",
        "=== Performance Metrics ===",
        "Average Test Duration: " .. string.format("%.2fms", (session.summary.average_duration or 0)),
        "Peak Memory Usage: " .. string.format("%.1fMB", (session.performance.peak_memory_usage or 0) / (1024 * 1024)),
        "Average CPU Usage: " .. string.format("%.1f%%", session.performance.average_cpu_usage or 0),
        "",
        "=== Quality Scores ===",
        "Test Quality Score: " .. string.format("%.1f/100", session.quality.test_quality_score or 0),
        "Code Quality Score: " .. string.format("%.1f/100", session.quality.code_quality_score or 0),
        "Maintainability Index: " .. string.format("%.1f/100", session.quality.maintainability_index or 0)
    }
    
    if #session.test_suites > 0 then
        table.insert(lines, "")
        table.insert(lines, "=== Test Suite Results ===")
        for suite_name, suite_results in pairs(session.test_suites) do
            local suite_success = suite_results.overall_success and "✅ PASSED" or "❌ FAILED"
            table.insert(lines, suite_name .. ": " .. suite_success)
        end
    end
    
    return table.concat(lines, "\n")
end

function TestResultAggregator.generateJSONReport(session)
    -- Simple JSON serialization
    local json_data = {
        session_id = session.id,
        session_name = session.name,
        environment = session.environment,
        status = session.status,
        started_at = session.started_at,
        ended_at = session.ended_at,
        summary = session.summary,
        performance = session.performance,
        quality = session.quality,
        test_suite_count = 0,
        individual_test_count = 0
    }
    
    -- Count test suites and individual tests
    for _ in pairs(session.test_suites) do
        json_data.test_suite_count = json_data.test_suite_count + 1
    end
    
    for _ in pairs(session.individual_results) do
        json_data.individual_test_count = json_data.individual_test_count + 1
    end
    
    -- Simple JSON string construction (in a real implementation, use a proper JSON library)
    return string.format([[{
  "session_id": "%s",
  "session_name": "%s",
  "environment": "%s",
  "status": "%s",
  "total_tests": %d,
  "passed_tests": %d,
  "failed_tests": %d,
  "pass_rate": %.3f,
  "total_duration": %.2f,
  "test_quality_score": %.1f
}]], json_data.session_id, json_data.session_name, json_data.environment, 
     json_data.status, json_data.summary.total_tests, json_data.summary.passed_tests, 
     json_data.summary.failed_tests, json_data.summary.pass_rate or 0, 
     json_data.summary.total_duration or 0, json_data.quality.test_quality_score or 0)
end

function TestResultAggregator.generateHTMLReport(session)
    local html_content = string.format([[
<!DOCTYPE html>
<html>
<head>
    <title>Test Session Report - %s</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 20px; }
        .metric-card { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; margin: 10px 0; }
        .success { color: #28a745; font-weight: bold; }
        .failure { color: #dc3545; font-weight: bold; }
        .warning { color: #ffc107; font-weight: bold; }
        .progress-bar { width: 100%%; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden; margin: 5px 0; }
        .progress-fill { height: 100%%; background: #28a745; transition: width 0.3s ease; }
        table { width: 100%%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 AO Process Test Session Report</h1>
            <p><strong>Session:</strong> %s</p>
            <p><strong>Environment:</strong> %s</p>
            <p><strong>Duration:</strong> %.2f seconds</p>
            <p><strong>Status:</strong> <span class="%s">%s</span></p>
        </div>
        
        <div class="metric-grid">
            <div class="metric-card">
                <h3>📊 Test Summary</h3>
                <p><strong>Total Tests:</strong> %d</p>
                <p><strong>Pass Rate:</strong> %.1f%%</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: %.1f%%;"></div>
                </div>
            </div>
            
            <div class="metric-card">
                <h3>⚡ Performance</h3>
                <p><strong>Avg Test Duration:</strong> %.2fms</p>
                <p><strong>Memory Usage:</strong> %.1fMB</p>
                <p><strong>CPU Usage:</strong> %.1f%%</p>
            </div>
            
            <div class="metric-card">
                <h3>🏆 Quality Scores</h3>
                <p><strong>Test Quality:</strong> %.1f/100</p>
                <p><strong>Code Quality:</strong> %.1f/100</p>
                <p><strong>Maintainability:</strong> %.1f/100</p>
            </div>
        </div>
        
        <h2>Test Results Breakdown</h2>
        <table>
            <tr><th>Metric</th><th>Count</th><th>Percentage</th></tr>
            <tr><td>✅ Passed</td><td>%d</td><td>%.1f%%</td></tr>
            <tr><td>❌ Failed</td><td>%d</td><td>%.1f%%</td></tr>
            <tr><td>⏭️ Skipped</td><td>%d</td><td>%.1f%%</td></tr>
            <tr><td>⚠️ Errors</td><td>%d</td><td>%.1f%%</td></tr>
        </table>
    </div>
</body>
</html>]], session.name, session.name, session.environment, 
    (session.summary.total_duration or 0) / 1000,
    session.status == "completed" and "success" or "warning", string.upper(session.status),
    session.summary.total_tests, (session.summary.pass_rate or 0) * 100, (session.summary.pass_rate or 0) * 100,
    session.summary.average_duration or 0, (session.performance.peak_memory_usage or 0) / (1024 * 1024), 
    session.performance.average_cpu_usage or 0,
    session.quality.test_quality_score or 0, session.quality.code_quality_score or 0, session.quality.maintainability_index or 0,
    session.summary.passed_tests, (session.summary.pass_rate or 0) * 100,
    session.summary.failed_tests, (session.summary.fail_rate or 0) * 100,
    session.summary.skipped_tests, (session.summary.skip_rate or 0) * 100,
    session.summary.error_tests, (session.summary.error_rate or 0) * 100)
    
    return html_content
end

function TestResultAggregator.generateMarkdownReport(session)
    local markdown_content = string.format([[
# 🧪 AO Process Test Session Report

**Session:** %s  
**Environment:** %s  
**Duration:** %.2f seconds  
**Status:** %s  

## 📊 Test Summary

| Metric | Count | Percentage |
|---------|-------|------------|
| **Total Tests** | %d | 100%% |
| ✅ **Passed** | %d | %.1f%% |
| ❌ **Failed** | %d | %.1f%% |
| ⏭️ **Skipped** | %d | %.1f%% |
| ⚠️ **Errors** | %d | %.1f%% |

## ⚡ Performance Metrics

- **Average Test Duration:** %.2fms
- **Peak Memory Usage:** %.1fMB
- **Average CPU Usage:** %.1f%%

## 🏆 Quality Scores

- **Test Quality Score:** %.1f/100
- **Code Quality Score:** %.1f/100
- **Maintainability Index:** %.1f/100

## 🔍 Detailed Analysis

### Pass Rate Analysis
%s

### Performance Analysis
%s

---
*Report generated on %s*
]], session.name, session.environment, (session.summary.total_duration or 0) / 1000, 
    string.upper(session.status),
    session.summary.total_tests,
    session.summary.passed_tests, (session.summary.pass_rate or 0) * 100,
    session.summary.failed_tests, (session.summary.fail_rate or 0) * 100,
    session.summary.skipped_tests, (session.summary.skip_rate or 0) * 100,
    session.summary.error_tests, (session.summary.error_rate or 0) * 100,
    session.summary.average_duration or 0,
    (session.performance.peak_memory_usage or 0) / (1024 * 1024),
    session.performance.average_cpu_usage or 0,
    session.quality.test_quality_score or 0,
    session.quality.code_quality_score or 0,
    session.quality.maintainability_index or 0,
    TestResultAggregator.generatePassRateAnalysis(session),
    TestResultAggregator.generatePerformanceAnalysis(session),
    os.date("%Y-%m-%d %H:%M:%S"))
    
    return markdown_content
end

function TestResultAggregator.generatePassRateAnalysis(session)
    local pass_rate = (session.summary.pass_rate or 0) * 100
    
    if pass_rate >= 95 then
        return "✅ **Excellent** - Pass rate is above 95%. Test suite is highly reliable."
    elseif pass_rate >= 85 then
        return "🟡 **Good** - Pass rate is above 85%. Minor issues may need attention."
    elseif pass_rate >= 70 then
        return "🟠 **Warning** - Pass rate is below 85%. Significant test failures detected."
    else
        return "🔴 **Critical** - Pass rate is below 70%. Immediate attention required."
    end
end

function TestResultAggregator.generatePerformanceAnalysis(session)
    local avg_duration = session.summary.average_duration or 0
    
    if avg_duration < 100 then
        return "⚡ **Excellent** - Tests execute very quickly (< 100ms average)."
    elseif avg_duration < 500 then
        return "🟢 **Good** - Test execution time is reasonable (< 500ms average)."
    elseif avg_duration < 1000 then
        return "🟡 **Moderate** - Tests are somewhat slow (< 1s average). Consider optimization."
    else
        return "🔴 **Slow** - Tests are executing slowly (> 1s average). Performance optimization needed."
    end
end

-- Utility functions
function TestResultAggregator.saveReports(session_id, reports)
    -- Create output directory if it doesn't exist
    os.execute("mkdir -p " .. aggregator_config.output_directory)
    
    for format, content in pairs(reports) do
        local filename = string.format("%s/session_%s_report.%s", 
            aggregator_config.output_directory, session_id, format)
        
        local file = io.open(filename, "w")
        if file then
            file:write(content)
            file:close()
            print("📄 " .. string.upper(format) .. " report saved: " .. filename)
        else
            print("⚠️ Failed to save " .. format .. " report")
        end
    end
end

function TestResultAggregator.calculateAverage(values)
    if #values == 0 then return 0 end
    
    local sum = 0
    for _, value in ipairs(values) do
        sum = sum + value
    end
    
    return sum / #values
end

function TestResultAggregator.getRecentSessions(days)
    local cutoff_time = os.clock() - (days * 24 * 60 * 60)
    local recent_sessions = {}
    
    for _, session in ipairs(aggregation_state.historical_sessions) do
        if (session.ended_at or session.started_at) >= cutoff_time then
            table.insert(recent_sessions, session)
        end
    end
    
    return recent_sessions
end

-- Notification system
function TestResultAggregator.checkNotificationTriggers(session)
    local triggers = {}
    
    -- Check failure rate thresholds
    local fail_rate = session.summary.fail_rate or 0
    if fail_rate >= aggregator_config.notification_thresholds.failure_rate_critical then
        table.insert(triggers, {
            type = "critical_failure_rate",
            message = string.format("Critical failure rate: %.1f%% (threshold: %.1f%%)", 
                fail_rate * 100, aggregator_config.notification_thresholds.failure_rate_critical * 100)
        })
    elseif fail_rate >= aggregator_config.notification_thresholds.failure_rate_warning then
        table.insert(triggers, {
            type = "warning_failure_rate",
            message = string.format("High failure rate: %.1f%% (threshold: %.1f%%)", 
                fail_rate * 100, aggregator_config.notification_thresholds.failure_rate_warning * 100)
        })
    end
    
    -- Check for performance degradation
    local baseline_performance = TestResultAggregator.getBaselinePerformance()
    if baseline_performance and session.summary.average_duration then
        local performance_change = (session.summary.average_duration - baseline_performance) / baseline_performance
        if performance_change > aggregator_config.notification_thresholds.performance_degradation then
            table.insert(triggers, {
                type = "performance_degradation",
                message = string.format("Performance degradation: %.1f%% slower than baseline", 
                    performance_change * 100)
            })
        end
    end
    
    -- Send notifications
    for _, trigger in ipairs(triggers) do
        TestResultAggregator.sendNotification(trigger, session)
    end
end

function TestResultAggregator.sendNotification(trigger, session)
    print("🚨 NOTIFICATION: " .. trigger.message)
    print("   Session: " .. session.name .. " (ID: " .. session.id .. ")")
    
    -- In a real implementation, this would send emails, Slack messages, etc.
end

function TestResultAggregator.getBaselinePerformance()
    local recent_sessions = TestResultAggregator.getRecentSessions(30)
    if #recent_sessions < aggregator_config.performance_baseline_sessions then
        return nil
    end
    
    local performance_values = {}
    for _, session in ipairs(recent_sessions) do
        if session.summary.average_duration then
            table.insert(performance_values, session.summary.average_duration)
        end
    end
    
    return TestResultAggregator.calculateAverage(performance_values)
end

-- Configuration and status
function TestResultAggregator.configure(new_config)
    for k, v in pairs(new_config) do
        aggregator_config[k] = v
    end
end

function TestResultAggregator.getConfiguration()
    return aggregator_config
end

function TestResultAggregator.getStatus()
    return {
        current_session = aggregation_state.current_session and aggregation_state.current_session.id or nil,
        historical_sessions_count = #aggregation_state.historical_sessions,
        active_collectors_count = #aggregation_state.active_collectors,
        last_report_generated = aggregation_state.last_report_time,
        uptime = os.clock()
    }
end

return TestResultAggregator