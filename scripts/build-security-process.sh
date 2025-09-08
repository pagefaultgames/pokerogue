#!/bin/bash
# Build Security Process using custom bundler

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔨 Building Security Process${NC}"

# Create build directory if it doesn't exist
mkdir -p build

# Bundle using custom bundler
if scripts/custom-lua-bundler.sh --entrypoint ao-processes/security/main.lua --output build/security-process.lua --workdir ao-processes; then
    echo -e "${GREEN}✅ Security process built successfully${NC}"
    echo "Output: build/security-process.lua"
else
    echo -e "${RED}❌ Failed to build security process${NC}"
    exit 1
fi