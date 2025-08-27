-- Unit Tests for Error Handling Framework

-- Mock AO environment for testing
local function setupMockAO()
    -- Mock json global
    json = {
        encode = function(data)
            if type(data) == "table" then
                return "{\"encoded\":\"json\"}"
            end
            return tostring(data)
        end
    }
    
    -- Mock os functions
    os.time = function() return 1234567890 end
    os.date = function(fmt, timestamp)
        if timestamp then
            return "2025-08-27 10:00:00"
        else
            return "2025-08-27 10:00:00"
        end
    end
    
    -- Mock math.random
    local randomCounter = 0
    math.random = function(min, max)
        randomCounter = randomCounter + 1
        if min and max then
            return min + (randomCounter % (max - min + 1))
        else
            return randomCounter % 1000
        end
    end
end

-- Test Framework
local tests = {}
local testResults = { passed = 0, failed = 0, errors = {} }

function runTest(testName, testFunc)
    local success, result = pcall(testFunc)
    if success and result then
        testResults.passed = testResults.passed + 1
        print("✓ " .. testName)
    else
        testResults.failed = testResults.failed + 1
        local errorMsg = result and tostring(result) or "Test failed"
        table.insert(testResults.errors, testName .. ": " .. errorMsg)
        print("✗ " .. testName .. " - " .. errorMsg)
    end
end

-- Initialize test environment
setupMockAO()

-- Load the error handler module
-- Handle different path resolution contexts (local vs GitHub Actions)
local errorHandlerPaths = {
    "../../handlers/error-handler.lua",         -- Local development path
    "../../../handlers/error-handler.lua",     -- GitHub Actions path
    "./ao-processes/handlers/error-handler.lua", -- Alternative CI path
}

local ErrorHandler = nil
for _, path in ipairs(errorHandlerPaths) do
    local file = io.open(path, "r")
    if file then
        file:close()
        ErrorHandler = dofile(path)
        break
    end
end

if not ErrorHandler then
    error("Could not locate error-handler.lua. Tried paths: " .. table.concat(errorHandlerPaths, ", "))
end

-- Test Cases

function tests.testErrorConstants()
    -- Test error types are defined
    assert(ErrorHandler.ERROR_TYPES.VALIDATION == "VALIDATION_ERROR", "Validation error type should be defined")
    assert(ErrorHandler.ERROR_TYPES.HANDLER == "HANDLER_ERROR", "Handler error type should be defined")
    assert(ErrorHandler.ERROR_TYPES.SYSTEM == "SYSTEM_ERROR", "System error type should be defined")
    assert(ErrorHandler.ERROR_TYPES.AUTHENTICATION == "AUTHENTICATION_ERROR", "Authentication error type should be defined")
    
    -- Test severity levels are defined
    assert(ErrorHandler.SEVERITY_LEVELS.LOW == "low", "Low severity level should be defined")
    assert(ErrorHandler.SEVERITY_LEVELS.MEDIUM == "medium", "Medium severity level should be defined")
    assert(ErrorHandler.SEVERITY_LEVELS.HIGH == "high", "High severity level should be defined")
    assert(ErrorHandler.SEVERITY_LEVELS.CRITICAL == "critical", "Critical severity level should be defined")
    
    return true
end

function tests.testErrorCreation()
    -- Reset error stats for clean test
    ErrorHandler.resetErrorStats()
    
    local error = ErrorHandler.createError(
        ErrorHandler.ERROR_TYPES.VALIDATION,
        ErrorHandler.ERROR_CODES.MISSING_REQUIRED_TAG,
        "Test error message",
        { test_detail = "test_value" }
    )
    
    assert(error.type == ErrorHandler.ERROR_TYPES.VALIDATION, "Error type should be set correctly")
    assert(error.code == ErrorHandler.ERROR_CODES.MISSING_REQUIRED_TAG, "Error code should be set correctly")
    assert(error.message == "Test error message", "Error message should be set correctly")
    assert(error.details.test_detail == "test_value", "Error details should be set correctly")
    assert(type(error.correlation_id) == "string", "Correlation ID should be generated")
    assert(error.correlation_id:sub(1, 4) == "err_", "Correlation ID should have err_ prefix")
    assert(type(error.timestamp) == "number", "Timestamp should be generated")
    assert(error.severity == ErrorHandler.SEVERITY_LEVELS.LOW, "Severity should be set correctly")
    
    return true
