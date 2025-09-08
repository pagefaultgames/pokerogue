-- Unit Tests for main.lua - AO Process Entry Point

-- Mock AO environment for testing
local function setupMockAO()
    -- Mock Handlers global
    Handlers = {
        utils = {
            hasMatchingTag = function(tag, value)
                return function(msg)
                    return msg.Tags and msg.Tags[tag] == value
                end
            end
        },
        add = function(name, pattern, handler)
            -- Mock handler registration
            return true
        end
    }
    
    -- Mock json global
    json = {
        encode = function(data)
            -- Simple JSON encoding for tests
            if type(data) == "table" then
                return "{...}" -- Simplified for testing
            end
            return tostring(data)
        end,
        decode = function(str)
            return {}
        end
    }
    
    -- Mock os functions
    os.time = function() return 1234567890 end
    os.date = function() return "2025-08-27 10:00:00" end
    
    -- Mock math.random with incrementing counter for uniqueness
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

-- Load the main module for testing
-- Handle different path resolution contexts (local vs GitHub Actions)
local mainPaths = {
    "../../main.lua",           -- Local development path
    "../../../main.lua",        -- GitHub Actions path
    "./ao-processes/main.lua",  -- Alternative CI path
}

local mainLoaded = false
for _, path in ipairs(mainPaths) do
    local file = io.open(path, "r")
    if file then
        file:close()
        dofile(path)
        mainLoaded = true
        print("Loaded main.lua from: " .. path)
        break
    end
end

if not mainLoaded then
    error("Could not locate main.lua. Tried paths: " .. table.concat(mainPaths, ", "))
end

-- Test Cases

function tests.testProcessMetadata()
    assert(PROCESS_VERSION == "1.0.0", "Process version should be 1.0.0")
    assert(PROCESS_NAME == "PokeRogue-AO-Process", "Process name should be correct")
    assert(type(PROCESS_CAPABILITIES) == "table", "Capabilities should be a table")
    assert(#PROCESS_CAPABILITIES > 0, "Should have capabilities defined")
    return true
end

function tests.testErrorTypes()
    assert(ERROR_TYPES.VALIDATION == "VALIDATION_ERROR", "Validation error type should be defined")
    assert(ERROR_TYPES.HANDLER == "HANDLER_ERROR", "Handler error type should be defined") 
    assert(ERROR_TYPES.SYSTEM == "SYSTEM_ERROR", "System error type should be defined")
    assert(ERROR_TYPES.NOT_FOUND == "NOT_FOUND_ERROR", "Not found error type should be defined")
    return true
end

function tests.testHandlerRegistration()
    local initialCount = 0
    for _ in pairs(REGISTERED_HANDLERS) do
        initialCount = initialCount + 1
    end
    
    -- Test registering a new handler
    registerHandler("test-handler", function() return true end, function() end)
    
    local newCount = 0
    for _ in pairs(REGISTERED_HANDLERS) do
        newCount = newCount + 1
    end
    
    assert(newCount > initialCount, "Handler should be registered")
    assert(REGISTERED_HANDLERS["test-handler"] ~= nil, "Test handler should exist in registry")
    return true
end

function tests.testAdminInfoHandler()
    -- Mock message for testing
    local mockMsg = {
        From = "test-sender",
        Tags = { Action = "Info" },
        reply = function(response)
            -- Verify response structure
            assert(response.Target == "test-sender", "Response target should match sender")
            assert(response.Tags.Action == "Info-Response", "Response action should be Info-Response")
            assert(response.Tags.Success == "true", "Response should indicate success")
            assert(response.Data ~= nil, "Response should have data")
        end
    }
    
    local result = handleAdminInfo(mockMsg)
    assert(type(result) == "string", "Admin info should return a string")
    return true
end

function tests.testHandlerDiscovery()
    local mockMsg = {
        From = "test-sender",
        Tags = { Action = "Discover-Handlers" }
    }
    
    local result = getHandlerDiscovery(mockMsg)
    assert(type(result) == "string", "Handler discovery should return a string")
    return true
end

function tests.testCorrelationIdGeneration()
    local id1 = generateCorrelationId()
    local id2 = generateCorrelationId()
    
    assert(type(id1) == "string", "Correlation ID should be a string")
    assert(string.sub(id1, 1, 4) == "cor_", "Correlation ID should have cor_ prefix")
    assert(id1 ~= id2, "Correlation IDs should be unique")
    return true
end

function tests.testErrorResponseFormat()
    local mockMsg = {
        From = "test-sender",
        Tags = {},
        reply = function(response)
            assert(response.Target == "test-sender", "Error response target should match sender")
            assert(response.Tags.Action == "Error-Response", "Error response action should be correct")
            assert(response.Tags.Success == "false", "Error response should indicate failure")
            assert(response.Tags["Error-Type"] ~= nil, "Error response should have error type")
        end
    }
    
    sendErrorResponse(mockMsg, ERROR_TYPES.VALIDATION, "Test error message")
    return true
end

function tests.testMessageSchemas()
    local schemas = getMessageSchemas()
    assert(type(schemas) == "table", "Message schemas should be a table")
    assert(schemas["Info"] ~= nil, "Info schema should be defined")
    assert(schemas["Discover-Handlers"] ~= nil, "Discover-Handlers schema should be defined")
    
    local infoSchema = schemas["Info"]
    assert(infoSchema.required_tags ~= nil, "Info schema should have required tags")
    assert(infoSchema.action_value == "Info", "Info schema action value should be correct")
    return true
end

-- Run all tests
print("Running Main Process Unit Tests")
print("==============================")

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