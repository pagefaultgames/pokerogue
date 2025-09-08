--[[
Unit Tests for Testing Framework Components (Task 10)
Tests all testing utilities, frameworks, and comparison systems
--]]

local TestFramework = require("../../test-framework")
local test = TestFramework.createTestSuite("Comprehensive Testing Framework Unit Tests")

test("Load Testing Framework Components", function(assert)
    local LoadTestingFramework = require("../../load/load-testing-framework")
    assert(LoadTestingFramework ~= nil, "Load testing framework should be loadable")
    
    local config = LoadTestingFramework.createLoadTestConfig({testId = "unit_test"})
    assert(config.testId == "unit_test", "Configuration should be created correctly")
end)

test("Mathematical Parity Validator Components", function(assert)
    local MathematicalParityValidator = require("../../parity/mathematical-parity-validator")
    assert(MathematicalParityValidator ~= nil, "Parity validator should be loadable")
    
    local thresholds = MathematicalParityValidator.precisionThresholds
    assert(thresholds.statCalculation == 0.0001, "Precision thresholds should be correct")
end)

test("Integration Testing Components", function(assert)
    local EndToEndIntegrationTester = require("../../integration/end-to-end-integration-tester")
    assert(EndToEndIntegrationTester ~= nil, "Integration tester should be loadable")
    
    local workflows = EndToEndIntegrationTester.workflowDefinitions
    assert(workflows.complete_battle_workflow ~= nil, "Battle workflow should be defined")
end)

test("Chaos Engineering Framework Components", function(assert)
    local ChaosEngineeringFramework = require("../../fault-tolerance/chaos-engineering-framework")
    assert(ChaosEngineeringFramework ~= nil, "Chaos engineering framework should be loadable")
    
    local scenarios = ChaosEngineeringFramework.failureScenarios
    assert(scenarios.process_failure ~= nil, "Process failure scenario should be defined")
end)

test("Testing Documentation Generator", function(assert)
    local TestingDocumentationGenerator = require("../../framework/testing-documentation-generator")
    assert(TestingDocumentationGenerator ~= nil, "Documentation generator should be loadable")
    
    local report = TestingDocumentationGenerator.generateTestingDocumentation({})
    assert(report.executionReport ~= nil, "Execution report should be generated")
end)

return test