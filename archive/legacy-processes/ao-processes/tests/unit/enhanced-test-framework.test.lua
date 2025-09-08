-- Unit Tests for Enhanced Test Framework Components
-- Tests all new framework components for Task 2

-- Load shared test helpers with path resolution
local TestHelpers = nil
local testHelpersPaths = {
    "../test-helpers.lua",           -- Local development path (from unit/ to tests/)
    "../../test-helpers.lua",        -- Alternative path  
    "./ao-processes/tests/test-helpers.lua", -- GitHub Actions path
    "./test-helpers.lua",            -- Same directory (if run from tests/)
}

for _, path in ipairs(testHelpersPaths) do
    local file = io.open(path, "r")
    if file then
        file:close()
        TestHelpers = dofile(path)
        break
    end
end

if not TestHelpers then
    error("Could not load test-helpers.lua. Tried paths: " .. table.concat(testHelpersPaths, ", "))
end

TestHelpers.setupPackagePath()

-- Load test framework using safe require
local TestFramework = TestHelpers.safeRequire("ao-processes/tests/framework/test-framework-enhanced")
local MockSystems = TestHelpers.safeRequire("ao-processes/tests/framework/mock-systems") 
local HandlerTestUtils = TestHelpers.safeRequire("ao-processes/tests/framework/handler-test-utilities")

local CoverageReporter = TestHelpers.safeRequire("ao-processes/tests/framework/coverage-reporter")

-- Test framework setup
local function assertEquals(expected, actual, message)
    message = message or "Assertion failed"
    if expected ~= actual then
        error(message .. ": expected " .. tostring(expected) .. ", got " .. tostring(actual))
    end
end

local function assertNotNil(value, message)
    message = message or "Value should not be nil"
    if value == nil then
        error(message)
    end
end

local function assertTrue(condition, message)
    message = message or "Condition should be true"
    if not condition then
        error(message)
    end
end

-- Enhanced Test Framework Tests
local function testTestFrameworkCreation()
    print("Testing Enhanced Test Framework creation...")
    
    local framework = TestFramework.new()
    
    assertNotNil(framework, "Framework should be created")
    assertNotNil(framework.testSuites, "Test suites should be initialized")
    assertNotNil(framework.results, "Results should be initialized")
    assertNotNil(framework.mocks, "Mocks should be initialized")
    
    assertEquals("table", type(framework.testSuites), "Test suites should be table")
    assertEquals("table", type(framework.results), "Results should be table")
    assertEquals(0, framework.results.total, "Initial total should be 0")
    
    print("✅ Enhanced Test Framework creation test passed")
    return true
end

local function testTestSuiteRegistration()
    print("Testing test suite registration...")
    
    local framework = TestFramework.new()
    
    local suite = framework:addTestSuite("TestSuite1", {
        timeout = 3000,
        tags = {"unit", "core"}
    })
    
    assertNotNil(suite, "Suite should be returned")
    assertEquals("TestSuite1", suite.name, "Suite name should be set")
    assertEquals(3000, suite.timeout, "Suite timeout should be set")
    assertNotNil(framework.testSuites["TestSuite1"], "Suite should be registered")
    
    print("✅ Test suite registration test passed")
    return true
end

local function testAssertionLibrary()
    print("Testing assertion library...")
    
    local Assert = TestFramework.Assert
    
    -- Test equals assertion
    Assert.equals(5, 5, "Numbers should be equal")
    
    -- Test type assertions
    Assert.hasType("string", "test", "Should be string type")
    Assert.hasType("number", 42, "Should be number type")
    Assert.hasType("table", {}, "Should be table type")
    
    -- Test boolean assertions
    Assert.isTrue(true, "Should be true")
    Assert.isFalse(false, "Should be false")
    
    -- Test nil assertions
    Assert.isNil(nil, "Should be nil")
    Assert.isNotNil("test", "Should not be nil")
    
    -- Test contains assertion
    Assert.contains({"a", "b", "c"}, "b", "Should contain element")
    
    -- Test length assertion
    Assert.hasLength(3, {"a", "b", "c"}, "Should have length 3")
    Assert.hasLength(4, "test", "String should have length 4")
    
    print("✅ Assertion library test passed")
    return true
