--[[
Regression Detection and Failure Analysis System
Advanced detection and analysis of regressions with detailed failure reporting
--]]

local RegressionDetectionAnalyzer = {}

-- Dependencies
local json = { encode = function(obj) return tostring(obj) end }

-- Detection thresholds and configuration
local detectionConfig = {
    performanceRegression = {
        critical = {
            responseTimeIncrease = 50,  -- 50% response time increase
            throughputDecrease = 30,    -- 30% throughput decrease  
            errorRateIncrease = 5       -- 5% error rate increase
        },
        warning = {
            responseTimeIncrease = 20,  -- 20% response time increase
            throughputDecrease = 15,    -- 15% throughput decrease
            errorRateIncrease = 2       -- 2% error rate increase
        },
        minor = {
            responseTimeIncrease = 10,  -- 10% response time increase
            throughputDecrease = 5,     -- 5% throughput decrease
            errorRateIncrease = 1       -- 1% error rate increase
        }
    },
    functionalRegression = {
        outputMismatch = true,          -- Any output difference is critical
        precisionTolerance = 0.0001,    -- Floating point precision tolerance
        enableDeepAnalysis = true       -- Deep object structure analysis
    },
    stabilityRegression = {
        crashRate = 0,                  -- No crashes allowed
        timeoutRate = 1,                -- 1% timeout threshold
        memoryLeakThreshold = 20        -- 20% memory increase threshold
    }
}

-- Regression severity levels
local severityLevels = {
    CRITICAL = { priority = 1, requiresImmediate = true, blocksMigration = true },
    WARNING = { priority = 2, requiresImmediate = false, blocksMigration = false },
    MINOR = { priority = 3, requiresImmediate = false, blocksMigration = false },
    INFO = { priority = 4, requiresImmediate = false, blocksMigration = false }
}

-- Regression analysis state
local analysisState = {
    totalAnalyzed = 0,
    regressionsFound = 0,
    criticalRegressions = 0,
    warningRegressions = 0,
    minorRegressions = 0,
    analysisResults = {},
    failurePatterns = {},
    recommendedActions = {}
}

function RegressionDetectionAnalyzer.initializeAnalyzer(config)
    -- Reset analysis state
    analysisState.totalAnalyzed = 0
    analysisState.regressionsFound = 0
    analysisState.criticalRegressions = 0
    analysisState.warningRegressions = 0
    analysisState.minorRegressions = 0
    analysisState.analysisResults = {}
    analysisState.failurePatterns = {}
    analysisState.recommendedActions = {}
    
    -- Update configuration if provided
    if config and config.performanceThresholds then
        for severity, thresholds in pairs(config.performanceThresholds) do
            if detectionConfig.performanceRegression[severity] then
                for metric, value in pairs(thresholds) do
                    detectionConfig.performanceRegression[severity][metric] = value
                end
            end
        end
    end
    
    print("[REGRESSION_ANALYZER] Regression detection analyzer initialized")
    
    return {
        success = true,
        configuration = detectionConfig
    }
end

