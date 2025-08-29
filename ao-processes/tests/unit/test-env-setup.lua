-- Universal Test Environment Setup for AO Pokemon Management System
-- Addresses recurring module path resolution issues across all test types
-- Usage: require('test-env-setup') at the top of any test file

local TestEnvSetup = {}

-- Get the absolute path to the ao-processes directory
local function getAOProcessesRoot()
    -- Try different methods to find the ao-processes root
    local currentFile = debug.getinfo(1, "S").source:sub(2) -- Remove '@' prefix
    local currentDir = currentFile:match("(.*/)")
    
    -- Navigate up to find ao-processes directory
    local root = currentDir
    while root and not root:match("/ao%-processes/?$") do
        root = root:match("(.*/)[^/]+/$")
    end
    
    if root then
        return root:gsub("/$", "") -- Remove trailing slash
    end
    
    -- Fallback: assume we're running from tests directory
    return currentDir and (currentDir .. "..") or ".."
end

-- Set up comprehensive LUA_PATH for all module types
function TestEnvSetup.setupPaths()
    local aoRoot = getAOProcessesRoot()
    
    -- Define all possible module paths relative to ao-processes root
    local paths = {
        -- Current directory (for test files)
        "./?.lua",
        "./?/init.lua",
        
        -- Direct ao-processes paths
        aoRoot .. "/?.lua",
        aoRoot .. "/?/init.lua",
        
        -- Game logic modules
        aoRoot .. "/game-logic/?.lua",
        aoRoot .. "/game-logic/?/init.lua",
        aoRoot .. "/game-logic/battle/?.lua",
        aoRoot .. "/game-logic/battle/?/init.lua",
        aoRoot .. "/game-logic/pokemon/?.lua", 
        aoRoot .. "/game-logic/pokemon/?/init.lua",
        aoRoot .. "/game-logic/rng/?.lua",
        aoRoot .. "/game-logic/rng/?/init.lua",
        
        -- Data modules
        aoRoot .. "/data/?.lua",
        aoRoot .. "/data/?/init.lua",
        aoRoot .. "/data/abilities/?.lua",
        aoRoot .. "/data/abilities/?/init.lua",
        aoRoot .. "/data/species/?.lua",
        aoRoot .. "/data/species/?/init.lua",
        aoRoot .. "/data/moves/?.lua",
        aoRoot .. "/data/moves/?/init.lua",
        aoRoot .. "/data/constants/?.lua",
        aoRoot .. "/data/constants/?/init.lua",
        
        -- Handler modules
        aoRoot .. "/handlers/?.lua",
        aoRoot .. "/handlers/?/init.lua",
        
        -- Test framework modules
        aoRoot .. "/tests/?.lua",
        aoRoot .. "/tests/?/init.lua",
        aoRoot .. "/tests/framework/?.lua",
        aoRoot .. "/tests/framework/?/init.lua",
        aoRoot .. "/tests/unit/?.lua",
        aoRoot .. "/tests/unit/?/init.lua",
        aoRoot .. "/tests/integration/?.lua",
        aoRoot .. "/tests/integration/?/init.lua",
    }
    
    -- Set the comprehensive LUA_PATH
    package.path = table.concat(paths, ";") .. ";" .. (package.path or "")
    
    -- Debug output (can be disabled in production)
    if os.getenv("TEST_DEBUG") then
        print("🔧 Test Environment Setup:")
        print("   AO Root: " .. aoRoot)
        print("   LUA_PATH configured with " .. #paths .. " search paths")
    end
end

-- Smart require function that tries multiple module path variations
function TestEnvSetup.smartRequire(moduleName)
    -- Try the module name as-is first
    local success, result = pcall(require, moduleName)
    if success then
        return result
    end
    
    -- Try common variations
    local variations = {
        moduleName,
        moduleName:gsub("-", "_"), -- Replace hyphens with underscores
        moduleName:gsub("%.", "/"), -- Replace dots with forward slashes for path-based requires
        "game-logic." .. moduleName,
        "game-logic.battle." .. moduleName:match("([^%.]+)$"),
        "game-logic.pokemon." .. moduleName:match("([^%.]+)$"),
        "data." .. moduleName,
    }
    
    for _, variation in ipairs(variations) do
        success, result = pcall(require, variation)
        if success then
            if os.getenv("TEST_DEBUG") then
                print("📦 Successfully loaded '" .. moduleName .. "' as '" .. variation .. "'")
            end
            return result
        end
    end
    
    -- If all variations fail, provide helpful error message
    error("❌ Failed to require '" .. moduleName .. "'. Tried variations: " .. table.concat(variations, ", "))
end

-- Initialize the test environment
TestEnvSetup.setupPaths()

-- Global helper for tests
_G.smartRequire = TestEnvSetup.smartRequire

-- Return module for direct usage
return TestEnvSetup