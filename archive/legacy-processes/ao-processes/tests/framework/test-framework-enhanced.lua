-- Enhanced Custom Lua Test Framework
-- Extended framework for comprehensive AO handler testing with advanced features

local TestFramework = {}
TestFramework.__index = TestFramework

-- Test result tracking
TestFramework.TestResult = {
    PASSED = "PASSED",
    FAILED = "FAILED",
    SKIPPED = "SKIPPED",
    ERROR = "ERROR"
}

-- Test execution context
function TestFramework.new(options)
    local framework = setmetatable({}, TestFramework)
    
    framework.options = options or {}
    framework.testSuites = {}
    framework.results = {
        total = 0,
        passed = 0,
        failed = 0,
        skipped = 0,
        errors = 0,
        details = {}
    }
    framework.mocks = {}
    framework.fixtures = {}
    framework.hooks = {
        beforeAll = {},
        afterAll = {},
        beforeEach = {},
        afterEach = {}
    }
    
    return framework
end

-- Test Suite Registration
function TestFramework:addTestSuite(name, suiteConfig)
    local suite = {
        name = name,
        tests = {},
        beforeAll = suiteConfig.beforeAll,
        afterAll = suiteConfig.afterAll,
        beforeEach = suiteConfig.beforeEach,
        afterEach = suiteConfig.afterEach,
        skip = suiteConfig.skip or false,
        timeout = suiteConfig.timeout or 5000, -- 5 second default
        tags = suiteConfig.tags or {}
    }
    
    self.testSuites[name] = suite
    return suite
end

-- Test Case Registration
function TestFramework:addTest(suiteName, testName, testFunc, testConfig)
    testConfig = testConfig or {}
    
    local suite = self.testSuites[suiteName]
    if not suite then
        error("Test suite '" .. suiteName .. "' not found")
    end
    
    local test = {
        name = testName,
        func = testFunc,
        skip = testConfig.skip or false,
        timeout = testConfig.timeout or suite.timeout,
        tags = testConfig.tags or {},
        expected = testConfig.expected,
        description = testConfig.description
    }
    
    table.insert(suite.tests, test)
    return test
end

-- Assertion Library
TestFramework.Assert = {}

function TestFramework.Assert.equals(expected, actual, message)
    message = message or ("Expected " .. tostring(expected) .. ", got " .. tostring(actual))
    if expected ~= actual then
        error("Assertion Failed: " .. message)
    end
end

function TestFramework.Assert.notEquals(expected, actual, message)
    message = message or ("Expected not to equal " .. tostring(expected))
    if expected == actual then
        error("Assertion Failed: " .. message)
    end
end

function TestFramework.Assert.isTrue(value, message)
    message = message or ("Expected true, got " .. tostring(value))
    if value ~= true then
        error("Assertion Failed: " .. message)
    end
end

function TestFramework.Assert.isFalse(value, message)
    message = message or ("Expected false, got " .. tostring(value))
    if value ~= false then
        error("Assertion Failed: " .. message)
    end
end

function TestFramework.Assert.isNil(value, message)
    message = message or ("Expected nil, got " .. tostring(value))
    if value ~= nil then
        error("Assertion Failed: " .. message)
    end
end

function TestFramework.Assert.isNotNil(value, message)
    message = message or ("Expected non-nil value")
    if value == nil then
        error("Assertion Failed: " .. message)
    end
end

function TestFramework.Assert.hasType(expected_type, value, message)
    local actual_type = type(value)
    message = message or ("Expected type " .. expected_type .. ", got " .. actual_type)
    if actual_type ~= expected_type then
        error("Assertion Failed: " .. message)
    end
end

function TestFramework.Assert.contains(collection, item, message)
    message = message or ("Collection should contain item")
    
    if type(collection) == "table" then
        for _, value in pairs(collection) do
            if value == item then
                return
            end
        end
        error("Assertion Failed: " .. message)
    else
        error("Assertion Failed: Collection must be a table")
    end
end

