#!/bin/bash
# Development build script for multi-process architecture
# Builds only specified processes with development features enabled

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="build/dev"
WATCH_MODE=false
VERBOSE=false
PROCESSES_TO_BUILD=()

# Available processes
ALL_PROCESSES=("coordinator" "battle" "pokemon" "economy" "security" "admin")

# Parse command line arguments
show_help() {
    echo "Usage: $0 [OPTIONS] [PROCESSES...]"
    echo ""
    echo "Build specific processes for development"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help     Show this help message"
    echo "  -w, --watch    Watch for file changes and rebuild"
    echo "  -v, --verbose  Enable verbose output"
    echo "  -a, --all      Build all processes"
    echo ""
    echo "PROCESSES:"
    echo "  Available: ${ALL_PROCESSES[*]}"
    echo ""
    echo "Examples:"
    echo "  $0 coordinator battle          # Build coordinator and battle processes"
    echo "  $0 --all                       # Build all processes"
    echo "  $0 --watch coordinator         # Build coordinator and watch for changes"
    echo ""
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -w|--watch)
            WATCH_MODE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -a|--all)
            PROCESSES_TO_BUILD=("${ALL_PROCESSES[@]}")
            shift
            ;;
        -*)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
        *)
            # Check if it's a valid process name
            if [[ " ${ALL_PROCESSES[*]} " =~ " $1 " ]]; then
                PROCESSES_TO_BUILD+=("$1")
            else
                echo -e "${RED}Invalid process: $1${NC}"
                echo -e "${YELLOW}Available processes: ${ALL_PROCESSES[*]}${NC}"
                exit 1
            fi
            shift
            ;;
    esac
done

# If no processes specified, show help
if [[ ${#PROCESSES_TO_BUILD[@]} -eq 0 ]]; then
    echo -e "${RED}No processes specified${NC}"
    echo ""
    show_help
    exit 1
fi

echo -e "${GREEN}🔨 Multi-Process Development Build${NC}"
echo "=================================="
echo -e "${BLUE}Building processes: ${PROCESSES_TO_BUILD[*]}${NC}"
echo -e "${BLUE}Watch mode: ${WATCH_MODE}${NC}"
echo -e "${BLUE}Verbose: ${VERBOSE}${NC}"
echo ""

# Create development build directory
mkdir -p "$BUILD_DIR"

build_process() {
    local process=$1
    echo -e "${YELLOW}🔨 Building $process process...${NC}"
    
    if [[ -f "scripts/build-${process}-process.sh" ]]; then
        # Set environment variables for development build
        export DEV_BUILD=true
        export BUILD_DIR="$BUILD_DIR"
        
        if [[ "$VERBOSE" == "true" ]]; then
            if ./scripts/build-${process}-process.sh; then
                echo -e "${GREEN}✅ $process process built successfully${NC}"
                return 0
            else
                echo -e "${RED}❌ Failed to build $process process${NC}"
                return 1
            fi
        else
            if ./scripts/build-${process}-process.sh > /dev/null 2>&1; then
                echo -e "${GREEN}✅ $process process built successfully${NC}"
                return 0
            else
                echo -e "${RED}❌ Failed to build $process process${NC}"
                if [[ "$VERBOSE" == "true" ]]; then
                    echo "Re-running with verbose output for debugging..."
                    ./scripts/build-${process}-process.sh
                fi
                return 1
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  No build script found for $process process${NC}"
        echo "   Expected: scripts/build-${process}-process.sh"
        return 1
    fi
}

build_all_processes() {
    local build_success=0
    local build_failed=()
    
    for process in "${PROCESSES_TO_BUILD[@]}"; do
        if build_process "$process"; then
            ((build_success++))
        else
            build_failed+=("$process")
        fi
        echo ""
    done
    
    # Create development manifest
    cat > "$BUILD_DIR/dev-manifest.json" << EOF
{
    "build_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "build_type": "development",
    "watch_mode": $WATCH_MODE,
    "processes_requested": [$(printf '"%s",' "${PROCESSES_TO_BUILD[@]}" | sed 's/,$//')],
    "successful_builds": $build_success,
    "failed_builds": ${#build_failed[@]},
    "failed_processes": [$(printf '"%s",' "${build_failed[@]}" | sed 's/,$//')]
}
EOF
    
    echo -e "${GREEN}🎉 Development Build Summary${NC}"
    echo "============================"
    echo -e "${GREEN}✅ Successful: $build_success/${#PROCESSES_TO_BUILD[@]}${NC}"
    
    if [[ ${#build_failed[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Failed: ${build_failed[*]}${NC}"
        return 1
    fi
    
    return 0
}

if [[ "$WATCH_MODE" == "true" ]]; then
    echo -e "${BLUE}👀 Watch mode enabled - monitoring for file changes...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    
    # Initial build
    build_all_processes
    
    # Watch for changes (requires fswatch or inotify-tools)
    if command -v fswatch > /dev/null; then
        while true; do
            # Watch for changes in ao-processes directory
            fswatch -1 ao-processes/ scripts/build-*-process.sh > /dev/null 2>&1
            echo ""
            echo -e "${BLUE}🔄 File changes detected, rebuilding...${NC}"
            build_all_processes
        done
    else
        echo -e "${YELLOW}⚠️  fswatch not installed, falling back to manual rebuild${NC}"
        echo -e "${YELLOW}Install fswatch for automatic file watching${NC}"
        build_all_processes
    fi
else
    build_all_processes
fi