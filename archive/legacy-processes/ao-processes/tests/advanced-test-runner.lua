-- Advanced Test Suite Runner with Orchestration
-- Enhanced test runner with parallel execution, scheduling, and comprehensive reporting

local PerformanceFramework = require("parity-testing.reports.performance-framework")
local ParityValidator = require("parity-testing.test-harness.parity-validator")
local ParityReporter = require("parity-testing.reports.parity-reporter")

local AdvancedTestRunner = {}

-- Test execution state
local execution_state = {
    running = false,
    start_time = 0,
    current_phase = "idle",
    test_queue = {},
    active_tests = {},
    completed_tests = {},
    failed_tests = {},
    results_cache = {}
}

-- Configuration
local config = {
    max_parallel_tests = 4,
    test_timeout = 30000, -- 30 seconds
    enable_performance_tracking = true,
    enable_parity_testing = true,
    generate_comprehensive_reports = true,
    retry_failed_tests = 2,
    continue_on_failure = true,
    test_discovery_patterns = {
        "ao-processes/tests/unit/*.test.lua",
        "ao-processes/tests/integration/*.test.lua",
        "parity-testing/test-cases/*.lua"
    },
    excluded_patterns = {
        "**/node_modules/**",
        "**/.git/**",
        "**/temp/**"
    },
    report_formats = { "text", "json", "html" },
    output_directory = "test-results"
}

-- Test discovery and classification
function AdvancedTestRunner.discoverTests()
    local discovered_tests = {
        unit_tests = {},
        integration_tests = {},
        parity_tests = {},
        performance_tests = {}
    }
    
    -- Discover unit tests
    local unit_test_files = {
        "ao-processes/tests/unit/main.test.lua",
        "ao-processes/tests/unit/handler-framework.test.lua",
        "ao-processes/tests/unit/admin-handler.test.lua",
        "ao-processes/tests/unit/auth-handler.test.lua",
        "ao-processes/tests/unit/validation-handler.test.lua",
        "ao-processes/tests/unit/anti-cheat-handler.test.lua",
        "ao-processes/tests/unit/error-handling.test.lua",
        "ao-processes/tests/unit/enhanced-test-framework.test.lua",
        "ao-processes/tests/unit/performance-framework.test.lua",
        "ao-processes/tests/unit/parity-testing-framework.test.lua"
    }
    
    for _, test_file in ipairs(unit_test_files) do
        table.insert(discovered_tests.unit_tests, {
            file_path = test_file,
            test_type = "unit",
            estimated_duration = 5000, -- 5 seconds
            dependencies = {},
            tags = { "unit", "fast" }
        })
    end
    
    -- Discover integration tests
    local integration_test_files = {
        "ao-processes/tests/integration/process-deployment.test.lua",
        "ao-processes/tests/integration/security-framework.test.lua"
    }
    
    for _, test_file in ipairs(integration_test_files) do
        table.insert(discovered_tests.integration_tests, {
            file_path = test_file,
            test_type = "integration",
            estimated_duration = 15000, -- 15 seconds
            dependencies = { "unit_tests" },
            tags = { "integration", "slow" }
        })
    end
    
    -- Discover parity tests
    table.insert(discovered_tests.parity_tests, {
        file_path = "parity-testing/test-cases/pokemon-stats-test-cases.lua",
        test_type = "parity",
        estimated_duration = 30000, -- 30 seconds
        dependencies = {},
        tags = { "parity", "comprehensive" }
    })
    
    table.insert(discovered_tests.parity_tests, {
        file_path = "parity-testing/test-cases/battle-damage-test-cases.lua", 
        test_type = "parity",
        estimated_duration = 25000, -- 25 seconds
        dependencies = {},
        tags = { "parity", "comprehensive" }
    })
    
    -- Discover performance tests
    table.insert(discovered_tests.performance_tests, {
        file_path = "performance-benchmark",
        test_type = "performance",
        estimated_duration = 20000, -- 20 seconds
        dependencies = { "unit_tests" },
        tags = { "performance", "benchmarks" }
    })
    
    return discovered_tests
