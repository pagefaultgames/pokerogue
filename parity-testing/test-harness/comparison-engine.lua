-- TypeScript vs Lua Comparison Engine
-- Comprehensive framework for validating behavioral parity between implementations

local ComparisonEngine = {}

-- Comparison state tracking
local comparison_results = {}
local test_scenarios = {}
local validation_rules = {}
local type_mappings = {}

-- Configuration
local config = {
    enabled = true,
    strict_mode = true, -- Strict type and value checking
    tolerance = 0.001, -- Numerical tolerance for floating point comparisons
    max_depth = 10, -- Maximum depth for object comparison
    ignore_order = false, -- Whether to ignore array order in comparisons
    log_mismatches = true,
    generate_reports = true
}

-- Type mapping between TypeScript and Lua
type_mappings = {
    typescript_to_lua = {
        number = "number",
        string = "string",
        boolean = "boolean",
        object = "table",
        array = "table",
        null = "nil",
        undefined = "nil"
    },
    lua_to_typescript = {
        number = "number",
        string = "string",
        boolean = "boolean",
        table = "object", -- or "array" depending on structure
        ["nil"] = "null",
        ["function"] = "function"
    }
}

-- Core comparison functions
function ComparisonEngine.compareValues(typescript_value, lua_value, path, comparison_context)
    path = path or "root"
    comparison_context = comparison_context or { depth = 0, mismatches = {} }
    
    if comparison_context.depth > config.max_depth then
        table.insert(comparison_context.mismatches, {
            path = path,
            type = "max_depth_exceeded",
            message = "Maximum comparison depth exceeded"
        })
        return false
    end
    
    -- Handle nil/null values
    if ComparisonEngine.isNilOrNull(typescript_value) and ComparisonEngine.isNilOrNull(lua_value) then
        return true
    end
    
    if ComparisonEngine.isNilOrNull(typescript_value) ~= ComparisonEngine.isNilOrNull(lua_value) then
        ComparisonEngine.recordMismatch(comparison_context, path, "null_mismatch", 
            typescript_value, lua_value, "One value is null/nil, the other is not")
        return false
    end
    
    -- Type comparison
    local ts_type = ComparisonEngine.getTypeScriptType(typescript_value)
    local lua_type = ComparisonEngine.getLuaType(lua_value)
    
    if not ComparisonEngine.typesCompatible(ts_type, lua_type) then
        ComparisonEngine.recordMismatch(comparison_context, path, "type_mismatch", 
            typescript_value, lua_value, "Types are incompatible: " .. ts_type .. " vs " .. lua_type)
        return false
    end
    
    -- Value comparison based on type
    comparison_context.depth = comparison_context.depth + 1
    local result = false
    
    if ts_type == "number" then
        result = ComparisonEngine.compareNumbers(typescript_value, lua_value, comparison_context, path)
    elseif ts_type == "string" then
        result = ComparisonEngine.compareStrings(typescript_value, lua_value, comparison_context, path)
    elseif ts_type == "boolean" then
        result = ComparisonEngine.compareBooleans(typescript_value, lua_value, comparison_context, path)
    elseif ts_type == "array" then
        result = ComparisonEngine.compareArrays(typescript_value, lua_value, comparison_context, path)
    elseif ts_type == "object" then
        result = ComparisonEngine.compareObjects(typescript_value, lua_value, comparison_context, path)
    else
        -- Fallback to direct comparison
        result = typescript_value == lua_value
        if not result then
            ComparisonEngine.recordMismatch(comparison_context, path, "value_mismatch", 
                typescript_value, lua_value, "Direct value comparison failed")
        end
    end
    
    comparison_context.depth = comparison_context.depth - 1
    return result
end

