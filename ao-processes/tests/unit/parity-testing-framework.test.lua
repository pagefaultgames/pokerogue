-- Unit Tests for Parity Testing Framework Components
-- Tests for comparison engine, parity validator, and reporting system

-- Simplified test framework for parity testing
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

-- Mock implementations for testing
local MockComparisonEngine = {
    config = { enabled = true, tolerance = 0.001, strict_mode = true },
    comparison_results = {}
}

function MockComparisonEngine.compareValues(ts_value, lua_value, path, context)
    context = context or { depth = 0, mismatches = {} }
    
    -- Simple comparison logic for testing
    if type(ts_value) ~= type(lua_value) then
        table.insert(context.mismatches, {
            path = path or "root",
            type = "type_mismatch",
            typescript_value = ts_value,
            lua_value = lua_value,
            message = "Type mismatch"
        })
        return false
    end
    
    if type(ts_value) == "number" then
        local diff = math.abs(ts_value - lua_value)
        if diff > MockComparisonEngine.config.tolerance then
            table.insert(context.mismatches, {
                path = path or "root",
                type = "number_mismatch",
                typescript_value = ts_value,
                lua_value = lua_value,
                message = "Number difference: " .. diff
            })
            return false
        end
    elseif ts_value ~= lua_value then
        table.insert(context.mismatches, {
            path = path or "root",
            type = "value_mismatch",
            typescript_value = ts_value,
            lua_value = lua_value,
            message = "Values differ"
        })
        return false
    end
    
    return true
end

function MockComparisonEngine.runTestScenario(scenario_name, test_inputs)
    local results = {
        scenario_name = scenario_name,
        test_count = 0,
        passed_count = 0,
        failed_count = 0,
        test_results = {},
        overall_parity = true
    }
    
    for test_name, test_input in pairs(test_inputs) do
        local test_result = {
            test_name = test_name,
            parity_achieved = math.random() > 0.2, -- 80% pass rate for testing
            typescript_result = { calculated_value = test_input.base_value * 1.5 },
            lua_result = { calculated_value = test_input.base_value * 1.5 },
            comparison_details = { mismatches = {} }
        }
        
        results.test_count = results.test_count + 1
        results.test_results[test_name] = test_result
        
        if test_result.parity_achieved then
            results.passed_count = results.passed_count + 1
        else
            results.failed_count = results.failed_count + 1
            results.overall_parity = false
            
            -- Add mock mismatch for failed tests
            table.insert(test_result.comparison_details.mismatches, {
                path = "calculated_value",
                type = "number_mismatch",
                message = "Mock mismatch for testing"
            })
        end
    end
    
    MockComparisonEngine.comparison_results[scenario_name] = results
    return results
end

function MockComparisonEngine.reset()
    MockComparisonEngine.comparison_results = {}
end

function MockComparisonEngine.configure(new_config)
    for k, v in pairs(new_config) do
        MockComparisonEngine.config[k] = v
    end
end

-- Mock parity validator
local MockParityValidator = {
    validation_suites = {},
    validation_results = {}
}

function MockParityValidator.createValidationSuite(suite_name, suite_config)
    local suite = {
        name = suite_name,
        description = suite_config.description,
        critical = suite_config.critical or false,
        validations = {},
        expected_parity_rate = suite_config.expected_parity_rate or 1.0
    }
    
    MockParityValidator.validation_suites[suite_name] = suite
    return suite
end

function MockParityValidator.addValidation(suite_name, validation_name, validation_config)
    local suite = MockParityValidator.validation_suites[suite_name]
    if not suite then
        error("Suite not found: " .. suite_name)
    end
    
    local validation = {
        name = validation_name,
        description = validation_config.description,
        lua_function = validation_config.lua_function,
        test_data_generator = validation_config.test_data_generator,
        critical = validation_config.critical or false,
        weight = validation_config.weight or 1.0
    }
    
    table.insert(suite.validations, validation)
    return validation
end