end

function tests.testErrorTracking()
    -- Reset error stats for clean test
    ErrorHandler.resetErrorStats()
    
    -- Create several errors
    ErrorHandler.createError(ErrorHandler.ERROR_TYPES.VALIDATION, 1001, "Test 1")
    ErrorHandler.createError(ErrorHandler.ERROR_TYPES.VALIDATION, 1002, "Test 2")
    ErrorHandler.createError(ErrorHandler.ERROR_TYPES.HANDLER, 2001, "Test 3")
    
    local stats = ErrorHandler.getErrorStats()
    
    assert(stats.total_errors == 3, "Total errors should be tracked correctly")
    assert(stats.errors_by_type[ErrorHandler.ERROR_TYPES.VALIDATION] == 2, "Validation errors should be counted")
    assert(stats.errors_by_type[ErrorHandler.ERROR_TYPES.HANDLER] == 1, "Handler errors should be counted")
    assert(stats.last_error_time ~= "None", "Last error time should be recorded")
    
    return true
end

function tests.testSeverityMapping()
    local validationSeverity = ErrorHandler.getSeverityForErrorType(ErrorHandler.ERROR_TYPES.VALIDATION)
    local systemSeverity = ErrorHandler.getSeverityForErrorType(ErrorHandler.ERROR_TYPES.SYSTEM)
    local dataSeverity = ErrorHandler.getSeverityForErrorType(ErrorHandler.ERROR_TYPES.DATA_CORRUPTION)
    
    assert(validationSeverity == ErrorHandler.SEVERITY_LEVELS.LOW, "Validation errors should be low severity")
    assert(systemSeverity == ErrorHandler.SEVERITY_LEVELS.HIGH, "System errors should be high severity")
    assert(dataSeverity == ErrorHandler.SEVERITY_LEVELS.CRITICAL, "Data corruption should be critical severity")
    
    return true
end

function tests.testMessageValidation()
    -- Test valid message
    local validMsg = {
        From = "test-sender",
        Tags = { Action = "Info", Player = "test-player" }
    }
    
    local error = ErrorHandler.validateMessage(validMsg, {"Action", "Player"})
    assert(error == nil, "Valid message should not produce errors")
    
    -- Test invalid message - missing tags
    local invalidMsg1 = {
        From = "test-sender"
    }
    
    local error1 = ErrorHandler.validateMessage(invalidMsg1, {"Action"})
    assert(error1 ~= nil, "Message without tags should produce error")
    assert(error1.type == ErrorHandler.ERROR_TYPES.VALIDATION, "Should be validation error")
    
    -- Test invalid message - missing required tag
    local invalidMsg2 = {
        From = "test-sender",
        Tags = {}
    }
    
    local error2 = ErrorHandler.validateMessage(invalidMsg2, {"Action"})
    assert(error2 ~= nil, "Message missing required tag should produce error")
    
    -- Test invalid message - missing From
    local invalidMsg3 = {
        Tags = { Action = "Info" }
    }
    
    local error3 = ErrorHandler.validateMessage(invalidMsg3, {"Action"})
    assert(error3 ~= nil, "Message missing From should produce error")
    
    return true
end

function tests.testHandlerWrapper()
    -- Reset error stats for clean test
    ErrorHandler.resetErrorStats()
    
    -- Mock message reply function
    local replyCalled = false
    local replyData = nil
    
    local mockMsg = {
        From = "test-sender",
        Tags = { Action = "Test" },
        reply = function(response)
            replyCalled = true
            replyData = response
        end
    }
    
    -- Test successful handler
    local successHandler = function(msg) return "success" end
    local wrappedSuccess = ErrorHandler.wrapHandler("test-success", successHandler)
    
    local result1 = wrappedSuccess(mockMsg)
    assert(result1 == "success", "Successful handler should return result")
    
    -- Test failing handler
    local failingHandler = function(msg) error("test error") end
    local wrappedFailing = ErrorHandler.wrapHandler("test-failing", failingHandler)
    
    local result2 = wrappedFailing(mockMsg)
    assert(result2 == false, "Failing handler should return false")
    assert(replyCalled == true, "Error response should be sent")
    assert(replyData.Tags["Error-Type"] == ErrorHandler.ERROR_TYPES.HANDLER, "Error type should be correct")
    
    -- Check error statistics
    local stats = ErrorHandler.getErrorStats()
    assert(stats.errors_by_handler["test-failing"] == 1, "Handler errors should be tracked")
    
    return true