function ComparisonEngine.compareNumbers(ts_val, lua_val, context, path)
    -- Handle special number values
    if ComparisonEngine.isNaN(ts_val) and ComparisonEngine.isNaN(lua_val) then
        return true
    end
    
    if ComparisonEngine.isNaN(ts_val) ~= ComparisonEngine.isNaN(lua_val) then
        ComparisonEngine.recordMismatch(context, path, "nan_mismatch", ts_val, lua_val, "NaN mismatch")
        return false
    end
    
    if ComparisonEngine.isInfinite(ts_val) and ComparisonEngine.isInfinite(lua_val) then
        return ts_val == lua_val -- Both infinite with same sign
    end
    
    if ComparisonEngine.isInfinite(ts_val) ~= ComparisonEngine.isInfinite(lua_val) then
        ComparisonEngine.recordMismatch(context, path, "infinity_mismatch", ts_val, lua_val, "Infinity mismatch")
        return false
    end
    
    -- Tolerance-based comparison for floating point
    local diff = math.abs(ts_val - lua_val)
    local result = diff <= config.tolerance
    
    if not result then
        ComparisonEngine.recordMismatch(context, path, "number_mismatch", ts_val, lua_val, 
            "Numbers differ by " .. diff .. " (tolerance: " .. config.tolerance .. ")")
    end
    
    return result
end

function ComparisonEngine.compareStrings(ts_val, lua_val, context, path)
    local result = ts_val == lua_val
    if not result then
        ComparisonEngine.recordMismatch(context, path, "string_mismatch", ts_val, lua_val, 
            "String values differ")
    end
    return result
end

function ComparisonEngine.compareBooleans(ts_val, lua_val, context, path)
    local result = ts_val == lua_val
    if not result then
        ComparisonEngine.recordMismatch(context, path, "boolean_mismatch", ts_val, lua_val, 
            "Boolean values differ")
    end
    return result
end

function ComparisonEngine.compareArrays(ts_array, lua_array, context, path)
    -- Check if both are actually array-like
    if not ComparisonEngine.isArrayLike(ts_array) or not ComparisonEngine.isArrayLike(lua_array) then
        ComparisonEngine.recordMismatch(context, path, "array_structure_mismatch", ts_array, lua_array, 
            "One or both values are not array-like")
        return false
    end
    
    local ts_length = ComparisonEngine.getArrayLength(ts_array)
    local lua_length = ComparisonEngine.getArrayLength(lua_array)
    
    if ts_length ~= lua_length then
        ComparisonEngine.recordMismatch(context, path, "array_length_mismatch", ts_array, lua_array, 
            "Array lengths differ: " .. ts_length .. " vs " .. lua_length)
        return false
    end
    
    -- Compare elements
    if config.ignore_order then
        return ComparisonEngine.compareArraysUnordered(ts_array, lua_array, context, path)
    else
        return ComparisonEngine.compareArraysOrdered(ts_array, lua_array, context, path)
    end
end

function ComparisonEngine.compareArraysOrdered(ts_array, lua_array, context, path)
    local length = ComparisonEngine.getArrayLength(ts_array)
    
    for i = 1, length do
        local ts_element = ComparisonEngine.getArrayElement(ts_array, i)
        local lua_element = ComparisonEngine.getArrayElement(lua_array, i)
        local element_path = path .. "[" .. i .. "]"
        
        if not ComparisonEngine.compareValues(ts_element, lua_element, element_path, context) then
            return false
        end
    end
    
    return true
end

function ComparisonEngine.compareArraysUnordered(ts_array, lua_array, context, path)
    -- This is more complex - we need to find matching elements
    local ts_length = ComparisonEngine.getArrayLength(ts_array)
    local lua_used = {}
    
    for i = 1, ts_length do
        local ts_element = ComparisonEngine.getArrayElement(ts_array, i)
        local found_match = false
        
        for j = 1, ts_length do
            if not lua_used[j] then
                local lua_element = ComparisonEngine.getArrayElement(lua_array, j)
                local temp_context = { depth = context.depth, mismatches = {} }
                
                if ComparisonEngine.compareValues(ts_element, lua_element, path .. "[unordered]", temp_context) then
                    lua_used[j] = true
                    found_match = true
                    break
                end
            end
        end
        
        if not found_match then
            ComparisonEngine.recordMismatch(context, path .. "[" .. i .. "]", "unordered_array_mismatch", 
                ts_element, nil, "No matching element found in Lua array")
            return false
        end
    end
    
    return true
