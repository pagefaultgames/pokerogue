-- Automated Parity Validation for Game Logic Outcomes
-- Comprehensive validation system ensuring behavioral parity between TypeScript and Lua implementations

local ComparisonEngine = require("parity-testing.test-harness.comparison-engine")

local ParityValidator = {}

-- Validation state
local validation_suites = {}
local validation_results = {}
local critical_validations = {}
local validation_schedules = {}

-- Configuration
local config = {
    enabled = true,
    auto_validate = true,
    critical_failure_threshold = 0.05, -- 5% failure rate threshold for critical validations
    validation_timeout = 30000, -- 30 seconds timeout per validation
    parallel_execution = false, -- Run validations in parallel when possible
    retry_failed_validations = 3, -- Number of retries for failed validations
    detailed_logging = true,
    generate_artifacts = true -- Generate test artifacts for debugging
}

-- Core validation functions
function ParityValidator.createValidationSuite(suite_name, suite_config)
    local suite = {
        name = suite_name,
        description = suite_config.description or "Parity validation suite",
        critical = suite_config.critical or false,
        validations = {},
        setup = suite_config.setup,
        teardown = suite_config.teardown,
        timeout = suite_config.timeout or config.validation_timeout,
        tags = suite_config.tags or {},
        requirements = suite_config.requirements or {},
        expected_parity_rate = suite_config.expected_parity_rate or 1.0 -- 100% by default
    }
    
    validation_suites[suite_name] = suite
    
    if suite.critical then
        critical_validations[suite_name] = suite
    end
    
    return suite
end

function ParityValidator.addValidation(suite_name, validation_name, validation_config)
    local suite = validation_suites[suite_name]
    if not suite then
        error("Validation suite '" .. suite_name .. "' not found")
    end
    
    local validation = {
        name = validation_name,
        description = validation_config.description,
        typescript_function = validation_config.typescript_function,
        lua_function = validation_config.lua_function,
        test_data_generator = validation_config.test_data_generator,
        test_cases = validation_config.test_cases or {},
        validation_rules = validation_config.validation_rules or {},
        tolerance = validation_config.tolerance or ComparisonEngine.config.tolerance,
        critical = validation_config.critical or false,
        weight = validation_config.weight or 1.0, -- For weighted validation scoring
        dependencies = validation_config.dependencies or {},
        tags = validation_config.tags or {}
    }
    
    table.insert(suite.validations, validation)
    return validation
end

-- Game-specific validation builders
function ParityValidator.createPokemonStatValidation(suite_name)
    ParityValidator.addValidation(suite_name, "pokemon_stat_calculation", {
        description = "Validate Pokemon stat calculations match between TypeScript and Lua",
        critical = true,
        weight = 2.0,
        test_data_generator = function()
            local test_cases = {}
            
            -- Generate comprehensive stat calculation test cases
            local base_stats = { 45, 60, 80, 100, 120, 150, 255 }
            local levels = { 1, 5, 25, 50, 75, 100 }
            local ivs = { 0, 15, 31 }
            local evs = { 0, 85, 170, 252 }
            local nature_modifiers = { 0.9, 1.0, 1.1 }
            
            local case_id = 1
            for _, base_stat in ipairs(base_stats) do
                for _, level in ipairs(levels) do
                    for _, iv in ipairs(ivs) do
                        for _, ev in ipairs(evs) do
                            for _, nature_mod in ipairs(nature_modifiers) do
                                table.insert(test_cases, {
                                    id = "stat_calc_" .. case_id,
                                    base_stat = base_stat,
                                    level = level,
                                    iv = iv,
                                    ev = ev,
                                    nature_modifier = nature_mod
                                })
                                case_id = case_id + 1
                            end
                        end
                    end
                end
            end
            
            return test_cases
        end,
        lua_function = function(test_input)
            -- Lua implementation of stat calculation
            local base_stat = test_input.base_stat
            local level = test_input.level
            local iv = test_input.iv
            local ev = test_input.ev
            local nature_modifier = test_input.nature_modifier
            
            -- HP calculation (different formula)
            if test_input.stat_type == "hp" then
                return {
                    calculated_stat = math.floor((2 * base_stat + iv + math.floor(ev / 4)) * level / 100 + level + 10),
                    formula_used = "hp_formula"
                }
            else
                -- Other stats
                return {
                    calculated_stat = math.floor(((2 * base_stat + iv + math.floor(ev / 4)) * level / 100 + 5) * nature_modifier),
                    formula_used = "stat_formula"
                }
            end
        end,
        validation_rules = {
            {
                name = "exact_match",
                description = "Calculated stats must match exactly",
                validator = function(ts_result, lua_result)
                    return ts_result.calculated_stat == lua_result.calculated_stat
                end
            },
            {
                name = "formula_consistency",
                description = "Formula used must be consistent",
                validator = function(ts_result, lua_result)
                    return ts_result.formula_used == lua_result.formula_used
                end
            }
        }
    })