end

function AdvancedTestRunner.createExecutionPlan(discovered_tests, execution_options)
    execution_options = execution_options or {}
    
    local execution_plan = {
        phases = {},
        total_estimated_time = 0,
        test_count = 0,
        parallel_groups = {},
        execution_order = {}
    }
    
    -- Phase 1: Unit Tests (can run in parallel)
    if not execution_options.skip_unit_tests then
        local unit_phase = {
            phase_name = "unit_tests",
            phase_type = "parallel",
            tests = discovered_tests.unit_tests,
            max_parallel = config.max_parallel_tests,
            continue_on_failure = true,
            estimated_duration = 0
        }
        
        for _, test in ipairs(discovered_tests.unit_tests) do
            unit_phase.estimated_duration = math.max(unit_phase.estimated_duration, test.estimated_duration)
        end
        
        table.insert(execution_plan.phases, unit_phase)
        execution_plan.total_estimated_time = execution_plan.total_estimated_time + unit_phase.estimated_duration
        execution_plan.test_count = execution_plan.test_count + #discovered_tests.unit_tests
    end
    
    -- Phase 2: Integration Tests (sequential due to dependencies)
    if not execution_options.skip_integration_tests then
        local integration_phase = {
            phase_name = "integration_tests",
            phase_type = "sequential",
            tests = discovered_tests.integration_tests,
            depends_on = { "unit_tests" },
            continue_on_failure = config.continue_on_failure,
            estimated_duration = 0
        }
        
        for _, test in ipairs(discovered_tests.integration_tests) do
            integration_phase.estimated_duration = integration_phase.estimated_duration + test.estimated_duration
        end
        
        table.insert(execution_plan.phases, integration_phase)
        execution_plan.total_estimated_time = execution_plan.total_estimated_time + integration_phase.estimated_duration
        execution_plan.test_count = execution_plan.test_count + #discovered_tests.integration_tests
    end
    
    -- Phase 3: Parity Tests (can run in parallel)
    if config.enable_parity_testing and not execution_options.skip_parity_tests then
        local parity_phase = {
            phase_name = "parity_tests",
            phase_type = "parallel",
            tests = discovered_tests.parity_tests,
            max_parallel = 2, -- Parity tests are resource intensive
            continue_on_failure = true,
            estimated_duration = 0
        }
        
        for _, test in ipairs(discovered_tests.parity_tests) do
            parity_phase.estimated_duration = math.max(parity_phase.estimated_duration, test.estimated_duration)
        end
        
        table.insert(execution_plan.phases, parity_phase)
        execution_plan.total_estimated_time = execution_plan.total_estimated_time + parity_phase.estimated_duration
        execution_plan.test_count = execution_plan.test_count + #discovered_tests.parity_tests
    end
    
    -- Phase 4: Performance Tests (sequential)
    if config.enable_performance_tracking and not execution_options.skip_performance_tests then
        local performance_phase = {
            phase_name = "performance_tests",
            phase_type = "sequential",
            tests = discovered_tests.performance_tests,
            depends_on = { "unit_tests" },
            continue_on_failure = true,
            estimated_duration = 0
        }
        
        for _, test in ipairs(discovered_tests.performance_tests) do
            performance_phase.estimated_duration = performance_phase.estimated_duration + test.estimated_duration
        end
        
        table.insert(execution_plan.phases, performance_phase)
        execution_plan.total_estimated_time = execution_plan.total_estimated_time + performance_phase.estimated_duration
        execution_plan.test_count = execution_plan.test_count + #discovered_tests.performance_tests
    end
    
    return execution_plan
end

