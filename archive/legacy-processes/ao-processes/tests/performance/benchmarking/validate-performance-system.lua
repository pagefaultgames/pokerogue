--[[
Performance Benchmarking System Validation
Validates all performance benchmarking components and their integration
--]]

-- Load the performance systems
local PerformanceBenchmarkingFramework = require("tests.performance.benchmarking.performance-benchmarking-framework")
local AutomatedPerformanceBenchmarker = require("tests.performance.benchmarking.automated-performance-benchmarker")
local PerformanceRegressionDetector = require("tests.performance.benchmarking.performance-regression-detector")
local ResourceUtilizationMonitor = require("tests.performance.benchmarking.resource-utilization-monitor")

print("=== PERFORMANCE BENCHMARKING SYSTEM VALIDATION ===")

-- Test 1: Initialize Performance Benchmarking Framework
print("\n1. Testing Performance Benchmarking Framework...")
local result1 = PerformanceBenchmarkingFramework.initializeBenchmarking({
    architectures = { distributed = { enabled = true } }
})
print("   Status:", result1.success and "PASS" or "FAIL")
print("   Total Benchmarks:", result1.totalBenchmarks)

-- Test 2: Execute Benchmark Suite
print("\n2. Testing Benchmark Suite Execution...")
local benchmarkResults = PerformanceBenchmarkingFramework.executeBenchmarkSuite("quick")
print("   Completed Benchmarks:", benchmarkResults.completedBenchmarks .. "/" .. benchmarkResults.totalBenchmarks)
print("   Execution Duration:", benchmarkResults.duration, "seconds")
print("   Regression Alerts:", #benchmarkResults.regressionAlerts)

-- Test 3: Initialize Automated Performance Benchmarker
print("\n3. Testing Automated Performance Benchmarker...")
local result3 = AutomatedPerformanceBenchmarker.initializeAutomatedBenchmarking({})
print("   Status:", result3.success and "PASS" or "FAIL")
print("   Schedule Enabled:", result3.scheduleEnabled and "YES" or "NO")

-- Test 4: Execute Automated Benchmarking Pattern
print("\n4. Testing Automated Benchmarking Pattern...")
local automatedResults = AutomatedPerformanceBenchmarker.startAutomatedBenchmarking("steadyState", 60)
print("   Pattern:", automatedResults.pattern or "N/A")
print("   Duration:", automatedResults.totalDuration or 0, "seconds") 
print("   Real-time Data Points:", #(automatedResults.realTimeData or {}))

-- Test 5: Initialize Performance Regression Detector
print("\n5. Testing Performance Regression Detector...")
local result5 = PerformanceRegressionDetector.initializeRegressionDetection({})
print("   Status:", result5.success and "PASS" or "FAIL")

-- Test 6: Test Baseline Establishment
print("\n6. Testing Baseline Establishment...")
local mockMeasurements = {}
for i = 1, 20 do
    table.insert(mockMeasurements, 100 + math.random(-10, 15))
end

local baselineResult = PerformanceRegressionDetector.establishBaseline(
    "distributed", "battle", mockMeasurements
)
print("   Baseline Status:", baselineResult.success and "ESTABLISHED" or "FAILED")
print("   Baseline Stable:", baselineResult.stable and "YES" or "NO")

-- Test 7: Test Regression Detection
print("\n7. Testing Regression Detection...")
local currentMeasurements = {}
for i = 1, 15 do
    table.insert(currentMeasurements, 130 + math.random(-5, 10)) -- Higher values to trigger regression
end

local regressionResult = PerformanceRegressionDetector.detectRegressions(
    "distributed", "battle", currentMeasurements
)
print("   Regression Detection:", regressionResult.success and "COMPLETED" or "FAILED")
if regressionResult.success then
    print("   Regressions Found:", #regressionResult.regressions)
    print("   Overall Severity:", regressionResult.overallSeverity)
    print("   Confidence:", string.format("%.2f", regressionResult.confidence))
end

-- Test 8: Initialize Resource Utilization Monitor
print("\n8. Testing Resource Utilization Monitor...")
local result8 = ResourceUtilizationMonitor.initializeResourceMonitoring({})
print("   Status:", result8.success and "PASS" or "FAIL")
print("   Sampling Interval:", result8.samplingInterval, "seconds")
print("   Resource Types:", #result8.resourceTypes)

-- Test 9: Execute Resource Monitoring
print("\n9. Testing Resource Monitoring Execution...")
local resourceResults = ResourceUtilizationMonitor.startResourceMonitoring(60, "distributed")
print("   Monitoring Status:", resourceResults.success and "COMPLETED" or "FAILED")
print("   Sample Count:", resourceResults.sampleCount)
print("   Alerts Generated:", resourceResults.alerts)
print("   Trends Analyzed:", #resourceResults.trends)

-- Test 10: Generate Reports
print("\n10. Testing Report Generation...")
local benchmarkReport = PerformanceBenchmarkingFramework.generateBenchmarkReport()
local regressionReport = PerformanceRegressionDetector.generateRegressionReport()
local resourceReport = ResourceUtilizationMonitor.generateResourceUtilizationReport()

print("   Benchmark Report Generated:", benchmarkReport ~= nil and "PASS" or "FAIL")
print("   Regression Report Generated:", regressionReport ~= nil and "PASS" or "FAIL") 
print("   Resource Report Generated:", resourceReport ~= nil and "PASS" or "FAIL")

-- Test 11: Export Reports in Different Formats
print("\n11. Testing Report Export...")
local summaryReport = PerformanceBenchmarkingFramework.exportBenchmarkReport(benchmarkReport, "SUMMARY")
local jsonReport = PerformanceBenchmarkingFramework.exportBenchmarkReport(benchmarkReport, "JSON")

print("   Summary Export:", summaryReport ~= nil and "PASS" or "FAIL")
print("   JSON Export:", jsonReport ~= nil and "PASS" or "FAIL")

-- Test 12: Integration Test - Full Performance Analysis
print("\n12. Testing Full Performance Analysis Integration...")
local integrationSuccess = true

-- Get current resource usage
local currentResources = ResourceUtilizationMonitor.getCurrentResourceUsage()
integrationSuccess = integrationSuccess and (currentResources ~= nil)

-- Get benchmark status  
local benchmarkStatus = AutomatedPerformanceBenchmarker.getBenchmarkStatus()
integrationSuccess = integrationSuccess and (benchmarkStatus ~= nil)

-- Get active regressions
local activeRegressions = PerformanceRegressionDetector.getActiveRegressions()
integrationSuccess = integrationSuccess and (activeRegressions ~= nil)

print("   Integration Test:", integrationSuccess and "PASS" or "FAIL")

-- Validation Summary
print("\n=== VALIDATION SUMMARY ===")

local allSystemsInitialized = result1.success and result3.success and result5.success and result8.success
local benchmarkingWorks = benchmarkResults.completedBenchmarks > 0 and automatedResults ~= nil
local regressionDetectionWorks = baselineResult.success and regressionResult.success
local resourceMonitoringWorks = resourceResults.success
local reportingWorks = benchmarkReport ~= nil and regressionReport ~= nil and resourceReport ~= nil

print("System Initialization:", allSystemsInitialized and "PASS" or "FAIL")
print("Benchmarking Execution:", benchmarkingWorks and "PASS" or "FAIL")
print("Regression Detection:", regressionDetectionWorks and "PASS" or "FAIL")  
print("Resource Monitoring:", resourceMonitoringWorks and "PASS" or "FAIL")
print("Report Generation:", reportingWorks and "PASS" or "FAIL")
print("System Integration:", integrationSuccess and "PASS" or "FAIL")

local overallSuccess = allSystemsInitialized and benchmarkingWorks and regressionDetectionWorks and 
                      resourceMonitoringWorks and reportingWorks and integrationSuccess

print("\n✓ Performance Benchmarking System Validation Complete")
print("Status:", overallSuccess and "ALL SYSTEMS OPERATIONAL" or "ISSUES DETECTED")

-- Display summary metrics
if overallSuccess then
    print("\nSummary Metrics:")
    print("- Benchmark Scenarios Executed:", benchmarkResults.completedBenchmarks)
    print("- Performance Samples Collected:", resourceResults.sampleCount)
    print("- Regression Analysis Completed:", regressionResult.success and "YES" or "NO")
    print("- Resource Efficiency Monitoring:", resourceResults.success and "ACTIVE" or "INACTIVE")
    print("- Automated Benchmarking:", automatedResults.pattern and "CONFIGURED" or "DISABLED")
end