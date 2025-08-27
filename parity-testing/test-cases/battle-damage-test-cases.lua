-- Battle Damage Calculation Test Cases
-- Comprehensive test suite for damage formula parity validation

local BattleDamageTestCases = {}

-- Configuration
local config = {
    comprehensive_mode = true,
    include_modifiers = true,
    include_critical_hits = true,
    include_type_effectiveness = true,
    include_weather_effects = true,
    random_case_count = 200
}

-- Core damage calculation test cases
function BattleDamageTestCases.generateBasicDamageCases()
    local test_cases = {}
    local case_id = 1
    
    -- Basic parameter ranges for comprehensive testing
    local levels = { 1, 5, 25, 50, 75, 100 }
    local attack_stats = { 10, 50, 100, 150, 200, 300, 500 }
    local defense_stats = { 10, 50, 100, 150, 200, 300, 500 }
    local base_powers = { 20, 40, 60, 80, 100, 120, 150, 200 }
    
    -- Generate basic damage calculation combinations
    for _, level in ipairs(levels) do
        for _, attack in ipairs(attack_stats) do
            for _, defense in ipairs(defense_stats) do
                for _, power in ipairs(base_powers) do
                    -- Skip extreme combinations that might cause overflow
                    if not (attack > 400 and defense < 20 and power > 150) then
                        table.insert(test_cases, {
                            id = "basic_damage_" .. case_id,
                            category = "basic_damage",
                            description = string.format("Basic damage: Level %d, Attack %d, Defense %d, Power %d", 
                                level, attack, defense, power),
                            input = {
                                level = level,
                                attack = attack,
                                defense = defense,
                                base_power = power,
                                type_effectiveness = 1.0,
                                stab = 1.0,
                                critical_hit = false,
                                random_factor = 1.0,
                                weather_modifier = 1.0,
                                item_modifier = 1.0,
                                ability_modifier = 1.0,
                                other_modifiers = 1.0
                            },
                            expected_properties = {
                                damage_is_positive = true,
                                damage_is_integer = true,
                                follows_damage_formula = true
                            },
                            tags = { "basic_damage", "core_formula" }
                        })
                        case_id = case_id + 1
                    end
                end
            end
        end
    end
    
    return test_cases
end

-- Type effectiveness test cases
function BattleDamageTestCases.generateTypeEffectivenessCases()
    local test_cases = {}
    local case_id = 1000
    
    local effectiveness_values = { 0.0, 0.25, 0.5, 1.0, 2.0, 4.0 }
    local effectiveness_names = { "immune", "quarter_damage", "half_damage", "normal", "super_effective", "ultra_effective" }
    
    local base_scenario = {
        level = 50,
        attack = 100,
        defense = 100,
        base_power = 80,
        stab = 1.0,
        critical_hit = false,
        random_factor = 1.0,
        weather_modifier = 1.0,
        item_modifier = 1.0
    }
    
    for i, effectiveness in ipairs(effectiveness_values) do
        local scenario = {}
        for k, v in pairs(base_scenario) do
            scenario[k] = v
        end
        scenario.type_effectiveness = effectiveness
        
        table.insert(test_cases, {
            id = "type_effectiveness_" .. case_id,
            category = "type_effectiveness",
            description = "Type effectiveness: " .. effectiveness_names[i] .. " (" .. effectiveness .. "x)",
            input = scenario,
            expected_properties = {
                respects_type_chart = true,
                immune_deals_zero = effectiveness == 0.0,
                super_effective_increases_damage = effectiveness > 1.0
            },
            tags = { "type_effectiveness", effectiveness_names[i] }
        })
        case_id = case_id + 1
    end
    
    return test_cases
end