end

function tests.testErrorResponse()
    local replyCalled = false
    local replyData = nil
    
    local mockMsg = {
        From = "test-sender",
        reply = function(response)
            replyCalled = true
            replyData = response
        end
    }
    
    local error = ErrorHandler.createError(
        ErrorHandler.ERROR_TYPES.VALIDATION,
        ErrorHandler.ERROR_CODES.INVALID_TAG_VALUE,
        "Test error response"
    )
    
    local success = ErrorHandler.sendErrorResponse(mockMsg, error)
    
    assert(success == true, "Error response should be sent successfully")
    assert(replyCalled == true, "Reply should be called")
    assert(replyData.Target == "test-sender", "Response target should be correct")
    assert(replyData.Tags.Action == "Error-Response", "Response action should be correct")
    assert(replyData.Tags.Success == "false", "Response should indicate failure")
    assert(replyData.Tags["Error-Type"] == ErrorHandler.ERROR_TYPES.VALIDATION, "Error type should be correct")
    assert(replyData.Tags["Correlation-ID"] == error.correlation_id, "Correlation ID should be included")
    
    return true
end

function tests.testCorrelationIdGeneration()
    local id1 = ErrorHandler.generateCorrelationId()
    local id2 = ErrorHandler.generateCorrelationId()
    
    assert(type(id1) == "string", "Correlation ID should be a string")
    assert(type(id2) == "string", "Correlation ID should be a string")
    assert(id1:sub(1, 4) == "err_", "Correlation ID should have err_ prefix")
    assert(id2:sub(1, 4) == "err_", "Correlation ID should have err_ prefix")
    assert(id1 ~= id2, "Correlation IDs should be unique")
    
    return true
end

function tests.testHealthCheck()
    -- Reset error stats for clean test
    ErrorHandler.resetErrorStats()
    
    -- Test healthy state
    local health1 = ErrorHandler.healthCheck()
    assert(health1.status == "healthy", "Should be healthy with no errors")
    
    -- Add some errors
    ErrorHandler.createError(ErrorHandler.ERROR_TYPES.SYSTEM, 3001, "System error")
    ErrorHandler.createError(ErrorHandler.ERROR_TYPES.DATA_CORRUPTION, 3002, "Critical error")
    
    local health2 = ErrorHandler.healthCheck()
    assert(health2.status == "critical", "Should be critical with data corruption errors")
    assert(health2.critical_errors > 0, "Should count critical errors")
    
    return true
end

function tests.testErrorStatsReset()
    -- Add some errors
    ErrorHandler.createError(ErrorHandler.ERROR_TYPES.VALIDATION, 1001, "Test error")
    
    local statsBeforeReset = ErrorHandler.getErrorStats()
    assert(statsBeforeReset.total_errors > 0, "Should have errors before reset")
    
    -- Reset stats
    ErrorHandler.resetErrorStats()
    
    local statsAfterReset = ErrorHandler.getErrorStats()
    assert(statsAfterReset.total_errors == 0, "Should have no errors after reset")
    assert(statsAfterReset.last_error_time == "None", "Last error time should be reset")
    
    return true
end

-- Run all tests
print("Running Error Handling Framework Unit Tests")
print("==========================================")

for testName, testFunc in pairs(tests) do
    runTest(testName, testFunc)
end

print("\nTest Results:")
print("Passed: " .. testResults.passed)
print("Failed: " .. testResults.failed)

if #testResults.errors > 0 then
    print("\nErrors:")
    for _, error in ipairs(testResults.errors) do
        print("  " .. error)
    end
end

-- Return test success status
return testResults.failed == 0