function RegressionDetectionAnalyzer.analyzeTestResult(testResult, comparisonData)
    analysisState.totalAnalyzed = analysisState.totalAnalyzed + 1
    
    local analysis = {
        testName = testResult.testName or "unknown",
        analysisTimestamp = 0,
        regressionDetected = false,
        regressionSeverity = "NONE",
        regressionTypes = {},
        performanceAnalysis = {},
        functionalAnalysis = {},
        stabilityAnalysis = {},
        detailedFindings = {},
        recommendedActions = {},
        rootCauseAnalysis = {}
    }
    
    print("[REGRESSION_ANALYZER] Analyzing test result: " .. analysis.testName)
    
    -- Performance regression analysis
    if testResult.monolithicResult and testResult.distributedResult then
        analysis.performanceAnalysis = RegressionDetectionAnalyzer.analyzePerformanceRegression(
            testResult.monolithicResult.performanceMetrics,
            testResult.distributedResult.performanceMetrics
        )
        
        if analysis.performanceAnalysis.regressionDetected then
            analysis.regressionDetected = true
            table.insert(analysis.regressionTypes, "PERFORMANCE")
        end
    end
    
    -- Functional regression analysis
    if testResult.monolithicResult and testResult.distributedResult then
        analysis.functionalAnalysis = RegressionDetectionAnalyzer.analyzeFunctionalRegression(
            testResult.monolithicResult.output,
            testResult.distributedResult.output
        )
        
        if analysis.functionalAnalysis.regressionDetected then
            analysis.regressionDetected = true
            table.insert(analysis.regressionTypes, "FUNCTIONAL")
        end
    end
    
    -- Stability regression analysis
    analysis.stabilityAnalysis = RegressionDetectionAnalyzer.analyzeStabilityRegression(testResult)
    
    if analysis.stabilityAnalysis.regressionDetected then
        analysis.regressionDetected = true
        table.insert(analysis.regressionTypes, "STABILITY")
    end
    
    -- Determine overall regression severity
    analysis.regressionSeverity = RegressionDetectionAnalyzer.determineSeverity(analysis)
    
    -- Generate detailed findings and recommendations
    analysis.detailedFindings = RegressionDetectionAnalyzer.generateDetailedFindings(analysis)
    analysis.recommendedActions = RegressionDetectionAnalyzer.generateRecommendedActions(analysis)
    analysis.rootCauseAnalysis = RegressionDetectionAnalyzer.performRootCauseAnalysis(analysis, testResult)
    
    -- Update analysis state
    if analysis.regressionDetected then
        analysisState.regressionsFound = analysisState.regressionsFound + 1
        
        if analysis.regressionSeverity == "CRITICAL" then
            analysisState.criticalRegressions = analysisState.criticalRegressions + 1
        elseif analysis.regressionSeverity == "WARNING" then
            analysisState.warningRegressions = analysisState.warningRegressions + 1
        elseif analysis.regressionSeverity == "MINOR" then
            analysisState.minorRegressions = analysisState.minorRegressions + 1
        end
        
        print("[REGRESSION_ANALYZER] REGRESSION DETECTED: " .. analysis.testName .. 
              " (Severity: " .. analysis.regressionSeverity .. ")")
    else
        print("[REGRESSION_ANALYZER] No regression detected: " .. analysis.testName)
    end
    
    table.insert(analysisState.analysisResults, analysis)
    RegressionDetectionAnalyzer.updateFailurePatterns(analysis)
    
    return analysis
end

function RegressionDetectionAnalyzer.analyzePerformanceRegression(monolithicMetrics, distributedMetrics)
    local performanceAnalysis = {
        regressionDetected = false,
        severity = "NONE",
        metrics = {
            responseTime = { regression = false, delta = 0, severity = "NONE" },
            throughput = { regression = false, delta = 0, severity = "NONE" },
            memoryUsage = { regression = false, delta = 0, severity = "NONE" }
        },
        overallImpact = "NONE"
    }
    
    if not monolithicMetrics or not distributedMetrics then
        return performanceAnalysis
    end
    
    -- Response time analysis
    if monolithicMetrics.responseTime and distributedMetrics.responseTime then
        local responseTimeDelta = ((distributedMetrics.responseTime - monolithicMetrics.responseTime) / 
                                  monolithicMetrics.responseTime) * 100
        
        performanceAnalysis.metrics.responseTime.delta = responseTimeDelta
        
        if responseTimeDelta >= detectionConfig.performanceRegression.critical.responseTimeIncrease then
            performanceAnalysis.metrics.responseTime.regression = true
            performanceAnalysis.metrics.responseTime.severity = "CRITICAL"
        elseif responseTimeDelta >= detectionConfig.performanceRegression.warning.responseTimeIncrease then
            performanceAnalysis.metrics.responseTime.regression = true
            performanceAnalysis.metrics.responseTime.severity = "WARNING"
        elseif responseTimeDelta >= detectionConfig.performanceRegression.minor.responseTimeIncrease then
            performanceAnalysis.metrics.responseTime.regression = true
            performanceAnalysis.metrics.responseTime.severity = "MINOR"
        end
    end
    
    -- Throughput analysis
    if monolithicMetrics.throughput and distributedMetrics.throughput then
        local throughputDelta = ((monolithicMetrics.throughput - distributedMetrics.throughput) / 
                                monolithicMetrics.throughput) * 100
        
        performanceAnalysis.metrics.throughput.delta = throughputDelta
        
        if throughputDelta >= detectionConfig.performanceRegression.critical.throughputDecrease then
            performanceAnalysis.metrics.throughput.regression = true
            performanceAnalysis.metrics.throughput.severity = "CRITICAL"
        elseif throughputDelta >= detectionConfig.performanceRegression.warning.throughputDecrease then
            performanceAnalysis.metrics.throughput.regression = true
            performanceAnalysis.metrics.throughput.severity = "WARNING"
        elseif throughputDelta >= detectionConfig.performanceRegression.minor.throughputDecrease then
            performanceAnalysis.metrics.throughput.regression = true
            performanceAnalysis.metrics.throughput.severity = "MINOR"
        end
    end
    
    -- Memory usage analysis
    if monolithicMetrics.memoryUsage and distributedMetrics.memoryUsage then
        local memoryDelta = ((distributedMetrics.memoryUsage - monolithicMetrics.memoryUsage) / 
                            monolithicMetrics.memoryUsage) * 100
        
        performanceAnalysis.metrics.memoryUsage.delta = memoryDelta
        
        if memoryDelta >= detectionConfig.stabilityRegression.memoryLeakThreshold then
            performanceAnalysis.metrics.memoryUsage.regression = true
            performanceAnalysis.metrics.memoryUsage.severity = "WARNING"
        end
    end
    
    -- Determine overall performance regression
    local highestSeverity = "NONE"
    for _, metric in pairs(performanceAnalysis.metrics) do
        if metric.regression then
            performanceAnalysis.regressionDetected = true
            if metric.severity == "CRITICAL" then
                highestSeverity = "CRITICAL"
            elseif metric.severity == "WARNING" and highestSeverity ~= "CRITICAL" then
                highestSeverity = "WARNING"
            elseif metric.severity == "MINOR" and highestSeverity == "NONE" then
                highestSeverity = "MINOR"
            end
        end
    end
    
    performanceAnalysis.severity = highestSeverity
    performanceAnalysis.overallImpact = highestSeverity
    
    return performanceAnalysis