end

local function testMockSystems()
    print("Testing mock systems...")
    
    local mocks = MockSystems.new()
    
    -- Test RNG mocking
    local rngMock = mocks:mockRNG({
        seed = 12345,
        deterministicMode = true
    })
    
    assertNotNil(rngMock, "RNG mock should be created")
    assertEquals(12345, rngMock.seed, "RNG seed should be set")
    
    -- Test math.random is mocked
    local random1 = math.random(1, 10)
    local random2 = math.random(1, 10)
    
    assertTrue(random1 >= 1 and random1 <= 10, "Random should be in range")
    assertTrue(random2 >= 1 and random2 <= 10, "Random should be in range")
    
    -- Test call history
    local history = mocks:getCallHistory("math.random")
    assertTrue(#history >= 2, "Should have recorded random calls")
    
    -- Test database mocking
    local dbMock = mocks:mockDatabase({
        initialData = {
            pokemon = {{id = 1, name = "Pikachu"}}
        }
    })
    
    assertNotNil(dbMock, "Database mock should be created")
    
    local result = Database.query("SELECT * FROM pokemon")
    assertEquals(1, #result, "Should return mock data")
    assertEquals("Pikachu", result[1].name, "Should return correct mock data")
    
    print("✅ Mock systems test passed")
    return true
end

local function testHandlerTestUtilities()
    print("Testing handler test utilities...")
    
    -- Create simplified mock systems for testing
    local mockEmulator = {
        processId = "test-handler-utils",
        send = function(msg) return {success = true} end
    }
    
    local mocks = MockSystems.new()
    local utils = HandlerTestUtils.new(mockEmulator, mocks)
    
    assertNotNil(utils, "Handler test utils should be created")
    assertNotNil(utils.emulator, "Utils should have emulator")
    assertNotNil(utils.mocks, "Utils should have mock systems")
    
    -- Test message template creation
    local authMessage = utils:createTestMessage("auth", {
        From = "custom-wallet"
    })
    
    assertEquals("custom-wallet", authMessage.From, "Custom From should be set")
    assertEquals("Auth-Request", authMessage.Action, "Action should be from template")
    assertNotNil(authMessage.Tags, "Tags should be present")
    assertEquals("custom-wallet", authMessage.Tags.Wallet, "Wallet tag should be set")
    
    -- Test battle message template
    local battleMessage = utils:createTestMessage("battle")
    assertEquals("Battle-Action", battleMessage.Action, "Battle action should be set")
    assertNotNil(battleMessage.Data, "Battle data should be present")
    
    print("✅ Handler test utilities test passed")
    return true
end

local function testCoverageReporter()
    print("Testing coverage reporter...")
    
    local reporter = CoverageReporter.new()
    
    assertNotNil(reporter, "Coverage reporter should be created")
    assertNotNil(reporter.coverage, "Coverage data should be initialized")
    assertNotNil(reporter.thresholds, "Thresholds should be set")
    
    -- Test coverage recording
    reporter:recordLineCoverage("test-file.lua", 10)
    reporter:recordLineCoverage("test-file.lua", 11)
    reporter:recordLineCoverage("test-file.lua", 10) -- Duplicate
    
    assertTrue(reporter.coverage.files["test-file.lua"], "File should be tracked")
    assertEquals(2, reporter.coverage.lines["test-file.lua"][10], "Line 10 should have 2 hits")
    assertEquals(1, reporter.coverage.lines["test-file.lua"][11], "Line 11 should have 1 hit")
    
    -- Test function coverage
    reporter:recordFunctionCoverage("test-file.lua", "testFunction", 5)
    
    local functionKey = "test-file.lua:testFunction:5"
    assertNotNil(reporter.coverage.functions[functionKey], "Function should be tracked")
    assertEquals(1, reporter.coverage.functions[functionKey].calls, "Function should have 1 call")
    
    -- Test handler coverage
    reporter:recordHandlerCoverage("TestHandler", {
        success = true,
        duration = 0.5,
        messageType = "auth"
    })
    
    assertNotNil(reporter.coverage.handlers["TestHandler"], "Handler should be tracked")
    assertEquals(1, reporter.coverage.handlers["TestHandler"].executions, "Handler should have 1 execution")
    assertEquals(1, reporter.coverage.handlers["TestHandler"].successfulExecutions, "Handler should have 1 success")
    
    -- Test coverage calculation
    local lineCoverage, coveredLines, totalLines = reporter:calculateLineCoverage("test-file.lua")
    assertTrue(lineCoverage > 0, "Line coverage should be calculated")
    assertEquals(2, coveredLines, "Should have 2 covered lines")
    assertEquals(2, totalLines, "Should have 2 total lines")
    
    print("✅ Coverage reporter test passed")
    return true
end

local function testFrameworkIntegration()
    print("Testing framework integration...")
    
    local framework = TestFramework.new()
    
    -- Add test suite
    local suite = framework:addTestSuite("IntegrationSuite", {
        beforeAll = function()
            -- Setup code
        end,
        afterAll = function()
            -- Cleanup code
        end
    })
    
    
    -- Add test case
    framework:addTest("IntegrationSuite", "SampleTest", function()
        TestFramework.Assert.equals(2, 1 + 1, "Math should work")
        return true
    end)
    
    -- Run tests
    local success, results = framework:runAll()
    
    assertTrue(success, "Integration test should pass")
    assertNotNil(results, "Results should be returned")
    assertEquals(1, results.total, "Should have 1 test")
    assertEquals(1, results.passed, "Should have 1 passed test")
    assertEquals(0, results.failed, "Should have 0 failed tests")
    
    print("✅ Framework integration test passed")
    return true
end

-- Mock creation for handler testing
local function testMockCreation()
    print("Testing mock creation and usage...")
    
    local framework = TestFramework.new()
    
    -- Create a mock
    local mockFunction = framework:createMock("testMock", {
        returns = {"result1", "result2"},
        implementation = nil
    })
    
    assertNotNil(mockFunction, "Mock should be created")
    assertNotNil(mockFunction.func, "Mock function should exist")
    
    -- Test mock function calls
    local result1 = mockFunction.func("arg1")
    local result2 = mockFunction.func("arg2")
    local result3 = mockFunction.func("arg3")
    
    assertEquals("result1", result1, "First call should return first result")
    assertEquals("result2", result2, "Second call should return second result")
    assertEquals("result1", result3, "Third call should cycle back to first result")
    
    assertEquals(3, mockFunction.callCount, "Mock should track call count")
    assertEquals(3, #mockFunction.calls, "Mock should store all calls")
    
    print("✅ Mock creation test passed")
    return true
end

-- Run all tests
local function runTests()
    print("🧪 Running Enhanced Test Framework Unit Tests")
    print("=============================================")
    
    local tests = {
        testTestFrameworkCreation,
        testTestSuiteRegistration,
        testAssertionLibrary,
        testMockSystems,
        testHandlerTestUtilities,
        testCoverageReporter,
        testFrameworkIntegration,
        testMockCreation
    }
    
    local passed = 0
    local failed = 0
    
    for i, test in ipairs(tests) do
        print("")
        local success, err = pcall(test)
        
        if success then
            passed = passed + 1
        else
            failed = failed + 1
            print("❌ Test " .. i .. " failed: " .. tostring(err))
        end
    end
    
    print("")
    print("📊 Test Results:")
    print("================")
    print("Passed: " .. passed)
    print("Failed: " .. failed)
    print("Total: " .. (passed + failed))
    
    if failed == 0 then
        print("")
        print("🎉 All Enhanced Test Framework tests passed!")
        return true
    else
        print("")
        print("❌ Some tests failed. Please review the output above.")
        return false
    end
end

-- Execute tests
return runTests()