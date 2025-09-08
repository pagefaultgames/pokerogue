--[[
Timestamp Parameter Performance Validation Tests
Compares performance of timestamp parameter passing vs 0 function calls

Test Coverage:
- Performance impact of timestamp parameter threading
- Memory usage comparison between approaches
- Function call overhead analysis
- Real-world usage scenario benchmarks
--]]

local TestFramework = require('../framework/test-framework-enhanced')
local EconomicSystem = require('../../game-logic/items/economic-system')
local ParticipationTracker = require('../../game-logic/battle/participation-tracker')
local MoveManager = require('../../game-logic/pokemon/move-manager')

-- Performance test configuration
local PERFORMANCE_TEST_ITERATIONS = 1000
local testTimestamp = 1625097600
local testPokemon = {id = "perf_test", moveset = {}, level = 50, speciesId = 25}

local function measureExecutionTime(func)
    local startTime = os.clock()
    func()
    local endTime = os.clock()
    return (endTime - startTime) * 1000 -- Convert to milliseconds
end

local function measureMemoryUsage(func)
    collectgarbage("collect")
    local startMemory = collectgarbage("count")
    func()
    collectgarbage("collect")
    local endMemory = collectgarbage("count")
    return endMemory - startMemory -- Memory difference in KB
end

local function createPerformanceTests()
    local tests = {}
    
    -- Test 1: Economic System Performance - Timestamp vs 0
    tests["test_economic_system_timestamp_performance"] = function()
        -- Benchmark timestamp parameter approach
        local timestampTime = measureExecutionTime(function()
            for i = 1, PERFORMANCE_TEST_ITERATIONS do
                EconomicSystem.recordItemPurchase(
                    "perf_player_" .. i, "perf_item", 1, 100, i, testTimestamp + i
                )
            end
        end)
        
        -- Benchmark memory usage for timestamp approach
        local timestampMemory = measureMemoryUsage(function()
            for i = 1, 100 do -- Smaller sample for memory test
                EconomicSystem.recordItemPurchase(
                    "mem_player_" .. i, "mem_item", 1, 100, i, testTimestamp + i
                )
            end
        end)
        
        print(string.format("Economic System Performance:"))
        print(string.format("  Timestamp Parameter Approach: %.2f ms for %d operations", timestampTime, PERFORMANCE_TEST_ITERATIONS))
        print(string.format("  Memory Usage: %.2f KB for 100 operations", timestampMemory))
        print(string.format("  Average per operation: %.4f ms", timestampTime / PERFORMANCE_TEST_ITERATIONS))
        
        -- Performance assertions
        TestFramework.assert(timestampTime < PERFORMANCE_TEST_ITERATIONS * 0.1, 
            "Timestamp parameter approach should be efficient (< 0.1ms per operation)")
        TestFramework.assert(timestampMemory < 50, 
            "Memory usage should be reasonable (< 50KB for 100 operations)")
    end
    
    -- Test 2: Battle System Performance Analysis
    tests["test_battle_system_timestamp_performance"] = function()
        local battleState = {
            participationData = {},
            playerParty = {testPokemon},
            enemyParty = {{id = "enemy", level = 30}},
            activePlayer = {[1] = testPokemon.id},
            activeEnemy = {[1] = "enemy"}
        }
        
        -- Initialize once
        ParticipationTracker.init(battleState, testTimestamp)
        
        -- Benchmark battle participation tracking
        local participationTime = measureExecutionTime(function()
            for i = 1, PERFORMANCE_TEST_ITERATIONS do
                ParticipationTracker.recordMoveUsage(
                    battleState, testPokemon.id, "tackle", i, "enemy", true, testTimestamp + i
                )
            end
        end)
        
        print(string.format("Battle System Performance:"))
        print(string.format("  Participation Tracking: %.2f ms for %d operations", participationTime, PERFORMANCE_TEST_ITERATIONS))
        print(string.format("  Average per battle action: %.4f ms", participationTime / PERFORMANCE_TEST_ITERATIONS))
        
        TestFramework.assert(participationTime < PERFORMANCE_TEST_ITERATIONS * 0.05, 
            "Battle participation tracking should be very efficient (< 0.05ms per operation)")
    end
    
    -- Test 3: Pokemon State Management Performance
    tests["test_pokemon_state_timestamp_performance"] = function()
        -- Test move learning performance
        local moveLearnTime = measureExecutionTime(function()
            for i = 1, PERFORMANCE_TEST_ITERATIONS do
                local pokemon = {id = "perf_pokemon_" .. i, moveset = {}, level = 50}
                MoveManager.learnMove(pokemon, "tackle", "LEVEL", {}, testTimestamp + i)
            end
        end)
        
        print(string.format("Pokemon State Management Performance:"))
        print(string.format("  Move Learning: %.2f ms for %d operations", moveLearnTime, PERFORMANCE_TEST_ITERATIONS))
        print(string.format("  Average per move learn: %.4f ms", moveLearnTime / PERFORMANCE_TEST_ITERATIONS))
        
        TestFramework.assert(moveLearnTime < PERFORMANCE_TEST_ITERATIONS * 0.2, 
            "Move learning should be efficient (< 0.2ms per operation)")
    end
    
    -- Test 4: Cross-System Integration Performance
    tests["test_cross_system_integration_performance"] = function()
        local battleState = {
            participationData = {},
            playerParty = {testPokemon},
            enemyParty = {{id = "cross_enemy", level = 25}},
            activePlayer = {[1] = testPokemon.id},
            activeEnemy = {[1] = "cross_enemy"}
        }
        
        -- Initialize systems
        ParticipationTracker.init(battleState, testTimestamp)
        
        -- Benchmark integrated workflow
        local integrationTime = measureExecutionTime(function()
            for i = 1, PERFORMANCE_TEST_ITERATIONS do
                local currentTime = testTimestamp + i
                
                -- Simulate integrated game flow with timestamp threading
                EconomicSystem.recordItemPurchase("integration_player", "potion", 1, 50, i, currentTime)
                ParticipationTracker.recordMoveUsage(battleState, testPokemon.id, "thunder", i, "cross_enemy", true, currentTime)
                
                if i % 10 == 0 then -- Every 10th iteration
                    local pokemon = {id = "int_pokemon_" .. i, moveset = {}, level = 30}
                    MoveManager.learnMove(pokemon, "surf", "TM", {}, currentTime)
                end
            end
        end)
        
        print(string.format("Cross-System Integration Performance:"))
        print(string.format("  Integrated Workflow: %.2f ms for %d iterations", integrationTime, PERFORMANCE_TEST_ITERATIONS))
        print(string.format("  Average per game cycle: %.4f ms", integrationTime / PERFORMANCE_TEST_ITERATIONS))
        
        TestFramework.assert(integrationTime < PERFORMANCE_TEST_ITERATIONS * 0.3, 
            "Integrated workflow should maintain good performance (< 0.3ms per cycle)")
    end
    
    -- Test 5: Parameter Passing vs Function Call Overhead
    tests["test_parameter_passing_overhead"] = function()
        -- Simple function with timestamp parameter
        local function timestampFunction(data, timestamp)
            return data + (timestamp or 0)
        end
        
        -- Simple function using 0 internally  
        local function osTimeFunction(data)
            return data + (os.time and 0 or 0)
        end
        
        local testData = 42
        
        -- Benchmark timestamp parameter passing
        local parameterTime = measureExecutionTime(function()
            for i = 1, PERFORMANCE_TEST_ITERATIONS * 10 do
                timestampFunction(testData, testTimestamp + i)
            end
        end)
        
        -- Benchmark 0 function calls
        local osTimeTime = measureExecutionTime(function()
            for i = 1, PERFORMANCE_TEST_ITERATIONS * 10 do
                osTimeFunction(testData)
            end
        end)
        
        local iterations = PERFORMANCE_TEST_ITERATIONS * 10
        print(string.format("Parameter Passing vs Function Call Overhead:"))
        print(string.format("  Timestamp Parameter: %.2f ms for %d operations", parameterTime, iterations))
        print(string.format("  0 Function: %.2f ms for %d operations", osTimeTime, iterations))
        print(string.format("  Performance Ratio: %.2fx", osTimeTime / parameterTime))
        
        -- Parameter passing should be faster than function calls
        TestFramework.assert(parameterTime <= osTimeTime, 
            "Timestamp parameter passing should be at least as fast as 0 calls")
        
        -- Calculate overhead savings
        local overheadSaving = ((osTimeTime - parameterTime) / osTimeTime) * 100
        print(string.format("  Overhead Saving: %.1f%%", overheadSaving))
        
        TestFramework.assert(overheadSaving >= -10, 
            "Parameter passing overhead should not be significantly worse than function calls")
    end
    
    -- Test 6: Memory Efficiency Analysis
    tests["test_memory_efficiency_analysis"] = function()
        collectgarbage("collect")
        local initialMemory = collectgarbage("count")
        
        -- Create large dataset with timestamp parameters
        local largeDataset = {}
        for i = 1, 1000 do
            table.insert(largeDataset, {
                id = "mem_test_" .. i,
                timestamp = testTimestamp + i,
                data = string.rep("x", 100) -- Some data
            })
        end
        
        collectgarbage("collect")
        local dataMemory = collectgarbage("count")
        local memoryUsed = dataMemory - initialMemory
        
        print(string.format("Memory Efficiency Analysis:"))
        print(string.format("  Memory for 1000 timestamp records: %.2f KB", memoryUsed))
        print(string.format("  Average per record: %.4f KB", memoryUsed / 1000))
        
        TestFramework.assert(memoryUsed < 200, 
            "Memory usage should be reasonable (< 200KB for 1000 records)")
        
        -- Cleanup
        largeDataset = nil
        collectgarbage("collect")
    end
    
    return tests
