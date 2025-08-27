-- Parity Reporting System for Validation Results
-- Comprehensive reporting and analysis of TypeScript vs Lua parity validation

local ParityReporter = {}

-- Report state and configuration
local report_history = {}
local report_templates = {}
local analysis_cache = {}

local config = {
    enabled = true,
    auto_generate_reports = true,
    report_formats = { "text", "html", "json", "csv" },
    default_format = "text",
    include_detailed_analysis = true,
    include_trend_analysis = true,
    max_history_entries = 100,
    generate_charts = false, -- Would require external charting library
    export_artifacts = true
}

-- Core reporting functions
function ParityReporter.generateComprehensiveReport(validation_results, report_config)
    report_config = report_config or {}
    local format = report_config.format or config.default_format
    
    local report = {
        report_id = "parity_report_" .. tostring(os.clock()),
        generated_at = os.date("%Y-%m-%d %H:%M:%S"),
        timestamp = os.clock(),
        format = format,
        
        -- Executive summary
        executive_summary = ParityReporter.generateExecutiveSummary(validation_results),
        
        -- Detailed validation results
        validation_details = ParityReporter.analyzeValidationResults(validation_results),
        
        -- Parity analysis
        parity_analysis = ParityReporter.generateParityAnalysis(validation_results),
        
        -- Performance analysis
        performance_analysis = ParityReporter.generatePerformanceAnalysis(validation_results),
        
        -- Failure analysis
        failure_analysis = ParityReporter.generateFailureAnalysis(validation_results),
        
        -- Recommendations
        recommendations = ParityReporter.generateRecommendations(validation_results),
        
        -- Trend analysis
        trend_analysis = config.include_trend_analysis and ParityReporter.generateTrendAnalysis(validation_results) or nil,
        
        -- Artifacts
        artifacts = config.export_artifacts and ParityReporter.generateArtifacts(validation_results) or nil,
        
        -- Configuration used
        report_config = report_config,
        system_config = config
    }
    
    -- Store in history
    table.insert(report_history, report)
    if #report_history > config.max_history_entries then
        table.remove(report_history, 1)
    end
    
    -- Format and return report
    if format == "json" then
        return ParityReporter.formatJSON(report)
    elseif format == "html" then
        return ParityReporter.formatHTML(report)
    elseif format == "csv" then
        return ParityReporter.formatCSV(report)
    else
        return ParityReporter.formatText(report)
    end
end

function ParityReporter.generateExecutiveSummary(validation_results)
    local total_validations = 0
    local total_test_cases = 0
    local total_passed = 0
    local total_failed = 0
    local critical_failures = 0
    local execution_time = 0
    
    local suite_summaries = {}
    
    -- Aggregate results across all validation suites
    for suite_name, suite_results in pairs(validation_results) do
        if type(suite_results) == "table" and suite_results.validation_count then
            total_validations = total_validations + suite_results.validation_count
            total_passed = total_passed + suite_results.passed_count
            total_failed = total_failed + suite_results.failed_count
            critical_failures = critical_failures + (suite_results.critical_failures or 0)
            execution_time = execution_time + suite_results.execution_time
            
            -- Calculate test case counts from validation results
            local suite_test_cases = 0
            if suite_results.validation_results then
                for _, validation_result in pairs(suite_results.validation_results) do
                    if validation_result.statistics then
                        suite_test_cases = suite_test_cases + (validation_result.statistics.total_tests or 0)
                    end
                end
            end
            total_test_cases = total_test_cases + suite_test_cases
            
            table.insert(suite_summaries, {
                suite_name = suite_name,
                parity_rate = suite_results.parity_rate or 0,
                critical = suite_results.critical or false,
                validation_count = suite_results.validation_count,
                test_case_count = suite_test_cases,
                execution_time = suite_results.execution_time
            })
        end
    end
    
    local overall_parity_rate = total_validations > 0 and (total_passed / total_validations) or 0
    local overall_success = overall_parity_rate >= 0.95 and critical_failures == 0
    
    return {
        overall_success = overall_success,
        overall_parity_rate = overall_parity_rate,
        total_validations = total_validations,
        total_test_cases = total_test_cases,
        total_passed = total_passed,
        total_failed = total_failed,
        critical_failures = critical_failures,
        total_execution_time = execution_time,
        suite_count = 0,
        suite_summaries = suite_summaries,
        
        -- Key insights
        key_insights = {
            parity_quality = overall_parity_rate >= 0.99 and "excellent" or 
                           overall_parity_rate >= 0.95 and "good" or 
                           overall_parity_rate >= 0.85 and "acceptable" or "poor",
            critical_issues = critical_failures > 0,
            performance_rating = execution_time < 5000 and "fast" or 
                               execution_time < 15000 and "moderate" or "slow",
            readiness_assessment = overall_success and "ready_for_production" or "needs_attention"
        }
    }