function MockParityValidator.runValidationSuite(suite_name, options)
    local suite = MockParityValidator.validation_suites[suite_name]
    if not suite then
        error("Suite not found: " .. suite_name)
    end
    
    local results = {
        suite_name = suite_name,
        start_time = os.clock(),
        validation_count = #suite.validations,
        passed_count = 0,
        failed_count = 0,
        critical_failures = 0,
        parity_rate = 0,
        overall_success = false,
        validation_results = {}
    }
    
    -- Mock validation execution
    for _, validation in ipairs(suite.validations) do
        local validation_result = {
            name = validation.name,
            status = math.random() > 0.3 and "passed" or "failed", -- 70% pass rate
            parity_achieved = math.random() > 0.3,
            statistics = {
                total_tests = math.random(10, 50),
                passed_tests = 0,
                failed_tests = 0,
                parity_rate = 0
            },
            execution_time = math.random(100, 1000),
            test_case_results = {}
        }
        
        validation_result.statistics.passed_tests = validation_result.parity_achieved and validation_result.statistics.total_tests or 
            math.floor(validation_result.statistics.total_tests * 0.7)
        validation_result.statistics.failed_tests = validation_result.statistics.total_tests - validation_result.statistics.passed_tests
        validation_result.statistics.parity_rate = validation_result.statistics.passed_tests / validation_result.statistics.total_tests
        
        results.validation_results[validation.name] = validation_result
        
        if validation_result.status == "passed" then
            results.passed_count = results.passed_count + 1
        else
            results.failed_count = results.failed_count + 1
            if validation.critical then
                results.critical_failures = results.critical_failures + 1
            end
        end
    end
    
    results.end_time = os.clock()
    results.execution_time = (results.end_time - results.start_time) * 1000
    results.parity_rate = results.validation_count > 0 and (results.passed_count / results.validation_count) or 0
    results.overall_success = results.parity_rate >= suite.expected_parity_rate and results.critical_failures == 0
    
    MockParityValidator.validation_results[suite_name] = MockParityValidator.validation_results[suite_name] or {}
    table.insert(MockParityValidator.validation_results[suite_name], results)
    
    return results
end

