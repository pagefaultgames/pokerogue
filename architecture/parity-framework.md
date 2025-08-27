# Parity Framework Documentation

## Overview

The Parity Framework ensures behavioral consistency between TypeScript (client-side) and Lua (AO process) implementations of game logic. This is critical for maintaining game integrity and preventing exploits.

## Architecture

### Core Components

```
TypeScript Implementation ←→ Parity Framework ←→ Lua Implementation
        (Client)                                      (AO Process)
```

The framework runs identical test scenarios against both implementations and validates that results match within acceptable tolerances.

## Implementation Details

### 1. Test Scenario Definition

Test scenarios are defined in a language-agnostic format that both TypeScript and Lua can consume:

```lua
-- parity-testing/test-cases/battle-damage-scenarios.lua
local BattleDamageScenarios = {
  {
    id = "basic_damage_calculation",
    name = "Basic Damage Calculation - Tackle",
    description = "Standard physical move with no type advantages",
    
    input = {
      attacker = {
        species = "PIKACHU",
        level = 50,
        base_stats = { attack = 55, defense = 40, hp = 35, sp_attack = 50, sp_defense = 50, speed = 90 },
        ivs = { attack = 31, defense = 31, hp = 31, sp_attack = 31, sp_defense = 31, speed = 31 },
        evs = { attack = 0, defense = 0, hp = 0, sp_attack = 0, sp_defense = 0, speed = 0 },
        nature = "HARDY", -- No stat modifications
        level = 50,
        status_conditions = {},
        held_item = nil
      },
      
      defender = {
        species = "CHARMANDER", 
        level = 50,
        base_stats = { attack = 52, defense = 43, hp = 39, sp_attack = 60, sp_defense = 50, speed = 65 },
        ivs = { attack = 31, defense = 31, hp = 31, sp_attack = 31, sp_defense = 31, speed = 31 },
        evs = { attack = 0, defense = 0, hp = 0, sp_attack = 0, sp_defense = 0, speed = 0 },
        nature = "HARDY",
        level = 50,
        status_conditions = {},
        held_item = nil,
        current_hp_percentage = 1.0
      },
      
      move = {
        name = "TACKLE",
        type = "NORMAL",
        category = "PHYSICAL", -- PHYSICAL, SPECIAL, STATUS
        power = 40,
        accuracy = 100,
        priority = 0,
        effects = {}
      },
      
      battle_conditions = {
        weather = "NONE",
        terrain = "NONE", 
        field_effects = {},
        is_critical_hit = false, -- For deterministic testing
        random_factor = 0.85 -- Fixed damage roll (85/100)
      }
    },
    
    expected_output = {
      damage_range = { min = 18, max = 22 }, -- Expected range with fixed roll
      actual_damage = 20, -- With random_factor = 0.85
      effectiveness = "NORMAL", -- 1x effectiveness
      critical_hit = false,
      additional_effects = {}
    },
    
    tolerance = {
      damage_variance = 1, -- ±1 HP acceptable difference
      percentage_variance = 0.05 -- ±5% acceptable difference
    }
  }
}

return BattleDamageScenarios
```

### 2. TypeScript Test Runner