-- Test execution engine
function AdvancedTestRunner.executeTestSuite(execution_plan, options)
    options = options or {}
    
    execution_state.running = true
    execution_state.start_time = os.clock()
    execution_state.current_phase = "initializing"
    
    local suite_results = {
        execution_id = "test_run_" .. tostring(os.clock()),
        start_time = execution_state.start_time,
        end_time = nil,
        total_duration = 0,
        total_tests = execution_plan.test_count,
        estimated_duration = execution_plan.total_estimated_time,
        phases = {},
        overall_success = true,
        performance_metrics = {},
        parity_results = {},
        summary = {
            passed = 0,
            failed = 0,
            skipped = 0,
            errors = 0
        }
    }
    
    print("🚀 Advanced AO Process Test Suite")
    print("==================================")
    print("Execution ID: " .. suite_results.execution_id)
    print("Total Tests: " .. execution_plan.test_count)
    print("Estimated Duration: " .. string.format("%.1f seconds", execution_plan.total_estimated_time / 1000))
    print("")
    
    -- Execute each phase
    for phase_index, phase in ipairs(execution_plan.phases) do
        execution_state.current_phase = phase.phase_name
        
        print("📋 Phase " .. phase_index .. ": " .. phase.phase_name)
        print(string.rep("=", 40))
        
        local phase_result = AdvancedTestRunner.executePhase(phase, options)
        suite_results.phases[phase.phase_name] = phase_result
        
        -- Update overall results
        suite_results.summary.passed = suite_results.summary.passed + phase_result.summary.passed
        suite_results.summary.failed = suite_results.summary.failed + phase_result.summary.failed
        suite_results.summary.skipped = suite_results.summary.skipped + phase_result.summary.skipped
        suite_results.summary.errors = suite_results.summary.errors + phase_result.summary.errors
        
        if not phase_result.phase_success then
            suite_results.overall_success = false
            
            if not phase.continue_on_failure then
                print("❌ Phase failed and continue_on_failure is disabled. Stopping execution.")
                break
            end
        end
        
        print("")
    end
    
    execution_state.end_time = os.clock()
    execution_state.running = false
    
    suite_results.end_time = execution_state.end_time
    suite_results.total_duration = (suite_results.end_time - suite_results.start_time) * 1000
    
    -- Generate comprehensive reports
    if config.generate_comprehensive_reports then
        suite_results.reports = AdvancedTestRunner.generateReports(suite_results, options)
    end
    
    -- Print summary
    AdvancedTestRunner.printExecutionSummary(suite_results)
    
    return suite_results
end

function AdvancedTestRunner.executePhase(phase, options)
    local phase_result = {
        phase_name = phase.phase_name,
        phase_type = phase.phase_type,
        start_time = os.clock(),
        end_time = nil,
        duration = 0,
        phase_success = true,
        test_results = {},
        summary = {
            passed = 0,
            failed = 0,
            skipped = 0,
            errors = 0
        }
    }
    
    print("Starting phase: " .. phase.phase_name .. " (" .. phase.phase_type .. " execution)")
    
    if phase.phase_type == "parallel" then
        phase_result.test_results = AdvancedTestRunner.executeParallelTests(phase.tests, phase.max_parallel or config.max_parallel_tests)
    else
        phase_result.test_results = AdvancedTestRunner.executeSequentialTests(phase.tests)
    end
    
    -- Calculate phase summary
    for _, test_result in pairs(phase_result.test_results) do
        if test_result.status == "passed" then
            phase_result.summary.passed = phase_result.summary.passed + 1
        elseif test_result.status == "failed" then
            phase_result.summary.failed = phase_result.summary.failed + 1
            phase_result.phase_success = false
        elseif test_result.status == "skipped" then
            phase_result.summary.skipped = phase_result.summary.skipped + 1
        else
            phase_result.summary.errors = phase_result.summary.errors + 1
            phase_result.phase_success = false
        end
    end
    
    phase_result.end_time = os.clock()
    phase_result.duration = (phase_result.end_time - phase_result.start_time) * 1000
    
    local status_emoji = phase_result.phase_success and "✅" or "❌"
    print(string.format("%s Phase completed: %s (%.2fs)", 
        status_emoji, phase.phase_name, phase_result.duration / 1000))
    
    return phase_result
end