end

function ComparisonEngine.compareObjects(ts_object, lua_object, context, path)
    local ts_keys = ComparisonEngine.getObjectKeys(ts_object)
    local lua_keys = ComparisonEngine.getObjectKeys(lua_object)
    
    -- Check for missing keys
    for _, ts_key in ipairs(ts_keys) do
        if not ComparisonEngine.hasKey(lua_object, ts_key) then
            ComparisonEngine.recordMismatch(context, path .. "." .. ts_key, "missing_key", 
                ts_object[ts_key], nil, "Key missing in Lua object")
        end
    end
    
    for _, lua_key in ipairs(lua_keys) do
        if not ComparisonEngine.hasKey(ts_object, lua_key) then
            ComparisonEngine.recordMismatch(context, path .. "." .. lua_key, "extra_key", 
                nil, lua_object[lua_key], "Extra key in Lua object")
        end
    end
    
    -- Compare common keys
    local success = true
    for _, key in ipairs(ts_keys) do
        if ComparisonEngine.hasKey(lua_object, key) then
            local key_path = path .. "." .. key
            if not ComparisonEngine.compareValues(ts_object[key], lua_object[key], key_path, context) then
                success = false
            end
        else
            success = false
        end
    end
    
    return success
end

-- Type detection and utility functions
function ComparisonEngine.getTypeScriptType(value)
    if value == nil then
        return "null"
    elseif type(value) == "table" then
        if ComparisonEngine.isArrayLike(value) then
            return "array"
        else
            return "object"
        end
    else
        return type(value)
    end
end

function ComparisonEngine.getLuaType(value)
    return type(value)
end

function ComparisonEngine.typesCompatible(ts_type, lua_type)
    if ts_type == lua_type then return true end
    
    -- Check mapping compatibility
    local expected_lua_type = type_mappings.typescript_to_lua[ts_type]
    if expected_lua_type == lua_type then return true end
    
    -- Special cases
    if ts_type == "null" and lua_type == "nil" then return true end
    if ts_type == "undefined" and lua_type == "nil" then return true end
    if (ts_type == "array" or ts_type == "object") and lua_type == "table" then return true end
    
    return false
end

function ComparisonEngine.isNilOrNull(value)
    return value == nil
end

function ComparisonEngine.isNaN(value)
    -- Lua doesn't have NaN by default, but we can check for it
    return type(value) == "number" and value ~= value
end

function ComparisonEngine.isInfinite(value)
    return type(value) == "number" and (value == math.huge or value == -math.huge)
end

function ComparisonEngine.isArrayLike(value)
    if type(value) ~= "table" then return false end
    
    -- Check if table has consecutive integer keys starting from 1
    local count = 0
    for k, v in pairs(value) do
        count = count + 1
    end
    
    for i = 1, count do
        if value[i] == nil then
            return false
        end
    end
    
    return true
end

function ComparisonEngine.getArrayLength(array)
    if type(array) == "table" then
        return #array
    end
    return 0
end

function ComparisonEngine.getArrayElement(array, index)
    if type(array) == "table" then
        return array[index]
    end
    return nil
end

function ComparisonEngine.getObjectKeys(obj)
    if type(obj) ~= "table" then return {} end
    
    local keys = {}
    for k, v in pairs(obj) do
        table.insert(keys, k)
    end
    return keys
end

function ComparisonEngine.hasKey(obj, key)
    if type(obj) ~= "table" then return false end
    return obj[key] ~= nil
end