end

function ParityReporter.analyzeValidationResults(validation_results)
    local validation_analysis = {
        suite_analyses = {},
        cross_suite_patterns = {},
        validation_coverage = {}
    }
    
    -- Analyze each validation suite
    for suite_name, suite_results in pairs(validation_results) do
        if type(suite_results) == "table" and suite_results.validation_results then
            local suite_analysis = {
                suite_name = suite_name,
                validation_breakdown = {},
                common_failure_patterns = {},
                performance_metrics = {},
                coverage_analysis = {}
            }
            
            -- Analyze individual validations
            for validation_name, validation_result in pairs(suite_results.validation_results) do
                local validation_breakdown = {
                    name = validation_name,
                    status = validation_result.status,
                    parity_rate = validation_result.statistics and validation_result.statistics.parity_rate or 0,
                    test_count = validation_result.statistics and validation_result.statistics.total_tests or 0,
                    execution_time = validation_result.execution_time or 0,
                    failure_types = {},
                    sample_failures = {}
                }
                
                -- Analyze failure patterns
                if validation_result.test_case_results then
                    local failure_types = {}
                    local sample_count = 0
                    
                    for test_case_id, test_result in pairs(validation_result.test_case_results) do
                        if not test_result.parity_achieved then
                            -- Categorize failure types
                            if test_result.comparison_details and test_result.comparison_details.mismatches then
                                for _, mismatch in ipairs(test_result.comparison_details.mismatches) do
                                    failure_types[mismatch.type] = (failure_types[mismatch.type] or 0) + 1
                                end
                            end
                            
                            if test_result.errors and #test_result.errors > 0 then
                                failure_types["execution_error"] = (failure_types["execution_error"] or 0) + 1
                            end
                            
                            -- Collect sample failures for detailed analysis
                            if sample_count < 5 then
                                table.insert(validation_breakdown.sample_failures, {
                                    test_case_id = test_case_id,
                                    errors = test_result.errors,
                                    mismatches = test_result.comparison_details and test_result.comparison_details.mismatches or {}
                                })
                                sample_count = sample_count + 1
                            end
                        end
                    end
                    
                    validation_breakdown.failure_types = failure_types
                end
                
                suite_analysis.validation_breakdown[validation_name] = validation_breakdown
            end
            
            validation_analysis.suite_analyses[suite_name] = suite_analysis
        end
    end
    
    return validation_analysis
end

