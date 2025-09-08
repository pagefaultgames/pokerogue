#!/bin/bash
# Build Admin Process using custom bundler

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔨 Building Admin Process${NC}"

# Create build directory if it doesn't exist
mkdir -p build

# Bundle using custom bundler
if scripts/custom-lua-bundler.sh --entrypoint ao-processes/admin/main.lua --output build/admin-process.lua --workdir ao-processes; then
    echo -e "${GREEN}✅ Admin process built successfully${NC}"
    echo "Output: build/admin-process.lua"
else
    echo -e "${RED}❌ Failed to build admin process${NC}"
    exit 1
fi