-- Critical hit test cases
function BattleDamageTestCases.generateCriticalHitCases()
    local test_cases = {}
    local case_id = 2000
    
    local base_scenario = {
        level = 50,
        attack = 100,
        defense = 100,
        base_power = 80,
        type_effectiveness = 1.0,
        stab = 1.5,
        random_factor = 1.0,
        weather_modifier = 1.0,
        item_modifier = 1.0
    }
    
    -- Test critical hit vs non-critical hit
    local crit_scenarios = {
        { name = "no_crit", critical_hit = false },
        { name = "critical_hit", critical_hit = true }
    }
    
    for _, crit_scenario in ipairs(crit_scenarios) do
        local scenario = {}
        for k, v in pairs(base_scenario) do
            scenario[k] = v
        end
        scenario.critical_hit = crit_scenario.critical_hit
        
        table.insert(test_cases, {
            id = "critical_hit_" .. case_id,
            category = "critical_hits", 
            description = "Critical hit test: " .. crit_scenario.name,
            input = scenario,
            expected_properties = {
                critical_increases_damage = crit_scenario.critical_hit,
                damage_is_consistent = true
            },
            tags = { "critical_hits", crit_scenario.name }
        })
        case_id = case_id + 1
    end
    
    return test_cases
end

-- STAB (Same Type Attack Bonus) test cases
function BattleDamageTestCases.generateSTABCases()
    local test_cases = {}
    local case_id = 3000
    
    local stab_values = { 1.0, 1.5, 2.0 }
    local stab_names = { "no_stab", "normal_stab", "adaptability_stab" }
    
    local base_scenario = {
        level = 50,
        attack = 120,
        defense = 80,
        base_power = 90,
        type_effectiveness = 1.0,
        critical_hit = false,
        random_factor = 1.0,
        weather_modifier = 1.0,
        item_modifier = 1.0
    }
    
    for i, stab in ipairs(stab_values) do
        local scenario = {}
        for k, v in pairs(base_scenario) do
            scenario[k] = v
        end
        scenario.stab = stab
        
        table.insert(test_cases, {
            id = "stab_" .. case_id,
            category = "stab",
            description = "STAB test: " .. stab_names[i] .. " (" .. stab .. "x)",
            input = scenario,
            expected_properties = {
                stab_increases_damage = stab > 1.0,
                damage_scales_with_stab = true
            },
            tags = { "stab", stab_names[i] }
        })
        case_id = case_id + 1
    end
    
    return test_cases
end

-- Weather effect test cases
function BattleDamageTestCases.generateWeatherCases()
    local test_cases = {}
    local case_id = 4000
    
    local weather_scenarios = {
        { name = "no_weather", modifier = 1.0 },
        { name = "sun_fire_boost", modifier = 1.5, move_type = "fire" },
        { name = "sun_water_nerf", modifier = 0.5, move_type = "water" },
        { name = "rain_water_boost", modifier = 1.5, move_type = "water" },
        { name = "rain_fire_nerf", modifier = 0.5, move_type = "fire" },
        { name = "sandstorm_rock_boost", modifier = 1.5, move_type = "rock" },
        { name = "hail_no_effect", modifier = 1.0, move_type = "ice" }
    }
    
    local base_scenario = {
        level = 50,
        attack = 100,
        defense = 100,
        base_power = 80,
        type_effectiveness = 1.0,
        stab = 1.0,
        critical_hit = false,
        random_factor = 1.0,
        item_modifier = 1.0
    }
    
    for _, weather in ipairs(weather_scenarios) do
        local scenario = {}
        for k, v in pairs(base_scenario) do
            scenario[k] = v
        end
        scenario.weather_modifier = weather.modifier
        scenario.move_type = weather.move_type
        
        table.insert(test_cases, {
            id = "weather_" .. case_id,
            category = "weather_effects",
            description = "Weather test: " .. weather.name,
            input = scenario,
            expected_properties = {
                weather_affects_damage = weather.modifier ~= 1.0,
                modifier_applied_correctly = true
            },
            tags = { "weather_effects", weather.name, weather.move_type or "typeless" }
        })
        case_id = case_id + 1
    end
    
    return test_cases
end