function ParityReporter.generateParityAnalysis(validation_results)
    local parity_analysis = {
        overall_parity_score = 0,
        parity_distribution = {},
        critical_parity_issues = {},
        parity_trends = {},
        component_parity_scores = {}
    }
    
    local total_weight = 0
    local weighted_parity_sum = 0
    
    -- Calculate weighted parity scores
    for suite_name, suite_results in pairs(validation_results) do
        if type(suite_results) == "table" and suite_results.parity_rate then
            local suite_weight = suite_results.critical and 3.0 or 1.0
            local suite_parity = suite_results.parity_rate
            
            total_weight = total_weight + suite_weight
            weighted_parity_sum = weighted_parity_sum + (suite_parity * suite_weight)
            
            parity_analysis.component_parity_scores[suite_name] = {
                parity_rate = suite_parity,
                weight = suite_weight,
                contribution = suite_parity * suite_weight,
                critical = suite_results.critical or false
            }
            
            -- Identify critical parity issues
            if suite_results.critical and suite_parity < 0.95 then
                table.insert(parity_analysis.critical_parity_issues, {
                    component = suite_name,
                    parity_rate = suite_parity,
                    severity = suite_parity < 0.5 and "critical" or 
                              suite_parity < 0.8 and "high" or "medium"
                })
            end
        end
    end
    
    parity_analysis.overall_parity_score = total_weight > 0 and (weighted_parity_sum / total_weight) or 0
    
    -- Generate parity distribution
    local parity_buckets = {
        excellent = 0, -- 95-100%
        good = 0,      -- 85-94%
        fair = 0,      -- 70-84%
        poor = 0       -- <70%
    }
    
    for suite_name, score_info in pairs(parity_analysis.component_parity_scores) do
        local rate = score_info.parity_rate
        if rate >= 0.95 then
            parity_buckets.excellent = parity_buckets.excellent + 1
        elseif rate >= 0.85 then
            parity_buckets.good = parity_buckets.good + 1
        elseif rate >= 0.70 then
            parity_buckets.fair = parity_buckets.fair + 1
        else
            parity_buckets.poor = parity_buckets.poor + 1
        end
    end
    
    parity_analysis.parity_distribution = parity_buckets
    
    return parity_analysis
end

function ParityReporter.generatePerformanceAnalysis(validation_results)
    local performance_analysis = {
        execution_times = {},
        performance_comparison = {},
        bottlenecks = {},
        efficiency_metrics = {}
    }
    
    local total_execution_time = 0
    local typescript_total_time = 0
    local lua_total_time = 0
    local test_case_count = 0
    
    -- Analyze execution performance
    for suite_name, suite_results in pairs(validation_results) do
        if type(suite_results) == "table" then
            local suite_execution_time = suite_results.execution_time or 0
            total_execution_time = total_execution_time + suite_execution_time
            
            performance_analysis.execution_times[suite_name] = {
                total_time = suite_execution_time,
                validation_count = suite_results.validation_count or 0,
                time_per_validation = suite_results.validation_count and suite_results.validation_count > 0 and 
                    (suite_execution_time / suite_results.validation_count) or 0
            }
            
            -- Analyze individual validation performance
            if suite_results.validation_results then
                for validation_name, validation_result in pairs(suite_results.validation_results) do
                    local validation_time = validation_result.execution_time or 0
                    local validation_tests = validation_result.statistics and validation_result.statistics.total_tests or 0
                    
                    test_case_count = test_case_count + validation_tests
                    
                    -- Identify performance bottlenecks
                    if validation_time > 1000 then -- More than 1 second
                        table.insert(performance_analysis.bottlenecks, {
                            suite = suite_name,
                            validation = validation_name,
                            execution_time = validation_time,
                            test_count = validation_tests,
                            time_per_test = validation_tests > 0 and (validation_time / validation_tests) or 0
                        })
                    end
                    
                    -- Collect TypeScript vs Lua performance data if available
                    if validation_result.test_case_results then
                        for _, test_result in pairs(validation_result.test_case_results) do
                            if test_result.execution_times then
                                if test_result.execution_times.typescript then
                                    typescript_total_time = typescript_total_time + test_result.execution_times.typescript
                                end
                                if test_result.execution_times.lua then
                                    lua_total_time = lua_total_time + test_result.execution_times.lua
                                end
                            end
                        end
                    end
                end
            end
        end
    end
    
    performance_analysis.performance_comparison = {
        total_execution_time = total_execution_time,
        typescript_time = typescript_total_time,
        lua_time = lua_total_time,
        average_time_per_test = test_case_count > 0 and (total_execution_time / test_case_count) or 0,
        performance_ratio = lua_total_time > 0 and typescript_total_time > 0 and 
            (lua_total_time / typescript_total_time) or 1.0
    }
    
    performance_analysis.efficiency_metrics = {
        tests_per_second = total_execution_time > 0 and (test_case_count / (total_execution_time / 1000)) or 0,
        time_efficiency_rating = total_execution_time < 5000 and "excellent" or
                               total_execution_time < 15000 and "good" or
                               total_execution_time < 30000 and "acceptable" or "poor"
    }
    
    return performance_analysis