```typescript
// parity-testing/runners/typescript-runner.ts
import { BattleCalculator } from '../src/battle/battle-calculator';
import { Pokemon } from '../src/pokemon/pokemon';
import { Move } from '../src/moves/move';

export interface ParityTestScenario {
  id: string;
  name: string;
  input: {
    attacker: PokemonData;
    defender: PokemonData;
    move: MoveData;
    battle_conditions: BattleConditions;
  };
  expected_output: ExpectedOutput;
  tolerance: ToleranceSettings;
}

export class TypeScriptParityRunner {
  private battleCalculator: BattleCalculator;
  
  constructor() {
    this.battleCalculator = new BattleCalculator();
  }
  
  public runDamageCalculation(scenario: ParityTestScenario): ParityResult {
    const startTime = performance.now();
    
    try {
      // Create Pokemon instances from scenario data
      const attacker = this.createPokemonFromData(scenario.input.attacker);
      const defender = this.createPokemonFromData(scenario.input.defender);
      const move = this.createMoveFromData(scenario.input.move);
      
      // Apply battle conditions
      this.applyBattleConditions(scenario.input.battle_conditions);
      
      // Calculate damage
      const result = this.battleCalculator.calculateDamage(
        attacker,
        defender,
        move,
        scenario.input.battle_conditions
      );
      
      const executionTime = performance.now() - startTime;
      
      return {
        success: true,
        damage: result.damage,
        effectiveness: result.effectiveness,
        critical_hit: result.criticalHit,
        additional_effects: result.additionalEffects,
        execution_time_ms: executionTime,
        implementation: 'typescript'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        execution_time_ms: performance.now() - startTime,
        implementation: 'typescript'
      };
    }
  }
  
  private createPokemonFromData(data: PokemonData): Pokemon {
    const pokemon = new Pokemon(data.species, data.level);
    
    // Set IVs
    pokemon.setIVs(data.ivs);
    
    // Set EVs  
    pokemon.setEVs(data.evs);
    
    // Set nature
    pokemon.setNature(data.nature);
    
    // Set status conditions
    if (data.status_conditions) {
      data.status_conditions.forEach(condition => {
        pokemon.applyStatusCondition(condition);
      });
    }
    
    // Set held item
    if (data.held_item) {
      pokemon.setHeldItem(data.held_item);
    }
    
    return pokemon;
  }
}

// CLI interface for aolite integration
if (require.main === module) {
  const args = process.argv.slice(2);
  const scenarioJson = args[0];
  
  if (!scenarioJson) {
    console.error('Usage: node typescript-runner.js <scenario-json>');
    process.exit(1);
  }
  
  try {
    const scenario = JSON.parse(scenarioJson);
    const runner = new TypeScriptParityRunner();
    const result = runner.runDamageCalculation(scenario);
    
    console.log(JSON.stringify(result));
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      error: error.message,
      implementation: 'typescript'
    }));
  }
}
```

### 3. Lua Test Runner (AO Process)