end

function RegressionDetectionAnalyzer.analyzeFunctionalRegression(monolithicOutput, distributedOutput)
    local functionalAnalysis = {
        regressionDetected = false,
        severity = "NONE",
        outputComparison = {
            exactMatch = false,
            differences = {},
            structuralChanges = {},
            valueDiscrepancies = {}
        },
        impactAssessment = "NONE"
    }
    
    if not monolithicOutput or not distributedOutput then
        return functionalAnalysis
    end
    
    -- Deep comparison of outputs
    local comparison = RegressionDetectionAnalyzer.performDeepComparison(
        monolithicOutput, 
        distributedOutput,
        detectionConfig.functionalRegression.precisionTolerance
    )
    
    functionalAnalysis.outputComparison = comparison
    
    if not comparison.exactMatch then
        functionalAnalysis.regressionDetected = true
        functionalAnalysis.severity = "CRITICAL"  -- Any functional difference is critical
        functionalAnalysis.impactAssessment = "CRITICAL"
        
        -- Categorize differences
        for _, difference in ipairs(comparison.differences) do
            if string.find(difference, "Type mismatch") or string.find(difference, "Missing key") or 
               string.find(difference, "Extra key") then
                table.insert(functionalAnalysis.outputComparison.structuralChanges, difference)
            else
                table.insert(functionalAnalysis.outputComparison.valueDiscrepancies, difference)
            end
        end
    else
        functionalAnalysis.outputComparison.exactMatch = true
    end
    
    return functionalAnalysis
end

function RegressionDetectionAnalyzer.analyzeStabilityRegression(testResult)
    local stabilityAnalysis = {
        regressionDetected = false,
        severity = "NONE",
        stabilityMetrics = {
            crashed = false,
            timedOut = false,
            memoryLeak = false,
            unexpectedError = false
        },
        stabilityImpact = "NONE"
    }
    
    -- Check for crashes
    if testResult.distributedResult and testResult.distributedResult.error then
        if string.find(string.lower(testResult.distributedResult.error), "crash") or
           string.find(string.lower(testResult.distributedResult.error), "segmentation") then
            stabilityAnalysis.stabilityMetrics.crashed = true
            stabilityAnalysis.regressionDetected = true
            stabilityAnalysis.severity = "CRITICAL"
        end
    end
    
    -- Check for timeouts
    if testResult.executionTime and testResult.executionTime > 30 then -- 30 second timeout
        stabilityAnalysis.stabilityMetrics.timedOut = true
        stabilityAnalysis.regressionDetected = true
        if stabilityAnalysis.severity == "NONE" then
            stabilityAnalysis.severity = "WARNING"
        end
    end
    
    -- Check for unexpected errors
    if testResult.status == "FAILED" and testResult.failureReason then
        if not string.find(string.lower(testResult.failureReason), "regression") and
           not string.find(string.lower(testResult.failureReason), "comparison") then
            stabilityAnalysis.stabilityMetrics.unexpectedError = true
            stabilityAnalysis.regressionDetected = true
            if stabilityAnalysis.severity == "NONE" then
                stabilityAnalysis.severity = "WARNING"
            end
        end
    end
    
    stabilityAnalysis.stabilityImpact = stabilityAnalysis.severity
    
    return stabilityAnalysis
