--[[
Unit Tests for Epic 32 Coverage Validator
Tests comprehensive Epic 32 story coverage validation
--]]

-- Test framework setup
package.path = package.path .. ";../../../?.lua"
local TestFramework = require("tests.test-framework")
local Epic32CoverageValidator = require("tests.regression.epic32-coverage-validator")

local suite = TestFramework.createTestSuite("Epic32CoverageValidator")

-- Test initialization
suite("should initialize coverage validator successfully", function(assert)
    local result = Epic32CoverageValidator.initializeCoverageValidator()
    
    assert(result.success == true, "Should initialize successfully")
    assert(result.totalStories == 8, "Should have 8 Epic 32 stories")
end)

-- Test story coverage validation
suite("should validate story coverage from test results", function(assert)
    Epic32CoverageValidator.initializeCoverageValidator()
    
    local testResults = {
        { testName = "32.1_inter_process_message_flow", status = "PASSED" },
        { testName = "32.1_authentication_handshake", status = "PASSED" },
        { testName = "32.2_game_state_coordination", status = "PASSED" },
        { testName = "32.3_battle_process_isolation", status = "PASSED" },
        { testName = "32.3_battle_coordination", status = "PASSED" }
    }
    
    local deployedComponents = {
        "MessageCorrelator", "ProcessAuthenticator", "GameCoordinator",
        "BattleEngineProcess", "DamageCalculator"
    }
    
    local performanceMetrics = {
        messageLatency = 45,
        stateSync = 85,
        battleInit = 125,
        statCalc = 15
    }
    
    local result = Epic32CoverageValidator.validateStoryCoverage(
        testResults, deployedComponents, performanceMetrics
    )
    
    assert(result.success == true, "Should validate coverage successfully")
    assert(result.coverageScore > 0, "Should calculate coverage score")
    assert(result.totalStories == 8, "Should track total stories")
    assert(result.storiesCovered >= 2, "Should detect covered stories")
end)

-- Test component coverage analysis
suite("should analyze component deployment coverage", function(assert)
    Epic32CoverageValidator.initializeCoverageValidator()
    
    local deployedComponents = {
        "MessageCorrelator",
        "ProcessAuthenticator", 
        "GameCoordinator",
        "BattleEngineProcess",
        "PokemonManagementProcess"
    }
    
    -- Mock internal call to analyzeComponentCoverage
    Epic32CoverageValidator.analyzeComponentCoverage(deployedComponents)
    
    -- Generate report to check results
    local report = Epic32CoverageValidator.generateDetailedCoverageReport()
    
    assert(report.storyCoverage ~= nil, "Should have story coverage data")
    assert(report.componentCoverage ~= nil, "Should have component coverage data")
    
    -- Check that some stories have component coverage
    local story321Coverage = report.storyCoverage["32.1"]
    assert(story321Coverage ~= nil, "Should have Story 32.1 coverage")
    assert(story321Coverage.componentsCovered > 0, "Story 32.1 should have component coverage")
end)

-- Test performance requirements validation
suite("should validate performance requirements", function(assert)
    Epic32CoverageValidator.initializeCoverageValidator()
    
    local performanceMetrics = {
        messageLatency = 45,    -- Under 50ms threshold
        throughput = 1200,      -- Above 1000 msg/sec threshold  
        stateSync = 85,         -- Under 100ms threshold
        battleInit = 125,       -- Under 150ms threshold
        statCalc = 15,          -- Under 20ms threshold
        transaction = 60,       -- Under 75ms threshold
        validation = 25,        -- Under 30ms threshold
        healthCheck = 20,       -- Under 25ms threshold
        deployment = 275        -- Under 300ms threshold
    }
    
    Epic32CoverageValidator.analyzePerformanceCoverage(performanceMetrics)
    
    local report = Epic32CoverageValidator.generateDetailedCoverageReport()
    
    assert(report.performanceValidation ~= nil, "Should have performance validation")
    
    -- Check specific story performance validation
    local story321Perf = report.performanceValidation["32.1"]
    if story321Perf then
        for _, perfResult in ipairs(story321Perf) do
            assert(perfResult.requirement ~= nil, "Should have requirement name")
            assert(perfResult.threshold ~= nil, "Should have threshold value")
            assert(perfResult.actual ~= nil, "Should have actual value")
            assert(type(perfResult.met) == "boolean", "Should indicate if requirement met")
        end
    end
end)

