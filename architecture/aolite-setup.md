# Aolite Setup and Configuration

## Overview

Aolite is our local AO development environment that simulates the Arweave AO protocol without requiring network deployment. It provides concurrent process emulation using Lua coroutines and direct process state access for debugging.

## Installation and Setup

### Prerequisites
- Lua 5.3 (required for AO compatibility)
- Git for cloning the aolite repository
- Basic understanding of AO message passing

### Installation Steps

1. **Install Lua 5.3**
```bash
# Ubuntu/Debian
sudo apt-get install lua5.3 lua5.3-dev

# macOS with Homebrew
brew install lua@5.3

# Verify installation
lua5.3 -v
```

2. **Clone and Setup Aolite**
```bash
# Clone aolite repository
git clone https://github.com/perplex-labs/aolite.git development-tools/aolite

# Navigate to project root
cd /path/to/pokerogue
```

3. **Configure Aolite for PokéRogue**
```lua
-- development-tools/aolite-config/config.lua
local config = {
  lua_version = "5.3",
  log_level = 2, -- 0=off, 1=errors, 2=info, 3=debug
  max_processes = 10,
  message_queue_size = 1000,
  scheduler_mode = "auto", -- "manual" or "auto"
  output_capture = true,
  
  -- PokéRogue specific settings
  process_paths = {
    "ao-processes/",
    "parity-testing/",
  },
  
  test_data_path = "ao-processes/tests/fixtures/",
  report_output_path = "test-results/aolite/"
}

return config
```

## Core API Usage

### Basic Process Operations

```lua
-- Initialize aolite
local aolite = require('development-tools.aolite.init')

-- Spawn a process
local process_id = aolite.spawnProcess({
  file = "ao-processes/main.lua",
  name = "pokerogue-main",
  tags = { Type = "Process", Name = "PokéRogue-Game-Logic" }
})

-- Send a message to process
local message_id = aolite.send({
  process = process_id,
  data = json.encode({
    action = "ValidateBattle",
    battle_data = { ... }
  }),
  tags = { Action = "ValidateBattle" }
})

-- Run scheduler to process messages
aolite.runScheduler()

-- Get all messages for debugging
local messages = aolite.getAllMsgs(process_id)
```

### Process State Inspection

```lua
-- Inspect process state
local state = aolite.getProcessState(process_id)
print("Process memory usage:", state.memory_usage)
print("Handler count:", #state.handlers)
print("Message queue length:", state.queue_length)

-- Access process variables directly
local process_data = aolite.eval(process_id, "return GameState")
print("Current game state:", json.encode(process_data))
```

### Message Logging and Debugging

```lua
-- Enable comprehensive logging
aolite.setMessageLog({
  level = 3, -- Debug level
  capture_output = true,
  filter_tags = { "ValidateBattle", "AntiCheat" }
})

-- Get detailed message history
local message_history = aolite.getMessageHistory(process_id, {
  filter = { Action = "ValidateBattle" },
  limit = 100,
  include_output = true
})

for _, msg in ipairs(message_history) do
  print("Message:", msg.id, "Output:", msg.output)
end
```

## Testing Integration

### Test Runner Configuration

```lua
-- ao-processes/tests/aolite-test-runner.lua
local aolite = require('development-tools.aolite.init')
local TestRunner = {}

function TestRunner.setup()
  -- Configure aolite for testing
  aolite.configure({
    log_level = 1, -- Errors only during tests
    scheduler_mode = "manual",
    output_capture = true
  })
  
  -- Spawn main game process
  TestRunner.main_process = aolite.spawnProcess({
    file = "ao-processes/main.lua",
    name = "test-main"
  })
  
  return TestRunner.main_process
end

function TestRunner.runTest(test_name, test_data)
  print("Running test:", test_name)
  
  -- Send test message
  local msg_id = aolite.send({
    process = TestRunner.main_process,
    data = json.encode(test_data),
    tags = { Action = "Test", TestName = test_name }
  })
  
  -- Process the message
  aolite.runScheduler()
  
  -- Get results
  local messages = aolite.getAllMsgs(TestRunner.main_process, {
    filter = { ["In-Reply-To"] = msg_id }
  })
  
  return messages[1] -- Return first reply
end

function TestRunner.cleanup()
  aolite.resetAll()
end

return TestRunner
```

### Parity Testing with Aolite

```lua
-- parity-testing/aolite-parity-tests.lua
local aolite = require('development-tools.aolite.init')
local TypeScriptRunner = require('parity-testing.typescript-runner')

local ParityTester = {}

function ParityTester.validateBattleCalculation(battle_scenario)
  -- Run calculation in AO process
  local ao_process = aolite.spawnProcess("ao-processes/game-logic/battle-calculator.lua")
  
  aolite.send({
    process = ao_process,
    data = json.encode(battle_scenario),
    tags = { Action = "CalculateDamage" }
  })
  
  aolite.runScheduler()
  local ao_result = aolite.getAllMsgs(ao_process)[1].data
  
  -- Run calculation in TypeScript
  local ts_result = TypeScriptRunner.calculateDamage(battle_scenario)
  
  -- Compare results
  local match = json.decode(ao_result).damage == ts_result.damage
  
  return {
    match = match,
    ao_result = ao_result,
    ts_result = ts_result,
    scenario = battle_scenario
  }
end

return ParityTester
```

## Performance Monitoring

### Execution Time Tracking

```lua
-- Monitor process execution times
local function benchmarkProcess(process_id, message_data, iterations)
  local times = {}
  
  for i = 1, iterations do
    local start_time = os.clock()
    
    aolite.send({
      process = process_id,
      data = json.encode(message_data)
    })
    aolite.runScheduler()
    
    local end_time = os.clock()
    table.insert(times, (end_time - start_time) * 1000) -- Convert to ms
  end
  
  -- Calculate statistics
  local total = 0
  for _, time in ipairs(times) do
    total = total + time
  end
  
  return {
    average = total / #times,
    min = math.min(table.unpack(times)),
    max = math.max(table.unpack(times)),
    iterations = iterations
  }
end
```

## Best Practices

### Development Workflow
1. **Start Simple**: Begin with single process tests
2. **Use Manual Scheduler**: For deterministic testing
3. **Capture Output**: Always enable output capture for debugging
4. **State Inspection**: Regularly check process state during development
5. **Clean Reset**: Reset aolite state between test suites

### Debugging Tips
1. **Increase Log Level**: Use level 3 for detailed debugging
2. **Message History**: Track message flow between processes
3. **State Snapshots**: Save process state at key points
4. **Tag Filtering**: Use specific tags to filter relevant messages
5. **Output Analysis**: Check both stdout and stderr from processes

### Performance Optimization
1. **Batch Messages**: Send multiple messages before running scheduler
2. **Selective Logging**: Only log what you need for the current test
3. **Process Reuse**: Reuse processes across related tests
4. **Memory Monitoring**: Track process memory usage over time
5. **Queue Management**: Monitor message queue sizes

## Common Issues and Solutions

### Lua Version Compatibility
- **Issue**: Process fails with undefined AO globals
- **Solution**: Ensure Lua 5.3 is being used, not newer versions

### Message Ordering
- **Issue**: Messages processed out of expected order
- **Solution**: Use manual scheduler mode for deterministic testing

### Memory Leaks
- **Issue**: Process memory grows over time during tests
- **Solution**: Call `aolite.resetAll()` between test suites

### Performance Degradation
- **Issue**: Tests become slower over time
- **Solution**: Monitor message queue sizes and reset when needed

## Integration with CI/CD

See `testing-strategy.md` for how aolite integrates with our GitHub Actions workflows and automated testing pipeline.