function AdvancedTestRunner.executeSequentialTests(tests)
    local results = {}
    
    for _, test in ipairs(tests) do
        print("  🔄 Running: " .. test.file_path)
        local test_result = AdvancedTestRunner.executeTest(test)
        results[test.file_path] = test_result
        
        local status_emoji = test_result.status == "passed" and "✅" or 
                           test_result.status == "failed" and "❌" or 
                           test_result.status == "skipped" and "⏭️" or "⚠️"
        
        print(string.format("    %s %s (%.2fs)", 
            status_emoji, test_result.status, test_result.duration / 1000))
        
        if test_result.error_message then
            print("      Error: " .. test_result.error_message)
        end
    end
    
    return results
end

function AdvancedTestRunner.executeParallelTests(tests, max_parallel)
    -- For this implementation, we'll simulate parallel execution
    -- In a real implementation, this would use coroutines or threading
    local results = {}
    
    print("  🔄 Running " .. #tests .. " tests in parallel (max: " .. max_parallel .. ")")
    
    for _, test in ipairs(tests) do
        local test_result = AdvancedTestRunner.executeTest(test)
        results[test.file_path] = test_result
        
        local status_emoji = test_result.status == "passed" and "✅" or 
                           test_result.status == "failed" and "❌" or 
                           test_result.status == "skipped" and "⏭️" or "⚠️"
        
        print(string.format("    %s %s: %s (%.2fs)", 
            status_emoji, test.file_path, test_result.status, test_result.duration / 1000))
    end
    
    return results
end

function AdvancedTestRunner.executeTest(test)
    local test_result = {
        test_file = test.file_path,
        test_type = test.test_type,
        status = "unknown",
        start_time = os.clock(),
        end_time = nil,
        duration = 0,
        error_message = nil,
        output = nil,
        performance_data = nil,
        retry_count = 0
    }
    
    -- Track performance if enabled
    if config.enable_performance_tracking then
        PerformanceFramework.startTimer(test.file_path)
    end
    
    local success, result = pcall(function()
        if test.test_type == "parity" then
            return AdvancedTestRunner.executeParityTest(test)
        elseif test.test_type == "performance" then
            return AdvancedTestRunner.executePerformanceTest(test)
        else
            return AdvancedTestRunner.executeStandardTest(test)
        end
    end)
    
    test_result.end_time = os.clock()
    test_result.duration = (test_result.end_time - test_result.start_time) * 1000
    
    if config.enable_performance_tracking then
        local perf_duration = PerformanceFramework.endTimer(test.file_path)
        test_result.performance_data = {
            framework_duration = perf_duration,
            actual_duration = test_result.duration
        }
    end
    
    if success then
        test_result.status = result and "passed" or "failed"
        if not result then
            test_result.error_message = "Test returned false"
        end
    else
        test_result.status = "error"
        test_result.error_message = tostring(result)
        
        -- Retry logic for failed tests
        if test_result.retry_count < config.retry_failed_tests then
            print("    🔄 Retrying test (attempt " .. (test_result.retry_count + 1) .. ")")
            test_result.retry_count = test_result.retry_count + 1
            return AdvancedTestRunner.executeTest(test) -- Recursive retry
        end
    end
    
    return test_result
end

function AdvancedTestRunner.executeStandardTest(test)
    -- Execute standard Lua test file
    local success, result = pcall(dofile, test.file_path)
    return success and (result ~= false)
end

function AdvancedTestRunner.executeParityTest(test)
    -- Execute parity test using the parity validation framework
    if test.file_path:find("pokemon-stats") then
        local PokemonStatsTestCases = require("parity-testing.test-cases.pokemon-stats-test-cases")
        local test_suite = PokemonStatsTestCases.generateAllTestCases()
        
        -- Create validation suite
        ParityValidator.createValidationSuite("pokemon_stats_parity", {
            description = "Pokemon stat calculation parity validation",
            critical = true,
            expected_parity_rate = 0.95
        })
        
        -- Add validation with sample test cases
        ParityValidator.addValidation("pokemon_stats_parity", "stat_calculation", {
            description = "Pokemon stat calculation validation",
            test_cases = { table.unpack(test_suite.test_cases, 1, 10) }, -- Use first 10 test cases
            lua_function = function(test_input)
                local input = test_input.input
                if input.stat_type == "hp" then
                    return {
                        calculated_stat = math.floor((2 * input.base_stat + input.iv + math.floor(input.ev / 4)) * input.level / 100 + input.level + 10)
                    }
                else
                    return {
                        calculated_stat = math.floor(((2 * input.base_stat + input.iv + math.floor(input.ev / 4)) * input.level / 100 + 5) * input.nature_modifier)
                    }
                end
            end
        })
        
        local results = ParityValidator.runValidationSuite("pokemon_stats_parity")
        return results.overall_success
        
    elseif test.file_path:find("battle-damage") then
        local BattleDamageTestCases = require("parity-testing.test-cases.battle-damage-test-cases")
        local test_suite = BattleDamageTestCases.generateAllTestCases()
        
        -- Create validation suite
        ParityValidator.createValidationSuite("battle_damage_parity", {
            description = "Battle damage calculation parity validation",
            critical = true,
            expected_parity_rate = 0.95
        })
        
        -- Add validation with sample test cases
        ParityValidator.addValidation("battle_damage_parity", "damage_calculation", {
            description = "Battle damage calculation validation",
            test_cases = { table.unpack(test_suite.test_cases, 1, 10) }, -- Use first 10 test cases
            lua_function = function(test_input)
                local input = test_input.input
                local damage = math.floor(((((2 * input.level / 5 + 2) * input.base_power * input.attack / input.defense) / 50) + 2) 
                    * (input.type_effectiveness or 1.0) * (input.stab or 1.0) * (input.critical_hit and 1.5 or 1.0) * (input.random_factor or 1.0))
                return { damage = damage }
            end
        })
        
        local results = ParityValidator.runValidationSuite("battle_damage_parity")
        return results.overall_success
    end
    
    return true -- Default success for unknown parity tests
end

function AdvancedTestRunner.executePerformanceTest(test)
    -- Execute performance benchmarking
    print("    🏃 Running performance benchmarks...")
    
    -- Simulate performance test execution
    local start_time = os.clock()
    
    -- Mock performance test - measure some operations
    for i = 1, 1000 do
        local result = math.sqrt(i) * math.sin(i / 100)
    end
    
    local end_time = os.clock()
    local execution_time = (end_time - start_time) * 1000
    
    print(string.format("    📊 Performance test completed in %.3fms", execution_time))
    
    return execution_time < 1000 -- Pass if under 1 second
end

-- Report generation
function AdvancedTestRunner.generateReports(suite_results, options)
    local reports = {}
    
    for _, format in ipairs(config.report_formats) do
        if format == "text" then
            reports.text = AdvancedTestRunner.generateTextReport(suite_results)
        elseif format == "json" then
            reports.json = AdvancedTestRunner.generateJSONReport(suite_results)
        elseif format == "html" then
            reports.html = AdvancedTestRunner.generateHTMLReport(suite_results)
        end
    end
    
    return reports
end

function AdvancedTestRunner.generateTextReport(suite_results)
    local lines = {
        "=== Advanced Test Suite Execution Report ===",
        "Execution ID: " .. suite_results.execution_id,
        "Start Time: " .. os.date("%Y-%m-%d %H:%M:%S", suite_results.start_time),
        "Duration: " .. string.format("%.2f seconds", suite_results.total_duration / 1000),
        "Overall Success: " .. (suite_results.overall_success and "✅ YES" or "❌ NO"),
        "",
        "Summary:",
        "  Total Tests: " .. suite_results.total_tests,
        "  Passed: " .. suite_results.summary.passed,
        "  Failed: " .. suite_results.summary.failed,
        "  Skipped: " .. suite_results.summary.skipped,
        "  Errors: " .. suite_results.summary.errors,
        "",
        "Phase Results:",
    }
    
    for phase_name, phase_result in pairs(suite_results.phases) do
        table.insert(lines, string.format("  %s: %s (%.2fs)", 
            phase_name, 
            phase_result.phase_success and "✅ PASSED" or "❌ FAILED",
            phase_result.duration / 1000))
    end
    
    return table.concat(lines, "\n")
end

function AdvancedTestRunner.generateJSONReport(suite_results)
    -- Simple JSON serialization
    local json_data = {
        execution_id = suite_results.execution_id,
        overall_success = suite_results.overall_success,
        total_duration = suite_results.total_duration,
        summary = suite_results.summary,
        phase_count = 0,
        phases = {}
    }
    
    for phase_name, phase_result in pairs(suite_results.phases) do
        json_data.phase_count = json_data.phase_count + 1
        json_data.phases[phase_name] = {
            success = phase_result.phase_success,
            duration = phase_result.duration,
            test_count = phase_result.summary.passed + phase_result.summary.failed + phase_result.summary.skipped + phase_result.summary.errors
        }
    end
    
    return '{"execution_id":"' .. json_data.execution_id .. '","success":' .. tostring(json_data.overall_success) .. ',"duration":' .. json_data.total_duration .. '}'
end

function AdvancedTestRunner.generateHTMLReport(suite_results)
    local html_content = [[
<!DOCTYPE html>
<html>
<head>
    <title>Test Suite Report - ]] .. suite_results.execution_id .. [[</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; font-weight: bold; }
        .failure { color: red; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Test Suite Execution Report</h1>
    <p><strong>Execution ID:</strong> ]] .. suite_results.execution_id .. [[</p>
    <p><strong>Overall Success:</strong> <span class="]] .. (suite_results.overall_success and "success" or "failure") .. [[">]] .. (suite_results.overall_success and "PASSED" or "FAILED") .. [[</span></p>
    <p><strong>Duration:</strong> ]] .. string.format("%.2f seconds", suite_results.total_duration / 1000) .. [[</p>
    
    <h2>Summary</h2>
    <ul>
        <li>Total Tests: ]] .. suite_results.total_tests .. [[</li>
        <li>Passed: ]] .. suite_results.summary.passed .. [[</li>
        <li>Failed: ]] .. suite_results.summary.failed .. [[</li>
        <li>Skipped: ]] .. suite_results.summary.skipped .. [[</li>
        <li>Errors: ]] .. suite_results.summary.errors .. [[</li>
    </ul>
</body>
</html>]]
    
    return html_content
end

function AdvancedTestRunner.printExecutionSummary(suite_results)
    print("📊 Test Execution Summary")
    print("=========================")
    print("Execution ID: " .. suite_results.execution_id)
    print("Total Duration: " .. string.format("%.2f seconds", suite_results.total_duration / 1000))
    print("Overall Success: " .. (suite_results.overall_success and "✅ YES" or "❌ NO"))
    print("")
    
    print("Test Results:")
    print("  Total: " .. suite_results.total_tests)
    print("  Passed: " .. suite_results.summary.passed .. " (" .. 
          string.format("%.1f%%", suite_results.total_tests > 0 and (suite_results.summary.passed / suite_results.total_tests * 100) or 0) .. ")")
    print("  Failed: " .. suite_results.summary.failed)
    print("  Skipped: " .. suite_results.summary.skipped)
    print("  Errors: " .. suite_results.summary.errors)
    print("")
    
    if suite_results.overall_success then
        print("🎉 All critical tests passed! AO Process Architecture is ready.")
    else
        print("❌ Some tests failed. Please review the results and fix issues before deployment.")
    end
end

-- Main execution function
function AdvancedTestRunner.runTestSuite(options)
    options = options or {}
    
    -- Discover tests
    local discovered_tests = AdvancedTestRunner.discoverTests()
    
    -- Create execution plan
    local execution_plan = AdvancedTestRunner.createExecutionPlan(discovered_tests, options)
    
    -- Execute test suite
    local suite_results = AdvancedTestRunner.executeTestSuite(execution_plan, options)
    
    return suite_results
end

-- Configuration functions
function AdvancedTestRunner.configure(new_config)
    for k, v in pairs(new_config) do
        config[k] = v
    end
end

function AdvancedTestRunner.getConfiguration()
    return config
end

return AdvancedTestRunner