-- Test coverage score calculation
suite("should calculate accurate coverage scores", function(assert)
    Epic32CoverageValidator.initializeCoverageValidator()
    
    -- Simulate good coverage for story 32.1
    local testResults = {
        { testName = "32.1_message_passing_validation", status = "PASSED" },
        { testName = "32.1_process_authentication", status = "PASSED" },
        { testName = "32.1_correlation_tracking", status = "PASSED" },
        { testName = "32.1_inter_process_message_flow", status = "PASSED" }
    }
    
    local deployedComponents = {
        "MessageCorrelator", "ProcessAuthenticator", 
        "InterProcessHandler", "MessageValidator"
    }
    
    local performanceMetrics = {
        messageLatency = 40,  -- Under threshold
        throughput = 1100     -- Above threshold
    }
    
    Epic32CoverageValidator.validateStoryCoverage(testResults, deployedComponents, performanceMetrics)
    Epic32CoverageValidator.calculateCoverageScores()
    
    local report = Epic32CoverageValidator.generateDetailedCoverageReport()
    local story321 = report.storyCoverage["32.1"]
    
    assert(story321 ~= nil, "Should have Story 32.1 data")
    assert(story321.coverageScore > 80, "Should achieve high coverage score")
    assert(story321.covered == true, "Story should be marked as covered")
end)

