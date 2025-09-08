--[[
Unit Tests for Architecture Comparison System
Tests automated comparison between monolithic and distributed architectures
--]]

-- Test framework setup
package.path = package.path .. ";../../../?.lua"
local TestFramework = require("tests.test-framework")
local ArchitectureComparisonSystem = require("tests.regression.architecture-comparison-system")

local suite = TestFramework.createTestSuite("ArchitectureComparisonSystem")

-- Test initialization
suite("should initialize comparison system with default configuration", function(assert)
    local result = ArchitectureComparisonSystem.initializeComparison({})
    
    assert(result.success == true, "Should initialize successfully")
    assert(result.distributedEnabled == true, "Should enable distributed by default")
    assert(result.scenarioCount > 0, "Should have comparison scenarios")
end)

suite("should initialize comparison system with custom configuration", function(assert)
    local config = {
        monolithic = { enabled = true, processId = "mono-test-001" },
        distributed = { 
            enabled = true,
            processes = {
                coordinator = "coord-001",
                battle = "battle-001"
            }
        }
    }
    
    local result = ArchitectureComparisonSystem.initializeComparison(config)
    
    assert(result.success == true, "Should initialize successfully")
    assert(result.monolithicEnabled == true, "Should enable monolithic architecture")
    assert(result.distributedEnabled == true, "Should enable distributed architecture")
end)

-- Test scenario execution
suite("should execute single scenario comparison", function(assert)
    ArchitectureComparisonSystem.initializeComparison({ 
        distributed = { enabled = true }
    })
    
    local scenario = {
        name = "Test Battle Scenario",
        category = "BATTLE_ENGINE",
        epic32Story = "32.3",
        distributedTest = function()
            return {
                output = { battleResult = "victory", turnsCompleted = 5 },
                performanceMetrics = { responseTime = 120, throughput = 8.3 }
            }
        end
    }
    
    local result = ArchitectureComparisonSystem.executeScenarioComparison(scenario)
    
    assert(result.scenarioName == "Test Battle Scenario", "Should have correct scenario name")
    assert(result.category == "BATTLE_ENGINE", "Should have correct category")
    assert(result.epic32Story == "32.3", "Should reference correct Epic 32 story")
    assert(result.distributedResult ~= nil, "Should have distributed result")
    assert(result.executionTime > 0, "Should track execution time")
end)

suite("should execute full comparison suite", function(assert)
    ArchitectureComparisonSystem.initializeComparison({
        distributed = { enabled = true }
    })
    
    local results = ArchitectureComparisonSystem.executeComparisonSuite()
    
    assert(results.totalScenarios > 0, "Should have executed scenarios")
    assert(results.executedScenarios == results.totalScenarios, "Should execute all scenarios")
    assert(results.startTime > 0, "Should track start time")
    assert(results.endTime >= results.startTime, "Should track end time")
    assert(type(results.scenarioResults) == "table", "Should have scenario results")
end)

-- Test architecture-specific executions
suite("should execute battle test for distributed architecture", function(assert)
    local testData = {
        battleType = "single",
        pokemonA = { species = 1, level = 50 },
        pokemonB = { species = 4, level = 50 },
        moves = { { moveId = 1 }, { moveId = 7 } },
        rngSeed = "test-seed-001"
    }
    
    local result = ArchitectureComparisonSystem.executeBattleTestDistributed(testData)
    
    assert(result.output ~= nil, "Should have battle output")
    assert(result.output.battleResult ~= nil, "Should have battle result")
    assert(result.output.winner ~= nil, "Should have winner")
    assert(result.performanceMetrics ~= nil, "Should have performance metrics")
    assert(result.performanceMetrics.responseTime > 0, "Should track response time")
end)

suite("should execute Pokemon test for distributed architecture", function(assert)
    local testData = {
        operation = "stat_calculation",
        pokemon = { species = 25, level = 50, ivs = { hp = 31, attack = 31 } },
        nature = 1
    }
    
    local result = ArchitectureComparisonSystem.executePokemonTestDistributed(testData)
    
    assert(result.output ~= nil, "Should have Pokemon output")
    assert(result.output.calculatedStats ~= nil, "Should have calculated stats")
    assert(result.output.calculatedStats.hp > 0, "Should calculate HP stat")
    assert(result.output.calculatedStats.attack > 0, "Should calculate attack stat")
    assert(result.performanceMetrics ~= nil, "Should have performance metrics")
end)

suite("should execute shop test for distributed architecture", function(assert)
    local testData = {
        operation = "purchase",
        playerId = "test-player-001",
        itemId = 1,
        quantity = 5
    }
    
    local result = ArchitectureComparisonSystem.executeShopTestDistributed(testData)
    
    assert(result.output ~= nil, "Should have shop output")
    assert(result.output.transactionId ~= nil, "Should have transaction ID")
    assert(result.output.success == true, "Should have successful transaction")
    assert(result.output.playerBalance ~= nil, "Should track player balance")
    assert(result.output.itemsReceived == 5, "Should receive correct item quantity")
end)

