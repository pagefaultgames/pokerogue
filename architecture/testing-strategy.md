# Testing Strategy with Aolite

## Overview

Our testing strategy leverages aolite for comprehensive AO process validation, ensuring game logic integrity and parity between TypeScript and Lua implementations.

## Testing Architecture

### 1. Test Layer Hierarchy

```
┌─────────────────────────────────────┐
│           Unit Tests                │
│  Individual handler & function tests │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│        Integration Tests            │
│   Cross-process communication      │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│         Parity Tests               │
│  TypeScript ↔ Lua consistency     │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│       Performance Tests            │
│    Benchmarking & regression       │
└─────────────────────────────────────┘
```

### 2. Aolite Test Environment

#### Process Lifecycle Management
```lua
-- Test environment setup
local TestEnvironment = {
  processes = {},
  message_history = {},
  performance_data = {}
}

function TestEnvironment.setup()
  -- Initialize aolite with test configuration
  aolite.configure({
    log_level = 1,           -- Error logging only
    scheduler_mode = "manual", -- Deterministic execution
    output_capture = true,    -- Capture all outputs
    message_queue_size = 1000
  })
  
  -- Spawn core processes
  TestEnvironment.processes.main = aolite.spawnProcess({
    file = "ao-processes/main.lua",
    name = "test-main-process"
  })
  
  TestEnvironment.processes.validator = aolite.spawnProcess({
    file = "ao-processes/handlers/validation-handler.lua", 
    name = "test-validator"
  })
  
  print("✅ Test environment initialized")
  return TestEnvironment
end

function TestEnvironment.cleanup()
  -- Reset all processes and state
  aolite.resetAll()
  TestEnvironment.processes = {}
  TestEnvironment.message_history = {}
  TestEnvironment.performance_data = {}
  print("🧹 Test environment cleaned up")
end
```

## Unit Testing Framework

### Handler Testing Pattern

```lua
-- ao-processes/tests/unit/battle-handler.test.lua
local aolite = require('development-tools.aolite.init')
local TestEnvironment = require('ao-processes.tests.framework.test-environment')
local json = require('json')

describe("Battle Handler", function()
  local env
  
  before_each(function()
    env = TestEnvironment.setup()
  end)
  
  after_each(function()
    TestEnvironment.cleanup()
  end)
  
  it("should calculate damage correctly", function()
    -- Arrange
    local battle_data = {
      attacker = {
        species = "PIKACHU",
        level = 50,
        stats = { attack = 100 },
        moves = { { name = "THUNDERBOLT", power = 90, type = "ELECTRIC" } }
      },
      defender = {
        species = "SQUIRTLE", 
        level = 50,
        stats = { defense = 80 },
        types = { "WATER" }
      }
    }
    
    -- Act
    local message_id = aolite.send({
      process = env.processes.main,
      data = json.encode({
        action = "CalculateDamage",
        battle_data = battle_data
      }),
      tags = { Action = "CalculateDamage", TestID = "damage-calc-1" }
    })
    
    aolite.runScheduler()
    
    -- Assert
    local responses = aolite.getAllMsgs(env.processes.main, {
      filter = { ["In-Reply-To"] = message_id }
    })
    
    assert(#responses == 1, "Should receive exactly one response")
    
    local result = json.decode(responses[1].data)
    assert(result.damage > 0, "Damage should be positive")
    assert(result.damage < 500, "Damage should be reasonable")
    assert(result.effectiveness == "super_effective", "Electric vs Water should be super effective")
  end)
end)
```

### Mocking and Fixtures

```lua
-- ao-processes/tests/fixtures/battle-scenarios.lua
local BattleScenarios = {}

BattleScenarios.type_effectiveness = {
  {
    name = "Electric vs Water (Super Effective)",
    attacker = { type = "ELECTRIC", move = "THUNDERBOLT" },
    defender = { types = { "WATER" } },
    expected_multiplier = 2.0
  },
  {
    name = "Water vs Fire (Super Effective)", 
    attacker = { type = "WATER", move = "WATER_GUN" },
    defender = { types = { "FIRE" } },
    expected_multiplier = 2.0
  },
  {
    name = "Normal vs Ghost (No Effect)",
    attacker = { type = "NORMAL", move = "TACKLE" },
    defender = { types = { "GHOST" } },
    expected_multiplier = 0.0
  }
}

BattleScenarios.damage_calculations = {
  {
    name = "Standard Damage Calculation",
    attacker = {
      level = 50,
      attack = 100,
      move = { name = "TACKLE", power = 40, type = "NORMAL" }
    },
    defender = {
      level = 50,
      defense = 100,
      types = { "NORMAL" }
    },
    expected_range = { min = 15, max = 25 }
  }
}

return BattleScenarios
```

