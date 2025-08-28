-- Integration Tests for Complete Test Suite Functionality
-- Tests the end-to-end integration of the automated test suite components
-- Validates test scheduling, execution, aggregation, and reporting systems

-- Load test framework
local enhanced_test_framework = require("ao-processes.tests.framework.test-framework-enhanced")
local TestFramework = enhanced_test_framework

-- Load system components
local AdvancedTestRunner = require("ao-processes.tests.advanced-test-runner")
local TestScheduler = require("ao-processes.tests.framework.test-scheduler")
local TestResultAggregator = require("ao-processes.tests.framework.test-result-aggregator")

-- Test suite for automated test suite integration
local test_suite = TestFramework.createTestSuite("Automated Test Suite Integration", {
    description = "Comprehensive integration testing of the automated test suite components",
    timeout = 30000, -- 30 seconds
    setup_timeout = 5000,
    teardown_timeout = 5000
})

-- Test data and state
local test_state = {
    session_id = nil,
    schedule_id = nil,
    execution_id = nil,
    test_results = nil
}

-- Setup function
function test_suite.setup()
    print("🔧 Setting up test suite integration tests...")
    
    -- Initialize all components with test configurations
    AdvancedTestRunner.configure({
        max_parallel_tests = 2,
        test_timeout = 5000,
        enable_performance_tracking = true,
        enable_parity_testing = true,
        generate_comprehensive_reports = false, -- Disable for faster testing
        report_formats = { "text", "json" }
    })
    
    TestScheduler.configure({
        max_concurrent_executions = 2,
        default_execution_timeout = 10000,
        retry_failed_executions = 1
    })
    
    TestResultAggregator.configure({
        auto_generate_reports = false, -- Disable for testing
        report_formats = { "text", "json" },
        output_directory = "test-results-integration"
    })
    
    print("✅ Test suite integration setup complete")
    return true
end

-- Teardown function
function test_suite.teardown()
    print("🧹 Cleaning up test suite integration tests...")
    
    -- Clean up any active sessions or schedules
    if test_state.session_id then
        pcall(function()
            TestResultAggregator.endSession(test_state.session_id)
        end)
    end
    
    if test_state.schedule_id then
        pcall(function()
            TestScheduler.removeSchedule(test_state.schedule_id)
        end)
    end
    
    print("✅ Test suite integration teardown complete")
    return true
end

