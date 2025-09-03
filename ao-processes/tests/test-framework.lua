-- Test Framework Compatibility Module
-- Provides backwards compatibility for tests expecting 'tests.test-framework'
-- This module loads the enhanced test framework with a compatibility layer

local TestFrameworkEnhanced = require("framework.test-framework-enhanced")

-- Create compatibility layer for old test API
local TestFramework = {}

-- Core assertion functions for compatibility
function TestFramework.assertTrue(condition, message)
    if not condition then
        error(message or "Assertion failed: expected true")
    end
end

function TestFramework.assertFalse(condition, message)  
    if condition then
        error(message or "Assertion failed: expected false")
    end
end

function TestFramework.assertEqual(expected, actual, message)
    if expected ~= actual then
        error(message or ("Expected " .. tostring(expected) .. ", got " .. tostring(actual)))
    end
end

function TestFramework.assertNotEqual(expected, actual, message)
    if expected == actual then
        error(message or ("Expected not to equal " .. tostring(expected)))
    end
end

function TestFramework.assertNil(value, message)
    if value ~= nil then
        error(message or ("Expected nil, got " .. tostring(value)))
    end
end

function TestFramework.assertNotNil(value, message)
    if value == nil then
        error(message or "Expected non-nil value")
    end
end

function TestFramework.assertStringContains(str, substr, message)
    if type(str) ~= "string" then
        error(message or "First argument must be a string")
    end
    if not string.find(str, substr, 1, true) then
        error(message or ("String '" .. str .. "' does not contain '" .. substr .. "'"))
    end
end

-- Test suite execution function
function TestFramework.runTestSuite(suiteName, testObject, testMethods)
    print("🧪 Running Test Suite: " .. suiteName)
    print("=" .. string.rep("=", #suiteName + 22))
    
    local results = {
        totalTests = #testMethods,
        totalPassed = 0,
        totalFailed = 0,
        details = {}
    }
    
    local start_time = os.clock()
    
    -- Run setup if available
    if testObject.setUp then
        local success, error_msg = pcall(testObject.setUp)
        if not success then
            print("❌ Setup failed: " .. error_msg)
            results.setupFailed = true
        end
    end
    
    -- Run each test method
    for _, methodName in ipairs(testMethods) do
        local testFunc = testObject[methodName]
        if testFunc then
            local test_start = os.clock()
            local success, error_msg = pcall(testFunc)
            local test_duration = os.clock() - test_start
            
            if success then
                results.totalPassed = results.totalPassed + 1
                print("  ✅ " .. methodName .. " (" .. string.format("%.3fs", test_duration) .. ")")
            else
                results.totalFailed = results.totalFailed + 1
                print("  ❌ " .. methodName .. " - " .. tostring(error_msg))
                table.insert(results.details, {
                    testName = methodName,
                    error = error_msg,
                    passed = false
                })
            end
        else
            print("  ⚠️ " .. methodName .. " - Test method not found")
            results.totalFailed = results.totalFailed + 1
        end
    end
    
    -- Run teardown if available
    if testObject.tearDown then
        local success, error_msg = pcall(testObject.tearDown)
        if not success then
            print("❌ Teardown failed: " .. error_msg)
        end
    end
    
    local total_time = os.clock() - start_time
    results.executionTime = total_time * 1000 -- Convert to milliseconds
    
    print("")
    print("📊 Test Results:")
    print(string.format("   Tests: %d/%d passed", results.totalPassed, results.totalTests))
    print(string.format("   Time: %.3fs", total_time))
    
    if results.totalPassed == results.totalTests then
        print("✅ All tests passed!")
    else
        print(string.format("❌ %d tests failed", results.totalFailed))
    end
    
    return results
end

-- Add enhanced framework methods for advanced usage
TestFramework.createTestSuite = TestFrameworkEnhanced.createTestSuite
TestFramework.addTestToSuite = TestFrameworkEnhanced.addTestToSuite
TestFramework.executeTestSuite = TestFrameworkEnhanced.executeTestSuite
TestFramework.Assert = TestFrameworkEnhanced.Assert

return TestFramework