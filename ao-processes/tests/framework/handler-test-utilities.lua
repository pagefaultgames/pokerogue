-- Handler Test Utilities for Individual Operation Validation
-- Specialized testing tools for AO handler operations

local HandlerTestUtils = {}
HandlerTestUtils.__index = HandlerTestUtils

function HandlerTestUtils.new(emulator, mockSystems)
    local utils = setmetatable({}, HandlerTestUtils)
    
    -- Try to load emulator, use mock if not available
    if emulator then
        utils.emulator = emulator
    else
        local success, emulatorModule = pcall(require, "development-tools/ao-local-setup/ao-emulator")
        if success and emulatorModule.AOEmulator then
            utils.emulator = emulatorModule.AOEmulator.new()
        else
            -- Provide a mock emulator for testing
            utils.emulator = {
                send = function(msg) return {success = true, response = "mock"} end,
                eval = function(code) return {success = true, result = "mock"} end,
                spawn = function() return "mock-process-id" end
            }
        end
    end
    
    utils.mocks = mockSystems or require("ao-processes/tests/framework/mock-systems").new()
    utils.testResults = {}
    utils.validationRules = {}
    return utils
end

-- Message Template Creation
function HandlerTestUtils:createTestMessage(template, overrides)
    overrides = overrides or {}
    
    local templates = {
        auth = {
            From = "test-wallet-address",
            Action = "Auth-Request",
            Data = "",
            Tags = {
                Wallet = "test-wallet-address",
                Timestamp = tostring(os.time())
            }
        },
        
        battle = {
            From = "battle-wallet",
            Action = "Battle-Action",
            Data = '{"type": "move", "moveId": 1, "targetId": 2}',
            Tags = {
                Wallet = "battle-wallet",
                Type = "battle",
                BattleId = "test-battle-123"
            }
        },
        
        query = {
            From = "query-wallet",
            Action = "Query",
            Data = "state",
            Tags = {
                QueryType = "state",
                Wallet = "query-wallet"
            }
        },
        
        admin = {
            From = "admin-wallet",
            Action = "Admin-Query",
            Data = "",
            Tags = {
                AdminAction = "get-handlers"
            }
        }
    }
    
    local baseMessage = templates[template] or templates.query
    
    -- Apply overrides
    local message = {}
    for key, value in pairs(baseMessage) do
        if type(value) == "table" then
            -- Deep copy tables
            message[key] = {}
            for k, v in pairs(value) do
                message[key][k] = v
            end
        else
            message[key] = value
        end
    end
    
    for key, value in pairs(overrides) do
        if key == "Tags" and type(value) == "table" then
            -- Merge tags
            message.Tags = message.Tags or {}
            for tagKey, tagValue in pairs(value) do
                message.Tags[tagKey] = tagValue
            end
        else
            message[key] = value
        end
    end
    
    -- Update Wallet tag to match From if From is overridden
    if overrides.From and message.Tags then
        message.Tags.Wallet = message.From
    end
    
    return message
end

-- Handler Response Validation
function HandlerTestUtils:validateHandlerResponse(response, expectedStructure)
    local function validateValue(actual, expected, path)
        path = path or "response"
        
        if type(expected) == "table" then
            if type(actual) ~= "table" then
                return false, path .. ": expected table, got " .. type(actual)
            end
            
            for key, expectedValue in pairs(expected) do
                local actualValue = actual[key]
                local valid, error = validateValue(actualValue, expectedValue, path .. "." .. key)
                if not valid then
                    return false, error
                end
            end
            return true
        elseif type(expected) == "function" then
            -- Custom validation function
            return expected(actual, path)
        elseif expected == "any" then
            return actual ~= nil, path .. ": value should not be nil"
        elseif expected == "string" then
            return type(actual) == "string", path .. ": expected string, got " .. type(actual)
        elseif expected == "number" then
            return type(actual) == "number", path .. ": expected number, got " .. type(actual)
        elseif expected == "boolean" then
            return type(actual) == "boolean", path .. ": expected boolean, got " .. type(actual)
        else
            return actual == expected, path .. ": expected " .. tostring(expected) .. ", got " .. tostring(actual)
        end
    end
    
    return validateValue(response, expectedStructure)
