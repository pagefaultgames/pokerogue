#!/usr/bin/env lua
-- Simple test runner for AO processes
-- Executes all unit and integration tests

local function runTest(testFile, testName)
    print("\n=== Running " .. testName .. " ===")
    local success, err = pcall(function()
        dofile(testFile)
    end)
    
    if success then
        print("✅ " .. testName .. " PASSED")
        return true
    else
        print("❌ " .. testName .. " FAILED: " .. tostring(err))
        return false
    end
end

-- Test configuration
local tests = {
    {file = "tests/unit/battle/side-effects.test.lua", name = "Side Effects Unit Tests"},
    {file = "tests/unit/battle/field-conditions-aolite.test.lua", name = "Field Conditions Unit Tests (Aolite)"},
    {file = "tests/unit/battle/positional-mechanics.test.lua", name = "Positional Mechanics Unit Tests"},
    {file = "tests/unit/battle/move-targeting.test.lua", name = "Move Targeting Unit Tests"},
    {file = "tests/unit/battle/damage-calculator.test.lua", name = "Damage Calculator Unit Tests (Extended)"},
    {file = "tests/integration/aolite-integration.test.lua", name = "Aolite Integration Tests"},
    {file = "tests/integration/side-effects-integration-aolite.test.lua", name = "Side Effects Integration Tests (Aolite)"},
    {file = "tests/integration/field-conditions-integration-aolite.test.lua", name = "Field Conditions Integration Tests (Aolite)"},
    {file = "tests/integration/positional-integration.test.lua", name = "Positional Integration Tests"}
}

print("AO Process Test Runner")
print("=====================")

local passed = 0
local total = 0

-- Run tests
for _, test in ipairs(tests) do
    total = total + 1
    if runTest(test.file, test.name) then
        passed = passed + 1
    end
end

-- Summary
print("\n=== Test Summary ===")
print(string.format("Tests passed: %d/%d", passed, total))

if passed == total then
    print("🎉 All tests passed!")
    os.exit(0)
else
    print("💥 Some tests failed!")
    os.exit(1)
end