## Integration Testing

### Standardized Integration Test Setup

**PROBLEM SOLVED**: Integration tests for new stories were consistently failing with module path errors and species field access issues when pushed to GitHub. This was due to inconsistent test setup patterns across different test files.

**SOLUTION**: All integration tests MUST use the standardized setup to prevent recurring setupLuaPath issues:

```lua
-- Use standardized test setup (REQUIRED for all new tests)
local TestSetup = require("test-setup")
local TestFramework = TestSetup.setupLuaPath()
TestSetup.initializeTestEnvironment()

-- Load required modules
local YourModule = require("game-logic.battle.your-module")

-- Use standardized test utilities
local createBattleState = TestSetup.createStandardBattleState
local createPokemon = TestSetup.createStandardPokemon
local TestEnums = TestSetup.TestEnums
```

### Cross-Process Communication

```lua
-- ao-processes/tests/integration/process-communication.test.lua
describe("Process Communication", function()
  it("should handle anti-cheat validation flow", function()
    local env = TestEnvironment.setup()
    
    -- Spawn anti-cheat process
    local anti_cheat = aolite.spawnProcess({
      file = "ao-processes/handlers/anti-cheat-handler.lua",
      name = "test-anti-cheat"
    })
    
    -- Send suspicious action to main process
    local action_id = aolite.send({
      process = env.processes.main,
      data = json.encode({
        action = "PlayerAction",
        player_id = "test_player",
        action_data = {
          type = "MOVE_SELECTION",
          move_index = 0,
          timestamp = os.time()
        }
      }),
      tags = { Action = "PlayerAction" }
    })
    
    -- Main process should forward to anti-cheat
    aolite.runScheduler()
    
    -- Check that anti-cheat process received validation request
    local anti_cheat_msgs = aolite.getAllMsgs(anti_cheat)
    assert(#anti_cheat_msgs > 0, "Anti-cheat should receive validation request")
    
    local validation_msg = anti_cheat_msgs[1]
    assert(validation_msg.tags.Action == "ValidateAction", "Should be validation request")
  end)
end)
```

## Parity Testing Framework

### TypeScript ↔ Lua Consistency

```lua
-- parity-testing/test-harness/parity-validator.lua
local aolite = require('development-tools.aolite.init')
local ParityValidator = {}

function ParityValidator.validateBattleCalculation(scenario)
  -- Run in Lua (AO process)
  local ao_process = aolite.spawnProcess("ao-processes/game-logic/battle-calculator.lua")
  
  aolite.send({
    process = ao_process,
    data = json.encode(scenario),
    tags = { Action = "CalculateDamage" }
  })
  
  aolite.runScheduler()
  local ao_result = json.decode(aolite.getAllMsgs(ao_process)[1].data)
  
  -- Run in TypeScript (via Node.js execution)
  local ts_command = string.format(
    'node parity-testing/runners/typescript-runner.js "%s"',
    json.encode(scenario):gsub('"', '\\"')
  )
  
  local ts_output = io.popen(ts_command):read("*a")
  local ts_result = json.decode(ts_output)
  
  -- Compare results with tolerance
  local damage_match = math.abs(ao_result.damage - ts_result.damage) <= 1
  local effectiveness_match = ao_result.effectiveness == ts_result.effectiveness
  
  return {
    passed = damage_match and effectiveness_match,
    ao_result = ao_result,
    ts_result = ts_result,
    differences = {
      damage = ao_result.damage - ts_result.damage,
      effectiveness = {
        lua = ao_result.effectiveness,
        typescript = ts_result.effectiveness
      }
    }
  }
end

function ParityValidator.runParityTestSuite(test_scenarios)
  local results = {
    total = #test_scenarios,
    passed = 0,
    failed = 0,
    failures = {}
  }
  
  for i, scenario in ipairs(test_scenarios) do
    print(string.format("Running parity test %d/%d: %s", i, results.total, scenario.name))
    
    local result = ParityValidator.validateBattleCalculation(scenario)
    
    if result.passed then
      results.passed = results.passed + 1
      print("  ✅ PASSED")
    else
      results.failed = results.failed + 1
      table.insert(results.failures, {
        scenario = scenario.name,
        differences = result.differences
      })
      print("  ❌ FAILED")
      print("    Damage difference:", result.differences.damage)
    end
  end
  
  return results
end

return ParityValidator
```

## Performance Testing

### Benchmarking with Aolite

