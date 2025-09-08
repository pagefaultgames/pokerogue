--[[
Comprehensive Regression Testing Framework
Validates functionality parity between monolithic and distributed architectures
--]]

local RegressionTestingFramework = {}

-- Dependencies
local json = require("json") or { encode = function(obj) return tostring(obj) end }

-- Test execution tracking
local testExecution = {
    correlationId = "",
    testSuiteId = "",
    startTime = 0,
    endTime = 0,
    totalTests = 0,
    passedTests = 0,
    failedTests = 0,
    skippedTests = 0,
    regressions = {},
    architectureComparisons = {}
}

-- Regression detection configuration
local regressionConfig = {
    performanceThresholds = {
        responseTimePercent = 10, -- 10% performance degradation threshold
        throughputPercent = 5,    -- 5% throughput reduction threshold
        errorRatePercent = 1      -- 1% error rate increase threshold
    },
    functionalityChecks = {
        exactMatch = true,        -- Require exact output matching
        precisionTolerance = 0.001, -- Floating point comparison tolerance
        enableDeepComparison = true -- Deep object/table comparison
    },
    coverageRequirements = {
        minCoveragePercent = 95,  -- Minimum test coverage requirement
        requireEpic32Coverage = true -- Validate Epic 32 stories coverage
    }
}

-- Epic 32 stories validation mapping
local epic32Stories = {
    "32.1", -- Inter-process Communication Foundation
    "32.2", -- Game Coordinator Process Implementation  
    "32.3", -- Battle Engine Process Extraction
    "32.4", -- Pokemon Management Process Isolation
    "32.5", -- Economy Shop Process Separation
    "32.6", -- Security Anti-cheat Process Implementation
    "32.7", -- Administration Monitoring Process Setup
    "32.8"  -- Multi-process Deployment Orchestration
}

function RegressionTestingFramework.initializeTestSuite(suiteConfig)
    testExecution.correlationId = suiteConfig.correlationId or ("regression-" .. tostring(0))
    testExecution.testSuiteId = suiteConfig.testSuiteId or "comprehensive-regression"
    testExecution.startTime = 0
    
    -- Reset counters
    testExecution.totalTests = 0
    testExecution.passedTests = 0
    testExecution.failedTests = 0
    testExecution.skippedTests = 0
    testExecution.regressions = {}
    testExecution.architectureComparisons = {}
    
    print("[REGRESSION] Initialized test suite: " .. testExecution.testSuiteId)
    print("[REGRESSION] Correlation ID: " .. testExecution.correlationId)
    
    return {
        success = true,
        correlationId = testExecution.correlationId,
        testSuiteId = testExecution.testSuiteId
    }
end