end

function ParityReporter.generateFailureAnalysis(validation_results)
    local failure_analysis = {
        failure_categories = {},
        root_cause_analysis = {},
        failure_patterns = {},
        impact_assessment = {}
    }
    
    local failure_types = {}
    local common_failure_paths = {}
    local critical_failures = {}
    
    -- Analyze failure patterns across all validations
    for suite_name, suite_results in pairs(validation_results) do
        if type(suite_results) == "table" and suite_results.validation_results then
            for validation_name, validation_result in pairs(suite_results.validation_results) do
                if validation_result.status == "failed" and validation_result.test_case_results then
                    
                    -- Categorize failures by type
                    for test_case_id, test_result in pairs(validation_result.test_case_results) do
                        if not test_result.parity_achieved then
                            
                            -- Analyze comparison mismatches
                            if test_result.comparison_details and test_result.comparison_details.mismatches then
                                for _, mismatch in ipairs(test_result.comparison_details.mismatches) do
                                    local failure_type = mismatch.type
                                    failure_types[failure_type] = (failure_types[failure_type] or 0) + 1
                                    
                                    -- Track failure paths for pattern analysis
                                    local failure_path = mismatch.path
                                    common_failure_paths[failure_path] = (common_failure_paths[failure_path] or 0) + 1
                                end
                            end
                            
                            -- Analyze execution errors
                            if test_result.errors and #test_result.errors > 0 then
                                for _, error_info in ipairs(test_result.errors) do
                                    local error_type = "execution_error_" .. error_info.implementation
                                    failure_types[error_type] = (failure_types[error_type] or 0) + 1
                                end
                            end
                            
                            -- Identify critical failures
                            if validation_result.critical or (suite_results.critical and validation_result.statistics and 
                                validation_result.statistics.parity_rate < 0.8) then
                                table.insert(critical_failures, {
                                    suite = suite_name,
                                    validation = validation_name,
                                    test_case = test_case_id,
                                    failure_details = test_result
                                })
                            end
                        end
                    end
                end
            end
        end
    end
    
    failure_analysis.failure_categories = failure_types
    failure_analysis.failure_patterns = common_failure_paths
    failure_analysis.impact_assessment = {
        critical_failure_count = #critical_failures,
        most_common_failure_type = ParityReporter.findMostCommon(failure_types),
        most_common_failure_path = ParityReporter.findMostCommon(common_failure_paths),
        critical_failures = critical_failures
    }
    
    return failure_analysis
end

