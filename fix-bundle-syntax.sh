#!/bin/bash
# Fix bundled Lua file to prevent call stack overflow
# Changes immediate module loading to lazy loading

BUNDLE_FILE="ao-processes/main.bundled.lua"
FIXED_FILE="ao-processes/main.bundled.lua.fixed"

echo "🔧 Fixing bundled Lua file module loading pattern..."

# Replace immediate function calls with lazy loading and fix invalid function names
# Simple approach: replace all hyphens in function names with underscores
cat "$BUNDLE_FILE" | \
    sed 's/_G\.package\.loaded\["\([^"]*\)"\] = _loaded_mod_\([^(]*\)()/-- Lazy load: _G.package.loaded["\1"] = _loaded_mod_\2/g' | \
    perl -pe 's/(function _loaded_mod_[^(]*)-/$1_/g while /(function _loaded_mod_[^(]*)-/' | \
    perl -pe 's/(_loaded_mod_[^(]*)-/$1_/g while /(_loaded_mod_[^(]*)-/' \
    > "$FIXED_FILE.temp"

# Add lazy loading mechanism at the end
cat >> "$FIXED_FILE.temp" << 'EOF'

-- Lazy Module Loading System
-- Load modules only when required to prevent call stack overflow
local function lazy_require(module_name)
    local loader_name = module_name:gsub("[.-]", "_")
    local loader_func_name = "_loaded_mod_" .. loader_name
    
    if _G[loader_func_name] then
        if not _G.package.loaded[module_name] then
            _G.package.loaded[module_name] = _G[loader_func_name]()
        end
        return _G.package.loaded[module_name]
    else
        error("Module not found: " .. module_name)
    end
end

-- Override require function for AO environment
local original_require = require
require = function(module_name)
    return lazy_require(module_name)
end

EOF

mv "$FIXED_FILE.temp" "$FIXED_FILE"

echo "✅ Fixed bundled file created: $FIXED_FILE"
echo "📊 Original size: $(wc -c < "$BUNDLE_FILE") bytes"
echo "📊 Fixed size: $(wc -c < "$FIXED_FILE") bytes"