function TestFramework.Assert.hasLength(expected_length, collection, message)
    local actual_length = 0
    
    if type(collection) == "table" then
        for _ in pairs(collection) do
            actual_length = actual_length + 1
        end
    elseif type(collection) == "string" then
        actual_length = string.len(collection)
    else
        error("Assertion Failed: Collection must be table or string")
    end
    
    message = message or ("Expected length " .. expected_length .. ", got " .. actual_length)
    if actual_length ~= expected_length then
        error("Assertion Failed: " .. message)
    end
end

function TestFramework.Assert.throws(func, expected_error, message)
    message = message or ("Expected function to throw error")
    
    local success, error_msg = pcall(func)
    
    if success then
        error("Assertion Failed: " .. message .. " (function did not throw)")
    end
    
    if expected_error and not string.find(error_msg, expected_error) then
        error("Assertion Failed: Expected error containing '" .. expected_error .. "', got '" .. error_msg .. "'")
    end
end

-- Mock System
function TestFramework:createMock(name, mockConfig)
    local mock = {
        name = name,
        calls = {},
        returns = mockConfig.returns or {},
        implementation = mockConfig.implementation,
        callCount = 0
    }
    
    -- Create mock function
    mock.func = function(...)
        local args = {...}
        mock.callCount = mock.callCount + 1
        
        table.insert(mock.calls, {
            args = args,
            timestamp = os.time()
        })
        
        if mock.implementation then
            return mock.implementation(...)
        else
            local returnIndex = ((mock.callCount - 1) % #mock.returns) + 1
            return mock.returns[returnIndex]
        end
    end
    
    self.mocks[name] = mock
    return mock
end

function TestFramework:getMock(name)
    return self.mocks[name]
end

function TestFramework:resetMock(name)
    local mock = self.mocks[name]
    if mock then
        mock.calls = {}
        mock.callCount = 0
    end
end

function TestFramework:resetAllMocks()
    for name, _ in pairs(self.mocks) do
        self:resetMock(name)
    end
end

-- Fixture Management
function TestFramework:addFixture(name, fixtureFunc)
    self.fixtures[name] = fixtureFunc
end

function TestFramework:getFixture(name)
    local fixtureFunc = self.fixtures[name]
    if fixtureFunc then
        return fixtureFunc()
    end
    return nil
end

-- Test Coverage Tracking
function TestFramework:startCoverage()
    self.coverage = {
        files = {},
        functions = {},
        lines = {}
    }
end

function TestFramework:recordCoverage(file, functionName, lineNumber)
    if not self.coverage then return end
    
    self.coverage.files[file] = true
    if functionName then
        self.coverage.functions[functionName] = true
    end
    if lineNumber then
        self.coverage.lines[file .. ":" .. lineNumber] = true
    end
end

function TestFramework:getCoverageReport()
    if not self.coverage then
        return "Coverage tracking not enabled"
    end
    
    local fileCount = 0
    local functionCount = 0
    local lineCount = 0
    
    for _ in pairs(self.coverage.files) do
        fileCount = fileCount + 1
    end
    
    for _ in pairs(self.coverage.functions) do
        functionCount = functionCount + 1
    end
    
    for _ in pairs(self.coverage.lines) do
        lineCount = lineCount + 1
    end
    
    return {
        files = fileCount,
        functions = functionCount,
        lines = lineCount,
        details = self.coverage
    }
end

-- Test Execution
function TestFramework:runTest(suite, test)
    local startTime = os.time()
    local result = {
        suite = suite.name,
        test = test.name,
        status = TestFramework.TestResult.PASSED,
        duration = 0,
        message = nil,
        error = nil
    }
    
    -- Check if test should be skipped
    if test.skip or suite.skip then
        result.status = TestFramework.TestResult.SKIPPED
        result.message = "Test skipped"
        return result
    end
    
    -- Execute test with timeout and error handling
    local success, error_msg = pcall(function()
        -- Run beforeEach hooks
        if suite.beforeEach then
            suite.beforeEach()
        end
        
        -- Run the test
        local testResult = test.func()
        
        -- Check expected result if specified
        if test.expected ~= nil and testResult ~= test.expected then
            error("Test returned " .. tostring(testResult) .. ", expected " .. tostring(test.expected))
        end
        
        -- Run afterEach hooks
        if suite.afterEach then
            suite.afterEach()
        end
    end)
    
    result.duration = os.time() - startTime
    
    if not success then
        result.status = TestFramework.TestResult.FAILED
        result.error = error_msg
        result.message = "Test failed: " .. tostring(error_msg)
    end
    
    return result
end

function TestFramework:runTestSuite(suiteName, filter)
    filter = filter or {}
    
    local suite = self.testSuites[suiteName]
    if not suite then
        error("Test suite '" .. suiteName .. "' not found")
    end
    
    print("Running test suite: " .. suiteName)
    print(string.rep("-", 40))
    
    local suiteResults = {
        name = suiteName,
        total = 0,
        passed = 0,
        failed = 0,
        skipped = 0,
        tests = {}
    }
    
    -- Run beforeAll hook
    if suite.beforeAll then
        local success, err = pcall(suite.beforeAll)
        if not success then
            print("❌ Suite setup failed: " .. tostring(err))
            return suiteResults
        end
    end
    
    -- Run each test
    for _, test in ipairs(suite.tests) do
        -- Apply filters
        local shouldRun = true
        
        if filter.tags and #filter.tags > 0 then
            shouldRun = false
            for _, filterTag in ipairs(filter.tags) do
                for _, testTag in ipairs(test.tags) do
                    if filterTag == testTag then
                        shouldRun = true
                        break
                    end
                end
                if shouldRun then break end
            end
        end
        
        if shouldRun then
            local result = self:runTest(suite, test)
            
            suiteResults.total = suiteResults.total + 1
            suiteResults.tests[test.name] = result
            
            if result.status == TestFramework.TestResult.PASSED then
                suiteResults.passed = suiteResults.passed + 1
                print("  ✅ " .. test.name .. " (" .. result.duration .. "s)")
            elseif result.status == TestFramework.TestResult.FAILED then
                suiteResults.failed = suiteResults.failed + 1
                print("  ❌ " .. test.name .. " - " .. result.message)
            elseif result.status == TestFramework.TestResult.SKIPPED then
                suiteResults.skipped = suiteResults.skipped + 1
                print("  ⏭️  " .. test.name .. " - " .. result.message)
            end
        end
    end
    
    -- Run afterAll hook
    if suite.afterAll then
        pcall(suite.afterAll)
    end
    
    return suiteResults
end

function TestFramework:runAll(filter)
    print("🧪 Running Enhanced Test Framework")
    print("=================================")
    
    self:startCoverage()
    
    local allResults = {
        total = 0,
        passed = 0,
        failed = 0,
        skipped = 0,
        suites = {}
    }
    
    for suiteName, _ in pairs(self.testSuites) do
        local suiteResult = self:runTestSuite(suiteName, filter)
        
        allResults.total = allResults.total + suiteResult.total
        allResults.passed = allResults.passed + suiteResult.passed
        allResults.failed = allResults.failed + suiteResult.failed
        allResults.skipped = allResults.skipped + suiteResult.skipped
        allResults.suites[suiteName] = suiteResult
        
        print("")
    end
    
    -- Final summary
    print("📊 Test Summary")
    print("===============")
    print("Total: " .. allResults.total)
    print("Passed: " .. allResults.passed)
    print("Failed: " .. allResults.failed)
    print("Skipped: " .. allResults.skipped)
    
    if allResults.failed == 0 then
        print("")
        print("🎉 All tests passed!")
        return true, allResults
    else
        print("")
        print("❌ Some tests failed.")
        return false, allResults
    end
end

-- Static convenience functions for compatibility
function TestFramework.createTestSuite(name, config)
    config = config or {}  -- Ensure config is not nil
    local suite = {
        name = name,
        description = config.description or "",
        timeout = config.timeout or 10000,
        setup_timeout = config.setup_timeout or 5000,
        teardown_timeout = config.teardown_timeout or 5000,
        tests = {},
        setup = config.setup,
        teardown = config.teardown
    }
    return suite
end

function TestFramework.addTestToSuite(suite, testName, testFunc)
    if not suite then
        error("Suite is nil - make sure to create suite with createTestSuite first")
    end
    if not suite.tests then
        error("Suite.tests is nil - suite may not have been created properly")
    end
    table.insert(suite.tests, {
        name = testName,
        func = testFunc
    })
end

function TestFramework.assert(condition, message)
    if not condition then
        error(message or "Assertion failed")
    end
end

function TestFramework.executeTestSuite(suite)
    print("🧪 Running Test Suite: " .. suite.name)
    print("=" .. string.rep("=", #suite.name + 22))
    
    local results = {
        total_tests = 0,
        passed_tests = 0,
        failed_tests = 0,
        skipped_tests = 0,
        execution_time = 0,
        overall_success = true,
        pass_rate = 0,
        fail_rate = 0,
        failed_test_details = {}
    }
    
    local start_time = os.clock()
    
    -- Run setup if provided
    if suite.setup then
        local success, error_msg = pcall(suite.setup)
        if not success then
            print("❌ Setup failed: " .. error_msg)
            results.overall_success = false
        end
    end
    
    -- Run tests
    for _, test in ipairs(suite.tests) do
        results.total_tests = results.total_tests + 1
        
        local test_start = os.clock()
        local success, error_msg = pcall(test.func)
        local test_duration = os.clock() - test_start
        
        if success then
            results.passed_tests = results.passed_tests + 1
            print("  ✅ " .. test.name .. " (" .. string.format("%.3fs", test_duration) .. ")")
        else
            results.failed_tests = results.failed_tests + 1
            results.overall_success = false
            print("  ❌ " .. test.name .. " - " .. error_msg)
            table.insert(results.failed_test_details, {
                test_name = test.name,
                error_message = error_msg
            })
        end
    end
    
    -- Run teardown if provided
    if suite.teardown then
        local success, error_msg = pcall(suite.teardown)
        if not success then
            print("❌ Teardown failed: " .. error_msg)
        end
    end
    
    local total_time = os.clock() - start_time
    results.execution_time = total_time * 1000 -- Convert to milliseconds
    
    if results.total_tests > 0 then
        results.pass_rate = results.passed_tests / results.total_tests
        results.fail_rate = results.failed_tests / results.total_tests
    end
    
    return results
end

-- TestSuite compatibility layer for existing tests
TestFramework.TestSuite = {}
TestFramework.TestSuite.__index = TestFramework.TestSuite

function TestFramework.TestSuite:new(name, config)
    local suite = setmetatable({}, TestFramework.TestSuite)
    suite.name = name or "Unnamed Test Suite"
    suite.description = (config and config.description) or ""
    suite.timeout = (config and config.timeout) or 10000
    suite.tests = {}
    suite._setUp = nil
    suite._tearDown = nil
    return suite
end

function TestFramework.TestSuite:addTest(testName, testFunc)
    table.insert(self.tests, {
        name = testName,
        func = testFunc
    })
end

function TestFramework.TestSuite:setSetUp(setupFunc)
    self._setUp = setupFunc
end

function TestFramework.TestSuite:setTearDown(tearDownFunc)
    self._tearDown = tearDownFunc
end

function TestFramework.TestSuite:run()
    local results = {
        totalTests = #self.tests,
        totalPassed = 0,
        totalFailed = 0,
        details = {}
    }
    
    print("🧪 Running Test Suite: " .. self.name)
    print("=" .. string.rep("=", #self.name + 22))
    
    local start_time = os.clock()
    
    -- Run setup if provided
    if self._setUp then
        local success, error_msg = pcall(self._setUp)
        if not success then
            print("❌ Setup failed: " .. error_msg)
            results.setupFailed = true
        end
    end
    
    -- Run tests
    for _, test in ipairs(self.tests) do
        local test_start = os.clock()
        local success, error_msg = pcall(test.func)
        local test_duration = os.clock() - test_start
        
        if success then
            results.totalPassed = results.totalPassed + 1
            print("  ✅ " .. test.name .. " (" .. string.format("%.3fs", test_duration) .. ")")
        else
            results.totalFailed = results.totalFailed + 1
            print("  ❌ " .. test.name .. " - " .. tostring(error_msg))
            table.insert(results.details, {
                testName = test.name,
                error = error_msg,
                passed = false
            })
        end
    end
    
    -- Run teardown if provided  
    if self._tearDown then
        local success, error_msg = pcall(self._tearDown)
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

return TestFramework