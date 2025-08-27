-- Comprehensive Test Cases for Pokemon Stat Calculations
-- Ensures behavioral parity between TypeScript and Lua implementations

local PokemonStatsTestCases = {}

-- Configuration for test case generation
local config = {
    comprehensive_mode = true,
    include_edge_cases = true,
    include_boundary_tests = true,
    generate_random_cases = true,
    random_case_count = 100
}

-- Core stat calculation test cases
function PokemonStatsTestCases.generateStatCalculationCases()
    local test_cases = {}
    
    -- Base stats covering full range (1-255)
    local base_stat_ranges = {
        { name = "very_low", values = { 1, 10, 20 } },
        { name = "low", values = { 30, 40, 50 } },
        { name = "medium", values = { 60, 70, 80 } },
        { name = "high", values = { 90, 100, 110 } },
        { name = "very_high", values = { 120, 140, 160 } },
        { name = "maximum", values = { 200, 230, 255 } }
    }
    
    -- Level ranges
    local level_ranges = {
        { name = "early", values = { 1, 2, 5 } },
        { name = "low", values = { 10, 15, 20 } },
        { name = "medium", values = { 25, 30, 40 } },
        { name = "standard", values = { 50, 60, 70 } },
        { name = "high", values = { 80, 90, 95 } },
        { name = "maximum", values = { 100 } }
    }
    
    -- IV ranges (0-31)
    local iv_ranges = {
        { name = "minimum", values = { 0 } },
        { name = "low", values = { 1, 5, 10 } },
        { name = "medium", values = { 15, 20, 25 } },
        { name = "high", values = { 28, 30 } },
        { name = "maximum", values = { 31 } }
    }
    
    -- EV ranges (0-252)
    local ev_ranges = {
        { name = "none", values = { 0 } },
        { name = "low", values = { 4, 8, 16 } },
        { name = "medium", values = { 32, 64, 85 } },
        { name = "high", values = { 128, 170, 200 } },
        { name = "maximum", values = { 252 } }
    }
    
    -- Nature modifiers (0.9, 1.0, 1.1)
    local nature_modifiers = {
        { name = "hindering", value = 0.9 },
        { name = "neutral", value = 1.0 },
        { name = "beneficial", value = 1.1 }
    }
    
    -- Stat types
    local stat_types = { "hp", "attack", "defense", "special_attack", "special_defense", "speed" }
    
    local case_id = 1
    
    -- Generate comprehensive combinations
    for _, stat_type in ipairs(stat_types) do
        for _, base_range in ipairs(base_stat_ranges) do
            for _, level_range in ipairs(level_ranges) do
                for _, iv_range in ipairs(iv_ranges) do
                    for _, ev_range in ipairs(ev_ranges) do
                        for _, nature in ipairs(nature_modifiers) do
                            -- Create test cases for each combination
                            for _, base_stat in ipairs(base_range.values) do
                                for _, level in ipairs(level_range.values) do
                                    for _, iv in ipairs(iv_range.values) do
                                        for _, ev in ipairs(ev_range.values) do
                                            local test_case = {
                                                id = "stat_calc_" .. case_id,
                                                category = "stat_calculation",
                                                description = string.format("Calculate %s stat: base=%d, level=%d, IV=%d, EV=%d, nature=%s",
                                                    stat_type, base_stat, level, iv, ev, nature.name),
                                                input = {
                                                    stat_type = stat_type,
                                                    base_stat = base_stat,
                                                    level = level,
                                                    iv = iv,
                                                    ev = ev,
                                                    nature_modifier = nature.value
                                                },
                                                expected_properties = {
                                                    has_calculated_stat = true,
                                                    stat_is_positive = true,
                                                    formula_applied = true
                                                },
                                                tags = {
                                                    "stat_calculation",
                                                    stat_type,
                                                    base_range.name .. "_base",
                                                    level_range.name .. "_level",
                                                    iv_range.name .. "_iv",
                                                    ev_range.name .. "_ev",
                                                    nature.name .. "_nature"
                                                }
                                            }
                                            
                                            table.insert(test_cases, test_case)
                                            case_id = case_id + 1
                                        end
                                    end
                                end
                            end
                        end
                    end
                end
            end
        end
    end
    
    return test_cases
end

