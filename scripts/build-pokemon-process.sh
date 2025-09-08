#!/bin/bash
# Build Pokemon Process using custom bundler

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔨 Building Pokemon Process${NC}"

# Create build directory if it doesn't exist
mkdir -p build

# Bundle using custom bundler with size validation and automatic splitting
echo -e "${GREEN}📦 Starting bundle generation...${NC}"
if scripts/custom-lua-bundler.sh --entrypoint ao-processes/pokemon/main.lua --output build/pokemon-process.lua --workdir ao-processes --split --limit 500; then
    echo -e "${GREEN}✅ Pokemon process built successfully${NC}"
    
    # Validate bundle size
    size_bytes=$(wc -c < build/pokemon-process.lua)
    size_kb=$((size_bytes / 1024))
    
    echo "Output: build/pokemon-process.lua (${size_kb}KB)"
    
    # Check for split bundles
    if [[ -f "build/pokemon-process-core.lua" ]]; then
        core_size=$(wc -c < build/pokemon-process-core.lua)
        data_size=$(wc -c < build/pokemon-process-data.lua)
        echo "Split bundles created:"
        echo "  Core: build/pokemon-process-core.lua ($((core_size / 1024))KB)"
        echo "  Data: build/pokemon-process-data.lua ($((data_size / 1024))KB)"
    fi
    
    # Final size validation
    if [[ $size_kb -gt 500 ]] && [[ ! -f "build/pokemon-process-core.lua" ]]; then
        echo -e "${RED}⚠️  WARNING: Bundle exceeds 500KB limit but splitting was not successful${NC}"
        echo "Manual optimization may be required"
    fi
else
    echo -e "${RED}❌ Failed to build pokemon process${NC}"
    exit 1
fi