function ComparisonEngine.recordMismatch(context, path, mismatch_type, ts_value, lua_value, message)
    if not config.log_mismatches then return end
    
    table.insert(context.mismatches, {
        path = path,
        type = mismatch_type,
        typescript_value = ts_value,
        lua_value = lua_value,
        message = message,
        timestamp = os.clock()
    })
end

-- Test scenario management
function ComparisonEngine.addTestScenario(name, scenario_config)
    test_scenarios[name] = {
        name = name,
        description = scenario_config.description,
        typescript_implementation = scenario_config.typescript_implementation,
        lua_implementation = scenario_config.lua_implementation,
        test_cases = scenario_config.test_cases or {},
        validation_rules = scenario_config.validation_rules or {},
        expected_parity = scenario_config.expected_parity ~= false, -- Default to true
        tags = scenario_config.tags or {}
    }
end

function ComparisonEngine.runTestScenario(scenario_name, test_inputs)
    local scenario = test_scenarios[scenario_name]
    if not scenario then
        error("Test scenario '" .. scenario_name .. "' not found")
    end
    
    local results = {
        scenario_name = scenario_name,
        test_count = 0,
        passed_count = 0,
        failed_count = 0,
        test_results = {},
        overall_parity = true,
        execution_time = 0
    }
    
    local start_time = os.clock()
    
    -- Run each test case
    for test_name, test_input in pairs(test_inputs) do
        local test_result = ComparisonEngine.runSingleTest(scenario, test_name, test_input)
        
        results.test_count = results.test_count + 1
        results.test_results[test_name] = test_result
        
        if test_result.parity_achieved then
            results.passed_count = results.passed_count + 1
        else
            results.failed_count = results.failed_count + 1
            results.overall_parity = false
        end
    end
    
    results.execution_time = (os.clock() - start_time) * 1000 -- milliseconds
    
    -- Store results
    comparison_results[scenario_name] = comparison_results[scenario_name] or {}
    table.insert(comparison_results[scenario_name], results)
    
    return results
end

function ComparisonEngine.runSingleTest(scenario, test_name, test_input)
    local test_result = {
        test_name = test_name,
        parity_achieved = false,
        typescript_result = nil,
        lua_result = nil,
        comparison_details = {},
        execution_times = {},
        errors = {}
    }
    
    -- Execute TypeScript implementation (simulated)
    local ts_start = os.clock()
    local ts_success, ts_result = pcall(function()
        if scenario.typescript_implementation then
            return scenario.typescript_implementation(test_input)
        else
            -- For testing purposes, we'll simulate TypeScript results
            return ComparisonEngine.simulateTypeScriptExecution(scenario.name, test_input)
        end
    end)
    test_result.execution_times.typescript = (os.clock() - ts_start) * 1000
    
    if ts_success then
        test_result.typescript_result = ts_result
    else
        table.insert(test_result.errors, {
            implementation = "typescript",
            error = ts_result
        })
    end
    
    -- Execute Lua implementation
    local lua_start = os.clock()
    local lua_success, lua_result = pcall(function()
        if scenario.lua_implementation then
            return scenario.lua_implementation(test_input)
        else
            error("Lua implementation not provided for scenario: " .. scenario.name)
        end
    end)
    test_result.execution_times.lua = (os.clock() - lua_start) * 1000
    
    if lua_success then
        test_result.lua_result = lua_result
    else
        table.insert(test_result.errors, {
            implementation = "lua",
            error = lua_result
        })
    end
    
    -- Compare results if both executions succeeded
    if ts_success and lua_success then
        local comparison_context = { depth = 0, mismatches = {} }
        test_result.parity_achieved = ComparisonEngine.compareValues(
            ts_result, lua_result, "result", comparison_context
        )
        test_result.comparison_details = comparison_context
    end
    
    return test_result
end