end

function ParityValidator.createBattleDamageValidation(suite_name)
    ParityValidator.addValidation(suite_name, "battle_damage_calculation", {
        description = "Validate battle damage calculations match between implementations",
        critical = true,
        weight = 3.0,
        test_data_generator = function()
            local test_cases = {}
            
            local levels = { 5, 25, 50, 75, 100 }
            local attack_stats = { 50, 100, 150, 200, 300 }
            local defense_stats = { 50, 100, 150, 200, 300 }
            local base_powers = { 40, 60, 80, 100, 120, 150 }
            local type_effectiveness = { 0.25, 0.5, 1.0, 2.0, 4.0 }
            local stab_multipliers = { 1.0, 1.5 }
            local random_factors = { 0.85, 1.0 } -- Min and max random factor
            
            local case_id = 1
            for _, level in ipairs(levels) do
                for _, attack in ipairs(attack_stats) do
                    for _, defense in ipairs(defense_stats) do
                        for _, power in ipairs(base_powers) do
                            for _, effectiveness in ipairs(type_effectiveness) do
                                for _, stab in ipairs(stab_multipliers) do
                                    for _, random in ipairs(random_factors) do
                                        table.insert(test_cases, {
                                            id = "damage_calc_" .. case_id,
                                            level = level,
                                            attack = attack,
                                            defense = defense,
                                            base_power = power,
                                            type_effectiveness = effectiveness,
                                            stab = stab,
                                            random_factor = random,
                                            critical_hit = false,
                                            weather_modifier = 1.0,
                                            item_modifier = 1.0
                                        })
                                        case_id = case_id + 1
                                    end
                                end
                            end
                        end
                    end
                end
            end
            
            return test_cases
        end,
        lua_function = function(test_input)
            -- Lua implementation of damage calculation
            local level = test_input.level
            local attack = test_input.attack
            local defense = test_input.defense
            local base_power = test_input.base_power
            local type_effectiveness = test_input.type_effectiveness
            local stab = test_input.stab
            local random_factor = test_input.random_factor
            local critical_hit = test_input.critical_hit and 1.5 or 1.0
            local weather_modifier = test_input.weather_modifier or 1.0
            local item_modifier = test_input.item_modifier or 1.0
            
            -- Damage formula: ((((2*Level/5+2)*Power*A/D)/50+2)*Modifiers)
            local damage = math.floor((((((2 * level / 5 + 2) * base_power * attack / defense) / 50) + 2) 
                * type_effectiveness * stab * critical_hit * weather_modifier * item_modifier * random_factor))
            
            return {
                damage = damage,
                base_damage = math.floor(((2 * level / 5 + 2) * base_power * attack / defense) / 50 + 2),
                modifiers = {
                    type_effectiveness = type_effectiveness,
                    stab = stab,
                    critical_hit = critical_hit,
                    weather = weather_modifier,
                    item = item_modifier,
                    random = random_factor
                }
            }
        end,
        validation_rules = {
            {
                name = "damage_match",
                description = "Final damage values must match",
                validator = function(ts_result, lua_result)
                    return ts_result.damage == lua_result.damage
                end
            },
            {
                name = "base_damage_match", 
                description = "Base damage before modifiers must match",
                validator = function(ts_result, lua_result)
                    return ts_result.base_damage == lua_result.base_damage
                end
            }
        }
    })
