-- Side Effects Integration Tests
-- This file redirects to the aolite-compatible version to ensure CI compatibility
-- The original complex version had module loading issues in CI environments

print("🔀 Redirecting to aolite-compatible side effects integration tests...")

-- Load and execute the aolite-compatible version
local currentDir = debug.getinfo(1, "S").source:match("@?(.*/)") or ""
local aoliteTestPath = currentDir .. "side-effects-integration-aolite.test.lua"

-- Execute the aolite-compatible test file
local success, err = pcall(dofile, aoliteTestPath)

if not success then
    error("Failed to run aolite-compatible side effects integration test: " .. tostring(err))
end

print("✅ Side effects integration tests completed via aolite-compatible version")