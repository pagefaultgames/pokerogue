-- Unit Tests for Admin Handler

-- Mock AO environment for testing
local function setupMockAO()
    -- Mock json global
    json = {
        encode = function(data)
            if type(data) == "table" then
                return "{\"encoded\":\"json\"}"
            end
            return tostring(data)
        end,
        decode = function(str)
            return { decoded = "data" }
        end
    }
    
    -- Mock os functions
    os.time = function() return 1234567890 end
    os.date = function(fmt) 
        if fmt then
            return "2025-08-27 10:00:00"
        else
            return "2025-08-27 10:00:00"
        end
    end
    
    -- Mock globals that would be set by main.lua
    PROCESS_NAME = "PokeRogue-AO-Process"
    PROCESS_VERSION = "1.0.0"
    PROCESS_CAPABILITIES = {"battle-resolution", "pokemon-management"}
    REGISTERED_HANDLERS = {
        ["admin-info"] = { registered_at = 1234567890 },
        ["admin-discover"] = { registered_at = 1234567890 }
    }
    
    -- Mock getRegisteredHandlerNames function
    getRegisteredHandlerNames = function()
        local names = {}
        for name in pairs(REGISTERED_HANDLERS) do
            table.insert(names, name)
        end
        return names
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

-- Load the admin handler module
-- Handle different path resolution contexts (local vs GitHub Actions)
local adminHandlerPaths = {
    "../../handlers/admin-handler.lua",         -- Local development path
    "../../../handlers/admin-handler.lua",     -- GitHub Actions path
    "./ao-processes/handlers/admin-handler.lua", -- Alternative CI path
}

local AdminHandler = nil
for _, path in ipairs(adminHandlerPaths) do
    local file = io.open(path, "r")
    if file then
        file:close()
        AdminHandler = dofile(path)
        break
    end
end

if not AdminHandler then
    error("Could not locate admin-handler.lua. Tried paths: " .. table.concat(adminHandlerPaths, ", "))
end

-- Test Cases

function tests.testProcessInfoHandler()
    local mockMsg = {
        From = "test-sender",
        Tags = { Action = "Info" }
    }
    
    local result = AdminHandler.handleProcessInfo(mockMsg)
    
    assert(type(result) == "string", "Process info should return a JSON string")
    -- In a real implementation, we'd decode and verify the JSON structure
    
    return true
end

function tests.testHandlerDiscovery()
    local mockMsg = {
        From = "test-sender", 
        Tags = { Action = "Discover-Handlers" }
    }
    
    local result = AdminHandler.handleHandlerDiscovery(mockMsg)
    
    assert(type(result) == "string", "Handler discovery should return a JSON string")
    
    return true
end

function tests.testMessageSchemas()
    local schemas = AdminHandler.getMessageSchemas()
    
    assert(type(schemas) == "table", "Message schemas should be a table")
    assert(schemas["Info"] ~= nil, "Info schema should be defined")
    assert(schemas["Discover-Handlers"] ~= nil, "Discover-Handlers schema should be defined")
    assert(schemas["Battle-Start"] ~= nil, "Battle-Start schema should be defined")
    assert(schemas["Battle-Action"] ~= nil, "Battle-Action schema should be defined")
    
    -- Verify Info schema structure
    local infoSchema = schemas["Info"]
    assert(infoSchema.description ~= nil, "Info schema should have description")
    assert(type(infoSchema.required_tags) == "table", "Info schema should have required tags")
    assert(infoSchema.action_value == "Info", "Info schema action value should be correct")
    assert(infoSchema.response_format == "JSON", "Info schema response format should be JSON")
    
    return true
end

function tests.testMessagePatterns()
    local patterns = AdminHandler.getMessagePatterns()
    
    assert(type(patterns) == "table", "Message patterns should be a table")
    assert(patterns.info_pattern ~= nil, "Info pattern should be defined")
    assert(patterns.discovery_pattern ~= nil, "Discovery pattern should be defined")
    assert(patterns.battle_start_pattern ~= nil, "Battle start pattern should be defined")
    
    return true
end