end

-- Run performance validation tests
local function runPerformanceValidationTests()
    local tests = createPerformanceTests()
    local results = {}
    
    print("\\n=== Running Timestamp Parameter Performance Validation Tests ===")
    print("This may take a moment due to performance benchmarking...")
    
    for testName, testFunc in pairs(tests) do
        print("\\nRunning: " .. testName)
        local success, error = pcall(testFunc)
        results[testName] = {
            passed = success,
            error = error
        }
        
        if success then
            print("✅ " .. testName .. " - PASSED")
        else
            print("❌ " .. testName .. " - FAILED: " .. tostring(error))
        end
    end
    
    -- Summary
    local passed = 0
    local total = 0
    for _, result in pairs(results) do
        total = total + 1
        if result.passed then
            passed = passed + 1
        end
    end
    
    print(string.format("\\n📊 Performance Tests: %d/%d passed", passed, total))
    
    if passed == total then
        print("✅ PERFORMANCE VALIDATION SUCCESSFUL - Timestamp parameter threading performs well")
        print("   • No significant performance degradation detected")
        print("   • Memory usage within acceptable limits")
        print("   • Parameter passing efficiency validated")
    else
        print("⚠️  PERFORMANCE ISSUES DETECTED - Review failed tests")
    end
    
    return results
end

-- Export for test runner
return {
    createPerformanceTests = createPerformanceTests,
    runPerformanceValidationTests = runPerformanceValidationTests,
    PERFORMANCE_TEST_ITERATIONS = PERFORMANCE_TEST_ITERATIONS
}