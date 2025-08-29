# Integration Tests Setup Guide

## Problem Statement

Integration tests for new stories keep having `setupLuaPath()` issues when pushed to GitHub. This is because different tests have inconsistent module path configurations, leading to failures in CI environments.

## Root Cause

The issue occurs because:
1. Different integration tests use different path setup patterns
2. Some tests have `setupLuaPath()` functions, others don't
3. Path configurations are hardcoded and don't adapt well to different execution environments
4. Pokemon data structures are inconsistent between tests

## Solution

### 1. Use Standardized Test Setup (REQUIRED for all new tests)

All new integration tests MUST use the standardized test setup:

```lua
-- Use standardized test setup (REQUIRED)
local TestSetup = require("test-setup")
local TestFramework = TestSetup.setupLuaPath()
TestSetup.initializeTestEnvironment()
```

### 2. Use Standard Factories

Instead of creating custom Pokemon and battle state objects, use the standardized factories:

```lua
-- Use standardized test utilities
local createBattleState = TestSetup.createStandardBattleState
local createPokemon = TestSetup.createStandardPokemon
local TestEnums = TestSetup.TestEnums

-- Create Pokemon correctly
local pokemon = createPokemon({
    name = "Charizard", 
    species = 6,
    level = 50,
    types = {TestEnums.PokemonType.FIRE, TestEnums.PokemonType.FLYING},
    side = "enemy",
    hp = 150
})
```

### 3. Copy the Template

For new integration tests, copy `integration-test-template.lua` and fill in your specific test logic. This ensures consistent structure.

## Files Provided

1. **`test-setup.lua`** - Standardized setup module that handles all path configuration
2. **`integration-test-template.lua`** - Template for new integration tests
3. **This README** - Documentation and guidelines

## Benefits

- **Eliminates recurring setupLuaPath issues** - All tests use the same robust path setup
- **Consistent Pokemon data structure** - No more species field access errors
- **Automatic RNG initialization** - Tests don't fail due to uninitialized RNG
- **Standard test utilities** - Reduces boilerplate code
- **CI-compatible** - Works in GitHub Actions and local environments

## Migration for Existing Tests

To fix existing integration tests:

1. Replace the custom `setupLuaPath()` function with:
   ```lua
   local TestSetup = require("test-setup")
   local TestFramework = TestSetup.setupLuaPath()
   TestSetup.initializeTestEnvironment()
   ```

2. Replace custom Pokemon creation with `TestSetup.createStandardPokemon()`

3. Replace custom battle state creation with `TestSetup.createStandardBattleState()`

4. Use `TestSetup.TestEnums` for consistent enum values

## Example Fix

**Before (problematic):**
```lua
local function setupLuaPath()
    -- Custom path setup that might not work in CI...
end

local pokemon = {
    species = 1,  -- This causes "attempt to index number" errors
    -- ...
}
```

**After (standardized):**
```lua
local TestSetup = require("test-setup")
local TestFramework = TestSetup.setupLuaPath()

local pokemon = TestSetup.createStandardPokemon({
    species = 1,
    types = {TestSetup.TestEnums.PokemonType.NORMAL}
})
```

## Checklist for New Integration Tests

- [ ] Copy `integration-test-template.lua` as starting point
- [ ] Use `require("test-setup")` for path configuration
- [ ] Use standardized Pokemon and battle state factories
- [ ] Use `TestSetup.TestEnums` for consistent enum values
- [ ] Test locally before pushing
- [ ] Verify CI passes on GitHub

Following these guidelines will prevent the recurring setupLuaPath issues that have been plaguing story implementations.