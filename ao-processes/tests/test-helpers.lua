-- Shared Test Helpers
-- Provides utilities for path resolution in tests

local TestHelpers = {}

-- Setup package path for different execution contexts
function TestHelpers.setupPackagePath()
    local paths = {
        "./?.lua",                                          -- Current directory
        "../?.lua",                                         -- Parent directory
        "../framework/?.lua",                               -- Local development (from unit/ to framework/)
        "../../?.lua",                                      -- Two levels up
        "../../framework/?.lua",                            -- Alternative local path
        "./ao-processes/tests/framework/?.lua",             -- GitHub Actions (from repo root)
        "./ao-processes/?.lua",                             -- Root module path
    }
    
    for _, path in ipairs(paths) do
        if not string.find(package.path, path, 1, true) then
            package.path = package.path .. ";" .. path
        end
    end
end

-- Safe require with better error messaging
function TestHelpers.safeRequire(moduleName)
    -- First, set up package path
    TestHelpers.setupPackagePath()
    
    local possiblePaths = {
        moduleName,                                         -- Original path
        moduleName:gsub("ao%-processes/tests/framework/", ""),  -- Strip framework prefix
        "../framework/" .. moduleName:match("([^/%.]+)$"), -- Local development path
    }
    
    for _, path in ipairs(possiblePaths) do
        local success, result = pcall(require, path)
        if success then
            return result
        end
    end
    
    error("Could not load module: " .. moduleName .. ". Tried paths: " .. table.concat(possiblePaths, ", "))
end

return TestHelpers