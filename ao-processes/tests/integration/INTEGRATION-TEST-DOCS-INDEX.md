# Integration Test Documentation Index

This document provides an index of all integration testing documentation to ensure developers can quickly find the information they need.

## 🚨 Quick Start (TL;DR)

**For new integration tests, always:**
```bash
cp integration-test-template.lua your-feature-integration.test.lua
```

Then use:
```lua  
local TestSetup = require("test-setup")
local TestFramework = TestSetup.setupLuaPath()
TestSetup.initializeTestEnvironment()
```

This prevents the recurring setupLuaPath issues.

## 📚 Documentation Locations

### Primary Documentation
1. **[README-INTEGRATION-TESTS.md](./README-INTEGRATION-TESTS.md)** 
   - Complete guide to the standardized integration test approach
   - Problem explanation and solution details
   - Migration guide for existing tests
   - **START HERE** for full understanding

2. **[integration-test-template.lua](./integration-test-template.lua)**
   - Template file to copy for all new integration tests
   - Shows proper structure and setup
   - **COPY THIS** for new tests

3. **[test-setup.lua](./test-setup.lua)**
   - Standardized setup module used by all tests
   - Handles path configuration and common utilities
   - **IMPORTED BY** all integration tests

### Supporting Documentation  
4. **[../README.md](../README.md)**
   - Updated with integration test section
   - Quick reference for running tests
   - Links to detailed guides

5. **[../../../architecture/testing-strategy.md](../../../architecture/testing-strategy.md)**
   - High-level testing architecture
   - Updated with standardized integration test approach
   - Context for overall testing strategy

6. **[../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)**
   - Developer contribution guide
   - Updated with AO process testing section
   - **MOST DISCOVERABLE** location for contributors

## 🎯 Problem Solved

**Before**: Integration tests for new stories consistently failed with:
- Module path errors (`setupLuaPath` issues)  
- Species field access errors (`attempt to index number`)
- CI/GitHub failures

**After**: Standardized approach eliminates these issues:
- Robust multi-environment path configuration
- Consistent Pokemon data structures  
- CI-compatible setup

## 📋 Developer Checklist

For any new integration test:

- [ ] Copy `integration-test-template.lua`
- [ ] Use `TestSetup.setupLuaPath()` for path configuration
- [ ] Use `TestSetup.createStandardPokemon()` for Pokemon creation
- [ ] Use `TestSetup.createStandardBattleState()` for battle states
- [ ] Use `TestSetup.TestEnums` for consistent enum values
- [ ] Test locally before pushing
- [ ] Verify CI passes on GitHub

## 🔍 Finding Documentation

**If you're looking for:**
- Quick start → This document (TL;DR section)
- Complete guide → [README-INTEGRATION-TESTS.md](./README-INTEGRATION-TESTS.md)
- Template to copy → [integration-test-template.lua](./integration-test-template.lua)  
- How to contribute → [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)
- Architecture context → [../../../architecture/testing-strategy.md](../../../architecture/testing-strategy.md)

## ✅ Documentation Status

All key documentation has been updated with the standardized integration test approach:

- ✅ Problem-specific guide created
- ✅ Template and setup module implemented  
- ✅ Main tests README updated
- ✅ Architecture documentation updated
- ✅ Contributing guide updated
- ✅ This index document created

The setupLuaPath issues should no longer recur when implementing new stories.