#!/bin/bash

# Setup script for Lua 5.3 environment
# This ensures both local and CI environments use Lua 5.3

echo "🔧 Setting up Lua 5.3 environment..."

# Function to check Lua version
check_lua_version() {
    local cmd=$1
    if command -v $cmd >/dev/null 2>&1; then
        local version=$($cmd -v 2>&1 | head -1)
        if [[ "$version" =~ "Lua 5.3" ]]; then
            echo "✅ Found Lua 5.3: $cmd"
            echo "export LUA_CMD=$cmd" >> lua_env.sh
            return 0
        else
            echo "⚠️ $cmd is not Lua 5.3: $version"
            return 1
        fi
    else
        return 1
    fi
}

# Check for Lua 5.3 in various forms
if check_lua_version "lua5.3"; then
    LUA_CMD="lua5.3"
elif check_lua_version "lua"; then
    LUA_CMD="lua"
elif check_lua_version "$HOME/.local/bin/lua5.3"; then
    LUA_CMD="$HOME/.local/bin/lua5.3"
elif check_lua_version "$HOME/.local/bin/lua"; then
    LUA_CMD="$HOME/.local/bin/lua"
else
    echo "❌ Lua 5.3 not found!"
    echo "Please install Lua 5.3:"
    echo "  macOS: Build from source or use luaver"
    echo "  Ubuntu: apt-get install lua5.3"
    echo "  Other: Download from https://www.lua.org/ftp/lua-5.3.6.tar.gz"
    exit 1
fi

echo "Using Lua command: $LUA_CMD"
$LUA_CMD -v

# Export for use in tests
export LUA_CMD

# Create a convenience wrapper if needed
if [ "$LUA_CMD" != "lua5.3" ] && [ ! -f "./lua5.3" ]; then
    echo "#!/bin/bash" > ./lua5.3
    echo "exec $LUA_CMD \"\$@\"" >> ./lua5.3
    chmod +x ./lua5.3
    echo "✅ Created lua5.3 wrapper script"
fi

echo "✅ Lua 5.3 environment ready!"
echo ""
echo "To run tests:"
echo "  $LUA_CMD main.test.lua"
echo "  ./lua5.3 main.test.lua  # if wrapper created"