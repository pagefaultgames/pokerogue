-- Script to patch the full bundle with safe handler registration

print("🔧 Patching full bundle with safe handler registration...")

-- Read the full bundle
local bundle_file = "ao-processes/main.bundled.lua"
local file = io.open(bundle_file, "r")
if not file then
    print("❌ Could not open bundle file")
    os.exit(1)
end

local content = file:read("*all")
file:close()

print("📄 Original bundle size: " .. #content .. " bytes")

-- Add safe handler registration at the beginning
local safe_handler_code = [[

-- =================================================
-- SAFE HANDLER REGISTRATION FOR AO COMPATIBILITY
-- =================================================

-- Safe handler registration that won't crash in AO
local function safe_add_handler(name, pattern, handler_func)
    if not Handlers or not Handlers.add then
        print("⚠️  Handlers not available for: " .. name)
        return
    end
    
    local success, err = pcall(function()
        local matcher
        if type(pattern) == "string" then
            -- Simple string pattern matching
            matcher = function(msg)
                return msg.Action == pattern
            end
        elseif type(pattern) == "function" then
            -- Function-based pattern matching  
            matcher = pattern
        else
            -- Fallback: match by name
            matcher = function(msg)
                return msg.Action == name
            end
        end
        
        Handlers.add(name, matcher, handler_func)
    end)
    
    if success then
        print("✅ Handler registered: " .. name)
    else
        print("⚠️  Failed to register " .. name .. ": " .. tostring(err))
    end
end

-- Mock Handlers.utils if not available
if Handlers and not Handlers.utils then
    Handlers.utils = {
        hasMatchingTag = function(tag, value)
            return function(msg)
                return msg.Tags and msg.Tags[tag] == value
            end
        end,
        reply = function(data)
            return function(msg)
                if ao and ao.send then
                    ao.send({
                        Target = msg.From,
                        Data = data
                    })
                end
            end
        end
    }
end

]]

-- Insert safe handler code after the first few lines
local lines = {}
for line in content:gmatch("[^\r\n]+") do
    table.insert(lines, line)
end

-- Insert after the first module comment (around line 5)
table.insert(lines, 6, safe_handler_code)

-- Now replace all Handlers.add calls with safe_add_handler calls
local patched_content = table.concat(lines, "\n")

-- Replace the unsafe handler registrations
patched_content = patched_content:gsub(
    "Handlers%.add%(\n%s*([^,]+),%s*\n%s*Handlers%.utils%.hasMatchingTag%(([^)]+)%),%s*\n%s*function%(([^)]+)%)\n",
    "safe_add_handler(%1, function(msg) return msg.Tags and msg.Tags[%2] end, function(%3)\n"
)

-- Simpler pattern for other Handlers.add calls
patched_content = patched_content:gsub(
    "Handlers%.add%(",
    "safe_add_handler("
)

-- Write patched bundle
local output_file = io.open(bundle_file, "w")
if not output_file then
    print("❌ Could not write patched bundle")
    os.exit(1)
end

output_file:write(patched_content)
output_file:close()

print("📄 Patched bundle size: " .. #patched_content .. " bytes")
print("✅ Full bundle patched with safe handler registration!")
print("🚀 Ready for AO deployment: " .. bundle_file)