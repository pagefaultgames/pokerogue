# AO Process Deployment Guide

## Overview

This guide covers the deployment of PokéRogue AO processes from local development (using aolite) to the live Arweave AO network.

## Deployment Pipeline

### 1. Local Development → Testnet → Mainnet

```
Local (aolite) → AO Testnet → AO Mainnet
      ↓              ↓           ↓
   Development → Integration → Production
```

### 2. Environment Configuration

#### Local Development (Aolite)
```lua
-- development-tools/aolite-config/local-config.lua
local LocalConfig = {
  environment = "local",
  
  aolite_settings = {
    log_level = 3, -- Full debugging
    scheduler_mode = "manual",
    output_capture = true,
    process_timeout = 30000
  },
  
  process_settings = {
    enable_debug_handlers = true,
    mock_external_calls = true,
    deterministic_rng = true -- Fixed seeds for testing
  },
  
  data_sources = {
    pokemon_data = "local_files", -- Load from JSON files
    type_chart = "local_files",
    move_data = "local_files"
  }
}

return LocalConfig
```

#### Testnet Configuration
```lua
-- deployment/config/testnet-config.lua
local TestnetConfig = {
  environment = "testnet",
  
  ao_settings = {
    scheduler_location = "testnet", -- AO testnet scheduler
    cu_price = 1000, -- Lower prices on testnet
    message_timeout = 60000,
    max_retries = 3
  },
  
  process_settings = {
    enable_debug_handlers = false, -- Disable debug in testnet
    mock_external_calls = false,
    deterministic_rng = false -- Real randomness
  },
  
  data_sources = {
    pokemon_data = "arweave_testnet",
    type_chart = "arweave_testnet", 
    move_data = "arweave_testnet"
  },
  
  monitoring = {
    enable_metrics = true,
    report_interval = 300, -- 5 minutes
    alert_thresholds = {
      error_rate = 0.01, -- 1% error rate triggers alert
      response_time = 5000 -- 5 second response time alert
    }
  }
}

return TestnetConfig
```

#### Mainnet Configuration  
```lua
-- deployment/config/mainnet-config.lua
local MainnetConfig = {
  environment = "mainnet",
  
  ao_settings = {
    scheduler_location = "mainnet",
    cu_price = 5000, -- Higher prices on mainnet
    message_timeout = 30000,
    max_retries = 5
  },
  
  process_settings = {
    enable_debug_handlers = false,
    mock_external_calls = false,
    deterministic_rng = false,
    enable_security_checks = true,
    rate_limiting = {
      max_requests_per_minute = 1000,
      burst_allowance = 50
    }
  },
  
  data_sources = {
    pokemon_data = "arweave_mainnet",
    type_chart = "arweave_mainnet",
    move_data = "arweave_mainnet"
  },
  
  monitoring = {
    enable_metrics = true,
    report_interval = 60, -- 1 minute
    alert_thresholds = {
      error_rate = 0.001, -- 0.1% error rate
      response_time = 2000 -- 2 second response time
    }
  }
}

return MainnetConfig
```

## Deployment Tools

### 1. AO Process Deployer