function ParityReporter.generateRecommendations(validation_results)
    local recommendations = {
        immediate_actions = {},
        improvement_suggestions = {},
        long_term_strategies = {},
        priority_matrix = {}
    }
    
    -- Analyze results to generate targeted recommendations
    local critical_issues = {}
    local performance_issues = {}
    local coverage_gaps = {}
    
    for suite_name, suite_results in pairs(validation_results) do
        if type(suite_results) == "table" then
            local parity_rate = suite_results.parity_rate or 0
            local is_critical = suite_results.critical or false
            
            -- Identify critical issues
            if is_critical and parity_rate < 0.95 then
                table.insert(critical_issues, {
                    component = suite_name,
                    issue = "Low parity rate in critical component",
                    severity = "high",
                    parity_rate = parity_rate
                })
                
                table.insert(recommendations.immediate_actions, {
                    priority = "high",
                    action = "Fix critical parity issues in " .. suite_name,
                    description = string.format("Parity rate of %.1f%% is below acceptable threshold for critical component", 
                        parity_rate * 100),
                    estimated_effort = "high"
                })
            end
            
            -- Identify performance issues
            local execution_time = suite_results.execution_time or 0
            if execution_time > 10000 then -- More than 10 seconds
                table.insert(performance_issues, {
                    component = suite_name,
                    issue = "Slow validation execution",
                    execution_time = execution_time
                })
                
                table.insert(recommendations.improvement_suggestions, {
                    priority = "medium",
                    action = "Optimize validation performance for " .. suite_name,
                    description = string.format("Execution time of %.1fs is longer than optimal", execution_time / 1000),
                    estimated_effort = "medium"
                })
            end
        end
    end
    
    -- Generate strategic recommendations
    if #critical_issues > 0 then
        table.insert(recommendations.long_term_strategies, {
            strategy = "Implement comprehensive parity testing in CI/CD",
            description = "Prevent critical parity issues from reaching production",
            impact = "high",
            effort = "medium"
        })
    end
    
    if #performance_issues > 0 then
        table.insert(recommendations.long_term_strategies, {
            strategy = "Optimize test execution pipeline",
            description = "Implement parallel testing and performance optimizations",
            impact = "medium",
            effort = "low"
        })
    end
    
    -- Priority matrix
    recommendations.priority_matrix = {
        high_impact_low_effort = {},
        high_impact_high_effort = {},
        low_impact_low_effort = {},
        low_impact_high_effort = {}
    }
    
    -- Categorize recommendations by impact/effort matrix
    local all_recommendations = {}
    for _, rec in ipairs(recommendations.immediate_actions) do
        table.insert(all_recommendations, rec)
    end
    for _, rec in ipairs(recommendations.improvement_suggestions) do
        table.insert(all_recommendations, rec)
    end
    
    for _, rec in ipairs(all_recommendations) do
        local impact = rec.priority == "high" and "high" or "low"
        local effort = rec.estimated_effort or "medium"
        
        if impact == "high" and effort == "low" then
            table.insert(recommendations.priority_matrix.high_impact_low_effort, rec)
        elseif impact == "high" and effort == "high" then
            table.insert(recommendations.priority_matrix.high_impact_high_effort, rec)
        elseif impact == "low" and effort == "low" then
            table.insert(recommendations.priority_matrix.low_impact_low_effort, rec)
        else
            table.insert(recommendations.priority_matrix.low_impact_high_effort, rec)
        end
    end
    
    return recommendations
end