-- Edge cases and boundary conditions
function PokemonStatsTestCases.generateEdgeCases()
    local edge_cases = {}
    local case_id = 1000 -- Start from higher ID to distinguish
    
    -- Boundary value testing
    local boundary_tests = {
        {
            description = "Level 1 Pokemon with minimum stats",
            input = { stat_type = "attack", base_stat = 1, level = 1, iv = 0, ev = 0, nature_modifier = 0.9 }
        },
        {
            description = "Level 100 Pokemon with maximum stats",
            input = { stat_type = "attack", base_stat = 255, level = 100, iv = 31, ev = 252, nature_modifier = 1.1 }
        },
        {
            description = "HP stat with minimum values",
            input = { stat_type = "hp", base_stat = 1, level = 1, iv = 0, ev = 0, nature_modifier = 1.0 }
        },
        {
            description = "HP stat with maximum values", 
            input = { stat_type = "hp", base_stat = 255, level = 100, iv = 31, ev = 252, nature_modifier = 1.0 }
        },
        {
            description = "Zero base stat edge case",
            input = { stat_type = "attack", base_stat = 0, level = 50, iv = 15, ev = 100, nature_modifier = 1.0 }
        },
        {
            description = "Extreme nature penalty",
            input = { stat_type = "attack", base_stat = 50, level = 50, iv = 31, ev = 252, nature_modifier = 0.9 }
        },
        {
            description = "Extreme nature boost",
            input = { stat_type = "attack", base_stat = 50, level = 50, iv = 31, ev = 252, nature_modifier = 1.1 }
        },
        {
            description = "Mid-level with perfect IVs and EVs",
            input = { stat_type = "speed", base_stat = 100, level = 50, iv = 31, ev = 252, nature_modifier = 1.1 }
        }
    }
    
    for _, test in ipairs(boundary_tests) do
        table.insert(edge_cases, {
            id = "edge_case_" .. case_id,
            category = "edge_cases",
            description = test.description,
            input = test.input,
            expected_properties = {
                has_calculated_stat = true,
                stat_is_non_negative = true,
                respects_formula = true
            },
            tags = { "edge_cases", "boundary_testing", test.input.stat_type }
        })
        case_id = case_id + 1
    end
    
    return edge_cases
end

-- Regression test cases based on known issues
function PokemonStatsTestCases.generateRegressionCases()
    local regression_cases = {}
    local case_id = 2000
    
    -- Known problematic combinations that have caused issues in the past
    local regression_tests = {
        {
            description = "Shedinja HP calculation (always 1 HP)",
            input = { stat_type = "hp", base_stat = 1, level = 50, iv = 31, ev = 252, nature_modifier = 1.0, special_case = "shedinja" }
        },
        {
            description = "Very low base stat with maximum boosts",
            input = { stat_type = "attack", base_stat = 5, level = 100, iv = 31, ev = 252, nature_modifier = 1.1 }
        },
        {
            description = "Chansey HP calculation (extremely high HP base)",
            input = { stat_type = "hp", base_stat = 250, level = 100, iv = 31, ev = 252, nature_modifier = 1.0 }
        },
        {
            description = "Speed stat for extremely fast Pokemon",
            input = { stat_type = "speed", base_stat = 180, level = 100, iv = 31, ev = 252, nature_modifier = 1.1 }
        },
        {
            description = "Defense calculation with hindering nature",
            input = { stat_type = "defense", base_stat = 230, level = 100, iv = 31, ev = 252, nature_modifier = 0.9 }
        }
    }
    
    for _, test in ipairs(regression_tests) do
        table.insert(regression_cases, {
            id = "regression_" .. case_id,
            category = "regression",
            description = test.description,
            input = test.input,
            expected_properties = {
                matches_known_result = true,
                no_calculation_errors = true
            },
            tags = { "regression", "known_issues", test.input.stat_type }
        })
        case_id = case_id + 1
    end
    
    return regression_cases
end