end

function ParityValidator.createTypeEffectivenessValidation(suite_name)
    ParityValidator.addValidation(suite_name, "type_effectiveness", {
        description = "Validate type effectiveness calculations",
        critical = false,
        weight = 1.0,
        test_data_generator = function()
            local types = { "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", 
                          "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy" }
            
            local test_cases = {}
            local case_id = 1
            
            -- Test all type combinations
            for _, attacking_type in ipairs(types) do
                for _, defending_type in ipairs(types) do
                    table.insert(test_cases, {
                        id = "type_effectiveness_" .. case_id,
                        attacking_type = attacking_type,
                        defending_type = defending_type
                    })
                    case_id = case_id + 1
                end
            end
            
            -- Test dual-type scenarios
            for i = 1, 50 do -- Sample of dual-type combinations
                local type1 = types[math.random(#types)]
                local type2 = types[math.random(#types)]
                local attacking = types[math.random(#types)]
                
                table.insert(test_cases, {
                    id = "dual_type_" .. i,
                    attacking_type = attacking,
                    defending_types = { type1, type2 }
                })
            end
            
            return test_cases
        end,
        lua_function = function(test_input)
            -- Mock type effectiveness chart
            local effectiveness_chart = {
                fire = { grass = 2.0, ice = 2.0, bug = 2.0, steel = 2.0, water = 0.5, fire = 0.5, rock = 0.5, dragon = 0.5 },
                water = { fire = 2.0, ground = 2.0, rock = 2.0, water = 0.5, grass = 0.5, dragon = 0.5 },
                grass = { water = 2.0, ground = 2.0, rock = 2.0, fire = 0.5, grass = 0.5, poison = 0.5, flying = 0.5, bug = 0.5, dragon = 0.5, steel = 0.5 },
                electric = { water = 2.0, flying = 2.0, electric = 0.5, grass = 0.5, dragon = 0.5, ground = 0.0 }
                -- ... (abbreviated for brevity)
            }
            
            local attacking_type = test_input.attacking_type
            local defending_types = test_input.defending_types or { test_input.defending_type }
            
            local total_effectiveness = 1.0
            
            for _, defending_type in ipairs(defending_types) do
                local type_effectiveness = 1.0
                
                if effectiveness_chart[attacking_type] and effectiveness_chart[attacking_type][defending_type] then
                    type_effectiveness = effectiveness_chart[attacking_type][defending_type]
                end
                
                total_effectiveness = total_effectiveness * type_effectiveness
            end
            
            return {
                effectiveness = total_effectiveness,
                attacking_type = attacking_type,
                defending_types = defending_types,
                is_immune = total_effectiveness == 0.0,
                is_not_very_effective = total_effectiveness < 1.0,
                is_super_effective = total_effectiveness > 1.0
            }
        end
    })
end

function ParityValidator.createRNGValidation(suite_name)
    ParityValidator.addValidation(suite_name, "rng_determinism", {
        description = "Validate RNG determinism and reproducibility",
        critical = true,
        weight = 2.5,
        test_data_generator = function()
            local test_cases = {}
            
            -- Test various seed values
            local seeds = { 12345, 67890, 999999, 1, 0, 2147483647 }
            
            for i, seed in ipairs(seeds) do
                table.insert(test_cases, {
                    id = "rng_seed_" .. i,
                    seed = seed,
                    sequence_length = 100,
                    min_value = 1,
                    max_value = 100
                })
            end
            
            return test_cases
        end,
        lua_function = function(test_input)
            -- Mock deterministic RNG using simple LCG
            local seed = test_input.seed
            local sequence_length = test_input.sequence_length
            local min_value = test_input.min_value
            local max_value = test_input.max_value
            
            local function simple_rng(s)
                -- Linear Congruential Generator
                return (s * 1103515245 + 12345) % (2^31)
            end
            
            local sequence = {}
            local current_seed = seed
            
            for i = 1, sequence_length do
                current_seed = simple_rng(current_seed)
                local value = (current_seed % (max_value - min_value + 1)) + min_value
                table.insert(sequence, value)
            end
            
            return {
                seed = seed,
                sequence = sequence,
                sequence_length = #sequence,
                first_value = sequence[1],
                last_value = sequence[#sequence]
            }
        end,
        validation_rules = {
            {
                name = "sequence_match",
                description = "Complete RNG sequences must match",
                validator = function(ts_result, lua_result)
                    if #ts_result.sequence ~= #lua_result.sequence then
                        return false
                    end
                    
                    for i = 1, #ts_result.sequence do
                        if ts_result.sequence[i] ~= lua_result.sequence[i] then
                            return false
                        end
                    end
                    
                    return true
                end
            },
            {
                name = "deterministic_reproduction",
                description = "Same seed must produce same sequence",
                validator = function(ts_result, lua_result)
                    return ts_result.first_value == lua_result.first_value and 
                           ts_result.last_value == lua_result.last_value
                end
            }
        }
    })
end

-- Validation execution
function ParityValidator.runValidationSuite(suite_name, options)
    options = options or {}
    
    local suite = validation_suites[suite_name]
    if not suite then
        error("Validation suite '" .. suite_name .. "' not found")
    end
    
    local results = {
        suite_name = suite_name,
        start_time = os.clock(),
        end_time = nil,
        execution_time = 0,
        validation_count = #suite.validations,
        passed_count = 0,
        failed_count = 0,
        skipped_count = 0,
        parity_rate = 0.0,
        critical_failures = 0,
        validation_results = {},
        overall_success = false,
        artifacts = {}
    }
    
    -- Run setup if provided
    if suite.setup then
        local success, error_msg = pcall(suite.setup)
        if not success then
            results.setup_error = error_msg
            results.end_time = os.clock()
            results.execution_time = (results.end_time - results.start_time) * 1000
            return results
        end
    end
    
    -- Run each validation
    for _, validation in ipairs(suite.validations) do
        local validation_result = ParityValidator.runSingleValidation(validation, options)
        
        results.validation_results[validation.name] = validation_result
        
        if validation_result.status == "passed" then
            results.passed_count = results.passed_count + 1
        elseif validation_result.status == "failed" then
            results.failed_count = results.failed_count + 1
            if validation.critical then
                results.critical_failures = results.critical_failures + 1
            end
        elseif validation_result.status == "skipped" then
            results.skipped_count = results.skipped_count + 1
        end
    end
    
    -- Run teardown if provided
    if suite.teardown then
        pcall(suite.teardown)
    end
    
    results.end_time = os.clock()
    results.execution_time = (results.end_time - results.start_time) * 1000
    results.parity_rate = results.validation_count > 0 and (results.passed_count / results.validation_count) or 0.0
    results.overall_success = results.parity_rate >= suite.expected_parity_rate and results.critical_failures == 0
    
    -- Store results
    validation_results[suite_name] = validation_results[suite_name] or {}
    table.insert(validation_results[suite_name], results)
    
    return results
end

function ParityValidator.runSingleValidation(validation, options)
    local result = {
        name = validation.name,
        status = "unknown",
        start_time = os.clock(),
        end_time = nil,
        execution_time = 0,
        test_case_results = {},
        parity_achieved = false,
        error_message = nil,
        statistics = {
            total_tests = 0,
            passed_tests = 0,
            failed_tests = 0,
            parity_rate = 0.0
        }
    }
    
    -- Generate or use provided test cases
    local test_cases = validation.test_cases
    if validation.test_data_generator then
        local success, generated_cases = pcall(validation.test_data_generator)
        if success then
            test_cases = generated_cases
        else
            result.status = "failed"
            result.error_message = "Test data generation failed: " .. tostring(generated_cases)
            result.end_time = os.clock()
            result.execution_time = (result.end_time - result.start_time) * 1000
            return result
        end
    end
    
    if not test_cases or #test_cases == 0 then
        result.status = "skipped"
        result.error_message = "No test cases available"
        result.end_time = os.clock()
        result.execution_time = (result.end_time - result.start_time) * 1000
        return result
    end
    
    -- Run test cases
    result.statistics.total_tests = #test_cases
    
    for _, test_case in ipairs(test_cases) do
        local test_result = ParityValidator.runValidationTestCase(validation, test_case)
        result.test_case_results[test_case.id or ("case_" .. _)] = test_result
        
        if test_result.parity_achieved then
            result.statistics.passed_tests = result.statistics.passed_tests + 1
        else
            result.statistics.failed_tests = result.statistics.failed_tests + 1
        end
    end
    
    result.statistics.parity_rate = result.statistics.total_tests > 0 and 
        (result.statistics.passed_tests / result.statistics.total_tests) or 0.0
    
    -- Determine overall validation status
    result.parity_achieved = result.statistics.parity_rate >= (validation.expected_parity_rate or 1.0)
    result.status = result.parity_achieved and "passed" or "failed"
    
    result.end_time = os.clock()
    result.execution_time = (result.end_time - result.start_time) * 1000
    
    return result
end

function ParityValidator.runValidationTestCase(validation, test_case)
    local test_result = {
        test_case_id = test_case.id,
        parity_achieved = false,
        typescript_result = nil,
        lua_result = nil,
        comparison_details = nil,
        execution_times = {},
        errors = {},
        rule_validation_results = {}
    }
    
    -- Execute TypeScript implementation (simulated)
    local ts_start = os.clock()
    local ts_success, ts_result = pcall(function()
        if validation.typescript_function then
            return validation.typescript_function(test_case)
        else
            -- Use comparison engine's mock implementation
            return ComparisonEngine.simulateTypeScriptExecution(validation.name, test_case)
        end
    end)
    test_result.execution_times.typescript = (os.clock() - ts_start) * 1000
    
    if ts_success then
        test_result.typescript_result = ts_result
    else
        table.insert(test_result.errors, { implementation = "typescript", error = ts_result })
    end
    
    -- Execute Lua implementation
    local lua_start = os.clock()
    local lua_success, lua_result = pcall(validation.lua_function, test_case)
    test_result.execution_times.lua = (os.clock() - lua_start) * 1000
    
    if lua_success then
        test_result.lua_result = lua_result
    else
        table.insert(test_result.errors, { implementation = "lua", error = lua_result })
    end
    
    -- Compare results if both succeeded
    if ts_success and lua_success then
        -- Use comparison engine for detailed comparison
        local comparison_context = { depth = 0, mismatches = {} }
        local basic_parity = ComparisonEngine.compareValues(ts_result, lua_result, "result", comparison_context)
        test_result.comparison_details = comparison_context
        
        -- Apply custom validation rules if provided
        local rule_success = true
        if validation.validation_rules then
            for _, rule in ipairs(validation.validation_rules) do
                local rule_result = {
                    name = rule.name,
                    description = rule.description,
                    passed = false,
                    error = nil
                }
                
                local success, rule_passed = pcall(rule.validator, ts_result, lua_result)
                if success then
                    rule_result.passed = rule_passed
                    if not rule_passed then
                        rule_success = false
                    end
                else
                    rule_result.error = rule_passed
                    rule_success = false
                end
                
                test_result.rule_validation_results[rule.name] = rule_result
            end
        end
        
        test_result.parity_achieved = basic_parity and rule_success
    end
    
    return test_result
end

-- Reporting and utilities
function ParityValidator.generateValidationReport(suite_name, format)
    format = format or "text"
    
    local suite_results = validation_results[suite_name]
    if not suite_results then
        return "No validation results found for suite: " .. suite_name
    end
    
    local latest_results = suite_results[#suite_results]
    
    local report = {
        suite_name = suite_name,
        timestamp = os.date("%Y-%m-%d %H:%M:%S"),
        overall_success = latest_results.overall_success,
        parity_rate = latest_results.parity_rate,
        execution_time = latest_results.execution_time,
        validation_summary = {
            total = latest_results.validation_count,
            passed = latest_results.passed_count,
            failed = latest_results.failed_count,
            skipped = latest_results.skipped_count,
            critical_failures = latest_results.critical_failures
        },
        validation_details = latest_results.validation_results,
        config = config
    }
    
    if format == "json" then
        return ComparisonEngine.formatJSON(report)
    else
        return ParityValidator.formatValidationReportText(report)
    end
end

function ParityValidator.formatValidationReportText(report)
    local lines = {
        "=== Parity Validation Report: " .. report.suite_name .. " ===",
        "Generated: " .. report.timestamp,
        "Overall Success: " .. (report.overall_success and "✅ PASSED" or "❌ FAILED"),
        "Parity Rate: " .. string.format("%.1f%%", report.parity_rate * 100),
        "Execution Time: " .. string.format("%.3fms", report.execution_time),
        "",
        "Validation Summary:",
        "  Total Validations: " .. report.validation_summary.total,
        "  Passed: " .. report.validation_summary.passed,
        "  Failed: " .. report.validation_summary.failed,
        "  Skipped: " .. report.validation_summary.skipped,
        "  Critical Failures: " .. report.validation_summary.critical_failures,
        ""
    }
    
    -- Show failed validations first
    if report.validation_summary.failed > 0 then
        table.insert(lines, "Failed Validations:")
        for validation_name, validation_result in pairs(report.validation_details) do
            if validation_result.status == "failed" then
                table.insert(lines, "  ❌ " .. validation_name .. " (Parity: " .. 
                    string.format("%.1f%%", validation_result.statistics.parity_rate * 100) .. ")")
                
                if validation_result.error_message then
                    table.insert(lines, "    Error: " .. validation_result.error_message)
                end
                
                -- Show sample failed test cases
                local failed_samples = 0
                for test_case_id, test_result in pairs(validation_result.test_case_results) do
                    if not test_result.parity_achieved and failed_samples < 3 then
                        table.insert(lines, "    • " .. test_case_id .. ": Failed")
                        if test_result.comparison_details and test_result.comparison_details.mismatches then
                            for _, mismatch in ipairs(test_result.comparison_details.mismatches) do
                                if failed_samples == 0 then -- Only show details for first failure
                                    table.insert(lines, "      - " .. mismatch.path .. ": " .. mismatch.message)
                                end
                            end
                        end
                        failed_samples = failed_samples + 1
                    end
                end
            end
        end
        table.insert(lines, "")
    end
    
    -- Show passed validations
    if report.validation_summary.passed > 0 then
        table.insert(lines, "Passed Validations:")
        for validation_name, validation_result in pairs(report.validation_details) do
            if validation_result.status == "passed" then
                table.insert(lines, "  ✅ " .. validation_name .. " (" .. 
                    validation_result.statistics.total_tests .. " test cases)")
            end
        end
    end
    
    return table.concat(lines, "\n")
end

-- Utility functions
function ParityValidator.reset(suite_name)
    if suite_name then
        validation_suites[suite_name] = nil
        validation_results[suite_name] = nil
        critical_validations[suite_name] = nil
    else
        validation_suites = {}
        validation_results = {}
        critical_validations = {}
        validation_schedules = {}
    end
end

function ParityValidator.configure(new_config)
    for k, v in pairs(new_config) do
        config[k] = v
    end
end

function ParityValidator.getValidationSuites()
    local suites = {}
    for name, suite in pairs(validation_suites) do
        table.insert(suites, {
            name = name,
            description = suite.description,
            critical = suite.critical,
            validation_count = #suite.validations,
            tags = suite.tags
        })
    end
    return suites
end

function ParityValidator.getValidationResults(suite_name)
    return validation_results[suite_name]
end

function ParityValidator.isEnabled()
    return config.enabled
end

return ParityValidator