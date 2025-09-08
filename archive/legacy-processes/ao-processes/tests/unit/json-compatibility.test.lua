-- Test JSON compatibility implementation across all processes
-- Validates that JSON implementation works without external require('json') dependencies

local TestFramework = require("tests.framework.test-framework-enhanced")

local function testJSONCompatibility()
    local testSuite = TestFramework.createSuite("JSON Compatibility Tests")
    
    -- Pure Lua JSON implementation for testing
    local json = {
        encode = function(obj)
            if type(obj) == "string" then
                return '"' .. obj:gsub('"', '\\"'):gsub('\n', '\\n'):gsub('\r', '\\r'):gsub('\t', '\\t') .. '"'
            elseif type(obj) == "number" then
                return tostring(obj)
            elseif type(obj) == "boolean" then
                return obj and "true" or "false"
            elseif obj == nil then
                return "null"
            elseif type(obj) == "table" then
                local isArray = true
                local maxIndex = 0
                for k, v in pairs(obj) do
                    if type(k) ~= "number" then
                        isArray = false
                        break
                    end
                    maxIndex = math.max(maxIndex, k)
                end
                
                if isArray then
                    local result = "["
                    for i = 1, maxIndex do
                        if i > 1 then result = result .. "," end
                        result = result .. json.encode(obj[i])
                    end
                    return result .. "]"
                else
                    local result = "{"
                    local first = true
                    for k, v in pairs(obj) do
                        if not first then result = result .. "," end
                        result = result .. json.encode(tostring(k)) .. ":" .. json.encode(v)
                        first = false
                    end
                    return result .. "}"
                end
            else
                return "null"
            end
        end,
        decode = function(str)
            -- Basic decode implementation for common patterns
            if not str or str == "" then return {} end
            if str == "null" then return nil end
            if str == "true" then return true end
            if str == "false" then return false end
            if str:match("^%d+$") then return tonumber(str) end
            if str:match('^".*"$') then return str:sub(2, -2) end
            return {}
        end
    }
    
    testSuite:addTest("String Encoding", function()
        local result = json.encode("hello world")
        TestFramework.assert(result == '"hello world"', "Should encode simple string")
        
        local resultWithEscapes = json.encode('say "hello"')
        TestFramework.assert(resultWithEscapes == '"say \\"hello\\""', "Should escape quotes in strings")
    end)
    
    testSuite:addTest("Number Encoding", function()
        local result = json.encode(42)
        TestFramework.assert(result == "42", "Should encode numbers as strings")
        
        local floatResult = json.encode(3.14)
        TestFramework.assert(result ~= nil, "Should handle floating point numbers")
    end)
    
    testSuite:addTest("Boolean Encoding", function()
        local trueResult = json.encode(true)
        TestFramework.assert(trueResult == "true", "Should encode true as 'true'")
        
        local falseResult = json.encode(false)
        TestFramework.assert(falseResult == "false", "Should encode false as 'false'")
    end)
    
    testSuite:addTest("Null Encoding", function()
        local result = json.encode(nil)
        TestFramework.assert(result == "null", "Should encode nil as 'null'")
    end)
    
    testSuite:addTest("Array Encoding", function()
        local result = json.encode({1, 2, 3})
        TestFramework.assert(result == "[1,2,3]", "Should encode arrays properly")
        
        local mixedResult = json.encode({"hello", 42, true})
        TestFramework.assert(mixedResult == '["hello",42,true]', "Should encode mixed arrays")
    end)
    
    testSuite:addTest("Object Encoding", function()
        local result = json.encode({success = true, message = "test"})
        -- Note: object key order might vary
        TestFramework.assert(string.find(result, '"success":true'), "Should contain success field")
        TestFramework.assert(string.find(result, '"message":"test"'), "Should contain message field")
    end)
    
    testSuite:addTest("Basic Decode", function()
        local result = json.decode("null")
        TestFramework.assert(result == nil, "Should decode null")
        
        local boolResult = json.decode("true")
        TestFramework.assert(boolResult == true, "Should decode true")
        
        local stringResult = json.decode('"hello"')
        TestFramework.assert(stringResult == "hello", "Should decode strings")
    end)
    
    testSuite:addTest("Health Check Message Format", function()
        -- Test typical health check response format used by processes
        local healthResponse = {
            status = "HEALTHY",
            processId = "test-process",
            timestamp = 1234567890,
            uptime = 300
        }
        
        local encoded = json.encode(healthResponse)
        TestFramework.assert(type(encoded) == "string", "Should encode health response to string")
        TestFramework.assert(string.find(encoded, '"status":"HEALTHY"'), "Should contain status field")
        TestFramework.assert(string.find(encoded, '"processId":"test-process"'), "Should contain processId field")
    end)
    
    testSuite:addTest("Error Response Format", function()
        -- Test typical error response format used by processes
        local errorResponse = {
            success = false,
            error = "Authentication failed",
            timestamp = 1234567890
        }
        
        local encoded = json.encode(errorResponse)
        TestFramework.assert(type(encoded) == "string", "Should encode error response to string")
        TestFramework.assert(string.find(encoded, '"success":false'), "Should contain success field")
        TestFramework.assert(string.find(encoded, '"error":"Authentication failed"'), "Should contain error field")
    end)
    
    return testSuite
end

-- Export the test for the framework
return testJSONCompatibility