function RegressionTestingFramework.executeRegressionTest(testSpec)
    testExecution.totalTests = testExecution.totalTests + 1
    
    local testResult = {
        testName = testSpec.testName,
        testCategory = testSpec.category or "FUNCTIONALITY",
        executionTime = 0,
        status = "PENDING",
        monolithicResult = nil,
        distributedResult = nil,
        comparisonResult = nil,
        regressionDetected = false,
        failureReason = nil
    }
    
    local startTime = os.clock()
    
    -- Execute test on monolithic architecture (if available)
    if testSpec.monolithicTest then
        local success, result = pcall(testSpec.monolithicTest)
        if success then
            testResult.monolithicResult = result
            print("[REGRESSION] Monolithic test completed: " .. testSpec.testName)
        else
            testResult.failureReason = "Monolithic test failed: " .. tostring(result)
            testResult.status = "FAILED"
        end
    end
    
    -- Execute test on distributed architecture
    if testSpec.distributedTest then
        local success, result = pcall(testSpec.distributedTest)
        if success then
            testResult.distributedResult = result
            print("[REGRESSION] Distributed test completed: " .. testSpec.testName)
        else
            testResult.failureReason = testResult.failureReason and 
                (testResult.failureReason .. "; Distributed test failed: " .. tostring(result)) or
                ("Distributed test failed: " .. tostring(result))
            testResult.status = "FAILED"
        end
    end
    
    testResult.executionTime = os.clock() - startTime
    
    -- Perform architecture comparison if both results available
    if testResult.monolithicResult and testResult.distributedResult then
        testResult.comparisonResult = RegressionTestingFramework.compareArchitectureResults(
            testResult.monolithicResult, 
            testResult.distributedResult,
            testSpec.comparisonConfig or {}
        )
        
        testResult.regressionDetected = testResult.comparisonResult.regressionDetected
        
        if testResult.regressionDetected then
            table.insert(testExecution.regressions, {
                testName = testSpec.testName,
                regressionType = testResult.comparisonResult.regressionType,
                details = testResult.comparisonResult.details
            })
            testExecution.failedTests = testExecution.failedTests + 1
            testResult.status = "REGRESSION_DETECTED"
            print("[REGRESSION] REGRESSION DETECTED in: " .. testSpec.testName)
        else
            testExecution.passedTests = testExecution.passedTests + 1
            testResult.status = "PASSED"
            print("[REGRESSION] Test passed: " .. testSpec.testName)
        end
    elseif testResult.status == "PENDING" then
        -- Single architecture test
        if testResult.distributedResult then
            testExecution.passedTests = testExecution.passedTests + 1
            testResult.status = "PASSED"
        else
            testExecution.failedTests = testExecution.failedTests + 1
            testResult.status = "FAILED"
        end
    end
    
    table.insert(testExecution.architectureComparisons, testResult)
    
    return testResult
end

function RegressionTestingFramework.compareArchitectureResults(monolithicResult, distributedResult, comparisonConfig)
    local comparison = {
        regressionDetected = false,
        regressionType = nil,
        details = {},
        performanceComparison = {},
        functionalityComparison = {}
    }
    
    local config = comparisonConfig or regressionConfig.functionalityChecks
    
    -- Performance comparison
    if monolithicResult.performanceMetrics and distributedResult.performanceMetrics then
        comparison.performanceComparison = RegressionTestingFramework.comparePerformance(
            monolithicResult.performanceMetrics,
            distributedResult.performanceMetrics
        )
        
        if comparison.performanceComparison.regressionDetected then
            comparison.regressionDetected = true
            comparison.regressionType = "PERFORMANCE"
            table.insert(comparison.details, comparison.performanceComparison.details)
        end
    end
    
    -- Functionality comparison
    if monolithicResult.output and distributedResult.output then
        comparison.functionalityComparison = RegressionTestingFramework.compareFunctionality(
            monolithicResult.output,
            distributedResult.output,
            config
        )
        
        if comparison.functionalityComparison.regressionDetected then
            comparison.regressionDetected = true
            comparison.regressionType = comparison.regressionType and "MIXED" or "FUNCTIONALITY"
            table.insert(comparison.details, comparison.functionalityComparison.details)
        end
    end
    
    return comparison
end