-- Mock TypeScript execution for testing purposes
function ComparisonEngine.simulateTypeScriptExecution(scenario_name, test_input)
    -- This would be replaced with actual TypeScript execution in a real implementation
    -- For now, we'll return mock results based on scenario
    
    if scenario_name == "pokemon_stat_calculation" then
        return ComparisonEngine.mockPokemonStatCalculation(test_input)
    elseif scenario_name == "battle_damage_calculation" then
        return ComparisonEngine.mockBattleDamageCalculation(test_input)
    elseif scenario_name == "type_effectiveness" then
        return ComparisonEngine.mockTypeEffectiveness(test_input)
    else
        -- Generic mock result
        return {
            result = "mock_typescript_result",
            input_processed = test_input,
            calculation_steps = { "step1", "step2", "step3" },
            final_value = 42
        }
    end
end

-- Mock implementations for testing
function ComparisonEngine.mockPokemonStatCalculation(input)
    local base_stat = input.base_stat or 100
    local level = input.level or 50
    local iv = input.iv or 31
    local ev = input.ev or 0
    local nature_modifier = input.nature_modifier or 1.0
    
    -- Simulate TypeScript Math.floor calculation
    local stat = math.floor(((2 * base_stat + iv + math.floor(ev / 4)) * level / 100 + 5) * nature_modifier)
    
    return {
        calculated_stat = stat,
        base_stat = base_stat,
        level = level,
        iv = iv,
        ev = ev,
        nature_modifier = nature_modifier,
        formula_used = "((2 * base + iv + floor(ev/4)) * level / 100 + 5) * nature"
    }
end

function ComparisonEngine.mockBattleDamageCalculation(input)
    local attack = input.attack or 100
    local defense = input.defense or 100
    local base_power = input.base_power or 80
    local level = input.level or 50
    local type_effectiveness = input.type_effectiveness or 1.0
    
    -- Simulate damage calculation
    local damage = math.floor(((((2 * level / 5 + 2) * base_power * attack / defense) / 50 + 2) * type_effectiveness))
    
    return {
        damage = damage,
        attack = attack,
        defense = defense,
        base_power = base_power,
        level = level,
        type_effectiveness = type_effectiveness
    }
end

function ComparisonEngine.mockTypeEffectiveness(input)
    local attacking_type = input.attacking_type
    local defending_type = input.defending_type
    
    -- Simple type effectiveness mock
    local effectiveness_chart = {
        fire = { grass = 2.0, water = 0.5, fire = 0.5 },
        water = { fire = 2.0, grass = 0.5, water = 0.5 },
        grass = { water = 2.0, fire = 0.5, grass = 0.5 }
    }
    
    local effectiveness = 1.0
    if effectiveness_chart[attacking_type] and effectiveness_chart[attacking_type][defending_type] then
        effectiveness = effectiveness_chart[attacking_type][defending_type]
    end
    
    return {
        effectiveness = effectiveness,
        attacking_type = attacking_type,
        defending_type = defending_type
    }
end