```lua
-- ao-processes/game-logic/parity-calculator.lua
local json = require('json')

local ParityCalculator = {}

-- Main damage calculation function that matches TypeScript implementation
function ParityCalculator.calculateDamage(attacker_data, defender_data, move_data, conditions)
  local start_time = os.clock()
  
  -- Calculate base damage using Pokemon damage formula
  local level = attacker_data.level
  local power = move_data.power
  
  -- Get effective attack stat
  local attack_stat
  if move_data.category == "PHYSICAL" then
    attack_stat = ParityCalculator.calculateStat("attack", attacker_data)
  else
    attack_stat = ParityCalculator.calculateStat("sp_attack", attacker_data)
  end
  
  -- Get effective defense stat  
  local defense_stat
  if move_data.category == "PHYSICAL" then
    defense_stat = ParityCalculator.calculateStat("defense", defender_data)
  else
    defense_stat = ParityCalculator.calculateStat("sp_defense", defender_data)
  end
  
  -- Base damage calculation: ((2 * Level / 5 + 2) * Power * Attack / Defense) / 50 + 2
  local base_damage = math.floor(((2 * level / 5 + 2) * power * attack_stat / defense_stat) / 50 + 2)
  
  -- Apply modifiers
  local modifier = 1.0
  
  -- Type effectiveness
  local effectiveness = ParityCalculator.getTypeEffectiveness(move_data.type, defender_data.types)
  modifier = modifier * effectiveness.multiplier
  
  -- Critical hit
  if conditions.is_critical_hit then
    modifier = modifier * 1.5
  end
  
  -- Weather effects
  modifier = modifier * ParityCalculator.getWeatherModifier(move_data.type, conditions.weather)
  
  -- Random factor (85-100% in real battles, fixed for parity testing)
  local random_factor = conditions.random_factor or 0.85
  modifier = modifier * random_factor
  
  -- Calculate final damage
  local final_damage = math.floor(base_damage * modifier)
  
  -- Minimum 1 damage if move hits
  if final_damage < 1 and effectiveness.multiplier > 0 then
    final_damage = 1
  end
  
  local execution_time = (os.clock() - start_time) * 1000
  
  return {
    damage = final_damage,
    effectiveness = effectiveness.name,
    critical_hit = conditions.is_critical_hit,
    base_damage = base_damage,
    modifier = modifier,
    execution_time_ms = execution_time,
    additional_effects = {},
    implementation = "lua"
  }
end

function ParityCalculator.calculateStat(stat_name, pokemon_data)
  local base = pokemon_data.base_stats[stat_name]
  local iv = pokemon_data.ivs[stat_name] or 0
  local ev = pokemon_data.evs[stat_name] or 0
  local level = pokemon_data.level
  
  -- Pokemon stat calculation formula
  if stat_name == "hp" then
    return math.floor((2 * base + iv + math.floor(ev / 4)) * level / 100) + level + 10
  else
    local stat = math.floor((2 * base + iv + math.floor(ev / 4)) * level / 100) + 5
    
    -- Apply nature modifier
    local nature_modifier = ParityCalculator.getNatureModifier(stat_name, pokemon_data.nature)
    stat = math.floor(stat * nature_modifier)
    
    return stat
  end
end

function ParityCalculator.getTypeEffectiveness(attack_type, defender_types)
  local effectiveness_chart = {
    ELECTRIC = { WATER = 2.0, FLYING = 2.0, GROUND = 0.0, GRASS = 0.5, DRAGON = 0.5, ELECTRIC = 0.5 },
    WATER = { FIRE = 2.0, GROUND = 2.0, ROCK = 2.0, WATER = 0.5, GRASS = 0.5, DRAGON = 0.5 },
    FIRE = { GRASS = 2.0, ICE = 2.0, BUG = 2.0, STEEL = 2.0, FIRE = 0.5, WATER = 0.5, ROCK = 0.5, DRAGON = 0.5 },
    -- ... complete type chart
  }
  
  local total_modifier = 1.0
  for _, defender_type in ipairs(defender_types) do
    local modifier = effectiveness_chart[attack_type] and effectiveness_chart[attack_type][defender_type] or 1.0
    total_modifier = total_modifier * modifier
  end
  
  local effectiveness_name
  if total_modifier > 1.0 then
    effectiveness_name = "SUPER_EFFECTIVE"
  elseif total_modifier < 1.0 then
    effectiveness_name = total_modifier == 0 and "NO_EFFECT" or "NOT_VERY_EFFECTIVE"
  else
    effectiveness_name = "NORMAL"
  end
  
  return {
    multiplier = total_modifier,
    name = effectiveness_name
  }
end

-- AO Handler for parity testing
Handlers.add(
  "ParityTest",
  Handlers.utils.hasMatchingTag("Action", "ParityTest"),
  function(msg)
    local test_data = json.decode(msg.Data)
    
    local result = ParityCalculator.calculateDamage(
      test_data.attacker,
      test_data.defender, 
      test_data.move,
      test_data.battle_conditions
    )
    
    ao.send({
      Target = msg.From,
      Tags = {
        Action = "ParityTestResult",
        TestId = msg.Tags.TestId or "unknown"
      },
      Data = json.encode(result)
    })
  end
)

return ParityCalculator
```

### 4. Parity Validation Engine

