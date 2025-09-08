-- Comprehensive Test Runner for AO Process Architecture
-- Runs all unit and integration tests

local function runTestFile(testFile, testType)
    print("Running " .. testType .. " test: " .. testFile)
    print(string.rep("-", 50))
    
    local success, result = pcall(function()
        return dofile(testFile)
    end)
    
    if not success then
        print("❌ Test file failed to execute: " .. tostring(result))
        return false
    elseif result == false then
        print("❌ Test file completed with failures")
        return false
    else
        print("✅ Test file completed successfully")
        return true
    end
end

local function main()
    print("🚀 AO Process Architecture Test Suite")
    print("=====================================")
    print("")
    
    local testResults = {
        total = 0,
        passed = 0,
        failed = 0
    }
    
    -- Unit Tests
    local unitTests = {
        "ao-processes/tests/unit/main.test.lua",
        "ao-processes/tests/unit/handler-framework.test.lua", 
        "ao-processes/tests/unit/admin-handler.test.lua",
        "ao-processes/tests/unit/error-handling.test.lua"
    }
    
    print("📋 Running Unit Tests")
    print("====================")
    
    for _, testFile in ipairs(unitTests) do
        testResults.total = testResults.total + 1
        if runTestFile(testFile, "unit") then
            testResults.passed = testResults.passed + 1
        else
            testResults.failed = testResults.failed + 1
        end
        print("")
    end
    
    -- Integration Tests
    local integrationTests = {
        "ao-processes/tests/integration/process-deployment.test.lua"
    }
    
    print("🔗 Running Integration Tests")
    print("============================")
    
    for _, testFile in ipairs(integrationTests) do
        testResults.total = testResults.total + 1
        if runTestFile(testFile, "integration") then
            testResults.passed = testResults.passed + 1
        else
            testResults.failed = testResults.failed + 1
        end
        print("")
    end
    
    -- Test Summary
    print("📊 Test Summary")
    print("===============")
    print("Total Tests: " .. testResults.total)
    print("Passed: " .. testResults.passed)
    print("Failed: " .. testResults.failed)
    
    if testResults.failed == 0 then
        print("")
        print("🎉 All tests passed! AO Process Architecture is ready for deployment.")
        return true
    else
        print("")
        print("❌ Some tests failed. Please review the output above.")
        return false
    end
end

-- Run the test suite
return main()