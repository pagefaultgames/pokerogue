--[[
Unit Tests for Regression Testing Framework
Tests core regression testing functionality and architecture comparison
--]]

-- Test framework setup
package.path = package.path .. ";../../../?.lua"
local TestFramework = require("tests.test-framework")
local RegressionTestingFramework = require("tests.regression.regression-testing-framework")

local suite = TestFramework.createTestSuite("RegressionTestingFramework")

-- Test initialization
suite("should initialize test suite with default values", function(assert)
    local result = RegressionTestingFramework.initializeTestSuite({})
    
    assert(result.success == true, "Should initialize successfully")
    assert(result.correlationId ~= nil, "Should have correlation ID")
    assert(result.testSuiteId == "comprehensive-regression", "Should have default test suite ID")
end)

suite("should initialize test suite with custom configuration", function(assert)
    local config = {
        correlationId = "test-correlation-123",
        testSuiteId = "custom-regression-suite"
    }
    
    local result = RegressionTestingFramework.initializeTestSuite(config)
    
    assert(result.success == true, "Should initialize successfully")
    assert(result.correlationId == "test-correlation-123", "Should use custom correlation ID")
    assert(result.testSuiteId == "custom-regression-suite", "Should use custom test suite ID")
end)

-- Test regression execution
suite("should execute regression test successfully", function(assert)
    RegressionTestingFramework.initializeTestSuite({})
    
    local testSpec = {
        testName = "test_battle_calculation",
        category = "BATTLE_ENGINE",
        distributedTest = function()
            return {
                output = { result = "victory", damage = 150 },
                performanceMetrics = { responseTime = 100, throughput = 10 }
            }
        end
    }
    
    local result = RegressionTestingFramework.executeRegressionTest(testSpec)
    
    assert(result.testName == "test_battle_calculation", "Should have correct test name")
    assert(result.status == "PASSED", "Should pass with only distributed test")
    assert(result.distributedResult ~= nil, "Should have distributed result")
    assert(result.executionTime > 0, "Should track execution time")
end)

suite("should detect regression with architecture comparison", function(assert)
    RegressionTestingFramework.initializeTestSuite({})
    
    local testSpec = {
        testName = "test_with_regression",
        category = "FUNCTIONALITY",
        monolithicTest = function()
            return {
                output = { result = "victory", damage = 150 },
                performanceMetrics = { responseTime = 100 }
            }
        end,
        distributedTest = function()
            return {
                output = { result = "defeat", damage = 150 }, -- Different result!
                performanceMetrics = { responseTime = 200 } -- Slower performance!
            }
        end
    }
    
    local result = RegressionTestingFramework.executeRegressionTest(testSpec)
    
    assert(result.testName == "test_with_regression", "Should have correct test name")
    assert(result.regressionDetected == true, "Should detect regression")
    assert(result.status == "REGRESSION_DETECTED", "Should have regression status")
    assert(result.comparisonResult ~= nil, "Should have comparison result")
end)

-- Test architecture comparison
suite("should compare architecture results accurately", function(assert)
    local monolithicResult = {
        output = { hp = 100, attack = 50 },
        performanceMetrics = { responseTime = 150, throughput = 20 }
    }
    
    local distributedResult = {
        output = { hp = 100, attack = 50 },
        performanceMetrics = { responseTime = 180, throughput = 18 }
    }
    
    local comparison = RegressionTestingFramework.compareArchitectureResults(
        monolithicResult, distributedResult, {}
    )
    
    assert(comparison.regressionDetected == false, "Should not detect functional regression")
    assert(comparison.performanceComparison ~= nil, "Should have performance comparison")
    assert(comparison.functionalityComparison ~= nil, "Should have functionality comparison")
end)

suite("should detect performance regression", function(assert)
    local monolithicResult = {
        performanceMetrics = { responseTime = 100, throughput = 20, errorRate = 0.01 }
    }
    
    local distributedResult = {
        performanceMetrics = { responseTime = 200, throughput = 15, errorRate = 0.05 } -- Worse performance
    }
    
    local comparison = RegressionTestingFramework.compareArchitectureResults(
        monolithicResult, distributedResult, {}
    )
    
    assert(comparison.regressionDetected == true, "Should detect performance regression")
    assert(comparison.regressionType == "PERFORMANCE", "Should identify as performance regression")
    assert(comparison.performanceComparison.responseTimeDelta == 100, "Should calculate correct response time delta")
end)