-- Item modifier test cases
function BattleDamageTestCases.generateItemCases()
    local test_cases = {}
    local case_id = 5000
    
    local item_scenarios = {
        { name = "no_item", modifier = 1.0 },
        { name = "choice_band", modifier = 1.5, affects = "physical" },
        { name = "choice_specs", modifier = 1.5, affects = "special" },
        { name = "life_orb", modifier = 1.3, affects = "all" },
        { name = "expert_belt", modifier = 1.2, affects = "super_effective" },
        { name = "type_gem", modifier = 1.3, affects = "specific_type" },
        { name = "muscle_band", modifier = 1.1, affects = "physical" },
        { name = "wise_glasses", modifier = 1.1, affects = "special" }
    }
    
    local base_scenario = {
        level = 50,
        attack = 100,
        defense = 100,
        base_power = 80,
        type_effectiveness = 1.0,
        stab = 1.0,
        critical_hit = false,
        random_factor = 1.0,
        weather_modifier = 1.0
    }
    
    for _, item in ipairs(item_scenarios) do
        local scenario = {}
        for k, v in pairs(base_scenario) do
            scenario[k] = v
        end
        scenario.item_modifier = item.modifier
        scenario.item_type = item.affects
        
        table.insert(test_cases, {
            id = "item_" .. case_id,
            category = "item_modifiers",
            description = "Item test: " .. item.name,
            input = scenario,
            expected_properties = {
                item_boosts_damage = item.modifier > 1.0,
                modifier_correct = true
            },
            tags = { "item_modifiers", item.name, item.affects }
        })
        case_id = case_id + 1
    end
    
    return test_cases
end

-- Random factor test cases
function BattleDamageTestCases.generateRandomFactorCases()
    local test_cases = {}
    local case_id = 6000
    
    -- Test all possible random factors (85% to 100%)
    local random_factors = {}
    for i = 85, 100 do
        table.insert(random_factors, i / 100)
    end
    
    local base_scenario = {
        level = 50,
        attack = 100,
        defense = 100,
        base_power = 80,
        type_effectiveness = 1.0,
        stab = 1.0,
        critical_hit = false,
        weather_modifier = 1.0,
        item_modifier = 1.0
    }
    
    for _, random_factor in ipairs(random_factors) do
        local scenario = {}
        for k, v in pairs(base_scenario) do
            scenario[k] = v
        end
        scenario.random_factor = random_factor
        
        table.insert(test_cases, {
            id = "random_" .. case_id,
            category = "random_factors",
            description = string.format("Random factor test: %.2f", random_factor),
            input = scenario,
            expected_properties = {
                damage_varies_with_random = true,
                random_factor_applied = true
            },
            tags = { "random_factors", "deterministic" }
        })
        case_id = case_id + 1
    end
    
    return test_cases
end

-- Edge cases and boundary conditions
function BattleDamageTestCases.generateEdgeCases()
    local test_cases = {}
    local case_id = 7000
    
    local edge_scenarios = {
        {
            name = "minimum_damage",
            input = {
                level = 1, attack = 1, defense = 999, base_power = 1,
                type_effectiveness = 0.25, stab = 1.0, critical_hit = false,
                random_factor = 0.85, weather_modifier = 0.5, item_modifier = 1.0
            }
        },
        {
            name = "maximum_damage",
            input = {
                level = 100, attack = 999, defense = 1, base_power = 200,
                type_effectiveness = 4.0, stab = 2.0, critical_hit = true,
                random_factor = 1.0, weather_modifier = 1.5, item_modifier = 1.3
            }
        },
        {
            name = "immune_damage",
            input = {
                level = 50, attack = 200, defense = 100, base_power = 100,
                type_effectiveness = 0.0, stab = 1.5, critical_hit = true,
                random_factor = 1.0, weather_modifier = 1.0, item_modifier = 1.0
            }
        },
        {
            name = "zero_attack",
            input = {
                level = 50, attack = 0, defense = 100, base_power = 80,
                type_effectiveness = 1.0, stab = 1.0, critical_hit = false,
                random_factor = 1.0, weather_modifier = 1.0, item_modifier = 1.0
            }
        },
        {
            name = "zero_base_power",
            input = {
                level = 50, attack = 100, defense = 100, base_power = 0,
                type_effectiveness = 1.0, stab = 1.0, critical_hit = false,
                random_factor = 1.0, weather_modifier = 1.0, item_modifier = 1.0
            }
        },
        {
            name = "extreme_defense",
            input = {
                level = 50, attack = 100, defense = 999, base_power = 80,
                type_effectiveness = 1.0, stab = 1.0, critical_hit = false,
                random_factor = 1.0, weather_modifier = 1.0, item_modifier = 1.0
            }
        }
    }
    
    for _, edge_case in ipairs(edge_scenarios) do
        table.insert(test_cases, {
            id = "edge_" .. case_id,
            category = "edge_cases",
            description = "Edge case: " .. edge_case.name,
            input = edge_case.input,
            expected_properties = {
                handles_edge_case = true,
                no_overflow_or_underflow = true,
                damage_is_non_negative = true
            },
            tags = { "edge_cases", edge_case.name }
        })
        case_id = case_id + 1
    end
    
    return test_cases