function ParityReporter.generateTrendAnalysis(validation_results)
    -- Analyze trends from historical data
    local trend_analysis = {
        parity_trends = {},
        performance_trends = {},
        failure_trends = {},
        improvement_indicators = {}
    }
    
    -- This would typically analyze historical report data
    -- For now, we'll provide a basic analysis structure
    
    if #report_history > 1 then
        local recent_reports = {}
        local count = math.min(5, #report_history)
        
        for i = #report_history - count + 1, #report_history do
            table.insert(recent_reports, report_history[i])
        end
        
        -- Analyze parity rate trends
        local parity_rates = {}
        for _, report in ipairs(recent_reports) do
            if report.executive_summary then
                table.insert(parity_rates, report.executive_summary.overall_parity_rate)
            end
        end
        
        if #parity_rates > 1 then
            local trend_direction = parity_rates[#parity_rates] - parity_rates[1]
            trend_analysis.parity_trends = {
                direction = trend_direction > 0.01 and "improving" or 
                           trend_direction < -0.01 and "declining" or "stable",
                rate_of_change = trend_direction,
                current_rate = parity_rates[#parity_rates],
                previous_rate = parity_rates[#parity_rates - 1]
            }
        end
    end
    
    return trend_analysis
end

function ParityReporter.generateArtifacts(validation_results)
    -- Generate debugging and analysis artifacts
    local artifacts = {
        test_case_samples = {},
        configuration_snapshots = {},
        failure_logs = {},
        performance_profiles = {}
    }
    
    -- Collect sample test cases for manual inspection
    local sample_count = 0
    for suite_name, suite_results in pairs(validation_results) do
        if type(suite_results) == "table" and suite_results.validation_results and sample_count < 10 then
            for validation_name, validation_result in pairs(suite_results.validation_results) do
                if validation_result.test_case_results then
                    for test_case_id, test_result in pairs(validation_result.test_case_results) do
                        if sample_count < 10 then
                            table.insert(artifacts.test_case_samples, {
                                suite = suite_name,
                                validation = validation_name,
                                test_case = test_case_id,
                                parity_achieved = test_result.parity_achieved,
                                typescript_result = test_result.typescript_result,
                                lua_result = test_result.lua_result,
                                mismatches = test_result.comparison_details and test_result.comparison_details.mismatches or {}
                            })
                            sample_count = sample_count + 1
                        end
                    end
                end
            end
        end
    end
    
    return artifacts
end

-- Report formatting functions
function ParityReporter.formatText(report)
    local lines = {
        "====================================================================",
        "                    PARITY VALIDATION REPORT                       ",
        "====================================================================",
        "",
        "Report ID: " .. report.report_id,
        "Generated: " .. report.generated_at,
        "",
        "====================================================================",
        "                      EXECUTIVE SUMMARY                            ",
        "====================================================================",
        "",
    }
    
    local summary = report.executive_summary
    table.insert(lines, "Overall Status: " .. (summary.overall_success and "✅ SUCCESS" or "❌ FAILED"))
    table.insert(lines, string.format("Parity Rate: %.1f%% (%s)", 
        summary.overall_parity_rate * 100, summary.key_insights.parity_quality))
    table.insert(lines, "")
    table.insert(lines, "Key Metrics:")
    table.insert(lines, "  • Total Validations: " .. summary.total_validations)
    table.insert(lines, "  • Total Test Cases: " .. summary.total_test_cases)
    table.insert(lines, "  • Passed: " .. summary.total_passed)
    table.insert(lines, "  • Failed: " .. summary.total_failed)
    table.insert(lines, "  • Critical Failures: " .. summary.critical_failures)
    table.insert(lines, string.format("  • Execution Time: %.2f seconds", summary.total_execution_time / 1000))
    table.insert(lines, "")
    
    -- Parity Analysis
    if report.parity_analysis then
        table.insert(lines, "====================================================================")
        table.insert(lines, "                      PARITY ANALYSIS                             ")
        table.insert(lines, "====================================================================")
        table.insert(lines, "")
        
        local parity = report.parity_analysis
        table.insert(lines, string.format("Weighted Parity Score: %.3f", parity.overall_parity_score))
        table.insert(lines, "")
        table.insert(lines, "Component Parity Scores:")
        
        for component, score_info in pairs(parity.component_parity_scores) do
            local status = score_info.critical and (score_info.parity_rate >= 0.95 and "✅" or "⚠️ ") or "ℹ️"
            table.insert(lines, string.format("  %s %s: %.1f%% %s", 
                status, component, score_info.parity_rate * 100, 
                score_info.critical and "(CRITICAL)" or ""))
        end
        
        if #parity.critical_parity_issues > 0 then
            table.insert(lines, "")
            table.insert(lines, "⚠️  Critical Parity Issues:")
            for _, issue in ipairs(parity.critical_parity_issues) do
                table.insert(lines, string.format("  • %s: %.1f%% (%s severity)", 
                    issue.component, issue.parity_rate * 100, issue.severity))
            end
        end
        table.insert(lines, "")
    end
    
    -- Performance Analysis
    if report.performance_analysis then
        table.insert(lines, "====================================================================")
        table.insert(lines, "                   PERFORMANCE ANALYSIS                            ")
        table.insert(lines, "====================================================================")
        table.insert(lines, "")
        
        local perf = report.performance_analysis
        local comp = perf.performance_comparison
        
        table.insert(lines, string.format("Overall Performance: %s", perf.efficiency_metrics.time_efficiency_rating))
        table.insert(lines, string.format("Tests per Second: %.1f", perf.efficiency_metrics.tests_per_second))
        table.insert(lines, string.format("Average Time per Test: %.2fms", comp.average_time_per_test))
        
        if comp.typescript_time > 0 and comp.lua_time > 0 then
            table.insert(lines, string.format("Lua vs TypeScript Performance Ratio: %.2fx", comp.performance_ratio))
        end
        
        if #perf.bottlenecks > 0 then
            table.insert(lines, "")
            table.insert(lines, "Performance Bottlenecks:")
            for _, bottleneck in ipairs(perf.bottlenecks) do
                table.insert(lines, string.format("  • %s.%s: %.1fs (%d tests)", 
                    bottleneck.suite, bottleneck.validation, 
                    bottleneck.execution_time / 1000, bottleneck.test_count))
            end
        end
        table.insert(lines, "")
    end
    
    -- Failure Analysis
    if report.failure_analysis then
        table.insert(lines, "====================================================================")
        table.insert(lines, "                     FAILURE ANALYSIS                             ")
        table.insert(lines, "====================================================================")
        table.insert(lines, "")
        
        local failures = report.failure_analysis
        
        if failures.impact_assessment.critical_failure_count > 0 then
            table.insert(lines, "🚨 Critical Failures: " .. failures.impact_assessment.critical_failure_count)
            table.insert(lines, "")
        end
        
        if failures.impact_assessment.most_common_failure_type then
            table.insert(lines, "Most Common Failure Type: " .. failures.impact_assessment.most_common_failure_type)
        end
        
        if failures.impact_assessment.most_common_failure_path then
            table.insert(lines, "Most Common Failure Path: " .. failures.impact_assessment.most_common_failure_path)
        end
        
        table.insert(lines, "")
        table.insert(lines, "Failure Categories:")
        for failure_type, count in pairs(failures.failure_categories) do
            table.insert(lines, string.format("  • %s: %d occurrences", failure_type, count))
        end
        table.insert(lines, "")
    end
    
    -- Recommendations
    if report.recommendations then
        table.insert(lines, "====================================================================")
        table.insert(lines, "                      RECOMMENDATIONS                             ")
        table.insert(lines, "====================================================================")
        table.insert(lines, "")
        
        local recs = report.recommendations
        
        if #recs.immediate_actions > 0 then
            table.insert(lines, "🔴 Immediate Actions Required:")
            for _, action in ipairs(recs.immediate_actions) do
                table.insert(lines, string.format("  • %s", action.action))
                table.insert(lines, string.format("    %s", action.description))
            end
            table.insert(lines, "")
        end
        
        if #recs.improvement_suggestions > 0 then
            table.insert(lines, "🟡 Improvement Suggestions:")
            for _, suggestion in ipairs(recs.improvement_suggestions) do
                table.insert(lines, string.format("  • %s", suggestion.action))
            end
            table.insert(lines, "")
        end
        
        if #recs.long_term_strategies > 0 then
            table.insert(lines, "🟢 Long-term Strategies:")
            for _, strategy in ipairs(recs.long_term_strategies) do
                table.insert(lines, string.format("  • %s", strategy.strategy))
                table.insert(lines, string.format("    %s", strategy.description))
            end
        end
    end
    
    table.insert(lines, "")
    table.insert(lines, "====================================================================")
    table.insert(lines, "                        END OF REPORT                             ")
    table.insert(lines, "====================================================================")
    
    return table.concat(lines, "\n")
end

function ParityReporter.formatJSON(report)
    -- Simple JSON serialization
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
    
    return serialize(report)
end

function ParityReporter.formatHTML(report)
    -- Basic HTML report format
    local html_lines = {
        "<!DOCTYPE html>",
        "<html>",
        "<head>",
        "    <title>Parity Validation Report - " .. report.report_id .. "</title>",
        "    <style>",
        "        body { font-family: Arial, sans-serif; margin: 40px; }",
        "        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }",
        "        .section { margin: 30px 0; }",
        "        .success { color: green; font-weight: bold; }",
        "        .failure { color: red; font-weight: bold; }",
        "        .warning { color: orange; font-weight: bold; }",
        "        table { border-collapse: collapse; width: 100%; }",
        "        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }",
        "        th { background-color: #f2f2f2; }",
        "    </style>",
        "</head>",
        "<body>",
        "    <div class='header'>",
        "        <h1>Parity Validation Report</h1>",
        "        <p>Report ID: " .. report.report_id .. "</p>",
        "        <p>Generated: " .. report.generated_at .. "</p>",
        "    </div>"
    }
    
    -- Add executive summary
    local summary = report.executive_summary
    table.insert(html_lines, "    <div class='section'>")
    table.insert(html_lines, "        <h2>Executive Summary</h2>")
    
    local status_class = summary.overall_success and "success" or "failure"
    local status_text = summary.overall_success and "✅ SUCCESS" or "❌ FAILED"
    
    table.insert(html_lines, "        <p class='" .. status_class .. "'>Overall Status: " .. status_text .. "</p>")
    table.insert(html_lines, string.format("        <p>Parity Rate: %.1f%% (%s)</p>", 
        summary.overall_parity_rate * 100, summary.key_insights.parity_quality))
    
    table.insert(html_lines, "        <table>")
    table.insert(html_lines, "            <tr><th>Metric</th><th>Value</th></tr>")
    table.insert(html_lines, "            <tr><td>Total Validations</td><td>" .. summary.total_validations .. "</td></tr>")
    table.insert(html_lines, "            <tr><td>Total Test Cases</td><td>" .. summary.total_test_cases .. "</td></tr>")
    table.insert(html_lines, "            <tr><td>Passed</td><td>" .. summary.total_passed .. "</td></tr>")
    table.insert(html_lines, "            <tr><td>Failed</td><td>" .. summary.total_failed .. "</td></tr>")
    table.insert(html_lines, "            <tr><td>Critical Failures</td><td>" .. summary.critical_failures .. "</td></tr>")
    table.insert(html_lines, string.format("            <tr><td>Execution Time</td><td>%.2f seconds</td></tr>", 
        summary.total_execution_time / 1000))
    table.insert(html_lines, "        </table>")
    table.insert(html_lines, "    </div>")
    
    -- Close HTML
    table.insert(html_lines, "</body>")
    table.insert(html_lines, "</html>")
    
    return table.concat(html_lines, "\n")
end

function ParityReporter.formatCSV(report)
    -- Basic CSV export for data analysis
    local csv_lines = {
        "metric,value,category,details"
    }
    
    local summary = report.executive_summary
    
    table.insert(csv_lines, string.format("overall_success,%s,summary,%s", 
        summary.overall_success and "true" or "false", 
        summary.overall_success and "SUCCESS" or "FAILED"))
    table.insert(csv_lines, string.format("overall_parity_rate,%.4f,summary,%.1f%%", 
        summary.overall_parity_rate, summary.overall_parity_rate * 100))
    table.insert(csv_lines, string.format("total_validations,%d,summary,", summary.total_validations))
    table.insert(csv_lines, string.format("total_test_cases,%d,summary,", summary.total_test_cases))
    table.insert(csv_lines, string.format("total_passed,%d,summary,", summary.total_passed))
    table.insert(csv_lines, string.format("total_failed,%d,summary,", summary.total_failed))
    table.insert(csv_lines, string.format("critical_failures,%d,summary,", summary.critical_failures))
    table.insert(csv_lines, string.format("execution_time,%.2f,performance,seconds", summary.total_execution_time / 1000))
    
    return table.concat(csv_lines, "\n")
end

-- Helper functions
function ParityReporter.findMostCommon(frequency_table)
    local max_count = 0
    local most_common = nil
    
    for item, count in pairs(frequency_table) do
        if count > max_count then
            max_count = count
            most_common = item
        end
    end
    
    return most_common
end

-- Utility functions
function ParityReporter.configure(new_config)
    for k, v in pairs(new_config) do
        config[k] = v
    end
end

function ParityReporter.getReportHistory()
    return report_history
end

function ParityReporter.clearHistory()
    report_history = {}
end

function ParityReporter.isEnabled()
    return config.enabled
end

return ParityReporter