-- Test coverage gap identification
suite("should identify coverage gaps accurately", function(assert)
    Epic32CoverageValidator.initializeCoverageValidator()
    
    -- Simulate partial coverage that creates gaps
    local testResults = {
        { testName = "32.1_basic_test", status = "PASSED" }
    }
    
    local deployedComponents = {
        "MessageCorrelator" -- Only one component
    }
    
    local performanceMetrics = {
        messageLatency = 60 -- Above threshold
    }
    
    Epic32CoverageValidator.validateStoryCoverage(testResults, deployedComponents, performanceMetrics)
    Epic32CoverageValidator.calculateCoverageScores()
    Epic32CoverageValidator.identifyCoverageGaps()
    
    local report = Epic32CoverageValidator.generateDetailedCoverageReport()
    
    assert(#report.coverageGaps > 0, "Should identify coverage gaps")
    
    -- Check gap details
    local hasStory321Gap = false
    for _, gap in ipairs(report.coverageGaps) do
        if gap.storyId == "32.1" then
            hasStory321Gap = true
            assert(#gap.issues > 0, "Should list specific gap issues")
            break
        end
    end
    assert(hasStory321Gap == true, "Should identify Story 32.1 gaps")
end)

-- Test recommendation generation  
suite("should generate appropriate recommendations", function(assert)
    Epic32CoverageValidator.initializeCoverageValidator()
    
    -- Simulate low coverage scenario
    local testResults = {
        { testName = "basic_test", status = "PASSED" }
    }
    
    Epic32CoverageValidator.validateStoryCoverage(testResults, {}, {})
    Epic32CoverageValidator.calculateCoverageScores()
    Epic32CoverageValidator.identifyCoverageGaps() 
    Epic32CoverageValidator.generateCoverageRecommendations()
    
    local report = Epic32CoverageValidator.generateDetailedCoverageReport()
    
    assert(#report.recommendations > 0, "Should generate recommendations")
    
    -- Check for high priority recommendations
    local hasHighPriority = false
    for _, rec in ipairs(report.recommendations) do
        if rec.priority == "HIGH" then
            hasHighPriority = true
            assert(rec.action ~= nil, "High priority recommendation should have action")
            break
        end
    end
    assert(hasHighPriority == true, "Should have high priority recommendations")
end)

-- Test migration readiness assessment
suite("should assess migration readiness correctly", function(assert)
    Epic32CoverageValidator.initializeCoverageValidator()
    
    -- Simulate insufficient coverage
    local testResults = {
        { testName = "minimal_test", status = "PASSED" }
    }
    
    Epic32CoverageValidator.validateStoryCoverage(testResults, {}, {})
    Epic32CoverageValidator.calculateCoverageScores()
    
    local report = Epic32CoverageValidator.generateDetailedCoverageReport()
    
    assert(report.migrationReadiness ~= nil, "Should have migration readiness assessment")
    assert(report.migrationReadiness.ready == false, "Should not be ready with low coverage")
    assert(#report.migrationReadiness.blockers > 0, "Should list migration blockers")
    assert(#report.migrationReadiness.nextSteps > 0, "Should provide next steps")
end)

suite("should indicate migration ready with full coverage", function(assert)
    Epic32CoverageValidator.initializeCoverageValidator()
    
    -- Mock full coverage scenario
    -- Set all stories as covered with high scores
    Epic32CoverageValidator.analyzeTestCoverage({
        { testName = "32.1_complete", status = "PASSED" },
        { testName = "32.2_complete", status = "PASSED" },
        { testName = "32.3_complete", status = "PASSED" },
        { testName = "32.4_complete", status = "PASSED" },
        { testName = "32.5_complete", status = "PASSED" },
        { testName = "32.6_complete", status = "PASSED" },
        { testName = "32.7_complete", status = "PASSED" },
        { testName = "32.8_complete", status = "PASSED" }
    })
    
    -- Mock component coverage
    Epic32CoverageValidator.analyzeComponentCoverage({
        "MessageCorrelator", "ProcessAuthenticator", "GameCoordinator",
        "BattleEngineProcess", "PokemonManagementProcess", "EconomyProcess",
        "SecurityProcess", "AdminProcess", "DeploymentCoordinator"
    })
    
    -- Mock performance metrics
    Epic32CoverageValidator.analyzePerformanceCoverage({
        messageLatency = 40, stateSync = 80, battleInit = 120,
        statCalc = 15, transaction = 50, validation = 20,
        healthCheck = 15, deployment = 250
    })
    
    Epic32CoverageValidator.calculateCoverageScores()
    
    local report = Epic32CoverageValidator.generateDetailedCoverageReport()
    
    -- With mocked full coverage, should be ready
    assert(report.epic32Summary.overallCoverageScore >= 95, "Should achieve high overall score")
end)

-- Test report export functionality
suite("should export coverage report in different formats", function(assert)
    Epic32CoverageValidator.initializeCoverageValidator()
    
    local testResults = { { testName = "test", status = "PASSED" } }
    Epic32CoverageValidator.validateStoryCoverage(testResults, {}, {})
    
    local report = Epic32CoverageValidator.generateDetailedCoverageReport()
    
    local jsonReport = Epic32CoverageValidator.exportCoverageReport(report, "JSON")
    local summaryReport = Epic32CoverageValidator.exportCoverageReport(report, "SUMMARY")
    
    assert(type(jsonReport) == "string", "Should export JSON as string")
    assert(type(summaryReport) == "string", "Should export summary as string")
    assert(string.find(summaryReport, "EPIC 32 COVERAGE") ~= nil, "Summary should contain title")
    assert(string.find(summaryReport, "Coverage Summary") ~= nil, "Summary should contain coverage info")
end)

-- Test edge cases
suite("should handle empty test results gracefully", function(assert)
    Epic32CoverageValidator.initializeCoverageValidator()
    
    local result = Epic32CoverageValidator.validateStoryCoverage({}, {}, {})
    
    assert(result.success == true, "Should handle empty results successfully")
    assert(result.coverageScore == 0, "Should have zero coverage score")
    assert(result.storiesCovered == 0, "Should have zero stories covered")
end)

suite("should handle nil inputs gracefully", function(assert)
    Epic32CoverageValidator.initializeCoverageValidator()
    
    local result = Epic32CoverageValidator.validateStoryCoverage(nil, nil, nil)
    
    assert(result.success == true, "Should handle nil inputs successfully")
    assert(result.coverageScore >= 0, "Should calculate valid coverage score")
end)

-- Test specific Epic 32 story requirements
suite("should correctly identify Story 32.3 battle engine requirements", function(assert)
    Epic32CoverageValidator.initializeCoverageValidator()
    
    local testResults = {
        { testName = "32.3_battle_process_isolation", status = "PASSED" },
        { testName = "32.3_battle_coordination", status = "PASSED" },
        { testName = "32.3_battle_initialization", status = "PASSED" },
        { testName = "32.3_turn_resolution", status = "PASSED" }
    }
    
    Epic32CoverageValidator.analyzeTestCoverage(testResults)
    
    local report = Epic32CoverageValidator.generateDetailedCoverageReport()
    local story323 = report.storyCoverage["32.3"]
    
    assert(story323 ~= nil, "Should have Story 32.3 data")
    assert(story323.testsCovered >= 2, "Should detect multiple test coverage")
    assert(story323.criticalPathsCovered >= 2, "Should detect critical path coverage")
end)

-- Run the test suite
return suite