-- Random test case generation for broad coverage
function PokemonStatsTestCases.generateRandomCases()
    if not config.generate_random_cases then
        return {}
    end
    
    local random_cases = {}
    local case_id = 3000
    
    -- Initialize random seed based on current time for reproducibility in tests
    math.randomseed(12345) -- Fixed seed for consistent test results
    
    local stat_types = { "hp", "attack", "defense", "special_attack", "special_defense", "speed" }
    local nature_values = { 0.9, 1.0, 1.1 }
    
    for i = 1, config.random_case_count do
        local stat_type = stat_types[math.random(#stat_types)]
        local base_stat = math.random(1, 255)
        local level = math.random(1, 100)
        local iv = math.random(0, 31)
        local ev = math.random(0, 252)
        local nature_modifier = nature_values[math.random(#nature_values)]
        
        table.insert(random_cases, {
            id = "random_" .. case_id,
            category = "random",
            description = string.format("Random test case %d: %s stat calculation", i, stat_type),
            input = {
                stat_type = stat_type,
                base_stat = base_stat,
                level = level,
                iv = iv,
                ev = ev,
                nature_modifier = nature_modifier
            },
            expected_properties = {
                has_calculated_stat = true,
                reasonable_range = true
            },
            tags = { "random", "coverage", stat_type }
        })
        case_id = case_id + 1
    end
    
    return random_cases
end

-- Special Pokemon cases (forms, abilities affecting stats)
function PokemonStatsTestCases.generateSpecialCases()
    local special_cases = {}
    local case_id = 4000
    
    local special_tests = {
        {
            description = "Pokemon with Wonder Guard ability (Shedinja)",
            input = { stat_type = "hp", base_stat = 1, level = 50, iv = 31, ev = 252, nature_modifier = 1.0, ability = "wonder_guard" }
        },
        {
            description = "Pokemon with huge base HP (Blissey)",
            input = { stat_type = "hp", base_stat = 255, level = 100, iv = 31, ev = 252, nature_modifier = 1.0 }
        },
        {
            description = "Pokemon with extremely low attack (Chansey)",
            input = { stat_type = "attack", base_stat = 5, level = 100, iv = 0, ev = 0, nature_modifier = 0.9 }
        },
        {
            description = "Speed demon Pokemon (Ninjask)",
            input = { stat_type = "speed", base_stat = 160, level = 100, iv = 31, ev = 252, nature_modifier = 1.1 }
        },
        {
            description = "Ultra defensive Pokemon (Steelix)", 
            input = { stat_type = "defense", base_stat = 200, level = 100, iv = 31, ev = 252, nature_modifier = 1.1 }
        }
    }
    
    for _, test in ipairs(special_tests) do
        table.insert(special_cases, {
            id = "special_" .. case_id,
            category = "special_pokemon",
            description = test.description,
            input = test.input,
            expected_properties = {
                respects_special_rules = true,
                handles_extremes = true
            },
            tags = { "special_pokemon", "extremes", test.input.stat_type }
        })
        case_id = case_id + 1
    end
    
    return special_cases
end

-- Test data validation
function PokemonStatsTestCases.validateTestCase(test_case)
    local validation_result = {
        valid = true,
        errors = {},
        warnings = {}
    }
    
    -- Validate required fields
    if not test_case.id then
        table.insert(validation_result.errors, "Missing test case ID")
        validation_result.valid = false
    end
    
    if not test_case.input then
        table.insert(validation_result.errors, "Missing input data")
        validation_result.valid = false
    else
        local input = test_case.input
        
        -- Validate stat type
        local valid_stat_types = { "hp", "attack", "defense", "special_attack", "special_defense", "speed" }
        local valid_stat = false
        for _, stat in ipairs(valid_stat_types) do
            if input.stat_type == stat then
                valid_stat = true
                break
            end
        end
        
        if not valid_stat then
            table.insert(validation_result.errors, "Invalid stat type: " .. tostring(input.stat_type))
            validation_result.valid = false
        end
        
        -- Validate ranges
        if input.base_stat and (input.base_stat < 0 or input.base_stat > 255) then
            table.insert(validation_result.errors, "Base stat out of range (0-255): " .. input.base_stat)
            validation_result.valid = false
        end
        
        if input.level and (input.level < 1 or input.level > 100) then
            table.insert(validation_result.errors, "Level out of range (1-100): " .. input.level)
            validation_result.valid = false
        end
        
        if input.iv and (input.iv < 0 or input.iv > 31) then
            table.insert(validation_result.errors, "IV out of range (0-31): " .. input.iv)
            validation_result.valid = false
        end
        
        if input.ev and (input.ev < 0 or input.ev > 252) then
            table.insert(validation_result.errors, "EV out of range (0-252): " .. input.ev)
            validation_result.valid = false
        end
        
        if input.nature_modifier and (input.nature_modifier < 0.8 or input.nature_modifier > 1.2) then
            table.insert(validation_result.warnings, "Unusual nature modifier: " .. input.nature_modifier)
        end
    end
    
    return validation_result
end

-- Main function to generate all test cases
function PokemonStatsTestCases.generateAllTestCases()
    local all_test_cases = {}
    
    -- Generate different categories of test cases
    local stat_calculation_cases = PokemonStatsTestCases.generateStatCalculationCases()
    local edge_cases = PokemonStatsTestCases.generateEdgeCases()
    local regression_cases = PokemonStatsTestCases.generateRegressionCases()
    local random_cases = PokemonStatsTestCases.generateRandomCases()
    local special_cases = PokemonStatsTestCases.generateSpecialCases()
    
    -- Combine all test cases
    for _, test_case in ipairs(stat_calculation_cases) do
        table.insert(all_test_cases, test_case)
    end
    
    if config.include_edge_cases then
        for _, test_case in ipairs(edge_cases) do
            table.insert(all_test_cases, test_case)
        end
    end
    
    for _, test_case in ipairs(regression_cases) do
        table.insert(all_test_cases, test_case)
    end
    
    for _, test_case in ipairs(random_cases) do
        table.insert(all_test_cases, test_case)
    end
    
    for _, test_case in ipairs(special_cases) do
        table.insert(all_test_cases, test_case)
    end
    
    -- Validate all test cases
    local validation_summary = {
        total_cases = #all_test_cases,
        valid_cases = 0,
        invalid_cases = 0,
        warnings = 0
    }
    
    for i, test_case in ipairs(all_test_cases) do
        local validation = PokemonStatsTestCases.validateTestCase(test_case)
        
        if validation.valid then
            validation_summary.valid_cases = validation_summary.valid_cases + 1
        else
            validation_summary.invalid_cases = validation_summary.invalid_cases + 1
            print("Warning: Invalid test case " .. (test_case.id or i) .. ": " .. table.concat(validation.errors, ", "))
        end
        
        if #validation.warnings > 0 then
            validation_summary.warnings = validation_summary.warnings + #validation.warnings
        end
    end
    
    -- Add metadata
    local test_suite = {
        suite_name = "pokemon_stat_calculations",
        description = "Comprehensive test cases for Pokemon stat calculation parity",
        generated_at = os.date("%Y-%m-%d %H:%M:%S"),
        configuration = config,
        validation_summary = validation_summary,
        test_cases = all_test_cases,
        categories = {
            stat_calculation = #stat_calculation_cases,
            edge_cases = #edge_cases,
            regression = #regression_cases,
            random = #random_cases,
            special = #special_cases
        }
    }
    
    return test_suite
end

-- Configuration functions
function PokemonStatsTestCases.configure(new_config)
    for k, v in pairs(new_config) do
        config[k] = v
    end
end

function PokemonStatsTestCases.getConfiguration()
    return config
end

-- Export functions
function PokemonStatsTestCases.exportToFile(file_path, format)
    format = format or "lua"
    local test_suite = PokemonStatsTestCases.generateAllTestCases()
    
    if format == "lua" then
        local content = "-- Generated Pokemon Stat Test Cases\nreturn " .. PokemonStatsTestCases.serializeLua(test_suite)
        
        local file = io.open(file_path, "w")
        if file then
            file:write(content)
            file:close()
            return true
        end
        return false
    elseif format == "json" then
        -- Simple JSON export
        local content = PokemonStatsTestCases.serializeJson(test_suite)
        
        local file = io.open(file_path, "w")
        if file then
            file:write(content)
            file:close()
            return true
        end
        return false
    end
    
    return false
end

-- Serialization helpers
function PokemonStatsTestCases.serializeLua(obj, indent)
    indent = indent or ""
    local t = type(obj)
    
    if t == "nil" then
        return "nil"
    elseif t == "boolean" then
        return obj and "true" or "false"
    elseif t == "number" then
        return tostring(obj)
    elseif t == "string" then
        return string.format("%q", obj)
    elseif t == "table" then
        local items = {}
        local is_array = true
        local max_index = 0
        
        -- Check if it's array-like
        for k, v in pairs(obj) do
            if type(k) ~= "number" then
                is_array = false
                break
            else
                max_index = math.max(max_index, k)
            end
        end
        
        if is_array then
            for i = 1, max_index do
                table.insert(items, PokemonStatsTestCases.serializeLua(obj[i], indent .. "  "))
            end
            return "{\n" .. indent .. "  " .. table.concat(items, ",\n" .. indent .. "  ") .. "\n" .. indent .. "}"
        else
            for k, v in pairs(obj) do
                local key = type(k) == "string" and k:match("^[a-zA-Z_][a-zA-Z0-9_]*$") and k or ("[" .. string.format("%q", k) .. "]")
                table.insert(items, key .. " = " .. PokemonStatsTestCases.serializeLua(v, indent .. "  "))
            end
            return "{\n" .. indent .. "  " .. table.concat(items, ",\n" .. indent .. "  ") .. "\n" .. indent .. "}"
        end
    else
        return "\"" .. tostring(obj) .. "\""
    end
end

function PokemonStatsTestCases.serializeJson(obj)
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
            local is_array = true
            local max_index = 0
            
            for k, v in pairs(obj) do
                if type(k) ~= "number" then
                    is_array = false
                    break
                else
                    max_index = math.max(max_index, k)
                end
            end
            
            if is_array then
                for i = 1, max_index do
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

return PokemonStatsTestCases