suite("should execute security test for distributed architecture", function(assert)
    local testData = {
        operation = "anti_cheat_validation",
        playerId = "test-player-001",
        battleData = { duration = 120, moves = 15 }
    }
    
    local result = ArchitectureComparisonSystem.executeSecurityTestDistributed(testData)
    
    assert(result.output ~= nil, "Should have security output")
    assert(result.output.validationResult ~= nil, "Should have validation result")
    assert(result.output.riskScore ~= nil, "Should calculate risk score")
    assert(type(result.output.flags) == "table", "Should have security flags")
end)

-- Test detailed comparison functionality
suite("should perform detailed comparison between architectures", function(assert)
    local monolithicResult = {
        output = { battleResult = "victory", damage = 150 },
        performanceMetrics = { responseTime = 100, throughput = 10, memoryUsage = 1024 }
    }
    
    local distributedResult = {
        output = { battleResult = "victory", damage = 150 },
        performanceMetrics = { responseTime = 110, throughput = 9, memoryUsage = 900 }
    }
    
    local comparison = ArchitectureComparisonSystem.performDetailedComparison(
        monolithicResult, distributedResult
    )
    
    assert(comparison.passed == true, "Should pass with matching outputs")
    assert(comparison.performanceComparison ~= nil, "Should have performance comparison")
    assert(comparison.performanceComparison.responseTimeDelta == 10, "Should calculate response time delta")
    assert(comparison.performanceComparison.throughputDelta < 0, "Should detect throughput decrease")
    assert(comparison.performanceComparison.memoryUsageDelta < 0, "Should detect memory improvement")
end)

suite("should detect functional output differences", function(assert)
    local output1 = {
        battleResult = "victory",
        playerStats = { hp = 45, experience = 150 },
        items = { pokeball = 5, potion = 3 }
    }
    
    local output2 = {
        battleResult = "victory",
        playerStats = { hp = 40, experience = 150 }, -- Different HP
        items = { pokeball = 5, potion = 3 }
    }
    
    local comparison = ArchitectureComparisonSystem.compareFunctionalOutput(output1, output2)
    
    assert(comparison.match == false, "Should detect functional differences")
    assert(#comparison.differences > 0, "Should list specific differences")
end)

suite("should handle deep nested object comparison", function(assert)
    local output1 = {
        battle = {
            turns = {
                { player = "A", move = "tackle", damage = 25 },
                { player = "B", move = "growl", damage = 0 }
            }
        }
    }
    
    local output2 = {
        battle = {
            turns = {
                { player = "A", move = "tackle", damage = 25 },
                { player = "B", move = "growl", damage = 0 }
            }
        }
    }
    
    local comparison = ArchitectureComparisonSystem.compareFunctionalOutput(output1, output2)
    
    assert(comparison.match == true, "Should match identical nested structures")
    assert(#comparison.differences == 0, "Should have no differences")
end)

-- Test performance metrics comparison
suite("should accurately calculate performance deltas", function(assert)
    local monMetrics = { responseTime = 100, throughput = 20, memoryUsage = 1000 }
    local distMetrics = { responseTime = 150, throughput = 15, memoryUsage = 800 }
    
    -- Mock the detailed comparison
    local monolithicResult = { performanceMetrics = monMetrics }
    local distributedResult = { performanceMetrics = distMetrics }
    
    local comparison = ArchitectureComparisonSystem.performDetailedComparison(
        monolithicResult, distributedResult
    )
    
    local perfComp = comparison.performanceComparison
    
    assert(perfComp.responseTimeDelta == 50, "Should calculate 50% response time increase")
    assert(perfComp.throughputDelta == -25, "Should calculate 25% throughput decrease")  
    assert(perfComp.memoryUsageDelta == -20, "Should calculate 20% memory usage decrease")
end)

-- Test error handling
suite("should handle architecture test failures gracefully", function(assert)
    local scenario = {
        name = "Failing Test Scenario",
        category = "ERROR_TEST",
        distributedTest = function()
            error("Simulated test failure")
        end
    }
    
    local result = ArchitectureComparisonSystem.executeScenarioComparison(scenario)
    
    assert(result.scenarioName == "Failing Test Scenario", "Should have scenario name")
    assert(result.distributedResult ~= nil, "Should have distributed result")
    assert(result.distributedResult.error ~= nil, "Should capture error")
    assert(result.comparisonPassed == false, "Should not pass comparison")
end)

-- Test numerical precision handling
suite("should handle floating point precision in comparisons", function(assert)
    local output1 = { stat = 120.0001 }
    local output2 = { stat = 120.0002 }
    
    local comparison = ArchitectureComparisonSystem.compareFunctionalOutput(output1, output2)
    
    -- With default tolerance (0.001), this should match
    assert(comparison.match == true, "Should match within precision tolerance")
end)

suite("should detect differences outside precision tolerance", function(assert)
    local output1 = { stat = 120.001 }
    local output2 = { stat = 120.002 }
    
    local comparison = ArchitectureComparisonSystem.compareFunctionalOutput(output1, output2)
    
    -- This should not match due to exceeding tolerance
    assert(comparison.match == false, "Should not match outside precision tolerance")
    assert(#comparison.differences > 0, "Should report precision differences")
end)

-- Run the test suite
return suite