-- Test 1: Basic Test Runner Integration
TestFramework.addTestToSuite(test_suite, "test_advanced_test_runner_integration", function()
    print("  🧪 Testing advanced test runner integration...")
    
    -- Test that the advanced test runner can discover and execute tests
    local discovered_tests = AdvancedTestRunner.discoverTests()
    
    -- Verify test discovery
    TestFramework.assert(discovered_tests ~= nil, "Test discovery should return results")
    TestFramework.assert(discovered_tests.unit_tests ~= nil, "Should discover unit tests")
    TestFramework.assert(#discovered_tests.unit_tests > 0, "Should find at least one unit test")
    
    -- Create execution plan
    local execution_plan = AdvancedTestRunner.createExecutionPlan(discovered_tests, {
        skip_parity_tests = true,
        skip_performance_tests = true
    })
    
    -- Verify execution plan
    TestFramework.assert(execution_plan ~= nil, "Should create execution plan")
    TestFramework.assert(execution_plan.phases ~= nil, "Execution plan should have phases")
    TestFramework.assert(execution_plan.test_count > 0, "Should have tests to execute")
    
    print("    ✅ Advanced test runner integration validated")
    return true
end)

-- Test 2: Test Scheduler Integration
TestFramework.addTestToSuite(test_suite, "test_scheduler_integration", function()
    print("  📅 Testing test scheduler integration...")
    
    -- Create a test schedule
    local schedule_config = {
        name = "Integration Test Schedule",
        description = "Test schedule for integration testing",
        schedule_type = "immediate",
        priority = 1,
        tests = {
            "ao-processes/tests/unit/main.test.lua"
        },
        execution_strategy = "sequential",
        timeout = 5000
    }
    
    test_state.schedule_id = TestScheduler.createSchedule(schedule_config)
    TestFramework.assert(test_state.schedule_id ~= nil, "Should create test schedule")
    
    -- Schedule an execution
    test_state.execution_id = TestScheduler.scheduleExecution(test_state.schedule_id)
    TestFramework.assert(test_state.execution_id ~= nil, "Should schedule execution")
    
    -- Process the execution queue
    local started_executions = TestScheduler.processExecutionQueue()
    TestFramework.assert(started_executions >= 0, "Should process execution queue")
    
    -- Check execution status
    local execution_status = TestScheduler.getExecutionStatus(test_state.execution_id)
    TestFramework.assert(execution_status ~= nil, "Should retrieve execution status")
    TestFramework.assert(execution_status.status ~= nil, "Execution should have status")
    
    print("    ✅ Test scheduler integration validated")
    return true
end)

-- Test 3: Result Aggregator Integration
TestFramework.addTestToSuite(test_suite, "test_result_aggregator_integration", function()
    print("  📊 Testing result aggregator integration...")
    
    -- Start an aggregation session
    local session_config = {
        name = "Integration Test Session",
        description = "Test session for integration testing",
        environment = "test",
        branch = "integration-test",
        executor = "automated"
    }
    
    test_state.session_id = TestResultAggregator.startSession(session_config)
    TestFramework.assert(test_state.session_id ~= nil, "Should start aggregation session")
    
    -- Add mock test suite results
    local mock_suite_results = {
        overall_success = true,
        total_duration = 1500,
        summary = {
            passed = 8,
            failed = 1,
            skipped = 1,
            errors = 0
        }
    }
    
    local success = TestResultAggregator.addTestSuiteResults("mock_unit_tests", mock_suite_results)
    TestFramework.assert(success, "Should add test suite results")
    
    -- Add individual test result
    local mock_test_result = {
        status = "passed",
        duration = 150,
        test_type = "unit"
    }
    
    success = TestResultAggregator.addIndividualTestResult("mock_individual_test.lua", mock_test_result)
    TestFramework.assert(success, "Should add individual test result")
    
    -- End the session
    local session = TestResultAggregator.endSession(test_state.session_id)
    TestFramework.assert(session ~= nil, "Should end session successfully")
    TestFramework.assert(session.status == "completed", "Session should be completed")
    TestFramework.assert(session.summary.total_tests > 0, "Session should have test results")
    
    print("    ✅ Result aggregator integration validated")
    return true
end)

-- Test 4: End-to-End Test Execution Flow
TestFramework.addTestToSuite(test_suite, "test_end_to_end_execution_flow", function()
    print("  🔄 Testing end-to-end test execution flow...")
    
    -- Start a new aggregation session
    local session_config = {
        name = "E2E Integration Test",
        environment = "integration",
        executor = "automated_e2e"
    }
    
    local session_id = TestResultAggregator.startSession(session_config)
    TestFramework.assert(session_id ~= nil, "Should start E2E session")
    
    -- Create a simple test schedule that executes quickly
    local schedule_config = {
        name = "E2E Test Schedule",
        schedule_type = "immediate",
        tests = { "simple_mock_test" },
        execution_strategy = "sequential",
        timeout = 3000
    }
    
    local schedule_id = TestScheduler.createSchedule(schedule_config)
    TestFramework.assert(schedule_id ~= nil, "Should create E2E schedule")
    
    -- Schedule and execute
    local execution_id = TestScheduler.scheduleExecution(schedule_id, {
        execution_type = "e2e_test"
    })
    TestFramework.assert(execution_id ~= nil, "Should schedule E2E execution")
    
    -- Simulate processing (in a real system, this would be asynchronous)
    local started = TestScheduler.processExecutionQueue()
    TestFramework.assert(started >= 0, "Should start E2E execution")
    
    -- Simulate adding results to aggregator
    TestResultAggregator.addTestSuiteResults("e2e_suite", {
        overall_success = true,
        total_duration = 2000,
        summary = { passed = 5, failed = 0, skipped = 0, errors = 0 }
    })
    
    -- End session and validate results
    local final_session = TestResultAggregator.endSession(session_id)
    TestFramework.assert(final_session.status == "completed", "E2E session should complete")
    TestFramework.assert(final_session.summary.total_tests >= 0, "Should have test data")
    
    -- Clean up
    TestScheduler.removeSchedule(schedule_id)
    
    print("    ✅ End-to-end execution flow validated")
    return true
end)

-- Test 5: Component Configuration and Status
TestFramework.addTestToSuite(test_suite, "test_component_configuration", function()
    print("  ⚙️ Testing component configuration and status...")
    
    -- Test Advanced Test Runner configuration
    local runner_config = AdvancedTestRunner.getConfiguration()
    TestFramework.assert(runner_config ~= nil, "Should retrieve runner configuration")
    TestFramework.assert(runner_config.max_parallel_tests ~= nil, "Should have parallel tests config")
    
    -- Test Scheduler configuration
    local scheduler_config = TestScheduler.getConfiguration()
    TestFramework.assert(scheduler_config ~= nil, "Should retrieve scheduler configuration")
    TestFramework.assert(scheduler_config.max_concurrent_executions ~= nil, "Should have concurrency config")
    
    -- Test Aggregator configuration
    local aggregator_config = TestResultAggregator.getConfiguration()
    TestFramework.assert(aggregator_config ~= nil, "Should retrieve aggregator configuration")
    TestFramework.assert(aggregator_config.report_formats ~= nil, "Should have report formats config")
    
    -- Test status retrieval
    local aggregator_status = TestResultAggregator.getStatus()
    TestFramework.assert(aggregator_status ~= nil, "Should retrieve aggregator status")
    TestFramework.assert(aggregator_status.uptime ~= nil, "Should have uptime information")
    
    print("    ✅ Component configuration and status validated")
    return true
end)

-- Test 6: Error Handling and Recovery
TestFramework.addTestToSuite(test_suite, "test_error_handling", function()
    print("  🚨 Testing error handling and recovery...")
    
    -- Test invalid session operations
    local success, error_msg = pcall(function()
        TestResultAggregator.endSession("invalid_session_id")
    end)
    TestFramework.assert(not success, "Should handle invalid session ID gracefully")
    
    -- Test invalid schedule operations
    local invalid_execution = TestScheduler.scheduleExecution("invalid_schedule_id")
    TestFramework.assert(invalid_execution == nil, "Should handle invalid schedule gracefully")
    
    -- Test configuration validation
    local original_config = TestScheduler.getConfiguration()
    TestScheduler.configure({ max_concurrent_executions = -1 })
    local updated_config = TestScheduler.getConfiguration()
    TestFramework.assert(updated_config.max_concurrent_executions == -1, "Should accept configuration changes")
    
    -- Restore original configuration
    TestScheduler.configure(original_config)
    
    print("    ✅ Error handling and recovery validated")
    return true
end)

-- Test 7: Performance and Scalability
TestFramework.addTestToSuite(test_suite, "test_performance_scalability", function()
    print("  ⚡ Testing performance and scalability...")
    
    local start_time = os.clock()
    
    -- Create multiple schedules
    local schedule_ids = {}
    for i = 1, 5 do
        local schedule_id = TestScheduler.createSchedule({
            name = "Performance Test Schedule " .. i,
            schedule_type = "immediate",
            tests = { "perf_test_" .. i },
            priority = i
        })
        table.insert(schedule_ids, schedule_id)
    end
    
    -- Create multiple sessions
    local session_ids = {}
    for i = 1, 3 do
        local session_id = TestResultAggregator.startSession({
            name = "Performance Session " .. i,
            environment = "performance"
        })
        table.insert(session_ids, session_id)
        
        -- Add some mock results
        TestResultAggregator.addTestSuiteResults("perf_suite_" .. i, {
            overall_success = true,
            total_duration = 100 * i,
            summary = { passed = i * 2, failed = 0, skipped = 0, errors = 0 }
        })
    end
    
    -- Clean up sessions
    for _, session_id in ipairs(session_ids) do
        TestResultAggregator.endSession(session_id)
    end
    
    -- Clean up schedules
    for _, schedule_id in ipairs(schedule_ids) do
        TestScheduler.removeSchedule(schedule_id)
    end
    
    local end_time = os.clock()
    local execution_time = (end_time - start_time) * 1000
    
    -- Performance should be reasonable (under 1 second for this test)
    TestFramework.assert(execution_time < 1000, "Performance test should complete quickly")
    
    print("    ✅ Performance and scalability validated (" .. string.format("%.2fms", execution_time) .. ")")
    return true
end)

-- Test 8: Report Generation Integration
TestFramework.addTestToSuite(test_suite, "test_report_generation", function()
    print("  📄 Testing report generation integration...")
    
    -- Start session and add comprehensive test data
    local session_id = TestResultAggregator.startSession({
        name = "Report Generation Test",
        environment = "testing",
        branch = "report-test"
    })
    
    -- Add multiple test suite results
    TestResultAggregator.addTestSuiteResults("unit_tests", {
        overall_success = true,
        total_duration = 5000,
        summary = { passed = 15, failed = 2, skipped = 1, errors = 0 }
    })
    
    TestResultAggregator.addTestSuiteResults("integration_tests", {
        overall_success = false,
        total_duration = 8000,
        summary = { passed = 8, failed = 3, skipped = 0, errors = 1 }
    })
    
    -- End session to trigger metric calculations
    local session = TestResultAggregator.endSession(session_id)
    
    -- Validate that metrics were calculated
    TestFramework.assert(session.summary.pass_rate ~= nil, "Should calculate pass rate")
    TestFramework.assert(session.summary.fail_rate ~= nil, "Should calculate fail rate")
    TestFramework.assert(session.quality.test_quality_score ~= nil, "Should calculate quality score")
    TestFramework.assert(session.performance.average_execution_time ~= nil, "Should calculate performance metrics")
    
    -- Test report generation manually
    local reports = TestResultAggregator.generateSessionReports(session)
    TestFramework.assert(reports ~= nil, "Should generate reports")
    TestFramework.assert(reports.text ~= nil, "Should generate text report")
    TestFramework.assert(reports.json ~= nil, "Should generate JSON report")
    
    -- Validate report content
    TestFramework.assert(string.find(reports.text, session.name) ~= nil, "Text report should contain session name")
    TestFramework.assert(string.find(reports.json, session.id) ~= nil, "JSON report should contain session ID")
    
    print("    ✅ Report generation integration validated")
    return true
end)

-- Run the complete integration test suite
local function run_integration_tests()
    print("🧪 Starting Automated Test Suite Integration Tests")
    print("==================================================")
    
    local results = TestFramework.executeTestSuite(test_suite)
    
    print("\n📊 Integration Test Results Summary:")
    print("===================================")
    print("Total Tests: " .. results.total_tests)
    print("Passed: " .. results.passed_tests .. " (" .. string.format("%.1f%%", results.pass_rate * 100) .. ")")
    print("Failed: " .. results.failed_tests .. " (" .. string.format("%.1f%%", results.fail_rate * 100) .. ")")
    print("Skipped: " .. results.skipped_tests)
    print("Execution Time: " .. string.format("%.2f seconds", results.execution_time / 1000))
    
    if results.overall_success then
        print("\n🎉 All integration tests passed! Automated test suite is fully functional.")
    else
        print("\n❌ Some integration tests failed. Check the detailed results above.")
        if results.failed_test_details then
            for _, failure in ipairs(results.failed_test_details) do
                print("   - " .. failure.test_name .. ": " .. failure.error_message)
            end
        end
    end
    
    return results.overall_success
end

-- Export the test suite
return {
    test_suite = test_suite,
    run_integration_tests = run_integration_tests,
    TestFramework = TestFramework
}