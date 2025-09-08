#!/usr/bin/env lua
--[[
Performance Test Runner
Runs the battle performance comparison test and reports results
--]]

-- Load the performance test
local BattlePerformanceComparison = require('battle-performance-comparison.test')

-- Run the performance comparison
print("Starting Battle Performance Comparison Test...")
print("=" .. string.rep("=", 60))

-- Initialize the test environment
local initSuccess, initMsg = BattlePerformanceComparison.init()
if not initSuccess then
    print("❌ Failed to initialize performance test: " .. (initMsg or "unknown error"))
    os.exit(1)
end

-- Run the full comparison
local results = BattlePerformanceComparison.runFullComparison()

-- Display final results
print("\n🏁 Performance Test Complete")
print("=" .. string.rep("=", 60))

if results and results.summary then
    if results.summary.passesRequirement then
        print("✅ OVERALL RESULT: PASS")
        print("The distributed battle architecture meets performance requirements.")
        
        if results.summary.recommendations then
            print("\n💡 Recommendations:")
            for _, rec in ipairs(results.summary.recommendations) do
                print("  • " .. rec)
            end
        end
    else
        print("❌ OVERALL RESULT: FAIL") 
        print("The distributed battle architecture has performance concerns.")
        
        if results.summary.recommendations then
            print("\n🔧 Recommendations:")
            for _, rec in ipairs(results.summary.recommendations) do
                print("  • " .. rec)
            end
        end
    end
    
    print("\n📈 Performance Overhead Summary:")
    print(string.format("  • Damage Calculation: %.1fx overhead", results.summary.overheadFactors.damageCalculation))
    print(string.format("  • Turn Processing: %.1fx overhead", results.summary.overheadFactors.turnProcessing))
    print(string.format("  • Concurrent Throughput: %.1fx performance", results.summary.overheadFactors.concurrentThroughput))
else
    print("❌ Performance test failed to complete properly")
    os.exit(1)
end

-- Save detailed results
local stats = BattlePerformanceComparison.getStatistics()
if stats then
    print("\n💾 Detailed statistics available via BattlePerformanceComparison.getStatistics()")
end

print("\n✅ Performance test completed successfully!")