end

-- Complex modifier combination cases
function BattleDamageTestCases.generateComplexCases()
    local test_cases = {}
    local case_id = 8000
    
    local complex_scenarios = {
        {
            name = "all_boosting_modifiers",
            input = {
                level = 75, attack = 150, defense = 75, base_power = 120,
                type_effectiveness = 2.0, stab = 1.5, critical_hit = true,
                random_factor = 1.0, weather_modifier = 1.5, item_modifier = 1.3,
                ability_modifier = 1.2, other_modifiers = 1.1
            }
        },
        {
            name = "all_reducing_modifiers", 
            input = {
                level = 25, attack = 75, defense = 150, base_power = 60,
                type_effectiveness = 0.5, stab = 1.0, critical_hit = false,
                random_factor = 0.85, weather_modifier = 0.5, item_modifier = 1.0,
                ability_modifier = 0.5, other_modifiers = 0.75
            }
        },
        {
            name = "mixed_modifiers",
            input = {
                level = 50, attack = 120, defense = 90, base_power = 90,
                type_effectiveness = 2.0, stab = 1.0, critical_hit = true,
                random_factor = 0.92, weather_modifier = 0.5, item_modifier = 1.5,
                ability_modifier = 1.0, other_modifiers = 0.8
            }
        },
        {
            name = "competitive_scenario",
            input = {
                level = 50, attack = 194, defense = 156, base_power = 100,
                type_effectiveness = 1.0, stab = 1.5, critical_hit = false,
                random_factor = 0.96, weather_modifier = 1.0, item_modifier = 1.3,
                ability_modifier = 1.0, other_modifiers = 1.0
            }
        }
    }
    
    for _, scenario in ipairs(complex_scenarios) do
        table.insert(test_cases, {
            id = "complex_" .. case_id,
            category = "complex_modifiers",
            description = "Complex case: " .. scenario.name,
            input = scenario.input,
            expected_properties = {
                handles_multiple_modifiers = true,
                order_of_operations_correct = true,
                realistic_damage_output = true
            },
            tags = { "complex_modifiers", scenario.name }
        })
        case_id = case_id + 1
    end
    
    return test_cases
end

