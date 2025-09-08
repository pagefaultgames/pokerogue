#!/bin/bash
# Build Coordinator Process using custom bundler

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔨 Building Coordinator Process${NC}"

# Create build directory if it doesn't exist
mkdir -p build

# Bundle using custom bundler
if scripts/custom-lua-bundler.sh --entrypoint ao-processes/coordinator/main.lua --output build/coordinator-process.lua --workdir ao-processes; then
    echo -e "${GREEN}✅ Coordinator process built successfully${NC}"
    echo "Output: build/coordinator-process.lua"
else
    echo -e "${RED}❌ Failed to build coordinator process${NC}"
    exit 1
fi