```bash
#!/bin/bash
# deployment/scripts/deploy-ao-process.sh

set -e

ENVIRONMENT=${1:-testnet}
PROCESS_NAME=${2:-"pokerogue-main"}
DRY_RUN=${3:-false}

echo "🚀 Deploying AO Process: $PROCESS_NAME to $ENVIRONMENT"

# Validate environment
if [[ "$ENVIRONMENT" != "testnet" && "$ENVIRONMENT" != "mainnet" ]]; then
    echo "❌ Invalid environment. Use 'testnet' or 'mainnet'"
    exit 1
fi

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# 1. Validate Lua syntax
echo "  Checking Lua syntax..."
lua5.3 -e "dofile('ao-processes/main.lua')" > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Lua syntax errors found"
    exit 1
fi

# 2. Run unit tests
echo "  Running unit tests..."
cd ao-processes/tests
lua5.3 -e "
    package.path = package.path .. ';../../development-tools/aolite/?.lua;../?.lua'
    local TestRunner = require('unit.test-runner')
    local results = TestRunner.runAllTests()
    if not results.success then
        print('❌ Unit tests failed')
        os.exit(1)
    end
    print('✅ Unit tests passed')
"
cd ../..

# 3. Run parity tests
echo "  Running parity tests..."
lua5.3 -e "
    package.path = package.path .. ';./development-tools/aolite/?.lua;./?.lua'
    local ParityValidator = require('parity-testing.test-harness.parity-validator')
    local scenarios = require('parity-testing.test-cases.battle-damage-scenarios')
    
    local results = ParityValidator.runParityTestSuite(scenarios)
    if results.summary.success_rate < 0.95 then
        print('❌ Parity tests failed - success rate too low: ' .. (results.summary.success_rate * 100) .. '%')
        os.exit(1)
    end
    print('✅ Parity tests passed')
"

# 4. Build process bundle
echo "  Building process bundle..."
mkdir -p deployment/builds/$ENVIRONMENT/
lua5.3 deployment/scripts/build-process.lua $ENVIRONMENT $PROCESS_NAME

# 5. Deploy to AO
if [[ "$DRY_RUN" == "false" ]]; then
    echo "  Deploying to AO $ENVIRONMENT..."
    
    # Use ao CLI or SDK to deploy
    ao deploy \
        --file "deployment/builds/$ENVIRONMENT/$PROCESS_NAME.lua" \
        --environment "$ENVIRONMENT" \
        --tags "Name=$PROCESS_NAME,Environment=$ENVIRONMENT,Version=$(git rev-parse --short HEAD)" \
        --compute-units 1000000
        
    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful"
        
        # Save deployment info
        PROCESS_ID=$(ao list | grep "$PROCESS_NAME" | awk '{print $1}')
        echo "$PROCESS_ID" > "deployment/deployments/$ENVIRONMENT-$PROCESS_NAME.processid"
        
        # Run post-deployment verification
        echo "🔍 Running post-deployment verification..."
        lua5.3 deployment/scripts/verify-deployment.lua $ENVIRONMENT $PROCESS_ID
        
    else
        echo "❌ Deployment failed"
        exit 1
    fi
else
    echo "🔍 Dry run completed successfully"
fi

echo "🎉 Process deployment completed: $PROCESS_NAME on $ENVIRONMENT"
```

### 2. Process Builder

