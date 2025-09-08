# AO Process Tests

## Requirements

- **Lua 5.3** (required for both local and CI environments)
- Tests are designed to work with Lua 5.3 specifically for compatibility with the AO environment

## Local Setup

### Installing Lua 5.3

#### macOS
```bash
# Build from source (recommended)
cd /tmp
curl -L -R -O https://www.lua.org/ftp/lua-5.3.6.tar.gz
tar zxf lua-5.3.6.tar.gz
cd lua-5.3.6
make macosx
make install INSTALL_TOP=$HOME/.local

# Add to PATH
export PATH=$HOME/.local/bin:$PATH

# Create lua5.3 symlink
ln -s $HOME/.local/bin/lua $HOME/.local/bin/lua5.3
```

#### Ubuntu/Debian
```bash
sudo apt-get install lua5.3
```

### Running Tests

#### Quick Start
```bash
# Run all tests
./run-tests.sh

# Run specific test group (1-4)
./run-tests.sh 1

# Run specific test file
./run-tests.sh main.test.lua
```

#### Manual Testing
```bash
# Setup environment
source ./setup-lua53.sh

# Run individual tests
cd unit
lua5.3 main.test.lua
lua5.3 handler-framework.test.lua
```

## Test Groups

Tests are organized into groups for parallel execution in CI:

- **Group 1**: Core functionality (`main.test.lua`, `handler-framework.test.lua`)
- **Group 2**: Admin features (`admin-handler.test.lua`, `error-handling.test.lua`)
- **Group 3**: Authentication (`auth-handler.test.lua`, `validation-handler.test.lua`)
- **Group 4**: Security (`anti-cheat-handler.test.lua`, `enhanced-test-framework.test.lua`)

## CI/CD

GitHub Actions automatically runs tests on:
- Push to main/beta/develop branches
- Pull requests to main/beta
- Daily schedule (2 AM UTC)
- Manual workflow dispatch

The workflow ensures Lua 5.3 is used and runs tests in parallel groups for efficiency.

## Troubleshooting

### Lua Version Issues
- Tests require Lua 5.3 for AO compatibility
- Use `lua -v` to check your version
- The `setup-lua53.sh` script will verify the correct version

### Module Loading Errors
Some tests require framework modules. Ensure your Lua path includes the project directory:
```bash
export LUA_PATH="./?.lua;./?/init.lua;$LUA_PATH"
```

## Integration Tests

Integration tests are located in the `integration/` directory and test complete workflows across multiple modules.

### Creating New Integration Tests

**IMPORTANT**: Always use the standardized template to avoid recurring setupLuaPath issues:

1. **Copy the template**:
   ```bash
   cp integration/integration-test-template.lua integration/your-feature-integration.test.lua
   ```

2. **Use standardized setup** (REQUIRED):
   ```lua
   -- Use standardized test setup (REQUIRED)
   local TestSetup = require("test-setup")
   local TestFramework = TestSetup.setupLuaPath()
   TestSetup.initializeTestEnvironment()
   ```

3. **Use standardized factories**:
   ```lua
   -- Create Pokemon correctly
   local pokemon = TestSetup.createStandardPokemon({
       name = "Charizard", 
       species = 6,
       types = {TestSetup.TestEnums.PokemonType.FIRE, TestSetup.TestEnums.PokemonType.FLYING},
       side = "enemy",
       hp = 150
   })
   
   -- Create battle state
   local battleState = TestSetup.createStandardBattleState()
   ```

4. **Reference the integration test guide**:
   See `integration/README-INTEGRATION-TESTS.md` for complete guidelines and troubleshooting.

### Running Integration Tests

```bash
# Run all integration tests
./run-integration-tests.sh

# Run specific integration test
cd integration
lua5.3 your-feature-integration.test.lua
```

### GitHub Actions Cache Errors
Occasional cache service failures are GitHub infrastructure issues. The workflow handles these gracefully with fallback to clean builds.