function RegressionTestingFramework.comparePerformance(monolithicMetrics, distributedMetrics)
    local performanceComparison = {
        regressionDetected = false,
        details = {},
        responseTimeDelta = 0,
        throughputDelta = 0,
        errorRateDelta = 0
    }
    
    -- Response time comparison
    if monolithicMetrics.responseTime and distributedMetrics.responseTime then
        local responseTimeDelta = ((distributedMetrics.responseTime - monolithicMetrics.responseTime) / monolithicMetrics.responseTime) * 100
        performanceComparison.responseTimeDelta = responseTimeDelta
        
        if responseTimeDelta > regressionConfig.performanceThresholds.responseTimePercent then
            performanceComparison.regressionDetected = true
            table.insert(performanceComparison.details, string.format(
                "Response time regression: %.2f%% increase (threshold: %.2f%%)",
                responseTimeDelta, regressionConfig.performanceThresholds.responseTimePercent
            ))
        end
    end
    
    -- Throughput comparison
    if monolithicMetrics.throughput and distributedMetrics.throughput then
        local throughputDelta = ((monolithicMetrics.throughput - distributedMetrics.throughput) / monolithicMetrics.throughput) * 100
        performanceComparison.throughputDelta = throughputDelta
        
        if throughputDelta > regressionConfig.performanceThresholds.throughputPercent then
            performanceComparison.regressionDetected = true
            table.insert(performanceComparison.details, string.format(
                "Throughput regression: %.2f%% decrease (threshold: %.2f%%)",
                throughputDelta, regressionConfig.performanceThresholds.throughputPercent
            ))
        end
    end
    
    -- Error rate comparison
    if monolithicMetrics.errorRate and distributedMetrics.errorRate then
        local errorRateDelta = distributedMetrics.errorRate - monolithicMetrics.errorRate
        performanceComparison.errorRateDelta = errorRateDelta
        
        if errorRateDelta > regressionConfig.performanceThresholds.errorRatePercent then
            performanceComparison.regressionDetected = true
            table.insert(performanceComparison.details, string.format(
                "Error rate regression: %.2f%% increase (threshold: %.2f%%)",
                errorRateDelta, regressionConfig.performanceThresholds.errorRatePercent
            ))
        end
    end
    
    return performanceComparison
end

function RegressionTestingFramework.compareFunctionality(monolithicOutput, distributedOutput, config)
    local functionalityComparison = {
        regressionDetected = false,
        details = {},
        exactMatch = false,
        deepComparisonResult = nil
    }
    
    -- Exact match check
    if config.exactMatch then
        if type(monolithicOutput) == "table" and type(distributedOutput) == "table" then
            functionalityComparison.deepComparisonResult = RegressionTestingFramework.deepCompare(
                monolithicOutput, distributedOutput, config.precisionTolerance or 0.001
            )
            functionalityComparison.exactMatch = functionalityComparison.deepComparisonResult.match
        else
            functionalityComparison.exactMatch = (monolithicOutput == distributedOutput)
        end
        
        if not functionalityComparison.exactMatch then
            functionalityComparison.regressionDetected = true
            table.insert(functionalityComparison.details, "Output mismatch between architectures")
            
            if functionalityComparison.deepComparisonResult then
                table.insert(functionalityComparison.details, functionalityComparison.deepComparisonResult.differences)
            end
        end
    end
    
    return functionalityComparison
end

function RegressionTestingFramework.deepCompare(obj1, obj2, tolerance)
    local comparison = {
        match = true,
        differences = {}
    }
    
    local function compare(o1, o2, path)
        if type(o1) ~= type(o2) then
            comparison.match = false
            table.insert(comparison.differences, string.format("Type mismatch at %s: %s vs %s", path, type(o1), type(o2)))
            return
        end
        
        if type(o1) == "number" then
            if math.abs(o1 - o2) > tolerance then
                comparison.match = false
                table.insert(comparison.differences, string.format("Number mismatch at %s: %s vs %s", path, o1, o2))
            end
        elseif type(o1) == "table" then
            for k, v in pairs(o1) do
                if o2[k] == nil then
                    comparison.match = false
                    table.insert(comparison.differences, string.format("Missing key at %s.%s", path, k))
                else
                    compare(v, o2[k], path .. "." .. k)
                end
            end
            for k, _ in pairs(o2) do
                if o1[k] == nil then
                    comparison.match = false
                    table.insert(comparison.differences, string.format("Extra key at %s.%s", path, k))
                end
            end
        else
            if o1 ~= o2 then
                comparison.match = false
                table.insert(comparison.differences, string.format("Value mismatch at %s: %s vs %s", path, o1, o2))
            end
        end
    end
    
    compare(obj1, obj2, "root")
    return comparison
end