-- Generate random test cases for broad coverage
function BattleDamageTestCases.generateRandomCases()
    local test_cases = {}
    local case_id = 9000
    
    -- Fixed seed for reproducible random tests
    math.randomseed(54321)
    
    local type_effectiveness_values = { 0.0, 0.25, 0.5, 1.0, 2.0, 4.0 }
    local stab_values = { 1.0, 1.5, 2.0 }
    local weather_values = { 0.5, 1.0, 1.5 }
    local item_values = { 1.0, 1.1, 1.2, 1.3, 1.5 }
    
    for i = 1, config.random_case_count do
        local level = math.random(1, 100)
        local attack = math.random(10, 500)
        local defense = math.random(10, 500)
        local base_power = math.random(20, 200)
        local type_effectiveness = type_effectiveness_values[math.random(#type_effectiveness_values)]
        local stab = stab_values[math.random(#stab_values)]
        local critical_hit = math.random() > 0.8 -- 20% chance
        local random_factor = (math.random(85, 100)) / 100
        local weather_modifier = weather_values[math.random(#weather_values)]
        local item_modifier = item_values[math.random(#item_values)]
        
        table.insert(test_cases, {
            id = "random_damage_" .. case_id,
            category = "random_coverage",
            description = string.format("Random damage case %d", i),
            input = {
                level = level,
                attack = attack,
                defense = defense,
                base_power = base_power,
                type_effectiveness = type_effectiveness,
                stab = stab,
                critical_hit = critical_hit,
                random_factor = random_factor,
                weather_modifier = weather_modifier,
                item_modifier = item_modifier
            },
            expected_properties = {
                produces_reasonable_damage = true,
                follows_damage_formula = true
            },
            tags = { "random_coverage", "comprehensive" }
        })
        case_id = case_id + 1
    end
    
    return test_cases
end

-- Main function to generate all test cases
function BattleDamageTestCases.generateAllTestCases()
    local all_test_cases = {}
    
    -- Generate all categories
    local basic_cases = BattleDamageTestCases.generateBasicDamageCases()
    local type_cases = BattleDamageTestCases.generateTypeEffectivenessCases()
    local crit_cases = BattleDamageTestCases.generateCriticalHitCases()
    local stab_cases = BattleDamageTestCases.generateSTABCases()
    local weather_cases = BattleDamageTestCases.generateWeatherCases()
    local item_cases = BattleDamageTestCases.generateItemCases()
    local random_factor_cases = BattleDamageTestCases.generateRandomFactorCases()
    local edge_cases = BattleDamageTestCases.generateEdgeCases()
    local complex_cases = BattleDamageTestCases.generateComplexCases()
    local random_cases = BattleDamageTestCases.generateRandomCases()
    
    -- Combine all cases
    local case_categories = {
        { name = "basic_damage", cases = basic_cases },
        { name = "type_effectiveness", cases = type_cases },
        { name = "critical_hits", cases = crit_cases },
        { name = "stab", cases = stab_cases },
        { name = "weather_effects", cases = weather_cases },
        { name = "item_modifiers", cases = item_cases },
        { name = "random_factors", cases = random_factor_cases },
        { name = "edge_cases", cases = edge_cases },
        { name = "complex_modifiers", cases = complex_cases },
        { name = "random_coverage", cases = random_cases }
    }
    
    local category_counts = {}
    
    for _, category in ipairs(case_categories) do
        category_counts[category.name] = #category.cases
        for _, test_case in ipairs(category.cases) do
            table.insert(all_test_cases, test_case)
        end
    end
    
    return {
        suite_name = "battle_damage_calculations",
        description = "Comprehensive battle damage calculation test cases",
        generated_at = os.date("%Y-%m-%d %H:%M:%S"),
        configuration = config,
        total_test_cases = #all_test_cases,
        category_counts = category_counts,
        test_cases = all_test_cases
    }
end

-- Configuration and utility functions
function BattleDamageTestCases.configure(new_config)
    for k, v in pairs(new_config) do
        config[k] = v
    end
end

function BattleDamageTestCases.getConfiguration()
    return config
end

function BattleDamageTestCases.validateTestCase(test_case)
    local validation = {
        valid = true,
        errors = {},
        warnings = {}
    }
    
    if not test_case.input then
        table.insert(validation.errors, "Missing input data")
        validation.valid = false
        return validation
    end
    
    local input = test_case.input
    
    -- Validate required fields
    local required_fields = { "level", "attack", "defense", "base_power" }
    for _, field in ipairs(required_fields) do
        if not input[field] then
            table.insert(validation.errors, "Missing required field: " .. field)
            validation.valid = false
        end
    end
    
    -- Validate ranges
    if input.level and (input.level < 1 or input.level > 100) then
        table.insert(validation.errors, "Level out of range: " .. input.level)
        validation.valid = false
    end
    
    if input.attack and input.attack < 0 then
        table.insert(validation.errors, "Attack cannot be negative: " .. input.attack)
        validation.valid = false
    end
    
    if input.defense and input.defense < 1 then
        table.insert(validation.warnings, "Defense is very low: " .. input.defense)
    end
    
    if input.base_power and input.base_power < 0 then
        table.insert(validation.errors, "Base power cannot be negative: " .. input.base_power)
        validation.valid = false
    end
    
    -- Validate modifiers
    if input.type_effectiveness and input.type_effectiveness < 0 then
        table.insert(validation.errors, "Type effectiveness cannot be negative: " .. input.type_effectiveness)
        validation.valid = false
    end
    
    return validation
end

return BattleDamageTestCases