end

function RegressionDetectionAnalyzer.performDeepComparison(obj1, obj2, tolerance)
    local comparison = {
        exactMatch = true,
        differences = {}
    }
    
    local function compare(o1, o2, path)
        if type(o1) ~= type(o2) then
            comparison.exactMatch = false
            table.insert(comparison.differences, 
                string.format("Type mismatch at %s: %s vs %s", path, type(o1), type(o2)))
            return
        end
        
        if type(o1) == "number" then
            if math.abs(o1 - o2) > tolerance then
                comparison.exactMatch = false
                table.insert(comparison.differences, 
                    string.format("Number mismatch at %s: %.6f vs %.6f (tolerance: %.6f)", 
                    path, o1, o2, tolerance))
            end
        elseif type(o1) == "table" then
            for k, v in pairs(o1) do
                if o2[k] == nil then
                    comparison.exactMatch = false
                    table.insert(comparison.differences, 
                        string.format("Missing key at %s.%s", path, k))
                else
                    compare(v, o2[k], path .. "." .. k)
                end
            end
            for k, _ in pairs(o2) do
                if o1[k] == nil then
                    comparison.exactMatch = false
                    table.insert(comparison.differences, 
                        string.format("Extra key at %s.%s", path, k))
                end
            end
        else
            if o1 ~= o2 then
                comparison.exactMatch = false
                table.insert(comparison.differences, 
                    string.format("Value mismatch at %s: %s vs %s", path, tostring(o1), tostring(o2)))
            end
        end
    end
    
    compare(obj1, obj2, "root")
    return comparison
end

function RegressionDetectionAnalyzer.determineSeverity(analysis)
    local severities = {}
    
    if analysis.performanceAnalysis.regressionDetected then
        table.insert(severities, analysis.performanceAnalysis.severity)
    end
    
    if analysis.functionalAnalysis.regressionDetected then
        table.insert(severities, analysis.functionalAnalysis.severity)
    end
    
    if analysis.stabilityAnalysis.regressionDetected then
        table.insert(severities, analysis.stabilityAnalysis.severity)
    end
    
    -- Return highest severity
    for _, severity in ipairs({"CRITICAL", "WARNING", "MINOR"}) do
        for _, foundSeverity in ipairs(severities) do
            if foundSeverity == severity then
                return severity
            end
        end
    end
    
    return "NONE"
end

function RegressionDetectionAnalyzer.generateDetailedFindings(analysis)
    local findings = {}
    
    if analysis.performanceAnalysis.regressionDetected then
        table.insert(findings, {
            category = "PERFORMANCE",
            severity = analysis.performanceAnalysis.severity,
            details = analysis.performanceAnalysis.metrics
        })
    end
    
    if analysis.functionalAnalysis.regressionDetected then
        table.insert(findings, {
            category = "FUNCTIONAL",
            severity = analysis.functionalAnalysis.severity,
            details = analysis.functionalAnalysis.outputComparison
        })
    end
    
    if analysis.stabilityAnalysis.regressionDetected then
        table.insert(findings, {
            category = "STABILITY", 
            severity = analysis.stabilityAnalysis.severity,
            details = analysis.stabilityAnalysis.stabilityMetrics
        })
    end
    
    return findings
end