-- Reporting functions
function ComparisonEngine.generateComparisonReport(scenario_name, format)
    format = format or "text"
    
    local scenario_results = comparison_results[scenario_name]
    if not scenario_results then
        return "No comparison results found for scenario: " .. scenario_name
    end
    
    -- Get latest results
    local latest_results = scenario_results[#scenario_results]
    
    local report = {
        scenario_name = scenario_name,
        timestamp = os.date("%Y-%m-%d %H:%M:%S"),
        overall_parity = latest_results.overall_parity,
        test_summary = {
            total_tests = latest_results.test_count,
            passed = latest_results.passed_count,
            failed = latest_results.failed_count,
            success_rate = latest_results.test_count > 0 and (latest_results.passed_count / latest_results.test_count * 100) or 0
        },
        execution_time = latest_results.execution_time,
        test_details = latest_results.test_results,
        config = config
    }
    
    if format == "json" then
        return ComparisonEngine.formatJSON(report)
    else
        return ComparisonEngine.formatComparisonReportText(report)
    end
end

function ComparisonEngine.formatComparisonReportText(report)
    local lines = {
        "=== Parity Testing Report: " .. report.scenario_name .. " ===",
        "Generated: " .. report.timestamp,
        "Overall Parity: " .. (report.overall_parity and "✅ ACHIEVED" or "❌ FAILED"),
        "",
        "Test Summary:",
        "  Total Tests: " .. report.test_summary.total_tests,
        "  Passed: " .. report.test_summary.passed,
        "  Failed: " .. report.test_summary.failed,
        "  Success Rate: " .. string.format("%.1f%%", report.test_summary.success_rate),
        "  Execution Time: " .. string.format("%.3fms", report.execution_time),
        ""
    }
    
    -- Test details
    if report.test_summary.failed > 0 then
        table.insert(lines, "Failed Tests:")
        for test_name, test_result in pairs(report.test_details) do
            if not test_result.parity_achieved then
                table.insert(lines, "  ❌ " .. test_name)
                
                -- Show comparison mismatches
                if test_result.comparison_details and test_result.comparison_details.mismatches then
                    for _, mismatch in ipairs(test_result.comparison_details.mismatches) do
                        table.insert(lines, "    • " .. mismatch.path .. ": " .. mismatch.message)
                    end
                end
                
                -- Show errors
                if test_result.errors and #test_result.errors > 0 then
                    for _, error_info in ipairs(test_result.errors) do
                        table.insert(lines, "    • " .. error_info.implementation .. " error: " .. tostring(error_info.error))
                    end
                end
            end
        end
        table.insert(lines, "")
    end
    
    if report.test_summary.passed > 0 then
        table.insert(lines, "Passed Tests:")
        for test_name, test_result in pairs(report.test_details) do
            if test_result.parity_achieved then
                table.insert(lines, "  ✅ " .. test_name)
            end
        end
    end
    
    return table.concat(lines, "\n")
end

function ComparisonEngine.formatJSON(obj)
    -- Simple JSON serialization
    local function serialize(obj, indent)
        indent = indent or ""
        local t = type(obj)
        
        if t == "nil" then
            return "null"
        elseif t == "boolean" then
            return obj and "true" or "false"
        elseif t == "number" then
            return tostring(obj)
        elseif t == "string" then
            return '"' .. obj:gsub('"', '\\"') .. '"'
        elseif t == "table" then
            local items = {}
            local is_array = ComparisonEngine.isArrayLike(obj)
            
            if is_array then
                for i = 1, #obj do
                    table.insert(items, serialize(obj[i], indent .. "  "))
                end
                return "[\n" .. indent .. "  " .. table.concat(items, ",\n" .. indent .. "  ") .. "\n" .. indent .. "]"
            else
                for k, v in pairs(obj) do
                    table.insert(items, '"' .. tostring(k) .. '": ' .. serialize(v, indent .. "  "))
                end
                return "{\n" .. indent .. "  " .. table.concat(items, ",\n" .. indent .. "  ") .. "\n" .. indent .. "}"
            end
        else
            return '"' .. tostring(obj) .. '"'
        end
    end
    
    return serialize(obj)
end

-- Utility functions
function ComparisonEngine.reset(scenario_name)
    if scenario_name then
        comparison_results[scenario_name] = nil
        test_scenarios[scenario_name] = nil
    else
        comparison_results = {}
        test_scenarios = {}
        validation_rules = {}
    end
end

function ComparisonEngine.configure(new_config)
    for k, v in pairs(new_config) do
        config[k] = v
    end
end

function ComparisonEngine.getTestScenarios()
    local scenario_list = {}
    for name, scenario in pairs(test_scenarios) do
        table.insert(scenario_list, {
            name = name,
            description = scenario.description,
            test_case_count = 0,
            tags = scenario.tags
        })
    end
    return scenario_list
end

function ComparisonEngine.getComparisonResults(scenario_name)
    return comparison_results[scenario_name]
end

function ComparisonEngine.isEnabled()
    return config.enabled
end

return ComparisonEngine