```lua
-- parity-testing/test-harness/parity-validator.lua
local aolite = require('development-tools.aolite.init')
local json = require('json')

local ParityValidator = {}

function ParityValidator.runParityTest(scenario)
  print(string.format("🔍 Running parity test: %s", scenario.name))
  
  -- Run TypeScript implementation
  local ts_result = ParityValidator.runTypeScriptTest(scenario)
  
  -- Run Lua implementation  
  local lua_result = ParityValidator.runLuaTest(scenario)
  
  -- Compare results
  local comparison = ParityValidator.compareResults(ts_result, lua_result, scenario.tolerance)
  
  return {
    scenario_id = scenario.id,
    scenario_name = scenario.name,
    typescript_result = ts_result,
    lua_result = lua_result,
    comparison = comparison,
    passed = comparison.overall_match
  }
end

function ParityValidator.runTypeScriptTest(scenario)
  local command = string.format(
    'node parity-testing/runners/typescript-runner.js %s',
    "'" .. json.encode(scenario):gsub("'", "'\\''") .. "'"
  )
  
  local handle = io.popen(command)
  local output = handle:read("*a")
  local exit_code = handle:close()
  
  if not exit_code then
    return {
      success = false,
      error = "TypeScript runner failed to execute"
    }
  end
  
  return json.decode(output)
end

function ParityValidator.runLuaTest(scenario)
  -- Spawn AO process with parity calculator
  local process_id = aolite.spawnProcess({
    file = "ao-processes/game-logic/parity-calculator.lua",
    name = "parity-test-process"
  })
  
  -- Send test scenario
  local msg_id = aolite.send({
    process = process_id,
    data = json.encode(scenario.input),
    tags = { 
      Action = "ParityTest",
      TestId = scenario.id 
    }
  })
  
  -- Process the message
  aolite.runScheduler()
  
  -- Get result
  local responses = aolite.getAllMsgs(process_id, {
    filter = { ["In-Reply-To"] = msg_id }
  })
  
  if #responses == 0 then
    return {
      success = false,
      error = "No response from Lua process"
    }
  end
  
  return json.decode(responses[1].data)
end

function ParityValidator.compareResults(ts_result, lua_result, tolerance)
  local comparison = {
    overall_match = true,
    differences = {}
  }
  
  -- Check if both succeeded
  if ts_result.success ~= lua_result.success then
    comparison.overall_match = false
    comparison.differences.execution_success = {
      typescript = ts_result.success,
      lua = lua_result.success
    }
    return comparison
  end
  
  if not ts_result.success then
    -- Both failed - check if error messages are similar
    comparison.both_failed = true
    comparison.differences.errors = {
      typescript = ts_result.error,
      lua = lua_result.error
    }
    return comparison
  end
  
  -- Compare damage values
  local damage_diff = math.abs(ts_result.damage - lua_result.damage)
  if damage_diff > tolerance.damage_variance then
    comparison.overall_match = false
    comparison.differences.damage = {
      typescript = ts_result.damage,
      lua = lua_result.damage,
      difference = damage_diff,
      tolerance = tolerance.damage_variance
    }
  end
  
  -- Compare effectiveness
  if ts_result.effectiveness ~= lua_result.effectiveness then
    comparison.overall_match = false
    comparison.differences.effectiveness = {
      typescript = ts_result.effectiveness,
      lua = lua_result.effectiveness
    }
  end
  
  -- Compare critical hit status
  if ts_result.critical_hit ~= lua_result.critical_hit then
    comparison.overall_match = false
    comparison.differences.critical_hit = {
      typescript = ts_result.critical_hit,
      lua = lua_result.critical_hit
    }
  end
  
  -- Performance comparison (informational)
  comparison.performance = {
    typescript_time = ts_result.execution_time_ms,
    lua_time = lua_result.execution_time_ms,
    ratio = ts_result.execution_time_ms / lua_result.execution_time_ms
  }
  
  return comparison
end

function ParityValidator.runParityTestSuite(test_scenarios)
  local results = {
    total_tests = #test_scenarios,
    passed_tests = 0,
    failed_tests = 0,
    test_results = {},
    summary = {}
  }
  
  print(string.format("🧪 Running parity test suite (%d tests)", results.total_tests))
  
  for i, scenario in ipairs(test_scenarios) do
    print(string.format("  Test %d/%d: %s", i, results.total_tests, scenario.name))
    
    local test_result = ParityValidator.runParityTest(scenario)
    table.insert(results.test_results, test_result)
    
    if test_result.passed then
      results.passed_tests = results.passed_tests + 1
      print("    ✅ PASSED")
    else
      results.failed_tests = results.failed_tests + 1
      print("    ❌ FAILED")
      
      -- Print failure details
      for category, difference in pairs(test_result.comparison.differences) do
        print(string.format("      %s: TS=%s, Lua=%s", 
          category, 
          tostring(difference.typescript), 
          tostring(difference.lua)
        ))
      end
    end
  end
  
  -- Generate summary
  results.summary = {
    success_rate = results.passed_tests / results.total_tests,
    total_execution_time = 0, -- Could be calculated
    most_common_failures = ParityValidator.analyzeMostCommonFailures(results.test_results)
  }
  
  print(string.format("\n📊 Parity Test Results: %d/%d passed (%.1f%%)", 
    results.passed_tests, 
    results.total_tests,
    results.summary.success_rate * 100
  ))
  
  return results
end

function ParityValidator.analyzeMostCommonFailures(test_results)
  local failure_counts = {}
  
  for _, result in ipairs(test_results) do
    if not result.passed then
      for category, _ in pairs(result.comparison.differences) do
        failure_counts[category] = (failure_counts[category] or 0) + 1
      end
    end
  end
  
  return failure_counts
end

return ParityValidator
```

