#!/bin/bash
# Build all multi-process components
# Creates deployable Lua files for each process in the multi-process architecture

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AO_DIR="ao-processes"
BUILD_DIR="build"

echo -e "${GREEN}🔨 Building Multi-Process Architecture${NC}"
echo "======================================"
echo ""

# Create build directory
mkdir -p "$BUILD_DIR"

# Define processes to build
PROCESSES=(
    "coordinator"
    "battle" 
    "pokemon"
    "economy"
    "security"
    "admin"
)

BUILD_SUCCESS=0
BUILD_FAILED=()

echo -e "${BLUE}📋 Building ${#PROCESSES[@]} processes...${NC}"
echo ""

# Build each process
for process in "${PROCESSES[@]}"; do
    echo -e "${YELLOW}🔨 Building $process process...${NC}"
    
    if [[ -f "scripts/build-${process}-process.sh" ]]; then
        if ./scripts/build-${process}-process.sh; then
            echo -e "${GREEN}✅ $process process built successfully${NC}"
            ((BUILD_SUCCESS++))
        else
            echo -e "${RED}❌ Failed to build $process process${NC}"
            BUILD_FAILED+=("$process")
        fi
    else
        echo -e "${YELLOW}⚠️  No build script found for $process process${NC}"
        echo "   Expected: scripts/build-${process}-process.sh"
        BUILD_FAILED+=("$process")
    fi
    echo ""
done

# Create multi-process deployment manifest
cat > "$BUILD_DIR/multi-process-manifest.json" << EOF
{
    "build_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "architecture": "multi-process",
    "processes": [
$(for process in "${PROCESSES[@]}"; do
    if [[ -f "$BUILD_DIR/${process}-process.lua" ]]; then
        echo "        {"
        echo "            \"name\": \"$process\","
        echo "            \"file\": \"${process}-process.lua\","
        echo "            \"size_bytes\": $(wc -c < "$BUILD_DIR/${process}-process.lua"),"
        echo "            \"status\": \"built\""
        echo "        },"
    else
        echo "        {"
        echo "            \"name\": \"$process\","
        echo "            \"file\": \"${process}-process.lua\","
        echo "            \"size_bytes\": 0,"
        echo "            \"status\": \"failed\""
        echo "        },"
    fi
done | sed '$s/,$//')
    ],
    "total_processes": ${#PROCESSES[@]},
    "successful_builds": $BUILD_SUCCESS,
    "failed_builds": ${#BUILD_FAILED[@]}
}
EOF

# Display build summary
echo ""
echo -e "${GREEN}🎉 Multi-Process Build Complete!${NC}"
echo "=================================="
echo -e "${GREEN}✅ Successful builds: $BUILD_SUCCESS/${#PROCESSES[@]}${NC}"

if [[ ${#BUILD_FAILED[@]} -gt 0 ]]; then
    echo -e "${RED}❌ Failed builds: ${#BUILD_FAILED[@]}${NC}"
    echo -e "${RED}   Failed processes: ${BUILD_FAILED[*]}${NC}"
fi

echo ""
echo -e "${BLUE}📁 Build artifacts:${NC}"
for process in "${PROCESSES[@]}"; do
    if [[ -f "$BUILD_DIR/${process}-process.lua" ]]; then
        echo -e "${GREEN}   ✅ $BUILD_DIR/${process}-process.lua${NC}"
    else
        echo -e "${RED}   ❌ $BUILD_DIR/${process}-process.lua${NC}"
    fi
done

echo ""
echo -e "${BLUE}📋 Deployment manifest: $BUILD_DIR/multi-process-manifest.json${NC}"
echo ""

if [[ ${#BUILD_FAILED[@]} -gt 0 ]]; then
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "1. Fix failed process builds"
    echo "2. Re-run this script"
    echo "3. Deploy using: ./scripts/deploy-multi-process.sh"
    echo ""
    exit 1
else
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "1. Review build artifacts in: $BUILD_DIR/"
    echo "2. Deploy using: ./scripts/deploy-multi-process.sh"
    echo ""
    echo -e "${GREEN}All processes built successfully! 🚀${NC}"
fi