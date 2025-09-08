--[[
Regression Framework Validation Script
Simple validation test to ensure all regression framework components load and function
--]]

-- Load the frameworks
local RegressionTestingFramework = require("tests.regression.regression-testing-framework")
local ArchitectureComparisonSystem = require("tests.regression.architecture-comparison-system") 
local Epic32CoverageValidator = require("tests.regression.epic32-coverage-validator")
local RegressionDetectionAnalyzer = require("tests.regression.regression-detection-analyzer")

print("=== REGRESSION FRAMEWORK VALIDATION ===")

-- Test 1: Initialize Regression Testing Framework
print("\n1. Testing Regression Testing Framework initialization...")
local result1 = RegressionTestingFramework.initializeTestSuite({
    correlationId = "validation-test-001",
    testSuiteId = "framework-validation"
})
print("   Status:", result1.success and "PASS" or "FAIL")
print("   Correlation ID:", result1.correlationId)

-- Test 2: Initialize Architecture Comparison System
print("\n2. Testing Architecture Comparison System initialization...")
local result2 = ArchitectureComparisonSystem.initializeComparison({
    distributed = { enabled = true }
})
print("   Status:", result2.success and "PASS" or "FAIL")
print("   Scenarios:", result2.scenarioCount)

-- Test 3: Initialize Epic 32 Coverage Validator
print("\n3. Testing Epic 32 Coverage Validator initialization...")
local result3 = Epic32CoverageValidator.initializeCoverageValidator()
print("   Status:", result3.success and "PASS" or "FAIL")
print("   Total Stories:", result3.totalStories)

-- Test 4: Initialize Regression Detection Analyzer
print("\n4. Testing Regression Detection Analyzer initialization...")
local result4 = RegressionDetectionAnalyzer.initializeAnalyzer({})
print("   Status:", result4.success and "PASS" or "FAIL")

-- Test 5: Execute a simple regression test
print("\n5. Testing regression test execution...")
local testSpec = {
    testName = "validation_test",
    category = "VALIDATION",
    distributedTest = function()
        return {
            output = { result = "success", value = 42 },
            performanceMetrics = { responseTime = 100, throughput = 10 }
        }
    end
}

local testResult = RegressionTestingFramework.executeRegressionTest(testSpec)
print("   Test Status:", testResult.status)
print("   Regression Detected:", testResult.regressionDetected and "YES" or "NO")

-- Test 6: Execute architecture comparison
print("\n6. Testing architecture comparison...")
local comparisonResults = ArchitectureComparisonSystem.executeComparisonSuite()
print("   Total Scenarios:", comparisonResults.totalScenarios)
print("   Executed:", comparisonResults.executedScenarios)
print("   Passed:", comparisonResults.passedComparisons)

-- Test 7: Validate Epic 32 coverage
print("\n7. Testing Epic 32 coverage validation...")
local mockTestResults = {
    { testName = "32.1_basic_test", status = "PASSED" },
    { testName = "32.2_coordinator_test", status = "PASSED" },
    { testName = "32.3_battle_test", status = "PASSED" }
}

local coverageResult = Epic32CoverageValidator.validateStoryCoverage(
    mockTestResults, {}, {}
)
print("   Coverage Score:", string.format("%.1f%%", coverageResult.coverageScore))
print("   Stories Covered:", coverageResult.storiesCovered .. "/" .. coverageResult.totalStories)

-- Test 8: Generate comprehensive report
print("\n8. Testing report generation...")
local report = RegressionTestingFramework.generateRegressionReport()
local summaryReport = RegressionTestingFramework.exportReport(report, "SUMMARY")
print("   Report Generated:", summaryReport ~= nil and "PASS" or "FAIL")

-- Test 9: Generate Epic 32 coverage report
print("\n9. Testing Epic 32 coverage report...")
local coverageReport = Epic32CoverageValidator.generateDetailedCoverageReport()
local coverageSummary = Epic32CoverageValidator.exportCoverageReport(coverageReport, "SUMMARY")
print("   Coverage Report Generated:", coverageSummary ~= nil and "PASS" or "FAIL")

-- Validation Summary
print("\n=== VALIDATION SUMMARY ===")
local allPassed = result1.success and result2.success and result3.success and result4.success
print("All Framework Components Initialized:", allPassed and "PASS" or "FAIL")
print("Test Execution:", testResult.status == "PASSED" and "PASS" or "FAIL")
print("Architecture Comparison:", comparisonResults.executedScenarios > 0 and "PASS" or "FAIL")
print("Epic 32 Coverage:", coverageResult.success and "PASS" or "FAIL")

print("\n✓ Regression Framework Validation Complete")
print("Status:", allPassed and "ALL SYSTEMS OPERATIONAL" or "ISSUES DETECTED")