### 5. Automated Parity Reporting

```lua
-- parity-testing/reports/parity-reporter.lua
local ParityReporter = {}

function ParityReporter.generateHTMLReport(parity_results)
  local html = [[
<!DOCTYPE html>
<html>
<head>
  <title>PokéRogue Parity Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .passed { color: green; }
    .failed { color: red; }
    .test-result { border: 1px solid #ddd; margin: 10px 0; padding: 10px; border-radius: 3px; }
    .differences { background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 3px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>PokéRogue Parity Test Report</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Total Tests:</strong> ]] .. parity_results.total_tests .. [[</p>
    <p><strong>Passed:</strong> <span class="passed">]] .. parity_results.passed_tests .. [[</span></p>
    <p><strong>Failed:</strong> <span class="failed">]] .. parity_results.failed_tests .. [[</span></p>
    <p><strong>Success Rate:</strong> ]] .. string.format("%.1f%%", parity_results.summary.success_rate * 100) .. [[</p>
  </div>
]]

  -- Add test results
  html = html .. "<h2>Test Results</h2>\n"
  
  for _, result in ipairs(parity_results.test_results) do
    local status_class = result.passed and "passed" or "failed"
    local status_text = result.passed and "✅ PASSED" or "❌ FAILED"
    
    html = html .. string.format([[
    <div class="test-result">
      <h3><span class="%s">%s</span> %s</h3>
      <p><strong>ID:</strong> %s</p>
    ]], status_class, status_text, result.scenario_name, result.scenario_id)
    
    if not result.passed then
      html = html .. '<div class="differences"><h4>Differences:</h4><ul>'
      
      for category, difference in pairs(result.comparison.differences) do
        html = html .. string.format(
          '<li><strong>%s:</strong> TypeScript=%s, Lua=%s</li>',
          category,
          tostring(difference.typescript),
          tostring(difference.lua)
        )
      end
      
      html = html .. '</ul></div>'
    end
    
    html = html .. '</div>\n'
  end
  
  html = html .. "</body></html>"
  
  return html
end

return ParityReporter
```

## Best Practices

### 1. Test Design Principles
- **Deterministic**: Use fixed random seeds and controlled conditions
- **Comprehensive**: Cover edge cases and boundary conditions
- **Realistic**: Use actual game scenarios, not artificial test data
- **Maintainable**: Keep test scenarios simple and well-documented

### 2. Tolerance Management
- **Damage Calculations**: ±1 HP tolerance for rounding differences
- **Floating Point**: ±0.001 tolerance for decimal calculations
- **Timing**: Performance comparisons are informational only
- **Status Effects**: Exact match required for boolean conditions

### 3. Failure Investigation
- **Immediate Triage**: Categorize failures by type (damage, effectiveness, etc.)
- **Root Cause Analysis**: Compare implementation logic step-by-step
- **Regression Testing**: Re-run tests after fixes to ensure no new issues
- **Documentation**: Update test scenarios when legitimate differences are found

This parity framework ensures that the game behaves identically whether calculations are performed client-side (TypeScript) or server-side (Lua AO processes), maintaining fairness and preventing exploitation.