function MockParityValidator.generateValidationReport(suite_name, format)
    local results = MockParityValidator.validation_results[suite_name]
    if not results or #results == 0 then
        return "No results found for suite: " .. suite_name
    end
    
    local latest = results[#results]
    local report = {
        suite_name = suite_name,
        overall_success = latest.overall_success,
        parity_rate = latest.parity_rate,
        validation_summary = {
            total = latest.validation_count,
            passed = latest.passed_count,
            failed = latest.failed_count,
            critical_failures = latest.critical_failures
        }
    }
    
    if format == "json" then
        return '{"suite":"' .. suite_name .. '","success":' .. tostring(latest.overall_success) .. '}'
    else
        return "Validation Report: " .. suite_name .. "\nSuccess: " .. tostring(latest.overall_success)
    end
end

function MockParityValidator.reset()
    MockParityValidator.validation_suites = {}
    MockParityValidator.validation_results = {}
end

-- Mock parity reporter
local MockParityReporter = {
    report_history = {}
}

function MockParityReporter.generateComprehensiveReport(validation_results, report_config)
    local report = {
        report_id = "test_report_" .. tostring(os.clock()),
        generated_at = os.date("%Y-%m-%d %H:%M:%S"),
        executive_summary = {
            overall_success = true,
            overall_parity_rate = 0.95,
            total_validations = 10,
            total_test_cases = 500,
            total_passed = 9,
            total_failed = 1,
            critical_failures = 0
        },
        validation_details = {
            suite_analyses = {}
        },
        parity_analysis = {
            overall_parity_score = 0.95,
            component_parity_scores = {}
        },
        performance_analysis = {
            execution_times = {},
            efficiency_metrics = {
                tests_per_second = 50,
                time_efficiency_rating = "good"
            }
        },
        recommendations = {
            immediate_actions = {},
            improvement_suggestions = {}
        }
    }
    
    table.insert(MockParityReporter.report_history, report)
    
    local format = report_config and report_config.format or "text"
    if format == "json" then
        return '{"report_id":"' .. report.report_id .. '","success":' .. tostring(report.executive_summary.overall_success) .. '}'
    else
        return "Parity Report: " .. report.report_id .. "\nOverall Success: " .. tostring(report.executive_summary.overall_success)
    end
end

function MockParityReporter.reset()
    MockParityReporter.report_history = {}
end

-- Test suite implementation
local ParityTestingFrameworkTests = {}

function ParityTestingFrameworkTests.setup()
    MockComparisonEngine.reset()
    MockParityValidator.reset()
    MockParityReporter.reset()
end

function ParityTestingFrameworkTests.teardown()
    MockComparisonEngine.reset()
    MockParityValidator.reset()
    MockParityReporter.reset()
end

-- Comparison Engine Tests
function ParityTestingFrameworkTests.testComparisonEngine()
    TestFramework.describe("Comparison Engine", function()
        
        TestFramework.it("should compare identical values correctly", function()
            local context = { depth = 0, mismatches = {} }
            local result = MockComparisonEngine.compareValues(42, 42, "test", context)
            TestFramework.assert(result, "Identical values should match")
            TestFramework.assert(#context.mismatches == 0, "Should have no mismatches")
        end)
        
        TestFramework.it("should detect type mismatches", function()
            local context = { depth = 0, mismatches = {} }
            local result = MockComparisonEngine.compareValues("42", 42, "test", context)
            TestFramework.assert(not result, "Type mismatch should fail")
            TestFramework.assert(#context.mismatches == 1, "Should have one mismatch")
            TestFramework.assert(context.mismatches[1].type == "type_mismatch", "Should be type mismatch")
        end)
        
        TestFramework.it("should handle number tolerance correctly", function()
            local context = { depth = 0, mismatches = {} }
            -- Test within tolerance
            local result1 = MockComparisonEngine.compareValues(1.0, 1.0005, "test", context)
            TestFramework.assert(result1, "Numbers within tolerance should match")
            
            -- Test outside tolerance
            context.mismatches = {}
            local result2 = MockComparisonEngine.compareValues(1.0, 1.1, "test", context)
            TestFramework.assert(not result2, "Numbers outside tolerance should not match")
            TestFramework.assert(#context.mismatches == 1, "Should have mismatch for numbers outside tolerance")
        end)
        
        TestFramework.it("should run test scenarios", function()
            local test_inputs = {
                test1 = { base_value = 100 },
                test2 = { base_value = 200 },
                test3 = { base_value = 300 }
            }
            
            local results = MockComparisonEngine.runTestScenario("test_scenario", test_inputs)
            
            TestFramework.assert(results.scenario_name == "test_scenario", "Should set scenario name")
            TestFramework.assert(results.test_count == 3, "Should count all tests")
            TestFramework.assert(results.passed_count >= 0, "Should have non-negative passed count")
            TestFramework.assert(results.failed_count >= 0, "Should have non-negative failed count")
            TestFramework.assert(results.passed_count + results.failed_count == 3, "Counts should sum to total")
        end)
        
        TestFramework.it("should be configurable", function()
            local original_tolerance = MockComparisonEngine.config.tolerance
            
            MockComparisonEngine.configure({ tolerance = 0.1 })
            TestFramework.assert(MockComparisonEngine.config.tolerance == 0.1, "Should update tolerance")
            
            MockComparisonEngine.configure({ tolerance = original_tolerance })
        end)
        
    end)
end

-- Parity Validator Tests
function ParityTestingFrameworkTests.testParityValidator()
    TestFramework.describe("Parity Validator", function()
        
        TestFramework.it("should create validation suites", function()
            local suite = MockParityValidator.createValidationSuite("test_suite", {
                description = "Test validation suite",
                critical = true,
                expected_parity_rate = 0.9
            })
            
            TestFramework.assert(suite.name == "test_suite", "Should set suite name")
            TestFramework.assert(suite.description == "Test validation suite", "Should set description")
            TestFramework.assert(suite.critical == true, "Should set critical flag")
            TestFramework.assert(suite.expected_parity_rate == 0.9, "Should set expected parity rate")
        end)
        
        TestFramework.it("should add validations to suites", function()
            MockParityValidator.createValidationSuite("test_suite", { description = "Test" })
            
            local validation = MockParityValidator.addValidation("test_suite", "test_validation", {
                description = "Test validation",
                critical = false,
                weight = 2.0,
                lua_function = function(input) return { result = input.value * 2 } end
            })
            
            TestFramework.assert(validation.name == "test_validation", "Should set validation name")
            TestFramework.assert(validation.weight == 2.0, "Should set validation weight")
            TestFramework.assert(type(validation.lua_function) == "function", "Should store lua function")
        end)
        
        TestFramework.it("should run validation suites", function()
            MockParityValidator.createValidationSuite("test_suite", { 
                description = "Test",
                expected_parity_rate = 0.8
            })
            
            MockParityValidator.addValidation("test_suite", "validation1", {
                description = "Test validation 1"
            })
            
            MockParityValidator.addValidation("test_suite", "validation2", {
                description = "Test validation 2",
                critical = true
            })
            
            local results = MockParityValidator.runValidationSuite("test_suite")
            
            TestFramework.assert(results.suite_name == "test_suite", "Should set suite name")
            TestFramework.assert(results.validation_count == 2, "Should count validations")
            TestFramework.assert(results.parity_rate >= 0 and results.parity_rate <= 1, "Parity rate should be valid percentage")
            TestFramework.assert(type(results.overall_success) == "boolean", "Should have overall success flag")
            TestFramework.assert(results.execution_time > 0, "Should measure execution time")
        end)
        
        TestFramework.it("should generate validation reports", function()
            MockParityValidator.createValidationSuite("report_test_suite", { description = "Test" })
            MockParityValidator.addValidation("report_test_suite", "validation1", { description = "Test" })
            MockParityValidator.runValidationSuite("report_test_suite")
            
            local text_report = MockParityValidator.generateValidationReport("report_test_suite", "text")
            local json_report = MockParityValidator.generateValidationReport("report_test_suite", "json")
            
            TestFramework.assert(type(text_report) == "string", "Should generate text report")
            TestFramework.assert(type(json_report) == "string", "Should generate JSON report")
            TestFramework.assert(string.find(text_report, "report_test_suite"), "Text report should contain suite name")
        end)
        
        TestFramework.it("should handle suite not found errors", function()
            local success, error_msg = pcall(MockParityValidator.addValidation, "nonexistent_suite", "test", {})
            TestFramework.assert(not success, "Should fail for nonexistent suite")
            TestFramework.assert(string.find(error_msg, "Suite not found"), "Should have appropriate error message")
        end)
        
    end)
end

-- Parity Reporter Tests  
function ParityTestingFrameworkTests.testParityReporter()
    TestFramework.describe("Parity Reporter", function()
        
        TestFramework.it("should generate comprehensive reports", function()
            local mock_validation_results = {
                suite1 = {
                    validation_count = 5,
                    passed_count = 4,
                    failed_count = 1,
                    critical_failures = 0,
                    parity_rate = 0.8,
                    execution_time = 1000,
                    validation_results = {}
                },
                suite2 = {
                    validation_count = 3,
                    passed_count = 3,
                    failed_count = 0,
                    critical_failures = 0,
                    parity_rate = 1.0,
                    execution_time = 500,
                    validation_results = {}
                }
            }
            
            local report = MockParityReporter.generateComprehensiveReport(mock_validation_results, { format = "text" })
            
            TestFramework.assert(type(report) == "string", "Should generate string report")
            TestFramework.assert(string.find(report, "Parity Report"), "Should contain report header")
        end)
        
        TestFramework.it("should generate JSON reports", function()
            local mock_validation_results = {
                suite1 = { validation_count = 1, passed_count = 1, failed_count = 0 }
            }
            
            local json_report = MockParityReporter.generateComprehensiveReport(mock_validation_results, { format = "json" })
            
            TestFramework.assert(type(json_report) == "string", "Should generate JSON string")
            TestFramework.assert(string.find(json_report, "report_id"), "JSON should contain report ID")
        end)
        
        TestFramework.it("should maintain report history", function()
            local initial_count = #MockParityReporter.report_history
            
            MockParityReporter.generateComprehensiveReport({}, { format = "text" })
            MockParityReporter.generateComprehensiveReport({}, { format = "json" })
            
            TestFramework.assert(#MockParityReporter.report_history == initial_count + 2, "Should add reports to history")
        end)
        
        TestFramework.it("should handle empty validation results", function()
            local report = MockParityReporter.generateComprehensiveReport({}, { format = "text" })
            
            TestFramework.assert(type(report) == "string", "Should handle empty results gracefully")
        end)
        
    end)
end

-- Integration Tests
function ParityTestingFrameworkTests.testIntegration()
    TestFramework.describe("Parity Testing Framework Integration", function()
        
        TestFramework.it("should integrate all components together", function()
            -- Create a validation suite
            local suite = MockParityValidator.createValidationSuite("integration_test", {
                description = "Integration test suite",
                critical = true,
                expected_parity_rate = 0.9
            })
            
            -- Add a validation with comparison engine usage
            MockParityValidator.addValidation("integration_test", "pokemon_stat_test", {
                description = "Pokemon stat calculation test",
                critical = true,
                weight = 2.0,
                lua_function = function(input)
                    return {
                        calculated_stat = math.floor(((2 * input.base_stat + input.iv + math.floor(input.ev / 4)) * input.level / 100 + 5) * input.nature_modifier)
                    }
                end,
                test_data_generator = function()
                    return {
                        { id = "test1", base_stat = 100, level = 50, iv = 31, ev = 252, nature_modifier = 1.1 },
                        { id = "test2", base_stat = 80, level = 75, iv = 20, ev = 100, nature_modifier = 0.9 }
                    }
                end
            })
            
            -- Run validation
            local validation_results = MockParityValidator.runValidationSuite("integration_test")
            
            -- Generate comprehensive report
            local full_results = { integration_test = validation_results }
            local report = MockParityReporter.generateComprehensiveReport(full_results, { format = "text" })
            
            -- Verify integration
            TestFramework.assert(suite ~= nil, "Should create validation suite")
            TestFramework.assert(validation_results.suite_name == "integration_test", "Should run validation suite")
            TestFramework.assert(type(report) == "string", "Should generate report")
            TestFramework.assert(string.find(report, "integration_test") ~= nil, "Report should reference suite")
        end)
        
        TestFramework.it("should handle complex validation scenarios", function()
            -- Test with multiple suites and different configurations
            MockParityValidator.createValidationSuite("critical_suite", {
                description = "Critical validations",
                critical = true,
                expected_parity_rate = 0.95
            })
            
            MockParityValidator.createValidationSuite("non_critical_suite", {
                description = "Non-critical validations",
                critical = false,
                expected_parity_rate = 0.85
            })
            
            -- Add validations to both suites
            MockParityValidator.addValidation("critical_suite", "critical_validation", {
                description = "Critical test",
                critical = true
            })
            
            MockParityValidator.addValidation("non_critical_suite", "standard_validation", {
                description = "Standard test",
                critical = false
            })
            
            -- Run both suites
            local critical_results = MockParityValidator.runValidationSuite("critical_suite")
            local non_critical_results = MockParityValidator.runValidationSuite("non_critical_suite")
            
            -- Generate combined report
            local combined_results = {
                critical_suite = critical_results,
                non_critical_suite = non_critical_results
            }
            
            local report = MockParityReporter.generateComprehensiveReport(combined_results)
            
            TestFramework.assert(critical_results.suite_name == "critical_suite", "Should run critical suite")
            TestFramework.assert(non_critical_results.suite_name == "non_critical_suite", "Should run non-critical suite")
            TestFramework.assert(type(report) == "string", "Should generate combined report")
        end)
        
        TestFramework.it("should demonstrate end-to-end workflow", function()
            -- Complete workflow: Suite creation -> Validation -> Comparison -> Reporting
            
            -- 1. Create validation suite
            MockParityValidator.createValidationSuite("e2e_test", {
                description = "End-to-end test workflow",
                critical = false,
                expected_parity_rate = 0.8
            })
            
            -- 2. Add validation with test case generation
            MockParityValidator.addValidation("e2e_test", "damage_calculation", {
                description = "Battle damage calculation validation",
                lua_function = function(input)
                    local damage = math.floor(((((2 * input.level / 5 + 2) * input.base_power * input.attack / input.defense) / 50) + 2) * input.modifier)
                    return { damage = damage }
                end
            })
            
            -- 3. Run validation (this would use comparison engine internally)
            local results = MockParityValidator.runValidationSuite("e2e_test")
            
            -- 4. Generate detailed report
            local report_text = MockParityReporter.generateComprehensiveReport({ e2e_test = results }, { format = "text" })
            local report_json = MockParityReporter.generateComprehensiveReport({ e2e_test = results }, { format = "json" })
            
            -- 5. Verify complete workflow
            TestFramework.assert(results.suite_name == "e2e_test", "Validation should complete")
            TestFramework.assert(type(report_text) == "string" and #report_text > 0, "Should generate text report")
            TestFramework.assert(type(report_json) == "string" and #report_json > 0, "Should generate JSON report")
            
            -- 6. Verify report history is maintained
            local initial_history_count = #MockParityReporter.report_history
            TestFramework.assert(initial_history_count >= 2, "Should maintain report history")
        end)
        
    end)
end

-- Main test runner
function ParityTestingFrameworkTests.runAllTests()
    TestFramework.runTestSuite("Parity Testing Framework Tests", {
        setup = ParityTestingFrameworkTests.setup,
        teardown = ParityTestingFrameworkTests.teardown,
        tests = {
            ParityTestingFrameworkTests.testComparisonEngine,
            ParityTestingFrameworkTests.testParityValidator,
            ParityTestingFrameworkTests.testParityReporter,
            ParityTestingFrameworkTests.testIntegration
        }
    })
end

-- Auto-run tests when file is executed
ParityTestingFrameworkTests.runAllTests()

return ParityTestingFrameworkTests