function RegressionDetectionAnalyzer.generateRecommendedActions(analysis)
    local actions = {}
    
    if analysis.regressionSeverity == "CRITICAL" then
        table.insert(actions, "HALT: Critical regression detected - do not proceed with migration")
        table.insert(actions, "Immediate investigation required for root cause analysis")
        table.insert(actions, "Rollback distributed changes and fix issues before retry")
    elseif analysis.regressionSeverity == "WARNING" then
        table.insert(actions, "Performance optimization recommended before migration")
        table.insert(actions, "Review distributed architecture for efficiency improvements")
    elseif analysis.regressionSeverity == "MINOR" then
        table.insert(actions, "Monitor performance after migration")
        table.insert(actions, "Document performance changes for future optimization")
    end
    
    return actions
end

function RegressionDetectionAnalyzer.performRootCauseAnalysis(analysis, testResult)
    local rootCause = {
        potentialCauses = {},
        contributingFactors = {},
        investigationSteps = {}
    }
    
    if analysis.performanceAnalysis.regressionDetected then
        table.insert(rootCause.potentialCauses, "Inter-process communication overhead")
        table.insert(rootCause.potentialCauses, "Process coordination latency")
        table.insert(rootCause.investigationSteps, "Profile inter-process message passing")
        table.insert(rootCause.investigationSteps, "Analyze process resource utilization")
    end
    
    if analysis.functionalAnalysis.regressionDetected then
        table.insert(rootCause.potentialCauses, "Logic implementation differences between architectures")
        table.insert(rootCause.potentialCauses, "Data serialization/deserialization issues")
        table.insert(rootCause.investigationSteps, "Compare calculation logic implementations")
        table.insert(rootCause.investigationSteps, "Validate message data integrity")
    end
    
    if analysis.stabilityAnalysis.regressionDetected then
        table.insert(rootCause.potentialCauses, "Process failure or timeout")
        table.insert(rootCause.potentialCauses, "Resource exhaustion in distributed environment")
        table.insert(rootCause.investigationSteps, "Check process logs for errors")
        table.insert(rootCause.investigationSteps, "Monitor resource usage patterns")
    end
    
    return rootCause
end

function RegressionDetectionAnalyzer.updateFailurePatterns(analysis)
    if not analysis.regressionDetected then
        return
    end
    
    -- Track failure patterns for trend analysis
    local patternKey = table.concat(analysis.regressionTypes, "_")
    
    if not analysisState.failurePatterns[patternKey] then
        analysisState.failurePatterns[patternKey] = {
            count = 0,
            severity = analysis.regressionSeverity,
            firstSeen = 0,
            lastSeen = 0,
            affectedTests = {}
        }
    end
    
    analysisState.failurePatterns[patternKey].count = analysisState.failurePatterns[patternKey].count + 1
    analysisState.failurePatterns[patternKey].lastSeen = 0
    table.insert(analysisState.failurePatterns[patternKey].affectedTests, analysis.testName)
end

function RegressionDetectionAnalyzer.generateAnalysisReport()
    local report = {
        analysisTimestamp = 0,
        analysisSummary = {
            totalAnalyzed = analysisState.totalAnalyzed,
            regressionsFound = analysisState.regressionsFound,
            regressionRate = (analysisState.regressionsFound / math.max(analysisState.totalAnalyzed, 1)) * 100,
            severityBreakdown = {
                critical = analysisState.criticalRegressions,
                warning = analysisState.warningRegressions,
                minor = analysisState.minorRegressions
            }
        },
        detailedAnalysis = analysisState.analysisResults,
        failurePatterns = analysisState.failurePatterns,
        migrationRecommendation = {
            canProceed = analysisState.criticalRegressions == 0,
            blockers = {},
            warnings = {},
            nextSteps = {}
        }
    }
    
    -- Generate migration recommendation
    if analysisState.criticalRegressions > 0 then
        report.migrationRecommendation.canProceed = false
        table.insert(report.migrationRecommendation.blockers, 
            string.format("Critical regressions detected: %d", analysisState.criticalRegressions))
        table.insert(report.migrationRecommendation.nextSteps, "Fix all critical regressions before migration")
    end
    
    if analysisState.warningRegressions > 0 then
        table.insert(report.migrationRecommendation.warnings,
            string.format("Performance warnings: %d", analysisState.warningRegressions))
        table.insert(report.migrationRecommendation.nextSteps, "Address performance warnings for optimal migration")
    end
    
    if report.migrationRecommendation.canProceed and analysisState.regressionsFound == 0 then
        table.insert(report.migrationRecommendation.nextSteps, "Proceed with migration - no regressions detected")
    end
    
    return report
end

return RegressionDetectionAnalyzer