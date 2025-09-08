#!/bin/bash

# Universal Lua Environment Setup for AO Pokemon Management Tests
# Addresses recurring module path resolution issues

# Set Lua 5.3 as the default command
export LUA_CMD=lua5.3

# Find the ao-processes root directory
AO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Set comprehensive LUA_PATH that covers all module locations
export LUA_PATH="./?.lua;./?/init.lua;${AO_ROOT}/?.lua;${AO_ROOT}/?/init.lua;${AO_ROOT}/game-logic/?.lua;${AO_ROOT}/game-logic/?/init.lua;${AO_ROOT}/game-logic/battle/?.lua;${AO_ROOT}/game-logic/battle/?/init.lua;${AO_ROOT}/game-logic/pokemon/?.lua;${AO_ROOT}/game-logic/pokemon/?/init.lua;${AO_ROOT}/game-logic/rng/?.lua;${AO_ROOT}/game-logic/rng/?/init.lua;${AO_ROOT}/data/?.lua;${AO_ROOT}/data/?/init.lua;${AO_ROOT}/data/abilities/?.lua;${AO_ROOT}/data/abilities/?/init.lua;${AO_ROOT}/data/species/?.lua;${AO_ROOT}/data/species/?/init.lua;${AO_ROOT}/data/moves/?.lua;${AO_ROOT}/data/moves/?/init.lua;${AO_ROOT}/data/constants/?.lua;${AO_ROOT}/data/constants/?/init.lua;${AO_ROOT}/handlers/?.lua;${AO_ROOT}/handlers/?/init.lua;${AO_ROOT}/tests/?.lua;${AO_ROOT}/tests/?/init.lua;${AO_ROOT}/tests/framework/?.lua;${AO_ROOT}/tests/framework/?/init.lua;${AO_ROOT}/tests/unit/?.lua;${AO_ROOT}/tests/unit/?/init.lua;${AO_ROOT}/tests/integration/?.lua;${AO_ROOT}/tests/integration/?/init.lua;;"

# Debug output for troubleshooting
if [[ "$TEST_DEBUG" == "1" ]]; then
    echo "🔧 Lua Environment Setup:"
    echo "   AO_ROOT: $AO_ROOT"
    echo "   LUA_CMD: $LUA_CMD"
    echo "   LUA_PATH configured with comprehensive module paths"
fi

# Export the root for use in other scripts
export AO_ROOT