function RegressionTestingFramework.validateEpic32Coverage(testResults)
    local coverageValidation = {
        totalStories = #epic32Stories,
        coveredStories = 0,
        uncoveredStories = {},
        coveragePercent = 0,
        passed = false
    }
    
    local storiesCovered = {}
    
    -- Analyze test results for Epic 32 story coverage
    for _, testResult in ipairs(testResults or testExecution.architectureComparisons) do
        for _, storyId in ipairs(epic32Stories) do
            if testResult.testName and string.find(testResult.testName, storyId) then
                storiesCovered[storyId] = true
            end
        end
    end
    
    -- Count coverage
    for _, storyId in ipairs(epic32Stories) do
        if storiesCovered[storyId] then
            coverageValidation.coveredStories = coverageValidation.coveredStories + 1
        else
            table.insert(coverageValidation.uncoveredStories, storyId)
        end
    end
    
    coverageValidation.coveragePercent = (coverageValidation.coveredStories / coverageValidation.totalStories) * 100
    coverageValidation.passed = coverageValidation.coveragePercent >= regressionConfig.coverageRequirements.minCoveragePercent
    
    return coverageValidation
end

function RegressionTestingFramework.generateRegressionReport()
    testExecution.endTime = 0
    
    local epic32Coverage = RegressionTestingFramework.validateEpic32Coverage()
    
    local report = {
        correlationId = testExecution.correlationId,
        testSuiteId = testExecution.testSuiteId,
        executionSummary = {
            startTime = testExecution.startTime,
            endTime = testExecution.endTime,
            duration = testExecution.endTime - testExecution.startTime,
            totalTests = testExecution.totalTests,
            passedTests = testExecution.passedTests,
            failedTests = testExecution.failedTests,
            skippedTests = testExecution.skippedTests,
            regressionCount = #testExecution.regressions
        },
        regressionAnalysis = {
            regressionsDetected = #testExecution.regressions > 0,
            regressionDetails = testExecution.regressions,
            criticalRegressions = {},
            performanceRegressions = {},
            functionalityRegressions = {}
        },
        epic32Coverage = epic32Coverage,
        architectureComparisons = testExecution.architectureComparisons,
        recommendations = {}
    }
    
    -- Categorize regressions
    for _, regression in ipairs(testExecution.regressions) do
        if regression.regressionType == "PERFORMANCE" then
            table.insert(report.regressionAnalysis.performanceRegressions, regression)
        elseif regression.regressionType == "FUNCTIONALITY" then
            table.insert(report.regressionAnalysis.functionalityRegressions, regression)
        else
            table.insert(report.regressionAnalysis.criticalRegressions, regression)
        end
    end
    
    -- Generate recommendations
    if #testExecution.regressions > 0 then
        table.insert(report.recommendations, "Address identified regressions before architecture migration")
    end
    if not epic32Coverage.passed then
        table.insert(report.recommendations, "Improve Epic 32 test coverage to meet minimum requirements")
    end
    if report.executionSummary.failedTests > 0 then
        table.insert(report.recommendations, "Investigate and resolve failed test cases")
    end
    
    return report
end

function RegressionTestingFramework.exportReport(report, format)
    format = format or "JSON"
    
    if format == "JSON" then
        return json.encode(report)
    elseif format == "SUMMARY" then
        local summary = string.format([[
=== REGRESSION TESTING REPORT ===
Correlation ID: %s
Test Suite: %s
Execution Duration: %d seconds

Test Results:
- Total Tests: %d
- Passed: %d
- Failed: %d
- Regressions Detected: %d

Epic 32 Coverage: %.1f%% (%d/%d stories)

Status: %s
]], 
            report.correlationId,
            report.testSuiteId,
            report.executionSummary.duration,
            report.executionSummary.totalTests,
            report.executionSummary.passedTests,
            report.executionSummary.failedTests,
            report.executionSummary.regressionCount,
            report.epic32Coverage.coveragePercent,
            report.epic32Coverage.coveredStories,
            report.epic32Coverage.totalStories,
            (#testExecution.regressions == 0 and report.epic32Coverage.passed) and "PASSED" or "FAILED"
        )
        return summary
    end
    
    return tostring(report)
end

return RegressionTestingFramework