end

-- Handler Execution Testing
function HandlerTestUtils:testHandlerExecution(handlerName, testMessage, expectations)
    expectations = expectations or {}
    
    local testResult = {
        handlerName = handlerName,
        message = testMessage,
        success = false,
        response = nil,
        error = nil,
        duration = 0,
        validations = {}
    }
    
    local startTime = os.time()
    
    -- Execute the handler
    local executionResult = self.emulator:sendMessage(testMessage)
    
    testResult.duration = os.time() - startTime
    testResult.response = executionResult
    
    -- Find handler-specific results
    local handlerResult = nil
    for _, result in ipairs(executionResult.results) do
        if result.handler == handlerName then
            handlerResult = result
            break
        end
    end
    
    if not handlerResult then
        testResult.error = "Handler '" .. handlerName .. "' was not executed"
        return testResult
    end
    
    if not handlerResult.success then
        testResult.error = handlerResult.error or "Handler execution failed"
        return testResult
    end
    
    testResult.success = true
    
    -- Validate response structure if expected
    if expectations.responseStructure then
        local valid, error = self:validateHandlerResponse(handlerResult.result, expectations.responseStructure)
        table.insert(testResult.validations, {
            type = "response_structure",
            success = valid,
            error = error
        })
        
        if not valid then
            testResult.success = false
            testResult.error = "Response structure validation failed: " .. error
        end
    end
    
    -- Validate state changes if expected
    if expectations.stateChanges then
        local currentState = self.emulator:getState()
        for statePath, expectedValue in pairs(expectations.stateChanges) do
            local actualValue = self:getNestedValue(currentState, statePath)
            local valid = actualValue == expectedValue
            
            table.insert(testResult.validations, {
                type = "state_change",
                path = statePath,
                expected = expectedValue,
                actual = actualValue,
                success = valid
            })
            
            if not valid then
                testResult.success = false
                testResult.error = "State validation failed for " .. statePath
            end
        end
    end
    
    -- Validate mock calls if expected
    if expectations.mockCalls then
        for mockFunction, expectedCalls in pairs(expectations.mockCalls) do
            local actualCalls = self.mocks:getCallHistory(mockFunction)
            local valid = #actualCalls >= expectedCalls
            
            table.insert(testResult.validations, {
                type = "mock_calls",
                function_name = mockFunction,
                expected_min = expectedCalls,
                actual = #actualCalls,
                success = valid
            })
            
            if not valid then
                testResult.success = false
                testResult.error = "Mock call validation failed for " .. mockFunction
            end
        end
    end
    
    table.insert(self.testResults, testResult)
    return testResult
end

-- Batch Handler Testing
function HandlerTestUtils:testHandlerSequence(sequence)
    local sequenceResult = {
        sequence = sequence.name or "unnamed_sequence",
        steps = {},
        success = true,
        totalDuration = 0
    }
    
    for stepIndex, step in ipairs(sequence.steps) do
        local stepResult = {
            stepIndex = stepIndex,
            description = step.description,
            handlerTests = {},
            success = true
        }
        
        -- Execute pre-step setup if provided
        if step.setup then
            pcall(step.setup)
        end
        
        -- Execute handler tests in this step
        for _, handlerTest in ipairs(step.handlers or {}) do
            local testMessage = self:createTestMessage(handlerTest.template, handlerTest.messageOverrides)
            local testResult = self:testHandlerExecution(handlerTest.handler, testMessage, handlerTest.expectations)
            
            table.insert(stepResult.handlerTests, testResult)
            sequenceResult.totalDuration = sequenceResult.totalDuration + testResult.duration
            
            if not testResult.success then
                stepResult.success = false
                sequenceResult.success = false
            end
        end
        
        -- Execute post-step validation if provided
        if step.validate then
            local valid = pcall(step.validate)
            if not valid then
                stepResult.success = false
                sequenceResult.success = false
            end
        end
        
        table.insert(sequenceResult.steps, stepResult)
        
        -- Stop on failure if specified
        if not stepResult.success and sequence.stopOnFailure then
            break
        end
    end
    
    return sequenceResult