-- Test functionality comparison
suite("should detect functionality regression", function(assert)
    local monolithicResult = {
        output = { battleResult = "victory", hp = 45, experience = 150 }
    }
    
    local distributedResult = {
        output = { battleResult = "victory", hp = 40, experience = 150 } -- Different HP!
    }
    
    local comparison = RegressionTestingFramework.compareArchitectureResults(
        monolithicResult, distributedResult, {}
    )
    
    assert(comparison.regressionDetected == true, "Should detect functionality regression")
    assert(comparison.regressionType == "FUNCTIONALITY", "Should identify as functionality regression")
    assert(comparison.functionalityComparison.exactMatch == false, "Should detect output mismatch")
end)

-- Test deep comparison
suite("should perform deep comparison accurately", function(assert)
    local obj1 = {
        player = { name = "test", level = 50 },
        pokemon = { species = 25, hp = 100 },
        stats = { attack = 120.5, defense = 85.3 }
    }
    
    local obj2 = {
        player = { name = "test", level = 50 },
        pokemon = { species = 25, hp = 100 },
        stats = { attack = 120.5, defense = 85.3 }
    }
    
    local comparison = RegressionTestingFramework.deepCompare(obj1, obj2, 0.001)
    
    assert(comparison.match == true, "Should match identical objects")
    assert(#comparison.differences == 0, "Should have no differences")
end)

suite("should detect deep comparison differences", function(assert)
    local obj1 = {
        stats = { attack = 120.5, defense = 85.3 }
    }
    
    local obj2 = {
        stats = { attack = 120.5, defense = 85.7 } -- Different defense
    }
    
    local comparison = RegressionTestingFramework.deepCompare(obj1, obj2, 0.001)
    
    assert(comparison.match == false, "Should not match different objects")
    assert(#comparison.differences > 0, "Should have differences")
end)

-- Test Epic 32 coverage validation
suite("should validate Epic 32 story coverage", function(assert)
    local testResults = {
        { testName = "32.1_inter_process_message_flow", status = "PASSED" },
        { testName = "32.2_game_state_coordination", status = "PASSED" },
        { testName = "32.3_battle_process_isolation", status = "PASSED" }
    }
    
    local coverage = RegressionTestingFramework.validateEpic32Coverage(testResults)
    
    assert(coverage.totalStories == 8, "Should have 8 Epic 32 stories")
    assert(coverage.coveredStories >= 3, "Should detect covered stories")
    assert(coverage.coveragePercent > 0, "Should calculate coverage percentage")
    assert(type(coverage.uncoveredStories) == "table", "Should list uncovered stories")
end)

-- Test report generation
suite("should generate comprehensive regression report", function(assert)
    -- Initialize and run some tests
    RegressionTestingFramework.initializeTestSuite({ testSuiteId = "test-report-suite" })
    
    -- Execute a successful test
    local testSpec = {
        testName = "test_for_report",
        distributedTest = function()
            return { output = { result = "success" } }
        end
    }
    RegressionTestingFramework.executeRegressionTest(testSpec)
    
    local report = RegressionTestingFramework.generateRegressionReport()
    
    assert(report.testSuiteId == "test-report-suite", "Should have correct test suite ID")
    assert(report.executionSummary ~= nil, "Should have execution summary")
    assert(report.regressionAnalysis ~= nil, "Should have regression analysis")
    assert(report.epic32Coverage ~= nil, "Should have Epic 32 coverage")
    assert(report.recommendations ~= nil, "Should have recommendations")
end)

-- Test report export
suite("should export report in different formats", function(assert)
    local mockReport = {
        correlationId = "test-123",
        testSuiteId = "test-suite",
        executionSummary = { totalTests = 5, passedTests = 4, failedTests = 1 },
        regressionAnalysis = { regressionsDetected = false },
        epic32Coverage = { coveragePercent = 85.5 }
    }
    
    local jsonReport = RegressionTestingFramework.exportReport(mockReport, "JSON")
    local summaryReport = RegressionTestingFramework.exportReport(mockReport, "SUMMARY")
    
    assert(type(jsonReport) == "string", "Should export JSON as string")
    assert(type(summaryReport) == "string", "Should export summary as string")
    assert(string.find(summaryReport, "test-123") ~= nil, "Summary should contain correlation ID")
    assert(string.find(summaryReport, "85.5%%") ~= nil, "Summary should contain coverage percentage")
end)

-- Run the test suite
return suite