```lua
-- deployment/scripts/build-process.lua
local json = require('json')

local ProcessBuilder = {}

function ProcessBuilder.buildProcess(environment, process_name)
  local config_file = string.format("deployment/config/%s-config.lua", environment)
  local config = dofile(config_file)
  
  print(string.format("📦 Building process %s for %s", process_name, environment))
  
  -- Read main process file
  local main_content = ProcessBuilder.readFile("ao-processes/main.lua")
  
  -- Read and inline all dependencies
  local dependencies = ProcessBuilder.extractDependencies(main_content)
  local inlined_content = ProcessBuilder.inlineDependencies(main_content, dependencies)
  
  -- Inject configuration
  local configured_content = ProcessBuilder.injectConfiguration(inlined_content, config)
  
  -- Minify for production
  if environment == "mainnet" then
    configured_content = ProcessBuilder.minifyLua(configured_content)
  end
  
  -- Write build output
  local output_path = string.format("deployment/builds/%s/%s.lua", environment, process_name)
  ProcessBuilder.writeFile(output_path, configured_content)
  
  print(string.format("✅ Process built: %s", output_path))
  
  return output_path
end

function ProcessBuilder.extractDependencies(content)
  local dependencies = {}
  
  -- Find all require() statements
  for require_path in content:gmatch('require%(%s*[\'"]([^\'"]*)[\'"]) % s*)') do
    -- Convert relative paths to file paths
    local file_path = require_path:gsub('%.', '/') .. '.lua'
    
    if ProcessBuilder.fileExists("ao-processes/" .. file_path) then
      table.insert(dependencies, {
        require_path = require_path,
        file_path = "ao-processes/" .. file_path
      })
    end
  end
  
  return dependencies
end

function ProcessBuilder.inlineDependencies(content, dependencies)
  local inlined = content
  
  for _, dep in ipairs(dependencies) do
    local dep_content = ProcessBuilder.readFile(dep.file_path)
    
    -- Wrap in module structure
    local wrapped = string.format([[
-- Inlined dependency: %s
local %s = (function()
%s
end)()
]], dep.require_path, dep.require_path:gsub('[^%w]', '_'), dep_content)
    
    -- Replace require statement with module variable
    local require_pattern = string.format('require%s*%(%s*[\'"]%s[\'"]%s*%)', 
      '%s*', '%s*', dep.require_path:gsub('[%-%.%+%[%]%(%)%$%^%%%?%*]', '%%%1'), '%s*')
    inlined = inlined:gsub(require_pattern, dep.require_path:gsub('[^%w]', '_'))
    
    -- Add inlined content at the top
    inlined = wrapped .. "\n" .. inlined
  end
  
  return inlined
end

function ProcessBuilder.injectConfiguration(content, config)
  -- Replace configuration placeholders
  local config_json = json.encode(config)
  local config_injection = string.format("local CONFIG = %s\n", config_json)
  
  return config_injection .. content
end

function ProcessBuilder.minifyLua(content)
  -- Basic minification - remove comments and unnecessary whitespace
  local minified = content
  
  -- Remove single line comments (but preserve strings)
  minified = minified:gsub('%-%-[^\r\n]*', '')
  
  -- Remove multi-line comments
  minified = minified:gsub('%-%-%[%[.-%]%]', '')
  
  -- Compress whitespace
  minified = minified:gsub('%s+', ' ')
  
  -- Remove spaces around operators
  minified = minified:gsub('%s*([=<>~!+%-*/%^])%s*', '%1')
  
  return minified
end

-- Utility functions
function ProcessBuilder.readFile(path)
  local file = io.open(path, 'r')
  if not file then
    error("Could not read file: " .. path)
  end
  local content = file:read('*a')
  file:close()
  return content
end

function ProcessBuilder.writeFile(path, content)
  -- Ensure directory exists
  local dir = path:match('(.+)/')
  if dir then
    os.execute("mkdir -p " .. dir)
  end
  
  local file = io.open(path, 'w')
  if not file then
    error("Could not write file: " .. path)
  end
  file:write(content)
  file:close()
end

function ProcessBuilder.fileExists(path)
  local file = io.open(path, 'r')
  if file then
    file:close()
    return true
  end
  return false
end

-- CLI interface
if arg and arg[1] then
  local environment = arg[1]
  local process_name = arg[2] or "pokerogue-main"
  
  ProcessBuilder.buildProcess(environment, process_name)
else
  print("Usage: lua build-process.lua <environment> [process_name]")
end

return ProcessBuilder
```

### 3. Deployment Verification

```lua
-- deployment/scripts/verify-deployment.lua
local json = require('json')

local DeploymentVerifier = {}

function DeploymentVerifier.verifyDeployment(environment, process_id)
  print(string.format("🔍 Verifying deployment of process %s on %s", process_id, environment))
  
  local verification_results = {
    process_responsive = false,
    handlers_loaded = false,
    basic_functionality = false,
    performance_acceptable = false,
    security_checks_passed = false
  }
  
  -- 1. Check if process responds to messages
  print("  Testing process responsiveness...")
  verification_results.process_responsive = DeploymentVerifier.testProcessResponsiveness(process_id)
  
  -- 2. Verify handlers are loaded
  print("  Checking handler registration...")
  verification_results.handlers_loaded = DeploymentVerifier.verifyHandlers(process_id)
  
  -- 3. Test basic functionality
  print("  Testing basic game logic...")
  verification_results.basic_functionality = DeploymentVerifier.testBasicFunctionality(process_id)
  
  -- 4. Performance check
  print("  Running performance tests...")
  verification_results.performance_acceptable = DeploymentVerifier.testPerformance(process_id)
  
  -- 5. Security validation
  if environment == "mainnet" then
    print("  Running security checks...")
    verification_results.security_checks_passed = DeploymentVerifier.testSecurity(process_id)
  else
    verification_results.security_checks_passed = true -- Skip security checks on testnet
  end
  
  -- Summary
  local all_passed = true
  for check, passed in pairs(verification_results) do
    if not passed then
      all_passed = false
      print(string.format("  ❌ %s: FAILED", check))
    else
      print(string.format("  ✅ %s: PASSED", check))
    end
  end
  
  if all_passed then
    print("🎉 Deployment verification successful!")
    return true
  else
    print("❌ Deployment verification failed!")
    return false
  end
end

function DeploymentVerifier.testProcessResponsiveness(process_id)
  -- Send a ping message and check for response
  local ping_message = {
    process = process_id,
    data = json.encode({ action = "Ping" }),
    tags = { Action = "Ping" }
  }
  
  -- Use ao CLI to send message
  local command = string.format('ao send %s --data \'%s\' --tags Action=Ping', 
    process_id, 
    json.encode({ action = "Ping" })
  )
  
  local start_time = os.clock()
  local result = os.execute(command)
  local response_time = (os.clock() - start_time) * 1000
  
  return result == 0 and response_time < 5000 -- Success and under 5 seconds
end

function DeploymentVerifier.testBasicFunctionality(process_id)
  -- Test a basic battle calculation
  local test_battle = {
    action = "CalculateDamage",
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
  
  -- Send test battle
  local command = string.format('ao send %s --data \'%s\' --tags Action=TestBattle',
    process_id,
    json.encode(test_battle)
  )
  
  local result = os.execute(command)
  return result == 0
end

-- CLI interface
if arg and arg[1] then
  local environment = arg[1]
  local process_id = arg[2]
  
  if not process_id then
    print("Usage: lua verify-deployment.lua <environment> <process_id>")
    os.exit(1)
  end
  
  local success = DeploymentVerifier.verifyDeployment(environment, process_id)
  os.exit(success and 0 or 1)
end

return DeploymentVerifier
```