end

-- State Validation Helpers
function HandlerTestUtils:getNestedValue(table, path)
    local keys = {}
    for key in string.gmatch(path, "[^.]+") do
        table.insert(keys, key)
    end
    
    local value = table
    for _, key in ipairs(keys) do
        if type(value) ~= "table" or value[key] == nil then
            return nil
        end
        value = value[key]
    end
    
    return value
end

function HandlerTestUtils:setNestedValue(table, path, value)
    local keys = {}
    for key in string.gmatch(path, "[^.]+") do
        table.insert(keys, key)
    end
    
    local current = table
    for i = 1, #keys - 1 do
        local key = keys[i]
        if current[key] == nil then
            current[key] = {}
        end
        current = current[key]
    end
    
    current[keys[#keys]] = value
end

-- Performance Testing
function HandlerTestUtils:benchmarkHandler(handlerName, testMessage, iterations)
    iterations = iterations or 100
    
    local results = {
        handler = handlerName,
        iterations = iterations,
        totalTime = 0,
        averageTime = 0,
        minTime = math.huge,
        maxTime = 0,
        successCount = 0,
        failureCount = 0,
        times = {}
    }
    
    for i = 1, iterations do
        local startTime = os.clock()
        local executionResult = self.emulator:sendMessage(testMessage)
        local endTime = os.clock()
        
        local duration = endTime - startTime
        table.insert(results.times, duration)
        
        results.totalTime = results.totalTime + duration
        results.minTime = math.min(results.minTime, duration)
        results.maxTime = math.max(results.maxTime, duration)
        
        -- Check if handler executed successfully
        local success = false
        for _, result in ipairs(executionResult.results) do
            if result.handler == handlerName and result.success then
                success = true
                break
            end
        end
        
        if success then
            results.successCount = results.successCount + 1
        else
            results.failureCount = results.failureCount + 1
        end
    end
    
    results.averageTime = results.totalTime / iterations
    
    return results
end

-- Test Report Generation
function HandlerTestUtils:generateTestReport()
    local report = {
        summary = {
            totalTests = #self.testResults,
            passed = 0,
            failed = 0,
            averageDuration = 0
        },
        details = {},
        recommendations = {}
    }
    
    local totalDuration = 0
    
    for _, testResult in ipairs(self.testResults) do
        if testResult.success then
            report.summary.passed = report.summary.passed + 1
        else
            report.summary.failed = report.summary.failed + 1
        end
        
        totalDuration = totalDuration + testResult.duration
        
        table.insert(report.details, {
            handler = testResult.handlerName,
            success = testResult.success,
            duration = testResult.duration,
            error = testResult.error,
            validationCount = #testResult.validations
        })
    end
    
    if report.summary.totalTests > 0 then
        report.summary.averageDuration = totalDuration / report.summary.totalTests
    end
    
    -- Add recommendations based on results
    if report.summary.failed > 0 then
        table.insert(report.recommendations, "Review failed handler tests and fix implementation issues")
    end
    
    if report.summary.averageDuration > 1 then
        table.insert(report.recommendations, "Consider optimizing handler performance - average duration is high")
    end
    
    return report
end

-- Cleanup
function HandlerTestUtils:reset()
    self.testResults = {}
    self.mocks:resetAllMocks()
    self.emulator:reset()
end

return HandlerTestUtils