function tests.testSupportedOperations()
    local operations = AdminHandler.getSupportedOperations()
    
    assert(type(operations) == "table", "Supported operations should be a table")
    assert(#operations > 0, "Should have supported operations defined")
    
    -- Check for expected operations
    local hasProcessInfo, hasHandlerDiscovery = false, false
    for _, op in ipairs(operations) do
        if op == "process_information" then hasProcessInfo = true end
        if op == "handler_discovery" then hasHandlerDiscovery = true end
    end
    
    assert(hasProcessInfo, "Should support process information operations")
    assert(hasHandlerDiscovery, "Should support handler discovery operations")
    
    return true
end

function tests.testRateLimits()
    local rateLimits = AdminHandler.getRateLimits()
    
    assert(type(rateLimits) == "table", "Rate limits should be a table")
    assert(type(rateLimits.requests_per_minute) == "number", "Requests per minute should be a number")
    assert(rateLimits.requests_per_minute > 0, "Requests per minute should be positive")
    assert(type(rateLimits.battle_actions_per_second) == "number", "Battle actions per second should be a number")
    
    return true
end

function tests.testHandlerDescriptions()
    local desc1 = AdminHandler.getHandlerDescription("admin-info")
    local desc2 = AdminHandler.getHandlerDescription("unknown-handler")
    
    assert(type(desc1) == "string", "Handler description should be a string")
    assert(desc1:len() > 0, "Handler description should not be empty")
    assert(type(desc2) == "string", "Unknown handler should get default description")
    assert(desc2:match("Handler for unknown%-handler"), "Unknown handler should get default format")
    
    return true
end

function tests.testMessageFormatValidation()
    -- Test valid Info message
    local validInfoMsg = {
        Tags = { Action = "Info" },
        From = "test-sender"
    }
    
    local valid, errorMsg = AdminHandler.validateMessageFormat("Info", validInfoMsg)
    assert(valid == true, "Valid Info message should pass validation")
    
    -- Test invalid message - missing tags
    local invalidMsg1 = {
        From = "test-sender"
    }
    
    local valid2, errorMsg2 = AdminHandler.validateMessageFormat("Info", invalidMsg1)
    assert(valid2 == false, "Message without tags should fail validation")
    assert(errorMsg2:match("Message missing Tags"), "Should report missing tags error")
    
    -- Test invalid message - missing required tag
    local invalidMsg2 = {
        Tags = {},
        From = "test-sender"
    }
    
    local valid3, errorMsg3 = AdminHandler.validateMessageFormat("Info", invalidMsg2)
    assert(valid3 == false, "Message without required tag should fail validation")
    assert(errorMsg3:match("Missing required tag"), "Should report missing required tag error")
    
    -- Test unknown message type
    local valid4, errorMsg4 = AdminHandler.validateMessageFormat("Unknown", validInfoMsg)
    assert(valid4 == false, "Unknown message type should fail validation")
    assert(errorMsg4:match("Unknown message type"), "Should report unknown message type error")
    
    return true
end

function tests.testProcessCapabilitiesDetails()
    local details = AdminHandler.getProcessCapabilitiesDetails()
    
    assert(type(details) == "table", "Process capabilities details should be a table")
    assert(details["battle-resolution"] ~= nil, "Battle resolution capability should be detailed")
    assert(details["pokemon-management"] ~= nil, "Pokemon management capability should be detailed")
    assert(details["game-state"] ~= nil, "Game state capability should be detailed")
    assert(details["admin-operations"] ~= nil, "Admin operations capability should be detailed")
    
    -- Check battle resolution details
    local battleCap = details["battle-resolution"]
    assert(battleCap.description ~= nil, "Battle capability should have description")
    assert(type(battleCap.supported_formats) == "table", "Battle capability should have supported formats")
    assert(type(battleCap.features) == "table", "Battle capability should have features")
    
    return true
end

function tests.testHealthCheck()
    local mockMsg = {
        From = "test-sender",
        Tags = { Action = "Health-Check" }
    }
    
    local result = AdminHandler.handleHealthCheck(mockMsg)
    
    assert(type(result) == "string", "Health check should return a JSON string")
    
    return true
end

-- Run all tests
print("Running Admin Handler Unit Tests")
print("===============================")

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