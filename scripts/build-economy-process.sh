#!/bin/bash
# Build Economy Process using custom bundler

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔨 Building Economy Process${NC}"

# Create build directory if it doesn't exist
mkdir -p build

# Bundle using custom bundler
if scripts/custom-lua-bundler.sh --entrypoint ao-processes/economy/main.lua --output build/economy-process.lua --workdir ao-processes; then
    echo -e "${GREEN}✅ Economy process built successfully${NC}"
    echo "Output: build/economy-process.lua"
else
    echo -e "${RED}❌ Failed to build economy process${NC}"
    exit 1
fi