## Monitoring and Maintenance

### 1. Health Check System

```lua
-- deployment/monitoring/health-checker.lua
local HealthChecker = {}

function HealthChecker.runHealthChecks(process_id)
  local checks = {
    { name = "Process Responsive", func = HealthChecker.checkResponsiveness },
    { name = "Memory Usage", func = HealthChecker.checkMemoryUsage },
    { name = "Error Rate", func = HealthChecker.checkErrorRate },
    { name = "Response Time", func = HealthChecker.checkResponseTime },
    { name = "Message Queue", func = HealthChecker.checkMessageQueue }
  }
  
  local results = {}
  
  for _, check in ipairs(checks) do
    local status, details = check.func(process_id)
    table.insert(results, {
      name = check.name,
      status = status, -- "healthy", "warning", "critical"
      details = details
    })
  end
  
  return results
end
```

### 2. Rollback Procedures

```bash
#!/bin/bash
# deployment/scripts/rollback.sh

ENVIRONMENT=$1
PROCESS_NAME=$2
TARGET_VERSION=$3

echo "🔄 Rolling back $PROCESS_NAME on $ENVIRONMENT to version $TARGET_VERSION"

# 1. Stop traffic to current process
echo "  Stopping traffic..."
# Implement traffic stop logic

# 2. Deploy previous version
echo "  Deploying previous version..."
ao deploy --file "deployment/builds/$ENVIRONMENT/$PROCESS_NAME-$TARGET_VERSION.lua"

# 3. Verify rollback
echo "  Verifying rollback..."
lua5.3 deployment/scripts/verify-deployment.lua $ENVIRONMENT $NEW_PROCESS_ID

# 4. Update traffic routing
echo "  Updating traffic routing..."
# Implement traffic routing update

echo "✅ Rollback completed"
```

## Best Practices

### 1. Deployment Safety
- **Staging Environment**: Always test on testnet first
- **Gradual Rollout**: Deploy to subset of users initially
- **Rollback Plan**: Always have a rollback strategy ready
- **Health Monitoring**: Continuous monitoring post-deployment

### 2. Process Management
- **Version Tracking**: Tag all deployments with git SHA
- **Configuration Management**: Environment-specific configurations
- **Dependency Pinning**: Lock dependency versions for reproducible builds
- **Security Updates**: Regular updates for security patches

### 3. Operational Excellence
- **Automated Deployment**: Use CI/CD pipelines for consistency
- **Infrastructure as Code**: All configuration in version control
- **Monitoring & Alerting**: Comprehensive observability
- **Documentation**: Keep deployment procedures updated

This deployment guide ensures safe, reliable deployment of AO processes from local development to production, with proper testing, monitoring, and rollback capabilities.