```lua
-- ao-processes/tests/performance/benchmark-runner.lua
local PerformanceTester = {}

function PerformanceTester.benchmarkHandler(handler_name, test_data, iterations)
  local env = TestEnvironment.setup()
  local times = {}
  
  print(string.format("Benchmarking %s (%d iterations)", handler_name, iterations))
  
  for i = 1, iterations do
    local start_time = os.clock()
    
    -- Send message and process
    aolite.send({
      process = env.processes.main,
      data = json.encode(test_data),
      tags = { Action = handler_name, Benchmark = "true" }
    })
    aolite.runScheduler()
    
    local end_time = os.clock()
    local execution_time = (end_time - start_time) * 1000 -- Convert to ms
    table.insert(times, execution_time)
    
    if i % 100 == 0 then
      print(string.format("  Progress: %d/%d", i, iterations))
    end
  end
  
  -- Calculate statistics
  table.sort(times)
  local total = 0
  for _, time in ipairs(times) do
    total = total + time
  end
  
  local p50_index = math.floor(#times * 0.5)
  local p95_index = math.floor(#times * 0.95)
  local p99_index = math.floor(#times * 0.99)
  
  TestEnvironment.cleanup()
  
  return {
    handler = handler_name,
    iterations = iterations,
    average = total / #times,
    median = times[p50_index],
    min = times[1],
    max = times[#times],
    p95 = times[p95_index],
    p99 = times[p99_index]
  }
end

return PerformanceTester
```

## CI/CD Integration

### GitHub Actions with Aolite

```yaml
# Updated section of ao-process-tests.yml
- name: Install Aolite
  run: |
    echo "📦 Installing aolite for AO process testing"
    
    # Clone aolite
    git clone https://github.com/perplex-labs/aolite.git development-tools/aolite
    
    # Verify Lua 5.3 installation
    lua5.3 -v
    
    # Test aolite basic functionality
    cd development-tools/aolite
    lua5.3 -e "
      local aolite = require('init')
      print('✅ Aolite loaded successfully')
      
      -- Basic functionality test
      local process = aolite.spawnProcess('function() print(\"Hello AO\") end')
      aolite.runScheduler()
      print('✅ Basic process execution works')
    "

- name: Run AO Process Tests with Aolite
  run: |
    echo "🧪 Running AO Process Tests with aolite"
    
    lua5.3 -e "
      package.path = package.path .. ';./development-tools/aolite/?.lua;./?.lua'
      
      -- Load our test runner
      local TestRunner = require('ao-processes.tests.aolite-test-runner')
      
      -- Run test suite
      local results = TestRunner.runFullSuite({
        unit_tests = true,
        integration_tests = true,
        parity_tests = true,
        performance_tests = false -- Skip in CI for speed
      })
      
      -- Output results
      print('=== AO Process Test Results ===')
      print('Unit Tests:', results.unit_tests.passed .. '/' .. results.unit_tests.total)
      print('Integration Tests:', results.integration_tests.passed .. '/' .. results.integration_tests.total)  
      print('Parity Tests:', results.parity_tests.passed .. '/' .. results.parity_tests.total)
      
      if not results.overall_success then
        print('❌ Some tests failed')
        os.exit(1)
      end
      
      print('✅ All tests passed')
    "
```

## Test Organization Best Practices

### Directory Structure
```
ao-processes/tests/
├── unit/                    # Individual component tests
│   ├── handlers/           # Handler-specific tests
│   ├── game-logic/        # Game logic tests
│   └── utils/             # Utility function tests
├── integration/            # Cross-process tests
│   ├── battle-flow/       # Complete battle scenarios
│   ├── anti-cheat/        # Anti-cheat integration
│   └── state-management/  # State persistence tests
├── performance/           # Benchmarking tests
│   ├── handlers/          # Handler performance
│   └── scenarios/         # Complex scenario benchmarks
├── fixtures/              # Shared test data
│   ├── pokemon-data/      # Pokemon, moves, items
│   ├── battle-scenarios/  # Battle test cases
│   └── game-states/       # Saved game states
└── framework/             # Testing utilities
    ├── test-environment/  # Environment setup
    ├── assertions/        # Custom assertions
    └── reporters/         # Result reporting
```

### Naming Conventions
- Test files: `*.test.lua`
- Fixtures: `*-scenarios.lua`, `*-data.lua`
- Utilities: `*-utils.lua`, `*-helpers.lua`
- Environment: `test-environment.lua`, `test-config.lua`

### Execution Order
1. **Setup**: Initialize aolite and spawn processes
2. **Unit Tests**: Fast, isolated tests
3. **Integration Tests**: Cross-process communication
4. **Parity Tests**: TypeScript ↔ Lua validation
5. **Performance Tests**: Benchmarking (optional in CI)
6. **Cleanup**: Reset aolite state